import { describe, expect, it } from 'vitest'

import { buildLiveCoachCue, ShootingCoachSession } from '@/services/liveShootingCoach'
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

  it('does not tell an over-bent shooter to load deeper', () => {
    const cue = buildLiveCoachCue({
      ...good,
      kneeStatus: 'warning',
      tips: ["Don't over-bend your knees"],
    }, 67, 5)
    expect(cue).toContain('Stay a little taller')
    expect(cue).not.toContain('Sit into your legs')
  })

  it('gives the opposite knee direction when more bend is measured', () => {
    const cue = buildLiveCoachCue({
      ...good,
      kneeStatus: 'critical',
      tips: ['Bend your knees more to generate power'],
    }, 61, 6)
    expect(cue).toContain('Sit into your legs earlier')
  })
})

describe('ShootingCoachSession', () => {
  it('detects repetition, recommends a drill, and summarizes the set', () => {
    const coach = new ShootingCoachSession()
    const elbow = { ...good, elbowStatus: 'critical' as const }
    coach.observe(elbow, 55); coach.observe(elbow, 57)
    expect(coach.observe(elbow, 58)).toContain('one-hand form shooting drill')
    expect(coach.summary()).toContain('Main focus: elbow')
  })

  it('recognizes improvement over the previous three reps', () => {
    const coach = new ShootingCoachSession()
    const wrist = { ...good, wristStatus: 'warning' as const }
    coach.observe(wrist, 60); coach.observe(wrist, 61); coach.observe(wrist, 62)
    expect(coach.observe(wrist, 70)).toContain('improved from the last three reps')
  })

  it('supports cadence and critical-only modes', () => {
    const everyTwo = new ShootingCoachSession({ style: 'concise', level: 'beginner', cadence: 'every-two', environment: 'quiet' })
    expect(everyTwo.observe(good, 80)).toBeNull()
    expect(everyTwo.observe(good, 82)).not.toBeNull()
    const critical = new ShootingCoachSession({ style: 'instructional', level: 'advanced', cadence: 'critical-only', environment: 'gym' })
    expect(critical.observe({ ...good, elbowStatus: 'warning' }, 70)).toBeNull()
    expect(critical.observe({ ...good, elbowStatus: 'critical' }, 60)).not.toBeNull()
  })

  it('detects late-set fatigue only after enough measured reps', () => {
    const coach = new ShootingCoachSession()
    ;[90, 89, 91, 82, 80, 78, 76].forEach(score => coach.observe(good, score))
    expect(coach.observe(good, 74)).toContain('mechanics are fading late in the set')
  })

  it('adds make/miss context and uses environment audio profiles', () => {
    const coach = new ShootingCoachSession({ style: 'high-energy', level: 'intermediate', cadence: 'every-shot', environment: 'headphones' })
    expect(coach.observe(good, 88, 'make')).toContain('That one was a make')
    expect(coach.audioProfile()).toEqual({ rate: 1, volume: 0.72 })
    expect(coach.summary()).toContain('1 makes and 0 misses')
  })

  it('compares measured mechanics on calibrated makes and misses', () => {
    const coach = new ShootingCoachSession()
    coach.observe(good, 90); coach.updateLastOutcome('make')
    coach.observe(good, 70); coach.updateLastOutcome('miss')
    expect(coach.summary()).toContain('Mechanics averaged 90 on makes versus 70 on misses')
  })

  it('adapts trainer style and experience language', () => {
    const encouraging = new ShootingCoachSession({ style: 'encouraging', level: 'beginner', cadence: 'every-shot', environment: 'quiet' })
    expect(encouraging.observe(good, 85)).toMatch(/^Good work\./)
    const energetic = new ShootingCoachSession({ style: 'high-energy', level: 'advanced', cadence: 'every-shot', environment: 'gym' })
    expect(energetic.observe(null, 65)).toContain("Let's go!")
  })
})
