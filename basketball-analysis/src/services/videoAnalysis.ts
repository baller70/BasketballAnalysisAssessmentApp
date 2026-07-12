/**
 * @file videoAnalysis.ts
 * @description Video shooting-form analysis — CANONICAL on-device path.
 *
 * PURPOSE:
 * - Extracts frames from an uploaded video ENTIRELY IN THE BROWSER (HTMLVideo +
 *   canvas seeking) and runs the on-device MoveNet provider (services/pose) on
 *   each sampled frame. No server round-trip.
 * - Detects shot phases (Setup / Release / Follow-through) from the per-frame
 *   keypoints and produces the same result shape the results page already uses.
 * - All scoring comes from lib/scoring/biomechanicalScoring.ts via the provider.
 *
 * HISTORY:
 * - This used to POST the whole video (base64) to a non-existent server on
 *   localhost:5002 (NEXT_PUBLIC_VIDEO_API_URL, never set), so video analysis was
 *   completely broken. convertVideoToSessionFormat also started every score from
 *   a hardcoded base of 75. Both are removed — scores are now derived from real
 *   measured angles, and on failure we surface a real error.
 *
 * LIMITS:
 * - Max 500MB and max 90s duration. The generous file cap accommodates local
 *   iPhone 4K clips; processing remains bounded to 90 downscaled frames.
 *
 * USED BY:
 * - src/app/results/demo/page.tsx (video upload handler)
 * - src/components/upload/VideoUpload.tsx
 */

import {
  getPoseProvider,
  keypointsToRecord,
  type ProviderKeypoint,
  type FormAnalysis,
} from '@/services/pose'
import {
  scoreShootingForm,
  type ShootingAnglesInput,
} from '@/lib/scoring/biomechanicalScoring'
import { FILE_LIMITS, VIDEO_CONSTRAINTS } from '@/lib/constants'

// Cap on how many frames we actually run inference on, so a long clip stays
// responsive (90s * 10fps would be 900 frames). Frames are sampled evenly.
const MAX_ANALYSIS_FRAMES = 90
// Downscale frames for capture/inference to keep things fast and memory-bounded.
const CAPTURE_MAX_WIDTH = 720

export interface KeyScreenshot {
  label: string  // SETUP, RELEASE, FOLLOW_THROUGH
  frame_index: number
  phase: string
  metrics: Record<string, number>
  keypoints: Record<string, { x: number; y: number; confidence: number }>
  image_base64: string
}

export interface VideoAnalysisResult {
  success: boolean
  error?: string

  video_info?: {
    original_fps: number
    target_fps: number
    duration: number
    extracted_frames: number
    width: number
    height: number
  }

  frame_count?: number
  annotated_frames_base64?: string[]

  phases?: Array<{
    phase: string
    frame: number
    timestamp: number
  }>

  metrics?: {
    elbow_angle_range: {
      min: number | null
      max: number | null
      at_release: number | null
    }
    knee_angle_range: {
      min: number | null
      max: number | null
    }
    release_frame: number
    release_timestamp: number
    /** Deterministic biomechanical score for the release frame (0-100). */
    release_score: number | null
    /** Loosely-keyed canonical angles for the release frame (for the flaw engine). */
    release_angles: Record<string, number>
  }

  frame_data?: Array<{
    frame: number
    timestamp: number
    phase: string
    metrics: Record<string, number>
    keypoint_count: number
    ball_detected: boolean
    keypoints?: Record<string, { x: number; y: number; confidence: number }>
  }>

  all_keypoints?: Array<Record<string, { x: number; y: number; confidence: number }>>

  key_screenshots?: KeyScreenshot[]

  shot_range?: {
    start: number
    end: number
    phases: string[]
  } | null

  fps?: number
}

// ----------------------------------------------------------------------------
// Frame extraction helpers (browser only)
// ----------------------------------------------------------------------------

function loadVideoElement(file: File): Promise<{ video: HTMLVideoElement; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'auto'
    video.muted = true
    video.playsInline = true
    video.src = url
    video.onloadedmetadata = () => resolve({ video, url })
    video.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Could not read the video file. Try a different format (MP4 recommended).'))
    }
  })
}

function seekTo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    const onSeeked = () => {
      video.removeEventListener('seeked', onSeeked)
      resolve()
    }
    video.addEventListener('seeked', onSeeked)
    // Clamp slightly inside the duration to avoid landing past the last frame.
    video.currentTime = Math.min(time, Math.max(0, video.duration - 0.05))
  })
}

