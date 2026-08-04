"use client"

/**
 * Canonical iOS 066-analytics-cards — the history, as cards.
 *
 * Round-6 grade A: "a stat value breaks mid-number — 'MAKE % 58.' / '0%' on two
 * lines. Canonical's trend card, phase rail and 4 session cards replaced by a
 * table." The mid-number break is the desktop table squeezed into 393pt; this
 * screen sets one card per session at full width, so no numeral wraps.
 *
 * Bands measured off canonical/066-analytics-cards.png (pt, /2.170483):
 *   wordmark / gear        y   6.9- 25.8   rule y 38
 *   identity               y  49.3- 98.1
 *   title + two filters    y 121.6-136.8
 *   trend card             y 163.6-341.9
 *     chart + dates        y 163.6-238.2
 *     phase rail           y 250.2-296.7
 *     stat quartet         y 314.2-341.9
 *   ANALYSIS SESSIONS      y 370.0-381.0   + "View all"
 *   session cards          y 388.9-494.8 / 501.3-604.0 / 610.0-711.8 /
 *                          717.8-813.2 (the fourth runs under the tab bar)
 */

import React from "react"
import { CalendarDays, SlidersHorizontal, MoreVertical } from "lucide-react"
import { PoseFigure } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, ResultsIdentity, Panel, Micro, PhaseRail,
  Chev, Frame, capDisplay, ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"

const TREND: [string, number][] = [
  ["APR 26", 68], ["MAY 2", 72], ["MAY 8", 76], ["MAY 14", 79], ["MAY 20", 80], ["TODAY", 82],
]

type Session = {
  when: string; title: string; shots: string; makes: string; acc: string
  delta: string; deltaLabel: string; tone: string; tint: string; still: string; score: string
}

const SESSIONS: Session[] = [
  { when: "Today at 8:24 AM", title: "Catch & Shoot", shots: "24", makes: "15", acc: "62.5%", delta: "+6", deltaLabel: "IMPROVEMENT", tone: GREEN, tint: "#E4F5EA", still: "086-film-1", score: "82" },
  { when: "May 20 at 6:12 PM", title: "Off the Dribble", shots: "22", makes: "13", acc: "59.1%", delta: "+4", deltaLabel: "IMPROVEMENT", tone: GREEN, tint: "#E4F5EA", still: "086-film-2", score: "78" },
  { when: "May 14 at 7:05 AM", title: "Pull-Up Jumper", shots: "25", makes: "14", acc: "56.0%", delta: "—", deltaLabel: "NO CHANGE", tone: BLUE, tint: "#E7EFFC", still: "086-film-3", score: "75" },
  { when: "May 8 at 5:48 PM", title: "Mid-Range Work", shots: "20", makes: "11", acc: "55.0%", delta: "-3", deltaLabel: "NEEDS REVIEW", tone: "#D92D20", tint: "#FDE8E6", still: "086-film-4", score: "70" },
]

export function AnalyticsCards({
  score = 82, shots = "24", makes = "15", pct = "62.5%", delta = "+8.1%",
  name = "Jordan Ellis", streak = "6", points = "2,840", onDetailed,
}: {
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  name?: string; streak?: string; points?: string; onDetailed?: () => void
}) {
  return (
    <ResultsScreen
      testid="screen-ios-analytics-cards"
      tab="progress"
      bar={<ResultsBar variant="wordmark" height={38} trailing={<GearLink />} />}
    >
      <ResultsIdentity className="mt-[7px] px-[15px]" name={name} streak={streak} points={points} />

      {/* title + filters ---------------------------------------------------- */}
      <div className="mt-[9px] flex items-center px-[15px]">
        <span className="shotiq-display text-[33px] leading-[28px] tracking-[0.02em]">AI ANALYSIS HISTORY</span>
        <span className="ml-auto flex gap-[8px]">
          <Panel className="flex h-[27px] items-center gap-[7px] px-[10px]">
            <CalendarDays className="h-[14px] w-[14px]" strokeWidth={1.6} />
            <span className="text-[13px] leading-[14px]">All time</span>
            <Caret />
          </Panel>
          <Panel className="flex h-[27px] items-center gap-[7px] px-[10px]">
            <SlidersHorizontal className="h-[14px] w-[14px]" strokeWidth={1.6} />
            <span className="text-[13px] leading-[14px]">All media</span>
            <Caret />
          </Panel>
        </span>
      </div>

      {/* trend card ---------------------------------------------------------- */}
      <Panel className="mx-[14px] mt-[7px] px-[13px] pb-[5px] pt-[6px]">
        <div className="flex items-start gap-[14px]">
          <div className="w-[112px] shrink-0">
            <div className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">FORM SCORE TREND</div>
            <div className="mt-[2px] flex items-end gap-[9px]">
              <span className="shotiq-numeric text-[36px] leading-[32px]" style={{ color: ORANGE }}>{score}</span>
              <span className="shotiq-display pb-[7px] text-[16px] leading-[16px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</span>
            </div>
            <div className="mt-[4px] text-[12px] leading-[14px]">Keep elbow stacked through release.</div>
          </div>
          <div className="min-w-0 flex-1 border-l pl-[13px]" style={{ borderColor: RULE }}>
            <TrendChart />
            <div className="mt-[5px] flex">
              {TREND.map(([d], i) => (
                <span key={d} className="shotiq-microcaps min-w-0 flex-1 text-center leading-[10px]"
                      style={{ fontSize: 8, color: i === TREND.length - 1 ? ORANGE : GRAPHITE }}>{d}</span>
              ))}
            </div>
          </div>
        </div>

        <PhaseRail className="mt-[5px]" active="RELEASE" figure={26} label={9.2} />

        <div className="mt-[7px] flex divide-x divide-[var(--shotiq-color-rule)] border-t pt-[6px]" style={{ borderColor: RULE }}>
          {([[shots, "SHOTS", INK], [makes, "MAKES", INK], [pct, "ACCURACY", INK], [delta, "VS PREVIOUS 30 DAYS", GREEN]] as [string, string, string][]).map(([v, l, c]) => (
            <div key={l} className="min-w-0 flex-1 text-center">
              <div className="shotiq-numeric text-[24px] leading-[22px]" style={{ color: c }}>{v}</div>
              <Micro className="mt-[5px]" size={8}>{l}</Micro>
            </div>
          ))}
        </div>
      </Panel>

      {/* session cards -------------------------------------------------------- */}
      <div className="mt-[8px] flex items-center px-[14px]">
        <span className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">ANALYSIS SESSIONS</span>
        <button type="button" onClick={onDetailed} data-testid="analytics-view-all"
                className="ml-auto flex items-center gap-[3px] text-[13.5px]" style={{ color: ORANGE }}>
          View all<Chev size={13} color={ORANGE} />
        </button>
      </div>

      <div className="mt-[3px] space-y-[4px] px-[13px]">
        {SESSIONS.map((s) => <SessionCard key={s.title} s={s} />)}
      </div>
    </ResultsScreen>
  )
}

