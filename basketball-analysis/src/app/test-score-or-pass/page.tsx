"use client"

import React from "react"
import { ScoreOrPassGame } from "@/components/comparison/ScoreOrPass/ScoreOrPassGame"

export default function TestScoreOrPassPage() {
  return (
    <main className="min-h-screen bg-[#050505]">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* The Game */}
          <ScoreOrPassGame 
            userProfile={{
              height: 72, // 6'0"
              weight: 180,
              bodyType: 'ATHLETIC'
            }}
            onSelectShooterForComparison={(shooter) => {
              console.log("Selected shooter for comparison:", shooter.name)
            }}
          />
        </div>
      </div>
    </main>
  )
}

