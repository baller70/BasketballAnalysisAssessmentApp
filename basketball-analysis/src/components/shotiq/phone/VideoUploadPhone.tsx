"use client"

/**
 * Canonical iOS 026-video-upload.
 *
 * Round 6 painted an orphan orange "Choose video" button ABOVE the page's own
 * back link — the phone block was a single control bolted onto the desktop
 * uploader, so the element order inverted and the screen's own composition
 * (dropzone, the two action cards, the FRAMING GUIDE photo pair, the profile
 * summary, the coaching target and the phase rail) never existed.
 *
 * Measured off canonical/026-video-upload.png at 853/393 = 2.170483 px/pt
 * (scratchpad r6d/b.py):
 *
 *   header rule            38.0
 *   identity               y  52.5-102.7   name x 17.0, streak/points right
 *   section rule           ~112
 *   VIDEO UPLOAD           y 130.4-152.0   cap 21.7  x 17.5
 *   sub                    y 161.3-171.4
 *   dashed dropzone        y 182.9-320.7   x 17.0-374.1 (1px dashed, r 8)
 *     film-gate mark       y 205.0-245.1   centred
 *     "Choose video"       y 255.2-269.5   orange, cap 14.3
 *     "MP4 • 3–45 seconds" y 279.2-287.5
 *     "Best results…"      y 296.2-304.5
 *   two action cards       y 331-390       x 17-196 / 199-374
 *   FRAMING GUIDE          y 401.3-412.8   sub y 418.8-425.7
 *   two stills             y 432.6-583.7   GOOD (green) / TOO CLOSE (red)
 *   profile summary card   y 596-724       4 cells + coaching target
 *   phase rail             y 731.2-774.5
 *   tab-bar rule           786
 */

import React from "react"
import { PhoneScreen } from "@/components/shotiq/PhoneShell"
import { Chev, Frame, Micro, ScoreBar, PhaseRail } from "@/components/shotiq/phone/results/Kit"
import { ActionGlyph } from "@/components/shotiq/Glyphs"

const RULE = "var(--shotiq-color-rule)"
const ORANGE = "var(--shotiq-color-shotiqOrange)"
const GREEN = "var(--shotiq-color-confirmGreen)"
const BLUE = "var(--shotiq-color-analysisBlue)"
const RED = "var(--shotiq-color-reviewRed)"
const GRAPHITE = "var(--shotiq-color-graphite)"

