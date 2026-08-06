"use client"

/**
 * Canonical iOS upload family — 022 photo upload source, 023 photo review /
 * crop, 024 upload quality check. All three were one route (`/upload`) drawing
 * one composition; canonical draws three.
 *
 * Measured off the 853x1844 canonical PNGs at 2.170483 px per pt.
 *
 * 022 — back link y 47; title cap 30 (y 88-118); 5 format tiles on a 74pt
 *       pitch, glyph 24 over a 9pt label and a 7pt sub-label; two 148pt-tall
 *       angle photos side by side with a 9pt badge inset 8/8; source rows 44pt
 *       with a 26pt mark; Cancel 38pt outline. Canonical's orange coverage on
 *       this screen is 2.0 per mille — white cards, orange marks only.
 * 023 — stacked centre lockup (SHOTIQ over AI ANALYSIS, cap 15 / 7); title cap
 *       26; crop frame x 8-385 y 120-500 with corner brackets at 1/6 of the
 *       frame, thirds guides and a 3:4 badge; rotation dial y 520-560 with
 *       ticks every 5 deg; three actions 40pt; phase rail; tab bar.
 * 024 — identity, 5-cell stat strip, title with the upload mark, 168pt video
 *       still, four check rows on a 41pt pitch, framing tip, green primary.
 */

import React from "react"
import { useLatestSession } from "@/components/shotiq/phone/useLatestSession"
import { usePlayerChrome } from "@/components/shotiq/phone/usePlayerChrome"
import { Check, AlertCircle, ChevronRight, RotateCcw, RotateCw, Crop, Camera } from "lucide-react"
import { PhoneScreen, PhoneHeading } from "@/components/shotiq/PhoneShell"
import {
  PhoneTop, Wordmark, GearLink, BackChevron, PhoneAction, Eyebrow, StatCells,
  MiniStat, PhaseRail, PhoneCard, Shot, RULE, ORANGE, GREEN, BLUE, GRAPHITE,
} from "@/components/shotiq/phone/PhoneBits"
import { StreakGlyph, PointsGlyph, ActionGlyph, QualityGlyph, FilmingGlyph } from "@/components/shotiq/Glyphs"

/* --------------------------------------------------------------- 022 */

const FORMATS: [string, string, "film" | "play" | "frame"][] = [
  ["MP4", "VIDEO", "film"], ["MOV", "VIDEO", "play"], ["JPG", "PHOTO", "frame"],
  ["PNG", "PHOTO", "frame"], ["HEIC", "PHOTO", "frame"],
]

function FormatMark({ kind }: { kind: "film" | "play" | "frame" }) {
  return (
    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" aria-hidden="true"
         stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      {kind === "film" && (
        <>
          <rect x="1" y="3.5" width="28" height="17" rx="1" />
          <path d="M7.5 3.5 V20.5 M22.5 3.5 V20.5" />
          <path d="M4.2 8 V10 M4.2 14 V16 M25.8 8 V10 M25.8 14 V16" />
        </>
      )}
      {kind === "play" && (
        <>
          <circle cx="15" cy="12" r="9" />
          <path d="M12.6 7.8 L19.8 12 L12.6 16.2 Z" />
        </>
      )}
      {kind === "frame" && (
        <>
          <path d="M2 8 V2 H8 M22 2 H28 V8 M28 16 V22 H22 M8 22 H2 V16" />
          <path d="M8.5 15.5 L13 11 L16.5 14.5 L21.5 9" />
        </>
      )}
    </svg>
  )
}

const ANGLES: [string, string, string, string, string][] = [
  ["SIDE VIEW", "094-t1", "IDEAL", "Use this angle when possible.", BLUE],
  ["45° VIEW", "094-t2", "GOOD", "Use if side view isn't available.", GRAPHITE],
]

