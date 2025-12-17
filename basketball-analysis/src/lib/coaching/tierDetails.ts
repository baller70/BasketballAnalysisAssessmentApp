/**
 * Detailed Tier-Specific Analysis Criteria
 * 
 * This file contains the detailed breakdown of what to analyze
 * at each coaching tier level, including:
 * - Specific metrics and their optimal ranges
 * - NCAA/Professional benchmarks
 * - Comparison data
 * - Drill recommendations
 */

import { CoachingTier } from "@/stores/profileStore"

// ==========================================
// TYPES
// ==========================================

export interface MetricRange {
  min: number
  max: number
  optimal: number
  unit: string
}

export interface TierBenchmark {
  metric: string
  average: number
  top25Percentile: number
  top10Percentile: number
  top5Percentile: number
  unit: string
}

export interface DrillRecommendation {
  id: string
  name: string
  description: string
  targetArea: string
  duration: string
  repetitions?: number
  difficulty: "beginner" | "intermediate" | "advanced" | "elite"
}

export interface TierAnalysisCriteria {
  tier: CoachingTier
  metrics: {
    elbowAngle: MetricRange
    kneeAngle: MetricRange
    shoulderAngle: MetricRange
    hipAngle: MetricRange
    releaseAngle: MetricRange
    releaseHeight: MetricRange // relative to player height
    followThroughExtension: MetricRange
    shotArc: MetricRange
    releaseTime: MetricRange // seconds
    balanceScore: MetricRange // 0-100
  }
  benchmarks: TierBenchmark[]
  drills: DrillRecommendation[]
  analysisDepth: "basic" | "standard" | "detailed" | "comprehensive" | "elite"
  reportSections: string[]
}

// ==========================================
// TIER 4: COLLEGE LEVEL - DETAILED
// ==========================================

