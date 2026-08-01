"use client"

/** /results/demo/training — canonical 090-web-training-hub. */

import React, { useState } from "react"
import Link from "next/link"
import { Bookmark, ChevronRight, Check } from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat } from "@/components/shotiq/ShotIQShell"
import { useHistory } from "@/components/shotiq/ResultsBits"

const RECOMMENDED = [
  { len: "05:28", title: "Footwork Into Release", meta: "5:30 · Advanced · Footwork", desc: "Build rhythm from the catch into a balanced, stacked release.", img: "/images/canonical/090-rec-1.png" },
  { len: "06:12", title: "Elbow Stack Holds", meta: "6:15 · Intermediate · Shooting", desc: "Train elbow alignment and forearm verticality through the lift.", img: "/images/canonical/090-rec-2.png" },
  { len: "06:58", title: "High Elbow Release", meta: "7:02 · Advanced · Shooting", desc: "Reinforce a high elbow path for a clean, consistent release.", img: "/images/canonical/090-rec-3.png" },
]
const LIBRARY = [
  ["06:38", "Catch & Set Series", "Intermediate · Shooting", "/images/canonical/090-lib-1.png"],
  ["04:42", "One Dribble Pull-Up", "Beginner · Scoring", "/images/canonical/090-lib-2.png"],
  ["05:19", "Transition Pull-Up", "Advanced · Scoring", "/images/canonical/090-lib-3.png"],
  ["06:01", "Sideline Elevation", "Intermediate · Shooting", "/images/canonical/090-lib-4.png"],
]
const WEEK: [string, string, boolean][] = [
  ["MON", "28 min", true], ["TUE", "30 min", false], ["WED", "25 min", false], ["THU", "35 min", false],
  ["FRI", "Rest", false], ["SAT", "40 min", false], ["SUN", "Rest", false],
]

