"use client"

import Link from "next/link"
import { ClimateMap } from "@/components/climate-map"
import { Header } from "@/components/header"
import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SearchIcon, MapPinIcon, RotateCcwIcon } from "@/components/icons"
import { AlertTriangle } from "lucide-react"
import { ClimateRiskResults } from "@/components/climate-risk-results"
import { geocodeLocation } from "@/lib/google-maps"
import { useSearchParams } from "next/navigation"

export default function ClimateRiskPage() {
  const searchParams = useSearchParams()
  const [location, setLocation] = useState<{ lat: number; lng: number; name: string } | null>(null)
  const [radius, setRadius] = useState(50)
  const [searchQuery, setSearchQuery] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [yearsInFuture, setYearsInFuture] = useState(10)
  const [userPrompt, setUserPrompt] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [hasAnalyzed, setHasAnalyzed] = useState(false)
  const [latInput, setLatInput] = useState("")
  const [lngInput, setLngInput] = useState("")

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setIsSearching(true)
    try {
      const result = await geocodeLocation(searchQuery)
      if (result) {
        setLocation(result)
        setLatInput(result.lat.toFixed(4))
        setLngInput(result.lng.toFixed(4))
      }
    } catch (error) {
      console.error("[climate-risk] Location search error:", error)
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

    setLocation({ lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` })
  }

  const handleAnalyze = () => {
    if (!location) return
    setIsAnalyzing(true)
    setShowResults(true)
    setHasAnalyzed(true)
  }

  const handleRecalculate = () => {
    if (!location) return
    setIsAnalyzing(true)
  }

  const handleAnalysisComplete = () => {
    setIsAnalyzing(false)
  }

  // Handle quickstart parameters
  useEffect(() => {
    const quickstart = searchParams.get('quickstart')
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    const locationName = searchParams.get('location')
    const years = searchParams.get('years')
    
    if (quickstart && lat && lng) {
      const parsedLat = parseFloat(lat)
      const parsedLng = parseFloat(lng)
      
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        const newLocation = {
          lat: parsedLat,
          lng: parsedLng,
          name: locationName || `${parsedLat.toFixed(4)}, ${parsedLng.toFixed(4)}`
        }
        setLocation(newLocation)
        setLatInput(parsedLat.toFixed(4))
        setLngInput(parsedLng.toFixed(4))
        
        if (years) {
          const parsedYears = parseInt(years)
          if (!isNaN(parsedYears)) {
            setYearsInFuture(parsedYears)
          }
        }
        
        // Auto-start analysis after a brief delay to show the location
        setTimeout(() => {
          setIsAnalyzing(true)
          setShowResults(true)
          setHasAnalyzed(true)
        }, 1500)
      }
    }
  }, [searchParams])

  return (
    <div className="flex flex-col min-h-screen w-full bg-background">
      <Header />
      
      {/* Page Title Bar */}
      <div className="w-full bg-gradient-to-r from-red-600 to-orange-600 text-white py-3 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/landing" className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="border-l border-white/30 h-6 mx-2" />
            <AlertTriangle className="h-5 w-5" />
            <h1 className="text-lg font-bold">Climate Risk Assessment</h1>
            <span className="text-sm opacity-80 hidden md:inline">Long-term livability analysis</span>
          </div>
          <Link href="/" className="text-sm underline hover:no-underline flex items-center gap-1">
            Switch to Agricultural
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="flex-1 w-full max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {/* Search Section */}
        <Card className="p-6 bg-card">
          <h2 className="text-xl font-bold text-foreground mb-4">Location Selection</h2>

          <div className="space-y-4">
            <div>
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
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Or Enter Coordinates</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="lat" className="text-xs text-muted-foreground">
                    Latitude
                  </Label>
                  <Input
                    id="lat"
                    type="number"
                    placeholder="38.6270"
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
                    placeholder="-90.1994"
                    step="0.0001"
                    value={lngInput}
                    onChange={(e) => setLngInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCoordinateSubmit()}
                  />
                </div>
              </div>
            </div>

            {location && (
              <Card className="p-4 bg-red-500/10 border-red-500/20">
                <Label className="text-sm font-medium mb-2 block">Selected Location</Label>
                <p className="text-sm text-foreground">{location.name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lat: {location.lat.toFixed(4)}, Lng: {location.lng.toFixed(4)}
                </p>
              </Card>
            )}
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="h-[400px] md:h-[500px] relative">
            <ClimateMap location={location} radius={radius} onLocationChange={setLocation} />
          </div>
        </Card>

        {/* Controls Section */}
        <Card className="p-6 bg-card space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4">Risk Analysis Parameters</h2>

            <div className="space-y-6">
              <div>
                <Label htmlFor="radius" className="text-sm font-medium mb-2 block">
                  Analysis Radius: {radius} km
                </Label>
                <Input
                  id="radius"
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>10 km</span>
                  <span>200 km</span>
                </div>
              </div>

              {/* Years in the Future slider */}
              <Card className="p-4 bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
                <Label htmlFor="years" className="text-sm font-medium mb-2 block">
                  Time Horizon: {yearsInFuture} {yearsInFuture === 1 ? 'year' : 'years'}
                </Label>
                <Input
                  id="years"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={yearsInFuture}
                  onChange={(e) => setYearsInFuture(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1 year</span>
                  <span>50 years</span>
                  <span>100 years</span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Assess climate livability risk over your planning horizon
                </p>
              </Card>

              <div>
                <Label htmlFor="userPrompt" className="text-sm font-medium mb-2 block">
                  Additional Context (Optional)
                </Label>
                <Textarea
                  id="userPrompt"
                  placeholder="Add specific questions or context for the risk analysis... (e.g., 'Focus on hurricane risk' or 'Consider coastal flooding')"
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  className="min-h-[100px] resize-y"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Provide additional context or specific risks to assess
                </p>
              </div>

              <div className="space-y-2">
                {!hasAnalyzed && (
                  <Button 
                    onClick={handleAnalyze} 
                    disabled={!location || isAnalyzing} 
                    className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                    size="lg"
                  >
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    {!location ? "Select a location first" : isAnalyzing ? "Analyzing..." : "Analyze Climate Risk"}
                  </Button>
                )}

                {hasAnalyzed && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleRecalculate} 
                      disabled={!location || isAnalyzing} 
                      className="flex-1 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                      size="lg"
                    >
                      <RotateCcwIcon className="h-4 w-4 mr-2" />
                      {!location ? "Select a location first" : isAnalyzing ? "Analyzing..." : "Recalculate Risk"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Results Section */}
        {showResults && location && (
          <ClimateRiskResults
            location={location}
            radius={radius}
            yearsInFuture={yearsInFuture}
            userPrompt={userPrompt}
            isAnalyzing={isAnalyzing}
            onAnalysisComplete={handleAnalysisComplete}
          />
        )}
      </div>
    </div>
  )
}
