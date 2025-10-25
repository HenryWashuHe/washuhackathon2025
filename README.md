# SCDS - Smart Climate Decision System

An AI-powered multi-agent platform that analyzes climate data and provides actionable climate adaptation strategies using real-time weather data and AI agents.

## Features

- 🗺️ **Interactive Map**: Select any location worldwide with Mapbox integration
- 🌦️ **Real Climate Data**: Fetches actual weather patterns from Open-Meteo API
- 🤖 **AI Agent Debate**: Four specialized agents (Meteorologist, Agronomist, Economist, Planner) analyze and discuss climate impacts
- 📊 **Data Visualization**: Charts showing rainfall trends and crop yield projections
- 🎯 **Priority-Based Analysis**: Adjust economic, environmental, and social priorities
- ⚡ **Real-Time Streaming**: Live debate updates via Server-Sent Events

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Mapbox API token ([Get one here](https://account.mapbox.com/access-tokens/))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install dependencies:**

```bash
npm install --legacy-peer-deps
```

2. **Set up environment variables:**

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
OPENAI_API_KEY=your_openai_api_key_here
```

3. **Test the API integration:**

```bash
node test-climate-api.mjs
```

4. **Run the development server:**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

5. **Open your browser:**

Visit [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select a Location:**
   - Search for a place (e.g., "Kenya", "California")
   - Or enter coordinates manually
   - Or click directly on the map

2. **Adjust Parameters:**
   - Set the area of interest radius (10-200 km)
   - Configure priority sliders (Economic, Environmental, Social)
   - Optionally add context in the text area

3. **Run Analysis:**
   - Click "Analyze Climate Impact"
   - Watch the AI agents debate in real-time
   - Review KPIs, charts, and recommendations

4. **Explore Results:**
   - Click "Explain" to see data sources and reasoning
   - Click "Recalculate" to re-run with different priorities

## Project Structure

```
src/
├── app/
│   ├── api/analyze/route.ts    # Main analysis API endpoint
│   ├── page.tsx                # Home page
│   └── layout.tsx              # App layout
├── components/
│   ├── climate-map.tsx         # Interactive map component
│   ├── debate-feed.tsx         # AI agent debate stream
│   ├── kpi-cards.tsx           # Key performance indicators
│   ├── climate-charts.tsx      # Data visualizations
│   └── [other components]
├── lib/
│   ├── open-meteo.ts           # Climate data API integration
│   └── mapbox.ts               # Geocoding functions
└── types/
    └── api.ts                  # TypeScript interfaces
```

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Map:** Mapbox GL JS
- **Charts:** Chart.js + react-chartjs-2
- **AI:** OpenAI GPT-4o-mini via Vercel AI SDK
- **Data:** Open-Meteo API (weather), FAOSTAT (planned)
- **UI Components:** Radix UI, shadcn/ui, Framer Motion

## API Reference

### POST `/api/analyze`

Analyzes climate impact for a given location with AI agent debate.

**Request Body:**
```json
{
  "location": { "lat": -1.286, "lng": 36.817, "name": "Nairobi" },
  "radius": 100,
  "priorities": { "economic": 50, "environmental": 50, "social": 50 },
  "userPrompt": "Focus on smallholder farmers"
}
```

**Response:** Server-Sent Events stream with agent messages

## Development

**Run tests:**
```bash
node test-climate-api.mjs
```

**Build for production:**
```bash
npm run build
npm run start
```

**Lint code:**
```bash
npm run lint
```

## Roadmap

See [PROGRESS.md](./PROGRESS.md) for detailed development status and [PRD.md](./PRD.md) for the full product requirements.

- [x] Frontend UI with map and controls
- [x] Real-time AI agent streaming
- [x] Open-Meteo climate data integration
- [ ] FAOSTAT crop yield data integration
- [ ] FastAPI backend with LangGraph agents
- [ ] OR-Tools optimization engine
- [ ] Multi-region comparison
- [ ] Historical data caching

## Contributing

This is a hackathon project. See [TEST_PLAN.md](./TEST_PLAN.md) for testing guidelines.

## License

MIT

---

Built for WashU Hackathon 2025 🚀
