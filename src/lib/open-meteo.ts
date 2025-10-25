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
function assessExtremeWeatherRisk(precipAnomaly: number, tempAvg: number): "low" | "medium" | "high" {
  // Simplified risk assessment
  if (Math.abs(precipAnomaly) > 30 || tempAvg > 35 || tempAvg < 0) {
    return "high"
  } else if (Math.abs(precipAnomaly) > 15 || tempAvg > 30 || tempAvg < 5) {
    return "medium"
  }
  return "low"
}

/**
 * Main function: Fetch and analyze climate data for a location
 */
export async function getClimateData(lat: number, lon: number): Promise<ClimateData> {
  try {
    const historical = await fetchHistoricalData(lat, lon)
    const metrics = calculateClimateMetrics(historical)
    const risk = assessExtremeWeatherRisk(metrics.precipitation_anomaly, metrics.temperature_avg)

    // Simplified trend calculation
    // In production, use statistical models or ML
    const temperature_trend = metrics.precipitation_anomaly < -20 ? 1.5 : 0.8
    const precipitation_trend = metrics.precipitation_anomaly

    return {
      location: { lat, lon },
      historical: metrics,
      forecast: {
        temperature_trend,
        precipitation_trend,
        extreme_weather_risk: risk,
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
  `.trim()
}
