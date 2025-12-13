"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  ExcellentFormIcon,
  NeedsImprovementIcon,
  CriticalIssueIcon,
  GoodFormIcon,
  RefreshIcon,
  PlayIcon,
} from "@/components/icons"
import type {
  UploadQualityResult,
  QualityScoreBreakdown,
  ValidationStatus,
} from "@/lib/upload"

// ==========================================
// MAIN COMPONENT
// ==========================================

interface UploadQualityScoreProps {
  result: UploadQualityResult
  onProceed?: () => void
  onRetake?: () => void
  showDetails?: boolean
}

export function UploadQualityScore({
  result,
  onProceed,
  onRetake,
  showDetails = true,
}: UploadQualityScoreProps) {
  const { totalScore, breakdown, status, feedback, canProceed } = result

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Score */}
      <div
        className={`
          px-6 py-5 text-white
          ${status === "approved" && "bg-gradient-to-r from-green-500 to-green-600"}
          ${status === "acceptable" && "bg-gradient-to-r from-yellow-500 to-yellow-600"}
          ${status === "rejected" && "bg-gradient-to-r from-red-500 to-red-600"}
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StatusIcon status={status} />
            <div>
              <h3 className="text-lg font-bold">{feedback.title}</h3>
              <p className="text-white/80 text-sm">{feedback.message}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">{totalScore}</div>
            <div className="text-sm text-white/80">/100</div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      {showDetails && (
        <div className="px-6 py-4 border-b border-gray-100">
          <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Score Breakdown
          </h4>
          <div className="space-y-3">
            <ScoreBar label="Framing" score={breakdown.framing} maxScore={25} />
            <ScoreBar label="Lighting" score={breakdown.lighting} maxScore={25} />
            <ScoreBar label="Clarity" score={breakdown.clarity} maxScore={25} />
            <ScoreBar label="Angle" score={breakdown.angle} maxScore={25} />
          </div>
        </div>
      )}

      {/* Issues and Tips */}
      {(feedback.issues.length > 0 || feedback.tips.length > 0) && (
        <div className="px-6 py-4 border-b border-gray-100">
          {feedback.issues.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Issues Found
              </h4>
              <ul className="space-y-1">
                {feedback.issues.map((issue, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                    <NeedsImprovementIcon size="sm" color="warning" />
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {feedback.tips.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                Tips to Improve
              </h4>
              <ul className="space-y-1">
                {feedback.tips.map((tip, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-blue-500">💡</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-6 py-4 bg-gray-50 flex items-center justify-between gap-4">
        {onRetake && (
          <button
            onClick={onRetake}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RefreshIcon size="sm" color="neutral" />
            Retake
          </button>
        )}

        {onProceed && (
          <button
            onClick={onProceed}
            disabled={!canProceed}
            className={`
              flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all
              ${canProceed
                ? status === "approved"
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }
            `}
          >
            {status === "approved" ? (
              <>
                <PlayIcon size="sm" color="current" />
                Analyze My Shot
              </>
            ) : canProceed ? (
              <>
                <NeedsImprovementIcon size="sm" color="current" />
                Proceed Anyway
              </>
            ) : (
              <>
                <CriticalIssueIcon size="sm" color="current" />
                Cannot Proceed
              </>
            )}
          </button>
        )}
      </div>

      {/* Disclaimer for acceptable uploads */}
      {status === "acceptable" && canProceed && (
        <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-100">
          <p className="text-xs text-yellow-700 text-center">
            Analysis may be less accurate due to upload quality. For best results, please retake following the guidelines.
          </p>
        </div>
      )}
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface StatusIconProps {
  status: ValidationStatus
}

function StatusIcon({ status }: StatusIconProps) {
  const size = "lg"
  
  switch (status) {
    case "approved":
      return (
        <div className="p-2 bg-white/20 rounded-full">
          <ExcellentFormIcon size={size} color="current" />
        </div>
      )
    case "acceptable":
      return (
        <div className="p-2 bg-white/20 rounded-full">
          <NeedsImprovementIcon size={size} color="current" />
        </div>
      )
    case "rejected":
      return (
        <div className="p-2 bg-white/20 rounded-full">
          <CriticalIssueIcon size={size} color="current" />
        </div>
      )
  }
}

interface ScoreBarProps {
  label: string
  score: number
  maxScore: number
}

function ScoreBar({ label, score, maxScore }: ScoreBarProps) {
  const percentage = (score / maxScore) * 100
  
  let barColor = "bg-green-500"
  if (percentage < 60) barColor = "bg-red-500"
  else if (percentage < 80) barColor = "bg-yellow-500"
  
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-gray-600">{label}</span>
        <span className="font-medium text-gray-900">{score}/{maxScore}</span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </div>
  )
}

// ==========================================
// COMPACT VERSION
// ==========================================

interface CompactQualityScoreProps {
  score: number
  status: ValidationStatus
  onClick?: () => void
}

export function CompactQualityScore({ score, status, onClick }: CompactQualityScoreProps) {
  const bgColor = {
    approved: "bg-green-100 text-green-700 border-green-200",
    acceptable: "bg-yellow-100 text-yellow-700 border-yellow-200",
    rejected: "bg-red-100 text-red-700 border-red-200",
  }[status]
  
  const Icon = {
    approved: GoodFormIcon,
    acceptable: NeedsImprovementIcon,
    rejected: CriticalIssueIcon,
  }[status]
  
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-medium
        ${bgColor}
        ${onClick ? "hover:opacity-80 cursor-pointer" : ""}
      `}
    >
      <Icon size="sm" color="current" />
      Quality: {score}/100
    </button>
  )
}

export default UploadQualityScore


