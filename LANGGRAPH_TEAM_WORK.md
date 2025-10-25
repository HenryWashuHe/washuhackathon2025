# 🚀 LangGraph Agent Development - Team Distribution

## Backend Setup (Everyone Do This First - 10 min)

### 1. Create Python Virtual Environment

```bash
# Navigate to backend folder
cd backend

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # Mac/Linux
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt
```

### 2. Set Up Environment Variables

```bash
# Create .env file in backend/
cat > .env << EOF
OPENAI_API_KEY=your_openai_key_here
EOF
```

### 3. Test Import Structure

```bash
# From backend/ directory, test imports
python3 -c "from models.schemas import AgentState; print('✓ Imports working')"
```

---

## 👥 Team Work Distribution (4 People)

### **Person 1: Meteorologist Agent** 🌦️
**File:** `backend/agents/meteorologist.py`  
**Time:** 45-60 min

**Your Tasks:**
1. Implement `_fetch_climate_data()` method
   - Call Open-Meteo API
   - Parse temperature and precipitation data
   - Calculate anomalies
   - Return ClimateData object

2. Complete `analyze()` method
   - Add all climate claims
   - Write descriptive message
   - Handle errors gracefully

**Key APIs:**
```python
# Open-Meteo API
url = f"https://archive-api.open-meteo.com/v1/archive?latitude={lat}&longitude={lon}&start_date={start}&end_date={end}&daily=temperature_2m_mean,precipitation_sum"
```

**Success Criteria:**
- [ ] API call returns real data
- [ ] 3+ claims with confidence scores
- [ ] Natural language message (2-3 sentences)
- [ ] Returns proper ClimateData object

---

### **Person 2: Agronomist Agent** 🌾
**File:** `backend/agents/agronomist.py`  
**Time:** 45-60 min

**Your Tasks:**
1. Implement `_calculate_yield_impact()`
   - Use precipitation anomaly + temperature
   - Calculate percentage yield change
   - Add logic for different crops

2. Implement `_calculate_water_stress()`
   - Convert precip anomaly to 0-1 stress index

3. Implement `_generate_recommendations()`
   - Based on risk and anomalies
   - 3-5 actionable recommendations

4. Complete `analyze()` method
   - Add all claims
   - Write message
   - Return recommendations

**Success Criteria:**
- [ ] Yield calculation logic works
- [ ] 3+ claims created
- [ ] 3-5 recommendations generated
- [ ] Message mentions key findings

---

### **Person 3: Economist Agent** 💰
**File:** `backend/agents/economist.py`  
**Time:** 45-60 min

**Your Tasks:**
1. Implement `_calculate_income_impact()`
   - Convert yield change to income change
   - Factor in market volatility

2. Implement `_estimate_adaptation_cost()`
   - Calculate based on risk level and area
   - Use reasonable cost estimates

3. Implement `_assess_economic_resilience()`
   - Score 0-1 based on impacts and costs

4. Complete `analyze()` method
   - Extract metrics from previous agents
   - Add 4+ claims
   - Write economic analysis message

**Success Criteria:**
- [ ] Income calculation uses yield data
- [ ] Adaptation costs calculated
- [ ] 4+ economic claims
- [ ] Message explains financial impacts

---

### **Person 4: Planner Agent** 🎯
**File:** `backend/agents/planner.py`  
**Time:** 60-75 min (Most complex!)

**Your Tasks:**
1. Implement `_extract_metrics()`
   - Pull data from all previous agents
   - Create unified metrics dict

2. Implement `_generate_strategy()`
   - Create crop mix recommendations
   - Decide on irrigation, water harvesting, etc.
   - Consider user priorities

3. Implement `_calculate_impact()`
   - Estimate food, income, emissions, risk impacts
   - Based on strategy

4. Implement `_compile_recommendations()`
   - Gather from all agents
   - Prioritize top 5-7

5. Complete `analyze()` method
   - Synthesize all outputs
   - Generate final strategy
   - Create comprehensive message

**Success Criteria:**
- [ ] Extracts data from all agents
- [ ] Generates balanced strategy
- [ ] Calculates 4 impact metrics
- [ ] Compiles 5-7 recommendations
- [ ] Message synthesizes all findings

---

