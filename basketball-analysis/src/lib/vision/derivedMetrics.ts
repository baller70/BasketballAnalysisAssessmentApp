/**
 * The four KEY MEASUREMENTS the app has always displayed and never computed:
 * release height, release distance, vertical jump and centreline deviation.
 *
 * They were six constants on /results/demo/biomechanics ("Release Height 8'10"")
 * printed to every account. Two of the six — elbow and release angle — the pose
 * pipeline already produced. These are the other four, derived from the same
 * keypoints rather than filled in.
 *
 * ------------------------------------------------------------------ THE SCALE
 * Three of the four are LENGTHS, and pixels are not inches. There is no
 * calibrated camera here, so the scale comes from the one real-world length the
 * app already knows: the player's own height, off their profile.
 *
 *     inchesPerPixel = playerHeightInches / pixelHeadToFloor
 *
 * `pixelHeadToFloor` is measured on the SETUP frame, where the player is
 * standing: eyes-to-ankle in pixels, corrected to full stature by the
 * anthropometric ratio below, because MoveNet has no crown-of-head joint and
 * the nose/eyes sit well below it.
 *
 * This is a real estimator with real limits, and every one of them is reported
 * rather than hidden:
 *   - it assumes the player is roughly side-on/front-on and upright in the
 *     setup frame; a crouch reads short and inflates every length
 *   - it assumes a rectilinear lens and ignores perspective, so a player far
 *     from the frame centre reads slightly large
 *   - without a profile height there is NO scale, and the three lengths are
 *     not returned at all. They are never defaulted to an average human.
 * Centreline deviation is an ANGLE and needs no scale, so it survives all of
 * that and is returned whenever the joints are visible.
 */

export interface Keypoint2D {
  name: string
  x: number
  y: number
  score: number
}

/** Joints below this are not trusted to anchor a measurement (pipeline floor). */
export const MIN_METRIC_SCORE = 0.3

/**
 * Eyes-to-ankle as a fraction of full stature.
 *
 * Standing height in classical anthropometry is ~7.5 head-lengths, and the eyes
 * sit ~0.45 head-lengths below the crown, so eye-height ≈ 1 − 0.45/7.5 ≈ 0.94
 * of stature. Using the EYES rather than the nose keeps the landmark stable
 * when the head tilts back through the shot.
 */
export const EYE_HEIGHT_FRACTION = 0.94

const pick = (kps: Keypoint2D[], name: string): Keypoint2D | null => {
  const k = kps.find((p) => p.name === name)
  return k && k.score >= MIN_METRIC_SCORE ? k : null
}

/** Mean of whichever of the two sides is visible; null if neither is. */
function midpoint(kps: Keypoint2D[], left: string, right: string): { x: number; y: number } | null {
  const l = pick(kps, left)
  const r = pick(kps, right)
  if (l && r) return { x: (l.x + r.x) / 2, y: (l.y + r.y) / 2 }
  const one = l ?? r
  return one ? { x: one.x, y: one.y } : null
}

/** The shooting wrist: the higher of the two (smaller y), whichever is visible. */
function shootingWrist(kps: Keypoint2D[]): Keypoint2D | null {
  const l = pick(kps, "left_wrist")
  const r = pick(kps, "right_wrist")
  if (l && r) return l.y < r.y ? l : r
  return l ?? r
}

export interface ScaleEstimate {
  inchesPerPixel: number
  /** Pixels from eye level to the floor on the frame the scale was taken from. */
  pixelEyeToFloor: number
  estimator: string
}

/**
 * Inches per pixel, from the player's stature and their pixel height standing.
 *
 * Returns null — never a guess — when the profile carries no height or the
 * setup frame does not show both an eye and an ankle. A length with no scale
 * behind it is exactly the invented number this module exists to remove.
 */
export function estimateScale(
  setupFrame: Keypoint2D[],
  playerHeightInches: number | null | undefined,
): ScaleEstimate | null {
  if (!playerHeightInches || playerHeightInches <= 0) return null

  const eye = midpoint(setupFrame, "left_eye", "right_eye")
  const ankle = midpoint(setupFrame, "left_ankle", "right_ankle")
  if (!eye || !ankle) return null

  const pixelEyeToFloor = ankle.y - eye.y
  if (pixelEyeToFloor <= 1) return null

  const pixelStature = pixelEyeToFloor / EYE_HEIGHT_FRACTION
  return {
    inchesPerPixel: playerHeightInches / pixelStature,
    pixelEyeToFloor,
    estimator:
      `stature scale: profile height ${playerHeightInches}in over eye-to-ankle ` +
      `${pixelEyeToFloor.toFixed(1)}px corrected by ${EYE_HEIGHT_FRACTION} to full stature`,
  }
}

