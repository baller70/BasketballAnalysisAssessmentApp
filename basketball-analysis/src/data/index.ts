/**
 * @file index.ts (Data)
 * @description Barrel exports for static data and databases
 * 
 * DATABASES:
 * - eliteShooters - NBA shooter profiles with measurements
 * - shootingFlawsDatabase - Flaw detection rules and feedback
 * - shooterDatabase - Extended shooter comparison data
 * - drillDatabase - Practice drill recommendations
 * 
 * USAGE:
 * import { ALL_ELITE_SHOOTERS, detectFlawsFromAngles } from "@/data"
 */

// Elite shooters database
export { 
  ALL_ELITE_SHOOTERS,
  TIER_LABELS,
  TIER_COLORS,
  LEAGUE_LABELS,
  POSITION_LABELS,
} from "./eliteShooters"
export type { 
  EliteShooter,
  ShooterTier,
  Position,
  BodyType,
} from "./eliteShooters"

// Shooting flaws database
export {
  SHOOTING_FLAWS,
  detectFlawsFromAngles,
  generateCoachingFeedback,
  getShooterLevel,
  getCombinedFlawEffect,
  SHOOTER_LEVELS,
} from "./shootingFlawsDatabase"
export type { ShootingFlaw } from "./shootingFlawsDatabase"

// Extended shooter database
export { 
  SHOOTER_DATABASE,
  findMatchingShooters,
  parseHeightToInches,
  determineBodyBuild,
  getShootersByLevel,
  getAllSkillLevels,
} from "./shooterDatabase"
export type { ShooterSkillLevel, BodyBuild, ShooterProfile } from "./shooterDatabase"

// Drill database
export { 
  ALL_DRILLS,
  getDrillsByLevel,
  getDrillsByFocusArea,
  getRecommendedDrills,
  mapAgeToLevel,
  mapSkillLevelToLevel,
  mapFlawToFocusArea,
} from "./drillDatabase"
export type { SkillLevel, DrillFocusArea, Drill } from "./drillDatabase"

