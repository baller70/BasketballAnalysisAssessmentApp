import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  HoopCalibrationOverlay,
  loadRimCalibration,
  rimCalibrationStorageKey,
  saveRimCalibration,
} from '@/components/live/HoopCalibrationOverlay'
import type { RimCalibration } from '@/lib/vision/objectTracking'

const rim: RimCalibration = {
  centerX: 0.7,
  centerY: 0.2,
  width: 0.14,
  height: 0.12,
  calibratedAtMs: 123,
  source: 'manual',
}

beforeEach(() => localStorage.clear())

describe('HoopCalibrationOverlay', () => {
  it('converts a preview tap into source-frame hoop calibration', () => {
    const onChange = vi.fn()
    render(
      <HoopCalibrationOverlay
        frameSize={{ width: 1280, height: 720 }}
        facingMode="environment"
        orientation="portrait"
        value={null}
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Calibrate hoop' }))
    const target = screen.getByRole('button', { name: 'Tap the center of the hoop' })
    vi.spyOn(target, 'getBoundingClientRect').mockReturnValue({
      x: 0, y: 0, left: 0, top: 0, right: 200, bottom: 400,
      width: 200, height: 400, toJSON: () => ({}),
    })
    fireEvent.click(target, { clientX: 100, clientY: 200 })

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toMatchObject({
      centerX: 0.5,
      centerY: 0.5,
      source: 'manual',
    })
  })

  it('keeps the record controls unobstructed outside calibration and supports clear', () => {
    const onChange = vi.fn()
    const { container } = render(
      <HoopCalibrationOverlay
        frameSize={{ width: 1280, height: 720 }}
        facingMode="environment"
        orientation="landscape"
        value={rim}
        onChange={onChange}
      />,
    )

    expect(screen.getByText('Hoop locked')).toBeTruthy()
    expect(container.firstElementChild?.className).toContain('pointer-events-none')
    fireEvent.click(screen.getByRole('button', { name: 'Clear hoop calibration' }))
    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('renders a trusted ball observation on the same overlay layer', () => {
    const { container } = render(
      <HoopCalibrationOverlay
        frameSize={{ width: 1280, height: 720 }}
        facingMode="environment"
        orientation="landscape"
        value={rim}
        ball={{
          centerX: 0.5,
          centerY: 0.4,
          width: 0.05,
          height: 0.08,
          confidence: 0.88,
          timestampMs: 100,
        }}
        onChange={() => undefined}
      />,
    )

    expect(container.querySelector('[data-ball-tracking="trusted"]')).toBeTruthy()
    expect(screen.getByText('BALL 88%')).toBeTruthy()
  })

  it('persists separate calibration values per camera and orientation', () => {
    const portraitRear = rimCalibrationStorageKey('environment', 'portrait')
    const landscapeRear = rimCalibrationStorageKey('environment', 'landscape')
    const portraitFront = rimCalibrationStorageKey('user', 'portrait')

    expect(new Set([portraitRear, landscapeRear, portraitFront]).size).toBe(3)
    saveRimCalibration(portraitRear, rim)
    expect(loadRimCalibration(portraitRear)).toEqual(rim)
    expect(loadRimCalibration(landscapeRear)).toBeNull()
    saveRimCalibration(portraitRear, null)
    expect(loadRimCalibration(portraitRear)).toBeNull()
  })

  it('ignores corrupt persisted calibration', () => {
    const key = rimCalibrationStorageKey('environment', 'portrait')
    localStorage.setItem(key, '{"centerX":99}')
    expect(loadRimCalibration(key)).toBeNull()
  })
})
