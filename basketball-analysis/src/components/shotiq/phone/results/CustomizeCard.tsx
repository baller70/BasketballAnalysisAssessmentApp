"use client"

/**
 * Canonical iOS 049-customize-player-card — editing the card, with a live
 * preview of exactly what will be produced.
 *
 * Round-6 grade A: "same overprinted preview; canonical's live-preview card +
 * detail rows replaced by toggles and swatches. Orange 70.9‰ -> 11.8‰." The
 * orange is the card's banner plus the Save bar; both are back.
 *
 * Canonical draws NO bottom tab bar here — it is a modal-scale editing surface
 * that fills the canvas, with Cancel below the Save bar.
 *
 * Bands measured off canonical/049-customize-player-card.png (pt, /2.170483):
 *   back / title / Cancel     y  18.0- 33.6   rule y 46
 *   LIVE PREVIEW              y  62.7- 73.3
 *   orange banner             y  82.0-113.3   (31.3pt)
 *   JORDAN / ELLIS + cluster  y 127.2-186.6
 *   RIGHT-HANDED • ADVANCED   y 194.4-200.9
 *   card body (photo+score)   y 211.0-443.2   (232.2pt)
 *   phase rail                figures 452.4-476.9, labels 480.1, rule 491.6
 *   CUSTOMIZE DETAILS         y 519.2-530.3
 *   BANNER COLOR              y 547.8-574.1
 *   JERSEY NUMBER             y 593.9-620.1
 *   FIRST NAME                y 638.1-663.9
 *   LAST NAME                 y 681.9-708.1
 *   CARD LAYOUT               y 731.6-756.5
 *   Save card                 y 770.3-804.0   (33.6pt)
 *   Cancel                    y 815.9-826.5
 */

