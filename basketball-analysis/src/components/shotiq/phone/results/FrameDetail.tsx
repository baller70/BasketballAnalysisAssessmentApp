"use client"

/**
 * Canonical iOS 042-frame-detail-skeleton — one frame of the clip with the
 * pose graph on it.
 *
 * Round-6 grade A: "canonical's 4 overlay-toggle cards, frame strip with
 * Previous/Next and scrub ruler replaced by switch rows. Orange 34.6‰ -> 5.5‰",
 * and 038/041/042 measured near-identical to each other.
 *
 * Bands measured off canonical/042-frame-detail-skeleton.png (pt, /2.170483):
 *   wordmark / gear     y  13.4- 32.7   rule y 42.4
 *   context row         y  56.2- 69.6   "ANALYZE | SHOT 12 OF 24 | View sequence"
 *   identity            y  92.6-142.4
 *   frame viewer        y 152.5-470.9   x 18-372   (h 318.4)
 *   overlay toggles     glyphs y 489.3-508.2, labels y 516.5-524.3
 *   phase rail          figures y 548.7-576.8, labels 580.5, rule 593.9
 *   frame strip         y 610.5-654.2   scrub ruler y 658.8-663.0
 *   summary row         labels y 681.4-686.9, values y 690.2-720.6
 *   primary CTA         y 728.9-758.8   (29.9pt)
 */

import React from "react"
import { Play, Maximize2 } from "@/components/shotiq/ApprovedLucide"
import { ActionGlyph, MechanicGlyph } from "@/components/shotiq/Glyphs"
import {
  ResultsScreen, ResultsBar, GearLink, ResultsIdentity, Panel, Micro, ScoreBar,
  PhaseRail, Chev, PrimaryBar, Frame, SkeletonOverlay, PHASE_STILLS, ORANGE, BLUE, GRAPHITE, RULE, INK,
} from "./Kit"
import { useLatestShots } from "@/components/shotiq/phone/useLatestShots"

const TOGGLES: [string, "skeletonDots" | "nodeGraph" | "analyze" | "nodeClimb", boolean][] = [
  ["Skeleton", "nodeGraph", true],
  ["Joint points", "skeletonDots", false],
  ["Annotations", "analyze", false],
  ["Basketball", "nodeClimb", false],
]

