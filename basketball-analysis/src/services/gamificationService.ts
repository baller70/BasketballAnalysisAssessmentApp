// Phase 12: Gamification & Engagement Service
// Handles badges, achievements, levels, streaks, leaderboards, and challenges

// ============================================
// TYPES & INTERFACES
// ============================================

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  category: 'upload_quality' | 'improvement' | 'streak' | 'engagement' | 'special'
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
  pointsAwarded: number
  unlockCondition: string
  isUnlocked?: boolean
  unlockedDate?: string
}

export interface UserLevel {
  level: number
  name: string
  minPoints: number
  maxPoints: number
  color: string
  perks: string[]
}

export interface UserProgress {
  totalPoints: number
  currentLevel: number
  pointsToNextLevel: number
  currentStreak: number
  longestStreak: number
  lastAnalysisDate: string | null
  streakStartDate: string | null
  totalAnalyses: number
  badgesEarned: string[]
  challengesCompleted: string[]
}

export interface Challenge {
  id: string
  name: string
  description: string
  goalMetric: string
  goalValue: number
  currentProgress: number
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme'
  pointsReward: number
  badgeReward?: string
  startDate: string
  endDate: string
  isActive: boolean
  isCompleted: boolean
  icon: string
}

export interface LeaderboardEntry {
  rank: number
  identifier: string // Anonymous identifier
  score: number
  level: number
  isCurrentUser: boolean
  change?: number // Position change from last week
}

export interface LeaderboardData {
  type: 'form_score' | 'improvement' | 'streak' | 'engagement'
  ageGroup: string
  skillLevel: string
  entries: LeaderboardEntry[]
  userRank: number
  totalParticipants: number
}

// ============================================
// STORAGE KEYS
// ============================================

const STORAGE_KEY_PROGRESS = 'basketball_user_progress'
const STORAGE_KEY_CHALLENGES = 'basketball_active_challenges'

// ============================================
// BADGE DEFINITIONS
// ============================================

