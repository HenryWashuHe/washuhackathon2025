"use client"

import { Button } from "@/components/ui/button"
import { InfoIcon } from "@/components/icons"
import { useState } from "react"
import { AboutModal } from "@/components/about-modal"

export function Header() {
  const [showAbout, setShowAbout] = useState(false)

  return (
    <>
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">TerraMind</h1>
            <p className="text-xs text-muted-foreground">Smart Climate Decision System</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setShowAbout(true)}>
            <InfoIcon className="h-4 w-4 mr-2" />
            About
          </Button>
        </div>
      </header>
      <AboutModal open={showAbout} onOpenChange={setShowAbout} />
    </>
  )
}
