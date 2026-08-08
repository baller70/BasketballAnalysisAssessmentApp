"use client"

/**
 * Canonical iOS 067-analytics-detailed — the same history, as numbers.
 *
 * Round-6 grade A: "canonical's mechanics scorecard, session-comparison table,
 * arc gauge and shot-rail summary absent. Green 7.1‰ -> 0.0‰." Green is the
 * improvement column and the RISE scorecard cell; both are the confirm role,
 * `--shotiq-color-confirmGreen`.
 *
 * Bands measured off canonical/067-analytics-detailed.png (pt, /2.170483):
 *   wordmark + 3 actions   y   8.3- 32.3   rule y 42
 *   ANALYSIS HISTORY       y  49.8- 68.2   sub y 76.0- 82.5
 *   three filter chips     y  96.8-109.2
 *   trend card             y 134.5-195.3
 *   MECHANICS SCORECARD    y 220.7-231.3   5 cells y 247.9-336.3
 *   SESSION COMPARISON     y 359.8-371.3   header 381.5, 8 rows 408.7-563.9
 *   RELEASE ARC RANGE      y 580.5-652.9
 *   SHOT RAIL SUMMARY      y 669.0-718.7   5 stills y 722.9-801.7
 */

import React from "react"
import { CalendarDays, Info } from "@/components/shotiq/ApprovedLucide"
import { PoseFigure, ActionGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, Panel, Micro, Frame, ORANGE, BLUE, GREEN, RED, GRAPHITE, RULE, INK,
} from "./Kit"

const SCORECARD: [string, string, string, string, string][] = [
  ["SETUP", "84", "+4", "GOOD", BLUE],
  ["LOAD", "79", "+2", "GOOD", BLUE],
  ["RISE", "88", "+5", "GREAT", GREEN],
  ["RELEASE", "78", "+6", "GOOD", BLUE],
  ["FOLLOW-THROUGH", "84", "+3", "GOOD", BLUE],
]

const TABLE: [string, string, string, string, string, boolean][] = [
  ["Form Score", "82", "76", "71", "+11", false],
  ["Make %", "62.5%", "59.1%", "52.4%", "+10.1%", false],
  ["Release Consistency", "78.2%", "71.8%", "64.0%", "+14.2%", true],
  ["Release Angle", "50.4°", "48.1°", "45.2°", "+5.2°", false],
  ["Elbow Alignment", "92%", "88%", "81%", "+11%", true],
  ["Shot Depth", "1.3 ft", "1.5 ft", "1.7 ft", "-0.4 ft", false],
  ["Shot Speed", "1.06 sec", "1.11 sec", "1.18 sec", "-0.12 sec", false],
  ["Swish %", "41.7%", "36.4%", "28.6%", "+13.1%", false],
]

const RAIL: [string, string, string][] = [
  ["SETUP", "84", BLUE], ["LOAD", "79", BLUE], ["RISE", "88", GREEN],
  ["RELEASE", "78", ORANGE], ["FOLLOW-THROUGH", "84", "#6E7378"],
]

