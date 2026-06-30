import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"

/**
 * /api/badges
 *
 * Single source of truth for the user's gamification state, computed from REAL
 * stored activity (UserAnalysis + AnalysisHistory) and the Points ledger
 * (UserProfile.pointsState — owned by the Points agent). Nothing here is
 * hardcoded: every unlock, progress bar, streak day, and challenge counter is
 * derived from the signed-in caller's own data.
 *
 *   GET  -> read-only. Returns { badges, challenges, stats, profileId }.
 *           Merges computed state with already-persisted EarnedBadge /
 *           UserChallenge rows so earnedAt dates survive across sessions.
 *
 *   POST -> auth + CSRF. Recomputes authoritatively and PERSISTS newly-earned
 *           badges to EarnedBadge and the active weekly challenges to
 *           UserChallenge. Returns the same shape as GET (with fresh dates).
 *
 * Identity is always derived from the session via resolveProfileId — a userId
 * in the body/query is never trusted (prevents IDOR).
 */

// ============================================================================
// Badge catalog rules (mirror of the UI catalog in src/app/badges/page.tsx).
// Each rule maps the page's badge id to a real-data unlock condition + an
// honest progress pair. Badges whose source data is not tracked yet report
// progress 0/total (honest empty state) and never auto-unlock.
// ============================================================================

interface BadgeStats {
  totalAnalyses: number
  bestOverall: number
  firstOverall: number | null
  maxImprovement: number
  bestForm: number
  bestBalance: number
  bestRelease: number
  bestConsistency: number
  countAtLeast75: number
  currentStreak: number
  longestStreak: number
  earlyBirdCount: number // analyses 5:00–6:59 local-ish (UTC hour proxy)
  nightOwlCount: number // analyses >= 22:00
  allMetrics90: boolean
  perfectGame: boolean // overall >= 100
  longestConsecutive95: number
  bestMatchPct: number // best matched-shooter confidence * 100
  techniques95: number // distinct metric categories that have reached 95
  totalPoints: number
}

type BadgeResult = {
  unlocked: boolean
  progress: { current: number; total: number } | null
}

// Returns unlock + progress for a single badge id given the computed stats.
function evalBadge(id: string, s: BadgeStats): BadgeResult {
  const clamp = (n: number) => Math.max(0, Math.round(n))
  const p = (current: number, total: number): { current: number; total: number } => ({
    current: Math.min(clamp(current), total),
    total,
  })

  switch (id) {
    case "first-shot":
      return { unlocked: s.totalAnalyses >= 1, progress: p(s.totalAnalyses, 1) }
    case "warm-up":
      return { unlocked: s.totalAnalyses >= 5, progress: p(s.totalAnalyses, 5) }
    case "early-bird":
      return { unlocked: s.earlyBirdCount >= 1, progress: p(s.earlyBirdCount, 1) }
    case "getting-hot":
      return { unlocked: s.countAtLeast75 >= 3, progress: p(s.countAtLeast75, 3) }
    case "week-warrior":
      return { unlocked: s.longestStreak >= 7, progress: p(Math.max(s.currentStreak, s.longestStreak), 7) }
    case "form-focus":
      return { unlocked: s.bestForm >= 85, progress: p(s.bestForm, 85) }
    case "sharp-shooter":
      return { unlocked: s.bestOverall >= 90, progress: p(s.bestOverall, 90) }
    case "comeback-kid":
      return { unlocked: s.maxImprovement >= 20, progress: p(s.maxImprovement, 20) }
    case "film-study":
      // Shooter-comparison count not tracked yet — honest empty progress.
      return { unlocked: false, progress: p(0, 10) }
    case "iron-will":
      return { unlocked: s.longestStreak >= 30, progress: p(Math.max(s.currentStreak, s.longestStreak), 30) }
    case "perfect-arc":
      // Arc ~ release quality proxy.
      return { unlocked: s.bestRelease >= 95, progress: p(s.bestRelease, 95) }
    case "century-club":
      return { unlocked: s.totalAnalyses >= 100, progress: p(s.totalAnalyses, 100) }
    case "elite-form":
      return { unlocked: s.allMetrics90, progress: p(s.allMetrics90 ? 1 : 0, 1) }
    case "social-star":
      // Shares not tracked yet.
      return { unlocked: false, progress: p(0, 25) }
    case "night-owl":
      return { unlocked: s.nightOwlCount >= 50, progress: p(s.nightOwlCount, 50) }
    case "pro-match":
      return { unlocked: s.bestMatchPct >= 95, progress: p(s.bestMatchPct, 95) }
    case "marathon":
      return { unlocked: s.longestStreak >= 90, progress: p(Math.max(s.currentStreak, s.longestStreak), 90) }
    case "sniper":
      return { unlocked: s.longestConsecutive95 >= 10, progress: p(s.longestConsecutive95, 10) }
    case "mentor":
      // Mentorship not tracked yet.
      return { unlocked: false, progress: p(0, 50) }
    case "perfect-game":
      return { unlocked: s.perfectGame, progress: p(s.bestOverall, 100) }
    case "year-one":
      return { unlocked: s.longestStreak >= 365, progress: p(Math.max(s.currentStreak, s.longestStreak), 365) }
    case "transcendent":
      return { unlocked: s.techniques95 >= 8, progress: p(s.techniques95, 8) }
    case "influencer":
      // Followers not tracked yet.
      return { unlocked: false, progress: p(0, 1000) }
    case "ultimate":
      // Handled by caller (depends on every other badge). Default locked.
      return { unlocked: false, progress: p(0, 1) }
    default:
      return { unlocked: false, progress: null }
  }
}

