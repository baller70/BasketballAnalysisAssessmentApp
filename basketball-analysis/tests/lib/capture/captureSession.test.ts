import { describe, expect, it } from 'vitest'
import {
  buildCaptureSessionMetadata,
  normalizeCameraFacing,
  normalizeCaptureOrientation,
  normalizeCapturePlatform,
} from '@/lib/capture/captureSession'

describe('capture session metadata builder', () => {
  it('builds a normalized native live session without browser globals', () => {
    const payload = buildCaptureSessionMetadata({
      mode: 'shot_tracking',
      source: 'live',
      platform: 'ios',
      deviceModel: '  iPhone 12  ',
      cameraFacing: 'rear',
      orientation: 'portrait',
      poseProvider: 'native',
      poseModel: 'ShotIQVision',
      frameWidth: 1920,
      frameHeight: 1080,
      readinessStatus: 'recording',
      readinessChecks: { camera: 'pass' },
    })

    expect(payload).toEqual({
      mode: 'shot_tracking',
      source: 'live',
      platform: 'ios',
      cameraFacing: 'rear',
      orientation: 'portrait',
      poseProvider: 'native',
      poseModel: 'ShotIQVision',
      frameWidth: 1920,
      frameHeight: 1080,
      readinessStatus: 'recording',
      readinessChecks: { camera: 'pass' },
      deviceModel: 'iPhone 12',
    })
  })

  it('omits empty and invalid optional values so the API can validate it', () => {
    const payload = buildCaptureSessionMetadata({
      mode: 'form',
      source: 'uploaded_video',
      platform: 'web',
      deviceModel: '   ',
      poseProvider: null,
      poseModel: undefined,
      frameWidth: 0,
      frameHeight: 10.5,
    })

    expect(payload).toEqual({
      mode: 'form',
      source: 'uploaded_video',
      platform: 'web',
      readinessStatus: 'checking',
    })
  })

  it('normalizes runtime camera, orientation, and platform values', () => {
    expect(normalizeCameraFacing('user')).toBe('front')
    expect(normalizeCameraFacing('environment')).toBe('rear')
    expect(normalizeCameraFacing('unknown')).toBe('unknown')
    expect(normalizeCaptureOrientation('landscape')).toBe('landscape')
    expect(normalizeCaptureOrientation('sideways')).toBe('portrait')
    expect(normalizeCapturePlatform('ios')).toBe('ios')
    expect(normalizeCapturePlatform('macos')).toBe('web')
  })
})
