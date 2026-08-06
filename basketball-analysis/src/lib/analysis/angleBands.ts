/**
 * The bands a SAVED analysis angle is judged against — one source, four screens.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHAT THE STORED ANGLES ACTUALLY ARE
 *
 * Kevin found the app disagreeing with itself about the elbow: `/results/demo`
 * banded it 160°–180°, while the biomechanics table, the phone metric strip and
 * the share card banded it 85°–95°. Chasing which one was right turned up that
 * the 85°–95° screens were the wrong ones, and that the same defect was sitting
 * on two more rows nobody had questioned.
 *
 * Every angle on an analysis record is sampled at ONE frame: the RELEASE frame.
 * `videoAnalysis.ts` picks it as "the detected frame where the shooting wrist is
 * highest relative to the shoulders (peak of the shot)", takes
 * `trustedAnglesFromForm(releaseForm)` there, and writes exactly those six
 * numbers. `/api/analysis/latest` serves them as `angles.*`. So:
 *
 *   angles.elbow    shoulder–elbow–wrist AT RELEASE. The arm is extended, so
 *                   this is ~150°–180°, NOT the ~90° set-point "L".
 *   angles.wrist    forearm elevation from horizontal (0 = flat, 90 = straight
 *                   up), normalised to 0–180. At release this is high, ~50°–100°.
 *   angles.release  SIGNED deviation of the forearm from vertical, 0 = straight
 *                   up. It is not a launch angle and it is not an arc.
 *
 * The bands below follow from that, and each cites where it comes from rather
 * than being picked to look plausible.
 *
 * WHAT WAS WRONG, AND WHAT IT DID TO A REAL SHOT:
 *
 *   ELBOW  banded 85°–95°: a textbook extended release elbow of ~170° read as a
 *          failure on three screens. `/results/demo`'s 160°–180° was correct.
 *   WRIST  banded 15°–30°: canonical 083 prints "Wrist Angle 21°", which is a
 *          wrist-snap flexion this pipeline never measures. The number beside it
 *          is forearm elevation, so a good ~78° read as a failure.
 *   RELEASE banded 45°–55°: that is canonical's SHOOTING ARC, a ball launch
 *          angle. `angles.release` is deviation from vertical with an ideal of
 *          0, so a near-perfect release read as a failure.
 *
 * All three failed in the same direction — marking correct shooting as wrong.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * A LARGER DEFECT THIS UNCOVERED, WHICH IS NOT FIXED HERE
 *
 * `scoreShootingForm` grades those same release-frame angles against
 * `IDEAL_RANGES`, which is a set of SET-POINT and LOADING ideals — elbow 90
 * ("the classic shooting 'L'"), knee 142 ("athletic bend for power"),
 * shoulder 70. Scoring a release frame with them scores a textbook shot at 69,
 * with elbow 31/100, knee 57/100 and shoulder 40/100.
 *
 * Fixing that means choosing release-frame ideals for the knee and the shoulder,
 * and this codebase does not state any — inventing them would be the same defect
 * one layer down. It needs a coach's numbers, so it is flagged for Kevin rather
 * than guessed at. See the FEATURE WORK LOG in docs/SCREEN-LEDGER.md.
 */

import { IDEAL_RANGES } from "@/lib/scoring/biomechanicalScoring"

export interface AngleBand {
  /** Inclusive lower bound of the good band. */
  min: number
  /** Inclusive upper bound of the good band. */
  max: number
  /** How to print the band beside a value. */
  label: string
}

/**
 * Elbow AT RELEASE.
 *
 * These are the app's own thresholds, not new ones: `videoAnalysis.ts` coaches
 * "Excellent elbow extension at release" for 150°–170°, "Extend elbow more"
 * below 140°, and "Slight over-extension" above 180°. Canonical 083's printed
 * 160°–180° sits across the same window. 150–180 is the span both agree is
 * good; below it the arm is short, above it is hyperextension.
 */
export const ELBOW_AT_RELEASE: AngleBand = { min: 150, max: 180, label: "150° – 180°" }

/**
 * Forearm elevation from horizontal AT RELEASE.
 *
 * `IDEAL_RANGES.wrist` (50–100, ideal 75) and `poseDetection.ts`'s own check
 * ("Arm at N° - Good arc" for 50–100) already agree on this one, so it is taken
 * from the scoring config rather than restated.
 */
export const WRIST_AT_RELEASE: AngleBand = {
  min: IDEAL_RANGES.wrist.goodMin,
  max: IDEAL_RANGES.wrist.goodMax,
  label: `${IDEAL_RANGES.wrist.goodMin}° – ${IDEAL_RANGES.wrist.goodMax}°`,
}

/**
 * Deviation from vertical AT RELEASE — signed, 0 is ideal.
 *
 * Also straight from the scoring config, which is right about this one because
 * `release` is the one joint whose ideal was always defined at this frame.
 * Printed as ±15° because a band reading "-15° – 15°" invites the reading that
 * negative is worse than positive; it is not, only the magnitude counts.
 */
export const RELEASE_FROM_VERTICAL: AngleBand = {
  min: IDEAL_RANGES.release.goodMin,
  max: IDEAL_RANGES.release.goodMax,
  label: `± ${IDEAL_RANGES.release.goodMax}°`,
}

/** Whether a measured angle sits inside its band, edges included. */
export function inBand(value: number | null | undefined, band: AngleBand): boolean | null {
  if (value == null || !Number.isFinite(value)) return null
  return value >= band.min && value <= band.max
}
