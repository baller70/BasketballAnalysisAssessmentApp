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
  ChevronRight, LineChart, MoreVertical, Info,
} from "lucide-react"
import { ActionGlyph, PhaseTrack, WorkoutGlyph, type ActionKind } from "@/components/shotiq/Glyphs"
import { usePoints } from "@/lib/points/pointsContext"
import { useAuthStore } from "@/stores/authStore"
import { useDashboardViewStore } from "@/stores/dashboardViewStore"
import {
  ShotIQShell, TrendLine, SectionLabel, Card, Stat, PageTitle, GoalPercent,
} from "@/components/shotiq/ShotIQShell"
import {
  scoreSeries, sessionDelta, formatDelta, FormScoreCell, formatMakePct, formatSessionDate,
} from "@/components/shotiq/ResultsBits"

interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  overallTrend: string
  improvementRate: number | null
  /** Summed across every session with a capture behind it. */
  totalShots: number | null
  totalMakes: number | null
  makePct: number | null
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
              shots?: number | null; makes?: number | null
              shotCount?: number; makeCount?: number
            }[]
            setHistory(all.map((a) => ({
              score: a.scores?.overall != null ? Math.round(a.scores.overall) : a.score ?? null,
            })))
            const items = all.slice(0, 3)
            // One shared formatter app-wide (Mon D, YYYY • H:MM AM); this
            // screen used to date the same session differently from 083/093.
            const fmtWhen = (iso?: string) => formatSessionDate(iso)
            setRecent(items.map((a, i: number) => {
              const fb = RECENT_FALLBACK[i % RECENT_FALLBACK.length]
              const shotsN = a.shots ?? a.shotCount ?? fb.shots
              const makesN = a.makes ?? a.makeCount ?? fb.makes
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
  // Latest-session shot counts, projected by /api/analysis-history from the
  // capture session behind the analysis (they used to be 24 / 15 literals).
  const latestShots = recent[0]?.shots ?? null
  const latestMakes = recent[0]?.makes ?? null
  const latestMakePct = formatMakePct(latestShots, latestMakes)

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
      <ShotIQShell active="Home" {...shellProps}>
        <div data-testid="screen-desktop-web-standard-dashboard" className="flex">
          <div className="min-w-0 flex-1 px-[28px] pt-[24px]">
            <div className="flex items-start justify-between">
              <div>
                <PageTitle size={65}>DASHBOARD</PageTitle>
                <p className="mt-[6px] text-[14px] text-[var(--shotiq-color-graphite)]">
                  Good morning, {displayName}. Let&apos;s get better today.
                </p>
              </div>
              <div className="flex gap-[12px] pt-[8px]">
                <Link href="/analyze" data-testid="cta-new-analysis"
                      className="flex h-[52px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
                  <ActionGlyph kind="nodeGraph" height={20} /> New analysis
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
                   className="h-[318px] w-[380px] shrink-0 object-cover" />
              {/* The rail leaves this column 60px under canonical's 331px of
                  content box, which is what shortened the goal track (240 vs
                  292) and the primary button (285 vs 330); the padding and the
                  still-oversized still both give some of it back. */}
              <div className="flex-1 px-[22px] py-[18px]">
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
                    <GoalPercent size={18}>{hasData ? "72%" : "0%"}</GoalPercent>
                  </div>
                  <button type="button" className="mt-[8px] flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">
                    Why this matters <Info className="h-[13px] w-[13px]" />
                  </button>
                </div>
                <Link href="/results/demo/analysis" data-testid="cta-view-analysis"
                      className="mt-[12px] flex h-[44px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] text-[15px] font-medium text-white">
                  <ActionGlyph kind="analyze" height={18} /> View analysis
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
                    <div className="flex-1 pr-[16px]"><Stat value={hasData ? latestShots ?? "—" : "0"} label="SHOTS" /></div>
                    <div className="flex-1 px-[16px]"><Stat value={hasData ? latestMakes ?? "—" : "0"} label="MAKES" /></div>
                    <div className="flex-1 px-[16px]"><Stat value={hasData ? latestMakePct : "—"} label="MAKE %" /></div>
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
              {/* No rule above the strip — canonical draws none there — and no
                  tinted band: the strip used to be a downscaled bitmap of the
                  canonical crop, which put its own #FDFDFD paper on the card as
                  a visible block and shrank the labels to an 8px cap. */}
              <div className="mt-[12px] w-[486px]">
                <PhaseTrack figure={32} label={13} checks />
              </div>
            </Card>
          </div>

          {/* right column */}
          {/* 430px was ~30px under canonical's rail and it was the RECENT
              ANALYSES meta line that paid for it ("… Catch & S…"). */}
          <aside className="w-[452px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[20px] pt-[26px]">
            <SectionLabel>AT A GLANCE</SectionLabel>
            <Card className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)] px-[6px] py-[16px] text-center">
              {[
                [hasData ? String(stats!.totalAnalyses) : "0", "TOTAL ANALYSES", "All time", "var(--shotiq-color-ink)"],
                // Canonical sets this sublabel sentence-case ("Good"), like
                // every other verdict on the screen — not lowercase.
                [score != null ? String(score) : "—", "AVG. FORM SCORE",
                 band.label.charAt(0) + band.label.slice(1).toLowerCase(), "var(--shotiq-color-analysisBlue)"],
                [hasData ? String(stats!.totalShots ?? "—") : "0", "TOTAL SHOTS", "All time", "var(--shotiq-color-ink)"],
                [improvement, "IMPROVEMENT", "vs last 30 days",
                 deltaPct != null && deltaPct < 0 ? "var(--shotiq-color-reviewRed)" : "var(--shotiq-color-confirmGreen)"],
              ].map(([v, l, sub, c]) => (
                // The tile labels are single-line in canonical; the tracking was
                // pushing "AVG. FORM SCORE" onto a second row inside the 430px
                // rail, so the gutters shrank and the tracking came off.
                <div key={l} className="min-w-0 flex-1 px-[3px]">
                  <div className="whitespace-nowrap text-[9px] text-[var(--shotiq-color-graphite)]">{l}</div>
                  <div className="shotiq-numeric mt-[4px] text-[37px] leading-[39px]" style={{ color: c }}>{v}</div>
                  <div className="mt-[2px] whitespace-nowrap text-[10px] text-[var(--shotiq-color-graphite)]">{sub}</div>
                </div>
              ))}
            </Card>

            <SectionLabel className="mt-[14px]">SHOT SUMMARY (LATEST SESSION)</SectionLabel>
            {/* Four evenly-shared, ruled cells — the trend used to be a
                shrink-0 block, so the three numerals bunched left. */}
            <Card className="mt-[10px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[12px] py-[18px]">
              <div className="min-w-0 flex-1 pr-[12px]"><Stat value={hasData ? latestShots ?? "—" : "0"} label="SHOTS" /></div>
              <div className="min-w-0 flex-1 px-[12px]"><Stat value={hasData ? latestMakes ?? "—" : "0"} label="MAKES" /></div>
              <div className="min-w-0 flex-1 px-[12px]"><Stat value={hasData ? latestMakePct : "—"} label="MAKE %" /></div>
              <div className="min-w-0 flex-[1.35] pl-[12px] text-right">
                <TrendLine points={trend} width={96} height={34} />
                <div className={`text-[10px] ${improvementTone}`}>{improvement} vs last session</div>
              </div>
            </Card>

            <Card className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)]">
              <div className="flex-1 px-[18px] py-[16px]">
                <SectionLabel>MECHANICS TREND</SectionLabel>
                {/* Canonical sets a rising arrow at the sparkline's top right;
                    it was missing entirely on this variant. */}
                <div className="flex items-start gap-[4px]">
                  <TrendLine points={trend} width={150} height={52} />
                  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" className="mt-[4px]"
                       style={{ transform: deltaPct != null && deltaPct < 0 ? "scaleY(-1)" : undefined }}>
                    <path d="M3 13 L13 3 M6 3 H13 V10" fill="none"
                          stroke={deltaPct != null && deltaPct < 0 ? "var(--shotiq-color-reviewRed)" : "var(--shotiq-color-confirmGreen)"}
                          strokeWidth="1.6" />
                  </svg>
                </div>
                <div className={`text-[11px] ${improvementTone}`}>{improvement} vs last 7 days</div>
              </div>
              <div className="w-[150px] px-[18px] py-[16px]">
                <SectionLabel>FORM SCORE</SectionLabel>
                <div className="shotiq-numeric mt-[4px] text-[54px] leading-[56px] text-[var(--shotiq-color-analysisBlue)]">{score ?? "—"}</div>
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
                <div key={i} className="flex items-center gap-[10px] px-[10px] py-[12px]">
                  {/* Canonical stamps the clip length onto every thumbnail. */}
                  <div className="relative h-[44px] w-[100px] shrink-0">
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
            {/* 92px could not hold "YOUR RECENT" on one line, so the label ran
                to three rows where canonical takes two. */}
            <div className="w-[112px] shrink-0 px-[10px] text-[12px] font-bold leading-[16px] tracking-[0.04em]">
              <span className="block whitespace-nowrap">YOUR RECENT</span>
              <span className="block whitespace-nowrap">TRENDS</span>
            </div>
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
          {/* Canonical marks these four with its own node-graph family, each on
              its own aspect ratio (the film gate is 60x25, the live-camera node
              run 78x27) at a ~34px height — not four 20px square UI glyphs. */}
          <Link href="/analyze" data-testid="cta-analyze-shot"
                className="flex h-[56px] items-center gap-[12px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[26px] text-[15px] font-medium text-white">
            <ActionGlyph kind="analyze" height={30} accent="#fff" /> Analyze shot
          </Link>
          {([["Upload image", "/upload", "uploadImage", 34],
             ["Upload video", "/upload", "uploadVideo", 25],
             ["Live camera", "/video-analysis", "liveCamera", 27]] as [string, string, ActionKind, number][]).map(([t, href, kind, h]) => (
            <Link key={t} href={href}
                  className="flex h-[56px] items-center gap-[14px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
              <ActionGlyph kind={kind} height={h} /> {t}
            </Link>
          ))}
        </div>

        {/* The 196px rail costs this row ~110px against canonical's 88px icon
            rail; it is recovered from the media column and the gutters so the
            coaching-target headline still sets on one line. */}
        <div className="mt-[16px] flex gap-[20px]">
          {/* latest analysis */}
          {/* Canonical's frame is 595x366 and its column runs to y646, level with
              the rail beside it. At 500x311 the column stopped 56px short and
              that shortfall showed up as dead paper above RECENT ANALYSES. */}
          <div className="w-[520px] shrink-0">
            <SectionLabel>LATEST ANALYSIS</SectionLabel>
            {/* Exact frame cropped from the canonical screen (079, x122 y216 588x366). */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/079-latest-analysis.png" alt="Latest analyzed jump shot"
                 className="mt-[10px] h-[352px] w-[520px] rounded-[4px] object-cover" />
            {/* Drawn, not a bitmap. The 588px canonical strip crop squeezed into
                this 500px column dropped the labels to an 8px cap and printed
                its own #FDFDFD paper as a band across the video's foot. */}
            <PhaseTrack className="mt-[8px]" figure={40} label={12} underline />
          </div>

          {/* form score column */}
          <div className="w-[152px] shrink-0 pt-[30px]">
            <div className="text-right text-[12px] text-[var(--shotiq-color-graphite)]">
              {recent[0]?.when ? recent[0].when : ""}
            </div>
            {/* The one shared form-score module; canonical sets this verdict in
                caps ("GOOD"), unlike the inline mentions elsewhere. */}
            <FormScoreCell score={score} size={70} numeral={92} className="mt-[14px]" layout="below" />
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
                <GoalPercent size={15}>{hasData ? "72%" : "0%"}</GoalPercent>
              </div>
            </div>

            <SectionLabel className="mt-[24px] border-t border-[var(--shotiq-color-rule)] pt-[18px]">LATEST SESSION</SectionLabel>
            {/* Canonical rules the session stats off from one another and spreads
                them across the rail, with the trend mark in its own compartment. */}
            <div className="mt-[10px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
              <div className="flex-1 pr-[14px]"><Stat value={hasData ? latestShots ?? "—" : "0"} label="SHOTS" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? latestMakes ?? "—" : "0"} label="MAKES" /></div>
              <div className="flex-1 px-[14px]"><Stat value={hasData ? latestMakePct : "—"} label="MAKE %" /></div>
              <div className="shrink-0 pl-[14px] text-right">
                <TrendLine points={trend} width={92} height={34} />
                <div className={`text-[10px] ${improvementTone}`}>{improvement} vs last session</div>
              </div>
            </div>

            <SectionLabel className="mt-[22px] border-t border-[var(--shotiq-color-rule)] pt-[18px]">NEXT WORKOUT</SectionLabel>
            <Card className="mt-[10px] flex items-center gap-[16px] px-[18px] py-[16px]">
              {/* Canonical's workout mark is the node graph, not a pulse. */}
              <span className="grid h-[46px] w-[46px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">
                <WorkoutGlyph kind="release" size={24} />
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

        {/* Recent analyses table. Canonical encloses it in one bordered box
            (x 125–1414) and rules each numeric column off from the next with a
            short hairline; this shipped as bare rows with no box and no column
            rules, and with the trend/focus group pushed right by `ml-auto`,
            which opened ~90px of dead width in the middle of every row. */}
        <div className="mt-[10px] flex items-center justify-between pt-[2px]">
          <SectionLabel>RECENT ANALYSES</SectionLabel>
          <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        <Card className="mb-[12px] mt-[6px] divide-y divide-[var(--shotiq-color-rule)]" data-testid="recent-analyses">
          {(recent.length ? recent : loading ? [] : []).map((r, i) => {
            // Per-row delta and per-row shape, both read off this row's own
            // slice of history: the row that fell draws a falling line.
            const rowPct = rowDelta(i)
            const delta = formatDelta(rowPct)
            const focus = ["Elbow stacked", "Balance in rise", "Footwork timing"][i % 3]
            const bandRow = scoreBand(r.score)
            return (
            <div key={i} className="flex items-center gap-[12px] py-[4px] pl-[10px] pr-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/canonical/079-recent-${(i % 3) + 1}.png`} alt=""
                   className="h-[45px] w-[140px] shrink-0 rounded-[4px] object-cover" />
              <div className="w-[214px] shrink-0">
                <div className="text-[15px] font-semibold">{r.title}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.when} · {r.style}</div>
              </div>
              {/* Four ruled cells, sized to canonical's column shares. */}
              <div className="flex min-w-0 flex-1 items-center">
                <div className="min-w-0 flex-[1.13] px-[12px]">
                  <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                  <div className="flex items-center gap-[8px]">
                    <span className="shotiq-numeric text-[22px] leading-[26px]">{r.score ?? "—"}</span>
                    <span className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: bandRow.color }} />
                    <span className="text-[12px] text-[var(--shotiq-color-graphite)]">
                      {bandRow.label.charAt(0) + bandRow.label.slice(1).toLowerCase()}
                    </span>
                  </div>
                </div>
                <span aria-hidden="true" className="h-[24px] w-px shrink-0 bg-[var(--shotiq-color-rule)]" />
                <div className="min-w-0 flex-1 px-[12px]">
                  <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">MAKE %</div>
                  <div className="shotiq-numeric text-[22px] leading-[26px]">{r.makePct}</div>
                </div>
                <span aria-hidden="true" className="h-[24px] w-px shrink-0 bg-[var(--shotiq-color-rule)]" />
                <div className="min-w-0 flex-[1.18] px-[12px]">
                  <div className="whitespace-nowrap shotiq-microcaps text-[var(--shotiq-color-graphite)]">SHOTS / MAKES</div>
                  <div className="shotiq-numeric text-[22px] leading-[26px]">{r.shots} / {r.makes}</div>
                </div>
                <span aria-hidden="true" className="h-[24px] w-px shrink-0 bg-[var(--shotiq-color-rule)]" />
                <div className="min-w-0 flex-[1.58] px-[12px]">
                  <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">TREND</div>
                  <div className="flex h-[26px] items-center gap-[6px]">
                    {/* The oldest row has nothing behind it to compare against;
                        an orphan two-point rule would only read as a bug. */}
                    {rowTrend(i).length >= 2 && <TrendLine points={rowTrend(i)} width={80} height={26} />}
                    <span className={`text-[11px] ${rowPct != null && rowPct < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{delta}</span>
                  </div>
                </div>
              </div>
              <div className="w-[122px] shrink-0">
                <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">FOCUS</div>
                <div className="text-[12px]">{focus}</div>
              </div>
              <MoreVertical className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </div>
          )})}
          {!loading && !recent.length && (
            <div className="py-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
              No analyses yet. <Link className="text-[var(--shotiq-color-analysisBlue)]" href="/analyze">Run your first analysis</Link> to see it here.
            </div>
          )}
        </Card>
      </div>
    </ShotIQShell>
  )
}
