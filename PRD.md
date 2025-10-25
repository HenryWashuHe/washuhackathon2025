SMART CLIMATE DECISION SYSTEM (SCDS)

Project Type: Multi-agent AI web app
Goal: Build a real-time platform where AI agents debate climate strategies for a selected region, using real weather + agriculture data.

[1] PURPOSE
Build a multi-agent AI platform (FastAPI + LangGraph + Next.js)
→ Users pick a region (map pin or lat/lon)
→ Backend agents fetch real data (Open-Meteo, FAOSTAT)
→ Agents debate trade-offs (food, income, emissions, risk)
→ Frontend streams debate logs and shows optimized recommendation

[2] CORE OBJECTIVE

Deliver an MVP in 24 hours (working demo)

Prove that AI + data + optimization → better climate decisions

Frontend must be interactive and map-first

Backend must be modular and easy to extend (new agents later)

[3] TECH STACK
Frontend:
  Framework: Next.js 15 (App Router)
  Styling: TailwindCSS (dark mode)
  Charts: Chart.js via react-chartjs-2
  Map: Mapbox GL JS
  Animations: Framer Motion
  State: React + Context API
  Socket: socket.io-client (for live debate)
  Deployment: Vercel

Backend:
  Framework: FastAPI (Python 3.11)
  Agents: LangGraph / CrewAI
  Optimization: OR-Tools (linear / heuristic)
  Data Validation: Pydantic
  Realtime: socket.io (ASGI)
  Cache/DB: Supabase (Postgres) + Redis
  Deployment: Render or Fly.io

External Data:
  - Open-Meteo API (weather anomalies)
  - FAOSTAT API (crop prices, yields)
  - Optional: NASA Earthdata (vegetation index)

[4] FRONTEND STRUCTURE
Pages:
  /:
    Components:
      - Header
      - MapCanvas
      - ControlsPanel
      - DebateFeed
      - KPICards
      - ChartsPanel
      - ExplainModal
      - AboutModal
Global State:
  center {lat, lon}
  radius_km
  debate_id
  objectives {food, income, emissions, risk}
  current_kpis
  last_recommendation

[5] FRONTEND UX FLOW
1. Map opens → user can search place, enter lat/lon, or drag pin
2. Radius circle (AOI) appears (default 100 km)
3. User adjusts sliders (Food / Income / Emissions / Risk)
4. User clicks “Analyze”
5. Frontend POST /analyze → backend starts agent debate
6. WebSocket /stream/{debate_id} streams live agent messages
7. KPIs, charts, and recommendations update dynamically
8. User can “Recalculate” if sliders change
9. User clicks “Explain” → modal shows sources and reasoning

[6] BACKEND ARCHITECTURE
FastAPI endpoints:
  POST /analyze
    input:
      - center {lat, lon}
      - radius_km
      - objectives {food, income, emissions, risk}
      - region_hint
    output:
      - debate_id
      - initial_kpis
    behavior:
      - orchestrates agents sequentially
      - emits messages to WebSocket channel

  GET /stream/{debate_id}
    - socket.io WebSocket emitting structured agent messages
    message format:
      {
        "agent": "Meteorologist",
        "message": "Rainfall down 20%",
        "claims": [{"metric":"rainfall_delta","value":-0.20}],
        "step": 1
      }

  GET /recommendation/{debate_id}
    - returns final plan + KPI deltas + explanation + sources

[7] AGENT LOGIC
Agent Summary Table
Agent	Inputs	Outputs	Notes
🌦 Meteorologist	lat/lon, radius	rainfall anomaly, drought risk	fetch Open-Meteo
🌾 Agronomist	rainfall	yield changes per crop	simple rule model
💰 Economist	yield, price index	income delta	uses FAOSTAT
🧭 Planner	all agent outputs + objectives	optimized crop mix + irrigation	OR-Tools linear optimization
🔍 Verifier	all outputs	checks data validity/confidence	optional
Example Message Pipeline
rainfall = get_rainfall(lat, lon)
yields = estimate_yield_change(rainfall)
income = calc_income(yields, prices)
plan = optimize_strategy(yields, income, objectives)
verify(plan)
emit_stream(plan)

