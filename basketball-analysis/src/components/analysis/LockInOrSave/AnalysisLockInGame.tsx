"use client"

/**
 * Lock In or Save: Analysis Edition
 * 
 * Takes the EXACT EXISTING sections from the Analysis tab - NO CHANGES - just makes them swipeable.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { 
  Play, ChevronRight, ChevronLeft, Check, Lightbulb,
  Flame, Trophy, Lock, Bookmark
} from "lucide-react"

// ============================================
// STORAGE
// ============================================

const STORAGE_KEYS = {
  GAME_STATS: 'shotiq_analysis_lockin_stats',
  LOCKED_IN: 'shotiq_analysis_locked_sections',
  SEEN: 'shotiq_analysis_seen'
}

interface GameStats { totalReviewed: number; lockedIn: number; saved: number; currentStreak: number; bestStreak: number; xp: number; level: number }

const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue
  try { return localStorage.getItem(key) ? JSON.parse(localStorage.getItem(key)!) : defaultValue } catch { return defaultValue }
}
const saveToStorage = <T,>(key: string, value: T): void => { if (typeof window !== 'undefined') try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

const XP_PER_REVIEW = 15
const XP_PER_LOCKIN = 30
const DEFAULT_GAME_STATS: GameStats = { totalReviewed: 0, lockedIn: 0, saved: 0, currentStreak: 0, bestStreak: 0, xp: 0, level: 1 }
function getLevelFromXP(xp: number): number { return Math.floor(xp / 500) + 1 }

// ============================================
// HELPERS - EXACT from SimplifiedTabs.tsx
// ============================================
function getGrade(value: number): string {
  if (value >= 90) return 'A+'
  if (value >= 85) return 'A'
  if (value >= 80) return 'B+'
  if (value >= 75) return 'B'
  if (value >= 70) return 'C+'
  if (value >= 65) return 'C'
  if (value >= 60) return 'D'
  return 'F'
}
function getTextColor(value: number): string {
  if (value >= 80) return 'text-green-400'
  if (value >= 65) return 'text-[#FF6B35]'
  return 'text-red-400'
}
function getBarColor(value: number): string {
  if (value >= 80) return 'bg-gradient-to-r from-green-500 to-green-400'
  if (value >= 65) return 'bg-gradient-to-r from-[#FF6B35] to-orange-400'
  return 'bg-gradient-to-r from-red-500 to-red-400'
}

// ============================================
// PROPS
// ============================================

interface AnalysisLockInGameProps {
  measurements?: { shoulderAngle?: number; elbowAngle?: number; hipAngle?: number; kneeAngle?: number; ankleAngle?: number; releaseHeight?: number; releaseAngle?: number; entryAngle?: number }
  shootingStats?: { form?: number; elbow?: number; balance?: number; power?: number; followThrough?: number; arc?: number; release?: number }
  overallScore?: number
  dashboardView?: 'basic' | 'standard' | 'professional'
}

// ============================================
// MAIN COMPONENT
// ============================================

export function AnalysisLockInGame({ 
  shootingStats,
  overallScore = 78,
}: AnalysisLockInGameProps) {
  const [isHydrated, setIsHydrated] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [gameStats, setGameStats] = useState<GameStats>(DEFAULT_GAME_STATS)
  const [lockedInSections, setLockedInSections] = useState<string[]>([])
  const [seenCards, setSeenCards] = useState<Set<string>>(new Set())
  const [dragX, setDragX] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [arrowTop, setArrowTop] = useState(50)
  const cardWrapperRef = useRef<HTMLDivElement>(null)
  const [showVoteResult, setShowVoteResult] = useState(false)
  const [lastAction, setLastAction] = useState<'lockin' | 'save' | null>(null)
  const [activeTab, setActiveTab] = useState<'play' | 'locked' | 'saved'>('play')
  
  const dragStartX = useRef(0)
  
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
  
  // Defaults - EXACT from SimplifiedTabs.tsx
  const stats = shootingStats || { form: 73, elbow: 90, balance: 80, power: 78, followThrough: 80, arc: 79, release: 67 }
  
  // Categories - EXACT from SimplifiedTabs.tsx
  const upperBody = [{ label: 'Form', value: stats.form || 75 }, { label: 'Elbow', value: stats.elbow || 75 }]
  const lowerBody = [{ label: 'Balance', value: stats.balance || 75 }, { label: 'Power', value: stats.power || 75 }]
  const release = [{ label: 'Follow Through', value: stats.followThrough || 75 }, { label: 'Arc', value: stats.arc || 75 }]
  
  const upperAvg = Math.round(upperBody.reduce((a, b) => a + b.value, 0) / upperBody.length)
  const lowerAvg = Math.round(lowerBody.reduce((a, b) => a + b.value, 0) / lowerBody.length)
  const releaseAvg = Math.round(release.reduce((a, b) => a + b.value, 0) / release.length)

  useEffect(() => {
    setIsHydrated(true)
    setGameStats(loadFromStorage(STORAGE_KEYS.GAME_STATS, DEFAULT_GAME_STATS))
    setLockedInSections(loadFromStorage(STORAGE_KEYS.LOCKED_IN, []))
    setSeenCards(new Set(loadFromStorage<string[]>(STORAGE_KEYS.SEEN, [])))
  }, [])
  
  // HorizontalBar - EXACT from SimplifiedTabs.tsx
  const HorizontalBar = ({ label, value, showGrade = false }: { label: string; value: number; showGrade?: boolean }) => (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[#888] text-xs uppercase">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-bold">{value}</span>
          {showGrade && <span className={`text-xs font-bold ${getTextColor(value)}`}>{getGrade(value)}</span>}
        </div>
      </div>
      <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${getBarColor(value)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
  
  // Build cards - each is the EXACT section from SimplifiedTabs.tsx StandardBiomechanicalAnalysis
  const sectionCards = useMemo(() => [
    // ========== 1. UPPER BODY - EXACT from SimplifiedTabs.tsx lines 148-157 + 185-192 ==========
    {
      id: 'upper-body',
      title: 'Upper Body',
      content: (
        <div className="space-y-4">
          {/* Summary Card - EXACT */}
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#888] text-xs uppercase">Upper Body</span>
              <span className={`text-lg font-black ${getTextColor(upperAvg)}`}>{getGrade(upperAvg)}</span>
            </div>
            <div className="text-3xl font-black text-white mb-2">{upperAvg}</div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getBarColor(upperAvg)}`} style={{ width: `${upperAvg}%` }} />
            </div>
          </div>
          {/* Details - EXACT */}
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider mb-4">Upper Body</h4>
            <div className="space-y-4">
              {upperBody.map((stat) => <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />)}
            </div>
          </div>
        </div>
      )
    },
    // ========== 2. LOWER BODY - EXACT from SimplifiedTabs.tsx lines 159-168 + 195-202 ==========
    {
      id: 'lower-body',
      title: 'Lower Body',
      content: (
        <div className="space-y-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#888] text-xs uppercase">Lower Body</span>
              <span className={`text-lg font-black ${getTextColor(lowerAvg)}`}>{getGrade(lowerAvg)}</span>
            </div>
            <div className="text-3xl font-black text-white mb-2">{lowerAvg}</div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getBarColor(lowerAvg)}`} style={{ width: `${lowerAvg}%` }} />
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider mb-4">Lower Body</h4>
            <div className="space-y-4">
              {lowerBody.map((stat) => <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />)}
            </div>
          </div>
        </div>
      )
    },
    // ========== 3. RELEASE - EXACT from SimplifiedTabs.tsx lines 170-179 + 205-212 ==========
    {
      id: 'release',
      title: 'Release',
      content: (
        <div className="space-y-4">
          <div className="bg-[#2a2a2a] rounded-lg p-4 border border-[#3a3a3a]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[#888] text-xs uppercase">Release</span>
              <span className={`text-lg font-black ${getTextColor(releaseAvg)}`}>{getGrade(releaseAvg)}</span>
            </div>
            <div className="text-3xl font-black text-white mb-2">{releaseAvg}</div>
            <div className="h-1.5 bg-[#1a1a1a] rounded-full overflow-hidden">
              <div className={`h-full rounded-full ${getBarColor(releaseAvg)}`} style={{ width: `${releaseAvg}%` }} />
            </div>
          </div>
          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#3a3a3a]">
            <h4 className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider mb-4">Release</h4>
            <div className="space-y-4">
              {release.map((stat) => <HorizontalBar key={stat.label} label={stat.label} value={stat.value} showGrade />)}
            </div>
          </div>
        </div>
      )
    },
    // ========== 4. QUICK TIP - EXACT from SimplifiedTabs.tsx lines 216-230 ==========
    {
      id: 'quick-tip',
      title: 'Quick Tip',
      content: (
        <div className="bg-gradient-to-r from-[#FF6B35]/10 to-[#FF6B35]/5 rounded-lg p-4 border border-[#FF6B35]/20">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-[#FF6B35] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#FF6B35] font-bold text-sm mb-1">Quick Tip</p>
              <p className="text-[#E5E5E5] text-sm">
                {upperAvg < lowerAvg && upperAvg < releaseAvg
                  ? "Focus on your upper body mechanics - keep your elbow tucked and aligned with the basket."
                  : lowerAvg < releaseAvg
                  ? "Work on your base - a strong, balanced stance gives you more power and consistency."
                  : "Practice your follow-through - a smooth release with good arc improves accuracy."}
              </p>
            </div>
          </div>
        </div>
      )
    },
  ], [upperBody, lowerBody, release, upperAvg, lowerAvg, releaseAvg])
  
  const displayCards = useMemo(() => {
    if (activeTab === 'locked') return sectionCards.filter(c => lockedInSections.includes(c.id))
    if (activeTab === 'saved') return sectionCards.filter(c => seenCards.has(c.id) && !lockedInSections.includes(c.id))
    return sectionCards.filter(c => !seenCards.has(c.id))
  }, [activeTab, sectionCards, lockedInSections, seenCards])
  
  const currentCard = displayCards[currentIndex]
  
  const handleVote = useCallback((action: 'lockin' | 'save') => {
    if (!currentCard) return
    if (action === 'lockin') {
      const newLockedIn = [...lockedInSections, currentCard.id]
      setLockedInSections(newLockedIn)
      saveToStorage(STORAGE_KEYS.LOCKED_IN, newLockedIn)
    }
    const newSeen = new Set(seenCards)
    newSeen.add(currentCard.id)
    setSeenCards(newSeen)
    saveToStorage(STORAGE_KEYS.SEEN, Array.from(newSeen))
    const xpGain = action === 'lockin' ? XP_PER_LOCKIN : XP_PER_REVIEW
    const newStreak = gameStats.currentStreak + 1
    const newStats = { ...gameStats, totalReviewed: gameStats.totalReviewed + 1, lockedIn: action === 'lockin' ? gameStats.lockedIn + 1 : gameStats.lockedIn, saved: action === 'save' ? gameStats.saved + 1 : gameStats.saved, currentStreak: newStreak, bestStreak: Math.max(gameStats.bestStreak, newStreak), xp: gameStats.xp + xpGain, level: getLevelFromXP(gameStats.xp + xpGain) }
    setGameStats(newStats)
    saveToStorage(STORAGE_KEYS.GAME_STATS, newStats)
    setLastAction(action)
    setShowVoteResult(true)
    setTimeout(() => { setShowVoteResult(false); setLastAction(null); setDragX(0); setCurrentIndex(prev => prev + 1) }, 1200)
  }, [currentCard, lockedInSections, seenCards, gameStats])
  
  const handleDragStart = useCallback((clientX: number) => { setIsDragging(true); dragStartX.current = clientX }, [])
  const handleDragMove = useCallback((clientX: number) => { if (isDragging) setDragX(clientX - dragStartX.current) }, [isDragging])
  const handleDragEnd = useCallback(() => { if (!isDragging) return; setIsDragging(false); if (dragX > 100) handleVote('lockin'); else if (dragX < -100) handleVote('save'); else setDragX(0) }, [isDragging, dragX, handleVote])
  
  const resetGame = useCallback(() => { setCurrentIndex(0); setSeenCards(new Set()); saveToStorage(STORAGE_KEYS.SEEN, []) }, [])
  
  if (!isHydrated) return <div className="flex items-center justify-center h-[400px]"><div className="w-10 h-10 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin" /></div>
  
  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-white font-bold text-lg">Biomechanical Analysis</h2><p className="text-[#666] text-xs">Swipe through your sections</p></div>
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1"><Flame className="w-3.5 h-3.5 text-[#FF6B35]" /><span className="text-white font-bold">{gameStats.currentStreak}</span></div>
          <div className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-green-500" /><span className="text-white font-bold">{gameStats.lockedIn}</span></div>
          <div className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-[#FFD700]" /><span className="text-white font-bold">{gameStats.xp}</span></div>
        </div>
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
      {activeTab === 'play' && (
        <>
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
            
              {/* Side indicators */}
              <div className="absolute left-0 top-0 bottom-0 w-16 pointer-events-none z-10 flex items-center pl-2" style={{ opacity: dragX < -30 ? Math.min(1, Math.abs(dragX) / 100) : 0 }}><Bookmark className="w-8 h-8 text-blue-400" /></div>
              <div className="absolute right-0 top-0 bottom-0 w-16 pointer-events-none z-10 flex items-center justify-end pr-2" style={{ opacity: dragX > 30 ? Math.min(1, dragX / 100) : 0 }}><Lock className="w-8 h-8 text-[#FF6B35]" /></div>
              
              {/* The EXACT section - just made draggable */}
              <div 
                className="touch-none select-none cursor-grab active:cursor-grabbing transition-transform"
                style={{ transform: `translateX(${dragX}px) rotate(${dragX * 0.02}deg)`, transition: isDragging ? 'none' : 'transform 0.3s' }}
                onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
                onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
                onTouchEnd={handleDragEnd}
                onMouseDown={(e) => handleDragStart(e.clientX)}
                onMouseMove={(e) => handleDragMove(e.clientX)}
                onMouseUp={handleDragEnd}
                onMouseLeave={() => { if (isDragging) handleDragEnd() }}
              >
                {currentCard.content}
              </div>
              
              {/* Vote overlay */}
              {showVoteResult && (
                <div className="absolute inset-0 bg-black/80 rounded-lg flex items-center justify-center z-20">
                  <div className="text-center">
                    {lastAction === 'lockin' ? <Lock className="w-12 h-12 text-[#FF6B35] mx-auto mb-2" /> : <Bookmark className="w-12 h-12 text-blue-400 mx-auto mb-2" />}
                    <p className={`font-bold ${lastAction === 'lockin' ? 'text-[#FF6B35]' : 'text-blue-400'}`}>{lastAction === 'lockin' ? 'LOCKED IN!' : 'SAVED!'}</p>
                  </div>
                </div>
              )}
              
              {/* Hint + Buttons */}
              <div className="flex items-center justify-center gap-2 mt-3 text-[#555] text-[10px]"><ChevronLeft className="w-3 h-3" />Swipe or Tap<ChevronRight className="w-3 h-3" /></div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => handleVote('save')} className="flex-1 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold whitespace-nowrap">Save</button>
                <button type="button" onClick={() => handleVote('lockin')} className="flex-1 py-2 rounded-lg bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#FF6B35] text-xs font-semibold whitespace-nowrap">Lock</button>
              </div>
              <p className="text-center text-[#666] text-xs mt-2">{currentIndex + 1} of {displayCards.length}</p>
            </div>
          ) : (
            <div className="text-center py-12"><Check className="w-12 h-12 text-green-500 mx-auto mb-3" /><p className="text-white font-bold">All Done!</p><button type="button" onClick={resetGame} className="mt-3 px-4 py-2 bg-[#FF6B35] text-white text-sm rounded-lg whitespace-nowrap">Restart</button></div>
          )}
        </>
      )}

      {/* Locked/Saved lists */}
      {(activeTab === 'locked' || activeTab === 'saved') && (
        <div className="space-y-3">
          {displayCards.length === 0 ? (
            <div className="text-center py-12"><p className="text-[#888]">No sections {activeTab === 'locked' ? 'locked in' : 'saved'} yet.</p></div>
          ) : displayCards.map(card => (
            <div key={card.id}>{card.content}</div>
          ))}
        </div>
      )}
    </div>
  )
}
