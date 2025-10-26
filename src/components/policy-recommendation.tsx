"use client"

import { Card } from "@/components/ui/card"
import {
  AlertIcon,
  DollarIcon,
  LeafIcon,
  MinusIcon,
  TrendingDownIcon,
  TrendingUpIcon,
  UsersIcon,
} from "@/components/icons"
import type { PlanContext, Recommendation, StrategyValue } from "@/types/api"

interface PolicyRecommendationProps {
  recommendation: Recommendation | null
  context: PlanContext | null
  isAnalyzing: boolean
}

const formatPercent = (value: number): string => `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`
const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)

const CHART_GOOD = "text-emerald-400"
const CHART_BAD = "text-rose-400"
const CHART_NEUTRAL = "text-muted-foreground"

const formatCropMix = (value: StrategyValue | undefined): Array<{ crop: string; share: string }> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return []
  }

  return Object.entries(value)
    .filter(([, share]) => typeof share === "number" && share > 0)
    .map(([crop, share]) => ({
      crop,
      share: `${Math.round((share as number) * 100)}%`,
    }))
    .sort((a, b) => Number.parseInt(b.share) - Number.parseInt(a.share))
}

type ActionItem = {
  title: string
  detail?: string
  highlight?: boolean
}

const buildActionPlan = (strategy: Recommendation["strategy"]): ActionItem[] => {
  const actions: ActionItem[] = []

  if (typeof strategy.adaptation_timeline === "string") {
    actions.push({
      title: "Execution timeline",
      detail: strategy.adaptation_timeline,
      highlight: true,
    })
  }

  if (typeof strategy.financing_focus === "string") {
    actions.push({
      title: "Financing approach",
      detail: strategy.financing_focus,
    })
  }

  if (strategy.irrigation === true) {
    actions.push({
      title: "Irrigation upgrades",
      detail: "Prioritise drip or sprinkler systems to stabilise yields during dry spells.",
    })
  }

  if (strategy.water_harvesting === true) {
    actions.push({
      title: "Water harvesting",
      detail: "Add rooftop collection, farm ponds, or contour bunds to capture seasonal rainfall.",
    })
  }

  if (strategy.soil_improvements === true) {
    actions.push({
      title: "Soil health programme",
      detail: "Deploy cover crops, mulching, and biochar to rebuild organic carbon and moisture retention.",
    })
  }

  if (actions.length === 0) {
    actions.push({
      title: "Status",
      detail: "Maintain the current adaptation track; no additional structural shifts required.",
    })
  }

  return actions
}

type JustificationPoint = { heading: string; detail: string }

const describePrecipitation = (anomaly: number): string => {
  if (anomaly <= -30) return `${Math.abs(anomaly).toFixed(0)}% below normal rainfall signals persistent drought pressure.`
  if (anomaly <= -15) return `Rainfall is ${Math.abs(anomaly).toFixed(0)}% below seasonal norms, raising water stress.`
  if (anomaly >= 25) return `Rainfall is ${anomaly.toFixed(0)}% above average, increasing flood and disease risk.`
  if (anomaly >= 10) return `Wetter conditions (+${anomaly.toFixed(0)}%) demand drainage readiness and soil protection.`
  return `Rainfall anomaly of ${anomaly.toFixed(0)}% indicates near-normal moisture availability.`
}

const describeWaterStress = (index: number): string => {
  if (index >= 0.7) return "Severe water stress index (>0.7) makes supplemental irrigation critical."
  if (index >= 0.5) return "Moderate-to-high water stress (>0.5) supports investing in efficient irrigation and storage."
  if (index >= 0.3) return "Moderate water stress (>0.3) warrants water harvesting and soil moisture conservation."
  return "Water stress index remains low, so current water management is adequate."
}

const describeSoilHealth = (index: number): string => {
  if (index <= 0.3) return "Soil health index below 0.3 signals urgent need for organic matter and soil regeneration."
  if (index <= 0.45) return "Soil health around 0.4 calls for active soil improvement to stabilise yields."
  if (index >= 0.65) return "Healthy soils (>0.65) enable scaling resilient practices."
  return "Soil health is moderate; continued enrichment will support crop diversification."
}

const describeRisk = (risk?: string): string | null => {
  if (!risk) return null
  const normalized = risk.toLowerCase()
  if (normalized === "high") return "High extreme-weather risk elevates the value of irrigation, diversification, and finance buffers."
  if (normalized === "medium") return "Medium extreme-weather risk warrants short-term adaptation and early financing commitments."
  if (normalized === "low") return "Low extreme-weather risk allows phased investments while sustaining preparedness."
  return null
}

