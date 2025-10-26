/**
 * Open-Meteo API Integration
 * Fetches historical and forecast climate data for a given location
 * API Docs: https://open-meteo.com/en/docs
 */

export interface ClimateData {
  location: {
    lat: number
    lon: number
  }
  historical: {
    temperature_avg: number // °C
    precipitation_sum: number // mm
    precipitation_anomaly: number // % change from normal
  }
  forecast: {
    temperature_trend: number // °C change projected
    precipitation_trend: number // % change projected
    extreme_weather_risk: "low" | "medium" | "high"
  }
  context: {
    climate_zone: ClimateZone
    seasonal_pattern: string
    typical_hazards: string[]
    heatwave_risk: HeatwaveRisk
    cold_extreme_risk: ColdExtremeRisk
  }
  metadata: {
    data_start: string
    data_end: string
    retrieved_at: string
  }
}

interface OpenMeteoHistoricalResponse {
  daily: {
    time: string[]
    temperature_2m_mean: number[]
    precipitation_sum: number[]
  }
}

/**
 * Fetch historical climate data from Open-Meteo API
 */
async function fetchHistoricalData(lat: number, lon: number): Promise<OpenMeteoHistoricalResponse> {
  // Get data for past 90 days
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 90)

  const startStr = startDate.toISOString().split("T")[0]
  const endStr = endDate.toISOString().split("T")[0]

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startStr}&end_date=${endStr}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  })

  if (!response.ok) {
    throw new Error(`Open-Meteo API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

/**
 * Calculate climate metrics and anomalies
 */
function calculateClimateMetrics(data: OpenMeteoHistoricalResponse): {
  temperature_avg: number
  precipitation_sum: number
  precipitation_anomaly: number
} {
  const temps = data.daily.temperature_2m_mean.filter((t) => t !== null)
  const precip = data.daily.precipitation_sum.filter((p) => p !== null)

  const temperature_avg = temps.reduce((sum, t) => sum + t, 0) / temps.length
  const precipitation_sum = precip.reduce((sum, p) => sum + p, 0)

  // Calculate anomaly by comparing to expected normal (simplified)
  // In production, compare to 30-year climatology
  const expected_precip = 75 * 3 // ~75mm/month * 3 months
  const precipitation_anomaly = ((precipitation_sum - expected_precip) / expected_precip) * 100

  return {
    temperature_avg: Math.round(temperature_avg * 10) / 10,
    precipitation_sum: Math.round(precipitation_sum * 10) / 10,
    precipitation_anomaly: Math.round(precipitation_anomaly * 10) / 10,
  }
}

/**
 * Determine extreme weather risk based on anomalies
 */
type ClimateZone = "Polar" | "Subpolar" | "Temperate" | "Tropical" | "Arid"
type HeatwaveRisk = "very low" | "low" | "moderate" | "high"
type ColdExtremeRisk = "low" | "moderate" | "high" | "very high"

function classifyClimateZone(lat: number, tempAvg: number, meanMonthlyPrecip: number): ClimateZone {
  const latitude = Math.abs(lat)

  if (latitude >= 66 || tempAvg <= -5) {
    return "Polar"
  }

  if (latitude >= 55) {
    return "Subpolar"
  }

  if (meanMonthlyPrecip < 15 && tempAvg > 18) {
    return "Arid"
  }

  if (latitude < 23.5) {
    return "Tropical"
  }

  return "Temperate"
}

function describeSeasonalPattern(zone: ClimateZone, lat: number): string {
  switch (zone) {
    case "Polar":
      return "Long dark winters well below freezing with brief, cool summers near the freezing point."
    case "Subpolar":
      return "Short, mild summers and long, stormy winters with frequent snow and ice."
    case "Arid":
      return "Hot days with large diurnal swings, very limited rainfall, and prolonged dry seasons."
    case "Tropical":
      return "Warm temperatures year-round with wet and dry seasons driven by monsoonal shifts."
    default:
      return lat >= 0
        ? "Moderate seasonal swings with warm summers and cool, wetter winters."
        : "Moderate seasonal swings with mild winters and wetter cool seasons."
  }
}

function getTypicalHazards(
  zone: ClimateZone,
  metrics: { temperature_avg: number; precipitation_sum: number; precipitation_anomaly: number }
): string[] {
  const hazards = new Set<string>()

  const add = (value: string) => {
    if (value.trim()) {
      hazards.add(value)
    }
  }

  switch (zone) {
    case "Polar": {
      add("Glacial instability")
      add("Sea ice loss")
      add("Extreme cold")
      add("Coastal erosion from ice shelf change")
      break
    }
    case "Subpolar": {
      add("Winter storms")
      add("Blizzards")
      add("Permafrost thaw")
      add("Coastal flooding from storm surge")
      if (metrics.temperature_avg > 0 && metrics.precipitation_anomaly <= -10) {
        add("Wildfires")
      }
      break
    }
    case "Arid": {
      add("Extreme heat")
      add("Water scarcity")
      add("Dust storms")
      add("Flash flooding after rare storms")
      add("Wildfires")
      break
    }
    case "Tropical": {
      add("Tropical cyclones")
      add("Extreme rainfall")
      add("River flooding")
      add("Heat stress")
      if (metrics.precipitation_anomaly <= -15) {
        add("Wildfires")
      }
      break
    }
    default: {
      add("Heavy rainfall")
      add("River flooding")
      add("Wind storms")
      add("Heatwaves during summer")
      if (metrics.temperature_avg >= 18 || metrics.precipitation_anomaly <= -10) {
        add("Wildfires")
      }
      break
    }
  }

  if (metrics.precipitation_anomaly >= 20) {
    add("Extreme precipitation")
  } else if (metrics.precipitation_anomaly <= -20) {
    add("Drought conditions")
  }

  return Array.from(hazards)
}

function evaluateHeatwaveRisk(zone: ClimateZone, tempAvg: number, projectedTrend: number): HeatwaveRisk {
  if (zone === "Polar") {
    return "very low"
  }

  if (zone === "Subpolar") {
    return projectedTrend >= 1.5 ? "moderate" : "low"
  }

  if (zone === "Arid") {
    return projectedTrend >= 1.2 || tempAvg > 28 ? "high" : "moderate"
  }

  if (zone === "Tropical") {
    return tempAvg > 26 || projectedTrend >= 1 ? "moderate" : "low"
  }

  return tempAvg > 24 || projectedTrend >= 1 ? "moderate" : "low"
}

function evaluateColdExtremeRisk(zone: ClimateZone, tempAvg: number): ColdExtremeRisk {
  if (zone === "Polar") {
    return "very high"
  }

  if (zone === "Subpolar" || tempAvg < 0) {
    return "high"
  }

  if (tempAvg < 5) {
    return "moderate"
  }

  return "low"
}

function estimateTemperatureTrend(zone: ClimateZone, precipAnomaly: number): number {
  const base = (() => {
    switch (zone) {
      case "Polar":
        return 1.8
      case "Subpolar":
        return 1.3
      case "Arid":
        return 1.1
      case "Tropical":
        return 0.9
      default:
        return 1.0
    }
  })()

  const anomalyAdjustment = Math.max(-0.3, Math.min(0.3, precipAnomaly / 100))
  return Math.round((base + anomalyAdjustment) * 10) / 10
}

function assessExtremeWeatherRisk(
  precipAnomaly: number,
  heatwaveRisk: HeatwaveRisk,
  coldRisk: ColdExtremeRisk
): "low" | "medium" | "high" {
  const anomalyLevel = Math.abs(precipAnomaly) > 30 ? 2 : Math.abs(precipAnomaly) > 15 ? 1 : 0

  const heatSeverity = {
    "very low": 0,
    low: 1,
    moderate: 2,
    high: 3,
  } as const

  const coldSeverity = {
    low: 0,
    moderate: 1,
    high: 2,
    "very high": 3,
  } as const

  const combined = Math.max(anomalyLevel, heatSeverity[heatwaveRisk], coldSeverity[coldRisk])

  if (combined >= 3) return "high"
  if (combined >= 1) return "medium"
  return "low"
}

function normalizeHazardText(values: string[]): string[] {
  const seen = new Set<string>()
  return values
    .map((value) =>
      value
        .trim()
        .replace(/\.$/, "")
        .replace(/\s+/g, " ")
    )
    .filter((value) => {
      if (!value || value.length < 3) return false
      const key = value.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
}

/**
 * Main function: Fetch and analyze climate data for a location
 */
export async function getClimateData(lat: number, lon: number): Promise<ClimateData> {
  try {
    const historical = await fetchHistoricalData(lat, lon)
    const metrics = calculateClimateMetrics(historical)
    const meanMonthlyPrecip = metrics.precipitation_sum / 3
    const climateZone = classifyClimateZone(lat, metrics.temperature_avg, meanMonthlyPrecip)
    const temperature_trend = estimateTemperatureTrend(climateZone, metrics.precipitation_anomaly)
    const heatwave_risk = evaluateHeatwaveRisk(climateZone, metrics.temperature_avg, temperature_trend)
    const cold_extreme_risk = evaluateColdExtremeRisk(climateZone, metrics.temperature_avg)
    const risk = assessExtremeWeatherRisk(metrics.precipitation_anomaly, heatwave_risk, cold_extreme_risk)
    const precipitation_trend = Math.round(metrics.precipitation_anomaly * 10) / 10
    const seasonal_pattern = describeSeasonalPattern(climateZone, lat)
    const typical_hazards = normalizeHazardText(getTypicalHazards(climateZone, metrics))

    return {
      location: { lat, lon },
      historical: metrics,
      forecast: {
        temperature_trend,
        precipitation_trend,
        extreme_weather_risk: risk,
      },
      context: {
        climate_zone: climateZone,
        seasonal_pattern,
        typical_hazards,
        heatwave_risk,
        cold_extreme_risk,
      },
      metadata: {
        data_start: historical.daily.time[0],
        data_end: historical.daily.time[historical.daily.time.length - 1],
        retrieved_at: new Date().toISOString(),
      },
    }
  } catch (error) {
    console.error("[open-meteo] Failed to fetch climate data:", error)
    throw error
  }
}

/**
 * Format climate data for AI agent consumption
 */
export function formatClimateDataForAgent(data: ClimateData): string {
  const { historical, forecast } = data

  return `
Climate Data Analysis (${data.metadata.data_start} to ${data.metadata.data_end}):
- Average Temperature: ${historical.temperature_avg}°C
- Total Precipitation: ${historical.precipitation_sum}mm (90 days)
- Precipitation Anomaly: ${historical.precipitation_anomaly > 0 ? "+" : ""}${historical.precipitation_anomaly}% from normal
- Projected Temperature Change: +${forecast.temperature_trend}°C by 2030
- Projected Precipitation Trend: ${forecast.precipitation_trend > 0 ? "+" : ""}${forecast.precipitation_trend}%
- Extreme Weather Risk: ${forecast.extreme_weather_risk.toUpperCase()}
- Climate Zone: ${data.context.climate_zone}
- Seasonal Pattern: ${data.context.seasonal_pattern}
- Typical Hazards: ${data.context.typical_hazards.join(", ")}
- Heatwave Likelihood: ${data.context.heatwave_risk.toUpperCase()}
- Cold Extreme Likelihood: ${data.context.cold_extreme_risk.toUpperCase()}
  `.trim()
}
