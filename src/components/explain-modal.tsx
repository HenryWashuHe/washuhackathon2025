"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import type { Recommendation } from "@/types/api"

interface ExplainModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recommendation: Recommendation | null
}

export function ExplainModal({ open, onOpenChange, recommendation }: ExplainModalProps) {
  if (!recommendation) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Analysis Explanation</DialogTitle>
          <DialogDescription>Data sources and recommendation details</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Explanation</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{recommendation.explanation}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Data Sources</h3>
            <div className="space-y-2">
              {recommendation.sources.map((source, index) => (
                <Card key={index} className="p-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {source.provider.replace("-", " ")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(source.retrieved_at).toLocaleString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Projected Impact</h3>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(recommendation.impact).map(([key, value]) => (
                <Card key={key} className="p-3 bg-muted/30">
                  <div className="text-xs text-muted-foreground capitalize">{key}</div>
                  <div className={`text-lg font-bold ${value >= 0 ? "text-chart-3" : "text-destructive"}`}>
                    {value >= 0 ? "+" : ""}
                    {(value * 100).toFixed(1)}%
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
