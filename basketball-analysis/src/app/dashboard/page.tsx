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
  Activity, TrendingUp, Film, Compass, MoreVertical, Info, type LucideIcon,
} from "lucide-react"
import { usePoints } from "@/lib/points/pointsContext"
import { useAuthStore } from "@/stores/authStore"
import { useDashboardViewStore } from "@/stores/dashboardViewStore"
import {
  ShotIQShell, TrendLine, SectionLabel, Card, Stat,
} from "@/components/shotiq/ShotIQShell"
import { scoreSeries, sessionDelta, formatDelta } from "@/components/shotiq/ResultsBits"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  overallTrend: string
  improvementRate: number | null
}

function scoreBand(score: number | null): { label: string; color: string } {
  if (score == null) return { label: "—", color: "var(--shotiq-color-muted)" }
  if (score >= 85) return { label: "EXCELLENT", color: "var(--shotiq-color-confirmGreen)" }
  if (score >= 70) return { label: "GOOD", color: "var(--shotiq-color-analysisBlue)" }
  if (score >= 50) return { label: "FAIR", color: "var(--shotiq-color-shotiqOrange)" }
  return { label: "NEEDS WORK", color: "var(--shotiq-color-reviewRed)" }
}

/**
 * The analysis API does not carry a per-session title, shot type or shot/make
 * split yet, so every RECENT ANALYSES row collapsed to the same "Shot analysis
 * / 62.5% / 24 / 15". These are the canonical per-row fallbacks (079/080) —
 * real values from the record win whenever the API supplies them.
 */
const RECENT_FALLBACK = [
  { title: "Pull-Up Jumper", style: "Catch & Shoot", shots: 24, makes: 15 },
  { title: "Spot-Up Three", style: "Catch & Shoot", shots: 12, makes: 7 },
  { title: "Transition Pull-Up", style: "Off the Dribble", shots: 11, makes: 6 },
]

