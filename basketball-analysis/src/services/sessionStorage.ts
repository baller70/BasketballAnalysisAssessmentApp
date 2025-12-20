/**
 * @file sessionStorage.ts
 * @description Session storage service for persisting analysis data in localStorage
 * 
 * PURPOSE:
 * - Save and load analysis sessions to/from localStorage
 * - Manage session history and analytics
 * - Track milestones and progress over time
 * - Filter sessions by media type (image/video)
 * 
 * MAIN FUNCTIONS:
 * - saveSession(session) - Save a new analysis session
 * - getAllSessions() - Get all saved sessions
 * - getLatestSessionByMediaType(type) - Get most recent session by type
 * - getSessionsByMediaType(type) - Get all sessions of a type
 * - deleteSession(id) - Delete a session
 * - createSessionFromAnalysis(...) - Create session from analysis results
 * - generateAnalytics(sessions) - Generate analytics data
 * 
 * STORAGE KEY:
 * - 'basketball_analysis_sessions' in localStorage
 * 
 * USED BY:
 * - src/app/page.tsx - Saving sessions after analysis
 * - src/app/results/demo/page.tsx - Loading sessions for display
 * 
 * INTERFACES EXPORTED:
 * - AnalysisSession - Main session data structure
 * - SessionScreenshot - Screenshot within a session
 * - SessionAnalysisData - Analysis metrics within a session
 * - AnalyticsData - Aggregated analytics
 * - Milestone - Achievement tracking
 */

export interface SessionScreenshot {
  id: string
  label: string
  imageBase64: string
  analysis?: string
}

export interface SessionAnalysisData {
  overallScore: number
  shooterLevel: string
  angles: Record<string, number>
  detectedFlaws: string[]
  measurements: Record<string, number>
}

// Phase 9: Enhanced session with more tracking data
export interface AnalysisSession {
  id: string
  date: string // ISO date string
  displayDate: string // Formatted for display (e.g., "Dec 15")
  timestamp: number // Unix timestamp for precise ordering
  mainImageBase64: string
  skeletonImageBase64?: string // Main image with skeleton overlay
  screenshots: SessionScreenshot[]
  analysisData: SessionAnalysisData
  playerName?: string
  // Phase 9 additions
  coachingLevelUsed?: string // elementary/middle/high/college/pro
  imagesAnalyzed?: number
  profileSnapshot?: UserProfileSnapshot // Snapshot of user profile at time of analysis
  // Video session data
  mediaType?: 'image' | 'video' // Type of media analyzed
  videoData?: {
    annotatedFramesBase64: string[] // All frames with skeleton overlay
    frameCount: number
    duration: number
    fps: number
    phases: Array<{ phase: string; frame: number; timestamp: number }>
    metrics: {
      elbow_angle_range: { min: number | null; max: number | null; at_release: number | null }
      knee_angle_range: { min: number | null; max: number | null }
      release_frame: number
      release_timestamp: number
    }
    frameData: Array<{
      frame: number
      timestamp: number
      phase: string
      metrics: Record<string, number>
    }>
  }
}

// Phase 9: User profile snapshot for tracking changes
export interface UserProfileSnapshot {
  age?: number
  skillLevel?: string
  bodyType?: string
  dominantHand?: string
  shootingStyle?: string
  athleticAbility?: number
  height?: string
  weight?: string
  wingspan?: string
}

// Phase 9: Metric tracking for individual metrics over time
export interface MetricHistory {
  metricName: string
  sessions: {
    sessionId: string
    date: string
    value: number
    changeFromPrevious?: number
    percentageChange?: number
  }[]
}

// Phase 9: Milestone achievement
export interface Milestone {
  id: string
  name: string
  description: string
  achievedDate?: string
  icon: string
  category: 'sessions' | 'improvement' | 'consistency' | 'special'
}

// Phase 9: Analytics data structure
export interface AnalyticsData {
  scoreTrend: {
    date: string
    score: number
    trend: 'improving' | 'declining' | 'stable'
  }[]
  categoryComparison: {
    category: string
    current: number
    previous: number
    change: number
    color: 'green' | 'yellow' | 'red'
  }[]
  issueHeatmap: {
    issue: string
    frequency: number
    count: number
    severity: 'high' | 'medium' | 'low'
  }[]
  milestones: Milestone[]
  summary: {
    totalSessions: number
    averageScore: number
    bestScore: number
    worstScore: number
    totalImprovement: number
    currentStreak: number
    longestStreak: number
  }
}

