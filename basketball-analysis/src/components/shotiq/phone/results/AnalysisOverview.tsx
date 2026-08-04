"use client"

/**
 * Canonical iOS 038-analysis-result-overview — the phone home of a finished
 * analysis, and the hub the rest of the family is reached from.
 *
 * Round-6 grade A read: "canonical's 7-tab bar, form score, phase rail,
 * 6-metric grid and elite-match card replaced by a video player with a timecode
 * list. Orange 34.5‰ -> 3.7‰." None of those five regions existed.
 *
 * Bands measured off canonical/038-analysis-result-overview.png, row-segmented
 * then column-segmented (scratchpad rsmeasure.py), quoted in pt after dividing
 * by 853/393 = 2.170483:
 *
 *   wordmark / gear      y   9.2- 25.8   rule y 42.0
 *   identity             y  49.8- 97.2   x 15-355
 *   7-tab row            y 117.0-125.8   x 17-370, cap 19px; active rule y 135.0
 *   hero still           y 146.1-365.8   x 12.4-219.7
 *   score column         x 236-370: FORM SCORE 157, "82" 170-230, bar 228-234,
 *                        GOOD 249-258, note 265-286, 3 stats 304-364
 *   phase rail           figures y 380.6-410.5, labels 416.0-422.5, rule 427.6
 *   coaching target      label y 448.3-455.7, line y 465.3-481.9
 *   YOUR SIX KEY METRICS y 501.7-511.4
 *   metric grid          glyphs y 524.8-561.2, labels 569.5, values 583.7,
 *                        verdicts 604.5
 *   ELITE MATCH          y 628.9-638.1  (+ "How it works" right)
 *   elite card           y 646.9-719.7
 *   primary CTA          y 730.3-756.5  x 13.6-377  (26.3pt tall, not 46)
 *   share row            y 769.4-781.9
 */

