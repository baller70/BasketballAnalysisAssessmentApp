/**
 * Drill Analysis Service
 * 
 * This service provides AI-powered analysis of drill videos.
 * It understands each drill's requirements, correct form, and common mistakes,
 * allowing it to give professional, drill-specific feedback.
 */

// ============================================
// DRILL ANALYSIS CRITERIA DATABASE
// ============================================

export interface DrillAnalysisCriteria {
  drillId: string
  drillName: string
  focusArea: string
  
  // What the AI should look for
  correctFormCriteria: string[]
  commonMistakes: string[]
  keyBodyParts: string[]  // Which body parts to focus on
  
  // Scoring weights (0-1, should sum to 1)
  scoringWeights: {
    technique: number
    consistency: number
    bodyPosition: number
    timing: number
  }
  
  // AI prompt context for analysis
  analysisPrompt: string
}

// Comprehensive drill analysis criteria for each drill
export const DRILL_ANALYSIS_CRITERIA: Record<string, DrillAnalysisCriteria> = {
  // ========== HAND PLACEMENT & GRIP DRILLS ==========
  'fingertip-ball-control': {
    drillId: 'fingertip-ball-control',
    drillName: 'FINGERTIP BALL CONTROL',
    focusArea: 'release',
    correctFormCriteria: [
      'Ball rests on fingertips only, not in palm',
      'Visible gap between palm and ball',
      'Fingers spread wide like a spider',
      'Ball balanced and controlled',
      'Wrist slightly cocked back'
    ],
    commonMistakes: [
      'Palm touching the ball',
      'Fingers too close together',
      'Gripping too tightly',
      'Ball slipping or unstable',
      'Wrist not cocked properly'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder'],
    scoringWeights: {
      technique: 0.5,
      consistency: 0.2,
      bodyPosition: 0.2,
      timing: 0.1
    },
    analysisPrompt: `Analyze this FINGERTIP BALL CONTROL drill video. Focus on:
1. Is there a visible gap between the palm and the ball?
2. Are the fingers spread wide and only the fingertips touching?
3. Is the ball stable and controlled?
4. Is the wrist properly cocked back?
Look for the common mistake of the palm touching the ball.`
  },

  'wrist-cock-hold': {
    drillId: 'wrist-cock-hold',
    drillName: 'WRIST BEND POSITION',
    focusArea: 'release',
    correctFormCriteria: [
      'Wrist bent back showing wrinkles on back of wrist',
      'Ball positioned on fingertips',
      'Elbow directly under the ball',
      'Elbow not flaring out to the side',
      'Ball feels ready to release'
    ],
    commonMistakes: [
      'Wrist not bent back far enough',
      'Elbow sticking out to the side',
      'Ball in palm instead of on fingertips',
      'Tension in shoulders',
      'Inconsistent wrist position'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder'],
    scoringWeights: {
      technique: 0.5,
      consistency: 0.3,
      bodyPosition: 0.15,
      timing: 0.05
    },
    analysisPrompt: `Analyze this WRIST BEND POSITION drill video. Focus on:
1. Is the wrist bent back far enough to show wrinkles?
2. Is the elbow directly under the ball (not flared out)?
3. Is the ball resting on fingertips?
4. Is the position held consistently?
Check for the common mistake of insufficient wrist cock.`
  },

  'hand-under-ball': {
    drillId: 'hand-under-ball',
    drillName: 'HAND UNDER THE BALL',
    focusArea: 'release',
    correctFormCriteria: [
      'Shooting hand centered directly under the ball',
      'Hand not on the side of the ball',
      'Fingers spread and pointing back toward body',
      'Wrist bent back properly',
      'Ball sits like on a table'
    ],
    commonMistakes: [
      'Hand on the side of the ball instead of under',
      'Fingers not spread properly',
      'Wrist not cocked',
      'Ball off-center on hand',
      'Elbow flaring out'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow'],
    scoringWeights: {
      technique: 0.5,
      consistency: 0.25,
      bodyPosition: 0.2,
      timing: 0.05
    },
    analysisPrompt: `Analyze this HAND UNDER THE BALL drill video. Focus on:
1. Is the shooting hand centered directly under the ball?
2. Are the fingers spread and pointing back toward the body?
3. Is the wrist properly bent back?
4. Does the ball sit stable like on a table?
Check for the common mistake of hand being on the side of the ball.`
  },

  // ========== GUIDE HAND DISCIPLINE DRILLS ==========
  'guide-hand-off': {
    drillId: 'guide-hand-off',
    drillName: 'GUIDE HAND RELEASE',
    focusArea: 'release',
    correctFormCriteria: [
      'Guide hand releases from ball before shot release',
      'Guide hand stays still after release',
      'Guide hand does not push or flick',
      'Ball has pure backspin (no side spin)',
      'Shooting hand does all the work'
    ],
    commonMistakes: [
      'Guide hand pushing the ball',
      'Guide hand thumb flicking',
      'Guide hand following through with the shot',
      'Ball spinning sideways',
      'Guide hand releasing too late'
    ],
    keyBodyParts: ['left_wrist', 'right_wrist', 'left_elbow', 'right_elbow'],
    scoringWeights: {
      technique: 0.45,
      consistency: 0.3,
      bodyPosition: 0.15,
      timing: 0.1
    },
    analysisPrompt: `Analyze this GUIDE HAND RELEASE drill video. Focus on:
1. Does the guide hand release BEFORE the shot is released?
2. Does the guide hand stay still after releasing?
3. Is there any thumb flick or push from the guide hand?
4. Does the ball have pure backspin (not side spin)?
The guide hand should be like a kickstand - balance only, no push.`
  },

  'thumb-check': {
    drillId: 'thumb-check',
    drillName: 'THUMB CHECKER',
    focusArea: 'release',
    correctFormCriteria: [
      'Guide hand thumb stays completely still',
      'No thumb flick during release',
      'Guide hand relaxed, not tense',
      'Ball has pure backspin',
      'Consistent thumb position on every shot'
    ],
    commonMistakes: [
      'Thumb flicking during release',
      'Thumb pushing the ball',
      'Tense/gripping guide hand',
      'Ball spinning sideways from thumb interference',
      'Inconsistent thumb position'
    ],
    keyBodyParts: ['left_wrist', 'right_wrist'],
    scoringWeights: {
      technique: 0.5,
      consistency: 0.3,
      bodyPosition: 0.1,
      timing: 0.1
    },
    analysisPrompt: `Analyze this THUMB CHECKER drill video. Focus specifically on:
1. Does the guide hand thumb stay completely still during the shot?
2. Is there ANY thumb movement or flick?
3. Is the guide hand relaxed or tense?
4. Does the ball spin purely backward or does it have side spin?
A moving thumb is the #1 cause of inconsistent shooting.`
  },

  'one-hand-wall-shots': {
    drillId: 'one-hand-wall-shots',
    drillName: 'ONE HAND WALL SHOTS',
    focusArea: 'release',
    correctFormCriteria: [
      'Only shooting hand used (no guide hand)',
      'Ball has pure backspin',
      'Ball travels in straight line',
      'Consistent release point',
      'Full follow-through with wrist snap'
    ],
    commonMistakes: [
      'Ball curving left or right',
      'Inconsistent spin',
      'Elbow flaring out',
      'No follow-through',
      'Using guide hand'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder'],
    scoringWeights: {
      technique: 0.4,
      consistency: 0.35,
      bodyPosition: 0.15,
      timing: 0.1
    },
    analysisPrompt: `Analyze this ONE HAND WALL SHOTS drill video. Focus on:
1. Is only the shooting hand being used (no guide hand)?
2. Does the ball have pure backspin?
3. Does the ball travel in a straight line (not curving)?
4. Is there a full follow-through with wrist snap?
Ball curving indicates hand is not properly under the ball.`
  },

  // ========== ELBOW ALIGNMENT DRILLS ==========
  'elbow-to-wall': {
    drillId: 'elbow-to-wall',
    drillName: 'ELBOW ON THE WALL',
    focusArea: 'elbow',
    correctFormCriteria: [
      'Elbow stays touching the wall throughout motion',
      'Elbow travels straight up, not out',
      'No chicken wing (elbow pointing sideways)',
      'Smooth shooting motion',
      'Elbow finishes pointing at target'
    ],
    commonMistakes: [
      'Elbow leaving the wall',
      'Elbow flaring out (chicken wing)',
      'Jerky or rushed motion',
      'Elbow pointing sideways at release',
      'Inconsistent elbow path'
    ],
    keyBodyParts: ['right_elbow', 'right_shoulder', 'right_wrist'],
    scoringWeights: {
      technique: 0.45,
      consistency: 0.3,
      bodyPosition: 0.2,
      timing: 0.05
    },
    analysisPrompt: `Analyze this ELBOW ON THE WALL drill video. Focus on:
1. Does the elbow stay touching the wall throughout the motion?
2. Does the elbow travel straight up (not flaring out)?
3. Is there any "chicken wing" where elbow points sideways?
4. Is the motion smooth and controlled?
The elbow should point at the target, not to the side.`
  },

  'elbow-string-drill': {
    drillId: 'elbow-string-drill',
    drillName: 'STRING ELBOW GUIDE',
    focusArea: 'elbow',
    correctFormCriteria: [
      'Elbow travels along the imaginary string line',
      'Elbow goes straight up, not drifting',
      'Consistent elbow path on every rep',
      'Elbow under the ball at set point',
      'Full extension at release'
    ],
    commonMistakes: [
      'Elbow drifting away from the line',
      'Inconsistent elbow path',
      'Elbow flaring at release',
      'Elbow not under ball at set point',
      'Incomplete extension'
    ],
    keyBodyParts: ['right_elbow', 'right_shoulder', 'right_wrist'],
    scoringWeights: {
      technique: 0.45,
      consistency: 0.35,
      bodyPosition: 0.15,
      timing: 0.05
    },
    analysisPrompt: `Analyze this STRING ELBOW GUIDE drill video. Focus on:
1. Does the elbow travel in a straight line (as if along a string)?
2. Is the elbow path consistent on every repetition?
3. Is the elbow directly under the ball at the set point?
4. Does the elbow fully extend at release?
Look for any drifting or flaring of the elbow.`
  },

  'mirror-form-check': {
    drillId: 'mirror-form-check',
    drillName: 'MIRROR FORM CHECK',
    focusArea: 'elbow',
    correctFormCriteria: [
      'Elbow directly under the ball',
      'Elbow aligned with shoulder and wrist',
      'No chicken wing',
      'Ball in shooting pocket',
      'Proper stance and balance'
    ],
    commonMistakes: [
      'Elbow sticking out to the side',
      'Elbow not under the ball',
      'Poor alignment (elbow-shoulder-wrist)',
      'Ball position too far from body',
      'Unbalanced stance'
    ],
    keyBodyParts: ['right_elbow', 'right_shoulder', 'right_wrist', 'right_hip'],
    scoringWeights: {
      technique: 0.4,
      consistency: 0.25,
      bodyPosition: 0.3,
      timing: 0.05
    },
    analysisPrompt: `Analyze this MIRROR FORM CHECK drill video. Focus on:
1. Is the elbow directly under the ball?
2. Is there proper alignment: elbow-shoulder-wrist in a line?
3. Is there any "chicken wing" (elbow pointing out)?
4. Is the ball properly positioned in the shooting pocket?
5. Is the overall stance balanced?`
  },

  // ========== FOLLOW-THROUGH DRILLS ==========
  'gooseneck-hold': {
    drillId: 'gooseneck-hold',
    drillName: 'GOOSENECK FREEZE',
    focusArea: 'follow-through',
    correctFormCriteria: [
      'Wrist fully snapped down (gooseneck position)',
      'Fingers pointing at the target/floor',
      'Arm fully extended',
      'Position held for 2-3 seconds',
      'Relaxed fingers, not tense'
    ],
    commonMistakes: [
      'Incomplete wrist snap',
      'Fingers not pointing down',
      'Arm not fully extended',
      'Dropping arm too quickly',
      'Tense, rigid hand'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder'],
    scoringWeights: {
      technique: 0.45,
      consistency: 0.3,
      bodyPosition: 0.15,
      timing: 0.1
    },
    analysisPrompt: `Analyze this GOOSENECK FREEZE drill video. Focus on:
1. Is the wrist fully snapped down into the "gooseneck" position?
2. Are the fingers pointing at the target/floor?
3. Is the arm fully extended?
4. Is the position held for 2-3 seconds?
The follow-through should look like a gooseneck - wrist snapped, fingers down.`
  },

  'reach-into-basket': {
    drillId: 'reach-into-basket',
    drillName: 'REACH INTO THE BASKET',
    focusArea: 'follow-through',
    correctFormCriteria: [
      'Full arm extension toward basket',
      'Feeling of reaching into the hoop',
      'Fingers pointing at rim',
      'High release point',
      'Complete follow-through held'
    ],
    commonMistakes: [
      'Short/incomplete follow-through',
      'Arm dropping too early',
      'Not reaching toward target',
      'Low release point',
      'Pulling arm back'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder'],
    scoringWeights: {
      technique: 0.4,
      consistency: 0.3,
      bodyPosition: 0.2,
      timing: 0.1
    },
    analysisPrompt: `Analyze this REACH INTO THE BASKET drill video. Focus on:
1. Is there full arm extension toward the basket?
2. Does it look like the player is reaching into the hoop?
3. Are the fingers pointing at the rim?
4. Is the release point high?
5. Is the follow-through held and not dropped?`
  },

  // ========== BALANCE & BASE DRILLS ==========
  'balance-check-freeze': {
    drillId: 'balance-check-freeze',
    drillName: 'BALANCE FREEZE',
    focusArea: 'balance',
    correctFormCriteria: [
      'Feet shoulder-width apart',
      'Weight balanced on both feet',
      'Slight knee bend',
      'Can hold position without wobbling',
      'Shooting foot slightly ahead'
    ],
    commonMistakes: [
      'Feet too close together',
      'Weight on heels',
      'Knees locked (no bend)',
      'Wobbling or unstable',
      'Leaning to one side'
    ],
    keyBodyParts: ['left_ankle', 'right_ankle', 'left_knee', 'right_knee', 'left_hip', 'right_hip'],
    scoringWeights: {
      technique: 0.3,
      consistency: 0.3,
      bodyPosition: 0.35,
      timing: 0.05
    },
    analysisPrompt: `Analyze this BALANCE FREEZE drill video. Focus on:
1. Are the feet shoulder-width apart?
2. Is weight evenly distributed on both feet?
3. Is there a slight knee bend?
4. Is the player stable (no wobbling)?
5. Is the shooting foot slightly ahead of the other?
Good balance is the foundation of a consistent shot.`
  },

  'one-leg-balance-shot': {
    drillId: 'one-leg-balance-shot',
    drillName: 'ONE LEG BALANCE',
    focusArea: 'balance',
    correctFormCriteria: [
      'Stable on one leg throughout',
      'Core engaged for balance',
      'Proper shooting form maintained',
      'Smooth release',
      'Controlled landing'
    ],
    commonMistakes: [
      'Wobbling or hopping',
      'Poor shooting form when unbalanced',
      'Rushing the shot',
      'Core not engaged',
      'Falling after release'
    ],
    keyBodyParts: ['left_ankle', 'right_ankle', 'left_knee', 'right_knee', 'left_hip', 'right_hip'],
    scoringWeights: {
      technique: 0.3,
      consistency: 0.25,
      bodyPosition: 0.35,
      timing: 0.1
    },
    analysisPrompt: `Analyze this ONE LEG BALANCE drill video. Focus on:
1. Is the player stable on one leg throughout the shot?
2. Is proper shooting form maintained despite being on one leg?
3. Is the core engaged for balance?
4. Is the release smooth and controlled?
This drill tests core strength and balance under shooting conditions.`
  },

  // ========== SLOW MOTION & VISUALIZATION DRILLS ==========
  'slow-motion-form': {
    drillId: 'slow-motion-form',
    drillName: 'SLOW MOTION SHOOTING',
    focusArea: 'general',
    correctFormCriteria: [
      'Each phase of shot clearly visible',
      'Proper sequence: legs-core-arm-wrist',
      'Smooth, controlled motion',
      'No rushing or jerky movements',
      'Full follow-through'
    ],
    commonMistakes: [
      'Rushing through the motion',
      'Skipping phases of the shot',
      'Jerky or disconnected movements',
      'Incomplete follow-through',
      'Poor sequencing'
    ],
    keyBodyParts: ['right_wrist', 'right_elbow', 'right_shoulder', 'right_knee', 'right_hip'],
    scoringWeights: {
      technique: 0.4,
      consistency: 0.25,
      bodyPosition: 0.25,
      timing: 0.1
    },
    analysisPrompt: `Analyze this SLOW MOTION SHOOTING drill video. Focus on:
1. Is each phase of the shot clearly visible and distinct?
2. Is the sequence correct: legs push → core transfers → arm extends → wrist snaps?
3. Is the motion smooth and controlled (not jerky)?
4. Is there a full, complete follow-through?
Slow motion reveals flaws that are hidden at full speed.`
  },

  // ========== WARM-UP & COOL-DOWN ==========
  'warm-up-stretching': {
    drillId: 'warm-up-stretching',
    drillName: 'WARM-UP & STRETCHING',
    focusArea: 'general',
    correctFormCriteria: [
      'Full range of motion in stretches',
      'Controlled movements',
      'All major muscle groups addressed',
      'Proper breathing',
      'Gradual intensity increase'
    ],
    commonMistakes: [
      'Bouncing during stretches',
      'Holding breath',
      'Skipping muscle groups',
      'Rushing through warm-up',
      'Static stretching before dynamic'
    ],
    keyBodyParts: ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
    scoringWeights: {
      technique: 0.3,
      consistency: 0.2,
      bodyPosition: 0.4,
      timing: 0.1
    },
    analysisPrompt: `Analyze this WARM-UP & STRETCHING video. Focus on:
1. Is there full range of motion in the stretches?
2. Are movements controlled (not bouncing)?
3. Are all major muscle groups being addressed?
4. Is the intensity gradually increasing?
Proper warm-up prevents injury and improves performance.`
  }
}

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

/**
 * Get drill analysis criteria by drill ID
 */
export function getDrillCriteria(drillId: string): DrillAnalysisCriteria | null {
  return DRILL_ANALYSIS_CRITERIA[drillId] || null
}

/**
 * Generate a comprehensive analysis prompt for a specific drill
 */
export function generateDrillAnalysisPrompt(drillId: string, drillName: string): string {
  const criteria = DRILL_ANALYSIS_CRITERIA[drillId]
  
  if (criteria) {
    return `
You are an expert basketball shooting coach analyzing a video of the "${criteria.drillName}" drill.

DRILL PURPOSE: This drill focuses on ${criteria.focusArea}.

WHAT TO LOOK FOR (Correct Form):
${criteria.correctFormCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

COMMON MISTAKES TO IDENTIFY:
${criteria.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n')}

KEY BODY PARTS TO ANALYZE: ${criteria.keyBodyParts.join(', ')}

${criteria.analysisPrompt}

Provide your analysis in the following format:
1. FORM SCORE (0-100): Overall score based on technique, consistency, and body position
2. WHAT THEY DID WELL: List 2-3 things the player executed correctly
3. AREAS FOR IMPROVEMENT: List 2-3 specific things to work on
4. COACHING TIPS: 2-3 actionable tips to improve

Be encouraging but honest. Focus on the specific requirements of this drill.
`
  }
  
  // Generic prompt for unknown drills
  return `
You are an expert basketball shooting coach analyzing a video of the "${drillName}" drill.

Analyze the player's form and technique. Focus on:
1. Body positioning and alignment
2. Shooting mechanics (elbow, wrist, follow-through)
3. Balance and footwork
4. Consistency of motion

Provide your analysis in the following format:
1. FORM SCORE (0-100): Overall assessment
2. WHAT THEY DID WELL: List 2-3 positives
3. AREAS FOR IMPROVEMENT: List 2-3 things to work on
4. COACHING TIPS: 2-3 actionable tips

Be encouraging but provide honest, constructive feedback.
`
}

/**
 * Calculate a form score based on detected issues
 */
export function calculateDrillScore(
  drillId: string,
  detectedIssues: string[],
  positives: string[]
): number {
  const criteria = DRILL_ANALYSIS_CRITERIA[drillId]
  
  if (!criteria) {
    // Generic scoring
    const baseScore = 70
    const issueDeduction = detectedIssues.length * 8
    const positiveBonus = positives.length * 5
    return Math.max(0, Math.min(100, baseScore - issueDeduction + positiveBonus))
  }
  
  // Drill-specific scoring
  const totalCriteria = criteria.correctFormCriteria.length
  const metCriteria = positives.length
  const mistakes = detectedIssues.length
  
  // Base score from criteria met
  const criteriaScore = (metCriteria / totalCriteria) * 60
  
  // Deductions for mistakes
  const mistakeDeduction = Math.min(30, mistakes * 10)
  
  // Bonus for consistency
  const consistencyBonus = mistakes === 0 ? 10 : 0
  
  return Math.max(0, Math.min(100, Math.round(30 + criteriaScore - mistakeDeduction + consistencyBonus)))
}

/**
 * Get focus areas for a drill
 */
export function getDrillFocusAreas(drillId: string): string[] {
  const criteria = DRILL_ANALYSIS_CRITERIA[drillId]
  if (!criteria) return ['general form', 'technique']
  
  return [criteria.focusArea, ...criteria.keyBodyParts.map(bp => bp.replace('_', ' '))]
}

/**
 * Format analysis result for display
 */
export interface DrillAnalysisResult {
  formScore: number
  drillName: string
  focusArea: string
  positives: string[]
  improvements: string[]
  coachingTips: string[]
  detailedFeedback: string
}

export function formatAnalysisResult(
  drillId: string,
  drillName: string,
  rawAnalysis: {
    formScore?: number
    feedback?: string[]
    improvements?: string[]
    positives?: string[]
    tips?: string[]
  }
): DrillAnalysisResult {
  const criteria = DRILL_ANALYSIS_CRITERIA[drillId]
  
  return {
    formScore: rawAnalysis.formScore || 70,
    drillName: criteria?.drillName || drillName,
    focusArea: criteria?.focusArea || 'general',
    positives: rawAnalysis.positives || rawAnalysis.feedback?.slice(0, 3) || ['Good effort on this drill'],
    improvements: rawAnalysis.improvements || ['Continue practicing for consistency'],
    coachingTips: rawAnalysis.tips || ['Focus on the fundamentals of this drill'],
    detailedFeedback: rawAnalysis.feedback?.join(' ') || 'Analysis complete.'
  }
}




