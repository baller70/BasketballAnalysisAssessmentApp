"use client"

/**
 * Canonical iOS 041-shot-breakdown — one shot, phase by phase.
 *
 * Round-6 grade A: "renders 038's overview route; canonical's per-shot
 * breakdown does not exist." It is now its own surface, reached from 038's
 * "View shot breakdown" CTA and from the ANALYSIS tab.
 *
 * Bands measured off canonical/041-shot-breakdown.png (pt, /2.170483):
 *   back / wordmark / share   y  10.6- 25.8   rule y 38
 *   SHOT BREAKDOWN + cluster  y  52.5- 88.9   title cap 79px
 *   "Shot 41 • Today ..."     y  91.7-100.9
 *   5-frame filmstrip         y 113.8-333.6   x 16-376  (h 219.8)
 *   phase captions            y 344.2-353.8   x 39-370
 *   form-score card           y 390.2-457.0
 *   4 mechanic glyphs         y 486.5-508.6
 *     labels 519.7  values 535.4  verdicts 559.3
 *   phase-coaching card       y 607.2-686.0
 *     "Open release frame"    y 698.0-709.1
 *   SHOT CONTEXT              y 737.6-745.5
 *   context row               y 752.8-772.2
 */

import React from "react"
import { Clock, MapPin } from "lucide-react"
import { MechanicGlyph, PoseFigure, ActionGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, ShareIcon, Panel, Micro, ScoreBar, Chev, Frame,
  PHASE_STILLS, capDisplay, ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK, TickDisc,
} from "./Kit"
import { StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const ANGLES = ["", "107°", "134°", "161°", ""]

const MECHANICS: [MechanicKind, string, string, string][] = [
  ["height", "ARC HEIGHT", "7.5", "FT"],
  ["angle", "RELEASE ANGLE", "52°", ""],
  ["drift", "SIDE SPIN", "6°", "R"],
  ["arc", "FLIGHT TIME", "0.79", "SEC"],
]

export function ShotBreakdown({
  score = 82, shot = "41", when = "Today at 8:24 AM", streak = "6", points = "2,840",
  onScore,
}: {
  score?: number; shot?: string; when?: string; streak?: string; points?: string
  onScore?: () => void
}) {
  return (
    <ResultsScreen
      testid="screen-ios-shot-breakdown"
      tab="home"
      bar={<ResultsBar variant="back-wordmark" height={38} backHref="/results/demo" trailing={<ShareIcon />} />}
    >
      {/* title + stat cluster ------------------------------------------- */}
      <div className="mt-[11px] flex items-start justify-between px-[19px]">
        <div className="min-w-0">
          <div className="shotiq-display whitespace-nowrap text-[36px] leading-[32px] tracking-[0.02em]">SHOT BREAKDOWN</div>
          <div className="mt-[5px] text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>
            Shot {shot} &nbsp;•&nbsp; {when}
          </div>
        </div>
        <div className="flex shrink-0 items-start pt-[2px]">
          <div className="w-[74px] text-center">
            <span className="flex h-[19px] items-center justify-center"><StreakGlyph size={39} /></span>
            <div className="shotiq-numeric mt-[3px] text-[19px] leading-[16px]">{streak}</div>
            <Micro className="mt-[4px]">DAY STREAK</Micro>
          </div>
          <span aria-hidden="true" className="mx-[6px] h-[48px] w-px" style={{ background: RULE }} />
          <div className="w-[58px] text-center">
            <span className="flex h-[19px] items-center justify-center"><PointsGlyph size={21} /></span>
            <div className="shotiq-numeric mt-[3px] text-[19px] leading-[16px]">{points}</div>
            <Micro className="mt-[4px]">POINTS</Micro>
          </div>
        </div>
      </div>

      {/* filmstrip: five phase frames, each carrying its joint angle ----- */}
      <div className="mt-[11px] px-[16px]">
        <div className="overflow-hidden rounded-[5px] border" style={{ borderColor: RULE }}>
          <div className="flex">
            {PHASE_STILLS.map((s, i) => (
              <div key={s} className="relative min-w-0 flex-1 border-l first:border-l-0" style={{ height: 205, borderColor: "rgba(255,255,255,.55)" }}>
                <Frame src={s} w="100%" h="100%" radius={0} pos="50% 30%" alt={`${PHASES[i]} frame`} />
                {ANGLES[i] && (
                  <span className="shotiq-numeric absolute left-[6px] top-[38%] text-[11px] leading-[11px]"
                        style={{ color: i === 3 ? ORANGE : "#fff", textShadow: "0 1px 2px rgba(0,0,0,.55)" }}>
                    {ANGLES[i]}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex border-t" style={{ borderColor: RULE }}>
            {PHASES.map((p, i) => (
              <div key={p} className="min-w-0 flex-1 border-l py-[6px] text-center first:border-l-0" style={{ borderColor: RULE }}>
                <span className="shotiq-display block leading-[10px] tracking-[0.04em]"
                      style={{ fontSize: capDisplay(21), color: i === 3 ? ORANGE : INK }}>{p}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* form score + the four ball-flight mechanics -------------------- */}
      <Panel className="mx-[16px] mt-[11px]" data-testid="breakdown-form-score">
        <button type="button" onClick={onScore} className="flex w-full items-start px-[13px] pb-[10px] pt-[11px] text-left">
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label text-[12.5px] leading-[13px] tracking-[0.075em]">FORM SCORE</div>
            <div className="flex items-end gap-[11px]">
              <span className="shotiq-numeric leading-[0.78]" style={{ fontSize: 66, color: ORANGE }}>{score}</span>
              <span className="pb-[13px]"><ScoreBar score={score} width={118} height={7} /></span>
            </div>
          </div>
          <div className="w-[122px] shrink-0 pl-[8px] pt-[13px]">
            <div className="shotiq-display text-[17px] leading-[17px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
            <div className="mt-[4px] text-[12.5px] leading-[14.5px]">Keep building<br />consistency.</div>
          </div>
        </button>
        <div className="flex divide-x border-t py-[7px]" style={{ borderColor: RULE, ["--tw-divide-opacity" as string]: 1 }}>
          {MECHANICS.map(([kind, label, value, unit]) => (
            <div key={label} className="min-w-0 flex-1 px-[4px] text-center" style={{ borderColor: RULE }}>
              <span className="flex h-[24px] items-center justify-center" style={{ color: INK }}>
                <MechanicGlyph kind={kind} size={24} accent={INK} />
              </span>
              <Micro className="mt-[7px]" size={8}>{label}</Micro>
              <div className="shotiq-numeric mt-[6px] text-[22px] leading-[18px]">
                {value}{unit && <span className="ml-[2px] text-[11px]">{unit}</span>}
              </div>
              <div className="shotiq-display mt-[6px] text-[12px] leading-[10px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* phase coaching -------------------------------------------------- */}
      <Panel className="mx-[16px] mt-[9px] px-[13px] pb-[8px] pt-[8px]">
        <div className="flex gap-[10px]">
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label text-[12px] leading-[12px] tracking-[0.08em]">PHASE COACHING</div>
            <div className="mt-[5px] flex items-center gap-[9px]">
              <span className="text-[23px] font-semibold leading-[24px]">Release</span>
              <PoseFigure phase="release" active height={30} />
            </div>
            <span aria-hidden="true" className="mt-[3px] block h-[2px] w-[46px]" style={{ background: ORANGE }} />
            <p className="mt-[6px] text-[12.5px] leading-[14px]">
              Great elevation and alignment. Focus on snapping wrist down to create more backspin.
            </p>
          </div>
          <div className="relative w-[114px] shrink-0">
            <ReleaseHandDiagram />
            <span className="absolute bottom-[2px] right-0 rounded-[4px] border px-[6px] py-[3px] text-center"
                  style={{ borderColor: RULE }}>
              <span className="shotiq-numeric block text-[16px] leading-[16px]" style={{ color: ORANGE }}>161°</span>
              <span className="block text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>Release<br />Angle</span>
            </span>
          </div>
        </div>
        <Panel className="mt-[6px] flex h-[26px] w-[190px] items-center px-[10px]">
          <ActionGlyph kind="analyze" height={15} />
          <span className="ml-[9px] text-[13.5px] leading-[15px]">Open release frame</span>
          <span className="ml-auto"><Chev size={12} /></span>
        </Panel>
      </Panel>

      {/* shot context ---------------------------------------------------- */}
      <Panel className="mx-[16px] mt-[9px] px-[10px] pb-[7px] pt-[7px]">
        <div className="shotiq-section-label text-[12px] leading-[12px] tracking-[0.08em]">SHOT CONTEXT</div>
        <div className="mt-[6px] flex divide-x divide-[var(--shotiq-color-rule)]">
          {([
            [<ActionGlyph key="a" kind="nodeGraph" height={16} />, "Catch & Shoot", "Shot Type", INK],
            [<MapPin key="b" className="h-[17px] w-[17px]" strokeWidth={1.6} />, "Right Corner", "Court Location", INK],
            [<Clock key="c" className="h-[17px] w-[17px]" strokeWidth={1.6} />, "26:12", "In Workout", INK],
            [<TickDisc key="d" size={17} tone={GREEN} />, "Make", "Result", GREEN],
          ] as [React.ReactNode, string, string, string][]).map(([g, v, l, c]) => (
            <div key={l} className="flex min-w-0 flex-1 items-center gap-[6px] px-[6px]">
              <span className="shrink-0" style={{ color: INK }}>{g}</span>
              <span className="min-w-0">
                <span className="block truncate text-[12.5px] font-semibold leading-[14px]" style={{ color: c }}>{v}</span>
                <span className="block truncate text-[10.5px] leading-[12px]" style={{ color: GRAPHITE }}>{l}</span>
              </span>
            </div>
          ))}
        </div>
      </Panel>
    </ResultsScreen>
  )
}

/** Canonical draws the release hand as a line diagram with the wrist arc
 *  dashed in the accent — not a node graph. */
function ReleaseHandDiagram() {
  return (
    <svg viewBox="0 0 128 96" width="114" height="86" fill="none" aria-hidden="true" className="block">
      <g stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M40 92 L52 44 C55 32 62 22 72 16" />
        <path d="M52 44 C58 34 68 26 80 22" />
        <path d="M72 16 C80 8 92 6 100 12 C106 16 106 24 100 27" />
        <path d="M100 12 C108 10 116 14 114 22 C113 27 108 30 102 30" />
        <path d="M102 30 C110 30 114 36 110 41 C107 45 100 46 94 44" />
        <path d="M94 44 C100 46 102 52 98 56 C94 60 86 60 80 56" />
      </g>
      <circle cx="72" cy="16" r="4" fill={ORANGE} />
      <circle cx="52" cy="44" r="3" fill="#3A3A3A" />
      <path d="M72 20 C64 30 58 44 60 58" stroke={ORANGE} strokeWidth="1.4" strokeDasharray="3 3" fill="none" />
      <path d="M60 58 L74 58" stroke={ORANGE} strokeWidth="1.4" strokeDasharray="3 3" />
    </svg>
  )
}
