/**
 * Professional Icon System
 * 
 * A comprehensive SVG icon library for the Basketball Analysis Tool.
 * Uses minimalist, line-based icons (2px stroke weight) for a professional look.
 * 
 * IMPORTANT: These are professional icons, NOT emojis.
 * Icons create a credible, trustworthy appearance.
 */

import React from "react"

// ==========================================
// TYPES
// ==========================================

export type IconSize = "sm" | "md" | "lg" | "xl"
export type IconColor = "primary" | "success" | "warning" | "critical" | "neutral" | "current"

export interface IconProps {
  size?: IconSize
  color?: IconColor
  className?: string
  "aria-label"?: string
}

// ==========================================
// SIZE AND COLOR MAPPINGS
// ==========================================

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 48,
}

const COLOR_MAP: Record<IconColor, string> = {
  primary: "#1E40AF",
  success: "#16A34A",
  warning: "#EAB308",
  critical: "#DC2626",
  neutral: "#6B7280",
  current: "currentColor",
}

// ==========================================
// BASE ICON COMPONENT
// ==========================================

interface BaseIconProps extends IconProps {
  children: React.ReactNode
  viewBox?: string
}

const BaseIcon: React.FC<BaseIconProps> = ({
  size = "md",
  color = "current",
  className = "",
  children,
  viewBox = "0 0 24 24",
  "aria-label": ariaLabel,
}) => {
  const pixelSize = SIZE_MAP[size]
  const fillColor = COLOR_MAP[color]

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox={viewBox}
      fill="none"
      stroke={fillColor}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      role="img"
    >
      {children}
    </svg>
  )
}

// ==========================================
// CATEGORY 1: NAVIGATION ICONS
// ==========================================

export const HomeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Home"}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </BaseIcon>
)

export const CameraIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Camera - Upload image"}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="4" />
    <line x1="12" y1="10" x2="12" y2="16" />
    <line x1="9" y1="13" x2="15" y2="13" />
  </BaseIcon>
)

export const AnalysisIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Analysis"}>
    <line x1="18" y1="20" x2="18" y2="10" />
    <line x1="12" y1="20" x2="12" y2="4" />
    <line x1="6" y1="20" x2="6" y2="14" />
  </BaseIcon>
)

export const ProgressIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Progress"}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </BaseIcon>
)

export const ProfileIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Profile"}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 2: FORM MECHANICS ICONS
// ==========================================

export const ElbowAlignmentIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Elbow alignment"}>
    <path d="M12 3v6" />
    <path d="M12 9l6 6" />
    <circle cx="12" cy="9" r="2" />
    <path d="M18 15l-3 3" />
  </BaseIcon>
)

export const ReleasePointIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Release point"}>
    <circle cx="12" cy="6" r="3" />
    <path d="M12 9v3" />
    <path d="M8 15l4 4 4-4" />
    <path d="M9 12h6" />
  </BaseIcon>
)

export const FootworkIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Footwork"}>
    <ellipse cx="8" cy="18" rx="3" ry="4" />
    <ellipse cx="16" cy="18" rx="3" ry="4" />
    <path d="M8 14v-2" />
    <path d="M16 14v-2" />
  </BaseIcon>
)

export const FollowThroughIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Follow-through"}>
    <path d="M12 19v-6" />
    <path d="M12 13l-4-8" />
    <path d="M8 5l4 2" />
    <path d="M12 7l4-2" />
    <path d="M16 5l-4 8" />
    <circle cx="12" cy="3" r="2" />
  </BaseIcon>
)

export const BalanceIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Balance"}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <path d="M8 11h8" />
    <path d="M10 11l-2 10" />
    <path d="M14 11l2 10" />
    <path d="M6 21h4" />
    <path d="M14 21h4" />
  </BaseIcon>
)

export const KneeBendIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Knee bend"}>
    <path d="M12 3v5" />
    <circle cx="12" cy="10" r="2" />
    <path d="M12 12l-4 5" />
    <path d="M8 17l2 4" />
  </BaseIcon>
)

export const EyePositionIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Eye position"}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <path d="M17 6l-3 4" />
  </BaseIcon>
)

export const ShoulderAlignmentIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Shoulder alignment"}>
    <circle cx="12" cy="5" r="2" />
    <path d="M4 11h16" />
    <path d="M8 11v-2" />
    <path d="M16 11v-2" />
    <path d="M12 7v4" />
    <path d="M12 11v6" />
  </BaseIcon>
)

export const CoreRotationIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Core rotation"}>
    <ellipse cx="12" cy="12" rx="6" ry="8" />
    <path d="M12 4v16" />
    <path d="M6 9c2 1 4 1 6 0s4-1 6 0" />
    <path d="M6 15c2-1 4-1 6 0s4 1 6 0" />
  </BaseIcon>
)

