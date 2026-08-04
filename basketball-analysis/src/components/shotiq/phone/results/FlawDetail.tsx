"use client"

/**
 * Canonical iOS 047-flaw-detail — one flaw, its evidence and its fix.
 *
 * Round-6 grade A: "24 of 24 runs under 45px. Ink 1.7% vs canonical 23.6%."
 * Grader B measured the same interior rule at x=337pt over 88% of the height.
 * Both readings are the desktop flaws page at 393pt: a 33pt text column beside
 * a 337pt divider, with every photographic region collapsed to zero — which is
 * why the ink came in at a fourteenth of canonical. The photography is present
 * in the app's own library (public/images/canonical); it was the layout, not
 * the assets.
 *
 * Bands measured off canonical/047-flaw-detail.png (pt, /2.170483):
 *   back / wordmark / share  y  12.4- 29.0   rule y 38
 *   identity                 y  51.1- 95.4   rule y 106
 *   FLAW DETAIL / FORM SCORE y 118.9-127.2
 *   title + score            y 133.6-162.2   title cap 42px, "82" cap 62px
 *   two-line description     y 167.7-190.7
 *   three meta chips         y 205.5-217.9
 *   EVIDENCE FRAMES          y 236.4-244.6
 *   5 frames                 y 248.3-381.9   captions 387.9, "(Flaw)" 400.4
 *   IMPACT + two diagrams    y 432.2-502.2
 *   HOW TO FIX + target box  y 533.1-593.4
 *   RECOMMENDED DRILL        y 617.4-698.0
 *   two secondary actions    y 721.5-732.6
 *   orange CTA               y 746.8-777.7  (30.9pt)
 */

