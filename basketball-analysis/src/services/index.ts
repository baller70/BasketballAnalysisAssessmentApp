/**
 * @file index.ts (Services)
 * @description Barrel exports for all business logic services
 * 
 * ANALYSIS SERVICES:
 * - visionAnalysis - Image pose detection via on-device MoveNet (services/pose)
 * - videoAnalysis - Client-side frame extraction + on-device MoveNet per frame
 * - pose/ - Pluggable PoseProvider (canonical: MoveNetProvider; optional: HybridApiProvider)
 * 
 * DATA SERVICES:
 * - sessionStorage - localStorage session management
 * - eliteShooters - Elite shooter data access
 * 
 * INTELLIGENCE SERVICES:
 * - coachingInsights - AI coaching feedback generation
 * - comparisonAlgorithm - Elite shooter matching algorithm
 * - gamificationService - Points, badges, streaks tracking
 */

// Analysis services
export { 
  analyzeShootingForm,
  checkHybridServerHealth,
} from "./visionAnalysis"

export {
  analyzeVideoShooting,
  convertVideoToSessionFormat,
  checkVideoAnalysisSupport,
} from "./videoAnalysis"
export type { 
  VideoAnalysisResult,
  KeyScreenshot,
} from "./videoAnalysis"

// Data services
export {
  saveSession,
  getAllSessions,
  getSessionById,
  getLatestSessionByMediaType,
  deleteSession,
  createSessionFromAnalysis,
  generateAnalytics,
  detectMilestones,
  getUnachievedMilestones,
  isStorageAvailable,
  getStorageInfo,
} from "./sessionStorage"
export type {
  AnalysisSession,
  SessionScreenshot,
  SessionAnalysisData,
  AnalyticsData,
  Milestone,
} from "./sessionStorage"

// Intelligence services
export {
  generateCoachingTip,
  generateMotivationalMessage,
  generateDetailedAnalysisReport,
  generateWeeklyPerformanceSummary,
} from "./coachingInsights"

export {
  findTopMatches,
  extractOptimalMechanics,
  compareUserToOptimal,
  generateCoachingFeedback,
  runFullComparison,
  determineAgeGroup,
  determineBodyBuild,
} from "./comparisonAlgorithm"

export {
  getUserProgress,
  saveUserProgress,
  addPoints,
  calculateLevel,
  updateStreak,
  checkStreakStatus,
  checkBadgeUnlock,
  getEarnedBadges,
  getUnearnedBadges,
  getActiveChallenges,
  generateWeeklyChallenges,
  updateChallengeProgress,
  getLeaderboard,
  ALL_BADGES,
  USER_LEVELS,
  WEEKLY_CHALLENGES,
} from "./gamificationService"

// Image enhancement services
export {
  enhanceImage,
  enhanceBasic,
  enhanceHD,
  enhancePremium,
  clearEnhancementCache,
  getEnhancementCacheStats,
} from "./imageEnhancement"
export type {
  EnhancementTier,
  EnhancementResult,
} from "./imageEnhancement"
