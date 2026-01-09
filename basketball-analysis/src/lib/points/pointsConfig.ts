/**
 * ShotIQ Points System Configuration
 * 
 * This defines all point values, tiers, and time rewards for the gamification system.
 * Points refresh annually (not expire) - inactive points convert to XP badges after 1 year.
 */

// ============================================
// TIER DEFINITIONS
// ============================================

export type TierLevel = 'free' | 'starter' | 'standard' | 'professional' | 'elite'

export interface TierConfig {
  id: TierLevel
  name: string
  displayName: string
  pointsRequired: number
  initialTimeReward: number // days
  additionalTimeRate: number // points needed for bonus time
  additionalTimeDays: number // days earned per rate
  color: string
  icon: string
  features: string[]
}

export const TIERS: Record<TierLevel, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    displayName: 'FREE',
    pointsRequired: 0,
    initialTimeReward: 0,
    additionalTimeRate: 0,
    additionalTimeDays: 0,
    color: '#666666',
    icon: '🏀',
    features: [
      'Basic Dashboard',
      '3 analyses per day',
      'Manual workout creation',
      'Basic AI tips (2-3 per analysis)',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    displayName: 'STARTER',
    pointsRequired: 100,
    initialTimeReward: 3, // 3 days
    additionalTimeRate: 100, // every 100 points after unlock
    additionalTimeDays: 1, // +1 day
    color: '#22C55E',
    icon: '⭐',
    features: [
      'Everything in Free',
      '5 analyses per day',
      'Basic workout suggestions',
      'Enhanced AI tips (4-5 per analysis)',
    ],
  },
  standard: {
    id: 'standard',
    name: 'Standard',
    displayName: 'STANDARD',
    pointsRequired: 500,
    initialTimeReward: 7, // 1 week
    additionalTimeRate: 250, // every 250 points after unlock
    additionalTimeDays: 3, // +3 days
    color: '#3B82F6',
    icon: '💫',
    features: [
      'Everything in Starter',
      '10 analyses per day',
      'AI-suggested workouts',
      'Detailed AI feedback (5-7 tips)',
      'Compare to 3 elite shooters',
      'Weekly progress reports',
    ],
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    displayName: 'PROFESSIONAL',
    pointsRequired: 2000,
    initialTimeReward: 7, // 1 week
    additionalTimeRate: 500, // every 500 points after unlock
    additionalTimeDays: 5, // +5 days
    color: '#8B5CF6',
    icon: '💎',
    features: [
      'Everything in Standard',
      '20 analyses per day',
      'AI auto-generates workouts',
      'Advanced AI coaching',
      'Compare to ALL elite shooters',
      'Monthly trend reports',
    ],
  },
  elite: {
    id: 'elite',
    name: 'Elite',
    displayName: 'ELITE',
    pointsRequired: 5000,
    initialTimeReward: 7, // 1 week
    additionalTimeRate: 1000, // every 1000 points after unlock
    additionalTimeDays: 7, // +7 days
    color: '#F59E0B',
    icon: '👑',
    features: [
      'Everything in Professional',
      'Unlimited analyses',
      'AI creates full training programs',
      'AI predicts improvement areas',
      'Exclusive elite badges',
      'VIP share cards',
      'Beta feature access',
    ],
  },
}

// Get tier order for progression
export const TIER_ORDER: TierLevel[] = ['free', 'starter', 'standard', 'professional', 'elite']

// Tier icon identifiers (for use with Lucide icons in components)
export const TIER_ICONS: Record<TierLevel, string> = {
  free: 'circle',      // Basic circle
  starter: 'zap',      // Lightning bolt
  standard: 'target',  // Target/bullseye
  professional: 'gem', // Diamond/gem
  elite: 'crown',      // Crown
}

// ============================================
// POINT VALUES
// ============================================