export const ALL_BADGES: Badge[] = [
  // Upload Quality Badges
  {
    id: 'perfect_shot',
    name: 'Perfect Shot',
    description: 'Upload an image with 95%+ quality score',
    icon: '📸',
    category: 'upload_quality',
    rarity: 'rare',
    pointsAwarded: 25,
    unlockCondition: 'quality_score >= 95'
  },
  {
    id: 'multi_angle_master',
    name: 'Multi-Angle Master',
    description: 'Upload 7 images from different angles in one session',
    icon: '🎯',
    category: 'upload_quality',
    rarity: 'uncommon',
    pointsAwarded: 20,
    unlockCondition: 'angles_uploaded >= 7'
  },
  {
    id: 'video_analyst',
    name: 'Video Analyst',
    description: 'Successfully analyze a video of your shooting form',
    icon: '🎬',
    category: 'upload_quality',
    rarity: 'uncommon',
    pointsAwarded: 15,
    unlockCondition: 'video_analyzed == true'
  },
  
  // Improvement Badges
  {
    id: 'first_step',
    name: 'First Step',
    description: 'Complete your first shooting analysis',
    icon: '👣',
    category: 'improvement',
    rarity: 'common',
    pointsAwarded: 10,
    unlockCondition: 'total_analyses >= 1'
  },
  {
    id: 'dedicated_shooter',
    name: 'Dedicated Shooter',
    description: 'Complete 10 shooting analyses',
    icon: '🏀',
    category: 'improvement',
    rarity: 'uncommon',
    pointsAwarded: 25,
    unlockCondition: 'total_analyses >= 10'
  },
  {
    id: 'form_transformer',
    name: 'Form Transformer',
    description: 'Improve your form score by 20%',
    icon: '📈',
    category: 'improvement',
    rarity: 'rare',
    pointsAwarded: 50,
    unlockCondition: 'improvement_percentage >= 20'
  },
  {
    id: 'elite_form',
    name: 'Elite Form',
    description: 'Achieve a form score of 80 or higher',
    icon: '⭐',
    category: 'improvement',
    rarity: 'rare',
    pointsAwarded: 40,
    unlockCondition: 'form_score >= 80'
  },
  {
    id: 'perfect_form',
    name: 'Perfect Form',
    description: 'Achieve a form score of 90 or higher',
    icon: '👑',
    category: 'improvement',
    rarity: 'epic',
    pointsAwarded: 75,
    unlockCondition: 'form_score >= 90'
  },
  {
    id: 'master_shooter',
    name: 'Master Shooter',
    description: 'Achieve a form score of 95 or higher',
    icon: '🏆',
    category: 'improvement',
    rarity: 'legendary',
    pointsAwarded: 100,
    unlockCondition: 'form_score >= 95'
  },
  
  // Streak Badges
  {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Analyze your form 7 consecutive days',
    icon: '🔥',
    category: 'streak',
    rarity: 'uncommon',
    pointsAwarded: 35,
    unlockCondition: 'streak >= 7'
  },
  {
    id: 'month_master',
    name: 'Month Master',
    description: 'Analyze your form 30 consecutive days',
    icon: '💪',
    category: 'streak',
    rarity: 'rare',
    pointsAwarded: 100,
    unlockCondition: 'streak >= 30'
  },
  {
    id: 'consistency_king',
    name: 'Consistency King',
    description: 'Complete 5 analyses in one week',
    icon: '👑',
    category: 'streak',
    rarity: 'uncommon',
    pointsAwarded: 30,
    unlockCondition: 'weekly_analyses >= 5'
  },
  {
    id: 'unstoppable',
    name: 'Unstoppable',
    description: 'Maintain a 14-day analysis streak',
    icon: '⚡',
    category: 'streak',
    rarity: 'rare',
    pointsAwarded: 60,
    unlockCondition: 'streak >= 14'
  },
  
  // Engagement Badges
  {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Share your analysis results 5 times',
    icon: '🦋',
    category: 'engagement',
    rarity: 'uncommon',
    pointsAwarded: 20,
    unlockCondition: 'shares >= 5'
  },
  {
    id: 'challenge_accepted',
    name: 'Challenge Accepted',
    description: 'Complete your first weekly challenge',
    icon: '🎯',
    category: 'engagement',
    rarity: 'uncommon',
    pointsAwarded: 25,
    unlockCondition: 'challenges_completed >= 1'
  },
  {
    id: 'challenge_champion',
    name: 'Challenge Champion',
    description: 'Complete 5 weekly challenges',
    icon: '🏅',
    category: 'engagement',
    rarity: 'rare',
    pointsAwarded: 75,
    unlockCondition: 'challenges_completed >= 5'
  },
  {
    id: 'leaderboard_legend',
    name: 'Leaderboard Legend',
    description: 'Rank in the top 10 of any leaderboard',
    icon: '🌟',
    category: 'engagement',
    rarity: 'epic',
    pointsAwarded: 100,
    unlockCondition: 'leaderboard_rank <= 10'
  },
  
  // Special Badges
  {
    id: 'flawless',
    name: 'Flawless',
    description: 'Complete an analysis with no detected flaws',
    icon: '💎',
    category: 'special',
    rarity: 'legendary',
    pointsAwarded: 150,
    unlockCondition: 'flaws_detected == 0'
  },
  {
    id: 'comeback_kid',
    name: 'Comeback Kid',
    description: 'Improve your score after a decline',
    icon: '🔄',
    category: 'special',
    rarity: 'uncommon',
    pointsAwarded: 30,
    unlockCondition: 'comeback == true'
  },
  {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete an analysis before 7 AM',
    icon: '🌅',
    category: 'special',
    rarity: 'common',
    pointsAwarded: 10,
    unlockCondition: 'analysis_hour < 7'
  },
  {
    id: 'night_owl',
    name: 'Night Owl',
    description: 'Complete an analysis after 10 PM',
    icon: '🦉',
    category: 'special',
    rarity: 'common',
    pointsAwarded: 10,
    unlockCondition: 'analysis_hour >= 22'
  }
]

