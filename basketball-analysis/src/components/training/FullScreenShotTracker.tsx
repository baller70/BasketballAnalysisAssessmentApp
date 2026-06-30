"use client"

/**
 * Full Screen Shot Tracker
 * 
 * A full-screen camera overlay for tracking basketball shots with AI detection.
 * Shows makes, misses, percentage, and a mini court diagram.
 */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  X, Volume2, VolumeX, 
  CheckCircle, XCircle, Target, CameraOff
} from "lucide-react"

// ============================================
// TYPES
// ============================================

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
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'made' | 'missed'>('idle')
  
  // Models
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- holds a dynamically-loaded coco-ssd model instance
  const cocoModelRef = useRef<any>(null)
  
  // Audio refs
  const makeSoundRef = useRef<HTMLAudioElement | null>(null)
  const missSoundRef = useRef<HTMLAudioElement | null>(null)
  
  // Calculate stats from props
  const totalAttempts = madeShots + missedShots
  const percentage = totalAttempts > 0 ? Math.round((madeShots / totalAttempts) * 100) : 0

  // ============================================
  // SHOT HANDLERS
  // ============================================
  
  const handleMade = useCallback(() => {
    console.log('[FullScreenShotTracker] MADE detected')
    setDetectionStatus('made')
    
    if (soundEnabled && makeSoundRef.current) {
      makeSoundRef.current.currentTime = 0
      makeSoundRef.current.play().catch(() => {})
    }
    
    onMade()
    setTimeout(() => setDetectionStatus('detecting'), 1000)
  }, [onMade, soundEnabled])
  
  const handleMiss = useCallback(() => {
    console.log('[FullScreenShotTracker] MISS detected')
    setDetectionStatus('missed')
    
    if (soundEnabled && missSoundRef.current) {
      missSoundRef.current.currentTime = 0
      missSoundRef.current.play().catch(() => {})
    }
    
    onMiss()
    setTimeout(() => setDetectionStatus('detecting'), 1000)
  }, [onMiss, soundEnabled])

  // ============================================
  // INITIALIZATION
  // ============================================
  
  const initializeModels = useCallback(async () => {
    setIsLoading(true)
    
    try {
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      cocoModelRef.current = await cocoSsd.load({
        base: 'lite_mobilenet_v2'
      })
      
      console.log('[FullScreenShotTracker] COCO-SSD model loaded')
      
      if (typeof window !== 'undefined') {
        makeSoundRef.current = new Audio('/sounds/swish.mp3')
        missSoundRef.current = new Audio('/sounds/rim.mp3')
      }
      
      setIsLoading(false)
    } catch (err) {
      console.error('[FullScreenShotTracker] Model initialization error:', err)
      setIsLoading(false)
    }
  }, [])
  
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        })
      } catch (e) {
        console.log('[FullScreenShotTracker] Failed with constraints, trying fallback:', (e as { message?: string }).message)
        stream = await navigator.mediaDevices.getUserMedia({ video: true })
      }
      
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      
      if (canvasRef.current && overlayCanvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        overlayCanvasRef.current.width = videoRef.current.videoWidth
        overlayCanvasRef.current.height = videoRef.current.videoHeight
      }
      
      setCameraActive(true)
      setDetectionStatus('detecting')
      console.log('[FullScreenShotTracker] Camera initialized')
    } catch (err) {
      console.log('[FullScreenShotTracker] Camera error:', err)
      // Automatically fallback to demo video!
      console.log('[FullScreenShotTracker] Automatically falling back to demo video')
      if (videoRef.current) {
        videoRef.current.srcObject = null
        videoRef.current.src = '/demo-basketball.mp4'
        videoRef.current.loop = true
        videoRef.current.muted = true
        
        videoRef.current.onloadedmetadata = () => {
          if (canvasRef.current && overlayCanvasRef.current && videoRef.current) {
            canvasRef.current.width = videoRef.current.videoWidth
            canvasRef.current.height = videoRef.current.videoHeight
            overlayCanvasRef.current.width = videoRef.current.videoWidth
            overlayCanvasRef.current.height = videoRef.current.videoHeight
          }
          
          setCameraActive(true)
          setDetectionStatus('detecting')
          videoRef.current?.play()
        }
      }
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
        .filter((pred: { class: string; score: number; bbox: number[] }) => pred.class === 'sports ball' && pred.score >= DETECTION_CONFIG.ballConfidenceThreshold)
        .map((pred: { class: string; score: number; bbox: number[] }) => ({
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
  
  const analyzeTrajectory = useCallback((ballDetection: { bbox: { x: number; y: number; width: number; height: number } } | null): boolean => {
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
    let ballDetection = cocoDetections.find((d: { type: string }) => d.type === 'ball') || null
    
    if (!ballDetection) {
      const colorDetections = detectWithColor()
      ballDetection = colorDetections[0] || null
    }
    
    const isApproachingRim = analyzeTrajectory(ballDetection)
    const { movement: netMoved, confidence: netConfidence } = detectNetMovement()
    
    if (netMoved && netConfidence > 0.3 && isApproachingRim) {
      lastShotTimeRef.current = now
      handleMade()
    } else if (isApproachingRim && trajectoryHistoryRef.current.length > 5) {
      const recentPoints = trajectoryHistoryRef.current.slice(-5)
      const isBouncingAway = recentPoints[recentPoints.length - 1].y > recentPoints[0].y &&
                              recentPoints[recentPoints.length - 1].y < (canvasRef.current?.height || 720) * 0.5
      
      if (isBouncingAway && netConfidence < 0.2) {
        lastShotTimeRef.current = now
        handleMiss()
      }
    }
    
    animationRef.current = requestAnimationFrame(runDetection)
  }, [isActive, cameraActive, isPaused, detectWithCOCO, detectWithColor, analyzeTrajectory, detectNetMovement, handleMade, handleMiss])

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

  // ============================================
  // RENDER
  // ============================================
  
  if (!isActive) return null
  
  return (
    <div className="fixed inset-0 z-[300] bg-black">
      {/* Camera Feed - Full screen */}
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
      
      {/* Top Left - Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 left-4 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Top Right - Sound Toggle */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className="absolute top-4 right-4 z-20 w-12 h-12 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center"
      >
        {soundEnabled ? (
          <Volume2 className="w-6 h-6 text-white" />
        ) : (
          <VolumeX className="w-6 h-6 text-[#888]" />
        )}
      </button>
      
      {/* Bottom Overlay - Transparent */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-4 pb-8">
        {/* Detection Status & Mini Court Row */}
        <div className="flex items-center justify-between mb-3">
          {/* Detection Status */}
          <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${
            detectionStatus === 'made' ? 'bg-green-500/80' :
            detectionStatus === 'missed' ? 'bg-red-500/80' :
            detectionStatus === 'detecting' ? 'bg-[#FF6B35]/80' :
            'bg-black/40'
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
          
          {/* Current Spot */}
          {currentSpot && (
            <p className="text-white/70 text-sm">{currentSpot.name} ({currentSpot.index + 1}/{currentSpot.total})</p>
          )}
          
          {/* Mini Court */}
          <div className="w-16 h-16 bg-black/40 backdrop-blur-sm rounded-xl p-1.5">
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <rect x="5" y="5" width="90" height="90" fill="none" stroke="white" strokeWidth="1" opacity="0.5" rx="2" />
              <path d="M 15 5 L 15 30 Q 15 55 50 55 Q 85 55 85 30 L 85 5" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
              <circle cx="50" cy="10" r="3" fill="#FF6B35" />
              {spots.map((spot) => (
                <circle 
                  key={spot.id}
                  cx={spot.x} 
                  cy={spot.y} 
                  r="4" 
                  fill={spot.madeShots > spot.missedShots ? '#22c55e' : spot.missedShots > 0 ? '#ef4444' : '#666'}
                  opacity="0.8"
                />
              ))}
            </svg>
          </div>
        </div>
        
        {/* Stats Row - Transparent */}
        <div className="flex items-center justify-center gap-4 bg-black/40 backdrop-blur-sm rounded-2xl px-6 py-4">
          <div className="text-center">
            <p className="text-4xl font-black text-white tabular-nums">{madeShots}</p>
            <p className="text-white/60 text-xs uppercase">MAKES</p>
          </div>
          
          <div className="text-2xl text-white/40">/</div>
          
          <div className="text-center">
            <p className="text-4xl font-black text-white tabular-nums">{totalAttempts}</p>
            <p className="text-white/60 text-xs uppercase">ATTEMPTS</p>
          </div>
          
          <div className="w-px h-10 bg-white/20 mx-2" />
          
          <div className="text-center">
            <p className="text-4xl font-black text-[#FF6B35] tabular-nums">{percentage}%</p>
            <p className="text-white/60 text-xs uppercase">ACCURACY</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenShotTracker
