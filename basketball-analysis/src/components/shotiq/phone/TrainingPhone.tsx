"use client"

/**
 * Canonical iOS training-hub family — 054 training home and 055 quick start,
 * plus 059 workout calendar. Round 6 served 054 and 055 from one scroll
 * position of the desktop training hub (055 was literally 054 scrolled), and
 * drew 059's month grid as seven one-character columns.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 054 — identity y 30-47; coaching-target card y 60-96 on warm canvas with the
 *       pose + check mark inset right; "Quick start" 40pt orange; three action
 *       tiles 46pt; SAVED DRILLS list on a 78pt row pitch with a 74x52 photo;
 *       RECENT WORKOUT card 96pt; phase rail.
 * 055 — title cap 30; body 2 lines; photo 118x152 beside a FORM SCORE block
 *       whose numeral caps 46; SHOT RAIL FOCUS; PRIMARY COACHING TARGET;
 *       two WORKOUT TARGETS cards with steppers; orange primary 42pt.
 * 059 — month grid, 7 columns x 6 rows on a 47pt cell; day headers are 3-letter
 *       caps that MUST fit one line at 56pt of column, so they are set at a
 *       7.5px microcap, not the 11px body face that forced "M/O/N";
 *       legend row; a selected-day panel with the workout card.
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import Link from "next/link"
import { ChevronRight, ChevronLeft, Check, Minus, Plus, X } from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, PhoneAction, Eyebrow, PhaseRail, PhoneCard,
  MiniStat, StatCells, Shot, RULE, ORANGE, GREEN, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import {
  StreakGlyph, PointsGlyph, ActionGlyph, CueGlyph, PoseFigure, MechanicGlyph,
} from "@/components/shotiq/Glyphs"

function Identity({ tabTint }: { tabTint?: boolean }) {
  const chrome = usePlayerChrome()

  void tabTint
  return (
    <div className="flex items-start px-[18px] pt-[13px]">
      <div className="min-w-0">
        {/* The phone player-name header, shared by six surfaces (training,
            media, drills, onboarding, drill detail, upload). Its size is set
            from the MEDIAN of the canonical caps it has to serve, because one
            component cannot match all of them: 024 cap 54, 054 cap 52, 058 cap
            51, 055 cap 44 - median 51.5, against the 46 that 30px drew. The
            outliers stay outliers by design; chasing 055 would push the other
            three off. 30 * 51.5/46 = 33.6px. */}
        <div className="shotiq-display text-[33.6px] leading-[35px]">{chrome.name.toUpperCase()}</div>
        <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
      </div>
      <div className="ml-auto flex shrink-0 items-start">
        <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={62} />
        <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={58} />
      </div>
    </div>
  )
}

/* --------------------------------------------------------------- 054 */

export type PhoneDrill = {
  id: string; title: string; note: string; mins: string; focus: string
  level: string; img: string
}

