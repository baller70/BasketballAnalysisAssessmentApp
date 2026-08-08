"use client"

/**
 * Canonical iOS 051-photo-comparison — you and the reference, frame beside
 * frame.
 *
 * Round-6 grade A: "the 3-up stat grid wraps its third cell onto a second row
 * and collides with the divider; canonical's side-by-side YOU / ELITE REFERENCE
 * frame pair is absent. Orange 36.8‰ -> 9.0‰." The frame pair is the whole
 * screen — it occupies y 164.9-450.1, a third of the canvas.
 *
 * Bands measured off canonical/051-photo-comparison.png (pt, /2.170483):
 *   back / COMPARE SHOOTERS / share   y  17.0- 34.1   rule y 46
 *   two avatars + scores              y  59.9-117.5
 *   stat sextet                       values y 130.8-142.4, labels y 147.9
 *   frame pair                        y 164.9-450.1   x 15-375  (h 285.2)
 *   phase rail                        figures 457.5-487.4, labels 492.5, rule 504.5
 *   5 comparison rows                 y 524.3-706.3   (pitch 40.1pt)
 *   three secondary actions           y 717.4-750.1
 *   orange CTA                        y 756.5-789.7   (33.2pt)
 */

import React from "react"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import { Bookmark, MoveHorizontal, RefreshCw } from "@/components/shotiq/ApprovedLucide"
import { MechanicGlyph, ActionGlyph, type MechanicKind } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, ShareIcon, Panel, Micro, PhaseRail, PrimaryBar,
  Frame, SkeletonOverlay, ORANGE, BLUE, GRAPHITE, RULE, INK,
} from "./Kit"

const ROWS: [MechanicKind, string, string, string, string, string][] = [
  ["angle", "ELBOW ANGLE", "at release", "162°", "12°", "174°"],
  ["height", "RELEASE HEIGHT", "from floor", "8' 11\"", "+2\"", "9' 1\""],
  ["distance", "RELEASE DISTANCE", "from forehead", "9.3\"", "+0.7\"", "10.0\""],
  ["arc", "SHOT ARC", "peak height", "74°", "+6°", "80°"],
  ["balance", "BALANCE", "centered at release", "92%", "+8%", "100%"],
]