export const COLLEGE_TIER_DETAILS: TierAnalysisCriteria = {
  tier: "college",
  
  metrics: {
    elbowAngle: {
      min: 85,
      max: 95,
      optimal: 90,
      unit: "degrees",
    },
    kneeAngle: {
      min: 130,
      max: 160,
      optimal: 145,
      unit: "degrees",
    },
    shoulderAngle: {
      min: 85,
      max: 110,
      optimal: 95,
      unit: "degrees",
    },
    hipAngle: {
      min: 165,
      max: 180,
      optimal: 175,
      unit: "degrees",
    },
    releaseAngle: {
      min: 48,
      max: 55,
      optimal: 52,
      unit: "degrees",
    },
    releaseHeight: {
      min: 1.15, // 115% of player height
      max: 1.35,
      optimal: 1.25,
      unit: "x height",
    },
    followThroughExtension: {
      min: 85,
      max: 100,
      optimal: 95,
      unit: "% full extension",
    },
    shotArc: {
      min: 45,
      max: 52,
      optimal: 48,
      unit: "degrees",
    },
    releaseTime: {
      min: 0.28,
      max: 0.45,
      optimal: 0.35,
      unit: "seconds",
    },
    balanceScore: {
      min: 75,
      max: 100,
      optimal: 90,
      unit: "score",
    },
  },
  
  benchmarks: [
    {
      metric: "Release Time",
      average: 0.38,
      top25Percentile: 0.34,
      top10Percentile: 0.31,
      top5Percentile: 0.28,
      unit: "seconds",
    },
    {
      metric: "Shot Arc",
      average: 46.5,
      top25Percentile: 48.0,
      top10Percentile: 49.5,
      top5Percentile: 51.0,
      unit: "degrees",
    },
    {
      metric: "Form Consistency",
      average: 72,
      top25Percentile: 82,
      top10Percentile: 88,
      top5Percentile: 93,
      unit: "%",
    },
    {
      metric: "Release Point Variance",
      average: 3.2,
      top25Percentile: 2.5,
      top10Percentile: 1.8,
      top5Percentile: 1.2,
      unit: "inches",
    },
    {
      metric: "Elbow Alignment",
      average: 78,
      top25Percentile: 85,
      top10Percentile: 91,
      top5Percentile: 95,
      unit: "% optimal",
    },
    {
      metric: "Balance Score",
      average: 74,
      top25Percentile: 82,
      top10Percentile: 88,
      top5Percentile: 94,
      unit: "score",
    },
    {
      metric: "Follow-Through Consistency",
      average: 70,
      top25Percentile: 80,
      top10Percentile: 87,
      top5Percentile: 92,
      unit: "%",
    },
    {
      metric: "Knee Bend Depth",
      average: 145,
      top25Percentile: 140,
      top10Percentile: 135,
      top5Percentile: 130,
      unit: "degrees",
    },
  ],
  
  drills: [
    {
      id: "form_shooting_close",
      name: "Form Shooting (Close Range)",
      description: "Focus on perfect mechanics from 3-5 feet from the basket. One hand only, emphasize elbow alignment and follow-through.",
      targetArea: "Release mechanics",
      duration: "10-15 minutes",
      repetitions: 50,
      difficulty: "intermediate",
    },
    {
      id: "balance_board_shooting",
      name: "Balance Board Shooting",
      description: "Shoot while standing on a balance board to improve stability and core engagement.",
      targetArea: "Balance and core strength",
      duration: "10 minutes",
      repetitions: 30,
      difficulty: "advanced",
    },
    {
      id: "fatigue_shooting",
      name: "Fatigue Shooting Series",
      description: "Sprint baseline to baseline, then immediately shoot 3 free throws. Repeat 10 times. Maintains form under game-like fatigue.",
      targetArea: "Consistency under fatigue",
      duration: "20 minutes",
      difficulty: "advanced",
    },
    {
      id: "pressure_free_throws",
      name: "Pressure Free Throw Drill",
      description: "Team watches while you shoot 2 free throws. Miss = everyone runs. Simulates game pressure.",
      targetArea: "Mental toughness",
      duration: "15 minutes",
      difficulty: "advanced",
    },
    {
      id: "release_point_consistency",
      name: "Release Point Markers",
      description: "Use visual markers (tape on wall) to ensure consistent release point. Film and review.",
      targetArea: "Release consistency",
      duration: "15 minutes",
      repetitions: 40,
      difficulty: "intermediate",
    },
    {
      id: "arc_training",
      name: "Arc Trainer Shooting",
      description: "Use an arc training device or target above the rim to enforce proper shot trajectory.",
      targetArea: "Shot arc",
      duration: "10 minutes",
      repetitions: 30,
      difficulty: "intermediate",
    },
  ],
  
  analysisDepth: "comprehensive",
  
  reportSections: [
    "Executive Summary",
    "Form Score Breakdown",
    "NCAA Benchmark Comparison",
    "Phase-by-Phase Analysis (Setup, Load, Release, Follow-Through)",
    "Consistency Metrics",
    "Pressure Performance Analysis",
    "Biomechanical Efficiency Score",
    "Injury Risk Assessment",
    "Comparison to Similar Players",
    "Personalized Drill Recommendations",
    "Weekly Training Plan",
    "Progress Tracking Goals",
  ],
}

// ==========================================
// TIER 5: PROFESSIONAL LEVEL - DETAILED
// ==========================================

