/**
 * Health check endpoint to verify backend connectivity
 */

// Use backend URL from environment or fallback to production/dev defaults
const BACKEND_URL = process.env.BACKEND_URL || 
  (process.env.NODE_ENV === 'production' 
    ? 'https://api.miaomiaobadcat.com'
    : 'http://localhost:8000')

export async function GET() {
  try {
    console.log(`[health] Checking backend at: ${BACKEND_URL}`)
    
    // Check if backend is healthy
    const backendResponse = await fetch(`${BACKEND_URL}/`, {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    })

    if (!backendResponse.ok) {
      throw new Error(`Backend returned ${backendResponse.status}`)
    }

    const backendData = await backendResponse.json()

    return new Response(
      JSON.stringify({
        status: "healthy",
        frontend: "ok",
        backend: "ok",
        backendUrl: BACKEND_URL,
        backendResponse: backendData,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    )
  } catch (error: any) {
    console.error("[health] Error:", error)
    
    return new Response(
      JSON.stringify({
        status: "unhealthy",
        frontend: "ok",
        backend: "error",
        backendUrl: BACKEND_URL,
        error: error.message || "Backend connection failed",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    )
  }
}
