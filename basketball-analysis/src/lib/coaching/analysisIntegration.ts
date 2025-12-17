/**
 * Analysis Integration Service
 * 
 * Integrates coaching personas with the shooting analysis system.
 * Takes raw analysis data and transforms it based on the user's coaching tier.
 */

import { CoachingTier } from "@/stores/profileStore"
import { 
  getCoachingPersona, 
  interpretScore, 
  generateFeedback,
  CoachingPersona 
} from "./coachingPersonas"
import {
  getTierDetails,
  isMetricOptimal,
  getPercentileRanking,
  getRecommendedDrills,
  TierAnalysisCriteria,
  DrillRecommendation,
} from "./tierDetails"

// ==========================================
// TYPES
// ==========================================

export interface RawAnalysisData {
  // Detected angles and positions
  elbowAngle?: number
  shoulderAngle?: number
  kneeAngle?: number
  hipAngle?: number
  releaseAngle?: number
  releaseHeight?: number // Relative to player height
  followThroughExtension?: number
  shotArc?: number
  releaseTime?: number
  balanceScore?: number
  
  // Consistency metrics (from multiple shots)
  releasePointVariance?: number
  arcVariance?: number
  timingVariance?: number
  
  // Overall scores
  overallScore?: number
  formScore?: number
  
  // Body positions from Vision AI
  bodyPositions?: Record<string, { x: number; y: number; confidence?: number }>
  
  // Raw feedback from AI
  rawStrengths?: string[]
  rawImprovements?: string[]
  rawNotes?: string
}

export interface UserProfileData {
  coachingTier: CoachingTier
  age: number
  heightInches: number
  experienceLevel: string
  bodyType: string
  athleticAbility: number
  dominantHand: string
  shootingStyle: string
  bio?: string
}

export interface ProcessedAnalysis {
  // Tier-specific interpretation
  tier: CoachingTier
  tierDisplayName: string
  
  // Scores
  overallScore: number
  scoreInterpretation: string
  scoreCategory: "excellent" | "good" | "developing" | "needsWork"
  
  // Metrics (with tier-appropriate feedback)
  metrics: ProcessedMetric[]
  
  // Feedback (tier-appropriate language)
  strengths: ProcessedFeedback[]
  improvements: ProcessedFeedback[]
  tips: ProcessedFeedback[]
  
  // Comparisons (only for appropriate tiers)
  comparisons?: ComparisonData[]
  
  // Drills
  recommendedDrills: DrillRecommendation[]
  
  // Report sections (tier-specific)
  reportSections: string[]
  
  // Coaching notes
  coachingNotes: string
  
  // Meta
  analysisDepth: string
  timestamp: string
}

export interface ProcessedMetric {
  name: string
  value: number
  unit: string
  optimal: number
  isOptimal: boolean
  deviation: number
  feedback: string
  // Only for tiers with comparisons
  percentile?: string
  ranking?: string
}

export interface ProcessedFeedback {
  icon: string
  text: string
  priority: "high" | "medium" | "low"
  area?: string
}

export interface ComparisonData {
  metric: string
  userValue: number
  peerAverage: number
  percentile: string
  ranking: string
  unit: string
}

// ==========================================
// MAIN PROCESSING FUNCTION
// ==========================================

/**
 * Process raw analysis data with tier-specific interpretation
 */
