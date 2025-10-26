"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { GoogleMap, Marker, Circle, useJsApiLoader } from "@react-google-maps/api"
import { MapPinIcon } from "@/components/icons"

interface ClimateMapProps {
  location: { lat: number; lng: number; name: string } | null
  radius: number
  onLocationChange: (location: { lat: number; lng: number; name: string }) => void
}

const DEFAULT_CENTER = { lat: 38, lng: -95 }
const DEFAULT_ZOOM = 4
const FOCUSED_ZOOM = 9

const containerStyle = {
  width: "100%",
  height: "100%",
  borderRadius: "32px",
}

const mapOptions: google.maps.MapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  clickableIcons: false,
  styles: [
    {
      featureType: "all",
      elementType: "geometry",
      stylers: [{ saturation: -10 }, { lightness: 5 }],
    },
    {
      featureType: "road",
      elementType: "labels.icon",
      stylers: [{ visibility: "off" }],
    },
  ],
}

const circleOptions: google.maps.CircleOptions = {
  strokeColor: "#3b82f6",
  strokeOpacity: 0.6,
  strokeWeight: 2,
  fillColor: "#3b82f6",
  fillOpacity: 0.15,
}

export function ClimateMap({ location, radius, onLocationChange }: ClimateMapProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [geoStatus, setGeoStatus] = useState<"idle" | "locating" | "error">("idle")

  const { isLoaded, loadError } = useJsApiLoader({
    id: "climate-map-google-maps-script",
    googleMapsApiKey: apiKey ?? "",
  })

  const center = useMemo(() => {
    if (location) {
      return { lat: location.lat, lng: location.lng }
    }
    return DEFAULT_CENTER
  }, [location])

  useEffect(() => {
    if (map && location) {
      map.panTo({ lat: location.lat, lng: location.lng })
      map.setZoom(FOCUSED_ZOOM)
    }
  }, [map, location])

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
        map?.panTo({ lat, lng })
        map?.setZoom(FOCUSED_ZOOM)
      },
      () => setGeoStatus("error"),
      { enableHighAccuracy: true, maximumAge: 1000 * 60 * 5 },
    )
  }, [map, onLocationChange])

  const handleResetView = useCallback(() => {
    if (map) {
      map.panTo(DEFAULT_CENTER)
      map.setZoom(DEFAULT_ZOOM)
    }
  }, [map])

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      onLocationChange({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    },
    [onLocationChange],
  )

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return
      const lat = event.latLng.lat()
      const lng = event.latLng.lng()
      onLocationChange({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
    },
    [onLocationChange],
  )

  const renderOverlay = () => {
    if (!apiKey) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 backdrop-blur">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">Google Maps API key missing</p>
            <p className="text-xs text-muted-foreground">
              Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code> to display the map.
            </p>
          </div>
        </div>
      )
    }

    if (loadError) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="text-center space-y-2">
            <p className="text-sm font-semibold text-foreground">Google Maps failed to load</p>
            <p className="text-xs text-muted-foreground">Check your API key and network connection.</p>
          </div>
        </div>
      )
    }

    if (!isLoaded) {
      return (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur">
          <div className="text-center">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground">Loading climate map…</p>
            <p className="text-xs text-muted-foreground">This only takes a moment.</p>
          </div>
        </div>
      )
    }

    if (!location) {
      return (
        <div className="pointer-events-none absolute left-6 right-6 top-6 rounded-2xl border border-white/20 bg-black/40 p-4 text-white shadow-lg backdrop-blur">
          <p className="text-sm font-semibold">Click anywhere on the map</p>
          <p className="text-xs text-white/70">
            Drop a pin to choose your focus area, or use the search panel to jump to a city.
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="relative w-full h-full rounded-[32px] border border-border bg-panel overflow-hidden">
      {isLoaded && apiKey ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={center}
          zoom={location ? FOCUSED_ZOOM : DEFAULT_ZOOM}
          options={mapOptions}
          onLoad={(instance) => setMap(instance)}
          onUnmount={() => setMap(null)}
          onClick={handleMapClick}
        >
          {location && (
            <>
              <Marker
                position={{ lat: location.lat, lng: location.lng }}
                draggable
                onDragEnd={handleMarkerDragEnd}
              />
              <Circle
                center={{ lat: location.lat, lng: location.lng }}
                radius={Math.max(radius, 1) * 1000}
                options={circleOptions}
              />
            </>
          )}
        </GoogleMap>
      ) : (
        <div style={containerStyle} />
      )}

      {renderOverlay()}

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
          Reset view
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
        © Google
      </div>
    </div>
  )
}
