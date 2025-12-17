"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion } from "framer-motion"

// Hand options
const HAND_OPTIONS = [
  {
    id: "right",
    label: "Right-Handed",
    description: "Shoot primarily with your right hand",
    icon: (isSelected: boolean) => (
      <svg
        viewBox="0 0 64 64"
        className={`w-16 h-16 ${isSelected ? "text-orange-500" : "text-gray-300"}`}
        fill="currentColor"
      >
        {/* Right hand icon */}
        <path d="M32 8 C28 8 26 12 26 16 L26 28 L22 28 C20 28 18 30 18 32 L18 44 C18 50 22 54 28 54 L36 54 C42 54 46 50 46 44 L46 20 C46 14 42 8 36 8 Z" />
        <circle cx="30" cy="18" r="3" fill={isSelected ? "#fff" : "#9ca3af"} />
        <text x="50" y="56" fontSize="12" fill={isSelected ? "#f97316" : "#9ca3af"}>R</text>
      </svg>
    ),
  },
  {
    id: "left",
    label: "Left-Handed",
    description: "Shoot primarily with your left hand",
    icon: (isSelected: boolean) => (
      <svg
        viewBox="0 0 64 64"
        className={`w-16 h-16 ${isSelected ? "text-orange-500" : "text-gray-300"}`}
        fill="currentColor"
        style={{ transform: "scaleX(-1)" }}
      >
        {/* Left hand icon (mirrored) */}
        <path d="M32 8 C28 8 26 12 26 16 L26 28 L22 28 C20 28 18 30 18 32 L18 44 C18 50 22 54 28 54 L36 54 C42 54 46 50 46 44 L46 20 C46 14 42 8 36 8 Z" />
        <circle cx="30" cy="18" r="3" fill={isSelected ? "#fff" : "#9ca3af"} />
        <text x="50" y="56" fontSize="12" fill={isSelected ? "#f97316" : "#9ca3af"} style={{ transform: "scaleX(-1)" }}>L</text>
      </svg>
    ),
  },
  {
    id: "ambidextrous",
    label: "Ambidextrous",
    description: "Can shoot effectively with both hands",
    icon: (isSelected: boolean) => (
      <svg
        viewBox="0 0 80 64"
        className={`w-20 h-16 ${isSelected ? "text-orange-500" : "text-gray-300"}`}
        fill="currentColor"
      >
        {/* Both hands icon */}
        <path d="M24 8 C20 8 18 12 18 16 L18 28 L14 28 C12 28 10 30 10 32 L10 44 C10 50 14 54 20 54 L28 54 C34 54 38 50 38 44 L38 20 C38 14 34 8 28 8 Z" />
        <path d="M56 8 C52 8 50 12 50 16 L50 28 L46 28 C44 28 42 30 42 32 L42 44 C42 50 46 54 52 54 L60 54 C66 54 70 50 70 44 L70 20 C70 14 66 8 60 8 Z" />
        <circle cx="22" cy="18" r="2" fill={isSelected ? "#fff" : "#9ca3af"} />
        <circle cx="54" cy="18" r="2" fill={isSelected ? "#fff" : "#9ca3af"} />
      </svg>
    ),
  },
]

// Dominant hand type
export type DominantHand = "right" | "left" | "ambidextrous"

interface DominantHandCardProps {
  value: DominantHand | null
  onChange: (value: DominantHand) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function DominantHandCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: DominantHandCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  
  return (
    <ProfileCard
      title="What's your dominant hand?"
      subtitle="Which hand do you shoot with?"
      educationalText="We'll analyze your shooting form based on your dominant hand and compare you to players with the same hand dominance."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="If you're unsure, think about which hand you use when you shoot a layup or free throw."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
    >
      {/* Hand Selection Options */}
      <div className="space-y-3">
        {HAND_OPTIONS.map((option) => {
          const isSelected = value === option.id
          
          return (
            <motion.button
              key={option.id}
              onClick={() => onChange(option.id as DominantHand)}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4
                ${isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              {/* Hand Icon */}
              <div className="flex-shrink-0">
                {option.icon(isSelected)}
              </div>
              
              {/* Text */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <h3
                    className={`font-semibold ${
                      isSelected ? "text-orange-600" : "text-gray-900"
                    }`}
                  >
                    {option.label}
                  </h3>
                  {isSelected && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-orange-500"
                    >
                      ✓
                    </motion.span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {option.description}
                </p>
              </div>
              
              {/* Radio Indicator */}
              <div
                className={`
                  w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  ${isSelected
                    ? "border-orange-500 bg-orange-500"
                    : "border-gray-300"
                  }
                `}
              >
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-2 h-2 bg-white rounded-full"
                  />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>
      
      {/* Fun Fact */}
      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          <span className="font-semibold">Fun fact:</span> Only about 10% of basketball players are left-handed, but they often have an advantage because defenders are less accustomed to guarding them!
        </p>
      </div>
      
      {/* Selected Summary */}
      {value && (
        <div className="mt-4 text-center text-sm text-gray-500">
          Analysis will be oriented for{" "}
          <span className="font-semibold text-orange-600">
            {value === "ambidextrous" ? "both hands" : `${value}-hand`}
          </span>{" "}
          shooting
        </div>
      )}
    </ProfileCard>
  )
}







