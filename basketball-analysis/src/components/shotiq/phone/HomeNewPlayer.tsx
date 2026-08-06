"use client"

/**
 * Canonical iOS screen 017-home-new-player — the home a player sees before the
 * first analysis exists. It is a STATE of /dashboard, not a separate page: the
 * dashboard renders it whenever the account has no analyses (or the home layout
 * is set to the simplified "basic" view), and the standard/professional
 * dashboards otherwise.
 *
 * Measured off canonical/017-home-new-player.png at 1:1, divided by
 * 853/393 = 2.170483:
 *
 *   header rule           y  39.2
 *   identity              y  46.1- 98.6   x 22.1-351.5
 *   primary CTA           y 111.0-157.6   x 22.1-369.5  (46.6 tall)
 *   CTA subtitle          y 164.5-174.2   centred on 196.0, cap+desc 10.1
 *   START HERE card       y 182.0-379.2   x 22.1-370.0
 *     "START HERE"        x  34.1  cap 12.0
 *     step marks          x  41.0- 83.9   32.7 tall
 *     step titles         x 110.6  cap 16.1
 *     step bodies         cap+desc 10.6,  row pitch 58.1
 *   CAPTURE YOUR SHOT     y 386.5-542.7
 *     thumbnails          y 415.1-506.8, x 31.3-136.8 / 143.3-246.0 / 252.9-358.9
 *     tile titles         y 512.8-522.0  cap 9.7
 *     tile subs           y 527.1-535.8  cap+desc 9.2
 *   SETUP CHECKLIST card  y 551.0-717.4
 *     header              y 560.7-572.2  cap 12.0; "0 OF 4 COMPLETE" cap 6.5
 *     inner box           y 579.1-711.4  x 30.9-361.2
 *     rows                y 585.1 / 618.8 / 651.0 / 684.2  (33.0 pitch)
 *   YOUR PRIMARY TARGET   y 722.9-783.7, clipped by the tab bar rule at 788.3
 */

import React from "react"
import Link from "next/link"
import {
  PhoneScreen, PhoneIdentity, PhoneHeading,
} from "@/components/shotiq/PhoneShell"
import { ActionGlyph, PoseFigure } from "@/components/shotiq/Glyphs"

const CHEV = (
  <svg width="9" height="15" viewBox="0 0 9 15" aria-hidden="true" className="shrink-0">
    <path d="M1.4 1.4 L7.2 7.5 L1.4 13.6" fill="none" stroke="var(--shotiq-color-graphite)"
          strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)

const STEPS: [string, string, "uploadImage" | "uploadVideo" | "liveCamera", string][] = [
  ["1. CAPTURE YOUR SHOT", "Record from the side to analyze your form.", "uploadImage", "/video-analysis"],
  ["2. GET AI ANALYSIS", "Our AI breaks down your mechanics.", "uploadVideo", "/analyze"],
  ["3. IMPROVE & TRACK", "Apply feedback and watch your progress.", "liveCamera", "/results/demo/history"],
]

const TILES: [string, string, string, string, "white" | "gate" | "green"][] = [
  ["UPLOAD IMAGE", "From your library", "/images/canonical/086-film-1.png", "/upload", "white"],
  ["UPLOAD VIDEO", "From your library", "/images/canonical/086-film-3.png", "/video-analysis/upload", "gate"],
  ["LIVE CAMERA", "Record in real time", "/images/canonical/086-film-5.png", "/video-analysis", "green"],
]

