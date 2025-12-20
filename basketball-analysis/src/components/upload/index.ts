/**
 * @file index.ts (Upload Components)
 * @description Barrel exports for all upload-related components
 * 
 * COMPONENTS:
 * - MediaUpload - Image upload with 7-slot grid
 * - VideoUpload - Full video upload page component
 * - VideoUploadInline - Inline video upload for main page
 * - PlayerProfileForm - Player information form
 * - UploadEducation - Upload tips and guidance
 * - UploadQualityScore - Image quality scoring
 * - PreUploadValidation - Pre-upload validation display
 */

// Main upload components
export { MediaUpload } from "./MediaUpload"
export { VideoUpload } from "./VideoUpload"
export { VideoUploadInline } from "./VideoUploadInline"
export { PlayerProfileForm } from "./PlayerProfileForm"

// Upload guidance and validation
export { UploadEducation } from "./UploadEducation"
export { UploadQualityScore, CompactQualityScore } from "./UploadQualityScore"
export { PreUploadValidationDisplay, InlineValidation } from "./PreUploadValidation"
