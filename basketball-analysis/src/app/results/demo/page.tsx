"use client"

/**
 * /results/demo — canonical 083-web-analysis-overview.
 *
 * Per-analysis workspace: annotated shot photo + frame scrubber, phase strip,
 * mechanics-at-release, primary coaching target / key insight / elite match,
 * and the analysis-summary / top-flaw / next-training strip.
 *
 * Contract kept from the e2e suite: with no analyses, an honest empty state
 * (`analysis-empty-state`) and zero fabricated elite comparisons. With data,
 * the canonical demo persona values are painted (round-1 precedent).
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft, ChevronLeft, ChevronRight, Crosshair, Maximize, Scan, Diamond,
  User, Columns, Route, Smile, Share2, Download, Settings, Check,
} from "lucide-react"
import { SectionLabel, Card, PhaseGlyph, TrendLine } from "@/components/shotiq/ShotIQShell"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
}

const PHASES: { label: string; time: string }[] = [
  { label: "SETUP", time: "0:00 – 0:02" },
  { label: "LOAD", time: "0:02 – 0:04" },
  { label: "RISE", time: "0:04 – 0:06" },
  { label: "RELEASE", time: "0:06 – 0:07" },
  { label: "FOLLOW-THROUGH", time: "0:07 – 0:10" },
]

const MECHANICS = [
  { icon: "/images/canonical/083-mech-1.png", name: "Elbow Angle", value: "172°", ideal: "160° – 180°" },
  { icon: "/images/canonical/083-mech-2.png", name: "Wrist Angle", value: "21°", ideal: "15° – 30°" },
  { icon: "/images/canonical/083-mech-3.png", name: "Release Height", value: "8’6”", ideal: "7’8” – 8’8”" },
  { icon: "/images/canonical/083-mech-4.png", name: "Body Alignment", value: "2°", ideal: "−5° – 5°" },
]

/** 083's own left rail: icon + tracked-caps label rows, Settings pinned. */
function OverviewRail({ onShare, onExport, shared }: {
  onShare: () => void; onExport: () => void; shared: boolean
}) {
  const rows: { label: string; icon: React.ElementType; href?: string; onClick?: () => void }[] = [
    { label: "ANALYSIS", icon: Scan, href: "/results/demo/analysis" },
    { label: "FLAWS", icon: Diamond, href: "/results/demo/flaws" },
    { label: "PLAYER", icon: User, href: "/results/demo/player" },
    { label: "COMPARE", icon: Columns, href: "/results/demo/compare" },
    { label: "TRAINING", icon: Route, href: "/results/demo/training" },
    { label: "GOALS", icon: Smile, href: "/results/demo/goals" },
  ]
  const item = "flex h-[24px] items-center gap-[20px] pl-[28px] text-[11px] font-bold tracking-[0.09em] text-[var(--shotiq-color-ink)]"
  return (
    <nav data-testid="region-sidebar" aria-label="Analysis workspace"
         className="flex w-[124px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)] pt-[40px]">
      {rows.map((r) => (
        <Link key={r.label} href={r.href!} className={`${item} mb-[36px]`}>
          <r.icon className="h-[21px] w-[21px] shrink-0" strokeWidth={1.5} />
          {r.label}
        </Link>
      ))}
      <div className="mx-[20px] mb-[34px] border-t border-[var(--shotiq-color-rule)]" />
      <button type="button" onClick={onShare} data-testid="overview-share" className={`${item} mb-[36px]`}>
        {shared ? <Check className="h-[21px] w-[21px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" strokeWidth={1.7} />
                : <Share2 className="h-[21px] w-[21px] shrink-0" strokeWidth={1.5} />}
        {shared ? "COPIED" : "SHARE"}
      </button>
      <button type="button" onClick={onExport} data-testid="overview-export" className={item}>
        <Download className="h-[21px] w-[21px] shrink-0" strokeWidth={1.5} />
        EXPORT
      </button>
      <div className="flex-1" />
      <Link href="/settings" className={`${item} mb-[28px]`}>
        <Settings className="h-[21px] w-[21px] shrink-0" strokeWidth={1.5} />
        SETTINGS
      </Link>
    </nav>
  )
}

