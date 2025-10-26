import { streamText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getClimateData, formatClimateDataForAgent } from "@/lib/open-meteo"
import type { ClimateData } from "@/lib/open-meteo"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { location, priorities, userPrompt, years_in_future } = await req.json()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Fetch real climate data
        let climateDataText = ""
        let climateData: ClimateData | null = null
        try {
          climateData = await getClimateData(location.lat, location.lng)
          climateDataText = formatClimateDataForAgent(climateData)
        } catch (error) {
          console.error("Failed to fetch climate data:", error)
          climateDataText = "Climate data unavailable. Provide general analysis based on geographic location."
        }

        const contextPrefix = userPrompt ? `\n\nUser's Specific Concerns: ${userPrompt}` : ""
        const timeHorizon = years_in_future || 10
        const climateGuidance = climateData
          ? `
CLIMATE CONTEXT:
- Zone: ${climateData.context.climate_zone}
- Seasonal Pattern: ${climateData.context.seasonal_pattern}
- Typical Hazards to Prioritize: ${climateData.context.typical_hazards.join(", ")}
- Heatwave Likelihood: ${climateData.context.heatwave_risk.toUpperCase()}
- Cold Extreme Likelihood: ${climateData.context.cold_extreme_risk.toUpperCase()}
`.trim()
          : ""

        // Send initial message
        const startMessage = {
          role: "system",
          content: `Starting AI-powered climate risk assessment for ${location.name} over ${timeHorizon} years...`,
        }
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(startMessage)}\n\n`))
        await new Promise((resolve) => setTimeout(resolve, 300))

        // METEOROLOGIST AGENT - Climate analysis
        const meteorologistPrompt = `You are an expert meteorologist analyzing climate data for ${location.name} (${location.lat}°${location.lat >= 0 ? "N" : "S"}, ${location.lng}°${location.lng >= 0 ? "E" : "W"}) over the next ${timeHorizon} years.

REAL CLIMATE DATA:
${climateDataText}
${climateGuidance ? `\n${climateGuidance}` : ""}${contextPrefix}

Provide a detailed analysis (3-4 sentences) covering:
1. Current climate conditions and notable patterns
2. Specific extreme weather events likely to increase (heat waves, hurricanes, floods, droughts, wildfires, etc.)
3. Temperature and precipitation trend projections for ${timeHorizon} years
4. Which climate hazards pose the greatest threat

Important constraints:
- Align hazards with the climate context and risk guidance. If heatwave likelihood is LOW or VERY LOW, do not claim high risk of extreme heat.
- Prioritize hazards listed in the typical hazards guidance when relevant.
- Respond using plain text sentences without Markdown headings or bullet symbols. Use newline-separated sentences only.`

        let meteorologistOutput = ""
        let hazardAnalystOutput = ""
        let hazardList: string[] = []
        try {
          const meteorologistResult = await streamText({
            model: openai("gpt-4o-mini"),
            prompt: meteorologistPrompt,
            maxOutputTokens: 400,
          })

          for await (const chunk of meteorologistResult.textStream) {
            meteorologistOutput += chunk
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            role: "meteorologist",
            content: meteorologistOutput
          })}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error("Meteorologist error:", error)
        }

        // HAZARD ANALYST AGENT - Focused hazard synthesis
        const hazardPrompt = `You are a climate hazard specialist identifying the most probable threats for ${location.name} over the next ${timeHorizon} years.

CLIMATE DATA AND METEOROLOGIST INSIGHT:
${climateDataText}
${climateGuidance ? `\n${climateGuidance}` : ""}
METEOROLOGIST SUMMARY:
${meteorologistOutput}

Allowed hazard categories: Wildfires, Extreme Heat, Flooding, Air Pollution, Storm, Drought.

Choose the top two hazard categories that present the greatest long-term risk. Respond in plain text using the exact format:
Hazards: Hazard One; Hazard Two
Justification: (two concise sentences explaining the selection)

