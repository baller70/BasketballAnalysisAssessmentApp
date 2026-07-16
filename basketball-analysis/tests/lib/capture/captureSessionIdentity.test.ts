import { describe, expect, it } from 'vitest'
import { updateSessionVideoCaptureIdentity } from '@/lib/capture/captureSession'
import type { AnalysisSession } from '@/services/sessionStorage'

const session: AnalysisSession = {
  id: 'local-session-1',
  date: '2026-07-16T12:00:00.000Z',
  displayDate: 'Jul 16',
  timestamp: 1,
  mainImageBase64: 'image',
  screenshots: [],
  analysisData: {
    overallScore: 80,
    shooterLevel: 'college',
    angles: {},
    detectedFlaws: [],
    measurements: {},
  },
  mediaType: 'video',
  videoData: {
    annotatedFramesBase64: ['frame'],
    frameCount: 1,
    duration: 1,
    fps: 10,
    phases: [],
    metrics: {
      elbow_angle_range: { min: null, max: null, at_release: null },
      knee_angle_range: { min: null, max: null },
      release_frame: 0,
      release_timestamp: 0,
    },
    frameData: [],
  },
}

describe('updateSessionVideoCaptureIdentity', () => {
  it('immutably attaches the late capture identity and events', () => {
    const events = [{ id: 'event-1', reviewOnly: false }]
    const updated = updateSessionVideoCaptureIdentity(session, 'capture-1', events)

    expect(updated).not.toBe(session)
    expect(updated.videoData).not.toBe(session.videoData)
    expect(updated.videoData).toEqual(expect.objectContaining({
      captureSessionId: 'capture-1',
      shotEvents: events,
      annotatedFramesBase64: ['frame'],
    }))
    expect(session.videoData).not.toHaveProperty('captureSessionId')
    expect(session.videoData).not.toHaveProperty('shotEvents')
  })
})
