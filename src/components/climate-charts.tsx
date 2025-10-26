"use client"

import { Card } from "@/components/ui/card"
import { useEffect, useRef } from "react"

type DestroyableChart = { destroy: () => void }

export interface RainfallSeries {
  labels: string[]
  baseline: number[]
  projected: number[]
}

export interface YieldSeries {
  labels: string[]
  baseline: number[]
  projected: number[]
}

interface ClimateChartsProps {
  data: {
    rainfall: RainfallSeries
    yields: YieldSeries
  }
}

export function ClimateCharts({ data }: ClimateChartsProps) {
  const rainfallCanvasRef = useRef<HTMLCanvasElement>(null)
  const yieldCanvasRef = useRef<HTMLCanvasElement>(null)
  const rainfallChartRef = useRef<DestroyableChart | null>(null)
  const yieldChartRef = useRef<DestroyableChart | null>(null)

  useEffect(() => {
    // Dynamically load Chart.js
    const loadChartJS = async () => {
      const Chart = (await import("chart.js/auto")).default

      // Rainfall Trends Chart
      if (rainfallCanvasRef.current) {
        const rainfallCtx = rainfallCanvasRef.current.getContext("2d")
        if (rainfallCtx) {
          rainfallChartRef.current?.destroy()
          rainfallChartRef.current = new Chart(rainfallCtx, {
            type: "line",
            data: {
              labels: data.rainfall.labels,
              datasets: [
                {
                  label: "Historical Average",
                  data: data.rainfall.baseline,
                  borderColor: "rgb(59, 130, 246)",
                  backgroundColor: "rgba(59, 130, 246, 0.1)",
                  tension: 0.4,
                },
                {
                  label: "Projected (2030)",
                  data: data.rainfall.projected,
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
          }) as DestroyableChart
        }
      }

      // Crop Yield Chart
      if (yieldCanvasRef.current) {
        const yieldCtx = yieldCanvasRef.current.getContext("2d")
        if (yieldCtx) {
          yieldChartRef.current?.destroy()
          yieldChartRef.current = new Chart(yieldCtx, {
            type: "bar",
            data: {
              labels: data.yields.labels,
              datasets: [
                {
                  label: "Current Yield (tons/ha)",
                  data: data.yields.baseline,
                  backgroundColor: "rgba(34, 197, 94, 0.7)",
                  borderColor: "rgb(34, 197, 94)",
                  borderWidth: 1,
                },
                {
                  label: "Projected Yield (2030)",
                  data: data.yields.projected,
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
          }) as DestroyableChart
        }
      }
    }

    loadChartJS()

    return () => {
      rainfallChartRef.current?.destroy()
      yieldChartRef.current?.destroy()
    }
  }, [data])

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
