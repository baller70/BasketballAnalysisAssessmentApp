"use client"

/**
 * serverHistory — client helpers for reading the signed-in user's analysis
 * history from the server (GET /api/analysis-history) and reconciling it with
 * the offline localStorage cache.
 *
 * Audit fix: the dashboard/analytics views were fed mock/demo data and only ever
 * read the per-device localStorage cache, so a user's progress did not survive
 * across devices. These helpers let the analytics surfaces also pull the
 * Postgres-backed history (the source of truth) and merge it with any local
 * sessions, with NO fabricated/hardcoded fallback numbers.
 */

import type { AnalysisSession } from "@/services/sessionStorage"

export interface ServerHistoryEntry {
  id: string
  analysisId: string
  clientSessionId?: string | null
  mediaType?: string | null
  captureSessionId?: string | null
  recordedAt: string
  scores: {
    overall: number | null
    form: number | null
    balance: number | null
    release: number | null
    consistency: number | null
  }
  angles: {
    elbow: number | null
    knee: number | null
    release: number | null
  }
  scoreChange: number | null
  improvementAreas?: unknown
  regressionAreas?: unknown
  analysis?: {
    id: string
    clientSessionId?: string | null
    mediaType?: string | null
    captureSessionId?: string | null
    imageUrl?: string | null
    annotatedImageUrl?: string | null
    shootingPhase?: string | null
    strengths?: unknown
    improvements?: unknown
    coachingNotes?: unknown
  } | null
}

export interface ServerHistoryStats {
  totalAnalyses: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  latestScore: number | null
  overallTrend: string
  improvementRate: number | null
}

export interface ServerHistoryResult {
  history: ServerHistoryEntry[]
  stats: ServerHistoryStats | null
}

/**
 * Fetch the caller's analysis history from the server. Auth + scoping is handled
 * server-side (the route ignores any client-supplied id). Returns an empty
 * result on any failure (offline, unauthenticated) so callers can fall back to
 * the local cache without throwing.
 */
export async function fetchServerHistory(
  limit = 50
): Promise<ServerHistoryResult> {
  try {
    const res = await fetch(
      `/api/analysis-history?limit=${limit}&includeAnalysis=true`,
      { credentials: "include" }
    )
    if (!res.ok) return { history: [], stats: null }
    const data = await res.json()
    if (!data?.success) return { history: [], stats: null }
    return {
      history: Array.isArray(data.history) ? data.history : [],
      stats: data.stats ?? null,
    }
  } catch {
    return { history: [], stats: null }
  }
}

/**
 * Map server history entries into the local AnalysisSession shape so the existing
 * analytics UI (which renders AnalysisSession[]) can display server-persisted,
 * cross-device data. Only fields the UI actually reads (scores, angles, dates)
 * are populated; images are referenced by URL when available.
 */
export function serverHistoryToSessions(
  history: ServerHistoryEntry[]
): AnalysisSession[] {
  return history.flatMap((h) => {
    const date = new Date(h.recordedAt)
    if (Number.isNaN(date.getTime()) || h.scores.overall == null) return []
    const angles: Record<string, number> = {}
    if (h.angles.elbow != null) {
      angles.right_elbow_angle = h.angles.elbow
      angles.elbow_angle = h.angles.elbow
    }
    if (h.angles.knee != null) {
      angles.right_knee_angle = h.angles.knee
      angles.knee_angle = h.angles.knee
    }
    if (h.angles.release != null) {
      angles.release_angle = h.angles.release
    }

    const measurements: Record<string, number> = {}
    if (h.scores.form != null) measurements.formScore = h.scores.form
    if (h.scores.balance != null) measurements.balanceScore = h.scores.balance
    if (h.scores.release != null) measurements.releaseScore = h.scores.release
    if (h.scores.consistency != null) measurements.consistencyScore = h.scores.consistency
    const mediaType = h.mediaType === "video" ? "video" : "image"
    const improvements = Array.isArray(h.analysis?.improvements)
      ? h.analysis.improvements.filter((item): item is string => typeof item === "string")
      : []

    return [{
      id: h.clientSessionId || `server-${h.analysisId || h.id}`,
      date: date.toISOString(),
      displayDate: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      timestamp: date.getTime(),
      mainImageBase64:
        h.analysis?.annotatedImageUrl || h.analysis?.imageUrl || "",
      screenshots: [],
      analysisData: {
        overallScore: h.scores.overall,
        shooterLevel: "",
        angles,
        detectedFlaws: improvements,
        measurements,
      },
      mediaType,
      videoData: mediaType === "video" ? {
        captureSessionId: h.captureSessionId ?? null,
        annotatedFramesBase64: [],
        frameCount: 0,
        duration: 0,
        fps: 0,
        phases: [],
        metrics: {
          elbow_angle_range: { min: null, max: null, at_release: h.angles.elbow },
          knee_angle_range: { min: null, max: null },
          release_frame: 0,
          release_timestamp: 0,
        },
        frameData: [],
      } : undefined,
    } as AnalysisSession]
  })
}

