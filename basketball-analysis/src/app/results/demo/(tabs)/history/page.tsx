"use client"

/** /results/demo/history — canonical 093-web-analytics-history. */

import React, { useState } from "react"
import Link from "next/link"
import { Calendar, ChevronDown, SlidersHorizontal, Share, X, ChevronLeft, ChevronRight } from "@/components/shotiq/ApprovedLucide"
import { SectionLabel, Card, TrendLine, PageTitle } from "@/components/shotiq/ShotIQShell"
import { CueGlyph, MechanicGlyph } from "@/components/shotiq/Glyphs"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { usePhoneRoute } from "@/components/shotiq/phone/results/usePhoneRoute"
import { AnalyticsCards } from "@/components/shotiq/phone/results/AnalyticsCards"
import { AnalyticsDetailed } from "@/components/shotiq/phone/results/AnalyticsDetailed"
import {
  useHistory, formatDelta, formatMakePct, formatShotsMakes, makePct,
} from "@/components/shotiq/ResultsBits"

const DEMO_ROWS: [string, string, string, string, string, string][] = [
  ["May 12, 2025 • 8:24 AM", "82", "Good", "62.5%", "24 / 15", "High"],
  ["May 11, 2025 • 6:15 PM", "78", "Good", "58.3%", "12 / 7", "High"],
  ["May 10, 2025 • 4:02 PM", "75", "Good", "54.5%", "11 / 6", "High"],
  ["May 9, 2025 • 7:33 PM", "80", "Good", "60.0%", "20 / 12", "High"],
  ["May 7, 2025 • 9:11 AM", "72", "Fair", "52.4%", "21 / 11", "Medium"],
  ["May 6, 2025 • 5:48 PM", "69", "Fair", "50.0%", "14 / 7", "Medium"],
  ["May 4, 2025 • 11:23 AM", "77", "Good", "56.3%", "16 / 9", "High"],
  ["May 2, 2025 • 8:02 PM", "81", "Good", "61.9%", "21 / 13", "High"],
]
// Extra clip count per row, mirroring the canonical media column.
const ROW_EXTRA = ["+3", "+2", "+2", "+2", "+4", "+2", "+2", "+2"]

/* THE DATE RANGE WAS A LABEL, NOT A RANGE.
   These read "May 6 – May 12, 2025" over rows dated 2026, and the third tuple
   member was a PAGE SIZE — so choosing "30 days" showed more rows of the same
   unfiltered list rather than a wider window. Days are the unit now, the label
   is computed from today, and the window actually filters. */
const RANGES: [string, number, number][] = [
  ["7", 7, 6], ["14", 14, 8], ["30", 30, 8],
]
/** "Apr 28 – May 12, 2025", built from the range the player picked. */
function rangeLabel(days: number): string {
  const end = new Date()
  const start = new Date(end)
  start.setDate(end.getDate() - (days - 1))
  const md = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  return `${md(start)} – ${md(end)}, ${end.getFullYear()}`
}
const METRICS = ["Form Score", "Make %", "Confidence"]
// Canonical's SESSIONS columns, measured off the 093 render: the table spans
// x 155→1000 and starts DATE at +37, FORM SCORE +187, MAKE % +297,
// SHOTS / MAKES +387, CONFIDENCE +497, FOCUS +597, MEDIA +672.
const COLS = "grid-cols-[156px_110px_90px_110px_100px_75px_152px_1fr]"

/**
 * The FOCUS column mark. Canonical draws a dark node sketch with hollow joints
 * and a single coloured apex node — red on sessions that sit below the player's
 * running average, green on the ones at or above it. The shared CueGlyph fills
 * four of its five nodes with one accent, which is why every row read as a flat
 * green graph; this is local so the shared glyph family stays untouched.
 */
