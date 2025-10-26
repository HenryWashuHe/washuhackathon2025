from pathlib import Path
import sys
from datetime import datetime, timezone
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from agents.planner import PlannerAgent
from models.schemas import (
    AgentState,
    ClimateData,
    Location,
    Priorities,
    AgentMessage,
    AgentClaim,
)


def build_message(agent: str, claims, recommendations=None, message="stub message"):
    return AgentMessage(
        agent=agent,
        message=message,
        claims=claims,
        recommendations=recommendations or [],
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@pytest.mark.asyncio
async def test_planner_generates_strategy_and_impact():
    planner = PlannerAgent()
    climate = ClimateData(
        temperature_avg=29.0,
        precipitation_sum=120.0,
        precipitation_anomaly=-30.0,
        extreme_weather_risk="high",
    )
    meteorologist_output = build_message(
        "Meteorologist",
        claims=[
            AgentClaim(metric="temperature_avg", value=29.0, unit="C", confidence=0.9),
            AgentClaim(metric="precipitation_anomaly", value=-30.0, unit="%", confidence=0.9),
        ],
        recommendations=[
            "Prepare for prolonged dry spell conditions across the growing season"
        ],
    )
    agronomist_output = build_message(
        "Agronomist",
        claims=[
            AgentClaim(metric="crop_yield_change", value=-20.0, unit="%", confidence=0.8),
            AgentClaim(metric="water_stress_index", value=0.6, unit="index", confidence=0.75),
            AgentClaim(metric="soil_health_index", value=0.35, unit="index", confidence=0.7),
        ],
        recommendations=[
            "Switch 40% of maize to drought-tolerant sorghum",
            "Install water harvesting pits at field edges",
        ],
    )
    economist_output = build_message(
        "Economist",
        claims=[
            AgentClaim(metric="income_change", value=-12.0, unit="%", confidence=0.75),
            AgentClaim(metric="adaptation_cost", value=120000.0, unit="USD", confidence=0.7),
            AgentClaim(metric="economic_resilience", value=0.32, unit="index", confidence=0.65),
        ],
        recommendations=[
            "Seek blended finance to offset high upfront irrigation costs"
        ],
    )

    state = AgentState(
        location=Location(lat=0.5, lng=37.6, name="Kitui County"),
        radius=80,
        priorities=Priorities(economic=40, environmental=35, social=25),
        climate_data=climate,
        meteorologist_output=meteorologist_output,
        agronomist_output=agronomist_output,
        economist_output=economist_output,
    )

    result = await planner.analyze(state)

    assert "planner_output" in result
    assert "strategy" in result
    assert "impact" in result

    strategy = result["strategy"]
    impact = result["impact"]
    message = result["planner_output"]

    assert pytest.approx(sum(strategy["crop_mix"].values()), rel=1e-3) == 1.0
    assert strategy["adaptation_timeline"] == "immediate"
    assert strategy["financing_focus"] == "phase investments"
    assert strategy["irrigation"] is True
    assert impact["food"] > 0
    assert impact["income"] > 0
    assert impact["risk"] < 0
    assert any(claim.metric == "climate_resilience_gain" for claim in message.claims)
    assert any("crop mix" in rec for rec in message.recommendations)
    assert "Kitui County" in message.message


@pytest.mark.asyncio
async def test_planner_handles_positive_income_and_low_cost():
    planner = PlannerAgent()
    climate = ClimateData(
        temperature_avg=24.0,
        precipitation_sum=180.0,
        precipitation_anomaly=-5.0,
        extreme_weather_risk="medium",
    )
    meteorologist_output = build_message(
        "Meteorologist",
        claims=[],
        recommendations=["Maintain seasonal monitoring; rainfall close to average"],
    )
    agronomist_output = build_message(
        "Agronomist",
        claims=[
            AgentClaim(metric="crop_yield_change", value=-5.0, unit="%", confidence=0.8),
            AgentClaim(metric="water_stress_index", value=0.25, unit="index", confidence=0.75),
            AgentClaim(metric="soil_health_index", value=0.6, unit="index", confidence=0.7),
        ],
        recommendations=["Integrate cover crops on 20% of land to build soil carbon"],
    )
    economist_output = build_message(
        "Economist",
        claims=[
            AgentClaim(metric="income_change", value=4.0, unit="%", confidence=0.75),
            AgentClaim(metric="adaptation_cost", value=25000.0, unit="USD", confidence=0.7),
            AgentClaim(metric="economic_resilience", value=0.68, unit="index", confidence=0.65),
        ],
        recommendations=["Allocate modest grants to extend soil conservation efforts"],
    )

    state = AgentState(
        location=Location(lat=-1.3, lng=36.8, name="Nairobi Fringe"),
        radius=40,
        priorities=Priorities(economic=30, environmental=50, social=20),
        climate_data=climate,
        meteorologist_output=meteorologist_output,
        agronomist_output=agronomist_output,
        economist_output=economist_output,
    )

    result = await planner.analyze(state)
    strategy = result["strategy"]
    impact = result["impact"]

    assert strategy["adaptation_timeline"] == "short-term"
    assert strategy["financing_focus"] == "leverage existing budgets"
    assert strategy["soil_improvements"] is True
    assert pytest.approx(sum(strategy["crop_mix"].values()), rel=1e-3) == 1.0
    assert impact["emissions"] <= 0  # environmental priority should reduce emissions
