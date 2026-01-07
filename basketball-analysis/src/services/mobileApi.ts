/**
 * Mobile API Service
 * 
 * This service provides API calls for mobile (Capacitor) builds.
 * Instead of using Next.js API routes (which don't work in static export),
 * mobile apps call the backend API directly.
 * 
 * Used by: iOS and Android apps via Capacitor
 * 
 * The backend URL is configured via environment variables:
 * - NEXT_PUBLIC_API_URL: The base URL for API calls
 * - Default: https://api.shotiqai.com (production) or http://localhost:5001 (dev)
 */

import { isMobile, isWeb } from '@/utils/platform';

// API Configuration
const getApiBaseUrl = (): string => {
  // For mobile apps, always use the external API
  if (isMobile()) {
    return process.env.NEXT_PUBLIC_MOBILE_API_URL || 
           process.env.NEXT_PUBLIC_API_URL || 
           'https://api.shotiqai.com';
  }
  
  // For web, use relative URLs (Next.js API routes)
  if (isWeb()) {
    return '/api';
  }
  
  // Desktop (Tauri) - use external API
  return process.env.NEXT_PUBLIC_API_URL || 'https://api.shotiqai.com';
};

// Generic fetch wrapper with error handling
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  
  return response.json();
}

// ============================================
// Analysis APIs
// ============================================

export interface AnalyzeImageRequest {
  image: string; // Base64 encoded image
  analysisType?: 'full' | 'quick';
}

export interface AnalyzeImageResponse {
  success: boolean;
  keypoints?: any;
  angles?: any;
  score?: number;
  feedback?: string[];
  error?: string;
}

export async function analyzeImage(
  request: AnalyzeImageRequest
): Promise<AnalyzeImageResponse> {
  // For mobile, call the Python backend directly
  if (isMobile()) {
    return apiFetch<AnalyzeImageResponse>('/analyze/image', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  // For web, use Next.js API route
  return apiFetch<AnalyzeImageResponse>('/vision-analyze', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

export interface AnalyzeVideoRequest {
  videoUrl: string;
  analysisType?: 'full' | 'quick';
}

export interface AnalyzeVideoResponse {
  success: boolean;
  frames?: any[];
  analysis?: any;
  error?: string;
}

export async function analyzeVideo(
  request: AnalyzeVideoRequest
): Promise<AnalyzeVideoResponse> {
  if (isMobile()) {
    return apiFetch<AnalyzeVideoResponse>('/analyze/video', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }
  
  // Web uses a different endpoint structure
  return apiFetch<AnalyzeVideoResponse>('/analyze-video', {
    method: 'POST',
    body: JSON.stringify(request),
  });
}

// ============================================
// Drill APIs
// ============================================

export interface DrillFeedback {
  drillId: string;
  drillName: string;
  focusArea?: string;
  mediaType: 'image' | 'video';
  mediaUrl?: string;
  thumbnailUrl?: string;
  workoutId?: string;
  workoutName?: string;
  workoutDate?: string;
  analysisType?: string;
  coachAnalysis?: any;
}

export async function saveDrillFeedback(
  feedback: DrillFeedback
): Promise<{ success: boolean; id?: string }> {
  const endpoint = isMobile() ? '/drills/feedback' : '/drill-feedback';
  
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(feedback),
  });
}

export async function getDrillVideos(): Promise<{ success: boolean; videos: any[] }> {
  const endpoint = isMobile() ? '/drills/videos' : '/drill-videos';
  return apiFetch(endpoint);
}

export async function getDrillVideo(id: string): Promise<{ success: boolean; video: any }> {
  const endpoint = isMobile() ? `/drills/videos/${id}` : `/drill-videos/${id}`;
  return apiFetch(endpoint);
}

// ============================================
// Profile APIs
// ============================================

export interface UserProfile {
  id?: string;
  name?: string;
  email?: string;
  level?: string;
  totalSessions?: number;
  averageScore?: number;
}

export async function getProfile(): Promise<{ success: boolean; profile: UserProfile }> {
  const endpoint = isMobile() ? '/user/profile' : '/profile';
  return apiFetch(endpoint);
}

export async function updateProfile(
  profile: Partial<UserProfile>
): Promise<{ success: boolean; profile: UserProfile }> {
  const endpoint = isMobile() ? '/user/profile' : '/profile';
  
  return apiFetch(endpoint, {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

// ============================================
// Upload APIs
// ============================================

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

export async function uploadImage(
  imageBase64: string,
  uploadType: 'user' | 'shooter' = 'user'
): Promise<UploadResponse> {
  const endpoint = isMobile() ? '/upload/image' : '/upload';
  
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      base64Image: imageBase64,
      uploadType,
    }),
  });
}

// ============================================
// Analysis History APIs
// ============================================

export interface AnalysisSession {
  id: string;
  date: string;
  score: number;
  imageUrl?: string;
  feedback?: string[];
}

export async function getAnalysisHistory(): Promise<{ 
  success: boolean; 
  sessions: AnalysisSession[] 
}> {
  const endpoint = isMobile() ? '/user/analysis-history' : '/analysis-history';
  return apiFetch(endpoint);
}

export async function saveAnalysis(
  analysis: any
): Promise<{ success: boolean; id?: string }> {
  const endpoint = isMobile() ? '/user/analysis' : '/save-analysis';
  
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify(analysis),
  });
}

// ============================================
// Shooter Comparison APIs
// ============================================

export async function compareShooters(
  userKeypoints: any,
  shooterId?: string
): Promise<{ success: boolean; comparison: any }> {
  const endpoint = isMobile() ? '/compare/shooters' : '/compare-shooters';
  
  return apiFetch(endpoint, {
    method: 'POST',
    body: JSON.stringify({
      userKeypoints,
      shooterId,
    }),
  });
}

// ============================================
// Export all functions
// ============================================

export const mobileApi = {
  // Analysis
  analyzeImage,
  analyzeVideo,
  
  // Drills
  saveDrillFeedback,
  getDrillVideos,
  getDrillVideo,
  
  // Profile
  getProfile,
  updateProfile,
  
  // Upload
  uploadImage,
  
  // History
  getAnalysisHistory,
  saveAnalysis,
  
  // Comparison
  compareShooters,
};

export default mobileApi;





