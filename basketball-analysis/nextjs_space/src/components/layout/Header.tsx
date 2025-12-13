"use client"

import React from "react"
import Link from "next/link"
import { Activity } from "lucide-react"

export function Header() {
  return (
    <header className="bg-[#2C2C2C] sticky top-0 z-50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#FFD700] rounded-full flex items-center justify-center">
              <Activity className="w-7 h-7 text-[#1a1a1a]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#FFD700] uppercase tracking-wider">
                BASKETBALL SHOOTING MECHANICS ANALYSIS
              </h1>
              <p className="text-sm text-[#E5E5E5] uppercase tracking-wide">
                Advanced Biomechanical Analysis with Visual Tracking
              </p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-[#E5E5E5] hover:text-[#FFD700] transition-colors font-medium uppercase tracking-wider">
              UPLOAD
            </Link>
            <Link href="/results/demo" className="text-[#E5E5E5] hover:text-[#FFD700] transition-colors font-medium uppercase tracking-wider">
              RESULTS
            </Link>
            <Link href="/elite-shooters" className="text-[#E5E5E5] hover:text-[#FFD700] transition-colors font-medium uppercase tracking-wider">
              ELITE SHOOTERS
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}