export interface DerivedMetrics {
  /** Wrist height above the floor at release, inches. */
  releaseHeightInches: number | null
  /** Horizontal wrist offset from the body centreline at release, inches. */
  releaseDistanceInches: number | null
  /** Rise of the hips from setup to the peak frame, inches. */
  verticalJumpInches: number | null
  /** Lean of the release line off vertical, degrees (0 = straight overhead). */
  centerlineDeviationDegrees: number | null
  /** Why anything above is null, keyed by metric — surfaced, never swallowed. */
  unavailable: Record<string, string>
  scale: ScaleEstimate | null
}

/**
 * Compute all four from a release frame, plus a setup frame for the scale and
 * the jump baseline.
 *
 * `peakFrame` is the frame with the highest hips (video only). Without it,
 * vertical jump is unanswerable and says so — a single photograph cannot show
 * how far someone left the ground.
 */
export function deriveMetrics(
  releaseFrame: Keypoint2D[],
  setupFrame: Keypoint2D[] | null,
  peakFrame: Keypoint2D[] | null,
  playerHeightInches: number | null | undefined,
): DerivedMetrics {
  const unavailable: Record<string, string> = {}
  const scale = estimateScale(setupFrame ?? releaseFrame, playerHeightInches)

  const wrist = shootingWrist(releaseFrame)
  const ankle = midpoint(releaseFrame, "left_ankle", "right_ankle")
  const hip = midpoint(releaseFrame, "left_hip", "right_hip")
  const shoulder = midpoint(releaseFrame, "left_shoulder", "right_shoulder")

  // ---- Centreline deviation: an ANGLE, so no scale is needed -------------
  //
  // The line the ball leaves on, measured against vertical: from the midpoint
  // of the hips to the shooting wrist. Straight overhead reads 0; drifting
  // left or right of the body opens the angle. Reported unsigned, matching
  // canonical's "< 3°" band which is about magnitude of drift.
  let centerlineDeviationDegrees: number | null = null
  if (wrist && hip) {
    const dx = wrist.x - hip.x
    const dy = hip.y - wrist.y // upward is positive
    if (dy > 1) {
      centerlineDeviationDegrees = Math.abs((Math.atan2(dx, dy) * 180) / Math.PI)
    } else {
      unavailable.centerlineDeviation = "The wrist is not above the hips in the release frame."
    }
  } else {
    unavailable.centerlineDeviation = "The wrist or hips were not detected in the release frame."
  }

  // ---- The three lengths, all gated on a real scale ----------------------
  let releaseHeightInches: number | null = null
  let releaseDistanceInches: number | null = null
  let verticalJumpInches: number | null = null

  if (!scale) {
    const why = !playerHeightInches
      ? "Add your height to your profile — lengths need a real-world scale."
      : "The setup frame did not show both eyes and ankles, so no scale could be taken."
    unavailable.releaseHeight = why
    unavailable.releaseDistance = why
    unavailable.verticalJump = why
  } else {
    if (wrist && ankle) {
      releaseHeightInches = (ankle.y - wrist.y) * scale.inchesPerPixel
    } else {
      unavailable.releaseHeight = "The wrist or ankles were not detected in the release frame."
    }

    // Distance from the centreline, taken at the shoulders rather than the
    // hips: the ball leaves from above the shoulder line, and the hips rotate
    // through the shot on a turnaround while the shoulders track the target.
    const centre = shoulder ?? hip
    if (wrist && centre) {
      releaseDistanceInches = Math.abs(wrist.x - centre.x) * scale.inchesPerPixel
    } else {
      unavailable.releaseDistance = "The wrist or shoulders were not detected in the release frame."
    }

    if (peakFrame && setupFrame) {
      const hipSetup = midpoint(setupFrame, "left_hip", "right_hip")
      const hipPeak = midpoint(peakFrame, "left_hip", "right_hip")
      if (hipSetup && hipPeak) {
        // Hips, not ankles: feet leave the frame bottom on many captures, and
        // the hips are the most reliably tracked point on a rising body.
        const rise = (hipSetup.y - hipPeak.y) * scale.inchesPerPixel
        verticalJumpInches = Math.max(0, rise)
      } else {
        unavailable.verticalJump = "The hips were not detected in both the setup and peak frames."
      }
    } else {
      unavailable.verticalJump = "Vertical jump needs a video — a single photo cannot show lift."
    }
  }

  return {
    releaseHeightInches,
    releaseDistanceInches,
    verticalJumpInches,
    centerlineDeviationDegrees,
    unavailable,
    scale,
  }
}

/** `8'10"` from inches, for the release-height readout. */
export function formatFeetInches(inches: number): string {
  const total = Math.round(inches)
  return `${Math.floor(total / 12)}'${total % 12}"`
}