export default function ResultsOverviewPage() {
  const router = useRouter()
  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [index, setIndex] = useState(3) // canonical "3 OF 24"
  const [shared, setShared] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch("/api/analysis-history?limit=10", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !d?.success) return
        setStats(d.stats ?? null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const hasData = !!stats && stats.totalAnalyses > 0
  const total = 24
  const share = async () => {
    try { await navigator.clipboard.writeText(window.location.href); setShared(true); setTimeout(() => setShared(false), 1800) }
    catch { /* clipboard unavailable */ }
  }
  const doExport = () => { window.print() }

  return (
    <ShotIQShell active="Analyze"
      sidebar={<OverviewRail onShare={share} onExport={doExport} shared={shared} />}>
    <div data-testid="screen-results-overview" className="pl-[21px] pr-[24px] pt-[10px]">
      {/* header */}
      <div className="flex items-start">
        <button type="button" aria-label="Back" onClick={() => router.push("/dashboard")}
                className="mt-[22px] mr-[16px]">
          <ArrowLeft className="h-[22px] w-[22px]" strokeWidth={2} />
        </button>
        <div className="mr-auto">
          <h1 className="shotiq-display text-[46px] leading-[48px]">ANALYSIS OVERVIEW</h1>
          <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
            May 12, 2025&ensp;·&ensp;8:24 AM&ensp;·&ensp;Catch &amp; Shoot&ensp;·&ensp;Right Hand
          </p>
        </div>
        <div className="mt-[18px] flex items-center gap-[18px]">
          <button type="button" data-testid="overview-prev"
                  onClick={() => setIndex((i) => Math.max(1, i - 1))}
                  className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[12px] font-bold tracking-[0.05em]">
            <ChevronLeft className="h-[13px] w-[13px]" /> PREV
          </button>
          <div className="w-[110px] text-center">
            <div className="text-[14px] font-bold tracking-[0.04em]"><span className="shotiq-numeric">{index}</span> OF <span className="shotiq-numeric">{total}</span></div>
            <Link href="/results/demo/history" className="mt-[4px] block whitespace-nowrap text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses</Link>
          </div>
          <button type="button" data-testid="overview-next"
                  onClick={() => setIndex((i) => Math.min(total, i + 1))}
                  className="flex h-[34px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[12px] font-bold tracking-[0.05em]">
            NEXT <ChevronRight className="h-[13px] w-[13px]" />
          </button>
        </div>
      </div>

      {!hasData && !loading ? (
        <Card data-testid="analysis-empty-state"
              className="mt-[16px] flex h-[420px] flex-col items-center justify-center px-[40px] text-center">
          <PhaseGlyph size={56} />
          <div className="mt-[16px] text-[20px] font-semibold">No analyses yet</div>
          <p className="mt-[6px] text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
            Upload or capture a shot and your form score, flaws and elite comparison will live here.
          </p>
          <Link href="/analyze"
                className="mt-[18px] flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
            <Crosshair className="h-[17px] w-[17px]" /> Analyze my first shot
          </Link>
        </Card>
      ) : (
      <>
      <div className="mt-[10px] flex gap-[24px]">
        {/* media column */}
        <div className="w-[573px] shrink-0">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/083-hero.png" alt="Analyzed shot frame with skeleton overlay"
                 className="block w-[573px] rounded-[4px]" width={573} height={369} />
            <button type="button" aria-label="Play"
                    className="absolute -bottom-[23px] left-[1px] grid h-[32px] w-[32px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white shadow-[0_2px_6px_rgba(17,17,17,0.12)]">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1.5 L10.5 6 L2.5 10.5 Z" fill="var(--shotiq-color-ink)" /></svg>
            </button>
          </div>
          {/* frame scrubber */}
          <div className="mt-[9px] flex items-center">
            <div className="relative ml-[38px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-filmstrip.png" alt="" className="block h-[41px] w-[425px]" width={425} height={41} />
              <span className="absolute -top-[9px] left-[59%] h-[15px] w-[15px] -translate-x-1/2 rounded-full border border-[var(--shotiq-color-rule)] bg-white shadow-[0_1px_3px_rgba(17,17,17,0.25)]" />
            </div>
            <span className="shotiq-numeric ml-[32px] text-[13px]">0:07 <span className="text-[var(--shotiq-color-graphite)]">/ 0:24</span></span>
            <button type="button" aria-label="Fullscreen" className="ml-auto">
              <Maximize className="h-[16px] w-[16px]" strokeWidth={1.8} />
            </button>
          </div>
          {/* phase strip */}
          <div className="mt-[14px] flex items-start">
            {PHASES.map((p, i) => {
              const active = p.label === "RELEASE"
              return (
                <React.Fragment key={p.label}>
                  {i > 0 && (
                    <div className="mt-[15px] flex flex-1 items-center gap-[4px] px-[4px]">
                      <span className={`h-px flex-1 border-t ${i === 3 || i === 4 ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-dashed border-[var(--shotiq-color-muted)]"}`} />
                      <span className={`h-[8px] w-[8px] rounded-full ${i === 3 || i === 4 ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-muted)]"}`} />
                      <span className={`h-px flex-1 border-t ${i === 3 || i === 4 ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-dashed border-[var(--shotiq-color-muted)]"}`} />
                    </div>
                  )}
                  <div className="shrink-0 text-center" style={{ width: i === 4 ? 108 : 78 }}>
                    <PhaseGlyph active={active} size={32} />
                    <div className={`mt-[4px] whitespace-nowrap text-[10px] font-bold tracking-[0.04em] ${active ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{p.label}</div>
                    <div className="shotiq-numeric mt-[1px] whitespace-nowrap text-[10px] text-[var(--shotiq-color-graphite)]">{p.time}</div>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* score + coaching card */}
        <Card className="flex min-w-0 flex-1 rounded-[8px]">
          {/* form score + mechanics */}
          <div className="w-[290px] shrink-0 border-r border-[var(--shotiq-color-rule)] px-[17px] pt-[16px]">
            <SectionLabel>FORM SCORE</SectionLabel>
            <div className="mt-[4px] flex items-end gap-[6px]">
              <span className="shotiq-numeric text-[60px] leading-[54px] text-[var(--shotiq-color-shotiqOrange)]">82</span>
              <span className="shotiq-numeric text-[19px] text-[var(--shotiq-color-muted)]">/100</span>
            </div>
            <div className="mt-[10px] h-[9px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
            </div>
            <div className="shotiq-display mt-[10px] text-[18px] text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
            <p className="mt-[2px] w-[110px] text-[13px] leading-[18px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</p>

            <SectionLabel className="mt-[14px]">MECHANICS AT RELEASE</SectionLabel>
            <div className="mt-[2px]">
              {MECHANICS.map((m) => (
                <div key={m.name} className="flex items-center border-b border-[var(--shotiq-color-rule)] py-[5px] last:border-b-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={m.icon} alt="" className="h-[30px] w-[28px] object-contain" />
                  <span className="ml-[8px] w-[92px] text-[12px]">{m.name}</span>
                  <span className="shotiq-numeric ml-auto text-[20px]">{m.value}</span>
                  <span className="ml-[12px] w-[62px] text-right">
                    <span className="block text-[11px] font-bold leading-[13px] text-[var(--shotiq-color-confirmGreen)]">IDEAL</span>
                    <span className="shotiq-numeric block text-[10px] leading-[12px] text-[var(--shotiq-color-graphite)]">{m.ideal}</span>
                  </span>
                </div>
              ))}
            </div>
            <Link href="/results/demo/biomechanics"
                  className="mt-[6px] mb-[8px] block text-center text-[13px] font-medium text-[var(--shotiq-color-analysisBlue)]">
              View all mechanics&ensp;›
            </Link>
          </div>

          {/* coaching target / key insight / elite match */}
          <div className="min-w-0 flex-1 px-[20px] pt-[16px]">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            <Link href="/results/demo/goals" className="mt-[2px] flex items-center justify-between">
              <span className="whitespace-nowrap text-[18px] font-semibold">Keep elbow stacked through release</span>
              <ChevronRight className="h-[17px] w-[17px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </Link>
            <span className="mt-[8px] inline-block rounded-[5px] border border-[var(--shotiq-color-confirmGreen)] px-[10px] py-[3px] text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
            <p className="mt-[8px] text-[13px] text-[var(--shotiq-color-graphite)]">Improve release consistency and arm alignment</p>
            <div className="mt-[6px] flex items-center gap-[10px]">
              <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
              </div>
              <span className="shotiq-numeric text-[13px]">72%</span>
            </div>

            <div className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <SectionLabel>KEY INSIGHT</SectionLabel>
              <p className="mt-[4px] text-[13px] leading-[19px] text-[var(--shotiq-color-graphite)]">
                Your elbow is slightly flaring late in release. Keeping it stacked will help improve consistency and shot accuracy.
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/083-insight.png" alt="Current 172 degrees versus ideal 180 degrees elbow position"
                   className="mx-auto mt-[2px] block h-[128px] w-[293px]" width={293} height={128} />
            </div>

            <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <div className="flex items-start justify-between">
                <div>
                  <SectionLabel>ELITE MATCH</SectionLabel>
                  <div className="mt-[6px] text-[17px] font-semibold">Trae Young</div>
                  <div className="mt-[2px] text-[13px] font-medium text-[var(--shotiq-color-confirmGreen)]">92% Similarity</div>
                  <Link href="/results/demo/compare"
                        className="mt-[10px] inline-block text-[13px] font-medium text-[var(--shotiq-color-analysisBlue)]">
                    View comparison&ensp;›
                  </Link>
                </div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/083-elite.png" alt="Trae Young shooting form"
                     className="h-[106px] w-[151px] rounded-[6px] object-cover" width={151} height={106} />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* bottom strip */}
      <div className="mt-[12px] mb-[14px] flex gap-[16px]">
        <Card className="flex h-[138px] w-[590px] shrink-0 flex-col px-[18px] pt-[12px]">
          <SectionLabel>ANALYSIS SUMMARY</SectionLabel>
          <div className="mt-[12px] flex flex-1 items-start">
            {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"], ["82", "FORM SCORE"]].map(([v, l], i) => (
              <div key={l} className={`pr-[20px] text-center ${i > 0 ? "border-l border-[var(--shotiq-color-rule)] pl-[20px]" : ""}`}>
                <div className="shotiq-numeric text-[27px] leading-[30px]">{v}</div>
                <div className="mt-[4px] text-[10px] tracking-[0.07em] text-[var(--shotiq-color-graphite)]">{l}</div>
                {l === "FORM SCORE" && (
                  <div className="mt-[6px] flex items-center justify-center gap-[6px] text-[12px]">
                    <span className="h-[9px] w-[9px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /> Good
                  </div>
                )}
              </div>
            ))}
            <div className="ml-auto pt-[2px] text-center">
              <div className="text-[10px] font-bold tracking-[0.07em]">TREND</div>
              <div className="flex items-end gap-[6px]">
                <TrendLine points={[2.2, 2.0, 2.8, 2.4, 3.4]} width={104} height={40} stroke="var(--shotiq-color-ink)" />
                <span className="pb-[4px] text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">+8.1%</span>
              </div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">vs last session</div>
            </div>
          </div>
        </Card>

        <Card className="h-[138px] min-w-0 flex-1 px-[16px] pt-[12px]">
          <SectionLabel>TOP FLAW</SectionLabel>
          <Link href="/results/demo/flaws" className="mt-[6px] flex items-center gap-[10px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/083-flaw-glyph.png" alt="" className="h-[80px] w-[50px] object-contain" />
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-[8px]">
                <span className="whitespace-nowrap text-[13px] font-semibold">Elbow flare at release</span>
                <span className="rounded-[4px] border border-[var(--shotiq-color-shotiqOrange)] px-[6px] py-[2px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-shotiqOrange)]">HIGH IMPACT</span>
              </span>
              <span className="mt-[6px] block text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                Elbow moves outward slightly during release, reducing alignment.
              </span>
            </span>
            <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </Link>
        </Card>

        <Card className="h-[138px] w-[370px] shrink-0 px-[18px] pt-[12px]">
          <SectionLabel>NEXT TRAINING</SectionLabel>
          <Link href="/results/demo/training" className="mt-[10px] flex items-center gap-[14px]">
            <span className="grid h-[50px] w-[50px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.6" aria-hidden="true">
                <circle cx="7" cy="15" r="2.4" /><circle cx="15" cy="7" r="2.4" /><circle cx="17" cy="16" r="1.7" />
                <path d="M8.8 13.4 L13.2 8.8 M16.2 8.8 L16.7 14.3" />
              </svg>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold">Quick Release Builder</span>
              <span className="mt-[2px] block text-[12px] text-[var(--shotiq-color-graphite)]">20 min&ensp;·&ensp;Form Focus</span>
              <span className="mt-[2px] block text-[12px] text-[var(--shotiq-color-graphite)]">Improve release speed and consistency.</span>
            </span>
            <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </Link>
        </Card>
      </div>
      </>
      )}
    </div>
    </ShotIQShell>
  )
}
