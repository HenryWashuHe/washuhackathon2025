"""
PLANNER AGENT - TEAMMATE 4
Synthesizes all agent outputs into actionable strategies

TODO: Implement the analyze() method
"""
from typing import Dict, List
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("Planner")
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        TODO: Implement planner synthesis
        
        Steps:
        1. Collect outputs from all previous agents
        2. Extract key metrics and recommendations
        3. Apply user priority weights
        4. Generate optimized strategy (crop mix, irrigation, etc.)
        5. Calculate expected impacts (food, income, emissions, risk)
        6. Create final recommendations
        7. Generate natural language message
        8. Return updated state with strategy
        
        Returns:
            Dict with keys: 'planner_output', 'strategy', 'impact'
        """
        
        # TODO 1: Verify all agents have run
        if not all([
            state.meteorologist_output,
            state.agronomist_output,
            state.economist_output
        ]):
            raise ValueError("All previous agents must complete before Planner")
        
        # TODO 2: Extract key metrics from other agents
        metrics = self._extract_metrics(state)
        
        # TODO 3: Generate optimized strategy
        strategy = self._generate_strategy(
            metrics,
            state.priorities,
            state.climate_data.extreme_weather_risk
        )
        
        # TODO 4: Calculate impact of strategy
        impact = self._calculate_impact(strategy, metrics)
        
        # TODO 5: Create claims
        claims = [
            AgentClaim(
                metric="strategy_score",
                value=self._score_strategy(strategy, state.priorities),
                unit="0-100",
                confidence=0.85
            ),
            # TODO: Add climate_resilience claim
            # TODO: Add food_security_improvement claim
        ]
        
        # TODO 6: Compile recommendations from all agents
        all_recommendations = self._compile_recommendations(state)
        
        # TODO 7: Generate synthesis message (2-3 sentences)
        message = f"TODO: Synthesize strategy for {state.location.name} balancing priorities: Economic {state.priorities.economic}%, Environmental {state.priorities.environmental}%, Social {state.priorities.social}%"
        
        # Create agent message
        agent_message = self.create_message(message, claims, all_recommendations)
        
        # Return updated state
        return {
            "planner_output": agent_message,
            "strategy": strategy,
            "impact": impact
        }
    
    def _extract_metrics(self, state: AgentState) -> Dict:
        """
        TODO: Extract key metrics from all agent outputs
        
        Extract:
        - Precipitation anomaly (from meteorologist)
        - Yield change (from agronomist)
        - Income change (from economist)
        - Water stress (from agronomist)
        - Adaptation cost (from economist)
        
        Returns:
            Dict of extracted metrics
        """
        metrics = {}
        
        # TODO: Extract from each agent's claims
        # Hint: Loop through claims in state.agronomist_output.claims
        # Look for specific metric names and store values
        
        return metrics
    
    def _generate_strategy(self, metrics: Dict, priorities: Dict, risk: str) -> Dict:
        """
        TODO: Generate optimized adaptation strategy
        
        Strategy should include:
        - crop_mix: Dict[str, float] - e.g., {"maize": 0.5, "sorghum": 0.3, "beans": 0.2}
        - irrigation: bool - Whether to implement irrigation
        - water_harvesting: bool - Whether to add water systems
        - soil_improvements: bool - Fertilizer, cover crops, etc.
        - adaptation_timeline: str - "immediate", "short-term", "long-term"
        
        Consider:
        - User priorities (economic vs environmental vs social)
        - Climate risk level
        - Yield impacts
        - Budget constraints
        
        Args:
            metrics: Extracted metrics from other agents
            priorities: User priority weights
            risk: Extreme weather risk level
            
        Returns:
            Dict: Strategy configuration
        """
        strategy = {
            "crop_mix": {},
            "irrigation": False,
            "water_harvesting": False,
            "soil_improvements": False,
            "adaptation_timeline": "short-term"
        }
        
        # TODO: Implement strategy logic
        # Example logic:
        # if risk == "high" and priorities.economic > 50:
        #     strategy["crop_mix"] = {"maize": 0.4, "sorghum": 0.4, "beans": 0.2}
        #     strategy["irrigation"] = True
        # elif priorities.environmental > 60:
        #     strategy["crop_mix"] = {"sorghum": 0.5, "beans": 0.3, "millet": 0.2}
        #     strategy["soil_improvements"] = True
        
        return strategy
    
    def _calculate_impact(self, strategy: Dict, metrics: Dict) -> Dict:
        """
        TODO: Calculate expected impact of strategy
        
        Calculate changes in:
        - food_security: 0-1 scale improvement
        - income: Percentage change from baseline
        - emissions: Percentage change (negative = reduction)
        - risk: Percentage reduction in climate risk
        
        Args:
            strategy: Generated strategy dict
            metrics: Current metrics
            
        Returns:
            Dict: Impact metrics
        """
        impact = {
            "food": 0.0,
            "income": 0.0,
            "emissions": 0.0,
            "risk": 0.0
        }
        
        # TODO: Implement impact calculations
        # Example:
        # if strategy["irrigation"]:
        #     impact["food"] += 0.15  # 15% improvement
        #     impact["income"] += 0.10
        #     impact["emissions"] += 0.05  # 5% increase in emissions
        # 
        # if "sorghum" in strategy["crop_mix"] and strategy["crop_mix"]["sorghum"] > 0.3:
        #     impact["risk"] -= 0.20  # 20% risk reduction
        
        return impact
    
    def _score_strategy(self, strategy: Dict, priorities: Dict) -> float:
        """
        TODO: Score strategy based on priorities (0-100)
        
        Weight the impact by user priorities and calculate overall score
        
        Args:
            strategy: Generated strategy
            priorities: User priority weights
            
        Returns:
            float: Score 0-100
        """
        # TODO: Implement scoring
        return 75.0
    
    def _compile_recommendations(self, state: AgentState) -> List[str]:
        """
        TODO: Compile top recommendations from all agents
        
        - Take recommendations from agronomist, economist
        - Add strategic recommendations from planner
        - Prioritize by impact and user priorities
        - Limit to top 5-7 recommendations
        
        Returns:
            List[str]: Compiled recommendations
        """
        all_recs = []
        
        # TODO: Gather from agronomist
        if state.agronomist_output and state.agronomist_output.recommendations:
            all_recs.extend(state.agronomist_output.recommendations)
        
        # TODO: Add planner-specific recommendations
        # Example: "Implement strategy in phases: immediate (water harvesting), short-term (irrigation), long-term (soil restoration)"
        
        return all_recs[:7]  # Limit to top 7


# Singleton instance
planner = PlannerAgent()