interface SampledFrame {
  index: number
  timestamp: number
  keypoints: ProviderKeypoint[] | null
  form: FormAnalysis | null
  imageBase64: string
}

/**
 * Pick the release frame: the detected frame where the shooting wrist is highest
 * relative to the shoulders (peak of the shot). Falls back to the frame with the
 * greatest elbow extension if wrists are unreliable.
 */
function findReleaseFrame(frames: SampledFrame[]): number {
  let best = -1
  let bestWristLift = Infinity // lower y = higher up
  for (const f of frames) {
    if (!f.keypoints) continue
    const rw = f.keypoints.find((k) => k.name === 'right_wrist' && k.score > 0.3)
    const lw = f.keypoints.find((k) => k.name === 'left_wrist' && k.score > 0.3)
    const wrist = rw && lw ? (rw.y < lw.y ? rw : lw) : rw || lw
    if (wrist && wrist.y < bestWristLift) {
      bestWristLift = wrist.y
      best = f.index
    }
  }
  if (best >= 0) return best

  // Fallback: max elbow angle (most extended arm).
  let maxElbow = -Infinity
  for (const f of frames) {
    const e = f.form?.angles.elbow
    if (e != null && e > maxElbow) {
      maxElbow = e
      best = f.index
    }
  }
  return best >= 0 ? best : frames.findIndex((f) => f.keypoints)
}

// ----------------------------------------------------------------------------
// Main analysis
// ----------------------------------------------------------------------------

