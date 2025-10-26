"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import type { AnalysisOutcome } from "@/components/analysis-results"

interface ExplainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendation: AnalysisOutcome | null
}

export function ExplainModal({ open, onOpenChange, recommendation }: ExplainModalProps) {
  if (!recommendation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Climate Risk Analysis Explanation</DialogTitle>
          <DialogDescription>Risk assessment methodology and data sources</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Analysis Overview</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This climate livability assessment combines real-time meteorological data with AI-powered analysis 
              to evaluate environmental and economic risks. Our multi-agent system analyzes climate patterns, 
              extreme weather events, and economic impacts to provide a comprehensive risk score.
            </p>
          </div>

          {recommendation.riskScores && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Risk Scores</h3>
              <div className="grid grid-cols-4 gap-2">
                <Card className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Environmental</div>
                  <div className="text-lg font-bold text-orange-600">
                    {recommendation.riskScores.environmental}/100
                  </div>
                </Card>
                <Card className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Economic</div>
                  <div className="text-lg font-bold text-orange-600">
                    {recommendation.riskScores.economic}/100
                  </div>
                </Card>
                <Card className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Social</div>
                  <div className="text-lg font-bold text-orange-600">
                    {recommendation.riskScores.social}/100
                  </div>
                </Card>
                <Card className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground">Overall</div>
                  <div className="text-lg font-bold text-red-600">
                    {recommendation.riskScores.overall}/100
                  </div>
                </Card>
              </div>
            </div>
          )}

          {recommendation.hazards && recommendation.hazards.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Identified Climate Hazards</h3>
              <div className="flex flex-wrap gap-2">
                {recommendation.hazards.map((hazard, index) => (
                  <Card key={index} className="px-3 py-2 bg-orange-50 border-orange-200">
                    <span className="text-sm font-medium text-orange-700 capitalize">{hazard}</span>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {recommendation.economicImpact && (
            <div>
              <h3 className="text-sm font-semibold mb-3 text-foreground">Economic Impact Projections</h3>
              <div className="space-y-2">
                <Card className="p-3 bg-muted/30">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual Loss Per Capita</span>
                    <span className="text-lg font-bold text-red-600">
                      ${recommendation.economicImpact.annual_loss_per_capita.toLocaleString()}
                    </span>
                  </div>
                </Card>
                {recommendation.economicImpact.adaptation_cost !== undefined && (
                  <Card className="p-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Estimated Adaptation Cost</span>
                      <span className="text-lg font-bold">
                        ${recommendation.economicImpact.adaptation_cost.toLocaleString()}
                      </span>
                    </div>
                  </Card>
                )}
                {recommendation.economicImpact.property_value_change !== undefined && (
                  <Card className="p-3 bg-muted/30">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Property Value Change</span>
                      <span className={`text-lg font-bold ${recommendation.economicImpact.property_value_change < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {recommendation.economicImpact.property_value_change > 0 ? '+' : ''}
                        {recommendation.economicImpact.property_value_change}%
                      </span>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Data Sources</h3>
            <div className="space-y-2">
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Open-Meteo Climate API</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </Card>
              <Card className="p-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">AI Multi-Agent Analysis</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date().toLocaleString()}
                  </span>
                </div>
              </Card>
            </div>
          </div>

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-semibold mb-2 text-foreground">Methodology</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Risk scores are calculated based on temperature extremes, precipitation patterns, wind speeds, 
              and geographic factors. Our AI agents (Meteorologist, Economist, and Planner) analyze these 
              factors collaboratively to provide comprehensive insights. Economic impacts are estimated based 
              on historical correlations between climate events and financial losses.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
