"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown } from "lucide-react"

// Shooting style options with illustrations
const SHOOTING_STYLES = [
  {
    id: "one_motion",
    label: "One-Motion Shot",
    shortDescription: "Ball goes from waist to release in one smooth motion",
    fullDescription: "The ball travels from the set position to the release point in one continuous upward motion. There's no pause or 'load' at the chest. This is often called a 'catapult' style shot.",
    characteristics: [
      "Continuous upward motion",
      "No pause during shot",
      "Faster release time",
      "Common in: Stephen Curry, Klay Thompson",
    ],
    diagram: (isSelected: boolean) => (
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Player silhouette - one motion */}
        <circle cx="40" cy="15" r="10" fill={isSelected ? "#f97316" : "#d1d5db"} />
        <path
          d="M40 25 L40 55 M40 35 L25 50 M40 35 L55 25 M40 55 L30 80 M40 55 L50 80"
          stroke={isSelected ? "#f97316" : "#d1d5db"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ball trajectory - smooth curve */}
        <path
          d="M55 25 Q65 10 70 5"
          stroke={isSelected ? "#f97316" : "#9ca3af"}
          strokeWidth="2"
          strokeDasharray="4"
          fill="none"
        />
        <circle cx="70" cy="5" r="4" fill={isSelected ? "#f97316" : "#9ca3af"} />
        {/* Motion arrow - continuous */}
        <path
          d="M60 45 L60 15 L55 20 M60 15 L65 20"
          stroke={isSelected ? "#22c55e" : "#9ca3af"}
          strokeWidth="2"
          fill="none"
        />
      </svg>
    ),
  },
  {
    id: "two_motion",
    label: "Two-Motion Shot",
    shortDescription: "Ball loads at chest, then releases upward",
    fullDescription: "The ball comes up to a set point (usually at the chest or forehead), pauses briefly to 'load', then releases upward. This creates more power but takes slightly longer.",
    characteristics: [
      "Ball sets/loads before release",
      "Brief pause in motion",
      "More power from load",
      "Common in: Michael Jordan, Kobe Bryant",
    ],
    diagram: (isSelected: boolean) => (
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Player silhouette - two motion */}
        <circle cx="40" cy="15" r="10" fill={isSelected ? "#f97316" : "#d1d5db"} />
        <path
          d="M40 25 L40 55 M40 35 L25 45 M40 35 L50 30 M40 55 L30 80 M40 55 L50 80"
          stroke={isSelected ? "#f97316" : "#d1d5db"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ball at load position */}
        <circle cx="50" cy="30" r="5" fill={isSelected ? "#f97316" : "#9ca3af"} />
        {/* Two arrows showing two motions */}
        <path
          d="M60 55 L60 35"
          stroke={isSelected ? "#3b82f6" : "#9ca3af"}
          strokeWidth="2"
          fill="none"
        />
        <text x="65" y="45" fontSize="8" fill={isSelected ? "#3b82f6" : "#9ca3af"}>1</text>
        <path
          d="M60 30 L60 10 L55 15 M60 10 L65 15"
          stroke={isSelected ? "#22c55e" : "#9ca3af"}
          strokeWidth="2"
          fill="none"
        />
        <text x="65" y="20" fontSize="8" fill={isSelected ? "#22c55e" : "#9ca3af"}>2</text>
      </svg>
    ),
  },
  {
    id: "set_shot",
    label: "Set Shot",
    shortDescription: "Feet planted, shooting from stationary position",
    fullDescription: "A shot taken without jumping, with both feet firmly planted on the ground. Often used for free throws or by players who rely on accuracy over athleticism.",
    characteristics: [
      "No jump, feet stay planted",
      "Maximum balance and control",
      "Consistent release point",
      "Common in: Free throw specialists",
    ],
    diagram: (isSelected: boolean) => (
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Player silhouette - set shot (feet planted) */}
        <circle cx="40" cy="20" r="10" fill={isSelected ? "#f97316" : "#d1d5db"} />
        <path
          d="M40 30 L40 60 M40 40 L25 50 M40 40 L55 30 M40 60 L30 85 M40 60 L50 85"
          stroke={isSelected ? "#f97316" : "#d1d5db"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ground line (feet planted) */}
        <line
          x1="20"
          y1="88"
          x2="60"
          y2="88"
          stroke={isSelected ? "#f97316" : "#9ca3af"}
          strokeWidth="3"
        />
        {/* Ball */}
        <circle cx="55" cy="30" r="5" fill={isSelected ? "#f97316" : "#9ca3af"} />
        {/* "Planted" indicator */}
        <path
          d="M25 90 L25 95 M35 90 L35 95 M45 90 L45 95 M55 90 L55 95"
          stroke={isSelected ? "#22c55e" : "#9ca3af"}
          strokeWidth="2"
        />
      </svg>
    ),
  },
  {
    id: "jump_shot",
    label: "Jump Shot",
    shortDescription: "Shooting while jumping off the ground",
    fullDescription: "A shot taken while jumping, releasing the ball at or near the peak of the jump. This is the most common shot type in modern basketball.",
    characteristics: [
      "Release at jump peak",
      "Harder to block",
      "More athletic",
      "Most common shot type",
    ],
    diagram: (isSelected: boolean) => (
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Player silhouette - jumping */}
        <circle cx="40" cy="10" r="10" fill={isSelected ? "#f97316" : "#d1d5db"} />
        <path
          d="M40 20 L40 45 M40 28 L25 38 M40 28 L55 20 M40 45 L30 60 M40 45 L50 60"
          stroke={isSelected ? "#f97316" : "#d1d5db"}
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ball at release */}
        <circle cx="55" cy="20" r="5" fill={isSelected ? "#f97316" : "#9ca3af"} />
        {/* Ground line (showing gap = jump) */}
        <line
          x1="20"
          y1="88"
          x2="60"
          y2="88"
          stroke={isSelected ? "#9ca3af" : "#d1d5db"}
          strokeWidth="2"
          strokeDasharray="4"
        />
        {/* Jump height indicator */}
        <path
          d="M15 88 L15 65 M15 70 L12 75 M15 70 L18 75"
          stroke={isSelected ? "#22c55e" : "#9ca3af"}
          strokeWidth="2"
        />
        <text x="5" y="78" fontSize="7" fill={isSelected ? "#22c55e" : "#9ca3af"}>jump</text>
      </svg>
    ),
  },
  {
    id: "not_sure",
    label: "Not Sure",
    shortDescription: "We'll help you identify your style",
    fullDescription: "Don't worry if you're not sure! Our analysis will help identify your natural shooting style based on your uploaded videos and images.",
    characteristics: [
      "Analysis will detect your style",
      "No wrong answer here",
      "You'll learn your style",
      "Good for beginners",
    ],
    diagram: (isSelected: boolean) => (
      <svg viewBox="0 0 80 100" className="w-full h-full">
        {/* Question mark with basketball */}
        <circle cx="40" cy="40" r="25" fill="none" stroke={isSelected ? "#f97316" : "#d1d5db"} strokeWidth="3" />
        <text
          x="40"
          y="50"
          fontSize="30"
          fontWeight="bold"
          textAnchor="middle"
          fill={isSelected ? "#f97316" : "#9ca3af"}
        >
          ?
        </text>
        <circle cx="55" cy="70" r="8" fill={isSelected ? "#f97316" : "#9ca3af"} />
        {/* Basketball lines */}
        <path
          d="M50 70 Q55 65 60 70 M55 63 L55 77"
          stroke={isSelected ? "#fff" : "#d1d5db"}
          strokeWidth="1"
          fill="none"
        />
      </svg>
    ),
  },
]

