"""
Data models for SCDS agents
"""
from typing import Dict, List, Optional, Literal
from pydantic import BaseModel, Field


class Location(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    name: str


class Priorities(BaseModel):
    economic: float = Field(..., ge=0, le=100)
    environmental: float = Field(..., ge=0, le=100)
    social: float = Field(..., ge=0, le=100)


class AnalyzeRequest(BaseModel):
    location: Location
    radius: float = Field(..., ge=10, le=200)
    priorities: Priorities
    userPrompt: Optional[str] = None


class AgentClaim(BaseModel):
    metric: str
    value: float
    unit: str
    confidence: float = Field(..., ge=0, le=1)


class AgentMessage(BaseModel):
    agent: str
    message: str
    claims: List[AgentClaim]
    recommendations: Optional[List[str]] = None
    timestamp: str


class ClimateData(BaseModel):
    temperature_avg: float
    precipitation_sum: float
    precipitation_anomaly: float
    extreme_weather_risk: Literal["low", "medium", "high"]


class AgentState(BaseModel):
    """Shared state between all agents in the graph"""
    location: Location
    radius: float
    priorities: Priorities
    userPrompt: Optional[str] = None
    
    # Agent outputs
    climate_data: Optional[ClimateData] = None
    meteorologist_output: Optional[AgentMessage] = None
    agronomist_output: Optional[AgentMessage] = None
    economist_output: Optional[AgentMessage] = None
    planner_output: Optional[AgentMessage] = None
    
    # Final recommendation
    strategy: Optional[Dict] = None
    impact: Optional[Dict] = None
