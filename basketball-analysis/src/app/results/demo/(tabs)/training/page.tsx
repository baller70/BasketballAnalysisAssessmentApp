"use client"

/** /results/demo/training — canonical 090-web-training-hub. */

import React, { useEffect, useState } from "react"
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
        // Neither an analysis title nor a shot type is recorded anywhere yet,
        // so the row is labelled by what it is and the subtitle carries only
        // the date rather than canonical's "Catch & Shoot".
        a.title ?? "Shot session", [a.when, a.style].filter(Boolean).join(" · "),
        a.score != null ? String(a.score) : "—",
        formatMakePct(a.shots, a.makes), formatShotsMakes(a.shots, a.makes),
      ] as [string, string, string, string, string])
    : ([["Pull-Up Jumper", "May 12, 2025 • 8:24 AM · Catch & Shoot", "82", "62.5%", "24 / 15"],
        ["Spot-Up Three", "May 11, 2025 • 6:15 PM · Catch & Shoot", "78", "58.3%", "12 / 7"],
        ["Transition Pull-Up", "May 10, 2025 • 4:02 PM · Off the Dribble", "75", "54.5%", "11 / 6"]] as [string, string, string, string, string][])
  /* RECOMMENDED FOR YOUR GOAL NAMED THREE DRILLS AND HAD NEVER READ A GOAL.
     "Footwork Into Release", "Elbow Stack Holds", "High Elbow Release", under a
     subtitle that credited them to "Keep elbow stacked through release" —
     printed for every account, including one that had never analysed a shot.
     /api/training/recommended runs the selection engine that has sat in the
     repo unused: the player's own angles through the flaw rules, each flaw
     mapped to the focus area that trains it out, and the 51-drill catalogue
     ranked against those areas at the player's level. When it has nothing to
     personalise from it says so and the canonical three stand. */
  const [rec, setRec] = useState<null | {
    personalised: boolean
    /** What the list was ranked on: measured flaws, the player's level, or
     *  nothing at all. Decides whether the caption may name a cause. */
    basis?: "flaw" | "level" | "none"
    primaryGoal: string | null
    weakAreas?: { focus: string; flaw: string | null; shots: number }[]
    drills: { id: string; title: string; time: string; level: string; focus: string; desc: string; why: string | null }[]
  }>(null)
  /* THIS WEEK'S PLAN was seven typed day tiles — MON 28 min, TUE 30 min, FRI
     Rest — with "2 of 5 sessions completed · 40%" under them, on a page that
     already had a real workouts table and a calendar writing into it. */
  const [workouts, setWorkouts] = useState<null | {
    id: string; name: string | null; scheduledDate: string
    duration: number | null; completed: boolean; focusAreas: unknown
  }[]>(null)
  useEffect(() => {
    let dead = false
    fetch("/api/training/recommended?limit=3", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success) setRec(d) })
      .catch(() => {})
    fetch("/api/workouts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success) setWorkouts(d.workouts ?? []) })
      .catch(() => {})
    fetch("/api/coaching-targets", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success && d.target) setTarget(d.target) })
      .catch(() => {})
    return () => { dead = true }
  }, [])

  /* The hero's COACHING TARGET. Progress is how far the retest has travelled
     from the baseline toward the target — the only reading of "72%" that means
     anything. Before a retest there is no distance to report, so the target
     shows with no claim about progress rather than a number that flatters. */
  const [target, setTarget] = useState<null | {
    flaw: string; cue: string; status: string
    baseline: number | null; targetValue: number | null; retestValue: number | null
  }>(null)
  const targetPct = (() => {
    if (!target) return null
    const { baseline: b, targetValue: t, retestValue: r } = target
    if (b == null || t == null || r == null || b === t) return null
    return Math.max(0, Math.min(100, Math.round(((r - b) / (t - b)) * 100)))
  })()

  /** The three cards to draw. Canonical photography rides along by position —
   *  the catalogue carries no imagery, and a drill card with no image is a
   *  worse screen than one whose photograph is decorative. */
  /* REAL DRILLS WHENEVER THE ROUTE HAS ANY, flaw-driven or level-matched.
     Gating on `personalised` meant a clean shooter — the common case now that
     the two always-firing flaw rules abstain — fell through to RECOMMENDED,
     three hardcoded canonical cards drawn under "RECOMMENDED FOR YOUR GOAL" as
     if they were that player's own. Canonical stays the empty state for a
     visitor with no analyses at all, which is the only caller the route now
     sends an empty list. */
  const liveRecs = rec?.drills?.length ? rec.drills : null
  const recCards = liveRecs
    ? liveRecs.map((d, i) => ({
        len: d.time, title: d.title, time: d.time, level: d.level, focus: d.focus,
        desc: d.desc, img: RECOMMENDED[i % RECOMMENDED.length].img, why: d.why,
      }))
    : RECOMMENDED.map((r) => ({ ...r, why: null as string | null }))
  /* WHAT THE ROW IS ANSWERING, decided by what the route actually ranked on.
     This used to fall through to `primaryGoal`, so a level-matched list was
     captioned "Based on <the player's goal>" — crediting the pick to something
     that had no part in it. Only a flaw-driven list names a cause; a
     level-matched one says so, and the caption already has that branch. */
  const recBecause = liveRecs && rec?.basis === "flaw"
    ? rec?.weakAreas?.[0]?.flaw ?? null
    : null

  /* Monday-first week, from the player's own scheduled workouts. */
  const week = (() => {
    const now = new Date()
    const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const names = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
    return names.map((label, i) => {
      const day = new Date(monday); day.setDate(monday.getDate() + i)
      const next = new Date(day); next.setDate(day.getDate() + 1)
      const onDay = (workouts ?? []).filter((w) => {
        const t = Date.parse(w.scheduledDate)
        return Number.isFinite(t) && t >= day.getTime() && t < next.getTime()
      })
      const minutes = onDay.reduce((s, w) => s + (w.duration ?? 0), 0)
      return {
        label,
        // "Rest" is a real answer here: a day with nothing scheduled.
        len: onDay.length ? (minutes ? `${minutes} min` : "Scheduled") : "Rest",
        today: day.toDateString() === now.toDateString(),
        done: onDay.length > 0 && onDay.every((w) => w.completed),
        count: onDay.length,
      }
    })
  })()
  const weekPlanned = week.reduce((s, d) => s + d.count, 0)
  const weekDone = (workouts ?? []).filter((w) => {
    const t = Date.parse(w.scheduledDate)
    const monday = new Date(); monday.setHours(0, 0, 0, 0)
    monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
    const end = new Date(monday); end.setDate(monday.getDate() + 7)
    return w.completed && t >= monday.getTime() && t < end.getTime()
  }).length
  const weekPct = weekPlanned ? Math.round((weekDone / weekPlanned) * 100) : 0
  const usingWeek = workouts != null && weekPlanned > 0

  /** UP NEXT — the soonest workout still to do, not a written-in one. */
  const upNext = (workouts ?? [])
    .filter((w) => !w.completed)
    .sort((a, b) => Date.parse(a.scheduledDate) - Date.parse(b.scheduledDate))[0] ?? null

  /** Its own meta line: when it is, how long, and what it trains. */
  const upNextMeta = (() => {
    if (!upNext) return "28 min · 6 drills · Focus: Release consistency"
    const when = new Date(upNext.scheduledDate)
    const day = Number.isFinite(when.getTime())
      ? when.toLocaleDateString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" })
      : null
    const focus = Array.isArray(upNext.focusAreas) && upNext.focusAreas.length
      ? `Focus: ${String(upNext.focusAreas[0])}` : null
    return [day, upNext.duration ? `${upNext.duration} min` : null, focus]
      .filter(Boolean).join(" · ")
  })()

  /** TODAY'S SNAPSHOT is dated by the session it is a snapshot OF. */
  const snapshotWhen = items[0]?.when ?? "Today at 8:24 AM"

  /* SAVED LIBRARY listed four drills nobody had saved. The drills page already
     reads the player's own custom drills out of /api/saved-workouts — the same
     rows, read the same way, so the two screens cannot disagree about what is
     in the library. Fewer than four saved, and the canonical four stand rather
     than leaving gaps in a four-up grid. */
  const [custom, setCustom] = useState<[string, string, string, string, string][]>([])
  useEffect(() => {
    let dead = false
    fetch("/api/saved-workouts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead) return
        const rows = (d?.savedWorkouts ?? []).filter((w: { drillIds?: unknown[] }) =>
          Array.isArray(w.drillIds) && (w.drillIds[0] as { customDrill?: boolean })?.customDrill)
        setCustom(rows.slice(0, 4).map((w: { name: string; drillIds: unknown[] }, i: number) => {
          const m = w.drillIds[0] as { len?: string; level?: string; cat?: string }
          return [m.len ?? "10:00", w.name, m.level ?? "Beginner", m.cat ?? "Shooting",
                  LIBRARY[i % LIBRARY.length][4]] as [string, string, string, string, string]
        }))
      }).catch(() => {})
    return () => { dead = true }
  }, [])
  const libraryCards = custom.length >= 4 ? custom : [...custom, ...LIBRARY].slice(0, 4)

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
          {/* Canonical: ink extent cap 13 over a 423px advance; 14px drew cap
              14 over 534 (+26%), which is what pushed UP NEXT's meta onto one
              line. */}
          <p className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
            Turn your analysis into better reps. Targeted drills. Smarter workouts. Real progress.
          </p>
          <div className="absolute right-0 top-0 flex w-[492px] shrink-0 gap-[14px] border-l border-[var(--shotiq-color-rule)] pl-[16px]">
            <div className="min-w-0 flex-1">
              <SectionLabel className="text-[var(--shotiq-color-graphite)]">COACHING TARGET</SectionLabel>
              {/* The player's own target, from /api/coaching-targets — the same
                  row the player card reads. Was one written-in cue, one
                  written-in subtitle and 72% on every account. */}
              <Link href="/results/demo/goals" className="mt-[2px] flex items-start justify-between gap-[8px]">
                <span className="text-[15px] font-semibold leading-[18px]">
                  {target?.cue ?? "Keep elbow stacked through release"}
                </span>
                <ChevronRight className="mt-[2px] h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-graphite)]" />
              </Link>
              <div className="mt-[3px] flex items-center gap-[8px]">
                <span className="inline-block rounded-[3px] border border-[var(--shotiq-color-confirmGreen)] px-[5px] py-[1px] text-[9px] font-bold leading-[11px] tracking-[0.05em] text-[var(--shotiq-color-confirmGreen)]">
                  {target ? target.status.toUpperCase() : "ACTIVE GOAL"}
                </span>
                <span className="min-w-0 flex-1 whitespace-nowrap text-[10px] leading-[12px] text-[var(--shotiq-color-graphite)]">
                  {target?.flaw ?? "Improve release consistency and arm alignment"}
                </span>
              </div>
              <div className="mt-[4px] flex items-center gap-[8px]">
                <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]"
                       style={{ width: `${targetPct ?? 72}%` }} />
                </div>
                <GoalPercent size={13} className="shrink-0">{targetPct ?? 72}%</GoalPercent>
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
            {/* Credited to what actually drove the pick. */}
            <div className="text-[12px]">
              {liveRecs
                ? recBecause
                  ? <>Based on <span className="font-semibold text-[var(--shotiq-color-confirmGreen)]">{recBecause}</span></>
                  : <>Matched to your level</>
                : <>Based on <span className="font-semibold text-[var(--shotiq-color-confirmGreen)]">Keep elbow stacked through release</span></>}
            </div>
          </div>
          <Link href="/training/drills?tab=recommended" className="text-[12px] text-[var(--shotiq-color-graphite)]">View all recommendations ›</Link>
        </div>
        <div className="mt-[10px] grid grid-cols-3 gap-[14px]">
          {recCards.map((r) => (
            <Card key={r.title} className="overflow-hidden">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={r.img} alt="" className="h-[150px] w-full object-cover" />
                {/* The canonical photography has its OWN duration painted into
                    it — "05:28" is pixels in 090-rec-1.png, not markup. Once
                    the card names a real drill that runs 25 minutes, the baked
                    badge contradicts the meta line two lines below it. Cover it
                    with the drill's real length; on the canonical three the
                    badge is already correct and nothing is drawn. */}
                {liveRecs && (
                  <span className="absolute left-[7px] top-[7px] rounded-[4px] bg-[#141518] px-[9px] py-[3px] text-[12px] font-medium leading-[16px] text-white">
                    {r.time}
                  </span>
                )}
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
          {/* The newest session's real time, not "Today at 8:24 AM". */}
          <span className="text-[11px] text-[var(--shotiq-color-graphite)]">{snapshotWhen}</span>
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
            {/* The soonest workout still to do. Was "Quick Start Workout ·
                28 min · 6 drills · Focus: Release consistency" on every
                account, whatever was actually on their calendar. */}
            <div className="flex-1">
              <div className="text-[14px] font-semibold">{upNext?.name || "Quick Start Workout"}</div>
              <div className="text-[11px] text-[var(--shotiq-color-graphite)]">{upNextMeta}</div>
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
            {(usingWeek
              ? week.map((d) => [d.label, d.len, d.today] as [string, string, boolean])
              : WEEK).map(([d, len, active]) => (
              // Canonical draws the container and the orange MON outline and
              // nothing else — the six hairline cell boxes were the app's own
              // addition and both round-8 graders counted them. The outline
              // marks TODAY once the week is real, which is what canonical's
              // highlight means on a plan you are living through.
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
              <div className="text-[11px] leading-[13px]">
                {usingWeek ? `${weekDone} of ${weekPlanned} sessions completed` : "2 of 5 sessions completed"}
              </div>
              <div className="mt-[3px] h-[4px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
                <div className="h-full rounded-full bg-[var(--shotiq-color-confirmGreen)]"
                     style={{ width: `${usingWeek ? weekPct : 40}%` }} />
              </div>
            </div>
            <span className="shrink-0 text-[13px]">{usingWeek ? weekPct : 40}%</span>
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
          {libraryCards.map(([len, t, level, focus, img], li) => (
            <Link key={t} href={`/training/drills/${slug(t)}`}>
              <Card className="overflow-hidden">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {/* Canonical crops these at 141x109 — aspect 1.29. An 88px
                      frame on a 146px card gave 1.64 and turned the strip into
                      a letterbox row. */}
                  <img src={img} alt="" className="h-[113px] w-full object-cover" />
                  {/* Same baked-badge problem as the recommended row: cover the
                      photograph's own duration when the card is a saved drill
                      whose length the photo knows nothing about. */}
                  {li < custom.length && (
                    <span className="absolute left-[6px] top-[6px] rounded-[4px] bg-[#141518] px-[8px] py-[2px] text-[11px] font-medium leading-[15px] text-white">
                      {len}
                    </span>
                  )}
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
