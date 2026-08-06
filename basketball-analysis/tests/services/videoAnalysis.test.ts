import { describe, expect, it } from 'vitest'
import {
  buildVideoFrameRecord,
  convertVideoToSessionFormat,
  findLoadFrame,
  findRiseFrame,
  toVideoSessionData,
  type SampledFrame,
} from '@/services/videoAnalysis'
import { gateMechanicsMeasurements } from '@/lib/vision/confidenceGate'

const makeResult = {
  result: 'make' as const,
  confidence: 0.91,
  final: true,
  timestampMs: 200,
  reason: 'Ball crossed downward through the calibrated hoop cylinder',
  provenance: {
    source: 'calibrated_ball_trajectory' as const,
    rimCalibrated: true,
    sampleCount: 4,
    trustedSampleCount: 4,
  },
}

describe('uploaded-video frame records', () => {
  it('propagates canonical phase/sidecars and keeps raw angles explicit', () => {
    const mechanics = gateMechanicsMeasurements({
      angles: { elbow: 160, knee: 145 },
      confidence: { elbow: 0.2, knee: 0.95 },
      minConfidence: 0.5,
    })
    const form = {
      angles: { elbow: null, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      untrustedAngles: { elbow: 160, knee: 145, shoulder: null, hip: null, release: null, wrist: null },
      mechanics,
      canonicalObservation: {
        timestampMs: 200,
        keypoints: [],
        poseConfidence: 0.9,
        phase: 'release' as const,
        mechanics,
      },
    }
    const record = buildVideoFrameRecord({
      index: 3,
      timestamp: 0.2,
      keypoints: [],
      form,
      imageBase64: 'frame',
    }, 'RELEASE')

    expect(record.phase).toBe('release')
    expect(record.legacy_phase).toBe('RELEASE')
    expect(record.canonicalObservation?.phase).toBe('release')
    expect(record.mechanics).toBe(mechanics)
    expect(record.metrics.elbow_angle).toBeUndefined()
    expect(record.metrics.knee_angle).toBe(145)
    expect(record.untrustedAngles?.elbow).toBe(160)
  })

  it('preserves a null release score instead of manufacturing zero', () => {
    const result = convertVideoToSessionFormat({
      success: true,
      metrics: {
        elbow_angle_range: { min: null, max: null, at_release: null },
        knee_angle_range: { min: null, max: null },
        release_frame: 0,
        release_timestamp: 0,
        release_score: null,
        release_angles: {},
      },
    })

    expect(result.overallScore).toBeNull()
    expect(result.videoData.metrics.release_score).toBeNull()
  })

  it('retains canonical phase and mechanics sidecars in persisted video data', () => {
    const mechanics = gateMechanicsMeasurements({ angles: { elbow: 160 }, confidence: { elbow: 0.9 } })
    const canonicalObservation = {
      timestampMs: 1200,
      keypoints: [],
      poseConfidence: 0.9,
      phase: 'follow-through' as const,
      mechanics,
    }
    const result = toVideoSessionData({
      success: true,
      phases: [{ phase: 'follow-through', frame: 2, timestamp: 1.2, canonicalObservation }],
      frame_data: [{
        frame: 2,
        timestamp: 1.2,
        phase: 'follow-through',
        legacy_phase: 'FOLLOW_THROUGH',
        metrics: {},
        keypoint_count: 0,
        ball_detected: false,
        mechanics,
        canonicalObservation,
      }],
    })

    expect(result.phases[0].canonicalObservation?.phase).toBe('follow-through')
    expect(result.frameData[0].mechanics).toBe(mechanics)
    expect(result.frameData[0].canonicalObservation?.timestampMs).toBe(1200)
  })

  it('persists trusted basketball observations and their shared trajectory result', () => {
    const ball = {
      centerX: 0.5,
      centerY: 0.48,
      width: 0.04,
      height: 0.04,
      confidence: 0.9,
      timestampMs: 200,
    }
    const record = buildVideoFrameRecord({
      index: 3,
      timestamp: 0.2,
      keypoints: null,
      form: null,
      imageBase64: 'frame',
      ball,
      shotResult: makeResult,
    }, 'FOLLOW_THROUGH')

    expect(record.ball_detected).toBe(true)
    expect(record.ball).toEqual(ball)
    expect(record.shot_result).toEqual(makeResult)

    const session = toVideoSessionData({
      success: true,
      shot_result: makeResult,
      frame_data: [record],
    })
    expect(session.shotResult).toEqual(makeResult)
    expect(session.frameData[0].shot_result?.result).toBe('make')
  })
})

/**
 * Five phase cards, five real frames.
 *
 * The pipeline only ever located SETUP, RELEASE and FOLLOW-THROUGH, so the LOAD
 * and RISE cards on every results screen could not be filled from a real
 * upload. These cover the two finders that close that gap, including the
 * degenerate clips where the honest answer is "there is no window here".
 */
describe('load and rise phase detection', () => {
  /** A frame carrying a knee angle and a wrist height, which is all the finders read. */
  const frame = (index: number, knee: number | null, wristY: number): SampledFrame => ({
    index,
    timestamp: index * 0.1,
    keypoints: [
      { name: 'right_wrist', x: 100, y: wristY, score: 0.9 },
      { name: 'left_wrist', x: 90, y: wristY + 4, score: 0.9 },
    ],
    form: {
      angles: { elbow: null, knee, shoulder: null, hip: null, release: null, wrist: null },
      scores: { overallScore: null } as never,
      status: {} as never,
      overallScore: null,
      tips: [],
      measuredCount: knee == null ? 0 : 1,
    },
    imageBase64: `f${index}`,
  })

  // A jump shot: stands tall, sinks into the legs at frame 3, then drives up
  // with the wrists climbing (y falling) to the release at frame 8.
  const shot = [
    frame(0, 172, 300), frame(1, 160, 298), frame(2, 138, 296),
    frame(3, 108, 295), frame(4, 126, 270), frame(5, 145, 240),
    frame(6, 162, 205), frame(7, 170, 170), frame(8, 175, 140),
    frame(9, 176, 150), frame(10, 176, 165),
  ]

  it('puts LOAD on the deepest knee bend', () => {
    expect(findLoadFrame(shot, 0, 8)).toBe(3)
  })

  it('puts RISE halfway up the wrists travel between load and release', () => {
    // Wrists run 295 -> 140, so the midpoint is 217.5 and frame 6 (205) is the
    // closest sample to it.
    expect(findRiseFrame(shot, 3, 8)).toBe(6)
  })

  it('keeps the phases in shot order', () => {
    const load = findLoadFrame(shot, 0, 8)
    const rise = findRiseFrame(shot, load, 8)
    expect(0).toBeLessThanOrEqual(load)
    expect(load).toBeLessThan(rise)
    expect(rise).toBeLessThan(8)
  })

  it('falls back to the first third of the window when knees were never measured', () => {
    const noKnees = shot.map((f) => frame(f.index, null, 300 - f.index * 15))
    // Window is frames 1..7 (7 samples); the first third is the 3rd sample in.
    expect(findLoadFrame(noKnees, 0, 8)).toBe(3)
  })

  it('collapses RISE onto LOAD when no frame between them tracks a wrist', () => {
    const noWrists = shot.map((f) => ({ ...f, keypoints: null }))
    // Every candidate is unusable, so there is no window at all and RISE
    // reports LOAD rather than inventing a frame.
    expect(findRiseFrame(noWrists, 3, 8)).toBe(3)
  })

  it('falls back to the temporal midpoint when the endpoints have no wrist', () => {
    // The window tracks fine but LOAD and RELEASE themselves do not, so there
    // is nothing to interpolate between and the middle sample is the answer.
    const blindEnds = shot.map((f) =>
      f.index === 3 || f.index === 8 ? { ...f, keypoints: null } : f)
    // Window is frames 4..7; the middle sample is frame 6.
    expect(findRiseFrame(blindEnds, 3, 8)).toBe(6)
  })

  it('collapses onto setup when release lands next to it', () => {
    // A one-frame gather has no room for a dip or a lift. Reporting setup is
    // honest; skipping the cards would leave the strip half empty.
    expect(findLoadFrame(shot, 4, 5)).toBe(4)
    expect(findRiseFrame(shot, 4, 5)).toBe(4)
  })
})
