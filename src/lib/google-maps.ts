export function getGoogleMapsApiKey() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  return apiKey?.trim() ?? ""
}

export async function geocodeLocation(query: string) {
  const apiKey = getGoogleMapsApiKey()
  
  if (!apiKey) {
    throw new Error("Google Maps API key not configured")
  }

  const response = await fetch(
    `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`,
  )

  if (!response.ok) {
    throw new Error("Geocoding failed")
  }

  const data = await response.json()

  if (data.results && data.results.length > 0) {
    const location = data.results[0].geometry.location
    const name = data.results[0].formatted_address
    return { 
      lat: location.lat, 
      lng: location.lng, 
      name 
    }
  }

  return null
}
