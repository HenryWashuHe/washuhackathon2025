"use client"

import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { SearchIcon, MapPinIcon, SparklesIcon, RotateCcwIcon, InfoIcon } from "@/components/icons"
import { useState } from "react"
import { PrioritySliders } from "@/components/priority-sliders"
import { AnalysisResults } from "@/components/analysis-results"
import { geocodeLocation } from "@/lib/mapbox"
import type { PlanContext, Recommendation } from "@/types/api"
import { ExplainModal } from "@/components/explain-modal"

interface ControlPanelProps {
  location: { lat: number; lng: number; name: string } | null
  radius: number
  onLocationChange: (location: { lat: number; lng: number; name: string }) => void
  onRadiusChange: (radius: number) => void
}

export function ControlPanel({ location, radius, onLocationChange, onRadiusChange }: ControlPanelProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [priorities, setPriorities] = useState({
    economic: 50,
    environmental: 50,
    social: 50,
  })
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [latInput, setLatInput] = useState("")
  const [lngInput, setLngInput] = useState("")
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null)
  const [showExplain, setShowExplain] = useState(false)

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const result = await geocodeLocation(searchQuery)
      if (result) {
        onLocationChange(result)
        setLatInput(result.lat.toFixed(4))
        setLngInput(result.lng.toFixed(4))
      }
    } catch (error) {
      console.error("[v0] Location search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleCoordinateSubmit = () => {
    const lat = Number.parseFloat(latInput)
    const lng = Number.parseFloat(lngInput)

    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return
    }

    onLocationChange({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
  }

  const handleAnalyze = () => {
    if (!location) return
    setIsAnalyzing(true)
    setShowResults(true)
    setHasAnalyzed(true)
    setRecommendation(null)
  }

  const handleRecalculate = () => {
    if (!location) return
    setIsAnalyzing(true)
    setRecommendation(null)
  }

  const handleAnalysisComplete = (result: { recommendation: Recommendation | null; context: PlanContext | null }) => {
    setIsAnalyzing(false)
    setRecommendation(result.recommendation)
  }

  return (
    <>
      <div className="flex flex-col h-full bg-card">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <h1 className="text-2xl font-bold text-foreground mb-2">Smart Climate Decision System</h1>
          <p className="text-sm text-muted-foreground">Select a location and analyze climate impacts</p>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <Card className="p-4 bg-muted/30">
            <Label htmlFor="search" className="text-sm font-medium mb-2 block">
              Search Location
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search for a location..."
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  disabled={isSearching}
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching || !searchQuery.trim()} size="icon">
                <MapPinIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {isSearching ? "Searching..." : "Search or click on the map to select a location"}
            </p>
          </Card>

          <Card className="p-4 bg-muted/30">
            <Label className="text-sm font-medium mb-2 block">Or Enter Coordinates</Label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="lat" className="text-xs text-muted-foreground">
                  Latitude
                </Label>
                <Input
                  id="lat"
                  type="number"
                  placeholder="-1.286"
                  step="0.0001"
                  value={latInput}
                  onChange={(e) => setLatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCoordinateSubmit()}
                />
              </div>
              <div>
                <Label htmlFor="lng" className="text-xs text-muted-foreground">
                  Longitude
                </Label>
                <Input
                  id="lng"
                  type="number"
                  placeholder="36.817"
                  step="0.0001"
                  value={lngInput}
                  onChange={(e) => setLngInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCoordinateSubmit()}
                />
              </div>
            </div>
          </Card>

          {/* Current Location */}
          {location && (
            <Card className="p-4 bg-blue-500/10 border-blue-500/20">
              <Label className="text-sm font-medium mb-2 block">Selected Location</Label>
              <p className="text-sm text-foreground">{location.name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
              </p>
            </Card>
          )}

          {/* Radius Control */}
          <Card className="p-4 bg-muted/30">
            <Label htmlFor="radius" className="text-sm font-medium mb-2 block">
              Area of Interest: {radius} km
            </Label>
            <Input
              id="radius"
              type="range"
              min="10"
              max="200"
              step="10"
              value={radius}
              onChange={(e) => onRadiusChange(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>10 km</span>
              <span>200 km</span>
            </div>
          </Card>

          <PrioritySliders priorities={priorities} onChange={setPriorities} />

          <div className="space-y-2">
            {!hasAnalyzed && location && (
              <Button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full" size="lg">
                <SparklesIcon className="h-4 w-4 mr-2" />
                {isAnalyzing ? "Analyzing..." : "Analyze Climate Impact"}
              </Button>
            )}

            {hasAnalyzed && location && (
              <div className="flex gap-2">
                <Button onClick={handleRecalculate} disabled={isAnalyzing} className="flex-1" size="lg">
                  <RotateCcwIcon className="h-4 w-4 mr-2" />
                  {isAnalyzing ? "Analyzing..." : "Recalculate"}
                </Button>
                {recommendation && (
                  <Button onClick={() => setShowExplain(true)} variant="outline" size="lg">
                    <InfoIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {showResults && location && (
            <AnalysisResults
              location={location}
              radius={radius}
              priorities={priorities}
              userPrompt={undefined}
              isAnalyzing={isAnalyzing}
              onAnalysisComplete={handleAnalysisComplete}
            />
          )}
        </div>
      </div>

      <ExplainModal open={showExplain} onOpenChange={setShowExplain} recommendation={recommendation} />
    </>
  )
}