export async function analyzeVideoShooting(
  videoFile: File
): Promise<VideoAnalysisResult> {
  // Validate file size.
  if (videoFile.size > FILE_LIMITS.MAX_VIDEO_SIZE_BYTES) {
    return { success: false, error: `Video must be under ${FILE_LIMITS.MAX_VIDEO_SIZE_MB}MB` }
  }

  let url: string | null = null
  try {
    const loaded = await loadVideoElement(videoFile)
    const video = loaded.video
    url = loaded.url

    const duration = video.duration
    if (!isFinite(duration) || duration <= 0) {
      return { success: false, error: 'Could not read the video duration.' }
    }

    // Enforce the advertised duration limit.
    if (duration > VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS) {
      return {
        success: false,
        error: `Video is ${duration.toFixed(1)}s — please upload a clip under ${VIDEO_CONSTRAINTS.MAX_DURATION_SECONDS} seconds.`
      }
    }

    const vw = video.videoWidth || 720
    const vh = video.videoHeight || 1280
    const scale = Math.min(1, CAPTURE_MAX_WIDTH / vw)
    const cw = Math.round(vw * scale)
    const ch = Math.round(vh * scale)

    const canvas = document.createElement('canvas')
    canvas.width = cw
    canvas.height = ch
    const ctx = canvas.getContext('2d')
    if (!ctx) return { success: false, error: 'Browser could not create a canvas for frame extraction.' }

    const fps = VIDEO_CONSTRAINTS.TARGET_FPS
    const rawCount = Math.max(1, Math.floor(duration * fps))
    const frameCount = Math.min(rawCount, MAX_ANALYSIS_FRAMES)
    const step = duration / frameCount

    const provider = getPoseProvider()
    await provider.init()

    const frames: SampledFrame[] = []
    for (let i = 0; i < frameCount; i++) {
      const t = i * step
      await seekTo(video, t)
      ctx.drawImage(video, 0, 0, cw, ch)
      const imageBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1] || ''

      const keypoints = await provider.detectPose(canvas)
      const form = keypoints ? provider.analyzeForm(keypoints) : null

      frames.push({ index: i, timestamp: t, keypoints, form, imageBase64 })
    }

    const detected = frames.filter((f) => f.keypoints && f.form)
    if (detected.length === 0) {
      return {
        success: false,
        error: 'No shooter detected in the video. Make sure the full body is visible and try again.'
      }
    }

    // Phase detection.
    const releaseIdx = findReleaseFrame(frames)
    const firstDetected = detected[0].index
    const lastDetected = detected[detected.length - 1].index
    const setupIdx = firstDetected
    const followIdx = Math.max(releaseIdx, lastDetected)

    const phaseForIndex = (i: number): string => {
      if (i <= setupIdx) return 'SETUP'
      if (i < releaseIdx) return 'LOADING'
      if (i === releaseIdx) return 'RELEASE'
      return 'FOLLOW_THROUGH'
    }

    // Per-frame metric/keypoint records.
    const frame_data = frames.map((f) => {
      const elbow = f.form?.angles.elbow
      const knee = f.form?.angles.knee
      const metrics: Record<string, number> = {}
      if (elbow != null) metrics.elbow_angle = Math.round(elbow)
      if (knee != null) metrics.knee_angle = Math.round(knee)
      return {
        frame: f.index,
        timestamp: f.timestamp,
        phase: phaseForIndex(f.index),
        metrics,
        keypoint_count: f.keypoints?.length ?? 0,
        ball_detected: false,
        keypoints: f.keypoints ? keypointsToRecord(f.keypoints) : undefined,
      }
    })

    const all_keypoints = frames.map((f) =>
      f.keypoints ? keypointsToRecord(f.keypoints) : {}
    )

    // Aggregate elbow/knee ranges across detected frames.
    const elbowValues = detected
      .map((f) => f.form!.angles.elbow)
      .filter((v): v is number => v != null)
    const kneeValues = detected
      .map((f) => f.form!.angles.knee)
      .filter((v): v is number => v != null)

    const releaseFrame = frames[releaseIdx] ?? detected[0]
    const releaseForm = releaseFrame.form ?? detected[0].form!

    // Real, deterministic release-frame score + angle record (no base 75).
    const releaseAnglesInput: ShootingAnglesInput = {
      elbow: releaseForm.angles.elbow,
      knee: releaseForm.angles.knee,
      shoulder: releaseForm.angles.shoulder,
      hip: releaseForm.angles.hip,
      release: releaseForm.angles.release,
      wrist: releaseForm.angles.wrist,
    }
    const releaseScores = scoreShootingForm(releaseAnglesInput)

    const release_angles: Record<string, number> = {}
    const putAngle = (joint: string, v: number | null | undefined) => {
      if (v == null || Number.isNaN(v)) return
      release_angles[`${joint}_angle`] = Math.round(v)
      release_angles[`right_${joint}_angle`] = Math.round(v)
    }
    putAngle('elbow', releaseForm.angles.elbow)
    putAngle('knee', releaseForm.angles.knee)
    putAngle('shoulder', releaseForm.angles.shoulder)
    putAngle('hip', releaseForm.angles.hip)
    if (releaseForm.angles.release != null) release_angles['release_angle'] = Math.round(releaseForm.angles.release)
    if (releaseForm.angles.wrist != null) release_angles['wrist_angle'] = Math.round(releaseForm.angles.wrist)

    const buildScreenshot = (label: string, idx: number): KeyScreenshot => {
      const f = frames[idx] ?? detected[0]
      const elbow = f.form?.angles.elbow
      const knee = f.form?.angles.knee
      const metrics: Record<string, number> = {}
      if (elbow != null) metrics.elbow_angle = Math.round(elbow)
      if (knee != null) metrics.knee_angle = Math.round(knee)
      return {
        label,
        frame_index: f.index,
        phase: label,
        metrics,
        keypoints: f.keypoints ? keypointsToRecord(f.keypoints) : {},
        image_base64: f.imageBase64,
      }
    }

    const key_screenshots: KeyScreenshot[] = [
      buildScreenshot('SETUP', setupIdx),
      buildScreenshot('RELEASE', releaseIdx),
      buildScreenshot('FOLLOW_THROUGH', followIdx),
    ]

    const phases = [
      { phase: 'SETUP', frame: setupIdx, timestamp: frames[setupIdx]?.timestamp ?? 0 },
      { phase: 'RELEASE', frame: releaseIdx, timestamp: frames[releaseIdx]?.timestamp ?? 0 },
      { phase: 'FOLLOW_THROUGH', frame: followIdx, timestamp: frames[followIdx]?.timestamp ?? 0 },
    ]

    return {
      success: true,
      video_info: {
        original_fps: fps,
        target_fps: fps,
        duration,
        extracted_frames: frameCount,
        width: cw,
        height: ch,
      },
      frame_count: frameCount,
      fps,
      annotated_frames_base64: frames.map((f) => f.imageBase64),
      phases,
      metrics: {
        elbow_angle_range: {
          min: elbowValues.length ? Math.round(Math.min(...elbowValues)) : null,
          max: elbowValues.length ? Math.round(Math.max(...elbowValues)) : null,
          at_release: releaseForm.angles.elbow != null ? Math.round(releaseForm.angles.elbow) : null,
        },
        knee_angle_range: {
          min: kneeValues.length ? Math.round(Math.min(...kneeValues)) : null,
          max: kneeValues.length ? Math.round(Math.max(...kneeValues)) : null,
        },
        release_frame: releaseIdx,
        release_timestamp: frames[releaseIdx]?.timestamp ?? 0,
        release_score: releaseScores.overallScore,
        release_angles,
      },
      frame_data,
      all_keypoints,
      key_screenshots,
      shot_range: { start: setupIdx, end: followIdx, phases: ['SETUP', 'RELEASE', 'FOLLOW_THROUGH'] },
    }
  } catch (error) {
    console.error('Video analysis error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Video analysis failed'
    }
  } finally {
    if (url) URL.revokeObjectURL(url)
  }
}

