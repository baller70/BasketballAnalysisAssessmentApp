"use client"

/**
 * Canonical iOS 046-flaws-overview — the three priority flaws, ranked.
 *
 * Round-6 grade A: "29 of 33 runs under 45px — PRIMARY COACHING TARGET renders
 * one character per line at the right edge with ~500px of dead space", and
 * grader B measured an interior vertical rule at x=337pt running 63% of the
 * viewport. Both are the same defect: the DESKTOP two-column body laid out at
 * 393pt, leaving a 33pt text column beside a 337pt divider. This screen is a
 * single 393pt column authored at phone scale; there is no second column to
 * leave a rule behind, and no run is set narrower than its content.
 *
 * Bands measured off canonical/046-flaws-overview.png (pt, /2.170483):
 *   wordmark / gear      y   8.8- 26.3   rule y 38
 *   "ANALYSIS" back      y  46.5- 63.6
 *   FLAWS OVERVIEW       y  70.0- 97.7   cap 56-57px, with streak/points right
 *   coaching-target card y 120.7-150.2
 *   detected line        y 172.3-181.5
 *   flaw card 1          y 199.5-388.4
 *   flaw card 2          y 417.9-577.8
 *   flaw card 3          y 601.2-744.5
 *   add-all banner       y 766.6-789.7
 */

import React from "react"
import { PoseFigure } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, StreakPoints, Panel, Chev, Frame, Spark,
  capDisplay, ORANGE, BLUE, GRAPHITE, RULE, INK,
} from "./Kit"

type Flaw = {
  slug: string
  n: number
  title: string
  impact: string
  tone: string
  tint: string
  desc: string
  confidence: string
  phase: string
  still: string
  angle: string
  cta: string
  trend: number[]
}

export const FLAWS: Flaw[] = [
  {
    slug: "elbow-flare", n: 1, title: "ELBOW FLARE", impact: "HIGH IMPACT",
    tone: ORANGE, tint: "#FDE7E1",
    desc: "Elbow drifts outward during lift, creating inconsistent release path.",
    confidence: "92%", phase: "RELEASE", still: "086-film-2", angle: "27°",
    cta: "Review elbow flare", trend: [0.42, 0.66, 0.66, 0.3, 0.5, 0.32, 0.52],
  },
  {
    slug: "early-wrist-extension", n: 2, title: "EARLY WRIST EXTENSION", impact: "MEDIUM IMPACT",
    tone: "#F07C1F", tint: "#FDEEDD",
    desc: "Wrist extends too early, reducing arc and consistency.",
    confidence: "76%", phase: "RELEASE", still: "086-film-5", angle: "-18°",
    cta: "View history", trend: [0.4, 0.62, 0.58, 0.3, 0.46, 0.3, 0.52],
  },
  {
    slug: "low-follow-through", n: 3, title: "LOW FOLLOW-THROUGH", impact: "LOW IMPACT",
    tone: "#E9A100", tint: "#FCF2D8",
    desc: "Follow-through finishes below eye level, limiting rotation and hold.",
    confidence: "58%", phase: "FOLLOW-THROUGH", still: "086-film-6", angle: "142°",
    cta: "View history", trend: [0.52, 0.3, 0.56, 0.36, 0.54, 0.3, 0.48],
  },
]

