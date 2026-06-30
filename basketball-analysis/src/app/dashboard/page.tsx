"use client"

/**
 * /dashboard — the REAL authenticated, per-user dashboard.
 *
 * Audit fix: the app's analytics surfaces all hung off the public `/results/demo`
 * route and were fed mock/demo data. This page is protected (middleware
 * default-deny — any route not in PUBLIC_ROUTES requires a valid session) and
 * shows the SIGNED-IN user's own data, pulled from:
 *   - GET /api/profile          → identity + profile completeness
 *   - GET /api/points           → canonical points balance + tier (via context)
 *   - GET /api/analysis-history → real per-user analysis stats (cross-device)
 *
 * Every number here is server-derived. When the user has no analyses yet we show
 * an honest empty state rather than a fabricated score.
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Trophy,
  Target,
  Activity,
  ArrowRight,
  Camera,
} from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"
import { useAuthStore } from "@/stores/authStore"
import { UserLevelCard } from "@/components/UserLevelCard"
import { AnalyticsCardGame } from "@/components/analytics/AnalyticsCardGame"
import { TIERS } from "@/lib/points/pointsConfig"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  highestScore: number | null
  lowestScore: number | null
  latestScore: number | null
  overallTrend: string
  improvementRate: number | null
}

interface ProfileSummary {
  displayName?: string
  experienceLevel?: string | null
  profileComplete?: boolean
}

function StatTile({
  label,
  value,
  suffix,
  icon,
  accent = "#FF6B35",
}: {
  label: string
  value: string | number
  suffix?: string
  icon: React.ReactNode
  accent?: string
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${accent}1A`, color: accent }}
        >
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-3xl font-black text-slate-900 tabular-nums">
          {value}
        </span>
        {suffix && <span className="text-slate-400 text-sm font-semibold">{suffix}</span>}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const points = usePoints()
  const authUser = useAuthStore((s) => s.user)

  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [profile, setProfile] = useState<ProfileSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      // Profile (identity + completeness).
      try {
        const pRes = await fetch("/api/profile", { credentials: "include" })
        if (pRes.ok) {
          const pData = await pRes.json()
          if (!cancelled && pData?.profile) {
            setProfile({
              experienceLevel: pData.profile.experienceLevel ?? null,
              profileComplete: pData.profile.profileComplete ?? false,
            })
          }
        }
      } catch {
        /* ignore */
      }

      // Analysis history stats (real, caller-scoped).
      try {
        const hRes = await fetch("/api/analysis-history?limit=100", {
          credentials: "include",
        })
        if (hRes.ok) {
          const hData = await hRes.json()
          if (!cancelled && hData?.success) {
            setStats(hData.stats ?? null)
          }
        }
      } catch {
        /* ignore */
      }

      if (!cancelled) setLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const totalPoints = points.getTotalPoints()
  const tierConfig = points.getCurrentTierConfig?.() ?? TIERS.free
  const displayName =
    authUser?.displayName ||
    authUser?.firstName ||
    authUser?.email?.split("@")[0] ||
    "Shooter"

  const trend = stats?.overallTrend ?? "insufficient_data"
  const TrendIcon =
    trend === "improving" ? TrendingUp : trend === "declining" ? TrendingDown : Minus
  const trendColor =
    trend === "improving" ? "#22c55e" : trend === "declining" ? "#ef4444" : "#94a3b8"
  const trendLabel =
    trend === "improving"
      ? "Improving"
      : trend === "declining"
        ? "Declining"
        : trend === "stable"
          ? "Stable"
          : "Not enough data"

  const hasData = !!stats && stats.totalAnalyses > 0

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#FF6B35]" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 uppercase tracking-wider">
                Welcome back, {displayName}
              </h1>
              <p className="text-slate-500 text-sm">
                Your personal shooting dashboard
              </p>
            </div>
          </div>

          <Link
            href="/results/demo"
            className="flex items-center gap-2 px-4 py-2.5 bg-[#FF6B35] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#FF5722] transition-colors"
          >
            <Camera className="w-4 h-4" />
            New Analysis
          </Link>
        </div>

        {/* Top row: Level card + points/tier summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="flex justify-center lg:justify-start">
            <UserLevelCard />
          </div>

          <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-2 gap-4 content-start">
            <StatTile
              label="Total Points"
              value={totalPoints.toLocaleString()}
              icon={<Trophy className="w-4 h-4" />}
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Current Tier
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{ backgroundColor: `${tierConfig.color}1A` }}
                >
                  <span>{tierConfig.icon}</span>
                </div>
              </div>
              <div className="text-2xl font-black uppercase" style={{ color: tierConfig.color }}>
                {tierConfig.displayName}
              </div>
            </div>

            <StatTile
              label="Total Analyses"
              value={stats?.totalAnalyses ?? 0}
              icon={<Activity className="w-4 h-4" />}
            />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                  Trend
                </span>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${trendColor}1A`, color: trendColor }}
                >
                  <TrendIcon className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl font-black uppercase" style={{ color: trendColor }}>
                {trendLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Score stats from real history */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 border-t-[#FF6B35] animate-spin mb-4" />
            <p className="text-slate-500 text-sm uppercase tracking-wider">Loading your dashboard…</p>
          </div>
        ) : hasData ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatTile
                label="Average Score"
                value={stats?.averageScore ?? "—"}
                icon={<Target className="w-4 h-4" />}
              />
              <StatTile
                label="Best Score"
                value={stats?.highestScore ?? "—"}
                icon={<Trophy className="w-4 h-4" />}
                accent="#22c55e"
              />
              <StatTile
                label="Latest Score"
                value={stats?.latestScore ?? "—"}
                icon={<Activity className="w-4 h-4" />}
              />
              <StatTile
                label="Improvement Rate"
                value={stats?.improvementRate ?? 0}
                suffix="%"
                icon={<TrendingUp className="w-4 h-4" />}
                accent="#3b82f6"
              />
            </div>

            {/* Swipeable analytics (self-loads real local + server data) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <AnalyticsCardGame />
            </div>

            <div className="flex justify-center">
              <Link
                href="/results/demo/history"
                className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-xl text-slate-600 font-bold text-sm uppercase tracking-wider hover:border-[#FF6B35]/50 hover:text-slate-900 transition-all"
              >
                View detailed analytics
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FF6B35]/10 border border-[#FF6B35]/30 flex items-center justify-center mb-4">
              <Camera className="w-8 h-8 text-[#FF6B35]" />
            </div>
            <h3 className="text-slate-900 font-bold text-lg uppercase tracking-wider mb-1">
              No analyses yet
            </h3>
            <p className="text-slate-500 text-sm max-w-sm mb-6">
              Run your first shot analysis to unlock your personal stats, trends, and
              progress tracking — synced across all your devices.
            </p>
            <Link
              href="/results/demo"
              className="flex items-center gap-2 px-5 py-3 bg-[#FF6B35] text-white rounded-xl font-bold text-sm uppercase tracking-wider hover:bg-[#FF5722] transition-colors"
            >
              <Camera className="w-4 h-4" />
              Start your first analysis
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