function legacySignature(session: AnalysisSession): string {
  const date = new Date(session.date)
  const day = Number.isNaN(date.getTime()) ? session.date : date.toISOString().slice(0, 10)
  return `${day}:${session.analysisData.overallScore}`
}

/**
 * Merge database rows with richer local sessions. Modern rows reconcile by the
 * exact client session id. Legacy rows use a counted fallback, so two genuine
 * same-day/same-score sessions are never collapsed into one by a Set.
 */
export function mergeLocalAndServerSessions(
  localSessions: AnalysisSession[],
  serverSessions: AnalysisSession[],
): AnalysisSession[] {
  const localIds = new Set(localSessions.map((session) => session.id))
  const exactServerIds = new Set(
    serverSessions
      .filter((session) => !session.id.startsWith("server-") && localIds.has(session.id))
      .map((session) => session.id),
  )
  const legacyCounts = new Map<string, number>()
  localSessions.forEach((session) => {
    if (exactServerIds.has(session.id)) return
    const key = legacySignature(session)
    legacyCounts.set(key, (legacyCounts.get(key) || 0) + 1)
  })

  const unmatchedServer = serverSessions.filter((session) => {
    if (localIds.has(session.id)) return false
    if (!session.id.startsWith("server-")) return true
    const key = legacySignature(session)
    const remaining = legacyCounts.get(key) || 0
    if (remaining === 0) return true
    legacyCounts.set(key, remaining - 1)
    return false
  })

  return [...localSessions, ...unmatchedServer].sort((a, b) => b.timestamp - a.timestamp)
}

export interface HistoricalMetricSession {
  date: Date
  score: number | null
  elbowAngle: number | null
  kneeAngle: number | null
  releaseAngle: number | null
  consistency: number | null
  formScore: number | null
  balanceScore: number | null
  releaseScore: number | null
}

export interface HistoricalChartPoint extends HistoricalMetricSession {
  dateLabel: string
  sessionCount: number
}

function averageMeasured(values: Array<number | null>): number | null {
  const measured = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value))
  if (measured.length === 0) return null
  return Math.round(measured.reduce((sum, value) => sum + value, 0) / measured.length)
}

/** Build chart rows exclusively from persisted/measured nullable metrics. */
export function buildHistoricalChartData(
  sessions: HistoricalMetricSession[],
): HistoricalChartPoint[] {
  const grouped = new Map<string, HistoricalMetricSession[]>()
  sessions.forEach((session) => {
    if (Number.isNaN(session.date.getTime())) return
    const key = session.date.toISOString().slice(0, 10)
    grouped.set(key, [...(grouped.get(key) || []), session])
  })

  return Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([, rows]) => {
      const date = rows[0].date
      return {
        date,
        dateLabel: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        sessionCount: rows.length,
        score: averageMeasured(rows.map((row) => row.score)),
        elbowAngle: averageMeasured(rows.map((row) => row.elbowAngle)),
        kneeAngle: averageMeasured(rows.map((row) => row.kneeAngle)),
        releaseAngle: averageMeasured(rows.map((row) => row.releaseAngle)),
        consistency: averageMeasured(rows.map((row) => row.consistency)),
        formScore: averageMeasured(rows.map((row) => row.formScore)),
        balanceScore: averageMeasured(rows.map((row) => row.balanceScore)),
        releaseScore: averageMeasured(rows.map((row) => row.releaseScore)),
      }
    })
}

