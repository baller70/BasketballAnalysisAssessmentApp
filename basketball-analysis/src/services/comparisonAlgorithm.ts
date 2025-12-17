/**
 * Phase 6: Database Comparison Algorithm & Level-Specific Analysis
 * 
 * This service implements:
 * 1. Matching algorithm that compares users to similar shooters based on body type
 * 2. Five-tier coaching feedback system based on age/skill level
 * 3. Optimal mechanics extraction from top matches
 */

import { 
  SHOOTER_DATABASE, 
  ShooterProfile, 
  BodyBuild,
  ShooterSkillLevel 
} from "@/data/shooterDatabase"

// ============================================
// TYPES & INTERFACES
// ============================================

export type AgeGroup = 
  | "ELEMENTARY"    // Ages 6-11
  | "MIDDLE_SCHOOL" // Ages 12-14
  | "HIGH_SCHOOL"   // Ages 15-18
  | "COLLEGE"       // Ages 19-22
  | "PROFESSIONAL"  // Ages 23+

export type BodyType = "ECTOMORPH" | "MESOMORPH" | "ENDOMORPH" | "ATHLETIC"

export interface UserPhysicalProfile {
  heightInches: number      // Total height in inches
  weightLbs?: number        // Weight in pounds
  wingspanInches?: number   // Wingspan in inches (optional, defaults to height + 2)
  bodyType?: BodyType       // Body type
  age: number               // Age in years
  skillLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ELITE"
  athleticAbility?: number  // 1-10 scale
  dominantHand?: "RIGHT" | "LEFT" | "AMBIDEXTROUS"
}

export interface UserShootingMetrics {
  elbowAngle?: number       // Degrees
  kneeAngle?: number        // Degrees
  releaseAngle?: number     // Degrees
  shoulderTilt?: number     // Degrees
  hipTilt?: number          // Degrees
  followThroughAngle?: number // Degrees
  releaseHeight?: number    // Inches
  shotArc?: number          // Degrees
}

export interface SimilarityScore {
  physical: number          // 0-100 physical match
  skill: number             // 0-100 skill level match
  mechanics: number         // 0-100 shooting mechanics match
  overall: number           // 0-100 combined score
}

export interface MatchedShooter {
  shooter: ShooterProfile
  similarityScore: SimilarityScore
  matchReasons: string[]
  rank: number
}

export interface OptimalMechanics {
  elbowAngle: { value: number; stdDev: number }
  kneeAngle: { value: number; stdDev: number }
  releaseAngle: { value: number; stdDev: number }
  shoulderTilt: { value: number; stdDev: number }
  hipTilt: { value: number; stdDev: number }
  followThroughAngle: { value: number; stdDev: number }
}

export interface MechanicComparison {
  metric: string
  userValue: number
  optimalValue: number
  difference: number
  status: "GOOD" | "NEEDS_WORK" | "CRITICAL"
  recommendation: string
}

export interface CoachingFeedback {
  tier: AgeGroup
  tone: "ENCOURAGING" | "TECHNICAL" | "PERFORMANCE" | "PROFESSIONAL" | "ELITE"
  overallAssessment: string
  strengths: FeedbackItem[]
  improvements: FeedbackItem[]
  drills: DrillRecommendation[]
  peerComparison?: string
}

export interface FeedbackItem {
  icon: "CHECK" | "TARGET" | "LIGHTBULB" | "WARNING" | "STAR"
  title: string
  description: string
  priority?: number
}

export interface DrillRecommendation {
  name: string
  description: string
  duration: string
  difficulty: "EASY" | "MEDIUM" | "HARD"
  focusArea: string
}

// ============================================
// CONSTANTS
// ============================================

const HEIGHT_TOLERANCE = 2       // ±2 inches for close match
const WINGSPAN_TOLERANCE = 2     // ±2 inches for close match
const WEIGHT_TOLERANCE = 15      // ±15 lbs for close match
const ANGLE_TOLERANCE = 5        // ±5 degrees for close match

// Map user skill levels to database skill levels
const SKILL_LEVEL_MAP: Record<string, ShooterSkillLevel[]> = {
  "BEGINNER": ["NEEDS_WORK", "DEVELOPING"],
  "INTERMEDIATE": ["DEVELOPING", "INTERMEDIATE", "ADVANCED"],
  "ADVANCED": ["ADVANCED", "PRO"],
  "ELITE": ["PRO", "ELITE"]
}

// ============================================
// HELPER FUNCTIONS
// ============================================