// Order matters only for "ultimate" (unlock-all). Keep in sync with page catalog.
const BADGE_IDS = [
  "first-shot", "warm-up", "early-bird",
  "getting-hot", "week-warrior", "form-focus",
  "sharp-shooter", "comeback-kid", "film-study",
  "iron-will", "perfect-arc", "century-club",
  "elite-form", "social-star", "night-owl",
  "pro-match", "marathon",
  "sniper", "mentor",
  "perfect-game", "year-one",
  "transcendent", "influencer",
  "ultimate",
] as const

// ============================================================================
// Weekly challenge catalog (mirror of WEEKLY_CHALLENGES in gamificationService).
// Selection is DETERMINISTIC per ISO week so persistence (UserChallenge) stays
// stable across reloads — never Math.random().
// ============================================================================

const CHALLENGES = [
  { key: "angle_master", metric: "elbow_consistency", target: 5 },
  { key: "balance_breaker", metric: "balance_improvement", target: 15 },
  { key: "follow_through_focus", metric: "perfect_follow_through", target: 10 },
  { key: "consistency_champion", metric: "daily_streak", target: 7 },
  { key: "rapid_improvement", metric: "score_improvement", target: 10 },
  { key: "analysis_marathon", metric: "weekly_analyses", target: 15 },
  { key: "knee_bend_master", metric: "knee_bend_streak", target: 5 },
  { key: "release_perfectionist", metric: "release_consistency", target: 8 },
] as const

const DAY_MS = 24 * 60 * 60 * 1000

function startOfWeek(now = new Date()): Date {
  const d = new Date(now)
  const day = d.getUTCDay() // 0 = Sun
  const diff = (day + 6) % 7 // days since Monday
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - diff)
  return monday
}

// Pick 3 deterministic challenges for the given week.
function selectWeeklyChallenges(weekStart: Date): typeof CHALLENGES[number][] {
  const seed = Math.floor(weekStart.getTime() / DAY_MS)
  const idx = [seed % 8, (seed + 3) % 8, (seed + 6) % 8]
  // Ensure 3 distinct indices.
  const distinct: number[] = []
  for (let i = 0; distinct.length < 3 && i < 8; i++) {
    const candidate = (idx[distinct.length] + i) % 8
    if (!distinct.includes(candidate)) distinct.push(candidate)
  }
  return distinct.map((i) => CHALLENGES[i])
}

function dayKey(d: Date): number {
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
}

function longestConsecutiveDayStreak(dayKeys: number[]): number {
  if (dayKeys.length === 0) return 0
  const sorted = Array.from(new Set(dayKeys)).sort((a, b) => a - b)
  let best = 1
  let cur = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === DAY_MS) {
      cur += 1
      best = Math.max(best, cur)
    } else {
      cur = 1
    }
  }
  return best
}

// Current streak: consecutive days ending today (or yesterday).
function currentDayStreak(dayKeys: number[]): number {
  if (dayKeys.length === 0) return 0
  const set = new Set(dayKeys)
  const todayKey = dayKey(new Date())
  let cursor = set.has(todayKey) ? todayKey : todayKey - DAY_MS
  if (!set.has(cursor)) return 0
  let streak = 0
  while (set.has(cursor)) {
    streak += 1
    cursor -= DAY_MS
  }
  return streak
}

