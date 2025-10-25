export function createCircleGeoJSON(center: { lat: number; lng: number }, radiusKm: number) {
  const points = 64
  const coords: [number, number][] = []
  const distanceX = radiusKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))
  const distanceY = radiusKm / 110.574

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI)
    const x = distanceX * Math.cos(theta)
    const y = distanceY * Math.sin(theta)
    coords.push([center.lng + x, center.lat + y])
  }
  coords.push(coords[0])

  return {
    type: "Feature" as const,
    geometry: {
      type: "Polygon" as const,
      coordinates: [coords],
    },
    properties: {},
  }
}