export function FlawsOverview({
  streak = "6", points = "2,840", onOpen,
}: { streak?: string; points?: string; onOpen?: (slug: string) => void }) {
  return (
    <ResultsScreen
      testid="screen-ios-flaws-overview"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={38} trailing={<GearLink />} />}
    >
      {/* title + cluster -------------------------------------------------- */}
      <div className="mt-[8px] flex items-start justify-between px-[15px]">
        <div className="min-w-0">
          <a href="/results/demo/analysis" className="flex items-center gap-[6px]">
            <Chev size={15} color={INK} />
            <span className="shotiq-display text-[17px] leading-[17px] tracking-[0.06em]" style={{ color: GRAPHITE }}>ANALYSIS</span>
          </a>
          <h1 className="shotiq-display mt-[2px] text-[36px] leading-[29px] tracking-[0.02em]">FLAWS OVERVIEW</h1>
        </div>
        <StreakPoints streak={streak} points={points} className="pt-[2px]" />
      </div>

      {/* primary coaching target ------------------------------------------ */}
      <Panel className="mx-[15px] mt-[7px] flex items-center px-[13px] py-[5px]"
             style={{ background: "var(--shotiq-color-warmCanvas)" }}>
        <div className="min-w-0">
          <div className="shotiq-section-label text-[11.5px] leading-[12px] tracking-[0.08em]">PRIMARY COACHING TARGET</div>
          <div className="mt-[5px] truncate text-[16.5px] font-semibold leading-[18px]">Keep elbow stacked through release</div>
        </div>
        <span className="ml-auto pl-[10px]"><Chev size={16} /></span>
      </Panel>

      <p className="mt-[6px] px-[16px] text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>
        AI analysis detected {FLAWS.length} priority flaws impacting your shot efficiency.
      </p>

      {FLAWS.map((f, i) => <FlawCard key={f.slug} flaw={f} primary={i === 0} onOpen={onOpen} />)}

      {/* add all --------------------------------------------------------- */}
      <div className="mx-[15px] mt-[7px] flex items-center gap-[10px] rounded-[7px] px-[12px] py-[6px]"
           style={{ background: "#EDF3FD" }}>
        <span style={{ color: BLUE }}><PoseFigure phase="rise" height={22} /></span>
        <span className="min-w-0">
          <span className="block text-[14px] font-semibold leading-[15px]">Add all {FLAWS.length} flaws to your training plan</span>
          <span className="block text-[12px] leading-[14px]" style={{ color: GRAPHITE }}>Get personalized drills to fix these issues.</span>
        </span>
        <a href="/results/demo/training"
           className="ml-auto flex h-[26px] shrink-0 items-center gap-[6px] rounded-[6px] px-[12px] text-[13.5px] text-white"
           style={{ background: BLUE }}>
          Add all to plan<Chev size={13} color="#fff" />
        </a>
      </div>
    </ResultsScreen>
  )
}

function FlawCard({ flaw, primary, onOpen }: { flaw: Flaw; primary?: boolean; onOpen?: (slug: string) => void }) {
  return (
    <Panel className="mx-[15px] mt-[5px] px-[10px] pb-[5px] pt-[5px]">
      {/* header row: rank, title, impact chip | confidence + spark -------- */}
      <div className="flex items-start">
        <span className="grid h-[21px] w-[21px] shrink-0 place-items-center rounded-[4px] text-[14px] text-white"
              style={{ background: flaw.tone }}>{flaw.n}</span>
        <span className="ml-[9px] min-w-0 flex-1">
          <span className="flex items-center gap-x-[8px]">
            <span className="shotiq-display whitespace-nowrap leading-[17px] tracking-[0.03em]" style={{ fontSize: capDisplay(35) }}>{flaw.title}</span>
            <span className="shotiq-microcaps shrink-0 whitespace-nowrap rounded-[4px] px-[5px] py-[2px] leading-[9px]"
                  style={{ fontSize: 7.2, background: flaw.tint, color: flaw.tone }}>{flaw.impact}</span>
          </span>
        </span>
        <span className="ml-[8px] w-[124px] shrink-0">
          <span className="shotiq-microcaps block leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>CONFIDENCE</span>
          <span className="mt-[2px] flex items-end gap-[7px]">
            <span className="shotiq-numeric text-[21px] leading-[19px]">{flaw.confidence}</span>
            <Spark w={78} h={18} stroke={flaw.tone} values={[0.28, 0.5, 0.36, 0.44, 0.58, 0.5, 0.74, 0.9]} />
          </span>
        </span>
      </div>

      {/* body: copy + phases + trend | still + action --------------------- */}
      <div className="mt-[4px] flex gap-[10px]">
        <div className="min-w-0 flex-1">
          <p className="text-[11.5px] leading-[12.5px]">{flaw.desc}</p>
          <div className="shotiq-microcaps mt-[5px] leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>AFFECTED PHASES</div>
          <MiniPhases active={flaw.phase} tone={flaw.tone} className="mt-[2px]" />
          <div className="shotiq-microcaps mt-[4px] leading-[10px]" style={{ fontSize: 8, color: GRAPHITE }}>TREND (LAST 6 SESSIONS)</div>
          <TrendPlot values={flaw.trend} tone={flaw.tone} tint={flaw.tint} className="mt-[2px]" />
        </div>
        <div className="w-[126px] shrink-0">
          <span className="relative block overflow-hidden rounded-[4px]" style={{ height: primary ? 78 : 64 }}>
            <Frame src={flaw.still} w="100%" h="100%" radius={0} pos="50% 22%" alt={`${flaw.title} on your ${flaw.phase.toLowerCase()} frame`} />
            <span className="shotiq-numeric absolute right-[8px] top-[34%] text-[12px] text-white"
                  style={{ textShadow: "0 1px 2px rgba(0,0,0,.6)" }}>{flaw.angle}</span>
          </span>
          {primary ? (
            <button type="button" onClick={() => onOpen?.(flaw.slug)}
                    data-testid={`flaw-open-${flaw.slug}`}
                    className="mt-[5px] flex h-[28px] w-full items-center justify-center gap-[8px] rounded-[6px] text-[14px] text-white"
                    style={{ background: flaw.tone }}>
              {flaw.cta}<Chev size={13} color="#fff" />
            </button>
          ) : (
            <button type="button" onClick={() => onOpen?.(flaw.slug)}
                    data-testid={`flaw-open-${flaw.slug}`}
                    className="mt-[5px] flex h-[28px] w-full items-center justify-center gap-[8px] rounded-[6px] border text-[14px]"
                    style={{ borderColor: RULE }}>
              {flaw.cta}<Chev size={13} />
            </button>
          )}
        </div>
      </div>
    </Panel>
  )
}

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]

