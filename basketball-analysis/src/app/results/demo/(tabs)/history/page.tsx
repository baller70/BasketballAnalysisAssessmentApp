"use client"

/** /results/demo/history — canonical 093-web-analytics-history. */

import React, { useState } from "react"
import Link from "next/link"
import { Calendar, ChevronDown, SlidersHorizontal, Share, X, ChevronLeft, ChevronRight } from "lucide-react"
import { SectionLabel, Card, TrendLine } from "@/components/shotiq/ShotIQShell"
import { CueGlyph } from "@/components/shotiq/Glyphs"
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

const RANGES: [string, string, number][] = [
  ["7", "May 6 – May 12, 2025", 6], ["14", "Apr 28 – May 12, 2025", 8], ["30", "Apr 12 – May 12, 2025", 8],
]
const METRICS = ["Form Score", "Make %", "Confidence"]
const METRIC_TRENDS: Record<string, number[]> = {
  "Form Score": [72, 75, 73, 78, 76, 80, 79, 82],
  "Make %": [48, 52, 50, 55, 57, 56, 60, 62.5],
  "Confidence": [2, 2, 3, 3, 3, 4, 4, 4],
}

export default function AnalysisHistoryPage() {
  const { items, stats, hasData, score, loading, delta } = useHistory()
  const [sel, setSel] = useState(0)
  const [range, setRange] = useState(RANGES[1])
  const [metric, setMetric] = useState(METRICS[0])
  const [menu, setMenu] = useState<null | "range" | "metric">(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [band, setBand] = useState<"All" | "Good" | "Fair">("All")
  // Only sessions with a real score and timestamp render as live rows; junk
  // rows (no score, no date) fall back to the canonical demo sessions so the
  // table always mirrors the 093 screen.
  const usable = items.filter((a) => a.score != null && a.when)
  // MAKE % and SHOTS / MAKES come from the shot events of the capture session
  // behind each analysis (projected by /api/analysis-history). They render as
  // em-dashes only when a session genuinely has no capture behind it.
  const allRows: [string, string, string, string, string, string][] = usable.length
    ? usable.map((a) => [
        `${a.when}`, a.score != null ? String(Math.round(a.score)) : "—",
        (a.score ?? 0) >= 70 ? "Good" : "Fair",
        formatMakePct(a.shots, a.makes), formatShotsMakes(a.shots, a.makes),
        a.shots != null && a.shots >= 15 ? "High" : "Medium",
      ] as [string, string, string, string, string, string])
    : hasData || items.length ? DEMO_ROWS : []
  const demoMode = !usable.length && allRows.length > 0
  const rows = allRows.slice(0, usable.length ? undefined : range[2])
    .filter((r) => band === "All" || r[2] === band)
  // The canonical screen reports the full session count behind the first page.
  const totalSessions = demoMode && band === "All" ? 12 : rows.length
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

  return (
    <div data-testid="screen-desktop-web-analytics-history" className="flex gap-[18px]">
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="shotiq-display text-[48px] leading-[50px]">ANALYSIS HISTORY</h1>
            <p className="mt-[4px] whitespace-nowrap text-[13px] text-[var(--shotiq-color-graphite)]">Review and track your shooting performance over time.</p>
          </div>
          <div className="flex gap-[10px] pt-[4px]">
            <div className="relative">
              <button type="button" aria-expanded={menu === "range"}
                      onClick={() => setMenu((m) => (m === "range" ? null : "range"))}
                      className="flex h-[42px] items-center gap-[8px] whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
                <Calendar className="h-[14px] w-[14px]" /> {range[1]} <ChevronDown className="h-[12px] w-[12px]" />
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
                      className="flex h-[42px] flex-col justify-center whitespace-nowrap rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-left">
                <span className="text-[9px] text-[var(--shotiq-color-graphite)]">Select metric</span>
                <span className="flex items-center gap-[6px] text-[13px]">{metric} <ChevronDown className="h-[11px] w-[11px]" /></span>
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
                    className={`flex h-[42px] items-center gap-[8px] rounded-[6px] border px-[14px] text-[13px] ${filterOpen || band !== "All" ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
              <SlidersHorizontal className="h-[14px] w-[14px]" /> Filter{band !== "All" ? `: ${band}` : ""}
            </button>
            <button type="button" onClick={exportCsv} disabled={!rows.length}
                    className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px] disabled:opacity-40">
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

        {/* summary strip */}
        {/* Canonical rules every cell off with a hairline and distributes them
            across the strip; the cells used to bunch against the left edge. */}
        <div className="mt-[12px] flex items-stretch divide-x divide-[var(--shotiq-color-rule)] border-b border-[var(--shotiq-color-rule)] pb-[14px] pt-[6px]">
          <div className="min-w-0 flex-1 pr-[16px]">
            <div className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">AVERAGE FORM SCORE</div>
            <div className="shotiq-numeric text-[40px] leading-[44px]">{score ?? "—"}</div>
            <div className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">● Good</div>
          </div>
          <div className="min-w-0 flex-1 px-[16px]">
            <div className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SHOTS</div>
            <div className="shotiq-numeric text-[40px] leading-[44px]">{totalShots ?? (hasData ? "—" : "0")}</div>
            <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Total</div>
          </div>
          <div className="min-w-0 flex-1 px-[16px]">
            <div className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKES</div>
            <div className="shotiq-numeric text-[40px] leading-[44px]">{totalMakes ?? (hasData ? "—" : "0")}</div>
            <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Total</div>
          </div>
          <div className="min-w-0 flex-1 px-[16px]">
            <div className="text-[11px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
            <div className="shotiq-numeric text-[40px] leading-[44px]">
              {overallMakePct == null ? "—" : `${overallMakePct.toFixed(1)}%`}
            </div>
          </div>
          <div className="min-w-0 flex-[1.9] pl-[16px]">
            <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">{metric.toUpperCase()} TREND</div>
            <div className="flex items-center gap-[12px]">
              <TrendLine points={trendPoints} width={220} height={44} />
              {/* The one computed session-over-session delta; this used to be a
                  hard-coded +8.1% that disagreed with the dashboard. */}
              <div><div className={`text-[12px] font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">vs last session</div></div>
            </div>
          </div>
        </div>

        {/* sessions table */}
        <div className="mt-[14px] flex items-center gap-[10px]">
          <SectionLabel>SESSIONS</SectionLabel>
          <span className="text-[12px] text-[var(--shotiq-color-graphite)]">{totalSessions} sessions</span>
        </div>
        <table className="mt-[6px] w-full text-[12px]">
          <thead>
            <tr className="text-left text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
              {["DATE / TIME ↓", "FORM SCORE", "MAKE %", "SHOTS / MAKES", "CONFIDENCE", "FOCUS", "MEDIA", ""].map((h) => (
                <th key={h} className="py-[8px] font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--shotiq-color-rule)]">
            {rows.map(([d, fs, band, mk, sm, conf], i) => (
              <tr key={i} onClick={() => setSel(i)}
                  className={`cursor-pointer ${sel === i ? "outline outline-1 outline-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                <td className="py-[16px]">
                  <span className={`mr-[8px] inline-block h-[12px] w-[12px] rounded-full border-2 align-middle ${sel === i ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`} />
                  {d}
                </td>
                <td><span className="shotiq-numeric text-[18px]">{fs}</span>
                  <span className={`ml-[6px] text-[10px] ${band === "Good" ? "text-[var(--shotiq-color-analysisBlue)]" : "text-[var(--shotiq-color-graphite)]"}`}>● {band}</span></td>
                <td className="shotiq-numeric text-[16px]">{mk}</td>
                <td className="shotiq-numeric text-[16px]">{sm}</td>
                <td>
                  <span className="mr-[6px] inline-flex gap-[2px]">
                    {[0, 1, 2, 3].map((b) => (
                      <span key={b} className={`h-[8px] w-[8px] rounded-[2px] ${
                        conf === "High" ? "bg-[var(--shotiq-color-confirmGreen)]"
                          : b < 2 ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-rule)]"}`} />
                    ))}
                  </span>{conf}
                </td>
                <td><CueGlyph kind="peak" size={22} /></td>
                <td>
                  <span className="flex items-center gap-[2px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/canonical/093-strip.png" alt="" className="h-[24px] w-[84px] rounded-[2px] object-cover" />
                    <span className="grid h-[24px] w-[22px] place-items-center rounded-[2px] bg-[var(--shotiq-color-muted)] text-[9px] font-bold text-white">{ROW_EXTRA[i % ROW_EXTRA.length]}</span>
                  </span>
                </td>
                <td><ChevronRight className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" /></td>
              </tr>
            ))}
            {!rows.length && (
              <tr><td colSpan={8} className="py-[26px] text-center text-[13px] text-[var(--shotiq-color-graphite)]">
                {loading ? "Loading history…" : "No sessions yet — run your first analysis."}
              </td></tr>
            )}
          </tbody>
        </table>
        {rows.length > 0 && (
          <div className="mt-[10px] flex items-center justify-center gap-[10px] text-[12px]">
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
      <aside className="w-[350px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[18px]">
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
              <div className="shotiq-numeric text-[26px] text-[var(--shotiq-color-shotiqOrange)]">{rows[sel]?.[1] ?? "—"}</div>
              <div className="h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
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
  )
}
