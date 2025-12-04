import type { DetectedKeypoint } from './tensorflowPoseDetection'
import type { AngleMeasurement, FormIssue } from '@/components/analysis/AnalysisOverlay'
import type { MetricScore, PriorityIssue } from '@/components/analysis/FormScoreCard'

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

export interface FormAnalysisResult {
  angles: AngleMeasurement[]
  issues: FormIssue[]
  metrics: MetricScore[]
  priorityIssues: PriorityIssue[]
  overallScore: number
  category: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL'
}

export function analyzeShootingForm(keypoints: DetectedKeypoint[]): FormAnalysisResult {
  const kpMap = new Map(keypoints.map(kp => [kp.name, kp]))
  const angles: AngleMeasurement[] = []
  const issues: FormIssue[] = []
  const metrics: MetricScore[] = []
  const priorityIssues: PriorityIssue[] = []

  // Helper to get keypoint
  const getKp = (name: string) => kpMap.get(name)

  // 1. Elbow Angle (shooting arm - assume right)
  const rShoulder = getKp('right_shoulder')
  const rElbow = getKp('right_elbow')
  const rWrist = getKp('right_wrist')
  
  if (rShoulder && rElbow && rWrist && rElbow.confidence > 0.3) {
    const elbowAngle = calculateAngle(rShoulder, rElbow, rWrist)
    const status = getStatus(elbowAngle, 85, 100)
    angles.push({
      name: 'Elbow Angle',
      angle: elbowAngle,
      optimalMin: 85,
      optimalMax: 100,
      points: ['right_shoulder', 'right_elbow', 'right_wrist'],
      status,
    })
    metrics.push({
      name: 'Elbow Angle',
      value: elbowAngle,
      optimalMin: 85,
      optimalMax: 100,
      unit: '°',
      status,
      description: 'Angle at the elbow during release',
    })
    if (status !== 'good') {
      issues.push({
        id: issues.length + 1,
        title: elbowAngle < 85 ? 'Elbow Too Tight' : 'Elbow Over-Extended',
        description: `Your elbow angle is ${elbowAngle}°. Optimal range is 85-100°.`,
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_elbow',
      })
    }
  }

  // 2. Knee Bend (base leg - assume right)
  const rHip = getKp('right_hip')
  const rKnee = getKp('right_knee')
  const rAnkle = getKp('right_ankle')
  
  if (rHip && rKnee && rAnkle && rKnee.confidence > 0.3) {
    const kneeAngle = calculateAngle(rHip, rKnee, rAnkle)
    const status = getStatus(kneeAngle, 130, 160)
    angles.push({
      name: 'Knee Bend',
      angle: kneeAngle,
      optimalMin: 130,
      optimalMax: 160,
      points: ['right_hip', 'right_knee', 'right_ankle'],
      status,
    })
    metrics.push({
      name: 'Knee Bend',
      value: kneeAngle,
      optimalMin: 130,
      optimalMax: 160,
      unit: '°',
      status,
      description: 'Leg bend providing power base',
    })
    if (status !== 'good') {
      issues.push({
        id: issues.length + 1,
        title: kneeAngle < 130 ? 'Over-Bent Knees' : 'Insufficient Knee Bend',
        description: `Knee angle is ${kneeAngle}°. Optimal is 130-160°.`,
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_knee',
      })
    }
  }

  // 3. Shoulder Angle
  const lShoulder = getKp('left_shoulder')
  if (rShoulder && rElbow && lShoulder && rShoulder.confidence > 0.3) {
    const shoulderAngle = calculateAngle(lShoulder, rShoulder, rElbow)
    const status = getStatus(shoulderAngle, 45, 90)
    angles.push({
      name: 'Shoulder Angle',
      angle: shoulderAngle,
      optimalMin: 45,
      optimalMax: 90,
      points: ['left_shoulder', 'right_shoulder', 'right_elbow'],
      status,
    })
    metrics.push({
      name: 'Shoulder Angle',
      value: shoulderAngle,
      optimalMin: 45,
      optimalMax: 90,
      unit: '°',
      status,
      description: 'Arm lift relative to shoulders',
    })
  }

  // 4. Hip Alignment
  const lHip = getKp('left_hip')
  if (rHip && lHip && rShoulder && lShoulder) {
    const hipDiff = Math.abs((rHip.y - lHip.y) * 100)
    const shoulderDiff = Math.abs((rShoulder.y - lShoulder.y) * 100)
    const alignScore = 100 - (hipDiff + shoulderDiff) * 5
    const status = alignScore >= 85 ? 'good' : alignScore >= 70 ? 'warning' : 'critical'
    metrics.push({
      name: 'Body Alignment',
      value: Math.round(alignScore),
      optimalMin: 85,
      optimalMax: 100,
      unit: '%',
      status,
      description: 'Shoulder-hip alignment score',
    })
    if (status !== 'good') {
      issues.push({
        id: issues.length + 1,
        title: 'Body Misalignment',
        description: 'Your shoulders and hips are not properly aligned.',
        severity: status === 'critical' ? 'critical' : 'minor',
        location: 'right_hip',
      })
    }
  }

  // 5. Release Height (wrist relative to shoulder)
  if (rWrist && rShoulder) {
    const releaseHeight = Math.round((rShoulder.y - rWrist.y) * 100)
    const status = releaseHeight >= 15 ? 'good' : releaseHeight >= 5 ? 'warning' : 'critical'
    metrics.push({
      name: 'Release Height',
      value: releaseHeight,
      optimalMin: 15,
      optimalMax: 40,
      unit: '%',
      status,
      description: 'Wrist height above shoulder at release',
    })
    if (status !== 'good') {
      issues.push({
        id: issues.length + 1,
        title: 'Low Release Point',
        description: 'Your release point is too low, making shots easier to block.',
        severity: status === 'critical' ? 'critical' : 'moderate',
        location: 'right_wrist',
      })
    }
  }

  // Generate priority issues from detected issues
  const sortedIssues = [...issues].sort((a, b) => {
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
  const goodCount = metrics.filter(m => m.status === 'good').length
  const warningCount = metrics.filter(m => m.status === 'warning').length
  const totalMetrics = metrics.length || 1
  const overallScore = Math.round((goodCount * 100 + warningCount * 60) / totalMetrics)

  // Determine category
  let category: FormAnalysisResult['category']
  if (overallScore >= 85) category = 'EXCELLENT'
  else if (overallScore >= 70) category = 'GOOD'
  else if (overallScore >= 50) category = 'NEEDS_IMPROVEMENT'
  else category = 'CRITICAL'

  return { angles, issues, metrics, priorityIssues, overallScore, category }
}

function getRecommendation(issueTitle: string): string {
  const recommendations: Record<string, string> = {
    'Elbow Too Tight': 'Practice form shooting close to the basket, focusing on a 90° elbow angle at release.',
    'Elbow Over-Extended': 'Work on stopping your elbow at 90° during release. Use wall-shooting drills.',
    'Over-Bent Knees': 'Focus on a more athletic stance with less squat. Think "load" not "sit".',
    'Insufficient Knee Bend': 'Add more leg power by bending knees more. Practice jump stops into shots.',
    'Body Misalignment': 'Square your shoulders to the basket. Practice with feet shoulder-width apart.',
    'Low Release Point': 'Raise your set point higher. Practice one-hand form shooting drills.',
  }
  return recommendations[issueTitle] || 'Work with a coach to address this form issue.'
}

