import type { ShootingFormFeedback } from '@/services/poseDetection'

export type FeedbackArea = 'elbow' | 'wrist' | 'release' | 'knee' | 'shoulder' | 'hip'
export type CoachStyle = 'concise' | 'instructional' | 'encouraging' | 'high-energy'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type CueCadence = 'every-shot' | 'every-two' | 'critical-only'
export type AudioEnvironment = 'quiet' | 'gym' | 'headphones'
export type ShotOutcome = 'make' | 'miss' | null

export interface ShootingCoachOptions {
  style: CoachStyle
  level: ExperienceLevel
  cadence: CueCadence
  environment: AudioEnvironment
}

export const DEFAULT_COACH_OPTIONS: ShootingCoachOptions = {
  style: 'instructional', level: 'intermediate', cadence: 'every-shot', environment: 'gym',
}

const PRIORITY: FeedbackArea[] = ['elbow', 'wrist', 'release', 'knee', 'shoulder', 'hip']

const COACHING_CUES: Record<FeedbackArea, string> = {
  elbow: 'Get your elbow under the ball, then finish through the middle of the rim.',
  wrist: 'Relax your shooting hand, snap your wrist, and finish with your fingers down.',
  release: 'Reach up through the rim and hold your follow-through until the ball gets there.',
  knee: 'Load your legs before the ball rises, then drive up in one smooth motion.',
  shoulder: 'Stack the ball over your shooting elbow and keep your upper body on line.',
  hip: 'Stay balanced over your base and let your body rise straight through the shot.',
}

const PRAISE = [
  'That is the shape we want. Hold that finish and repeat it.',
  'Good rep. Same balance, same release, and trust it again.',
  'Strong mechanics. Freeze your follow-through and repeat that rhythm.',
]

function directionalCue(area: FeedbackArea, feedback: ShootingFormFeedback): string {
  const tips = feedback.tips.join(' ').toLowerCase()
  if (area === 'elbow') {
    if (tips.includes('open your elbow')) return 'Give your shooting arm a clean L shape, then extend straight up.'
    if (tips.includes('tuck your elbow')) return 'Bring your elbow under the ball and keep it on the rim line.'
  }
  if (area === 'knee') {
    if (tips.includes('straighten your knees') || tips.includes('over-bend')) {
      return 'Stay a little taller in your load, then rise smoothly into the shot.'
    }
    if (tips.includes('bend your knees')) return 'Sit into your legs earlier and carry that power up through the ball.'
  }
  if (area === 'wrist') {
    if (tips.includes('raise your arm') || tips.includes('more lift')) {
      return 'Finish higher through the rim, then snap your wrist with your fingers down.'
    }
    if (tips.includes("don't over-extend")) return 'Stay smooth at release; reach up without forcing your arm past the finish.'
  }
  if (area === 'release') {
    if (tips.includes('more forward')) return 'Reach through the front of the rim and hold your finish forward.'
    if (tips.includes('more vertically') || tips.includes('vertical release')) {
      return 'Lift through the ball and finish higher for a cleaner arc.'
    }
  }
  return COACHING_CUES[area]
}

/**
 * Produce one short, actionable cue from measured feedback. One correction per
 * rep mirrors how on-court trainers avoid overloading a shooter. The cue bank
 * follows the shared language used in Jr. NBA/USA Basketball fundamentals:
 * balance, elbow under the ball, upward extension, wrist snap, and a held
 * follow-through. No cue is emitted for an unmeasured/unknown body area.
 */
export function buildLiveCoachCue(
  feedback: ShootingFormFeedback | null,
  score: number,
  shotNumber: number,
): string {
  if (!feedback) return `Shot ${shotNumber}, score ${score}. Stay balanced and hold your finish.`

  const critical = PRIORITY.find((area) => feedback[`${area}Status`] === 'critical')
  const warning = PRIORITY.find((area) => feedback[`${area}Status`] === 'warning')
  const focus = critical ?? warning

  if (focus) return `Shot ${shotNumber}, score ${score}. ${directionalCue(focus, feedback)}`
  return `Shot ${shotNumber}, score ${score}. ${PRAISE[(Math.max(1, shotNumber) - 1) % PRAISE.length]}`
}

interface Rep { score: number; focus: FeedbackArea | null; outcome: ShotOutcome }

export class ShootingCoachSession {
  private reps: Rep[] = []
  private focusCounts = new Map<FeedbackArea, number>()
  private lastFocus: FeedbackArea | null = null
  private repeated = 0
  constructor(public options: ShootingCoachOptions = DEFAULT_COACH_OPTIONS) {}