export function determineAgeGroup(age: number): AgeGroup {
  if (age <= 11) return "ELEMENTARY"
  if (age <= 14) return "MIDDLE_SCHOOL"
  if (age <= 18) return "HIGH_SCHOOL"
  if (age <= 22) return "COLLEGE"
  return "PROFESSIONAL"
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function determineBodyBuild(heightInches: number, weightLbs?: number): BodyBuild {
  // Use height primarily, weight as secondary factor (weight reserved for future use)
  if (heightInches < 76) return "GUARD"       // Under 6'4"
  if (heightInches < 80) return "WING"        // 6'4" - 6'7"
  if (heightInches < 84) return "FORWARD"     // 6'8" - 6'11"
  return "CENTER"                              // 7'0"+
}

function calculateStandardDeviation(values: number[]): number {
  const n = values.length
  if (n === 0) return 0
  const mean = values.reduce((a, b) => a + b, 0) / n
  const squaredDiffs = values.map(v => Math.pow(v - mean, 2))
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / n)
}

// ============================================
// STEP 1: SEARCH DATABASE
// ============================================

function filterShootersByPhysicalProfile(
  profile: UserPhysicalProfile
): ShooterProfile[] {
  const heightMin = profile.heightInches - HEIGHT_TOLERANCE
  const heightMax = profile.heightInches + HEIGHT_TOLERANCE
  
  const wingspanMin = (profile.wingspanInches || profile.heightInches + 2) - WINGSPAN_TOLERANCE
  const wingspanMax = (profile.wingspanInches || profile.heightInches + 2) + WINGSPAN_TOLERANCE
  
  const bodyBuild = determineBodyBuild(profile.heightInches, profile.weightLbs)
  
  // Get acceptable skill levels based on user's skill
  const acceptableSkillLevels = SKILL_LEVEL_MAP[profile.skillLevel] || ["INTERMEDIATE", "ADVANCED"]
  
  return SHOOTER_DATABASE.filter(shooter => {
    // Height filter (±2 inches)
    const heightMatch = shooter.heightInches >= heightMin && shooter.heightInches <= heightMax
    
    // Wingspan filter (±2 inches)
    const wingspanMatch = shooter.wingspanInches >= wingspanMin && shooter.wingspanInches <= wingspanMax
    
    // Body build filter (same or adjacent)
    const bodyBuildMatch = shooter.bodyBuild === bodyBuild || 
      (bodyBuild === "GUARD" && shooter.bodyBuild === "WING") ||
      (bodyBuild === "WING" && (shooter.bodyBuild === "GUARD" || shooter.bodyBuild === "FORWARD")) ||
      (bodyBuild === "FORWARD" && (shooter.bodyBuild === "WING" || shooter.bodyBuild === "CENTER"))
    
    // Skill level filter
    const skillMatch = acceptableSkillLevels.includes(shooter.skillLevel)
    
    // Weight filter (if provided)
    let weightMatch = true
    if (profile.weightLbs) {
      weightMatch = Math.abs(shooter.weightLbs - profile.weightLbs) <= WEIGHT_TOLERANCE * 2
    }
    
    return heightMatch && wingspanMatch && bodyBuildMatch && skillMatch && weightMatch
  })
}

// ============================================
// STEP 2: CALCULATE SIMILARITY SCORES
// ============================================

function calculatePhysicalMatchScore(
  profile: UserPhysicalProfile,
  shooter: ShooterProfile
): number {
  let score = 0
  let maxScore = 0
  
  // Height match (most important - 40 points max)
  maxScore += 40
  const heightDiff = Math.abs(profile.heightInches - shooter.heightInches)
  if (heightDiff === 0) score += 40
  else if (heightDiff <= 1) score += 35
  else if (heightDiff <= 2) score += 28
  else if (heightDiff <= 3) score += 20
  else if (heightDiff <= 4) score += 10
  
  // Wingspan match (30 points max)
  maxScore += 30
  const userWingspan = profile.wingspanInches || profile.heightInches + 2
  const wingspanDiff = Math.abs(userWingspan - shooter.wingspanInches)
  if (wingspanDiff === 0) score += 30
  else if (wingspanDiff <= 1) score += 25
  else if (wingspanDiff <= 2) score += 20
  else if (wingspanDiff <= 3) score += 12
  else if (wingspanDiff <= 4) score += 5
  
  // Weight match (15 points max)
  if (profile.weightLbs) {
    maxScore += 15
    const weightDiff = Math.abs(profile.weightLbs - shooter.weightLbs)
    if (weightDiff <= 5) score += 15
    else if (weightDiff <= 10) score += 12
    else if (weightDiff <= 15) score += 9
    else if (weightDiff <= 25) score += 5
    else if (weightDiff <= 40) score += 2
  }
  
  // Body build match (15 points max)
  maxScore += 15
  const userBodyBuild = determineBodyBuild(profile.heightInches, profile.weightLbs)
  if (userBodyBuild === shooter.bodyBuild) score += 15
  else {
    // Adjacent body builds get partial credit
    const buildOrder: BodyBuild[] = ["GUARD", "WING", "FORWARD", "CENTER"]
    const userIdx = buildOrder.indexOf(userBodyBuild)
    const shooterIdx = buildOrder.indexOf(shooter.bodyBuild)
    if (Math.abs(userIdx - shooterIdx) === 1) score += 8
  }
  
  return maxScore > 0 ? (score / maxScore) * 100 : 0
}

