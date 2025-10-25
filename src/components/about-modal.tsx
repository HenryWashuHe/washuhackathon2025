"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface AboutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutModal({ open, onOpenChange }: AboutModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>About SCDS</DialogTitle>
          <DialogDescription>Smart Climate Decision System</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 text-sm text-foreground">
          <p>
            The Smart Climate Decision System (SCDS) is an AI-powered tool that helps decision-makers analyze climate
            impacts and develop adaptive strategies for specific geographic regions.
          </p>
          <div>
            <h3 className="font-semibold mb-2">How It Works</h3>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Select a location on the map or search for a specific area</li>
              <li>Adjust the radius to define your area of interest</li>
              <li>Set priority weights for economic, environmental, and social factors</li>
              <li>Click &ldquo;Analyze&rdquo; to start a multi-agent AI debate</li>
              <li>Review KPIs, charts, and recommendations</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2">AI Agents</h3>
            <ul className="space-y-1 text-muted-foreground">
              <li>
                <strong>Meteorologist:</strong> Analyzes climate and weather patterns
              </li>
              <li>
                <strong>Agronomist:</strong> Evaluates agricultural impacts
              </li>
              <li>
                <strong>Economist:</strong> Assesses economic implications
              </li>
              <li>
                <strong>Planner:</strong> Synthesizes recommendations
              </li>
            </ul>
          </div>
          <div className="pt-4 border-t border-border">
            <h3 className="font-semibold mb-2">Data & Privacy</h3>
            <p className="text-muted-foreground text-xs">
              This system uses AI models to generate analysis based on location data. Results are simulated for
              demonstration purposes. No personal data is collected or stored. For production use, integrate with real
              climate data sources.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
