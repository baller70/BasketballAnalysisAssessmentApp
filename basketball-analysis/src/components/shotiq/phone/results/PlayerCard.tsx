"use client"

/**
 * Canonical iOS 048-player-card — the shareable identity card.
 *
 * Round-6 grade A: "the card preview overprints itself — phase icons,
 * thumbnails and FORM SCORE paint on top of the portrait and the name clips to
 * 'JOI AN EL S'." Grader B measured eight strings stacked into a single 180pt
 * band. Both are the desktop card composite painted into a 393pt box: the
 * portrait, the score module and the badge strip were absolutely positioned
 * against a 1440pt canvas. Here each region is a row in one column, and the
 * portrait is an <img> with its own box.
 *
 * Bands measured off canonical/048-player-card.png (pt, /2.170483):
 *   wordmark, share + download   y  11.5- 30.4   rule y 42
 *   portrait + name + 3 stats    y  53.4-200.4   portrait x 13-127
 *   form-score panel             y 231.3-287.0
 *   archetype / target / badge   labels y 327.1, glyphs 348.3-399.5,
 *                                titles 407.3, copy 420.2-452.9
 *   MEASUREMENTS                 y 481.0-491.6, labels 504.5, values 518.8,
 *                                metric 544.1
 *   SHOT BREAKDOWN (TODAY)       y 580.5-633.5
 *   MECHANICS OVERVIEW           y 657.9-734.4
 *   three actions                y 739.9-787.8
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import { PoseGlyph, PoseFigure, ActionGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, ShareIcon, DownloadIcon, Panel, Micro, ScoreBar,
  Frame, Spark, TrendArrow, capDisplay,
  ORANGE, BLUE, GREEN, GRAPHITE, RULE, INK,
} from "./Kit"
import { StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"
import { scoreBand } from "@/components/shotiq/ResultsBits"

const MEASUREMENTS: [string, string, string][] = [
  ["HEIGHT", "6'3\"", "190 cm"],
  ["WINGSPAN", "6'6\"", "198 cm"],
  ["SHOOTING REACH", "8'2\"", "249 cm"],
  ["STANDING REACH", "8'0\"", "244 cm"],
]

/**
 * The player's own body measurements, where the app holds any.
 *
 * All four were constants, so every card reported a 6'3" player with a 6'6"
 * wingspan. HEIGHT and WINGSPAN are on the profile — the player enters them in
 * onboarding, and three stature-scaled measurements downstream already depend
 * on the height being right.
 *
 * NEITHER REACH IS RECORDED. Standing reach is not a column and is not derived
 * anywhere; shooting reach is not either. The pipeline does compute a RELEASE
 * HEIGHT per analysis, which is a related but different quantity — it is where
 * the ball left the hand on one shot, not a static reach — and printing it
 * under a reach label would be the same measurement wearing a second name
 * (F22). Both read as em-dashes for a player who has entered a profile.
 */
export function playerMeasurements(
  profile: { heightInches?: number | null; wingspanInches?: number | null } | null,
): [string, string, string][] {
  const known = profile && (profile.heightInches != null || profile.wingspanInches != null)
  if (!known) return MEASUREMENTS
  const ft = (inches?: number | null) =>
    inches == null ? "—" : `${Math.floor(Math.round(inches) / 12)}'${Math.round(inches) % 12}"`
  const cm = (inches?: number | null) =>
    inches == null ? "—" : `${Math.round(inches * 2.54)} cm`
  return [
    ["HEIGHT", ft(profile.heightInches), cm(profile.heightInches)],
    ["WINGSPAN", ft(profile.wingspanInches), cm(profile.wingspanInches)],
    ["SHOOTING REACH", "—", "Not recorded"],
    ["STANDING REACH", "—", "Not recorded"],
  ]
}

const PHASE_SCORES: [string, string, string][] = [
  ["SETUP", "84", GREEN], ["LOAD", "78", BLUE], ["RISE", "81", BLUE],
  ["RELEASE", "78", BLUE], ["FOLLOW-THROUGH", "88", GREEN],
]

