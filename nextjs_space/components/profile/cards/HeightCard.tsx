"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { HeightIcon, BasketballIcon } from "@/components/icons"

// Height options from 4'6" to 7'2"
const HEIGHT_OPTIONS_IMPERIAL: { value: number; label: string }[] = []
for (let feet = 4; feet <= 7; feet++) {
  const startInch = feet === 4 ? 6 : 0
  const endInch = feet === 7 ? 2 : 11
  for (let inches = startInch; inches <= endInch; inches++) {
    const totalInches = feet * 12 + inches
    HEIGHT_OPTIONS_IMPERIAL.push({
      value: totalInches,
      label: `${feet}'${inches}"`,
    })
  }
}

// Player silhouette heights for visual reference
const PLAYER_EXAMPLES = [
  { height: "5'6\"", label: "Point Guard" },
  { height: "6'2\"", label: "Shooting Guard" },
  { height: "6'8\"", label: "Forward" },
  { height: "7'0\"", label: "Center" },
]

interface HeightCardProps {
  value: number | null
  onChange: (value: number) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function HeightCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: HeightCardProps) {
  const [useMetric, setUseMetric] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // Convert inches to cm for display
  const inchesToCm = (inches: number) => Math.round(inches * 2.54)
  // const cmToInches = (cm: number) => Math.round(cm / 2.54)
  
  return (
    <ProfileCard
      title="What's your height?"
      subtitle="This helps us understand your natural shooting mechanics"
      educationalText="Your height affects your natural release point and shooting arc. We'll compare your form to players with similar measurements."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Stand against a wall without shoes. Have someone mark your height at the top of your head, then measure from the floor to the mark."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<HeightIcon size="lg" color="primary" />}
    >
      {/* Unit Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setUseMetric(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              !useMetric
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ft/in
          </button>
          <button
            onClick={() => setUseMetric(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              useMetric
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            cm
          </button>
        </div>
      </div>
      
      {/* Height Selector */}
      <div className="mb-6">
        <select
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-600 focus:ring-0 transition-colors bg-white appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          <option value="" disabled>
            Select your height
          </option>
          {HEIGHT_OPTIONS_IMPERIAL.map((option) => (
            <option key={option.value} value={option.value}>
              {useMetric
                ? `${inchesToCm(option.value)} cm`
                : option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Visual Reference - Player Silhouettes */}
      <div className="grid grid-cols-4 gap-2 mt-4">
        {PLAYER_EXAMPLES.map((player) => (
          <div
            key={player.height}
            className="text-center p-2 rounded-lg bg-blue-50"
          >
            <div className="flex justify-center mb-1">
              <BasketballIcon size="md" color="primary" />
            </div>
            <div className="text-xs font-medium text-gray-700">
              {player.height}
            </div>
            <div className="text-xs text-gray-500">{player.label}</div>
          </div>
        ))}
      </div>
      
      {/* Selected Value Display */}
      {value && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">Selected: </span>
          <span className="text-lg font-semibold text-blue-700">
            {useMetric
              ? `${inchesToCm(value)} cm`
              : HEIGHT_OPTIONS_IMPERIAL.find((o) => o.value === value)?.label}
          </span>
        </div>
      )}
    </ProfileCard>
  )
}







