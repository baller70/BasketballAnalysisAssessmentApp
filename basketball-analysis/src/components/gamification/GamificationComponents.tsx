"use client"

import React, { useState, useEffect, useMemo } from "react"
import {
  Trophy,
  Flame,
  Star,
  Medal,
  Target,
  TrendingUp,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Award,
  Zap,
  Crown,
  Clock,
  Users,
  Share2,
  Lock
} from "lucide-react"
import {
  getUserProgress,
  getLevelData,
  getLevelProgress,
  getEarnedBadges,
  getUnearnedBadges,
  getBadgesByCategory,
  getActiveChallenges,
  getLeaderboard,
  checkStreakStatus,
  getRarityColor,
  getDifficultyColor,
  ALL_BADGES,
  USER_LEVELS,
  type Badge,
  type Challenge,
  type UserProgress,
  type LeaderboardData
} from "@/services/gamificationService"

// ============================================
// BADGE DISPLAY COMPONENT
// ============================================

interface BadgeDisplayProps {
  badge: Badge
  size?: 'sm' | 'md' | 'lg'
  showDetails?: boolean
}

export function BadgeDisplay({ badge, size = 'md', showDetails = false }: BadgeDisplayProps) {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl'
  }
  
  const rarityColor = getRarityColor(badge.rarity)
  const isLocked = !badge.isUnlocked
  
  return (
    <div className={`relative group ${showDetails ? 'cursor-pointer' : ''}`}>
      <div 
        className={`${sizeClasses[size]} rounded-xl flex items-center justify-center transition-all ${
          isLocked 
            ? 'bg-[#2a2a2a] border-2 border-dashed border-[#4a4a4a] grayscale opacity-50' 
            : 'bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] border-2 shadow-lg hover:scale-110'
        }`}
        style={{ borderColor: isLocked ? undefined : rarityColor }}
      >
        {isLocked ? (
          <Lock className="w-4 h-4 text-[#666]" />
        ) : (
          <span>{badge.icon}</span>
        )}
      </div>
      
      {/* Rarity indicator dot */}
      {!isLocked && (
        <div 
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#1a1a1a]"
          style={{ backgroundColor: rarityColor }}
        />
      )}
      
      {/* Tooltip on hover */}
      {showDetails && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-3 shadow-xl min-w-[200px]">
            <p className="font-bold text-[#E5E5E5] text-sm">{badge.name}</p>
            <p className="text-xs text-[#888] mt-1">{badge.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span 
                className="text-xs px-2 py-0.5 rounded capitalize"
                style={{ backgroundColor: `${rarityColor}20`, color: rarityColor }}
              >
                {badge.rarity}
              </span>
              <span className="text-xs text-[#FFD700]">+{badge.pointsAwarded} pts</span>
            </div>
            {badge.unlockedDate && (
              <p className="text-xs text-green-400 mt-2">
                Earned {new Date(badge.unlockedDate).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// BADGES SHOWCASE COMPONENT
// ============================================

interface BadgesShowcaseProps {
  maxDisplay?: number
  showAll?: boolean
}

export function BadgesShowcase({ maxDisplay = 8, showAll = false }: BadgesShowcaseProps) {
  const [expanded, setExpanded] = useState(false)
  const earnedBadges = getEarnedBadges()
  const unearnedBadges = getUnearnedBadges()
  
  const displayBadges = expanded || showAll ? ALL_BADGES : ALL_BADGES.slice(0, maxDisplay)
  const progress = getUserProgress()
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
            <Trophy className="w-5 h-5 text-[#1a1a1a]" />
          </div>
          <div>
            <h3 className="font-bold text-[#E5E5E5]">Badges & Achievements</h3>
            <p className="text-xs text-[#888]">{earnedBadges.length} of {ALL_BADGES.length} earned</p>
          </div>
        </div>
        
        {!showAll && ALL_BADGES.length > maxDisplay && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[#FFD700] text-sm flex items-center gap-1 hover:underline"
          >
            {expanded ? 'Show Less' : 'View All'}
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] rounded-full transition-all duration-500"
            style={{ width: `${(earnedBadges.length / ALL_BADGES.length) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Badges grid */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
        {displayBadges.map(badge => (
          <BadgeDisplay 
            key={badge.id} 
            badge={{ ...badge, isUnlocked: progress.badgesEarned.includes(badge.id) }}
            size="md"
            showDetails
          />
        ))}
      </div>
      
      {/* Recently earned */}
      {earnedBadges.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
          <p className="text-xs text-[#888] mb-2">Recently Earned</p>
          <div className="flex gap-2">
            {earnedBadges.slice(0, 3).map(badge => (
              <div key={badge.id} className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg px-3 py-2">
                <span className="text-lg">{badge.icon}</span>
                <span className="text-sm text-[#E5E5E5]">{badge.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// LEVEL PROGRESS COMPONENT
// ============================================

export function LevelProgressCard() {
  const progress = getUserProgress()
  const levelData = getLevelData(progress.currentLevel)
  const nextLevelData = getLevelData(progress.currentLevel + 1)
  const levelProgress = getLevelProgress(progress.totalPoints)
  
  return (
    <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1a1a1a] rounded-xl p-6 border border-[#3a3a3a] relative overflow-hidden">
      {/* Background decoration */}
      <div 
        className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20"
        style={{ backgroundColor: levelData.color }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black shadow-lg"
              style={{ backgroundColor: levelData.color, color: '#1a1a1a' }}
            >
              {progress.currentLevel}
            </div>
            <div>
              <h3 className="font-bold text-lg" style={{ color: levelData.color }}>{levelData.name}</h3>
              <p className="text-xs text-[#888]">{progress.totalPoints} total points</p>
            </div>
          </div>
          
          {nextLevelData && (
            <div className="text-right">
              <p className="text-xs text-[#888]">Next Level</p>
              <p className="text-sm font-bold text-[#E5E5E5]">{nextLevelData.name}</p>
            </div>
          )}
        </div>
        
        {/* Progress bar */}
        <div className="mb-3">
          <div className="h-3 bg-[#1a1a1a] rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-500"
              style={{ 
                width: `${levelProgress.percentage}%`,
                backgroundColor: levelData.color
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-xs text-[#888]">{levelProgress.pointsInLevel} pts</span>
            <span className="text-xs text-[#888]">{levelProgress.pointsNeeded} pts needed</span>
          </div>
        </div>
        
        {/* Perks */}
        <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
          <p className="text-xs text-[#888] mb-2">Level Perks</p>
          <div className="flex flex-wrap gap-2">
            {levelData.perks.map((perk, idx) => (
              <span key={idx} className="text-xs bg-[#1a1a1a] text-[#E5E5E5] px-2 py-1 rounded">
                {perk}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================
// STREAK TRACKER COMPONENT
// ============================================

export function StreakTracker() {
  const progress = getUserProgress()
  const streakStatus = checkStreakStatus()
  
  // Generate last 7 days
  const last7Days = useMemo(() => {
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayName = date.toLocaleDateString('en', { weekday: 'short' })
      
      // Check if this day was active (simplified - in real app would check actual analysis dates)
      const isActive = i < progress.currentStreak
      const isToday = i === 0
      
      days.push({ date: dateStr, dayName, isActive, isToday })
    }
    return days
  }, [progress.currentStreak])
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#E5E5E5]">Daily Streak</h3>
            <p className="text-xs text-[#888]">Keep analyzing to maintain your streak!</p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-3xl font-black text-orange-400">{progress.currentStreak}</p>
          <p className="text-xs text-[#888]">days</p>
        </div>
      </div>
      
      {/* Week visualization */}
      <div className="flex justify-between gap-2 mb-4">
        {last7Days.map((day, idx) => (
          <div key={idx} className="flex-1 text-center">
            <p className="text-xs text-[#666] mb-2">{day.dayName}</p>
            <div 
              className={`w-full aspect-square rounded-lg flex items-center justify-center transition-all ${
                day.isActive 
                  ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                  : day.isToday
                    ? 'bg-[#3a3a3a] border-2 border-dashed border-orange-500'
                    : 'bg-[#1a1a1a]'
              }`}
            >
              {day.isActive && <Flame className="w-4 h-4 text-white" />}
              {!day.isActive && day.isToday && <span className="text-orange-500 text-xs">?</span>}
            </div>
          </div>
        ))}
      </div>
      
      {/* Streak info */}
      <div className="flex justify-between text-sm">
        <div>
          <p className="text-[#888]">Longest Streak</p>
          <p className="text-[#E5E5E5] font-bold">{progress.longestStreak} days</p>
        </div>
        <div className="text-right">
          <p className="text-[#888]">Status</p>
          <p className={`font-bold ${streakStatus.isActive ? 'text-green-400' : 'text-red-400'}`}>
            {streakStatus.isActive ? 'Active' : 'At Risk'}
          </p>
        </div>
      </div>
      
      {/* Warning if streak at risk */}
      {!streakStatus.isActive && progress.currentStreak > 0 && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Analyze today to keep your {progress.currentStreak}-day streak!
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// WEEKLY CHALLENGES COMPONENT
// ============================================

export function WeeklyChallenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [expanded, setExpanded] = useState<string | null>(null)
  
  useEffect(() => {
    setChallenges(getActiveChallenges())
  }, [])
  
  // Calculate time remaining
  const getTimeRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const now = new Date()
    const diff = end.getTime() - now.getTime()
    
    if (diff <= 0) return 'Ended'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) return `${days}d ${hours}h left`
    return `${hours}h left`
  }
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-[#E5E5E5]">Weekly Challenges</h3>
            <p className="text-xs text-[#888]">Complete challenges to earn bonus points</p>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {challenges.map(challenge => {
          const progressPercent = Math.min(100, (challenge.currentProgress / challenge.goalValue) * 100)
          const difficultyColor = getDifficultyColor(challenge.difficulty)
          
          return (
            <div 
              key={challenge.id}
              className={`bg-[#1a1a1a] rounded-lg overflow-hidden border transition-all ${
                challenge.isCompleted 
                  ? 'border-green-500/50' 
                  : 'border-[#3a3a3a] hover:border-[#4a4a4a]'
              }`}
            >
              <button
                onClick={() => setExpanded(expanded === challenge.id ? null : challenge.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{challenge.icon}</span>
                    <div>
                      <p className="font-bold text-[#E5E5E5]">{challenge.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span 
                          className="text-xs px-2 py-0.5 rounded capitalize"
                          style={{ backgroundColor: `${difficultyColor}20`, color: difficultyColor }}
                        >
                          {challenge.difficulty}
                        </span>
                        <span className="text-xs text-[#FFD700]">+{challenge.pointsReward} pts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {challenge.isCompleted ? (
                      <span className="text-green-400 text-sm font-bold">✓ Complete</span>
                    ) : (
                      <span className="text-[#888] text-xs">{getTimeRemaining(challenge.endDate)}</span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-[#888] transition-transform ${expanded === challenge.id ? 'rotate-90' : ''}`} />
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="mt-3">
                  <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        challenge.isCompleted ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-[#888] mt-1">
                    {challenge.currentProgress} / {challenge.goalValue}
                  </p>
                </div>
              </button>
              
              {/* Expanded details */}
              {expanded === challenge.id && (
                <div className="px-4 pb-4 border-t border-[#2a2a2a]">
                  <p className="text-sm text-[#888] mt-3">{challenge.description}</p>
                  {challenge.badgeReward && (
                    <p className="text-xs text-[#FFD700] mt-2">
                      🏆 Earn badge on completion
                    </p>
                  )}
                </div>
              )}
            </div>
          )
        })}
        
        {challenges.length === 0 && (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-[#4a4a4a] mx-auto mb-3" />
            <p className="text-[#888]">No active challenges</p>
            <p className="text-xs text-[#666]">New challenges unlock every Monday</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ============================================
// LEADERBOARD COMPONENT (For Comparison Tab)
// ============================================

interface LeaderboardProps {
  ageGroup?: string
  skillLevel?: string
}

export function Leaderboard({ ageGroup = '15-18', skillLevel = 'Intermediate' }: LeaderboardProps) {
  const [activeType, setActiveType] = useState<LeaderboardData['type']>('form_score')
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null)
  
  useEffect(() => {
    setLeaderboard(getLeaderboard(activeType, ageGroup, skillLevel))
  }, [activeType, ageGroup, skillLevel])
  
  const typeLabels: Record<LeaderboardData['type'], string> = {
    form_score: 'Form Score',
    improvement: 'Improvement',
    streak: 'Streak',
    engagement: 'Analyses'
  }
  
  return (
    <div className="bg-[#2C2C2C] rounded-xl p-6 border border-[#3a3a3a]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
            <Crown className="w-5 h-5 text-[#1a1a1a]" />
          </div>
          <div>
            <h3 className="font-bold text-[#E5E5E5]">Leaderboard</h3>
            <p className="text-xs text-[#888]">{ageGroup} • {skillLevel}</p>
          </div>
        </div>
      </div>
      
      {/* Type selector */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {(Object.keys(typeLabels) as LeaderboardData['type'][]).map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeType === type
                ? 'bg-[#FFD700] text-[#1a1a1a]'
                : 'bg-[#1a1a1a] text-[#888] hover:text-[#E5E5E5]'
            }`}
          >
            {typeLabels[type]}
          </button>
        ))}
      </div>
      
      {/* Leaderboard entries */}
      {leaderboard && (
        <div className="space-y-2">
          {leaderboard.entries.map((entry, idx) => (
            <div 
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                entry.isCurrentUser 
                  ? 'bg-[#FFD700]/10 border border-[#FFD700]/30' 
                  : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
              }`}
            >
              {/* Rank */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                entry.rank === 1 ? 'bg-[#FFD700] text-[#1a1a1a]' :
                entry.rank === 2 ? 'bg-gray-400 text-[#1a1a1a]' :
                entry.rank === 3 ? 'bg-orange-600 text-white' :
                'bg-[#2a2a2a] text-[#888]'
              }`}>
                {entry.rank <= 3 ? ['🥇', '🥈', '🥉'][entry.rank - 1] : entry.rank}
              </div>
              
              {/* Name */}
              <div className="flex-1">
                <p className={`font-medium ${entry.isCurrentUser ? 'text-[#FFD700]' : 'text-[#E5E5E5]'}`}>
                  {entry.identifier}
                </p>
                <p className="text-xs text-[#888]">Level {entry.level}</p>
              </div>
              
              {/* Score */}
              <div className="text-right">
                <p className="font-bold text-[#E5E5E5]">
                  {entry.score}{activeType === 'form_score' ? '%' : activeType === 'streak' ? ' days' : ''}
                </p>
                {entry.change !== undefined && entry.change !== 0 && (
                  <p className={`text-xs flex items-center justify-end gap-1 ${
                    entry.change > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {entry.change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
                    {Math.abs(entry.change)}
                  </p>
                )}
              </div>
            </div>
          ))}
          
          {/* User's rank if not in top 10 */}
          {leaderboard.userRank > 10 && (
            <>
              <div className="text-center py-2 text-[#666]">• • •</div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#FFD700]/10 border border-[#FFD700]/30">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold bg-[#2a2a2a] text-[#888]">
                  {leaderboard.userRank}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[#FFD700]">You</p>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-[#3a3a3a] text-center">
        <p className="text-xs text-[#888]">
          {leaderboard?.totalParticipants || 0} players in this category
        </p>
      </div>
    </div>
  )
}

// ============================================
// GAMIFICATION SUMMARY CARD (For sidebar)
// ============================================

export function GamificationSummaryCard() {
  const progress = getUserProgress()
  const levelData = getLevelData(progress.currentLevel)
  const earnedBadges = getEarnedBadges()
  const streakStatus = checkStreakStatus()
  
  return (
    <div className="bg-gradient-to-br from-[#2C2C2C] to-[#1a1a1a] rounded-xl p-4 border border-[#3a3a3a]">
      <div className="flex items-center gap-3 mb-4">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black shadow-lg"
          style={{ backgroundColor: levelData.color, color: '#1a1a1a' }}
        >
          {progress.currentLevel}
        </div>
        <div>
          <p className="font-bold" style={{ color: levelData.color }}>{levelData.name}</p>
          <p className="text-xs text-[#888]">{progress.totalPoints} points</p>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-[#1a1a1a] rounded-lg p-2">
          <p className="text-lg font-bold text-[#FFD700]">{earnedBadges.length}</p>
          <p className="text-[10px] text-[#888]">Badges</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-2">
          <p className="text-lg font-bold text-orange-400">{progress.currentStreak}</p>
          <p className="text-[10px] text-[#888]">Streak</p>
        </div>
        <div className="bg-[#1a1a1a] rounded-lg p-2">
          <p className="text-lg font-bold text-green-400">{progress.totalAnalyses}</p>
          <p className="text-[10px] text-[#888]">Analyses</p>
        </div>
      </div>
      
      {/* Streak warning */}
      {!streakStatus.isActive && progress.currentStreak > 0 && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-xs flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Analyze today to save your streak!
          </p>
        </div>
      )}
    </div>
  )
}

// ============================================
// SHARE PROGRESS BUTTON
// ============================================

interface ShareProgressButtonProps {
  score: number
  level: string
  streak: number
}

export function ShareProgressButton({ score, level, streak }: ShareProgressButtonProps) {
  const [copied, setCopied] = useState(false)
  
  const handleShare = async () => {
    const shareText = `🏀 My Basketball Shooting Analysis\n📊 Form Score: ${score}%\n🎯 Level: ${level}\n🔥 Streak: ${streak} days\n\nAnalyze your shooting form too!`
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My Basketball Shooting Progress',
          text: shareText
        })
      } else {
        await navigator.clipboard.writeText(shareText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }
    } catch (e) {
      console.error('Error sharing:', e)
    }
  }
  
  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] hover:bg-[#2a2a2a] text-[#E5E5E5] rounded-lg transition-colors"
    >
      <Share2 className="w-4 h-4" />
      {copied ? 'Copied!' : 'Share Progress'}
    </button>
  )
}

