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
import { HomeNewPlayer } from "@/components/shotiq/phone/HomeNewPlayer"
import { HomeProfessionalPhone, ProfileMenuPhone } from "@/components/shotiq/phone/HomeProPhone"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { usePhoneRoute } from "@/components/shotiq/phone/results/usePhoneRoute"
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
/* RECENT_FALLBACK is gone. It read like an empty state and was not one: it was
   applied per-row INSIDE a map over the player's REAL sessions, so it never
   described "no data" — it patched holes in data that existed. A session whose
   analysis has no capture behind it came out carrying canonical's 24 shots and
   15 makes, and the make% below was then computed from them.

   Worse, the stat strip further down already writes `latestShots ?? "—"`. That
   em-dash could never fire, because the mapper had filled the hole two hundred
   lines earlier. Correct handling at the render site is worthless if the
   mapper lies to it first. */

export default function DashboardPage() {
  const points = usePoints()
  const authUser = useAuthStore((s) => s.user)
  const { view, setView } = useDashboardViewStore()
  const isPhone = usePhoneViewport()
  const [phoneMenu, setPhoneMenu] = usePhoneRoute("menu")

  /* ---------------------------------------------------------------- layout
     The dashboard ships two canonical layouts — 079 professional and 080
     standard — but until now the only thing that could select between them was
     a hand-written localStorage key, so screen 080 was unreachable through the
     UI (R10 defect H5). Two real paths now select it: `?view=standard` on this
     route, and Settings → Preferences → Dashboard layout. The header carries
     the switch back the other way.
     Read from location rather than useSearchParams so this page keeps its
     static prerender (useSearchParams would force a Suspense boundary). */
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("view")
    if (q === "standard" || q === "professional" || q === "basic") {
      if (useDashboardViewStore.getState().view !== q) setView(q)
    }
  }, [setView])

  /* The dashboard's two canonical layouts (079 professional, 080 standard) are
     selected from Settings -> Preferences -> Dashboard layout, and by ?view= on
     this route. An inline switch used to sit under each H1, but canonical sets
     both subtitles on ONE line and carries no such control; the extra line
     pushed every row below it down and measurably moved 080 away from its
     design (row-ink correlation 0.900 -> 0.729). Reachability lives in Settings
     instead, which costs the canonical layout nothing. */

  const [stats, setStats] = useState<HistoryStats | null>(null)
  /* No `title` and no `style`: neither is recorded anywhere, so the row cannot
     carry them. Shots and makes are nullable because an analysis with no
     capture behind it counted none — which is not the same as counting zero. */
  const [recent, setRecent] = useState<{
    when: string; score: number | null
    shots: number | null; makes: number | null; makePct: string
  }[]>([])
  // Every scored session, newest first. The trend marks plot slices of this —
  // a row whose score fell draws a falling line, which a placeholder series
  // could never do.
  const [history, setHistory] = useState<{ score: number | null }[]>([])
  const [loading, setLoading] = useState(true)
  /* "Why this matters" was a button with an Info icon and no onClick — it read
     as an explain-this affordance and did nothing when pressed. It now opens
     the explanation it advertises. */
  const [whyOpen, setWhyOpen] = useState(false)

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
            /* Only keys `/api/analysis-history` actually emits. `title`,
               `shotType`, `shotCount` and `makeCount` were declared here and
               read below, and the endpoint has never returned any of them — so
               every `||` past them resolved to the canonical fallback on every
               row for every account (F18). */
            const all = (hData.history ?? hData.analyses ?? []) as {
              createdAt?: string; recordedAt?: string
              score?: number; scores?: { overall?: number | null }
              shots?: number | null; makes?: number | null
            }[]
            setHistory(all.map((a) => ({
              score: a.scores?.overall != null ? Math.round(a.scores.overall) : a.score ?? null,
            })))
            const items = all.slice(0, 3)
            // One shared formatter app-wide (Mon D, YYYY • H:MM AM); this
            // screen used to date the same session differently from 083/093.
            const fmtWhen = (iso?: string) => formatSessionDate(iso)
            setRecent(items.map((a) => {
              // Null when the analysis has no capture behind it. That is an
              // em-dash downstream, never a borrowed 24.
              const shotsN = a.shots ?? null
              const makesN = a.makes ?? null
              return {
                when: fmtWhen(a.recordedAt || a.createdAt),
                score: a.scores?.overall != null ? Math.round(a.scores.overall) : a.score ?? null,
                shots: shotsN,
                makes: makesN,
                makePct: formatMakePct(shotsN, makesN),
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
  /* Three states, not two (F16). Both phone variants below print these as
     `latestShots ?? (hasData ? "—" : "24")`: the player's own counts, an
     em-dash when a real session counted none, and canonical's pair only when
     there is no session at all. They used to collapse the middle case into
     canonical's, which put 24 / 15 beside a real date and score. */
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

  /* ---------------------------------- 017 new-player home (iOS) ---------- */
  /* Canonical iOS 017 is the home a player sees before any analysis exists.
     It is a STATE of this route, not a second page: it renders when the
     account has no analyses at all, and also when the home layout is set to
     the simplified "basic" view (dashboardViewStore, the same store 018/019
     select between). `basic` used to fall through to the standard branch and
     render identically to it, so the value was dead.
     The phone layout only paints below the md breakpoint; the 1440pt desktop
     screens keep the ShotIQShell dashboard untouched. */
  const newPlayer = view === "basic" || (!loading && !hasData)

  /* ------------------------------------------- 080 standard variant ------ */
  if (view === "standard" || view === "basic" || newPlayer) {
    return (
      <>
      {/* Gated on `isPhone`, NOT on a `md:hidden` wrapper. HomeNewPlayer renders
          PhoneShell, which portals into <body> — the portal subtree is not a
          descendant of the wrapper and never inherits its `display:none`, so a
          `md:hidden` div let the 393pt phone screen paint over the desktop
          dashboard at every width. It only showed on an account with no
          analyses, or under ?view=basic, which is why it survived the guards. */}
      {newPlayer && isPhone && (
        <HomeNewPlayer name={displayName} points={totalPoints > 0 ? totalPoints.toLocaleString() : "2,840"} />
      )}
      <div className={newPlayer ? "hidden md:block" : undefined}>
      <ShotIQShell active="Home" {...shellProps}>
        <div data-testid="screen-desktop-web-standard-dashboard" className="flex">
          <div className="min-w-0 flex-1 px-[28px] pt-[24px]">
            <div className="flex items-start justify-between">
              {/* min-w-0 so the title cell yields before the actions do: the
                  layout switch added under the subtitle widened this cell enough
                  to wrap both button labels, which canonical sets on one line. */}
              <div className="min-w-0">
                <PageTitle size={65}>DASHBOARD</PageTitle>
                <p className="mt-[6px] text-[14px] text-[var(--shotiq-color-graphite)]">
                  Good morning, {displayName}. Let&apos;s get better today.
                </p>
              </div>
              <div className="flex shrink-0 gap-[12px] pt-[8px]">
                <Link href="/analyze" data-testid="cta-new-analysis"
                      className="flex h-[52px] items-center gap-[10px] whitespace-nowrap rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
                  <ActionGlyph kind="nodeGraph" height={20} /> New analysis
                </Link>
                <Link href="/results/demo/history"
                      className="flex h-[52px] items-center gap-[10px] whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[15px]">
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
                  <button
                    type="button"
                    data-testid="dashboard-why-this-matters"
                    aria-expanded={whyOpen}
                    aria-controls="dashboard-why-panel"
                    onClick={() => setWhyOpen((v) => !v)}
                    className="mt-[8px] flex items-center gap-[6px] text-[12px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-ink)]"
                  >
                    Why this matters <Info className="h-[13px] w-[13px]" />
                  </button>
                  {whyOpen && (
                    <p
                      id="dashboard-why-panel"
                      className="mt-[8px] text-[12px] leading-[18px] text-[var(--shotiq-color-graphite)]"
                    >
                      {hasData
                        ? "Release consistency is the strongest single predictor of make percentage in your sessions — a repeatable elbow line changes where the ball leaves your hand, and that shows up in the arc before it shows up in the score. This goal tracks the share of your recent shots whose release angle sits inside your own best range."
                        : "Once you have analysed a shot, this is where your active goal and its progress appear — what to work on next, and how close you are to it."}
                    </p>
                  )}
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
                      {/* Nothing records an analysis title or a shot type, so a
                          real session is named for what it is and its subtitle
                          carries only the date. */}
                      <div className="text-[16px] font-semibold">{recent[0] ? "Shot session" : "No analyses yet"}</div>
                      <div className="mt-[3px] text-[12px] text-[var(--shotiq-color-graphite)]">
                        {recent[0] ? recent[0].when : "Upload or capture a shot to begin"}
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
            {/* Canonical sets this one at cap 14 over a 70px advance; the role
                default drew cap 11 over 59. Raised here only — see SectionLabel. */}
            <SectionLabel style={{ "--shotiq-label-size": "19px",
                                   "--shotiq-label-tracking": "0.055em" } as React.CSSProperties}>AT A GLANCE</SectionLabel>
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
                  {/* Canonical's AT A GLANCE eyebrows are the condensed
                      micro-caps tier at cap 10 — TOTAL ANALYSES over 63px. The
                      body face at 9px drew cap 7 over 72px on all four: 30%
                      short and 14% WIDER at the same time, which is the
                      signature of the wrong face rather than the wrong size.
                      Sized and tracked through the role's custom properties,
                      because a bare utility on this element is discarded. */}
                  <div className="shotiq-microcaps whitespace-nowrap text-[var(--shotiq-color-graphite)]"
                       style={{ "--shotiq-microcaps-size": "13px",
                                "--shotiq-microcaps-tracking": "0.045em",
                                "--shotiq-microcaps-word-spacing": "0.14em" } as React.CSSProperties}>{l}</div>
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
              {/* Canonical hands this cell 130 of the card's 394px content (33%)
                  and keeps "+8.1% vs last session" on one line; at flex-[1.35]
                  the cell measured 121 of 409 (29.6%) and the caption broke in
                  two under the sparkline. */}
              <div className="min-w-0 flex-[1.75] pl-[12px] text-right">
                <TrendLine points={trend} width={96} height={34} />
                <div className="text-[10px]"><span className={improvementTone}>{improvement}</span> <span className="text-[#84868A]">vs last session</span></div>
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
                <div className="text-[11px]"><span className={improvementTone}>{improvement}</span> <span className="text-[#84868A]">vs last 7 days</span></div>
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
                    <div className="truncate text-[14px] font-semibold">{r ? "Shot session" : (loading ? "Loading…" : "No analysis yet")}</div>
                    <div className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">{r ? r.when : ""}</div>
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
            <div className="shotiq-section-label w-[112px] shrink-0 px-[10px] leading-[17px]">
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
                  <div className="shotiq-numeric text-[26px] leading-[30px]">{v}</div>
                </div>
                <TrendLine points={pts} width={72} height={30}
                           stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                <div className="whitespace-nowrap text-[11px] text-[var(--shotiq-color-confirmGreen)]">{hasData ? d : ""}</div>
              </div>
            ))}
          </Card>
        </div>
      </ShotIQShell>
      </div>
      </>
    )
  }

  /* --------------------------------------------- 079 professional -------- */
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
  /* Canonical iOS draws TWO screens on this route — 019 the professional home
     and 020 the profile overflow sheet. Round 6 reflowed the 1440pt dashboard
     into 393pt instead, which left a 2px interior divider at x=447px (206pt)
     running 76% of the viewport height; canonical has zero interior vertical
     rules on any of the 72. The sheet is `?menu=1`, pushed by tapping your own
     name on 019, so it has a URL, a back gesture and a deterministic route for
     the harness. The desktop tree below is untouched. */
  return (
    <>
    {isPhone && (
      phoneMenu ? (
        <ProfileMenuPhone
          name={displayName} streak="6"
          points={totalPoints > 0 ? totalPoints.toLocaleString() : "2,840"}
          score={score ?? 82}
          shots={latestShots != null ? String(latestShots) : hasData ? "—" : "24"}
          makes={latestMakes != null ? String(latestMakes) : hasData ? "—" : "15"}
          pct={latestMakePct}
          delta={improvement}
          mode={view === "professional" ? "analysis" : "training"}
          onMode={(m) => setView(m === "analysis" ? "professional" : "standard")}
          onClose={() => setPhoneMenu(null)}
          onSignOut={() => { window.location.assign("/signin") }}
        />
      ) : (
        <HomeProfessionalPhone
          name={displayName} streak="6"
          points={totalPoints > 0 ? totalPoints.toLocaleString() : "2,840"}
          score={score ?? 82}
          shots={latestShots != null ? String(latestShots) : hasData ? "—" : "24"}
          makes={latestMakes != null ? String(latestMakes) : hasData ? "—" : "15"}
          pct={latestMakePct}
          delta={improvement}
          when={recent[0]?.when ?? "Today at 8:24 AM"}
          onMenu={() => setPhoneMenu("1")}
        />
      )
    )}
    <div className={isPhone ? "hidden" : undefined}>
    <ShotIQShell active="Home" {...shellProps}>
      <div data-testid="screen-desktop-web-home-dashboard" className="px-[34px] pt-[16px]">
        {/* Canonical clears 332px for the title before its first action
            button; the 196px rail leaves ~110px less here, so the row gap and the
            buttons' own padding come in to make the room rather than the title
            wrapping to two lines. Canonical's buttons measure 184-190 wide; at
            px-[20px]/px-[16px] these land at ~181. */}
        <div className="flex items-center gap-[16px]">
          {/* min-w-0 so the title block yields first: adding the layout switch
              below the H1 widened this cell enough to wrap every action label
              onto two lines ("Analyze / shot"), which canonical sets on one. */}
          <div className="mr-auto min-w-0">
            {/* Canonical cap 44 over a 332px advance at ink density 0.494;
                54px measured cap 37 over 285 at 0.491. Density matched, so a
                pure size error — the largest title miss in the set. The display
                face carries cap 0.704em, so cap 44 wants 63px. */}
            <h1 className="shotiq-display whitespace-nowrap text-[63px] leading-[58px]">TODAY&apos;S SHOT ROOM</h1>
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
              {today}
            </p>
          </div>
          {/* Canonical marks these four with its own node-graph family, each on
              its own aspect ratio (the film gate is 60x25, the live-camera node
              run 78x27) at a ~34px height — not four 20px square UI glyphs. */}
          <Link href="/analyze" data-testid="cta-analyze-shot"
                className="flex h-[56px] shrink-0 items-center gap-[10px] whitespace-nowrap rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[15px] font-medium text-white">
            <ActionGlyph kind="analyze" height={30} accent="#fff" /> Analyze shot
          </Link>
          {([["Upload image", "/upload", "uploadImage", 34],
             ["Upload video", "/upload", "uploadVideo", 25],
             ["Live camera", "/video-analysis", "liveCamera", 27]] as [string, string, ActionKind, number][]).map(([t, href, kind, h]) => (
            <Link key={t} href={href}
                  className="flex h-[56px] shrink-0 items-center gap-[10px] whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[14px]">
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
            <div className="text-[11px]"><span className={improvementTone}>{improvement}</span> <span className="text-[#84868A]">vs last session</span></div>
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
                <div className="text-[10px]"><span className={improvementTone}>{improvement}</span> <span className="text-[#84868A]">vs last session</span></div>
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
        {/* Canonical separates the upper dashboard from this section with a
            full-width hairline ABOVE the heading (y=657, x125–1414), not just
            the card's own top border 36px lower. */}
        <div className="mt-[16px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[12px]">
          <SectionLabel>RECENT ANALYSES</SectionLabel>
          <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        {/* Row pitch runs 58px in canonical against the shipped 54 — three
            rows of it, which is most of the dead paper the graders measured at
            the foot of the page. */}
        <Card className="mb-[12px] mt-[8px] divide-y divide-[var(--shotiq-color-rule)]" data-testid="recent-analyses">
          {(recent.length ? recent : loading ? [] : []).map((r, i) => {
            // Per-row delta and per-row shape, both read off this row's own
            // slice of history: the row that fell draws a falling line.
            const rowPct = rowDelta(i)
            const delta = formatDelta(rowPct)
            const focus = ["Elbow stacked", "Balance in rise", "Footwork timing"][i % 3]
            const bandRow = scoreBand(r.score)
            return (
            <div key={i} className="flex items-center gap-[12px] py-[6px] pl-[10px] pr-[10px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/images/canonical/079-recent-${(i % 3) + 1}.png`} alt=""
                   className="h-[45px] w-[140px] shrink-0 rounded-[4px] object-cover" />
              <div className="w-[214px] shrink-0">
                <div className="text-[15px] font-semibold">Shot session</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{r.when}</div>
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
    </div>
    </>
  )
}