export function TrainingHome({ drills, onQuickStart }: {
  drills: PhoneDrill[]; onQuickStart: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-training-home" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity />

      {/* -------------------------------------------- coaching target */}
      <div className="mx-[18px] mt-[12px] flex items-center gap-[10px] rounded-[6px] px-[13px] py-[11px]"
           style={{ background: "var(--shotiq-color-warmCanvas)" }}>
        <div className="min-w-0 flex-1">
          <Eyebrow>PRIMARY COACHING TARGET</Eyebrow>
          <div className="mt-[6px] text-[17px] font-medium leading-[21px]">Keep elbow stacked<br />through release</div>
        </div>
        <span className="flex shrink-0 items-center gap-[7px]">
          <PoseFigure phase="release" height={44} active />
          <span className="grid h-[20px] w-[20px] place-items-center rounded-full" style={{ border: `1.5px solid ${ORANGE}` }}>
            <Check className="h-[12px] w-[12px]" style={{ color: ORANGE }} strokeWidth={2.6} />
          </span>
        </span>
      </div>

      <div className="px-[18px]">
        <PhoneAction tone="orange" height={40} className="mt-[11px]" onClick={onQuickStart} testid="phone-quick-start">
          <ActionGlyph kind="analyze" height={17} accent="#fff" /> Quick start
        </PhoneAction>

        <div className="mt-[9px] flex gap-[8px]">
          {([["My drills", "/training/drills?tab=saved", "saved"],
             ["Discover", "/training/drills?tab=discover", "apex"],
             ["Calendar", "/training/calendar", "tree"]] as const).map(([l, href, cue]) => (
            <Link key={l} href={href}
                  className="flex min-w-0 flex-1 flex-col items-center rounded-[6px] py-[9px]"
                  style={{ border: `1px solid ${RULE}` }}>
              <CueGlyph kind={cue} size={24} />
              <span className="mt-[6px] text-[10px] leading-[11px]">{l}</span>
            </Link>
          ))}
        </div>

        {/* ------------------------------------------------ saved drills */}
        <div className="mt-[12px] flex items-center">
          <Eyebrow>SAVED DRILLS</Eyebrow>
          <Link href="/training/drills?tab=saved" className="ml-auto flex items-center gap-[4px] text-[9.5px]"
                style={{ color: GRAPHITE }}>
            View all <ChevronRight className="h-[11px] w-[11px]" />
          </Link>
        </div>
        <div className="mt-[8px]">
          {drills.slice(0, 3).map((d) => (
            <Link key={d.id} href={`/training/drills/${d.id}`}
                  className="flex items-stretch gap-[10px] py-[8px]" style={{ borderTop: `1px solid ${RULE}` }}>
              <Shot src={d.img} zoom={1.42} className="h-[56px] w-[70px] shrink-0 rounded-[4px]" />
              <span className="min-w-0 flex-1">
                <span className="block text-[12.5px] font-semibold leading-[15px]">{d.title}</span>
                <span className="mt-[2px] block text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>{d.note}</span>
                <span className="mt-[5px] flex items-center gap-[5px]">
                  {[d.mins, d.focus, d.level].map((c) => (
                    <span key={c} className="rounded-[3px] px-[5px] py-[2px] text-[7.5px] leading-[9px]"
                          style={{ border: `1px solid ${RULE}`, color: GRAPHITE }}>{c}</span>
                  ))}
                </span>
              </span>
              <ChevronRight className="mt-[22px] h-[13px] w-[13px] shrink-0" style={{ color: GRAPHITE }} />
            </Link>
          ))}
        </div>

        {/* --------------------------------------------- recent workout */}
        <div className="mt-[14px] flex items-center">
          <Eyebrow>RECENT WORKOUT</Eyebrow>
          <span className="ml-auto text-[9px]" style={{ color: GRAPHITE }}>Today at 8:24 AM</span>
        </div>
        <PhoneCard className="mt-[8px] flex items-stretch gap-[11px] p-[9px]">
          <Shot src="/images/canonical/090-rec-1.png" zoom={1.4}
                className="h-[84px] w-[96px] shrink-0 rounded-[4px]" />
          <div className="min-w-0 flex-1">
            <div className="text-[12.5px] font-semibold leading-[15px]">Quick Release Builder</div>
            <StatCells className="mt-[7px]" valueSize={15} labelSize={7}
                       cells={[{ v: "24", l: "SHOTS" }, { v: "15", l: "MAKES" }, { v: "62.5%", l: "MAKE %" }]} />
            <div className="mt-[7px] flex items-end gap-[8px]">
              <div className="min-w-0 flex-1">
                <div className="shotiq-microcaps" style={{ fontSize: 7, lineHeight: "8px", color: GRAPHITE }}>FORM SCORE</div>
                <div className="mt-[1px] h-[3px] w-full rounded-full" style={{ background: RULE }}>
                  <div className="h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
                </div>
              </div>
              <span className="shotiq-numeric shrink-0 text-[22px] leading-[20px]" style={{ color: ORANGE }}>82</span>
            </div>
            <div className="mt-[6px] flex items-center gap-[6px]">
              <span className="rounded-[3px] px-[5px] py-[2px] text-[7.5px] leading-[9px]"
                    style={{ border: `1px solid ${GREEN}`, color: GREEN }}>GOOD</span>
              <span className="text-[9px]" style={{ color: GRAPHITE }}>Keep building consistency.</span>
            </div>
          </div>
        </PhoneCard>

        <PhaseRail className="mb-[12px] mt-[11px]" figure={24} label={7} />
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 055 */

function Stepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <span className="flex items-center gap-[7px]">
      {([["−", -1], ["+", 1]] as const).map(([, d]) => (
        <button key={d} type="button" aria-label={d < 0 ? "Decrease" : "Increase"}
                onClick={() => onChange(Math.max(1, value + d))}
                className="grid h-[22px] w-[22px] place-items-center rounded-full"
                style={{ border: `1px solid ${RULE}` }}>
          {d < 0 ? <Minus className="h-[11px] w-[11px]" /> : <Plus className="h-[11px] w-[11px]" />}
        </button>
      ))}
    </span>
  )
}

