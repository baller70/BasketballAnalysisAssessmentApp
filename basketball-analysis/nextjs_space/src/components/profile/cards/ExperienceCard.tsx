"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion } from "framer-motion"
import { AthleticAbilityIcon } from "@/components/icons"

// Experience levels with descriptions
const EXPERIENCE_LEVELS = [
  {
    id: "beginner",
    label: "Beginner",
    description: "Just started playing basketball",
    details: "Learning the basics, shooting form still developing",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
        <path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "intermediate",
    label: "Intermediate",
    description: "Play casually, maybe in a league",
    details: "Understand fundamentals, working on consistency",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
        <path d="M12 16V8M12 8l4 4M12 8l-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "advanced",
    label: "Advanced",
    description: "Competitive player, serious about improvement",
    details: "Strong fundamentals, refining technique",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
        <circle cx="12" cy="12" r="4" fill="currentColor" />
        <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "professional",
    label: "Professional",
    description: "Paid to play or elite amateur",
    details: "Elite level, optimizing every detail",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" fill="none" />
      </svg>
    ),
  },
]

// Experience level type
export type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "professional"

interface ExperienceCardProps {
  value: ExperienceLevel | null
  onChange: (value: ExperienceLevel) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function ExperienceCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: ExperienceCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  
  return (
    <ProfileCard
      title="What's your experience level?"
      subtitle="Be honest - this helps us calibrate your analysis"
      educationalText="Your experience level helps us set realistic expectations and provide coaching at the right complexity level."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Select the level that best describes your current basketball experience. This affects the complexity of the feedback you receive."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<AthleticAbilityIcon size="lg" color="primary" />}
    >
      {/* Experience Level Options */}
      <div className="space-y-3">
        {EXPERIENCE_LEVELS.map((level) => {
          const isSelected = value === level.id
          
          return (
            <motion.button
              key={level.id}
              onClick={() => onChange(level.id as ExperienceLevel)}
              whileTap={{ scale: 0.98 }}
              className={`
                w-full p-4 rounded-xl border-2 transition-all text-left
                ${isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`
                    flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${isSelected
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-400"
                    }
                  `}
                >
                  {level.icon}
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3
                      className={`font-semibold ${
                        isSelected ? "text-orange-600" : "text-gray-900"
                      }`}
                    >
                      {level.label}
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
                  <p className="text-sm text-gray-600 mt-0.5">
                    {level.description}
                  </p>
                  {isSelected && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-xs text-gray-500 mt-1"
                    >
                      {level.details}
                    </motion.p>
                  )}
                </div>
                
                {/* Radio indicator */}
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
              </div>
            </motion.button>
          )
        })}
      </div>
    </ProfileCard>
  )
}


