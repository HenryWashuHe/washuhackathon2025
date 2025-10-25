"use client"
import { useCallback, useEffect, useState } from "react"
import { DebateFeed } from "@/components/debate-feed"
import { KpiCards } from "@/components/kpi-cards"
import { ClimateCharts } from "@/components/climate-charts"
import type { Recommendation } from "@/types/api"

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
  onAnalysisComplete: (recommendation: Recommendation | null) => void
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

  const startAnalysis = useCallback(async () => {
    if (!location) return

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          radius,
          priorities,
          userPrompt: userPrompt || undefined, // Only include if provided
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n")
        buffer = lines.pop() || ""

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.role && data.content) {
                setDebateMessages((prev) => [...prev, data])
              }
            } catch (e) {
              console.error("[v0] Failed to parse SSE data:", e)
            }
          }
        }
      }

      const mockRecommendation: Recommendation = {
        strategy: { maize: 0.7, sorghum: 0.3, irrigation_subsidy: true },
        impact: {
          food: 0.04,
          income: 0.05,
          emissions: -0.01,
          risk: -0.12,
        },
        sources: [
          { provider: "open-meteo", retrieved_at: new Date().toISOString() },
          { provider: "faostat", retrieved_at: new Date().toISOString() },
        ],
        explanation:
          "Switching 30% to sorghum reduces drought loss; irrigation offsets income dip. This strategy balances your priorities while maintaining food security.",
      }

      onAnalysisComplete(mockRecommendation)
    } catch (error) {
      console.error("[v0] Analysis error:", error)
      onAnalysisComplete(null)
    }
  }, [location, radius, priorities, userPrompt, onAnalysisComplete])

  useEffect(() => {
    if (isAnalyzing) {
      setDebateMessages([])
      startAnalysis()
    }
  }, [isAnalyzing, startAnalysis])

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <KpiCards location={location} radius={radius} priorities={priorities} />

      {/* Climate Charts */}
      <ClimateCharts location={location} />

      {/* Debate Feed */}
      <DebateFeed messages={debateMessages} isAnalyzing={isAnalyzing} />
    </div>
  )
}
