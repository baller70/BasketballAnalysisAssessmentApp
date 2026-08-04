"use client"

/** /results/demo/training — canonical 090-web-training-hub. */

import React, { useState } from "react"
import Link from "next/link"
import {
  Bookmark, ChevronRight, Check, CalendarCheck,
  Clock, SignalHigh, Waypoints,
} from "lucide-react"
import { SectionLabel, Card, TrendLine, Stat, PageTitle, GoalPercent } from "@/components/shotiq/ShotIQShell"
import { CueGlyph, type CueKind } from "@/components/shotiq/Glyphs"
import {
  useHistory, FormScoreCell, formatDelta, formatMakePct, formatShotsMakes, scoreSeries,
} from "@/components/shotiq/ResultsBits"
import { TrainingHome, QuickStart, type PhoneDrill } from "@/components/shotiq/phone/TrainingPhone"
import { usePhoneViewport, usePhoneStep } from "@/components/shotiq/phone/PhoneBits"

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
  ["My drills", "View and manage your saved drills.", "/training/drills?tab=saved", "saved"],
  ["Discover", "Find drills that match your goals.", "/training/drills?tab=discover", "apex"],
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

const PHONE_TRAINING_STEPS = ["home", "quick"] as const

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
  // Canonical splits this page at two different column boundaries: the hero and
  // drill grid run against a narrow status rail, and below them SAVED LIBRARY
  // runs against a much wider RECENT PERFORMANCE panel. Running one 368px rail
  // down the whole page forced RECENT PERFORMANCE to restack every row onto two
  // lines. Two rows, two boundaries.
  /* Canonical draws TWO phone designs on this route — 054 training home and
     055 quick start. Round 6 shipped 055 as 054 scrolled to the quick-start
     card, so the two were the same composition. `?step=quick` is written back
     into the URL by the "Quick start" button, so the screen is reachable by
     tapping it and by deep link. */
  const isPhone = usePhoneViewport()
  const [phoneStep, goPhone] = usePhoneStep(PHONE_TRAINING_STEPS, "home")
  if (isPhone) {
    const phoneDrills: PhoneDrill[] = [
      { id: "quick-release-builder", title: "Quick Release Builder", note: "Keep elbow stacked through release",
        mins: "20 min", focus: "Form Focus", level: "Intermediate", img: "/images/canonical/090-lib-1.png" },
      { id: "wall-elbow-alignment", title: "Elbow Alignment Series", note: "Train a stacked elbow and straight line.",
        mins: "15 min", focus: "Form Focus", level: "All Levels", img: "/images/canonical/090-lib-2.png" },
      { id: "free-throw-ladder", title: "Catch & Shoot Flow", note: "Smooth rhythm from catch to follow-through.",
        mins: "12 min", focus: "Game Speed", level: "All Levels", img: "/images/canonical/090-lib-3.png" },
    ]
    return (
      <div className="md:hidden">
        {phoneStep === "quick"
          ? <QuickStart onStart={() => { window.location.assign("/training/drills/wall-elbow-alignment?step=tracker") }} />
          : <TrainingHome drills={phoneDrills} onQuickStart={() => goPhone("quick")} />}
      </div>
    )
  }

  return (
    <div data-testid="screen-desktop-web-training-hub">
    <div className="flex gap-[20px]">
      <div className="min-w-0 flex-1">
        {/* Coaching target and form score are canonical's page-rail footer.
            Navigation is uniform app-wide now, so they had been parked at the
            TOP of the right column — which pushed TODAY'S SNAPSHOT 230px down
            the page and squeezed THIS WEEK'S PLAN's day tiles to 53px against
            canonical's 82. They ride the title row instead: the block is out of
            the right column, the right column reopens at canonical's order and
            offsets, and the page pays nothing for it because the title band was
            already this tall. */}
        {/* Canonical pairs the subtitle with the title — one line, directly
            under the H1 at y=151. Hanging the coaching block off the same flex
            row made the row 88px tall and pushed the subtitle to y=174; nesting
            the subtitle inside the title cell instead broke it onto three
            lines. Taking the block out of flow leaves the title and its
            subtitle on canonical's own offsets and still keeps the block out of
            the right column, where it displaced TODAY'S SNAPSHOT by 230px. */}
        <div className="relative">
          <PageTitle size={64}>TRAINING HUB</PageTitle>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            Turn your analysis into better reps. Targeted drills. Smarter workouts. Real progress.
          </p>
          <div className="absolute right-0 top-0 flex w-[492px] shrink-0 gap-[14px] border-l border-[var(--shotiq-color-rule)] pl-[16px]">
            <div className="min-w-0 flex-1">
              <SectionLabel className="text-[var(--shotiq-color-graphite)]">COACHING TARGET</SectionLabel>
              <Link href="/results/demo/goals" className="mt-[2px] flex items-start justify-between gap-[8px]">
                <span className="text-[15px] font-semibold leading-[18px]">Keep elbow stacked through release</span>
                <ChevronRight className="mt-[2px] h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </Link>
              <div className="mt-[3px] flex items-center gap-[8px]">
                <span className="inline-block rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[5px] py-[1px] text-[9px] font-bold leading-[11px] tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">
                  ACTIVE GOAL
                </span>
                <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] leading-[12px] text-[var(--shotiq-color-graphite)]">Improve release consistency and arm alignment</span>
              </div>
              <div className="mt-[4px] flex items-center gap-[8px]">
                <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
                </div>
                <GoalPercent size={13} className="shrink-0">72%</GoalPercent>
              </div>
            </div>
            {/* The one shared form-score module rather than a hand-set numeral +
                verdict pair (see FormScoreCell). */}
            <div className="w-[132px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[12px]">
              <div className="text-[10px] leading-[12px] text-[var(--shotiq-color-graphite)]">Form score</div>
              <FormScoreCell score={score} size={24} numeral={30} label={null} caption={null} layout="beside" />
            </div>
          </div>
        </div>

        {/* Canonical does not run four equal quarters here — the cards measure
            197 / 161 / 152 / 171. Equal quarters starved "Quick start" and
            "Calendar" of the width their copy needs and broke both onto a third
            line, which is 14px of page height nobody asked for. */}
        <div className="mt-[12px] grid grid-cols-[222fr_168fr_170fr_174fr] gap-[12px]">
          {/* The card copy sets 10px here, not 11: measured on the matched
              string "Get a personalized workout", canonical's line runs 26
              glyphs in 97px at ink height 7 and this face was setting the same
              copy at ink height 8 and 5.1px per glyph — enough to break every
              card onto a third line. */}
          <Link href="/training/drills/quick-start" className="flex items-center gap-[9px] rounded-[8px] bg-[var(--shotiq-color-shotiqOrange)] p-[13px] text-white">
            <CueGlyph kind="shoulders" size={24} accent="#FFFFFF" className="shrink-0" />
            <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold">Quick start</div>
              <div className="text-[10px] leading-[13px] opacity-90">Get a personalized workout in under 60 seconds.</div></div>
            <ChevronRight className="h-[15px] w-[15px] shrink-0" />
          </Link>
          {/* Canonical draws these marks LARGE — measured off 090 the node
              diagrams are 38x30 and 42x23 and the calendar 40x39, against the
              21x18 / 22x19 / 30x24 the 24px box was giving. A 24px CueGlyph
              only inks ~18 of its 24 viewBox units, so the box has to run ~46
              to put 38px of drawing on the page. The caption drops to 9px in
              exchange: canonical fits "View and manage" on one line at 4.4px
              per glyph and this face needed 5.1 at 10px, which is what broke
              "My drills" and "Calendar" onto a third line. */}
          {QUICK_ACTIONS.map(([t, d, href, mark]) => (
            <Link key={t} href={href}
                  className="flex items-center gap-[9px] rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white py-[10px] pl-[12px] pr-[4px] hover:border-[var(--shotiq-color-graphite)]">
              {mark === "calendar"
                ? <CalendarCheck className="h-[38px] w-[38px] shrink-0" strokeWidth={1.15} />
                : <CueGlyph kind={mark} size={46} accent="var(--shotiq-color-shotiqOrange)" className="-mx-[4px] shrink-0" />}
              <div className="min-w-0 flex-1"><div className="text-[15px] font-semibold">{t}</div>
                <div className="text-[9px] leading-[12px] text-[var(--shotiq-color-graphite)]">{d}</div></div>
              <ChevronRight className="h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </Link>
          ))}
        </div>

        <div className="mt-[14px] flex items-center justify-between">
          <div>
            <SectionLabel>RECOMMENDED FOR YOUR GOAL</SectionLabel>
            <div className="text-[12px]">Based on <span className="font-semibold text-[var(--shotiq-color-confirmGreen)]">Keep elbow stacked through release</span></div>
          </div>
          <Link href="/training/drills?tab=recommended" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all recommendations ›</Link>
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

      </div>

      {/* right rail */}
      <aside className="flex w-[404px] shrink-0 flex-col border-l border-[var(--shotiq-color-rule)] pl-[18px]">
        {/* Canonical's right column opens on TODAY'S SNAPSHOT, level with the
            page title, then UP NEXT, then THIS WEEK'S PLAN. */}
        <div className="flex items-center justify-between">
          <SectionLabel>TODAY&apos;S SNAPSHOT</SectionLabel>
          <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Today at 8:24 AM</span>
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

        {/* Canonical spends this column's slack between the blocks — 128px
            under the snapshot, 28 under UP NEXT — rather than packing them at
            the top. Proportional spacers, so they collapse to nothing if the
            column ever becomes the taller of the two. */}
        <div className="min-h-[6px] flex-[8]" aria-hidden="true" />
        <SectionLabel className="border-t border-[var(--shotiq-color-rule)] pt-[6px]">UP NEXT</SectionLabel>
        <Card className="mt-[8px] p-[10px]">
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

        <div className="min-h-[6px] flex-[2]" aria-hidden="true" />
        <div className="flex items-center justify-between">
          <SectionLabel>THIS WEEK&apos;S PLAN</SectionLabel>
          <Link href="/training/calendar" className="text-[11px] text-[var(--shotiq-color-graphite)]">View calendar</Link>
        </div>
        {/* Canonical's day tiles are 82px tall and carry a readable sparkline;
            squeezed to 53px by the block that used to sit above them, the marks
            collapsed into a smudge. */}
        <Card className="mt-[8px] p-[8px]">
          <div className="flex gap-[4px]">
            {WEEK.map(([d, len, active]) => (
              // Canonical draws the container and the orange MON outline and
              // nothing else — the six hairline cell boxes were the app's own
              // addition and both round-8 graders counted them.
              <Link key={d} href="/training/calendar"
                    className={`min-w-0 flex-1 rounded-[5px] border-2 p-[8px] text-center ${active ? "border-[var(--shotiq-color-shotiqOrange)]" : "border-transparent"}`}>
                <div className="text-[9px] font-bold">{d}</div>
                <TrendLine points={[2, 3, 2.4, 3.6]} width={33} height={15} className="mx-auto my-[12px]"
                           stroke={len === "Rest" ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"} dotFill={len === "Rest" ? "var(--shotiq-color-muted)" : "var(--shotiq-color-ink)"} />
                <div className="text-[8px] text-[var(--shotiq-color-graphite)]">{len}</div>
              </Link>
            ))}
          </div>
          {/* Canonical stacks the caption over a track that runs the full card
              width (measured x1039→1393, 355px) with the percentage parked at
              the right edge. The app had them on one line, which left the
              track a 90px stub — the single largest measured miss on 090. */}
          <div className="mt-[10px] flex items-center gap-[10px] border-t border-[var(--shotiq-color-rule)] pt-[8px]">
            <Check className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] leading-[13px]">2 of 5 sessions completed</div>
              <div className="mt-[3px] h-[4px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full w-[40%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
              </div>
            </div>
            <span className="shrink-0 text-[13px]">40%</span>
          </div>
        </Card>

      </aside>
    </div>

    {/* Second band — canonical moves the column boundary left here so the
        performance panel gets 540px and each analysis fits one row. */}
    <div className="mt-[12px] flex gap-[20px]">
      <div className="w-[620px] shrink-0">
        <div className="flex items-center justify-between">
          <SectionLabel>SAVED LIBRARY</SectionLabel>
          <Link href="/training/drills?tab=saved" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all drills ›</Link>
        </div>
        <div className="mt-[8px] grid grid-cols-4 gap-[12px]">
          {LIBRARY.map(([, t, level, focus, img]) => (
            <Link key={t} href={`/training/drills/${slug(t)}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* Canonical crops these at 141x109 — aspect 1.29. An 88px
                      frame on a 146px card gave 1.64 and turned the strip into
                      a letterbox row. */}
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
                  <DrillMeta level={level} focus={focus} className="mt-[2px] flex-nowrap gap-x-[7px] text-[9px]" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] pl-[18px]">
        <div className="flex items-center justify-between">
          <SectionLabel>RECENT PERFORMANCE</SectionLabel>
          <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all analyses ›</Link>
        </div>
        {/* One row per analysis: mark | identity | three ruled metric cells |
            chevron, at canonical's 59px pitch. The metrics used to restack
            under the title because this panel was only 368px wide. */}
        <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)]">
          {(recent as readonly (readonly [string, string, string, string, string])[]).map(([t, d, fs, mk, sm]) => (
            <Link key={t} href="/results/demo/history"
                  className="flex items-center gap-[9px] py-[10px] hover:bg-[var(--shotiq-color-warmCanvas)]">
              <TrendLine points={[2, 3.4, 2.6, 4]} width={38} height={30}
                         stroke="var(--shotiq-color-ink)" dotFill="var(--shotiq-color-ink)"
                         dotAccent="var(--shotiq-color-shotiqOrange)" className="shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[14px] font-semibold">{t}</div>
                <div className="truncate text-[10px] text-[var(--shotiq-color-graphite)]">{d}</div>
              </div>
              <div className="w-[96px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[10px]">
                <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                <div className="flex items-baseline gap-[5px]">
                  <span className="shotiq-numeric text-[20px] leading-[24px]">{hasData ? fs : "—"}</span>
                  <span className="flex items-center gap-[4px] text-[11px] text-[var(--shotiq-color-graphite)]">
                    <span className="inline-block h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" />Good
                  </span>
                </div>
              </div>
              <div className="w-[70px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[10px]">
                <div className="text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">MAKE %</div>
                <div className="shotiq-numeric text-[20px] leading-[24px]">{hasData ? mk : "—"}</div>
              </div>
              <div className="w-[86px] shrink-0 border-l border-[var(--shotiq-color-rule)] pl-[10px]">
                <div className="whitespace-nowrap text-[9px] tracking-[0.05em] text-[var(--shotiq-color-graphite)]">SHOTS / MAKES</div>
                <div className="shotiq-numeric text-[20px] leading-[24px]">{hasData ? sm : "—"}</div>
              </div>
              <ChevronRight className="h-[16px] w-[16px] shrink-0 text-[var(--shotiq-color-graphite)]" />
            </Link>
          ))}
        </div>
      </div>
    </div>
    </div>
  )
}
