"use client"

/**
 * Drill Execution Page
 * 
 * Interactive basketball court where users can:
 * - Place shooting spots anywhere on the court
 * - Delete spots
 * - Configure tempo, balls per spot, total shots
 * - View drill instructions in a tab
 * - Track shots manually OR with AI-powered hybrid detection
 */

import React, { useState, useRef, useCallback, useEffect } from "react"
import { 
  ArrowLeft, MoreVertical, ChevronRight, ChevronDown, Plus, Minus, 
  RotateCcw, Play, Pause, Clock, X, Target, Check,
  Trash2, Star, Sparkles, Timer, Crosshair, Flame, Camera, Hand,
  Zap, Trophy, TrendingUp, CircleDot, CheckCircle, XCircle, Eye,
  Circle, Type, Move, Grip, MapPin, Edit2, ArrowRight
} from "lucide-react"
import { Drill, DrillFocusArea } from "@/data/drillDatabase"
import { createWorkout } from "@/lib/api/workoutsClient"
import { HybridShotDetector } from "../HybridShotDetector"
import { FullScreenShotTracker } from "../FullScreenShotTracker"

// ============================================
// TYPES
// ============================================

type TrackingMode = 'manual' | 'automatic'
type DrillMode = 'attempts' | 'made' | 'time' | 'streak'
type CourtToolType = 'shot' | 'pass' | 'dribble' | 'cone' | 'text'

// Predefined court position names
const COURT_POSITIONS = [
  { name: 'Left Corner', x: 15, y: 85 },
  { name: 'Left Wing', x: 15, y: 55 },
  { name: 'Left Elbow', x: 30, y: 45 },
  { name: 'Top of Key', x: 50, y: 45 },
  { name: 'Right Elbow', x: 70, y: 45 },
  { name: 'Right Wing', x: 85, y: 55 },
  { name: 'Right Corner', x: 85, y: 85 },
  { name: 'Free Throw', x: 50, y: 40 },
  { name: 'Left Block', x: 35, y: 30 },
  { name: 'Right Block', x: 65, y: 30 },
  { name: 'Baseline Left', x: 25, y: 95 },
  { name: 'Baseline Right', x: 75, y: 95 },
]

// Shot positions (numbered spots on court) - the main shooting spots
interface CourtSpot {
  id: string
  x: number // percentage from left
  y: number // percentage from top
  order: number
  name: string // Position name like "Left Wing", "Right Corner"
  madeShots?: number
  missedShots?: number
}

// Lines drawn on court (pass = dotted, dribble = wavy)
interface CourtLine {
  id: string
  type: 'pass' | 'dribble'
  startX: number
  startY: number
  endX: number
  endY: number
}

// Cones placed on court
interface CourtCone {
  id: string
  x: number
  y: number
}

// Text labels on court
interface CourtText {
  id: string
  x: number
  y: number
  label: string
}

// Tool colors configuration
const TOOL_COLORS = {
  shot: '#FF6B35',   // Orange - main shooting spots
  pass: '#6B7280',   // Gray - subtle
  dribble: '#6B7280', // Gray - subtle  
  cone: '#6B7280',   // Gray - subtle
  text: '#6B7280'    // Gray - subtle
}

interface DrillExecutionPageProps {
  drill: Drill
  onClose: () => void
  onStartDrill: () => void
}

interface ShotHistoryEntry {
  timestamp: number
  spotId: string
  made: boolean
  detectionMethod: 'manual' | 'yolo' | 'coco' | 'color' | 'trajectory' | 'net_movement'
}

// ============================================
// FOCUS AREA STYLING
// ============================================

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

// ============================================
// MAIN COMPONENT
// ============================================

