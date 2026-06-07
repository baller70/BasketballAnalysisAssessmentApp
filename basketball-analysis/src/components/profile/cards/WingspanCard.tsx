"use client"

import React, { useState, useMemo } from "react"
import { ProfileCard } from "../ProfileCard"
import { WingspanIcon, NeedsImprovementIcon } from "@/components/icons"

// Wingspan options from 4'0" to 8'0"
const WINGSPAN_OPTIONS_IMPERIAL: { value: number; label: string }[] = []
for (let feet = 4; feet <= 8; feet++) {
  const endInch = feet === 8 ? 0 : 11
  for (let inches = 0; inches <= endInch; inches++) {
    const totalInches = feet * 12 + inches
    WINGSPAN_OPTIONS_IMPERIAL.push({
      value: totalInches,
      label: `${feet}'${inches}"`,
    })
  }
}

interface WingspanCardProps {
  value: number | null
  onChange: (value: number) => void
  heightInches: number | null
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function WingspanCard({
  value,
  onChange,
  heightInches,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: WingspanCardProps) {
  const [useMetric, setUseMetric] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // Convert inches to cm
  const inchesToCm = (inches: number) => Math.round(inches * 2.54)
  
  // Validate wingspan against height (should be within ±10%)
  const wingspanValidation = useMemo(() => {
    if (!value || !heightInches) return { isValid: true, message: "", ratio: null }
    
    const minWingspan = Math.round(heightInches * 0.9)
    const maxWingspan = Math.round(heightInches * 1.15) // Athletes can have longer wingspans
    const ratio = ((value / heightInches) * 100).toFixed(1)
    
    if (value < minWingspan) {
      return {
        isValid: false,
        message: `That seems short for your height. Most people have wingspans close to their height. Double-check your measurement.`,
        ratio,
      }
    }
    if (value > maxWingspan) {
      return {
        isValid: false,
        message: `That's an unusually long wingspan. Please verify your measurement is fingertip to fingertip.`,
        ratio,
      }
    }
    
    return { isValid: true, message: "", ratio }
  }, [value, heightInches])
  
  // Wingspan-to-height ratio interpretation
  const getRatioInterpretation = (ratio: number) => {
    if (ratio < 98) return { text: "Shorter than average", color: "text-gray-400" }
    if (ratio <= 102) return { text: "Average wingspan", color: "text-gray-300" }
    if (ratio <= 107) return { text: "Longer than average", color: "text-green-400" }
    return { text: "Elite wingspan", color: "text-[#FF6B35]" }
  }
  
  return (
    <ProfileCard
      title="What's your wingspan?"
      subtitle="Measure fingertip to fingertip with arms extended"
      educationalText="Wingspan affects your natural release point and shooting arc. Players with longer wingspans often have different optimal mechanics."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Stand with your back against a wall, arms extended horizontally at shoulder height. Have someone measure from fingertip to fingertip. Keep your arms straight and parallel to the floor."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<WingspanIcon size="lg" color="primary" />}
    >
      {/* Measurement Illustration */}
      <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl">
        <div className="flex items-center justify-center">
          <div className="relative">
            {/* Simple stick figure with arms extended */}
            <svg
              viewBox="0 0 200 100"
              className="w-full max-w-[200px] h-auto"
            >
              {/* Body */}
              <circle cx="100" cy="20" r="12" fill="#FF6B35" /> {/* Head */}
              <line x1="100" y1="32" x2="100" y2="70" stroke="#9ca3af" strokeWidth="3" /> {/* Body */}
              
              {/* Arms extended */}
              <line x1="20" y1="45" x2="180" y2="45" stroke="#9ca3af" strokeWidth="3" />
              
              {/* Hands */}
              <circle cx="20" cy="45" r="5" fill="#FF6B35" />
              <circle cx="180" cy="45" r="5" fill="#FF6B35" />
              
              {/* Measurement arrow */}
              <line x1="20" y1="85" x2="180" y2="85" stroke="#FF6B35" strokeWidth="2" />
              <polygon points="20,80 20,90 10,85" fill="#FF6B35" />
              <polygon points="180,80 180,90 190,85" fill="#FF6B35" />
              
              <text x="100" y="98" textAnchor="middle" fontSize="10" fill="#9ca3af">
                Measure here
              </text>
            </svg>
          </div>
        </div>
        <p className="text-xs text-center text-slate-500 mt-2">
          Arms extended, fingertip to fingertip
        </p>
      </div>
      
      {/* Unit Toggle */}
      <div className="flex justify-center mb-6">
        <div className="inline-flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setUseMetric(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              !useMetric
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            ft/in
          </button>
          <button
            onClick={() => setUseMetric(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              useMetric
                ? "bg-[#FF6B35] text-white shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            cm
          </button>
        </div>
      </div>
      
      {/* Wingspan Selector */}
      <div className="mb-4">
        <select
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-4 text-lg border-2 border-slate-200 rounded-xl focus:border-[#FF6B35] focus:ring-0 transition-colors bg-white text-slate-900 appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FF6B35'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          <option value="" disabled>
            Select your wingspan
          </option>
          {WINGSPAN_OPTIONS_IMPERIAL.map((option) => (
            <option key={option.value} value={option.value}>
              {useMetric
                ? `${inchesToCm(option.value)} cm`
                : option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Validation Warning */}
      {!wingspanValidation.isValid && (
        <div className="flex items-start gap-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg mb-4">
          <NeedsImprovementIcon size="sm" color="warning" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">{wingspanValidation.message}</p>
        </div>
      )}
      
      {/* Wingspan-to-Height Ratio */}
      {value && heightInches && wingspanValidation.ratio && (
        <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-500">Wingspan-to-Height Ratio:</span>
            <span className="font-semibold text-slate-900">
              {wingspanValidation.ratio}%
            </span>
          </div>
          <div className="mt-1">
            <span className={`text-xs ${getRatioInterpretation(parseFloat(wingspanValidation.ratio)).color}`}>
              {getRatioInterpretation(parseFloat(wingspanValidation.ratio)).text}
            </span>
          </div>
        </div>
      )}
      
      {/* Selected Value Display */}
      {value && (
        <div className="mt-4 text-center">
          <span className="text-sm text-slate-500">Selected: </span>
          <span className="text-lg font-semibold text-[#FF6B35]">
            {useMetric
              ? `${inchesToCm(value)} cm`
              : WINGSPAN_OPTIONS_IMPERIAL.find((o) => o.value === value)?.label}
          </span>
        </div>
      )}
    </ProfileCard>
  )
}