/** The affected-phase rail each flaw card carries — the same five pose crops
 *  the full rail uses, at card scale, with the affected phase in the card's
 *  own tone. */
function MiniPhases({ active, tone, className = "" }: { active: string; tone: string; className?: string }) {
  return (
    <div className={`flex items-start ${className}`}>
      {PHASES.map((p, i) => (
        <React.Fragment key={p}>
          {i > 0 && <span aria-hidden="true" className="mt-[13px] h-px min-w-[5px] flex-1" style={{ background: RULE }} />}
          <span className="shrink-0 text-center">
            <PoseFigure phase={p.toLowerCase().startsWith("follow") ? "follow" : p.toLowerCase()} active={p === active} height={17} className="mx-auto" />
            <span className="shotiq-display mt-[2px] block whitespace-nowrap leading-[10px] tracking-[0.03em]"
                  style={{ fontSize: 9, color: p === active ? tone : GRAPHITE }}>{p}</span>
            {p === active && <span aria-hidden="true" className="mt-[2px] block h-[1.6px] w-full" style={{ background: tone }} />}
          </span>
        </React.Fragment>
      ))}
    </div>
  )
}

/** Six-session trend with a 0/50/100% scale, plotted inside a tinted plot area
 *  — canonical draws the axis labels, not a bare sparkline. */
function TrendPlot({ values, tone, tint, className = "" }: { values: number[]; tone: string; tint: string; className?: string }) {
  return (
    <div className={`flex items-start gap-[5px] ${className}`}>
      <span className="w-[26px] shrink-0 pt-[1px] text-right text-[8px] leading-[8px]" style={{ color: GRAPHITE }}>
        100%<br />50%<br />0%
      </span>
      <span className="relative block min-w-0 flex-1">
        <span aria-hidden="true" className="absolute inset-x-0 top-[7px] block h-[14px]" style={{ background: tint }} />
        <svg viewBox="0 0 160 42" preserveAspectRatio="none" height="20" className="relative block w-full" aria-hidden="true">
          <line x1="0" x2="160" y1="1" y2="1" stroke={RULE} strokeWidth="1" />
          <line x1="0" x2="160" y1="41" y2="41" stroke={RULE} strokeWidth="1" />
          <polyline fill="none" stroke={tone} strokeWidth="1.6"
                    points={values.map((v, i) => `${(i * 160) / (values.length - 1)},${41 - v * 38}`).join(" ")} />
          {values.map((v, i) => (
            <circle key={i} cx={(i * 160) / (values.length - 1)} cy={41 - v * 38} r="2.4" fill={tone} />
          ))}
        </svg>
      </span>
    </div>
  )
}
