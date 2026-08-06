"use client"

/** Small shared pieces for the canonical results screens (083-093). */
import React, { useEffect, useState } from "react"
import Link from "next/link"
import { SectionLabel, Card, TrendLine, Stat, GoalPercent } from "@/components/shotiq/ShotIQShell"
import { useProfileStore } from "@/stores/profileStore"

export interface HistoryStats {
  totalAnalyses: number
  averageScore: number | null
  latestScore: number | null
  improvementRate: number | null
  /** Shots/makes summed over every session that has a capture behind it. */
  totalShots: number | null
  totalMakes: number | null
  makePct: number | null
}

export interface HistoryItem {
  /** The analysis's own name, when it has one. Nothing sets one yet. */
  title: string | null
  when: string
  /** The raw ISO timestamp. `when` is already formatted for display, so a
   *  screen that wants to compare against "the last 7 days" had nothing to
   *  window on and printed a typed delta instead. */
  at: string | null
  /** The kind of shot, when anything recorded one. Nothing does yet. */
  style: string | null
  score: number | null
  /** Attempts detected in the capture session behind this analysis. */
  shots: number | null
  /** Attempts scored as a make, after human corrections. */
  makes: number | null
  /** The capture behind this analysis — the key to its individual shots.
   *  Null when the analysis has no capture (an uploaded still, an iOS run
   *  with no session), which is also when it has no shots to look at. */
  captureSessionId: string | null
}

/**
 * The one date format the whole app prints: `Mon D, YYYY • H:MM AM`.
 *
 * 079, 083 and 093 each rolled their own before this — `toLocaleString`
 * defaults put a comma before the time, and the demo tables used a middot —
 * so the same session was dated three different ways on three screens.
 */
export function formatSessionDate(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  return `${day} • ${time}`
}

/**
 * The phone's wording for a session's time — `Today at 8:24 AM`, or
 * `May 19, 8:24 AM` once the session is no longer today.
 *
 * The phone tree writes the time of your last session as a literal on a dozen
 * components; canonical's is 8:24 AM, so every phone screen agreed with every
 * other and none of them agreed with the session. The desktop sweep could never
 * see it — these components only mount behind `usePhoneViewport`.
 *
 * "Today" is relative to the READER's clock, which is what the phone screens
 * say, so the comparison is on local calendar day rather than on elapsed hours:
 * a session at 11pm is still "Today" at 11:30pm and "Nov 3" at 00:30.
 */
