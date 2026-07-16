import { describe, expect, it } from 'vitest'
import type { PersistedShotEvent, ShotEventInput } from '@/lib/api/shotEvents'
import {
  buildLiveVideoAnalysisData,
  createLocalReviewShotEvents,
} from '@/lib/live/liveReviewData'

const frame = {
  dataUrl: 'data:image/jpeg;base64,ZmFrZQ==',
  timestamp: 1.25,
  angles: { elbowAngle: 91 },
}

const detectorEvent: ShotEventInput = {
  sequence: 0,
  timestampMs: 1250,
  detected: true,
  detectedResult: 'unknown',
  detectedPhase: 'RELEASE',
}

describe('live Results adaptation', () => {
  it('supplies annotated frames and keeps detector rows review-only when persistence fails', () => {
    const data = buildLiveVideoAnalysisData({
      videoUrl: 'blob:live-recording',
      frames: [frame],
      duration: 2,
      detectedShotEvents: [detectorEvent],
      persistedShotEvents: null,
    })

    expect(data.annotatedFramesBase64).toEqual(['ZmFrZQ=='])
    expect(data.frameData).toEqual([expect.objectContaining({ frame: 0, phase: 'live' })])
    expect(data.shotEvents).toEqual([expect.objectContaining({
      id: expect.stringContaining('live-review-'),
      reviewOnly: true,
      timestampMs: 1250,
    })])
  })

  it('uses server event IDs when persistence succeeds', () => {
    const persisted: PersistedShotEvent[] = [{ ...detectorEvent, id: 'server-event-1' }]
    const data = buildLiveVideoAnalysisData({
      videoUrl: 'blob:live-recording',
      frames: [frame],
      duration: 2,
      detectedShotEvents: [detectorEvent],
      persistedShotEvents: persisted,
    })

    expect(data.shotEvents).toEqual(persisted)
    expect(data.shotEvents?.[0]).not.toHaveProperty('reviewOnly')
  })
})

describe('createLocalReviewShotEvents', () => {
  it('marks each local event and preserves detector metadata', () => {
    const [event] = createLocalReviewShotEvents([{ ...detectorEvent, metadata: { shotScore: 84 } }])

    expect(event).toEqual(expect.objectContaining({ reviewOnly: true, detectedPhase: 'RELEASE' }))
    expect(event.metadata).toEqual({ source: 'live_camera', reviewOnly: true, shotScore: 84 })
  })

  it('preserves a non-live source for uploaded local review rows', () => {
    const [event] = createLocalReviewShotEvents([detectorEvent], 'video_upload')

    expect(event.metadata).toEqual({ source: 'video_upload', reviewOnly: true })
  })
})