function calculateSkillMatchScore(
  profile: UserPhysicalProfile,
  shooter: ShooterProfile
): number {
  const skillOrder: ShooterSkillLevel[] = [
    "POOR", "NEEDS_WORK", "BEGINNER", "DEVELOPING", 
    "INTERMEDIATE", "ADVANCED", "PRO", "ELITE"
  ]
  
  // Map user skill to approximate database skill
  const userSkillMap: Record<string, number> = {
    "BEGINNER": 2,      // Maps to NEEDS_WORK/DEVELOPING
    "INTERMEDIATE": 4,  // Maps to DEVELOPING/INTERMEDIATE
    "ADVANCED": 6,      // Maps to ADVANCED/PRO
    "ELITE": 7          // Maps to PRO/ELITE
  }
  
  const userSkillIdx = userSkillMap[profile.skillLevel] || 4
  const shooterSkillIdx = skillOrder.indexOf(shooter.skillLevel)
  
  const skillDiff = Math.abs(userSkillIdx - shooterSkillIdx)
  
  if (skillDiff === 0) return 100
  if (skillDiff === 1) return 85
  if (skillDiff === 2) return 65
  if (skillDiff === 3) return 40
  return 20
}

function calculateMechanicsMatchScore(
  userMetrics: UserShootingMetrics | undefined,
  shooter: ShooterProfile
): number {
  if (!userMetrics) return 50 // Default score if no metrics provided
  
  let score = 0
  let factors = 0
  
  const shooterMetrics = shooter.shootingMetrics
  
  // Elbow angle (most important for shooting)
  if (userMetrics.elbowAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.elbowAngle - shooterMetrics.elbowAngle)
    if (diff <= 3) score += 100
    else if (diff <= 5) score += 85
    else if (diff <= 8) score += 65
    else if (diff <= 12) score += 40
    else score += 20
  }
  
  // Knee angle
  if (userMetrics.kneeAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.kneeAngle - shooterMetrics.kneeAngle)
    if (diff <= 5) score += 100
    else if (diff <= 10) score += 80
    else if (diff <= 15) score += 55
    else score += 25
  }
  
  // Release angle
  if (userMetrics.releaseAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.releaseAngle - shooterMetrics.releaseAngle)
    if (diff <= 3) score += 100
    else if (diff <= 5) score += 80
    else if (diff <= 8) score += 55
    else score += 25
  }
  
  // Shoulder tilt
  if (userMetrics.shoulderTilt !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.shoulderTilt - shooterMetrics.shoulderTilt)
    if (diff <= 3) score += 100
    else if (diff <= 5) score += 75
    else if (diff <= 8) score += 50
    else score += 20
  }
  
  return factors > 0 ? score / factors : 50
}

// ============================================
// STEP 3: RANK RESULTS
// ============================================

