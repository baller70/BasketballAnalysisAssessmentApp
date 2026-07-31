"use client"

/** /results/demo/history — canonical 093-web-analytics-history. */

import React, { useState } from "react"
import Link from "next/link"
import { Calendar, ChevronDown, SlidersHorizontal, Share, Play, X, ChevronLeft, ChevronRight } from "lucide-react"
import { SectionLabel, Card, MediaSurface, TrendLine, PhaseGlyph, Stat } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"

const DEMO_ROWS: [string, string, string, string, string, string][] = [
  ["May 12, 2025 · 8:24 AM", "82", "Good", "62.5%", "24 / 15", "High"],
  ["May 11, 2025 · 6:15 PM", "78", "Good", "58.3%", "12 / 7", "High"],
  ["May 10, 2025 · 4:02 PM", "75", "Good", "54.5%", "11 / 6", "High"],
  ["May 9, 2025 · 7:33 PM", "80", "Good", "60.0%", "20 / 12", "High"],
  ["May 7, 2025 · 9:11 AM", "72", "Fair", "52.4%", "21 / 11", "Medium"],
  ["May 6, 2025 · 5:48 PM", "69", "Fair", "50.0%", "14 / 7", "Medium"],
  ["May 4, 2025 · 11:23 AM", "77", "Good", "56.3%", "16 / 9", "High"],
  ["May 2, 2025 · 8:02 PM", "81", "Good", "61.9%", "21 / 13", "High"],
]

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
  const { items, hasData, score, loading } = useHistory()
  const [sel, setSel] = useState(0)
  const [range, setRange] = useState(RANGES[1])
  const [metric, setMetric] = useState(METRICS[0])
  const [menu, setMenu] = useState<null | "range" | "metric">(null)
  const [filterOpen, setFilterOpen] = useState(false)
  const [band, setBand] = useState<"All" | "Good" | "Fair">("All")
  const allRows: [string, string, string, string, string, string][] = items.length
    ? items.map((a) => [
        `${a.when}`, a.score != null ? String(Math.round(a.score)) : "—",
        (a.score ?? 0) >= 70 ? "Good" : "Fair", "—", "—", "High",
      ] as [string, string, string, string, string, string])
    : hasData ? DEMO_ROWS : []
  const rows = allRows.slice(0, items.length ? undefined : range[2])
    .filter((r) => band === "All" || r[2] === band)
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
            <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">Review and track your shooting performance over time.</p>
          </div>
          <div className="flex gap-[10px] pt-[4px]">
            <div className="relative">
              <button type="button" aria-expanded={menu === "range"}
                      onClick={() => setMenu((m) => (m === "range" ? null : "range"))}
                      className="flex h-[42px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
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
                      className="flex h-[42px] flex-col justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-left">
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
        <Card className="mt-[12px] flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[8px] py-[12px]">
          <div className="px-[16px]">
            <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">AVERAGE FORM SCORE</div>
            <div className="flex items-end gap-[8px]">
              <span className="shotiq-numeric text-[34px] leading-[38px]">{score ?? "—"}</span>
              <span className="pb-[8px] text-[11px] text-[var(--shotiq-color-analysisBlue)]">● Good</span>
            </div>
          </div>
          <div className="px-[16px]"><Stat value={hasData ? "24" : "0"} label="SHOTS · Total" valueClass="text-[26px] leading-[30px]" /></div>
          <div className="px-[16px]"><Stat value={hasData ? "15" : "0"} label="MAKES · Total" valueClass="text-[26px] leading-[30px]" /></div>
          <div className="px-[16px]"><Stat value={hasData ? "62.5%" : "—"} label="MAKE %" valueClass="text-[26px] leading-[30px]" /></div>
          <div className="flex-1 px-[16px]">
            <div className="text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">{metric.toUpperCase()} TREND</div>
            <div className="flex items-center gap-[12px]">
              <TrendLine points={METRIC_TRENDS[metric]} width={220} height={44} />
              <div><div className="text-[12px] font-bold text-[var(--shotiq-color-confirmGreen)]">+8.1%</div>
                <div className="text-[9px] text-[var(--shotiq-color-graphite)]">vs previous 6</div></div>
            </div>
          </div>
        </Card>

        {/* sessions table */}
        <div className="mt-[14px] flex items-center gap-[10px]">
          <SectionLabel>SESSIONS</SectionLabel>
          <span className="text-[12px] text-[var(--shotiq-color-graphite)]">{rows.length} sessions</span>
        </div>
        <table className="mt-[6px] w-full text-[12px]">
          <thead>
            <tr className="text-left text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
              {["DATE / TIME ↓", "FORM SCORE", "MAKE %", "SHOTS / MAKES", "CONFIDENCE", "FOCUS", "MEDIA", ""].map((h) => (
                <th key={h} className="py-[6px] font-bold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--shotiq-color-rule)]">
            {rows.map(([d, fs, band, mk, sm, conf], i) => (
              <tr key={i} onClick={() => setSel(i)}
                  className={`cursor-pointer ${sel === i ? "outline outline-1 outline-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                <td className="py-[9px]">
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
                      <span key={b} className={`h-[8px] w-[8px] rounded-[2px] ${conf === "High" || b < 2 ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-rule)]"}`} />
                    ))}
                  </span>{conf}
                </td>
                <td><PhaseGlyph size={22} /></td>
                <td>
                  <span className="flex gap-[2px]">
                    {[0, 1, 2, 3].map((m) => <span key={m} className="h-[22px] w-[30px] rounded-[2px] bg-[#1B1D20]" />)}
                    <span className="grid h-[22px] w-[22px] place-items-center rounded-[2px] bg-[var(--shotiq-color-rule)] text-[9px]">+3</span>
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
            Showing 1–{Math.min(8, rows.length)} of {rows.length}
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
        <div className="relative mt-[10px]">
          <MediaSurface height={210} duration="0:12" />
          <Play className="absolute bottom-[46px] left-[12px] h-[15px] w-[15px] text-white" fill="white" />
        </div>
        <Card className="mt-[12px] divide-y divide-[var(--shotiq-color-rule)]">
          <div className="flex divide-x divide-[var(--shotiq-color-rule)]">
            <div className="flex-1 p-[12px]">
              <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
              <div className="shotiq-numeric text-[26px] text-[var(--shotiq-color-shotiqOrange)]">{rows[sel]?.[1] ?? "—"}</div>
              <div className="h-[5px] rounded-full bg-[var(--shotiq-color-rule)]"><div className="h-full w-[82%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /></div>
            </div>
            <div className="flex-1 p-[12px]"><Stat value={rows[sel]?.[3] ?? "—"} label="MAKE %" valueClass="text-[24px] leading-[28px]" /></div>
            <div className="flex-1 p-[12px]"><Stat value={rows[sel]?.[4] ?? "—"} label="SHOTS / MAKES" valueClass="text-[24px] leading-[28px]" /></div>
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
                <PhaseGlyph size={24} /><span className="text-[11px] leading-[14px]">Keep elbow stacked through release</span>
              </div>
            </div>
          </div>
        </Card>
        <Card className="mt-[12px] flex items-center gap-[12px] p-[12px]">
          <div className="flex-1">
            <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MECHANICS TREND (LAST 6)</div>
            <TrendLine points={[72, 76, 74, 78, 80, 82]} width={200} height={42} />
          </div>
          <div className="text-right">
            <div className="text-[13px] font-bold text-[var(--shotiq-color-confirmGreen)]">+8.1% ↗</div>
            <div className="text-[9px] text-[var(--shotiq-color-graphite)]">vs previous 6</div>
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