export const PROFESSIONAL_TIER_DETAILS: TierAnalysisCriteria = {
  tier: "professional",
  
  metrics: {
    elbowAngle: {
      min: 88,
      max: 92,
      optimal: 90,
      unit: "degrees",
    },
    kneeAngle: {
      min: 135,
      max: 155,
      optimal: 142,
      unit: "degrees",
    },
    shoulderAngle: {
      min: 88,
      max: 105,
      optimal: 95,
      unit: "degrees",
    },
    hipAngle: {
      min: 170,
      max: 180,
      optimal: 178,
      unit: "degrees",
    },
    releaseAngle: {
      min: 50,
      max: 55,
      optimal: 52,
      unit: "degrees",
    },
    releaseHeight: {
      min: 1.20,
      max: 1.35,
      optimal: 1.28,
      unit: "x height",
    },
    followThroughExtension: {
      min: 90,
      max: 100,
      optimal: 98,
      unit: "% full extension",
    },
    shotArc: {
      min: 47,
      max: 53,
      optimal: 50,
      unit: "degrees",
    },
    releaseTime: {
      min: 0.25,
      max: 0.40,
      optimal: 0.32,
      unit: "seconds",
    },
    balanceScore: {
      min: 85,
      max: 100,
      optimal: 95,
      unit: "score",
    },
  },
  
  benchmarks: [
    {
      metric: "Release Time",
      average: 0.35,
      top25Percentile: 0.31,
      top10Percentile: 0.28,
      top5Percentile: 0.25,
      unit: "seconds",
    },
    {
      metric: "Shot Arc",
      average: 48.5,
      top25Percentile: 50.0,
      top10Percentile: 51.5,
      top5Percentile: 52.5,
      unit: "degrees",
    },
    {
      metric: "Form Consistency",
      average: 82,
      top25Percentile: 89,
      top10Percentile: 93,
      top5Percentile: 96,
      unit: "%",
    },
    {
      metric: "Release Point Variance",
      average: 2.1,
      top25Percentile: 1.5,
      top10Percentile: 1.0,
      top5Percentile: 0.6,
      unit: "inches",
    },
    {
      metric: "Elbow Alignment",
      average: 86,
      top25Percentile: 92,
      top10Percentile: 95,
      top5Percentile: 98,
      unit: "% optimal",
    },
    {
      metric: "Balance Score",
      average: 84,
      top25Percentile: 90,
      top10Percentile: 94,
      top5Percentile: 97,
      unit: "score",
    },
    {
      metric: "Clutch Performance Delta",
      average: -3.5, // Performance drop under pressure
      top25Percentile: -1.5,
      top10Percentile: 0.0,
      top5Percentile: 2.0, // Actually improves under pressure
      unit: "% change",
    },
    {
      metric: "Fatigue Resistance",
      average: 85,
      top25Percentile: 91,
      top10Percentile: 95,
      top5Percentile: 98,
      unit: "% of fresh form",
    },
    {
      metric: "Shot Selection Efficiency",
      average: 78,
      top25Percentile: 85,
      top10Percentile: 90,
      top5Percentile: 94,
      unit: "eFG% on shot type",
    },
    {
      metric: "Biomechanical Efficiency",
      average: 82,
      top25Percentile: 88,
      top10Percentile: 92,
      top5Percentile: 96,
      unit: "% optimal energy transfer",
    },
  ],
  
  drills: [
    {
      id: "micro_adjustment_film",
      name: "Micro-Adjustment Film Session",
      description: "Frame-by-frame analysis of release mechanics. Identify sub-degree adjustments using slow-motion footage.",
      targetArea: "Precision mechanics",
      duration: "30 minutes",
      difficulty: "elite",
    },
    {
      id: "game_speed_repetition",
      name: "Game Speed Repetition",
      description: "High-intensity shooting drill at game speed. 100+ shots in 15 minutes with proper form tracked.",
      targetArea: "Form under speed",
      duration: "15-20 minutes",
      repetitions: 100,
      difficulty: "elite",
    },
    {
      id: "defender_proximity_shooting",
      name: "Defender Proximity Shooting",
      description: "Shoot with defenders at varying distances (hand in face, closeout, etc). Maintain form metrics.",
      targetArea: "Contest shooting",
      duration: "20 minutes",
      difficulty: "elite",
    },
    {
      id: "situational_shooting",
      name: "Situational Shooting Series",
      description: "Replicate specific game situations: catch-and-shoot, off-dribble, screen action, step-back. Track form changes.",
      targetArea: "Situational consistency",
      duration: "25 minutes",
      difficulty: "elite",
    },
    {
      id: "endurance_shooting",
      name: "4th Quarter Simulation",
      description: "Full court sprints to simulate fatigue, then execute specific shot types. Track form degradation.",
      targetArea: "End-game performance",
      duration: "30 minutes",
      difficulty: "elite",
    },
    {
      id: "biometric_feedback",
      name: "Biometric Feedback Training",
      description: "Use wearable sensors to get real-time feedback on joint angles during shooting motion.",
      targetArea: "Real-time correction",
      duration: "20 minutes",
      difficulty: "elite",
    },
    {
      id: "pressure_clutch_drill",
      name: "Clutch Pressure Drill",
      description: "Simulate end-of-game scenarios with consequences. Track heart rate and form consistency.",
      targetArea: "Clutch performance",
      duration: "15 minutes",
      difficulty: "elite",
    },
    {
      id: "longevity_mechanics",
      name: "Joint-Friendly Mechanics Review",
      description: "Analyze shooting motion for long-term joint health. Identify stress points and optimize for sustainability.",
      targetArea: "Career longevity",
      duration: "45 minutes (weekly)",
      difficulty: "elite",
    },
  ],
  
  analysisDepth: "elite",
  
  reportSections: [
    "Executive Summary with Key Metrics",
    "Comprehensive Form Score (Multi-Factor)",
    "NBA/Professional Benchmark Comparison",
    "Phase-by-Phase Biomechanical Analysis",
    "Micro-Movement Analysis (sub-degree precision)",
    "Consistency Variance Analysis",
    "Situational Performance Breakdown",
    "Clutch Performance Analysis",
    "Fatigue Impact Assessment",
    "Shot Selection Efficiency",
    "Biomechanical Efficiency Score",
    "Joint Stress & Injury Risk Analysis",
    "Comparison to Elite Shooters (by similar body type)",
    "Historical Trend Analysis (if available)",
    "Marginal Gains Opportunities",
    "Personalized Elite Drill Program",
    "Weekly/Monthly Training Periodization",
    "Recovery & Maintenance Recommendations",
    "Sport Science Insights",
    "Progress Goals with Projected Timeline",
  ],
}

