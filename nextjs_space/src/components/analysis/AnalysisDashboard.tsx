"use client"

import React, { useState } from "react"
import { Bone, Target, BarChart2, ChevronDown, BookOpen, GraduationCap, Award, Trophy, Star, Info, CircleDot, Lightbulb } from "lucide-react"

interface BiomechanicalMeasurements {
  shoulderAngle?: number  // SA
  elbowAngle?: number     // EA
  hipAngle?: number       // HA
  kneeAngle?: number      // KA
  ankleAngle?: number     // AA
  releaseHeight?: number  // RH (inches above standing height)
  releaseAngle?: number   // RA
  entryAngle?: number     // ENA
}

interface AnalysisDashboardProps {
  measurements: BiomechanicalMeasurements
}

// Skill level types
type SkillLevel = "middleSchool" | "highSchool" | "college" | "professional"

// Benchmark data for each skill level
// Values represent typical averages for players at each level
const SKILL_BENCHMARKS: Record<SkillLevel, { label: string; shortLabel: string; color: string; data: Record<string, number> }> = {
  middleSchool: {
    label: "Middle School",
    shortLabel: "MS",
    color: "#8b5cf6", // Purple
    data: {
      shoulderAngle: 145,   // Less shoulder rotation, abbreviated form
      elbowAngle: 75,       // Elbow tends to flare out more
      hipAngle: 150,        // Less hip extension
      kneeAngle: 115,       // Deeper bend, less efficient power transfer
      ankleAngle: 70,       // Less ankle flexibility
      releaseHeight: 85,    // Lower release point (shorter players, less elevation)
      releaseAngle: 38,     // Flatter shot trajectory
      entryAngle: 32,       // Shallower entry angle
    }
  },
  highSchool: {
    label: "High School",
    shortLabel: "HS",
    color: "#3b82f6", // Blue
    data: {
      shoulderAngle: 155,   // Better rotation developing
      elbowAngle: 82,       // More aligned elbow
      hipAngle: 160,        // Better hip extension
      kneeAngle: 125,       // More efficient bend
      ankleAngle: 78,       // Better ankle mobility
      releaseHeight: 95,    // Higher release point
      releaseAngle: 42,     // Better arc developing
      entryAngle: 38,       // Improved entry angle
    }
  },
  college: {
    label: "College",
    shortLabel: "COL",
    color: "#22c55e", // Green
    data: {
      shoulderAngle: 168,   // Near-optimal rotation
      elbowAngle: 88,       // Well-aligned elbow
      hipAngle: 172,        // Efficient hip extension
      kneeAngle: 138,       // Optimal power transfer
      ankleAngle: 88,       // Good ankle flexibility
      releaseHeight: 108,   // High release point
      releaseAngle: 48,     // Optimal arc
      entryAngle: 43,       // Good entry angle
    }
  },
  professional: {
    label: "Professional",
    shortLabel: "PRO",
    color: "#FFD700", // Gold
    data: {
      shoulderAngle: 175,   // Optimal shoulder rotation
      elbowAngle: 90,       // Perfect 90° elbow alignment
      hipAngle: 178,        // Full hip extension
      kneeAngle: 142,       // Optimal knee bend for power
      ankleAngle: 92,       // Optimal ankle position
      releaseHeight: 115,   // High, consistent release
      releaseAngle: 52,     // Optimal arc for highest make %
      entryAngle: 47,       // Optimal entry angle (45-48°)
    }
  }
}

const SKILL_LEVELS: SkillLevel[] = ["middleSchool", "highSchool", "college", "professional"]

// Optimal ranges for each measurement
const OPTIMAL_RANGES: Record<string, { min: number; max: number; unit: string; label: string }> = {
  shoulderAngle: { min: 160, max: 180, unit: "°", label: "Shoulder Angle (SA)" },
  elbowAngle: { min: 85, max: 95, unit: "°", label: "Elbow Angle (EA)" },
  hipAngle: { min: 165, max: 180, unit: "°", label: "Hip Angle (HA)" },
  kneeAngle: { min: 130, max: 150, unit: "°", label: "Knee Angle (KA)" },
  ankleAngle: { min: 80, max: 100, unit: "°", label: "Ankle Angle (AA)" },
  releaseHeight: { min: 100, max: 120, unit: "in", label: "Release Height (RH)" },
  releaseAngle: { min: 45, max: 55, unit: "°", label: "Release Angle (RA)" },
  entryAngle: { min: 40, max: 50, unit: "°", label: "Entry Angle (ENA)" },
}

// Find which skill level the value is closest to
function findClosestSkillLevel(key: string, value: number): SkillLevel {
  let closestLevel: SkillLevel = "middleSchool"
  let smallestDiff = Infinity

  for (const level of SKILL_LEVELS) {
    const benchmarkValue = SKILL_BENCHMARKS[level].data[key]
    const diff = Math.abs(value - benchmarkValue)
    if (diff < smallestDiff) {
      smallestDiff = diff
      closestLevel = level
    }
  }
  return closestLevel
}

