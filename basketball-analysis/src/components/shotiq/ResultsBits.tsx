"use client"

/** Small shared pieces for the canonical results screens (083-093). */
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { SectionLabel, Card, TrendLine, Stat, PhaseGlyph } from "@/components/shotiq/ShotIQShell"

export interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
}

/** Caller-scoped history; the canonical screens show honest zeros without it. */
export function useHistory() {
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [items, setItems] = useState<{ title: string; when: string; style: string; score: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    let dead = false
    fetch("/api/analysis-history?limit=20", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead || !d?.success) return
        setStats(d.stats ?? null)
        setItems((d.history ?? []).map((a: { title?: string; createdAt?: string; shotType?: string; score?: number }) => ({
          title: a.title || "Shot analysis",
          when: a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
          style: a.shotType || "Catch & Shoot",
          score: a.score ?? null,
        })))
      })
      .catch(() => {})
      .finally(() => { if (!dead) setLoading(false) })
    return () => { dead = true }
  }, [])
  const hasData = (stats?.totalAnalyses ?? 0) > 0
  const score = hasData ? Math.round(stats!.latestScore ?? stats!.averageScore ?? 0) : null
  return { stats, items, loading, hasData, score }
}

/** Compact form-score band used across 085/087/090. */
export function ScoreBand({ score }: { score: number | null }) {
  return (
    <Card className="flex items-center gap-[24px] px-[22px] py-[14px]">
      <div>
        <SectionLabel>FORM SCORE</SectionLabel>
        <div className="flex items-end gap-[8px]">
          <span className="shotiq-numeric text-[40px] leading-[44px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</span>
          <span className="pb-[8px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">{score != null ? "GOOD" : ""}</span>
        </div>
        <div className="h-[6px] w-[130px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
        </div>
      </div>
      <div className="flex items-center gap-[22px] border-l border-[var(--shotiq-color-rule)] pl-[22px]">
        <Stat value="24" label="SHOTS" />
        <Stat value="15" label="MAKES" />
        <Stat value="62.5%" label="MAKE %" />
        <div className="text-right">
          <TrendLine points={[3, 2.6, 3.4, 3, 4.2]} width={92} height={32} />
          <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">+8.1% vs last session</div>
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
      <div className="mt-[6px] flex items-start justify-between">
        <p className="text-[19px] font-semibold leading-[25px]">Keep elbow stacked through release</p>
        <Link href="/results/demo/goals" aria-label="Open goals">
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
