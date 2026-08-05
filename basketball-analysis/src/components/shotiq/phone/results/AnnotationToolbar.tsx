"use client"

/**
 * Canonical iOS 043-annotation-toolbar — drawing on a frame.
 *
 * Round-6 grade A: "no annotation toolbar of any kind. Green 30.7‰ -> 1.1‰."
 * The deep-green confirm role is the CTA on this screen and was absent from the
 * whole build; it is `--shotiq-color-confirmGreen`, not a new token.
 *
 * Bands measured off canonical/043-annotation-toolbar.png (pt, /2.170483):
 *   wordmark / gear      y  10.1- 27.2   rule y 38
 *   "Back | ANALYSIS — ANNOTATION | Frame 43 / 96"   y 47.9- 59.9, rule y 70
 *   identity             y  85.7-126.2
 *   stat row             labels y 133.6-147.0, values y 154.8-168.2
 *   primary-target card  y 186.6-212.4
 *   annotation canvas    y 229.4-602.6   x 15-375   (h 373.2)
 *   phase rail           figures y 608.2-633.0, labels 636.7, rule 648.2
 *   ANNOTATION TOOLS     y 662.5-673.1
 *   7 tool cards         glyphs y 692.5-711.8, labels y 722.0-729.8
 *   green confirm CTA    y 747.8-777.7   (29.9pt)
 */

import React from "react"
import { Pause, SkipBack, SkipForward, Type as TypeIcon, Undo2, Redo2, Trash2, ArrowUpRight } from "lucide-react"
import { MechanicGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, Panel, Micro, PhaseRail, PrimaryBar,
  Frame, SkeletonOverlay, ORANGE, BLUE, GRAPHITE, RULE, INK,
  StreakPoints,
} from "./Kit"

const TOOLS: [string, React.ReactNode, boolean][] = [
  ["Draw", <MechanicGlyph key="d" kind="angle" size={19} accent={ORANGE} />, false],
  ["Arrow", <ArrowUpRight key="a" className="h-[19px] w-[19px]" strokeWidth={1.8} />, false],
  ["Angle", <AngleMark key="g" />, false],
  ["Label", <TypeIcon key="t" className="h-[18px] w-[18px]" strokeWidth={1.8} />, false],
  ["Undo", <Undo2 key="u" className="h-[19px] w-[19px]" strokeWidth={1.8} />, false],
  ["Redo", <Redo2 key="r" className="h-[19px] w-[19px]" strokeWidth={1.8} />, true],
  ["Clear", <Trash2 key="c" className="h-[18px] w-[18px]" strokeWidth={1.8} />, false],
]

function AngleMark() {
  return (
    <svg width="19" height="19" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 17 L3 3 L17 17 Z" stroke={ORANGE} strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M3 12 A5 5 0 0 0 8 17" stroke={ORANGE} strokeWidth="1.2" />
    </svg>
  )
}

