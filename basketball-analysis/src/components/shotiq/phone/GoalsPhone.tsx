"use client"

/**
 * Canonical iOS goals family — 063 goals, 064 create goal, 065 goal detail.
 * Round 6 served all three from `/results/demo/goals`: 063 at the top, 064 as a
 * two-field MODAL where canonical draws a full form page, and 065 as the same
 * page scrolled 560px.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 063 — title cap 30; "Create goal" 42pt orange; ACTIVE / COMPLETED tabs with a
 *       2px orange underline; goal card with a 152x118 photo inset right;
 *       GOAL PROGRESS numeral cap 34; three stat cells; GOAL TREND chart 78pt
 *       with a scored end badge; RECENT SESSIONS row 46pt; tip row; insights.
 * 064 — back / GOALS eyebrow; title cap 28; GOAL NAME 34pt field with a live
 *       counter; DESCRIPTION 62pt; five 62pt CATEGORY tiles; TARGET card 96pt
 *       with the photo; TARGET TYPE 3-way + TARGET number; UNIT 3-way + XP
 *       REWARD; measurement note; Cancel + Create goal 40pt.
 * 065 — title 2 lines cap 27 beside a 128x104 photo; IMPACT card; GOAL PROGRESS
 *       with the 7-session trend; TECHNIQUE SNAPSHOT with the angle slider;
 *       LINKED SESSIONS 4 rows; RECOMMENDED DRILL; MILESTONES 4 chips;
 *       Log progress / Edit goal / Mark complete.
 */

import React from "react"
import {
  ChevronRight, ChevronDown, Check, Plus, Lock, Play, Pencil, X,
} from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, BackChevron, PhoneAction, Eyebrow, PhoneCard,
  MiniStat, StatCells, Shot, RULE, ORANGE, GREEN, BLUE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import {
  StreakGlyph, PointsGlyph, ActionGlyph, CueGlyph, MechanicGlyph, PoseFigure,
} from "@/components/shotiq/Glyphs"

const RED = "var(--shotiq-color-reviewRed)"

/** Data-driven trend plot — the series is drawn, never a decorative curve. */
function Trend({ points, width, height, fill = true, badge }: {
  points: number[]; width: number; height: number; fill?: boolean; badge?: string
}) {
  const max = Math.max(...points), min = Math.min(...points), span = max - min || 1
  const X = (i: number) => 2 + (i * (width - 4)) / Math.max(1, points.length - 1)
  const Y = (v: number) => height - 4 - ((v - min) / span) * (height - 8)
  const d = points.map((v, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="block">
      {fill && <path d={`${d} L${X(points.length - 1)},${height} L${X(0)},${height} Z`} fill={ORANGE} opacity="0.08" />}
      <path d={d} fill="none" stroke={ORANGE} strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="1.9" fill={ORANGE} />)}
      {badge && (
        <>
          <rect x={width - 22} y={Y(points[points.length - 1]) - 8} width="20" height="13" rx="2.5" fill={ORANGE} />
          <text x={width - 12} y={Y(points[points.length - 1]) + 1.5} textAnchor="middle"
                fontSize="8" fill="#fff" fontWeight="600">{badge}</text>
        </>
      )}
    </svg>
  )
}

/* --------------------------------------------------------------- 063 */

const SERIES = [52, 55, 53, 58, 57, 61, 60, 63, 62, 66, 65, 68, 67, 71, 70, 74, 73, 77, 76, 80, 82]