// ============================================
// LEVEL DEFINITIONS
// ============================================

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    name: 'Rookie Shooter',
    minPoints: 0,
    maxPoints: 100,
    color: '#888888',
    perks: ['Basic badge display', 'Access to analysis']
  },
  {
    level: 2,
    name: 'Rising Star',
    minPoints: 101,
    maxPoints: 300,
    color: '#4CAF50',
    perks: ['Custom profile color', 'Weekly progress reports']
  },
  {
    level: 3,
    name: 'Pro Analyst',
    minPoints: 301,
    maxPoints: 600,
    color: '#2196F3',
    perks: ['Advanced analytics dashboard', 'Detailed comparisons']
  },
  {
    level: 4,
    name: 'Elite Coach',
    minPoints: 601,
    maxPoints: 1000,
    color: '#9C27B0',
    perks: ['Coaching features', 'Priority support']
  },
  {
    level: 5,
    name: 'Legend',
    minPoints: 1001,
    maxPoints: Infinity,
    color: '#FF6B35',
    perks: ['Exclusive features', 'Legend badge', 'Beta access']
  }
]

// ============================================
// WEEKLY CHALLENGES
// ============================================

export const WEEKLY_CHALLENGES: Omit<Challenge, 'currentProgress' | 'isCompleted' | 'startDate' | 'endDate' | 'isActive'>[] = [
  {
    id: 'angle_master',
    name: 'Angle Master',
    description: 'Achieve 85+ elbow angle consistency across 5 analyses',
    goalMetric: 'elbow_consistency',
    goalValue: 5,
    difficulty: 'medium',
    pointsReward: 50,
    badgeReward: 'angle_master_badge',
    icon: '📐'
  },
  {
    id: 'balance_breaker',
    name: 'Balance Breaker',
    description: 'Improve your balance score by 15% this week',
    goalMetric: 'balance_improvement',
    goalValue: 15,
    difficulty: 'medium',
    pointsReward: 50,
    icon: '⚖️'
  },
  {
    id: 'follow_through_focus',
    name: 'Follow-Through Focus',
    description: 'Complete 10 analyses with perfect follow-through scores',
    goalMetric: 'perfect_follow_through',
    goalValue: 10,
    difficulty: 'hard',
    pointsReward: 75,
    icon: '🎯'
  },
  {
    id: 'consistency_champion',
    name: 'Consistency Champion',
    description: 'Analyze your form every day for 7 days',
    goalMetric: 'daily_streak',
    goalValue: 7,
    difficulty: 'hard',
    pointsReward: 100,
    badgeReward: 'week_warrior',
    icon: '🔥'
  },
  {
    id: 'rapid_improvement',
    name: 'Rapid Improvement',
    description: 'Improve your overall score by 10 points this week',
    goalMetric: 'score_improvement',
    goalValue: 10,
    difficulty: 'medium',
    pointsReward: 60,
    icon: '📈'
  },
  {
    id: 'analysis_marathon',
    name: 'Analysis Marathon',
    description: 'Complete 15 analyses this week',
    goalMetric: 'weekly_analyses',
    goalValue: 15,
    difficulty: 'hard',
    pointsReward: 80,
    icon: '🏃'
  },
  {
    id: 'knee_bend_master',
    name: 'Knee Bend Master',
    description: 'Achieve optimal knee bend (40-50°) in 5 consecutive analyses',
    goalMetric: 'knee_bend_streak',
    goalValue: 5,
    difficulty: 'medium',
    pointsReward: 45,
    icon: '🦵'
  },
  {
    id: 'release_perfectionist',
    name: 'Release Perfectionist',
    description: 'Maintain consistent release angle (±3°) across 8 analyses',
    goalMetric: 'release_consistency',
    goalValue: 8,
    difficulty: 'hard',
    pointsReward: 70,
    icon: '🎯'
  }
]

// ============================================
// PROGRESS MANAGEMENT
// ============================================

export function getUserProgress(): UserProgress {
  if (typeof window === 'undefined') {
    return getDefaultProgress()
  }
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PROGRESS)
    if (stored) {
      return { ...getDefaultProgress(), ...JSON.parse(stored) }
    }
  } catch (e) {
    console.error('Error loading user progress:', e)
  }
  
  return getDefaultProgress()
}

function getDefaultProgress(): UserProgress {
  return {
    totalPoints: 0,
    currentLevel: 1,
    pointsToNextLevel: 100,
    currentStreak: 0,
    longestStreak: 0,
    lastAnalysisDate: null,
    streakStartDate: null,
    totalAnalyses: 0,
    badgesEarned: [],
    challengesCompleted: []
  }
}

