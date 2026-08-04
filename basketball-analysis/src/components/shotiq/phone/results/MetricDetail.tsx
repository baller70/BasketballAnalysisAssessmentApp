"use client"

/**
 * Canonical iOS 045-metric-detail — one measured mechanic, in full.
 *
 * Round-6 grade A: "drawn as a modal (page bg #9C9C9C); canonical is a full
 * page with photo, elite-range slider, confidence, correction triptych and
 * phase rail." This is a PAGE — it draws no scrim, it fills the canvas, and it
 * has its own top bar with a back affordance.
 *
 * Bands measured off canonical/045-metric-detail.png (pt, /2.170483):
 *   back / SHOTIQ AI ANALYSIS / share   y  15.2- 29.5   rule y 38
 *   avatar identity strip               y  47.5- 73.7   rule y 82
 *   session stats + form-score box      y  97.2-141.4
 *   title "ELBOW ANGLE"                 y 147.0-178.3   cap 66-68px
 *   "Release • Right-handed"            y 188.0-197.7
 *   photo + read-out card               y 207.8-473.6   (h 265.8)
 *   WHY IT MATTERS                      y 494.4-549.2
 *   CORRECTION CUE + triptych           y 580.1-647.3
 *   "View frame"                        y 670.8-689.2
 *   "Compare elite range"               y 703.5-722.4
 *   orange CTA                          y 735.3-760.7  (25.3pt)
 *   phase rail BELOW the CTA            y 765.7-803.5
 */