// Shooting style type
export type ShootingStyle = "one_motion" | "two_motion" | "set_shot" | "jump_shot" | "not_sure"

interface ShootingStyleCardProps {
  value: ShootingStyle | null
  onChange: (value: ShootingStyle) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function ShootingStyleCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: ShootingStyleCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [expandedStyle, setExpandedStyle] = useState<string | null>(null)
  
  const selectedStyle = SHOOTING_STYLES.find((s) => s.id === value)
  
  return (
    <ProfileCard
      title="What's your shooting style?"
      subtitle="Select the one that best matches how you shoot"
      educationalText="Different shooting styles have different optimal mechanics. Knowing your style helps us give you better feedback."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Watch yourself shoot or think about how you typically release the ball. Do you pause to 'load' or is it one smooth motion?"
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
    >
      {/* Style Selection Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {SHOOTING_STYLES.slice(0, 4).map((style) => {
          const isSelected = value === style.id
          
          return (
            <motion.button
              key={style.id}
              onClick={() => onChange(style.id as ShootingStyle)}
              whileTap={{ scale: 0.95 }}
              className={`
                p-3 rounded-xl border-2 transition-all flex flex-col items-center
                ${isSelected
                  ? "border-orange-500 bg-orange-50"
                  : "border-gray-200 bg-white hover:border-gray-300"
                }
              `}
            >
              {/* Diagram */}
              <div className="w-16 h-20 mb-2">
                {style.diagram(isSelected)}
              </div>
              
              {/* Label */}
              <h3
                className={`font-semibold text-xs text-center ${
                  isSelected ? "text-orange-600" : "text-gray-900"
                }`}
              >
                {style.label}
              </h3>
              
              {/* Selection indicator */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="mt-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center"
                >
                  <span className="text-white text-[10px]">✓</span>
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>
      
      {/* "Not Sure" Option - Full Width */}
      {(() => {
        const notSureStyle = SHOOTING_STYLES[4]
        const isSelected = value === notSureStyle.id
        
        return (
          <motion.button
            onClick={() => onChange(notSureStyle.id as ShootingStyle)}
            whileTap={{ scale: 0.98 }}
            className={`
              w-full p-3 rounded-xl border-2 transition-all flex items-center gap-3 mb-4
              ${isSelected
                ? "border-orange-500 bg-orange-50"
                : "border-gray-200 bg-white hover:border-gray-300"
              }
            `}
          >
            <div className="w-12 h-12">
              {notSureStyle.diagram(isSelected)}
            </div>
            <div className="flex-1 text-left">
              <h3 className={`font-semibold text-sm ${isSelected ? "text-orange-600" : "text-gray-900"}`}>
                {notSureStyle.label}
              </h3>
              <p className="text-xs text-gray-500">{notSureStyle.shortDescription}</p>
            </div>
            {isSelected && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center"
              >
                <span className="text-white text-xs">✓</span>
              </motion.div>
            )}
          </motion.button>
        )
      })()}
      
      {/* Learn More Expandable Sections */}
      <div className="space-y-1">
        {SHOOTING_STYLES.slice(0, 4).map((style) => (
          <div key={style.id}>
            <button
              onClick={() => setExpandedStyle(expandedStyle === style.id ? null : style.id)}
              className="w-full flex items-center justify-between p-2 text-xs text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span>Learn about {style.label}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform ${
                  expandedStyle === style.id ? "rotate-180" : ""
                }`}
              />
            </button>
            
            <AnimatePresence>
              {expandedStyle === style.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-3 bg-gray-50 rounded-lg mt-1 text-xs">
                    <p className="text-gray-700 mb-2">{style.fullDescription}</p>
                    <ul className="text-gray-600 space-y-1">
                      {style.characteristics.map((char, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-orange-500">•</span>
                          {char}
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      
      {/* Selected Summary */}
      {selectedStyle && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800">
            <span className="font-semibold">Selected:</span> {selectedStyle.label}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {selectedStyle.shortDescription}
          </p>
        </div>
      )}
    </ProfileCard>
  )
}