export function findTopMatches(
  profile: UserPhysicalProfile,
  userMetrics?: UserShootingMetrics,
  limit: number = 5
): MatchedShooter[] {
  // First, filter by physical profile
  let candidates = filterShootersByPhysicalProfile(profile)
  
  // If not enough matches, expand search
  if (candidates.length < limit) {
    candidates = SHOOTER_DATABASE
  }
  
  // Calculate similarity scores for each candidate
  const scoredCandidates: MatchedShooter[] = candidates.map(shooter => {
    const physicalScore = calculatePhysicalMatchScore(profile, shooter)
    const skillScore = calculateSkillMatchScore(profile, shooter)
    const mechanicsScore = calculateMechanicsMatchScore(userMetrics, shooter)
    
    // Weighted overall score: Physical 50%, Skill 25%, Mechanics 25%
    const overallScore = (physicalScore * 0.5) + (skillScore * 0.25) + (mechanicsScore * 0.25)
    
    // Generate match reasons
    const matchReasons: string[] = []
    
    const heightFt = Math.floor(shooter.heightInches / 12)
    const heightIn = shooter.heightInches % 12
    const userHeightFt = Math.floor(profile.heightInches / 12)
    const userHeightIn = profile.heightInches % 12
    
    if (Math.abs(profile.heightInches - shooter.heightInches) <= 2) {
      matchReasons.push(`Similar height (${heightFt}'${heightIn}" vs your ${userHeightFt}'${userHeightIn}")`)
    }
    
    const userWingspan = profile.wingspanInches || profile.heightInches + 2
    if (Math.abs(userWingspan - shooter.wingspanInches) <= 2) {
      const wsFt = Math.floor(shooter.wingspanInches / 12)
      const wsIn = shooter.wingspanInches % 12
      matchReasons.push(`Similar wingspan (${wsFt}'${wsIn}")`)
    }
    
    if (profile.weightLbs && Math.abs(profile.weightLbs - shooter.weightLbs) <= 15) {
      matchReasons.push(`Similar weight (${shooter.weightLbs} lbs)`)
    }
    
    const userBodyBuild = determineBodyBuild(profile.heightInches, profile.weightLbs)
    if (userBodyBuild === shooter.bodyBuild) {
      matchReasons.push(`Same body type (${shooter.bodyBuild.toLowerCase()})`)
    }
    
    if (matchReasons.length === 0) {
      matchReasons.push(`${shooter.skillLevel} level shooter`)
    }
    
    return {
      shooter,
      similarityScore: {
        physical: Math.round(physicalScore),
        skill: Math.round(skillScore),
        mechanics: Math.round(mechanicsScore),
        overall: Math.round(overallScore)
      },
      matchReasons,
      rank: 0
    }
  })
  
  // Sort by overall score
  scoredCandidates.sort((a, b) => b.similarityScore.overall - a.similarityScore.overall)
  
  // Assign ranks and return top matches
  return scoredCandidates.slice(0, limit).map((match, index) => ({
    ...match,
    rank: index + 1
  }))
}

// ============================================
// STEP 4: EXTRACT OPTIMAL MECHANICS
// ============================================

export function extractOptimalMechanics(
  topMatches: MatchedShooter[],
  numToUse: number = 3
): OptimalMechanics {
  const matchesToUse = topMatches.slice(0, numToUse)
  
  const elbowAngles = matchesToUse.map(m => m.shooter.shootingMetrics.elbowAngle)
  const kneeAngles = matchesToUse.map(m => m.shooter.shootingMetrics.kneeAngle)
  const releaseAngles = matchesToUse.map(m => m.shooter.shootingMetrics.releaseAngle)
  const shoulderTilts = matchesToUse.map(m => m.shooter.shootingMetrics.shoulderTilt)
  const hipTilts = matchesToUse.map(m => m.shooter.shootingMetrics.hipTilt)
  const followThroughs = matchesToUse.map(m => m.shooter.shootingMetrics.followThroughAngle)
  
  const average = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length
  
  return {
    elbowAngle: {
      value: Math.round(average(elbowAngles)),
      stdDev: Math.round(calculateStandardDeviation(elbowAngles) * 10) / 10
    },
    kneeAngle: {
      value: Math.round(average(kneeAngles)),
      stdDev: Math.round(calculateStandardDeviation(kneeAngles) * 10) / 10
    },
    releaseAngle: {
      value: Math.round(average(releaseAngles)),
      stdDev: Math.round(calculateStandardDeviation(releaseAngles) * 10) / 10
    },
    shoulderTilt: {
      value: Math.round(average(shoulderTilts)),
      stdDev: Math.round(calculateStandardDeviation(shoulderTilts) * 10) / 10
    },
    hipTilt: {
      value: Math.round(average(hipTilts)),
      stdDev: Math.round(calculateStandardDeviation(hipTilts) * 10) / 10
    },
    followThroughAngle: {
      value: Math.round(average(followThroughs)),
      stdDev: Math.round(calculateStandardDeviation(followThroughs) * 10) / 10
    }
  }
}

// ============================================
// STEP 5: COMPARE USER TO OPTIMAL
// ============================================

