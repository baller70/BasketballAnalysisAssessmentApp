"use client"

/**
 * /training/calendar — training plan across six zoom levels: Day, Week,
 * Month, 3 months, 6 months, 12 months. Demo plan data is anchored to the
 * canonical May 2025 week and repeats deterministically.
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, ChevronLeft, ChevronRight } from "@/components/shotiq/ApprovedLucide"
import { ShotIQShell, SectionLabel, Card, TrendLine } from "@/components/shotiq/ShotIQShell"
import { WorkoutCalendar } from "@/components/shotiq/phone/TrainingPhone"
import { usePhoneViewport } from "@/components/shotiq/phone/PhoneBits"

interface Session { title: string; time: string; len: string; mins: number; focus: string; drill: string; done?: boolean }

const PLAN: Record<string, Session[]> = {
  MON: [{ title: "Quick Start Workout", time: "5:00 PM", len: "28 min", mins: 28, focus: "Release consistency", drill: "quick-start-workout", done: true }],
  TUE: [{ title: "Elbow Stack Holds", time: "6:30 PM", len: "30 min", mins: 30, focus: "Form", drill: "elbow-stack-holds", done: true }],
  WED: [{ title: "Combo Control Ladder", time: "11:00 AM", len: "25 min", mins: 25, focus: "Control & Timing", drill: "combo-control-ladder" }],
  THU: [{ title: "High Elbow Release", time: "5:30 PM", len: "35 min", mins: 35, focus: "Shooting", drill: "high-elbow-release" }],
  FRI: [],
  SAT: [{ title: "Handle To Release Flow", time: "4:30 PM", len: "40 min", mins: 40, focus: "Flow & Integration", drill: "handle-to-release-flow" }],
  SUN: [],
}
const DAYS = Object.keys(PLAN)
const DATES = ["May 12", "May 13", "May 14", "May 15", "May 16", "May 17", "May 18"]
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
// May 2025: May 1 falls on a Thursday; 31 days.
const MAY_OFFSET = 3 // Mon-first column index of May 1
const MAY_DAYS = 31

const VIEWS = ["Day", "Week", "Month", "3 months", "6 months", "12 months"] as const
type View = (typeof VIEWS)[number]

const weeklyMins = Object.values(PLAN).flat().reduce((s, x) => s + x.mins, 0)
const weeklySessions = Object.values(PLAN).flat().length

/** Deterministic demo plan for any date-of-month (repeats the weekly plan). */
const planForDayIndex = (i: number) => PLAN[DAYS[(i + MAY_OFFSET) % 7]]

/** Monday-first index of a Date (0 = MON … 6 = SUN). */
const mondayIndex = (d: Date) => (d.getDay() + 6) % 7

