"use client"

import React, { useCallback, useEffect, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useSwipeable } from "react-swipeable"
import { useRouter } from "next/navigation"
import { useProfileStore } from "@/stores/profileStore"
import {
  HeightCard,
  WeightCard,
  WingspanCard,
  AgeCard,
  ExperienceCard,
  BodyTypeCard,
  AthleticAbilityCard,
  DominantHandCard,
  ShootingStyleCard,
} from "./cards"
import { BasketballIcon } from "@/components/icons"

interface ProfileWizardProps {
  onComplete?: () => void
}

export function ProfileWizard({ onComplete }: ProfileWizardProps) {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)
  
  // Get state from store
  const {
    currentStep,
    totalSteps,
    heightInches,
    weightLbs,
    wingspanInches,
    age,
    experienceLevel,
    bodyType,
    athleticAbility,
    dominantHand,
    shootingStyle,
    // bio,
    // enhancedBio,
    setHeight,
    setWeight,
    setWingspan,
    setAge,
    setExperienceLevel,
    setBodyType,
    setAthleticAbility,
    setDominantHand,
    setShootingStyle,
    // setBio,
    // setEnhancedBio,
    nextStep,
    prevStep,
    completeProfile,
    isStepComplete,
  } = useProfileStore()
  
  // Handle hydration
  useEffect(() => {
    setIsClient(true)
  }, [])
  
  // Handle next step with validation
  const handleNext = useCallback(() => {
    if (currentStep === totalSteps) {
      // Complete profile and redirect
      completeProfile()
      if (onComplete) {
        onComplete()
      } else {
        router.push("/")
      }
    } else {
      nextStep()
    }
  }, [currentStep, totalSteps, completeProfile, onComplete, router, nextStep])
  
  // Handle back
  const handleBack = useCallback(() => {
    prevStep()
  }, [prevStep])
  
  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isStepComplete(currentStep)) {
        handleNext()
      }
    },
    onSwipedRight: () => {
      handleBack()
    },
    trackMouse: false,
    trackTouch: true,
    delta: 50,
    swipeDuration: 500,
  })
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (isStepComplete(currentStep)) {
          handleNext()
        }
      } else if (e.key === "ArrowLeft") {
        handleBack()
      }
    }
    
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [currentStep, handleNext, handleBack, isStepComplete])
  
  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100">
        <div className="animate-pulse">
          <div className="w-80 h-96 bg-white rounded-2xl shadow-xl" />
        </div>
      </div>
    )
  }
  
  // Render current card
  const renderCard = () => {
    const commonProps = {
      currentStep,
      totalSteps,
      onNext: handleNext,
      onBack: handleBack,
    }
    
    switch (currentStep) {
      case 1:
        return (
          <HeightCard
            {...commonProps}
            value={heightInches}
            onChange={setHeight}
          />
        )
      case 2:
        return (
          <WeightCard
            {...commonProps}
            value={weightLbs}
            onChange={setWeight}
            heightInches={heightInches}
          />
        )
      case 3:
        return (
          <WingspanCard
            {...commonProps}
            value={wingspanInches}
            onChange={setWingspan}
            heightInches={heightInches}
          />
        )
      case 4:
        return (
          <AgeCard
            {...commonProps}
            value={age}
            onChange={setAge}
          />
        )
      case 5:
        return (
          <ExperienceCard
            {...commonProps}
            value={experienceLevel}
            onChange={setExperienceLevel}
          />
        )
      case 6:
        return (
          <BodyTypeCard
            {...commonProps}
            value={bodyType}
            onChange={setBodyType}
          />
        )
      case 7:
        return (
          <AthleticAbilityCard
            {...commonProps}
            value={athleticAbility}
            onChange={setAthleticAbility}
          />
        )
      case 8:
        return (
          <DominantHandCard
            {...commonProps}
            value={dominantHand}
            onChange={setDominantHand}
          />
        )
      case 9:
        return (
          <ShootingStyleCard
            {...commonProps}
            value={shootingStyle}
            onChange={setShootingStyle}
          />
        )
      default:
        return null
    }
  }
  
  return (
    <div
      {...swipeHandlers}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 p-4"
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-center gap-3 mb-2"
        >
          <BasketballIcon size="xl" color="primary" />
          <h1 className="text-3xl font-bold text-gray-900">
            Create Your Profile
          </h1>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-gray-600"
        >
          Help us personalize your shooting analysis
        </motion.p>
      </div>
      
      {/* Card Container */}
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {renderCard()}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Step Indicators */}
      <div className="mt-8 flex items-center gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNum = index + 1
          const isComplete = isStepComplete(stepNum)
          const isCurrent = stepNum === currentStep
          
          return (
            <button
              key={stepNum}
              onClick={() => {
                // Only allow going back to completed steps
                if (stepNum < currentStep || isComplete) {
                  useProfileStore.getState().goToStep(stepNum)
                }
              }}
              className={`
                w-3 h-3 rounded-full transition-all
                ${isCurrent
                  ? "w-8 bg-blue-600"
                  : isComplete
                    ? "bg-blue-400 hover:bg-blue-500 cursor-pointer"
                    : "bg-gray-300 cursor-not-allowed"
                }
              `}
              disabled={stepNum > currentStep && !isComplete}
              aria-label={`Step ${stepNum}`}
            />
          )
        })}
      </div>
      
      {/* Keyboard Hint (desktop only) */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="hidden md:block mt-4 text-xs text-gray-400"
      >
        Use arrow keys or Enter to navigate
      </motion.p>
    </div>
  )
}