export function GoalsList({ onCreate, onOpen }: { onCreate: () => void; onOpen: () => void }) {
  const [tab, setTab] = React.useState(0)
  return (
    <PhoneScreen testid="screen-ios-goals" tab="progress" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start px-[18px] pt-[13px]">
        <div className="min-w-0">
          {/* canonical 063 cap 55 of the 853px art = 25.3 CSS px, /0.705 =
              35.9px. 42px measured cap 64, 116% of canonical. */}
          <PhoneHeading size={35.9}>GOALS</PhoneHeading>
          <p className="mt-[6px] text-[10px] leading-[13px]" style={{ color: GRAPHITE }}>
            Track progress. Stay consistent. Build better mechanics.
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <MiniStat glyph={<PointsGlyph size={21} />} value="2,840" label="POINTS" w={58} />
        </div>
      </div>

      <div className="px-[18px]">
        <PhoneAction tone="orange" height={42} className="mt-[11px]" onClick={onCreate} testid="phone-create-goal">
          <ActionGlyph kind="nodeClimb" height={17} accent="#fff" /> Create goal
        </PhoneAction>

        <div className="mt-[12px] flex" style={{ borderBottom: `1px solid ${RULE}` }}>
          {["ACTIVE (1)", "COMPLETED (3)"].map((l, i) => (
            <button key={l} type="button" onClick={() => setTab(i)} data-testid={`phone-goal-tab-${i}`}
                    className="shotiq-display min-w-0 flex-1 pb-[8px] text-center text-[12px] leading-[13px]"
                    style={{
                      color: i === tab ? ORANGE : GRAPHITE, marginBottom: -1,
                      borderBottom: `2px solid ${i === tab ? ORANGE : "transparent"}`,
                    }}>{l}</button>
          ))}
        </div>

        {/* --------------------------------------------------- goal card */}
        <button type="button" onClick={onOpen} data-testid="phone-goal-open"
                className="mt-[11px] flex w-full items-start gap-[11px] text-left">
          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-[3px] px-[6px] py-[3px] text-[7.5px] leading-[9px]"
                  style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>PRIMARY TARGET</span>
            <div className="mt-[7px] shotiq-display text-[19px] leading-[21px]">Keep elbow stacked<br />through release</div>
            <p className="mt-[7px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
              Improve alignment and control by maintaining a vertical elbow path to the release.
            </p>
          </div>
          <span className="relative shrink-0">
            <Shot src="/images/canonical/092-thumb-1.png" zoom={1.3} className="h-[112px] w-[150px] rounded-[4px]" />
          </span>
        </button>

        <div className="mt-[11px]">
          <Eyebrow>GOAL PROGRESS</Eyebrow>
          <div className="mt-[4px] flex items-end gap-[10px]">
            <span className="shotiq-numeric text-[40px] leading-[36px]" style={{ color: ORANGE }}>68</span>
            <span className="shotiq-numeric mb-[4px] text-[16px]" style={{ color: ORANGE }}>%</span>
            <span className="mb-[3px] min-w-0">
              <span className="shotiq-microcaps block" style={{ fontSize: 8, lineHeight: "9px", color: GREEN }}>ON TRACK</span>
              <span className="mt-[2px] block text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>Keep it up</span>
            </span>
          </div>
          <div className="mt-[8px] h-[5px] w-full rounded-full" style={{ background: RULE }}>
            <div className="h-full rounded-full" style={{ width: "68%", background: ORANGE }} />
          </div>
        </div>

        <div className="mt-[12px] pt-[10px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="flex">
            {([["SESSIONS", "9", "of 15", undefined],
               ["AVG. FORM SCORE", "82", "▲ 6 pts", "vs goal start"],
               ["MAKE %", "64.1%", "▲ 4.3%", "vs goal start"]] as const).map(([l, v, d, sub], i) => (
              <div key={l} className="min-w-0 flex-1 pl-[9px] first:pl-0"
                   style={i ? { borderLeft: `1px solid ${RULE}` } : undefined}>
                <div className="shotiq-microcaps" style={{ fontSize: 7.5, lineHeight: "8px", color: GRAPHITE }}>{l}</div>
                <div className="shotiq-numeric mt-[4px] text-[22px] leading-[22px]">{v}</div>
                <div className="mt-[3px] text-[8px] leading-[10px]" style={{ color: i ? GREEN : GRAPHITE }}>{d}</div>
                {sub && <div className="text-[7.5px] leading-[9px]" style={{ color: GRAPHITE }}>{sub}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[13px] pt-[10px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="flex items-center">
            <Eyebrow>GOAL TREND</Eyebrow>
            <span className="ml-auto flex items-center gap-[4px] text-[9px]" style={{ color: GRAPHITE }}>
              Form Score <ChevronDown className="h-[9px] w-[9px]" />
            </span>
          </div>
          <div className="mt-[7px] flex items-stretch gap-[7px]">
            <div className="flex w-[18px] shrink-0 flex-col justify-between text-[7px]" style={{ color: GRAPHITE }}>
              {["100", "75", "50"].map((t) => <span key={t}>{t}</span>)}
            </div>
            <Trend points={SERIES} width={318} height={78} badge="82" />
          </div>
          <div className="ml-[25px] mt-[4px] flex justify-between text-[7.5px]" style={{ color: GRAPHITE }}>
            {["Apr 24", "Apr 29", "May 4", "May 9", "May 14", "May 19"].map((t) => <span key={t}>{t}</span>)}
          </div>
        </div>

        <div className="mt-[13px] pt-[10px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <div className="flex items-center">
            <Eyebrow>RECENT SESSIONS</Eyebrow>
            <span className="ml-auto text-[9px]" style={{ color: BLUE }}>View all</span>
          </div>
          <div className="mt-[7px] flex items-center gap-[10px]">
            <span className="relative shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/092-thumb-2.png" alt="" aria-hidden="true"
                   className="h-[44px] w-[62px] rounded-[3px] object-cover" />
              <span className="absolute inset-0 grid place-items-center">
                <Play className="h-[13px] w-[13px] text-white" fill="#fff" />
              </span>
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[10.5px] font-medium leading-[13px]">May 19, 8:24 AM</span>
              <span className="mt-[2px] block text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>
                24 shots &nbsp; 15 makes &nbsp; 62.5%
              </span>
            </span>
            <span className="shrink-0 rounded-[3px] px-[6px] py-[3px] text-[10px] font-semibold"
                  style={{ border: `1px solid ${BLUE}`, color: BLUE }}>82</span>
            <ChevronRight className="h-[13px] w-[13px] shrink-0" style={{ color: GRAPHITE }} />
          </div>
        </div>

        <PhoneCard className="mt-[10px] flex items-center gap-[10px] px-[10px] py-[9px]">
          <CueGlyph kind="apex" size={24} accent={BLUE} />
          <p className="min-w-0 flex-1 text-[9px] leading-[12px]">
            <span className="font-semibold">Tip:</span>{" "}
            <span style={{ color: GRAPHITE }}>Your release improved when your elbow stayed stacked in the load and rise phases.</span>
          </p>
          <ChevronRight className="h-[13px] w-[13px] shrink-0" style={{ color: GRAPHITE }} />
        </PhoneCard>

        <div className="mb-[16px] mt-[11px] flex items-center justify-center gap-[7px] pt-[10px]"
             style={{ borderTop: `1px solid ${RULE}` }}>
          <span className="shotiq-microcaps" style={{ fontSize: 9, color: GRAPHITE }}>GOAL INSIGHTS</span>
          <ChevronDown className="h-[11px] w-[11px]" style={{ color: GRAPHITE }} />
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 064 */

const CATEGORIES: [string, "release" | "apex" | "base" | "extension" | "tree"][] = [
  ["Form", "release"], ["Shooting", "apex"], ["Footwork", "base"],
  ["Conditioning", "extension"], ["Recovery", "tree"],
]

export function CreateGoal({ onCancel, onCreate }: { onCancel: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = React.useState("Keep elbow stacked through release")
  const [desc, setDesc] = React.useState(
    "Maintain a stacked elbow on every rep from rise through release to build repeatable form.")
  const [cat, setCat] = React.useState("Form")
  const [type, setType] = React.useState("Consistency")
  const [unit, setUnit] = React.useState("Percent")
  return (
    <PhoneScreen testid="screen-ios-create-goal" tab="progress" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<>
 <span className="flex items-center gap-[6px]">
 <PointsGlyph size={18} />
 <span className="text-right">
 <span className="shotiq-numeric block">2,840</span>
 <span className="shotiq-microcaps block" style={{ fontSize: 11, lineHeight: "11px", color: GRAPHITE }}>POINTS</span>
 </span>
 </span>
 <GearLink />
 </>} />

      <div className="px-[18px]">
        <div className="flex items-center gap-[7px] pt-[11px]">
          <BackChevron onClick={onCancel} />
          <Eyebrow>GOALS</Eyebrow>
        </div>

        <div className="mt-[8px] flex items-start">
          <div className="min-w-0">
            <PhoneHeading size={40}>CREATE GOAL</PhoneHeading>
            <p className="mt-[6px] text-[10px] leading-[13px]" style={{ color: GRAPHITE }}>
              Set a measurable goal. Earn XP when you hit it.
            </p>
          </div>
          <div className="ml-auto shrink-0">
            <MiniStat glyph={<StreakGlyph size={36} />} value="6" label="DAY STREAK" w={58} />
          </div>
        </div>

        <Eyebrow className="mt-[13px]">GOAL NAME</Eyebrow>
        <div className="mt-[6px] flex items-center gap-[8px] rounded-[5px] px-[10px]"
             style={{ border: `1px solid ${RULE}`, height: 36 }}>
          <input value={name} onChange={(e) => setName(e.target.value)} data-testid="phone-goal-name"
                 className="min-w-0 flex-1 bg-transparent text-[11.5px] outline-none" />
          <span className="shrink-0 text-[9px]" style={{ color: GRAPHITE }}>{name.length}</span>
        </div>

        <Eyebrow className="mt-[11px]">DESCRIPTION (OPTIONAL)</Eyebrow>
        <div className="relative mt-[6px]">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                    className="w-full resize-none rounded-[5px] px-[10px] py-[8px] text-[10.5px] leading-[15px] outline-none"
                    style={{ border: `1px solid ${RULE}` }} />
          <span className="absolute bottom-[7px] right-[9px] text-[9px]" style={{ color: GRAPHITE }}>{desc.length}</span>
        </div>

        <Eyebrow className="mt-[11px]">CATEGORY</Eyebrow>
        <div className="mt-[7px] flex gap-[7px]">
          {CATEGORIES.map(([l, cue]) => {
            const on = cat === l
            return (
              <button key={l} type="button" onClick={() => setCat(l)} data-testid={`phone-goal-cat-${l.toLowerCase()}`}
                      className="flex min-w-0 flex-1 flex-col items-center rounded-[6px] py-[9px]"
                      style={{ border: `1px solid ${on ? ORANGE : RULE}`, background: on ? "#FFF6F2" : "#fff" }}>
                {l === "Form"
                  ? <PoseFigure phase="release" height={26} active={on} />
                  : <CueGlyph kind={cue as "apex"} size={24} accent={on ? ORANGE : GREEN} />}
                <span className="mt-[6px] text-[8.5px] leading-[10px]" style={{ color: on ? ORANGE : undefined }}>{l}</span>
              </button>
            )
          })}
        </div>

        <Eyebrow className="mt-[11px]">TARGET</Eyebrow>
        <div className="mt-[7px] flex items-center gap-[11px] rounded-[6px] p-[8px]" style={{ border: `1px solid ${RULE}` }}>
          <Shot src="/images/canonical/092-thumb-3.png" zoom={1.32}
                className="h-[80px] w-[104px] shrink-0 rounded-[3px]" />
          <span className="min-w-0 flex-1 text-[12.5px] font-medium leading-[16px]">Keep elbow stacked through release</span>
          <ChevronRight className="h-[14px] w-[14px] shrink-0" style={{ color: GRAPHITE }} />
        </div>

        <div className="mt-[11px] flex gap-[11px]">
          <div className="min-w-0 flex-[1.6]">
            <Eyebrow>TARGET TYPE</Eyebrow>
            <div className="mt-[6px] flex gap-[6px]">
              {["Range", "Minimum", "Consistency"].map((t) => (
                <button key={t} type="button" onClick={() => setType(t)}
                        className="min-w-0 flex-1 truncate rounded-[4px] px-[4px] text-[9px]"
                        style={{ height: 28, border: `1px solid ${t === type ? ORANGE : RULE}`, color: t === type ? ORANGE : undefined }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>TARGET</Eyebrow>
            <div className="mt-[6px] flex items-center gap-[6px]">
              <span className="flex min-w-0 flex-1 items-center justify-between rounded-[4px] px-[8px]"
                    style={{ height: 28, border: `1px solid ${RULE}` }}>
                <span className="shotiq-numeric text-[12px]">80</span>
                <span className="text-[9px]" style={{ color: GRAPHITE }}>%</span>
              </span>
              <span className="shrink-0 text-[8.5px]" style={{ color: GRAPHITE }}>of reps</span>
            </div>
          </div>
        </div>

        <div className="mt-[11px] flex gap-[11px]">
          <div className="min-w-0 flex-[1.6]">
            <Eyebrow>UNIT</Eyebrow>
            <div className="mt-[6px] flex gap-[6px]">
              {["Degrees", "Percent", "Reps"].map((t) => (
                <button key={t} type="button" onClick={() => setUnit(t)}
                        className="min-w-0 flex-1 truncate rounded-[4px] px-[4px] text-[9px]"
                        style={{ height: 28, border: `1px solid ${t === unit ? ORANGE : RULE}`, color: t === unit ? ORANGE : undefined }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>XP REWARD</Eyebrow>
            <div className="mt-[6px] flex items-center justify-between rounded-[4px] px-[8px]"
                 style={{ height: 28, border: `1px solid ${RULE}` }}>
              <span className="shotiq-numeric text-[12px]">150</span>
              <span className="text-[9px]" style={{ color: GRAPHITE }}>XP</span>
            </div>
          </div>
        </div>

        <PhoneCard className="mt-[11px] flex items-start gap-[10px] px-[10px] py-[9px]"
                   style={{ background: "var(--shotiq-color-warmCanvas)" }}>
          <MechanicGlyph kind="angle" size={26} />
          <p className="min-w-0 flex-1 text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>
            Measured from RISE through RELEASE. Angle between upper arm and forearm should stay within your target range.
          </p>
          <span className="flex shrink-0 items-center gap-[3px] text-[9px]" style={{ color: BLUE }}>
            Learn how <ChevronRight className="h-[10px] w-[10px]" />
          </span>
        </PhoneCard>

        <div className="mb-[16px] mt-[12px] flex gap-[9px]">
          <PhoneAction tone="outline" height={40} className="flex-1 text-[12.5px]" onClick={onCancel}>Cancel</PhoneAction>
          <PhoneAction tone="orange" height={40} className="flex-[1.4] text-[12.5px]"
                       onClick={() => onCreate(name)} testid="phone-goal-submit">Create goal</PhoneAction>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 065 */

const LINKED: [string, string, string, string, string, string][] = [
  ["May 24, 8:24 AM", "Form Session", "24", "62.5% MAKE %", "87°", "68%"],
  ["May 22, 7:12 AM", "Quick Release", "18", "61.1% MAKE %", "83°", "62%"],
  ["May 20, 6:45 AM", "Catch & Shoot", "20", "60.0% MAKE %", "78°", "54%"],
  ["May 18, 9:01 AM", "Off the Dribble", "22", "59.1% MAKE %", "85°", "64%"],
]
const MILESTONES: [string, string, "done" | "active" | "locked"][] = [
  ["STARTED GOAL", "May 12", "done"], ["REACH 50%", "May 20", "done"],
  ["REACH 70%", "In progress", "active"], ["REACH 90%", "Locked", "locked"],
]

export function GoalDetail({ onBack, onLog }: { onBack: () => void; onLog: () => void }) {
  return (
    <PhoneScreen testid="screen-ios-goal-detail" tab="progress" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<>
        <span className="flex items-center gap-[10px]">
          <MiniStat glyph={<StreakGlyph size={30} />} value="6" label="DAY STREAK" w={50} />
          <MiniStat glyph={<PointsGlyph size={17} />} value="2,840" label="POINTS" w={48} />
        </span>
      </>} height={46} />

      <div className="px-[18px]">
        <div className="flex items-center gap-[7px] pt-[10px]">
          <BackChevron onClick={onBack} />
          <Eyebrow>GOALS</Eyebrow>
        </div>

        <div className="relative mt-[7px]">
          <div className="absolute right-0 top-0">
            <Shot src="/images/canonical/092-thumb-1.png" zoom={1.3} className="h-[104px] w-[136px] rounded-[4px]" />
          </div>
          <PhoneHeading size={31} className="w-[212px]">KEEP ELBOW STACKED THROUGH RELEASE</PhoneHeading>
          <p className="mt-[8px] w-[212px] text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>
            Keep your shooting elbow stacked under the ball through release for a more efficient, repeatable shot.
          </p>
        </div>

        <PhoneCard className="mt-[11px] flex items-stretch">
          <div className="w-[104px] shrink-0 px-[10px] py-[9px]">
            <Eyebrow tone={BLUE}>IMPACT</Eyebrow>
            <div className="shotiq-display mt-[4px] text-[19px] leading-[20px]">HIGH</div>
            <p className="mt-[4px] text-[7.5px] leading-[9px]" style={{ color: GRAPHITE }}>
              Improves shot consistency and reduces off-line misses.
            </p>
          </div>
          <div className="min-w-0 flex-1 px-[10px] py-[9px]" style={{ borderLeft: `1px solid ${RULE}` }}>
            <Eyebrow>FORM SCORE IMPACT</Eyebrow>
            <div className="shotiq-numeric mt-[4px] text-[19px] leading-[20px]" style={{ color: BLUE }}>+6–10</div>
            <div className="shotiq-microcaps mt-[3px]" style={{ fontSize: 7, color: GRAPHITE }}>POTENTIAL</div>
          </div>
        </PhoneCard>

        <div className="mt-[12px] flex items-start gap-[13px]">
          <div className="w-[124px] shrink-0">
            <Eyebrow>GOAL PROGRESS</Eyebrow>
            <div className="shotiq-microcaps mt-[6px]" style={{ fontSize: 7, color: GRAPHITE }}>OVERALL PROGRESS</div>
            <div className="shotiq-numeric mt-[3px] text-[34px] leading-[32px]" style={{ color: ORANGE }}>68%</div>
            <div className="mt-[6px] h-[4px] w-full rounded-full" style={{ background: RULE }}>
              <div className="h-full rounded-full" style={{ width: "68%", background: ORANGE }} />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Eyebrow>TREND (LAST 7 SESSIONS)</Eyebrow>
            <div className="mt-[6px] flex items-stretch gap-[5px]">
              <div className="flex w-[20px] shrink-0 flex-col justify-between text-[6.5px]" style={{ color: GRAPHITE }}>
                {["100%", "75%", "50%", "25%", "0%"].map((t) => <span key={t}>{t}</span>)}
              </div>
              <Trend points={[54, 57, 56, 60, 63, 62, 68]} width={172} height={62} fill={false} />
              <span className="shrink-0 self-start text-[8px] font-semibold" style={{ color: ORANGE }}>68%</span>
            </div>
            <div className="ml-[25px] mt-[3px] flex justify-between text-[6.5px]" style={{ color: GRAPHITE }}>
              {["5/12", "5/14", "5/16", "5/18", "5/20", "5/22", "5/24"].map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
        </div>

        {/* --------------------------------------- technique snapshot */}
        <Eyebrow className="mt-[13px]">TECHNIQUE SNAPSHOT</Eyebrow>
        <div className="mt-[8px] flex items-start gap-[11px]">
          <Shot src="/images/canonical/092-thumb-2.png" zoom={1.4}
                className="h-[118px] w-[104px] shrink-0 rounded-[4px]" />
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-[9px]">
              <div className="min-w-0 flex-1">
                <div className="shotiq-microcaps" style={{ fontSize: 7, color: GRAPHITE }}>ELBOW STACK ANGLE</div>
                <div className="shotiq-numeric mt-[3px] text-[19px] leading-[19px]" style={{ color: ORANGE }}>87°</div>
                <div className="shotiq-microcaps" style={{ fontSize: 6.5, color: GRAPHITE }}>AVG</div>
                <div className="relative mt-[6px] h-[4px] w-full rounded-full" style={{ background: RULE }}>
                  <span className="absolute inset-y-0 rounded-full" style={{ left: "42%", width: "17%", background: GREEN }} />
                  <span className="absolute top-[-3px] h-[10px] w-[2px]" style={{ left: "45%", background: ORANGE }} />
                </div>
                <div className="mt-[3px] flex justify-between text-[6.5px]" style={{ color: GRAPHITE }}>
                  <span>60°</span><span>90°</span><span>120°</span>
                </div>
              </div>
              <div className="w-[84px] shrink-0 rounded-[4px] px-[7px] py-[6px]" style={{ border: `1px solid ${RULE}` }}>
                <div className="shotiq-microcaps" style={{ fontSize: 6.5, color: GRAPHITE }}>TARGET RANGE</div>
                <div className="shotiq-numeric mt-[3px] text-[13px] leading-[14px]" style={{ color: GREEN }}>85°–95°</div>
              </div>
            </div>
            <div className="mt-[8px] flex gap-[8px]">
              {([["VERTICAL ALIGNMENT", "92%", "centerline"], ["LATERAL DRIFT", "4.2°", "drift"]] as const).map(([l, v, m]) => (
                <div key={l} className="min-w-0 flex-1 rounded-[4px] px-[7px] py-[6px]" style={{ border: `1px solid ${RULE}` }}>
                  <div className="shotiq-microcaps truncate" style={{ fontSize: 6.5, color: GRAPHITE }}>{l}</div>
                  <div className="mt-[3px] flex items-center gap-[6px]">
                    <span className="min-w-0">
                      <span className="shotiq-microcaps block" style={{ fontSize: 7, color: GREEN }}>GOOD</span>
                      <span className="shotiq-numeric block text-[13px] leading-[14px]">{v}</span>
                    </span>
                    <span className="ml-auto shrink-0"><MechanicGlyph kind={m} size={22} /></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* -------------------------------------------- linked sessions */}
        <div className="mt-[13px] flex items-center pt-[10px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>LINKED SESSIONS</Eyebrow>
          <span className="ml-auto text-[8px]" style={{ color: GRAPHITE }}>4 OF 6 THIS GOAL</span>
        </div>
        <div className="mt-[6px]">
          {LINKED.map(([date, title, shots, pct, ang, score], i) => (
            <div key={date} className="flex items-center gap-[9px] py-[7px]"
                 style={i ? { borderTop: `1px solid ${RULE}` } : undefined}>
              <span className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/images/canonical/092-thumb-${(i % 3) + 1}.png`} alt="" aria-hidden="true"
                     className="h-[34px] w-[48px] rounded-[3px] object-cover" />
                <span className="absolute inset-0 grid place-items-center">
                  <Play className="h-[11px] w-[11px] text-white" fill="#fff" />
                </span>
              </span>
              <span className="w-[34px] shrink-0 text-center">
                <span className="shotiq-numeric block text-[11px] leading-[12px]">{shots}</span>
                <span className="shotiq-microcaps block" style={{ fontSize: 6, color: GRAPHITE }}>SHOTS</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[8px] leading-[10px]" style={{ color: GRAPHITE }}>{date}</span>
                <span className="block text-[9.5px] font-medium leading-[11px]">{title}</span>
                <span className="block text-[7.5px] leading-[9px]" style={{ color: GREEN }}>{pct}</span>
              </span>
              <span className="w-[42px] shrink-0 text-center">
                <span className="shotiq-numeric block text-[10px] leading-[11px]" style={{ color: BLUE }}>{ang}</span>
                <span className="shotiq-microcaps block" style={{ fontSize: 6, color: GRAPHITE }}>ELBOW</span>
              </span>
              <span className="w-[44px] shrink-0 text-center">
                <span className="shotiq-numeric block text-[10px] leading-[11px]" style={{ color: ORANGE }}>{score}</span>
                <span className="shotiq-microcaps block" style={{ fontSize: 6, color: GRAPHITE }}>GOAL SCORE</span>
              </span>
              <ChevronRight className="h-[12px] w-[12px] shrink-0" style={{ color: GRAPHITE }} />
            </div>
          ))}
        </div>

        <Eyebrow className="mt-[12px]">RECOMMENDED DRILL</Eyebrow>
        <div className="mt-[7px] flex items-center gap-[10px] rounded-[6px] px-[10px] py-[9px]"
             style={{ border: `1px solid ${RULE}` }}>
          <CueGlyph kind="saved" size={26} />
          <span className="min-w-0 flex-1">
            <span className="block text-[10.5px] font-medium leading-[13px]">Elbow Stack Hold</span>
            <span className="block text-[8px] leading-[10px]" style={{ color: GRAPHITE }}>
              3 sets • 15 reps • Form Focus<br />Build awareness of elbow position through release.
            </span>
          </span>
          <span className="flex h-[24px] shrink-0 items-center gap-[4px] rounded-[4px] px-[8px] text-[9px]"
                style={{ border: `1px solid ${ORANGE}`, color: ORANGE }}>
            <Plus className="h-[10px] w-[10px]" /> Add drill
          </span>
        </div>

        <Eyebrow className="mt-[12px]">MILESTONES</Eyebrow>
        <div className="mt-[7px] flex gap-[7px]">
          {MILESTONES.map(([l, note, st]) => (
            <div key={l} className="min-w-0 flex-1 rounded-[5px] px-[7px] py-[7px] text-center"
                 style={{ border: `1px solid ${st === "active" ? ORANGE : RULE}`, background: st === "active" ? "#FFF6F2" : "#fff" }}>
              <div className="shotiq-microcaps truncate" style={{ fontSize: 6.5, lineHeight: "8px", color: GRAPHITE }}>{l}</div>
              <div className="mt-[4px] flex items-center justify-center gap-[4px]">
                {st === "done" && <Check className="h-[10px] w-[10px]" style={{ color: GREEN }} strokeWidth={3} />}
                {st === "locked" && <Lock className="h-[9px] w-[9px]" style={{ color: GRAPHITE }} />}
                <span className="truncate text-[7.5px] leading-[9px]"
                      style={{ color: st === "active" ? ORANGE : GRAPHITE }}>{note}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="mb-[16px] mt-[12px] flex gap-[8px]">
          <PhoneAction tone="orange" height={38} className="flex-1 text-[11px]" onClick={onLog} testid="phone-log-progress">
            <ActionGlyph kind="nodeClimb" height={13} accent="#fff" /> Log progress
          </PhoneAction>
          <button type="button"
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[6px] text-[11px]"
                  style={{ border: `1px solid ${RULE}` }}>
            <Pencil className="h-[12px] w-[12px]" /> Edit goal
          </button>
          <button type="button"
                  className="flex h-[38px] flex-1 items-center justify-center gap-[7px] rounded-[6px] text-[11px]"
                  style={{ border: `1px solid ${RULE}` }}>
            <Check className="h-[12px] w-[12px]" /> Mark complete
          </button>
        </div>
      </div>
      {/* `X` is imported for the dismiss affordance the create-goal sheet used
          to own; keeping the symbol referenced documents the removal. */}
      <span className="hidden"><X className="h-0 w-0" /></span>
    </PhoneScreen>
  )
}
