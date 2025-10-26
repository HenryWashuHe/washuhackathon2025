"use client"

import type { JSX } from "react"
import Link from "next/link"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { SparklesIcon } from "@/components/icons"
import { AlertTriangle, BarChart3, Droplets, Leaf, Shield, Wheat } from "lucide-react"

const tracks = [
  {
    id: "agriculture",
    title: "Agricultural Climate Adaptation",
    blurb:
      "Coordinate meteorologist, agronomist, economist, and planner agents to safeguard crop yields and farm incomes.",
    cta: {
      href: "/",
      label: "Launch Agricultural Analysis",
    },
    highlights: [
      { icon: Wheat, label: "Crop Mix Guidance" },
      { icon: Droplets, label: "Water & Irrigation" },
      { icon: BarChart3, label: "Economic Trade-offs" },
    ],
    accent: "from-emerald-500/10 via-emerald-500/5 to-sky-500/10 border-emerald-300/60",
  },
  {
    id: "risk",
    title: "Long-Term Climate Risk Assessment",
    blurb:
      "Project livability, economic losses, and hazard exposure over 1–100 years with a dedicated risk-scoring pipeline.",
    cta: {
      href: "/climate-risk",
      label: "Explore Risk Dashboard",
    },
    highlights: [
      { icon: Shield, label: "Livability Scores" },
      { icon: AlertTriangle, label: "Hazard Forecasting" },
      { icon: Leaf, label: "Adaptation Investment Signals" },
    ],
    accent: "from-rose-500/10 via-orange-500/10 to-amber-500/10 border-rose-300/60",
  },
]

const valueProps = [
  {
    heading: "Multi-Agent Reasoning",
    description:
      "Specialised agents debate the climate data, economic impacts, and social stability before synthesising a unified plan.",
  },
  {
    heading: "Real Climate Signals",
    description:
      "Live Open-Meteo feeds and geospatial context anchor every recommendation in evidence—not generic prompts.",
  },
  {
    heading: "Actionable Outputs",
    description:
      "Receive risk scores, priority actions, and financing guidance you can bring to stakeholders the same day.",
  },
]

export default function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <main className="mx-auto flex max-w-6xl flex-col gap-16 px-6 pb-20 pt-12 md:px-10">
        {/* Hero */}
        <section className="transition-all duration-700">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
              <SparklesIcon className="h-4 w-4" />
              TerraMind Climate Intelligence
            </span>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
              Choose Your Climate Intelligence Workflow
            </h1>
            <p className="mt-4 text-lg text-slate-600 md:text-xl">
              Mobilise AI agents to protect today’s harvests or chart tomorrow’s livability. Pick the experience that fits
              your mission.
            </p>
          </div>
        </section>

        {/* Tracks */}
        <section className="grid gap-8 md:grid-cols-2">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className={`relative flex h-full flex-col border ${track.accent} bg-white shadow-sm transition-all duration-500 hover:-translate-y-1 hover:shadow-lg`}
            >
              <div className="flex flex-1 flex-col gap-6 p-8">
                <div className="flex flex-col gap-3">
                  <h2 className="text-2xl font-semibold text-slate-900">{track.title}</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{track.blurb}</p>
                </div>

                <ul className="space-y-3 text-sm text-slate-700">
                  {track.highlights.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-2 rounded-md border border-slate-200/70 bg-slate-50/70 px-3 py-2">
                      <Icon className="h-4 w-4 text-emerald-500" />
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>

                <Button asChild className="mt-auto w-full bg-slate-900 text-white hover:bg-slate-800">
                  <Link href={track.cta.href}>
                    {track.cta.label}
                    <span aria-hidden className="ml-2">→</span>
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
        </section>

        {/* Value props */}
        <section className="grid gap-6 rounded-3xl bg-white/60 p-8 shadow-sm md:grid-cols-3">
          {valueProps.map((value) => (
            <div key={value.heading} className="space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">{value.heading}</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{value.description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
