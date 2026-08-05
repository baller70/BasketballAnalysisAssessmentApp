"use client"

/**
 * The phone live-capture flow — canonical iOS 014 and 028-035.
 *
 * These nine renders are not nine pages. They are the states of ONE capture
 * flow, and this file is that flow: a single state machine whose transitions
 * are the buttons canonical draws.
 *
 *   setup (028) ──"Set up camera"──▶ primer (014) ──"Continue"──▶ calibrate (029)
 *        ▲                │                                            │
 *        │                └──"Not now"──▶ setup            "Confirm hoop" /
 *        │                                                "Skip calibration"
 *        │                                                             ▼
 *        ├──"Cancel"/"Adjust setup"────────────────────  readiness (030)
 *        │                                                             │
 *        │                                              "Keep position"▼
 *        │                                                    ready (031)
 *        │                                                             │
 *        │                                            "Start recording"▼
 *        │                                                 recording (032)
 *        │                                        ┌────────────┴────────────┐
 *        │                          coaching cue tapped            shot detected
 *        │                                        ▼                          ▼
 *        │                                  feedback (033) ──────────▶ shot (034)
 *        │                                        │  "Keep shooting"        │
 *        │                                        │                confirm / miss /
 *        │                     "Stop" / "STOP RECORDING"           "not a shot"
 *        │                                        ▼                          │
 *        └──"Discard session"───────────── review (035) ◀───────────────────┘
 *                                                 │
 *                                     "Analyze session" ▶ /video-analysis/processing
 *
 * The harness reaches any state deterministically with `?state=<key>` — the same
 * branch the buttons select, seeded on mount instead of by a tap. Deep-linking
 * does NOT open the camera: the capture surface falls back to the canonical
 * framing still until the player actually starts the stream, which is why these
 * screens no longer render a flat green rectangle where the preview belongs.
 *
 * Measurements: every position below is canonical px / 2.170483. See
 * LiveCaptureBits.tsx for the method.
 */

import React from "react"
import { useRouter } from "next/navigation"
import { PhoneScreen } from "@/components/shotiq/PhoneShell"
import { ReadinessGlyph, ActionGlyph, PoseGlyph, StreakGlyph, PointsGlyph } from "@/components/shotiq/Glyphs"
import {
  ORANGE, GREEN, BLUE, GRAPHITE, RULE, INK,
  CaptureIdentity, PhaseStrip, CameraFrame, CheckDot, Chevron, Bracketed, Head,
  StopwatchGlyph, PulseGlyph, HandGlyph, FlagGlyph, MuteGlyph, TrashGlyph,
  SwitchCamGlyph, CrosshairGlyph, DashedFrameGlyph, SlidersGlyph, CloseGlyph,
  BackArrow, UploadGlyph, ShieldGlyph, GearGlyph, CameraGlyph, Spark, ConfidenceArc,
  usePhoneViewport,
} from "@/components/shotiq/phone/LiveCaptureBits"

export const CAPTURE_STATES = [
  "setup", "primer", "calibrate", "readiness", "ready",
  "recording", "feedback", "shot", "review",
] as const
export type CaptureState = (typeof CAPTURE_STATES)[number]

export function isCaptureState(v: string | null | undefined): v is CaptureState {
  return !!v && (CAPTURE_STATES as readonly string[]).includes(v)
}

const IMG = "/images/canonical"
const TARGET = "Keep elbow stacked through release"

/* ======================================================================= */
/* 014 — camera permission primer                                          */
/* ======================================================================= */

const RECORDS: [string, string, string][] = [
  ["ios-014-record-1", "Full-body motion", "Your movement from setup through follow-through."],
  ["ios-014-record-2", "Ball trajectory", "The path and release point of your shot."],
  ["ios-014-record-3", "Timing & sequence", "Key moments and phase transitions."],
]

