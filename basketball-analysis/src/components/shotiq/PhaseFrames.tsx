"use client"

/**
 * PHASE FRAMES — the captured stills behind the five phase cards.
 *
 * THE FEATURE THAT WAS ADVERTISED BUT NOT DELIVERED. Every results screen in
 * this app draws the same five-card strip — SETUP · LOAD · RISE · RELEASE ·
 * FOLLOW-THROUGH — and each card was always the canonical `078-phase-*` line
 * figure, i.e. a drawing. Upload a video of your own shot and you still got the
 * drawing: the strip announced that the app had broken your shot into its five
 * moments while showing you nothing of your shot at all.
 *
 * `analyzeVideoShooting` already extracts and pose-analyses every frame of an
 * uploaded clip and now names the frame for all five phases (services/
 * videoAnalysis.ts). Those stills are saved with the session. This module is
 * the last link: it reads them back and puts each one in its card.
 *
 * ADDITIVE BY CONSTRUCTION. `PhaseFrame` renders the canonical `PoseFigure`
 * exactly as before whenever a still is not available — no capture yet, an
 * image (not video) analysis, a shot recorded on the phone, storage cleared.
 * The placeholder look is the floor, never something that got taken away; a
 * real capture only ever replaces a drawing with the player's own frame.
 */

import React from "react"
import { PoseFigure } from "@/components/shotiq/Glyphs"
import { getLatestSessionByMediaType, getSessionById } from "@/services/sessionStorage"

/** Label → data-URL still, keyed by the canonical strip's own spelling. */
export type PhaseFrameMap = Record<string, string>

/**
 * The pipeline labels the last phase `FOLLOW_THROUGH`; the strips print
 * `FOLLOW-THROUGH`. Normalise to the strip's spelling so a lookup by card
 * label resolves whichever convention produced the still.
 */
const normalise = (label: string) => label.trim().toUpperCase().replace(/_/g, "-")

/**
 * Read the phase stills for an analysis out of local session storage.
 *
 * `clientSessionId` is the id the web upload saved the session under and the
 * same id that travels to the server on the analysis row, so a results page
 * holding a server record can find the stills that belong to it. Passing
 * nothing falls back to the most recent video session, which is what the
 * post-upload screen wants.
 *
 * Server-side and during hydration this is `{}` — reading localStorage during
 * render would desync the markup, so the stills arrive in a post-mount effect
 * and the cards start on their canonical figures.
 */
export function usePhaseFrames(
  clientSessionId?: string | null,
  { fallbackToLatest = false }: { fallbackToLatest?: boolean } = {},
): PhaseFrameMap {
  const [frames, setFrames] = React.useState<PhaseFrameMap>({})

  React.useEffect(() => {
    // Falling back to the newest clip is opt-in, and deliberately so: on a page
    // showing ONE analysis it would put another shot's frames on this record —
    // exactly the borrowed-content defect /results/[id] exists to fix. The
    // post-upload screen has no id to match on and does want the newest clip,
    // because that is the one just analysed.
    const session = clientSessionId
      ? getSessionById(clientSessionId)
      : (fallbackToLatest ? getLatestSessionByMediaType("video") : null)
    if (!session?.screenshots?.length) return

    const map: PhaseFrameMap = {}
    for (const shot of session.screenshots) {
      if (!shot?.label || !shot.imageBase64) continue
      // First still wins: the pipeline emits the phases in shot order, so an
      // earlier entry is the earlier moment when a clip somehow yields two.
      map[normalise(shot.label)] ||= shot.imageBase64
    }
    setFrames(map)
  }, [clientSessionId, fallbackToLatest])

  return frames
}

/**
 * One phase card's imagery: the captured still when this shot has one, and the
 * canonical figure when it does not.
 *
 * The still is cropped to the same box the figure occupies so swapping one for
 * the other cannot move the label beneath it or change the strip's height.
 */
export function PhaseFrame({
  phase, frames, active = false, height = 41, tone = "light", className = "",
}: {
  phase: string
  frames: PhaseFrameMap
  active?: boolean
  height?: number
  tone?: "light" | "dark" | "elite"
  className?: string
}) {
  const still = frames[normalise(phase)]
  if (!still) {
    return <PoseFigure phase={phase} active={active} tone={tone} height={height} className={className} />
  }
  return (
    <span
      className={`relative block overflow-hidden rounded-[3px] bg-[var(--shotiq-color-rule)] ${className}`}
      style={{ height, width: Math.round(height * 0.72) }}
      data-testid={`phase-frame-${normalise(phase).toLowerCase()}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={still}
        alt={`${phase} frame from your shot`}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[3px] border-[1.5px] border-[var(--shotiq-color-shotiqOrange)]"
        />
      )}
    </span>
  )
}
