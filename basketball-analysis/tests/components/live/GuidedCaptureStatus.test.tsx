import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { GuidedCaptureStatus } from '@/components/live/GuidedCaptureStatus'
import type { CaptureReadiness } from '@/lib/capture/guidedCapture'

const readiness = (overrides: Partial<CaptureReadiness>): CaptureReadiness => ({
  status: 'checking',
  ready: false,
  checks: [],
  failedChecks: [],
  primaryIssue: null,
  ...overrides,
})

describe('GuidedCaptureStatus', () => {
  it('shows ShotIQ setup progress while capture checks are pending', () => {
    render(<GuidedCaptureStatus readiness={readiness({
      primaryIssue: {
        id: 'model',
        label: 'ShotIQ Vision',
        status: 'pending',
        message: 'Loading ShotIQ Vision…',
      },
    })} />)

    expect(screen.getByRole('status').textContent).toContain('SETTING UP')
    expect(screen.getByRole('status').textContent).toContain('Loading ShotIQ Vision')
  })

  it('shows the primary action when capture needs attention', () => {
    const onRecordAnyway = vi.fn()
    render(<GuidedCaptureStatus onRecordAnyway={onRecordAnyway} readiness={readiness({
      status: 'needs_attention',
      primaryIssue: {
        id: 'full_body',
        label: 'Full body',
        status: 'fail',
        message: 'Step back until your head and both feet are visible',
      },
      failedChecks: [{
        id: 'full_body',
        label: 'Full body',
        status: 'fail',
        message: 'Step back until your head and both feet are visible',
      }],
    })} />)

    expect(screen.getByRole('status').textContent).toContain('ADJUST CAMERA')
    expect(screen.getByRole('status').textContent).toContain('Step back until your head and both feet are visible')
    fireEvent.click(screen.getByRole('button', { name: 'Record without tracking lock' }))
    expect(onRecordAnyway).toHaveBeenCalledOnce()
  })

  it('shows a ready state when every enabled capture check passes', () => {
    render(<GuidedCaptureStatus readiness={readiness({
      status: 'ready',
      ready: true,
    })} />)

    expect(screen.getByRole('status').textContent).toContain('READY TO RECORD')
  })
})
