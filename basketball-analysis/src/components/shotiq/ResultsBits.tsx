"use client"

/** Small shared pieces for the canonical results screens (083-093). */
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { SectionLabel, Card, TrendLine, Stat } from "@/components/shotiq/ShotIQShell"

export interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
}

export interface HistoryItem { title: string; when: string; style: string; score: number | null }

/**
 * Chronological (oldest → newest) score series behind a newest-first history.
 * This is what the trend marks plot — never a hand-written rising placeholder.
 */
export function scoreSeries(items: { score: number | null }[], take = 8): number[] {
  return items.slice(0, take).map((i) => i.score).filter((s): s is number => s != null).reverse()
}

/** Percent change of the newest session against the one before it. */
export function sessionDelta(items: { score: number | null }[]): number | null {
  const s = items.map((i) => i.score).filter((v): v is number => v != null)
  if (s.length < 2 || !s[1]) return null
  return ((s[0] - s[1]) / s[1]) * 100
}

/** Formats a delta the way every canonical screen prints it. */
export function formatDelta(pct: number | null): string {
  return pct == null ? "—" : `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`
}

// One in-flight request per page load. Several canonical blocks (ScoreBand and
// the screen hosting it) each want the history; without this they each fired
// their own GET and could disagree about the numbers mid-render.
let historyRequest: Promise<{ stats: HistoryStats | null; items: HistoryItem[] } | null> | null = null
function loadHistory() {
  if (!historyRequest) {
    historyRequest = fetch("/api/analysis-history?limit=20", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.success) return null
        return {
          stats: (d.stats ?? null) as HistoryStats | null,
          items: ((d.history ?? []) as {
            title?: string; createdAt?: string; shotType?: string; score?: number
          }[]).map((a) => ({
            title: a.title || "Shot analysis",
            when: a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
            style: a.shotType || "Catch & Shoot",
            score: a.score ?? null,
          })),
        }
      })
      .catch(() => null)
  }
  return historyRequest
}

/** Caller-scoped history; the canonical screens show honest zeros without it. */
export function useHistory() {
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let dead = false
    loadHistory()
      .then((d) => {
        if (dead || !d) return
        setStats(d.stats)
        setItems(d.items)
      })
      .finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [])
  const hasData = (stats?.totalAnalyses ?? 0) > 0
  const score = hasData ? Math.round(stats!.latestScore ?? stats!.averageScore ?? 0) : null
  return { stats, items, loading, hasData, score }
}

/**
 * Compact form-score band used across 085/087/090.
 *
 * The stat row carries canonical's vertical hairlines and distributes across
 * the container instead of bunching left, and the trend mark plots the real
 * score history rather than a decorative rising series.
 */
export function ScoreBand({ score }: { score: number | null }) {
  const { items } = useHistory()
  const series = scoreSeries(items, 6)
  const delta = sessionDelta(items)
  const down = delta != null && delta < 0
  return (
    <Card className="flex items-center px-[22px] py-[14px]">
      <div className="shrink-0 pr-[24px]">
        <SectionLabel>FORM SCORE</SectionLabel>
        <div className="flex items-end gap-[8px]">
          <span className="shotiq-numeric text-[40px] leading-[44px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</span>
          <span className="pb-[8px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">{score != null ? "GOOD" : ""}</span>
        </div>
        <div className="h-[6px] w-[130px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
        </div>
      </div>
      <div className="flex min-w-0 flex-1 items-center divide-x divide-[var(--shotiq-color-rule)] border-l border-[var(--shotiq-color-rule)]">
        <div className="flex-1 px-[20px]"><Stat value="24" label="SHOTS" /></div>
        <div className="flex-1 px-[20px]"><Stat value="15" label="MAKES" /></div>
        <div className="flex-1 px-[20px]"><Stat value="62.5%" label="MAKE %" /></div>
        <div className="shrink-0 pl-[20px] text-right">
          <TrendLine points={series} width={92} height={32} />
          <div className={`text-[10px] ${down ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>
            {formatDelta(delta)} vs last session
          </div>
        </div>
      </div>
    </Card>
  )
}

/** Coaching-target block (right rail on 083/085). */
export function CoachingTarget() {
  return (
    <div>
      <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
      {/* The chevron is pulled out of the text's measured width — canonical sets
          this headline on one line and a gutter for the affordance was enough
          to break it in two. */}
      <div className="mt-[6px] flex items-start gap-[6px]">
        <p className="min-w-0 flex-1 text-[19px] font-semibold leading-[25px]">Keep elbow stacked through release</p>
        <Link href="/results/demo/goals" aria-label="Open goals" className="shrink-0">
          <span className="text-[var(--shotiq-color-graphite)]">›</span>
        </Link>
      </div>
      <span className="mt-[10px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[3px] text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
      <p className="mt-[8px] text-[13px] text-[var(--shotiq-color-graphite)]">Improve release consistency and arm alignment</p>
      <div className="mt-[8px] flex items-center gap-[10px]">
        <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
        </div>
        <span className="text-[12px]">72%</span>
      </div>
    </div>
  )
}
