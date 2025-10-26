"""
PLANNER AGENT - TEAMMATE 4
Synthesizes all agent outputs into actionable strategies.
"""
from typing import Dict, List, Any
from agents.base import BaseAgent
from models.schemas import AgentState, AgentClaim, AgentMessage, Priorities


class PlannerAgent(BaseAgent):
    def __init__(self):
        super().__init__("Planner")
    
    async def analyze(self, state: AgentState) -> Dict:
        """Combine upstream analyses into a weighted adaptation strategy."""

        if not all([
            state.meteorologist_output,
            state.agronomist_output,
            state.economist_output
        ]):
            raise ValueError("All previous agents must complete before Planner")
        
        metrics = self._extract_metrics(state)
        
        strategy = self._generate_strategy(
            metrics,
            state.priorities,
            state.climate_data.extreme_weather_risk
        )
        
        impact = self._calculate_impact(strategy, metrics)
        
        claims = [
            AgentClaim(
                metric="strategy_score",
                value=self._score_strategy(impact, state.priorities),
                unit="0-100",
                confidence=0.85
            ),
            AgentClaim(
                metric="climate_resilience_gain",
                value=max(0.0, round(-impact["risk"], 3)),
                unit="delta",
                confidence=0.75
            ),
            AgentClaim(
                metric="food_security_improvement",
                value=round(impact["food"], 3),
                unit="delta",
                confidence=0.72
            ),
        ]
        
        all_recommendations = self._compile_recommendations(state, strategy)
        
        message = self._build_summary_message(
            state.location.name,
            state.priorities,
            metrics,
            strategy,
            impact
        )
        
        agent_message = self.create_message(message, claims, all_recommendations)
        
        return {
            "planner_output": agent_message,
            "strategy": strategy,
            "impact": impact
        }
    
    def _extract_metrics(self, state: AgentState) -> Dict:
        """Pull the most relevant metrics from prior agent outputs."""
        climate = state.climate_data
        agronomist = state.agronomist_output
        economist = state.economist_output
        meteorologist = state.meteorologist_output
        
        metrics = {
            "precip_anomaly": climate.precipitation_anomaly if climate else 0.0,
            "temperature_avg": climate.temperature_avg if climate else None,
            "extreme_risk": climate.extreme_weather_risk if climate else "medium",
            "yield_change": self._claim_value(agronomist, "crop_yield_change", default=0.0),
            "water_stress": self._claim_value(agronomist, "water_stress_index", default=0.25),
            "soil_health": self._claim_value(agronomist, "soil_health_index", default=0.5),
            "income_change": self._claim_value(economist, "income_change", default=0.0),
            "adaptation_cost": self._claim_value(economist, "adaptation_cost", default=None),
            "economic_resilience": self._claim_value(economist, "economic_resilience", default=0.5),
            "meteorologist_recs": (meteorologist.recommendations if meteorologist else []) or [],
            "agronomist_recs": (agronomist.recommendations if agronomist else []) or [],
            "economist_recs": (economist.recommendations if economist else []) or [],
        }
        return metrics
    
    def _generate_strategy(self, metrics: Dict, priorities: Priorities, risk: str) -> Dict:
        strategy = {
            "crop_mix": {},
            "irrigation": False,
            "water_harvesting": False,
            "soil_improvements": False,
            "adaptation_timeline": "short-term",
            "financing_focus": "balanced"
        }
        
        drought_severity = max(0.0, -metrics["precip_anomaly"])
        water_stress = metrics["water_stress"]
        soil_health = metrics["soil_health"]
        income_change = metrics["income_change"]
        adaptation_cost = metrics["adaptation_cost"]
        economic_resilience = metrics["economic_resilience"]
        
        priority_total = max(1.0, priorities.economic + priorities.environmental + priorities.social)
        weights = {
            "economic": priorities.economic / priority_total,
            "environmental": priorities.environmental / priority_total,
            "social": priorities.social / priority_total
        }
        
        base_mix = {
            "maize": 0.45,
            "sorghum": 0.35,
            "legumes": 0.20
        }
        
        if drought_severity > 20 or water_stress >= 0.45:
            base_mix["maize"] -= 0.15
            base_mix["sorghum"] += 0.10
            base_mix["legumes"] += 0.05
            strategy["water_harvesting"] = True
        
        if soil_health < 0.4:
            base_mix["legumes"] += 0.05
            base_mix["maize"] -= 0.05
            strategy["soil_improvements"] = True
        
        # Add cash crops to stabilize income, then normalize mix to maintain 100%
        if income_change < 0:
            strategy["financing_focus"] = "stabilize incomes"
            # Add 10% cash crops (normalization below will adjust proportions)
            base_mix["cash_crops"] = 0.10
            # Scale down other crops proportionally to make room
            for crop in ("maize", "sorghum", "legumes"):
                if crop in base_mix:
                    base_mix[crop] = round(base_mix[crop] * 0.9, 3)
        else:
            # Add smaller cash crop component in good income scenarios
            base_mix["cash_crops"] = 0.05
            # Scale existing crops to maintain balance
            for crop in ("maize", "sorghum", "legumes"):
                if crop in base_mix:
                    base_mix[crop] = round(base_mix[crop] * 0.95, 3)
        
        if risk == "high" or water_stress > 0.6 or economic_resilience < 0.35:
            strategy["irrigation"] = True
            strategy["adaptation_timeline"] = "immediate"
        elif risk == "medium":
            strategy["adaptation_timeline"] = "short-term"
        else:
            strategy["adaptation_timeline"] = "2-3 years"
        
        if weights["environmental"] > 0.45:
            strategy["soil_improvements"] = True
            strategy["water_harvesting"] = True
        
        if weights["economic"] > 0.45 and income_change < 0:
            strategy["irrigation"] = True
        
        if adaptation_cost is not None and adaptation_cost > 90000:
            strategy["financing_focus"] = "phase investments"
        elif adaptation_cost is not None and adaptation_cost < 40000:
            strategy["financing_focus"] = "leverage existing budgets"
        
        # Normalize crop mix to ensure it sums to 1.0 (100%)
        # This handles any rounding errors or overlapping adjustments above
        total_mix = sum(base_mix.values())
        if total_mix > 0:
            normalized = {}
            crops = list(base_mix.items())
            running = 0.0
            for name, value in crops[:-1]:
                share = round(value / total_mix, 3)
                normalized[name] = max(0.0, share)
                running += normalized[name]
            last_name, last_value = crops[-1]
            normalized[last_name] = round(max(0.0, 1.0 - running), 3)
            base_mix = normalized
        
        strategy["crop_mix"] = base_mix
        return strategy
    
    def _calculate_impact(self, strategy: Dict, metrics: Dict) -> Dict:
        impact = {
            "food": 0.0,
            "income": 0.0,
            "emissions": 0.0,
            "risk": 0.0
        }
        
        crop_mix = strategy["crop_mix"]
        sorghum_share = crop_mix.get("sorghum", 0.0)
        legumes_share = crop_mix.get("legumes", 0.0)
        cash_share = crop_mix.get("cash_crops", 0.0)
        irrigation = strategy["irrigation"]
        soil_improvements = strategy["soil_improvements"]
        water_harvesting = strategy["water_harvesting"]
        
        yield_change = metrics["yield_change"] / 100.0
        baseline_income = metrics["income_change"] / 100.0
        drought_severity = max(0.0, -metrics["precip_anomaly"])
        soil_health = metrics["soil_health"]
        
        food_gain = 0.0
        if irrigation:
            food_gain += 0.12
        if sorghum_share >= 0.35:
            food_gain += 0.05
        if soil_improvements:
            food_gain += 0.04
        if water_harvesting:
            food_gain += 0.03
        food_gain += (legumes_share * 0.05)
        impact["food"] = round(min(0.35, food_gain), 3)
        
        income_gain = 0.0
        if baseline_income < 0:
            income_gain += min(0.18, abs(baseline_income) * 0.6)
        else:
            income_gain += min(0.10, baseline_income * 0.3)
        if cash_share > 0.0:
            income_gain += min(0.05, cash_share * 0.4)
        if irrigation:
            income_gain += 0.05
        impact["income"] = round(min(0.25, income_gain), 3)
        
        emissions_delta = 0.0
        if irrigation:
            emissions_delta += 0.04
        if soil_improvements:
            emissions_delta -= 0.05
        emissions_delta -= legumes_share * 0.04
        if water_harvesting:
            emissions_delta -= 0.01
        impact["emissions"] = round(max(-0.15, min(0.1, emissions_delta)), 3)
        
        risk_reduction = 0.0
        if drought_severity > 20:
            risk_reduction += 0.05
        if sorghum_share > 0.3:
            risk_reduction += 0.08
        if irrigation:
            risk_reduction += 0.06
        if soil_health < 0.4 and soil_improvements:
            risk_reduction += 0.05
        if water_harvesting:
            risk_reduction += 0.04
        impact["risk"] = round(-min(0.35, risk_reduction), 3)
        
        return impact
    
    def _score_strategy(self, impact: Dict, priorities: Priorities) -> float:
        """Convert impact metrics to a 0-100 score using user weights."""
        total = max(1.0, priorities.economic + priorities.environmental + priorities.social)
        weight_food = (priorities.environmental * 0.6 + priorities.social * 0.4) / total
        weight_income = priorities.economic / total
        weight_emissions = priorities.environmental / total
        weight_risk = priorities.social / total
        
        score = 55.0
        score += impact["food"] * 100 * weight_food * 1.2
        score += impact["income"] * 100 * weight_income * 1.0
        score += (-impact["emissions"]) * 100 * weight_emissions * 1.1
        score += (-impact["risk"]) * 100 * weight_risk * 1.3
        
        return round(max(0.0, min(100.0, score)), 1)
    
    def _compile_recommendations(self, state: AgentState, strategy: Dict) -> List[str]:
        """Merge upstream advice with planner-specific actions."""
        recs: List[str] = []
        for agent_output in (
            state.meteorologist_output,
            state.agronomist_output,
            state.economist_output
        ):
            if isinstance(agent_output, AgentMessage):
                recs.extend(agent_output.recommendations or [])
        
        recs.append(self._summarize_strategy(strategy))
        recs = [r for r in recs if r]
        unique_recs = []
        for rec in recs:
            if rec not in unique_recs:
                unique_recs.append(rec)
        return unique_recs[:6]
    
    def _summarize_strategy(self, strategy: Dict) -> str:
        """Create a concise summary of the proposed strategy."""
        crop_mix = strategy["crop_mix"]
        if not crop_mix:
            return ""
        top_crops = sorted(crop_mix.items(), key=lambda item: item[1], reverse=True)[:3]
        crop_summary = ", ".join(f"{name} {share*100:.0f}%" for name, share in top_crops)
        components = []
        if strategy["irrigation"]:
            components.append("scale drip irrigation")
        if strategy["water_harvesting"]:
            components.append("expand water harvesting")
        if strategy["soil_improvements"]:
            components.append("invest in soil organic matter and cover crops")
        if strategy["financing_focus"] != "balanced":
            components.append("secure financing to stabilise farmer incomes")
        component_text = "; ".join(components) if components else "maintain existing support programs"
        return f"Adopt crop mix ({crop_summary}) and {component_text} on a {strategy['adaptation_timeline']} timeline."
    
    def _build_summary_message(
        self,
        location_name: str,
        priorities: Priorities,
        metrics: Dict[str, Any],
        strategy: Dict,
        impact: Dict
    ) -> str:
        """Generate a human-readable synthesis message."""
        risk_text = metrics["extreme_risk"]
        yield_delta = metrics["yield_change"]
        food_pct = impact["food"] * 100
        income_pct = impact["income"] * 100
        risk_pct = -impact["risk"] * 100
        
        mix = strategy["crop_mix"]
        lead_crop = max(mix, key=mix.get) if mix else "maize"
        timeline = strategy["adaptation_timeline"]
        
        if yield_delta < 0:
            yield_phrase = f"offset {abs(yield_delta):.0f}% projected yield losses"
        elif yield_delta > 0:
            yield_phrase = f"build on {yield_delta:.0f}% projected yield gains"
        else:
            yield_phrase = "maintain stable yields"
        
        first = (
            f"In {location_name}, we prioritise {lead_crop} with support from climate-resilient crops to {yield_phrase} "
            f"under {risk_text} risk."
        )
        second = (
            f"The proposed plan improves food security by about {food_pct:.0f}% and steadies farm income by {income_pct:.0f}% "
            f"while cutting climate risk roughly {risk_pct:.0f}%."
        )
        third = (
            f"Given priority weights (Economic {priorities.economic} / Environmental {priorities.environmental} / "
            f"Social {priorities.social}), implement the measures on a {timeline} timeline with coordinated financing."
        )
        return " ".join([first, second, third])
    
    def _claim_value(self, agent_output: AgentMessage, metric: str, default: Any = None) -> Any:
        """Return a specific claim value if present."""
        if not isinstance(agent_output, AgentMessage):
            return default
        for claim in agent_output.claims:
            if claim.metric == metric:
                return claim.value
        return default


# Singleton instance
planner = PlannerAgent()
