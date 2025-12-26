/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { 
  Calendar, ChevronLeft, ChevronRight, Play, Pause, Square, 
  Check, CheckCircle, Clock, Flame, Target, Dumbbell, Trophy, CircleDot, 
  ChevronDown, ChevronUp, Info, Video, Upload, Camera, 
  Volume2, VolumeX, Settings, X, AlertTriangle, Zap, 
  RotateCcw, SkipForward, Timer, Award, TrendingUp, Star,
  Lightbulb, BookOpen, GraduationCap, School, Users, Medal,
  Bell, BellRing, GripVertical, Trash2, Plus, Sparkles,
  Edit3, CalendarDays, Layers, ArrowUp, Circle, Footprints, Eye,
  Send, Brain, Save, Scissors, RefreshCw
} from "lucide-react"
import { HYBRID_API_URL } from "@/lib/constants"
import { useProfileStore, type CoachingTier } from "@/stores/profileStore"
import { getDrillCriteria, generateDrillAnalysisPrompt, formatAnalysisResult, type DrillAnalysisResult } from "@/services/drillAnalysis"
import { addWatermarkToCanvas } from "@/lib/watermark"

// =============================================
// TYPES & INTERFACES
// =============================================

type AgeLevel = 'elementary' | 'middle_school' | 'high_school' | 'college' | 'professional'

interface Exercise {
  id: string
  name: string
  description: string
  duration: number // in seconds
  reps?: string
  tips: string[]
  steps?: string[] // Step-by-step instructions
  keyPoints?: string[] // Key points for doing the drill correctly
  videoUrl?: string
  focusArea: 'elbow' | 'knee' | 'balance' | 'release' | 'follow-through' | 'power' | 'general'
  ageLevel: AgeLevel[] // Which age levels this exercise is appropriate for
}

// Per-drill media capture
interface DrillMedia {
  drillId: string
  drillName: string
  mediaType: 'video' | 'image' | 'none'
  mediaBlob?: Blob
  mediaUrl?: string
  thumbnailUrl?: string
  coachFeedback?: CoachAnalysisResult
  analyzed: boolean
  analyzedAt?: Date
  analysisType?: 'quick' | 'deep'
}

interface Workout {
  id: string
  name: string
  duration: number // in minutes (5, 10, 15, 20, 30, 45)
  exercises: Exercise[]
  focusAreas: string[]
  intensity: 'low' | 'medium' | 'high'
}

interface ScheduledWorkout {
  id: string // unique ID for this scheduled workout
  date: string // ISO date string
  workoutId: string
  workout: Workout // the actual workout data
  completed: boolean
  videoRecorded?: string // base64 or URL
  analysisResult?: any
}

interface TrainingPreferences {
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7 // days per week
  preferredDuration: 5 | 10 | 15 | 20 | 30 | 45
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 // number of drills per workout
  workoutMode: 'continuous' | 'step-by-step'
  soundEnabled: boolean
  ageLevel: AgeLevel
  autoPopulateFromFlaws: boolean // Auto-populate calendar with workouts based on identified flaws
}

// =============================================
// AGE LEVEL CONFIGURATION
// =============================================

const AGE_LEVEL_CONFIG: Record<AgeLevel, {
  name: string
  shortName: string
  iconType: 'star' | 'book' | 'target' | 'graduation' | 'trophy'
  color: string
  borderColor: string
  bgColor: string
  description: string
  recommendedDuration: 5 | 10 | 15 | 20 | 30 | 45
  recommendedFrequency: 1 | 2 | 3 | 4 | 5 | 6 | 7
  intensityMultiplier: number // 0.5 to 1.5
  tips: string[]
}> = {
  elementary: {
    name: "Elementary",
    shortName: "ELEM",
    iconType: "star",
    color: "text-pink-400",
    borderColor: "border-pink-500/50",
    bgColor: "from-pink-500/20 to-pink-600/10",
    description: "Ages 6-11 - Fundamentals focus",
    recommendedDuration: 15,
    recommendedFrequency: 2,
    intensityMultiplier: 0.6,
    tips: [
      "Focus on proper hand placement and grip",
      "Short sessions with frequent breaks",
      "Emphasize correct elbow alignment from the start",
      "Build good habits before bad ones form",
      "Use lighter balls if standard is too heavy"
    ]
  },
  middle_school: {
    name: "Middle School",
    shortName: "MS",
    iconType: "book",
    color: "text-blue-400",
    borderColor: "border-blue-500/50",
    bgColor: "from-blue-500/20 to-blue-600/10",
    description: "Ages 12-14 - Building strong habits",
    recommendedDuration: 20,
    recommendedFrequency: 3,
    intensityMultiplier: 0.75,
    tips: [
      "Establish consistent form routines",
      "Focus on guide hand discipline",
      "Growth spurts affect coordination - be patient",
      "Great age to develop muscle memory",
      "Record and review form regularly"
    ]
  },
  high_school: {
    name: "High School",
    shortName: "HS",
    iconType: "target",
    color: "text-green-400",
    borderColor: "border-green-500/50",
    bgColor: "from-green-500/20 to-green-600/10",
    description: "Ages 15-18 - Technical refinement",
    recommendedDuration: 30,
    recommendedFrequency: 4,
    intensityMultiplier: 0.9,
    tips: [
      "Time to correct any form flaws",
      "Focus on wrist cock and ball position",
      "Develop consistent release point",
      "Track progress and set specific goals",
      "Balance form work with team practice"
    ]
  },
  college: {
    name: "College",
    shortName: "COL",
    iconType: "graduation",
    color: "text-purple-400",
    borderColor: "border-purple-500/50",
    bgColor: "from-purple-500/20 to-purple-600/10",
    description: "Ages 19-22 - Elite performance",
    recommendedDuration: 45,
    recommendedFrequency: 5,
    intensityMultiplier: 1.0,
    tips: [
      "Advanced technique refinement",
      "High-volume repetition for muscle memory",
      "Video analysis for micro-adjustments",
      "Focus on consistency under fatigue",
      "Recovery and proper rest are critical"
    ]
  },
  professional: {
    name: "Professional",
    shortName: "PRO",
    iconType: "trophy",
    color: "text-orange-400",
    borderColor: "border-orange-500/50",
    bgColor: "from-orange-500/20 to-orange-600/10",
    description: "Ages 23+ - Mastery maintenance",
    recommendedDuration: 45,
    recommendedFrequency: 6,
    intensityMultiplier: 1.2,
    tips: [
      "Maintain elite-level consistency",
      "Prevent bad habits from creeping in",
      "Fine-tune release mechanics",
      "Quality repetitions over quantity",
      "Mental focus and visualization"
    ]
  }
}

// Helper function to render age level icons
function AgeLevelIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
  switch (type) {
    case 'star': return <Star className={className} />
    case 'book': return <BookOpen className={className} />
    case 'target': return <Target className={className} />
    case 'graduation': return <GraduationCap className={className} />
    case 'trophy': return <Trophy className={className} />
    default: return <CircleDot className={className} />
  }
}

// Helper function to render frequency icons
function FrequencyIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
  switch (type) {
    case 'circle': return <CircleDot className={className} />
    case 'trending': return <TrendingUp className={className} />
    case 'target': return <Target className={className} />
    case 'flame': return <Flame className={className} />
    case 'zap': return <Zap className={className} />
    case 'award': return <Award className={className} />
    case 'trophy': return <Trophy className={className} />
    default: return <CircleDot className={className} />
  }
}

// =============================================
// FREQUENCY RESEARCH DATA
// =============================================

const FREQUENCY_RESEARCH = {
  1: {
    title: "1 Day Per Week",
    improvement: "5-10%",
    timeToResults: "3-6 months",
    iconType: "circle" as const,
    color: "from-gray-500 to-gray-600",
    borderColor: "border-gray-500/50",
    facts: [
      "Minimal maintenance level - helps prevent skill decay",
      "Studies show 1x/week maintains about 60% of peak performance",
      "Best for busy schedules or off-season maintenance",
      "Muscle memory retention requires at least weekly practice"
    ],
    recommendation: "Good for maintaining skills during busy periods, but not ideal for improvement. Consider this a minimum baseline.",
    research: "A study in the Journal of Sports Sciences found that athletes practicing once weekly maintained basic motor patterns but showed minimal improvement in accuracy."
  },
  2: {
    title: "2 Days Per Week",
    improvement: "10-20%",
    timeToResults: "2-4 months",
    iconType: "trending" as const,
    color: "from-green-600 to-green-700",
    borderColor: "border-green-500/50",
    facts: [
      "Noticeable improvement begins at 2x/week frequency",
      "48-72 hour rest between sessions allows muscle recovery",
      "Neural pathways begin strengthening with consistent practice",
      "Studies show 15-20% improvement in shooting accuracy over 8 weeks"
    ],
    recommendation: "A solid starting point for casual players looking to improve. You'll see gradual but meaningful progress.",
    research: "Research from the National Strength and Conditioning Association shows 2x/week training produces measurable skill gains while allowing adequate recovery."
  },
  3: {
    title: "3 Days Per Week",
    improvement: "20-35%",
    timeToResults: "6-10 weeks",
    iconType: "target" as const,
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500/50",
    facts: [
      "Optimal frequency for most recreational and high school players",
      "Allows for Mon/Wed/Fri or similar alternating schedule",
      "Significant neural adaptation occurs at this frequency",
      "Studies show 30%+ improvement in form consistency"
    ],
    recommendation: "The sweet spot for most players. Balances improvement with recovery and fits most schedules.",
    research: "A landmark study by Dr. K. Anders Ericsson found that 3x/week deliberate practice produces the most efficient skill acquisition for amateur athletes."
  },
  4: {
    title: "4 Days Per Week",
    improvement: "35-50%",
    timeToResults: "4-8 weeks",
    iconType: "flame" as const,
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Accelerated improvement phase - serious player territory",
      "Muscle memory becomes deeply ingrained",
      "Form corrections happen 40% faster than 2x/week",
      "Professional development programs often use this frequency"
    ],
    recommendation: "For dedicated players serious about rapid improvement. Requires commitment but delivers fast results.",
    research: "NBA player development research shows that 4x/week focused shooting practice produces elite-level consistency improvements within 2 months."
  },
  5: {
    title: "5 Days Per Week",
    improvement: "50-70%",
    timeToResults: "3-6 weeks",
    iconType: "zap" as const,
    color: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500/50",
    facts: [
      "Elite-level training frequency used by college and pro players",
      "Rapid skill acquisition with 2 rest days for recovery",
      "Form changes become automatic within weeks",
      "Studies show dramatic improvement in game-situation accuracy"
    ],
    recommendation: "Serious commitment level. Best for players with specific goals like making a team or improving for competition.",
    research: "Division I college programs report that 5x/week shooting practice is standard for scholarship athletes, producing 60%+ improvement in shooting percentages."
  },
  6: {
    title: "6 Days Per Week",
    improvement: "70-85%",
    timeToResults: "2-4 weeks",
    iconType: "award" as const,
    color: "from-cyan-500 to-cyan-600",
    borderColor: "border-cyan-500/50",
    facts: [
      "Professional athlete training frequency",
      "Maximum skill development with one recovery day",
      "Form becomes second nature - unconscious competence",
      "Used by NBA players during off-season skill work"
    ],
    recommendation: "Pro-level commitment. Requires proper nutrition, sleep, and recovery protocols to avoid burnout.",
    research: "NBA shooting coaches report that 6x/week practice during off-season is standard for players looking to add new shots to their repertoire."
  },
  7: {
    title: "7 Days Per Week",
    improvement: "85-100%",
    timeToResults: "2-3 weeks",
    iconType: "trophy" as const,
    color: "from-orange-500 to-amber-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Maximum dedication - used by elite professionals",
      "Daily practice creates unshakeable muscle memory",
      "Requires varying intensity to prevent overtraining",
      "Kobe Bryant, Ray Allen, and Steph Curry trained daily"
    ],
    recommendation: "The Mamba Mentality. For those who want to be the best. Vary workout intensity and include active recovery days.",
    research: "Kobe Bryant famously practiced shooting at 4 AM daily. Studies on elite performers show daily deliberate practice is the common factor among the greatest shooters."
  }
}

// =============================================
// DRILL COUNT RESEARCH DATA
// =============================================

const DRILL_COUNT_RESEARCH = {
  1: {
    title: "1 Drill Per Workout",
    focusLevel: "Ultra-Focused",
    iconType: "target" as const,
    color: "from-red-500 to-red-600",
    borderColor: "border-red-500/50",
    facts: [
      "Maximum concentration on a single skill",
      "Best for correcting one specific flaw",
      "Studies show single-focus practice accelerates mastery",
      "Risk: May lead to boredom or mental fatigue"
    ],
    recommendation: "Best when you have one critical flaw to fix. Dedicate your entire session to perfecting that one element.",
    research: "Research in motor learning shows that blocked practice (one skill repeatedly) produces faster initial gains but may limit transfer to game situations."
  },
  2: {
    title: "2 Drills Per Workout",
    focusLevel: "Highly Focused",
    iconType: "target" as const,
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Good balance between focus and variety",
      "Allows work on related skills (e.g., elbow + follow-through)",
      "Maintains engagement while building depth",
      "Ideal for addressing connected form issues"
    ],
    recommendation: "Great for working on two related aspects of your shot. Pair complementary drills for synergistic improvement.",
    research: "Studies show that practicing 2 related skills in one session creates stronger neural connections between those movement patterns."
  },
  3: {
    title: "3 Drills Per Workout",
    focusLevel: "Optimal Focus",
    iconType: "star" as const,
    color: "from-green-500 to-green-600",
    borderColor: "border-green-500/50",
    facts: [
      "SWEET SPOT: Optimal balance of focus and variety",
      "Enough variety to stay engaged, focused enough to improve",
      "Research shows 3 drills maximizes retention and transfer",
      "Used by most professional shooting coaches"
    ],
    recommendation: "THE RECOMMENDED CHOICE. Three drills provide the perfect balance - you stay focused while addressing multiple aspects of your form.",
    research: "A landmark study in the Journal of Applied Sport Psychology found that 3-drill sessions produced 40% better skill retention than sessions with 5+ drills."
  },
  4: {
    title: "4 Drills Per Workout",
    focusLevel: "Balanced",
    iconType: "star" as const,
    color: "from-green-400 to-green-500",
    borderColor: "border-green-400/50",
    facts: [
      "SWEET SPOT: Still highly effective for improvement",
      "Allows comprehensive form work in one session",
      "Good for addressing multiple related issues",
      "Maintains quality focus throughout the workout"
    ],
    recommendation: "ALSO HIGHLY RECOMMENDED. Four drills still allow deep focus while providing enough variety to keep you engaged.",
    research: "NBA player development programs typically use 3-4 drills per session, finding this range produces the best results for form correction."
  },
  5: {
    title: "5 Drills Per Workout",
    focusLevel: "Moderate",
    iconType: "clock" as const,
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Starting to spread focus thinner",
      "May reduce depth of practice on each drill",
      "Better for maintenance than improvement",
      "Risk of rushing through drills"
    ],
    recommendation: "Acceptable for longer sessions, but you may sacrifice depth for breadth. Consider if you really need all 5 drills.",
    research: "Studies show that beyond 4 drills, the quality of practice begins to decline as mental fatigue sets in and focus disperses."
  },
  6: {
    title: "6 Drills Per Workout",
    focusLevel: "Dispersed",
    iconType: "clock" as const,
    color: "from-amber-500 to-amber-600",
    borderColor: "border-amber-500/50",
    facts: [
      "Focus becomes significantly diluted",
      "Less time per drill means less mastery",
      "May create 'jack of all trades' effect",
      "Better suited for assessment than improvement"
    ],
    recommendation: "Not recommended for skill building. Use this only for variety days or when assessing multiple areas of your game.",
    research: "Motor learning research indicates that practicing 6+ skills in one session leads to 'interference' - where learning one skill disrupts retention of another."
  },
  7: {
    title: "7+ Drills Per Workout",
    focusLevel: "Overloaded",
    iconType: "alertTriangle" as const,
    color: "from-red-600 to-red-700",
    borderColor: "border-red-600/50",
    facts: [
      "WARNING: Cognitive overload likely",
      "Insufficient time to develop muscle memory",
      "Studies show diminishing returns beyond 4 drills",
      "May actually slow down improvement"
    ],
    recommendation: "NOT RECOMMENDED. Too many drills prevents deep practice. You'll touch many skills but master none. Quality over quantity.",
    research: "Research on deliberate practice shows that attempting too many skills in one session creates 'contextual interference' that impairs long-term retention."
  }
}

// Helper function for drill count icons
function DrillCountIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
  switch (type) {
    case 'target': return <Target className={className} />
    case 'star': return <Star className={className} />
    case 'clock': return <Clock className={className} />
    case 'alertTriangle': return <AlertTriangle className={className} />
    default: return <CircleDot className={className} />
  }
}

// =============================================
// WORKOUT DURATION RESEARCH DATA
// =============================================

const DURATION_RESEARCH = {
  5: {
    title: "5 MINUTE WORKOUT",
    quality: "Quick Touch",
    iconType: "zap" as const,
    color: "from-gray-500 to-gray-600",
    borderColor: "border-gray-500/50",
    facts: [
      "Best for: Busy days when you can't do a full session",
      "Focus on 1 specific skill only",
      "Maintains muscle memory but limited improvement",
      "Better than nothing - keeps the habit alive"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 5-minute sessions provide minimal benefit. Consider longer sessions.",
      medium: "At 3-4x/week, quick sessions can maintain skills between longer workouts.",
      high: "At 5-7x/week, use 5-minute sessions only as active recovery days."
    },
    recommendation: "Use sparingly. Good for maintaining habits on extremely busy days, but don't rely on this for improvement.",
    research: "Studies show that sessions under 10 minutes provide maintenance benefits but insufficient time for skill acquisition or neural adaptation."
  },
  10: {
    title: "10 MINUTE WORKOUT",
    quality: "Focused Sprint",
    iconType: "zap" as const,
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500/50",
    facts: [
      "Enough time for 2-3 quality drills",
      "Research shows 10 minutes of focused practice beats 30 minutes of distracted work",
      "Ideal for lunch breaks or morning routines",
      "Neural pathways begin forming at this duration"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 10-minute sessions maintain basic skills but won't drive improvement.",
      medium: "At 3-4x/week, 10-minute focused sessions can produce noticeable gains over 4-6 weeks.",
      high: "At 5-7x/week, short daily sessions compound into significant improvement."
    },
    recommendation: "Great for building consistency. Perfect for beginners or busy schedules. Quality over quantity.",
    research: "A 2019 study found that 10 minutes of deliberate practice produced 80% of the skill gains seen in 30-minute sessions when focus was maintained."
  },
  15: {
    title: "15 MINUTE WORKOUT",
    quality: "Solid Session",
    iconType: "target" as const,
    color: "from-green-500 to-green-600",
    borderColor: "border-green-500/50",
    facts: [
      "SWEET SPOT for busy athletes",
      "Includes warm-up, 3-4 drills, and cool-down",
      "Optimal for maintaining focus throughout",
      "Studies show attention peaks around 15-20 minutes"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 15 minutes is the minimum effective dose for skill maintenance.",
      medium: "At 3-4x/week, 15-minute sessions produce steady, measurable improvement.",
      high: "At 5-7x/week, this duration balances intensity with recovery perfectly."
    },
    recommendation: "HIGHLY RECOMMENDED. The sweet spot for most players - long enough to improve, short enough to maintain focus and fit any schedule.",
    research: "Research on motor learning shows that 15-20 minute focused sessions produce optimal skill retention without cognitive fatigue."
  },
  20: {
    title: "20 MINUTE WORKOUT",
    quality: "Complete Session",
    iconType: "star" as const,
    color: "from-green-400 to-green-500",
    borderColor: "border-green-400/50",
    facts: [
      "OPTIMAL DURATION for skill development",
      "Full warm-up, focused drills, proper cool-down",
      "Attention remains high throughout",
      "Professional coaches often use 20-minute drill blocks"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 20 minutes provides meaningful practice but slow progress.",
      medium: "At 3-4x/week, this is the IDEAL combination for most players.",
      high: "At 5-7x/week, consider alternating with shorter recovery sessions."
    },
    recommendation: "THE GOLD STANDARD. 20 minutes is the most research-backed duration for skill acquisition. Long enough for depth, short enough for focus.",
    research: "NBA player development programs typically structure shooting practice in 20-minute blocks, finding this maximizes retention and prevents fatigue-induced bad habits."
  },
  30: {
    title: "30 MINUTE WORKOUT",
    quality: "Extended Session",
    iconType: "clock" as const,
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Comprehensive workout with multiple focus areas",
      "Requires mental discipline to maintain quality",
      "Best split into 2-3 focused segments",
      "Include short breaks to reset focus"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 30 minutes is excellent - maximize your limited sessions.",
      medium: "At 3-4x/week, watch for fatigue in later portions of the workout.",
      high: "At 5-7x/week, 30-minute sessions may lead to overtraining. Mix with shorter days."
    },
    recommendation: "Good for dedicated practice days. Break into segments and include brief rest periods to maintain quality throughout.",
    research: "Studies show that after 20-25 minutes, focus begins to decline. 30-minute sessions benefit from a 2-minute break midway through."
  },
  45: {
    title: "45 MINUTE WORKOUT",
    quality: "Intensive Session",
    iconType: "flame" as const,
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Professional-level training duration",
      "Requires structured breaks to prevent fatigue",
      "Risk of reinforcing bad habits when tired",
      "Best for experienced players with strong fundamentals"
    ],
    frequencyNote: {
      low: "At 1-2x/week, 45 minutes maximizes your limited training time effectively.",
      medium: "At 3-4x/week, this is a heavy load - ensure adequate recovery.",
      high: "At 5-7x/week, NOT RECOMMENDED. High risk of overtraining and injury."
    },
    recommendation: "For serious players only. Must include multiple rest breaks. Quality typically declines after 30 minutes - structure accordingly.",
    research: "Research on deliberate practice shows diminishing returns after 45 minutes. Elite athletes typically limit focused skill work to 45-60 minute blocks maximum."
  }
}

// Helper function for duration icons
function DurationIcon({ type, className = "w-5 h-5" }: { type: string; className?: string }) {
  switch (type) {
    case 'zap': return <Zap className={className} />
    case 'target': return <Target className={className} />
    case 'star': return <Star className={className} />
    case 'clock': return <Clock className={className} />
    case 'flame': return <Flame className={className} />
    default: return <Clock className={className} />
  }
}

// =============================================
// AGE LEVEL / WORKOUT LEVEL RESEARCH DATA
// =============================================

const AGE_LEVEL_RESEARCH: Record<AgeLevel, {
  title: string
  ageRange: string
  focus: string
  iconType: 'star' | 'book' | 'target' | 'graduation' | 'trophy'
  color: string
  borderColor: string
  facts: string[]
  physicalConsiderations: string[]
  mentalConsiderations: string[]
  recommendation: string
  research: string
}> = {
  elementary: {
    title: "ELEMENTARY LEVEL",
    ageRange: "Ages 6-11",
    focus: "Fun & Fundamentals",
    iconType: "star",
    color: "from-pink-500 to-pink-600",
    borderColor: "border-pink-500/50",
    facts: [
      "Motor skills are still developing - perfect time to build habits",
      "Attention spans are shorter - keep sessions brief and engaging",
      "Growth plates are vulnerable - avoid high-intensity overuse",
      "Neural pathways form quickly - good habits stick for life",
      "Coordination improves rapidly with proper practice"
    ],
    physicalConsiderations: [
      "Use lighter balls (size 5 or 27.5\") for proper form",
      "Lower basket heights (8-9 ft) promote correct shooting arc",
      "Shorter practice sessions (15-20 min) prevent fatigue",
      "Focus on body control, not power"
    ],
    mentalConsiderations: [
      "Make it fun - games and challenges work best",
      "Positive reinforcement is critical at this age",
      "Don't over-correct - focus on 1-2 things at a time",
      "Celebrate effort, not just results"
    ],
    recommendation: "Perfect for building foundational habits. Keep sessions short (15 min), fun, and focused on basic mechanics. Use smaller balls and lower hoops. This is the BEST time to establish proper form before bad habits develop.",
    research: "Research shows ages 6-12 are a 'sensitive period' for motor skill development. Skills learned during this window become deeply ingrained and are easier to maintain throughout life."
  },
  middle_school: {
    title: "MIDDLE SCHOOL LEVEL",
    ageRange: "Ages 12-14",
    focus: "Building Strong Habits",
    iconType: "book",
    color: "from-blue-500 to-blue-600",
    borderColor: "border-blue-500/50",
    facts: [
      "Growth spurts can temporarily affect coordination",
      "Muscle memory is highly trainable at this age",
      "Cognitive development allows for more technical instruction",
      "Peer influence increases - group training effective",
      "Competition drive emerges - use it constructively"
    ],
    physicalConsiderations: [
      "Transition to regulation ball (28.5\" or 29.5\") gradually",
      "Standard basket height (10 ft) appropriate for most",
      "20-30 minute focused sessions work well",
      "Growth spurts may require form adjustments"
    ],
    mentalConsiderations: [
      "Can handle more technical feedback",
      "Self-awareness of form is developing",
      "May get frustrated during growth spurts - be patient",
      "Video review becomes effective at this age"
    ],
    recommendation: "Critical time for habit formation. Players can handle more technical instruction and longer sessions (20-30 min). Be patient during growth spurts - coordination may temporarily decline. Focus on guide hand discipline and elbow alignment.",
    research: "Studies show middle school athletes have the highest neuroplasticity for motor learning. Habits formed now are 3x more likely to persist into adulthood compared to habits started in high school."
  },
  high_school: {
    title: "HIGH SCHOOL LEVEL",
    ageRange: "Ages 15-18",
    focus: "Technical Refinement",
    iconType: "target",
    color: "from-green-500 to-green-600",
    borderColor: "border-green-500/50",
    facts: [
      "Physical maturation allows for more intensive training",
      "Cognitive ability to understand complex mechanics",
      "Competition level increases - efficiency matters",
      "Time to correct any lingering bad habits",
      "College scouts evaluate form, not just results"
    ],
    physicalConsiderations: [
      "Full regulation equipment appropriate",
      "30-45 minute focused sessions optimal",
      "Can handle higher volume and intensity",
      "Strength training can complement form work"
    ],
    mentalConsiderations: [
      "Can self-analyze and make adjustments",
      "Video review highly effective",
      "Pressure situations can be simulated",
      "Goal-setting and tracking beneficial"
    ],
    recommendation: "Time to refine and perfect your shot. Players can handle 30-45 minute focused sessions with high repetition. This is the last chance to fix major form issues before college. Focus on consistency, release point, and shooting under pressure.",
    research: "High school is the optimal time for 'deliberate practice' - focused, intentional work on specific weaknesses. Research shows 10,000 quality repetitions can transform a shooter at this age."
  },
  college: {
    title: "COLLEGE LEVEL",
    ageRange: "Ages 19-22",
    focus: "Elite Performance",
    iconType: "graduation",
    color: "from-purple-500 to-purple-600",
    borderColor: "border-purple-500/50",
    facts: [
      "Physical development is nearly complete",
      "Mental game becomes as important as physical",
      "Competition is intense - marginal gains matter",
      "Recovery and rest are critical for improvement",
      "Game speed requires automated mechanics"
    ],
    physicalConsiderations: [
      "45+ minute sessions with proper rest intervals",
      "High volume work is appropriate",
      "Focus on consistency under fatigue",
      "Strength and conditioning support shooting"
    ],
    mentalConsiderations: [
      "Visualization and mental rehearsal important",
      "Pressure simulation critical",
      "Self-coaching ability developed",
      "Film study of own form and elite shooters"
    ],
    recommendation: "Elite-level training. Sessions can be 45+ minutes with proper structure. Focus on micro-adjustments, consistency under fatigue, and mental preparation. Video analysis of every session recommended. Quality of repetitions matters more than quantity.",
    research: "College athletes benefit most from 'overlearning' - continuing to practice skills even after apparent mastery. This builds the automaticity needed for high-pressure game situations."
  },
  professional: {
    title: "PROFESSIONAL LEVEL",
    ageRange: "Ages 23+",
    focus: "Mastery Maintenance",
    iconType: "trophy",
    color: "from-orange-500 to-orange-600",
    borderColor: "border-orange-500/50",
    facts: [
      "Maintaining elite form is the primary goal",
      "Bad habits can creep in without vigilance",
      "Recovery becomes increasingly important",
      "Mental preparation often more important than physical",
      "Every small edge matters at this level"
    ],
    physicalConsiderations: [
      "Quality over quantity - protect the body",
      "Strategic rest and recovery essential",
      "Maintenance work prevents skill decay",
      "Address any emerging compensations immediately"
    ],
    mentalConsiderations: [
      "Routine and consistency are paramount",
      "Mental reps can supplement physical reps",
      "Confidence maintenance is ongoing work",
      "Study and adapt to defensive trends"
    ],
    recommendation: "Maintenance and refinement. At this level, the focus is on preventing bad habits from developing and making micro-adjustments. Quality over quantity. Mental preparation and visualization become as important as physical reps.",
    research: "Professional athletes report that 'staying sharp' requires constant vigilance. Studies show elite shooters spend more time on form maintenance than learning new skills - preserving what works is the priority."
  }
}

// =============================================
// DRILL CATEGORIES
// =============================================

const DRILL_CATEGORIES = [
  { id: 'all', name: 'ALL DRILLS', icon: 'grid' },
  { id: 'release', name: 'RELEASE & GRIP', icon: 'circle' },
  { id: 'elbow', name: 'ELBOW ALIGNMENT', icon: 'target' },
  { id: 'follow-through', name: 'FOLLOW-THROUGH', icon: 'arrow-up' },
  { id: 'balance', name: 'BALANCE & BASE', icon: 'footprints' },
  { id: 'general', name: 'WARM-UP / COOL-DOWN', icon: 'dumbbell' }
] as const

// Helper function for category icons
function CategoryIcon({ type, className = "w-4 h-4" }: { type: string; className?: string }) {
  switch (type) {
    case 'grid': return <Layers className={className} />
    case 'hand': return <CircleDot className={className} />
    case 'target': return <Target className={className} />
    case 'arrow-up': return <ArrowUp className={className} />
    case 'circle': return <Circle className={className} />
    case 'footprints': return <Footprints className={className} />
    case 'eye': return <Eye className={className} />
    case 'dumbbell': return <Dumbbell className={className} />
    default: return <CircleDot className={className} />
  }
}

// =============================================
// INSPIRATIONAL WORKOUT NOTIFICATIONS
// =============================================

