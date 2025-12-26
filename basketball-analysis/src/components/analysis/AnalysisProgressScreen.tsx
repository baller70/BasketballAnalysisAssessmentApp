"use client"

import React, { useState, useEffect, useCallback } from "react"
import { 
  Check, 
  Loader2, 
  Search, 
  User, 
  Ruler, 
  ClipboardCheck, 
  Users, 
  Lightbulb, 
  CheckCircle2,
  AlertCircle
} from "lucide-react"

// ============================================
// PHASE 5: PROCESSING EXPERIENCE & USER ENGAGEMENT
// 7-Stage Processing Pipeline for Perceived Value
// ============================================

interface ProcessingStage {
  id: string
  label: string
  subtext: string
  icon: React.ReactNode
  color: string // Tailwind color class
  bgColor: string
  borderColor: string
  durationMs: number // Display duration in milliseconds
}

// The 7 stages as specified in Phase 5
const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: "upload_quality",
    label: "Analyzing Upload Quality",
    subtext: "Checking resolution, lighting, and framing...",
    icon: <Search className="w-6 h-6" />,
    color: "text-blue-400",
    bgColor: "bg-blue-500/20",
    borderColor: "border-blue-500/40",
    durationMs: 3000 // 3 seconds
  },
  {
    id: "body_detection",
    label: "Detecting Body Position",
    subtext: "Identifying feet, knees, hips, shoulders, elbows, wrists...",
    icon: <User className="w-6 h-6" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/40",
    durationMs: 5000 // 5 seconds
  },
  {
    id: "angle_measurement",
    label: "Measuring Shooting Angles",
    subtext: "Calculating elbow angle, release angle, knee bend...",
    icon: <Ruler className="w-6 h-6" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/40",
    durationMs: 5000 // 5 seconds
  },
  {
    id: "form_analysis",
    label: "Analyzing Shooting Form",
    subtext: "Evaluating balance, alignment, follow-through...",
    icon: <ClipboardCheck className="w-6 h-6" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/40",
    durationMs: 6000 // 6 seconds
  },
  {
    id: "optimal_comparison",
    label: "Comparing to Optimal Form",
    subtext: "Matching your form to players with similar body type...",
    icon: <Users className="w-6 h-6" />,
    color: "text-purple-400",
    bgColor: "bg-purple-500/20",
    borderColor: "border-purple-500/40",
    durationMs: 5000 // 5 seconds
  },
  {
    id: "recommendations",
    label: "Generating Personalized Recommendations",
    subtext: "Creating your custom improvement plan...",
    icon: <Lightbulb className="w-6 h-6" />,
    color: "text-orange-400",
    bgColor: "bg-orange-500/20",
    borderColor: "border-orange-500/40",
    durationMs: 5000 // 5 seconds
  },
  {
    id: "finalization",
    label: "Finalizing Your Analysis",
    subtext: "Your analysis is ready!",
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: "text-green-400",
    bgColor: "bg-green-500/20",
    borderColor: "border-green-500/40",
    durationMs: 3000 // 3 seconds
  }
]

// Did You Know facts to display during processing
const DID_YOU_KNOW_FACTS = [
  "Stephen Curry's shooting elbow stays within 5° of perfect 90° alignment on every shot.",
  "Elite shooters release the ball in under 0.4 seconds from catch to release.",
  "A 45° entry angle gives the ball 2x more rim area to fall through compared to a flat shot.",
  "Kyle Korver made 2,450 three-pointers in his career with one of the purest shooting forms ever.",
  "The optimal knee bend for shooting is between 35-55 degrees for maximum power transfer.",
  "Ray Allen practiced the same shooting routine every single game day for 18 years.",
  "A proper follow-through should hold until the ball reaches the basket.",
  "Your guide hand should only stabilize the ball, never push or steer the shot.",
  "Klay Thompson's shooting motion is so consistent it varies by less than 2° between shots.",
  "The 'one-motion' shot (fluid dip to release) is common among modern elite shooters.",
  "Proper balance means your weight is distributed 60% on your shooting-side foot.",
  "Steve Nash shot 90% from the free throw line by focusing on his breathing rhythm."
]

