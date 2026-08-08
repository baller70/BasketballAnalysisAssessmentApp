"use client"

/** /results/demo/goals — canonical 092-web-goals-plan, backed by /api/goals. */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Pencil, MoreVertical, MoreHorizontal, Check, CircleCheck, ChevronRight, X,
} from "@/components/shotiq/ApprovedLucide"
import { ShotIQShell, SectionLabel, Card, TrendLine, PageTitle } from "@/components/shotiq/ShotIQShell"
import { WorkoutGlyph, type WorkoutKind, ActionGlyph } from "@/components/shotiq/Glyphs"
import {
  useHistory, StatStrip, formatDelta, formatMakePct, scoreSeries,
} from "@/components/shotiq/ResultsBits"
import { csrfFetch } from "@/lib/api/csrfFetch"
import { GoalsList, CreateGoal, GoalDetail } from "@/components/shotiq/phone/GoalsPhone"
import { usePhoneViewport, usePhoneStep } from "@/components/shotiq/phone/PhoneBits"

/* Canonical draws THREE phone designs on this route — 063 goals, 064 create
   goal and 065 goal detail. Round 6 shipped 064 as a two-field MODAL where
   canonical draws a full form page, and 065 as 063 scrolled 560px. */
const PHONE_GOAL_STEPS = ["list", "create", "detail"] as const

interface Goal {
  id: string; title: string; description?: string; progress?: number
  /** True when the bar is a reading over real sessions, not a stored number. */
  measured?: boolean
  /** Why no reading was possible, when there is none. */
  progressReason?: string | null
  /** The server could not measure this goal — distinct from measuring zero. */
  unmeasured?: boolean
  currentValue?: number | null
  unit?: string
  startedAt?: string | null
  deadline?: string | null
}
interface ApiGoal {
  id: string; name: string; description?: string
  currentValue?: number; targetValue?: number; unit?: string
  createdAt?: string; deadline?: string | null
  progress?: {
    currentValue: number | null
    source: "measured" | "stored" | "unmeasured"
    reason: string | null
    fraction: number | null
  }
}

const DEMO_GOAL: Goal = { id: "demo", title: "Keep elbow stacked through release", progress: 0.72 }

