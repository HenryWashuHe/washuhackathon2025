"""
FastAPI Server for SCDS
Handles analysis requests and streams agent outputs
"""
import asyncio
import json
from pathlib import Path
from typing import AsyncGenerator

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models.schemas import AnalyzeRequest, AgentState
from graph import agent_graph

# Load backend/.env before importing components that need API keys
load_dotenv(Path(__file__).parent / ".env")
app = FastAPI(title="SCDS Agent API", version="1.0.0")

# CORS - Allow Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://miaomiaobadcat.com",
        "https://www.miaomiaobadcat.com",
        "http://localhost:3000",
        "http://localhost:3001",  # Alternative dev port
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
)


@app.get("/")
async def root():
    """Health check"""
    return {"status": "healthy", "service": "SCDS Agent API"}


@app.post("/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Main analysis endpoint - runs all agents via LangGraph
    Returns: Server-Sent Events stream of agent outputs
    """
    try:
        # Convert request to agent state
        initial_state = AgentState(
            location=request.location,
            radius=request.radius,
            priorities=request.priorities,
            userPrompt=request.userPrompt
        )
        
        # Stream agent outputs
        return StreamingResponse(
            stream_agent_outputs(initial_state),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-risk")
async def analyze_risk(request: dict):
    """
    Climate risk analysis endpoint
    Analyzes long-term climate risks instead of agricultural adaptation
    """
    try:
        location = request.get("location", {})
        years_in_future = request.get("yearsInFuture", 10)
        user_prompt = request.get("userPrompt", "")
        
        # Stream risk analysis outputs
        return StreamingResponse(
            stream_risk_analysis(location, years_in_future, user_prompt),
            media_type="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "Connection": "keep-alive",
            }
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


async def stream_agent_outputs(initial_state: AgentState) -> AsyncGenerator[str, None]:
    """
    Stream agent outputs as Server-Sent Events
    
    This function:
    1. Runs the LangGraph workflow
    2. Captures each agent's output
    3. Streams it to the frontend in real-time
    """
    
    # Send initial message
    yield f"data: {json.dumps({'role': 'system', 'content': 'Starting climate analysis...'})}\n\n"
    await asyncio.sleep(0.3)
    
    try:
        # Run the agent graph
        # LangGraph will execute: Meteorologist → Agronomist → Economist → Planner
        state_dict = initial_state.model_dump()
        
        # TODO: Implement streaming from LangGraph
        # For now, we'll run the whole graph and stream results
        # In production, you'd use LangGraph's streaming capabilities
        
        final_state = await agent_graph.ainvoke(state_dict)
        
        # Stream each agent's output
        agents_to_stream = [
            ("meteorologist_output", "Meteorologist"),
            ("agronomist_output", "Agronomist"),
            ("economist_output", "Economist"),
            ("planner_output", "Planner"),
        ]
        
        for state_key, agent_name in agents_to_stream:
            if state_key in final_state and final_state[state_key]:
                agent_output = final_state[state_key]
                
                # Format as SSE message
                message = {
                    "role": agent_name.lower(),
                    "content": agent_output.message,
                    "claims": [claim.model_dump() for claim in agent_output.claims],
                    "recommendations": agent_output.recommendations or []
                }
                
                yield f"data: {json.dumps(message)}\n\n"
                await asyncio.sleep(0.5)  # Simulate streaming delay
        
        # Send final strategy
        if "strategy" in final_state:
            final_message = {
                "role": "system",
                "content": "Analysis complete",
                "strategy": final_state["strategy"],
                "impact": final_state.get("impact", {})
            }
            yield f"data: {json.dumps(final_message)}\n\n"
    
    except Exception as e:
        error_message = {
            "role": "system",
            "content": f"Error during analysis: {str(e)}",
            "error": True
        }
        yield f"data: {json.dumps(error_message)}\n\n"


async def stream_risk_analysis(location: dict, years_in_future: int, user_prompt: str) -> AsyncGenerator[str, None]:
    """
    Stream climate risk analysis using AI models
    This provides real analysis instead of hardcoded values
    """
    import os
    from langchain_openai import ChatOpenAI
    
    # Initialize LLM
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0.7,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Send initial message
    yield f"data: {json.dumps({'role': 'system', 'content': 'Starting climate risk analysis...'})}\n\n"
    await asyncio.sleep(0.3)
    
    try:
        # Climate scientist analysis
        climate_prompt = f"""
        As a climate scientist, analyze the climate risks for {location.get('name', 'this location')} 
        (lat: {location.get('lat')}, lng: {location.get('lng')}) over the next {years_in_future} years.
        Consider temperature changes, precipitation patterns, and extreme weather events.
        Be specific with data and projections. Keep response under 150 words.
        """
        climate_response = await llm.ainvoke(climate_prompt)
        yield f"data: {json.dumps({'role': 'climate-scientist', 'content': climate_response.content})}\n\n"
        await asyncio.sleep(0.5)
        
        # Risk analyst assessment
        risk_prompt = f"""
        As a risk analyst, evaluate the environmental hazards for {location.get('name', 'this location')} 
        over the next {years_in_future} years. Consider:
        - Natural disaster risks (floods, droughts, hurricanes, wildfires)
        - Sea level rise impacts if coastal
        - Heat stress and extreme temperature events
        Provide specific risk levels. Keep response under 150 words.
        """
        risk_response = await llm.ainvoke(risk_prompt)
        yield f"data: {json.dumps({'role': 'risk-analyst', 'content': risk_response.content})}\n\n"
        await asyncio.sleep(0.5)
        
        # Economic analysis
        econ_prompt = f"""
        As an economist, analyze the economic impacts of climate change for {location.get('name', 'this location')} 
        over the next {years_in_future} years. Include:
        - Estimated annual losses
        - Property value impacts
        - Adaptation costs
        - Economic opportunities
        Provide realistic estimates. Keep response under 150 words.
        """
        econ_response = await llm.ainvoke(econ_prompt)
        yield f"data: {json.dumps({'role': 'economist', 'content': econ_response.content})}\n\n"
        await asyncio.sleep(0.5)
        
        # Use AI to generate risk scores based on the analysis
        risk_score_prompt = f"""
        Based on the climate analysis for {location.get('name', 'this location')} (Latitude: {location.get('lat')}, Longitude: {location.get('lng')}) over {years_in_future} years:
        
        Climate Analysis: {climate_response.content}
        Risk Analysis: {risk_response.content}
        Economic Analysis: {econ_response.content}
        
        Generate SPECIFIC risk scores (0-100) for this exact location:
        1. Environmental Risk - Based on the specific climate threats mentioned
        2. Economic Risk - Based on the specific financial impacts mentioned
        3. Social Risk - Based on population and infrastructure impacts
        4. Overall Risk - Weighted average considering all factors
        
        Be specific to {location.get('name', 'this location')}. Different locations should have different scores.
        
        Also identify the SPECIFIC environmental hazards mentioned in the analysis for this exact location.
        
        Respond in this exact JSON format with integer scores:
        {{
            "environmental": <integer 0-100>,
            "economic": <integer 0-100>,
            "social": <integer 0-100>,
            "overall": <integer 0-100>,
            "hazards": ["specific_hazard1", "specific_hazard2", ...]
        }}
        """
        
        risk_score_response = await llm.ainvoke(risk_score_prompt)
        
        # Log the AI response for debugging
        print(f"[RISK SCORES] AI Response: {risk_score_response.content}")
        
        try:
            import re
            # Extract JSON from response
            json_match = re.search(r'\{.*\}', risk_score_response.content, re.DOTALL)
            if json_match:
                risk_data = json.loads(json_match.group())
                print(f"[RISK SCORES] Parsed data: {risk_data}")
                
                risk_scores = {
                    "environmental": int(risk_data.get("environmental", 50)),
                    "economic": int(risk_data.get("economic", 50)),
                    "social": int(risk_data.get("social", 50)),
                    "overall": int(risk_data.get("overall", 50))
                }
                hazards = risk_data.get("hazards", ["flooding", "extreme heat"])
            else:
                # Fallback if parsing fails
                risk_scores = {
                    "environmental": 50,
                    "economic": 50,
                    "social": 50,
                    "overall": 50
                }
                hazards = ["flooding", "extreme heat"]
        except:
            # Fallback scores
            risk_scores = {
                "environmental": 50,
                "economic": 50,
                "social": 50,
                "overall": 50
            }
            hazards = ["flooding", "extreme heat"]
        
        yield f"data: {json.dumps({'riskScores': risk_scores})}\n\n"
        yield f"data: {json.dumps({'hazards': hazards})}\n\n"
        
        # AI-generated economic impact
        impact_prompt = f"""
        Based on the economic analysis for {location.get('name', 'this location')} over {years_in_future} years:
        {econ_response.content}
        
        Estimate in numbers only:
        1. Annual loss per capita in USD
        2. Total adaptation cost in USD
        3. Property value change percentage (negative for decline)
        
        Respond in JSON format:
        {{
            "annual_loss_per_capita": <number>,
            "adaptation_cost": <number>,
            "property_value_change": <number>
        }}
        """
        
        impact_response = await llm.ainvoke(impact_prompt)
        try:
            json_match = re.search(r'\{.*\}', impact_response.content, re.DOTALL)
            if json_match:
                economic_impact = json.loads(json_match.group())
            else:
                economic_impact = {
                    "annual_loss_per_capita": 1000,
                    "adaptation_cost": 100000,
                    "property_value_change": -10
                }
        except:
            economic_impact = {
                "annual_loss_per_capita": 1000,
                "adaptation_cost": 100000,
                "property_value_change": -10
            }
        
        yield f"data: {json.dumps({'economicImpact': economic_impact})}\n\n"
        
    except Exception as e:
        error_message = {
            "role": "system",
            "content": f"Error during risk analysis: {str(e)}",
            "error": True
        }
        yield f"data: {json.dumps(error_message)}\n\n"


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
