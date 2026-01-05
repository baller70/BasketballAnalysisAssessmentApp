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
  Flame, X, Trophy, Zap, Target, 
  Crown, TrendingUp, Users,
  Sparkles, Medal, RotateCcw, Heart
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
}

function PlayerCard({ shooter, onVote, isRevealing, voteResult, userVote }: PlayerCardProps) {
  const [dragX, setDragX] = useState(0)
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
  const scoreOpacity = Math.max(0, dragX / 100)
  const passOpacity = Math.max(0, -dragX / 100)
  
  return (
    <div
      className="absolute w-full max-w-[340px] mx-auto cursor-grab active:cursor-grabbing select-none"
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
      {/* Swipe Indicators */}
      <div 
        className="absolute top-8 right-8 z-20 bg-[#FF6B35] rounded-xl px-4 py-2 border-4 border-[#FF6B35] pointer-events-none"
        style={{ opacity: scoreOpacity, transition: 'opacity 0.1s' }}
      >
        <span className="text-2xl font-black text-white flex items-center gap-2">
          <Flame className="w-6 h-6" /> SCORE
        </span>
      </div>
      
      <div 
        className="absolute top-8 left-8 z-20 bg-[#888] rounded-xl px-4 py-2 border-4 border-[#888] pointer-events-none"
        style={{ opacity: passOpacity, transition: 'opacity 0.1s' }}
      >
        <span className="text-2xl font-black text-white flex items-center gap-2">
          <X className="w-6 h-6" /> PASS
        </span>
      </div>
      
      {/* Card Content */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] rounded-3xl overflow-hidden border-2 border-[#3a3a3a] shadow-2xl">
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
          
          {/* Overall Score */}
          <div className="absolute top-4 right-4 bg-black/70 backdrop-blur-sm rounded-full w-14 h-14 flex items-center justify-center">
            <span className="text-xl font-black text-[#FF6B35]">{shooter.overallScore}</span>
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
        
        {/* Vote Reveal Overlay */}
        {isRevealing && voteResult && (
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-fadeIn rounded-3xl">
            <div className="animate-bounce">
              {userVote === 'score' ? (
                <Flame className="w-20 h-20 text-[#FF6B35] mb-4" />
              ) : (
                <X className="w-20 h-20 text-[#888] mb-4" />
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white mb-6">Community Votes</h3>
            
            {/* Score Bar */}
            <div className="w-full max-w-[280px] mb-3">
              <div className="flex justify-between mb-1">
                <span className="text-[#FF6B35] font-bold flex items-center gap-1">
                  <Flame className="w-4 h-4" /> Score
                </span>
                <span className="text-[#FF6B35] font-bold">{voteResult.score}%</span>
              </div>
              <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] transition-all duration-700"
                  style={{ width: `${voteResult.score}%` }}
                />
              </div>
            </div>
            
            {/* Pass Bar */}
            <div className="w-full max-w-[280px]">
              <div className="flex justify-between mb-1">
                <span className="text-[#888] font-bold flex items-center gap-1">
                  <X className="w-4 h-4" /> Pass
                </span>
                <span className="text-[#888] font-bold">{voteResult.pass}%</span>
              </div>
              <div className="h-3 bg-[#2a2a2a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#666] transition-all duration-700 delay-200"
                  style={{ width: `${voteResult.pass}%` }}
                />
              </div>
            </div>
            
            {userVote === 'score' && (
              <p className="mt-6 text-[#FF6B35] font-bold flex items-center gap-2 animate-pulse">
                <Heart className="w-5 h-5" /> Added to Your Matches!
              </p>
            )}
          </div>
        )}
      </div>
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

export function ScoreOrPassGame({ userProfile = {}, userAnalysis, onSelectShooterForComparison }: ScoreOrPassGameProps) {
  // State
  const [activeTab, setActiveTab] = useState<'game' | 'leaderboard' | 'matches'>('game')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isRevealing, setIsRevealing] = useState(false)
  const [lastVote, setLastVote] = useState<'score' | 'pass' | null>(null)
  const [voteResult, setVoteResult] = useState<{ score: number, pass: number } | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  
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
  
  // Filter shooters based on user profile
  const matchedShooters = useMemo(() => {
    if (!isHydrated) return []
    const filtered = filterShootersByBodyType(ALL_ELITE_SHOOTERS, userProfile)
    // Filter out already seen shooters
    const unseen = filtered.filter(s => !seenShooters.includes(s.id))
    return unseen.length > 0 ? unseen : filtered // Reset if all seen
  }, [userProfile, seenShooters, isHydrated])
  
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
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#FF6B35] to-[#FFD700] uppercase tracking-wider">
          Score or Pass
        </h2>
        <p className="text-[#888] text-sm mt-1">Basketball Elite Shooter Edition</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex gap-2 mb-6 px-2">
        <button
          onClick={() => setActiveTab('game')}
          className={`flex-1 py-3 rounded-xl font-russo text-sm uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === 'game'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-[#2a2a2a] text-[#888] hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span className="hidden sm:inline">Play</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex-1 py-3 rounded-xl font-russo text-sm uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === 'leaderboard'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-[#2a2a2a] text-[#888] hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span className="hidden sm:inline">Rankings</span>
        </button>
        <button
          onClick={() => setActiveTab('matches')}
          className={`flex-1 py-3 rounded-xl font-russo text-sm uppercase transition-all flex items-center justify-center gap-2 ${
            activeTab === 'matches'
              ? 'bg-[#FF6B35] text-white'
              : 'bg-[#2a2a2a] text-[#888] hover:text-white'
          }`}
        >
          <Heart className="w-4 h-4" />
          <span className="hidden sm:inline">Saved</span>
          {savedMatches.length > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-russo">{savedMatches.length}</span>
          )}
        </button>
      </div>
      
      {/* Game Stats Bar */}
      <GameStatsDisplay stats={gameStats} />
      
      {/* Content */}
      <div className="flex-1 mt-6">
        {activeTab === 'game' && (
          <div className="relative h-[520px] flex flex-col items-center">
            {/* Card Stack */}
            <div className="relative w-full h-[450px] flex justify-center">
              {currentShooter && (
                <PlayerCard
                  key={currentShooter.id}
                  shooter={currentShooter}
                  onVote={handleVote}
                  isRevealing={isRevealing}
                  voteResult={voteResult || undefined}
                  userVote={lastVote || undefined}
                />
              )}
              
              {/* No more shooters */}
              {!currentShooter && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 z-50">
                  <Medal className="w-16 h-16 text-[#FF6B35] mb-4" />
                  <h3 className="text-xl font-bold text-white mb-2">All Caught Up!</h3>
                  <p className="text-[#888] mb-4">You&apos;ve rated all matching shooters</p>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="px-6 py-3 bg-[#FF6B35] hover:bg-[#FF4500] text-white rounded-xl font-russo flex items-center gap-2 transition-colors"
                  >
                    <RotateCcw className="w-5 h-5" />
                    Start Over
                  </button>
                </div>
              )}
            </div>
            
            {/* Vote Buttons */}
            {currentShooter && !isRevealing && (
              <div className="flex items-center justify-center gap-6 mt-4">
                <button
                  onClick={() => handleVote(false)}
                  className="w-16 h-16 rounded-full bg-[#2a2a2a] border-2 border-[#888] flex items-center justify-center hover:scale-110 active:scale-90 transition-transform"
                >
                  <X className="w-8 h-8 text-[#888]" />
                </button>
                
                <button
                  onClick={() => handleVote(true)}
                  className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center hover:scale-110 active:scale-90 transition-transform shadow-lg shadow-[#FF6B35]/30"
                >
                  <Flame className="w-10 h-10 text-white" />
                </button>
              </div>
            )}
            
            {/* Progress */}
            {currentShooter && (
              <div className="mt-4 text-center">
                <p className="text-xs text-[#888]">
                  {currentIndex + 1} / {matchedShooters.length} shooters
                </p>
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
    </div>
  )
}

export default ScoreOrPassGame