const STORAGE_KEY = 'basketball_analysis_sessions'
const MAX_SESSIONS = 20 // Limit to prevent localStorage overflow

/**
 * Generate a unique session ID based on timestamp
 */
export function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Format date for display (e.g., "Dec 15")
 */
export function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Get all saved sessions from localStorage
 */
export function getAllSessions(): AnalysisSession[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []
    
    const sessions: AnalysisSession[] = JSON.parse(stored)
    // Sort by date, newest first
    return sessions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  } catch (error) {
    console.error('Error loading sessions from localStorage:', error)
    return []
  }
}

/**
 * Get a specific session by ID
 */
export function getSessionById(sessionId: string): AnalysisSession | null {
  const sessions = getAllSessions()
  return sessions.find(s => s.id === sessionId) || null
}

/**
 * Get the latest session by media type (image or video)
 * Returns null if no session of that type exists
 */
export function getLatestSessionByMediaType(mediaType: 'image' | 'video'): AnalysisSession | null {
  const sessions = getAllSessions()
  // Sessions are sorted by timestamp (newest first)
  // Find the first session that matches the media type
  // Note: Old sessions without mediaType are treated as 'image'
  return sessions.find(s => (s.mediaType || 'image') === mediaType) || null
}

/**
 * Get all sessions filtered by media type
 * Returns only sessions matching the specified media type
 */
export function getSessionsByMediaType(mediaType: 'image' | 'video'): AnalysisSession[] {
  const sessions = getAllSessions()
  // Filter sessions by media type
  // Note: Old sessions without mediaType are treated as 'image'
  return sessions.filter(s => (s.mediaType || 'image') === mediaType)
}

/**
 * Save a new session to localStorage
 */
export function saveSession(session: AnalysisSession): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    let sessions = getAllSessions()
    
    // Check if session with same ID exists (update it)
    const existingIndex = sessions.findIndex(s => s.id === session.id)
    if (existingIndex >= 0) {
      sessions[existingIndex] = session
    } else {
      // Add new session at the beginning
      sessions.unshift(session)
      
      // Limit number of sessions to prevent localStorage overflow
      if (sessions.length > MAX_SESSIONS) {
        sessions = sessions.slice(0, MAX_SESSIONS)
      }
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    return true
  } catch (error) {
    console.error('Error saving session to localStorage:', error)
    // If quota exceeded, try removing oldest sessions
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      try {
        let sessions = getAllSessions()
        // Remove oldest half of sessions
        sessions = sessions.slice(0, Math.floor(sessions.length / 2))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        // Try saving again
        sessions.unshift(session)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
        return true
      } catch {
        return false
      }
    }
    return false
  }
}

/**
 * Delete a session by ID
 */
export function deleteSession(sessionId: string): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const sessions = getAllSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    return true
  } catch (error) {
    console.error('Error deleting session:', error)
    return false
  }
}

/**
 * Clear all sessions
 */
export function clearAllSessions(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch (error) {
    console.error('Error clearing sessions:', error)
    return false
  }
}

/**
 * Create a session object from current analysis data
 * Phase 9: Enhanced with profile snapshot and coaching level
 */
export function createSessionFromAnalysis(
  mainImageBase64: string,
  skeletonImageBase64: string | undefined,
  screenshots: SessionScreenshot[],
  analysisData: SessionAnalysisData,
  playerName?: string,
  coachingLevelUsed?: string,
  profileSnapshot?: UserProfileSnapshot,
  imagesAnalyzed?: number,
  mediaType?: 'image' | 'video',
  videoData?: AnalysisSession['videoData']
): AnalysisSession {
  const now = new Date()
  
  return {
    id: generateSessionId(),
    date: now.toISOString(),
    displayDate: formatDisplayDate(now),
    timestamp: now.getTime(),
    mainImageBase64,
    skeletonImageBase64,
    screenshots,
    analysisData,
    playerName,
    coachingLevelUsed,
    profileSnapshot,
    imagesAnalyzed,
    mediaType: mediaType || 'image',
    videoData
  }
}

/**
 * Check if localStorage is available
 */
export function isStorageAvailable(): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    const test = '__storage_test__'
    localStorage.setItem(test, test)
    localStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get storage usage info
 */
