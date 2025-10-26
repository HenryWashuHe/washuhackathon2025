import os
from pathlib import Path
import sys
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

os.environ.setdefault("OPENAI_API_KEY", "test-key")

sys.path.append(str(Path(__file__).resolve().parents[1]))

from models.schemas import AgentState, ClimateData, Location, Priorities
from graph import agent_graph
from agents.meteorologist import meteorologist
from agents.agronomist import agronomist


class StubLLM:
    """Lightweight async stub to avoid remote LLM calls during tests."""

    def __init__(self, label: str):
        self.label = label

    async def ainvoke(self, messages):
        return SimpleNamespace(content=f"{self.label} analysis stub.")


@pytest.mark.asyncio
async def test_full_pipeline_executes_with_stubs():
    """End-to-end pipeline should run without network dependencies."""
    stub_climate = ClimateData(
        temperature_avg=27.0,
        precipitation_sum=150.0,
        precipitation_anomaly=-15.0,
        extreme_weather_risk="medium",
    )

    original_llm_meteorologist = meteorologist.llm
    original_llm_agronomist = getattr(agronomist, "llm", None)
    original_fetch = meteorologist._fetch_climate_data

    meteorologist.llm = StubLLM("Meteorologist")
    agronomist.llm = StubLLM("Agronomist")
    meteorologist._fetch_climate_data = AsyncMock(return_value=stub_climate)

    state = AgentState(
        location=Location(lat=-1.286, lng=36.817, name="Nairobi, Kenya"),
        radius=75.0,
        priorities=Priorities(economic=50, environmental=30, social=20),
        userPrompt="Focus on drought resilience",
    )

    try:
        final_state = await agent_graph.ainvoke(state.model_dump())
    finally:
        meteorologist.llm = original_llm_meteorologist
        agronomist.llm = original_llm_agronomist
        meteorologist._fetch_climate_data = original_fetch

    planner_message = final_state["planner_output"]
    strategy = final_state["strategy"]
    impact = final_state["impact"]

    assert "Nairobi" in planner_message.message
    assert pytest.approx(sum(strategy["crop_mix"].values()), rel=1e-3) == 1.0
    assert impact["food"] != 0.0
    assert impact["income"] != 0.0
    assert "climate_resilience_gain" in {claim.metric for claim in planner_message.claims}