export function saveUserProgress(progress: UserProgress): boolean {
  if (typeof window === 'undefined') return false
  
  try {
    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progress))
    return true
  } catch (e) {
    console.error('Error saving user progress:', e)
    return false
  }
}

// ============================================
// POINTS & LEVEL FUNCTIONS
// ============================================

export function addPoints(points: number): UserProgress {
  const progress = getUserProgress()
  progress.totalPoints += points
  
  // Check for level up
  const newLevel = calculateLevel(progress.totalPoints)
  if (newLevel > progress.currentLevel) {
    progress.currentLevel = newLevel
  }
  
  // Calculate points to next level
  const currentLevelData = USER_LEVELS.find(l => l.level === progress.currentLevel)
  if (currentLevelData) {
    progress.pointsToNextLevel = currentLevelData.maxPoints - progress.totalPoints
  }
  
  saveUserProgress(progress)
  return progress
}

export function calculateLevel(totalPoints: number): number {
  for (let i = USER_LEVELS.length - 1; i >= 0; i--) {
    if (totalPoints >= USER_LEVELS[i].minPoints) {
      return USER_LEVELS[i].level
    }
  }
  return 1
}

export function getLevelData(level: number): UserLevel {
  return USER_LEVELS.find(l => l.level === level) || USER_LEVELS[0]
}

export function getLevelProgress(totalPoints: number): { percentage: number; pointsInLevel: number; pointsNeeded: number } {
  const level = calculateLevel(totalPoints)
  const levelData = getLevelData(level)
  const nextLevelData = getLevelData(level + 1)
  
  const pointsInLevel = totalPoints - levelData.minPoints
  const pointsNeeded = (nextLevelData?.minPoints || levelData.maxPoints) - levelData.minPoints
  const percentage = Math.min(100, (pointsInLevel / pointsNeeded) * 100)
  
  return { percentage, pointsInLevel, pointsNeeded }
}

// ============================================
// STREAK FUNCTIONS
// ============================================

export function updateStreak(): UserProgress {
  const progress = getUserProgress()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  if (!progress.lastAnalysisDate) {
    // First analysis ever
    progress.currentStreak = 1
    progress.streakStartDate = today
  } else {
    const lastDate = new Date(progress.lastAnalysisDate)
    const daysDiff = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysDiff === 0) {
      // Same day, streak unchanged
    } else if (daysDiff === 1) {
      // Consecutive day, increment streak
      progress.currentStreak++
    } else {
      // Streak broken, reset
      if (progress.currentStreak > progress.longestStreak) {
        progress.longestStreak = progress.currentStreak
      }
      progress.currentStreak = 1
      progress.streakStartDate = today
    }
  }
  
  progress.lastAnalysisDate = today
  progress.totalAnalyses++
  
  // Update longest streak if current is higher
  if (progress.currentStreak > progress.longestStreak) {
    progress.longestStreak = progress.currentStreak
  }
  
  saveUserProgress(progress)
  return progress
}

export function checkStreakStatus(): { isActive: boolean; daysRemaining: number } {
  const progress = getUserProgress()
  
  if (!progress.lastAnalysisDate) {
    return { isActive: false, daysRemaining: 0 }
  }
  
  const lastDate = new Date(progress.lastAnalysisDate)
  const now = new Date()
  const hoursDiff = (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60)
  
  if (hoursDiff > 48) {
    return { isActive: false, daysRemaining: 0 }
  }
  
  const hoursRemaining = 48 - hoursDiff
  return { isActive: true, daysRemaining: Math.ceil(hoursRemaining / 24) }
}

// ============================================
// BADGE FUNCTIONS
// ============================================

/**
 * Optional real-activity context for badge evaluation. Defaults keep older
 * call sites working while enabling the previously-missing badge cases
 * (perfect_shot, video_analyst, social_butterfly, leaderboard_legend,
 * comeback_kid, consistency_king) to actually unlock from real events.
 */
export interface BadgeUnlockContext {
  qualityScore?: number // upload quality (0-100) for perfect_shot
  videoAnalyzed?: boolean // a video was successfully analyzed
  shares?: number // number of result shares
  leaderboardRank?: number // best leaderboard rank (1 = top)
  isComeback?: boolean // improved after a decline
  weeklyAnalyses?: number // analyses completed in the current week
}