// Processing time estimates based on input type
export type InputType = "3_images" | "5_images" | "7_images" | "1_video" | "2_videos" | "3_videos"

const PROCESSING_TIME_ESTIMATES: Record<InputType, { min: number; max: number; label: string }> = {
  "3_images": { min: 30, max: 45, label: "Quick analysis" },
  "5_images": { min: 45, max: 60, label: "Standard analysis" },
  "7_images": { min: 60, max: 90, label: "Comprehensive analysis" },
  "1_video": { min: 45, max: 60, label: "Video processing" },
  "2_videos": { min: 60, max: 90, label: "Extended video analysis" },
  "3_videos": { min: 90, max: 120, label: "Full video suite" }
}

interface AnalysisProgressScreenProps {
  isVisible: boolean
  onComplete?: () => void
  inputType?: InputType
  actualProcessingComplete?: boolean // When true, skip to end
  errorMessage?: string | null
  onRetry?: () => void
  onCancel?: () => void
}

export function AnalysisProgressScreen({ 
  isVisible, 
  onComplete,
  inputType = "3_images",
  actualProcessingComplete = false,
  errorMessage = null,
  onRetry,
  onCancel
}: AnalysisProgressScreenProps) {
  const [currentStageIndex, setCurrentStageIndex] = useState(0)
  const [stageProgress, setStageProgress] = useState(0)
  const [completedStages, setCompletedStages] = useState<string[]>([])
  const [allStagesComplete, setAllStagesComplete] = useState(false)
  const [currentFact, setCurrentFact] = useState(DID_YOU_KNOW_FACTS[0])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [factIndex, setFactIndex] = useState(0)
  const [showCancelConfirm, setShowCancelConfirm] = useState(false)
  const [isExtendedProcessing, setIsExtendedProcessing] = useState(false)
  const [totalElapsedTime, setTotalElapsedTime] = useState(0)

  const processingEstimate = PROCESSING_TIME_ESTIMATES[inputType]

  // Reset state when becoming visible
  useEffect(() => {
    if (isVisible) {
      setCurrentStageIndex(0)
      setStageProgress(0)
      setCompletedStages([])
      setAllStagesComplete(false)
      setCurrentFact(DID_YOU_KNOW_FACTS[Math.floor(Math.random() * DID_YOU_KNOW_FACTS.length)])
      setFactIndex(0)
      setShowCancelConfirm(false)
      setIsExtendedProcessing(false)
      setTotalElapsedTime(0)
    }
  }, [isVisible])

  // Track total elapsed time
  useEffect(() => {
    if (!isVisible) return
    
    const timer = setInterval(() => {
      setTotalElapsedTime(prev => prev + 1)
    }, 1000)
    
    return () => clearInterval(timer)
  }, [isVisible])

  // Check for extended processing (taking longer than expected)
  useEffect(() => {
    if (totalElapsedTime > processingEstimate.max && !actualProcessingComplete) {
      setIsExtendedProcessing(true)
    }
  }, [totalElapsedTime, processingEstimate.max, actualProcessingComplete])

  // Rotate facts every 5 seconds
  useEffect(() => {
    if (!isVisible) return

    const factInterval = setInterval(() => {
      setFactIndex(prev => {
        const newIndex = (prev + 1) % DID_YOU_KNOW_FACTS.length
        setCurrentFact(DID_YOU_KNOW_FACTS[newIndex])
        return newIndex
      })
    }, 5000)

    return () => clearInterval(factInterval)
  }, [isVisible])

  // Animate through stages - ALWAYS complete all 7 stages before navigating
  useEffect(() => {
    if (!isVisible || errorMessage) return

    const stage = PROCESSING_STAGES[currentStageIndex]
    
    // If we've completed all stages
    if (!stage) {
      setAllStagesComplete(true)
      return
    }

    // Calculate progress increment based on stage duration
    const progressIncrement = 100 / (stage.durationMs / 100)

    // Animate stage progress
    const progressInterval = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return Math.min(100, prev + progressIncrement)
      })
    }, 100)

    // Complete stage after duration
    const stageTimeout = setTimeout(() => {
      setCompletedStages(prev => [...prev, stage.id])
      setCurrentStageIndex(prev => prev + 1)
      setStageProgress(0)
    }, stage.durationMs)

    return () => {
      clearInterval(progressInterval)
      clearTimeout(stageTimeout)
    }
  }, [isVisible, currentStageIndex, errorMessage])

  // Only call onComplete when BOTH conditions are met:
  // 1. All 7 stages have completed their animations
  // 2. Actual processing is complete (we have results)
  useEffect(() => {
    if (allStagesComplete && actualProcessingComplete) {
      // Small delay for the completion animation
      const completeTimeout = setTimeout(() => {
        onComplete?.()
      }, 1000)
      return () => clearTimeout(completeTimeout)
    }
  }, [allStagesComplete, actualProcessingComplete, onComplete])

  // Handle cancel
  const handleCancel = useCallback(() => {
    if (showCancelConfirm) {
      onCancel?.()
      setShowCancelConfirm(false)
    } else {
      setShowCancelConfirm(true)
    }
  }, [showCancelConfirm, onCancel])

  if (!isVisible) return null

  // Calculate overall progress
  const overallProgress = Math.round(
    ((completedStages.length + stageProgress / 100) / PROCESSING_STAGES.length) * 100
  )

  // Error state
  if (errorMessage) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl max-w-lg w-full p-8 border border-red-500/30 shadow-2xl">
          <div className="text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/40">
              <AlertCircle className="w-10 h-10 text-red-400" />
            </div>
            <h2 className="text-2xl font-black text-red-400 uppercase tracking-wider mb-4">
              Something Went Wrong
            </h2>
            <p className="text-[#888] text-sm mb-6">
              {errorMessage}
            </p>
            <div className="flex gap-4 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-6 py-3 bg-[#FF6B35] text-[#1a1a1a] font-bold rounded-lg hover:bg-[#e6c200] transition-colors"
                >
                  Try Again
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-3 bg-[#2a2a2a] text-[#E5E5E5] font-bold rounded-lg hover:bg-[#3a3a3a] transition-colors border border-[#3a3a3a]"
                >
                  Go Back
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Cancel confirmation modal
  if (showCancelConfirm) {
    return (
      <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl max-w-md w-full p-8 border border-[#FF6B35]/30 shadow-2xl">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#FF6B35]/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#FF6B35]/40">
              <AlertCircle className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <h3 className="text-xl font-bold text-[#FF6B35] mb-2">Cancel Analysis?</h3>
            <p className="text-[#888] text-sm mb-6">
              Are you sure? You&apos;ll lose this analysis and need to start over.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-6 py-3 bg-[#FF6B35] text-[#1a1a1a] font-bold rounded-lg hover:bg-[#e6c200] transition-colors"
              >
                Continue Analysis
              </button>
              <button
                onClick={() => onCancel?.()}
                className="px-6 py-3 bg-[#2a2a2a] text-[#E5E5E5] font-bold rounded-lg hover:bg-[#3a3a3a] transition-colors border border-[#3a3a3a]"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] rounded-2xl max-w-2xl w-full p-8 border border-[#3a3a3a] shadow-2xl my-4">
        
        {/* Header with animated icon */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer rotating ring */}
            <div className="absolute inset-0 border-4 border-[#FF6B35]/20 rounded-full animate-pulse" />
            <div 
              className="absolute inset-0 border-4 border-transparent border-t-[#FF6B35] rounded-full animate-spin"
              style={{ animationDuration: '2s' }}
            />
            {/* Inner icon */}
            <div className="absolute inset-2 bg-gradient-to-br from-[#FF6B35]/20 to-[#FF4500]/10 rounded-full flex items-center justify-center border border-[#FF6B35]/40">
              {PROCESSING_STAGES[currentStageIndex]?.icon || <CheckCircle2 className="w-10 h-10 text-[#FF6B35]" />}
            </div>
          </div>
          
          <h2 className="text-3xl font-black text-[#FF6B35] uppercase tracking-wider mb-2" style={{ textShadow: '0 0 30px rgba(255, 215, 0, 0.3)' }}>
            Analyzing Your Shot
          </h2>
          <p className="text-[#888] text-sm">
            {processingEstimate.label} • Estimated {processingEstimate.min}-{processingEstimate.max} seconds
          </p>
          
          {/* Extended processing message */}
          {isExtendedProcessing && (
            <p className="text-[#FF6B35] text-sm mt-2 animate-pulse">
              Taking a bit longer... ensuring accuracy
            </p>
          )}
        </div>

        {/* Overall Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[#888] text-sm font-medium">Overall Progress</span>
            <span className="text-[#FF6B35] font-black text-lg">{overallProgress}%</span>
          </div>
          <div className="h-4 bg-[#2a2a2a] rounded-full overflow-hidden border border-[#3a3a3a]">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B35] via-[#FF4500] to-[#FF6B35] transition-all duration-300 ease-out relative"
              style={{ width: `${overallProgress}%` }}
            >
              {/* Animated shine effect */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{ 
                  animation: 'shimmer 2s infinite',
                  backgroundSize: '200% 100%'
                }}
              />
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-[#666]">
            <span>Stage {Math.min(currentStageIndex + 1, PROCESSING_STAGES.length)} of {PROCESSING_STAGES.length}</span>
            <span>{totalElapsedTime}s elapsed</span>
          </div>
        </div>

        {/* Stages List */}
        <div className="space-y-3 mb-8">
          {PROCESSING_STAGES.map((stage, index) => {
            const isCompleted = completedStages.includes(stage.id)
            const isCurrent = index === currentStageIndex
            const isPending = index > currentStageIndex

            return (
              <div 
                key={stage.id}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl transition-all duration-500
                  ${isCompleted ? `${stage.bgColor} border ${stage.borderColor}` : ''}
                  ${isCurrent ? 'bg-[#2a2a2a] border border-[#FF6B35]/50 shadow-lg shadow-[#FF6B35]/10' : ''}
                  ${isPending ? 'bg-[#1a1a1a]/50 border border-[#2a2a2a] opacity-50' : ''}
                `}
              >
                {/* Stage Icon */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                  ${isCompleted ? `${stage.bgColor} border ${stage.borderColor} ${stage.color}` : ''}
                  ${isCurrent ? 'bg-[#FF6B35] text-[#1a1a1a]' : ''}
                  ${isPending ? 'bg-[#2a2a2a] text-[#555] border border-[#3a3a3a]' : ''}
                `}>
                  {isCompleted ? (
                    <Check className="w-6 h-6" />
                  ) : isCurrent ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    stage.icon
                  )}
                </div>

                {/* Stage Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`
                      font-bold text-sm uppercase tracking-wide
                      ${isCompleted ? stage.color : ''}
                      ${isCurrent ? 'text-[#FF6B35]' : ''}
                      ${isPending ? 'text-[#555]' : ''}
                    `}>
                      {stage.label}
                    </h4>
                    {isCompleted && (
                      <span className={`text-xs font-bold uppercase tracking-wider ${stage.color}`}>
                        ✓ Complete
                      </span>
                    )}
                  </div>
                  <p className={`
                    text-xs
                    ${isCurrent ? 'text-[#E5E5E5]' : 'text-[#666]'}
                  `}>
                    {stage.subtext}
                  </p>
                  
                  {/* Current Stage Progress Bar */}
                  {isCurrent && (
                    <div className="mt-3 h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] transition-all duration-100"
                        style={{ width: `${stageProgress}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Did You Know Section */}
        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-transparent rounded-xl p-5 border border-[#FF6B35]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-[#FF6B35]/20 rounded-lg flex items-center justify-center flex-shrink-0 border border-[#FF6B35]/30">
              <Lightbulb className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[#FF6B35] text-xs font-black uppercase tracking-wider mb-2">
                Did You Know?
              </p>
              <p className="text-[#E5E5E5] text-sm leading-relaxed transition-opacity duration-500">
                {currentFact}
              </p>
            </div>
          </div>
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <div className="mt-6 text-center">
            <button
              onClick={handleCancel}
              className="text-[#666] hover:text-[#888] text-sm transition-colors"
            >
              Cancel Analysis
            </button>
          </div>
        )}
      </div>

      {/* CSS for shimmer animation */}
      <style jsx>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  )
}

// Export processing time estimates for use in other components
export { PROCESSING_TIME_ESTIMATES, PROCESSING_STAGES }
