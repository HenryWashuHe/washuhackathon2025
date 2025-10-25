"""
METEOROLOGIST AGENT - TEAMMATE 1
Analyzes climate data from Open-Meteo API using AI

TODO: Implement the analyze() method
"""
from typing import Dict
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim, ClimateData
import httpx
import os
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
        """
        TODO: Implement meteorologist analysis
        
        Steps:
        1. Fetch climate data from Open-Meteo API
        2. Calculate metrics (temperature, precipitation, anomalies)
        3. Assess extreme weather risk
        4. Create claims with confidence scores
        5. Generate natural language message
        6. Return updated state
        
        Returns:
            Dict with keys: 'climate_data' and 'meteorologist_output'
        """
        
        # TODO 1: Fetch climate data
        climate_data = await self._fetch_climate_data(
            state.location.lat,
            state.location.lng
        )
        
        # TODO 2: Create claims
        claims = [
            # Example claim - add more
            AgentClaim(
                metric="temperature_avg",
                value=climate_data.temperature_avg,
                unit="°C",
                confidence=0.95
            ),
            # TODO: Add precipitation_anomaly claim
            # TODO: Add extreme_weather_risk claim
        ]
        
        # TODO 3: Generate AI-powered message (2-3 sentences)
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
        TODO: Implement Open-Meteo API call
        
        Steps:
        1. Build API URL with lat/lon and date range (last 90 days)
        2. Fetch temperature_2m_mean and precipitation_sum
        3. Calculate averages and anomalies
        4. Assess risk level
        5. Return ClimateData object
        
        API: https://archive-api.open-meteo.com/v1/archive
        Params: latitude, longitude, start_date, end_date, daily=temperature_2m_mean,precipitation_sum
        """
        # TODO: Implement this method
        # Hint: Use httpx.AsyncClient() to make API call
        # Hint: Calculate precipitation anomaly by comparing to normal (~75mm/month)
        # Hint: Risk is "high" if anomaly < -30% or temp > 35°C
        
        return ClimateData(
            temperature_avg=20.0,  # TODO: Replace with real data
            precipitation_sum=200.0,  # TODO: Replace with real data
            precipitation_anomaly=0.0,  # TODO: Calculate this
            extreme_weather_risk="medium"  # TODO: Assess this
        )


# Singleton instance
meteorologist = MeteorologistAgent()
