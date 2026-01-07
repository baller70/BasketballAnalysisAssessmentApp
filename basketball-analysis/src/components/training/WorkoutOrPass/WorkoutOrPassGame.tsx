"use client"

/**
 * Workout or Pass: Basketball Workout Edition
 * 
 * A Tinder-style drill discovery game where users swipe/vote on drills
 * matched to their shooting flaws. Designed for motivation and engagement.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import Image from "next/image"
import { 
  Dumbbell, SkipForward, Trophy, Zap, Target, 
  Crown, TrendingUp, Users, Clock, Star,
  Sparkles, Medal, RotateCcw, Play,
  ChevronRight, ChevronLeft, Flame, Check, X, Timer,
  Award, BarChart3, Calendar, ArrowRight,
  Activity, Focus, Hand, Footprints, Move,
  CircleDot, Crosshair, Gauge, ListChecks,
  ArrowLeftRight, CheckCircle
} from "lucide-react"
import { 
  ALL_DRILLS, 
  Drill, 
  SkillLevel,
  DrillFocusArea,
  getDrillsByLevel,
  getDrillsByFocusArea 
} from "@/data/drillDatabase"
import { DrillExecutionPage } from "./DrillExecutionPage"

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ============================================
// WORKOUT IMAGES DATABASE
// ============================================

const WORKOUT_IMAGES: Record<DrillFocusArea, string> = {
  'ELBOW_ALIGNMENT': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
  'KNEE_BEND': 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800&h=600&fit=crop',
  'RELEASE_POINT': 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=600&fit=crop',
  'FOLLOW_THROUGH': 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=600&fit=crop',
  'BALANCE': 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=800&h=600&fit=crop',
  'ARC_TRAJECTORY': 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800&h=600&fit=crop',
  'FOOTWORK': 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=800&h=600&fit=crop',
  'CONSISTENCY': 'https://images.unsplash.com/photo-1504450758481-7338bbe75c8e?w=800&h=600&fit=crop',
  'FATIGUE': 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=600&fit=crop',
  'GAME_SITUATION': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
  'MICRO_ADJUSTMENT': 'https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800&h=600&fit=crop'
}

// ============================================
// TYPES
// ============================================

interface UserFlaws {
  elbowAlignment?: boolean
  kneeBend?: boolean
  releasePoint?: boolean
  followThrough?: boolean
  balance?: boolean
  arcTrajectory?: boolean
  footwork?: boolean
}

interface UserProfile {
  skillLevel?: SkillLevel
  flaws?: UserFlaws
}

interface VoteStats {
  [drillId: string]: {
    trainCount: number
    passCount: number
  }
}

interface GameStats {
  totalVotes: number
  trainCount: number
  passCount: number
  currentStreak: number
  bestStreak: number
  xp: number
  level: number
  drillsCompleted: number
}

interface TrainingHistory {
  drillId: string
  drill: Drill
  action: 'train' | 'pass'
  completedAt: Date
  completed?: boolean
}

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEYS = {
  VOTE_STATS: 'shotiq_workout_vote_stats',
  GAME_STATS: 'shotiq_workout_game_stats',
  TRAINING_HISTORY: 'shotiq_training_history',
  SEEN_DRILLS: 'shotiq_seen_drills'
}

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : defaultValue
  } catch {
    return defaultValue
  }
}

const saveToStorage = <T,>(key: string, value: T): void => {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    console.error('Failed to save to localStorage')
  }
}

// ============================================
// CONSTANTS
// ============================================

const XP_PER_VOTE = 10
const XP_PER_TRAIN = 25
const XP_PER_COMPLETE = 100
const XP_PER_LEVEL = 500
const STREAK_BONUS_MULTIPLIER = 1.5

const FOCUS_AREA_LABELS: Record<DrillFocusArea, string> = {
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

const FOCUS_AREA_COLORS: Record<DrillFocusArea, string> = {
  'ELBOW_ALIGNMENT': '#FF6B35',
  'KNEE_BEND': '#3B82F6',
  'RELEASE_POINT': '#A855F7',
  'FOLLOW_THROUGH': '#22C55E',
  'BALANCE': '#F59E0B',
  'ARC_TRAJECTORY': '#6366F1',
  'FOOTWORK': '#14B8A6',
  'CONSISTENCY': '#EF4444',
  'FATIGUE': '#F59E0B',
  'GAME_SITUATION': '#EF4444',
  'MICRO_ADJUSTMENT': '#6B7280'
}

const FOCUS_AREA_ICONS: Record<DrillFocusArea, React.ElementType> = {
  'ELBOW_ALIGNMENT': Target,
  'KNEE_BEND': Activity,
  'RELEASE_POINT': Crosshair,
  'FOLLOW_THROUGH': Hand,
  'BALANCE': Move,
  'ARC_TRAJECTORY': TrendingUp,
  'FOOTWORK': Footprints,
  'CONSISTENCY': CircleDot,
  'FATIGUE': Flame,
  'GAME_SITUATION': Zap,
  'MICRO_ADJUSTMENT': Focus
}

const SKILL_LEVEL_LABELS: Record<SkillLevel, string> = {
  'ELEMENTARY': 'Beginner',
  'MIDDLE_SCHOOL': 'Intermediate',
  'HIGH_SCHOOL': 'Advanced',
  'COLLEGE': 'Elite',
  'PROFESSIONAL': 'Pro'
}

const SKILL_LEVEL_COLORS: Record<SkillLevel, string> = {
  'ELEMENTARY': '#22C55E',
  'MIDDLE_SCHOOL': '#3B82F6',
  'HIGH_SCHOOL': '#A855F7',
  'COLLEGE': '#F59E0B',
  'PROFESSIONAL': '#EF4444'
}

// ============================================
// FLAW TO FOCUS AREA MAPPING
// ============================================

const mapFlawsToFocusAreas = (flaws: UserFlaws): DrillFocusArea[] => {
  const focusAreas: DrillFocusArea[] = []
  
  if (flaws.elbowAlignment) focusAreas.push('ELBOW_ALIGNMENT')
  if (flaws.kneeBend) focusAreas.push('KNEE_BEND')
  if (flaws.releasePoint) focusAreas.push('RELEASE_POINT')
  if (flaws.followThrough) focusAreas.push('FOLLOW_THROUGH')
  if (flaws.balance) focusAreas.push('BALANCE')
  if (flaws.arcTrajectory) focusAreas.push('ARC_TRAJECTORY')
  if (flaws.footwork) focusAreas.push('FOOTWORK')
  
  return focusAreas
}

// ============================================
// MAIN COMPONENT
// ============================================

export interface DrillFilters {
  skillLevel: SkillLevel | 'all'
  focusArea: DrillFocusArea | 'all'
  difficulty: number | 'all'
  duration: string
}

interface WorkoutOrPassGameProps {
  userProfile?: UserProfile
  filters?: DrillFilters
  onStartDrill?: (drill: Drill) => void
}

// Duration ranges for filtering
const DURATION_RANGES: Record<string, { min: number; max: number }> = {
  'all': { min: 0, max: 999 },
  'quick': { min: 0, max: 5 },
  'short': { min: 5, max: 10 },
  'medium': { min: 10, max: 20 },
  'long': { min: 20, max: 30 },
  'extended': { min: 30, max: 999 },
}

export function WorkoutOrPassGame({ userProfile, filters, onStartDrill }: WorkoutOrPassGameProps) {
  // Hydration guard
  const [isHydrated, setIsHydrated] = useState(false)
  
  // State
  const [activeTab, setActiveTab] = useState<'play' | 'trending' | 'history'>('play')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [voteStats, setVoteStats] = useState<VoteStats>({})
  const [gameStats, setGameStats] = useState<GameStats>({
    totalVotes: 0,
    trainCount: 0,
    passCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    xp: 0,
    level: 1,
    drillsCompleted: 0
  })
  const [trainingHistory, setTrainingHistory] = useState<TrainingHistory[]>([])
  const [seenDrills, setSeenDrills] = useState<Set<string>>(new Set())
  const [showVoteResult, setShowVoteResult] = useState(false)
  const [lastVote, setLastVote] = useState<'train' | 'pass' | null>(null)
  const [selectedDrill, setSelectedDrill] = useState<Drill | null>(null)
  
  // Swipe state
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStartX = useRef(0)
  const cardRef = useRef<HTMLDivElement>(null)

  // Load from storage after hydration
  useEffect(() => {
    setIsHydrated(true)
    setVoteStats(loadFromStorage(STORAGE_KEYS.VOTE_STATS, {}))
    setGameStats(loadFromStorage(STORAGE_KEYS.GAME_STATS, {
      totalVotes: 0,
      trainCount: 0,
      passCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      xp: 0,
      level: 1,
      drillsCompleted: 0
    }))
    setTrainingHistory(loadFromStorage(STORAGE_KEYS.TRAINING_HISTORY, []))
    const stored = loadFromStorage<string[]>(STORAGE_KEYS.SEEN_DRILLS, [])
    setSeenDrills(new Set(stored))
  }, [])

  // Filter drills based on user profile, flaws, and filters
  const matchedDrills = useMemo(() => {
    let drills = [...ALL_DRILLS]
    
    // Filter by skill level (from filters or userProfile)
    const skillLevel = filters?.skillLevel !== 'all' ? filters?.skillLevel : userProfile?.skillLevel
    if (skillLevel) {
      drills = drills.filter(d => d.level === skillLevel)
    }
    
    // Filter by focus area/drill type
    if (filters?.focusArea && filters.focusArea !== 'all') {
      drills = drills.filter(d => d.focusArea === filters.focusArea)
    }
    
    // Filter by difficulty
    if (filters?.difficulty && filters.difficulty !== 'all') {
      drills = drills.filter(d => d.difficulty === filters.difficulty)
    }
    
    // Filter by duration
    if (filters?.duration && filters.duration !== 'all') {
      const range = DURATION_RANGES[filters.duration] || { min: 0, max: 999 }
      drills = drills.filter(d => d.duration >= range.min && d.duration <= range.max)
    }
    
    // Prioritize drills matching user flaws
    if (userProfile?.flaws) {
      const focusAreas = mapFlawsToFocusAreas(userProfile.flaws)
      if (focusAreas.length > 0) {
        drills.sort((a, b) => {
          const aMatches = focusAreas.includes(a.focusArea) ? 1 : 0
          const bMatches = focusAreas.includes(b.focusArea) ? 1 : 0
          return bMatches - aMatches
        })
      }
    }
    
    // Shuffle slightly
    for (let i = drills.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [drills[i], drills[j]] = [drills[j], drills[i]]
    }
    
    return drills
  }, [userProfile, filters])

  const currentDrill = matchedDrills[currentIndex % matchedDrills.length]

  // Save functions
  const saveVoteStats = useCallback((stats: VoteStats) => {
    setVoteStats(stats)
    saveToStorage(STORAGE_KEYS.VOTE_STATS, stats)
  }, [])

  const saveGameStats = useCallback((stats: GameStats) => {
    setGameStats(stats)
    saveToStorage(STORAGE_KEYS.GAME_STATS, stats)
  }, [])

  const saveTrainingHistory = useCallback((history: TrainingHistory[]) => {
    setTrainingHistory(history)
    saveToStorage(STORAGE_KEYS.TRAINING_HISTORY, history)
  }, [])

  const saveSeenDrills = useCallback((seen: Set<string>) => {
    setSeenDrills(seen)
    saveToStorage(STORAGE_KEYS.SEEN_DRILLS, Array.from(seen))
  }, [])

  // Vote handler
  const handleVote = useCallback((action: 'train' | 'pass') => {
    if (!currentDrill) return

    const drillId = currentDrill.id
    const newVoteStats = { ...voteStats }
    if (!newVoteStats[drillId]) {
      newVoteStats[drillId] = { trainCount: 0, passCount: 0 }
    }
    if (action === 'train') {
      newVoteStats[drillId].trainCount++
    } else {
      newVoteStats[drillId].passCount++
    }
    saveVoteStats(newVoteStats)

    const xpGained = action === 'train' ? XP_PER_TRAIN : XP_PER_VOTE
    const newStreak = action === 'train' ? gameStats.currentStreak + 1 : 0
    const totalXp = gameStats.xp + xpGained * (newStreak > 3 ? STREAK_BONUS_MULTIPLIER : 1)
    const newLevel = Math.floor(totalXp / XP_PER_LEVEL) + 1

    const newGameStats: GameStats = {
      totalVotes: gameStats.totalVotes + 1,
      trainCount: gameStats.trainCount + (action === 'train' ? 1 : 0),
      passCount: gameStats.passCount + (action === 'pass' ? 1 : 0),
      currentStreak: newStreak,
      bestStreak: Math.max(gameStats.bestStreak, newStreak),
      xp: totalXp,
      level: newLevel,
      drillsCompleted: gameStats.drillsCompleted
    }
    saveGameStats(newGameStats)

    const historyEntry: TrainingHistory = {
      drillId: currentDrill.id,
      drill: currentDrill,
      action,
      completedAt: new Date(),
      completed: false
    }
    saveTrainingHistory([historyEntry, ...trainingHistory.slice(0, 99)])

    const newSeen = new Set(seenDrills)
    newSeen.add(drillId)
    saveSeenDrills(newSeen)

    setLastVote(action)
    setShowVoteResult(true)

    setTimeout(() => {
      setShowVoteResult(false)
      setLastVote(null)
      setCurrentIndex(prev => prev + 1)
      setDragX(0)
    }, 1500)
  }, [currentDrill, voteStats, gameStats, trainingHistory, seenDrills, saveVoteStats, saveGameStats, saveTrainingHistory, saveSeenDrills])

  // Swipe handlers
  const handleDragStart = useCallback((clientX: number) => {
    setIsDragging(true)
    dragStartX.current = clientX
  }, [])

  const handleDragMove = useCallback((clientX: number) => {
    if (!isDragging) return
    const delta = clientX - dragStartX.current
    setDragX(delta)
  }, [isDragging])

  const handleDragEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)
    
    if (dragX > 100) {
      handleVote('train')
    } else if (dragX < -100) {
      handleVote('pass')
    } else {
      setDragX(0)
    }
  }, [isDragging, dragX, handleVote])

  const handleTouchStart = (e: React.TouchEvent) => handleDragStart(e.touches[0].clientX)
  const handleTouchMove = (e: React.TouchEvent) => handleDragMove(e.touches[0].clientX)
  const handleTouchEnd = () => handleDragEnd()

  const handleMouseDown = (e: React.MouseEvent) => handleDragStart(e.clientX)
  const handleMouseMove = (e: React.MouseEvent) => handleDragMove(e.clientX)
  const handleMouseUp = () => handleDragEnd()
  const handleMouseLeave = () => { if (isDragging) handleDragEnd() }

  const resetGame = useCallback(() => {
    setCurrentIndex(0)
    setSeenDrills(new Set())
    saveToStorage(STORAGE_KEYS.SEEN_DRILLS, [])
  }, [])

  const getVotePercentage = (drillId: string): { train: number, pass: number } => {
    const stats = voteStats[drillId]
    if (!stats) return { train: 50, pass: 50 }
    const total = stats.trainCount + stats.passCount
    if (total === 0) return { train: 50, pass: 50 }
    return {
      train: Math.round((stats.trainCount / total) * 100),
      pass: Math.round((stats.passCount / total) * 100)
    }
  }

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center h-[500px]">
        <div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const FocusIcon = currentDrill ? FOCUS_AREA_ICONS[currentDrill.focusArea] : Target

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Modern Header */}
      <div className="mb-5">
        {/* Title Row */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-xl tracking-tight">Discover Drills</h2>
            <p className="text-[#666] text-sm">Swipe to find your perfect workout</p>
          </div>
          
          {/* Level Badge */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] p-[2px]">
                <div className="w-full h-full rounded-full bg-[#0a0a0a] flex items-center justify-center">
                  <span className="text-white font-black text-lg">{gameStats.level}</span>
                </div>
              </div>
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-[#FF6B35] rounded-full">
                <span className="text-white text-[9px] font-bold uppercase">LVL</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stats Bar */}
        <div className="flex items-center gap-3 p-3 bg-[#111] rounded-2xl border border-[#1a1a1a]">
          {/* XP Progress */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[#888] text-xs font-medium">Progress</span>
              <span className="text-[#FF6B35] text-xs font-bold">{gameStats.xp} XP</span>
            </div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (gameStats.xp % 500) / 5)}%` }}
              />
            </div>
          </div>
          
          {/* Divider */}
          <div className="w-px h-8 bg-[#222]" />
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Flame className="w-3.5 h-3.5 text-[#FF6B35]" />
                <span className="text-white font-bold text-sm">{gameStats.currentStreak}</span>
              </div>
              <span className="text-[#555] text-[10px]">Streak</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5 text-green-500" />
                <span className="text-white font-bold text-sm">{gameStats.trainCount}</span>
              </div>
              <span className="text-[#555] text-[10px]">Done</span>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-[#FFD700]" />
                <span className="text-white font-bold text-sm">{gameStats.bestStreak}</span>
              </div>
              <span className="text-[#555] text-[10px]">Best</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="relative flex p-1 mb-4 bg-[#111] rounded-2xl border border-[#222]">
        {/* Active Tab Indicator */}
        <div 
          className="absolute top-1 bottom-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8555] rounded-xl transition-all duration-300 ease-out shadow-lg shadow-[#FF6B35]/20"
          style={{
            width: 'calc(33.333% - 4px)',
            left: activeTab === 'play' ? '4px' : activeTab === 'trending' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
          }}
        />
        {[
          { id: 'play', label: 'Discover', icon: Play },
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'history', label: 'My Drills', icon: Dumbbell }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'play' | 'trending' | 'history')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Play Tab - Drill Cards */}
      {activeTab === 'play' && (
        <div className="relative">
          {currentDrill ? (
            <>
              {/* Side Glow Effects Container */}
              <div className="relative">
                {/* Left Side - Pass (Red) Glow */}
                <div 
                  className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10 rounded-l-3xl overflow-hidden transition-opacity duration-150"
                  style={{
                    opacity: dragX < 0 ? Math.min(1, Math.abs(dragX) / 100) : 0,
                    background: `linear-gradient(to right, rgba(239, 68, 68, ${Math.min(0.9, Math.abs(dragX) / 80)}) 0%, transparent 100%)`,
                  }}
                >
                  {/* Animated X Icon */}
                  <div 
                    className="absolute inset-0 flex items-center justify-start pl-4"
                    style={{
                      opacity: Math.min(1, Math.abs(dragX) / 60),
                      transform: `scale(${0.5 + Math.min(0.5, Math.abs(dragX) / 200)})`
                    }}
                  >
                    <X className="w-10 h-10 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Right Side - Train (Orange) Glow */}
                <div 
                  className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10 rounded-r-3xl overflow-hidden transition-opacity duration-150"
                  style={{
                    opacity: dragX > 0 ? Math.min(1, dragX / 100) : 0,
                    background: `linear-gradient(to left, rgba(255, 107, 53, ${Math.min(0.9, dragX / 80)}) 0%, transparent 100%)`,
                  }}
                >
                  {/* Animated Check Icon */}
                  <div 
                    className="absolute inset-0 flex items-center justify-end pr-4"
                    style={{
                      opacity: Math.min(1, dragX / 60),
                      transform: `scale(${0.5 + Math.min(0.5, dragX / 200)})`
                    }}
                  >
                    <Check className="w-10 h-10 text-white drop-shadow-lg" />
                  </div>
                </div>
                
                {/* Drill Card - Redesigned */}
                <div
                  ref={cardRef}
                  className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl overflow-hidden border-2 shadow-2xl touch-none select-none cursor-grab active:cursor-grabbing transition-all duration-150"
                  style={{
                    transform: `translateX(${dragX}px) rotate(${dragX * 0.05}deg)`,
                    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
                    borderColor: dragX > 30 
                      ? `rgba(255, 107, 53, ${Math.min(1, dragX / 100)})` 
                      : dragX < -30 
                        ? `rgba(239, 68, 68, ${Math.min(1, Math.abs(dragX) / 100)})` 
                        : '#3a3a3a',
                    boxShadow: dragX > 30 
                      ? `0 0 30px rgba(255, 107, 53, ${Math.min(0.5, dragX / 150)})` 
                      : dragX < -30 
                        ? `0 0 30px rgba(239, 68, 68, ${Math.min(0.5, Math.abs(dragX) / 150)})` 
                        : 'none'
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                >
                {/* Image Section */}
                <div className="relative h-[280px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] overflow-hidden">
                  <img 
                    src={WORKOUT_IMAGES[currentDrill.focusArea]} 
                    alt={currentDrill.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                  
                  {/* Focus Area Badge */}
                  <div 
                    className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-xs font-black uppercase flex items-center gap-1.5"
                    style={{ backgroundColor: FOCUS_AREA_COLORS[currentDrill.focusArea] }}
                  >
                    <FocusIcon className="w-3.5 h-3.5 text-white" />
                    <span className="text-white">{FOCUS_AREA_LABELS[currentDrill.focusArea]}</span>
                  </div>
                  
                  {/* Modern Difficulty Indicator */}
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    {/* Segmented Bars */}
                    <div className="flex items-end gap-0.5 h-4">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-1.5 rounded-full transition-all ${
                            level <= currentDrill.difficulty
                              ? currentDrill.difficulty <= 2 
                                ? 'bg-green-400' 
                                : currentDrill.difficulty <= 3 
                                  ? 'bg-yellow-400' 
                                  : currentDrill.difficulty <= 4 
                                    ? 'bg-orange-400' 
                                    : 'bg-red-400'
                              : 'bg-white/20'
                          }`}
                          style={{ height: `${level * 3 + 4}px` }}
                        />
                      ))}
                    </div>
                    {/* Difficulty Label Badge */}
                    <div 
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        currentDrill.difficulty <= 1 
                          ? 'bg-green-500/90 text-white' 
                          : currentDrill.difficulty <= 2 
                            ? 'bg-green-400/90 text-white' 
                            : currentDrill.difficulty <= 3 
                              ? 'bg-yellow-400/90 text-black' 
                              : currentDrill.difficulty <= 4 
                                ? 'bg-orange-500/90 text-white' 
                                : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {currentDrill.difficulty <= 1 ? 'Easy' : currentDrill.difficulty <= 2 ? 'Light' : currentDrill.difficulty <= 3 ? 'Medium' : currentDrill.difficulty <= 4 ? 'Hard' : 'Elite'}
                    </div>
                  </div>
                  
                  {/* Skill Level Badge */}
                  <div 
                    className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase"
                    style={{ backgroundColor: SKILL_LEVEL_COLORS[currentDrill.level], color: '#fff' }}
                  >
                    {SKILL_LEVEL_LABELS[currentDrill.level]}
                  </div>
                  
                  {/* Duration Badge */}
                  <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span className="text-white text-xs font-bold">{currentDrill.duration} min</span>
                  </div>
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                </div>

                {/* Card Body */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight">{currentDrill.title}</h3>
                    <p className="text-[#888] text-sm mt-1 line-clamp-2">{currentDrill.description}</p>
                  </div>
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <ListChecks className="w-4 h-4 text-[#FF6B35] mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{currentDrill.steps.length}</p>
                      <p className="text-xs text-[#888]">Steps</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <Clock className="w-4 h-4 text-[#3B82F6] mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">{currentDrill.duration}</p>
                      <p className="text-xs text-[#888]">Minutes</p>
                    </div>
                    <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
                      <Gauge className={`w-4 h-4 mx-auto mb-1 ${
                        currentDrill.difficulty <= 2 ? 'text-green-400' : currentDrill.difficulty <= 3 ? 'text-yellow-400' : currentDrill.difficulty <= 4 ? 'text-orange-400' : 'text-red-400'
                      }`} />
                      {/* Modern difficulty bar */}
                      <div className="flex justify-center gap-0.5 mb-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`w-3 h-1.5 rounded-full ${
                              level <= currentDrill.difficulty
                                ? currentDrill.difficulty <= 2 
                                  ? 'bg-green-400' 
                                  : currentDrill.difficulty <= 3 
                                    ? 'bg-yellow-400' 
                                    : currentDrill.difficulty <= 4 
                                      ? 'bg-orange-400' 
                                      : 'bg-red-400'
                                : 'bg-white/10'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-[#888]">Difficulty</p>
                    </div>
                  </div>

                  {/* Why It Matters */}
                  <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-xl p-3">
                    <div className="flex items-start gap-2">
                      <Sparkles className="w-4 h-4 text-[#FF6B35] mt-0.5 flex-shrink-0" />
                      <p className="text-[#FF6B35] text-sm">{currentDrill.whyItMatters}</p>
                    </div>
                  </div>

                  {/* Expected Outcomes */}
                  <div className="flex flex-wrap gap-2">
                    {currentDrill.expectedOutcomes.slice(0, 3).map((outcome, i) => (
                      <span key={i} className="px-3 py-1 bg-[#2a2a2a] text-[#E5E5E5] rounded-lg text-xs flex items-center gap-1">
                        <Check className="w-3 h-3 text-green-500" />
                        {outcome}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vote Result Overlay */}
                {showVoteResult && (
                  <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn rounded-3xl z-20">
                    <div className="animate-bounce">
                      {lastVote === 'train' ? (
                        <Target className="w-20 h-20 text-[#FF6B35] mb-4" />
                      ) : (
                        <X className="w-20 h-20 text-[#888] mb-4" />
                      )}
                    </div>
                    
                    {lastVote === 'train' ? (
                      <>
                        <h4 className="text-[#FF6B35] font-bold text-xl mb-2">LET&apos;S TRAIN!</h4>
                        <p className="text-[#888] text-sm mb-4">+{XP_PER_TRAIN} XP earned</p>
                      </>
                    ) : (
                      <>
                        <h4 className="text-[#888] font-bold text-xl mb-2">PASSED</h4>
                        <p className="text-[#666] text-sm mb-4">+{XP_PER_VOTE} XP earned</p>
                      </>
                    )}
                    
                    <h3 className="text-white font-bold mb-4">Community Votes</h3>
                    
                    {/* Train Bar */}
                    <div className="w-full max-w-[280px] mb-3">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#FF6B35] font-bold flex items-center gap-1">
                          <Target className="w-4 h-4" /> Train
                        </span>
                        <span className="text-[#FF6B35] font-bold">{getVotePercentage(currentDrill.id).train}%</span>
                      </div>
                      <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] transition-all duration-700"
                          style={{ width: `${getVotePercentage(currentDrill.id).train}%` }}
                        />
                      </div>
                    </div>
                    
                    {/* Pass Bar */}
                    <div className="w-full max-w-[280px]">
                      <div className="flex justify-between mb-1">
                        <span className="text-[#888] font-bold flex items-center gap-1">
                          <X className="w-4 h-4" /> Pass
                        </span>
                        <span className="text-[#888] font-bold">{getVotePercentage(currentDrill.id).pass}%</span>
                      </div>
                      <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#666] transition-all duration-700 delay-200"
                          style={{ width: `${getVotePercentage(currentDrill.id).pass}%` }}
                        />
                      </div>
                    </div>
                    
                    {lastVote === 'train' && (
                      <p className="mt-6 text-[#FF6B35] font-bold flex items-center gap-2 animate-pulse">
                        <Award className="w-5 h-5" /> Added to Training List!
                      </p>
                    )}
                  </div>
                )}
              </div>
              </div>{/* End Side Glow Effects Container */}

              {/* Swipe Hint - Animated */}
              <div className="flex items-center justify-center gap-3 mt-4 mb-2">
                <ChevronLeft className="w-4 h-4 text-[#555] animate-[bounce-left_1.5s_ease-in-out_infinite]" />
                <div className="flex items-center gap-1.5">
                  <ArrowLeftRight className="w-3.5 h-3.5 text-[#555] animate-pulse" />
                  <span className="text-[#555] text-[10px] font-medium uppercase tracking-widest">Swipe or Tap</span>
                </div>
                <ChevronRight className="w-4 h-4 text-[#555] animate-[bounce-right_1.5s_ease-in-out_infinite]" />
              </div>

              {/* Action Buttons - PASS and TRAIN */}
              <div className="flex items-center justify-between gap-3 px-2">
                {/* PASS Button */}
                <button
                  type="button"
                  onClick={() => handleVote('pass')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-red-500/20"
                  style={{
                    backgroundColor: `rgba(239, 68, 68, ${dragX < -30 ? Math.min(0.9, Math.abs(dragX) / 120) : 0.08})`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `rgba(239, 68, 68, ${dragX < -30 ? Math.min(0.8, Math.abs(dragX) / 100) : 0.15})`,
                    boxShadow: dragX < -50 
                      ? `0 4px 20px rgba(239, 68, 68, ${Math.min(0.4, Math.abs(dragX) / 200)})` 
                      : 'none'
                  }}
                >
                  <ChevronLeft 
                    className="w-4 h-4 transition-colors duration-300" 
                    style={{ color: dragX < -60 ? 'white' : `rgba(248, 113, 113, ${dragX < -30 ? 1 : 0.4})` }}
                  />
                  <X 
                    className="w-5 h-5 transition-colors duration-300" 
                    style={{ color: dragX < -60 ? 'white' : `rgba(248, 113, 113, ${dragX < -30 ? 1 : 0.5})` }}
                  />
                  <span 
                    className="font-semibold text-sm uppercase tracking-wide transition-colors duration-300"
                    style={{ color: dragX < -60 ? 'white' : `rgba(248, 113, 113, ${dragX < -30 ? 1 : 0.5})` }}
                  >
                    Pass
                  </span>
                </button>
                
                {/* TRAIN Button */}
                <button
                  type="button"
                  onClick={() => {
                    handleVote('train')
                    if (onStartDrill) onStartDrill(currentDrill)
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 hover:bg-[#FF6B35]/20"
                  style={{
                    backgroundColor: `rgba(255, 107, 53, ${dragX > 30 ? Math.min(0.9, Math.abs(dragX) / 120) : 0.08})`,
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderColor: `rgba(255, 107, 53, ${dragX > 30 ? Math.min(0.8, Math.abs(dragX) / 100) : 0.15})`,
                    boxShadow: dragX > 50 
                      ? `0 4px 20px rgba(255, 107, 53, ${Math.min(0.4, Math.abs(dragX) / 200)})` 
                      : 'none'
                  }}
                >
                  <span 
                    className="font-semibold text-sm uppercase tracking-wide transition-colors duration-300"
                    style={{ color: dragX > 60 ? 'white' : `rgba(255, 107, 53, ${dragX > 30 ? 1 : 0.5})` }}
                  >
                    Train
                  </span>
                  {/* Basketball Icon */}
                  <svg 
                    viewBox="0 0 24 24" 
                    className="w-5 h-5 transition-colors duration-300"
                    style={{ color: dragX > 60 ? 'white' : `rgba(255, 107, 53, ${dragX > 30 ? 1 : 0.5})` }}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2 12h20" />
                  </svg>
                  <ChevronRight 
                    className="w-4 h-4 transition-colors duration-300" 
                    style={{ color: dragX > 60 ? 'white' : `rgba(255, 107, 53, ${dragX > 30 ? 1 : 0.4})` }}
                  />
                </button>
              </div>
              
              <style jsx>{`
                @keyframes bounce-left {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(-4px); }
                }
                @keyframes bounce-right {
                  0%, 100% { transform: translateX(0); }
                  50% { transform: translateX(4px); }
                }
              `}</style>

              {/* Progress */}
              <div className="text-center mt-4">
                <p className="text-[#666] text-sm">
                  {currentIndex + 1} of {matchedDrills.length} drills
                </p>
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
              <h3 className="text-white font-bold text-xl mb-2">All Done!</h3>
              <p className="text-[#888] mb-4">You&apos;ve seen all available drills</p>
              <button
                type="button"
                onClick={resetGame}
                className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold rounded-xl"
              >
                Start Over
              </button>
            </div>
          )}
        </div>
      )}

      {/* Trending Tab - Leaderboard */}
      {activeTab === 'trending' && (
        <TrendingDrills voteStats={voteStats} onSelectDrill={setSelectedDrill} />
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <TrainingHistoryView 
          history={trainingHistory} 
          gameStats={gameStats}
          onSelectDrill={setSelectedDrill}
        />
      )}

      {/* Drill Execution Page - Full Screen */}
      {selectedDrill && selectedDrill.focusArea && (
        <DrillExecutionPage 
          drill={selectedDrill} 
          onClose={() => setSelectedDrill(null)}
          onStartDrill={() => {
            if (onStartDrill) onStartDrill(selectedDrill)
            setSelectedDrill(null)
          }}
        />
      )}
    </div>
  )
}

// ============================================
// TRENDING DRILLS COMPONENT - PREMIUM DESIGN
// ============================================

interface TrendingDrillsProps {
  voteStats: VoteStats
  onSelectDrill: (drill: Drill) => void
}

function TrendingDrills({ voteStats, onSelectDrill }: TrendingDrillsProps) {
  const rankedDrills = useMemo(() => {
    return ALL_DRILLS
      .map(drill => {
        const stats = voteStats[drill.id] || { trainCount: 0, passCount: 0 }
        const total = stats.trainCount + stats.passCount
        const trainPercent = total > 0 ? (stats.trainCount / total) * 100 : 50
        return { drill, trainPercent, totalVotes: total }
      })
      .sort((a, b) => b.trainPercent - a.trainPercent)
      .slice(0, 20)
  }, [voteStats])

  // Render rank badge based on position
  const renderRankBadge = (index: number) => {
    if (index === 0) {
      // #1 - Champion Crown
      return (
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FFD700] via-[#FFA500] to-[#FF8C00] flex items-center justify-center shadow-lg shadow-[#FFD700]/30">
            <Crown className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-[10px] font-black text-[#FFD700]">1</span>
          </div>
        </div>
      )
    } else if (index === 1) {
      // #2 - Silver Medal
      return (
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#E8E8E8] via-[#C0C0C0] to-[#A8A8A8] flex items-center justify-center shadow-lg shadow-white/20">
            <Medal className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-[10px] font-black text-[#888]">2</span>
          </div>
        </div>
      )
    } else if (index === 2) {
      // #3 - Bronze Medal
      return (
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#CD9B5A] via-[#CD7F32] to-[#8B5A2B] flex items-center justify-center shadow-lg shadow-[#CD7F32]/30">
            <Award className="w-6 h-6 text-white drop-shadow-md" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-md">
            <span className="text-[10px] font-black text-[#CD7F32]">3</span>
          </div>
        </div>
      )
    } else {
      // #4+ - Simple number
      return (
        <div className="w-12 h-12 rounded-2xl bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
          <span className="text-lg font-black text-[#666]">{index + 1}</span>
        </div>
      )
    }
  }

  return (
    <div className="space-y-4">
      {/* Premium Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a1a1a] via-[#252525] to-[#1a1a1a] p-5 border border-[#333]">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF6B35]/10 rounded-full blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center shadow-lg shadow-[#FF6B35]/30">
            <Trophy className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">TOP RATED DRILLS</h3>
            <p className="text-[#888] text-sm">Community favorites • Updated live</p>
          </div>
        </div>
      </div>

      {/* Podium - Top 3 */}
      <div className="grid grid-cols-3 gap-2">
        {rankedDrills.slice(0, 3).map((item, index) => {
          const order = index === 0 ? 1 : index === 1 ? 0 : 2 // Reorder: 2nd, 1st, 3rd
          const actualIndex = order === 1 ? 0 : order === 0 ? 1 : 2
          const drill = rankedDrills[actualIndex]
          if (!drill) return null
          
          return (
            <button
              key={drill.drill.id}
              type="button"
              onClick={() => onSelectDrill(drill.drill)}
              className={`relative rounded-2xl overflow-hidden transition-all hover:scale-[1.02] ${
                actualIndex === 0 
                  ? 'bg-gradient-to-b from-[#FFD700]/20 to-[#1a1a1a] border-2 border-[#FFD700]/50 row-span-1 -mt-2' 
                  : actualIndex === 1 
                    ? 'bg-gradient-to-b from-[#C0C0C0]/20 to-[#1a1a1a] border border-[#C0C0C0]/30 mt-4' 
                    : 'bg-gradient-to-b from-[#CD7F32]/20 to-[#1a1a1a] border border-[#CD7F32]/30 mt-4'
              }`}
              style={{ order }}
            >
              {/* Image */}
              <div className="relative aspect-square">
                <img 
                  src={WORKOUT_IMAGES[drill.drill.focusArea]} 
                  alt={drill.drill.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Rank Badge Overlay */}
                <div className="absolute top-2 left-2">
                  {actualIndex === 0 && <Crown className="w-6 h-6 text-[#FFD700] drop-shadow-lg" />}
                  {actualIndex === 1 && <Medal className="w-5 h-5 text-[#C0C0C0] drop-shadow-lg" />}
                  {actualIndex === 2 && <Award className="w-5 h-5 text-[#CD7F32] drop-shadow-lg" />}
                </div>
                
                {/* Rate Badge */}
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                  <span className="text-[#4ADE80] text-xs font-black">{Math.round(drill.trainPercent)}%</span>
                </div>
                
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white font-bold text-xs line-clamp-2 leading-tight">{drill.drill.title}</p>
                  <p className="text-[#888] text-[10px] mt-1">{drill.drill.duration} min</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Rest of Rankings */}
      <div className="space-y-2">
        {rankedDrills.slice(3).map((item, idx) => {
          const index = idx + 3
          const FocusIcon = FOCUS_AREA_ICONS[item.drill.focusArea]
          
          return (
            <button
              key={item.drill.id}
              type="button"
              onClick={() => onSelectDrill(item.drill)}
              className="w-full bg-[#141414] hover:bg-[#1a1a1a] rounded-2xl p-3 flex items-center gap-3 transition-all border border-[#252525] hover:border-[#333] group"
            >
              {/* Rank Number */}
              {renderRankBadge(index)}

              {/* Image */}
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#2a2a2a] flex-shrink-0 ring-1 ring-[#333]">
                <img 
                  src={WORKOUT_IMAGES[item.drill.focusArea]} 
                  alt={item.drill.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <h4 className="text-white font-bold text-sm truncate group-hover:text-[#FF6B35] transition-colors">{item.drill.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[#666] text-xs flex items-center gap-1">
                    <FocusIcon className="w-3 h-3" />
                    {FOCUS_AREA_LABELS[item.drill.focusArea]}
                  </span>
                  <span className="text-[#444]">•</span>
                  <span className="text-[#666] text-xs">{item.drill.duration} min</span>
                </div>
              </div>

              {/* Train Rate */}
              <div className="text-right flex flex-col items-end gap-1">
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 bg-[#252525] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#4ADE80] to-[#22C55E] rounded-full transition-all"
                      style={{ width: `${item.trainPercent}%` }}
                    />
                  </div>
                  <span className="text-[#4ADE80] text-sm font-bold min-w-[40px] text-right">{Math.round(item.trainPercent)}%</span>
                </div>
                <span className="text-[#555] text-[10px] uppercase tracking-wider">approval</span>
              </div>

              <ChevronRight className="w-4 h-4 text-[#444] group-hover:text-[#FF6B35] transition-colors" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ============================================
// TRAINING HISTORY COMPONENT
// ============================================

interface TrainingHistoryViewProps {
  history: TrainingHistory[]
  gameStats: GameStats
  onSelectDrill: (drill: Drill) => void
}

function TrainingHistoryView({ history, gameStats, onSelectDrill }: TrainingHistoryViewProps) {
  const trainedDrills = history.filter(h => h.action === 'train')

  return (
    <div className="space-y-4">
      {/* Stats Summary */}
      <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-xl p-4 border border-[#2a2a2a]">
        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-[#FF6B35]" />
          Your Training Journey
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FF6B35]">{gameStats.drillsCompleted}</div>
            <div className="text-[#888] text-xs">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">{trainedDrills.length}</div>
            <div className="text-[#888] text-xs">Attempted</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-[#FFD700]">{gameStats.bestStreak}</div>
            <div className="text-[#888] text-xs">Best Streak</div>
          </div>
        </div>
      </div>

      {/* My Drills List - Premium Design */}
      <div className="bg-gradient-to-b from-[#0f0f0f] to-[#0a0a0a] rounded-2xl border border-[#1a1a1a] overflow-hidden">
        {/* Section Header */}
        <div className="p-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-[#2a2a2a] flex items-center justify-center shadow-lg">
                <Clock className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <h4 className="text-white font-bold text-sm tracking-wide">TRAINING HISTORY</h4>
                <p className="text-[#555] text-xs">{history.length} sessions logged</p>
              </div>
            </div>
            {history.length > 0 && (
              <div className="px-3 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a]">
                <span className="text-[#888] text-xs font-medium">Last {Math.min(history.length, 20)}</span>
              </div>
            )}
          </div>
        </div>

        {history.length > 0 ? (
          <div className="divide-y divide-[#151515]">
            {history.slice(0, 20).map((item, index) => {
              const FocusIcon = FOCUS_AREA_ICONS[item.drill.focusArea]
              const dateObj = new Date(item.completedAt)
              const timeAgo = getTimeAgo(dateObj)
              
              return (
                <button
                  key={`${item.drillId}-${index}`}
                  type="button"
                  onClick={() => onSelectDrill(item.drill)}
                  className="w-full p-4 flex items-center gap-4 transition-all hover:bg-[#111] group"
                >
                  {/* Icon with Glow Effect */}
                  <div className="relative">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                      item.action === 'train' 
                        ? 'bg-gradient-to-br from-green-500/20 to-green-600/10 border border-green-500/20 group-hover:border-green-500/40' 
                        : 'bg-[#1a1a1a] border border-[#2a2a2a] group-hover:border-[#3a3a3a]'
                    }`}>
                      {item.action === 'train' ? (
                        <CheckCircle className="w-6 h-6 text-green-500" />
                      ) : (
                        <SkipForward className="w-5 h-5 text-[#666]" />
                      )}
                    </div>
                    {/* Subtle glow for trained items */}
                    {item.action === 'train' && (
                      <div className="absolute inset-0 rounded-xl bg-green-500/10 blur-md -z-10" />
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="text-white text-sm font-semibold truncate group-hover:text-[#FF6B35] transition-colors">
                        {item.drill.title}
                      </h5>
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-[#666]">
                        <FocusIcon className="w-3 h-3" />
                        {FOCUS_AREA_LABELS[item.drill.focusArea]}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#333]" />
                      <span className="text-[#555]">{timeAgo}</span>
                    </div>
                  </div>
                  
                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${
                      item.action === 'train'
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                        : 'bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]'
                    }`}>
                      {item.action === 'train' ? 'Trained' : 'Skipped'}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#333] group-hover:text-[#666] transition-colors" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12 px-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] border border-[#2a2a2a] flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Calendar className="w-8 h-8 text-[#333]" />
            </div>
            <h5 className="text-[#888] font-bold mb-1">No Training History Yet</h5>
            <p className="text-[#555] text-sm max-w-[200px] mx-auto">Start swiping through drills to build your training log</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// DRILL DETAIL MODAL
// ============================================

interface DrillDetailModalProps {
  drill: Drill
  voteStats: VoteStats
  onClose: () => void
  onStartDrill?: (drill: Drill) => void
}

function DrillDetailModal({ drill, voteStats, onClose, onStartDrill }: DrillDetailModalProps) {
  const FocusIcon = FOCUS_AREA_ICONS[drill.focusArea]
  
  // Focus area colors matching the existing training popup
  const focusAreaColors: Record<string, { bg: string; text: string; border: string }> = {
    'ELBOW_ALIGNMENT': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
    'RELEASE_POINT': { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
    'FOLLOW_THROUGH': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
    'BALANCE': { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
    'KNEE_BEND': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
    'ARC_TRAJECTORY': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', border: 'border-indigo-500/30' },
    'FOOTWORK': { bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/30' },
    'CONSISTENCY': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
    'FATIGUE': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
    'GAME_SITUATION': { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
    'MICRO_ADJUSTMENT': { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500/30' }
  }
  
  const colors = focusAreaColors[drill.focusArea] || { bg: 'bg-[#3a3a3a]', text: 'text-[#888]', border: 'border-[#3a3a3a]' }
  
  // Key points based on focus area
  const getKeyPoints = (): string[] => {
    const focusKeyPoints: Record<string, string[]> = {
      'ELBOW_ALIGNMENT': [
        'Elbow stays directly under the ball',
        'Elbow points at the basket throughout the shot',
        'No chicken wing - keep elbow tucked in'
      ],
      'RELEASE_POINT': [
        'Ball releases off fingertips, not palm',
        'Wrist snaps forward at release',
        'Ball should have backspin'
      ],
      'FOLLOW_THROUGH': [
        'Arm fully extends toward the basket',
        'Fingers point down into the rim (gooseneck)',
        'Hold follow-through until ball hits rim'
      ],
      'BALANCE': [
        'Weight evenly distributed on both feet',
        'Knees bent and ready to push up',
        'Body stays centered throughout shot'
      ],
      'KNEE_BEND': [
        'Knees bend at 30-45 degrees',
        'Push up through legs as you shoot',
        'Land softly in the same spot'
      ],
      'ARC_TRAJECTORY': [
        'High arc increases chance of going in',
        'Release point should be above your head',
        'Aim for 45-52 degree arc angle'
      ],
      'FOOTWORK': [
        'Feet shoulder-width apart',
        'Shooting foot slightly forward',
        'Stay balanced on balls of feet'
      ]
    }
    
    return focusKeyPoints[drill.focusArea] || drill.expectedOutcomes.slice(0, 3)
  }
  
  const keyPoints = getKeyPoints()

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a] shadow-2xl">
        {/* Header */}
        <div className={`${colors.bg} p-6 rounded-t-2xl border-b ${colors.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center`}>
                <FocusIcon className={`w-8 h-8 ${colors.text}`} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">{drill.title}</h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full uppercase ${colors.bg} ${colors.text} border ${colors.border}`}>
                    {FOCUS_AREA_LABELS[drill.focusArea]}
                  </span>
                  <span className="text-[#888] text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {drill.duration} MINUTES
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
              <p className={`${colors.text} font-bold uppercase`}>{FOCUS_AREA_LABELS[drill.focusArea]}</p>
            </div>
          </div>
        </div>
        
        {/* Reps / Duration Section */}
        <div className="p-5 border-b border-[#3a3a3a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 border border-[#FF6B35]/30 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-[#888] text-xs uppercase tracking-wider">REPS / DURATION</p>
              <p className="text-[#E5E5E5] font-bold">{drill.duration} minutes</p>
            </div>
          </div>
        </div>
        
        {/* Step-by-Step Instructions */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-3 uppercase text-lg">
            <img 
              src="/icons/coach-feedback.png" 
              alt="Coach" 
              className="w-14 h-14"
              style={{ filter: 'invert(1) brightness(2)' }}
              onError={(e) => {
                // Fallback if image doesn't load
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
            COACH&apos;S INSTRUCTIONS
          </h3>
          <div className="space-y-4">
            {drill.steps.map((step, i) => (
              <div key={i} className="flex items-start gap-4">
                {/* Number badge styled like matched shooters - large Russo One font */}
                <div className="relative flex-shrink-0 w-12 h-12 flex items-center justify-center">
                  <span 
                    className="font-russo text-3xl font-bold text-[#FF6B35]"
                    style={{ 
                      textShadow: '0 0 20px rgba(255, 215, 0, 0.3)'
                    }}
                  >
                    {i + 1}
                  </span>
                  {i < drill.steps.length - 1 && (
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
            <Check className="w-5 h-5" />
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
        
        {/* Pro Tips Section */}
        <div className="p-6 border-b border-[#3a3a3a]">
          <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2 uppercase">
            <Star className="w-5 h-5" />
            PRO TIPS
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
              <span className="text-[#888] text-sm">{drill.whyItMatters}</span>
            </li>
            {drill.technicalNote && (
              <li className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
                <span className="text-[#888] text-sm">{drill.technicalNote}</span>
              </li>
            )}
            {drill.expectedOutcomes.slice(0, 2).map((outcome, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
                <span className="text-[#888] text-sm">{outcome}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Close Button */}
        <div className="p-6">
          <button
            type="button"
            onClick={() => {
              if (onStartDrill) onStartDrill(drill)
              onClose()
            }}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold text-lg hover:brightness-110 transition-all uppercase"
          >
            GOT IT - LET&apos;S GO!
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkoutOrPassGame
