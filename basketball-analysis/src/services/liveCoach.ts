import type { ShootingFormFeedback } from '@/services/poseDetection'

type FeedbackArea = 'elbow' | 'wrist' | 'release' | 'knee' | 'shoulder' | 'hip'

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

  if (focus) return `Shot ${shotNumber}, score ${score}. ${COACHING_CUES[focus]}`
  return `Shot ${shotNumber}, score ${score}. ${PRAISE[(Math.max(1, shotNumber) - 1) % PRAISE.length]}`
}
