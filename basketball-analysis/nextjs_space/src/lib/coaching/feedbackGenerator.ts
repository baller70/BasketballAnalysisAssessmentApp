/**
 * Tier-Specific Feedback Generator
 * 
 * Generates personalized feedback based on the user's coaching tier,
 * profile data, and analysis results.
 */

import { CoachingTier } from "@/stores/profileStore"
import { getCoachingPersona, CoachingPersona } from "./coachingPersonas"
import { getTierDetails, TierAnalysisCriteria, DrillRecommendation } from "./tierDetails"

// ==========================================
// TYPES
// ==========================================

export interface FeedbackContext {
  coachingTier: CoachingTier
  overallScore: number
  metrics: {
    name: string
    value: number
    optimal: number
    isOptimal: boolean
  }[]
  profile?: {
    age?: number
    experienceLevel?: string
    bodyType?: string
    athleticAbility?: number
    dominantHand?: string
    shootingStyle?: string
    bio?: string
  }
}

export interface GeneratedFeedback {
  summary: string
  encouragement: string
  strengths: string[]
  improvements: string[]
  tips: string[]
  drills: DrillRecommendation[]
  nextSteps: string
}

// ==========================================
// FEEDBACK TEMPLATES BY TIER
// ==========================================

const SUMMARY_TEMPLATES: Record<CoachingTier, Record<string, string>> = {
  elementary: {
    excellent: "Wow! You're doing an amazing job with your shooting! 🏀",
    good: "Great work! Your shooting is really coming along!",
    developing: "Good effort! You're learning the right way to shoot!",
    needsWork: "Nice try! Let's work on some basics together!",
  },
  middle_school: {
    excellent: "Excellent form! You're developing into a strong shooter.",
    good: "Good work! Your fundamentals are solid.",
    developing: "You're making progress! Keep working on the highlighted areas.",
    needsWork: "Keep practicing! Here's what to focus on.",
  },
  high_school: {
    excellent: "Outstanding! Your form is competitive at the high school level.",
    good: "Strong performance. You're on track for success.",
    developing: "Solid foundation. Focus on the areas highlighted for improvement.",
    needsWork: "Room for growth. Here's your development plan.",
  },
  college: {
    excellent: "Elite form. Your mechanics meet NCAA competitive standards.",
    good: "Strong mechanics. Minor refinements will optimize performance.",
    developing: "Solid foundation with clear areas for optimization.",
    needsWork: "Development opportunities identified. Here's your optimization plan.",
  },
  professional: {
    excellent: "Elite-level mechanics confirmed. Micro-optimizations identified.",
    good: "Professional-grade form with optimization opportunities.",
    developing: "Strong foundation. Refinement areas identified.",
    needsWork: "Performance optimization plan created.",
  },
}

const ENCOURAGEMENT_TEMPLATES: Record<CoachingTier, string[]> = {
  elementary: [
    "Keep having fun and practicing!",
    "You're doing great - every shot makes you better!",
    "Practice makes progress!",
    "You're a shooting star in the making!",
  ],
  middle_school: [
    "Keep working hard and you'll see improvement!",
    "Your dedication is paying off.",
    "Stay focused on the fundamentals.",
    "Great players are made through practice.",
  ],
  high_school: [
    "Your commitment to improvement will pay dividends.",
    "Stay focused on your goals.",
    "The work you put in now builds your future.",
    "Champions are made in practice.",
  ],
  college: [
    "Continue to refine your technique.",
    "Elite performance requires elite preparation.",
    "Your attention to detail sets you apart.",
    "Consistency is the key to the next level.",
  ],
  professional: [
    "Marginal gains compound over time.",
    "Excellence is a continuous pursuit.",
    "Every rep is an opportunity for optimization.",
    "The details separate good from great.",
  ],
}

// ==========================================
// MAIN GENERATOR FUNCTION
// ==========================================

/**
 * Generate tier-appropriate feedback
 */
