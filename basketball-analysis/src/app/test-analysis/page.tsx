"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  ChevronDown, 
  Lock, 
  Bookmark, 
  Flame, 
  Trophy,
  ArrowLeft,
  ArrowRight,
  Target,
  Info,
  Lightbulb,
  Star,
  GraduationCap
} from "lucide-react"

// ============================================
// TYPES & DATA
// ============================================

interface BiomechanicalMeasurements {
  shoulderAngle: number
  elbowAngle: number
  hipAngle: number
  kneeAngle: number
  ankleAngle: number
  releaseHeight: number
  releaseAngle: number
  entryAngle: number
}

type SkillLevel = "middleSchool" | "highSchool" | "college" | "professional"

// Benchmark data for each skill level
const SKILL_BENCHMARKS: Record<SkillLevel, { label: string; shortLabel: string; color: string; data: Record<string, number> }> = {
  middleSchool: {
    label: "Middle School",
    shortLabel: "MS",
    color: "#8b5cf6",
    data: {
      shoulderAngle: 145,
      elbowAngle: 75,
      hipAngle: 150,
      kneeAngle: 115,
      ankleAngle: 70,
      releaseHeight: 85,
      releaseAngle: 38,
      entryAngle: 32,
    }
  },
  highSchool: {
    label: "High School",
    shortLabel: "HS",
    color: "#3b82f6",
    data: {
      shoulderAngle: 155,
      elbowAngle: 82,
      hipAngle: 160,
      kneeAngle: 125,
      ankleAngle: 78,
      releaseHeight: 95,
      releaseAngle: 42,
      entryAngle: 38,
    }
  },
  college: {
    label: "College",
    shortLabel: "COL",
    color: "#22c55e",
    data: {
      shoulderAngle: 168,
      elbowAngle: 88,
      hipAngle: 172,
      kneeAngle: 138,
      ankleAngle: 88,
      releaseHeight: 108,
      releaseAngle: 48,
      entryAngle: 43,
    }
  },
  professional: {
    label: "Professional",
    shortLabel: "PRO",
    color: "#FF6B35",
    data: {
      shoulderAngle: 175,
      elbowAngle: 90,
      hipAngle: 178,
      kneeAngle: 142,
      ankleAngle: 92,
      releaseHeight: 115,
      releaseAngle: 52,
      entryAngle: 47,
    }
  }
}

const SKILL_LEVELS: SkillLevel[] = ["middleSchool", "highSchool", "college", "professional"]

// Optimal ranges for each measurement
const OPTIMAL_RANGES: Record<string, { min: number; max: number; unit: string; label: string }> = {
  shoulderAngle: { min: 160, max: 180, unit: "°", label: "Shoulder Angle" },
  elbowAngle: { min: 85, max: 95, unit: "°", label: "Elbow Angle" },
  hipAngle: { min: 165, max: 180, unit: "°", label: "Hip Angle" },
  kneeAngle: { min: 130, max: 150, unit: "°", label: "Knee Angle" },
  ankleAngle: { min: 80, max: 100, unit: "°", label: "Ankle Angle" },
  releaseHeight: { min: 100, max: 120, unit: "in", label: "Release Height" },
  releaseAngle: { min: 45, max: 55, unit: "°", label: "Release Angle" },
  entryAngle: { min: 40, max: 50, unit: "°", label: "Entry Angle" },
}

// Body part image paths - user's actual uploaded images
const BODY_PART_IMAGES: Record<string, string> = {
  shoulder: "/images/body-parts/shoulder.png",
  elbow: "/images/body-parts/elbow.png",
  hip: "/images/body-parts/hip.png",
  knee: "/images/body-parts/knee.png",
  ankle: "/images/body-parts/ankle.png",
  // For release metrics, we'll use the arm/hand imagery
  release: "/images/body-parts/shoulder.png",
  arc: "/images/body-parts/elbow.png",
  entry: "/images/body-parts/knee.png",
}

