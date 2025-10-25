"""
AGRONOMIST AGENT - TEAMMATE 2
Analyzes agricultural impacts based on climate data using AI

TODO: Implement the analyze() method
"""
from typing import Dict, List
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim
import os
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate


class AgronomistAgent(BaseAgent):
    def __init__(self):
        super().__init__("Agronomist")
        # Initialize LLM for AI-powered analysis
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        TODO: Implement agronomist analysis
        
        Steps:
        1. Get climate data from state.climate_data
        2. Calculate crop yield impacts
        3. Assess water stress and soil health
        4. Generate crop recommendations
        5. Create claims with confidence scores
        6. Generate natural language message
        7. Return updated state
        
        Returns:
            Dict with key: 'agronomist_output'
        """
        
        # TODO 1: Check that we have climate data
        if not state.climate_data:
            raise ValueError("Climate data required from Meteorologist")
        
        climate = state.climate_data
        
        # TODO 2: Calculate yield impact
        yield_change = self._calculate_yield_impact(
            climate.precipitation_anomaly,
            climate.temperature_avg
        )
        
        # TODO 3: Calculate water stress
        water_stress = self._calculate_water_stress(climate.precipitation_anomaly)
        
        # TODO 4: Create claims
        claims = [
            AgentClaim(
                metric="crop_yield_change",
                value=yield_change,
                unit="%",
                confidence=0.80
            ),
            # TODO: Add water_stress_index claim
            # TODO: Add soil_health_impact claim
        ]
        
        # TODO 5: Generate recommendations
        recommendations = self._generate_recommendations(
            climate.precipitation_anomaly,
            climate.extreme_weather_risk
        )
        
        # TODO 6: Generate AI-powered message (2-3 sentences)
        message = await self._generate_ai_analysis(
            climate,
            yield_change,
            water_stress,
            state.location.name,
            state.userPrompt
        )
        
        # Create agent message
        agent_message = self.create_message(message, claims, recommendations)
        
        # Return updated state
        return {
            "agronomist_output": agent_message
        }
    
    async def _generate_ai_analysis(self, climate, yield_change: float, water_stress: float, location_name: str, user_prompt: str = None) -> str:
        """
        Use AI to generate agricultural analysis based on climate impacts
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert agronomist analyzing climate impacts on agriculture.
Provide concise, actionable insights in 2-3 sentences.
Focus on practical adaptations farmers can implement."""),
            ("user", """Analyze agricultural impacts for {location}:

Climate Conditions:
- Temperature: {temp}°C
- Precipitation Anomaly: {precip_anomaly}%
- Extreme Weather Risk: {risk}

Calculated Impacts:
- Estimated Yield Change: {yield_change}%
- Water Stress Index: {water_stress}/1.0

{user_context}

Provide brief agricultural assessment covering:
1. How climate changes affect crop viability
2. Water availability and soil health concerns
3. Recommended crop adaptations""")
        ])
        
        user_context = f"\nUser Context: {user_prompt}" if user_prompt else ""
        
        messages = prompt.format_messages(
            location=location_name,
            temp=climate.temperature_avg,
            precip_anomaly=climate.precipitation_anomaly,
            risk=climate.extreme_weather_risk.upper(),
            yield_change=yield_change,
            water_stress=water_stress,
            user_context=user_context
        )
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    def _calculate_yield_impact(self, precip_anomaly: float, temp_avg: float) -> float:
        """
        TODO: Calculate crop yield change percentage
        
        Logic:
        - Severe drought (< -30% precip) = -20% to -25% yield
        - Moderate drought (-15% to -30%) = -10% to -15% yield
        - Normal = 0% to -5% yield
        - High temps (> 30°C) add -5% penalty
        - Optimal temps (15-25°C) add +5% bonus
        
        Returns:
            float: Percentage change in yield (negative = loss)
        """
        # TODO: Implement this logic
        yield_change = 0.0
        
        # Example logic (implement properly):
        # if precip_anomaly < -30:
        #     yield_change = -20.0
        # elif precip_anomaly < -15:
        #     yield_change = -10.0
        # 
        # if temp_avg > 30:
        #     yield_change -= 5.0
        
        return yield_change
    
    def _calculate_water_stress(self, precip_anomaly: float) -> float:
        """
        TODO: Calculate water stress index (0-1 scale)
        
        Logic:
        - < -40% precip = 0.9-1.0 stress (critical)
        - -30% to -40% = 0.7-0.9 stress (high)
        - -15% to -30% = 0.5-0.7 stress (moderate)
        - 0% to -15% = 0.3-0.5 stress (low)
        - > 0% = 0.1-0.3 stress (minimal)
        
        Returns:
            float: Water stress index 0-1
        """
        # TODO: Implement this logic
        return 0.5
    
    def _generate_recommendations(self, precip_anomaly: float, risk: str) -> List[str]:
        """
        TODO: Generate crop adaptation recommendations
        
        Based on:
        - Precipitation anomaly
        - Extreme weather risk
        - User priorities (if relevant)
        
        Examples:
        - "Switch 30% of maize to drought-resistant sorghum"
        - "Implement drip irrigation for high-value crops"
        - "Diversify with legumes to improve soil nitrogen"
        - "Establish water harvesting systems"
        
        Returns:
            List[str]: List of recommendations
        """
        recommendations = []
        
        # TODO: Add logic based on conditions
        # if precip_anomaly < -30:
        #     recommendations.append("Switch to drought-resistant crop varieties")
        # if risk == "high":
        #     recommendations.append("Implement emergency irrigation")
        
        return recommendations


# Singleton instance
agronomist = AgronomistAgent()