export function getStorageInfo(): { used: number; sessions: number } {
  if (typeof window === 'undefined') return { used: 0, sessions: 0 }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY) || ''
    const sessions = getAllSessions()
    return {
      used: new Blob([stored]).size,
      sessions: sessions.length
    }
  } catch {
    return { used: 0, sessions: 0 }
  }
}

// ============================================================================
// PHASE 9: HISTORICAL DATA MANAGEMENT & ANALYTICS
// ============================================================================

/**
 * Phase 9.1: Get sessions within a date range
 */
export function getSessionsInRange(
  startDate: Date,
  endDate: Date
): AnalysisSession[] {
  const sessions = getAllSessions()
  return sessions.filter(session => {
    const sessionDate = new Date(session.date)
    return sessionDate >= startDate && sessionDate <= endDate
  })
}

/**
 * Phase 9.1: Get sessions from last N days
 */
export function getSessionsFromLastDays(days: number): AnalysisSession[] {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  return getSessionsInRange(startDate, endDate)
}

/**
 * Phase 9.1: Track metric history for a specific metric
 */
export function getMetricHistory(metricName: string): MetricHistory {
  const sessions = getAllSessions()
  const history: MetricHistory = {
    metricName,
    sessions: []
  }
  
  let previousValue: number | null = null
  
  // Process sessions in chronological order (oldest first)
  const sortedSessions = [...sessions].reverse()
  
  for (const session of sortedSessions) {
    const value = session.analysisData.angles[metricName] ?? 
                  session.analysisData.measurements[metricName]
    
    if (value !== undefined) {
      const changeFromPrevious = previousValue !== null ? value - previousValue : undefined
      const percentageChange = previousValue !== null && previousValue !== 0 
        ? ((value - previousValue) / previousValue) * 100 
        : undefined
      
      history.sessions.push({
        sessionId: session.id,
        date: session.date,
        value,
        changeFromPrevious,
        percentageChange
      })
      
      previousValue = value
    }
  }
  
  return history
}

/**
 * Phase 9.1: Calculate improvement between two sessions
 */
export function calculateImprovement(
  oldSessionId: string,
  newSessionId: string
): { metric: string; oldValue: number; newValue: number; change: number; percentageChange: number }[] {
  const oldSession = getSessionById(oldSessionId)
  const newSession = getSessionById(newSessionId)
  
  if (!oldSession || !newSession) return []
  
  const improvements: { metric: string; oldValue: number; newValue: number; change: number; percentageChange: number }[] = []
  
  // Compare angles
  for (const [metric, newValue] of Object.entries(newSession.analysisData.angles)) {
    const oldValue = oldSession.analysisData.angles[metric]
    if (oldValue !== undefined) {
      improvements.push({
        metric,
        oldValue,
        newValue,
        change: newValue - oldValue,
        percentageChange: oldValue !== 0 ? ((newValue - oldValue) / oldValue) * 100 : 0
      })
    }
  }
  
  return improvements
}

/**
 * Phase 9.2: Generate score trend data for visualization
 */
export function generateScoreTrend(days: number = 90): AnalyticsData['scoreTrend'] {
  const sessions = getSessionsFromLastDays(days)
  const trend: AnalyticsData['scoreTrend'] = []
  
  // Sort by date (oldest first for trend calculation)
  const sortedSessions = [...sessions].reverse()
  
  for (let i = 0; i < sortedSessions.length; i++) {
    const session = sortedSessions[i]
    const score = session.analysisData.overallScore
    
    let trendDirection: 'improving' | 'declining' | 'stable' = 'stable'
    if (i > 0) {
      const prevScore = sortedSessions[i - 1].analysisData.overallScore
      if (score > prevScore + 2) trendDirection = 'improving'
      else if (score < prevScore - 2) trendDirection = 'declining'
    }
    
    trend.push({
      date: session.date,
      score,
      trend: trendDirection
    })
  }
  
  return trend
}

/**
 * Phase 9.2: Generate category comparison data
 */
