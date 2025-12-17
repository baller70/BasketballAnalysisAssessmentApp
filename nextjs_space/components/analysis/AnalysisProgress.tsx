"use client"

import React from 'react'
import { cn } from '@/lib/utils'
import { Activity } from 'lucide-react'

// 10 Analysis Stages with titles for the progress box
export const ANALYSIS_STAGES = [
  { id: 1, title: 'Detecting pose keypoints...', subtitle: 'Initializing AI model...' },
  { id: 2, title: 'Analyzing foot positioning...', subtitle: 'Evaluating stance and balance...' },
  { id: 3, title: 'Evaluating leg mechanics...', subtitle: 'Checking knee angles and alignment...' },
  { id: 4, title: 'Measuring hip rotation...', subtitle: 'Assessing lower body coordination...' },
  { id: 5, title: 'Assessing core stability...', subtitle: 'Analyzing torso alignment...' },
  { id: 6, title: 'Analyzing shoulder position...', subtitle: 'Checking upper body posture...' },
  { id: 7, title: 'Evaluating elbow mechanics...', subtitle: 'Measuring shooting pocket...' },
  { id: 8, title: 'Measuring wrist position...', subtitle: 'Analyzing release point...' },
  { id: 9, title: 'Calculating arc trajectory...', subtitle: 'Computing optimal release angle...' },
  { id: 10, title: 'Finalizing recommendations...', subtitle: 'Generating form assessment...' },
]

interface AnalysisProgressProps {
  currentStage: number // 1-10 = in progress
  isAnalyzing: boolean
  className?: string
}

export function AnalysisProgress({ currentStage, isAnalyzing, className }: AnalysisProgressProps) {
  // Calculate progress percentage (0-100)
  const progressPercent = Math.min(100, (currentStage / ANALYSIS_STAGES.length) * 100)

  // Get current stage info
  const stage = ANALYSIS_STAGES.find(s => s.id === currentStage) || ANALYSIS_STAGES[0]

  if (!isAnalyzing) return null

  return (
    <div className={cn(
      "w-full bg-white rounded-xl shadow-lg p-6 border border-gray-200",
      className
    )}>
      {/* Header with icon and stage title */}
      <div className="flex items-center gap-3 mb-4">
        <Activity className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {stage.title}
        </h3>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-green-600 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Subtitle */}
      <p className="text-sm text-gray-500">
        Analyzing your shooting biomechanics...
      </p>

      {/* Stage counter */}
      <p className="text-xs text-gray-400 mt-2">
        Step {currentStage} of {ANALYSIS_STAGES.length}
      </p>
    </div>
  )
}

// Hook to manage analysis progress state
export function useAnalysisProgress() {
  const [currentStage, setCurrentStage] = React.useState(0)
  const [isAnalyzing, setIsAnalyzing] = React.useState(false)

  const startAnalysis = React.useCallback(() => {
    setCurrentStage(0)
    setIsAnalyzing(true)
  }, [])

  const advanceStage = React.useCallback(() => {
    setCurrentStage(prev => prev + 1)
  }, [])

  const completeAnalysis = React.useCallback(() => {
    setCurrentStage(ANALYSIS_STAGES.length + 1)
    setIsAnalyzing(false)
  }, [])

  const resetProgress = React.useCallback(() => {
    setCurrentStage(0)
    setIsAnalyzing(false)
  }, [])

  return {
    currentStage,
    isAnalyzing,
    startAnalysis,
    advanceStage,
    completeAnalysis,
    resetProgress,
    setCurrentStage,
  }
}

