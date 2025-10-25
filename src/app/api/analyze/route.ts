import { streamText } from "ai"

export const runtime = "edge"

export async function POST(req: Request) {
  try {
    const { location, radius, priorities } = await req.json()

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const agents = [
          {
            role: "meteorologist",
            prompt: `You are a meteorologist analyzing climate data for ${location.name} within a ${radius}km radius. Discuss temperature trends, precipitation patterns, extreme weather events, and seasonal changes. Focus on how these climate factors will impact the region over the next 5-10 years. Keep your response concise (2-3 sentences).`,
          },
          {
            role: "agronomist",
            prompt: `You are an agronomist evaluating agricultural impacts for ${location.name}. Based on the climate conditions, analyze crop viability, soil health, water availability, and farming practices. Consider how climate change will affect food production in this region. Keep your response concise (2-3 sentences).`,
          },
          {
            role: "economist",
            prompt: `You are an economist assessing the economic implications for ${location.name}. Analyze the financial impact of climate change on local industries, employment, infrastructure costs, and economic resilience. Consider the economic priority weight of ${priorities.economic}%. Keep your response concise (2-3 sentences).`,
          },
          {
            role: "planner",
            prompt: `You are an urban planner synthesizing recommendations for ${location.name}. Based on climate, agricultural, and economic factors, provide actionable strategies that balance environmental (${priorities.environmental}%), economic (${priorities.economic}%), and social (${priorities.social}%) priorities. Keep your response concise (2-3 sentences).`,
          },
        ]

        for (const agent of agents) {
          try {
            const result = await streamText({
              model: "openai/gpt-4o-mini",
              prompt: agent.prompt,
              maxOutputTokens: 200,
            })

            let fullContent = ""

            for await (const chunk of result.textStream) {
              fullContent += chunk
            }

            const message = {
              role: agent.role,
              content: fullContent,
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`))

            // Add a small delay between agents for better UX
            await new Promise((resolve) => setTimeout(resolve, 500))
          } catch (error) {
            console.error(`[v0] Error with ${agent.role}:`, error)
          }
        }

        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("[v0] Analysis API error:", error)
    return new Response(JSON.stringify({ error: "Analysis failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