// Metric explanations - what each measurement means
const METRIC_MEANINGS: Record<string, {
  title: string
  bodyPart: string
  iconKey: string
  whyItMatters: string
  optimal: { description: string }
  acceptable: { description: string }
  poor: { description: string }
  tip: string
}> = {
  shoulderAngle: {
    title: "SHOULDER ANGLE",
    bodyPart: "Shoulder",
    iconKey: "shoulder",
    whyItMatters: "Your shoulder is like the launchpad for your shot. When your shoulder is at the right angle, it helps you aim straight at the basket. Think of it like throwing a paper airplane - if you hold it at a weird angle, it won't fly straight!",
    optimal: { description: "This is the 'sweet spot' where your shoulder gives you the best aim and power. Most great shooters keep their shoulder right around 90 degrees." },
    acceptable: { description: "Your shot can still go in, but you might find it harder to be consistent. Some shots will feel great, others might feel off." },
    poor: { description: "When your shoulder angle is way off, it's like trying to throw a dart while looking sideways. The ball might still go in sometimes, but it's much harder to repeat good shots." },
    tip: "Practice in front of a mirror! Watch your shoulder as you shoot and try to keep it level with the basket."
  },
  elbowAngle: {
    title: "ELBOW ANGLE",
    bodyPart: "Elbow",
    iconKey: "elbow",
    whyItMatters: "Your elbow is like the steering wheel of your shot. If your elbow points outward (like a chicken wing), the ball will go left or right instead of straight at the basket. A tucked elbow keeps everything lined up!",
    optimal: { description: "When your elbow is at 90 degrees, it creates a perfect 'L' shape that gives you the most control and accuracy." },
    acceptable: { description: "A little bit off is okay, but you might notice some shots drifting left or right." },
    poor: { description: "A really flared elbow is one of the most common shooting mistakes. It's like trying to pour water from a crooked pitcher - it doesn't go where you want!" },
    tip: "Imagine you're reaching into a tall cookie jar on a high shelf. Your elbow naturally tucks in - that's exactly what you want!"
  },
  hipAngle: {
    title: "HIP ANGLE",
    bodyPart: "Hip",
    iconKey: "hip",
    whyItMatters: "Your hips are like the engine of your shot! They connect your legs (the power source) to your upper body (the aiming system). Good hip position helps transfer energy from your legs all the way up to your fingertips.",
    optimal: { description: "A slight forward lean with your hips gives you balance and power. You're not too bent over, not standing too straight." },
    acceptable: { description: "You can still shoot well, but you might feel a bit off-balance or lose some power." },
    poor: { description: "If your hips are too bent or too straight, it's like trying to throw a ball while sitting down - you lose all your power from your legs!" },
    tip: "Think about sitting back slightly into an invisible chair, but not too much. Your hips should feel strong and stable."
  },
  kneeAngle: {
    title: "KNEE ANGLE",
    bodyPart: "Knee",
    iconKey: "knee",
    whyItMatters: "Your knees are like springs! They store up energy when you bend them, then release that energy to power your shot. No knee bend = no power. Too much bend = you get tired and slow.",
    optimal: { description: "This is the perfect 'loaded spring' position. Enough bend to generate power, but not so much that you're tired or slow." },
    acceptable: { description: "Your shot still has power, but you might be working harder than you need to, or not getting as much lift." },
    poor: { description: "Standing too straight means no power from your legs - all arm! Too bent and you're wasting energy. Either way, your shot suffers." },
    tip: "Before you catch the ball, bounce lightly on your toes. This automatically puts your knees in a good ready position."
  },
  ankleAngle: {
    title: "ANKLE ANGLE",
    bodyPart: "Ankle",
    iconKey: "ankle",
    whyItMatters: "Your ankles are the foundation of everything! They keep you balanced and help transfer power from the ground up through your whole body. Think of them like the roots of a tree - they keep everything stable.",
    optimal: { description: "A slight forward lean at the ankles means you're balanced and ready to explode upward." },
    acceptable: { description: "You can still shoot, but you might feel a bit wobbly or lose some explosiveness." },
    poor: { description: "Bad ankle angles mean poor balance. It's like trying to shoot while standing on a wobbly board - everything else gets thrown off!" },
    tip: "Make sure your weight is on the balls of your feet (the padded part behind your toes), not your heels. This naturally sets your ankles right."
  },
  releaseHeight: {
    title: "RELEASE HEIGHT",
    bodyPart: "Release",
    iconKey: "release",
    whyItMatters: "Release height is how high the ball is when it leaves your hand. A higher release point makes your shot harder to block and gives the ball a better angle to go in the basket. Think of it like shooting over a wall - the higher you release, the easier it clears!",
    optimal: { description: "At this height, your shot is virtually unblockable and creates the perfect arc toward the basket." },
    acceptable: { description: "Your release is decent, but taller defenders might be able to contest your shot more easily." },
    poor: { description: "A low release means defenders can easily block you, and your shot has a flat trajectory that's harder to make." },
    tip: "Extend your arm fully at release and release the ball at the peak of your jump. Think 'reach for the sky!'"
  },
  releaseAngle: {
    title: "RELEASE ANGLE",
    bodyPart: "Arc",
    iconKey: "arc",
    whyItMatters: "Release angle determines the arc of your shot - how high the ball travels on its way to the basket. The right arc gives the ball a bigger 'window' to go through the hoop. A flat shot has to be perfect; an arcing shot has more room for error!",
    optimal: { description: "This angle creates the perfect rainbow arc that gives your shot the best chance of going in." },
    acceptable: { description: "Your arc is decent, but you might be leaving some makes on the table with a flatter trajectory." },
    poor: { description: "Too flat or too high - either way, you're making shooting harder than it needs to be." },
    tip: "Aim for the ball to peak about 2-3 feet above the rim. Think 'over the mountain, not through the tunnel.'"
  },
  entryAngle: {
    title: "ENTRY ANGLE",
    bodyPart: "Entry",
    iconKey: "entry",
    whyItMatters: "Entry angle is the angle at which the ball enters the basket. A steeper entry angle means the ball is coming down more vertically, giving it a bigger target. It's the difference between dropping a ball straight into a bucket versus trying to slide it in from the side!",
    optimal: { description: "At this angle, the ball sees the maximum possible 'opening' of the rim - nearly 18 inches of target!" },
    acceptable: { description: "Your ball still has a good chance, but you're not maximizing the rim's opening." },
    poor: { description: "A shallow entry means the ball barely fits through the hoop. You need to be nearly perfect to make it." },
    tip: "Focus on your follow-through - a good snap of the wrist at release naturally improves your entry angle."
  }
}