/** A minimal scored record used to compute aggregate analytics. */
export interface ScoredRecord {
  timestamp: number
  score: number
}

export interface CardAnalyticsData {
  totalSessions: number
  averageScore: number
  progressPercent: number
  trendDirection: "up" | "down" | "stable"
  trendPercent: number
  currentStreak: number
  bestStreak: number
  thisWeekSessions: number
  lastWeekSessions: number
  totalPracticeMinutes: number
  activeDays: number[]
}

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Compute the aggregate analytics shape consumed by AnalyticsCardGame from a set
 * of scored records (merged local + server). Returns null when there are zero
 * records so the UI can render an honest empty state rather than a fabricated
 * number (audit: never show a hardcoded score when there is no real data).
 */
export function computeCardAnalytics(
  records: ScoredRecord[]
): CardAnalyticsData | null {
  const valid = records
    .filter((r) => Number.isFinite(r.timestamp) && Number.isFinite(r.score))
    .sort((a, b) => a.timestamp - b.timestamp)

  if (valid.length === 0) return null

  const scores = valid.map((r) => r.score)
  const totalSessions = valid.length
  const averageScore = Math.round(
    scores.reduce((a, b) => a + b, 0) / scores.length
  )

  const first = scores[0]
  const last = scores[scores.length - 1]
  const progressPercent = Math.round(last - first)

  // Trend: compare the most recent score against the score ~5 sessions back.
  const lookback = valid[Math.max(0, valid.length - 6)].score
  const trendDelta = last - lookback
  const trendDirection: "up" | "down" | "stable" =
    trendDelta > 2 ? "up" : trendDelta < -2 ? "down" : "stable"
  const trendPercent = Math.abs(Math.round(trendDelta))

  // Unique active calendar days (local time) for streak + week counts.
  const now = Date.now()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const todayMs = startOfToday.getTime()

  const dayKeys = Array.from(
    new Set(
      valid.map((r) => {
        const d = new Date(r.timestamp)
        d.setHours(0, 0, 0, 0)
        return d.getTime()
      })
    )
  ).sort((a, b) => a - b)

  // Current streak: consecutive days ending today or yesterday.
  let currentStreak = 0
  if (dayKeys.length > 0) {
    const lastDay = dayKeys[dayKeys.length - 1]
    if (lastDay === todayMs || lastDay === todayMs - DAY_MS) {
      currentStreak = 1
      for (let i = dayKeys.length - 1; i > 0; i--) {
        if (dayKeys[i] - dayKeys[i - 1] === DAY_MS) currentStreak++
        else break
      }
    }
  }

  // Best streak: longest run of consecutive days.
  let bestStreak = dayKeys.length > 0 ? 1 : 0
  let run = 1
  for (let i = 1; i < dayKeys.length; i++) {
    if (dayKeys[i] - dayKeys[i - 1] === DAY_MS) {
      run++
      if (run > bestStreak) bestStreak = run
    } else {
      run = 1
    }
  }

  const weekAgo = now - 7 * DAY_MS
  const twoWeeksAgo = now - 14 * DAY_MS
  const thisWeekSessions = valid.filter((r) => r.timestamp >= weekAgo).length
  const lastWeekSessions = valid.filter(
    (r) => r.timestamp >= twoWeeksAgo && r.timestamp < weekAgo
  ).length

  // Active day-of-month numbers for the current month.
  const thisMonth = new Date().getMonth()
  const thisYear = new Date().getFullYear()
  const activeDays = Array.from(
    new Set(
      valid
        .map((r) => new Date(r.timestamp))
        .filter((d) => d.getMonth() === thisMonth && d.getFullYear() === thisYear)
        .map((d) => d.getDate())
    )
  ).sort((a, b) => a - b)

  return {
    totalSessions,
    averageScore,
    progressPercent,
    trendDirection,
    trendPercent,
    currentStreak,
    bestStreak,
    thisWeekSessions,
    lastWeekSessions,
    // Practice duration isn't tracked for still-image analyses; report 0 rather
    // than inventing a number.
    totalPracticeMinutes: 0,
    activeDays,
  }
}
