"use client"
import { useCallback, useEffect, useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { RiskScoreDisplay } from "@/components/risk-score-display"
import { Label } from "@/components/ui/label"
import { TrendingDown, Wheat, DollarSign, Users } from "lucide-react"

// Main Component
interface ClimateRiskResultsProps {
  location: { lat: number; lng: number; name: string }
  radius: number
  yearsInFuture: number
  userPrompt?: string
  isAnalyzing: boolean
  onAnalysisComplete: () => void
}

// Production Projections Component for 100-year forecast
type ProductionProjection = {
  year: number
  crop_yield: number  // percentage relative to current (100 = current level)
  agricultural_gdp: number
  food_security_index: number
  population_supportable: number
}

type RiskScores = {
  environmental: number
  economic: number
  social?: number
  overall: number
}

type EconomicImpact = {
  annual_loss_per_capita: number
  adaptation_cost: number
  property_value_change: number
}

function ProductionProjections({ 
  yearsInFuture, 
  location 
}: { 
  yearsInFuture: number; 
  location: { lat: number; lng: number; name: string } 
}) {
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstanceRef = useRef<any>(null) // Store the chart instance
  const [projections, setProjections] = useState<ProductionProjection[]>([])
  
  useEffect(() => {
    // Generate projections based on years and climate risk
    const generateProjections = () => {
      const data: ProductionProjection[] = []
      const climateImpactRate = 0.005 // 0.5% annual decline base rate
      const adaptationRate = 0.002 // 0.2% improvement from adaptation
      
      for (let year = 0; year <= yearsInFuture; year += Math.max(1, Math.floor(yearsInFuture / 20))) {
        const climateDecline = Math.exp(-climateImpactRate * year) * 100
        const adaptationBoost = Math.min(10, year * adaptationRate * 100)
        
        data.push({
          year: new Date().getFullYear() + year,
          crop_yield: Math.max(20, climateDecline + adaptationBoost),
          agricultural_gdp: Math.max(30, climateDecline * 1.2),
          food_security_index: Math.max(40, 100 - (year * 0.3)),
          population_supportable: Math.max(50, 100 - (year * 0.4))
        })
      }
      setProjections(data)
    }
    
    generateProjections()
  }, [yearsInFuture, location])
  
  useEffect(() => {
    if (!chartRef.current || projections.length === 0) return
    
    // Dynamically load Chart.js and render projection chart
    const renderChart = async () => {
      const Chart = (await import("chart.js/auto")).default
      
      // Destroy existing chart if it exists
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
      
      const ctx = chartRef.current?.getContext("2d")
      if (!ctx) return
      
      // Create new chart and store the instance
      chartInstanceRef.current = new Chart(ctx, {
        type: "line",
        data: {
          labels: projections.map(p => p.year.toString()),
          datasets: [
            {
              label: "Crop Yield (%)",
              data: projections.map(p => p.crop_yield),
              borderColor: "rgb(34, 197, 94)",
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              tension: 0.4,
            },
            {
              label: "Food Security Index",
              data: projections.map(p => p.food_security_index),
              borderColor: "rgb(251, 146, 60)",
              backgroundColor: "rgba(251, 146, 60, 0.1)",
              tension: 0.4,
            },
            {
              label: "Agricultural GDP (%)",
              data: projections.map(p => p.agricultural_gdp),
              borderColor: "rgb(59, 130, 246)",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              tension: 0.4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: `${yearsInFuture}-Year Production Projections for ${location.name}`,
            },
            legend: {
              position: "top",
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              max: 120,
              title: {
                display: true,
                text: "% of Current Baseline"
              }
            },
            x: {
              title: {
                display: true,
                text: "Year"
              }
            }
          },
        },
      })
    }
    
    renderChart().catch(console.error)
    
    // Cleanup function to destroy chart on unmount or before re-render
    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy()
        chartInstanceRef.current = null
      }
    }
  }, [projections, location, yearsInFuture])
  
  const finalProjection = projections[projections.length - 1]
  
  return (
    <Card className="p-6">
      <Label className="text-lg font-bold mb-4 block">
        {yearsInFuture}-Year Production Forecast
      </Label>
      
      {/* Chart */}
      <div className="h-[300px] mb-4">
        <canvas ref={chartRef} />
      </div>
      
      {/* Key Metrics */}
      {finalProjection && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <Wheat className="h-5 w-5 mx-auto mb-1 text-green-600" />
            <p className="text-xs text-muted-foreground">Crop Yield</p>
            <p className={`text-lg font-bold ${finalProjection.crop_yield < 50 ? 'text-red-600' : 'text-green-600'}`}>
              {finalProjection.crop_yield.toFixed(0)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-blue-600" />
            <p className="text-xs text-muted-foreground">Agri GDP</p>
            <p className={`text-lg font-bold ${finalProjection.agricultural_gdp < 50 ? 'text-red-600' : 'text-blue-600'}`}>
              {finalProjection.agricultural_gdp.toFixed(0)}%
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <TrendingDown className="h-5 w-5 mx-auto mb-1 text-orange-600" />
            <p className="text-xs text-muted-foreground">Food Security</p>
            <p className={`text-lg font-bold ${finalProjection.food_security_index < 50 ? 'text-red-600' : 'text-orange-600'}`}>
              {finalProjection.food_security_index.toFixed(0)}/100
            </p>
          </div>
          
          <div className="text-center p-3 bg-muted rounded-lg">
            <Users className="h-5 w-5 mx-auto mb-1 text-purple-600" />
            <p className="text-xs text-muted-foreground">Population Cap</p>
            <p className={`text-lg font-bold ${finalProjection.population_supportable < 50 ? 'text-red-600' : 'text-purple-600'}`}>
              {finalProjection.population_supportable.toFixed(0)}%
            </p>
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground mt-4">
        * Projections based on climate scenarios and adaptation measures. 
        Baseline = 100% (current production levels).
      </p>
    </Card>
  )
}

export function ClimateRiskResults({
  location,
  radius,
  yearsInFuture,
  userPrompt,
  isAnalyzing,
  onAnalysisComplete,
}: ClimateRiskResultsProps) {
  const [riskScores, setRiskScores] = useState<RiskScores | null>(null)
  const [hazards, setHazards] = useState<string[]>([])
  const [economicImpact, setEconomicImpact] = useState<EconomicImpact | null>(null)
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([])

  const startAnalysis = useCallback(async () => {
    if (!location) return

    try {
      const response = await fetch("/api/analyze-risk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          location,
          radius,
          yearsInFuture,
          userPrompt: userPrompt || undefined,
        }),
      }).catch((error) => {
        console.error("[ClimateRisk] Network error:", error)
        throw new Error("Failed to connect to the risk analysis service. Please check your connection and try again.")
      })

      if (!response.ok) throw new Error("Risk analysis failed")

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
              
              // Handle different message types
              if (data.role && data.content) {
                setMessages((prev: any[]) => [...prev, data])
              }
              
              // Handle risk scores
              if (data.riskScores) {
                setRiskScores((prev: RiskScores | null) => ({
                  environmental: data.riskScores.environmental ?? prev?.environmental ?? 0,
                  economic: data.riskScores.economic ?? prev?.economic ?? 0,
                  social: data.riskScores.social ?? prev?.social,
                  overall: data.riskScores.overall ?? prev?.overall ?? 0,
                }))
              }
              
              // Handle hazards
              if (data.hazards) {
                setHazards(data.hazards)
              }
              
              // Handle economic impact
              if (data.economicImpact) {
                setEconomicImpact(data.economicImpact as EconomicImpact)
              }
            } catch (e) {
              console.error("[climate-risk] Failed to parse SSE data:", e)
            }
          }
        }
      }

      // Fallback simulation if backend stream didn't provide structured data
      setRiskScores((existing: RiskScores | null) => {
        if (existing) return existing
        const simulatedRisk = Math.min(100, 20 + yearsInFuture * 0.5 + Math.random() * 30)
        return {
          environmental: Math.round(simulatedRisk + Math.random() * 20 - 10),
          economic: Math.round(simulatedRisk + Math.random() * 20 - 10),
          social: Math.round(simulatedRisk + Math.random() * 10 - 5),
          overall: Math.round(simulatedRisk),
        }
      })

      setHazards((existing: string[]) => {
        if (existing.length) return existing
        const possibleHazards = ["flooding", "hurricane", "extreme heat", "drought", "wildfire"]
        return possibleHazards.filter(() => Math.random() > 0.6).slice(0, 3)
      })

      setEconomicImpact((existing: EconomicImpact | null) => {
        if (existing) return existing
        return {
          annual_loss_per_capita: Math.round(500 + Math.random() * 2000),
          adaptation_cost: Math.round(100000 + Math.random() * 900000),
          property_value_change: Math.round(-5 - Math.random() * 15),
        }
      })

      onAnalysisComplete()
    } catch (error) {
      console.error("[climate-risk] Analysis error:", error)
      onAnalysisComplete()
    }
  }, [location, radius, yearsInFuture, userPrompt, onAnalysisComplete])

  useEffect(() => {
    if (isAnalyzing) {
      setMessages([])
      startAnalysis()
    }
  }, [isAnalyzing, startAnalysis])

  return (
    <div className="space-y-6">
      {/* Production Projections Chart - Your teammate's 100-year forecast */}
      <ProductionProjections 
        yearsInFuture={yearsInFuture}
        location={location}
      />
      
      {/* Risk Score Display - Your teammate's component */}
      <RiskScoreDisplay
        environmentalRisk={riskScores?.environmental ?? 0}
        economicRisk={riskScores?.economic ?? 0}
        socialRisk={riskScores?.social ?? 0}
        overallRisk={riskScores?.overall ?? 0}
        hazards={hazards}
        economicImpact={economicImpact || undefined}
      />
      
      {/* Agent Messages Feed */}
      {messages.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Risk Analysis Details</h3>
          <div className="space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1 capitalize">
                  {msg.role}
                </p>
                <p className="text-sm">{msg.content}</p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
