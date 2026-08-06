"use client"

/**
 * Canonical iOS 044-form-score — how the 82 is arrived at.
 *
 * Round-6 grade A: "canonical's score breakdown page is not rendered.
 * Orange 32.8‰ -> 5.4‰." It shared /results/demo/analysis with 041 and the
 * harness reached it by scrolling, which captured the same composition twice.
 * It is now its own surface, reached from 041's FORM SCORE card.
 *
 * Bands measured off canonical/044-form-score.png (pt, /2.170483):
 *   wordmark / gear        y  11.1- 30.4   rule 42
 *   identity               y  49.8-100.0
 *   "Back to analysis"     y 111.5-125.8   + share right; rule y 132
 *   score block            y 146.5-217.0   bar y 225.8-230.4 (x22-180)
 *   two secondary actions  y 247.4-262.6
 *   FORM BREAKDOWN         y 287.0-297.2
 *   5 breakdown cards      titles 313.8, glyphs 330.3-359.8, numerals 365.8,
 *                          verdicts 391.6, copy 406.8 + 417.9
 *   CONFIDENCE             y 445.1-485.6
 *   KEY INSIGHT            y 503.1-513.7   card y 527.5-574.5
 *   METRIC DETAILS         y 592.0-602.2   header 610.0, 5 rows 625.2-692.9
 *   "Review weakest metric" y 698.9-722.9  (24pt bar)
 *   SESSION SUMMARY        y 736.7-771.7
 */

import React from "react"
import { FileText, Share2 } from "lucide-react"
import { PoseGlyph, MechanicGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, ResultsIdentity, Panel, SectionHead, Micro,
  ScoreBar, Chev, PrimaryBar, Spark, TrendArrow, capDisplay,
  ORANGE, BLUE, GREEN, RED, GRAPHITE, RULE, INK,
} from "./Kit"

const BREAKDOWN: [string, number, string, string, string][] = [
  ["FORM", 84, "GOOD", "Solid mechanics", "overall."],
  ["BALANCE", 78, "GOOD", "Slight lean", "on the rise."],
  ["ELBOW", 72, "NEEDS WORK", "Elbow drifts", "out at load."],
  ["POWER", 86, "GOOD", "Strong lower", "body drive."],
  ["CONSISTENCY", 81, "GOOD", "Release point", "is repeatable."],
]

const ROWS: [string, number, string, string, boolean][] = [
  ["Form", 84, "Alignment, posture, efficiency", "High", false],
  ["Balance", 78, "Stability, control, body position", "Medium", false],
  ["Elbow", 72, "Stack, path, separation", "High", true],
  ["Power", 86, "Lower body drive, force transfer", "Medium", false],
  ["Consistency", 81, "Repeatability, release control", "High", false],
]