export function AnnotationToolbar({
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  frame = 43, frames = 96, name = "Jordan Ellis", streak = "6", points = "2,840",
  onBack, onSave,
}: {
  score?: number; shots?: string; makes?: string; pct?: string
  frame?: number; frames?: number; name?: string; streak?: string; points?: string
  onBack?: () => void; onSave?: () => void
}) {
  return (
    <ResultsScreen
      testid="screen-ios-annotation-toolbar"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={38} trailing={<GearLink />} />}
    >
      {/* screen title row ------------------------------------------------ */}
      <div className="mt-[10px] flex items-center px-[17px]">
        <button type="button" onClick={onBack} className="flex shrink-0 items-center gap-[6px]">
          <span className="rotate-180"><svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true"><path d="M1.5 1.5 L7 7.5 L1.5 13.5" fill="none" stroke={INK} strokeWidth="1.7" strokeLinecap="round" /></svg></span>
          <span className="text-[15px] leading-[16px]">Back</span>
        </button>
        <span className="shotiq-display absolute left-1/2 -translate-x-1/2 text-[20px] leading-[20px] tracking-[0.045em]">
          ANALYSIS — ANNOTATION
        </span>
        <span className="ml-auto text-[13px] leading-[14px]" style={{ color: GRAPHITE }}>Frame {frame} / {frames}</span>
      </div>
      <span aria-hidden="true" className="mt-[8px] block h-px" style={{ background: RULE }} />

      {/* identity + stat row --------------------------------------------- */}
      <div className="mt-[10px] flex items-start justify-between px-[16px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[34px] leading-[33px] tracking-[0.045em]">{name.toUpperCase()}</div>
          <div className="mt-[2px] text-[11.6px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
        </div>
        <StreakPoints streak={streak} points={points} />
      </div>

      <div className="mt-[4px] flex divide-x divide-[var(--shotiq-color-rule)] px-[16px]">
        {([[String(score), "FORM SCORE"], [shots, "SHOTS"], [makes, "MAKES"], [pct, "%"]] as [string, string][]).map(([v, l], i) => (
          <div key={l} className={`${i === 0 ? "w-[82px]" : "w-[64px]"} shrink-0 text-center`}>
            <Micro size={8.4}>{l}</Micro>
            <div className="shotiq-numeric mt-[6px] text-[23px] leading-[22px]">{v}</div>
          </div>
        ))}
      </div>

      {/* primary target -------------------------------------------------- */}
      <Panel className="mx-[15px] mt-[6px] flex items-center gap-[11px] px-[12px] py-[4px]"
             style={{ background: "var(--shotiq-color-warmCanvas)" }}>
        <MechanicGlyph kind="angle" size={30} accent={ORANGE} />
        <span className="min-w-0">
          <span className="shotiq-microcaps block text-[8.6px] leading-[10px]" style={{ color: GRAPHITE }}>PRIMARY TARGET</span>
          <span className="mt-[3px] block truncate text-[14.5px] leading-[16px]" style={{ color: ORANGE }}>
            Keep elbow stacked through release.
          </span>
        </span>
      </Panel>

      {/* annotation canvas ----------------------------------------------- */}
      <div data-testid="annotation-canvas" className="relative mx-[15px] mt-[7px] h-[366px] overflow-hidden rounded-[6px]">
        <Frame src="086-film-4" w="100%" h="100%" radius={0} pos="50% 20%" alt={`Frame ${frame}, annotated`} />
        <SkeletonOverlay />
        {/* the two measured angles canonical draws on the canvas */}
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="pointer-events-none absolute inset-0 h-full w-full" aria-hidden="true">
          <path d="M64 22 V44" stroke={ORANGE} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d="M64 44 H76" stroke={ORANGE} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d="M70 22 V96" stroke={BLUE} strokeWidth="1" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
          <path d="M36 62 H52" stroke={BLUE} strokeWidth="1" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          {/* Canonical fills the knee angle between that dashed baseline and the
              thigh: a wedge measured at x152.0-202.3pt, y460.7-468.5pt (110x18
              device px, 890px of ink). It was missing entirely. */}
          <path d="M38 61.9 L52 61.9 Q 45 59.6 38 61.9 Z" fill={BLUE} />
        </svg>
        {/* Angle read-outs, measured on canonical/043 inside the canvas box
            (x15-375pt, y229.4-595.4pt): 47° cap 11.5pt at x263.5-280.6 /
            y310.1-321.1; 166° cap 15.2pt at x148.8-190.3 / y445.5-460.3. The
            166° was shipping at cap 11.1 — a third short of canonical. */}
        <span className="shotiq-numeric absolute left-[68%] top-[22%] text-[16px]" style={{ color: ORANGE }}>47°</span>
        <span className="shotiq-numeric absolute left-[37%] top-[57%] text-[21px]" style={{ color: BLUE }}>166°</span>
        <span className="absolute left-[9px] top-[9px] flex items-center gap-[6px] rounded-[6px] px-[9px] py-[5px] text-[12px] text-white"
              style={{ background: "rgba(28,28,28,.85)" }}>
          <span className="h-[6px] w-[6px] rounded-full bg-white" />LIVE
        </span>
        {/* The "Stacked" confirm pill is the single largest blue region on this
            screen and it was drawn half again too big: measured 94.4 x 33.2pt
            against canonical's 62.7 x 18.9pt (canonical/043, pill bbox
            x266.8-329.0pt, y460.3-478.7pt; white label cap 7.4pt over a 47.9pt
            advance, against 10.6 / 65.0 shipped). That one element carried the
            screen's blue from canonical's 3.8‰ to 6.2‰. */}
        <span className="absolute bottom-[117px] right-[49px] flex items-center gap-[4px] rounded-full px-[7px] py-[4px] text-[10px] leading-[11px] text-white"
              style={{ background: BLUE }}>
          Stacked
          <svg width="8" height="7" viewBox="0 0 12 12" aria-hidden="true"><path d="M2 6.4 L4.8 9 L10 3.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
        </span>
        <span className="shotiq-numeric absolute bottom-[10px] left-[9px] rounded-[5px] px-[9px] py-[5px] text-[13px] text-white"
              style={{ background: "rgba(28,28,28,.85)" }}>00:01.28</span>
        <span className="absolute bottom-[10px] right-[9px] flex items-center gap-[16px] rounded-[7px] px-[14px] py-[7px]"
              style={{ background: "rgba(38,38,38,.86)" }}>
          <SkipBack className="h-[14px] w-[14px] text-white" fill="#fff" strokeWidth={1} />
          <Pause className="h-[17px] w-[17px] text-white" fill="#fff" strokeWidth={1} />
          <SkipForward className="h-[14px] w-[14px] text-white" fill="#fff" strokeWidth={1} />
        </span>
      </div>

      <PhaseRail className="mt-[7px] px-[15px]" active="RELEASE" figure={26} label={9} />

      {/* annotation tools ------------------------------------------------ */}
      <div data-testid="annotation-toolbar" className="mt-[8px] px-[15px]">
        <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.05em]" style={{ color: GRAPHITE }}>
          ANNOTATION TOOLS
        </div>
        <div className="mt-[7px] flex gap-[6px]">
          {TOOLS.map(([label, glyph, disabled]) => (
            <Panel key={label} className="min-w-0 flex-1 py-[6px] text-center" style={disabled ? { opacity: 0.42 } : undefined}>
              <span className="flex h-[19px] items-center justify-center" style={{ color: INK }}>{glyph}</span>
              <span className="mt-[7px] block text-[11.5px] leading-[12px]">{label}</span>
            </Panel>
          ))}
        </div>
      </div>

      <div className="mt-[7px] px-[15px]">
        <PrimaryBar testid="annotations-save" tone="green" className="!h-[30px]" onClick={onSave}>
          Save annotations
        </PrimaryBar>
      </div>
    </ResultsScreen>
  )
}
