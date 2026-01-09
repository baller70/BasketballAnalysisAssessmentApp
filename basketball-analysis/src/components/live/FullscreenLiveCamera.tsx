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
} from 'lucide-react'
import { usePoseDetection } from '@/hooks/usePoseDetection'
import { SkeletonOverlay } from './SkeletonOverlay'
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const recordingBlobRef = useRef<Blob | null>(null)

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
  const [showExpandedMetrics, setShowExpandedMetrics] = useState(false)
  const [showShotFlash, setShowShotFlash] = useState(false)
  const [lastShotScore, setLastShotScore] = useState<number | null>(null)

  // State for saved video
  const [savedVideoUrl, setSavedVideoUrl] = useState<string | null>(null)
  const [showSaveSuccess, setShowSaveSuccess] = useState(false)
  const [showSaveChoice, setShowSaveChoice] = useState(false)
  const [showLimitWarning, setShowLimitWarning] = useState(false)
  
  // Throttled pose state to reduce glitching
  const [throttledPose, setThrottledPose] = useState<any>(null)
  const lastPoseUpdateRef = useRef<number>(0)
  const POSE_UPDATE_INTERVAL = 100 // Update skeleton every 100ms (10fps) to reduce glitching

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
    targetFps: 15, // Reduced from 30 to prevent glitching - smoother performance
    onShootingDetected: (detectedPose) => {
      console.log('[FullscreenLive] Shooting motion detected!')
      // Show shot flash
      if (feedback?.overallScore) {
        setLastShotScore(feedback.overallScore)
        setShowShotFlash(true)
        setTimeout(() => setShowShotFlash(false), 1500)
      }
    },
  })

  // Throttle pose updates to reduce visual glitching
  useEffect(() => {
    if (pose) {
      const now = Date.now()
      if (now - lastPoseUpdateRef.current >= POSE_UPDATE_INTERVAL) {
        setThrottledPose(pose)
        lastPoseUpdateRef.current = now
      }
    }
  }, [pose])

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
            
            video.play()
              .then(() => {
                console.log('[FullscreenLive] Video playing')
                setVideoDimensions({
                  width: video.videoWidth,
                  height: video.videoHeight,
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

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRecording, isPaused])

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
        setVideoDimensions({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight,
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
  const handleStartRecording = useCallback(() => {
    if (!streamRef.current) return

    recordedChunksRef.current = []
    setRecordingDuration(0)
    setShowControls(false) // Hide controls when recording starts

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    })

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }

    mediaRecorder.onstop = async () => {
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
  }, [capturedFrames, setVideoAnalysisData])

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
    setShowControls(true)
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

  // Get key metrics for display
  const formScore = feedback?.overallScore ?? 0
  const legAngle = angles?.kneeAngle ?? null
  const releaseAngle = angles?.shoulderAngle ?? null
  const elbowAngle = angles?.elbowAngle ?? null
  const hipAngle = angles?.hipAngle ?? null

  // Render metrics bar (portrait - bottom)
  const renderMetricsBar = () => (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="absolute bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm"
      onClick={() => setShowExpandedMetrics(!showExpandedMetrics)}
    >
      {/* Main metrics row */}
      <div className="flex items-center justify-around py-3 px-4">
        {/* Form Score */}
        <div className="flex flex-col items-center">
          <div 
            className="text-2xl font-black"
            style={{ color: getScoreColor(formScore) }}
          >
            {pose ? formScore : '--'}
          </div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Form</div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Leg Angle */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-white">
            {legAngle !== null ? `${legAngle}°` : '--'}
          </div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Leg</div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Release Angle */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-white">
            {releaseAngle !== null ? `${releaseAngle}°` : '--'}
          </div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Release</div>
        </div>

        {/* Divider */}
        <div className="w-px h-8 bg-white/20" />

        {/* Elbow */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-bold text-white">
            {elbowAngle !== null ? `${elbowAngle}°` : '--'}
          </div>
          <div className="text-[10px] text-white/60 uppercase tracking-wider">Elbow</div>
        </div>

        {/* Expand indicator */}
        <div className="absolute right-2 top-1">
          {showExpandedMetrics ? (
            <ChevronDown className="w-4 h-4 text-white/40" />
          ) : (
            <ChevronUp className="w-4 h-4 text-white/40" />
          )}
        </div>
      </div>

      {/* Expanded metrics */}
      <AnimatePresence>
        {showExpandedMetrics && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/10 overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Detailed metrics grid */}
              <div className="grid grid-cols-4 gap-2">
                <MetricBox label="ELBOW" value={elbowAngle} status={feedback?.elbowStatus} />
                <MetricBox label="KNEE" value={legAngle} status={feedback?.kneeStatus} />
                <MetricBox label="SHOULDER" value={releaseAngle} status={feedback?.shoulderStatus} />
                <MetricBox label="HIP" value={hipAngle} status={feedback?.hipStatus} />
              </div>

              {/* Tips */}
              {feedback?.tips && feedback.tips.length > 0 && (
                <div className="bg-white/5 rounded-lg p-3">
                  <div className="text-[10px] text-[#FF6B35] uppercase tracking-wider mb-1">💡 Tip</div>
                  <div className="text-xs text-white/80">{feedback.tips[0]}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )

  // Render metrics strip (landscape - right side)
  const renderMetricsStrip = () => (
    <motion.div
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="absolute top-0 right-0 bottom-16 w-20 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 py-4"
    >
      {/* Form Score */}
      <div className="flex flex-col items-center">
        <div 
          className="text-3xl font-black"
          style={{ color: getScoreColor(formScore) }}
        >
          {pose ? formScore : '--'}
        </div>
        <div className="text-[9px] text-white/60 uppercase tracking-wider">Form</div>
      </div>

      <div className="w-12 h-px bg-white/20" />

      {/* Leg Angle */}
      <div className="flex flex-col items-center">
        <div className="text-lg font-bold text-white">
          {legAngle !== null ? `${legAngle}°` : '--'}
        </div>
        <div className="text-[9px] text-white/60 uppercase tracking-wider">Leg</div>
      </div>

      {/* Release Angle */}
      <div className="flex flex-col items-center">
        <div className="text-lg font-bold text-white">
          {releaseAngle !== null ? `${releaseAngle}°` : '--'}
        </div>
        <div className="text-[9px] text-white/60 uppercase tracking-wider">Release</div>
      </div>

      {/* Elbow */}
      <div className="flex flex-col items-center">
        <div className="text-lg font-bold text-white">
          {elbowAngle !== null ? `${elbowAngle}°` : '--'}
        </div>
        <div className="text-[9px] text-white/60 uppercase tracking-wider">Elbow</div>
      </div>

      {/* FPS indicator */}
      <div className="mt-auto">
        <div className="text-[10px] text-white/40">{fps} FPS</div>
      </div>
    </motion.div>
  )

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

      {/* Recording indicator */}
      {isRecording && (
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-full">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-2 h-2 bg-white rounded-full"
          />
          <span className="text-white text-sm font-mono font-bold">
            {formatDuration(recordingDuration)}
          </span>
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
        {throttledPose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            className="absolute inset-0 pointer-events-none"
            style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
          >
            <SkeletonOverlay
              width={videoDimensions.width}
              height={videoDimensions.height}
              pose={throttledPose}
              angles={angles}
              showAngles={false}
              showKeypoints={true}
              showSkeleton={true}
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
    </div>
  )
}

// ============================================
// SUB-COMPONENTS
// ============================================

function MetricBox({ 
  label, 
  value, 
  status 
}: { 
  label: string
  value: number | null
  status?: string 
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

  return (
    <div className={`p-2 rounded-lg border ${getStatusColor(status)} text-center`}>
      <div className="text-[10px] text-white/60 uppercase">{label}</div>
      <div className="text-lg font-bold text-white flex items-center justify-center gap-1">
        {value !== null ? `${value}°` : '--'}
        {status && <span className="text-xs">{getStatusIcon(status)}</span>}
      </div>
    </div>
  )
}

export default FullscreenLiveCamera