export function checkBadgeUnlock(
  formScore: number,
  flawsCount: number,
  anglesUploaded: number,
  improvementPercentage: number,
  context: BadgeUnlockContext = {}
): Badge[] {
  const progress = getUserProgress()
  const newBadges: Badge[] = []
  const hour = new Date().getHours()
  const {
    qualityScore = 0,
    videoAnalyzed = false,
    shares = 0,
    leaderboardRank = 0,
    isComeback = false,
    weeklyAnalyses = 0,
  } = context
  
  for (const badge of ALL_BADGES) {
    // Skip if already earned
    if (progress.badgesEarned.includes(badge.id)) continue
    
    let shouldUnlock = false
    
    // Check unlock conditions
    switch (badge.id) {
      case 'first_step':
        shouldUnlock = progress.totalAnalyses >= 1
        break
      case 'dedicated_shooter':
        shouldUnlock = progress.totalAnalyses >= 10
        break
      case 'elite_form':
        shouldUnlock = formScore >= 80
        break
      case 'perfect_form':
        shouldUnlock = formScore >= 90
        break
      case 'master_shooter':
        shouldUnlock = formScore >= 95
        break
      case 'form_transformer':
        shouldUnlock = improvementPercentage >= 20
        break
      case 'flawless':
        shouldUnlock = flawsCount === 0
        break
      case 'multi_angle_master':
        shouldUnlock = anglesUploaded >= 7
        break
      case 'week_warrior':
        shouldUnlock = progress.currentStreak >= 7
        break
      case 'month_master':
        shouldUnlock = progress.currentStreak >= 30
        break
      case 'unstoppable':
        shouldUnlock = progress.currentStreak >= 14
        break
      case 'early_bird':
        shouldUnlock = hour < 7
        break
      case 'night_owl':
        shouldUnlock = hour >= 22
        break
      case 'challenge_accepted':
        shouldUnlock = progress.challengesCompleted.length >= 1
        break
      case 'challenge_champion':
        shouldUnlock = progress.challengesCompleted.length >= 5
        break
      // --- Previously-missing cases, now driven by real activity context ---
      case 'perfect_shot':
        shouldUnlock = qualityScore >= 95
        break
      case 'video_analyst':
        shouldUnlock = videoAnalyzed === true
        break
      case 'social_butterfly':
        shouldUnlock = shares >= 5
        break
      case 'leaderboard_legend':
        shouldUnlock = leaderboardRank > 0 && leaderboardRank <= 10
        break
      case 'comeback_kid':
        shouldUnlock = isComeback === true
        break
      case 'consistency_king':
        shouldUnlock = weeklyAnalyses >= 5
        break
    }
    
    if (shouldUnlock) {
      newBadges.push({ ...badge, isUnlocked: true, unlockedDate: new Date().toISOString() })
      progress.badgesEarned.push(badge.id)
      progress.totalPoints += badge.pointsAwarded
    }
  }
  
  if (newBadges.length > 0) {
    // Recalculate level
    progress.currentLevel = calculateLevel(progress.totalPoints)
    saveUserProgress(progress)
  }
  
  return newBadges
}

export function getEarnedBadges(): Badge[] {
  const progress = getUserProgress()
  return ALL_BADGES.filter(b => progress.badgesEarned.includes(b.id)).map(b => ({
    ...b,
    isUnlocked: true
  }))
}

export function getUnearnedBadges(): Badge[] {
  const progress = getUserProgress()
  return ALL_BADGES.filter(b => !progress.badgesEarned.includes(b.id))
}

export function getBadgesByCategory(category: Badge['category']): Badge[] {
  const progress = getUserProgress()
  return ALL_BADGES.filter(b => b.category === category).map(b => ({
    ...b,
    isUnlocked: progress.badgesEarned.includes(b.id)
  }))
}

// ============================================
// CHALLENGE FUNCTIONS
// ============================================