// ==========================================
// ELEMENTARY TIER DETAILS (Enhanced)
// ==========================================

export const ELEMENTARY_TIER_DETAILS: TierAnalysisCriteria = {
  tier: "elementary",
  
  metrics: {
    elbowAngle: {
      min: 70,
      max: 110,
      optimal: 90,
      unit: "degrees",
    },
    kneeAngle: {
      min: 120,
      max: 170,
      optimal: 150,
      unit: "degrees",
    },
    shoulderAngle: {
      min: 70,
      max: 120,
      optimal: 95,
      unit: "degrees",
    },
    hipAngle: {
      min: 150,
      max: 180,
      optimal: 170,
      unit: "degrees",
    },
    releaseAngle: {
      min: 40,
      max: 60,
      optimal: 50,
      unit: "degrees",
    },
    releaseHeight: {
      min: 1.0,
      max: 1.3,
      optimal: 1.15,
      unit: "x height",
    },
    followThroughExtension: {
      min: 60,
      max: 100,
      optimal: 80,
      unit: "% full extension",
    },
    shotArc: {
      min: 35,
      max: 55,
      optimal: 45,
      unit: "degrees",
    },
    releaseTime: {
      min: 0.4,
      max: 0.8,
      optimal: 0.55,
      unit: "seconds",
    },
    balanceScore: {
      min: 50,
      max: 100,
      optimal: 75,
      unit: "score",
    },
  },
  
  benchmarks: [], // No benchmarks for elementary - focus on fundamentals, not comparisons
  
  drills: [
    {
      id: "balloon_shooting",
      name: "Balloon Ball Shooting",
      description: "Use a balloon instead of a basketball to practice form without worrying about making the shot.",
      targetArea: "Basic form",
      duration: "5 minutes",
      difficulty: "beginner",
    },
    {
      id: "wall_shooting",
      name: "Wall Shooting",
      description: "Stand 3 feet from a wall and practice shooting motion. Focus on elbow staying under the ball.",
      targetArea: "Elbow alignment",
      duration: "5 minutes",
      repetitions: 20,
      difficulty: "beginner",
    },
    {
      id: "gooseneck_practice",
      name: "Gooseneck Practice",
      description: "Practice the follow-through position (wrist bent down like a gooseneck). Hold for 3 seconds each time.",
      targetArea: "Follow-through",
      duration: "5 minutes",
      repetitions: 10,
      difficulty: "beginner",
    },
    {
      id: "one_hand_form",
      name: "One Hand Form Shooting",
      description: "Shoot with only your shooting hand from close range. Guide hand stays at your side.",
      targetArea: "Shooting hand mechanics",
      duration: "5 minutes",
      repetitions: 15,
      difficulty: "beginner",
    },
  ],
  
  analysisDepth: "basic",
  
  reportSections: [
    "Great Job Summary",
    "What You're Doing Well",
    "Fun Tips to Get Even Better",
    "Practice Games to Try",
  ],
}

