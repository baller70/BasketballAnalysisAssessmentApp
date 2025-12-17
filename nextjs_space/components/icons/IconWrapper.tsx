/**
 * Icon Wrapper Component
 * 
 * A utility component that allows dynamic icon selection by name.
 * Useful for rendering icons from data.
 */

import React from "react"
import {
  IconProps,
  // Navigation
  HomeIcon,
  CameraIcon,
  AnalysisIcon,
  ProgressIcon,
  ProfileIcon,
  // Form Mechanics
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
  // Performance Metrics
  AccuracyIcon,
  ImprovementTrendIcon,
  RegressionIcon,
  ReleaseTimingIcon,
  ArcTrajectoryIcon,
  ConsistencyIcon,
  ComparisonIcon,
  // Status
  ExcellentFormIcon,
  GoodFormIcon,
  NeedsImprovementIcon,
  CriticalIssueIcon,
  ImprovingIcon,
  // Coaching Levels
  ElementaryLevelIcon,
  MiddleSchoolLevelIcon,
  HighSchoolLevelIcon,
  CollegeLevelIcon,
  ProfessionalLevelIcon,
  // Profile/Onboarding
  HeightIcon,
  WeightIcon,
  WingspanIcon,
  AgeIcon,
  BodyTypeIcon,
  DominantHandIcon,
  ShootingStyleIcon,
  BioIcon,
  AthleticAbilityIcon,
  // Actions
  PlayIcon,
  PauseIcon,
  RefreshIcon,
  DownloadIcon,
  ShareIcon,
  SettingsIcon,
  HelpIcon,
  InfoIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  // Basketball-specific
  BasketballIcon,
  HoopIcon,
  CourtIcon,
  DrillIcon,
  CoachIcon,
} from "./IconSystem"

// Icon name to component mapping
const ICON_MAP: Record<string, React.FC<IconProps>> = {
  // Navigation
  home: HomeIcon,
  camera: CameraIcon,
  analysis: AnalysisIcon,
  progress: ProgressIcon,
  profile: ProfileIcon,
  
  // Form Mechanics
  elbow: ElbowAlignmentIcon,
  elbowAlignment: ElbowAlignmentIcon,
  releasePoint: ReleasePointIcon,
  footwork: FootworkIcon,
  followThrough: FollowThroughIcon,
  balance: BalanceIcon,
  kneeBend: KneeBendIcon,
  eyePosition: EyePositionIcon,
  shoulder: ShoulderAlignmentIcon,
  shoulderAlignment: ShoulderAlignmentIcon,
  coreRotation: CoreRotationIcon,
  wristAngle: WristAngleIcon,
  
  // Performance Metrics
  accuracy: AccuracyIcon,
  target: AccuracyIcon,
  improvementTrend: ImprovementTrendIcon,
  trendUp: ImprovementTrendIcon,
  regression: RegressionIcon,
  trendDown: RegressionIcon,
  releaseTiming: ReleaseTimingIcon,
  timer: ReleaseTimingIcon,
  arcTrajectory: ArcTrajectoryIcon,
  arc: ArcTrajectoryIcon,
  consistency: ConsistencyIcon,
  comparison: ComparisonIcon,
  
  // Status
  excellent: ExcellentFormIcon,
  checkCircle: ExcellentFormIcon,
  good: GoodFormIcon,
  check: GoodFormIcon,
  needsImprovement: NeedsImprovementIcon,
  warning: NeedsImprovementIcon,
  critical: CriticalIssueIcon,
  error: CriticalIssueIcon,
  xCircle: CriticalIssueIcon,
  improving: ImprovingIcon,
  arrowUpCircle: ImprovingIcon,
  
  // Coaching Levels
  elementary: ElementaryLevelIcon,
  star1: ElementaryLevelIcon,
  middleSchool: MiddleSchoolLevelIcon,
  star2: MiddleSchoolLevelIcon,
  highSchool: HighSchoolLevelIcon,
  star3: HighSchoolLevelIcon,
  college: CollegeLevelIcon,
  star4: CollegeLevelIcon,
  professional: ProfessionalLevelIcon,
  star5: ProfessionalLevelIcon,
  
  // Profile/Onboarding
  height: HeightIcon,
  ruler: HeightIcon,
  weight: WeightIcon,
  scale: WeightIcon,
  wingspan: WingspanIcon,
  arms: WingspanIcon,
  age: AgeIcon,
  calendar: AgeIcon,
  bodyType: BodyTypeIcon,
  body: BodyTypeIcon,
  dominantHand: DominantHandIcon,
  hand: DominantHandIcon,
  shootingStyle: ShootingStyleIcon,
  shooting: ShootingStyleIcon,
  bio: BioIcon,
  notes: BioIcon,
  athleticAbility: AthleticAbilityIcon,
  athletic: AthleticAbilityIcon,
  
  // Actions
  play: PlayIcon,
  pause: PauseIcon,
  refresh: RefreshIcon,
  download: DownloadIcon,
  share: ShareIcon,
  settings: SettingsIcon,
  help: HelpIcon,
  info: InfoIcon,
  close: CloseIcon,
  x: CloseIcon,
  chevronLeft: ChevronLeftIcon,
  arrowLeft: ChevronLeftIcon,
  chevronRight: ChevronRightIcon,
  arrowRight: ChevronRightIcon,
  chevronUp: ChevronUpIcon,
  arrowUp: ChevronUpIcon,
  chevronDown: ChevronDownIcon,
  arrowDown: ChevronDownIcon,
  
  // Basketball-specific
  basketball: BasketballIcon,
  ball: BasketballIcon,
  hoop: HoopIcon,
  basket: HoopIcon,
  court: CourtIcon,
  drill: DrillIcon,
  coach: CoachIcon,
}

export type IconName = keyof typeof ICON_MAP

interface IconWrapperProps extends IconProps {
  name: IconName | string
}

/**
 * Dynamic icon component that renders an icon by name
 */
const Icon: React.FC<IconWrapperProps> = ({ name, ...props }) => {
  const IconComponent = ICON_MAP[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found in icon library`)
    return null
  }
  
  return <IconComponent {...props} />
}

export default Icon

/**
 * Get all available icon names
 */
export function getIconNames(): string[] {
  return Object.keys(ICON_MAP)
}

/**
 * Check if an icon exists
 */
export function hasIcon(name: string): boolean {
  return name in ICON_MAP
}

/**
 * Get icon component by name
 */
export function getIconComponent(name: string): React.FC<IconProps> | null {
  return ICON_MAP[name] || null
}







