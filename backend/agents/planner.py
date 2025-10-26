"""
PLANNER AGENT - CLIMATE LIVABILITY ASSESSOR
Evaluates long-term climate risks and livability for a location.
Synthesizes outputs from Meteorologist and Economist agents.
"""

from typing import Dict, List
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim
import math


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("Planner")
    
    async def analyze(self, state: AgentState) -> Dict:
        """
        Assesses climate risks and livability for a location over a specified time horizon.
        Returns environmental hazards, economic impact, and overall risk scores (0-100).
        """

        # Ensure required agents have run
        if not state.meteorologist_output or not state.economist_output:
            raise ValueError("Meteorologist and Economist agents must complete before Planner")

        years = getattr(state, "years_in_future", 5)

        # Extract insights from other agents
        meteorologist_data = self._extract_meteorologist_insights(state)
        economist_data = self._extract_economist_insights(state)

        # Identify environmental hazards
        hazards = self._identify_hazards(state, years, meteorologist_data)

        # Calculate risk scores (0-100)
        risk_scores = self._calculate_risk_scores(state, years, hazards, meteorologist_data)

        # Estimate economic losses using economist data
        economic_impact = self._estimate_economic_losses(state, years, hazards, economist_data)

        # Generate recommendations
        recommendations = self._generate_recommendations(state, years, hazards, risk_scores)

        # Create claims for transparency
        claims = [
            AgentClaim(
                metric="overall_risk", 
                value=risk_scores["overall"], 
                unit="0-100", 
                confidence=0.85
            ),
            AgentClaim(
                metric="environmental_risk", 
                value=risk_scores["environmental"], 
                unit="0-100", 
                confidence=0.88
            ),
            AgentClaim(
                metric="economic_risk", 
                value=risk_scores["economic"], 
                unit="0-100", 
                confidence=0.82
            ),
            AgentClaim(
                metric="estimated_annual_losses", 
                value=economic_impact["annual_loss_per_capita"], 
                unit="USD", 
                confidence=0.75
            )
        ]

        # Create human-readable summary
        risk_level = self._get_risk_level(risk_scores["overall"])
        message = (
            f"Livability assessment for {state.location.name} in {years} years:\n\n"
            f"Overall Risk: {risk_scores['overall']:.1f}/100 ({risk_level})\n"
            f"Environmental Risk: {risk_scores['environmental']:.1f}/100\n"
            f"Economic Risk: {risk_scores['economic']:.1f}/100\n\n"
            f"Primary Environmental Hazards: {', '.join(hazards[:3])}\n"
            f"Estimated annual economic losses: ${economic_impact['annual_loss_per_capita']:,.0f} per capita\n\n"
            f"Based on analysis from Meteorologist and Economist agents."
        )

        agent_message = self.create_message(message, claims, recommendations)

        return {
            "planner_output": agent_message,
            "risk_scores": risk_scores,
            "hazards": hazards,
            "economic_impact": economic_impact
        }

    # --------------------------- INTERNAL METHODS ----------------------------

    def _extract_meteorologist_insights(self, state: AgentState) -> Dict:
        """Extract relevant climate insights from meteorologist agent output."""
        met_output = state.meteorologist_output
        
        insights = {
            "precipitation_trend": 0,
            "temperature_anomaly": 0,
            "extreme_weather_likelihood": "medium"
        }
        
        # Extract from claims if available
        if hasattr(met_output, 'claims'):
            for claim in met_output.claims:
                if claim.metric == "precipitation_anomaly":
                    insights["precipitation_trend"] = claim.value
                elif claim.metric == "temperature_anomaly":
                    insights["temperature_anomaly"] = claim.value
        
        return insights

    def _extract_economist_insights(self, state: AgentState) -> Dict:
        """Extract economic data from economist agent output."""
        econ_output = state.economist_output
        
        insights = {
            "income_change": 0,
            "adaptation_cost": 0,
            "economic_vulnerability": 50  # Default medium vulnerability
        }
        
        # Extract from claims if available
        if hasattr(econ_output, 'claims'):
            for claim in econ_output.claims:
                if claim.metric == "income_change":
                    insights["income_change"] = claim.value
                elif claim.metric == "adaptation_cost":
                    insights["adaptation_cost"] = claim.value
                elif claim.metric == "economic_impact":
                    insights["economic_vulnerability"] = abs(claim.value)
        
        return insights

    def _identify_hazards(self, state: AgentState, years: int, met_data: Dict) -> List[str]:
        """
        Identify likely environmental hazards based on location and climate data.
        Returns list of hazards in order of severity.
        """
        hazards = []
        climate = state.climate_data
        
        # Use meteorologist's precipitation trend
        precip_trend = met_data.get("precipitation_trend", 0)
        temp_anomaly = met_data.get("temperature_anomaly", 0)
        
        # Temperature-based hazards (account for meteorologist's anomaly)
        effective_temp = climate.temperature + (temp_anomaly * years / 10)
        
        if effective_temp > 28:
            hazards.append("Extreme heat waves")
            if years > 10:
                hazards.append("Prolonged heat stress")
        
        if effective_temp > 32 and years > 15:
            hazards.append("Dangerous heat conditions")
        
        # Precipitation-based hazards (account for meteorologist's trend)
        effective_precip = climate.precipitation + (precip_trend * years / 5)
        
        if effective_precip < 400:
            hazards.append("Severe drought")
            hazards.append("Water scarcity")
        elif effective_precip > 1500:
            hazards.append("Flooding")
            hazards.append("Storm damage")
        
        # Extreme weather risk
        if climate.extreme_weather_risk in ["high", "extreme"]:
            hazards.append("Hurricanes/tropical storms")
            hazards.append("Tornado risk")
            hazards.append("Severe thunderstorms")
        
        # Future projections based on years
        if years > 15:
            if effective_temp > 30:
                hazards.append("Unlivable heat conditions")
            if climate.extreme_weather_risk != "low":
                hazards.append("Increased storm intensity")
        
        if years > 30:
            # Long-term catastrophic risks
            if effective_temp > 33:
                hazards.append("Ecosystem collapse")
            hazards.append("Infrastructure breakdown")
            hazards.append("Mass displacement risk")
        
        # Coastal risks
        lat, lng = state.location.lat, state.location.lng
        is_coastal = self._is_likely_coastal(lat, lng)
        if is_coastal and years > 10:
            hazards.append("Sea level rise")
            hazards.append("Coastal flooding")
        
        return hazards[:8]  # Return top 8 hazards

    def _is_likely_coastal(self, lat: float, lng: float) -> bool:
        """
        Simple heuristic to identify coastal regions (Florida, Gulf Coast, etc.)
        In production, you'd use elevation/distance-to-coast data.
        """
        # Florida
        if 24 < lat < 31 and -88 < lng < -80:
            return True
        # Gulf Coast
        if 29 < lat < 31 and -98 < lng < -88:
            return True
        # East Coast
        if 32 < lat < 45 and -79 < lng < -70:
            return True
        # West Coast
        if 32 < lat < 49 and -125 < lng < -117:
            return True
        return False

    def _calculate_risk_scores(self, state: AgentState, years: int, 
                               hazards: List[str], met_data: Dict) -> Dict:
        """
        Calculate objective risk scores (0-100) for environmental and economic factors.
        Higher = more dangerous/costly.
        """
        climate = state.climate_data
        
        # ENVIRONMENTAL RISK CALCULATION
        env_risk = 0
        
        # Base temperature risk with meteorologist's anomaly
        temp_anomaly = met_data.get("temperature_anomaly", 0)
        effective_temp = climate.temperature + (temp_anomaly * years / 10)
        temp_deviation = abs(effective_temp - 25)
        env_risk += min(temp_deviation * 3, 35)  # Up to 35 points
        
        # Extreme weather multiplier
        weather_risk_map = {"low": 0, "medium": 15, "high": 30, "extreme": 45}
        env_risk += weather_risk_map.get(climate.extreme_weather_risk, 15)
        
        # Precipitation extremes with meteorologist's trend
        precip_trend = met_data.get("precipitation_trend", 0)
        effective_precip = climate.precipitation + (precip_trend * years / 5)
        
        if effective_precip < 400:  # Drought
            env_risk += 20
        elif effective_precip > 1800:  # Excessive rain
            env_risk += 15
        
        # Hazard count penalty
        env_risk += len(hazards) * 2
        
        # Time-based escalation
        if years <= 10:
            time_multiplier = 1 + (years * 0.03)  # 3% per year
        elif years <= 30:
            time_multiplier = 1.3 + ((years - 10) * 0.05)  # 5% per year after year 10
        else:
            time_multiplier = 2.3 + ((years - 30) * 0.08)  # 8% per year after year 30
        
        env_risk *= time_multiplier
        
        # Cap at 100
        env_risk = min(env_risk, 100)
        
        # ECONOMIC RISK CALCULATION
        # Start with environmental risk correlation
        econ_risk = env_risk * 0.7
        
        # Severe hazards increase economic risk
        severe_hazards = ["Hurricanes/tropical storms", "Flooding", "Unlivable heat conditions", 
                         "Sea level rise", "Infrastructure breakdown"]
        severe_count = sum(1 for h in hazards if h in severe_hazards)
        econ_risk += severe_count * 8
        
        # Coastal penalty (higher property values at risk)
        if self._is_likely_coastal(state.location.lat, state.location.lng):
            econ_risk += 15
        
        # Long-term economic uncertainty
        if years > 20:
            econ_risk += (years - 20) * 0.5
        
        econ_risk = min(econ_risk, 100)
        
        # OVERALL RISK (weighted average)
        overall_risk = (env_risk * 0.6) + (econ_risk * 0.4)
        
        return {
            "environmental": round(env_risk, 1),
            "economic": round(econ_risk, 1),
            "overall": round(overall_risk, 1)
        }

    def _estimate_economic_losses(self, state: AgentState, years: int, 
                                  hazards: List[str], econ_data: Dict) -> Dict:
        """
        Estimate annual economic losses per capita based on climate risks.
        Uses economist agent's data for baseline costs.
        """
        # Start with economist's adaptation cost estimate
        base_loss = max(econ_data.get("adaptation_cost", 500) * 100, 500)
        
        # Factor in income change from economist
        income_impact = econ_data.get("income_change", 0)
        if income_impact < 0:
            base_loss += abs(income_impact) * 50  # Negative income change increases losses
        
        # Multiply by hazard severity
        for hazard in hazards:
            if "hurricane" in hazard.lower() or "storm" in hazard.lower():
                base_loss += 2000
            elif "flood" in hazard.lower():
                base_loss += 1500
            elif "heat" in hazard.lower() and ("extreme" in hazard.lower() or "dangerous" in hazard.lower()):
                base_loss += 1200
            elif "drought" in hazard.lower():
                base_loss += 800
            elif "sea level" in hazard.lower():
                base_loss += 2500
            elif "infrastructure" in hazard.lower():
                base_loss += 1800
            else:
                base_loss += 300
        
        # Time multiplier
        if years > 10:
            base_loss *= (1 + (years - 10) * 0.05)
        
        # Temperature penalty (higher temps = higher cooling costs, health costs, etc.)
        temp = state.climate_data.temperature
        if temp > 30:
            base_loss += (temp - 30) * 200
        
        # Economic vulnerability from economist agent
        vulnerability_factor = econ_data.get("economic_vulnerability", 50) / 50
        base_loss *= vulnerability_factor
        
        return {
            "annual_loss_per_capita": round(base_loss),
            "total_estimated_loss_10yr": round(base_loss * 10),
            "economist_adaptation_cost": econ_data.get("adaptation_cost", 0),
            "confidence": 0.75
        }

    def _generate_recommendations(self, state: AgentState, years: int, 
                                 hazards: List[str], risk_scores: Dict) -> List[str]:
        """
        Generate actionable recommendations based on risk assessment.
        """
        recs = []
        overall_risk = risk_scores["overall"]
        
        # Risk-level based advice
        if overall_risk > 75:
            recs.append("⚠️ HIGH RISK: Strongly consider alternative locations with lower climate risk")
            recs.append("If staying, invest heavily in climate-resilient housing and infrastructure")
        elif overall_risk > 50:
            recs.append("⚠️ MODERATE-HIGH RISK: Prepare for significant climate adaptation needs")
            recs.append("Budget for increased insurance and disaster preparedness")
        elif overall_risk > 25:
            recs.append("✓ MODERATE RISK: Standard climate precautions recommended")
        else:
            recs.append("✓ LOW RISK: Location shows relatively stable climate outlook")
        
        # Hazard-specific recommendations
        if "heat" in str(hazards).lower():
            recs.append("Install high-efficiency cooling systems and consider heat-resilient building materials")
        
        if "hurricane" in str(hazards).lower() or "storm" in str(hazards).lower():
            recs.append("Ensure hurricane-rated construction and maintain comprehensive insurance")
        
        if "Drought" in hazards or "Water scarcity" in hazards:
            recs.append("Invest in water conservation systems and alternative water sources")
        
        if "Flooding" in hazards or "Sea level rise" in hazards:
            recs.append("Verify property elevation and flood zone status; consider relocation from high-risk zones")
        
        # Time-horizon specific advice
        if years > 20:
            recs.append("For long-term planning, consider generational climate migration patterns")
        
        if years > 30:
            recs.append("At 30+ year horizons, climate uncertainty is high; maintain flexibility in plans")
        
        return recs[:7]

    def _get_risk_level(self, score: float) -> str:
        """Convert numeric risk to descriptive level."""
        if score >= 80:
            return "EXTREME RISK"
        elif score >= 60:
            return "HIGH RISK"
        elif score >= 40:
            return "MODERATE RISK"
        elif score >= 20:
            return "LOW-MODERATE RISK"
        else:
            return "LOW RISK"


planner = PlannerAgent()