import React from "react"
import { CorrectionGlyph, MechanicGlyph, ActionGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, ShareIcon, Panel, Micro, ScoreBar, PhaseRail, Chev,
  PrimaryBar, Frame, SkeletonOverlay, Spark, TickDisc, CrossDisc, capDisplay,
  ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"

export function MetricDetail({
  metric = "ELBOW ANGLE", value = "91", unit = "°",
  low = "85°", high = "95°", floor = "80°", ceiling = "100°",
  phase = "Release", hand = "Right-handed",
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  onBack,
}: {
  metric?: string; value?: string; unit?: string
  low?: string; high?: string; floor?: string; ceiling?: string
  phase?: string; hand?: string
  score?: number; shots?: string; makes?: string; pct?: string
  onBack?: () => void
}) {
  return (
    <ResultsScreen
      testid="screen-ios-metric-detail"
      tab="home"
      bar={
        <ResultsBar
          variant="back-title" height={38} onBack={onBack}
          title={
            <span className="flex items-baseline gap-[9px]">
              <span className="shotiq-wordmark text-[17px] leading-none tracking-[0.15em]">
                SHOT<span style={{ color: ORANGE }}>IQ</span>
              </span>
              <span className="shotiq-display text-[15px] leading-none tracking-[0.09em]" style={{ color: GRAPHITE }}>
                AI ANALYSIS
              </span>
            </span>
          }
          trailing={<ShareIcon />}
        />
      }
    >
      {/* identity strip --------------------------------------------------- */}
      <div className="mt-[9px] flex items-center px-[17px]">
        <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full text-[12px] text-white" style={{ background: "#1B1B1B" }}>JE</span>
        <span className="ml-[10px] min-w-0">
          <span className="block text-[15px] font-medium leading-[17px]">Jordan Ellis</span>
          <span className="block text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>{hand} • Advanced</span>
        </span>
        <span className="ml-auto flex items-center gap-[9px]">
          <ActionGlyph kind="uploadVideo" height={13} />
          <span className="text-center">
            <span className="shotiq-numeric block text-[17px] leading-[16px]">6</span>
            <Micro size={8}>DAY STREAK</Micro>
          </span>
          <span aria-hidden="true" className="h-[32px] w-px" style={{ background: RULE }} />
          <ActionGlyph kind="nodeGraph" height={12} />
          <span className="text-center">
            <span className="shotiq-numeric block text-[17px] leading-[16px]">2,840</span>
            <Micro size={8}>POINTS</Micro>
          </span>
        </span>
      </div>
      <span aria-hidden="true" className="mt-[8px] block h-px" style={{ background: RULE }} />

      {/* session stats + score -------------------------------------------- */}
      <div className="mt-[10px] flex items-start px-[17px]">
        <div className="flex min-w-0 flex-1 divide-x divide-[var(--shotiq-color-rule)] pr-[14px]">
          {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "SHOOTING %"]] as [string, string][]).map(([v, l]) => (
            <div key={l} className="flex-1 text-center">
              <div className="shotiq-numeric text-[25px] leading-[25px]">{v}</div>
              <Micro className="mt-[5px]">{l}</Micro>
            </div>
          ))}
        </div>
        <Panel className="w-[152px] shrink-0 px-[11px] pb-[10px] pt-[8px]" style={{ background: "var(--shotiq-color-warmCanvas)" }}>
          <div className="shotiq-section-label text-[12px] leading-[12px] tracking-[0.075em]">FORM SCORE</div>
          <div className="shotiq-numeric mt-[1px] text-[34px] leading-[32px]" style={{ color: ORANGE }}>{score}</div>
          <span className="mt-[3px] block"><ScoreBar score={score} width={128} height={5} /></span>
        </Panel>
      </div>

      {/* title ------------------------------------------------------------- */}
      <div className="mt-[9px] px-[17px]">
        <h1 className="shotiq-display text-[42px] leading-[36px] tracking-[0.01em]">{metric}</h1>
        <div className="mt-[6px] text-[13px] leading-[14px]" style={{ color: GRAPHITE }}>{phase} &nbsp;•&nbsp; {hand}</div>
      </div>

      {/* photo + read-out --------------------------------------------------- */}
      <Panel className="mx-[17px] mt-[10px] flex overflow-hidden">
        <div className="relative w-[190px] shrink-0" style={{ height: 266 }}>
          <Frame src="086-film-4" w="100%" h="100%" radius={0} alt={`Your ${metric.toLowerCase()} at ${phase.toLowerCase()}`} />
          <SkeletonOverlay />
          <span aria-hidden="true" className="absolute left-[52%] top-[26%] h-[26px] w-[19px] rounded-br-full" style={{ background: ORANGE }} />
          <span className="shotiq-numeric absolute left-[63%] top-[31%] rounded-[4px] bg-white px-[7px] py-[3px] text-[15px]">{value}{unit}</span>
        </div>
        <div className="min-w-0 flex-1 px-[13px] py-[11px]">
          <div className="shotiq-section-label text-[13px] leading-[13px] tracking-[0.075em]">MEASURED</div>
          <div className="shotiq-numeric mt-[1px] text-[57px] leading-[54px]">{value}{unit}</div>
          <div className="shotiq-display text-[16px] leading-[17px] tracking-[0.04em]" style={{ color: GRAPHITE }}>{metric}</div>
          <span aria-hidden="true" className="my-[9px] block h-px" style={{ background: RULE }} />

          <div className="shotiq-section-label text-[13px] leading-[13px] tracking-[0.075em]">ELITE RANGE</div>
          <div className="shotiq-numeric mt-[1px] text-[27px] leading-[28px]" style={{ color: GREEN }}>{low} — {high}</div>
          <EliteSlider />
          <div className="mt-[2px] flex justify-between text-[10.5px]" style={{ color: GRAPHITE }}>
            <span>{floor}</span><span>{ceiling}</span>
          </div>
          <span aria-hidden="true" className="my-[9px] block h-px" style={{ background: RULE }} />

          <div className="shotiq-section-label text-[13px] leading-[13px] tracking-[0.075em]">CONFIDENCE</div>
          <div className="mt-[2px] flex items-end gap-[9px]">
            <span className="shotiq-display text-[22px] leading-[22px] tracking-[0.04em]" style={{ color: BLUE }}>HIGH</span>
            <span className="shotiq-numeric text-[22px] leading-[22px]" style={{ color: BLUE }}>92%</span>
            <Spark w={72} h={30} stroke={BLUE} dots={false} fill="rgba(45,108,223,.14)"
                   values={[0.3, 0.42, 0.34, 0.5, 0.44, 0.62, 0.55, 0.78]} />
          </div>
        </div>
      </Panel>

      {/* why it matters ----------------------------------------------------- */}
      <Panel className="mx-[17px] mt-[9px] flex items-center gap-[10px] px-[13px] py-[10px]">
        <div className="min-w-0 flex-1">
          <div className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">WHY IT MATTERS</div>
          <p className="mt-[6px] text-[12.5px] leading-[15.5px]" style={{ color: GRAPHITE }}>
            A stacked elbow (near 90°) improves shot consistency by aligning force from your legs through your shoulder to the ball.
          </p>
        </div>
        <span className="shrink-0 border-l pl-[12px]" style={{ borderColor: RULE }}>
          <MechanicGlyph kind="angle" size={62} accent={BLUE} />
        </span>
      </Panel>

      {/* correction cue ------------------------------------------------------ */}
      <Panel className="mx-[17px] mt-[9px] flex gap-[11px] px-[13px] py-[10px]">
        <div className="w-[176px] shrink-0">
          <div className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">CORRECTION CUE</div>
          <div className="mt-[5px] text-[13.5px] leading-[16px]" style={{ color: BLUE }}>Keep elbow stacked under the ball</div>
          <p className="mt-[3px] text-[12.5px] leading-[15px]" style={{ color: GRAPHITE }}>
            Avoid flaring out. Drive your elbow up and keep it under the ball at release.
          </p>
        </div>
        <div className="flex min-w-0 flex-1 border-l pl-[11px]" style={{ borderColor: RULE }}>
          {([["stack", "TOO FLARED", false], ["square", "STACKED", true], ["drive", "BEHIND BODY", false]] as ["stack" | "square" | "drive", string, boolean][]).map(([k, l, ok]) => (
            <div key={l} className="min-w-0 flex-1 text-center">
              <span className="flex h-[46px] items-center justify-center"><CorrectionGlyph kind={k} size={44} /></span>
              <span className="mt-[5px] flex justify-center">{ok ? <TickDisc size={15} /> : <CrossDisc size={15} />}</span>
              <span className="shotiq-microcaps mt-[4px] block leading-[9px]"
                    style={{ fontSize: 7.4, color: ok ? GREEN : GRAPHITE }}>{l}</span>
            </div>
          ))}
        </div>
      </Panel>

      {/* jump-off rows --------------------------------------------------------- */}
      <Panel className="mx-[17px] mt-[9px] divide-y divide-[var(--shotiq-color-rule)]">
        {([["View frame", "See this rep at release", "uploadVideo"], ["Compare elite range", "See how you stack up", "nodeGraph"]] as const).map(([t, s, g]) => (
          <div key={t} className="flex items-center gap-[11px] px-[13px] py-[8px]">
            <ActionGlyph kind={g} height={17} />
            <span className="min-w-0">
              <span className="block text-[14.5px] font-medium leading-[16px]">{t}</span>
              <span className="block text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>{s}</span>
            </span>
            <span className="ml-auto"><Chev size={15} /></span>
          </div>
        ))}
      </Panel>

      <div className="mt-[8px] px-[17px]">
        <PrimaryBar className="!h-[26px]" href="/results/demo/training">Add to training plan</PrimaryBar>
      </div>

      <PhaseRail className="mt-[7px] px-[22px]" active="RELEASE" figure={26} label={9} />
    </ResultsScreen>
  )
}

/** The elite-range slider: a rule with end ticks, the green elite band, and the
 *  measured value as a ringed handle sitting in it. */
function EliteSlider() {
  return (
    <svg viewBox="0 0 160 14" height="14" className="mt-[6px] block w-full" preserveAspectRatio="none" aria-hidden="true">
      <line x1="2" x2="158" y1="7" y2="7" stroke="#C9CBCD" strokeWidth="1.2" />
      <line x1="14" x2="14" y1="3" y2="11" stroke="#C9CBCD" strokeWidth="1.2" />
      <line x1="146" x2="146" y1="3" y2="11" stroke="#C9CBCD" strokeWidth="1.2" />
      <line x1="56" x2="112" y1="7" y2="7" stroke={GREEN} strokeWidth="3.4" />
      <circle cx="88" cy="7" r="4.6" fill="#fff" stroke={GREEN} strokeWidth="2.2" />
    </svg>
  )
}
