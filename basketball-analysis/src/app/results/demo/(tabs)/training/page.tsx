"use client"

/** /results/demo/training — canonical 090-web-training-hub. */

import React, { useState } from "react"
import Link from "next/link"
import {
  Bookmark, ChevronRight, Check, CalendarCheck,
  Clock, SignalHigh, Waypoints,
} from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat } from "@/components/shotiq/ShotIQShell"
import { CueGlyph, type CueKind } from "@/components/shotiq/Glyphs"
import {
  useHistory, FormScoreCell, formatDelta, formatMakePct, formatShotsMakes, scoreSeries,
} from "@/components/shotiq/ResultsBits"

const RECOMMENDED = [
  { len: "05:28", title: "Footwork Into Release", time: "5:30", level: "Advanced", focus: "Footwork", desc: "Build rhythm from the catch into a balanced, stacked release.", img: "/images/canonical/090-rec-1.png" },
  { len: "06:12", title: "Elbow Stack Holds", time: "6:15", level: "Intermediate", focus: "Shooting", desc: "Train elbow alignment and forearm verticality through the lift.", img: "/images/canonical/090-rec-2.png" },
  { len: "06:58", title: "High Elbow Release", time: "7:02", level: "Advanced", focus: "Shooting", desc: "Reinforce a high elbow path for a clean, consistent release.", img: "/images/canonical/090-rec-3.png" },
]
const LIBRARY: [string, string, string, string, string][] = [
  ["06:38", "Catch & Set Series", "Intermediate", "Shooting", "/images/canonical/090-lib-1.png"],
  ["04:42", "One Dribble Pull-Up", "Beginner", "Scoring", "/images/canonical/090-lib-2.png"],
  ["05:19", "Transition Pull-Up", "Advanced", "Scoring", "/images/canonical/090-lib-3.png"],
  ["06:01", "Sideline Elevation", "Intermediate", "Shooting", "/images/canonical/090-lib-4.png"],
]

/** Canonical fronts each quick action with its own node diagram — none is
 *  repeated, and none is a stock UI icon. */
const QUICK_ACTIONS: [string, string, string, CueKind | "calendar"][] = [
  ["My drills", "View and manage your saved drills.", "/training/drills?tab=saved", "apex"],
  ["Discover", "Find drills that match your goals.", "/training/drills?tab=discover", "peak"],
  ["Calendar", "Plan your week and stay consistent.", "/training/calendar", "calendar"],
]

