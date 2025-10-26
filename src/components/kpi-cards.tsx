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
import type { Recommendation } from "@/types/api"

type TrendDirection = "up" | "down" | "neutral"

interface KpiCardsProps {
  location: { lat: number; lng: number; name: string }
  radius: number
  priorities: {
    economic: number
    environmental: number
    social: number
  }
  impact: Recommendation["impact"] | null
  isAnalyzing: boolean
}

const formatPercent = (value: number): string => {
  const percent = value * 100
  if (Math.abs(percent) < 0.05) {
    return "0.0%"
  }
  return `${percent > 0 ? "+" : ""}${percent.toFixed(1)}%`
}

const getTrendDirection = (value: number): TrendDirection => {
  if (value > 0.005) return "up"
  if (value < -0.005) return "down"
  return "neutral"
}

const describeDelta = (value: number, positive: string, negative: string): string => {
  if (value > 0.005) return positive
  if (value < -0.005) return negative
  return "Stable"
}

const riskLabel = (risk: number): string => {
  if (risk <= -0.25) return "Low"
  if (risk <= -0.05) return "Moderate"
  if (risk < 0.1) return "Stable"
  if (risk < 0.25) return "Elevated"
  return "High"
}

const getTrendIcon = (trend: TrendDirection, className: string) => {
  switch (trend) {
    case "up":
      return <TrendingUpIcon className={`h-4 w-4 ${className}`} />
    case "down":
      return <TrendingDownIcon className={`h-4 w-4 ${className}`} />
    default:
      return <MinusIcon className={`h-4 w-4 ${className}`} />
  }
}

const renderSkeleton = () => (
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

export function KpiCards({ location, radius, priorities, impact, isAnalyzing }: KpiCardsProps) {
  const locationLabel = location?.name ?? "Selected area"
  const prioritySummary = `Econ ${priorities.economic} · Env ${priorities.environmental} · Soc ${priorities.social}`

  if (!impact) {
    return (
      <div className="space-y-2">
        {!isAnalyzing && (
          <Card className="p-4 bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Choose a location and run the analysis to view key performance indicators.
            </p>
          </Card>
        )}
        {renderSkeleton()}
      </div>
    )
  }

  const incomeTrend = getTrendDirection(impact.income)
  const emissionsTrend = getTrendDirection(impact.emissions)
  const foodTrend = getTrendDirection(impact.food)
  const riskTrend = getTrendDirection(impact.risk)

  const cards = [
    {
      key: "economic",
      label: "Economic",
      icon: DollarIcon,
      iconClass: "text-chart-4",
      cardClass: "bg-chart-4/10 border-chart-4/20",
      value: formatPercent(impact.income),
      trend: incomeTrend,
      trendColor:
        incomeTrend === "down" ? "text-destructive" : incomeTrend === "up" ? "text-chart-3" : "text-muted-foreground",
      change: describeDelta(impact.income, "Improving farm incomes", "Declining farm incomes"),
    },
    {
      key: "environmental",
      label: "Environmental",
      icon: LeafIcon,
      iconClass: "text-chart-3",
      cardClass: "bg-chart-3/10 border-chart-3/20",
      value: formatPercent(impact.emissions),
      trend: emissionsTrend,
      trendColor:
        emissionsTrend === "down"
          ? "text-chart-3"
          : emissionsTrend === "up"
            ? "text-destructive"
            : "text-muted-foreground",
      change: describeDelta(impact.emissions, "Rising emissions", "Lower emissions footprint"),
    },
    {
      key: "social",
      label: "Social",
      icon: UsersIcon,
      iconClass: "text-chart-2",
      cardClass: "bg-chart-2/10 border-chart-2/20",
      value: formatPercent(impact.food),
      trend: foodTrend,
      trendColor:
        foodTrend === "down" ? "text-destructive" : foodTrend === "up" ? "text-chart-3" : "text-muted-foreground",
      change: describeDelta(impact.food, "Improved food security", "Lower food availability"),
    },
    {
      key: "risk",
      label: "Risk Level",
      icon: AlertIcon,
      iconClass: "text-destructive",
      cardClass: "bg-destructive/10 border-destructive/20",
      value: riskLabel(impact.risk),
      trend: riskTrend,
      trendColor:
        riskTrend === "down" ? "text-chart-3" : riskTrend === "up" ? "text-destructive" : "text-muted-foreground",
      change:
        Math.abs(impact.risk) < 0.005
          ? "Stable exposure"
          : `${formatPercent(impact.risk)} vs baseline`,
    },
  ] as const

  return (
    <div className="space-y-2">
      <div className="text-xs text-muted-foreground">
        {locationLabel} · {radius} km radius · {prioritySummary}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {cards.map(({ key, label, icon: Icon, iconClass, cardClass, value, trend, trendColor, change }) => (
          <Card key={key} className={`p-4 ${cardClass}`}>
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${iconClass}`} />
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
            <div className="text-xl font-bold text-foreground mb-1">{value}</div>
            <div className="flex items-center gap-1 text-xs">
              {getTrendIcon(trend, trendColor)}
              <span className="text-muted-foreground">{change}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