export default function TrainingHubPage() {
  const { hasData } = useHistory()
  const slug = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  const [saved, setSaved] = useState<Set<string>>(
    () => new Set([...RECOMMENDED.map((r) => r.title), ...LIBRARY.map(([, t]) => String(t))]))
  const toggleSave = (t: string) =>
    setSaved((s) => { const n = new Set(s); n.has(t) ? n.delete(t) : n.add(t); return n })
  return (
    <div data-testid="screen-desktop-web-training-hub" className="flex gap-[20px]">
      <div className="min-w-0 flex-1">
        <h1 className="shotiq-display text-[48px] leading-[50px]">TRAINING HUB</h1>
        <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
          Turn your analysis into better reps. Targeted drills. Smarter workouts. Real progress.
        </p>

        <div className="mt-[14px] grid grid-cols-4 gap-[12px]">
          <Link href="/training/drills/quick-start" className="flex items-center gap-[12px] rounded-[8px] bg-[var(--shotiq-color-shotiqOrange)] p-[14px] text-white">
            <div className="flex-1"><div className="text-[15px] font-semibold">Quick start</div>
              <div className="text-[11px] opacity-90">Get a personalized workout in under 60 seconds.</div></div>
            <ChevronRight className="h-[16px] w-[16px]" />
          </Link>
          {[["My drills", "View and manage your saved drills.", "/training/drills?tab=saved"],
            ["Discover", "Find drills that match your goals.", "/training/drills?tab=discover"],
            ["Calendar", "Plan your week and stay consistent.", "/training/calendar"]].map(([t, d, href]) => (
            <Link key={String(t)} href={String(href)}
                  className="flex items-center gap-[12px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-[14px] hover:border-[var(--shotiq-color-graphite)]">
              <div className="flex-1"><div className="text-[15px] font-semibold">{t}</div>
                <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div></div>
              <ChevronRight className="h-[16px] w-[16px] text-[var(--shotiq-color-graphite)]" />
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
                <span className="absolute left-[8px] top-[8px] rounded-[3px] bg-black/75 px-[6px] py-[2px] text-[10px] font-bold text-white">{r.len}</span>
                <button type="button" aria-pressed={saved.has(r.title)} onClick={() => toggleSave(r.title)}
                        aria-label={saved.has(r.title) ? "Remove from my drills" : "Save drill"}
                        className="absolute right-[6px] top-[6px] grid h-[24px] w-[24px] place-items-center rounded-[4px] bg-black/40">
                  <Bookmark className="h-[14px] w-[14px] text-white" fill={saved.has(r.title) ? "currentColor" : "none"} />
                </button>
              </div>
              <div className="p-[12px]">
                <div className="text-[15px] font-semibold">{r.title}</div>
                <div className="mt-[2px] text-[11px] text-[var(--shotiq-color-graphite)]">{r.meta}</div>
                <p className="mt-[6px] text-[12px] leading-[16px] text-[var(--shotiq-color-graphite)]">{r.desc}</p>
                <Link href={`/training/drills/${slug(r.title)}`}
                      className="mt-[10px] flex h-[36px] items-center justify-center rounded-[5px] border-2 border-[var(--shotiq-color-shotiqOrange)] text-[13px] font-medium text-[var(--shotiq-color-shotiqOrange)]">
                  Start drill
                </Link>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-[16px] flex items-center justify-between">
          <SectionLabel>SAVED LIBRARY</SectionLabel>
          <Link href="/training/drills?tab=saved" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View all drills ›</Link>
        </div>
        <div className="mt-[8px] grid grid-cols-4 gap-[12px]">
          {LIBRARY.map(([len, t, meta, img]) => (
            <Link key={String(t)} href={`/training/drills/${slug(String(t))}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={String(img)} alt="" className="h-[110px] w-full object-cover" />
                  <span className="absolute left-[8px] top-[8px] rounded-[3px] bg-black/75 px-[5px] py-[1px] text-[9px] font-bold text-white">{len}</span>
                  <button type="button" aria-pressed={saved.has(String(t))}
                          aria-label={saved.has(String(t)) ? "Remove from my drills" : "Save drill"}
                          onClick={(e) => { e.preventDefault(); toggleSave(String(t)) }}
                          className="absolute right-[6px] top-[6px] grid h-[22px] w-[22px] place-items-center rounded-[4px] bg-black/40">
                    <Bookmark className="h-[12px] w-[12px] text-white" fill={saved.has(String(t)) ? "currentColor" : "none"} />
                  </button>
                </div>
                <div className="p-[10px]">
                  <div className="text-[13px] font-semibold">{t}</div>
                  <div className="text-[10px] text-[var(--shotiq-color-graphite)]">{meta}</div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* right rail */}
      <aside className="w-[340px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[18px]">
        <div className="flex items-center justify-between">
          <SectionLabel>TODAY&apos;S SNAPSHOT</SectionLabel>
          <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Today</span>
        </div>
        <div className="mt-[8px] flex items-center gap-[20px]">
          <Stat value={hasData ? "24" : "0"} label="SHOTS" />
          <Stat value={hasData ? "15" : "0"} label="MAKES" />
          <Stat value={hasData ? "62.5%" : "—"} label="MAKE %" />
          <div className="ml-auto text-right">
            <TrendLine points={[3, 2.6, 3.5, 3, 4.3]} width={86} height={32} />
            <div className="text-[10px] text-[var(--shotiq-color-confirmGreen)]">{hasData ? "+8.1% vs last session" : ""}</div>
          </div>
        </div>

        <SectionLabel className="mt-[18px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">UP NEXT</SectionLabel>
        <Card className="mt-[8px] p-[14px]">
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

        <div className="mt-[16px] flex items-center justify-between">
          <SectionLabel>THIS WEEK&apos;S PLAN</SectionLabel>
          <Link href="/training/calendar" className="text-[11px] text-[var(--shotiq-color-analysisBlue)]">View calendar</Link>
        </div>
        <Card className="mt-[8px] p-[12px]">
          <div className="flex gap-[6px]">
            {WEEK.map(([d, len, active]) => (
              <Link key={d} href="/training/calendar"
                    className={`flex-1 rounded-[5px] border p-[6px] text-center ${active ? "border-2 border-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
                <div className="text-[9px] font-bold">{d}</div>
                <TrendLine points={[2, 3, 2.4, 3.6]} width={30} height={18}
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

        <div className="mt-[16px] flex items-center justify-between">
          <SectionLabel>RECENT PERFORMANCE</SectionLabel>
          <Link href="/results/demo/history" className="text-[11px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
          {[["Pull-Up Jumper", "Today at 8:24 AM · Catch & Shoot", "82", "62.5%", "24 / 15"],
            ["Spot-Up Three", "May 11, 6:15 PM · Catch & Shoot", "78", "58.3%", "12 / 7"],
            ["Transition Pull-Up", "May 10, 4:02 PM · Off the Dribble", "75", "54.5%", "11 / 6"]].map(([t, d, fs, mk, sm]) => (
            <Link key={String(t)} href="/results/demo/history" className="flex items-center gap-[10px] py-[9px] hover:bg-[var(--shotiq-color-warmCanvas)]">
              <TrendLine points={[2, 3.4, 2.6, 4]} width={38} height={26} stroke="var(--shotiq-color-shotiqOrange)" dotFill="var(--shotiq-color-shotiqOrange)" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold">{t}</div>
                <div className="truncate text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
              </div>
              <Stat value={hasData ? String(fs) : "—"} label="FORM" valueClass="text-[17px] leading-[19px]" />
              <Stat value={hasData ? String(mk) : "—"} label="MAKE %" valueClass="text-[17px] leading-[19px]" />
              <Stat value={hasData ? String(sm) : "—"} label="S / M" valueClass="text-[17px] leading-[19px]" />
            </Link>
          ))}
        </div>
      </aside>
    </div>
  )
}