// ==========================================
// MIDDLE SCHOOL TIER DETAILS (Enhanced)
// ==========================================

export const MIDDLE_SCHOOL_TIER_DETAILS: TierAnalysisCriteria = {
  tier: "middle_school",
  
  metrics: {
    elbowAngle: {
      min: 80,
      max: 100,
      optimal: 90,
      unit: "degrees",
    },
    kneeAngle: {
      min: 125,
      max: 165,
      optimal: 150,
      unit: "degrees",
    },
    shoulderAngle: {
      min: 80,
      max: 115,
      optimal: 95,
      unit: "degrees",
    },
    hipAngle: {
      min: 160,
      max: 180,
      optimal: 172,
      unit: "degrees",
    },
    releaseAngle: {
      min: 42,
      max: 58,
      optimal: 50,
      unit: "degrees",
    },
    releaseHeight: {
      min: 1.05,
      max: 1.30,
      optimal: 1.18,
      unit: "x height",
    },
    followThroughExtension: {
      min: 70,
      max: 100,
      optimal: 85,
      unit: "% full extension",
    },
    shotArc: {
      min: 40,
      max: 55,
      optimal: 47,
      unit: "degrees",
    },
    releaseTime: {
      min: 0.35,
      max: 0.60,
      optimal: 0.45,
      unit: "seconds",
    },
    balanceScore: {
      min: 60,
      max: 100,
      optimal: 80,
      unit: "score",
    },
  },
  
  benchmarks: [
    {
      metric: "Elbow Angle",
      average: 88,
      top25Percentile: 90,
      top10Percentile: 91,
      top5Percentile: 92,
      unit: "degrees",
    },
    {
      metric: "Shot Arc",
      average: 44,
      top25Percentile: 47,
      top10Percentile: 49,
      top5Percentile: 50,
      unit: "degrees",
    },
  ],
  
  drills: [
    {
      id: "beef_form",
      name: "B.E.E.F. Form Shooting",
      description: "Balance, Eyes, Elbow, Follow-through. Check each component on every shot.",
      targetArea: "Overall form",
      duration: "10 minutes",
      repetitions: 30,
      difficulty: "beginner",
    },
    {
      id: "partner_form_check",
      name: "Partner Form Check",
      description: "Partner watches and calls out if elbow flares or follow-through is incomplete.",
      targetArea: "Accountability",
      duration: "10 minutes",
      repetitions: 25,
      difficulty: "intermediate",
    },
    {
      id: "arc_shooting",
      name: "Arc Shooting Drill",
      description: "Aim to shoot over an imaginary barrier 2 feet above the rim. Focus on arc, not just making shots.",
      targetArea: "Shot arc",
      duration: "10 minutes",
      repetitions: 25,
      difficulty: "intermediate",
    },
  ],
  
  analysisDepth: "standard",
  
  reportSections: [
    "Form Score Summary",
    "What You're Doing Well",
    "Areas to Improve",
    "Your Measurements",
    "Practice Drills",
    "Goals for Next Time",
  ],
}

