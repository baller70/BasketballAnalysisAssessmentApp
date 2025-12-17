/**
 * Level-Based Coaching Persona System
 * 
 * Five tiers of coaching with different:
 * - Analysis focus areas
 * - Coaching tone
 * - Feedback complexity
 * - Comparison standards
 */

import { CoachingTier } from "@/stores/profileStore"

// ==========================================
// TYPES
// ==========================================

export interface CoachingFocus {
  id: string
  name: string
  description: string
  importance: "critical" | "important" | "helpful"
  metrics?: string[]
}

export interface FeedbackTemplate {
  positive: string[]
  improvement: string[]
  tip: string[]
}

export interface CoachingPersona {
  tier: CoachingTier
  displayName: string
  ageRange: string
  philosophy: string
  focusAreas: CoachingFocus[]
  tone: {
    style: string
    complexity: "simple" | "moderate" | "technical" | "professional"
    encouragementLevel: "high" | "moderate" | "balanced"
    useMetrics: boolean
    usePeerComparisons: boolean
  }
  feedbackTemplates: FeedbackTemplate
  scoreInterpretation: {
    excellent: { min: number; message: string }
    good: { min: number; message: string }
    developing: { min: number; message: string }
    needsWork: { min: number; message: string }
  }
  icons: {
    success: string
    improvement: string
    tip: string
    metric: string
    comparison: string
  }
}

// ==========================================
// TIER 1: ELEMENTARY (Ages 6-11)
// ==========================================

export const ELEMENTARY_PERSONA: CoachingPersona = {
  tier: "elementary",
  displayName: "Elementary Level",
  ageRange: "Ages 6-11",
  philosophy: "Focus on FUN and FUNDAMENTALS. Build good habits early through encouragement.",
  
  focusAreas: [
    {
      id: "basic_form",
      name: "Basic Form Fundamentals",
      description: "Is the ball being held correctly? Are feet roughly shoulder-width apart?",
      importance: "critical",
    },
    {
      id: "elbow_simple",
      name: "Elbow Alignment",
      description: "Is the elbow roughly under the ball?",
      importance: "important",
    },
    {
      id: "follow_through",
      name: "Follow-Through Presence",
      description: "Does the hand continue upward after release?",
      importance: "important",
    },
    {
      id: "balance",
      name: "Balance and Stance",
      description: "Are feet planted and body stable?",
      importance: "helpful",
    },
  ],
  
  tone: {
    style: "Encouraging and simple",
    complexity: "simple",
    encouragementLevel: "high",
    useMetrics: false,
    usePeerComparisons: false,
  },
  
  feedbackTemplates: {
    positive: [
      "Great job! That's exactly what we want to see!",
      "Excellent work! Keep it up!",
      "You're doing amazing! Your {area} looks great!",
      "Nice work on your {area}! That's perfect for your age!",
    ],
    improvement: [
      "Let's work on your {area} a little bit",
      "Try to {action} - you're almost there!",
      "Good try! Next time, see if you can {action}",
    ],
    tip: [
      "Here's a fun tip: {tip}",
      "Try this: {tip}",
      "A little trick: {tip}",
    ],
  },
  
  scoreInterpretation: {
    excellent: { min: 75, message: "Amazing job! Your form is excellent for your age!" },
    good: { min: 60, message: "Great work! You're doing really well!" },
    developing: { min: 40, message: "Good effort! Keep practicing and you'll get even better!" },
    needsWork: { min: 0, message: "Nice try! Let's work on some basics together!" },
  },
  
  icons: {
    success: "✓", // Green checkmark
    improvement: "★", // Target star
    tip: "💡", // Lightbulb (conceptual, use icon component)
    metric: "", // Not used at this level
    comparison: "", // Not used at this level
  },
}

// ==========================================
// TIER 2: MIDDLE SCHOOL (Ages 12-14)
// ==========================================

