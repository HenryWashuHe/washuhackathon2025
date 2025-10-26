"""
ECONOMIST AGENT - TEAMMATE 2
Analyzes economic impacts of climate change on livability and property values
"""
from typing import Dict
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim
import math


class EconomistAgent(BaseAgent):
    def __init__(self):
        super().__init__("Economist")
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        Analyzes economic impacts of climate risks on living costs and property values.
        
        Returns:
            Dict with key: 'economist_output'
        """
        
        # Ensure we have climate data from meteorologist
        if not state.meteorologist_output:
            raise ValueError("Climate data required from Meteorologist")
        
        years = getattr(state, "years_in_future", 5)
        
        # Extract climate metrics from meteorologist
        climate_metrics = self._extract_climate_metrics(state)
        
        # Calculate economic impacts
        adaptation_cost = self._estimate_adaptation_cost(
            state.climate_data.extreme_weather_risk,
            state.climate_data.temperature,
            years
        )
        
        property_value_impact = self._calculate_property_impact(
            state.climate_data,
            years,
            state.location.lat,
            state.location.lng
        )
        
        insurance_cost = self._estimate_insurance_cost(
            state.climate_data.extreme_weather_risk,
            years
        )
        
        # Calculate overall economic vulnerability (0-100 scale)
        economic_vulnerability = self._assess_economic_vulnerability(
            adaptation_cost,
            property_value_impact,
            insurance_cost
        )
        
        # Create claims
        claims = [
            AgentClaim(
                metric="adaptation_cost",
                value=adaptation_cost / 1000,  # Convert to thousands for planner
                unit="k USD",
                confidence=0.72
            ),
            AgentClaim(
                metric="property_value_change",
                value=property_value_impact,
                unit="%",
                confidence=0.68
            ),
            AgentClaim(
                metric="annual_insurance_cost",
                value=insurance_cost,
                unit="USD",
                confidence=0.75
            ),
            AgentClaim(
                metric="economic_vulnerability",
                value=economic_vulnerability,
                unit="0-100",
                confidence=0.70
            )
        ]
        
        # Generate message
        message = self._generate_message(
            state.location.name,
            years,
            adaptation_cost,
            property_value_impact,
            insurance_cost,
            economic_vulnerability
        )
        
        # Create agent message
        agent_message = self.create_message(message, claims)
        
        # Return updated state
        return {
            "economist_output": agent_message
        }
    
    def _extract_climate_metrics(self, state: AgentState) -> Dict:
        """Extract relevant metrics from meteorologist's analysis"""
        metrics = {
            "temp_anomaly": 0,
            "precip_anomaly": 0
        }
        
        if hasattr(state.meteorologist_output, 'claims'):
            for claim in state.meteorologist_output.claims:
                if claim.metric == "temperature_anomaly":
                    metrics["temp_anomaly"] = claim.value
                elif claim.metric == "precipitation_anomaly":
                    metrics["precip_anomaly"] = claim.value
        
        return metrics
    
    def _estimate_adaptation_cost(self, risk: str, temp: float, years: int) -> float:
        """
        Estimate cost of climate adaptation for a household (in USD)
        
        Includes:
        - HVAC upgrades for temperature extremes
        - Storm-proofing and reinforcements
        - Backup power systems
        - Water management systems
        """
        base_cost = {
            "low": 5000,
            "medium": 15000,
            "high": 35000,
            "extreme": 60000
        }.get(risk, 15000)
        
        # Temperature-based additions (cooling/heating upgrades)
        if temp > 30:
            base_cost += (temp - 30) * 2000  # $2k per degree above 30°C
        elif temp < 10:
            base_cost += (10 - temp) * 1500  # $1.5k per degree below 10°C
        
        # Time-based scaling (costs increase with longer horizons)
        if years > 10:
            time_multiplier = 1 + ((years - 10) * 0.05)  # 5% per year after year 10
            base_cost *= time_multiplier
        
        return round(base_cost)
    
    def _calculate_property_impact(self, climate_data, years: int, lat: float, lon: float) -> float:
        """
        Calculate expected property value change (percentage)
        Negative = property devaluation
        """
        impact = 0
        
        # Extreme weather risk impact
        risk_impact = {
            "low": 0,
            "medium": -3,
            "high": -8,
            "extreme": -15
        }.get(climate_data.extreme_weather_risk, -3)
        
        impact += risk_impact
        
        # Temperature extremes
        if climate_data.temperature > 32:
            impact -= 10  # Severe devaluation for extreme heat
        elif climate_data.temperature > 28:
            impact -= 5
        
        # Coastal vulnerability (sea level rise concern)
        if self._is_coastal(lat, lon):
            if years > 15:
                impact -= 12  # Significant coastal property devaluation
            elif years > 10:
                impact -= 7
        
        # Drought impact
        if climate_data.precipitation < 400:
            impact -= 6
        
        # Time-based compounding
        if years > 20:
            impact *= 1.5  # 50% worse for long-term outlook
        
        return round(impact, 1)
    
    def _estimate_insurance_cost(self, risk: str, years: int) -> float:
        """
        Estimate annual homeowner's insurance cost
        Increases with climate risk
        """
        base_cost = {
            "low": 1200,
            "medium": 2500,
            "high": 5000,
            "extreme": 9000
        }.get(risk, 2500)
        
        # Insurance costs rise faster in high-risk areas over time
        if years > 5:
            annual_increase = 0.07 if risk in ["high", "extreme"] else 0.04
            multiplier = (1 + annual_increase) ** years
            base_cost *= multiplier
        
        return round(base_cost)
    
    def _assess_economic_vulnerability(self, adaptation_cost: float, 
                                      property_impact: float, 
                                      insurance_cost: float) -> float:
        """
        Calculate overall economic vulnerability score (0-100)
        Higher = more economically vulnerable to climate change
        """
        vulnerability = 0
        
        # Adaptation cost contribution (0-40 points)
        if adaptation_cost > 50000:
            vulnerability += 40
        elif adaptation_cost > 30000:
            vulnerability += 30
        elif adaptation_cost > 15000:
            vulnerability += 20
        else:
            vulnerability += 10
        
        # Property devaluation contribution (0-35 points)
        vulnerability += min(abs(property_impact) * 2.5, 35)
        
        # Insurance cost contribution (0-25 points)
        if insurance_cost > 7000:
            vulnerability += 25
        elif insurance_cost > 4000:
            vulnerability += 18
        elif insurance_cost > 2000:
            vulnerability += 10
        else:
            vulnerability += 5
        
        return min(vulnerability, 100)
    
    def _is_coastal(self, lat: float, lon: float) -> bool:
        """Check if location is coastal (simplified heuristic)"""
        # Florida
        if 24 < lat < 31 and -88 < lon < -80:
            return True
        # Gulf Coast
        if 29 < lat < 31 and -98 < lon < -88:
            return True
        # East Coast
        if 32 < lat < 45 and -79 < lon < -70:
            return True
        # West Coast
        if 32 < lat < 49 and -125 < lon < -117:
            return True
        return False
    
    def _generate_message(self, location: str, years: int, 
                         adaptation_cost: float, property_impact: float,
                         insurance_cost: float, vulnerability: float) -> str:
        """Generate human-readable economic analysis"""
        
        risk_level = "high" if vulnerability > 60 else "moderate" if vulnerability > 40 else "low"
        
        message = (
            f"Economic analysis for {location} over {years} years shows {risk_level} financial vulnerability. "
            f"Expected climate adaptation costs: ${adaptation_cost:,.0f}. "
            f"Property values may change by {property_impact:+.1f}%, with annual insurance costs around ${insurance_cost:,.0f}. "
        )
        
        if property_impact < -10:
            message += "Significant property devaluation risk due to climate factors."
        elif adaptation_cost > 40000:
            message += "High upfront adaptation investment needed for climate resilience."
        
        return message


# Singleton instance
economist = EconomistAgent()