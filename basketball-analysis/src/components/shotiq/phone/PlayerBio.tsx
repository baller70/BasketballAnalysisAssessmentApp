"use client"

/**
 * Canonical iOS screen 012-player-bio — the onboarding step where the player
 * writes (or has ShotIQ draft) a short bio. It is a step of /onboarding, not a
 * separate page.
 *
 * Measured off canonical/012-player-bio.png at 1:1 / 2.170483:
 *
 *   header rule            y  46.1   (this screen's header is taller than 039's)
 *   step label + meter     y  59.9- 69.6;  meter x 177.8-376.0, 4.2 tall
 *   PLAYER BIO             y 107.3-151.1   cap 44.2, x 20.7-168.2
 *   body 2 lines           y 169.1 / 188.0, cap+desc 9.2, 18.9 pitch
 *   headshot               x 239.6-392.5   y  84.8-230.8 (bleeds to the edge)
 *   stat strip             y 238.7-306.8, rules at x 99.5 / 196.3 / 285.2
 *   rule                   y 328.5
 *   YOUR BIO / 0 / 160     y 344.2-358.4   cap 14.7 / 10.6
 *   textarea               y 367.7-505.9   x 19.4-372.7  (138.2 tall)
 *     placeholder lines    y 387.5 / 407.7, x 34.1
 *   ENHANCE WITH AI card   y 520.2-593.9
 *   AI-ENHANCED PREVIEW    y 606.3-675.0;  label y 619.2-626.1
 *   Review profile         y 687.4-723.8   (filled confirm green, 36.4 tall)
 *   Back                   y 731.6-767.1   (hairline)
 */

import React from "react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import { StreakGlyph, PointsGlyph, MechanicGlyph } from "@/components/shotiq/Glyphs"

const ORANGE = "var(--shotiq-color-shotiqOrange)"
const MAX = 160

