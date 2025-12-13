"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion, AnimatePresence } from "framer-motion"
import { BodyTypeIcon, ChevronDownIcon } from "@/components/icons"

// Body type definitions with examples
const BODY_TYPES = [
  {
    id: "ectomorph",
    label: "Ectomorph",
    shortDescription: "Lean, Long limbs",
    fullDescription: "Naturally lean with long limbs. Longer reach, higher release point.",
    characteristics: [
      "Slim build",
      "Long arms and legs",
      "Fast metabolism",
      "Narrow shoulders",
    ],
    shootingImplications: "Higher natural release point, longer shooting arc, may need to focus on power generation from legs",
    examples: ["Kevin Durant", "Dirk Nowitzki", "Brandon Ingram"],
    silhouette: (
      <svg viewBox="0 0 60 120" className="w-full h-full">
        {/* Ectomorph - tall and lean */}
        <ellipse cx="30" cy="12" rx="8" ry="10" fill="currentColor" /> {/* Head */}
        <rect x="26" y="22" width="8" height="40" rx="4" fill="currentColor" /> {/* Torso */}
        <rect x="10" y="26" width="40" height="4" rx="2" fill="currentColor" /> {/* Shoulders */}
        <rect x="8" y="26" width="4" height="35" rx="2" fill="currentColor" /> {/* Left arm */}
        <rect x="48" y="26" width="4" height="35" rx="2" fill="currentColor" /> {/* Right arm */}
        <rect x="22" y="62" width="6" height="45" rx="3" fill="currentColor" /> {/* Left leg */}
        <rect x="32" y="62" width="6" height="45" rx="3" fill="currentColor" /> {/* Right leg */}
      </svg>
    ),
  },
  {
    id: "mesomorph",
    label: "Mesomorph",
    shortDescription: "Athletic, Muscular",
    fullDescription: "Athletic and muscular build. Balanced mechanics, explosive power.",
    characteristics: [
      "Athletic build",
      "Broad shoulders",
      "Defined muscles",
      "Medium frame",
    ],
    shootingImplications: "Natural power and balance, versatile mechanics, can adapt to different shooting styles",
    examples: ["Michael Jordan", "Kobe Bryant", "LeBron James"],
    silhouette: (
      <svg viewBox="0 0 60 120" className="w-full h-full">
        {/* Mesomorph - athletic build */}
        <ellipse cx="30" cy="12" rx="9" ry="10" fill="currentColor" /> {/* Head */}
        <path d="M18 24 L42 24 L40 65 L20 65 Z" fill="currentColor" /> {/* Torso - V shape */}
        <rect x="6" y="24" width="6" height="32" rx="3" fill="currentColor" /> {/* Left arm */}
        <rect x="48" y="24" width="6" height="32" rx="3" fill="currentColor" /> {/* Right arm */}
        <rect x="20" y="65" width="8" height="42" rx="4" fill="currentColor" /> {/* Left leg */}
        <rect x="32" y="65" width="8" height="42" rx="4" fill="currentColor" /> {/* Right leg */}
      </svg>
    ),
  },
  {
    id: "endomorph",
    label: "Endomorph",
    shortDescription: "Stockier Build",
    fullDescription: "Stockier, more compact build. Lower center of gravity, different footwork.",
    characteristics: [
      "Wider build",
      "Lower center of gravity",
      "Stronger base",
      "Compact frame",
    ],
    shootingImplications: "Excellent balance and stability, may need to emphasize arc, strong foundation for power",
    examples: ["Charles Barkley", "Zion Williamson", "Kyle Lowry"],
    silhouette: (
      <svg viewBox="0 0 60 120" className="w-full h-full">
        {/* Endomorph - stockier build */}
        <ellipse cx="30" cy="14" rx="10" ry="11" fill="currentColor" /> {/* Head */}
        <ellipse cx="30" cy="45" rx="18" ry="22" fill="currentColor" /> {/* Torso - wider */}
        <rect x="4" y="28" width="7" height="28" rx="3.5" fill="currentColor" /> {/* Left arm */}
        <rect x="49" y="28" width="7" height="28" rx="3.5" fill="currentColor" /> {/* Right arm */}
        <rect x="16" y="67" width="10" height="38" rx="5" fill="currentColor" /> {/* Left leg */}
        <rect x="34" y="67" width="10" height="38" rx="5" fill="currentColor" /> {/* Right leg */}
      </svg>
    ),
  },
]

// Body type
export type BodyType = "ectomorph" | "mesomorph" | "endomorph"

interface BodyTypeCardProps {
  value: BodyType | null
  onChange: (value: BodyType) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function BodyTypeCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: BodyTypeCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [expandedType, setExpandedType] = useState<string | null>(null)
  
  const selectedType = BODY_TYPES.find((t) => t.id === value)
  
  return (
    <ProfileCard
      title="What's your body type?"
      subtitle="This affects your optimal shooting mechanics"
      educationalText="Your body type affects your natural center of gravity and optimal shooting mechanics. We'll compare you to players with similar builds."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Choose the body type that most closely matches yours. This helps us provide more accurate analysis based on players with similar physiques."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
      icon={<BodyTypeIcon size="lg" color="primary" />}
    >
      {/* Body Type Selection Grid */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {BODY_TYPES.map((type) => {
          const isSelected = value === type.id
          
          return (
            <motion.button
              key={type.id}
              onClick={() => onChange(type.id as BodyType)}
              whileTap={{ scale: 0.95 }}
              className={`
                p-3 rounded-xl border-2 transition-all flex flex-col items-center
                ${isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              {/* Silhouette */}
              <div
                className={`
                  w-16 h-24 mb-2
                  ${isSelected ? "text-orange-500" : "text-gray-300"}
                `}
              >
                {type.silhouette}
              </div>
              
              {/* Label */}
              <h3
                className={`font-semibold text-sm ${
                  isSelected ? "text-orange-600" : "text-gray-900"
                }`}
              >
                {type.label}
              </h3>
              
              {/* Short Description */}
              <p className="text-xs text-gray-500 text-center mt-1">
                {type.shortDescription}
              </p>
              
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-xs">✓</span>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
      
      {/* Expandable Details */}
      {BODY_TYPES.map((type) => (
        <div key={type.id} className="mb-2">
          <button
            onClick={() => setExpandedType(expandedType === type.id ? null : type.id)}
            className="w-full flex items-center justify-between p-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>Learn more about {type.label}</span>
            <ChevronDownIcon
              size="sm"
              color="current"
              className={`transition-transform ${
                expandedType === type.id ? "rotate-180" : ""
              }`}
            />
          </button>
          
          <AnimatePresence>
            {expandedType === type.id && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-3 bg-gray-50 rounded-lg mt-1 text-sm">
                  <p className="text-gray-700 mb-2">{type.fullDescription}</p>
                  
                  <div className="mb-2">
                    <p className="font-medium text-gray-900 text-xs mb-1">Characteristics:</p>
                    <ul className="text-xs text-gray-600 list-disc list-inside">
                      {type.characteristics.map((char, i) => (
                        <li key={i}>{char}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="mb-2">
                    <p className="font-medium text-gray-900 text-xs mb-1">Shooting Implications:</p>
                    <p className="text-xs text-gray-600">{type.shootingImplications}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-900 text-xs mb-1">NBA Examples:</p>
                    <p className="text-xs text-orange-600">{type.examples.join(", ")}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
      
      {/* Selected Summary */}
      {selectedType && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">Selected:</span> {selectedType.label}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            We&apos;ll match you with shooters like {selectedType.examples[0]}
          </p>
        </div>
      )}
    </ProfileCard>
  )
}


