"use client"

import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  HelpIcon,
} from "@/components/icons"
// import { COLOR_TOKENS, ANIMATION } from "@/lib/design"

interface ProfileCardProps {
  // Card content
  title: string
  subtitle?: string
  educationalText: string
  children: React.ReactNode
  
  // Navigation
  currentStep: number
  totalSteps: number
  onNext: () => void
  onBack: () => void
  canProceed: boolean
  
  // Optional
  helpText?: string
  showHelp?: boolean
  onToggleHelp?: () => void
  
  // NEW: Icon support
  icon?: React.ReactNode
  iconColor?: "primary" | "success" | "warning" | "critical" | "neutral"
}

export function ProfileCard({
  title,
  subtitle,
  educationalText,
  children,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  canProceed,
  helpText,
  showHelp = false,
  onToggleHelp,
  icon,
  iconColor = "primary",
}: ProfileCardProps) {
  // Map icon color to CSS class
  const iconColorClass = {
    primary: "text-blue-700",
    success: "text-green-600",
    warning: "text-yellow-500",
    critical: "text-red-600",
    neutral: "text-gray-500",
  }[iconColor]

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-2 bg-gray-100">
          <motion.div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-700"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Card Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-700">
              {currentStep} of {totalSteps}
            </span>
            {helpText && onToggleHelp && (
              <button
                onClick={onToggleHelp}
                className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                aria-label="Show help"
              >
                <HelpIcon size="sm" color="neutral" />
              </button>
            )}
          </div>
          
          {/* Icon + Title Row */}
          <div className="flex items-center gap-3 mb-1">
            {icon && (
              <div className={`flex-shrink-0 ${iconColorClass}`}>
                {icon}
              </div>
            )}
            <h2 className="text-2xl font-bold text-gray-900">
              {title}
            </h2>
          </div>
          
          {subtitle && (
            <p className="text-gray-500 text-sm">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Educational Text */}
        <div className="px-6 pb-4">
          <p className="text-gray-600 text-sm leading-relaxed bg-blue-50 rounded-lg p-3 border-l-4 border-blue-600">
            {educationalText}
          </p>
        </div>
        
        {/* Help Text (expandable) */}
        <AnimatePresence>
          {showHelp && helpText && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-4 overflow-hidden"
            >
              <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-700">
                {helpText}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Card Content (form input) */}
        <div className="px-6 pb-6">
          {children}
        </div>
        
        {/* Navigation Buttons */}
        <div className="px-6 pb-6 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            disabled={currentStep === 1}
            className={`
              flex items-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
              ${currentStep === 1
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-600 hover:bg-gray-100"
              }
            `}
            aria-label="Go back"
          >
            <ChevronLeftIcon size="sm" color={currentStep === 1 ? "neutral" : "current"} />
            Back
          </button>
          
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`
              flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
              ${canProceed
                ? "bg-blue-700 text-white hover:bg-blue-800 shadow-lg shadow-blue-700/30"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
            aria-label={currentStep === totalSteps ? "Complete profile" : "Go to next step"}
          >
            {currentStep === totalSteps ? "Complete" : "Next"}
            <ChevronRightIcon size="sm" color="current" />
          </button>
        </div>
      </div>
      
      {/* Swipe Hint (mobile) */}
      <p className="text-center text-gray-400 text-xs mt-4 md:hidden">
        Swipe left or right to navigate
      </p>
    </motion.div>
  )
}