Never include categories outside the allowed list and never add bullet points.`

        try {
          const hazardResult = await streamText({
            model: openai("gpt-4o-mini"),
            prompt: hazardPrompt,
            maxOutputTokens: 250,
          })

          for await (const chunk of hazardResult.textStream) {
            hazardAnalystOutput += chunk
          }

          hazardList = parseHazardAgentOutput(hazardAnalystOutput)

          if (hazardAnalystOutput.trim()) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              role: "hazard-analyst",
              content: hazardAnalystOutput
            })}\n\n`))
            await new Promise((resolve) => setTimeout(resolve, 400))
          }
        } catch (error) {
          console.error("Hazard analyst error:", error)
        }

        // ECONOMIST AGENT - Economic impact analysis
        const economistPrompt = `You are an economist specializing in climate economics, analyzing financial impacts for ${location.name} over ${timeHorizon} years.

CLIMATE CONTEXT FROM METEOROLOGIST:
${meteorologistOutput}

HAZARD ANALYST INSIGHT:
${hazardAnalystOutput}

REAL CLIMATE DATA:
${climateDataText}
${climateGuidance ? `\n${climateGuidance}` : ""}${contextPrefix}

Provide economic analysis (3-4 sentences) including:
1. Estimated annual economic losses per capita from climate events (give a specific dollar amount)
2. Infrastructure damage costs and adaptation expenses
3. Impact on property values, insurance costs, and employment
4. Total adaptation costs needed over ${timeHorizon} years

Important constraints:
- Ensure economic impacts reflect the hazards that are credible for the climate context (e.g., avoid heatwave-driven losses when heatwave likelihood is LOW).
- Provide concrete dollar estimates where possible.
- Respond using plain text sentences without Markdown headings or bullet symbols.`

        let economistOutput = ""
        try {
          const economistResult = await streamText({
            model: openai("gpt-4o-mini"),
            prompt: economistPrompt,
            maxOutputTokens: 400,
          })

          for await (const chunk of economistResult.textStream) {
            economistOutput += chunk
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            role: "economist",
            content: economistOutput
          })}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error("Economist error:", error)
        }

        // PLANNER AGENT - Final risk assessment with numerical scores
        const plannerPrompt = `You are a climate risk assessment expert providing a final livability analysis for ${location.name} over ${timeHorizon} years.

METEOROLOGIST ANALYSIS:
${meteorologistOutput}

HAZARD ANALYST FINDINGS:
${hazardAnalystOutput}

ECONOMIST ANALYSIS:
${economistOutput}

REAL CLIMATE DATA AND CONTEXT:
${climateDataText}
${climateGuidance ? `\n${climateGuidance}` : ""}

PRIORITY WEIGHTS:
- Environmental: ${priorities.environmental}%
- Economic: ${priorities.economic}%
- Social: ${priorities.social}%

YOUR TASK:
Synthesize the analyses above and provide:

1. **Environmental Risk Score: [NUMBER]/100** (0=perfectly safe, 100=catastrophic)
2. **Economic Risk Score: [NUMBER]/100** (0=no financial impact, 100=economic collapse)
3. **Social Stability Risk Score: [NUMBER]/100** (0=stable, 100=severe disruption)
4. **Overall Livability Risk Score: [NUMBER]/100** calculated as (Environmental * ${priorities.environmental / 100} + Economic * ${priorities.economic / 100} + Social * ${priorities.social / 100}) rounded to the nearest whole number.
5. **Top Climate Hazards:** List 4-6 specific hazards in order of severity on a single line separated by semicolons.
6. **Recommendation:** Is this location viable for ${timeHorizon}-year habitation? (2-3 sentences)

CRITICAL: You MUST provide specific numerical scores. Base your risk scores on:
- Frequency and intensity of extreme events
- Economic vulnerability and adaptation costs
- Infrastructure resilience
- Long-term habitability concerns

Additional requirements:
- Ensure hazards align with the climate context and provided risk signals. If heatwave likelihood is LOW or VERY LOW, do not list extreme heat as a top hazard.
- Use plain text without Markdown headings, bullets, or numbered lists in the final response. Format each score as "Environmental Risk Score: 45/100" on its own line.
- When listing hazards, use "Top Climate Hazards: hazard one; hazard two; ..." with semicolons separating items.`

        let plannerOutput = ""
        try {
          const plannerResult = await streamText({
            model: openai("gpt-4o-mini"),
            prompt: plannerPrompt,
            maxOutputTokens: 500,
          })

          for await (const chunk of plannerResult.textStream) {
            plannerOutput += chunk
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            role: "planner",
            content: plannerOutput
          })}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 500))
        } catch (error) {
          console.error("Planner error:", error)
        }

        // Parse AI outputs to extract structured data
        const riskData = parseAIOutputs(
          plannerOutput,
          economistOutput,
          hazardList,
          climateData,
          priorities,
          timeHorizon
        )
        
        const finalMessage = {
          role: "system",
          content: "Analysis complete",
          risk_scores: riskData.risk_scores,
          hazards: riskData.hazards,
          economic_impact: riskData.economic_impact
        }
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(finalMessage)}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Analysis API error:", error)
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

