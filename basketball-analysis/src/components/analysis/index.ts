/**
 * @file index.ts (Analysis Components)
 * @description Barrel exports for all analysis-related components
 * 
 * DISPLAY COMPONENTS:
 * - AnalysisDashboard - Main analysis results dashboard
 * - AnnotatedImageDisplay - Image with pose annotations
 * - AutoScreenshots - Auto-generated analysis screenshots
 * - FormScoreCard - Overall form score display
 * 
 * POSE VISUALIZATION:
 * - SkeletonOverlay - Draw pose skeleton on canvas
 * - AngleIndicators - Display measured angles
 * - PoseAnalysis - Pose detection results
 * 
 * SHOT BREAKDOWN:
 * - ShotBreakdownStrip - Shot phase strip (Setup, Release, Follow-through)
 * - EnhancedShotStrip - Enhanced version with more details
 * 
 * PROGRESS & TRACKING:
 * - AnalysisProgress - Analysis progress bar
 * - ProgressTracker - Multi-step progress tracker
 * 
 * COMPARISON & EXPORT:
 * - SplitScreenComparison - Side-by-side comparison
 * - VideoFrameCapture - Capture frames from video
 * - ExportButton - Export analysis results
 */

// Pose visualization
export { SkeletonOverlay, drawSkeletonOnCanvas } from "./SkeletonOverlay"
export type { Keypoint } from "./SkeletonOverlay"

export { 
  AngleIndicators, 
  SingleAngleIndicator,
  createAngleDataFromMeasurements,
  SHOOTING_ANGLES,
} from "./AngleIndicators"
export type { AngleData } from "./AngleIndicators"

// Main display components
export { AnalysisDashboard } from "./AnalysisDashboard"
export { AnnotatedImageDisplay } from "./AnnotatedImageDisplay"
export { AutoScreenshots } from "./AutoScreenshots"
export { FormScoreCard } from "./FormScoreCard"
export { PoseAnalysis } from "./PoseAnalysis"

// Shot breakdown
export { ShotBreakdownStrip } from "./ShotBreakdownStrip"
export { EnhancedShotStrip } from "./EnhancedShotStrip"

// Progress tracking
export { AnalysisProgress } from "./AnalysisProgress"
export { ProgressTracker } from "./ProgressTracker"
export { AnalysisProgressScreen } from "./AnalysisProgressScreen"

// Comparison and export
export { SplitScreenComparison } from "./SplitScreenComparison"
export { VideoFrameCapture } from "./VideoFrameCapture"
export { ExportButton } from "./ExportButton"

// GSAP Video Player
export { GSAPVideoPlayer } from "./GSAPVideoPlayer"
export { VideoPlayerSection } from "./VideoPlayerSection"