export const MIDDLE_SCHOOL_PERSONA: CoachingPersona = {
  tier: "middle_school",
  displayName: "Middle School Level",
  ageRange: "Ages 12-14",
  philosophy: "Refined technique with introduction to measurable goals. Players are developing strength and coordination.",
  
  focusAreas: [
    {
      id: "elbow_refined",
      name: "Refined Elbow Positioning",
      description: "Elbow angle should be closer to 90°, under the ball",
      importance: "critical",
      metrics: ["Elbow angle (optimal: 90°)"],
    },
    {
      id: "arc_intro",
      name: "Arc Trajectory",
      description: "Ball release angle and trajectory",
      importance: "critical",
      metrics: ["Shot arc (optimal: 45-50°)"],
    },
    {
      id: "footwork",
      name: "Footwork Basics",
      description: "Feet shoulder-width apart, aligned with basket",
      importance: "important",
    },
    {
      id: "release_consistency",
      name: "Release Point Consistency",
      description: "Same release point each time",
      importance: "important",
      metrics: ["Release height", "Release timing"],
    },
  ],
  
  tone: {
    style: "More technical but still accessible",
    complexity: "moderate",
    encouragementLevel: "moderate",
    useMetrics: true,
    usePeerComparisons: false,
  },
  
  feedbackTemplates: {
    positive: [
      "Your {area} is at {value} - that's very close to optimal!",
      "Excellent {area}! You're developing solid fundamentals.",
      "Your {area} is consistent across shots - excellent!",
    ],
    improvement: [
      "Your {area} is at {value}. Aim for {target} for better results.",
      "Try adjusting your {area} by {amount} for improvement.",
      "Focus on {area} in your next practice session.",
    ],
    tip: [
      "Focus on {tip} in your next practice",
      "Do {count} repetitions of {drill} to improve",
      "Watch how {action} affects your shot",
    ],
  },
  
  scoreInterpretation: {
    excellent: { min: 80, message: "Excellent form! You're developing solid fundamentals." },
    good: { min: 65, message: "Good form! Keep working on the details." },
    developing: { min: 50, message: "You're making progress! Focus on the areas highlighted." },
    needsWork: { min: 0, message: "Keep practicing! Here's what to focus on." },
  },
  
  icons: {
    success: "✓",
    improvement: "★",
    tip: "🎯", // Target icon
    metric: "📊", // Chart icon
    comparison: "",
  },
}

// ==========================================
// TIER 3: HIGH SCHOOL (Ages 15-18)
// ==========================================

export const HIGH_SCHOOL_PERSONA: CoachingPersona = {
  tier: "high_school",
  displayName: "High School Level",
  ageRange: "Ages 15-18",
  philosophy: "Performance-focused with peer comparisons. Competing at a higher level requires attention to detail.",
  
  focusAreas: [
    {
      id: "advanced_mechanics",
      name: "Advanced Mechanics",
      description: "Precise joint angles, timing of each phase, efficiency of motion",
      importance: "critical",
      metrics: ["Shoulder angle", "Elbow angle", "Wrist angle", "Knee angle", "Hip angle"],
    },
    {
      id: "shot_load",
      name: "Shot Load Analysis",
      description: "Knee bend depth, hip engagement, timing of the load",
      importance: "critical",
      metrics: ["Load depth", "Load timing"],
    },
    {
      id: "game_situation",
      name: "Game-Situation Shooting",
      description: "Form consistency under pressure, fatigue impact",
      importance: "important",
    },
    {
      id: "consistency_metrics",
      name: "Consistency Metrics",
      description: "Release point variance, arc variance, timing variance",
      importance: "important",
      metrics: ["Release variance", "Arc variance", "Timing variance"],
    },
  ],
  
  tone: {
    style: "Performance-focused with peer comparisons",
    complexity: "technical",
    encouragementLevel: "balanced",
    useMetrics: true,
    usePeerComparisons: true,
  },
  
  feedbackTemplates: {
    positive: [
      "Your {area} is {value} - that's {comparison} than the average high school player!",
      "Your {metric} ranks in the top {percentile}% of high school shooters.",
      "Excellent {area}! This is competitive-level quality.",
    ],
    improvement: [
      "Your {area} is {value}. Top players average {average}.",
      "Improving your {area} by {amount} would move you into the top {percentile}%.",
      "Focus on {area} to gain a competitive edge.",
    ],
    tip: [
      "Film study: Compare your {area} to NBA guards",
      "Practice game-situation shooting with pressure",
      "Work on {drill} to improve {area}",
    ],
  },
  
  scoreInterpretation: {
    excellent: { min: 85, message: "Excellent! Your form ranks in the top 20% of high school shooters." },
    good: { min: 70, message: "Strong form! You're performing well for your level." },
    developing: { min: 55, message: "Good foundation. Focus on highlighted areas to compete at a higher level." },
    needsWork: { min: 0, message: "Room for improvement. Here's your development plan." },
  },
  
  icons: {
    success: "✓",
    improvement: "★",
    tip: "🎯",
    metric: "📊",
    comparison: "📈", // Upward arrow / trend
  },
}

