"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useRef } from "react"

interface ClimateChartsProps {
  location: { lat: number; lng: number; name: string }
}

export function ClimateCharts({ location }: ClimateChartsProps) {
  const rainfallCanvasRef = useRef<HTMLCanvasElement>(null)
  const yieldCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Dynamically load Chart.js
    const loadChartJS = async () => {
      const Chart = (await import("chart.js/auto")).default

      // Rainfall Trends Chart
      if (rainfallCanvasRef.current) {
        const rainfallCtx = rainfallCanvasRef.current.getContext("2d")
        if (rainfallCtx) {
          new Chart(rainfallCtx, {
            type: "line",
            data: {
              labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
              datasets: [
                {
                  label: "Historical Average",
                  data: [45, 52, 61, 58, 72, 85, 92, 88, 76, 65, 54, 48],
                  borderColor: "rgb(59, 130, 246)",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  tension: 0.4,
                },
                {
                  label: "Projected (2030)",
                  data: [38, 45, 55, 52, 65, 78, 85, 82, 70, 58, 48, 42],
                  borderColor: "rgb(239, 68, 68)",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderDash: [5, 5],
                  tension: 0.4,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: { color: "rgb(156, 163, 175)", font: { size: 11 } },
                },
                title: {
                  display: true,
                  text: "Monthly Rainfall Trends (mm)",
                  color: "rgb(229, 231, 235)",
                  font: { size: 13, weight: "normal" },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "rgb(156, 163, 175)", font: { size: 10 } },
                  grid: { color: "rgba(156, 163, 175, 0.1)" },
                },
                x: {
                  ticks: { color: "rgb(156, 163, 175)", font: { size: 10 } },
                  grid: { color: "rgba(156, 163, 175, 0.1)" },
                },
              },
            },
          })
        }
      }

      // Crop Yield Chart
      if (yieldCanvasRef.current) {
        const yieldCtx = yieldCanvasRef.current.getContext("2d")
        if (yieldCtx) {
          new Chart(yieldCtx, {
            type: "bar",
            data: {
              labels: ["Wheat", "Corn", "Rice", "Soybeans", "Cotton"],
              datasets: [
                {
                  label: "Current Yield (tons/ha)",
                  data: [3.2, 5.8, 4.5, 2.9, 1.8],
                  backgroundColor: "rgba(34, 197, 94, 0.7)",
                  borderColor: "rgb(34, 197, 94)",
                  borderWidth: 1,
                },
                {
                  label: "Projected Yield (2030)",
                  data: [2.8, 5.2, 4.0, 2.6, 1.5],
                  backgroundColor: "rgba(251, 146, 60, 0.7)",
                  borderColor: "rgb(251, 146, 60)",
                  borderWidth: 1,
                },
              ],
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: true,
                  position: "top",
                  labels: { color: "rgb(156, 163, 175)", font: { size: 11 } },
                },
                title: {
                  display: true,
                  text: "Crop Yield Projections",
                  color: "rgb(229, 231, 235)",
                  font: { size: 13, weight: "normal" },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { color: "rgb(156, 163, 175)", font: { size: 10 } },
                  grid: { color: "rgba(156, 163, 175, 0.1)" },
                },
                x: {
                  ticks: { color: "rgb(156, 163, 175)", font: { size: 10 } },
                  grid: { color: "rgba(156, 163, 175, 0.1)" },
                },
              },
            },
          })
        }
      }
    }

    loadChartJS()
  }, [location])

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="h-[200px]">
          <canvas ref={rainfallCanvasRef} />
        </div>
      </Card>

      <Card className="p-4 bg-muted/30">
        <div className="h-[200px]">
          <canvas ref={yieldCanvasRef} />
        </div>
      </Card>
    </div>
  )
}
