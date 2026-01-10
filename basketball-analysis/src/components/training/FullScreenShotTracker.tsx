"use client"

/**
 * Full Screen Shot Tracker
 * 
 * A full-screen camera overlay for tracking basketball shots with AI detection.
 * Shows makes, misses, percentage, and a mini court diagram.
 */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  X, Pause, Play, Volume2, VolumeX, 
  Maximize2, Minimize2, RotateCcw, Settings,
  CheckCircle, XCircle, Target, Camera, CameraOff
} from "lucide-react"

// ============================================
// TYPES
// ============================================

interface ShotLocation {
  x: number
  y: number
  made: boolean
  timestamp: number
}

interface FullScreenShotTrackerProps {
  isActive: boolean
  onClose: () => void
  onPause: () => void
  onResume: () => void
  isPaused: boolean
  madeShots: number
  missedShots: number
  currentSpot?: { name: string; index: number; total: number }
  spots?: Array<{ id: string; x: number; y: number; madeShots: number; missedShots: number }>
  onMade: () => void
  onMiss: () => void
  enableSound?: boolean
}

// ============================================
// DETECTION CONFIG
// ============================================

const DETECTION_CONFIG = {
  ballConfidenceThreshold: 0.4,
  netMovementThreshold: 15,
  shotCooldownMs: 1500,
  trajectoryFrames: 10,
}

// ============================================
// MAIN COMPONENT
// ============================================

