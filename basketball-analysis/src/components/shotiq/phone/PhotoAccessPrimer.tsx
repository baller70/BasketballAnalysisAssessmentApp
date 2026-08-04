"use client"

/**
 * Canonical iOS screen 015-photo-library-permission — ShotIQ's OWN photo-access
 * primer, drawn to the canonical design.
 *
 * The OS photo-library prompt is chrome no web page can draw or screenshot, and
 * faking Apple's alert would be dishonest. What canonical 015 actually shows is
 * the app's pre-permission screen: what will be read, why, the alternatives and
 * the three ways out. That is what this builds; "Choose access" is the control
 * that hands off to the platform picker.
 *
 * Measured off canonical/015-photo-library-permission.png at 1:1 / 2.170483:
 *
 *   header rule           y  37.3
 *   identity              y  49.8-105.0
 *   rule (left col only)  y 114.3  x 17.0-207.3
 *   stat row              y 124.9-150.2   x 17.0-201.3
 *   PRIMARY TARGET block  y 172.8-206.9
 *   headline 2 lines      y 240.5-268.6 / 278.7-306.8   cap 28.6, 38.2 pitch
 *   body 3 lines          y 318.8 / 334.5 / 349.7       cap+desc 11.1, 15.5 pitch
 *   WHAT WE ACCESS        y 392.5-403.6  cap 11.5
 *   items                 y 417.4 / 479.2 / 540.0, rules at 467.2 and 529.4
 *   photo card (right)    x 228.5-376.4  y 147.4-393.5
 *   full rule             y 590.7
 *   OTHER WAYS...         y 599.9-610.9
 *   camera row            y 623.4-656.1
 *   rule                  y 663.4
 *   CHOOSE HOW...         y 673.6-684.6
 *   Choose access         y 690.2-719.7  (filled orange, 29.9 tall)
 *   Use camera instead    y 725.2-752.4  (hairline, analysis blue ink)
 *   Not now               y 757.4-780.5  (hairline)
 *   settings note         y 785.1-796.6  centred
 */

import React from "react"
import Link from "next/link"
import { PhoneScreen, PhoneIdentity, PhoneHeading } from "@/components/shotiq/PhoneShell"
import { ActionGlyph } from "@/components/shotiq/Glyphs"

const ORANGE = "var(--shotiq-color-shotiqOrange)"
const BLUE = "var(--shotiq-color-analysisBlue)"

const ITEMS: [React.ReactNode, string, string[]][] = [
  [<svg key="1" width="60" height="46" viewBox="0 0 60 46" aria-hidden="true" className="block">
     <circle cx="4" cy="6" r="2.6" fill="none" stroke="#111" strokeWidth="1.6" />
     <circle cx="4" cy="40" r="2.6" fill="none" stroke="#111" strokeWidth="1.6" />
     <path d="M14 30 L26 20 L38 24 L50 12" fill="none" stroke={ORANGE} strokeWidth="1.8" />
     <path d="M14 30 L20 12" fill="none" stroke={ORANGE} strokeWidth="1.8" />
     {[[14, 30], [26, 20], [38, 24], [50, 12], [20, 12]].map(([x, y]) => (
       <circle key={x} cx={x} cy={y} r="3.4" fill="#FDFDFD" stroke={ORANGE} strokeWidth="1.8" />
     ))}
   </svg>,
   "Selected photos only", ["You pick the photos we analyze.", "We never scan your entire library."]],
  [<svg key="2" width="52" height="46" viewBox="0 0 52 46" aria-hidden="true" className="block">
     <path d="M2 14V2h12M38 2h12v12M50 32v12H38M14 44H2V32" fill="none" stroke="#111" strokeWidth="2"
           strokeDasharray="7 4.5" strokeLinecap="round" />
     <rect x="18" y="20" width="16" height="13" rx="1.6" fill="none" stroke={ORANGE} strokeWidth="1.8" />
     <path d="M21.5 20v-3a4.5 4.5 0 0 1 9 0v3" fill="none" stroke={ORANGE} strokeWidth="1.8" />
     <circle cx="26" cy="26.5" r="1.7" fill={ORANGE} />
   </svg>,
   "Private and secure", ["Analysis happens in the cloud.", "Your photos are never shared."]],
  [<svg key="3" width="56" height="46" viewBox="0 0 56 46" aria-hidden="true" className="block">
     <circle cx="24" cy="21" r="19" fill="none" stroke="#111" strokeWidth="2" />
     <path d="M37 34 L52 45" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round" />
     <path d="M11 30 L20 20 L32 13" fill="none" stroke={ORANGE} strokeWidth="1.8" />
     {[[11, 30], [20, 20], [32, 13]].map(([x, y]) => (
       <circle key={x} cx={x} cy={y} r="3.4" fill="#FDFDFD" stroke={ORANGE} strokeWidth="1.8" />
     ))}
   </svg>,
   "Used for analysis", ["Your photos help us deliver", "accurate form insights."]],
]