export function processAnalysisWithPersona(
  rawData: RawAnalysisData,
  userProfile: UserProfileData
): ProcessedAnalysis {
  const { coachingTier } = userProfile
  const persona = getCoachingPersona(coachingTier)
  const tierDetails = getTierDetails(coachingTier)
  
  // Calculate overall score
  const overallScore = rawData.overallScore ?? calculateOverallScore(rawData, tierDetails)
  
  // Get score interpretation
  const scoreInterpretation = interpretScore(overallScore, coachingTier)
  const scoreCategory = getScoreCategory(overallScore, persona)
  
  // Process metrics
  const metrics = processMetrics(rawData, coachingTier, tierDetails, persona)
  
  // Identify weak areas for drill recommendations
  const weakAreas = metrics
    .filter((m) => !m.isOptimal && m.deviation > (tierDetails.metrics[m.name as keyof typeof tierDetails.metrics]?.max ?? 0) * 0.15)
    .map((m) => m.name)
  
  // Process feedback
  const strengths = processStrengths(rawData, metrics, persona)
  const improvements = processImprovements(rawData, metrics, persona)
  const tips = generateTips(weakAreas, persona)
  
  // Generate comparisons (only for high school and above)
  const comparisons = persona.tone.usePeerComparisons
    ? generateComparisons(rawData, coachingTier, tierDetails)
    : undefined
  
  // Get recommended drills
  const recommendedDrills = getRecommendedDrills(coachingTier, weakAreas.length > 0 ? weakAreas : ["form", "consistency"])
  
  // Generate coaching notes
  const coachingNotes = generateCoachingNotes(userProfile, overallScore, weakAreas, persona)
  
  return {
    tier: coachingTier,
    tierDisplayName: persona.displayName,
    overallScore,
    scoreInterpretation,
    scoreCategory,
    metrics,
    strengths,
    improvements,
    tips,
    comparisons,
    recommendedDrills: recommendedDrills.slice(0, 4), // Max 4 drills
    reportSections: tierDetails.reportSections,
    coachingNotes,
    analysisDepth: tierDetails.analysisDepth,
    timestamp: new Date().toISOString(),
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate overall score from individual metrics
 */
function calculateOverallScore(
  rawData: RawAnalysisData,
  tierDetails: TierAnalysisCriteria
): number {
  const weights = {
    elbowAngle: 0.15,
    shoulderAngle: 0.10,
    kneeAngle: 0.12,
    hipAngle: 0.08,
    releaseAngle: 0.12,
    followThroughExtension: 0.13,
    shotArc: 0.10,
    balanceScore: 0.12,
    releaseTime: 0.08,
  }
  
  let totalScore = 0
  let totalWeight = 0
  
  for (const [key, weight] of Object.entries(weights)) {
    const value = rawData[key as keyof RawAnalysisData] as number | undefined
    if (value === undefined) continue
    
    const metric = tierDetails.metrics[key as keyof typeof tierDetails.metrics]
    if (!metric) continue
    
    // Calculate how close to optimal (0-100)
    const range = metric.max - metric.min
    const deviation = Math.abs(value - metric.optimal)
    const score = Math.max(0, 100 - (deviation / range) * 100)
    
    totalScore += score * weight
    totalWeight += weight
  }
  
  return totalWeight > 0 ? Math.round(totalScore / totalWeight) : 50
}

/**
 * Get score category
 */
function getScoreCategory(
  score: number,
  persona: CoachingPersona
): "excellent" | "good" | "developing" | "needsWork" {
  const { scoreInterpretation } = persona
  
  if (score >= scoreInterpretation.excellent.min) return "excellent"
  if (score >= scoreInterpretation.good.min) return "good"
  if (score >= scoreInterpretation.developing.min) return "developing"
  return "needsWork"
}

/**
 * Process metrics with tier-specific feedback
 */
function processMetrics(
  rawData: RawAnalysisData,
  tier: CoachingTier,
  tierDetails: TierAnalysisCriteria,
  persona: CoachingPersona
): ProcessedMetric[] {
  const metrics: ProcessedMetric[] = []
  
  const metricMappings = [
    { key: "elbowAngle", name: "Elbow Angle" },
    { key: "shoulderAngle", name: "Shoulder Angle" },
    { key: "kneeAngle", name: "Knee Angle" },
    { key: "hipAngle", name: "Hip Angle" },
    { key: "releaseAngle", name: "Release Angle" },
    { key: "followThroughExtension", name: "Follow-Through" },
    { key: "shotArc", name: "Shot Arc" },
    { key: "balanceScore", name: "Balance" },
    { key: "releaseTime", name: "Release Time" },
  ]
  
  for (const { key, name } of metricMappings) {
    const value = rawData[key as keyof RawAnalysisData] as number | undefined
    if (value === undefined) continue
    
    const metricDef = tierDetails.metrics[key as keyof typeof tierDetails.metrics]
    if (!metricDef) continue
    
    const { isOptimal, deviation, feedback } = isMetricOptimal(tier, key as keyof typeof tierDetails.metrics, value)
    
    const processedMetric: ProcessedMetric = {
      name,
      value,
      unit: metricDef.unit,
      optimal: metricDef.optimal,
      isOptimal,
      deviation,
      feedback,
    }
    
    // Add percentile data for tiers with comparisons
    if (persona.tone.usePeerComparisons) {
      const ranking = getPercentileRanking(tier, name, value)
      if (ranking) {
        processedMetric.percentile = ranking.percentile
        processedMetric.ranking = ranking.ranking
      }
    }
    
    metrics.push(processedMetric)
  }
  
  return metrics
}

/**
 * Process strengths with tier-appropriate language
 */
function processStrengths(
  rawData: RawAnalysisData,
  metrics: ProcessedMetric[],
  persona: CoachingPersona
): ProcessedFeedback[] {
  const strengths: ProcessedFeedback[] = []
  
  // Find metrics that are optimal
  const optimalMetrics = metrics.filter((m) => m.isOptimal && m.deviation < 5)
  
  for (const metric of optimalMetrics.slice(0, 3)) {
    const text = generateFeedback(persona.tier, "positive", {
      area: metric.name.toLowerCase(),
      value: `${metric.value}${metric.unit === "degrees" ? "°" : metric.unit}`,
      comparison: metric.ranking ?? "excellent",
    })
    
    strengths.push({
      icon: persona.icons.success,
      text,
      priority: "high",
      area: metric.name,
    })
  }
  
  // Add raw strengths from AI if available
  if (rawData.rawStrengths) {
    for (const strength of rawData.rawStrengths.slice(0, 2)) {
      strengths.push({
        icon: persona.icons.success,
        text: strength,
        priority: "medium",
      })
    }
  }
  
  return strengths
}

/**
 * Process improvements with tier-appropriate language
 */
function processImprovements(
  rawData: RawAnalysisData,
  metrics: ProcessedMetric[],
  persona: CoachingPersona
): ProcessedFeedback[] {
  const improvements: ProcessedFeedback[] = []
  
  // Find metrics that need improvement
  const improvementMetrics = metrics
    .filter((m) => !m.isOptimal)
    .sort((a, b) => b.deviation - a.deviation)
  
  for (const metric of improvementMetrics.slice(0, 3)) {
    const text = generateFeedback(persona.tier, "improvement", {
      area: metric.name.toLowerCase(),
      value: `${metric.value}${metric.unit === "degrees" ? "°" : metric.unit}`,
      target: `${metric.optimal}${metric.unit === "degrees" ? "°" : metric.unit}`,
      amount: `${metric.deviation.toFixed(1)}${metric.unit === "degrees" ? "°" : metric.unit}`,
    })
    
    improvements.push({
      icon: persona.icons.improvement,
      text,
      priority: metric.deviation > 10 ? "high" : "medium",
      area: metric.name,
    })
  }
  
  // Add raw improvements from AI if available
  if (rawData.rawImprovements) {
    for (const improvement of rawData.rawImprovements.slice(0, 2)) {
      improvements.push({
        icon: persona.icons.improvement,
        text: improvement,
        priority: "medium",
      })
    }
  }
  
  return improvements
}

/**
 * Generate tips based on weak areas
 */
function generateTips(
  weakAreas: string[],
  persona: CoachingPersona
): ProcessedFeedback[] {
  const tips: ProcessedFeedback[] = []
  
  const tipMappings: Record<string, string> = {
    "Elbow Angle": "Practice form shooting with your elbow tucked in",
    "Shoulder Angle": "Focus on shoulder alignment during your setup",
    "Knee Angle": "Add more knee bend for power",
    "Hip Angle": "Keep your hips square to the basket",
    "Release Angle": "Focus on releasing at the peak of your jump",
    "Follow-Through": "Hold your follow-through for a count of 2",
    "Shot Arc": "Aim higher - imagine shooting over a defender's hand",
    "Balance": "Practice shooting with a narrower base first",
    "Release Time": "Work on catch-and-shoot drills for quicker release",
  }
  
  for (const area of weakAreas.slice(0, 2)) {
    const tip = tipMappings[area] || `Focus on improving your ${area.toLowerCase()}`
    
    const text = generateFeedback(persona.tier, "tip", { tip })
    
    tips.push({
      icon: persona.icons.tip,
      text,
      priority: "medium",
      area,
    })
  }
  
  return tips
}

/**
 * Generate comparison data for appropriate tiers
 */
function generateComparisons(
  rawData: RawAnalysisData,
  tier: CoachingTier,
  tierDetails: TierAnalysisCriteria
): ComparisonData[] {
  const comparisons: ComparisonData[] = []
  
  for (const benchmark of tierDetails.benchmarks.slice(0, 5)) {
    // Map benchmark metric names to raw data keys
    const metricMap: Record<string, keyof RawAnalysisData> = {
      "Release Time": "releaseTime",
      "Shot Arc": "shotArc",
      "Form Consistency": "formScore",
      "Release Point Variance": "releasePointVariance",
      "Elbow Alignment": "elbowAngle",
      "Balance Score": "balanceScore",
    }
    
    const dataKey = metricMap[benchmark.metric]
    if (!dataKey) continue
    
    const value = rawData[dataKey] as number | undefined
    if (value === undefined) continue
    
    const ranking = getPercentileRanking(tier, benchmark.metric, value)
    if (!ranking) continue
    
    comparisons.push({
      metric: benchmark.metric,
      userValue: value,
      peerAverage: benchmark.average,
      percentile: ranking.percentile,
      ranking: ranking.ranking,
      unit: benchmark.unit,
    })
  }
  
  return comparisons
}

/**
 * Generate coaching notes based on profile and analysis
 */
function generateCoachingNotes(
  userProfile: UserProfileData,
  overallScore: number,
  weakAreas: string[],
  persona: CoachingPersona
): string {
  const { encouragementLevel } = persona.tone // complexity not used
  
  let notes = ""
  
  // Opening based on tier
  switch (persona.tier) {
    case "elementary":
      notes = `Great job working on your shooting! You scored ${overallScore}/100 which is ${overallScore >= 70 ? "amazing" : "really good"} for your age. `
      break
    case "middle_school":
      notes = `Good work on your shooting form. Your score of ${overallScore}/100 shows you're developing solid fundamentals. `
      break
    case "high_school":
      notes = `Your form analysis shows a score of ${overallScore}/100. ${overallScore >= 75 ? "You're performing well against high school standards." : "There are clear areas to focus on for improvement."} `
      break
    case "college":
      notes = `Form analysis score: ${overallScore}/100. ${overallScore >= 82 ? "Your mechanics meet NCAA competitive standards." : "Focus areas identified for performance optimization."} `
      break
    case "professional":
      notes = `Biomechanical analysis score: ${overallScore}/100. ${overallScore >= 88 ? "Elite-level mechanics confirmed." : "Optimization opportunities identified."} `
      break
  }
  
  // Add personalization based on profile
  if (userProfile.shootingStyle && userProfile.shootingStyle !== "not_sure") {
    const styleText = userProfile.shootingStyle.replace("_", "-")
    notes += `As a ${styleText} shooter, `
    
    if (weakAreas.includes("Release Time")) {
      notes += userProfile.shootingStyle === "one_motion"
        ? "your release should be quick and fluid. "
        : "ensure your load phase is consistent before release. "
    }
  }
  
  // Add athletic ability consideration
  if (userProfile.athleticAbility) {
    if (userProfile.athleticAbility >= 8) {
      notes += "Your high athleticism allows for more explosive mechanics. "
    } else if (userProfile.athleticAbility <= 4) {
      notes += "Focus on technique and consistency rather than athleticism. "
    }
  }
  
  // Add body type consideration
  if (userProfile.bodyType) {
    switch (userProfile.bodyType) {
      case "ectomorph":
        notes += "Your lean build benefits from a higher release point. "
        break
      case "mesomorph":
        notes += "Your athletic build allows for balanced mechanics. "
        break
      case "endomorph":
        notes += "Use your lower center of gravity for better balance. "
        break
    }
  }
  
  // Add dominant hand note
  if (userProfile.dominantHand === "left") {
    notes += "As a left-handed shooter, you have a natural advantage against most defenders. "
  }
  
  // Closing encouragement based on tier
  if (encouragementLevel === "high") {
    notes += "Keep up the great work and have fun practicing!"
  } else if (encouragementLevel === "moderate") {
    notes += "Continue working on the highlighted areas to see improvement."
  } else {
    notes += "Focus on the identified optimization areas."
  }
  
  return notes
}

// ==========================================
// EXPORT ADDITIONAL UTILITIES
// ==========================================

/**
 * Get tier-specific prompt additions for Vision AI
 */
export function getTierPromptAdditions(tier: CoachingTier): string {
  const persona = getCoachingPersona(tier)
  const tierDetails = getTierDetails(tier)
  
  let prompt = `\n\n=== COACHING TIER: ${persona.displayName.toUpperCase()} ===\n`
  prompt += `Analysis Depth: ${tierDetails.analysisDepth}\n`
  prompt += `Focus Areas: ${tierDetails.reportSections.slice(0, 5).join(", ")}\n`
  
  if (persona.tone.useMetrics) {
    prompt += `\nProvide specific measurements for:\n`
    Object.keys(tierDetails.metrics).forEach((key) => {
      const metric = tierDetails.metrics[key as keyof typeof tierDetails.metrics]
      prompt += `- ${key}: optimal ${metric.optimal}${metric.unit}\n`
    })
  }
  
  if (persona.tone.usePeerComparisons) {
    prompt += `\nCompare to ${persona.displayName} benchmarks when possible.\n`
  }
  
  prompt += `\nTone: ${persona.tone.style}\n`
  prompt += `Complexity: ${persona.tone.complexity}\n`
  
  return prompt
}

/**
 * Format analysis report based on tier
 */
export function formatAnalysisReport(
  analysis: ProcessedAnalysis,
  format: "summary" | "detailed" | "full" = "detailed"
): string {
  const persona = getCoachingPersona(analysis.tier)
  let report = ""
  
  // Header
  report += `# ${persona.displayName} Shooting Analysis\n\n`
  
  // Score
  report += `## Overall Score: ${analysis.overallScore}/100\n`
  report += `${analysis.scoreInterpretation}\n\n`
  
  if (format === "summary") {
    // Brief summary only
    report += `### Quick Summary\n`
    report += `- ${analysis.strengths.length} strengths identified\n`
    report += `- ${analysis.improvements.length} areas for improvement\n`
    report += `- ${analysis.recommendedDrills.length} drills recommended\n`
    return report
  }
  
  // Strengths
  report += `## Strengths\n`
  for (const strength of analysis.strengths) {
    report += `${strength.icon} ${strength.text}\n`
  }
  report += "\n"
  
  // Improvements
  report += `## Areas to Improve\n`
  for (const improvement of analysis.improvements) {
    report += `${improvement.icon} ${improvement.text}\n`
  }
  report += "\n"
  
  // Tips
  if (analysis.tips.length > 0) {
    report += `## Tips\n`
    for (const tip of analysis.tips) {
      report += `${tip.icon} ${tip.text}\n`
    }
    report += "\n"
  }
  
  // Comparisons (if available)
  if (analysis.comparisons && analysis.comparisons.length > 0) {
    report += `## Peer Comparison\n`
    for (const comp of analysis.comparisons) {
      report += `- ${comp.metric}: ${comp.userValue}${comp.unit} (${comp.percentile} - ${comp.ranking})\n`
    }
    report += "\n"
  }
  
  // Drills
  report += `## Recommended Drills\n`
  for (const drill of analysis.recommendedDrills) {
    report += `### ${drill.name}\n`
    report += `${drill.description}\n`
    report += `*Target: ${drill.targetArea} | Duration: ${drill.duration}*\n\n`
  }
  
  // Coaching Notes
  report += `## Coach's Notes\n`
  report += `${analysis.coachingNotes}\n`
  
  return report
}