  reset(): void { this.reps = []; this.focusCounts.clear(); this.lastFocus = null; this.repeated = 0 }
  setOptions(options: ShootingCoachOptions): void { this.options = options }
  updateLastOutcome(outcome: Exclude<ShotOutcome, null>): void {
    const last = this.reps.at(-1)
    if (last) last.outcome = outcome
  }

  observe(feedback: ShootingFormFeedback | null, score: number, outcome: ShotOutcome = null): string | null {
    const shot = this.reps.length + 1
    const critical = feedback && PRIORITY.find(a => feedback[`${a}Status`] === 'critical')
    const warning = feedback && PRIORITY.find(a => feedback[`${a}Status`] === 'warning')
    const focus = critical || warning || null
    this.reps.push({ score, focus, outcome })
    if (focus) this.focusCounts.set(focus, (this.focusCounts.get(focus) ?? 0) + 1)
    this.repeated = focus && focus === this.lastFocus ? this.repeated + 1 : focus ? 1 : 0
    this.lastFocus = focus

    if (this.options.cadence === 'every-two' && shot % 2 !== 0) return null
    if (this.options.cadence === 'critical-only' && !critical) return null

    let cue = buildLiveCoachCue(feedback, score, shot)
    if (focus && this.repeated === 2) cue += ' Same focus, but make the adjustment smooth instead of forced.'
    if (focus && this.repeated >= 3) {
      const drill = this.drillFor(focus)
      const variations = [
        ` Pause the set and use the ${drill} for five slow reps.`,
        ` Reset with three controlled reps of the ${drill}.`,
        ` That pattern is persisting; isolate it now with the ${drill}.`,
      ]
      cue += variations[(this.repeated - 3) % variations.length]
    }
    const prior = this.reps.slice(-4, -1)
    if (focus && prior.length === 3 && prior.every(r => r.focus === focus) && score >= Math.max(...prior.map(r => r.score)) + 5) {
      cue = `Shot ${shot}, score ${score}. Your ${focus} improved from the last three reps. Keep that adjustment.`
    }
    if (this.reps.length >= 8) {
      const early = this.average(this.reps.slice(0, 3).map(r => r.score))
      const late = this.average(this.reps.slice(-3).map(r => r.score))
      if (early - late >= 8) cue += ' Your mechanics are fading late in the set; reset your legs and take one quality breath.'
    }
    if (outcome) cue += outcome === 'make' ? ' That one was a make.' : ' That one missed; keep the same target and apply the cue.'
    return this.applyVoice(cue)
  }

  summary(): string {
    if (!this.reps.length) return 'Set complete. No measured shots were available to summarize.'
    const common = [...this.focusCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
    const avg = Math.round(this.average(this.reps.map(r => r.score)))
    const makes = this.reps.filter(r => r.outcome === 'make').length
    const misses = this.reps.filter(r => r.outcome === 'miss').length
    const makeScores = this.reps.filter(r => r.outcome === 'make').map(r => r.score)
    const missScores = this.reps.filter(r => r.outcome === 'miss').map(r => r.score)
    const comparison = makeScores.length && missScores.length
      ? ` Mechanics averaged ${Math.round(this.average(makeScores))} on makes versus ${Math.round(this.average(missScores))} on misses.`
      : ''
    const context = makes + misses ? ` Recorded result: ${makes} makes and ${misses} misses.${comparison}` : ''
    return common
      ? `Set complete. Average score ${avg}. Main focus: ${common}. Next, use the ${this.drillFor(common)}.${context}`
      : `Set complete. Average score ${avg}. Your measured mechanics stayed solid; repeat that rhythm.${context}`
  }

  audioProfile(): { rate: number; volume: number } {
    if (this.options.environment === 'gym') return { rate: 0.92, volume: 1 }
    if (this.options.environment === 'headphones') return { rate: 1, volume: 0.72 }
    return { rate: 1, volume: 0.88 }
  }

  private drillFor(area: FeedbackArea): string {
    return ({ elbow: 'one-hand form shooting drill', wrist: 'wall follow-through drill', release: 'high-finish form drill', knee: 'one-motion chair-load drill', shoulder: 'line-to-the-rim drill', hip: 'balance-and-freeze drill' })[area]
  }
  private average(values: number[]): number { return values.reduce((a, b) => a + b, 0) / Math.max(1, values.length) }
  private applyVoice(cue: string): string {
    if (this.options.level === 'beginner') cue = cue.replace('mechanics', 'form').replace('vertical', 'straight up')
    if (this.options.level === 'advanced') cue = cue.replace('Stay balanced', 'Keep your kinetic chain stacked')
    if (this.options.style === 'concise') return cue.split('. ').slice(0, 2).join('. ')
    if (this.options.style === 'encouraging') return `Good work. ${cue}`
    if (this.options.style === 'high-energy') return `Let's go! ${cue}`
    return cue
  }
}
