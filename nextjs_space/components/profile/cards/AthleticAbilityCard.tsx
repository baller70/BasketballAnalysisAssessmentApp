"use client"

import React, { useState } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion } from "framer-motion"

// Athletic ability scale descriptors
const ABILITY_DESCRIPTORS: Record<number, { label: string; description: string }> = {
  1: { label: "Beginner", description: "Just starting out, not very athletic" },
  2: { label: "Beginner", description: "Just starting out, not very athletic" },
  3: { label: "Below Average", description: "Below average athleticism" },
  4: { label: "Below Average", description: "Below average athleticism" },
  5: { label: "Average", description: "Average athleticism" },
  6: { label: "Average", description: "Average athleticism" },
  7: { label: "Above Average", description: "Above average, quite athletic" },
  8: { label: "Above Average", description: "Above average, quite athletic" },
  9: { label: "Elite", description: "Elite athlete, very explosive" },
  10: { label: "Elite", description: "Elite athlete, very explosive" },
}

// Get color based on athletic score
const getScoreColor = (score: number): string => {
  if (score <= 2) return "bg-gray-400"
  if (score <= 4) return "bg-blue-400"
  if (score <= 6) return "bg-green-400"
  if (score <= 8) return "bg-orange-400"
  return "bg-red-500"
}

interface AthleticAbilityCardProps {
  value: number | null
  onChange: (value: number) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function AthleticAbilityCard({
  value,
  onChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: AthleticAbilityCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  
  const currentValue = value ?? 5
  const descriptor = ABILITY_DESCRIPTORS[currentValue]
  
  return (
    <ProfileCard
      title="Rate your athletic ability"
      subtitle="Be honest - this helps calibrate your analysis"
      educationalText="This helps us understand your athletic baseline. A less athletic player might need different form adjustments than a highly athletic player."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={value !== null}
      helpText="Consider your speed, jumping ability, coordination, and overall explosiveness compared to others your age."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
    >
      {/* Visual Scale Icons */}
      <div className="flex justify-between items-end mb-4 px-2">
        {/* Low athleticism icon */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 48 48"
            className="w-10 h-10 text-gray-400"
            fill="currentColor"
          >
            {/* Walking person */}
            <circle cx="24" cy="8" r="5" />
            <path d="M24 15 L24 30 M24 20 L18 26 M24 20 L30 26 M24 30 L20 42 M24 30 L28 42" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
            />
          </svg>
          <span className="text-xs text-gray-400 mt-1">Low</span>
        </div>
        
        {/* High athleticism icon */}
        <div className="flex flex-col items-center">
          <svg
            viewBox="0 0 48 48"
            className="w-10 h-10 text-orange-500"
            fill="currentColor"
          >
            {/* Running/jumping person with motion lines */}
            <circle cx="20" cy="6" r="5" />
            <path d="M20 13 L22 24 M20 16 L12 20 M20 16 L28 14 M22 24 L16 38 M22 24 L30 32" 
              stroke="currentColor" 
              strokeWidth="3" 
              strokeLinecap="round"
              fill="none"
            />
            {/* Motion lines */}
            <path d="M34 8 L40 8 M36 12 L42 12 M34 16 L40 16" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round"
            />
          </svg>
          <span className="text-xs text-orange-500 mt-1">Elite</span>
        </div>
      </div>
      
      {/* Slider Container */}
      <div className="relative mb-6">
        {/* Background Track */}
        <div className="h-3 bg-gray-200 rounded-full">
          {/* Filled Track */}
          <motion.div
            className={`h-full rounded-full ${getScoreColor(currentValue)}`}
            initial={{ width: "50%" }}
            animate={{ width: `${(currentValue / 10) * 100}%` }}
            transition={{ duration: 0.2 }}
          />
        </div>
        
        {/* Slider Input */}
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={currentValue}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-3 opacity-0 cursor-pointer"
        />
        
        {/* Thumb Indicator */}
        <motion.div
          className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full ${getScoreColor(currentValue)} border-4 border-white shadow-lg cursor-pointer`}
          style={{ left: `calc(${((currentValue - 1) / 9) * 100}% - 12px)` }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.2 }}
        />
      </div>
      
      {/* Scale Numbers */}
      <div className="flex justify-between px-1 mb-4">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`
              w-6 h-6 rounded-full text-xs font-medium transition-all
              ${currentValue === num
                ? `${getScoreColor(num)} text-white`
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }
            `}
          >
            {num}
          </button>
        ))}
      </div>
      
      {/* Current Selection Display */}
      <motion.div
        key={currentValue}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center p-4 bg-gray-50 rounded-xl"
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <span className={`text-2xl font-bold ${
            currentValue <= 4 ? "text-blue-600" :
            currentValue <= 6 ? "text-green-600" :
            currentValue <= 8 ? "text-orange-600" :
            "text-red-600"
          }`}>
            {currentValue}/10
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            currentValue <= 4 ? "bg-blue-100 text-blue-700" :
            currentValue <= 6 ? "bg-green-100 text-green-700" :
            currentValue <= 8 ? "bg-orange-100 text-orange-700" :
            "bg-red-100 text-red-700"
          }`}>
            {descriptor.label}
          </span>
        </div>
        <p className="text-sm text-gray-600">{descriptor.description}</p>
      </motion.div>
      
      {/* What This Affects */}
      <div className="mt-4 text-xs text-gray-500 text-center">
        This affects your baseline form expectations and coaching recommendations
      </div>
    </ProfileCard>
  )
}