import React from "react"
import { useRouter } from "next/navigation"
import { MechanicGlyph, ActionGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, ResultsIdentity, Panel, SectionHead, Micro,
  ScoreBar, PhaseRail, Chev, PrimaryBar, Frame, SkeletonOverlay, capDisplay,
  ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"

const TABS: [string, string][] = [
  ["ANALYSIS RESULT", "/results/demo"],
  ["ANALYSIS", "/results/demo/analysis"],
  ["FLAWS", "/results/demo/flaws"],
  ["PLAYER", "/results/demo/player"],
  ["COMPARE", "/results/demo/compare"],
  ["TRAINING", "/results/demo/training"],
  ["GOALS", "/results/demo/goals"],
]

/** Canonical's in-body tab row: the seven results surfaces, active one orange
 *  and ruled. This IS the navigation between the family members — every screen
 *  039-051 is one tap from here. */
export function ResultsTabs({ active = "ANALYSIS RESULT" }: { active?: string }) {
  const router = useRouter()
  return (
    <div className="relative">
      <div className="flex items-end justify-between px-[15px]">
        {TABS.map(([label, href]) => {
          const on = label === active
          return (
            <button key={label} type="button" onClick={() => router.push(href)}
                    data-testid={`results-tab-${label.split(" ")[0].toLowerCase()}`}
                    className="shrink-0 pb-[9px]">
              <span className="shotiq-display block whitespace-nowrap leading-[9px] tracking-[0.055em]"
                    style={{ fontSize: capDisplay(17), color: on ? ORANGE : INK }}>
                {label}
              </span>
              <span aria-hidden="true" className="mt-[8px] block h-[2px] rounded-full"
                    style={{ background: on ? ORANGE : "transparent" }} />
            </button>
          )
        })}
      </div>
      <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px" style={{ background: RULE }} />
    </div>
  )
}

const METRICS: [MechanicKind, string, string, string, string][] = [
  ["height", "RELEASE HEIGHT", "7'8\"", "", "EXCELLENT"],
  ["angle", "RELEASE ANGLE", "52", "°", "GOOD"],
  ["centerline", "ELBOW ALIGNMENT", "93", "%", "GOOD"],
  ["arc", "SHOT ARC", "46", "°", "GOOD"],
  ["drift", "SPIN RATE", "8.6", "", "GOOD"],
  ["balance", "CENTEREDNESS", "92", "%", "EXCELLENT"],
]

export function AnalysisOverview({
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  name = "Jordan Ellis", streak = "6", points = "2,840",
}: {
  score?: number; shots?: string; makes?: string; pct?: string
  name?: string; streak?: string; points?: string
}) {
  return (
    <ResultsScreen
      testid="screen-ios-analysis-result-overview"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={42} trailing={<GearLink />} />}
    >
      <ResultsIdentity className="mt-[8px] px-[16px]" name={name} streak={streak} points={points} />

      <ResultsTabs active="ANALYSIS RESULT" />

      {/* hero still + score column ------------------------------------- */}
      <div className="mt-[8px] flex gap-[16px] px-[12px]">
        <div className="relative h-[220px] w-[207px] shrink-0 overflow-hidden rounded-[4px]">
          <Frame src="086-film-4" w="100%" h="100%" radius={0} alt="Your release frame with the pose graph traced over it" />
          <SkeletonOverlay />
        </div>
        <div className="min-w-0 flex-1">
          <div className="shotiq-section-label text-[13px] leading-[13px] tracking-[0.075em]">FORM SCORE</div>
          <div className="shotiq-numeric mt-[3px] leading-[0.8]" style={{ fontSize: 74, color: ORANGE }}>{score}</div>
          <ScoreBar score={score} width={89} height={6.5} />
          <div className="shotiq-display mt-[8px] text-[17px] leading-[17px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
          <div className="mt-[5px] text-[12.5px] leading-[14.5px]">Keep building<br />consistency.</div>
          <div className="mt-[12px] flex items-end">
            {([[shots, "SHOTS", "analyze"], [makes, "MAKES", "uploadVideo"], [pct, "MAKE %", "gauge"]] as const).map(([v, l, g]) => (
              <div key={l} className="flex-1">
                <span className="flex h-[24px] items-end" style={{ color: INK }}>
                  {g === "gauge"
                    ? <MakeGauge />
                    : <ActionGlyph kind={g === "analyze" ? "analyze" : "nodeGraph"} height={g === "analyze" ? 24 : 19} />}
                </span>
                <div className="shotiq-numeric mt-[8px] text-[21px] leading-[19px]">{v}</div>
                <Micro className="mt-[5px]">{l}</Micro>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* phase rail ----------------------------------------------------- */}
      <PhaseRail className="mt-[10px] px-[16px]" active="RELEASE" figure={30} label={9.6} />

      {/* primary coaching target ---------------------------------------- */}
      <Panel className="mx-[13px] mt-[7px] flex items-center px-[14px] py-[7px]">
        <div className="min-w-0">
          <div className="shotiq-section-label text-[11.5px] leading-[12px] tracking-[0.08em]">PRIMARY COACHING TARGET</div>
          <div className="mt-[6px] truncate text-[17px] font-semibold leading-[19px]">Keep elbow stacked through release</div>
        </div>
        <span className="ml-auto pl-[10px]"><Chev size={16} /></span>
      </Panel>

      {/* six key metrics ------------------------------------------------- */}
      <SectionHead cap={21} info className="mt-[6px] px-[14px]">YOUR SIX KEY METRICS</SectionHead>
      <Panel className="mx-[13px] mt-[6px] flex divide-x divide-[var(--shotiq-color-rule)] pb-[9px] pt-[7px]">
        {METRICS.map(([kind, label, value, unit, verdict]) => (
          <div key={label} className="min-w-0 flex-1 px-[3px] text-center">
            <span className="flex h-[36px] items-center justify-center" style={{ color: INK }}>
              <MechanicGlyph kind={kind} size={33} />
            </span>
            <div className="shotiq-microcaps mt-[8px] leading-[6px]" style={{ fontSize: 7, color: GRAPHITE }}>{label}</div>
            <div className="shotiq-numeric mt-[8px] leading-[14px]" style={{ fontSize: 19 }}>
              {value}{unit && <span style={{ fontSize: 12 }}>{unit}</span>}
            </div>
            <div className="shotiq-microcaps mt-[6px] leading-[6px]"
                 style={{ fontSize: 7, color: verdict === "EXCELLENT" ? GREEN : BLUE }}>{verdict}</div>
          </div>
        ))}
      </Panel>

      {/* elite match ----------------------------------------------------- */}
      <SectionHead
        cap={20} info className="mt-[7px] px-[14px]"
        right={
          <span className="flex items-center gap-[3px] text-[11.5px]" style={{ color: BLUE }}>
            How it works<Chev size={12} color={BLUE} />
          </span>
        }
      >
        ELITE MATCH
      </SectionHead>
      <Panel className="mx-[13px] mt-[4px] flex items-center gap-[11px] p-[5px]">
        <Frame src="083-elite" w={90} h={72} radius={3} alt="Klay Thompson at release" />
        <div className="min-w-0 flex-1">
          <div className="shotiq-display text-[22px] leading-[21px] tracking-[0.035em]">KLAY THOMPSON</div>
          <div className="mt-[2px] text-[11px] leading-[12px]" style={{ color: GRAPHITE }}>Golden State Warriors</div>
          <div className="mt-[4px] space-y-[2px]">
            {([["angle", "Release Angle", "51°"], ["centerline", "Elbow Alignment", "95%"], ["arc", "Shot Arc", "46°"]] as [MechanicKind, string, string][]).map(([k, l, v]) => (
              <div key={l} className="flex items-center gap-[6px]">
                <span style={{ color: INK }}><MechanicGlyph kind={k} size={13} /></span>
                <span className="text-[11.5px] leading-[12px]">{l}</span>
                <span className="ml-auto text-[11.5px] leading-[12px]" style={{ color: BLUE }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-center">
          <MatchArc pct={88} />
          <div className="shotiq-microcaps mt-[3px] leading-[9px]" style={{ fontSize: 8, color: INK }}>OVERALL MATCH</div>
        </div>
      </Panel>

      {/* actions --------------------------------------------------------- */}
      <div className="mt-[4px] px-[13px]">
        <PrimaryBar
          testid="overview-view-breakdown"
          href="/results/demo/analysis"
          className="!h-[26px] !text-[15px]"
          glyph={<ActionGlyph kind="uploadVideo" height={15} />}
        >
          View shot breakdown
        </PrimaryBar>
        <Panel className="mt-[7px] flex h-[28px] items-center px-[13px]">
          <ActionGlyph kind="chooseMedia" height={16} />
          <span className="ml-[10px] text-[14.5px] leading-[16px]">Share analysis</span>
          <span className="ml-auto"><Chev size={14} /></span>
        </Panel>
      </div>
    </ResultsScreen>
  )
}

/** The circled "%" mark canonical sets over MAKE %: a ring with an orange
 *  three-quarter sweep and a % inside it. */
function MakeGauge() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="block">
      <circle cx="12" cy="12" r="10.4" fill="none" stroke="#D8DADC" strokeWidth="1.5" />
      <path d="M12 1.6 A10.4 10.4 0 0 1 19.4 19.4" fill="none" stroke={ORANGE} strokeWidth="1.7" strokeLinecap="round" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor">%</text>
    </svg>
  )
}

/** The blue match arc on the elite card: a 180° gauge filled to `pct` with the
 *  figure set inside it. */
function MatchArc({ pct = 88 }: { pct?: number }) {
  const r = 27
  const len = Math.PI * r
  return (
    <span className="relative block h-[40px] w-[68px]">
      <svg width="68" height="40" viewBox="0 0 68 40" aria-hidden="true">
        <path d={`M7 36 A${r} ${r} 0 0 1 61 36`} fill="none" stroke="#D8DADC" strokeWidth="6" strokeLinecap="round" />
        <path d={`M7 36 A${r} ${r} 0 0 1 61 36`} fill="none" stroke={BLUE} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={`${(len * pct) / 100} ${len}`} />
      </svg>
      <span className="shotiq-numeric absolute inset-x-0 bottom-[1px] text-[21px] leading-[21px]">
        {pct}<span className="text-[13px]">%</span>
      </span>
    </span>
  )
}