export function compareUserToOptimal(
  userMetrics: UserShootingMetrics,
  optimalMechanics: OptimalMechanics
): MechanicComparison[] {
  const comparisons: MechanicComparison[] = []
  
  // Helper to determine status and generate recommendation
  const analyzeMetric = (
    name: string,
    userValue: number | undefined,
    optimal: { value: number; stdDev: number },
    toleranceMultiplier: number = 1
  ): MechanicComparison | null => {
    if (userValue === undefined) return null
    
    const diff = userValue - optimal.value
    const absDiff = Math.abs(diff)
    const tolerance = Math.max(optimal.stdDev * 2, 5) * toleranceMultiplier
    
    let status: "GOOD" | "NEEDS_WORK" | "CRITICAL"
    let recommendation: string
    
    if (absDiff <= tolerance / 2) {
      status = "GOOD"
      recommendation = `Your ${name.toLowerCase()} is excellent - within optimal range.`
    } else if (absDiff <= tolerance) {
      status = "NEEDS_WORK"
      if (diff > 0) {
        recommendation = `${name} is ${Math.round(absDiff)}° too high. Work on ${diff > 0 ? 'lowering' : 'raising'} it by ${Math.round(absDiff)}°.`
      } else {
        recommendation = `${name} is ${Math.round(absDiff)}° too low. Work on raising it by ${Math.round(absDiff)}°.`
      }
    } else {
      status = "CRITICAL"
      if (diff > 0) {
        recommendation = `${name} needs significant adjustment - ${Math.round(absDiff)}° too high. Focus on reducing this angle.`
      } else {
        recommendation = `${name} needs significant adjustment - ${Math.round(absDiff)}° too low. Focus on increasing this angle.`
      }
    }
    
    return {
      metric: name,
      userValue: Math.round(userValue),
      optimalValue: optimal.value,
      difference: Math.round(diff),
      status,
      recommendation
    }
  }
  
  // Analyze each metric
  const elbowComp = analyzeMetric("Elbow Angle", userMetrics.elbowAngle, optimalMechanics.elbowAngle)
  if (elbowComp) comparisons.push(elbowComp)
  
  const kneeComp = analyzeMetric("Knee Angle", userMetrics.kneeAngle, optimalMechanics.kneeAngle, 1.5)
  if (kneeComp) comparisons.push(kneeComp)
  
  const releaseComp = analyzeMetric("Release Angle", userMetrics.releaseAngle, optimalMechanics.releaseAngle)
  if (releaseComp) comparisons.push(releaseComp)
  
  const shoulderComp = analyzeMetric("Shoulder Tilt", userMetrics.shoulderTilt, optimalMechanics.shoulderTilt)
  if (shoulderComp) comparisons.push(shoulderComp)
  
  const hipComp = analyzeMetric("Hip Tilt", userMetrics.hipTilt, optimalMechanics.hipTilt)
  if (hipComp) comparisons.push(hipComp)
  
  const followComp = analyzeMetric("Follow-Through", userMetrics.followThroughAngle, optimalMechanics.followThroughAngle, 1.5)
  if (followComp) comparisons.push(followComp)
  
  return comparisons
}

// ============================================
// LEVEL-SPECIFIC COACHING FEEDBACK
// ============================================

const TIER_CONFIG: Record<AgeGroup, {
  tone: CoachingFeedback["tone"]
  language: "SIMPLE" | "TECHNICAL" | "ADVANCED"
  focusAreas: string[]
  maxRecommendations: number
}> = {
  ELEMENTARY: {
    tone: "ENCOURAGING",
    language: "SIMPLE",
    focusAreas: ["Basic form", "Elbow alignment", "Follow-through", "Balance"],
    maxRecommendations: 3
  },
  MIDDLE_SCHOOL: {
    tone: "TECHNICAL",
    language: "SIMPLE",
    focusAreas: ["Elbow positioning", "Arc trajectory", "Footwork", "Release point"],
    maxRecommendations: 4
  },
  HIGH_SCHOOL: {
    tone: "PERFORMANCE",
    language: "TECHNICAL",
    focusAreas: ["Advanced mechanics", "Shot load", "Consistency", "Game situations"],
    maxRecommendations: 5
  },
  COLLEGE: {
    tone: "PROFESSIONAL",
    language: "ADVANCED",
    focusAreas: ["Elite mechanics", "Shot selection", "Pressure performance", "Biomechanics"],
    maxRecommendations: 6
  },
  PROFESSIONAL: {
    tone: "ELITE",
    language: "ADVANCED",
    focusAreas: ["Micro-adjustments", "Fatigue management", "Situational patterns", "Elite comparisons"],
    maxRecommendations: 7
  }
}

