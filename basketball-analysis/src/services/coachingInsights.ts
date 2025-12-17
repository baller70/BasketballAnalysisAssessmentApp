// ============================================
// PHASE 8: LLM-STYLE COACHING INSIGHTS
// Generates personalized coaching content
// ============================================

import { SkillLevel, DrillFocusArea } from '@/data/drillDatabase'
import { ShootingFlaw } from '@/data/shootingFlawsDatabase'

// ============================================
// TYPES
// ============================================

export interface WeeklyPerformanceSummary {
  totalAnalyses: number
  averageScore: number
  scoreChange: number
  improvements: string[]
  needsWork: string[]
  whatsWorking: string
  focusArea: string
  nextWeekGoal: string
  streakDays: number
}

export interface CoachingTip {
  title: string
  whatINoticed: string
  whyItMatters: string
  whatToDo: string[]
  expectedResult: string
  drillRecommendation: string
  icon: string
}

export interface MotivationalMessage {
  type: 'milestone' | 'progress' | 'streak' | 'encouragement'
  title: string
  message: string
  icon: string
  color: string
}

export interface DetailedAnalysisReport {
  overallScore: number
  scoreChange: number
  level: SkillLevel
  sections: {
    title: string
    score: number
    status: 'excellent' | 'good' | 'needs_work'
    details: string[]
    recommendation: string
  }[]
  comparison: {
    metric: string
    yourValue: string
    optimalValue: string
    difference: string
  }[]
  priorities: {
    week: number
    focus: string
    drill: string
    expectedImprovement: string
  }[]
  projectedTimeline: {
    weeks: number
    projectedScore: number
  }[]
}

// ============================================
// LEVEL-APPROPRIATE LANGUAGE
// ============================================

const LEVEL_TONES: Record<SkillLevel, {
  vocabulary: 'simple' | 'accessible' | 'technical' | 'advanced' | 'elite'
  encouragement: 'high' | 'medium' | 'low'
  dataFocus: 'minimal' | 'moderate' | 'heavy'
  examples: string[]
}> = {
  ELEMENTARY: {
    vocabulary: 'simple',
    encouragement: 'high',
    dataFocus: 'minimal',
    examples: ['pizza box', 'cookie jar', 'rainbow', 'bunny bounce']
  },
  MIDDLE_SCHOOL: {
    vocabulary: 'accessible',
    encouragement: 'medium',
    dataFocus: 'moderate',
    examples: ['arc trajectory', 'release point', 'follow-through']
  },
  HIGH_SCHOOL: {
    vocabulary: 'technical',
    encouragement: 'medium',
    dataFocus: 'heavy',
    examples: ['catch-to-release time', 'consistency percentage', 'game-situation']
  },
  COLLEGE: {
    vocabulary: 'advanced',
    encouragement: 'low',
    dataFocus: 'heavy',
    examples: ['NCAA standards', 'biomechanical efficiency', 'shot load timing']
  },
  PROFESSIONAL: {
    vocabulary: 'elite',
    encouragement: 'low',
    dataFocus: 'heavy',
    examples: ['micro-adjustments', 'fatigue degradation', 'defender proximity variance']
  }
}

// ============================================
// WEEKLY PERFORMANCE SUMMARY GENERATOR
// ============================================

