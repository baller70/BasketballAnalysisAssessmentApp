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
  AlertCircle,
  X,
  Sparkles
} from "lucide-react"

// ============================================
// PHASE 5: PROCESSING EXPERIENCE & USER ENGAGEMENT
// 7-Stage Processing Pipeline - Modern UI Design
// ============================================

interface ProcessingStage {
  id: string
  label: string
  subtext: string
  icon: React.ReactNode
  color: string
  gradient: string
  durationMs: number
}

// The 7 stages with modern color scheme
const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: "upload_quality",
    label: "Analyzing Upload",
    subtext: "Checking resolution & lighting",
    icon: <Search className="w-4 h-4" />,
    color: "text-sky-400",
    gradient: "from-sky-500 to-blue-600",
    durationMs: 3000
  },
  {
    id: "body_detection",
    label: "Body Detection",
    subtext: "Identifying key points",
    icon: <User className="w-4 h-4" />,
    color: "text-emerald-400",
    gradient: "from-emerald-500 to-green-600",
    durationMs: 5000
  },
  {
    id: "angle_measurement",
    label: "Measuring Angles",
    subtext: "Elbow, release, knee bend",
    icon: <Ruler className="w-4 h-4" />,
    color: "text-amber-400",
    gradient: "from-amber-500 to-orange-600",
    durationMs: 5000
  },
  {
    id: "form_analysis",
    label: "Form Analysis",
    subtext: "Balance & alignment",
    icon: <ClipboardCheck className="w-4 h-4" />,
    color: "text-violet-400",
    gradient: "from-violet-500 to-purple-600",
    durationMs: 6000
  },
  {
    id: "optimal_comparison",
    label: "Pro Comparison",
    subtext: "Matching elite shooters",
    icon: <Users className="w-4 h-4" />,
    color: "text-pink-400",
    gradient: "from-pink-500 to-rose-600",
    durationMs: 5000
  },
  {
    id: "recommendations",
    label: "Generating Tips",
    subtext: "Custom improvement plan",
    icon: <Lightbulb className="w-4 h-4" />,
    color: "text-cyan-400",
    gradient: "from-cyan-500 to-teal-600",
    durationMs: 5000
  },
  {
    id: "finalization",
    label: "Finalizing",
    subtext: "Almost ready!",
    icon: <CheckCircle2 className="w-4 h-4" />,
    color: "text-green-400",
    gradient: "from-green-500 to-emerald-600",
    durationMs: 3000
  }
]

// Did You Know facts
const DID_YOU_KNOW_FACTS = [
  "Stephen Curry's shooting elbow stays within 5° of perfect 90° alignment.",
  "Elite shooters release the ball in under 0.4 seconds from catch.",
  "A 45° entry angle gives the ball 2x more rim area to fall through.",
  "Kyle Korver made 2,450 three-pointers with textbook form.",
  "Optimal knee bend is between 35-55 degrees for max power.",
  "Ray Allen practiced the same routine every game day for 18 years.",
  "A proper follow-through should hold until the ball reaches the basket.",
  "Klay Thompson's motion varies by less than 2° between shots.",
  "Proper balance means 60% weight on your shooting-side foot.",
  "Steve Nash shot 90% FT by focusing on breathing rhythm."
]

// Processing time estimates
export type InputType = "3_images" | "5_images" | "7_images" | "1_video" | "2_videos" | "3_videos"

const PROCESSING_TIME_ESTIMATES: Record<InputType, { min: number; max: number; label: string }> = {
  "3_images": { min: 30, max: 45, label: "Quick Analysis" },
  "5_images": { min: 45, max: 60, label: "Standard Analysis" },
  "7_images": { min: 60, max: 90, label: "Deep Analysis" },
  "1_video": { min: 45, max: 60, label: "Video Analysis" },
  "2_videos": { min: 60, max: 90, label: "Multi-Video Analysis" },
  "3_videos": { min: 90, max: 120, label: "Full Suite Analysis" }
}

interface AnalysisProgressScreenProps {
  isVisible: boolean
  onComplete?: () => void
  inputType?: InputType
  actualProcessingComplete?: boolean
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

  // Track elapsed time
  useEffect(() => {
    if (!isVisible) return
    const timer = setInterval(() => setTotalElapsedTime(prev => prev + 1), 1000)
    return () => clearInterval(timer)
  }, [isVisible])

  // Extended processing check
  useEffect(() => {
    if (totalElapsedTime > processingEstimate.max && !actualProcessingComplete) {
      setIsExtendedProcessing(true)
    }
  }, [totalElapsedTime, processingEstimate.max, actualProcessingComplete])

  // Rotate facts
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