function Primer({ onContinue, onSkip }: { onContinue: () => void; onSkip: () => void }) {
  return (
    <PhoneScreen testid="screen-ios-camera-permission-primer" pad={23} headerH={39} tabBar={false}>
      {/* identity strip — 014 draws the whole stat cluster in the header row,
          not the two-mark cluster the rest of the family uses (y50.7-113.3) */}
      <div className="flex items-start justify-between pt-[11px]">
        <div className="min-w-0">
          <div className="shotiq-display text-[27px] leading-[28px] tracking-[0.04em]">JORDAN ELLIS</div>
          <div className="mt-[5px] whitespace-nowrap text-[10.5px] leading-[12px]" style={{ color: GRAPHITE }}>Right-handed • Advanced</div>
        </div>
        <div className="flex shrink-0 items-start text-center">
          <div className="w-[62px]">
            <div className="shotiq-numeric text-[19px] leading-[19px]">82</div>
            <div className="shotiq-microcaps mt-[3px] whitespace-nowrap leading-[9px]" style={{ "--shotiq-microcaps-size": "8px", color: GRAPHITE } as React.CSSProperties} >FORM SCORE</div>
            <div className="mt-[4px] text-[8px] leading-[9.5px]" style={{ color: GRAPHITE }}>{TARGET}</div>
          </div>
          <span aria-hidden="true" className="mx-[6px] h-[57px] w-px" style={{ background: RULE }} />
          <div className="w-[34px]">
            {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "%"]].map(([v, l], i) => (
              <div key={l} className={i ? "mt-[2px]" : undefined}>
                <div className={`shotiq-numeric text-[15px] leading-[16px] ${i === 1 ? "" : ""}`}
                     style={i === 1 ? { color: GREEN } : undefined}>{v}</div>
                <div className="shotiq-microcaps whitespace-nowrap text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>{l}</div>
              </div>
            ))}
          </div>
          <span aria-hidden="true" className="mx-[7px] h-[57px] w-px" style={{ background: RULE }} />
          <div className="w-[40px]">
            <div className="shotiq-numeric text-[17px] leading-[18px]">6</div>
            <div className="shotiq-microcaps mt-[3px] whitespace-nowrap text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>DAY STREAK</div>
          </div>
          <span aria-hidden="true" className="mx-[7px] h-[57px] w-px" style={{ background: RULE }} />
          <div className="w-[40px]">
            <span className="flex justify-center"><PointsGlyph size={19} /></span>
            <div className="shotiq-numeric mt-[2px] text-[17px] leading-[18px]">2,840</div>
            <div className="shotiq-microcaps mt-[2px] text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>POINTS</div>
          </div>
        </div>
      </div>

      <Head cap={32.3} className="mt-[1px]">LIVE SHOT CAPTURE</Head>
      <Head cap={16.1} className="mt-[5px]" tone={GRAPHITE} style={{ letterSpacing: "0.16em" }}>HOW IT WORKS</Head>
      <div className="mt-[5px] h-px" style={{ background: RULE }} />
      <p className="mt-[9px] text-[13.5px] leading-[19.5px]" style={{ color: GRAPHITE }}>
        Live capture uses your camera to record your shot
        <br />so ShotIQ can analyze your mechanics in real time.
      </p>

      <Head cap={13.8} className="mt-[13px]">WHAT WE RECORD</Head>
      <div className="mt-[9px] flex">
        {RECORDS.map(([src, title, body], i) => (
          <React.Fragment key={src}>
            {i > 0 && <span aria-hidden="true" className="mx-[10px] w-px self-stretch" style={{ background: RULE }} />}
            <div className="flex-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${IMG}/${src}.jpg`} alt="" width={103} height={113}
                   className="block h-[113px] w-full rounded-[3px] object-cover" />
              <div className="mt-[9px] whitespace-nowrap text-[11.5px] font-semibold leading-[13px] tracking-[-0.02em]">{title}</div>
              <div className="mt-[4px] text-[10px] leading-[12.4px]" style={{ color: GRAPHITE }}>{body}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-[1px] flex items-start gap-[11px] rounded-[6px] border p-[8px]"
           style={{ borderColor: RULE, background: "var(--shotiq-color-warmCanvas)" }}>
        <ShieldGlyph size={29} />
        <div className="min-w-0">
          <div className="text-[13px] font-semibold leading-[14px]">Your privacy matters</div>
          <p className="mt-[4px] text-[10.5px] leading-[12.5px]" style={{ color: GRAPHITE }}>
            Videos are securely processed to generate your analysis.
            <br />We do not share or use your videos for anything else.
          </p>
        </div>
      </div>

      <div className="mt-[8px] flex items-start justify-between">
        <div className="w-[178px] shrink-0">
          <Head cap={14.7}>WHEN YOU&rsquo;LL SEE THIS</Head>
          <p className="mt-[9px] text-[11px] leading-[14px]" style={{ color: GRAPHITE }}>
            You&rsquo;ll be asked for camera access the first time you start a live capture.
          </p>
        </div>
        {/* the iOS permission alert, as canonical mocks it (x216-357, y543.7-636.7) */}
        <div className="-mt-[9px] h-[93px] w-[141px] shrink-0 overflow-hidden rounded-[7px] border text-center"
             style={{ borderColor: RULE, background: "var(--shotiq-color-warmCanvas)" }}>
          <div className="px-[9px] pt-[7px] text-[11px] font-semibold leading-[13px]">
            &ldquo;ShotIQ&rdquo; Would Like to Access the Camera
          </div>
          <p className="mt-[4px] px-[8px] text-[9px] leading-[11px]" style={{ color: GRAPHITE }}>
            ShotIQ uses your camera to record live shots and analyze your form.
          </p>
          <div className="mt-[4px] flex border-t text-[11px]" style={{ borderColor: RULE, color: BLUE }}>
            <span className="flex-1 border-r py-[4px]" style={{ borderColor: RULE }}>Don&rsquo;t Allow</span>
            <span className="flex-1 py-[4px]">Allow</span>
          </div>
        </div>
      </div>

      <Head cap={13.8} className="mt-[9px]">HOW TO ALLOW</Head>
      <div className="mt-[8px] flex items-start">
        {[
          [<GearGlyph key="g" size={26} />, "Open Settings", ""],
          [<HandGlyph key="h" size={26} />, "Tap Privacy", "& Security"],
          [<CameraGlyph key="c" size={26} />, "Select Camera", ""],
          [
            <span key="t" className="grid h-[19px] w-[33px] items-center rounded-full px-[2px]" style={{ background: GREEN }}>
              <span className="ml-auto block h-[15px] w-[15px] rounded-full bg-white" />
            </span>,
            "Turn on", "ShotIQ",
          ],
        ].map(([glyph, l1, l2], i) => (
          <React.Fragment key={String(l1)}>
            {i > 0 && (
              <span className="mt-[10px] shrink-0 px-[5px]" style={{ color: GRAPHITE }}><Chevron h={12} /></span>
            )}
            <div className="flex-1 text-center">
              <span className="flex h-[26px] items-center justify-center">{glyph}</span>
              <div className="mt-[6px] whitespace-nowrap text-[10px] leading-[11.5px]" style={{ color: GRAPHITE }}>{l1}</div>
              {l2 ? <div className="whitespace-nowrap text-[10px] leading-[11.5px]" style={{ color: GRAPHITE }}>{l2}</div> : null}
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-[5px] h-px" style={{ background: RULE }} />
      <div className="mt-[5px] flex items-start justify-between">
        <div className="min-w-0">
          <Head cap={13.8}>GOOD TO KNOW</Head>
          <ul className="mt-[6px] space-y-[2px] text-[10.5px] leading-[12.5px]" style={{ color: GRAPHITE }}>
            {["You can change this anytime in Settings.",
              "Camera access is required for live shot capture.",
              "This permission does not affect your saved videos."].map((t) => (
              <li key={t} className="flex gap-[7px]"><span aria-hidden="true">•</span>{t}</li>
            ))}
          </ul>
        </div>
        <Bracketed size={64} stroke={INK}>
          <span className="grid h-[38px] w-[57px] place-items-center border" style={{ borderColor: ORANGE }}>
            <ActionGlyph kind="nodeGraph" height={16} />
          </span>
        </Bracketed>
      </div>

      <button type="button" onClick={onContinue} data-testid="capture-primer-continue"
              className="mt-[7px] flex h-[30px] w-full items-center justify-center rounded-[5px] text-[15px] font-semibold text-white"
              style={{ background: GREEN }}>
        Continue
      </button>
      <button type="button" onClick={onSkip}
              className="mt-[4px] flex h-[24px] w-full items-center justify-center rounded-[5px] border text-[14px] font-semibold"
              style={{ borderColor: GREEN, color: GREEN }}>
        Not now
      </button>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 028 — live camera setup                                                 */
/* ======================================================================= */

const SETUP_CHECKS: [React.ComponentProps<typeof ReadinessGlyph>["kind"], string, string][] = [
  ["stability", "STABLE PLACEMENT", "Phone is steady and on a flat surface."],
  ["framing", "FULL-BODY IN FRAME", "From head to shoes with space around."],
  ["athlete", "HOOP VISIBLE", "Backboard and rim clearly visible."],
]

function Setup({
  hand, onHand, onStart, onUpload, stream,
}: {
  hand: "LEFT" | "RIGHT"; onHand: (h: "LEFT" | "RIGHT") => void
  onStart: () => void; onUpload: () => void; stream: MediaStream | null
}) {
  return (
    <PhoneScreen testid="screen-ios-live-camera-setup" pad={18} headerH={40} tab="home">
      <CaptureIdentity cap={22.1} className="pt-[7px]" />

      {/* stat card, canonical y109.7-167.2 (57.5 tall), dividers at x124.6 and x287.5 */}
      <div className="mt-[10px] flex h-[57px] items-stretch rounded-[6px] border" style={{ borderColor: RULE }}>
        <div className="flex w-[106px] shrink-0 items-center gap-[4px] pl-[8px]">
          <div>
            <div className="shotiq-microcaps whitespace-nowrap text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>FORM SCORE</div>
            <div className="mt-[2px] flex items-baseline gap-[2px]">
              <span className="shotiq-numeric text-[20px] leading-[20px]" style={{ color: BLUE }}>82</span>
              <span className="text-[9px]" style={{ color: GRAPHITE }}>/100</span>
            </div>
          </div>
          <Spark width={42} height={24} />
        </div>
        {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "ACCURACY"]].map(([v, l]) => (
          <div key={l} className="flex-1 border-l pl-[8px] pt-[11px]" style={{ borderColor: RULE }}>
            <div className="shotiq-numeric text-[17px] leading-[18px]">{v}</div>
            <div className="shotiq-microcaps mt-[3px] whitespace-nowrap text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>{l}</div>
          </div>
        ))}
        <div className="w-[99px] shrink-0 border-l pl-[8px] pr-[3px] pt-[10px]" style={{ borderColor: RULE }}>
          <div className="shotiq-microcaps whitespace-nowrap text-[7.5px] leading-[8px]" style={{ color: GRAPHITE }}>PRIMARY TARGET</div>
          <div className="mt-[3px] text-[8.5px] leading-[10.5px]">{TARGET}</div>
        </div>
      </div>

      <div className="mt-[14px] flex items-start justify-between">
        <div className="min-w-0">
          <Head cap={22.1}>LIVE CAMERA SETUP</Head>
          <p className="mt-[9px] text-[11px] leading-[13px]" style={{ color: GRAPHITE }}>
            Follow the checklist below for best AI analysis.
          </p>
        </div>
        <button type="button" data-testid="capture-switch-camera"
                className="flex h-[38px] w-[99px] shrink-0 items-center justify-center gap-[6px] whitespace-nowrap rounded-[6px] border text-[11px]"
                style={{ borderColor: RULE }}>
          <SwitchCamGlyph size={16} /> Switch camera
        </button>
      </div>

      <CameraFrame src={`${IMG}/ios-028-frame.jpg`} width={357} height={230} stream={stream}
                   radius={4} className="mt-[10px]" onStart={onStart}
                   label="Start the camera preview" />

      {/* checklist card, y473.6-663.0, rows ruled at 521.8 / 568.5 / 615.0 */}
      <div className="mt-[8px] rounded-[6px] border" style={{ borderColor: RULE }}>
        {SETUP_CHECKS.map(([kind, title, body]) => (
          <div key={title} className="flex h-[46px] items-center gap-[12px] border-b px-[12px]" style={{ borderColor: RULE }}>
            <Bracketed size={33} stroke={INK}>
              <ReadinessGlyph kind={kind} size={18} />
            </Bracketed>
            <div className="min-w-0 flex-1">
              <Head cap={13}>{title}</Head>
              <div className="mt-[4px] whitespace-nowrap text-[10px] leading-[11px]" style={{ color: GRAPHITE }}>{body}</div>
            </div>
            <span className="grid h-[19px] w-[19px] shrink-0 place-items-center rounded-full border-[1.6px]"
                  style={{ borderColor: GREEN }}>
              <svg width="10" height="10" viewBox="0 0 12 12" aria-hidden="true">
                <path d="M2.4 6.3 L4.8 8.9 L9.6 3.3" fill="none" stroke={GREEN} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </div>
        ))}
        <div className="flex h-[46px] items-center gap-[12px] px-[12px]">
          <Bracketed size={33} stroke={INK}><PoseGlyph phase="setup" size={18} /></Bracketed>
          <div className="min-w-0 flex-1">
            <Head cap={13}>SHOOTING HAND</Head>
            <div className="mt-[4px] whitespace-nowrap text-[10px] leading-[11px]" style={{ color: GRAPHITE }}>Confirm your dominant shooting hand.</div>
          </div>
          <div className="flex shrink-0 overflow-hidden rounded-[3px] border" style={{ borderColor: RULE }}>
            {(["LEFT", "RIGHT"] as const).map((h) => (
              <button key={h} type="button" onClick={() => onHand(h)} aria-pressed={hand === h}
                      data-testid={`capture-hand-${h.toLowerCase()}`}
                      className="shotiq-display px-[11px] py-[5px] text-[14px] leading-[15px]"
                      style={hand === h ? { background: ORANGE, color: "#fff" } : { color: INK }}>
                {h}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button type="button" onClick={onStart} data-testid="capture-setup-start"
              className="mt-[7px] flex h-[33px] w-full items-center justify-center gap-[11px] rounded-[6px] text-[15px] font-semibold text-white"
              style={{ background: ORANGE }}>
        <ActionGlyph kind="analyze" height={19} accent="#fff" /> Set up camera
      </button>
      <button type="button" onClick={onUpload}
              className="mt-[3px] flex h-[29px] w-full items-center justify-center gap-[10px] rounded-[6px] border text-[13px]"
              style={{ borderColor: RULE }}>
        <UploadGlyph size={16} /> Use uploaded video
      </button>

      <PhaseStrip active="SETUP" figure={28} label={9} className="mt-[6px]" />
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 029 — hoop calibration                                                  */
/* ======================================================================= */

function Calibrate({
  onConfirm, onSkip, onSwitch, stream, onStart,
}: {
  onConfirm: () => void; onSkip: () => void; onSwitch: () => void
  stream: MediaStream | null; onStart: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-hoop-calibration" pad={21} headerH={40} tab="home">
      <div className="flex items-start justify-between pt-[12px]">
        <div className="min-w-0">
          <Head cap={25}>HOOP CALIBRATION</Head>
          <p className="mt-[9px] text-[11px] leading-[13px]" style={{ color: GRAPHITE }}>Align the overlay with the hoop.</p>
        </div>
        <div className="flex shrink-0 items-start text-center">
          <div className="w-[62px]">
            <span className="flex h-[20px] items-center justify-center"><StreakGlyph size={36} /></span>
            <div className="shotiq-numeric mt-[5px] text-[19px] leading-[14px]">6</div>
            <div className="shotiq-microcaps mt-[5px] whitespace-nowrap text-[8.6px] leading-[7px]" style={{ color: GRAPHITE }}>DAY STREAK</div>
          </div>
          <span aria-hidden="true" className="mx-[9px] mt-[1px] h-[52px] w-px" style={{ background: RULE }} />
          <div className="w-[54px]">
            <span className="flex h-[20px] items-center justify-center"><PointsGlyph size={20} /></span>
            <div className="shotiq-numeric mt-[5px] text-[19px] leading-[14px]">2,840</div>
            <div className="shotiq-microcaps mt-[5px] text-[8.6px] leading-[7px]" style={{ color: GRAPHITE }}>POINTS</div>
          </div>
        </div>
      </div>

      {/* full-bleed calibration frame, y117.5-566.2 across the whole 393pt */}
      <div className="mt-[13px]" style={{ marginLeft: -21, marginRight: -21 }}>
        <CameraFrame src={`${IMG}/ios-029-frame.jpg`} width={393} height={448} stream={stream}
                     radius={0} onStart={onStart} label="Start the camera preview">
          <div className="pointer-events-none absolute inset-x-[30px] bottom-[16px] flex items-center gap-[15px] rounded-[6px] px-[13px] py-[11px]"
               style={{ background: "#26282B" }}>
            <span style={{ color: ORANGE }}><Bracketed size={38} stroke="#fff"><ActionGlyph kind="nodeGraph" height={13} /></Bracketed></span>
            <p className="text-[12.5px] leading-[17px] text-white">
              Center the hoop in the frame.
              <br />Align the rim with the crosshair.
            </p>
          </div>
        </CameraFrame>
      </div>

      <div className="mt-[16px] flex gap-[19px]">
        <button type="button" onClick={onSwitch}
                className="flex h-[39px] flex-1 items-center justify-center gap-[9px] rounded-[6px] border text-[12.5px]"
                style={{ borderColor: RULE }}>
          <SwitchCamGlyph size={18} /> Switch camera
        </button>
        <button type="button" onClick={onSkip} data-testid="capture-skip-calibration"
                className="flex h-[39px] flex-1 items-center justify-center gap-[9px] rounded-[6px] border text-[12.5px]"
                style={{ borderColor: RULE }}>
          <DashedFrameGlyph size={18} /> Skip calibration
        </button>
      </div>
      <button type="button" onClick={onConfirm} data-testid="capture-confirm-hoop"
              className="mt-[14px] flex h-[44px] w-full items-center justify-center gap-[13px] rounded-[6px] text-[17px] font-semibold text-white"
              style={{ background: GREEN }}>
        <CrosshairGlyph size={22} /> Confirm hoop
      </button>

      <PhaseStrip active="RELEASE" figure={29} label={9} className="mt-[17px]" />
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 030 — readiness check                                                   */
/* ======================================================================= */

const READY_ROWS: [React.ComponentProps<typeof ReadinessGlyph>["kind"], string, string][] = [
  ["framing", "Full body", "GOOD"],
  ["lighting", "Lighting", "GOOD"],
  ["stability", "Stability", "GOOD"],
  ["athlete", "Hoop visible", "GOOD"],
  ["framing", "Ball visible", "GOOD"],
  ["athlete", "Pose confidence", "92%"],
]

function Readiness({
  onKeep, onCancel, onHelp, stream, onStart,
}: {
  onKeep: () => void; onCancel: () => void; onHelp: () => void
  stream: MediaStream | null; onStart: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-readiness-check" pad={22} headerH={44} tab="home">
      <CaptureIdentity cap={24} className="pt-[11px]" />
      <div className="mt-[9px] h-px" style={{ background: RULE }} />

      <div className="mt-[11px] flex items-center gap-[16px]">
        <BackArrow w={15} />
        <span className="shotiq-microcaps leading-[10px]" style={{ "--shotiq-microcaps-size": "10px", color: GRAPHITE } as React.CSSProperties} >AI ANALYSIS</span>
      </div>
      <Head cap={32.3} className="mt-[10px]">READINESS CHECK</Head>
      <p className="mt-[8px] text-[12.5px] leading-[14px]" style={{ color: GRAPHITE }}>
        Get everything green to capture your best analysis.
      </p>

      <div className="mt-[8px]" style={{ marginLeft: -8, marginRight: -8 }}>
        <CameraFrame src={`${IMG}/ios-030-frame.jpg`} width={365} height={287} stream={stream}
                     radius={7} onStart={onStart} label="Start the camera preview">
          <span className="pointer-events-none absolute left-[10px] top-[10px] flex items-center gap-[6px] rounded-[5px] px-[9px] py-[5px]"
                style={{ background: "#26282B" }}>
            <span className="h-[7px] w-[7px] rounded-full" style={{ background: "#25C46A" }} />
            <span className="text-[11px] font-semibold text-white">LIVE</span>
          </span>
          {/* the live readiness list, x261.2-368.6 y308.2-496.2 of the canonical */}
          {/* canonical x261.2-368.6, y308.2-496.2 — six 31.3pt rows */}
          <div className="pointer-events-none absolute right-[10px] top-[88px] w-[108px] overflow-hidden rounded-[6px] bg-white">
            {READY_ROWS.map(([kind, label, value], i) => (
              <div key={label} className={`flex h-[31px] items-center gap-[5px] px-[6px] ${i ? "border-t" : ""}`}
                   style={{ borderColor: RULE }}>
                <CheckDot size={14} />
                <ReadinessGlyph kind={kind} size={13} />
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-[9px] leading-[10px]">{label}</div>
                  <div className="text-[8px] font-semibold leading-[9px]" style={{ color: GREEN }}>{value}</div>
                </div>
              </div>
            ))}
          </div>
        </CameraFrame>
      </div>

      <div className="shotiq-microcaps mt-[10px] text-[9.5px]" style={{ color: GRAPHITE }}>SHOT PHASE</div>
      <PhaseStrip active="RELEASE" figure={29} label={9} className="mt-[5px]" />

      <div className="mt-[11px] flex items-center rounded-[6px] border py-[8px]" style={{ borderColor: RULE }}>
        <span className="flex w-[62px] shrink-0 justify-center"><ActionGlyph kind="nodeClimb" height={26} accent={ORANGE} /></span>
        <span aria-hidden="true" className="mr-[11px] h-[42px] w-px" style={{ background: RULE }} />
        <div className="min-w-0 flex-1">
          <div className="shotiq-microcaps text-[9.5px]" style={{ color: GRAPHITE }}>PRIMARY COACHING TARGET</div>
          <div className="mt-[4px] text-[14.5px] font-semibold leading-[17px]">{TARGET}</div>
        </div>
        <span className="px-[12px]"><Chevron h={14} /></span>
      </div>

      <button type="button" onClick={onKeep} data-testid="capture-keep-position"
              className="mt-[9px] flex h-[33px] w-full items-center justify-center rounded-[6px] text-[15px] font-semibold text-white"
              style={{ background: GREEN }}>
        Keep position
      </button>
      <div className="mt-[8px] flex h-[35px] items-center rounded-[6px] border" style={{ borderColor: RULE }}>
        <button type="button" onClick={onHelp} className="flex flex-1 items-center justify-center gap-[9px] text-[13px]">
          <CameraGlyph size={18} /> Camera help
        </button>
        <span aria-hidden="true" className="h-[22px] w-px" style={{ background: RULE }} />
        <button type="button" onClick={onCancel} className="flex-1 text-[13px]">Cancel</button>
      </div>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 031 — capture ready                                                     */
/* ======================================================================= */

const READY_CHECKS: [string, string][] = [
  ["Camera", "Positioned"], ["Full Body", "In Frame"], ["Lighting", "Good"],
  ["Space", "Clear"], ["Battery", "Sufficient"],
]

function Ready({
  onRecord, onAdjust, onCancel, stream, onStart,
}: {
  onRecord: () => void; onAdjust: () => void; onCancel: () => void
  stream: MediaStream | null; onStart: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-capture-ready" pad={21} headerH={35} tab="home">
      <CaptureIdentity cap={24} className="pt-[19px]" />
      <div className="mt-[9px] h-px" style={{ background: RULE }} />

      <div className="mt-[11px] flex items-start justify-between">
        <div className="min-w-0">
          {/* canonical 031 draws this at cap 40 of the 853px art = 18.4 CSS
              px. cap 26 measured 56 against canonical's 40, 140%. */}
          <Head cap={18.4}>CAPTURE READY</Head>
          <p className="mt-[8px] text-[12px] leading-[14px]" style={{ color: GRAPHITE }}>
            All readiness checks confirmed. You&rsquo;re good to go.
          </p>
        </div>
        <span className="grid h-[33px] w-[33px] shrink-0 place-items-center rounded-full border-2" style={{ borderColor: GREEN }}>
          <svg width="17" height="17" viewBox="0 0 12 12" aria-hidden="true">
            <path d="M2.2 6.2 L4.7 9 L9.8 3.2" fill="none" stroke={GREEN} strokeWidth="1.7"
                  strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>

      <div className="mt-[11px] flex">
        {READY_CHECKS.map(([name, sub], i) => (
          <React.Fragment key={name}>
            {i > 0 && <span aria-hidden="true" className="mx-[6px] w-px self-stretch" style={{ background: RULE }} />}
            <div className="flex-1">
              <div className="flex items-center gap-[4px]">
                <CheckDot size={13} />
                <span className="whitespace-nowrap text-[10.5px] font-semibold leading-[13px]">{name}</span>
              </div>
              <div className="mt-[5px] whitespace-nowrap pl-[17px] text-[9.5px] leading-[11px]" style={{ color: GRAPHITE }}>{sub}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
      <div className="mt-[10px] h-px" style={{ background: RULE }} />

      <Head cap={11.1} className="mt-[9px]">CAMERA PREVIEW</Head>
      <CameraFrame src={`${IMG}/ios-031-frame.jpg`} width={349} height={207} stream={stream}
                   radius={6} className="mt-[6px]" onStart={onStart} label="Start the camera preview">
        <span className="pointer-events-none absolute bottom-[9px] right-[9px] rounded-[5px] px-[9px] py-[5px] text-[11px] text-white"
              style={{ background: "rgba(38,40,43,.92)" }}>1080p • 60fps</span>
      </CameraFrame>

      <div className="mt-[11px] flex items-baseline gap-[6px]">
        <Head cap={11.5}>SHOT RAIL:</Head>
        <Head cap={11.5} tone={BLUE}>SETUP</Head>
      </div>
      <PhaseStrip active="SETUP" figure={30} label={9} accent={BLUE} brackets className="mt-[6px]" />

      <div className="mt-[9px] h-px" style={{ background: RULE }} />
      <div className="mt-[9px] flex items-start justify-between">
        <div className="min-w-0">
          <div className="shotiq-microcaps text-[9.5px]" style={{ color: GRAPHITE }}>PRIMARY COACHING TARGET</div>
          <div className="mt-[6px] text-[17px] leading-[19px]">{TARGET}</div>
        </div>
        <span className="mt-[12px] shrink-0"><Chevron h={14} /></span>
      </div>
      <div className="mt-[9px] h-px" style={{ background: RULE }} />

      <div className="shotiq-microcaps mt-[9px] text-[9.5px]" style={{ color: GRAPHITE }}>LATEST SESSION</div>
      <div className="mt-[5px] flex items-start">
        {[["24", "SHOTS"], ["15", "MAKES"], ["62.5%", "MAKE %"]].map(([v, l]) => (
          <div key={l} className="flex-1">
            <div className="shotiq-numeric text-[22px] leading-[24px]">{v}</div>
            <div className="shotiq-microcaps mt-[4px] leading-[10px]" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >{l}</div>
          </div>
        ))}
        <div className="w-[105px] shrink-0">
          <div className="flex items-start gap-[4px]">
            <Spark width={52} height={22} />
            <svg width="13" height="13" viewBox="0 0 16 16" aria-hidden="true">
              <path d="M3 13 L13 3 M6 3 H13 V10" fill="none" stroke={GREEN} strokeWidth="1.6" />
            </svg>
          </div>
          <div className="mt-[3px] text-[9px] leading-[10px]">
            <span style={{ color: GREEN }}>+8.1%</span> <span style={{ color: GRAPHITE }}>vs last session</span>
          </div>
        </div>
      </div>

      <button type="button" onClick={onRecord} data-testid="capture-start-recording"
              className="mt-[10px] flex h-[36px] w-full items-center justify-center gap-[13px] rounded-[6px] text-[16px] font-semibold text-white"
              style={{ background: GREEN }}>
        <ActionGlyph kind="analyze" height={20} accent="#fff" /> Start recording
      </button>
      <div className="mt-[7px] flex gap-[16px]">
        <button type="button" onClick={onAdjust}
                className="flex h-[34px] flex-1 items-center justify-center gap-[9px] rounded-[6px] border text-[13px]"
                style={{ borderColor: RULE }}>
          <SlidersGlyph size={18} /> Adjust setup
        </button>
        <button type="button" onClick={onCancel}
                className="flex h-[34px] flex-1 items-center justify-center gap-[9px] rounded-[6px] border text-[13px]"
                style={{ borderColor: RULE }}>
          <CloseGlyph size={15} /> Cancel
        </button>
      </div>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 032 — live recording                                                    */
/* ======================================================================= */

function mmss(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
}

function Recording({
  seconds, shots, makes, paused, onPause, onStop, onCue, stream, onStart,
}: {
  seconds: number; shots: number; makes: number; paused: boolean
  onPause: () => void; onStop: () => void; onCue: () => void
  stream: MediaStream | null; onStart: () => void
}) {
  const pct = shots ? `${((makes / shots) * 100).toFixed(1)}%` : "0.0%"
  return (
    <PhoneScreen testid="screen-ios-live-recording" pad={17} headerH={36} tab="home">
      <CaptureIdentity cap={28.6} className="pt-[14px]" />

      <div className="mt-[17px] flex items-center gap-[10px]">
        <span className="h-[8px] w-[8px] rounded-full" style={{ background: ORANGE }} />
        <span className="shotiq-display text-[16px] leading-[16px] tracking-[0.03em]" style={{ color: ORANGE }}>LIVE RECORDING</span>
        <span className="ml-[15px] text-[12px]" style={{ color: GRAPHITE }}>Session time {mmss(seconds)}</span>
      </div>

      <CameraFrame src={`${IMG}/ios-032-frame.jpg`} width={362} height={364} stream={stream}
                   radius={7} className="mt-[9px]" onStart={onStart} label="Start the camera preview">
        <div className="pointer-events-none absolute left-[10px] top-[13px] w-[78px]">
          <div className="shotiq-microcaps text-[9.5px] leading-[10px] text-white">CONFIDENCE</div>
          <div className="shotiq-numeric mt-[3px] text-[28px] leading-[28px]" style={{ color: "#25C46A" }}>92%</div>
          <div className="mt-[3px] h-[6px] w-full rounded-full bg-white/90">
            <div className="h-full rounded-full" style={{ width: "80%", background: "#1B8F4C" }} />
          </div>
        </div>
        <div className="pointer-events-none absolute right-[13px] top-[13px] rounded-[6px] px-[11px] py-[7px] text-center"
             style={{ background: "rgba(38,40,43,.92)" }}>
          <span className="flex items-center gap-[6px] text-[11px] font-semibold text-white">
            <span className="h-[8px] w-[8px] rounded-full" style={{ background: ORANGE }} /> REC
          </span>
          <span className="shotiq-numeric mt-[2px] block text-[19px] leading-[20px] text-white">{mmss(seconds)}</span>
        </div>
        <div className="pointer-events-none absolute right-[10px] top-[128px] w-[76px] text-right">
          {[["SHOTS", String(shots)], ["MAKES", String(makes)], ["MAKE %", pct]].map(([l, v], i) => (
            <div key={l} className={i ? "mt-[6px] border-t border-white/60 pt-[6px]" : ""}>
              <div className="shotiq-microcaps whitespace-nowrap leading-[10px] text-white" style={{ "--shotiq-microcaps-size": "9px" } as React.CSSProperties}>{l}</div>
              <div className="shotiq-numeric mt-[1px] text-[25px] leading-[26px] text-white">{v}</div>
            </div>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-[10px] pb-[7px] pt-[16px]"
             style={{ background: "linear-gradient(rgba(16,17,19,0) 0%, rgba(16,17,19,.55) 55%)" }}>
          <PhaseStrip active="RELEASE" figure={24} label={8} tone="dark" />
        </div>
      </CameraFrame>

      <button type="button" onClick={onCue} data-testid="capture-open-cue"
              className="mt-[11px] flex w-full items-center rounded-[6px] border px-[11px] py-[8px] text-left"
              style={{ borderColor: RULE }}>
        <div className="min-w-0 flex-1">
          <div className="shotiq-microcaps text-[9.5px]" style={{ color: GRAPHITE }}>PRIMARY COACHING TARGET</div>
          <div className="mt-[5px] text-[17px] leading-[18px] font-semibold">{TARGET}</div>
        </div>
        <Chevron h={14} />
      </button>

      <div className="mt-[9px] flex rounded-[6px] border py-[8px]" style={{ borderColor: RULE }}>
        {[
          [<StopwatchGlyph key="a" size={19} />, "REPS REMAINING", "00:42"],
          [<StopwatchGlyph key="b" size={19} />, "ROUND TIMER", "00:42"],
          [<HandGlyph key="c" size={19} />, "QUALITY TOUCHES", "50"],
          [<Spark key="d" width={51} height={19} />, "CURRENT STREAK", "7"],
        ].map(([glyph, label, value], i) => (
          <React.Fragment key={String(label)}>
            {i > 0 && <span aria-hidden="true" className="w-px self-stretch" style={{ background: RULE }} />}
            <div className="flex-1 px-[3px] text-center">
              <span className="flex h-[19px] items-center justify-center">{glyph}</span>
              <div className="shotiq-microcaps mt-[6px] whitespace-nowrap text-[7.6px] leading-[8px]" style={{ color: GRAPHITE }}>{label}</div>
              <div className="shotiq-numeric mt-[6px] text-[21px] leading-[21px]">{value}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-[9px] flex items-start justify-center gap-[45px]">
        <div className="text-center">
          <button type="button" onClick={onPause} data-testid="capture-pause"
                  className="grid h-[42px] w-[42px] place-items-center rounded-full border"
                  style={{ borderColor: RULE }} aria-label={paused ? "Resume" : "Pause"}>
            {paused
              ? <svg width="15" height="17" viewBox="0 0 15 17" aria-hidden="true"><path d="M2 1.5 13 8.5 2 15.5z" fill={INK} /></svg>
              : <svg width="13" height="17" viewBox="0 0 13 17" aria-hidden="true"><rect x="0" y="0" width="4.4" height="17" fill={INK} /><rect x="8.6" y="0" width="4.4" height="17" fill={INK} /></svg>}
          </button>
          <div className="shotiq-microcaps mt-[6px]" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >PAUSE</div>
        </div>
        <div className="text-center">
          <button type="button" onClick={onStop} data-testid="capture-stop-recording"
                  className="grid h-[59px] w-[59px] place-items-center rounded-full" style={{ background: ORANGE }}
                  aria-label="Stop recording">
            <span className="block h-[21px] w-[21px] rounded-[3px] bg-white" />
          </button>
          <div className="shotiq-display mt-[6px] text-[15px] leading-[15px] tracking-[0.03em]" style={{ color: ORANGE }}>STOP RECORDING</div>
        </div>
        <div className="text-center">
          <button type="button" onClick={onStop}
                  className="grid h-[42px] w-[42px] place-items-center rounded-full border"
                  style={{ borderColor: RULE }} aria-label="End round">
            <FlagGlyph size={19} />
          </button>
          <div className="shotiq-microcaps mt-[6px]" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >END ROUND</div>
        </div>
      </div>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 033 — live form feedback                                                */
/* ======================================================================= */

function Feedback({
  onKeep, onStop, onShot, stream, onStart, muted, onMute,
}: {
  onKeep: () => void; onStop: () => void; onShot: () => void
  stream: MediaStream | null; onStart: () => void
  muted: boolean; onMute: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-live-form-feedback" pad={21} headerH={36} tabBar={false}>
      <CaptureIdentity cap={24.9} className="pt-[13px]" />

      <div className="mt-[22px] flex items-center justify-between">
        <Head cap={12.4}>LIVE FORM FEEDBACK</Head>
        <span className="flex items-center gap-[7px] text-[12px]" style={{ color: BLUE }}>
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: BLUE }} /> Demo
        </span>
      </div>

      <CameraFrame src={`${IMG}/ios-033-frame.jpg`} width={351} height={366} stream={stream}
                   radius={7} className="mt-[7px]" onStart={onStart} label="Start the camera preview">
        <span className="pointer-events-none absolute left-[10px] top-[10px] flex items-center gap-[6px] rounded-[5px] px-[9px] py-[5px]"
              style={{ background: "#26282B" }}>
          <span className="h-[7px] w-[7px] rounded-full" style={{ background: ORANGE }} />
          <span className="text-[11px] font-semibold text-white">LIVE</span>
        </span>
        {/* LATEST RESULT card, canonical x279.2-373.0 y247.4-428.9 */}
        {/* canonical x279.2-373.0, y247.4-428.9 — 93.8 x 181.5 flush right */}
        <button type="button" onClick={onShot} data-testid="capture-latest-result"
                className="absolute right-0 top-[94px] h-[182px] w-[94px] rounded-l-[7px] bg-white px-[11px] py-[13px] text-left">
          <div className="shotiq-microcaps text-[9.5px]" style={{ color: GRAPHITE }}>LATEST RESULT</div>
          <Head cap={11} className="mt-[9px]">FORM SCORE</Head>
          <div className="shotiq-numeric mt-[4px] text-[45px] leading-[45px]" style={{ color: ORANGE }}>82</div>
          <div className="mt-[6px] h-[5px] w-full rounded-full" style={{ background: RULE }}>
            <div className="h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
          </div>
          <div className="shotiq-display mt-[9px] text-[13px] leading-[13px]" style={{ color: BLUE }}>GOOD</div>
          <p className="mt-[6px] text-[10.5px] leading-[13px]" style={{ color: GRAPHITE }}>Keep building consistency.</p>
        </button>
      </CameraFrame>

      <div className="mt-[5px] flex items-center rounded-[6px] border py-[9px]" style={{ borderColor: RULE }}>
        <span className="flex w-[67px] shrink-0 justify-center">
          <Bracketed size={44} stroke={INK}><ActionGlyph kind="nodeGraph" height={17} /></Bracketed>
        </span>
        <span aria-hidden="true" className="mr-[13px] h-[66px] w-px" style={{ background: RULE }} />
        <div className="min-w-0 flex-1">
          <div className="shotiq-microcaps text-[9.5px]" style={{ color: GRAPHITE }}>LIVE FEEDBACK</div>
          <div className="mt-[5px] text-[19px] font-semibold leading-[21px]">Keep elbow stacked.</div>
          <div className="mt-[8px] flex">
            <div className="w-[77px]">
              <div className="shotiq-microcaps text-[8.5px]" style={{ color: GRAPHITE }}>CONFIDENCE</div>
              <div className="mt-[4px] text-[12.5px] font-semibold" style={{ color: ORANGE }}>87%</div>
            </div>
            <div>
              <div className="shotiq-microcaps text-[8.5px]" style={{ color: GRAPHITE }}>DETECTED</div>
              <div className="mt-[4px] text-[12.5px] font-semibold" style={{ color: ORANGE }}>Release</div>
            </div>
          </div>
        </div>
      </div>

      <PhaseStrip active="RELEASE" figure={29} label={9} className="mt-[8px]" />

      <div className="mt-[10px] flex items-start justify-center gap-[62px]">
        <div className="text-center">
          <button type="button" onClick={onMute} aria-pressed={muted}
                  className="grid h-[44px] w-[44px] place-items-center rounded-full border"
                  style={{ borderColor: RULE }} aria-label="Mute coaching">
            <MuteGlyph size={21} />
          </button>
          <div className="mt-[6px] text-[11px]" style={{ color: GRAPHITE }}>Mute coaching</div>
        </div>
        <div className="text-center">
          <button type="button" onClick={onStop} data-testid="capture-feedback-stop"
                  className="grid h-[50px] w-[50px] place-items-center rounded-full" style={{ background: GREEN }}
                  aria-label="Stop recording">
            <span className="block h-[18px] w-[18px] rounded-[3px] bg-white" />
          </button>
          <div className="mt-[6px] text-[11px]" style={{ color: GRAPHITE }}>Stop</div>
        </div>
      </div>

      <button type="button" onClick={onKeep} data-testid="capture-keep-shooting"
              className="mx-auto mt-[9px] flex h-[41px] w-[328px] items-center justify-center rounded-[6px] text-[18px] font-semibold text-white"
              style={{ background: GREEN }}>
        Keep shooting
      </button>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 034 — shot detected                                                     */
/* ======================================================================= */

const CONTEXT: [React.ReactNode, string, string][] = [
  [<ActionGlyph key="a" kind="nodeGraph" height={17} />, "Catch & Shoot", "Off the Dribble"],
  [<ActionGlyph key="b" kind="nodeClimb" height={19} />, "Top of Key", "17.5 ft"],
  [<ActionGlyph key="c" kind="skeletonDots" height={19} />, "Release Height", "7.6 ft"],
  [<ActionGlyph key="d" kind="nodeGraph" height={17} />, "Defender", "4.2 ft Away"],
]

function ShotDetected({
  index, onConfirm, onMiss, onDiscard,
}: {
  index: number
  onConfirm: () => void; onMiss: () => void; onDiscard: () => void
}) {
  return (
    <PhoneScreen testid="screen-ios-shot-detected" pad={17} headerH={34} tab="home">
      <CaptureIdentity cap={25.3} className="pt-[13px]" />

      <div className="shotiq-microcaps mt-[16px] flex items-center gap-[8px] text-[9.5px]" style={{ color: GRAPHITE }}>
        ANALYSIS <Chevron h={9} /> <span style={{ color: INK }}>SHOT DETECTED</span>
      </div>

      <div className="mt-[8px] rounded-[6px] border" style={{ borderColor: RULE }}>
        <div className="flex items-center gap-[16px] px-[10px] pt-[9px]">
          <Head cap={19.4}>SHOT {index}</Head>
          <span className="shotiq-display flex h-[19px] items-center rounded-[4px] border px-[9px] text-[17px] leading-[17px]"
                style={{ borderColor: ORANGE, color: ORANGE }}>SHOT DETECTED</span>
        </div>
        <div className="mt-[9px] flex items-center px-[10px]">
          <span className="mr-[9px]"><StopwatchGlyph size={22} /></span>
          <div className="min-w-0">
            <div className="text-[14px] font-semibold leading-[16px]">8:24:10 AM</div>
            <div className="mt-[2px] text-[11px] leading-[12px]" style={{ color: GRAPHITE }}>Today</div>
          </div>
          <span aria-hidden="true" className="mx-[19px] h-[25px] w-px" style={{ background: RULE }} />
          <span className="mr-[9px]"><PulseGlyph size={25} /></span>
          <div className="min-w-0">
            <div className="text-[15px] font-semibold leading-[17px]">97%</div>
            <div className="shotiq-microcaps mt-[2px] text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>CONFIDENCE</div>
          </div>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`${IMG}/ios-034-frame.jpg`} alt="Detected shot, release phase" width={344} height={225}
             className="mx-auto mt-[8px] block h-[225px] w-[344px] rounded-[4px] object-cover" />

        <PhaseStrip active="RELEASE" figure={29} label={9} className="mx-[10px] mt-[10px]" />

        <div className="mt-[11px] h-px" style={{ background: RULE }} />
        <div className="flex">
          <div className="w-[183px] shrink-0 px-[11px] py-[8px]">
            <div className="shotiq-microcaps whitespace-nowrap" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >FORM SCORE</div>
            <div className="mt-[5px] flex items-start gap-[10px]">
              <span className="shotiq-numeric text-[42px] leading-[42px]" style={{ color: ORANGE }}>82</span>
              <div className="flex-1 pt-[10px]">
                <div className="h-[5px] w-full rounded-full" style={{ background: RULE }}>
                  <div className="h-full rounded-full" style={{ width: "82%", background: ORANGE }} />
                </div>
                <div className="shotiq-display mt-[7px] text-[13px] leading-[13px]" style={{ color: BLUE }}>GOOD</div>
                <div className="mt-[5px] whitespace-nowrap text-[10px] leading-[11px]" style={{ color: GRAPHITE }}>Keep building consistency.</div>
              </div>
            </div>
          </div>
          <span aria-hidden="true" className="w-px self-stretch" style={{ background: RULE }} />
          <div className="flex min-w-0 flex-1 items-start px-[11px] py-[8px]">
            <div className="min-w-0 flex-1">
              <div className="shotiq-microcaps" style={{ "--shotiq-microcaps-size": "9px", color: GRAPHITE } as React.CSSProperties} >PRIMARY COACHING TARGET</div>
              <div className="mt-[7px] text-[15px] font-semibold leading-[18px]">{TARGET}</div>
            </div>
            <span className="mt-[22px] pl-[6px]"><Chevron h={13} /></span>
          </div>
        </div>
      </div>

      <Head cap={13.5} className="mt-[11px]">CONFIRM THIS RESULT</Head>
      <p className="mt-[6px] text-[12px] leading-[13px]" style={{ color: GRAPHITE }}>Was this a shot attempt?</p>

      <div className="mt-[10px] flex gap-[12px]">
        <button type="button" onClick={onConfirm} data-testid="capture-confirm-make"
                className="flex h-[52px] flex-1 flex-col items-center justify-center gap-[6px] rounded-[6px] text-white"
                style={{ background: GREEN }}>
          <ActionGlyph kind="nodeGraph" height={16} accent="#fff" />
          <span className="shotiq-display text-[13px] leading-[13px] tracking-[0.04em]">CONFIRM MAKE</span>
        </button>
        <button type="button" onClick={onMiss} data-testid="capture-mark-miss"
                className="flex h-[52px] flex-1 flex-col items-center justify-center gap-[6px] rounded-[6px] border"
                style={{ borderColor: RULE }}>
          <ActionGlyph kind="nodeGraph" height={16} />
          <span className="shotiq-display text-[13px] leading-[13px] tracking-[0.04em]" style={{ color: GRAPHITE }}>MARK MISS</span>
        </button>
        <button type="button" onClick={onDiscard}
                className="flex h-[52px] flex-1 flex-col items-center justify-center gap-[6px] rounded-[6px] border"
                style={{ borderColor: RULE }}>
          <ActionGlyph kind="analyze" height={17} />
          <span className="shotiq-display text-[13px] leading-[13px] tracking-[0.04em]" style={{ color: GRAPHITE }}>NOT A SHOT</span>
        </button>
      </div>

      <div className="mt-[11px] flex items-center gap-[9px]">
        <Head cap={11.5} tone={GRAPHITE}>SHOT CONTEXT</Head>
        <span className="h-px flex-1" style={{ background: RULE }} />
      </div>
      <div className="mt-[10px] flex">
        {CONTEXT.map(([glyph, a, b], i) => (
          <React.Fragment key={a}>
            {i > 0 && <span aria-hidden="true" className="w-px self-stretch" style={{ background: RULE }} />}
            <div className="flex flex-1 items-center gap-[5px] px-[4px]">
              <span className="shrink-0">{glyph}</span>
              <div className="min-w-0">
                <div className="whitespace-nowrap text-[10px] leading-[12px]">{a}</div>
                <div className="whitespace-nowrap text-[10px] leading-[12px]" style={{ color: GRAPHITE }}>{b}</div>
              </div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* 035 — capture review                                                    */
/* ======================================================================= */

const FLAGGED: [string, string, string, string, string, number][] = [
  ["ios-035-thumb-1", "SHOT 7", "Today • 8:05 AM", "Release", "00:03", 58],
  ["ios-035-thumb-2", "SHOT 12", "Today • 8:09 AM", "Elbow angle", "00:05", 61],
  ["ios-035-thumb-3", "SHOT 19", "Today • 8:16 AM", "Release timing", "00:06", 64],
]
const CLIP_LEN = ["0:03", "0:05", "0:11"]

function Review({ onAnalyze, onDiscard, onBack }: { onAnalyze: () => void; onDiscard: () => void; onBack: () => void }) {
  const [filter, setFilter] = React.useState("needs")
  return (
    <PhoneScreen testid="screen-ios-capture-review" pad={24} headerH={43} tab="capture">
      <button type="button" onClick={onBack} className="mt-[11px] flex items-center gap-[8px] text-[12px]">
        <BackArrow w={14} /> Back to session summary
      </button>

      <div className="mt-[11px] flex items-start justify-between">
        <Head cap={31.3}>CAPTURE REVIEW</Head>
        <span className="flex shrink-0 items-center gap-[8px] rounded-[5px] border px-[9px] py-[6px]"
              style={{ borderColor: RULE, background: "var(--shotiq-color-warmCanvas)" }}>
          <StreakGlyph size={34} />
          <span className="text-center">
            <span className="shotiq-numeric block text-[19px] leading-[19px]">24</span>
            <span className="shotiq-microcaps block text-[8.5px] leading-[10px]" style={{ color: GRAPHITE }}>SHOTS</span>
          </span>
        </span>
      </div>
      <p className="mt-[4px] text-[12.5px] leading-[15px]" style={{ color: GRAPHITE }}>
        We flagged 3 shots for review.
        <br />Confirm, correct, or discard each shot.
      </p>

      <div className="mt-[13px] flex">
        {[["15", "MAKES", INK], ["62.5%", "MAKE %", INK], ["3", "NEED REVIEW", ORANGE],
          ["6", "DISCARDED", INK], ["00:20:04", "PRACTICE TIME", INK]].map(([v, l, c], i) => (
          <React.Fragment key={l}>
            {i > 0 && <span aria-hidden="true" className="w-px self-stretch" style={{ background: RULE }} />}
            <div className="flex-1 px-[2px] text-center">
              <div className="shotiq-numeric text-[20px] leading-[20px]" style={{ color: c }}>{v}</div>
              <div className="shotiq-microcaps mt-[7px] whitespace-nowrap text-[7.6px] leading-[9px]" style={{ color: GRAPHITE }}>{l}</div>
            </div>
          </React.Fragment>
        ))}
      </div>

      <div className="mt-[10px] flex gap-[10px]">
        {[["all", "All (24)"], ["needs", "Needs review (3)"], ["confirmed", "Confirmed (15)"], ["discarded", "Discarded (6)"]].map(([k, l]) => (
          <button key={k} type="button" onClick={() => setFilter(k)} aria-pressed={filter === k}
                  className="flex h-[29px] flex-1 items-center justify-center whitespace-nowrap rounded-[5px] border px-[4px] text-[11.5px]"
                  style={filter === k ? { borderColor: ORANGE, color: ORANGE } : { borderColor: RULE }}>
            {l}
          </button>
        ))}
      </div>

      <div className="mt-[10px] h-px" style={{ background: RULE }} />
      <div className="mt-[10px] flex items-center justify-between">
        <Head cap={13.8}>NEEDS REVIEW (3)</Head>
        <span className="flex items-center gap-[7px] text-[11.5px]" style={{ color: GRAPHITE }}>
          Review lowest confidence first
          <svg width="9" height="14" viewBox="0 0 9 14" aria-hidden="true">
            <path d="M4.5 1 1 5h7zM4.5 13 1 9h7z" fill={INK} />
          </svg>
        </span>
      </div>

      {FLAGGED.map(([thumb, title, when, flaw, dur, conf], i) => (
        <div key={title} className="mt-[7px] flex h-[123px] overflow-hidden rounded-[6px] border" style={{ borderColor: RULE }}>
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${IMG}/${thumb}.jpg`} alt="" width={145} height={123}
                 className="block h-[121px] w-[145px] object-cover" />
            <span className="absolute bottom-[7px] left-[7px] rounded-[3px] px-[6px] py-[2px] text-[10px] text-white"
                  style={{ background: "rgba(16,17,19,.85)" }}>{CLIP_LEN[i]}</span>
          </div>
          <div className="flex min-w-0 flex-1 items-start px-[10px] py-[8px]">
            <div className="min-w-0 flex-1">
              <Head cap={14}>{title}</Head>
              <div className="mt-[5px] text-[10.5px] leading-[12px]" style={{ color: GRAPHITE }}>{when}</div>
              <div className="mt-[5px] flex items-center gap-[7px] whitespace-nowrap text-[10.5px] leading-[13px]"><PoseGlyph phase="release" size={14} /> {flaw}</div>
              <div className="mt-[4px] flex items-center gap-[7px] whitespace-nowrap text-[10.5px] leading-[13px]"><PulseGlyph size={14} /> Low confidence</div>
              <div className="mt-[4px] flex items-center gap-[7px] whitespace-nowrap text-[10.5px] leading-[13px]"><ActionGlyph kind="uploadVideo" height={10} /> {dur}</div>
            </div>
            <div className="w-[74px] shrink-0 text-center">
              <span className="relative block">
                <ConfidenceArc value={conf} size={54} />
                <span className="shotiq-numeric absolute inset-x-0 bottom-[1px] text-[19px] leading-[19px]">{conf}</span>
              </span>
              <div className="shotiq-microcaps mt-[2px] text-[8.5px]" style={{ color: GRAPHITE }}>CONFIDENCE</div>
              <span className="mt-[7px] flex h-[24px] items-center justify-center rounded-[4px] border text-[11.5px]"
                    style={{ borderColor: ORANGE, color: ORANGE }}>Review</span>
            </div>
          </div>
        </div>
      ))}

      <button type="button" onClick={onDiscard}
              className="mt-[10px] flex h-[28px] w-full items-center justify-center gap-[10px] rounded-[5px] border text-[13px]"
              style={{ borderColor: RULE }}>
        <TrashGlyph size={17} /> Discard session
      </button>
      <button type="button" onClick={onAnalyze} data-testid="capture-analyze-session"
              className="mt-[6px] flex h-[30px] w-full items-center justify-center gap-[11px] rounded-[5px] text-[15px] font-semibold text-white"
              style={{ background: ORANGE }}>
        <ActionGlyph kind="analyze" height={17} accent="#fff" /> Analyze session
      </button>
    </PhoneScreen>
  )
}

/* ======================================================================= */
/* the flow                                                                */
/* ======================================================================= */

const PRIMED_KEY = "shotiq_camera_primed"

export function LiveCapture({ initial = "setup" }: { initial?: CaptureState }) {
  const phone = usePhoneViewport()
  const router = useRouter()
  const [state, setState] = React.useState<CaptureState>(initial)
  const [hand, setHand] = React.useState<"LEFT" | "RIGHT">("RIGHT")
  const [facing, setFacing] = React.useState<"user" | "environment">("environment")
  const [stream, setStream] = React.useState<MediaStream | null>(null)
  /* 03:18 is the session time canonical 032 draws. The clock advances once the
     take actually starts; a deep-linked state is a still of the take, not a new
     one, so it holds at the canonical reading rather than drifting. */
  const [seconds, setSeconds] = React.useState(198)
  const [running, setRunning] = React.useState(false)
  const [paused, setPaused] = React.useState(false)
  const [muted, setMuted] = React.useState(false)
  const [shots, setShots] = React.useState(24)
  const [makes, setMakes] = React.useState(15)

  React.useEffect(() => setState(initial), [initial])

  /* The stream is opened only when the player asks for it. Deep-linking a state
     never opens it, so a headless capture shows the canonical framing still
     instead of the fake-device test pattern. */
  const openCamera = React.useCallback(async (face = facing) => {
    try {
      stream?.getTracks().forEach((t) => t.stop())
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face }, audio: false })
      setStream(s)
    } catch {
      setStream(null)
    }
  }, [facing, stream])

  React.useEffect(() => () => { stream?.getTracks().forEach((t) => t.stop()) }, [stream])

  React.useEffect(() => {
    if (state !== "recording" || paused || !running) return
    const id = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(id)
  }, [state, paused, running])

  const primed = () => {
    try { return window.localStorage.getItem(PRIMED_KEY) === "1" } catch { return false }
  }
  const markPrimed = () => {
    try { window.localStorage.setItem(PRIMED_KEY, "1") } catch { /* private mode */ }
  }

  /* Marking a shot keeps the shared /api/shot-events contract the desktop
     capture screen already uses. */
  const logShot = React.useCallback((made: boolean) => {
    setShots((n) => n + 1)
    if (made) setMakes((n) => n + 1)
    void fetch("/api/shot-events", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drillId: "live-capture", result: made ? "make" : "miss", at: new Date().toISOString() }),
    }).catch(() => {})
  }, [])

  if (!phone) return null

  switch (state) {
    case "primer":
      return <Primer onContinue={() => { markPrimed(); void openCamera(); setState("calibrate") }}
                     onSkip={() => setState("setup")} />
    case "calibrate":
      return <Calibrate stream={stream} onStart={() => void openCamera()}
                        onSwitch={() => { const f = facing === "user" ? "environment" : "user"; setFacing(f); void openCamera(f) }}
                        onSkip={() => setState("readiness")} onConfirm={() => setState("readiness")} />
    case "readiness":
      return <Readiness stream={stream} onStart={() => void openCamera()}
                        onKeep={() => setState("ready")} onCancel={() => setState("setup")}
                        onHelp={() => setState("primer")} />
    case "ready":
      return <Ready stream={stream} onStart={() => void openCamera()}
                    onRecord={() => { setSeconds(0); setRunning(true); setState("recording") }}
                    onAdjust={() => setState("setup")} onCancel={() => setState("setup")} />
    case "recording":
      return <Recording stream={stream} onStart={() => void openCamera()}
                        seconds={seconds} shots={shots} makes={makes} paused={paused}
                        onPause={() => setPaused((p) => !p)} onStop={() => setState("review")}
                        onCue={() => setState("feedback")} />
    case "feedback":
      return <Feedback stream={stream} onStart={() => void openCamera()} muted={muted}
                       onMute={() => setMuted((m) => !m)}
                       onKeep={() => setState("recording")} onStop={() => setState("review")}
                       onShot={() => setState("shot")} />
    case "shot":
      return <ShotDetected index={shots - 12}
                           onConfirm={() => { logShot(true); setState("recording") }}
                           onMiss={() => { logShot(false); setState("recording") }}
                           onDiscard={() => setState("recording")} />
    case "review":
      return <Review onAnalyze={() => router.push("/video-analysis/processing")}
                     onDiscard={() => setState("setup")} onBack={() => setState("setup")} />
    default:
      return <Setup hand={hand} onHand={setHand} stream={stream}
                    onUpload={() => router.push("/video-analysis/upload")}
                    onStart={() => setState(primed() ? "calibrate" : "primer")} />
  }
}