const buildJustification = (context: PlanContext | null): JustificationPoint[] => {
  if (!context) return []
  const points: JustificationPoint[] = []
  const {
    precipitationAnomaly,
    temperatureAvg,
    extremeWeatherRisk,
    yieldChange,
    waterStress,
    soilHealth,
    incomeChange,
    adaptationCost,
    priorities,
    location,
    radius,
  } = context

  points.push({
    heading: "Regional focus",
    detail: `${location.name} within a ${radius} km radius, with priorities weighted Economic ${priorities.economic} / Environmental ${priorities.environmental} / Social ${priorities.social}.`,
  })

  if (typeof precipitationAnomaly === "number") {
    points.push({
      heading: "Climate signal",
      detail:
        describePrecipitation(precipitationAnomaly) +
        (typeof temperatureAvg === "number" ? ` Avg. temperature ~${temperatureAvg.toFixed(1)}°C.` : ""),
    })
  }

  const riskNote = describeRisk(extremeWeatherRisk)
  if (riskNote) {
    points.push({ heading: "Hazard risk", detail: riskNote })
  }

  if (typeof yieldChange === "number") {
    const yieldMsg =
      yieldChange < 0
        ? `Agronomist projects ${Math.abs(yieldChange).toFixed(0)}% yield losses, hence the diversified crop mix and soil upgrades.`
        : `Yield outlook improves by ${yieldChange.toFixed(0)}%, allowing targeted expansion of resilient crops.`
    points.push({ heading: "Yield outlook", detail: yieldMsg })
  }

  if (typeof waterStress === "number") {
    points.push({ heading: "Water availability", detail: describeWaterStress(waterStress) })
  }

  if (typeof soilHealth === "number") {
    points.push({ heading: "Soil condition", detail: describeSoilHealth(soilHealth) })
  }

  if (typeof incomeChange === "number") {
    const incomeMsg =
      incomeChange < 0
        ? `Economist estimates farm income falling ${Math.abs(incomeChange).toFixed(1)}%, reinforcing the call for phased financing.`
        : `Income uplift of ${incomeChange.toFixed(1)}% can co-fund near-term investments.`
    points.push({ heading: "Economic impact", detail: incomeMsg })
  }

  if (typeof adaptationCost === "number") {
    points.push({
      heading: "Capital needs",
      detail: `Adaptation budget approximates ${formatCurrency(adaptationCost)}, so sequencing investments avoids fiscal shocks.`,
    })
  }

  return points
}

const buildImpactSummary = (impact: Recommendation["impact"]) => {
  const rows = [
    {
      key: "income",
      label: "Farm income",
      value: impact.income,
      positiveSummary: "Higher net farm earnings.",
      negativeSummary: "Lower farm profitability — plan cash-flow buffers.",
      icon: DollarIcon,
      positiveIsGood: true,
    },
    {
      key: "food",
      label: "Food security",
      value: impact.food,
      positiveSummary: "Improved local food availability.",
      negativeSummary: "Reduced access — expand safety nets and storage.",
      icon: UsersIcon,
      positiveIsGood: true,
    },
    {
      key: "emissions",
      label: "Emissions",
      value: impact.emissions,
      positiveSummary: "Higher emissions footprint — invest in offsets and efficiency.",
      negativeSummary: "Lower climate emissions profile.",
      icon: LeafIcon,
      positiveIsGood: false,
    },
    {
      key: "risk",
      label: "Climate risk",
      value: impact.risk,
      positiveSummary: "Higher exposure to climate shocks.",
      negativeSummary: "Reduced vulnerability to extremes.",
      icon: AlertIcon,
      positiveIsGood: false,
    },
  ] as const

  return rows.map((row) => {
    const Icon = row.icon
    const neutral = Math.abs(row.value) < 0.0005
    if (neutral) {
      return {
        key: row.key,
        label: row.label,
        value: formatPercent(row.value),
        description: "No material change detected.",
        icon: <Icon className="h-5 w-5 text-muted-foreground" />,
        trend: <MinusIcon className={`h-4 w-4 ${CHART_NEUTRAL}`} />,
        tone: CHART_NEUTRAL,
      }
    }

    const isPositive = row.value >= 0
    const favourable = row.positiveIsGood ? isPositive : !isPositive
    const TrendIcon = isPositive ? TrendingUpIcon : TrendingDownIcon

    return {
      key: row.key,
      label: row.label,
      value: formatPercent(row.value),
      description: isPositive ? row.positiveSummary : row.negativeSummary,
      icon: <Icon className="h-5 w-5 text-muted-foreground" />,
      trend: <TrendIcon className={`h-4 w-4 ${favourable ? CHART_GOOD : CHART_BAD}`} />,
      tone: favourable ? CHART_GOOD : CHART_BAD,
    }
  })
}

