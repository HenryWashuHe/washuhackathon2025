"use client"
import { useCallback, useEffect, useRef, useState } from "react"
import { DebateFeed } from "@/components/debate-feed"
import { KpiCards } from "@/components/kpi-cards"
import { ClimateCharts, RainfallSeries, YieldSeries } from "@/components/climate-charts"
import type { PlanContext, Recommendation } from "@/types/api"

interface AnalysisResultsProps {
  location: { lat: number; lng: number; name: string }
  radius: number
  priorities: {
    economic: number
    environmental: number
    social: number
  }
  userPrompt?: string
  isAnalyzing: boolean
  onAnalysisComplete: (result: { recommendation: Recommendation | null; context: PlanContext | null }) => void
}

const RAINFALL_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
const BASE_RAINFALL = [45, 52, 61, 58, 72, 85, 92, 88, 76, 65, 54, 48]

const CROP_LABELS = ["Wheat", "Corn", "Rice", "Soybeans", "Cotton"]
const BASE_YIELD = [3.2, 5.8, 4.5, 2.9, 1.8]

const createInitialRainfall = (): RainfallSeries => ({
  labels: [...RAINFALL_LABELS],
  baseline: [...BASE_RAINFALL],
  projected: [...BASE_RAINFALL],
})

const createInitialYields = (): YieldSeries => ({
  labels: [...CROP_LABELS],
  baseline: [...BASE_YIELD],
  projected: [...BASE_YIELD],
})

const computeProjectedRainfall = (anomalyPercent: number | null): number[] => {
  if (typeof anomalyPercent !== "number") {
    return [...BASE_RAINFALL]
  }
  const factor = 1 + anomalyPercent / 100
  return BASE_RAINFALL.map((value) => Number(Math.max(0, value * factor).toFixed(1)))
}

const computeProjectedYield = (yieldChangePercent: number | null): number[] => {
  if (typeof yieldChangePercent !== "number") {
    return [...BASE_YIELD]
  }
  const factor = 1 + yieldChangePercent / 100
  return BASE_YIELD.map((value) => Number(Math.max(0, value * factor).toFixed(2)))
}

type StreamClaim = {
  metric: string
  value: number
  unit?: string
  confidence?: number
}

type StreamPayload = {
  role?: string
  content?: string
  strategy?: Recommendation["strategy"]
  impact?: Recommendation["impact"]
  claims?: StreamClaim[]
  [key: string]: unknown
}

