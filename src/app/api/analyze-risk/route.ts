/**
 * Climate Risk Analysis API Route
 * Now connects to the real Python backend for AI-powered analysis
 * No more hardcoded data!
 */

// Use backend URL from environment or fallback to production/dev defaults
const BACKEND_URL = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.miaomiaobadcat.com'
    : 'http://localhost:8000')

export async function POST(req: Request) {
  try {
    const body = await req.json()
    
    console.log(`[analyze-risk] Connecting to backend at: ${BACKEND_URL}`)
    
    // Call the Python backend for real AI analysis
    const backendResponse = await fetch(`${BACKEND_URL}/analyze-risk`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    })

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text()
      console.error(`[analyze-risk] Backend error: ${backendResponse.status} - ${errorText}`)
      throw new Error(`Backend error: ${backendResponse.status} - ${backendResponse.statusText}`)
    }

    // Stream the response from backend to frontend
    const reader = backendResponse.body?.getReader()
    if (!reader) {
      throw new Error("No response body")
    }

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
    
    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            
            // Pass through the SSE data from backend
            const chunk = decoder.decode(value, { stream: true })
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (error) {
          console.error("[analyze-risk] Stream error:", error)
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
    console.error("[analyze-risk] API error:", error)
    return new Response(
      JSON.stringify({
        error: "Risk analysis failed",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
