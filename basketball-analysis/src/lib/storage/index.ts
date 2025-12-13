/**
 * Storage Module Exports
 * Central export point for all storage functionality
 */

// S3 Client and Configuration
export {
  s3Client,
  S3_CONFIG,
  S3_FOLDERS,
  SHOOTING_ANGLES,
  CAPTURE_PHASES,
  generateShooterImagePath,
  generateUserUploadPath,
  getS3Url,
} from "./s3Client"

// Storage Service Functions
export {
  uploadImage,
  uploadShooterImage,
  uploadUserImage,
  getSignedImageUrl,
  deleteImage,
  listShooterImages,
  listUserSessionImages,
  imageExists,
  getImageMetadata,
  base64ToBuffer,
  generateUniqueFilename,
  type UploadResult,
  type ImageMetadata,
} from "./storageService"


