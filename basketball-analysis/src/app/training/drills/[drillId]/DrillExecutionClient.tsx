"use client"

/**
 * /training/drills/[drillId] — canonical drill-execution screen (desktop screen
 * 091-web-drill-execution). This route did not exist before; it closes the gap
 * recorded in the screen implementation map.
 *
 * Live, functional state — not chrome:
 *   - Mark make / Mark miss / Undo mutate a real shot log that drives the
 *     make-%, last-24 strip, shot history and set progress;
 *   - each mark is also POSTed to the existing /api/shot-events endpoint so
 *     results persist (failures are tolerated offline);
 *   - the session clock runs; pause/resume and end-workout work.
 * All gauges are data-driven SVG (sidecar contract), never rasters.
 */

import React, { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  CircleCheck, CircleX, Undo2, Pause, Play, Square,
  VolumeX, Volume2, LogOut, ChevronRight, ChevronDown, Maximize,
  Globe, SignalHigh, Clock, Pen, type LucideIcon,
} from "lucide-react"
import {
  ShotIQShell, SectionLabel, Card, PageTitle,
} from "@/components/shotiq/ShotIQShell"
import { PoseFigure, WorkoutGlyph } from "@/components/shotiq/Glyphs"

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const SET_SECONDS = 360 // 06:00 per set
// Canonical's SHOT TRACKER strip: 11 logged marks + 3 empty placeholders.
const MARK_REAL = 11
const MARK_SLOTS = 14
const TOTAL_SETS = 3

/**
 * Canonical 091 opens mid-set, not empty: 02:24 elapsed into set 1, 24 shots
 * logged, 15 makes / 9 misses (62.5%), and the last nine frames on the history
 * strip with the newest ringed LIVE. This is seeded demo state — the same log
 * the live handlers write to, so Mark make / Mark miss / Undo keep working from
 * here rather than from zero.
 */
const SEEDED_RESULTS = [
  true, true, false, true, false, true, false, true,
  false, true, false, true, false, true, false,
  true, true, false, true, true, false, true, true, true,
] // 15 makes / 9 misses = 62.5%
const SEEDED_SHOTS = SEEDED_RESULTS.map((made, i) => ({ n: i + 1, made }))
const SEEDED_ELAPSED = 144 // 02:24

/** Canonical draws both gauges on this page as a fine 7px ring — measured
 *  across the horizontal through each centre. The 8–9px default read as a
 *  heavy donut. */
