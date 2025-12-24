/**
 * @file videoAnalysis.ts
 * @description Video analysis service for basketball shooting form analysis from video
 * 
 * PURPOSE:
 * - Processes video uploads for shooting analysis
 * - Extracts key frames (Setup, Release, Follow-through)
 * - Sends video to Python backend for frame-by-frame analysis
 * - Converts video analysis results to session format
 * 
 * MAIN FUNCTIONS:
 * - analyzeVideoShooting(videoFile) - Main video analysis function
 * - convertVideoToSessionFormat(result) - Convert to session storage format
 * 
 * BACKEND ENDPOINTS CALLED:
 * - POST {VIDEO_API_URL}/api/analyze-video - Video analysis
 * 
 * USED BY:
 * - src/app/page.tsx (handleVideoAnalysis)
 * 
 * RETURNS:
 * - VideoAnalysisResult with frames, keypoints, phases, and metrics
 * 
 * ENVIRONMENT:
 * - NEXT_PUBLIC_VIDEO_API_URL - Video backend URL (default: http://localhost:5002)
 */

// Video analysis runs on a separate server (port 5002)
const VIDEO_API_URL = process.env.NEXT_PUBLIC_VIDEO_API_URL || 'http://localhost:5002'

export interface KeyScreenshot {
  label: string  // SETUP, RELEASE, FOLLOW_THROUGH
  frame_index: number
  phase: string
  metrics: Record<string, number>
  keypoints: Record<string, { x: number; y: number; confidence: number }>
  image_base64: string
}

export interface VideoAnalysisResult {
  success: boolean
  error?: string
  
  // Video metadata
  video_info?: {
    original_fps: number
    target_fps: number
    duration: number
    extracted_frames: number
    width: number
    height: number
  }
  
  // Frame data
  frame_count?: number
  annotated_frames_base64?: string[]
  
  // Shot phases
  phases?: Array<{
    phase: string
    frame: number
    timestamp: number
  }>
  
  // Metrics summary
  metrics?: {
    elbow_angle_range: {
      min: number | null
      max: number | null
      at_release: number | null
    }
    knee_angle_range: {
      min: number | null
      max: number | null
    }
    release_frame: number
    release_timestamp: number
  }
  
  // Frame-by-frame data
  frame_data?: Array<{
    frame: number
    timestamp: number
    phase: string
    metrics: Record<string, number>
    keypoint_count: number
    ball_detected: boolean
    keypoints?: Record<string, { x: number; y: number; confidence: number }>
  }>
  
  // All keypoints for all frames (for overlay rendering)
  all_keypoints?: Array<Record<string, { x: number; y: number; confidence: number }>>
  
  // The 3 key screenshots for session creation
  key_screenshots?: KeyScreenshot[]
  
  // Shot detection info
  shot_range?: {
    start: number
    end: number
    phases: string[]
  } | null
}

/**
 * Convert video File to base64 string
 */
async function videoToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Analyze a video of a basketball shot
 * Returns frame-by-frame analysis + 3 key screenshots for session
 */
