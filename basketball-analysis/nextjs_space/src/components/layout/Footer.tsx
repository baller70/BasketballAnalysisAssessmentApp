"use client"

import React from "react"

export function Footer() {
  return (
    <footer className="bg-[#2C2C2C] py-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <h3 className="text-[#FFD700] font-semibold mb-4 text-lg">About</h3>
            <p className="text-[#E5E5E5] text-sm leading-relaxed">
              Professional-grade basketball shooting analysis using advanced pose detection and biomechanical measurements suitable for coaching and player development.
            </p>
          </div>

          <div>
            <h3 className="text-[#FFD700] font-semibold mb-4 text-lg">Features</h3>
            <ul className="text-[#E5E5E5] text-sm space-y-2">
              <li>• Real-time pose detection with MediaPipe</li>
              <li>• 12+ biomechanical measurements</li>
              <li>• Phase-based analysis (Preparatory/Release/Flight)</li>
              <li>• Elite shooter comparison database</li>
              <li>• Trajectory visualization with physics</li>
            </ul>
          </div>

          <div>
            <h3 className="text-[#FFD700] font-semibold mb-4 text-lg">Measurements</h3>
            <ul className="text-[#E5E5E5] text-sm space-y-2">
              <li>• SA, EA, HA, KA, AA (Joint Angles)</li>
              <li>• EH, RH, HH (Heights)</li>
              <li>• RA, ENA (Release & Entry Angles)</li>
              <li>• VD (Vertical Displacement)</li>
              <li>• MTJ (Maximum Trajectory)</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-[#3a3a3a] text-center">
          <p className="text-[#999999] text-sm">
            Advanced Basketball Shooting Mechanics Analysis System - Professional Edition
          </p>
        </div>
      </div>
    </footer>
  )
}

