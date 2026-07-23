import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"

// Map an age-group bucket to an inclusive [min, max] age range.
function ageGroupToRange(group: string): [number, number] | null {
  switch (group.toLowerCase()) {
    case "youth":
    case "u13":
    case "under-13":
      return [0, 12]
    case "middle":
    case "13-15":
      return [13, 15]
    case "high":
    case "highschool":
    case "16-18":
      return [16, 18]
    case "college":
    case "19-22":
      return [19, 22]
    case "adult":
    case "23+":
      return [23, 120]
    default:
      return null
  }
}

/**
 * GET /api/leaderboard
 *
 * Returns a REAL leaderboard built from stored analysis data.
 *
 * Query params:
 *   - type: 'form_score' | 'improvement' | 'streak' | 'engagement' (default: form_score)
 *   - userProfileId: optional, used to flag the current user's row
 *   - limit: number of entries to return (default 10)
 *
 * Ranking source per type:
 *   - form_score:   best (max) overallScore across each user's analyses
 *   - improvement:  total positive score change across each user's history
 *   - engagement:   number of completed analyses per user
 *   - streak:       longest run of consecutive practice days per user
 *
 * Users are anonymized to "Player ####" identifiers. If there is no stored
 * data, an empty leaderboard is returned (never fabricated entries).
 */

type LeaderboardType = "form_score" | "improvement" | "streak" | "engagement"

interface LeaderboardEntry {
  rank: number
  identifier: string
  score: number
  level: number
  isCurrentUser: boolean
  change?: number
}

// Mirror of calculateLevel() thresholds in gamificationService (points-based).
// Here we derive a simple display level from the ranking score so the UI has
// a sensible "Level N" without inventing point totals.
function scoreToLevel(type: LeaderboardType, score: number): number {
  switch (type) {
    case "form_score":
      return Math.max(1, Math.ceil(score / 20)) // 0-100 score -> 1-5
    case "engagement":
      return Math.max(1, Math.ceil(score / 5)) // every 5 analyses -> +1 level
    case "streak":
      return Math.max(1, Math.ceil(score / 7)) // every 7-day streak -> +1 level
    case "improvement":
      return Math.max(1, Math.ceil(score / 10))
    default:
      return 1
  }
}

// Stable anonymized identifier from a userProfileId.
function anonymize(userProfileId: string): string {
  let hash = 0
  for (let i = 0; i < userProfileId.length; i++) {
    hash = (hash * 31 + userProfileId.charCodeAt(i)) >>> 0
  }
  return `Player ${String(hash % 10000).padStart(4, "0")}`
}

/**
 * Longest streak of consecutive calendar days that a user has an analysis on.
 */
function longestConsecutiveDayStreak(dates: Date[]): number {
  if (dates.length === 0) return 0

  // Unique day keys (UTC) sorted ascending.
  const dayKeys = Array.from(
    new Set(
      dates.map((d) => {
        const day = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
        return day.getTime()
      })
    )
  ).sort((a, b) => a - b)

  const DAY_MS = 24 * 60 * 60 * 1000
  let best = 1
  let current = 1
  for (let i = 1; i < dayKeys.length; i++) {
    if (dayKeys[i] - dayKeys[i - 1] === DAY_MS) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 1
    }
  }
  return best
}

