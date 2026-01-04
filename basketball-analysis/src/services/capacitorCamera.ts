/**
 * Capacitor Camera Service
 * 
 * Provides camera functionality for mobile apps using Capacitor.
 * Falls back to web camera API on non-mobile platforms.
 * 
 * Features:
 * - Take photos using native camera
 * - Select photos from gallery
 * - Record videos
 * - Handle permissions
 */

import { isMobile, isIOS, isAndroid } from '@/utils/platform';

// Types
export interface CameraPhoto {
  base64String?: string;
  dataUrl?: string;
  path?: string;
  webPath?: string;
  format: 'jpeg' | 'png' | 'gif';
  saved: boolean;
}

export interface CameraPermissionStatus {
  camera: 'granted' | 'denied' | 'prompt';
  photos: 'granted' | 'denied' | 'prompt';
}

export type CameraSource = 'camera' | 'photos' | 'prompt';
export type CameraDirection = 'front' | 'rear';

export interface CameraOptions {
  quality?: number; // 0-100
  allowEditing?: boolean;
  resultType?: 'uri' | 'base64' | 'dataUrl';
  source?: CameraSource;
  direction?: CameraDirection;
  width?: number;
  height?: number;
  correctOrientation?: boolean;
  saveToGallery?: boolean;
  promptLabelHeader?: string;
  promptLabelCancel?: string;
  promptLabelPhoto?: string;
  promptLabelPicture?: string;
}

// Default options
const defaultOptions: CameraOptions = {
  quality: 90,
  allowEditing: false,
  resultType: 'base64',
  source: 'prompt',
  direction: 'rear',
  correctOrientation: true,
  saveToGallery: false,
  promptLabelHeader: 'Select Image Source',
  promptLabelCancel: 'Cancel',
  promptLabelPhoto: 'From Gallery',
  promptLabelPicture: 'Take Photo',
};

/**
 * Check if camera is available on this platform
 */
export function isCameraAvailable(): boolean {
  if (isMobile()) {
    return true; // Capacitor Camera is always available on mobile
  }
  
  // Check for web camera API
  return typeof navigator !== 'undefined' && 
         typeof navigator.mediaDevices !== 'undefined' &&
         typeof navigator.mediaDevices.getUserMedia !== 'undefined';
}

/**
 * Request camera permissions
 */
export async function requestCameraPermissions(): Promise<CameraPermissionStatus> {
  if (isMobile()) {
    try {
      // @ts-ignore - Capacitor may not be installed
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.requestPermissions();
      return {
        camera: permissions.camera,
        photos: permissions.photos,
      };
    } catch (error) {
      console.error('Failed to request camera permissions:', error);
      return { camera: 'denied', photos: 'denied' };
    }
  }
  
  // Web: request via getUserMedia
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach(track => track.stop());
    return { camera: 'granted', photos: 'granted' };
  } catch (error) {
    return { camera: 'denied', photos: 'denied' };
  }
}

/**
 * Check current camera permissions
 */
export async function checkCameraPermissions(): Promise<CameraPermissionStatus> {
  if (isMobile()) {
    try {
      // @ts-ignore - Capacitor may not be installed
      const { Camera } = await import('@capacitor/camera');
      const permissions = await Camera.checkPermissions();
      return {
        camera: permissions.camera,
        photos: permissions.photos,
      };
    } catch (error) {
      console.error('Failed to check camera permissions:', error);
      return { camera: 'prompt', photos: 'prompt' };
    }
  }
  
  // Web: check via permissions API if available
  if (typeof navigator !== 'undefined' && navigator.permissions) {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      return { 
        camera: result.state as 'granted' | 'denied' | 'prompt',
        photos: 'granted' // Web doesn't need photo library permission
      };
    } catch {
      return { camera: 'prompt', photos: 'granted' };
    }
  }
  
  return { camera: 'prompt', photos: 'granted' };
}

/**
 * Take a photo using the camera
 */
export async function takePhoto(options: CameraOptions = {}): Promise<CameraPhoto | null> {
  const opts = { ...defaultOptions, ...options };
  
  if (isMobile()) {
    return takePhotoCapacitor(opts);
  }
  
  return takePhotoWeb(opts);
}

/**
 * Take photo using Capacitor (mobile)
 */
