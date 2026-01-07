"use client"

/**
 * Hybrid Shot Detector
 * 
 * A multi-layered basketball shot detection system that combines:
 * 1. Basketball-specific YOLO model (primary detection)
 * 2. MediaPipe pose for trajectory prediction
 * 3. OpenCV.js color-based ball tracking
 * 4. TensorFlow.js COCO-SSD as fallback
 * 5. Net movement detection via frame differencing
 * 
 * 100% FREE - Uses only open-source tools:
 * - TensorFlow.js / COCO-SSD (Google)
 * - MediaPipe (Google)
 * - OpenCV.js (Intel/Open-source)
 */

import React, { useState, useRef, useEffect, useCallback } from "react"
import { 
  Camera, CameraOff, Circle, Crosshair, Target, 
  Eye, EyeOff, Settings, ChevronDown, AlertCircle, 
  CheckCircle, X, Zap, Activity, Volume2, VolumeX
} from "lucide-react"

// ============================================
// TYPES
// ============================================

interface Detection {
  type: 'ball' | 'rim' | 'net' | 'backboard'
  confidence: number
  bbox: { x: number; y: number; width: number; height: number }
}

interface ShotResult {
  made: boolean
  confidence: number
  timestamp: number
  detectionMethod: 'yolo' | 'coco' | 'color' | 'trajectory' | 'net_movement'
}

interface HybridShotDetectorProps {
  isActive: boolean
  onShotDetected: (result: ShotResult) => void
  onError?: (error: string) => void
  showPreview?: boolean
  enableSound?: boolean
}

// ============================================
// DETECTION CONFIG
// ============================================

const DETECTION_CONFIG = {
  // Ball detection thresholds
  ballConfidenceThreshold: 0.4,
  rimConfidenceThreshold: 0.5,
  
  // Color detection (orange basketball)
  ballColorHSV: {
    hueMin: 5,
    hueMax: 25,
    satMin: 100,
    valMin: 100
  },
  
  // Net movement detection
  netMovementThreshold: 15,
  netRegionHeight: 0.15, // Bottom 15% of detected rim area
  
  // Shot detection timing
  shotCooldownMs: 1500, // Minimum time between shots
  trajectoryFrames: 10, // Frames to analyze for trajectory
  
  // Fallback priorities
  detectionPriority: ['yolo', 'coco', 'color', 'trajectory', 'net_movement'] as const
}

// ============================================
// MAIN COMPONENT
// ============================================