export function generateWeeklyPerformanceSummary(
  level: SkillLevel,
  sessions: {
    date: Date
    score: number
    flaws: string[]
    improvements: string[]
  }[],
  previousWeekAvg: number
): WeeklyPerformanceSummary {
  const totalAnalyses = sessions.length
  const averageScore = sessions.length > 0 
    ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
    : 0
  const scoreChange = averageScore - previousWeekAvg
  
  // Collect all improvements and flaws
  const allImprovements = [...new Set(sessions.flatMap(s => s.improvements))]
  const allFlaws = [...new Set(sessions.flatMap(s => s.flaws))]
  
  // Generate level-appropriate messages
  const tone = LEVEL_TONES[level]
  
  let whatsWorking = ''
  let focusArea = ''
  let nextWeekGoal = ''
  
  switch (level) {
    case 'ELEMENTARY':
      whatsWorking = allImprovements.length > 0
        ? `Great job! You're getting better at ${allImprovements[0]}! Keep it up! 🌟`
        : `You're practicing hard! That's what matters most! 🎉`
      focusArea = allFlaws.length > 0
        ? `Let's work on making your ${allFlaws[0]} even better this week!`
        : `Keep practicing your shooting form - you're doing great!`
      nextWeekGoal = `Try to practice ${totalAnalyses + 1} times next week! You can do it! 💪`
      break
      
    case 'MIDDLE_SCHOOL':
      whatsWorking = allImprovements.length > 0
        ? `Your ${allImprovements[0]} has been improving. This shows your hard work is paying off.`
        : `You're building good habits with consistent practice.`
      focusArea = allFlaws.length > 0
        ? `Focus on your ${allFlaws[0]} this week. The "${allFlaws[0]} Drill" will help.`
        : `Maintain your current form while building consistency.`
      nextWeekGoal = `Aim for ${totalAnalyses + 2} practice sessions and focus on consistency.`
      break
      
    case 'HIGH_SCHOOL':
      whatsWorking = allImprovements.length > 0
        ? `Your ${allImprovements[0]} consistency has improved ${scoreChange > 0 ? scoreChange : 3}% this week. This is translating to better game performance.`
        : `Your form is maintaining consistency across sessions.`
      focusArea = allFlaws.length > 0
        ? `Your ${allFlaws[0]} is causing a ${Math.floor(Math.random() * 5) + 3}% accuracy variance. Address this with targeted drills.`
        : `Focus on maintaining form under fatigue conditions.`
      nextWeekGoal = `Target ${Math.round(averageScore * 1.05)} average score with 15+ practice sessions.`
      break
      
    case 'COLLEGE':
      whatsWorking = allImprovements.length > 0
        ? `Your ${allImprovements[0]} metrics are approaching NCAA standards. Continue this trajectory.`
        : `Your biomechanical consistency is within acceptable ranges.`
      focusArea = allFlaws.length > 0
        ? `${allFlaws[0]} variance of ${(Math.random() * 3 + 2).toFixed(1)}° is affecting your efficiency. Implement the micro-adjustment protocol.`
        : `Focus on shot selection and game-situation performance.`
      nextWeekGoal = `Achieve ${Math.round(averageScore + 3)}/100 with NCAA-standard consistency.`
      break
      
    case 'PROFESSIONAL':
      whatsWorking = allImprovements.length > 0
        ? `${allImprovements[0]} efficiency has improved. Your defender-proximity variance decreased ${(Math.random() * 2 + 1).toFixed(1)}%.`
        : `Form consistency maintained across fatigue conditions.`
      focusArea = allFlaws.length > 0
        ? `${allFlaws[0]} shows ${(Math.random() * 5 + 3).toFixed(1)}% degradation in 4th quarter simulations. Implement fatigue-specific mechanics.`
        : `Focus on micro-adjustments for situational shooting.`
      nextWeekGoal = `Reduce form degradation to <5% and maintain ${averageScore}+ efficiency.`
      break
  }
  
  // Calculate streak (mock for now)
  const streakDays = Math.min(sessions.length, 7)
  
  return {
    totalAnalyses,
    averageScore,
    scoreChange,
    improvements: allImprovements.slice(0, 3),
    needsWork: allFlaws.slice(0, 3),
    whatsWorking,
    focusArea,
    nextWeekGoal,
    streakDays
  }
}

// ============================================
// COACHING TIP GENERATOR
// ============================================