export const WristAngleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Wrist angle"}>
    <path d="M4 12h8" />
    <path d="M12 12l4-6" />
    <circle cx="12" cy="12" r="2" />
    <path d="M16 6l2 1" />
    <path d="M16 6l1-2" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 3: PERFORMANCE METRICS ICONS
// ==========================================

export const AccuracyIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Accuracy"}>
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </BaseIcon>
)

export const ImprovementTrendIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Improvement trend"}>
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
    <polyline points="17 6 23 6 23 12" />
  </BaseIcon>
)

export const RegressionIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Regression"}>
    <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
    <polyline points="17 18 23 18 23 12" />
  </BaseIcon>
)

export const ReleaseTimingIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Release timing"}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </BaseIcon>
)

export const ArcTrajectoryIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Arc trajectory"}>
    <circle cx="5" cy="17" r="2" />
    <path d="M5 15c0-6 6-10 14-10" />
    <polyline points="15 5 19 5 19 9" />
  </BaseIcon>
)

export const ConsistencyIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Consistency"}>
    <polyline points="4 13 9 13 9 8" />
    <polyline points="9 13 14 13 14 8" />
    <polyline points="14 13 19 13 19 8" />
    <path d="M6 17h12" />
  </BaseIcon>
)

export const ComparisonIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Comparison"}>
    <polyline points="17 1 21 5 17 9" />
    <path d="M3 5h18" />
    <polyline points="7 15 3 19 7 23" />
    <path d="M21 19H3" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 4: STATUS ICONS
// ==========================================

export const ExcellentFormIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Excellent form"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </BaseIcon>
)

export const GoodFormIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Good form"}>
    <polyline points="20 6 9 17 4 12" />
  </BaseIcon>
)

export const NeedsImprovementIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Needs improvement"}>
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </BaseIcon>
)

export const CriticalIssueIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Critical issue"}>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </BaseIcon>
)

export const ImprovingIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Improving"}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="16 12 12 8 8 12" />
    <line x1="12" y1="16" x2="12" y2="8" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 5: COACHING LEVEL ICONS
// ==========================================

export const ElementaryLevelIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Elementary level"}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </BaseIcon>
)

export const MiddleSchoolLevelIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Middle school level"}>
    <polygon points="8 2 10.5 7 16 7.5 12 11.5 13 17 8 14 3 17 4 11.5 0 7.5 5.5 7 8 2" />
    <polygon points="18 6 19.5 9 23 9.3 20.5 11.8 21 15 18 13.3 15 15 15.5 11.8 13 9.3 16.5 9 18 6" />
  </BaseIcon>
)

export const HighSchoolLevelIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "High school level"}>
    <polygon points="6 2 7.8 5.8 12 6.2 9 9 9.7 13 6 11 2.3 13 3 9 0 6.2 4.2 5.8 6 2" />
    <polygon points="12 4 13.3 6.6 16 6.9 14 8.8 14.5 11.5 12 10.2 9.5 11.5 10 8.8 8 6.9 10.7 6.6 12 4" />
    <polygon points="18 2 19.8 5.8 24 6.2 21 9 21.7 13 18 11 14.3 13 15 9 12 6.2 16.2 5.8 18 2" />
  </BaseIcon>
)

export const CollegeLevelIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "College level"}>
    <polygon points="4 3 5.4 6 8.5 6.3 6.3 8.4 6.8 11.5 4 10 1.2 11.5 1.7 8.4 -0.5 6.3 2.6 6 4 3" />
    <polygon points="10 1 11.4 4 14.5 4.3 12.3 6.4 12.8 9.5 10 8 7.2 9.5 7.7 6.4 5.5 4.3 8.6 4 10 1" />
    <polygon points="16 3 17.4 6 20.5 6.3 18.3 8.4 18.8 11.5 16 10 13.2 11.5 13.7 8.4 11.5 6.3 14.6 6 16 3" />
    <polygon points="22 1 23.4 4 26.5 4.3 24.3 6.4 24.8 9.5 22 8 19.2 9.5 19.7 6.4 17.5 4.3 20.6 4 22 1" />
  </BaseIcon>
)

export const ProfessionalLevelIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Professional level"}>
    <polygon points="3 4 4.1 6.2 6.5 6.4 4.8 8 5.2 10.4 3 9.2 0.8 10.4 1.2 8 -0.5 6.4 1.9 6.2 3 4" />
    <polygon points="8 2 9.1 4.2 11.5 4.4 9.8 6 10.2 8.4 8 7.2 5.8 8.4 6.2 6 4.5 4.4 6.9 4.2 8 2" />
    <polygon points="13 4 14.1 6.2 16.5 6.4 14.8 8 15.2 10.4 13 9.2 10.8 10.4 11.2 8 9.5 6.4 11.9 6.2 13 4" />
    <polygon points="18 2 19.1 4.2 21.5 4.4 19.8 6 20.2 8.4 18 7.2 15.8 8.4 16.2 6 14.5 4.4 16.9 4.2 18 2" />
    <polygon points="23 4 24.1 6.2 26.5 6.4 24.8 8 25.2 10.4 23 9.2 20.8 10.4 21.2 8 19.5 6.4 21.9 6.2 23 4" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 6: PROFILE/ONBOARDING ICONS