export function generateCategoryComparison(): AnalyticsData['categoryComparison'] {
  const sessions = getAllSessions()
  if (sessions.length < 1) return []
  
  const currentSession = sessions[0]
  const previousSession = sessions.length > 1 ? sessions[1] : null
  
  const categories = [
    { key: 'elbow_angle', name: 'Elbow Alignment', optimal: 90 },
    { key: 'knee_angle', name: 'Knee Bend', optimal: 45 },
    { key: 'shoulder_angle', name: 'Shoulder Position', optimal: 45 },
    { key: 'release_angle', name: 'Release Angle', optimal: 52 },
    { key: 'hip_angle', name: 'Hip Alignment', optimal: 170 },
    { key: 'follow_through', name: 'Follow Through', optimal: 90 }
  ]
  
  const comparison: AnalyticsData['categoryComparison'] = []
  
  for (const cat of categories) {
    const currentValue = currentSession.analysisData.angles[cat.key]
    if (currentValue === undefined) continue
    
    // Calculate score based on how close to optimal (0-100 scale)
    const deviation = Math.abs(currentValue - cat.optimal)
    const currentScore = Math.max(0, 100 - deviation * 2)
    
    let previousScore = currentScore
    if (previousSession) {
      const prevValue = previousSession.analysisData.angles[cat.key]
      if (prevValue !== undefined) {
        const prevDeviation = Math.abs(prevValue - cat.optimal)
        previousScore = Math.max(0, 100 - prevDeviation * 2)
      }
    }
    
    const change = currentScore - previousScore
    let color: 'green' | 'yellow' | 'red' = 'yellow'
    if (change > 2) color = 'green'
    else if (change < -2) color = 'red'
    
    comparison.push({
      category: cat.name,
      current: Math.round(currentScore),
      previous: Math.round(previousScore),
      change: Math.round(change),
      color
    })
  }
  
  return comparison
}

/**
 * Phase 9.2: Generate issue frequency heat map
 */
export function generateIssueHeatmap(): AnalyticsData['issueHeatmap'] {
  const sessions = getAllSessions()
  if (sessions.length === 0) return []
  
  const issueCounts: Record<string, number> = {}
  
  for (const session of sessions) {
    for (const flaw of session.analysisData.detectedFlaws) {
      issueCounts[flaw] = (issueCounts[flaw] || 0) + 1
    }
  }
  
  const totalSessions = sessions.length
  const heatmap: AnalyticsData['issueHeatmap'] = []
  
  for (const [issue, count] of Object.entries(issueCounts)) {
    const frequency = (count / totalSessions) * 100
    let severity: 'high' | 'medium' | 'low' = 'low'
    if (frequency >= 60) severity = 'high'
    else if (frequency >= 30) severity = 'medium'
    
    heatmap.push({
      issue,
      frequency: Math.round(frequency),
      count,
      severity
    })
  }
  
  // Sort by frequency (highest first)
  return heatmap.sort((a, b) => b.frequency - a.frequency)
}

/**
 * Phase 9.2: Detect and return achieved milestones
 */