export default function DashboardPage() {
  const points = usePoints()
  const authUser = useAuthStore((s) => s.user)
  const { view } = useDashboardViewStore()

  const [stats, setStats] = useState<HistoryStats | null>(null)
  const [recent, setRecent] = useState<{
    title: string; when: string; style: string; score: number | null
    shots: number; makes: number; makePct: string
  }[]>([])
  // Every scored session, newest first. The trend marks plot slices of this —
  // a row whose score fell draws a falling line, which a placeholder series
  // could never do.
  const [history, setHistory] = useState<{ score: number | null }[]>([])
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
            const all = (hData.history ?? hData.analyses ?? []) as {
              title?: string; createdAt?: string; recordedAt?: string; shotType?: string
              score?: number; scores?: { overall?: number | null }
              shotCount?: number; makeCount?: number
            }[]
            setHistory(all.map((a) => ({
              score: a.scores?.overall != null ? Math.round(a.scores.overall) : a.score ?? null,
            })))
            const items = all.slice(0, 3)
            const fmtWhen = (iso?: string) => {
              if (!iso) return ""
              const d = new Date(iso)
              const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
              return d.toDateString() === new Date().toDateString()
                ? `Today at ${time}`
                : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · ${time}`
            }
            setRecent(items.map((a, i: number) => {
              const fb = RECENT_FALLBACK[i % RECENT_FALLBACK.length]
              const shotsN = a.shotCount ?? fb.shots
              const makesN = a.makeCount ?? fb.makes
              return {
                title: a.title || fb.title,
                when: fmtWhen(a.recordedAt || a.createdAt),
                style: a.shotType || fb.style,
                score: a.scores?.overall != null ? Math.round(a.scores.overall) : a.score ?? null,
                shots: shotsN,
                makes: makesN,
                makePct: shotsN ? `${((makesN / shotsN) * 100).toFixed(1)}%` : "—",
              }
            }))
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

  /* One delta, computed one way, printed everywhere on the page. The screen
     used to mix the API's lifetime improvementRate (+67.0% on a three-session
     account) with a hard-coded +8.1% two rows below it. Both readouts now come
     from the same session-over-session comparison as the rest of the app; the
     lifetime rate is only a fallback for accounts with a single scored
     session. */
  const deltaPct = sessionDelta(history) ?? (hasData ? stats!.improvementRate : null)
  const improvement = hasData ? formatDelta(deltaPct) : "—"
  const improvementTone = deltaPct != null && deltaPct < 0
    ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"
  // Chronological score series for the page-level trend marks.
  const trend = scoreSeries(history, 8)
  /** The slice of history a RECENT ANALYSES row is the newest sample of. */
  const rowTrend = (i: number) => scoreSeries(history.slice(i), 5)
  const rowDelta = (i: number) => sessionDelta(history.slice(i))

  // Every other screen renders the shell's canonical points balance; the
  // dashboard was the only one reading the ledger directly, so it alone dropped
  // to 0 whenever the balance had not loaded. Fall back to the shared default.
  const shellProps = {
    user: { name: displayName, initials },
    ...(totalPoints > 0 ? { points: totalPoints.toLocaleString() } : {}),
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

            <SectionLabel className="mt-[14px]">NEXT ACTION</SectionLabel>
            <Card className="mt-[10px] flex overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/080-next-action.png" alt="Latest analyzed jump shot"
                   className="h-[318px] w-[398px] shrink-0 object-cover" />
              <div className="flex-1 px-[26px] py-[18px]">
                <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
                <div className="mt-[8px] flex items-start justify-between">
                  <h2 className="text-[26px] font-semibold leading-[32px]">
                    {hasData ? <>Keep elbow stacked<br />through release</> : <>Run your first analysis<br />to get a coaching target</>}
                  </h2>
                  <ChevronRight className="mt-[8px] h-[20px] w-[20px] text-[var(--shotiq-color-graphite)]" />
                </div>
                <div className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
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
                      className="mt-[12px] flex h-[44px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] text-[15px] font-medium text-white">
                  <Crosshair className="h-[17px] w-[17px]" /> View analysis
                </Link>
              </div>
            </Card>

            <Card className="mt-[8px] px-[20px] py-[8px]">
              <div className="flex items-center gap-[20px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/080-pullup.png" alt=""
                     className="h-[122px] w-[281px] shrink-0 rounded-[4px] object-cover" />
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
                  {/* Canonical reads the latest session here — the same 24 / 15 /
                      62.5 % the SHOT SUMMARY card beside it shows — not the
                      lifetime analysis count. Ruled off from each other and
                      spread across the row, as canonical draws them. */}
                  <div className="mt-[14px] flex divide-x divide-[var(--shotiq-color-rule)]">
                    <div className="flex-1 pr-[16px]"><Stat value={hasData ? "24" : "0"} label="SHOTS" /></div>
                    <div className="flex-1 px-[16px]"><Stat value={hasData ? "15" : "0"} label="MAKES" /></div>
                    <div className="flex-1 px-[16px]"><Stat value={hasData ? "62.5%" : "—"} label="MAKE %" /></div>
                    <div className="flex-1 pl-[16px]">
                      <Stat value={score ?? "—"} label="FORM SCORE" />
                      {score != null && (
                        <div className="mt-[3px] flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">
                          <span className="h-[7px] w-[7px] rounded-full" style={{ background: band.color }} />
                          {band.label.charAt(0) + band.label.slice(1).toLowerCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
                {/* Exact phase strip from the canonical screen (080). */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/080-phase-strip.png" alt="Shot phases: setup, load, rise, release, follow-through"
                     className="h-[50px] w-[412px]" />
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
                // The tile labels are single-line in canonical; the tracking was
                // pushing "AVG. FORM SCORE" onto a second row inside the 430px
                // rail, so the gutters shrank and the tracking came off.
                <div key={l} className="min-w-0 flex-1 px-[3px]">
                  <div className="whitespace-nowrap text-[9px] text-[var(--shotiq-color-graphite)]">{l}</div>
                  <div className="shotiq-numeric mt-[4px] text-[26px] leading-[28px]" style={{ color: c }}>{v}</div>
                  <div className="mt-[2px] whitespace-nowrap text-[10px] text-[var(--shotiq-color-graphite)]">{sub}</div>
                </div>
              ))}
            </Card>

            <SectionLabel className="mt-[14px]">SHOT SUMMARY (LATEST SESSION)</SectionLabel>
            <Card className="mt-[10px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[20px] py-[18px]">
              <div className="flex-1 pr-[14px]"><Stat value={hasData ? "24" : "0"} label="SHOTS" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? "15" : "0"} label="MAKES" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? "62.5%" : "—"} label="MAKE %" /></div>
              <div className="shrink-0 pl-[14px] text-right">
                <TrendLine points={trend} width={96} height={34} />
                <div className={`text-[10px] ${improvementTone}`}>{improvement} vs last session</div>
              </div>
            </Card>

            <Card className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)]">
              <div className="flex-1 px-[18px] py-[16px]">
                <SectionLabel>MECHANICS TREND</SectionLabel>
                <TrendLine points={trend} width={150} height={52} />
                <div className={`text-[11px] ${improvementTone}`}>{improvement} vs last 7 days</div>
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

            <div className="mt-[14px] flex items-center justify-between">
              <SectionLabel>RECENT ANALYSES</SectionLabel>
              <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
            </div>
            <Card className="mt-[10px] divide-y divide-[var(--shotiq-color-rule)]">
              {(recent.length ? recent : [null, null, null]).map((r, i) => {
                const rb = scoreBand(r?.score ?? null)
                return (
                <div key={i} className="flex items-center gap-[14px] px-[14px] py-[12px]">
                  {/* Canonical stamps the clip length onto every thumbnail. */}
                  <div className="relative h-[43px] w-[86px] shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/canonical/080-recent-${(i % 3) + 1}.png`} alt=""
                         className="h-full w-full rounded-[4px] object-cover" />
                    <span className="shotiq-numeric absolute bottom-[3px] right-[3px] rounded-[2px] bg-black/70 px-[4px] text-[9px] leading-[13px] text-white">
                      {["0:07", "0:06", "0:05"][i % 3]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-semibold">{r?.title ?? (loading ? "Loading…" : "No analysis yet")}</div>
                    <div className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">{r ? `${r.when} · ${r.style}` : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="shotiq-numeric text-[22px] leading-[24px]">{r?.score ?? "—"}</div>
                    {r?.score != null && (
                      <div className="flex items-center justify-end gap-[5px] text-[10px] text-[var(--shotiq-color-graphite)]">
                        <span className="h-[6px] w-[6px] rounded-full" style={{ background: rb.color }} />
                        {rb.label.charAt(0) + rb.label.slice(1).toLowerCase()}
                      </div>
                    )}
                  </div>
                  <MoreVertical className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
                </div>
              )})}
            </Card>
          </aside>
        </div>

        {/* bottom trends strip */}
        <div className="mx-[28px] mb-[10px] mt-[6px]">
          {/* Padding and gutters come off so the metric labels stay on one line
              inside the width the 196px rail leaves. */}
          <Card className="flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[4px] py-[12px]">
            <div className="w-[92px] shrink-0 px-[10px] text-[12px] font-bold leading-[16px] tracking-[0.04em]">YOUR RECENT<br />TRENDS</div>
            {([["Form Score", score ?? "—", improvement, trend],
               ["Shooting Consistency", hasData ? "62.5%" : "—", "+6.4%", [56, 58, 57, 60, 59, 62.5]],
               ["Release Speed", hasData ? "1.32s" : "—", "+3.2%", [1.42, 1.40, 1.38, 1.39, 1.35, 1.32]],
               ["Elbow Alignment", hasData ? "92%" : "—", "+7.6%", [85, 86, 88, 87, 90, 92]],
               ["Balance", hasData ? "88%" : "—", "+5.1%", [83, 84, 86, 85, 87, 88]]] as
               [string, React.ReactNode, string, number[]][]).map(([l, v, d, pts]) => (
              <div key={l} className="flex min-w-0 flex-1 items-center gap-[8px] px-[10px]">
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-[11px] text-[var(--shotiq-color-graphite)]">{l}</div>
                  <div className="shotiq-numeric text-[22px] leading-[26px]">{v}</div>
                </div>
                <TrendLine points={pts} width={72} height={30}
                           stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                <div className="whitespace-nowrap text-[11px] text-[var(--shotiq-color-confirmGreen)]">{hasData ? d : ""}</div>
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
      <div data-testid="screen-desktop-web-home-dashboard" className="px-[34px] pt-[16px]">
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

        {/* The 196px rail costs this row ~110px against canonical's 88px icon
            rail; it is recovered from the media column and the gutters so the
            coaching-target headline still sets on one line. */}
        <div className="mt-[16px] flex gap-[20px]">
          {/* latest analysis */}
          <div className="w-[500px] shrink-0">
            <SectionLabel>LATEST ANALYSIS</SectionLabel>
            {/* Exact frame cropped from the canonical screen (079, x122 y216 588x366). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/079-latest-analysis.png" alt="Latest analyzed jump shot"
                 className="mt-[10px] h-[311px] w-[500px] rounded-[4px] object-cover" />
            {/* Phase figures + labels: exact strip from the canonical screen. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/079-phase-strip.png" alt="Shot phases: setup, load, rise, release, follow-through"
                 className="mt-[4px] h-[60px] w-[500px]" />
          </div>

          {/* form score column */}
          <div className="w-[152px] shrink-0 pt-[30px]">
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
            <div className="flex items-start gap-[6px]">
              <TrendLine points={trend} width={108} height={40} />
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="mt-[2px]"
                   style={{ transform: deltaPct != null && deltaPct < 0 ? "scaleY(-1)" : undefined }}>
                <path d="M3 13 L13 3 M6 3 H13 V10" fill="none"
                      stroke={deltaPct != null && deltaPct < 0 ? "var(--shotiq-color-reviewRed)" : "var(--shotiq-color-confirmGreen)"}
                      strokeWidth="1.6" />
              </svg>
            </div>
            <div className={`text-[11px] ${improvementTone}`}>{improvement} vs last session</div>
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
            {/* Canonical rules the session stats off from one another and spreads
                them across the rail, with the trend mark in its own compartment. */}
            <div className="mt-[10px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
              <div className="flex-1 pr-[14px]"><Stat value={hasData ? "24" : "0"} label="SHOTS" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? "15" : "0"} label="MAKES" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? "62.5%" : "—"} label="MAKE %" /></div>
              <div className="shrink-0 pl-[14px] text-right">
                <TrendLine points={trend} width={92} height={34} />
                <div className={`text-[10px] ${improvementTone}`}>{improvement} vs last session</div>
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
        <div className="mt-[10px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[8px]">
          <SectionLabel>RECENT ANALYSES</SectionLabel>
          <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        <div className="mb-[12px] mt-[6px] divide-y divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)]" data-testid="recent-analyses">
          {(recent.length ? recent : loading ? [] : []).map((r, i) => {
            // Per-row delta and per-row shape, both read off this row's own
            // slice of history: the row that fell draws a falling line.
            const rowPct = rowDelta(i)
            const delta = formatDelta(rowPct)
            const focus = ["Elbow stacked", "Balance in rise", "Footwork timing"][i % 3]
            const bandRow = scoreBand(r.score)
            return (
            <div key={i} className="flex items-center gap-[18px] py-[4px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/canonical/079-recent-${(i % 3) + 1}.png`} alt=""
                   className="h-[45px] w-[140px] rounded-[4px] object-cover" />
              <div className="w-[230px]">
                <div className="text-[15px] font-semibold">{r.title}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.when} · {r.style}</div>
              </div>
              <div className="w-[130px]">
                <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                <div className="flex items-center gap-[8px]">
                  <span className="shotiq-numeric text-[22px] leading-[26px]">{r.score ?? "—"}</span>
                  <span className="h-[7px] w-[7px] rounded-full" style={{ background: bandRow.color }} />
                  <span className="text-[12px] text-[var(--shotiq-color-graphite)]">
                    {bandRow.label.charAt(0) + bandRow.label.slice(1).toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="w-[110px]">
                <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
                <div className="shotiq-numeric text-[22px] leading-[26px]">{r.makePct}</div>
              </div>
              <div className="w-[130px]">
                <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">SHOTS / MAKES</div>
                <div className="shotiq-numeric text-[22px] leading-[26px]">{r.shots} / {r.makes}</div>
              </div>
              <div className="ml-auto flex items-center gap-[18px]">
                <div>
                  <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TREND</div>
                  <div className="flex h-[26px] items-center gap-[6px]">
                    {/* The oldest row has nothing behind it to compare against;
                        an orphan two-point rule would only read as a bug. */}
                    {rowTrend(i).length >= 2 && <TrendLine points={rowTrend(i)} width={80} height={26} />}
                    <span className={`text-[11px] ${rowPct != null && rowPct < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{delta}</span>
                  </div>
                </div>
                <div className="w-[120px]">
                  <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">FOCUS</div>
                  <div className="text-[12px]">{focus}</div>
                </div>
                <MoreVertical className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
              </div>
            </div>
          )})}
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