export function generateCoachingFeedback(
  profile: UserPhysicalProfile,
  comparisons: MechanicComparison[],
  topMatches: MatchedShooter[]
): CoachingFeedback {
  const ageGroup = determineAgeGroup(profile.age)
  const config = TIER_CONFIG[ageGroup]
  
  const strengths: FeedbackItem[] = []
  const improvements: FeedbackItem[] = []
  
  // Categorize comparisons
  comparisons.forEach((comp, index) => {
    if (comp.status === "GOOD") {
      strengths.push({
        icon: "CHECK",
        title: `Great ${comp.metric}!`,
        description: generateAgeAppropriateDescription(comp, ageGroup, true),
        priority: index
      })
    } else if (comp.status === "NEEDS_WORK") {
      improvements.push({
        icon: "TARGET",
        title: `${comp.metric} - Getting Close`,
        description: generateAgeAppropriateDescription(comp, ageGroup, false),
        priority: index
      })
    } else {
      improvements.push({
        icon: "LIGHTBULB",
        title: `Focus Area: ${comp.metric}`,
        description: generateAgeAppropriateDescription(comp, ageGroup, false),
        priority: index
      })
    }
  })
  
  // Generate drills based on improvements
  const drills = generateDrillsForTier(improvements, ageGroup)
  
  // Generate overall assessment
  const goodCount = comparisons.filter(c => c.status === "GOOD").length
  const totalCount = comparisons.length
  const overallAssessment = generateOverallAssessment(goodCount, totalCount, ageGroup, topMatches)
  
  // Generate peer comparison for older tiers
  let peerComparison: string | undefined
  if (ageGroup === "HIGH_SCHOOL" || ageGroup === "COLLEGE" || ageGroup === "PROFESSIONAL") {
    peerComparison = generatePeerComparison(comparisons, topMatches, ageGroup)
  }
  
  return {
    tier: ageGroup,
    tone: config.tone,
    overallAssessment,
    strengths: strengths.slice(0, config.maxRecommendations),
    improvements: improvements.slice(0, config.maxRecommendations),
    drills: drills.slice(0, 3),
    peerComparison
  }
}

function generateAgeAppropriateDescription(
  comparison: MechanicComparison,
  ageGroup: AgeGroup,
  isStrength: boolean
): string {
  const diff = Math.abs(comparison.difference)
  
  switch (ageGroup) {
    case "ELEMENTARY":
      if (isStrength) {
        return `You're doing this perfectly! Keep it up, superstar!`
      }
      return comparison.difference > 0
        ? `Try to make this a little smaller - like you're tucking in your elbow!`
        : `Try to stretch this out a bit more - reach for the sky!`
    
    case "MIDDLE_SCHOOL":
      if (isStrength) {
        return `Your ${comparison.metric.toLowerCase()} is at ${comparison.userValue}° - right in the target zone!`
      }
      return `Your ${comparison.metric.toLowerCase()} is ${diff}° ${comparison.difference > 0 ? 'above' : 'below'} optimal. Let's work on getting it to ${comparison.optimalValue}°.`
    
    case "HIGH_SCHOOL":
      if (isStrength) {
        return `${comparison.metric}: ${comparison.userValue}° (Optimal: ${comparison.optimalValue}°) - Excellent consistency.`
      }
      return `${comparison.metric}: ${comparison.userValue}° needs adjustment to ${comparison.optimalValue}° (${diff}° ${comparison.difference > 0 ? 'high' : 'low'}). This affects your shot accuracy.`
    
    case "COLLEGE":
    case "PROFESSIONAL":
      if (isStrength) {
        return `${comparison.metric} at ${comparison.userValue}° aligns with elite standards (${comparison.optimalValue}° ± ${ANGLE_TOLERANCE}°).`
      }
      return `${comparison.metric}: ${comparison.userValue}° vs optimal ${comparison.optimalValue}° (Δ${comparison.difference > 0 ? '+' : ''}${comparison.difference}°). ${comparison.recommendation}`
    
    default:
      return comparison.recommendation
  }
}

