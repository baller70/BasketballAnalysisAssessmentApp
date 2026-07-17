import { describe, expect, it } from 'vitest'

import { deriveLiveObjectVisibility } from '@/lib/live/liveObjectTracking'
import type { BallObservation, RimCalibration } from '@/lib/vision/objectTracking'

const ball: BallObservation = {
  centerX: 0.5,
  centerY: 0.3,
  width: 0.04,
  height: 0.07,
  confidence: 0.8,
  timestampMs: 100,
}
const rim: RimCalibration = {
  centerX: 0.7,
  centerY: 0.2,
  width: 0.14,
  height: 0.12,
  calibratedAtMs: 1,
  source: 'manual',
}

describe('deriveLiveObjectVisibility', () => {
  it('reports trusted basketball and calibrated hoop visibility', () => {
    expect(deriveLiveObjectVisibility({ ball, rim, detectorReady: true })).toEqual({
      ballVisible: true,
      hoopVisible: true,
    })
  })

  it('distinguishes no ball from a model that is not ready', () => {
    expect(deriveLiveObjectVisibility({ ball: null, rim, detectorReady: true })).toEqual({
      ballVisible: false,
      hoopVisible: true,
    })
    expect(deriveLiveObjectVisibility({ ball: null, rim, detectorReady: false })).toEqual({
      ballVisible: null,
      hoopVisible: true,
    })
  })

  it('requires explicit hoop calibration', () => {
    expect(deriveLiveObjectVisibility({ ball, rim: null, detectorReady: true })).toEqual({
      ballVisible: true,
      hoopVisible: false,
    })
  })
})