// Calculate a score (0-100) based on how close the value is to the optimal range
function calculateScore(key: string, value: number): number {
  const range = OPTIMAL_RANGES[key]
  if (!range) return 50

  // If within optimal range, score is 80-100
  if (value >= range.min && value <= range.max) {
    const midpoint = (range.min + range.max) / 2
    const distanceFromMid = Math.abs(value - midpoint)
    const maxDistance = (range.max - range.min) / 2
    return 100 - (distanceFromMid / maxDistance) * 20
  }

  // If outside optimal range, calculate based on distance
  const rangeSize = range.max - range.min
  if (value < range.min) {
    const distance = range.min - value
    return Math.max(0, 80 - (distance / rangeSize) * 60)
  } else {
    const distance = value - range.max
    return Math.max(0, 80 - (distance / rangeSize) * 60)
  }
}

// 2-tier color system: red (<65) and green (≥65)
function getBarColors(score: number) {
  const isGood = score >= 65
  return {
    border: isGood ? "#22c55e" : "#ef4444",
    bg: isGood ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
    glow: isGood ? "shadow-green-500/50" : "shadow-red-500/50",
    text: isGood ? "text-green-400" : "text-red-400",
    badge: isGood
      ? <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded text-xs">Good</span>
      : <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs">Needs Work</span>
  }
}

// Video game-style progress bar component for biomechanical measurements
function GameStyleProgressBar({
  percentage,
  colors,
  unit,
  optimalMin,
  optimalMax
}: {
  percentage: number
  colors: ReturnType<typeof getBarColors>
  unit: string
  optimalMin: number
  optimalMax: number
}) {
  const segments = 10
  const filledSegments = Math.round((percentage / 100) * segments)

  return (
    <div className="space-y-1">
      {/* Progress bar with stripes */}
      <div
        className="h-3 relative overflow-hidden rounded-sm"
        style={{ borderLeft: `3px solid ${colors.border}`, borderRight: `3px solid ${colors.border}` }}
      >
        {/* Background (unfilled) with gray stripes */}
        <div className="absolute inset-0 bg-[#1a1a1a]">
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -60deg,
                transparent,
                transparent 2px,
                #333 2px,
                #333 4px
              )`
            }}
          />
          {/* Segment dividers */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-[#2a2a2a]/50 last:border-r-0" />
            ))}
          </div>
        </div>

        {/* Filled portion with colored stripes */}
        <div
          className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.bg} transition-all duration-700 ease-out shadow-lg ${colors.glow}`}
          style={{ width: `${percentage}%` }}
        >
          {/* Diagonal stripes overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `repeating-linear-gradient(
                -60deg,
                transparent,
                transparent 3px,
                rgba(0,0,0,0.3) 3px,
                rgba(0,0,0,0.3) 6px
              )`
            }}
          />
          {/* Shine effect at top */}
          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/25 to-transparent" />
          {/* Segment highlights */}
          <div className="absolute inset-0 flex">
            {Array.from({ length: filledSegments }).map((_, i) => (
              <div key={i} className="flex-1 border-r border-white/10 last:border-r-0">
                <div className="h-1/4 bg-white/15 rounded-t-sm" />
              </div>
            ))}
          </div>
        </div>

        {/* Edge glow at end of progress */}
        {percentage > 0 && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-white/70 blur-sm transition-all duration-700"
            style={{ left: `calc(${percentage}% - 2px)` }}
          />
        )}

        {/* Optimal range indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-[#FFD700]/60"
          style={{ left: `${Math.min(100, Math.max(0, ((optimalMin - optimalMin + 20) / (optimalMax - optimalMin + 40)) * 100))}%` }}
        />
      </div>

      {/* Optimal range text */}
      <p className="text-[#888] text-xs flex items-center gap-1">
        <span className="w-2 h-0.5 bg-[#FFD700]/60 inline-block" />
        Optimal: {optimalMin}{unit} - {optimalMax}{unit}
      </p>
    </div>
  )
}