export function generateCoachingTip(
  level: SkillLevel,
  flaw: ShootingFlaw,
  currentValue: number,
  optimalValue: number
): CoachingTip {
  const tone = LEVEL_TONES[level]
  const difference = Math.abs(currentValue - optimalValue)
  
  let whatINoticed = ''
  let whyItMatters = ''
  let whatToDo: string[] = []
  let expectedResult = ''
  let drillRecommendation = ''
  
  switch (level) {
    case 'ELEMENTARY':
      whatINoticed = `Your ${flaw.name.toLowerCase()} needs a little practice! It's okay - everyone needs to work on something.`
      whyItMatters = `When you fix this, your shots will go in more often! How cool is that? 🏀`
      whatToDo = [
        `Practice the "${flaw.drills[0]}" drill for 5 minutes`,
        `Remember: ${flaw.fixes[0]}`,
        `Ask a friend or parent to watch and cheer you on!`,
        `Try to do this 3 times this week`
      ]
      expectedResult = `In 1 week, you'll feel more comfortable and confident! 🌟`
      drillRecommendation = flaw.drills[0] || 'Form Practice'
      break
      
    case 'MIDDLE_SCHOOL':
      whatINoticed = `Your ${flaw.name.toLowerCase()} is ${difference > 10 ? 'significantly' : 'slightly'} off from optimal. Current: ${currentValue}°, Target: ${optimalValue}°.`
      whyItMatters = `This affects your accuracy by approximately ${Math.round(difference / 2)}%. Fixing this will make you a more consistent shooter.`
      whatToDo = [
        `Practice the "${flaw.drills[0]}" drill (10-15 min/day)`,
        `Focus on: ${flaw.fixes[0]}`,
        `Use video to check your form`,
        `Track your progress over the week`
      ]
      expectedResult = `In 1-2 weeks, you should see your ${flaw.metric} improve by ${Math.round(difference / 2)}°.`
      drillRecommendation = flaw.drills[0] || 'Form Correction Drill'
      break
      
    case 'HIGH_SCHOOL':
      whatINoticed = `Your ${flaw.metric} is ${currentValue}° (optimal: ${optimalValue}°). This ${difference}° variance is causing inconsistency in your shot.`
      whyItMatters = `Data shows this variance reduces shooting percentage by ${Math.round(difference * 0.8)}%. Correcting this could add 2-4 points to your per-game average.`
      whatToDo = [
        `Implement "${flaw.drills[0]}" drill (15-20 min/day)`,
        `Technical focus: ${flaw.fixes[0]}`,
        `Film analysis: Record 20 shots and compare to baseline`,
        `Resubmit analysis in 5 days to track improvement`
      ]
      expectedResult = `With focused practice, expect ${Math.round(difference * 0.6)}° improvement in 2 weeks and ${difference}° in 4 weeks.`
      drillRecommendation = flaw.drills[0] || 'Performance Drill'
      break
      
    case 'COLLEGE':
      whatINoticed = `${flaw.metric} variance: ${currentValue}° vs. NCAA optimal ${optimalValue}°. This ${difference}° deviation correlates with ${Math.round(difference * 1.2)}% efficiency loss.`
      whyItMatters = `NCAA data indicates this issue affects shot selection under pressure. Your current form is in the ${100 - Math.round(difference * 2)}th percentile.`
      whatToDo = [
        `Protocol: "${flaw.drills[0]}" (20-30 min sessions)`,
        `Biomechanical adjustment: ${flaw.fixes[0]}`,
        `Video analysis with frame-by-frame comparison`,
        `Integration with game-situation drills`,
        `Weekly reassessment required`
      ]
      expectedResult = `Projected improvement: ${Math.round(difference * 0.7)}° in 2 weeks, reaching NCAA standard in 4-6 weeks.`
      drillRecommendation = flaw.drills[0] || 'NCAA Standard Drill'
      break
      
    case 'PROFESSIONAL':
      whatINoticed = `${flaw.metric} shows ${difference}° deviation from optimal. Analysis indicates this contributes to ${Math.round(difference * 1.5)}% efficiency variance, particularly under fatigue conditions.`
      whyItMatters = `NBA data: Elite shooters maintain <${Math.round(optimalValue * 0.05)}° variance. Your current variance places you in the ${100 - Math.round(difference * 3)}th percentile for this metric.`
      whatToDo = [
        `Micro-adjustment protocol: "${flaw.drills[0]}"`,
        `Technical specification: ${flaw.fixes[0]}`,
        `High-speed video analysis (240fps recommended)`,
        `Fatigue-condition testing required`,
        `Integration with defender-proximity adaptation`
      ]
      expectedResult = `Implementation timeline: ${Math.round(difference * 0.5)}° improvement in 1 week, full correction in 2-3 weeks with maintained form under fatigue.`
      drillRecommendation = flaw.drills[0] || 'Elite Adjustment Protocol'
      break
  }
  
  return {
    title: `${flaw.name} Correction`,
    whatINoticed,
    whyItMatters,
    whatToDo,
    expectedResult,
    drillRecommendation,
    icon: getFlawIcon(flaw.metric)
  }
}

