import { describe, expect, it } from 'vitest'
import {
  analysisSessionToSavePayload,
  type AnalysisSession,
} from '@/services/sessionStorage'

function session(overrides: Partial<AnalysisSession> = {}): AnalysisSession {
  return {
    id: 'session-mobile-1',
    date: '2026-07-16T20:00:00.000Z',
    displayDate: 'Jul 16',
    timestamp: 1_752_696_000_000,
    mainImageBase64: 'data:image/jpeg;base64,raw',
    skeletonImageBase64: 'data:image/jpeg;base64,annotated',
    screenshots: [],
    analysisData: {
      overallScore: 84,
      shooterLevel: 'Advanced',
      angles: {
        right_elbow_angle: 91,
        right_knee_angle: 143,
        release_angle: 49,
      },
      detectedFlaws: ['Keep the guide elbow steady'],
      measurements: { formScore: 82, balanceScore: 79 },
    },
    mediaType: 'video',
    videoData: {
      captureSessionId: 'capture-ios-1',
      annotatedFramesBase64: [],
      frameCount: 0,
      duration: 4,
      fps: 30,
      phases: [],
      metrics: {
        elbow_angle_range: { min: null, max: null, at_release: 91 },
        knee_angle_range: { min: null, max: null },
        release_frame: 0,
        release_timestamp: 0,
      },
      frameData: [],
    },
    ...overrides,
  }
}

describe('analysisSessionToSavePayload', () => {
  it('preserves the durable client and capture identities', () => {
    expect(analysisSessionToSavePayload(session())).toEqual(expect.objectContaining({
      clientSessionId: 'session-mobile-1',
      recordedAt: '2026-07-16T20:00:00.000Z',
      mediaType: 'video',
      captureSessionId: 'capture-ios-1',
    }))
  })

  it('maps only real measured scores and angles', () => {
    const payload = analysisSessionToSavePayload(session())
    expect(payload).toEqual(expect.objectContaining({
      overallScore: 84,
      formScore: 82,
      balanceScore: 79,
      elbowAngle: 91,
      kneeAngle: 143,
      releaseAngle: 49,
    }))
    expect(payload.consistencyScore).toBeUndefined()
    expect(payload.wristAngle).toBeUndefined()
  })

  it('sends data URLs as upload data', () => {
    const payload = analysisSessionToSavePayload(session())
    expect(payload.imageData).toBe('data:image/jpeg;base64,raw')
    expect(payload.annotatedImageData).toBe('data:image/jpeg;base64,annotated')
    expect(payload.imageUrl).toBeUndefined()
  })

  it('reuses existing media URLs without treating them as base64', () => {
    const payload = analysisSessionToSavePayload(session({
      mainImageBase64: 'https://cdn.example/shot.jpg',
      skeletonImageBase64: '/uploads/annotated.jpg',
    }))
    expect(payload.imageUrl).toBe('https://cdn.example/shot.jpg')
    expect(payload.annotatedImageUrl).toBe('/uploads/annotated.jpg')
    expect(payload.imageData).toBeUndefined()
  })

  it('does not invent missing category scores', () => {
    const base = session()
    const payload = analysisSessionToSavePayload(session({
      analysisData: { ...base.analysisData, measurements: {}, angles: {} },
    }))
    expect(payload.formScore).toBeUndefined()
    expect(payload.balanceScore).toBeUndefined()
    expect(payload.releaseScore).toBeUndefined()
    expect(payload.consistencyScore).toBeUndefined()
    expect(payload.elbowAngle).toBeUndefined()
  })
})