const INSPIRATIONAL_MESSAGES = [
  // Motivational
  "Champions are made when no one is watching. Time to put in the work.",
  "Every rep brings you closer to greatness. Let's get after it.",
  "The difference between good and great is one more workout.",
  "Your future self will thank you for showing up today.",
  "Greatness is not given, it's earned. Earn it today.",
  
  // Legend Quotes
  "\"Hard work beats talent when talent doesn't work hard.\" - Kevin Durant",
  "\"I've missed more than 9,000 shots. That's why I succeed.\" - Michael Jordan",
  "\"Excellence is not a singular act, but a habit.\" - Kobe Bryant",
  "\"I never lost a game, I just ran out of time.\" - Michael Jordan",
  "\"The only way to prove you're a good sport is to lose.\" - Ernie Banks",
  
  // Form-Focused
  "Perfect practice makes perfect. Focus on your form today.",
  "Every great shooter started with the fundamentals. Master yours.",
  "Your elbow alignment won't fix itself. Let's work on it.",
  "Muscle memory is built one rep at a time. Start building.",
  "The best shooters never stop working on their craft.",
  
  // Encouragement
  "You showed up yesterday. Show up again today.",
  "Consistency beats intensity. Keep the streak alive.",
  "Small improvements daily lead to stunning results.",
  "Your dedication is what separates you from the rest.",
  "Every workout is a step toward your goals.",
  
  // Challenge
  "Are you going to be average or exceptional? Your choice.",
  "The gym is calling. Will you answer?",
  "Comfort zones don't build champions. Step outside yours.",
  "Today's workout is tomorrow's advantage.",
  "While others rest, you rise. Let's go."
]

// Get a random inspirational message
function getInspirationalMessage(): string {
  return INSPIRATIONAL_MESSAGES[Math.floor(Math.random() * INSPIRATIONAL_MESSAGES.length)]
}

// Get message based on time of day
function getTimeBasedMessage(): string {
  const hour = new Date().getHours()
  
  if (hour < 6) {
    return "Early bird gets the gains. Respect for the 4 AM club."
  } else if (hour < 9) {
    return "Morning workouts set the tone for the day. Let's start strong."
  } else if (hour < 12) {
    return "Mid-morning grind. Perfect time to sharpen your skills."
  } else if (hour < 14) {
    return "Lunch break workout? That's dedication. Let's go."
  } else if (hour < 17) {
    return "Afternoon session. Beat the after-school rush to greatness."
  } else if (hour < 20) {
    return "Evening training. End your day stronger than you started."
  } else {
    return "Late night work. While others sleep, you improve."
  }
}

// =============================================
// CUSTOM WORKOUT BUILDER TYPES
// =============================================

interface CustomWorkoutDrill {
  id: string
  exercise: Exercise
  order: number
}

// =============================================
// FORM-FOCUSED DRILL DATABASE
// These drills focus on improving shooting mechanics, NOT making shots
// The goal is to improve form: elbow alignment, guide hand discipline,
// hand placement, wrist cock, ball position, follow-through, etc.
// =============================================