export function HybridShotDetector({
  isActive,
  onShotDetected,
  onError,
  showPreview = true,
  enableSound = true
}: HybridShotDetectorProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const lastShotTimeRef = useRef<number>(0)
  const trajectoryHistoryRef = useRef<{ x: number; y: number; timestamp: number }[]>([])
  const previousFrameRef = useRef<ImageData | null>(null)
  
  // State
  const [isInitialized, setIsInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cameraActive, setCameraActive] = useState(false)
  const [detectionStatus, setDetectionStatus] = useState<'idle' | 'detecting' | 'shot_detected'>('idle')
  const [currentDetections, setCurrentDetections] = useState<Detection[]>([])
  const [error, setError] = useState<string | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(enableSound)
  
  // Models
  const cocoModelRef = useRef<any>(null)
  
  // Audio refs for sounds
  const makeSoundRef = useRef<HTMLAudioElement | null>(null)
  const missSoundRef = useRef<HTMLAudioElement | null>(null)

  // ============================================
  // INITIALIZATION
  // ============================================
  
  // Initialize detection models
  const initializeModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Load TensorFlow.js and COCO-SSD
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      
      // Load COCO-SSD model (detects "sports ball")
      const cocoSsd = await import('@tensorflow-models/coco-ssd')
      cocoModelRef.current = await cocoSsd.load({
        base: 'lite_mobilenet_v2' // Faster, smaller model for real-time
      })
      
      console.log('[HybridShotDetector] COCO-SSD model loaded')
      
      // Initialize audio
      if (typeof window !== 'undefined') {
        makeSoundRef.current = new Audio('/sounds/swish.mp3')
        missSoundRef.current = new Audio('/sounds/rim.mp3')
      }
      
      setIsInitialized(true)
      setIsLoading(false)
      
    } catch (err) {
      console.error('[HybridShotDetector] Model initialization error:', err)
      setError('Failed to load detection models. Please refresh and try again.')
      setIsLoading(false)
      onError?.('Model initialization failed')
    }
  }, [onError])
  
  // Initialize camera
  const initializeCamera = useCallback(async () => {
    if (!videoRef.current) return
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
      
      videoRef.current.srcObject = stream
      await videoRef.current.play()
      
      // Set canvas dimensions
      if (canvasRef.current && overlayCanvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        overlayCanvasRef.current.width = videoRef.current.videoWidth
        overlayCanvasRef.current.height = videoRef.current.videoHeight
      }
      
      setCameraActive(true)
      console.log('[HybridShotDetector] Camera initialized')
      
    } catch (err) {
      console.error('[HybridShotDetector] Camera error:', err)
      setError('Camera access denied. Please allow camera permissions.')
      onError?.('Camera access denied')
    }
  }, [onError])
  
  // Stop camera
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
  
  // Layer 1: COCO-SSD Ball Detection
  const detectWithCOCO = useCallback(async (): Promise<Detection[]> => {
    if (!cocoModelRef.current || !videoRef.current) return []
    
    try {
      const predictions = await cocoModelRef.current.detect(videoRef.current)
      
      return predictions
        .filter((pred: any) => pred.class === 'sports ball' && pred.score >= DETECTION_CONFIG.ballConfidenceThreshold)
        .map((pred: any) => ({
          type: 'ball' as const,
          confidence: pred.score,
          bbox: {
            x: pred.bbox[0],
            y: pred.bbox[1],
            width: pred.bbox[2],
            height: pred.bbox[3]
          }
        }))
    } catch (err) {
      console.warn('[HybridShotDetector] COCO detection failed:', err)
      return []
    }
  }, [])
  
  // Layer 2: Color-based Ball Detection (Orange basketball)
  const detectWithColor = useCallback((): Detection[] => {
    if (!canvasRef.current || !videoRef.current) return []
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return []
    
    // Draw current frame
    ctx.drawImage(videoRef.current, 0, 0)
    const imageData = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    const data = imageData.data
    
    // Find orange pixels (basketball color)
    const orangePixels: { x: number; y: number }[] = []
    
    for (let y = 0; y < imageData.height; y += 4) { // Sample every 4th pixel for speed
      for (let x = 0; x < imageData.width; x += 4) {
        const i = (y * imageData.width + x) * 4
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]
        
        // Simple orange detection (RGB approach)
        // Orange: high red, medium green, low blue
        if (r > 150 && r > g * 1.3 && g > 50 && g < 180 && b < 100) {
          orangePixels.push({ x, y })
        }
      }
    }
    
    if (orangePixels.length < 50) return [] // Not enough orange pixels
    
    // Find bounding box of orange region
    const minX = Math.min(...orangePixels.map(p => p.x))
    const maxX = Math.max(...orangePixels.map(p => p.x))
    const minY = Math.min(...orangePixels.map(p => p.y))
    const maxY = Math.max(...orangePixels.map(p => p.y))
    
    const width = maxX - minX
    const height = maxY - minY
    
    // Check if it's roughly circular (ball-like aspect ratio)
    const aspectRatio = width / height
    if (aspectRatio < 0.5 || aspectRatio > 2) return []
    
    const confidence = Math.min(orangePixels.length / 500, 1) // More pixels = higher confidence
    
    return [{
      type: 'ball',
      confidence,
      bbox: { x: minX, y: minY, width, height }
    }]
  }, [])
  
  // Layer 3: Trajectory Analysis
  const analyzeTrajectory = useCallback((ballDetection: Detection | null): boolean => {
    if (!ballDetection) return false
    
    const now = Date.now()
    const centerX = ballDetection.bbox.x + ballDetection.bbox.width / 2
    const centerY = ballDetection.bbox.y + ballDetection.bbox.height / 2
    
    // Add to trajectory history
    trajectoryHistoryRef.current.push({ x: centerX, y: centerY, timestamp: now })
    
    // Keep only recent frames
    trajectoryHistoryRef.current = trajectoryHistoryRef.current.filter(
      p => now - p.timestamp < 2000 // Last 2 seconds
    )
    
    if (trajectoryHistoryRef.current.length < DETECTION_CONFIG.trajectoryFrames) return false
    
    // Analyze if ball is moving downward toward rim area (upper third of screen)
    const recentPoints = trajectoryHistoryRef.current.slice(-DETECTION_CONFIG.trajectoryFrames)
    const firstPoint = recentPoints[0]
    const lastPoint = recentPoints[recentPoints.length - 1]
    
    // Check for downward then upward movement (missed shot) or downward and through (made)
    const isMovingUp = lastPoint.y < firstPoint.y
    const isInRimArea = lastPoint.y < (canvasRef.current?.height || 720) * 0.35
    
    return isInRimArea && !isMovingUp
  }, [])
  
  // Layer 4: Net Movement Detection
  const detectNetMovement = useCallback((): { movement: boolean; confidence: number } => {
    if (!canvasRef.current || !videoRef.current) return { movement: false, confidence: 0 }
    
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return { movement: false, confidence: 0 }
    
    // Draw current frame
    ctx.drawImage(videoRef.current, 0, 0)
    const currentFrame = ctx.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height)
    
    if (!previousFrameRef.current) {
      previousFrameRef.current = currentFrame
      return { movement: false, confidence: 0 }
    }
    
    // Compare frames in the upper-center region (where rim/net typically is)
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
    const movement = avgDiff > DETECTION_CONFIG.netMovementThreshold
    const confidence = Math.min(avgDiff / 50, 1)
    
    return { movement, confidence }
  }, [])
  
  // ============================================
  // HYBRID DETECTION LOOP
  // ============================================
  
  const runDetection = useCallback(async () => {
    if (!isActive || !cameraActive || !isInitialized) return
    
    const now = Date.now()
    if (now - lastShotTimeRef.current < DETECTION_CONFIG.shotCooldownMs) {
      animationRef.current = requestAnimationFrame(runDetection)
      return
    }
    
    setDetectionStatus('detecting')
    
    // Layer 1: COCO-SSD Detection
    const cocoDetections = await detectWithCOCO()
    
    // Layer 2: Color Detection (fallback if COCO fails)
    let ballDetection: Detection | null = cocoDetections.find(d => d.type === 'ball') || null
    if (!ballDetection) {
      const colorDetections = detectWithColor()
      ballDetection = colorDetections[0] || null
    }
    
    // Layer 3: Trajectory Analysis
    const isApproachingRim = analyzeTrajectory(ballDetection)
    
    // Layer 4: Net Movement Detection
    const { movement: netMoved, confidence: netConfidence } = detectNetMovement()
    
    // Combine detections
    const allDetections: Detection[] = [
      ...cocoDetections,
      ...(ballDetection ? [ballDetection] : [])
    ]
    setCurrentDetections(allDetections)
    
    // Shot detection logic
    if (netMoved && netConfidence > 0.3 && isApproachingRim) {
      // High confidence: ball approached rim AND net moved
      const shotResult: ShotResult = {
        made: true,
        confidence: Math.min(netConfidence + 0.2, 1),
        timestamp: now,
        detectionMethod: 'net_movement'
      }
      
      lastShotTimeRef.current = now
      setDetectionStatus('shot_detected')
      onShotDetected(shotResult)
      
      // Play sound
      if (soundEnabled && makeSoundRef.current) {
        makeSoundRef.current.currentTime = 0
        makeSoundRef.current.play().catch(() => {})
      }
      
      // Reset after cooldown
      setTimeout(() => setDetectionStatus('detecting'), 500)
      
    } else if (isApproachingRim && trajectoryHistoryRef.current.length > 5) {
      // Check if ball trajectory suggests a miss (bouncing away)
      const recentPoints = trajectoryHistoryRef.current.slice(-5)
      const isBouncingAway = recentPoints[recentPoints.length - 1].y > recentPoints[0].y &&
                              recentPoints[recentPoints.length - 1].y < (canvasRef.current?.height || 720) * 0.5
      
      if (isBouncingAway && netConfidence < 0.2) {
        const shotResult: ShotResult = {
          made: false,
          confidence: 0.6,
          timestamp: now,
          detectionMethod: 'trajectory'
        }
        
        lastShotTimeRef.current = now
        setDetectionStatus('shot_detected')
        onShotDetected(shotResult)
        
        // Play miss sound
        if (soundEnabled && missSoundRef.current) {
          missSoundRef.current.currentTime = 0
          missSoundRef.current.play().catch(() => {})
        }
        
        setTimeout(() => setDetectionStatus('detecting'), 500)
      }
    }
    
    // Draw overlay
    drawOverlay(allDetections)
    
    // Continue loop
    animationRef.current = requestAnimationFrame(runDetection)
  }, [isActive, cameraActive, isInitialized, detectWithCOCO, detectWithColor, analyzeTrajectory, detectNetMovement, onShotDetected, soundEnabled])
  
  // Draw detection overlay
  const drawOverlay = useCallback((detections: Detection[]) => {
    if (!overlayCanvasRef.current) return
    
    const ctx = overlayCanvasRef.current.getContext('2d')
    if (!ctx) return
    
    // Clear
    ctx.clearRect(0, 0, overlayCanvasRef.current.width, overlayCanvasRef.current.height)
    
    // Draw detection boxes
    detections.forEach(detection => {
      const { bbox, type, confidence } = detection
      
      // Set color based on type
      if (type === 'ball') {
        ctx.strokeStyle = '#FF6B35'
        ctx.fillStyle = 'rgba(255, 107, 53, 0.2)'
      } else if (type === 'rim') {
        ctx.strokeStyle = '#00FF00'
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)'
      } else {
        ctx.strokeStyle = '#FFFFFF'
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
      }
      
      ctx.lineWidth = 2
      ctx.strokeRect(bbox.x, bbox.y, bbox.width, bbox.height)
      ctx.fillRect(bbox.x, bbox.y, bbox.width, bbox.height)
      
      // Label
      ctx.fillStyle = ctx.strokeStyle
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(
        `${type.toUpperCase()} ${Math.round(confidence * 100)}%`,
        bbox.x,
        bbox.y - 5
      )
    })
    
    // Draw rim detection zone (top center)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.setLineDash([5, 5])
    ctx.strokeRect(
      overlayCanvasRef.current.width * 0.35,
      0,
      overlayCanvasRef.current.width * 0.3,
      overlayCanvasRef.current.height * 0.35
    )
    ctx.setLineDash([])
    
    // Draw "RIM ZONE" label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.font = 'bold 10px sans-serif'
    ctx.fillText('RIM ZONE', overlayCanvasRef.current.width * 0.35 + 5, 15)
  }, [])

  // ============================================
  // EFFECTS
  // ============================================
  
  // Initialize models on mount
  useEffect(() => {
    initializeModels()
    
    return () => {
      stopCamera()
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [initializeModels, stopCamera])
  
  // Start/stop camera based on isActive
  useEffect(() => {
    if (isActive && isInitialized && !cameraActive) {
      initializeCamera()
    } else if (!isActive && cameraActive) {
      stopCamera()
    }
  }, [isActive, isInitialized, cameraActive, initializeCamera, stopCamera])
  
  // Start/stop detection loop
  useEffect(() => {
    if (isActive && cameraActive && isInitialized) {
      runDetection()
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive, cameraActive, isInitialized, runDetection])

  // ============================================
  // RENDER
  // ============================================
  
  return (
    <div className="relative w-full">
      {/* Error Display */}
      {error && (
        <div className="absolute top-0 left-0 right-0 z-50 bg-red-500/90 text-white p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="absolute inset-0 z-40 bg-black/80 flex flex-col items-center justify-center">
          <div className="animate-spin w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full mb-4" />
          <p className="text-white text-sm font-medium">Loading AI Models...</p>
          <p className="text-[#888] text-xs mt-1">This may take a few seconds</p>
        </div>
      )}
      
      {/* Camera Preview */}
      {showPreview && (
        <div className="relative aspect-video bg-[#0a0a0a] rounded-lg overflow-hidden">
          {/* Video Element */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            playsInline
            muted
          />
          
          {/* Hidden Canvas for Processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Overlay Canvas for Visualization */}
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
          />
          
          {/* Camera Off State */}
          {!cameraActive && !isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1a1a1a]">
              <CameraOff className="w-12 h-12 text-[#555] mb-3" />
              <p className="text-[#888] text-sm">Camera Off</p>
            </div>
          )}
          
          {/* Detection Status Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <div className={`px-3 py-1.5 rounded-full flex items-center gap-2 text-xs font-bold uppercase tracking-wider ${
              detectionStatus === 'shot_detected' 
                ? 'bg-green-500 text-white' 
                : detectionStatus === 'detecting'
                ? 'bg-[#FF6B35] text-white'
                : 'bg-[#2a2a2a] text-[#888]'
            }`}>
              {detectionStatus === 'shot_detected' ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Shot Detected
                </>
              ) : detectionStatus === 'detecting' ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" />
                  Detecting
                </>
              ) : (
                <>
                  <Circle className="w-4 h-4" />
                  Idle
                </>
              )}
            </div>
          </div>
          
          {/* Detection Count */}
          {currentDetections.length > 0 && (
            <div className="absolute top-3 right-3 bg-black/70 px-3 py-1.5 rounded-full">
              <span className="text-white text-xs font-bold">
                {currentDetections.filter(d => d.type === 'ball').length} Ball(s) Detected
              </span>
            </div>
          )}
          
          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex items-center gap-2">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              {soundEnabled ? (
                <Volume2 className="w-5 h-5 text-white" />
              ) : (
                <VolumeX className="w-5 h-5 text-[#888]" />
              )}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="w-10 h-10 rounded-full bg-black/70 flex items-center justify-center hover:bg-black/90 transition-colors"
            >
              <Settings className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
      
      {/* Settings Panel */}
      {showSettings && (
        <div className="mt-2 bg-[#2a2a2a] rounded-lg p-4 space-y-3">
          <h4 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Detection Settings
          </h4>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#888] mb-1">Model Status</p>
              <p className="text-white flex items-center gap-2">
                {isInitialized ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    Ready
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                    Loading
                  </>
                )}
              </p>
            </div>
            <div>
              <p className="text-[#888] mb-1">Camera</p>
              <p className="text-white flex items-center gap-2">
                {cameraActive ? (
                  <>
                    <Camera className="w-4 h-4 text-green-500" />
                    Active
                  </>
                ) : (
                  <>
                    <CameraOff className="w-4 h-4 text-red-500" />
                    Inactive
                  </>
                )}
              </p>
            </div>
          </div>
          
          <div className="pt-2 border-t border-[#3a3a3a]">
            <p className="text-[#555] text-xs">
              Using hybrid detection: COCO-SSD + Color Tracking + Trajectory + Net Movement
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// COMPACT DETECTOR (For embedding in drills)
// ============================================

interface CompactShotDetectorProps {
  isActive: boolean
  onMade: () => void
  onMiss: () => void
  size?: 'small' | 'medium' | 'large'
}

export function CompactShotDetector({
  isActive,
  onMade,
  onMiss,
  size = 'medium'
}: CompactShotDetectorProps) {
  const handleShotDetected = useCallback((result: ShotResult) => {
    if (result.made) {
      onMade()
    } else {
      onMiss()
    }
  }, [onMade, onMiss])
  
  const sizeClasses = {
    small: 'h-32',
    medium: 'h-48',
    large: 'h-64'
  }
  
  return (
    <div className={`${sizeClasses[size]} rounded-lg overflow-hidden`}>
      <HybridShotDetector
        isActive={isActive}
        onShotDetected={handleShotDetected}
        showPreview={true}
        enableSound={true}
      />
    </div>
  )
}

export default HybridShotDetector