// ==========================================
// TIER 4: COLLEGE (Ages 19-22)
// ==========================================

export const COLLEGE_PERSONA: CoachingPersona = {
  tier: "college",
  displayName: "College Level",
  ageRange: "Ages 19-22",
  philosophy: "Elite athletes competing for scholarships and professional opportunities. Analysis must be precise and data-driven.",
  
  focusAreas: [
    {
      id: "elite_mechanics",
      name: "Elite Mechanics Refinement",
      description: "Micro-adjustments in joint angles, efficiency of motion, fatigue impact",
      importance: "critical",
      metrics: ["All joint angles", "Motion efficiency score", "Fatigue delta"],
    },
    {
      id: "shot_selection",
      name: "Shot Selection Intelligence",
      description: "Optimal positions, optimal timing, decision-making",
      importance: "critical",
    },
    {
      id: "pressure_performance",
      name: "Pressure Situation Performance",
      description: "Form changes under pressure, clutch shooting consistency",
      importance: "important",
      metrics: ["Pressure consistency score", "Clutch performance delta"],
    },
    {
      id: "advanced_biomechanics",
      name: "Advanced Biomechanics",
      description: "NCAA standard comparisons, injury prevention considerations",
      importance: "important",
      metrics: ["NCAA standard compliance", "Injury risk indicators"],
    },
  ],
  
  tone: {
    style: "Professional and data-driven",
    complexity: "professional",
    encouragementLevel: "balanced",
    useMetrics: true,
    usePeerComparisons: true,
  },
  
  feedbackTemplates: {
    positive: [
      "Your {metric} of {value} exceeds NCAA D1 average of {average}.",
      "Form consistency of {value}% is excellent for college level.",
      "Your {area} aligns with professional standards.",
    ],
    improvement: [
      "NCAA data shows optimal {metric} at {target}. You're at {value}.",
      "Adjusting {area} by {amount} would align with D1 standards.",
      "Focus on {area} - top programs prioritize this metric.",
    ],
    tip: [
      "Study {player}'s mechanics for {area} optimization",
      "Implement {drill} from collegiate training programs",
      "Consider {adjustment} based on biomechanical analysis",
    ],
  },
  
  scoreInterpretation: {
    excellent: { min: 88, message: "Elite form. Your mechanics meet professional standards." },
    good: { min: 75, message: "Strong form. Minor refinements will optimize performance." },
    developing: { min: 60, message: "Solid foundation. Focus areas identified for next-level performance." },
    needsWork: { min: 0, message: "Development opportunities identified. Here's your optimization plan." },
  },
  
  icons: {
    success: "✓",
    improvement: "★",
    tip: "🎯",
    metric: "📊",
    comparison: "🏆", // Trophy for elite comparisons
  },
}

// ==========================================
// TIER 5: PROFESSIONAL (Ages 23+)
// ==========================================