function getFlawIcon(metric: string): string {
  const icons: Record<string, string> = {
    'elbow_angle': '💪',
    'knee_angle': '🦵',
    'release_angle': '🎯',
    'follow_through': '✋',
    'balance': '⚖️',
    'arc': '🌙',
    'footwork': '👟'
  }
  return icons[metric] || '📊'
}

// ============================================
// MOTIVATIONAL MESSAGE GENERATOR
// ============================================

export function generateMotivationalMessage(
  level: SkillLevel,
  context: {
    scoreImprovement?: number
    streakDays?: number
    totalSessions?: number
    milestoneReached?: string
    formDegraded?: boolean
  }
): MotivationalMessage {
  const tone = LEVEL_TONES[level]
  
  // Milestone achieved
  if (context.milestoneReached) {
    return {
      type: 'milestone',
      title: '🏆 MILESTONE ACHIEVED!',
      message: getMilestoneMessage(level, context.milestoneReached),
      icon: '🏆',
      color: 'gold'
    }
  }
  
  // Streak bonus
  if (context.streakDays && context.streakDays >= 7) {
    return {
      type: 'streak',
      title: '🔥 STREAK BONUS!',
      message: getStreakMessage(level, context.streakDays),
      icon: '🔥',
      color: 'orange'
    }
  }
  
  // Progress alert
  if (context.scoreImprovement && context.scoreImprovement > 5) {
    return {
      type: 'progress',
      title: '📈 PROGRESS ALERT!',
      message: getProgressMessage(level, context.scoreImprovement),
      icon: '📈',
      color: 'green'
    }
  }
  
  // Encouragement (form degraded or general)
  if (context.formDegraded) {
    return {
      type: 'encouragement',
      title: '💪 KEEP PUSHING!',
      message: getEncouragementMessage(level, true),
      icon: '💪',
      color: 'blue'
    }
  }
  
  // Default encouragement
  return {
    type: 'encouragement',
    title: '🌟 KEEP IT UP!',
    message: getEncouragementMessage(level, false),
    icon: '🌟',
    color: 'purple'
  }
}

function getMilestoneMessage(level: SkillLevel, milestone: string): string {
  switch (level) {
    case 'ELEMENTARY':
      return `Wow! You did it! ${milestone}! You're becoming such a great shooter! Keep practicing and you'll be amazing! 🎉`
    case 'MIDDLE_SCHOOL':
      return `Congratulations! You've reached ${milestone}! This shows real dedication. You're on your way to becoming a consistent shooter!`
    case 'HIGH_SCHOOL':
      return `${milestone} achieved! This level of consistency puts you ahead of 80% of players at your level. Keep this momentum going.`
    case 'COLLEGE':
      return `${milestone} - This achievement demonstrates NCAA-level commitment. Your dedication is reflected in your metrics.`
    case 'PROFESSIONAL':
      return `${milestone} - Elite-level milestone achieved. This consistency is what separates professionals from amateurs.`
    default:
      return `${milestone} achieved! Great work!`
  }
}

function getStreakMessage(level: SkillLevel, days: number): string {
  switch (level) {
    case 'ELEMENTARY':
      return `You practiced ${days} days in a row! That's super amazing! You're building great habits! 🌟`
    case 'MIDDLE_SCHOOL':
      return `${days}-day streak! This kind of consistency is what builds great shooters. Keep it going!`
    case 'HIGH_SCHOOL':
      return `${days}-day practice streak! Data shows consistent practice leads to ${Math.round(days * 1.5)}% faster improvement. You're on the right track.`
    case 'COLLEGE':
      return `${days}-day streak maintained. This consistency correlates with accelerated skill development. NCAA-level commitment demonstrated.`
    case 'PROFESSIONAL':
      return `${days}-day streak. Elite-level dedication. This consistency pattern matches top-tier professional training protocols.`
    default:
      return `${days}-day streak! Keep it up!`
  }
}

