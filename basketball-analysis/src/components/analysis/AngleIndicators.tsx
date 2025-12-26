"use client"

import React from "react"

/**
 * AngleIndicators Component
 * 
 * Displays visual angle measurements for basketball shooting form.
 * Shows optimal ranges and current values with color coding.
 */

export interface AngleData {
  name: string
  value: number
  optimalMin: number
  optimalMax: number
  unit?: string
}

interface AngleIndicatorsProps {
  angles: AngleData[]
  layout?: "horizontal" | "vertical" | "grid"
  showOptimalRange?: boolean
  compact?: boolean
  className?: string
}

// Optimal ranges for basketball shooting
export const SHOOTING_ANGLES: Record<string, { min: number; max: number; label: string }> = {
  elbow: { min: 85, max: 95, label: "Elbow Angle" },
  knee: { min: 110, max: 130, label: "Knee Bend" },
  wrist: { min: 45, max: 90, label: "Wrist Angle" },
  shoulder: { min: 0, max: 10, label: "Shoulder Alignment" },
  hip: { min: 155, max: 175, label: "Hip Angle" },
  release: { min: 48, max: 58, label: "Release Angle" },
}

function getAngleStatus(value: number, min: number, max: number): "optimal" | "close" | "needs_work" {
  if (value >= min && value <= max) return "optimal"
  
  const deviation = value < min ? min - value : value - max
  if (deviation <= 10) return "close"
  
  return "needs_work"
}

function getStatusColor(status: "optimal" | "close" | "needs_work"): string {
  switch (status) {
    case "optimal": return "text-green-500"
    case "close": return "text-orange-500"
    case "needs_work": return "text-red-500"
  }
}

function getStatusBgColor(status: "optimal" | "close" | "needs_work"): string {
  switch (status) {
    case "optimal": return "bg-green-500/20 border-green-500/50"
    case "close": return "bg-orange-500/20 border-orange-500/50"
    case "needs_work": return "bg-red-500/20 border-red-500/50"
  }
}

function getStatusIcon(status: "optimal" | "close" | "needs_work"): string {
  switch (status) {
    case "optimal": return "✓"
    case "close": return "~"
    case "needs_work": return "!"
  }
}

export function AngleIndicators({
  angles,
  layout = "horizontal",
  showOptimalRange = true,
  compact = false,
  className = "",
}: AngleIndicatorsProps) {
  const layoutClass = {
    horizontal: "flex flex-row flex-wrap gap-4",
    vertical: "flex flex-col gap-3",
    grid: "grid grid-cols-2 md:grid-cols-3 gap-4",
  }[layout]

  return (
    <div className={`${layoutClass} ${className}`}>
      {angles.map((angle) => {
        const status = getAngleStatus(angle.value, angle.optimalMin, angle.optimalMax)
        const statusColor = getStatusColor(status)
        const statusBg = getStatusBgColor(status)
        const statusIcon = getStatusIcon(status)

        if (compact) {
          return (
            <div
              key={angle.name}
              className={`px-3 py-2 rounded-lg border ${statusBg} flex items-center gap-2`}
            >
              <span className={`font-bold ${statusColor}`}>{statusIcon}</span>
              <span className="text-sm text-gray-300">{angle.name}</span>
              <span className={`font-mono font-bold ${statusColor}`}>
                {angle.value.toFixed(1)}°
              </span>
            </div>
          )
        }

        return (
          <AngleCard
            key={angle.name}
            angle={angle}
            status={status}
            showOptimalRange={showOptimalRange}
          />
        )
      })}
    </div>
  )
}

interface AngleCardProps {
  angle: AngleData
  status: "optimal" | "close" | "needs_work"
  showOptimalRange: boolean
}

