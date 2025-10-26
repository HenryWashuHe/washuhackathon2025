import os
import unittest
from unittest.mock import AsyncMock

os.environ.setdefault("OPENAI_API_KEY", "test-key")

from models.schemas import AgentState, Location, Priorities, ClimateData  # noqa: E402
from agents.meteorologist import MeteorologistAgent  # noqa: E402


class FakeLLM:
    async def ainvoke(self, messages):
        class Response:
            content = "Stable conditions with moderate drought risk."
        return Response()


class MeteorologistAgentTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        self.agent = MeteorologistAgent()
        self.agent.llm = FakeLLM()

    async def test_assess_risk_flags_heat_and_drought(self):
        self.assertEqual(self.agent._assess_risk(36, -10), "high")
        self.assertEqual(self.agent._assess_risk(28, -35), "high")
        self.assertEqual(self.agent._assess_risk(26, 10), "low")

    async def test_analyze_returns_climate_data_and_message(self):
        climate = ClimateData(
            temperature_avg=27.5,
            precipitation_sum=160.0,
            precipitation_anomaly=-22.0,
            extreme_weather_risk="medium"
        )
        self.agent._fetch_climate_data = AsyncMock(return_value=climate)
        state = AgentState(
            location=Location(lat=-1.2, lng=36.8, name="Machakos"),
            radius=60,
            priorities=Priorities(economic=70, environmental=50, social=30)
        )
        result = await self.agent.analyze(state)

        self.assertEqual(result["climate_data"], climate)
        message = result["meteorologist_output"]
        metrics = [claim.metric for claim in message.claims]

        self.assertIn("temperature_avg", metrics)
        self.assertIn("precipitation_anomaly", metrics)
        self.assertTrue(message.message.startswith("Stable conditions"))


if __name__ == "__main__":
    unittest.main()