export interface PointAction {
  id: string
  name: string
  description: string
  points: number
  cooldown?: number // milliseconds, undefined = no cooldown
  maxPerDay?: number // max times per day, undefined = unlimited
  category: 'engagement' | 'analysis' | 'workout' | 'social' | 'achievement' | 'streak'
}

export const POINT_ACTIONS: Record<string, PointAction> = {
  // ========== ENGAGEMENT ==========
  daily_login: {
    id: 'daily_login',
    name: 'Daily Login',
    description: 'First action of the day',
    points: 5,
    cooldown: 24 * 60 * 60 * 1000, // 24 hours
    maxPerDay: 1,
    category: 'engagement',
  },
  guide_card_swipe: {
    id: 'guide_card_swipe',
    name: 'Guide Card Swipe',
    description: 'Swipe through a guide card',
    points: 1,
    category: 'engagement',
  },
  guide_complete: {
    id: 'guide_complete',
    name: 'Complete Guide',
    description: 'Finish all guide cards',
    points: 50,
    cooldown: 7 * 24 * 60 * 60 * 1000, // Once per week
    category: 'engagement',
  },
  view_dashboard: {
    id: 'view_dashboard',
    name: 'View Dashboard',
    description: 'Check your dashboard',
    points: 1,
    cooldown: 24 * 60 * 60 * 1000,
    maxPerDay: 1,
    category: 'engagement',
  },
  view_results: {
    id: 'view_results',
    name: 'View Results',
    description: 'Review analysis results',
    points: 2,
    category: 'engagement',
  },
  share_card_swipe: {
    id: 'share_card_swipe',
    name: 'Share Card Swipe',
    description: 'Swipe through a share card',
    points: 2,
    category: 'engagement',
  },
  analytics_card_swipe: {
    id: 'analytics_card_swipe',
    name: 'Analytics Card Swipe',
    description: 'Swipe through an analytics card',
    points: 3,
    category: 'engagement',
  },
  analysis_card_view: {
    id: 'analysis_card_view',
    name: 'Analysis Card View',
    description: 'View an analysis card for the first time',
    points: 1,
    category: 'analysis',
  },
  player_card_swipe: {
    id: 'player_card_swipe',
    name: 'Player Card Swipe',
    description: 'Swipe through a player assessment card',
    points: 1,
    category: 'engagement',
  },
  compare_card_swipe: {
    id: 'compare_card_swipe',
    name: 'Compare Card Swipe',
    description: 'Swipe through an elite shooter comparison card',
    points: 1,
    category: 'engagement',
  },
  training_card_swipe: {
    id: 'training_card_swipe',
    name: 'Training Card Swipe',
    description: 'Swipe through a training drill card',
    points: 1,
    category: 'engagement',
  },
  flaw_view: {
    id: 'flaw_view',
    name: 'Flaw View',
    description: 'View a shooting flaw detail',
    points: 1,
    category: 'engagement',
  },
  goal_create: {
    id: 'goal_create',
    name: 'Goal Create',
    description: 'Create a new goal',
    points: 5,
    category: 'engagement',
  },
  goal_complete: {
    id: 'goal_complete',
    name: 'Goal Complete',
    description: 'Complete a goal',
    points: 25,
    category: 'achievement',
  },
  elite_shooter_view: {
    id: 'elite_shooter_view',
    name: 'Elite Shooter View',
    description: 'View an elite shooter bio',
    points: 1,
    category: 'engagement',
  },
  badge_view: {
    id: 'badge_view',
    name: 'Badge View',
    description: 'View a badge detail',
    points: 1,
    category: 'engagement',
  },
  stat_popup_view: {
    id: 'stat_popup_view',
    name: 'Stat Popup View',
    description: 'View an analytics stat popup for details',
    points: 1,
    category: 'engagement',
  },

  // ========== ANALYSIS ==========
  upload_image: {
    id: 'upload_image',
    name: 'Upload Image',
    description: 'Upload a shot image for analysis',
    points: 10,
    category: 'analysis',
  },
  upload_video: {
    id: 'upload_video',
    name: 'Upload Video',
    description: 'Upload a shot video for analysis',
    points: 15,
    category: 'analysis',
  },
  live_session: {
    id: 'live_session',
    name: 'Live Session',
    description: 'Complete a live analysis session',
    points: 20,
    category: 'analysis',
  },
  receive_analysis: {
    id: 'receive_analysis',
    name: 'Receive Analysis',
    description: 'Get your analysis results',
    points: 5,
    category: 'analysis',
  },
  score_80_plus: {
    id: 'score_80_plus',
    name: 'Score 80+',
    description: 'Achieve a score of 80 or higher',
    points: 10,
    category: 'analysis',
  },
  score_90_plus: {
    id: 'score_90_plus',
    name: 'Score 90+',
    description: 'Achieve an elite score of 90+',
    points: 25,
    category: 'analysis',
  },
  improve_score: {
    id: 'improve_score',
    name: 'Improve Score',
    description: 'Beat your previous score',
    points: 15,
    category: 'analysis',
  },

  // ========== WORKOUT ==========
  create_workout: {
    id: 'create_workout',
    name: 'Create Workout',
    description: 'Create a new workout',
    points: 5,
    category: 'workout',
  },
  start_workout: {
    id: 'start_workout',
    name: 'Start Workout',
    description: 'Begin a workout session',
    points: 3,
    category: 'workout',
  },
  complete_workout: {
    id: 'complete_workout',
    name: 'Complete Workout',
    description: 'Finish a full workout',
    points: 20,
    category: 'workout',
  },
  complete_drill: {
    id: 'complete_drill',
    name: 'Complete Drill',
    description: 'Finish a single drill',
    points: 5,
    category: 'workout',
  },
  perfect_drill: {
    id: 'perfect_drill',
    name: 'Perfect Drill',
    description: 'Score perfectly on a drill',
    points: 10,
    category: 'workout',
  },
  weekly_goal: {
    id: 'weekly_goal',
    name: 'Weekly Goal',
    description: 'Complete your weekly workout goal',
    points: 50,
    cooldown: 7 * 24 * 60 * 60 * 1000,
    category: 'workout',
  },

  // ========== SOCIAL (Highest value for viral growth) ==========
  share_card: {
    id: 'share_card',
    name: 'Share Card',
    description: 'Share a card to social media',
    points: 25,
    maxPerDay: 5, // Prevent spam
    category: 'social',
  },
  share_analysis: {
    id: 'share_analysis',
    name: 'Share Analysis',
    description: 'Share your analysis results',
    points: 30,
    maxPerDay: 3,
    category: 'social',
  },
  share_achievement: {
    id: 'share_achievement',
    name: 'Share Achievement',
    description: 'Share a badge or achievement',
    points: 35,
    maxPerDay: 3,
    category: 'social',
  },
  share_workout: {
    id: 'share_workout',
    name: 'Share Workout',
    description: 'Share completed workout',
    points: 25,
    maxPerDay: 3,
    category: 'social',
  },
  invite_friend: {
    id: 'invite_friend',
    name: 'Invite Friend',
    description: 'Send an invite to a friend',
    points: 10,
    maxPerDay: 10,
    category: 'social',
  },
  friend_joins: {
    id: 'friend_joins',
    name: 'Friend Joins',
    description: 'A friend you invited joins the app',
    points: 100,
    category: 'social',
  },
  friend_first_analysis: {
    id: 'friend_first_analysis',
    name: 'Friend First Analysis',
    description: 'Your referred friend completes their first analysis',
    points: 50,
    category: 'social',
  },

  // ========== ACHIEVEMENTS ==========
  first_analysis: {
    id: 'first_analysis',
    name: 'First Analysis',
    description: 'Complete your first shot analysis',
    points: 25,
    category: 'achievement',
  },
  form_fixer: {
    id: 'form_fixer',
    name: 'Form Fixer',
    description: 'Fix a shooting form flaw',
    points: 50,
    category: 'achievement',
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Maintain a 7-day streak',
    points: 75,
    category: 'achievement',
  },
  elite_scorer: {
    id: 'elite_scorer',
    name: 'Elite Scorer',
    description: 'Achieve a 90+ score',
    points: 100,
    category: 'achievement',
  },
  social_butterfly: {
    id: 'social_butterfly',
    name: 'Social Butterfly',
    description: 'Share 5 times',
    points: 50,
    category: 'achievement',
  },
  gym_rat: {
    id: 'gym_rat',
    name: 'Gym Rat',
    description: 'Complete 10 workouts',
    points: 100,
    category: 'achievement',
  },
  sharp_shooter: {
    id: 'sharp_shooter',
    name: 'Sharp Shooter',
    description: 'Improve your score 5 times',
    points: 150,
    category: 'achievement',
  },
  legend: {
    id: 'legend',
    name: 'Legend',
    description: 'Maintain a 30-day streak',
    points: 300,
    category: 'achievement',
  },
}

