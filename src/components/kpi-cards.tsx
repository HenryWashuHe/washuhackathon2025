"use client"

import { Card } from "@/components/ui/card"
import {
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  DollarIcon,
  LeafIcon,
  UsersIcon,
  AlertIcon,
} from "@/components/icons"
import { useEffect, useState } from "react"

interface KpiCardsProps {
  location: { lat: number; lng: number; name: string }
  radius: number
  priorities: {
    economic: number
    environmental: number
    social: number
  }
}

interface KpiData {
  economic: { value: string; trend: "up" | "down" | "neutral"; change: string }
  environmental: { value: string; trend: "up" | "down" | "neutral"; change: string }
  social: { value: string; trend: "up" | "down" | "neutral"; change: string }
  risk: { value: string; trend: "up" | "down" | "neutral"; change: string }
}

export function KpiCards({ location, radius, priorities }: KpiCardsProps) {
  const [kpiData, setKpiData] = useState<KpiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    const frame = requestAnimationFrame(() => {
      if (isMounted) {
        setIsLoading(true)
      }
    })

    const timer = window.setTimeout(() => {
      if (!isMounted) {
        return
      }

      setKpiData({
        economic: { value: "$2.4M", trend: "up", change: "+12.5%" },
        environmental: { value: "68/100", trend: "down", change: "-8.2%" },
        social: { value: "7,200", trend: "up", change: "+5.3%" },
        risk: { value: "Medium", trend: "neutral", change: "Stable" },
      })
      setIsLoading(false)
    }, 1500)

    return () => {
      isMounted = false
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [location, radius, priorities])

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUpIcon className="h-4 w-4 text-chart-3" />
      case "down":
        return <TrendingDownIcon className="h-4 w-4 text-destructive" />
      default:
        return <MinusIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 bg-muted/30 animate-pulse">
            <div className="h-4 bg-muted rounded w-20 mb-2" />
            <div className="h-6 bg-muted rounded w-16 mb-1" />
            <div className="h-3 bg-muted rounded w-12" />
          </Card>
        ))}
      </div>
    )
  }

  if (!kpiData) return null

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Economic KPI */}
      <Card className="p-4 bg-chart-4/10 border-chart-4/20">
        <div className="flex items-center gap-2 mb-2">
          <DollarIcon className="h-4 w-4 text-chart-4" />
          <span className="text-xs font-medium text-muted-foreground">Economic</span>
        </div>
        <div className="text-xl font-bold text-foreground mb-1">{kpiData.economic.value}</div>
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon(kpiData.economic.trend)}
          <span className="text-muted-foreground">{kpiData.economic.change}</span>
        </div>
      </Card>

      {/* Environmental KPI */}
      <Card className="p-4 bg-chart-3/10 border-chart-3/20">
        <div className="flex items-center gap-2 mb-2">
          <LeafIcon className="h-4 w-4 text-chart-3" />
          <span className="text-xs font-medium text-muted-foreground">Environmental</span>
        </div>
        <div className="text-xl font-bold text-foreground mb-1">{kpiData.environmental.value}</div>
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon(kpiData.environmental.trend)}
          <span className="text-muted-foreground">{kpiData.environmental.change}</span>
        </div>
      </Card>

      {/* Social KPI */}
      <Card className="p-4 bg-chart-2/10 border-chart-2/20">
        <div className="flex items-center gap-2 mb-2">
          <UsersIcon className="h-4 w-4 text-chart-2" />
          <span className="text-xs font-medium text-muted-foreground">Social</span>
        </div>
        <div className="text-xl font-bold text-foreground mb-1">{kpiData.social.value}</div>
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon(kpiData.social.trend)}
          <span className="text-muted-foreground">{kpiData.social.change}</span>
        </div>
      </Card>

      {/* Risk KPI */}
      <Card className="p-4 bg-destructive/10 border-destructive/20">
        <div className="flex items-center gap-2 mb-2">
          <AlertIcon className="h-4 w-4 text-destructive" />
          <span className="text-xs font-medium text-muted-foreground">Risk Level</span>
        </div>
        <div className="text-xl font-bold text-foreground mb-1">{kpiData.risk.value}</div>
        <div className="flex items-center gap-1 text-xs">
          {getTrendIcon(kpiData.risk.trend)}
          <span className="text-muted-foreground">{kpiData.risk.change}</span>
        </div>
      </Card>
    </div>
  )
}