// Parse AI-generated text to extract structured risk data
function parseAIOutputs(
  plannerText: string,
  economistText: string,
  hazardSeeds: string[],
  climate: ClimateData | null,
  priorities?: { environmental: number; economic: number; social: number },
  timeHorizon = 10
) {
  const riskScores = {
    environmental: 30,
    economic: 30,
    social: 30,
    overall: 30
  }
  
  const collectedHazards: string[] = [...hazardSeeds]
  const economicImpact = {
    annual_loss_per_capita: 5000,
    adaptation_cost: 15000,
    property_value_change: -5
  }

  // Parse environmental risk score
  const envPatterns = [
    /environmental\s+risk\s+score\s*:?\s*(\d+)\/100/i,
    /environmental\s+risk\s*:?\s*(\d+)/i,
    /environmental:\s*(\d+)/i
  ]
  for (const pattern of envPatterns) {
    const match = plannerText.match(pattern)
    if (match) {
      riskScores.environmental = Math.min(100, Math.max(0, parseInt(match[1])))
      break
    }
  }

  // Parse economic risk score
  const econPatterns = [
    /economic\s+risk\s+score\s*:?\s*(\d+)\/100/i,
    /economic\s+risk\s*:?\s*(\d+)/i,
    /economic:\s*(\d+)/i
  ]
  for (const pattern of econPatterns) {
    const match = plannerText.match(pattern)
    if (match) {
      riskScores.economic = Math.min(100, Math.max(0, parseInt(match[1])))
      break
    }
  }

  // Parse social risk score
  const socialPatterns = [
    /social\s+(?:stability\s+)?risk\s+score\s*:?\s*(\d+)\/100/i,
    /social\s+(?:stability\s+)?risk\s*:?\s*(\d+)/i,
    /social:\s*(\d+)/i
  ]
  for (const pattern of socialPatterns) {
    const match = plannerText.match(pattern)
    if (match) {
      riskScores.social = Math.min(100, Math.max(0, parseInt(match[1])))
      break
    }
  }

  // Parse overall risk score
  const overallPatterns = [
    /overall\s+(?:livability\s+)?risk\s+score\s*:?\s*(\d+)\/100/i,
    /overall\s+risk\s*:?\s*(\d+)/i,
    /overall:\s*(\d+)/i
  ]
  for (const pattern of overallPatterns) {
    const match = plannerText.match(pattern)
    if (match) {
      riskScores.overall = Math.min(100, Math.max(0, parseInt(match[1])))
      break
    }
  }

  // Calculate overall score using provided priorities when possible
  if (priorities) {
    const totalWeight = Math.max(
      1,
      (priorities.environmental ?? 0) + (priorities.economic ?? 0) + (priorities.social ?? 0)
    )
    const weighted =
      (riskScores.environmental * (priorities.environmental ?? 0) +
        riskScores.economic * (priorities.economic ?? 0) +
        riskScores.social * (priorities.social ?? 0)) /
      totalWeight
    riskScores.overall = Math.round(weighted)
  } else if (riskScores.overall === 50 && (riskScores.environmental !== 50 || riskScores.economic !== 50)) {
    riskScores.overall = Math.round(riskScores.environmental * 0.6 + riskScores.economic * 0.4)
  }

  // Extract hazards from planner text
  const hazardSection = plannerText.match(/(?:top\s+)?(?:climate\s+)?hazards?\s*:?\s*([^\n]+(?:\n[-•]\s*[^\n]+)*)/i)
  if (hazardSection) {
    const hazardText = hazardSection[1].replace(/top\s+climate\s+hazards\s*:?\s*/i, "")
    const hazardLines = hazardText.split(/\n/).filter((line) => line.trim())

    hazardLines.forEach((line) => {
      const fragments = line.split(/[;,]/)
      fragments.forEach((fragment) => {
        const cleaned = fragment.replace(/^[-•*\d.)\s]+/, "").trim()
        if (isRelevantHazard(cleaned)) {
          collectedHazards.push(cleaned)
        }
      })
    })
  }

  // Also try to extract hazards from plain text mentions
  const climateContext = climate?.context ?? null

  if (collectedHazards.length < 3) {
    const commonHazards = [
      "heat waves", "extreme heat", "flooding", "hurricanes", "storms", 
      "drought", "wildfires", "sea level rise", "coastal flooding",
      "tornadoes", "heavy precipitation", "water scarcity"
    ]
    
    const lowerText = plannerText.toLowerCase()
    commonHazards.forEach(hazard => {
      if (
        lowerText.includes(hazard) &&
        !collectedHazards.some(h => h.toLowerCase().includes(hazard)) &&
        isRelevantHazard(hazard)
      ) {
        collectedHazards.push(hazard.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '))
      }
    })
  }

  // Adjust hazards based on climate context
  if (climateContext) {
    if (["low", "very low"].includes(climateContext.heatwave_risk)) {
      for (let i = collectedHazards.length - 1; i >= 0; i -= 1) {
        if (/heat/i.test(collectedHazards[i])) {
          collectedHazards.splice(i, 1)
        }
      }
    }

    climateContext.typical_hazards.forEach((hazard) => {
      if (
        isRelevantHazard(hazard) &&
        !collectedHazards.some((existing) => existing.toLowerCase().includes(hazard.toLowerCase()))
      ) {
        collectedHazards.push(hazard)
      }
    })
  }

  // Parse economic losses from economist output
  const dollarPatterns = [
    /\$\s*([\d,]+)\s*(?:per\s+capita|annually|per\s+year)/i,
    /annual.*?\$\s*([\d,]+)/i,
    /\$\s*([\d,]+).*?per\s+capita/i,
    /\$\s*([\d,]+)/
  ]
  
  for (const pattern of dollarPatterns) {
    const match = economistText.match(pattern)
    if (match) {
      const amount = parseInt(match[1].replace(/,/g, ""))
      if (!isNaN(amount) && amount > 0 && amount < 1000000) {
        economicImpact.annual_loss_per_capita = amount
        economicImpact.adaptation_cost = Math.round(amount * 3)
        break
      }
    }
  }

  // Calculate property value impact based on overall risk
  economicImpact.property_value_change = Math.round(-riskScores.overall * 0.35)

  const prioritizedHazards = prioritizeHazards(climate, collectedHazards)

  const adjustedScores = adjustScoresForTime(
    { ...riskScores },
    timeHorizon,
    climate,
    priorities
  )

  riskScores.environmental = adjustedScores.environmental
  riskScores.economic = adjustedScores.economic
  riskScores.social = adjustedScores.social
  riskScores.overall = adjustedScores.overall
  economicImpact.property_value_change = Math.round(-riskScores.overall * 0.35)

  return {
    risk_scores: riskScores,
    hazards: prioritizedHazards,
    economic_impact: economicImpact
  }
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)))
}