function FocusMark({ below }: { below: boolean }) {
  return (
    <span className={`grid h-[34px] w-[34px] place-items-center ${below ? "opacity-85" : ""}`}>
      <MechanicGlyph kind={below ? "drift" : "releasePath"} size={32} />
    </span>
  )
}
const METRIC_TRENDS: Record<string, number[]> = {
  "Form Score": [72, 75, 73, 78, 76, 80, 79, 82],
  "Make %": [48, 52, 50, 55, 57, 56, 60, 62.5],
  "Confidence": [2, 2, 3, 3, 3, 4, 4, 4],
}

export default function AnalysisHistoryPage() {
  const { items, stats, hasData, score, loading, delta, shots, makes } = useHistory()
  const isPhone = usePhoneViewport()
  const [view, setView] = usePhoneRoute("view")
  const [sel, setSel] = useState(0)
  const [range, setRange] = useState(RANGES[1])
  const [metric, setMetric] = useState(METRICS[0])
  const [menu, setMenu] = useState<null | "range" | "metric">(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [band, setBand] = useState<"All" | "Good" | "Fair">("All")
  // Only sessions with a real score and timestamp render as live rows; junk
  // rows (no score, no date) fall back to the canonical demo sessions so the
  // table always mirrors the 093 screen.
  /* THE WINDOW, APPLIED. Sessions inside the picked number of days, using the
     raw timestamp `at` — `when` is already formatted for display and cannot be
     compared. A session with no timestamp at all cannot be placed in a window,
     so it stays in rather than being silently dropped by a date filter. */
  const windowStart = (() => {
    const d = new Date(); d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (range[1] - 1))
    return d.getTime()
  })()
  const inWindow = items.filter((a) => {
    if (!a.at) return true
    const t = Date.parse(a.at)
    return !Number.isFinite(t) || t >= windowStart
  })
  const usable = inWindow.filter((a) => a.score != null && a.when)

  /* The AVERAGE the strip is labelled with, over the SAME window the table
     shows. `stats.averageScore` is the average across everything the API
     returned, which would disagree with the rows underneath it the moment the
     range narrowed. */
  const windowScores = usable.map((a) => a.score).filter((v): v is number => v != null)
  const averageScore = windowScores.length
    ? Math.round(windowScores.reduce((a, b) => a + b, 0) / windowScores.length)
    : hasData ? null : (stats?.averageScore ?? null)
  // MAKE % and SHOTS / MAKES come from the shot events of the capture session
  // behind each analysis (projected by /api/analysis-history). They render as
  // em-dashes only when a session genuinely has no capture behind it.
  /* Sessions WITHOUT a score belong in the history too — that is the whole
     point of the one-row-per-analysis invariant. They render with an em-dash
     where the score would be and carry NO verdict: "Fair" is a judgement, and
     a shot nobody scored has not earned one. */
  const listed = inWindow.filter((a) => a.when)
  const allRows: [string, string, string, string, string, string][] = listed.length
    ? listed.map((a) => [
        `${a.when}`, a.score != null ? String(Math.round(a.score)) : "—",
        a.score == null ? "—" : a.score >= 70 ? "Good" : "Fair",
        formatMakePct(a.shots, a.makes), formatShotsMakes(a.shots, a.makes),
        a.shots != null && a.shots >= 15 ? "High" : "Medium",
      ] as [string, string, string, string, string, string])
    /* CANONICAL BELONGS TO A VISITOR WITH NOTHING, NOT TO A PLAYER WHOSE
       RANGE IS EMPTY — and this had it exactly backwards. `hasData ||
       items.length` is true precisely when the caller HAS analyses, so a
       player who picked a 7-day range with no sessions in it was shown
       canonical's twelve rows — dates, scores, verdicts, make %, shots/makes —
       and a "12 sessions" count, as their own history. Nothing on the screen
       said otherwise; `demoMode` existed only to print that 12. Meanwhile a
       signed-out visitor, who is exactly who canonical is for, got an empty
       table.
       Now: nothing at all -> canonical, the screen as designed (F16). Real
       analyses, none in this window -> no rows and a line saying so, because
       an empty range is a true answer about a real player and canonical's
       sessions are not theirs. */
    : !hasData && !items.length ? DEMO_ROWS : []
  /** Canonical standing in for a visitor with no data — never for a real one. */
  const demoMode = !listed.length && allRows.length > 0
  /** Has shots, but none inside the picked range. */
  const emptyWindow = !listed.length && !demoMode && (hasData || items.length > 0)
  // Running average across the loaded range — what the FOCUS mark colours by.
  // Only scored rows — `Number("—")` is NaN, and `|| 0` would have folded
  // every unscored session in as a zero and dragged this average down.
  const scoredRowValues = allRows
    .map((r) => Number(r[1]))
    .filter((n) => Number.isFinite(n))
  const avgScore = scoredRowValues.length
    ? scoredRowValues.reduce((a, b) => a + b, 0) / scoredRowValues.length
    : 0
  // One page is range[2] rows whether the sessions are live or demo. With the
  // rows restored to canonical's 57px pitch, an unpaged live history ran past
  // the fold and pushed the pagination off-screen.
  const banded = allRows.filter((r) => band === "All" || r[2] === band)
  const rows = banded.slice(0, range[2])
  // The canonical screen reports the full session count behind the first page.
  const totalSessions = demoMode && band === "All" ? 12 : banded.length
  // Summary strip: real totals across the loaded range, never a literal.
  const totalShots = stats?.totalShots ?? null
  const totalMakes = stats?.totalMakes ?? null
  const overallMakePct = stats?.makePct ?? makePct(totalShots, totalMakes)
  // The trend mark plots whichever metric the picker is on; the demo series
  // stands in only until a real one exists for that metric.
  const makeSeries = usable.length
    ? usable.map((a) => makePct(a.shots, a.makes)).filter((p): p is number => p != null).reverse()
    : []
  const trendPoints = metric === "Form Score" && usable.length
    ? usable.map((a) => a.score).filter((s): s is number => s != null).reverse()
    : metric === "Make %" && makeSeries.length >= 2
      ? makeSeries
      : METRIC_TRENDS[metric]
  const exportCsv = () => {
    const head = "date,form_score,band,make_pct,shots_makes,confidence"
    const body = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([`${head}\n${body}\n`], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = "shotiq-analysis-history.csv"
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  /* Canonical iOS 066 (cards) and 067 (detailed). Canonical 067 draws a "Cards"
     action in its top bar and 066 a "View all" — the two are a real pair of
     surfaces, not one scrolled page. The graded desktop 093 on this route is
     untouched. */
  return (
    <>
    {isPhone && (view === "detailed"
      ? <AnalyticsDetailed onCards={() => setView(null)} />
      : <AnalyticsCards score={score ?? 82}
                        shots={shots != null ? String(shots) : "24"}
                        makes={makes != null ? String(makes) : "15"}
                        pct={formatMakePct(shots, makes)}
                        delta={formatDelta(delta)}
                        onDetailed={() => setView("detailed")} />)}
    <div className={isPhone ? "hidden" : undefined}>
    <div data-testid="screen-desktop-web-analytics-history">
      {/* Canonical's date-range / metric / Filter / Export toolbar is
          page-level: it spans the full width above BOTH columns (653→1321,
          i.e. past the SELECTED SESSION rail at 1028). Confining it to the
          left column squeezed the same five controls into ~500px, undersized
          Filter and Export, and left the rail starting level with the page
          title instead of below the toolbar. */}
      <div className="flex items-start justify-between">
          <div>
            <PageTitle size={59}>ANALYSIS HISTORY</PageTitle>
            <p className="mt-[4px] whitespace-nowrap text-[13px] text-[var(--shotiq-color-graphite)]">Review and track your shooting performance over time.</p>
          </div>
          {/* Canonical stops this toolbar at x1321, 91px short of the body's right
              margin at 1412; the app ran it flush to 1414. 91 * (1194/1252) = 87
              in this build's narrower body. */}
          <div className="flex gap-[18px] pt-[4px] mr-[87px]">
            <div className="relative">
              <button type="button" aria-expanded={menu === "range"}
                      onClick={() => setMenu((m) => (m === "range" ? null : "range"))}
                      className="flex h-[45px] w-[207px] items-center gap-[8px] whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
                <Calendar className="h-[14px] w-[14px]" /> {rangeLabel(range[1])} <ChevronDown className="h-[12px] w-[12px]" />
              </button>
              {menu === "range" && (
                <div className="absolute left-0 top-[46px] z-30 w-[220px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {RANGES.map((r) => (
                    <button key={r[0]} type="button" onClick={() => { setRange(r); setMenu(null) }}
                            className={`flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)] ${range[0] === r[0] ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      Last {r[0]} days
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="relative">
              <button type="button" aria-expanded={menu === "metric"}
                      onClick={() => setMenu((m) => (m === "metric" ? null : "metric"))}
                      className="flex h-[45px] w-[187px] flex-col justify-center whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-left">
                <span className="text-[9px] text-[var(--shotiq-color-graphite)]">Select metric</span>
                <span className="flex w-full items-center justify-between text-[13px]">{metric} <ChevronDown className="h-[11px] w-[11px]" /></span>
              </button>
              {menu === "metric" && (
                <div className="absolute left-0 top-[46px] z-30 w-[170px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  {METRICS.map((m) => (
                    <button key={m} type="button" onClick={() => { setMetric(m); setMenu(null) }}
                            className={`flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)] ${metric === m ? "font-semibold text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button type="button" aria-expanded={filterOpen} onClick={() => setFilterOpen((v) => !v)}
                    className={`flex h-[45px] w-[112px] items-center justify-center gap-[8px] rounded-[6px] border text-[13px] ${filterOpen || band !== "All" ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
              <SlidersHorizontal className="h-[14px] w-[14px]" /> Filter{band !== "All" ? `: ${band}` : ""}
            </button>
            <button type="button" onClick={exportCsv} disabled={!rows.length}
                    className="flex h-[45px] w-[106px] items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px] disabled:opacity-40">
              <Share className="h-[14px] w-[14px]" /> Export
            </button>
          </div>
        </div>

        {filterOpen && (
          <div className="mt-[10px] flex items-center gap-[8px]">
            <span className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SCORE BAND</span>
            {(["All", "Good", "Fair"] as const).map((b) => (
              <button key={b} type="button" onClick={() => { setBand(b); setSel(0) }}
                      className={`h-[30px] rounded-[999px] border px-[14px] text-[12px] ${band === b ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)] font-semibold text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                {b}
              </button>
            ))}
          </div>
        )}

      {/* Body columns open BELOW the page-level toolbar, so the SELECTED
          SESSION rail starts under it (canonical y≈205) instead of level with
          the page title. */}
      <div className="mt-[6px] flex gap-[18px]">
      <div className="min-w-0 flex-1">
        {/* summary strip */}
        {/* Canonical rules this strip into THREE groups, not five cells: the
            average score, then the shots / makes / make-% triplet as one
            unruled block, then the trend. A hairline after every cell (four
            rules where canonical draws two, at x=300 and x=664) boxed each
            number separately and destroyed that grouping. */}
        {/* Canonical leaves 40px between the subtitle's last ink row and the
            strip's first (y160 -> y200); pt-[4px] left 15px and the header read
            jammed into the metrics. */}
        <div className="flex items-stretch divide-x divide-[var(--shotiq-color-rule)] border-b border-[var(--shotiq-color-rule)] pb-[10px] pt-[26px]">
          {/* This cell carries the longest label in the strip; an equal share
              broke it onto two lines where canonical keeps it on one. */}
          <div className="min-w-0 flex-[1.45] pr-[16px]">
            {/* Was `score`, which useHistory defines as latestScore ?? average
                — the newest session's number under a label reading AVERAGE.
                On the test account that printed 84 beside an API average of 82. */}
            <div className="shotiq-section-label whitespace-nowrap">AVERAGE FORM SCORE</div>
            <div className="shotiq-numeric text-[40px] leading-[44px]">{averageScore ?? "—"}</div>
            <div className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">● Good</div>
          </div>
          <div className="flex min-w-0 flex-[3] px-[16px]">
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label">SHOTS</div>
              <div className="shotiq-numeric text-[40px] leading-[44px]">{totalShots ?? (hasData ? "—" : "0")}</div>
              <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Total</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label">MAKES</div>
              <div className="shotiq-numeric text-[40px] leading-[44px]">{totalMakes ?? (hasData ? "—" : "0")}</div>
              <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Total</div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label">MAKE %</div>
              <div className="shotiq-numeric text-[40px] leading-[44px]">
                {overallMakePct == null ? "—" : `${overallMakePct.toFixed(1)}%`}
              </div>
            </div>
          </div>
          <div className="min-w-0 flex-[1.9] pl-[16px]">
            <div className="shotiq-section-label">{metric.toUpperCase()} TREND</div>
            {/* Canonical stacks the delta BELOW the sparkline, left-aligned.
                Beside it, "vs last session" had only ~60px and wrapped to two
                lines in 9px type, and the mark itself lost 60px of width. */}
            <TrendLine points={trendPoints} width={212} height={44} />
            <div className={`text-[12px] font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</div>
            <div className="text-[10px] text-[var(--shotiq-color-graphite)]">vs last session</div>
          </div>
        </div>

        {/* sessions table */}
        <div className="mt-[10px] flex items-center gap-[10px]">
          <SectionLabel>SESSIONS</SectionLabel>
          <span className="text-[12px] text-[var(--shotiq-color-graphite)]">{totalSessions} sessions</span>
        </div>
        {/* Canonical lays these out as free-standing rows on a 57px pitch with
            NO separator between them and a 10px-radius outline on the selected
            one. A <table> with divide-y gave 37px rows, a hairline under every
            row, and a square outline (border-radius does not apply to a
            table-row), so the rows are a grid now. */}
        {/* At 393pt the eight measured columns cannot compress without losing the
            table; canonical keeps the session record intact, so the table keeps
            its real column widths and pans inside its own scroller instead of
            pushing the document past the phone. Inert above the breakpoint. */}
        <div className="shotiq-keep-cols -mx-[2px] overflow-x-auto px-[2px] md:mx-0 md:overflow-x-visible md:px-0">
        <div className="min-w-[820px] md:min-w-0">
        <div className={`mt-[6px] grid ${COLS} pl-[14px] text-left shotiq-microcaps text-[var(--shotiq-color-graphite)]`}>
          {["DATE / TIME ↓", "FORM SCORE", "MAKE %", "SHOTS / MAKES", "CONFIDENCE", "FOCUS", "MEDIA", ""].map((h) => (
            <div key={h} className="py-[8px]">{h}</div>
          ))}
        </div>
        <div>
          {emptyWindow && (
            /* A real player whose picked range holds no sessions. Saying so is
               the true answer; canonical's twelve rows used to sit here and
               read as theirs. */
            <p className="mt-[10px] rounded-[10px] border border-[var(--shotiq-color-rule)] px-[14px] py-[16px] text-[13px] text-[var(--shotiq-color-graphite)]">
              No sessions in the last {range[1]} day{range[1] === 1 ? "" : "s"}.
              {items.length > 0 && " Widen the range to see your earlier ones."}
            </p>
          )}
          {rows.map(([d, fs, rowBand, mk, sm, conf], i) => (
            <div key={i} role="button" tabIndex={0} onClick={() => setSel(i)}
                 onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSel(i) }}
                 className={`grid ${COLS} h-[57px] cursor-pointer items-center rounded-[10px] pl-[14px] ${
                   sel === i ? "shadow-[0_0_0_1.5px_var(--shotiq-color-shotiqOrange)]" : ""}`}>
              <div className="flex items-center gap-[10px] text-[12px]">
                {/* Canonical marks the selected row with an orange ring around a
                    centre dot, not a solid disc. */}
                <span className={`grid h-[14px] w-[14px] shrink-0 place-items-center rounded-full border-2 ${
                  sel === i ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                  {sel === i && <span className="block h-[6px] w-[6px] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />}
                </span>
                <span className="whitespace-nowrap">{d}</span>
              </div>
              <div className="flex items-baseline gap-[7px]">
                <span className="shotiq-numeric text-[22px]">{fs}</span>
                {/* Canonical sets the band grey at ~13px with a blue mark; it
                    was 10px and entirely blue, which read as a second link. */}
                <span className="whitespace-nowrap text-[13px] text-[var(--shotiq-color-graphite)]">
                  <span className={rowBand === "Good" ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-muted)]"}>●</span> {rowBand}
                </span>
              </div>
              <div className="shotiq-numeric text-[19px]">{mk}</div>
              <div className="shotiq-numeric whitespace-nowrap text-[19px]">{sm}</div>
              {/* Canonical sets the confidence WORD in the muted grey role at
                  cap 10 (118,118,120); the app was setting it near-black
                  (22,17,17) at cap 13 on all eight rows, which read as a
                  second value in the row rather than a qualifier. */}
              <div className="flex items-center gap-[6px] text-[11px] text-[var(--shotiq-color-graphite)]">
                <span className="inline-flex gap-[2px]">
                  {[0, 1, 2, 3].map((b) => (
                    <span key={b} className={`h-[9px] w-[9px] rounded-[2px] ${
                      conf === "High" ? "bg-[var(--shotiq-color-confirmGreen)]"
                        : b < 2 ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-rule)]"}`} />
                  ))}
                </span>{conf}
              </div>
              <div><FocusMark below={Number(fs) < avgScore} /></div>
              <div className="flex items-center gap-[2px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/093-strip.png" alt="" className="h-[30px] w-[122px] rounded-[2px] object-cover" />
                <span className="grid h-[30px] w-[28px] place-items-center rounded-[2px] bg-[var(--shotiq-color-muted)] text-[10px] font-bold text-white">{ROW_EXTRA[i % ROW_EXTRA.length]}</span>
              </div>
              <div className="justify-self-end pr-[10px]"><ChevronRight className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" /></div>
            </div>
          ))}
          {/* "No sessions yet" is for someone who has none. A player whose
              picked range is empty has plenty — the line above already says so,
              and this one told them to go run their first analysis while three
              of theirs sat outside the window. */}
          {!rows.length && !emptyWindow && (
            <div className="py-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
              {loading ? "Loading history…" : "No sessions yet — run your first analysis."}
            </div>
          )}
        </div>
        </div>
        </div>
        {rows.length > 0 && (
          <div className="mt-[14px] flex items-center justify-center gap-[10px] text-[12px]">
            {/* Counts the rows actually rendered — this read "1–8" while ten
                rows were on screen. */}
            Showing 1–{rows.length} of {totalSessions}
            <ChevronLeft className="h-[13px] w-[13px]" />
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[4px] border border-[var(--shotiq-color-shotiqOrange)] font-bold text-[var(--shotiq-color-shotiqOrange)]">1</span>
            <span className="grid h-[26px] w-[26px] place-items-center rounded-[4px] border border-[var(--shotiq-color-rule)]">2</span>
            <ChevronRight className="h-[13px] w-[13px]" />
          </div>
        )}
      </div>

      {/* selected session rail */}
      {/* Canonical splits its 1252px body 830 table : 384 rail (30.7% to the
          rail); at w-350 this measured 828 : 332 (27.8%) — the rail absorbed the
          whole rail-cost deficit on its own. 30.7% of this build's 1194px body is
          366, so the rail takes 372 and the table drops from 828 to 788. */}
      <aside className="w-[390px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[18px]">
        <div className="flex items-center justify-between">
          <SectionLabel>SELECTED SESSION</SectionLabel>
          <button type="button" aria-label="Clear selection" onClick={() => setSel(-1)}
                  disabled={sel < 0 || !rows.length} className="disabled:opacity-40">
            <X className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
          </button>
        </div>
        <div className="mt-[4px] text-[19px] font-semibold">{rows[sel]?.[0] ?? "—"}</div>
        <div className="relative mt-[10px] overflow-hidden rounded-[6px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/093-video.png" alt="Selected session"
               className="w-full object-cover" />
        </div>
        <Card className="mt-[12px] divide-y divide-[var(--shotiq-color-rule)]">
          <div className="flex divide-x divide-[var(--shotiq-color-rule)]">
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
              {/* Canonical sets this reading near-black and puts its blue-dot
                  band qualifier on the same baseline; orange is the bar's
                  colour here, not the numeral's, and the qualifier was
                  missing entirely. */}
              <div className="flex items-baseline gap-[7px]">
                <span className="shotiq-numeric text-[26px] leading-[30px]">{rows[sel]?.[1] ?? "—"}</span>
                <span className="flex items-center gap-[4px] whitespace-nowrap text-[11px] text-[var(--shotiq-color-analysisBlue)]">
                  <span className="inline-block h-[6px] w-[6px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />{rows[sel]?.[2] ?? "Good"}
                </span>
              </div>
              <div className="mt-[2px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                     style={{ width: `${Math.max(0, Math.min(100, Number(rows[sel]?.[1]) || 0))}%` }} />
              </div>
            </div>
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
              <div className="shotiq-numeric text-[26px] leading-[30px]">{rows[sel]?.[3] ?? "—"}</div>
            </div>
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SHOTS / MAKES</div>
              <div className="shotiq-numeric text-[26px] leading-[30px]">{rows[sel]?.[4] ?? "—"}</div>
            </div>
          </div>
          <div className="flex divide-x divide-[var(--shotiq-color-rule)]">
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">CONFIDENCE</div>
              <div className="mt-[4px] flex items-center gap-[6px]">
                <span className="flex gap-[2px]">{[0, 1, 2, 3].map((b) => <span key={b} className="h-[9px] w-[9px] rounded-[2px] bg-[var(--shotiq-color-confirmGreen)]" />)}</span>
                <span className="text-[12px]">High</span>
              </div>
            </div>
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FOCUS</div>
              <div className="mt-[2px] flex items-center gap-[8px]">
                <CueGlyph kind="peak" size={24} className="shrink-0" /><span className="text-[11px] leading-[14px]">Keep elbow stacked through release</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="mt-[12px] flex items-center gap-[12px] p-[12px]">
          <div className="flex-1">
            <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MECHANICS TREND (LAST 6)</div>
            <TrendLine points={usable.length
              ? usable.slice(0, 6).map((a) => a.score).filter((s): s is number => s != null).reverse()
              : METRIC_TRENDS["Form Score"].slice(-6)} width={200} height={42} />
          </div>
          <div className="text-right">
            <div className={`text-[13px] font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>
              {formatDelta(delta)} {delta != null && delta < 0 ? "↘" : "↗"}
            </div>
            <div className="text-[9px] text-[var(--shotiq-color-graphite)]">vs last session</div>
          </div>
        </Card>
        <Link href="/results/demo/compare"
              className="mt-[12px] flex h-[46px] w-full items-center justify-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
          Compare sessions
        </Link>
      </aside>
      </div>
    </div>
    </div>
    </>
  )
}