/**
 * Convert a video analysis result into the session-storage shape shared with
 * image sessions. The overall score is the deterministic biomechanical score of
 * the release frame — NOT a hardcoded base value.
 */
export function convertVideoToSessionFormat(
  videoResult: VideoAnalysisResult
): {
  overallScore: number
  angles: Record<string, number>
  keypoints: Record<string, { x: number; y: number; confidence: number }> | null
  screenshots: Array<{ label: string; imageBase64: string; analysis?: string }>
  mainImageBase64: string
  skeletonImageBase64: string
  feedback: string[]
  strengths: string[]
  improvements: string[]
} {
  const metrics = videoResult.metrics

  // Real release-frame score. (analyzeVideoShooting only returns success when at
  // least one frame was scored, so this is always a genuine number here.)
  const overallScore = Math.min(100, Math.max(0, Math.round(metrics?.release_score ?? 0)))

  // Canonical angle record for the flaw engine (right_elbow_angle, etc.).
  const angles: Record<string, number> = { ...(metrics?.release_angles ?? {}) }

  const releaseScreenshot = videoResult.key_screenshots?.find(s => s.label === 'RELEASE')
  const keypoints = releaseScreenshot?.keypoints || null

  const screenshots = (videoResult.key_screenshots || []).map(ks => ({
    label: ks.label,
    imageBase64: `data:image/jpeg;base64,${ks.image_base64}`,
    analysis: `${ks.phase} - Elbow: ${ks.metrics.elbow_angle ?? '-'}°, Knee: ${ks.metrics.knee_angle ?? '-'}°`
  }))

  const mainScreenshot = releaseScreenshot || videoResult.key_screenshots?.[0]
  const mainImageBase64 = mainScreenshot
    ? `data:image/jpeg;base64,${mainScreenshot.image_base64}`
    : ''

  const feedback: string[] = []
  const strengths: string[] = []
  const improvements: string[] = []

  if (metrics) {
    const elbow = metrics.elbow_angle_range.at_release
    const knee = metrics.knee_angle_range.min

    if (elbow != null) {
      if (elbow >= 150 && elbow <= 170) {
        strengths.push(`Excellent elbow extension at release (${elbow}°)`)
      } else if (elbow < 140) {
        improvements.push(`Extend elbow more at release (currently ${elbow}°, aim for 150-170°)`)
      } else if (elbow > 180) {
        improvements.push(`Slight over-extension at release (${elbow}°)`)
      }
    }

    if (knee != null) {
      if (knee < 150) {
        strengths.push(`Good knee bend for power (${knee}°)`)
      } else {
        improvements.push(`Bend knees more for power (currently ${knee}°, aim for < 150°)`)
      }
    }
  }

  if (videoResult.phases && videoResult.phases.length >= 3) {
    strengths.push('Complete shooting motion detected (Setup → Release → Follow-through)')
  } else {
    feedback.push('Partial shooting motion - try to capture the full shot sequence')
  }

  return {
    overallScore,
    angles,
    keypoints,
    screenshots,
    mainImageBase64,
    skeletonImageBase64: mainImageBase64,
    feedback,
    strengths,
    improvements
  }
}

/**
 * Video analysis runs fully on-device now, so support is gated only on the
 * on-device engine being initializable. (Name kept for existing callers.)
 */
export async function checkVideoAnalysisSupport(): Promise<boolean> {
  try {
    const provider = getPoseProvider()
    await provider.init()
    return provider.isReady()
  } catch {
    return false
  }
}
