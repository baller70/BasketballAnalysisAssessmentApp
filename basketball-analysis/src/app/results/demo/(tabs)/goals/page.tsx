"use client"

/** /results/demo/goals — canonical 092-web-goals-plan, backed by /api/goals. */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, MoreVertical, Check, ChevronRight } from "lucide-react"
import { SectionLabel, Card, MediaSurface, TrendLine, PhaseGlyph, Stat } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"

interface Goal { id: string; title: string; progress?: number; targetDate?: string }

export default function GoalsPlanPage() {
  const { hasData, score } = useHistory()
  const [goals, setGoals] = useState<Goal[]>([])
  useEffect(() => {
    fetch("/api/goals", { credentials: "include" }).then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.goals?.length) setGoals(d.goals) }).catch(() => {})
  }, [])
  const primary = goals[0] ?? {
    id: "demo", title: "Keep elbow stacked through release", progress: 0.72,
  }
  const pct = Math.round((primary.progress ?? 0) * 100)

  return (
    <div data-testid="screen-desktop-web-goals-plan">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="shotiq-display text-[48px] leading-[50px]">GOALS &amp; PLAN</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">Stay focused. Track progress. Build better mechanics.</p>
        </div>
        <div className="flex gap-[12px]">
          <button type="button" className="flex h-[48px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[22px] text-[14px] font-medium text-white">
            <TrendLine points={[2, 4, 3, 5]} width={26} height={16} stroke="#fff" dotFill="#fff" /> Create goal
          </button>
          <button type="button" className="flex h-[48px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            <TrendLine points={[2, 3, 4]} width={26} height={16} stroke="var(--shotiq-color-ink)" dotFill="var(--shotiq-color-ink)" /> Log progress
          </button>
        </div>
      </div>

      <div className="mt-[16px] grid grid-cols-3 gap-[16px]">
        {/* primary goal */}
        <Card className="p-[18px]">
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
          <div className="mt-[12px] flex gap-[18px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
            <Stat value={hasData ? "24" : "0"} label="SHOTS" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "15" : "0"} label="MAKES" valueClass="text-[20px] leading-[22px]" />
            <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" valueClass="text-[20px] leading-[22px]" />
            <div><div className="shotiq-numeric text-[20px] leading-[22px] text-[var(--shotiq-color-confirmGreen)]">+8.1%</div>
              <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</div></div>
          </div>
          <SectionLabel className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">PROGRESS TREND</SectionLabel>
          <div className="flex items-center gap-[12px]">
            <TrendLine points={[2, 2.6, 2.2, 3, 2.7, 3.4, 3.2, 4]} width={230} height={70} />
            <div className="text-right">
              <div className="text-[16px] font-bold text-[var(--shotiq-color-confirmGreen)]">+8.1%</div>
              <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</div>
            </div>
          </div>
          <SectionLabel className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">KEY MECHANIC FOCUS</SectionLabel>
          <div className="mt-[6px] flex items-center gap-[12px]">
            <PhaseGlyph size={40} />
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
          <div className="mt-[12px] flex gap-[10px]">
            <button type="button" className="flex h-[42px] flex-1 items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              <Pencil className="h-[13px] w-[13px]" /> Edit goal
            </button>
            <button type="button" aria-label="More" className="grid h-[42px] w-[46px] place-items-center rounded-[6px] border border-[var(--shotiq-color-rule)]">
              <MoreVertical className="h-[14px] w-[14px]" />
            </button>
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
              {[["Pull-Up Jumper", "May 12, 2025 at 8:24 AM", "82"], ["Spot-Up Three", "May 11, 2025 at 6:15 PM", "78"], ["Transition Pull-Up", "May 10, 2025 at 4:02 PM", "75"]].map(([t, d, s]) => (
                <div key={String(t)} className="flex items-center gap-[12px] py-[9px]">
                  <MediaSurface width={92} height={54} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">Form Score
                      <span className="ml-[6px] shotiq-numeric text-[16px] text-[var(--shotiq-color-analysisBlue)]">{hasData ? s : "—"}</span>
                      <span className="ml-[4px] text-[10px] text-[var(--shotiq-color-analysisBlue)]">● Good</span></div>
                  </div>
                  <ChevronRight className="h-[14px] w-[14px] text-[var(--shotiq-color-graphite)]" />
                </div>
              ))}
            </div>
          </Card>
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>SCHEDULED WORKOUTS</SectionLabel>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">View all</span>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {[["Quick Release Builder", "20 min · Form Focus · Today at 5:00 PM", "Speed & Consistency"],
                ["Combo Control Ladder", "18 min · Control Focus · Tomorrow at 11:00 AM", "Control & Timing"],
                ["Handle to Release Flow", "22 min · Game Speed · May 15 at 4:30 PM", "Flow & Integration"]].map(([t, d, f]) => (
                <div key={String(t)} className="flex items-center gap-[12px] py-[9px]">
                  <span className="grid h-[36px] w-[36px] place-items-center rounded-[8px] bg-[var(--shotiq-color-analysisBlue)] text-white">◎</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[14px] font-semibold">{t}</div>
                    <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
                  </div>
                  <div className="w-[90px] text-right">
                    <div className="text-[9px] tracking-[0.04em] text-[var(--shotiq-color-graphite)]">FOCUS</div>
                    <div className="text-[10px]">{f}</div>
                  </div>
                  <MoreVertical className="h-[13px] w-[13px] text-[var(--shotiq-color-graphite)]" />
                </div>
              ))}
            </div>
            <button type="button" className="mt-[8px] flex h-[38px] w-full items-center justify-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13px]">
              <PhaseGlyph size={16} /> Add drill
            </button>
          </Card>
        </div>

        {/* right column */}
        <div className="space-y-[16px]">
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>MILESTONES</SectionLabel>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">View all</span>
            </div>
            <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
              {[["+5% Make Percentage", "Achieved May 11, 2025", "62.5%", "done"],
                ["3 Sessions Logged", "Achieved May 11, 2025", "3/3", "done"],
                ["75+ Form Score Average", "In progress", score != null ? String(score) : "—", "active"],
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
                  <span className={`shotiq-numeric text-[15px] ${st === "done" ? "text-[var(--shotiq-color-confirmGreen)]" : st === "active" ? "text-[var(--shotiq-color-shotiqOrange)]" : ""}`}>{v}</span>
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
                <TrendLine points={[2, 4, 1.6, 3.4]} width={50} height={36} stroke="var(--shotiq-color-shotiqOrange)" dotFill="var(--shotiq-color-shotiqOrange)" />
              </div>
              <ul className="space-y-[8px] text-[12px]">
                {["Focus on the right mechanics", "Track progress with AI analysis", "Stay accountable and improve"].map((t) => (
                  <li key={t} className="flex items-center gap-[8px]">
                    <Check className="h-[13px] w-[13px] text-[var(--shotiq-color-confirmGreen)]" /> {t}
                  </li>
                ))}
              </ul>
            </div>
            <button type="button" className="mt-[12px] flex h-[46px] w-full items-center justify-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
              <TrendLine points={[2, 4, 3, 5]} width={26} height={16} stroke="#fff" dotFill="#fff" /> Create goal
            </button>
          </Card>
        </div>
      </div>
    </div>
  )
}
