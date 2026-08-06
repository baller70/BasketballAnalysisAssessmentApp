/**
 * The five phase cards must show the player's own frames once a clip has been
 * analysed — and must still show the canonical figures when it has not.
 *
 * Both halves matter. The first is the feature: every results screen draws a
 * SETUP · LOAD · RISE · RELEASE · FOLLOW-THROUGH strip, and until now each card
 * was a drawing no matter what you uploaded. The second is the promise that
 * nothing was taken away: a device with no capture, an image analysis, or a
 * shot recorded on the phone keeps exactly the strip it had before.
 */

import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { PhaseFrame, usePhaseFrames } from '@/components/shotiq/PhaseFrames'

const KEY = 'basketball_analysis_sessions'
const PHASES = ['SETUP', 'LOAD', 'RISE', 'RELEASE', 'FOLLOW-THROUGH']
const still = (tag: string) => `data:image/jpeg;base64,${tag}`

/** A session shaped the way the video upload saves one. */
const videoSession = (id: string) => ({
  id,
  date: new Date().toISOString(),
  displayDate: 'Aug 6',
  timestamp: Date.now(),
  mainImageBase64: still('main'),
  mediaType: 'video',
  // The pipeline spells the last phase FOLLOW_THROUGH; the strips print
  // FOLLOW-THROUGH. Stored exactly as the pipeline emits it.
  screenshots: ['SETUP', 'LOAD', 'RISE', 'RELEASE', 'FOLLOW_THROUGH'].map((label, i) => ({
    id: `video-${i}`, label, imageBase64: still(`${label.toLowerCase()}-${i}`),
  })),
  analysisData: { overallScore: 82, shooterLevel: 'Developing', angles: {}, detectedFlaws: [], measurements: {} },
})

/** The strip as every results screen draws it. */
function Strip({ sessionId, latest }: { sessionId?: string | null; latest?: boolean }) {
  const frames = usePhaseFrames(sessionId, { fallbackToLatest: latest })
  return (
    <div>
      {PHASES.map((p) => <PhaseFrame key={p} phase={p} frames={frames} height={41} />)}
    </div>
  )
}

const stillSrcs = () => screen.queryAllByRole('img')
  .map((el) => el.getAttribute('src') ?? '')
  .filter((src) => src.startsWith('data:'))

const figureSrcs = () => Array.from(document.querySelectorAll('img'))
  .map((el) => el.getAttribute('src') ?? '')
  .filter((src) => src.includes('078-phase-'))

beforeEach(() => window.localStorage.clear())

describe('the five phase cards', () => {
  it('shows the analysed frame on each of the five cards', async () => {
    window.localStorage.setItem(KEY, JSON.stringify([videoSession('sess-a')]))
    render(<Strip sessionId="sess-a" />)

    await waitFor(() => expect(stillSrcs()).toHaveLength(5))
    // Each card got its OWN frame — five distinct stills, not one repeated.
    expect(new Set(stillSrcs()).size).toBe(5)
    expect(figureSrcs()).toHaveLength(0)

    for (const phase of PHASES) {
      expect(screen.getByAltText(`${phase} frame from your shot`)).toBeTruthy()
    }
  })

  it('resolves FOLLOW_THROUGH from the pipeline onto the FOLLOW-THROUGH card', async () => {
    window.localStorage.setItem(KEY, JSON.stringify([videoSession('sess-a')]))
    render(<Strip sessionId="sess-a" />)
    await waitFor(() =>
      expect(screen.getByAltText('FOLLOW-THROUGH frame from your shot').getAttribute('src'))
        .toBe(still('follow_through-4')))
  })

  it('keeps the canonical figures when this device has analysed nothing', async () => {
    render(<Strip sessionId="sess-a" />)
    await waitFor(() => expect(figureSrcs()).toHaveLength(5))
    expect(stillSrcs()).toHaveLength(0)
  })

  it('keeps the canonical figures for an analysis with no stills', async () => {
    const imageOnly = { ...videoSession('sess-b'), mediaType: 'image', screenshots: [] }
    window.localStorage.setItem(KEY, JSON.stringify([imageOnly]))
    render(<Strip sessionId="sess-b" />)
    await waitFor(() => expect(figureSrcs()).toHaveLength(5))
    expect(stillSrcs()).toHaveLength(0)
  })

  it('never borrows another shot\'s frames for an analysis of its own', async () => {
    // A clip analysed on this device plus an analysis (an iOS capture) whose
    // session this device has never seen. The second must NOT inherit the
    // first's frames — that is the borrowed-content defect, not the feature.
    window.localStorage.setItem(KEY, JSON.stringify([videoSession('sess-a')]))
    render(<Strip sessionId="ios-1754400000-abc" />)
    await waitFor(() => expect(figureSrcs()).toHaveLength(5))
    expect(stillSrcs()).toHaveLength(0)
  })

  it('uses the newest clip only where a caller asks for it', async () => {
    window.localStorage.setItem(KEY, JSON.stringify([videoSession('sess-a')]))
    // The post-upload screen has no id to match on and wants the clip just
    // analysed; without the opt-in the same call shows figures.
    const { unmount } = render(<Strip sessionId={null} latest />)
    await waitFor(() => expect(stillSrcs()).toHaveLength(5))
    unmount()

    render(<Strip sessionId={null} />)
    await waitFor(() => expect(figureSrcs()).toHaveLength(5))
  })
})