export default function TrainingCalendarPage() {
  const [view, setView] = useState<View>("Week")
  const [selected, setSelected] = useState("MON")
  const [week, setWeek] = useState(0)
  const [month, setMonth] = useState(4) // May
  const isPhone = usePhoneViewport()

  /* YOUR training week, when you have one.
     This screen was built entirely on `PLAN` above — five sessions dated
     May 2025, the same on every account, with the month cards extrapolating
     "sessions in month" arithmetically from them. Meanwhile `Workout` rows,
     GET /api/workouts (which already takes a from/to range) and the full CRUD
     in lib/api/workoutsClient all existed, and completing a drill in
     DrillExecutionPage really does create a workout — nothing on this page
     ever read any of it.

     Fetches the Monday-to-Sunday week containing today and groups by weekday.
     With no workouts the demo plan and its May framing stay exactly as they
     were, so the canonical screen is untouched for a player who has not
     trained yet. */
  const [live, setLive] = useState<{
    plan: Record<string, Session[]>; dates: string[]
    byDate: Record<string, Session[]>; year: number
  } | null>(null)

  useEffect(() => {
    let cancelled = false
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - mondayIndex(now))
    monday.setHours(0, 0, 0, 0)

    // The WHOLE year in one call, not just this week: the month grid and the
    // month/quarter cards are the same screen at a different zoom, and driving
    // them off a week would have left them extrapolating — which is what they
    // did from the demo constants ("sessions in month" = weekly x 30/7).
    const jan = new Date(now.getFullYear(), 0, 1)
    const dec = new Date(now.getFullYear() + 1, 0, 1)

    fetch(`/api/workouts?from=${jan.toISOString()}&to=${dec.toISOString()}`,
          { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !Array.isArray(d?.workouts) || d.workouts.length === 0) return
        const plan: Record<string, Session[]> = Object.fromEntries(DAYS.map((k) => [k, []]))
        const byDate: Record<string, Session[]> = {}
        const sunday = new Date(monday); sunday.setDate(monday.getDate() + 7)
        for (const w of d.workouts as Array<{
          id: string; name?: string; scheduledDate: string; duration?: number
          focusAreas?: string[]; drillIds?: string[]; completed?: boolean
        }>) {
          const when = new Date(w.scheduledDate)
          const key = DAYS[mondayIndex(when)]
          if (!key) continue
          const mins = w.duration ?? 0
          const session: Session = {
            title: w.name ?? "Training session",
            time: when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
            len: mins ? `${mins} min` : "—",
            mins,
            // Only what the row actually carries; an unset focus reads as a
            // dash rather than borrowing the demo plan's wording.
            focus: w.focusAreas?.[0] ?? "—",
            drill: w.drillIds?.[0] ?? "",
            done: Boolean(w.completed),
          }
          // Every workout lands in the date index; only this week's also land
          // in the weekday plan the week strip reads.
          const ymd = `${when.getFullYear()}-${when.getMonth()}-${when.getDate()}`
          ;(byDate[ymd] ||= []).push(session)
          if (when >= monday && when < sunday) plan[key].push(session)
        }
        for (const k of DAYS) plan[k].sort((a, b) => a.time.localeCompare(b.time))
        const dates = DAYS.map((_, i) => {
          const d = new Date(monday)
          d.setDate(monday.getDate() + i)
          return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        })
        setLive({ plan, dates, byDate, year: now.getFullYear() })
        // Open on the month and weekday the player is actually in. The demo
        // path keeps canonical's May/MON framing; with real data, defaulting to
        // May would show an empty grid beside a week strip full of sessions.
        setMonth(now.getMonth())
        setSelected(DAYS[mondayIndex(now)])
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  /* One switch, read everywhere PLAN and DATES were, so the week strip, the day
     detail, the month grid and the summary cannot disagree about the same day. */
  const plan = live?.plan ?? PLAN
  const dates = live?.dates ?? DATES
  const year = live?.year ?? 2025
  const flat = Object.values(plan).flat()

  const sessions = plan[selected] ?? []
  const total = flat.length
  const done = flat.filter((s) => s.done).length
  const dayIdx = DAYS.indexOf(selected)

  const stepDay = (dir: 1 | -1) => setSelected(DAYS[(dayIdx + dir + 7) % 7])

  /* The month grid's shape follows the month being shown once there is real
     data; without it, canonical's May 2025 (Thursday start, 31 days) stands. */
  /* The week strip's own label. It read "This week · May 12 – 18, 2025" as a
     literal, so an account whose sessions were all in August still had its
     current week announced as a week in May 2025 — sitting directly above the
     seven real dates it contradicted. `dates` already holds this week's days;
     the label is composed from them, and drops the repeated month exactly the
     way canonical writes it. Without live data canonical's own string stands. */
  const weekLabel = live
    ? (() => {
        const [a, b] = [dates[0] ?? "", dates[6] ?? ""]
        const sameMonth = a.split(" ")[0] === b.split(" ")[0]
        return `This week · ${a} – ${sameMonth ? b.split(" ")[1] : b}, ${year}`
      })()
    : "This week · May 12 – 18, 2025"

  const gridOffset = live ? mondayIndex(new Date(year, month, 1)) : MAY_OFFSET
  const gridDays = live ? new Date(year, month + 1, 0).getDate() : MAY_DAYS

  /** Every session in a month, from the date index. */
  const monthSessions = (mi: number): Session[] => {
    if (!live) return []
    const out: Session[] = []
    for (let d = 1; d <= new Date(year, mi + 1, 0).getDate(); d++) {
      out.push(...(live.byDate[`${year}-${mi}-${d}`] ?? []))
    }
    return out
  }

  const monthCard = (mi: number, key: string) => {
    // Real counts when there are workouts. The demo path keeps canonical's
    // extrapolation from the weekly plan, which is what it always was.
    const ms = monthSessions(mi)
    const sessionsInMonth = live ? ms.length : Math.round((weeklySessions * 30) / 7)
    const minsInMonth = live
      ? ms.reduce((s, x) => s + x.mins, 0)
      : Math.round((weeklyMins * 30) / 7)
    const donePct = live
      ? (ms.length ? Math.round((ms.filter((s) => s.done).length / ms.length) * 100) : 0)
      : mi < 4 ? 100 : mi === 4 ? 40 : 0
    return (
      <button key={key} type="button" onClick={() => { setMonth(mi); setView("Month") }}
              className={`rounded-[8px] border p-[14px] text-left hover:border-[var(--shotiq-color-graphite)] ${
                mi === 4 ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"} bg-white`}>
        <div className="flex items-baseline justify-between">
          <span className="text-[14px] font-bold">{MONTHS[mi]} {year}</span>
          <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{sessionsInMonth} sessions</span>
        </div>
        <div className="mt-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">{Math.round(minsInMonth / 60)} h {minsInMonth % 60} min planned</div>
        <div className="mt-[8px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: `${donePct}%` }} />
        </div>
        <div className="mt-[4px] text-[10px] text-[var(--shotiq-color-graphite)]">
          {donePct === 100 ? "Completed" : donePct > 0 ? `${donePct}% complete` : "Planned"}
        </div>
      </button>
    )
  }

  /* Canonical 059 is a MONTH grid with status rings and a legend, not the
     desktop week strip. Seven columns is right on any device — what round 6
     got wrong was that the day headers and the per-day minutes were set in the
     11px body face, which needs 26px of advance in a 53px column and so broke
     "MON" to "M / O / N" and "20 min" to "2 / 0 m i n". The phone screen sets
     both as microcaps that fit the measured column on one line. */
  if (isPhone) {
    return (
      <div className="md:hidden">
        <WorkoutCalendar onOpen={() => { window.location.assign("/training/drills/wall-elbow-alignment") }} />
      </div>
    )
  }

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
          {view === "Week" && (
            <div className="flex items-center gap-[10px]">
              <button type="button" aria-label="Previous week" onClick={() => setWeek((w) => w - 1)}
                      className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <ChevronLeft className="h-[15px] w-[15px]" />
              </button>
              <span className="text-[13px] font-medium">
                {week === 0 ? weekLabel : week > 0 ? `${week} week${week > 1 ? "s" : ""} ahead` : `${-week} week${week < -1 ? "s" : ""} ago`}
              </span>
              <button type="button" aria-label="Next week" onClick={() => setWeek((w) => w + 1)}
                      className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <ChevronRight className="h-[15px] w-[15px]" />
              </button>
            </div>
          )}
          {view === "Day" && (
            <div className="flex items-center gap-[10px]">
              <button type="button" aria-label="Previous day" onClick={() => stepDay(-1)}
                      className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <ChevronLeft className="h-[15px] w-[15px]" />
              </button>
              <span className="text-[13px] font-medium">{selected} · {dates[dayIdx]}, {year}</span>
              <button type="button" aria-label="Next day" onClick={() => stepDay(1)}
                      className="grid h-[36px] w-[36px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <ChevronRight className="h-[15px] w-[15px]" />
              </button>
            </div>
          )}
          {view === "Month" && <span className="text-[13px] font-medium">{MONTHS[month]} {year}</span>}
        </div>

        {/* view switcher */}
        <div className="mt-[14px] flex gap-[8px]" role="tablist" aria-label="Calendar views">
          {VIEWS.map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} aria-pressed={view === v}
                    className={`h-[34px] rounded-[999px] px-[16px] text-[13px] ${
                      view === v ? "bg-[var(--shotiq-color-ink)] font-medium text-white" : "border border-[var(--shotiq-color-rule)]"}`}>
              {v}
            </button>
          ))}
        </div>

        {/* ------------------------------------------------------------ WEEK */}
        {view === "Week" && (<>
          <div className="mt-[16px] grid grid-cols-7 gap-[10px]">
            {DAYS.map((d, i) => {
              const daySessions = plan[d] ?? []
              const isRest = daySessions.length === 0
              return (
                <button key={d} type="button" onClick={() => setSelected(d)} aria-pressed={selected === d}
                        className={`rounded-[8px] border p-[12px] text-center ${
                          selected === d ? "border-2 border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]"
                                         : "border-[var(--shotiq-color-rule)] bg-white"}`}>
                  <div className="text-[11px] font-bold tracking-[0.05em]">{d}</div>
                  <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{dates[i]}</div>
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
          <DayDetailAndSummary selected={selected} sessions={sessions} done={done} total={total} dayLabel={`${selected} · ${dates[dayIdx]}, ${year}`} />
        </>)}

        {/* ------------------------------------------------------------- DAY */}
        {view === "Day" && (
          <DayDetailAndSummary selected={selected} sessions={sessions} done={done} total={total}
                               dayLabel={`${selected} · ${dates[dayIdx]}, ${year}`} full />
        )}

        {/* ----------------------------------------------------------- MONTH */}
        {view === "Month" && (
          <Card className="mt-[16px] p-[16px]">
            <div className="grid grid-cols-7 gap-[6px] text-center text-[10px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">
              {DAYS.map((d) => <div key={d}>{d}</div>)}
            </div>
            <div className="mt-[6px] grid grid-cols-7 gap-[6px]">
              {Array.from({ length: gridOffset }).map((_, i) => <div key={`pad-${i}`} />)}
              {Array.from({ length: gridDays }).map((_, i) => {
                const daySessions = live
                  ? (live.byDate[`${year}-${month}-${i + 1}`] ?? [])
                  : planForDayIndex(i)
                const isRest = daySessions.length === 0
                const isSelected = live
                  ? new Date(year, month, i + 1).toDateString() === new Date().toDateString()
                  : month === 4 && i + 1 === 12 + dayIdx
                return (
                  <button key={i} type="button"
                          onClick={() => { setSelected(DAYS[(i + gridOffset) % 7]); setView("Day") }}
                          className={`min-h-[64px] rounded-[6px] border p-[6px] text-left ${
                            isSelected ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"} bg-white hover:border-[var(--shotiq-color-graphite)]`}>
                    <div className="text-[11px] font-semibold">{i + 1}</div>
                    {!isRest && (
                      <div className="mt-[4px] truncate rounded-[3px] bg-[var(--shotiq-color-warmCanvas)] px-[4px] py-[2px] text-[9px] text-[var(--shotiq-color-ink)]">
                        {daySessions[0].len} · {daySessions[0].focus}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <p className="mt-[10px] text-[11px] text-[var(--shotiq-color-graphite)]">
              Click any day to open its day view.
            </p>
          </Card>
        )}

        {/* ------------------------------------------------- 3 / 6 / 12 MONTH */}
        {view === "3 months" && (
          <div className="mt-[16px] grid grid-cols-3 gap-[12px]">
            {[3, 4, 5].map((mi) => monthCard(mi, `q-${mi}`))}
          </div>
        )}
        {view === "6 months" && (
          <div className="mt-[16px] grid grid-cols-3 gap-[12px]">
            {[2, 3, 4, 5, 6, 7].map((mi) => monthCard(mi, `h-${mi}`))}
          </div>
        )}
        {view === "12 months" && (
          <div className="mt-[16px] grid grid-cols-4 gap-[12px]">
            {MONTHS.map((_, mi) => monthCard(mi, `y-${mi}`))}
          </div>
        )}
      </div>
    </ShotIQShell>
  )
}

function DayDetailAndSummary({ selected, sessions, done, total, dayLabel, full = false }: {
  selected: string; sessions: Session[]; done: number; total: number; dayLabel: string; full?: boolean
}) {
  void selected
  return (
    <div className="mt-[18px] flex gap-[16px]">
      <Card className={`min-w-0 flex-1 p-[18px] ${full ? "min-h-[320px]" : ""}`}>
        <SectionLabel>{dayLabel}</SectionLabel>
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
  )
}