// Benchmark comparison component - shows skill level markers on a scale
function BenchmarkComparison({
  measurementKey,
  currentValue,
  unit
}: {
  measurementKey: string
  currentValue: number
  unit: string
}) {
  const closestLevel = findClosestSkillLevel(measurementKey, currentValue)
  const closestBenchmark = SKILL_BENCHMARKS[closestLevel]

  // Get min and max values across all benchmarks for this measurement
  const allBenchmarkValues = SKILL_LEVELS.map(level => SKILL_BENCHMARKS[level].data[measurementKey])
  const minBench = Math.min(...allBenchmarkValues)
  const maxBench = Math.max(...allBenchmarkValues)
  const range = maxBench - minBench

  // Calculate position for current value (with some padding)
  const paddedMin = minBench - range * 0.1
  const paddedMax = maxBench + range * 0.1
  const paddedRange = paddedMax - paddedMin

  const getPosition = (value: number) => {
    return Math.min(100, Math.max(0, ((value - paddedMin) / paddedRange) * 100))
  }

  const currentPos = getPosition(currentValue);

  return (
    <div className="mt-3 pt-3 border-t border-[#2a2a2a]">
      {/* Simple title that kids can understand */}
      <div className="text-[#FFD700] text-xs font-bold mb-2 flex items-center gap-1">
        <BarChart2 className="w-4 h-4 mr-1" />
        <span>How Do You Compare to Other Players?</span>
      </div>

      {/* Your level badge - made prominent and clear */}
      <div
        className="flex items-center gap-2 mb-3 p-2 rounded-lg"
        style={{
          backgroundColor: `${closestBenchmark.color}15`,
          border: `1px solid ${closestBenchmark.color}40`
        }}
      >
        <span className="text-white text-xs flex items-center gap-1"><CircleDot className="w-4 h-4 mr-1" /> Your Level:</span>
        <div
          className="flex items-center gap-1.5 px-2 py-1 rounded font-bold text-sm"
          style={{
            backgroundColor: `${closestBenchmark.color}30`,
            color: closestBenchmark.color,
            boxShadow: `0 0 12px ${closestBenchmark.color}40`
          }}
        >
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: closestBenchmark.color }} />
          {closestBenchmark.label}
        </div>
      </div>

      {/* Scale labels: Beginner to Advanced */}
      <div className="flex justify-between items-center mb-1 px-1">
        <span className="text-[10px] text-[#888]">← Beginner</span>
        <span className="text-[10px] text-[#888]">Advanced →</span>
      </div>

      {/* Benchmark scale bar */}
      <div className="relative h-8 bg-[#1a1a1a] rounded overflow-visible">
        {/* Background gradient showing progression */}
        <div
          className="absolute inset-0 opacity-20 rounded"
          style={{
            background: `linear-gradient(to right,
              ${SKILL_BENCHMARKS.middleSchool.color},
              ${SKILL_BENCHMARKS.highSchool.color},
              ${SKILL_BENCHMARKS.college.color},
              ${SKILL_BENCHMARKS.professional.color})`
          }}
        />

        {/* Benchmark markers */}
        {SKILL_LEVELS.map((level) => {
          const benchmark = SKILL_BENCHMARKS[level]
          const pos = getPosition(benchmark.data[measurementKey])
          const isClosest = level === closestLevel

          return (
            <div
              key={level}
              className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
              style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
            >
              {/* Marker line */}
              <div
                className={`w-0.5 h-full ${isClosest ? 'opacity-100' : 'opacity-40'}`}
                style={{ backgroundColor: benchmark.color }}
              />
              {/* Level short label below the bar */}
              <div
                className={`absolute -bottom-4 text-[8px] font-bold whitespace-nowrap ${isClosest ? 'opacity-100' : 'opacity-50'}`}
                style={{ color: benchmark.color }}
              >
                {benchmark.shortLabel}
              </div>
            </div>
          )
        })}

        {/* "YOU ARE HERE" arrow and marker */}
        <div
          className="absolute z-10"
          style={{ left: `${currentPos}%`, transform: 'translateX(-50%)', top: '-22px' }}
        >
          {/* Arrow pointing down with "YOU" label */}
          <div className="flex flex-col items-center">
            <span className="text-[9px] font-bold text-white bg-[#FFD700] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
              YOU
            </span>
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-[#FFD700]" />
          </div>
        </div>

        {/* Current value marker - diamond shape */}
        <div
          className="absolute top-1/2 -translate-y-1/2 z-10"
          style={{ left: `${currentPos}%`, transform: 'translateX(-50%) translateY(-50%)' }}
        >
          <div
            className="w-4 h-4 rotate-45 border-2 border-[#FFD700] bg-[#050505]"
            style={{ boxShadow: '0 0 12px rgba(255,215,0,0.6)' }}
          />
        </div>
      </div>

      {/* Level names below with friendly labels */}
      <div className="flex justify-between mt-6 px-0">
        {SKILL_LEVELS.map((level) => {
          const benchmark = SKILL_BENCHMARKS[level]
          const isClosest = level === closestLevel
          return (
            <div
              key={level}
              className={`flex flex-col items-center transition-all ${isClosest ? 'scale-110' : 'opacity-50'}`}
            >
              <span
                className={`text-[9px] font-bold ${isClosest ? '' : ''}`}
                style={{ color: benchmark.color }}
              >
                {benchmark.label}
              </span>
              <span className="text-[8px] text-[#666]">
                {benchmark.data[measurementKey]}{unit}
              </span>
            </div>
          )
        })}
      </div>

      {/* Simple legend explaining the markers */}
      <div className="mt-3 pt-2 border-t border-[#2a2a2a]/50 flex flex-wrap gap-x-4 gap-y-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rotate-45 border border-[#FFD700] bg-[#050505]" />
          <span className="text-[9px] text-[#888]">= Your measurement</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-3 bg-[#888]" />
          <span className="text-[9px] text-[#888]">= Average for each level</span>
        </div>
      </div>
    </div>
  )
}