// Calculate score based on optimal range
function calculateScore(key: string, value: number): number {
  const range = OPTIMAL_RANGES[key]
  if (!range) return 50

  if (value >= range.min && value <= range.max) {
    const midpoint = (range.min + range.max) / 2
    const distanceFromMid = Math.abs(value - midpoint)
    const maxDistance = (range.max - range.min) / 2
    return Math.round(100 - (distanceFromMid / maxDistance) * 20)
  }

  const rangeSize = range.max - range.min
  if (value < range.min) {
    const distance = range.min - value
    return Math.round(Math.max(0, 80 - (distance / rangeSize) * 60))
  } else {
    const distance = value - range.max
    return Math.round(Math.max(0, 80 - (distance / rangeSize) * 60))
  }
}

// Find closest skill level
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

// ============================================
// ANALYSIS CARD COMPONENT
// ============================================

interface AnalysisCardProps {
  metricKey: string
  value: number
  dragX: number
}

function AnalysisCard({ metricKey, value, dragX }: AnalysisCardProps) {
  const metric = METRIC_MEANINGS[metricKey]
  const range = OPTIMAL_RANGES[metricKey]
  const score = calculateScore(metricKey, value)
  const userLevel = findClosestSkillLevel(metricKey, value)
  const isGood = score >= 65

  // Dynamic glow based on swipe
  const leftGlow = dragX < -20 ? Math.min(Math.abs(dragX) / 100, 0.5) : 0
  const rightGlow = dragX > 20 ? Math.min(dragX / 100, 0.5) : 0

  // Calculate position on comparison bar
  const getPositionOnBar = (val: number) => {
    const minVal = SKILL_BENCHMARKS.middleSchool.data[metricKey] - 20
    const maxVal = SKILL_BENCHMARKS.professional.data[metricKey] + 20
    return ((val - minVal) / (maxVal - minVal)) * 100
  }

  const userPosition = getPositionOnBar(value)

  return (
    <div 
      className="relative rounded-2xl border-2 overflow-hidden bg-[#1a1a1a] transition-all duration-200"
      style={{
        borderColor: rightGlow > 0 ? `rgba(34, 197, 94, ${0.3 + rightGlow})` : leftGlow > 0 ? `rgba(59, 130, 246, ${0.3 + leftGlow})` : '#3a3a3a',
        boxShadow: rightGlow > 0 
          ? `0 0 30px rgba(34, 197, 94, ${rightGlow}), inset 0 0 30px rgba(34, 197, 94, ${rightGlow * 0.3})`
          : leftGlow > 0
            ? `0 0 30px rgba(59, 130, 246, ${leftGlow}), inset 0 0 30px rgba(59, 130, 246, ${leftGlow * 0.3})`
            : 'none'
      }}
    >
      {/* Banner */}
      <div className="relative h-28 overflow-hidden bg-gradient-to-br from-[#FF6B35]/20 via-[#1a1a1a] to-[#1a1a1a]">
        {/* Corner accents */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -top-8 -left-8 w-24 h-24 bg-[#FF6B35]/10 rounded-full blur-xl" />
          <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-[#FF6B35]/10 rounded-full blur-xl" />
        </div>
        
        {/* Body part image - YOUR uploaded icons with orange filter */}
        <div className="absolute inset-0 flex items-center justify-end pr-4">
          <div className="relative w-24 h-24">
            {/* Orange glow behind image */}
            <div className="absolute inset-0 bg-[#FF6B35] blur-xl scale-110 opacity-30" />
            {/* Your actual image with orange color filter */}
            <img 
              src={BODY_PART_IMAGES[metric.iconKey]} 
              alt={metric.bodyPart}
              className="w-full h-full object-contain rounded-full"
              style={{
                filter: 'sepia(1) saturate(5) hue-rotate(-15deg) brightness(1.1)'
              }}
            />
          </div>
        </div>
        
        {/* Title and subtitle */}
        <div className="absolute left-6 top-1/2 -translate-y-1/2">
          <h3 className="text-white font-bold text-xl uppercase tracking-wider">{metric.title}</h3>
          <p className="text-[#FF6B35] text-sm uppercase">Biomechanical Analysis</p>
        </div>
        
        {/* Bottom glow border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#FF6B35]/50 to-transparent" />
      </div>

      {/* Card Content */}
      <div className="p-6 space-y-5">
        {/* Score Section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[#FF6B35] text-4xl font-black">{value}{range.unit}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${isGood ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
              {isGood ? 'Good' : 'Needs Work'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-white text-2xl font-black">{score}%</span>
            <p className="text-[#888] text-xs">Score</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="h-4 bg-[#2a2a2a] rounded-full overflow-hidden relative">
            {/* Striped fill */}
            <div 
              className={`h-full rounded-full relative overflow-hidden ${isGood ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'}`}
              style={{ width: `${score}%` }}
            >
              <div 
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 3px, rgba(255,255,255,0.3) 3px, rgba(255,255,255,0.3) 6px)`
                }}
              />
            </div>
            {/* Optimal range marker */}
            <div className="absolute top-1/2 -translate-y-1/2 h-full flex items-center">
              <div 
                className="h-2 bg-[#FF6B35]/40 rounded"
                style={{ 
                  marginLeft: `${(range.min / 180) * 100}%`,
                  width: `${((range.max - range.min) / 180) * 100}%`
                }}
              />
            </div>
          </div>
          <p className="text-[#888] text-xs">Optimal: {range.min}{range.unit} - {range.max}{range.unit}</p>
        </div>

        {/* Why It Matters */}
        <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-4 h-4 text-orange-400" />
            <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider">Why It Matters</p>
          </div>
          <p className="text-[#999] text-sm leading-relaxed">{metric.whyItMatters}</p>
        </div>

        {/* Comparison Section */}
        <div className="bg-[#1e1e1e] rounded-xl p-4 border border-[#333]">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-4 h-4 text-[#FF6B35]" />
            <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wider">How Do You Compare to Other Players?</p>
          </div>

          {/* Your Level Badge */}
          <div className="flex items-center gap-2 mb-4 bg-[#2a2a2a] rounded-lg p-3 border border-[#3a3a3a]">
            <Target className="w-4 h-4 text-[#888]" />
            <span className="text-[#888] text-sm">Your Level:</span>
            <span 
              className="px-3 py-1 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: `${SKILL_BENCHMARKS[userLevel].color}20`,
                color: SKILL_BENCHMARKS[userLevel].color,
                border: `1px solid ${SKILL_BENCHMARKS[userLevel].color}40`
              }}
            >
              {SKILL_BENCHMARKS[userLevel].label}
            </span>
          </div>

          {/* Comparison Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-[#888] text-xs">
              <span>← Beginner</span>
              <span>Advanced →</span>
            </div>
            
            <div className="relative h-10 bg-gradient-to-r from-[#8b5cf6]/30 via-[#3b82f6]/30 via-[#22c55e]/30 to-[#FF6B35]/30 rounded-lg">
              {/* Level markers */}
              {SKILL_LEVELS.map((level, idx) => {
                const levelValue = SKILL_BENCHMARKS[level].data[metricKey]
                const position = getPositionOnBar(levelValue)
                return (
                  <div
                    key={level}
                    className="absolute top-0 bottom-0 flex flex-col items-center justify-center"
                    style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
                  >
                    <div 
                      className="w-1 h-full rounded"
                      style={{ backgroundColor: SKILL_BENCHMARKS[level].color }}
                    />
                  </div>
                )
              })}
              
              {/* User marker */}
              <div
                className="absolute top-0 flex flex-col items-center"
                style={{ left: `${userPosition}%`, transform: 'translateX(-50%)' }}
              >
                <div className="bg-[#FF6B35] text-white text-[10px] font-bold px-2 py-0.5 rounded mb-1">YOU</div>
                <div className="w-4 h-4 bg-[#FF6B35] rotate-45 border-2 border-white shadow-lg" />
              </div>
            </div>

            {/* Level labels */}
            <div className="flex justify-between text-[10px] mt-2">
              {SKILL_LEVELS.map((level) => {
                const levelValue = SKILL_BENCHMARKS[level].data[metricKey]
                const position = getPositionOnBar(levelValue)
                return (
                  <div
                    key={level}
                    className="text-center"
                    style={{ 
                      position: 'absolute',
                      left: `${position}%`,
                      transform: 'translateX(-50%)',
                      color: SKILL_BENCHMARKS[level].color
                    }}
                  >
                    <span className="font-bold">{SKILL_BENCHMARKS[level].shortLabel}</span>
                    <br />
                    <span className="text-[#888]">{levelValue}{range.unit}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-10 text-[10px] text-[#888]">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-[#FF6B35] rotate-45" />
              <span>= Your measurement</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-0.5 bg-[#888]" />
              <span>= Average for each level</span>
            </div>
          </div>
        </div>

        {/* Pro Tip */}
        <div className="bg-[#FF6B35]/10 rounded-xl p-4 border border-[#FF6B35]/30">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-[#FF6B35]" />
            <p className="text-[#FF6B35] text-xs font-semibold uppercase tracking-wider">Pro Tip</p>
          </div>
          <p className="text-[#FF6B35]/80 text-sm leading-relaxed">{metric.tip}</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function TestAnalysisPage() {
  // Sample measurements (would come from actual analysis)
  const measurements: BiomechanicalMeasurements = {
    shoulderAngle: 170,
    elbowAngle: 88,
    hipAngle: 175,
    kneeAngle: 140,
    ankleAngle: 85,
    releaseHeight: 108,
    releaseAngle: 48,
    entryAngle: 44,
  }

  const metricKeys = Object.keys(measurements) as (keyof BiomechanicalMeasurements)[]
  
  // Game state
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameStats, setGameStats] = useState({
    lockedIn: 0,
    saved: 0,
    currentStreak: 0,
    xp: 0
  })
  const [seenCards, setSeenCards] = useState<string[]>([])
  
  // Swipe state
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const currentMetricKey = metricKeys[currentIndex]
  const currentValue = measurements[currentMetricKey]

  // Handle swipe actions
  const handleAction = useCallback((action: 'lockIn' | 'save') => {
    setSeenCards(prev => [...prev, currentMetricKey])
    
    if (action === 'lockIn') {
      setGameStats(prev => ({
        ...prev,
        lockedIn: prev.lockedIn + 1,
        currentStreak: prev.currentStreak + 1,
        xp: prev.xp + 25
      }))
    } else {
      setGameStats(prev => ({
        ...prev,
        saved: prev.saved + 1,
        xp: prev.xp + 10
      }))
    }

    // Move to next card
    if (currentIndex < metricKeys.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
    
    setDragX(0)
  }, [currentIndex, currentMetricKey, metricKeys.length])

  // Touch/mouse handlers
  const handleStart = (clientX: number) => {
    setIsDragging(true)
    startX.current = clientX
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    const diff = clientX - startX.current
    setDragX(diff)
  }

  const handleEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (dragX > 100) {
      handleAction('lockIn')
    } else if (dragX < -100) {
      handleAction('save')
    } else {
      setDragX(0)
    }
  }

  // Navigate cards
  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }

  const goToNext = () => {
    if (currentIndex < metricKeys.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const isComplete = currentIndex >= metricKeys.length

  return (
    <div className="min-h-screen bg-[#050505] py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-wide">BIOMECHANICAL ANALYSIS</h2>
          <p className="text-[#FF6B35] text-sm font-semibold uppercase tracking-wider mt-1">SHOOTING FORM BREAKDOWN</p>
          
          {/* Stats Row */}
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
              <Flame className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-white font-bold">{gameStats.currentStreak}</span>
              <span className="text-[#666] text-sm">Streak</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
              <Lock className="w-4 h-4 text-[#888]" />
              <span className="text-white font-bold">{gameStats.lockedIn}</span>
              <span className="text-[#666] text-sm">Locked</span>
            </div>
            <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-[#333]">
              <Trophy className="w-4 h-4 text-[#FFD700]" />
              <span className="text-white font-bold">{gameStats.xp}</span>
              <span className="text-[#666] text-sm">XP</span>
            </div>
          </div>
          
          <p className="text-[#555] text-xs uppercase tracking-wider mt-4">SWIPE THROUGH YOUR MEASUREMENTS</p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <span className="text-[#888]">Card {currentIndex + 1} of {metricKeys.length}</span>
          <div className="flex gap-1">
            {metricKeys.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${idx < currentIndex ? 'bg-[#FF6B35]' : idx === currentIndex ? 'bg-green-500' : 'bg-[#3a3a3a]'}`}
              />
            ))}
          </div>
        </div>

        {/* Card Area */}
        {!isComplete ? (
          <div
            ref={cardRef}
            className="relative cursor-grab active:cursor-grabbing"
            onMouseDown={(e) => handleStart(e.clientX)}
            onMouseMove={(e) => handleMove(e.clientX)}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={(e) => handleStart(e.touches[0].clientX)}
            onTouchMove={(e) => handleMove(e.touches[0].clientX)}
            onTouchEnd={handleEnd}
            style={{
              transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          >
            <AnalysisCard 
              metricKey={currentMetricKey}
              value={currentValue}
              dragX={dragX}
            />
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-[#FFD700] mx-auto mb-4" />
            <h3 className="text-white text-2xl font-bold mb-2">Analysis Complete!</h3>
            <p className="text-[#888] mb-6">You&apos;ve reviewed all 8 measurements</p>
            <button
              onClick={() => {
                setCurrentIndex(0)
                setSeenCards([])
              }}
              className="bg-[#FF6B35] text-white px-6 py-3 rounded-full font-bold"
            >
              Review Again
            </button>
          </div>
        )}

        {/* Swipe Hint */}
        {!isComplete && (
          <div className="flex items-center justify-center gap-4 mt-4 text-[#666] text-sm">
            <span className="flex items-center gap-1">
              <ArrowLeft className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400">Save</span>
            </span>
            <span>Swipe or Tap</span>
            <span className="flex items-center gap-1">
              <span className="text-[#FF6B35]">Lock In</span>
              <ArrowRight className="w-4 h-4 text-[#FF6B35]" />
            </span>
          </div>
        )}

        {/* Action Buttons */}
        {!isComplete && (
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => handleAction('save')}
              className="flex-1 bg-transparent border-2 border-blue-500/30 text-blue-400 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2"
            >
              <Bookmark className="w-5 h-5" />
              Save
            </button>
            <button
              onClick={() => handleAction('lockIn')}
              className="flex-1 bg-transparent border-2 border-[#FF6B35]/30 text-[#FF6B35] py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-[#FF6B35]/10 transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5" />
              Lock In
            </button>
          </div>
        )}

        {/* Navigation */}
        {!isComplete && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={goToNext}
              disabled={currentIndex >= metricKeys.length - 1}
              className="text-[#888] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