export function QuickStart({ onStart }: { onStart: () => void }) {
  const [shots, setShots] = React.useState(24)
  const [makes, setMakes] = React.useState(15)
  return (
    <PhoneScreen testid="screen-ios-quick-start" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity />

      <div className="px-[18px]">
        <PhoneHeading size={44} className="mt-[13px]">QUICK START</PhoneHeading>
        <p className="mt-[8px] text-[10.5px] leading-[14px]" style={{ color: GRAPHITE }}>
          Get right to work. We&apos;ve prefilled this workout from{" "}
          <span className="font-semibold" style={{ color: "var(--shotiq-color-ink)" }}>Keep elbow stacked through release.</span>
        </p>

        <div className="mt-[11px] flex items-start gap-[13px]">
          <div className="relative shrink-0">
            <Shot src="/images/canonical/090-rec-2.png" zoom={1.35}
                  className="h-[152px] w-[136px] rounded-[4px]" />
            <span className="absolute right-[6px] top-[26px] rounded-[3px] bg-white px-[5px] py-[2px] text-[9px] font-semibold"
                  style={{ color: ORANGE }}>87°</span>
            <span className="absolute bottom-[34px] left-[6px] rounded-[3px] bg-white px-[5px] py-[2px] text-[9px] font-semibold"
                  style={{ color: ORANGE }}>176°</span>
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>FORM SCORE</Eyebrow>
            <div className="shotiq-numeric mt-[4px] text-[62px] leading-[58px]" style={{ color: ORANGE }}>82</div>
            <div className="mt-[6px] h-[4px] w-full rounded-full" style={{ background: RULE }}>
              <div className="h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
            </div>
            <div className="shotiq-microcaps mt-[8px]" style={{ fontSize: 9, lineHeight: "10px", color: GREEN }}>GOOD</div>
            <p className="mt-[4px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>Keep building consistency.</p>
          </div>
        </div>

        <div className="mt-[14px]">
          <Eyebrow>SHOT RAIL FOCUS</Eyebrow>
          <PhaseRail className="mt-[9px]" figure={30} label={7.5} />
        </div>

        <div className="mt-[14px] flex items-center gap-[10px] pt-[11px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="min-w-0 flex-1">
            <Eyebrow>PRIMARY COACHING TARGET</Eyebrow>
            <div className="mt-[5px] text-[15px] leading-[18px]">Keep elbow stacked through release</div>
          </div>
          <ChevronRight className="h-[15px] w-[15px] shrink-0" style={{ color: GRAPHITE }} />
        </div>

        <Eyebrow className="mt-[14px]">WORKOUT TARGETS</Eyebrow>
        <div className="mt-[8px] flex gap-[9px]">
          {([["SHOT TARGET", shots, "SHOTS", "Recommended 20–30 shots", setShots, "centerline"],
             ["MAKE TARGET", makes, "MAKES", "Recommended 50–65%", setMakes, "impact"]] as const).map(
            ([head, val, unit, note, set, mark]) => (
              <PhoneCard key={head} className="min-w-0 flex-1 px-[10px] py-[10px]">
                <div className="shotiq-microcaps" style={{ fontSize: 7.5, lineHeight: "8px", color: GRAPHITE }}>{head}</div>
                <div className="mt-[5px] flex items-start">
                  <div className="min-w-0">
                    <div className="shotiq-numeric text-[27px] leading-[26px]">{val}</div>
                    <div className="shotiq-microcaps mt-[3px]" style={{ fontSize: 7.5, lineHeight: "8px", color: GRAPHITE }}>{unit}</div>
                  </div>
                  <span className="ml-auto shrink-0"><MechanicGlyph kind={mark} size={34} /></span>
                </div>
                <div className="mt-[7px] flex items-center">
                  <span className="min-w-0 text-[7.5px] leading-[10px]" style={{ color: GRAPHITE }}>{note}</span>
                  <span className="ml-auto shrink-0"><Stepper value={val} onChange={set} /></span>
                </div>
              </PhoneCard>
            ))}
        </div>

        <PhoneAction tone="orange" height={42} className="mb-[16px] mt-[13px]" onClick={onStart}
                     testid="phone-start-shot-tracking">
          <ActionGlyph kind="analyze" height={17} accent="#fff" /> Start shot tracking
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 059 */

type DayState = "done" | "planned" | "active" | "missed" | "none"

const MONTH = "MAY 2025"
/* Canonical's May 2025 grid: the month opens on a Thursday, so the first row
   carries Apr 27-30 as out-of-month days, and the six rows run to Jun 7. */
const CELLS: [number, boolean, DayState, string][] = (() => {
  const out: [number, boolean, DayState, string][] = []
  for (const d of [27, 28, 29, 30]) out.push([d, false, "none", ""])
  const plan: Record<number, [DayState, string]> = {
    1: ["planned", "20 min"], 2: ["planned", "20 min"], 3: ["planned", "20 min"],
    4: ["done", "18 min"], 5: ["done", "17 min"], 6: ["done", "20 min"],
    7: ["active", "In progress"], 8: ["planned", "20 min"], 9: ["done", "15 min"],
    10: ["missed", "Missed"], 11: ["planned", "20 min"], 12: ["done", "17 min"],
    13: ["planned", "20 min"], 14: ["planned", "20 min"], 15: ["done", "15 min"],
    16: ["planned", "20 min"], 17: ["missed", "Missed"], 18: ["done", "18 min"],
    19: ["planned", "20 min"], 20: ["planned", "20 min"], 21: ["planned", "20 min"],
    22: ["planned", "20 min"], 23: ["planned", "20 min"],
    25: ["planned", "20 min"], 26: ["planned", "20 min"], 27: ["planned", "20 min"],
    28: ["planned", "20 min"], 29: ["planned", "20 min"], 30: ["planned", "20 min"],
  }
  for (let d = 1; d <= 31; d++) {
    const [st, note] = plan[d] ?? ["none", ""]
    out.push([d, true, st, note])
  }
  for (let d = 1; d <= 7; d++) out.push([d, false, "none", ""])
  return out
})()

const DAY_TINT: Record<DayState, string> = {
  done: GREEN, planned: RULE, active: ORANGE, missed: "var(--shotiq-color-reviewRed)", none: RULE,
}

/** The month cell. Canonical draws the status as a RING around the date, and
 *  the minutes under it — never a colour fill, which is what a two-line
 *  "2 / 8 m i n" column had degenerated into. */
function DayCell({ day, inMonth, state, note, onPick }: {
  day: number; inMonth: boolean; state: DayState; note: string; onPick: () => void
}) {
  const tint = DAY_TINT[state]
  return (
    <button type="button" onClick={onPick} disabled={!inMonth}
            className="flex h-[46px] min-w-0 flex-col items-center justify-start pt-[3px]">
      <span className="relative grid h-[19px] w-[19px] place-items-center">
        {inMonth && state !== "none" && (
          <span aria-hidden="true" className="absolute inset-0 rounded-full"
                style={{ border: `1.4px solid ${tint}`, background: state === "active" ? tint : "transparent" }} />
        )}
        <span className="shotiq-numeric relative text-[10.5px] leading-[11px]"
              style={{
                color: !inMonth ? "var(--shotiq-color-muted)"
                  : state === "active" ? "#fff" : undefined,
              }}>{day}</span>
      </span>
      {inMonth && state === "done" && (
        <Check className="mt-[1px] h-[8px] w-[8px]" style={{ color: GREEN }} strokeWidth={3} />
      )}
      {inMonth && state === "missed" && (
        <X className="mt-[1px] h-[8px] w-[8px]" style={{ color: DAY_TINT.missed }} strokeWidth={3} />
      )}
      {/* 6.5px is the size at which "20 min" fits a 56pt column on ONE line —
          measured, not chosen: canonical's note run is 41px advance over a
          56pt cell, and the body face draws 6 characters in 40px at 6.5px. */}
      <span className="mt-[1px] whitespace-nowrap text-[6.5px] leading-[7px]"
            style={{ color: state === "missed" ? DAY_TINT.missed : GRAPHITE }}>
        {inMonth ? note : ""}
      </span>
    </button>
  )
}

export function WorkoutCalendar({ onOpen }: { onOpen: () => void }) {
  const [picked, setPicked] = React.useState(7)
  return (
    <PhoneScreen testid="screen-ios-workout-calendar" tab="train" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <Identity />

      <div className="mx-[18px] mt-[11px] flex items-center rounded-[6px] px-[11px] py-[9px]"
           style={{ background: "var(--shotiq-color-warmCanvas)" }}>
        <PoseFigure phase="release" height={30} active />
        <div className="ml-[10px] min-w-0">
          <Eyebrow>PRIMARY TARGET</Eyebrow>
          <div className="mt-[3px] text-[10.5px] leading-[13px]">Keep elbow stacked through release</div>
        </div>
        <div className="ml-auto flex shrink-0">
          {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "FG%"]].map(([v, l]) => (
            <div key={l} className="w-[42px] text-center">
              <div className="shotiq-numeric text-[12px] leading-[13px]">{v}</div>
              <div className="shotiq-microcaps mt-[2px]" style={{ fontSize: 6.5, lineHeight: "7px", color: GRAPHITE }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-[14px]">
        <div className="mt-[12px] flex items-center">
          <button type="button" aria-label="Previous month"><ChevronLeft className="h-[16px] w-[16px]" /></button>
          <PhoneHeading size={26} className="mx-auto">{MONTH}</PhoneHeading>
          <button type="button" aria-label="Next month"><ChevronRight className="h-[16px] w-[16px]" /></button>
        </div>

        {/* A calendar is seven columns on any device. What has to fit is the
            HEADER, so it is set as a microcap at 8px — "SUN" measures 17px of
            advance in a 53px column, against the 11px body face that needed 26
            and broke to "S/U/N". */}
        <div className="mt-[10px] grid grid-cols-7">
          {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((d) => (
            <div key={d} className="shotiq-microcaps whitespace-nowrap text-center"
                 style={{ fontSize: 9, lineHeight: "10px", color: GRAPHITE }}>{d}</div>
          ))}
        </div>
        <div className="mt-[6px] grid grid-cols-7 gap-y-[2px]" data-testid="phone-calendar-grid">
          {CELLS.map(([d, inM, st, note], i) => (
            <DayCell key={i} day={d} inMonth={inM} state={st} note={note}
                     onPick={() => setPicked(d)} />
          ))}
        </div>

        <div className="mt-[10px] flex flex-wrap items-center gap-x-[12px] gap-y-[4px] pt-[9px]"
             style={{ borderTop: `1px solid ${RULE}` }}>
          {([["Completed", GREEN, "ring"], ["Scheduled", RULE, "ring"], ["In progress", ORANGE, "dot"],
             ["Missed", DAY_TINT.missed, "ring"], ["No workout", RULE, "none"]] as const).map(([l, c, shape]) => (
            <span key={l} className="flex items-center gap-[5px] text-[8px]" style={{ color: GRAPHITE }}>
              <span className="h-[10px] w-[10px] rounded-full"
                    style={shape === "dot" ? { background: c } : shape === "ring" ? { border: `1.4px solid ${c}` } : { border: `1px dashed ${RULE}` }} />
              {l}
            </span>
          ))}
        </div>

        {/* ------------------------------------------- selected day panel */}
        <div className="mt-[12px] flex items-center gap-[8px]">
          <span className="shotiq-display text-[13px] leading-[14px]">WEDNESDAY, MAY {picked}</span>
          <span className="rounded-[3px] px-[5px] py-[2px] text-[7.5px] leading-[9px] text-white"
                style={{ background: ORANGE }}>IN PROGRESS</span>
          <ChevronRight className="ml-auto h-[13px] w-[13px] rotate-[-90deg]" style={{ color: GRAPHITE }} />
        </div>
        <PhoneCard className="mt-[8px] flex items-stretch gap-[10px] p-[9px]">
          <Shot src="/images/canonical/090-rec-3.png" zoom={1.4}
                className="h-[98px] w-[104px] shrink-0 rounded-[4px]" />
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[16px] leading-[17px]">COMBO LADDER</div>
            <div className="mt-[3px] text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>Day 4 of 7 • 17 min</div>
            <p className="mt-[5px] text-[9.5px] leading-[12px]">
              Layer catch-and-shoot reps with movement progressions to reinforce release timing and alignment under fatigue.
            </p>
            <PhaseRail className="mt-[7px]" figure={18} label={6} />
          </div>
        </PhoneCard>

        <PhoneAction tone="orange" height={40} className="mb-[16px] mt-[11px]" onClick={onOpen}
                     testid="phone-open-workout">
          <ActionGlyph kind="analyze" height={16} accent="#fff" /> Open workout
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}