/** Drill meta line: duration, difficulty, focus area — a mark each. */
function DrillMeta({ time, level, focus, className = "" }: {
  time?: string; level: string; focus: string; className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-[10px] gap-y-[2px] text-[var(--shotiq-color-graphite)] ${className}`}>
      {time && <span className="flex items-center gap-[4px]"><Clock className="h-[12px] w-[12px]" strokeWidth={1.6} />{time}</span>}
      <span className="flex items-center gap-[4px]"><SignalHigh className="h-[12px] w-[12px]" strokeWidth={1.6} />{level}</span>
      <span className="flex items-center gap-[4px]"><Waypoints className="h-[12px] w-[12px]" strokeWidth={1.6} />{focus}</span>
    </div>
  )
}
const WEEK: [string, string, boolean][] = [
  ["MON", "28 min", true], ["TUE", "30 min", false], ["WED", "25 min", false], ["THU", "35 min", false],
  ["FRI", "Rest", false], ["SAT", "40 min", false], ["SUN", "Rest", false],
]

export default function TrainingHubPage() {
  const { hasData, items, score, shots, makes, delta } = useHistory()
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  // The three most recent sessions, dated by the one shared formatter and
  // carrying their real shot counts; these used to be written into the markup.
  const recent = items.length
    ? items.slice(0, 3).map((a) => [
        a.title, `${a.when} · ${a.style}`,
        a.score != null ? String(a.score) : "—",
        formatMakePct(a.shots, a.makes), formatShotsMakes(a.shots, a.makes),
      ] as [string, string, string, string, string])
    : ([["Pull-Up Jumper", "May 12, 2025 • 8:24 AM · Catch & Shoot", "82", "62.5%", "24 / 15"],
        ["Spot-Up Three", "May 11, 2025 • 6:15 PM · Catch & Shoot", "78", "58.3%", "12 / 7"],
        ["Transition Pull-Up", "May 10, 2025 • 4:02 PM · Off the Dribble", "75", "54.5%", "11 / 6"]] as [string, string, string, string, string][])
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set([...RECOMMENDED.map((r) => r.title), ...LIBRARY.map(([, t]) => t)]))
  const toggleSave = (t: string) =>
    setSaved((s) => { const n = new Set(s); if (n.has(t)) n.delete(t); else n.add(t); return n })
  return (
    <div data-testid="screen-desktop-web-training-hub" className="flex gap-[20px]">
      <div className="min-w-0 flex-1">
        <h1 className="shotiq-display text-[48px] leading-[50px]">TRAINING HUB</h1>
        <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
          Turn your analysis into better reps. Targeted drills. Smarter workouts. Real progress.
        </p>

        <div className="mt-[14px] grid grid-cols-4 gap-[12px]">
          <Link href="/training/drills/quick-start" className="flex items-center gap-[10px] rounded-[8px] bg-[var(--shotiq-color-shotiqOrange)] p-[14px] text-white">
            <CueGlyph kind="shoulders" size={26} accent="#FFFFFF" className="shrink-0" />
            <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold">Quick start</div>
              <div className="text-[11px] opacity-90">Get a personalized workout in under 60 seconds.</div></div>
            <ChevronRight className="h-[16px] w-[16px] shrink-0" />
          </Link>
          {QUICK_ACTIONS.map(([t, d, href, mark]) => (
            <Link key={t} href={href}
                  className="flex items-center gap-[10px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[14px] hover:border-[var(--shotiq-color-graphite)]">
              {mark === "calendar"
                ? <CalendarCheck className="h-[24px] w-[24px] shrink-0" strokeWidth={1.5} />
                : <CueGlyph kind={mark} size={26} accent="var(--shotiq-color-shotiqOrange)" className="shrink-0" />}
              <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold">{t}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div></div>
              <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </Link>
          ))}
        </div>

        <div className="mt-[18px] flex items-center justify-between">
          <div>
            <SectionLabel>RECOMMENDED FOR YOUR GOAL</SectionLabel>
            <div className="text-[12px]">Based on <span className="font-semibold text-[var(--shotiq-color-confirmGreen)]">Keep elbow stacked through release</span></div>
          </div>
          <Link href="/training/drills?tab=recommended" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all recommendations ›</Link>
        </div>
        <div className="mt-[10px] grid grid-cols-3 gap-[14px]">
          {RECOMMENDED.map((r) => (
            <Card key={r.title} className="overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.img} alt="" className="h-[150px] w-full object-cover" />
                <button type="button" aria-pressed={saved.has(r.title)} onClick={() => toggleSave(r.title)}
                        aria-label={saved.has(r.title) ? "Remove from my drills" : "Save drill"}
                        className="absolute right-[6px] top-[6px] grid h-[24px] w-[24px] place-items-center rounded-[4px] bg-black/40">
                  <Bookmark className="h-[14px] w-[14px] text-white" fill={saved.has(r.title) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-[12px]">
                <div className="text-[15px] font-semibold">{r.title}</div>
                <DrillMeta time={r.time} level={r.level} focus={r.focus} className="mt-[3px] text-[11px]" />
                <p className="mt-[6px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{r.desc}</p>
                <Link href={`/training/drills/${slug(r.title)}`}
                      className="mt-[10px] flex h-[36px] items-center justify-center rounded-[5px] border-2 border-[var(--shotiq-color-shotiqOrange)] text-[13px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Start drill
                </Link>
              </div>
            </Card>
          ))}
        </div>
        {/* Canonical prints the carousel position under the recommended row. */}
        <div className="mt-[8px] flex justify-center gap-[6px]" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i}
                  className={`h-[6px] w-[6px] rounded-full ${i === 0 ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-rule)]"}`} />
          ))}
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          <SectionLabel>SAVED LIBRARY</SectionLabel>
          <Link href="/training/drills?tab=saved" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all drills ›</Link>
        </div>
        <div className="mt-[8px] grid grid-cols-4 gap-[12px]">
          {LIBRARY.map(([, t, level, focus, img]) => (
            <Link key={t} href={`/training/drills/${slug(t)}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="" className="h-[113px] w-full object-cover" />
                  <button type="button" aria-pressed={saved.has(t)}
                          aria-label={saved.has(t) ? "Remove from my drills" : "Save drill"}
                          onClick={(e) => { e.preventDefault(); toggleSave(t) }}
                          className="absolute right-[6px] top-[6px] grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-black/40">
                    <Bookmark className="h-[12px] w-[12px] text-white" fill={saved.has(t) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="p-[10px]">
                  <div className="text-[13px] font-semibold">{t}</div>
                  <DrillMeta level={level} focus={focus} className="mt-[2px] text-[10px]" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* right rail */}
      <aside className="w-[368px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[18px]">
        {/* Coaching target and form score used to live in this screen's bespoke
            left sidebar. Navigation is now uniform app-wide, so they moved here
            rather than being dropped — compact, so the rail still fits the fold. */}
        <div className="flex items-start justify-between gap-[10px]">
          <SectionLabel className="text-[var(--shotiq-color-graphite)]">COACHING TARGET</SectionLabel>
          {/* The one shared form-score module rather than a hand-set numeral +
              verdict pair (see FormScoreCell). */}
          <FormScoreCell score={score} size={22} label="FORM" caption={null} className="shrink-0" />
        </div>
        <Link href="/results/demo/goals" className="mt-[4px] flex items-center justify-between gap-[6px]">
          <span className="truncate text-[14px] font-semibold leading-[18px]">Keep elbow stacked through release</span>
          <ChevronRight className="h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
        </Link>
        <div className="mt-[6px] flex items-center gap-[8px]">
          <span className="shrink-0 rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[6px] py-[1px] text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">
            ACTIVE GOAL
          </span>
          <span className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">Improve release consistency</span>
          <span className="ml-auto shrink-0 text-[13px] font-semibold">72%</span>
        </div>
        <div className="mt-[4px] h-[5px] rounded-full bg-[var(--shotiq-color-rule)]">
          <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
        </div>

        <div className="mt-[12px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[10px]">
          <SectionLabel>TODAY&apos;S SNAPSHOT</SectionLabel>
          <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Today</span>
        </div>
        {/* Hairline-divided and evenly distributed, as canonical sets it. */}
        <div className="mt-[8px] flex divide-x divide-[var(--shotiq-color-rule)]">
          {([[shots ?? "—", "SHOTS"], [makes ?? "—", "MAKES"],
             [formatMakePct(shots, makes), "MAKE %"]] as const).map(([v, l], i) => (
            <div key={l} className={`min-w-0 flex-1 ${i === 0 ? "pr-[8px]" : "px-[8px]"}`}>
              <Stat value={hasData ? v : i === 2 ? "—" : "0"} label={l} />
            </div>
          ))}
          <div className="w-[124px] shrink-0 pl-[8px] text-center">
            <TrendLine points={scoreSeries(items, 5).length >= 2 ? scoreSeries(items, 5) : [3, 2.6, 3.5, 3, 4.3]} width={84} height={32} />
            {/* Shared computed delta, not a hand-written +8.1%. */}
            <div className={`text-[10px] ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>{hasData ? `${formatDelta(delta)} vs last session` : ""}</div>
          </div>
        </div>

        <SectionLabel className="mt-[12px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">UP NEXT</SectionLabel>
        <Card className="mt-[8px] p-[12px]">
          <Link href="/training/drills/quick-start-workout" className="flex items-center gap-[12px]">
            <TrendLine points={[2, 4, 3, 5]} width={44} height={30} stroke="var(--shotiq-color-shotiqOrange)" dotFill="var(--shotiq-color-shotiqOrange)" />
            <div className="flex-1">
              <div className="text-[14px] font-semibold">Quick Start Workout</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">28 min · 6 drills · Focus: Release consistency</div>
            </div>
            <ChevronRight className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
          </Link>
          <Link href="/training/drills/quick-start-workout"
                className="mt-[10px] flex h-[38px] items-center justify-center rounded-[99px] bg-[var(--shotiq-color-shotiqOrange)] text-[13px] font-medium text-white">
            Open workout
          </Link>
        </Card>

        <div className="mt-[12px] flex items-center justify-between">
          <SectionLabel>THIS WEEK&apos;S PLAN</SectionLabel>
          <Link href="/training/calendar" className="text-[11px] text-[var(--shotiq-color-analysisBlue)]">View calendar</Link>
        </div>
        <Card className="mt-[8px] p-[10px]">
          <div className="flex gap-[4px]">
            {WEEK.map(([d, len, active]) => (
              <Link key={d} href="/training/calendar"
                    className={`min-w-0 flex-1 rounded-[5px] border p-[4px] text-center ${active ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                <div className="text-[9px] font-bold">{d}</div>
                <TrendLine points={[2, 3, 2.4, 3.6]} width={24} height={17}
                           stroke={len === "Rest" ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"} dotFill={len === "Rest" ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"} />
                <div className="text-[8px] text-[var(--shotiq-color-graphite)]">{len}</div>
              </Link>
            ))}
          </div>
          <div className="mt-[10px] flex items-center gap-[8px] border-t border-[var(--shotiq-color-rule)] pt-[8px]">
            <Check className="h-[14px] w-[14px] text-[var(--shotiq-color-confirmGreen)]" />
            <span className="flex-1 text-[11px]">2 of 5 sessions completed</span>
            <div className="h-[5px] w-[90px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full w-[40%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
            </div>
            <span className="text-[11px]">40%</span>
          </div>
        </Card>

        <div className="mt-[12px] flex items-center justify-between">
          <SectionLabel>RECENT PERFORMANCE</SectionLabel>
          <Link href="/results/demo/history" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        {/* The rail is too narrow to seat the identity and three metric columns
            on one line, so the metrics restack under the title rather than
            shrinking their labels to 6px and truncating them. */}
        <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
          {(recent as readonly (readonly [string, string, string, string, string])[]).map(([t, d, fs, mk, sm]) => (
            <Link key={t} href="/results/demo/history" className="block py-[7px] hover:bg-[var(--shotiq-color-warmCanvas)]">
              <div className="flex items-center gap-[8px]">
                <TrendLine points={[2, 3.4, 2.6, 4]} width={30} height={26} stroke="var(--shotiq-color-shotiqOrange)" dotFill="var(--shotiq-color-shotiqOrange)" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold">{t}</div>
                  <div className="truncate text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div>
                </div>
                <ChevronRight className="h-[14px] w-[14px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </div>
              <div className="mt-[4px] grid grid-cols-3 divide-x divide-[var(--shotiq-color-rule)]">
                <div className="pr-[10px]">
                  <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                  <div className="flex items-baseline gap-[5px]">
                    <span className="shotiq-numeric text-[18px] leading-[20px]">{hasData ? fs : "—"}</span>
                    <span className="text-[10px] text-[var(--shotiq-color-analysisBlue)]">● Good</span>
                  </div>
                </div>
                <div className="px-[10px]">
                  <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
                  <div className="shotiq-numeric text-[18px] leading-[20px]">{hasData ? mk : "—"}</div>
                </div>
                <div className="pl-[10px]">
                  <div className="whitespace-nowrap text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SHOTS / MAKES</div>
                  <div className="shotiq-numeric text-[18px] leading-[20px]">{hasData ? sm : "—"}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </aside>
    </div>
  )
}
