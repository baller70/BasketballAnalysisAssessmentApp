/**
 * Coach-Centric Analysis Service
 * 
 * This service provides analysis that sounds like a REAL basketball coach.
 * Every piece of feedback is built around the drill's coaching points (tips).
 * 
 * The coach doesn't just say "good job" or "work on form" - they give
 * SPECIFIC, ACTIONABLE direction based on what they see.
 */

// ============================================
// COACHING POINT EVALUATION
// ============================================

export interface CoachingPointEvaluation {
  coachingPoint: string          // The original tip/coaching point
  status: 'executing' | 'needs_work' | 'not_visible'
  coachObservation: string       // What the coach sees
  correction?: string            // How to fix it (if needs_work)
  cue?: string                   // Quick verbal cue to remember
}

export interface CoachAnalysis {
  // Overall assessment
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  gradeDescription: string
  
  // Coaching point breakdown
  coachingPointEvaluations: CoachingPointEvaluation[]
  
  // Priority focus - THE ONE THING to fix first
  priorityFocus: {
    issue: string
    why: string
    howToFix: string
    drillToHelp?: string
    cue: string
  }
  
  // What's working - reinforce the good
  reinforcement: {
    point: string
    whyItMatters: string
  }[]
  
  // Next steps
  nextSteps: {
    immediate: string      // What to do right now
    thisWeek: string       // What to work on this week
    progression: string    // What drill to progress to
  }
  
  // Coach's voice - sounds like a real coach
  coachSays: string
}

// ============================================
// COACHING CUES DATABASE
// These are the quick verbal cues coaches use
// ============================================

export const COACHING_CUES: Record<string, string[]> = {
  // Elbow cues
  elbow: [
    "Elbow under, not out",
    "Point your elbow at the rim",
    "Elbow in the cookie jar",
    "Straight line to the basket",
    "No chicken wing",
    "Elbow to target"
  ],
  
  // Wrist/Release cues
  release: [
    "Snap it like you're reaching into a cookie jar",
    "Wave goodbye to the ball",
    "Fingers in the rim",
    "Gooseneck finish",
    "Flick the light switch",
    "Fingertips, not palm"
  ],
  
  // Follow-through cues
  'follow-through': [
    "Hold your follow-through until it goes in",
    "Reach into the basket",
    "Freeze the finish",
    "Hand in the cookie jar",
    "Point at where you want it to go",
    "Let your hand tell the ball where to go"
  ],
  
  // Balance cues
  balance: [
    "Feet shoulder width",
    "Shooting foot slightly ahead",
    "Bend your knees, not your back",
    "Load your legs",
    "Power from the ground up",
    "Stay on balance through the shot"
  ],
  
  // Guide hand cues
  guideHand: [
    "Guide hand is just a guide",
    "Thumb stays quiet",
    "Let it go early",
    "No thumb flick",
    "Balance only, no push",
    "Guide hand off before release"
  ],
  
  // General form cues
  general: [
    "One motion, not two",
    "Smooth is fast",
    "Same shot every time",
    "Trust your form",
    "Let the legs do the work",
    "Rhythm and timing"
  ]
}

// Get a random cue for a focus area
export function getCoachingCue(focusArea: string): string {
  const cues = COACHING_CUES[focusArea] || COACHING_CUES.general
  return cues[Math.floor(Math.random() * cues.length)]
}

// ============================================
// DRILL PROGRESSION MAP
// What drill should they do next?
// ============================================

