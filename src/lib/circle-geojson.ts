export function createCircleGeoJSON(
  center: { lat: number; lng: number },
  radiusKm: number
): GeoJSON.FeatureCollection {
  const points = 64 // Number of points to create the circle
  const distanceRadians = radiusKm / 6371.0 // Convert km to radians (Earth's radius ≈ 6371 km)
  const centerRadians = {
    lat: (center.lat * Math.PI) / 180,
    lng: (center.lng * Math.PI) / 180,
  }

  const coordinates: number[][] = []
  for (let i = 0; i <= points; i++) {
    const angle = (i * 2 * Math.PI) / points
    const latRad = Math.asin(
      Math.sin(centerRadians.lat) * Math.cos(distanceRadians) +
        Math.cos(centerRadians.lat) * Math.sin(distanceRadians) * Math.cos(angle)
    )
    const lngRad =
      centerRadians.lng +
      Math.atan2(
        Math.sin(angle) * Math.sin(distanceRadians) * Math.cos(centerRadians.lat),
        Math.cos(distanceRadians) - Math.sin(centerRadians.lat) * Math.sin(latRad)
      )

    coordinates.push([(lngRad * 180) / Math.PI, (latRad * 180) / Math.PI])
  }

  return {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [coordinates],
        },
        properties: {},
      },
    ],
  }
}
