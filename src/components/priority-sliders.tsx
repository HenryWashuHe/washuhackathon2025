"use client"

import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { DollarIcon, LeafIcon, UsersIcon } from "@/components/icons"

interface PrioritySlidersProps {
  priorities: {
    economic: number
    environmental: number
    social: number
  }
  onChange: (priorities: { economic: number; environmental: number; social: number }) => void
}

export function PrioritySliders({ priorities, onChange }: PrioritySlidersProps) {
  const handleChange = (key: keyof typeof priorities, value: number) => {
    onChange({ ...priorities, [key]: value })
  }

  return (
    <Card className="p-4 bg-muted/30">
      <Label className="text-sm font-medium mb-4 block">Decision Priorities</Label>
      <div className="space-y-4">
        {/* Economic Priority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarIcon className="h-4 w-4 text-chart-4" />
              <span className="text-sm text-foreground">Economic Impact</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{priorities.economic}%</span>
          </div>
          <Input
            type="range"
            min="0"
            max="100"
            step="5"
            value={priorities.economic}
            onChange={(e) => handleChange("economic", Number(e.target.value))}
            className="w-full font-normal leading-7"
          />
        </div>

        {/* Environmental Priority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LeafIcon className="h-4 w-4 text-chart-3" />
              <span className="text-sm text-foreground">Environmental Impact</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{priorities.environmental}%</span>
          </div>
          <Input
            type="range"
            min="0"
            max="100"
            step="5"
            value={priorities.environmental}
            onChange={(e) => handleChange("environmental", Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Social Priority */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4 text-chart-2" />
              <span className="text-sm text-foreground">Social Impact</span>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{priorities.social}%</span>
          </div>
          <Input
            type="range"
            min="0"
            max="100"
            step="5"
            value={priorities.social}
            onChange={(e) => handleChange("social", Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-3">
        Adjust priorities to weight the analysis toward your decision criteria
      </p>
    </Card>
  )
}
