"use client"

import React, { useState, useMemo } from "react"
import { ProfileCard } from "../ProfileCard"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Loader2, Check, RefreshCw } from "lucide-react"

// Example prompts for placeholder
const EXAMPLE_PROMPTS = [
  "I'm a point guard who struggles with consistency...",
  "I want to improve my three-point range...",
  "My coach says my elbow is out...",
  "I play recreational basketball and want better form...",
  "I'm coming back from an injury and rebuilding my shot...",
]

interface BioCardProps {
  value: string | null
  enhancedBio: string | null
  onChange: (value: string) => void
  onEnhancedBioChange: (value: string) => void
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
}

export function BioCard({
  value,
  enhancedBio,
  onChange,
  onEnhancedBioChange,
  currentStep,
  totalSteps,
  onNext,
  onBack,
}: BioCardProps) {
  const [showHelp, setShowHelp] = useState(false)
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [showEnhanced, setShowEnhanced] = useState(false)
  const [enhanceError, setEnhanceError] = useState<string | null>(null)
  
  const charCount = value?.length || 0
  const minChars = 50
  const canEnhance = charCount >= minChars
  
  // Rotate through placeholder examples
  const [placeholderIndex] = useState(() => Math.floor(Math.random() * EXAMPLE_PROMPTS.length))
  const placeholder = EXAMPLE_PROMPTS[placeholderIndex]
  
  // Character count color
  const charCountColor = useMemo(() => {
    if (charCount >= minChars) return "text-green-600"
    if (charCount >= minChars * 0.7) return "text-orange-500"
    return "text-gray-400"
  }, [charCount])
  
  // Handle AI enhancement
  const handleEnhance = async () => {
    if (!value || !canEnhance) return
    
    setIsEnhancing(true)
    setEnhanceError(null)
    
    try {
      const response = await fetch("/api/enhance-bio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bio: value }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to enhance bio")
      }
      
      const data = await response.json()
      
      if (data.success && data.enhancedBio) {
        onEnhancedBioChange(data.enhancedBio)
        setShowEnhanced(true)
      } else {
        throw new Error(data.error || "Enhancement failed")
      }
    } catch (error) {
      console.error("Bio enhancement error:", error)
      setEnhanceError("Failed to enhance bio. Please try again.")
    } finally {
      setIsEnhancing(false)
    }
  }
  
  // Accept enhanced bio
  const handleAcceptEnhanced = () => {
    if (enhancedBio) {
      onChange(enhancedBio)
      setShowEnhanced(false)
    }
  }
  
  // Reject enhanced bio
  const handleRejectEnhanced = () => {
    setShowEnhanced(false)
    onEnhancedBioChange("")
  }
  
  return (
    <ProfileCard
      title="Tell us about yourself"
      subtitle="Optional - helps personalize your coaching"
      educationalText="Share your shooting goals, challenges, or anything else you'd like us to know. This helps our AI provide more personalized coaching feedback."
      currentStep={currentStep}
      totalSteps={totalSteps}
      onNext={onNext}
      onBack={onBack}
      canProceed={true} // Optional card, always can proceed
      helpText="The more detail you provide, the better we can personalize your analysis. Include your goals, current challenges, or what your coach has told you."
      showHelp={showHelp}
      onToggleHelp={() => setShowHelp(!showHelp)}
    >
      {/* Text Area */}
      <div className="relative mb-4">
        <textarea
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="w-full px-4 py-3 text-sm border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-0 transition-colors resize-none"
          disabled={showEnhanced}
        />
        
        {/* Character Count */}
        <div className="absolute bottom-3 right-3 flex items-center gap-2">
          <span className={`text-xs ${charCountColor}`}>
            {charCount}/{minChars} min
          </span>
          {charCount >= minChars && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="text-green-500"
            >
              <Check className="w-4 h-4" />
            </motion.span>
          )}
        </div>
      </div>
      
      {/* Enhance Button */}
      <AnimatePresence mode="wait">
        {!showEnhanced && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleEnhance}
            disabled={!canEnhance || isEnhancing}
            className={`
              w-full py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-all
              ${canEnhance && !isEnhancing
                ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white hover:from-purple-600 hover:to-indigo-600 shadow-lg shadow-purple-500/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Enhancing with AI...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Enhance My Bio with AI
              </>
            )}
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Enhancement Error */}
      {enhanceError && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-red-500 mt-2 text-center"
        >
          {enhanceError}
        </motion.p>
      )}
      
      {/* Enhanced Bio Preview */}
      <AnimatePresence>
        {showEnhanced && enhancedBio && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4"
          >
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-semibold text-purple-700">
                  AI-Enhanced Bio
                </span>
              </div>
              
              <p className="text-sm text-gray-700 mb-4 whitespace-pre-wrap">
                {enhancedBio}
              </p>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAcceptEnhanced}
                  className="flex-1 py-2 px-4 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Use This
                </button>
                <button
                  onClick={handleRejectEnhanced}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Keep Original
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Helper Text */}
      {!canEnhance && (
        <p className="text-xs text-gray-400 mt-2 text-center">
          Write at least {minChars} characters to enable AI enhancement
        </p>
      )}
      
      {/* Skip Option */}
      <div className="mt-4 text-center">
        <button
          onClick={onNext}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip this step →
        </button>
      </div>
    </ProfileCard>
  )
}