## 🔄 Development Workflow

### Phase 1: Independent Development (45-60 min)

Each person works on their agent independently:

1. **Read your agent file** - Understand the structure
2. **Implement TODOs** - Fill in the methods
3. **Test locally** - Create test script
4. **Commit your work** - `git add` and `git commit`

### Phase 2: Integration (30 min)

**After everyone finishes:**

1. **Merge all agents** - Resolve any conflicts
2. **Test the graph** - Run the full pipeline
3. **Debug together** - Fix any issues
4. **Test with real data** - Kenya example

### Phase 3: Frontend Connection (30 min)

**Update Next.js to call FastAPI:**

File: `src/app/api/analyze/route.ts`

Change backend URL:
```typescript
const response = await fetch('http://localhost:8000/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    location: { lat, lng, name },
    radius,
    priorities: { economic, environmental, social },
    userPrompt
  })
})
```

---

## ✅ Testing Your Agent

### Individual Agent Test

Create `backend/test_agent.py`:

```python
import asyncio
from models.schemas import AgentState, Location, Priorities, ClimateData
from agents.meteorologist import meteorologist  # Change to your agent

async def test():
    state = AgentState(
        location=Location(lat=-1.286, lng=36.817, name="Nairobi"),
        radius=100,
        priorities=Priorities(economic=50, environmental=50, social=50),
        climate_data=ClimateData(  # Mock data for testing
            temperature_avg=18.8,
            precipitation_sum=112.1,
            precipitation_anomaly=-50.2,
            extreme_weather_risk="high"
        )
    )
    
    result = await meteorologist.analyze(state)
    print("✓ Agent Output:")
    print(result)

asyncio.run(test())
```

Run:
```bash
cd backend
python test_agent.py
```

### Full Graph Test

```bash
# Start the FastAPI server
cd backend
python main.py

# In another terminal, test the endpoint
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "location": {"lat": -1.286, "lng": 36.817, "name": "Nairobi"},
    "radius": 100,
    "priorities": {"economic": 50, "environmental": 50, "social": 50}
  }'
```

---

## 🐛 Common Issues & Solutions

### Import Errors
```bash
# Make sure you're in backend/ and venv is activated
cd backend
source venv/bin/activate
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
```

### LangGraph Errors
```bash
# Reinstall langgraph
pip install --upgrade langgraph
```

### Agent Not Running
- Check that previous agents completed successfully
- Verify state has required data
- Add print statements for debugging

---

## 📊 Progress Tracking

**Person 1 (Meteorologist):**
- [ ] API call working
- [ ] Claims generated
- [ ] Message written
- [ ] Tested independently

**Person 2 (Agronomist):**
- [ ] Yield calculation done
- [ ] Water stress logic done
- [ ] Recommendations generated
- [ ] Tested independently

**Person 3 (Economist):**
- [ ] Income calculation done
- [ ] Cost estimation done
- [ ] Resilience scoring done
- [ ] Tested independently

**Person 4 (Planner):**
- [ ] Metric extraction done
- [ ] Strategy generation done
- [ ] Impact calculation done
- [ ] Recommendations compiled
- [ ] Tested independently

**Integration:**
- [ ] All agents merged
- [ ] Graph runs end-to-end
- [ ] Frontend connected
- [ ] Full demo works

---

## ⏱️ Timeline

| Time | Activity |
|------|----------|
| 0-10 min | Everyone: Setup Python environment |
| 10-70 min | Individual agent development |
| 70-100 min | Integration and testing |
| 100-130 min | Frontend connection |
| 130-150 min | Final testing and demo prep |

**Total Time:** ~2.5 hours

---

## 💡 Tips for Success

1. **Start with the TODOs** - They guide you step-by-step
2. **Use helper methods** - They're already structured for you
3. **Test frequently** - Don't wait until the end
4. **Ask for help** - Share issues in your team chat
5. **Commit often** - `git commit` after each working function
6. **Keep it simple** - MVP first, optimize later

---

## 🚀 Ready to Start?

1. **Everyone:** Run backend setup
2. **Each person:** Open your assigned agent file
3. **Start coding!** Look for `# TODO` comments
4. **Test as you go**
5. **Sync after 60 minutes**

Good luck! 🎉