// ==========================================
// HIGH SCHOOL TIER DETAILS (Enhanced)
// ==========================================

export const HIGH_SCHOOL_TIER_DETAILS: TierAnalysisCriteria = {
  tier: "high_school",
  
  metrics: {
    elbowAngle: {
      min: 82,
      max: 98,
      optimal: 90,
      unit: "degrees",
    },
    kneeAngle: {
      min: 128,
      max: 162,
      optimal: 148,
      unit: "degrees",
    },
    shoulderAngle: {
      min: 82,
      max: 112,
      optimal: 95,
      unit: "degrees",
    },
    hipAngle: {
      min: 162,
      max: 180,
      optimal: 174,
      unit: "degrees",
    },
    releaseAngle: {
      min: 45,
      max: 56,
      optimal: 51,
      unit: "degrees",
    },
    releaseHeight: {
      min: 1.10,
      max: 1.32,
      optimal: 1.22,
      unit: "x height",
    },
    followThroughExtension: {
      min: 78,
      max: 100,
      optimal: 90,
      unit: "% full extension",
    },
    shotArc: {
      min: 43,
      max: 53,
      optimal: 48,
      unit: "degrees",
    },
    releaseTime: {
      min: 0.30,
      max: 0.50,
      optimal: 0.40,
      unit: "seconds",
    },
    balanceScore: {
      min: 68,
      max: 100,
      optimal: 85,
      unit: "score",
    },
  },
  
  benchmarks: [
    {
      metric: "Release Time",
      average: 0.42,
      top25Percentile: 0.38,
      top10Percentile: 0.35,
      top5Percentile: 0.32,
      unit: "seconds",
    },
    {
      metric: "Shot Arc",
      average: 45,
      top25Percentile: 47,
      top10Percentile: 49,
      top5Percentile: 51,
      unit: "degrees",
    },
    {
      metric: "Form Consistency",
      average: 65,
      top25Percentile: 75,
      top10Percentile: 82,
      top5Percentile: 88,
      unit: "%",
    },
    {
      metric: "Elbow Alignment",
      average: 72,
      top25Percentile: 80,
      top10Percentile: 86,
      top5Percentile: 91,
      unit: "% optimal",
    },
  ],
  
  drills: [
    {
      id: "spot_shooting",
      name: "5-Spot Shooting",
      description: "Shoot from 5 spots around the arc. Track makes from each spot. Goal: 70% from each.",
      targetArea: "Consistency",
      duration: "15 minutes",
      repetitions: 10,
      difficulty: "intermediate",
    },
    {
      id: "catch_and_shoot",
      name: "Catch and Shoot Series",
      description: "Partner passes, you catch and shoot immediately. No dribbles. Focus on quick release with good form.",
      targetArea: "Release speed",
      duration: "10 minutes",
      repetitions: 30,
      difficulty: "intermediate",
    },
    {
      id: "film_review",
      name: "Self Film Review",
      description: "Record 10 shots on your phone. Review and identify one area to improve.",
      targetArea: "Self-awareness",
      duration: "15 minutes",
      difficulty: "intermediate",
    },
    {
      id: "competitive_shooting",
      name: "Competitive Shooting Game",
      description: "Play knockout, HORSE, or 1-on-1 to test form under competitive pressure.",
      targetArea: "Pressure shooting",
      duration: "15 minutes",
      difficulty: "advanced",
    },
  ],
  
  analysisDepth: "detailed",
  
  reportSections: [
    "Performance Summary",
    "Form Score Breakdown",
    "Peer Comparison",
    "Detailed Metrics",
    "Strengths",
    "Areas for Improvement",
    "Competitive Context",
    "Drill Recommendations",
    "Weekly Practice Plan",
    "Goals",
  ],
}