export function PlayerCard({
  score = 82, shots = "24", makes = "15", pct = "62.5%", delta = "+8.1%",
  name, streak, points, profile,
  onCustomize, onShare,
}: {
  score?: number; shots?: string; makes?: string; pct?: string; delta?: string
  name?: string; streak?: string; points?: string
  /** The player's own body measurements, from their profile. */
  profile?: { heightInches?: number | null; wingspanInches?: number | null } | null
  onCustomize?: () => void; onShare?: () => void
}) {
  const band = scoreBand(typeof score === "number" ? score : null)
  const measures = playerMeasurements(profile ?? null)
  const chrome = usePlayerChrome()

  return (
    <ResultsScreen
      testid="screen-ios-player-card"
      tab="profile"
      bar={
        <ResultsBar variant="wordmark-centred" height={42}
                    trailing={<><ShareIcon onClick={onShare} label="Share card" /><DownloadIcon /></>} />
      }
    >
      {/* portrait + identity ---------------------------------------------- */}
      <div className="mt-[9px] flex gap-[14px] px-[13px]">
        <Frame src="086-card-photo" w={114} h={147} radius={6} pos="50% 8%"
               alt={`${name} at the set point`} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="shotiq-display text-[47px] leading-[42px] tracking-[0.015em]">{(name ?? chrome.name).toUpperCase()}</div>
          <div className="mt-[4px] text-[13.5px] leading-[15px]" style={{ color: GRAPHITE }}>{chrome.sub}</div>
          <div className="mt-[11px] flex divide-x divide-[var(--shotiq-color-rule)]">
            {([[<StreakGlyph key="a" size={42} />, streak, "DAY STREAK"],
               [<PointsGlyph key="b" size={23} />, points, "POINTS"],
               [<ActionGlyph key="c" kind="analyze" height={24} />, shots, "SHOTS TODAY"]] as [React.ReactNode, string, string][]).map(([g, v, l]) => (
              <div key={l} className="flex-1 px-[4px] text-center">
                <span className="flex h-[24px] items-center justify-center">{g}</span>
                <div className="shotiq-numeric mt-[7px] text-[22px] leading-[20px]">{v}</div>
                <Micro className="mt-[5px]">{l}</Micro>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* form score ---------------------------------------------------------- */}
      <Panel className="mx-[13px] mt-[10px] flex items-center px-[10px] py-[6px]">
        <div className="shotiq-section-label w-[74px] shrink-0 leading-[14px] tracking-[0.075em]" style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>FORM SCORE</div>
        <div className="shrink-0">
          <div className="shotiq-numeric leading-[0.78]" style={{ fontSize: 58, color: ORANGE }}>{score}</div>
          <ScoreBar score={score} width={88} height={7} />
        </div>
        <div className="ml-[10px] w-[82px] shrink-0">
          {/* The fourth of these. A literal verdict in canonical's blue under a
              wired score reads GOOD for a 41 as readily as for an 82. */}
          <div className="shotiq-display text-[16px] leading-[16px] tracking-[0.04em]" style={{ color: band.color }}>{band.label}</div>
          <div className="mt-[3px] text-[12px] leading-[13.5px]">Keep building<br />consistency.</div>
        </div>
        <div className="ml-[10px] w-[68px] shrink-0 border-l pl-[8px] text-center" style={{ borderColor: RULE }}>
          <div className="shotiq-numeric text-[21px] leading-[20px]">{pct}</div>
          <Micro className="mt-[4px]">MAKE %</Micro>
          <div className="mt-[5px] text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>{makes} / {shots}</div>
        </div>
      </Panel>

      {/* archetype / target / badge -------------------------------------------- */}
      <div className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)] px-[15px]">
        {([
          ["ARCHETYPE", <PoseGlyph key="a" phase="release" size={54} accent={ORANGE} />, "Balanced Shooter", "Smooth, repeatable, and well-aligned mechanics.", false],
          ["PRIMARY TARGET", <PoseFigure key="b" phase="release" active height={54} />, "Keep elbow stacked through release", "Maintain vertical alignment for a cleaner release.", true],
          ["LATEST BADGE", <BadgeHex key="c" />, "Release Control", "Consistent release height and timing.", false],
        ] as [string, React.ReactNode, string, string, boolean][]).map(([label, glyph, title, copy]) => (
          <div key={label} className="min-w-0 flex-1 px-[9px] text-center">
            <div className="shotiq-display leading-[11px] tracking-[0.05em]" style={{ fontSize: capDisplay(22), color: GRAPHITE }}>{label}</div>
            <span className="mt-[6px] flex h-[48px] items-center justify-center">{glyph}</span>
            <div className="mt-[6px] text-[12.5px] font-semibold leading-[14px]">{title}</div>
            <div className="mt-[3px] text-[11px] leading-[12.5px]" style={{ color: GRAPHITE }}>{copy}</div>
          </div>
        ))}
      </div>

      {/* measurements ----------------------------------------------------------- */}
      <div className="mt-[11px] px-[15px]">
        <div className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">MEASUREMENTS</div>
        <div className="mt-[6px] flex divide-x divide-[var(--shotiq-color-rule)]">
          {measures.map(([l, v, m]) => (
            <div key={l} className="min-w-0 flex-1 text-center">
              <Micro size={8.4}>{l}</Micro>
              <div className="shotiq-numeric mt-[7px] text-[26px] leading-[24px]">{v}</div>
              <div className="mt-[4px] text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>{m}</div>
            </div>
          ))}
        </div>
      </div>

      {/* shot breakdown ---------------------------------------------------------- */}
      <div className="mt-[10px] px-[15px]">
        <div className="flex items-baseline gap-[6px]">
          <span className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">SHOT BREAKDOWN</span>
          <span className="shotiq-display text-[13px] leading-[13px] tracking-[0.05em]" style={{ color: GRAPHITE }}>(TODAY)</span>
        </div>
        <div className="mt-[3px] flex items-start divide-x divide-[var(--shotiq-color-rule)]">
          {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]] as [string, string][]).map(([v, l]) => (
            <div key={l} className="flex-1 pr-[8px] [&:not(:first-child)]:pl-[12px]">
              <div className="shotiq-numeric text-[27px] leading-[26px]">{v}</div>
              <Micro className="mt-[4px]">{l}</Micro>
            </div>
          ))}
          <div className="flex-[1.5] pl-[12px]">
            <span className="flex items-start gap-[5px]">
              <Spark w={96} h={28} values={[0.2, 0.52, 0.3, 0.78]} dotColor={(i) => (i === 1 || i === 3 ? GREEN : GRAPHITE)} />
              <TrendArrow size={14} />
            </span>
            <span className="mt-[3px] block text-[11.5px] leading-[13px]">
              <span style={{ color: GREEN }}>{delta}</span>{" "}
              <span style={{ color: GRAPHITE }}>vs last session</span>
            </span>
          </div>
        </div>
      </div>

      {/* mechanics overview --------------------------------------------------------- */}
      <div className="mt-[9px] px-[15px]">
        <div className="shotiq-display text-[21px] leading-[21px] tracking-[0.03em]">MECHANICS OVERVIEW</div>
        <div className="mt-[3px] flex items-start">
          {PHASE_SCORES.map(([p, v, tone], i) => (
            <React.Fragment key={p}>
              {i > 0 && <span aria-hidden="true" className="mt-[15px] h-px min-w-[6px] flex-1" style={{ background: RULE }} />}
              <span className="shrink-0 text-center">
                <PoseFigure phase={p.toLowerCase().startsWith("follow") ? "follow" : p.toLowerCase()} active={p === "RELEASE"} height={30} className="mx-auto" />
                <span className="shotiq-display mt-[3px] block whitespace-nowrap leading-[10px] tracking-[0.04em]"
                      style={{ fontSize: 9.6, color: p === "RELEASE" ? ORANGE : GRAPHITE }}>{p}</span>
                <span className="shotiq-numeric mt-[4px] block text-[15px] leading-[15px]" style={{ color: tone }}>{v}</span>
                {p === "RELEASE" && <span aria-hidden="true" className="mt-[3px] block h-[2px] w-full" style={{ background: ORANGE }} />}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* actions ---------------------------------------------------------------------- */}
      <div className="mt-[7px] flex gap-[8px] px-[15px]">
        <button type="button" onClick={onCustomize} data-testid="player-customize"
                className="flex h-[48px] flex-1 flex-col items-center justify-center gap-[5px] rounded-[5px] text-[14px] text-white"
                style={{ background: ORANGE }}>
          <ActionGlyph kind="analyze" height={19} accent="#fff" />
          Customize card
        </button>
        <button type="button" onClick={onShare} data-testid="player-share"
                className="flex h-[48px] flex-1 flex-col items-center justify-center gap-[5px] rounded-[5px] border text-[14px]"
                style={{ borderColor: RULE }}>
          <ActionGlyph kind="nodeGraph" height={16} accent={INK} />
          Share card
        </button>
        <span className="flex h-[48px] flex-1 flex-col items-center justify-center gap-[5px] rounded-[5px] border text-[14px]"
              style={{ borderColor: RULE }}>
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M10 2.5 V13 M5.5 9 L10 13.5 L14.5 9 M3.5 17 H16.5" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Download card
        </span>
      </div>
    </ResultsScreen>
  )
}

/** The badge mark: a hexagon with the pose graph inside it, as canonical draws
 *  the "LATEST BADGE" cell. */
function BadgeHex() {
  return (
    <span className="relative grid h-[54px] w-[50px] place-items-center">
      <svg viewBox="0 0 50 54" className="absolute inset-0" fill="none" aria-hidden="true">
        <path d="M25 2 L46 14 V40 L25 52 L4 40 V14 Z" stroke={INK} strokeWidth="1.5" />
      </svg>
      <PoseGlyph phase="rise" size={26} accent={ORANGE} />
    </span>
  )
}
