"""
AGRONOMIST AGENT - TEAMMATE 2
Analyzes agricultural impacts based on climate data using AI.
"""
from typing import Dict, List, Optional, Any
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate


class AgronomistAgent(BaseAgent):
    def __init__(self, llm: Optional[Any] = None):
        super().__init__("Agronomist")
        if llm is not None:
            self.llm = llm
        else:
            api_key = os.getenv("OPENAI_API_KEY")
            self.llm = None
            if api_key:
                self.llm = ChatOpenAI(
                    model=os.getenv("AGRONOMIST_MODEL", "gpt-4o-mini"),
                    temperature=0.7,
                    api_key=api_key
                )
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        Perform agronomic analysis using climate data produced by the
        meteorologist agent and craft an AI-generated message describing
        expected impacts and adaptations.
        """
        
        if not state.climate_data:
            raise ValueError("Climate data required from Meteorologist")
        
        climate = state.climate_data
        
        yield_change = self._calculate_yield_impact(
            climate.precipitation_anomaly,
            climate.temperature_avg
        )
        
        water_stress = self._calculate_water_stress(climate.precipitation_anomaly)
        soil_health = self._calculate_soil_health(
            climate.precipitation_anomaly,
            water_stress,
            climate.extreme_weather_risk
        )
        
        claims = [
            AgentClaim(
                metric="crop_yield_change",
                value=yield_change,
                unit="%",
                confidence=0.80
            ),
            AgentClaim(
                metric="water_stress_index",
                value=water_stress,
                unit="index",
                confidence=0.75
            ),
            AgentClaim(
                metric="soil_health_index",
                value=soil_health,
                unit="index",
                confidence=0.70
            ),
        ]
        
        recommendations = self._generate_recommendations(
            climate.precipitation_anomaly,
            climate.extreme_weather_risk
        )
        
        message = await self._generate_ai_analysis(
            climate,
            yield_change,
            water_stress,
            soil_health,
            state.location.name,
            state.userPrompt
        )
        
        # Create agent message
        agent_message = self.create_message(message, claims, recommendations)
        
        # Return updated state
        return {
            "agronomist_output": agent_message
        }
    
    async def _generate_ai_analysis(
        self,
        climate,
        yield_change: float,
        water_stress: float,
        soil_health: float,
        location_name: str,
        user_prompt: str = None
    ) -> str:
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
- Soil Health Index: {soil_health}/1.0

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
            soil_health=soil_health,
            user_context=user_context
        )
        
        if self.llm is None:
            raise EnvironmentError(
                "OPENAI_API_KEY environment variable is required to generate agronomist analysis"
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
        if precip_anomaly <= -45:
            yield_change = -25.0
        elif precip_anomaly <= -30:
            yield_change = -22.5
        elif precip_anomaly <= -15:
            yield_change = -12.5
        elif precip_anomaly <= 10:
            yield_change = -2.5
        else:
            # Slight boost for surplus precipitation without waterlogging modeling
            yield_change = min(8.0, precip_anomaly * 0.2)
        
        if temp_avg > 30:
            yield_change -= 5.0
        elif 15 <= temp_avg <= 25:
            yield_change += 5.0
        
        return yield_change
    
    def _calculate_water_stress(self, precip_anomaly: float) -> float:
        """
        Calculate water stress index (0-1 scale) based on precipitation anomaly
        
        Uses continuous scaling to avoid hardcoded thresholds:
        - Severe deficit: approaches 1.0 stress
        - Normal conditions: around 0.2 stress
        - Excess: slightly elevated stress (flooding risk)
        
        Returns:
            float: Water stress index 0-1
        """
        # Base stress calculation using linear scaling for clarity
        # Keeps normal conditions near 0.2 while allowing smooth transitions
        if precip_anomaly < 0:
            # Drought conditions: stress increases as deficit grows
            # Formula: stress = min(1.0, 0.2 + (-anomaly / 100))
            # This gives smooth scaling from 0.2 (normal) to 1.0 (severe)
            stress = min(1.0, 0.2 + (-precip_anomaly / 100))
        else:
            # Surplus conditions: low stress but slight increase for flooding
            # Cap at 0.3 for excessive rainfall (>50% surplus)
            stress = min(0.3, 0.2 + (precip_anomaly / 200))
        
        # Round to 2 decimal places for cleaner output
        return round(stress, 2)
    
    def _calculate_soil_health(self, precip_anomaly: float, water_stress: float, risk: str) -> float:
        """
        Estimate soil health index (0-1 scale) balancing moisture conditions and
        extreme weather risk. Higher values indicate healthier soils.
        """
        score = 0.7
        
        if precip_anomaly < 0:
            score -= min(0.4, abs(precip_anomaly) / 150)
        else:
            score += min(0.15, precip_anomaly / 250)
        
        score -= water_stress * 0.35
        
        risk_penalty = {
            "low": 0.0,
            "medium": 0.07,
            "high": 0.15
        }[risk]
        score -= risk_penalty
        
        return round(max(0.0, min(1.0, score)), 2)
    
    def _generate_recommendations(self, precip_anomaly: float, risk: str) -> List[str]:
        """
        Generate adaptive crop recommendations based on climate conditions
        
        Uses conditions to determine appropriate adaptations rather than
        hardcoding specific recommendations for each scenario.
        
        Returns:
            List[str]: 3-5 actionable recommendations tailored to conditions
        """
        recommendations = []
        
        # Calculate severity for drought conditions
        drought_severity = max(0, -precip_anomaly) if precip_anomaly < 0 else 0
        
        # 1. CROP SELECTION recommendations based on drought severity
        if drought_severity > 40:
            # Severe drought: aggressive crop switching
            switch_pct = min(50, int(drought_severity * 0.8))
            recommendations.append(
                f"Switch {switch_pct}% of water-intensive crops to drought-resistant varieties like sorghum or millet"
            )
        elif drought_severity > 20:
            # Moderate drought: gradual transition
            switch_pct = min(30, int(drought_severity))
            recommendations.append(
                f"Introduce {switch_pct}% drought-tolerant varieties to diversify crop portfolio"
            )
        elif drought_severity > 10:
            # Slight drought: preventative measures
            recommendations.append(
                "Begin transitioning 15-20% of fields to drought-resilient crop varieties as precaution"
            )
        
        # 2. WATER MANAGEMENT recommendations
        if drought_severity > 30:
            # Critical water shortage
            recommendations.append(
                "Implement emergency water conservation: drip irrigation for high-value crops and mulching"
            )
            recommendations.append(
                "Establish rainwater harvesting systems to capture any available precipitation"
            )
        elif drought_severity > 15:
            # Moderate water concerns
            recommendations.append(
                "Install water-efficient irrigation systems and improve soil moisture retention through organic matter"
            )
        
        # Handle excessive rainfall separately
        if precip_anomaly > 30:
            recommendations.append(
                "Improve field drainage systems to prevent waterlogging and root diseases"
            )
            recommendations.append(
                "Apply preventative fungicide treatments due to increased disease pressure from excess moisture"
            )
        
        # 3. RISK MANAGEMENT based on extreme weather risk level
        if risk == "high":
            # Always include diversification for high risk
            recommendations.append(
                "Diversify with legumes (beans, cowpeas) to improve soil nitrogen and reduce crop failure risk"
            )
            # Add conservation practices for resilience
            if len(recommendations) < 5:
                recommendations.append(
                    "Adopt conservation agriculture: minimum tillage, permanent soil cover, and crop rotation"
                )
        elif risk == "medium":
            # Financial protection for medium risk
            if len(recommendations) < 5:
                recommendations.append(
                    "Consider crop insurance to mitigate financial impacts of weather variability"
                )
        
        # 4. TIMING ADJUSTMENTS for any deficit
        if 10 < drought_severity < 30 and len(recommendations) < 5:
            recommendations.append(
                "Adjust planting schedules to align with optimal moisture windows and reduce crop stress"
            )
        
        # 5. FALLBACK recommendations if list is still sparse
        if len(recommendations) < 2:
            recommendations.append(
                "Monitor soil moisture levels regularly and adjust irrigation schedules based on crop needs"
            )
            recommendations.append(
                "Maintain diverse crop mix to spread climate risk across different growing patterns"
            )
        
        # Limit to top 5 most relevant recommendations
        return recommendations[:5]


# Singleton instance
agronomist = AgronomistAgent()
