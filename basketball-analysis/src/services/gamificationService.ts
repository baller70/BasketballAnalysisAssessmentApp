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
  odentifier: string // Anonymous identifier
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
    color: '#FFD700',
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

export function checkBadgeUnlock(
  formScore: number,
  flawsCount: number,
  anglesUploaded: number,
  improvementPercentage: number
): Badge[] {
  const progress = getUserProgress()
  const newBadges: Badge[] = []
  const hour = new Date().getHours()
  
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

export function generateWeeklyChallenges(): Challenge[] {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1) // Monday
  startOfWeek.setHours(0, 0, 0, 0)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6) // Sunday
  endOfWeek.setHours(23, 59, 59, 999)
  
  // Select 3 random challenges for this week
  const shuffled = [...WEEKLY_CHALLENGES].sort(() => Math.random() - 0.5)
  const selected = shuffled.slice(0, 3)
  
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
// LEADERBOARD FUNCTIONS (Mock Data)
// ============================================

export function getLeaderboard(
  type: LeaderboardData['type'],
  ageGroup: string,
  skillLevel: string
): LeaderboardData {
  // Generate mock leaderboard data
  const userProgress = getUserProgress()
  const userScore = type === 'form_score' ? 78 : 
                    type === 'improvement' ? 15 :
                    type === 'streak' ? userProgress.currentStreak :
                    userProgress.totalAnalyses
  
  // Generate mock entries
  const mockEntries: LeaderboardEntry[] = []
  const scores = [95, 92, 89, 87, 85, 83, 81, 79, 77, 75, 73, 71, 69, 67, 65]
  
  let userInserted = false
  let userRank = 0
  
  for (let i = 0; i < 15; i++) {
    const score = type === 'streak' ? Math.floor(Math.random() * 30) + 1 :
                  type === 'engagement' ? Math.floor(Math.random() * 50) + 10 :
                  scores[i]
    
    // Insert user at appropriate position
    if (!userInserted && userScore >= score) {
      userRank = i + 1
      mockEntries.push({
        rank: userRank,
        identifier: 'You',
        score: userScore,
        level: userProgress.currentLevel,
        isCurrentUser: true,
        change: Math.floor(Math.random() * 5) - 2
      })
      userInserted = true
    }
    
    mockEntries.push({
      rank: userInserted ? i + 2 : i + 1,
      identifier: `Player_${String.fromCharCode(65 + i)}`,
      score,
      level: Math.ceil(score / 20),
      isCurrentUser: false,
      change: Math.floor(Math.random() * 5) - 2
    })
  }
  
  // If user wasn't inserted, add at end
  if (!userInserted) {
    userRank = mockEntries.length + 1
    mockEntries.push({
      rank: userRank,
      identifier: 'You',
      score: userScore,
      level: userProgress.currentLevel,
      isCurrentUser: true,
      change: Math.floor(Math.random() * 5) - 2
    })
  }
  
  return {
    type,
    ageGroup,
    skillLevel,
    entries: mockEntries.slice(0, 10),
    userRank,
    totalParticipants: 150
  }
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
    case 'legendary': return '#FFD700'
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

