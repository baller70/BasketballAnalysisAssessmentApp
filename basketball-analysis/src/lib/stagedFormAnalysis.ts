/**
 * Staged Form Analysis - Breaks analysis into discrete stages
 * Note: Visual progress callbacks are now handled by the MediaUpload component
 */
import type { MetricScore, PriorityIssue } from '@/components/analysis/FormScoreCard'
import type { FormAnalysisResult, DetectedKeypoint, AngleMeasurement, FormIssue } from './formAnalysis'

// Calculate angle between three points (vertex is middle point)
function calculateAngle(p1: {x: number, y: number}, vertex: {x: number, y: number}, p2: {x: number, y: number}): number {
  const v1 = { x: p1.x - vertex.x, y: p1.y - vertex.y }
  const v2 = { x: p2.x - vertex.x, y: p2.y - vertex.y }
  const dot = v1.x * v2.x + v1.y * v2.y
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y)
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y)
  const cosAngle = dot / (mag1 * mag2)
  return Math.round(Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI))
}

function getStatus(value: number, min: number, max: number): 'good' | 'warning' | 'critical' {
  if (value >= min && value <= max) return 'good'
  const deviation = value < min ? min - value : value - max
  if (deviation <= 15) return 'warning'
  return 'critical'
}

function getRecommendation(issueTitle: string): string {
  const recommendations: Record<string, string> = {
    'Elbow Too Tight': 'Practice form shooting close to the basket, focusing on a 90° elbow angle at release.',
    'Elbow Over-Extended': 'Work on stopping your elbow at 90° during release. Use wall-shooting drills.',
    'Over-Bent Knees': 'Focus on a more athletic stance with less squat. Think "load" not "sit".',
    'Insufficient Knee Bend': 'Add more leg power by bending knees more. Practice jump stops into shots.',
    'Body Misalignment': 'Square your shoulders to the basket. Practice with feet shoulder-width apart.',
    'Low Release Point': 'Raise your set point higher. Practice one-hand form shooting drills.',
    'Ankle Instability': 'Work on ankle mobility exercises and practice landing mechanics.',
    'Hip Rotation Issue': 'Practice hip rotation drills to improve power transfer from lower body.',
    'Core Weakness': 'Incorporate core stability exercises to improve shooting consistency.',
    'Shoulder Tension': 'Relax your guide hand and focus on smooth shoulder rotation.',
  }
  return recommendations[issueTitle] || 'Work with a coach to address this form issue.'
}

interface AnalysisState {
  kpMap: Map<string, DetectedKeypoint>
  angles: AngleMeasurement[]
  issues: FormIssue[]
  metrics: MetricScore[]
}

/**
 * Run staged analysis
 * Note: Progress callbacks are now handled by the MediaUpload component
 */
export async function runStagedAnalysis(
  keypoints: DetectedKeypoint[]
): Promise<FormAnalysisResult> {
  const state: AnalysisState = {
    kpMap: new Map(keypoints.map(kp => [kp.name, kp])),
    angles: [],
    issues: [],
    metrics: [],
  }

  const getKp = (name: string) => state.kpMap.get(name)

  // All stages are now handled by the caller (MediaUpload) for visual progress
  // This function just runs the actual analysis synchronously

  // Run all analysis steps
  analyzeAnkles(state, getKp)
  analyzeKnees(state, getKp)
  analyzeHips(state, getKp)
  analyzeCore(state, getKp)
  analyzeShoulders(state, getKp)
  analyzeElbows(state, getKp)
  analyzeWrists(state, getKp)
  analyzeArcTrajectory(state, getKp)

  // Generate final score
  const result = generateFinalScore(state)

  return result
}

function analyzeAnkles(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const lAnkle = getKp('left_ankle')
  const rAnkle = getKp('right_ankle')
  
  if (lAnkle && rAnkle && lAnkle.confidence > 0.3 && rAnkle.confidence > 0.3) {
    const stanceWidth = Math.abs(lAnkle.x - rAnkle.x) * 100
    const status = stanceWidth >= 15 && stanceWidth <= 35 ? 'good' : stanceWidth >= 10 ? 'warning' : 'critical'
    state.metrics.push({
      name: 'Stance Width',
      value: Math.round(stanceWidth),
      optimalMin: 15,
      optimalMax: 35,
      unit: '%',
      status,
      description: 'Distance between feet relative to frame',
    })
  }
}

