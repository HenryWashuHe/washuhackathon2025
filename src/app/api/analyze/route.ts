/**
 * Next.js API Route - Proxies requests to Python FastAPI backend
 * This allows the frontend to connect to the real agent system
 */

// Use backend URL from environment or fallback to production/dev defaults
const BACKEND_URL = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.miaomiaobadcat.com'
    : 'http://localhost:8000')

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { location, radius, priorities, userPrompt } = body

    console.log(`[analyze] Connecting to backend at: ${BACKEND_URL}`)

    // Call the Python backend
    const backendResponse = await fetch(`${BACKEND_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        location,
        radius,
        priorities,
        userPrompt: userPrompt || null,
      }),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error(`[analyze] Backend error: ${backendResponse.status} - ${errorText}`)
      throw new Error(`Backend returned ${backendResponse.status}: ${errorText}`)
    }

    // Stream the response from backend to frontend
    const stream = new ReadableStream({
      async start(controller) {
        const reader = backendResponse.body?.getReader()

        if (!reader) {
          controller.close()
          return
        }

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            // Forward the chunk from backend to frontend
            controller.enqueue(value)
          }
        } catch (error) {
          console.error("[analyze-proxy] Stream error:", error)
        } finally {
          controller.close()
        }
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
    console.error("[analyze-proxy] API error:", error)
    return new Response(
      JSON.stringify({
        error: "Failed to connect to analysis backend. Is the Python server running?",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