export function generateTierFeedback(context: FeedbackContext): GeneratedFeedback {
  const { coachingTier, overallScore, metrics, profile } = context
  const persona = getCoachingPersona(coachingTier)
  const tierDetails = getTierDetails(coachingTier)
  
  // Determine score category
  const scoreCategory = getScoreCategory(overallScore, persona)
  
  // Generate summary
  const summary = SUMMARY_TEMPLATES[coachingTier][scoreCategory]
  
  // Get encouragement
  const encouragementOptions = ENCOURAGEMENT_TEMPLATES[coachingTier]
  const encouragement = encouragementOptions[Math.floor(Math.random() * encouragementOptions.length)]
  
  // Generate strengths (optimal metrics)
  const optimalMetrics = metrics.filter((m) => m.isOptimal)
  const strengths = generateStrengths(optimalMetrics, persona, profile)
  
  // Generate improvements (non-optimal metrics)
  const improvementMetrics = metrics.filter((m) => !m.isOptimal)
  const improvements = generateImprovements(improvementMetrics, persona)
  
  // Generate tips
  const tips = generateTips(improvementMetrics, persona)
  
  // Get recommended drills
  const weakAreas = improvementMetrics.map((m) => m.name)
  const drills = getRecommendedDrillsForContext(weakAreas, tierDetails, 3)
  
  // Generate next steps
  const nextSteps = generateNextSteps(scoreCategory, coachingTier, weakAreas)
  
  return {
    summary,
    encouragement,
    strengths,
    improvements,
    tips,
    drills,
    nextSteps,
  }
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function getScoreCategory(
  score: number,
  persona: CoachingPersona
): "excellent" | "good" | "developing" | "needsWork" {
  if (score >= persona.scoreInterpretation.excellent.min) return "excellent"
  if (score >= persona.scoreInterpretation.good.min) return "good"
  if (score >= persona.scoreInterpretation.developing.min) return "developing"
  return "needsWork"
}

function generateStrengths(
  optimalMetrics: FeedbackContext["metrics"],
  persona: CoachingPersona,
  profile?: FeedbackContext["profile"]
): string[] {
  const strengths: string[] = []
  
  for (const metric of optimalMetrics.slice(0, 3)) {
    let strength = ""
    
    switch (persona.tier) {
      case "elementary":
        strength = `Great job with your ${metric.name.toLowerCase()}!`
        break
      case "middle_school":
        strength = `Your ${metric.name.toLowerCase()} is at ${metric.value}° - very close to optimal!`
        break
      case "high_school":
        strength = `${metric.name}: ${metric.value}° is excellent for your level.`
        break
      case "college":
        strength = `${metric.name} at ${metric.value}° meets NCAA standards.`
        break
      case "professional":
        strength = `${metric.name}: ${metric.value}° is within elite range.`
        break
    }
    
    strengths.push(strength)
  }
  
  // Add profile-specific strength if relevant
  if (profile?.bodyType && optimalMetrics.length > 0) {
    switch (profile.bodyType) {
      case "ectomorph":
        if (optimalMetrics.some((m) => m.name.includes("Release"))) {
          strengths.push("Your height gives you a natural advantage in release point.")
        }
        break
      case "mesomorph":
        if (optimalMetrics.some((m) => m.name.includes("Balance"))) {
          strengths.push("Your athletic build contributes to excellent balance.")
        }
        break
      case "endomorph":
        if (optimalMetrics.some((m) => m.name.includes("Knee") || m.name.includes("Hip"))) {
          strengths.push("Your lower center of gravity aids your stability.")
        }
        break
    }
  }
  
  return strengths
}

function generateImprovements(
  improvementMetrics: FeedbackContext["metrics"],
  persona: CoachingPersona
): string[] {
  const improvements: string[] = []
  
  // Sort by how far from optimal
  const sorted = [...improvementMetrics].sort(
    (a, b) => Math.abs(b.value - b.optimal) - Math.abs(a.value - a.optimal)
  )
  
  for (const metric of sorted.slice(0, 3)) {
    const deviation = metric.value - metric.optimal
    const direction = deviation > 0 ? "decrease" : "increase"
    const amount = Math.abs(deviation).toFixed(0)
    
    let improvement = ""
    
    switch (persona.tier) {
      case "elementary":
        improvement = `Let's work on your ${metric.name.toLowerCase()} a bit more!`
        break
      case "middle_school":
        improvement = `Your ${metric.name.toLowerCase()} is at ${metric.value}°. Try to ${direction} it by about ${amount}°.`
        break
      case "high_school":
        improvement = `${metric.name}: ${metric.value}° → Target: ${metric.optimal}°. ${direction.charAt(0).toUpperCase() + direction.slice(1)} by ${amount}°.`
        break
      case "college":
        improvement = `${metric.name} optimization: Current ${metric.value}°, NCAA optimal ${metric.optimal}°. Adjust ${direction} ${amount}°.`
        break
      case "professional":
        improvement = `${metric.name}: ${metric.value}° (target ${metric.optimal}°). ${amount}° adjustment for optimization.`
        break
    }
    
    improvements.push(improvement)
  }
  
  return improvements
}

function generateTips(
  improvementMetrics: FeedbackContext["metrics"],
  persona: CoachingPersona
): string[] {
  const tips: string[] = []
  
  const tipMap: Record<string, Record<CoachingTier, string>> = {
    "Elbow Angle": {
      elementary: "Keep your elbow tucked in like you're holding a pizza tray!",
      middle_school: "Focus on keeping your elbow at 90° - like an 'L' shape.",
      high_school: "Practice form shooting with focus on elbow position.",
      college: "Implement elbow alignment drills into your daily routine.",
      professional: "Use video analysis to track elbow consistency across sessions.",
    },
    "Knee Angle": {
      elementary: "Bend your knees like you're sitting in an invisible chair!",
      middle_school: "Add more knee bend for power - think 'sit down, shoot up'.",
      high_school: "Focus on consistent knee bend depth in practice.",
      college: "Track knee angle variance across shooting sessions.",
      professional: "Optimize knee angle based on shot distance and fatigue level.",
    },
    "Shot Arc": {
      elementary: "Try to shoot over an imaginary giant's head!",
      middle_school: "Aim higher - the ball should rainbow into the hoop.",
      high_school: "Practice with an arc training device or target above the rim.",
      college: "Analyze your arc angle using video capture tools.",
      professional: "Fine-tune arc based on entry angle optimization data.",
    },
    Balance: {
      elementary: "Make sure both feet are flat on the ground before you shoot!",
      middle_school: "Keep your feet shoulder-width apart and stay balanced.",
      high_school: "Practice shooting on a balance board to improve stability.",
      college: "Incorporate core stability exercises into your training.",
      professional: "Monitor balance metrics under various fatigue conditions.",
    },
  }
  
  for (const metric of improvementMetrics.slice(0, 2)) {
    const metricTips = tipMap[metric.name]
    if (metricTips) {
      tips.push(metricTips[persona.tier])
    }
  }
  
  // Add a general tip if we don't have enough
  if (tips.length === 0) {
    const generalTips: Record<CoachingTier, string> = {
      elementary: "Practice your shooting 10 times a day and have fun!",
      middle_school: "Focus on one thing at a time - master it, then move on.",
      high_school: "Film yourself shooting and compare to last month.",
      college: "Review film of elite shooters with similar builds.",
      professional: "Schedule regular biomechanical assessments.",
    }
    tips.push(generalTips[persona.tier])
  }
  
  return tips
}

function getRecommendedDrillsForContext(
  weakAreas: string[],
  tierDetails: TierAnalysisCriteria,
  maxDrills: number
): DrillRecommendation[] {
  if (weakAreas.length === 0) {
    // Return general drills if no specific weak areas
    return tierDetails.drills.slice(0, maxDrills)
  }
  
  // Map metric names to drill target areas
  const areaMapping: Record<string, string[]> = {
    "Elbow Angle": ["elbow", "form", "release"],
    "Knee Angle": ["knee", "power", "load"],
    "Shoulder Angle": ["shoulder", "form", "alignment"],
    "Hip Angle": ["hip", "balance", "stability"],
    "Shot Arc": ["arc", "trajectory", "release"],
    "Balance": ["balance", "stability", "footwork"],
    "Release Time": ["release", "speed", "catch"],
    "Follow-Through": ["follow", "wrist", "form"],
  }
  
  const targetKeywords: string[] = []
  for (const area of weakAreas) {
    const keywords = areaMapping[area] || [area.toLowerCase()]
    targetKeywords.push(...keywords)
  }
  
  // Find matching drills
  const matchingDrills = tierDetails.drills.filter((drill) =>
    targetKeywords.some(
      (keyword) =>
        drill.targetArea.toLowerCase().includes(keyword) ||
        drill.name.toLowerCase().includes(keyword) ||
        drill.description.toLowerCase().includes(keyword)
    )
  )
  
  if (matchingDrills.length >= maxDrills) {
    return matchingDrills.slice(0, maxDrills)
  }
  
  // Supplement with general drills
  const remainingDrills = tierDetails.drills.filter(
    (d) => !matchingDrills.includes(d)
  )
  
  return [
    ...matchingDrills,
    ...remainingDrills.slice(0, maxDrills - matchingDrills.length),
  ]
}

function generateNextSteps(
  scoreCategory: string,
  tier: CoachingTier,
  weakAreas: string[]
): string {
  const topWeakArea = weakAreas[0] || "form"
  
  const nextStepsMap: Record<CoachingTier, Record<string, string>> = {
    elementary: {
      excellent: "Keep practicing and having fun! Try shooting from different spots.",
      good: `Focus on your ${topWeakArea.toLowerCase()} in your next practice session.`,
      developing: `This week, work on your ${topWeakArea.toLowerCase()} for 5 minutes each day.`,
      needsWork: "Start with close-range shooting and focus on the basics.",
    },
    middle_school: {
      excellent: "Challenge yourself with more difficult shots while maintaining form.",
      good: `Dedicate practice time to improving your ${topWeakArea.toLowerCase()}.`,
      developing: `Create a weekly plan focusing on ${topWeakArea.toLowerCase()}.`,
      needsWork: "Go back to basics with form shooting drills.",
    },
    high_school: {
      excellent: "Work on situational shooting - off-screens, off-dribble.",
      good: `Target your ${topWeakArea.toLowerCase()} to reach the next level.`,
      developing: `Implement a structured program to address ${topWeakArea.toLowerCase()}.`,
      needsWork: "Establish a consistent practice routine with form fundamentals.",
    },
    college: {
      excellent: "Focus on maintaining form under game-speed conditions.",
      good: `Optimize ${topWeakArea.toLowerCase()} to meet NCAA elite standards.`,
      developing: `Work with coaching staff on ${topWeakArea.toLowerCase()} refinement.`,
      needsWork: "Create a comprehensive development plan with your coach.",
    },
    professional: {
      excellent: "Continue micro-optimization and track marginal gains.",
      good: `Schedule focused sessions on ${topWeakArea.toLowerCase()} optimization.`,
      developing: `Collaborate with sport scientists on ${topWeakArea.toLowerCase()}.`,
      needsWork: "Conduct a comprehensive biomechanical assessment.",
    },
  }
  
  return nextStepsMap[tier][scoreCategory]
}

// ==========================================
// EXPORT UTILITIES
// ==========================================

/**
 * Get tier display name
 */
export function getTierDisplayName(tier: CoachingTier): string {
  const names: Record<CoachingTier, string> = {
    elementary: "Elementary Level (Ages 6-11)",
    middle_school: "Middle School Level (Ages 12-14)",
    high_school: "High School Level (Ages 15-18)",
    college: "College Level (Ages 19-22)",
    professional: "Professional Level (Ages 23+)",
  }
  return names[tier]
}

/**
 * Get analysis icon based on status
 */
export function getStatusIcon(
  status: "excellent" | "good" | "developing" | "needsWork",
  tier: CoachingTier
): string {
  const persona = getCoachingPersona(tier)
  
  switch (status) {
    case "excellent":
      return persona.icons.success
    case "good":
      return persona.icons.success
    case "developing":
      return persona.icons.improvement
    case "needsWork":
      return persona.icons.tip
    default:
      return "•"
  }
}


