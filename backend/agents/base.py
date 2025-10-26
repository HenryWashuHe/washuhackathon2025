"""
Base Agent class for all SCDS agents
"""
from abc import ABC, abstractmethod
from typing import Dict
from datetime import datetime, timezone
from models.schemas import AgentState, AgentMessage


class BaseAgent(ABC):
    """Base class that all agents inherit from"""
    
    def __init__(self, name: str):
        self.name = name
    
    @abstractmethod
    async def analyze(self, state: AgentState) -> Dict:
        """
        Main analysis method that each agent must implement
        
        Args:
            state: The shared state object containing all data
            
        Returns:
            Dict with updated state fields
        """
        pass
    
    def create_message(self, message: str, claims: list, recommendations: list = None) -> AgentMessage:
        """Helper to create standardized agent messages"""
        return AgentMessage(
            agent=self.name,
            message=message,
            claims=claims,
            recommendations=recommendations or [],
            timestamp=datetime.now(timezone.utc).isoformat()
        )