export function PlayerBio({
  step = 4, steps = 5, bio, onBio, onContinue, onBack, onEnhance, enhanced,
}: {
  step?: number
  steps?: number
  bio: string
  onBio: (v: string) => void
  onContinue?: () => void
  onBack?: () => void
  onEnhance?: () => void
  enhanced?: string
}) {
  return (
    <PhoneScreen testid="screen-ios-player-bio" tab="home" pad={19.4} headerH={46}>
      {/* ------------------------------------------------- step + meter */}
      <div className="flex items-center pt-[12px]">
        <span className="shotiq-section-label whitespace-nowrap text-[14px] leading-[15px] tracking-[0.09em] text-[var(--shotiq-color-graphite)]">
          ONBOARDING {step} OF {steps}
        </span>
        <span className="ml-auto flex w-[198px] gap-[6px]">
          {Array.from({ length: steps }).map((_, i) => (
            <span key={i} className="h-[4.2px] flex-1 rounded-full"
                  style={{ background: i < step ? ORANGE : "var(--shotiq-color-rule)" }} />
          ))}
        </span>
      </div>

      {/* ------------------------------------------------ title + photo */}
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/canonical/081-player-headshot.png" alt=""
             aria-hidden="true"
             className="absolute right-[-19.4px] top-[13px] h-[146px] w-[153px] object-cover" />
        <PhoneHeading size={62.7} className="relative pt-[36px]">PLAYER BIO</PhoneHeading>
        <p className="relative mt-[14px] text-[9.5px] leading-[18.9px] text-[var(--shotiq-color-graphite)]">
          <span className="font-medium text-[var(--shotiq-color-ink)]">Add a short bio to personalize</span> your profile.<br />
          You can always update it later in settings.
        </p>
      </div>

      {/* ----------------------------------------------------- stat strip */}
      <div className="mt-[14px] flex items-start divide-x divide-[var(--shotiq-color-rule)]">
        {([["6", "DAY STREAK", "streak"], ["2,840", "POINTS", "points"],
           ["82", "FORM SCORE", "form"], ["62.5%", "MAKE %", "make"]] as const).map(([v, l, kind]) => (
          <div key={l} className="min-w-0 flex-1 text-center">
            <span className="flex h-[24px] items-center justify-center">
              {kind === "streak" && <StreakGlyph size={44} />}
              {kind === "points" && <PointsGlyph size={24} />}
              {kind === "form" && <MechanicGlyph kind="angle" size={26} />}
              {kind === "make" && (
                <svg width="46" height="22" viewBox="0 0 46 22" aria-hidden="true" className="block">
                  <path d="M3 17 L14 12 L25 16 L36 5" fill="none" stroke="#5F646B" strokeWidth="1.5" />
                  <circle cx="3" cy="17" r="2.6" fill="#5F646B" />
                  <circle cx="14" cy="12" r="2.6" fill="var(--shotiq-color-confirmGreen)" />
                  <circle cx="25" cy="16" r="2.6" fill="#5F646B" />
                  <circle cx="36" cy="5" r="2.6" fill="var(--shotiq-color-confirmGreen)" />
                </svg>
              )}
            </span>
            <div className="shotiq-numeric mt-[5px] text-[24px] leading-[25px]">{v}</div>
            <div className="shotiq-microcaps mt-[5px] text-[9.5px] leading-[10px] text-[var(--shotiq-color-graphite)]">{l}</div>
          </div>
        ))}
      </div>

      {/* --------------------------------------------------------- bio */}
      <div className="mt-[16px] flex items-baseline justify-between border-t border-[var(--shotiq-color-rule)] pt-[11px]">
        <PhoneHeading size={20.9}>YOUR BIO</PhoneHeading>
        <span className="shotiq-numeric text-[14.6px] leading-[15px] text-[var(--shotiq-color-graphite)]">
          {bio.length} / {MAX}
        </span>
      </div>
      <textarea
        data-testid="onboarding-bio"
        value={bio}
        maxLength={MAX}
        onChange={(e) => onBio(e.target.value)}
        placeholder="Tell us about your basketball journey, goals, and what motivates you."
        className="mt-[9px] h-[138px] w-full resize-none rounded-[6px] border border-[var(--shotiq-color-rule)] bg-white px-[14px] py-[18px] text-[11.5px] leading-[21px] outline-none placeholder:text-[var(--shotiq-color-graphite)] focus:border-[var(--shotiq-color-ink)]"
      />

      {/* ------------------------------------------------- enhance with AI */}
      <div className="mt-[12px] flex items-center gap-[10px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[9px] py-[8px]">
        <span className="flex w-[52px] shrink-0 justify-center">
          <svg width="44" height="46" viewBox="0 0 44 46" aria-hidden="true" className="block">
            <path d="M9 22 L20 12 L34 8" fill="none" stroke={ORANGE} strokeWidth="2" />
            <path d="M9 22 L21 27" fill="none" stroke={ORANGE} strokeWidth="2" />
            {[[9, 22], [20, 12], [34, 8], [21, 27]].map(([x, y]) => (
              <circle key={x} cx={x} cy={y} r="4" fill="#FDFDFD" stroke={ORANGE} strokeWidth="2" />
            ))}
            <path d="M11 34 v8 M7 38 h8" stroke={ORANGE} strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <PhoneHeading size={19}>ENHANCE WITH AI</PhoneHeading>
          <p className="mt-[5px] text-[10.5px] leading-[13px] tracking-[-0.02em] text-[var(--shotiq-color-graphite)]">
            Let ShotIQ AI craft a stronger bio based on<br />your profile and training data.
          </p>
        </div>
        <button type="button" onClick={onEnhance} data-testid="bio-enhance"
                className="flex h-[34px] shrink-0 items-center gap-[8px] rounded-[5px] border px-[12px] text-[13px] font-medium"
                style={{ borderColor: ORANGE, color: ORANGE }}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <path d="M6 1.6 7.2 5 10.6 6.2 7.2 7.4 6 10.8 4.8 7.4 1.4 6.2 4.8 5Z" fill={ORANGE} />
            <path d="M12 8.6 12.7 10.5 14.6 11.2 12.7 11.9 12 13.8 11.3 11.9 9.4 11.2 11.3 10.5Z" fill={ORANGE} />
          </svg>
          Enhance bio
        </button>
      </div>

      {/* --------------------------------------------- AI-enhanced preview */}
      <div className="mt-[7px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[10px] pb-[5px] pt-[6px]">
        <div className="shotiq-section-label text-[11px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
          AI-ENHANCED PREVIEW
        </div>
        <div className="mt-[6px] flex items-center gap-[13px]">
          <span aria-hidden="true"
                className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-full border border-dashed border-[var(--shotiq-color-graphite)]">
            <svg width="17" height="19" viewBox="0 0 17 19" aria-hidden="true">
              <path d="M1.2 1.2h9.6l5 5v11.6H1.2z" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.2" />
              <path d="M4.4 12.6 7 9.8l2.4 2.2 2.2-2.6" fill="none" stroke="var(--shotiq-color-graphite)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </span>
          <p className="min-w-0 flex-1 text-[11.5px] leading-[15px] text-[var(--shotiq-color-graphite)]">
            {enhanced || <>Your enhanced bio will appear here.<br />Review and customize before saving.</>}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------- actions */}
      <button type="button" onClick={onContinue} data-testid="bio-continue"
              className="mt-[6px] flex h-[36.4px] w-full items-center justify-center rounded-[6px] text-[15px] font-medium text-white"
              style={{ background: "var(--shotiq-color-confirmGreen)" }}>
        Review profile
      </button>
      <button type="button" onClick={onBack} data-testid="bio-back"
              className="mt-[8px] flex h-[35.5px] w-full items-center justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] text-[15px]">
        Back
      </button>
      <div className="h-[20px]" />
    </PhoneScreen>
  )
}
