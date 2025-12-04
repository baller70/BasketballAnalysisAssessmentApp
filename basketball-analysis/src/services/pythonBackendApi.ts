/**
 * Python Backend API Service
 * Handles communication with the FastAPI backend for image export and analysis
 */

const PYTHON_API_URL = process.env.NEXT_PUBLIC_PYTHON_API_URL || 'http://localhost:8000';

export interface SkeletonConfig {
  skeletonColor: string;
  jointColor: string;
  labelColor: string;
  showCallouts: boolean;
}

export interface AnalysisKeypoint {
  name: string;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export interface AnalysisResponse {
  success: boolean;
  keypoints: AnalysisKeypoint[];
  confidence: number;
  is_shooting_pose: boolean;
  message?: string;
}

export interface ExportResponse {
  success: boolean;
  image_base64?: string;
  content_type: string;
  message?: string;
}

export interface HealthResponse {
  status: string;
  version: string;
  mediapipe_available: boolean;
}

/**
 * Check if the Python backend is healthy
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  const response = await fetch(`${PYTHON_API_URL}/health`);
  if (!response.ok) {
    throw new Error('Backend health check failed');
  }
  return response.json();
}

/**
 * Analyze an image using the Python backend
 */
export async function analyzeImage(file: File): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${PYTHON_API_URL}/analyze`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Analysis failed');
  }

  return response.json();
}

/**
 * Export an annotated image from the Python backend
 */
export async function exportAnnotatedImage(
  file: File,
  config: Partial<SkeletonConfig> = {},
  outputFormat: 'png' | 'jpeg' = 'png',
  quality: number = 95
): Promise<ExportResponse> {
  const formData = new FormData();
  formData.append('file', file);

  // Build query params
  const params = new URLSearchParams({
    skeleton_color: config.skeletonColor || '#FFFFFF',
    joint_color: config.jointColor || '#FFFFFF',
    label_color: config.labelColor || '#FFFFFF',
    show_callouts: String(config.showCallouts ?? true),
    output_format: outputFormat,
    quality: String(quality),
  });

  const response = await fetch(`${PYTHON_API_URL}/export?${params}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Export failed');
  }

  return response.json();
}

/**
 * Convert base64 image to Blob for download
 */
export function base64ToBlob(base64: string, contentType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: contentType });
}

/**
 * Download an exported image
 */
export function downloadExportedImage(
  base64: string,
  contentType: string,
  filename: string = 'basketball-analysis.png'
): void {
  const blob = base64ToBlob(base64, contentType);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

