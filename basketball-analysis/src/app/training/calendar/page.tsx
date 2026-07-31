"use client"

/**
 * /training/calendar — weekly training plan. Destination for the Training
 * Hub's "Calendar" card, "View calendar" and the week-plan day chips (no
 * dedicated canonical screen was supplied; follows the hub's card language).
 */

import React, { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react"
import { ShotIQShell, SectionLabel, Card, TrendLine } from "@/components/shotiq/ShotIQShell"

interface Session { title: string; time: string; len: string; focus: string; drill: string; done?: boolean }

const PLAN: Record<string, Session[]> = {
  MON: [{ title: "Quick Start Workout", time: "5:00 PM", len: "28 min", focus: "Release consistency", drill: "quick-start-workout", done: true }],
  TUE: [{ title: "Elbow Stack Holds", time: "6:30 PM", len: "30 min", focus: "Form", drill: "elbow-stack-holds", done: true }],
  WED: [{ title: "Combo Control Ladder", time: "11:00 AM", len: "25 min", focus: "Control & Timing", drill: "combo-control-ladder" }],
  THU: [{ title: "High Elbow Release", time: "5:30 PM", len: "35 min", focus: "Shooting", drill: "high-elbow-release" }],
  FRI: [],
  SAT: [{ title: "Handle To Release Flow", time: "4:30 PM", len: "40 min", focus: "Flow & Integration", drill: "handle-to-release-flow" }],
  SUN: [],
}
const DAYS = Object.keys(PLAN)
const DATES = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"]

export default function TrainingCalendarPage() {
  const [selected, setSelected] = useState("MON")
  const [week, setWeek] = useState(0)
  const sessions = PLAN[selected]
  const total = Object.values(PLAN).flat().length
  const done = Object.values(PLAN).flat().filter((s) => s.done).length

  return (
    <ShotIQShell active="Training">
      <div data-testid="screen-desktop-web-training-calendar" className="px-[26px] py-[18px]">
        <Link href="/results/demo/training"
              className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to Training Hub
        </Link>

        <div className="mt-[8px] flex items-end justify-between">
          <div>
            <h1 className="shotiq-display text-[48px] leading-[50px]">TRAINING CALENDAR</h1>
            <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
              Plan your week, protect your rest days, and stay consistent.
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            <button type="button" aria-label="Previous week" onClick={() => setWeek((w) => w - 1)}
                    className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
              <ChevronLeft className="h-[15px] w-[15px]" />
            </button>
            <span className="text-[13px] font-medium">
              {week === 0 ? "This week · May 12 – 18, 2025" : week > 0 ? `${week} week${week > 1 ? "s" : ""} ahead` : `${-week} week${week < -1 ? "s" : ""} ago`}
            </span>
            <button type="button" aria-label="Next week" onClick={() => setWeek((w) => w + 1)}
                    className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
              <ChevronRight className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

        <div className="mt-[16px] grid grid-cols-7 gap-[10px]">
          {DAYS.map((d, i) => {
            const daySessions = PLAN[d]
            const isRest = daySessions.length === 0
            return (
              <button key={d} type="button" onClick={() => setSelected(d)} aria-pressed={selected === d}
                      className={`rounded-[8px] border p-[12px] text-center ${
                        selected === d ? "border-2 border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]"
                                       : "border-[var(--shotiq-color-rule)] bg-white"}`}>
                <div className="text-[11px] font-bold tracking-[0.05em]">{d}</div>
                <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{DATES[i]}</div>
                <div className="mt-[8px] flex justify-center">
                  <TrendLine points={[2, 3, 2.4, 3.6]} width={36} height={20}
                             stroke={isRest ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"}
                             dotFill={isRest ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"} />
                </div>
                <div className={`mt-[6px] text-[11px] ${isRest ? "text-[var(--shotiq-color-muted)]" : "font-medium"}`}>
                  {isRest ? "Rest" : daySessions[0].len}
                </div>
                {daySessions[0]?.done && (
                  <div className="mt-[4px] flex items-center justify-center gap-[3px] text-[10px] text-[var(--shotiq-color-confirmGreen)]">
                    <Check className="h-[11px] w-[11px]" /> Done
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="mt-[18px] flex gap-[16px]">
          <Card className="min-w-0 flex-1 p-[18px]">
            <SectionLabel>{selected} · {DATES[DAYS.indexOf(selected)]}, 2025</SectionLabel>
            {sessions.length === 0 && (
              <p className="mt-[10px] text-[13px] text-[var(--shotiq-color-graphite)]">
                Rest day — recovery is part of the plan. Want to train anyway?{" "}
                <Link className="text-[var(--shotiq-color-analysisBlue)]" href="/training/drills">Browse drills</Link>.
              </p>
            )}
            {sessions.map((s) => (
              <div key={s.title} className="mt-[10px] flex items-center gap-[14px] rounded-[8px] border border-[var(--shotiq-color-rule)] p-[14px]">
                <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold">{s.title}</div>
                  <div className="text-[12px] text-[var(--shotiq-color-graphite)]">{s.time} · {s.len} · Focus: {s.focus}</div>
                </div>
                {s.done ? (
                  <span className="flex items-center gap-[5px] text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">
                    <Check className="h-[13px] w-[13px]" /> Completed
                  </span>
                ) : (
                  <Link href={`/training/drills/${s.drill}`}
                        className="flex h-[38px] items-center rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-white">
                    Start session
                  </Link>
                )}
              </div>
            ))}
          </Card>

          <Card className="w-[300px] shrink-0 p-[18px]">
            <SectionLabel>WEEK SUMMARY</SectionLabel>
            <div className="mt-[10px] flex items-center gap-[8px]">
              <Check className="h-[15px] w-[15px] text-[var(--shotiq-color-confirmGreen)]" />
              <span className="flex-1 text-[13px]">{done} of {total} sessions completed</span>
              <span className="text-[13px] font-semibold">{Math.round((done / total) * 100)}%</span>
            </div>
            <div className="mt-[8px] h-[6px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <div className="mt-[14px] space-y-[6px] border-t border-[var(--shotiq-color-rule)] pt-[12px] text-[12px] text-[var(--shotiq-color-graphite)]">
              <div className="flex justify-between"><span>Planned time</span><span className="font-medium text-[var(--shotiq-color-ink)]">2 h 38 min</span></div>
              <div className="flex justify-between"><span>Primary focus</span><span className="font-medium text-[var(--shotiq-color-ink)]">Release consistency</span></div>
              <div className="flex justify-between"><span>Rest days</span><span className="font-medium text-[var(--shotiq-color-ink)]">Fri · Sun</span></div>
            </div>
            <Link href="/training/drills"
                  className="mt-[14px] flex h-[40px] items-center justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              Add a session from the library
            </Link>
          </Card>
        </div>
      </div>
    </ShotIQShell>
  )
}
