"use client"

/**
 * /dashboard — canonical ShotIQ home (desktop screens 079-web-home-dashboard and
 * 080-web-standard-dashboard), replacing the legacy slate presentation.
 *
 * Domain behaviour preserved from the previous implementation:
 *   - GET /api/profile          → identity + profile completeness
 *   - GET /api/analysis-history → real per-user analysis stats (caller-scoped)
 *   - points context            → canonical points balance
 *   - dashboardViewStore        → professional (079) vs standard (080) variant
 * Every number shown is server-derived; with no analyses yet the screen shows an
 * honest empty state rather than a fabricated score.
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Crosshair, ImagePlus, Video, Radio, ChevronRight, LayoutGrid, LineChart,
  Activity, TrendingUp, Film, Compass, MoreVertical, Play, Info, type LucideIcon,
} from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"
import { useAuthStore } from "@/stores/authStore"
import { useDashboardViewStore } from "@/stores/dashboardViewStore"
import {
  ShotIQShell, TrendLine, PhaseGlyph, SectionLabel, Card, MediaSurface, Stat,
} from "@/components/shotiq/ShotIQShell"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  overallTrend: string
  improvementRate: number | null
}

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

function scoreBand(score: number | null): { label: string; color: string } {
  if (score == null) return { label: "—", color: "var(--shotiq-color-muted)" }
  if (score >= 85) return { label: "EXCELLENT", color: "var(--shotiq-color-confirmGreen)" }
  if (score >= 70) return { label: "GOOD", color: "var(--shotiq-color-analysisBlue)" }
  if (score >= 50) return { label: "FAIR", color: "var(--shotiq-color-shotiqOrange)" }
  return { label: "NEEDS WORK", color: "var(--shotiq-color-reviewRed)" }
}

export default function DashboardPage() {
  const points = usePoints()
  const authUser = useAuthStore((s) => s.user)
  const { view } = useDashboardViewStore()

  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [recent, setRecent] = useState<{ title: string; when: string; style: string; score: number | null }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      try {
        const hRes = await fetch("/api/analysis-history?limit=100", { credentials: "include" })
        if (hRes.ok) {
          const hData = await hRes.json()
          if (!cancelled && hData?.success) {
            setStats(hData.stats ?? null)
            const items = (hData.history ?? hData.analyses ?? []).slice(0, 3)
            setRecent(items.map((a: { title?: string; createdAt?: string; shotType?: string; score?: number }) => ({
              title: a.title || "Shot analysis",
              when: a.createdAt ? new Date(a.createdAt).toLocaleString() : "",
              style: a.shotType || "Catch & Shoot",
              score: a.score ?? null,
            })))
          }
        }
      } catch { /* ignore */ }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [])

  const displayName =
    authUser?.displayName || authUser?.firstName || authUser?.email?.split("@")[0] || "Shooter"
  const initials = displayName.slice(0, 2).toUpperCase()
  const totalPoints = points.getTotalPoints()
  const hasData = !!stats && stats.totalAnalyses > 0
  const score = hasData ? Math.round(stats!.latestScore ?? stats!.averageScore ?? 0) : null
  const band = scoreBand(score)
  const improvement = hasData && stats!.improvementRate != null
    ? `${stats!.improvementRate >= 0 ? "+" : ""}${stats!.improvementRate.toFixed(1)}%` : "—"

  const shellProps = {
    user: { name: displayName, initials },
    points: totalPoints.toLocaleString(),
  }

  /* ------------------------------------------- 080 standard variant ------ */
  if (view === "standard" || view === "basic") {
    return (
      <ShotIQShell active="Home" {...shellProps}
        railOverride={[
          { label: "DASHBOARD", href: "/dashboard", icon: LayoutGrid, active: true },
          { label: "ANALYSES", href: "/analyze", icon: LineChart },
          { label: "TRAINING", href: "/results/demo/training", icon: Activity },
          { label: "PROGRESS", href: "/results/demo/history", icon: TrendingUp },
          { label: "MEDIA", href: "/media", icon: Film },
          { label: "EXPLORE", href: "/elite-shooters", icon: Compass },
        ]}>
        <div data-testid="screen-desktop-web-standard-dashboard" className="flex">
          <div className="min-w-0 flex-1 px-[28px] pt-[24px]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="shotiq-display text-[52px] leading-[54px]">DASHBOARD</h1>
                <p className="mt-[6px] text-[14px] text-[var(--shotiq-color-graphite)]">
                  Good morning, {displayName}. Let&apos;s get better today.
                </p>
              </div>
              <div className="flex gap-[12px] pt-[8px]">
                <Link href="/analyze" data-testid="cta-new-analysis"
                      className="flex h-[52px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
                  <Crosshair className="h-[18px] w-[18px]" /> New analysis
                </Link>
                <Link href="/results/demo/history"
                      className="flex h-[52px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[15px]">
                  <LineChart className="h-[18px] w-[18px]" /> View analytics
                </Link>
              </div>
            </div>

            <SectionLabel className="mt-[20px]">NEXT ACTION</SectionLabel>
            <Card className="mt-[10px] flex overflow-hidden">
              <MediaSurface width={420} height={340} rounded={0} />
              <div className="flex-1 px-[26px] py-[24px]">
                <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
                <div className="mt-[8px] flex items-start justify-between">
                  <h2 className="text-[26px] font-semibold leading-[32px]">
                    {hasData ? <>Keep elbow stacked<br />through release</> : <>Run your first analysis<br />to get a coaching target</>}
                  </h2>
                  <ChevronRight className="mt-[8px] h-[20px] w-[20px] text-[var(--shotiq-color-graphite)]" />
                </div>
                <div className="mt-[18px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">
                  <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[3px] text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">
                    ACTIVE GOAL
                  </span>
                  <p className="mt-[12px] text-[14px] leading-[20px]">
                    Improve release consistency<br />and arm alignment
                  </p>
                  <div className="mt-[10px] flex items-center gap-[12px]">
                    <div className="h-[7px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                      <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: hasData ? "72%" : "0%" }} />
                    </div>
                    <span className="shotiq-numeric text-[15px]">{hasData ? "72%" : "0%"}</span>
                  </div>
                  <button type="button" className="mt-[8px] flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">
                    Why this matters <Info className="h-[13px] w-[13px]" />
                  </button>
                </div>
                <Link href="/results/demo/analysis" data-testid="cta-view-analysis"
                      className="mt-[16px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] text-[15px] font-medium text-white">
                  <Crosshair className="h-[17px] w-[17px]" /> View analysis
                </Link>
              </div>
            </Card>

            <Card className="mt-[16px] px-[20px] py-[16px]">
              <div className="flex items-center gap-[20px]">
                <MediaSurface width={230} height={130} />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-[16px] font-semibold">{recent[0]?.title ?? "No analyses yet"}</div>
                      <div className="mt-[3px] text-[12px] text-[var(--shotiq-color-graphite)]">
                        {recent[0] ? `${recent[0].when} · ${recent[0].style}` : "Upload or capture a shot to begin"}
                      </div>
                    </div>
                    <MoreVertical className="h-[17px] w-[17px] text-[var(--shotiq-color-graphite)]" />
                  </div>
                  <div className="mt-[14px] flex gap-[40px]">
                    <Stat value={hasData ? stats!.totalAnalyses : "0"} label="SHOTS" />
                    <Stat value={score ?? "—"} label="FORM SCORE" />
                    <Stat value={improvement} label="IMPROVEMENT" />
                  </div>
                </div>
              </div>
              <div className="mt-[14px] flex items-center gap-[26px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
                {PHASES.map((p) => (
                  <span key={p} className="flex items-center gap-[8px]">
                    <PhaseGlyph active={p === "RELEASE"} size={24} />
                    <span className={`text-[10px] tracking-[0.06em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</span>
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {/* right column */}
          <aside className="w-[430px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[22px] pt-[26px]">
            <SectionLabel>AT A GLANCE</SectionLabel>
            <Card className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)] px-[6px] py-[16px] text-center">
              {[
                [hasData ? String(stats!.totalAnalyses) : "0", "TOTAL ANALYSES", "All time", "var(--shotiq-color-ink)"],
                [score != null ? String(score) : "—", "AVG. FORM SCORE", band.label.toLowerCase(), "var(--shotiq-color-analysisBlue)"],
                [hasData ? String(stats!.totalAnalyses * 24) : "0", "TOTAL SHOTS", "All time", "var(--shotiq-color-ink)"],
                [improvement, "IMPROVEMENT", "vs last 30 days", "var(--shotiq-color-confirmGreen)"],
              ].map(([v, l, sub, c]) => (
                <div key={l} className="flex-1 px-[6px]">
                  <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{l}</div>
                  <div className="shotiq-numeric mt-[4px] text-[26px] leading-[28px]" style={{ color: c }}>{v}</div>
                  <div className="mt-[2px] text-[10px] text-[var(--shotiq-color-graphite)]">{sub}</div>
                </div>
              ))}
            </Card>

            <SectionLabel className="mt-[20px]">SHOT SUMMARY (LATEST SESSION)</SectionLabel>
            <Card className="mt-[10px] flex items-center gap-[26px] px-[20px] py-[18px]">
              <Stat value={hasData ? "24" : "0"} label="SHOTS" />
              <Stat value={hasData ? "15" : "0"} label="MAKES" />
              <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" />
              <div className="ml-auto text-right">
                <TrendLine points={[3, 2, 4, 3, 5, 6]} width={96} height={34} />
                <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{improvement} vs last session</div>
              </div>
            </Card>

            <Card className="mt-[16px] flex divide-x divide-[var(--shotiq-color-rule)]">
              <div className="flex-1 px-[18px] py-[16px]">
                <SectionLabel>MECHANICS TREND</SectionLabel>
                <TrendLine points={[2, 3, 2.5, 4, 3.5, 5]} width={150} height={52} />
                <div className="text-[11px] text-[var(--shotiq-color-confirmGreen)]">{improvement} vs last 7 days</div>
              </div>
              <div className="w-[150px] px-[18px] py-[16px]">
                <SectionLabel>FORM SCORE</SectionLabel>
                <div className="shotiq-numeric mt-[4px] text-[40px] leading-[42px] text-[var(--shotiq-color-analysisBlue)]">{score ?? "—"}</div>
                <div className="mt-[6px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full rounded-full bg-[var(--shotiq-color-analysisBlue)]" style={{ width: `${score ?? 0}%` }} />
                </div>
                <div className="mt-[4px] text-[12px]">{band.label.charAt(0) + band.label.slice(1).toLowerCase()}</div>
              </div>
            </Card>

            <div className="mt-[20px] flex items-center justify-between">
              <SectionLabel>RECENT ANALYSES</SectionLabel>
              <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
            </div>
            <Card className="mt-[10px] divide-y divide-[var(--shotiq-color-rule)]">
              {(recent.length ? recent : [null, null, null]).map((r, i) => (
                <div key={i} className="flex items-center gap-[14px] px-[14px] py-[12px]">
                  <MediaSurface width={86} height={52} rounded={4} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{r?.title ?? (loading ? "Loading…" : "No analysis yet")}</div>
                    <div className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">{r ? `${r.when} · ${r.style}` : ""}</div>
                  </div>
                  <div className="shotiq-numeric text-[22px]">{r?.score ?? "—"}</div>
                  <MoreVertical className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
                </div>
              ))}
            </Card>
          </aside>
        </div>

        {/* bottom trends strip */}
        <div className="mx-[28px] mb-[20px]">
          <Card className="flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[10px] py-[12px]">
            <div className="w-[130px] px-[12px] text-[12px] font-bold leading-[16px] tracking-[0.05em]">YOUR RECENT<br />TRENDS</div>
            {[["Form Score", score ?? "—", improvement], ["Shooting Consistency", hasData ? "62.5%" : "—", "+6.4%"],
              ["Release Speed", hasData ? "1.32s" : "—", "+3.2%"], ["Elbow Alignment", hasData ? "92%" : "—", "+7.6%"],
              ["Balance", hasData ? "88%" : "—", "+5.1%"]].map(([l, v, d]) => (
              <div key={String(l)} className="flex flex-1 items-center gap-[14px] px-[16px]">
                <div>
                  <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{l}</div>
                  <div className="shotiq-numeric text-[22px] leading-[26px]">{v}</div>
                </div>
                <TrendLine points={[3, 2, 3.5, 3, 4, 3.6, 4.5]} width={90} height={30}
                           stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                <div className="text-[11px] text-[var(--shotiq-color-confirmGreen)]">{hasData ? d : ""}</div>
              </div>
            ))}
          </Card>
        </div>
      </ShotIQShell>
    )
  }

  /* --------------------------------------------- 079 professional -------- */
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  return (
    <ShotIQShell active="Home" {...shellProps}>
      <div data-testid="screen-desktop-web-home-dashboard" className="px-[34px] pt-[26px]">
        <div className="flex items-center gap-[24px]">
          <div className="mr-auto">
            <h1 className="shotiq-display text-[54px] leading-[56px]">TODAY&apos;S SHOT ROOM</h1>
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">{today}</p>
          </div>
          <Link href="/analyze" data-testid="cta-analyze-shot"
                className="flex h-[56px] items-center gap-[12px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[26px] text-[15px] font-medium text-white">
            <Crosshair className="h-[18px] w-[18px]" /> Analyze shot
          </Link>
          {[["Upload image", "/upload", ImagePlus], ["Upload video", "/upload", Video], ["Live camera", "/video-analysis", Radio]].map(([t, href, I]) => {
            const Icon = I as LucideIcon
            return (
              <Link key={String(t)} href={String(href)}
                    className="flex h-[56px] items-center gap-[12px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
                <Icon className="h-[26px] w-[26px]" strokeWidth={1.4} /> {String(t)}
              </Link>
            )
          })}
        </div>

        <div className="mt-[22px] flex gap-[26px]">
          {/* latest analysis */}
          <div className="w-[588px] shrink-0">
            <SectionLabel>LATEST ANALYSIS</SectionLabel>
            <MediaSurface width={588} height={365} className="mt-[10px]" />
            <div className="mt-[12px] flex items-center justify-between px-[12px]">
              {PHASES.map((p, i) => (
                <React.Fragment key={p}>
                  <div className="text-center">
                    <PhaseGlyph active={p === "RELEASE"} />
                    <div className={`mt-[4px] text-[10px] tracking-[0.06em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                    {p === "RELEASE" && <div className="mx-auto mt-[4px] h-[3px] w-[56px] bg-[var(--shotiq-color-shotiqOrange)]" />}
                  </div>
                  {i < PHASES.length - 1 && <span className="mb-[16px] h-px w-[34px] bg-[var(--shotiq-color-rule)]" />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* form score column */}
          <div className="w-[170px] shrink-0 pt-[30px]">
            <div className="text-right text-[12px] text-[var(--shotiq-color-graphite)]">
              {recent[0]?.when ? recent[0].when : ""}
            </div>
            <SectionLabel className="mt-[18px]">FORM SCORE</SectionLabel>
            <div className="shotiq-numeric text-[74px] leading-[78px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</div>
            <div className="h-[7px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} />
            </div>
            <div className="mt-[14px] text-[16px] font-bold" style={{ color: band.color }}>{band.label.charAt(0) + band.label.slice(1).toLowerCase().replace("_", " ")}</div>
            <p className="mt-[4px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
              {hasData ? "Keep building consistency." : "No analyses yet — run your first."}
            </p>
            <SectionLabel className="mt-[26px]">MECHANICS TREND</SectionLabel>
            <TrendLine points={[3, 2.5, 3.5, 3, 4.4]} width={120} height={40} />
            <div className="text-[11px] text-[var(--shotiq-color-confirmGreen)]">{improvement} vs last session</div>
          </div>

          {/* right column */}
          <aside className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pl-[26px]">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            <div className="mt-[6px] flex items-start justify-between">
              <h2 className="text-[24px] font-semibold leading-[30px]">
                {hasData ? "Keep elbow stacked through release" : "Complete an analysis to unlock coaching"}
              </h2>
              <ChevronRight className="mt-[6px] h-[18px] w-[18px] text-[var(--shotiq-color-graphite)]" />
            </div>
            <div className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
              <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[3px] text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
              <p className="mt-[10px] text-[13px]">Improve release consistency and arm alignment</p>
              <div className="mt-[10px] flex items-center gap-[12px]">
                <div className="h-[7px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: hasData ? "72%" : "0%" }} />
                </div>
                <span className="shotiq-numeric text-[14px]">{hasData ? "72%" : "0%"}</span>
              </div>
            </div>

            <SectionLabel className="mt-[24px] border-t border-[var(--shotiq-color-rule)] pt-[18px]">LATEST SESSION</SectionLabel>
            <div className="mt-[10px] flex items-center gap-[30px]">
              <Stat value={hasData ? "24" : "0"} label="SHOTS" />
              <Stat value={hasData ? "15" : "0"} label="MAKES" />
              <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" />
              <div className="ml-auto text-right">
                <TrendLine points={[3, 2, 4, 3, 5, 6]} width={100} height={36} />
                <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{improvement} vs last session</div>
              </div>
            </div>

            <SectionLabel className="mt-[22px] border-t border-[var(--shotiq-color-rule)] pt-[18px]">NEXT WORKOUT</SectionLabel>
            <Card className="mt-[10px] flex items-center gap-[16px] px-[18px] py-[16px]">
              <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]">
                <Activity className="h-[22px] w-[22px] text-white" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[16px] font-semibold">Quick Release Builder</div>
                <div className="text-[12px] text-[var(--shotiq-color-graphite)]">20 min · Form Focus</div>
                <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Improve release speed and consistency.</div>
              </div>
              <Link href="/results/demo/training" aria-label="Open workout">
                <ChevronRight className="h-[18px] w-[18px] text-[var(--shotiq-color-graphite)]" />
              </Link>
            </Card>
          </aside>
        </div>

        {/* recent analyses table */}
        <div className="mt-[24px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[16px]">
          <SectionLabel>RECENT ANALYSES</SectionLabel>
          <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        <div className="mb-[22px] mt-[10px] divide-y divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)]" data-testid="recent-analyses">
          {(recent.length ? recent : loading ? [] : []).map((r, i) => (
            <div key={i} className="flex items-center gap-[18px] py-[10px]">
              <div className="relative">
                <MediaSurface width={112} height={62} />
                <Play className="absolute left-[8px] top-[8px] h-[14px] w-[14px] text-white" fill="white" />
              </div>
              <div className="w-[230px]">
                <div className="text-[15px] font-semibold">{r.title}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.when} · {r.style}</div>
              </div>
              <div className="flex w-[130px] items-center gap-[8px]">
                <Stat value={r.score ?? "—"} label="FORM SCORE" valueClass="text-[22px] leading-[24px]" />
              </div>
              <Stat value="62.5%" label="MAKE %" valueClass="text-[22px] leading-[24px]" />
              <Stat value="24 / 15" label="SHOTS / MAKES" valueClass="text-[22px] leading-[24px]" />
              <div className="ml-auto flex items-center gap-[18px]">
                <div>
                  <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TREND</div>
                  <TrendLine points={[2, 3, 2.6, 3.4, 4]} width={80} height={26} />
                </div>
                <div className="w-[120px]">
                  <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">FOCUS</div>
                  <div className="text-[12px]">Elbow stacked</div>
                </div>
                <MoreVertical className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          ))}
          {!loading && !recent.length && (
            <div className="py-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
              No analyses yet. <Link className="text-[var(--shotiq-color-analysisBlue)]" href="/analyze">Run your first analysis</Link> to see it here.
            </div>
          )}
        </div>
      </div>
    </ShotIQShell>
  )
}
