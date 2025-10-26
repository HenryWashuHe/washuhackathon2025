"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { AlertTriangle, Thermometer, DollarSign, Shield } from "lucide-react"

interface RiskScoreDisplayProps {
  environmentalRisk: number // 0-100
  economicRisk: number // 0-100
  overallRisk: number // 0-100
  hazards?: string[]
  economicImpact?: {
    annual_loss_per_capita: number
    adaptation_cost?: number
    property_value_change?: number
  }
}

export function RiskScoreDisplay({
  environmentalRisk,
  economicRisk,
  overallRisk,
  hazards = [],
  economicImpact
}: RiskScoreDisplayProps) {
  
  const getRiskLevel = (score: number): { label: string; color: string; bgColor: string } => {
    if (score >= 80) return { label: "EXTREME", color: "text-red-600", bgColor: "bg-red-500" }
    if (score >= 60) return { label: "HIGH", color: "text-orange-600", bgColor: "bg-orange-500" }
    if (score >= 40) return { label: "MODERATE", color: "text-yellow-600", bgColor: "bg-yellow-500" }
    if (score >= 20) return { label: "LOW-MODERATE", color: "text-blue-600", bgColor: "bg-blue-500" }
    return { label: "LOW", color: "text-green-600", bgColor: "bg-green-500" }
  }

  const overall = getRiskLevel(overallRisk)
  const environmental = getRiskLevel(environmentalRisk)
  const economic = getRiskLevel(economicRisk)

  return (
    <div className="space-y-4">
      {/* Overall Risk Score - Large Display */}
      <Card className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <Label className="text-lg font-bold text-white">Overall Climate Risk</Label>
          <Shield className="h-6 w-6 text-slate-400" />
        </div>
        
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <div className={`text-5xl font-bold mb-2 ${overall.color}`}>
              {overallRisk.toFixed(0)}
            </div>
            <div className={`text-xl font-semibold ${overall.color}`}>
              {overall.label} RISK
            </div>
          </div>
          
          {/* Risk gauge visualization */}
          <div className="flex-1">
            <div className="h-4 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${overall.bgColor} transition-all duration-500`}
                style={{ width: `${overallRisk}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0</span>
              <span>50</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Environmental & Economic Risk Breakdown */}
      <div className="grid grid-cols-2 gap-4">
        {/* Environmental Risk */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <Thermometer className="h-4 w-4 text-chart-3" />
            <Label className="text-sm font-medium">Environmental Risk</Label>
          </div>
          
          <div className={`text-3xl font-bold mb-2 ${environmental.color}`}>
            {environmentalRisk.toFixed(0)}
          </div>
          
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full ${environmental.bgColor} transition-all duration-500`}
              style={{ width: `${environmentalRisk}%` }}
            />
          </div>
          
          <p className={`text-xs font-semibold ${environmental.color}`}>
            {environmental.label}
          </p>
        </Card>

        {/* Economic Risk */}
        <Card className="p-4 bg-muted/30">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-chart-4" />
            <Label className="text-sm font-medium">Economic Risk</Label>
          </div>
          
          <div className={`text-3xl font-bold mb-2 ${economic.color}`}>
            {economicRisk.toFixed(0)}
          </div>
          
          <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
            <div 
              className={`h-full ${economic.bgColor} transition-all duration-500`}
              style={{ width: `${economicRisk}%` }}
            />
          </div>
          
          <p className={`text-xs font-semibold ${economic.color}`}>
            {economic.label}
          </p>
        </Card>
      </div>

      {/* Primary Hazards */}
      {hazards.length > 0 && (
        <Card className="p-4 bg-orange-500/10 border-orange-500/20">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <Label className="text-sm font-medium">Primary Environmental Hazards</Label>
          </div>
          <div className="space-y-2">
            {hazards.slice(0, 5).map((hazard, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                <span className="text-sm text-foreground">{hazard}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Economic Impact Summary */}
      {economicImpact && (
        <Card className="p-4 bg-muted/30">
          <Label className="text-sm font-medium mb-3 block">Economic Impact Estimates</Label>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Annual losses per capita:</span>
              <span className="font-semibold">
                ${economicImpact.annual_loss_per_capita.toLocaleString()}
              </span>
            </div>
            {economicImpact.adaptation_cost && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Adaptation costs:</span>
                <span className="font-semibold">
                  ${(economicImpact.adaptation_cost * 1000).toLocaleString()}
                </span>
              </div>
            )}
            {economicImpact.property_value_change !== undefined && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Property value change:</span>
                <span className={`font-semibold ${economicImpact.property_value_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {economicImpact.property_value_change > 0 ? '+' : ''}{economicImpact.property_value_change.toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}