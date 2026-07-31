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
  CalendarCheck, Dumbbell, Library, Wrench, CircleCheckBig, History,
  GitCompare, TrendingUp, CircleCheck, CircleX, Undo2, Pause, Play, Square,
  VolumeX, Volume2, LogOut, ChevronRight, ChevronDown, Maximize,
} from "lucide-react"
import {
  ShotIQShell, WideSidebar, SectionLabel, Card, PhaseGlyph, TrendLine,
} from "@/components/shotiq/ShotIQShell"

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const SET_SECONDS = 360 // 06:00 per set
const TOTAL_SETS = 3

function Ring({ pct, size = 96, stroke = 8, color = "var(--shotiq-color-shotiqOrange)", children }: {
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

export default function DrillExecutionPage() {
  const params = useParams<{ drillId: string }>()
  const router = useRouter()
  const drillName = decodeURIComponent(params?.drillId ?? "drill")
    .replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()) || "Pound Crossover Foundation"

  const [shots, setShots] = useState<{ n: number; made: boolean }[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const shotN = useRef(0)

  useEffect(() => {
    if (paused) return
    const t = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(t)
  }, [paused])

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

  const cues = [
    ["Keep elbow stacked", "Elbow under ball at release", "GOOD"],
    ["Release at apex", "Release at the highest point", "FOCUS"],
    ["Square shoulders", "Shoulders aligned to target", "GOOD"],
    ["Follow through long", "Full extension and soft wrist", "FOCUS"],
    ["Balance & landing", "Stay balanced on landing", "FOCUS"],
  ] as const

  return (
    <ShotIQShell active="Training"
      sidebar={
        <div className="flex w-[190px] shrink-0 flex-col border-r border-[var(--shotiq-color-rule)]">
          <WideSidebar sections={[
            { heading: "TRAINING", items: [
              { label: "Today's Plan", href: "/results/demo/training", icon: CalendarCheck },
              { label: "Workouts", href: "/results/demo/training", icon: Dumbbell, active: true },
              { label: "Drill Library", href: "/results/demo/training", icon: Library },
              { label: "Custom Drills", href: "/results/demo/training", icon: Wrench },
              { label: "Active Goals", href: "/results/demo/goals", icon: CircleCheckBig },
            ]},
            { heading: "ANALYSIS", items: [
              { label: "Recent Analyses", href: "/results/demo/history", icon: History },
              { label: "Comparisons", href: "/results/demo/compare", icon: GitCompare },
              { label: "Form Trends", href: "/results/demo/history", icon: TrendingUp },
            ]},
          ]} />
          <Card className="mx-[14px] mb-[20px] mt-auto px-[16px] py-[14px]">
            <SectionLabel>FORM SCORE</SectionLabel>
            <div className="shotiq-numeric text-[40px] leading-[44px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
            <div className="h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full w-[70%] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
            </div>
            <div className="mt-[6px] text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
            <div className="text-[11px] leading-[15px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
          </Card>
        </div>
      }>
      <div data-testid="screen-desktop-web-drill-execution" className="flex">
        <div className="min-w-0 flex-1 px-[26px] pt-[18px]">
          <div className="text-[12px] text-[var(--shotiq-color-graphite)]">
            <Link href="/results/demo/training">Workouts</Link> &nbsp;›&nbsp; {drillName}
          </div>
          <div className="mt-[4px] flex items-center justify-between">
            <div className="flex items-center gap-[12px]">
              <h1 className="shotiq-display text-[42px] leading-[46px]">{drillName.toUpperCase()}</h1>
              <span className="rounded-full border border-[var(--shotiq-color-rule)] px-[12px] py-[3px] text-[12px]">Drill</span>
            </div>
            <button type="button" onClick={() => router.push("/results/demo/training")}
                    className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
              <LogOut className="h-[15px] w-[15px]" /> Exit workout
            </button>
          </div>
          <div className="mt-[8px] flex gap-[10px]">
            {["Ball Handling", "Beginner", "6 min", "Right Hand"].map((c) => (
              <span key={c} className="rounded-full border border-[var(--shotiq-color-rule)] px-[12px] py-[4px] text-[12px]">{c}</span>
            ))}
          </div>

          {/* live surface */}
          <div className="relative mt-[14px] h-[330px] overflow-hidden rounded-[6px] bg-[#1B1D20]" data-testid="live-surface">
            <span className="absolute left-[14px] top-[14px] flex items-center gap-[7px] rounded-[4px] bg-black/80 px-[10px] py-[5px] text-[11px] font-bold text-white">
              <span className="h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" /> LIVE
            </span>
            <Maximize className="absolute bottom-[12px] right-[12px] h-[17px] w-[17px] text-white" />
          </div>

          {/* phase scrubber */}
          <div className="mt-[12px] px-[10px]">
            <div className="flex justify-between">
              {PHASES.map((p) => (
                <div key={p} className="w-[80px] text-center">
                  <PhaseGlyph active={p === "RELEASE"} size={26} />
                  <div className={`mt-[2px] text-[10px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
                </div>
              ))}
            </div>
            <div className="relative mt-[6px] h-[3px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="absolute left-[62%] top-1/2 h-[13px] w-[13px] -translate-y-1/2 rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
              {[8, 30, 52, 84].map((x) => (
                <span key={x} className="absolute top-1/2 h-[8px] w-[8px] -translate-y-1/2 rounded-full bg-[var(--shotiq-color-graphite)]" style={{ left: `${x}%` }} />
              ))}
            </div>
          </div>

          {/* controls */}
          <div className="mt-[16px] flex gap-[12px]">
            <button type="button" onClick={() => mark(true)} data-testid="mark-make"
                    className="flex h-[44px] items-center gap-[9px] rounded-[6px] border-2 border-[var(--shotiq-color-confirmGreen)] px-[20px] text-[14px] font-medium text-[var(--shotiq-color-confirmGreen)]">
              <CircleCheck className="h-[17px] w-[17px]" /> Mark make
            </button>
            <button type="button" onClick={() => mark(false)} data-testid="mark-miss"
                    className="flex h-[44px] items-center gap-[9px] rounded-[6px] border-2 border-[var(--shotiq-color-reviewRed)] px-[20px] text-[14px] font-medium text-[var(--shotiq-color-reviewRed)]">
              <CircleX className="h-[17px] w-[17px]" /> Mark miss
            </button>
            <button type="button" onClick={undo} disabled={!shots.length} data-testid="undo-shot"
                    className="flex h-[44px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[20px] text-[14px] disabled:opacity-50">
              <Undo2 className="h-[16px] w-[16px]" /> Undo
            </button>
            <div className="ml-auto flex gap-[10px]">
              <button type="button" onClick={() => setPaused(!paused)} data-testid="pause-workout"
                      className="flex h-[44px] items-center gap-[9px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[18px] text-[14px] font-medium text-white">
                {paused ? <Play className="h-[15px] w-[15px]" /> : <Pause className="h-[15px] w-[15px]" />}
                {paused ? "Resume workout" : "Pause workout"}
              </button>
              <button type="button" onClick={() => router.push("/results/demo/training")}
                      className="flex h-[44px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[14px]">
                <Square className="h-[13px] w-[13px]" fill="currentColor" /> End workout
              </button>
              <button type="button" onClick={() => setMuted(!muted)}
                      className="flex h-[44px] items-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[14px]">
                {muted ? <Volume2 className="h-[16px] w-[16px]" /> : <VolumeX className="h-[16px] w-[16px]" />}
                {muted ? "Unmute coaching" : "Mute coaching"}
              </button>
            </div>
          </div>

          {/* shot history */}
          <SectionLabel className="mt-[18px]">SHOT HISTORY</SectionLabel>
          <div className="mb-[20px] mt-[8px] flex items-center gap-[8px] overflow-x-auto" data-testid="shot-history">
            {(last24.length ? last24 : []).map((s, i) => {
              const live = i === last24.length - 1
              return (
                <div key={`${s.n}-${i}`}
                     className={`relative h-[76px] w-[86px] shrink-0 overflow-hidden rounded-[4px] bg-[#1B1D20] ${live ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                  <span className="absolute left-[6px] top-[6px] text-[11px] font-bold text-white">{s.n}</span>
                  <span className="absolute right-[5px] top-[5px]">
                    {s.made
                      ? <CircleCheck className="h-[15px] w-[15px] text-[var(--shotiq-color-confirmGreen)]" fill="white" />
                      : <CircleX className="h-[15px] w-[15px] text-[var(--shotiq-color-reviewRed)]" fill="white" />}
                  </span>
                  {live && <span className="absolute bottom-[4px] left-1/2 -translate-x-1/2 text-[9px] font-bold text-[var(--shotiq-color-shotiqOrange)]">◆ LIVE</span>}
                </div>
              )
            })}
            {!last24.length && (
              <div className="flex h-[76px] w-full items-center justify-center rounded-[4px] border border-dashed border-[var(--shotiq-color-rule)] text-[12px] text-[var(--shotiq-color-graphite)]">
                Mark your first make or miss to start the history strip.
              </div>
            )}
            {last24.length > 0 && <ChevronRight className="h-[17px] w-[17px] shrink-0 text-[var(--shotiq-color-graphite)]" />}
          </div>
        </div>

        {/* right column */}
        <aside className="w-[420px] shrink-0 border-l border-[var(--shotiq-color-rule)] px-[20px] pt-[18px]">
          <SectionLabel>SET PROGRESS</SectionLabel>
          <Card className="mt-[8px] flex items-center justify-between px-[20px] py-[18px]" data-testid="set-progress">
            <div className="text-center">
              <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">TIME ELAPSED</div>
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
              <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">SETS COMPLETED</div>
              <div className="shotiq-numeric text-[30px]">{setsCompleted}</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">OF {TOTAL_SETS}</div>
            </div>
          </Card>

          <SectionLabel className="mt-[18px]">SHOT TRACKER</SectionLabel>
          <Card className="mt-[8px] px-[20px] py-[16px]" data-testid="shot-tracker">
            <div className="flex items-center justify-between">
              <Ring pct={pct / 100} size={96} color="var(--shotiq-color-confirmGreen)">
                <div className="text-center">
                  <div className="shotiq-numeric text-[19px]">{pct.toFixed(1)}%</div>
                  <div className="text-[8px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
                </div>
              </Ring>
              <Stat3 v={String(shots.length)} l="SHOTS" c="var(--shotiq-color-ink)" />
              <Stat3 v={String(makes)} l="MAKES" c="var(--shotiq-color-confirmGreen)" />
              <Stat3 v={String(misses)} l="MISSES" c="var(--shotiq-color-reviewRed)" />
            </div>
            <div className="mt-[14px] flex flex-wrap gap-[6px]">
              {Array.from({ length: 24 }).map((_, i) => {
                const s = last24[i]
                return s == null
                  ? <span key={i} className="h-[11px] w-[11px] rounded-full border border-[var(--shotiq-color-rule)]" />
                  : s.made
                    ? <CircleCheck key={i} className="h-[12px] w-[12px] text-[var(--shotiq-color-confirmGreen)]" />
                    : <CircleX key={i} className="h-[12px] w-[12px] text-[var(--shotiq-color-reviewRed)]" />
              })}
            </div>
            <div className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[8px] text-center text-[10px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
              LAST 24 SHOTS
            </div>
          </Card>

          <div className="mt-[18px] flex items-center justify-between">
            <SectionLabel>COACHING CUES</SectionLabel>
            <span className="text-[12px] font-bold text-[var(--shotiq-color-analysisBlue)]">AI COACH</span>
          </div>
          <Card className="mt-[8px] divide-y divide-[var(--shotiq-color-rule)]" data-testid="coaching-cues">
            {cues.map(([t, d, state]) => (
              <div key={t} className="flex items-center gap-[14px] px-[16px] py-[12px]">
                <TrendLine points={[2, 4, 3, 5, 4]} width={44} height={26}
                           stroke={state === "GOOD" ? "var(--shotiq-color-confirmGreen)" : "var(--shotiq-color-shotiqOrange)"}
                           dotFill={state === "GOOD" ? "var(--shotiq-color-confirmGreen)" : "var(--shotiq-color-shotiqOrange)"} />
                <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pl-[14px]">
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
      </div>
    </ShotIQShell>
  )
}

function Stat3({ v, l, c }: { v: string; l: string; c: string }) {
  return (
    <div className="text-center">
      <div className="shotiq-numeric text-[26px] leading-[30px]" style={{ color: c }}>{v}</div>
      <div className="text-[10px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{l}</div>
    </div>
  )
}
