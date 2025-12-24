/**
 * @file index.ts (Stores)
 * @description Barrel exports for Zustand state stores
 * 
 * STORES:
 * - analysisStore - Main analysis state (uploads, results, progress)
 * - profileStore - User profile state
 * 
 * USAGE:
 * import { useAnalysisStore, useProfileStore } from "@/stores"
 * 
 * // In component:
 * const { uploadedFile, setUploadedFile } = useAnalysisStore()
 * const { profile, setProfile } = useProfileStore()
 */

// Main analysis store
export { useAnalysisStore } from "./analysisStore"
export type { VisionAnalysisResult } from "./analysisStore"

// Profile store
export { useProfileStore } from "./profileStore"