export function PolicyRecommendation({ recommendation, context, isAnalyzing }: PolicyRecommendationProps) {
  if (isAnalyzing) {
    return (
      <Card className="p-5 bg-muted/30 animate-pulse space-y-3">
        <div className="h-4 w-32 bg-muted rounded" />
        <div className="h-6 w-3/4 bg-muted rounded" />
        <div className="h-4 w-1/2 bg-muted rounded" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </Card>
    )
  }

  if (!recommendation) {
    return (
      <Card className="p-5 bg-muted/30">
        <h3 className="text-sm font-semibold text-foreground mb-2">Policy Guidance</h3>
        <p className="text-sm text-muted-foreground">
          Run the analysis to generate a tailored policy recommendation for this region.
        </p>
      </Card>
    )
  }

  const cropMix = formatCropMix(recommendation.strategy?.crop_mix)
  const actions = buildActionPlan(recommendation.strategy)
  const impacts = buildImpactSummary(recommendation.impact)
  const justification = buildJustification(context)

  const timeline =
    typeof recommendation.strategy?.adaptation_timeline === "string"
      ? recommendation.strategy.adaptation_timeline
      : null
  const financing =
    typeof recommendation.strategy?.financing_focus === "string" ? recommendation.strategy.financing_focus : null

  return (
    <Card className="font-sans p-6 md:p-8 rounded-xl border border-border/50 bg-card/90 backdrop-blur-sm shadow-lg space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-foreground uppercase tracking-[0.2em]">Policy Guidance</h3>
          {(timeline || financing) && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              {timeline && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 uppercase tracking-wide">
                  Timeline · {timeline}
                </span>
              )}
              {financing && (
                <span className="px-2.5 py-1 rounded-full bg-sky-500/10 border border-sky-500/40 text-sky-300 uppercase tracking-wide">
                  Financing · {financing}
                </span>
              )}
            </div>
          )}
        </div>
        <p className="text-base leading-7 text-foreground/90">{recommendation.explanation}</p>
      </div>

      <section className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Why this plan fits</h4>
        {justification.length > 0 ? (
          <ul className="space-y-2">
            {justification.map((item, index) => (
              <li key={`${item.heading}-${index}`} className="border border-border/40 rounded-lg bg-background/60 px-4 py-3">
                <div className="text-sm font-semibold text-foreground">{item.heading}</div>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.detail}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground leading-relaxed">
            Awaiting upstream climate and economic signals to justify the policy mix.
          </p>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-12">
        <section className="md:col-span-5 space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Impact Outlook</h4>
          <div className="space-y-3">
            {impacts.map((item) => (
              <div
                key={item.key}
                className="flex items-start gap-3 rounded-lg border border-border/40 bg-background/70 px-4 py-3"
              >
                <div className="mt-1">{item.icon}</div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <div className="flex items-center gap-1">
                      {item.trend}
                      <span className={`font-semibold ${item.tone}`}>{item.value}</span>
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="md:col-span-7 space-y-5">
          {cropMix.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Target Crop Mix</h4>
              <div className="flex flex-wrap gap-2">
                {cropMix.map(({ crop, share }) => (
                  <span
                    key={crop}
                    className="text-xs font-medium px-3 py-1.5 border border-border/40 rounded-full bg-background/60 text-foreground shadow-sm"
                  >
                    {crop} · {share}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Priority Actions</h4>
            <ul className="space-y-2">
              {actions.map((action, index) => (
                <li
                  key={`${action.title}-${index}`}
                  className="border border-border/30 rounded-lg bg-background/60 px-4 py-3 text-sm leading-relaxed text-foreground"
                >
                  <div className="font-semibold">
                    {action.title}
                    {action.detail && !action.detail.startsWith(":") && ":"}
                    {action.detail && ` ${action.detail}`}
                  </div>
                  {action.highlight && (
                    <p className="text-xs text-emerald-300 mt-1 uppercase tracking-wide">Immediate attention</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <div className="text-xs text-muted-foreground/80 border-t border-border/30 pt-3">
        Sources: Open-Meteo observations · LangGraph multi-agent synthesis
      </div>
    </Card>
  )
}
