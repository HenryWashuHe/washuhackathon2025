export interface Location {
  lat: number
  lng: number
  name: string
}

export interface Priorities {
  economic: number
  environmental: number
  social: number
}

export interface AnalyzeRequest {
  center: { lat: number; lon: number }
  radius_km: number
  objectives: { food: number; income: number; emissions: number; risk: number }
  region_hint: string
}

export interface AnalyzeResponse {
  debate_id: string
  initial_kpis: {
    rainfall_delta: number
    yield_change: number
    income_change: number
    emissions_delta: number
    risk_delta: number
  }
}

export interface DebateMessage {
  agent: "Meteorologist" | "Agronomist" | "Economist" | "Planner"
  message: string
  claims?: Array<{ metric: string; value: number; unit: string }>
  step: number
  ts: string
}

export interface ConsensusMessage {
  type: "consensus"
  message: string
  ts: string
}

export type StrategyValue = string | number | boolean | Record<string, string | number | boolean>

export interface Recommendation {
  strategy: Record<string, StrategyValue>
  impact: {
    food: number
    income: number
    emissions: number
    risk: number
  }
  sources: Array<{
    provider: string
    retrieved_at: string
  }>
  explanation: string
}
