"use client"

/**
 * Canonical iOS screen 072-share-results.
 *
 * The SHARE control on the player card used to call `navigator.share` /
 * clipboard and draw nothing, so the capture of it came back byte-identical to
 * 048-player-card. Canonical 072 is not the OS share sheet — it is ShotIQ's own
 * surface: a preview of exactly what a recipient sees, above the four ways to
 * send it. The OS sheet, where the platform has one, opens from "Share image".
 *
 * This screen carries no tab bar in canonical; it is a full-bleed sheet.
 *
 * Measured off canonical/072-share-results.png at 1:1 / 2.170483:
 *
 *   SHARE RESULTS      y  10.1- 28.6  cap 18.9, centred
 *   subtitle           y  43.8- 52.1  centred, x 75.1-319.3
 *   preview card       y  68.2-699.4  x 13.4-378.7
 *     wordmark row     y  82.9-107.8  x 29.5-359.8
 *     rule             y 119.8        x 28.1-364.0
 *     name + score     y 135.0-189.4
 *     score bar        y 194.4-200.9  x 284.3-364.0
 *     rule             y 211.0
 *     target label row y 223.5-237.7
 *     target + goal    y 243.3-258.5
 *     media + list     y 273.7-537.7  x 19.8-370.4
 *     phase figures    y 547.8-574.5, labels y 579.6, underline y 591.6
 *     rule             y 602.2
 *     stats row        y 615.5-648.2
 *     rule             y 662.5
 *     footer           y 676.8-684.6
 *   SHARE PREVIEW      y 713.7-722.9  centred
 *   action tiles       y 730.7-802.1  x 32.3-105.0 / 117.9-190.3 /
 *                                       203.6-273.7 / 286.6-357.5
 *   privacy note       y 817.3-832.5  centred
 */