export function AnalysisResults({
  location,
  radius,
  priorities,
  userPrompt,
  isAnalyzing,
  onAnalysisComplete,
}: AnalysisResultsProps) {
  const [debateMessages, setDebateMessages] = useState<Array<{ role: string; content: string }>>([])
  const [latestImpact, setLatestImpact] = useState<Recommendation["impact"] | null>(null)
  const previousImpactRef = useRef<Recommendation["impact"] | null>(null)
  const previousContextRef = useRef<PlanContext | null>(null)
  const [chartData, setChartData] = useState<{
    rainfall: RainfallSeries
    yields: YieldSeries
  }>({
    rainfall: createInitialRainfall(),
    yields: createInitialYields(),
  })

  const startAnalysis = useCallback(async () => {
    if (!location) return

    const priorImpact = previousImpactRef.current
    const priorContext = previousContextRef.current
    try {
      setDebateMessages([])
      setLatestImpact(null)
      setChartData({
        rainfall: createInitialRainfall(),
        yields: createInitialYields(),
      })

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          radius,
          priorities,
          userPrompt: userPrompt || undefined,
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let buffer = ""
      const allMessages: StreamPayload[] = []
      let finalStrategy: Recommendation["strategy"] | null = null
      let finalImpact: Recommendation["impact"] | null = null
      const contextAccumulator: PlanContext = {
        location: { ...location },
        radius,
        priorities: { ...priorities },
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const payload = JSON.parse(line.slice(6)) as StreamPayload
              allMessages.push(payload)

              if (typeof payload.role === "string" && typeof payload.content === "string") {
                setDebateMessages((prev) => [
                  ...prev,
                  { role: payload.role, content: payload.content },
                ])
              }

              if (payload.role === "meteorologist" && Array.isArray(payload.claims)) {
                const anomalyClaim = payload.claims.find((claim) => claim.metric === "precipitation_anomaly")
                const tempClaim = payload.claims.find((claim) => claim.metric === "temperature_avg")
                const riskClaim = payload.claims.find((claim) => claim.metric === "extreme_weather_risk")
                const projected = computeProjectedRainfall(
                  typeof anomalyClaim?.value === "number" ? anomalyClaim.value : null
                )
                setChartData((prev) => ({
                  rainfall: { ...prev.rainfall, projected },
                  yields: prev.yields,
                }))
                if (typeof anomalyClaim?.value === "number") {
                  contextAccumulator.precipitationAnomaly = anomalyClaim.value
                }
                if (typeof tempClaim?.value === "number") {
                  contextAccumulator.temperatureAvg = tempClaim.value
                }
                if (typeof riskClaim?.value === "number") {
                  const riskScore = riskClaim.value
                  const riskLabel =
                    riskScore >= 0.75 ? "high" : riskScore >= 0.45 ? "medium" : riskScore >= 0.2 ? "low" : "minimal"
                  contextAccumulator.extremeWeatherRisk = riskLabel
                }
              }

              if (payload.role === "agronomist" && Array.isArray(payload.claims)) {
                const yieldClaim = payload.claims.find((claim) => claim.metric === "crop_yield_change")
                const waterClaim = payload.claims.find((claim) => claim.metric === "water_stress_index")
                const soilClaim = payload.claims.find((claim) => claim.metric === "soil_health_index")
                const projected = computeProjectedYield(typeof yieldClaim?.value === "number" ? yieldClaim.value : null)
                setChartData((prev) => ({
                  rainfall: prev.rainfall,
                  yields: { ...prev.yields, projected },
                }))
                if (typeof yieldClaim?.value === "number") {
                  contextAccumulator.yieldChange = yieldClaim.value
                }
                if (typeof waterClaim?.value === "number") {
                  contextAccumulator.waterStress = waterClaim.value
                }
                if (typeof soilClaim?.value === "number") {
                  contextAccumulator.soilHealth = soilClaim.value
                }
              }

              if (payload.role === "system" && payload.strategy && payload.impact) {
                finalStrategy = payload.strategy
                finalImpact = payload.impact
              }

              if (payload.role === "economist" && Array.isArray(payload.claims)) {
                const incomeClaim = payload.claims.find((claim) => claim.metric === "income_change")
                const costClaim = payload.claims.find((claim) => claim.metric === "adaptation_cost")
                if (typeof incomeClaim?.value === "number") {
                  contextAccumulator.incomeChange = incomeClaim.value
                }
                if (typeof costClaim?.value === "number") {
                  contextAccumulator.adaptationCost = costClaim.value
                }
              }
            } catch (e) {
              console.error("[v0] Failed to parse SSE data:", e)
            }
          }
        }
      }

      // Build recommendation from collected data
      let finalRecommendation: Recommendation | null = null
      
      if (finalStrategy && finalImpact) {
        const plannerEntry = allMessages.find((msg) => msg.role === "planner")
        const plannerContent = typeof plannerEntry?.content === "string" ? plannerEntry.content : null

        finalRecommendation = {
          strategy: finalStrategy,
          impact: finalImpact,
          sources: [
            { provider: "open-meteo", retrieved_at: new Date().toISOString() },
            { provider: "langgraph-agents", retrieved_at: new Date().toISOString() },
          ],
          explanation: plannerContent || "Multi-agent analysis complete.",
        }
        setLatestImpact(finalImpact)
        previousImpactRef.current = finalImpact
        previousContextRef.current = contextAccumulator
        onAnalysisComplete({ recommendation: finalRecommendation, context: contextAccumulator })
      } else {
        previousContextRef.current = contextAccumulator
        onAnalysisComplete({ recommendation: finalRecommendation, context: contextAccumulator })
      }
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      setLatestImpact(priorImpact ?? null)
      previousImpactRef.current = priorImpact ?? null
      onAnalysisComplete({ recommendation: null, context: priorContext ?? null })
    }
  }, [location, radius, priorities, userPrompt, onAnalysisComplete])

  useEffect(() => {
    if (isAnalyzing) {
      startAnalysis()
    }
  }, [isAnalyzing, startAnalysis])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCards
        location={location}
        radius={radius}
        priorities={priorities}
        impact={latestImpact}
        isAnalyzing={isAnalyzing}
      />

      {/* Climate Charts */}
      <ClimateCharts data={chartData} />

      {/* Debate Feed */}
      <DebateFeed messages={debateMessages} isAnalyzing={isAnalyzing} />
    </div>
  )
}
