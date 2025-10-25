# SCDS Backend - LangGraph Multi-Agent System

## Quick Start

```bash
# 1. Create virtual environment
python3 -m venv venv
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment
cp env.example .env
# Edit .env and add your OPENAI_API_KEY

# 4. Run server
python main.py
```

Server will start at: http://localhost:8000

## Architecture

```
┌─────────────┐
│   Request   │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  FastAPI Server │
│   (main.py)     │
└────────┬────────┘
         │
         ▼
┌────────────────────┐
│   LangGraph Flow   │
│    (graph.py)      │
└────────┬───────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌─────────────────────────┐
│  Agent Pipeline:        │
│  1. Meteorologist       │
│  2. Agronomist          │
│  3. Economist           │
│  4. Planner             │
└─────────────────────────┘
         │
         ▼
┌─────────────┐
│   Response  │
│   (Stream)  │
└─────────────┘
```

## Project Structure

```
backend/
├── main.py              # FastAPI server & streaming
├── graph.py             # LangGraph orchestrator
├── requirements.txt     # Python dependencies
│
├── agents/
│   ├── base.py         # Base agent class
│   ├── meteorologist.py # Agent 1: Climate analysis
│   ├── agronomist.py   # Agent 2: Agricultural impact
│   ├── economist.py    # Agent 3: Economic analysis
│   └── planner.py      # Agent 4: Strategy synthesis
│
├── models/
│   └── schemas.py      # Pydantic data models
│
└── services/           # (Future: Data fetching services)
```

## API Endpoints

### POST /analyze

Analyzes climate impact for a location using multi-agent system.

**Request:**
```json
{
  "location": {
    "lat": -1.286,
    "lng": 36.817,
    "name": "Nairobi, Kenya"
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

**Response:** Server-Sent Events stream

```
data: {"role": "meteorologist", "content": "...", "claims": [...]}

data: {"role": "agronomist", "content": "...", "claims": [...]}

data: {"role": "economist", "content": "...", "claims": [...]}

data: {"role": "planner", "content": "...", "strategy": {...}}
```

## Development

### Testing Individual Agents

```python
# test_meteorologist.py
import asyncio
from models.schemas import AgentState, Location, Priorities
from agents.meteorologist import meteorologist

async def test():
    state = AgentState(
        location=Location(lat=-1.286, lng=36.817, name="Nairobi"),
        radius=100,
        priorities=Priorities(economic=50, environmental=50, social=50)
    )
    result = await meteorologist.analyze(state)
    print(result)

asyncio.run(test())
```

### Testing Full Pipeline

```bash
# Terminal 1: Start server
python main.py

# Terminal 2: Send test request
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d @test_request.json
```

## Dependencies

- **FastAPI**: Web framework
- **LangGraph**: Agent orchestration
- **LangChain**: AI agent framework
- **Pydantic**: Data validation
- **httpx**: Async HTTP client (for API calls)

## Team Development Guide

See: [LANGGRAPH_TEAM_WORK.md](../LANGGRAPH_TEAM_WORK.md) for:
- Agent assignment (4 people)
- Development workflow
- Testing guidelines
- Integration steps

## Troubleshooting

**Import errors:**
```bash
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

**LangGraph not found:**
```bash
pip install --upgrade langgraph
```

**Agent fails:**
- Check previous agents completed
- Verify state has required data
- Add debug prints

## Next Steps

1. [ ] Each person implements their assigned agent
2. [ ] Test agents individually
3. [ ] Test full graph pipeline
4. [ ] Connect frontend to backend
5. [ ] Deploy to production