[8] OPTIMIZATION FUNCTION
# Objective: maximize weighted sum
score = α*FoodSecurity + β*IncomeStability - γ*Emissions - δ*Risk
# Decision variables: crop fractions {maize, sorghum, wheat}, irrigation boolean
# Constraints:
#   sum(crop_fractions) == 1
#   cost <= budget
#   0 <= crop_fraction_i <= 1

[9] DATA MODELS
Request Schema
class AnalyzeRequest(BaseModel):
    center: dict
    radius_km: float
    objectives: dict
    region_hint: str

Debate Message
{
  "agent": "Economist",
  "message": "Income expected to fall by 5%",
  "claims": [{"metric":"income_delta","value":-0.05}],
  "step": 3,
  "ts": "2025-10-25T05:10Z"
}

Recommendation Response
{
  "strategy": {"maize":0.70,"sorghum":0.30,"irrigation_subsidy":true},
  "impact": {"food":0.04,"income":0.05,"emissions":-0.01,"risk":-0.12},
  "sources": ["open-meteo","faostat"],
  "explanation": "Switching 30% maize to sorghum reduces drought loss; irrigation offsets income dip."
}

[10] FRONTEND DESIGN SPEC
Color Palette:
  bg: #0B1220
  panel: #0F172A
  text: #E5E7EB
  brand: #2DD4BF
  danger: #EF4444
  success: #22C55E
  stroke: #1F2937

Layout:
  Desktop: Map left (65%) | Right panel (35%)
  Mobile: Map top | Bottom drawer for results
Components:
  - Card (rounded-2xl, bg-panel)
  - Button (brand-filled, hover-opacity-90)
  - Slider (label, live value)
  - Toast (top-right errors)
  - ChartCard (reusable container for Chart.js)
Motion:
  Framer Motion fade+slide for debate messages
  Highlight KPI cards on update

[11] BUILD TIMELINE (24H)
H0–2: setup repos, roles, FastAPI skeleton, Next.js boilerplate
H2–6: build agents + data adapters (Open-Meteo, FAOSTAT)
H6–10: integrate Planner (optimization) + /analyze API
H10–14: build Map + ControlsPanel + Analyze flow
H14–18: DebateFeed stream + KPICards + Charts
H18–22: Explain modal + polish + error states
H22–24: final integration, test demo, record backup video

[12] DEMO FLOW SCRIPT
1. “We built an AI climate council.”
2. User selects Kenya on map (pin drops, radius 100km)
3. Click “Analyze” → agents debate live
4. Meteorologist says rainfall ↓20%
5. Agronomist says maize yield ↓15%
6. Economist says income ↓5%
7. Planner says: switch 30% maize→sorghum
8. Dashboard shows +4% resilience, +5% income, −1% emissions
9. User slides priorities toward Environment → re-optimization
10. “Explain” modal shows reasoning + data sources

[13] SCALABILITY PLAN
Phase1: MVP (1 region, 4 agents)
Phase2: Multi-region + caching
Phase3: Add new agents (energy, water)
Phase4: ML prediction models + human feedback
Phase5: API-as-a-service for governments/NGOs

[14] RISK CONTROL
Risk	Mitigation
API timeout	Cache recent responses
OR-Tools fail	Use heuristic fallback
Slow stream	Emit static debate log
Missing data	Show “approximation” warning
Latency	Prefetch data async before debate
[15] SUCCESS CRITERIA
- Full request→stream→recommendation cycle works (<5s)
- 2 APIs integrated with real data
- UI interactive (pin drag, sliders, explain modal)
- Judges find it intuitive and transparent

[16] PITCH ONE-LINER

“SCDS is an AI climate council that debates data live — so humans can plan smarter, faster, and more sustainably.”

✅ IDE Instruction Notes

Use modular file structure.

Comment each API endpoint and agent logic.

Use TypeScript interfaces on frontend.

Add .env.local.example (MAPBOX_TOKEN, API_BASE).

Keep Tailwind config simple; prefer semantic classnames.

Use socket.io for real-time updates (frontend + backend).

Ensure easy local run: npm run dev (frontend), uvicorn main:app (backend).