export function PhotoAccessPrimer({ onChoose, onNotNow }: {
  onChoose?: () => void; onNotNow?: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-photo-library-permission" tab="home" pad={17}>
      <PhoneIdentity className="pt-[12px]" />

      <div className="mt-[9px] flex">
        {/* ------------------------------------------------- left column */}
        <div className="w-[191px] shrink-0">
          <div className="flex items-start divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[9px]">
            {([["82", "FORM SCORE", BLUE], ["24", "SHOTS", undefined],
               ["15", "MAKES", undefined], ["62.5%", "SHOOTING", undefined]] as
               [string, string, string | undefined][]).map(([v, l, c]) => (
              <div key={l} className="min-w-0 flex-1 px-[4px] first:pl-0 last:pr-0">
                <div className="shotiq-numeric text-[17px] leading-[18px]" style={c ? { color: c } : undefined}>{v}</div>
                <div className="shotiq-microcaps mt-[3px] whitespace-nowrap text-[7.6px] leading-[8px] text-[var(--shotiq-color-graphite)]">{l}</div>
              </div>
            ))}
          </div>

          <div className="mt-[13px] flex items-start gap-[8px] border-t border-[var(--shotiq-color-rule)] pt-[8px]">
            <div className="min-w-0 flex-1">
              <div className="shotiq-section-label text-[10.5px] leading-[11px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
                PRIMARY TARGET
              </div>
              <div className="mt-[6px] text-[12px] leading-[14px]">Keep elbow stacked<br />through release.</div>
            </div>
            <svg width="46" height="30" viewBox="0 0 46 30" aria-hidden="true" className="mt-[8px] shrink-0">
              <path d="M4 6 L18 2 L42 6 L38 22 L14 26 Z" fill="none" stroke="#111" strokeWidth="1.4" />
              <path d="M18 2 L42 6" stroke={ORANGE} strokeWidth="1.6" />
              {[[4, 6], [18, 2], [42, 6], [38, 22], [14, 26]].map(([x, y]) => (
                <circle key={x} cx={x} cy={y} r="2.4" fill="#FDFDFD" stroke="#111" strokeWidth="1.4" />
              ))}
            </svg>
          </div>

          <PhoneHeading size={40.5} className="mt-[26px] leading-[38.2px]">
            WE NEED ACCESS<br />TO YOUR PHOTOS
          </PhoneHeading>
          <p className="mt-[10px] text-[10.9px] leading-[15.5px] tracking-[-0.025em] text-[var(--shotiq-color-graphite)]">
            ShotIQ analyzes your mechanics using photos
            from your library. You choose what to share—
            nothing is uploaded without your permission.
          </p>

          <PhoneHeading size={16.3} className="mt-[20px]">WHAT WE ACCESS</PhoneHeading>
          <div className="mt-[7px] divide-y divide-[var(--shotiq-color-rule)]">
            {ITEMS.map(([glyph, title, body]) => (
              <div key={title} className="flex items-start gap-[12px] py-[7px]">
                <span className="flex w-[46px] shrink-0 justify-center pt-[2px]">{glyph}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-medium leading-[15px]">{title}</span>
                  <span className="mt-[4px] block text-[10px] leading-[12.5px] tracking-[-0.02em] text-[var(--shotiq-color-graphite)]">
                    {body.map((l) => <span key={l} className="block">{l}</span>)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ------------------------------------------------ right column */}
        <div className="ml-[20px] w-[148px] shrink-0">
          <div className="mt-[24px] rounded-[6px] border border-[var(--shotiq-color-rule)] p-[6px]">
            <div className="flex gap-[3px]">
              {["086-film-1", "086-film-2", "086-film-3", "086-film-4"].map((f) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={f} src={`/images/canonical/${f}.png`} alt="" aria-hidden="true"
                     className="h-[46px] min-w-0 flex-1 rounded-[1px] object-cover" />
              ))}
            </div>
            <div className="relative mt-[5px] h-[178px] w-full overflow-hidden rounded-[2px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/086-card-photo.png" alt="The shot you are about to analyze"
                   className="h-full w-full object-cover" />
              <span aria-hidden="true" className="absolute inset-[4px]">
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <path d="M0 18 V0 H18 M82 0 H100 V18 M100 82 V100 H82 M18 100 H0 V82"
                        fill="none" stroke={ORANGE} strokeWidth="4" vectorEffect="non-scaling-stroke" />
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------ other ways / CTAs */}
      <PhoneHeading size={16.3} className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[7px]">
        OTHER WAYS TO ADD PHOTOS
      </PhoneHeading>
      <Link href="/video-analysis" className="mt-[5px] flex items-center gap-[13px]">
        <span className="flex w-[56px] shrink-0 justify-center" style={{ color: BLUE }}>
          <ActionGlyph kind="liveCamera" height={26} accent={BLUE} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[13px] font-medium leading-[15px]">Use camera instead</span>
          <span className="mt-[4px] block text-[10.5px] leading-[12.5px] text-[var(--shotiq-color-graphite)]">
            Open the camera to capture<br />a new shot.
          </span>
        </span>
        <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true" className="shrink-0">
          <path d="M1.4 1.4 L7.2 7.5 L1.4 13.6" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.4"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Link>

      <PhoneHeading size={16.3} className="mt-[5px] border-t border-[var(--shotiq-color-rule)] pt-[7px]">
        CHOOSE HOW YOU&apos;D LIKE TO PROCEED
      </PhoneHeading>

      <button type="button" onClick={onChoose} data-testid="photo-choose-access"
              className="mt-[4px] flex h-[29.9px] w-full items-center justify-center gap-[16px] rounded-[4px] text-[14px] font-medium text-white"
              style={{ background: ORANGE }}>
        <ActionGlyph kind="analyze" height={19} accent="#fff" />
        Choose access
      </button>
      <Link href="/video-analysis" data-testid="photo-use-camera"
            className="mt-[3px] flex h-[27.6px] w-full items-center justify-center gap-[13px] rounded-[4px] border text-[14px] font-medium"
            style={{ borderColor: "#BFD3F5", color: BLUE }}>
        <svg width="19" height="17" viewBox="0 0 19 17" aria-hidden="true">
          <rect x="0.9" y="3.4" width="17.2" height="12.7" rx="1.8" fill="none" stroke={BLUE} strokeWidth="1.4" />
          <circle cx="9.5" cy="9.7" r="3.4" fill="none" stroke={BLUE} strokeWidth="1.4" />
          <path d="M6 3.4 7.4 0.9h4.2L13 3.4" fill="none" stroke={BLUE} strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
        Use camera instead
      </Link>
      <button type="button" onClick={onNotNow} data-testid="photo-not-now"
              className="mt-[3px] flex h-[23.5px] w-full items-center justify-center rounded-[4px] border border-[var(--shotiq-color-rule)] text-[14px] text-[var(--shotiq-color-graphite)]">
        Not now
      </button>

      <div className="mt-[3px] flex items-center justify-center gap-[9px] text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">
        <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden="true" className="shrink-0">
          <rect x="1" y="6.4" width="12" height="8.6" rx="1.4" fill="none" stroke="currentColor" strokeWidth="1.3" />
          <path d="M3.6 6.4V4.4a3.4 3.4 0 0 1 6.8 0v2" fill="none" stroke="currentColor" strokeWidth="1.3" />
        </svg>
        You can change this anytime in Settings.
        <Link href="/privacy" style={{ color: BLUE }}>Learn more</Link>
      </div>
      <div className="h-[16px]" />
    </PhoneScreen>
  )
}
