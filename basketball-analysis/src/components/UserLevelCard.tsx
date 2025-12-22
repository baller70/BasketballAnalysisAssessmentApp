"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Flame, Crown, Star, Zap, Target, Medal, TrendingUp, X, Calendar, Award, Users } from "lucide-react"

// User level definitions
const USER_LEVELS = [
  { level: 1, name: "Rookie Shooter", minXP: 0, maxXP: 500, icon: Target, color: "from-gray-500 to-gray-600" },
  { level: 2, name: "Developing Player", minXP: 500, maxXP: 1000, icon: TrendingUp, color: "from-green-500 to-emerald-600" },
  { level: 3, name: "Skilled Shooter", minXP: 1000, maxXP: 2000, icon: Star, color: "from-blue-500 to-cyan-600" },
  { level: 4, name: "Sharp Shooter", minXP: 2000, maxXP: 3500, icon: Zap, color: "from-purple-500 to-violet-600" },
  { level: 5, name: "Veteran", minXP: 3500, maxXP: 5000, icon: Medal, color: "from-yellow-500 to-amber-600" },
  { level: 6, name: "Elite Shooter", minXP: 5000, maxXP: 7500, icon: Trophy, color: "from-orange-500 to-red-600" },
  { level: 7, name: "All-Star", minXP: 7500, maxXP: 10000, icon: Crown, color: "from-pink-500 to-rose-600" },
  { level: 8, name: "Legend", minXP: 10000, maxXP: Infinity, icon: Crown, color: "from-amber-400 to-yellow-500" },
]

// Get user level based on XP
function getUserLevel(xp: number) {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= USER_LEVELS[i].minXP) {
      return USER_LEVELS[i]
    }
  }
  return USER_LEVELS[0]
}

// Mock user data - in a real app, this would come from a database/auth system
interface UserStats {
  xp: number
  dailyStreak: number
  longestStreak: number
  lastActiveDate: string
  streakHistory: { date: string; completed: boolean }[]
  leaderboardRank: number
  totalUsers: number
  topUsers: { rank: number; name: string; xp: number; level: string }[]
  latestBadge: {
    name: string
    icon: typeof Trophy
    color: string
    earnedDate: string
  } | null
}