export async function GET(request: NextRequest) {
  const typeParam = (request.nextUrl.searchParams.get("type") || "form_score") as LeaderboardType
  const type: LeaderboardType = ["form_score", "improvement", "streak", "engagement"].includes(
    typeParam
  )
    ? typeParam
    : "form_score"
  const currentUserProfileId = request.nextUrl.searchParams.get("userProfileId")
  const ageGroup = request.nextUrl.searchParams.get("ageGroup")
  const skillLevel = request.nextUrl.searchParams.get("skillLevel")
  const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get("limit") || "10"), 1), 50)

  try {
    // userProfileId -> ranking score
    const scoreByUser = new Map<string, number>()

    if (type === "form_score") {
      // Best overall score per user from completed analyses.
      const rows = await prisma.userAnalysis.groupBy({
        by: ["userProfileId"],
        _max: { overallScore: true },
        where: { overallScore: { not: null } },
      })
      for (const r of rows) {
        const max = r._max.overallScore
        if (max != null) scoreByUser.set(r.userProfileId, Math.round(Number(max)))
      }
    } else if (type === "engagement") {
      // Number of completed analyses per user.
      const rows = await prisma.userAnalysis.groupBy({
        by: ["userProfileId"],
        _count: { _all: true },
      })
      for (const r of rows) {
        scoreByUser.set(r.userProfileId, r._count._all)
      }
    } else if (type === "improvement") {
      // Sum of positive score changes across a user's history.
      const rows = await prisma.analysisHistory.findMany({
        where: { scoreChange: { gt: 0 } },
        select: { userProfileId: true, scoreChange: true },
      })
      for (const r of rows) {
        const delta = r.scoreChange != null ? Number(r.scoreChange) : 0
        scoreByUser.set(r.userProfileId, (scoreByUser.get(r.userProfileId) || 0) + delta)
      }
    } else if (type === "streak") {
      // Longest consecutive-day analysis streak per user.
      const rows = await prisma.analysisHistory.findMany({
        select: { userProfileId: true, analysisDate: true },
      })
      const datesByUser = new Map<string, Date[]>()
      for (const r of rows) {
        const arr = datesByUser.get(r.userProfileId) || []
        arr.push(r.analysisDate)
        datesByUser.set(r.userProfileId, arr)
      }
      for (const [userId, dates] of datesByUser) {
        scoreByUser.set(userId, longestConsecutiveDayStreak(dates))
      }
    }

    // Optional cohort filtering by age group and/or skill (experience) level.
    if ((ageGroup && ageGroup !== "all") || (skillLevel && skillLevel !== "all")) {
      const profileWhere: Prisma.UserProfileWhereInput = {}
      if (skillLevel && skillLevel !== "all") {
        profileWhere.experienceLevel = { equals: skillLevel, mode: "insensitive" }
      }
      if (ageGroup && ageGroup !== "all") {
        const range = ageGroupToRange(ageGroup)
        if (range) profileWhere.age = { gte: range[0], lte: range[1] }
      }
      if (Object.keys(profileWhere).length > 0) {
        const allowed = await prisma.userProfile.findMany({
          where: profileWhere,
          select: { id: true },
        })
        const allowedSet = new Set(allowed.map((p) => p.id))
        for (const id of Array.from(scoreByUser.keys())) {
          if (!allowedSet.has(id)) scoreByUser.delete(id)
        }
      }
    }

    // Build, sort, and rank entries from real scores.
    const ranked = Array.from(scoreByUser.entries())
      .map(([userProfileId, score]) => ({
        userProfileId,
        score: Math.round(score),
      }))
      .filter((e) => e.score > 0)
      .sort((a, b) => b.score - a.score)

    const totalParticipants = ranked.length

    const entries: LeaderboardEntry[] = ranked.slice(0, limit).map((e, idx) => ({
      rank: idx + 1,
      identifier:
        currentUserProfileId && e.userProfileId === currentUserProfileId
          ? "You"
          : anonymize(e.userProfileId),
      score: e.score,
      level: scoreToLevel(type, e.score),
      isCurrentUser: !!currentUserProfileId && e.userProfileId === currentUserProfileId,
    }))

    // Determine current user's rank if present in the full ranking.
    let userRank = 0
    if (currentUserProfileId) {
      const idx = ranked.findIndex((e) => e.userProfileId === currentUserProfileId)
      if (idx >= 0) userRank = idx + 1
    }

    return NextResponse.json({
      success: true,
      type,
      entries,
      userRank,
      totalParticipants,
    })
  } catch (error) {
    console.warn("Leaderboard unavailable", {
      reason: error instanceof Error ? error.name : "UnknownError",
    })
    return NextResponse.json(
      {
        success: false,
        error: "Leaderboard is temporarily unavailable",
        type,
        entries: [],
        userRank: 0,
        totalParticipants: 0,
      },
      { status: 503 }
    )
  }
}