export function getActiveChallenges(): Challenge[] {
  if (typeof window === 'undefined') return []
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY_CHALLENGES)
    if (stored) {
      const challenges = JSON.parse(stored) as Challenge[]
      // Filter out expired challenges
      const now = new Date()
      return challenges.filter(c => new Date(c.endDate) > now)
    }
  } catch (e) {
    console.error('Error loading challenges:', e)
  }
  
  // Generate new weekly challenges if none exist
  return generateWeeklyChallenges()
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Monday 00:00 UTC of the week containing `now`. Matches the server. */
function getWeekStartUTC(now = new Date()): Date {
  const day = now.getUTCDay() // 0 = Sun
  const diff = (day + 6) % 7 // days since Monday
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  monday.setUTCDate(monday.getUTCDate() - diff)
  return monday
}

/**
 * Deterministic 3-challenge selection for a given week. MUST match the server
 * (src/app/api/badges/route.ts) so persisted UserChallenge rows line up.
 * Never Math.random — that reshuffled the set on every reload and broke
 * persistence.
 */
function selectWeeklyChallengeDefs(weekStart: Date): typeof WEEKLY_CHALLENGES {
  const seed = Math.floor(weekStart.getTime() / DAY_MS)
  const idx = [seed % 8, (seed + 3) % 8, (seed + 6) % 8]
  const distinct: number[] = []
  for (let i = 0; distinct.length < 3 && i < 8; i++) {
    const candidate = (idx[distinct.length] + i) % 8
    if (!distinct.includes(candidate)) distinct.push(candidate)
  }
  return distinct.map((i) => WEEKLY_CHALLENGES[i]) as typeof WEEKLY_CHALLENGES
}

export function generateWeeklyChallenges(): Challenge[] {
  const startOfWeek = getWeekStartUTC()
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6)
  endOfWeek.setUTCHours(23, 59, 59, 999)

  const selected = selectWeeklyChallengeDefs(startOfWeek)

  const challenges: Challenge[] = selected.map(c => ({
    ...c,
    currentProgress: 0,
    isCompleted: false,
    isActive: true,
    startDate: startOfWeek.toISOString(),
    endDate: endOfWeek.toISOString()
  }))

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHALLENGES, JSON.stringify(challenges))
  }

  return challenges
}

// ============================================
// DB-BACKED GAMIFICATION SYNC (Postgres source of truth)
// ============================================

export interface ServerBadgeState {
  unlocked: boolean
  progress: { current: number; total: number } | null
  earnedDate: string | null
}

export interface GamificationState {
  profileId: string | null
  stats: {
    totalPoints: number
    totalAnalyses: number
    currentStreak: number
    longestStreak: number
    activeDates: string[]
  }
  badges: Record<string, ServerBadgeState>
  challenges: Challenge[]
}

const EMPTY_STATE: GamificationState = {
  profileId: null,
  stats: { totalPoints: 0, totalAnalyses: 0, currentStreak: 0, longestStreak: 0, activeDates: [] },
  badges: {},
  challenges: [],
}