const disallowedHazardPatterns = [
  /infrastructure/i,
  /economic/i,
  /employment/i,
  /insurance/i,
  /property/i,
  /migration/i,
  /livability/i,
  /population/i,
  /social strain/i,
]

function isRelevantHazard(text: string) {
  if (!text) return false
  const trimmed = text.trim()
  if (trimmed.length < 3 || trimmed.length > 70) {
    return false
  }
  return !disallowedHazardPatterns.some((pattern) => pattern.test(trimmed))
}

type CanonicalHazardKey = "wildfires" | "extremeHeat" | "flooding" | "airPollution" | "storm" | "drought"

function parseHazardAgentOutput(text: string): string[] {
  const match = text.match(/hazards?\s*:\s*([^\n]+)/i)
  if (!match) return []
  const raw = match[1]
  const parsed = raw
    .split(/[;,]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const canonical = canonicalizeHazard(part)
      if (!canonical) return null
      return CANONICAL_HAZARD_LABELS[canonical]
    })
    .filter((value, index, arr) => value && arr.indexOf(value) === index) as string[]

  if (parsed.length > 0) {
    return parsed.slice(0, 2)
  }

  return []
}

const CANONICAL_HAZARD_LABELS: Record<CanonicalHazardKey, string> = {
  wildfires: "Wildfires",
  extremeHeat: "Extreme Heat",
  flooding: "Flooding",
  airPollution: "Air Pollution",
  storm: "Storm",
  drought: "Drought",
}

