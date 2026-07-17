import type { BallObservation, RimCalibration } from '@/lib/vision/objectTracking'

export interface LiveObjectVisibilityInput {
  ball: BallObservation | null
  rim: RimCalibration | null
  detectorReady: boolean
}

export interface LiveObjectVisibility {
  ballVisible: boolean | null
  hoopVisible: boolean
}

/** Keep "not detected" separate from "detector unavailable" in readiness. */
export function deriveLiveObjectVisibility({
  ball,
  rim,
  detectorReady,
}: LiveObjectVisibilityInput): LiveObjectVisibility {
  return {
    ballVisible: detectorReady ? ball !== null : null,
    hoopVisible: rim !== null,
  }
}

