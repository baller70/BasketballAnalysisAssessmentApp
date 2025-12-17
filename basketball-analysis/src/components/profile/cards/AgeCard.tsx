"use client"

import React, { useState, useMemo } from "react"
import { ProfileCard } from "../ProfileCard"
import { AgeIcon } from "@/components/icons"

// Age tiers based on coaching requirements
const AGE_TIERS = {
  ELEMENTARY: { min: 6, max: 11, label: "Elementary", description: "Ages 6-11" },
  MIDDLE_SCHOOL: { min: 12, max: 14, label: "Middle School", description: "Ages 12-14" },
  HIGH_SCHOOL: { min: 15, max: 18, label: "High School", description: "Ages 15-18" },
  COLLEGE: { min: 19, max: 22, label: "College", description: "Ages 19-22" },
  PROFESSIONAL: { min: 23, max: 100, label: "Professional", description: "Ages 23+" },
}

// Age options (8 to 60+)
const AGE_OPTIONS: { value: number; label: string }[] = []
for (let age = 8; age <= 59; age++) {
  AGE_OPTIONS.push({ value: age, label: `${age} years old` })
}
AGE_OPTIONS.push({ value: 60, label: "60+ years old" })

// Get tier from age
const getTierFromAge = (age: number): keyof typeof AGE_TIERS | null => {
  if (age >= 6 && age <= 11) return "ELEMENTARY"
  if (age >= 12 && age <= 14) return "MIDDLE_SCHOOL"
  if (age >= 15 && age <= 18) return "HIGH_SCHOOL"
  if (age >= 19 && age <= 22) return "COLLEGE"
  if (age >= 23) return "PROFESSIONAL"
  return null
}

interface AgeCardProps {
  value: number | null
  onChange: (value: number) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function AgeCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: AgeCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  
  // Determine coaching tier
  const coachingTier = useMemo(() => {
    if (!value) return null
    const tierKey = getTierFromAge(value)
    return tierKey ? AGE_TIERS[tierKey] : null
  }, [value])
  
  return (
    <ProfileCard
      title="How old are you?"
      subtitle="This determines your coaching tier"
      educationalText="Your age helps us compare your form to the right standard. A 10-year-old's form is evaluated differently than a college player's."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="We don't judge everyone by the same standard. Your form will be compared to what's excellent for YOUR age group."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<AgeIcon size="lg" color="primary" />}
    >
      {/* Age Selector */}
      <div className="mb-6">
        <select
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full px-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors bg-white appearance-none cursor-pointer"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23999'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 1rem center",
            backgroundSize: "1.5rem",
          }}
        >
          <option value="" disabled>
            Select your age
          </option>
          {AGE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Coaching Tier Display */}
      {coachingTier && (
        <div className="p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl">🏀</span>
            </div>
            <div>
              <p className="text-sm text-orange-600 font-medium">
                Your Coaching Tier
              </p>
              <p className="text-lg font-bold text-gray-900">
                {coachingTier.label}
              </p>
              <p className="text-xs text-gray-500">
                {coachingTier.description}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Tier Explanation */}
      <div className="mt-6 grid grid-cols-5 gap-1">
        {Object.entries(AGE_TIERS).map(([key, tier]) => {
          const isActive = coachingTier?.label === tier.label
          return (
            <div
              key={key}
              className={`p-2 rounded-lg text-center transition-all ${
                isActive
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <p className="text-[10px] font-medium leading-tight">
                {tier.label.split(" ")[0]}
              </p>
            </div>
          )
        })}
      </div>
      
      {/* What This Means */}
      {coachingTier && (
        <div className="mt-4 text-center text-xs text-gray-500">
          Your analysis will be tailored to {coachingTier.label.toLowerCase()}-level expectations
        </div>
      )}
    </ProfileCard>
  )
}







