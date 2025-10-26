"""
METEOROLOGIST AGENT - TEAMMATE 1
Analyzes climate data and environmental hazards for livability assessment
"""
from typing import Dict
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim, ClimateData
import httpx
import os
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from datetime import datetime, timedelta


class MeteorologistAgent(BaseAgent):
    def __init__(self):
        super().__init__("Meteorologist")
        # Initialize LLM for AI-powered analysis
        self.llm = ChatOpenAI(
            model="gpt-4o-mini",
            temperature=0.7,
            api_key=os.getenv("OPENAI_API_KEY")
        )
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        Analyzes climate conditions and environmental hazards for livability.
        
        Returns:
            Dict with keys: 'climate_data' and 'meteorologist_output'
        """
        
        years = getattr(state, "years_in_future", 5)
        
        # Fetch current climate data
        climate_data = await self._fetch_climate_data(
            state.location.lat,
            state.location.lng
        )
        
        # Calculate future projections
        projections = self._calculate_future_projections(climate_data, years)
        
        # Create claims
        claims = [
            AgentClaim(
                metric="temperature",
                value=climate_data.temperature,
                unit="°C",
                confidence=0.95
            ),
            AgentClaim(
                metric="precipitation",
                value=climate_data.precipitation,
                unit="mm",
                confidence=0.93
            ),
            AgentClaim(
                metric="temperature_anomaly",
                value=projections["temp_anomaly"],
                unit="°C",
                confidence=0.75
            ),
            AgentClaim(
                metric="precipitation_anomaly",
                value=projections["precip_anomaly"],
                unit="mm",
                confidence=0.72
            )
        ]
        
        # Generate AI-powered message
        message = await self._generate_ai_analysis(
            climate_data,
            projections,
            state.location.name,
            years,
            state.userPrompt
        )
        
        # Create agent message
        agent_message = self.create_message(message, claims)
        
        # Return updated state
        return {
            "climate_data": climate_data,
            "meteorologist_output": agent_message
        }
    
    def _calculate_future_projections(self, climate_data: ClimateData, years: int) -> Dict:
        """
        Project climate changes over the specified time horizon.
        Uses simplified climate models - in production, use actual climate models.
        """
        # Temperature typically increases 0.2-0.3°C per decade
        temp_increase_per_decade = 0.25
        temp_anomaly = (years / 10) * temp_increase_per_decade
        
        # Precipitation changes vary by region and baseline
        # Wet areas get wetter, dry areas get drier (simplified)
        baseline_precip = climate_data.precipitation
        if baseline_precip < 500:  # Dry region
            precip_change_rate = -5  # mm per decade
        elif baseline_precip > 1200:  # Wet region
            precip_change_rate = 15  # mm per decade
        else:  # Moderate
            precip_change_rate = 2
        
        precip_anomaly = (years / 10) * precip_change_rate
        
        return {
            "temp_anomaly": round(temp_anomaly, 2),
            "precip_anomaly": round(precip_anomaly, 1)
        }
    
    async def _generate_ai_analysis(self, climate_data: ClimateData, projections: Dict, 
                                   location_name: str, years: int, user_prompt: str = None) -> str:
        """
        Use AI to generate climate analysis for livability assessment
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert meteorologist analyzing climate risks for residential planning.
Provide concise, actionable analysis in 2-3 sentences.
Focus on environmental hazards and livability concerns."""),
            ("user", """Analyze this climate data for {location} over the next {years} years:

Current Conditions:
- Temperature: {temp}°C
- Precipitation: {precip}mm/year
- Extreme Weather Risk: {risk}

Projected Changes ({years} years):
- Temperature increase: +{temp_anomaly}°C
- Precipitation change: {precip_anomaly:+.0f}mm/year

{user_context}

Provide a brief assessment highlighting:
1. Current climate characteristics and habitability
2. Expected climate changes and emerging hazards
3. Key environmental risks for living in this location""")
        ])
        
        user_context = f"\nUser Context: {user_prompt}" if user_prompt else ""
        
        messages = prompt.format_messages(
            location=location_name,
            years=years,
            temp=climate_data.temperature,
            precip=climate_data.precipitation,
            risk=climate_data.extreme_weather_risk.upper(),
            temp_anomaly=projections["temp_anomaly"],
            precip_anomaly=projections["precip_anomaly"],
            user_context=user_context
        )
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def _fetch_climate_data(self, lat: float, lon: float) -> ClimateData:
        """
        Fetch climate data from Open-Meteo API
        Gets 90-day historical averages for temperature and precipitation
        """
        end_date = datetime.now()
        start_date = end_date - timedelta(days=90)
        
        url = "https://archive-api.open-meteo.com/v1/archive"
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date.strftime("%Y-%m-%d"),
            "end_date": end_date.strftime("%Y-%m-%d"),
            "daily": "temperature_2m_mean,precipitation_sum",
            "timezone": "auto"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
        
        # Calculate averages
        temps = data["daily"]["temperature_2m_mean"]
        precips = data["daily"]["precipitation_sum"]
        
        avg_temp = sum(temps) / len(temps)
        total_precip = sum(precips)
        # Annualize precipitation (90 days -> 365 days)
        annual_precip = total_precip * (365 / 90)
        
        # Assess extreme weather risk based on climate characteristics
        risk = self._assess_weather_risk(avg_temp, annual_precip, lat, lon)
        
        return ClimateData(
            temperature=round(avg_temp, 1),
            precipitation=round(annual_precip, 1),
            extreme_weather_risk=risk
        )
    
    def _assess_weather_risk(self, temp: float, precip: float, lat: float, lon: float) -> str:
        """
        Assess extreme weather risk level based on climate and location
        """
        risk_score = 0
        
        # Temperature extremes
        if temp > 30:
            risk_score += 2
        elif temp > 27:
            risk_score += 1
        
        # Precipitation extremes
        if precip < 400:  # Drought-prone
            risk_score += 2
        elif precip > 1800:  # Flood-prone
            risk_score += 2
        elif precip > 1200:
            risk_score += 1
        
        # Hurricane/tropical storm zones
        # Gulf Coast, Southeast US, Caribbean
        if (24 < lat < 32 and -98 < lon < -80) or (15 < lat < 30 and -85 < lon < -60):
            risk_score += 2
        
        # Tornado alley (rough approximation)
        if 30 < lat < 45 and -105 < lon < -85:
            risk_score += 1
        
        # Map score to risk level
        if risk_score >= 4:
            return "extreme"
        elif risk_score >= 3:
            return "high"
        elif risk_score >= 2:
            return "medium"
        else:
            return "low"


# Singleton instance
meteorologist = MeteorologistAgent()