export function PhotoUploadSource({ onLibrary, onCamera, onCancel }: {
  onLibrary: () => void; onCamera: () => void; onCancel: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-photo-upload-source" tab="capture" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />
      <div className="px-[18px]">
        <div className="flex items-center gap-[7px] pt-[12px]">
          <BackChevron href="/analyze" />
          <Eyebrow>ANALYZE SHOT</Eyebrow>
        </div>
        <PhoneHeading size={42} className="mt-[10px]">PHOTO UPLOAD SOURCE</PhoneHeading>
        <p className="mt-[9px] w-[300px] text-[11.5px] leading[15px]" style={{ color: GRAPHITE, lineHeight: "15px" }}>
          Upload a side or 45-degree angle video or photo for the most accurate analysis.
        </p>

        <Eyebrow className="mt-[16px]">SUPPORTED FORMATS</Eyebrow>
        <div className="mt-[9px] flex gap-[7px]">
          {FORMATS.map(([ext, kind, mark]) => (
            <div key={ext + kind} className="flex min-w-0 flex-1 flex-col items-center rounded-[6px] py-[10px]"
                 style={{ border: `1px solid ${RULE}` }}>
              <FormatMark kind={mark} />
              <div className="shotiq-display mt-[7px] text-[11px] leading-[12px]">{ext}</div>
              <div className="shotiq-microcaps mt-[3px]" style={{ fontSize: 7, lineHeight: "8px", color: GRAPHITE }}>{kind}</div>
            </div>
          ))}
        </div>

        <Eyebrow className="mt-[16px]">BEST ANGLE FOR ANALYSIS</Eyebrow>
        <div className="mt-[9px] flex gap-[9px]">
          {ANGLES.map(([badge, img, verdict, note, tone]) => (
            <div key={badge} className="min-w-0 flex-1 overflow-hidden rounded-[6px]"
                 style={{ border: `1px solid ${RULE}` }}>
              <div className="relative">
                <Shot src={`/images/canonical/${img}.png`} className="h-[150px] w-full" zoom={1.4} />
                <span className="absolute left-[8px] top-[8px] rounded-[3px] px-[6px] py-[3px] text-[8px] font-semibold text-white"
                      style={{ background: tone }}>{badge}</span>
              </div>
              <div className="flex items-start gap-[7px] px-[9px] py-[9px]">
                <span className="mt-[1px] grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full"
                      style={{ border: `1.4px solid ${tone}` }}>
                  <Check className="h-[9px] w-[9px]" style={{ color: tone }} strokeWidth={3} />
                </span>
                <div className="min-w-0">
                  <div className="shotiq-microcaps" style={{ fontSize: 9, lineHeight: "10px", color: tone }}>{verdict}</div>
                  <div className="mt-[3px] text-[8.5px] leading[11px]" style={{ color: GRAPHITE, lineHeight: "11px" }}>{note}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-[15px] pt-[13px]" style={{ borderTop: `1px solid ${RULE}` }}>
          <Eyebrow>CHOOSE UPLOAD SOURCE</Eyebrow>
          {([
            ["Choose from library", "Select a video or photo from your device.", "analyze", onLibrary, "upload-source-library"],
            ["Take photo", "Capture a new photo using your camera.", "camera", onCamera, "upload-source-camera"],
          ] as const).map(([title, note, mark, act, tid]) => (
            <button key={title} type="button" onClick={act} data-testid={tid}
                    className="mt-[9px] flex w-full items-center gap-[13px] rounded-[6px] px-[11px] py-[11px] text-left"
                    style={{ border: `1px solid ${RULE}` }}>
              <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[5px]"
                    style={{ border: `1px solid ${RULE}` }}>
                {mark === "analyze"
                  ? <ActionGlyph kind="analyze" height={19} accent={ORANGE} />
                  : <Camera className="h-[17px] w-[17px]" style={{ color: ORANGE }} strokeWidth={1.6} />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[13px] font-medium leading-[15px]">{title}</span>
                <span className="mt-[3px] block text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>{note}</span>
              </span>
              <ChevronRight className="h-[14px] w-[14px] shrink-0" style={{ color: GRAPHITE }} />
            </button>
          ))}
        </div>

        <PhoneAction tone="outline" height={38} className="mb-[16px] mt-[13px] text-[13px]" onClick={onCancel}>
          Cancel
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 023 */

export function PhotoReviewCrop({ src, onRetake, onCrop, onUse, onBack }: {
  src: string; onRetake: () => void; onCrop: () => void; onUse: () => void; onBack: () => void
}) {
  const chrome = usePlayerChrome()

  const [angle, setAngle] = React.useState(0)
  return (
    <PhoneScreen testid="screen-ios-photo-review-crop" tab="capture" pad={0} header={false}>
      <PhoneTop height={44} left={<BackChevron onClick={onBack} />} center={
 <span className="block text-center">
 <span className="shotiq-wordmark block tracking-[0.14em]">
 SHOT<span style={{ fontSize: 15.5, lineHeight: "16px", color: ORANGE }}>IQ</span>
 </span>
 <span className="shotiq-microcaps block" style={{ color: GRAPHITE }}>AI ANALYSIS</span>
 </span>} />

      <div className="flex items-start px-[18px] pt-[11px]">
        <div className="min-w-0">
          {/* canonical 023 cap 50 = 23.0 CSS px, /0.705 = 32.7px.
              37px measured cap 57, 114% of canonical. */}
          <PhoneHeading size={32.7}>PHOTO REVIEW</PhoneHeading>
          <p className="mt-[6px] text-[9.5px] leading-[12px]" style={{ color: GRAPHITE }}>
            Adjust crop to include your full body from head to toe.
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-start">
          <MiniStat glyph={<StreakGlyph size={36} />} value={chrome.streak} label="DAY STREAK" w={58} />
          <MiniStat glyph={<PointsGlyph size={20} />} value={chrome.points} label="POINTS" w={54} />
        </div>
      </div>

      {/* --------------------------------------------------- crop frame */}
      <div className="relative mx-[8px] mt-[10px] overflow-hidden" style={{ height: 352 }}>
        <Shot src={src} alt="Photo under review" className="h-full w-full" zoom={1.4}
              style={{ transform: `rotate(${angle}deg)` }} />
        <span className="absolute left-[9px] top-[9px] rounded-[3px] bg-black/65 px-[7px] py-[3px] text-[9px] font-medium text-white">3:4</span>
        {/* rule-of-thirds guides */}
        {[1, 2].map((i) => (
          <React.Fragment key={i}>
            <span aria-hidden="true" className="absolute bg-white/55" style={{ left: `${(i * 100) / 3}%`, top: 34, bottom: 34, width: 1 }} />
            <span aria-hidden="true" className="absolute bg-white/55" style={{ top: `${(i * 100) / 3}%`, left: 30, right: 30, height: 1 }} />
          </React.Fragment>
        ))}
        {/* Corner brackets. Canonical insets the crop frame 30 from the sides
            and 34 from the top and bottom, and draws an L at each corner. */}
        <span aria-hidden="true" className="absolute left-[30px] top-[34px] h-[30px] w-[30px]"
              style={{ borderLeft: "2px solid #fff", borderTop: "2px solid #fff" }} />
        <span aria-hidden="true" className="absolute right-[30px] top-[34px] h-[30px] w-[30px]"
              style={{ borderRight: "2px solid #fff", borderTop: "2px solid #fff" }} />
        <span aria-hidden="true" className="absolute bottom-[34px] left-[30px] h-[30px] w-[30px]"
              style={{ borderLeft: "2px solid #fff", borderBottom: "2px solid #fff" }} />
        <span aria-hidden="true" className="absolute bottom-[34px] right-[30px] h-[30px] w-[30px]"
              style={{ borderRight: "2px solid #fff", borderBottom: "2px solid #fff" }} />
        <div className="absolute inset-x-[9px] bottom-[9px] flex items-center gap-[8px] rounded-[4px] bg-black/60 px-[9px] py-[7px]">
          <AlertCircle className="h-[11px] w-[11px] shrink-0 text-white" strokeWidth={1.8} />
          <span className="text-[8.5px] leading-[11px] text-white">
            Tip: Include your full body. Leave a little space above your head and below your feet.
          </span>
        </div>
      </div>

      {/* ------------------------------------------------- rotation dial */}
      <div className="mt-[11px] flex items-center gap-[12px] px-[18px]">
        <button type="button" aria-label="Rotate left" onClick={() => setAngle((a) => a - 5)}>
          <RotateCcw className="h-[17px] w-[17px]" strokeWidth={1.6} />
        </button>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-end justify-between">
            {Array.from({ length: 21 }).map((_, i) => (
              <span key={i} className="w-px" style={{ height: i % 5 === 0 ? 13 : 7, background: i === 10 ? ORANGE : RULE }} />
            ))}
          </div>
          <div className="mt-[4px] flex justify-between text-[8px]" style={{ color: GRAPHITE }}>
            {["-10°", "-5°", "0°", "5°", "10°"].map((t) => (
              <span key={t} style={t === "0°" ? { color: ORANGE } : undefined}>{t}</span>
            ))}
          </div>
        </div>
        <button type="button" aria-label="Rotate right" onClick={() => setAngle((a) => a + 5)}>
          <RotateCw className="h-[17px] w-[17px]" strokeWidth={1.6} />
        </button>
      </div>

      <div className="mt-[12px] flex gap-[9px] px-[18px]">
        <PhoneAction tone="outline" height={40} className="flex-1 text-[12px]" onClick={onRetake} testid="upload-retake">
          <Camera className="h-[14px] w-[14px]" strokeWidth={1.6} /> RETAKE
        </PhoneAction>
        <PhoneAction tone="outline" height={40} className="flex-1 text-[12px]" onClick={onCrop}>
          <Crop className="h-[14px] w-[14px]" strokeWidth={1.6} /> CROP
        </PhoneAction>
        <PhoneAction tone="green" height={40} className="flex-1 text-[12px]" onClick={onUse} testid="upload-use-photo">
          <Check className="h-[14px] w-[14px]" strokeWidth={2.4} /> USE PHOTO
        </PhoneAction>
      </div>

      <PhaseRail className="mb-[14px] mt-[14px] px-[14px]" figure={26} label={7} />
    </PhoneScreen>
  )
}

/* --------------------------------------------------------------- 024 */

const CHECKS: [string, string, string, boolean][] = [
  ["Lighting", "Well-lit and clear.", "Good", true],
  ["Full body visibility", "Entire body is visible.", "Good", true],
  ["Video resolution", "High resolution.", "1080p", true],
  ["Shooting hand visibility",
   "Shooting hand is slightly cropped at the fingertips. Please reframe to show the full hand and ball.",
   "Needs attention", false],
]

export function UploadQualityCheck({ src, fileName = "IMG_4521.MOV", onContinue, onChoose }: {
  src: string; fileName?: string; onContinue: () => void; onChoose: () => void
}) {
  const session = useLatestSession()

  const chrome = usePlayerChrome()

  return (
    <PhoneScreen testid="screen-ios-upload-quality-check" tab="capture" pad={0} header={false}>
      <PhoneTop left={<Wordmark />} right={<GearLink />} />

      <div className="flex items-start px-[18px] pt-[13px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[33.6px] leading-[35px]">{chrome.name.toUpperCase()}</div>
          <div className="mt-[2px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
        </div>
        <div className="ml-auto flex shrink-0 items-start">
          <MiniStat glyph={<StreakGlyph size={38} />} value={chrome.streak} label="DAY STREAK" w={62} />
          <MiniStat glyph={<PointsGlyph size={21} />} value={chrome.points} label="POINTS" w={58} />
        </div>
      </div>

      <div className="mx-[18px] mt-[11px]" style={{ borderTop: `1px solid ${RULE}`, borderBottom: `1px solid ${RULE}` }}>
        <StatCells className="py-[9px]" valueSize={19} labelSize={7.5}
                   cells={[
                     { v: session.score, l: "FORM SCORE", tone: BLUE }, { v: session.shots, l: "SHOTS" },
                     { v: session.makes, l: "MAKES" }, { v: session.pct, l: "ACCURACY", tone: BLUE },
                     { v: <span className="text-[9px] leading-[11px]">Keep elbow<br />stacked</span>, l: "PRIMARY TARGET" },
                   ]} />
      </div>

      <div className="px-[18px]">
        <div className="mt-[12px] flex items-center gap-[10px]">
          <ActionGlyph kind="uploadImage" height={24} accent={ORANGE} />
          <PhoneHeading size={31}>UPLOAD QUALITY CHECK</PhoneHeading>
        </div>
        <p className="mt-[7px] text-[10px] leading-[13px]" style={{ color: GRAPHITE }}>
          We&apos;ll check your video to make sure it&apos;s ready for the best analysis.
        </p>

        <div className="relative mt-[10px] overflow-hidden rounded-[4px]">
          <Shot src={src} className="h-[168px] w-full" zoom={1.4} />
          <span className="absolute left-[9px] top-[8px] text-[9px] font-medium leading-[12px] text-white">
            {fileName}<br />
            <span className="text-[7.5px] opacity-90">00:04 • 1080p • 30fps</span>
          </span>
          <span className="absolute bottom-[8px] right-[9px] rounded-[3px] bg-black/60 px-[5px] py-[2px] text-[8px] text-white">00:04</span>
        </div>

        <div className="mt-[11px]">
          {CHECKS.map(([title, note, verdict, ok]) => (
            <div key={title} className="flex items-start gap-[9px] py-[8px]">
              <span className="mt-[1px] grid h-[16px] w-[16px] shrink-0 place-items-center rounded-full"
                    style={{ background: ok ? GREEN : "transparent", border: ok ? "none" : `1.4px solid ${ORANGE}` }}>
                {ok ? <Check className="h-[10px] w-[10px] text-white" strokeWidth={3} />
                    : <AlertCircle className="h-[13px] w-[13px]" style={{ color: ORANGE }} strokeWidth={2} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[11.5px] font-medium leading-[14px]">{title}</div>
                <div className="mt-[2px] text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>{note}</div>
              </div>
              <span className="shrink-0 text-[10px] font-medium" style={{ color: ok ? GREEN : ORANGE }}>{verdict}</span>
            </div>
          ))}
        </div>

        <PhoneCard className="mt-[8px] flex items-center gap-[11px] px-[11px] py-[10px]"
                   style={{ background: "var(--shotiq-color-warmCanvas)" }}>
          <QualityGlyph kind="lighting" size={22} />
          <p className="min-w-0 flex-1 text-[9px] leading-[12px]" style={{ color: GRAPHITE }}>
            Best framing: side view, full body in frame, shooting hand and ball fully visible.
          </p>
          <span className="grid h-[34px] w-[42px] shrink-0 place-items-center rounded-[3px]"
                style={{ border: `1.4px dashed ${ORANGE}` }}>
            <FilmingGlyph kind="fullBody" size={24} />
          </span>
        </PhoneCard>

        <PhoneAction tone="green" height={40} className="mt-[12px]" onClick={onContinue} testid="upload-continue-analysis">
          Continue to analysis
        </PhoneAction>
        <PhoneAction tone="outline" height={38} className="mb-[16px] mt-[7px] text-[13px]" onClick={onChoose}>
          Choose another
        </PhoneAction>
      </div>
    </PhoneScreen>
  )
}