// ==========================================
// LOOKUP AND UTILITY FUNCTIONS
// ==========================================

export const TIER_DETAILS: Record<CoachingTier, TierAnalysisCriteria> = {
  elementary: ELEMENTARY_TIER_DETAILS,
  middle_school: MIDDLE_SCHOOL_TIER_DETAILS,
  high_school: HIGH_SCHOOL_TIER_DETAILS,
  college: COLLEGE_TIER_DETAILS,
  professional: PROFESSIONAL_TIER_DETAILS,
}

/**
 * Get the detailed analysis criteria for a tier
 */
export function getTierDetails(tier: CoachingTier): TierAnalysisCriteria {
  return TIER_DETAILS[tier]
}

/**
 * Check if a metric value is within optimal range for a tier
 */
export function isMetricOptimal(
  tier: CoachingTier,
  metricName: keyof TierAnalysisCriteria["metrics"],
  value: number
): { isOptimal: boolean; deviation: number; feedback: string } {
  const details = getTierDetails(tier)
  const metric = details.metrics[metricName]
  
  const deviation = Math.abs(value - metric.optimal)
  const isOptimal = value >= metric.min && value <= metric.max
  
  let feedback = ""
  if (value < metric.min) {
    feedback = `Below optimal range. Increase by ${(metric.min - value).toFixed(1)}${metric.unit}`
  } else if (value > metric.max) {
    feedback = `Above optimal range. Decrease by ${(value - metric.max).toFixed(1)}${metric.unit}`
  } else if (deviation <= (metric.max - metric.min) * 0.1) {
    feedback = "Excellent! Very close to optimal."
  } else {
    feedback = "Good. Within acceptable range."
  }
  
  return { isOptimal, deviation, feedback }
}

/**
 * Get percentile ranking based on benchmarks
 */
export function getPercentileRanking(
  tier: CoachingTier,
  metricName: string,
  value: number
): { percentile: string; ranking: string } | null {
  const details = getTierDetails(tier)
  const benchmark = details.benchmarks.find((b) => b.metric === metricName)
  
  if (!benchmark) return null
  
  // Higher is better for most metrics, except variance metrics
  const isLowerBetter = metricName.includes("Variance") || metricName.includes("Time")
  
  if (isLowerBetter) {
    if (value <= benchmark.top5Percentile) return { percentile: "Top 5%", ranking: "Elite" }
    if (value <= benchmark.top10Percentile) return { percentile: "Top 10%", ranking: "Excellent" }
    if (value <= benchmark.top25Percentile) return { percentile: "Top 25%", ranking: "Above Average" }
    if (value <= benchmark.average) return { percentile: "Top 50%", ranking: "Average" }
    return { percentile: "Below Average", ranking: "Needs Work" }
  } else {
    if (value >= benchmark.top5Percentile) return { percentile: "Top 5%", ranking: "Elite" }
    if (value >= benchmark.top10Percentile) return { percentile: "Top 10%", ranking: "Excellent" }
    if (value >= benchmark.top25Percentile) return { percentile: "Top 25%", ranking: "Above Average" }
    if (value >= benchmark.average) return { percentile: "Top 50%", ranking: "Average" }
    return { percentile: "Below Average", ranking: "Needs Work" }
  }
}

/**
 * Get recommended drills based on weak areas
 */
export function getRecommendedDrills(
  tier: CoachingTier,
  weakAreas: string[]
): DrillRecommendation[] {
  const details = getTierDetails(tier)
  
  return details.drills.filter((drill) =>
    weakAreas.some((area) =>
      drill.targetArea.toLowerCase().includes(area.toLowerCase()) ||
      drill.name.toLowerCase().includes(area.toLowerCase())
    )
  )
}