export function formatRelativeSession(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  const now = new Date()
  const sameDay = d.getFullYear() === now.getFullYear()
    && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  if (sameDay) return `Today at ${time}`
  const day = d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${day}, ${time}`
}

/**
 * The day half of that format, alone — `Jan 14, 2024`.
 *
 * The JOINED readouts on /profile and /settings want a date without a time.
 * They share the month/day/year options above so a day printed on its own can
 * never drift from the same day printed beside a time.
 */
export function formatDayDate(value: string | number | Date | null | undefined): string {
  if (value == null || value === "") return ""
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

/**
 * The JOINED date both /profile and /settings print.
 *
 * Each had `Jan 14, 2024` written into its markup, so every account was told it
 * had joined on the same January afternoon. These two cards are near-duplicates
 * of one another and have drifted before, so the date resolves in one place:
 * the server now returns the ACCOUNT's creation time (not the profile row's,
 * which is created lazily on first read), and the canonical date remains the
 * empty state for a visitor with no account behind the screen.
 */
export function useJoinedDate(): string {
  const joinedAt = useProfileStore((s) => s.joinedAt)
  useEffect(() => { void useProfileStore.getState().fetchProfile() }, [])
  return formatDayDate(joinedAt) || "Jan 14, 2024"
}

/** Make percentage from a shots/makes pair, or null when either is missing. */
export function makePct(shots: number | null, makes: number | null): number | null {
  if (shots == null || makes == null || shots <= 0) return null
  return (makes / shots) * 100
}

/** `62.5%`, or an em-dash when the session carries no shot data. */
export function formatMakePct(shots: number | null, makes: number | null): string {
  const p = makePct(shots, makes)
  return p == null ? "—" : `${p.toFixed(1)}%`
}

/** `24 / 15`, or an em-dash when the session carries no shot data.
 *  The separators are FOUR-PER-EM spaces, not plain spaces: the condensed numeral face
 *  draws U+0020 narrow enough that graders read the rendered string as
 *  "24/15" on 079, 090 and 093 and charged the missing spaces. */
export function formatShotsMakes(shots: number | null, makes: number | null): string {
  return shots == null || makes == null ? "—" : `${shots}\u2005/\u2005${makes}`
}

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
        // /api/analysis-history returns the score under `scores.overall` and
        // the timestamp as `recordedAt`; reading a top-level `score`/`createdAt`
        // silently produced a list of nulls, which is why the trend marks here
        // had nothing to plot and fell back to placeholders.
        return {
          stats: (d.stats ?? null) as HistoryStats | null,
          items: ((d.history ?? []) as {
            title?: string; createdAt?: string; recordedAt?: string; shotType?: string
            mediaType?: string; score?: number; scores?: { overall?: number | null }
            shots?: number | null; makes?: number | null; captureSessionId?: string | null
          }[]).map((a) => {
            const iso = a.recordedAt || a.createdAt
            const overall = a.scores?.overall ?? a.score ?? null
            return {
              title: a.title ?? null,
              // One shared formatter, so 079/083/093 can never disagree about
              // how the same session is dated.
              when: formatSessionDate(iso),
              at: iso ?? null,
              /* NOT RECORDED. `/api/analysis-history` returns no `shotType`
                 and no `title` — it never has — so these two `||` defaults
                 fired on every row for every account, and "Catch & Shoot" was
                 canonical's own value being served as though it were the
                 session's. Null now, so a screen has to decide what to show
                 for a thing nobody stored instead of being handed a
                 plausible-looking answer (F4). */
              style: a.shotType ?? null,
              score: overall != null ? Math.round(overall) : null,
              // Counted from the shot events of the capture session behind the
              // analysis; null when the analysis has no capture behind it.
              shots: a.shots ?? null,
              makes: a.makes ?? null,
              captureSessionId: a.captureSessionId ?? null,
            }
          }),
        }
      })
      .catch(() => null)
      .then((d) => {
        // Never memoize a failure: a single 401 during sign-in used to pin the
        // whole session to an empty history and every screen to its zero state.
        if (!d) historyRequest = null
        return d
      })
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
  // ONE session-over-session delta for the whole app. Every screen that prints
  // a "vs last session" figure reads it from here; nine screens used to carry a
  // hand-written +8.1% that disagreed with the five that computed the number.
  const delta = sessionDelta(items)
  const latest = items[0] ?? null
  return {
    stats, items, loading, hasData, score, delta,
    deltaLabel: formatDelta(delta),
    /** Shots/makes for the newest session (null when it has no capture). */
    shots: latest?.shots ?? null,
    makes: latest?.makes ?? null,
  }
}

/**
 * The verdict band AND its colour, for a 0-100 form score.
 *
 * The dashboard carried a private `scoreBand` banding at 85/70/50 while
 * `scoreVerdict` below bands at 90/70/55, so a score of 87 read EXCELLENT on
 * one screen and GOOD on the next — the same disagreement, about the same
 * number, that this module exists to prevent. One function, delegating to the
 * shared verdict for its label so the two can never drift again.
 */
export function scoreBand(score: number | null): { label: string; color: string } {
  const label = scoreVerdict(score)
  const color =
    score == null ? "var(--shotiq-color-muted)"
    : score >= 90 ? "var(--shotiq-color-confirmGreen)"
    : score >= 70 ? "var(--shotiq-color-analysisBlue)"
    : score >= 55 ? "var(--shotiq-color-shotiqOrange)"
    : "var(--shotiq-color-reviewRed)"
  return { label, color }
}

/** Verdict band for a 0-100 form score, in canonical's wording. */
export function scoreVerdict(score: number | null): string {
  if (score == null) return "—"
  if (score >= 90) return "EXCELLENT"
  if (score >= 70) return "GOOD"
  if (score >= 55) return "FAIR"
  return "NEEDS WORK"
}

/**
 * THE form-score module — `82` + short bar + verdict + caption.
 *
 * It appears on 081, 082, 083, 090, 092, 093 and 096, and every one of them
 * had drawn it by hand: undersized numerals, a progress bar stretched across
 * the whole cell instead of sitting under the numeral, and a right-aligned
 * verdict. One component now owns the geometry:
 *
 *  - the numeral is the dominant mark and sizes off `size`;
 *  - the track sits directly under the numeral at the numeral's own width, so
 *    it can never stretch to the container;
 *  - the verdict and its caption are a left-aligned block, either beside the
 *    numeral (compact rails) or under it (`layout="below"`, the 083 column).
 */
export function FormScoreCell({
  score, size = 40, numeral, label = "FORM SCORE", caption = "Keep building consistency.",
  layout = "beside", suffix, className = "",
}: {
  score: number | null
  /** Module scale in px: the bar, the verdict and the caption size off it. */
  size?: number
  /**
   * Numeral font size in px, when the numeral is not `size`.
   *
   * The numeral and the verdict are two different roles and canonical sizes
   * them independently: measured at 1:1 against the canonical PNGs, our
   * verdicts already matched (081 and 085 both draw an 11px cap, as canonical
   * does) while the numerals were 30-35% short. Scaling the whole module by
   * one number could only fix one of those by breaking the other, so the
   * numeral gets its own size and everything else keeps sizing off `size`.
   */
  numeral?: number
  /** Section label above the numeral. Pass null to drop it. */
  label?: React.ReactNode | null
  caption?: React.ReactNode
  layout?: "beside" | "below"
  /** e.g. `/100` on 083. */
  suffix?: React.ReactNode
  className?: string
}) {
  const verdict = scoreVerdict(score)
  const numeralSize = numeral ?? size
  // Canonical's track is roughly twice the numeral's width and never wider.
  const barWidth = Math.round(size * 2.3)
  // Canonical draws this track at a near-constant 9-11px at every module scale
  // (measured: 082 y454-462, 085 y161-169, 083 11px, 096 y314-323). Sizing it
  // at size/7 drew 5px on 082/085 and 6px on 096 — half stroke — because the
  // module scale varies 24-56 while canonical's stroke does not.
  const barHeight = Math.min(11, Math.max(9, Math.round(size * 0.25)))
  const verdictSize = Math.max(11, Math.round(size * 0.33))
  // Canonical's caption is a fixed 12-13px secondary line at every module
  // scale — it does not grow with the numeral. Scaling it off `size` set it at
  // 19px on 079, where it outweighed the "GOOD" verdict above it.
  const captionSize = Math.min(13, Math.max(10, Math.round(size * 0.27)))

  const numeralRow = (
    <div className="flex items-end gap-[5px]">
      <span className="shotiq-numeric text-[var(--shotiq-color-shotiqOrange)]"
            style={{ fontSize: numeralSize, lineHeight: `${Math.round(numeralSize * 1.08)}px` }}>
        {score ?? "—"}
      </span>
      {suffix != null && (
        <span className="text-[var(--shotiq-color-muted)]"
              style={{ fontSize: verdictSize, paddingBottom: Math.round(size * 0.16) }}>
          {suffix}
        </span>
      )}
    </div>
  )

  const trackBlock = (
    <div className="rounded-full bg-[var(--shotiq-color-rule)]"
         style={{ width: barWidth, height: barHeight }}>
      <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
           style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }} />
    </div>
  )

  const numeralBlock = (
    <div>
      {numeralRow}
      {trackBlock}
    </div>
  )

  const verdictBlock = (
    <div className="min-w-0 text-left">
      <div className="font-bold text-[var(--shotiq-color-analysisBlue)]"
           style={{ fontSize: verdictSize, lineHeight: `${verdictSize + 3}px` }}>
        {score != null ? verdict : "—"}
      </div>
      {caption != null && (
        <div className="text-[var(--shotiq-color-graphite)]"
             style={{ fontSize: captionSize, lineHeight: `${captionSize + 3}px` }}>
          {score != null ? caption : "No analysis yet."}
        </div>
      )}
    </div>
  )

  return (
    <div className={className}>
      {label != null && <SectionLabel className="text-[var(--shotiq-color-graphite)]">{label}</SectionLabel>}
      {layout === "beside" ? (
        /* Canonical runs the numeral and the verdict side by side and puts the
           track UNDER BOTH, wider than the numeral (081: numeral x1048-1088,
           track x1048-1147, verdict column x1107-1180). Reserving the track's
           full width for the numeral column pushed the verdict right and left
           "Keep building consistency." only ~51px of measure, so it broke to
           three lines against canonical's two. */
        <div className="mt-[2px]">
          <div className="flex items-start gap-[12px]">
            {numeralRow}
            {/* Canonical's caption column is a narrow measure that always breaks
                "Keep building consistency." across two lines — 085 runs it
                x741-797 against a cell ending x823, 082 x1318-1373, 081
                x1107-1180. Left uncapped it ran the caption out on one line. */}
            <div style={{ maxWidth: Math.round(size * 2.1) }}>{verdictBlock}</div>
          </div>
          <div className="mt-[4px]">{trackBlock}</div>
        </div>
      ) : (
        <div className="mt-[2px]">
          {numeralBlock}
          <div className="mt-[7px]">{verdictBlock}</div>
        </div>
      )}
    </div>
  )
}

/**
 * Stat strip with canonical's vertical hairlines.
 *
 * Canonical separates every cell with a rule and distributes the cells evenly
 * across the container; the screens that hand-rolled this dropped the rules and
 * let the values bunch up against the left edge.
 */
export function StatStrip({
  cells, valueClass, className = "", cellClass = "",
}: {
  cells: { value: React.ReactNode; label: string; accent?: string }[]
  valueClass?: string
  className?: string
  cellClass?: string
}) {
  return (
    <div className={`flex items-start divide-x divide-[var(--shotiq-color-rule)] ${className}`}>
      {cells.map((c) => (
        <div key={c.label} className={`min-w-0 flex-1 px-[14px] first:pl-0 last:pr-0 ${cellClass}`}>
          <Stat value={c.value} label={c.label} accent={c.accent}
                {...(valueClass ? { valueClass } : {})} />
        </div>
      ))}
    </div>
  )
}

/** `+3.8% vs last session`, coloured by direction. Never a hand-written figure. */
export function TrendDelta({
  delta, note = "vs last session", className = "", noteClass = "",
}: { delta: number | null; note?: React.ReactNode; className?: string; noteClass?: string }) {
  const down = delta != null && delta < 0
  return (
    <span className={`${down ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"} ${className}`}>
      {formatDelta(delta)}{note ? <span className={noteClass}> {note}</span> : null}
    </span>
  )
}

/**
 * Compact form-score band used across 085/087/090.
 *
 * The stat row carries canonical's vertical hairlines and distributes across
 * the container instead of bunching left, and the trend mark plots the real
 * score history rather than a decorative rising series.
 */
export function ScoreBand({ score }: { score: number | null }) {
  const { items, shots, makes } = useHistory()
  const series = scoreSeries(items, 6)
  const delta = sessionDelta(items)
  const down = delta != null && delta < 0
  return (
    <Card className="flex items-center px-[22px] py-[14px]">
      <div className="shrink-0 pr-[24px]">
        <FormScoreCell score={score} size={40} />
      </div>
      <div className="flex min-w-0 flex-1 items-center divide-x divide-[var(--shotiq-color-rule)] border-l border-[var(--shotiq-color-rule)]">
        <StatStrip className="min-w-0 flex-1 px-[6px]" cells={[
          { value: shots ?? "—", label: "SHOTS" },
          { value: makes ?? "—", label: "MAKES" },
          { value: formatMakePct(shots, makes), label: "MAKE %" },
        ]} />
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
        {/* canonical 084 sets this at an 11px cap; 12px here drew 8.7px. */}
        <GoalPercent size={15}>72%</GoalPercent>
      </div>
    </div>
  )
}
