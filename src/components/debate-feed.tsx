"use client"

import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CloudIcon, SproutIcon, TrendingUpIcon, MapPinIcon } from "@/components/icons"
import { useEffect, useRef } from "react"

interface DebateFeedProps {
  messages: Array<{ role: string; content: string }>
  isAnalyzing: boolean
}

export function DebateFeed({ messages, isAnalyzing }: DebateFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "meteorologist":
        return <CloudIcon className="h-4 w-4 text-chart-1" />
      case "agronomist":
        return <SproutIcon className="h-4 w-4 text-chart-3" />
      case "economist":
        return <TrendingUpIcon className="h-4 w-4 text-chart-4" />
      case "planner":
        return <MapPinIcon className="h-4 w-4 text-chart-2" />
      default:
        return <CloudIcon className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getRoleLabel = (role: string) => {
    return role.charAt(0).toUpperCase() + role.slice(1)
  }

  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-foreground">AI Analysis Debate</h3>
        {isAnalyzing && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-chart-1 rounded-full animate-pulse" />
            <span className="text-xs text-muted-foreground">Analyzing...</span>
          </div>
        )}
      </div>

      <ScrollArea className="h-[400px] pr-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !isAnalyzing && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Click &ldquo;Analyze Climate Impact&rdquo; to start the AI debate
            </div>
          )}

          {messages.map((message, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 mt-1">{getRoleIcon(message.role)}</div>
              <div className="flex-1 space-y-1">
                <div className="text-xs font-medium text-muted-foreground">{getRoleLabel(message.role)}</div>
                <div className="text-sm text-foreground leading-relaxed">{message.content}</div>
              </div>
            </div>
          ))}

          {isAnalyzing && messages.length === 0 && (
            <div className="flex gap-3 animate-pulse">
              <div className="flex-shrink-0 mt-1">
                <CloudIcon className="h-4 w-4 text-chart-1" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-muted rounded w-20" />
                <div className="h-3 bg-muted rounded w-full" />
                <div className="h-3 bg-muted rounded w-3/4" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </Card>
  )
}
