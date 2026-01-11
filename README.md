# SCDS - Smart Climate Decision System

An AI-powered multi-agent platform that analyzes climate data and provides actionable climate adaptation strategies using real-time weather data and AI agents.

## ✨ Features

- 🗺️ **Interactive Map**: Select any location worldwide with Mapbox integration
- 🌦️ **Real Climate Data**: Fetches actual weather patterns from Open-Meteo API
- 🤖 **AI Agent Debate**: Four specialized agents (Meteorologist, Agronomist, Economist, Planner) analyze and discuss climate impacts
- 📊 **Data Visualization**: Charts showing rainfall trends and crop yield projections
- 🎯 **Priority-Based Analysis**: Adjust economic, environmental, and social priorities
- ⚡ **Real-Time Streaming**: Live debate updates via Server-Sent Events
- 🏗️ **Full Stack Architecture**: Next.js frontend with FastAPI/LangGraph backend

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+ and pip
- Mapbox API token ([Get one here](https://account.mapbox.com/access-tokens/))
- OpenAI API key ([Get one here](https://platform.openai.com/api-keys))

### Installation

1. **Clone and install frontend dependencies:**

```bash
npm install --legacy-peer-deps
```

2. **Set up frontend environment variables:**

```bash
cp env.example .env.local
```

Edit `.env.local` and add your API keys:
```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
OPENAI_API_KEY=your_openai_api_key_here
BACKEND_URL=http://localhost:8000  # For local development
```

3. **Set up the backend:**

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp env.example .env
```

Edit `backend/.env` and add:
```env
OPENAI_API_KEY=your_openai_api_key_here
```

4. **Start the development servers:**

```bash
# Terminal 1: Start backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2: Start frontend
npm run dev
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
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── api/analyze/route.ts  # API proxy to backend
│   │   ├── page.tsx              # Home page
│   │   └── layout.tsx            # App layout
│   ├── components/
│   │   ├── climate-map.tsx       # Interactive map component
│   │   ├── debate-feed.tsx       # AI agent debate stream
│   │   ├── kpi-cards.tsx         # Key performance indicators
│   │   └── climate-charts.tsx    # Data visualizations
│   ├── lib/
│   │   ├── open-meteo.ts         # Climate data API integration
│   │   └── mapbox.ts             # Geocoding functions
│   └── types/
│       └── api.ts                # TypeScript interfaces
│
└── backend/                      # FastAPI + LangGraph Backend
    ├── main.py                   # FastAPI server & streaming
    ├── graph.py                  # LangGraph orchestrator
    ├── requirements.txt          # Python dependencies
    ├── agents/
    │   ├── base.py              # Base agent class
    │   ├── meteorologist.py     # Climate analysis agent
    │   ├── agronomist.py        # Agricultural impact agent
    │   ├── economist.py         # Economic analysis agent
    │   └── planner.py           # Strategy synthesis agent
    └── models/
        └── schemas.py           # Pydantic data models
```

## Tech Stack

### Frontend
- **Framework:** Next.js 15, React 19, TypeScript
- **Styling:** TailwindCSS, shadcn/ui components
- **Maps:** Mapbox GL JS
- **Charts:** Chart.js + react-chartjs-2
- **Animations:** Framer Motion
- **AI Integration:** Vercel AI SDK

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **AI Agents:** LangGraph + LangChain
- **AI Model:** OpenAI GPT-4o-mini
- **Data Validation:** Pydantic
- **Streaming:** Server-Sent Events (SSE)

### External APIs
- **Climate Data:** Open-Meteo API
- **Geocoding:** Mapbox Geocoding API
- **Future:** FAOSTAT API (crop data)

## API Reference

### Frontend: POST `/api/analyze`

Proxy endpoint that forwards requests to the FastAPI backend.

### Backend: POST `/analyze`

Analyzes climate impact for a given location using multi-agent system.

**Request Body:**
```json
{
  "location": { 
    "lat": -1.286, 
    "lng": 36.817, 
    "name": "Nairobi" 
  },
  "radius": 100,
  "priorities": { 
    "economic": 50, 
    "environmental": 50, 
    "social": 50 
  },
  "userPrompt": "Focus on smallholder farmers"
}
```

**Response:** Server-Sent Events stream with agent messages
```
data: {"role": "meteorologist", "content": "...", "claims": [...]}
data: {"role": "agronomist", "content": "...", "claims": [...]}
data: {"role": "economist", "content": "...", "claims": [...]}
data: {"role": "planner", "content": "...", "strategy": {...}}
```

## Development

### Frontend Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Backend Development
```bash
cd backend
source venv/bin/activate
python main.py       # Start FastAPI server
pytest               # Run tests
```

### Testing
```bash
# Frontend tests
npm run lint

# Backend tests
cd backend && pytest

# Integration tests
./test-local.sh      # Test full stack locally
./test-deployment.sh # Test production deployment
```

## Current Status

✅ **Completed Features**
- [x] Frontend UI with interactive map and controls
- [x] FastAPI backend with LangGraph multi-agent system
- [x] Real-time AI agent streaming via SSE
- [x] Open-Meteo climate data integration
- [x] Four specialized AI agents (Meteorologist, Agronomist, Economist, Planner)
- [x] Production deployment on Vercel (frontend) + Render (backend)

🚧 **In Progress**
- [ ] FAOSTAT crop yield data integration
- [ ] OR-Tools optimization engine
- [ ] Enhanced error handling and validation

📋 **Planned Features**
- [ ] Multi-region comparison
- [ ] Historical data caching
- [ ] Additional specialized agents (Energy, Water)
- [ ] Mobile app development

## Documentation

- [PROGRESS.md](./PROGRESS.md) - Detailed development status
- [PRD.md](./PRD.md) - Full product requirements
- [backend/README.md](./backend/README.md) - Backend API documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment guide

## Contributing

This is a hackathon project built for WashU Hackathon 2025. Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT

---

Built for WashU Hackathon 2025 🚀