export const PROFESSIONAL_PERSONA: CoachingPersona = {
  tier: "professional",
  displayName: "Professional Level",
  ageRange: "Ages 23+",
  philosophy: "Micro-optimization and marginal gains. Every 0.1% improvement matters at this level.",
  
  focusAreas: [
    {
      id: "micro_optimization",
      name: "Micro-Optimization",
      description: "Sub-degree angle adjustments, millisecond timing refinements",
      importance: "critical",
      metrics: ["All metrics to 2 decimal precision"],
    },
    {
      id: "situational_analysis",
      name: "Situational Analysis",
      description: "Form variations by game situation, defender proximity, fatigue level",
      importance: "critical",
    },
    {
      id: "longevity",
      name: "Longevity & Injury Prevention",
      description: "Biomechanical stress points, sustainable mechanics",
      importance: "important",
      metrics: ["Joint stress indicators", "Sustainability score"],
    },
    {
      id: "marginal_gains",
      name: "Marginal Gains",
      description: "Identifying 0.1% improvements across all phases",
      importance: "important",
    },
  ],
  
  tone: {
    style: "Elite-level precision with professional terminology",
    complexity: "professional",
    encouragementLevel: "balanced",
    useMetrics: true,
    usePeerComparisons: true,
  },
  
  feedbackTemplates: {
    positive: [
      "Your {metric} of {value} is in the {percentile}th percentile of professional shooters.",
      "Biomechanical efficiency of {value}% indicates elite-level mechanics.",
      "Consistency variance of {value} is within professional standards.",
    ],
    improvement: [
      "A {amount} adjustment to {area} projects {improvement}% efficiency gain.",
      "Professional shooters average {average} for {metric}. You're at {value}.",
      "Optimization opportunity: {area} refinement for marginal gain.",
    ],
    tip: [
      "Implement {technique} used by {player} for {area} optimization",
      "Sport science research suggests {recommendation}",
      "Consider {adjustment} based on biomechanical modeling",
    ],
  },
  
  scoreInterpretation: {
    excellent: { min: 92, message: "Elite. Your mechanics are at the highest level." },
    good: { min: 82, message: "Professional-grade form with optimization opportunities." },
    developing: { min: 70, message: "Strong foundation. Refinement areas identified." },
    needsWork: { min: 0, message: "Development plan created for performance optimization." },
  },
  
  icons: {
    success: "✓",
    improvement: "★",
    tip: "🎯",
    metric: "📊",
    comparison: "🏆",
  },
}

// ==========================================
// PERSONA LOOKUP
// ==========================================

export const COACHING_PERSONAS: Record<CoachingTier, CoachingPersona> = {
  elementary: ELEMENTARY_PERSONA,
  middle_school: MIDDLE_SCHOOL_PERSONA,
  high_school: HIGH_SCHOOL_PERSONA,
  college: COLLEGE_PERSONA,
  professional: PROFESSIONAL_PERSONA,
}

/**
 * Get the coaching persona for a given tier
 */
export function getCoachingPersona(tier: CoachingTier): CoachingPersona {
  return COACHING_PERSONAS[tier]
}

/**
 * Get the coaching tier based on age
 */
export function getTierFromAge(age: number): CoachingTier {
  if (age >= 6 && age <= 11) return "elementary"
  if (age >= 12 && age <= 14) return "middle_school"
  if (age >= 15 && age <= 18) return "high_school"
  if (age >= 19 && age <= 22) return "college"
  return "professional"
}

/**
 * Interpret a score based on the coaching tier
 */
export function interpretScore(score: number, tier: CoachingTier): string {
  const persona = getCoachingPersona(tier)
  const { scoreInterpretation } = persona
  
  if (score >= scoreInterpretation.excellent.min) {
    return scoreInterpretation.excellent.message
  }
  if (score >= scoreInterpretation.good.min) {
    return scoreInterpretation.good.message
  }
  if (score >= scoreInterpretation.developing.min) {
    return scoreInterpretation.developing.message
  }
  return scoreInterpretation.needsWork.message
}

/**
 * Generate feedback based on tier and template type
 */
export function generateFeedback(
  tier: CoachingTier,
  type: "positive" | "improvement" | "tip",
  replacements: Record<string, string>
): string {
  const persona = getCoachingPersona(tier)
  const templates = persona.feedbackTemplates[type]
  const template = templates[Math.floor(Math.random() * templates.length)]
  
  // Replace placeholders
  let feedback = template
  for (const [key, value] of Object.entries(replacements)) {
    feedback = feedback.replace(`{${key}}`, value)
  }
  
  return feedback
}







