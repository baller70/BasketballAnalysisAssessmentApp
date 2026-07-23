import { describe, expect, it } from 'vitest'

import { buildLiveCoachCue } from '@/services/liveCoach'
import type { ShootingFormFeedback } from '@/services/poseDetection'

const good: ShootingFormFeedback = {
  elbowStatus: 'good', elbowMessage: '', wristStatus: 'good', wristMessage: '',
  releaseStatus: 'good', releaseMessage: '', kneeStatus: 'good', kneeMessage: '',
  shoulderStatus: 'good', shoulderMessage: '', hipStatus: 'good', hipMessage: '',
  overallScore: 90, tips: [],
}

describe('buildLiveCoachCue', () => {
  it('prioritizes one critical measured correction', () => {
    const cue = buildLiveCoachCue({
      ...good,
      elbowStatus: 'critical',
      kneeStatus: 'warning',
    }, 58, 4)
    expect(cue).toBe('Shot 4, score 58. Get your elbow under the ball, then finish through the middle of the rim.')
    expect(cue).not.toContain('legs')
  })

  it('uses a warning when no critical area exists', () => {
    expect(buildLiveCoachCue({ ...good, wristStatus: 'warning' }, 72, 2))
      .toContain('snap your wrist')
  })

  it('reinforces a good repetition without inventing a flaw', () => {
    const cue = buildLiveCoachCue(good, 91, 3)
    expect(cue).toContain('Strong mechanics')
    expect(cue).not.toContain('Get your elbow')
  })

  it('gives a neutral fundamental when measurements are unavailable', () => {
    expect(buildLiveCoachCue(null, 65, 1))
      .toBe('Shot 1, score 65. Stay balanced and hold your finish.')
  })
})
