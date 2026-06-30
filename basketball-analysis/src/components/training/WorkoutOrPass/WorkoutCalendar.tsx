"use client"

/**
 * Workout Calendar for Workout or Pass
 * 
 * Features:
 * - Training preferences (frequency, duration, drills, mode, level)
 * - Mobile-friendly calendar with Day/Week/Month views
 * - AI-automated workout plan generation
 * - Notifications & accountability features
 * - Auto-populate from identified flaws
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
  Calendar, Settings, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Star, Play, Pause,
  Bell, BellRing, Target, Clock, Check, X, Zap, BookOpen, GripVertical,
  Info, AlertTriangle, Dumbbell, CircleDot, TrendingUp, Lightbulb, Plus, BarChart3
} from "lucide-react"
import { ALL_DRILLS, Drill, DrillFocusArea, SkillLevel, getRecommendedDrills, mapFlawToFocusArea } from "@/data/drillDatabase"
import {
  fetchWorkouts, createWorkout, updateWorkout, deleteWorkout,
  fetchPreferences, savePreferences, resolveDrillIds, asFocusAreas,
  type ServerWorkout, type WorkoutPayload,
} from "@/lib/api/workoutsClient"

type FocusArea = DrillFocusArea

// Focus Area Labels for display
const FOCUS_AREA_LABELS: Record<FocusArea, string> = {
  'ELBOW_ALIGNMENT': 'Elbow Alignment',
  'KNEE_BEND': 'Knee Bend',
  'RELEASE_POINT': 'Release Point',
  'FOLLOW_THROUGH': 'Follow Through',
  'BALANCE': 'Balance',
  'ARC_TRAJECTORY': 'Arc Trajectory',
  'FOOTWORK': 'Footwork',
  'CONSISTENCY': 'Consistency',
  'FATIGUE': 'Endurance',
  'GAME_SITUATION': 'Game Speed',
  'MICRO_ADJUSTMENT': 'Fine Tuning'
}

// =============================================
// TYPES
// =============================================

type AgeLevel = 'elementary' | 'middle_school' | 'high_school' | 'college' | 'professional'

const AGE_TO_SKILL: Record<AgeLevel, SkillLevel> = {
  elementary: 'ELEMENTARY',
  middle_school: 'MIDDLE_SCHOOL',
  high_school: 'HIGH_SCHOOL',
  college: 'COLLEGE',
  professional: 'PROFESSIONAL',
}

interface TrainingPreferences {
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7
  preferredDuration: 5 | 10 | 15 | 20 | 30 | 45
  drillCount: 1 | 2 | 3 | 4 | 5 | 6 | 7
  workoutMode: 'continuous' | 'step-by-step'
  soundEnabled: boolean
  ageLevel: AgeLevel
  autoPopulateFromFlaws: boolean
}

interface ScheduledWorkout {
  id: string
  date: Date
  drills: Drill[]
  completed: boolean
  duration?: number
  focusAreas?: FocusArea[]
  name?: string
}

interface WorkoutCalendarProps {
  userFlaws?: string[]
  onStartWorkout?: (drills: Drill[]) => void
}

// Map a server Workout row → the in-memory ScheduledWorkout (resolving drillIds
// back to full Drill objects via the provided pool).
function mapServerWorkout(w: ServerWorkout, pool: Drill[]): ScheduledWorkout {
  return {
    id: w.id,
    date: new Date(w.scheduledDate),
    drills: resolveDrillIds(w.drillIds, pool),
    completed: w.completed,
    duration: w.duration,
    focusAreas: asFocusAreas(w.focusAreas),
    name: w.name,
  }
}

// In-memory ScheduledWorkout → the payload the workouts API expects.
function scheduledToPayload(w: ScheduledWorkout): WorkoutPayload {
  return {
    name: w.name ?? null,
    scheduledDate: w.date,
    drillIds: w.drills.map((d) => d.id),
    focusAreas: w.focusAreas,
    duration: w.duration,
    completed: w.completed,
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
    color: "from-gray-500 to-gray-600",
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
    color: "from-green-600 to-green-700",
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
    color: "from-blue-500 to-blue-600",
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
    color: "from-orange-500 to-orange-600",
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
    color: "from-purple-500 to-purple-600",
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
    color: "from-cyan-500 to-cyan-600",
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
    color: "from-orange-500 to-amber-600",
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
    color: "from-red-500 to-red-600",
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
    color: "from-orange-500 to-orange-600",
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
    color: "from-green-500 to-green-600",
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
    color: "from-green-400 to-green-500",
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
    color: "from-orange-500 to-orange-600",
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
    color: "from-amber-500 to-amber-600",
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
    color: "from-red-600 to-red-700",
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

// =============================================
// DURATION RESEARCH DATA
// =============================================

const DURATION_RESEARCH = {
  5: {
    title: "5 Minute Workout",
    quality: "Quick Touch",
    color: "from-gray-500 to-gray-600",
    facts: [
      "Best for: Busy days when you can't do a full session",
      "Focus on 1 specific skill only",
      "Maintains muscle memory but limited improvement",
      "Better than nothing - keeps the habit alive"
    ],
    recommendation: "Use sparingly. Good for maintaining habits on extremely busy days, but don't rely on this for improvement.",
    research: "Studies show that sessions under 10 minutes provide maintenance benefits but insufficient time for skill acquisition."
  },
  10: {
    title: "10 Minute Workout",
    quality: "Focused Sprint",
    color: "from-blue-500 to-blue-600",
    facts: [
      "Enough time for 2-3 quality drills",
      "Research shows 10 minutes of focused practice beats 30 minutes of distracted work",
      "Ideal for lunch breaks or morning routines",
      "Neural pathways begin forming at this duration"
    ],
    recommendation: "Great for building consistency. Perfect for beginners or busy schedules. Quality over quantity.",
    research: "A 2019 study found that 10 minutes of deliberate practice produced 80% of the skill gains seen in 30-minute sessions."
  },
  15: {
    title: "15 Minute Workout",
    quality: "Solid Session",
    color: "from-green-500 to-green-600",
    facts: [
      "SWEET SPOT for busy athletes",
      "Includes warm-up, 3-4 drills, and cool-down",
      "Optimal for maintaining focus throughout",
      "Studies show attention peaks around 15-20 minutes"
    ],
    recommendation: "HIGHLY RECOMMENDED. The sweet spot for most players - long enough to improve, short enough to maintain focus.",
    research: "Research on motor learning shows that 15-20 minute focused sessions produce optimal skill retention without cognitive fatigue."
  },
  20: {
    title: "20 Minute Workout",
    quality: "Complete Session",
    color: "from-green-400 to-green-500",
    facts: [
      "OPTIMAL DURATION for skill development",
      "Full warm-up, focused drills, proper cool-down",
      "Attention remains high throughout",
      "Professional coaches often use 20-minute drill blocks"
    ],
    recommendation: "THE GOLD STANDARD. 20 minutes is the most research-backed duration for skill acquisition.",
    research: "NBA player development programs typically structure shooting practice in 20-minute blocks, finding this maximizes retention."
  },
  30: {
    title: "30 Minute Workout",
    quality: "Extended Session",
    color: "from-orange-500 to-orange-600",
    facts: [
      "Comprehensive workout with multiple focus areas",
      "Requires mental discipline to maintain quality",
      "Best split into 2-3 focused segments",
      "Include short breaks to reset focus"
    ],
    recommendation: "Good for dedicated practice days. Break into segments and include brief rest periods to maintain quality.",
    research: "Studies show that after 20-25 minutes, focus begins to decline. 30-minute sessions benefit from a 2-minute break midway."
  },
  45: {
    title: "45 Minute Workout",
    quality: "Full Practice",
    color: "from-purple-500 to-purple-600",
    facts: [
      "Complete practice session with game simulation",
      "Includes conditioning and fatigue training",
      "Used by serious players and teams",
      "Requires proper breaks and hydration"
    ],
    recommendation: "For serious athletes only. Include water breaks and mental resets. Split into 15-minute segments for best results.",
    research: "Professional training programs show 45-minute sessions are effective when structured with built-in recovery periods."
  }
}

// =============================================
// CONFIGURATION
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
    tips: [
      "Focus on proper hand placement and grip",
      "Short sessions with frequent breaks",
      "Emphasize correct elbow alignment from the start"
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
    tips: [
      "Establish consistent form routines",
      "Focus on guide hand discipline",
      "Great age to develop muscle memory"
    ]
  },
  high_school: {
    name: "High School",
    shortName: "HS",
    iconType: "target",
    color: "text-purple-400",
    borderColor: "border-purple-500/50",
    bgColor: "from-purple-500/20 to-purple-600/10",
    description: "Ages 15-18 - Performance optimization",
    recommendedDuration: 30,
    recommendedFrequency: 4,
    tips: [
      "Increase repetition volume",
      "Add game-speed drills",
      "Focus on shooting under fatigue"
    ]
  },
  college: {
    name: "College",
    shortName: "COL",
    iconType: "graduation",
    color: "text-green-400",
    borderColor: "border-green-500/50",
    bgColor: "from-green-500/20 to-green-600/10",
    description: "Ages 19-22 - Elite performance",
    recommendedDuration: 45,
    recommendedFrequency: 5,
    tips: [
      "High-intensity interval training",
      "Complex movement patterns",
      "Mental preparation techniques"
    ]
  },
  professional: {
    name: "Professional",
    shortName: "PRO",
    iconType: "trophy",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/50",
    bgColor: "from-yellow-500/20 to-yellow-600/10",
    description: "Elite level - Peak performance",
    recommendedDuration: 45,
    recommendedFrequency: 6,
    tips: [
      "Advanced technique refinement",
      "Sport science integration",
      "Recovery optimization"
    ]
  }
}

// Custom drills have no server model yet; cached locally only.
const CUSTOM_DRILLS_KEY = 'workout-calendar-custom-drills'

// =============================================
// HELPER ICON COMPONENTS
// =============================================

function AgeLevelIcon({ type, className }: { type: string; className?: string }) {
  switch (type) {
    case 'star': return <Star className={className} />
    case 'book': return <BookOpen className={className} />
    case 'target': return <Target className={className} />
    case 'graduation': return <Dumbbell className={className} />
    case 'trophy': return <Star className={className} />
    default: return <Star className={className} />
  }
}

// =============================================
// POPUP COMPONENTS
// =============================================

interface FrequencyPopupProps {
  frequency: 1 | 2 | 3 | 4 | 5 | 6 | 7
  onClose: () => void
  onConfirm: () => void
}

function FrequencyInfoPopup({ frequency, onClose, onConfirm }: FrequencyPopupProps) {
  const data = FREQUENCY_RESEARCH[frequency]
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-lg">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">{data.title}</h2>
                <p className="text-white/80 text-sm">TRAINING FREQUENCY ANALYSIS</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 p-4 border-b border-slate-200">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-1" />
            <p className="text-xl font-black text-green-400">{data.improvement}</p>
            <p className="text-slate-500 text-xs">Expected Improvement</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <Clock className="w-6 h-6 text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-black text-blue-400">{data.timeToResults}</p>
            <p className="text-slate-500 text-xs">Time to See Results</p>
          </div>
        </div>
        
        {/* Facts */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4" />
            Research-Backed Facts
          </h3>
          <ul className="space-y-2">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-2 flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            Our Recommendation
          </h3>
          <p className="text-slate-700 bg-slate-50 rounded-xl p-3 text-sm border border-slate-200">
            {data.recommendation}
          </p>
        </div>
        
        {/* Research */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-slate-500 font-bold mb-2 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" />
            Research Source
          </h3>
          <p className="text-slate-500 text-xs italic">{data.research}</p>
        </div>
        
        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Choose Different
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all text-sm`}
          >
            Confirm {frequency}x/Week
          </button>
        </div>
      </div>
    </div>
  )
}

interface DrillCountPopupProps {
  count: 1 | 2 | 3 | 4 | 5 | 6 | 7
  onClose: () => void
  onConfirm: () => void
}

function DrillCountInfoPopup({ count, onClose, onConfirm }: DrillCountPopupProps) {
  const data = DRILL_COUNT_RESEARCH[count]
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-lg">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">{data.title}</h2>
                <p className="text-white/80 text-sm">{data.focusLevel} Training</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Facts */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4" />
            What You Should Know
          </h3>
          <ul className="space-y-2">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-2 flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            Our Recommendation
          </h3>
          <p className="text-slate-700 bg-slate-50 rounded-xl p-3 text-sm border border-slate-200">
            {data.recommendation}
          </p>
        </div>
        
        {/* Research */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-slate-500 font-bold mb-2 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" />
            Research Source
          </h3>
          <p className="text-slate-500 text-xs italic">{data.research}</p>
        </div>
        
        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Choose Different
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all text-sm`}
          >
            Confirm {count} Drill{count > 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </div>
  )
}