import React from "react"
import { PhoneHeading, MiniTrend } from "@/components/shotiq/PhoneShell"
import { PhaseTrack, MechanicGlyph, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

const ORANGE = "var(--shotiq-color-shotiqOrange)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const GREEN = "var(--shotiq-color-confirmGreen)"

const HIGHLIGHTS: [string, string][] = [
  ["ELBOW STACK", "GOOD"],
  ["RELEASE ANGLE", "GOOD"],
  ["WRIST SNAP", "GOOD"],
  ["FOLLOW-THROUGH", "GOOD"],
]

const ACTIONS: [string, React.ReactNode][] = [
  ["Share image",
    <svg key="a" width="34" height="38" viewBox="0 0 34 38" aria-hidden="true" className="block">
      <path d="M17 25V3M8.4 11.6 17 3l8.6 8.6" fill="none" stroke={ORANGE} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 22v11a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3V22" fill="none" stroke={ORANGE} strokeWidth="2.4" strokeLinecap="round" />
    </svg>],
  ["Save image",
    <svg key="b" width="34" height="38" viewBox="0 0 34 38" aria-hidden="true" className="block">
      <path d="M17 3v22M8.4 16.4 17 25l8.6-8.6" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 26v7a3 3 0 0 0 3 3h24a3 3 0 0 0 3-3v-7" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
    </svg>],
  ["Copy",
    <svg key="c" width="34" height="38" viewBox="0 0 34 38" aria-hidden="true" className="block">
      <rect x="10" y="2" width="22" height="26" rx="4" fill="none" stroke="#111" strokeWidth="2.4" />
      <path d="M24 34H6a4 4 0 0 1-4-4V10" fill="none" stroke="#111" strokeWidth="2.4" strokeLinecap="round" />
    </svg>],
  ["More",
    <svg key="d" width="34" height="38" viewBox="0 0 34 38" aria-hidden="true" className="block">
      {[7, 17, 27].map((x) => <circle key={x} cx={x} cy="19" r="3.4" fill="#111" />)}
    </svg>],
]

export function ShareResults({ onShare, onSave, onCopy, onMore }: {
  onShare?: () => void; onSave?: () => void; onCopy?: () => void; onMore?: () => void
}) {
  const handlers = [onShare, onSave, onCopy, onMore]
  return (
    <div
      data-testid="screen-ios-share-results"
      className="shotiq-canonical relative mx-auto min-h-[852px] w-full max-w-[393px] overflow-hidden bg-[var(--shotiq-color-paper)] text-[var(--shotiq-color-ink)]"
    >
      <PhoneHeading size={26.8} className="pt-[7px] text-center">SHARE RESULTS</PhoneHeading>
      <p className="mt-[13px] text-center text-[11.6px] leading-[13px] text-[var(--shotiq-color-graphite)]">
        Preview what others will see. Private data is excluded.
      </p>

      {/* ----------------------------------------------------- preview card */}
      <div className="mx-[13.4px] mt-[15px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[15px] pb-[12px] pt-[12px]">
        <div className="flex items-center">
          <div className="shotiq-wordmark text-[21.5px] leading-none tracking-[0.02em]">
            SHOT<span style={{ color: ORANGE }}>IQ</span>
          </div>
          <div className="ml-auto flex items-center">
            <div className="flex items-center gap-[8px] pr-[13px]">
              <StreakGlyph size={38} />
              <div>
                <div className="shotiq-numeric text-[17px] leading-[17px]">6</div>
                <div className="shotiq-microcaps mt-[3px] text-[8px] leading-[8px] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
              </div>
            </div>
            <span aria-hidden="true" className="h-[34px] w-px bg-[var(--shotiq-color-rule)]" />
            <div className="flex items-center gap-[8px] pl-[13px]">
              <PointsGlyph size={20} />
              <div>
                <div className="shotiq-numeric text-[17px] leading-[17px]">2,840</div>
                <div className="shotiq-microcaps mt-[3px] text-[8px] leading-[8px] text-[var(--shotiq-color-graphite)]">POINTS</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-[12px] flex items-start border-t border-[var(--shotiq-color-rule)] pt-[15px]">
          <div className="min-w-0 flex-1">
            <div className="shotiq-display text-[34.4px] leading-[35px]">JORDAN ELLIS</div>
            <div className="mt-[6px] text-[11.4px] leading-[13px] tracking-[-0.04em] text-[var(--shotiq-color-graphite)]">
              Right-handed • Advanced
            </div>
          </div>
          <div className="shrink-0 text-center">
            <div className="shotiq-section-label text-[11px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
              FORM SCORE
            </div>
            <div className="shotiq-numeric mt-[1px] text-[48px] leading-[48px]" style={{ color: ORANGE }}>82</div>
            <div className="mt-[3px] h-[5px] w-[80px] rounded-full bg-[var(--shotiq-color-rule)]">
              <div className="h-full w-[82%] rounded-full" style={{ background: ORANGE }} />
            </div>
          </div>
        </div>

        <div className="mt-[10px] flex items-start border-t border-[var(--shotiq-color-rule)] pt-[11px]">
          <div className="min-w-0 flex-1">
            <div className="shotiq-section-label text-[11px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
              PRIMARY COACHING TARGET
            </div>
            <div className="mt-[7px] text-[16px] font-medium leading-[18px]">Keep elbow stacked through release</div>
          </div>
          <div className="ml-[10px] shrink-0 text-right">
            <span className="inline-block rounded-[4px] border px-[7px] py-[2px] text-[9.5px] font-bold leading-[12px] tracking-[0.05em]"
                  style={{ borderColor: GREEN, color: GREEN }}>
              ACTIVE GOAL
            </span>
            <div className="mt-[8px] flex items-center gap-[7px]">
              <span className="shotiq-numeric text-[14px] leading-[15px]" style={{ color: GREEN }}>72%</span>
              <span className="h-[6px] w-[84px] rounded-full bg-[var(--shotiq-color-rule)]">
                <span className="block h-full w-[72%] rounded-full" style={{ background: GREEN }} />
              </span>
            </div>
          </div>
        </div>

        {/* media + highlights */}
        <div className="-mx-[15px] mt-[9px] flex">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/083-hero.png" alt="Analyzed frame with the pose graph traced over it"
               className="h-[264px] w-[232px] shrink-0 object-cover" />
          <div className="min-w-0 flex-1 border-l border-[var(--shotiq-color-rule)] px-[9px]">
            <div className="shotiq-section-label pt-[6px] text-center text-[10.5px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
              MECHANICS HIGHLIGHTS
            </div>
            <div className="divide-y divide-[var(--shotiq-color-rule)]">
              {HIGHLIGHTS.map(([label, verdict], i) => (
                <div key={label} className="flex items-center gap-[8px] py-[8px]">
                  <span className="flex w-[36px] shrink-0 justify-center">
                    <MechanicGlyph kind={(["angle", "arc", "wrist", "balance"] as const)[i]} size={30} />
                  </span>
                  <span className="min-w-0">
                    <span className="shotiq-microcaps block text-[9.6px] leading-[11px]">{label}</span>
                    <span className="shotiq-display mt-[3px] block text-[13px] leading-[14px]" style={{ color: BLUE }}>{verdict}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <PhaseTrack className="mt-[10px]" figure={27} label={10.5} underline />

        <div className="mt-[8px] flex items-center border-t border-[var(--shotiq-color-rule)] pt-[9px]">
          {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, l]) => (
            <div key={l} className="min-w-0 flex-1">
              <div className="shotiq-numeric text-[22px] leading-[24px]">{v}</div>
              <div className="shotiq-microcaps mt-[3px] text-[9px] leading-[10px] text-[var(--shotiq-color-graphite)]">{l}</div>
            </div>
          ))}
          <div className="min-w-0 flex-[1.5]">
            <div className="flex items-start gap-[3px]">
              <MiniTrend width={78} height={24} />
              <svg width="12" height="12" viewBox="0 0 16 16" aria-hidden="true" className="mt-[1px]">
                <path d="M3 13 L13 3 M6 3 H13 V10" fill="none" stroke={GREEN} strokeWidth="1.6" />
              </svg>
            </div>
            <div className="mt-[2px] flex items-baseline gap-[6px] text-[9px] leading-[10px]">
              <span style={{ color: GREEN }}>+8.1%</span>
              <span className="shotiq-microcaps text-[8.6px] text-[var(--shotiq-color-graphite)]">VS LAST SESSION</span>
            </div>
          </div>
        </div>

        <div className="mt-[9px] flex items-center justify-between border-t border-[var(--shotiq-color-rule)] pt-[11px]">
          <span className="shotiq-microcaps text-[9.6px] leading-[10px] text-[var(--shotiq-color-graphite)]">ANALYZED TODAY AT 8:24 AM</span>
          <span className="shotiq-microcaps text-[9.6px] leading-[10px] text-[var(--shotiq-color-graphite)]">SHOTIQ.COM</span>
        </div>
      </div>

      {/* --------------------------------------------------------- actions */}
      <div className="shotiq-section-label mt-[15px] text-center text-[12.5px] leading-[13px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
        SHARE PREVIEW
      </div>
      <div className="mt-[8px] flex gap-[13px] px-[32.3px]">
        {ACTIONS.map(([label, glyph], i) => (
          <button key={label} type="button" onClick={handlers[i]}
                  data-testid={`share-${label.split(" ")[0].toLowerCase()}`}
                  className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] pb-[9px] pt-[12px]">
            {glyph}
            <span className="mt-[8px] text-[11px] leading-[12px]">{label}</span>
          </button>
        ))}
      </div>

      <div className="mt-[15px] flex items-center justify-center gap-[9px] text-[11.5px] leading-[13px] text-[var(--shotiq-color-graphite)]">
        <svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true" className="shrink-0">
          <rect x="1" y="6.8" width="13" height="9.2" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.8 6.8V4.6a3.7 3.7 0 0 1 7.4 0v2.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        Private media, session clips, and personal notes are not included.
      </div>
    </div>
  )
}