async function takePhotoCapacitor(options: CameraOptions): Promise<CameraPhoto | null> {
  try {
    // @ts-ignore - Capacitor may not be installed
    const { Camera, CameraResultType, CameraSource, CameraDirection } = await import('@capacitor/camera');
    
    const resultTypeMap = {
      'uri': CameraResultType.Uri,
      'base64': CameraResultType.Base64,
      'dataUrl': CameraResultType.DataUrl,
    };
    
    const sourceMap = {
      'camera': CameraSource.Camera,
      'photos': CameraSource.Photos,
      'prompt': CameraSource.Prompt,
    };
    
    const directionMap = {
      'front': CameraDirection.Front,
      'rear': CameraDirection.Rear,
    };
    
    const image = await Camera.getPhoto({
      quality: options.quality,
      allowEditing: options.allowEditing,
      resultType: resultTypeMap[options.resultType || 'base64'],
      source: sourceMap[options.source || 'prompt'],
      direction: directionMap[options.direction || 'rear'],
      width: options.width,
      height: options.height,
      correctOrientation: options.correctOrientation,
      saveToGallery: options.saveToGallery,
      promptLabelHeader: options.promptLabelHeader,
      promptLabelCancel: options.promptLabelCancel,
      promptLabelPhoto: options.promptLabelPhoto,
      promptLabelPicture: options.promptLabelPicture,
    });
    
    return {
      base64String: image.base64String,
      dataUrl: image.dataUrl,
      path: image.path,
      webPath: image.webPath,
      format: image.format as 'jpeg' | 'png' | 'gif',
      saved: image.saved || false,
    };
    
  } catch (error: any) {
    // User cancelled
    if (error.message?.includes('User cancelled')) {
      return null;
    }
    console.error('Capacitor camera error:', error);
    throw error;
  }
}

/**
 * Take photo using web camera API
 */
async function takePhotoWeb(options: CameraOptions): Promise<CameraPhoto | null> {
  return new Promise((resolve, reject) => {
    // Create file input for photo selection
    if (options.source === 'photos') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const base64 = await fileToBase64(file);
        resolve({
          base64String: base64.split(',')[1],
          dataUrl: base64,
          format: 'jpeg',
          saved: false,
        });
      };
      
      input.click();
      return;
    }
    
    // For camera, use getUserMedia
    if (options.source === 'camera') {
      // This would require a modal with video preview
      // For now, fall back to file input with capture
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.capture = options.direction === 'front' ? 'user' : 'environment';
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const base64 = await fileToBase64(file);
        resolve({
          base64String: base64.split(',')[1],
          dataUrl: base64,
          format: 'jpeg',
          saved: false,
        });
      };
      
      input.click();
      return;
    }
    
    // Prompt: show both options
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const base64 = await fileToBase64(file);
      resolve({
        base64String: base64.split(',')[1],
        dataUrl: base64,
        format: 'jpeg',
        saved: false,
      });
    };
    
    input.click();
  });
}

/**
 * Pick multiple photos from gallery
 */
export async function pickPhotos(limit: number = 7): Promise<CameraPhoto[]> {
  if (isMobile()) {
    try {
      // @ts-ignore - Capacitor may not be installed
      const { Camera, CameraResultType } = await import('@capacitor/camera');
      
      const result = await Camera.pickImages({
        quality: 90,
        limit,
      });
      
      return result.photos.map((photo: any) => ({
        base64String: photo.base64String,
        dataUrl: photo.dataUrl,
        path: photo.path,
        webPath: photo.webPath,
        format: photo.format as 'jpeg' | 'png' | 'gif',
        saved: false,
      }));
      
    } catch (error: any) {
      if (error.message?.includes('User cancelled')) {
        return [];
      }
      throw error;
    }
  }
  
  // Web: use file input with multiple
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    
    input.onchange = async (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (!files || files.length === 0) {
        resolve([]);
        return;
      }
      
      const photos: CameraPhoto[] = [];
      const fileArray = Array.from(files).slice(0, limit);
      
      for (const file of fileArray) {
        const base64 = await fileToBase64(file);
        photos.push({
          base64String: base64.split(',')[1],
          dataUrl: base64,
          format: 'jpeg',
          saved: false,
        });
      }
      
      resolve(photos);
    };
    
    input.click();
  });
}

/**
 * Pick a video from gallery or record one
 */
export async function pickVideo(source: CameraSource = 'prompt'): Promise<{
  path?: string;
  webPath?: string;
  duration?: number;
} | null> {
  if (isMobile()) {
    try {
      // @ts-ignore - Capacitor may not be installed
      const { Camera, CameraSource: CS } = await import('@capacitor/camera');
      
      const sourceMap = {
        'camera': CS.Camera,
        'photos': CS.Photos,
        'prompt': CS.Prompt,
      };
      
      const result = await Camera.pickVideo({
        source: sourceMap[source],
      });
      
      return {
        path: result.path,
        webPath: result.webPath,
        duration: result.duration,
      };
      
    } catch (error: any) {
      if (error.message?.includes('User cancelled')) {
        return null;
      }
      throw error;
    }
  }
  
  // Web: use file input for video
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    
    if (source === 'camera') {
      input.capture = 'environment';
    }
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      
      const url = URL.createObjectURL(file);
      resolve({
        webPath: url,
      });
    };
    
    input.click();
  });
}

// Helper function
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Export camera service
export const capacitorCamera = {
  isCameraAvailable,
  requestCameraPermissions,
  checkCameraPermissions,
  takePhoto,
  pickPhotos,
  pickVideo,
};

export default capacitorCamera;