export default function GoalsPlanPage() {
  const { hasData, items, shots, makes, delta } = useHistory()
  const [goals, setGoals] = useState<Goal[]>([])
  const [modal, setModal] = useState<null | "create" | "edit" | "log">(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [workoutMenu, setWorkoutMenu] = useState<string | null>(null)
  const [notice, setNotice] = useState("")
  const [form, setForm] = useState({ title: "", description: "" })
  useEffect(() => {
    fetch("/api/goals", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d?.goals?.length) setGoals((d.goals as ApiGoal[]).map((g) => ({
          id: g.id, title: g.name, description: g.description,
          /* THE BAR NEVER MOVED. `currentValue` is only ever written by a
             client PATCH, so a goal's progress was whatever the client last
             said it was — in practice zero, forever, on the one screen whose
             subject is progress. /api/goals now measures each goal against the
             player's own sessions and returns the reading beside the stored
             value; the stored one is still the fallback for a goal nothing can
             measure. */
          progress: g.progress?.fraction ?? (g.targetValue ? (g.currentValue ?? 0) / g.targetValue : 0),
          measured: g.progress?.source === "measured",
          progressReason: g.progress?.reason ?? null,
          unmeasured: g.progress?.source === "unmeasured",
          /* NOT `progress.currentValue ?? currentValue`. `??` treats an
             explicit null as "try the next one", so a goal the server had just
             declined to measure fell straight through to the stored 0 and
             printed "0%" — presenting "nobody has checked" as "you have made no
             progress", which is the one confusion this whole path exists to
             prevent. An unmeasured goal carries no value at all. */
          currentValue: g.progress
            ? (g.progress.source === "unmeasured" ? null : g.progress.currentValue)
            : g.currentValue ?? null,
          unit: g.unit ?? "",
          startedAt: g.createdAt ?? null,
          deadline: g.deadline ?? null,
        })))
      }).catch(() => {})
  }, [])
  const primary = goals[0] ?? DEMO_GOAL
  const pct = Math.round((primary.progress ?? 0) * 100)

  /** "Started 10 May 2025 · Target date 10 Jun 2025" was typed onto the card;
   *  a Goal row carries both dates. A goal with no deadline says so rather
   *  than inheriting one from the demo. */
  const goalDate = (iso: string | null | undefined) =>
    iso ? new Date(iso).toLocaleDateString("en-US",
      { month: "short", day: "numeric", year: "numeric" }) : null
  const startedLabel = goalDate(primary.startedAt)
  const targetLabel = goalDate(primary.deadline)
  const datesLine = startedLabel
    ? `Started ${startedLabel}${targetLabel ? ` · Target date ${targetLabel}` : " · No target date"}`
    : "Started May 10, 2025 · Target date Jun 10, 2025"
  /* The trend's x-axis. It printed five dates ending "May 11" whatever the
     sessions under the line were, so the chart and its own axis disagreed the
     moment the line became real. Six evenly-spread labels across the same
     window the line plots, oldest first, with the last reading TODAY as
     canonical draws it. */
  const trendLabels = (() => {
    const dated = items.filter((i) => i.at).slice(0, 8).reverse()
    if (dated.length < 2) return ["Apr 13", "Apr 20", "Apr 27", "May 4", "May 11"]
    const fmt = (iso: string) =>
      new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    // Five marks plus the TODAY flag the markup already draws after them.
    const step = Math.max(1, Math.floor(dated.length / 5))
    const marks = dated.filter((_, i) => i % step === 0).slice(0, 5).map((i) => fmt(i.at as string))
    /* Several sessions in one day are normal, and they all format to the same
       date — an axis reading "Aug 6  Aug 6  Aug 6  TODAY" labels nothing.
       Collapse repeats and let the row spread what is left. */
    return marks.filter((d, i) => d !== marks[i - 1])
  })()

  /* LINKED ANALYSES listed three sessions written into the markup — "Pull-Up
     Jumper · May 12, 2025 · 82" — on a card headed with what this goal is
     linked TO. The player's three newest real sessions, thumbnails riding
     along by position because an analysis carries no card art. */
  const linkedAnalyses: [string, string, string, string][] = items.length
    ? items.slice(0, 3).map((a, i) => [
        a.title, a.when, a.score != null ? String(a.score) : "—", String(i + 1),
      ] as [string, string, string, string])
    : [["Pull-Up Jumper", "May 12, 2025 at 8:24 AM", "82", "1"],
       ["Spot-Up Three", "May 11, 2025 at 6:15 PM", "78", "2"],
       ["Transition Pull-Up", "May 10, 2025 at 4:02 PM", "75", "3"]]

  /* SCHEDULED WORKOUTS listed three by name with times — "Today at 5:00 PM",
     "Tomorrow at 11:00 AM" — that were true on no account at all. The player's
     own upcoming workouts, from the table the calendar writes into. */
  const [workouts, setWorkouts] = useState<null | {
    id: string; name: string | null; scheduledDate: string
    duration: number | null; completed: boolean; focusAreas: unknown
  }[]>(null)
  useEffect(() => {
    let dead = false
    fetch("/api/workouts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success) setWorkouts(d.workouts ?? []) })
      .catch(() => {})
    return () => { dead = true }
  }, [])
  const GLYPHS: WorkoutKind[] = ["release", "ladder", "flow"]
  const upcoming = (workouts ?? [])
    .filter((w) => !w.completed)
    .sort((a, b) => Date.parse(a.scheduledDate) - Date.parse(b.scheduledDate))
    .slice(0, 3)
  const scheduledWorkouts: [string, string, string, WorkoutKind][] = upcoming.length
    ? upcoming.map((w, i) => {
        const d = new Date(w.scheduledDate)
        const today = new Date()
        const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
        const same = (a: Date, b: Date) => a.toDateString() === b.toDateString()
        const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
        const when = same(d, today) ? `Today at ${time}`
          : same(d, tomorrow) ? `Tomorrow at ${time}`
          : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${time}`
        const focus = Array.isArray(w.focusAreas) && w.focusAreas.length
          ? String(w.focusAreas[0]) : "Training"
        return [w.name || "Workout",
                [w.duration ? `${w.duration} min` : null, focus, when].filter(Boolean).join(" · "),
                focus, GLYPHS[i % GLYPHS.length]] as [string, string, string, WorkoutKind]
      })
    : [["Quick Release Builder", "20 min · Form Focus · Today at 5:00 PM", "Speed & Consistency", "release"],
       ["Combo Control Ladder", "18 min · Control Focus · Tomorrow at 11:00 AM", "Control & Timing", "ladder"],
       ["Handle to Release Flow", "22 min · Game Speed · May 15 at 4:30 PM", "Flow & Integration", "flow"]]

  /* MILESTONES was five rows with five figures — "+5% Make Percentage ·
     Achieved May 11, 2025 · 62.5%" — none of which anybody had achieved. The
     goals the player actually holds, each with its measured reading and the
     state that reading implies: done when it has reached its target, active for
     the one being worked, open otherwise. */
  const milestones: [string, string, string, string, string][] = goals.length
    ? goals.slice(0, 5).map((g, i) => {
        const reached = (g.progress ?? 0) >= 1
        const value = g.currentValue != null
          ? `${Math.round(g.currentValue * 10) / 10}${g.unit ?? ""}`
          : "—"
        /* Three different states, three different sentences. "Tracked by hand"
           is true of a custom goal; it is NOT true of one the app would happily
           measure as soon as there were shots to measure. */
        const note = reached ? "Achieved"
          : g.measured ? "In progress"
          : g.unmeasured ? (g.progressReason ?? "Nothing to measure yet")
          : g.progressReason ? "Tracked by hand" : "In progress"
        return [g.title, note, value,
                reached ? "done" : i === 0 ? "active" : "open", ""] as [string, string, string, string, string]
      })
    : [["+5% Make Percentage", "Achieved May 11, 2025", "62.5%", "done", "+8.1%"],
       ["3 Sessions Logged", "Achieved May 11, 2025", "3/3", "done", ""],
       ["75+ Form Score Average", "In progress", hasData ? "78" : "—", "active", ""],
       ["10 Consecutive Sessions", "0 / 10", "0/10", "open", ""],
       ["65% Make Percentage", "In progress", "62.5%", "open", ""]]

  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2500) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setModal(null); setMenuOpen(false); setWorkoutMenu(null) } }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Server-first; if the API declines (e.g. signed-out preview) the change is
  // kept locally so the control still does real, visible work.
  /* `override` exists for the phone form (064), which submits the name it holds
     in its own state: calling setForm() then createGoal() in the same tick would
     have read the PREVIOUS form value and created an empty goal. */
  const createGoal = async (override?: { title: string; description: string }) => {
    const src = override ?? form
    if (!src.title.trim()) return
    let created: Goal = { id: `local-${goals.length + 1}`, title: src.title.trim(), description: src.description, progress: 0 }
    try {
      const res = await csrfFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: src.title.trim(), description: src.description, targetValue: 100, currentValue: 0, unit: "%" }),
      })
      if (res.ok) {
        const d = await res.json()
        if (d?.goal) created = { id: d.goal.id, title: d.goal.name, description: d.goal.description, progress: 0 }
        flash("Goal created")
      } else flash("Goal saved locally — sign in to sync")
    } catch { flash("Goal saved locally — sign in to sync") }
    setGoals((g) => [created, ...g])
    setModal(null)
  }
  const patchPrimary = async (data: Record<string, unknown>, localNext: Goal, msg: string) => {
    if (primary.id !== "demo" && !primary.id.startsWith("local-")) {
      try {
        const res = await csrfFetch(`/api/goals/${primary.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
      } catch { msg = "Updated locally — sign in to sync" }
    }
    setGoals((g) => (g.length ? [localNext, ...g.slice(1)] : [localNext]))
    flash(msg)
    setModal(null)
    setMenuOpen(false)
  }
  const editGoal = () => patchPrimary(
    { name: form.title.trim() || primary.title, description: form.description },
    { ...primary, title: form.title.trim() || primary.title, description: form.description }, "Goal updated")
  const logProgress = () => {
    const next = Math.min(1, (primary.progress ?? 0) + 0.05)
    return patchPrimary({ currentValue: Math.round(next * 100) }, { ...primary, progress: next }, "Progress logged (+5%)")
  }
  const completeGoal = () => patchPrimary(
    { completedAt: new Date().toISOString(), currentValue: 100 }, { ...primary, progress: 1 }, "Goal marked complete")

  const isPhone = usePhoneViewport()
  const [phoneStep, goPhone] = usePhoneStep(PHONE_GOAL_STEPS, "list")
  if (isPhone) {
    return (
      <div className="md:hidden">
        {phoneStep === "list" && (
          <GoalsList onCreate={() => goPhone("create")} onOpen={() => goPhone("detail")} />
        )}
        {phoneStep === "create" && (
          <CreateGoal onCancel={() => goPhone("list")}
                      onCreate={(name) => {
                        void createGoal({ title: name, description: "" })
                        goPhone("list")
                      }} />
        )}
        {phoneStep === "detail" && (
          <GoalDetail onBack={() => goPhone("list")} onLog={logProgress} />
        )}
      </div>
    )
  }

  return (
    <ShotIQShell active="Progress">
    <div data-testid="screen-desktop-web-goals-plan" className="px-[26px] pb-[10px] pt-[14px]">
      <div className="flex items-start justify-between">
        <div>
          <PageTitle size={52}>GOALS &amp; PLAN</PageTitle>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">Stay focused. Track progress. Build better mechanics.</p>
        </div>
        <div className="flex items-center gap-[12px]">
          {notice && <span className="text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">{notice}</span>}
          <button type="button" onClick={() => { setForm({ title: "", description: "" }); setModal("create") }}
                  className="flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[22px] text-[14px] font-medium text-white">
            <ActionGlyph kind="nodeClimb" height={22} /> Create goal
          </button>
          <button type="button" onClick={logProgress}
                  className="flex h-[48px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            <ActionGlyph kind="nodeGraph" height={20} /> Log progress
          </button>
        </div>
      </div>

      {/* Canonical does not run three equal thirds here: the primary-goal card
          is the widest of the three (417 / 404 / 383). Equal thirds broke the
          goal title onto two lines and "VS LAST SESSION" onto two. */}
      <div className="mt-[8px] grid grid-cols-[1.12fr_0.97fr_0.91fr] gap-[16px]">
        {/* primary goal */}
        <Card className="flex flex-col p-[16px]">
          {/* The role owns `color`, and it is declared after the utility layer, so a
              `text-[…]` class loses the cascade to it — canonical draws this one
              eyebrow green (2,75,4), so the colour has to come in as a style. */}
          <div className="shotiq-section-label" style={{ color: "var(--shotiq-color-confirmGreen)" }}>PRIMARY GOAL</div>
          <h2 className="mt-[6px] text-[22px] font-semibold leading-[28px]">{primary.title}</h2>
          {/* Canonical spends this card's height on its own blocks — 27px
              between the title and the ACTIVE row, 27 to the description, 25 to
              the bar. The tight 8/10/8 rhythm finished the content 109px early
              and dumped the difference into one dead gap above the button. */}
          <div className="mt-[18px] flex items-center gap-[10px] text-[12px] text-[var(--shotiq-color-graphite)]">
            <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE</span>
            {datesLine} <Pencil className="h-[12px] w-[12px]" />
          </div>
          {/* The goal's own description; the card printed one sentence for
              every goal anybody had ever created. */}
          <p className="mt-[20px] text-[13px] text-[var(--shotiq-color-graphite)]">
            {primary.description?.trim() || "Improve release consistency and arm alignment"}
          </p>
          <div className="mt-[16px] flex items-center gap-[10px]">
            <div className="h-[7px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[13px]">{pct}%</span>
          </div>
          {/* What the bar is a reading OF. A goal nothing can measure says so
              rather than presenting a hand-entered number as progress. */}
          {primary.progressReason && (
            <p className="mt-[6px] text-[10px] leading-[13px] text-[var(--shotiq-color-graphite)]">
              {primary.progressReason}
            </p>
          )}
          {primary.measured && primary.currentValue != null && (
            <p className="mt-[6px] text-[10px] leading-[13px] text-[var(--shotiq-color-graphite)]">
              Measured from your sessions: {primary.currentValue}{primary.unit}
            </p>
          )}
          {/* Hairline-ruled and evenly distributed, as canonical sets it — the
              cells used to sit in a left-clustered gap row with no rules. */}
          {/* pr keeps the trend cell off the card border — canonical leaves ~31px */}
          <StatStrip className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pr-[16px] pt-[16px]"
                     cellClass="text-center whitespace-nowrap"
                     valueClass="text-[24px] leading-[26px]"
                     cells={[
                       { value: hasData ? shots ?? "—" : "0", label: "SHOTS" },
                       { value: hasData ? makes ?? "—" : "0", label: "MAKES" },
                       { value: hasData ? formatMakePct(shots, makes) : "—", label: "MAKE %" },
                       { value: formatDelta(delta), label: "VS LAST SESSION",
                         accent: delta != null && delta < 0
                           ? "var(--shotiq-color-reviewRed)" : "var(--shotiq-color-confirmGreen)" },
                     ]} />
          {/* The card used to stack every block at the top and leave ~180px of
              white above its floor; the two lower sections now take that slack
              the way canonical spends it. */}
          <div className="mt-[18px] border-t border-[var(--shotiq-color-rule)] pt-[16px]">
          <SectionLabel>PROGRESS TREND</SectionLabel>
          <div className="flex items-center gap-[12px]">
            <div className="min-w-0 flex-1">
              <TrendLine points={scoreSeries(items, 8).length >= 2 ? scoreSeries(items, 8) : [2, 2.6, 2.2, 3, 2.7, 3.4, 3.2, 4]} width={268} height={116} />
              <div className="flex justify-between pr-[6px] text-[9px] tracking-[0.03em] text-[var(--shotiq-color-graphite)]">
                {/* The axis was five typed dates ending "May 11" whatever the
                    sessions under the line actually were. */}
                {trendLabels.map((d, i) => <span key={`${d}-${i}`}>{d}</span>)}
                <span className="font-bold text-[var(--shotiq-color-confirmGreen)]">TODAY</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[16px] font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</div>
              <div className="whitespace-nowrap text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</div>
            </div>
          </div>
          </div>
          {/* Canonical leaves ~50px between the trend's x-axis labels and this
              heading and draws NO rule there; a full-width divider plus two
              justify-center flex children spread the gap to ~136px. */}
          <div className="mt-[42px]">
          <SectionLabel>KEY MECHANIC FOCUS</SectionLabel>
          <div className="mt-[10px] flex items-stretch gap-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/092-key-mechanic.png" alt="" aria-hidden="true"
                 className="block h-[98px] w-auto max-w-none shrink-0 self-center" />
            <div className="flex-1 self-center">
              <div className="text-[14px] font-semibold">Elbow vertical at release</div>
              <p className="text-[11px] text-[var(--shotiq-color-graphite)]">Maintain a stacked arm position to improve consistency and accuracy.</p>
            </div>
            {/* Canonical rules this pair off with a hairline at x=490 and
                centres the four lines in the column on a 21 / 32 / 21 rhythm;
                the app ran them right-aligned against the card border on a
                14 / 22 / 14 stack — 35% denser and with no divider at all.
                "7/10" is a display value there (cap 12–14, near-black), not the
                caption-sized numeral this used to set. */}
            <div className="flex w-[86px] shrink-0 flex-col justify-center border-l border-[var(--shotiq-color-rule)] pl-[14px] text-center">
              <div className="text-[9px] leading-[10px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">IMPACT</div>
              <div className="mt-[10px] text-[15px] font-bold leading-[17px] text-[var(--shotiq-color-confirmGreen)]">High</div>
              <div className="mt-[15px] text-[9px] leading-[10px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">CONFIDENCE</div>
              <div className="mt-[8px] shotiq-numeric text-[17px] leading-[19px] text-[var(--shotiq-color-ink)]">7/10</div>
            </div>
          </div>
          </div>
          <div className="mt-auto flex gap-[10px] pt-[10px]">
            <button type="button"
                    onClick={() => { setForm({ title: primary.title, description: primary.description ?? "" }); setModal("edit") }}
                    className="flex h-[42px] flex-1 items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              <Pencil className="h-[13px] w-[13px]" /> Edit goal
            </button>
            <div className="relative">
              <button type="button" aria-label="More" aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                      className="grid h-[42px] w-[46px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <MoreHorizontal className="h-[14px] w-[14px]" />
              </button>
              {menuOpen && (
                <div className="absolute bottom-[48px] right-0 z-30 w-[190px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                  <button type="button" onClick={completeGoal}
                          className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Mark complete</button>
                  <button type="button" onClick={logProgress}
                          className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Log progress</button>
                  <Link href="/results/demo/history" onClick={() => setMenuOpen(false)}
                        className="flex h-[32px] w-full items-center px-[12px] text-[13px] hover:bg-[var(--shotiq-color-warmCanvas)]">Linked analyses</Link>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* middle column */}
        <div className="space-y-[16px]">
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>LINKED ANALYSES</SectionLabel>
              <Link href="/results/demo/history" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all</Link>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {linkedAnalyses.map(([t, d, s, img]) => (
                <Link key={String(t)} href="/results/demo/history"
                      className="flex items-center gap-[12px] py-[9px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/092-thumb-${img}.png`} alt=""
                       className="h-[95px] w-[148px] shrink-0 rounded-[4px] object-cover" width={148} height={95} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    <div className="mt-[4px] text-[10px] text-[var(--shotiq-color-graphite)]">Form Score</div>
                    <div className="flex items-baseline gap-[6px]">
                      <span className="shotiq-numeric text-[26px] leading-[28px] text-[var(--shotiq-color-analysisBlue)]">{hasData ? s : "—"}</span>
                      <span className="text-[11px] text-[var(--shotiq-color-analysisBlue)]">● Good</span>
                    </div>
                  </div>
                  <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
                </Link>
              ))}
            </div>
          </Card>
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>SCHEDULED WORKOUTS</SectionLabel>
              <Link href="/results/demo/training" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all</Link>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {scheduledWorkouts.map(([t, d, f, glyph]) => (
                <div key={t} className="relative flex items-center gap-[12px] py-[9px]">
                  <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[8px] bg-[var(--shotiq-color-analysisBlue)] text-white">
                    <WorkoutGlyph kind={glyph} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t}</div>
                    {/* canonical breaks the meta after the focus, then dates it
                        on its own line; one concatenated string wrapped
                        mid-phrase */}
                    <div className="text-[10px] leading-[14px] text-[var(--shotiq-color-graphite)]">{d.split(" · ").slice(0, 2).join(" · ")}</div>
                    <div className="text-[10px] leading-[14px] text-[var(--shotiq-color-graphite)]">{d.split(" · ").slice(2).join(" · ")}</div>
                  </div>
                  <div className="w-[84px] shrink-0">
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Focus</div>
                    <div className="text-[10px] leading-[13px]">{f}</div>
                  </div>
                  <button type="button" aria-label={`Options for ${t}`}
                          onClick={() => setWorkoutMenu((m) => (m === t ? null : t))}
                          className="grid h-[24px] w-[24px] place-items-center rounded-[4px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                    <MoreVertical className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
                  </button>
                  {workoutMenu === t && (
                    <div className="absolute right-0 top-[42px] z-30 w-[170px] rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white py-[4px] shadow-[0_8px_20px_rgba(17,17,17,0.10)]">
                      <Link href={`/training/drills/${t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                            className="flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)]">Open drill</Link>
                      <Link href="/training/calendar"
                            className="flex h-[30px] w-full items-center px-[12px] text-[12px] hover:bg-[var(--shotiq-color-warmCanvas)]">View in calendar</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Link href="/results/demo/training"
                  className="mt-[8px] flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/092-add-drill.png" alt="" aria-hidden="true"
                   className="block h-[24px] w-auto max-w-none" /> Add drill
            </Link>
          </Card>
        </div>

        {/* right column */}
        <div className="space-y-[16px]">
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>MILESTONES</SectionLabel>
              <Link href="/points" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all</Link>
            </div>
            {/* Canonical threads a single vertical timeline stem between the
                check circles and draws no horizontal rule at all; this used to
                be a plain divided list, which read as a table rather than a
                progression. The stem runs first-circle centre to last. */}
            <div className="relative mt-[6px]">
              <span aria-hidden="true"
                    className="absolute bottom-[33px] left-[13px] top-[33px] w-[1px] bg-[var(--shotiq-color-rule)]" />
              {milestones.map(([t, d, v, st, sub]) => (
                <div key={String(t)} className="relative flex h-[66px] items-center gap-[12px]">
                  {/* the stem runs behind these, so each mark carries its own
                      opaque fill — one shared bg-paper utility here loses the
                      cascade to the green fill and blanks the done marks */}
                  <span className={`z-10 grid h-[26px] w-[26px] shrink-0 place-items-center rounded-full ${st === "done" ? "bg-[var(--shotiq-color-confirmGreen)] text-white" : st === "active" ? "border-2 border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-paper)]" : "border-2 border-[var(--shotiq-color-graphite)] bg-[var(--shotiq-color-paper)]"}`}>
                    {st === "done" && <Check className="h-[14px] w-[14px]" strokeWidth={3} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                  <span className="w-[52px] shrink-0 text-right">
                    <span className={`shotiq-numeric block text-[18px] leading-[21px] tabular-nums ${st === "done" ? "text-[var(--shotiq-color-confirmGreen)]" : st === "active" ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{v}</span>
                    {st === "active" && <span className="block text-[9px] text-[var(--shotiq-color-graphite)]">Current</span>}
                    {/* canonical carries the delta under the headline value */}
                    {sub && <span className="block text-[11px] text-[var(--shotiq-color-confirmGreen)]">{sub}</span>}
                  </span>
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-[16px]">
            <SectionLabel>CREATE A NEW GOAL</SectionLabel>
            <p className="mt-[6px] text-[12px] text-[var(--shotiq-color-graphite)]">
              Define what you want to improve and we&apos;ll help track your progress.
            </p>
            <div className="mt-[10px] flex gap-[14px]">
              <div className="grid h-[104px] w-[104px] shrink-0 place-items-center rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-rule)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/092-create-goal.png" alt="" aria-hidden="true"
                     className="block h-[62px] w-auto max-w-none" />
              </div>
              <ul className="space-y-[12px] text-[12px]">
                {["Focus on the right mechanics", "Track progress with AI analysis", "Stay accountable and improve"].map((t) => (
                  <li key={t} className="flex items-center gap-[8px]">
                    <CircleCheck className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" strokeWidth={1.6} /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={() => { setForm({ title: "", description: "" }); setModal("create") }}
                    className="mt-[16px] flex h-[52px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              <ActionGlyph kind="nodeClimb" height={22} /> Create goal
            </button>
          </Card>
        </div>
      </div>

      {(modal === "create" || modal === "edit") && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-[rgba(17,17,17,0.35)]" role="dialog" aria-modal="true"
             onClick={() => setModal(null)}
             onKeyDown={(e) => { if (e.key === "Escape") setModal(null) }}>
          <Card className="w-[420px] p-[20px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <SectionLabel>{modal === "create" ? "CREATE A NEW GOAL" : "EDIT GOAL"}</SectionLabel>
              <button type="button" aria-label="Close" onClick={() => setModal(null)}>
                <X className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
              </button>
            </div>
            <label className="mt-[14px] block text-[12px] font-bold tracking-[0.04em]">GOAL</label>
            <input autoFocus value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                   placeholder="e.g. Hold follow-through for 1 second"
                   className="mt-[6px] h-[42px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]" />
            <label className="mt-[12px] block text-[12px] font-bold tracking-[0.04em]">WHY IT MATTERS (OPTIONAL)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3} placeholder="What this goal should improve"
                      className="mt-[6px] w-full rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] py-[8px] text-[14px] outline-none focus:border-[var(--shotiq-color-ink)]" />
            <div className="mt-[14px] flex justify-end gap-[10px]">
              <button type="button" onClick={() => setModal(null)}
                      className="h-[42px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">Cancel</button>
              <button type="button" disabled={!form.title.trim()}
                      onClick={modal === "create" ? () => void createGoal() : editGoal}
                      className="h-[42px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[18px] text-[13px] font-medium text-white disabled:opacity-40">
                {modal === "create" ? "Create goal" : "Save changes"}
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
    </ShotIQShell>
  )
}