function analyzeKnees(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rHip = getKp('right_hip')
  const rKnee = getKp('right_knee')
  const rAnkle = getKp('right_ankle')

  if (rHip && rKnee && rAnkle && rKnee.confidence > 0.3) {
    const kneeAngle = calculateAngle(rHip, rKnee, rAnkle)
    const status = getStatus(kneeAngle, 130, 160)
    state.angles.push({
      name: 'Knee Bend',
      angle: kneeAngle,
      optimalMin: 130,
      optimalMax: 160,
      points: ['right_hip', 'right_knee', 'right_ankle'],
      status,
    })
    state.metrics.push({
      name: 'Knee Bend',
      value: kneeAngle,
      optimalMin: 130,
      optimalMax: 160,
      unit: '°',
      status,
      description: 'Leg bend providing power base',
    })
    if (status !== 'good') {
      state.issues.push({
        id: state.issues.length + 1,
        title: kneeAngle < 130 ? 'Over-Bent Knees' : 'Insufficient Knee Bend',
        description: `Knee angle is ${kneeAngle}°. Optimal is 130-160°.`,
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_knee',
      })
    }
  }
}

function analyzeHips(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rHip = getKp('right_hip')
  const lHip = getKp('left_hip')
  const rShoulder = getKp('right_shoulder')
  const lShoulder = getKp('left_shoulder')

  if (rHip && lHip && rShoulder && lShoulder) {
    const hipDiff = Math.abs((rHip.y - lHip.y) * 100)
    const shoulderDiff = Math.abs((rShoulder.y - lShoulder.y) * 100)
    const alignScore = 100 - (hipDiff + shoulderDiff) * 5
    const status = alignScore >= 85 ? 'good' : alignScore >= 70 ? 'warning' : 'critical'
    state.metrics.push({
      name: 'Hip Balance',
      value: Math.round(alignScore),
      optimalMin: 85,
      optimalMax: 100,
      unit: '%',
      status,
      description: 'Hip levelness and balance',
    })
    if (status !== 'good') {
      state.issues.push({
        id: state.issues.length + 1,
        title: 'Hip Rotation Issue',
        description: 'Your hips are not properly balanced during the shot.',
        severity: status === 'critical' ? 'critical' : 'minor',
        location: 'right_hip',
      })
    }
  }
}

function analyzeCore(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rHip = getKp('right_hip')
  const lHip = getKp('left_hip')
  const rShoulder = getKp('right_shoulder')
  const lShoulder = getKp('left_shoulder')

  if (rHip && lHip && rShoulder && lShoulder) {
    // Calculate torso alignment (vertical line from hip midpoint to shoulder midpoint)
    const hipMidX = (rHip.x + lHip.x) / 2
    const shoulderMidX = (rShoulder.x + lShoulder.x) / 2
    const lateralDeviation = Math.abs(hipMidX - shoulderMidX) * 100
    const coreScore = Math.max(0, 100 - lateralDeviation * 10)
    const status = coreScore >= 85 ? 'good' : coreScore >= 70 ? 'warning' : 'critical'
    state.metrics.push({
      name: 'Core Stability',
      value: Math.round(coreScore),
      optimalMin: 85,
      optimalMax: 100,
      unit: '%',
      status,
      description: 'Torso alignment and stability',
    })
  }
}

function analyzeShoulders(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rShoulder = getKp('right_shoulder')
  const lShoulder = getKp('left_shoulder')
  const rElbow = getKp('right_elbow')

  if (rShoulder && rElbow && lShoulder && rShoulder.confidence > 0.3) {
    const shoulderAngle = calculateAngle(lShoulder, rShoulder, rElbow)
    const status = getStatus(shoulderAngle, 45, 90)
    state.angles.push({
      name: 'Shoulder Angle',
      angle: shoulderAngle,
      optimalMin: 45,
      optimalMax: 90,
      points: ['left_shoulder', 'right_shoulder', 'right_elbow'],
      status,
    })
    state.metrics.push({
      name: 'Shoulder Angle',
      value: shoulderAngle,
      optimalMin: 45,
      optimalMax: 90,
      unit: '°',
      status,
      description: 'Arm lift relative to shoulders',
    })
  }
}

