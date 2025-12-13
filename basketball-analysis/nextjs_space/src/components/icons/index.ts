/**
 * Icon System Exports
 * 
 * Central export point for all professional icons used in the app.
 */

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