export const DRILL_PROGRESSIONS: Record<string, {
  ifStruggling: string
  ifMastering: string
  complementary: string
}> = {
  'fingertip-ball-control': {
    ifStruggling: 'Start with a smaller ball or tennis ball to feel the fingertips',
    ifMastering: 'Progress to Wrist Bend Position drill',
    complementary: 'Pair with One Hand Wall Shots'
  },
  'wrist-cock-hold': {
    ifStruggling: 'Go back to Fingertip Ball Control',
    ifMastering: 'Progress to Hand Under Ball drill',
    complementary: 'Pair with Gooseneck Freeze'
  },
  'hand-under-ball': {
    ifStruggling: 'Work on Wrist Bend Position first',
    ifMastering: 'Progress to One Hand Wall Shots',
    complementary: 'Pair with Mirror Form Check'
  },
  'guide-hand-off': {
    ifStruggling: 'Start with Thumb Checker drill',
    ifMastering: 'Progress to full shooting with guide hand awareness',
    complementary: 'Pair with One Hand Wall Shots'
  },
  'thumb-check': {
    ifStruggling: 'Slow down - do it in slow motion',
    ifMastering: 'Progress to Guide Hand Release drill',
    complementary: 'Pair with One Hand Wall Shots'
  },
  'one-hand-wall-shots': {
    ifStruggling: 'Go back to Hand Under Ball positioning',
    ifMastering: 'Progress to One Hand Form Shots at the basket',
    complementary: 'Pair with Gooseneck Freeze'
  },
  'elbow-to-wall': {
    ifStruggling: 'Do it without the ball first - just the motion',
    ifMastering: 'Progress to String Elbow Guide',
    complementary: 'Pair with Mirror Form Check'
  },
  'elbow-string-drill': {
    ifStruggling: 'Go back to Elbow On The Wall',
    ifMastering: 'Progress to full shooting with elbow focus',
    complementary: 'Pair with Slow Motion Form'
  },
  'mirror-form-check': {
    ifStruggling: 'Break it down - check one thing at a time',
    ifMastering: 'Progress to video recording your form',
    complementary: 'Pair with Slow Motion Shooting'
  },
  'gooseneck-hold': {
    ifStruggling: 'Practice the snap without the ball first',
    ifMastering: 'Progress to Reach Into Basket drill',
    complementary: 'Pair with One Hand Wall Shots'
  },
  'reach-into-basket': {
    ifStruggling: 'Go back to Gooseneck Freeze',
    ifMastering: 'Progress to full shooting with follow-through focus',
    complementary: 'Pair with Slow Motion Form'
  },
  'balance-check-freeze': {
    ifStruggling: 'Practice stance without the ball',
    ifMastering: 'Progress to One Leg Balance',
    complementary: 'Pair with Slow Motion Shooting'
  },
  'one-leg-balance-shot': {
    ifStruggling: 'Go back to Balance Freeze',
    ifMastering: 'Progress to shooting off the catch with balance focus',
    complementary: 'Pair with game-speed shooting'
  },
  'slow-motion-form': {
    ifStruggling: 'Break it into phases - legs, then core, then arm',
    ifMastering: 'Progress to normal speed with same awareness',
    complementary: 'Record and review every session'
  }
}

// ============================================
// GRADE DESCRIPTIONS
// ============================================

export const GRADE_DESCRIPTIONS: Record<string, {
  label: string
  description: string
  coachTone: string
}> = {
  'A': {
    label: 'Excellent',
    description: 'Executing the drill correctly. Keep building those reps.',
    coachTone: 'This is exactly what we want to see. Your muscle memory is developing correctly.'
  },
  'B': {
    label: 'Good',
    description: 'Solid fundamentals with minor adjustments needed.',
    coachTone: 'Good work. You\'re on the right track. Let\'s fine-tune a couple things.'
  },
  'C': {
    label: 'Developing',
    description: 'Understanding the concept but execution needs work.',
    coachTone: 'You know what to do, now we need to get your body to do it consistently.'
  },
  'D': {
    label: 'Needs Focus',
    description: 'Significant corrections needed. Focus on one thing at a time.',
    coachTone: 'Let\'s slow down and fix this. One thing at a time. Quality over quantity.'
  },
  'F': {
    label: 'Reset',
    description: 'Go back to basics. Master the foundation before progressing.',
    coachTone: 'Stop. We need to rebuild this from the ground up. That\'s okay - better now than later.'
  }
}

// ============================================
// VISION AI PROMPT GENERATOR
// ============================================

export function generateCoachingPrompt(
  drillName: string,
  drillDescription: string,
  coachingPoints: string[], // The tips array from the drill
  focusArea: string
): string {
  return `You are an experienced basketball shooting coach analyzing a player's drill execution.

DRILL: ${drillName}
DRILL PURPOSE: ${drillDescription}
FOCUS AREA: ${focusArea}

THE COACHING POINTS FOR THIS DRILL ARE:
${coachingPoints.map((point, i) => `${i + 1}. ${point}`).join('\n')}

YOUR TASK: Look at this image and evaluate EACH coaching point.

For each coaching point, determine:
- Is the player EXECUTING it correctly?
- Does it NEED WORK?
- Or is it NOT VISIBLE in this frame?

Then provide:
1. OVERALL GRADE (A/B/C/D/F) based on how well they're executing the coaching points
2. For each coaching point that needs work, explain WHAT you see and HOW to fix it
3. Identify the #1 PRIORITY - the single most important thing to fix first
4. Identify what they're doing WELL - reinforce the positive

RESPOND IN THIS EXACT JSON FORMAT:
{
  "overallGrade": "A" | "B" | "C" | "D" | "F",
  "whatISee": "Brief description of what the player is doing in the image",
  "coachingPointEvaluations": [
    {
      "coachingPoint": "The original coaching point text",
      "status": "executing" | "needs_work" | "not_visible",
      "coachObservation": "What you actually see related to this point",
      "correction": "How to fix it (only if needs_work)",
      "cue": "Quick verbal cue to remember (only if needs_work)"
    }
  ],
  "priorityFocus": {
    "issue": "The #1 thing to fix",
    "why": "Why this matters",
    "howToFix": "Specific instruction to correct it",
    "cue": "Quick verbal cue"
  },
  "reinforcement": [
    {
      "point": "What they're doing well",
      "whyItMatters": "Why this is important"
    }
  ],
  "coachSays": "A 2-3 sentence message that sounds like a real coach talking to the player"
}

BE SPECIFIC. Don't say "good form" - say "your elbow is directly under the ball, that's exactly right."
BE HONEST. If something needs work, say it clearly but constructively.
BE A COACH. Sound like a real basketball coach, not a robot.`
}

