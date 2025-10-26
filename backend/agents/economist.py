"""
ECONOMIST AGENT - TEAMMATE 3
Analyzes economic impacts of climate and agricultural changes
"""
from typing import Dict, List
import math
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim


class EconomistAgent(BaseAgent):
    def __init__(self):
        super().__init__("Economist")
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        Translate agronomic signals into economic metrics the planner can use.
        """
        if not state.climate_data:
            raise ValueError("Climate context required from Meteorologist")
        if not state.agronomist_output:
            raise ValueError("Agricultural data required from Agronomist")
        
        yield_change = self._extract_yield_change(state.agronomist_output.claims)
        
        income_change = self._calculate_income_impact(yield_change)
        adaptation_cost = self._estimate_adaptation_cost(
            state.climate_data.extreme_weather_risk,
            state.radius
        )
        resilience_score = self._assess_economic_resilience(income_change, adaptation_cost)
        employment_impact = self._estimate_employment_impact(income_change, state.priorities.economic)
        recommendations = self._build_recommendations(
            income_change,
            adaptation_cost,
            resilience_score,
            employment_impact,
            state.priorities.economic
        )
        
        claims = [
            AgentClaim(
                metric="income_change",
                value=income_change,
                unit="%",
                confidence=0.75
            ),
            AgentClaim(
                metric="adaptation_cost",
                value=adaptation_cost,
                unit="USD",
                confidence=0.65
            ),
            AgentClaim(
                metric="economic_resilience",
                value=resilience_score,
                unit="score",
                confidence=0.6
            ),
            AgentClaim(
                metric="employment_impact",
                value=employment_impact,
                unit="%",
                confidence=0.55
            ),
        ]
        
        priority_weight = state.priorities.economic / 100
        emphasis = "aggressive" if priority_weight > 0.66 else "balanced" if priority_weight > 0.33 else "cautious"
        message = (
            f"Farm income around {state.location.name} is set to {income_change:+.1f}% with ripple effects of "
            f"{employment_impact:+.1f}% on seasonal labor. "
            f"Keeping drought defenses funded will require roughly ${adaptation_cost:,.0f}, yet "
            f"the overall resilience score sits at {resilience_score:.2f}, meaning an {emphasis} investment posture is advisable."
        )
        
        agent_message = self.create_message(message, claims, recommendations)
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
        # Base relationship between yield and income
        base_ratio = 0.75 if yield_change < 0 else 0.65
        income_change = yield_change * base_ratio
        
        # Price volatility dampens gains during surplus and cushions losses during shortages
        price_volatility = 0.15  # 15% price swing assumption
        if yield_change < 0:
            income_change *= 1 + (price_volatility * 0.4)  # higher prices partially offset yield losses
        else:
            income_change *= 1 - (price_volatility * 0.6)  # glut drives prices down faster than yields grow
        
        # Diversification buffer reduces extreme swings (more diversification → smaller adjustment)
        diversification_buffer = 1 - min(0.35, max(0.1, abs(yield_change) / 200))
        income_change *= diversification_buffer
        
        return round(income_change, 2)
    
    def _estimate_adaptation_cost(self, risk: str, radius: float) -> float:
        """
        Estimate total adaptation CAPEX needed for irrigation, inputs, and storage.
        """
        base_cost_per_hectare = {
            "low": 120,
            "medium": 320,
            "high": 650
        }
        cost = base_cost_per_hectare.get(risk, 320)
        area_hectares = math.pi * (radius ** 2) * 100  # circle area (km^2) → hectares
        drought_buffer = 1.0 if risk == "low" else 1.15 if risk == "medium" else 1.35
        contingency = 0.1  # inflation + logistics overhead
        total_cost = area_hectares * cost * drought_buffer
        total_cost *= 1 + contingency
        return round(total_cost, -2)
    
    def _assess_economic_resilience(self, income_change: float, adaptation_cost: float) -> float:
        """
        Blend earning power and CAPEX burden into a 0-1 resilience score.
        """
        income_component = max(0, 1 - (abs(income_change) / 30))
        # Treat $250M as cost that zeroes resilience; smaller budgets scale linearly.
        cost_component = max(0, 1 - (adaptation_cost / 250_000_000))
        resilience = (income_component * 0.6) + (cost_component * 0.4)
        return round(min(1.0, max(0.0, resilience)), 2)
    
    def _estimate_employment_impact(self, income_change: float, economic_priority: float) -> float:
        """
        Simple heuristic: labor follows revenue but high economic priority cushions cuts.
        """
        labor_elasticity = 0.5  # 1% income swing → 0.5% labor swing
        impact = income_change * labor_elasticity
        cushion = economic_priority / 200  # 0-0.5 dampener
        impact *= max(0.5, 1 - cushion)
        return round(impact, 2)
    
    def _build_recommendations(
        self,
        income_change: float,
        adaptation_cost: float,
        resilience_score: float,
        employment_impact: float,
        economic_priority: float
    ) -> List[str]:
        """Generate targeted actions for downstream agents."""
        recs = []
        if income_change < -5:
            recs.append("Deploy emergency credit lines or crop insurance to stabilize farm cash flow.")
        if adaptation_cost > 50_000_000:
            recs.append("Phase irrigation and storage upgrades over multiple seasons to match fiscal capacity.")
        if resilience_score < 0.4:
            recs.append("Couple climate-resilient seed subsidies with guaranteed produce off-take to lift resilience.")
        if employment_impact < -2:
            recs.append("Expand public works or mechanization training to absorb seasonal labor slack.")
        if not recs:
            recs.append("Maintain current investment cadence; no major economic shocks forecast.")
        if economic_priority > 70:
            recs.insert(0, "Prioritize budget toward high-ROI interventions (precision irrigation, digital advisories).")
        return recs


# Singleton instance
economist = EconomistAgent()