const CHECKS: [string, string, React.ReactNode][] = [
  ["CAMERA POSITION", "Place camera at hip height, 15–20 ft away",
    <svg key="a" width="18" height="20" viewBox="0 0 18 20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="3.4" y="1.2" width="11.2" height="5.4" rx="0.8" /><path d="M9 6.6V12M9 12 3.2 18.8M9 12l5.8 6.8" />
    </svg>],
  ["ENVIRONMENT", "Good lighting, clear background",
    <svg key="b" width="19" height="19" viewBox="0 0 19 19" fill="none" stroke="currentColor" strokeWidth="1.3">
      <circle cx="9.5" cy="9.5" r="3.1" />
      <path d="M9.5 1.2v2.6M9.5 15.2v2.6M1.2 9.5h2.6M15.2 9.5h2.6M3.6 3.6l1.9 1.9M13.5 13.5l1.9 1.9M15.4 3.6l-1.9 1.9M5.5 13.5l-1.9 1.9" />
    </svg>],
  ["SHOOTING ROUTINE", "Use your normal pre-shot routine",
    <PoseFigure key="c" phase="rise" height={20} />],
  ["WHAT TO CAPTURE", "Side view from catch to follow-through",
    <svg key="d" width="22" height="19" viewBox="0 0 22 19" fill="none" strokeLinecap="round">
      <path d="M1.2 9.8C4 3.6 8 2.2 12.4 4.6" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.6" cy="12.4" r="5" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="1.3" />
      <path d="M13.4 12.4l1.7 1.8 3.1-3.6" stroke="var(--shotiq-color-shotiqOrange)" strokeWidth="1.3" />
    </svg>],
]

const PHASES: [string, string][] = [
  ["setup", "SETUP"], ["load", "LOAD"], ["rise", "RISE"], ["release", "RELEASE"], ["follow", "FOLLOW-THROUGH"],
]