// ==========================================

export const HeightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Height measurement"}>
    <path d="M12 2v20" />
    <path d="M8 4h8" />
    <path d="M8 20h8" />
    <path d="M6 8h4" />
    <path d="M14 8h4" />
    <path d="M6 12h4" />
    <path d="M14 12h4" />
    <path d="M6 16h4" />
    <path d="M14 16h4" />
  </BaseIcon>
)

export const WeightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Weight measurement"}>
    <path d="M12 3v3" />
    <circle cx="12" cy="3" r="1" />
    <path d="M5 10h14l-2 11H7L5 10z" />
    <path d="M8 10V8a4 4 0 0 1 8 0v2" />
  </BaseIcon>
)

export const WingspanIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Wingspan measurement"}>
    <path d="M2 12h20" />
    <path d="M2 12l3-3" />
    <path d="M2 12l3 3" />
    <path d="M22 12l-3-3" />
    <path d="M22 12l-3 3" />
    <circle cx="12" cy="8" r="2" />
    <path d="M12 10v4" />
  </BaseIcon>
)

export const AgeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Age"}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
    <circle cx="12" cy="16" r="2" />
  </BaseIcon>
)

export const BodyTypeIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Body type"}>
    <circle cx="12" cy="5" r="3" />
    <path d="M12 8v8" />
    <path d="M8 10l4 2 4-2" />
    <path d="M8 20l4-4 4 4" />
  </BaseIcon>
)

export const DominantHandIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Dominant hand"}>
    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
  </BaseIcon>
)

export const ShootingStyleIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Shooting style"}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <path d="M8 9l4 2 4-2" />
    <path d="M16 9l2-4" />
    <circle cx="19" cy="4" r="2" />
    <path d="M9 16l3-5 3 5" />
    <path d="M8 21l4-5 4 5" />
  </BaseIcon>
)

export const BioIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Bio"}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </BaseIcon>
)

export const AthleticAbilityIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Athletic ability"}>
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v2" />
    <path d="M9 11l3-2 3 2" />
    <path d="M7 15l5-4 5 4" />
    <path d="M5 21l7-6 7 6" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 7: ACTION ICONS
// ==========================================

export const PlayIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Play"}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </BaseIcon>
)

export const PauseIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Pause"}>
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </BaseIcon>
)

export const RefreshIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Refresh"}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </BaseIcon>
)

export const DownloadIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Download"}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </BaseIcon>
)

export const ShareIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Share"}>
    <circle cx="18" cy="5" r="3" />
    <circle cx="6" cy="12" r="3" />
    <circle cx="18" cy="19" r="3" />
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
  </BaseIcon>
)

export const SettingsIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Settings"}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </BaseIcon>
)

export const HelpIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Help"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </BaseIcon>
)

export const InfoIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Information"}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </BaseIcon>
)

export const CloseIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Close"}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </BaseIcon>
)

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Previous"}>
    <polyline points="15 18 9 12 15 6" />
  </BaseIcon>
)

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Next"}>
    <polyline points="9 18 15 12 9 6" />
  </BaseIcon>
)

export const ChevronUpIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Up"}>
    <polyline points="18 15 12 9 6 15" />
  </BaseIcon>
)

export const ChevronDownIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Down"}>
    <polyline points="6 9 12 15 18 9" />
  </BaseIcon>
)

// ==========================================
// CATEGORY 8: BASKETBALL-SPECIFIC ICONS
// ==========================================

export const BasketballIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Basketball"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </BaseIcon>
)

export const HoopIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Basketball hoop"}>
    <rect x="3" y="2" width="18" height="3" />
    <circle cx="12" cy="10" r="5" />
    <path d="M7 15v6" />
    <path d="M17 15v6" />
    <path d="M9 21h6" />
  </BaseIcon>
)

export const CourtIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Basketball court"}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <line x1="12" y1="4" x2="12" y2="20" />
    <circle cx="12" cy="12" r="3" />
  </BaseIcon>
)

export const DrillIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Drill"}>
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
    <path d="M16 16l2 2" />
    <path d="M8 16l-2 2" />
  </BaseIcon>
)

export const CoachIcon: React.FC<IconProps> = (props) => (
  <BaseIcon {...props} aria-label={props["aria-label"] || "Coach"}>
    <circle cx="12" cy="7" r="4" />
    <path d="M5.5 21a8.38 8.38 0 0 1 13 0" />
    <path d="M3 14h2l2 3" />
    <path d="M21 14h-2l-2 3" />
  </BaseIcon>
)