function generateOverallAssessment(
  goodCount: number,
  totalCount: number,
  ageGroup: AgeGroup,
  topMatches: MatchedShooter[]
): string {
  const percentage = totalCount > 0 ? (goodCount / totalCount) * 100 : 0
  const topMatch = topMatches[0]
  
  switch (ageGroup) {
    case "ELEMENTARY":
      if (percentage >= 70) {
        return `Amazing job! You're shooting like a real basketball star! Keep practicing and having fun!`
      } else if (percentage >= 40) {
        return `You're doing great! With a little more practice, you'll be shooting even better!`
      }
      return `Good effort! Every great shooter started just like you. Let's work on a few things together!`
    
    case "MIDDLE_SCHOOL":
      if (percentage >= 70) {
        return `Excellent shooting form! ${goodCount} out of ${totalCount} mechanics are in the optimal range. You're on track for high school basketball!`
      } else if (percentage >= 40) {
        return `Good foundation! Your form shows promise with ${goodCount} strong areas. Focus on the improvement areas to take your game to the next level.`
      }
      return `Your shooting form is developing. Let's focus on the fundamentals - they're the building blocks of a great shot.`
    
    case "HIGH_SCHOOL":
      if (percentage >= 70) {
        return `Strong shooting mechanics with ${goodCount}/${totalCount} metrics in optimal range. Your form compares favorably to ${topMatch?.shooter.name || 'elite shooters'}.`
      } else if (percentage >= 40) {
        return `Solid fundamentals with room for improvement. Focus on consistency - top performers maintain ±1° variance in their mechanics.`
      }
      return `Your form needs refinement in key areas. Dedicated practice on these mechanics will significantly improve your shooting percentage.`
    
    case "COLLEGE":
      return `NCAA-level analysis: ${goodCount}/${totalCount} metrics meet collegiate standards. ${topMatch ? `Your form profile matches ${topMatch.similarityScore.overall}% with ${topMatch.shooter.name}'s mechanics.` : ''}`
    
    case "PROFESSIONAL":
      return `Elite analysis: ${goodCount}/${totalCount} metrics at professional level. ${topMatch ? `Closest comparison: ${topMatch.shooter.name} (${topMatch.similarityScore.overall}% match).` : ''} Focus on micro-adjustments for marginal gains.`
    
    default:
      return `Analysis complete: ${goodCount}/${totalCount} mechanics in optimal range.`
  }
}

function generatePeerComparison(
  comparisons: MechanicComparison[],
  topMatches: MatchedShooter[],
  ageGroup: AgeGroup
): string {
  const goodCount = comparisons.filter(c => c.status === "GOOD").length
  const totalCount = comparisons.length
  const topMatch = topMatches[0]
  
  if (ageGroup === "HIGH_SCHOOL") {
    return `Compared to high school averages: You're in the top ${100 - Math.round((goodCount / totalCount) * 30)}% for shooting mechanics. ${topMatch ? `Your form most closely resembles ${topMatch.shooter.name}.` : ''}`
  }
  
  if (ageGroup === "COLLEGE") {
    return `NCAA benchmark comparison:\n• ${goodCount}/${totalCount} metrics meet D1 standards\n• Consistency rating: ${Math.round((goodCount / totalCount) * 100)}%\n• ${topMatch ? `Form similarity to ${topMatch.shooter.name}: ${topMatch.similarityScore.overall}%` : ''}`
  }
  
  return `Professional comparison:\n• ${goodCount}/${totalCount} metrics at NBA/WNBA level\n• ${topMatch ? `Closest match: ${topMatch.shooter.name} (${topMatch.similarityScore.overall}%)` : ''}\n• Focus: Micro-adjustments for elite performance`
}