export function FullScreenShotTracker({
  isActive,
  onClose,
  onPause,
  onResume,
  isPaused,
  madeShots,
  missedShots,
  currentSpot,
  spots = [],
  onMade,
  onMiss,
  enableSound = true
}: FullScreenShotTrackerProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastShotTimeRef = useRef<number>(0)
  const trajectoryHistoryRef = useRef<{ x: number; y: number; timestamp: number }[]>([])
  const previousFrameRef = useRef<ImageData | null>(null)
  
  // State
  const [cameraActive, setCameraActive] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  const [showControls, setShowControls] = useState(true)
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'made' | 'missed'>('idle')
  const [shotLocations, setShotLocations] = useState<ShotLocation[]>([])
  
  // Models
  const cocoModelRef = useRef<any>(null)
  
  // Audio refs
  const makeSoundRef = useRef<HTMLAudioElement | null>(null)
  const missSoundRef = useRef<HTMLAudioElement | null>(null)
  
  // Calculate stats
  const totalAttempts = madeShots + missedShots
  const percentage = totalAttempts > 0 ? Math.round((madeShots / totalAttempts) * 100) : 0

  // ============================================
  // INITIALIZATION
  // ============================================
  
  const initializeModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load TensorFlow.js and COCO-SSD
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      cocoModelRef.current = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      })
      
      console.log('[FullScreenShotTracker] COCO-SSD model loaded')
      
      // Initialize audio
      if (typeof window !== 'undefined') {
        makeSoundRef.current = new Audio('/sounds/swish.mp3')
        missSoundRef.current = new Audio('/sounds/rim.mp3')
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error('[FullScreenShotTracker] Model initialization error:', err)
      setError('Failed to load AI models. Using manual detection.')
      setIsLoading(false)
    }
  }, [])
  
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      })
      
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      
      if (canvasRef.current && overlayCanvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        overlayCanvasRef.current.width = videoRef.current.videoWidth
        overlayCanvasRef.current.height = videoRef.current.videoHeight
      }
      
      setCameraActive(true)
      console.log('[FullScreenShotTracker] Camera initialized')
    } catch (err) {
      console.error('[FullScreenShotTracker] Camera error:', err)
      setError('Camera access denied. Please allow camera permissions.')
    }
  }, [])
  
  const stopCamera = useCallback(() => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream
      stream.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setCameraActive(false)
  }, [])

  // ============================================
  // DETECTION METHODS
  // ============================================
  
  const detectWithCOCO = useCallback(async () => {
    if (!cocoModelRef.current || !videoRef.current) return []
    
    try {
      const predictions = await cocoModelRef.current.detect(videoRef.current)
      return predictions
        .filter((pred: any) => pred.class === 'sports ball' && pred.score >= DETECTION_CONFIG.ballConfidenceThreshold)
        .map((pred: any) => ({
          type: 'ball',
          confidence: pred.score,
          bbox: {
            x: pred.bbox[0],
            y: pred.bbox[1],
            width: pred.bbox[2],
            height: pred.bbox[3]
          }
        }))
    } catch {
      return []
    }
  }, [])
  
  const detectWithColor = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return []
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return []
    
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    const data = imageData.data
    
    const orangePixels: { x: number; y: number }[] = []
    
    for (let y = 0; y < imageData.height; y += 4) {
      for (let x = 0; x < imageData.width; x += 4) {
        const i = (y * imageData.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        if (r > 150 && r > g * 1.3 && g > 50 && g < 180 && b < 100) {
          orangePixels.push({ x, y })
        }
      }
    }
    
    if (orangePixels.length < 50) return []
    
    const minX = Math.min(...orangePixels.map(p => p.x))
    const maxX = Math.max(...orangePixels.map(p => p.x))
    const minY = Math.min(...orangePixels.map(p => p.y))
    const maxY = Math.max(...orangePixels.map(p => p.y))
    
    const width = maxX - minX
    const height = maxY - minY
    const aspectRatio = width / height
    
    if (aspectRatio < 0.5 || aspectRatio > 2) return []
    
    return [{
      type: 'ball',
      confidence: Math.min(orangePixels.length / 500, 1),
      bbox: { x: minX, y: minY, width, height }
    }]
  }, [])
  
  const analyzeTrajectory = useCallback((ballDetection: any): boolean => {
    if (!ballDetection) return false
    
    const now = Date.now()
    const centerX = ballDetection.bbox.x + ballDetection.bbox.width / 2
    const centerY = ballDetection.bbox.y + ballDetection.bbox.height / 2
    
    trajectoryHistoryRef.current.push({ x: centerX, y: centerY, timestamp: now })
    trajectoryHistoryRef.current = trajectoryHistoryRef.current.filter(p => now - p.timestamp < 2000)
    
    if (trajectoryHistoryRef.current.length < DETECTION_CONFIG.trajectoryFrames) return false
    
    const recentPoints = trajectoryHistoryRef.current.slice(-DETECTION_CONFIG.trajectoryFrames)
    const firstPoint = recentPoints[0]
    const lastPoint = recentPoints[recentPoints.length - 1]
    
    const isMovingUp = lastPoint.y < firstPoint.y
    const isInRimArea = lastPoint.y < (canvasRef.current?.height || 720) * 0.35
    
    return isInRimArea && !isMovingUp
  }, [])
  
  const detectNetMovement = useCallback(() => {
    if (!canvasRef.current || !videoRef.current) return { movement: false, confidence: 0 }
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return { movement: false, confidence: 0 }
    
    ctx.drawImage(videoRef.current, 0, 0)
    const currentFrame = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    if (!previousFrameRef.current) {
      previousFrameRef.current = currentFrame
      return { movement: false, confidence: 0 }
    }
    
    const width = currentFrame.width
    const height = currentFrame.height
    const startX = Math.floor(width * 0.35)
    const endX = Math.floor(width * 0.65)
    const startY = 0
    const endY = Math.floor(height * 0.35)
    
    let totalDiff = 0
    let pixelCount = 0
    
    for (let y = startY; y < endY; y += 2) {
      for (let x = startX; x < endX; x += 2) {
        const i = (y * width + x) * 4
        const rDiff = Math.abs(currentFrame.data[i] - previousFrameRef.current.data[i])
        const gDiff = Math.abs(currentFrame.data[i + 1] - previousFrameRef.current.data[i + 1])
        const bDiff = Math.abs(currentFrame.data[i + 2] - previousFrameRef.current.data[i + 2])
        totalDiff += (rDiff + gDiff + bDiff) / 3
        pixelCount++
      }
    }
    
    previousFrameRef.current = currentFrame
    
    const avgDiff = totalDiff / pixelCount
    return { 
      movement: avgDiff > DETECTION_CONFIG.netMovementThreshold, 
      confidence: Math.min(avgDiff / 50, 1) 
    }
  }, [])

  // ============================================
  // DETECTION LOOP
  // ============================================
  
  const runDetection = useCallback(async () => {
    if (!isActive || !cameraActive || isPaused) return
    
    const now = Date.now()
    if (now - lastShotTimeRef.current < DETECTION_CONFIG.shotCooldownMs) {
      animationRef.current = requestAnimationFrame(runDetection)
      return
    }
    
    setDetectionStatus('detecting')
    
    const cocoDetections = await detectWithCOCO()
    let ballDetection = cocoDetections.find((d: any) => d.type === 'ball') || null
    
    if (!ballDetection) {
      const colorDetections = detectWithColor()
      ballDetection = colorDetections[0] || null
    }
    
    const isApproachingRim = analyzeTrajectory(ballDetection)
    const { movement: netMoved, confidence: netConfidence } = detectNetMovement()
    
    // Shot detection logic
    if (netMoved && netConfidence > 0.3 && isApproachingRim) {
      lastShotTimeRef.current = now
      setDetectionStatus('made')
      onMade()
      
      // Add to shot locations
      setShotLocations(prev => [...prev, { 
        x: Math.random() * 100, 
        y: Math.random() * 100, 
        made: true, 
        timestamp: now 
      }])
      
      if (soundEnabled && makeSoundRef.current) {
        makeSoundRef.current.currentTime = 0
        makeSoundRef.current.play().catch(() => {})
      }
      
      setTimeout(() => setDetectionStatus('detecting'), 1000)
    } else if (isApproachingRim && trajectoryHistoryRef.current.length > 5) {
      const recentPoints = trajectoryHistoryRef.current.slice(-5)
      const isBouncingAway = recentPoints[recentPoints.length - 1].y > recentPoints[0].y &&
                              recentPoints[recentPoints.length - 1].y < (canvasRef.current?.height || 720) * 0.5
      
      if (isBouncingAway && netConfidence < 0.2) {
        lastShotTimeRef.current = now
        setDetectionStatus('missed')
        onMiss()
        
        setShotLocations(prev => [...prev, { 
          x: Math.random() * 100, 
          y: Math.random() * 100, 
          made: false, 
          timestamp: now 
        }])
        
        if (soundEnabled && missSoundRef.current) {
          missSoundRef.current.currentTime = 0
          missSoundRef.current.play().catch(() => {})
        }
        
        setTimeout(() => setDetectionStatus('detecting'), 1000)
      }
    }
    
    animationRef.current = requestAnimationFrame(runDetection)
  }, [isActive, cameraActive, isPaused, detectWithCOCO, detectWithColor, analyzeTrajectory, detectNetMovement, onMade, onMiss, soundEnabled])

  // ============================================
  // EFFECTS
  // ============================================
  
  useEffect(() => {
    if (isActive) {
      initializeModels()
      initializeCamera()
    }
    
    return () => {
      stopCamera()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, initializeModels, initializeCamera, stopCamera])
  
  useEffect(() => {
    if (isActive && cameraActive && !isPaused) {
      runDetection()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, cameraActive, isPaused, runDetection])

  // Hide controls after 3 seconds of inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout
    
    const resetTimer = () => {
      setShowControls(true)
      clearTimeout(timeout)
      timeout = setTimeout(() => setShowControls(false), 3000)
    }
    
    window.addEventListener('touchstart', resetTimer)
    window.addEventListener('mousemove', resetTimer)
    
    resetTimer()
    
    return () => {
      clearTimeout(timeout)
      window.removeEventListener('touchstart', resetTimer)
      window.removeEventListener('mousemove', resetTimer)
    }
  }, [])

  // ============================================
  // RENDER
  // ============================================
  
  if (!isActive) return null
  
  return (
    <div className="fixed inset-0 z-[200] bg-black">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
      />
      
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay Canvas */}
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-10">
          <div className="animate-spin w-16 h-16 border-4 border-[#FF6B35] border-t-transparent rounded-full mb-4" />
          <p className="text-white text-lg font-bold">Loading AI Detection...</p>
          <p className="text-[#888] text-sm mt-1">Preparing camera and models</p>
        </div>
      )}
      
      {/* Camera Off State */}
      {!cameraActive && !isLoading && (
        <div className="absolute inset-0 bg-[#0a0a0a] flex flex-col items-center justify-center">
          <CameraOff className="w-20 h-20 text-[#555] mb-4" />
          <p className="text-white text-xl font-bold">Camera Unavailable</p>
          <p className="text-[#888] text-sm mt-2">Please allow camera access</p>
          <button
            onClick={initializeCamera}
            className="mt-6 px-6 py-3 bg-[#FF6B35] text-white font-bold rounded-xl"
          >
            Retry Camera
          </button>
        </div>
      )}
      
      {/* Top Controls - Close Button */}
      <div className={`absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          <X className="w-6 h-6 text-white" />
        </button>
        
        {/* Detection Status */}
        <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
          detectionStatus === 'made' ? 'bg-green-500' :
          detectionStatus === 'missed' ? 'bg-red-500' :
          detectionStatus === 'detecting' ? 'bg-[#FF6B35]' :
          'bg-black/50'
        } backdrop-blur-sm`}>
          {detectionStatus === 'made' && <CheckCircle className="w-5 h-5 text-white" />}
          {detectionStatus === 'missed' && <XCircle className="w-5 h-5 text-white" />}
          {detectionStatus === 'detecting' && <Target className="w-5 h-5 text-white animate-pulse" />}
          <span className="text-white font-bold text-sm uppercase">
            {detectionStatus === 'made' ? 'MADE!' :
             detectionStatus === 'missed' ? 'MISSED' :
             detectionStatus === 'detecting' ? 'DETECTING' : 'READY'}
          </span>
        </div>
        
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center"
        >
          {soundEnabled ? (
            <Volume2 className="w-6 h-6 text-white" />
          ) : (
            <VolumeX className="w-6 h-6 text-[#888]" />
          )}
        </button>
      </div>
      
      {/* Mini Court Diagram - Top Right */}
      <div className={`absolute top-20 right-4 z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="w-28 h-28 bg-black/60 backdrop-blur-sm rounded-xl p-2 border border-white/20">
          {/* Mini Court SVG */}
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Court outline */}
            <rect x="5" y="5" width="90" height="90" fill="none" stroke="white" strokeWidth="1" opacity="0.5" rx="2" />
            
            {/* Three point arc */}
            <path d="M 15 5 L 15 30 Q 15 55 50 55 Q 85 55 85 30 L 85 5" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
            
            {/* Key/Paint */}
            <rect x="35" y="5" width="30" height="25" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
            
            {/* Basket */}
            <circle cx="50" cy="10" r="3" fill="#FF6B35" />
            
            {/* Shot locations */}
            {spots.map((spot, i) => (
              <g key={spot.id}>
                <circle 
                  cx={spot.x} 
                  cy={spot.y} 
                  r="4" 
                  fill={spot.madeShots > spot.missedShots ? '#22c55e' : spot.missedShots > 0 ? '#ef4444' : '#666'}
                  opacity="0.8"
                />
                {currentSpot?.index === i && (
                  <circle 
                    cx={spot.x} 
                    cy={spot.y} 
                    r="6" 
                    fill="none" 
                    stroke="#FF6B35" 
                    strokeWidth="2"
                    className="animate-pulse"
                  />
                )}
              </g>
            ))}
            
            {/* Recent shot locations */}
            {shotLocations.slice(-5).map((shot, i) => (
              <g key={i}>
                <text 
                  x={shot.x} 
                  y={shot.y} 
                  fontSize="12" 
                  fill={shot.made ? '#22c55e' : '#ef4444'}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {shot.made ? '✓' : '✗'}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
      
      {/* Bottom Stats Overlay */}
      <div className="absolute bottom-0 left-0 right-0 z-20">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none" />
        
        {/* Stats Content */}
        <div className="relative px-6 pb-8 pt-16">
          {/* Current Spot Indicator */}
          {currentSpot && (
            <div className="text-center mb-4">
              <p className="text-[#888] text-sm uppercase tracking-wider">Current Spot</p>
              <p className="text-white text-lg font-bold">{currentSpot.name} ({currentSpot.index + 1}/{currentSpot.total})</p>
            </div>
          )}
          
          {/* Main Stats Display */}
          <div className="flex items-end justify-center gap-6">
            {/* Makes */}
            <div className="text-center">
              <p className="text-6xl md:text-8xl font-black text-white tabular-nums">
                {madeShots}
              </p>
              <p className="text-[#888] text-sm md:text-base uppercase tracking-widest mt-1">MAKES</p>
            </div>
            
            {/* Divider */}
            <div className="text-4xl md:text-6xl text-[#555] font-light mb-4">/</div>
            
            {/* Attempts */}
            <div className="text-center">
              <p className="text-6xl md:text-8xl font-black text-white tabular-nums">
                {totalAttempts}
              </p>
              <p className="text-[#888] text-sm md:text-base uppercase tracking-widest mt-1">ATTEMPTS</p>
            </div>
          </div>
          
          {/* Percentage Bar */}
          <div className="mt-6 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#888] text-sm">Accuracy</span>
              <span className="text-white text-2xl font-black">{percentage}%</span>
            </div>
            <div className="h-2 bg-[#2a2a2a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#FF6B35] to-[#FF8F35] rounded-full transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
          
          {/* Control Buttons */}
          <div className={`flex items-center justify-center gap-4 mt-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
            {/* Pause/Resume */}
            <button
              onClick={isPaused ? onResume : onPause}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              {isPaused ? (
                <Play className="w-7 h-7 text-white" />
              ) : (
                <Pause className="w-7 h-7 text-white" />
              )}
            </button>
            
            {/* Manual Make Button */}
            <button
              onClick={onMade}
              className="w-20 h-20 rounded-full bg-green-500/80 backdrop-blur-sm flex items-center justify-center border-4 border-green-400 shadow-lg shadow-green-500/30"
            >
              <CheckCircle className="w-10 h-10 text-white" />
            </button>
            
            {/* Manual Miss Button */}
            <button
              onClick={onMiss}
              className="w-20 h-20 rounded-full bg-red-500/80 backdrop-blur-sm flex items-center justify-center border-4 border-red-400 shadow-lg shadow-red-500/30"
            >
              <XCircle className="w-10 h-10 text-white" />
            </button>
            
            {/* End Drill */}
            <button
              onClick={onClose}
              className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20"
            >
              <X className="w-7 h-7 text-white" />
            </button>
          </div>
        </div>
      </div>
      
      {/* Fullscreen expand button */}
      <button
        onClick={() => {
          if (document.fullscreenElement) {
            document.exitFullscreen()
          } else {
            document.documentElement.requestFullscreen()
          }
        }}
        className={`absolute bottom-32 right-4 w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center z-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
      >
        <Maximize2 className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

export default FullScreenShotTracker