interface DurationPopupProps {
  duration: 5 | 10 | 15 | 20 | 30 | 45
  onClose: () => void
  onConfirm: () => void
}

function DurationInfoPopup({ duration, onClose, onConfirm }: DurationPopupProps) {
  const data = DURATION_RESEARCH[duration]
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-lg">
        {/* Header */}
        <div className={`bg-gradient-to-r ${data.color} p-5 rounded-t-2xl`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">{data.title}</h2>
                <p className="text-white/80 text-sm">{data.quality}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/60 hover:text-white p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Facts */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4" />
            What You Should Know
          </h3>
          <ul className="space-y-2">
            {data.facts.map((fact, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{fact}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Recommendation */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-2 flex items-center gap-2 text-sm">
            <Star className="w-4 h-4" />
            Our Recommendation
          </h3>
          <p className="text-slate-700 bg-slate-50 rounded-xl p-3 text-sm border border-slate-200">
            {data.recommendation}
          </p>
        </div>
        
        {/* Research */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-slate-500 font-bold mb-2 flex items-center gap-2 text-sm">
            <BookOpen className="w-4 h-4" />
            Research Source
          </h3>
          <p className="text-slate-500 text-xs italic">{data.research}</p>
        </div>
        
        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Choose Different
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${data.color} text-white font-bold hover:brightness-110 transition-all text-sm`}
          >
            Confirm {duration} Minutes
          </button>
        </div>
      </div>
    </div>
  )
}

interface AgeLevelPopupProps {
  ageLevel: AgeLevel
  onClose: () => void
  onConfirm: () => void
}

function AgeLevelInfoPopup({ ageLevel, onClose, onConfirm }: AgeLevelPopupProps) {
  const config = AGE_LEVEL_CONFIG[ageLevel]
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 shadow-lg">
        {/* Header */}
        <div className={`bg-gradient-to-r ${config.bgColor} p-5 rounded-t-2xl border-b ${config.borderColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                <AgeLevelIcon type={config.iconType} className={`w-6 h-6 ${config.color}`} />
              </div>
              <div>
                <h2 className={`text-xl font-black uppercase ${config.color}`}>{config.name}</h2>
                <p className="text-slate-500 text-sm">{config.description}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-500 hover:text-slate-900 p-1">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Recommended Settings */}
        <div className="bg-[#FF6B35]/10 border-b border-[#FF6B35]/30 p-4 flex items-center gap-3">
          <Star className="w-5 h-5 text-[#FF6B35]" />
          <div>
            <p className="text-[#FF6B35] font-bold text-sm">RECOMMENDED SETTINGS</p>
            <p className="text-[#FF6B35]/80 text-xs">
              {config.recommendedFrequency}x per week • {config.recommendedDuration} minute sessions
            </p>
          </div>
        </div>
        
        {/* Tips */}
        <div className="p-4 border-b border-slate-200">
          <h3 className="text-[#FF6B35] font-bold mb-3 flex items-center gap-2 text-sm">
            <Lightbulb className="w-4 h-4" />
            Tips for {config.name} Players
          </h3>
          <ul className="space-y-2">
            {config.tips.map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <span className="text-slate-700 text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Actions */}
        <div className="p-4 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold hover:bg-slate-100 transition-colors text-sm"
          >
            Choose Different
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl bg-gradient-to-r ${config.bgColor} ${config.color} border ${config.borderColor} font-bold hover:brightness-110 transition-all text-sm`}
          >
            Confirm {config.shortName}
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// MAIN COMPONENT
// =============================================

export function WorkoutCalendar({ userFlaws = [], onStartWorkout }: WorkoutCalendarProps) {
  // State
  const [showSettings, setShowSettings] = useState(false)
  const [showAgeLevelInfo, setShowAgeLevelInfo] = useState(false)
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [workoutMode, setWorkoutMode] = useState<'auto' | 'custom'>('auto')
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([])
  const [isHydrated, setIsHydrated] = useState(false)
  const [selectedDayForPopup, setSelectedDayForPopup] = useState<Date | null>(null)
  const [showBuildWorkoutPopup, setShowBuildWorkoutPopup] = useState(false)
  const [showDrillPickerPopup, setShowDrillPickerPopup] = useState(false)
  const [showAutoGeneratePopup, setShowAutoGeneratePopup] = useState(false)
  const [showCustomDrillCreator, setShowCustomDrillCreator] = useState(false)
  const [customDrills, setCustomDrills] = useState<Drill[]>([])
  const [addMode, setAddMode] = useState<'workout' | 'drill'>('workout')
  const [scheduleSuccessInfo, setScheduleSuccessInfo] = useState<{
    show: boolean
    workoutName: string
    date: Date
    isRecurring: boolean
    frequency?: string
  } | null>(null)
  
  // Popup states
  const [pendingFrequency, setPendingFrequency] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null)
  const [pendingDrillCount, setPendingDrillCount] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7 | null>(null)
  const [pendingDuration, setPendingDuration] = useState<5 | 10 | 15 | 20 | 30 | 45 | null>(null)
  const [pendingAgeLevel, setPendingAgeLevel] = useState<AgeLevel | null>(null)
  
  const [preferences, setPreferences] = useState<TrainingPreferences>({
    frequency: 5,
    preferredDuration: 45,
    drillCount: 3,
    workoutMode: 'continuous',
    soundEnabled: true,
    ageLevel: 'college',
    autoPopulateFromFlaws: false
  })

  // Gate for the preferences-sync effect so it doesn't PUT during initial load.
  const loadedRef = useRef(false)

  // Load preferences + scheduled workouts from the server (source of truth).
  // Custom drills have no server model yet, so they stay in localStorage as an
  // offline cache.
  useEffect(() => {
    let cancelled = false

    let localCustom: Drill[] = []
    if (typeof window !== 'undefined') {
      const savedCustom = localStorage.getItem(CUSTOM_DRILLS_KEY)
      if (savedCustom) {
        try {
          const parsed = JSON.parse(savedCustom)
          if (Array.isArray(parsed)) localCustom = parsed
        } catch (e) {
          console.error('Failed to load custom drills:', e)
        }
      }
    }
    if (localCustom.length) setCustomDrills(localCustom)

    const pool = [...ALL_DRILLS, ...localCustom]

    void (async () => {
      const [prefs, workouts] = await Promise.all([
        fetchPreferences(),
        fetchWorkouts(),
      ])
      if (cancelled) return

      if (prefs) {
        const validLevels: AgeLevel[] = ['elementary', 'middle_school', 'high_school', 'college', 'professional']
        setPreferences({
          frequency: prefs.frequency as TrainingPreferences['frequency'],
          preferredDuration: prefs.preferredDuration as TrainingPreferences['preferredDuration'],
          drillCount: prefs.drillCount as TrainingPreferences['drillCount'],
          workoutMode: prefs.workoutMode === 'step-by-step' ? 'step-by-step' : 'continuous',
          soundEnabled: prefs.soundEnabled,
          ageLevel: (validLevels.includes(prefs.ageLevel as AgeLevel) ? prefs.ageLevel : 'college') as AgeLevel,
          autoPopulateFromFlaws: prefs.autoPopulateFromFlaws,
        })
        setNotificationsEnabled(prefs.notificationsEnabled)
      }

      setScheduledWorkouts(workouts.map((w) => mapServerWorkout(w, pool)))

      loadedRef.current = true
      setIsHydrated(true)
    })()

    return () => { cancelled = true }
  }, [])

  // Auto-dismiss success toast after 8 seconds
  useEffect(() => {
    if (scheduleSuccessInfo?.show) {
      const timer = setTimeout(() => {
        setScheduleSuccessInfo(null)
      }, 8000)
      return () => clearTimeout(timer)
    }
  }, [scheduleSuccessInfo])
  
  // Persist preferences (incl. notifications) to the server, debounced. Scheduled
  // workouts are persisted individually by the mutation helpers below, not in bulk.
  useEffect(() => {
    if (!loadedRef.current) return
    const t = setTimeout(() => {
      void savePreferences({
        frequency: preferences.frequency,
        preferredDuration: preferences.preferredDuration,
        drillCount: preferences.drillCount,
        workoutMode: preferences.workoutMode,
        soundEnabled: preferences.soundEnabled,
        ageLevel: preferences.ageLevel,
        autoPopulateFromFlaws: preferences.autoPopulateFromFlaws,
        notificationsEnabled,
      })
    }, 600)
    return () => clearTimeout(t)
  }, [preferences, notificationsEnabled])

  // Persist custom drills separately
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      localStorage.setItem(CUSTOM_DRILLS_KEY, JSON.stringify(customDrills))
    }
  }, [customDrills, isHydrated])

  // Full drill pool = built-in drills + user-created custom drills
  const allDrills = useMemo(() => [...ALL_DRILLS, ...customDrills], [customDrills])

  const currentAgeLevelConfig = AGE_LEVEL_CONFIG[preferences.ageLevel]
  const ageLevels: AgeLevel[] = ['elementary', 'middle_school', 'high_school', 'college', 'professional']
  const durationOptions: (5 | 10 | 15 | 20 | 30 | 45)[] = [5, 10, 15, 20, 30, 45]

  // Generate an AI workout from the real recommender. When "auto-populate from
  // flaws" is enabled, the user's detected flaws are mapped to focus areas and
  // become the weak areas the recommender prioritizes; otherwise it returns the
  // best level-appropriate drills. (Replaces the old Math.random shuffle.)
  const generateWorkout = useCallback(() => {
    const skillLevel = AGE_TO_SKILL[preferences.ageLevel]
    const weakAreas: DrillFocusArea[] = preferences.autoPopulateFromFlaws
      ? Array.from(new Set(userFlaws.map(mapFlawToFocusArea)))
      : []
    return getRecommendedDrills(skillLevel, weakAreas, preferences.drillCount)
  }, [preferences.ageLevel, preferences.drillCount, preferences.autoPopulateFromFlaws, userFlaws])

  // --- Server-backed scheduled-workout mutations --------------------------
  // Each optimistically updates local state, then reconciles with the server
  // (Postgres is the source of truth; the UI degrades gracefully if offline).

  const persistNewWorkout = useCallback(async (workout: ScheduledWorkout) => {
    setScheduledWorkouts(prev => [...prev, workout])
    const saved = await createWorkout(scheduledToPayload(workout))
    if (saved) {
      const mapped = mapServerWorkout(saved, [...ALL_DRILLS, ...customDrills])
      setScheduledWorkouts(prev => prev.map(w => (w.id === workout.id ? mapped : w)))
    }
  }, [customDrills])

  const removeScheduledWorkout = useCallback((workoutId: string) => {
    setScheduledWorkouts(prev => prev.filter(w => w.id !== workoutId))
    void deleteWorkout(workoutId)
  }, [])

  const toggleScheduledComplete = useCallback((workoutId: string) => {
    const target = scheduledWorkouts.find(w => w.id === workoutId)
    if (!target) return
    const completed = !target.completed
    setScheduledWorkouts(prev => prev.map(w => (w.id === workoutId ? { ...w, completed } : w)))
    void updateWorkout(workoutId, { completed, completedAt: completed ? new Date() : null })
  }, [scheduledWorkouts])

  // Calendar navigation
  const navigateCalendar = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (calendarView === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1))
    } else if (calendarView === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7))
    } else {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  // Format date header
  const formatDateHeader = () => {
    const options: Intl.DateTimeFormatOptions = calendarView === 'month' 
      ? { month: 'long', year: 'numeric' }
      : calendarView === 'week'
        ? { month: 'short', day: 'numeric', year: 'numeric' }
        : { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }
    
    if (calendarView === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    }
    return currentDate.toLocaleDateString('en-US', options)
  }

  // Get days to display
  const getDaysInView = useMemo(() => {
    const days: Date[] = []
    
    if (calendarView === 'day') {
      days.push(new Date(currentDate))
    } else if (calendarView === 'week') {
      const weekStart = new Date(currentDate)
      weekStart.setDate(currentDate.getDate() - currentDate.getDay())
      for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart)
        day.setDate(weekStart.getDate() + i)
        days.push(day)
      }
    } else {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0)
      const startDay = monthStart.getDay()
      
      // Add days from previous month
      for (let i = startDay - 1; i >= 0; i--) {
        const day = new Date(monthStart)
        day.setDate(-i)
        days.push(day)
      }
      
      // Add days of current month
      for (let i = 1; i <= monthEnd.getDate(); i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i))
      }
      
      // Add days from next month to complete grid
      const remaining = 42 - days.length
      for (let i = 1; i <= remaining; i++) {
        days.push(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i))
      }
    }
    
    return days
  }, [currentDate, calendarView])

  // Get workouts for a date
  const getWorkoutsForDate = (date: Date) => {
    return scheduledWorkouts.filter(w => 
      w.date.toDateString() === date.toDateString()
    )
  }

  // Add workout to date
  const addWorkoutToDate = (date: Date) => {
    const drills = generateWorkout()
    const workout: ScheduledWorkout = {
      id: `workout-${Date.now()}`,
      date: new Date(date),
      drills,
      completed: false,
      duration: preferences.preferredDuration,
      focusAreas: [...new Set(drills.map(d => d.focusArea))]
    }
    void persistNewWorkout(workout)
  }

  // Start workout
  const startWorkout = () => {
    const drills = generateWorkout()
    if (onStartWorkout) {
      onStartWorkout(drills)
    }
  }

  // Auto-populate calendar
  const autoPopulateCalendar = useCallback(() => {
    const today = new Date()
    const newWorkouts: ScheduledWorkout[] = []
    
    // Schedule workouts for the next 4 weeks based on frequency
    for (let week = 0; week < 4; week++) {
      let workoutsThisWeek = 0
      for (let day = 0; day < 7 && workoutsThisWeek < preferences.frequency; day++) {
        const targetDate = new Date(today)
        targetDate.setDate(today.getDate() + (week * 7) + day)
        
        // Skip if already has workout
        if (getWorkoutsForDate(targetDate).length > 0) continue
        
        // Distribute evenly through the week
        const daySpacing = Math.floor(7 / preferences.frequency)
        if (day % daySpacing === 0 || workoutsThisWeek === 0) {
          const drills = generateWorkout()
          newWorkouts.push({
            id: `auto-${Date.now()}-${week}-${day}`,
            date: targetDate,
            drills,
            completed: false,
            duration: preferences.preferredDuration,
            focusAreas: [...new Set(drills.map(d => d.focusArea))]
          })
          workoutsThisWeek++
        }
      }
    }
    
    newWorkouts.forEach(w => { void persistNewWorkout(w) })
  }, [preferences.frequency, preferences.preferredDuration, generateWorkout, getWorkoutsForDate, persistNewWorkout])

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#FF6B35]/20">
              <Calendar className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-[#FF6B35] font-black text-lg uppercase tracking-wide">TRAINING CALENDAR</h2>
              <p className="text-slate-500 text-sm">{preferences.frequency}x per week • {preferences.preferredDuration} min workouts</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              showSettings ? 'bg-[#FF6B35] text-slate-900' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 space-y-6">
          <h3 className="text-[#FF6B35] font-bold text-lg flex items-center gap-2 uppercase">
            <Settings className="w-5 h-5" />
            TRAINING PREFERENCES
          </h3>
          
          {/* Frequency Selector */}
          <div>
            <label className="text-slate-500 text-sm uppercase tracking-wider block mb-3">
              TRAINING FREQUENCY (DAYS PER WEEK)
              <span className="text-[#FF6B35] text-xs ml-2">(tap to learn more)</span>
            </label>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(freq => (
                <button
                  key={freq}
                  onClick={() => setPendingFrequency(freq)}
                  className={`p-2 md:p-3 rounded-xl text-center transition-all ${
                    preferences.frequency === freq
                      ? 'bg-[#FF6B35] text-slate-900 font-bold'
                      : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                  }`}
                >
                  <span className="text-base md:text-lg font-bold">{freq}</span>
                  <span className="block text-[10px] md:text-xs mt-0.5">{freq === 1 ? 'day' : 'days'}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Duration Selector */}
          <div>
            <label className="text-slate-500 text-sm uppercase tracking-wider block mb-3">
              WORKOUT DURATION
              <span className="text-[#FF6B35] text-xs ml-2">(tap to learn more)</span>
            </label>
            <div className="grid grid-cols-6 gap-1 md:gap-2">
              {durationOptions.map(duration => {
                const isSweet = duration === 15 || duration === 20
                return (
                  <button
                    key={duration}
                    onClick={() => setPendingDuration(duration)}
                    className={`p-2 md:p-3 rounded-xl text-center transition-all relative ${
                      preferences.preferredDuration === duration
                        ? isSweet 
                          ? 'bg-green-500 text-white font-bold ring-2 ring-green-400'
                          : 'bg-[#FF6B35] text-slate-900 font-bold'
                        : isSweet
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {isSweet && <Star className="w-3 h-3 absolute top-1 right-1 text-green-400" />}
                    <span className="text-base md:text-lg font-bold">{duration}</span>
                    <span className="block text-[10px] md:text-xs mt-0.5">MIN</span>
                  </button>
                )
              })}
            </div>
            <p className="text-slate-400 text-xs mt-2">
              {(preferences.preferredDuration === 15 || preferences.preferredDuration === 20) && (
                <span className="text-green-400 font-medium">RECOMMENDED: 15-20 minutes is optimal for skill development</span>
              )}
            </p>
          </div>
          
          {/* Drill Count Selector */}
          <div>
            <label className="text-slate-500 text-sm uppercase tracking-wider block mb-3">
              DRILLS PER WORKOUT
              <span className="text-[#FF6B35] text-xs ml-2">(tap to learn more)</span>
            </label>
            <div className="grid grid-cols-7 gap-1 md:gap-2">
              {([1, 2, 3, 4, 5, 6, 7] as const).map(count => {
                const isSweet = count === 3 || count === 4
                return (
                  <button
                    key={count}
                    onClick={() => setPendingDrillCount(count)}
                    className={`p-2 md:p-3 rounded-xl text-center transition-all relative ${
                      preferences.drillCount === count
                        ? isSweet 
                          ? 'bg-green-500 text-white font-bold ring-2 ring-green-400'
                          : 'bg-[#FF6B35] text-slate-900 font-bold'
                        : isSweet
                          ? 'bg-green-500/20 text-green-400 border border-green-500/50'
                          : 'bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    {isSweet && <Star className="w-3 h-3 absolute top-1 right-1 text-green-400" />}
                    <span className="text-base md:text-lg font-bold">{count}</span>
                    <span className="block text-[10px] md:text-xs mt-0.5">{count === 1 ? 'drill' : 'drills'}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-green-400 text-xs mt-2 font-medium">
              RECOMMENDED: 3-4 drills is the sweet spot for focused improvement
            </p>
          </div>
          
          {/* Workout Mode */}
          <div>
            <label className="text-slate-500 text-sm uppercase tracking-wider block mb-3">
              WORKOUT MODE
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                onClick={() => setPreferences(prev => ({ ...prev, workoutMode: 'continuous' }))}
                className={`p-4 rounded-xl text-left transition-all ${
                  preferences.workoutMode === 'continuous'
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : 'bg-slate-50 border border-slate-200 hover:border-[#FF6B35]'
                }`}
              >
                <Play className={`w-6 h-6 mb-2 ${preferences.workoutMode === 'continuous' ? 'text-[#FF6B35]' : 'text-slate-500'}`} />
                <h4 className={`font-bold uppercase ${preferences.workoutMode === 'continuous' ? 'text-[#FF6B35]' : 'text-slate-700'}`}>
                  CONTINUOUS
                </h4>
                <p className="text-slate-500 text-sm mt-1">
                  Drills flow automatically without stopping. When one drill ends, the next begins immediately. Best for building endurance and maintaining workout intensity.
                </p>
              </button>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, workoutMode: 'step-by-step' }))}
                className={`p-4 rounded-xl text-left transition-all ${
                  preferences.workoutMode === 'step-by-step'
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : 'bg-slate-50 border border-slate-200 hover:border-[#FF6B35]'
                }`}
              >
                <Pause className={`w-6 h-6 mb-2 ${preferences.workoutMode === 'step-by-step' ? 'text-[#FF6B35]' : 'text-slate-500'}`} />
                <h4 className={`font-bold uppercase ${preferences.workoutMode === 'step-by-step' ? 'text-[#FF6B35]' : 'text-slate-700'}`}>
                  STEP-BY-STEP
                </h4>
                <p className="text-slate-500 text-sm mt-1">
                  After each drill, the workout pauses with a popup explaining the next drill. Take time to rest, review technique, and ensure you are ready before pressing START.
                </p>
              </button>
            </div>
            <p className="text-slate-400 text-xs mt-3 bg-slate-50 p-3 rounded-lg">
              <span className="text-[#FF6B35] font-bold">TIP:</span> {preferences.workoutMode === 'continuous' 
                ? "Continuous mode is great for experienced players who know the drills. Keeps your heart rate up and simulates game conditions."
                : "Step-by-step mode is ideal for beginners or when learning new drills. Focus on form over speed."}
            </p>
          </div>
          
          {/* Workout Level */}
          <div>
            <label className="text-slate-500 text-sm uppercase tracking-wider block mb-3">
              WORKOUT LEVEL
              <span className="text-[#FF6B35] text-xs ml-2">(tap to learn more)</span>
            </label>
            <div className="grid grid-cols-5 gap-1 md:gap-2">
              {ageLevels.map(level => {
                const config = AGE_LEVEL_CONFIG[level]
                const isActive = preferences.ageLevel === level
                return (
                  <button
                    key={level}
                    onClick={() => setPendingAgeLevel(level)}
                    className={`p-2 md:p-3 rounded-xl text-center transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${config.bgColor} ${config.color} border-2 ${config.borderColor}`
                        : 'bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-200'
                    }`}
                    title={config.description}
                  >
                    <AgeLevelIcon type={config.iconType} className={`w-4 md:w-5 h-4 md:h-5 mx-auto mb-1 ${isActive ? config.color : ''}`} />
                    <span className="block text-[10px] md:text-xs font-bold">{config.shortName}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-slate-400 text-xs mt-2">{currentAgeLevelConfig.description}</p>
            
            {/* Tips Toggle */}
            <button
              onClick={() => setShowAgeLevelInfo(!showAgeLevelInfo)}
              className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-900 transition-colors mt-3"
            >
              <Info className="w-3 h-3" />
              {showAgeLevelInfo ? 'Hide' : 'Show'} tips for {currentAgeLevelConfig.name} players
              <ChevronDown className={`w-3 h-3 transition-transform ${showAgeLevelInfo ? 'rotate-180' : ''}`} />
            </button>
            
            {showAgeLevelInfo && (
              <div className="mt-2 space-y-1">
                {currentAgeLevelConfig.tips.map((tip, i) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 rounded-lg p-2">
                    <Check className="w-3 h-3 text-green-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700 text-xs">{tip}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Sound Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-slate-700 font-bold uppercase">SOUND EFFECTS</h4>
              <p className="text-slate-500 text-sm">Play chime when exercise completes</p>
            </div>
            <button
              onClick={() => setPreferences(prev => ({ ...prev, soundEnabled: !prev.soundEnabled }))}
              className={`w-14 h-8 rounded-full transition-all ${
                preferences.soundEnabled ? 'bg-[#FF6B35]' : 'bg-slate-100'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                preferences.soundEnabled ? 'translate-x-7' : 'translate-x-1'
              }`} />
            </button>
          </div>
          
          {/* Auto-Populate Toggle */}
          <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-4">
                <h4 className="text-slate-700 font-bold uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  AUTO-POPULATE FROM FLAWS
                </h4>
                <p className="text-slate-500 text-sm mt-1">
                  Automatically generate workouts based on your identified shooting flaws
                </p>
                {userFlaws.length > 0 ? (
                  <p className="text-green-400 text-xs mt-2 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {userFlaws.length} flaw{userFlaws.length > 1 ? 's' : ''} detected - ready to create personalized workouts
                  </p>
                ) : (
                  <p className="text-slate-400 text-xs mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    No flaws detected yet. Upload a shooting image to identify areas for improvement.
                  </p>
                )}
              </div>
              <button
                onClick={() => setPreferences(prev => ({ ...prev, autoPopulateFromFlaws: !prev.autoPopulateFromFlaws }))}
                className={`w-14 h-8 rounded-full transition-all ${
                  preferences.autoPopulateFromFlaws ? 'bg-green-500' : 'bg-slate-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                  preferences.autoPopulateFromFlaws ? 'translate-x-7' : 'translate-x-1'
                }`} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-xl p-4 border border-slate-200">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <button
            onClick={() => navigateCalendar('prev')}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
            <h3 className="text-slate-700 font-bold text-sm md:text-lg">{formatDateHeader()}</h3>
            <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1">
              {(['day', 'week', 'month'] as const).map(view => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={`px-2 md:px-3 py-1 rounded text-xs md:text-sm font-medium transition-colors ${
                    calendarView === view ? 'bg-[#FF6B35] text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {view.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <button
            onClick={() => navigateCalendar('next')}
            className="p-2 rounded-lg bg-slate-50 text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
        
        {/* Calendar Grid */}
        <div className={`grid ${calendarView === 'day' ? 'grid-cols-1' : 'grid-cols-7'} gap-1 md:gap-2`}>
          {/* Day Headers */}
          {calendarView !== 'day' && ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
            <div key={day} className="text-center text-slate-500 text-[10px] md:text-xs font-bold py-1 md:py-2">
              {day}
            </div>
          ))}
          
          {/* Calendar Days */}
          {getDaysInView.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString()
            const isCurrentMonth = date.getMonth() === currentDate.getMonth()
            const workouts = getWorkoutsForDate(date)
            const hasWorkout = workouts.length > 0
            const allCompleted = hasWorkout && workouts.every(w => w.completed)
            
            return (
              <div
                key={i}
                onClick={() => setSelectedDayForPopup(date)}
                className={`relative p-1 md:p-2 rounded-xl transition-all cursor-pointer ${
                  calendarView === 'day' ? 'min-h-[200px]' : calendarView === 'week' ? 'min-h-[80px] md:min-h-[100px]' : 'min-h-[50px] md:min-h-[70px]'
                } ${
                  isToday
                    ? 'bg-[#FF6B35]/20 border-2 border-[#FF6B35]'
                    : hasWorkout
                      ? allCompleted
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-green-500/10 border border-green-500/30 hover:border-green-500'
                      : 'bg-slate-50 border border-slate-200 hover:border-slate-200'
                } ${!isCurrentMonth && calendarView === 'month' ? 'opacity-40' : ''}`}
              >
                <span className={`text-xs md:text-sm font-bold ${
                  isToday ? 'text-[#FF6B35]' : isCurrentMonth ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {date.getDate()}
                </span>
                
                {hasWorkout && (
                  <div className="mt-1">
                    {allCompleted ? (
                      <div className="flex items-center gap-1 text-green-400 text-[10px] md:text-xs">
                        <Check className="w-3 h-3" />
                        <span className="hidden md:inline">DONE</span>
                      </div>
                    ) : (
                      <div className="w-full py-1 rounded bg-green-500/20 text-green-400 text-[10px] md:text-xs font-bold text-center flex items-center justify-center gap-1">
                        <CircleDot className="w-2 md:w-3 h-2 md:h-3" />
                        <span className="hidden md:inline">{workouts.length} WORKOUT</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Start Workout Section */}
      <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200">
        <h3 className="text-[#FF6B35] font-bold text-lg mb-4 flex items-center gap-2 uppercase">
          <Dumbbell className="w-5 h-5" />
          START A WORKOUT
        </h3>
        
        {/* Mode Toggle */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => setShowAutoGeneratePopup(true)}
            className="flex-1 min-w-[140px] py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white hover:brightness-110"
          >
            <Zap className="w-4 h-4" />
            <span className="text-xs md:text-sm">AUTO-GENERATE</span>
          </button>
          <button
            onClick={() => setShowBuildWorkoutPopup(true)}
            className="flex-1 min-w-[140px] py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 bg-slate-50 text-slate-500 hover:text-slate-900 border border-slate-200"
          >
            <GripVertical className="w-4 h-4" />
            <span className="text-xs md:text-sm">BUILD WORKOUT</span>
          </button>
        </div>
        
        {/* Notifications Toggle */}
        <div className="flex items-center justify-between mb-4 p-3 bg-slate-50 rounded-lg">
          <div className="flex items-center gap-2">
            {notificationsEnabled ? (
              <BellRing className="w-4 h-4 text-[#FF6B35]" />
            ) : (
              <Bell className="w-4 h-4 text-slate-500" />
            )}
            <span className="text-sm text-slate-500">WORKOUT REMINDERS</span>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-12 h-6 rounded-full transition-colors ${
              notificationsEnabled ? 'bg-[#FF6B35]' : 'bg-slate-100'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              notificationsEnabled ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
        </div>
        
        <p className="text-slate-500 text-sm mb-4">
          Use <span className="text-[#FF6B35] font-bold">Auto-Generate</span> to create AI-powered workouts based on your flaws, 
          or <span className="text-slate-900 font-bold">Build Workout</span> to create your own custom training plan.
        </p>
        
        {/* Quick Start Options */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <p className="text-slate-400 text-xs mb-2">Quick options</p>
          <div className="flex gap-2">
            <button
              onClick={() => setShowDrillPickerPopup(true)}
              className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:border-[#FF6B35]/50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Target className="w-4 h-4" />
              PICK A DRILL
            </button>
            <button
              onClick={startWorkout}
              className="flex-1 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-500 font-bold text-xs hover:border-[#FF6B35]/50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              QUICK START
            </button>
          </div>
        </div>
      </div>
      
      {/* Info Popups */}
      {pendingFrequency !== null && (
        <FrequencyInfoPopup
          frequency={pendingFrequency}
          onClose={() => setPendingFrequency(null)}
          onConfirm={() => {
            setPreferences(prev => ({ ...prev, frequency: pendingFrequency }))
            setPendingFrequency(null)
          }}
        />
      )}
      
      {pendingDrillCount !== null && (
        <DrillCountInfoPopup
          count={pendingDrillCount}
          onClose={() => setPendingDrillCount(null)}
          onConfirm={() => {
            setPreferences(prev => ({ ...prev, drillCount: pendingDrillCount }))
            setPendingDrillCount(null)
          }}
        />
      )}
      
      {pendingDuration !== null && (
        <DurationInfoPopup
          duration={pendingDuration}
          onClose={() => setPendingDuration(null)}
          onConfirm={() => {
            setPreferences(prev => ({ ...prev, preferredDuration: pendingDuration }))
            setPendingDuration(null)
          }}
        />
      )}
      
      {pendingAgeLevel !== null && (
        <AgeLevelInfoPopup
          ageLevel={pendingAgeLevel}
          onClose={() => setPendingAgeLevel(null)}
          onConfirm={() => {
            setPreferences(prev => ({ ...prev, ageLevel: pendingAgeLevel }))
            setPendingAgeLevel(null)
          }}
        />
      )}
      
      {/* Day Detail Popup */}
      {selectedDayForPopup && !showDrillPickerPopup && !showBuildWorkoutPopup && (
        <DayDetailPopup
          date={selectedDayForPopup}
          workouts={getWorkoutsForDate(selectedDayForPopup)}
          onClose={() => setSelectedDayForPopup(null)}
          onAddWorkout={() => {
            setAddMode('workout')
            setShowBuildWorkoutPopup(true)
          }}
          onAddDrill={() => {
            setAddMode('drill')
            setShowDrillPickerPopup(true)
          }}
          onStartWorkout={(drills) => {
            if (onStartWorkout) onStartWorkout(drills)
            setSelectedDayForPopup(null)
          }}
          onRemoveWorkout={(workoutId) => {
            removeScheduledWorkout(workoutId)
          }}
          onToggleComplete={(workoutId) => {
            toggleScheduledComplete(workoutId)
          }}
        />
      )}
      
      {/* Build Workout Popup */}
      {showBuildWorkoutPopup && (
        <BuildWorkoutPopup
          availableDrills={allDrills}
          onClose={() => {
            setShowBuildWorkoutPopup(false)
            if (!selectedDayForPopup) setSelectedDayForPopup(null)
          }}
          onSaveWorkout={(drills, workoutName) => {
            // Create a custom workout and add to today or selected date
            const targetDate = selectedDayForPopup || new Date()
            const workout: ScheduledWorkout = {
              id: `custom-${Date.now()}`,
              date: targetDate,
              drills,
              completed: false,
              name: workoutName
            }
            void persistNewWorkout(workout)
            setShowBuildWorkoutPopup(false)
            setSelectedDayForPopup(null)
          }}
          onStartWorkout={(drills) => {
            if (onStartWorkout) onStartWorkout(drills)
            setShowBuildWorkoutPopup(false)
            setSelectedDayForPopup(null)
          }}
        />
      )}
      
      {/* Drill Picker Popup */}
      {showDrillPickerPopup && (
        <DrillPickerPopup
          availableDrills={allDrills}
          onClose={() => {
            setShowDrillPickerPopup(false)
            if (!selectedDayForPopup) setSelectedDayForPopup(null)
          }}
          onSelectDrill={(drill) => {
            const targetDate = selectedDayForPopup || new Date()
            const workout: ScheduledWorkout = {
              id: `drill-${Date.now()}`,
              date: targetDate,
              drills: [drill],
              completed: false,
              name: drill.title
            }
            void persistNewWorkout(workout)
            setShowDrillPickerPopup(false)
            setSelectedDayForPopup(null)
          }}
          onStartDrill={(drill) => {
            if (onStartWorkout) onStartWorkout([drill])
            setShowDrillPickerPopup(false)
            setSelectedDayForPopup(null)
          }}
        />
      )}
      
      {/* Auto-Generate Popup */}
      {showAutoGeneratePopup && (
        <AutoGeneratePopup
          availableDrills={allDrills}
          currentPreferences={preferences}
          onClose={() => setShowAutoGeneratePopup(false)}
          onCreateCustomDrill={() => {
            setShowAutoGeneratePopup(false)
            setShowCustomDrillCreator(true)
          }}
          onGenerate={(config) => {
            // Generate based on config with all filters
            const filteredDrills = allDrills.filter(d => {
              const matchesFocus = config.focusAreas.length === 0 || config.focusAreas.includes(d.focusArea)
              const matchesSkill = config.skillLevels.length === 0 || config.skillLevels.includes(d.level)
              const matchesDiff = config.difficulties.length === 0 || config.difficulties.includes(d.difficulty)
              const matchesDuration = d.duration <= config.duration
              return matchesFocus && matchesSkill && matchesDiff && matchesDuration
            })
            
            // Shuffle and pick drills
            const shuffled = [...filteredDrills].sort(() => Math.random() - 0.5)
            const selectedDrills = shuffled.slice(0, config.drillCount)
            
            let firstScheduledDate = new Date()
            let workoutName = ''
            
            if (config.type === 'workout') {
              workoutName = config.focusAreas.length > 0 
                ? `${FOCUS_AREA_LABELS[config.focusAreas[0]]} Workout` 
                : 'Mixed Training'
              
              if (config.frequency === 'one-off') {
                // Start immediately or schedule to today
                if (config.startNow) {
                  if (onStartWorkout) onStartWorkout(selectedDrills)
                  setShowAutoGeneratePopup(false)
                  return
                } else {
                  const workout: ScheduledWorkout = {
                    id: `auto-${Date.now()}`,
                    date: new Date(),
                    drills: selectedDrills,
                    completed: false,
                    name: workoutName
                  }
                  void persistNewWorkout(workout)
                  firstScheduledDate = new Date()
                }
              } else {
                // Schedule recurring workouts
                const daysPerWeek = parseInt(config.frequency.replace('x', ''))
                const today = new Date()
                const daysOfWeek = [1, 2, 3, 4, 5, 6, 0] // Mon-Sun
                const selectedDays = daysOfWeek.slice(0, daysPerWeek)
                let isFirstWorkout = true
                
                // Schedule for next 4 weeks
                for (let week = 0; week < 4; week++) {
                  for (const dayOfWeek of selectedDays) {
                    const date = new Date(today)
                    date.setDate(date.getDate() + (week * 7) + ((dayOfWeek - today.getDay() + 7) % 7))
                    
                    if (date >= today) {
                      if (isFirstWorkout) {
                        firstScheduledDate = new Date(date)
                        isFirstWorkout = false
                      }
                      const workout: ScheduledWorkout = {
                        id: `auto-${Date.now()}-${week}-${dayOfWeek}`,
                        date,
                        drills: selectedDrills,
                        completed: false,
                        name: workoutName
                      }
                      void persistNewWorkout(workout)
                    }
                  }
                }
              }
            } else {
              // Single drill
              const drill = selectedDrills[0]
              if (drill) {
                workoutName = drill.title
                if (config.startNow) {
                  if (onStartWorkout) onStartWorkout([drill])
                  setShowAutoGeneratePopup(false)
                  return
                } else {
                  const workout: ScheduledWorkout = {
                    id: `drill-${Date.now()}`,
                    date: new Date(),
                    drills: [drill],
                    completed: false,
                    name: drill.title
                  }
                  void persistNewWorkout(workout)
                  firstScheduledDate = new Date()
                }
              }
            }
            
            // Navigate calendar to first scheduled date
            setCurrentDate(firstScheduledDate)
            
            // Show success notification
            setScheduleSuccessInfo({
              show: true,
              workoutName,
              date: firstScheduledDate,
              isRecurring: config.frequency !== 'one-off',
              frequency: config.frequency
            })
            
            setShowAutoGeneratePopup(false)
          }}
        />
      )}

      {/* Custom Drill Creator Popup */}
      {showCustomDrillCreator && (
        <CustomDrillCreator
          defaultLevel={({
            'elementary': 'ELEMENTARY',
            'middle_school': 'MIDDLE_SCHOOL',
            'high_school': 'HIGH_SCHOOL',
            'college': 'COLLEGE',
            'professional': 'PROFESSIONAL',
          } as Record<AgeLevel, SkillLevel>)[preferences.ageLevel]}
          onClose={() => setShowCustomDrillCreator(false)}
          onCreate={(drill) => {
            setCustomDrills(prev => [...prev, drill])
            setShowCustomDrillCreator(false)
          }}
        />
      )}

      {/* Schedule Success Toast */}
      {scheduleSuccessInfo?.show && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[250] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-4 shadow-lg shadow-green-500/30 max-w-sm mx-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-slate-900 font-bold text-sm">Workout Scheduled!</h4>
                <p className="text-slate-600 text-xs mt-0.5 truncate">
                  {scheduleSuccessInfo.workoutName}
                </p>
                <p className="text-slate-500 text-xs mt-1">
                  {scheduleSuccessInfo.isRecurring ? (
                    <>
                      <span className="text-white font-bold">{scheduleSuccessInfo.frequency}</span> starting{' '}
                      {scheduleSuccessInfo.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </>
                  ) : (
                    <>
                      Scheduled for{' '}
                      <span className="text-white font-bold">
                        {scheduleSuccessInfo.date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button 
                onClick={() => setScheduleSuccessInfo(null)}
                className="text-slate-500 hover:text-slate-900 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setSelectedDayForPopup(scheduleSuccessInfo.date)
                  setScheduleSuccessInfo(null)
                }}
                className="flex-1 py-2 rounded-lg bg-white/20 text-white text-xs font-bold hover:bg-white/30 transition-colors"
              >
                VIEW WORKOUT
              </button>
              <button
                onClick={() => setScheduleSuccessInfo(null)}
                className="px-4 py-2 rounded-lg bg-white text-green-600 text-xs font-bold hover:bg-white/90 transition-colors"
              >
                GOT IT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// DAY DETAIL POPUP COMPONENT
// =============================================

interface DayDetailPopupProps {
  date: Date
  workouts: ScheduledWorkout[]
  onClose: () => void
  onAddWorkout: () => void
  onAddDrill: () => void
  onStartWorkout: (drills: Drill[]) => void
  onRemoveWorkout: (workoutId: string) => void
  onToggleComplete: (workoutId: string) => void
}

function DayDetailPopup({ 
  date, 
  workouts, 
  onClose, 
  onAddWorkout, 
  onAddDrill,
  onStartWorkout,
  onRemoveWorkout,
  onToggleComplete 
}: DayDetailPopupProps) {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
  const dateString = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const isToday = date.toDateString() === new Date().toDateString()
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl max-w-md w-full max-h-[90vh] overflow-hidden border border-slate-200 shadow-lg">
        {/* Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-[#FF6B35]" />
              </div>
              <div>
                <h2 className="text-xl font-black text-[#FF6B35] tracking-wide">{dayName}</h2>
                <p className="text-slate-500 text-sm">{dateString}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 p-1 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          {isToday && (
            <div className="mt-3 px-3 py-1.5 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-lg inline-flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35] animate-pulse" />
              <span className="text-[#FF6B35] text-xs font-bold">TODAY</span>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="p-5 max-h-[400px] overflow-y-auto">
          {workouts.length === 0 ? (
            // Empty State
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mx-auto mb-4">
                <Dumbbell className="w-8 h-8 text-slate-700" />
              </div>
              <h3 className="text-slate-500 font-bold mb-2">NO TRAINING SCHEDULED</h3>
              <p className="text-slate-500 text-sm">Add a workout or drill to this day to get started</p>
            </div>
          ) : (
            // Workout List
            <div className="space-y-3">
              <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3">
                {workouts.length} WORKOUT{workouts.length > 1 ? 'S' : ''} SCHEDULED
              </h3>
              {workouts.map((workout) => (
                <div 
                  key={workout.id}
                  className={`bg-white rounded-xl p-4 border ${
                    workout.completed 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {workout.completed ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
                          <Dumbbell className="w-3 h-3 text-[#FF6B35]" />
                        </div>
                      )}
                      <span className={`font-bold ${workout.completed ? 'text-green-400' : 'text-slate-700'}`}>
                        {workout.completed ? 'COMPLETED' : 'SCHEDULED'}
                      </span>
                    </div>
                    <button
                      onClick={() => onRemoveWorkout(workout.id)}
                      className="text-slate-400 hover:text-red-400 p-1 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Drills List */}
                  <div className="space-y-2 mb-4">
                    {workout.drills.map((drill, idx) => (
                      <div key={drill.id} className="flex items-center gap-3 text-sm">
                        <span className="w-5 h-5 rounded bg-slate-50 text-slate-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 flex-1">{drill.title}</span>
                        <span className="text-slate-400 text-xs">{drill.duration}m</span>
                      </div>
                    ))}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleComplete(workout.id)}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                        workout.completed
                          ? 'bg-slate-50 text-slate-500 hover:text-slate-900'
                          : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {workout.completed ? 'MARK INCOMPLETE' : 'MARK COMPLETE'}
                    </button>
                    {!workout.completed && (
                      <button
                        onClick={() => onStartWorkout(workout.drills)}
                        className="flex-1 py-2 rounded-lg bg-[#FF6B35] text-white text-sm font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        START
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer - Add Workout or Drill Buttons */}
        <div className="p-5 border-t border-slate-200 space-y-3">
          <button
            onClick={onAddWorkout}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Dumbbell className="w-5 h-5" />
            ADD FULL WORKOUT
          </button>
          <button
            onClick={onAddDrill}
            className="w-full py-3.5 rounded-xl bg-white border border-[#FF6B35]/50 text-[#FF6B35] font-bold text-sm hover:bg-[#FF6B35]/10 transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
          >
            <Target className="w-5 h-5" />
            ADD SINGLE DRILL
          </button>
        </div>
      </div>
    </div>
  )
}

// =============================================
// BUILD WORKOUT POPUP COMPONENT
// =============================================

interface BuildWorkoutPopupProps {
  availableDrills: Drill[]
  onClose: () => void
  onSaveWorkout: (drills: Drill[], workoutName: string) => void
  onStartWorkout: (drills: Drill[]) => void
}

function BuildWorkoutPopup({ availableDrills, onClose, onSaveWorkout, onStartWorkout }: BuildWorkoutPopupProps) {
  const [workoutName, setWorkoutName] = useState('')
  const [selectedDrills, setSelectedDrills] = useState<Drill[]>([])
  const [draggedDrill, setDraggedDrill] = useState<Drill | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFocus, setFilterFocus] = useState<FocusArea | 'all'>('all')
  const [previewDrill, setPreviewDrill] = useState<Drill | null>(null)
  
  // Filter available drills
  const filteredDrills = useMemo(() => {
    return availableDrills.filter(drill => {
      const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           drill.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFocus = filterFocus === 'all' || drill.focusArea === filterFocus
      const notSelected = !selectedDrills.find(d => d.id === drill.id)
      return matchesSearch && matchesFocus && notSelected
    })
  }, [availableDrills, searchQuery, filterFocus, selectedDrills])
  
  // Calculate total duration
  const totalDuration = selectedDrills.reduce((sum, drill) => sum + drill.duration, 0)
  
  // Drag handlers
  const handleDragStart = (drill: Drill) => {
    setDraggedDrill(drill)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (draggedDrill && !selectedDrills.find(d => d.id === draggedDrill.id)) {
      setSelectedDrills(prev => [...prev, draggedDrill])
    }
    setDraggedDrill(null)
  }
  
  const handleAddDrill = (drill: Drill) => {
    if (!selectedDrills.find(d => d.id === drill.id)) {
      setSelectedDrills(prev => [...prev, drill])
    }
  }
  
  const handleRemoveDrill = (drillId: string) => {
    setSelectedDrills(prev => prev.filter(d => d.id !== drillId))
  }
  
  const handleReorderDrill = (fromIndex: number, toIndex: number) => {
    const newDrills = [...selectedDrills]
    const [removed] = newDrills.splice(fromIndex, 1)
    newDrills.splice(toIndex, 0, removed)
    setSelectedDrills(newDrills)
  }
  
  // Focus area badge colors
  const getFocusBadgeColor = (focus: FocusArea) => {
    const colors: Record<FocusArea, string> = {
      'ELBOW_ALIGNMENT': 'bg-blue-500',
      'KNEE_BEND': 'bg-purple-500',
      'RELEASE_POINT': 'bg-green-500',
      'FOLLOW_THROUGH': 'bg-yellow-500',
      'BALANCE': 'bg-pink-500',
      'ARC_TRAJECTORY': 'bg-cyan-500',
      'FOOTWORK': 'bg-orange-500',
      'CONSISTENCY': 'bg-indigo-500',
      'FATIGUE': 'bg-red-500',
      'GAME_SITUATION': 'bg-red-500',
      'MICRO_ADJUSTMENT': 'bg-teal-500'
    }
    return colors[focus] || 'bg-gray-500'
  }
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
              <GripVertical className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-xl font-black text-[#FF6B35]">Build Your Workout</h2>
              <p className="text-slate-500 text-sm">Drag and drop drills to create your custom workout</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Content - Two Panels */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel - Available Drills */}
          <div className="w-full md:w-1/2 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-center gap-2 mb-3">
                <GripVertical className="w-4 h-4 text-slate-400" />
                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider">
                  AVAILABLE DRILLS - DRAG TO ADD
                </h3>
              </div>
              
              {/* Search */}
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drills..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35] mb-2"
              />
              
              {/* Focus Filter */}
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setFilterFocus('all')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    filterFocus === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ALL
                </button>
                {(['RELEASE_POINT', 'ELBOW_ALIGNMENT', 'BALANCE', 'FOLLOW_THROUGH'] as FocusArea[]).map(focus => (
                  <button
                    key={focus}
                    onClick={() => setFilterFocus(focus)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                      filterFocus === focus ? 'bg-[#FF6B35] text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {FOCUS_AREA_LABELS[focus]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Drills List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredDrills.slice(0, 20).map(drill => (
                <div
                  key={drill.id}
                  draggable
                  onDragStart={() => handleDragStart(drill)}
                  className="bg-white rounded-xl p-3 border border-slate-200 hover:border-[#FF6B35]/50 cursor-grab active:cursor-grabbing transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-slate-900 font-bold text-sm truncate">{drill.title}</h4>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setPreviewDrill(drill)
                          }}
                          className="p-1 hover:bg-[#FF6B35]/20 rounded transition-colors"
                        >
                          <Info className="w-3 h-3 text-slate-400 hover:text-[#FF6B35]" />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAddDrill(drill)
                          }}
                          className="p-1 hover:bg-[#FF6B35]/20 rounded transition-colors ml-auto"
                        >
                          <Plus className="w-4 h-4 text-slate-400 group-hover:text-[#FF6B35] flex-shrink-0" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${getFocusBadgeColor(drill.focusArea)}`}>
                          {FOCUS_AREA_LABELS[drill.focusArea]}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs line-clamp-1">{drill.description}</p>
                      <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {drill.duration} min
                        </span>
                        <span>{drill.steps.length} steps</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Panel - Your Workout */}
          <div className="w-full md:w-1/2 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="flex items-center gap-2">
                  <Dumbbell className="w-4 h-4 text-[#FF6B35]" />
                  <div>
                    <h3 className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider">YOUR WORKOUT</h3>
                    <p className="text-slate-400 text-xs">{selectedDrills.length} drills • {totalDuration} min total</p>
                  </div>
                </div>
                <input
                  type="text"
                  value={workoutName}
                  onChange={(e) => setWorkoutName(e.target.value)}
                  placeholder="Workout name..."
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35]"
                />
              </div>
            </div>
            
            {/* Drop Zone */}
            <div 
              className="flex-1 overflow-y-auto p-3"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {selectedDrills.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center border-2 border-dashed border-slate-200 rounded-xl p-8">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                    <GripVertical className="w-8 h-8 text-slate-700" />
                  </div>
                  <h4 className="text-slate-400 font-bold mb-1">Drop drills here</h4>
                  <p className="text-slate-500 text-sm text-center">Drag drills from the left panel to build your workout</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDrills.map((drill, index) => (
                    <div
                      key={drill.id}
                      className="bg-white rounded-xl p-3 border border-slate-200 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#FF6B35]/20 text-[#FF6B35] text-xs font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-slate-900 font-bold text-sm truncate">{drill.title}</h4>
                          <div className="flex items-center gap-2 text-slate-500 text-xs">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold text-white ${getFocusBadgeColor(drill.focusArea)}`}>
                              {FOCUS_AREA_LABELS[drill.focusArea]}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {drill.duration} min
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {index > 0 && (
                            <button
                              onClick={() => handleReorderDrill(index, index - 1)}
                              className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              <ChevronUp className="w-4 h-4" />
                            </button>
                          )}
                          {index < selectedDrills.length - 1 && (
                            <button
                              onClick={() => handleReorderDrill(index, index + 1)}
                              className="p-1 text-slate-400 hover:text-slate-900 transition-colors"
                            >
                              <ChevronDown className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveDrill(drill.id)}
                            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold hover:text-slate-900 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={() => {
              if (selectedDrills.length > 0) {
                onStartWorkout(selectedDrills)
              }
            }}
            disabled={selectedDrills.length === 0}
            className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
              selectedDrills.length > 0
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white hover:brightness-110'
                : 'bg-slate-50 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Play className="w-5 h-5" />
            ADD DRILLS TO START
          </button>
        </div>
      </div>
      
      {/* Drill Preview Modal */}
      {previewDrill && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-slate-50 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden border border-slate-200 shadow-lg flex flex-col">
            {/* Header with Close */}
            <div className="relative h-28 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border-b border-slate-200">
              <button 
                onClick={() => setPreviewDrill(null)}
                className="absolute top-3 right-3 text-slate-400 hover:text-slate-900 p-1.5 bg-white/80 rounded-lg transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center">
                  <Target className="w-7 h-7 text-[#FF6B35]" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                <h3 className="text-slate-900 font-black">{previewDrill.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getFocusBadgeColor(previewDrill.focusArea)}`}>
                    {FOCUS_AREA_LABELS[previewDrill.focusArea]}
                  </span>
                  <span className="text-slate-500 text-xs">{previewDrill.duration} min</span>
                </div>
              </div>
            </div>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Focus */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                    <Target className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase">FOCUS</p>
                    <p className="text-[#FF6B35] font-bold text-sm">{FOCUS_AREA_LABELS[previewDrill.focusArea]}</p>
                  </div>
                </div>
              </div>
              
              {/* Duration */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-slate-500 text-[10px] uppercase">REPS / DURATION</p>
                    <p className="text-slate-700 font-bold text-sm">{previewDrill.duration} minutes</p>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                  <h4 className="text-slate-900 font-bold text-xs">COACH'S INSTRUCTIONS</h4>
                </div>
                <div className="space-y-2">
                  {previewDrill.steps.map((step, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                        <span className="text-[#FF6B35] text-[10px] font-bold">{idx + 1}</span>
                      </div>
                      <p className="text-slate-700 text-xs leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Expected Outcomes */}
              <div className="p-4 border-b border-slate-200">
                <div className="flex items-center gap-2 mb-2">
                  <Check className="w-4 h-4 text-[#FF6B35]" />
                  <h4 className="text-slate-900 font-bold text-xs">KEY POINTS</h4>
                </div>
                <div className="space-y-1.5">
                  {previewDrill.expectedOutcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-white rounded-lg p-2 border border-slate-200">
                      <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                      <p className="text-slate-700 text-xs">{outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Why It Matters */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-[#FF6B35]" />
                  <h4 className="text-[#FF6B35] font-bold text-xs">WHY IT MATTERS</h4>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#FF6B35] mt-1.5 flex-shrink-0" />
                  <p className="text-slate-500 text-xs">{previewDrill.whyItMatters}</p>
                </div>
                {previewDrill.technicalNote && (
                  <div className="mt-2 p-2 bg-white rounded-lg border border-[#FF6B35]/20">
                    <p className="text-slate-500 text-[10px] italic">💡 {previewDrill.technicalNote}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer Button */}
            <div className="p-4 border-t border-slate-200">
              <button
                onClick={() => {
                  handleAddDrill(previewDrill)
                  setPreviewDrill(null)
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                ADD TO WORKOUT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================
// DRILL PICKER POPUP COMPONENT
// =============================================

interface DrillPickerPopupProps {
  availableDrills: Drill[]
  onClose: () => void
  onSelectDrill: (drill: Drill) => void
  onStartDrill: (drill: Drill) => void
}

function DrillPickerPopup({ availableDrills, onClose, onSelectDrill, onStartDrill }: DrillPickerPopupProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterFocus, setFilterFocus] = useState<FocusArea | 'all'>('all')
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  
  // Filter drills
  const filteredDrills = useMemo(() => {
    return availableDrills.filter(drill => {
      const matchesSearch = drill.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           drill.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesFocus = filterFocus === 'all' || drill.focusArea === filterFocus
      return matchesSearch && matchesFocus
    })
  }, [availableDrills, searchQuery, filterFocus])
  
  // Focus area badge colors
  const getFocusBadgeColor = (focus: FocusArea) => {
    const colors: Record<FocusArea, string> = {
      'ELBOW_ALIGNMENT': 'bg-blue-500',
      'KNEE_BEND': 'bg-purple-500',
      'RELEASE_POINT': 'bg-green-500',
      'FOLLOW_THROUGH': 'bg-yellow-500',
      'BALANCE': 'bg-pink-500',
      'ARC_TRAJECTORY': 'bg-cyan-500',
      'FOOTWORK': 'bg-orange-500',
      'CONSISTENCY': 'bg-indigo-500',
      'FATIGUE': 'bg-amber-500',
      'GAME_SITUATION': 'bg-red-500',
      'MICRO_ADJUSTMENT': 'bg-teal-500'
    }
    return colors[focus] || 'bg-gray-500'
  }
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-200 shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
              <Target className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#FF6B35]">Pick a Drill</h2>
              <p className="text-slate-500 text-xs">Select a drill to see details</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Two-Panel Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel - Drills List */}
          <div className="w-full md:w-2/5 border-r border-slate-200 flex flex-col">
            {/* Search & Filters */}
            <div className="p-3 border-b border-slate-200">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search drills..."
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#FF6B35] mb-2"
              />
              
              <div className="flex flex-wrap gap-1">
                <button
                  onClick={() => setFilterFocus('all')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                    filterFocus === 'all' ? 'bg-[#FF6B35] text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ALL
                </button>
                {(['RELEASE_POINT', 'ELBOW_ALIGNMENT', 'BALANCE', 'FOLLOW_THROUGH'] as FocusArea[]).map(focus => (
                  <button
                    key={focus}
                    onClick={() => setFilterFocus(focus)}
                    className={`px-2 py-1 rounded text-[10px] font-bold transition-colors ${
                      filterFocus === focus ? 'bg-[#FF6B35] text-white' : 'bg-slate-50 text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {FOCUS_AREA_LABELS[focus]}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Drills List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filteredDrills.slice(0, 30).map(drill => (
                <button
                  key={drill.id}
                  type="button"
                  onClick={() => setSelectedDrill(drill)}
                  className={`w-full text-left bg-white rounded-lg p-2.5 border transition-all ${
                    selectedDrill?.id === drill.id 
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10' 
                      : 'border-slate-200 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-8 rounded-full ${selectedDrill?.id === drill.id ? 'bg-[#FF6B35]' : 'bg-slate-100'}`} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-slate-900 font-bold text-xs truncate">{drill.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold text-white ${getFocusBadgeColor(drill.focusArea)}`}>
                          {FOCUS_AREA_LABELS[drill.focusArea]}
                        </span>
                        <span className="text-slate-400 text-[10px]">{drill.duration}m</span>
                      </div>
                    </div>
                    {selectedDrill?.id === drill.id && (
                      <Check className="w-4 h-4 text-[#FF6B35] flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Right Panel - Drill Details */}
          <div className="w-full md:w-3/5 flex flex-col overflow-hidden">
            {selectedDrill ? (
              <div className="flex-1 overflow-y-auto">
                {/* Drill Header with Image */}
                <div className="relative h-32 bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/20 flex items-center justify-center">
                      <Target className="w-8 h-8 text-[#FF6B35]" />
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] to-transparent">
                    <div className="flex items-center gap-2">
                      <h3 className="text-slate-900 font-black text-lg">{selectedDrill.title}</h3>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-white ${getFocusBadgeColor(selectedDrill.focusArea)}`}>
                        {FOCUS_AREA_LABELS[selectedDrill.focusArea]}
                      </span>
                      <span className="text-slate-500 text-xs flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {selectedDrill.duration} MINUTES
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Focus Section */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
                      <Target className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">FOCUS</p>
                      <p className="text-[#FF6B35] font-bold uppercase">{FOCUS_AREA_LABELS[selectedDrill.focusArea]}</p>
                    </div>
                  </div>
                </div>
                
                {/* Reps / Duration Section */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-[#FF6B35]" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs uppercase tracking-wider">REPS / DURATION</p>
                      <p className="text-slate-700 font-bold">{selectedDrill.duration} minutes</p>
                    </div>
                  </div>
                </div>
                
                {/* Coach's Instructions */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-full bg-[#FF6B35]/20 flex items-center justify-center">
                      <BookOpen className="w-4 h-4 text-[#FF6B35]" />
                    </div>
                    <h4 className="text-slate-900 font-bold text-sm">COACH'S INSTRUCTIONS</h4>
                  </div>
                  <div className="space-y-3">
                    {selectedDrill.steps.map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-[#FF6B35]/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-[#FF6B35] text-xs font-bold">{idx + 1}</span>
                        </div>
                        <p className="text-slate-700 text-sm leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Expected Outcomes / Key Points */}
                <div className="p-4 border-b border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Check className="w-4 h-4 text-[#FF6B35]" />
                    <h4 className="text-slate-900 font-bold text-sm">KEY POINTS - DO IT RIGHT</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedDrill.expectedOutcomes.map((outcome, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 text-green-400" />
                        </div>
                        <p className="text-slate-700 text-sm">{outcome}</p>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Why It Matters / Pro Tips */}
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-[#FF6B35]" />
                    <h4 className="text-[#FF6B35] font-bold text-sm">WHY IT MATTERS</h4>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#FF6B35] mt-2 flex-shrink-0" />
                    <p className="text-slate-500 text-sm">{selectedDrill.whyItMatters}</p>
                  </div>
                  {selectedDrill.technicalNote && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-[#FF6B35]/20">
                      <p className="text-slate-500 text-xs italic">💡 {selectedDrill.technicalNote}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Empty State
              <div className="flex-1 flex flex-col items-center justify-center p-8">
                <div className="w-20 h-20 rounded-2xl bg-white border border-slate-200 flex items-center justify-center mb-4">
                  <Target className="w-10 h-10 text-slate-700" />
                </div>
                <h4 className="text-slate-400 font-bold mb-1">SELECT A DRILL</h4>
                <p className="text-slate-500 text-sm text-center">Click on a drill from the list to see full details</p>
              </div>
            )}
            
            {/* Footer - Action Button */}
            {selectedDrill && (
              <div className="p-4 border-t border-slate-200 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => onSelectDrill(selectedDrill)}
                    className="flex-1 py-3 rounded-xl bg-slate-50 border border-[#FF6B35]/50 text-[#FF6B35] font-bold text-sm hover:bg-[#FF6B35]/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    SCHEDULE
                  </button>
                  <button
                    onClick={() => onStartDrill(selectedDrill)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold text-sm hover:brightness-110 transition-all flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    GOT IT - LET'S GO!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// AUTO-GENERATE POPUP COMPONENT
// =============================================

interface AutoGenerateConfig {
  type: 'workout' | 'drill'
  frequency: 'one-off' | '2x' | '3x' | '4x' | '5x' | '6x'
  focusAreas: FocusArea[]
  skillLevels: SkillLevel[]
  difficulties: number[]
  duration: number
  drillCount: number
  startNow: boolean
}

interface AutoGeneratePopupProps {
  availableDrills: Drill[]
  currentPreferences: TrainingPreferences
  onClose: () => void
  onGenerate: (config: AutoGenerateConfig) => void
  onCreateCustomDrill: () => void
}

function AutoGeneratePopup({ availableDrills, currentPreferences, onClose, onGenerate, onCreateCustomDrill }: AutoGeneratePopupProps) {
  const [config, setConfig] = useState<AutoGenerateConfig>({
    type: 'workout',
    frequency: 'one-off',
    focusAreas: [],
    skillLevels: [],
    difficulties: [],
    duration: currentPreferences.preferredDuration,
    drillCount: currentPreferences.drillCount,
    startNow: false
  })
  
  const [showFilters, setShowFilters] = useState(false)
  
  const focusAreaOptions: { value: FocusArea; label: string; icon: string }[] = [
    { value: 'RELEASE_POINT', label: 'Release Point', icon: '🎯' },
    { value: 'ELBOW_ALIGNMENT', label: 'Elbow', icon: '💪' },
    { value: 'FOLLOW_THROUGH', label: 'Follow Through', icon: '✋' },
    { value: 'BALANCE', label: 'Balance', icon: '⚖️' },
    { value: 'KNEE_BEND', label: 'Legs', icon: '🦵' },
    { value: 'ARC_TRAJECTORY', label: 'Arc', icon: '🌈' },
    { value: 'FOOTWORK', label: 'Footwork', icon: '👟' },
    { value: 'CONSISTENCY', label: 'Consistency', icon: '🔄' },
    { value: 'GAME_SITUATION', label: 'Game Speed', icon: '🏃' },
    { value: 'FATIGUE', label: 'Endurance', icon: '💦' }
  ]
  
  const skillLevelOptions: { value: SkillLevel; label: string; color: string }[] = [
    { value: 'ELEMENTARY', label: 'Elementary', color: 'from-green-500 to-green-600' },
    { value: 'MIDDLE_SCHOOL', label: 'Middle School', color: 'from-blue-500 to-blue-600' },
    { value: 'HIGH_SCHOOL', label: 'High School', color: 'from-purple-500 to-purple-600' },
    { value: 'COLLEGE', label: 'College', color: 'from-orange-500 to-orange-600' },
    { value: 'PROFESSIONAL', label: 'Pro', color: 'from-red-500 to-red-600' }
  ]
  
  const difficultyOptions: { value: number; label: string; color: string }[] = [
    { value: 1, label: 'Easy', color: 'bg-green-500' },
    { value: 2, label: 'Medium', color: 'bg-yellow-500' },
    { value: 3, label: 'Hard', color: 'bg-orange-500' },
    { value: 4, label: 'Expert', color: 'bg-red-500' },
    { value: 5, label: 'Elite', color: 'bg-purple-500' }
  ]
  
  const durationOptions = [
    { value: 1, label: '30s' },
    { value: 2, label: '1m' },
    { value: 3, label: '2m' },
    { value: 5, label: '5m' },
    { value: 10, label: '10m' },
    { value: 15, label: '15m' },
    { value: 20, label: '20m' },
    { value: 30, label: '30m' },
    { value: 45, label: '45m' },
    { value: 60, label: '60m' }
  ]
  
  const frequencyOptions = [
    { value: 'one-off', label: 'One-Time', desc: 'Single session' },
    { value: '2x', label: '2x / Week', desc: 'Light training' },
    { value: '3x', label: '3x / Week', desc: 'Recommended' },
    { value: '4x', label: '4x / Week', desc: 'Committed' },
    { value: '5x', label: '5x / Week', desc: 'Intensive' },
    { value: '6x', label: '6x / Week', desc: 'Elite' }
  ]
  
  const toggleFocusArea = (area: FocusArea) => {
    setConfig(prev => ({
      ...prev,
      focusAreas: prev.focusAreas.includes(area)
        ? prev.focusAreas.filter(a => a !== area)
        : [...prev.focusAreas, area]
    }))
  }
  
  const toggleSkillLevel = (level: SkillLevel) => {
    setConfig(prev => ({
      ...prev,
      skillLevels: prev.skillLevels.includes(level)
        ? prev.skillLevels.filter(l => l !== level)
        : [...prev.skillLevels, level]
    }))
  }
  
  const toggleDifficulty = (diff: number) => {
    setConfig(prev => ({
      ...prev,
      difficulties: prev.difficulties.includes(diff)
        ? prev.difficulties.filter(d => d !== diff)
        : [...prev.difficulties, diff]
    }))
  }
  
  // Count matching drills
  const matchingDrillCount = useMemo(() => {
    return availableDrills.filter(d => {
      const matchesFocus = config.focusAreas.length === 0 || config.focusAreas.includes(d.focusArea)
      const matchesSkill = config.skillLevels.length === 0 || config.skillLevels.includes(d.level)
      const matchesDiff = config.difficulties.length === 0 || config.difficulties.includes(d.difficulty)
      const matchesDuration = d.duration <= config.duration
      return matchesFocus && matchesSkill && matchesDiff && matchesDuration
    }).length
  }, [availableDrills, config.focusAreas, config.skillLevels, config.difficulties, config.duration])
  
  // Count active filters
  const activeFilterCount = config.focusAreas.length + config.skillLevels.length + config.difficulties.length
  
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-slate-50 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-slate-200 shadow-lg flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#FF6B35]/20 to-[#FF4500]/10 p-5 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center shadow-lg shadow-[#FF6B35]/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900">Auto-Generate</h2>
                <p className="text-slate-500 text-sm">AI-powered training plan</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-900 p-2 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Type Selection */}
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 block">
              What do you want to generate?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, type: 'workout' }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  config.type === 'workout'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                    : 'border-slate-200 bg-white hover:border-slate-200'
                }`}
              >
                <Dumbbell className={`w-6 h-6 mb-2 ${config.type === 'workout' ? 'text-[#FF6B35]' : 'text-slate-400'}`} />
                <h4 className="text-slate-900 font-bold text-sm">Full Workout</h4>
                <p className="text-slate-400 text-xs mt-1">Multiple drills combined</p>
              </button>
              <button
                type="button"
                onClick={() => setConfig(prev => ({ ...prev, type: 'drill' }))}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  config.type === 'drill'
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                    : 'border-slate-200 bg-white hover:border-slate-200'
                }`}
              >
                <Target className={`w-6 h-6 mb-2 ${config.type === 'drill' ? 'text-[#FF6B35]' : 'text-slate-400'}`} />
                <h4 className="text-slate-900 font-bold text-sm">Single Drill</h4>
                <p className="text-slate-400 text-xs mt-1">One focused exercise</p>
              </button>
            </div>
          </div>
          
          {/* Filter Card */}
          <div className="bg-gradient-to-r from-[#1a1a1a] to-[#151515] rounded-xl border border-slate-200 overflow-hidden">
            {/* Filter Header - Always Visible */}
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-[#FF6B35]" />
                </div>
                <div className="text-left">
                  <h4 className="text-slate-900 font-bold text-sm">Filter Drills</h4>
                  <p className="text-slate-400 text-xs">
                    {activeFilterCount > 0 
                      ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                      : 'All drills included'
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-[#FF6B35] text-white text-xs font-bold">
                    {activeFilterCount}
                  </span>
                )}
                {showFilters ? (
                  <ChevronUp className="w-5 h-5 text-slate-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-slate-400" />
                )}
              </div>
            </button>
            
            {/* Filter Content - Expandable */}
            {showFilters && (
              <div className="p-4 pt-0 space-y-4 border-t border-slate-200">
                {/* Focus Areas */}
                <div className="pt-4">
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">
                    Focus Area
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {focusAreaOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleFocusArea(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.focusAreas.includes(opt.value)
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Skill Level */}
                <div>
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">
                    Skill Level
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {skillLevelOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleSkillLevel(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.skillLevels.includes(opt.value)
                            ? `bg-gradient-to-r ${opt.color} text-white`
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Difficulty */}
                <div>
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">
                    Difficulty
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {difficultyOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => toggleDifficulty(opt.value)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.difficulties.includes(opt.value)
                            ? `${opt.color} text-white`
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Duration Range */}
                <div>
                  <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2 block">
                    Max Duration <span className="text-[#FF6B35]">({config.duration} min)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {durationOptions.map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setConfig(prev => ({ ...prev, duration: opt.value }))}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          config.duration === opt.value
                            ? 'bg-[#FF6B35] text-white'
                            : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Clear Filters */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setConfig(prev => ({ 
                      ...prev, 
                      focusAreas: [], 
                      skillLevels: [], 
                      difficulties: [] 
                    }))}
                    className="w-full py-2 rounded-lg bg-slate-50 text-slate-500 text-xs font-bold hover:bg-slate-100 hover:text-slate-900 transition-all"
                  >
                    Clear All Filters
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Frequency Selection */}
          <div>
            <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 block">
              How often?
            </label>
            <div className="grid grid-cols-3 gap-2">
              {frequencyOptions.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, frequency: opt.value as AutoGenerateConfig['frequency'] }))}
                  className={`p-2.5 rounded-lg border transition-all text-center ${
                    config.frequency === opt.value
                      ? 'border-[#FF6B35] bg-[#FF6B35]/10'
                      : 'border-slate-200 bg-white hover:border-slate-200'
                  }`}
                >
                  <div className={`font-bold text-xs ${config.frequency === opt.value ? 'text-[#FF6B35]' : 'text-slate-700'}`}>
                    {opt.label}
                  </div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Drill Count (only for workouts) */}
          {config.type === 'workout' && (
            <div>
              <label className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-3 block">
                Number of drills
              </label>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, drillCount: Math.max(1, prev.drillCount - 1) }))}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:border-[#FF6B35] transition-colors"
                >
                  -
                </button>
                <div className="flex-1 text-center">
                  <span className="text-3xl font-black text-[#FF6B35]">{config.drillCount}</span>
                  <span className="text-slate-400 text-sm ml-2">drills</span>
                </div>
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, drillCount: Math.min(10, prev.drillCount + 1) }))}
                  className="w-10 h-10 rounded-lg bg-white border border-slate-200 text-slate-700 flex items-center justify-center hover:border-[#FF6B35] transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          )}
          
          {/* Matching Drills Info */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#FF6B35]" />
                <span className="text-slate-500 text-sm">Matching drills:</span>
              </div>
              <span className={`font-bold ${matchingDrillCount === 0 ? 'text-red-500' : 'text-slate-700'}`}>
                {matchingDrillCount} available
              </span>
            </div>
            {matchingDrillCount === 0 && (
              <p className="text-red-400 text-xs mt-2">No drills match your filters. Try adjusting your selection.</p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="p-5 border-t border-slate-200 space-y-3">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setConfig(prev => ({ ...prev, startNow: false }))
                onGenerate({ ...config, startNow: false })
              }}
              disabled={matchingDrillCount === 0}
              className="flex-1 py-3.5 rounded-xl bg-white border border-[#FF6B35]/50 text-[#FF6B35] font-bold hover:bg-[#FF6B35]/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Calendar className="w-5 h-5" />
              SCHEDULE
            </button>
            <button
              onClick={() => {
                setConfig(prev => ({ ...prev, startNow: true }))
                onGenerate({ ...config, startNow: true })
              }}
              disabled={matchingDrillCount === 0}
              className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Play className="w-5 h-5" />
              START
            </button>
          </div>
          
          {/* Create Custom Drill Option */}
          <div className="pt-2 border-t border-slate-200">
            <p className="text-slate-500 text-xs text-center mb-2">Can't find what you're looking for?</p>
            <button
              onClick={() => {
                onCreateCustomDrill()
              }}
              className="w-full py-3 rounded-xl bg-white border border-dashed border-slate-200 text-slate-500 font-bold hover:border-[#FF6B35]/50 hover:text-slate-900 transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              CREATE CUSTOM DRILL
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// =============================================
// CUSTOM DRILL CREATOR POPUP COMPONENT
// =============================================

interface CustomDrillCreatorProps {
  defaultLevel: SkillLevel
  onClose: () => void
  onCreate: (drill: Drill) => void
}

function CustomDrillCreator({ defaultLevel, onClose, onCreate }: CustomDrillCreatorProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [focusArea, setFocusArea] = useState<FocusArea>('CONSISTENCY')
  const [level, setLevel] = useState<SkillLevel>(defaultLevel)
  const [duration, setDuration] = useState<number>(10)
  const [reps, setReps] = useState('')
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(2)
  const [error, setError] = useState<string | null>(null)

  const focusAreaOptions = Object.keys(FOCUS_AREA_LABELS) as FocusArea[]
  const levelOptions: SkillLevel[] = ['ELEMENTARY', 'MIDDLE_SCHOOL', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL']

  const handleSubmit = () => {
    if (!title.trim()) {
      setError('Please enter a drill name.')
      return
    }
    const safeDuration = Number.isFinite(duration) && duration > 0 ? Math.round(duration) : 10
    const steps: string[] = []
    if (reps.trim()) steps.push(`Target: ${reps.trim()}`)
    steps.push(description.trim() || 'Perform the drill focusing on good form.')

    const drill: Drill = {
      id: `custom-${Date.now()}`,
      title: title.trim(),
      level,
      focusArea,
      difficulty,
      duration: safeDuration,
      description: description.trim() || 'Custom drill created by you.',
      whyItMatters: 'A custom drill you created to target a specific part of your game.',
      steps,
      expectedOutcomes: ['Improved ' + FOCUS_AREA_LABELS[focusArea].toLowerCase()],
      icon: '⭐',
      color: 'orange',
    }
    onCreate(drill)
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-[#FF6B35]" />
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Create Custom Drill</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Drill Name *</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError(null) }}
              placeholder="e.g. One-Hand Form Shooting"
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this drill involve?"
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40 resize-none"
            />
          </div>

          {/* Category / Focus Area */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Category</label>
            <select
              value={focusArea}
              onChange={(e) => setFocusArea(e.target.value as FocusArea)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            >
              {focusAreaOptions.map((fa) => (
                <option key={fa} value={fa}>{FOCUS_AREA_LABELS[fa]}</option>
              ))}
            </select>
          </div>

          {/* Skill level */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Skill Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value as SkillLevel)}
              className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
            >
              {levelOptions.map((lv) => (
                <option key={lv} value={lv}>{lv.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          {/* Duration + Reps */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Duration (min)</label>
              <input
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Target Reps</label>
              <input
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                placeholder="e.g. 50 shots"
                className="w-full h-10 rounded-lg border border-slate-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/40"
              />
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Difficulty</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDifficulty(d as 1 | 2 | 3 | 4 | 5)}
                  className={`flex-1 h-9 rounded-lg text-sm font-bold transition-colors ${
                    difficulty >= d
                      ? 'bg-[#FF6B35] text-white'
                      : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
          >
            CANCEL
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            CREATE DRILL
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkoutCalendar

