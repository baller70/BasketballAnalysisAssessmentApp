"use client"

/**
 * Lock In or Save: Player Edition
 * 
 * Takes the EXACT EXISTING sections from the Player tab and makes them swipeable.
 * Each card is a screenshot-exact copy of the original section.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion } from "framer-motion"
import { Play, ChevronRight, ChevronLeft, Check, Flame, Trophy, Lock, Bookmark, Info, Users, TrendingUp, X, Target } from "lucide-react"
import { useProfileStore } from "@/stores/profileStore"
import { StatPopup } from "@/components/dashboard/StatPopup"
import { usePoints } from "@/lib/points/pointsContext"
import { InlinePointsBurst } from "@/components/points/PointsBurst"

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = { GAME_STATS: 'shotiq_player_lockin_stats', LOCKED_IN: 'shotiq_player_locked_sections', SEEN: 'shotiq_player_seen' }
interface GameStats { totalReviewed: number; lockedIn: number; saved: number; currentStreak: number; bestStreak: number; xp: number; level: number }
const loadFromStorage = <T,>(key: string, defaultValue: T): T => { if (typeof window === 'undefined') return defaultValue; try { return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : defaultValue } catch { return defaultValue } }
const saveToStorage = <T,>(key: string, value: T): void => { if (typeof window !== 'undefined') try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }
const XP_PER_REVIEW = 15, XP_PER_LOCKIN = 30
const DEFAULT_GAME_STATS: GameStats = { totalReviewed: 0, lockedIn: 0, saved: 0, currentStreak: 0, bestStreak: 0, xp: 0, level: 1 }
function getLevelFromXP(xp: number): number { return Math.floor(xp / 500) + 1 }

// Score ring colors - EXACT from page.tsx
function getScoreRingColors(score: number) {
  if (score >= 90) return { primary: "#FF6B35", secondary: "#FFA500", glow: "rgba(255,107,53,0.3)" }
  if (score >= 80) return { primary: "#22c55e", secondary: "#4ade80", glow: "rgba(34,197,94,0.3)" }
  if (score >= 70) return { primary: "#3b82f6", secondary: "#60a5fa", glow: "rgba(59,130,246,0.3)" }
  if (score >= 60) return { primary: "#f97316", secondary: "#fb923c", glow: "rgba(249,115,22,0.3)" }
  return { primary: "#ef4444", secondary: "#f87171", glow: "rgba(239,68,68,0.3)" }
}

// SHOOTER_LEVELS - EXACT from page.tsx
const SHOOTER_LEVELS = [
  { level: 1, name: 'Elite', scoreRange: [90, 100] },
  { level: 2, name: 'Advanced', scoreRange: [80, 89] },
  { level: 3, name: 'Proficient', scoreRange: [70, 79] },
  { level: 4, name: 'Intermediate', scoreRange: [60, 69] },
  { level: 5, name: 'Developing', scoreRange: [50, 59] },
  { level: 6, name: 'Beginner', scoreRange: [40, 49] },
  { level: 7, name: 'Novice', scoreRange: [30, 39] },
  { level: 8, name: 'Learning', scoreRange: [0, 29] }
]

// ============================================
// SPARStatBar - EXACT from page.tsx lines 5714-5821
// ============================================
function SPARStatBar({ name, current, max, playerName, playerAge = 34, playerState = "CA", onStatClick }: { name: string; current: number; max: number; playerName?: string; playerAge?: number; playerState?: string; onStatClick?: () => void }) {
  const [showPopup, setShowPopup] = useState(false)
  const fillPercent = (current / 99) * 100
  const maxPercent = (max / 99) * 100
  const isGood = current >= 65
  const barColor = isGood
    ? { border: "#22c55e", bg: "from-green-500 to-green-600", text: "text-green-400" }
    : { border: "#ef4444", bg: "from-red-500 to-red-600", text: "text-red-400" }
  const statKey = name.toLowerCase()

  const handleClick = () => {
    setShowPopup(true)
    onStatClick?.()
  }

  return (
    <>
      <div className="relative cursor-pointer hover:bg-[#4a4a4a]/30 rounded-lg p-1 -m-1 transition-colors" onClick={handleClick}>
        {/* Stat name label */}
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-semibold uppercase tracking-wide ${barColor.text}`}>{name}</span>
        </div>
        {/* Bar container */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-white w-8 text-right">{current}</span>
          <div className="flex-1 h-5 relative overflow-hidden" style={{ borderLeft: `3px solid ${barColor.border}`, borderRight: `3px solid ${barColor.border}` }}>
            {/* Background with gray stripes */}
            <div className="absolute inset-0 bg-[#1a1a1a]">
              <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 2px, #333 2px, #333 4px)` }} />
            </div>
            {/* Filled portion with colored stripes */}
            <div className={`absolute inset-y-0 left-0 bg-gradient-to-r ${barColor.bg}`} style={{ width: `${fillPercent}%` }}>
              <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(-60deg, transparent, transparent 3px, rgba(0,0,0,0.3) 3px, rgba(0,0,0,0.3) 6px)` }} />
              <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent" />
            </div>
            {/* Max indicator line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-white/50" style={{ left: `${maxPercent}%` }} />
          </div>
          <div className="flex flex-col items-center w-8"><span className="text-sm font-bold text-[#888]">{max}</span><span className="text-[8px] text-[#666] uppercase">Max</span></div>
        </div>
      </div>
      <StatPopup statKey={statKey} value={current} playerAge={playerAge} playerState={playerState} isOpen={showPopup} onClose={() => setShowPopup(false)} />
    </>
  )
}

// ============================================
// PROPS
// ============================================

interface PlayerLockInGameProps {
  shootingStats?: { release: number; form: number; balance: number; arc: number; elbow: number; follow: number; consist: number; power: number }
  overallScore?: number
  consistencyScore?: number
  formScore?: number
  assessmentSkills?: { name: string; score: number; status: string }[]
  detectedFlaws?: { name: string; description: string; fixes: string[]; causeChain?: { effect: string; explanation: string; severity: string }[] }[]
  shooterLevel?: { name: string; level: number; scoreRange: [number, number] }
  assessmentDate?: string
  playerName?: string
  sessionsCount?: number
  dashboardView?: 'basic' | 'standard' | 'professional'
}

// ============================================
// MAIN COMPONENT
// ============================================

export function PlayerLockInGame({ 
  shootingStats,
  overallScore = 74,
  consistencyScore = 74,
  formScore = 73,
  assessmentSkills,
  detectedFlaws,
  shooterLevel,
  assessmentDate,
  playerName: playerNameProp,
  sessionsCount = 5,
}: PlayerLockInGameProps) {
  const profileStore = useProfileStore()
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameStats, setGameStats] = useState<GameStats>(DEFAULT_GAME_STATS)
  const [lockedInSections, setLockedInSections] = useState<string[]>([])
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set())
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState(false)
  const [arrowTop, setArrowTop] = useState(50)
  const cardWrapperRef = useRef<HTMLDivElement>(null)
  const [showVoteResult, setShowVoteResult] = useState(false)
  const [lastAction, setLastAction] = useState<'lockin' | 'save' | null>(null)
  const [activeTab, setActiveTab] = useState<'play' | 'locked' | 'saved'>('play')
  const [showKeySkillsPopup, setShowKeySkillsPopup] = useState(false)
  const [showPointsBurst, setShowPointsBurst] = useState(false)
  
  const { earnPoints } = usePoints()
  const dragStartX = useRef(0)
  const dragStartY = useRef(0)
  const hasDecidedDirection = useRef(false)
  
  // Handler for opening analytics popups - awards points
  const handleOpenAnalyticsPopup = useCallback((openPopupFn: () => void) => {
    openPopupFn()
    const result = earnPoints('stat_popup_view')
    if (result.earned) {
      setShowPointsBurst(true)
      setTimeout(() => setShowPointsBurst(false), 1500)
    }
  }, [earnPoints])
  
  // Handler for Key Skills popup
  const handleOpenKeySkillsPopup = useCallback(() => {
    setShowKeySkillsPopup(true)
    const result = earnPoints('stat_popup_view')
    if (result.earned) {
      setShowPointsBurst(true)
      setTimeout(() => setShowPointsBurst(false), 1500)
    }
  }, [earnPoints])
  
  // Handler for stat bar clicks - points are now awarded inside StatPopup
  // This callback is kept for any additional logic if needed
  const handleStatClick = useCallback(() => {
    // Points are awarded inside the StatPopup component when it opens
  }, [])
  
  // Track scroll to position arrows within card bounds
  useEffect(() => {
    const handleScroll = () => {
      if (!cardWrapperRef.current) return
      const cardRect = cardWrapperRef.current.getBoundingClientRect()
      const viewportHeight = window.innerHeight
      const cardTop = cardRect.top
      const cardHeight = cardRect.height
      
      if (cardTop >= 0 && cardRect.bottom <= viewportHeight) {
        setArrowTop(50)
      } else {
        const viewportCenter = viewportHeight / 2
        const relativeCenter = viewportCenter - cardTop
        const percentage = (relativeCenter / cardHeight) * 100
        const clamped = Math.max(15, Math.min(85, percentage))
        setArrowTop(clamped)
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  const playerName = playerNameProp || 'Player'
  const playerAge = profileStore?.age || 34
  
  // Defaults
  const stats = shootingStats || { release: 67, form: 73, balance: 80, arc: 79, elbow: 90, follow: 80, consist: 74, power: 78 }
  const skills = assessmentSkills || [
    { name: 'Release Form', score: 85, status: 'Good' },
    { name: 'Follow Through', score: 70, status: 'Developing' },
    { name: 'Balance & Base', score: 90, status: 'Excellent' },
    { name: 'Arc & Trajectory', score: 65, status: 'Developing' },
    { name: 'Elbow Alignment', score: 55, status: 'Needs Work' },
  ]
  const flaws = detectedFlaws || [
    { 
      name: 'Elbow Flare', 
      description: 'Your shooting elbow is drifting outward during release, causing inconsistent ball flight and reducing accuracy on mid-range shots.',
      fixes: ['Practice form shooting with your elbow tucked against a wall', 'Use the "cookie jar" drill - imagine reaching into a high shelf', 'Film yourself from behind to monitor elbow position']
    },
    { 
      name: 'Low Release Point', 
      description: 'Your release height is below optimal range, making your shot easier to block and reducing the entry angle into the basket.',
      fixes: ['Extend fully through your shot before releasing', 'Practice releasing at the peak of your jump', 'Use a higher arc to compensate while building strength']
    },
    { 
      name: 'Inconsistent Follow Through', 
      description: 'Your follow through varies from shot to shot, leading to inconsistent backspin and ball rotation.',
      fixes: ['Hold your follow through until the ball hits the rim', 'Focus on snapping your wrist with fingers pointing at the basket', 'Practice one-hand form shooting to isolate the motion']
    },
    { 
      name: 'Poor Base Alignment', 
      description: 'Your feet are not consistently aligned with the basket, causing your body to rotate during the shot.',
      fixes: ['Practice catching and squaring in one motion', 'Use floor markers to check foot alignment', 'Develop a consistent pre-shot routine for foot placement']
    },
    { 
      name: 'Rushed Shot Motion', 
      description: 'Your shooting motion is too quick, not allowing proper energy transfer from legs to arms.',
      fixes: ['Slow down your shot in practice, focus on rhythm', 'Use the "dip" to create better timing', 'Practice shooting tired to develop a consistent pace']
    }
  ]
  const level = shooterLevel || { name: 'Proficient', level: 3, scoreRange: [70, 79] as [number, number] }
  const date = assessmentDate || new Date().toISOString().split('T')[0]
  
  // Ring colors - Fixed colors: Orange (Overall), White (Consistency), Blue (Form)
  const overallColors = { primary: "#FF6B35", secondary: "#FFA500", glow: "rgba(255,107,53,0.3)" }
  const consistencyColors = { primary: "#ffffff", secondary: "#e5e5e5", glow: "rgba(255,255,255,0.2)" }
  const formColors = { primary: "#3b82f6", secondary: "#60a5fa", glow: "rgba(59,130,246,0.3)" }
  const rings = [
    { score: overallScore, radius: 46, strokeWidth: 6, colors: overallColors, label: "Overall" },
    { score: consistencyScore, radius: 38, strokeWidth: 5, colors: consistencyColors, label: "Consistency" },
    { score: formScore, radius: 30, strokeWidth: 5, colors: formColors, label: "Form" },
  ]
  const getRating = (score: number) => {
    if (score >= 90) return { label: "Elite", color: "text-[#FF6B35]" }
    if (score >= 80) return { label: "Excellent", color: "text-green-400" }
    if (score >= 70) return { label: "Good", color: "text-blue-400" }
    if (score >= 60) return { label: "Average", color: "text-orange-400" }
    return { label: "Needs Work", color: "text-red-400" }
  }
  const overallRating = getRating(overallScore)
  const consistencyRating = getRating(consistencyScore)
  const formRating = getRating(formScore)
  
  // SPAR Categories - EXACT from page.tsx
  const getMax = useCallback((current: number) => {
    if (typeof current !== 'number' || isNaN(current)) return 99
    return Math.min(99, current + Math.floor(Math.random() * 5) + 8)
  }, [])
  const sparCategories = useMemo(() => [
    { name: "Shooting Form", color: { border: "#f97316", text: "text-orange-400" }, stats: [{ name: "RELEASE", current: stats.release || 70, max: getMax(stats.release || 70) }, { name: "FORM", current: stats.form || 70, max: getMax(stats.form || 70) }, { name: "ARC", current: stats.arc || 70, max: getMax(stats.arc || 70) }] },
    { name: "Physical", color: { border: "#8b5cf6", text: "text-violet-400" }, stats: [{ name: "BALANCE", current: stats.balance || 70, max: getMax(stats.balance || 70) }, { name: "POWER", current: stats.power || 70, max: getMax(stats.power || 70) }] },
    { name: "Mechanics", color: { border: "#06b6d4", text: "text-cyan-400" }, stats: [{ name: "ELBOW", current: stats.elbow || 70, max: getMax(stats.elbow || 70) }, { name: "FOLLOW", current: stats.follow || 70, max: getMax(stats.follow || 70) }, { name: "CONSIST", current: stats.consist || 70, max: getMax(stats.consist || 70) }] }
  ], [stats, getMax])

  // Motivational message - EXACT from page.tsx
  const motivationalMessage = useMemo(() => {
    if (overallScore >= 90) return { 
      title: 'ELITE PERFORMANCE!', 
      message: `Your ${overallScore}% form score puts you in elite territory—this is the level where college scouts take notice. Your shooting mechanics are fundamentally sound, with consistent release timing, proper elbow alignment, and excellent follow-through. At this stage, your focus should be on maintaining this level under game pressure, fatigue, and defensive contests. Elite shooters don't just make open shots—they make contested ones when it matters most. Continue recording your sessions and analyzing small variations in your form. The difference between 90% and 95% is in the details: hand placement, balance on the catch, and mental preparation before each shot.`, 
      color: 'gold' 
    }
    if (overallScore >= 75) return { 
      title: 'GREAT PROGRESS!', 
      message: `At ${overallScore}%, you're building a strong foundation that many players never achieve. Your fundamentals are solid, and you're showing real commitment to improving your shot. The key now is consistency—making sure every rep looks the same whether you're fresh or tired, in practice or in a game. Focus on your pre-shot routine: same footwork, same hand placement, same release point every single time. Film yourself regularly and compare your form to elite shooters. You're close to breaking through to the next level. The players who make it aren't necessarily the most talented—they're the ones who put in focused, deliberate practice day after day.`, 
      color: 'green' 
    }
    return { 
      title: 'KEEP GOING!', 
      message: `Your ${overallScore}% score shows you're on the development path—every great shooter started exactly where you are now. Right now, your focus should be on building proper habits before adding speed or range. Start close to the basket with form shooting: one hand, perfect form, watching the ball go through the net. Don't move back until you're making 8 out of 10 consistently. Forget about three-pointers for now—master the mechanics first. Your elbow should be tucked, your guide hand should be still, and your follow-through should hold until the ball hits the rim. This isn't about being perfect overnight. It's about getting 1% better every day. Trust the process.`, 
      color: 'blue' 
    }
  }, [overallScore])
  
  const msgBgClass = motivationalMessage.color === 'gold' ? 'from-[#FF6B35]/20 to-[#FF6B35]/5 border-[#FF6B35]/40' : motivationalMessage.color === 'green' ? 'from-green-500/20 to-green-500/5 border-green-500/40' : 'from-blue-500/20 to-blue-500/5 border-blue-500/40'
  const msgTextClass = motivationalMessage.color === 'gold' ? 'text-[#FF6B35]' : motivationalMessage.color === 'green' ? 'text-green-400' : 'text-blue-400'

  useEffect(() => {
    setIsHydrated(true)
    setGameStats(loadFromStorage(STORAGE_KEYS.GAME_STATS, DEFAULT_GAME_STATS))
    setLockedInSections(loadFromStorage(STORAGE_KEYS.LOCKED_IN, []))
    setSeenCards(new Set(loadFromStorage<string[]>(STORAGE_KEYS.SEEN, [])))
  }, [])
  
  // Build cards - each is EXACT from page.tsx
  const sectionCards = useMemo(() => [
    // ========== 1. KEY SKILLS - EXACT ActivityRings from page.tsx ==========
    {
      id: 'key-skills',
      title: 'Key Skills',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Banner */}
          <div className="relative h-24 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-b border-blue-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center px-6">
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Key Skills</h3>
                <p className="text-blue-400/70 text-xs uppercase tracking-widest mt-1">Performance Overview</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-40">
              <div className="relative">
                <div className="absolute inset-0 blur-xl bg-blue-500/20 scale-125" />
                <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 relative z-10">
                  <circle cx="50" cy="50" r="42" stroke="#3b82f6" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray="200 64" />
                  <circle cx="50" cy="50" r="32" stroke="#22d3ee" strokeWidth="5" fill="none" strokeLinecap="round" strokeDasharray="150 52" />
                  <circle cx="50" cy="50" r="22" stroke="#60a5fa" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="100 40" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-blue-500/50 via-blue-500/30 to-transparent" />
          </div>

          {/* Main Content */}
          <div className="p-6 bg-[#1e1e1e]">
            {/* Title Section */}
            <h2 className="text-white font-bold text-lg">Performance Analysis</h2>
            <p className="text-[#888] text-sm mt-1 mb-3">Your shooting mechanics breakdown across key areas</p>
            
            {/* Performance Summary */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333] mb-4">
              <p className="text-[#ccc] text-sm leading-relaxed">
                {overallScore >= 85 
                  ? `Your overall score of ${overallScore}% places you at an elite level. Your shooting mechanics are well-refined with strong fundamentals across form, balance, and consistency. You demonstrate ${consistencyScore >= 80 ? 'excellent shot-to-shot consistency' : 'solid consistency with room for improvement'}. Focus on maintaining these mechanics under game pressure and fatigue.`
                  : overallScore >= 70 
                  ? `With an overall score of ${overallScore}%, you're showing solid progress in your shooting development. Your ${formScore >= consistencyScore ? 'form is your strongest area' : 'consistency shows good discipline'}. ${flaws.length > 0 ? `Key areas to focus on: ${flaws.slice(0, 2).map(f => f.name.toLowerCase()).join(' and ')}.` : 'Continue building on your fundamentals.'} Regular practice with proper technique will help you reach the next level.`
                  : `Your ${overallScore}% score indicates you're in the development phase of your shooting journey. ${flaws.length > 0 ? `Your analysis identified ${flaws.length} area${flaws.length > 1 ? 's' : ''} for improvement, including ${flaws[0]?.name.toLowerCase() || 'form mechanics'}.` : 'Focus on building consistent mechanics.'} Start with close-range form shooting and gradually extend your range as your technique improves. Consistency comes from repetition with proper form.`
                }
              </p>
            </div>

            {/* Stats Row - Like drill card */}
            <div className="flex justify-between mt-5 py-4 border-y border-[#333]">
              <div className="text-center flex-1">
                <div className="flex justify-center mb-2">
                  <Trophy className="w-5 h-5 text-[#888]" />
                </div>
                <div className="text-2xl font-black text-white">{overallScore}</div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">Overall</div>
              </div>
              <div className="w-px bg-[#333]" />
              <div className="text-center flex-1">
                <div className="flex justify-center mb-2">
                  <TrendingUp className="w-5 h-5 text-[#888]" />
                </div>
                <div className="text-2xl font-black text-white">{consistencyScore}</div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">Consistency</div>
              </div>
              <div className="w-px bg-[#333]" />
              <div className="text-center flex-1">
                <div className="flex justify-center mb-2">
                  <div className="w-5 h-5 flex items-center justify-center">
                    <div className="flex gap-0.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className={`w-1 h-3 rounded-sm ${i <= Math.ceil(formScore/20) ? 'bg-[#888]' : 'bg-[#444]'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-2xl font-black text-white">{formScore}</div>
                <div className="text-[10px] text-[#666] uppercase tracking-wider">Form</div>
              </div>
            </div>

            {/* Fitness Rings */}
            <div className="relative w-48 h-48 mx-auto mt-6 cursor-pointer hover:scale-105 transition-transform" onClick={handleOpenKeySkillsPopup}>
              <div className="absolute inset-0 rounded-full blur-xl" style={{ background: `radial-gradient(circle, ${overallColors.glow} 0%, ${consistencyColors.glow} 50%, transparent 70%)` }} />
              <svg className="w-full h-full transform -rotate-90 drop-shadow-lg" viewBox="0 0 100 100">
                <defs>
                  {rings.map((ring, i) => (<linearGradient key={`grad-${i}`} id={`activity-ring-gradient-${i}`} x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor={ring.colors.primary} /><stop offset="100%" stopColor={ring.colors.secondary} /></linearGradient>))}
                  <filter id="activity-glow"><feGaussianBlur stdDeviation="2" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                {rings.map((ring, i) => { const circ = 2 * Math.PI * ring.radius; const dash = `${(ring.score / 100) * circ} ${circ}`; return (<g key={i}><circle cx="50" cy="50" r={ring.radius} fill="none" stroke="#2a2a2a" strokeWidth={ring.strokeWidth} opacity="0.6" /><circle cx="50" cy="50" r={ring.radius} fill="none" stroke={`url(#activity-ring-gradient-${i})`} strokeWidth={ring.strokeWidth} strokeLinecap="round" strokeDasharray={dash} filter="url(#activity-glow)" className="transition-all duration-1000 ease-out" /></g>) })}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-black text-white drop-shadow-lg">{overallScore}%</span>
                <span className="text-white/70 text-xs font-medium">Overall</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex justify-center gap-5 mt-4 text-xs">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${overallColors.primary}, ${overallColors.secondary})` }} /><span className="text-white/80">Overall</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${consistencyColors.primary}, ${consistencyColors.secondary})` }} /><span className="text-white/80">Consistency</span></span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${formColors.primary}, ${formColors.secondary})` }} /><span className="text-white/80">Form</span></span>
            </div>

            {/* Tap hint */}
            <div className="flex items-center justify-center gap-2 mt-5 text-[#666] text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Tap the rings for more details</span>
            </div>
          </div>
        </div>
      )
    },
    // ========== 2. SHOOTING FORM - EXACT from page.tsx ==========
    {
      id: 'shooting-form',
      title: 'Shooting Form',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Performance Banner */}
          <div className="relative h-24 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-b border-orange-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center px-6">
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Shooting Form</h3>
                <p className="text-orange-400/70 text-xs uppercase tracking-widest mt-1">Performance Stats</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="relative opacity-40">
                <div className="absolute inset-0 blur-xl bg-orange-500/20 scale-125" />
                <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 relative z-10">
                  <rect x="8" y="58" width="16" height="32" fill="#f97316" rx="3" />
                  <rect x="28" y="44" width="16" height="46" fill="#f97316" rx="3" />
                  <rect x="48" y="28" width="16" height="62" fill="#f97316" rx="3" />
                  <rect x="68" y="12" width="16" height="78" fill="#f97316" rx="3" />
                  <path d="M16 50 Q48 22 84 8" stroke="#fb923c" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M74 4 L88 8 L84 22" stroke="#fb923c" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-orange-500/50 via-orange-500/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 bg-[#1e1e1e]">
            {/* Why It Matters - TOP */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333] mb-5">
              <p className="text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">Why Form Matters</p>
              <p className="text-[#999] text-xs leading-relaxed">
                Proper shooting form is the foundation of accuracy. A clean release, good arc (45-52°), and consistent form allow you to shoot the same way every time—building muscle memory that translates to game situations.
              </p>
            </div>

            {/* Stat Bars - RELEASE, FORM, ARC */}
            <div className="space-y-4">
              {sparCategories[0].stats.map((stat, idx) => (
                <SPARStatBar key={idx} name={stat.name} current={stat.current} max={stat.max} playerName={playerName} playerAge={playerAge} playerState="CA" onStatClick={handleStatClick} />
              ))}
            </div>

            {/* Hint */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[#555] text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Tap any bar to see how you compare to your age group</span>
            </div>
          </div>
        </div>
      )
    },
    // ========== 3. PHYSICAL - EXACT from page.tsx ==========
    {
      id: 'physical',
      title: 'Physical',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Performance Banner */}
          <div className="relative h-24 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-b border-violet-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center px-6">
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Physical</h3>
                <p className="text-violet-400/70 text-xs uppercase tracking-widest mt-1">Performance Stats</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="relative opacity-40">
                <div className="absolute inset-0 blur-xl bg-violet-500/20 scale-125" />
                <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 relative z-10">
                  <rect x="8" y="58" width="16" height="32" fill="#8b5cf6" rx="3" />
                  <rect x="28" y="44" width="16" height="46" fill="#8b5cf6" rx="3" />
                  <rect x="48" y="28" width="16" height="62" fill="#8b5cf6" rx="3" />
                  <rect x="68" y="12" width="16" height="78" fill="#8b5cf6" rx="3" />
                  <path d="M16 50 Q48 22 84 8" stroke="#a78bfa" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M74 4 L88 8 L84 22" stroke="#a78bfa" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-violet-500/50 via-violet-500/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 bg-[#1e1e1e]">
            {/* Why It Matters - TOP */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333] mb-5">
              <p className="text-violet-400 text-xs font-semibold uppercase tracking-wider mb-2">Why Physical Matters</p>
              <p className="text-[#999] text-xs leading-relaxed">
                Your legs generate 60-70% of your shooting power. Strong balance ensures consistent shot mechanics even when fatigued or contested. Elite shooters maintain perfect balance through their entire shooting motion.
              </p>
            </div>

            {/* Stat Bars - Physical Rating first, then individual stats */}
            <div className="space-y-4">
              {/* Physical Rating - same style as other bars */}
              <SPARStatBar 
                name="PHYSICAL" 
                current={Math.round(((stats.balance || 80) + (stats.power || 78)) / 2)} 
                max={100} 
                playerName={playerName} 
                playerAge={playerAge} 
                playerState="CA"
                onStatClick={handleStatClick}
              />
              {sparCategories[1].stats.map((stat, idx) => (
                <SPARStatBar key={idx} name={stat.name} current={stat.current} max={stat.max} playerName={playerName} playerAge={playerAge} playerState="CA" onStatClick={handleStatClick} />
              ))}
            </div>

            {/* Hint */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[#555] text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Tap any bar to see how you compare to your age group</span>
            </div>
          </div>
        </div>
      )
    },
    // ========== 4. MECHANICS - EXACT from page.tsx ==========
    {
      id: 'mechanics',
      title: 'Mechanics',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Performance Banner */}
          <div className="relative h-24 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-b border-cyan-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center px-6">
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Mechanics</h3>
                <p className="text-cyan-400/70 text-xs uppercase tracking-widest mt-1">Performance Stats</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="relative opacity-40">
                <div className="absolute inset-0 blur-xl bg-cyan-500/20 scale-125" />
                <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 relative z-10">
                  <rect x="8" y="58" width="16" height="32" fill="#06b6d4" rx="3" />
                  <rect x="28" y="44" width="16" height="46" fill="#06b6d4" rx="3" />
                  <rect x="48" y="28" width="16" height="62" fill="#06b6d4" rx="3" />
                  <rect x="68" y="12" width="16" height="78" fill="#06b6d4" rx="3" />
                  <path d="M16 50 Q48 22 84 8" stroke="#22d3ee" strokeWidth="5" fill="none" strokeLinecap="round" />
                  <path d="M74 4 L88 8 L84 22" stroke="#22d3ee" strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-cyan-500/50 via-cyan-500/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 bg-[#1e1e1e]">
            {/* Why It Matters - TOP */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333] mb-5">
              <p className="text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">Why Mechanics Matter</p>
              <p className="text-[#999] text-xs leading-relaxed">
                Proper elbow alignment (tucked in) creates a straight ball flight. A complete follow-through ensures consistent backspin. Consistency across shots is what separates good shooters from elite ones.
              </p>
            </div>

            {/* Stat Bars - Mechanics Rating first, then individual stats */}
            <div className="space-y-4">
              {/* Mechanics Rating - same style as other bars */}
              <SPARStatBar 
                name="MECHANICS" 
                current={Math.round(((stats.elbow || 90) + (stats.follow || 80) + (stats.consist || 74)) / 3)} 
                max={100} 
                playerName={playerName} 
                playerAge={playerAge} 
                playerState="CA"
                onStatClick={handleStatClick}
              />
              {sparCategories[2].stats.map((stat, idx) => (
                <SPARStatBar key={idx} name={stat.name} current={stat.current} max={stat.max} playerName={playerName} playerAge={playerAge} playerState="CA" onStatClick={handleStatClick} />
              ))}
            </div>

            {/* Hint */}
            <div className="mt-4 flex items-center justify-center gap-2 text-[#555] text-xs">
              <Info className="w-3.5 h-3.5" />
              <span>Tap any bar to see how you compare to your age group</span>
            </div>
          </div>
        </div>
      )
    },
    // ========== 5. MOTIVATIONAL MESSAGE - EXACT from page.tsx ==========
    {
      id: 'motivational',
      title: 'Keep Going',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Header with Coach Icon */}
          <div className={`relative h-20 bg-gradient-to-r ${msgBgClass}`}>
            <div className="absolute inset-0 flex items-center px-6 gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0">
                <img src="/icons/coach-whistle.png" alt="Coach" className="w-full h-full object-cover invert" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              </div>
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">{motivationalMessage.title}</h3>
                <p className={`${msgTextClass} text-xs uppercase tracking-widest mt-1`}>Coach&apos;s Message</p>
              </div>
            </div>
            <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r ${motivationalMessage.color === 'gold' ? 'from-[#FF6B35]/50 via-[#FF6B35]/30' : motivationalMessage.color === 'green' ? 'from-green-500/50 via-green-500/30' : 'from-blue-500/50 via-blue-500/30'} to-transparent`} />
          </div>

          {/* Content */}
          <div className="p-6 bg-[#1e1e1e]">
            {/* Message Box */}
            <div className="bg-[#252525] rounded-xl p-4 border border-[#333]">
              <p className="text-[#E5E5E5] text-sm leading-relaxed">{motivationalMessage.message}</p>
            </div>

            {/* Next Goals */}
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className={`w-3.5 h-3.5 ${msgTextClass}`} />
                <p className={`${msgTextClass} text-[10px] font-semibold uppercase tracking-wider`}>Next Goals</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  `${level.name === 'Elite' ? 'Perfect' : SHOOTER_LEVELS[level.level - 2]?.name || 'Advanced'} Level`,
                  '100 Form Shots',
                  '+10 Lowest Stat',
                  '3 Sessions',
                  'Master 1 Drill'
                ].map((goal, i) => (
                  <div 
                    key={i} 
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                      motivationalMessage.color === 'gold' 
                        ? 'bg-[#FF6B35]/10 border-[#FF6B35]/30 text-[#FF6B35]' 
                        : motivationalMessage.color === 'green' 
                          ? 'bg-green-500/10 border-green-500/30 text-green-400' 
                          : 'bg-blue-500/10 border-blue-500/30 text-blue-400'
                    }`}
                  >
                    {goal}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )
    },
    // ========== 6. ASSESSMENT RESULTS - EXACT from page.tsx ==========
    {
      id: 'assessment-results',
      title: 'Assessment Results',
      content: (
        <div className="bg-[#1a1a1a] rounded-2xl overflow-hidden border-2 border-[#333] shadow-xl">
          {/* Assessment Banner */}
          <div className="relative h-24 bg-gradient-to-br from-[#1a1a1a] via-[#222] to-[#1a1a1a] border-b border-emerald-500/30">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent" />
            <div className="absolute inset-0 flex items-center px-6">
              <div>
                <h3 className="text-white font-black text-xl uppercase tracking-wider">Assessment</h3>
                <p className="text-emerald-400/70 text-xs uppercase tracking-widest mt-1">Results Summary</p>
              </div>
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="relative opacity-40">
                <div className="absolute inset-0 blur-xl bg-emerald-500/20 scale-125" />
                <svg viewBox="0 0 100 100" fill="none" className="w-16 h-16 relative z-10">
                  <circle cx="50" cy="50" r="40" stroke="#10b981" strokeWidth="6" fill="none" />
                  <path d="M30 50 L45 65 L70 35" stroke="#34d399" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-emerald-500/50 via-emerald-500/30 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6 bg-[#1e1e1e]">
            <div className="mb-4">
              <h4 className="text-emerald-400 font-semibold uppercase text-sm mb-2">Overall Performance Rating</h4>
              <p className="text-[#888] text-sm mb-1">Basketball Shooting Mechanics Program</p>
              <p className="text-[#888] text-sm mb-3">Assessment Date: {date}</p>
              <ul className="space-y-2 text-sm text-[#E5E5E5]">
                <li className="flex items-start gap-2"><span className="text-emerald-400">•</span>Achieved <span className="text-emerald-400 font-semibold">{overallScore}%</span> overall shooting form rating</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">•</span>Demonstrated <span className="text-emerald-400 font-semibold">{skills.filter(s => s.score >= 80).length}</span> skills at advanced level</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">•</span>Shooter Classification: <span className="text-emerald-400 font-semibold">{level.name}</span> ({level.scoreRange[0]}-{level.scoreRange[1]} range)</li>
                <li className="flex items-start gap-2"><span className="text-emerald-400">•</span>{flaws.length === 0 ? 'No significant mechanical flaws detected' : `${flaws.length} mechanical issue${flaws.length > 1 ? 's' : ''} identified`}</li>
              </ul>
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                <h4 className="text-green-400 font-semibold uppercase text-sm mb-3">Strengths</h4>
                <ul className="space-y-2 text-sm text-[#E5E5E5]">{skills.filter(s => s.score >= 70).slice(0, 3).map((skill, idx) => <li key={idx} className="flex items-start gap-2"><span className="text-green-400">•</span><span>{skill.name} ({skill.score}%) - {skill.status}</span></li>)}</ul>
              </div>
              <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                <h4 className="text-orange-400 font-semibold uppercase text-sm mb-3">Areas for Improvement</h4>
                <ul className="space-y-2 text-sm text-[#E5E5E5]">{skills.filter(s => s.score < 70).slice(0, 3).map((skill, idx) => <li key={idx} className="flex items-start gap-2"><span className="text-orange-400">•</span><span>{skill.name} ({skill.score}%) - {skill.status}</span></li>)}</ul>
              </div>
            </div>
          </div>
        </div>
      )
    },
    // ========== 7. DEVELOPMENT RECOMMENDATIONS - EXACT from page.tsx ==========
    {
      id: 'development',
      title: 'Development Recommendations',
      content: (
        <div className="bg-[#2a2a2a] rounded-xl p-6 border border-[#3a3a3a] hover:border-[#FF6B35]/30 transition-colors">
          <h3 className="text-xl font-bold text-[#E5E5E5] uppercase tracking-wider mb-4">Development Recommendations</h3>
          {flaws.length > 0 ? (
            <div className="space-y-4">{flaws.slice(0, 2).map((flaw, idx) => (
              <div key={idx} className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-[#FF6B35]">
                <p className="text-[#E5E5E5] font-semibold mb-2">{flaw.name}</p>
                <p className="text-[#888] text-sm mb-2">{flaw.description}</p>
                <p className="text-green-400 text-sm"><span className="text-[#888]">Fix:</span> {flaw.fixes[0]}</p>
              </div>
            ))}</div>
          ) : (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 font-semibold mb-2">Excellent Form Detected!</p>
              <p className="text-[#E5E5E5] text-sm">Your shooting mechanics show strong fundamentals with no significant flaws detected. Continue practicing to maintain consistency and build muscle memory.</p>
            </div>
          )}
        </div>
      )
    },
  ], [overallScore, consistencyScore, formScore, overallColors, consistencyColors, formColors, rings, sparCategories, skills, flaws, level, date, playerName, playerAge, msgBgClass, msgTextClass, motivationalMessage])
  
  const displayCards = useMemo(() => {
    if (activeTab === 'locked') return sectionCards.filter(c => lockedInSections.includes(c.id))
    if (activeTab === 'saved') return sectionCards.filter(c => seenCards.has(c.id) && !lockedInSections.includes(c.id))
    return sectionCards.filter(c => !seenCards.has(c.id))
  }, [activeTab, sectionCards, lockedInSections, seenCards])
  
  const currentCard = displayCards[currentIndex]
  
  const handleVote = useCallback((action: 'lockin' | 'save') => {
    if (!currentCard) return
    if (action === 'lockin') { const nl = [...lockedInSections, currentCard.id]; setLockedInSections(nl); saveToStorage(STORAGE_KEYS.LOCKED_IN, nl) }
    const ns = new Set(seenCards); ns.add(currentCard.id); setSeenCards(ns); saveToStorage(STORAGE_KEYS.SEEN, Array.from(ns))
    const xp = action === 'lockin' ? XP_PER_LOCKIN : XP_PER_REVIEW
    const str = gameStats.currentStreak + 1
    const ng = { ...gameStats, totalReviewed: gameStats.totalReviewed + 1, lockedIn: action === 'lockin' ? gameStats.lockedIn + 1 : gameStats.lockedIn, saved: action === 'save' ? gameStats.saved + 1 : gameStats.saved, currentStreak: str, bestStreak: Math.max(gameStats.bestStreak, str), xp: gameStats.xp + xp, level: getLevelFromXP(gameStats.xp + xp) }
    setGameStats(ng); saveToStorage(STORAGE_KEYS.GAME_STATS, ng)
    
    // Award IQ points
    const result = earnPoints('player_card_swipe')
    if (result.earned) {
      setShowPointsBurst(true)
      setTimeout(() => setShowPointsBurst(false), 1500)
    }
    
    setLastAction(action); setShowVoteResult(true)
    setTimeout(() => { setShowVoteResult(false); setLastAction(null); setDragX(0); setCurrentIndex(p => p + 1) }, 1200)
  }, [currentCard, lockedInSections, seenCards, gameStats, earnPoints])
  
  const handleDragStart = useCallback((x: number, y: number) => { 
    setIsDragging(true)
    dragStartX.current = x
    dragStartY.current = y
    hasDecidedDirection.current = false
    setIsHorizontalSwipe(false)
  }, [])
  
  const handleDragMove = useCallback((x: number, y: number) => { 
    if (!isDragging) return
    
    const deltaX = x - dragStartX.current
    const deltaY = y - dragStartY.current
    
    // Decide direction once we have enough movement (10px threshold)
    if (!hasDecidedDirection.current && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
      hasDecidedDirection.current = true
      // If horizontal movement is greater, it's a swipe
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        setIsHorizontalSwipe(true)
      } else {
        // Vertical scroll - cancel drag and let page scroll
        setIsDragging(false)
        setIsHorizontalSwipe(false)
        return
      }
    }
    
    // Only update dragX if we're doing a horizontal swipe
    if (isHorizontalSwipe || !hasDecidedDirection.current) {
      setDragX(deltaX)
    }
  }, [isDragging, isHorizontalSwipe])
  
  const handleDragEnd = useCallback(() => { 
    if (!isDragging) return
    setIsDragging(false)
    
    // Only trigger action if it was a horizontal swipe
    if (isHorizontalSwipe) {
      if (dragX > 100) handleVote('lockin')
      else if (dragX < -100) handleVote('save')
    }
    
    setDragX(0)
    setIsHorizontalSwipe(false)
    hasDecidedDirection.current = false
  }, [isDragging, dragX, handleVote, isHorizontalSwipe])
  const resetGame = useCallback(() => { setCurrentIndex(0); setSeenCards(new Set()); saveToStorage(STORAGE_KEYS.SEEN, []) }, [])
  
  if (!isHydrated) return <div className="flex items-center justify-center h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" /></div>
  
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="mb-6">
        {/* Title */}
        <div className="mb-4">
          <h2 className="text-white font-black text-2xl uppercase tracking-wider">{playerName.toUpperCase()}</h2>
          <p className="text-[#FF6B35] text-sm font-bold uppercase tracking-widest mt-1">PLAYER ASSESSMENT</p>
        </div>
        
        {/* Stats Row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333]">
            <Flame className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-white font-bold text-sm">{gameStats.currentStreak}</span>
            <span className="text-[#666] text-xs">Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333]">
            <Lock className="w-4 h-4 text-green-500" />
            <span className="text-white font-bold text-sm">{gameStats.lockedIn}</span>
            <span className="text-[#666] text-xs">Locked</span>
          </div>
          <div className="flex items-center gap-2 bg-[#1a1a1a] px-3 py-1.5 rounded-lg border border-[#333]">
            <Trophy className="w-4 h-4 text-[#FFD700]" />
            <span className="text-white font-bold text-sm">{gameStats.xp}</span>
            <span className="text-[#666] text-xs">XP</span>
          </div>
        </div>
        
        {/* Subtitle */}
        <p className="text-[#555] text-xs uppercase tracking-wider">Swipe through your sections</p>
      </div>
      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        {[{ id: 'play', label: 'Discover', icon: Play }, { id: 'locked', label: 'Locked In', icon: Lock }, { id: 'saved', label: 'Saved', icon: Bookmark }].map(tab => (
          <button key={tab.id} type="button" onClick={() => { setActiveTab(tab.id as 'play' | 'locked' | 'saved'); setCurrentIndex(0) }} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-all ${activeTab === tab.id ? 'bg-[#FF6B35] text-white' : 'bg-[#2a2a2a] text-[#888] hover:bg-[#3a3a3a]'}`}>
            <tab.icon className="w-3.5 h-3.5" />{tab.label}
          </button>
        ))}
      </div>
      {/* Swipeable Section */}
      {activeTab === 'play' && (<>
        {currentCard ? (
          <div className="relative" ref={cardWrapperRef}>
            {/* Left Swipe Indicator */}
            <div 
              className="z-20 flex items-center gap-0 pointer-events-none transition-all duration-150"
              style={{ 
                opacity: dragX < 0 ? Math.min(0.9, 0.2 + Math.abs(dragX) / 150) : 0.2,
                transform: `translateY(-50%) translateX(${dragX < 0 ? Math.max(-8, dragX / 15) : 0}px)`,
                position: 'absolute',
                left: 0,
                top: `${arrowTop}%`,
                height: 'fit-content'
              }}
            >
              <svg width="70" height="70" viewBox="0 0 70 70">
                <path d="M32 5 L5 35 L32 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                <path d="M50 5 L23 35 L50 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                <path d="M18 5 L-9 35 L18 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                <path d="M36 5 L9 35 L36 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                <path d="M46 5 L19 35 L46 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
                <path d="M64 5 L37 35 L64 65" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
              </svg>
              <svg width="100" height="40" viewBox="0 0 100 40" className="-ml-2">
                <text x="50" y="30" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="none" stroke={dragX < -20 ? "#3b82f6" : "white"} strokeWidth="1.5" letterSpacing="3" className="transition-all duration-150">SWIPE</text>
              </svg>
            </div>
            
            {/* Right Swipe Indicator */}
            <div 
              className="z-20 flex items-center gap-0 pointer-events-none transition-all duration-150"
              style={{ 
                opacity: dragX > 0 ? Math.min(0.9, 0.2 + dragX / 150) : 0.2,
                transform: `translateY(-50%) translateX(${dragX > 0 ? Math.min(8, dragX / 15) : 0}px)`,
                position: 'absolute',
                right: 0,
                top: `${arrowTop}%`,
                height: 'fit-content'
              }}
            >
              <svg width="100" height="40" viewBox="0 0 100 40" className="-mr-2">
                <text x="50" y="30" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="none" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="1.5" letterSpacing="3" className="transition-all duration-150">SWIPE</text>
              </svg>
              <svg width="70" height="70" viewBox="0 0 70 70">
                <path d="M38 5 L65 35 L38 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                <path d="M20 5 L47 35 L20 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                <path d="M52 5 L79 35 L52 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                <path d="M34 5 L61 35 L34 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                <path d="M24 5 L51 35 L24 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
                <path d="M6 5 L33 35 L6 65" stroke={dragX > 20 ? "#FF6B35" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
              </svg>
            </div>
          
            {/* Left glow (Save - Blue) */}
            <div 
              className="absolute -left-4 top-0 bottom-0 w-32 pointer-events-none z-0 rounded-l-3xl transition-opacity duration-200"
              style={{ 
                opacity: dragX < -20 ? Math.min(0.8, Math.abs(dragX) / 120) : 0,
                background: 'linear-gradient(to right, rgba(59,130,246,0.4), transparent)'
              }}
            />
            {/* Right glow (Lock In - Orange) */}
            <div 
              className="absolute -right-4 top-0 bottom-0 w-32 pointer-events-none z-0 rounded-r-3xl transition-opacity duration-200"
              style={{ 
                opacity: dragX > 20 ? Math.min(0.8, dragX / 120) : 0,
                background: 'linear-gradient(to left, rgba(255,107,53,0.4), transparent)'
              }}
            />
            {/* Side icons */}
            <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-opacity duration-200" style={{ opacity: dragX < -40 ? Math.min(1, Math.abs(dragX) / 100) : 0 }}><Bookmark className="w-8 h-8 text-blue-400 drop-shadow-lg" /></div>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none z-10 transition-opacity duration-200" style={{ opacity: dragX > 40 ? Math.min(1, dragX / 100) : 0 }}><Lock className="w-8 h-8 text-[#FF6B35] drop-shadow-lg" /></div>
            {/* Card with dynamic border glow */}
            <div 
              className={`relative z-5 select-none cursor-grab active:cursor-grabbing rounded-xl transition-all ${isHorizontalSwipe ? 'touch-none' : ''}`}
              style={{ 
                transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`, 
                transition: isDragging ? 'none' : 'transform 0.3s, box-shadow 0.2s',
                boxShadow: dragX > 30 
                  ? `0 0 30px rgba(255,107,53,${Math.min(0.5, dragX/200)}), inset 0 0 0 2px rgba(255,107,53,${Math.min(0.6, dragX/150)})`
                  : dragX < -30
                  ? `0 0 30px rgba(59,130,246,${Math.min(0.5, Math.abs(dragX)/200)}), inset 0 0 0 2px rgba(59,130,246,${Math.min(0.6, Math.abs(dragX)/150)})`
                  : 'none'
              }} 
              onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)} 
              onTouchMove={(e) => {
                // Only prevent default if we're doing a horizontal swipe
                if (isHorizontalSwipe) e.preventDefault()
                handleDragMove(e.touches[0].clientX, e.touches[0].clientY)
              }} 
              onTouchEnd={handleDragEnd} 
              onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)} 
              onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)} 
              onMouseUp={handleDragEnd} 
              onMouseLeave={() => { if (isDragging) handleDragEnd() }}
            >
              {/* GOLD Video Game Style Points Animation */}
              <InlinePointsBurst points={1} show={showPointsBurst} label="IQ" />
              {currentCard.content}
            </div>
            {showVoteResult && (<div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-20"><div className="text-center">{lastAction === 'lockin' ? <Lock className="w-12 h-12 text-[#FF6B35] mx-auto mb-2" /> : <Bookmark className="w-12 h-12 text-blue-400 mx-auto mb-2" />}<p className={`font-bold ${lastAction === 'lockin' ? 'text-[#FF6B35]' : 'text-blue-400'}`}>{lastAction === 'lockin' ? 'LOCKED IN!' : 'SAVED!'}</p></div></div>)}
            {/* Swipe Hint */}
            <div className="flex items-center justify-center gap-4 mt-4 text-[#666] text-sm">
              <span className="flex items-center gap-1">
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <span className="text-blue-400">Save</span>
              </span>
              <span>Swipe or Tap</span>
              <span className="flex items-center gap-1">
                <span className="text-[#FF6B35]">Lock</span>
                <ChevronRight className="w-4 h-4 text-[#FF6B35]" />
              </span>
            </div>
            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-4">
              <button 
                type="button" 
                onClick={() => handleVote('save')} 
                className="flex-1 bg-transparent border-2 border-blue-500/30 text-blue-400 py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Bookmark className="w-5 h-5" />
                Save
              </button>
              <button 
                type="button" 
                onClick={() => handleVote('lockin')} 
                className="flex-1 bg-transparent border-2 border-[#FF6B35]/30 text-[#FF6B35] py-4 rounded-xl font-bold uppercase tracking-wider hover:bg-[#FF6B35]/10 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Lock className="w-5 h-5" />
                Lock
              </button>
            </div>
            <p className="text-center text-[#666] text-xs mt-2">{currentIndex + 1} of {displayCards.length}</p>
          </div>
        ) : (<div className="text-center py-12"><Check className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="text-white font-bold">All Done!</p><button type="button" onClick={resetGame} className="mt-3 px-4 py-2 bg-[#FF6B35] text-white text-sm rounded-lg whitespace-nowrap">Restart</button></div>)}
      </>)}
      {/* Locked/Saved tabs */}
      {(activeTab === 'locked' || activeTab === 'saved') && (<div className="space-y-3">{displayCards.length === 0 ? (<div className="text-center py-12"><p className="text-[#888]">No sections {activeTab === 'locked' ? 'locked in' : 'saved'} yet.</p></div>) : displayCards.map(card => (<div key={card.id}>{card.content}</div>))}</div>)}
      {/* Key Skills Popup - EXACT from page.tsx */}
      {showKeySkillsPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowKeySkillsPopup(false)}>
          {/* Points animation - fixed position on top of everything */}
          {showPointsBurst && (
            <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[60]">
              <motion.div
                className="font-black text-5xl"
                style={{
                  textShadow: '0 0 30px rgba(255, 215, 0, 1), 0 0 60px rgba(255, 165, 0, 0.5)',
                }}
                initial={{ scale: 0, y: 0 }}
                animate={{ 
                  scale: [0, 1.5, 1.2],
                  y: [0, -20, -40],
                }}
                exit={{ 
                  scale: 0.5, 
                  y: -80, 
                  opacity: 0 
                }}
                transition={{ 
                  duration: 0.6,
                  times: [0, 0.3, 1],
                  ease: 'easeOut',
                }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-orange-500">
                  +1 IQ
                </span>
              </motion.div>
              {/* Sparkles */}
              {[...Array(6)].map((_, i) => {
                const angle = (360 / 6) * i
                const radians = (angle * Math.PI) / 180
                const distance = 80
                
                return (
                  <motion.div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-yellow-400"
                    style={{
                      boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
                    }}
                    initial={{ 
                      x: 0, 
                      y: 0, 
                      scale: 0, 
                      opacity: 1 
                    }}
                    animate={{ 
                      x: Math.cos(radians) * distance, 
                      y: Math.sin(radians) * distance, 
                      scale: [0, 1, 0], 
                      opacity: [1, 1, 0] 
                    }}
                    transition={{ 
                      duration: 0.5, 
                      delay: i * 0.02,
                      ease: 'easeOut' 
                    }}
                  />
                )
              })}
            </div>
          )}
          <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] rounded-xl border border-[#3a3a3a] shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto relative" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-gradient-to-r from-[#FF6B35]/20 to-transparent p-4 border-b border-[#3a3a3a] flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-[#FF6B35]/10 flex items-center justify-center border border-[#FF6B35]/30"><Info className="w-5 h-5 text-[#FF6B35]" /></div><div><h2 className="text-[#FF6B35] font-bold text-lg uppercase tracking-wider">Key Skills</h2><p className="text-[#888] text-xs">Performance Overview</p></div></div><button onClick={() => setShowKeySkillsPopup(false)} className="w-8 h-8 rounded-full bg-[#3a3a3a] hover:bg-[#4a4a4a] flex items-center justify-center"><X className="w-4 h-4 text-[#888]" /></button></div>
            <div className="p-4 border-b border-[#3a3a3a]"><div className="flex items-center justify-between mb-3"><span className="text-[#888] text-sm uppercase tracking-wider">Overall Score</span><div className="flex items-center gap-2"><span className="text-white font-black text-3xl">{overallScore}</span><span className="text-[#888] text-sm">/ 100</span></div></div><div className="h-3 bg-[#3a3a3a] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${overallScore}%`, background: `linear-gradient(90deg, ${overallColors.primary}, ${overallColors.secondary})` }} /></div><div className="flex justify-between mt-2"><span className="text-[10px] text-[#666]">0</span><span className={`text-sm font-bold ${overallRating.color}`}>{overallRating.label}</span><span className="text-[10px] text-[#666]">100</span></div></div>
            <div className="p-4 border-b border-[#3a3a3a]"><h3 className="text-white font-semibold text-sm mb-2 flex items-center gap-2"><ChevronRight className="w-4 h-4 text-[#FF6B35]" />What This Means</h3><p className="text-[#E5E5E5] text-sm leading-relaxed">Your Key Skills score combines three critical aspects of shooting: Overall form quality, shot-to-shot Consistency, and technical Form mechanics.</p></div>
            <div className="p-4 border-b border-[#3a3a3a]"><h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-[#FF6B35]" />Ring Breakdown</h3>
              <div className="bg-[#2a2a2a] rounded-lg p-3 mb-3"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${overallColors.primary}, ${overallColors.secondary})` }} /><span className="text-white font-semibold">Overall</span></div><span className="text-white font-bold">{overallScore}%</span></div><p className="text-[#888] text-xs">Combined shooting performance</p></div>
              <div className="bg-[#2a2a2a] rounded-lg p-3 mb-3"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${consistencyColors.primary}, ${consistencyColors.secondary})` }} /><span className="text-white font-semibold">Consistency</span></div><span className="text-white font-bold">{consistencyScore}%</span></div><p className="text-[#888] text-xs">Shot-to-shot repeatability</p></div>
              <div className="bg-[#2a2a2a] rounded-lg p-3"><div className="flex items-center justify-between mb-2"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ background: `linear-gradient(135deg, ${formColors.primary}, ${formColors.secondary})` }} /><span className="text-white font-semibold">Form</span></div><span className="text-white font-bold">{formScore}%</span></div><p className="text-[#888] text-xs">Technical quality of mechanics</p></div>
            </div>
            <div className="p-4 border-b border-[#3a3a3a]"><h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#FF6B35]" />Performance Benchmarks</h3><div className="grid grid-cols-2 gap-2 text-xs"><div className="bg-[#1a1a1a] rounded p-2 text-center"><p className="text-[#FF6B35] font-bold">90-100</p><p className="text-[#888]">Elite</p></div><div className="bg-[#1a1a1a] rounded p-2 text-center"><p className="text-green-400 font-bold">80-89</p><p className="text-[#888]">Excellent</p></div><div className="bg-[#1a1a1a] rounded p-2 text-center"><p className="text-blue-400 font-bold">70-79</p><p className="text-[#888]">Good</p></div><div className="bg-[#1a1a1a] rounded p-2 text-center"><p className="text-orange-400 font-bold">60-69</p><p className="text-[#888]">Average</p></div></div></div>
            <div className="p-4 bg-[#1a1a1a]"><button onClick={() => setShowKeySkillsPopup(false)} className="w-full py-3 bg-[#FF6B35] text-[#1a1a1a] font-bold rounded-lg uppercase text-sm">Got It</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