export async function analyzeVideoShooting(
  videoFile: File,
  profileData?: {
    heightInches?: number | null
    weightLbs?: number | null
    age?: number | null
    experienceLevel?: string | null
    dominantHand?: string | null
    shootingStyle?: string | null
  }
): Promise<VideoAnalysisResult> {
  try {
    // Validate file size (max 50MB)
    if (videoFile.size > 50 * 1024 * 1024) {
      return {
        success: false,
        error: 'Video must be under 50MB'
      }
    }

    // Convert to base64
    console.log('📹 Converting video to base64...')
    const videoBase64 = await videoToBase64(videoFile)

    // Call the hybrid backend
    console.log('🎯 Sending video to hybrid backend for analysis...')
    const response = await fetch(`${VIDEO_API_URL}/api/analyze-video`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        video: videoBase64,
        fps: 10,  // Process at 10 FPS
        profile: profileData || null  // Include profile data for personalized analysis
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Video analysis failed: ${errorText}`)
    }

    const result: VideoAnalysisResult = await response.json()

    if (!result.success) {
      return {
        success: false,
        error: result.error || 'Video analysis failed'
      }
    }

    console.log('✅ Video analysis complete:', {
      frames: result.frame_count,
      duration: result.video_info?.duration,
      key_screenshots: result.key_screenshots?.length || 0,
      phases: result.phases?.length || 0
    })

    return result

  } catch (error) {
    console.error('Video analysis error:', error)

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Cannot connect to video analysis server (port 5002). Run: python3 python-scraper/video_analysis.py'
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Video analysis failed'
    }
  }
}

/**
 * Convert video analysis result to format compatible with session storage
 * This allows video sessions to use the same results page as image sessions
 */
export function convertVideoToSessionFormat(
  videoResult: VideoAnalysisResult
): {
  overallScore: number
  angles: Record<string, number>
  keypoints: Record<string, { x: number; y: number; confidence: number }> | null
  screenshots: Array<{ label: string; imageBase64: string; analysis?: string }>
  mainImageBase64: string
  skeletonImageBase64: string
  feedback: string[]
  strengths: string[]
  improvements: string[]
} {
  // Calculate overall score from metrics
  let overallScore = 75  // Default
  
  if (videoResult.metrics) {
    const releaseElbow = videoResult.metrics.elbow_angle_range.at_release
    const minKnee = videoResult.metrics.knee_angle_range.min
    
    // Score based on elbow angle at release (optimal: 150-170°)
    if (releaseElbow) {
      if (releaseElbow >= 150 && releaseElbow <= 170) {
        overallScore += 10
      } else if (releaseElbow >= 140 && releaseElbow <= 180) {
        overallScore += 5
      }
    }
    
    // Score based on knee bend (optimal: < 150°)
    if (minKnee && minKnee < 150) {
      overallScore += 10
    }
  }
  
  // Clamp score
  overallScore = Math.min(100, Math.max(0, overallScore))
  
  // Build angles from release frame metrics
  const angles: Record<string, number> = {}
  if (videoResult.metrics) {
    if (videoResult.metrics.elbow_angle_range.at_release) {
      angles['elbow_angle'] = videoResult.metrics.elbow_angle_range.at_release
    }
    if (videoResult.metrics.knee_angle_range.min) {
      angles['knee_angle'] = videoResult.metrics.knee_angle_range.min
    }
  }
  
  // Get keypoints from the release frame
  const releaseScreenshot = videoResult.key_screenshots?.find(s => s.label === 'RELEASE')
  const keypoints = releaseScreenshot?.keypoints || null
  
  // Convert key screenshots to session format
  const screenshots = (videoResult.key_screenshots || []).map(ks => ({
    label: ks.label,
    imageBase64: `data:image/jpeg;base64,${ks.image_base64}`,
    analysis: `${ks.phase} - Elbow: ${ks.metrics.elbow_angle || '-'}°, Knee: ${ks.metrics.knee_angle || '-'}°`
  }))
  
  // Use release frame as main image, or first frame
  const mainScreenshot = releaseScreenshot || videoResult.key_screenshots?.[0]
  const mainImageBase64 = mainScreenshot 
    ? `data:image/jpeg;base64,${mainScreenshot.image_base64}`
    : ''
  
  // Generate feedback
  const feedback: string[] = []
  const strengths: string[] = []
  const improvements: string[] = []
  
  if (videoResult.metrics) {
    const elbow = videoResult.metrics.elbow_angle_range.at_release
    const knee = videoResult.metrics.knee_angle_range.min
    
    if (elbow) {
      if (elbow >= 150 && elbow <= 170) {
        strengths.push(`Excellent elbow extension at release (${elbow}°)`)
      } else if (elbow < 140) {
        improvements.push(`Extend elbow more at release (currently ${elbow}°, aim for 150-170°)`)
      } else if (elbow > 180) {
        improvements.push(`Slight over-extension at release (${elbow}°)`)
      }
    }
    
    if (knee) {
      if (knee < 150) {
        strengths.push(`Good knee bend for power (${knee}°)`)
      } else {
        improvements.push(`Bend knees more for power (currently ${knee}°, aim for < 150°)`)
      }
    }
  }
  
  // Phase-based feedback
  if (videoResult.phases && videoResult.phases.length >= 3) {
    strengths.push('Complete shooting motion detected (Setup → Release → Follow-through)')
  } else {
    feedback.push('Partial shooting motion - try to capture the full shot sequence')
  }
  
  return {
    overallScore,
    angles,
    keypoints,
    screenshots,
    mainImageBase64,
    skeletonImageBase64: mainImageBase64,  // Same as main for video
    feedback,
    strengths,
    improvements
  }
}

/**
 * Check if the hybrid server supports video analysis
 */
export async function checkVideoAnalysisSupport(): Promise<boolean> {
  try {
    const response = await fetch(`${VIDEO_API_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000)
    })
    const data = await response.json()
    // Check if video-analysis is in components
    return data.status === 'ok' && 
           Array.isArray(data.components) && 
           data.components.includes('video-analysis')
  } catch {
    return false
  }
}






