/**
 * API Client with fallback and error handling
 */

export class APIClient {
  private static instance: APIClient
  private backendUrl: string
  private isHealthy: boolean = false
  
  private constructor() {
    // Determine backend URL based on environment
    this.backendUrl = this.getBackendUrl()
    this.checkHealth()
  }
  
  static getInstance(): APIClient {
    if (!APIClient.instance) {
      APIClient.instance = new APIClient()
    }
    return APIClient.instance
  }
  
  private getBackendUrl(): string {
    // Check multiple sources for backend URL
    if (typeof window !== 'undefined') {
      // Client-side: use relative URLs for API routes
      return ''
    }
    
    // Server-side: use environment variable or default
    return process.env.BACKEND_URL || 
           (process.env.NODE_ENV === 'production' 
             ? 'https://api.miaomiaobadcat.com'
             : 'http://localhost:8000')
  }
  
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch('/api/health')
      const data = await response.json()
      this.isHealthy = data.backend === 'ok'
      return this.isHealthy
    } catch (error) {
      console.error('[APIClient] Health check failed:', error)
      this.isHealthy = false
      return false
    }
  }
  
  async analyze(params: {
    location: any
    radius: number
    priorities: any
    userPrompt?: string
  }): Promise<Response> {
    // Always use the Next.js API route which handles backend connection
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    
    if (!response.ok && !response.body) {
      throw new Error('Backend connection failed. Please try again later.')
    }
    
    return response
  }
  
  async analyzeRisk(params: {
    location: any
    yearsInFuture: number
    userPrompt?: string
  }): Promise<Response> {
    // Always use the Next.js API route which handles backend connection
    const response = await fetch('/api/analyze-risk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    })
    
    if (!response.ok && !response.body) {
      throw new Error('Backend connection failed. Please try again later.')
    }
    
    return response
  }
  
  getStatus(): { healthy: boolean; url: string } {
    return {
      healthy: this.isHealthy,
      url: this.backendUrl,
    }
  }
}
