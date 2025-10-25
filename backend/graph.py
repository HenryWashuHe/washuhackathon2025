"""
LangGraph Orchestrator
Chains agents together in the correct order
"""
from typing import Dict, Any
from langgraph.graph import StateGraph, END
from models.schemas import AgentState
from agents.meteorologist import meteorologist
from agents.agronomist import agronomist
from agents.economist import economist
from agents.planner import planner


def create_agent_graph():
    """
    Creates the LangGraph workflow
    
    Flow:
    START → Meteorologist → Agronomist → Economist → Planner → END
    
    Each agent:
    1. Receives the shared state
    2. Performs analysis
    3. Updates state with outputs
    4. Passes to next agent
    """
    
    # Create the graph
    workflow = StateGraph(AgentState)
    
    # Add agent nodes
    workflow.add_node("meteorologist", run_meteorologist)
    workflow.add_node("agronomist", run_agronomist)
    workflow.add_node("economist", run_economist)
    workflow.add_node("planner", run_planner)
    
    # Define the flow
    workflow.set_entry_point("meteorologist")
    workflow.add_edge("meteorologist", "agronomist")
    workflow.add_edge("agronomist", "economist")
    workflow.add_edge("economist", "planner")
    workflow.add_edge("planner", END)
    
    # Compile the graph
    return workflow.compile()


# Node functions (wrappers for async agents)

async def run_meteorologist(state: Dict[str, Any]) -> Dict[str, Any]:
    """Run meteorologist agent and update state"""
    agent_state = AgentState(**state)
    updates = await meteorologist.analyze(agent_state)
    return updates


async def run_agronomist(state: Dict[str, Any]) -> Dict[str, Any]:
    """Run agronomist agent and update state"""
    agent_state = AgentState(**state)
    updates = await agronomist.analyze(agent_state)
    return updates


async def run_economist(state: Dict[str, Any]) -> Dict[str, Any]:
    """Run economist agent and update state"""
    agent_state = AgentState(**state)
    updates = await economist.analyze(agent_state)
    return updates


async def run_planner(state: Dict[str, Any]) -> Dict[str, Any]:
    """Run planner agent and update state"""
    agent_state = AgentState(**state)
    updates = await planner.analyze(agent_state)
    return updates


# Create the global graph instance
agent_graph = create_agent_graph()