function num(v: unknown): number | null {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// ============================================================================
// Core computation — shared by GET and POST.
// ============================================================================

interface ComputedState {
  stats: {
    totalPoints: number
    totalAnalyses: number
    currentStreak: number
    longestStreak: number
    activeDates: string[] // yyyy-mm-dd, last 35 days, days with an analysis
  }
  badges: Record<string, BadgeResult>
  challenges: Array<{
    key: string
    metric: string
    target: number
    current: number
    completed: boolean
    weekStart: string
  }>
}

async function computeState(userProfileId: string): Promise<ComputedState> {
  const [analyses, history, profile] = await Promise.all([
    prisma.userAnalysis.findMany({
      where: { userProfileId },
      orderBy: { createdAt: "asc" },
      select: {
        createdAt: true,
        overallScore: true,
        formScore: true,
        balanceScore: true,
        releaseScore: true,
        consistencyScore: true,
        elbowAngle: true,
        kneeAngle: true,
        releaseAngle: true,
        matchConfidence: true,
      },
    }),
    prisma.analysisHistory.findMany({
      where: { userProfileId },
      orderBy: { analysisDate: "asc" },
      select: { analysisDate: true, overallScore: true, balanceScore: true, scoreChange: true },
    }),
    prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: { pointsState: true },
    }),
  ])

  // ---- Points (from the Points agent's ledger; do NOT keep a second total) ----
  let totalPoints = 0
  const ps = profile?.pointsState as { totalPoints?: unknown } | null
  if (ps && typeof ps.totalPoints === "number") totalPoints = ps.totalPoints

  // ---- Date keys for streaks (prefer history dates, fall back to analyses) ----
  const allDateRows: Date[] = [
    ...history.map((h) => h.analysisDate),
    ...analyses.map((a) => a.createdAt),
  ]
  const keys = allDateRows.map(dayKey)
  const currentStreak = currentDayStreak(keys)
  const longestStreak = longestConsecutiveDayStreak(keys)

  // Active dates for the streak grid (last 35 days).
  const cutoff = dayKey(new Date()) - 35 * DAY_MS
  const activeDates = Array.from(new Set(keys.filter((k) => k >= cutoff)))
    .sort((a, b) => a - b)
    .map((k) => new Date(k).toISOString().slice(0, 10))

  // ---- Score aggregates ----
  const overallScores = analyses.map((a) => num(a.overallScore)).filter((n): n is number => n != null)
  const bestOverall = overallScores.length ? Math.max(...overallScores) : 0
  const firstOverall = overallScores.length ? overallScores[0] : null
  const bestForm = Math.max(0, ...analyses.map((a) => num(a.formScore) ?? 0))
  const bestBalance = Math.max(0, ...analyses.map((a) => num(a.balanceScore) ?? 0))
  const bestRelease = Math.max(0, ...analyses.map((a) => num(a.releaseScore) ?? 0))
  const bestConsistency = Math.max(0, ...analyses.map((a) => num(a.consistencyScore) ?? 0))
  const bestMatchPct = Math.max(0, ...analyses.map((a) => (num(a.matchConfidence) ?? 0) * 100))

  // Max improvement over the user's journey (best minus first).
  const maxImprovement = firstOverall != null ? Math.max(0, bestOverall - firstOverall) : 0

  const countAtLeast75 = overallScores.filter((n) => n >= 75).length
  const perfectGame = bestOverall >= 100

  // All shooting metrics 90+ in a single analysis.
  const allMetrics90 = analyses.some(
    (a) =>
      (num(a.formScore) ?? 0) >= 90 &&
      (num(a.balanceScore) ?? 0) >= 90 &&
      (num(a.releaseScore) ?? 0) >= 90 &&
      (num(a.consistencyScore) ?? 0) >= 90
  )

  // Distinct metric categories that have ever hit 95 (proxy for "all techniques").
  const techniques95 =
    (bestOverall >= 95 ? 1 : 0) +
    (bestForm >= 95 ? 1 : 0) +
    (bestBalance >= 95 ? 1 : 0) +
    (bestRelease >= 95 ? 1 : 0) +
    (bestConsistency >= 95 ? 1 : 0) +
    (analyses.some((a) => { const v = num(a.elbowAngle); return v != null && v >= 85 && v <= 95 }) ? 1 : 0) +
    (analyses.some((a) => { const v = num(a.kneeAngle); return v != null && v >= 40 && v <= 50 }) ? 1 : 0) +
    (analyses.some((a) => { const v = num(a.releaseAngle); return v != null && v >= 45 && v <= 55 }) ? 1 : 0)

  // Hours (UTC hour as a stable proxy for early-bird / night-owl).
  const earlyBirdCount = analyses.filter((a) => {
    const h = a.createdAt.getUTCHours()
    return h >= 5 && h < 7
  }).length
  const nightOwlCount = analyses.filter((a) => a.createdAt.getUTCHours() >= 22).length

  // Longest run of consecutive analyses (by order) scoring >= 95.
  let longestConsecutive95 = 0
  let run = 0
  for (const a of analyses) {
    if ((num(a.overallScore) ?? 0) >= 95) {
      run += 1
      longestConsecutive95 = Math.max(longestConsecutive95, run)
    } else {
      run = 0
    }
  }

  const stats: BadgeStats = {
    totalAnalyses: analyses.length,
    bestOverall,
    firstOverall,
    maxImprovement,
    bestForm,
    bestBalance,
    bestRelease,
    bestConsistency,
    countAtLeast75,
    currentStreak,
    longestStreak,
    earlyBirdCount,
    nightOwlCount,
    allMetrics90,
    perfectGame,
    longestConsecutive95,
    bestMatchPct,
    techniques95,
    totalPoints,
  }

  // ---- Evaluate all badges ----
  const badges: Record<string, BadgeResult> = {}
  for (const id of BADGE_IDS) {
    if (id === "ultimate") continue
    badges[id] = evalBadge(id, stats)
  }
  // "ultimate" unlocks when every other badge is unlocked.
  const everyOther = Object.values(badges).every((b) => b.unlocked)
  badges["ultimate"] = { unlocked: everyOther, progress: { current: everyOther ? 1 : 0, total: 1 } }

  // ---- Weekly challenges ----
  const weekStart = startOfWeek()
  const weekStartMs = weekStart.getTime()
  const selected = selectWeeklyChallenges(weekStart)

  const weekAnalyses = analyses.filter((a) => a.createdAt.getTime() >= weekStartMs)
  const weekHistory = history.filter((h) => h.analysisDate.getTime() >= weekStartMs)

  const challengeCurrent = (metric: string): number => {
    switch (metric) {
      case "weekly_analyses":
        return weekAnalyses.length
      case "daily_streak":
        return currentStreak
      case "score_improvement":
        return Math.round(
          weekHistory.reduce((sum, h) => sum + Math.max(0, num(h.scoreChange) ?? 0), 0)
        )
      case "balance_improvement": {
        const vals = weekAnalyses.map((a) => num(a.balanceScore)).filter((n): n is number => n != null)
        return vals.length >= 2 ? Math.max(0, Math.round(Math.max(...vals) - vals[0])) : 0
      }
      case "elbow_consistency":
        return weekAnalyses.filter((a) => num(a.elbowAngle) != null).length
      case "perfect_follow_through":
        return weekAnalyses.filter((a) => (num(a.releaseScore) ?? 0) >= 90).length
      case "knee_bend_streak": {
        let best = 0
        let r = 0
        for (const a of weekAnalyses) {
          const v = num(a.kneeAngle)
          if (v != null && v >= 40 && v <= 50) {
            r += 1
            best = Math.max(best, r)
          } else r = 0
        }
        return best
      }
      case "release_consistency": {
        const vals = weekAnalyses.map((a) => num(a.releaseAngle)).filter((n): n is number => n != null)
        if (vals.length === 0) return 0
        const mean = vals.reduce((s, v) => s + v, 0) / vals.length
        return vals.filter((v) => Math.abs(v - mean) <= 3).length
      }
      default:
        return 0
    }
  }

  const challenges = selected.map((c) => {
    const current = challengeCurrent(c.metric)
    return {
      key: c.key,
      metric: c.metric,
      target: c.target,
      current: Math.min(current, c.target),
      completed: current >= c.target,
      weekStart: weekStart.toISOString(),
    }
  })

  return {
    stats: { totalPoints, totalAnalyses: analyses.length, currentStreak, longestStreak, activeDates },
    badges,
    challenges,
  }
}

