"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import type mapboxgl from "mapbox-gl"
import type { MapMouseEvent } from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { getMapboxToken } from "@/lib/mapbox"
import { createCircleGeoJSON } from "@/lib/circle-geojson"
import { MapPinIcon } from "@/components/icons"

interface ClimateMapProps {
  location: { lat: number; lng: number; name: string } | null
  radius: number
  onLocationChange: (location: { lat: number; lng: number; name: string }) => void
}

const INITIAL_VIEW: { center: [number, number]; zoom: number } = {
  center: [-95, 40],
  zoom: 3,
}

const FALLBACK_STYLE = "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json"

type MapboxLib = typeof mapboxgl

export function ClimateMap({ location, radius, onLocationChange }: ClimateMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<mapboxgl.Map | null>(null)
  const marker = useRef<mapboxgl.Marker | null>(null)
  const circle = useRef<{ source: string; fill: string; outline: string } | null>(null)
  const mapboxLib = useRef<MapboxLib | null>(null)
  const [mapboxReady, setMapboxReady] = useState(false)
  const [token] = useState<string>(() => getMapboxToken())
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapStatus, setMapStatus] = useState<"idle" | "loading" | "ready" | "error">(token ? "idle" : "error")
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle")
  const hasMapboxToken = Boolean(token)

  const mapStyle = useMemo(() => (hasMapboxToken ? "mapbox://styles/mapbox/dark-v11" : FALLBACK_STYLE), [hasMapboxToken])

  useEffect(() => {
    let isMounted = true
    const load = async () => {
      const [{ default: mapbox }, { default: WorkerClass }] = await Promise.all([
        import("mapbox-gl"),
        import("mapbox-gl/dist/mapbox-gl-csp-worker"),
      ])

      if (!isMounted) return
      if ((mapbox as unknown as { workerClass?: typeof Worker }).workerClass === undefined) {
        ;(mapbox as unknown as { workerClass?: typeof Worker }).workerClass = WorkerClass as unknown as typeof Worker
      }

      mapboxLib.current = mapbox
      setMapboxReady(true)
    }

    load().catch((error) => {
      console.error("[map] failed to load Mapbox GL", error)
      setMapStatus("error")
    })

    return () => {
      isMounted = false
    }
  }, [])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current || !token || !mapboxReady || !mapboxLib.current) {
      return
    }

    const mapbox = mapboxLib.current
    mapbox.accessToken = token || "public-demo"
    const loadingFrame = requestAnimationFrame(() => setMapStatus("loading"))

    map.current = new mapbox.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      projection: hasMapboxToken ? "globe" : "mercator",
    })

    map.current.on("load", () => {
      setMapLoaded(true)
      setMapStatus("ready")

      // Add atmosphere effect
      if (map.current) {
        map.current.setFog({
          color: "rgb(10, 10, 15)",
          "high-color": "rgb(20, 20, 30)",
          "horizon-blend": 0.02,
          "space-color": "rgb(5, 5, 10)",
          "star-intensity": 0.6,
        })
      }
    })

    // Click to set location
    const handleClick = (e: MapMouseEvent) => {
      const { lng, lat } = e.lngLat
      onLocationChange({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    }

    map.current.on("click", handleClick)
    map.current.on("error", () => setMapStatus("error"))

    return () => {
      cancelAnimationFrame(loadingFrame)
      map.current?.off("click", handleClick)
      map.current?.remove()
      map.current = null
      setMapLoaded(false)
      setMapStatus("idle")
    }
  }, [token, mapStyle, hasMapboxToken, mapboxReady, onLocationChange])

  // Update marker and circle when location changes
  useEffect(() => {
    if (!map.current || !mapLoaded || !location || !mapboxLib.current) return

    // Remove existing marker
    if (marker.current) {
      marker.current.remove()
    }

    // Add new marker
    const el = document.createElement("div")
    el.className = "w-8 h-8 bg-blue-500 rounded-full border-4 border-white shadow-lg cursor-move"

    const mapbox = mapboxLib.current
    if (!mapbox) return

    marker.current = new mapbox.Marker({
      element: el,
      draggable: true,
    })
      .setLngLat([location.lng, location.lat])
      .addTo(map.current)

    // Handle marker drag
    marker.current.on("dragend", () => {
      const lngLat = marker.current!.getLngLat()
      onLocationChange({
        lat: lngLat.lat,
        lng: lngLat.lng,
        name: `${lngLat.lat.toFixed(4)}, ${lngLat.lng.toFixed(4)}`,
      })
    })

    // Fly to location
    map.current.flyTo({
      center: [location.lng, location.lat],
      zoom: 8,
      duration: 1500,
    })

    // Remove existing circle
    if (circle.current) {
      const { fill, outline, source } = circle.current
      if (map.current.getLayer(outline)) {
        map.current.removeLayer(outline)
      }
      if (map.current.getLayer(fill)) {
        map.current.removeLayer(fill)
      }
      if (map.current.getSource(source)) {
        map.current.removeSource(source)
      }
    }

    // Add circle
    const sourceId = `circle-${Date.now()}`
    const fillId = `${sourceId}-fill`
    const outlineId = `${sourceId}-outline`
    circle.current = {
      source: sourceId,
      fill: fillId,
      outline: outlineId,
    }

    const circleFeature = createCircleGeoJSON(location, radius)

    map.current.addSource(sourceId, {
      type: "geojson",
      data: circleFeature,
    })

    map.current.addLayer({
      id: fillId,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": "#3b82f6",
        "fill-opacity": 0.15,
      },
    })

    map.current.addLayer({
      id: outlineId,
      type: "line",
      source: sourceId,
      paint: {
        "line-color": "#3b82f6",
        "line-width": 2,
        "line-opacity": 0.6,
      },
    })
  }, [location, radius, mapLoaded, onLocationChange])

  const handleLocateMe = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoStatus("error")
      return
    }

    setGeoStatus("locating")
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setGeoStatus("idle")
        const lat = coords.latitude
        const lng = coords.longitude
        onLocationChange({
          lat,
          lng,
          name: "My current location",
        })
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 9,
          duration: 1200,
        })
      },
      () => {
        setGeoStatus("error")
      },
      {
        enableHighAccuracy: true,
        maximumAge: 1000 * 60 * 5,
      },
    )
  }, [onLocationChange])

  const handleResetView = useCallback(() => {
    map.current?.flyTo({
      center: INITIAL_VIEW.center,
      zoom: INITIAL_VIEW.zoom,
      duration: 1000,
    })
  }, [])

  return (
    <div className="relative w-full h-full rounded-[32px] border border-border bg-panel overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0 rounded-[32px] shadow-2xl" />

      {mapStatus !== "ready" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">
              {mapStatus === "error" ? "Map failed to load — check your Mapbox token." : "Preparing climate canvas..."}
            </p>
            <p className="text-xs text-muted-foreground">This only takes a couple of seconds.</p>
          </div>
        </div>
      )}

      {mapStatus === "ready" && !location && (
        <div className="pointer-events-none absolute left-6 right-6 top-6 rounded-2xl border border-white/20 bg-black/40 p-4 text-white shadow-lg backdrop-blur">
          <p className="text-sm font-semibold">Click anywhere on the globe</p>
          <p className="text-xs text-white/70">
            Drop a pin to choose your focus area, or use the search panel to jump to a city.
          </p>
        </div>
      )}

      {!hasMapboxToken && (
        <div className="pointer-events-none absolute left-6 right-6 bottom-20 rounded-2xl border border-white/20 bg-black/60 p-4 text-white shadow-lg backdrop-blur">
          <p className="text-sm font-semibold">Using open-source basemap</p>
          <p className="text-xs text-white/70">
            Add a Mapbox token in <code>.env.local</code> for the 3D globe and satellite layers.
          </p>
        </div>
      )}

      {location && (
        <div className="absolute left-6 top-6 rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white shadow-lg backdrop-blur">
          <p className="text-xs uppercase tracking-wide text-white/70">Selected location</p>
          <p className="text-sm font-semibold">{location.name}</p>
          <p className="text-xs text-white/60">
            Lat {location.lat.toFixed(2)} · Lng {location.lng.toFixed(2)}
          </p>
        </div>
      )}

      <div className="absolute bottom-6 right-6 flex flex-col gap-2">
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={geoStatus === "locating"}
          className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-xs font-semibold text-slate-900 shadow-lg transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <MapPinIcon className="h-4 w-4" />
          {geoStatus === "locating" ? "Locating..." : "Use my location"}
        </button>
        <button
          type="button"
          onClick={handleResetView}
          className="rounded-full border border-white/40 bg-black/40 px-4 py-2 text-xs font-semibold text-white shadow-lg backdrop-blur transition hover:bg-black/60"
        >
          Reset globe
        </button>
      </div>

      {geoStatus === "error" && (
        <div className="absolute bottom-6 left-6 rounded-2xl border border-destructive/30 bg-destructive/20 px-4 py-3 text-destructive-foreground backdrop-blur">
          <p className="text-xs font-medium">
            We couldn&apos;t access your location. Check browser permissions and try again.
          </p>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-4 left-4 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm px-2 py-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  )
}