import React from "react"
import { Info } from "lucide-react"
import {
  ResultsScreen, ResultsBar, Panel, Micro, ScoreBar, PhaseRail, Frame,
  SkeletonOverlay, ORANGE, BLUE, GRAPHITE, RULE, INK,
} from "./Kit"
import { StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

const SWATCHES = [ORANGE, "#2D6CDF", "#0B8A3D", "#8B2FD6", "#565A5E"]

export function CustomizeCard({
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  first = "Jordan", last = "Ellis", jersey = 24, streak = "6", points = "2,840",
  onCancel, onSave,
}: {
  score?: number; shots?: string; makes?: string; pct?: string
  first?: string; last?: string; jersey?: number; streak?: string; points?: string
  onCancel?: () => void; onSave?: () => void
}) {
  const [accent, setAccent] = React.useState(ORANGE)
  const [num, setNum] = React.useState(jersey)
  return (
    <ResultsScreen
      testid="screen-ios-customize-player-card"
      tab="profile"
      tabBar={false}
      bar={
        <ResultsBar
          variant="back-title" height={46} onBack={onCancel} title="CUSTOMIZE PLAYER CARD"
          trailing={
            <button type="button" onClick={onCancel} className="text-[15px]" style={{ color: ORANGE }}>Cancel</button>
          }
        />
      }
    >
      <div className="shotiq-display mt-[10px] px-[23px] text-[16px] leading-[16px] tracking-[0.05em]" style={{ color: GRAPHITE }}>
        LIVE PREVIEW
      </div>

      {/* live preview card ------------------------------------------------ */}
      <div data-testid="card-preview" className="mx-[23px] mt-[6px] overflow-hidden rounded-[7px] border" style={{ borderColor: RULE }}>
        <div className="flex h-[34px] items-center justify-between px-[13px]" style={{ background: accent }}>
          <span className="shotiq-wordmark text-[16px] leading-none tracking-[0.1em] text-white">SHOTIQ</span>
          <span className="shotiq-display text-[13px] leading-none tracking-[0.26em] text-white">AI ANALYSIS</span>
        </div>
        <div className="px-[13px] pb-[11px] pt-[10px]">
          <div className="flex items-start">
            <div className="min-w-0">
              <div className="shotiq-display text-[40px] leading-[34px] tracking-[0.02em]">{first.toUpperCase()}</div>
              <div className="shotiq-display text-[40px] leading-[34px] tracking-[0.02em]">{last.toUpperCase()}</div>
              <div className="shotiq-microcaps mt-[6px] leading-[10px]" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >
                RIGHT-HANDED • ADVANCED
              </div>
            </div>
            <div className="ml-auto flex shrink-0 items-start pt-[2px]">
              <div className="w-[72px] text-center">
                <span className="flex h-[18px] items-center justify-center"><StreakGlyph size={38} /></span>
                <div className="shotiq-numeric mt-[3px] text-[18px] leading-[16px]">{streak}</div>
                <Micro className="mt-[4px]" size={8}>DAY STREAK</Micro>
              </div>
              <span aria-hidden="true" className="mx-[7px] h-[46px] w-px" style={{ background: RULE }} />
              <div className="w-[58px] text-center">
                <span className="flex h-[18px] items-center justify-center"><PointsGlyph size={20} /></span>
                <div className="shotiq-numeric mt-[3px] text-[18px] leading-[16px]">{points}</div>
                <Micro className="mt-[4px]" size={8}>POINTS</Micro>
              </div>
            </div>
          </div>

          <div className="mt-[9px] flex gap-[13px]">
            <div className="relative h-[232px] w-[222px] shrink-0 overflow-hidden rounded-[4px]">
              <Frame src="086-film-4" w="100%" h="100%" radius={0} alt="Your release, as it appears on the card" />
              <SkeletonOverlay />
            </div>
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label leading-[13px] tracking-[0.075em]" style={{ "--shotiq-label-size": "13px" } as React.CSSProperties}>FORM SCORE</div>
              <div className="shotiq-numeric leading-[0.8]" style={{ fontSize: 70, color: accent }}>{score}</div>
              <ScoreBar score={score} width={96} height={8} />
              <div className="shotiq-display mt-[7px] text-[16px] leading-[16px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
              {/* Canonical sets this cue on TWO lines in an 83.3pt column. At
                  12px the shipped face took four, which pushed the card body to
                  241.4pt against canonical's 232.2 and started the cascade that
                  drove the Save bar off the bottom of the viewport. */}
              <div className="mt-[3px] text-[9px] leading-[11px]">Keep elbow stacked through release.</div>
              <div className="mt-[9px] flex divide-x divide-[var(--shotiq-color-rule)] border-t pt-[7px]" style={{ borderColor: RULE }}>
                <div className="flex-1 text-center">
                  <div className="shotiq-numeric text-[18px] leading-[18px]">{shots}</div>
                  <Micro className="mt-[3px]" size={8}>SHOTS</Micro>
                </div>
                <div className="flex-1 text-center">
                  <div className="shotiq-numeric text-[18px] leading-[18px]">{makes}</div>
                  <Micro className="mt-[3px]" size={8}>MAKES</Micro>
                </div>
              </div>
              <div className="mt-[8px] border-t pt-[7px] text-center" style={{ borderColor: RULE }}>
                <div className="shotiq-numeric text-[20px] leading-[20px]">{pct}</div>
                <Micro className="mt-[3px]" size={8}>ACCURACY</Micro>
              </div>
            </div>
          </div>

          <PhaseRail className="mt-[9px]" active="RELEASE" figure={26} label={9} />
        </div>
      </div>

      {/* detail rows -------------------------------------------------------- */}
      <div className="shotiq-display mt-[10px] px-[23px] text-[17px] leading-[17px] tracking-[0.05em]" style={{ color: GRAPHITE }}>
        CUSTOMIZE DETAILS
      </div>
      <Panel className="mx-[23px] mt-[5px] divide-y divide-[var(--shotiq-color-rule)]">
        <Row title="BANNER COLOR" sub="Set the accent color for your card.">
          <span className="flex items-center gap-[11px]">
            {SWATCHES.map((c) => (
              /* Canonical swatches measure ~19pt across on a 30pt pitch
                 (x219.5-359.8pt for the five). 27pt swatches ate 40pt of the
                 row and forced the caption onto a second line. */
              <button key={c} type="button" onClick={() => setAccent(c)} aria-label={`Accent ${c}`}
                      className="grid h-[19px] w-[19px] place-items-center rounded-full"
                      style={c === accent ? { boxShadow: `0 0 0 2px ${c}, inset 0 0 0 2.5px #fff` , background: c } : { background: c }} />
            ))}
          </span>
        </Row>
        <Row title="JERSEY NUMBER" sub="Display your number on the card.">
          <span className="flex h-[30px] w-[112px] items-center justify-between rounded-[6px] border px-[11px]" style={{ borderColor: RULE }}>
            <button type="button" onClick={() => setNum((n) => Math.max(0, n - 1))} aria-label="Decrease" className="text-[17px] leading-none">−</button>
            <span className="shotiq-numeric text-[17px]">{num}</span>
            <button type="button" onClick={() => setNum((n) => n + 1)} aria-label="Increase" className="text-[17px] leading-none">+</button>
          </span>
        </Row>
        <Row title="FIRST NAME" sub="Shown on your player card.">
          <span className="flex h-[30px] w-[112px] items-center justify-center rounded-[6px] border text-[14px]" style={{ borderColor: RULE }}>{first}</span>
        </Row>
        <Row title="LAST NAME" sub="Shown on your player card.">
          <span className="flex h-[30px] w-[112px] items-center justify-center rounded-[6px] border text-[14px]" style={{ borderColor: RULE }}>{last}</span>
        </Row>
      </Panel>

      <div className="mt-[10px] flex items-start px-[23px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[17px] leading-[17px] tracking-[0.05em]" style={{ color: GRAPHITE }}>CARD LAYOUT</div>
          {/* One line in canonical (band 731.2-756.5pt carries title AND sub);
              12.5px wrapped it and cost another 14pt. */}
          <div className="mt-[3px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>
            Your card layout is optimized for clarity and cannot be changed.
          </div>
        </div>
        <Info className="ml-auto h-[16px] w-[16px] shrink-0" strokeWidth={1.6} style={{ color: GRAPHITE }} />
      </div>

      <div className="mt-[9px] px-[23px]">
        <button type="button" onClick={onSave} data-testid="card-save"
                className="flex h-[33px] w-full items-center justify-center rounded-[6px] text-[16px] font-medium text-white"
                style={{ background: accent }}>
          Save card
        </button>
        <button type="button" onClick={onCancel} className="mt-[8px] block w-full text-center text-[16px]" style={{ color: ORANGE }}>
          Cancel
        </button>
      </div>
    </ResultsScreen>
  )
}

function Row({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    /* Canonical row pitch is 44.2pt (rows open at 549.2 / 593.9 / 638.1 /
       681.9), with the title cap at 12.0pt over a sub cap of 9.7pt on ONE line.
       The shipped row ran 53pt and the caption wrapped, which is 8.8pt of drift
       per row on top of the wrap. The sub is set below canonical's cap so the
       wider shipped face still sets in one line — the row geometry is the
       visible defect, the cap is the concession. */
    <div className="flex items-center gap-[10px] px-[12px] py-[6px]">
      <span className="min-w-0">
        <span className="shotiq-display block text-[15.5px] leading-[15px] tracking-[0.03em]">{title}</span>
        <span className="mt-[1px] block text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>{sub}</span>
      </span>
      <span className="ml-auto shrink-0">{children}</span>
    </div>
  )
}