export function AnalyticsDetailed({ onCards }: { onCards?: () => void }) {
  return (
    <ResultsScreen
      testid="screen-ios-analytics-detailed"
      tab="progress"
      bar={
        <ResultsBar
          variant="wordmark" height={42}
          trailing={
            <>
              {([["Cards", "uploadImage", onCards], ["Select metric", "nodeGraph", undefined], ["Export", "chooseMedia", undefined]] as const).map(([l, g, fn]) => (
                <button key={l} type="button" onClick={fn} data-testid={`analytics-${l.split(" ")[0].toLowerCase()}`}
                        className="flex flex-col items-center gap-[4px]">
                  <ActionGlyph kind={g} height={15} accent={INK} />
                  <span className="text-[11.5px] leading-[12px]">{l}</span>
                </button>
              ))}
            </>
          }
        />
      }
    >
      <div className="mt-[6px] px-[15px]">
        {/* canonical 067 sets this at cap 39 of the 853px art = 18.0 CSS px,
            so 18.0/0.705 = 25.5px. 34px measured cap 52, 133% of canonical. */}
        <h1 className="shotiq-display text-[25.5px] leading-[21px] tracking-[0.015em]">ANALYSIS HISTORY</h1>
        <p className="mt-[4px] text-[12.5px] leading-[13px]" style={{ color: GRAPHITE }}>
          Track your mechanics. See what moves the needle.
        </p>
      </div>

      {/* filters ----------------------------------------------------------- */}
      <div className="mt-[6px] flex gap-[9px] px-[15px]">
        <Panel className="flex h-[28px] flex-1 items-center gap-[8px] px-[11px]">
          <CalendarDays className="h-[15px] w-[15px]" strokeWidth={1.6} />
          <span className="text-[13.5px] leading-[15px]">Last 30 days</span>
          <span className="ml-auto"><Caret /></span>
        </Panel>
        <Panel className="flex h-[28px] flex-1 items-center gap-[8px] px-[11px]">
          <ActionGlyph kind="nodeClimb" height={14} accent={ORANGE} />
          <span className="text-[13.5px] leading-[15px]">Release Consistency</span>
          <span className="ml-auto"><Caret /></span>
        </Panel>
        <Panel className="flex h-[28px] flex-1 items-center gap-[7px] px-[11px]">
          <span className="text-[13px] leading-[15px]" style={{ color: GRAPHITE }}>Confidence:</span>
          <span className="text-[13px] leading-[15px]" style={{ color: GREEN }}>High</span>
          <Info className="ml-auto h-[13px] w-[13px]" strokeWidth={1.7} style={{ color: GRAPHITE }} />
        </Panel>
      </div>

      {/* trend card ---------------------------------------------------------- */}
      <Panel className="mx-[14px] mt-[5px] flex items-center gap-[13px] px-[13px] py-[4px]">
        <div className="w-[96px] shrink-0">
          <div className="shotiq-display text-[17px] leading-[17px] tracking-[0.05em]" style={{ color: GRAPHITE }}>TREND</div>
          <div className="shotiq-numeric mt-[1px] text-[32px] leading-[30px]" style={{ color: GREEN }}>+6.4%</div>
          <div className="mt-[2px] text-[11px] leading-[13px]" style={{ color: GRAPHITE }}>vs previous 30 days</div>
        </div>
        <div className="min-w-0 flex-1">
          <ArcTrend />
          <div className="mt-[3px] flex pl-[26px]">
            {["APR 25", "MAY 2", "MAY 9", "MAY 16", "MAY 23"].map((d) => (
              <span key={d} className="shotiq-microcaps min-w-0 flex-1 text-center leading-[10px]" style={{ fontSize: 7.6, color: GRAPHITE }}>{d}</span>
            ))}
          </div>
        </div>
        <div className="w-[94px] shrink-0 text-right">
          <div className="shotiq-display text-[17px] leading-[17px] tracking-[0.05em]" style={{ color: GRAPHITE }}>LATEST</div>
          <div className="shotiq-numeric mt-[1px] text-[30px] leading-[28px]" style={{ color: GREEN }}>78.2%</div>
          <Micro className="mt-[2px]" size={8}>MAY 24</Micro>
        </div>
      </Panel>

      {/* mechanics scorecard ---------------------------------------------------- */}
      <div className="mt-[5px] flex items-center px-[15px]">
        <span className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">MECHANICS SCORECARD</span>
        <Info className="ml-[6px] h-[12px] w-[12px]" strokeWidth={1.8} style={{ color: GRAPHITE }} />
      </div>
      <Panel className="mx-[14px] mt-[3px] flex gap-[6px] p-[3px]">
        {SCORECARD.map(([p, v, d, verdict, tone]) => (
          <Panel key={p} className="min-w-0 flex-1 px-[3px] pb-[5px] pt-[5px] text-center">
            <span className="flex h-[26px] items-center justify-center">
              <PoseFigure phase={p.toLowerCase().startsWith("follow") ? "follow" : p.toLowerCase()} active={p === "RELEASE"} height={26} />
            </span>
            <div className="shotiq-display mt-[4px] leading-[10px] tracking-[0.04em]"
                 style={{ fontSize: 9.4, color: p === "RELEASE" ? ORANGE : INK }}>{p}</div>
            <div className="mt-[4px] flex items-baseline justify-center gap-[4px]">
              <span className="shotiq-numeric text-[19px] leading-[17px]">{v}</span>
              <span className="text-[11px]" style={{ color: GREEN }}>{d}</span>
            </div>
            <div className="shotiq-display mt-[3px] leading-[10px] tracking-[0.04em]" style={{ fontSize: 10, color: tone }}>{verdict}</div>
            <span className="mx-auto mt-[4px] block h-[4px] w-[86%] overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
              <span className="block h-full rounded-full" style={{ width: `${v}%`, background: tone }} />
            </span>
          </Panel>
        ))}
      </Panel>

      {/* session comparison ------------------------------------------------------- */}
      <div className="shotiq-display mt-[5px] px-[16px] text-[24px] leading-[24px] tracking-[0.03em]">SESSION COMPARISON</div>
      <div className="mt-[4px] px-[16px]">
        <div className="flex items-end pb-[4px]">
          <span className="shotiq-microcaps w-[104px] shrink-0 leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>METRIC</span>
          {([["MAY 24, 8:24 AM", "24 SHOTS", true], ["MAY 16, 7:05 AM", "22 SHOTS", false], ["MAY 9, 6:40 AM", "21 SHOTS", false]] as [string, string, boolean][]).map(([d, n, hot]) => (
            <span key={d} className={`min-w-0 flex-1 text-center ${hot ? "rounded-t-[4px]" : ""}`} style={hot ? { background: "#FDF0EC" } : undefined}>
              <span className="shotiq-microcaps block leading-[10px]" style={{ fontSize: 7.6, color: GRAPHITE }}>{d}</span>
              <span className="shotiq-microcaps mt-[2px] block leading-[10px]" style={{ fontSize: 7.6, color: GRAPHITE }}>{n}</span>
            </span>
          ))}
          <span className="w-[76px] shrink-0 text-center">
            <span className="shotiq-microcaps block leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>CHANGE</span>
            <span className="shotiq-microcaps mt-[2px] block leading-[10px]" style={{ fontSize: 7, color: GRAPHITE }}>(LATEST VS MAY 9)</span>
          </span>
        </div>
        {TABLE.map(([metric, a, b, c, change, info]) => (
          <div key={metric} className="flex items-center border-t" style={{ borderColor: RULE }}>
            <span className="flex w-[104px] shrink-0 items-center gap-[4px] text-[11.5px] leading-[14px]">
              {metric}{info && <Info className="h-[9px] w-[9px] shrink-0" strokeWidth={2} style={{ color: GRAPHITE }} />}
            </span>
            <span className="shotiq-numeric min-w-0 flex-1 text-center text-[15px] leading-[16px]" style={{ background: "#FDF0EC", color: ORANGE }}>{a}</span>
            <span className="shotiq-numeric min-w-0 flex-1 text-center text-[15px] leading-[16px]">{b}</span>
            <span className="shotiq-numeric min-w-0 flex-1 text-center text-[15px] leading-[16px]">{c}</span>
            <span className="w-[76px] shrink-0 text-center text-[12px]" style={{ color: change.startsWith("-") ? RED : GREEN }}>{change}</span>
          </div>
        ))}
      </div>

      {/* release arc range ---------------------------------------------------------- */}
      <Panel className="mx-[14px] mt-[5px] flex items-center gap-[10px] px-[13px] py-[2px]">
        <div className="w-[104px] shrink-0">
          <div className="flex items-center">
            <span className="shotiq-display text-[22px] leading-[22px] tracking-[0.03em]">RELEASE ARC RANGE</span>
          </div>
          <Micro className="mt-[5px]" size={8}>AVG ARC</Micro>
          <div className="shotiq-numeric text-[25px] leading-[23px]" style={{ color: ORANGE }}>50.4°</div>
          <div className="shotiq-microcaps mt-[2px] leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>IDEAL: 48°–52°</div>
        </div>
        <div className="min-w-0 flex-1">
          <ArcGauge />
          <div className="mt-[3px] flex items-center justify-center gap-[14px] text-[9.5px]" style={{ color: GRAPHITE }}>
            <span className="flex items-center gap-[5px]"><span className="block h-[3px] w-[18px] rounded-full" style={{ background: ORANGE }} />YOU</span>
            <span className="flex items-center gap-[5px]"><span className="block h-[9px] w-[9px] rounded-[2px]" style={{ background: "#D5D7D9" }} />IDEAL RANGE</span>
          </div>
        </div>
        <div className="w-[92px] shrink-0 text-center">
          <Micro size={8}>CONSISTENCY</Micro>
          <div className="shotiq-numeric mt-[2px] text-[26px] leading-[24px]" style={{ color: BLUE }}>78.2%</div>
          <div className="mt-[2px] text-[11px] leading-[12px]" style={{ color: GRAPHITE }}>±3.6°</div>
        </div>
      </Panel>

      {/* shot rail summary -------------------------------------------------------------- */}
      <div className="mt-[5px] flex items-center px-[15px]">
        <span className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">SHOT RAIL SUMMARY</span>
        <Info className="ml-[6px] h-[12px] w-[12px]" strokeWidth={1.8} style={{ color: GRAPHITE }} />
      </div>
      <div className="mt-[2px] flex items-start px-[15px]">
        {RAIL.map(([p, v, tone], i) => (
          <React.Fragment key={p}>
            {i > 0 && <span aria-hidden="true" className="mt-[24px] h-[2px] min-w-[6px] flex-1" style={{ background: tone }} />}
            <span className="shrink-0 text-center">
              <PoseFigure phase={p.toLowerCase().startsWith("follow") ? "follow" : p.toLowerCase()} active={p === "RELEASE"} height={22} className="mx-auto" />
              <span className="mx-auto mt-[2px] block h-[8px] w-[8px] rounded-full" style={{ background: tone }} />
              <span className="shotiq-display mt-[3px] block whitespace-nowrap leading-[10px] tracking-[0.04em]"
                    style={{ fontSize: 8.6, color: p === "RELEASE" ? ORANGE : GRAPHITE }}>{p}</span>
              <span className="shotiq-numeric mt-[2px] block text-[13px] leading-[13px]" style={{ color: tone }}>{v}</span>
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-[4px] flex gap-[5px] px-[14px]">
        {RAIL.map(([p, , tone], i) => (
          <span key={p} className="block min-w-0 flex-1 overflow-hidden rounded-[3px]">
            <Frame src={`086-film-${i + 1}`} w="100%" h={74} radius={0} pos="50% 24%" alt={`${p} frame`} />
            <span className="shotiq-microcaps block py-[3px] text-center leading-[10px] text-white"
                  style={{ fontSize: 7.6, background: tone }}>{p}</span>
          </span>
        ))}
      </div>
    </ResultsScreen>
  )
}

function Caret() {
  return <svg width="9" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke={GRAPHITE} strokeWidth="1.4" /></svg>
}

function ArcTrend() {
  const vals = [67, 66, 69, 72, 68, 70, 73, 76, 75]
  const w = 200, h = 54
  const X = (i: number) => 26 + (i * (w - 32)) / (vals.length - 1)
  const Y = (v: number) => h - 8 - ((v - 60) / 22) * (h - 20)
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="block w-full" height={h - 12} aria-hidden="true">
      {[80, 70, 60].map((t, i) => (
        <g key={t}>
          <line x1="24" x2={w - 4} y1={8 + i * 19} y2={8 + i * 19} stroke={RULE} strokeWidth="1" />
          <text x="20" y={11 + i * 19} textAnchor="end" fontSize="7.6" fill={GRAPHITE}>{t}%</text>
        </g>
      ))}
      <polyline fill="none" stroke={GREEN} strokeWidth="1.5" points={vals.map((v, i) => `${X(i)},${Y(v)}`).join(" ")} />
      {vals.map((v, i) => <circle key={i} cx={X(i)} cy={Y(v)} r="2.4" fill={GREEN} />)}
    </svg>
  )
}

/** The 40°-60° release-arc gauge: a semicircular scale with the ideal band
 *  shaded and the average drawn as a needle. */
function ArcGauge() {
  return (
    <svg viewBox="0 0 170 74" className="block w-full" height={42} aria-hidden="true">
      <path d="M14 68 A71 71 0 0 1 156 68" fill="none" stroke="#D5D7D9" strokeWidth="1.4" />
      <path d="M85 68 L70 8 L100 8 Z" fill="rgba(253,55,1,.14)" />
      <path d="M30 68 A55 55 0 0 1 140 68" fill="none" stroke={ORANGE} strokeWidth="2.6" />
      <line x1="85" x2="85" y1="68" y2="12" stroke="#1B1B1B" strokeWidth="1.6" />
      {([["40°", 12, 62], ["45°", 34, 26], ["50°", 85, 8], ["55°", 136, 26], ["60°", 158, 62]] as [string, number, number][]).map(([t, x, y]) => (
        <text key={t} x={x} y={y} textAnchor="middle" fontSize="8" fill={GRAPHITE}>{t}</text>
      ))}
    </svg>
  )
}