export function detectMilestones(): Milestone[] {
  const sessions = getAllSessions()
  const milestones: Milestone[] = []
  
  // All possible milestones
  const allMilestones: Milestone[] = [
    { id: 'first_analysis', name: 'First Analysis', description: 'Completed your first shooting analysis!', icon: '🎯', category: 'sessions' },
    { id: '5_analyses', name: '5 Analyses', description: 'Completed 5 shooting analyses!', icon: '⭐', category: 'sessions' },
    { id: '10_analyses', name: '10 Analyses', description: 'Completed 10 shooting analyses!', icon: '🌟', category: 'sessions' },
    { id: '25_analyses', name: '25 Analyses', description: 'Completed 25 shooting analyses!', icon: '💫', category: 'sessions' },
    { id: '10_point_improvement', name: '10 Point Improvement', description: 'Improved your score by 10 points!', icon: '📈', category: 'improvement' },
    { id: '25_point_improvement', name: '25 Point Improvement', description: 'Improved your score by 25 points!', icon: '🚀', category: 'improvement' },
    { id: '80_plus_score', name: 'Elite Form', description: 'Achieved a score of 80 or higher!', icon: '🏆', category: 'improvement' },
    { id: '90_plus_score', name: 'Perfect Form', description: 'Achieved a score of 90 or higher!', icon: '👑', category: 'improvement' },
    { id: '3_session_streak', name: 'Consistency Champion', description: '3 consecutive sessions with improvement!', icon: '🔥', category: 'consistency' },
    { id: '5_session_streak', name: 'Unstoppable', description: '5 consecutive sessions with improvement!', icon: '⚡', category: 'consistency' },
    { id: 'no_flaws', name: 'Flawless', description: 'Completed an analysis with no detected flaws!', icon: '💎', category: 'special' },
    { id: 'week_streak', name: 'Weekly Warrior', description: 'Analyzed your form every day for a week!', icon: '📅', category: 'consistency' }
  ]
  
  const totalSessions = sessions.length
  
  // Check session count milestones
  if (totalSessions >= 1) {
    const m = { ...allMilestones.find(m => m.id === 'first_analysis')! }
    m.achievedDate = sessions[sessions.length - 1].date
    milestones.push(m)
  }
  if (totalSessions >= 5) {
    const m = { ...allMilestones.find(m => m.id === '5_analyses')! }
    m.achievedDate = sessions[totalSessions - 5].date
    milestones.push(m)
  }
  if (totalSessions >= 10) {
    const m = { ...allMilestones.find(m => m.id === '10_analyses')! }
    m.achievedDate = sessions[totalSessions - 10].date
    milestones.push(m)
  }
  if (totalSessions >= 25) {
    const m = { ...allMilestones.find(m => m.id === '25_analyses')! }
    m.achievedDate = sessions[totalSessions - 25].date
    milestones.push(m)
  }
  
  // Check score milestones
  if (sessions.length >= 2) {
    const firstScore = sessions[sessions.length - 1].analysisData.overallScore
    const bestScore = Math.max(...sessions.map(s => s.analysisData.overallScore))
    const improvement = bestScore - firstScore
    
    if (improvement >= 10) {
      const m = { ...allMilestones.find(m => m.id === '10_point_improvement')! }
      const achievedSession = sessions.find(s => s.analysisData.overallScore >= firstScore + 10)
      m.achievedDate = achievedSession?.date
      milestones.push(m)
    }
    if (improvement >= 25) {
      const m = { ...allMilestones.find(m => m.id === '25_point_improvement')! }
      const achievedSession = sessions.find(s => s.analysisData.overallScore >= firstScore + 25)
      m.achievedDate = achievedSession?.date
      milestones.push(m)
    }
  }
  
  // Check for 80+ and 90+ scores
  const session80 = sessions.find(s => s.analysisData.overallScore >= 80)
  if (session80) {
    const m = { ...allMilestones.find(m => m.id === '80_plus_score')! }
    m.achievedDate = session80.date
    milestones.push(m)
  }
  
  const session90 = sessions.find(s => s.analysisData.overallScore >= 90)
  if (session90) {
    const m = { ...allMilestones.find(m => m.id === '90_plus_score')! }
    m.achievedDate = session90.date
    milestones.push(m)
  }
  
  // Check for flawless session
  const flawlessSession = sessions.find(s => s.analysisData.detectedFlaws.length === 0)
  if (flawlessSession) {
    const m = { ...allMilestones.find(m => m.id === 'no_flaws')! }
    m.achievedDate = flawlessSession.date
    milestones.push(m)
  }
  
  // Check for improvement streaks
  if (sessions.length >= 3) {
    const sortedByDate = [...sessions].reverse()
    let streak = 0
    let maxStreak = 0
    let streakAchievedDate: string | undefined
    
    for (let i = 1; i < sortedByDate.length; i++) {
      if (sortedByDate[i].analysisData.overallScore > sortedByDate[i - 1].analysisData.overallScore) {
        streak++
        if (streak > maxStreak) {
          maxStreak = streak
          streakAchievedDate = sortedByDate[i].date
        }
      } else {
        streak = 0
      }
    }
    
    if (maxStreak >= 3) {
      const m = { ...allMilestones.find(m => m.id === '3_session_streak')! }
      m.achievedDate = streakAchievedDate
      milestones.push(m)
    }
    if (maxStreak >= 5) {
      const m = { ...allMilestones.find(m => m.id === '5_session_streak')! }
      m.achievedDate = streakAchievedDate
      milestones.push(m)
    }
  }
  
  return milestones
}

/**
 * Phase 9.2: Generate summary statistics
 */
