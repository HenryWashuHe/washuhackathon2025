"""
ECONOMIST AGENT - TEAMMATE 3
Analyzes economic impacts of climate and agricultural changes

TODO: Implement the analyze() method
"""
from typing import Dict
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim


class EconomistAgent(BaseAgent):
    def __init__(self):
        super().__init__("Economist")
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        TODO: Implement economist analysis
        
        Steps:
        1. Get climate and agricultural data from state
        2. Calculate income impacts based on yield changes
        3. Estimate adaptation costs
        4. Assess economic resilience
        5. Consider user's economic priority weight
        6. Create claims with confidence scores
        7. Generate natural language message
        8. Return updated state
        
        Returns:
            Dict with key: 'economist_output'
        """
        
        # TODO 1: Check we have required data
        if not state.agronomist_output:
            raise ValueError("Agricultural data required from Agronomist")
        
        # TODO 2: Extract yield change from agronomist's claims
        yield_change = self._extract_yield_change(state.agronomist_output.claims)
        
        # TODO 3: Calculate economic impacts
        income_change = self._calculate_income_impact(yield_change)
        adaptation_cost = self._estimate_adaptation_cost(
            state.climate_data.extreme_weather_risk,
            state.radius
        )
        
        # TODO 4: Create claims
        claims = [
            AgentClaim(
                metric="income_change",
                value=income_change,
                unit="%",
                confidence=0.75
            ),
            # TODO: Add adaptation_cost claim (in USD)
            # TODO: Add economic_resilience claim (0-1 scale)
            # TODO: Add employment_impact claim
        ]
        
        # TODO 5: Generate message (2-3 sentences)
        # Consider: state.priorities.economic weight
        message = f"TODO: Analyze economic impacts for {state.location.name}. Mention income changes, costs, and resilience."
        
        # Create agent message
        agent_message = self.create_message(message, claims)
        
        # Return updated state
        return {
            "economist_output": agent_message
        }
    
    def _extract_yield_change(self, claims: list) -> float:
        """Extract yield change from agronomist's claims"""
        for claim in claims:
            if claim.metric == "crop_yield_change":
                return claim.value
        return 0.0
    
    def _calculate_income_impact(self, yield_change: float) -> float:
        """
        TODO: Calculate income change percentage
        
        Logic:
        - Income change is typically 0.6-0.8x the yield change
        - If yield drops 20%, income drops 12-16%
        - Consider crop price volatility factor
        - Consider diversification effects
        
        Args:
            yield_change: Percentage change in crop yield
            
        Returns:
            float: Percentage change in farm income
        """
        # TODO: Implement this logic
        # Hint: income_change = yield_change * 0.7 (simplified)
        # Add randomness or market factors if needed
        return yield_change * 0.7
    
    def _estimate_adaptation_cost(self, risk: str, radius: float) -> float:
        """
        TODO: Estimate cost of adaptation measures (in USD)
        
        Logic:
        - High risk areas need more investment
        - Larger areas cost more
        - Typical costs:
          - Irrigation: $500-1000/hectare
          - Drought-resistant seeds: $50-100/hectare
          - Water harvesting: $200-500/hectare
        - Scale by radius (estimate hectares from radius)
        
        Args:
            risk: Extreme weather risk level
            radius: Area radius in km
            
        Returns:
            float: Estimated cost in USD
        """
        # TODO: Implement this logic
        # Hint: area_hectares = π * radius^2 * 100 (rough approximation)
        # Multiply by cost per hectare based on risk
        
        base_cost_per_hectare = {
            "low": 100,
            "medium": 300,
            "high": 600
        }
        
        # TODO: Calculate total cost
        return 50000.0  # Placeholder
    
    def _assess_economic_resilience(self, income_change: float, adaptation_cost: float) -> float:
        """
        TODO: Assess economic resilience (0-1 scale)
        
        Logic:
        - Low income impact + affordable adaptation = high resilience (0.7-1.0)
        - Medium impact + moderate costs = medium resilience (0.4-0.7)
        - High impact + high costs = low resilience (0.0-0.4)
        
        Args:
            income_change: Percentage income change
            adaptation_cost: USD cost of adaptations
            
        Returns:
            float: Resilience score 0-1
        """
        # TODO: Implement this logic
        return 0.5


# Singleton instance
economist = EconomistAgent()