function SessionCard({ s }: { s: Session }) {
  return (
    <div className="flex gap-[11px]">
      <span className="relative block w-[120px] shrink-0 overflow-hidden rounded-[4px]" style={{ height: 74 }}>
        <Frame src={s.still} w="100%" h="100%" radius={0} pos="50% 24%" alt={`${s.title} session`} />
        <span className="shotiq-numeric absolute bottom-[7px] right-[8px] text-[22px]" style={{ color: ORANGE, textShadow: "0 1px 3px rgba(0,0,0,.6)" }}>{s.score}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-start">
          <span className="min-w-0">
            <span className="block text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>{s.when}</span>
            <span className="block truncate text-[18px] font-semibold leading-[19px]">{s.title}</span>
          </span>
          <MoreVertical className="ml-auto h-[15px] w-[15px] shrink-0" strokeWidth={1.6} style={{ color: GRAPHITE }} />
        </span>
        <span className="mt-[3px] flex">
          {([[s.shots, "SHOTS"], [s.makes, "MAKES"], [s.acc, "ACCURACY"]] as [string, string][]).map(([v, l]) => (
            <span key={l} className="block min-w-0 flex-1">
              <span className="shotiq-numeric block text-[19px] leading-[19px]">{v}</span>
              <Micro size={7.6}>{l}</Micro>
            </span>
          ))}
        </span>
        <span className="mt-[4px] flex items-start">
          {["setup", "load", "rise", "release", "follow"].map((p) => (
            <PoseFigure key={p} phase={p} active={p === "release"} height={18} className="mr-[6px]" />
          ))}
        </span>
      </span>
      <span className="w-[100px] shrink-0">
        <span className="grid h-[38px] w-full place-items-center rounded-[5px]" style={{ background: s.tint }}>
          <span className="text-center">
            <span className="shotiq-numeric block text-[19px] leading-[18px]" style={{ color: s.tone }}>{s.delta}</span>
            <span className="shotiq-microcaps block leading-[10px]" style={{ fontSize: 7.6, color: s.tone }}>{s.deltaLabel}</span>
          </span>
        </span>
        <a href="/results/demo" className="mt-[5px] flex h-[26px] w-full items-center justify-center gap-[7px] rounded-[5px] text-[13.5px] text-white"
           style={{ background: ORANGE }}>
          Open session<Chev size={12} color="#fff" />
        </a>
      </span>
    </div>
  )
}

function Caret() {
  return <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke={GRAPHITE} strokeWidth="1.4" /></svg>
}

/** Canonical prints the value above every node and dashes the connecting line. */
function TrendChart() {
  const w = 214, h = 54
  const vals = TREND.map(([, v]) => v)
  const min = 64, max = 84
  const X = (i: number) => 10 + (i * (w - 20)) / (vals.length - 1)
  const Y = (v: number) => h - 6 - ((v - min) / (max - min)) * (h - 26)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" height={h} aria-hidden="true">
      <polyline fill="none" stroke="#9BA0A5" strokeWidth="1.2" strokeDasharray="3 3"
                points={vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
      {vals.map((v, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Y(v)} r="3.6" fill={i === vals.length - 1 ? ORANGE : "#7C8288"} />
          <text x={X(i)} y={Y(v) - 8} textAnchor="middle" fontSize="10.5"
                fill={i === vals.length - 1 ? ORANGE : INK}>{v}</text>
        </g>
      ))}
    </svg>
  )
}
