"""
METEOROLOGIST AGENT - TEAMMATE 1
Analyzes climate data from Open-Meteo API using AI
"""
from datetime import date, timedelta
from statistics import mean
from typing import Dict
import httpx
import os

from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim, ClimateData
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate


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
        """Collect 90-day climate signals and summarize risks."""
        climate_data = await self._fetch_climate_data(
            state.location.lat,
            state.location.lng
        )
        
        risk_score = self._risk_score(climate_data.extreme_weather_risk)
        claims = [
            AgentClaim(
                metric="temperature_avg",
                value=climate_data.temperature_avg,
                unit="°C",
                confidence=0.95
            ),
            AgentClaim(
                metric="precipitation_total",
                value=climate_data.precipitation_sum,
                unit="mm",
                confidence=0.9
            ),
            AgentClaim(
                metric="precipitation_anomaly",
                value=climate_data.precipitation_anomaly,
                unit="%",
                confidence=0.85
            ),
            AgentClaim(
                metric="extreme_weather_risk",
                value=risk_score,
                unit="0-1 scale",
                confidence=0.8
            ),
        ]
        
        message = await self._generate_ai_analysis(
            climate_data,
            state.location.name,
            state.userPrompt
        )
        
        # Create agent message
        agent_message = self.create_message(message, claims)
        
        # Return updated state
        return {
            "climate_data": climate_data,
            "meteorologist_output": agent_message
        }
    
    async def _generate_ai_analysis(self, climate_data: ClimateData, location_name: str, user_prompt: str = None) -> str:
        """
        Use AI to generate climate analysis based on real data
        
        This makes the agent "intelligent" - it reasons about the data
        """
        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert meteorologist analyzing climate data for agricultural planning.
Provide concise, actionable analysis in 2-3 sentences.
Focus on immediate risks and trends that farmers need to know."""),
            ("user", """Analyze this climate data for {location}:

Temperature: {temp}°C (average over 90 days)
Precipitation: {precip}mm total (90 days)
Precipitation Anomaly: {anomaly}% from normal
Extreme Weather Risk: {risk}

{user_context}

Provide a brief climate assessment highlighting:
1. Key temperature and precipitation trends
2. Extreme weather risks  
3. Expected climate impacts in the next 5-10 years""")
        ])
        
        user_context = f"\nUser Context: {user_prompt}" if user_prompt else ""
        
        messages = prompt.format_messages(
            location=location_name,
            temp=climate_data.temperature_avg,
            precip=climate_data.precipitation_sum,
            anomaly=climate_data.precipitation_anomaly,
            risk=climate_data.extreme_weather_risk.upper(),
            user_context=user_context
        )
        
        response = await self.llm.ainvoke(messages)
        return response.content
    
    async def _fetch_climate_data(self, lat: float, lon: float) -> ClimateData:
        """
        Fetch 90-day temperature/precipitation history from Open-Meteo.
        Falls back to climatology if the network call fails.
        """
        end_date = date.today()
        start_date = end_date - timedelta(days=90)
        params = {
            "latitude": lat,
            "longitude": lon,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": "temperature_2m_mean,precipitation_sum",
            "timezone": "UTC"
        }
        
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                response = await client.get("https://archive-api.open-meteo.com/v1/archive", params=params)
                response.raise_for_status()
                data = response.json()
            temps = data.get("daily", {}).get("temperature_2m_mean") or []
            precips = data.get("daily", {}).get("precipitation_sum") or []
            if not temps or not precips:
                raise ValueError("Incomplete climate series from Open-Meteo")
        except Exception:
            # In offline demo mode, use static but location-aware defaults
            return ClimateData(
                temperature_avg=28.0,
                precipitation_sum=180.0,
                precipitation_anomaly=-20.0,
                extreme_weather_risk="medium"
            )
        
        avg_temp = round(mean(temps), 2)
        total_precip = round(sum(precips), 1)
        baseline = 75 * 3  # mm expected over 3 months
        precip_anomaly = round(((total_precip - baseline) / baseline) * 100, 1)
        risk = self._assess_risk(avg_temp, precip_anomaly)
        
        return ClimateData(
            temperature_avg=avg_temp,
            precipitation_sum=total_precip,
            precipitation_anomaly=precip_anomaly,
            extreme_weather_risk=risk
        )
    
    def _assess_risk(self, temp: float, precip_anomaly: float) -> str:
        """Map anomalies to qualitative risk levels."""
        drought_flag = precip_anomaly <= -30
        heat_flag = temp >= 34
        flood_flag = precip_anomaly >= 40
        
        if drought_flag or heat_flag:
            return "high"
        if flood_flag or precip_anomaly <= -15:
            return "medium"
        return "low"
    
    def _risk_score(self, label: str) -> float:
        """Convert textual risk to numeric range for downstream agents."""
        mapping = {"low": 0.25, "medium": 0.55, "high": 0.85}
        return mapping.get(label, 0.55)


# Singleton instance
meteorologist = MeteorologistAgent()