export function VideoUploadPhone({
  name = "Jordan Ellis",
  sub = "Right-handed • Advanced",
  streak = "6",
  points = "2,840",
  score = 82,
  shots = "24",
  makes = "15",
  pct = "62.5%",
  target = "Keep elbow stacked through release",
  onChoose,
  onRecord,
}: {
  name?: string; sub?: string; streak?: string; points?: string
  score?: number; shots?: string; makes?: string; pct?: string; target?: string
  onChoose?: () => void
  onRecord?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-video-upload" tab="capture" pad={0} headerH={38}>
      <div style={{ paddingLeft: 17, paddingRight: 17, paddingBottom: 70 }}>
        <div className="flex items-start justify-between pt-[14px] pb-[12px]"
             style={{ borderBottom: `1px solid ${RULE}` }}>
          <div className="min-w-0">
            <div className="shotiq-display text-[31px] leading-[30px] tracking-[0.035em]">{name.toUpperCase()}</div>
            <div className="mt-[3px] text-[12.4px] leading-[14px]" style={{ color: GRAPHITE }}>{sub}</div>
          </div>
          <div className="flex shrink-0 items-start">
            <div className="w-[80px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="uploadVideo" height={17} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{streak}</div>
              <Micro className="mt-[4px]" size={8.6}>DAY STREAK</Micro>
            </div>
            <span aria-hidden="true" className="mx-[6px] mt-[2px] h-[52px] w-px" style={{ background: RULE }} />
            <div className="w-[64px] text-center">
              <span className="flex h-[20px] items-center justify-center"><ActionGlyph kind="nodeGraph" height={19} /></span>
              <div className="shotiq-numeric mt-[5px] text-[19.5px] leading-[16px]">{points}</div>
              <Micro className="mt-[4px]" size={8.6}>POINTS</Micro>
            </div>
          </div>
        </div>

        <div className="mt-[13px] shotiq-display text-[29px] leading-[28px] tracking-[0.025em]">VIDEO UPLOAD</div>
        <div className="mt-[6px] text-[12.6px] leading-[14px]" style={{ color: GRAPHITE }}>
          Upload a clear video of your shot for AI analysis.
        </div>

        {/* The dropzone IS the choose-video control, exactly as canonical draws
            it: one dashed box whose label is the action. */}
        <button type="button" onClick={onChoose} data-testid="phone-choose-video"
                className="mt-[9px] flex w-full flex-col items-center rounded-[8px] px-[12px] pb-[13px] pt-[17px]"
                style={{ border: `1.4px dashed ${RULE}` }}>
          <ActionGlyph kind="uploadVideo" height={34} />
          <span className="mt-[9px] text-[18px] leading-[19px]" style={{ color: ORANGE }}>Choose video</span>
          <span className="mt-[8px] text-[11.8px] leading-[12px]" style={{ color: GRAPHITE }}>MP4 • 3–45 seconds</span>
          <span className="mt-[7px] text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>
            Best results in portrait orientation.
          </span>
        </button>

        <div className="mt-[9px] flex gap-[8px]">
          <button type="button" onClick={onRecord} data-testid="phone-record-video"
                  className="flex min-w-0 flex-1 items-center gap-[9px] rounded-[7px] bg-white px-[9px] py-[9px] text-left"
                  style={{ border: `1px solid ${RULE}` }}>
            <ActionGlyph kind="analyze" height={23} />
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[13.4px] leading-[15px]">Record video</span>
              <span className="mt-[3px] block whitespace-nowrap text-[11.4px] leading-[12px]" style={{ color: GRAPHITE }}>Use your camera</span>
            </span>
          </button>
          <a href="/upload/photo-access"
             className="flex min-w-0 flex-1 items-center gap-[8px] rounded-[7px] bg-white px-[9px] py-[9px]"
             style={{ border: `1px solid ${RULE}` }} data-testid="phone-filming-tips">
            <svg width="26" height="22" viewBox="0 0 30 26" fill="none" aria-hidden="true" className="shrink-0"
                 stroke={BLUE} strokeWidth="1.8" strokeLinecap="round">
              <path d="M3 21 A13 13 0 0 1 27 21" strokeDasharray="3.4 3.4" />
              <circle cx="15" cy="7" r="2.6" fill="#fff" />
              <circle cx="8" cy="13" r="2.6" fill="#fff" />
              <circle cx="4" cy="21" r="2.6" fill="#fff" />
            </svg>
            <span className="min-w-0">
              <span className="block whitespace-nowrap text-[13.4px] leading-[15px]">View filming tips</span>
              <span className="mt-[3px] block text-[11.4px] leading-[12.6px]" style={{ color: GRAPHITE }}>
                Learn the best way<br />to film your shot
              </span>
            </span>
            <span className="ml-auto flex"><Chev size={15} /></span>
          </a>
        </div>

        <div className="mt-[11px] shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">FRAMING GUIDE</div>
        <div className="mt-[5px] text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>
          Full body in frame from feet to above release.
        </div>

        <div className="mt-[7px] flex gap-[11px]">
          {([["086-film-3", "GOOD", GREEN, true], ["086-film-1", "TOO CLOSE", RED, false]] as const).map(
            ([src, tag, tone, ok]) => (
              <span key={tag} className="relative block min-w-0 flex-1">
                <Frame src={src} w="100%" h={145} radius={4} pos={ok ? "50% 38%" : "50% 2%"} />
                <span className="shotiq-display absolute left-[7px] top-[7px] rounded-[3px] px-[7px] text-[13px] leading-[21px] tracking-[0.05em] text-white"
                      style={{ background: tone }}>{tag}</span>
                <span className="absolute bottom-[-11px] left-1/2 grid h-[26px] w-[26px] -translate-x-1/2 place-items-center rounded-full"
                      style={{ background: tone }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true">
                    {ok
                      ? <path d="M3 7.4 L5.8 10.2 L11 4.4" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      : <path d="M4 4 L10 10 M10 4 L4 10" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />}
                  </svg>
                </span>
              </span>
            ))}
        </div>

        <div className="mt-[16px] rounded-[7px] px-[11px] pb-[9px] pt-[8px]"
             style={{ border: `1px solid ${RULE}`, background: "var(--shotiq-color-warmCanvas)" }}>
          <div className="shotiq-section-label leading-[12px] tracking-[0.075em]"
               style={{ "--shotiq-label-size": "12px" } as React.CSSProperties}>YOUR PROFILE SUMMARY</div>
          <div className="mt-[8px] flex">
            {[[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]].map(([v, l], i) => (
              <div key={l} className="min-w-0 flex-1 pr-[8px]"
                   style={i ? { borderLeft: `1px solid ${RULE}`, paddingLeft: 10 } : undefined}>
                <div className="shotiq-numeric text-[20px] leading-[21px]">{v}</div>
                <Micro className="mt-[3px]" size={8.2}>{l}</Micro>
              </div>
            ))}
            <div className="w-[110px] shrink-0 pl-[10px]" style={{ borderLeft: `1px solid ${RULE}` }}>
              <div className="shotiq-numeric text-[20px] leading-[21px]" style={{ color: ORANGE }}>{score}</div>
              <Micro className="mt-[3px]" size={8.2}>FORM SCORE</Micro>
              <ScoreBar score={score} width={100} height={5} />
            </div>
          </div>
          <div className="mt-[9px] flex items-center gap-[10px]"
               style={{ borderTop: `1px solid ${RULE}`, paddingTop: 9 }}>
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label leading-[11px] tracking-[0.08em]"
                   style={{ "--shotiq-label-size": "11px" } as React.CSSProperties}>PRIMARY COACHING TARGET</div>
              <div className="mt-[5px] truncate text-[16px] leading-[17px]">{target}</div>
            </div>
            <Chev size={16} />
          </div>
        </div>

        <PhaseRail active="RELEASE" figure={26} label={9} className="mt-[8px]" />
      </div>
    </PhoneScreen>
  )
}
