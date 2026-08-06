"use client"

import { useEffect, useState } from "react"
import { useHistory } from "@/components/shotiq/ResultsBits"
import { resolveShot, formatWorkoutClock } from "@/lib/shots/resolveShot"

/**
 * The individual shots behind the player's newest session.
 *
 * THE SHOT BREAKDOWN SCREEN WAS NEVER HANDED A SHOT. `/results/demo/analysis`
 * draws a SHOT CONTEXT panel — shot type, court location, "26:12" in workout,
 * result — and a "Shot 41" header, all four of them constants, because its one
 * caller passes a score and nothing else. There was no per-shot anything on the
 * screen to be wrong about: it described a shot that did not exist.
 *
 * The data was already stored. `ShotEvent` carries `sequence`, `timestampMs`
 * and `detectedResult`, and `/api/shot-events?captureSessionId=` has served
 * them with their corrections all along — it simply had no reader on this
 * screen (rule F1 again: the fourth engine with no caller).
 *
 * WHAT IS STILL NOT ANSWERABLE. Court location is recorded NOWHERE — no
 * column, no detector output, nothing to derive it from. It reads as an
 * em-dash rather than borrowing canonical's "Right Corner", because a made-up
 * corner on a real shot is worse than the constant it replaced. Shot type is a
 * property of the ANALYSIS, not of the individual shot; it is the honest answer
 * to "what kind of shot was this" only because every shot in one capture shares
 * it, and it is labelled at the session level everywhere else in the app.
 */

export interface SessionShot {
  /** 1-based position in the capture, as the header numbers it. */
  number: number
  /** `26:12` — where it sits in the capture, or null if nobody timed it. */
  clock: string | null
  /** `Make` / `Miss`, or null when no one has said which. */
  result: "make" | "miss" | null
  /** The frame the detector opened this shot on, when it recorded one. */
  frame: number | null
  /** The detector's own confidence, 0-1, when it recorded one. */
  confidence: number | null
}

export interface LatestShots {
  shots: SessionShot[]
  /** The capture behind the newest analysis, for callers that need to ask
   *  about the CAMERA rather than the shots — see the observations route. */
  captureSessionId: string | null
  /** How many shots the capture holds, for a "SHOT n OF m" header. */
  total: number
  /** The newest shot of the newest session — what the screen opens on. */
  latest: SessionShot | null
  /** The analysis's shot type, which every shot in one capture shares. */
  style: string | null
  /** True once real shots have been read, as opposed to none existing. */
  live: boolean
}

const EMPTY: LatestShots = { shots: [], total: 0, captureSessionId: null, latest: null, style: null, live: false }

export function useLatestShots(): LatestShots {
  const { items } = useHistory()
  const session = items[0] ?? null
  const captureSessionId = session?.captureSessionId ?? null
  const [shots, setShots] = useState<SessionShot[]>([])

  useEffect(() => {
    if (!captureSessionId) { setShots([]); return }
    let dead = false
    fetch(`/api/shot-events?captureSessionId=${encodeURIComponent(captureSessionId)}&limit=200`,
          { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (dead || !d?.success) return
        const rows = (d.shotEvents ?? []) as Array<{
          sequence?: number | null; timestampMs?: number | null
          startFrame?: number | null; confidence?: number | null
          detected?: boolean | null; detectedResult?: string | null
          corrections?: { kind: string; value: unknown }[] | null
        }>
        /* Dropped events are removed BEFORE numbering, so the shot the player
           is looking at is the Nth shot they actually took — not the Nth row
           the detector happened to write. A false positive that review threw
           out must not push every later shot's number up by one. */
        const kept: SessionShot[] = []
        for (const row of rows) {
          const { dropped, result } = resolveShot(row)
          if (dropped) continue
          kept.push({
            number: kept.length + 1,
            clock: formatWorkoutClock(row.timestampMs),
            result,
            frame: row.startFrame ?? null,
            confidence: typeof row.confidence === "number" ? row.confidence : null,
          })
        }
        setShots(kept)
      })
      .catch(() => {})
    return () => { dead = true }
  }, [captureSessionId])

  if (!shots.length) return { ...EMPTY, captureSessionId, style: session?.style ?? null }
  return {
    shots,
    total: shots.length,
    captureSessionId,
    latest: shots[shots.length - 1],
    style: session?.style ?? null,
    live: true,
  }
}