// Map a server challenge row onto the rich Challenge shape (name/icon/etc.)
function hydrateServerChallenge(row: {
  key: string
  target: number
  current: number
  completed: boolean
  weekStart: string
}): Challenge | null {
  const def = WEEKLY_CHALLENGES.find(c => c.id === row.key)
  if (!def) return null
  const start = new Date(row.weekStart)
  const end = new Date(start)
  end.setUTCDate(start.getUTCDate() + 6)
  end.setUTCHours(23, 59, 59, 999)
  return {
    ...def,
    goalValue: row.target,
    currentProgress: row.current,
    isCompleted: row.completed,
    isActive: true,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

function hydrateState(data: {
  profileId?: string | null
  stats?: GamificationState['stats']
  badges?: Record<string, ServerBadgeState>
  challenges?: Array<{ key: string; target: number; current: number; completed: boolean; weekStart: string }>
}): GamificationState {
  return {
    profileId: data.profileId ?? null,
    stats: data.stats ?? EMPTY_STATE.stats,
    badges: data.badges ?? {},
    challenges: (data.challenges ?? [])
      .map(hydrateServerChallenge)
      .filter((c): c is Challenge => c != null),
  }
}

/**
 * Read the user's real gamification state (badges + challenges + streak stats)
 * from the server. Read-only; safe to call on render.
 */
export async function fetchGamificationState(): Promise<GamificationState> {
  if (typeof window === 'undefined') return EMPTY_STATE
  try {
    const res = await fetch('/api/badges', { credentials: 'include' })
    if (!res.ok) return EMPTY_STATE
    const data = await res.json()
    if (!data?.success) return EMPTY_STATE
    if (data.profileId) setLeaderboardUserProfileId(data.profileId)
    return hydrateState(data)
  } catch (e) {
    console.error('Error loading gamification state:', e)
    return EMPTY_STATE
  }
}

/**
 * Persist newly-earned badges and advance weekly challenge progress on the
 * server (auth + CSRF). Returns the fresh authoritative state.
 */
export async function syncGamificationState(): Promise<GamificationState> {
  if (typeof window === 'undefined') return EMPTY_STATE
  try {
    const { csrfFetch } = await import('@/lib/api/csrfFetch')
    const res = await csrfFetch('/api/badges', { method: 'POST', body: '{}' })
    if (!res.ok) return fetchGamificationState()
    const data = await res.json()
    if (!data?.success) return fetchGamificationState()
    if (data.profileId) setLeaderboardUserProfileId(data.profileId)
    return hydrateState(data)
  } catch (e) {
    console.error('Error syncing gamification state:', e)
    return fetchGamificationState()
  }
}

/** Async, DB-backed weekly challenges (advances from real analysis events). */
export async function getActiveChallengesAsync(): Promise<Challenge[]> {
  const state = await fetchGamificationState()
  return state.challenges.length > 0 ? state.challenges : getActiveChallenges()
}

export function updateChallengeProgress(challengeId: string, progress: number): Challenge | null {
  const challenges = getActiveChallenges()
  const index = challenges.findIndex(c => c.id === challengeId)
  
  if (index < 0) return null
  
  challenges[index].currentProgress = progress
  
  // Check if completed
  if (progress >= challenges[index].goalValue && !challenges[index].isCompleted) {
    challenges[index].isCompleted = true
    
    // Award points and badge
    const userProgress = getUserProgress()
    userProgress.totalPoints += challenges[index].pointsReward
    userProgress.challengesCompleted.push(challengeId)
    userProgress.currentLevel = calculateLevel(userProgress.totalPoints)
    saveUserProgress(userProgress)
  }
  
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_CHALLENGES, JSON.stringify(challenges))
  }
  
  return challenges[index]
}

// ============================================
// LEADERBOARD FUNCTIONS (Real Data)
// ============================================
//
// The leaderboard is sourced from real stored analysis data via the
// /api/leaderboard route (Prisma aggregation). Because the existing UI calls
// getLeaderboard() synchronously, we keep a synchronous signature backed by a
// small in-memory cache: each call kicks off a background refresh and returns
// the most recently fetched real data. Until real data has loaded (or if there
// is genuinely no stored data), an honest empty "no rankings yet" state is
// returned. Entries are NEVER fabricated.

const STORAGE_KEY_LEADERBOARD_USER = 'bball_leaderboard_user_profile_id'

// Cache keyed by leaderboard type so switching tabs reuses fetched data.
const leaderboardCache = new Map<LeaderboardData['type'], LeaderboardData>()
const leaderboardInFlight = new Set<LeaderboardData['type']>()

function getCurrentUserProfileId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(STORAGE_KEY_LEADERBOARD_USER)
  } catch {
    return null
  }
}

/**
 * Persist the signed-in user's real UserProfile id so the leaderboard can flag
 * their row ("You") and report their rank. The id is derived server-side and
 * provided by GET /api/badges (or any caller that knows it) — never guessed.
 */
export function setLeaderboardUserProfileId(profileId: string | null): void {
  if (typeof window === 'undefined' || !profileId) return
  try {
    localStorage.setItem(STORAGE_KEY_LEADERBOARD_USER, profileId)
  } catch {
    /* ignore quota/availability errors */
  }
}

let identityPromise: Promise<string | null> | null = null

/**
 * Ensure the leaderboard user-profile id is populated. If we don't yet have it
 * cached, fetch it once from GET /api/badges (which derives it from the session)
 * and store it. De-duped across concurrent callers.
 */
