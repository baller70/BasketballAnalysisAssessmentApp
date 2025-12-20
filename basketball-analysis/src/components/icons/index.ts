/**
 * @file index.ts (Icons)
 * @description Barrel exports for all icon components
 * 
 * MEDAL ICONS (for rankings):
 * - MedalIcon - Main medal component with tier
 * - GoldMedal, SilverMedal, BronzeMedal, CopperMedal, IronMedal
 * 
 * STATUS ICONS:
 * - StatusIcon - Good/Warning/Critical status
 * - StatusBadge - Status with label
 * 
 * FORM METRIC ICONS:
 * - FormMetricIcon - Icons for form metrics (elbow, knee, etc.)
 * - FormMetricCard - Card with metric icon and value
 * 
 * COACHING ICONS:
 * - CoachingLevelIcon - Coaching tier icons
 * - CoachingLevelBadge - Badge with tier info
 * - CoachingLevelSelector - Tier selection UI
 * 
 * CORE ICONS:
 * - Icon - Universal icon wrapper
 * - IconSystem exports (BasketballIcon, etc.)
 */

// Medal icons for rankings
export { 
  MedalIcon,
  GoldMedal,
  SilverMedal,
  BronzeMedal,
  CopperMedal,
  IronMedal,
} from "./MedalIcons"
export type { MedalTier } from "./MedalIcons"

// Export all icons from IconSystem
export * from "./IconSystem"

// Export icon utility component
export { default as Icon, getIconNames, hasIcon, getIconComponent } from "./IconWrapper"
export type { IconName } from "./IconWrapper"

// Export status icons
export { 
  StatusIcon, 
  StatusBadge, 
  getStatusFromScore,
} from "./StatusIcon"
export type { StatusType } from "./StatusIcon"

// Export form metric icons
export {
  FormMetricIcon,
  FormMetricCard,
  getMetricLabel,
  getStatusFromDeviation,
} from "./FormMetricIcon"
export type { FormMetricType, MetricStatus } from "./FormMetricIcon"

// Export coaching level icons
export {
  CoachingLevelIcon,
  CoachingLevelBadge,
  CoachingLevelSelector,
  getTierConfig,
  getTierFromAge,
} from "./CoachingLevelIcon"
