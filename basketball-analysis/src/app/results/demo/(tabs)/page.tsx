"use client"

/**
 * /results/demo — canonical ShotIQ results overview (the post-sign-in landing
 * page). Replaces the 5,144-line legacy black/orange index; every capability
 * it exposed remains reachable: uploads run through the canonical /analyze
 * workspace (preserved MediaPipe flow), live capture through /video-analysis,
 * and the detail surfaces live in the sibling tabs rendered by this group's
 * canonical shell.
 *
 * Contract kept from the e2e suite: with no analyses, an honest empty state
 * (`analysis-empty-state`) and zero fabricated elite comparisons.
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Crosshair, ImagePlus, Video, Radio, ChevronRight, Activity, MoreVertical,
} from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import {
  TrendLine, PhaseGlyph, SectionLabel, Card, MediaSurface, Stat,
} from "@/components/shotiq/ShotIQShell"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
}

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

export default function ResultsOverviewPage() {
  const authUser = useAuthStore((s) => s.user)
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [recent, setRecent] = useState<{ title: string; when: string; style: string; score: number | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    fetch("/api/analysis-history?limit=10", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success) return
        setStats(d.stats ?? null)
        setRecent((d.history ?? []).slice(0, 3).map((a: { title?: string; createdAt?: string; shotType?: string; score?: number }) => ({
          title: a.title || "Shot analysis",
          when: a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
          style: a.shotType || "Catch & Shoot",
          score: a.score ?? null,
        })))
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const displayName = authUser?.displayName || authUser?.firstName || "Shooter"
  const hasData = !!stats && stats.totalAnalyses > 0
  const score = hasData ? Math.round(stats!.latestScore ?? stats!.averageScore ?? 0) : null
  const improvement = hasData && stats!.improvementRate != null
    ? `${stats!.improvementRate >= 0 ? "+" : ""}${stats!.improvementRate.toFixed(1)}%` : "—"
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  return (
    <div data-testid="screen-results-overview">
      {/* header + actions */}
      <div className="flex items-center gap-[20px]">
        <div className="mr-auto">
          <h1 className="shotiq-display text-[50px] leading-[52px]">TODAY&apos;S SHOT ROOM</h1>
          <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">{today}</p>
        </div>
        <Link href="/analyze" data-testid="cta-analyze-shot"
              className="flex h-[54px] items-center gap-[12px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
          <Crosshair className="h-[18px] w-[18px]" /> Analyze shot
        </Link>
        {[["Upload image", "/analyze", ImagePlus], ["Upload video", "/analyze", Video], ["Live camera", "/video-analysis", Radio]].map(([t, href, I]) => {
          const Icon = I as typeof ImagePlus
          return (
            <Link key={String(t)} href={String(href)}
                  className="flex h-[54px] items-center gap-[12px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[20px] text-[14px]">
              <Icon className="h-[24px] w-[24px]" strokeWidth={1.4} /> {String(t)}
            </Link>
          )
        })}
      </div>

      <div className="mt-[20px] flex gap-[24px]">
        {/* latest analysis / empty state */}
        <div className="w-[560px] shrink-0">
          <SectionLabel>LATEST ANALYSIS</SectionLabel>
          {hasData ? (
            <>
              <MediaSurface width={560} height={348} className="mt-[10px]" />
              <div className="mt-[12px] flex items-center justify-between px-[8px]">
                {PHASES.map((p) => (
                  <div key={p} className="text-center">
                    <PhaseGlyph active={p === "RELEASE"} />
                    <div className={`mt-[4px] text-[10px] tracking-[0.06em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <Card data-testid="analysis-empty-state"
                  className="mt-[10px] flex h-[400px] flex-col items-center justify-center px-[40px] text-center">
              <PhaseGlyph size={56} />
              <div className="mt-[16px] text-[20px] font-semibold">No analyses yet</div>
              <p className="mt-[6px] text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
                {loading ? "Checking your history…" : `Welcome, ${displayName}. Upload or capture a shot and your form score, flaws and elite comparison will live here.`}
              </p>
              <Link href="/analyze"
                    className="mt-[18px] flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
                <Crosshair className="h-[17px] w-[17px]" /> Analyze my first shot
              </Link>
            </Card>
          )}
        </div>

        {/* score + session column */}
        <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pl-[24px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="shotiq-numeric text-[64px] leading-[68px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</div>
          <div className="h-[7px] w-[220px] rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
          </div>
          <p className="mt-[8px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {hasData ? "Keep building consistency." : "Your score appears after your first analysis."}
          </p>

          <SectionLabel className="mt-[22px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">LATEST SESSION</SectionLabel>
          <div className="mt-[10px] flex items-center gap-[28px]">
            <Stat value={hasData ? String(stats!.totalAnalyses) : "0"} label="ANALYSES" />
            <Stat value={score != null ? String(score) : "—"} label="BEST FORM" />
            <Stat value={improvement} label="TREND" />
            <div className="ml-auto text-right">
              <TrendLine points={hasData ? [3, 2.6, 3.4, 3, 4] : [1, 1, 1, 1, 1]} width={100} height={36} />
              <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{hasData ? `${improvement} vs last session` : ""}</div>
            </div>
          </div>

          <SectionLabel className="mt-[22px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">NEXT WORKOUT</SectionLabel>
          <Card className="mt-[10px] flex items-center gap-[16px] px-[18px] py-[14px]">
            <span className="grid h-[44px] w-[44px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
              <Activity className="h-[20px] w-[20px] text-white" strokeWidth={1.8} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[15px] font-semibold">Quick Release Builder</div>
              <div className="text-[12px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
            </div>
            <Link href="/results/demo/training" aria-label="Open training">
              <ChevronRight className="h-[18px] w-[18px] text-[var(--shotiq-color-graphite)]" />
            </Link>
          </Card>
        </div>
      </div>

      {/* recent analyses */}
      <div className="mt-[22px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[14px]">
        <SectionLabel>RECENT ANALYSES</SectionLabel>
        <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
      </div>
      <div className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]">
        {recent.map((r, i) => (
          <div key={i} className="flex items-center gap-[16px] py-[10px]">
            <MediaSurface width={104} height={58} />
            <div className="w-[240px]">
              <div className="text-[15px] font-semibold">{r.title}</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.when} · {r.style}</div>
            </div>
            <Stat value={r.score != null ? String(Math.round(r.score)) : "—"} label="FORM SCORE" valueClass="text-[22px] leading-[24px]" />
            <MoreVertical className="ml-auto h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
          </div>
        ))}
        {!recent.length && !loading && (
          <p className="py-[18px] text-[13px] text-[var(--shotiq-color-graphite)]">
            Your analyses will appear here once you&apos;ve run one.
          </p>
        )}
      </div>
    </div>
  )
}