const HAZARD_SYNONYMS: Array<{ regex: RegExp; key: CanonicalHazardKey }> = [
  { regex: /wild\s*fire|forest\s*fire|bush\s*fire|smoke plume|wildfires/i, key: "wildfires" },
  { regex: /heat\s*(wave|stress)|extreme\s*heat|hot spell|heatwaves?/i, key: "extremeHeat" },
  { regex: /flood|storm\s*surge|sea\s*level|river\s*flood|heavy\s*rain|extreme\s*precipitation|downpour/i, key: "flooding" },
  { regex: /air\s*quality|air\s*pollution|smoke|particulate/i, key: "airPollution" },
  { regex: /storm|hurricane|cyclone|typhoon|wind\s*event|severe\s*weather|wind\s*storm/i, key: "storm" },
  { regex: /drought|water\s*scarcity|aridity|dry\s*spell/i, key: "drought" },
]

function canonicalizeHazard(raw: string): CanonicalHazardKey | null {
  const text = raw.trim()
  if (!text) return null
  for (const { regex, key } of HAZARD_SYNONYMS) {
    if (regex.test(text)) {
      return key
    }
  }
  return null
}

function prioritizeHazards(climate: ClimateData | null, rawHazards: string[]): string[] {
  const scores = new Map<CanonicalHazardKey, number>()
  const bump = (key: CanonicalHazardKey, amount: number) => {
    if (amount <= 0) return
    scores.set(key, (scores.get(key) ?? 0) + amount)
  }

  const seenRaw = new Set<string>()
  rawHazards.forEach((raw) => {
    const cleaned = raw.trim()
    if (!cleaned || seenRaw.has(cleaned.toLowerCase())) return
    seenRaw.add(cleaned.toLowerCase())
    const key = canonicalizeHazard(cleaned)
    if (key) {
      bump(key, 1.4)
      if (key === "airPollution") {
        bump("wildfires", 0.4)
      }
    }
  })

  if (climate) {
    const { historical, forecast, context } = climate
    const { temperature_avg, precipitation_anomaly } = historical
    const { temperature_trend, extreme_weather_risk } = forecast

    context.typical_hazards.forEach((hazard) => {
      const key = canonicalizeHazard(hazard)
      if (key) {
        bump(key, 1.2)
      }
    })

    switch (context.heatwave_risk) {
      case "high":
        bump("extremeHeat", 2)
        bump("airPollution", 0.7)
        break
      case "moderate":
        bump("extremeHeat", 1.2)
        bump("airPollution", 0.3)
        break
      case "low":
        bump("extremeHeat", 0.5)
        break
      default:
        bump("extremeHeat", 0.2)
    }

    if (temperature_avg >= 26 || temperature_trend >= 1.3) {
      bump("extremeHeat", 1)
    }

    if (precipitation_anomaly >= 20) {
      bump("flooding", 1.8)
      bump("storm", 0.6)
    } else if (precipitation_anomaly >= 10) {
      bump("flooding", 1)
    }

    if (precipitation_anomaly <= -15) {
      bump("drought", 1.8)
      bump("wildfires", 0.9)
      bump("airPollution", 0.4)
    } else if (precipitation_anomaly <= -5) {
      bump("drought", 0.9)
    }

    if (["Arid", "Temperate"].includes(context.climate_zone) && (temperature_avg >= 20 || precipitation_anomaly <= -10)) {
      bump("wildfires", 1.4)
    }

    if (context.climate_zone === "Subpolar" && temperature_trend >= 1.2) {
      bump("storm", 1)
      bump("flooding", 0.6)
    }

    if (extreme_weather_risk === "high") {
      bump("storm", 2)
      bump("flooding", 1)
    } else if (extreme_weather_risk === "medium") {
      bump("storm", 1)
    }

    if (context.cold_extreme_risk === "very high") {
      bump("storm", 0.5)
    }

    if ((scores.get("wildfires") ?? 0) > 2.2) {
      bump("airPollution", 0.5)
    }
  }

  const prioritized = Array.from(scores.entries())
    .filter(([, score]) => score > 0.3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => CANONICAL_HAZARD_LABELS[key])

  if (prioritized.length === 0) {
    return ["Storm"]
  }

  return prioritized
}

