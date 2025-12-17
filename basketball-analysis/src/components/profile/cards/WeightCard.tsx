"use client"

import React, { useState, useMemo } from "react"
import { ProfileCard } from "../ProfileCard"
import { WeightIcon, NeedsImprovementIcon } from "@/components/icons"

// Weight options from 80 lbs to 350 lbs in 5-lb increments
const WEIGHT_OPTIONS_LBS: { value: number; label: string }[] = []
for (let lbs = 80; lbs <= 350; lbs += 5) {
  WEIGHT_OPTIONS_LBS.push({
    value: lbs,
    label: `${lbs} lbs`,
  })
}

// Expected weight ranges based on height (inches)
const getExpectedWeightRange = (heightInches: number): { min: number; max: number } => {
  // Using BMI-based estimates with athletic adjustments
  // Min: BMI ~17, Max: BMI ~32 (athletes can be heavier due to muscle)
  const heightMeters = heightInches * 0.0254
  const minWeight = Math.round(17 * heightMeters * heightMeters * 2.205)
  const maxWeight = Math.round(32 * heightMeters * heightMeters * 2.205)
  
  return { min: minWeight, max: maxWeight }
}

interface WeightCardProps {
  value: number | null
  onChange: (value: number) => void
  heightInches: number | null
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function WeightCard({
  value,
  onChange,
  heightInches,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: WeightCardProps) {
  const [useMetric, setUseMetric] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  
  // Convert lbs to kg
  const lbsToKg = (lbs: number) => Math.round(lbs * 0.453592)
  
  // Validate weight against height
  const weightValidation = useMemo(() => {
    if (!value || !heightInches) return { isValid: true, message: "" }
    
    const { min, max } = getExpectedWeightRange(heightInches)
    
    if (value < min) {
      return {
        isValid: false,
        message: `That seems light for your height. Expected ${min}-${max} lbs. Double-check?`,
      }
    }
    if (value > max) {
      return {
        isValid: false,
        message: `That seems heavy for your height. Expected ${min}-${max} lbs. Double-check?`,
      }
    }
    
    return { isValid: true, message: "" }
  }, [value, heightInches])
  
  return (
    <ProfileCard
      title="What's your weight?"
      subtitle="Helps us understand your body composition"
      educationalText="Weight helps us understand your body composition and the strength available for your shooting mechanics."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Weigh yourself in the morning before eating for the most accurate measurement. Wear minimal clothing."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<WeightIcon size="lg" color="primary" />}
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
            lbs
          </button>
          <button
            onClick={() => setUseMetric(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              useMetric
                ? "bg-white text-blue-700 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            kg
          </button>
        </div>
      </div>
      
      {/* Weight Selector */}
      <div className="mb-4">
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
            Select your weight
          </option>
          {WEIGHT_OPTIONS_LBS.map((option) => (
            <option key={option.value} value={option.value}>
              {useMetric
                ? `${lbsToKg(option.value)} kg`
                : option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Validation Warning */}
      {!weightValidation.isValid && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
          <NeedsImprovementIcon size="sm" color="warning" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">{weightValidation.message}</p>
        </div>
      )}
      
      {/* Selected Value Display */}
      {value && (
        <div className="mt-4 text-center">
          <span className="text-sm text-gray-500">Selected: </span>
          <span className="text-lg font-semibold text-blue-700">
            {useMetric ? `${lbsToKg(value)} kg` : `${value} lbs`}
          </span>
        </div>
      )}
      
      {/* BMI Reference (optional info) */}
      {value && heightInches && (
        <div className="mt-4 text-center text-xs text-gray-400">
          {(() => {
            const heightM = heightInches * 0.0254
            const weightKg = value * 0.453592
            const bmi = (weightKg / (heightM * heightM)).toFixed(1)
            return `BMI: ${bmi}`
          })()}
        </div>
      )}
    </ProfileCard>
  )
}







