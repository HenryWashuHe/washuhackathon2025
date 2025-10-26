from pathlib import Path
import sys
from types import SimpleNamespace
import pytest

sys.path.append(str(Path(__file__).resolve().parents[1]))

from agents.agronomist import AgronomistAgent
from models.schemas import AgentState, ClimateData, Location, Priorities


class StubLLM:
    def __init__(self, response_text: str = "Stub agronomic assessment."):
        self.response_text = response_text
        self.messages = None

    async def ainvoke(self, messages):
        self.messages = messages
        return SimpleNamespace(content=self.response_text)


@pytest.mark.asyncio
async def test_analyze_includes_soil_health_claims_and_message_context():
    agent = AgronomistAgent(llm=StubLLM())
    climate_data = ClimateData(
        temperature_avg=28.0,
        precipitation_sum=110.0,
        precipitation_anomaly=-35.0,
        extreme_weather_risk="high",
    )
    state = AgentState(
        location=Location(lat=10.0, lng=20.0, name="Test Farm"),
        radius=50,
        priorities=Priorities(economic=40, environmental=40, social=20),
        userPrompt="Focus on maize resilience strategies.",
        climate_data=climate_data,
    )

    result = await agent.analyze(state)

    assert "agronomist_output" in result
    output = result["agronomist_output"]
    assert output.message == "Stub agronomic assessment."
    assert output.recommendations

    claims = {claim.metric: claim for claim in output.claims}
    expected_water = agent._calculate_water_stress(climate_data.precipitation_anomaly)
    expected_soil = agent._calculate_soil_health(
        climate_data.precipitation_anomaly,
        expected_water,
        climate_data.extreme_weather_risk,
    )

    assert claims["crop_yield_change"].value == agent._calculate_yield_impact(
        climate_data.precipitation_anomaly,
        climate_data.temperature_avg,
    )
    assert claims["water_stress_index"].value == expected_water
    assert claims["soil_health_index"].value == expected_soil

    # Ensure the LLM prompt included the soil health context
    human_message = next(
        message.content for message in agent.llm.messages if getattr(message, "type", None) == "human"
    )
    assert "Soil Health Index" in human_message
    assert "Water Stress Index" in human_message


def test_calculate_soil_health_handles_extremes():
    agent = AgronomistAgent(llm=StubLLM())
    severe_drought = agent._calculate_soil_health(-80.0, 1.0, "high")
    normal_conditions = agent._calculate_soil_health(
        10.0,
        agent._calculate_water_stress(10.0),
        "low",
    )

    assert severe_drought == 0.0
    assert 0.0 < normal_conditions <= 1.0
    assert normal_conditions > severe_drought