function AngleCard({ angle, status, showOptimalRange }: AngleCardProps) {
  const statusColor = getStatusColor(status)
  const statusBg = getStatusBgColor(status)

  // Calculate position on scale (0-100%)
  const scaleMin = Math.min(angle.optimalMin - 20, angle.value - 10)
  const scaleMax = Math.max(angle.optimalMax + 20, angle.value + 10)
  const range = scaleMax - scaleMin
  
  const valuePosition = ((angle.value - scaleMin) / range) * 100
  const optimalStartPosition = ((angle.optimalMin - scaleMin) / range) * 100
  const optimalWidth = ((angle.optimalMax - angle.optimalMin) / range) * 100

  return (
    <div className={`p-4 rounded-xl border ${statusBg} min-w-[180px]`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <span className="text-sm font-medium text-gray-300">{angle.name}</span>
        <span className={`text-xs px-2 py-0.5 rounded ${statusBg} ${statusColor} font-medium`}>
          {status === "optimal" ? "Optimal" : status === "close" ? "Close" : "Adjust"}
        </span>
      </div>

      {/* Value */}
      <div className={`text-3xl font-bold ${statusColor} mb-3`}>
        {angle.value.toFixed(1)}
        <span className="text-lg">°</span>
      </div>

      {/* Visual Scale */}
      <div className="relative h-2 bg-gray-700 rounded-full mb-2">
        {/* Optimal range indicator */}
        <div
          className="absolute h-full bg-green-500/40 rounded-full"
          style={{
            left: `${optimalStartPosition}%`,
            width: `${optimalWidth}%`,
          }}
        />
        {/* Current value marker */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-white ${
            status === "optimal" ? "bg-green-500" : status === "close" ? "bg-orange-500" : "bg-red-500"
          }`}
          style={{ left: `calc(${valuePosition}% - 6px)` }}
        />
      </div>

      {/* Optimal range text */}
      {showOptimalRange && (
        <div className="text-xs text-gray-400 flex justify-between">
          <span>Optimal: {angle.optimalMin}°-{angle.optimalMax}°</span>
          {status !== "optimal" && (
            <span className={statusColor}>
              {angle.value < angle.optimalMin 
                ? `+${(angle.optimalMin - angle.value).toFixed(0)}°`
                : `-${(angle.value - angle.optimalMax).toFixed(0)}°`
              }
            </span>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Single angle indicator for inline use
 */
export function SingleAngleIndicator({
  label,
  value,
  optimalMin,
  optimalMax,
  size = "md",
}: {
  label: string
  value: number
  optimalMin: number
  optimalMax: number
  size?: "sm" | "md" | "lg"
}) {
  const status = getAngleStatus(value, optimalMin, optimalMax)
  const statusColor = getStatusColor(status)

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }

  return (
    <div className={`flex items-center gap-2 ${sizeClasses[size]}`}>
      <span className="text-gray-400">{label}:</span>
      <span className={`font-bold ${statusColor}`}>
        {value.toFixed(1)}°
      </span>
      <span className="text-xs text-gray-500">
        ({optimalMin}°-{optimalMax}°)
      </span>
    </div>
  )
}

/**
 * Helper to convert raw angle values to AngleData array
 */
export function createAngleDataFromMeasurements(measurements: {
  elbowAngle?: number
  kneeAngle?: number
  wristAngle?: number
  shoulderAngle?: number
  hipAngle?: number
  releaseAngle?: number
}): AngleData[] {
  const result: AngleData[] = []

  if (measurements.elbowAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.elbow.label,
      value: measurements.elbowAngle,
      optimalMin: SHOOTING_ANGLES.elbow.min,
      optimalMax: SHOOTING_ANGLES.elbow.max,
    })
  }

  if (measurements.kneeAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.knee.label,
      value: measurements.kneeAngle,
      optimalMin: SHOOTING_ANGLES.knee.min,
      optimalMax: SHOOTING_ANGLES.knee.max,
    })
  }

  if (measurements.wristAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.wrist.label,
      value: measurements.wristAngle,
      optimalMin: SHOOTING_ANGLES.wrist.min,
      optimalMax: SHOOTING_ANGLES.wrist.max,
    })
  }

  if (measurements.shoulderAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.shoulder.label,
      value: measurements.shoulderAngle,
      optimalMin: SHOOTING_ANGLES.shoulder.min,
      optimalMax: SHOOTING_ANGLES.shoulder.max,
    })
  }

  if (measurements.hipAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.hip.label,
      value: measurements.hipAngle,
      optimalMin: SHOOTING_ANGLES.hip.min,
      optimalMax: SHOOTING_ANGLES.hip.max,
    })
  }

  if (measurements.releaseAngle !== undefined) {
    result.push({
      name: SHOOTING_ANGLES.release.label,
      value: measurements.releaseAngle,
      optimalMin: SHOOTING_ANGLES.release.min,
      optimalMax: SHOOTING_ANGLES.release.max,
    })
  }

  return result
}





