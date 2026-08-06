/**
 * What a shot event ACTUALLY says, once human review is applied.
 *
 * `ShotEventCorrection` is append-only review and it wins over the detector: a
 * `false_shot` correction drops the attempt entirely, a `make_miss` correction
 * replaces `detectedResult`. `/api/analysis-history` has resolved shots this
 * way since the counts were wired; the shot-context panel needs the same answer
 * for a single shot, and a second hand-rolled copy of these rules is exactly
 * how two screens end up disagreeing about whether a shot went in.
 *
 * Corrections are applied in creation order, so the LAST one wins — a reviewer
 * who marks a shot a make, then a miss, meant miss.
 */

export interface ShotCorrectionLike {
  kind: string
  value: unknown
}

export interface ShotEventLike {
  detected?: boolean | null
  detectedResult?: string | null
  corrections?: ShotCorrectionLike[] | null
}

export interface ResolvedShot {
  /** True when review says this was never a shot; it counts toward nothing. */
  dropped: boolean
  /** `make` / `miss`, or null when nobody has said which. */
  result: "make" | "miss" | null
}

export function resolveShot(event: ShotEventLike): ResolvedShot {
  let dropped = event.detected === false
  let result: "make" | "miss" | null =
    event.detectedResult === "make" || event.detectedResult === "miss"
      ? event.detectedResult
      : null

  for (const correction of event.corrections ?? []) {
    if (correction.kind === "false_shot") {
      // The value carries the reviewer's verdict; an explicit `false` means
      // "no, this WAS a real shot" and un-drops it.
      dropped = correction.value !== false
    } else if (
      correction.kind === "make_miss"
      && (correction.value === "make" || correction.value === "miss")
    ) {
      result = correction.value
    }
  }

  return { dropped, result }
}

/** Attempts and makes across a set of events, review applied. */
export function tallyShots(events: ShotEventLike[]): { shots: number; makes: number } {
  let shots = 0, makes = 0
  for (const event of events) {
    const { dropped, result } = resolveShot(event)
    if (dropped) continue
    shots += 1
    if (result === "make") makes += 1
  }
  return { shots, makes }
}

/**
 * `26:12` — where a shot sits inside its capture, from the event's offset.
 *
 * Returns null rather than `0:00` when the detector recorded no offset: a shot
 * whose position nobody timed is not a shot that happened at the very start.
 */
export function formatWorkoutClock(timestampMs: number | null | undefined): string | null {
  if (timestampMs == null || !Number.isFinite(timestampMs) || timestampMs < 0) return null
  const total = Math.floor(timestampMs / 1000)
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`
}
