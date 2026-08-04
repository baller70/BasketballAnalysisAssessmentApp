"use client"

/**
 * Canonical iOS screen 039-no-analysis-yet — the analyze hub with an empty
 * analysis history. A STATE of /analyze, produced by an account whose
 * `/api/analysis-history` returns nothing.
 *
 * Measured off canonical/039-no-analysis-yet.png at 1:1 / 2.170483:
 *
 *   header rule            y  37.8
 *   identity               y  45.6-100.0   x 16.1-360.3
 *   "Analyze a shot"       y 114.3-159.9   x 16.6-375.5   (45.6 tall)
 *   source tiles (1)       y 170.5-249.3   three cells, 6.4 gutters
 *     tile labels          y 227.6-238.7   cap+desc 11.5
 *   ANALYSIS HISTORY       x  17.5  y 266.3-282.0  cap 13.4
 *   "0 ANALYSES"           x 317.9-370.0  cap 8.3
 *   empty diagram          y 287.0-443.2   x 119.8-277.8  (158.5 x 156.2)
 *   NO ANALYSES YET        y 458.4-477.3   cap 19.4, centred on 192.6
 *   body 2 lines           y 488.8 / 502.7, cap+desc 10.6, 13.9 pitch
 *   source tiles (2)       y 522.0-599.9
 *   phase strip figures    y 612.8-643.2 (30.4), labels cap 8.3, rule y 661.6
 *   rule                   y 672.2
 *   PRIMARY COACHING TARGET y 684.2, target line y 694.8-716.9
 *   rule                   y 722.9
 *   LATEST SESSION strip   y 733.0-780.9
 *   tab-bar rule           y 790.6
 */

import React from "react"
import Link from "next/link"
import {
  PhoneScreen, PhoneIdentity, PhoneHeading, PhoneSessionStrip, PhoneCoachingTarget,
} from "@/components/shotiq/PhoneShell"
import { ActionGlyph, PhaseTrack } from "@/components/shotiq/Glyphs"

const SOURCES: [string, "uploadImage" | "uploadVideo" | "liveCamera", number, string][] = [
  ["Upload image", "uploadImage", 38, "/upload"],
  ["Upload video", "uploadVideo", 31, "/video-analysis/upload"],
  ["Live camera", "liveCamera", 26, "/video-analysis"],
]

function SourceTiles() {
  return (
    <div className="flex gap-[6.4px]">
      {SOURCES.map(([label, kind, h, href]) => (
        <Link key={label} href={href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center rounded-[6px] border border-[var(--shotiq-color-rule)] pb-[7px] pt-[6px]">
          <span className="flex h-[42px] items-center"><ActionGlyph kind={kind} height={h} /></span>
          <span className="mt-[5px] text-[11.4px] leading-[13px]">{label}</span>
        </Link>
      ))}
    </div>
  )
}

/** The empty-history diagram: a shooter drawn as a node graph over a dashed
 *  floor line, with the ball's dotted flight arcing away to the right.
 *  Canonical draws it 158.5 x 156.2pt. */
function EmptyDiagram({ width = 158 }: { width?: number }) {
  const ORANGE = "var(--shotiq-color-shotiqOrange)"
  return (
    <svg width={width} height={Math.round((width * 156) / 158)} viewBox="0 0 158 156"
         fill="none" aria-hidden="true" className="block">
      <g stroke="#111111" strokeWidth="2" strokeLinecap="round">
        {/* torso, arms, legs */}
        <path d="M40 62 L44 84 L38 110 L26 132" />
        <path d="M38 110 L52 130" />
        <path d="M44 84 L58 74" />
        <path d="M40 62 L34 46" />
        <path d="M34 46 L58 30" />
        <path d="M58 30 L78 12" />
        <path d="M40 62 L58 58" />
      </g>
      <circle cx="34" cy="46" r="9" fill="#FDFDFD" stroke="#111111" strokeWidth="2" />
      {[[44, 84], [58, 74], [58, 58], [26, 132], [52, 130], [38, 110]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="4.2" fill="#FDFDFD" stroke="#111111" strokeWidth="2" />
      ))}
      {[[20, 62], [58, 30]].map(([cx, cy]) => (
        <circle key={`o-${cx}`} cx={cx} cy={cy} r="8" fill="#FDFDFD" stroke={ORANGE} strokeWidth="2.6" />
      ))}
      {/* flight path */}
      <path d="M84 14 C104 6 128 22 138 62 C144 86 142 104 140 118"
            stroke="#4A4A4A" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="0.5 7" />
      <circle cx="112" cy="9" r="9" fill="#FDFDFD" stroke={ORANGE} strokeWidth="2.6" />
      <path d="M77 5 l3 12 M87 2 l0 11" stroke={ORANGE} strokeWidth="2.2" strokeLinecap="round" />
      {/* floor */}
      <path d="M14 148 H100" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="9 8" />
    </svg>
  )
}

export function NoAnalysisYet({
  name = "Jordan Ellis", sub = "Right-handed • Advanced", streak = "6", points = "2,840",
}: { name?: string; sub?: string; streak?: string; points?: string }) {
  return (
    <PhoneScreen testid="screen-ios-no-analysis-yet" tab="home" pad={16.6}>
      <PhoneIdentity className="pt-[12px]" name={name} sub={sub} streak={streak} points={points} />

      <Link href="/video-analysis" data-testid="empty-analyze-shot"
            className="mt-[6px] flex h-[45.6px] w-full items-center justify-center gap-[22px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-white">
        <ActionGlyph kind="analyze" height={25} accent="#fff" />
        <span className="text-[16px] font-medium">Analyze a shot</span>
      </Link>

      <div className="mt-[10.6px]"><SourceTiles /></div>

      <div className="mt-[13px] flex items-baseline justify-between">
        <PhoneHeading size={19}>ANALYSIS HISTORY</PhoneHeading>
        <span className="shotiq-microcaps text-[11px] leading-[12px] text-[var(--shotiq-color-graphite)]">0 ANALYSES</span>
      </div>

      <div className="mt-[5px] flex justify-center"><EmptyDiagram width={186} /></div>

      <div className="shotiq-display mt-[15px] text-center text-[27.4px] leading-[28px]">NO ANALYSES YET</div>
      <p className="mt-[11px] text-center text-[11px] leading-[13.9px] text-[var(--shotiq-color-graphite)]">
        Upload a shot or record live to get AI-powered<br />breakdowns of your mechanics.
      </p>

      <div className="mt-[8px]"><SourceTiles /></div>

      <PhaseTrack className="mt-[13px]" figure={30} label={11.8} underline />

      <div className="mt-[9px] border-t border-[var(--shotiq-color-rule)] pt-[11px]">
        <PhoneCoachingTarget />
      </div>

      <div className="mt-[6px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
        <div className="shotiq-section-label text-[11px] leading-[12px] tracking-[0.08em] text-[var(--shotiq-color-graphite)]">
          LATEST SESSION
        </div>
        <PhoneSessionStrip className="mt-[6px]" />
      </div>
      <div className="h-[20px]" />
    </PhoneScreen>
  )
}
