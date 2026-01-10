/**
 * FullscreenLiveCamera Component
 * 
 * Full-screen camera view with smart overlay system for live shooting analysis.
 * - Portrait: metrics bar at bottom
 * - Landscape: metrics strip on right side
 * - Controls auto-hide during recording (tap to show)
 * - Shot Science-style clean, minimal overlay
 */

"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Circle, 
  Square, 
  Camera, 
  RotateCcw, 
  FlipHorizontal,
  Pause,
  Play,
  X,
  ChevronUp,
  ChevronDown,
  Target,
  User,
  Eye,
  AlertCircle,
  Settings,
} from 'lucide-react'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { ProfessionalSkeletonOverlay } from './ProfessionalSkeletonOverlay'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useRouter } from 'next/navigation'
import { isMobile } from '@/utils/platform'
import { useUsage } from '@/lib/usage'
import { usePoints } from '@/lib/points/pointsContext'
import { saveSession, createSessionFromAnalysis } from '@/services/sessionStorage'

// ============================================
// TYPES
// ============================================

interface CapturedFrame {
  id: string
  dataUrl: string
  timestamp: number
  angles: any
  feedback: any
}

type Orientation = 'portrait' | 'landscape'

// Available metrics that users can select
// All metrics are fully functional with MoveNet pose detection
export type MetricId = 'form' | 'elbow' | 'knee' | 'shoulder' | 'hip' | 'release' | 'arm'

export interface MetricConfig {
  id: MetricId
  label: string
  shortLabel: string
  unit: string
  description: string
  getStatus: (feedback: any) => 'good' | 'warning' | 'critical' | 'unknown'
}

// Industry-standard metrics configuration
// Based on Shot Science and professional basketball analysis
// ALL metrics are fully functional and provide real-time feedback
export const AVAILABLE_METRICS: MetricConfig[] = [
  {
    id: 'form',
    label: 'FORM SCORE',
    shortLabel: 'FORM',
    unit: '',
    description: 'Overall shooting form quality (0-100)',
    getStatus: (feedback) => {
      const score = feedback?.overallScore ?? 0
      if (score >= 80) return 'good'
      if (score >= 60) return 'warning'
      return 'critical'
    }
  },
  {
    id: 'elbow',
    label: 'ELBOW ANGLE',
    shortLabel: 'ELBOW',
    unit: '°',
    description: 'Angle at elbow joint (ideal: 85-95° at set)',
    getStatus: (feedback) => feedback?.elbowStatus ?? 'unknown'
  },
  {
    id: 'knee',
    label: 'LEG ANGLE',
    shortLabel: 'LEG',
    unit: '°',
    description: 'Knee bend angle (ideal: 130-150°)',
    getStatus: (feedback) => feedback?.kneeStatus ?? 'unknown'
  },
  {
    id: 'shoulder',
    label: 'SHOULDER',
    shortLabel: 'SHOULDER',
    unit: '°',
    description: 'Shoulder alignment angle (ideal: 45-90°)',
    getStatus: (feedback) => feedback?.shoulderStatus ?? 'unknown'
  },
  {
    id: 'hip',
    label: 'HIP ALIGN',
    shortLabel: 'HIP',
    unit: '°',
    description: 'Hip alignment for posture (ideal: 160-180°)',
    getStatus: (feedback) => feedback?.hipStatus ?? 'unknown'
  },
  {
    id: 'release',
    label: 'RELEASE ANGLE',
    shortLabel: 'RELEASE',
    unit: '°',
    description: 'Release angle from vertical (ideal: -10° to 15°)',
    getStatus: (feedback) => feedback?.releaseStatus ?? 'unknown'
  },
  {
    id: 'arm',
    label: 'ARM ANGLE',
    shortLabel: 'ARM',
    unit: '°',
    description: 'Forearm angle for shot arc (ideal: 60-90°)',
    getStatus: (feedback) => feedback?.wristStatus ?? 'unknown'
  }
]

// Default metrics to show (all by default)
const DEFAULT_SELECTED_METRICS: MetricId[] = ['form', 'elbow', 'knee', 'shoulder', 'hip', 'release', 'arm']

// Quick Preset Modes for easy setup
type PresetMode = 'form' | 'power' | 'full' | 'custom'

interface PresetConfig {
  id: PresetMode
  name: string
  icon: string
  description: string
  metrics: MetricId[]
}

const PRESET_MODES: PresetConfig[] = [
  {
    id: 'form',
    name: 'Form Focus',
    icon: '🎯',
    description: 'Form, Elbow, Release',
    metrics: ['form', 'elbow', 'release']
  },
  {
    id: 'power',
    name: 'Power Focus',
    icon: '💪',
    description: 'Knee, Hip, Shoulder',
    metrics: ['knee', 'hip', 'shoulder']
  },
  {
    id: 'full',
    name: 'Full Analysis',
    icon: '📊',
    description: 'All 6 metrics',
    metrics: ['form', 'elbow', 'knee', 'shoulder', 'hip', 'release']
  }
]

// ============================================
// HELPERS
// ============================================

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const getScoreColor = (score: number): string => {
  if (score >= 80) return '#22c55e' // green
  if (score >= 60) return '#eab308' // yellow
  return '#ef4444' // red
}

// Body part colors for skeleton (same as ProfessionalSkeletonOverlay)
const BODY_PART_COLORS: Record<number, string> = {
  0: '#ffffff', 1: '#ffffff', 2: '#ffffff', 3: '#ffffff', 4: '#ffffff', // Face
  5: '#00d4ff', 6: '#00d4ff', // Shoulders
  7: '#00ffcc', 8: '#00ffcc', // Elbows
  9: '#00ff99', 10: '#00ff99', // Wrists
  11: '#ff9900', 12: '#ff9900', // Hips
  13: '#ffcc00', 14: '#ffcc00', // Knees
  15: '#ffff00', 16: '#ffff00', // Ankles
}

// Skeleton connections
const SKELETON_CONNECTIONS: [number, number][] = [
  [5, 6], [5, 7], [7, 9], [6, 8], [8, 10], // Arms
  [5, 11], [6, 12], [11, 12], // Torso
  [11, 13], [13, 15], [12, 14], [14, 16], // Legs
]

const STATUS_COLORS = {
  good: '#22c55e',
  warning: '#eab308',
  critical: '#ef4444',
  unknown: '#3b82f6',
}

// ============================================
// COMPONENT
// ============================================

