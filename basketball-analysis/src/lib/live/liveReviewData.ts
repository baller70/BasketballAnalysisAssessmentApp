import type {
  PersistedShotEvent,
  ShotEventInput,
} from '@/lib/api/shotEvents'
import type { VideoAnalysisData } from '@/stores/analysisStore'

/** A frame captured by FullscreenLiveCamera before it is written to Results. */
export interface LiveCapturedFrame {
  dataUrl: string
  timestamp: number
  angles?: Record<string, number>
}

/**
 * Local detector rows are deliberately marked review-only. They can be
 * corrected in the current Results view, but must never be sent to the
 * correction API as if they had server-owned IDs.
 */
export type LocalReviewShotEvent = PersistedShotEvent & { reviewOnly: true }

function toBase64Frame(dataUrl: string): string {
  return dataUrl.replace(/^data:[^;]+;base64,/, '')
}

export function createLocalReviewShotEvents(events: ShotEventInput[]): LocalReviewShotEvent[] {
  return events.map((event, index) => ({
    ...event,
    id: `live-review-${index}-${event.timestampMs ?? 0}`,
    reviewOnly: true,
    metadata: {
      ...(event.metadata && typeof event.metadata === 'object' ? event.metadata : {}),
      source: 'live_camera',
      reviewOnly: true,
    },
  }))
}

interface BuildLiveVideoAnalysisDataArgs {
  videoUrl: string
  captureSessionId?: string | null
  frames: LiveCapturedFrame[]
  duration: number
  detectedShotEvents: ShotEventInput[]
  /** null means persistence failed and local review rows must be retained. */
  persistedShotEvents: PersistedShotEvent[] | null
}

/**
 * Adapt a live recording to the Results video contract. In particular,
 * Results requires annotatedFramesBase64; the camera's captured frames are
 * data URLs, so strip the MIME prefix before the GSAP player consumes them.
 */
export function buildLiveVideoAnalysisData({
  videoUrl,
  captureSessionId,
  frames,
  duration,
  detectedShotEvents,
  persistedShotEvents,
}: BuildLiveVideoAnalysisDataArgs): VideoAnalysisData {
  const shotEvents = persistedShotEvents === null
    ? createLocalReviewShotEvents(detectedShotEvents)
    : persistedShotEvents

  return {
    videoUrl,
    captureSessionId,
    frames: frames.map((frame) => ({
      url: frame.dataUrl,
      timestamp: frame.timestamp,
      angles: frame.angles,
    })),
    annotatedFramesBase64: frames.map((frame) => toBase64Frame(frame.dataUrl)),
    frameCount: frames.length,
    duration,
    fps: 30,
    frameData: frames.map((frame, index) => ({
      frame: index,
      timestamp: frame.timestamp,
      phase: 'live',
      metrics: frame.angles || {},
    })),
    shotEvents,
  }
}
