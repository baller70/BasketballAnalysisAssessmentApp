// Report Generation Service
// Generates Basic, Ultra, and Premium reports based on analysis

import { EliteShooterData } from "./eliteShooters"

// Types inlined from deleted module
export interface BiomechanicalAnalysis {
  elbowAngle: number;
  kneeAngle: number;
  shoulderAngle: number;
  hipAngle: number;
  releaseHeight: number;
  releaseAngle: number;
  balance: number;
}

export interface FormFlaw {
  id: number;
  title: string;
  description: string;
  severity: 'critical' | 'moderate' | 'minor';
  drills: string[];
}

export type ReportTier = "BASIC" | "ULTRA" | "PREMIUM"

export interface TrainingExercise {
  name: string
  duration: string
  reps?: number
  sets?: number
  description: string
}

export interface WeeklyPlan {
  day: string
  focus: string
  exercises: TrainingExercise[]
}

export interface Report {
  tier: ReportTier
  generatedAt: Date
  overallScore: number
  formCategory: "EXCELLENT" | "GOOD" | "NEEDS_IMPROVEMENT" | "POOR"
  summary: string
  measurements?: BiomechanicalAnalysis
  flaws?: FormFlaw[]
  matchedShooters?: Array<{ shooter: EliteShooterData; similarityScore: number }>
  weeklyPlan?: WeeklyPlan[]
  videoBreakdown?: string[]
  personalizedTips?: string[]
}

// Get form category from score
export function getFormCategory(score: number): Report["formCategory"] {
  if (score >= 85) return "EXCELLENT"
  if (score >= 70) return "GOOD"
  if (score >= 50) return "NEEDS_IMPROVEMENT"
  return "POOR"
}

// Generate summary based on analysis
function generateSummary(
  score: number,
  flaws: FormFlaw[],
  matchedShooter?: EliteShooterData
): string {
  const category = getFormCategory(score)
  let summary = ""

  switch (category) {
    case "EXCELLENT":
      summary = "Your shooting form demonstrates excellent fundamentals. "
      break
    case "GOOD":
      summary = "Your shooting form is solid with a few areas for refinement. "
      break
    case "NEEDS_IMPROVEMENT":
      summary = "Your shooting form has potential but needs focused improvement. "
      break
    case "POOR":
      summary = "Your shooting form requires significant adjustment to core mechanics. "
      break
  }

  if (flaws.length > 0) {
    const primaryFlaw = flaws[0]
    summary += `Primary focus area: ${primaryFlaw.title}. `
  }

  if (matchedShooter) {
    summary += `Your form most closely resembles ${matchedShooter.name}'s shooting style.`
  }

  return summary
}

// Generate weekly training plan
function generateWeeklyPlan(flaws: FormFlaw[]): WeeklyPlan[] {
  const plan: WeeklyPlan[] = [
    {
      day: "Monday",
      focus: "Form Fundamentals",
      exercises: [
        { name: "Wall Shooting", duration: "15 min", reps: 50, description: "Focus on elbow alignment and follow-through" },
        { name: "One-Hand Form Shots", duration: "10 min", reps: 30, description: "Shooting hand only from close range" },
      ],
    },
    {
      day: "Wednesday",
      focus: "Power Generation",
      exercises: [
        { name: "Catch-and-Shoot", duration: "20 min", reps: 40, description: "Focus on leg drive and rhythm" },
        { name: "Jump Squats", duration: "10 min", sets: 3, reps: 15, description: "Build leg power for shooting" },
      ],
    },
    {
      day: "Friday",
      focus: "Game Situations",
      exercises: [
        { name: "Off-Dribble Shots", duration: "15 min", reps: 30, description: "Practice pull-up jumpers" },
        { name: "Contested Shots", duration: "15 min", reps: 25, description: "Simulate game pressure" },
      ],
    },
  ]

  // Add flaw-specific exercises
  flaws.forEach((flaw) => {
    if (flaw.drills.length > 0) {
      plan[0].exercises.push({
        name: flaw.drills[0],
        duration: "10 min",
        description: `Corrective drill for ${flaw.title.toLowerCase()}`,
      })
    }
  })

  return plan
}

// Generate report based on tier
export function generateReport(
  tier: ReportTier,
  score: number,
  measurements: BiomechanicalAnalysis,
  flaws: FormFlaw[],
  matchedShooters: Array<{ shooter: EliteShooterData; similarityScore: number }>
): Report {
  const matchedShooter = matchedShooters[0]?.shooter
  const baseReport: Report = {
    tier,
    generatedAt: new Date(),
    overallScore: score,
    formCategory: getFormCategory(score),
    summary: generateSummary(score, flaws, matchedShooter),
  }

  // BASIC tier - just score and summary
  if (tier === "BASIC") {
    return baseReport
  }

  // ULTRA tier - add measurements and flaws
  if (tier === "ULTRA") {
    return {
      ...baseReport,
      measurements,
      flaws,
      matchedShooters: matchedShooters.slice(0, 1),
    }
  }

  // PREMIUM tier - full analysis with training plan
  return {
    ...baseReport,
    measurements,
    flaws,
    matchedShooters,
    weeklyPlan: generateWeeklyPlan(flaws),
    personalizedTips: [
      "Record yourself from multiple angles to track progress",
      "Focus on one correction at a time for best results",
      "Practice your form daily, even without a ball",
      "Study your matched shooter's form for visual reference",
    ],
    videoBreakdown: [
      "Frame 1-15: Set position analysis",
      "Frame 16-30: Upward motion and arm extension",
      "Frame 31-45: Release point and follow-through",
    ],
  }
}

