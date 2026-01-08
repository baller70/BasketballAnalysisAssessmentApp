"use client"

/**
 * Score or Pass: Basketball Elite Shooter Edition
 * 
 * A Tinder-style comparison game where users swipe/vote on elite shooters
 * matched to their body type. Designed for engagement with ages 9-23.
 * 
 * Features:
 * - Swipeable player cards
 * - Score (🔥) or Pass (❌) voting
 * - Community vote percentages revealed after voting
 * - Leaderboard of top-rated shooters
 * - XP, streaks, and achievements
 * - Saved "Score" selections for comparison
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react"
// framer-motion removed for simplicity - using CSS transitions instead
import { 
  Flame, X, Trophy, Zap, Target, Check,
  Crown, TrendingUp, Users,
  Sparkles, Medal, RotateCcw, Heart,
  SlidersHorizontal, ChevronDown, Filter
} from "lucide-react"
import { 
  ALL_ELITE_SHOOTERS, 
  EliteShooter, 
  TIER_LABELS, 
  TIER_COLORS,
  POSITION_LABELS,
  BodyType
} from "@/data/eliteShooters"

// ============================================
// TYPES
// ============================================

interface UserProfile {
  height?: number // inches
  weight?: number // lbs
  bodyType?: BodyType
}

interface VoteStats {
  [shooterId: number]: {
    scoreCount: number
    passCount: number
  }
}

interface GameStats {
  totalVotes: number
  scoreCount: number
  passCount: number
  currentStreak: number
  bestStreak: number
  xp: number
  level: number
}

interface SavedMatch {
  shooter: EliteShooter
  votedAt: Date
}

// ============================================
// STORAGE HELPERS
// ============================================

const STORAGE_KEYS = {
  VOTE_STATS: 'shotiq_vote_stats',
  GAME_STATS: 'shotiq_game_stats',
  SAVED_MATCHES: 'shotiq_saved_matches',
  SEEN_SHOOTERS: 'shotiq_seen_shooters'
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
const XP_STREAK_BONUS = 5
const XP_PER_LEVEL = 100

const LEVEL_TITLES = [
  "Rookie Scout", "Junior Analyst", "Form Student", "Shooting Scholar",
  "Elite Evaluator", "Form Master", "Shot Doctor", "Shooting Guru",
  "Legend Spotter", "GOAT Identifier"
]

// Simulated community vote data (in production, this would come from a backend)
const generateCommunityVotes = (shooterId: number, tier: string): { score: number, pass: number } => {
  // Higher tier shooters get more "score" votes
  const tierBonus: Record<string, number> = {
    legendary: 85,
    elite: 75,
    great: 65,
    good: 55,
    mid_level: 45,
    bad: 30
  }
  const baseScore = tierBonus[tier] || 50
  // Add some variation based on shooter ID for consistency
  const variation = (shooterId % 20) - 10
  const scorePercent = Math.min(95, Math.max(15, baseScore + variation))
  return { score: scorePercent, pass: 100 - scorePercent }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

const filterShootersByBodyType = (shooters: EliteShooter[], userProfile: UserProfile): EliteShooter[] => {
  // Sort all shooters by tier then score - show best shooters first
  return [...shooters].sort((a, b) => {
    const tierOrder: Record<string, number> = { legendary: 0, elite: 1, great: 2, good: 3, mid_level: 4, bad: 5 }
    const tierDiff = tierOrder[a.tier] - tierOrder[b.tier]
    if (tierDiff !== 0) return tierDiff
    return b.overallScore - a.overallScore
  })
}

const formatHeight = (inches: number): string => {
  const feet = Math.floor(inches / 12)
  const remainingInches = inches % 12
  return `${feet}'${remainingInches}"`
}

// ============================================
// SUB-COMPONENTS
// ============================================

interface PlayerCardProps {
  shooter: EliteShooter
  onVote: (isScore: boolean) => void
  isRevealing: boolean
  voteResult?: { score: number, pass: number }
  userVote?: 'score' | 'pass'
  onDragChange?: (dragX: number) => void
}

function PlayerCard({ shooter, onVote, isRevealing, voteResult, userVote, onDragChange }: PlayerCardProps) {
  const [dragX, setDragXState] = useState(0)
  
  const setDragX = (value: number) => {
    setDragXState(value)
    if (onDragChange) onDragChange(value)
  }
  const [isDragging, setIsDragging] = useState(false)
  const startX = useRef(0)
  
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isRevealing) return
    startX.current = e.touches[0].clientX
    setIsDragging(true)
  }
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || isRevealing) return
    const currentX = e.touches[0].clientX
    const diff = currentX - startX.current
    setDragX(Math.max(-200, Math.min(200, diff)))
  }
  
  const handleTouchEnd = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > 100) {
      onVote(true) // Score
    } else if (dragX < -100) {
      onVote(false) // Pass
    }
    setDragX(0)
  }
  
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isRevealing) return
    startX.current = e.clientX
    setIsDragging(true)
  }
  
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || isRevealing) return
    const diff = e.clientX - startX.current
    setDragX(Math.max(-200, Math.min(200, diff)))
  }
  
  const handleMouseUp = () => {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > 100) {
      onVote(true) // Score
    } else if (dragX < -100) {
      onVote(false) // Pass
    }
    setDragX(0)
  }
  
  const tierColor = TIER_COLORS[shooter.tier]
  const rotation = (dragX / 200) * 25
  
  return (
    <div 
      className="cursor-grab active:cursor-grabbing select-none touch-none"
      style={{ 
        transform: `translateX(${dragX}px) rotate(${rotation}deg)`,
        transition: isDragging ? 'none' : 'transform 0.3s ease-out'
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Card Content */}
      <div 
        className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl overflow-hidden border-2 shadow-2xl transition-all duration-150"
        style={{
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
      >
        {/* Player Image Section */}
        <div className="relative h-[300px] bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] overflow-hidden">
          {shooter.photoUrl ? (
            <img 
              src={shooter.photoUrl} 
              alt={shooter.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Users className="w-24 h-24 text-[#3a3a3a]" />
            </div>
          )}
          
          {/* Tier Badge */}
          <div 
            className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-black uppercase"
            style={{ backgroundColor: tierColor, color: shooter.tier === 'elite' ? '#1a1a1a' : '#fff' }}
          >
            {TIER_LABELS[shooter.tier]}
          </div>
          
          {/* Overall Score Badge - Premium Design */}
          <div className="absolute top-3 right-3">
            <div className="relative">
              {/* Outer Glow Ring */}
              <div 
                className="absolute inset-0 rounded-2xl blur-md"
                style={{
                  background: shooter.overallScore >= 95 
                    ? 'linear-gradient(135deg, #FFD700, #FFA500)' 
                    : shooter.overallScore >= 85 
                      ? 'linear-gradient(135deg, #FF6B35, #FF4500)' 
                      : 'linear-gradient(135deg, #666, #444)',
                  opacity: 0.6
                }}
              />
              
              {/* Main Badge */}
              <div 
                className="relative px-3 py-2 rounded-2xl border-2 backdrop-blur-md"
                style={{
                  background: shooter.overallScore >= 95 
                    ? 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.2))' 
                    : shooter.overallScore >= 85 
                      ? 'linear-gradient(135deg, rgba(255,107,53,0.3), rgba(255,69,0,0.2))' 
                      : 'linear-gradient(135deg, rgba(100,100,100,0.3), rgba(68,68,68,0.2))',
                  borderColor: shooter.overallScore >= 95 
                    ? '#FFD700' 
                    : shooter.overallScore >= 85 
                      ? '#FF6B35' 
                      : '#666',
                  boxShadow: shooter.overallScore >= 95 
                    ? '0 4px 20px rgba(255,215,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                    : shooter.overallScore >= 85 
                      ? '0 4px 20px rgba(255,107,53,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' 
                      : '0 4px 20px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div className="text-center">
                  <span 
                    className="text-3xl font-black tracking-tight"
                    style={{
                      color: shooter.overallScore >= 95 ? '#FFD700' : shooter.overallScore >= 85 ? '#FF6B35' : '#999',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}
                  >
                    {shooter.overallScore}
                  </span>
                  <p 
                    className="text-[8px] font-bold uppercase tracking-widest -mt-1"
                    style={{ color: shooter.overallScore >= 95 ? '#FFD700' : shooter.overallScore >= 85 ? '#FF6B35' : '#888' }}
                  >
                    OVR
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Gradient Overlay */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
        </div>
        
        {/* Player Info */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="text-2xl font-black text-white tracking-tight">{shooter.name}</h3>
            <p className="text-[#888] text-sm">{shooter.team} • {POSITION_LABELS[shooter.position]}</p>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xs text-[#888] uppercase">Height</p>
              <p className="text-lg font-bold text-white">{formatHeight(shooter.height)}</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xs text-[#888] uppercase">Weight</p>
              <p className="text-lg font-bold text-white">{shooter.weight} lbs</p>
            </div>
            <div className="bg-[#1a1a1a] rounded-xl p-3 text-center">
              <p className="text-xs text-[#888] uppercase">3PT%</p>
              <p className="text-lg font-bold text-[#FF6B35]">{shooter.careerPct || '—'}%</p>
            </div>
          </div>
          
          {/* Body Type & Style */}
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full text-xs font-bold uppercase">
              {shooter.bodyType.replace('_', ' ')}
            </span>
            <span className="px-3 py-1 bg-[#2a2a2a] text-[#888] rounded-full text-xs">
              {shooter.shootingStyle.split(' ').slice(0, 3).join(' ')}...
            </span>
          </div>
          
          {/* Key Traits */}
          <div className="flex flex-wrap gap-1.5">
            {shooter.keyTraits.slice(0, 3).map((trait, i) => (
              <span key={i} className="px-2 py-1 bg-[#2a2a2a] text-[#E5E5E5] rounded-lg text-xs">
                {trait}
              </span>
            ))}
          </div>
        </div>
        
        {/* Vote Reveal Overlay - Enhanced Analytics Card */}
        {isRevealing && voteResult && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/90 to-black/95 backdrop-blur-lg flex flex-col items-center justify-center p-4 animate-fadeIn rounded-3xl overflow-hidden">
            {/* Animated Background Glow */}
            <div className={`absolute inset-0 opacity-30 ${
              userVote === 'score' 
                ? 'bg-gradient-to-br from-[#FF6B35]/40 via-transparent to-[#FF4500]/20' 
                : 'bg-gradient-to-br from-[#666]/40 via-transparent to-[#444]/20'
            }`} />
            
            {/* Floating Particles Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {userVote === 'score' && (
                <>
                  <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-[#FF6B35] rounded-full animate-ping opacity-60" />
                  <div className="absolute top-1/3 right-1/3 w-1.5 h-1.5 bg-[#FF4500] rounded-full animate-ping opacity-40 animation-delay-200" />
                  <div className="absolute bottom-1/3 left-1/3 w-1 h-1 bg-[#FF6B35] rounded-full animate-ping opacity-50 animation-delay-500" />
                </>
              )}
            </div>
            
            {/* Player Mini Info */}
            <div className="relative z-10 flex items-center gap-3 mb-4">
              {shooter.photoUrl && (
                <img 
                  src={shooter.photoUrl} 
                  alt={shooter.name}
                  className={`w-12 h-12 rounded-full object-cover border-2 ${
                    userVote === 'score' ? 'border-[#FF6B35]' : 'border-[#666]'
                  }`}
                />
              )}
              <div className="text-center">
                <p className="text-white font-bold text-sm">{shooter.name}</p>
                <p className={`text-xs font-bold uppercase tracking-wider ${
                  userVote === 'score' ? 'text-[#FF6B35]' : 'text-[#888]'
                }`}>
                  {userVote === 'score' ? '🔥 SCORED!' : '✕ PASSED'}
                </p>
              </div>
            </div>
            
            {/* Main Icon with Glow */}
            <div className="relative z-10 mb-3">
              <div className={`absolute inset-0 blur-xl ${
                userVote === 'score' ? 'bg-[#FF6B35]/50' : 'bg-[#666]/30'
              } rounded-full scale-150`} />
              <div className={`relative p-4 rounded-full ${
                userVote === 'score' 
                  ? 'bg-gradient-to-br from-[#FF6B35] to-[#FF4500] shadow-[0_0_30px_rgba(255,107,53,0.5)]' 
                  : 'bg-gradient-to-br from-[#555] to-[#333] shadow-[0_0_20px_rgba(100,100,100,0.3)]'
              }`}>
                {userVote === 'score' ? (
                  <Flame className="w-10 h-10 text-white animate-pulse" />
                ) : (
                  <X className="w-10 h-10 text-white" />
                )}
              </div>
            </div>
            
            {/* Analytics Card */}
            <div className="relative z-10 w-full max-w-[300px] bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] rounded-2xl p-4 border border-[#333] shadow-2xl">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#888]" />
                  <span className="text-[#888] text-xs font-medium uppercase tracking-wider">Community Stats</span>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 bg-[#2a2a2a] rounded-full">
                  <TrendingUp className="w-3 h-3 text-[#FF6B35]" />
                  <span className="text-[10px] text-[#888] font-medium">LIVE</span>
                </div>
              </div>
              
              {/* Score Progress */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                      <Flame className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-white font-bold text-sm">Score</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#FF6B35] font-black text-xl">{voteResult.score}%</span>
                  </div>
                </div>
                <div className="relative h-4 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#FF6B35] via-[#FF5722] to-[#FF4500] transition-all duration-1000 ease-out rounded-full"
                    style={{ width: `${voteResult.score}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent to-white/30 animate-pulse" />
                  </div>
                  {voteResult.score >= 70 && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <span className="text-[10px] text-white font-bold drop-shadow-lg">🔥</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pass Progress */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#666] to-[#444] flex items-center justify-center">
                      <X className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="text-[#999] font-bold text-sm">Pass</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#888] font-black text-xl">{voteResult.pass}%</span>
                  </div>
                </div>
                <div className="relative h-4 bg-[#2a2a2a] rounded-full overflow-hidden">
                  <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#666] to-[#555] transition-all duration-1000 delay-200 ease-out rounded-full"
                    style={{ width: `${voteResult.pass}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent" />
                  </div>
                </div>
              </div>
              
              {/* Fun Message Based on Vote */}
              <div className={`text-center p-2 rounded-xl ${
                userVote === 'score' 
                  ? 'bg-gradient-to-r from-[#FF6B35]/20 to-[#FF4500]/10 border border-[#FF6B35]/30' 
                  : 'bg-[#2a2a2a] border border-[#333]'
              }`}>
                {userVote === 'score' ? (
                  <p className="text-[#FF6B35] font-bold text-xs flex items-center justify-center gap-1.5">
                    <Heart className="w-3.5 h-3.5 animate-pulse" />
                    {voteResult.score >= 80 ? "Great pick! Fan favorite!" :
                     voteResult.score >= 60 ? "Added to your matches!" :
                     "Unique choice! Added!"}
                  </p>
                ) : (
                  <p className="text-[#888] text-xs">
                    {voteResult.pass >= 40 ? "Many agree with you!" : "Bold decision!"}
                  </p>
                )}
              </div>
            </div>
            
            {/* Tier Badge */}
            <div className={`relative z-10 mt-3 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
              shooter.tier === 'legendary' 
                ? 'bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white shadow-[0_0_15px_rgba(255,107,53,0.4)]' 
                : shooter.tier === 'elite'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.3)]'
                : 'bg-[#333] text-[#888]'
            }`}>
              {TIER_LABELS[shooter.tier] || shooter.tier?.toUpperCase()}
            </div>
          </div>
        )}
      </div>{/* End Card Content */}
    </div>
  )
}

interface LeaderboardProps {
  shooters: EliteShooter[]
  voteStats: VoteStats
}

function Leaderboard({ shooters, voteStats }: LeaderboardProps) {
  // Calculate scores and sort
  const rankedShooters = useMemo(() => {
    return shooters
      .map(shooter => {
        const userStats = voteStats[shooter.id]
        if (userStats) {
          const total = userStats.scoreCount + userStats.passCount
          const scorePercent = total > 0 ? (userStats.scoreCount / total) * 100 : 50
          return { shooter, scorePercent }
        }
        // Use simulated community votes
        const communityVotes = generateCommunityVotes(shooter.id, shooter.tier)
        return { shooter, scorePercent: communityVotes.score }
      })
      .sort((a, b) => b.scorePercent - a.scorePercent)
      .slice(0, 10)
  }, [shooters, voteStats])
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#FF6B35] flex items-center gap-2 mb-4">
        <Crown className="w-5 h-5" /> Top Rated Shooters
      </h3>
      
      {rankedShooters.map((item, index) => (
        <div
          key={item.shooter.id}
          className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${
            index === 0 ? 'bg-[#FFD700] text-black' :
            index === 1 ? 'bg-[#C0C0C0] text-black' :
            index === 2 ? 'bg-[#CD7F32] text-white' :
            'bg-[#2a2a2a] text-[#888]'
          }`}>
            {index + 1}
          </div>
          
          <div className="w-10 h-10 rounded-full bg-[#2a2a2a] overflow-hidden">
            {item.shooter.photoUrl ? (
              <img 
                src={item.shooter.photoUrl} 
                alt={item.shooter.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="w-full h-full p-2 text-[#3a3a3a]" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{item.shooter.name}</p>
            <p className="text-xs text-[#888]">{item.shooter.team}</p>
          </div>
          
          <div className="flex items-center gap-1 text-[#FF6B35] font-bold">
            <Flame className="w-4 h-4" />
            {Math.round(item.scorePercent)}%
          </div>
        </div>
      ))}
    </div>
  )
}

interface SavedMatchesProps {
  matches: SavedMatch[]
  onCompare: (shooter: EliteShooter) => void
  userAnalysis?: UserAnalysisData
}

function SavedMatches({ matches, onCompare, userAnalysis }: SavedMatchesProps) {
  const [selectedShooter, setSelectedShooter] = useState<EliteShooter | null>(null)
  const [showComparison, setShowComparison] = useState(false)
  
  if (matches.length === 0) {
    return (
      <div className="text-center py-8 text-[#888]">
        <Heart className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No saved matches yet</p>
        <p className="text-sm">Swipe right on shooters to save them!</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-bold text-[#FF6B35] flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5" /> Your Saved Matches ({matches.length})
      </h3>
      
      {matches.map((match, index) => (
        <div
          key={match.shooter.id}
          className="flex items-center gap-3 bg-[#1a1a1a] rounded-xl p-3"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <div className="w-12 h-12 rounded-xl bg-[#2a2a2a] overflow-hidden">
            {match.shooter.photoUrl ? (
              <img 
                src={match.shooter.photoUrl} 
                alt={match.shooter.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Users className="w-full h-full p-2 text-[#3a3a3a]" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white truncate">{match.shooter.name}</p>
            <div className="flex items-center gap-2">
              <span 
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: TIER_COLORS[match.shooter.tier] + '30',
                  color: TIER_COLORS[match.shooter.tier]
                }}
              >
                {TIER_LABELS[match.shooter.tier]}
              </span>
              <span className="text-xs text-[#888]">{match.shooter.bodyType}</span>
            </div>
          </div>
          
          <button
            onClick={() => setSelectedShooter(match.shooter)}
            className="px-3 py-2 bg-[#FF6B35] hover:bg-[#FF4500] text-white rounded-lg text-sm font-russo transition-colors flex items-center gap-1"
          >
            <Target className="w-4 h-4" />
            Study
          </button>
        </div>
      ))}
      
      {/* Shooter Detail Modal */}
      {selectedShooter && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedShooter(null)}
        >
          <div 
            className="bg-[#1a1a1a] rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-[#3a3a3a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image */}
            <div className="relative h-48 bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
              {selectedShooter.photoUrl ? (
                <img 
                  src={selectedShooter.photoUrl} 
                  alt={selectedShooter.name}
                  className="w-full h-full object-cover object-top"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-20 h-20 text-[#3a3a3a]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] to-transparent" />
              
              {/* Close Button */}
              <button
                onClick={() => setSelectedShooter(null)}
                className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70"
              >
                <X className="w-5 h-5" />
              </button>
              
              {/* Tier Badge */}
              <div 
                className="absolute bottom-4 left-4 px-3 py-1 rounded-full text-xs font-black uppercase"
                style={{ backgroundColor: TIER_COLORS[selectedShooter.tier] }}
              >
                {TIER_LABELS[selectedShooter.tier]}
              </div>
            </div>
            
            {/* Content */}
            <div className="p-5 space-y-4">
              <div>
                <h3 className="text-2xl font-black text-white">{selectedShooter.name}</h3>
                <p className="text-[#888]">{selectedShooter.team}</p>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-[#2a2a2a] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#888] uppercase">Height</p>
                  <p className="text-lg font-bold text-white">{Math.floor(selectedShooter.height/12)}'{selectedShooter.height%12}"</p>
                </div>
                <div className="bg-[#2a2a2a] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#888] uppercase">Weight</p>
                  <p className="text-lg font-bold text-white">{selectedShooter.weight} lbs</p>
                </div>
                <div className="bg-[#2a2a2a] rounded-xl p-3 text-center">
                  <p className="text-xs text-[#888] uppercase">3PT%</p>
                  <p className="text-lg font-bold text-[#FF6B35]">{selectedShooter.careerPct || '—'}%</p>
                </div>
              </div>
              
              {/* Biomechanics */}
              <div className="bg-[#2a2a2a] rounded-xl p-4">
                <h4 className="text-sm font-bold text-[#FF6B35] mb-3 uppercase">Shooting Form Metrics</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#888]">Elbow Angle</span>
                    <span className="text-white font-bold">{selectedShooter.measurements.elbowAngle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Knee Angle</span>
                    <span className="text-white font-bold">{selectedShooter.measurements.kneeAngle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Release Angle</span>
                    <span className="text-white font-bold">{selectedShooter.measurements.releaseAngle}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#888]">Release Height</span>
                    <span className="text-white font-bold">{selectedShooter.measurements.releaseHeight}"</span>
                  </div>
                </div>
              </div>
              
              {/* Shooting Style */}
              <div>
                <h4 className="text-sm font-bold text-[#FF6B35] mb-2 uppercase">Shooting Style</h4>
                <p className="text-[#E5E5E5] text-sm">{selectedShooter.shootingStyle}</p>
              </div>
              
              {/* Key Traits */}
              <div>
                <h4 className="text-sm font-bold text-[#FF6B35] mb-2 uppercase">Key Traits</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedShooter.keyTraits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setShowComparison(true)
                  }}
                  className="flex-1 py-3 bg-[#FF6B35] hover:bg-[#FF4500] text-white rounded-xl font-russo transition-colors"
                >
                  Compare to My Form
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Comparison Modal */}
      {showComparison && selectedShooter && (
        <div 
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[60] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowComparison(false)}
        >
          <div 
            className="bg-[#1a1a1a] rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto border border-[#3a3a3a]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-[#1a1a1a] border-b border-[#3a3a3a] p-4 flex items-center justify-between z-10">
              <h3 className="text-xl font-black text-[#FF6B35]">FORM COMPARISON</h3>
              <button
                onClick={() => setShowComparison(false)}
                className="w-8 h-8 bg-[#2a2a2a] rounded-full flex items-center justify-center text-white hover:bg-[#3a3a3a]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Comparison Content */}
            <div className="p-4 md:p-6">
              {/* Side by Side Images */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Your Form */}
                <div className="bg-[#2a2a2a] rounded-xl p-4">
                  <h4 className="text-center text-sm font-bold text-[#4A90D9] mb-3 uppercase">Your Form</h4>
                  <div className="relative aspect-[3/4] bg-[#1a1a1a] rounded-lg overflow-hidden">
                    {userAnalysis?.imageUrl ? (
                      <img 
                        src={userAnalysis.imageUrl} 
                        alt="Your shooting form"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#888]">
                        <div className="text-center">
                          <Users className="w-16 h-16 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Upload an image to compare</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {userAnalysis?.overallScore && (
                    <div className="mt-3 text-center">
                      <span className="text-2xl font-black text-[#4A90D9]">{userAnalysis.overallScore}</span>
                      <span className="text-[#888] text-sm ml-1">/ 100</span>
                    </div>
                  )}
                </div>
                
                {/* Pro Form */}
                <div className="bg-[#2a2a2a] rounded-xl p-4">
                  <h4 className="text-center text-sm font-bold text-[#FF6B35] mb-3 uppercase">{selectedShooter.name}</h4>
                  <div className="relative aspect-[3/4] bg-[#1a1a1a] rounded-lg overflow-hidden">
                    {selectedShooter.photoUrl ? (
                      <img 
                        src={selectedShooter.photoUrl} 
                        alt={selectedShooter.name}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Users className="w-16 h-16 text-[#3a3a3a]" />
                      </div>
                    )}
                  </div>
                  <div className="mt-3 text-center">
                    <span className="text-2xl font-black text-[#FF6B35]">{selectedShooter.overallScore}</span>
                    <span className="text-[#888] text-sm ml-1">/ 100</span>
                  </div>
                </div>
              </div>
              
              {/* Angle Comparison Table */}
              <div className="bg-[#2a2a2a] rounded-xl p-4">
                <h4 className="text-sm font-bold text-white mb-4 uppercase flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  Shooting Form Metrics Comparison
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Elbow Angle', userKey: 'elbowAngle', proKey: 'elbowAngle', ideal: '85-95°' },
                    { label: 'Knee Angle', userKey: 'kneeAngle', proKey: 'kneeAngle', ideal: '140-160°' },
                    { label: 'Shoulder Angle', userKey: 'shoulderAngle', proKey: 'shoulderAngle', ideal: '165-175°' },
                    { label: 'Hip Angle', userKey: 'hipAngle', proKey: 'hipAngle', ideal: '170-180°' },
                    { label: 'Release Angle', userKey: 'releaseAngle', proKey: 'releaseAngle', ideal: '45-52°' },
                  ].map((metric) => {
                    const userValue = userAnalysis?.angles?.[metric.userKey as keyof typeof userAnalysis.angles]
                    const proValue = selectedShooter.measurements[metric.proKey as keyof typeof selectedShooter.measurements]
                    const diff = userValue && proValue ? Math.abs(userValue - proValue) : null
                    
                    return (
                      <div key={metric.label} className="flex items-center gap-3 bg-[#1a1a1a] rounded-lg p-3">
                        <div className="flex-1">
                          <p className="text-[#888] text-xs uppercase">{metric.label}</p>
                          <p className="text-[#666] text-xs">Ideal: {metric.ideal}</p>
                        </div>
                        <div className="text-center px-3">
                          <p className="text-xs text-[#4A90D9] uppercase">You</p>
                          <p className="text-lg font-bold text-white">
                            {userValue ? `${userValue}°` : '—'}
                          </p>
                        </div>
                        <div className="text-center px-3">
                          <p className="text-xs text-[#FF6B35] uppercase">Pro</p>
                          <p className="text-lg font-bold text-white">
                            {proValue ? `${proValue}°` : '—'}
                          </p>
                        </div>
                        <div className="w-20 text-center">
                          {diff !== null ? (
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              diff <= 5 ? 'bg-green-500/20 text-green-400' :
                              diff <= 10 ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {diff <= 5 ? '✓ Close' : diff <= 10 ? `${diff}° off` : `${diff}° off`}
                            </span>
                          ) : (
                            <span className="text-[#666] text-xs">—</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              {/* Pro Tips */}
              <div className="mt-4 bg-gradient-to-r from-[#FF6B35]/10 to-transparent rounded-xl p-4 border border-[#FF6B35]/30">
                <h4 className="text-sm font-bold text-[#FF6B35] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Learn from {selectedShooter.name}
                </h4>
                <p className="text-[#E5E5E5] text-sm mb-3">{selectedShooter.shootingStyle}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedShooter.keyTraits.map((trait, i) => (
                    <span key={i} className="px-3 py-1 bg-[#FF6B35]/20 text-[#FF6B35] rounded-full text-xs">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Close Button */}
              <div className="mt-6 flex justify-center">
                <button
                  onClick={() => setShowComparison(false)}
                  className="px-8 py-3 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-xl font-russo transition-colors"
                >
                  Close Comparison
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

interface GameStatsDisplayProps {
  stats: GameStats
}

function GameStatsDisplay({ stats }: GameStatsDisplayProps) {
  const levelTitle = LEVEL_TITLES[Math.min(stats.level, LEVEL_TITLES.length - 1)]
  const xpToNextLevel = XP_PER_LEVEL - (stats.xp % XP_PER_LEVEL)
  const xpProgress = ((stats.xp % XP_PER_LEVEL) / XP_PER_LEVEL) * 100
  
  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] rounded-2xl p-4 border border-[#3a3a3a]">
      {/* Level & XP */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
          <span className="text-2xl font-black text-white">{stats.level}</span>
        </div>
        <div className="flex-1">
          <p className="font-bold text-white">{levelTitle}</p>
          <p className="text-xs text-[#888]">{xpToNextLevel} XP to next level</p>
          <div className="h-2 bg-[#2a2a2a] rounded-full mt-1 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] transition-all duration-300"
              style={{ width: `${xpProgress}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-[#2a2a2a] rounded-xl p-2 text-center">
          <Zap className="w-5 h-5 text-[#FFD700] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.currentStreak}</p>
          <p className="text-[10px] text-[#888] uppercase">Streak</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-xl p-2 text-center">
          <Trophy className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.bestStreak}</p>
          <p className="text-[10px] text-[#888] uppercase">Best</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-xl p-2 text-center">
          <Flame className="w-5 h-5 text-[#FF6B35] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.scoreCount}</p>
          <p className="text-[10px] text-[#888] uppercase">Scores</p>
        </div>
        <div className="bg-[#2a2a2a] rounded-xl p-2 text-center">
          <Target className="w-5 h-5 text-[#888] mx-auto mb-1" />
          <p className="text-lg font-bold text-white">{stats.totalVotes}</p>
          <p className="text-[10px] text-[#888] uppercase">Total</p>
        </div>
      </div>
    </div>
  )
}

// ============================================
// MAIN COMPONENT
// ============================================

interface UserAnalysisData {
  imageUrl?: string
  angles?: {
    elbowAngle?: number
    kneeAngle?: number
    shoulderAngle?: number
    hipAngle?: number
    releaseAngle?: number
  }
  overallScore?: number
}

interface ScoreOrPassGameProps {
  userProfile?: UserProfile
  userAnalysis?: UserAnalysisData
  onSelectShooterForComparison?: (shooter: EliteShooter) => void
}

// Filter interfaces
interface ShooterFilters {
  league: 'all' | 'NBA' | 'WNBA' | 'NCAA_MEN' | 'NCAA_WOMEN' | 'TOP_COLLEGE'
  tier: 'all' | 'legendary' | 'elite' | 'great' | 'good' | 'mid_level' | 'bad'
  position: 'all' | 'POINT_GUARD' | 'SHOOTING_GUARD' | 'SMALL_FORWARD' | 'POWER_FORWARD' | 'CENTER' | 'GUARD' | 'FORWARD'
}

const LEAGUE_OPTIONS = [
  { value: 'all', label: 'All Leagues' },
  { value: 'NBA', label: 'NBA' },
  { value: 'WNBA', label: 'WNBA' },
  { value: 'NCAA_MEN', label: 'NCAA Men' },
  { value: 'NCAA_WOMEN', label: 'NCAA Women' },
  { value: 'TOP_COLLEGE', label: 'College Stars' },
]

const TIER_OPTIONS = [
  { value: 'all', label: 'All Tiers' },
  { value: 'legendary', label: 'Legendary' },
  { value: 'elite', label: 'Elite' },
  { value: 'great', label: 'Great' },
  { value: 'good', label: 'Good' },
  { value: 'mid_level', label: 'Mid-Level' },
  { value: 'bad', label: 'Bad' },
]

const POSITION_OPTIONS = [
  { value: 'all', label: 'All Positions' },
  { value: 'POINT_GUARD', label: 'Point Guard' },
  { value: 'SHOOTING_GUARD', label: 'Shooting Guard' },
  { value: 'SMALL_FORWARD', label: 'Small Forward' },
  { value: 'POWER_FORWARD', label: 'Power Forward' },
  { value: 'CENTER', label: 'Center' },
]

export function ScoreOrPassGame({ userProfile = {}, userAnalysis, onSelectShooterForComparison }: ScoreOrPassGameProps) {
  // State
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'matches'>('game')
  const [dragX, setDragX] = useState(0) // Track drag state for button styling
  const [currentIndex, setCurrentIndex] = useState(0)
  const [arrowTop, setArrowTop] = useState(50)
  const mainCardRef = useRef<HTMLDivElement>(null)
  const [isRevealing, setIsRevealing] = useState(false)
  const [lastVote, setLastVote] = useState<'score' | 'pass' | null>(null)
  const [voteResult, setVoteResult] = useState<{ score: number, pass: number } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
  // Filter State
  const [showFilterPanel, setShowFilterPanel] = useState(false)
  const [filters, setFilters] = useState<ShooterFilters>({
    league: 'all',
    tier: 'all',
    position: 'all'
  })
  
  // Persisted state - initialize with defaults, load from storage after hydration
  const [voteStats, setVoteStats] = useState<VoteStats>({})
  const [gameStats, setGameStats] = useState<GameStats>({
    totalVotes: 0,
    scoreCount: 0,
    passCount: 0,
    currentStreak: 0,
    bestStreak: 0,
    xp: 0,
    level: 1
  })
  const [savedMatches, setSavedMatches] = useState<SavedMatch[]>([])
  const [seenShooters, setSeenShooters] = useState<number[]>([])
  
  // Track scroll to position arrows within card bounds
  useEffect(() => {
    const handleScroll = () => {
      if (!mainCardRef.current) return
      const cardRect = mainCardRef.current.getBoundingClientRect()
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
  
  // Hydrate from localStorage on mount
  useEffect(() => {
    const loadedVoteStats = loadFromStorage(STORAGE_KEYS.VOTE_STATS, {})
    const loadedGameStats = loadFromStorage(STORAGE_KEYS.GAME_STATS, {
      totalVotes: 0,
      scoreCount: 0,
      passCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      xp: 0,
      level: 1
    })
    const loadedSavedMatches = loadFromStorage(STORAGE_KEYS.SAVED_MATCHES, [])
    const loadedSeenShooters = loadFromStorage(STORAGE_KEYS.SEEN_SHOOTERS, [])
    
    // If all shooters have been seen, reset to start fresh
    if (loadedSeenShooters.length >= ALL_ELITE_SHOOTERS.length) {
      setSeenShooters([])
      setCurrentIndex(0)
    } else {
      setSeenShooters(loadedSeenShooters)
    }
    
    setVoteStats(loadedVoteStats)
    setGameStats(loadedGameStats)
    setSavedMatches(loadedSavedMatches)
    setIsHydrated(true)
  }, [])
  
  // Filter shooters based on user profile AND filters
  const matchedShooters = useMemo(() => {
    if (!isHydrated) return []
    let filtered = filterShootersByBodyType(ALL_ELITE_SHOOTERS, userProfile)
    
    // Apply league filter
    if (filters.league !== 'all') {
      filtered = filtered.filter(s => s.league === filters.league)
    }
    
    // Apply tier filter
    if (filters.tier !== 'all') {
      filtered = filtered.filter(s => s.tier === filters.tier)
    }
    
    // Apply position filter
    if (filters.position !== 'all') {
      filtered = filtered.filter(s => s.position === filters.position)
    }
    
    // Filter out already seen shooters
    const unseen = filtered.filter(s => !seenShooters.includes(s.id))
    return unseen.length > 0 ? unseen : filtered // Reset if all seen
  }, [userProfile, seenShooters, isHydrated, filters])
  
  // Active filter count
  const activeFilterCount = [
    filters.league !== 'all',
    filters.tier !== 'all',
    filters.position !== 'all'
  ].filter(Boolean).length
  
  // Get filter summary text
  const getFilterSummary = () => {
    const parts: string[] = []
    if (filters.league !== 'all') {
      parts.push(LEAGUE_OPTIONS.find(o => o.value === filters.league)?.label || filters.league)
    }
    if (filters.tier !== 'all') {
      parts.push(TIER_OPTIONS.find(o => o.value === filters.tier)?.label || filters.tier)
    }
    if (filters.position !== 'all') {
      parts.push(POSITION_OPTIONS.find(o => o.value === filters.position)?.label || filters.position)
    }
    return parts.length > 0 ? parts.join(' • ') : 'All Shooters'
  }
  
  // Reset filters
  const resetFilters = () => {
    setFilters({ league: 'all', tier: 'all', position: 'all' })
    setCurrentIndex(0)
  }
  
  // currentShooter - show null when all have been seen (to trigger "All Caught Up")
  const currentShooter = (matchedShooters.length > 0 && currentIndex < matchedShooters.length) 
    ? matchedShooters[currentIndex] 
    : null
  
  // Save to localStorage when state changes
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.VOTE_STATS, voteStats)
  }, [voteStats])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GAME_STATS, gameStats)
  }, [gameStats])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SAVED_MATCHES, savedMatches)
  }, [savedMatches])
  
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.SEEN_SHOOTERS, seenShooters)
  }, [seenShooters])
  
  // Handle vote
  const handleVote = useCallback((isScore: boolean) => {
    if (!currentShooter || isRevealing) return
    
    const voteType = isScore ? 'score' : 'pass'
    setLastVote(voteType)
    
    // Get/generate community votes
    const communityVotes = generateCommunityVotes(currentShooter.id, currentShooter.tier)
    setVoteResult(communityVotes)
    
    // Update vote stats
    setVoteStats(prev => ({
      ...prev,
      [currentShooter.id]: {
        scoreCount: (prev[currentShooter.id]?.scoreCount || 0) + (isScore ? 1 : 0),
        passCount: (prev[currentShooter.id]?.passCount || 0) + (isScore ? 0 : 1)
      }
    }))
    
    // Update game stats
    setGameStats(prev => {
      const newXp = prev.xp + XP_PER_VOTE + (isScore ? XP_STREAK_BONUS : 0)
      const newLevel = Math.floor(newXp / XP_PER_LEVEL) + 1
      const newStreak = isScore ? prev.currentStreak + 1 : 0
      
      return {
        totalVotes: prev.totalVotes + 1,
        scoreCount: prev.scoreCount + (isScore ? 1 : 0),
        passCount: prev.passCount + (isScore ? 0 : 1),
        currentStreak: newStreak,
        bestStreak: Math.max(prev.bestStreak, newStreak),
        xp: newXp,
        level: newLevel
      }
    })
    
    // Save match if scored
    if (isScore) {
      setSavedMatches(prev => {
        // Avoid duplicates
        if (prev.some(m => m.shooter.id === currentShooter.id)) return prev
        return [...prev, { shooter: currentShooter, votedAt: new Date() }]
      })
    }
    
    // Mark as seen
    setSeenShooters(prev => [...prev, currentShooter.id])
    
    // Show reveal
    setIsRevealing(true)
    
    // Move to next card after delay
    setTimeout(() => {
      setIsRevealing(false)
      setLastVote(null)
      setVoteResult(null)
      const nextIndex = currentIndex + 1
      if (nextIndex >= matchedShooters.length) {
        setCurrentIndex(matchedShooters.length) // Force past the end to trigger "All Caught Up"
      } else {
        setCurrentIndex(nextIndex)
      }
    }, 2000)
  }, [currentShooter, isRevealing, matchedShooters.length])
  
  // Reset game - forces a fresh start
  const handleReset = useCallback(() => {
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.SEEN_SHOOTERS)
    }
    // Reset state
    setSeenShooters([])
    setCurrentIndex(0)
  }, [])
  
  // Handle compare
  const handleCompare = useCallback((shooter: EliteShooter) => {
    if (onSelectShooterForComparison) {
      onSelectShooterForComparison(shooter)
    }
  }, [onSelectShooterForComparison])
  
  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-[600px] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-[#888] text-sm">Loading game...</p>
      </div>
    )
  }
  
  return (
    <div className="min-h-[600px] flex flex-col">
      {/* Header - Matching WorkoutOrPass Design */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-white font-bold text-xl tracking-tight">Discover Shooters</h2>
            <p className="text-[#666] text-sm">Swipe to find your perfect match</p>
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
                <Flame className="w-3.5 h-3.5 text-green-500" />
                <span className="text-white font-bold text-sm">{gameStats.scoreCount}</span>
              </div>
              <span className="text-[#555] text-[10px]">Scores</span>
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

      {/* Tab Navigation - Matching WorkoutOrPass Design */}
      <div className="relative flex p-1 mb-4 bg-[#111] rounded-2xl border border-[#222]">
        {/* Active Tab Indicator */}
        <div 
          className="absolute top-1 bottom-1 bg-gradient-to-r from-[#FF6B35] to-[#FF8555] rounded-xl transition-all duration-300 ease-out shadow-lg shadow-[#FF6B35]/20"
          style={{
            width: 'calc(33.333% - 4px)',
            left: activeTab === 'game' ? '4px' : activeTab === 'leaderboard' ? 'calc(33.333% + 2px)' : 'calc(66.666%)',
          }}
        />
        {[
          { id: 'game', label: 'Discover', icon: Sparkles },
          { id: 'leaderboard', label: 'Rankings', icon: TrendingUp },
          { id: 'matches', label: 'Saved', icon: Heart }
        ].map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as 'game' | 'leaderboard' | 'matches')}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
              activeTab === tab.id
                ? 'text-white'
                : 'text-[#666] hover:text-[#999]'
            }`}
          >
            <tab.icon className={`w-4 h-4 transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`} />
            <span>{tab.label}</span>
            {tab.id === 'matches' && savedMatches.length > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs">{savedMatches.length}</span>
            )}
          </button>
        ))}
      </div>
      
      {/* Filter Button Card */}
      <button
        type="button"
        onClick={() => setShowFilterPanel(true)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 mb-4 bg-[#1a1a1a] border border-[#333] rounded-xl text-white hover:border-[#FF6B35]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B35]/20 flex items-center justify-center relative">
            <SlidersHorizontal className="w-4 h-4 text-[#FF6B35]" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FF6B35] text-white text-[10px] font-bold flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-xs text-[#888]">Filters</p>
            <p className="text-sm font-semibold text-white truncate">{getFilterSummary()}</p>
          </div>
        </div>
        <ChevronDown className="w-5 h-5 text-[#888] flex-shrink-0" />
      </button>
      
      {/* Content */}
      <div className="flex-1">
        {activeTab === 'game' && (
          <div className="relative">
            {currentShooter ? (
              <>
                {/* Card with Side Glow Effects */}
                <div className="relative" ref={mainCardRef}>
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
                      <path d="M32 5 L5 35 L32 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                      <path d="M50 5 L23 35 L50 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="1" className="transition-all duration-150" />
                      <path d="M18 5 L-9 35 L18 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                      <path d="M36 5 L9 35 L36 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" className="transition-all duration-150" />
                      <path d="M46 5 L19 35 L46 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
                      <path d="M64 5 L37 35 L64 65" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" className="transition-all duration-150" />
                    </svg>
                    <svg width="100" height="40" viewBox="0 0 100 40" className="-ml-2">
                      <text x="50" y="30" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="Arial Black, sans-serif" fill="none" stroke={dragX < -20 ? "#ef4444" : "white"} strokeWidth="1.5" letterSpacing="3" className="transition-all duration-150">SWIPE</text>
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
                
                  {/* Left Side - Pass (Red) Glow */}
                  <div 
                    className="absolute left-0 top-0 bottom-0 w-24 pointer-events-none z-10 rounded-l-3xl overflow-hidden transition-opacity duration-150"
                    style={{
                      opacity: dragX < 0 ? Math.min(1, Math.abs(dragX) / 100) : 0,
                      background: `linear-gradient(to right, rgba(239, 68, 68, ${Math.min(0.9, Math.abs(dragX) / 80)}) 0%, transparent 100%)`,
                    }}
                  >
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
                  
                  {/* Right Side - Score (Orange) Glow */}
                  <div 
                    className="absolute right-0 top-0 bottom-0 w-24 pointer-events-none z-10 rounded-r-3xl overflow-hidden transition-opacity duration-150"
                    style={{
                      opacity: dragX > 0 ? Math.min(1, dragX / 100) : 0,
                      background: `linear-gradient(to left, rgba(255, 107, 53, ${Math.min(0.9, dragX / 80)}) 0%, transparent 100%)`,
                    }}
                  >
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
                  
                  <PlayerCard
                    key={currentShooter.id}
                    shooter={currentShooter}
                    onVote={handleVote}
                    isRevealing={isRevealing}
                    voteResult={voteResult || undefined}
                    userVote={lastVote || undefined}
                    onDragChange={setDragX}
                  />
                </div>
                
                {/* Swipe Hint - Animated */}
                <div className="flex items-center justify-center gap-3 mt-4 mb-2">
                  <svg className="w-4 h-4 text-[#555] animate-[bounce-left_1.5s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#555] animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M7 16V4M7 4L3 8M7 4L11 8M17 8v12M17 20l4-4M17 20l-4-4" />
                    </svg>
                    <span className="text-[#555] text-[10px] font-medium uppercase tracking-widest">Swipe or Tap</span>
                  </div>
                  <svg className="w-4 h-4 text-[#555] animate-[bounce-right_1.5s_ease-in-out_infinite]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </div>

                {/* Action Buttons - PASS and SCORE */}
                <div className="flex items-center justify-between gap-3 px-2">
                  {/* PASS Button */}
                  <button
                    type="button"
                    onClick={() => handleVote(false)}
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
                    <svg className="w-4 h-4 transition-colors duration-300" style={{ color: dragX < -60 ? 'white' : `rgba(248, 113, 113, ${dragX < -30 ? 1 : 0.4})` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="15,18 9,12 15,6" />
                    </svg>
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
                  
                  {/* SCORE Button */}
                  <button
                    type="button"
                    onClick={() => handleVote(true)}
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
                      Score
                    </span>
                    <Flame 
                      className="w-5 h-5 transition-colors duration-300"
                      style={{ color: dragX > 60 ? 'white' : `rgba(255, 107, 53, ${dragX > 30 ? 1 : 0.5})` }}
                    />
                    <svg className="w-4 h-4 transition-colors duration-300" style={{ color: dragX > 60 ? 'white' : `rgba(255, 107, 53, ${dragX > 30 ? 1 : 0.4})` }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9,18 15,12 9,6" />
                    </svg>
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
                    {currentIndex + 1} of {matchedShooters.length} shooters
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Medal className="w-16 h-16 text-[#FF6B35] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                <p className="text-[#888] mb-4">You&apos;ve rated all matching shooters</p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold rounded-xl flex items-center gap-2 mx-auto whitespace-nowrap"
                >
                  <RotateCcw className="w-5 h-5" />
                  Restart
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'leaderboard' && (
          <Leaderboard shooters={ALL_ELITE_SHOOTERS} voteStats={voteStats} />
        )}
        
        {activeTab === 'matches' && (
          <SavedMatches matches={savedMatches} onCompare={handleCompare} userAnalysis={userAnalysis} />
        )}
      </div>
      
      {/* Filter Panel Overlay */}
      {showFilterPanel && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center">
          <div className="bg-[#1a1a1a] w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[85vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#333]">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Filter className="w-5 h-5 text-[#FF6B35]" />
                Filter Shooters
              </h2>
              <div className="flex items-center gap-2">
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-sm text-[#FF6B35] hover:text-[#FF8B55] transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowFilterPanel(false)}
                  className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center text-[#888] hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Filters */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* League */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FF6B35]" />
                  League
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {LEAGUE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFilters(f => ({ ...f, league: option.value as ShooterFilters['league'] }))
                        setCurrentIndex(0)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.league === option.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Tier */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Crown className="w-4 h-4 text-[#FF6B35]" />
                  Tier
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {TIER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFilters(f => ({ ...f, tier: option.value as ShooterFilters['tier'] }))
                        setCurrentIndex(0)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.tier === option.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Position */}
              <div>
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-[#FF6B35]" />
                  Position
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {POSITION_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setFilters(f => ({ ...f, position: option.value as ShooterFilters['position'] }))
                        setCurrentIndex(0)
                      }}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        filters.position === option.value
                          ? 'bg-[#FF6B35] text-white'
                          : 'bg-[#252525] text-[#888] hover:bg-[#333] hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#333] bg-[#151515]">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[#888]">Matching Shooters</span>
                <span className="text-sm font-bold text-[#FF6B35]">{matchedShooters.length}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowFilterPanel(false)}
                className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF4500] text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ScoreOrPassGame

