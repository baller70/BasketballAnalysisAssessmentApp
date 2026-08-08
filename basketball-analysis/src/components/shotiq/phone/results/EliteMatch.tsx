"use client"

/**
 * Canonical iOS 050-elite-match — your mechanics against a reference shooter.
 *
 * Round-6 grade A: "canonical's dual-portrait comparison card and 6-row
 * mechanics bars replaced by three dropdowns; 19 of 29 runs under 45px in the
 * phase picker." The dropdowns were the desktop compare controls; canonical's
 * phone screen has no picker at all — it opens on the match and offers
 * "Choose another shooter" as a row.
 *
 * Bands measured off canonical/050-elite-match.png (pt, /2.170483):
 *   wordmark, points, gear    y   7.8- 27.6   rule y 38
 *   back + title              y  49.3- 71.4   title cap 46-48px
 *   "Compare mechanics"       y  79.2- 87.5
 *   dual-portrait card        y 108.7-292.1
 *   two secondary rows        y 305.5-320.2
 *   MECHANICS COMPARISON      y 342.3-353.8   + You / Elite legend
 *   6 comparison rows         y 364.4-575.9   (pitch ~35.3pt)
 *   RELEASE FRAME MATCH       y 594.3-605.4
 *   7-frame strip             y 613.7-680.0   marker y 683.7
 *   target-alignment card     y 700.3-732.1
 *   SHOT RAIL                 y 746.8-792.0
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import { FileText, Users } from "@/components/shotiq/ApprovedLucide"
import { MechanicGlyph, PoseFigure, PointsGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, Panel, Micro, Chev, Frame, TickDisc,
  PHASE_STILLS, ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"

const ROWS: [MechanicKind, string, string, string, string, string][] = [
  ["height", "Release Height", "inches", "78.2", "78.6", "0.4\""],
  ["angle", "Release Angle", "degrees", "52°", "51°", "1°"],
  ["centerline", "Elbow Flexion", "degrees", "92°", "93°", "1°"],
  ["distance", "Shot Pocket", "inches", "12.1\"", "12.4\"", "0.3\""],
  ["jump", "Vertical Jump", "inches", "18.7\"", "19.1\"", "0.4\""],
  ["arc", "Release Time", "sec", "0.52", "0.50", "0.02"],
]

const RAIL: [string, string][] = [
  ["SETUP", BLUE], ["LOAD", BLUE], ["RISE", BLUE], ["RELEASE", ORANGE], ["FOLLOW-THROUGH", "#C9CBCD"],
]

export function EliteMatch({
  score = 82, elite = 94, match = 89, shared = "5", of = "6",
  shots = "24", makes = "15", pct = "62.5%",
  name, reference = "Elite Guard",
  onFrames,
}: {
  score?: number; elite?: number; match?: number; shared?: string; of?: string
  shots?: string; makes?: string; pct?: string
  name?: string; reference?: string; onFrames?: () => void
}) {
  const chrome = usePlayerChrome()

  return (
    <ResultsScreen
      testid="screen-ios-elite-match"
      tab="home"
      bar={
        <ResultsBar
          variant="wordmark" height={38}
          trailing={
            <>
              <span className="flex items-center gap-[6px]">
                <PointsGlyph size={20} />
                <span className="text-center">
                  <span className="shotiq-numeric block text-[17px] leading-[16px]">{chrome.points}</span>
                  <Micro size={8}>POINTS</Micro>
                </span>
              </span>
              <GearLink />
            </>
          }
        />
      }
    >
      {/* title ------------------------------------------------------------- */}
      <div className="mt-[10px] flex items-center gap-[10px] px-[15px]">
        <a href="/results/demo" aria-label="Back" className="rotate-180 shrink-0">
          <svg width="13" height="18" viewBox="0 0 13 18" aria-hidden="true"><path d="M2 2 L10 9 L2 16" fill="none" stroke={INK} strokeWidth="2" strokeLinecap="round" /></svg>
        </a>
        <h1 className="shotiq-display text-[30px] leading-[26px] tracking-[0.02em]">AI ANALYSIS 50 – ELITE MATCH</h1>
      </div>
      <div className="mt-[4px] px-[42px] text-[12.5px] leading-[13px]" style={{ color: GRAPHITE }}>Compare mechanics</div>

      {/* dual-portrait card ------------------------------------------------- */}
      <Panel className="mx-[14px] mt-[6px] flex gap-[6px] px-[9px] pb-[5px] pt-[5px]">
        <div className="w-[64px] shrink-0">
          <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.03em]">JORDAN</div>
          <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.03em]">ELLIS</div>
          <div className="mt-[2px] text-[9.5px] leading-[11px]" style={{ color: GRAPHITE }}>{chrome.sub}</div>
          <div className="shotiq-numeric mt-[6px] text-[27px] leading-[26px]" style={{ color: ORANGE }}>{score}</div>
          <Micro size={8}>FORM SCORE</Micro>
          {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "SHOOTING %"]] as [string, string][]).map(([v, l]) => (
            <div key={l} className="mt-[6px]">
              <div className="shotiq-numeric text-[20px] leading-[19px]">{v}</div>
              <Micro size={7.6}>{l}</Micro>
            </div>
          ))}
        </div>
        <Frame src="086-film-2" w={74} h={104} radius={4} pos="50% 20%" alt={`${name} at release`} className="shrink-0" />
        <div className="min-w-0 flex-1 text-center">
          <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.04em]">ELITE MATCH</div>
          <div className="shotiq-numeric leading-[0.86]" style={{ fontSize: 38, color: BLUE }}>
            {match}<span style={{ fontSize: 30 }}>%</span>
          </div>
          <div className="shotiq-display text-[15px] leading-[15px] tracking-[0.04em]" style={{ color: GRAPHITE }}>OVERALL<br />SIMILARITY</div>
          <span className="mx-auto mt-[7px] flex h-[8px] w-[86px] gap-[2px]">
            {[0, 1, 2, 3, 4].map((i) => (
              <span key={i} className="flex-1 rounded-[1px]" style={{ background: i < 4 ? BLUE : "#D8DADC" }} />
            ))}
          </span>
          <div className="shotiq-display mt-[7px] text-[15px] leading-[15px] tracking-[0.04em]">SHARED MECHANICS</div>
          <div className="shotiq-numeric text-[17px] leading-[18px]" style={{ color: BLUE }}>
            {shared} <span className="text-[11px]" style={{ color: GRAPHITE }}>OF</span> {of}
          </div>
        </div>
        <Frame src="086-film-5" w={74} h={104} radius={4} pos="50% 20%" alt={`${reference} at release`} className="shrink-0" />
        <div className="w-[64px] shrink-0 text-right">
          <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.03em]">ELITE<br />GUARD</div>
          <div className="mt-[2px] text-[9.5px] leading-[11px]" style={{ color: GRAPHITE }}>Reference Profile</div>
          <div className="shotiq-numeric mt-[6px] text-[27px] leading-[26px]" style={{ color: BLUE }}>{elite}</div>
          <Micro size={8}>FORM SCORE</Micro>
        </div>
      </Panel>

      {/* two rows ------------------------------------------------------------- */}
      <div className="mt-[5px] flex gap-[10px] px-[14px]">
        <Panel className="flex h-[28px] flex-1 items-center px-[11px]">
          <FileText className="h-[15px] w-[15px]" strokeWidth={1.6} />
          <span className="ml-[9px] text-[13.5px] leading-[15px]">View elite profile</span>
          <span className="ml-auto"><Chev size={13} /></span>
        </Panel>
        <Panel className="flex h-[28px] flex-1 items-center px-[11px]">
          <Users className="h-[15px] w-[15px]" strokeWidth={1.6} />
          <span className="ml-[9px] text-[13.5px] leading-[15px]">Choose another shooter</span>
          <span className="ml-auto"><Chev size={13} /></span>
        </Panel>
      </div>

      {/* mechanics comparison --------------------------------------------------- */}
      <div className="mt-[6px] flex items-center px-[15px]">
        <span className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">MECHANICS COMPARISON</span>
        <span className="ml-auto flex items-center gap-[11px] text-[11.5px]">
          <span className="flex items-center gap-[4px]"><Dot c={ORANGE} />You</span>
          <span className="flex items-center gap-[4px]"><Dot c={BLUE} />Elite</span>
        </span>
      </div>
      <div className="mt-[2px] px-[15px]">
        {ROWS.map(([kind, label, unit, you, ref_, diff]) => (
          <div key={label} className="flex items-center gap-[9px] border-t py-[2px]" style={{ borderColor: RULE }}>
            <span className="shrink-0" style={{ color: INK }}><MechanicGlyph kind={kind} size={26} accent={INK} /></span>
            <span className="w-[82px] shrink-0">
              <span className="block text-[12.5px] font-medium leading-[14px]">{label}</span>
              <span className="block text-[10.5px] leading-[12px]" style={{ color: GRAPHITE }}>{unit}</span>
            </span>
            <span className="shotiq-numeric w-[36px] shrink-0 text-right text-[16px]" style={{ color: ORANGE }}>{you}</span>
            <span className="relative block min-w-0 flex-1">
              <span aria-hidden="true" className="block h-px w-full" style={{ background: "#D8DADC" }} />
              <span aria-hidden="true" className="absolute left-0 top-[-3px] h-[3px] w-[52%] rounded-full" style={{ background: ORANGE }} />
              <span aria-hidden="true" className="absolute left-[52%] top-[-6px] h-[12px] w-px" style={{ background: INK }} />
              <span aria-hidden="true" className="absolute left-[52%] top-[2px] h-[3px] w-[22%] rounded-full" style={{ background: BLUE }} />
            </span>
            <span className="shotiq-numeric w-[34px] shrink-0 text-[16px]" style={{ color: BLUE }}>{ref_}</span>
            <span className="w-[34px] shrink-0 text-center">
              <span className="shotiq-numeric block text-[13px] leading-[13px]">{diff}</span>
              <Micro size={7.4}>DIFF</Micro>
            </span>
            <TickDisc size={15} />
          </div>
        ))}
      </div>

      {/* release-frame match ------------------------------------------------------ */}
      <div className="mt-[5px] flex items-center px-[14px]">
        <span className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">RELEASE FRAME MATCH</span>
        <span className="ml-auto flex items-center gap-[6px] text-[11px]" style={{ color: GRAPHITE }}>
          Average frame alignment
          <span className="shotiq-numeric text-[12px]" style={{ color: GREEN }}>±2°</span>
          <TickDisc size={13} />
        </span>
      </div>
      <button type="button" onClick={onFrames} data-testid="elite-frames"
              className="mt-[5px] block w-full px-[14px]">
        <span className="flex gap-[3px]">
          {[...PHASE_STILLS, "086-film-6", "086-film-1"].map((s, i) => (
            <span key={`${s}-${i}`} className="relative block min-w-0 flex-1 overflow-hidden rounded-[3px]" style={{ height: 58 }}>
              <Frame src={s} w="100%" h="100%" radius={0} pos="50% 22%" />
              {i === 3 && <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 2.5px ${ORANGE}` }} />}
            </span>
          ))}
        </span>
        <span aria-hidden="true" className="mx-auto mt-[2px] block h-0 w-0"
              style={{ borderLeft: "6px solid transparent", borderRight: "6px solid transparent", borderBottom: `7px solid ${ORANGE}` }} />
      </button>

      {/* target alignment ------------------------------------------------------------ */}
      <Panel className="mx-[14px] mt-[5px] flex items-center px-[12px] py-[4px]">
        <span className="min-w-0">
          <span className="shotiq-section-label block text-[11.5px] leading-[12px] tracking-[0.08em]">PRIMARY COACHING TARGET ALIGNMENT</span>
          <span className="mt-[4px] block truncate text-[16px] font-semibold leading-[18px]">Keep elbow stacked through release</span>
        </span>
        <span className="ml-auto shrink-0 pl-[10px] text-right">
          <span className="flex items-center gap-[5px]">
            <span className="shotiq-display text-[19px] leading-[19px] tracking-[0.04em]" style={{ color: GREEN }}>ON TRACK</span>
            <TickDisc size={15} />
          </span>
          <span className="mt-[2px] block text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>91% match</span>
        </span>
      </Panel>

      {/* shot rail --------------------------------------------------------------------- */}
      <div className="mt-[5px] flex items-start gap-[9px] px-[15px]">
        <span className="shotiq-display shrink-0 pt-[22px] text-[15px] leading-[15px] tracking-[0.05em]" style={{ color: GRAPHITE }}>SHOT RAIL</span>
        <span className="flex min-w-0 flex-1 items-start">
          {RAIL.map(([p, tone], i) => (
            <React.Fragment key={p}>
              {i > 0 && (
                <span aria-hidden="true" className="mt-[22px] h-px min-w-[6px] flex-1"
                      style={{ backgroundImage: "repeating-linear-gradient(to right,#B9BCBF 0 3px,transparent 3px 6px)" }} />
              )}
              <span className="shrink-0 text-center">
                <PoseFigure phase={p.toLowerCase().startsWith("follow") ? "follow" : p.toLowerCase()} active={p === "RELEASE"} height={26} className="mx-auto" />
                <span className="shotiq-display mt-[2px] block whitespace-nowrap leading-[10px] tracking-[0.04em]"
                      style={{ fontSize: 9, color: p === "RELEASE" ? ORANGE : GRAPHITE }}>{p}</span>
                <span className="mt-[4px] flex justify-center">
                  {tone === ORANGE
                    ? <span className="h-[13px] w-[13px] rounded-full" style={{ background: ORANGE }} />
                    : tone === "#C9CBCD"
                      ? <span className="h-[13px] w-[13px] rounded-full" style={{ background: "#C9CBCD" }} />
                      : <TickDisc size={13} tone={BLUE} />}
                </span>
              </span>
            </React.Fragment>
          ))}
        </span>
      </div>
    </ResultsScreen>
  )
}

function Dot({ c }: { c: string }) {
  return <span className="block h-[7px] w-[7px] rounded-full" style={{ background: c }} />
}