export function generateSummaryStats(): AnalyticsData['summary'] {
  const sessions = getAllSessions()
  
  if (sessions.length === 0) {
    return {
      totalSessions: 0,
      averageScore: 0,
      bestScore: 0,
      worstScore: 0,
      totalImprovement: 0,
      currentStreak: 0,
      longestStreak: 0
    }
  }
  
  const scores = sessions.map(s => s.analysisData.overallScore)
  const totalSessions = sessions.length
  const averageScore = scores.reduce((a, b) => a + b, 0) / totalSessions
  const bestScore = Math.max(...scores)
  const worstScore = Math.min(...scores)
  
  // Calculate improvement (first session vs best session)
  const sortedByDate = [...sessions].reverse()
  const firstScore = sortedByDate[0].analysisData.overallScore
  const totalImprovement = bestScore - firstScore
  
  // Calculate streaks
  let currentStreak = 0
  let longestStreak = 0
  let tempStreak = 0
  
  for (let i = 1; i < sortedByDate.length; i++) {
    if (sortedByDate[i].analysisData.overallScore >= sortedByDate[i - 1].analysisData.overallScore) {
      tempStreak++
      if (tempStreak > longestStreak) longestStreak = tempStreak
      if (i === sortedByDate.length - 1) currentStreak = tempStreak
    } else {
      tempStreak = 0
    }
  }
  
  return {
    totalSessions,
    averageScore: Math.round(averageScore),
    bestScore,
    worstScore,
    totalImprovement,
    currentStreak,
    longestStreak
  }
}

/**
 * Phase 9.2: Generate complete analytics data
 */
export function generateAnalytics(days: number = 90): AnalyticsData {
  return {
    scoreTrend: generateScoreTrend(days),
    categoryComparison: generateCategoryComparison(),
    issueHeatmap: generateIssueHeatmap(),
    milestones: detectMilestones(),
    summary: generateSummaryStats()
  }
}

/**
 * Phase 9.3: Get date range presets
 */
export type DateRangePreset = '7days' | '30days' | '90days' | '6months' | '1year' | 'all'

export function getDateRangeFromPreset(preset: DateRangePreset): { start: Date; end: Date } {
  const end = new Date()
  const start = new Date()
  
  switch (preset) {
    case '7days':
      start.setDate(start.getDate() - 7)
      break
    case '30days':
      start.setDate(start.getDate() - 30)
      break
    case '90days':
      start.setDate(start.getDate() - 90)
      break
    case '6months':
      start.setMonth(start.getMonth() - 6)
      break
    case '1year':
      start.setFullYear(start.getFullYear() - 1)
      break
    case 'all':
      start.setFullYear(2020) // Far enough back to include all sessions
      break
  }
  
  return { start, end }
}

/**
 * Phase 9: Get all unachieved milestones
 */
export function getUnachievedMilestones(): Milestone[] {
  const achieved = detectMilestones()
  const achievedIds = new Set(achieved.map(m => m.id))
  
  const allMilestones: Milestone[] = [
    { id: 'first_analysis', name: 'First Analysis', description: 'Complete your first shooting analysis!', icon: '🎯', category: 'sessions' },
    { id: '5_analyses', name: '5 Analyses', description: 'Complete 5 shooting analyses!', icon: '⭐', category: 'sessions' },
    { id: '10_analyses', name: '10 Analyses', description: 'Complete 10 shooting analyses!', icon: '🌟', category: 'sessions' },
    { id: '25_analyses', name: '25 Analyses', description: 'Complete 25 shooting analyses!', icon: '💫', category: 'sessions' },
    { id: '10_point_improvement', name: '10 Point Improvement', description: 'Improve your score by 10 points!', icon: '📈', category: 'improvement' },
    { id: '25_point_improvement', name: '25 Point Improvement', description: 'Improve your score by 25 points!', icon: '🚀', category: 'improvement' },
    { id: '80_plus_score', name: 'Elite Form', description: 'Achieve a score of 80 or higher!', icon: '🏆', category: 'improvement' },
    { id: '90_plus_score', name: 'Perfect Form', description: 'Achieve a score of 90 or higher!', icon: '👑', category: 'improvement' },
    { id: '3_session_streak', name: 'Consistency Champion', description: '3 consecutive sessions with improvement!', icon: '🔥', category: 'consistency' },
    { id: '5_session_streak', name: 'Unstoppable', description: '5 consecutive sessions with improvement!', icon: '⚡', category: 'consistency' },
    { id: 'no_flaws', name: 'Flawless', description: 'Complete an analysis with no detected flaws!', icon: '💎', category: 'special' },
    { id: 'week_streak', name: 'Weekly Warrior', description: 'Analyze your form every day for a week!', icon: '📅', category: 'consistency' }
  ]
  
  return allMilestones.filter(m => !achievedIds.has(m.id))
}
