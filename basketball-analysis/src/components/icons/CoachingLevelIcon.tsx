/**
 * Coaching Level Icon Component
 * 
 * Displays the appropriate coaching level icon based on tier.
 * Uses star-based visual system (1-5 stars).
 */

import React from "react"
import { CoachingTier } from "@/stores/profileStore"
import {
  ElementaryLevelIcon,
  MiddleSchoolLevelIcon,
  HighSchoolLevelIcon,
  CollegeLevelIcon,
  ProfessionalLevelIcon,
  IconSize,
  IconColor,
  IconProps,
} from "./IconSystem"

interface CoachingLevelIconProps {
  tier: CoachingTier
  size?: IconSize
  showLabel?: boolean
  className?: string
}

const TIER_CONFIG: Record<CoachingTier, {
  icon: React.FC<IconProps>
  label: string
  description: string
  ageRange: string
}> = {
  elementary: {
    icon: ElementaryLevelIcon,
    label: "Elementary",
    description: "Fun & Fundamentals",
    ageRange: "Ages 6-11",
  },
  middle_school: {
    icon: MiddleSchoolLevelIcon,
    label: "Middle School",
    description: "Building Skills",
    ageRange: "Ages 12-14",
  },
  high_school: {
    icon: HighSchoolLevelIcon,
    label: "High School",
    description: "Competitive Focus",
    ageRange: "Ages 15-18",
  },
  college: {
    icon: CollegeLevelIcon,
    label: "College",
    description: "Elite Development",
    ageRange: "Ages 19-22",
  },
  professional: {
    icon: ProfessionalLevelIcon,
    label: "Professional",
    description: "Peak Performance",
    ageRange: "Ages 23+",
  },
}

export const CoachingLevelIcon: React.FC<CoachingLevelIconProps> = ({
  tier,
  size = "md",
  showLabel = false,
  className = "",
}) => {
  const config = TIER_CONFIG[tier]
  const IconComponent = config.icon

  if (!showLabel) {
    return (
      <IconComponent 
        size={size} 
        color="primary" 
        className={className}
        aria-label={`${config.label} level`}
      />
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <IconComponent size={size} color="primary" />
      <span className="text-sm font-medium text-blue-700">
        {config.label}
      </span>
    </div>
  )
}

/**
 * Coaching Level Badge Component
 * A complete badge with icon, tier name, and age range
 */
interface CoachingLevelBadgeProps {
  tier: CoachingTier
  variant?: "compact" | "full"
  className?: string
}

export const CoachingLevelBadge: React.FC<CoachingLevelBadgeProps> = ({
  tier,
  variant = "compact",
  className = "",
}) => {
  const config = TIER_CONFIG[tier]
  const IconComponent = config.icon

  if (variant === "compact") {
    return (
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-1.5 
          bg-blue-50 rounded-full border border-blue-100
          ${className}
        `}
      >
        <IconComponent size="sm" color="primary" />
        <span className="text-sm font-medium text-blue-700">
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div 
      className={`
        flex items-center gap-3 p-4 
        bg-blue-50 rounded-lg border border-blue-100
        ${className}
      `}
    >
      <div className="flex-shrink-0">
        <IconComponent size="lg" color="primary" />
      </div>
      <div>
        <h4 className="font-semibold text-blue-800">
          {config.label} Level
        </h4>
        <p className="text-sm text-blue-600">
          {config.description} • {config.ageRange}
        </p>
      </div>
    </div>
  )
}

/**
 * Coaching Level Selector Component
 * For selecting coaching tier in forms
 */
interface CoachingLevelSelectorProps {
  value: CoachingTier | null
  onChange: (tier: CoachingTier) => void
  className?: string
}

export const CoachingLevelSelector: React.FC<CoachingLevelSelectorProps> = ({
  value,
  onChange,
  className = "",
}) => {
  const tiers: CoachingTier[] = [
    "elementary",
    "middle_school",
    "high_school",
    "college",
    "professional",
  ]

  return (
    <div className={`grid gap-2 ${className}`}>
      {tiers.map((tier) => {
        const config = TIER_CONFIG[tier]
        const IconComponent = config.icon
        const isSelected = value === tier

        return (
          <button
            key={tier}
            type="button"
            onClick={() => onChange(tier)}
            className={`
              flex items-center gap-3 p-3 rounded-lg border-2 transition-all
              ${isSelected
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-blue-200 hover:bg-gray-50"
              }
            `}
            aria-pressed={isSelected}
          >
            <IconComponent 
              size="md" 
              color={isSelected ? "primary" : "neutral"}
            />
            <div className="text-left">
              <p className={`font-medium ${isSelected ? "text-blue-700" : "text-gray-700"}`}>
                {config.label}
              </p>
              <p className="text-xs text-gray-500">
                {config.ageRange}
              </p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: CoachingTier) {
  return TIER_CONFIG[tier]
}

/**
 * Get tier from age
 */
export function getTierFromAge(age: number): CoachingTier {
  if (age <= 11) return "elementary"
  if (age <= 14) return "middle_school"
  if (age <= 18) return "high_school"
  if (age <= 22) return "college"
  return "professional"
}

export default CoachingLevelIcon


