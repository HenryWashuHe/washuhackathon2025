"""
FastAPI Server for SCDS
Handles analysis requests and streams agent outputs
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
import json
import asyncio
from typing import AsyncGenerator

from models.schemas import AnalyzeRequest, AgentState
from graph import agent_graph

app = FastAPI(title="SCDS Agent API", version="1.0.0")

# CORS - Allow Next.js frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