// ============================================================================
// GET — read-only state, merged with persisted earnedAt / challenge rows.
// ============================================================================

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const state = await computeState(userProfileId)

    const [earned, savedChallenges] = await Promise.all([
      prisma.earnedBadge.findMany({
        where: { userProfileId },
        select: { badgeId: true, earnedAt: true },
      }),
      prisma.userChallenge.findMany({
        where: { userProfileId, weekStart: new Date(state.challenges[0]?.weekStart ?? Date.now()) },
        select: { challengeKey: true, current: true, completed: true },
      }),
    ])

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]))
    const savedChallengeMap = new Map(savedChallenges.map((c) => [c.challengeKey, c]))

    const badges = Object.fromEntries(
      Object.entries(state.badges).map(([id, b]) => {
        const persistedAt = earnedMap.get(id)
        return [
          id,
          {
            unlocked: b.unlocked || !!persistedAt,
            progress: b.progress,
            earnedDate: persistedAt ? persistedAt.toISOString() : null,
          },
        ]
      })
    )

    // Surface the higher of (computed, persisted) progress so a completed
    // challenge stays completed even if the week's live count dipped.
    const challenges = state.challenges.map((c) => {
      const saved = savedChallengeMap.get(c.key)
      const current = Math.max(c.current, saved?.current ?? 0)
      return { ...c, current: Math.min(current, c.target), completed: c.completed || !!saved?.completed }
    })

    return NextResponse.json({
      success: true,
      profileId: userProfileId,
      stats: state.stats,
      badges,
      challenges,
    })
  } catch (error) {
    console.error("Badges GET error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to load badges" },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST — persist newly-earned badges + active weekly challenges.
// ============================================================================

export async function POST(request: NextRequest) {
  const csrf = validateCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const state = await computeState(userProfileId)

    // ---- Persist newly-earned badges (idempotent via unique constraint) ----
    const unlockedIds = Object.entries(state.badges)
      .filter(([, b]) => b.unlocked)
      .map(([id]) => id)

    if (unlockedIds.length > 0) {
      await prisma.earnedBadge.createMany({
        data: unlockedIds.map((id) => ({
          userProfileId,
          badgeId: id,
          progress: state.badges[id].progress ?? undefined,
        })),
        skipDuplicates: true,
      })
    }

    // ---- Upsert this week's challenge progress ----
    const weekStart = new Date(state.challenges[0]?.weekStart ?? startOfWeek().toISOString())
    for (const c of state.challenges) {
      const existing = await prisma.userChallenge.findFirst({
        where: { userProfileId, challengeKey: c.key, weekStart },
        select: { id: true, current: true, completed: true },
      })
      if (existing) {
        await prisma.userChallenge.update({
          where: { id: existing.id },
          data: {
            // Progress only ratchets up — never regress a user's counter.
            current: Math.max(existing.current, c.current),
            completed: existing.completed || c.completed,
            target: c.target,
          },
        })
      } else {
        await prisma.userChallenge.create({
          data: {
            userProfileId,
            challengeKey: c.key,
            target: c.target,
            current: c.current,
            completed: c.completed,
            weekStart,
          },
        })
      }
    }

    // ---- Return fresh merged state (same shape as GET) ----
    const [earned, savedChallenges] = await Promise.all([
      prisma.earnedBadge.findMany({
        where: { userProfileId },
        select: { badgeId: true, earnedAt: true },
      }),
      prisma.userChallenge.findMany({
        where: { userProfileId, weekStart },
        select: { challengeKey: true, current: true, completed: true },
      }),
    ])

    const earnedMap = new Map(earned.map((e) => [e.badgeId, e.earnedAt]))
    const savedChallengeMap = new Map(savedChallenges.map((c) => [c.challengeKey, c]))

    const badges = Object.fromEntries(
      Object.entries(state.badges).map(([id, b]) => {
        const persistedAt = earnedMap.get(id)
        return [
          id,
          {
            unlocked: b.unlocked || !!persistedAt,
            progress: b.progress,
            earnedDate: persistedAt ? persistedAt.toISOString() : null,
          },
        ]
      })
    )

    const challenges = state.challenges.map((c) => {
      const saved = savedChallengeMap.get(c.key)
      const current = Math.max(c.current, saved?.current ?? 0)
      return { ...c, current: Math.min(current, c.target), completed: c.completed || !!saved?.completed }
    })

    return NextResponse.json({
      success: true,
      profileId: userProfileId,
      stats: state.stats,
      badges,
      challenges,
      newlyPersisted: unlockedIds.length,
    })
  } catch (error) {
    console.error("Badges POST error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to persist badges" },
      { status: 500 }
    )
  }
}