export function FullscreenLiveCamera({ onClose }: { onClose?: () => void }) {
  const router = useRouter()
  const { setUploadedImageBase64, setVideoAnalysisData, addToHistory } = useAnalysisStore()
  const { canAnalyze, remainingToday, dailyLimit, incrementUsage } = useUsage()
  const { earnPoints } = usePoints()

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const compositeCanvasRef = useRef<HTMLCanvasElement | null>(null) // For recording with overlay
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recordingBlobRef = useRef<Blob | null>(null)
  const compositeAnimationRef = useRef<number | null>(null) // For composite canvas animation loop

  // State
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')
  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([])
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 })
  const [orientation, setOrientation] = useState<Orientation>('portrait')
  const [showControls, setShowControls] = useState(true)
  const [showShotFlash, setShowShotFlash] = useState(false)
  const [lastShotScore, setLastShotScore] = useState<number | null>(null)

  // State for saved video
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveChoice, setShowSaveChoice] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  
  // Metric selection state
  const [selectedMetrics, setSelectedMetrics] = useState<MetricId[]>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotiq_live_metrics')
      if (saved) {
        try {
          return JSON.parse(saved)
        } catch {
          return DEFAULT_SELECTED_METRICS
        }
      }
    }
    return DEFAULT_SELECTED_METRICS
  })
  const [showMetricSettings, setShowMetricSettings] = useState(false)
  
  // Skeleton overlay visibility
  const [showSkeleton, setShowSkeleton] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotiq_show_skeleton')
      return saved !== 'false' // Default to true
    }
    return true
  })
  
  // Audio feedback toggle
  const [audioFeedbackEnabled, setAudioFeedbackEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotiq_audio_feedback')
      return saved === 'true' // Default to false
    }
    return false
  })
  
  // Current preset mode
  const [currentPreset, setCurrentPreset] = useState<PresetMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shotiq_preset_mode')
      if (saved && ['form', 'power', 'full', 'custom'].includes(saved)) {
        return saved as PresetMode
      }
    }
    return 'full'
  })
  
  // Countdown state
  const [showCountdown, setShowCountdown] = useState(false)
  const [countdownValue, setCountdownValue] = useState(3)
  
  // Shot counter
  const [shotCount, setShotCount] = useState(0)
  
  // Throttled pose state to reduce glitching
  const [throttledPose, setThrottledPose] = useState<any>(null)
  const lastPoseUpdateRef = useRef<number>(0)
  const POSE_UPDATE_INTERVAL = 200 // Update skeleton every 200ms (5fps) for much smoother visuals

  // Stabilized metrics - hold values for longer so users can read them
  const [stableAngles, setStableAngles] = useState<any>(null)
  const [stableFeedback, setStableFeedback] = useState<any>(null)
  const lastMetricUpdateRef = useRef<number>(0)
  const METRIC_UPDATE_INTERVAL = 2500 // Only update metrics every 2.5 seconds so users can read them
  
  // Pose detection hook - reduced FPS to prevent glitching
  const {
    isLoading,
    isDetecting,
    error: poseError,
    pose,
    angles,
    feedback,
    fps,
    isShootingDetected,
    startDetection,
    stopDetection,
  } = usePoseDetection({
    modelType: 'lightning',
    targetFps: 10, // Reduced to 10fps for smoother skeleton rendering
    onShootingDetected: (detectedPose) => {
      console.log('[FullscreenLive] Shooting motion detected!')
      // Show shot flash and increment counter
      if (feedback?.overallScore) {
        setLastShotScore(feedback.overallScore)
        setShowShotFlash(true)
        setShotCount(prev => prev + 1)
        
        // Play audio feedback if enabled
        if (audioFeedbackEnabled) {
          try {
            // Create a simple beep sound
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            // Higher pitch for good shots, lower for poor shots
            oscillator.frequency.value = feedback.overallScore >= 70 ? 880 : 440
            oscillator.type = 'sine'
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.3)
          } catch (e) {
            console.log('[FullscreenLive] Audio feedback not available')
          }
        }
        
        setTimeout(() => setShowShotFlash(false), 1500)
      }
    },
  })

  // Throttle and smooth pose updates to reduce visual glitching
  useEffect(() => {
    if (pose) {
      const now = Date.now()
      if (now - lastPoseUpdateRef.current >= POSE_UPDATE_INTERVAL) {
        // Apply heavy smoothing by interpolating between old and new pose
        if (throttledPose && throttledPose.keypoints) {
          const smoothingFactor = 0.6 // Higher = smoother but slower to respond
          const smoothedKeypoints = pose.keypoints.map((kp: any, i: number) => {
            const oldKp = throttledPose.keypoints[i]
            if (oldKp && kp.score > 0.2) {
              return {
                ...kp,
                x: oldKp.x + (kp.x - oldKp.x) * (1 - smoothingFactor),
                y: oldKp.y + (kp.y - oldKp.y) * (1 - smoothingFactor),
              }
            }
            return kp
          })
          setThrottledPose({ ...pose, keypoints: smoothedKeypoints })
        } else {
          setThrottledPose(pose)
        }
        lastPoseUpdateRef.current = now
      }
    }
  }, [pose, throttledPose])
  
  // Stabilize metrics - only update every 2.5 seconds so users can actually read them
  useEffect(() => {
    if (angles || feedback) {
      const now = Date.now()
      // Only update if enough time has passed OR if we don't have any values yet
      if (!stableAngles || !stableFeedback || now - lastMetricUpdateRef.current >= METRIC_UPDATE_INTERVAL) {
        if (angles) setStableAngles(angles)
        if (feedback) setStableFeedback(feedback)
        lastMetricUpdateRef.current = now
      }
    }
  }, [angles, feedback, stableAngles, stableFeedback])

  // Detect orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth
      setOrientation(isPortrait ? 'portrait' : 'landscape')
    }

    checkOrientation()
    window.addEventListener('resize', checkOrientation)
    window.addEventListener('orientationchange', checkOrientation)

    return () => {
      window.removeEventListener('resize', checkOrientation)
      window.removeEventListener('orientationchange', checkOrientation)
    }
  }, [])

  // Auto-hide controls during recording
  useEffect(() => {
    if (isRecording && showControls) {
      // Clear existing timeout
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
      // Hide controls after 3 seconds
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false)
      }, 3000)
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current)
      }
    }
  }, [isRecording, showControls])

  // Cleanup function
  const cleanupCamera = useCallback(() => {
    console.log('[FullscreenLive] Cleaning up camera...')
    
    // Stop pose detection first
    stopDetection()
    
    // Stop media recorder if active
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop()
      } catch (e) {
        console.log('[FullscreenLive] MediaRecorder already stopped')
      }
      mediaRecorderRef.current = null
    }
    
    // Stop all tracks in the stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('[FullscreenLive] Stopping track:', track.kind, track.label)
        track.stop()
      })
      streamRef.current = null
    }
    
    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    
    setCameraReady(false)
  }, [stopDetection])

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null)
      setCameraReady(false)

      // Clean up any existing stream first
      cleanupCamera()
      
      // Small delay to ensure cleanup is complete
      await new Promise(resolve => setTimeout(resolve, 100))

      // Request camera access - prefer higher resolution for fullscreen
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }

      console.log('[FullscreenLive] Requesting camera with constraints:', constraints)
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      console.log('[FullscreenLive] Got stream:', stream.id)
      
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        
        // Use both event listener and promise for reliability
        const playPromise = new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not found'))
            return
          }
          
          const video = videoRef.current
          
          const handleLoadedMetadata = () => {
            console.log('[FullscreenLive] Video metadata loaded:', video.videoWidth, 'x', video.videoHeight)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
            
            // Get actual track settings for more accurate dimensions
            const videoTrack = stream.getVideoTracks()[0]
            const settings = videoTrack?.getSettings()
            console.log('[FullscreenLive] Track settings:', settings)
            
            video.play()
              .then(() => {
                console.log('[FullscreenLive] Video playing')
                
                // Use track settings if available, otherwise fall back to video element dimensions
                const actualWidth = settings?.width || video.videoWidth
                const actualHeight = settings?.height || video.videoHeight
                
                console.log('[FullscreenLive] Using dimensions:', actualWidth, 'x', actualHeight)
                console.log('[FullscreenLive] Display orientation:', window.innerWidth > window.innerHeight ? 'landscape' : 'portrait')
                console.log('[FullscreenLive] Video orientation:', actualWidth > actualHeight ? 'landscape' : 'portrait')
                
                setVideoDimensions({
                  width: actualWidth,
                  height: actualHeight,
                })
                setCameraReady(true)
                resolve()
              })
              .catch(reject)
          }
          
          video.addEventListener('loadedmetadata', handleLoadedMetadata)
          
          // If metadata is already loaded
          if (video.readyState >= 1) {
            handleLoadedMetadata()
          }
        })
        
        await playPromise
      }
    } catch (err: any) {
      console.error('[FullscreenLive] Camera error:', err)
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access.')
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found.')
      } else if (err.name === 'AbortError') {
        setCameraError('Camera initialization was interrupted. Please try again.')
      } else {
        setCameraError(`Camera error: ${err.message}`)
      }
    }
  }, [facingMode, cleanupCamera])

  // Start detection when camera is ready
  useEffect(() => {
    if (cameraReady && videoRef.current && !isLoading && !isDetecting) {
      startDetection(videoRef.current)
    }
  }, [cameraReady, isLoading, isDetecting, startDetection])

  // Initialize camera on mount
  useEffect(() => {
    let isMounted = true
    
    const init = async () => {
      if (isMounted) {
        await initCamera()
      }
    }
    
    init()

    return () => {
      isMounted = false
      console.log('[FullscreenLive] Component unmounting, cleaning up...')
      cleanupCamera()
    }
  }, []) // Only run on mount/unmount - initCamera and cleanupCamera are stable

  // Maximum recording duration (2 minutes)
  const MAX_RECORDING_DURATION = 120 // seconds
  const shouldStopRef = useRef(false)

  // Recording timer with auto-stop at 2 minutes
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => {
          const newDuration = prev + 1
          // Flag for auto-stop at 2 minutes
          if (newDuration >= MAX_RECORDING_DURATION) {
            console.log('[FullscreenLive] Max recording duration reached, flagging stop...')
            shouldStopRef.current = true
          }
          return newDuration
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused])

  // Handle auto-stop when max duration reached
  useEffect(() => {
    if (shouldStopRef.current && isRecording) {
      shouldStopRef.current = false
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop()
      }
      setIsRecording(false)
      setShowControls(true)
    }
  }, [recordingDuration, isRecording])

  // Flip camera
  const handleFlipCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(newMode)
    
    // Re-initialize camera with new facing mode
    cleanupCamera()
    await new Promise(resolve => setTimeout(resolve, 200))
    
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: newMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      }
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        
        // Get actual track settings for more accurate dimensions
        const videoTrack = stream.getVideoTracks()[0]
        const settings = videoTrack?.getSettings()
        const actualWidth = settings?.width || videoRef.current.videoWidth
        const actualHeight = settings?.height || videoRef.current.videoHeight
        
        console.log('[FullscreenLive] Flip camera - dimensions:', actualWidth, 'x', actualHeight)
        
        setVideoDimensions({
          width: actualWidth,
          height: actualHeight,
        })
        setCameraReady(true)
        
        // Restart pose detection
        startDetection(videoRef.current)
      }
    } catch (err) {
      console.error('[FullscreenLive] Flip camera error:', err)
    }
  }, [facingMode, cleanupCamera, startDetection])

  // Handle screen tap during recording
  const handleScreenTap = useCallback(() => {
    if (isRecording) {
      setShowControls(true)
    }
  }, [isRecording])

  // Start recording
  // Refs for composite recording state (to avoid stale closures)
  const currentPoseRef = useRef<any>(null)
  const currentFeedbackRef = useRef<any>(null)
  const currentTipRef = useRef<string | null>(null)
  const showSkeletonRef = useRef<boolean>(true)
  const selectedMetricsRef = useRef<MetricId[]>(DEFAULT_SELECTED_METRICS)
  const stableAnglesRef = useRef<any>(null)
  
  // Keep refs updated
  useEffect(() => {
    currentPoseRef.current = throttledPose
    currentFeedbackRef.current = stableFeedback
    currentTipRef.current = stableFeedback?.tips?.[0] || null
    showSkeletonRef.current = showSkeleton
    selectedMetricsRef.current = selectedMetrics
    stableAnglesRef.current = stableAngles
  }, [throttledPose, stableFeedback, showSkeleton, selectedMetrics, stableAngles])
  
  // Actual recording start (after countdown)
  const startActualRecording = useCallback(() => {
    if (!streamRef.current || !videoRef.current) return

    recordedChunksRef.current = []
    setRecordingDuration(0)
    setShotCount(0) // Reset shot counter
    setShowControls(false) // Hide controls when recording starts

    // Create composite canvas for recording with overlay
    const compositeCanvas = document.createElement('canvas')
    compositeCanvas.width = videoDimensions.width
    compositeCanvas.height = videoDimensions.height
    compositeCanvasRef.current = compositeCanvas
    const compositeCtx = compositeCanvas.getContext('2d')

    // Animation loop to draw video + overlay to composite canvas
    const drawCompositeFrame = () => {
      if (!compositeCtx || !videoRef.current) return
      
      const video = videoRef.current
      const poseData = currentPoseRef.current
      const feedbackData = currentFeedbackRef.current
      const tip = currentTipRef.current
      const skeletonEnabled = showSkeletonRef.current
      const metrics = selectedMetricsRef.current
      const anglesData = stableAnglesRef.current
      
      // Draw video frame
      compositeCtx.drawImage(video, 0, 0, compositeCanvas.width, compositeCanvas.height)
      
      // Draw skeleton overlay if enabled and pose exists
      if (skeletonEnabled && poseData && poseData.keypoints) {
        const keypoints = poseData.keypoints
        
        // Draw skeleton connections with glow
        compositeCtx.lineCap = 'round'
        compositeCtx.lineJoin = 'round'
        
        for (const [i, j] of SKELETON_CONNECTIONS) {
          const kp1 = keypoints[i]
          const kp2 = keypoints[j]
          
          if (kp1 && kp2 && (kp1.score === undefined || kp1.score >= 0.2) && (kp2.score === undefined || kp2.score >= 0.2)) {
            const color = BODY_PART_COLORS[i] || '#00d4ff'
            
            // Outer glow
            compositeCtx.strokeStyle = color
            compositeCtx.lineWidth = 12
            compositeCtx.globalAlpha = 0.2
            compositeCtx.beginPath()
            compositeCtx.moveTo(kp1.x, kp1.y)
            compositeCtx.lineTo(kp2.x, kp2.y)
            compositeCtx.stroke()
            
            // Core line
            compositeCtx.lineWidth = 4
            compositeCtx.globalAlpha = 1.0
            compositeCtx.beginPath()
            compositeCtx.moveTo(kp1.x, kp1.y)
            compositeCtx.lineTo(kp2.x, kp2.y)
            compositeCtx.stroke()
          }
        }
        
        // Draw keypoints
        for (let idx = 0; idx < keypoints.length; idx++) {
          const kp = keypoints[idx]
          if (kp.score !== undefined && kp.score < 0.2) continue
          
          const color = BODY_PART_COLORS[idx] || '#00d4ff'
          
          // Glow
          compositeCtx.beginPath()
          compositeCtx.arc(kp.x, kp.y, 12, 0, Math.PI * 2)
          compositeCtx.fillStyle = color
          compositeCtx.globalAlpha = 0.3
          compositeCtx.fill()
          
          // Main circle
          compositeCtx.beginPath()
          compositeCtx.arc(kp.x, kp.y, 8, 0, Math.PI * 2)
          compositeCtx.globalAlpha = 1.0
          compositeCtx.fill()
          
          // Center highlight
          compositeCtx.beginPath()
          compositeCtx.arc(kp.x, kp.y, 4, 0, Math.PI * 2)
          compositeCtx.fillStyle = 'rgba(255,255,255,0.7)'
          compositeCtx.fill()
        }
        
        compositeCtx.globalAlpha = 1.0
      }
      
      // Draw metrics overlay at bottom
      const barHeight = 80
      const y = compositeCanvas.height - barHeight
      
      compositeCtx.fillStyle = 'rgba(0, 0, 0, 0.5)'
      compositeCtx.fillRect(0, y, compositeCanvas.width, barHeight)
      
      const metricsToShow = metrics.slice(0, 6)
      const metricWidth = compositeCanvas.width / metricsToShow.length
      
      compositeCtx.textAlign = 'center'
      compositeCtx.textBaseline = 'middle'
      
      metricsToShow.forEach((metricId, index) => {
        const metric = AVAILABLE_METRICS.find(m => m.id === metricId)
        if (!metric) return
        
        const value = (() => {
          switch (metricId) {
            case 'form': return feedbackData?.overallScore ?? null
            case 'elbow': return anglesData?.elbowAngle ?? null
            case 'knee': return anglesData?.kneeAngle ?? null
            case 'shoulder': return anglesData?.shoulderAngle ?? null
            case 'hip': return anglesData?.hipAngle ?? null
            case 'release': return anglesData?.releaseAngle ?? null
            case 'arm': return anglesData?.wristAngle ?? null
            default: return null
          }
        })()
        
        const status = metric.getStatus(feedbackData)
        const color = status === 'good' ? '#22c55e' : status === 'warning' ? '#eab308' : status === 'critical' ? '#ef4444' : '#ffffff'
        
        const x = metricWidth * index + metricWidth / 2
        
        // Value
        compositeCtx.fillStyle = color
        compositeCtx.font = 'bold 28px system-ui, sans-serif'
        compositeCtx.fillText(value !== null ? `${Math.round(value)}${metric.unit}` : '--', x, y + 30)
        
        // Label
        compositeCtx.fillStyle = 'rgba(255, 255, 255, 0.6)'
        compositeCtx.font = '10px system-ui, sans-serif'
        compositeCtx.fillText(metric.shortLabel, x, y + 55)
      })
      
      // Draw AI coaching tip at top
      if (tip) {
        compositeCtx.fillStyle = 'rgba(255, 107, 53, 0.3)'
        compositeCtx.fillRect(0, 0, compositeCanvas.width, 50)
        
        compositeCtx.fillStyle = '#FF6B35'
        compositeCtx.font = '20px system-ui, sans-serif'
        compositeCtx.textAlign = 'left'
        compositeCtx.fillText('🤖', 15, 30)
        
        compositeCtx.fillStyle = '#ffffff'
        compositeCtx.font = '14px system-ui, sans-serif'
        const truncatedTip = tip.length > 60 ? tip.slice(0, 60) + '...' : tip
        compositeCtx.fillText(truncatedTip, 45, 30)
      }
      
      compositeAnimationRef.current = requestAnimationFrame(drawCompositeFrame)
    }
    
    // Start composite drawing
    drawCompositeFrame()
    
    // Create stream from composite canvas
    const compositeStream = compositeCanvas.captureStream(30) // 30fps
    
    // Add audio from original stream if available
    const audioTracks = streamRef.current.getAudioTracks()
    audioTracks.forEach(track => compositeStream.addTrack(track))

    const mediaRecorder = new MediaRecorder(compositeStream, {
      mimeType: 'video/webm;codecs=vp9',
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
      // Stop composite animation
      if (compositeAnimationRef.current) {
        cancelAnimationFrame(compositeAnimationRef.current)
        compositeAnimationRef.current = null
      }
      
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      
      // Store blob for later saving
      recordingBlobRef.current = blob
      
      // Store URL for display
      setSavedVideoUrl(url)
      
      // Store in analysis store for viewing
      setVideoAnalysisData({
        videoUrl: url,
        frames: capturedFrames.map(f => ({
          url: f.dataUrl,
          timestamp: f.timestamp,
          angles: f.angles,
        })),
      })

      // Show save choice dialog
      setShowSaveChoice(true)
    }

    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start(1000)
    setIsRecording(true)
  }, [capturedFrames, setVideoAnalysisData, videoDimensions])

  // Start recording with countdown
  const handleStartRecording = useCallback(() => {
    if (!streamRef.current || !videoRef.current) return
    
    // Start countdown
    setShowCountdown(true)
    setCountdownValue(3)
    
    // Play countdown sound if audio enabled
    const playCountdownBeep = (isLast: boolean) => {
      if (audioFeedbackEnabled) {
        try {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = isLast ? 880 : 440
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.2)
        } catch (e) {
          // Audio not available
        }
      }
    }
    
    playCountdownBeep(false)
    
    // Countdown sequence
    setTimeout(() => {
      setCountdownValue(2)
      playCountdownBeep(false)
    }, 1000)
    
    setTimeout(() => {
      setCountdownValue(1)
      playCountdownBeep(false)
    }, 2000)
    
    setTimeout(() => {
      setShowCountdown(false)
      playCountdownBeep(true)
      startActualRecording()
    }, 3000)
  }, [audioFeedbackEnabled, startActualRecording])

  // Stop recording
  const handleStopRecording = useCallback(() => {
    // Stop composite animation first
    if (compositeAnimationRef.current) {
      cancelAnimationFrame(compositeAnimationRef.current)
      compositeAnimationRef.current = null
    }
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setShowControls(true)
  }, [])

  // Toggle metric selection
  const toggleMetric = useCallback((metricId: MetricId) => {
    setSelectedMetrics(prev => {
      const newMetrics = prev.includes(metricId)
        ? prev.filter(m => m !== metricId)
        : [...prev, metricId]
      
      // Ensure at least one metric is selected
      if (newMetrics.length === 0) return prev
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('shotiq_live_metrics', JSON.stringify(newMetrics))
      }
      
      // Set to custom preset when manually changing
      setCurrentPreset('custom')
      if (typeof window !== 'undefined') {
        localStorage.setItem('shotiq_preset_mode', 'custom')
      }
      
      return newMetrics
    })
  }, [])
  
  // Apply preset mode
  const applyPreset = useCallback((preset: PresetConfig) => {
    setSelectedMetrics(preset.metrics)
    setCurrentPreset(preset.id)
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('shotiq_live_metrics', JSON.stringify(preset.metrics))
      localStorage.setItem('shotiq_preset_mode', preset.id)
    }
  }, [])
  
  // Toggle audio feedback
  const toggleAudioFeedback = useCallback(() => {
    setAudioFeedbackEnabled(prev => {
      const newValue = !prev
      if (typeof window !== 'undefined') {
        localStorage.setItem('shotiq_audio_feedback', String(newValue))
      }
      return newValue
    })
  }, [])

  // Capture frame
  const handleCaptureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg', 0.9)

    const frame: CapturedFrame = {
      id: `frame-${Date.now()}`,
      dataUrl,
      timestamp: recordingDuration,
      angles,
      feedback,
    }

    setCapturedFrames(prev => [...prev, frame])
    setUploadedImageBase64(dataUrl)
  }, [angles, feedback, recordingDuration, setUploadedImageBase64])

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev)
    
    if (isPaused) {
      if (videoRef.current) {
        startDetection(videoRef.current)
      }
    } else {
      stopDetection()
    }
  }, [isPaused, startDetection, stopDetection])

  // Reset
  const handleReset = useCallback(() => {
    setCapturedFrames([])
    setRecordingDuration(0)
    setIsPaused(false)
    setSavedVideoUrl(null)
    setShowSaveChoice(false)
    recordingBlobRef.current = null
    
    if (!isDetecting && videoRef.current) {
      startDetection(videoRef.current)
    }
  }, [isDetecting, startDetection])

  // Both options count against tier limit - this is called first
  const handleUseAnalysis = useCallback((): boolean => {
    // Check if user can analyze
    if (!canAnalyze) {
      setShowLimitWarning(true)
      return false
    }
    
    // Increment usage count (counts for BOTH save and just view)
    const allowed = incrementUsage()
    if (!allowed) {
      setShowLimitWarning(true)
      return false
    }
    
    return true
  }, [canAnalyze, incrementUsage])

  // Save to profile (saves to Player tab + awards more points)
  const handleSaveToProfile = useCallback(async () => {
    // First, count against tier limit
    if (!handleUseAnalysis()) return
    
    // Award points for live session (more points for saving)
    earnPoints('live_session')
    
    // Capture a frame for the thumbnail if we don't have one
    let thumbnailBase64 = capturedFrames[0]?.dataUrl || ''
    if (!thumbnailBase64 && videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        canvas.width = videoRef.current.videoWidth
        canvas.height = videoRef.current.videoHeight
        ctx.drawImage(videoRef.current, 0, 0)
        thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.8)
      }
    }
    
    // Create and save session to Player tab storage
    const session = createSessionFromAnalysis(
      thumbnailBase64,
      undefined, // skeleton overlay
      capturedFrames.map((f, i) => ({
        id: f.id,
        label: `Frame ${i + 1}`,
        imageBase64: f.dataUrl,
      })),
      {
        overallScore: feedback?.overallScore ?? 0,
        shooterLevel: (feedback?.overallScore ?? 0) >= 80 ? 'Elite' : (feedback?.overallScore ?? 0) >= 60 ? 'Intermediate' : 'Beginner',
        angles: angles ? {
          elbowAngle: angles.elbowAngle ?? 0,
          shoulderAngle: angles.shoulderAngle ?? 0,
          kneeAngle: angles.kneeAngle ?? 0,
          hipAngle: angles.hipAngle ?? 0,
          wristAngle: angles.wristAngle ?? 0,
        } : {},
        detectedFlaws: feedback?.tips?.slice(0, 3) || [],
        measurements: {},
      },
      undefined, // playerName
      undefined, // coachingLevel
      undefined, // profileSnapshot
      1, // imagesAnalyzed
      'video', // mediaType - live counts as video
      savedVideoUrl ? {
        annotatedFramesBase64: capturedFrames.map(f => f.dataUrl),
        frameCount: capturedFrames.length,
        duration: recordingDuration,
        fps: 30,
        phases: [],
        metrics: {
          elbow_angle_range: { min: null, max: null, at_release: angles?.elbowAngle || null },
          knee_angle_range: { min: null, max: null },
          release_frame: 0,
          release_timestamp: 0,
        },
        frameData: capturedFrames.map((f, i) => ({
          frame: i,
          timestamp: f.timestamp,
          phase: 'release',
          metrics: f.angles || {},
        })),
      } : undefined
    )
    
    // Save to localStorage (Player tab will read from here)
    const saved = saveSession(session)
    console.log('[FullscreenLive] Session saved to Player tab:', saved)
    
    // Also save video file to device
    if (recordingBlobRef.current && savedVideoUrl) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const filename = `shotiq-recording-${timestamp}.webm`
      
      const downloadLink = document.createElement('a')
      downloadLink.href = savedVideoUrl
      downloadLink.download = filename
      
      if (navigator.share && /mobile|android|iphone/i.test(navigator.userAgent)) {
        try {
          const file = new File([recordingBlobRef.current], filename, { type: 'video/webm' })
          await navigator.share({
            files: [file],
            title: 'ShotIQ Recording',
            text: 'My basketball shooting analysis'
          })
        } catch (shareErr) {
          console.log('[FullscreenLive] Share failed, falling back to download:', shareErr)
          document.body.appendChild(downloadLink)
          downloadLink.click()
          document.body.removeChild(downloadLink)
        }
      } else {
        document.body.appendChild(downloadLink)
        downloadLink.click()
        document.body.removeChild(downloadLink)
      }
    }
    
    setShowSaveChoice(false)
    setShowSaveSuccess(true)
    setTimeout(() => {
      setShowSaveSuccess(false)
      router.push('/results/demo')
    }, 2000)
  }, [handleUseAnalysis, earnPoints, capturedFrames, feedback, angles, savedVideoUrl, recordingDuration, router])

  // Just view analysis (still counts against limit, but doesn't save to Player tab)
  const handleJustView = useCallback(() => {
    // Still counts against tier limit
    if (!handleUseAnalysis()) return
    
    // Award fewer points for just viewing
    earnPoints('view_results')
    
    setShowSaveChoice(false)
    router.push('/results/demo')
  }, [handleUseAnalysis, earnPoints, router])

  // Get key metrics for display - USE STABLE VALUES so they don't flicker
  const formScore = stableFeedback?.overallScore ?? 0
  const kneeAngle = stableAngles?.kneeAngle ?? null
  const shoulderAngle = stableAngles?.shoulderAngle ?? null
  const elbowAngle = stableAngles?.elbowAngle ?? null
  const hipAngle = stableAngles?.hipAngle ?? null
  const releaseAngle = stableAngles?.releaseAngle ?? null
  const armAngle = stableAngles?.wristAngle ?? null // Arm/forearm angle
  
  // Get current feedback tip - USE STABLE VALUES so it doesn't flicker
  const currentTip = stableFeedback?.tips?.[0] || null
  
  // Get metric value by ID
  const getMetricValue = (metricId: MetricId): number | null => {
    switch (metricId) {
      case 'form': return throttledPose ? formScore : null
      case 'elbow': return elbowAngle
      case 'knee': return kneeAngle
      case 'shoulder': return shoulderAngle
      case 'hip': return hipAngle
      case 'release': return releaseAngle
      case 'arm': return armAngle
      default: return null
    }
  }
  
  // Get metric status by ID - USE STABLE FEEDBACK
  const getMetricStatus = (metricId: MetricId): 'good' | 'warning' | 'critical' | 'unknown' => {
    const metric = AVAILABLE_METRICS.find(m => m.id === metricId)
    if (!metric) return 'unknown'
    return metric.getStatus(stableFeedback)
  }
  
  // Get status color
  const getStatusColor = (status: 'good' | 'warning' | 'critical' | 'unknown'): string => {
    switch (status) {
      case 'good': return '#22c55e'
      case 'warning': return '#eab308'
      case 'critical': return '#ef4444'
      default: return '#ffffff'
    }
  }
  
  // Calculate dynamic font size based on number of displayed metrics (Shot Science style)
  // MUCH BIGGER sizes for fewer metrics
  // Max 6 metrics displayed, max 3 per row
  const MAX_DISPLAYED_METRICS = 6
  const MAX_PER_ROW = 3
  
  // Only display first 6 metrics (all are still calculated)
  const displayedMetrics = selectedMetrics.slice(0, MAX_DISPLAYED_METRICS)
  
  const getMetricFontSize = (): { value: string; label: string; gap: string } => {
    const count = displayedMetrics.length
    if (count === 1) return { value: 'text-8xl', label: 'text-2xl', gap: 'gap-4' } // HUGE - single metric
    if (count === 2) return { value: 'text-7xl', label: 'text-xl', gap: 'gap-6' } // Very large
    if (count === 3) return { value: 'text-6xl', label: 'text-lg', gap: 'gap-4' } // Large - one row
    if (count === 4) return { value: 'text-5xl', label: 'text-base', gap: 'gap-3' } // Medium-large
    if (count === 5) return { value: 'text-4xl', label: 'text-sm', gap: 'gap-3' } // Medium
    return { value: 'text-4xl', label: 'text-sm', gap: 'gap-2' } // Standard for 6
  }
  
  const fontSize = getMetricFontSize()
  
  // Split metrics into rows (max 3 per row)
  const metricsRows: MetricId[][] = []
  for (let i = 0; i < displayedMetrics.length; i += MAX_PER_ROW) {
    metricsRows.push(displayedMetrics.slice(i, i + MAX_PER_ROW))
  }

  // Render metrics bar (portrait - bottom) - DYNAMIC based on selection
  const renderMetricsBar = () => (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-sm"
    >
      {/* AI Feedback - PROMINENT display */}
      <AnimatePresence>
        {currentTip && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-gradient-to-r from-[#FF6B35]/30 to-[#FF6B35]/10 border-b border-[#FF6B35]/30 px-4 py-3"
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#FF6B35] flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">🤖</span>
              </div>
              <div className="flex-1">
                <p className="text-[#FF6B35] text-xs font-bold uppercase tracking-wider mb-1">AI Coaching</p>
                <p className="text-white text-sm font-medium leading-snug">{currentTip}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic metrics - multiple rows if needed */}
      <div className="py-4 px-4">
        {metricsRows.map((row, rowIndex) => (
          <div key={rowIndex} className={`flex items-center justify-around ${rowIndex > 0 ? 'mt-3 pt-3 border-t border-white/10' : ''}`}>
            {row.map((metricId) => {
              const metric = AVAILABLE_METRICS.find(m => m.id === metricId)
              if (!metric) return null
              
              const value = getMetricValue(metricId)
              const status = getMetricStatus(metricId)
              const isFormScore = metricId === 'form'
              
              return (
                <div key={metricId} className={`flex flex-col items-center ${fontSize.gap}`}>
                  <div 
                    className={`${fontSize.value} font-black leading-none`}
                    style={{ color: isFormScore ? getScoreColor(value ?? 0) : getStatusColor(status) }}
                  >
                    {value !== null ? (isFormScore ? value : `${value}${metric.unit}`) : '--'}
                  </div>
                  <div className={`${fontSize.label} text-white/60 uppercase tracking-wider mt-2`}>
                    {metric.shortLabel}
                  </div>
                </div>
              )
            })}
          </div>
        ))}

        {/* Settings gear icon */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMetricSettings(true)
          }}
          className="absolute right-3 top-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-5 h-5 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </motion.div>
  )

  // Render metrics strip (landscape - right side) - DYNAMIC
  const renderMetricsStrip = () => {
    // Calculate dynamic sizing for landscape
    const landscapeFontSize = selectedMetrics.length <= 2 ? 'text-3xl' : 
                              selectedMetrics.length <= 3 ? 'text-2xl' : 'text-lg'
    const landscapeLabelSize = selectedMetrics.length <= 3 ? 'text-[10px]' : 'text-[8px]'
    
    return (
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="absolute top-0 right-0 bottom-16 w-24 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-3 py-3 overflow-y-auto"
      >
        {selectedMetrics.map((metricId, index) => {
          const metric = AVAILABLE_METRICS.find(m => m.id === metricId)
          if (!metric) return null
          
          const value = getMetricValue(metricId)
          const status = getMetricStatus(metricId)
          const isFormScore = metricId === 'form'
          
          return (
            <React.Fragment key={metricId}>
              {index > 0 && <div className="w-14 h-px bg-white/20" />}
              <div className="flex flex-col items-center">
                <div 
                  className={`${landscapeFontSize} font-black`}
                  style={{ color: isFormScore ? getScoreColor(value ?? 0) : getStatusColor(status) }}
                >
                  {value !== null ? (isFormScore ? value : `${value}${metric.unit}`) : '--'}
                </div>
                <div className={`${landscapeLabelSize} text-white/60 uppercase tracking-wider`}>
                  {metric.shortLabel}
                </div>
              </div>
            </React.Fragment>
          )
        })}

        {/* Settings button */}
        <button
          onClick={() => setShowMetricSettings(true)}
          className="mt-2 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        >
          <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Tip in landscape */}
        {currentTip && (
          <div className="px-2 py-1 mt-2 border-t border-white/10 pt-2">
            <div className="text-[8px] text-[#FF6B35] uppercase mb-1">💡 Tip</div>
            <div className="text-[9px] text-white/70 leading-tight">{currentTip.slice(0, 50)}...</div>
          </div>
        )}

        {/* FPS indicator */}
        <div className="mt-auto">
          <div className="text-[10px] text-white/40">{fps} FPS</div>
        </div>
      </motion.div>
    )
  }

  // Render controls
  const renderControls = () => (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`absolute ${orientation === 'portrait' ? 'bottom-20' : 'bottom-0'} left-0 right-0 bg-black/60 backdrop-blur-sm`}
    >
      <div className="flex items-center justify-center gap-6 py-4 px-4">
        {/* Flip Camera */}
        {isMobile() && (
          <button
            onClick={handleFlipCamera}
            disabled={isLoading || isRecording}
            className={`p-3 rounded-full transition-all ${
              isLoading || isRecording
                ? 'bg-white/10 text-white/30'
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        )}

        {/* Capture Frame */}
        <button
          onClick={handleCaptureFrame}
          disabled={isLoading || isPaused}
          className={`p-3 rounded-full transition-all ${
            isLoading || isPaused
              ? 'bg-white/10 text-white/30'
              : 'bg-blue-500/30 text-blue-400 hover:bg-blue-500/40 border border-blue-500/50'
          }`}
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Record Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          disabled={isLoading}
          className={`p-5 rounded-full transition-all ${
            isLoading
              ? 'bg-white/10'
              : isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500'
          }`}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white fill-white" />
          ) : (
            <Circle className="w-6 h-6 text-red-500 fill-red-500" />
          )}
        </motion.button>

        {/* Pause/Play */}
        <button
          onClick={handleTogglePause}
          disabled={isLoading}
          className={`p-3 rounded-full transition-all ${
            isLoading
              ? 'bg-white/10 text-white/30'
              : isPaused
              ? 'bg-green-500/30 text-green-400 hover:bg-green-500/40 border border-green-500/50'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
        </button>

        {/* Reset */}
        <button
          onClick={handleReset}
          disabled={isLoading || isRecording}
          className={`p-3 rounded-full transition-all ${
            isLoading || isRecording
              ? 'bg-white/10 text-white/30'
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </motion.div>
  )

  // Error state
  if (cameraError) {
    return (
      <div className="fixed inset-0 z-50 bg-black flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Camera Error</h2>
          <p className="text-white/60 mb-6">{cameraError}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={initCamera}
              className="px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl"
            >
              Retry
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-6 py-3 bg-white/10 text-white font-bold rounded-xl"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-black"
      onClick={handleScreenTap}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="absolute top-4 left-4 z-50 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
        >
          <X className="w-6 h-6" />
        </button>
      )}

      {/* Settings button - Always visible at top right (when not recording) */}
      {!isRecording && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMetricSettings(true)
          }}
          className="absolute top-4 right-4 z-50 p-3 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
          title="Metric Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      )}

      {/* Countdown Overlay */}
      <AnimatePresence>
        {showCountdown && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] flex items-center justify-center bg-black/60"
          >
            <motion.div
              key={countdownValue}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              <div className="text-9xl font-black text-white drop-shadow-2xl">
                {countdownValue}
              </div>
              <div className="text-xl text-white/70 mt-4 uppercase tracking-widest">
                Get Ready
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recording indicator with time limit and shot counter */}
      {isRecording && (
        <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
          {/* Recording time */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-full">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <span className="text-white text-sm font-mono font-bold">
              {formatDuration(recordingDuration)}
            </span>
            <span className="text-white/60 text-xs">/ {formatDuration(MAX_RECORDING_DURATION)}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              style={{ width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%` }}
              animate={{ width: `${(recordingDuration / MAX_RECORDING_DURATION) * 100}%` }}
            />
          </div>
          {/* Shot counter badge */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#FF6B35]/90 rounded-full"
          >
            <span className="text-lg">🏀</span>
            <span className="text-white text-sm font-bold">{shotCount}</span>
            <span className="text-white/70 text-xs">shots</span>
          </motion.div>
        </div>
      )}

      {/* Loading overlay */}
      {(isLoading || !cameraReady) && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 mx-auto mb-4 border-2 border-[#FF6B35] border-t-transparent rounded-full"
            />
            <p className="text-white/60">
              {isLoading ? 'Loading pose detection...' : 'Starting camera...'}
            </p>
          </div>
        </div>
      )}

      {/* Video Element - Full Screen */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Skeleton Overlay - uses throttled pose to reduce glitching */}
      <AnimatePresence>
        {showSkeleton && throttledPose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 pointer-events-none z-10"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          >
            <ProfessionalSkeletonOverlay
              width={videoDimensions.width}
              height={videoDimensions.height}
              pose={throttledPose}
              angles={angles}
              feedback={feedback}
              showAngles={true}
              showKeypoints={true}
              showSkeleton={true}
              minConfidence={0.2}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shot Detected Flash */}
      <AnimatePresence>
        {showShotFlash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.5 }}
                className="text-6xl mb-2"
              >
                🏀
              </motion.div>
              <div className="text-3xl font-black text-white mb-1">SHOT DETECTED</div>
              <div 
                className="text-5xl font-black"
                style={{ color: getScoreColor(lastShotScore || 0) }}
              >
                {lastShotScore}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Shot detected indicator (small) */}
      <AnimatePresence>
        {isShootingDetected && !showShotFlash && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-green-500/90 rounded-full"
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-white" />
              <span className="text-white text-sm font-bold">SHOT DETECTED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metrics - Portrait (bottom) or Landscape (right side) */}
      {orientation === 'portrait' ? renderMetricsBar() : renderMetricsStrip()}

      {/* Controls - show/hide based on state */}
      <AnimatePresence>
        {showControls && renderControls()}
      </AnimatePresence>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Tap to show controls hint (when recording and controls hidden) */}
      {isRecording && !showControls && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs">
          Tap to show controls
        </div>
      )}

      {/* Save Choice Dialog */}
      <AnimatePresence>
        {showSaveChoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-white/10"
            >
              <h2 className="text-xl font-bold text-white text-center mb-2">Recording Complete!</h2>
              <p className="text-white/60 text-center text-sm mb-6">
                What would you like to do with this analysis?
              </p>
              
              {/* Video preview */}
              <div className="bg-black/50 rounded-xl p-3 mb-4 flex items-center gap-3">
                <div className="w-16 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
                  {savedVideoUrl && (
                    <video 
                      src={savedVideoUrl} 
                      className="w-full h-full object-cover"
                      muted
                    />
                  )}
                </div>
                <div>
                  <p className="text-white font-medium">{formatDuration(recordingDuration)} recorded</p>
                  <p className="text-white/50 text-sm">Form Score: {feedback?.overallScore || '--'}</p>
                </div>
              </div>
              
              {/* Save to Profile option */}
              <button
                onClick={handleSaveToProfile}
                className="w-full mb-3 p-4 bg-[#FF6B35] rounded-xl flex items-center gap-3 hover:bg-[#E55A2A] transition-colors"
              >
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-bold">Save to My Profile</p>
                  <p className="text-white/70 text-xs">Saves to Player tab • +20 IQ points</p>
                </div>
              </button>
              
              {/* Just View option */}
              <button
                onClick={handleJustView}
                className="w-full p-4 bg-white/10 rounded-xl flex items-center gap-3 hover:bg-white/15 transition-colors"
              >
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white/70" />
                </div>
                <div className="text-left flex-1">
                  <p className="text-white font-medium">Just View Analysis</p>
                  <p className="text-white/50 text-xs">For analyzing others • Won't save</p>
                </div>
              </button>
              
              {/* Note about usage */}
              <p className="text-white/30 text-[10px] text-center mt-3">
                Both options count as 1 analysis toward your daily limit
              </p>
              
              {/* Usage info */}
              <div className="mt-4 pt-4 border-t border-white/10 text-center">
                <p className="text-white/40 text-xs">
                  {remainingToday === Infinity 
                    ? '∞ analyses remaining today (Elite)'
                    : `${remainingToday} of ${dailyLimit} analyses remaining today`
                  }
                </p>
              </div>
              
              {/* New Recording button */}
              <button
                onClick={handleReset}
                className="w-full mt-3 py-2 text-white/50 text-sm hover:text-white/70 transition-colors"
              >
                Start New Recording
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Limit Warning Dialog */}
      <AnimatePresence>
        {showLimitWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[#1a1a1a] rounded-2xl p-6 max-w-sm w-full border border-red-500/30"
            >
              <div className="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white text-center mb-2">Daily Limit Reached</h2>
              <p className="text-white/60 text-center text-sm mb-4">
                You've used all {dailyLimit} analyses for today. Upgrade your tier for more!
              </p>
              
              <button
                onClick={() => {
                  setShowLimitWarning(false)
                  handleJustView()
                }}
                className="w-full mb-2 py-3 bg-white/10 text-white font-bold rounded-xl"
              >
                View Analysis Only
              </button>
              
              <button
                onClick={() => setShowLimitWarning(false)}
                className="w-full py-2 text-white/50 text-sm"
              >
                Cancel
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Save Success Notification */}
      <AnimatePresence>
        {showSaveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute bottom-32 left-4 right-4 z-50"
          >
            <div className="bg-green-500/90 backdrop-blur-sm rounded-2xl p-4 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  ✓
                </div>
                <span className="text-white font-bold text-lg">Saved to Profile!</span>
              </div>
              <p className="text-white/80 text-sm">
                Your analysis has been saved and your stats updated
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Metric Settings Modal - Scrollable with fixed header/footer */}
      <AnimatePresence>
        {showMetricSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 flex items-end sm:items-center justify-center"
            onClick={() => setShowMetricSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 50 }}
              className="bg-[#1a1a1a] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] flex flex-col border-t sm:border border-[#FF6B35]/30"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Fixed Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10 flex-shrink-0">
                <div>
                  <h2 className="text-lg font-bold text-white">Display Settings</h2>
                  <p className="text-white/50 text-xs">Max 6 metrics shown (3 per row)</p>
                </div>
                <button
                  onClick={() => setShowMetricSettings(false)}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Quick Presets */}
                <div className="mb-4">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Quick Presets</p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_MODES.map((preset) => (
                      <button
                        key={preset.id}
                        onClick={() => applyPreset(preset)}
                        className={`p-3 rounded-xl border transition-all text-center ${
                          currentPreset === preset.id
                            ? 'bg-[#FF6B35]/20 border-[#FF6B35]/50'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <span className="text-2xl block mb-1">{preset.icon}</span>
                        <span className="text-white text-xs font-bold block">{preset.name}</span>
                        <span className="text-white/50 text-[9px] block">{preset.description}</span>
                      </button>
                    ))}
                  </div>
                  {currentPreset === 'custom' && (
                    <p className="text-[#FF6B35]/70 text-xs text-center mt-2">Custom selection active</p>
                  )}
                </div>
                
                {/* Toggles Section */}
                <div className="border-t border-white/10 pt-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Display Options</p>
                </div>
                
                {/* Skeleton Toggle */}
                <button
                  onClick={() => {
                    const newValue = !showSkeleton
                    setShowSkeleton(newValue)
                    localStorage.setItem('shotiq_show_skeleton', String(newValue))
                  }}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    showSkeleton
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Toggle */}
                  <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    showSkeleton ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      showSkeleton ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-sm">SKELETON OVERLAY</p>
                    <p className="text-white/50 text-[10px]">Show pose tracking lines on player</p>
                  </div>
                  
                  {/* Status */}
                  <span className={`text-xs font-bold ${showSkeleton ? 'text-green-400' : 'text-white/40'}`}>
                    {showSkeleton ? 'ON' : 'OFF'}
                  </span>
                </button>
                
                {/* Audio Feedback Toggle */}
                <button
                  onClick={toggleAudioFeedback}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all ${
                    audioFeedbackEnabled
                      ? 'bg-green-500/20 border-green-500/50'
                      : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Toggle */}
                  <div className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                    audioFeedbackEnabled ? 'bg-green-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                      audioFeedbackEnabled ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </div>
                  
                  {/* Info */}
                  <div className="flex-1 text-left">
                    <p className="text-white font-bold text-sm">AUDIO FEEDBACK</p>
                    <p className="text-white/50 text-[10px]">Sound cues for shots & countdown</p>
                  </div>
                  
                  {/* Status */}
                  <span className={`text-xs font-bold ${audioFeedbackEnabled ? 'text-green-400' : 'text-white/40'}`}>
                    {audioFeedbackEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="border-t border-white/10 pt-3">
                  <p className="text-white/40 text-[10px] uppercase tracking-wider mb-2">Metrics to Display</p>
                </div>

                {AVAILABLE_METRICS.map((metric, index) => {
                  const isSelected = selectedMetrics.includes(metric.id)
                  const isOnlyOne = selectedMetrics.length === 1 && isSelected
                  const displayIndex = selectedMetrics.indexOf(metric.id)
                  const willBeHidden = isSelected && displayIndex >= 6
                  
                  return (
                    <button
                      key={metric.id}
                      onClick={() => !isOnlyOne && toggleMetric(metric.id)}
                      disabled={isOnlyOne}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                        isSelected
                          ? willBeHidden 
                            ? 'bg-yellow-500/10 border-yellow-500/30'
                            : 'bg-[#FF6B35]/20 border-[#FF6B35]/50'
                          : 'bg-white/5 border-white/10 hover:border-white/20'
                      } ${isOnlyOne ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected ? 'bg-[#FF6B35] border-[#FF6B35]' : 'border-white/30'
                      }`}>
                        {isSelected && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white font-bold text-sm">{metric.label}</p>
                        <p className="text-white/50 text-[10px] truncate">{metric.description}</p>
                      </div>
                      
                      {/* Position indicator */}
                      {isSelected && (
                        <span className={`text-xs font-bold ${willBeHidden ? 'text-yellow-400' : 'text-[#FF6B35]'}`}>
                          {willBeHidden ? 'Hidden' : `#${displayIndex + 1}`}
                        </span>
                      )}
                    </button>
                  )
                })}
                
                {selectedMetrics.length > 6 && (
                  <p className="text-yellow-400/80 text-xs text-center py-2">
                    ⚠️ {selectedMetrics.length - 6} metric(s) hidden - max 6 shown on screen
                  </p>
                )}
              </div>

              {/* Fixed Footer with Preview and Save Button */}
              <div className="p-4 border-t border-white/10 flex-shrink-0 space-y-3">
                {/* Preview */}
                <div className="bg-black/50 rounded-xl p-3">
                  <p className="text-white/50 text-[10px] uppercase tracking-wider mb-2">
                    Preview ({Math.min(selectedMetrics.length, 6)} of {selectedMetrics.length} shown)
                  </p>
                  <div className="flex items-center justify-around flex-wrap gap-2">
                    {selectedMetrics.slice(0, 6).map((metricId, idx) => {
                      const metric = AVAILABLE_METRICS.find(m => m.id === metricId)
                      if (!metric) return null
                      const previewSize = selectedMetrics.length <= 2 ? 'text-xl' : 
                                       selectedMetrics.length <= 3 ? 'text-lg' : 'text-base'
                      return (
                        <div key={metricId} className="flex flex-col items-center">
                          <div className={`${previewSize} font-black text-white`}>--</div>
                          <div className="text-[8px] text-white/50 uppercase">{metric.shortLabel}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Save Button */}
                <button
                  onClick={() => setShowMetricSettings(false)}
                  className="w-full py-3 bg-[#FF6B35] hover:bg-[#E55A2A] text-white font-bold rounded-xl transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MetricBox({ 
  label, 
  value, 
  status,
  isScore = false
}: { 
  label: string
  value: number | null
  status?: 'good' | 'warning' | 'critical' | 'unknown'
  isScore?: boolean
}) {
  const getStatusColor = (s?: string) => {
    switch (s) {
      case 'good': return 'border-green-500/50 bg-green-500/10'
      case 'warning': return 'border-yellow-500/50 bg-yellow-500/10'
      case 'critical': return 'border-red-500/50 bg-red-500/10'
      default: return 'border-white/20 bg-white/5'
    }
  }

  const getStatusIcon = (s?: string) => {
    switch (s) {
      case 'good': return '✓'
      case 'warning': return '⚠'
      case 'critical': return '✗'
      default: return ''
    }
  }
  
  const getValueColor = (s?: string) => {
    switch (s) {
      case 'good': return 'text-green-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-white'
    }
  }

  return (
    <div className={`p-2 rounded-lg border ${getStatusColor(status)} text-center`}>
      <div className="text-[10px] text-white/60 uppercase">{label}</div>
      <div className={`text-lg font-bold flex items-center justify-center gap-1 ${getValueColor(status)}`}>
        {value !== null ? (isScore ? value : `${value}°`) : '--'}
        {status && status !== 'unknown' && <span className="text-xs">{getStatusIcon(status)}</span>}
      </div>
    </div>
  )
}

export default FullscreenLiveCamera
