"use client"

/**
 * Canonical iOS screen 027-video-review — the state /video-analysis/upload
 * enters once a clip has been chosen and before it is sent for analysis.
 *
 * Measured off canonical/027-video-review.png at 1:1 / 2.170483:
 *
 *   wordmark row        y  18.0- 37.8   (this screen carries no header rule)
 *   back + titles       y  53.4-130.8   x 21.2-360.3
 *   identity stat row   y 142.4-165.4   x 22.6-371.3
 *   primary-target card y 176.0-218.8   x 22.1-370.4
 *   video frame         y 227.6-441.4   x 20.7-370.9  (350.6 x 213.8)
 *   trim hint           y 452.0-460.7   cap+desc 9.2
 *   trim rail           y 465.8-519.7   x 20.7-371.3  (53.9 tall)
 *   timecodes           y 525.7-534.9
 *   VIDEO DETAILS       y 546.0-559.3   cap 13.8
 *   detail cells        y 567.6-593.9
 *   how-it-works card   y 607.2-681.4
 *   Analyze video       y 690.6-724.7   (filled orange, 34.1 tall)
 *   Trim / Change video y 732.1-763.0
 *   Edit player profile y 768.5-797.1
 */

import React from "react"
import Link from "next/link"
import {
  PhoneScreen, PhoneHeading,
} from "@/components/shotiq/PhoneShell"
import { ActionGlyph, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"

const ORANGE = "var(--shotiq-color-shotiqOrange)"

export type ClipMeta = {
  durationLabel: string
  resolution: string
  sizeLabel: string
  fps: string
}

export function VideoReview({
  clip, onAnalyze, onChange,
}: { clip: ClipMeta; onAnalyze?: () => void; onChange?: () => void }) {
  const DETAILS: [React.ReactNode, string, string][] = [
    [<svg key="d" width="21" height="21" viewBox="0 0 21 21" aria-hidden="true" className="block">
       <circle cx="10.5" cy="10.5" r="9.3" fill="none" stroke="#111" strokeWidth="1.4" />
       <path d="M10.5 5.2v5.3l3.7 2.6" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
     </svg>, clip.durationLabel, "DURATION"],
    [<svg key="o" width="24" height="21" viewBox="0 0 24 21" aria-hidden="true" className="block">
       <rect x="1" y="1" width="12" height="19" rx="2" fill="none" stroke="#111" strokeWidth="1.4" />
       <path d="M16 7a4.6 4.6 0 0 1 0 7M19 4.4a8.4 8.4 0 0 1 0 12.2" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
     </svg>, clip.resolution, "ORIENTATION"],
    [<svg key="s" width="22" height="20" viewBox="0 0 22 20" aria-hidden="true" className="block">
       <rect x="1" y="1" width="20" height="18" rx="2" fill="none" stroke="#111" strokeWidth="1.4" strokeDasharray="4 3" />
     </svg>, clip.sizeLabel, "FILE SIZE"],
    [<svg key="f" width="26" height="20" viewBox="0 0 26 20" aria-hidden="true" className="block">
       <rect x="5" y="1" width="20" height="15" rx="1" fill="none" stroke="#111" strokeWidth="1.4" />
       <rect x="1" y="4" width="20" height="15" rx="1" fill="none" stroke="#111" strokeWidth="1.4" />
       <path d="M1 8h20M1 15h20" stroke="#111" strokeWidth="1.1" />
     </svg>, clip.fps, "FRAME RATE"],
  ]

  return (
    <PhoneScreen testid="screen-ios-video-review" tab="home" pad={20.7} header={false}>
      {/* This screen's header carries no rule in canonical, so it is drawn
          here rather than taken from PhoneHeader. */}
      <div className="flex h-[52px] items-center pt-[6px]">
        <Link href="/dashboard" className="shotiq-wordmark text-[17.5px] leading-none tracking-[0.15em]">
          SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
        </Link>
        <Link href="/settings" aria-label="Settings" className="ml-auto">
          <svg width="21" height="21" viewBox="0 0 21 21" aria-hidden="true" className="block">
            <circle cx="10.5" cy="10.5" r="3.4" fill="none" stroke="#111" strokeWidth="1.5" />
            <path d="M10.5 1.2v2.6M10.5 17.2v2.6M1.2 10.5h2.6M17.2 10.5h2.6M3.9 3.9l1.9 1.9M15.2 15.2l1.9 1.9M17.1 3.9l-1.9 1.9M5.8 15.2l-1.9 1.9"
                  stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </Link>
      </div>

      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-[10px]">
            <button type="button" onClick={onChange} aria-label="Back" className="shrink-0">
              <svg width="20" height="14" viewBox="0 0 20 14" aria-hidden="true" className="block">
                <path d="M19 7H1.6M7.4 1.4 1.4 7l6 5.6" fill="none" stroke="#111" strokeWidth="1.6"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <PhoneHeading size={18} className="text-[var(--shotiq-color-graphite)]">AI ANALYSIS</PhoneHeading>
          </div>
          <PhoneHeading size={38} className="mt-[7px]">VIDEO REVIEW</PhoneHeading>
          <p className="mt-[8px] text-[11.5px] leading-[14px] tracking-[-0.02em] text-[var(--shotiq-color-graphite)]">
            Review your clip and adjust the range<br />before we analyze.
          </p>
        </div>
        <div className="flex shrink-0 items-start pt-[3px]">
          <div className="w-[86px] text-center">
            <StreakGlyph size={40} />
            <div className="shotiq-numeric mt-[9px] text-[19.5px] leading-[20px]">6</div>
            <div className="shotiq-microcaps mt-[7px] text-[8.6px] leading-[9px] text-[var(--shotiq-color-graphite)]">DAY STREAK</div>
          </div>
          <span aria-hidden="true" className="mx-[6px] mt-[2px] h-[52px] w-px bg-[var(--shotiq-color-rule)]" />
          <div className="w-[62px] text-center">
            <span className="mx-auto block w-fit"><PointsGlyph size={22} /></span>
            <div className="shotiq-numeric mt-[9px] text-[19.5px] leading-[20px]">2,840</div>
            <div className="shotiq-microcaps mt-[7px] text-[8.6px] leading-[9px] text-[var(--shotiq-color-graphite)]">POINTS</div>
          </div>
        </div>
      </div>

      {/* identity stat row */}
      <div className="mt-[10px] flex items-center">
        <div className="flex min-w-0 flex-1 items-center gap-[6px] whitespace-nowrap text-[10.5px] leading-[12px] tracking-[-0.02em]">
          <span className="font-medium">Jordan Ellis</span>
          <span className="text-[var(--shotiq-color-muted)]">•</span>
          <span className="text-[var(--shotiq-color-graphite)]">Right-handed</span>
          <span className="text-[var(--shotiq-color-muted)]">•</span>
          <span className="text-[var(--shotiq-color-graphite)]">Advanced</span>
        </div>
        <div className="flex shrink-0 divide-x divide-[var(--shotiq-color-rule)] text-center">
          {([["82", "FORM SCORE", ORANGE], ["24", "SHOTS", undefined], ["15", "MAKES", undefined], ["62.5%", "%", undefined]] as
            [string, string, string | undefined][]).map(([v, l, c]) => (
            <div key={l} className="px-[6px]">
              <div className="shotiq-numeric text-[16px] leading-[17px]" style={c ? { color: c } : undefined}>{v}</div>
              <div className="shotiq-microcaps mt-[2px] text-[8px] leading-[9px] text-[var(--shotiq-color-graphite)]">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* primary target */}
      <div className="mt-[10px] flex items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[11px] py-[8px]">
        <div className="min-w-0 flex-1">
          <div className="shotiq-section-label text-[11px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
            PRIMARY TARGET
          </div>
          <div className="mt-[5px] whitespace-nowrap text-[13.2px] font-medium leading-[16px]">Keep elbow stacked through release</div>
        </div>
        <svg width="82" height="32" viewBox="0 0 82 32" aria-hidden="true" className="shrink-0">
          <path d="M3 26 L15 18 L27 24 L40 20 L52 15" fill="none" stroke="#5F646B" strokeWidth="1.6" />
          <path d="M52 15 A22 22 0 0 1 74 12" fill="none" stroke="#111" strokeWidth="1.6" />
          <path d="M56 6.5l-1.5-4M64 3.5l-0.5-4M71 4.5l1-4" stroke="#111" strokeWidth="1.5" strokeLinecap="round" />
          {[[3, 26], [15, 18]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.6" fill="#5F646B" />)}
          {[[27, 24], [40, 20]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.6" fill={ORANGE} />)}
          <circle cx="76" cy="13" r="5" fill="none" stroke={ORANGE} strokeWidth="2" />
        </svg>
      </div>

      {/* video */}
      <div className="relative mt-[9px] h-[213.8px] w-full overflow-hidden rounded-[5px]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/083-hero.png" alt="First frame of the clip you are about to analyze"
             className="h-full w-full object-cover" />
        <span className="absolute bottom-[14px] left-[14px] grid h-[46px] w-[46px] place-items-center rounded-full bg-black/45">
          <svg width="16" height="19" viewBox="0 0 16 19" aria-hidden="true">
            <path d="M2 1.5 L14.5 9.5 L2 17.5Z" fill="#fff" />
          </svg>
        </span>
        <span className="absolute bottom-[16px] right-[12px] flex h-[26px] items-center gap-[14px] rounded-[13px] bg-black/55 px-[13px]">
          <span className="shotiq-numeric text-[12px] text-white">00:00 / {clip.durationLabel.slice(0, 5)}</span>
          <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
            <path d="M1 4.4V1h3.4M8.6 1H12v3.4M12 8.6V12H8.6M4.4 12H1V8.6"
                  fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </div>

      <p className="mt-[9px] text-[10.5px] leading-[12px] text-[var(--shotiq-color-graphite)]">
        Drag the handles to trim your clip
      </p>

      {/* trim rail */}
      <div className="relative mt-[5px] h-[53.9px] w-full overflow-hidden rounded-[7px] bg-[#111111]">
        <span className="absolute inset-y-[6px] left-[24px] right-[24px] flex">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src="/images/canonical/086-film-2.png" alt="" aria-hidden="true"
                 className="h-full min-w-0 flex-1 object-cover" />
          ))}
        </span>
        <Handle side="left" />
        <Handle side="right" />
      </div>
      <div className="mt-[6px] flex items-center justify-between text-[10.5px] leading-[12px]">
        <span>00:00.50</span>
        <span style={{ color: ORANGE }}>{clip.durationLabel}</span>
        <span>00:06.50</span>
      </div>

      {/* details */}
      <PhoneHeading size={19.6} className="mt-[11px]">VIDEO DETAILS</PhoneHeading>
      <div className="mt-[8px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
        {DETAILS.map(([glyph, value, label]) => (
          <div key={label} className="flex min-w-0 flex-1 items-center gap-[7px] px-[7px] first:pl-0 last:pr-0">
            <span className="shrink-0">{glyph}</span>
            <span className="min-w-0">
              <span className="shotiq-numeric block whitespace-nowrap text-[14px] leading-[16px]">{value}</span>
              <span className="shotiq-microcaps mt-[2px] block whitespace-nowrap text-[8.5px] leading-[9px] text-[var(--shotiq-color-graphite)]">{label}</span>
            </span>
          </div>
        ))}
      </div>

      {/* explainer */}
      <div className="mt-[10px] flex items-start gap-[10px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[11px] py-[10px]">
        <div className="min-w-0 flex-1">
          <PhoneHeading size={19}>HOW SHOT DETECTION WORKS</PhoneHeading>
          <p className="mt-[6px] text-[11px] leading-[13.5px] tracking-[-0.02em] text-[var(--shotiq-color-graphite)]">
            ShotIQ identifies your shooting motion using pose tracking
            and ball flight to isolate each rep. You can review and
            adjust the range if needed.
          </p>
        </div>
        <svg width="86" height="46" viewBox="0 0 86 46" aria-hidden="true" className="mt-[10px] shrink-0">
          <path d="M3 40 L16 30 L29 36 L43 31 L56 24" fill="none" stroke="#5F646B" strokeWidth="1.7" />
          <path d="M56 24 A26 26 0 0 1 79 19" fill="none" stroke="#111" strokeWidth="1.7" />
          <path d="M60 12l-2-5M69 8l-1-5M76 9l1-5" stroke="#111" strokeWidth="1.6" strokeLinecap="round" />
          {[[3, 40], [16, 30]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.8" fill="#5F646B" />)}
          {[[29, 36], [43, 31]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="2.8" fill={ORANGE} />)}
          <circle cx="81" cy="20" r="5.4" fill="none" stroke={ORANGE} strokeWidth="2.2" />
        </svg>
      </div>

      {/* actions */}
      <button type="button" onClick={onAnalyze} data-testid="analyze-video"
              className="mt-[9px] flex h-[34.1px] w-full items-center justify-center gap-[18px] rounded-[6px] text-[15px] font-medium text-white"
              style={{ background: ORANGE }}>
        <ActionGlyph kind="analyze" height={20} accent="#fff" />
        Analyze video
      </button>
      <div className="mt-[7px] flex gap-[9px]">
        <button type="button"
                className="flex h-[31.3px] min-w-0 flex-1 items-center justify-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13.5px]">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M4.4 0.8v10.8H15.2M0.8 4.4h10.8v10.8" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Trim
        </button>
        <button type="button" onClick={onChange} data-testid="change-video"
                className="flex h-[31.3px] min-w-0 flex-1 items-center justify-center gap-[9px] rounded-[6px] border border-[var(--shotiq-color-rule)] text-[13.5px]">
          <svg width="15" height="16" viewBox="0 0 15 16" aria-hidden="true">
            <path d="M7.5 11V1M3.6 4.9 7.5 1l3.9 3.9" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M1 10.4v3.2a1.4 1.4 0 0 0 1.4 1.4h10.2a1.4 1.4 0 0 0 1.4-1.4v-3.2" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Change video
        </button>
      </div>
      <Link href="/onboarding"
            className="mt-[7px] flex h-[29px] w-full items-center gap-[11px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[12px] text-[13.5px]">
        <svg width="15" height="16" viewBox="0 0 15 16" aria-hidden="true" className="shrink-0">
          <circle cx="7.5" cy="4.6" r="3.4" fill="none" stroke="#111" strokeWidth="1.4" />
          <path d="M1.2 15c0-3.4 2.8-5.4 6.3-5.4s6.3 2 6.3 5.4" fill="none" stroke="#111" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <span className="flex-1">Edit player profile</span>
        <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true">
          <path d="M1.4 1.4 L7.2 7.5 L1.4 13.6" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>
      <div className="h-[14px]" />
    </PhoneScreen>
  )
}

function Handle({ side }: { side: "left" | "right" }) {
  return (
    <span aria-hidden="true"
          className={`absolute inset-y-0 grid w-[24px] place-items-center rounded-[7px] ${side === "left" ? "left-0" : "right-0"}`}
          style={{ background: "var(--shotiq-color-shotiqOrange)" }}>
      <svg width="8" height="18" viewBox="0 0 8 18">
        <path d="M2.6 1v16M5.4 1v16" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </span>
  )
}
