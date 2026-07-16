import { describe, expect, it } from 'vitest'

import {
  derivePoseCaptureObservation,
  evaluateCaptureReadiness,
  type CaptureReadinessInput,
} from '@/lib/capture/guidedCapture'

const readyInput = (overrides: Partial<CaptureReadinessInput> = {}): CaptureReadinessInput => ({
  mode: 'form',
  observation: {
    cameraReady: true,
    modelReady: true,
    poseDetected: true,
    orientation: 'upright',
    fullBodyVisible: true,
    subjectFrameRatio: 0.62,
    poseConfidence: 0.82,
    stable: true,
    lighting: 'good',
    hoopVisible: null,
    ballVisible: null,
  },
  ...overrides,
})

describe('evaluateCaptureReadiness', () => {
  it('stays in checking state until the camera and model are ready', () => {
    const result = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        cameraReady: false,
        modelReady: false,
      },
    }))

    expect(result.status).toBe('checking')
    expect(result.ready).toBe(false)
    expect(result.primaryIssue?.id).toBe('camera')
  })

  it('asks the player to enter the frame when no pose is detected', () => {
    const result = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        poseDetected: false,
        fullBodyVisible: null,
        subjectFrameRatio: null,
        poseConfidence: null,
      },
    }))

    expect(result.status).toBe('needs_attention')
    expect(result.primaryIssue?.id).toBe('pose')
    expect(result.primaryIssue?.message).toContain('Step into frame')
  })

  it('rejects a sideways pose before recording', () => {
    const result = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        orientation: 'sideways',
      },
    }))

    expect(result.ready).toBe(false)
    expect(result.failedChecks.map(check => check.id)).toContain('orientation')
  })

  it('requires the full body and a usable subject size', () => {
    const tooFar = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        fullBodyVisible: false,
        subjectFrameRatio: 0.12,
      },
    }))
    const tooClose = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        subjectFrameRatio: 0.97,
      },
    }))

    expect(tooFar.failedChecks.map(check => check.id)).toEqual(
      expect.arrayContaining(['full_body', 'subject_size'])
    )
    expect(tooFar.failedChecks.find(check => check.id === 'subject_size')?.message).toContain('Move closer')
    expect(tooClose.failedChecks.find(check => check.id === 'subject_size')?.message).toContain('Step back')
  })

  it('rejects pose observations below the configured confidence', () => {
    const result = evaluateCaptureReadiness(readyInput({
      observation: {
        ...readyInput().observation,
        poseConfidence: 0.31,
      },
    }))

    expect(result.failedChecks.find(check => check.id === 'pose_confidence')?.message).toContain('Hold still')
  })

  it('requires hoop and ball only when shot tracking enables those checks', () => {
    const result = evaluateCaptureReadiness(readyInput({
      mode: 'shot_tracking',
      requirements: {
        requireHoop: true,
        requireBall: true,
      },
      observation: {
        ...readyInput().observation,
        hoopVisible: false,
        ballVisible: false,
      },
    }))

    expect(result.failedChecks.map(check => check.id)).toEqual(
      expect.arrayContaining(['hoop', 'ball'])
    )
  })

  it('reports ready when every enabled check passes', () => {
    const result = evaluateCaptureReadiness(readyInput())

    expect(result.status).toBe('ready')
    expect(result.ready).toBe(true)
    expect(result.failedChecks).toEqual([])
    expect(result.primaryIssue).toBeNull()
  })
})

describe('derivePoseCaptureObservation', () => {
  it('returns a missing-pose observation without inventing body measurements', () => {
    const observation = derivePoseCaptureObservation({
      cameraReady: true,
      modelReady: true,
      orientation: 'unknown',
      pose: null,
      frameHeight: 1280,
    })

    expect(observation.poseDetected).toBe(false)
    expect(observation.fullBodyVisible).toBeNull()
    expect(observation.subjectFrameRatio).toBeNull()
    expect(observation.poseConfidence).toBeNull()
  })

  it('derives full-body visibility, subject size, and average body confidence from pose landmarks', () => {
    const keypoints = Array.from({ length: 17 }, (_, index) => ({
      x: 200 + index,
      y: 120 + index * 50,
      score: 0.8,
    }))

    const observation = derivePoseCaptureObservation({
      cameraReady: true,
      modelReady: true,
      orientation: 'upright',
      pose: { keypoints },
      frameHeight: 1000,
    })

    expect(observation.poseDetected).toBe(true)
    expect(observation.fullBodyVisible).toBe(true)
    expect(observation.subjectFrameRatio).toBeCloseTo(0.8)
    expect(observation.poseConfidence).toBeCloseTo(0.8)
  })

  it('does not claim full-body visibility when either ankle is unreliable', () => {
    const keypoints = Array.from({ length: 17 }, (_, index) => ({
      x: 200 + index,
      y: 120 + index * 40,
      score: index === 16 ? 0.1 : 0.8,
    }))

    const observation = derivePoseCaptureObservation({
      cameraReady: true,
      modelReady: true,
      orientation: 'upright',
      pose: { keypoints },
      frameHeight: 1000,
    })

    expect(observation.fullBodyVisible).toBe(false)
  })
})