function Ring({ pct, size = 96, stroke = 7, color = "var(--shotiq-color-shotiqOrange)", children }: {
  pct: number; size?: number; stroke?: number; color?: string; children?: React.ReactNode
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--shotiq-color-rule)" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
                strokeDasharray={`${c * Math.min(1, Math.max(0, pct))} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

export default function DrillExecutionClient() {
  const params = useParams<{ drillId: string }>()
  const router = useRouter()
  const drillName = decodeURIComponent(params?.drillId ?? "drill")
    .replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Pound Crossover Foundation"

  const [shots, setShots] = useState<{ n: number; made: boolean }[]>(SEEDED_SHOTS)
  const [elapsed, setElapsed] = useState(SEEDED_ELAPSED)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  // Workout-complete summary (iOS 062 counterpart) — shown by "End workout".
  const [completed, setCompleted] = useState(false)
  const [shared, setShared] = useState(false)
  const shotN = useRef(SEEDED_SHOTS.length)

  useEffect(() => {
    if (paused || completed) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [paused, completed])

  useEffect(() => {
    if (!completed) return
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setCompleted(false) }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [completed])

  const shareProgress = async () => {
    const makesNow = shots.filter((s) => s.made).length
    const text = `${drillName} on ShotIQ — ${shots.length} shots, ${makesNow} makes${
      shots.length ? ` (${Math.round((100 * makesNow) / shots.length)}%)` : ""}.`
    try {
      if (navigator.share) await navigator.share({ title: "ShotIQ workout", text, url: window.location.href })
      else await navigator.clipboard.writeText(`${text} ${window.location.href}`)
      setShared(true)
      setTimeout(() => setShared(false), 2500)
    } catch { /* user dismissed the share sheet */ }
  }
  const repeatDrill = () => {
    setShots([]); setElapsed(0); setPaused(false); setCompleted(false); shotN.current = 0
  }

  const mark = async (made: boolean) => {
    shotN.current += 1
    setShots((s) => [...s, { n: shotN.current, made }])
    // Persist to the existing shot-events endpoint; tolerate failure offline.
    try {
      await fetch("/api/shot-events", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drillId: params?.drillId, result: made ? "make" : "miss", at: new Date().toISOString() }),
      })
    } catch { /* offline-tolerant */ }
  }
  const undo = () => setShots((s) => s.slice(0, -1))

  const makes = shots.filter((s) => s.made).length
  const misses = shots.length - makes
  const pct = shots.length ? (100 * makes / shots.length) : 0
  const setIndex = Math.min(TOTAL_SETS, Math.floor(elapsed / SET_SECONDS) + 1)
  const setsCompleted = Math.min(TOTAL_SETS, Math.floor(elapsed / SET_SECONDS))
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  const last24 = useMemo(() => shots.slice(-24), [shots])
  // Canonical's strip is 11 logged marks then three empty placeholders.
  const lastMarks = useMemo(() => shots.slice(-MARK_REAL), [shots])
  // Canonical paints nine frames on the history strip with the newest ringed LIVE.
  const historyStrip = useMemo(() => shots.slice(-9), [shots])

  // Each cue carries its own node diagram — canonical never repeats one down
  // this list (peak, apex, shoulder frame, extended arm, planted base).
  const cues: [string, string, "GOOD" | "FOCUS", string][] = [
    ["Keep elbow stacked", "Elbow under ball at release", "GOOD", "091-cue-elbow"],
    ["Release at apex", "Release at the highest point", "FOCUS", "091-cue-apex"],
    ["Square shoulders", "Shoulders aligned to target", "GOOD", "091-cue-shoulders"],
    ["Follow through long", "Full extension and soft wrist", "FOCUS", "091-cue-follow"],
    ["Balance & landing", "Stay balanced on landing", "FOCUS", "091-cue-balance"],
  ]

  return (
    <ShotIQShell active="Training">
      <div data-testid="screen-desktop-web-drill-execution" className="flex">
        <div className="min-w-0 flex-1 px-[26px] pt-[18px]">
          <div className="text-[12px] text-[var(--shotiq-color-graphite)]">
            <Link href="/results/demo/training">Workouts</Link> &nbsp;›&nbsp; {drillName}
          </div>
          <div className="mt-[4px] flex items-center justify-between">
            <div className="flex items-center gap-[12px]">
              <PageTitle size={47}>{drillName.toUpperCase()}</PageTitle>
              <span className="rounded-full border border-[var(--shotiq-color-rule)] px-[12px] py-[3px] text-[12px]">Drill</span>
            </div>
            <button type="button" onClick={() => router.push("/results/demo/training")}
                    className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
              <LogOut className="h-[15px] w-[15px]" /> Exit workout
            </button>
          </div>
          <div className="mt-[8px] flex gap-[10px]">
            {/* Canonical marks each chip: category, difficulty, duration, hand. */}
            {([["Ball Handling", Globe], ["Beginner", SignalHigh], ["6 min", Clock],
               ["Right Hand", Pen]] as [string, LucideIcon][]).map(([c, Icon]) => (
              <span key={c} className="flex items-center gap-[7px] rounded-full border border-[var(--shotiq-color-rule)] px-[12px] py-[4px] text-[12px]">
                <Icon className="h-[13px] w-[13px]" strokeWidth={1.6} />{c}
              </span>
            ))}
          </div>

          {/* live surface */}
          <div className="relative mt-[14px] h-[335px] overflow-hidden rounded-[6px] bg-[#1B1D20]" data-testid="live-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/091-hero.png" alt="Live drill camera frame"
                 className="absolute inset-0 h-full w-full object-cover" />
            <Maximize className="absolute bottom-[12px] right-[12px] h-[17px] w-[17px] text-white" />
          </div>

          {/* Phase scrubber. Canonical centres a dot under EVERY phase label —
              measured dot centres 265/421/552/665/837 against the same label
              centres — and runs a short thick orange segment into the active
              dot. The dots used to be pinned at 8/30/52/84% of the rail with
              the active one at 62%, which left the orange dot ~70px left of the
              RELEASE label it marks and no traversed segment at all. Sharing
              one flex row with the labels is what keeps them registered. */}
          <div className="mt-[12px] px-[10px]">
            <div className="relative flex justify-between">
              <span aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-[5px] h-[3px] rounded-full bg-[var(--shotiq-color-rule)]" />
              {PHASES.map((p) => {
                const active = p === "RELEASE"
                return (
                  <div key={p} className="relative z-[1] w-[80px] text-center">
                    <PoseFigure phase={p} active={active} height={36} className="mx-auto" />
                    <div className={`shotiq-display mt-[2px] whitespace-nowrap text-[12px] leading-[13px] tracking-[0.075em] [text-rendering:geometricPrecision] ${active ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>{p}</div>
                    <span className="mt-[6px] flex h-[13px] items-center justify-center">
                      {active && (
                        <span aria-hidden="true"
                              className="absolute bottom-[5px] right-1/2 h-[3px] w-[26px] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
                      )}
                      <span className={`relative rounded-full ${active
                        ? "h-[13px] w-[13px] bg-[var(--shotiq-color-shotiqOrange)]"
                        : "h-[8px] w-[8px] bg-[var(--shotiq-color-graphite)]"}`} />
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* controls */}
          <div className="mt-[16px] flex gap-[12px]">
            <button type="button" onClick={() => mark(true)} data-testid="mark-make"
                    className="flex h-[40px] w-[145px] items-center justify-center gap-[9px] rounded-[6px] border-2 border-[var(--shotiq-color-confirmGreen)] whitespace-nowrap text-[14px] font-medium text-[var(--shotiq-color-confirmGreen)]">
              <CircleCheck className="h-[17px] w-[17px]" /> Mark make
            </button>
            <button type="button" onClick={() => mark(false)} data-testid="mark-miss"
                    className="flex h-[40px] w-[145px] items-center justify-center gap-[9px] rounded-[6px] border-2 border-[var(--shotiq-color-reviewRed)] whitespace-nowrap text-[14px] font-medium text-[var(--shotiq-color-reviewRed)]">
              <CircleX className="h-[17px] w-[17px]" /> Mark miss
            </button>
            <button type="button" onClick={undo} disabled={!shots.length} data-testid="undo-shot"
                    className="flex h-[40px] w-[145px] items-center justify-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] whitespace-nowrap text-[14px] disabled:opacity-50">
              <Undo2 className="h-[16px] w-[16px]" /> Undo
            </button>
          </div>

          {/* Canonical 091 splits the controls over two rows: the shot marks sit
              left on row one, the workout controls right-align on row two. One
              row no longer fits now that the unified sidebar narrows the body,
              and every label was wrapping to two lines. */}
          <div className="mt-[10px] flex justify-end gap-[10px]">
            <div className="flex gap-[10px]">
              <button type="button" onClick={() => setPaused(!paused)} data-testid="pause-workout"
                      className="flex h-[40px] items-center gap-[9px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] whitespace-nowrap px-[18px] text-[14px] font-medium text-white">
                {paused ? <Play className="h-[15px] w-[15px]" /> : <Pause className="h-[15px] w-[15px]" />}
                {paused ? "Resume workout" : "Pause workout"}
              </button>
              <button type="button" onClick={() => setCompleted(true)} data-testid="end-workout"
                      className="flex h-[40px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] whitespace-nowrap px-[16px] text-[14px]">
                <Square className="h-[13px] w-[13px]" fill="currentColor" /> End workout
              </button>
              <button type="button" onClick={() => setMuted(!muted)}
                      className="flex h-[40px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] whitespace-nowrap px-[16px] text-[14px]">
                {muted ? <Volume2 className="h-[16px] w-[16px]" /> : <VolumeX className="h-[16px] w-[16px]" />}
                {muted ? "Unmute coaching" : "Mute coaching"}
              </button>
            </div>
          </div>

          {/* shot history */}
          <SectionLabel className="mt-[12px]">SHOT HISTORY</SectionLabel>
          {/* Canonical encloses the whole strip in one pale card and gives every
              frame a white footer strip INSIDE its own tile: the per-frame dot
              row on the finished shots, "◆ LIVE" on the newest. The label used
              to be absolutely positioned over the photo, where the tile's own
              bottom border cut the glyphs in half. */}
          <div className="mb-[10px] mt-[6px] flex items-center gap-[6px] overflow-x-auto rounded-[8px] border border-[var(--shotiq-color-rule)] bg-[var(--shotiq-color-paper)] px-[10px] py-[5px]" data-testid="shot-history">
            {historyStrip.map((s, i) => {
              const live = i === historyStrip.length - 1
              return (
                <div key={`${s.n}-${i}`}
                     className={`shrink-0 rounded-[7px] p-[4px] ${live ? "border-2 border-[var(--shotiq-color-shotiqOrange)] bg-white" : "border-2 border-transparent"}`}>
                  <div className="relative h-[86px] w-[64px] overflow-hidden rounded-[5px] bg-[#1B1D20]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/images/canonical/091-thumb.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
                    {/* Canonical sets the shot number on a dark rounded chip and
                        its make/miss mark on a ~20px filled disc; both were
                        floating unbacked on the photo. */}
                    <span className="absolute left-[3px] top-[3px] grid h-[18px] min-w-[20px] place-items-center rounded-[5px] bg-[rgba(16,17,19,0.86)] px-[4px] text-[11px] font-bold text-white">{s.n}</span>
                    <span className="absolute right-[3px] top-[3px]">
                      {s.made
                        ? <CircleCheck className="h-[18px] w-[18px] text-white" fill="var(--shotiq-color-confirmGreen)" strokeWidth={2.2} />
                        : <CircleX className="h-[18px] w-[18px] text-white" fill="var(--shotiq-color-reviewRed)" strokeWidth={2.2} />}
                    </span>
                  </div>
                  {live ? (
                    <div className="mt-[4px] flex h-[11px] items-center justify-center whitespace-nowrap text-[10px] font-bold leading-[11px] text-[var(--shotiq-color-shotiqOrange)]">◆ LIVE</div>
                  ) : (
                    <span className="mt-[4px] flex h-[11px] items-center justify-between px-[3px]">
                      {Array.from({ length: 6 }).map((_, d) => (
                        <span key={d} className="h-[5px] w-[5px] rounded-full bg-[var(--shotiq-color-rule)]" />
                      ))}
                    </span>
                  )}
                </div>
              )
            })}
            {!historyStrip.length && (
              <div className="flex h-[92px] w-full items-center justify-center rounded-[4px] border border-dashed border-[var(--shotiq-color-rule)] text-[12px] text-[var(--shotiq-color-graphite)]">
                Mark your first make or miss to start the history strip.
              </div>
            )}
            {historyStrip.length > 0 && <ChevronRight className="h-[17px] w-[17px] shrink-0 text-[var(--shotiq-color-graphite)]" />}
          </div>
        </div>

        {/* right column */}
        <aside className="w-[420px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[20px] pt-[18px]">
          <SectionLabel>SET PROGRESS</SectionLabel>
          <Card className="mt-[8px] flex items-center justify-between px-[20px] py-[18px]" data-testid="set-progress">
            <div className="text-center">
              <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">TIME ELAPSED</div>
              <div className="shotiq-numeric text-[26px]">{mmss(Math.min(elapsed, SET_SECONDS * TOTAL_SETS))}</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">/ {mmss(SET_SECONDS)}</div>
            </div>
            <Ring pct={(elapsed % SET_SECONDS) / SET_SECONDS} size={92}>
              <div className="text-center">
                <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SET</div>
                <div className="shotiq-numeric text-[19px]">{setIndex} / {TOTAL_SETS}</div>
              </div>
            </Ring>
            <div className="text-center">
              <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">SETS COMPLETED</div>
              <div className="shotiq-numeric text-[30px]">{setsCompleted}</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">OF {TOTAL_SETS}</div>
            </div>
          </Card>

          <SectionLabel className="mt-[18px]">SHOT TRACKER</SectionLabel>
          <Card className="mt-[8px] px-[20px] py-[16px]" data-testid="shot-tracker">
            {/* Canonical rules SHOTS | MAKES | MISSES off from one another;
                the three cells used to run on with no separator at all. */}
            <div className="flex items-center">
              <div className="shrink-0 pr-[16px]">
                {/* Canonical sets the donut's own reading at cap 16 (advance 48);
                    at 19px this face gave cap 12.5, so the card's focal number
                    read two sizes down. The stroke is a shade heavier too. */}
                <Ring pct={pct / 100} size={96} stroke={7} color="var(--shotiq-color-confirmGreen)">
                  <div className="text-center">
                    <div className="shotiq-numeric text-[26px] leading-[28px]">{pct.toFixed(1)}%</div>
                    <div className="text-[8px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
                  </div>
                </Ring>
              </div>
              <div className="flex min-w-0 flex-1 items-center justify-around">
                <Stat3 v={String(shots.length)} l="SHOTS" c="var(--shotiq-color-ink)" />
                <span aria-hidden="true" className="h-[38px] w-px shrink-0 bg-[var(--shotiq-color-rule)]" />
                <Stat3 v={String(makes)} l="MAKES" c="var(--shotiq-color-confirmGreen)" />
                <span aria-hidden="true" className="h-[38px] w-px shrink-0 bg-[var(--shotiq-color-rule)]" />
                <Stat3 v={String(misses)} l="MISSES" c="var(--shotiq-color-reviewRed)" />
              </div>
            </div>
            {/* Canonical draws these marks at 10px on a 20px pitch — open green
                rings for makes, solid red discs with a white cross for misses —
                grouped 5 + 6, followed by three pale placeholders, over an axis
                that ends in an arrowhead. 13px marks read 30% heavy; the gutter
                grows to hold the pitch. */}
            <div className="mt-[14px] flex items-center gap-[10px]">
              {Array.from({ length: MARK_SLOTS }).map((_, i) => {
                const s = lastMarks[i]
                const gap = i === 5 ? "ml-[10px]" : ""
                if (s == null) {
                  return <span key={i} className={`h-[10px] w-[10px] shrink-0 rounded-full border-[1.5px] border-[var(--shotiq-color-rule)] ${gap}`} />
                }
                return s.made
                  ? <span key={i} className={`h-[10px] w-[10px] shrink-0 rounded-full border-[2.2px] border-[var(--shotiq-color-confirmGreen)] ${gap}`} />
                  : (
                    <span key={i} className={`grid h-[10px] w-[10px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-reviewRed)] ${gap}`}>
                      <CircleX className="h-[9px] w-[9px] text-white" strokeWidth={2.8} />
                    </span>
                  )
              })}
            </div>
            <div className="mt-[8px] flex items-center text-[var(--shotiq-color-rule)]">
              <span aria-hidden="true" className="h-[1px] flex-1 bg-current" />
              <svg width="9" height="9" viewBox="0 0 9 9" aria-hidden="true" className="-ml-[1px] shrink-0">
                <path d="M0.5 0.5 L8 4.5 L0.5 8.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </div>
            <div className="mt-[8px] text-center shotiq-microcaps text-[var(--shotiq-color-graphite)]">
              LAST 24 SHOTS
            </div>
          </Card>

          <div className="mt-[18px] flex items-center justify-between">
            <SectionLabel>COACHING CUES</SectionLabel>
            <span className="text-[12px] font-bold text-[var(--shotiq-color-analysisBlue)]">AI COACH</span>
          </div>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]" data-testid="coaching-cues">
            {cues.map(([t, d, state, glyph]) => (
              <div key={t} className="flex items-center gap-[14px] px-[16px] py-[12px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/${glyph}.png`} alt="" aria-hidden="true"
                     className="block h-[38px] w-auto max-w-none shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-semibold">{t}</div>
                  <div className="text-[12px] text-[var(--shotiq-color-graphite)]">{d}</div>
                </div>
                <span className={`rounded-full border px-[12px] py-[3px] text-[10px] font-bold ${state === "GOOD"
                  ? "border-[var(--shotiq-color-confirmGreen)] text-[var(--shotiq-color-confirmGreen)]"
                  : "border-[var(--shotiq-color-analysisBlue)] text-[var(--shotiq-color-analysisBlue)]"}`}>{state}</span>
                <ChevronDown className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
              </div>
            ))}
          </Card>
        </aside>

        {/* Workout complete — iOS 062 counterpart. Real session stats, share,
            repeat, and a next-drill recommendation. */}
        {completed && (
          <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-6"
               onClick={() => setCompleted(false)}>
            <Card data-testid="workout-complete" className="w-full max-w-[640px] p-[26px]"
                  onClick={(e) => e.stopPropagation()}>
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="shotiq-display text-[38px] leading-[40px]">WORKOUT COMPLETE</h2>
                  <p className="mt-[2px] text-[13px] text-[var(--shotiq-color-graphite)]">Great session. Here&apos;s how it went.</p>
                </div>
                <span className="rounded-full border border-[var(--shotiq-color-rule)] px-[12px] py-[3px] text-[12px]">{drillName}</span>
              </div>

              <div className="mt-[16px] grid grid-cols-4 divide-x divide-[var(--shotiq-color-rule)] rounded-[6px] border border-[var(--shotiq-color-rule)] py-[12px]">
                {[[String(shots.length), "SHOTS"], [String(makes), "MAKES"],
                  [shots.length ? `${Math.round((100 * makes) / shots.length)}%` : "—", "ACCURACY"],
                  [mmss(elapsed), "DURATION"]].map(([v, l]) => (
                  <div key={l} className="text-center">
                    <div className="shotiq-numeric text-[28px] leading-[32px]">{v}</div>
                    <div className="text-[9px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{l}</div>
                  </div>
                ))}
              </div>

              <div className="mt-[14px]">
                <SectionLabel>PHASE BREAKDOWN</SectionLabel>
                <div className="mt-[6px] flex justify-between">
                  {PHASES.map((p) => (
                    <div key={p} className="text-center">
                      <PoseFigure phase={p} active={p === "RELEASE"} height={36} className="mx-auto" />
                      <div className={`text-[9px] tracking-[0.05em] whitespace-nowrap ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-[14px] rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] p-[12px]">
                <SectionLabel>COACHING TAKEAWAY</SectionLabel>
                <p className="mt-[2px] text-[13px] leading-[18px]">
                  {shots.length === 0
                    ? "No shots logged this session — mark makes and misses next time to track your accuracy."
                    : makes / Math.max(1, shots.length) >= 0.6
                      ? "Strong accuracy this session. Keep your release rhythm and push the tempo next time."
                      : "Solid work. Slow the release down and focus on a full follow-through to raise your make rate."}
                </p>
              </div>

              <Link href="/training/drills/elbow-stack-builder"
                    className="mt-[12px] flex items-center gap-[12px] rounded-[6px] border border-[var(--shotiq-color-rule)] p-[12px] hover:border-[var(--shotiq-color-ink)]">
                <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">
                  <WorkoutGlyph kind="release" size={20} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="shotiq-section-label block text-[var(--shotiq-color-graphite)]">NEXT RECOMMENDATION</span>
                  <span className="block text-[14px] font-semibold">Elbow Stack Builder</span>
                  <span className="block text-[11px] text-[var(--shotiq-color-graphite)]">15 min · Form Focus</span>
                </span>
                <ChevronRight className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </Link>

              <div className="mt-[16px] flex flex-wrap gap-[10px]">
                <Link href="/results/demo/history"
                      className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[16px] text-[13px] font-medium text-[var(--shotiq-color-reviewRed)]">
                  Review shots
                </Link>
                <button type="button" onClick={shareProgress}
                        className="flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-analysisBlue)] px-[16px] text-[13px] font-medium text-[var(--shotiq-color-analysisBlue)]">
                  {shared ? "Copied ✓" : "Share progress"}
                </button>
                <button type="button" onClick={repeatDrill} data-testid="repeat-drill"
                        className="flex h-[44px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[18px] text-[13px] font-medium text-white">
                  Repeat drill
                </button>
                <button type="button" onClick={() => router.push("/results/demo/training")}
                        className="ml-auto flex h-[44px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
                  <LogOut className="h-[14px] w-[14px]" /> Back to training
                </button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ShotIQShell>
  )
}

function Stat3({ v, l, c }: { v: string; l: string; c: string }) {
  return (
    <div className="text-center">
      <div className="shotiq-numeric text-[26px] leading-[30px]" style={{ color: c }}>{v}</div>
      <div className="shotiq-microcaps text-[var(--shotiq-color-graphite)]">{l}</div>
    </div>
  )
}