export function PhotoComparison({
  score = 82, elite = 94, shots = "24", makes = "15", pct = "62.5%",
  name, reference = "Elite Reference", onBack,
}: {
  score?: number; elite?: number; shots?: string; makes?: string; pct?: string
  name?: string; reference?: string; onBack?: () => void
}) {
  const chrome = usePlayerChrome()

  return (
    <ResultsScreen
      testid="screen-ios-photo-comparison"
      tab="home"
      bar={<ResultsBar variant="back-title" height={46} onBack={onBack} title="COMPARE SHOOTERS" trailing={<ShareIcon />} />}
    >
      {/* the two shooters -------------------------------------------------- */}
      <div className="mt-[9px] flex items-center gap-[9px] px-[19px]">
        <Frame src="081-player-headshot" w={50} h={50} radius={999} alt={name} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">{(name ?? chrome.name).toUpperCase()}</div>
          <div className="text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>You • Right • Advanced</div>
          <Micro className="mt-[3px]" size={8}>FORM SCORE</Micro>
          <div className="mt-[1px] flex items-center gap-[7px]">
            <span className="shotiq-numeric text-[24px] leading-[22px]" style={{ color: ORANGE }}>{score}</span>
            <span className="block h-[6px] min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
              <span className="block h-full rounded-full" style={{ width: `${score}%`, background: ORANGE }} />
            </span>
          </div>
        </div>
        <span className="grid h-[31px] w-[31px] shrink-0 place-items-center rounded-full border text-[11px]"
              style={{ borderColor: RULE, color: GRAPHITE }}>VS</span>
        <div className="min-w-0 flex-1">
          <div className="shotiq-display text-[24px] leading-[24px] tracking-[0.03em]">{reference.toUpperCase()}</div>
          <div className="text-[11.5px] leading-[13px]" style={{ color: GRAPHITE }}>Pro • Right • Elite</div>
          <Micro className="mt-[3px]" size={8}>FORM SCORE</Micro>
          <div className="mt-[1px] flex items-center gap-[7px]">
            <span className="shotiq-numeric text-[24px] leading-[22px]" style={{ color: BLUE }}>{elite}</span>
            <span className="block h-[6px] min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: "#E2E3E4" }}>
              <span className="block h-full rounded-full" style={{ width: `${elite}%`, background: BLUE }} />
            </span>
          </div>
        </div>
        <Frame src="089-headshot" w={50} h={50} radius={999} alt={reference} className="shrink-0" />
      </div>

      {/* stat sextet ---------------------------------------------------------- */}
      <div className="mt-[7px] flex px-[19px]">
        {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "ACCURACY"]] as [string, string][]).map(([v, l], i) => (
          <div key={l} className={`flex-1 text-center ${i ? "border-l" : ""}`} style={{ borderColor: RULE }}>
            <div className="shotiq-numeric text-[21px] leading-[21px]">{v}</div>
            <Micro className="mt-[4px]">{l}</Micro>
          </div>
        ))}
        {["SHOTS", "MAKES", "ACCURACY"].map((l, i) => (
          <div key={`e-${l}`} className={`flex-1 text-center ${i ? "border-l" : "border-l"}`} style={{ borderColor: RULE }}>
            <div className="shotiq-numeric text-[21px] leading-[21px]" style={{ color: GRAPHITE }}>—</div>
            <Micro className="mt-[4px]">{l}</Micro>
          </div>
        ))}
      </div>

      {/* the frame pair --------------------------------------------------------- */}
      <div className="mx-[15px] mt-[8px] flex gap-[3px] overflow-hidden rounded-[5px]">
        {([["YOU", "086-film-4", ORANGE, "162°"], [reference.toUpperCase(), "086-film-5", BLUE, "174°"]] as [string, string, string, string][]).map(([label, still, tone, angle]) => (
          <div key={label} className="relative min-w-0 flex-1" style={{ height: 262 }}>
            <Frame src={still} w="100%" h="100%" radius={0} pos="50% 22%" alt={`${label} at release`} />
            <SkeletonOverlay node={tone} />
            <span className="absolute left-[9px] top-[9px] flex items-center gap-[6px] text-[13px] font-semibold text-white"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,.65)" }}>
              <span className="block h-[9px] w-[9px] rounded-full" style={{ background: tone }} />{label}
            </span>
            <span className="shotiq-numeric absolute right-[22px] top-[30%] text-[15px] text-white"
                  style={{ textShadow: "0 1px 3px rgba(0,0,0,.65)" }}>{angle}</span>
          </div>
        ))}
      </div>

      <PhaseRail className="mt-[6px] px-[26px]" active="RELEASE" figure={30} label={9.6} />

      {/* comparison rows ---------------------------------------------------------- */}
      <div className="mt-[6px] px-[26px]">
        {ROWS.map(([kind, label, sub, you, diff, ref_]) => (
          <div key={label} className="flex items-center border-t py-[3px]" style={{ borderColor: RULE }}>
            <span className="shrink-0" style={{ color: INK }}><MechanicGlyph kind={kind} size={26} accent={ORANGE} /></span>
            <span className="ml-[8px] w-[92px] shrink-0">
              <span className="shotiq-display block leading-[12px] tracking-[0.04em]" style={{ fontSize: 12 }}>{label}</span>
              <span className="block text-[10px] leading-[12px]" style={{ color: GRAPHITE }}>{sub ?? chrome.sub}</span>
            </span>
            <span className="shotiq-numeric min-w-0 flex-1 text-center text-[22px] leading-[22px]" style={{ color: ORANGE }}>{you}</span>
            <span className="w-[68px] shrink-0 text-center">
              <span className="shotiq-numeric block text-[15px] leading-[15px]" style={{ color: BLUE }}>{diff}</span>
              <Micro size={7.6}>DIFFERENCE</Micro>
            </span>
            <span className="shotiq-numeric min-w-0 flex-1 text-center text-[22px] leading-[22px]" style={{ color: BLUE }}>{ref_}</span>
          </div>
        ))}
      </div>

      {/* actions ---------------------------------------------------------------------- */}
      <div className="mt-[6px] flex gap-[9px] px-[23px]">
        <Panel className="flex h-[29px] flex-1 items-center justify-center gap-[7px]">
          <ActionGlyph kind="skeletonDots" height={15} />
          <span className="text-[13px] leading-[15px]">Overlay skeletons</span>
        </Panel>
        <Panel className="flex h-[29px] flex-1 items-center justify-center gap-[7px]">
          <MoveHorizontal className="h-[15px] w-[15px]" strokeWidth={1.7} />
          <span className="text-[13px] leading-[15px]">Swipe phases</span>
        </Panel>
        <Panel className="flex h-[29px] flex-1 items-center justify-center gap-[7px]">
          <Bookmark className="h-[14px] w-[14px]" strokeWidth={1.7} />
          <span className="text-[13px] leading-[15px]">Save comparison</span>
        </Panel>
      </div>

      <div className="mt-[7px] px-[23px]">
        <PrimaryBar className="!h-[33px]" glyph={<RefreshCw className="h-[16px] w-[16px]" strokeWidth={2} />}>
          Sync release frames
        </PrimaryBar>
      </div>
    </ResultsScreen>
  )
}