export function HomeNewPlayer({
  name, sub, streak, points,
}: { name?: string; sub?: string; streak?: string; points?: string }) {
  return (
    <PhoneScreen testid="screen-ios-home-new-player" tab="home" pad={22}>
      <PhoneIdentity className="pt-[9px]" name={name} sub={sub} streak={streak} points={points} />

      <Link href="/analyze" data-testid="new-player-analyze"
            className="mt-[7px] flex h-[46.6px] w-full items-center justify-center gap-[24px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-white">
        <ActionGlyph kind="analyze" height={25} accent="#fff" />
        <span className="text-[16px] font-medium">Analyze your first shot</span>
      </Link>
      <p className="mt-[4px] text-center text-[11px] leading-[13px] text-[var(--shotiq-color-graphite)]">
        See how your mechanics perform in minutes.
      </p>

      {/* --------------------------------------------------- START HERE */}
      <div className="mt-[5px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12px] pb-[7px] pt-[8px]">
        <PhoneHeading size={17}>START HERE</PhoneHeading>
        <div className="mt-[5px] divide-y divide-[var(--shotiq-color-rule)]">
          {STEPS.map(([title, body, mark, href], i) => (
            <Link key={title} href={href} className="flex items-center gap-[14px] py-[7px]"
                  style={i === 0 ? { paddingTop: 2 } : undefined}>
              <span className="flex w-[43px] shrink-0 justify-center text-[var(--shotiq-color-ink)]">
                <ActionGlyph kind={mark} height={mark === "uploadVideo" ? 26 : 33} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="shotiq-display block text-[22.9px] leading-[23px]">{title}</span>
                <span className="mt-[4px] block text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">{body}</span>
              </span>
              {CHEV}
            </Link>
          ))}
        </div>
      </div>

      {/* -------------------------------------------- CAPTURE YOUR SHOT */}
      <div className="mt-[5px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[9px] pb-[6px] pt-[7px]">
        <PhoneHeading size={17} className="pl-[3px]">CAPTURE YOUR SHOT</PhoneHeading>
        <div className="mt-[6px] flex gap-[6.5px]">
          {TILES.map(([title, body, img, href, frame]) => (
            <Link key={title} href={href} className="min-w-0 flex-1">
              <span className="relative block h-[92px] w-full overflow-hidden rounded-[3px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img} alt="" aria-hidden="true" className="h-full w-full object-cover" />
                {frame === "white" && (
                  <span aria-hidden="true" className="absolute inset-[7px]">
                    <Bracket color="#FFFFFF" />
                  </span>
                )}
                {frame === "green" && (
                  <span aria-hidden="true" className="absolute inset-[7px]">
                    <Bracket color="#1F8A4C" />
                  </span>
                )}
                {frame === "gate" && (
                  <span aria-hidden="true" className="absolute inset-0">
                    <span className="absolute inset-y-0 left-0 w-[13px] bg-[#111111]" />
                    <span className="absolute inset-y-0 right-0 w-[13px] bg-[#111111]" />
                    <span className="absolute inset-x-0 top-0 h-[7px] bg-[#111111]" />
                    <span className="absolute inset-x-0 bottom-0 h-[7px] bg-[#111111]" />
                    <span className="absolute inset-y-0 left-1/2 w-[1.5px] -translate-x-1/2 bg-[var(--shotiq-color-shotiqOrange)]" />
                    <span className="absolute left-1/2 top-1/2 h-[13px] w-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[1.6px] border-[var(--shotiq-color-shotiqOrange)]" />
                  </span>
                )}
              </span>
              <span className="shotiq-display mt-[5px] block text-center text-[13.7px] leading-[14px]">{title}</span>
              <span className="mt-[4px] block text-center text-[9.5px] leading-[10px] text-[var(--shotiq-color-graphite)]">{body}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* -------------------------------------------- SETUP CHECKLIST */}
      <div className="mt-[5px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[11px] pb-[7px] pt-[7px]">
        <div className="flex items-baseline justify-between">
          <PhoneHeading size={17}>SETUP CHECKLIST</PhoneHeading>
          <span className="shotiq-microcaps text-[8.6px] leading-[9px] text-[var(--shotiq-color-graphite)]">0 OF 4 COMPLETE</span>
        </div>
        <div className="mt-[4px] divide-y divide-[var(--shotiq-color-rule)] rounded-[6px] border border-[var(--shotiq-color-rule)]">
          {CHECKS.map(([title, body, glyph]) => (
            <div key={title} className="flex items-center gap-[11px] px-[9px] py-[3px]">
              <span aria-hidden="true" className="h-[16px] w-[16px] shrink-0 rounded-full border border-[var(--shotiq-color-graphite)]" />
              <span className="flex w-[24px] shrink-0 justify-center">{glyph}</span>
              <span className="min-w-0 flex-1">
                <span className="shotiq-display block text-[13.5px] leading-[14px]">{title}</span>
                <span className="mt-[2px] block text-[9.6px] leading-[11px] text-[var(--shotiq-color-graphite)]">{body}</span>
              </span>
              {CHEV}
            </div>
          ))}
        </div>
      </div>

      {/* ------------------------------------------- YOUR PRIMARY TARGET */}
      <div className="mt-[4px] rounded-[8px] border border-[var(--shotiq-color-rule)] px-[12px] pb-[10px] pt-[9px]">
        <div className="flex items-baseline justify-between">
          <PhoneHeading size={16}>YOUR PRIMARY TARGET</PhoneHeading>
          <Link href="/guide" className="flex items-center gap-[6px] text-[11.5px] text-[var(--shotiq-color-analysisBlue)]">
            See capture guide {CHEV}
          </Link>
        </div>
        <p className="mt-[6px] text-[9px] leading-[10px] text-[var(--shotiq-color-graphite)]">
          Keep elbow stacked through release.
        </p>
        <div className="relative mt-[10px] px-[26px]">
          <span aria-hidden="true" className="absolute inset-x-[32px] top-[5px] h-px bg-[var(--shotiq-color-graphite)]" />
          <div className="relative flex justify-between">
            {PHASES.map(([k, l]) => (
              <span key={k} className="flex flex-col items-center">
                <span className={`h-[11px] w-[11px] rounded-full ${
                  k === "release" ? "bg-[var(--shotiq-color-shotiqOrange)]" : "bg-[var(--shotiq-color-graphite)]"}`} />
                <span className="shotiq-display mt-[5px] whitespace-nowrap text-[7.2px] leading-[8px] tracking-[0.05em]"
                      style={{ color: k === "release" ? "var(--shotiq-color-shotiqOrange)" : "var(--shotiq-color-graphite)" }}>
                  {l}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="h-[24px]" />
    </PhoneScreen>
  )
}

function Bracket({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
      <path d="M0 22 V0 H22 M78 0 H100 V22 M100 78 V100 H78 M22 100 H0 V78"
            fill="none" stroke={color} strokeWidth="3" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
