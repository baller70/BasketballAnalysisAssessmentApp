/**
 * Application-wide constants
 */

// API Endpoints
export const API_ENDPOINTS = {
  DETECT_BASKETBALL: "/api/detect-basketball",
  DETECT_POSE: "/api/detect-pose",
  ANALYZE_FORM: "/api/analyze-form",
  UPLOAD: "/api/upload",
  SAVE_ANALYSIS: "/api/save-analysis",
  PROFILE: "/api/profile",
} as const

// External API URLs
export const HYBRID_API_URL = process.env.NEXT_PUBLIC_HYBRID_API_URL || "http://localhost:5001"

// File size limits
export const FILE_LIMITS = {
  MAX_IMAGE_SIZE_MB: 10,
  MAX_VIDEO_SIZE_MB: 50,
  MAX_IMAGE_SIZE_BYTES: 10 * 1024 * 1024,
  MAX_VIDEO_SIZE_BYTES: 50 * 1024 * 1024,
} as const

// Video constraints
export const VIDEO_CONSTRAINTS = {
  MAX_DURATION_SECONDS: 10,
  TARGET_FPS: 10,
  SUPPORTED_FORMATS: ["video/mp4", "video/mov", "video/webm"],
} as const

// Image constraints
export const IMAGE_CONSTRAINTS = {
  MIN_IMAGES: 3,
  MAX_IMAGES: 7,
  SUPPORTED_FORMATS: ["image/jpeg", "image/png", "image/webp"],
} as const

// Analysis score thresholds
export const SCORE_THRESHOLDS = {
  EXCELLENT: 85,
  GOOD: 65,
  NEEDS_IMPROVEMENT: 50,
} as const

// Form categories
export const FORM_CATEGORIES = {
  EXCELLENT: "EXCELLENT",
  GOOD: "GOOD",
  NEEDS_IMPROVEMENT: "NEEDS_IMPROVEMENT",
  CRITICAL: "CRITICAL",
} as const

// Optimal angle ranges for shooting form
export const OPTIMAL_ANGLES = {
  ELBOW: { min: 80, max: 100 },
  KNEE: { min: 130, max: 170 },
  SHOULDER: { min: 80, max: 110 },
  HIP: { min: 160, max: 180 },
} as const

// Animation durations (ms)
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

// Local storage keys
export const STORAGE_KEYS = {
  ANALYSIS_SESSIONS: "basketball_analysis_sessions",
  USER_PROFILE: "basketball_user_profile",
  GAMIFICATION_PROGRESS: "basketball_gamification_progress",
  SETTINGS: "basketball_settings",
} as const

// Color tokens (matching Tailwind config)
export const COLORS = {
  PRIMARY: "#FFD700", // Gold
  BACKGROUND: "#1a1a1a",
  CARD: "#2C2C2C",
  BORDER: "#3a3a3a",
  TEXT_PRIMARY: "#E5E5E5",
  TEXT_SECONDARY: "#888",
  SUCCESS: "#22c55e",
  WARNING: "#eab308",
  ERROR: "#ef4444",
} as const

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const