// Educational Guide Data - Simple explanations for each metric
const METRIC_GUIDES = {
  shoulderAngle: {
    name: "Shoulder Angle",
    icon: "shoulder",
    whyItMatters: "Your shoulder is like the launchpad for your shot. When your shoulder is at the right angle, it helps you aim straight at the basket. Think of it like throwing a paper airplane - if you hold it at a weird angle, it won't fly straight!",
    optimal: { min: 85, max: 95, description: "This is the 'sweet spot' where your shoulder gives you the best aim and power. Most great shooters keep their shoulder right around 90 degrees." },
    acceptable: { min: 75, max: 105, description: "Your shot can still go in, but you might find it harder to be consistent. Some shots will feel great, others might feel off." },
    poor: { description: "When your shoulder angle is way off, it's like trying to throw a dart while looking sideways. The ball might still go in sometimes, but it's much harder to repeat good shots." },
    tip: "Practice in front of a mirror! Watch your shoulder as you shoot and try to keep it level with the basket."
  },
  elbowAngle: {
    name: "Elbow Angle",
    icon: "elbow",
    whyItMatters: "Your elbow is like the steering wheel of your shot. If your elbow points outward (like a chicken wing), the ball will go left or right instead of straight at the basket. A tucked elbow keeps everything lined up!",
    optimal: { min: 85, max: 95, description: "When your elbow is at 90 degrees, it creates a perfect 'L' shape that gives you the most control and accuracy." },
    acceptable: { min: 75, max: 105, description: "A little bit off is okay, but you might notice some shots drifting left or right." },
    poor: { description: "A really flared elbow is one of the most common shooting mistakes. It's like trying to pour water from a crooked pitcher - it doesn't go where you want!" },
    tip: "Imagine you're reaching into a tall cookie jar on a high shelf. Your elbow naturally tucks in - that's exactly what you want!"
  },
  hipAngle: {
    name: "Hip Angle",
    icon: "hip",
    whyItMatters: "Your hips are like the engine of your shot! They connect your legs (the power source) to your upper body (the aiming system). Good hip position helps transfer energy from your legs all the way up to your fingertips.",
    optimal: { min: 165, max: 180, description: "A slight forward lean with your hips gives you balance and power. You're not too bent over, not standing too straight." },
    acceptable: { min: 150, max: 180, description: "You can still shoot well, but you might feel a bit off-balance or lose some power." },
    poor: { description: "If your hips are too bent or too straight, it's like trying to throw a ball while sitting down - you lose all your power from your legs!" },
    tip: "Think about sitting back slightly into an invisible chair, but not too much. Your hips should feel strong and stable."
  },
  kneeAngle: {
    name: "Knee Angle",
    icon: "knee",
    whyItMatters: "Your knees are like springs! They store up energy when you bend them, then release that energy to power your shot. No knee bend = no power. Too much bend = you get tired and slow.",
    optimal: { min: 130, max: 145, description: "This is the perfect 'loaded spring' position. Enough bend to generate power, but not so much that you're tired or slow." },
    acceptable: { min: 120, max: 155, description: "Your shot still has power, but you might be working harder than you need to, or not getting as much lift." },
    poor: { description: "Standing too straight means no power from your legs - all arm! Too bent and you're wasting energy. Either way, your shot suffers." },
    tip: "Before you catch the ball, bounce lightly on your toes. This automatically puts your knees in a good ready position."
  },
  ankleAngle: {
    name: "Ankle Angle",
    icon: "ankle",
    whyItMatters: "Your ankles are the foundation of everything! They keep you balanced and help transfer power from the ground up through your whole body. Think of them like the roots of a tree - they keep everything stable.",
    optimal: { min: 80, max: 90, description: "A slight forward lean at the ankles means you're balanced and ready to explode upward." },
    acceptable: { min: 70, max: 100, description: "You can still shoot, but you might feel a bit wobbly or lose some explosiveness." },
    poor: { description: "Bad ankle angles mean poor balance. It's like trying to shoot while standing on a wobbly board - everything else gets thrown off!" },
    tip: "Make sure your weight is on the balls of your feet (the padded part behind your toes), not your heels. This naturally sets your ankles right."
  }
}

// Skill Level Guide Data
const SKILL_LEVEL_GUIDE = [
  {
    level: "Middle School",
    icon: "star",
    color: "#8b5cf6",
    bgColor: "from-purple-500/20 to-purple-600/10",
    borderColor: "border-purple-500/40",
    stage: "Beginner Stage",
    description: "This is where everyone starts! You're learning the basics of how to hold the ball, where to put your feet, and how to follow through. Don't worry about being perfect - focus on building good habits.",
    whatToExpect: [
      "Your form might feel awkward at first - that's totally normal!",
      "Some shots will feel great, others won't - you're still figuring things out",
      "Focus on one thing at a time instead of trying to fix everything"
    ],
    encouragement: "Every NBA star started right here. The key is to keep practicing and stay patient!"
  },
  {
    level: "High School",
    icon: "graduationCap",
    color: "#3b82f6",
    bgColor: "from-blue-500/20 to-blue-600/10",
    borderColor: "border-blue-500/40",
    stage: "Developing Stage",
    description: "You've got the basics down! Now it's time to make your shot more consistent and reliable. You know what good form looks like - now you're training your muscles to remember it.",
    whatToExpect: [
      "Your good shots are really good, but you still have some inconsistency",
      "You can feel when something is wrong, even if you're not sure how to fix it",
      "Game pressure might cause your form to break down sometimes"
    ],
    encouragement: "You're building the foundation that will last your whole basketball career!"
  },
  {
    level: "College",
    icon: "award",
    color: "#22c55e",
    bgColor: "from-green-500/20 to-green-600/10",
    borderColor: "border-green-500/40",
    stage: "Advanced Stage",
    description: "Your mechanics are solid! You've put in the work and it shows. At this level, you're fine-tuning small details that make the difference between good and great.",
    whatToExpect: [
      "Most of your shots feel natural and automatic",
      "You can maintain good form even under pressure",
      "Small adjustments can lead to big improvements"
    ],
    encouragement: "You're in the top tier of shooters. Keep refining those details!"
  },
  {
    level: "Professional",
    icon: "trophy",
    color: "#FFD700",
    bgColor: "from-yellow-500/20 to-yellow-600/10",
    borderColor: "border-yellow-400/40",
    stage: "Elite Stage",
    description: "This is the highest level! Your shooting mechanics are nearly perfect. At this stage, it's all about maintaining excellence and making tiny tweaks for specific situations.",
    whatToExpect: [
      "Your form is automatic - you don't have to think about it",
      "Consistency is your superpower",
      "You're working on advanced techniques and situational shooting"
    ],
    encouragement: "You've reached the mountaintop. Now help others climb it too!"
  }
]

