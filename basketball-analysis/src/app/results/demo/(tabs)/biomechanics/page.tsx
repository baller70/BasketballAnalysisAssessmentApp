"use client"

/** /results/demo/biomechanics — canonical 084-web-biomechanics-workspace. */

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Play, Upload, MoreVertical, Pencil, Minus, Eraser, X } from "lucide-react"
import { SectionLabel, Card, MediaSurface, Stat, PhaseGlyph, TrendLine } from "@/components/shotiq/ShotIQShell"
import { useHistory, CoachingTarget } from "@/components/shotiq/ResultsBits"

const MEASUREMENTS: [string, string, string, string][] = [
  ["Elbow Angle", "92°", "Ideal: 85°–95°", "Good"],
  ["Release Height", "8'10\"", "Ideal: 8'6\"–9'2\"", "Good"],
  ["Release Distance", "16.2\"", "Ideal: 14\"–16\"", "Slightly High"],
  ["Vertical Jump", "24.6\"", "Ideal: 20\"–28\"", "Good"],
  ["Shooting Arc", "52°", "Ideal: 45°–55°", "Good"],
  ["Centerline Deviation", "1.8°", "Ideal: < 3°", "Good"],
]

// Metric drill-down copy for the detail view (iOS 045 counterpart).
const METRIC_DETAIL: Record<string, { what: string; why: string; tip: string; trend: number[] }> = {
  "Elbow Angle": {
    what: "The angle of your shooting elbow at the moment of release.",
    why: "A stacked elbow (85°–95°) sends force straight at the rim; flare adds side spin.",
    tip: "Think “elbow under the ball” — check it each time you bring the ball to your set point.",
    trend: [88, 90, 87, 91, 92],
  },
  "Release Height": {
    what: "How high the ball is when it leaves your hand.",
    why: "A higher, repeatable release is harder to contest and keeps your arc consistent.",
    tip: "Full extension at release — finish tall instead of drifting forward.",
    trend: [8.5, 8.6, 8.8, 8.7, 8.85],
  },
  "Release Distance": {
    what: "How far the ball travels from your centerline before release.",
    why: "Extra distance from the body adds variance shot to shot.",
    tip: "Keep the ball closer to your centerline through the rise.",
    trend: [17.1, 16.8, 16.5, 16.4, 16.2],
  },
  "Vertical Jump": {
    what: "How much lift you generate on the shot.",
    why: "Consistent lift keeps your release point and timing repeatable.",
    tip: "Load through the legs the same way every rep — rhythm beats height.",
    trend: [23.8, 24.1, 24.3, 24.4, 24.6],
  },
  "Shooting Arc": {
    what: "The launch angle of the ball toward the rim.",
    why: "45°–55° gives the ball the biggest target area on the rim.",
    tip: "Aim for the back of the rim with a high, soft arc.",
    trend: [49, 50, 51, 52, 52],
  },
  "Centerline Deviation": {
    what: "How far the ball drifts left or right of your body's centerline.",
    why: "Lateral drift is the most common cause of left/right misses.",
    tip: "Square your shoulders and let the follow-through finish straight at the target.",
    trend: [2.6, 2.3, 2.1, 2.0, 1.8],
  },
}
const CONFIDENCE: [string, number][] = [
  ["Overall Confidence", 93], ["Pose Confidence", 95], ["Joint Visibility", 91], ["Tracking Stability", 92],
]
const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

