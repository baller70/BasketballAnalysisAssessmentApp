"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Trophy, Flame, Crown, Star, Zap, Target, Medal, TrendingUp, X, Calendar, Award, Users } from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"

// User level definitions - All names uppercase, gold/dark color scheme for header
const USER_LEVELS = [
  { level: 1, name: "ROOKIE SHOOTER", minXP: 0, maxXP: 500, icon: Target, color: "from-white via-slate-50 to-white" },
  { level: 2, name: "DEVELOPING PLAYER", minXP: 500, maxXP: 1000, icon: TrendingUp, color: "from-white via-slate-50 to-white" },
  { level: 3, name: "SKILLED SHOOTER", minXP: 1000, maxXP: 2000, icon: Award, color: "from-white via-slate-50 to-white" },
  { level: 4, name: "SHARP SHOOTER", minXP: 2000, maxXP: 3500, icon: Zap, color: "from-white via-slate-50 to-white" },
  { level: 5, name: "VETERAN", minXP: 3500, maxXP: 5000, icon: Medal, color: "from-white via-slate-50 to-white" },
  { level: 6, name: "ELITE SHOOTER", minXP: 5000, maxXP: 7500, icon: Trophy, color: "from-white via-slate-50 to-white" },
  { level: 7, name: "ALL-STAR", minXP: 7500, maxXP: 10000, icon: Crown, color: "from-white via-slate-50 to-white" },
  { level: 8, name: "LEGEND", minXP: 10000, maxXP: Infinity, icon: Crown, color: "from-white via-slate-50 to-white" },
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
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
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
            <div className="text-6xl font-bold text-[#FF6B35] mb-2">{streak}</div>
            <div className="text-slate-600 text-lg">Day Streak</div>
          </div>

          {/* Streak Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
              <div className="text-2xl font-bold text-[#FF6B35]">{longestStreak}</div>
              <div className="text-slate-400 text-sm">Longest Streak</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-4 text-center border border-slate-100">
              <div className="text-2xl font-bold text-green-600">+50 XP</div>
              <div className="text-slate-400 text-sm">Daily Bonus</div>
            </div>
          </div>

          {/* Weekly Calendar */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm font-medium">This Week</span>
            </div>
            <div className="flex justify-between gap-2">
              {last7Days.map((day, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <span className="text-slate-400 text-xs mb-1">{day.dayName}</span>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    day.isCompleted 
                      ? 'bg-gradient-to-br from-orange-500 to-red-600' 
                      : day.isToday 
                        ? 'bg-slate-50 border-2 border-orange-500' 
                        : 'bg-slate-100'
                  }`}>
                    {day.isCompleted ? (
                      <Flame className="w-5 h-5 text-white" />
                    ) : (
                      <span className={`text-sm ${day.isToday ? 'text-orange-500' : 'text-slate-400'}`}>
                        {day.dayNum}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Rewards Info */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-[#FF6B35]" />
              <span className="text-slate-900 font-medium">Streak Rewards</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>7 Day Streak</span>
                <span className="text-green-600">+100 XP Bonus</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>14 Day Streak</span>
                <span className="text-blue-500">Special Badge</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>30 Day Streak</span>
                <span className="text-purple-500">Elite Badge + 500 XP</span>
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
    if (rank === 1) return 'from-orange-400 to-amber-500'
    if (rank === 2) return 'from-gray-300 to-gray-400'
    if (rank === 3) return 'from-orange-400 to-orange-600'
    return 'from-slate-200 to-slate-300'
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
      <div className="relative bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
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
        <div className="bg-slate-50 p-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-slate-900 font-medium">Your Rank</div>
                <div className="text-slate-400 text-sm">Keep improving!</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[#FF6B35]">#{userRank}</div>
              <div className="text-slate-400 text-xs">of {totalUsers.toLocaleString()}</div>
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
                  user.rank <= 3 ? 'bg-slate-50 border border-slate-100' : 'bg-slate-50'
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
                  <div className="text-slate-900 font-medium">{user.name}</div>
                  <div className="text-slate-400 text-xs">{user.level}</div>
                </div>
                <div className="text-right">
                  <div className="text-[#FF6B35] font-bold">{user.xp.toLocaleString()}</div>
                  <div className="text-slate-400 text-xs">XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50">
          <div className="text-center text-slate-400 text-sm">
            Leaderboard resets every Monday at 12:00 AM
          </div>
        </div>
      </div>
    </div>
  )
}

// Format a badge id (e.g. "rising_star") into a display name ("RISING STAR").
function formatBadgeName(id: string): string {
  return id.replace(/[_-]+/g, " ").trim().toUpperCase()
}

export function UserLevelCard() {
  // Real points balance + streak come from the canonical points ledger via the
  // PointsProvider (GET /api/points), NOT a hardcoded mock (audit fix:
  // UserLevelCard previously seeded xp/streak/leaderboard with fake numbers).
  const points = usePoints()
  const xp = points.getTotalPoints()
  const streak = points.state?.streak ?? 0

  const [userStats, setUserStats] = useState<UserStats>({
    xp: 0,
    dailyStreak: 0,
    longestStreak: 0,
    lastActiveDate: points.state?.lastActiveDate ?? new Date().toISOString(),
    streakHistory: [],
    leaderboardRank: 0,
    totalUsers: 0,
    topUsers: [],
    latestBadge: null,
  })

  const [showStreakPopup, setShowStreakPopup] = useState(false)
  const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false)

  // Keep XP / streak in sync with the live points ledger.
  useEffect(() => {
    setUserStats(prev => ({
      ...prev,
      xp,
      dailyStreak: streak,
      longestStreak: Math.max(prev.longestStreak, streak),
    }))
  }, [xp, streak])

  // Load real profile-scoped data: leaderboard rank/top users, latest earned
  // badge, and active-day history (for the streak calendar). All caller-scoped
  // and server-derived — no fabricated values.
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        // Resolve the caller's profile id (needed to flag their leaderboard row).
        let profileId: string | null = null
        try {
          const pRes = await fetch("/api/profile", { credentials: "include" })
          if (pRes.ok) {
            const pData = await pRes.json()
            profileId = pData?.profile?.id ?? null
          }
        } catch {
          /* ignore */
        }

        // Leaderboard (real, anonymized).
        try {
          const lbUrl = profileId
            ? `/api/leaderboard?type=form_score&limit=10&userProfileId=${encodeURIComponent(profileId)}`
            : `/api/leaderboard?type=form_score&limit=10`
          const lbRes = await fetch(lbUrl, { credentials: "include" })
          if (lbRes.ok) {
            const lb = await lbRes.json()
            if (!cancelled && lb?.success) {
              const topUsers = (Array.isArray(lb.entries) ? lb.entries : []).map(
                (e: { rank: number; identifier: string; score: number; level: number }) => ({
                  rank: e.rank,
                  name: e.identifier,
                  xp: e.score,
                  level: `Level ${e.level}`,
                })
              )
              setUserStats(prev => ({
                ...prev,
                leaderboardRank: lb.userRank ?? 0,
                totalUsers: lb.totalParticipants ?? 0,
                topUsers,
              }))
            }
          }
        } catch {
          /* ignore */
        }

        // Latest earned badge (real, persisted earnedAt dates).
        try {
          const bRes = await fetch("/api/badges", { credentials: "include" })
          if (bRes.ok) {
            const bData = await bRes.json()
            if (!cancelled && bData?.success && bData.badges) {
              const earned = Object.entries(
                bData.badges as Record<string, { unlocked: boolean; earnedDate: string | null }>
              )
                .filter(([, b]) => b.unlocked && b.earnedDate)
                .sort(
                  (a, b) =>
                    new Date(b[1].earnedDate as string).getTime() -
                    new Date(a[1].earnedDate as string).getTime()
                )
              if (earned.length > 0) {
                const [id, b] = earned[0]
                setUserStats(prev => ({
                  ...prev,
                  latestBadge: {
                    name: formatBadgeName(id),
                    icon: Award,
                    color: "from-[#FF6B35] to-[#FF4500]",
                    earnedDate: new Date(b.earnedDate as string)
                      .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      .toUpperCase(),
                  },
                }))
              }
            }
          }
        } catch {
          /* ignore */
        }

        // Streak calendar from real analysis activity dates.
        try {
          const hRes = await fetch(
            "/api/analysis-history?limit=60",
            { credentials: "include" }
          )
          if (hRes.ok) {
            const hData = await hRes.json()
            if (!cancelled && hData?.success && Array.isArray(hData.history)) {
              const streakHistory = hData.history.map(
                (h: { recordedAt: string }) => ({ date: h.recordedAt, completed: true })
              )
              setUserStats(prev => ({ ...prev, streakHistory }))
            }
          }
        } catch {
          /* ignore */
        }
      } catch (e) {
        console.error("Failed to load user level data:", e)
      }
    }
    load()
    return () => {
      cancelled = true
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
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm w-64">
        {/* Level Header - Gold/Dark theme */}
        <div className={`bg-gradient-to-r ${currentLevel.color} p-4 border-b border-slate-200`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#FF6B35]/20 rounded-lg flex items-center justify-center border border-[#FF6B35]/40">
              <LevelIcon className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <div className="text-[#FF6B35] text-xs uppercase tracking-wider font-semibold">LEVEL {currentLevel.level}</div>
              <div className="text-[#FF6B35] font-bold text-lg">{currentLevel.name}</div>
            </div>
          </div>
          
          {/* XP Progress Bar */}
          {nextLevel && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>{userStats.xp} XP</span>
                <span>{nextLevel.minXP} XP</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF4500] rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Level Perks Section - All text uppercase */}
        <div className="p-4">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-semibold">LEVEL PERKS</div>
          
          {/* Latest Badge - Links to badges page */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-3 h-3 text-[#FF6B35]" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">LATEST BADGE</span>
            </div>
            {userStats.latestBadge ? (
              <Link href="/badges" className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors border border-slate-100">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${userStats.latestBadge.color} flex items-center justify-center`}>
                  <BadgeIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="text-slate-900 text-sm font-medium uppercase">{userStats.latestBadge.name}</div>
                  <div className="text-slate-400 text-xs uppercase">{userStats.latestBadge.earnedDate}</div>
                </div>
              </Link>
            ) : (
              <div className="p-2 bg-slate-50 rounded-lg text-slate-400 text-sm uppercase border border-slate-100">
                NO BADGES EARNED YET
              </div>
            )}
          </div>

          {/* Daily Streak - Opens popup */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">DAILY STREAK</span>
            </div>
            <button 
              onClick={() => setShowStreakPopup(true)}
              className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Flame className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-bold uppercase">{userStats.dailyStreak} DAYS</div>
                <div className="text-slate-400 text-xs uppercase">KEEP IT GOING!</div>
              </div>
            </button>
          </div>

          {/* Leaderboard - Opens popup */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Crown className="w-3 h-3 text-[#FF6B35]" />
              <span className="text-slate-400 text-xs uppercase tracking-wide">LEADERBOARD</span>
            </div>
            <button 
              onClick={() => setShowLeaderboardPopup(true)}
              className="w-full flex items-center gap-2 p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors text-left border border-slate-100"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#FF4500] flex items-center justify-center">
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-slate-900 text-sm font-bold">#{userStats.leaderboardRank}</div>
                <div className="text-slate-400 text-xs uppercase">OF {userStats.totalUsers.toLocaleString()} USERS</div>
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