// ============================================
// PROCESS VISION AI RESPONSE
// ============================================

interface RawVisionResponse {
  overallGrade?: 'A' | 'B' | 'C' | 'D' | 'F'
  coachingPointEvaluations?: CoachingPointEvaluation[]
  priorityFocus?: {
    issue: string
    why: string
    howToFix: string
    cue: string
  }
  reinforcement?: Array<{
    point: string
    whyItMatters: string
  }>
  coachSays?: string
}

export function processCoachingResponse(
  rawResponse: RawVisionResponse,
  drillId: string,
  drillName: string,
  coachingPoints: string[],
  focusArea: string
): CoachAnalysis {
  const grade = rawResponse.overallGrade || 'C'
  const gradeInfo = GRADE_DESCRIPTIONS[grade] || GRADE_DESCRIPTIONS['C']
  const progression = DRILL_PROGRESSIONS[drillId]
  
  // Determine next steps based on grade
  let nextSteps = {
    immediate: '',
    thisWeek: '',
    progression: ''
  }
  
  if (rawResponse.overallGrade === 'A' || rawResponse.overallGrade === 'B') {
    nextSteps = {
      immediate: 'Keep doing what you\'re doing. Get more reps in.',
      thisWeek: 'Increase volume while maintaining quality.',
      progression: progression?.ifMastering || 'Progress to the next drill in the sequence.'
    }
  } else if (rawResponse.overallGrade === 'C') {
    nextSteps = {
      immediate: `Focus on: ${rawResponse.priorityFocus?.issue || 'the coaching points'}`,
      thisWeek: 'Slow down and do quality reps. 10 perfect reps beat 100 sloppy ones.',
      progression: progression?.complementary || 'Pair with a complementary drill.'
    }
  } else {
    nextSteps = {
      immediate: 'Stop and reset. Focus on ONE thing only.',
      thisWeek: 'Master the basics before adding volume.',
      progression: progression?.ifStruggling || 'Go back to the previous drill in the sequence.'
    }
  }
  
  return {
    overallGrade: rawResponse.overallGrade || 'C',
    gradeDescription: gradeInfo.description,
    coachingPointEvaluations: rawResponse.coachingPointEvaluations || coachingPoints.map(point => ({
      coachingPoint: point,
      status: 'not_visible' as const,
      coachObservation: 'Could not evaluate from this frame'
    })),
    priorityFocus: rawResponse.priorityFocus || {
      issue: 'Review the coaching points',
      why: 'Fundamentals are the foundation',
      howToFix: 'Focus on one coaching point at a time',
      drillToHelp: drillName,
      cue: getCoachingCue(focusArea)
    },
    reinforcement: rawResponse.reinforcement || [{
      point: 'Showing up and putting in work',
      whyItMatters: 'Consistency is the key to improvement'
    }],
    nextSteps,
    coachSays: rawResponse.coachSays || gradeInfo.coachTone
  }
}

// ============================================
// FALLBACK ANALYSIS (if Vision AI fails)
// ============================================

export function generateFallbackAnalysis(
  drillId: string,
  drillName: string,
  coachingPoints: string[],
  focusArea: string
): CoachAnalysis {
  const progression = DRILL_PROGRESSIONS[drillId]
  
  return {
    overallGrade: 'C',
    gradeDescription: 'Unable to analyze video frame. Review the coaching points below.',
    coachingPointEvaluations: coachingPoints.map(point => ({
      coachingPoint: point,
      status: 'not_visible' as const,
      coachObservation: 'Self-check: Are you doing this?'
    })),
    priorityFocus: {
      issue: 'Self-evaluate against the coaching points',
      why: 'You know your form better than anyone',
      howToFix: 'Record yourself and compare to the coaching points',
      drillToHelp: drillName,
      cue: getCoachingCue(focusArea)
    },
    reinforcement: [{
      point: 'You\'re putting in the work',
      whyItMatters: 'Showing up is half the battle'
    }],
    nextSteps: {
      immediate: 'Record another rep and try again',
      thisWeek: 'Focus on the coaching points for this drill',
      progression: progression?.complementary || 'Continue with this drill'
    },
    coachSays: 'I couldn\'t get a clear read on that one. Let\'s try again. Focus on the coaching points and record another rep.'
  }
}