export function DrillExecutionPage({ drill, onClose, onStartDrill }: DrillExecutionPageProps) {
  // Tab state
  const [activeTab, setActiveTab] = useState<'build' | 'instructions'>('build')
  
  // Court spots - positioned below free throw line (ONLY shot positions)
  // Court is oriented with basket at TOP (y=0%), half-court line at bottom (y=100%)
  const [spots, setSpots] = useState<CourtSpot[]>([
    { id: '1', x: 85, y: 55, order: 1, name: 'Right Wing', madeShots: 0, missedShots: 0 },
    { id: '2', x: 50, y: 45, order: 2, name: 'Top of Key', madeShots: 0, missedShots: 0 },
    { id: '3', x: 15, y: 55, order: 3, name: 'Left Wing', madeShots: 0, missedShots: 0 }
  ])
  const [selectedSpot, setSelectedSpot] = useState<string | null>(null)
  const [isPlacingSpot, setIsPlacingSpot] = useState(false)
  const [selectedTool, setSelectedTool] = useState<CourtToolType>('shot')
  
  // Lines for pass/dribble (dotted line with arrow for pass, wavy for dribble)
  const [lines, setLines] = useState<CourtLine[]>([])
  const [isDrawingLine, setIsDrawingLine] = useState(false)
  const [lineStartPos, setLineStartPos] = useState<{x: number, y: number} | null>(null)
  const [linePreviewEnd, setLinePreviewEnd] = useState<{x: number, y: number} | null>(null)
  
  // Cones placed on court
  const [cones, setCones] = useState<CourtCone[]>([])
  
  // Text labels on court
  const [textLabels, setTextLabels] = useState<CourtText[]>([])
  const [textInputId, setTextInputId] = useState<string | null>(null)
  const [textInputValue, setTextInputValue] = useState('')
  
  // Selected item (could be spot, line, cone, or text)
  const [selectedItem, setSelectedItem] = useState<{type: string, id: string} | null>(null)
  
  // Tracking mode - Manual or Automatic (AI-powered)
  const [trackingMode, setTrackingMode] = useState<TrackingMode>('manual')
  const [showTrackingModeSelector, setShowTrackingModeSelector] = useState(false)
  
  // Drill settings
  const [drillMode, setDrillMode] = useState<DrillMode>('attempts')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [ballsPerSpot, setBallsPerSpot] = useState(5)
  const [shotsToTake, setShotsToTake] = useState(50)
  const [timeLimitSeconds, setTimeLimitSeconds] = useState(300) // time limit in SECONDS (default 5 min = 300s)
  const [streakTarget, setStreakTarget] = useState(3) // shots in a row for streak mode
  const [numberOfSets, setNumberOfSets] = useState(1) // how many sets of the drill
  const [currentSet, setCurrentSet] = useState(1) // current set being played
  const [restBetweenSets, setRestBetweenSets] = useState(30) // seconds rest between sets
  
  // Per-set stats tracking
  interface SetStats {
    setNumber: number
    makes: number
    misses: number
    accuracy: number
    time: number // seconds taken for this set
    completed: boolean
  }
  const [setStats, setSetStats] = useState<SetStats[]>([])
  const [isRestPeriod, setIsRestPeriod] = useState(false)
  const [restTimeRemaining, setRestTimeRemaining] = useState(0)
  
  // Court ref for click positioning
  const courtRef = useRef<HTMLDivElement>(null)
  
  // Timer state
  const [isDrillActive, setIsDrillActive] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0) // in seconds
  const [madeShots, setMadeShots] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // Shot tracking state
  const [currentSpotIndex, setCurrentSpotIndex] = useState(0)
  const [currentStreak, setCurrentStreak] = useState(0)
  const [shotHistory, setShotHistory] = useState<ShotHistoryEntry[]>([])
  const [drillComplete, setDrillComplete] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  // Ensures we persist exactly one completed Workout per drill run.
  const persistedRef = useRef(false)

  // When a drill finishes, persist the make/miss result as a completed Workout
  // (Workout.totalMade / totalMissed) so it shows up in the user's history.
  useEffect(() => {
    if (!drillComplete || persistedRef.current) return
    persistedRef.current = true
    const made = madeShots
    const missed = Math.max(attempts - madeShots, 0)
    const total = made + missed
    void createWorkout({
      name: drill.title,
      scheduledDate: new Date(),
      drillIds: [drill.id],
      focusAreas: [drill.focusArea],
      duration: Math.round(elapsedTime / 60) || undefined,
      completed: true,
      completedAt: new Date(),
      totalShots: total,
      totalMade: made,
      totalMissed: missed,
      accuracy: total > 0 ? Math.round((made / total) * 100) : 0,
    })
  }, [drillComplete, madeShots, attempts, elapsedTime, drill])

  // Timer effect
  useEffect(() => {
    if (isDrillActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1)
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isDrillActive, isPaused])
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  
  // Calculate total shots based on mode and settings
  const totalShotsTarget = useCallback(() => {
    switch (drillMode) {
      case 'attempts':
        return shotsToTake
      case 'made':
        return shotsToTake // Target number of makes
      case 'streak':
        return spots.length * streakTarget // Make streakTarget in a row at each spot
      case 'time':
        return Infinity // No shot limit for time mode
      default:
        return shotsToTake
    }
  }, [drillMode, shotsToTake, spots.length, streakTarget])
  
  // Calculate shots per spot based on settings
  const shotsPerSpotTarget = useCallback(() => {
    if (spots.length === 0) return 0
    return ballsPerSpot
  }, [spots.length, ballsPerSpot])
  
  // Get current spot
  const currentSpot = spots[currentSpotIndex] || null
  
  // Start the drill
  const handleStartDrill = () => {
    setIsDrillActive(true)
    setIsPaused(false)
    setElapsedTime(0)
    setMadeShots(0)
    setAttempts(0)
    setCurrentSpotIndex(0)
    setCurrentStreak(0)
    setShotHistory([])
    setDrillComplete(false)
    setShowCompletionModal(false)
    persistedRef.current = false
    // Reset spot stats
    setSpots(prev => prev.map(spot => ({ ...spot, madeShots: 0, missedShots: 0 })))
    onStartDrill()
  }
  
  // Toggle pause
  const togglePause = () => {
    setIsPaused(!isPaused)
  }
  
  // Check if drill is complete based on mode
  const checkDrillCompletion = useCallback((newAttempts: number, newMadeShots: number, newStreak: number, newSpotIndex: number) => {
    switch (drillMode) {
      case 'attempts':
        return newAttempts >= shotsToTake
      case 'made':
        return newMadeShots >= shotsToTake
      case 'streak':
        // Complete when we've hit streak at each spot
        return newSpotIndex >= spots.length
      case 'time':
        return elapsedTime >= timeLimitSeconds
      default:
        return false
    }
  }, [drillMode, shotsToTake, spots.length, elapsedTime, timeLimitSeconds])
  
  // Record a made shot
  const recordMade = useCallback((detectionMethod: ShotHistoryEntry['detectionMethod'] = 'manual') => {
    if (!isDrillActive || isPaused || drillComplete) return
    
    const newMadeShots = madeShots + 1
    const newAttempts = attempts + 1
    const newStreak = currentStreak + 1
    
    setMadeShots(newMadeShots)
    setAttempts(newAttempts)
    setCurrentStreak(newStreak)
    
    // Update spot stats
    if (currentSpot) {
      setSpots(prev => prev.map(spot => 
        spot.id === currentSpot.id 
          ? { ...spot, madeShots: (spot.madeShots || 0) + 1 }
          : spot
      ))
      
      // Add to history
      setShotHistory(prev => [...prev, {
        timestamp: Date.now(),
        spotId: currentSpot.id,
        made: true,
        detectionMethod
      }])
    }
    
    // Handle spot progression based on mode
    let newSpotIndex = currentSpotIndex
    
    if (drillMode === 'streak') {
      // In streak mode, move to next spot after hitting streak target
      if (newStreak >= streakTarget) {
        newSpotIndex = currentSpotIndex + 1
        setCurrentSpotIndex(newSpotIndex)
        setCurrentStreak(0) // Reset streak for new spot
      }
    } else {
      // In other modes, move to next spot after balls per spot reached
      const spotshotsAtCurrentSpot = (currentSpot?.madeShots || 0) + (currentSpot?.missedShots || 0) + 1
      if (spotshotsAtCurrentSpot >= ballsPerSpot) {
        newSpotIndex = (currentSpotIndex + 1) % spots.length
        setCurrentSpotIndex(newSpotIndex)
      }
    }
    
    // Check completion
    if (checkDrillCompletion(newAttempts, newMadeShots, newStreak, newSpotIndex)) {
      setDrillComplete(true)
      setShowCompletionModal(true)
      endDrill()
    }
  }, [isDrillActive, isPaused, drillComplete, madeShots, attempts, currentStreak, currentSpot, currentSpotIndex, drillMode, streakTarget, ballsPerSpot, spots.length, checkDrillCompletion])
  
  // Record a miss
  const recordMiss = useCallback((detectionMethod: ShotHistoryEntry['detectionMethod'] = 'manual') => {
    if (!isDrillActive || isPaused || drillComplete) return
    
    const newAttempts = attempts + 1
    
    setAttempts(newAttempts)
    setCurrentStreak(0) // Reset streak on miss
    
    // Update spot stats
    if (currentSpot) {
      setSpots(prev => prev.map(spot => 
        spot.id === currentSpot.id 
          ? { ...spot, missedShots: (spot.missedShots || 0) + 1 }
          : spot
      ))
      
      // Add to history
      setShotHistory(prev => [...prev, {
        timestamp: Date.now(),
        spotId: currentSpot.id,
        made: false,
        detectionMethod
      }])
    }
    
    // Handle spot progression for non-streak modes
    let newSpotIndex = currentSpotIndex
    if (drillMode !== 'streak') {
      const spotshotsAtCurrentSpot = (currentSpot?.madeShots || 0) + (currentSpot?.missedShots || 0) + 1
      if (spotshotsAtCurrentSpot >= ballsPerSpot) {
        newSpotIndex = (currentSpotIndex + 1) % spots.length
        setCurrentSpotIndex(newSpotIndex)
      }
    }
    
    // Check completion (only for attempts mode on miss)
    if (drillMode === 'attempts' && checkDrillCompletion(newAttempts, madeShots, 0, newSpotIndex)) {
      setDrillComplete(true)
      setShowCompletionModal(true)
      endDrill()
    }
  }, [isDrillActive, isPaused, drillComplete, attempts, currentSpot, currentSpotIndex, drillMode, ballsPerSpot, spots.length, madeShots, checkDrillCompletion])
  
  // Handle automatic shot detection
  const handleAutoShotDetected = useCallback((result: { made: boolean; detectionMethod: string }) => {
    if (result.made) {
      recordMade(result.detectionMethod as ShotHistoryEntry['detectionMethod'])
    } else {
      recordMiss(result.detectionMethod as ShotHistoryEntry['detectionMethod'])
    }
  }, [recordMade, recordMiss])
  
  // Complete the current set and save stats
  const completeCurrentSet = useCallback(() => {
    const misses = attempts - madeShots
    const accuracy = attempts > 0 ? Math.round((madeShots / attempts) * 100) : 0
    
    const newSetStats: SetStats = {
      setNumber: currentSet,
      makes: madeShots,
      misses: misses,
      accuracy: accuracy,
      time: elapsedTime,
      completed: true
    }
    
    setSetStats(prev => {
      const existing = prev.findIndex(s => s.setNumber === currentSet)
      if (existing >= 0) {
        const updated = [...prev]
        updated[existing] = newSetStats
        return updated
      }
      return [...prev, newSetStats]
    })
    
    // Check if there are more sets
    if (currentSet < numberOfSets) {
      // Start rest period
      setIsRestPeriod(true)
      setRestTimeRemaining(restBetweenSets)
    } else {
      // All sets complete
      setDrillComplete(true)
      setShowCompletionModal(true)
      setIsDrillActive(false)
      setIsPaused(false)
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [currentSet, madeShots, attempts, elapsedTime, numberOfSets, restBetweenSets])
  
  // Start next set after rest
  const startNextSet = useCallback(() => {
    setCurrentSet(prev => prev + 1)
    setMadeShots(0)
    setAttempts(0)
    setElapsedTime(0)
    setCurrentSpotIndex(0)
    setCurrentStreak(0)
    setIsRestPeriod(false)
    setRestTimeRemaining(0)
    // Reset spot stats
    setSpots(prev => prev.map(spot => ({
      ...spot,
      madeShots: 0,
      missedShots: 0
    })))
  }, [])
  
  // Rest timer effect
  useEffect(() => {
    if (isRestPeriod && restTimeRemaining > 0) {
      const timer = setInterval(() => {
        setRestTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            startNextSet()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [isRestPeriod, restTimeRemaining, startNextSet])
  
  // Manually update set stats (for manual input)
  const updateSetMakes = useCallback((setNumber: number, makes: number) => {
    setSetStats(prev => {
      const existing = prev.findIndex(s => s.setNumber === setNumber)
      if (existing >= 0) {
        const updated = [...prev]
        const misses = updated[existing].misses
        const total = makes + misses
        updated[existing] = {
          ...updated[existing],
          makes,
          accuracy: total > 0 ? Math.round((makes / total) * 100) : 0
        }
        return updated
      }
      return prev
    })
  }, [])
  
  const updateSetMisses = useCallback((setNumber: number, misses: number) => {
    setSetStats(prev => {
      const existing = prev.findIndex(s => s.setNumber === setNumber)
      if (existing >= 0) {
        const updated = [...prev]
        const makes = updated[existing].makes
        const total = makes + misses
        updated[existing] = {
          ...updated[existing],
          misses,
          accuracy: total > 0 ? Math.round((makes / total) * 100) : 0
        }
        return updated
      }
      return prev
    })
  }, [])
  
  // End the drill
  const endDrill = useCallback(() => {
    // Save current set stats before ending
    if (isDrillActive && !drillComplete) {
      const misses = attempts - madeShots
      const accuracy = attempts > 0 ? Math.round((madeShots / attempts) * 100) : 0
      
      setSetStats(prev => {
        const newStats: SetStats = {
          setNumber: currentSet,
          makes: madeShots,
          misses: misses,
          accuracy: accuracy,
          time: elapsedTime,
          completed: false // Ended early
        }
        const existing = prev.findIndex(s => s.setNumber === currentSet)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = newStats
          return updated
        }
        return [...prev, newStats]
      })
    }
    
    setIsDrillActive(false)
    setIsPaused(false)
    setIsRestPeriod(false)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }, [isDrillActive, drillComplete, currentSet, madeShots, attempts, elapsedTime])
  
  // Check time-based completion
  useEffect(() => {
    if (drillMode === 'time' && isDrillActive && !isPaused) {
      if (elapsedTime >= timeLimitSeconds) {
        setDrillComplete(true)
        setShowCompletionModal(true)
        endDrill()
      }
    }
  }, [drillMode, isDrillActive, isPaused, elapsedTime, timeLimitSeconds, endDrill])
  
  // Calculate progress percentage based on mode
  const progressPercent = useCallback(() => {
    switch (drillMode) {
      case 'attempts':
        return shotsToTake > 0 ? Math.min((attempts / shotsToTake) * 100, 100) : 0
      case 'made':
        return shotsToTake > 0 ? Math.min((madeShots / shotsToTake) * 100, 100) : 0
      case 'streak':
        const totalStreakNeeded = spots.length * streakTarget
        const completedSpots = currentSpotIndex
        const currentProgress = (completedSpots * streakTarget) + currentStreak
        return totalStreakNeeded > 0 ? Math.min((currentProgress / totalStreakNeeded) * 100, 100) : 0
      case 'time':
        return timeLimitSeconds > 0 ? Math.min((elapsedTime / timeLimitSeconds) * 100, 100) : 0
      default:
        return 0
    }
  }, [drillMode, shotsToTake, attempts, madeShots, spots.length, streakTarget, currentSpotIndex, currentStreak, timeLimitSeconds, elapsedTime])
  
  // Calculate shooting percentage
  const shootingPercentage = attempts > 0 ? Math.round((madeShots / attempts) * 100) : 0
  
  // Handle court click - different behavior for each tool
  const handleCourtClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current) return
    
    const rect = courtRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    // Constrain to playable area
    if (x < 5 || x > 95 || y < 5 || y > 95) return
    
    // SHOT tool - place a numbered shooting spot
    if (selectedTool === 'shot' && isPlacingSpot) {
      // Determine position name based on coordinates
      const getPositionName = (x: number, y: number): string => {
        // Find closest predefined position
        let closestPos = COURT_POSITIONS[0]
        let minDist = Infinity
        for (const pos of COURT_POSITIONS) {
          const dist = Math.sqrt(Math.pow(pos.x - x, 2) + Math.pow(pos.y - y, 2))
          if (dist < minDist) {
            minDist = dist
            closestPos = pos
          }
        }
        // If close enough to a predefined position, use its name
        if (minDist < 15) {
          return closestPos.name
        }
        // Otherwise, generate a descriptive name based on location
        const horizontal = x < 33 ? 'Left' : x > 67 ? 'Right' : 'Center'
        const vertical = y < 40 ? 'Near Basket' : y > 70 ? 'Deep' : 'Mid-Range'
        return `${horizontal} ${vertical}`
      }
      
      const newSpot: CourtSpot = {
        id: `spot-${Date.now()}`,
        x,
        y,
        order: spots.length + 1,
        name: getPositionName(x, y),
        madeShots: 0,
        missedShots: 0
      }
      setSpots([...spots, newSpot])
      setIsPlacingSpot(false)
    }
    
    // PASS or DRIBBLE tool - draw a line from point A to point B
    else if ((selectedTool === 'pass' || selectedTool === 'dribble') && isPlacingSpot) {
      if (!isDrawingLine) {
        // Start drawing - first click sets start point
        setLineStartPos({ x, y })
        setIsDrawingLine(true)
      } else {
        // End drawing - second click sets end point
        if (lineStartPos) {
          const newLine: CourtLine = {
            id: `line-${Date.now()}`,
            type: selectedTool as 'pass' | 'dribble',
            startX: lineStartPos.x,
            startY: lineStartPos.y,
            endX: x,
            endY: y
          }
          setLines([...lines, newLine])
        }
        setLineStartPos(null)
        setLinePreviewEnd(null)
        setIsDrawingLine(false)
        setIsPlacingSpot(false)
      }
    }
    
    // CONE tool - place a cone
    else if (selectedTool === 'cone' && isPlacingSpot) {
      const newCone: CourtCone = {
        id: `cone-${Date.now()}`,
        x,
        y
      }
      setCones([...cones, newCone])
      setIsPlacingSpot(false)
    }
    
    // TEXT tool - place a text label
    else if (selectedTool === 'text' && isPlacingSpot) {
      const newTextId = `text-${Date.now()}`
      const newText: CourtText = {
        id: newTextId,
        x,
        y,
        label: ''
      }
      setTextLabels([...textLabels, newText])
      setTextInputId(newTextId)
      setTextInputValue('')
      setIsPlacingSpot(false)
    }
  }, [selectedTool, isPlacingSpot, spots, lines, cones, textLabels, isDrawingLine, lineStartPos])
  
  // Handle mouse move for line preview while drawing
  const handleCourtMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!courtRef.current || !isDrawingLine) return
    
    const rect = courtRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setLinePreviewEnd({ x, y })
  }, [isDrawingLine])
  
  // Delete a spot
  const deleteSpot = useCallback((spotId: string) => {
    const newSpots = spots.filter(s => s.id !== spotId)
    // Reorder remaining spots
    const reorderedSpots = newSpots.map((spot, index) => ({
      ...spot,
      order: index + 1
    }))
    setSpots(reorderedSpots)
    setSelectedSpot(null)
    setSelectedItem(null)
  }, [spots])
  
  // Delete a line
  const deleteLine = useCallback((lineId: string) => {
    setLines(lines.filter(l => l.id !== lineId))
    setSelectedItem(null)
  }, [lines])
  
  // Delete a cone
  const deleteCone = useCallback((coneId: string) => {
    setCones(cones.filter(c => c.id !== coneId))
    setSelectedItem(null)
  }, [cones])
  
  // Delete a text label
  const deleteTextLabel = useCallback((textId: string) => {
    setTextLabels(textLabels.filter(t => t.id !== textId))
    setSelectedItem(null)
  }, [textLabels])

  // Clear all court items
  const clearAllSpots = useCallback(() => {
    setSpots([])
    setLines([])
    setCones([])
    setTextLabels([])
    setSelectedSpot(null)
    setSelectedItem(null)
  }, [])

  // Reset to default spots
  const resetSpots = useCallback(() => {
    setSpots([
      { id: '1', x: 85, y: 55, order: 1, name: 'Right Wing', madeShots: 0, missedShots: 0 },
      { id: '2', x: 50, y: 45, order: 2, name: 'Top of Key', madeShots: 0, missedShots: 0 },
      { id: '3', x: 15, y: 55, order: 3, name: 'Left Wing', madeShots: 0, missedShots: 0 }
    ])
    setLines([])
    setCones([])
    setTextLabels([])
    setSelectedSpot(null)
    setSelectedItem(null)
  }, [])
  
  // Move a spot to new position
  const moveSpot = useCallback((id: string, x: number, y: number) => {
    setSpots(prevSpots => 
      prevSpots.map(spot => 
        spot.id === id ? { ...spot, x, y } : spot
      )
    )
  }, [])

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
      ]
    }
    
    return focusKeyPoints[drill.focusArea] || drill.expectedOutcomes.slice(0, 3)
  }

  return (
    <>
      {/* Full Screen Shot Tracker - Opens when AI Shot Detection is active */}
      {isDrillActive && trackingMode === 'automatic' && !isPaused && (
        <FullScreenShotTracker
          isActive={true}
          onClose={endDrill}
          onPause={togglePause}
          onResume={togglePause}
          isPaused={isPaused}
          madeShots={currentSpotIndex < spots.length ? (spots[currentSpotIndex]?.madeShots || 0) : madeShots}
          missedShots={currentSpotIndex < spots.length ? (spots[currentSpotIndex]?.missedShots || 0) : (attempts - madeShots)}
          currentSpot={currentSpotIndex < spots.length ? {
            name: spots[currentSpotIndex]?.name || `Spot ${currentSpotIndex + 1}`,
            index: currentSpotIndex,
            total: spots.length
          } : undefined}
          spots={spots.map(s => ({
            id: s.id,
            x: s.x,
            y: s.y,
            madeShots: s.madeShots || 0,
            missedShots: s.missedShots || 0
          }))}
          onMade={() => recordMade('coco')}
          onMiss={() => recordMiss('coco')}
          enableSound={true}
        />
      )}
      
      <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
        <button 
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center"
        >
          <ArrowLeft className="w-6 h-6 text-slate-700" />
        </button>
        <h1 className="text-slate-900 font-bold text-lg uppercase tracking-wider truncate max-w-[200px]">{drill.title}</h1>
        <button className="w-10 h-10 flex items-center justify-center">
          <MoreVertical className="w-6 h-6 text-slate-700" />
        </button>
      </header>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('build')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'build'
              ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
              : 'text-slate-500'
          }`}
        >
          Drill
        </button>
        <button
          onClick={() => setActiveTab('instructions')}
          className={`flex-1 py-3 text-sm font-bold uppercase tracking-wider transition-colors ${
            activeTab === 'instructions'
              ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
              : 'text-slate-500'
          }`}
        >
          Instructions
        </button>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'build' ? (
          <BuildDrillTab
            drill={drill}
            spots={spots}
            selectedSpot={selectedSpot}
            setSelectedSpot={setSelectedSpot}
            isPlacingSpot={isPlacingSpot}
            setIsPlacingSpot={setIsPlacingSpot}
            handleCourtClick={handleCourtClick}
            handleCourtMouseMove={handleCourtMouseMove}
            deleteSpot={deleteSpot}
            clearAllSpots={clearAllSpots}
            resetSpots={resetSpots}
            // Tool selection props
            selectedTool={selectedTool}
            setSelectedTool={setSelectedTool}
            setSpots={setSpots}
            // Lines for pass/dribble
            lines={lines}
            setLines={setLines}
            isDrawingLine={isDrawingLine}
            setIsDrawingLine={setIsDrawingLine}
            lineStartPos={lineStartPos}
            setLineStartPos={setLineStartPos}
            linePreviewEnd={linePreviewEnd}
            deleteLine={deleteLine}
            // Cones
            cones={cones}
            setCones={setCones}
            deleteCone={deleteCone}
            // Text labels
            textLabels={textLabels}
            setTextLabels={setTextLabels}
            textInputId={textInputId}
            setTextInputId={setTextInputId}
            textInputValue={textInputValue}
            setTextInputValue={setTextInputValue}
            deleteTextLabel={deleteTextLabel}
            // Selected item
            selectedItem={selectedItem}
            setSelectedItem={setSelectedItem}
            // Drill mode props
            drillMode={drillMode}
            setDrillMode={setDrillMode}
            showModeDropdown={showModeDropdown}
            setShowModeDropdown={setShowModeDropdown}
            ballsPerSpot={ballsPerSpot}
            setBallsPerSpot={setBallsPerSpot}
            shotsToTake={shotsToTake}
            setShotsToTake={setShotsToTake}
            timeLimitSeconds={timeLimitSeconds}
            setTimeLimitSeconds={setTimeLimitSeconds}
            streakTarget={streakTarget}
            setStreakTarget={setStreakTarget}
            // Sets configuration
            numberOfSets={numberOfSets}
            setNumberOfSets={setNumberOfSets}
            currentSet={currentSet}
            restBetweenSets={restBetweenSets}
            setRestBetweenSets={setRestBetweenSets}
            courtRef={courtRef}
            onMoveSpot={moveSpot}
            // Timer props
            isDrillActive={isDrillActive}
            isPaused={isPaused}
            elapsedTime={elapsedTime}
            formatTime={formatTime}
            togglePause={togglePause}
            setIsDrillActive={setIsDrillActive}
            setIsPaused={setIsPaused}
            setElapsedTime={setElapsedTime}
            endDrill={endDrill}
            // Tracking mode props
            trackingMode={trackingMode}
            setTrackingMode={setTrackingMode}
            showTrackingModeSelector={showTrackingModeSelector}
            setShowTrackingModeSelector={setShowTrackingModeSelector}
            // Shot tracking props
            madeShots={madeShots}
            setMadeShots={setMadeShots}
            attempts={attempts}
            setAttempts={setAttempts}
            currentStreak={currentStreak}
            currentSpotIndex={currentSpotIndex}
            progressPercent={progressPercent()}
            shootingPercentage={shootingPercentage}
            recordMade={recordMade}
            recordMiss={recordMiss}
            onAutoShotDetected={handleAutoShotDetected}
            // Set stats props
            setStats={setStats}
            updateSetMakes={updateSetMakes}
            updateSetMisses={updateSetMisses}
            isRestPeriod={isRestPeriod}
            restTimeRemaining={restTimeRemaining}
            completeCurrentSet={completeCurrentSet}
            startNextSet={startNextSet}
          />
        ) : (
          <InstructionsTab 
            drill={drill} 
            keyPoints={getKeyPoints()} 
            timeLimitSeconds={timeLimitSeconds}
            numberOfSets={numberOfSets}
            spots={spots}
            ballsPerSpot={ballsPerSpot}
          />
        )}
      </div>
      
      {/* Drill Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-slate-200">
            {/* Trophy Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF8555] flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
            </div>
            
            {/* Title */}
            <h2 className="text-slate-900 text-2xl font-black text-center mb-2 uppercase tracking-wider">
              Drill Complete!
            </h2>
            <p className="text-slate-500 text-center mb-6">
              Great work! Here's your performance summary.
            </p>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-[#FF6B35] text-3xl font-black">{madeShots}</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Makes</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-slate-900 text-3xl font-black">{attempts}</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Attempts</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-green-400 text-3xl font-black">{shootingPercentage}%</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Accuracy</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-blue-400 text-3xl font-black">{formatTime(elapsedTime)}</p>
                <p className="text-slate-500 text-xs uppercase tracking-wider">Time</p>
              </div>
            </div>
            
            {/* Mode Badge */}
            <div className="flex justify-center mb-6">
              <div className="px-4 py-2 rounded-full bg-[#FF6B35]/20 border border-[#FF6B35]/50">
                <span className="text-[#FF6B35] text-sm font-bold uppercase tracking-wider">
                  {drillMode === 'attempts' && `${attempts}/${shotsToTake} Attempts`}
                  {drillMode === 'made' && `${madeShots}/${shotsToTake} Makes`}
                  {drillMode === 'time' && `${formatTime(timeLimitSeconds)} Complete`}
                  {drillMode === 'streak' && `${streakTarget}-Streak at ${spots.length} Spots`}
                </span>
              </div>
            </div>
            
            {/* Buttons */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  handleStartDrill()
                }}
                className="w-full py-4 bg-[#FF6B35] text-white font-bold text-lg uppercase tracking-wider rounded-lg hover:bg-[#FF8555] transition-colors"
              >
                Do It Again
              </button>
              <button
                onClick={() => {
                  setShowCompletionModal(false)
                  onClose()
                }}
                className="w-full py-4 bg-slate-50 text-slate-700 font-bold text-lg uppercase tracking-wider rounded-lg hover:bg-slate-100 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Start/End Button */}
      <div className="p-4 border-t border-slate-200">
        {isDrillActive ? (
          <button
            onClick={endDrill}
            className="w-full py-4 bg-slate-50 text-slate-700 font-bold text-lg uppercase tracking-wider rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center gap-3"
          >
            <X className="w-6 h-6" />
            End Drill
          </button>
        ) : (
          <button
            onClick={handleStartDrill}
            className="w-full py-4 bg-[#FF6B35] text-white font-bold text-lg uppercase tracking-wider rounded-lg hover:bg-[#FF8555] transition-colors flex items-center justify-center gap-3"
          >
            <Play className="w-6 h-6" />
            Start Drill
          </button>
        )}
      </div>
    </div>
    </>
  )
}

// ============================================
// TIME LIMIT INPUT COMPONENT
// ============================================

interface TimeLimitInputProps {
  timeLimitSeconds: number
  setTimeLimitSeconds: React.Dispatch<React.SetStateAction<number>>
  formatTime: (seconds: number) => string
}

function TimeLimitInput({ timeLimitSeconds, setTimeLimitSeconds, formatTime }: TimeLimitInputProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editMinutes, setEditMinutes] = useState(Math.floor(timeLimitSeconds / 60).toString())
  const [editSeconds, setEditSeconds] = useState((timeLimitSeconds % 60).toString().padStart(2, '0'))
  const minutesRef = useRef<HTMLInputElement>(null)
  
  // Update edit values when timeLimitSeconds changes externally
  useEffect(() => {
    if (!isEditing) {
      setEditMinutes(Math.floor(timeLimitSeconds / 60).toString())
      setEditSeconds((timeLimitSeconds % 60).toString().padStart(2, '0'))
    }
  }, [timeLimitSeconds, isEditing])
  
  const startEditing = () => {
    setEditMinutes(Math.floor(timeLimitSeconds / 60).toString())
    setEditSeconds((timeLimitSeconds % 60).toString().padStart(2, '0'))
    setIsEditing(true)
    setTimeout(() => minutesRef.current?.focus(), 50)
  }
  
  const saveTime = () => {
    const mins = parseInt(editMinutes) || 0
    const secs = parseInt(editSeconds) || 0
    const totalSeconds = Math.max(1, Math.min(3600, mins * 60 + secs))
    setTimeLimitSeconds(totalSeconds)
    setIsEditing(false)
  }
  
  const cancelEditing = () => {
    setIsEditing(false)
    setEditMinutes(Math.floor(timeLimitSeconds / 60).toString())
    setEditSeconds((timeLimitSeconds % 60).toString().padStart(2, '0'))
  }
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveTime()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }
  
  return (
    <div className="bg-slate-50 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="w-5 h-5 text-blue-500" />
        <span className="text-slate-900 font-bold text-sm uppercase tracking-wider">Drill Time Limit</span>
        {isEditing && (
          <span className="ml-auto text-blue-400 text-xs">Press Enter to save</span>
        )}
      </div>
      
      {isEditing ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <div className="flex items-center gap-1 bg-white rounded-lg p-2">
            <input
              ref={minutesRef}
              type="number"
              min="0"
              max="60"
              value={editMinutes}
              onChange={(e) => setEditMinutes(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-16 bg-transparent text-slate-900 text-4xl font-black text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="0"
            />
            <span className="text-slate-500 text-sm">min</span>
          </div>
          <span className="text-slate-900 text-4xl font-black">:</span>
          <div className="flex items-center gap-1 bg-white rounded-lg p-2">
            <input
              type="number"
              min="0"
              max="59"
              value={editSeconds}
              onChange={(e) => {
                const val = e.target.value
                if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 59)) {
                  setEditSeconds(val)
                }
              }}
              onKeyDown={handleKeyDown}
              className="w-16 bg-transparent text-slate-900 text-4xl font-black text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              placeholder="00"
            />
            <span className="text-slate-500 text-sm">sec</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          {/* Minus button - decrements by 1 second */}
          <button
            onClick={() => setTimeLimitSeconds(Math.max(1, timeLimitSeconds - 1))}
            onMouseDown={(e) => {
              // Hold to decrement faster
              const interval = setInterval(() => {
                setTimeLimitSeconds((prev: number) => Math.max(1, prev - 1))
              }, 100)
              const stopInterval = () => {
                clearInterval(interval)
                document.removeEventListener('mouseup', stopInterval)
              }
              document.addEventListener('mouseup', stopInterval)
            }}
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:bg-slate-200"
          >
            <Minus className="w-5 h-5 text-slate-700" />
          </button>
          
          {/* Clickable time display */}
          <button
            onClick={startEditing}
            className="text-center flex-1 py-2 hover:bg-slate-100 rounded-lg transition-colors cursor-text group"
          >
            <div className="text-slate-900 font-black text-4xl group-hover:text-blue-400 transition-colors">
              {formatTime(timeLimitSeconds)}
            </div>
            <div className="text-slate-500 text-sm uppercase tracking-wider group-hover:text-blue-400/70">
              Tap to edit
            </div>
          </button>
          
          {/* Plus button - increments by 1 second */}
          <button
            onClick={() => setTimeLimitSeconds(Math.min(3600, timeLimitSeconds + 1))}
            onMouseDown={(e) => {
              // Hold to increment faster
              const interval = setInterval(() => {
                setTimeLimitSeconds((prev: number) => Math.min(3600, prev + 1))
              }, 100)
              const stopInterval = () => {
                clearInterval(interval)
                document.removeEventListener('mouseup', stopInterval)
              }
              document.addEventListener('mouseup', stopInterval)
            }}
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors active:bg-slate-200"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      )}
      
      {/* Save/Cancel buttons when editing */}
      {isEditing && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveTime}
            className="flex-1 py-2 bg-blue-500 text-white font-bold text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
          <button
            onClick={cancelEditing}
            className="px-4 py-2 bg-slate-100 text-slate-500 font-bold text-sm rounded-lg hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================
// BUILD DRILL TAB
// ============================================

interface BuildDrillTabProps {
  drill: Drill  // Drill information for title
  spots: CourtSpot[]
  selectedSpot: string | null
  setSelectedSpot: (id: string | null) => void
  isPlacingSpot: boolean
  setIsPlacingSpot: (v: boolean) => void
  handleCourtClick: (e: React.MouseEvent<HTMLDivElement>) => void
  handleCourtMouseMove: (e: React.MouseEvent<HTMLDivElement>) => void
  deleteSpot: (id: string) => void
  clearAllSpots: () => void
  resetSpots: () => void
  // Tool selection
  selectedTool: CourtToolType
  setSelectedTool: (t: CourtToolType) => void
  setSpots: React.Dispatch<React.SetStateAction<CourtSpot[]>>
  // Lines for pass/dribble
  lines: CourtLine[]
  setLines: React.Dispatch<React.SetStateAction<CourtLine[]>>
  isDrawingLine: boolean
  setIsDrawingLine: (v: boolean) => void
  lineStartPos: {x: number, y: number} | null
  setLineStartPos: (v: {x: number, y: number} | null) => void
  linePreviewEnd: {x: number, y: number} | null
  deleteLine: (id: string) => void
  // Cones
  cones: CourtCone[]
  setCones: React.Dispatch<React.SetStateAction<CourtCone[]>>
  deleteCone: (id: string) => void
  // Text labels
  textLabels: CourtText[]
  setTextLabels: React.Dispatch<React.SetStateAction<CourtText[]>>
  textInputId: string | null
  setTextInputId: (id: string | null) => void
  textInputValue: string
  setTextInputValue: (v: string) => void
  deleteTextLabel: (id: string) => void
  // Selected item (any type)
  selectedItem: {type: string, id: string} | null
  setSelectedItem: (v: {type: string, id: string} | null) => void
  // Drill mode
  drillMode: DrillMode
  setDrillMode: (v: DrillMode) => void
  showModeDropdown: boolean
  setShowModeDropdown: (v: boolean) => void
  ballsPerSpot: number
  setBallsPerSpot: (v: number) => void
  shotsToTake: number
  setShotsToTake: (v: number) => void
  timeLimitSeconds: number
  setTimeLimitSeconds: React.Dispatch<React.SetStateAction<number>>
  streakTarget: number
  setStreakTarget: (v: number) => void
  // Sets configuration
  numberOfSets: number
  setNumberOfSets: (v: number) => void
  currentSet: number
  restBetweenSets: number
  setRestBetweenSets: (v: number) => void
  courtRef: React.RefObject<HTMLDivElement>
  onMoveSpot: (id: string, x: number, y: number) => void
  // Timer props
  isDrillActive: boolean
  isPaused: boolean
  elapsedTime: number
  formatTime: (seconds: number) => string
  togglePause: () => void
  setIsDrillActive: (v: boolean) => void
  setIsPaused: (v: boolean) => void
  setElapsedTime: (v: number) => void
  endDrill: () => void
  // Tracking mode props
  trackingMode: TrackingMode
  setTrackingMode: (v: TrackingMode) => void
  showTrackingModeSelector: boolean
  setShowTrackingModeSelector: (v: boolean) => void
  // Shot tracking props
  madeShots: number
  setMadeShots: (v: number) => void
  attempts: number
  setAttempts: (v: number) => void
  currentStreak: number
  currentSpotIndex: number
  progressPercent: number
  shootingPercentage: number
  recordMade: (method?: ShotHistoryEntry['detectionMethod']) => void
  recordMiss: (method?: ShotHistoryEntry['detectionMethod']) => void
  onAutoShotDetected: (result: { made: boolean; detectionMethod: string }) => void
  // Set stats props
  setStats: { setNumber: number; makes: number; misses: number; accuracy: number; time: number; completed: boolean }[]
  updateSetMakes: (setNumber: number, makes: number) => void
  updateSetMisses: (setNumber: number, misses: number) => void
  isRestPeriod: boolean
  restTimeRemaining: number
  completeCurrentSet: () => void
  startNextSet: () => void
}

function BuildDrillTab({
  drill,
  spots,
  selectedSpot,
  setSelectedSpot,
  isPlacingSpot,
  setIsPlacingSpot,
  handleCourtClick,
  handleCourtMouseMove,
  deleteSpot,
  clearAllSpots,
  resetSpots,
  // Tool selection props
  selectedTool,
  setSelectedTool,
  setSpots,
  // Lines for pass/dribble
  lines,
  setLines,
  isDrawingLine,
  setIsDrawingLine,
  lineStartPos,
  setLineStartPos,
  linePreviewEnd,
  deleteLine,
  // Cones
  cones,
  setCones,
  deleteCone,
  // Text labels
  textLabels,
  setTextLabels,
  textInputId,
  setTextInputId,
  textInputValue,
  setTextInputValue,
  deleteTextLabel,
  // Selected item
  selectedItem,
  setSelectedItem,
  // Drill mode props
  drillMode,
  setDrillMode,
  showModeDropdown,
  setShowModeDropdown,
  ballsPerSpot,
  setBallsPerSpot,
  shotsToTake,
  setShotsToTake,
  timeLimitSeconds,
  setTimeLimitSeconds,
  streakTarget,
  setStreakTarget,
  // Sets configuration
  numberOfSets,
  setNumberOfSets,
  currentSet,
  restBetweenSets,
  setRestBetweenSets,
  courtRef,
  onMoveSpot,
  // Timer props
  isDrillActive,
  isPaused,
  elapsedTime,
  formatTime,
  togglePause,
  setIsDrillActive,
  setIsPaused,
  setElapsedTime,
  endDrill,
  // Tracking mode props
  trackingMode,
  setTrackingMode,
  showTrackingModeSelector,
  setShowTrackingModeSelector,
  // Shot tracking props
  madeShots,
  setMadeShots,
  attempts,
  setAttempts,
  currentStreak,
  currentSpotIndex,
  progressPercent,
  shootingPercentage,
  recordMade,
  recordMiss,
  onAutoShotDetected,
  // Set stats props
  setStats,
  updateSetMakes,
  updateSetMisses,
  isRestPeriod,
  restTimeRemaining,
  completeCurrentSet,
  startNextSet
}: BuildDrillTabProps) {
  // Drag state - for spots
  const [draggingSpot, setDraggingSpot] = useState<string | null>(null)
  // Drag state - for cones
  const [draggingCone, setDraggingCone] = useState<string | null>(null)
  // Drag state - for text labels
  const [draggingText, setDraggingText] = useState<string | null>(null)
  
  // Handle drag start for spots
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent, spotId: string) => {
    e.stopPropagation()
    setDraggingSpot(spotId)
    setSelectedSpot(spotId)
  }
  
  // Handle drag start for cones
  const handleConeDragStart = (e: React.MouseEvent | React.TouchEvent, coneId: string) => {
    e.stopPropagation()
    setDraggingCone(coneId)
    setSelectedItem({ type: 'cone', id: coneId })
  }
  
  // Handle drag start for text labels
  const handleTextDragStart = (e: React.MouseEvent | React.TouchEvent, textId: string) => {
    e.stopPropagation()
    setDraggingText(textId)
    setSelectedItem({ type: 'text', id: textId })
  }
  
  // Handle drag move
  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!courtRef.current) return
    if (!draggingSpot && !draggingCone && !draggingText) return
    
    e.preventDefault()
    const rect = courtRef.current.getBoundingClientRect()
    
    let clientX: number, clientY: number
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }
    
    // Constrain to playable court area
    const x = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100))
    const y = Math.max(5, Math.min(95, ((clientY - rect.top) / rect.height) * 100))
    
    if (draggingSpot) {
      onMoveSpot(draggingSpot, x, y)
    } else if (draggingCone) {
      // Move cone
      setCones(prev => prev.map(c => c.id === draggingCone ? { ...c, x, y } : c))
    } else if (draggingText) {
      // Move text label
      setTextLabels(prev => prev.map(t => t.id === draggingText ? { ...t, x, y } : t))
    }
  }
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggingSpot(null)
    setDraggingCone(null)
    setDraggingText(null)
  }
  
  // Handle line click for selection
  const handleLineClick = (e: React.MouseEvent, lineId: string) => {
    e.stopPropagation()
    const isSelected = selectedItem?.type === 'line' && selectedItem?.id === lineId
    setSelectedItem(isSelected ? null : { type: 'line', id: lineId })
  }
  
  return (
    <div className="p-4 space-y-4">
      {/* Drill Status Badge (when active) */}
      {isDrillActive && (
        <div className="flex justify-center">
          <div className="px-4 py-2 rounded-full bg-green-500/20 border border-green-500/50 inline-flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-sm font-bold uppercase">Drill Active</span>
          </div>
        </div>
      )}
      
      {/* Tracking Mode Selector */}
      <div className="relative">
        <button
          onClick={() => setShowTrackingModeSelector(!showTrackingModeSelector)}
          className="w-full bg-gradient-to-r from-[#2a2a2a] to-[#1a1a1a] rounded-xl p-4 border border-slate-200 hover:border-[#FF6B35]/50 transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {trackingMode === 'manual' ? (
                <div className="w-12 h-12 rounded-xl bg-[#FF6B35]/20 flex items-center justify-center">
                  <Hand className="w-6 h-6 text-[#FF6B35]" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35]/20 to-[#FF8555]/20 flex items-center justify-center">
                  <Camera className="w-6 h-6 text-[#FF6B35]" />
                </div>
              )}
              <div>
                <h3 className="text-slate-900 font-black text-lg uppercase tracking-wide">
                  {trackingMode === 'manual' ? 'Manual Tracking' : 'AI Shot Detection'}
                </h3>
                <p className="text-slate-500 text-sm">
                  {trackingMode === 'manual' 
                    ? 'Tap to record makes & misses' 
                    : 'Camera auto-detects your shots'}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${showTrackingModeSelector ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {/* Tracking Mode Dropdown */}
        {showTrackingModeSelector && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden z-50 shadow-xl">
            <button
              onClick={() => { setTrackingMode('manual'); setShowTrackingModeSelector(false); }}
              className={`w-full p-4 text-left flex items-center gap-4 hover:bg-slate-100 transition-colors ${trackingMode === 'manual' ? 'bg-slate-100 border-l-4 border-[#FF6B35]' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
                <Hand className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div>
                <p className="text-slate-900 font-bold">Manual Tracking</p>
                <p className="text-slate-500 text-xs">Tap buttons to record shots</p>
              </div>
            </button>
            
            <button
              onClick={() => { setTrackingMode('automatic'); setShowTrackingModeSelector(false); }}
              className={`w-full p-4 text-left flex items-center gap-4 hover:bg-slate-100 transition-colors border-t border-slate-200 ${trackingMode === 'automatic' ? 'bg-slate-100 border-l-4 border-[#FF6B35]' : ''}`}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FF6B35]/20 to-[#FF8555]/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#FF6B35]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-slate-900 font-bold">AI Shot Detection</p>
                  <span className="px-2 py-0.5 bg-gradient-to-r from-[#FF6B35] to-[#FF8555] text-white text-[10px] font-bold rounded-full uppercase">Beta</span>
                </div>
                <p className="text-slate-500 text-xs">Hybrid detection: YOLO + Color + Motion</p>
              </div>
              <Zap className="w-5 h-5 text-[#FF6B35]" />
            </button>
          </div>
        )}
      </div>
      
      {/* Timer & Stats Display */}
      <div className="bg-slate-50 rounded-xl p-6">
        {/* Timer Row */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center flex-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">
              {isDrillActive ? (drillMode === 'time' ? 'Remaining' : 'Elapsed') : 'Set Time'}
            </p>
            <p className={`text-4xl font-black tracking-tight ${
              isDrillActive 
                ? drillMode === 'time' 
                  ? timeLimitSeconds - elapsedTime <= 30 
                    ? 'text-red-400 animate-pulse' 
                    : 'text-slate-700'
                  : 'text-slate-700'
                : 'text-blue-400'
            }`}>
              {isDrillActive 
                ? drillMode === 'time'
                  ? formatTime(Math.max(0, timeLimitSeconds - elapsedTime))  // Countdown for time mode
                  : formatTime(elapsedTime)  // Count up for other modes
                : formatTime(timeLimitSeconds)  // Show configured time when not started
              }
            </p>
          </div>
          <div className="w-px h-16 bg-slate-100" />
          <div className="text-center flex-1">
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Accuracy</p>
            <p className="text-green-400 text-4xl font-black tracking-tight">{shootingPercentage}%</p>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-500 uppercase tracking-wider">Progress</span>
            <span className="text-slate-900 font-bold">{Math.round(progressPercent)}%</span>
          </div>
          <div className="h-3 bg-slate-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8555] rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
        
        {/* Misses / Made / Accuracy Row - Editable for Manual Tracking */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          {/* MISSED - First */}
          <div className="bg-white rounded-xl p-3 text-center border border-red-500/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <XCircle className="w-4 h-4 text-red-400" />
              <span className="text-slate-500 text-xs uppercase">Missed</span>
            </div>
            {trackingMode === 'manual' && !isDrillActive ? (
              <input
                type="number"
                min="0"
                value={attempts - madeShots}
                onChange={(e) => {
                  const misses = Math.max(0, parseInt(e.target.value) || 0)
                  setAttempts(madeShots + misses)
                }}
                className="w-full text-red-400 text-2xl font-black text-center bg-transparent border-b-2 border-red-500/30 focus:border-red-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            ) : (
              <p className="text-red-400 text-2xl font-black">{attempts - madeShots}</p>
            )}
          </div>
          {/* MADE - Second */}
          <div className="bg-white rounded-xl p-3 text-center border border-green-500/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span className="text-slate-500 text-xs uppercase">Made</span>
            </div>
            {trackingMode === 'manual' && !isDrillActive ? (
              <input
                type="number"
                min="0"
                value={madeShots}
                onChange={(e) => {
                  const val = Math.max(0, parseInt(e.target.value) || 0)
                  setMadeShots(val)
                  if (val > attempts) setAttempts(val)
                }}
                className="w-full text-green-400 text-2xl font-black text-center bg-transparent border-b-2 border-green-500/30 focus:border-green-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            ) : (
              <p className="text-green-400 text-2xl font-black">{madeShots}</p>
            )}
          </div>
          {/* ACCURACY - Third */}
          <div className="bg-white rounded-xl p-3 text-center border border-[#FF6B35]/30">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Target className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-slate-500 text-xs uppercase">Accuracy</span>
            </div>
            <p className={`text-2xl font-black ${
              shootingPercentage >= 70 ? 'text-green-400' : 
              shootingPercentage >= 50 ? 'text-yellow-400' : 'text-[#FF6B35]'
            }`}>{shootingPercentage}%</p>
          </div>
        </div>
        
        {/* Streak indicator (smaller, below main stats) */}
        {currentStreak > 0 && (
          <div className="flex items-center justify-center gap-2 mb-4 py-2 bg-[#FF6B35]/10 rounded-lg border border-[#FF6B35]/30">
            <Flame className="w-4 h-4 text-[#FF6B35]" />
            <span className="text-[#FF6B35] font-bold">{currentStreak} in a row!</span>
          </div>
        )}
        
        {/* Manual tracking hint */}
        {trackingMode === 'manual' && !isDrillActive && (
          <p className="text-center text-slate-400 text-xs mb-4">
            Tap makes/misses to manually enter your scores
          </p>
        )}
        
        {/* Rest Period Overlay */}
        {isRestPeriod && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-4">
            <div className="text-center">
              <p className="text-blue-400 text-sm uppercase tracking-wider mb-1">Rest Period</p>
              <p className="text-slate-900 text-4xl font-black">{formatTime(restTimeRemaining)}</p>
              <p className="text-slate-500 text-sm mt-2">Set {currentSet} complete! Next set starting soon...</p>
              <button
                onClick={startNextSet}
                className="mt-3 px-6 py-2 bg-blue-500 text-white font-bold text-sm uppercase rounded-lg hover:bg-blue-600 transition-colors"
              >
                Skip Rest
              </button>
            </div>
          </div>
        )}
        
        {/* Per-Set Stats Display */}
        {numberOfSets > 1 && (
          <div className="bg-white rounded-xl p-4 mb-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3">
              <RotateCcw className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-slate-900 font-bold text-sm uppercase tracking-wider">Set Stats</span>
              <span className="ml-auto text-slate-500 text-xs">
                Set {currentSet} of {numberOfSets}
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {Array.from({ length: numberOfSets }, (_, i) => i + 1).map((setNum) => {
                const stats = setStats.find(s => s.setNumber === setNum)
                const isCurrentSet = setNum === currentSet && !isRestPeriod
                const isCompleted = stats?.completed
                const isFuture = setNum > currentSet
                
                return (
                  <div 
                    key={setNum}
                    className={`rounded-lg p-3 transition-colors ${
                      isCurrentSet 
                        ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/50' 
                        : isCompleted
                          ? 'bg-green-500/5 border border-green-500/20'
                          : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${
                          isCurrentSet ? 'text-[#FF6B35]' : isCompleted ? 'text-green-400' : 'text-slate-500'
                        }`}>
                          Set {setNum}
                        </span>
                        {isCurrentSet && isDrillActive && (
                          <span className="px-2 py-0.5 bg-[#FF6B35] text-white text-[10px] font-bold rounded uppercase animate-pulse">
                            Active
                          </span>
                        )}
                        {isCompleted && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                      </div>
                      
                      {/* Stats for this set */}
                      {(stats || isCurrentSet) && !isFuture ? (
                        <div className="flex items-center gap-4 text-sm">
                          {/* Makes */}
                          <div className="flex items-center gap-1">
                            <span className="text-green-400 font-bold">
                              {isCurrentSet && !isCompleted ? madeShots : stats?.makes || 0}
                            </span>
                            <span className="text-slate-500">M</span>
                          </div>
                          {/* Misses */}
                          <div className="flex items-center gap-1">
                            <span className="text-red-400 font-bold">
                              {isCurrentSet && !isCompleted ? (attempts - madeShots) : stats?.misses || 0}
                            </span>
                            <span className="text-slate-500">X</span>
                          </div>
                          {/* Accuracy */}
                          <div className={`px-2 py-0.5 rounded text-xs font-bold ${
                            (isCurrentSet && !isCompleted ? shootingPercentage : stats?.accuracy || 0) >= 70
                              ? 'bg-green-500/20 text-green-400'
                              : (isCurrentSet && !isCompleted ? shootingPercentage : stats?.accuracy || 0) >= 50
                                ? 'bg-yellow-500/20 text-yellow-400'
                                : 'bg-red-500/20 text-red-400'
                          }`}>
                            {isCurrentSet && !isCompleted ? shootingPercentage : stats?.accuracy || 0}%
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-sm">—</span>
                      )}
                    </div>
                    
                    {/* Editable inputs for completed sets (manual tracking) */}
                    {trackingMode === 'manual' && isCompleted && !isDrillActive && (
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-200">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={stats?.makes || 0}
                            onChange={(e) => updateSetMakes(setNum, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-green-400 text-sm font-bold text-center focus:outline-none focus:border-green-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-500 text-xs">makes</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            value={stats?.misses || 0}
                            onChange={(e) => updateSetMisses(setNum, Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-12 px-1 py-0.5 bg-white border border-slate-200 rounded text-red-400 text-sm font-bold text-center focus:outline-none focus:border-red-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <span className="text-slate-500 text-xs">misses</span>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            
            {/* Complete Set Button */}
            {isDrillActive && !isRestPeriod && numberOfSets > 1 && (
              <button
                onClick={completeCurrentSet}
                className="w-full mt-3 py-2 bg-slate-50 hover:bg-slate-100 text-[#FF6B35] font-bold text-sm uppercase tracking-wider rounded-lg transition-colors border border-[#FF6B35]/30"
              >
                Complete Set {currentSet}
              </button>
            )}
          </div>
        )}
        
        {/* Current Spot Indicator */}
        {spots.length > 0 && (
          <div className="bg-white rounded-lg p-3 flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CircleDot className="w-5 h-5 text-[#FF6B35]" />
              <span className="text-slate-500 text-sm">Current Spot:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-900 font-bold text-lg">{currentSpotIndex + 1}</span>
              <span className="text-slate-500">of</span>
              <span className="text-slate-500">{spots.length}</span>
            </div>
          </div>
        )}
        
        {/* Shot Tracking Controls (only shown when drill is active) */}
        {isDrillActive && (
          <div className="space-y-3">
            {/* Pause/Stop Controls */}
            <div className="flex gap-3">
              <button
                onClick={togglePause}
                className="flex-1 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200"
              >
                {isPaused ? (
                  <>
                    <Play className="w-5 h-5" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-5 h-5" />
                    Pause
                  </>
                )}
              </button>
              <button
                onClick={endDrill}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                End
              </button>
            </div>
            
            {/* Manual Shot Tracking Buttons */}
            {trackingMode === 'manual' && !isPaused && (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => recordMade('manual')}
                  className="py-6 bg-gradient-to-br from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-black text-xl uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-green-500/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <CheckCircle className="w-8 h-8" />
                  MADE
                </button>
                <button
                  onClick={() => recordMiss('manual')}
                  className="py-6 bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-black text-xl uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-red-500/20 active:scale-95 flex items-center justify-center gap-3"
                >
                  <XCircle className="w-8 h-8" />
                  MISS
                </button>
              </div>
            )}
            
            {/* Automatic Shot Detection Camera */}
            {trackingMode === 'automatic' && !isPaused && (
              <div className="rounded-xl overflow-hidden border border-slate-200">
                <HybridShotDetector
                  isActive={isDrillActive && !isPaused}
                  onShotDetected={onAutoShotDetected}
                  showPreview={true}
                  enableSound={true}
                />
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Drill Setup Stats - X Spots, X Per Spot, Total */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-[#FF6B35] text-3xl font-black">{spots.length}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Spots</p>
          </div>
          <div className="text-center border-l border-r border-slate-200">
            <p className="text-slate-900 text-3xl font-black">{ballsPerSpot}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Per Spot</p>
          </div>
          <div className="text-center">
            <p className="text-slate-900 text-3xl font-black">{spots.length * ballsPerSpot}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Total</p>
          </div>
        </div>
      </div>
      
      {/* Basketball Court - NBA Half Court Accurate Dimensions */}
      {/* NBA: 50ft wide x 47ft long, basket at TOP (like the screenshot) */}
      <div 
        ref={courtRef}
        onClick={handleCourtClick}
        onMouseMove={(e) => {
          handleCourtMouseMove(e)
          handleDragMove(e)
        }}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        className={`relative bg-white rounded-lg overflow-hidden touch-none ${
          isPlacingSpot ? 'cursor-crosshair' : draggingSpot ? 'cursor-grabbing' : 'cursor-default'
        }`}
        style={{ aspectRatio: '50/47' }}
      >
        {/* Court Lines - NBA Official Dimensions (Basket at TOP) */}
        {/* ViewBox: 500 wide (50ft) x 470 tall (47ft), 10px = 1 foot */}
        {/* Basket is at y=42.5 (4.25ft from baseline at y=0) */}
        <svg 
          viewBox="0 0 500 470" 
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Baseline (top - where basket is) */}
          <line x1="0" y1="0" x2="500" y2="0" stroke="white" strokeWidth="2" />
          
          {/* Sidelines */}
          <line x1="0" y1="0" x2="0" y2="470" stroke="white" strokeWidth="2" />
          <line x1="500" y1="0" x2="500" y2="470" stroke="white" strokeWidth="2" />
          
          {/* Half court line (bottom) - optional, can be hidden */}
          <line x1="0" y1="470" x2="500" y2="470" stroke="white" strokeWidth="2" opacity="0.3" />
          
          {/* Key/Paint Area - 16ft wide (160px), 19ft deep (190px) from baseline */}
          {/* Centered: (500-160)/2 = 170 to 330 */}
          <rect x="170" y="0" width="160" height="190" fill="none" stroke="white" strokeWidth="2" />
          
          {/* Free Throw Line - 15ft from backboard = 19ft from baseline (y=190) */}
          {/* Free Throw Circle - 6ft radius (60px), centered at free throw line */}
          <circle cx="250" cy="190" r="60" fill="none" stroke="white" strokeWidth="2" />
          
          {/* Bottom half of free throw circle (dashed - facing half court) */}
          <path 
            d="M 190 190 A 60 60 0 0 0 310 190" 
            fill="none" 
            stroke="white" 
            strokeWidth="2" 
            strokeDasharray="8 5"
          />
          
          {/* Restricted Area - 4ft radius (40px) semicircle from basket center */}
          {/* Basket at y=42.5 (4.25ft from baseline) */}
          <path 
            d="M 210 0 A 40 40 0 0 0 290 0" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
          />
          
          {/* Three-Point Line - NBA: 23.75ft (237.5px) from basket, 22ft (220px) at corners */}
          
          {/* Left corner three - straight line */}
          <line x1="30" y1="0" x2="30" y2="143" stroke="white" strokeWidth="2" />
          
          {/* Right corner three - straight line */}
          <line x1="470" y1="0" x2="470" y2="143" stroke="white" strokeWidth="2" />
          
          {/* Three-point arc - 237.5px radius from basket center at (250, 42.5) */}
          {/* Arc connects the two corner lines */}
          <path 
            d="M 30 143 
               A 237.5 237.5 0 0 0 470 143" 
            fill="none" 
            stroke="white" 
            strokeWidth="2"
          />
          
          {/* Backboard - 6ft wide (60px), at top */}
          <line x1="220" y1="40" x2="280" y2="40" stroke="white" strokeWidth="3" />
          
          {/* Basket/Rim - 18 inches diameter (15px), center at 4.25ft from baseline */}
          <circle cx="250" cy="52" r="9" fill="none" stroke="white" strokeWidth="2" />
          
          {/* Rim connector to backboard */}
          <line x1="250" y1="43" x2="250" y2="40" stroke="white" strokeWidth="2" />
        </svg>
        
        {/* SHOT IQ Logo near basket (top) */}
        <div className="absolute top-[5%] left-1/2 -translate-x-1/2">
          <div className="w-12 h-12 bg-slate-50 rounded-lg flex items-center justify-center border border-slate-200 rotate-45">
            <span className="text-[7px] text-slate-400 font-bold text-center leading-tight -rotate-45">
              SHOT<br/>IQ
            </span>
          </div>
        </div>
        
        {/* SVG Overlay for Lines and Shot Arcs */}
        <svg 
          className="absolute inset-0 w-full h-full" 
          viewBox="0 0 100 100" 
          preserveAspectRatio="none"
        >
          {/* Shot Lines to Basket (gray dashed) - non-interactive */}
          {spots.map((spot) => (
            <line
              key={`shot-line-${spot.id}`}
              x1={spot.x}
              y1={spot.y}
              x2={50}
              y2={11}
              stroke="#94a3b8"
              strokeWidth="0.3"
              strokeDasharray="1 1"
              opacity="0.5"
              pointerEvents="none"
            />
          ))}
          
          {/* Pass Lines (gray dotted with arrow) - CLICKABLE */}
          {lines.filter(l => l.type === 'pass').map((line) => {
            const angle = Math.atan2(line.endY - line.startY, line.endX - line.startX)
            const arrowLen = 2
            const arrowAngle = 0.5
            const isSelected = selectedItem?.type === 'line' && selectedItem?.id === line.id
            return (
              <g key={line.id} style={{ cursor: 'pointer' }}>
                {/* Invisible hit area for easier clicking */}
                <line
                  x1={line.startX}
                  y1={line.startY}
                  x2={line.endX}
                  y2={line.endY}
                  stroke="transparent"
                  strokeWidth="4"
                  onClick={(e) => handleLineClick(e, line.id)}
                />
                {/* Visible line */}
                <line
                  x1={line.startX}
                  y1={line.startY}
                  x2={line.endX}
                  y2={line.endY}
                  stroke={isSelected ? '#3B82F6' : '#6B7280'}
                  strokeWidth={isSelected ? '0.8' : '0.5'}
                  strokeDasharray="2 1"
                  pointerEvents="none"
                />
                {/* Arrow head */}
                <polygon
                  points={`
                    ${line.endX},${line.endY}
                    ${line.endX - arrowLen * Math.cos(angle - arrowAngle)},${line.endY - arrowLen * Math.sin(angle - arrowAngle)}
                    ${line.endX - arrowLen * Math.cos(angle + arrowAngle)},${line.endY - arrowLen * Math.sin(angle + arrowAngle)}
                  `}
                  fill={isSelected ? '#3B82F6' : '#6B7280'}
                  pointerEvents="none"
                />
              </g>
            )
          })}
          
          {/* Dribble Lines (gray wavy with arrow) - CLICKABLE */}
          {lines.filter(l => l.type === 'dribble').map((line) => {
            const angle = Math.atan2(line.endY - line.startY, line.endX - line.startX)
            const arrowLen = 2
            const arrowAngle = 0.5
            const dx = line.endX - line.startX
            const dy = line.endY - line.startY
            const length = Math.sqrt(dx * dx + dy * dy)
            const waves = Math.max(3, Math.floor(length / 5))
            const isSelected = selectedItem?.type === 'line' && selectedItem?.id === line.id
            // Create wavy path
            let path = `M ${line.startX} ${line.startY}`
            for (let i = 1; i <= waves; i++) {
              const t = i / waves
              const x = line.startX + dx * t
              const y = line.startY + dy * t
              const perpX = -dy / length * 1.5 * (i % 2 === 0 ? 1 : -1)
              const perpY = dx / length * 1.5 * (i % 2 === 0 ? 1 : -1)
              if (i === waves) {
                path += ` L ${x} ${y}`
              } else {
                const midX = line.startX + dx * (t - 0.5 / waves)
                const midY = line.startY + dy * (t - 0.5 / waves)
                path += ` Q ${midX + perpX} ${midY + perpY} ${x} ${y}`
              }
            }
            return (
              <g key={line.id} style={{ cursor: 'pointer' }}>
                {/* Invisible hit area for easier clicking */}
                <line
                  x1={line.startX}
                  y1={line.startY}
                  x2={line.endX}
                  y2={line.endY}
                  stroke="transparent"
                  strokeWidth="4"
                  onClick={(e) => handleLineClick(e, line.id)}
                />
                {/* Visible wavy line */}
                <path
                  d={path}
                  stroke={isSelected ? '#10B981' : '#6B7280'}
                  strokeWidth={isSelected ? '0.8' : '0.5'}
                  fill="none"
                  pointerEvents="none"
                />
                {/* Arrow head */}
                <polygon
                  points={`
                    ${line.endX},${line.endY}
                    ${line.endX - arrowLen * Math.cos(angle - arrowAngle)},${line.endY - arrowLen * Math.sin(angle - arrowAngle)}
                    ${line.endX - arrowLen * Math.cos(angle + arrowAngle)},${line.endY - arrowLen * Math.sin(angle + arrowAngle)}
                  `}
                  fill={isSelected ? '#10B981' : '#6B7280'}
                  pointerEvents="none"
                />
              </g>
            )
          })}
          
          {/* Line Preview while drawing */}
          {isDrawingLine && lineStartPos && linePreviewEnd && (
            <line
              x1={lineStartPos.x}
              y1={lineStartPos.y}
              x2={linePreviewEnd.x}
              y2={linePreviewEnd.y}
              stroke={selectedTool === 'pass' ? '#3B82F6' : '#10B981'}
              strokeWidth="0.5"
              strokeDasharray={selectedTool === 'pass' ? '2 1' : ''}
              opacity="0.7"
              pointerEvents="none"
            />
          )}
        </svg>
        
        {/* Delete button for selected line */}
        {selectedItem?.type === 'line' && lines.find(l => l.id === selectedItem.id) && (() => {
          const line = lines.find(l => l.id === selectedItem.id)!
          const midX = (line.startX + line.endX) / 2
          const midY = (line.startY + line.endY) / 2
          return (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
              style={{ left: `${midX}%`, top: `${midY}%` }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); deleteLine(line.id) }}
                className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4 text-slate-700" />
              </button>
            </div>
          )
        })()}
        
        {/* Cones (gray triangles) - DRAGGABLE */}
        {cones.map((cone) => {
          const isSelected = selectedItem?.type === 'cone' && selectedItem?.id === cone.id
          const isDragging = draggingCone === cone.id
          return (
            <div
              key={cone.id}
              onMouseDown={(e) => handleConeDragStart(e, cone.id)}
              onTouchStart={(e) => handleConeDragStart(e, cone.id)}
              onClick={(e) => {
                e.stopPropagation()
                if (!isDragging) {
                  setSelectedItem(isSelected ? null : { type: 'cone', id: cone.id })
                }
              }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${
                isSelected ? 'scale-110 z-10' : ''
              } ${isDragging ? 'cursor-grabbing scale-125 z-20' : 'cursor-grab'}`}
              style={{ 
                left: `${cone.x}%`, 
                top: `${cone.y}%`,
                touchAction: 'none'
              }}
            >
              <svg width="30" height="36" viewBox="0 0 30 36">
                <polygon 
                  points="15,2 28,34 2,34" 
                  fill="#94a3b8"
                  stroke={isSelected ? '#fff' : '#6B7280'}
                  strokeWidth="2"
                  filter={isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : ''}
                />
                {/* Cone stripes */}
                <line x1="7" y1="20" x2="23" y2="20" stroke="#94a3b8" strokeWidth="2" />
                <line x1="5" y1="28" x2="25" y2="28" stroke="#94a3b8" strokeWidth="2" />
              </svg>
              {isSelected && !isDragging && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCone(cone.id) }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-3 h-3 text-slate-700" />
                </button>
              )}
            </div>
          )
        })}
        
        {/* Text Labels (gray) - DRAGGABLE */}
        {textLabels.map((text) => {
          const isSelected = selectedItem?.type === 'text' && selectedItem?.id === text.id
          const isDragging = draggingText === text.id
          return (
            <div
              key={text.id}
              onMouseDown={(e) => handleTextDragStart(e, text.id)}
              onTouchStart={(e) => handleTextDragStart(e, text.id)}
              onClick={(e) => {
                e.stopPropagation()
                if (!isDragging) {
                  setSelectedItem(isSelected ? null : { type: 'text', id: text.id })
                }
              }}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${
                isSelected ? 'scale-110 z-10' : ''
              } ${isDragging ? 'cursor-grabbing scale-125 z-20' : 'cursor-grab'}`}
              style={{ 
                left: `${text.x}%`, 
                top: `${text.y}%`,
                touchAction: 'none'
              }}
            >
              <div 
                className="px-2 py-1 rounded text-xs font-bold whitespace-nowrap bg-slate-100 text-slate-700"
                style={{ 
                  border: isSelected ? '2px solid white' : '1px solid #4B5563',
                  filter: isDragging ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : ''
                }}
              >
                {text.label || 'Label'}
              </div>
              {isSelected && !isDragging && (
                <button
                  onClick={(e) => { e.stopPropagation(); deleteTextLabel(text.id) }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-3 h-3 text-slate-700" />
                </button>
              )}
            </div>
          )
        })}
        
        {/* Shot Spots (orange hexagons with numbers) - MAIN COLORFUL ELEMENTS */}
        {spots.map((spot) => (
          <div
            key={spot.id}
            onMouseDown={(e) => handleDragStart(e, spot.id)}
            onTouchStart={(e) => handleDragStart(e, spot.id)}
            onClick={(e) => {
              e.stopPropagation()
              if (!draggingSpot) {
                setSelectedSpot(selectedSpot === spot.id ? null : spot.id)
              }
            }}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-transform ${
              selectedSpot === spot.id ? 'scale-110 z-10' : ''
            } ${draggingSpot === spot.id ? 'cursor-grabbing scale-125 z-20' : 'cursor-grab'}`}
            style={{ 
              left: `${spot.x}%`, 
              top: `${spot.y}%`,
              touchAction: 'none'
            }}
          >
            <div className={`relative ${selectedSpot === spot.id && !draggingSpot ? 'animate-pulse' : ''}`}>
              <svg width="44" height="50" viewBox="0 0 44 50">
                <polygon 
                  points="22,2 42,14 42,38 22,50 2,38 2,14" 
                  fill="#FF6B35"
                  stroke={selectedSpot === spot.id ? '#fff' : '#FF8555'}
                  strokeWidth="2"
                  filter={draggingSpot === spot.id ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.5))' : ''}
                />
                <text 
                  x="22" 
                  y="32" 
                  textAnchor="middle" 
                  fill="white" 
                  fontSize="18" 
                  fontWeight="bold"
                  fontFamily="sans-serif"
                >
                  {spot.order}
                </text>
              </svg>
              
              {/* Delete button when selected */}
              {selectedSpot === spot.id && !draggingSpot && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteSpot(spot.id)
                  }}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                >
                  <X className="w-4 h-4 text-slate-700" />
                </button>
              )}
            </div>
          </div>
        ))}
        
        {/* Line Start Point Indicator */}
        {isDrawingLine && lineStartPos && (
          <div 
            className="absolute w-4 h-4 rounded-full bg-white/50 border-2 border-white pointer-events-none transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${lineStartPos.x}%`, top: `${lineStartPos.y}%` }}
          />
        )}
        
        {/* Placement indicator */}
        {isPlacingSpot && !isDrawingLine && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-black/40 text-white px-4 py-2 rounded-lg text-sm font-medium">
              {selectedTool === 'shot' && `Tap to place spot #${spots.length + 1}`}
              {selectedTool === 'cone' && 'Tap to place cone'}
              {selectedTool === 'text' && 'Tap to place text label'}
            </div>
          </div>
        )}
        
        {/* Line drawing instruction */}
        {isPlacingSpot && (selectedTool === 'pass' || selectedTool === 'dribble') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`px-4 py-2 rounded-lg text-sm font-medium ${
              selectedTool === 'pass' ? 'bg-blue-500/80' : 'bg-green-500/80'
            } text-white`}>
              {isDrawingLine 
                ? 'Tap to set end point' 
                : `Tap to set ${selectedTool} start point`}
            </div>
          </div>
        )}
      </div>
      
      {/* Drill Setup Toolset */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
        {/* Toolset Header */}
        <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2a2a2a] px-4 py-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Grip className="w-5 h-5 text-[#FF6B35]" />
              <h4 className="text-slate-900 font-bold text-sm uppercase tracking-wider">Toolset</h4>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={clearAllSpots}
                className="px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold uppercase transition-all"
              >
                Clear
              </button>
              <button
                onClick={resetSpots}
                className="px-2 py-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-bold uppercase transition-all"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
        
        {/* Tool Selection - 5 Tools */}
        <div className="p-3 grid grid-cols-5 gap-2">
          {/* Shot Tool */}
          <button
            onClick={() => { setSelectedTool('shot'); setIsPlacingSpot(true); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              selectedTool === 'shot' && isPlacingSpot
                ? 'bg-[#FF6B35] text-white shadow-lg shadow-[#FF6B35]/30 ring-2 ring-[#FF6B35]'
                : selectedTool === 'shot'
                ? 'bg-[#FF6B35]/20 text-[#FF6B35] border border-[#FF6B35]/50'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Crosshair className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase">Shot</span>
          </button>
          
          {/* Pass Tool */}
          <button
            onClick={() => { setSelectedTool('pass'); setIsPlacingSpot(true); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              selectedTool === 'pass' && isPlacingSpot
                ? 'bg-blue-500 text-white shadow-lg shadow-[#3B82F6]/30 ring-2 ring-[#3B82F6]'
                : selectedTool === 'pass'
                ? 'bg-blue-500/20 text-blue-500 border border-blue-500/50'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Pass</span>
          </button>
          
          {/* Dribble Tool */}
          <button
            onClick={() => { setSelectedTool('dribble'); setIsPlacingSpot(true); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              selectedTool === 'dribble' && isPlacingSpot
                ? 'bg-green-500 text-white shadow-lg shadow-[#10B981]/30 ring-2 ring-[#10B981]'
                : selectedTool === 'dribble'
                ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Move className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase">Dribble</span>
          </button>
          
          {/* Cone Tool */}
          <button
            onClick={() => { setSelectedTool('cone'); setIsPlacingSpot(true); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              selectedTool === 'cone' && isPlacingSpot
                ? 'bg-yellow-500 text-white shadow-lg shadow-[#F59E0B]/30 ring-2 ring-[#F59E0B]'
                : selectedTool === 'cone'
                ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 22h18L12 2z" />
            </svg>
            <span className="text-[10px] font-bold uppercase">Cone</span>
          </button>
          
          {/* Text Tool */}
          <button
            onClick={() => { setSelectedTool('text'); setIsPlacingSpot(true); }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              selectedTool === 'text' && isPlacingSpot
                ? 'bg-purple-500 text-white shadow-lg shadow-[#8B5CF6]/30 ring-2 ring-[#8B5CF6]'
                : selectedTool === 'text'
                ? 'bg-purple-500/20 text-purple-500 border border-purple-500/50'
                : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 border border-slate-200'
            }`}
          >
            <Type className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-bold uppercase">Text</span>
          </button>
        </div>
        
        {/* Placement Indicator */}
        {isPlacingSpot && (
          <div className="px-3 pb-3">
            <div className={`px-3 py-2 rounded-lg text-center text-xs font-bold uppercase animate-pulse ${
              selectedTool === 'shot' ? 'bg-[#FF6B35]/20 text-[#FF6B35]' :
              selectedTool === 'pass' ? 'bg-blue-500/20 text-blue-500' :
              selectedTool === 'dribble' ? 'bg-green-500/20 text-green-500' :
              selectedTool === 'cone' ? 'bg-yellow-500/20 text-yellow-500' :
              'bg-purple-500/20 text-purple-500'
            }`}>
              Tap court to place {selectedTool}
            </div>
          </div>
        )}
        
        {/* Quick Stats - Small Cards */}
        <div className="grid grid-cols-4 gap-2 p-3 bg-slate-50 border-t border-slate-200">
          <div className="bg-white rounded-lg p-2 text-center border border-[#FF6B35]/30">
            <p className="text-[#FF6B35] text-lg font-black">{spots.length}</p>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Shots</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
            <p className="text-slate-700 text-lg font-black">{lines.filter(l => l.type === 'pass').length}</p>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Pass</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
            <p className="text-slate-700 text-lg font-black">{lines.filter(l => l.type === 'dribble').length}</p>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Dribble</p>
          </div>
          <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
            <p className="text-slate-700 text-lg font-black">{cones.length}</p>
            <p className="text-slate-500 text-[9px] uppercase tracking-wider">Cones</p>
          </div>
        </div>
      </div>
      
      {/* Text Input Modal */}
      {textInputId && (
        <div className="bg-white rounded-xl p-4 border border-slate-300/50">
          <div className="flex items-center gap-2 mb-3">
            <Type className="w-5 h-5 text-slate-400" />
            <span className="text-slate-900 font-bold text-sm">Add Label</span>
          </div>
          <input
            type="text"
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            placeholder="Enter text..."
            className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 text-sm focus:outline-none focus:border-slate-300 mb-3"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={() => {
                setTextLabels(prev => prev.map(t => 
                  t.id === textInputId ? { ...t, label: textInputValue } : t
                ))
                setTextInputId(null)
                setTextInputValue('')
              }}
              className="flex-1 py-2 bg-slate-200 text-slate-700 font-bold text-sm rounded-lg hover:bg-slate-200 transition-colors"
            >
              Save
            </button>
            <button
              onClick={() => {
                setTextLabels(prev => prev.filter(t => t.id !== textInputId))
                setTextInputId(null)
                setTextInputValue('')
              }}
              className="px-4 py-2 bg-slate-50 text-slate-500 font-bold text-sm rounded-lg hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      
      {/* Drill Mode Dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowModeDropdown(!showModeDropdown)}
          className="w-full bg-slate-50 rounded-lg p-4 border-l-4 border-[#FF6B35] text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {drillMode === 'attempts' && <Target className="w-6 h-6 text-[#FF6B35]" />}
              {drillMode === 'made' && <Check className="w-6 h-6 text-green-500" />}
              {drillMode === 'time' && <Timer className="w-6 h-6 text-blue-500" />}
              {drillMode === 'streak' && <Flame className="w-6 h-6 text-orange-500" />}
              <div>
                <h3 className="text-slate-900 font-black text-xl italic uppercase">
                  {drillMode === 'attempts' && 'Attempts Mode'}
                  {drillMode === 'made' && 'Made Mode'}
                  {drillMode === 'time' && 'Time Mode'}
                  {drillMode === 'streak' && 'Streak Mode'}
                </h3>
                <p className="text-slate-500 text-sm uppercase tracking-wider">
                  {drillMode === 'attempts' && 'Take a set number of shots'}
                  {drillMode === 'made' && 'Make a set number of shots'}
                  {drillMode === 'time' && 'Shoot for a fixed amount of time'}
                  {drillMode === 'streak' && 'Make shots in a row before moving'}
                </p>
              </div>
            </div>
            <ChevronDown className={`w-6 h-6 text-slate-500 transition-transform ${showModeDropdown ? 'rotate-180' : ''}`} />
          </div>
        </button>
        
        {/* Dropdown Menu */}
        {showModeDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-50 rounded-lg border border-slate-200 overflow-hidden z-50 shadow-xl">
            {/* Attempts Mode */}
            <button
              onClick={() => { setDrillMode('attempts'); setShowModeDropdown(false); }}
              className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-100 transition-colors ${drillMode === 'attempts' ? 'bg-slate-100 border-l-4 border-[#FF6B35]' : ''}`}
            >
              <Target className="w-5 h-5 text-[#FF6B35]" />
              <div>
                <p className="text-slate-900 font-bold">Attempts Mode</p>
                <p className="text-slate-500 text-xs">Take a set number of shots</p>
              </div>
            </button>
            
            {/* Made Mode */}
            <button
              onClick={() => { setDrillMode('made'); setShowModeDropdown(false); }}
              className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-100 transition-colors border-t border-slate-200 ${drillMode === 'made' ? 'bg-slate-100 border-l-4 border-green-500' : ''}`}
            >
              <Check className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-slate-900 font-bold">Made Mode</p>
                <p className="text-slate-500 text-xs">Make a set number of shots</p>
              </div>
            </button>
            
            {/* Time Mode */}
            <button
              onClick={() => { setDrillMode('time'); setShowModeDropdown(false); }}
              className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-100 transition-colors border-t border-slate-200 ${drillMode === 'time' ? 'bg-slate-100 border-l-4 border-blue-500' : ''}`}
            >
              <Timer className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-slate-900 font-bold">Time Mode</p>
                <p className="text-slate-500 text-xs">Shoot for a fixed amount of time</p>
              </div>
            </button>
            
            {/* Streak Mode */}
            <button
              onClick={() => { setDrillMode('streak'); setShowModeDropdown(false); }}
              className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-100 transition-colors border-t border-slate-200 ${drillMode === 'streak' ? 'bg-slate-100 border-l-4 border-orange-500' : ''}`}
            >
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-slate-900 font-bold">Streak Mode</p>
                <p className="text-slate-500 text-xs">Make shots in a row before moving</p>
              </div>
            </button>
          </div>
        )}
      </div>
      
      {/* Mode-specific settings - Time Mode uses main Drill Time Limit below */}
      {drillMode === 'time' && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-center gap-2">
          <Timer className="w-5 h-5 text-blue-400" />
          <span className="text-blue-400 text-sm">Time Mode uses the Drill Time Limit setting below</span>
        </div>
      )}
      
      {drillMode === 'streak' && (
        <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
          <button 
            onClick={() => setStreakTarget(Math.max(2, streakTarget - 1))}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <Minus className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-center">
            <p className="text-slate-900 text-3xl font-black">{streakTarget}</p>
            <p className="text-slate-500 text-xs uppercase tracking-wider">In a Row</p>
          </div>
          <button 
            onClick={() => setStreakTarget(streakTarget + 1)}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
        </div>
      )}
      
      {/* Balls Per Spot */}
      <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
        <button
          onClick={() => setBallsPerSpot(Math.max(1, ballsPerSpot - 1))}
          className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <Minus className="w-6 h-6 text-slate-700" />
        </button>
        <div className="text-center">
          <div className="text-slate-900 font-black text-4xl">{ballsPerSpot}</div>
          <div className="text-slate-500 text-sm uppercase tracking-wider">Balls Per Spot</div>
        </div>
        <button
          onClick={() => setBallsPerSpot(Math.min(20, ballsPerSpot + 1))}
          className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
        >
          <Plus className="w-6 h-6 text-slate-700" />
        </button>
      </div>
      
      {/* Shots to Take - only for attempts and made modes */}
      {(drillMode === 'attempts' || drillMode === 'made') && (
        <div className="bg-slate-50 rounded-lg p-4 flex items-center justify-between">
          <button
            onClick={() => setShotsToTake(Math.max(10, shotsToTake - 10))}
            className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <Minus className="w-6 h-6 text-slate-700" />
          </button>
          <div className="text-center">
            <div className="text-slate-900 font-black text-4xl">{shotsToTake}</div>
            <div className="text-slate-500 text-sm uppercase tracking-wider">
              {drillMode === 'attempts' ? 'Shots to Take' : 'Shots to Make'}
            </div>
          </div>
          <button
            onClick={() => setShotsToTake(Math.min(200, shotsToTake + 10))}
            className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-6 h-6 text-slate-700" />
          </button>
        </div>
      )}
      
      {/* Timer Duration - Always visible for setting drill time */}
      <TimeLimitInput 
        timeLimitSeconds={timeLimitSeconds}
        setTimeLimitSeconds={setTimeLimitSeconds}
        formatTime={formatTime}
      />
      
      {/* Quick time presets */}
      <div className="flex gap-2 -mt-2 mb-4">
        {[30, 60, 120, 180, 300, 600].map((seconds) => (
          <button
            key={seconds}
            onClick={() => setTimeLimitSeconds(seconds)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors ${
              timeLimitSeconds === seconds 
                ? 'bg-blue-500 text-white' 
                : 'bg-white text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {seconds < 60 ? `${seconds}s` : `${seconds / 60}m`}
          </button>
        ))}
      </div>
      
      {/* Number of Sets */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <RotateCcw className="w-5 h-5 text-[#FF6B35]" />
          <span className="text-slate-900 font-bold text-sm uppercase tracking-wider">Sets</span>
          {isDrillActive && (
            <span className="ml-auto px-2 py-0.5 bg-[#FF6B35]/20 rounded text-[#FF6B35] text-xs font-bold">
              Set {currentSet}/{numberOfSets}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setNumberOfSets(Math.max(1, numberOfSets - 1))}
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <Minus className="w-5 h-5 text-slate-700" />
          </button>
          <div className="text-center flex-1">
            <div className="text-slate-900 font-black text-4xl">{numberOfSets}</div>
            <div className="text-slate-500 text-sm uppercase tracking-wider">Sets</div>
          </div>
          <button
            onClick={() => setNumberOfSets(Math.min(10, numberOfSets + 1))}
            className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
          >
            <Plus className="w-5 h-5 text-slate-700" />
          </button>
        </div>
        {numberOfSets > 1 && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-sm">Rest Between Sets</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRestBetweenSets(Math.max(10, restBetweenSets - 10))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Minus className="w-4 h-4 text-slate-700" />
                </button>
                <span className="text-slate-900 font-bold w-16 text-center">{restBetweenSets}s</span>
                <button
                  onClick={() => setRestBetweenSets(Math.min(120, restBetweenSets + 10))}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors"
                >
                  <Plus className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Spot Intervals - Shows each spot with its position name */}
      {spots.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-[#FF6B35]" />
            <span className="text-slate-900 font-bold text-sm uppercase tracking-wider">Spot Intervals</span>
            <span className="ml-auto text-slate-500 text-xs">{spots.length} positions</span>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {spots.map((spot, index) => (
              <div 
                key={spot.id}
                className={`flex items-center gap-3 p-3 rounded-lg bg-white border transition-colors ${
                  currentSpotIndex === index && isDrillActive 
                    ? 'border-[#FF6B35] bg-[#FF6B35]/10' 
                    : 'border-slate-200 hover:border-slate-200'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm ${
                  currentSpotIndex === index && isDrillActive 
                    ? 'bg-[#FF6B35] text-white' 
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {spot.order}
                </div>
                <div className="flex-1">
                  <p className="text-slate-900 font-bold text-sm">{spot.name}</p>
                  <p className="text-slate-500 text-xs">{ballsPerSpot} shots per spot</p>
                </div>
                {isDrillActive && currentSpotIndex === index && (
                  <div className="flex items-center gap-1 text-[#FF6B35]">
                    <ArrowRight className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase">Current</span>
                  </div>
                )}
                {!isDrillActive && (
                  <button
                    onClick={() => {
                      const newName = prompt('Enter position name:', spot.name)
                      if (newName) {
                        setSpots(prev => prev.map(s => 
                          s.id === spot.id ? { ...s, name: newName } : s
                        ))
                      }
                    }}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      
    </div>
  )
}

// ============================================
// INSTRUCTIONS TAB
// ============================================

interface InstructionsTabProps {
  drill: Drill
  keyPoints: string[]
  timeLimitSeconds: number // From Build a Drill tab (in seconds)
  numberOfSets: number
  spots: CourtSpot[]
  ballsPerSpot: number
}

function InstructionsTab({ drill, keyPoints, timeLimitSeconds, numberOfSets, spots, ballsPerSpot }: InstructionsTabProps) {
  // Editable instructions state
  const [customInstructions, setCustomInstructions] = useState<string[]>(drill.steps)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [newInstruction, setNewInstruction] = useState('')
  
  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedIndex(index)
  }
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return
    
    const newInstructions = [...customInstructions]
    const draggedItem = newInstructions[draggedIndex]
    newInstructions.splice(draggedIndex, 1)
    newInstructions.splice(index, 0, draggedItem)
    setCustomInstructions(newInstructions)
    setDraggedIndex(index)
  }
  
  // Handle drag end
  const handleDragEnd = () => {
    setDraggedIndex(null)
  }
  
  // Start editing
  const startEditing = (index: number) => {
    setEditingIndex(index)
    setEditValue(customInstructions[index])
  }
  
  // Save edit
  const saveEdit = () => {
    if (editingIndex !== null && editValue.trim()) {
      const newInstructions = [...customInstructions]
      newInstructions[editingIndex] = editValue.trim()
      setCustomInstructions(newInstructions)
    }
    setEditingIndex(null)
    setEditValue('')
  }
  
  // Delete instruction
  const deleteInstruction = (index: number) => {
    setCustomInstructions(customInstructions.filter((_, i) => i !== index))
  }
  
  // Add new instruction
  const addInstruction = () => {
    if (newInstruction.trim()) {
      setCustomInstructions([...customInstructions, newInstruction.trim()])
      setNewInstruction('')
    }
  }
  
  return (
    <div className="p-4 space-y-6">
      {/* Focus Area Section */}
      <div className="bg-slate-50 rounded-lg p-4 border-l-4 border-[#FF6B35]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
            <Target className="w-5 h-5 text-[#FF6B35]" />
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">FOCUS</p>
            <p className="text-[#FF6B35] font-bold uppercase">{FOCUS_AREA_LABELS[drill.focusArea]}</p>
          </div>
        </div>
      </div>
      
      {/* Duration - Tied to Drill tab timer */}
      <div className="bg-slate-50 rounded-lg p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <Timer className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">DURATION</p>
              <p className="text-slate-900 font-bold">
                {timeLimitSeconds >= 60 
                  ? `${Math.floor(timeLimitSeconds / 60)}:${(timeLimitSeconds % 60).toString().padStart(2, '0')}`
                  : `${timeLimitSeconds}s`
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center">
              <RotateCcw className="w-5 h-5 text-[#FF6B35]" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">SETS</p>
              <p className="text-slate-900 font-bold">{numberOfSets}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">SPOTS</p>
              <p className="text-slate-900 font-bold">{spots.length} × {ballsPerSpot}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Coach's Instructions - Editable & Draggable */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-3 uppercase text-lg">
          <img 
            src="/icons/coach-feedback.png" 
            alt="Coach" 
            className="w-12 h-12"
            style={{ filter: 'none' }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
          COACH&apos;S INSTRUCTIONS
          <span className="ml-auto text-xs text-slate-500 font-normal normal-case">Drag to reorder</span>
        </h3>
        <div className="space-y-3">
          {customInstructions.map((step, i) => (
            <div 
              key={i}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDragEnd={handleDragEnd}
              className={`flex items-start gap-3 p-3 rounded-lg bg-white border cursor-move transition-all ${
                draggedIndex === i ? 'border-[#FF6B35] bg-[#FF6B35]/10 opacity-50' : 'border-slate-200 hover:border-slate-200'
              }`}
            >
              <div className="flex items-center gap-2">
                <Grip className="w-4 h-4 text-slate-500" />
                <span className="font-russo text-xl font-bold text-[#FF6B35] w-6 text-center">
                  {i + 1}
                </span>
              </div>
              {editingIndex === i ? (
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded px-3 py-1 text-slate-700 text-sm focus:outline-none focus:border-[#FF6B35]"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit()
                      if (e.key === 'Escape') setEditingIndex(null)
                    }}
                  />
                  <button
                    onClick={saveEdit}
                    className="p-1 rounded bg-green-500/20 text-green-400 hover:bg-green-500/30"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingIndex(null)}
                    className="p-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <p className="flex-1 text-slate-700 leading-relaxed text-sm">{step}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => startEditing(i)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <Edit2 className="w-3 h-3 text-slate-500" />
                    </button>
                    <button
                      onClick={() => deleteInstruction(i)}
                      className="p-1.5 rounded bg-slate-100 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-slate-500" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
          
          {/* Add New Instruction */}
          <div className="flex gap-2 mt-4">
            <input
              type="text"
              value={newInstruction}
              onChange={(e) => setNewInstruction(e.target.value)}
              placeholder="Add new instruction..."
              className="flex-1 bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-700 text-sm focus:outline-none focus:border-[#FF6B35] placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addInstruction()
              }}
            />
            <button
              onClick={addInstruction}
              disabled={!newInstruction.trim()}
              className="px-4 py-2 rounded-lg bg-[#FF6B35] text-white font-bold text-sm hover:bg-[#FF8555] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Key Points - AI Generated */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2 uppercase">
          <Check className="w-5 h-5" />
          KEY POINTS - DO IT RIGHT
          <span className="ml-auto flex items-center gap-1 text-xs text-blue-400 font-normal normal-case">
            <Sparkles className="w-3 h-3" />
            AI Generated
          </span>
        </h3>
        <div className="space-y-3">
          {keyPoints.map((point, i) => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-lg p-3">
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                <Check className="w-4 h-4 text-green-400" />
              </div>
              <span className="text-slate-700 text-sm">{point}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Pro Tips - AI Generated */}
      <div className="bg-slate-50 rounded-lg p-4">
        <h3 className="text-[#FF6B35] font-bold mb-4 flex items-center gap-2 uppercase">
          <Star className="w-5 h-5" />
          PRO TIPS
          <span className="ml-auto flex items-center gap-1 text-xs text-blue-400 font-normal normal-case">
            <Sparkles className="w-3 h-3" />
            AI Generated
          </span>
        </h3>
        <ul className="space-y-3">
          <li className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
            <span className="text-slate-500 text-sm">{drill.whyItMatters}</span>
          </li>
          {drill.technicalNote && (
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
              <span className="text-slate-500 text-sm">{drill.technicalNote}</span>
            </li>
          )}
          {drill.expectedOutcomes.slice(0, 2).map((outcome, i) => (
            <li key={i} className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#FF6B35] flex-shrink-0 mt-2" />
              <span className="text-slate-500 text-sm">{outcome}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default DrillExecutionPage