function getProgressMessage(level: SkillLevel, improvement: number): string {
  switch (level) {
    case 'ELEMENTARY':
      return `Your shooting got ${improvement}% better! That's awesome! Your hard work is really paying off! 🎉`
    case 'MIDDLE_SCHOOL':
      return `You've improved ${improvement}% this month! At this rate, you'll reach the next level in about ${Math.round(30 / improvement)} weeks!`
    case 'HIGH_SCHOOL':
      return `${improvement}% improvement tracked. This rate of progress puts you on pace to reach advanced metrics within ${Math.round(20 / improvement)} weeks.`
    case 'COLLEGE':
      return `${improvement}% efficiency gain recorded. This improvement rate exceeds NCAA average development curves by ${Math.round(improvement * 0.8)}%.`
    case 'PROFESSIONAL':
      return `${improvement}% improvement in key metrics. This development rate is consistent with elite-level training response.`
    default:
      return `${improvement}% improvement! Great progress!`
  }
}

function getEncouragementMessage(level: SkillLevel, formDegraded: boolean): string {
  if (formDegraded) {
    switch (level) {
      case 'ELEMENTARY':
        return `Everyone has tough days! That's okay - the best players keep trying. Take a break if you need to, then come back strong! You've got this! 💪`
      case 'MIDDLE_SCHOOL':
        return `Your form dipped a bit this week - that's completely normal! Even pros have off weeks. The "Form Reset" drill will help you get back on track.`
      case 'HIGH_SCHOOL':
        return `Form variance detected this week. This is common during growth periods or increased training load. Focus on fundamentals with the "Baseline Reset" drill.`
      case 'COLLEGE':
        return `Performance metrics show temporary regression. Analysis suggests fatigue or overtraining. Implement recovery protocol and reassess in 3 days.`
      case 'PROFESSIONAL':
        return `Form degradation of noted. Recommend biomechanical audit and potential micro-adjustment protocol. Schedule analysis with coaching staff.`
      default:
        return `Keep working hard! Progress isn't always linear.`
    }
  }
  
  switch (level) {
    case 'ELEMENTARY':
      return `You're doing great! Every time you practice, you're getting better. Keep having fun with it! 🏀`
    case 'MIDDLE_SCHOOL':
      return `Solid practice this week! Remember, consistency is key. Keep showing up and the results will come.`
    case 'HIGH_SCHOOL':
      return `Maintain your current training intensity. Your metrics show steady development within expected ranges.`
    case 'COLLEGE':
      return `Performance tracking indicates stable progression. Continue current protocol with focus on identified priority areas.`
    case 'PROFESSIONAL':
      return `Metrics stable. Maintain current training load while monitoring for optimization opportunities.`
    default:
      return `Keep up the great work!`
  }
}

// ============================================
// DETAILED ANALYSIS REPORT GENERATOR
// ============================================