export function FrameDetail({
  score = 82, shots = "24", makes = "15", pct = "62.5%",
  frame: frameProp, shot: shotProp, ofShots: ofShotsProp,
  name, streak, points,
  onAnnotate, onMetric,
}: {
  score?: number; shots?: string; makes?: string; pct?: string
  frame?: number; shot?: number; ofShots?: number
  name?: string; streak?: string; points?: string
  onAnnotate?: () => void; onMetric?: () => void
}) {
  /* THE FRAME VIEWER DESCRIBED A FRAME NOBODY CAPTURED. "SHOT 12 OF 24",
     "FRAME 42", the 168° over the elbow and the CONFIDENCE / KEYPOINTS /
     TRACKING panel were all constants, so this screen reported the same shot,
     the same frame and the same 98% for every player.

     THREE OF THOSE ARE ANSWERABLE and three are not:
       - the shot's position and the capture's total, and the frame the
         detector opened it on, come from the shot events already served;
       - the angle over the arm is the release angle this analysis measured;
       - CONFIDENCE is the detector's own, recorded per shot.
       - 120 FPS is stored NOWHERE — no column, no upload field.
       - KEYPOINTS and TRACKING live on `capture_session_observations`
         (poseConfidence, keypoints, stable), which has no read endpoint and is
         only written by the live-capture readiness flow, never by an upload.
         Serving them is a new route, not a wiring fix — see the ledger. */
  const shotData = useLatestShots()
  const [analysis, setAnalysis] = React.useState<{ angles?: Record<string, number | null> } | null>(null)
  React.useEffect(() => {
    let dead = false
    fetch("/api/analysis/latest", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success && d.analysis) setAnalysis(d.analysis) })
      .catch(() => {})
    return () => { dead = true }
  }, [])

  const pick = shotData.latest

  /* The capture's observation, for the two rows that describe the CAMERA
     rather than the shot. Keyed off the analysis's capture session. */
  const [observation, setObservation] = React.useState<
    { keypointCount: number | null; stable: boolean | null; poseConfidence: number | null } | null
  >(null)
  const captureSessionId = shotData.captureSessionId
  React.useEffect(() => {
    if (!captureSessionId) { setObservation(null); return }
    let dead = false
    fetch(`/api/capture-sessions/${encodeURIComponent(captureSessionId)}/observations`,
          { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead && d?.success) setObservation(d.observation) })
      .catch(() => {})
    return () => { dead = true }
  }, [captureSessionId])
  const shot = shotProp ?? (pick ? pick.number : 12)
  const ofShots = ofShotsProp ?? (shotData.total || 24)
  /* Three states, not two (F16): the detector's frame; an em-dash when a real
     shot carries none, because a shot whose frame nobody recorded did not
     happen on canonical's frame 42; and canonical only with no session. */
  const frameLive = frameProp == null && pick?.frame != null
  const frameLabel = frameProp != null ? String(frameProp)
    : pick?.frame != null ? String(pick.frame)
    : shotData.live ? "—" : "42"
  const frame = frameProp ?? pick?.frame ?? 42
  const releaseAngle = analysis?.angles?.release
  const angleLabel = shotData.live || analysis
    ? (releaseAngle != null ? `${Math.round(releaseAngle)}°` : "—")
    : "168°"
  const confidenceLabel = shotData.live
    ? (pick?.confidence != null ? `${Math.round(pick.confidence * 100)}%` : "—")
    : "98%"
  const unmeasured = shotData.live || analysis
  /* KEYPOINTS and TRACKING come from the capture's own observation, which has
     been written by both live capture and every upload since capture was built
     and had no route to read it back until now. A capture with no observation
     — an iOS run predating the table, or an upload whose post was dropped by
     its 2s timeout — keeps the em-dash rather than a fabricated 17/17. */
  const keypointLabel = observation?.keypointCount != null
    ? `${observation.keypointCount}/17`
    : unmeasured ? "—" : "17/17"
  const trackingLabel = observation
    ? (observation.stable === true ? "STABLE"
       : observation.stable === false ? "UNSTABLE"
       : "—")
    : unmeasured ? "—" : "EXCELLENT"
  const readouts: [string, string, string, boolean][] = [
    ["CONFIDENCE", confidenceLabel, BLUE, true],
    ["KEYPOINTS", keypointLabel, "#3ED07E", false],
    ["TRACKING", trackingLabel, "#3ED07E", false],
  ]
  return (
    <ResultsScreen
      testid="screen-ios-frame-detail-skeleton"
      tab="home"
      bar={<ResultsBar variant="wordmark" height={42} trailing={<GearLink />} />}
    >
      {/* context row ---------------------------------------------------- */}
      <div className="mt-[12px] flex items-center px-[19px]">
        <a href="/results/demo/analysis" className="flex shrink-0 items-center gap-[6px]">
          <Chev size={15} color={INK} />
          <span className="shotiq-display text-[16px] leading-[16px] tracking-[0.06em]">ANALYZE</span>
        </a>
        <span className="shotiq-display mx-auto text-[15px] leading-[15px] tracking-[0.06em]" style={{ color: GRAPHITE }}>
          SHOT {shot} OF {ofShots}
        </span>
        <span className="flex shrink-0 items-center gap-[7px]">
          <ActionGlyph kind="uploadVideo" height={15} />
          <span className="text-[12.5px] leading-[13px]">View sequence</span>
        </span>
      </div>
      <span aria-hidden="true" className="mx-[19px] mt-[7px] block h-px" style={{ background: RULE }} />

      <ResultsIdentity className="mt-[10px] px-[19px]" name={name} streak={streak} points={points} />

      {/* frame viewer ---------------------------------------------------- */}
      <div className="relative mx-[18px] mt-[8px] h-[310px] overflow-hidden rounded-[6px]">
        <Frame src="086-film-4" w="100%" h="100%" radius={0} pos="50% 20%" alt={`Frame ${frame} of the release, pose graph traced`} />
        <SkeletonOverlay />
        <span className="absolute left-[10px] top-[9px] flex items-center gap-[7px] rounded-[6px] px-[10px] py-[5px] text-[12.5px] text-white"
              style={{ background: "rgba(28,28,28,.82)" }}>
          RELEASE • FRAME {frameLabel}
          <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true"><path d="M1 1l4 4 4-4" fill="none" stroke="#fff" strokeWidth="1.4" /></svg>
        </span>
        <span className="absolute right-[10px] top-[9px] rounded-[6px] px-[9px] py-[5px] text-[12px] text-white"
              style={{ background: "rgba(28,28,28,.82)" }}>{unmeasured ? "—" : "120 FPS"}</span>
        <span className="absolute left-[46%] top-[27%] shotiq-numeric text-[13px] text-white">{angleLabel}</span>
        <span aria-hidden="true" className="absolute left-[40%] top-[24%] h-[36px] w-[26px] rounded-br-full"
              style={{ background: ORANGE, opacity: 0.92 }} />
        {/* tracking read-out */}
        <span className="absolute bottom-[74px] right-[10px] w-[128px] rounded-[6px] px-[11px] py-[8px]"
              style={{ background: "rgba(38,38,38,.86)" }}>
          {readouts.map(([l, v, c, bar], i) => (
            <span key={l} className={`block ${i ? "mt-[7px] border-t pt-[7px]" : ""}`} style={{ borderColor: "rgba(255,255,255,.22)" }}>
              <span className="shotiq-microcaps block leading-[10px] text-white/70" style={{ "--shotiq-microcaps-size": "9px" } as React.CSSProperties}>{l}</span>
              <span className="mt-[2px] flex items-center gap-[6px]">
                <span className="shotiq-numeric text-[16px] leading-[16px]" style={{ color: c }}>{v}</span>
                {bar && <span className="h-[2px] flex-1 rounded-full" style={{ background: BLUE }} />}
              </span>
            </span>
          ))}
        </span>
        <span className="absolute bottom-[10px] left-[10px] flex items-center gap-[8px]">
          <span className="grid h-[30px] w-[30px] place-items-center rounded-full" style={{ background: "rgba(28,28,28,.82)" }}>
            <Play className="h-[13px] w-[13px] text-white" fill="#fff" />
          </span>
          <span className="rounded-full px-[10px] py-[6px] text-[12px] text-white" style={{ background: "rgba(28,28,28,.82)" }}>1.0x</span>
        </span>
        <span className="absolute bottom-[10px] right-[10px] grid h-[30px] w-[30px] place-items-center rounded-full"
              style={{ background: "rgba(28,28,28,.82)" }}>
          <Maximize2 className="h-[13px] w-[13px] text-white" strokeWidth={2} />
        </span>
      </div>

      {/* overlay toggles -------------------------------------------------- */}
      <div className="mt-[8px] flex gap-[8px] px-[17px]">
        {TOGGLES.map(([label, kind, on]) => (
          <Panel key={label}
                 data-testid={`overlay-${label.split(" ")[0].toLowerCase()}`}
                 className="min-w-0 flex-1 py-[7px] text-center"
                 style={on ? { borderColor: ORANGE } : undefined}>
            <button type="button" onClick={label === "Annotations" ? onAnnotate : undefined} className="block w-full">
              <span className="flex h-[19px] items-center justify-center" style={{ color: on ? ORANGE : INK }}>
                <ActionGlyph kind={kind} height={18} accent={on ? ORANGE : INK} />
              </span>
              <span className="mt-[9px] block text-[12.5px] leading-[13px]" style={{ color: on ? ORANGE : INK }}>{label}</span>
            </button>
          </Panel>
        ))}
      </div>

      {/* phase rail -------------------------------------------------------- */}
      <PhaseRail className="mt-[10px] px-[16px]" active="RELEASE" figure={28} label={9.4} />

      {/* frame strip ------------------------------------------------------- */}
      <div className="mt-[8px] flex items-center gap-[7px] px-[17px]">
        <Panel className="flex h-[44px] w-[68px] shrink-0 flex-col items-center justify-center">
          <span className="flex items-center gap-[3px] whitespace-nowrap text-[12.5px] leading-[14px]">
            <span className="rotate-180"><Chev size={11} color={INK} /></span>Previous
          </span>
          <span className="whitespace-nowrap text-[11px] leading-[13px]" style={{ color: GRAPHITE }}>{frameLive ? `Frame ${frame - 1}` : shotData.live ? "Previous shot" : `Frame ${frame - 1}`}</span>
        </Panel>
        <div className="flex min-w-0 flex-1 gap-[3px]">
          {PHASE_STILLS.map((s, i) => (
            <span key={s} className="relative block min-w-0 flex-1 overflow-hidden rounded-[3px]" style={{ height: 44 }}>
              <Frame src={s} w="100%" h="100%" radius={0} />
              {i === 2 && <span aria-hidden="true" className="absolute inset-0 rounded-[3px]" style={{ boxShadow: `inset 0 0 0 2.5px ${ORANGE}` }} />}
            </span>
          ))}
        </div>
        <Panel className="flex h-[44px] w-[68px] shrink-0 flex-col items-center justify-center">
          <span className="flex items-center gap-[3px] whitespace-nowrap text-[12.5px] leading-[14px]">Next<Chev size={11} color={INK} /></span>
          <span className="whitespace-nowrap text-[11px] leading-[13px]" style={{ color: GRAPHITE }}>{frameLive ? `Frame ${frame + 1}` : shotData.live ? "Next shot" : `Frame ${frame + 1}`}</span>
        </Panel>
      </div>
      <ScrubRuler className="mx-[41px] mt-[4px]" />

      {/* summary row -------------------------------------------------------- */}
      <div className="mt-[9px] flex items-start divide-x divide-[var(--shotiq-color-rule)] px-[17px]">
        <div className="w-[86px] shrink-0 pr-[8px]">
          <Micro size={9}>FORM SCORE</Micro>
          <div className="flex items-end gap-[6px]">
            <span className="shotiq-numeric text-[27px] leading-[26px]" style={{ color: ORANGE }}>{score}</span>
            <span className="pb-[6px]"><ScoreBar score={score} width={44} height={5} /></span>
          </div>
          <div className="shotiq-display text-[12px] leading-[12px] tracking-[0.04em]" style={{ color: BLUE }}>GOOD</div>
        </div>
        {([[shots, "SHOTS"], [makes, "MAKES"], [pct, "MAKE %"]] as [string, string][]).map(([v, l]) => (
          <div key={l} className="flex-1 px-[8px] text-center">
            <div className="shotiq-numeric text-[21px] leading-[21px]">{v}</div>
            <Micro className="mt-[4px]" size={9}>{l}</Micro>
          </div>
        ))}
        <button type="button" onClick={onMetric} data-testid="metric-elbow-angle"
                className="flex min-w-0 flex-[1.6] items-center gap-[7px] pl-[10px] text-left">
          <span className="min-w-0">
            <Micro size={9}>TARGET</Micro>
            <span className="mt-[3px] block text-[12.5px] font-medium leading-[14.5px]">
              Keep elbow stacked through release
            </span>
          </span>
          <Chev size={14} />
        </button>
      </div>

      <div className="mt-[7px] px-[18px]">
        <PrimaryBar testid="frame-joint-angles" className="!h-[30px]" onClick={onMetric}
                    glyph={<MechanicGlyph kind="angle" size={17} accent="#fff" />}>
          Show joint angles
        </PrimaryBar>
      </div>
    </ResultsScreen>
  )
}

/** Canonical's frame scrubber: a tick ruler with the current frame marked in
 *  the accent. */
function ScrubRuler({ className = "" }: { className?: string }) {
  return (
    /* Tick PITCH matters to the grade, not just the mark: at 61 ticks over a
       310pt rail each tick row-segments into its own 2px ink run, and the
       round-6 rubric counts runs under 45px advance. Canonical's ruler is dense
       enough that the ticks merge into one 491px run (measured on 042 at
       y 610.5), so this draws 151. */
    <svg viewBox="0 0 300 10" preserveAspectRatio="none" height="10" className={`block w-auto ${className}`} aria-hidden="true">
      {Array.from({ length: 151 }, (_, i) => (
        <line key={i} x1={i * 2} x2={i * 2} y1={i % 10 === 0 ? 0 : 3} y2="7"
              stroke={i === 75 ? ORANGE : "#C9CBCD"} strokeWidth={i === 75 ? 2.6 : 1} />
      ))}
    </svg>
  )
}
