// Coaching Personas
export {
  COACHING_PERSONAS,
  ELEMENTARY_PERSONA,
  MIDDLE_SCHOOL_PERSONA,
  HIGH_SCHOOL_PERSONA,
  COLLEGE_PERSONA,
  PROFESSIONAL_PERSONA,
  getCoachingPersona,
  getTierFromAge,
  interpretScore,
  generateFeedback,
} from "./coachingPersonas"

export type {
  CoachingPersona,
  CoachingFocus,
  FeedbackTemplate,
} from "./coachingPersonas"

// Tier Details
export {
  TIER_DETAILS,
  ELEMENTARY_TIER_DETAILS,
  MIDDLE_SCHOOL_TIER_DETAILS,
  HIGH_SCHOOL_TIER_DETAILS,
  COLLEGE_TIER_DETAILS,
  PROFESSIONAL_TIER_DETAILS,
  getTierDetails,
  isMetricOptimal,
  getPercentileRanking,
  getRecommendedDrills,
} from "./tierDetails"

export type {
  MetricRange,
  TierBenchmark,
  DrillRecommendation,
  TierAnalysisCriteria,
} from "./tierDetails"

// Analysis Integration
export {
  processAnalysisWithPersona,
  getTierPromptAdditions,
  formatAnalysisReport,
} from "./analysisIntegration"

export type {
  RawAnalysisData,
  UserProfileData,
  ProcessedAnalysis,
  ProcessedMetric,
  ProcessedFeedback,
  ComparisonData,
} from "./analysisIntegration"

// Feedback Generator
export {
  generateTierFeedback,
  getTierDisplayName,
  getStatusIcon,
} from "./feedbackGenerator"

export type {
  FeedbackContext,
  GeneratedFeedback,
} from "./feedbackGenerator"