// ============================================
// STREAK BONUSES
// ============================================

export interface StreakBonus {
  days: number
  dailyBonus: number // Extra points per day
  timeBonus: number // Bonus days added to current tier
  badgeId?: string
}

export const STREAK_BONUSES: StreakBonus[] = [
  { days: 3, dailyBonus: 5, timeBonus: 1 },
  { days: 7, dailyBonus: 10, timeBonus: 2, badgeId: 'week_warrior' },
  { days: 14, dailyBonus: 15, timeBonus: 3 },
  { days: 30, dailyBonus: 25, timeBonus: 7, badgeId: 'legend' },
  { days: 60, dailyBonus: 40, timeBonus: 14 },
  { days: 100, dailyBonus: 60, timeBonus: 21 },
]

// ============================================
// TIME CONSTANTS
// ============================================

export const POINTS_REFRESH_PERIOD = 365 * 24 * 60 * 60 * 1000 // 1 year in ms
export const INACTIVE_THRESHOLD = 30 * 24 * 60 * 60 * 1000 // 30 days - after this, points start converting to XP

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the next tier from current tier
 */
export function getNextTier(currentTier: TierLevel): TierLevel | null {
  const currentIndex = TIER_ORDER.indexOf(currentTier)
  if (currentIndex === -1 || currentIndex === TIER_ORDER.length - 1) {
    return null
  }
  return TIER_ORDER[currentIndex + 1]
}