// Educational Guide Component
function EducationalGuide({ isOpen, onToggle }: { isOpen: boolean; onToggle: () => void }) {
  const [activeMetric, setActiveMetric] = useState<string | null>(null)
  const [activeLevel, setActiveLevel] = useState<number | null>(null)

  const getMetricIcon = (iconType: string) => {
    switch (iconType) {
      case "shoulder": return <CircleDot className="w-5 h-5" />
      case "elbow": return <CircleDot className="w-5 h-5" />
      case "hip": return <CircleDot className="w-5 h-5" />
      case "knee": return <CircleDot className="w-5 h-5" />
      case "ankle": return <CircleDot className="w-5 h-5" />
      default: return <CircleDot className="w-5 h-5" />
    }
  }

  const getLevelIcon = (iconType: string) => {
    switch (iconType) {
      case "star": return <Star className="w-5 h-5" />
      case "graduationCap": return <GraduationCap className="w-5 h-5" />
      case "award": return <Award className="w-5 h-5" />
      case "trophy": return <Trophy className="w-5 h-5" />
      default: return <Star className="w-5 h-5" />
    }
  }

  return (
    <div className="mt-6 border border-[#3a3a3a] rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d]">
      {/* Header - Always Visible */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] hover:from-[#333] hover:to-[#222] transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30 group-hover:border-[#FFD700]/50 transition-all">
            <BookOpen className="w-5 h-5 text-[#FFD700]" />
          </div>
          <div className="text-left">
            <h3 className="font-russo text-lg text-[#FFD700] uppercase tracking-wider" style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.25)' }}>
              Understanding Your Metrics
            </h3>
            <p className="text-[#888] text-xs">Learn what each measurement means in simple terms</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-[#FFD700] transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
      </button>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[3000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 space-y-6">

          {/* Joint Angles Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bone className="w-4 h-4 text-[#FFD700]" />
              <h4 className="font-russo text-sm text-[#FFD700] uppercase tracking-wider">Joint Angles Explained</h4>
            </div>
            <p className="text-[#aaa] text-sm mb-4 leading-relaxed">
              Your body is like a machine with many moving parts. Each joint angle affects how your shot travels to the basket.
              Click on any angle below to learn more!
            </p>

            {/* Metric Cards Grid */}
            <div className="grid grid-cols-1 gap-3">
              {Object.entries(METRIC_GUIDES).map(([key, guide]) => (
                <div key={key} className="border border-[#3a3a3a] rounded-lg overflow-hidden bg-[#1a1a1a]/50">
                  {/* Metric Header */}
                  <button
                    onClick={() => setActiveMetric(activeMetric === key ? null : key)}
                    className="w-full flex items-center justify-between p-3 hover:bg-[#2a2a2a]/50 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/20">
                        {getMetricIcon(guide.icon)}
                      </div>
                      <span className="text-[#E5E5E5] font-bold uppercase text-sm">{guide.name}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#888] transition-transform duration-300 ${activeMetric === key ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${activeMetric === key ? 'max-h-[1000px]' : 'max-h-0'}`}>
                    <div className="p-4 pt-0 space-y-4 border-t border-[#2a2a2a]">
                      {/* Why It Matters */}
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Lightbulb className="w-4 h-4 text-yellow-400" />
                          <span className="text-yellow-400 text-xs font-bold uppercase tracking-wider">Why It Matters</span>
                        </div>
                        <p className="text-[#ccc] text-sm leading-relaxed">{guide.whyItMatters}</p>
                      </div>

                      {/* Range Indicators */}
                      <div className="grid grid-cols-1 gap-2">
                        {/* Optimal */}
                        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                            <span className="text-green-400 text-xs font-bold uppercase">Optimal: {guide.optimal.min}° - {guide.optimal.max}°</span>
                          </div>
                          <p className="text-green-400/80 text-xs leading-relaxed">{guide.optimal.description}</p>
                        </div>

                        {/* Acceptable */}
                        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <span className="text-yellow-400 text-xs font-bold uppercase">Acceptable: {guide.acceptable.min}° - {guide.acceptable.max}°</span>
                          </div>
                          <p className="text-yellow-400/80 text-xs leading-relaxed">{guide.acceptable.description}</p>
                        </div>

                        {/* Poor */}
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-red-400 text-xs font-bold uppercase">Needs Work: Outside ranges above</span>
                          </div>
                          <p className="text-red-400/80 text-xs leading-relaxed">{guide.poor.description}</p>
                        </div>
                      </div>

                      {/* Pro Tip */}
                      <div className="bg-[#FFD700]/10 border border-[#FFD700]/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <Star className="w-4 h-4 text-[#FFD700]" />
                          <span className="text-[#FFD700] text-xs font-bold uppercase">Pro Tip</span>
                        </div>
                        <p className="text-[#FFD700]/80 text-xs leading-relaxed">{guide.tip}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-[#3a3a3a]" />

          {/* Skill Levels Section */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <GraduationCap className="w-4 h-4 text-[#FFD700]" />
              <h4 className="font-russo text-sm text-[#FFD700] uppercase tracking-wider">Skill Level Guide</h4>
            </div>
            <p className="text-[#aaa] text-sm mb-4 leading-relaxed">
              We compare your shooting form to players at different skill levels. Here&apos;s what each level means and what you can expect at each stage of your basketball journey!
            </p>

            {/* Level Cards */}
            <div className="grid grid-cols-1 gap-3">
              {SKILL_LEVEL_GUIDE.map((level, idx) => (
                <div key={idx} className={`border ${level.borderColor} rounded-lg overflow-hidden bg-gradient-to-br ${level.bgColor}`}>
                  {/* Level Header */}
                  <button
                    onClick={() => setActiveLevel(activeLevel === idx ? null : idx)}
                    className="w-full flex items-center justify-between p-3 hover:bg-black/10 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center border"
                        style={{ backgroundColor: `${level.color}20`, borderColor: `${level.color}50`, color: level.color }}
                      >
                        {getLevelIcon(level.icon)}
                      </div>
                      <div className="text-left">
                        <span className="text-[#E5E5E5] font-bold uppercase text-sm">{level.level}</span>
                        <p className="text-xs" style={{ color: level.color }}>{level.stage}</p>
                      </div>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-[#888] transition-transform duration-300 ${activeLevel === idx ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Expanded Content */}
                  <div className={`overflow-hidden transition-all duration-300 ${activeLevel === idx ? 'max-h-[500px]' : 'max-h-0'}`}>
                    <div className="p-4 pt-0 space-y-3 border-t border-[#2a2a2a]/50">
                      <p className="text-[#ccc] text-sm leading-relaxed">{level.description}</p>

                      {/* What to Expect */}
                      <div>
                        <span className="text-[#888] text-xs font-bold uppercase tracking-wider">What to Expect:</span>
                        <ul className="mt-2 space-y-1">
                          {level.whatToExpect.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-[#aaa] text-xs">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: level.color }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Encouragement */}
                      <div className="bg-black/20 rounded-lg p-3 border-l-2" style={{ borderColor: level.color }}>
                        <p className="text-sm italic" style={{ color: level.color }}>&quot;{level.encouragement}&quot;</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips Section */}
          <div className="bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-[#FFD700]" />
              <span className="font-russo text-sm text-[#FFD700] uppercase tracking-wider">Remember!</span>
            </div>
            <ul className="space-y-2">
              <li className="flex items-start gap-2 text-[#ccc] text-sm">
                <span className="text-[#FFD700] mt-0.5">•</span>
                <span>Everyone&apos;s body is different! These ranges are guidelines, not rules set in stone.</span>
              </li>
              <li className="flex items-start gap-2 text-[#ccc] text-sm">
                <span className="text-[#FFD700] mt-0.5">•</span>
                <span>The best shooters focus on one thing at a time. Don&apos;t try to fix everything at once!</span>
              </li>
              <li className="flex items-start gap-2 text-[#ccc] text-sm">
                <span className="text-[#FFD700] mt-0.5">•</span>
                <span>Consistent practice beats perfect practice. 50 okay shots beat 5 perfect shots.</span>
              </li>
              <li className="flex items-start gap-2 text-[#ccc] text-sm">
                <span className="text-[#FFD700] mt-0.5">•</span>
                <span>Your shot will feel weird when you change it - that&apos;s normal! Give it time.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

// Collapsible Section Header Component (for main sections like "Joint Angles")
function CollapsibleSectionHeader({
  title,
  subtitle,
  isOpen,
  onToggle,
  icon
}: {
  title: string
  subtitle?: string
  isOpen: boolean
  onToggle: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-t-lg border-b border-[#FFD700]/30 hover:from-[#333] hover:to-[#222] transition-all duration-300 group"
    >
      <div className="flex items-center gap-4">
        {/* Icon with glow */}
        <div className="w-12 h-12 rounded-lg bg-[#FFD700]/10 flex items-center justify-center border border-[#FFD700]/30 group-hover:border-[#FFD700]/50 transition-all">
          {icon}
        </div>
        <div className="text-left">
          <h3 className="font-russo text-2xl text-[#FFD700] uppercase tracking-wider" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.3)' }}>
            {title}
          </h3>
          {subtitle && <p className="text-[#888] text-xs uppercase tracking-wider">{subtitle}</p>}
        </div>
      </div>
      {/* Animated Arrow */}
      <ChevronDown className={`w-6 h-6 text-[#FFD700] transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
    </button>
  )
}

// Individual Metric Collapsible Component (for each metric like "SHOULDER ANGLE")
function CollapsibleMetricItem({
  metricKey,
  value,
  range,
  score,
  colors,
  percentage,
  isOpen,
  onToggle
}: {
  metricKey: string
  value: number
  range: { min: number; max: number; unit: string; label: string }
  score: number
  colors: ReturnType<typeof getBarColors>
  percentage: number
  isOpen: boolean
  onToggle: () => void
}) {
  // Extract the metric name without the abbreviation for the title
  const metricName = range.label.split(' (')[0]

  return (
    <div className="border border-[#FFD700]/30 rounded-lg overflow-hidden bg-[#1a1a1a]/50 hover:border-[#FFD700]/50 transition-all">
      {/* Metric Header - Clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#1a1a1a] to-[#0a0a0a] hover:from-[#222] hover:to-[#111] transition-all duration-300 group"
      >
        <div className="flex items-center gap-3">
          {/* Animated Arrow */}
          <ChevronDown className={`w-5 h-5 text-[#FFD700] transition-transform duration-300 ${isOpen ? 'rotate-0' : '-rotate-90'}`} />
          {/* Metric Title - Russo One Video Game Style */}
          <h4
            className="font-russo text-lg text-[#FFD700] uppercase tracking-wider"
            style={{ textShadow: '0 0 15px rgba(255, 215, 0, 0.25)' }}
          >
            {metricName}
          </h4>
        </div>

        {/* Quick Stats on Header */}
        <div className="flex items-center gap-3">
          <span className={`font-mono font-bold text-lg ${colors.text}`}>
            {value}{range.unit}
          </span>
          {colors.badge}
        </div>
      </button>

      {/* Expandable Content */}
      <div
        className={`overflow-hidden transition-all duration-400 ease-in-out ${isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="p-4 pt-2 space-y-3 border-t border-[#2a2a2a]">
          {/* Score Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-[#888]">Score:</span>
            <span className={`font-bold ${colors.text}`}>{Math.round(score)}%</span>
          </div>

          {/* Progress Bar */}
          <GameStyleProgressBar
            percentage={percentage}
            colors={colors}
            unit={range.unit}
            optimalMin={range.min}
            optimalMax={range.max}
          />

          {/* Benchmark Comparison */}
          <BenchmarkComparison
            measurementKey={metricKey}
            currentValue={value}
            unit={range.unit}
          />
        </div>
      </div>
    </div>
  )
}

export function AnalysisDashboard({ measurements }: AnalysisDashboardProps) {
  // Section-level state - all collapsed by default
  const [jointAnglesOpen, setJointAnglesOpen] = React.useState(false)
  const [releaseMetricsOpen, setReleaseMetricsOpen] = React.useState(false)
  const [educationalGuideOpen, setEducationalGuideOpen] = React.useState(false)

  // Individual metric state - all collapsed by default
  const [openMetrics, setOpenMetrics] = React.useState<Record<string, boolean>>({
    shoulderAngle: false,
    elbowAngle: false,
    hipAngle: false,
    kneeAngle: false,
    ankleAngle: false,
    releaseHeight: false,
    releaseAngle: false,
    entryAngle: false,
  })

  const toggleMetric = (key: string) => {
    setOpenMetrics(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Count good and needs work based on scores
  const allKeys = ["shoulderAngle", "elbowAngle", "hipAngle", "kneeAngle", "ankleAngle", "releaseHeight", "releaseAngle", "entryAngle"]
  const scores = allKeys.map(key => {
    const value = measurements[key as keyof BiomechanicalMeasurements]
    return value !== undefined ? calculateScore(key, value) : null
  }).filter(s => s !== null) as number[]
  const goodCount = scores.filter(s => s >= 65).length
  const needsWorkCount = scores.filter(s => s < 65).length

  // Calculate section scores
  const jointAngleKeys = ["shoulderAngle", "elbowAngle", "hipAngle", "kneeAngle", "ankleAngle"]
  const releaseMetricKeys = ["releaseHeight", "releaseAngle", "entryAngle"]

  const jointAngleScores = jointAngleKeys.map(key => {
    const value = measurements[key as keyof BiomechanicalMeasurements]
    return value !== undefined ? calculateScore(key, value) : null
  }).filter(s => s !== null) as number[]
  const jointAngleAvg = jointAngleScores.length > 0 ? Math.round(jointAngleScores.reduce((a, b) => a + b, 0) / jointAngleScores.length) : 0

  const releaseMetricScores = releaseMetricKeys.map(key => {
    const value = measurements[key as keyof BiomechanicalMeasurements]
    return value !== undefined ? calculateScore(key, value) : null
  }).filter(s => s !== null) as number[]
  const releaseMetricAvg = releaseMetricScores.length > 0 ? Math.round(releaseMetricScores.reduce((a, b) => a + b, 0) / releaseMetricScores.length) : 0

  return (
    <div className="space-y-6">
      {/* Summary Stats Banner */}
      <div className="bg-gradient-to-r from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-4xl font-black text-[#FFD700]" style={{ textShadow: '0 0 20px rgba(255, 215, 0, 0.4)' }}>
                {goodCount + needsWorkCount}
              </p>
              <p className="text-[#888] text-xs uppercase tracking-wider">Total Metrics</p>
            </div>
            <div className="w-px h-12 bg-[#3a3a3a]" />
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-bold text-xl">{goodCount}</span>
                <span className="text-[#888] text-sm">Good</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-bold text-xl">{needsWorkCount}</span>
                <span className="text-[#888] text-sm">Needs Work</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[#888] text-xs uppercase tracking-wider mb-1">Overall Score</p>
            <p className={`text-3xl font-black ${Math.round((goodCount / (goodCount + needsWorkCount)) * 100) >= 65 ? 'text-green-400' : 'text-red-400'}`}>
              {Math.round((goodCount / (goodCount + needsWorkCount)) * 100)}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Joint Angles Section - Collapsible with nested metric dropdowns */}
        <div className="bg-[#3a3a3a] rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }}>
          <CollapsibleSectionHeader
            title="Joint Angles"
            subtitle={`Average Score: ${jointAngleAvg}%`}
            isOpen={jointAnglesOpen}
            onToggle={() => setJointAnglesOpen(!jointAnglesOpen)}
            icon={<Bone className="w-6 h-6 text-[#FFD700]" />}
          />
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${jointAnglesOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="p-4 space-y-3">
              {jointAngleKeys.map((key) => {
                const value = measurements[key as keyof BiomechanicalMeasurements]
                if (value === undefined) return null

                const range = OPTIMAL_RANGES[key]
                const score = calculateScore(key, value)
                const colors = getBarColors(score)
                const percentage = Math.min(100, Math.max(0, ((value - range.min + 20) / (range.max - range.min + 40)) * 100))

                return (
                  <CollapsibleMetricItem
                    key={key}
                    metricKey={key}
                    value={value}
                    range={range}
                    score={score}
                    colors={colors}
                    percentage={percentage}
                    isOpen={openMetrics[key] ?? false}
                    onToggle={() => toggleMetric(key)}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* Release Metrics Section - Collapsible with nested metric dropdowns */}
        <div className="bg-[#3a3a3a] rounded-xl overflow-hidden shadow-lg" style={{ boxShadow: '0 0 30px rgba(0, 0, 0, 0.5)' }}>
          <CollapsibleSectionHeader
            title="Release Metrics"
            subtitle={`Average Score: ${releaseMetricAvg}%`}
            isOpen={releaseMetricsOpen}
            onToggle={() => setReleaseMetricsOpen(!releaseMetricsOpen)}
            icon={<Target className="w-6 h-6 text-[#FFD700]" />}
          />
          <div
            className={`overflow-hidden transition-all duration-500 ease-in-out ${releaseMetricsOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="p-4 space-y-3">
              {releaseMetricKeys.map((key) => {
                const value = measurements[key as keyof BiomechanicalMeasurements]
                if (value === undefined) return null

                const range = OPTIMAL_RANGES[key]
                const score = calculateScore(key, value)
                const colors = getBarColors(score)
                const percentage = Math.min(100, Math.max(0, ((value - range.min + 20) / (range.max - range.min + 40)) * 100))

                return (
                  <CollapsibleMetricItem
                    key={key}
                    metricKey={key}
                    value={value}
                    range={range}
                    score={score}
                    colors={colors}
                    percentage={percentage}
                    isOpen={openMetrics[key] ?? false}
                    onToggle={() => toggleMetric(key)}
                  />
                )
              })}

              {/* Summary Stats Panel */}
              <div className="mt-4 pt-4 border-t border-[#4a4a4a]">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-[#FFD700]" />
                  <h4 className="font-russo text-[#FFD700] text-sm uppercase tracking-wider">Quick Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg p-4 border border-green-500/30 hover:border-green-400/50 transition-all">
                    <p className="text-green-400 text-3xl font-black">{goodCount}</p>
                    <p className="text-green-400/70 text-xs uppercase tracking-wider">Good (≥65)</p>
                  </div>
                  <div className="bg-gradient-to-br from-red-500/20 to-red-600/10 rounded-lg p-4 border border-red-500/30 hover:border-red-400/50 transition-all">
                    <p className="text-red-400 text-3xl font-black">{needsWorkCount}</p>
                    <p className="text-red-400/70 text-xs uppercase tracking-wider">Needs Work (&lt;65)</p>
                  </div>
                </div>
              </div>

              {/* Educational Guide Section */}
              <EducationalGuide
                isOpen={educationalGuideOpen}
                onToggle={() => setEducationalGuideOpen(!educationalGuideOpen)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