function generateDrillsForTier(
  improvements: FeedbackItem[],
  ageGroup: AgeGroup
): DrillRecommendation[] {
  const drills: DrillRecommendation[] = []
  
  // Base drills by age group
  const baseDrills: Record<AgeGroup, DrillRecommendation[]> = {
    ELEMENTARY: [
      {
        name: "Form Shooting Challenge",
        description: "Stand close to the basket and practice your shooting form. Focus on keeping your elbow in and following through!",
        duration: "5 minutes",
        difficulty: "EASY",
        focusArea: "Basic Form"
      },
      {
        name: "Balance Board Shots",
        description: "Practice shooting while standing on one foot to improve your balance.",
        duration: "5 minutes",
        difficulty: "EASY",
        focusArea: "Balance"
      },
      {
        name: "Follow-Through Freeze",
        description: "After each shot, freeze your follow-through and count to 3. Your wrist should be relaxed like you're reaching into a cookie jar!",
        duration: "5 minutes",
        difficulty: "EASY",
        focusArea: "Follow-Through"
      }
    ],
    MIDDLE_SCHOOL: [
      {
        name: "Elbow Alignment Drill",
        description: "Use a mirror or wall to check your elbow alignment. Your elbow should be at 90° when you set the ball.",
        duration: "10 minutes",
        difficulty: "MEDIUM",
        focusArea: "Elbow Position"
      },
      {
        name: "Arc Trajectory Practice",
        description: "Place a string above the basket and try to shoot over it. This helps develop proper arc.",
        duration: "10 minutes",
        difficulty: "MEDIUM",
        focusArea: "Shot Arc"
      },
      {
        name: "Release Point Consistency",
        description: "Mark a spot on the wall at your release height. Practice releasing at the same point every time.",
        duration: "10 minutes",
        difficulty: "MEDIUM",
        focusArea: "Release Point"
      }
    ],
    HIGH_SCHOOL: [
      {
        name: "Shot Load Analysis",
        description: "Film yourself and analyze your shot load (dip). Optimal depth is 18-20 inches for power generation.",
        duration: "15 minutes",
        difficulty: "MEDIUM",
        focusArea: "Shot Load"
      },
      {
        name: "Consistency Tracking",
        description: "Take 50 shots and track your arc consistency. Elite shooters maintain ±1° variance.",
        duration: "20 minutes",
        difficulty: "HARD",
        focusArea: "Consistency"
      },
      {
        name: "Game Situation Shooting",
        description: "Practice shooting off screens, off the dribble, and with a closeout defender.",
        duration: "20 minutes",
        difficulty: "HARD",
        focusArea: "Game Situations"
      }
    ],
    COLLEGE: [
      {
        name: "Biomechanical Analysis",
        description: "Record and analyze all joint angles. Compare to NCAA optimal ranges and make micro-adjustments.",
        duration: "30 minutes",
        difficulty: "HARD",
        focusArea: "Advanced Mechanics"
      },
      {
        name: "Pressure Shooting",
        description: "Simulate game pressure: make 10 in a row or start over. Track your performance under fatigue.",
        duration: "25 minutes",
        difficulty: "HARD",
        focusArea: "Mental Toughness"
      },
      {
        name: "Shot Selection Intelligence",
        description: "Practice reading defenses and selecting optimal shot opportunities.",
        duration: "20 minutes",
        difficulty: "HARD",
        focusArea: "Shot Selection"
      }
    ],
    PROFESSIONAL: [
      {
        name: "Fatigue Management Protocol",
        description: "Track your form degradation over 100 shots. Identify when mechanics break down and develop strategies.",
        duration: "45 minutes",
        difficulty: "HARD",
        focusArea: "Endurance"
      },
      {
        name: "Micro-Adjustment Training",
        description: "Work on 1-2° adjustments in specific angles. Use video analysis for immediate feedback.",
        duration: "30 minutes",
        difficulty: "HARD",
        focusArea: "Precision"
      },
      {
        name: "Situational Pattern Analysis",
        description: "Review game film and practice your most common shot situations with exact footwork.",
        duration: "40 minutes",
        difficulty: "HARD",
        focusArea: "Game Preparation"
      }
    ]
  }
  
  // Add base drills for the age group
  drills.push(...baseDrills[ageGroup])
  
  // Add specific drills based on improvement areas
  improvements.forEach(imp => {
    if (imp.title.toLowerCase().includes("elbow")) {
      drills.push({
        name: "Wall Elbow Check",
        description: "Stand with your shooting side against a wall. Practice your shooting motion - your elbow should stay close to the wall.",
        duration: "10 minutes",
        difficulty: ageGroup === "ELEMENTARY" ? "EASY" : "MEDIUM",
        focusArea: "Elbow Alignment"
      })
    }
    if (imp.title.toLowerCase().includes("knee") || imp.title.toLowerCase().includes("balance")) {
      drills.push({
        name: "Power Stance Practice",
        description: "Practice your shooting stance with proper knee bend. Feet shoulder-width apart, knees slightly bent.",
        duration: "10 minutes",
        difficulty: "EASY",
        focusArea: "Base & Balance"
      })
    }
  })
  
  return drills
}

// ============================================
// MAIN COMPARISON FUNCTION
// ============================================

export interface ComparisonResult {
  topMatches: MatchedShooter[]
  optimalMechanics: OptimalMechanics
  mechanicComparisons: MechanicComparison[]
  coachingFeedback: CoachingFeedback
  personalizedRecommendations: string[]
}

export function runFullComparison(
  profile: UserPhysicalProfile,
  userMetrics: UserShootingMetrics
): ComparisonResult {
  // Step 1-3: Find top matches
  const topMatches = findTopMatches(profile, userMetrics, 5)
  
  // Step 4: Extract optimal mechanics from top 3
  const optimalMechanics = extractOptimalMechanics(topMatches, 3)
  
  // Step 5: Compare user to optimal
  const mechanicComparisons = compareUserToOptimal(userMetrics, optimalMechanics)
  
  // Step 6: Generate level-specific coaching feedback
  const coachingFeedback = generateCoachingFeedback(profile, mechanicComparisons, topMatches)
  
  // Generate personalized recommendations
  const personalizedRecommendations = mechanicComparisons
    .filter(c => c.status !== "GOOD")
    .sort((a, b) => {
      const severityOrder = { "CRITICAL": 0, "NEEDS_WORK": 1, "GOOD": 2 }
      return severityOrder[a.status] - severityOrder[b.status]
    })
    .slice(0, 5)
    .map(c => c.recommendation)
  
  return {
    topMatches,
    optimalMechanics,
    mechanicComparisons,
    coachingFeedback,
    personalizedRecommendations
  }
}