export function FormScore({
  score = 82, shots = "24", makes = "15", pct = "62.5%", delta = "+8.1%",
  name, streak, points,
}: {
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  name?: string; streak?: string; points?: string
}) {
  return (
    <ResultsScreen
      testid="screen-ios-form-score"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={42} trailing={<GearLink />} />}
    >
      <ResultsIdentity className="mt-[5px] px-[22px]" name={name} streak={streak} points={points} />

      <div className="mt-[6px] flex items-center px-[22px]">
        <a href="/results/demo/analysis" className="flex items-center gap-[7px]">
          <Chev size={16} color={INK} />
          <span className="text-[17px] font-medium leading-[18px]">Back to analysis</span>
        </a>
        <Share2 className="ml-auto h-[17px] w-[17px]" strokeWidth={1.7} />
      </div>
      <span aria-hidden="true" className="mx-[22px] mt-[6px] block h-px" style={{ background: RULE }} />

      {/* score block ---------------------------------------------------- */}
      <div className="mt-[8px] px-[22px]">
        <SectionHead cap={23} info>FORM SCORE</SectionHead>
        <div className="mt-[3px] flex items-start">
          <span className="shotiq-numeric leading-[0.78]" style={{ fontSize: 50, color: ORANGE }}>{score}</span>
          <span className="ml-[13px] pt-[6px]">
            <span className="shotiq-display block text-[17px] leading-[17px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</span>
            <span className="mt-[5px] block text-[12.5px] leading-[14.5px]">Keep building<br />consistency.</span>
          </span>
          <span className="ml-auto pt-[4px] text-right">
            <span className="flex items-start gap-[4px]">
              <Spark w={110} h={30} values={[0.18, 0.5, 0.28, 0.72]} dots
                     dotColor={(i) => (i === 1 || i === 3 ? GREEN : GRAPHITE)} />
              <TrendArrow size={15} />
            </span>
            <span className="mt-[5px] block text-[12px] leading-[13px]">
              <span style={{ color: GREEN }}>{delta}</span>{" "}
              <span style={{ color: GRAPHITE }}>vs last session</span>
            </span>
          </span>
        </div>
        <span className="mt-[2px] block"><ScoreBar score={score} width={183} height={7} /></span>
        <div className="mt-[5px] flex gap-[9px]">
          <Panel className="flex h-[26px] flex-1 items-center px-[10px]">
            <FileText className="h-[15px] w-[15px]" strokeWidth={1.6} />
            <span className="ml-[8px] text-[13.5px] leading-[15px]">View score method</span>
            <span className="ml-auto"><Chev size={13} /></span>
          </Panel>
          <Panel className="flex h-[26px] flex-1 items-center px-[10px]">
            <MechanicGlyph kind="impact" size={15} accent={INK} />
            <span className="ml-[8px] text-[13.5px] leading-[15px]">Compare session</span>
            <span className="ml-auto"><Chev size={13} /></span>
          </Panel>
        </div>
      </div>

      {/* form breakdown --------------------------------------------------- */}
      <SectionHead cap={22} className="mt-[7px] px-[22px]">FORM BREAKDOWN</SectionHead>
      <div className="mt-[4px] flex gap-[6px] px-[21px]">
        {BREAKDOWN.map(([label, n, verdict, l1, l2]) => (
          <Panel key={label} className="min-w-0 flex-1 px-[3px] pb-[5px] pt-[5px] text-center">
            <div className="shotiq-display leading-[10px] tracking-[0.035em]" style={{ fontSize: capDisplay(19) }}>{label}</div>
            <span className="mt-[3px] flex h-[22px] items-center justify-center">
              <PoseGlyph phase="release" size={22} accent={ORANGE} />
            </span>
            <div className="shotiq-numeric mt-[2px] text-[22px] leading-[20px]" style={{ color: ORANGE }}>{n}</div>
            <div className="shotiq-display mt-[3px] leading-[9px] tracking-[0.035em]"
                 style={{ fontSize: capDisplay(18), color: verdict === "GOOD" ? BLUE : RED }}>{verdict}</div>
            <div className="mt-[3px] text-[9.5px] leading-[10.5px]">{l1}<br />{l2}</div>
          </Panel>
        ))}
      </div>

      {/* confidence -------------------------------------------------------- */}
      {/* Canonical sets CONFIDENCE as one 40pt band: the label above the
          numeral on the left, the verdict, the sentence and the wave all
          sharing the numeral's baseline. */}
      <div className="mt-[7px] px-[22px]">
        <SectionHead cap={22} info>CONFIDENCE</SectionHead>
        <div className="mt-[1px] flex items-end">
          <span className="shotiq-numeric shrink-0 text-[30px] leading-[28px]" style={{ color: BLUE }}>
            76<span className="text-[18px]">%</span>
          </span>
          <span className="ml-[9px] shrink-0 pb-[4px] text-[12.5px] leading-[13px]" style={{ color: BLUE }}>MODERATE</span>
          <span className="ml-[12px] min-w-0 flex-1 pb-[2px] text-[11px] leading-[12.5px]">
            Form is repeatable in games, with room to tighten elbow.
          </span>
          <span className="ml-[10px] shrink-0">
            <Spark w={148} h={26} stroke={BLUE} dots={false} fill="rgba(45,108,223,.12)"
                   values={[0.32, 0.55, 0.36, 0.62, 0.3, 0.24, 0.48, 0.34, 0.68, 0.92]} />
          </span>
        </div>
      </div>

      {/* key insight -------------------------------------------------------- */}
      <SectionHead cap={23} className="mt-[8px] px-[22px]">KEY INSIGHT</SectionHead>
      <div className="mx-[21px] mt-[4px] flex items-center gap-[11px] rounded-[6px] px-[12px] py-[5px]"
           style={{ background: "var(--shotiq-color-warmCanvas)" }}>
        <PoseGlyph phase="load" size={38} accent={ORANGE} />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-medium leading-[14px]">
            Elbow separation at load is causing inconsistency at release.
          </div>
          <div className="mt-[1px] text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>
            Focus on keeping your elbow stacked over your hip through the rise and into release.
          </div>
        </div>
        <div className="w-[74px] shrink-0 border-l pl-[10px] text-center" style={{ borderColor: RULE }}>
          <Micro size={8.6}>IMPACT</Micro>
          <div className="shotiq-numeric mt-[4px] text-[21px] leading-[20px]" style={{ color: ORANGE }}>
            +11<span className="text-[13px]">%</span>
          </div>
          <div className="mt-[2px] text-[10.5px] leading-[12px]" style={{ color: GRAPHITE }}>Consistency</div>
        </div>
      </div>

      {/* metric details table ------------------------------------------------ */}
      <SectionHead cap={22} info className="mt-[6px] px-[22px]">METRIC DETAILS</SectionHead>
      <div className="mt-[3px] px-[22px]">
        {/* Column x measured on canonical/044 (pt): METRIC 23.5, SCORE 107.3,
            DETAILS 200.9, IMPACT 334.5 — IMPACT is left-aligned there, not
            flushed right. */}
        <div className="flex items-end pb-[2px] text-[9.5px]" style={{ color: GRAPHITE }}>
          <span className="w-[84px] shrink-0">METRIC</span>
          <span className="w-[94px] shrink-0">SCORE</span>
          <span className="min-w-0 flex-1">DETAILS</span>
          <span className="w-[40px] shrink-0">IMPACT</span>
        </div>
        {ROWS.map(([label, n, detail, impact, warn]) => (
          <div key={label} className="flex items-center border-t py-[0px] text-[12px] leading-[14px]" style={{ borderColor: RULE }}>
            <span className="w-[84px] shrink-0 font-medium">{label}</span>
            <span className="shotiq-numeric w-[22px] shrink-0 text-[16px] leading-[16px]">{n}</span>
            {/* Track measured on canonical/044: x281-388px = 49.8pt wide, fill
                8px = 3.7pt tall, and the fill really is score% of it (84 -> 88px
                of 108, 86 -> 93, 72 -> 71). Shipping an 84pt track at 5pt tall
                made every bar ~1.7x too long and 1.4x too thick and took the
                screen's blue to 4.9‰ against canonical's 3.2‰. */}
            <span className="w-[50px] shrink-0 overflow-hidden rounded-full" style={{ height: 3.7, background: "#E4E5E6" }}>
              <span className="block h-full rounded-full" style={{ width: `${n}%`, background: warn ? ORANGE : BLUE }} />
            </span>
            <span className="min-w-0 flex-1 truncate pl-[21px] text-[11px]">{detail}</span>
            <span className="w-[40px] shrink-0">{impact}</span>
          </div>
        ))}
      </div>

      <div className="mt-[6px] px-[22px]">
        <PrimaryBar className="!h-[24px] !text-[14.5px]" href="/results/demo/biomechanics?view=metric"
                    trailing={<Chev size={14} color="#fff" />}>
          Review weakest metric
        </PrimaryBar>
      </div>

      {/* session summary -------------------------------------------------- */}
      <div className="mt-[6px] px-[22px]">
        <SectionHead cap={19} info>SESSION SUMMARY</SectionHead>
        <div className="mt-[4px] flex items-start divide-x divide-[var(--shotiq-color-rule)]">
          {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]] as [string, string][]).map(([v, l]) => (
            <div key={l} className="flex-1 pr-[8px] [&:not(:first-child)]:pl-[10px]">
              <div className="shotiq-numeric text-[22px] leading-[20px]">{v}</div>
              <Micro className="mt-[4px]">{l}</Micro>
            </div>
          ))}
          <div className="flex-[1.4] pl-[10px]">
            <span className="flex items-start gap-[4px]">
              <Spark w={92} h={26} values={[0.2, 0.5, 0.3, 0.75]} dotColor={(i) => (i === 1 || i === 3 ? GREEN : GRAPHITE)} />
              <TrendArrow size={13} />
            </span>
            <span className="mt-[3px] block text-[11px] leading-[12px]">
              <span style={{ color: GREEN }}>{delta}</span>{" "}
              <span style={{ color: GRAPHITE }}>vs last session</span>
            </span>
          </div>
        </div>
      </div>
    </ResultsScreen>
  )
}