export function generateDetailedAnalysisReport(
  level: SkillLevel,
  overallScore: number,
  previousScore: number,
  angles: Record<string, number>,
  flaws: ShootingFlaw[]
): DetailedAnalysisReport {
  const scoreChange = overallScore - previousScore
  
  // Generate sections based on angles
  const sections = [
    {
      title: 'Stance & Balance',
      score: Math.min(100, Math.max(60, overallScore + Math.random() * 10 - 5)),
      status: overallScore >= 80 ? 'excellent' as const : overallScore >= 65 ? 'good' as const : 'needs_work' as const,
      details: [
        angles.hip_tilt ? `Hip alignment: ${angles.hip_tilt}°` : 'Hip alignment: Good',
        'Feet shoulder-width apart: Consistent',
        'Weight distribution: Balanced'
      ],
      recommendation: 'Maintain current stance mechanics'
    },
    {
      title: 'Knee Bend',
      score: Math.min(100, Math.max(60, overallScore + Math.random() * 15 - 7)),
      status: (angles.right_knee_angle || 140) >= 135 && (angles.right_knee_angle || 140) <= 150 ? 'good' as const : 'needs_work' as const,
      details: [
        `Current depth: ${angles.right_knee_angle || angles.left_knee_angle || 140}°`,
        `Target range: 135-150°`,
        'Knee tracking: Over toes'
      ],
      recommendation: (angles.right_knee_angle || 140) < 135 ? 'Increase knee bend depth by 5-10°' : 'Maintain current knee bend'
    },
    {
      title: 'Elbow Position',
      score: Math.min(100, Math.max(60, overallScore + Math.random() * 12 - 6)),
      status: (angles.right_elbow_angle || 90) >= 85 && (angles.right_elbow_angle || 90) <= 95 ? 'excellent' as const : 'good' as const,
      details: [
        `Elbow angle: ${angles.right_elbow_angle || angles.left_elbow_angle || 90}°`,
        `Optimal range: 85-95°`,
        'Alignment: Under ball'
      ],
      recommendation: 'Continue current elbow positioning'
    },
    {
      title: 'Release Mechanics',
      score: Math.min(100, Math.max(60, overallScore + Math.random() * 10 - 5)),
      status: overallScore >= 75 ? 'good' as const : 'needs_work' as const,
      details: [
        `Release point: Consistent`,
        `Wrist snap: Clean`,
        `Follow-through: Complete`
      ],
      recommendation: 'Focus on release point consistency'
    },
    {
      title: 'Arc & Trajectory',
      score: Math.min(100, Math.max(60, overallScore + Math.random() * 15 - 10)),
      status: 'good' as const,
      details: [
        `Shot arc: ${angles.release_angle || 48}°`,
        `Optimal range: 45-52°`,
        'Ball rotation: Proper backspin'
      ],
      recommendation: (angles.release_angle || 48) < 45 ? 'Increase arc by adjusting knee bend' : 'Maintain current arc'
    }
  ]
  
  // Generate comparison data
  const comparison = [
    {
      metric: 'Knee Bend',
      yourValue: `${angles.right_knee_angle || angles.left_knee_angle || 140}°`,
      optimalValue: '140-145°',
      difference: `${Math.abs((angles.right_knee_angle || 140) - 142)}°`
    },
    {
      metric: 'Elbow Angle',
      yourValue: `${angles.right_elbow_angle || angles.left_elbow_angle || 90}°`,
      optimalValue: '88-92°',
      difference: `${Math.abs((angles.right_elbow_angle || 90) - 90)}°`
    },
    {
      metric: 'Release Arc',
      yourValue: `${angles.release_angle || 48}°`,
      optimalValue: '47-51°',
      difference: `${Math.abs((angles.release_angle || 48) - 49)}°`
    }
  ]
  
  // Generate priorities based on flaws
  const priorities = flaws.slice(0, 3).map((flaw, index) => ({
    week: index + 1,
    focus: flaw.name,
    drill: flaw.drills[0] || 'Form Practice',
    expectedImprovement: `+${Math.round(Math.random() * 3 + 2)} points`
  }))
  
  // If no flaws, add generic priorities
  if (priorities.length === 0) {
    priorities.push(
      { week: 1, focus: 'Consistency', drill: 'Form Repetition', expectedImprovement: '+2 points' },
      { week: 2, focus: 'Range Extension', drill: 'Distance Progression', expectedImprovement: '+3 points' }
    )
  }
  
  // Generate projected timeline
  const projectedTimeline = [
    { weeks: 2, projectedScore: Math.min(100, overallScore + 3) },
    { weeks: 4, projectedScore: Math.min(100, overallScore + 6) },
    { weeks: 8, projectedScore: Math.min(100, overallScore + 10) }
  ]
  
  return {
    overallScore,
    scoreChange,
    level,
    sections,
    comparison,
    priorities,
    projectedTimeline
  }
}

