export function getMapboxToken() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  return token?.trim() ?? ""
}

export async function geocodeLocation(query: string) {
  const token = getMapboxToken()

  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${token}&limit=1`,
  )

  if (!response.ok) {
    throw new Error("Geocoding failed")
  }

  const data = await response.json()

  if (data.features && data.features.length > 0) {
    const [lng, lat] = data.features[0].center
    const name = data.features[0].place_name
    return { lat, lng, name }
  }

  return null
}