  // Animate through stages
  useEffect(() => {
    if (!isVisible || errorMessage) return

    const stage = PROCESSING_STAGES[currentStageIndex]
    
    if (!stage) {
      setAllStagesComplete(true)
      return
    }

    const progressIncrement = 100 / (stage.durationMs / 100)

    const progressInterval = setInterval(() => {
      setStageProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval)
          return 100
        }
        return Math.min(100, prev + progressIncrement)
      })
    }, 100)

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

  // Complete when both conditions met
  useEffect(() => {
    if (allStagesComplete && actualProcessingComplete) {
      const completeTimeout = setTimeout(() => onComplete?.(), 1000)
      return () => clearTimeout(completeTimeout)
    }
  }, [allStagesComplete, actualProcessingComplete, onComplete])

  const handleCancel = useCallback(() => {
    if (showCancelConfirm) {
      onCancel?.()
      setShowCancelConfirm(false)
    } else {
      setShowCancelConfirm(true)
    }
  }, [showCancelConfirm, onCancel])

  if (!isVisible) return null

  const overallProgress = Math.round(
    ((completedStages.length + stageProgress / 100) / PROCESSING_STAGES.length) * 100
  )

  // Error state - modern design
  if (errorMessage) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 border border-red-500/20 shadow-2xl shadow-red-500/10">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/30">
              <AlertCircle className="w-7 h-7 text-red-400" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-2">Something Went Wrong</h2>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">{errorMessage}</p>
            <div className="flex gap-3 justify-center">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
                >
                  Try Again
                </button>
              )}
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
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

  // Cancel confirmation - modern design
  if (showCancelConfirm) {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
        <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-3xl max-w-sm w-full p-6 border border-orange-500/20 shadow-2xl">
          <div className="text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-orange-500/30">
              <AlertCircle className="w-7 h-7 text-orange-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Cancel Analysis?</h3>
            <p className="text-zinc-400 text-sm mb-6">You&apos;ll need to start over if you cancel now.</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowCancelConfirm(false)}
                className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium rounded-xl hover:opacity-90 transition-opacity text-sm"
              >
                Continue
              </button>
              <button
                onClick={() => onCancel?.()}
                className="px-5 py-2.5 bg-zinc-800 text-zinc-300 font-medium rounded-xl hover:bg-zinc-700 transition-colors border border-zinc-700 text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex items-center justify-center p-3 overflow-y-auto">
      <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-3xl max-w-md w-full border border-zinc-800/80 shadow-2xl my-auto relative overflow-hidden">
        
        {/* Ambient glow effect */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        
        {/* Close button */}
        {onCancel && (
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center transition-colors z-10"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}

        <div className="relative p-5">
          {/* Header */}
          <div className="text-center mb-5">
            {/* Animated loader */}
            <div className="relative w-16 h-16 mx-auto mb-4">
              {/* Outer ring */}
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                />
                <circle
                  cx="50" cy="50" r="45"
                  fill="none"
                  stroke="url(#progressGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${overallProgress * 2.83} 283`}
                  className="transition-all duration-300"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#f59e0b" />
                  </linearGradient>
                </defs>
              </svg>
              {/* Center percentage */}
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-white">{overallProgress}%</span>
              </div>
            </div>
            
            <div className="flex items-center justify-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <h2 className="text-lg font-semibold text-white">Analyzing Your Shot</h2>
            </div>
            <p className="text-zinc-500 text-xs">
              {processingEstimate.label} • {totalElapsedTime}s
              {isExtendedProcessing && <span className="text-orange-400 ml-1">• Optimizing...</span>}
            </p>
          </div>

          {/* Stages - Compact horizontal pills */}
          <div className="grid grid-cols-7 gap-1.5 mb-5">
            {PROCESSING_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(stage.id)
              const isCurrent = index === currentStageIndex
              
              return (
                <div key={stage.id} className="flex flex-col items-center">
                  <div 
                    className={`
                      w-full h-1.5 rounded-full transition-all duration-500
                      ${isCompleted ? `bg-gradient-to-r ${stage.gradient}` : ''}
                      ${isCurrent ? 'bg-gradient-to-r from-orange-500/50 to-amber-500/50 animate-pulse' : ''}
                      ${!isCompleted && !isCurrent ? 'bg-zinc-800' : ''}
                    `}
                  />
                </div>
              )
            })}
          </div>

          {/* Current Stage Display */}
          <div className="bg-zinc-800/50 rounded-2xl p-4 mb-4 border border-zinc-700/50">
            <div className="flex items-center gap-3">
              <div className={`
                w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300
                bg-gradient-to-br ${PROCESSING_STAGES[currentStageIndex]?.gradient || 'from-green-500 to-emerald-600'}
              `}>
                {allStagesComplete ? (
                  <Check className="w-5 h-5 text-white" />
                ) : (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium text-sm truncate">
                  {allStagesComplete ? 'Analysis Complete!' : PROCESSING_STAGES[currentStageIndex]?.label}
                </p>
                <p className="text-zinc-500 text-xs truncate">
                  {allStagesComplete ? 'Preparing your results...' : PROCESSING_STAGES[currentStageIndex]?.subtext}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-zinc-400">
                  {Math.min(currentStageIndex + 1, 7)}/7
                </span>
              </div>
            </div>
            
            {/* Stage progress bar */}
            {!allStagesComplete && (
              <div className="mt-3 h-1 bg-zinc-700 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${PROCESSING_STAGES[currentStageIndex]?.gradient || 'from-green-500 to-emerald-600'} transition-all duration-100`}
                  style={{ width: `${stageProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Completed stages - mini icons */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {PROCESSING_STAGES.map((stage, index) => {
              const isCompleted = completedStages.includes(stage.id)
              const isCurrent = index === currentStageIndex
              
              return (
                <div
                  key={stage.id}
                  className={`
                    w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300
                    ${isCompleted ? `bg-gradient-to-br ${stage.gradient} shadow-lg` : ''}
                    ${isCurrent ? 'bg-zinc-700 ring-2 ring-orange-500/50' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-zinc-800/50' : ''}
                  `}
                  title={stage.label}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <div className={`${isCurrent ? 'text-orange-400' : 'text-zinc-600'}`}>
                      {stage.icon}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Did You Know - Floating card */}
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/5 rounded-xl p-3 border border-orange-500/20">
            <div className="flex items-start gap-2.5">
              <div className="w-6 h-6 bg-orange-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-orange-400/80 text-[10px] font-semibold uppercase tracking-wider mb-0.5">
                  Pro Tip
                </p>
                <p className="text-zinc-300 text-xs leading-relaxed line-clamp-2">
                  {currentFact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Export for use in other components
export { PROCESSING_TIME_ESTIMATES, PROCESSING_STAGES }
