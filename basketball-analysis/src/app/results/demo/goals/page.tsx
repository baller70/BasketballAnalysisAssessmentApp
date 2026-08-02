"use client"

/** /results/demo/goals — canonical 092-web-goals-plan, backed by /api/goals. */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Pencil, MoreVertical, Check, ChevronRight, X,
} from "lucide-react"
import { ShotIQShell, SectionLabel, Card, TrendLine } from "@/components/shotiq/ShotIQShell"
import { WorkoutGlyph, type WorkoutKind } from "@/components/shotiq/Glyphs"
import {
  useHistory, StatStrip, formatDelta, formatMakePct, scoreSeries,
} from "@/components/shotiq/ResultsBits"
import { csrfFetch } from "@/lib/api/csrfFetch"

interface Goal { id: string; title: string; description?: string; progress?: number }
interface ApiGoal { id: string; name: string; description?: string; currentValue?: number; targetValue?: number }

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
          progress: g.targetValue ? (g.currentValue ?? 0) / g.targetValue : 0,
        })))
      }).catch(() => {})
  }, [])
  const primary = goals[0] ?? DEMO_GOAL
  const pct = Math.round((primary.progress ?? 0) * 100)
  const flash = (m: string) => { setNotice(m); setTimeout(() => setNotice(""), 2500) }
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setModal(null); setMenuOpen(false); setWorkoutMenu(null) } }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Server-first; if the API declines (e.g. signed-out preview) the change is
  // kept locally so the control still does real, visible work.
  const createGoal = async () => {
    if (!form.title.trim()) return
    let created: Goal = { id: `local-${goals.length + 1}`, title: form.title.trim(), description: form.description, progress: 0 }
    try {
      const res = await csrfFetch("/api/goals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.title.trim(), description: form.description, targetValue: 100, currentValue: 0, unit: "%" }),
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

  return (
    <ShotIQShell active="Progress">
    <div data-testid="screen-desktop-web-goals-plan" className="px-[26px] pb-[14px] pt-[18px]">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="shotiq-display text-[44px] leading-[46px]">GOALS &amp; PLAN</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">Stay focused. Track progress. Build better mechanics.</p>
        </div>
        <div className="flex items-center gap-[12px]">
          {notice && <span className="text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">{notice}</span>}
          <button type="button" onClick={() => { setForm({ title: "", description: "" }); setModal("create") }}
                  className="flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[22px] text-[14px] font-medium text-white">
            <TrendLine points={[2, 4, 3, 5]} width={26} height={16} stroke="#fff" dotFill="#fff" /> Create goal
          </button>
          <button type="button" onClick={logProgress}
                  className="flex h-[48px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            <TrendLine points={[2, 3, 4]} width={26} height={16} stroke="var(--shotiq-color-ink)" dotFill="var(--shotiq-color-ink)" /> Log progress
          </button>
        </div>
      </div>

      <div className="mt-[8px] grid grid-cols-3 gap-[16px]">
        {/* primary goal */}
        <Card className="p-[16px]">
          <div className="text-[11px] font-bold tracking-[0.06em] text-[var(--shotiq-color-confirmGreen)]">PRIMARY GOAL</div>
          <h2 className="mt-[6px] text-[22px] font-semibold leading-[28px]">{primary.title}</h2>
          <div className="mt-[8px] flex items-center gap-[10px] text-[12px] text-[var(--shotiq-color-graphite)]">
            <span className="rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[8px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE</span>
            Started May 10, 2025 · Target date Jun 10, 2025 <Pencil className="h-[12px] w-[12px]" />
          </div>
          <p className="mt-[10px] text-[13px] text-[var(--shotiq-color-graphite)]">Improve release consistency and arm alignment</p>
          <div className="mt-[8px] flex items-center gap-[10px]">
            <div className="h-[7px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[13px]">{pct}%</span>
          </div>
          {/* Hairline-ruled and evenly distributed, as canonical sets it — the
              cells used to sit in a left-clustered gap row with no rules. */}
          <StatStrip className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px]"
                     valueClass="text-[20px] leading-[22px]"
                     cells={[
                       { value: hasData ? shots ?? "—" : "0", label: "SHOTS" },
                       { value: hasData ? makes ?? "—" : "0", label: "MAKES" },
                       { value: hasData ? formatMakePct(shots, makes) : "—", label: "MAKE %" },
                       { value: formatDelta(delta), label: "VS LAST SESSION",
                         accent: delta != null && delta < 0
                           ? "var(--shotiq-color-reviewRed)" : "var(--shotiq-color-confirmGreen)" },
                     ]} />
          <SectionLabel className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">PROGRESS TREND</SectionLabel>
          <div className="flex items-center gap-[12px]">
            <div>
              <TrendLine points={scoreSeries(items, 8).length >= 2 ? scoreSeries(items, 8) : [2, 2.6, 2.2, 3, 2.7, 3.4, 3.2, 4]} width={230} height={50} />
              <div className="flex justify-between pr-[6px] text-[9px] tracking-[0.03em] text-[var(--shotiq-color-graphite)]">
                {["Apr 13", "Apr 20", "Apr 27", "May 4", "May 11"].map((d) => <span key={d}>{d}</span>)}
                <span className="font-bold text-[var(--shotiq-color-confirmGreen)]">TODAY</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-[16px] font-bold ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{formatDelta(delta)}</div>
              <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</div>
            </div>
          </div>
          <SectionLabel className="mt-[8px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">KEY MECHANIC FOCUS</SectionLabel>
          <div className="mt-[6px] flex items-center gap-[12px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/092-key-mechanic.png" alt="" aria-hidden="true"
                 className="block h-[62px] w-auto max-w-none shrink-0" />
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Elbow vertical at release</div>
              <p className="text-[11px] text-[var(--shotiq-color-graphite)]">Maintain a stacked arm position to improve consistency and accuracy.</p>
            </div>
            <div className="text-right">
              <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">IMPACT</div>
              <div className="text-[13px] font-bold text-[var(--shotiq-color-confirmGreen)]">High</div>
              <div className="mt-[3px] text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">CONFIDENCE</div>
              <div className="shotiq-numeric text-[13px]">7/10</div>
            </div>
          </div>
          <div className="mt-[8px] flex gap-[10px]">
            <button type="button"
                    onClick={() => { setForm({ title: primary.title, description: primary.description ?? "" }); setModal("edit") }}
                    className="flex h-[42px] flex-1 items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              <Pencil className="h-[13px] w-[13px]" /> Edit goal
            </button>
            <div className="relative">
              <button type="button" aria-label="More" aria-expanded={menuOpen}
                      onClick={() => setMenuOpen((v) => !v)}
                      className="grid h-[42px] w-[46px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
                <MoreVertical className="h-[14px] w-[14px]" />
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
              {[["Pull-Up Jumper", "May 12, 2025 at 8:24 AM", "82", "1"], ["Spot-Up Three", "May 11, 2025 at 6:15 PM", "78", "2"], ["Transition Pull-Up", "May 10, 2025 at 4:02 PM", "75", "3"]].map(([t, d, s, img]) => (
                <Link key={String(t)} href="/results/demo/history"
                      className="flex items-center gap-[12px] py-[9px] hover:bg-[var(--shotiq-color-warmCanvas)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/images/canonical/092-thumb-${img}.png`} alt=""
                       className="h-[93px] w-[104px] shrink-0 rounded-[4px] object-cover" width={104} height={93} />
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
              <Link href="/results/demo/training" className="text-[11px] text-[var(--shotiq-color-analysisBlue)]">View all</Link>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {([["Quick Release Builder", "20 min · Form Focus · Today at 5:00 PM", "Speed & Consistency", "release"],
                ["Combo Control Ladder", "18 min · Control Focus · Tomorrow at 11:00 AM", "Control & Timing", "ladder"],
                ["Handle to Release Flow", "22 min · Game Speed · May 15 at 4:30 PM", "Flow & Integration", "flow"]] as [string, string, string, WorkoutKind][]).map(([t, d, f, glyph]) => (
                <div key={t} className="relative flex items-center gap-[12px] py-[9px]">
                  <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-[8px] bg-[var(--shotiq-color-analysisBlue)] text-white">
                    <WorkoutGlyph kind={glyph} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                  <div className="w-[90px] shrink-0 text-right">
                    <div className="text-[9px] tracking-[0.04em] text-[var(--shotiq-color-graphite)]">FOCUS</div>
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
              <Link href="/points" className="text-[11px] text-[var(--shotiq-color-analysisBlue)]">View all</Link>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {[["+5% Make Percentage", "Achieved May 11, 2025", "62.5%", "done"],
                ["3 Sessions Logged", "Achieved May 11, 2025", "3/3", "done"],
                ["75+ Form Score Average", "In progress", hasData ? "78" : "—", "active"],
                ["10 Consecutive Sessions", "0 / 10", "0/10", "open"],
                ["65% Make Percentage", "In progress", "62.5%", "open"]].map(([t, d, v, st]) => (
                <div key={String(t)} className="flex items-center gap-[12px] py-[9px]">
                  <span className={`grid h-[24px] w-[24px] place-items-center rounded-full ${st === "done" ? "bg-[var(--shotiq-color-confirmGreen)] text-white" : st === "active" ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-2 border-[var(--shotiq-color-rule)]"}`}>
                    {st === "done" && <Check className="h-[13px] w-[13px]" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                  <span className="w-[52px] shrink-0 text-right">
                    <span className={`shotiq-numeric block text-[18px] leading-[21px] tabular-nums ${st === "done" ? "text-[var(--shotiq-color-confirmGreen)]" : st === "active" ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{v}</span>
                    {st === "active" && <span className="block text-[9px] text-[var(--shotiq-color-graphite)]">Current</span>}
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
              <div className="grid h-[86px] w-[86px] shrink-0 place-items-center rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-rule)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/092-create-goal.png" alt="" aria-hidden="true"
                     className="block h-[52px] w-auto max-w-none" />
              </div>
              <ul className="space-y-[8px] text-[12px]">
                {["Focus on the right mechanics", "Track progress with AI analysis", "Stay accountable and improve"].map((t) => (
                  <li key={t} className="flex items-center gap-[8px]">
                    <Check className="h-[13px] w-[13px] text-[var(--shotiq-color-confirmGreen)]" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" onClick={() => { setForm({ title: "", description: "" }); setModal("create") }}
                    className="mt-[12px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              <TrendLine points={[2, 4, 3, 5]} width={26} height={16} stroke="#fff" dotFill="#fff" /> Create goal
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
                      onClick={modal === "create" ? createGoal : editGoal}
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