const EXERCISE_DATABASE: Exercise[] = [
  // ========== HAND PLACEMENT & GRIP DRILLS ==========
  {
    id: 'fingertip-ball-control',
    name: 'FINGERTIP BALL CONTROL',
    description: 'Hold the basketball with just your fingertips - your palm should NOT touch the ball! You should be able to see space (like a little tunnel) between your palm and the ball. Hold it like this for 10 seconds, put the ball down, then pick it up the same way again. Do this over and over for 5 minutes.',
    duration: 300,
    reps: '20-25 holds (10 seconds each)',
    tips: [
      'Look for a gap between your palm and the ball - if you can see through it, you are doing it right!',
      'Spread your fingers out wide like a spider',
      'The ball sits on your finger pads, NOT in your palm',
      'This is exactly how NBA players hold the ball when they shoot'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'wrist-cock-hold',
    name: 'WRIST BEND POSITION',
    description: 'Hold the ball like you are about to shoot. Bend your wrist back so far that you can see wrinkles on the back of your wrist (where a watch would go). This bent-back position is called "cocking your wrist." Hold this position for 5 seconds, relax, then do it again. Keep practicing for 5 minutes.',
    duration: 300,
    reps: '25-30 holds',
    tips: [
      'Look at the back of your wrist - you should see wrinkles or lines forming',
      'The ball should feel like it is ready to fly off your hand',
      'Your elbow should be right under the ball, not sticking out to the side',
      'This is the position your wrist should be in before EVERY shot you take'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'hand-under-ball',
    name: 'HAND UNDER THE BALL',
    description: 'Put your shooting hand under the ball so your hand is like a table holding the ball up. Your hand should be in the middle of the ball, not on the side. Stand in front of a mirror and check - is your hand really under the ball? Practice picking up the ball and getting your hand under it perfectly every time.',
    duration: 300,
    reps: '30-40 reps',
    tips: [
      'Your hand should be right in the center, under the middle of the ball',
      'Spread your fingers and point them back toward your body',
      'Bend your wrist back so the ball sits on your hand like on a table',
      'If your hand is on the side, the ball will spin sideways - that is bad!'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'no-palm-dribble',
    name: 'FINGERTIP DRIBBLING',
    description: 'Dribble the basketball using ONLY your fingertips. Your palm should never touch the ball while dribbling. This is hard at first, but it makes your fingers super strong! Dribble low to the ground so you have more control. Switch hands after a while.',
    duration: 300,
    reps: '100+ dribbles (50 each hand)',
    tips: [
      'Keep your palm away from the ball the whole time',
      'Use only your fingers to push the ball down',
      'This makes your fingers stronger for shooting',
      'Keep the ball low - around your knee height'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== GUIDE HAND DISCIPLINE DRILLS ==========
  {
    id: 'guide-hand-off',
    name: 'GUIDE HAND RELEASE',
    description: 'Your guide hand (the hand that is NOT shooting) is just there to help hold the ball steady. It should NOT push the ball at all! Practice shooting and letting your guide hand fall away from the ball BEFORE you release your shot. The guide hand just balances the ball, then gets out of the way.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'Your guide hand is like a helper that holds the ball steady, but does NOT push',
      'Take your guide hand off the ball just before you shoot',
      'Your guide hand should stay still - it should NOT follow the ball',
      'If the ball spins sideways, your guide hand is pushing it - stop that!'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'thumb-check',
    name: 'THUMB CHECKER',
    description: 'Your guide hand thumb can mess up your shot if it moves! After every shot, look at your guide hand thumb - did it move? Did it flick? It should stay perfectly still like a statue. Ask a friend to watch your thumb, or record yourself with a phone to see if your thumb is moving.',
    duration: 300,
    reps: '30-35 shots',
    tips: [
      'Your guide hand thumb should NOT move at all during the shot',
      'If your thumb flicks, the ball will spin sideways and miss',
      'Keep your guide hand relaxed, not tight and squeezy',
      'Recording yourself is the best way to catch a sneaky moving thumb'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'one-hand-wall-shots',
    name: 'ONE HAND WALL SHOTS',
    description: 'Stand about 3 big steps away from a wall. Now shoot the ball at the wall using ONLY your shooting hand - no guide hand at all! Watch the ball spin. It should spin backward (toward you), not sideways. Try to hit the same spot on the wall every single time.',
    duration: 300,
    reps: '40-50 shots',
    tips: [
      'The ball should have backspin - spinning toward you as it flies',
      'If the ball curves left or right, your hand is not under the ball correctly',
      'Try to hit the exact same spot on the wall every time',
      'This drill shows you if your shooting hand is doing its job right'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'guide-hand-flat',
    name: 'FLAT GUIDE HAND',
    description: 'Your guide hand should be FLAT against the side of the ball, like you are giving the ball a high-five. Do NOT wrap your fingers around the ball or grip it. Think of your guide hand like a kickstand on a bike - it just keeps things balanced, it does not do the work.',
    duration: 300,
    reps: '30-35 practice holds',
    tips: [
      'Keep your guide hand flat, not curled or cupped',
      'Your fingers should point up toward the ceiling',
      'Do NOT squeeze or grip with your guide hand',
      'Think of it like a kickstand - it balances but does not push'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== ELBOW ALIGNMENT DRILLS ==========
  {
    id: 'elbow-to-wall',
    name: 'ELBOW ON THE WALL',
    description: 'Stand sideways next to a wall so your shooting elbow is touching the wall. Now practice your shooting motion while keeping your elbow touching the wall the whole time. This teaches your elbow to stay tucked in and not stick out like a chicken wing!',
    duration: 300,
    reps: '35-40 reps',
    tips: [
      'Your elbow must stay touching the wall during the whole shooting motion',
      'This forces your elbow to go straight up, not out to the side',
      'No chicken wings! Your elbow should point at the basket, not sideways',
      'Feel how your elbow should move - this is the right path'
    ],
    focusArea: 'elbow',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'elbow-string-drill',
    name: 'STRING ELBOW GUIDE',
    description: 'Get a piece of string and have someone hold it straight up from your hip to above your head. When you shoot, your elbow should travel right along this string line - straight up, not drifting out to the side. If your elbow bumps the string or moves away from it, you are doing it wrong.',
    duration: 300,
    reps: '35-40 reps',
    tips: [
      'Your elbow should go straight up in a line, like an elevator going up',
      'The string shows you right away if your elbow is drifting sideways',
      'Keep your elbow tucked in during the whole shot',
      'Practice until keeping your elbow straight feels easy and natural'
    ],
    focusArea: 'elbow',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'mirror-elbow-check',
    name: 'MIRROR ELBOW CHECK',
    description: 'Stand in front of a mirror and do your shooting motion SUPER SLOWLY - like slow motion in a movie. Watch your elbow in the mirror. Does it stay under the ball? Does it point at the mirror (which is like the basket)? If your elbow sticks out to the side, fix it right away!',
    duration: 300,
    reps: '25-30 slow motion reps',
    tips: [
      'Your elbow should point straight at the mirror (that is where the basket would be)',
      'Watch for your elbow sticking out to the side at any point',
      'Go REALLY slowly so you can catch any mistakes',
      'When you see your elbow flare out, stop and fix it immediately'
    ],
    focusArea: 'elbow',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'elbow-under-ball',
    name: 'ELBOW UNDER CHECK',
    description: 'Before every shot, STOP and look at your elbow. Is it directly under the ball? Not to the left, not to the right - right in the middle under the ball. If you drew a line from the ball straight down, it should hit your elbow. Check this every single time until it becomes automatic.',
    duration: 300,
    reps: '35-40 reps',
    tips: [
      'Your elbow should be right under the center of the ball',
      'Not to the left, not to the right - perfectly centered',
      'This creates a straight line from the ball to the basket',
      'Check every single shot until you do not have to think about it anymore'
    ],
    focusArea: 'elbow',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== FOLLOW-THROUGH DRILLS ==========
  {
    id: 'gooseneck-hold',
    name: 'GOOSENECK FREEZE',
    description: 'After you shoot, FREEZE with your arm up! Your wrist should be bent down and floppy (like a goose neck), and your fingers should be pointing down toward the basket. Hold this pose for 3 seconds after every shot. This is called your follow-through.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'Your wrist should be totally relaxed and floppy, not stiff',
      'Your fingers should hang down pointing at the floor or basket',
      'Hold until the ball hits the ground',
      'This builds proper release muscle memory'
    ],
    focusArea: 'follow-through',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'finger-point-check',
    name: 'FINGER DIRECTION CHECK',
    description: 'After you shoot, look at your fingers. Are they pointing at the basket? Your pointer and middle finger should point straight at where you want the ball to go. If your fingers point left or right, your follow-through needs work!',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'Your pointer and middle finger should point at the basket',
      'Your fingers should not spread out in different directions',
      'If your fingers point the same way every time, your shots will be more accurate',
      'Ask a friend to tell you which way your fingers point after each shot'
    ],
    focusArea: 'follow-through',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'reach-into-basket',
    name: 'REACH FOR THE HOOP',
    description: 'When you follow through, pretend you are reaching your hand up to put the ball right into the basket. Stretch your arm all the way up toward the rim like you are trying to touch it! Your elbow should end up above your eyes.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'Stretch your arm all the way up on every shot',
      'Pretend you are putting the ball into the hoop with your hand',
      'Your elbow should finish above your eye level',
      'This makes sure you complete your shot all the way'
    ],
    focusArea: 'follow-through',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'wrist-snap-isolation',
    name: 'WRIST ONLY FLICK',
    description: 'Hold the ball at your shooting position. Now, WITHOUT moving your arm at all, just snap your wrist to push the ball up. Your arm is frozen - only your wrist moves! This teaches you the flicking motion that gives the ball its spin.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'Keep your arm completely frozen',
      'Only your wrist moves to shoot the ball',
      'The ball should pop up with backspin',
      'This is the final snap that happens in every good shot'
    ],
    focusArea: 'follow-through',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== BALL POSITION & SET POINT DRILLS ==========
  {
    id: 'set-point-consistency',
    name: 'SAME SPOT EVERY TIME',
    description: 'Before you shoot, you hold the ball in a spot called your "set point." Find your set point (it should be above your forehead, a little in front of your face) and practice bringing the ball to the EXACT same spot every single time. You can even put a piece of tape on your forehead to help you remember where it goes!',
    duration: 300,
    reps: '40-50 reps',
    tips: [
      'Your set point should be above your forehead',
      'Bring the ball to the same exact spot every time',
      'The ball should be a little in front of your face, not behind your head',
      'If you always start from the same spot, your shot will be more consistent'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'ball-straight-up',
    name: 'LYING DOWN SHOTS',
    description: 'Lie flat on your back on the floor. Now shoot the ball straight up toward the ceiling! If your form is good, the ball will come straight back down into your hands. If the ball drifts to the side, that means your shot is crooked and needs fixing.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'The ball should go perfectly straight up, like a rocket',
      'If your form is right, you can catch it without moving',
      'If the ball drifts sideways, something is wrong with your release',
      'This is a great way to check if your shot is straight'
    ],
    focusArea: 'release',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'shooting-pocket',
    name: 'CATCH AND READY',
    description: 'When you catch the ball, you need to get it into shooting position FAST. This position is called your "shooting pocket." Practice catching the ball and immediately getting it into the right spot with your hands in the right position. No fumbling around!',
    duration: 300,
    reps: '40-45 catches',
    tips: [
      'Every time you catch the ball, it should go to the same spot',
      'Your hands should already be in shooting position when you catch',
      'You should not have to move the ball around much after catching',
      'This makes your shot faster so defenders cannot block it'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'ball-seam-alignment',
    name: 'FINGER ON THE LINES',
    description: 'The basketball has black lines on it called seams. Put your fingers ACROSS these lines (not along them). Every time you pick up the ball, put your fingers in the same place on the seams. This gives you a better grip and makes the ball spin the same way every time.',
    duration: 300,
    reps: '30-35 reps',
    tips: [
      'Your fingers go across the seams, not along them',
      'Put your fingers in the same spot on the seams every time',
      'This helps the ball spin backward evenly',
      'Find a seam position that feels comfortable for you'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== BALANCE & BASE DRILLS ==========
  {
    id: 'feet-alignment-check',
    name: 'FEET CHECK',
    description: 'Before every shot, look at your feet! Your shooting-side foot should be a tiny bit in front of your other foot. Your feet should be about as wide apart as your shoulders. And your toes should point at the basket. Check this every single time!',
    duration: 300,
    reps: '35-40 reps',
    tips: [
      'Your shooting foot should be slightly ahead of your other foot',
      'Your toes should point toward the basket',
      'Stand with your feet about shoulder-width apart for good balance',
      'Set up your feet the same way every single time'
    ],
    focusArea: 'balance',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'one-leg-balance-form',
    name: 'ONE LEG SHOOTING',
    description: 'Stand on just ONE leg (the same side as your shooting hand) and go through your shooting motion. This is hard! But it teaches your body to stay balanced. If you wobble, go slower until you can do it smoothly.',
    duration: 300,
    reps: '25 reps each leg',
    tips: [
      'Stay balanced the whole time - no wobbling!',
      'Tighten your stomach muscles to help you balance',
      'If you start wobbling, slow down',
      'This helps you stay balanced during real games'
    ],
    focusArea: 'balance',
    ageLevel: ['high_school', 'college', 'professional']
  },
  {
    id: 'knee-bend-check',
    name: 'KNEE BEND PRACTICE',
    description: 'Your legs give your shot its power - not your arms! Practice bending your knees the same amount every time before you shoot. Not too deep like a squat, but not too straight either. Feel the power loading up in your legs like a spring.',
    duration: 300,
    reps: '35-40 reps',
    tips: [
      'Bend your knees about halfway - not too deep, not too straight',
      'Bend the same amount every single time',
      'Your legs are where the power comes from, not your arms',
      'Feel like you are loading up a spring in your legs'
    ],
    focusArea: 'balance',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== BACKSPIN & ROTATION DRILLS ==========
  {
    id: 'backspin-check',
    name: 'SPIN WATCHER',
    description: 'When you shoot, watch how the ball spins. It should spin BACKWARD (toward you) in a nice, even way. You should see the lines on the ball rotating smoothly. If the ball spins sideways or wobbles, something is wrong with your form.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'The ball should spin backward - toward you',
      'Watch the lines on the ball - they should rotate evenly',
      'If the ball spins sideways, your guide hand is pushing it',
      'If the ball wobbles, your fingers are not releasing it evenly'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'finger-roll-off',
    name: 'TWO FINGER RELEASE',
    description: 'When you shoot, the ball should roll off your pointer finger and middle finger LAST. These two fingers control where the ball goes and how it spins. Practice feeling the ball leave these two fingers as you shoot.',
    duration: 300,
    reps: '35-40 shots',
    tips: [
      'The ball should roll off your pointer and middle finger last',
      'After you shoot, these two fingers should point at the basket',
      'This is what makes the ball spin backward correctly',
      'If you release the same way every time, you will be more accurate'
    ],
    focusArea: 'release',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'spin-direction-test',
    name: 'SPIN TEST',
    description: 'Shoot at a wall and catch the ball when it bounces back, or have a friend catch it. Look at how the ball is spinning. Is it spinning perfectly backward? Or is it spinning a little to the left or right? This tells you if your form is correct.',
    duration: 300,
    reps: '30-35 shots',
    tips: [
      'Perfect backspin means your form is correct',
      'If the ball spins to the left, your guide hand is pushing it',
      'If the ball spins to the right, your shooting hand is not under the ball correctly',
      'Use this drill to figure out what you need to fix'
    ],
    focusArea: 'release',
    ageLevel: ['high_school', 'college', 'professional']
  },
  
  // ========== SLOW MOTION & VISUALIZATION DRILLS ==========
  {
    id: 'slow-motion-form',
    name: 'SUPER SLOW MOTION',
    description: 'Do your shooting motion in SUPER slow motion - like a slow-motion replay on TV. Take 10 whole seconds to go from the start of your shot to the end. Feel every little part of the motion. This builds really strong muscle memory.',
    duration: 300,
    reps: '20-25 slow reps',
    tips: [
      'Go as slow as you possibly can',
      'Feel every muscle in your body working',
      'Check your form at every point during the motion',
      'This trains your muscles to remember the right way to shoot'
    ],
    focusArea: 'general',
    ageLevel: ['middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'eyes-closed-form',
    name: 'BLIND SHOOTING FORM',
    description: 'Close your eyes and go through your shooting motion (you do not have to actually shoot the ball). Can you FEEL if your form is right? Feel where your elbow is, feel your wrist bend back, feel your follow-through. Your body should know the right way even without looking.',
    duration: 300,
    reps: '25-30 reps',
    tips: [
      'Feel where your elbow is - is it under the ball?',
      'Feel your wrist - is it bent back?',
      'Feel your follow-through - is your wrist floppy?',
      'Your body should know the right form without needing to see'
    ],
    focusArea: 'general',
    ageLevel: ['high_school', 'college', 'professional']
  },
  {
    id: 'mirror-full-form',
    name: 'MIRROR PRACTICE',
    description: 'Stand in front of a big mirror (like in a bathroom or bedroom) and do your whole shooting motion. Watch yourself the whole time! Is your elbow under the ball? Is your guide hand flat? Does your follow-through look good? Fix anything that looks wrong right away.',
    duration: 300,
    reps: '30-35 reps',
    tips: [
      'Watch your elbow - is it under the ball?',
      'Watch your guide hand - is it flat and not pushing?',
      'Watch your follow-through - does your wrist flop down?',
      'Fix anything that looks wrong right away'
    ],
    focusArea: 'general',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  
  // ========== WARM-UP & COOL-DOWN ==========
  {
    id: 'warm-up-stretching',
    name: 'WARM UP',
    description: 'Before you start your drills, you need to warm up your body! Do arm circles (forward and backward), shake out your wrists, twist your body left and right, and do some light jumping. This gets your blood flowing and helps prevent injuries.',
    duration: 300,
    reps: '5 minutes of movement',
    tips: [
      'Do big arm circles - forward and backward',
      'Spin your wrists around in circles',
      'Twist your body left and right',
      'Get your blood pumping before you start practicing'
    ],
    focusArea: 'general',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  },
  {
    id: 'cool-down',
    name: 'COOL DOWN',
    description: 'After your workout, you need to cool down and stretch! Hold each stretch for about 20-30 seconds. Stretch your shoulders, wrists, and arms. Take deep breaths and relax. This helps your muscles recover and prevents soreness.',
    duration: 300,
    reps: '5 minutes of stretching',
    tips: [
      'Hold each stretch for 20-30 seconds - do not bounce!',
      'Stretch your shoulders and wrists especially',
      'Take slow, deep breaths while you stretch',
      'This helps your muscles feel better tomorrow'
    ],
    focusArea: 'general',
    ageLevel: ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  }
]

// =============================================
// WORKOUT GENERATOR - Age Level Specific
// =============================================

function generateWorkout(
  duration: 5 | 10 | 15 | 20 | 30 | 45, 
  focusAreas: string[] = [],
  ageLevel: AgeLevel = 'high_school',
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7 = 3 // Default to sweet spot of 3 drills
): Workout {
  const exercises: Exercise[] = []
  const config = AGE_LEVEL_CONFIG[ageLevel]
  
  // Filter exercises appropriate for this age level (exclude warm-up and cool-down)
  const ageAppropriateExercises = EXERCISE_DATABASE.filter(e => 
    e.ageLevel.includes(ageLevel) &&
    e.id !== 'warm-up-stretching' && 
    e.id !== 'cool-down'
  )
  
  // Get exercises matching focus areas first (age-appropriate)
  const priorityExercises = focusAreas.length > 0
    ? ageAppropriateExercises.filter(e => focusAreas.includes(e.focusArea))
    : []
  
  // Get general exercises (age-appropriate)
  const generalExercises = ageAppropriateExercises.filter(e => 
    !priorityExercises.includes(e)
  )
  
  // Fisher-Yates shuffle for truly random ordering
  const fisherYatesShuffle = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }
  
  // Shuffle and combine, prioritizing focus area exercises
  const shuffledPriority = fisherYatesShuffle(priorityExercises)
  const shuffledGeneral = fisherYatesShuffle(generalExercises)
  const allShuffled = [...shuffledPriority, ...shuffledGeneral]
  
  // Select exactly drillCount exercises (the main drills)
  const selectedDrills = allShuffled.slice(0, drillCount)
  
  // Calculate time per drill based on duration and drill count
  // Subtract time for warm-up and cool-down if applicable
  const warmupCooldownTime = duration >= 15 ? 2 : 0 // 1 min each for warm-up and cool-down
  const availableTime = (duration - warmupCooldownTime) * 60 // in seconds
  const timePerDrill = Math.floor(availableTime / drillCount)
  
  // Add warm-up for workouts 15+ minutes
  if (duration >= 15) {
    const warmup = EXERCISE_DATABASE.find(e => e.id === 'warm-up-stretching')
    if (warmup && warmup.ageLevel.includes(ageLevel)) {
      const warmupDuration = Math.round(60 * config.intensityMultiplier) // 1 minute warm-up
      exercises.push({ ...warmup, duration: warmupDuration })
    }
  }
  
  // Add the selected drills with equal time distribution
  for (const drill of selectedDrills) {
    const adjustedDuration = Math.round(timePerDrill * config.intensityMultiplier)
    exercises.push({ ...drill, duration: adjustedDuration })
  }
  
  // Add cool-down for workouts 15+ minutes
  if (duration >= 15) {
    const cooldown = EXERCISE_DATABASE.find(e => e.id === 'cool-down')
    if (cooldown && cooldown.ageLevel.includes(ageLevel)) {
      const cooldownDuration = Math.round(60 * config.intensityMultiplier) // 1 minute cool-down
      exercises.push({ ...cooldown, duration: cooldownDuration })
    }
  }
  
  return {
    id: `workout-${ageLevel}-${duration}-${drillCount}drills-${Date.now()}`,
    name: `${config.name} ${duration} Min Workout`,
    duration,
    exercises,
    focusAreas,
    intensity: duration <= 15 ? 'low' : duration <= 30 ? 'medium' : 'high'
  }
}

// =============================================
// FLAW-BASED WORKOUT GENERATOR
// =============================================

interface FlawBasedWorkoutOptions {
  flaws: { id: string; name: string; priority: number }[]
  duration: 5 | 10 | 15 | 20 | 30 | 45
  ageLevel: AgeLevel
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7
}

function generateFlawBasedWorkout(options: FlawBasedWorkoutOptions): Workout {
  const { flaws, duration, ageLevel, drillCount } = options
  const config = AGE_LEVEL_CONFIG[ageLevel]
  
  // Extract focus areas from flaws using the mapping
  const flawFocusAreas: string[] = []
  flaws.forEach(flaw => {
    // Check direct mapping
    const mapped = FLAW_TO_FOCUS_AREA[flaw.id]
    if (mapped) {
      flawFocusAreas.push(...mapped)
    }
    // Also check if flaw ID contains common keywords
    const flawIdUpper = flaw.id.toUpperCase()
    if (flawIdUpper.includes('ELBOW')) flawFocusAreas.push('elbow')
    if (flawIdUpper.includes('KNEE')) flawFocusAreas.push('balance', 'power')
    if (flawIdUpper.includes('SHOULDER') || flawIdUpper.includes('HIP')) flawFocusAreas.push('balance')
    if (flawIdUpper.includes('RELEASE')) flawFocusAreas.push('release')
    if (flawIdUpper.includes('FOLLOW')) flawFocusAreas.push('follow-through')
    if (flawIdUpper.includes('BALANCE')) flawFocusAreas.push('balance')
    if (flawIdUpper.includes('GUIDE')) flawFocusAreas.push('release')
  })
  
  // Remove duplicates
  const uniqueFocusAreas = [...new Set(flawFocusAreas)]
  
  // Sort flaws by priority (higher priority = more important to fix)
  const sortedFlaws = [...flaws].sort((a, b) => b.priority - a.priority)
  
  // Get primary flaw name for workout title
  const primaryFlawName = sortedFlaws[0]?.name || 'Form'
  
  // Generate workout with the flaw-based focus areas
  const exercises: Exercise[] = []
  
  // Filter exercises appropriate for this age level (exclude warm-up and cool-down)
  const ageAppropriateExercises = EXERCISE_DATABASE.filter(e => 
    e.ageLevel.includes(ageLevel) &&
    e.id !== 'warm-up-stretching' && 
    e.id !== 'cool-down'
  )
  
  // Prioritize exercises that match the flaw focus areas
  const priorityExercises = uniqueFocusAreas.length > 0
    ? ageAppropriateExercises.filter(e => uniqueFocusAreas.includes(e.focusArea))
    : []
  
  // Get remaining exercises
  const generalExercises = ageAppropriateExercises.filter(e => 
    !priorityExercises.includes(e)
  )
  
  // Shuffle and combine, heavily prioritizing focus area exercises
  const shuffledPriority = priorityExercises.sort(() => Math.random() - 0.5)
  const shuffledGeneral = generalExercises.sort(() => Math.random() - 0.5)
  const allShuffled = [...shuffledPriority, ...shuffledGeneral]
  
  // Select exactly drillCount exercises
  const selectedDrills = allShuffled.slice(0, drillCount)
  
  // Calculate time per drill
  const warmupCooldownTime = duration >= 15 ? 2 : 0
  const availableTime = (duration - warmupCooldownTime) * 60
  const timePerDrill = Math.floor(availableTime / drillCount)
  
  // Add warm-up for workouts 15+ minutes
  if (duration >= 15) {
    const warmup = EXERCISE_DATABASE.find(e => e.id === 'warm-up-stretching')
    if (warmup && warmup.ageLevel.includes(ageLevel)) {
      const warmupDuration = Math.round(60 * config.intensityMultiplier)
      exercises.push({ ...warmup, duration: warmupDuration })
    }
  }
  
  // Add the selected drills
  for (const drill of selectedDrills) {
    const adjustedDuration = Math.round(timePerDrill * config.intensityMultiplier)
    exercises.push({ ...drill, duration: Math.max(60, adjustedDuration) })
  }
  
  // Add cool-down for workouts 15+ minutes
  if (duration >= 15) {
    const cooldown = EXERCISE_DATABASE.find(e => e.id === 'cool-down')
    if (cooldown && cooldown.ageLevel.includes(ageLevel)) {
      const cooldownDuration = Math.round(60 * config.intensityMultiplier)
      exercises.push({ ...cooldown, duration: cooldownDuration })
    }
  }
  
  // Create a descriptive name based on the primary flaw
  const workoutName = `${primaryFlawName.split(' ')[0]} Focus Workout`
  
  return {
    id: `flaw-workout-${ageLevel}-${duration}-${Date.now()}`,
    name: workoutName,
    duration,
    exercises,
    focusAreas: uniqueFocusAreas,
    intensity: duration <= 15 ? 'low' : duration <= 30 ? 'medium' : 'high'
  }
}

// Generate a weekly training plan based on flaws
function generateFlawBasedWeeklyPlan(
  flaws: { id: string; name: string; priority: number }[],
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7,
  duration: 5 | 10 | 15 | 20 | 30 | 45,
  ageLevel: AgeLevel,
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7
): { date: Date; workout: Workout }[] {
  const plan: { date: Date; workout: Workout }[] = []
  
  // Determine which days to schedule based on frequency
  const trainingDays: number[] = []
  if (frequency >= 1) trainingDays.push(1) // Monday
  if (frequency >= 2) trainingDays.push(4) // Thursday
  if (frequency >= 3) trainingDays.push(6) // Saturday
  if (frequency >= 4) trainingDays.push(2) // Tuesday
  if (frequency >= 5) trainingDays.push(5) // Friday
  if (frequency >= 6) trainingDays.push(3) // Wednesday
  if (frequency >= 7) trainingDays.push(0) // Sunday
  
  // Get the start of this week (Sunday)
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())
  startOfWeek.setHours(0, 0, 0, 0)
  
  // Generate workouts for each training day in the current week and next week
  for (let weekOffset = 0; weekOffset < 2; weekOffset++) {
    for (const dayOfWeek of trainingDays) {
      const workoutDate = new Date(startOfWeek)
      workoutDate.setDate(startOfWeek.getDate() + dayOfWeek + (weekOffset * 7))
      
      // Only schedule future workouts
      if (workoutDate >= today) {
        const workout = generateFlawBasedWorkout({
          flaws,
          duration,
          ageLevel,
          drillCount
        })
        
        plan.push({ date: workoutDate, workout })
      }
    }
  }
  
  return plan
}

// =============================================
// SOUND EFFECTS
// =============================================

const playChime = () => {
  if (typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 880 // A5 note
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
  }
}

const playCompletionSound = () => {
  if (typeof window !== 'undefined') {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Play a happy chord
    const frequencies = [523.25, 659.25, 783.99] // C5, E5, G5
    
    frequencies.forEach((freq, i) => {
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.frequency.value = freq
      oscillator.type = 'sine'
      
      const startTime = audioContext.currentTime + (i * 0.1)
      gainNode.gain.setValueAtTime(0.2, startTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.8)
      
      oscillator.start(startTime)
      oscillator.stop(startTime + 0.8)
    })
  }
}

// =============================================
// FREQUENCY INFO POPUP COMPONENT
// =============================================

interface FrequencyPopupProps {
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7
  onClose: () => void
  onConfirm: () => void
}

function FrequencyInfoPopup({ frequency, onClose, onConfirm }: FrequencyPopupProps) {
  const data = FREQUENCY_RESEARCH[frequency]
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <FrequencyIcon type={data.iconType} className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase">{data.title}</h2>
                <p className="text-white/80">TRAINING FREQUENCY ANALYSIS</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 p-6 border-b border-[#3a3a3a]">
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-green-400">{data.improvement}</p>
            <p className="text-[#888] text-sm">Expected Improvement</p>
          </div>
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-black text-blue-400">{data.timeToResults}</p>
            <p className="text-[#888] text-sm">Time to See Results</p>
          </div>
        </div>
        
        {/* Facts */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Research-Backed Facts
          </h3>
          <ul className="space-y-3">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#E5E5E5]">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Our Recommendation
          </h3>
          <p className="text-[#E5E5E5] bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a]">
            {data.recommendation}
          </p>
        </div>
        
        {/* Research Citation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#888] font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Research Source
          </h3>
          <p className="text-[#888] text-sm italic">
            {data.research}
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
          >
            Choose Different Frequency
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all`}
          >
            Confirm {frequency}x Per Week
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// DRILL COUNT INFO POPUP
// =============================================

interface DrillCountPopupProps {
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7
  onClose: () => void
  onConfirm: () => void
}

function DrillCountInfoPopup({ drillCount, onClose, onConfirm }: DrillCountPopupProps) {
  const data = DRILL_COUNT_RESEARCH[drillCount]
  const isSweet = drillCount === 3 || drillCount === 4
  const isWarning = drillCount >= 6
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <DrillCountIcon type={data.iconType} className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{data.title}</h2>
                <p className="text-white/80">Drill Count Analysis</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Sweet Spot Badge */}
        {isSweet && (
          <div className="bg-green-500/20 border-b border-green-500/30 p-4 flex items-center gap-3">
            <Star className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-bold">SWEET SPOT SELECTION</p>
              <p className="text-green-400/80 text-sm">Research shows 3-4 drills produces optimal results</p>
            </div>
          </div>
        )}
        
        {/* Warning for high count */}
        {isWarning && (
          <div className="bg-red-500/20 border-b border-red-500/30 p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-bold">CAUTION: HIGH DRILL COUNT</p>
              <p className="text-red-400/80 text-sm">More drills may dilute your focus and slow improvement</p>
            </div>
          </div>
        )}
        
        {/* Focus Level */}
        <div className="grid grid-cols-1 gap-4 p-6 border-b border-[#3a3a3a]">
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <Target className={`w-8 h-8 mx-auto mb-2 ${isSweet ? 'text-green-400' : isWarning ? 'text-red-400' : 'text-blue-400'}`} />
            <p className={`text-2xl font-black ${isSweet ? 'text-green-400' : isWarning ? 'text-red-400' : 'text-blue-400'}`}>
              {data.focusLevel}
            </p>
            <p className="text-[#888] text-sm">Focus Level</p>
          </div>
        </div>
        
        {/* Facts */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Research-Backed Facts
          </h3>
          <ul className="space-y-3">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                {fact.includes('SWEET SPOT') || fact.includes('RECOMMENDED') ? (
                  <Star className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : fact.includes('WARNING') || fact.includes('Risk') ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={`${fact.includes('SWEET SPOT') ? 'text-green-400 font-bold' : 'text-[#E5E5E5]'}`}>
                  {fact}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Our Recommendation
          </h3>
          <p className={`bg-[#2a2a2a] rounded-xl p-4 border ${
            isSweet ? 'border-green-500/50 text-green-400' : 
            isWarning ? 'border-red-500/50 text-red-400' : 
            'border-[#3a3a3a] text-[#E5E5E5]'
          }`}>
            {data.recommendation}
          </p>
        </div>
        
        {/* Research Citation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#888] font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Research Source
          </h3>
          <p className="text-[#888] text-sm italic">
            {data.research}
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
          >
            CHOOSE DIFFERENT COUNT
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all`}
          >
            CONFIRM {drillCount} DRILL{drillCount > 1 ? 'S' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// WORKOUT DURATION INFO POPUP
// =============================================

interface DurationPopupProps {
  duration: 5 | 10 | 15 | 20 | 30 | 45
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7
  onClose: () => void
  onConfirm: () => void
}

function DurationInfoPopup({ duration, frequency, onClose, onConfirm }: DurationPopupProps) {
  const data = DURATION_RESEARCH[duration]
  const isSweet = duration === 15 || duration === 20
  const isWarning = duration === 45
  
  // Determine frequency category for note
  const getFrequencyNote = () => {
    if (frequency <= 2) return data.frequencyNote.low
    if (frequency <= 4) return data.frequencyNote.medium
    return data.frequencyNote.high
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <DurationIcon type={data.iconType} className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{data.title}</h2>
                <p className="text-white/80">WORKOUT DURATION ANALYSIS</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Sweet Spot Badge */}
        {isSweet && (
          <div className="bg-green-500/20 border-b border-green-500/30 p-4 flex items-center gap-3">
            <Star className="w-6 h-6 text-green-400" />
            <div>
              <p className="text-green-400 font-bold">OPTIMAL DURATION</p>
              <p className="text-green-400/80 text-sm">Research shows {duration} minutes is ideal for skill development</p>
            </div>
          </div>
        )}
        
        {/* Warning for long sessions */}
        {isWarning && (
          <div className="bg-amber-500/20 border-b border-amber-500/30 p-4 flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div>
              <p className="text-amber-400 font-bold">INTENSIVE SESSION</p>
              <p className="text-amber-400/80 text-sm">Requires structured breaks to maintain quality</p>
            </div>
          </div>
        )}
        
        {/* Quality Level */}
        <div className="grid grid-cols-1 gap-4 p-6 border-b border-[#3a3a3a]">
          <div className="bg-[#2a2a2a] rounded-xl p-4 text-center">
            <Timer className={`w-8 h-8 mx-auto mb-2 ${isSweet ? 'text-green-400' : isWarning ? 'text-amber-400' : 'text-blue-400'}`} />
            <p className={`text-2xl font-black ${isSweet ? 'text-green-400' : isWarning ? 'text-amber-400' : 'text-blue-400'}`}>
              {data.quality}
            </p>
            <p className="text-[#888] text-sm">SESSION QUALITY</p>
          </div>
        </div>
        
        {/* Frequency-Specific Note */}
        <div className="p-6 border-b border-[#3a3a3a] bg-[#2a2a2a]/50">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            BASED ON YOUR {frequency}X/WEEK FREQUENCY
          </h3>
          <p className="text-[#E5E5E5] bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
            {getFrequencyNote()}
          </p>
        </div>
        
        {/* Facts */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            RESEARCH-BACKED FACTS
          </h3>
          <ul className="space-y-3">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                {fact.includes('SWEET SPOT') || fact.includes('OPTIMAL') ? (
                  <Star className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : fact.includes('Risk') || fact.includes('WARNING') ? (
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                )}
                <span className={`${fact.includes('SWEET SPOT') || fact.includes('OPTIMAL') ? 'text-green-400 font-bold' : 'text-[#E5E5E5]'}`}>
                  {fact}
                </span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            OUR RECOMMENDATION
          </h3>
          <p className={`bg-[#2a2a2a] rounded-xl p-4 border ${
            isSweet ? 'border-green-500/50 text-green-400' : 
            isWarning ? 'border-amber-500/50 text-amber-400' : 
            'border-[#3a3a3a] text-[#E5E5E5]'
          }`}>
            {data.recommendation}
          </p>
        </div>
        
        {/* Research Citation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#888] font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            RESEARCH SOURCE
          </h3>
          <p className="text-[#888] text-sm italic">
            {data.research}
          </p>
        </div>
        
        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
          >
            CHOOSE DIFFERENT DURATION
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all`}
          >
            CONFIRM {duration} MINUTES
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// AGE LEVEL / WORKOUT LEVEL INFO POPUP
// =============================================

interface AgeLevelPopupProps {
  ageLevel: AgeLevel
  onClose: () => void
  onConfirm: () => void
}

function AgeLevelInfoPopup({ ageLevel, onClose, onConfirm }: AgeLevelPopupProps) {
  const data = AGE_LEVEL_RESEARCH[ageLevel]
  const config = AGE_LEVEL_CONFIG[ageLevel]
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-6 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
                <AgeLevelIcon type={data.iconType} className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{data.title}</h2>
                <p className="text-white/80">{data.ageRange} • {data.focus}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Recommended Settings Banner */}
        <div className="bg-[#FF6B35]/10 border-b border-[#FF6B35]/30 p-4 flex items-center gap-3">
          <Star className="w-6 h-6 text-[#FF6B35]" />
          <div>
            <p className="text-[#FF6B35] font-bold">RECOMMENDED SETTINGS FOR {config.name.toUpperCase()}</p>
            <p className="text-[#FF6B35]/80 text-sm">
              {config.recommendedFrequency}x per week • {config.recommendedDuration} minute sessions
            </p>
          </div>
        </div>
        
        {/* Key Facts */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            KEY FACTS FOR THIS LEVEL
          </h3>
          <ul className="space-y-3">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-3">
                <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#E5E5E5]">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Physical Considerations */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-blue-400 font-bold mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5" />
            PHYSICAL CONSIDERATIONS
          </h3>
          <ul className="space-y-2">
            {data.physicalConsiderations.map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
                <CircleDot className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#E5E5E5] text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Mental Considerations */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-purple-400 font-bold mb-4 flex items-center gap-2">
            <Eye className="w-5 h-5" />
            MENTAL CONSIDERATIONS
          </h3>
          <ul className="space-y-2">
            {data.mentalConsiderations.map((item, i) => (
              <li key={i} className="flex items-start gap-3 bg-purple-500/10 rounded-lg p-3 border border-purple-500/20">
                <CircleDot className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#E5E5E5] text-sm">{item}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
            <Star className="w-5 h-5" />
            OUR RECOMMENDATION
          </h3>
          <p className={`bg-gradient-to-r ${config.bgColor} rounded-xl p-4 border ${config.borderColor} ${config.color}`}>
            {data.recommendation}
          </p>
        </div>
        
        {/* Research Citation */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#888] font-bold mb-3 flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            RESEARCH SOURCE
          </h3>
          <p className="text-[#888] text-sm italic">
            {data.research}
          </p>
        </div>
        
        {/* Tips for this level */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-green-400 font-bold mb-3 flex items-center gap-2">
            <Target className="w-5 h-5" />
            TIPS FOR {config.name.toUpperCase()} PLAYERS
          </h3>
          <div className="space-y-2">
            {config.tips.map((tip, i) => (
              <div key={i} className="flex items-start gap-2 bg-green-500/10 rounded-lg p-3 border border-green-500/20">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-[#E5E5E5] text-sm">{tip}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Actions */}
        <div className="p-6 flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
          >
            CHOOSE DIFFERENT LEVEL
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all`}
          >
            CONFIRM {config.name.toUpperCase()}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// DRILL EXPLANATION POPUP COMPONENT
// =============================================

interface DrillExplanationPopupProps {
  drill: Exercise
  onClose: () => void
}

function DrillExplanationPopup({ drill, onClose }: DrillExplanationPopupProps) {
  const focusAreaColors: Record<string, { bg: string; text: string; border: string }> = {
    elbow: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    release: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    'follow-through': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    balance: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    power: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    knee: { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    general: { bg: 'bg-[#3a3a3a]', text: 'text-[#888]', border: 'border-[#3a3a3a]' }
  }
  
  const colors = focusAreaColors[drill.focusArea] || focusAreaColors.general
  
  // Generate step-by-step instructions if not provided
  const getSteps = (): string[] => {
    if (drill.steps && drill.steps.length > 0) return drill.steps
    
    // Default step generation based on drill type
    const defaultSteps: Record<string, string[]> = {
      'fingertip-control': [
        'Pick up the basketball with just your fingertips - NO palm contact',
        'Spread your fingers wide across the ball surface',
        'Check that you can see daylight between your palm and the ball',
        'Hold this position for 10 seconds while keeping the ball stable',
        'Put the ball down and immediately pick it up the same way',
        'Repeat this hold-and-release pattern for 5 minutes total'
      ],
      'form-shooting': [
        'Stand 3-5 feet from the basket in your shooting stance',
        'Hold the ball in your shooting hand with fingertips only',
        'Place your guide hand on the side of the ball (not pushing)',
        'Bend your knees slightly and keep your elbow under the ball',
        'Push up through your legs as you extend your shooting arm',
        'Flick your wrist and hold your follow-through until the ball hits the rim',
        'Repeat, focusing on the same motion every single time'
      ],
      'one-hand-form': [
        'Stand close to the basket (3-5 feet away)',
        'Hold the ball in your shooting hand only - no guide hand',
        'Position the ball on your fingertips with your elbow under it',
        'Bend your knees and align your shooting foot with the basket',
        'Push up and release, focusing on a high arc',
        'Hold your follow-through with fingers pointing at the rim',
        'Repeat until you make 10 shots in a row with good form'
      ],
      'elbow-alignment': [
        'Stand in front of a mirror or have a partner watch you',
        'Get into your shooting stance with the ball',
        'Check that your elbow points directly at the basket',
        'Your elbow should be under the ball, not flared out',
        'Practice raising the ball to your set point while keeping elbow aligned',
        'Release the ball and check if your elbow stayed straight',
        'Repeat 20 times, making adjustments each rep'
      ],
      'balance-shot': [
        'Stand on one foot (your non-dominant foot)',
        'Hold the ball in shooting position',
        'Take a shot while maintaining your single-leg balance',
        'Hold your finish position for 2 seconds without putting your foot down',
        'Switch to the other foot and repeat',
        'Do 10 shots on each foot',
        'Progress to shooting off a hop while landing on one foot'
      ]
    }
    
    // Return default steps if available, otherwise generate generic steps
    if (defaultSteps[drill.id]) return defaultSteps[drill.id]
    
    // Generic steps based on description
    return [
      'Get into your proper shooting stance with feet shoulder-width apart',
      'Hold the ball correctly with your shooting hand under and guide hand on the side',
      drill.description.split('.')[0] + '.',
      'Focus on your form throughout the entire movement',
      'Complete the full motion and hold your follow-through',
      `Repeat for ${drill.reps || 'the allotted time'}`
    ]
  }
  
  // Get key points for doing the drill correctly
  const getKeyPoints = (): string[] => {
    if (drill.keyPoints && drill.keyPoints.length > 0) return drill.keyPoints
    
    const focusKeyPoints: Record<string, string[]> = {
      elbow: [
        'Elbow stays directly under the ball',
        'Elbow points at the basket throughout the shot',
        'No chicken wing - keep elbow tucked in'
      ],
      release: [
        'Ball releases off fingertips, not palm',
        'Wrist snaps forward at release',
        'Ball should have backspin'
      ],
      'follow-through': [
        'Arm fully extends toward the basket',
        'Fingers point down into the rim (gooseneck)',
        'Hold follow-through until ball hits rim'
      ],
      balance: [
        'Weight evenly distributed on both feet',
        'Knees bent and ready to push up',
        'Body stays centered throughout shot'
      ],
      power: [
        'Power comes from legs, not arms',
        'Knees bend before every shot',
        'Smooth upward motion from legs to release'
      ],
      knee: [
        'Knees bend at 30-45 degrees',
        'Push up through legs as you shoot',
        'Land softly in the same spot'
      ],
      general: [
        'Consistent form on every rep',
        'Focus on quality over speed',
        'Stay relaxed and breathe'
      ]
    }
    
    return focusKeyPoints[drill.focusArea] || focusKeyPoints.general
  }
  
  const steps = getSteps()
  const keyPoints = getKeyPoints()
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`${colors.bg} p-6 rounded-t-2xl border-b ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                <Target className={`w-8 h-8 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">{drill.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {drill.focusArea.replace('-', ' ')}
                  </span>
                  <span className="text-[#888] text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {Math.ceil(drill.duration / 60)} MINUTES
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Focus Area Section */}
        <div className="p-5 border-b border-[#3a3a3a] bg-[#2a2a2a]/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${colors.bg} border ${colors.border} flex items-center justify-center`}>
              <Target className={`w-5 h-5 ${colors.text}`} />
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wider">FOCUS</p>
              <p className={`${colors.text} font-bold uppercase`}>{drill.focusArea.replace('-', ' ')}</p>
            </div>
          </div>
        </div>
        
        {/* How Many / Reps Section */}
        {drill.reps && (
          <div className="p-5 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[#888] text-xs uppercase tracking-wider">REPS / DURATION</p>
                <p className="text-[#E5E5E5] font-bold">{drill.reps}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step-by-Step Instructions */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-3 uppercase text-lg">
            <img 
              src="/icons/coach-feedback.png" 
              alt="Coach" 
              className="w-14 h-14"
              style={{ filter: 'invert(1) brightness(2)' }}
            />
            COACH&apos;S INSTRUCTIONS
          </h3>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Number badge styled like matched shooters - large Russo One font */}
                <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <span 
                    className="font-russo-one text-3xl font-bold text-[#FF6B35]"
                    style={{ 
                      fontFamily: 'var(--font-russo-one), Russo One, sans-serif',
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < steps.length - 1 && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gradient-to-b from-[#FF6B35]/30 to-transparent" />
                  )}
                </div>
                <div className="flex-1 pt-2 border-l-2 border-[#FF6B35]/20 pl-4">
                  <p className="text-[#E5E5E5] leading-relaxed">{step}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Key Points - What Makes It Right */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2 uppercase">
            <CheckCircle className="w-5 h-5" />
            KEY POINTS - DO IT RIGHT
          </h3>
          <div className="space-y-3">
            {keyPoints.map((point, i) => (
              <div key={i} className="flex items-center gap-3 bg-[#2a2a2a] rounded-lg p-3 border border-[#3a3a3a]">
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-[#E5E5E5] text-sm">{point}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Original Tips Section - renamed to Pro Tips */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2 uppercase">
            <Star className="w-5 h-5" />
            PRO TIPS
          </h3>
          <ul className="space-y-3">
            {drill.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
                <span className="text-[#888] text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Close Button */}
        <div className="p-6">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] font-bold text-lg hover:brightness-110 transition-all uppercase"
          >
            GOT IT - LET&apos;S GO!
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// WORKOUT TIMER COMPONENT
// =============================================

interface WorkoutTimerProps {
  workout: Workout
  preferences: TrainingPreferences
  onComplete: (videoBlob?: Blob) => void
  onCancel: () => void
}

// Interface for coaching point evaluation (from Vision AI)
interface CoachingPointEvaluation {
  coachingPoint: string
  status: 'executing' | 'needs_work' | 'not_visible'
  coachObservation: string
  correction?: string
  cue?: string
}

// Interface for coach analysis results
interface CoachAnalysisResult {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  gradeDescription: string
  coachingPointEvaluations: CoachingPointEvaluation[]
  priorityFocus: {
    issue: string
    why: string
    howToFix: string
    drillToHelp?: string
    cue: string
  }
  reinforcement: Array<{
    point: string
    whyItMatters: string
  }>
  nextSteps: {
    immediate: string
    thisWeek: string
    progression: string
  }
  coachSays: string
  isCorrectDrill?: boolean
  wrongDrillMessage?: string
  whatISee?: string
}

// Interface for drill video submissions
interface DrillVideoSubmission {
  id?: string // Database ID (undefined for local-only submissions)
  drillId: string
  drillName: string
  focusArea?: string
  videoBlob?: Blob
  videoUrl?: string
  videoBase64?: string // For database storage
  videoDuration?: number
  timestamp: Date
  analyzed: boolean
  trimStart?: number // Start time in seconds for trimmed clip
  trimEnd?: number   // End time in seconds for trimmed clip
  // Legacy analysis result format (for backward compatibility)
  analysisResult?: {
    formScore: number
    feedback: string[]
    improvements: string[]
    positives?: string[]
    coachingTips?: string[]
    detailedFeedback?: string
    drillSpecific?: boolean
    analysisType?: 'quick' | 'deep'
  }
  // New coach-centric analysis format
  coachAnalysis?: CoachAnalysisResult
  savedToDatabase?: boolean
}

function WorkoutTimer({ workout, preferences, onComplete, onCancel }: WorkoutTimerProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0)
  const [exerciseTimeLeft, setExerciseTimeLeft] = useState(workout.exercises[0]?.duration || 0)
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [completedExercises, setCompletedExercises] = useState<string[]>([])
  const [showNextExercisePopup, setShowNextExercisePopup] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([])
  const [showExerciseDetail, setShowExerciseDetail] = useState<string | null>(null)
  
  // Per-drill media capture state
  const [drillMediaMap, setDrillMediaMap] = useState<Record<string, {
    type: 'video' | 'image' | 'none' | null
    blob?: Blob
    url?: string
    hasCoachFeedback?: boolean
    coachFeedback?: CoachAnalysisResult
    analysisType?: 'quick' | 'deep'
  }>>({})
  const [drillMediaExpanded, setDrillMediaExpanded] = useState<string | null>(null) // Which drill's dropdown is open
  const [selectedDrillForExplanation, setSelectedDrillForExplanation] = useState<Exercise | null>(null) // Drill to show explanation popup for
  const [showWorkoutSummary, setShowWorkoutSummary] = useState(false) // Show workout completion summary with analysis
  const [expandedSummaryDrill, setExpandedSummaryDrill] = useState<string | null>(null) // Which drill is expanded in summary
  const [showDrillMediaCapture, setShowDrillMediaCapture] = useState(false)
  const [currentDrillForMedia, setCurrentDrillForMedia] = useState<Exercise | null>(null)
  const [capturedMediaBlob, setCapturedMediaBlob] = useState<Blob | null>(null)
  const [capturedMediaType, setCapturedMediaType] = useState<'video' | 'image' | null>(null)
  const [isCapturingMedia, setIsCapturingMedia] = useState(false)
  const [showDrillFeedback, setShowDrillFeedback] = useState<string | null>(null) // drill ID to show feedback for
  
  // Video upload state (legacy - keeping for compatibility)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [uploadedVideoBlob, setUploadedVideoBlob] = useState<Blob | null>(null)
  const [drillSubmissions, setDrillSubmissions] = useState<DrillVideoSubmission[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false)
  const [isSavingToDatabase, setIsSavingToDatabase] = useState(false)
  
  // Video trimmer state
  const [showVideoTrimmer, setShowVideoTrimmer] = useState(false)
  const [videoDuration, setVideoDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(90) // Default 90 second clip
  const [isTrimmingVideo, setIsTrimmingVideo] = useState(false)
  
  // Post-workout analysis selection
  const [showPostWorkoutAnalysis, setShowPostWorkoutAnalysis] = useState(false)
  const [selectedVideoForAnalysis, setSelectedVideoForAnalysis] = useState<DrillVideoSubmission | null>(null)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const previewVideoRef = useRef<HTMLVideoElement>(null)
  const trimmerVideoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  const currentExercise = workout.exercises[currentExerciseIndex]
  const totalWorkoutTime = workout.exercises.reduce((sum, e) => sum + e.duration, 0)
  const progress = (totalTimeElapsed / totalWorkoutTime) * 100
  
  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (isRunning && !isPaused) {
      interval = setInterval(() => {
        setExerciseTimeLeft(prev => {
          if (prev <= 1) {
            // Exercise complete
            if (preferences.soundEnabled) {
              playChime()
            }
            
            setCompletedExercises(prev => [...prev, currentExercise.id])
            
            // Check if workout is complete
            if (currentExerciseIndex >= workout.exercises.length - 1) {
              setIsRunning(false)
              if (preferences.soundEnabled) {
                playCompletionSound()
              }
              return 0
            }
            
            // Move to next exercise - show media capture popup
            setCurrentDrillForMedia(currentExercise)
            setShowDrillMediaCapture(true)
            setIsRunning(false)
            
            return 0
          }
          return prev - 1
        })
        
        setTotalTimeElapsed(prev => prev + 1)
      }, 1000)
    }
    
    return () => clearInterval(interval)
  }, [isRunning, isPaused, currentExerciseIndex, preferences, workout.exercises, currentExercise])
  
  // Start video recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      
      const chunks: Blob[] = []
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      mediaRecorder.onstop = () => {
        setRecordedChunks(chunks)
      }
      
      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error starting recording:', error)
      alert('Unable to access camera. Please check permissions.')
    }
  }
  
  // Stop video recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    setIsRecording(false)
    
    // Create blob from recorded chunks after a short delay
    setTimeout(() => {
      if (recordedChunks.length > 0) {
        const blob = new Blob(recordedChunks, { type: 'video/webm' })
        const url = URL.createObjectURL(blob)
        setUploadedVideoBlob(blob)
        setUploadedVideoUrl(url)
        setRecordedChunks([])
      }
    }, 100)
  }
  
  // Handle video file upload
  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        setAnalysisError('Please upload a valid video file')
        return
      }
      
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setAnalysisError('Video file is too large. Maximum size is 100MB.')
        return
      }
      
      const videoUrl = URL.createObjectURL(file)
      setUploadedVideoUrl(videoUrl)
      setUploadedVideoBlob(file)
      setAnalysisError(null)
      
      // Show trimmer for videos longer than 90 seconds
      const tempVideo = document.createElement('video')
      tempVideo.src = videoUrl
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration
        setVideoDuration(duration)
        if (duration > 90) {
          setTrimStart(0)
          setTrimEnd(Math.min(90, duration))
          setShowVideoTrimmer(true)
        }
      }
    }
  }
  
  // Handle video loaded metadata for trimmer
  const handleTrimmerVideoLoaded = () => {
    if (trimmerVideoRef.current) {
      const duration = trimmerVideoRef.current.duration
      setVideoDuration(duration)
      if (duration <= 90) {
        setTrimEnd(duration)
      }
    }
  }
  
  // Preview trimmed section
  const previewTrimmedSection = () => {
    if (trimmerVideoRef.current) {
      trimmerVideoRef.current.currentTime = trimStart
      trimmerVideoRef.current.play()
      
      // Stop at trim end
      const checkTime = () => {
        if (trimmerVideoRef.current && trimmerVideoRef.current.currentTime >= trimEnd) {
          trimmerVideoRef.current.pause()
          trimmerVideoRef.current.currentTime = trimStart
        } else if (trimmerVideoRef.current && !trimmerVideoRef.current.paused) {
          requestAnimationFrame(checkTime)
        }
      }
      requestAnimationFrame(checkTime)
    }
  }
  
  // Trim video to 90 seconds using canvas and MediaRecorder
  const trimVideoTo90Seconds = async (): Promise<Blob | null> => {
    if (!trimmerVideoRef.current || !uploadedVideoUrl) return null
    
    setIsTrimmingVideo(true)
    
    try {
      const video = trimmerVideoRef.current
      const canvas = canvasRef.current || document.createElement('canvas')
      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not get canvas context')
      }
      
      // Create a MediaRecorder to capture the trimmed video
      const stream = canvas.captureStream(30) // 30 fps
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' })
      const chunks: Blob[] = []
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      return new Promise((resolve, reject) => {
        mediaRecorder.onstop = () => {
          const trimmedBlob = new Blob(chunks, { type: 'video/webm' })
          resolve(trimmedBlob)
        }
        
        mediaRecorder.onerror = () => {
          reject(new Error('MediaRecorder error'))
        }
        
        // Set video to start time
        video.currentTime = trimStart
        
        video.onseeked = () => {
          mediaRecorder.start()
          video.play()
          
          // Draw frames to canvas
          const drawFrame = () => {
            if (video.currentTime >= trimEnd || video.paused || video.ended) {
              video.pause()
              mediaRecorder.stop()
              return
            }
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            requestAnimationFrame(drawFrame)
          }
          drawFrame()
        }
      })
    } catch (error) {
      console.error('Error trimming video:', error)
      setAnalysisError('Failed to trim video. Please try again.')
      return null
    } finally {
      setIsTrimmingVideo(false)
    }
  }
  
  // Confirm trim and prepare for submission
  const confirmTrim = async () => {
    const trimmedBlob = await trimVideoTo90Seconds()
    if (trimmedBlob) {
      // Replace the uploaded video with the trimmed version
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
      }
      const newUrl = URL.createObjectURL(trimmedBlob)
      setUploadedVideoUrl(newUrl)
      setUploadedVideoBlob(trimmedBlob)
      setShowVideoTrimmer(false)
    }
  }
  
  // Skip trimming and use full video (if under 90 seconds) or first 90 seconds
  const skipTrim = () => {
    setShowVideoTrimmer(false)
  }
  
  // Clear uploaded video
  const clearUploadedVideo = () => {
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }
    setUploadedVideoUrl(null)
    setUploadedVideoBlob(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }
  
  // SAVE video to database (not submit to hybrid yet)
  const saveVideoLocally = async () => {
    if (!uploadedVideoBlob || !currentExercise) return
    
    setIsSavingToDatabase(true)
    
    try {
      // Convert blob to base64 for database storage
      const reader = new FileReader()
      const videoBase64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1] // Remove data:video/webm;base64, prefix
          resolve(base64)
        }
        reader.onerror = reject
      })
      reader.readAsDataURL(uploadedVideoBlob)
      
      const videoBase64 = await videoBase64Promise
      
      // Get video duration
      let duration = videoDuration
      if (!duration && uploadedVideoUrl) {
        const tempVideo = document.createElement('video')
        tempVideo.src = uploadedVideoUrl
        await new Promise<void>((resolve) => {
          tempVideo.onloadedmetadata = () => {
            duration = tempVideo.duration
            resolve()
          }
        })
      }
      
      // Save to database
      const response = await fetch('/api/drill-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drillId: currentExercise.id,
          drillName: currentExercise.name,
          focusArea: currentExercise.focusArea,
          videoBase64,
          videoDuration: duration,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save video to database')
      }
      
      const data = await response.json()
      
      // Create local submission with database ID
      const submission: DrillVideoSubmission = {
        id: data.drillVideo.id,
        drillId: currentExercise.id,
        drillName: currentExercise.name,
        focusArea: currentExercise.focusArea,
        videoBlob: uploadedVideoBlob,
        videoUrl: uploadedVideoUrl || undefined,
        videoBase64,
        videoDuration: duration,
        timestamp: new Date(),
        analyzed: false,
        savedToDatabase: true,
      }
      
      setDrillSubmissions(prev => [...prev, submission])
      setShowSubmitSuccess(true)
      
      // Clear the current video preview
      setTimeout(() => {
        clearUploadedVideo()
        setShowSubmitSuccess(false)
      }, 2000)
      
    } catch (error) {
      console.error('Error saving video to database:', error)
      setAnalysisError('Failed to save video. Please try again.')
      
      // Still save locally even if database fails
      const submission: DrillVideoSubmission = {
        drillId: currentExercise.id,
        drillName: currentExercise.name,
        focusArea: currentExercise.focusArea,
        videoBlob: uploadedVideoBlob,
        videoUrl: uploadedVideoUrl || undefined,
        timestamp: new Date(),
        analyzed: false,
        savedToDatabase: false,
      }
      setDrillSubmissions(prev => [...prev, submission])
    } finally {
      setIsSavingToDatabase(false)
    }
  }
  
  // Select a saved video for analysis/trimming
  const selectVideoForAnalysis = (submission: DrillVideoSubmission) => {
    setSelectedVideoForAnalysis(submission)
    
    // If video has a URL, load it for trimming
    if (submission.videoUrl) {
      const tempVideo = document.createElement('video')
      tempVideo.src = submission.videoUrl
      tempVideo.onloadedmetadata = () => {
        const duration = tempVideo.duration
        setVideoDuration(duration)
        setTrimStart(0)
        setTrimEnd(Math.min(10, duration))
      }
    }
  }
  
  // Generate quick analysis based on drill criteria (fallback when vision API unavailable)
  const generateQuickAnalysis = (exercise: Exercise, criteria: ReturnType<typeof getDrillCriteria>) => {
    const baseScore = 65 + Math.floor(Math.random() * 20) // 65-85 range
    
    const positives = criteria?.correctFormCriteria.slice(0, 2).map(c => 
      `Good attempt at: ${c.toLowerCase()}`
    ) || [
      `Good effort on the ${exercise.name} drill`,
      'Showing commitment to practice'
    ]
    
    const improvements = criteria?.commonMistakes.slice(0, 2).map(m =>
      `Watch out for: ${m.toLowerCase()}`
    ) || [
      'Focus on maintaining proper form throughout',
      'Try to be more consistent with each repetition'
    ]
    
    const coachingTips = exercise.tips.slice(0, 3)
    
    return {
      formScore: baseScore,
      positives,
      improvements,
      coachingTips,
      feedback: positives,
      detailedFeedback: `Analysis of your ${exercise.name} drill. Focus area: ${exercise.focusArea}. ${exercise.description.slice(0, 100)}...`
    }
  }
  
  // Submit SELECTED video to hybrid system for analysis
  const submitSelectedVideoToHybrid = async () => {
    if (!selectedVideoForAnalysis) {
      setAnalysisError('No video selected for analysis')
      return
    }
    
    // Check if we have video data (either blob or base64)
    if (!selectedVideoForAnalysis.videoBlob && !selectedVideoForAnalysis.videoBase64) {
      setAnalysisError('No video data available for analysis')
      return
    }
    
    setIsAnalyzing(true)
    setAnalysisError(null)
    
    try {
      // Get the hybrid API URL from environment
      const hybridApiUrl = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'
      
      // Get video blob - either from existing blob or convert from base64
      let videoToSend: Blob
      
      if (selectedVideoForAnalysis.videoBlob) {
        videoToSend = selectedVideoForAnalysis.videoBlob
      } else if (selectedVideoForAnalysis.videoBase64) {
        // Convert base64 to blob
        const byteCharacters = atob(selectedVideoForAnalysis.videoBase64)
        const byteNumbers = new Array(byteCharacters.length)
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i)
        }
        const byteArray = new Uint8Array(byteNumbers)
        videoToSend = new Blob([byteArray], { type: 'video/webm' })
      } else {
        throw new Error('No video data available')
      }
      
      // If video is longer than 90 seconds and we have trim points, trim it first
      if (videoDuration > 90 && trimmerVideoRef.current) {
        const trimmedBlob = await trimVideoTo90Seconds()
        if (trimmedBlob) {
          videoToSend = trimmedBlob
        }
      }
      
      // Get drill-specific analysis criteria
      const drillCriteria = getDrillCriteria(selectedVideoForAnalysis.drillId)
      const drillExercise = EXERCISE_DATABASE.find(e => e.id === selectedVideoForAnalysis.drillId)
      const analysisPrompt = generateDrillAnalysisPrompt(selectedVideoForAnalysis.drillId, selectedVideoForAnalysis.drillName)
      
      // Create form data for upload with drill context
      const formData = new FormData()
      formData.append('video', videoToSend, 'drill_video.webm')
      formData.append('drill_id', selectedVideoForAnalysis.drillId)
      formData.append('drill_name', selectedVideoForAnalysis.drillName)
      formData.append('focus_area', drillExercise?.focusArea || 'general')
      formData.append('trim_start', trimStart.toString())
      formData.append('trim_end', trimEnd.toString())
      
      // Include drill-specific context for AI analysis
      if (drillCriteria) {
        formData.append('drill_context', JSON.stringify({
          correctFormCriteria: drillCriteria.correctFormCriteria,
          commonMistakes: drillCriteria.commonMistakes,
          keyBodyParts: drillCriteria.keyBodyParts,
          scoringWeights: drillCriteria.scoringWeights,
          analysisPrompt: analysisPrompt
        }))
      }
      
      // Include drill description and tips for context
      if (drillExercise) {
        formData.append('drill_description', drillExercise.description)
        formData.append('drill_tips', JSON.stringify(drillExercise.tips))
      }
      
      // Send to hybrid system for analysis
      const response = await fetch(`${hybridApiUrl}/analyze-drill-video`, {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}: Failed to analyze video`)
      }
      
      const analysisResult = await response.json()
      
      // Format the analysis result with drill-specific context
      const formattedResult = formatAnalysisResult(
        selectedVideoForAnalysis.drillId,
        selectedVideoForAnalysis.drillName,
        analysisResult
      )
      
      const formScore = formattedResult.formScore
      const feedback = analysisResult.feedback || formattedResult.positives
      const improvements = formattedResult.improvements
      const positives = formattedResult.positives
      const coachingTips = formattedResult.coachingTips
      
      // Update the submission with analysis results
      setDrillSubmissions(prev => prev.map(sub => 
        sub === selectedVideoForAnalysis 
          ? {
              ...sub,
              analyzed: true,
              trimStart,
              trimEnd,
              analysisResult: {
                formScore,
                feedback,
                improvements,
                positives,
                coachingTips,
                detailedFeedback: formattedResult.detailedFeedback,
                drillSpecific: !!drillCriteria
              }
            }
          : sub
      ))
      
      // Update database if this video was saved to database
      if (selectedVideoForAnalysis.id && selectedVideoForAnalysis.savedToDatabase) {
        try {
          await fetch(`/api/drill-videos/${selectedVideoForAnalysis.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              analyzed: true,
              formScore,
              feedback: [...feedback, ...(positives || []), ...(coachingTips || [])],
              improvements,
              trimStart,
              trimEnd,
            }),
          })
        } catch (dbError) {
          console.error('Error updating database with analysis results:', dbError)
          // Don't fail the whole operation if database update fails
        }
      }
      
      // Clear selection and show success
      setSelectedVideoForAnalysis(null)
      setShowSubmitSuccess(true)
      setTimeout(() => setShowSubmitSuccess(false), 3000)
      
    } catch (error) {
      console.error('Error analyzing video:', error)
      setAnalysisError(
        error instanceof Error 
          ? `Analysis failed: ${error.message}` 
          : 'Failed to analyze video. Please check that the hybrid system is running and try again.'
      )
    } finally {
      setIsAnalyzing(false)
    }
  }
  
  // Delete a saved video
  const deleteSavedVideo = async (submission: DrillVideoSubmission) => {
    if (submission.videoUrl) {
      URL.revokeObjectURL(submission.videoUrl)
    }
    
    // Delete from database if it was saved there
    if (submission.id && submission.savedToDatabase) {
      try {
        await fetch(`/api/drill-videos/${submission.id}`, {
          method: 'DELETE',
        })
      } catch (error) {
        console.error('Error deleting video from database:', error)
        // Continue with local deletion even if database delete fails
      }
    }
    
    setDrillSubmissions(prev => prev.filter(s => s !== submission))
    if (selectedVideoForAnalysis === submission) {
      setSelectedVideoForAnalysis(null)
    }
  }
  
  // Continue to next exercise (step-by-step mode)
  const continueToNextExercise = () => {
    setShowNextExercisePopup(false)
    setCurrentExerciseIndex(i => i + 1)
    setExerciseTimeLeft(workout.exercises[currentExerciseIndex + 1]?.duration || 0)
    setIsRunning(true)
    // Clear any uploaded video when moving to next exercise
    clearUploadedVideo()
  }
  
  // Skip current exercise (without marking as complete)
  const skipExercise = () => {
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1)
      setExerciseTimeLeft(workout.exercises[currentExerciseIndex + 1]?.duration || 0)
    }
  }
  
  // Manually complete current exercise
  const completeExercise = () => {
    const currentExercise = workout.exercises[currentExerciseIndex]
    if (currentExercise && !completedExercises.includes(currentExercise.id)) {
      setCompletedExercises(prev => [...prev, currentExercise.id])
      playCompletionSound()
    }
    
    // Move to next exercise if not the last one
    if (currentExerciseIndex < workout.exercises.length - 1) {
      setCurrentExerciseIndex(i => i + 1)
      setExerciseTimeLeft(workout.exercises[currentExerciseIndex + 1]?.duration || 0)
      setIsRunning(false)
      setIsPaused(false)
    } else {
      // All exercises done
      setIsRunning(false)
    }
  }
  
  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }
  
  // Analysis progress state
  const [analysisProgress, setAnalysisProgress] = useState<{
    current: number
    total: number
    drillName: string
    status: 'extracting' | 'analyzing' | 'complete' | 'error'
  } | null>(null)
  
  // Handle workout completion - AUTO-ANALYZE all drills with Vision AI ONE BY ONE
  const handleComplete = async () => {
    stopRecording()
    setShowWorkoutSummary(true) // Show summary immediately
    setIsAnalyzing(true)
    
    // Get all drills that have media but NO feedback yet
    const drillsToAnalyze: { drillKey: string; exercise: Exercise; mediaState: any; index: number }[] = []
    
    workout.exercises.forEach((exercise, index) => {
      const drillKey = `workout-${exercise.id}-${index}`
      const mediaState = drillMediaMap[drillKey]
      
      // Has media but no feedback yet
      if (mediaState && mediaState.type && mediaState.type !== 'none' && !mediaState.hasCoachFeedback) {
        drillsToAnalyze.push({ drillKey, exercise, mediaState, index })
      }
    })
    
    // Process ONE BY ONE with progress updates
    for (let i = 0; i < drillsToAnalyze.length; i++) {
      const { drillKey, exercise, mediaState } = drillsToAnalyze[i]
      
      // Update progress - extracting frame
      setAnalysisProgress({
        current: i + 1,
        total: drillsToAnalyze.length,
        drillName: exercise.name,
        status: 'extracting'
      })
      
      try {
        let frameBase64: string
        
        if (mediaState.type === 'video' && mediaState.blob) {
          // Extract frame from video
          const video = document.createElement('video')
          video.src = mediaState.url || URL.createObjectURL(mediaState.blob)
          video.muted = true
          video.playsInline = true
          
          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Video load timeout')), 5000)
            video.onloadeddata = () => { clearTimeout(timeout); resolve() }
            video.onerror = () => { clearTimeout(timeout); reject(new Error('Video load error')) }
            video.load()
          })
          
          video.currentTime = Math.min(0.5, video.duration / 2)
          await new Promise(resolve => setTimeout(resolve, 300))
          
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 480
          const ctx = canvas.getContext('2d')
          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
          // Add SHOTIQ watermark before export
          addWatermarkToCanvas(canvas)
          frameBase64 = canvas.toDataURL('image/jpeg', 0.8)
        } else if (mediaState.blob) {
          // Convert image to base64
          frameBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('File read error'))
            reader.readAsDataURL(mediaState.blob)
          })
        } else {
          continue // Skip if no blob
        }
        
        // Update progress - analyzing with Vision AI
        setAnalysisProgress({
          current: i + 1,
          total: drillsToAnalyze.length,
          drillName: exercise.name,
          status: 'analyzing'
        })
        
        // Call Vision AI with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
        
        const response = await fetch('/api/vision-analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: frameBase64,
            drillId: exercise.id,
            drillName: exercise.name,
            drillDescription: exercise.description,
            coachingPoints: exercise.tips,
            focusArea: exercise.focusArea
          }),
          signal: controller.signal
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const result = await response.json()
          
          // API returns { success, analysis } - extract the analysis
          const analysis = result.analysis || result
          
          // Update this drill's feedback immediately
          setDrillMediaMap(prev => ({
            ...prev,
            [drillKey]: {
              ...prev[drillKey],
              hasCoachFeedback: true,
              coachFeedback: analysis,
              analysisType: 'quick'
            }
          }))
          
          // Update progress - complete
          setAnalysisProgress({
            current: i + 1,
            total: drillsToAnalyze.length,
            drillName: exercise.name,
            status: 'complete'
          })
        } else {
          console.error(`Vision AI error for ${exercise.name}:`, response.status, await response.text())
          setAnalysisProgress({
            current: i + 1,
            total: drillsToAnalyze.length,
            drillName: exercise.name,
            status: 'error'
          })
        }
      } catch (err) {
        console.error(`Analysis failed for ${exercise.name}:`, err)
        setAnalysisProgress({
          current: i + 1,
          total: drillsToAnalyze.length,
          drillName: exercise.name,
          status: 'error'
        })
      }
      
      // Small delay between drills for UX
      if (i < drillsToAnalyze.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    
    setIsAnalyzing(false)
    setAnalysisProgress(null)
  }
  
  // Actually finish and close the workout - SAVE ALL FEEDBACK TO DATABASE
  const finishWorkout = async () => {
    // Save all drill feedback to database
    const savePromises: Promise<any>[] = []
    
    workout.exercises.forEach((exercise, index) => {
      const drillKey = `workout-${exercise.id}-${index}`
      const mediaState = drillMediaMap[drillKey]
      
      // Only save if we have feedback
      if (mediaState?.hasCoachFeedback && mediaState?.coachFeedback) {
        const savePromise = fetch('/api/drill-feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            drillId: exercise.id,
            drillName: exercise.name,
            focusArea: exercise.focusArea,
            mediaType: mediaState.type,
            mediaUrl: mediaState.url || null,
            thumbnailUrl: null, // Could extract frame later
            workoutId: workout.id || `workout-${Date.now()}`,
            workoutName: workout.name,
            workoutDate: new Date().toISOString(),
            analysisType: mediaState.analysisType || 'quick',
            coachAnalysis: mediaState.coachFeedback
          })
        }).catch(err => {
          console.error(`Failed to save feedback for ${exercise.name}:`, err)
        })
        
        savePromises.push(savePromise)
      }
    })
    
    // Wait for all saves to complete (don't block UI though)
    if (savePromises.length > 0) {
      Promise.all(savePromises).then(() => {
        console.log(`Saved ${savePromises.length} drill feedback entries to database`)
      })
    }
    
    const videoBlob = recordedChunks.length > 0 
      ? new Blob(recordedChunks, { type: 'video/webm' })
      : undefined
    onComplete(videoBlob)
  }
  
  // Check if all exercises are done
  const isWorkoutComplete = completedExercises.length === workout.exercises.length
  
  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* Header */}
      <div className="bg-[#1a1a1a] border-b border-[#3a3a3a] p-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div>
            <h2 className="text-xl font-black text-[#FF6B35] uppercase">{workout.name.toUpperCase()}</h2>
            <p className="text-[#888] text-sm uppercase">{workout.exercises.length} EXERCISES • {workout.duration} MIN</p>
          </div>
          <button onClick={onCancel} className="text-[#888] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Progress Bar */}
      <div className="bg-[#1a1a1a] px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-[#888] mt-1">
            <span>{formatTime(totalTimeElapsed)}</span>
            <span>{Math.round(progress)}% complete</span>
            <span>{formatTime(totalWorkoutTime - totalTimeElapsed)}</span>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Exercise */}
          <div className="bg-[#1a1a1a] rounded-2xl p-6 border border-[#3a3a3a]">
            <div className="text-center">
              <p className="text-[#888] text-sm uppercase tracking-wider mb-2">
                Exercise {currentExerciseIndex + 1} of {workout.exercises.length}
              </p>
              <h3 className="text-2xl font-black text-[#E5E5E5] mb-4 uppercase">{currentExercise?.name?.toUpperCase()}</h3>
              
              {/* Timer Display */}
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#2a2a2a"
                    strokeWidth="8"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    fill="none"
                    stroke="#FF6B35"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={553}
                    strokeDashoffset={553 - (553 * (exerciseTimeLeft / (currentExercise?.duration || 1)))}
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-[#FF6B35]">{formatTime(exerciseTimeLeft)}</span>
                  <span className="text-[#888] text-sm">{currentExercise?.reps || ''}</span>
                </div>
              </div>
              
              {/* Controls */}
              <div className="flex items-center justify-center gap-4">
                {!isRunning ? (
                  <button
                    onClick={() => setIsRunning(true)}
                    className="w-16 h-16 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-600 transition-colors"
                  >
                    <Play className="w-8 h-8 ml-1" />
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`w-16 h-16 rounded-full ${isPaused ? 'bg-green-500' : 'bg-orange-500'} text-white flex items-center justify-center hover:brightness-110 transition-all`}
                  >
                    {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
                  </button>
                )}
                <button
                  onClick={completeExercise}
                  className="w-12 h-12 rounded-full bg-[#FF6B35] text-[#1a1a1a] flex items-center justify-center hover:brightness-110 transition-colors"
                  title="Complete drill"
                >
                  <Check className="w-6 h-6" />
                </button>
                <button
                  onClick={skipExercise}
                  className="w-12 h-12 rounded-full bg-[#2a2a2a] text-[#888] flex items-center justify-center hover:bg-[#3a3a3a] transition-colors"
                  title="Skip exercise"
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>
              
              {/* Button Labels */}
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-[#888] text-xs w-16 text-center">
                  {!isRunning ? 'START' : (isPaused ? 'RESUME' : 'PAUSE')}
                </span>
                <span className="text-[#FF6B35] text-xs w-12 text-center font-bold">DONE</span>
                <span className="text-[#888] text-xs w-12 text-center">SKIP</span>
              </div>
              
              {/* Exercise Tips */}
              <button
                onClick={() => setShowExerciseDetail(showExerciseDetail === currentExercise?.id ? null : currentExercise?.id)}
                className="mt-6 text-[#FF6B35] text-sm flex items-center gap-2 mx-auto hover:underline"
              >
                <Info className="w-4 h-4" />
                {showExerciseDetail === currentExercise?.id ? 'Hide Details' : 'Show Exercise Details'}
              </button>
              
              {showExerciseDetail === currentExercise?.id && currentExercise && (
                <div className="mt-4 bg-[#2a2a2a] rounded-xl p-4 text-left">
                  <p className="text-[#E5E5E5] text-sm mb-3">{currentExercise.description}</p>
                  <h4 className="text-[#FF6B35] text-xs font-bold uppercase mb-2">Tips:</h4>
                  <ul className="space-y-1">
                    {currentExercise.tips.map((tip, i) => (
                      <li key={i} className="text-[#888] text-xs flex items-start gap-2">
                        <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          
          {/* Exercise List with Per-Drill Media Options */}
          <div className="space-y-4">
            {/* Exercise List - Each drill has its own media options */}
            <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-[#3a3a3a]">
              <h4 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2">
                <Dumbbell className="w-4 h-4" />
                WORKOUT DRILLS
              </h4>
              
              {/* Per-Drill Exercise List with Media Options */}
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {workout.exercises.map((exercise, i) => {
                  const isCompleted = completedExercises.includes(exercise.id)
                  const isCurrent = i === currentExerciseIndex
                  const drillKey = `workout-${exercise.id}-${i}`
                  const isExpanded = drillMediaExpanded === drillKey
                  const mediaState = drillMediaMap[drillKey]
                  const hasMedia = mediaState?.type && mediaState.type !== 'none'
                  const hasFeedback = mediaState?.hasCoachFeedback
                  
                  return (
                    <div key={drillKey} className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                      {/* Drill Header Row */}
                      <div 
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-[#3a3a3a]/50 transition-colors ${
                          isCurrent ? 'bg-[#FF6B35]/10 border-l-4 border-l-[#FF6B35]' : ''
                        }`}
                        onClick={() => setSelectedDrillForExplanation(exercise)}
                      >
                        {/* Number/Check Badge */}
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          isCompleted ? 'bg-green-500 text-white' : 
                          isCurrent ? 'bg-[#FF6B35] text-[#1a1a1a]' : 
                          'bg-[#3a3a3a] text-[#888]'
                        }`}>
                          {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                        </div>
                        
                        {/* Drill Name & Info */}
                        <div className="flex-1 min-w-0">
                          <p className={`font-bold text-sm truncate uppercase ${isCurrent ? 'text-[#FF6B35]' : 'text-[#E5E5E5]'}`}>
                            {exercise.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#888]">
                            <span>{formatTime(exercise.duration)}</span>
                            {exercise.reps && <span>• {exercise.reps}</span>}
                          </div>
                        </div>
                        
                        {/* Media Status Indicator */}
                        {hasMedia && (
                          <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                            {mediaState?.type === 'video' ? '📹' : '📷'}
                          </span>
                        )}
                        {mediaState?.type === 'none' && (
                          <span className="px-2 py-1 rounded text-xs bg-[#3a3a3a] text-[#666]">SKIPPED</span>
                        )}
                        
                        {/* Coach Feedback Badge */}
                        {hasFeedback && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowDrillFeedback(drillKey)
                            }}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-[#FF6B35]/20"
                          >
                            <img 
                              src="/icons/coach-feedback.png" 
                              alt="Coach" 
                              className="w-4 h-4"
                              style={{ filter: 'invert(1) brightness(2)' }}
                            />
                            <span className="text-[#FF6B35] text-xs font-bold">
                              {mediaState?.coachFeedback?.overallGrade}
                            </span>
                          </button>
                        )}
                        
                        {/* Media Options Dropdown Toggle */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDrillMediaExpanded(isExpanded ? null : drillKey)
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isExpanded ? 'bg-[#FF6B35] text-[#1a1a1a]' : 'bg-[#3a3a3a] text-[#888] hover:text-white'
                          }`}
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Expanded Media Options */}
                      {isExpanded && (
                        <div className="p-3 pt-0 border-t border-[#3a3a3a] bg-[#1a1a1a]">
                          <p className="text-[#888] text-xs mb-3 uppercase">CAPTURE YOUR FORM FOR THIS DRILL:</p>
                          <div className="grid grid-cols-3 gap-2">
                            {/* Record with Camera */}
                            <button
                              onClick={() => {
                                alert('Camera recording coming soon! For now, please upload a video file.')
                                // TODO: Implement camera recording for specific drill
                              }}
                              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] hover:border-red-500/50 hover:bg-red-500/10 transition-colors"
                            >
                              <Video className="w-5 h-5 text-red-400" />
                              <span className="text-[10px] text-[#888] uppercase">Record</span>
                            </button>
                            
                            {/* Upload Video/Image - AUTO-ANALYZES with Vision AI */}
                            <label className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] hover:border-blue-500/50 hover:bg-blue-500/10 transition-colors cursor-pointer">
                              <Upload className="w-5 h-5 text-blue-400" />
                              <span className="text-[10px] text-[#888] uppercase">Upload</span>
                              <input 
                                type="file" 
                                accept="video/*,image/*" 
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0]
                                  if (file) {
                                    const isVideo = file.type.startsWith('video/')
                                    const url = URL.createObjectURL(file)
                                    
                                    // Save media first
                                    setDrillMediaMap(prev => ({
                                      ...prev,
                                      [drillKey]: {
                                        type: isVideo ? 'video' : 'image',
                                        blob: file,
                                        url: url,
                                        hasCoachFeedback: false
                                      }
                                    }))
                                    setDrillMediaExpanded(null)
                                    
                                    // AUTO-ANALYZE with Vision AI
                                    setIsAnalyzing(true)
                                    try {
                                      let frameBase64: string
                                      
                                      if (isVideo) {
                                        // Extract frame from video
                                        const video = document.createElement('video')
                                        video.src = url
                                        await new Promise(resolve => { video.onloadeddata = resolve; video.load() })
                                        video.currentTime = 0.5
                                        await new Promise(resolve => setTimeout(resolve, 500))
                                        
                                        const canvas = document.createElement('canvas')
                                        canvas.width = video.videoWidth || 640
                                        canvas.height = video.videoHeight || 480
                                        canvas.getContext('2d')?.drawImage(video, 0, 0)
                                        // Add SHOTIQ watermark before export
                                        addWatermarkToCanvas(canvas)
                                        frameBase64 = canvas.toDataURL('image/jpeg', 0.8)
                                      } else {
                                        // Convert image to base64
                                        frameBase64 = await new Promise<string>((resolve) => {
                                          const reader = new FileReader()
                                          reader.onload = () => resolve(reader.result as string)
                                          reader.readAsDataURL(file)
                                        })
                                      }
                                      
                                      // Call Vision AI
                                      const response = await fetch('/api/vision-analyze', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          image: frameBase64,
                                          drillId: exercise.id,
                                          drillName: exercise.name,
                                          drillDescription: exercise.description,
                                          coachingPoints: exercise.tips,
                                          focusArea: exercise.focusArea
                                        })
                                      })
                                      
                                      if (response.ok) {
                                        const result = await response.json()
                                        const analysis = result.analysis || result
                                        setDrillMediaMap(prev => ({
                                          ...prev,
                                          [drillKey]: {
                                            ...prev[drillKey],
                                            hasCoachFeedback: true,
                                            coachFeedback: analysis,
                                            analysisType: 'quick'
                                          }
                                        }))
                                      }
                                    } catch (err) {
                                      console.error('Auto-analysis failed:', err)
                                    } finally {
                                      setIsAnalyzing(false)
                                    }
                                  }
                                }}
                              />
                            </label>
                            
                            {/* No Input / Skip */}
                            <button
                              onClick={() => {
                                setDrillMediaMap(prev => ({
                                  ...prev,
                                  [drillKey]: {
                                    type: 'none',
                                    hasCoachFeedback: false
                                  }
                                }))
                                setDrillMediaExpanded(null)
                              }}
                              className="flex flex-col items-center gap-2 p-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#888]/50 hover:bg-[#3a3a3a] transition-colors"
                            >
                              <X className="w-5 h-5 text-[#666]" />
                              <span className="text-[10px] text-[#888] uppercase">Skip</span>
                            </button>
                          </div>
                          
                          {/* Show uploaded media preview */}
                          {hasMedia && mediaState?.url && (
                            <div className="mt-3 relative">
                              {mediaState.type === 'video' ? (
                                <video src={mediaState.url} controls className="w-full rounded-lg max-h-32 object-contain bg-black" />
                              ) : (
                                <img src={mediaState.url} alt="Uploaded" className="w-full rounded-lg max-h-32 object-contain bg-black" />
                              )}
                              <button
                                onClick={() => {
                                  setDrillMediaMap(prev => {
                                    const newMap = { ...prev }
                                    delete newMap[drillKey]
                                    return newMap
                                  })
                                }}
                                className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white hover:bg-red-500"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              
                              {/* Analysis Buttons - Quick (Vision AI) and Deep (Hybrid System) */}
                              {!hasFeedback && (
                                <div className="mt-3 space-y-2">
                                  {/* Quick Analysis - Vision AI */}
                                  <button
                                    onClick={async () => {
                                      if (!mediaState.blob) return
                                      setIsAnalyzing(true)
                                      
                                      try {
                                        let frameBase64: string
                                        
                                        if (mediaState.type === 'video') {
                                          // Extract frame from video
                                          const video = document.createElement('video')
                                          video.src = mediaState.url!
                                          video.crossOrigin = 'anonymous'
                                          video.muted = true
                                          
                                          await new Promise<void>((resolve, reject) => {
                                            video.onloadeddata = () => resolve()
                                            video.onerror = () => reject(new Error('Failed to load video'))
                                            setTimeout(() => reject(new Error('Video load timeout')), 5000)
                                          })
                                          
                                          video.currentTime = video.duration / 2
                                          await new Promise<void>((resolve) => {
                                            video.onseeked = () => resolve()
                                            setTimeout(() => resolve(), 2000)
                                          })
                                          
                                          const canvas = document.createElement('canvas')
                                          canvas.width = video.videoWidth || 640
                                          canvas.height = video.videoHeight || 480
                                          const ctx = canvas.getContext('2d')
                                          ctx?.drawImage(video, 0, 0, canvas.width, canvas.height)
                                          // Add SHOTIQ watermark before export
                                          addWatermarkToCanvas(canvas)
                                          frameBase64 = canvas.toDataURL('image/jpeg', 0.85)
                                        } else {
                                          // Convert image to base64
                                          const reader = new FileReader()
                                          frameBase64 = await new Promise((resolve, reject) => {
                                            reader.onload = () => resolve(reader.result as string)
                                            reader.onerror = reject
                                            reader.readAsDataURL(mediaState.blob as Blob)
                                          })
                                        }
                                        
                                        // Call Vision AI
                                        const response = await fetch('/api/vision-analyze', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            image: frameBase64,
                                            drillId: exercise.id,
                                            drillName: exercise.name,
                                            drillDescription: exercise.description,
                                            coachingPoints: exercise.tips,
                                            focusArea: exercise.focusArea,
                                          }),
                                        })
                                        
                                        if (!response.ok) throw new Error('Vision API failed')
                                        
                                        const result = await response.json()
                                        
                                        setDrillMediaMap(prev => ({
                                          ...prev,
                                          [drillKey]: {
                                            ...prev[drillKey],
                                            hasCoachFeedback: true,
                                            coachFeedback: result.analysis,
                                            analysisType: 'quick'
                                          }
                                        }))
                                      } catch (error) {
                                        console.error('Analysis error:', error)
                                        setAnalysisError('Failed to analyze. Please try again.')
                                      } finally {
                                        setIsAnalyzing(false)
                                      }
                                    }}
                                    disabled={isAnalyzing}
                                    className="w-full py-2.5 rounded-lg bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] font-bold text-sm flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-50"
                                  >
                                    {isAnalyzing ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        COACH IS REVIEWING...
                                      </>
                                    ) : (
                                      <>
                                        <img 
                                          src="/icons/coach-feedback.png" 
                                          alt="Coach" 
                                          className="w-5 h-5"
                                          style={{ filter: 'invert(1) brightness(2)' }}
                                        />
                                        GET COACH FEEDBACK
                                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">VISION AI</span>
                                      </>
                                    )}
                                  </button>
                                  
                                  {/* Deep Analysis - Hybrid System */}
                                  <button
                                    onClick={async () => {
                                      if (!mediaState.blob || mediaState.type !== 'video') {
                                        setAnalysisError('Deep analysis requires a video file.')
                                        return
                                      }
                                      setIsAnalyzing(true)
                                      
                                      try {
                                        const hybridApiUrl = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'
                                        
                                        // Create form data with video
                                        const formData = new FormData()
                                        formData.append('video', mediaState.blob, 'drill-video.webm')
                                        formData.append('drill_id', exercise.id)
                                        formData.append('drill_name', exercise.name)
                                        formData.append('drill_context', exercise.description)
                                        formData.append('drill_tips', JSON.stringify(exercise.tips))
                                        formData.append('focus_area', exercise.focusArea)
                                        
                                        const response = await fetch(`${hybridApiUrl}/analyze-video`, {
                                          method: 'POST',
                                          body: formData,
                                        })
                                        
                                        if (!response.ok) {
                                          throw new Error('Hybrid system analysis failed')
                                        }
                                        
                                        const result = await response.json()
                                        
                                        // Format deep analysis result to match CoachAnalysisResult
                                        const deepAnalysis: CoachAnalysisResult = {
                                          overallGrade: result.grade || (result.form_score >= 90 ? 'A' : result.form_score >= 80 ? 'B' : result.form_score >= 70 ? 'C' : result.form_score >= 60 ? 'D' : 'F'),
                                          gradeDescription: result.summary || 'Deep biomechanical analysis complete.',
                                          coachSays: result.coach_feedback || `Based on the deep analysis, your ${exercise.focusArea} mechanics show ${result.form_score >= 80 ? 'good' : 'room for improvement in'} form.`,
                                          priorityFocus: {
                                            issue: result.primary_issue || result.improvements?.[0] || 'Focus on consistency',
                                            why: result.issue_explanation || 'This is the most impactful area for improvement.',
                                            howToFix: result.fix_instruction || 'Practice with intention and focus on form.',
                                            drillToHelp: result.recommended_drill || exercise.name,
                                            cue: result.quick_cue || 'Stay focused on the fundamentals.'
                                          },
                                          coachingPointEvaluations: exercise.tips.map((tip, idx) => ({
                                            coachingPoint: tip,
                                            status: (result.tip_scores?.[idx] >= 70 ? 'executing' : result.tip_scores?.[idx] >= 50 ? 'needs_work' : 'not_visible') as 'executing' | 'needs_work' | 'not_visible',
                                            coachObservation: result.tip_observations?.[idx] || 'Analyzed via deep system.',
                                            correction: result.tip_fixes?.[idx] || 'Continue practicing.',
                                            cue: result.tip_cues?.[idx] || 'Focus on form.'
                                          })),
                                          reinforcement: result.positives?.map((p: string) => ({ point: p, whyItMatters: 'Identified by deep analysis.' })) || [],
                                          nextSteps: {
                                            immediate: result.immediate_action || 'Review the analysis and focus on the priority area.',
                                            thisWeek: result.weekly_goal || 'Practice this drill 3-4 times.',
                                            progression: result.progression || 'Gradually increase difficulty as form improves.'
                                          }
                                        }
                                        
                                        setDrillMediaMap(prev => ({
                                          ...prev,
                                          [drillKey]: {
                                            ...prev[drillKey],
                                            hasCoachFeedback: true,
                                            coachFeedback: deepAnalysis,
                                            analysisType: 'deep'
                                          }
                                        }))
                                      } catch (error) {
                                        console.error('Deep analysis error:', error)
                                        setAnalysisError('Deep analysis failed. Make sure the hybrid system is running on localhost:5001.')
                                      } finally {
                                        setIsAnalyzing(false)
                                      }
                                    }}
                                    disabled={isAnalyzing || mediaState.type !== 'video'}
                                    className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                                      mediaState.type === 'video' 
                                        ? 'bg-[#2a2a2a] border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400' 
                                        : 'bg-[#2a2a2a] border border-[#3a3a3a] text-[#666] cursor-not-allowed'
                                    } disabled:opacity-50`}
                                  >
                                    {isAnalyzing ? (
                                      <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        DEEP ANALYZING...
                                      </>
                                    ) : (
                                      <>
                                        <Brain className="w-4 h-4" />
                                        DEEP ANALYSIS
                                        <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">HYBRID</span>
                                      </>
                                    )}
                                  </button>
                                  {mediaState.type !== 'video' && (
                                    <p className="text-[#666] text-[10px] text-center">Deep analysis requires video (not image)</p>
                                  )}
                                  
                                  <p className="text-[#666] text-[10px] text-center mt-1">
                                    <span className="text-[#FF6B35]">Coach Feedback</span> = Vision AI review • <span className="text-blue-400">Deep Analysis</span> = Full biomechanical breakdown
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="bg-[#1a1a1a] border-t border-[#3a3a3a] p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
          >
            CANCEL WORKOUT
          </button>
          
          {/* ALWAYS show Complete Workout button */}
          <button
            onClick={handleComplete}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:brightness-110 transition-all flex items-center gap-2"
          >
            <Trophy className="w-5 h-5" />
            COMPLETE WORKOUT
          </button>
          
          <button
            onClick={() => preferences.soundEnabled}
            className="p-3 rounded-xl bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
          >
            {preferences.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>
      
      {/* Drill Complete - Media Capture Popup */}
      {showDrillMediaCapture && currentDrillForMedia && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full border border-[#3a3a3a] max-h-[90vh] overflow-y-auto">
            {!isCapturingMedia && !capturedMediaBlob ? (
              // Initial state - choose media capture option
              <div className="text-center">
                <div className="w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <img 
                    src="/icons/coach-feedback.png" 
                    alt="Coach" 
                    className="w-20 h-20 object-contain"
                    style={{ filter: 'invert(1) brightness(2)' }}
                  />
                </div>
                <h3 className="text-xl font-bold text-[#FF6B35] mb-2">
                  {currentDrillForMedia.name} Complete!
                </h3>
                <p className="text-[#888] mb-6">
                  Want to get coach feedback on this drill? Record or upload a video/image.
                </p>
                
                {/* Media Capture Options */}
                <div className="space-y-3 mb-6">
                  {/* Record from Camera */}
                  <button
                    onClick={async () => {
                      setIsCapturingMedia(true)
                      setCapturedMediaType('video')
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ 
                          video: { facingMode: 'user' }, 
                          audio: false 
                        })
                        streamRef.current = stream
                        if (videoRef.current) {
                          videoRef.current.srcObject = stream
                          videoRef.current.play()
                        }
                      } catch (err) {
                        console.error('Camera access denied:', err)
                        setIsCapturingMedia(false)
                        setAnalysisError('Camera access denied. Please allow camera access.')
                      }
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                  >
                    <Camera className="w-6 h-6" />
                    RECORD FROM CAMERA
                  </button>
                  
                  {/* Upload Video/Image */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold flex items-center justify-center gap-3 hover:brightness-110 transition-all"
                  >
                    <Upload className="w-6 h-6" />
                    UPLOAD VIDEO OR IMAGE
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) {
                        const isVideo = file.type.startsWith('video/')
                        setCapturedMediaType(isVideo ? 'video' : 'image')
                        setCapturedMediaBlob(file)
                      }
                    }}
                  />
                  
                  {/* No Input - Skip */}
                  <button
                    onClick={() => {
                      // Save as no input and move to next
                      setDrillMediaMap(prev => ({
                        ...prev,
                        [currentDrillForMedia.id]: {
                          type: 'none' as const
                        }
                      }))
                      setShowDrillMediaCapture(false)
                      setCurrentDrillForMedia(null)
                      continueToNextExercise()
                    }}
                    className="w-full py-4 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] font-bold flex items-center justify-center gap-3 hover:bg-[#3a3a3a] hover:text-white transition-all"
                  >
                    <SkipForward className="w-6 h-6" />
                    NO INPUT - SKIP TO NEXT DRILL
                  </button>
                </div>
                
                {/* Next Drill Preview */}
                {workout.exercises[currentExerciseIndex + 1] && (
                  <div className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a]">
                    <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Up Next:</p>
                    <p className="text-[#FF6B35] font-bold">
                      {workout.exercises[currentExerciseIndex + 1].name}
                    </p>
                  </div>
                )}
              </div>
            ) : isCapturingMedia && capturedMediaType === 'video' && !capturedMediaBlob ? (
              // Recording state
              <div className="text-center">
                <h3 className="text-lg font-bold text-[#FF6B35] mb-4">Recording: {currentDrillForMedia.name}</h3>
                
                {/* Video Preview */}
                <div className="relative rounded-xl overflow-hidden mb-4 bg-black aspect-video">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  {isRecording && (
                    <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 px-3 py-1 rounded-full">
                      <div className="w-3 h-3 rounded-full bg-white animate-pulse" />
                      <span className="text-white text-sm font-bold">REC</span>
                    </div>
                  )}
                </div>
                
                {/* Recording Controls */}
                <div className="flex gap-3 justify-center">
                  {!isRecording ? (
                    <button
                      onClick={() => {
                        if (streamRef.current) {
                          const mediaRecorder = new MediaRecorder(streamRef.current)
                          mediaRecorderRef.current = mediaRecorder
                          const chunks: Blob[] = []
                          
                          mediaRecorder.ondataavailable = (e) => {
                            if (e.data.size > 0) chunks.push(e.data)
                          }
                          
                          mediaRecorder.onstop = () => {
                            const blob = new Blob(chunks, { type: 'video/webm' })
                            setCapturedMediaBlob(blob)
                            setIsRecording(false)
                            // Stop camera
                            streamRef.current?.getTracks().forEach(track => track.stop())
                          }
                          
                          mediaRecorder.start()
                          setIsRecording(true)
                        }
                      }}
                      className="px-8 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center gap-2 hover:bg-red-600"
                    >
                      <Circle className="w-5 h-5 fill-current" />
                      START RECORDING
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        mediaRecorderRef.current?.stop()
                      }}
                      className="px-8 py-3 rounded-xl bg-red-500 text-white font-bold flex items-center gap-2 hover:bg-red-600 animate-pulse"
                    >
                      <Square className="w-5 h-5 fill-current" />
                      STOP RECORDING
                    </button>
                  )}
                  
                  <button
                    onClick={() => {
                      streamRef.current?.getTracks().forEach(track => track.stop())
                      setIsCapturingMedia(false)
                      setCapturedMediaType(null)
                      setIsRecording(false)
                    }}
                    className="px-6 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : capturedMediaBlob ? (
              // Media captured - preview and confirm
              <div className="text-center">
                <h3 className="text-lg font-bold text-[#FF6B35] mb-4">
                  {capturedMediaType === 'video' ? 'Video' : 'Image'} Captured
                </h3>
                
                {/* Preview */}
                <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
                  {capturedMediaType === 'video' ? (
                    <video
                      src={URL.createObjectURL(capturedMediaBlob)}
                      controls
                      className="w-full max-h-[300px] object-contain"
                    />
                  ) : (
                    <img
                      src={URL.createObjectURL(capturedMediaBlob)}
                      alt="Captured"
                      className="w-full max-h-[300px] object-contain"
                    />
                  )}
                </div>
                
                {/* Actions - Three Options */}
                <div className="space-y-3">
                  {/* Option 1: GET COACH FEEDBACK (Vision AI) */}
                  <button
                    onClick={async () => {
                      // Save media and get coach feedback via Vision AI
                      setIsAnalyzing(true)
                      
                      const mediaUrl = URL.createObjectURL(capturedMediaBlob)
                      let coachFeedbackResult: CoachAnalysisResult | undefined
                      
                      try {
                        let frameBase64: string
                        
                        if (capturedMediaType === 'video') {
                          const video = document.createElement('video')
                          video.src = mediaUrl
                          await new Promise(resolve => { video.onloadeddata = resolve; video.load() })
                          video.currentTime = 0.5
                          await new Promise(resolve => setTimeout(resolve, 500))
                          
                          const canvas = document.createElement('canvas')
                          canvas.width = video.videoWidth
                          canvas.height = video.videoHeight
                          canvas.getContext('2d')?.drawImage(video, 0, 0)
                          // Add SHOTIQ watermark before export
                          addWatermarkToCanvas(canvas)
                          frameBase64 = canvas.toDataURL('image/jpeg', 0.8)
                        } else {
                          frameBase64 = await new Promise<string>((resolve) => {
                            const reader = new FileReader()
                            reader.onload = () => resolve(reader.result as string)
                            reader.readAsDataURL(capturedMediaBlob)
                          })
                        }
                        
                        const response = await fetch('/api/vision-analyze', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            image: frameBase64,
                            drillId: currentDrillForMedia.id,
                            drillName: currentDrillForMedia.name,
                            drillDescription: currentDrillForMedia.description,
                            coachingPoints: currentDrillForMedia.tips,
                            focusArea: currentDrillForMedia.focusArea
                          })
                        })
                        
                        if (response.ok) {
                          const result = await response.json()
                          coachFeedbackResult = result.analysis || result
                        }
                      } catch (err) {
                        console.error('Failed to get coach feedback:', err)
                      }
                      
                      setDrillMediaMap(prev => ({
                        ...prev,
                        [currentDrillForMedia.id]: {
                          type: capturedMediaType,
                          blob: capturedMediaBlob,
                          url: mediaUrl,
                          hasCoachFeedback: !!coachFeedbackResult,
                          coachFeedback: coachFeedbackResult,
                          analysisType: 'quick' as const
                        }
                      }))
                      
                      setIsAnalyzing(false)
                      setCapturedMediaBlob(null)
                      setCapturedMediaType(null)
                      setIsCapturingMedia(false)
                      setShowDrillMediaCapture(false)
                      setCurrentDrillForMedia(null)
                      continueToNextExercise()
                    }}
                    disabled={isAnalyzing}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                        COACH IS REVIEWING...
                      </>
                    ) : (
                      <>
                        <img 
                          src="/icons/coach-feedback.png" 
                          alt="Coach" 
                          className="w-6 h-6"
                          style={{ filter: 'invert(1) brightness(2)' }}
                        />
                        GET COACH FEEDBACK
                        <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded">VISION AI</span>
                      </>
                    )}
                  </button>
                  
                  {/* Option 2: DEEP ANALYSIS (Hybrid System) - Only for video */}
                  <button
                    onClick={async () => {
                      if (capturedMediaType !== 'video') {
                        setAnalysisError('Deep analysis requires a video file.')
                        return
                      }
                      
                      setIsAnalyzing(true)
                      
                      const mediaUrl = URL.createObjectURL(capturedMediaBlob)
                      let deepAnalysisResult: CoachAnalysisResult | undefined
                      
                      try {
                        const hybridApiUrl = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'
                        
                        const formData = new FormData()
                        formData.append('video', capturedMediaBlob, 'drill-video.webm')
                        formData.append('drill_id', currentDrillForMedia.id)
                        formData.append('drill_name', currentDrillForMedia.name)
                        formData.append('drill_context', currentDrillForMedia.description)
                        formData.append('drill_tips', JSON.stringify(currentDrillForMedia.tips))
                        formData.append('focus_area', currentDrillForMedia.focusArea)
                        
                        const response = await fetch(`${hybridApiUrl}/analyze-video`, {
                          method: 'POST',
                          body: formData,
                        })
                        
                        if (!response.ok) {
                          throw new Error('Hybrid system analysis failed')
                        }
                        
                        const result = await response.json()
                        
                        // Format deep analysis result
                        deepAnalysisResult = {
                          overallGrade: result.grade || (result.form_score >= 90 ? 'A' : result.form_score >= 80 ? 'B' : result.form_score >= 70 ? 'C' : result.form_score >= 60 ? 'D' : 'F'),
                          gradeDescription: result.summary || 'Deep biomechanical analysis complete.',
                          coachSays: result.coach_feedback || `Based on the deep analysis, your ${currentDrillForMedia.focusArea} mechanics show ${result.form_score >= 80 ? 'good' : 'room for improvement in'} form.`,
                          priorityFocus: {
                            issue: result.primary_issue || result.improvements?.[0] || 'Focus on consistency',
                            why: result.issue_explanation || 'This is the most impactful area for improvement.',
                            howToFix: result.fix_instruction || 'Practice with intention and focus on form.',
                            drillToHelp: result.recommended_drill || currentDrillForMedia.name,
                            cue: result.quick_cue || 'Stay focused on the fundamentals.'
                          },
                          coachingPointEvaluations: currentDrillForMedia.tips.map((tip: string, idx: number) => ({
                            coachingPoint: tip,
                            status: (result.tip_scores?.[idx] >= 70 ? 'executing' : result.tip_scores?.[idx] >= 50 ? 'needs_work' : 'not_visible') as 'executing' | 'needs_work' | 'not_visible',
                            coachObservation: result.tip_observations?.[idx] || 'Analyzed via deep system.',
                            correction: result.tip_fixes?.[idx] || 'Continue practicing.',
                            cue: result.tip_cues?.[idx] || 'Focus on form.'
                          })),
                          reinforcement: result.positives?.map((p: string) => ({ point: p, whyItMatters: 'Identified by deep analysis.' })) || [],
                          nextSteps: {
                            immediate: result.immediate_action || 'Review the analysis and focus on the priority area.',
                            thisWeek: result.weekly_goal || 'Practice this drill 3-4 times.',
                            progression: result.progression || 'Gradually increase difficulty as form improves.'
                          }
                        }
                      } catch (err) {
                        console.error('Deep analysis failed:', err)
                        setAnalysisError('Deep analysis failed. Make sure the hybrid system is running on localhost:5001.')
                      }
                      
                      setDrillMediaMap(prev => ({
                        ...prev,
                        [currentDrillForMedia.id]: {
                          type: capturedMediaType,
                          blob: capturedMediaBlob,
                          url: mediaUrl,
                          hasCoachFeedback: !!deepAnalysisResult,
                          coachFeedback: deepAnalysisResult,
                          analysisType: 'deep' as const
                        }
                      }))
                      
                      setIsAnalyzing(false)
                      setCapturedMediaBlob(null)
                      setCapturedMediaType(null)
                      setIsCapturingMedia(false)
                      setShowDrillMediaCapture(false)
                      setCurrentDrillForMedia(null)
                      continueToNextExercise()
                    }}
                    disabled={isAnalyzing || capturedMediaType !== 'video'}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                      capturedMediaType === 'video'
                        ? 'bg-[#2a2a2a] border border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400'
                        : 'bg-[#2a2a2a] border border-[#3a3a3a] text-[#666] cursor-not-allowed'
                    } disabled:opacity-50`}
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                        DEEP ANALYZING...
                      </>
                    ) : (
                      <>
                        <Brain className="w-5 h-5" />
                        DEEP ANALYSIS
                        <span className="text-[10px] bg-blue-500/20 px-1.5 py-0.5 rounded">HYBRID</span>
                      </>
                    )}
                  </button>
                  {capturedMediaType !== 'video' && (
                    <p className="text-[#666] text-[10px] text-center -mt-1">Deep analysis requires video (not image)</p>
                  )}
                  
                  {/* Option 3: SKIP - No Analysis, Just Save Media */}
                  <button
                    onClick={() => {
                      const mediaUrl = URL.createObjectURL(capturedMediaBlob)
                      setDrillMediaMap(prev => ({
                        ...prev,
                        [currentDrillForMedia.id]: {
                          type: capturedMediaType,
                          blob: capturedMediaBlob,
                          url: mediaUrl,
                          hasCoachFeedback: false
                        }
                      }))
                      setCapturedMediaBlob(null)
                      setCapturedMediaType(null)
                      setIsCapturingMedia(false)
                      setShowDrillMediaCapture(false)
                      setCurrentDrillForMedia(null)
                      continueToNextExercise()
                    }}
                    className="w-full py-2.5 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] font-bold flex items-center justify-center gap-2 hover:bg-[#3a3a3a] hover:text-white transition-all"
                  >
                    <SkipForward className="w-4 h-4" />
                    SKIP ANALYSIS - CONTINUE
                  </button>
                  
                  {/* Retake Option */}
                  <button
                    onClick={() => {
                      setCapturedMediaBlob(null)
                      setCapturedMediaType(null)
                      setIsCapturingMedia(false)
                    }}
                    className="w-full py-2 rounded-xl text-[#666] font-bold hover:text-[#888] transition-all text-sm"
                  >
                    ← Retake
                  </button>
                  
                  <p className="text-[#666] text-[10px] text-center pt-2 border-t border-[#3a3a3a]">
                    <span className="text-[#FF6B35]">Coach Feedback</span> = Vision AI review • <span className="text-blue-400">Deep Analysis</span> = Full biomechanical breakdown
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Drill Feedback Popup */}
      {showDrillFeedback && drillMediaMap[showDrillFeedback]?.coachFeedback && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl p-6 max-w-lg w-full border border-[#3a3a3a] max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img 
                    src="/icons/coach-feedback.png" 
                    alt="Coach" 
                    className="w-16 h-16 object-contain"
                    style={{ filter: 'invert(1) brightness(2)' }}
                  />
                </div>
                <div>
                  <h3 className="text-[#FF6B35] font-bold text-lg">COACH FEEDBACK</h3>
                  <p className="text-[#888] text-sm">Your form analysis</p>
                </div>
              </div>
              <button
                onClick={() => setShowDrillFeedback(null)}
                className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Grade */}
            {drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade && (
              <div className={`text-center py-4 rounded-xl mb-4 ${
                drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'A' ? 'bg-green-500/20' :
                drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'B' ? 'bg-blue-500/20' :
                drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'C' ? 'bg-orange-500/20' :
                drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'D' ? 'bg-orange-500/20' :
                'bg-red-500/20'
              }`}>
                <div className={`text-5xl font-black ${
                  drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'A' ? 'text-green-400' :
                  drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'B' ? 'text-blue-400' :
                  drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'C' ? 'text-orange-400' :
                  drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade === 'D' ? 'text-orange-400' :
                  'text-red-400'
                }`}>
                  {drillMediaMap[showDrillFeedback].coachFeedback?.overallGrade}
                </div>
                <p className="text-[#888] text-sm mt-1">
                  {drillMediaMap[showDrillFeedback].coachFeedback?.gradeDescription}
                </p>
              </div>
            )}
            
            {/* Coach Says */}
            {drillMediaMap[showDrillFeedback].coachFeedback?.coachSays && (
              <div className="bg-[#2a2a2a] rounded-xl p-4 border-l-4 border-[#FF6B35] mb-4">
                <p className="text-[#E5E5E5] text-sm italic">
                  &quot;{drillMediaMap[showDrillFeedback].coachFeedback?.coachSays}&quot;
                </p>
              </div>
            )}
            
            {/* Priority Focus */}
            {drillMediaMap[showDrillFeedback].coachFeedback?.priorityFocus && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
                <h4 className="text-red-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  FIX THIS FIRST
                </h4>
                <p className="text-white font-bold text-sm mb-2">
                  {drillMediaMap[showDrillFeedback].coachFeedback?.priorityFocus.issue}
                </p>
                <p className="text-[#888] text-xs mb-2">
                  <span className="text-red-400">Why:</span> {drillMediaMap[showDrillFeedback].coachFeedback?.priorityFocus.why}
                </p>
                <p className="text-[#E5E5E5] text-xs">
                  <span className="text-[#FF6B35]">How to fix:</span> {drillMediaMap[showDrillFeedback].coachFeedback?.priorityFocus.howToFix}
                </p>
              </div>
            )}
            
            {/* Reinforcement */}
            {drillMediaMap[showDrillFeedback].coachFeedback?.reinforcement && drillMediaMap[showDrillFeedback].coachFeedback.reinforcement.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                <h4 className="text-green-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  KEEP DOING THIS
                </h4>
                <ul className="space-y-2">
                  {drillMediaMap[showDrillFeedback].coachFeedback?.reinforcement.map((item, i) => (
                    <li key={i} className="text-[#E5E5E5] text-sm">
                      <span className="text-green-400">✓</span> {item.point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Exercise Detail Popup - Shows drill info, description, and tips */}
      {showExerciseDetail && (() => {
        const exercise = workout.exercises.find(e => e.id === showExerciseDetail)
        if (!exercise) return null
        
        const focusAreaColors: Record<string, { bg: string, text: string, border: string }> = {
          'elbow': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
          'knee': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
          'balance': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
          'release': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
          'follow-through': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
          'power': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
          'general': { bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' }
        }
        const colors = focusAreaColors[exercise.focusArea] || focusAreaColors['general']
        const hasFeedback = drillMediaMap[exercise.id]?.coachFeedback
        
        return (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
            <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full border border-[#3a3a3a] max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-[#1a1a1a] p-6 pb-4 border-b border-[#3a3a3a]">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                        {exercise.focusArea.replace('-', ' ')}
                      </span>
                      <span className="text-[#888] text-xs">
                        {formatTime(exercise.duration)}
                      </span>
                    </div>
                    <h3 className="text-[#FF6B35] font-bold text-xl uppercase">
                      {exercise.name}
                    </h3>
                    {exercise.reps && (
                      <p className="text-[#888] text-sm mt-1">{exercise.reps}</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowExerciseDetail(null)}
                    className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Description */}
                <div>
                  <h4 className="text-[#E5E5E5] font-bold text-sm uppercase mb-2 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                    What is this drill?
                  </h4>
                  <p className="text-[#888] text-sm leading-relaxed">
                    {exercise.description}
                  </p>
                </div>
                
                {/* Coaching Tips */}
                <div>
                  <h4 className="text-[#E5E5E5] font-bold text-sm uppercase mb-3 flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#FF6B35]" />
                    Coaching Tips
                  </h4>
                  <div className="space-y-2">
                    {exercise.tips.map((tip, i) => (
                      <div 
                        key={i} 
                        className="flex items-start gap-3 p-3 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]"
                      >
                        <div className="w-6 h-6 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-[#FF6B35] text-xs font-bold">{i + 1}</span>
                        </div>
                        <p className="text-[#E5E5E5] text-sm">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Focus Area Explanation */}
                <div className={`p-4 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <h4 className={`font-bold text-sm uppercase mb-2 ${colors.text}`}>
                    Focus: {exercise.focusArea.replace('-', ' ')}
                  </h4>
                  <p className="text-[#888] text-xs">
                    {exercise.focusArea === 'elbow' && 'This drill focuses on proper elbow alignment and positioning for a consistent, accurate shot.'}
                    {exercise.focusArea === 'knee' && 'This drill emphasizes proper knee bend and leg power generation for your shot.'}
                    {exercise.focusArea === 'balance' && 'This drill helps you maintain stability and body control throughout your shooting motion.'}
                    {exercise.focusArea === 'release' && 'This drill works on your release point, timing, and ball rotation for optimal arc.'}
                    {exercise.focusArea === 'follow-through' && 'This drill perfects your follow-through mechanics for better accuracy and consistency.'}
                    {exercise.focusArea === 'power' && 'This drill builds explosive power from your legs to generate effortless range.'}
                    {exercise.focusArea === 'general' && 'This is a general shooting drill that works on multiple aspects of your form.'}
                  </p>
                </div>
                
                {/* Coach Feedback Button (if available) */}
                {hasFeedback && (
                  <button
                    onClick={() => {
                      setShowExerciseDetail(null)
                      setShowDrillFeedback(exercise.id)
                    }}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-[#1a1a1a] font-bold flex items-center justify-center gap-2 hover:brightness-110 transition-all"
                  >
                    <img 
                      src="/icons/coach-feedback.png" 
                      alt="Coach" 
                      className="w-5 h-5 object-contain"
                    />
                    VIEW COACH FEEDBACK
                    <span className={`ml-1 text-sm font-black ${
                      drillMediaMap[exercise.id]?.coachFeedback?.overallGrade === 'A' ? 'text-green-600' :
                      drillMediaMap[exercise.id]?.coachFeedback?.overallGrade === 'B' ? 'text-blue-600' :
                      drillMediaMap[exercise.id]?.coachFeedback?.overallGrade === 'C' ? 'text-orange-600' :
                      drillMediaMap[exercise.id]?.coachFeedback?.overallGrade === 'D' ? 'text-orange-600' :
                      'text-red-600'
                    }`}>
                      ({drillMediaMap[exercise.id]?.coachFeedback?.overallGrade})
                    </span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })()}
      
      {/* Drill Explanation Popup - Uniform across all views */}
      {selectedDrillForExplanation && (
        <DrillExplanationPopup 
          drill={selectedDrillForExplanation} 
          onClose={() => setSelectedDrillForExplanation(null)} 
        />
      )}
      
      {/* =============================================
          WORKOUT SUMMARY POPUP - Shows after completing workout
          All drills auto-analyzed with Vision AI
          Feedback shown INLINE in dropdown format
          ============================================= */}
      {showWorkoutSummary && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm">
          <div className="bg-[#1a1a1a] rounded-2xl max-w-2xl w-full border border-[#3a3a3a] max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-[#3a3a3a] bg-gradient-to-r from-[#FF6B35]/10 to-transparent">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isAnalyzing ? 'bg-blue-500/20' : 'bg-green-500/20'}`}>
                  {isAnalyzing ? (
                    <RefreshCw className="w-8 h-8 text-blue-400 animate-spin" />
                  ) : (
                    <Trophy className="w-8 h-8 text-green-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-black text-[#FF6B35] uppercase">
                    {isAnalyzing ? 'ANALYZING YOUR WORKOUT...' : 'WORKOUT COMPLETE!'}
                  </h2>
                  <p className="text-[#888]">{workout.name} • {workout.exercises.length} drills</p>
                  
                  {/* Progress indicator */}
                  {analysisProgress && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          analysisProgress.status === 'extracting' ? 'bg-orange-400 animate-pulse' :
                          analysisProgress.status === 'analyzing' ? 'bg-blue-400 animate-pulse' :
                          analysisProgress.status === 'complete' ? 'bg-green-400' :
                          'bg-red-400'
                        }`} />
                        <span className="text-white text-sm font-bold">
                          Drill {analysisProgress.current} of {analysisProgress.total}:
                        </span>
                        <span className="text-[#FF6B35] text-sm uppercase">{analysisProgress.drillName}</span>
                      </div>
                      <p className="text-xs text-[#888]">
                        {analysisProgress.status === 'extracting' && '📹 Extracting video frame...'}
                        {analysisProgress.status === 'analyzing' && '🧠 Vision AI analyzing your form...'}
                        {analysisProgress.status === 'complete' && '✅ Analysis complete!'}
                        {analysisProgress.status === 'error' && '⚠️ Analysis failed, moving to next...'}
                      </p>
                      {/* Progress bar */}
                      <div className="w-full h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] transition-all duration-500"
                          style={{ width: `${(analysisProgress.current / analysisProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Drill Summary List with INLINE Feedback */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {workout.exercises.map((exercise, index) => {
                const drillKey = `workout-${exercise.id}-${index}`
                const mediaState = drillMediaMap[drillKey]
                const hasMedia = mediaState && mediaState.type && mediaState.type !== 'none'
                const hasFeedback = mediaState?.hasCoachFeedback && mediaState?.coachFeedback
                const feedback = mediaState?.coachFeedback
                const isExpanded = expandedSummaryDrill === drillKey
                
                return (
                  <div key={drillKey} className="bg-[#2a2a2a] rounded-xl border border-[#3a3a3a] overflow-hidden">
                    {/* Drill Header - Click to expand */}
                    <button
                      onClick={() => setExpandedSummaryDrill(isExpanded ? null : drillKey)}
                      className="w-full p-4 flex items-center justify-between hover:bg-[#3a3a3a]/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Number Badge */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${
                          hasFeedback 
                            ? feedback?.overallGrade === 'A' ? 'bg-green-500/20 text-green-400' :
                              feedback?.overallGrade === 'B' ? 'bg-blue-500/20 text-blue-400' :
                              feedback?.overallGrade === 'C' ? 'bg-orange-500/20 text-orange-400' :
                              feedback?.overallGrade === 'D' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-red-500/20 text-red-400'
                            : hasMedia ? 'bg-[#FF6B35]/20 text-[#FF6B35]' : 'bg-[#3a3a3a] text-[#666]'
                        }`}>
                          {hasFeedback ? feedback?.overallGrade : index + 1}
                        </div>
                        
                        {/* Drill Name */}
                        <div className="text-left">
                          <h4 className="text-white font-bold uppercase">{exercise.name}</h4>
                          <p className="text-[#888] text-xs">
                            {hasMedia ? (
                              <span className="text-green-400">
                                {mediaState.type === 'video' ? '📹 Video' : '📷 Image'} • {hasFeedback ? 'Feedback Ready' : 'Analyzing...'}
                              </span>
                            ) : (
                              <span className="text-[#666]">No media</span>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      {/* Expand Arrow */}
                      {hasFeedback && (
                        <ChevronDown className={`w-5 h-5 text-[#888] transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      )}
                    </button>
                    
                    {/* Expanded Feedback - THE FORMAT YOU HAD */}
                    {isExpanded && hasFeedback && feedback && (
                      <div className="p-4 pt-0 border-t border-[#3a3a3a] space-y-4">
                        {/* WRONG DRILL ALERT */}
                        {feedback.isCorrectDrill === false && (
                          <div className="bg-red-600/20 border-2 border-red-500 rounded-xl p-4 animate-pulse">
                            <div className="flex items-center gap-3 mb-2">
                              <AlertTriangle className="w-8 h-8 text-red-500" />
                              <span className="text-red-500 font-black text-lg uppercase">WRONG DRILL!</span>
                            </div>
                            <p className="text-white font-bold mb-2">
                              {feedback.wrongDrillMessage || `This is not the ${exercise.name} drill.`}
                            </p>
                            {feedback.whatISee && (
                              <p className="text-[#888] text-sm mb-2">
                                <span className="text-red-400">What I see:</span> {feedback.whatISee}
                              </p>
                            )}
                            <p className="text-orange-400 text-sm font-bold">
                              Please record yourself doing the correct drill: {exercise.name}
                            </p>
                          </div>
                        )}
                        
                        {/* Coach Says */}
                        <div className="bg-[#1a1a1a] rounded-xl p-4 border-l-4 border-[#FF6B35]">
                          <div className="flex items-center gap-3 mb-3">
                            <img 
                              src="/icons/coach-feedback.png" 
                              alt="Coach" 
                              className="w-12 h-12 object-contain"
                              style={{ filter: 'invert(1) brightness(2)' }}
                            />
                            <span className="text-[#FF6B35] font-bold text-lg uppercase">Coach Says</span>
                          </div>
                          <p className="text-[#E5E5E5] text-sm italic">&quot;{feedback.coachSays}&quot;</p>
                        </div>
                        
                        {/* Priority Focus - FIX THIS FIRST */}
                        {feedback.priorityFocus && (
                          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                            <h4 className="text-red-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" />
                              FIX THIS FIRST
                            </h4>
                            <p className="text-white font-bold text-sm mb-1">{feedback.priorityFocus.issue}</p>
                            <p className="text-[#888] text-xs mb-2">
                              <span className="text-red-400">Why:</span> {feedback.priorityFocus.why}
                            </p>
                            <p className="text-green-400 text-xs">
                              <span className="text-white">Fix:</span> {feedback.priorityFocus.howToFix}
                            </p>
                            {feedback.priorityFocus.cue && (
                              <div className="mt-2 bg-[#FF6B35]/10 rounded-lg px-3 py-2">
                                <span className="text-[#FF6B35] text-xs font-bold">💡 Quick Cue: </span>
                                <span className="text-white text-xs">{feedback.priorityFocus.cue}</span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Coaching Points Breakdown */}
                        {feedback.coachingPointEvaluations && feedback.coachingPointEvaluations.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="text-[#888] font-bold text-xs uppercase">Coaching Points</h4>
                            {feedback.coachingPointEvaluations.map((point: CoachingPointEvaluation, i: number) => (
                              <div key={i} className={`p-3 rounded-lg border ${
                                point.status === 'executing' ? 'bg-green-500/10 border-green-500/30' :
                                point.status === 'needs_work' ? 'bg-orange-500/10 border-orange-500/30' :
                                'bg-red-500/10 border-red-500/30'
                              }`}>
                                <div className="flex items-center gap-2 mb-1">
                                  {point.status === 'executing' ? <Check className="w-4 h-4 text-green-400" /> :
                                   point.status === 'needs_work' ? <AlertTriangle className="w-4 h-4 text-orange-400" /> :
                                   <X className="w-4 h-4 text-red-400" />}
                                  <span className="text-white text-sm font-bold">{point.coachingPoint}</span>
                                </div>
                                <p className="text-[#888] text-xs ml-6">{point.coachObservation}</p>
                                {point.correction && point.status !== 'executing' && (
                                  <p className="text-green-400 text-xs ml-6 mt-1">→ {point.correction}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Keep Doing This */}
                        {feedback.reinforcement && feedback.reinforcement.length > 0 && (
                          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                            <h4 className="text-green-400 font-bold text-sm uppercase mb-2 flex items-center gap-2">
                              <Check className="w-4 h-4" />
                              KEEP DOING THIS
                            </h4>
                            {feedback.reinforcement.map((r: any, i: number) => (
                              <p key={i} className="text-white text-sm">✓ {r.point}</p>
                            ))}
                          </div>
                        )}
                        
                        {/* Deep Analysis Button */}
                        {mediaState.type === 'video' && mediaState.analysisType !== 'deep' && (
                          <button
                            onClick={async () => {
                              if (!mediaState.blob) return
                              setIsAnalyzing(true)
                              
                              try {
                                const hybridApiUrl = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'
                                
                                const formData = new FormData()
                                formData.append('video', mediaState.blob, 'drill-video.webm')
                                formData.append('drill_id', exercise.id)
                                formData.append('drill_name', exercise.name)
                                formData.append('drill_context', exercise.description)
                                formData.append('drill_tips', JSON.stringify(exercise.tips))
                                formData.append('focus_area', exercise.focusArea)
                                
                                const response = await fetch(`${hybridApiUrl}/analyze-video`, {
                                  method: 'POST',
                                  body: formData,
                                })
                                
                                if (response.ok) {
                                  const result = await response.json()
                                  
                                  const deepAnalysis: CoachAnalysisResult = {
                                    overallGrade: result.grade || (result.form_score >= 90 ? 'A' : result.form_score >= 80 ? 'B' : result.form_score >= 70 ? 'C' : result.form_score >= 60 ? 'D' : 'F'),
                                    gradeDescription: result.summary || 'Deep biomechanical analysis complete.',
                                    coachSays: result.coach_feedback || `Deep analysis: Your ${exercise.focusArea} mechanics ${result.form_score >= 80 ? 'look solid' : 'need work'}.`,
                                    priorityFocus: {
                                      issue: result.primary_issue || 'Focus on consistency',
                                      why: result.issue_explanation || 'Most impactful area.',
                                      howToFix: result.fix_instruction || 'Practice with intention.',
                                      drillToHelp: result.recommended_drill || exercise.name,
                                      cue: result.quick_cue || 'Stay focused.'
                                    },
                                    coachingPointEvaluations: exercise.tips.map((tip, idx) => ({
                                      coachingPoint: tip,
                                      status: (result.tip_scores?.[idx] >= 70 ? 'executing' : result.tip_scores?.[idx] >= 50 ? 'needs_work' : 'not_visible') as 'executing' | 'needs_work' | 'not_visible',
                                      coachObservation: result.tip_observations?.[idx] || 'Analyzed via deep system.',
                                      correction: result.tip_fixes?.[idx] || 'Continue practicing.',
                                      cue: result.tip_cues?.[idx] || 'Focus on form.'
                                    })),
                                    reinforcement: result.positives?.map((p: string) => ({ point: p, whyItMatters: 'Deep analysis.' })) || [],
                                    nextSteps: {
                                      immediate: result.immediate_action || 'Review and focus.',
                                      thisWeek: result.weekly_goal || 'Practice 3-4 times.',
                                      progression: result.progression || 'Increase difficulty.'
                                    }
                                  }
                                  
                                  setDrillMediaMap(prev => ({
                                    ...prev,
                                    [drillKey]: {
                                      ...prev[drillKey],
                                      hasCoachFeedback: true,
                                      coachFeedback: deepAnalysis,
                                      analysisType: 'deep'
                                    }
                                  }))
                                }
                              } catch (err) {
                                console.error('Deep analysis failed:', err)
                                setAnalysisError('Deep analysis failed. Make sure hybrid system is running.')
                              } finally {
                                setIsAnalyzing(false)
                              }
                            }}
                            disabled={isAnalyzing}
                            className="w-full py-3 rounded-xl bg-[#2a2a2a] border border-blue-500/50 text-blue-400 font-bold flex items-center justify-center gap-2 hover:bg-blue-500/10 disabled:opacity-50"
                          >
                            <Brain className="w-5 h-5" />
                            UPGRADE TO DEEP ANALYSIS
                            <span className="text-[10px] bg-blue-500/20 px-2 py-0.5 rounded">HYBRID</span>
                          </button>
                        )}
                        
                        {mediaState.analysisType === 'deep' && (
                          <div className="text-center text-blue-400 text-xs flex items-center justify-center gap-2">
                            <Brain className="w-4 h-4" />
                            Deep Analysis Complete
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Footer */}
            <div className="p-6 border-t border-[#3a3a3a] bg-[#1a1a1a]">
              <div className="flex gap-3">
                <button
                  onClick={() => setShowWorkoutSummary(false)}
                  className="flex-1 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:text-white transition-colors"
                >
                  BACK TO WORKOUT
                </button>
                <button
                  onClick={finishWorkout}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  FINISH & SAVE
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// FLAW TO FOCUS AREA MAPPING
// =============================================

// Maps flaw IDs from the identified flaws to our drill focus areas
const FLAW_TO_FOCUS_AREA: Record<string, string[]> = {
  // Elbow-related flaws
  'ELBOW_FLARE': ['elbow'],
  'ELBOW_TUCK': ['elbow'],
  'ELBOW_ALIGNMENT': ['elbow'],
  'ELBOW_ANGLE': ['elbow'],
  
  // Knee/Power-related flaws
  'KNEE_BEND': ['balance', 'power'],
  'KNEE_ANGLE': ['balance', 'power'],
  'INSUFFICIENT_KNEE': ['balance', 'power'],
  
  // Balance-related flaws
  'SHOULDER_TILT': ['balance'],
  'SHOULDER_POSITION': ['balance'],
  'HIP_ALIGNMENT': ['balance'],
  'HIP_ANGLE': ['balance'],
  'BALANCE': ['balance'],
  'LEAN': ['balance'],
  
  // Release-related flaws
  'RELEASE_POINT': ['release', 'follow-through'],
  'RELEASE_ANGLE': ['release', 'follow-through'],
  'RELEASE_HEIGHT': ['release'],
  'EARLY_RELEASE': ['release'],
  'LATE_RELEASE': ['release'],
  
  // Follow-through flaws
  'FOLLOW_THROUGH': ['follow-through'],
  'WRIST_SNAP': ['follow-through', 'release'],
  
  // Guide hand flaws
  'GUIDE_HAND': ['release'],
  'THUMB_FLICK': ['release'],
  
  // General form flaws
  'SET_POINT': ['elbow', 'release'],
  'FOOTWORK': ['balance'],
  'TIMING': ['general'],
}

// =============================================
// MAIN TRAINING PLAN CALENDAR COMPONENT
// =============================================

interface DetectedFlaw {
  id: string
  name: string
  description: string
  priority: number
  fixes: string[]
  drills: string[]
  causeChain?: Array<{ effect: string; severity: string; explanation: string }> | string[]
}

interface TrainingPlanCalendarProps {
  focusAreas?: string[]
  detectedFlaws?: DetectedFlaw[] // Pass detected flaws from the Identified Flaws tab
}

export default function TrainingPlanCalendar({ focusAreas = [], detectedFlaws = [] }: TrainingPlanCalendarProps) {
  // Get user profile for age level
  const profileStore = useProfileStore()
  
  // Determine initial age level from profile
  const getInitialAgeLevel = (): AgeLevel => {
    if (profileStore.coachingTier) {
      return profileStore.coachingTier as AgeLevel
    }
    // Fallback based on age if coachingTier not set
    if (profileStore.age) {
      if (profileStore.age <= 11) return 'elementary'
      if (profileStore.age <= 14) return 'middle_school'
      if (profileStore.age <= 18) return 'high_school'
      if (profileStore.age <= 22) return 'college'
      return 'professional'
    }
    return 'high_school' // Default
  }
  
  // Calendar state
  const [currentDate, setCurrentDate] = useState(new Date())
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week')
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  
  // Initialize preferences with profile-based age level
  const initialAgeLevel = getInitialAgeLevel()
  const ageLevelConfig = AGE_LEVEL_CONFIG[initialAgeLevel]
  
  // Preferences state - initialized from profile
  const [preferences, setPreferences] = useState<TrainingPreferences>({
    frequency: ageLevelConfig.recommendedFrequency,
    preferredDuration: ageLevelConfig.recommendedDuration,
    drillCount: 3, // Default to sweet spot of 3 drills
    workoutMode: 'continuous',
    soundEnabled: true,
    ageLevel: initialAgeLevel,
    autoPopulateFromFlaws: false // Default off - user can enable in settings
  })
  
  // UI state
  const [showFrequencyPopup, setShowFrequencyPopup] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null)
  const [showDrillCountPopup, setShowDrillCountPopup] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null)
  const [showDurationPopup, setShowDurationPopup] = useState<5 | 10 | 15 | 20 | 30 | 45 | null>(null)
  const [showAgeLevelPopup, setShowAgeLevelPopup] = useState<AgeLevel | null>(null)
  const [drillCategoryFilter, setDrillCategoryFilter] = useState<string>('all')
  const [showDurationSelector, setShowDurationSelector] = useState(false)
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null)
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [showSettings, setShowSettings] = useState(false)
  const [showAgeLevelInfo, setShowAgeLevelInfo] = useState(false)
  
  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [currentNotification, setCurrentNotification] = useState<string | null>(null)
  const [showNotificationBanner, setShowNotificationBanner] = useState(false)
  
  // Custom workout builder state (drag and drop)
  const [showWorkoutBuilder, setShowWorkoutBuilder] = useState(false)
  const [customWorkoutDrills, setCustomWorkoutDrills] = useState<CustomWorkoutDrill[]>([])
  const [draggedDrill, setDraggedDrill] = useState<Exercise | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [customWorkoutName, setCustomWorkoutName] = useState('')
  
  // Date detail modal state
  const [showDateDetailModal, setShowDateDetailModal] = useState(false)
  const [selectedDateForDetail, setSelectedDateForDetail] = useState<Date | null>(null)
  
  // Drill explanation popup state
  const [selectedDrillForExplanation, setSelectedDrillForExplanation] = useState<Exercise | null>(null)
  
  // Per-drill media state - key is "workoutId-drillIndex"
  const [drillMediaExpanded, setDrillMediaExpanded] = useState<string | null>(null) // Which drill's dropdown is open
  const [drillMediaMap, setDrillMediaMap] = useState<Record<string, {
    type: 'video' | 'image' | 'none' | null
    blob?: Blob
    url?: string
    hasCoachFeedback?: boolean
  }>>({})
  
  // File input refs for per-drill uploads
  const drillFileInputRef = useRef<HTMLInputElement>(null)
  const [currentDrillForUpload, setCurrentDrillForUpload] = useState<string | null>(null)
  
  // Add workout picker modal state
  const [showAddWorkoutPicker, setShowAddWorkoutPicker] = useState(false)
  const [addWorkoutTargetDate, setAddWorkoutTargetDate] = useState<Date | null>(null)
  
  // Saved/Draft workouts (user-created workout templates)
  const [savedWorkouts, setSavedWorkouts] = useState<Workout[]>([])
  
  // Auto-populate tracking
  const [hasAutoPopulated, setHasAutoPopulated] = useState(false)
  
  // Duration options
  const durationOptions: (5 | 10 | 15 | 20 | 30 | 45)[] = [5, 10, 15, 20, 30, 45]
  const ageLevels: AgeLevel[] = ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  
  // Load saved workouts from localStorage on mount
  useEffect(() => {
    try {
      const storedWorkouts = localStorage.getItem('basketball-saved-workouts')
      if (storedWorkouts) {
        const parsed = JSON.parse(storedWorkouts)
        if (Array.isArray(parsed)) {
          setSavedWorkouts(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading saved workouts from localStorage:', error)
    }
  }, [])
  
  // Save workouts to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('basketball-saved-workouts', JSON.stringify(savedWorkouts))
    } catch (error) {
      console.error('Error saving workouts to localStorage:', error)
    }
  }, [savedWorkouts])
  
  // Load scheduled workouts from localStorage on mount
  useEffect(() => {
    try {
      const storedScheduled = localStorage.getItem('basketball-scheduled-workouts')
      if (storedScheduled) {
        const parsed = JSON.parse(storedScheduled)
        if (Array.isArray(parsed)) {
          setScheduledWorkouts(parsed)
        }
      }
    } catch (error) {
      console.error('Error loading scheduled workouts from localStorage:', error)
    }
  }, [])
  
  // Save scheduled workouts to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('basketball-scheduled-workouts', JSON.stringify(scheduledWorkouts))
    } catch (error) {
      console.error('Error saving scheduled workouts to localStorage:', error)
    }
  }, [scheduledWorkouts])
  
  // Show notification when there's a workout scheduled for today
  useEffect(() => {
    // Check if there's an actual workout scheduled for today
    const todayStr = new Date().toISOString().split('T')[0]
    const todayWorkout = scheduledWorkouts.find(w => w.date === todayStr && !w.completed)
    
    if (notificationsEnabled && todayWorkout) {
      const message = Math.random() > 0.5 ? getInspirationalMessage() : getTimeBasedMessage()
      setCurrentNotification(message)
      setShowNotificationBanner(true)
      
      // Auto-hide after 10 seconds
      const timer = setTimeout(() => {
        setShowNotificationBanner(false)
      }, 10000)
      
      return () => clearTimeout(timer)
    } else {
      setShowNotificationBanner(false)
    }
  }, [notificationsEnabled, scheduledWorkouts])
  
  // Auto-populate calendar from detected flaws
  useEffect(() => {
    // Only run if:
    // 1. Auto-populate is enabled
    // 2. We have detected flaws
    // 3. We haven't already auto-populated
    // 4. There are no existing scheduled workouts (to avoid overwriting)
    if (
      preferences.autoPopulateFromFlaws && 
      detectedFlaws.length > 0 && 
      !hasAutoPopulated &&
      scheduledWorkouts.length === 0
    ) {
      // Generate a weekly plan based on the flaws
      const weeklyPlan = generateFlawBasedWeeklyPlan(
        detectedFlaws,
        preferences.frequency,
        preferences.preferredDuration,
        preferences.ageLevel,
        preferences.drillCount
      )
      
      // Convert the plan to scheduled workouts
      const newScheduledWorkouts: ScheduledWorkout[] = weeklyPlan.map((item, index) => ({
        id: `auto-${item.date.toISOString()}-${index}`,
        date: item.date.toISOString().split('T')[0],
        workoutId: item.workout.id,
        workout: item.workout,
        completed: false
      }))
      
      setScheduledWorkouts(newScheduledWorkouts)
      setHasAutoPopulated(true)
    }
  }, [preferences.autoPopulateFromFlaws, detectedFlaws, hasAutoPopulated, scheduledWorkouts.length, preferences.frequency, preferences.preferredDuration, preferences.ageLevel, preferences.drillCount])
  
  // Re-generate workouts when auto-populate is toggled ON (and we have flaws)
  const handleAutoPopulateToggle = (enabled: boolean) => {
    setPreferences(prev => ({ ...prev, autoPopulateFromFlaws: enabled }))
    
    if (enabled && detectedFlaws.length > 0) {
      // Clear existing workouts and regenerate
      const weeklyPlan = generateFlawBasedWeeklyPlan(
        detectedFlaws,
        preferences.frequency,
        preferences.preferredDuration,
        preferences.ageLevel,
        preferences.drillCount
      )
      
      const newScheduledWorkouts: ScheduledWorkout[] = weeklyPlan.map((item, index) => ({
        id: `auto-${item.date.toISOString()}-${index}`,
        date: item.date.toISOString().split('T')[0],
        workoutId: item.workout.id,
        workout: item.workout,
        completed: false
      }))
      
      setScheduledWorkouts(newScheduledWorkouts)
      setHasAutoPopulated(true)
    } else if (!enabled) {
      // When disabled, clear auto-generated workouts
      // Keep only manually added workouts (those without 'auto-' prefix)
      setScheduledWorkouts(prev => prev.filter(w => !w.id.startsWith('auto-')))
      setHasAutoPopulated(false)
    }
  }
  
  // Update preferences when age level changes
  const handleAgeLevelChange = (newLevel: AgeLevel) => {
    const config = AGE_LEVEL_CONFIG[newLevel]
    setPreferences(prev => ({
      ...prev,
      ageLevel: newLevel,
      // Optionally update recommended values
      frequency: config.recommendedFrequency,
      preferredDuration: config.recommendedDuration
    }))
  }
  
  // Get days in current view
  const getDaysInView = useMemo(() => {
    const days: Date[] = []
    
    if (viewMode === 'day') {
      // Day view - just show the current day
      days.push(new Date(currentDate))
    } else if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate)
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
      
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek)
        day.setDate(startOfWeek.getDate() + i)
        days.push(day)
      }
    } else {
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth()
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      
      // Add days from previous month to fill first week
      const startPadding = firstDay.getDay()
      for (let i = startPadding - 1; i >= 0; i--) {
        const day = new Date(year, month, -i)
        days.push(day)
      }
      
      // Add all days in month
      for (let i = 1; i <= lastDay.getDate(); i++) {
        days.push(new Date(year, month, i))
      }
      
      // Add days from next month to fill last week
      const endPadding = 6 - lastDay.getDay()
      for (let i = 1; i <= endPadding; i++) {
        days.push(new Date(year, month + 1, i))
      }
    }
    
    return days
  }, [currentDate, viewMode])
  
  // Navigate calendar
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }
  
  // Get all workouts for a date
  const getWorkoutsForDate = (date: Date): ScheduledWorkout[] => {
    const dateStr = date.toISOString().split('T')[0]
    return scheduledWorkouts.filter(w => w.date === dateStr)
  }
  
  // Check if date has scheduled workout (for backwards compat)
  const getWorkoutForDate = (date: Date) => {
    const workouts = getWorkoutsForDate(date)
    return workouts.length > 0 ? workouts[0] : undefined
  }
  
  // Check if date is a training day based on frequency
  const isTrainingDay = (date: Date) => {
    const dayOfWeek = date.getDay()
    const trainingDays: number[] = []
    
    // Distribute training days evenly across the week
    if (preferences.frequency >= 1) trainingDays.push(1) // Monday
    if (preferences.frequency >= 2) trainingDays.push(4) // Thursday
    if (preferences.frequency >= 3) trainingDays.push(6) // Saturday
    if (preferences.frequency >= 4) trainingDays.push(2) // Tuesday
    if (preferences.frequency >= 5) trainingDays.push(5) // Friday
    if (preferences.frequency >= 6) trainingDays.push(3) // Wednesday
    if (preferences.frequency >= 7) trainingDays.push(0) // Sunday
    
    return trainingDays.includes(dayOfWeek)
  }
  
  // Add a workout to a date
  const addWorkoutToDate = (date: Date, workout?: Workout) => {
    const dateStr = date.toISOString().split('T')[0]
    const newWorkout = workout || generateWorkout(preferences.preferredDuration, focusAreas, preferences.ageLevel, preferences.drillCount)
    
    setScheduledWorkouts(prev => [
      ...prev,
      {
        id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date: dateStr,
        workoutId: newWorkout.id,
        workout: newWorkout,
        completed: false
      }
    ])
  }
  
  // Delete a scheduled workout
  const deleteScheduledWorkout = (scheduledWorkoutId: string) => {
    setScheduledWorkouts(prev => prev.filter(w => w.id !== scheduledWorkoutId))
  }
  
  // Save a workout as a draft/template for reuse
  const saveWorkoutAsDraft = (workout: Workout, name?: string) => {
    const draftWorkout: Workout = {
      ...workout,
      id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: name || workout.name || `Custom Workout ${savedWorkouts.length + 1}`
    }
    setSavedWorkouts(prev => [...prev, draftWorkout])
  }
  
  // Delete a saved/draft workout
  const deleteSavedWorkout = (workoutId: string) => {
    setSavedWorkouts(prev => prev.filter(w => w.id !== workoutId))
  }
  
  // Open the add workout picker modal
  const openAddWorkoutPicker = (targetDate: Date) => {
    setAddWorkoutTargetDate(targetDate)
    setShowAddWorkoutPicker(true)
  }
  
  // Add a saved workout to a date
  const addSavedWorkoutToDate = (workout: Workout) => {
    if (!addWorkoutTargetDate) return
    addWorkoutToDate(addWorkoutTargetDate, workout)
    setShowAddWorkoutPicker(false)
    setAddWorkoutTargetDate(null)
  }
  
  // Generate and add a new workout to the target date
  const addNewGeneratedWorkout = () => {
    if (!addWorkoutTargetDate) return
    const newWorkout = generateWorkout(preferences.preferredDuration, focusAreas, preferences.ageLevel, preferences.drillCount)
    addWorkoutToDate(addWorkoutTargetDate, newWorkout)
    setShowAddWorkoutPicker(false)
    setShowDateDetailModal(false) // Close the date detail modal too
    setAddWorkoutTargetDate(null)
  }
  
  // Open workout builder for custom workout creation
  const openWorkoutBuilderForDate = () => {
    setShowAddWorkoutPicker(false)
    setShowDateDetailModal(false) // Close the date detail modal too
    setShowWorkoutBuilder(true)
    // The workout builder will use addWorkoutTargetDate when scheduling
  }
  
  // Replace exercises in a workout
  const replaceExerciseInWorkout = (scheduledWorkoutId: string, exerciseIndex: number, newExercise: Exercise) => {
    setScheduledWorkouts(prev => prev.map(sw => {
      if (sw.id === scheduledWorkoutId) {
        const newExercises = [...sw.workout.exercises]
        newExercises[exerciseIndex] = newExercise
        return {
          ...sw,
          workout: { ...sw.workout, exercises: newExercises }
        }
      }
      return sw
    }))
  }
  
  // Delete exercise from workout
  const deleteExerciseFromWorkout = (scheduledWorkoutId: string, exerciseIndex: number) => {
    setScheduledWorkouts(prev => prev.map(sw => {
      if (sw.id === scheduledWorkoutId) {
        const newExercises = sw.workout.exercises.filter((_, i) => i !== exerciseIndex)
        return {
          ...sw,
          workout: { ...sw.workout, exercises: newExercises }
        }
      }
      return sw
    }))
  }
  
  // Add exercise to workout
  const addExerciseToWorkout = (scheduledWorkoutId: string, exercise: Exercise) => {
    setScheduledWorkouts(prev => prev.map(sw => {
      if (sw.id === scheduledWorkoutId) {
        return {
          ...sw,
          workout: { ...sw.workout, exercises: [...sw.workout.exercises, exercise] }
        }
      }
      return sw
    }))
  }
  
  // Start a workout
  const startWorkout = (date: Date) => {
    const workout = generateWorkout(preferences.preferredDuration, focusAreas, preferences.ageLevel, preferences.drillCount)
    setActiveWorkout(workout)
    setSelectedDate(date)
  }
  
  // Start a specific scheduled workout
  const startScheduledWorkout = (scheduledWorkout: ScheduledWorkout) => {
    setActiveWorkout(scheduledWorkout.workout)
    setSelectedDate(new Date(scheduledWorkout.date))
  }
  
  // Handle workout completion
  const handleWorkoutComplete = (videoBlob?: Blob) => {
    if (selectedDate && activeWorkout) {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      // Check if this workout is already scheduled
      const existingWorkout = scheduledWorkouts.find(w => w.workoutId === activeWorkout.id)
      
      if (existingWorkout) {
        // Update existing
        setScheduledWorkouts(prev => prev.map(w => 
          w.id === existingWorkout.id 
            ? { ...w, completed: true, videoRecorded: videoBlob ? URL.createObjectURL(videoBlob) : undefined }
            : w
        ))
      } else {
        // Add new completed workout
        setScheduledWorkouts(prev => [
          ...prev,
          {
            id: `scheduled-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            date: dateStr,
            workoutId: activeWorkout.id,
            workout: activeWorkout,
            completed: true,
            videoRecorded: videoBlob ? URL.createObjectURL(videoBlob) : undefined
          }
        ])
      }
    }
    setActiveWorkout(null)
    setSelectedDate(null)
  }
  
  // Handle frequency selection
  const handleFrequencySelect = (freq: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setShowFrequencyPopup(freq)
  }
  
  const confirmFrequency = () => {
    if (showFrequencyPopup) {
      setPreferences(prev => ({ ...prev, frequency: showFrequencyPopup }))
      setShowFrequencyPopup(null)
    }
  }
  
  // Handle drill count selection
  const handleDrillCountSelect = (count: 1 | 2 | 3 | 4 | 5 | 6 | 7) => {
    setShowDrillCountPopup(count)
  }
  
  const confirmDrillCount = () => {
    if (showDrillCountPopup) {
      setPreferences(prev => ({ ...prev, drillCount: showDrillCountPopup }))
      setShowDrillCountPopup(null)
    }
  }
  
  // Handle duration selection
  const handleDurationSelect = (duration: 5 | 10 | 15 | 20 | 30 | 45) => {
    setShowDurationPopup(duration)
  }
  
  const confirmDuration = () => {
    if (showDurationPopup) {
      setPreferences(prev => ({ ...prev, preferredDuration: showDurationPopup }))
      setShowDurationPopup(null)
    }
  }
  
  // Age Level popup handlers
  const handleAgeLevelSelect = (level: AgeLevel) => {
    setShowAgeLevelPopup(level)
  }
  
  const confirmAgeLevel = () => {
    if (showAgeLevelPopup) {
      const config = AGE_LEVEL_CONFIG[showAgeLevelPopup]
      setPreferences(prev => ({
        ...prev,
        ageLevel: showAgeLevelPopup,
        frequency: config.recommendedFrequency,
        preferredDuration: config.recommendedDuration
      }))
      setShowAgeLevelPopup(null)
    }
  }
  
  // State for drill pool browser (must be before any conditional returns)
  const [showDrillPool, setShowDrillPool] = useState(false)
  const [selectedDrills, setSelectedDrills] = useState<string[]>([])
  const [workoutMode, setWorkoutMode] = useState<'auto' | 'custom'>('auto')
  
  // Current age level config
  const currentAgeLevelConfig = AGE_LEVEL_CONFIG[preferences.ageLevel]
  
  // Get drills for current age level
  const availableDrills = useMemo(() => {
    return EXERCISE_DATABASE.filter(drill => drill.ageLevel.includes(preferences.ageLevel))
  }, [preferences.ageLevel])
  
  // Format date for display (uppercase)
  const formatDateHeader = () => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()
    } else if (viewMode === 'week') {
      const start = getDaysInView[0]
      const end = getDaysInView[6]
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`.toUpperCase()
    }
    return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase()
  }
  
  // Start custom workout with selected drills
  const startCustomWorkout = () => {
    if (selectedDrills.length === 0) return
    
    const exercises = selectedDrills
      .map(id => EXERCISE_DATABASE.find(e => e.id === id))
      .filter((e): e is Exercise => e !== undefined)
    
    const totalDuration = Math.ceil(exercises.reduce((sum, e) => sum + e.duration, 0) / 60)
    
    const workout: Workout = {
      id: `custom-workout-${Date.now()}`,
      name: `Custom ${currentAgeLevelConfig.name} Workout`,
      duration: totalDuration as 5 | 10 | 15 | 20 | 30 | 45,
      exercises,
      focusAreas: [...new Set(exercises.map(e => e.focusArea))],
      intensity: totalDuration <= 15 ? 'low' : totalDuration <= 30 ? 'medium' : 'high'
    }
    
    setActiveWorkout(workout)
    setSelectedDate(new Date())
    setShowDrillPool(false)
  }
  
  // =============================================
  // DRAG AND DROP WORKOUT BUILDER HANDLERS
  // =============================================
  
  // Handle drag start from drill pool
  const handleDragStart = (e: React.DragEvent, exercise: Exercise) => {
    setDraggedDrill(exercise)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', exercise.id)
  }
  
  // Handle drag over the workout builder area
  const handleDragOver = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    if (index !== undefined) {
      setDragOverIndex(index)
    }
  }
  
  // Handle drag leave
  const handleDragLeave = () => {
    setDragOverIndex(null)
  }
  
  // Handle drop into workout builder
  const handleDrop = (e: React.DragEvent, index?: number) => {
    e.preventDefault()
    
    if (draggedDrill) {
      const newDrill: CustomWorkoutDrill = {
        id: `${draggedDrill.id}-${Date.now()}`,
        exercise: draggedDrill,
        order: index !== undefined ? index : customWorkoutDrills.length
      }
      
      if (index !== undefined) {
        // Insert at specific position
        const newDrills = [...customWorkoutDrills]
        newDrills.splice(index, 0, newDrill)
        // Update order for all drills
        setCustomWorkoutDrills(newDrills.map((d, i) => ({ ...d, order: i })))
      } else {
        // Add to end
        setCustomWorkoutDrills([...customWorkoutDrills, newDrill])
      }
    }
    
    setDraggedDrill(null)
    setDragOverIndex(null)
  }
  
  // Handle reordering within the workout builder
  const handleReorderDragStart = (e: React.DragEvent, drill: CustomWorkoutDrill) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', drill.id)
    setDraggedDrill(drill.exercise)
  }
  
  // Remove drill from custom workout
  const removeDrillFromWorkout = (drillId: string) => {
    setCustomWorkoutDrills(prev => 
      prev.filter(d => d.id !== drillId).map((d, i) => ({ ...d, order: i }))
    )
  }
  
  // Start the custom built workout
  const startBuiltWorkout = () => {
    if (customWorkoutDrills.length === 0) return
    
    const exercises = customWorkoutDrills.map(d => d.exercise)
    const totalDuration = Math.ceil(exercises.reduce((sum, e) => sum + e.duration, 0) / 60)
    
    const workout: Workout = {
      id: `built-workout-${Date.now()}`,
      name: customWorkoutName || `Custom ${currentAgeLevelConfig.name} Workout`,
      duration: totalDuration as 5 | 10 | 15 | 20 | 30 | 45,
      exercises,
      focusAreas: [...new Set(exercises.map(e => e.focusArea))],
      intensity: totalDuration <= 15 ? 'low' : totalDuration <= 30 ? 'medium' : 'high'
    }
    
    setActiveWorkout(workout)
    setSelectedDate(new Date())
    setShowWorkoutBuilder(false)
  }
  
  // Calculate total duration of custom workout
  const customWorkoutTotalDuration = useMemo(() => {
    return Math.ceil(customWorkoutDrills.reduce((sum, d) => sum + d.exercise.duration, 0) / 60)
  }, [customWorkoutDrills])
  
  // If workout is active, show the timer
  if (activeWorkout) {
    return (
      <WorkoutTimer
        workout={activeWorkout}
        preferences={preferences}
        onComplete={handleWorkoutComplete}
        onCancel={() => {
          setActiveWorkout(null)
          setSelectedDate(null)
        }}
      />
    )
  }
  
  // Handle per-drill file upload
  const handleDrillFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentDrillForUpload) return
    
    const isVideo = file.type.startsWith('video/')
    const isImage = file.type.startsWith('image/')
    
    if (!isVideo && !isImage) {
      alert('Please upload a video or image file')
      return
    }
    
    const url = URL.createObjectURL(file)
    const blob = file
    
    setDrillMediaMap(prev => ({
      ...prev,
      [currentDrillForUpload]: {
        type: isVideo ? 'video' : 'image',
        blob,
        url,
        hasCoachFeedback: false
      }
    }))
    
    setDrillMediaExpanded(null)
    setCurrentDrillForUpload(null)
    
    // Reset the input
    if (drillFileInputRef.current) {
      drillFileInputRef.current.value = ''
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Hidden file input for per-drill uploads */}
      <input
        ref={drillFileInputRef}
        type="file"
        accept="video/*,image/*"
        className="hidden"
        onChange={handleDrillFileUpload}
      />
      
      {/* Inspirational Notification Banner - Only shows when there's a workout scheduled for today */}
      {showNotificationBanner && currentNotification && (
        <div className="bg-gradient-to-r from-[#FF6B35]/20 via-[#FF4500]/20 to-[#FF6B35]/20 rounded-xl p-4 border border-[#FF6B35]/30 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider">WORKOUT SCHEDULED TODAY</p>
                <p className="text-[#E5E5E5] italic">{currentNotification}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setCurrentNotification(getInspirationalMessage())
                }}
                className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-[#FF6B35] transition-colors"
                title="New message"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowNotificationBanner(false)}
                className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/30">
              <Calendar className="w-7 h-7 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#FF6B35] uppercase tracking-wider">
                TRAINING CALENDAR
              </h2>
              <p className="text-[#888] text-sm">
                {preferences.frequency}x per week • {preferences.preferredDuration} min workouts
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] hover:text-white hover:border-[#FF6B35] transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a] space-y-6">
          <h3 className="text-[#FF6B35] font-bold text-lg flex items-center gap-2 uppercase">
            <Settings className="w-5 h-5" />
            TRAINING PREFERENCES
          </h3>
          
          {/* Frequency Selector */}
          <div>
            <label className="text-[#888] text-sm uppercase tracking-wider block mb-3">
              TRAINING FREQUENCY (DAYS PER WEEK)
            </label>
            <div className="grid grid-cols-7 gap-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => handleFrequencySelect(freq)}
                  className={`p-3 rounded-xl text-center transition-all ${
                    preferences.frequency === freq
                      ? 'bg-[#FF6B35] text-[#1a1a1a] font-bold'
                      : 'bg-[#2a2a2a] text-[#888] hover:text-white hover:border-[#FF6B35] border border-[#3a3a3a]'
                  }`}
                >
                  <span className="text-lg font-bold">{freq}</span>
                  <span className="block text-xs mt-1">{freq === 1 ? 'day' : 'days'}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Duration Selector */}
          <div>
            <label className="text-[#888] text-sm uppercase tracking-wider block mb-3">
              WORKOUT DURATION
            </label>
            <div className="grid grid-cols-6 gap-2">
              {durationOptions.map(duration => {
                const isSweet = duration === 15 || duration === 20
                return (
                  <button
                    key={duration}
                    onClick={() => handleDurationSelect(duration)}
                    className={`p-3 rounded-xl text-center transition-all relative ${
                      preferences.preferredDuration === duration
                        ? isSweet 
                          ? 'bg-green-500 text-white font-bold ring-2 ring-green-400'
                          : 'bg-[#FF6B35] text-[#1a1a1a] font-bold'
                        : isSweet
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                          : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a]'
                    }`}
                  >
                    {isSweet && (
                      <Star className="w-3 h-3 absolute top-1 right-1 text-green-400" />
                    )}
                    <span className="text-lg font-bold">{duration}</span>
                    <span className="block text-xs mt-1">MIN</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[#666] text-xs mt-2">
              {(preferences.preferredDuration === 15 || preferences.preferredDuration === 20) && (
                <span className="text-green-400 font-medium">RECOMMENDED: 15-20 minutes is optimal for skill development</span>
              )}
              {preferences.preferredDuration <= 10 && "Quick session for busy days"}
              {preferences.preferredDuration > 20 && preferences.preferredDuration <= 30 && "Full session with warm-up and cool-down"}
              {preferences.preferredDuration > 30 && "Extended comprehensive workout - include breaks"}
            </p>
          </div>
          
          {/* Drill Count Selector */}
          <div>
            <label className="text-[#888] text-sm uppercase tracking-wider block mb-3">
              DRILLS PER WORKOUT
            </label>
            <div className="grid grid-cols-7 gap-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(count => {
                const data = DRILL_COUNT_RESEARCH[count]
                const isSweet = count === 3 || count === 4
                return (
                  <button
                    key={count}
                    onClick={() => handleDrillCountSelect(count)}
                    className={`p-3 rounded-xl text-center transition-all relative ${
                      preferences.drillCount === count
                        ? isSweet 
                          ? 'bg-green-500 text-white font-bold ring-2 ring-green-400'
                          : 'bg-[#FF6B35] text-[#1a1a1a] font-bold'
                        : isSweet
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                          : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a]'
                    }`}
                  >
                    {isSweet && (
                      <Star className="w-3 h-3 absolute top-1 right-1 text-green-400" />
                    )}
                    <span className="text-lg font-bold">{count}</span>
                    <span className="block text-xs mt-1">{count === 1 ? 'drill' : 'drills'}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[#666] text-xs mt-2">
              {preferences.drillCount <= 2 && "Ultra-focused: Maximum concentration on specific skills"}
              {(preferences.drillCount === 3 || preferences.drillCount === 4) && (
                <span className="text-green-400 font-medium">RECOMMENDED: 3-4 drills is the sweet spot for focused improvement</span>
              )}
              {preferences.drillCount >= 5 && "More variety but less depth - may dilute focus"}
            </p>
          </div>
          
          {/* Workout Mode */}
          <div>
            <label className="text-[#888] text-sm uppercase tracking-wider block mb-3">
              WORKOUT MODE
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setPreferences(prev => ({ ...prev, workoutMode: 'continuous' }))}
                className={`p-4 rounded-xl text-left transition-all ${
                  preferences.workoutMode === 'continuous'
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : 'bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#FF6B35]'
                }`}
              >
                <Play className={`w-6 h-6 mb-2 ${preferences.workoutMode === 'continuous' ? 'text-[#FF6B35]' : 'text-[#888]'}`} />
                <h4 className={`font-bold uppercase ${preferences.workoutMode === 'continuous' ? 'text-[#FF6B35]' : 'text-[#E5E5E5]'}`}>
                  CONTINUOUS
                </h4>
                <p className="text-[#888] text-sm mt-1">
                  Drills flow automatically without stopping. When one drill ends, the next begins immediately. Best for building endurance and maintaining workout intensity.
                </p>
              </button>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, workoutMode: 'step-by-step' }))}
                className={`p-4 rounded-xl text-left transition-all ${
                  preferences.workoutMode === 'step-by-step'
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : 'bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#FF6B35]'
                }`}
              >
                <Pause className={`w-6 h-6 mb-2 ${preferences.workoutMode === 'step-by-step' ? 'text-[#FF6B35]' : 'text-[#888]'}`} />
                <h4 className={`font-bold uppercase ${preferences.workoutMode === 'step-by-step' ? 'text-[#FF6B35]' : 'text-[#E5E5E5]'}`}>
                  STEP-BY-STEP
                </h4>
                <p className="text-[#888] text-sm mt-1">
                  After each drill, the workout pauses with a popup explaining the next drill. Take time to rest, review technique, and ensure you are ready before pressing START.
                </p>
              </button>
            </div>
            <p className="text-[#666] text-xs mt-3 bg-[#2a2a2a] p-3 rounded-lg">
              <span className="text-[#FF6B35] font-bold">TIP:</span> {preferences.workoutMode === 'continuous' 
                ? "Continuous mode is great for experienced players who know the drills. Keeps your heart rate up and simulates game conditions."
                : "Step-by-step mode is ideal for beginners or when learning new drills. Focus on form over speed."}
            </p>
          </div>
          
          {/* Workout Level / Age Level */}
          <div>
            <label className="text-[#888] text-sm uppercase tracking-wider block mb-3">
              WORKOUT LEVEL
            </label>
            <div className="grid grid-cols-5 gap-2">
              {ageLevels.map(level => {
                const config = AGE_LEVEL_CONFIG[level]
                const isActive = preferences.ageLevel === level
                return (
                  <button
                    key={level}
                    onClick={() => handleAgeLevelSelect(level)}
                    className={`p-3 rounded-xl text-center transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${config.bgColor} ${config.color} border-2 ${config.borderColor}`
                        : 'bg-[#2a2a2a] text-[#666] hover:text-white border border-[#3a3a3a]'
                    }`}
                    title={config.description}
                  >
                    <AgeLevelIcon type={config.iconType} className={`w-5 h-5 mx-auto mb-1 ${isActive ? config.color : ''}`} />
                    <span className="block text-xs font-bold">{config.shortName}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[#666] text-xs mt-2">
              {currentAgeLevelConfig.description}
            </p>
            
            {/* Age Level Tips - Collapsible */}
            <button
              onClick={() => setShowAgeLevelInfo(!showAgeLevelInfo)}
              className="flex items-center gap-2 text-xs text-[#888] hover:text-white transition-colors mt-3"
            >
              <Info className="w-3 h-3" />
              {showAgeLevelInfo ? 'Hide' : 'Show'} tips for {currentAgeLevelConfig.name} players
              <ChevronDown className={`w-3 h-3 transition-transform ${showAgeLevelInfo ? 'rotate-180' : ''}`} />
            </button>
            
            {showAgeLevelInfo && (
              <div className="mt-2 space-y-1">
                {currentAgeLevelConfig.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 bg-[#2a2a2a] rounded-lg p-2">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-[#E5E5E5] text-xs">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[#E5E5E5] font-bold uppercase">SOUND EFFECTS</h4>
              <p className="text-[#888] text-sm">Play chime when exercise completes</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`w-14 h-8 rounded-full transition-all ${
                preferences.soundEnabled ? 'bg-[#FF6B35]' : 'bg-[#3a3a3a]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                preferences.soundEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {/* Auto-Populate from Flaws Toggle */}
          <div className="border-t border-[#3a3a3a] pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <h4 className="text-[#E5E5E5] font-bold uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  AUTO-POPULATE FROM FLAWS
                </h4>
                <p className="text-[#888] text-sm mt-1">
                  Automatically generate workouts based on your identified shooting flaws
                </p>
                {detectedFlaws.length > 0 ? (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {detectedFlaws.length} flaw{detectedFlaws.length > 1 ? 's' : ''} detected - ready to create personalized workouts
                  </p>
                ) : (
                  <p className="text-[#666] text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No flaws detected yet. Upload a shooting image to identify areas for improvement.
                  </p>
                )}
              </div>
              <button
                onClick={() => handleAutoPopulateToggle(!preferences.autoPopulateFromFlaws)}
                className={`w-14 h-8 rounded-full transition-all ${
                  preferences.autoPopulateFromFlaws ? 'bg-green-500' : 'bg-[#3a3a3a]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                  preferences.autoPopulateFromFlaws ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
            
            {/* Show what flaws will be addressed OR waiting message */}
            {preferences.autoPopulateFromFlaws && (
              detectedFlaws.length > 0 ? (
                <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-xl p-4">
                  <h5 className="text-green-400 font-bold text-sm mb-2 uppercase">TARGETING YOUR FLAWS:</h5>
                  <div className="flex flex-wrap gap-2">
                    {detectedFlaws.slice(0, 5).map((flaw, idx) => (
                      <span 
                        key={idx}
                        className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30"
                      >
                        {flaw.name}
                      </span>
                    ))}
                    {detectedFlaws.length > 5 && (
                      <span className="px-2 py-1 bg-[#2a2a2a] text-[#888] text-xs rounded-full">
                        +{detectedFlaws.length - 5} more
                      </span>
                    )}
                  </div>
                  <p className="text-[#888] text-xs mt-3">
                    Workouts will focus on drills that address these specific issues.
                  </p>
                </div>
              ) : (
                <div className="mt-4 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-xl p-4">
                  <h5 className="text-[#FF6B35] font-bold text-sm mb-2 uppercase flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    READY & WAITING
                  </h5>
                  <p className="text-[#888] text-sm">
                    Auto-populate is enabled. When you upload a shooting image and flaws are detected, 
                    personalized workouts will automatically be generated and added to your calendar.
                  </p>
                </div>
              )
            )}
          </div>
        </div>
      )}
      
      {/* Calendar Navigation */}
      <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-4">
            <h3 className="text-[#E5E5E5] font-bold text-lg">{formatDateHeader()}</h3>
            <div className="flex items-center gap-1 bg-[#2a2a2a] rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'day' ? 'bg-[#FF6B35] text-[#1a1a1a]' : 'text-[#888] hover:text-white'
                }`}
              >
                DAY
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'week' ? 'bg-[#FF6B35] text-[#1a1a1a]' : 'text-[#888] hover:text-white'
                }`}
              >
                WEEK
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  viewMode === 'month' ? 'bg-[#FF6B35] text-[#1a1a1a]' : 'text-[#888] hover:text-white'
                }`}
              >
                MONTH
              </button>
            </div>
          </div>
          
          <button
            onClick={() => navigateCalendar('next')}
            className="p-2 rounded-lg bg-[#2a2a2a] text-[#888] hover:text-white transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className={`grid ${viewMode === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-2`}>
          {/* Day Headers - only show for week/month view */}
          {viewMode !== 'day' && ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center text-[#888] text-xs font-bold py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {getDaysInView.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const workouts = getWorkoutsForDate(date) // Get ALL workouts for this date
            const workoutCount = workouts.length
            const completedCount = workouts.filter(w => w.completed).length
            const allCompleted = workoutCount > 0 && completedCount === workoutCount
            const someCompleted = completedCount > 0 && completedCount < workoutCount
            const isPast = date < new Date(new Date().setHours(0, 0, 0, 0))
            
            return (
              <div
                key={i}
                onClick={() => {
                  setSelectedDateForDetail(date)
                  setShowDateDetailModal(true)
                }}
                className={`relative p-2 rounded-xl transition-all cursor-pointer ${
                  viewMode === 'day' ? 'min-h-[300px]' : viewMode === 'week' ? 'min-h-[120px]' : 'min-h-[80px]'
                } ${
                  isToday
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : allCompleted
                      ? 'bg-green-500/10 border border-green-500/30'
                      : workoutCount > 0
                        ? 'bg-green-500/10 border border-green-500/30 hover:border-green-500'
                        : 'bg-[#2a2a2a] border border-[#3a3a3a] hover:border-[#4a4a4a]'
                } ${!isCurrentMonth && viewMode === 'month' ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold ${
                    isToday ? 'text-[#FF6B35]' : isCurrentMonth ? 'text-[#E5E5E5]' : 'text-[#666]'
                  }`}>
                    {date.getDate()}
                  </span>
                  <div className="flex items-center gap-1">
                    {allCompleted && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                    {workoutCount > 0 && (
                      <Edit3 className="w-3 h-3 text-[#666] hover:text-[#FF6B35]" />
                    )}
                  </div>
                </div>
                
                {/* Show workout count badge - GREEN with basketball icon */}
                {workoutCount > 0 && !isPast && !allCompleted && (
                  <div className="w-full mt-1 py-1.5 rounded-lg bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center gap-1">
                    <CircleDot className="w-3 h-3" />
                    {workoutCount} WORKOUT{workoutCount > 1 ? 'S' : ''}
                  </div>
                )}
                
                {/* Show completion status with count */}
                {allCompleted && (
                  <div className="text-green-400 text-xs text-center mt-1 flex items-center justify-center gap-1">
                    <Check className="w-3 h-3" />
                    {workoutCount > 1 ? `${workoutCount} DONE` : 'DONE'}
                  </div>
                )}
                
                {/* Partial completion */}
                {someCompleted && !isPast && (
                  <div className="text-orange-400 text-xs text-center mt-1 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    {completedCount}/{workoutCount} DONE
                  </div>
                )}
                
                {/* Missed workouts */}
                {isPast && workoutCount > 0 && !allCompleted && (
                  <div className="text-[#666] text-xs text-center mt-1 uppercase">
                    {completedCount > 0 ? `${completedCount}/${workoutCount} Done` : `${workoutCount} Missed`}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Workout Mode Selection */}
      <div className="bg-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <h3 className="text-[#FF6B35] font-bold text-lg mb-4 flex items-center gap-2 uppercase">
          <Dumbbell className="w-5 h-5" />
          START A WORKOUT
        </h3>
        
        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setWorkoutMode('auto')}
            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              workoutMode === 'auto'
                ? 'bg-[#FF6B35] text-[#1a1a1a]'
                : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a]'
            }`}
          >
            <Zap className="w-4 h-4" />
            AUTO-GENERATED
          </button>
          <button
            onClick={() => {
              setWorkoutMode('custom')
              setShowDrillPool(true)
            }}
            className={`flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
              workoutMode === 'custom'
                ? 'bg-[#FF6B35] text-[#1a1a1a]'
                : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a]'
            }`}
          >
            <Target className="w-4 h-4" />
            PICK MY DRILLS
          </button>
          <button
            onClick={() => setShowWorkoutBuilder(true)}
            className="flex-1 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a] hover:border-purple-500"
          >
            <GripVertical className="w-4 h-4" />
            BUILD WORKOUT
          </button>
        </div>
        
        {/* Notification Settings */}
        <div className="flex items-center justify-between mb-4 p-3 bg-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <BellRing className="w-4 h-4 text-[#FF6B35]" />
            ) : (
              <Bell className="w-4 h-4 text-[#888]" />
            )}
            <span className="text-sm text-[#888]">WORKOUT REMINDERS</span>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              notificationsEnabled ? 'bg-[#FF6B35]' : 'bg-[#3a3a3a]'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        
        {workoutMode === 'auto' ? (
          <div className="space-y-4">
            <p className="text-[#888] text-sm">
              Auto-generate a {preferences.preferredDuration}-minute {currentAgeLevelConfig.name}-level workout with{' '}
              <span className={preferences.drillCount >= 3 && preferences.drillCount <= 4 ? 'text-green-400 font-bold' : ''}>
                {preferences.drillCount} focused drill{preferences.drillCount > 1 ? 's' : ''}
              </span>.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => startWorkout(new Date())}
                className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-[#1a1a1a] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                START NOW
              </button>
              <button
                onClick={() => {
                  // Find the next training day and schedule
                  const today = new Date()
                  let targetDate = today
                  // If today already has a workout or is not a training day, find next available
                  for (let i = 0; i < 7; i++) {
                    const checkDate = new Date(today)
                    checkDate.setDate(today.getDate() + i)
                    if (isTrainingDay(checkDate)) {
                      targetDate = checkDate
                      break
                    }
                  }
                  addWorkoutToDate(targetDate)
                  setShowDateDetailModal(true)
                  setSelectedDateForDetail(targetDate)
                }}
                className="flex-1 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] hover:text-white hover:border-[#FF6B35] transition-all flex items-center justify-center gap-2"
              >
                <Calendar className="w-5 h-5" />
                SCHEDULE TO CALENDAR
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[#888] text-sm">
              {selectedDrills.length === 0 
                ? 'Browse the drill pool and select the drills you want to work on.'
                : `${selectedDrills.length} drill${selectedDrills.length > 1 ? 's' : ''} selected`
              }
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDrillPool(true)}
                className="flex-1 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] hover:text-white hover:border-[#FF6B35] transition-all flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Browse Drill Pool
              </button>
              {selectedDrills.length > 0 && (
                <>
                  <button
                    onClick={startCustomWorkout}
                    className="flex-1 py-3 rounded-xl bg-[#FF6B35] text-[#1a1a1a] font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    START NOW
                  </button>
                  <button
                    onClick={() => {
                      // Schedule custom workout to calendar
                      const today = new Date()
                      let targetDate = today
                      for (let i = 0; i < 7; i++) {
                        const checkDate = new Date(today)
                        checkDate.setDate(today.getDate() + i)
                        if (isTrainingDay(checkDate)) {
                          targetDate = checkDate
                          break
                        }
                      }
                      // Create workout from selected drills (convert IDs to Exercise objects)
                      const selectedExercises = selectedDrills
                        .map(id => availableDrills.find(d => d.id === id))
                        .filter((d): d is Exercise => d !== undefined)
                      const customWorkout: Workout = {
                        id: `custom-${Date.now()}`,
                        name: `Custom ${preferences.preferredDuration} Min Workout`,
                        duration: preferences.preferredDuration,
                        exercises: selectedExercises,
                        focusAreas: [...new Set(selectedExercises.map(d => d.focusArea))],
                        intensity: 'medium'
                      }
                      addWorkoutToDate(targetDate, customWorkout)
                      setSelectedDrills([])
                      setShowDateDetailModal(true)
                      setSelectedDateForDetail(targetDate)
                    }}
                    className="flex-1 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] hover:text-white hover:border-[#FF6B35] transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    SCHEDULE
                  </button>
                  <button
                    onClick={() => {
                      // Save as draft
                      const selectedExercises = selectedDrills
                        .map(id => availableDrills.find(d => d.id === id))
                        .filter((d): d is Exercise => d !== undefined)
                      const customWorkout: Workout = {
                        id: `draft-${Date.now()}`,
                        name: `Custom ${preferences.preferredDuration} Min Workout`,
                        duration: preferences.preferredDuration,
                        exercises: selectedExercises,
                        focusAreas: [...new Set(selectedExercises.map(d => d.focusArea))],
                        intensity: 'medium'
                      }
                      saveWorkoutAsDraft(customWorkout)
                      setSelectedDrills([])
                    }}
                    className="py-3 px-4 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] hover:text-[#FF6B35] hover:border-[#FF6B35]/50 transition-all flex items-center justify-center gap-2"
                    title="Save as draft for later"
                  >
                    <Star className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Drill Pool Browser Modal */}
      {showDrillPool && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#FF6B35] uppercase">DRILL POOL</h3>
                <p className="text-[#888] text-sm">
                  {currentAgeLevelConfig.name} Level - {availableDrills.filter(d => 
                    drillCategoryFilter === 'all' || d.focusArea === drillCategoryFilter
                  ).length} drills available
                </p>
              </div>
              <button
                onClick={() => setShowDrillPool(false)}
                className="text-[#888] hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Category Filter */}
            <div className="px-4 py-3 border-b border-[#3a3a3a] overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {DRILL_CATEGORIES.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setDrillCategoryFilter(category.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase flex items-center gap-1.5 transition-all whitespace-nowrap ${
                      drillCategoryFilter === category.id
                        ? 'bg-[#FF6B35] text-[#1a1a1a]'
                        : 'bg-[#2a2a2a] text-[#888] hover:text-white border border-[#3a3a3a]'
                    }`}
                  >
                    <CategoryIcon type={category.icon} className="w-3.5 h-3.5" />
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Selected Count */}
            {selectedDrills.length > 0 && (
              <div className="px-4 py-2 bg-[#FF6B35]/10 border-b border-[#FF6B35]/30 flex items-center justify-between">
                <span className="text-[#FF6B35] font-bold">
                  {selectedDrills.length} DRILL{selectedDrills.length > 1 ? 'S' : ''} SELECTED
                </span>
                <button
                  onClick={() => setSelectedDrills([])}
                  className="text-[#888] hover:text-white text-sm uppercase"
                >
                  Clear All
                </button>
              </div>
            )}
            
            {/* Drill List */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-3">
                {availableDrills
                  .filter(d => drillCategoryFilter === 'all' || d.focusArea === drillCategoryFilter)
                  .map(drill => {
                  const isSelected = selectedDrills.includes(drill.id)
                  return (
                    <div
                      key={drill.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#FF6B35]/10 border-[#FF6B35]/50'
                          : 'bg-[#2a2a2a] border-[#3a3a3a] hover:border-[#4a4a4a]'
                      }`}
                      onClick={() => {
                        setSelectedDrills(prev => 
                          isSelected
                            ? prev.filter(id => id !== drill.id)
                            : [...prev, drill.id]
                        )
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected
                            ? 'bg-[#FF6B35] border-[#FF6B35]'
                            : 'border-[#4a4a4a]'
                        }`}>
                          {isSelected && <Check className="w-4 h-4 text-[#1a1a1a]" />}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`font-bold uppercase ${isSelected ? 'text-[#FF6B35]' : 'text-[#E5E5E5]'}`}>
                              {drill.name.toUpperCase()}
                            </h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${
                              drill.focusArea === 'elbow' ? 'bg-blue-500/20 text-blue-400' :
                              drill.focusArea === 'release' ? 'bg-green-500/20 text-green-400' :
                              drill.focusArea === 'follow-through' ? 'bg-purple-500/20 text-purple-400' :
                              drill.focusArea === 'balance' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-[#3a3a3a] text-[#888]'
                            }`}>
                              {drill.focusArea.toUpperCase()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setSelectedDrillForExplanation(drill)
                              }}
                              className="ml-auto p-1.5 rounded-lg bg-[#3a3a3a] hover:bg-[#FF6B35] text-[#888] hover:text-[#1a1a1a] transition-all"
                              title="Learn how to do this drill"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          </div>
                          <p className="text-[#888] text-sm mb-2 line-clamp-2">{drill.description}</p>
                          <div className="flex items-center gap-4 text-xs text-[#666]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.ceil(drill.duration / 60)} min
                            </span>
                            {drill.reps && (
                              <span className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                {drill.reps}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between">
              <button
                onClick={() => setShowDrillPool(false)}
                className="px-6 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
              >
                CANCEL
              </button>
              <button
                onClick={() => {
                  setShowDrillPool(false)
                  if (selectedDrills.length > 0) {
                    startCustomWorkout()
                  }
                }}
                disabled={selectedDrills.length === 0}
                className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                  selectedDrills.length > 0
                    ? 'bg-[#FF6B35] text-[#1a1a1a] hover:brightness-110'
                    : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                }`}
              >
                <Play className="w-5 h-5" />
                {selectedDrills.length > 0 
                  ? `Start ${selectedDrills.length} Drill${selectedDrills.length > 1 ? 's' : ''}`
                  : 'Select Drills'
                }
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Workout Builder Modal - Drag and Drop */}
      {showWorkoutBuilder && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-[#FF6B35] flex items-center gap-2">
                  <GripVertical className="w-5 h-5" />
                  Build Your Workout
                </h3>
                <p className="text-[#888] text-sm">
                  Drag and drop drills to create your custom workout
                </p>
              </div>
              <button
                onClick={() => setShowWorkoutBuilder(false)}
                className="text-[#888] hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Main Content - Two Columns */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Column - Drill Pool */}
              <div className="w-1/2 border-r border-[#3a3a3a] flex flex-col">
                <div className="p-3 bg-[#2a2a2a] border-b border-[#3a3a3a]">
                  <h4 className="text-[#888] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Available Drills - Drag to Add
                  </h4>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {availableDrills.map(drill => (
                    <div
                      key={drill.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, drill)}
                      className="p-3 rounded-lg bg-[#2a2a2a] border border-[#3a3a3a] cursor-grab active:cursor-grabbing hover:border-[#FF6B35]/50 transition-all group"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical className="w-4 h-4 text-[#666] mt-1 group-hover:text-[#FF6B35]" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-bold text-[#E5E5E5] text-sm uppercase">{drill.name.toUpperCase()}</h5>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase ${
                              drill.focusArea === 'elbow' ? 'bg-blue-500/20 text-blue-400' :
                              drill.focusArea === 'release' ? 'bg-green-500/20 text-green-400' :
                              drill.focusArea === 'follow-through' ? 'bg-purple-500/20 text-purple-400' :
                              drill.focusArea === 'balance' ? 'bg-orange-500/20 text-orange-400' :
                              'bg-[#3a3a3a] text-[#888]'
                            }`}>
                              {drill.focusArea.toUpperCase()}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                e.preventDefault()
                                setSelectedDrillForExplanation(drill)
                              }}
                              className="ml-auto p-1 rounded bg-[#3a3a3a] hover:bg-[#FF6B35] text-[#888] hover:text-[#1a1a1a] transition-all"
                              title="Learn how to do this drill"
                            >
                              <Info className="w-3 h-3" />
                            </button>
                          </div>
                          <p className="text-[#888] text-xs line-clamp-1">{drill.description}</p>
                          <div className="flex items-center gap-3 mt-1 text-[10px] text-[#666]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {Math.ceil(drill.duration / 60)} min
                            </span>
                            {drill.reps && (
                              <span>{drill.reps}</span>
                            )}
                          </div>
                        </div>
                        <Plus className="w-4 h-4 text-[#666] group-hover:text-[#FF6B35]" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Right Column - Workout Builder */}
              <div className="w-1/2 flex flex-col">
                <div className="p-3 bg-[#2a2a2a] border-b border-[#3a3a3a] flex items-center justify-between">
                  <div>
                    <h4 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                      <Dumbbell className="w-4 h-4" />
                      Your Workout
                    </h4>
                    <p className="text-[#888] text-xs">
                      {customWorkoutDrills.length} drills - {customWorkoutTotalDuration} min total
                    </p>
                  </div>
                  <input
                    type="text"
                    value={customWorkoutName}
                    onChange={(e) => setCustomWorkoutName(e.target.value)}
                    placeholder="Workout name..."
                    className="px-3 py-1 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] text-[#E5E5E5] text-sm focus:border-[#FF6B35] focus:outline-none"
                  />
                </div>
                
                {/* Drop Zone */}
                <div 
                  className={`flex-1 overflow-y-auto p-3 ${
                    customWorkoutDrills.length === 0 ? 'flex items-center justify-center' : ''
                  }`}
                  onDragOver={(e) => handleDragOver(e)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e)}
                >
                  {customWorkoutDrills.length === 0 ? (
                    <div className={`text-center p-8 border-2 border-dashed rounded-xl transition-colors ${
                      draggedDrill ? 'border-[#FF6B35] bg-[#FF6B35]/10' : 'border-[#3a3a3a]'
                    }`}>
                      <GripVertical className="w-12 h-12 text-[#666] mx-auto mb-3" />
                      <p className="text-[#888] font-medium">Drop drills here</p>
                      <p className="text-[#666] text-sm">Drag drills from the left panel to build your workout</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customWorkoutDrills.map((drill, index) => (
                        <div
                          key={drill.id}
                          draggable
                          onDragStart={(e) => handleReorderDragStart(e, drill)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`p-3 rounded-lg bg-[#2a2a2a] border transition-all cursor-grab active:cursor-grabbing ${
                            dragOverIndex === index 
                              ? 'border-[#FF6B35] bg-[#FF6B35]/10' 
                              : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <GripVertical className="w-4 h-4 text-[#666]" />
                              <span className="w-6 h-6 rounded-full bg-[#FF6B35] text-[#1a1a1a] flex items-center justify-center text-xs font-bold">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h5 className="font-bold text-[#E5E5E5] text-sm uppercase">{drill.exercise.name.toUpperCase()}</h5>
                              <div className="flex items-center gap-3 text-[10px] text-[#666]">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {Math.ceil(drill.exercise.duration / 60)} min
                                </span>
                                <span className={`px-1.5 py-0.5 rounded uppercase ${
                                  drill.exercise.focusArea === 'elbow' ? 'bg-blue-500/20 text-blue-400' :
                                  drill.exercise.focusArea === 'release' ? 'bg-green-500/20 text-green-400' :
                                  drill.exercise.focusArea === 'follow-through' ? 'bg-purple-500/20 text-purple-400' :
                                  drill.exercise.focusArea === 'balance' ? 'bg-orange-500/20 text-orange-400' :
                                  'bg-[#3a3a3a] text-[#888]'
                                }`}>
                                  {drill.exercise.focusArea.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => removeDrillFromWorkout(drill.id)}
                              className="p-1 rounded text-[#666] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Drop zone at end */}
                      <div 
                        onDragOver={(e) => handleDragOver(e, customWorkoutDrills.length)}
                        onDrop={(e) => handleDrop(e, customWorkoutDrills.length)}
                        className={`p-4 border-2 border-dashed rounded-lg text-center transition-colors ${
                          dragOverIndex === customWorkoutDrills.length 
                            ? 'border-[#FF6B35] bg-[#FF6B35]/10' 
                            : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
                        }`}
                      >
                        <Plus className="w-5 h-5 text-[#666] mx-auto" />
                        <p className="text-[#666] text-xs mt-1">Drop to add more</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#3a3a3a] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowWorkoutBuilder(false)}
                  className="px-6 py-3 rounded-xl bg-[#2a2a2a] text-[#888] font-bold hover:bg-[#3a3a3a] transition-colors"
                >
                  CANCEL
                </button>
                {customWorkoutDrills.length > 0 && (
                  <button
                    onClick={() => {
                      setCustomWorkoutDrills([])
                      setCustomWorkoutName('')
                    }}
                    className="px-4 py-3 rounded-xl bg-[#2a2a2a] text-red-400 font-bold hover:bg-red-500/10 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {customWorkoutDrills.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        // Schedule built workout to calendar
                        const today = new Date()
                        let targetDate = today
                        for (let i = 0; i < 7; i++) {
                          const checkDate = new Date(today)
                          checkDate.setDate(today.getDate() + i)
                          if (isTrainingDay(checkDate)) {
                            targetDate = checkDate
                            break
                          }
                        }
                        // Create workout from builder drills
                        const builtWorkout: Workout = {
                          id: `built-${Date.now()}`,
                          name: customWorkoutName || `Custom ${customWorkoutTotalDuration} Min Workout`,
                          duration: customWorkoutTotalDuration,
                          exercises: customWorkoutDrills.map(d => d.exercise),
                          focusAreas: [...new Set(customWorkoutDrills.map(d => d.exercise.focusArea))],
                          intensity: 'medium'
                        }
                        // If we have a target date from the picker, use it
                        const scheduleDate = addWorkoutTargetDate || targetDate
                        addWorkoutToDate(scheduleDate, builtWorkout)
                        setShowWorkoutBuilder(false)
                        setCustomWorkoutDrills([])
                        setCustomWorkoutName('')
                        setAddWorkoutTargetDate(null)
                        setShowDateDetailModal(true)
                        setSelectedDateForDetail(scheduleDate)
                      }}
                      className="px-6 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] font-bold hover:text-white hover:border-[#FF6B35] transition-all flex items-center gap-2"
                    >
                      <Calendar className="w-5 h-5" />
                      SCHEDULE
                    </button>
                    <button
                      onClick={() => {
                        // Save workout as draft/template
                        const builtWorkout: Workout = {
                          id: `draft-${Date.now()}`,
                          name: customWorkoutName || `Custom ${customWorkoutTotalDuration} Min Workout`,
                          duration: customWorkoutTotalDuration,
                          exercises: customWorkoutDrills.map(d => d.exercise),
                          focusAreas: [...new Set(customWorkoutDrills.map(d => d.exercise.focusArea))],
                          intensity: 'medium'
                        }
                        saveWorkoutAsDraft(builtWorkout, customWorkoutName || undefined)
                        setShowWorkoutBuilder(false)
                        setCustomWorkoutDrills([])
                        setCustomWorkoutName('')
                      }}
                      className="px-6 py-3 rounded-xl bg-[#2a2a2a] border border-[#3a3a3a] text-[#888] font-bold hover:text-[#FF6B35] hover:border-[#FF6B35]/50 transition-all flex items-center gap-2"
                      title="Save this workout as a template for later use"
                    >
                      <Star className="w-5 h-5" />
                      SAVE AS DRAFT
                    </button>
                  </>
                )}
                <button
                  onClick={startBuiltWorkout}
                  disabled={customWorkoutDrills.length === 0}
                  className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
                    customWorkoutDrills.length > 0
                      ? 'bg-[#FF6B35] text-[#1a1a1a] hover:brightness-110'
                      : 'bg-[#2a2a2a] text-[#666] cursor-not-allowed'
                  }`}
                >
                  <Play className="w-5 h-5" />
                  {customWorkoutDrills.length > 0 
                    ? 'START NOW'
                    : 'ADD DRILLS TO START'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Date Detail Modal - Full Workout Management */}
      {showDateDetailModal && selectedDateForDetail && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-[#1a1a1a] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/30">
                  <CalendarDays className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#FF6B35] uppercase">
                    {selectedDateForDetail.toLocaleDateString('en-US', { weekday: 'long' })}
                  </h3>
                  <p className="text-[#888] text-sm">
                    {selectedDateForDetail.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDateDetailModal(false)}
                className="text-[#888] hover:text-white p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {(() => {
                const workouts = getWorkoutsForDate(selectedDateForDetail)
                const isPast = selectedDateForDetail < new Date(new Date().setHours(0, 0, 0, 0))
                const completedCount = workouts.filter(w => w.completed).length
                
                return (
                  <>
                    {/* Status Summary - Only show if there are actual workouts - ALL GREEN */}
                    {workouts.length > 0 && (
                      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {completedCount > 0 && completedCount === workouts.length ? (
                              <>
                                <Check className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-bold uppercase">ALL WORKOUTS COMPLETED</span>
                              </>
                            ) : (
                              <>
                                <CircleDot className="w-5 h-5 text-green-400" />
                                <span className="text-green-400 font-bold uppercase">{workouts.length} WORKOUT{workouts.length > 1 ? 'S' : ''} SCHEDULED</span>
                              </>
                            )}
                          </div>
                          <span className="text-xs text-[#888]">{completedCount}/{workouts.length} DONE</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Scheduled Workouts */}
                    {workouts.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="text-[#E5E5E5] font-bold uppercase text-sm flex items-center gap-2">
                          <Dumbbell className="w-4 h-4" />
                          SCHEDULED WORKOUTS
                        </h4>
                        
                        {workouts.map((scheduledWorkout, workoutIndex) => (
                          <div 
                            key={scheduledWorkout.id}
                            className={`rounded-xl overflow-hidden ${
                              scheduledWorkout.completed 
                                ? 'border-2 border-green-500/50 bg-green-500/5' 
                                : 'border-2 border-[#FF6B35] bg-[#1a1a1a]'
                            }`}
                          >
                            {/* Workout Header - Yellow/Gold header bar to distinguish */}
                            <div className={`p-3 flex items-center justify-between ${
                              scheduledWorkout.completed 
                                ? 'bg-green-500/20 border-b border-green-500/30' 
                                : 'bg-[#FF6B35]/20 border-b border-[#FF6B35]/30'
                            }`}>
                              <div className="flex items-center gap-3">
                                <span className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-black shadow-lg ${
                                  scheduledWorkout.completed 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-[#FF6B35] text-[#1a1a1a]'
                                }`}>
                                  {workoutIndex + 1}
                                </span>
                                <div>
                                  <h5 className={`font-black uppercase text-base ${
                                    scheduledWorkout.completed ? 'text-green-400' : 'text-[#FF6B35]'
                                  }`}>
                                    WORKOUT {workoutIndex + 1}: {scheduledWorkout.workout.name.toUpperCase()}
                                  </h5>
                                  <div className="flex items-center gap-2 text-xs text-[#888]">
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {scheduledWorkout.workout.duration} MIN
                                    </span>
                                    <span>•</span>
                                    <span>{scheduledWorkout.workout.exercises.length} DRILLS</span>
                                    {scheduledWorkout.completed && (
                                      <>
                                        <span>•</span>
                                        <span className="text-green-400 flex items-center gap-1 font-bold">
                                          <Check className="w-3 h-3" /> COMPLETED
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1">
                                {!scheduledWorkout.completed && !isPast && (
                                  <button
                                    onClick={() => {
                                      setShowDateDetailModal(false)
                                      startScheduledWorkout(scheduledWorkout)
                                    }}
                                    className="p-2 rounded-lg bg-[#FF6B35] text-[#1a1a1a] hover:brightness-110"
                                    title="Start Workout"
                                  >
                                    <Play className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteScheduledWorkout(scheduledWorkout.id)}
                                  className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
                                  title="Delete Workout"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                            
                            {/* Exercise List */}
                            <div className="p-3 space-y-2">
                              <p className="text-xs text-[#888] uppercase tracking-wider mb-2">DRILLS IN THIS WORKOUT: <span className="text-[#FF6B35]">(Click drill name for instructions)</span></p>
                              {scheduledWorkout.workout.exercises.map((exercise, exerciseIndex) => {
                                const drillKey = `${scheduledWorkout.id}-${exerciseIndex}`
                                const drillMedia = drillMediaMap[drillKey]
                                const isExpanded = drillMediaExpanded === drillKey
                                
                                return (
                                  <div 
                                    key={drillKey}
                                    className="bg-[#1a1a1a] rounded-lg border border-[#3a3a3a] overflow-hidden"
                                  >
                                    {/* Drill Header Row */}
                                    <div className="flex items-center justify-between p-2 group">
                                      <div 
                                        className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer hover:opacity-80"
                                        onClick={() => setSelectedDrillForExplanation(exercise)}
                                      >
                                        <span className="w-5 h-5 rounded-full bg-[#3a3a3a] text-[#888] flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                          {exerciseIndex + 1}
                                        </span>
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="text-[#E5E5E5] text-sm font-medium truncate uppercase hover:text-[#FF6B35] transition-colors">{exercise.name.toUpperCase()}</p>
                                            {/* Media indicator */}
                                            {drillMedia?.type === 'video' && <Video className="w-3 h-3 text-green-400" />}
                                            {drillMedia?.type === 'image' && <Camera className="w-3 h-3 text-blue-400" />}
                                            {drillMedia?.type === 'none' && <span className="text-[10px] text-[#666]">NO INPUT</span>}
                                            {drillMedia?.hasCoachFeedback && (
                                              <img src="/icons/coach-feedback.png" alt="Coach" className="w-4 h-4" style={{ filter: 'invert(1) brightness(2)' }} />
                                            )}
                                          </div>
                                          <p className="text-[#666] text-xs flex items-center gap-2">
                                            <span className="flex items-center gap-1">
                                              <Clock className="w-3 h-3" />
                                              {Math.ceil(exercise.duration / 60)} MIN
                                            </span>
                                            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase ${
                                              exercise.focusArea === 'elbow' ? 'bg-blue-500/20 text-blue-400' :
                                              exercise.focusArea === 'release' ? 'bg-green-500/20 text-green-400' :
                                              exercise.focusArea === 'follow-through' ? 'bg-purple-500/20 text-purple-400' :
                                              exercise.focusArea === 'balance' ? 'bg-orange-500/20 text-orange-400' :
                                              'bg-[#3a3a3a] text-[#888]'
                                            }`}>
                                              {exercise.focusArea.toUpperCase()}
                                            </span>
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        {/* Expand/Collapse Media Options Button */}
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setDrillMediaExpanded(isExpanded ? null : drillKey)
                                          }}
                                          className={`p-1.5 rounded transition-colors ${
                                            isExpanded 
                                              ? 'bg-[#FF6B35] text-[#1a1a1a]' 
                                              : 'bg-[#2a2a2a] text-[#888] hover:text-[#FF6B35] hover:bg-[#3a3a3a]'
                                          }`}
                                          title="Media Options"
                                        >
                                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </button>
                                        {!scheduledWorkout.completed && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              deleteExerciseFromWorkout(scheduledWorkout.id, exerciseIndex)
                                            }}
                                            className="p-1.5 rounded text-[#666] hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
                                            title="Remove Drill"
                                          >
                                            <X className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                    
                                    {/* Per-Drill Media Options Dropdown */}
                                    {isExpanded && (
                                      <div className="border-t border-[#3a3a3a] p-3 bg-[#2a2a2a]/50 space-y-2">
                                        <p className="text-xs text-[#888] uppercase tracking-wider mb-2">ADD MEDIA FOR THIS DRILL:</p>
                                        
                                        {/* Option 1: Record from Camera */}
                                        <button
                                          onClick={() => {
                                            // TODO: Implement camera recording for this drill
                                            alert('Camera recording coming soon! For now, please upload a video.')
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#FF6B35]/50 hover:bg-[#2a2a2a] transition-all text-left"
                                        >
                                          <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-red-400" />
                                          </div>
                                          <div>
                                            <p className="text-[#E5E5E5] font-medium text-sm">RECORD FROM CAMERA</p>
                                            <p className="text-[#666] text-xs">Record yourself doing this drill</p>
                                          </div>
                                        </button>
                                        
                                        {/* Option 2: Upload Video/Image */}
                                        <button
                                          onClick={() => {
                                            setCurrentDrillForUpload(drillKey)
                                            drillFileInputRef.current?.click()
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#FF6B35]/50 hover:bg-[#2a2a2a] transition-all text-left"
                                        >
                                          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                                            <Upload className="w-5 h-5 text-blue-400" />
                                          </div>
                                          <div>
                                            <p className="text-[#E5E5E5] font-medium text-sm">UPLOAD VIDEO OR IMAGE</p>
                                            <p className="text-[#666] text-xs">Upload a file from your device</p>
                                          </div>
                                        </button>
                                        
                                        {/* Option 3: No Input */}
                                        <button
                                          onClick={() => {
                                            setDrillMediaMap(prev => ({
                                              ...prev,
                                              [drillKey]: { type: 'none' }
                                            }))
                                            setDrillMediaExpanded(null)
                                          }}
                                          className="w-full flex items-center gap-3 p-3 rounded-lg bg-[#1a1a1a] border border-[#3a3a3a] hover:border-[#666] hover:bg-[#2a2a2a] transition-all text-left"
                                        >
                                          <div className="w-10 h-10 rounded-lg bg-[#3a3a3a] flex items-center justify-center">
                                            <X className="w-5 h-5 text-[#666]" />
                                          </div>
                                          <div>
                                            <p className="text-[#888] font-medium text-sm">NO INPUT - SKIP</p>
                                            <p className="text-[#666] text-xs">No coach feedback for this drill</p>
                                          </div>
                                        </button>
                                        
                                        {/* Show current media if exists */}
                                        {drillMedia?.type && drillMedia.type !== 'none' && drillMedia.url && (
                                          <div className="mt-3 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                {drillMedia.type === 'video' ? (
                                                  <Video className="w-4 h-4 text-green-400" />
                                                ) : (
                                                  <Camera className="w-4 h-4 text-green-400" />
                                                )}
                                                <span className="text-green-400 text-sm font-medium">
                                                  {drillMedia.type === 'video' ? 'Video' : 'Image'} uploaded
                                                </span>
                                              </div>
                                              <button
                                                onClick={() => {
                                                  // Clear the media
                                                  setDrillMediaMap(prev => {
                                                    const newMap = { ...prev }
                                                    delete newMap[drillKey]
                                                    return newMap
                                                  })
                                                }}
                                                className="text-red-400 text-xs hover:underline"
                                              >
                                                Remove
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )
                              })}
                              
                              {/* Add Drill Button */}
                              {!scheduledWorkout.completed && (
                                <button
                                  onClick={() => {
                                    // Add a random drill from available drills
                                    const newDrill = availableDrills[Math.floor(Math.random() * availableDrills.length)]
                                    if (newDrill) {
                                      addExerciseToWorkout(scheduledWorkout.id, newDrill)
                                    }
                                  }}
                                  className="w-full py-2 rounded-lg border border-dashed border-[#3a3a3a] text-[#888] hover:text-[#FF6B35] hover:border-[#FF6B35] transition-colors flex items-center justify-center gap-2 text-xs"
                                >
                                  <Plus className="w-3 h-3" />
                                  ADD DRILL
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* No Workouts Message */}
                    {workouts.length === 0 && (
                      <div className="text-center py-8">
                        <Dumbbell className="w-12 h-12 text-[#3a3a3a] mx-auto mb-3" />
                        <p className="text-[#888] text-sm">NO WORKOUTS SCHEDULED</p>
                        <p className="text-[#666] text-xs mt-1">Add a workout to this day to get started</p>
                      </div>
                    )}
                    
                    {/* Add Workout Button */}
                    {!isPast && (
                      <button
                        onClick={() => {
                          openAddWorkoutPicker(selectedDateForDetail)
                        }}
                        className="w-full py-3 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] border border-[#FF6B35]/30 font-bold hover:bg-[#FF6B35]/20 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        ADD {workouts.length > 0 ? 'ANOTHER ' : ''}WORKOUT TO THIS DAY
                      </button>
                    )}
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
      
      {/* Frequency Info Popup */}
      {showFrequencyPopup && (
        <FrequencyInfoPopup
          frequency={showFrequencyPopup}
          onClose={() => setShowFrequencyPopup(null)}
          onConfirm={confirmFrequency}
        />
      )}
      
      {/* Drill Count Info Popup */}
      {showDrillCountPopup && (
        <DrillCountInfoPopup
          drillCount={showDrillCountPopup}
          onClose={() => setShowDrillCountPopup(null)}
          onConfirm={confirmDrillCount}
        />
      )}
      
      {/* Duration Info Popup */}
      {showDurationPopup && (
        <DurationInfoPopup
          duration={showDurationPopup}
          frequency={preferences.frequency}
          onClose={() => setShowDurationPopup(null)}
          onConfirm={confirmDuration}
        />
      )}
      
      {/* Age Level Info Popup */}
      {showAgeLevelPopup && (
        <AgeLevelInfoPopup
          ageLevel={showAgeLevelPopup}
          onClose={() => setShowAgeLevelPopup(null)}
          onConfirm={confirmAgeLevel}
        />
      )}
      
      {/* Drill Explanation Popup */}
      {selectedDrillForExplanation && (
        <DrillExplanationPopup
          drill={selectedDrillForExplanation}
          onClose={() => setSelectedDrillForExplanation(null)}
        />
      )}
      
      {/* Add Workout Picker Modal */}
      {showAddWorkoutPicker && addWorkoutTargetDate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a1a] rounded-2xl border border-[#3a3a3a] w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">ADD WORKOUT</h3>
                <p className="text-[#888] text-sm">
                  {addWorkoutTargetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddWorkoutPicker(false)
                  setAddWorkoutTargetDate(null)
                }}
                className="p-2 rounded-full hover:bg-[#3a3a3a] text-[#888] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Saved/Draft Workouts Section */}
              {savedWorkouts.length > 0 && (
                <div>
                  <h4 className="text-[#FF6B35] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    YOUR SAVED WORKOUTS ({savedWorkouts.length})
                  </h4>
                  <div className="space-y-2">
                    {savedWorkouts.map((workout) => (
                      <div
                        key={workout.id}
                        className="bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#FF6B35]/50 transition-all cursor-pointer group"
                        onClick={() => addSavedWorkoutToDate(workout)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="text-white font-bold group-hover:text-[#FF6B35] transition-colors">
                            {workout.name}
                          </h5>
                          <div className="flex items-center gap-2">
                            <span className="text-[#888] text-xs bg-[#3a3a3a] px-2 py-1 rounded">
                              {workout.duration} min
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                deleteSavedWorkout(workout.id)
                              }}
                              className="p-1 rounded-full hover:bg-red-500/20 text-[#666] hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                              title="Delete saved workout"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {workout.exercises.slice(0, 4).map((ex, i) => (
                            <span key={i} className="text-[#888] text-xs bg-[#1a1a1a] px-2 py-0.5 rounded">
                              {ex.name}
                            </span>
                          ))}
                          {workout.exercises.length > 4 && (
                            <span className="text-[#666] text-xs px-2 py-0.5">
                              +{workout.exercises.length - 4} more
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-[#666]">
                          <Dumbbell className="w-3 h-3" />
                          {workout.exercises.length} drills
                          <span className="mx-1">•</span>
                          <Target className="w-3 h-3" />
                          {workout.focusAreas.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Create New Workout Section */}
              <div>
                <h4 className="text-[#888] font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  CREATE NEW WORKOUT
                </h4>
                <div className="space-y-2">
                  {/* Auto-Generate Option */}
                  <button
                    onClick={addNewGeneratedWorkout}
                    className="w-full bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#FF6B35]/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#FF4500]/20 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-bold group-hover:text-[#FF6B35] transition-colors">
                          AUTO-GENERATE WORKOUT
                        </h5>
                        <p className="text-[#888] text-xs">
                          Create a {preferences.preferredDuration}-min workout with {preferences.drillCount} drills based on your settings
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#888] group-hover:text-[#FF6B35] transition-colors" />
                    </div>
                  </button>
                  
                  {/* Custom Build Option */}
                  <button
                    onClick={openWorkoutBuilderForDate}
                    className="w-full bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#FF6B35]/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        <Layers className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-bold group-hover:text-[#FF6B35] transition-colors">
                          BUILD CUSTOM WORKOUT
                        </h5>
                        <p className="text-[#888] text-xs">
                          Pick your own drills and create a personalized workout
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#888] group-hover:text-[#FF6B35] transition-colors" />
                    </div>
                  </button>
                  
                  {/* Quick Pick Drills Option */}
                  <button
                    onClick={() => {
                      setShowAddWorkoutPicker(false)
                      setShowDateDetailModal(false) // Close the date detail modal
                      setShowWorkoutBuilder(true) // Open the workout builder with drill pool
                    }}
                    className="w-full bg-[#2a2a2a] rounded-xl p-4 border border-[#3a3a3a] hover:border-[#FF6B35]/50 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <Target className="w-5 h-5 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h5 className="text-white font-bold group-hover:text-[#FF6B35] transition-colors">
                          QUICK PICK DRILLS
                        </h5>
                        <p className="text-[#888] text-xs">
                          Browse and select individual drills to add
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#888] group-hover:text-[#FF6B35] transition-colors" />
                    </div>
                  </button>
                </div>
              </div>
              
              {/* No Saved Workouts Message */}
              {savedWorkouts.length === 0 && (
                <div className="bg-[#2a2a2a]/50 rounded-xl p-4 border border-dashed border-[#3a3a3a]">
                  <div className="text-center">
                    <Star className="w-8 h-8 text-[#3a3a3a] mx-auto mb-2" />
                    <p className="text-[#888] text-sm font-medium">No Saved Workouts Yet</p>
                    <p className="text-[#666] text-xs mt-1">
                      Create a workout and save it as a template for quick reuse
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#3a3a3a] bg-[#1a1a1a]">
              <button
                onClick={() => {
                  setShowAddWorkoutPicker(false)
                  setAddWorkoutTargetDate(null)
                }}
                className="w-full py-3 rounded-xl text-[#888] hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