function analyzeElbows(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rShoulder = getKp('right_shoulder')
  const rElbow = getKp('right_elbow')
  const rWrist = getKp('right_wrist')

  if (rShoulder && rElbow && rWrist && rElbow.confidence > 0.3) {
    const elbowAngle = calculateAngle(rShoulder, rElbow, rWrist)
    const status = getStatus(elbowAngle, 85, 100)
    state.angles.push({
      name: 'Elbow Angle',
      angle: elbowAngle,
      optimalMin: 85,
      optimalMax: 100,
      points: ['right_shoulder', 'right_elbow', 'right_wrist'],
      status,
    })
    state.metrics.push({
      name: 'Elbow Angle',
      value: elbowAngle,
      optimalMin: 85,
      optimalMax: 100,
      unit: '°',
      status,
      description: 'Angle at the elbow during release',
    })
    if (status !== 'good') {
      state.issues.push({
        id: state.issues.length + 1,
        title: elbowAngle < 85 ? 'Elbow Too Tight' : 'Elbow Over-Extended',
        description: `Your elbow angle is ${elbowAngle}°. Optimal range is 85-100°.`,
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_elbow',
      })
    }
  }
}

function analyzeWrists(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rWrist = getKp('right_wrist')
  const rShoulder = getKp('right_shoulder')

  if (rWrist && rShoulder) {
    const releaseHeight = Math.round((rShoulder.y - rWrist.y) * 100)
    const status = releaseHeight >= 15 ? 'good' : releaseHeight >= 5 ? 'warning' : 'critical'
    state.metrics.push({
      name: 'Release Height',
      value: releaseHeight,
      optimalMin: 15,
      optimalMax: 40,
      unit: '%',
      status,
      description: 'Wrist height above shoulder at release',
    })
    if (status !== 'good') {
      state.issues.push({
        id: state.issues.length + 1,
        title: 'Low Release Point',
        description: 'Your release point is too low, making shots easier to block.',
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_wrist',
      })
    }
  }
}

function analyzeArcTrajectory(state: AnalysisState, getKp: (name: string) => DetectedKeypoint | undefined): void {
  const rWrist = getKp('right_wrist')
  const rElbow = getKp('right_elbow')

  if (rWrist && rElbow) {
    // Calculate estimated arc based on arm angle
    const armAngle = Math.atan2(rElbow.y - rWrist.y, rWrist.x - rElbow.x) * (180 / Math.PI)
    const arcScore = Math.min(100, Math.max(0, 100 - Math.abs(armAngle - 52) * 2)) // 52° is optimal
    const status = arcScore >= 80 ? 'good' : arcScore >= 60 ? 'warning' : 'critical'
    state.metrics.push({
      name: 'Arc Quality',
      value: Math.round(arcScore),
      optimalMin: 80,
      optimalMax: 100,
      unit: '%',
      status,
      description: 'Estimated shooting arc trajectory',
    })
  }
}

function generateFinalScore(state: AnalysisState): FormAnalysisResult {
  const priorityIssues: PriorityIssue[] = []

  // Sort issues by severity
  const sortedIssues = [...state.issues].sort((a, b) => {
    const severityOrder = { critical: 0, moderate: 1, minor: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  sortedIssues.forEach((issue, index) => {
    priorityIssues.push({
      rank: index + 1,
      title: issue.title,
      description: issue.description,
      severity: issue.severity,
      recommendation: getRecommendation(issue.title),
    })
  })

  // Calculate overall score
  const goodCount = state.metrics.filter(m => m.status === 'good').length
  const warningCount = state.metrics.filter(m => m.status === 'warning').length
  const totalMetrics = state.metrics.length || 1
  const overallScore = Math.round((goodCount * 100 + warningCount * 60) / totalMetrics)

  // Determine category
  let category: FormAnalysisResult['category']
  if (overallScore >= 85) category = 'EXCELLENT'
  else if (overallScore >= 70) category = 'GOOD'
  else if (overallScore >= 50) category = 'NEEDS_IMPROVEMENT'
  else category = 'CRITICAL'

  return {
    angles: state.angles,
    issues: state.issues,
    metrics: state.metrics,
    priorityIssues,
    overallScore,
    category,
  }
}

