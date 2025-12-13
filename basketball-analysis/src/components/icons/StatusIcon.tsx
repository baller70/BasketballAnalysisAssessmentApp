/**
 * Status Icon Component
 * 
 * A convenience component for displaying status-based icons
 * with appropriate colors based on the status type.
 */

import React from "react"
import {
  ExcellentFormIcon,
  GoodFormIcon,
  NeedsImprovementIcon,
  CriticalIssueIcon,
  ImprovingIcon,
  IconSize,
  IconColor,
  IconProps,
} from "./IconSystem"

export type StatusType = "excellent" | "good" | "warning" | "critical" | "improving"

interface StatusIconProps {
  status: StatusType
  size?: IconSize
  className?: string
  showLabel?: boolean
  labelPosition?: "right" | "bottom"
}

// Status color type (subset of IconColor for status indicators)
type StatusColor = "success" | "warning" | "critical"

const STATUS_CONFIG: Record<StatusType, {
  icon: React.FC<IconProps>
  color: StatusColor
  label: string
}> = {
  excellent: {
    icon: ExcellentFormIcon,
    color: "success",
    label: "Excellent",
  },
  good: {
    icon: GoodFormIcon,
    color: "success",
    label: "Good",
  },
  warning: {
    icon: NeedsImprovementIcon,
    color: "warning",
    label: "Needs Improvement",
  },
  critical: {
    icon: CriticalIssueIcon,
    color: "critical",
    label: "Critical Issue",
  },
  improving: {
    icon: ImprovingIcon,
    color: "success",
    label: "Improving",
  },
}

// CSS class mapping for label colors
const LABEL_COLOR_MAP: Record<StatusColor, string> = {
  success: "text-green-600",
  warning: "text-yellow-600",
  critical: "text-red-600",
}

// CSS class mapping for badge backgrounds
const BG_COLOR_MAP: Record<StatusColor, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-700",
  critical: "bg-red-100 text-red-700",
}

export const StatusIcon: React.FC<StatusIconProps> = ({
  status,
  size = "md",
  className = "",
  showLabel = false,
  labelPosition = "right",
}) => {
  const config = STATUS_CONFIG[status]
  const IconComponent = config.icon

  if (!showLabel) {
    return <IconComponent size={size} color={config.color} className={className} />
  }

  const labelColorClass = LABEL_COLOR_MAP[config.color]

  if (labelPosition === "bottom") {
    return (
      <div className={`flex flex-col items-center gap-1 ${className}`}>
        <IconComponent size={size} color={config.color} />
        <span className={`text-xs font-medium ${labelColorClass}`}>
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconComponent size={size} color={config.color} />
      <span className={`text-sm font-medium ${labelColorClass}`}>
        {config.label}
      </span>
    </div>
  )
}

/**
 * Get status from a numeric score
 */
export function getStatusFromScore(score: number): StatusType {
  if (score >= 90) return "excellent"
  if (score >= 75) return "good"
  if (score >= 50) return "warning"
  return "critical"
}

/**
 * Status Badge Component
 * A compact badge showing status with background color
 */
interface StatusBadgeProps {
  status: StatusType
  size?: "sm" | "md" | "lg"
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = "md",
  className = "",
}) => {
  const config = STATUS_CONFIG[status]
  
  const bgColorClass = BG_COLOR_MAP[config.color]

  const sizeClass = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base",
  }[size]

  return (
    <span 
      className={`
        inline-flex items-center gap-1.5 rounded-full font-medium
        ${bgColorClass} ${sizeClass} ${className}
      `}
    >
      <config.icon size="sm" color={config.color} />
      {config.label}
    </span>
  )
}

export default StatusIcon