function adjustScoresForTime(
  baseScores: { environmental: number; economic: number; social: number; overall: number },
  timeHorizon: number,
  climate: ClimateData | null,
  priorities?: { environmental: number; economic: number; social: number }
) {
  const baseline = 10
  const diff = timeHorizon - baseline

  const growthFactor = diff > 0 ? Math.min(diff * 0.35, 12) : diff * 0.25
  const econGrowthFactor = diff > 0 ? Math.min(diff * 0.3, 10) : diff * 0.2
  const socialGrowthFactor = diff > 0 ? Math.min(diff * 0.25, 9) : diff * 0.2

  let climateEnv = 0
  let climateEcon = 0
  let climateSocial = 0

  if (climate) {
    const { forecast, historical, context } = climate
    const { temperature_trend, extreme_weather_risk } = forecast
    const { precipitation_anomaly } = historical

    if (temperature_trend >= 1.6) {
      climateEnv += 4
      climateSocial += 2
    } else if (temperature_trend >= 1.1) {
      climateEnv += 2.5
      climateSocial += 1.2
    }

    if (extreme_weather_risk === "high") {
      climateEnv += 4
      climateEcon += 3
      climateSocial += 2
    } else if (extreme_weather_risk === "medium") {
      climateEnv += 2
      climateEcon += 1.5
    }

    if (precipitation_anomaly >= 20) {
      climateEnv += 3
      climateEcon += 2
    } else if (precipitation_anomaly <= -15) {
      climateEnv += 2.5
      climateEcon += 1.5
      climateSocial += 1
    }

    if (context.heatwave_risk === "high") {
      climateEnv += 2.5
      climateSocial += 1.2
    } else if (context.heatwave_risk === "moderate") {
      climateEnv += 1.5
    }

    if (context.cold_extreme_risk === "very high") {
      climateEnv += 1.5
      climateSocial += 1
    }
  }

  const baseEnv = clampScore(baseScores.environmental)
  const baseEcon = clampScore(baseScores.economic)
  const baseSocInput = Number.isFinite(baseScores.social) && baseScores.social !== 50
    ? clampScore(baseScores.social)
    : Math.round((baseEnv + baseEcon) / 2)

  const normalizedEnv = Math.max(0, baseEnv - 10)
  const normalizedEcon = Math.max(0, baseEcon - 12)
  const normalizedSoc = Math.max(0, baseSocInput - 10)

  const environmental = clampScore(normalizedEnv + growthFactor + climateEnv)
  const economic = clampScore(normalizedEcon + econGrowthFactor + climateEcon)
  const social = clampScore(normalizedSoc + socialGrowthFactor + climateSocial)

  const envWeight = priorities?.environmental ?? 34
  const econWeight = priorities?.economic ?? 33
  const socialWeight = priorities?.social ?? 33
  const totalWeight = envWeight + econWeight + socialWeight || 100

  const overall = clampScore(
    (environmental * envWeight + economic * econWeight + social * socialWeight) / totalWeight
  )

  return {
    environmental,
    economic,
    social,
    overall,
  }
}
