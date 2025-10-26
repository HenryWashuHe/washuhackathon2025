"use client"
import { type ComponentType, type SVGProps, useCallback, useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { AlertTriangle, DollarSign, Droplets, Wind, Flame, Thermometer } from "lucide-react"

// RiskScoreDisplay Component
interface RiskScoreDisplayProps {
  environmentalRisk: number // 0-100
  economicRisk: number // 0-100
  socialRisk?: number // 0-100
  overallRisk: number // 0-100
  hazards?: string[]
  economicImpact?: {
    annual_loss_per_capita: number
    adaptation_cost?: number
    property_value_change?: number
  }
}

function RiskScoreDisplay({
  environmentalRisk,
  economicRisk,
  socialRisk,
  overallRisk,
  hazards = [],
  economicImpact
}: RiskScoreDisplayProps) {
  const getRiskColor = (score: number) => {
    if (score >= 75) return "text-red-600 bg-red-50 border-red-200"
    if (score >= 50) return "text-orange-600 bg-orange-50 border-orange-200"
    if (score >= 25) return "text-yellow-600 bg-yellow-50 border-yellow-200"
    return "text-green-600 bg-green-50 border-green-200"
  }

  const getRiskLabel = (score: number) => {
    if (score >= 75) return "Critical"
    if (score >= 50) return "High"
    if (score >= 25) return "Moderate"
    return "Low"
  }

  const hazardIcons: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
    flooding: Droplets,
    hurricane: Wind,
    wildfire: Flame,
    "extreme heat": Thermometer,
    storm: Wind,
    drought: Droplets,
    "extreme cold": Thermometer,
  }
  const hasSocialRisk = typeof socialRisk === "number"
  const riskGridCols = hasSocialRisk ? "md:grid-cols-3" : "md:grid-cols-2"

  return (
    <div className="space-y-6">
      {/* Overall Livability Risk */}
      <Card className={`p-6 border-2 ${getRiskColor(overallRisk)}`}>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-1">Overall Livability Risk</h3>
            <p className="text-3xl font-bold">{overallRisk}/100</p>
            <p className="text-sm font-medium mt-1">{getRiskLabel(overallRisk)} Risk</p>
          </div>
          <AlertTriangle className="w-16 h-16 opacity-50" />
        </div>
      </Card>

      {/* Risk Breakdown */}
      <div className={`grid ${riskGridCols} gap-4`}>
        {/* Environmental Risk */}
        <Card className={`p-6 border ${getRiskColor(environmentalRisk)}`}>
          <h4 className="font-semibold mb-2">Environmental Risk</h4>
          <p className="text-2xl font-bold">{environmentalRisk}/100</p>
          <p className="text-sm mt-1">{getRiskLabel(environmentalRisk)}</p>
        </Card>

        {/* Economic Risk */}
        <Card className={`p-6 border ${getRiskColor(economicRisk)}`}>
          <h4 className="font-semibold mb-2">Economic Risk</h4>
          <p className="text-2xl font-bold">{economicRisk}/100</p>
          <p className="text-sm mt-1">{getRiskLabel(economicRisk)}</p>
        </Card>

        {hasSocialRisk && (
          <Card className={`p-6 border ${getRiskColor(socialRisk!)}`}>
            <h4 className="font-semibold mb-2">Social Stability Risk</h4>
            <p className="text-2xl font-bold">{socialRisk}/100</p>
            <p className="text-sm mt-1">{getRiskLabel(socialRisk!)}</p>
          </Card>
        )}
      </div>

      {/* Climate Hazards */}
      {hazards.length > 0 && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Expected Climate Hazards
          </h4>
          <div className="grid md:grid-cols-2 gap-3">
            {hazards.map((hazard, idx) => {
              const Icon = hazardIcons[hazard.toLowerCase()] || AlertTriangle
              return (
                <div key={idx} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-orange-600" />
                  <span className="capitalize font-medium">{hazard}</span>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Economic Impact */}
      {economicImpact && (
        <Card className="p-6">
          <h4 className="font-semibold mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Expected Economic Losses
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">Annual Loss Per Capita</span>
              <span className="text-lg font-bold text-red-600">
                ${economicImpact.annual_loss_per_capita.toLocaleString()}
              </span>
            </div>
            {economicImpact.adaptation_cost !== undefined && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Adaptation Cost</span>
                <span className="text-lg font-bold">
                  ${economicImpact.adaptation_cost.toLocaleString()}
                </span>
              </div>
            )}
            {economicImpact.property_value_change !== undefined && (
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium">Property Value Impact</span>
                <span className={`text-lg font-bold ${economicImpact.property_value_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {economicImpact.property_value_change > 0 ? '+' : ''}
                  {economicImpact.property_value_change}%
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

// AnalysisResults Component
interface AnalysisResultsProps {
  location: { lat: number; lng: number; name: string }
  radius: number
  userPrompt?: string
  isAnalyzing: boolean
  yearsInFuture: number
  onAnalysisComplete: (result: AnalysisOutcome | null) => void
}

export interface RiskScores {
  environmental: number
  economic: number
  social: number
  overall: number
}

export interface EconomicImpact {
  annual_loss_per_capita: number
  adaptation_cost?: number
  property_value_change?: number
}

export interface AnalysisOutcome {
  riskScores?: RiskScores | null
  hazards?: string[]
  economicImpact?: EconomicImpact | null
}

export function AnalysisResults({
  location,
  radius,
  userPrompt,
  isAnalyzing,
  yearsInFuture,
  onAnalysisComplete,
}: AnalysisResultsProps) {
  const [debateMessages, setDebateMessages] = useState<Array<{ role: string; content: string }>>([])
  const [riskScores, setRiskScores] = useState<RiskScores | null>(null)
  const [hazards, setHazards] = useState<string[]>([])
  const [economicImpact, setEconomicImpact] = useState<EconomicImpact | null>(null)

  const startAnalysis = useCallback(async () => {
    if (!location) return

    setRiskScores(null)
    setHazards([])
    setEconomicImpact(null)
    setDebateMessages([])

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          radius,
          years_in_future: yearsInFuture,
          userPrompt: userPrompt || undefined,
          priorities: {
            environmental: 34,
            economic: 33,
            social: 33
          }
        }),
      })

      if (!response.ok) throw new Error("Analysis failed")

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      let buffer = ""
      let latestRiskScores: RiskScores | null = null
      let latestHazards: string[] = []
      let latestEconomicImpact: EconomicImpact | null = null

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
              
              if (data.role && data.content && data.role !== "system") {
                setDebateMessages((prev) => {
                  const next = [...prev, data]
                  return next.slice(-6)
                })
              }
              
              if (data.risk_scores) {
                setRiskScores(data.risk_scores)
                latestRiskScores = data.risk_scores
              }
              
              if (data.hazards) {
                setHazards(data.hazards)
                latestHazards = data.hazards
              }
              
              if (data.economic_impact) {
                setEconomicImpact(data.economic_impact)
                latestEconomicImpact = data.economic_impact
              }
            } catch (e) {
              console.error("Failed to parse SSE data:", e)
            }
          }
        }
      }

      onAnalysisComplete({
        riskScores: latestRiskScores,
        hazards: latestHazards,
        economicImpact: latestEconomicImpact,
      })
    } catch (error) {
      console.error("Analysis error:", error)
      onAnalysisComplete(null)
    }
  }, [location, radius, yearsInFuture, userPrompt, onAnalysisComplete])

  useEffect(() => {
    if (isAnalyzing) {
      startAnalysis()
    }
  }, [isAnalyzing, startAnalysis])

  return (
    <div className="space-y-6">
      {riskScores && (
        <RiskScoreDisplay
          environmentalRisk={riskScores.environmental}
          economicRisk={riskScores.economic}
          socialRisk={riskScores.social}
          overallRisk={riskScores.overall}
          hazards={hazards}
          economicImpact={economicImpact || undefined}
        />
      )}

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">AI Analysis Debate</h3>
        <div className="space-y-4">
          {debateMessages.map((msg, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg">
              <div className="font-semibold text-sm text-blue-600 mb-1 capitalize">
                {msg.role}
              </div>
              <p className="text-sm text-gray-700">{msg.content}</p>
            </div>
          ))}
          {isAnalyzing && debateMessages.length === 0 && (
            <p className="text-sm text-gray-500 italic">Starting analysis...</p>
          )}
        </div>
      </Card>
    </div>
  )
}