export default function BiomechanicsWorkspacePage() {
  const { hasData, score } = useHistory()
  const [tab, setTab] = useState("METRICS")
  const [overlays, setOverlays] = useState({ Skeleton: true, Joints: true, Annotations: true })
  const [frame, setFrame] = useState(4)
  const [moreOpen, setMoreOpen] = useState(false)
  const [exporting, setExporting] = useState(false)
  // Metric drill-down (iOS 045 counterpart).
  const [metric, setMetric] = useState<string | null>(null)
  // Annotation drawing tools (iOS 043 counterpart) — a real canvas overlay.
  const [tool, setTool] = useState<"pen" | "line" | null>(null)
  const [inkColor, setInkColor] = useState("#FF5A1F")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef<{ x: number; y: number } | null>(null)
  // Visible state change first, then the browser print dialog (the export path).
  const doExport = () => {
    setExporting(true)
    setTimeout(() => { window.print(); setExporting(false) }, 60)
  }

  useEffect(() => {
    if (!metric) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMetric(null) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [metric])

  const canvasPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!
    const r = c.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }
  }
  const penDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool) return
    e.currentTarget.setPointerCapture(e.pointerId)
    drawing.current = canvasPos(e)
  }
  const penMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool || !drawing.current || tool !== "pen") return
    const ctx = canvasRef.current?.getContext("2d")
    if (!ctx) return
    const p = canvasPos(e)
    ctx.strokeStyle = inkColor
    ctx.lineWidth = 3
    ctx.lineCap = "round"
    ctx.beginPath()
    ctx.moveTo(drawing.current.x, drawing.current.y)
    ctx.lineTo(p.x, p.y)
    ctx.stroke()
    drawing.current = p
  }
  const penUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!tool || !drawing.current) return
    if (tool === "line") {
      const ctx = canvasRef.current?.getContext("2d")
      if (ctx) {
        const p = canvasPos(e)
        ctx.strokeStyle = inkColor
        ctx.lineWidth = 3
        ctx.lineCap = "round"
        ctx.beginPath()
        ctx.moveTo(drawing.current.x, drawing.current.y)
        ctx.lineTo(p.x, p.y)
        ctx.stroke()
      }
    }
    drawing.current = null
  }
  const clearInk = () => {
    const c = canvasRef.current
    c?.getContext("2d")?.clearRect(0, 0, c.width, c.height)
  }

  return (
    <div data-testid="screen-desktop-web-biomechanics-workspace">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[11px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">
            <Link href="/results/demo/history">ANALYSES</Link> › PULL-UP JUMPER
          </div>
          <h1 className="shotiq-display mt-[2px] text-[44px] leading-[46px]">ANALYSIS — PULL-UP JUMPER</h1>
          <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {hasData ? "Latest session · Catch & Shoot · Right Hand" : "Run an analysis to populate this workspace."}
          </p>
        </div>
        <Card className="flex items-center divide-x divide-[var(--shotiq-color-rule)] px-[6px] py-[10px]">
          <div className="px-[14px]">
            <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
            <div className="shotiq-numeric text-[30px] leading-[32px] text-[var(--shotiq-color-shotiqOrange)]">{score ?? "—"}</div>
            <div className="h-[4px] w-[54px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]" style={{ width: `${score ?? 0}%` }} /></div>
          </div>
          <div className="px-[14px]"><Stat value={hasData ? "24" : "0"} label="SHOTS" valueClass="text-[24px] leading-[28px]" /></div>
          <div className="px-[14px]"><Stat value={hasData ? "15" : "0"} label="MAKES" valueClass="text-[24px] leading-[28px]" /></div>
          <div className="px-[14px]"><Stat value={hasData ? "62.5%" : "—"} label="MAKE %" valueClass="text-[24px] leading-[28px]" /></div>
          <div className="px-[14px]"><div className="shotiq-numeric text-[24px] leading-[28px] text-[var(--shotiq-color-confirmGreen)]">+8.1%</div>
            <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">VS LAST</div></div>
          <div className="relative px-[2px]">
            <button type="button" aria-label="More" aria-expanded={moreOpen}
                    onClick={() => setMoreOpen((v) => !v)} className="px-[8px] py-[6px]">
              <MoreVertical className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-[30px] z-30 w-[190px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                <button type="button" onClick={() => { setMoreOpen(false); doExport() }}
                        className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Export report</button>
                <Link href="/results/demo/history" onClick={() => setMoreOpen(false)}
                      className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Session history</Link>
                <Link href="/results/demo/compare" onClick={() => setMoreOpen(false)}
                      className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Compare with elite</Link>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="mt-[10px] flex items-center justify-between">
        <div className="flex gap-[26px]">
          {PHASES.map((p) => (
            <div key={p} className="text-center">
              <PhaseGlyph active={p === "RELEASE"} size={26} />
              <div className={`text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
              {p === "RELEASE" && <div className="mx-auto h-[2px] w-[36px] bg-[var(--shotiq-color-shotiqOrange)]" />}
            </div>
          ))}
        </div>
        <Card className="flex items-center gap-[14px] px-[14px] py-[8px]">
          {(Object.keys(overlays) as (keyof typeof overlays)[]).map((k) => (
            <button key={k} type="button" onClick={() => setOverlays({ ...overlays, [k]: !overlays[k] })}
                    className="flex items-center gap-[6px] text-[12px]">
              <span className={`h-[16px] w-[30px] rounded-full p-[2px] transition ${overlays[k] ? "bg-[var(--shotiq-color-analysisBlue)]" : "bg-[var(--shotiq-color-rule)]"}`}>
                <span className={`block h-[12px] w-[12px] rounded-full bg-white transition ${overlays[k] ? "translate-x-[14px]" : ""}`} />
              </span>{k}
            </button>
          ))}
          <button type="button" onClick={doExport}
                  className="flex h-[32px] items-center gap-[6px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[10px] text-[12px]">
            <Upload className="h-[12px] w-[12px]" /> {exporting ? "Preparing…" : "Export"}
          </button>
        </Card>
      </div>

      <div className="mt-[10px] flex gap-[16px]">
        {/* frame viewer */}
        <div className="w-[540px] shrink-0">
          <div className="relative">
            <MediaSurface height={360} duration="0:06.80" />
            {/* Annotation ink layer — active while a tool is selected. */}
            {overlays.Annotations && (
              <canvas ref={canvasRef} width={540} height={360} data-testid="annotation-canvas"
                      onPointerDown={penDown} onPointerMove={penMove} onPointerUp={penUp}
                      className={`absolute inset-0 h-full w-full ${tool ? "cursor-crosshair" : "pointer-events-none"}`} />
            )}
            <span className="absolute left-[12px] top-[12px] flex items-center gap-[6px]">
              <span className="rounded-[3px] bg-[var(--shotiq-color-shotiqOrange)] px-[8px] py-[3px] text-[10px] font-bold text-white">RELEASE</span>
              <span className="rounded-[3px] bg-black/75 px-[6px] py-[3px] text-[10px] font-bold text-white">0.540s</span>
            </span>
            <span className="absolute bottom-[52px] left-[12px] flex items-center gap-[8px]">
              <span className="rounded-[4px] border border-white/40 bg-black/70 px-[8px] py-[3px] text-[11px] text-white">0.25x ▾</span>
              <span className="grid h-[28px] w-[28px] place-items-center rounded-[4px] bg-black/70"><Play className="h-[12px] w-[12px] text-white" fill="white" /></span>
            </span>
          </div>

          {/* Annotation toolbar — iOS 043 counterpart. */}
          {overlays.Annotations && (
            <Card data-testid="annotation-toolbar" className="mt-[8px] flex items-center gap-[8px] px-[12px] py-[8px]">
              <SectionLabel>ANNOTATE</SectionLabel>
              <button type="button" onClick={() => setTool(tool === "pen" ? null : "pen")} aria-pressed={tool === "pen"}
                      data-testid="annotate-pen"
                      className={`flex h-[32px] items-center gap-[6px] rounded-[5px] border px-[10px] text-[12px] ${
                        tool === "pen" ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                <Pencil className="h-[13px] w-[13px]" /> Pen
              </button>
              <button type="button" onClick={() => setTool(tool === "line" ? null : "line")} aria-pressed={tool === "line"}
                      className={`flex h-[32px] items-center gap-[6px] rounded-[5px] border px-[10px] text-[12px] ${
                        tool === "line" ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                <Minus className="h-[13px] w-[13px]" /> Line
              </button>
              <span className="mx-[2px] h-[20px] w-px bg-[var(--shotiq-color-rule)]" />
              {["#FF5A1F", "#2D6CDF", "#168A55"].map((c) => (
                <button key={c} type="button" onClick={() => setInkColor(c)} aria-label={`ink ${c}`}
                        className={`h-[18px] w-[18px] rounded-full ${inkColor === c ? "ring-2 ring-[var(--shotiq-color-ink)] ring-offset-1" : ""}`}
                        style={{ background: c }} />
              ))}
              <button type="button" onClick={clearInk} data-testid="annotate-clear"
                      className="ml-auto flex h-[32px] items-center gap-[6px] rounded-[5px] border border-[var(--shotiq-color-rule)] px-[10px] text-[12px]">
                <Eraser className="h-[13px] w-[13px]" /> Clear
              </button>
            </Card>
          )}
          <div className="mt-[8px] flex items-center gap-[6px]">
            <ChevronLeft className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            {Array.from({ length: 9 }).map((_, i) => (
              <button key={i} type="button" onClick={() => setFrame(i)} aria-label={`frame ${i + 1}`}
                      className={`h-[56px] flex-1 rounded-[3px] bg-[#1B1D20] ${frame === i ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`} />
            ))}
            <ChevronRight className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" />
          </div>
        </div>

        {/* metrics panel */}
        <Card className="min-w-0 flex-1 px-[18px] py-[12px]">
          <nav className="flex gap-[22px] border-b border-[var(--shotiq-color-rule)]">
            {["METRICS", "COACHING TARGET", "NOTES", "HISTORY"].map((t) => (
              <button key={t} type="button" onClick={() => setTab(t)} aria-current={tab === t ? "true" : undefined}
                      className={`relative pb-[8px] text-[11px] font-bold tracking-[0.05em] ${tab === t ? "" : "text-[var(--shotiq-color-graphite)]"}`}>
                {t}
                {tab === t && <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[var(--shotiq-color-shotiqOrange)]" />}
              </button>
            ))}
          </nav>
          {tab === "METRICS" && (
            <>
              <SectionLabel className="mt-[10px]">KEY MEASUREMENTS</SectionLabel>
              <div className="divide-y divide-[var(--shotiq-color-rule)]">
                {MEASUREMENTS.map(([m, v, ideal, band]) => (
                  <button key={m} type="button" onClick={() => setMetric(m)} data-testid={`metric-${m.toLowerCase().replace(/\s+/g, "-")}`}
                          className="flex w-full items-center gap-[10px] py-[8px] text-left hover:bg-[var(--shotiq-color-warmCanvas)]">
                    <PhaseGlyph size={22} />
                    <div className="flex-1">
                      <div className="text-[13px] font-semibold">{m}</div>
                      <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{ideal}</div>
                    </div>
                    <span className="shotiq-numeric text-[19px]">{hasData ? v : "—"}</span>
                    <span className={`rounded-[4px] px-[8px] py-[2px] text-[10px] font-bold ${band === "Good" ? "bg-[var(--shotiq-color-confirmGreen)]/10 text-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-shotiqOrange)]/10 text-[var(--shotiq-color-shotiqOrange)]"}`}>{band}</span>
                    <ChevronRight className="h-[13px] w-[13px] text-[var(--shotiq-color-muted)]" />
                  </button>
                ))}
              </div>
              <SectionLabel className="mt-[8px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">SEGMENT CONFIDENCE</SectionLabel>
              <div className="mt-[4px] space-y-[7px]">
                {CONFIDENCE.map(([m, v]) => (
                  <div key={m} className="flex items-center gap-[10px]">
                    <span className="w-[130px] text-[12px]">{m}</span>
                    <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                      <div className="h-full rounded-full bg-[var(--shotiq-color-analysisBlue)]" style={{ width: `${v}%` }} />
                    </div>
                    <span className="shotiq-numeric w-[36px] text-right text-[13px]">{v}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {tab !== "METRICS" && (
            <p className="py-[20px] text-[13px] text-[var(--shotiq-color-graphite)]">
              {tab === "COACHING TARGET" ? "Your coaching target detail lives in the rail on the right."
                : tab === "NOTES" ? "No notes on this analysis yet." : "Session history is under Results › History."}
            </p>
          )}
        </Card>

        {/* right rail */}
        <div className="w-[270px] shrink-0">
          <Card className="p-[16px]"><CoachingTarget /></Card>
          <Card className="mt-[12px] p-[16px]">
            <SectionLabel>COACHING INSIGHTS</SectionLabel>
            <div className="mt-[6px] space-y-[8px]">
              {[["✓", "Solid alignment at release. Elbow tracking is in a good range.", "var(--shotiq-color-confirmGreen)"],
                ["!", "Slightly high release distance. Focus on keeping ball closer to centerline.", "var(--shotiq-color-shotiqOrange)"],
                ["i", "Continue to maintain vertical lift and balanced posture.", "var(--shotiq-color-analysisBlue)"]].map(([ic, t, c]) => (
                <div key={String(t)} className="flex gap-[8px]">
                  <span className="grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full text-[10px] font-bold text-white" style={{ background: String(c) }}>{ic}</span>
                  <p className="text-[11px] leading-[15px]">{t}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card className="mt-[12px] p-[16px]">
            <SectionLabel>SUGGESTED FOCUS</SectionLabel>
            <div className="mt-[8px] flex items-center gap-[10px]">
              <PhaseGlyph size={42} />
              <div>
                <div className="text-[13px] font-semibold">Tighten Elbow Path</div>
                <p className="text-[10px] leading-[14px] text-[var(--shotiq-color-graphite)]">
                  Work on keeping the ball closer to your centerline through the release.
                </p>
              </div>
            </div>
            <Link href="/results/demo/goals"
                  className="mt-[10px] flex h-[38px] items-center justify-center rounded-[5px] bg-[var(--shotiq-color-shotiqOrange)] text-[12px] font-bold text-white">
              Add target to training ↗
            </Link>
            <Link href="/results/demo/training"
                  className="mt-[6px] flex h-[34px] items-center justify-center rounded-[5px] border border-[var(--shotiq-color-rule)] text-[12px]">
              View related drills ›
            </Link>
          </Card>
        </div>
      </div>

      {/* Metric detail — iOS 045 counterpart. */}
      {metric && (() => {
        const row = MEASUREMENTS.find(([m]) => m === metric)
        const d = METRIC_DETAIL[metric]
        if (!row || !d) return null
        const [m, v, ideal, band] = row
        return (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6" onClick={() => setMetric(null)}>
            <Card data-testid="metric-detail" className="w-full max-w-[460px] p-[22px]" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between">
                <div>
                  <SectionLabel>METRIC DETAIL</SectionLabel>
                  <div className="text-[20px] font-semibold leading-[26px]">{m}</div>
                </div>
                <button type="button" onClick={() => setMetric(null)} aria-label="Close" data-testid="metric-detail-close"
                        className="grid h-[32px] w-[32px] place-items-center rounded-[5px] border border-[var(--shotiq-color-rule)]">
                  <X className="h-[15px] w-[15px]" />
                </button>
              </div>
              <div className="mt-[12px] flex items-end justify-between rounded-[6px] border border-[var(--shotiq-color-rule)] p-[14px]">
                <div>
                  <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">CURRENT</div>
                  <div className="shotiq-numeric text-[38px] leading-[42px] text-[var(--shotiq-color-shotiqOrange)]">{hasData ? v : "—"}</div>
                  <span className={`mt-[2px] inline-block rounded-[4px] px-[8px] py-[2px] text-[10px] font-bold ${band === "Good" ? "bg-[var(--shotiq-color-confirmGreen)]/10 text-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-shotiqOrange)]/10 text-[var(--shotiq-color-shotiqOrange)]"}`}>{band}</span>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{ideal.toUpperCase()}</div>
                  <div className="mt-[4px] flex justify-end"><TrendLine points={d.trend} width={110} height={36} /></div>
                  <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">LAST 5 SESSIONS</div>
                </div>
              </div>
              <div className="mt-[12px] space-y-[8px] text-[13px] leading-[18px]">
                <p><span className="font-semibold">What it is. </span>{d.what}</p>
                <p><span className="font-semibold">Why it matters. </span>{d.why}</p>
                <p className="rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] p-[10px] text-[12px] italic text-[var(--shotiq-color-graphite)]">Coaching tip: {d.tip}</p>
              </div>
              <Link href="/results/demo/goals"
                    className="mt-[14px] flex h-[40px] items-center justify-center rounded-[5px] bg-[var(--shotiq-color-shotiqOrange)] text-[13px] font-medium text-white">
                Train this metric ↗
              </Link>
            </Card>
          </div>
        )
      })()}
    </div>
  )
}