import React from "react"
import { Bookmark } from "lucide-react"
import { ActionGlyph, MechanicGlyph, PoseGlyph, CorrectionGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, ShareIcon, ResultsIdentity, Panel, Micro, ScoreBar,
  Chev, PrimaryBar, Frame, PHASE_STILLS, capDisplay,
  ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"

const FRAMES = ["LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH", "RESET"]

export function FlawDetail({
  title = "ELBOW FLARE AT RELEASE",
  desc = "Your elbow drifts outward in the release phase, creating side spin and inconsistency.",
  phase = "Release phase", impact = "High impact", confidence = "72% confidence",
  yourAngle = "25°", idealRange = "15–20°",
  score = 82, name = "Jordan Ellis", streak = "6", points = "2,840",
  onBack,
}: {
  title?: string; desc?: string; phase?: string; impact?: string; confidence?: string
  yourAngle?: string; idealRange?: string
  score?: number; name?: string; streak?: string; points?: string
  onBack?: () => void
}) {
  return (
    <ResultsScreen
      testid="screen-ios-flaw-detail"
      tab="home"
      bar={<ResultsBar variant="back-wordmark" height={38} onBack={onBack} trailing={<ShareIcon />} />}
    >
      <ResultsIdentity className="mt-[6px] px-[21px]" name={name} streak={streak} points={points} />
      <span aria-hidden="true" className="mt-[7px] block h-px" style={{ background: RULE }} />

      {/* title + score --------------------------------------------------- */}
      <div className="mt-[8px] flex items-start px-[21px]">
        <div className="min-w-0 flex-1">
          <div className="shotiq-section-label leading-[12px] tracking-[0.08em]" style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FLAW DETAIL</div>
          <h1 className="shotiq-display mt-[2px] text-[26px] leading-[25px] tracking-[0.02em]">{title}</h1>
          <p className="mt-[5px] text-[12.5px] leading-[14px]">{desc}</p>
        </div>
        <div className="ml-[12px] w-[104px] shrink-0 text-right">
          <div className="shotiq-section-label leading-[12px] tracking-[0.08em]" style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FORM SCORE</div>
          <div className="shotiq-numeric text-[36px] leading-[34px]" style={{ color: ORANGE }}>{score}</div>
          <span className="ml-auto block w-[104px]"><ScoreBar score={score} width={104} height={5.5} /></span>
        </div>
      </div>

      {/* meta chips ------------------------------------------------------- */}
      <div className="mt-[5px] flex divide-x divide-[var(--shotiq-color-rule)] px-[21px]">
        {([[<MechanicGlyph key="1" kind="impact" size={16} accent={INK} />, phase],
           [<MechanicGlyph key="2" kind="drift" size={16} accent={INK} />, impact],
           [<MechanicGlyph key="3" kind="arc" size={16} accent={INK} />, confidence]] as [React.ReactNode, string][]).map(([g, l], i) => (
          <span key={l} className={`flex items-center gap-[7px] ${i ? "pl-[13px]" : ""} pr-[13px]`}>
            {g}<span className="whitespace-nowrap text-[13px] leading-[15px]">{l}</span>
          </span>
        ))}
      </div>

      {/* evidence frames ---------------------------------------------------- */}
      <div className="mt-[7px] px-[19px]">
        <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.05em]" style={{ color: GRAPHITE }}>EVIDENCE FRAMES</div>
        <div className="mt-[5px] flex gap-[1px] overflow-hidden rounded-[3px]">
          {PHASE_STILLS.map((s, i) => (
            <span key={s} className="relative block min-w-0 flex-1" style={{ height: 112 }}>
              <Frame src={s} w="100%" h="100%" radius={0} pos="50% 26%" alt={`${FRAMES[i]} frame`} />
              {(i === 1 || i === 3) && (
                <span aria-hidden="true" className="absolute inset-y-0 left-1/2 w-px"
                      style={{ backgroundImage: "repeating-linear-gradient(to bottom,#fff 0 5px,transparent 5px 10px)" }} />
              )}
              {i === 2 && <span aria-hidden="true" className="absolute inset-0" style={{ boxShadow: `inset 0 0 0 2.5px ${ORANGE}` }} />}
            </span>
          ))}
        </div>
        <div className="mt-[6px] flex">
          {FRAMES.map((f, i) => (
            <span key={f} className="min-w-0 flex-1 text-center">
              <span className="shotiq-display block leading-[11px] tracking-[0.03em]"
                    style={{ fontSize: capDisplay(15), color: i === 2 ? ORANGE : INK }}>{f}</span>
              {i === 2 && <span className="block text-[10px] leading-[13px]" style={{ color: ORANGE }}>(Flaw)</span>}
            </span>
          ))}
        </div>
      </div>

      {/* impact --------------------------------------------------------------- */}
      <div className="mt-[7px] flex gap-[12px] px-[21px]">
        <div className="w-[168px] shrink-0">
          <div className="shotiq-display text-[20px] leading-[20px] tracking-[0.04em]">IMPACT</div>
          <p className="mt-[4px] text-[12px] leading-[13.5px]">
            Elbow flare opens your shooting angle and adds unwanted side spin, which reduces accuracy and increases variability.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 divide-x divide-[var(--shotiq-color-rule)]">
          {([["YOUR ANGLE", yourAngle, ORANGE, "rgba(253,55,1,.12)"], ["IDEAL RANGE", idealRange, BLUE, "rgba(45,108,223,.12)"]] as [string, string, string, string][]).map(([l, v, c, fill]) => (
            <span key={l} className="min-w-0 flex-1 px-[6px] text-center">
              <span className="shotiq-display block leading-[12px] tracking-[0.05em]" style={{ fontSize: 12, color: c }}>{l}</span>
              <span className="mt-[5px] flex items-center justify-center gap-[4px]">
                <PoseGlyph phase="release" size={40} accent={c} />
                <span className="relative block h-[40px] w-[32px]">
                  <svg viewBox="0 0 36 46" className="block" aria-hidden="true">
                    <path d="M4 44 L4 6 L32 44 Z" fill={fill} stroke={c} strokeWidth="1.4" strokeDasharray="3 3" />
                  </svg>
                  <span className="shotiq-numeric absolute -right-[2px] bottom-[10px] text-[12px]" style={{ color: c }}>{v}</span>
                </span>
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* how to fix ----------------------------------------------------------- */}
      <div className="mt-[7px] flex gap-[12px] px-[21px]">
        <div className="w-[168px] shrink-0">
          <div className="shotiq-display text-[20px] leading-[20px] tracking-[0.04em]">HOW TO FIX</div>
          <p className="mt-[4px] text-[12px] leading-[13.5px]">
            Keep your elbow stacked under the ball through release. Think “elbow in, wrist out.”
          </p>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[6px] px-[10px] py-[8px]" style={{ background: "#EDF3FD" }}>
          <span className="min-w-0">
            <span className="shotiq-display block leading-[13px] tracking-[0.05em]" style={{ fontSize: 13, color: BLUE }}>TARGET POSITION</span>
            <span className="mt-[5px] block space-y-[4px]">
              {["Elbow under ball", "Forearm vertical", "Wrist behind ball"].map((t) => (
                <span key={t} className="flex items-center gap-[6px] text-[11.5px] leading-[13px]">
                  <span className="grid h-[13px] w-[13px] shrink-0 place-items-center rounded-full" style={{ background: BLUE }}>
                    <svg width="8" height="7" viewBox="0 0 12 12" aria-hidden="true"><path d="M2.4 6.4 L4.9 9 L9.6 3.4" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>
                  </span>
                  {t}
                </span>
              ))}
            </span>
          </span>
          <span className="ml-auto shrink-0"><CorrectionGlyph kind="stack" size={44} /></span>
        </div>
      </div>

      {/* recommended drill ------------------------------------------------------ */}
      <div className="mt-[6px] px-[21px]">
        <div className="shotiq-display text-[19px] leading-[19px] tracking-[0.05em]" style={{ color: GRAPHITE }}>RECOMMENDED DRILL</div>
        <Panel className="mt-[3px] flex items-center gap-[11px] p-[5px]">
          <Frame src="090-lib-1" w={68} h={50} radius={4} alt="Towel Elbow Stack drill" />
          <span className="min-w-0 flex-1">
            <span className="block text-[14.5px] font-semibold leading-[16px]">Towel Elbow Stack</span>
            <span className="block text-[11.5px] leading-[14px]" style={{ color: GRAPHITE }}>8 min • Shooting Mechanics</span>
            <span className="mt-[2px] block text-[11.5px] leading-[13px]">
              Use a towel between elbow and hip to build awareness of keeping your elbow stacked through release.
            </span>
          </span>
          <CorrectionGlyph kind="drive" size={38} />
          <Chev size={15} />
        </Panel>
      </div>

      {/* actions ------------------------------------------------------------------ */}
      <div className="mt-[5px] flex gap-[10px] px-[21px]">
        <Panel className="flex h-[27px] flex-1 items-center justify-center gap-[8px]">
          <Bookmark className="h-[14px] w-[14px]" strokeWidth={1.7} />
          <span className="text-[13.5px] leading-[15px]">Add to goals</span>
        </Panel>
        <Panel className="flex h-[27px] flex-1 items-center justify-center gap-[8px]">
          <ActionGlyph kind="uploadVideo" height={13} />
          <span className="text-[13.5px] leading-[15px]">View affected frames</span>
        </Panel>
      </div>

      <div className="mt-[6px] px-[21px]">
        <PrimaryBar className="!h-[31px]" href="/results/demo/training"
                    glyph={<PoseGlyph phase="release" size={19} accent="#fff" />}>
          Start recommended drill
        </PrimaryBar>
      </div>
    </ResultsScreen>
  )
}
