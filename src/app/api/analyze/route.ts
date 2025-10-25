import { streamText } from "ai"
import { getClimateData, formatClimateDataForAgent } from "@/lib/open-meteo"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { location, radius, priorities, userPrompt } = await req.json()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        // Fetch real climate data from Open-Meteo
        let climateDataText = ""
        let climateData = null
        try {
          climateData = await getClimateData(location.lat, location.lng)
          climateDataText = formatClimateDataForAgent(climateData)
        } catch (error) {
          console.error("[analyze] Failed to fetch climate data:", error)
          climateDataText = "Climate data unavailable. Provide general analysis."
        }

        // Build agent prompts with real data
        const contextPrefix = userPrompt ? `\n\nUser Context: ${userPrompt}` : ""

        const agents = [
          {
            role: "meteorologist",
            prompt: `You are a meteorologist analyzing climate data for ${location.name} (${location.lat}, ${location.lng}) within a ${radius}km radius.

${climateDataText}${contextPrefix}

Based on this real climate data, provide a concise analysis (2-3 sentences) of:
- Key temperature and precipitation trends
- Extreme weather risks
- Expected climate impacts in the next 5-10 years`,
          },
          {
            role: "agronomist",
            prompt: `You are an agronomist evaluating agricultural impacts for ${location.name}.

${climateDataText}${contextPrefix}

Based on the meteorologist's climate data above, analyze (2-3 sentences):
- How temperature and precipitation changes affect crop viability
- Water availability and soil health concerns
- Recommended crop adaptations or diversification`,
          },
          {
            role: "economist",
            prompt: `You are an economist assessing economic implications for ${location.name}.

${climateDataText}${contextPrefix}

Consider the economic priority weight is ${priorities.economic}%. Based on climate and agricultural impacts, analyze (2-3 sentences):
- Financial impacts on local industries and employment
- Infrastructure and adaptation costs
- Economic resilience strategies`,
          },
          {
            role: "planner",
            prompt: `You are an urban planner synthesizing recommendations for ${location.name}.

${climateDataText}${contextPrefix}

Priority weights: Environmental ${priorities.environmental}%, Economic ${priorities.economic}%, Social ${priorities.social}%

Synthesize the meteorologist, agronomist, and economist insights into actionable strategies (2-3 sentences) that:
- Balance the given priority weights
- Provide specific adaptation measures
- Consider both short-term and long-term sustainability`,
          },
        ]

        // Send climate data first
        if (climateData) {
          const climateMessage = {
            role: "system",
            content: `Real-time climate data retrieved for ${location.name}. Analysis starting...`,
            data: climateData,
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(climateMessage)}\n\n`))
          await new Promise((resolve) => setTimeout(resolve, 300))
        }

        for (const agent of agents) {
          try {
            const result = await streamText({
              model: "openai/gpt-4o-mini",
              prompt: agent.prompt,
              maxOutputTokens: 200,
            })

            let fullContent = ""

            for await (const chunk of result.textStream) {
              fullContent += chunk
            }

            const message = {
              role: agent.role,
              content: fullContent,
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))

            // Add a small delay between agents for better UX
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            console.error(`[analyze] Error with ${agent.role}:`, error)
            // Send error message to client
            const errorMessage = {
              role: agent.role,
              content: `Analysis temporarily unavailable. Please try again.`,
              error: true,
            }
            controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorMessage)}\n\n`))
          }
        }

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
    console.error("[v0] Analysis API error:", error)
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