// Daily Streak Popup Component
function DailyStreakPopup({ 
  isOpen, 
  onClose, 
  streak, 
  longestStreak,
  streakHistory 
}: { 
  isOpen: boolean
  onClose: () => void
  streak: number
  longestStreak: number
  streakHistory: { date: string; completed: boolean }[]
}) {
  if (!isOpen) return null

  // Generate last 7 days for the streak calendar
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() - (6 - i))
    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = date.getDate()
    const isCompleted = streakHistory.some(h => {
      const histDate = new Date(h.date)
      return histDate.toDateString() === date.toDateString() && h.completed
    })
    const isToday = date.toDateString() === new Date().toDateString()
    return { dayName, dayNum, isCompleted, isToday }
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Popup */}
      <div className="relative bg-[#2C2C2C] rounded-xl border border-[#3a3a3a] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Flame className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Daily Streak</h2>
              <p className="text-white/80">Keep practicing every day!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current Streak */}
          <div className="text-center mb-6">
            <div className="text-6xl font-bold text-[#FFD700] mb-2">{streak}</div>
            <div className="text-[#E5E5E5] text-lg">Day Streak</div>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-orange-400">{longestStreak}</div>
              <div className="text-[#888] text-sm">Longest Streak</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">+50 XP</div>
              <div className="text-[#888] text-sm">Daily Bonus</div>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-[#888]" />
              <span className="text-[#888] text-sm font-medium">This Week</span>
            </div>
            <div className="flex justify-between gap-2">
              {last7Days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-[#666] text-xs mb-1">{day.dayName}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    day.isCompleted 
                      ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                      : day.isToday 
                        ? 'bg-[#3a3a3a] border-2 border-orange-500' 
                        : 'bg-[#1a1a1a]'
                  }`}>
                    {day.isCompleted ? (
                      <Flame className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`text-sm ${day.isToday ? 'text-orange-400' : 'text-[#666]'}`}>
                        {day.dayNum}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Rewards Info */}
          <div className="bg-[#1a1a1a] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#FFD700]" />
              <span className="text-[#E5E5E5] font-medium">Streak Rewards</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-[#888]">
                <span>7 Day Streak</span>
                <span className="text-green-400">+100 XP Bonus</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>14 Day Streak</span>
                <span className="text-blue-400">Special Badge</span>
              </div>
              <div className="flex justify-between text-[#888]">
                <span>30 Day Streak</span>
                <span className="text-purple-400">Elite Badge + 500 XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Leaderboard Popup Component
function LeaderboardPopup({ 
  isOpen, 
  onClose, 
  userRank,
  totalUsers,
  topUsers
}: { 
  isOpen: boolean
  onClose: () => void
  userRank: number
  totalUsers: number
  topUsers: { rank: number; name: string; xp: number; level: string }[]
}) {
  if (!isOpen) return null

  const getRankColor = (rank: number) => {
    if (rank === 1) return 'from-yellow-400 to-amber-500'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-[#3a3a3a] to-[#4a4a4a]'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      {/* Popup */}
      <div className="relative bg-[#2C2C2C] rounded-xl border border-[#3a3a3a] shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-violet-600 p-6">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-white text-2xl font-bold">Leaderboard</h2>
              <p className="text-white/80">Top shooters this week</p>
            </div>
          </div>
        </div>

        {/* Your Rank Banner */}
        <div className="bg-[#1a1a1a] p-4 border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FFD700] to-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-[#E5E5E5] font-medium">Your Rank</div>
                <div className="text-[#888] text-sm">Keep improving!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#FFD700]">#{userRank}</div>
              <div className="text-[#888] text-xs">of {totalUsers.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Top Users List */}
        <div className="p-4 max-h-80 overflow-y-auto">
          <div className="space-y-3">
            {topUsers.map((user, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  user.rank <= 3 ? 'bg-[#1a1a1a]' : 'bg-[#252525]'
                }`}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankColor(user.rank)} flex items-center justify-center text-white font-bold`}>
                  {user.rank <= 3 ? (
                    <span className="text-lg">{getRankIcon(user.rank)}</span>
                  ) : (
                    <span className="text-sm">{user.rank}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-[#E5E5E5] font-medium">{user.name}</div>
                  <div className="text-[#888] text-xs">{user.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#FFD700] font-bold">{user.xp.toLocaleString()}</div>
                  <div className="text-[#888] text-xs">XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#3a3a3a] bg-[#1a1a1a]">
          <div className="text-center text-[#888] text-sm">
            Leaderboard resets every Monday at 12:00 AM
          </div>
        </div>
      </div>
    </div>
  )
}

export function UserLevelCard() {
  const [userStats, setUserStats] = useState<UserStats>({
    xp: 1250,
    dailyStreak: 5,
    longestStreak: 12,
    lastActiveDate: new Date().toISOString(),
    streakHistory: [
      { date: new Date(Date.now() - 0 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), completed: true },
    ],
    leaderboardRank: 127,
    totalUsers: 2453,
    topUsers: [
      { rank: 1, name: "SharpShooter99", xp: 15420, level: "Legend" },
      { rank: 2, name: "BucketMaster", xp: 12850, level: "All-Star" },
      { rank: 3, name: "SplashKing", xp: 11200, level: "All-Star" },
      { rank: 4, name: "DrainGame", xp: 9800, level: "Elite Shooter" },
      { rank: 5, name: "NetRipper", xp: 8950, level: "Elite Shooter" },
      { rank: 6, name: "CashMoney3", xp: 7600, level: "Veteran" },
      { rank: 7, name: "RangeKing", xp: 7200, level: "Veteran" },
      { rank: 8, name: "StrokeGod", xp: 6800, level: "Elite Shooter" },
      { rank: 9, name: "WetJumper", xp: 6400, level: "Veteran" },
      { rank: 10, name: "PureButter", xp: 5900, level: "Veteran" },
    ],
    latestBadge: {
      name: "Rising Star",
      icon: TrendingUp,
      color: "from-teal-500 to-green-600",
      earnedDate: "Dec 20, 2024"
    }
  })

  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false)

  // Load user stats from localStorage on mount (for persistence)
  useEffect(() => {
    const savedStats = localStorage.getItem('user_stats')
    if (savedStats) {
      try {
        const parsed = JSON.parse(savedStats)
        setUserStats(prev => ({
          ...prev,
          xp: parsed.xp || prev.xp,
          dailyStreak: parsed.dailyStreak || prev.dailyStreak,
          leaderboardRank: parsed.leaderboardRank || prev.leaderboardRank,
        }))
      } catch (e) {
        console.error('Failed to parse user stats:', e)
      }
    }
  }, [])

  const currentLevel = getUserLevel(userStats.xp)
  const nextLevel = USER_LEVELS.find(l => l.level === currentLevel.level + 1)
  const progressToNext = nextLevel 
    ? ((userStats.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
    : 100

  const LevelIcon = currentLevel.icon
  const BadgeIcon = userStats.latestBadge?.icon || Trophy

  return (
    <>
      <div className="bg-[#2C2C2C] rounded-lg border border-[#3a3a3a] overflow-hidden shadow-lg w-64">
        {/* Level Header */}
        <div className={`bg-gradient-to-r ${currentLevel.color} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <LevelIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white/80 text-xs uppercase tracking-wider">Level {currentLevel.level}</div>
              <div className="text-white font-bold text-lg">{currentLevel.name}</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{userStats.xp} XP</span>
                <span>{nextLevel.minXP} XP</span>
              </div>
              <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/80 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Level Perks Section */}
        <div className="p-4">
          <div className="text-[#888] text-xs uppercase tracking-wider mb-3 font-semibold">Level Perks</div>
          
          {/* Latest Badge - Links to badges page */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3 h-3 text-[#FFD700]" />
              <span className="text-[#888] text-xs">Latest Badge</span>
            </div>
            {userStats.latestBadge ? (
              <Link href="/badges" className="flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${userStats.latestBadge.color} flex items-center justify-center`}>
                  <BadgeIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-[#E5E5E5] text-sm font-medium">{userStats.latestBadge.name}</div>
                  <div className="text-[#666] text-xs">{userStats.latestBadge.earnedDate}</div>
                </div>
              </Link>
            ) : (
              <div className="p-2 bg-[#1a1a1a] rounded-lg text-[#666] text-sm">
                No badges earned yet
              </div>
            )}
          </div>

          {/* Daily Streak - Opens popup */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-[#888] text-xs">Daily Streak</span>
            </div>
            <button 
              onClick={() => setShowStreakPopup(true)}
              className="w-full flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[#E5E5E5] text-sm font-bold">{userStats.dailyStreak} Days</div>
                <div className="text-[#666] text-xs">Keep it going!</div>
              </div>
            </button>
          </div>

          {/* Leaderboard - Opens popup */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-3 h-3 text-purple-500" />
              <span className="text-[#888] text-xs">Leaderboard</span>
            </div>
            <button 
              onClick={() => setShowLeaderboardPopup(true)}
              className="w-full flex items-center gap-2 p-2 bg-[#1a1a1a] rounded-lg hover:bg-[#252525] transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-[#E5E5E5] text-sm font-bold">#{userStats.leaderboardRank}</div>
                <div className="text-[#666] text-xs">of {userStats.totalUsers.toLocaleString()} users</div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Popups */}
      <DailyStreakPopup 
        isOpen={showStreakPopup}
        onClose={() => setShowStreakPopup(false)}
        streak={userStats.dailyStreak}
        longestStreak={userStats.longestStreak}
        streakHistory={userStats.streakHistory}
      />
      <LeaderboardPopup 
        isOpen={showLeaderboardPopup}
        onClose={() => setShowLeaderboardPopup(false)}
        userRank={userStats.leaderboardRank}
        totalUsers={userStats.totalUsers}
        topUsers={userStats.topUsers}
      />
    </>
  )
}
