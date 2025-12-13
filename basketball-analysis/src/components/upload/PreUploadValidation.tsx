"use client"

import React from "react"
import { motion } from "framer-motion"
import {
  GoodFormIcon,
  CriticalIssueIcon,
  NeedsImprovementIcon,
} from "@/components/icons"
import type { PreUploadValidation as PreUploadValidationType } from "@/lib/upload"

// ==========================================
// COMPONENT
// ==========================================

interface PreUploadValidationProps {
  validation: PreUploadValidationType & { overallValid: boolean }
  isLoading?: boolean
}

export function PreUploadValidationDisplay({
  validation,
  isLoading = false,
}: PreUploadValidationProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-600">Validating upload...</span>
        </div>
      </div>
    )
  }

  const checks = [
    {
      id: "format",
      label: "File Format",
      ...validation.fileFormat,
    },
    {
      id: "size",
      label: "File Size",
      valid: validation.fileSize.valid,
      message: `${validation.fileSize.actualSize} ${validation.fileSize.valid ? "✓" : `(max ${validation.fileSize.valid ? "" : "exceeded"})`}`,
    },
    ...(validation.duration
      ? [
          {
            id: "duration",
            label: "Duration",
            valid: validation.duration.valid,
            message: `${validation.duration.actualDuration.toFixed(1)}s ${validation.duration.valid ? "✓" : "(must be 2-10s)"}`,
          },
        ]
      : []),
    ...(validation.imageCount
      ? [
          {
            id: "count",
            label: "Image Count",
            valid: validation.imageCount.valid,
            message: `${validation.imageCount.actualCount} images ${validation.imageCount.valid ? "✓" : "(need 3-7)"}`,
          },
        ]
      : []),
    {
      id: "resolution",
      label: "Resolution",
      valid: validation.resolution.valid,
      message: `${validation.resolution.width}x${validation.resolution.height} ${validation.resolution.valid ? "✓" : "(too low)"}`,
    },
  ]

  return (
    <div
      className={`
        rounded-xl border p-4 transition-colors
        ${validation.overallValid
          ? "bg-green-50 border-green-200"
          : "bg-red-50 border-red-200"
        }
      `}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        {validation.overallValid ? (
          <>
            <GoodFormIcon size="md" color="success" />
            <span className="font-medium text-green-700">All checks passed</span>
          </>
        ) : (
          <>
            <CriticalIssueIcon size="md" color="critical" />
            <span className="font-medium text-red-700">Some checks failed</span>
          </>
        )}
      </div>

      {/* Check List */}
      <div className="space-y-2">
        {checks.map((check, index) => (
          <motion.div
            key={check.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-600">{check.label}</span>
            <div className="flex items-center gap-1.5">
              <span className={check.valid ? "text-green-600" : "text-red-600"}>
                {check.message}
              </span>
              {check.valid ? (
                <GoodFormIcon size="sm" color="success" />
              ) : (
                <CriticalIssueIcon size="sm" color="critical" />
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ==========================================
// INLINE VERSION (for smaller spaces)
// ==========================================

interface InlineValidationProps {
  valid: boolean
  message: string
  showIcon?: boolean
}

export function InlineValidation({ valid, message, showIcon = true }: InlineValidationProps) {
  return (
    <div
      className={`
        inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full
        ${valid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}
      `}
    >
      {showIcon && (
        valid ? (
          <GoodFormIcon size="sm" color="success" />
        ) : (
          <CriticalIssueIcon size="sm" color="critical" />
        )
      )}
      {message}
    </div>
  )
}

export default PreUploadValidationDisplay