/**
 * Get tier by points
 */
export function getTierByPoints(points: number): TierLevel {
  // Return highest tier the user qualifies for
  for (let i = TIER_ORDER.length - 1; i >= 0; i--) {
    const tier = TIERS[TIER_ORDER[i]]
    if (points >= tier.pointsRequired) {
      return TIER_ORDER[i]
    }
  }
  return 'free'
}

/**
 * Get points needed for next tier
 */
export function getPointsToNextTier(currentPoints: number): { tier: TierLevel; pointsNeeded: number } | null {
  const currentTier = getTierByPoints(currentPoints)
  const nextTier = getNextTier(currentTier)
  
  if (!nextTier) return null
  
  const nextTierConfig = TIERS[nextTier]
  return {
    tier: nextTier,
    pointsNeeded: nextTierConfig.pointsRequired - currentPoints,
  }
}

/**
 * Calculate bonus time earned for a tier based on points above threshold
 */
export function calculateBonusTime(tier: TierLevel, totalPoints: number): number {
  const tierConfig = TIERS[tier]
  if (totalPoints < tierConfig.pointsRequired) return 0
  
  const pointsAboveThreshold = totalPoints - tierConfig.pointsRequired
  const bonusIntervals = Math.floor(pointsAboveThreshold / tierConfig.additionalTimeRate)
  
  return tierConfig.initialTimeReward + (bonusIntervals * tierConfig.additionalTimeDays)
}