export async function ensureLeaderboardIdentity(): Promise<string | null> {
  if (typeof window === 'undefined') return null
  const existing = getCurrentUserProfileId()
  if (existing) return existing
  if (identityPromise) return identityPromise

  identityPromise = (async () => {
    try {
      const res = await fetch('/api/badges', { credentials: 'include' })
      if (!res.ok) return null
      const data = await res.json()
      if (data?.profileId) {
        setLeaderboardUserProfileId(data.profileId)
        return data.profileId as string
      }
    } catch {
      /* ignore */
    } finally {
      identityPromise = null
    }
    return null
  })()

  return identityPromise
}

function emptyLeaderboard(
  type: LeaderboardData['type'],
  ageGroup: string,
  skillLevel: string
): LeaderboardData {
  return {
    type,
    ageGroup,
    skillLevel,
    entries: [],
    userRank: 0,
    totalParticipants: 0
  }
}

/**
 * Fetch real leaderboard data from the API and update the cache.
 * Safe to call repeatedly; de-dupes concurrent requests per type.
 */
async function refreshLeaderboard(
  type: LeaderboardData['type'],
  ageGroup: string,
  skillLevel: string
): Promise<void> {
  if (typeof window === 'undefined' || leaderboardInFlight.has(type)) return
  leaderboardInFlight.add(type)
  try {
    // Make sure we know who "You" are before requesting, so the user's row is
    // flagged and their rank is reported.
    const userProfileId = getCurrentUserProfileId() || (await ensureLeaderboardIdentity())
    const params = new URLSearchParams({ type, limit: '10' })
    if (userProfileId) params.set('userProfileId', userProfileId)
    // Forward the cohort filters so the API can scope rankings by cohort.
    if (ageGroup) params.set('ageGroup', ageGroup)
    if (skillLevel) params.set('skillLevel', skillLevel)

    const res = await fetch(`/api/leaderboard?${params.toString()}`, { credentials: 'include' })
    if (!res.ok) return
    const data = await res.json()
    if (!data || data.success === false) return

    leaderboardCache.set(type, {
      type,
      ageGroup,
      skillLevel,
      entries: Array.isArray(data.entries) ? data.entries : [],
      userRank: typeof data.userRank === 'number' ? data.userRank : 0,
      totalParticipants:
        typeof data.totalParticipants === 'number' ? data.totalParticipants : 0
    })
  } catch (e) {
    console.error('Error loading leaderboard:', e)
  } finally {
    leaderboardInFlight.delete(type)
  }
}

/**
 * Returns the leaderboard for the given type. Backed by real stored data.
 *
 * Synchronous to preserve the existing call site; triggers a background refresh
 * and returns cached real data when available, otherwise an empty
 * "no rankings yet" state. Never returns fabricated entries.
 */
export function getLeaderboard(
  type: LeaderboardData['type'],
  ageGroup: string,
  skillLevel: string
): LeaderboardData {
  // Kick off a background refresh so subsequent renders/tab switches show
  // up-to-date real data.
  void refreshLeaderboard(type, ageGroup, skillLevel)

  const cached = leaderboardCache.get(type)
  if (cached) {
    return { ...cached, ageGroup, skillLevel }
  }

  return emptyLeaderboard(type, ageGroup, skillLevel)
}

/**
 * Async variant that always reflects the latest real data from the API.
 * Preferred for new call sites that can await.
 */
export async function getLeaderboardAsync(
  type: LeaderboardData['type'],
  ageGroup: string,
  skillLevel: string
): Promise<LeaderboardData> {
  await refreshLeaderboard(type, ageGroup, skillLevel)
  const cached = leaderboardCache.get(type)
  return cached
    ? { ...cached, ageGroup, skillLevel }
    : emptyLeaderboard(type, ageGroup, skillLevel)
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function getRarityColor(rarity: Badge['rarity']): string {
  switch (rarity) {
    case 'common': return '#888888'
    case 'uncommon': return '#4CAF50'
    case 'rare': return '#2196F3'
    case 'epic': return '#9C27B0'
    case 'legendary': return '#FF6B35'
    default: return '#888888'
  }
}

export function getDifficultyColor(difficulty: Challenge['difficulty']): string {
  switch (difficulty) {
    case 'easy': return '#4CAF50'
    case 'medium': return '#FF9800'
    case 'hard': return '#F44336'
    case 'extreme': return '#9C27B0'
    default: return '#888888'
  }
}

export function formatPoints(points: number): string {
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}k`
  }
  return points.toString()
}

