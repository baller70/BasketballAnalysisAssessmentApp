/**
 * Form Metric Icon Component
 * 
 * Displays form mechanics icons with status coloring.
 * Used in analysis results to show specific body mechanics.
 */

import React from "react"
import {
  ElbowAlignmentIcon,
  ReleasePointIcon,
  FootworkIcon,
  FollowThroughIcon,
  BalanceIcon,
  KneeBendIcon,
  EyePositionIcon,
  ShoulderAlignmentIcon,
  CoreRotationIcon,
  WristAngleIcon,
  IconSize,
  IconColor,
} from "./IconSystem"

export type FormMetricType = 
  | "elbow"
  | "release"
  | "footwork"
  | "followThrough"
  | "balance"
  | "knee"
  | "eye"
  | "shoulder"
  | "core"
  | "wrist"

export type MetricStatus = "optimal" | "good" | "warning" | "critical"

interface FormMetricIconProps {
  metric: FormMetricType
  status?: MetricStatus
  size?: IconSize
  className?: string
}

const METRIC_ICONS: Record<FormMetricType, React.FC<{ size?: IconSize; color?: IconColor; className?: string }>> = {
  elbow: ElbowAlignmentIcon,
  release: ReleasePointIcon,
  footwork: FootworkIcon,
  followThrough: FollowThroughIcon,
  balance: BalanceIcon,
  knee: KneeBendIcon,
  eye: EyePositionIcon,
  shoulder: ShoulderAlignmentIcon,
  core: CoreRotationIcon,
  wrist: WristAngleIcon,
}

const METRIC_LABELS: Record<FormMetricType, string> = {
  elbow: "Elbow Alignment",
  release: "Release Point",
  footwork: "Footwork",
  followThrough: "Follow-Through",
  balance: "Balance",
  knee: "Knee Bend",
  eye: "Eye Position",
  shoulder: "Shoulder Alignment",
  core: "Core Rotation",
  wrist: "Wrist Angle",
}

const STATUS_COLOR_MAP: Record<MetricStatus, IconColor> = {
  optimal: "success",
  good: "success",
  warning: "warning",
  critical: "critical",
}

export const FormMetricIcon: React.FC<FormMetricIconProps> = ({
  metric,
  status = "neutral" as MetricStatus,
  size = "lg",
  className = "",
}) => {
  const IconComponent = METRIC_ICONS[metric]
  const color = status ? STATUS_COLOR_MAP[status] : "neutral"

  return (
    <IconComponent
      size={size}
      color={color}
      className={className}
      aria-label={METRIC_LABELS[metric]}
    />
  )
}

/**
 * Form Metric Card Component
 * Displays a complete metric with icon, label, value, and status
 */
interface FormMetricCardProps {
  metric: FormMetricType
  value: number
  unit: string
  target: number
  status: MetricStatus
  note?: string
  className?: string
}

export const FormMetricCard: React.FC<FormMetricCardProps> = ({
  metric,
  value,
  unit,
  target,
  status,
  note,
  className = "",
}) => {
  const statusColors = {
    optimal: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-700",
    },
    good: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-600",
    },
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      text: "text-orange-700",
    },
    critical: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-700",
    },
  }

  const colors = statusColors[status]

  return (
    <div 
      className={`
        rounded-lg border p-4 
        ${colors.bg} ${colors.border} ${className}
      `}
    >
      {/* Header with Icon and Metric Name */}
      <div className="flex items-start gap-3 mb-3">
        <FormMetricIcon metric={metric} status={status} size="lg" />
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900">
            {METRIC_LABELS[metric]}
          </h4>
          <p className={`text-sm ${colors.text}`}>
            {status === "optimal" && "Optimal"}
            {status === "good" && "Good"}
            {status === "warning" && "Needs Improvement"}
            {status === "critical" && "Critical Issue"}
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="grid grid-cols-2 gap-4 mb-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Current</p>
          <p className="text-lg font-bold text-gray-900">
            {value}{unit}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Target</p>
          <p className="text-lg font-medium text-gray-600">
            {target}{unit}
          </p>
        </div>
      </div>

      {/* Coach's Note */}
      {note && (
        <div className="pt-3 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Coach&apos;s Insight:</span> {note}
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Get metric label by type
 */
export function getMetricLabel(metric: FormMetricType): string {
  return METRIC_LABELS[metric]
}

/**
 * Get status from deviation percentage
 */
export function getStatusFromDeviation(deviation: number): MetricStatus {
  if (deviation <= 5) return "optimal"
  if (deviation <= 15) return "good"
  if (deviation <= 25) return "warning"
  return "critical"
}

export default FormMetricIcon







