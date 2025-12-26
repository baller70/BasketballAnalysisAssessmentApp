/**
 * @file GSAPVideoPlayer.tsx
 * @description GSAP-powered 3-stage video player for basketball shooting analysis
 * 
 * PURPOSE:
 * - Provides a professional video playback experience with 3 stages
 * - Stage 1: Full-speed playback with skeleton overlay
 * - Stage 2: Interactive label tutorial with zoom effects
 * - Stage 3: Slow-motion finale (0.25x speed)
 * - Includes video recording/download capability
 * 
 * FEATURES:
 * - Single-click plays entire 3-stage sequence automatically
 * - GSAP Timeline for smooth, professional animations
 * - Zoom effects centered on labels and keypoints
 * - Video download using MediaRecorder API
 * - Fullscreen support
 * 
 * USED BY:
 * - src/app/results/demo/page.tsx - Video mode results display
 * 
 * DEPENDENCIES:
 * - gsap - Animation library
 * - @gsap/react - React integration
 */
"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import gsap from "gsap"
import { useGSAP } from "@gsap/react"
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Download, RotateCcw, Film, Loader2, ChevronDown } from "lucide-react"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP)
}

// Watermark configuration - SHOTIQ branding - Good size - TOP RIGHT OF IMAGE
// Logo image is 1536x1024, visible content at (272,367) to (1241,645) = 969x278 (3.5:1)
const WATERMARK_CONFIG = {
  opacity: 1.0,
  padding: 10,
  widthPercent: 0.3, // 30% of image/canvas width - good size
  aspectRatio: 3.5, // Width / Height ratio
  position: 'top-right' as const,
  logoUrl: '/images/shotiq-logo.png',
  // Source crop rectangle (visible content bounds)
  srcX: 272, srcY: 367, srcW: 969, srcH: 278,
}

// ============================================
// TYPES
// ============================================

interface Keypoint {
  x: number
  y: number
  confidence?: number
}

interface VideoPhase {
  phase: string
  frame: number
  timestamp: number
}

interface FrameData {
  phase?: string
  timestamp?: number
  metrics?: Record<string, number>
  keypoints?: Record<string, Keypoint>
  ball?: { x: number; y: number; radius?: number }
}

interface VideoData {
  annotatedFramesBase64?: string[]
  rawFramesBase64?: string[]
  fps?: number
  phases?: VideoPhase[]
  frameData?: FrameData[]
  allKeypoints?: Record<string, Keypoint>[]
}

interface AnnotationLabel {
  label: string
  keypointName: string
  angleKey: string
}

interface OverlayToggles {
  skeleton: boolean
  joints: boolean
  annotations: boolean
  basketball: boolean
}

interface GSAPVideoPlayerProps {
  videoData: VideoData | null
  className?: string
  // External overlay controls
  externalOverlayToggles?: OverlayToggles
}

type SequencePhase = "initial" | "stage1" | "stage2" | "stage3" | "complete"

// ============================================
// CONSTANTS
// ============================================

const DEFAULT_FPS = 10
const STAGE3_SPEED_MULTIPLIER = 4 // 4x slower = 0.25x speed
const ZOOM_SCALE_LABEL = 2.5
const ZOOM_SCALE_KEYPOINT = 3.0
const ZOOM_DURATION = 0.8 // seconds
const LABEL_DISPLAY_DURATION = 1 // seconds
const ZOOM_HOLD_DURATION = 2 // seconds

// ============================================
// COMPONENT
// ============================================

export function GSAPVideoPlayer({ videoData, className = "", externalOverlayToggles }: GSAPVideoPlayerProps) {
  // Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordedChunksRef = useRef<Blob[]>([])
  
  // State
  const [currentFrame, setCurrentFrame] = useState(0)
  const [sequencePhase, setSequencePhase] = useState<SequencePhase>("initial")
  const [isPlaying, setIsPlaying] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [currentAnnotationIndex, setCurrentAnnotationIndex] = useState(0)
  const [zoomState, setZoomState] = useState({ scale: 1, originX: 50, originY: 50 })
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [showDownloadMenu, setShowDownloadMenu] = useState(false)
  const [downloadingStage, setDownloadingStage] = useState<string | null>(null)
  const [internalOverlayToggles, setInternalOverlayToggles] = useState<OverlayToggles>({
    skeleton: true,
    joints: true,
    annotations: false,
    basketball: true
  })
  
  // Preload the SHOTIQ logo image for watermark
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null)
  
  useEffect(() => {
    const img = new Image()
    img.onload = () => setLogoImage(img)
    img.onerror = () => console.error('Failed to load SHOTIQ logo')
    img.src = WATERMARK_CONFIG.logoUrl
  }, [])
  
  // Use external toggles if provided, otherwise use internal state
  const overlayToggles = externalOverlayToggles || internalOverlayToggles
  const setOverlayToggles = setInternalOverlayToggles
  
  // ACTUAL canvas dimensions - set when first frame loads
  const [canvasDimensions, setCanvasDimensions] = useState({ width: 640, height: 480 })
  
  // Derived values
  const totalFrames = videoData?.annotatedFramesBase64?.length || 0
  const fps = videoData?.fps || DEFAULT_FPS
  const frameDuration = 1000 / fps
  
  // DEBUG: Log the incoming videoData structure on mount
  useEffect(() => {
    console.log("🎬 GSAPVideoPlayer - videoData received:")
    console.log("  - annotatedFramesBase64:", videoData?.annotatedFramesBase64?.length || 0, "frames")
    console.log("  - allKeypoints:", videoData?.allKeypoints?.length || 0, "frames of keypoints")
    console.log("  - frameData:", videoData?.frameData?.length || 0, "frames of data")
    console.log("  - phases:", videoData?.phases)
    
    if (videoData?.allKeypoints && videoData.allKeypoints.length > 0) {
      const sampleFrame = Math.min(10, videoData.allKeypoints.length - 1)
      console.log(`  - Sample keypoints (frame ${sampleFrame}):`, videoData.allKeypoints[sampleFrame])
    } else if (videoData?.frameData && videoData.frameData.length > 0) {
      const sampleFrame = Math.min(10, videoData.frameData.length - 1)
      const fd = videoData.frameData[sampleFrame] as FrameData
      console.log(`  - Sample frameData keypoints (frame ${sampleFrame}):`, fd?.keypoints)
    } else {
      console.log("  ⚠️ NO KEYPOINTS FOUND in videoData!")
    }
  }, [videoData])
  
  // Load first frame on mount to get canvas dimensions
  useEffect(() => {
    if (!videoData?.annotatedFramesBase64?.[0]) return
    
    const img = new Image()
    img.onload = () => {
      console.log(`📐 Initial canvas dimensions: ${img.width} x ${img.height}`)
      setCanvasDimensions({ width: img.width, height: img.height })
      
      // Also draw the first frame
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")
        if (ctx) {
          canvasRef.current.width = img.width
          canvasRef.current.height = img.height
          ctx.drawImage(img, 0, 0)
        }
      }
    }
    img.src = `data:image/jpeg;base64,${videoData.annotatedFramesBase64[0]}`
  }, [videoData?.annotatedFramesBase64])
  
  // Calculate release frame (middle of video or marked release phase)
  const releaseFrameIndex = useMemo(() => {
    if (!videoData) return 0
    const releasePhase = videoData.phases?.find(p => 
      p.phase === "Release" || p.phase === "RELEASE"
    )
    return releasePhase?.frame ?? Math.floor(totalFrames / 2)
  }, [videoData, totalFrames])
  
  // Build annotation labels from video data
  const annotationLabels = useMemo((): AnnotationLabel[] => {
    if (!videoData) return []
    
    const keypoints = videoData.allKeypoints?.[releaseFrameIndex] || 
      (videoData.frameData?.[releaseFrameIndex] as FrameData)?.keypoints
    
    if (!keypoints) {
      return [
        { label: "ELBOW ANGLE", keypointName: "right_elbow", angleKey: "elbow_angle" },
        { label: "KNEE BEND", keypointName: "right_knee", angleKey: "knee_angle" },
        { label: "SHOULDER", keypointName: "right_shoulder", angleKey: "shoulder_tilt" },
        { label: "HIP ALIGN", keypointName: "right_hip", angleKey: "hip_tilt" },
      ]
    }
    
    const labels: AnnotationLabel[] = []
    
    if (keypoints["right_elbow"] || keypoints["left_elbow"]) {
      labels.push({ 
        label: "ELBOW ANGLE", 
        keypointName: keypoints["right_elbow"] ? "right_elbow" : "left_elbow", 
        angleKey: "elbow_angle" 
      })
    }
    if (keypoints["right_knee"] || keypoints["left_knee"]) {
      labels.push({ 
        label: "KNEE BEND", 
        keypointName: keypoints["right_knee"] ? "right_knee" : "left_knee", 
        angleKey: "knee_angle" 
      })
    }
    if (keypoints["right_shoulder"] || keypoints["left_shoulder"]) {
      labels.push({ 
        label: "SHOULDER", 
        keypointName: keypoints["right_shoulder"] ? "right_shoulder" : "left_shoulder", 
        angleKey: "shoulder_tilt" 
      })
    }
    if (keypoints["right_hip"] || keypoints["left_hip"]) {
      labels.push({ 
        label: "HIP ALIGN", 
        keypointName: keypoints["right_hip"] ? "right_hip" : "left_hip", 
        angleKey: "hip_tilt" 
      })
    }
    
    return labels.length > 0 ? labels : [
      { label: "ELBOW ANGLE", keypointName: "right_elbow", angleKey: "elbow_angle" },
      { label: "KNEE BEND", keypointName: "right_knee", angleKey: "knee_angle" },
      { label: "SHOULDER", keypointName: "right_shoulder", angleKey: "shoulder_tilt" },
      { label: "HIP ALIGN", keypointName: "right_hip", angleKey: "hip_tilt" },
    ]
  }, [videoData, releaseFrameIndex])
  
  // ============================================
  // CANVAS DRAWING
  // ============================================
  
  // Helper function to draw SHOTIQ watermark on canvas (for preview and export)
  // Logo content is 969x278 (3.5:1 ratio) - Good size TOP RIGHT - CROPPED to visible content
  const drawWatermark = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number
  ) => {
    if (!logoImage) return
    
    const { opacity, padding, widthPercent, aspectRatio, srcX, srcY, srcW, srcH } = WATERMARK_CONFIG
    
    // 30% of canvas width, minimum 120px
    const width = Math.max(canvasWidth * widthPercent, 120)
    const height = width / aspectRatio
    
    // Position in TOP-RIGHT corner of the video/image
    const x = canvasWidth - width - padding
    const y = padding
    
    ctx.save()
    
    // Semi-transparent dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(x - 6, y - 6, width + 12, height + 12)
    
    ctx.globalAlpha = opacity
    // Draw ONLY the visible content (cropped from source)
    ctx.drawImage(logoImage, srcX, srcY, srcW, srcH, x, y, width, height)
    
    ctx.restore()
  }
  
  const drawFrame = useCallback((frameIndex: number) => {
    if (!canvasRef.current || !videoData?.annotatedFramesBase64) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const frameBase64 = videoData.annotatedFramesBase64[frameIndex]
    if (!frameBase64) return
    
    const img = new Image()
    img.onload = () => {
      // Set canvas size to match image
      canvas.width = img.width
      canvas.height = img.height
      
      // Store actual canvas dimensions
      if (canvasDimensions.width !== img.width || canvasDimensions.height !== img.height) {
        console.log(`📐 Canvas dimensions: ${img.width} x ${img.height}`)
        setCanvasDimensions({ width: img.width, height: img.height })
      }
      
      // Draw the annotated frame
      ctx.drawImage(img, 0, 0)
      
      // Draw additional overlays if needed
      const keypoints = videoData.allKeypoints?.[frameIndex] || 
        (videoData.frameData?.[frameIndex] as FrameData)?.keypoints
      
      if (overlayToggles.skeleton && keypoints) {
        drawSkeleton(ctx, keypoints, frameIndex)
      }
      
      if (overlayToggles.joints && keypoints) {
        drawJoints(ctx, keypoints, frameIndex)
      }
      
      if (overlayToggles.annotations && sequencePhase === "stage2") {
        const label = annotationLabels[currentAnnotationIndex]
        if (label && keypoints) {
          drawAnnotationLabel(ctx, label, keypoints, currentAnnotationIndex)
        }
      }
      
      const ball = videoData.frameData?.[frameIndex]?.ball
      if (overlayToggles.basketball && ball) {
        drawBasketball(ctx, ball)
      }
      
      // Always draw SHOTIQ watermark on preview
      drawWatermark(ctx, canvas.width)
    }
    img.src = `data:image/jpeg;base64,${frameBase64}`
  }, [videoData, overlayToggles, sequencePhase, currentAnnotationIndex, annotationLabels])
  
  // Draw frame with ALL labels (for Stage 3 - labels move with player)
  const drawFrameWithAllLabels = useCallback((frameIndex: number) => {
    if (!canvasRef.current || !videoData?.annotatedFramesBase64) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    const frameBase64 = videoData.annotatedFramesBase64[frameIndex]
    if (!frameBase64) return
    
    const img = new Image()
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      // Draw the annotated frame
      ctx.drawImage(img, 0, 0)
      
      // Get keypoints for THIS frame (they move with the player)
      const keypoints = videoData.allKeypoints?.[frameIndex] || 
        (videoData.frameData?.[frameIndex] as FrameData)?.keypoints
      
      if (overlayToggles.skeleton && keypoints) {
        drawSkeleton(ctx, keypoints, frameIndex)
      }
      
      if (overlayToggles.joints && keypoints) {
        drawJoints(ctx, keypoints, frameIndex)
      }
      
      // Draw ALL labels - they will move with the keypoints
      // Pass frameIndex so angle values update as player moves
      if (keypoints) {
        annotationLabels.forEach((label, idx) => {
          drawAnnotationLabel(ctx, label, keypoints, idx, frameIndex)
        })
      }
      
      const ball = videoData.frameData?.[frameIndex]?.ball
      if (overlayToggles.basketball && ball) {
        drawBasketball(ctx, ball)
      }
      
      // Always draw SHOTIQ watermark on preview
      drawWatermark(ctx, canvas.width)
    }
    img.src = `data:image/jpeg;base64,${frameBase64}`
  }, [videoData, overlayToggles, annotationLabels])
  
  // Draw skeleton connections - VIDEO GAME STYLE with status colors
  // GREEN = good, YELLOW = warning, RED = problem
  const drawSkeleton = (ctx: CanvasRenderingContext2D, keypoints: Record<string, Keypoint>, frameIndex?: number) => {
    const connections = [
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_shoulder", "right_elbow"],
      ["right_elbow", "right_wrist"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["left_knee", "left_ankle"],
      ["right_hip", "right_knee"],
      ["right_knee", "right_ankle"],
    ]
    
    // Get current frame metrics to determine status
    const frameData = videoData?.frameData?.[frameIndex ?? currentFrame]
    const metrics = frameData?.metrics || {}
    const elbowAngle = metrics.elbow_angle || metrics.right_elbow_angle || metrics.left_elbow_angle
    const kneeAngle = metrics.knee_angle || metrics.right_knee_angle || metrics.left_knee_angle
    
    // Status colors: GREEN = good, YELLOW = warning, RED = problem
    const STATUS_COLORS = {
      good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },      // Green
      warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' },   // Yellow
      problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }    // Red
    }
    
    // Determine status based on body part and angle measurements
    const getConnectionStatus = (start: string, end: string): 'good' | 'warning' | 'problem' => {
      // Elbow connections
      if (start.includes('elbow') || end.includes('elbow') || start.includes('wrist') || end.includes('wrist')) {
        if (elbowAngle) {
          if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
          if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
          return 'problem'
        }
        return 'good' // Default if no angle data
      }
      // Knee connections
      if (start.includes('knee') || end.includes('knee') || start.includes('ankle') || end.includes('ankle')) {
        if (kneeAngle) {
          if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
          if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      // Default for torso/shoulders
      return 'good'
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    connections.forEach(([from, to]) => {
      const kpFrom = keypoints[from]
      const kpTo = keypoints[to]
      if (kpFrom && kpTo && kpFrom.x > 0 && kpTo.x > 0) {
        const status = getConnectionStatus(from, to)
        const colors = STATUS_COLORS[status]
        
        // Outer glow layer (thickest, most transparent)
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 14
        ctx.shadowColor = colors.main
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Middle glow layer
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 8
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Main line (solid color)
        ctx.strokeStyle = colors.main
        ctx.lineWidth = 5
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Inner bright core
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
      }
    })
    ctx.shadowBlur = 0
  }
  
  // Draw joint circles - VIDEO GAME STYLE with status colors
  // GREEN = good, YELLOW = warning, RED = problem
  const drawJoints = (ctx: CanvasRenderingContext2D, keypoints: Record<string, Keypoint>, frameIndex?: number) => {
    // Get current frame metrics to determine status
    const frameData = videoData?.frameData?.[frameIndex ?? currentFrame]
    const metrics = frameData?.metrics || {}
    const elbowAngle = metrics.elbow_angle || metrics.right_elbow_angle || metrics.left_elbow_angle
    const kneeAngle = metrics.knee_angle || metrics.right_knee_angle || metrics.left_knee_angle
    
    // Status colors: GREEN = good, YELLOW = warning, RED = problem
    const STATUS_COLORS = {
      good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)' },      // Green
      warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.8)' },   // Yellow
      problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' }    // Red
    }
    
    // Determine status based on keypoint name and angle measurements
    const getKeypointStatus = (name: string): 'good' | 'warning' | 'problem' => {
      // Elbow and wrist keypoints
      if (name.includes('elbow') || name.includes('wrist')) {
        if (elbowAngle) {
          if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
          if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      // Knee and ankle keypoints
      if (name.includes('knee') || name.includes('ankle')) {
        if (kneeAngle) {
          if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
          if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      // Default for other keypoints (shoulders, hips, face)
      return 'good'
    }
    
    Object.entries(keypoints).forEach(([name, kp]) => {
      if (kp && kp.x > 0 && kp.y > 0) {
        const status = getKeypointStatus(name)
        const colors = STATUS_COLORS[status]
        const isMainJoint = name.includes('elbow') || name.includes('knee') || name.includes('wrist') || name.includes('shoulder') || name.includes('hip')
        const baseRadius = isMainJoint ? 12 : 8
        
        // Outer glow pulse effect
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius + 6, 0, Math.PI * 2)
        ctx.fillStyle = colors.glow.replace('0.8', '0.2')
        ctx.shadowColor = colors.main
        ctx.shadowBlur = 20
        ctx.fill()
        
        // Outer ring with glow
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = colors.main
        ctx.lineWidth = 2
        ctx.shadowBlur = 12
        ctx.stroke()
        
        // Middle filled circle
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius, 0, Math.PI * 2)
        ctx.fillStyle = colors.main
        ctx.shadowBlur = 8
        ctx.fill()
        
        // Inner dark ring
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius - 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 0
        ctx.stroke()
        
        // Center bright dot (highlight)
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius - 4, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        
        // Tiny reflection for 3D effect
        ctx.beginPath()
        ctx.arc(kp.x - 1.5, kp.y - 1.5, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fill()
      }
    })
    ctx.shadowBlur = 0
  }
  
  // Draw annotation label - MATCHING ORIGINAL VideoFrameCanvas STYLE
  // Label dimensions: 340px wide, 130px tall
  // Font sizes: 28px label, 48px angle, 16px feedback
  const drawAnnotationLabel = (
    ctx: CanvasRenderingContext2D, 
    label: AnnotationLabel, 
    keypoints: Record<string, Keypoint>,
    labelIndex: number = 0,
    frameIndex?: number  // Optional: use current frame's metrics (for Stage 3)
  ) => {
    const kp = keypoints[label.keypointName]
    if (!kp) {
      // Try alternate side
      const altName = label.keypointName.includes("right")
        ? label.keypointName.replace("right", "left")
        : label.keypointName.replace("left", "right")
      const altKp = keypoints[altName]
      if (!altKp) {
        return  // Skip silently if no keypoint found
      }
      // Use the alternate keypoint
      return drawAnnotationLabel(ctx, { ...label, keypointName: altName }, keypoints, labelIndex, frameIndex)
    }
    
    // Get angle value from the appropriate frame's metrics
    const targetFrame = frameIndex !== undefined ? frameIndex : releaseFrameIndex
    const frameData = videoData?.frameData?.[targetFrame]
    const angleValue = frameData?.metrics?.[label.angleKey] || 
                       frameData?.metrics?.['elbow_angle'] || 
                       frameData?.metrics?.['knee_angle'] || 90
    
    // Color mapping based on body part
    const colorMap: Record<string, string> = {
      'right_elbow': '#4ade80',  // Green
      'left_elbow': '#4ade80',
      'right_knee': '#60a5fa',   // Blue
      'left_knee': '#60a5fa',
      'right_shoulder': '#facc15', // Yellow
      'left_shoulder': '#facc15',
      'right_hip': '#f97316',    // Orange
      'left_hip': '#f97316',
    }
    const color = colorMap[label.keypointName] || '#FF6B35'
    
    // Label dimensions - MATCHING ORIGINAL
    const labelWidth = 340
    const labelHeight = 130
    
    // ALTERNATING SIDES - labels close to player, not touching
    const isRightSide = labelIndex % 2 === 0
    const bodyOffset = 150
    
    // Calculate label position
    const canvas = canvasRef.current
    const imgWidth = canvas?.width || 640
    const imgHeight = canvas?.height || 480
    
    const rawX = isRightSide 
      ? kp.x + bodyOffset
      : kp.x - labelWidth - bodyOffset
    
    // Keep within image bounds
    const labelX = Math.max(20, Math.min(imgWidth - labelWidth - 20, rawX))
    const labelY = Math.max(20, Math.min(imgHeight - labelHeight - 20, kp.y - labelHeight / 2))
    
    // Feedback based on angle
    const getFeedback = (value: number): { text: string; status: 'good' | 'warning' | 'bad' } => {
      if (label.angleKey.includes('elbow')) {
        if (value >= 85 && value <= 100) return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
        if (Math.abs(value - 90) <= 15) return { text: value < 85 ? `INCREASE BY ${85 - Math.round(value)}°` : `DECREASE BY ${Math.round(value) - 100}°`, status: 'warning' }
        return { text: value < 85 ? `TOO LOW - NEED ${85 - Math.round(value)}° MORE` : `TOO HIGH - REDUCE ${Math.round(value) - 100}°`, status: 'bad' }
      }
      if (label.angleKey.includes('knee')) {
        if (value >= 135 && value <= 160) return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
        if (Math.abs(value - 145) <= 15) return { text: value < 135 ? `INCREASE BY ${135 - Math.round(value)}°` : `DECREASE BY ${Math.round(value) - 160}°`, status: 'warning' }
        return { text: value < 135 ? `TOO LOW - NEED ${135 - Math.round(value)}° MORE` : `TOO HIGH - REDUCE ${Math.round(value) - 160}°`, status: 'bad' }
      }
      return { text: 'GOOD FORM', status: 'good' }
    }
    
    const feedback = getFeedback(angleValue)
    const feedbackColor = feedback.status === 'good' ? '#4ade80' : feedback.status === 'warning' ? '#facc15' : '#ef4444'
    
    // Draw connecting line with glow
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(labelX + labelWidth / 2, labelY + labelHeight / 2)
    ctx.lineTo(kp.x, kp.y)
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // Draw circle at keypoint
    ctx.beginPath()
    ctx.arc(kp.x, kp.y, 12, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Label background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
    ctx.fill()
    
    // Label border
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
    ctx.stroke()
    
    // Label text - BIG (28px)
    ctx.fillStyle = 'white'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(label.label, labelX + 16, labelY + 36)
    
    // Angle value - BIG (48px)
    ctx.fillStyle = color
    ctx.font = 'bold 48px monospace'
    ctx.fillText(`${Math.round(angleValue)}°`, labelX + 16, labelY + 82)
    
    // Feedback comment
    ctx.fillStyle = feedbackColor
    ctx.font = 'bold 16px system-ui'
    ctx.fillText(feedback.text, labelX + 16, labelY + 115)
  }
  
  // Draw basketball - VIDEO GAME STYLE with glow
  const drawBasketball = (ctx: CanvasRenderingContext2D, ball: { x: number; y: number; radius?: number }) => {
    const radius = ball.radius || 25
    
    // Outer glow
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius + 8, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)'
    ctx.lineWidth = 12
    ctx.shadowColor = '#f97316'
    ctx.shadowBlur = 25
    ctx.stroke()
    
    // Middle glow ring
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius + 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'
    ctx.lineWidth = 6
    ctx.shadowBlur = 15
    ctx.stroke()
    
    // Main circle
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 4
    ctx.shadowBlur = 10
    ctx.stroke()
    
    // Inner bright ring
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius - 3, 0, Math.PI * 2)
    ctx.strokeStyle = '#fb923c'
    ctx.lineWidth = 2
    ctx.shadowBlur = 0
    ctx.stroke()
    
    // Center dot
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#f97316'
    ctx.shadowColor = '#f97316'
    ctx.shadowBlur = 8
    ctx.fill()
    
    // Highlight
    ctx.beginPath()
    ctx.arc(ball.x - 4, ball.y - 4, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.shadowBlur = 0
    ctx.fill()
    
    ctx.shadowBlur = 0
  }
  
  // ============================================
  // GSAP TIMELINE CREATION
  // ============================================
  
  const createMasterTimeline = useCallback(() => {
    if (!videoData?.annotatedFramesBase64?.length) return null
    
    // Kill existing timeline
    if (timelineRef.current) {
      timelineRef.current.kill()
    }
    
    const master = gsap.timeline({
      paused: true,
      onComplete: () => {
        setSequencePhase("complete")
        setIsPlaying(false)
        setOverlayToggles(prev => ({ ...prev, annotations: true }))
      }
    })
    
    // ============================================
    // STAGE 1: Full-Speed Playback
    // ============================================
    const stage1Duration = totalFrames * frameDuration / 1000
    
    master.addLabel("stage1")
    master.call(() => {
      console.log("🎬 STAGE 1: Full Speed Playback")
      setSequencePhase("stage1")
      setOverlayToggles(prev => ({ ...prev, annotations: false }))
    })
    
    // Animate through all frames at normal speed
    master.to({ frame: 0 }, {
      frame: totalFrames - 1,
      duration: stage1Duration,
      ease: "none",
      onUpdate: function() {
        const frame = Math.floor(this.targets()[0].frame)
        setCurrentFrame(frame)
        drawFrame(frame)
      }
    })
    
    // ============================================
    // STAGE 2: Label Tutorial with Zoom
    // ============================================
    master.addLabel("stage2")
    master.call(() => {
      console.log("🏷️ STAGE 2: Label Tutorial")
      console.log(`📐 Using canvas dimensions: ${canvasDimensions.width} x ${canvasDimensions.height}`)
      setSequencePhase("stage2")
      setCurrentFrame(releaseFrameIndex)
      setOverlayToggles(prev => ({ ...prev, annotations: true }))
      
      // Debug: Log all available keypoints
      const kps = videoData.allKeypoints?.[releaseFrameIndex] || 
        (videoData.frameData?.[releaseFrameIndex] as FrameData)?.keypoints
      console.log("📍 Available keypoints at release frame:", kps)
      console.log("📍 Release frame index:", releaseFrameIndex)
    })
    
    // USE ACTUAL CANVAS DIMENSIONS (not hardcoded)
    const canvasWidth = canvasDimensions.width
    const canvasHeight = canvasDimensions.height
    
    // For each annotation label
    annotationLabels.forEach((label, idx) => {
      const keypoints = videoData.allKeypoints?.[releaseFrameIndex] || 
        (videoData.frameData?.[releaseFrameIndex] as FrameData)?.keypoints
      
      let kp = keypoints?.[label.keypointName]
      let usedKeypointName = label.keypointName
      
      if (!kp) {
        // Try alternate side
        const altName = label.keypointName.includes("right")
          ? label.keypointName.replace("right", "left")
          : label.keypointName.replace("left", "right")
        kp = keypoints?.[altName]
        if (kp) usedKeypointName = altName
      }
      
      // Log the keypoint we found with ACTUAL pixel values
      console.log(`🎯 Label "${label.label}" -> Keypoint "${usedKeypointName}":`, kp)
      console.log(`   Canvas size: ${canvasWidth} x ${canvasHeight}`)
      
      // Keypoints from hybrid system are in PIXEL coordinates
      // We need to convert to PERCENTAGE for CSS transform-origin
      let keypointX: number  // percentage (0-100)
      let keypointY: number  // percentage (0-100)
      let keypointPixelX: number  // actual pixel position
      let keypointPixelY: number  // actual pixel position
      
      if (kp && kp.x !== undefined && kp.y !== undefined) {
        // Store pixel coordinates
        keypointPixelX = kp.x
        keypointPixelY = kp.y
        
        // Convert to percentage of canvas
        keypointX = (kp.x / canvasWidth) * 100
        keypointY = (kp.y / canvasHeight) * 100
        
        console.log(`   Pixel coords: (${keypointPixelX.toFixed(0)}, ${keypointPixelY.toFixed(0)})`)
        console.log(`   Percentage: (${keypointX.toFixed(1)}%, ${keypointY.toFixed(1)}%)`)
      } else {
        // No keypoint found, default to center
        console.log(`   ⚠️ No keypoint found, defaulting to center`)
        keypointX = 50
        keypointY = 50
        keypointPixelX = canvasWidth / 2
        keypointPixelY = canvasHeight / 2
      }
      
      // Calculate ACTUAL label box position (matching drawAnnotationLabel logic)
      // Label dimensions: 340px wide, 130px tall
      const labelWidth = 340
      const labelHeight = 130
      const bodyOffset = 150
      const isRightSide = idx % 2 === 0  // Alternating sides
      
      // Calculate label position in pixels first
      const rawLabelX = isRightSide 
        ? (kp?.x || canvasWidth/2) + bodyOffset
        : (kp?.x || canvasWidth/2) - labelWidth - bodyOffset
      
      const labelBoxX = Math.max(20, Math.min(canvasWidth - labelWidth - 20, rawLabelX))
      const labelBoxY = Math.max(20, Math.min(canvasHeight - labelHeight - 20, (kp?.y || canvasHeight/2) - labelHeight / 2))
      
      // Convert label CENTER to percentage for zoom target
      const labelCenterX = ((labelBoxX + labelWidth / 2) / canvasWidth) * 100
      const labelCenterY = ((labelBoxY + labelHeight / 2) / canvasHeight) * 100
      
      // Show label first (no zoom yet)
      master.call(() => {
        console.log(`  📍 Showing: ${label.label}`)
        console.log(`     Label box at pixels: (${labelBoxX.toFixed(0)}, ${labelBoxY.toFixed(0)})`)
        console.log(`     Label center %: (${labelCenterX.toFixed(1)}%, ${labelCenterY.toFixed(1)}%)`)
        console.log(`     Keypoint %: (${keypointX.toFixed(1)}%, ${keypointY.toFixed(1)}%)`)
        setCurrentAnnotationIndex(idx)
        drawFrame(releaseFrameIndex)
      })
      master.to({}, { duration: LABEL_DISPLAY_DURATION })
      
      // STEP 1: Zoom to LABEL first (the text box)
      master.call(() => {
        console.log(`  🔍 Zooming to LABEL at (${labelCenterX.toFixed(1)}%, ${labelCenterY.toFixed(1)}%)`)
      })
      master.to(zoomState, {
        scale: ZOOM_SCALE_LABEL,
        originX: labelCenterX,
        originY: labelCenterY,
        duration: ZOOM_DURATION,
        ease: "power2.inOut",
        onUpdate: function() {
          setZoomState({
            scale: this.targets()[0].scale,
            originX: this.targets()[0].originX,
            originY: this.targets()[0].originY
          })
        }
      })
      master.to({}, { duration: ZOOM_HOLD_DURATION })
      
      // STEP 2: Zoom to KEYPOINT (the actual body part the label points to)
      master.call(() => {
        console.log(`  🎯 Zooming to KEYPOINT at (${keypointX.toFixed(1)}%, ${keypointY.toFixed(1)}%)`)
      })
      master.to(zoomState, {
        scale: ZOOM_SCALE_KEYPOINT,
        originX: keypointX,
        originY: keypointY,
        duration: ZOOM_DURATION,
        ease: "power2.inOut",
        onUpdate: function() {
          setZoomState({
            scale: this.targets()[0].scale,
            originX: this.targets()[0].originX,
            originY: this.targets()[0].originY
          })
        }
      })
      master.to({}, { duration: ZOOM_HOLD_DURATION })
      
      // STEP 3: Zoom out
      master.to(zoomState, {
        scale: 1,
        originX: 50,
        originY: 50,
        duration: ZOOM_DURATION,
        ease: "power2.inOut",
        onUpdate: function() {
          setZoomState({
            scale: this.targets()[0].scale,
            originX: this.targets()[0].originX,
            originY: this.targets()[0].originY
          })
        }
      })
    })
    
    // ============================================
    // STAGE 3: Slow-Motion Finale WITH LABELS
    // Labels move with the player as they move
    // ============================================
    const stage3Duration = (totalFrames * frameDuration / 1000) * STAGE3_SPEED_MULTIPLIER
    
    master.addLabel("stage3")
    master.call(() => {
      console.log("🐢 STAGE 3: Slow Motion Replay WITH LABELS")
      setSequencePhase("stage3")
      setCurrentFrame(0)
      // TURN ON annotations for Stage 3 - labels will move with player
      setOverlayToggles(prev => ({ ...prev, annotations: true }))
    })
    
    // Animate through all frames at slow speed with labels
    master.to({ frame: 0 }, {
      frame: totalFrames - 1,
      duration: stage3Duration,
      ease: "none",
      onUpdate: function() {
        const frame = Math.floor(this.targets()[0].frame)
        setCurrentFrame(frame)
        drawFrameWithAllLabels(frame)  // Draw with ALL labels moving
      }
    })
    
    return master
  }, [videoData, totalFrames, frameDuration, releaseFrameIndex, annotationLabels, drawFrame, drawFrameWithAllLabels, zoomState, canvasDimensions])
  
  // ============================================
  // PLAYBACK CONTROLS
  // ============================================
  
  const startSequence = useCallback(() => {
    const timeline = createMasterTimeline()
    if (!timeline) return
    
    timelineRef.current = timeline
    setIsPlaying(true)
    setCurrentFrame(0)
    timeline.play()
  }, [createMasterTimeline])
  
  const togglePlayPause = useCallback(() => {
    if (!timelineRef.current) {
      startSequence()
      return
    }
    
    if (isPlaying) {
      timelineRef.current.pause()
      setIsPlaying(false)
    } else {
      timelineRef.current.play()
      setIsPlaying(true)
    }
  }, [isPlaying, startSequence])
  
  const resetSequence = useCallback(() => {
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }
    
    setSequencePhase("initial")
    setIsPlaying(false)
    setCurrentFrame(releaseFrameIndex)
    setCurrentAnnotationIndex(0)
    setZoomState({ scale: 1, originX: 50, originY: 50 })
    setOverlayToggles({
      skeleton: true,
      joints: true,
      annotations: false,
      basketball: true
    })
    
    drawFrame(releaseFrameIndex)
  }, [releaseFrameIndex, drawFrame])
  
  const seekToFrame = useCallback((frame: number) => {
    if (timelineRef.current && isPlaying) {
      timelineRef.current.pause()
      setIsPlaying(false)
    }
    
    setCurrentFrame(frame)
    drawFrame(frame)
  }, [isPlaying, drawFrame])
  
  // ============================================
  // STAGE NAVIGATION - Jump directly to a stage
  // ============================================
  
  const jumpToStage = useCallback((stage: 1 | 2 | 3) => {
    // Stop any playing timeline
    if (timelineRef.current) {
      timelineRef.current.kill()
      timelineRef.current = null
    }
    setIsPlaying(false)
    setZoomState({ scale: 1, originX: 50, originY: 50 })
    
    if (stage === 1) {
      // Stage 1: Full speed playback - start at frame 0
      setSequencePhase("stage1")
      setCurrentFrame(0)
      setOverlayToggles(prev => ({ ...prev, annotations: false }))
      drawFrame(0)
    } else if (stage === 2) {
      // Stage 2: Label tutorial - go to release frame
      setSequencePhase("stage2")
      setCurrentFrame(releaseFrameIndex)
      setCurrentAnnotationIndex(0)
      setOverlayToggles(prev => ({ ...prev, annotations: true }))
      drawFrame(releaseFrameIndex)
    } else if (stage === 3) {
      // Stage 3: Slow motion with all labels - start at frame 0
      setSequencePhase("stage3")
      setCurrentFrame(0)
      setOverlayToggles(prev => ({ ...prev, annotations: true }))
      drawFrameWithAllLabels(0)
    }
  }, [releaseFrameIndex, drawFrame, drawFrameWithAllLabels])
  
  // Play only a specific stage
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const playStage = useCallback((stage: 1 | 2 | 3) => {
    jumpToStage(stage)
    
    // Create a timeline for just this stage
    const stageTl = gsap.timeline({
      onComplete: () => {
        setIsPlaying(false)
        setSequencePhase("complete")
      }
    })
    
    if (stage === 1) {
      // Stage 1: Full speed through all frames
      const duration = totalFrames * frameDuration / 1000
      stageTl.to({ frame: 0 }, {
        frame: totalFrames - 1,
        duration,
        ease: "none",
        onUpdate: function() {
          const frame = Math.floor(this.targets()[0].frame)
          setCurrentFrame(frame)
          drawFrame(frame)
        }
      })
    } else if (stage === 2) {
      // Stage 2: Label tutorial with zoom
      setCurrentFrame(releaseFrameIndex)
      annotationLabels.forEach((label, idx) => {
        stageTl.call(() => {
          setCurrentAnnotationIndex(idx)
          drawFrame(releaseFrameIndex)
        })
        stageTl.to({}, { duration: LABEL_DISPLAY_DURATION + ZOOM_HOLD_DURATION * 2 + ZOOM_DURATION * 3 })
      })
    } else if (stage === 3) {
      // Stage 3: Slow motion with labels
      const duration = (totalFrames * frameDuration / 1000) * STAGE3_SPEED_MULTIPLIER
      stageTl.to({ frame: 0 }, {
        frame: totalFrames - 1,
        duration,
        ease: "none",
        onUpdate: function() {
          const frame = Math.floor(this.targets()[0].frame)
          setCurrentFrame(frame)
          drawFrameWithAllLabels(frame)
        }
      })
    }
    
    timelineRef.current = stageTl
    setIsPlaying(true)
    stageTl.play()
  }, [jumpToStage, totalFrames, frameDuration, releaseFrameIndex, annotationLabels, drawFrame, drawFrameWithAllLabels])
  
  // ============================================
  // INDIVIDUAL STAGE DOWNLOADS
  // ============================================
  
  const downloadStage = useCallback(async (stage: 1 | 2 | 3 | 'all') => {
    if (!videoData?.annotatedFramesBase64?.length || !canvasRef.current) return
    
    setDownloadingStage(stage === 'all' ? 'all' : `stage${stage}`)
    setIsGeneratingVideo(true)
    setGenerationProgress(0)
    setShowDownloadMenu(false)
    
    try {
      const offscreenCanvas = document.createElement('canvas')
      offscreenCanvas.width = canvasDimensions.width
      offscreenCanvas.height = canvasDimensions.height
      const offscreenCtx = offscreenCanvas.getContext('2d')
      
      if (!offscreenCtx) throw new Error('Could not get canvas context')
      
      const stream = offscreenCanvas.captureStream(fps)
      const chunks: Blob[] = []
      
      let mimeType = 'video/webm;codecs=vp9'
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4'
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }
      
      const recordingComplete = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' })
          resolve(blob)
        }
      })
      
      mediaRecorder.start()
      
      const frameDurationMs = 1000 / fps
      const slowMoMultiplier = STAGE3_SPEED_MULTIPLIER
      
      // Helper to render a frame
      const renderFrame = async (frameIdx: number, withLabels: boolean, isSlowMo: boolean = false) => {
        const frameBase64 = videoData.annotatedFramesBase64?.[frameIdx]
        if (!frameBase64) return
        
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
            offscreenCtx.drawImage(img, 0, 0)
            
            const keypoints = videoData.allKeypoints?.[frameIdx] || 
              (videoData.frameData?.[frameIdx] as FrameData)?.keypoints
            
            if (overlayToggles.skeleton && keypoints) {
              drawSkeletonOnContext(offscreenCtx, keypoints, frameIdx)
            }
            if (overlayToggles.joints && keypoints) {
              drawJointsOnContext(offscreenCtx, keypoints, frameIdx)
            }
            const ball = videoData.frameData?.[frameIdx]?.ball
            if (overlayToggles.basketball && ball) {
              drawBasketballOnContext(offscreenCtx, ball)
            }
            if (withLabels && overlayToggles.annotations && keypoints) {
              annotationLabels.forEach((label, idx) => {
                drawAnnotationLabelOnContext(offscreenCtx, label, keypoints, idx, frameIdx, offscreenCanvas.width, offscreenCanvas.height)
              })
            }
            
            // Always draw watermark last (on top of everything)
            drawWatermarkOnContext(offscreenCtx, offscreenCanvas.width)
            
            resolve()
          }
          img.src = `data:image/jpeg;base64,${frameBase64}`
        })
        
        // Wait for frame duration (longer for slow-mo)
        const waitTime = isSlowMo ? frameDurationMs * slowMoMultiplier : frameDurationMs
        await new Promise(r => setTimeout(r, waitTime))
      }
      
      let totalSteps = 0
      let currentStep = 0
      
      // Calculate total steps based on what we're downloading
      if (stage === 1 || stage === 'all') totalSteps += totalFrames
      if (stage === 2 || stage === 'all') totalSteps += annotationLabels.length * 10 // ~10 frames per label
      if (stage === 3 || stage === 'all') totalSteps += totalFrames
      
      // STAGE 1: Full speed playback
      if (stage === 1 || stage === 'all') {
        for (let i = 0; i < totalFrames; i++) {
          await renderFrame(i, false, false)
          currentStep++
          setGenerationProgress(Math.round((currentStep / totalSteps) * 100))
        }
      }
      
      // STAGE 2: Label tutorial (static release frame with labels appearing)
      if (stage === 2 || stage === 'all') {
        for (let labelIdx = 0; labelIdx < annotationLabels.length; labelIdx++) {
          // Render release frame with current label highlighted
          for (let f = 0; f < 10; f++) { // ~10 frames per label for visibility
            const frameBase64 = videoData.annotatedFramesBase64[releaseFrameIndex]
            if (frameBase64) {
              await new Promise<void>((resolve) => {
                const img = new Image()
                img.onload = () => {
                  offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
                  offscreenCtx.drawImage(img, 0, 0)
                  
                  const keypoints = videoData.allKeypoints?.[releaseFrameIndex] || 
                    (videoData.frameData?.[releaseFrameIndex] as FrameData)?.keypoints
                  
                  if (overlayToggles.skeleton && keypoints) {
                    drawSkeletonOnContext(offscreenCtx, keypoints, releaseFrameIndex)
                  }
                  if (overlayToggles.joints && keypoints) {
                    drawJointsOnContext(offscreenCtx, keypoints, releaseFrameIndex)
                  }
                  const ball = videoData.frameData?.[releaseFrameIndex]?.ball
                  if (overlayToggles.basketball && ball) {
                    drawBasketballOnContext(offscreenCtx, ball)
                  }
                  // Draw labels up to current index
                  if (overlayToggles.annotations && keypoints) {
                    for (let li = 0; li <= labelIdx; li++) {
                      drawAnnotationLabelOnContext(offscreenCtx, annotationLabels[li], keypoints, li, releaseFrameIndex, offscreenCanvas.width, offscreenCanvas.height)
                    }
                  }
                  
                  // Always draw watermark last (on top of everything)
                  drawWatermarkOnContext(offscreenCtx, offscreenCanvas.width)
                  
                  resolve()
                }
                img.src = `data:image/jpeg;base64,${frameBase64}`
              })
              await new Promise(r => setTimeout(r, frameDurationMs * 3)) // Slower for readability
            }
            currentStep++
            setGenerationProgress(Math.round((currentStep / totalSteps) * 100))
          }
        }
      }
      
      // STAGE 3: Slow motion with all labels
      if (stage === 3 || stage === 'all') {
        for (let i = 0; i < totalFrames; i++) {
          await renderFrame(i, true, true)
          currentStep++
          setGenerationProgress(Math.round((currentStep / totalSteps) * 100))
        }
      }
      
      mediaRecorder.stop()
      const videoBlob = await recordingComplete
      
      const stageNames = { 1: 'stage1-fullspeed', 2: 'stage2-labels', 3: 'stage3-slowmo', 'all': 'full-analysis' }
      const url = URL.createObjectURL(videoBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `basketball-${stageNames[stage]}-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Failed to generate video.')
    } finally {
      setIsGeneratingVideo(false)
      setGenerationProgress(0)
      setDownloadingStage(null)
    }
  }, [videoData, canvasDimensions, fps, totalFrames, releaseFrameIndex, annotationLabels, overlayToggles])
  
  // ============================================
  // VIDEO RECORDING
  // ============================================
  
  const startRecording = useCallback(() => {
    if (!canvasRef.current) return
    
    recordedChunksRef.current = []
    
    const stream = canvasRef.current.captureStream(fps)
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: "video/webm;codecs=vp9"
    })
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data)
      }
    }
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: "video/webm" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `basketball-analysis-${Date.now()}.webm`
      a.click()
      URL.revokeObjectURL(url)
      setIsRecording(false)
    }
    
    mediaRecorderRef.current = mediaRecorder
    mediaRecorder.start()
    setIsRecording(true)
    
    // Start the sequence
    startSequence()
  }, [fps, startSequence])
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }, [isRecording])
  
  // Auto-stop recording when sequence completes
  useEffect(() => {
    if (sequencePhase === "complete" && isRecording) {
      stopRecording()
    }
  }, [sequencePhase, isRecording, stopRecording])
  
  // ============================================
  // DOWNLOAD FULL VIDEO (MP4)
  // ============================================
  
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const downloadFullVideo = useCallback(async () => {
    if (!videoData?.annotatedFramesBase64?.length || !canvasRef.current) return
    
    setIsGeneratingVideo(true)
    setGenerationProgress(0)
    
    try {
      // Create an offscreen canvas for rendering
      const offscreenCanvas = document.createElement('canvas')
      offscreenCanvas.width = canvasDimensions.width
      offscreenCanvas.height = canvasDimensions.height
      const offscreenCtx = offscreenCanvas.getContext('2d')
      
      if (!offscreenCtx) {
        throw new Error('Could not get canvas context')
      }
      
      // Set up MediaRecorder with the offscreen canvas
      const stream = offscreenCanvas.captureStream(fps)
      const chunks: Blob[] = []
      
      // Try to use MP4 codec if available, fallback to WebM
      let mimeType = 'video/webm;codecs=vp9'
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4'
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
        mimeType = 'video/webm;codecs=h264'
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data)
        }
      }
      
      // Promise to wait for recording to complete
      const recordingComplete = new Promise<Blob>((resolve) => {
        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: mimeType.includes('mp4') ? 'video/mp4' : 'video/webm' })
          resolve(blob)
        }
      })
      
      // Start recording
      mediaRecorder.start()
      
      // Render all frames with annotations
      const frameDurationMs = 1000 / fps
      
      for (let i = 0; i < totalFrames; i++) {
        // Load and draw the frame
        const frameBase64 = videoData.annotatedFramesBase64[i]
        if (!frameBase64) continue
        
        await new Promise<void>((resolve) => {
          const img = new Image()
          img.onload = () => {
            // Clear and draw frame
            offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height)
            offscreenCtx.drawImage(img, 0, 0)
            
            // Get keypoints for this frame
            const keypoints = videoData.allKeypoints?.[i] || 
              (videoData.frameData?.[i] as FrameData)?.keypoints
            
            // Draw skeleton (wireframes) - ONLY if toggle is ON
            if (overlayToggles.skeleton && keypoints) {
              drawSkeletonOnContext(offscreenCtx, keypoints, i)
            }
            
            // Draw joints - ONLY if toggle is ON
            if (overlayToggles.joints && keypoints) {
              drawJointsOnContext(offscreenCtx, keypoints, i)
            }
            
            // Draw basketball - ONLY if toggle is ON
            const ball = videoData.frameData?.[i]?.ball
            if (overlayToggles.basketball && ball) {
              drawBasketballOnContext(offscreenCtx, ball)
            }
            
            // Draw all annotation labels - ONLY if toggle is ON
            if (overlayToggles.annotations && keypoints) {
              annotationLabels.forEach((label, idx) => {
                drawAnnotationLabelOnContext(offscreenCtx, label, keypoints, idx, i, offscreenCanvas.width, offscreenCanvas.height)
              })
            }
            
            // Always draw watermark last (on top of everything)
            drawWatermarkOnContext(offscreenCtx, offscreenCanvas.width)
            
            resolve()
          }
          img.src = `data:image/jpeg;base64,${frameBase64}`
        })
        
        // Wait for frame duration to maintain correct video timing
        await new Promise(r => setTimeout(r, frameDurationMs))
        
        // Update progress
        setGenerationProgress(Math.round(((i + 1) / totalFrames) * 100))
      }
      
      // Stop recording and get the blob
      mediaRecorder.stop()
      const videoBlob = await recordingComplete
      
      // Download the video
      const url = URL.createObjectURL(videoBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `basketball-analysis-${Date.now()}.${mimeType.includes('mp4') ? 'mp4' : 'webm'}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
    } catch (error) {
      console.error('Error generating video:', error)
      alert('Failed to generate video. Please try the screen recording option instead.')
    } finally {
      setIsGeneratingVideo(false)
      setGenerationProgress(0)
    }
  }, [videoData, canvasDimensions, fps, totalFrames, annotationLabels, overlayToggles])
  
  // Helper function to draw skeleton on any canvas context (for video export)
  const drawSkeletonOnContext = (ctx: CanvasRenderingContext2D, keypoints: Record<string, Keypoint>, frameIndex: number) => {
    const connections = [
      ["left_shoulder", "right_shoulder"],
      ["left_shoulder", "left_elbow"],
      ["left_elbow", "left_wrist"],
      ["right_shoulder", "right_elbow"],
      ["right_elbow", "right_wrist"],
      ["left_shoulder", "left_hip"],
      ["right_shoulder", "right_hip"],
      ["left_hip", "right_hip"],
      ["left_hip", "left_knee"],
      ["left_knee", "left_ankle"],
      ["right_hip", "right_knee"],
      ["right_knee", "right_ankle"],
    ]
    
    // Get current frame metrics to determine status
    const frameData = videoData?.frameData?.[frameIndex]
    const metrics = frameData?.metrics || {}
    const elbowAngle = metrics.elbow_angle || metrics.right_elbow_angle || metrics.left_elbow_angle
    const kneeAngle = metrics.knee_angle || metrics.right_knee_angle || metrics.left_knee_angle
    
    // Status colors
    const STATUS_COLORS = {
      good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },
      warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' },
      problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }
    }
    
    const getConnectionStatus = (start: string, end: string): 'good' | 'warning' | 'problem' => {
      if (start.includes('elbow') || end.includes('elbow') || start.includes('wrist') || end.includes('wrist')) {
        if (elbowAngle) {
          if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
          if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      if (start.includes('knee') || end.includes('knee') || start.includes('ankle') || end.includes('ankle')) {
        if (kneeAngle) {
          if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
          if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      return 'good'
    }
    
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    
    connections.forEach(([from, to]) => {
      const kpFrom = keypoints[from]
      const kpTo = keypoints[to]
      if (kpFrom && kpTo && kpFrom.x > 0 && kpTo.x > 0) {
        const status = getConnectionStatus(from, to)
        const colors = STATUS_COLORS[status]
        
        // Outer glow
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 14
        ctx.shadowColor = colors.main
        ctx.shadowBlur = 20
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Middle glow
        ctx.strokeStyle = colors.glow
        ctx.lineWidth = 8
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Main line
        ctx.strokeStyle = colors.main
        ctx.lineWidth = 5
        ctx.shadowBlur = 8
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
        
        // Inner bright core
        ctx.strokeStyle = '#FFFFFF'
        ctx.lineWidth = 2
        ctx.shadowBlur = 0
        ctx.beginPath()
        ctx.moveTo(kpFrom.x, kpFrom.y)
        ctx.lineTo(kpTo.x, kpTo.y)
        ctx.stroke()
      }
    })
    ctx.shadowBlur = 0
  }
  
  // Helper function to draw joints on any canvas context (for video export)
  const drawJointsOnContext = (ctx: CanvasRenderingContext2D, keypoints: Record<string, Keypoint>, frameIndex: number) => {
    const frameData = videoData?.frameData?.[frameIndex]
    const metrics = frameData?.metrics || {}
    const elbowAngle = metrics.elbow_angle || metrics.right_elbow_angle || metrics.left_elbow_angle
    const kneeAngle = metrics.knee_angle || metrics.right_knee_angle || metrics.left_knee_angle
    
    const STATUS_COLORS = {
      good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)' },
      warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.8)' },
      problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' }
    }
    
    const getKeypointStatus = (name: string): 'good' | 'warning' | 'problem' => {
      if (name.includes('elbow') || name.includes('wrist')) {
        if (elbowAngle) {
          if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
          if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      if (name.includes('knee') || name.includes('ankle')) {
        if (kneeAngle) {
          if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
          if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
          return 'problem'
        }
        return 'good'
      }
      return 'good'
    }
    
    Object.entries(keypoints).forEach(([name, kp]) => {
      if (kp && kp.x > 0 && kp.y > 0) {
        const status = getKeypointStatus(name)
        const colors = STATUS_COLORS[status]
        const isMainJoint = name.includes('elbow') || name.includes('knee') || name.includes('wrist') || name.includes('shoulder') || name.includes('hip')
        const baseRadius = isMainJoint ? 12 : 8
        
        // Outer glow
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius + 6, 0, Math.PI * 2)
        ctx.fillStyle = colors.glow.replace('0.8', '0.2')
        ctx.shadowColor = colors.main
        ctx.shadowBlur = 20
        ctx.fill()
        
        // Outer ring
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius + 3, 0, Math.PI * 2)
        ctx.strokeStyle = colors.main
        ctx.lineWidth = 2
        ctx.shadowBlur = 12
        ctx.stroke()
        
        // Middle filled circle
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius, 0, Math.PI * 2)
        ctx.fillStyle = colors.main
        ctx.shadowBlur = 8
        ctx.fill()
        
        // Inner dark ring
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius - 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        ctx.lineWidth = 1.5
        ctx.shadowBlur = 0
        ctx.stroke()
        
        // Center bright dot
        ctx.beginPath()
        ctx.arc(kp.x, kp.y, baseRadius - 4, 0, Math.PI * 2)
        ctx.fillStyle = '#FFFFFF'
        ctx.fill()
        
        // Tiny reflection
        ctx.beginPath()
        ctx.arc(kp.x - 1.5, kp.y - 1.5, 1.5, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
        ctx.fill()
      }
    })
    ctx.shadowBlur = 0
  }
  
  // Helper function to draw basketball on any canvas context (for video export)
  const drawBasketballOnContext = (ctx: CanvasRenderingContext2D, ball: { x: number; y: number; radius?: number }) => {
    const radius = ball.radius || 25
    
    // Outer glow
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius + 8, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.3)'
    ctx.lineWidth = 12
    ctx.shadowColor = '#f97316'
    ctx.shadowBlur = 25
    ctx.stroke()
    
    // Middle glow ring
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius + 3, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.5)'
    ctx.lineWidth = 6
    ctx.shadowBlur = 15
    ctx.stroke()
    
    // Main circle
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius, 0, Math.PI * 2)
    ctx.strokeStyle = '#f97316'
    ctx.lineWidth = 4
    ctx.shadowBlur = 10
    ctx.stroke()
    
    // Inner bright ring
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, radius - 3, 0, Math.PI * 2)
    ctx.strokeStyle = '#fb923c'
    ctx.lineWidth = 2
    ctx.shadowBlur = 0
    ctx.stroke()
    
    // Center dot
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, 6, 0, Math.PI * 2)
    ctx.fillStyle = '#f97316'
    ctx.shadowColor = '#f97316'
    ctx.shadowBlur = 8
    ctx.fill()
    
    // Highlight
    ctx.beginPath()
    ctx.arc(ball.x - 4, ball.y - 4, 3, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
    ctx.shadowBlur = 0
    ctx.fill()
    
    ctx.shadowBlur = 0
  }
  
  // Helper function to draw SHOTIQ watermark on any canvas context
  // Logo content is 969x278 (3.5:1 ratio) - Good size TOP RIGHT - CROPPED to visible content
  const drawWatermarkOnContext = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number
  ) => {
    if (!logoImage) return
    
    const { opacity, padding, widthPercent, aspectRatio, srcX, srcY, srcW, srcH } = WATERMARK_CONFIG
    
    // 30% of canvas width, minimum 120px
    const width = Math.max(canvasWidth * widthPercent, 120)
    const height = width / aspectRatio
    
    // Position in TOP-RIGHT corner of the video/image
    const x = canvasWidth - width - padding
    const y = padding
    
    ctx.save()
    
    // Semi-transparent dark background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(x - 6, y - 6, width + 12, height + 12)
    
    ctx.globalAlpha = opacity
    // Draw ONLY the visible content (cropped from source)
    ctx.drawImage(logoImage, srcX, srcY, srcW, srcH, x, y, width, height)
    
    ctx.restore()
  }
  
  // Helper function to draw annotation label on any canvas context
  const drawAnnotationLabelOnContext = (
    ctx: CanvasRenderingContext2D,
    label: AnnotationLabel,
    keypoints: Record<string, Keypoint>,
    labelIndex: number,
    frameIndex: number,
    canvasWidth: number,
    canvasHeight: number
  ) => {
    let kp = keypoints[label.keypointName]
    if (!kp) {
      const altName = label.keypointName.includes("right")
        ? label.keypointName.replace("right", "left")
        : label.keypointName.replace("left", "right")
      kp = keypoints[altName]
      if (!kp) return
    }
    
    // Get angle value
    const frameData = videoData?.frameData?.[frameIndex]
    const angleValue = frameData?.metrics?.[label.angleKey] || 
                       frameData?.metrics?.['elbow_angle'] || 
                       frameData?.metrics?.['knee_angle'] || 90
    
    // Color mapping
    const colorMap: Record<string, string> = {
      'right_elbow': '#4ade80', 'left_elbow': '#4ade80',
      'right_knee': '#60a5fa', 'left_knee': '#60a5fa',
      'right_shoulder': '#facc15', 'left_shoulder': '#facc15',
      'right_hip': '#f97316', 'left_hip': '#f97316',
    }
    const color = colorMap[label.keypointName] || '#FF6B35'
    
    // Label dimensions
    const labelWidth = 340
    const labelHeight = 130
    const bodyOffset = 150
    const isRightSide = labelIndex % 2 === 0
    
    // Calculate label position
    const rawX = isRightSide ? kp.x + bodyOffset : kp.x - labelWidth - bodyOffset
    const labelX = Math.max(20, Math.min(canvasWidth - labelWidth - 20, rawX))
    const labelY = Math.max(20, Math.min(canvasHeight - labelHeight - 20, kp.y - labelHeight / 2))
    
    // Feedback
    const getFeedback = (value: number): { text: string; status: 'good' | 'warning' | 'bad' } => {
      if (label.angleKey.includes('elbow')) {
        if (value >= 85 && value <= 100) return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
        if (Math.abs(value - 90) <= 15) return { text: value < 85 ? `INCREASE BY ${85 - Math.round(value)}°` : `DECREASE BY ${Math.round(value) - 100}°`, status: 'warning' }
        return { text: value < 85 ? `TOO LOW - NEED ${85 - Math.round(value)}° MORE` : `TOO HIGH - REDUCE ${Math.round(value) - 100}°`, status: 'bad' }
      }
      if (label.angleKey.includes('knee')) {
        if (value >= 135 && value <= 160) return { text: 'EXCELLENT! WITHIN ELITE RANGE', status: 'good' }
        if (Math.abs(value - 145) <= 15) return { text: value < 135 ? `INCREASE BY ${135 - Math.round(value)}°` : `DECREASE BY ${Math.round(value) - 160}°`, status: 'warning' }
        return { text: value < 135 ? `TOO LOW - NEED ${135 - Math.round(value)}° MORE` : `TOO HIGH - REDUCE ${Math.round(value) - 160}°`, status: 'bad' }
      }
      return { text: 'GOOD FORM', status: 'good' }
    }
    
    const feedback = getFeedback(angleValue)
    const feedbackColor = feedback.status === 'good' ? '#4ade80' : feedback.status === 'warning' ? '#facc15' : '#ef4444'
    
    // Draw connecting line
    ctx.strokeStyle = color
    ctx.lineWidth = 3
    ctx.shadowColor = color
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.moveTo(labelX + labelWidth / 2, labelY + labelHeight / 2)
    ctx.lineTo(kp.x, kp.y)
    ctx.stroke()
    ctx.shadowBlur = 0
    
    // Draw circle at keypoint
    ctx.beginPath()
    ctx.arc(kp.x, kp.y, 12, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()
    
    // Label background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
    ctx.fill()
    
    // Label border
    ctx.strokeStyle = color
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.roundRect(labelX, labelY, labelWidth, labelHeight, 14)
    ctx.stroke()
    
    // Label text
    ctx.fillStyle = 'white'
    ctx.font = 'bold 28px system-ui'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(label.label, labelX + 16, labelY + 36)
    
    // Angle value
    ctx.fillStyle = color
    ctx.font = 'bold 48px monospace'
    ctx.fillText(`${Math.round(angleValue)}°`, labelX + 16, labelY + 82)
    
    // Feedback
    ctx.fillStyle = feedbackColor
    ctx.font = 'bold 16px system-ui'
    ctx.fillText(feedback.text, labelX + 16, labelY + 115)
  }
  
  // ============================================
  // FULLSCREEN
  // ============================================
  
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true)
      }).catch(console.error)
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false)
      }).catch(console.error)
    }
  }, [])
  
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])
  
  // ============================================
  // INITIAL DRAW
  // ============================================
  
  useEffect(() => {
    if (videoData?.annotatedFramesBase64?.length) {
      drawFrame(releaseFrameIndex)
    }
  }, [videoData, releaseFrameIndex, drawFrame])
  
  // ============================================
  // RENDER
  // ============================================
  
  if (!videoData || !videoData.annotatedFramesBase64?.length) {
    return (
      <div className={`bg-[#1a1a1a] rounded-xl p-8 text-center ${className}`}>
        <p className="text-[#888]">No video data available</p>
      </div>
    )
  }
  
  const currentTimestamp = currentFrame / fps
  
  return (
    <div className={`bg-[#1a1a1a] rounded-xl overflow-hidden shadow-2xl ${className}`}>
      {/* Header */}
      <div className="text-center py-4 border-b border-[#3a3a3a]">
        <h2 className="text-2xl font-bold text-[#FF6B35] mb-1">SHOOTING FORM ANALYSIS</h2>
        <p className="text-[#888] text-sm mb-3">3-Stage Breakdown: Full Speed → Label Tutorial → Slow Motion</p>
        
        {/* Stage Navigation Buttons */}
        <div className="flex justify-center gap-2">
          <button
            onClick={() => jumpToStage(1)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              sequencePhase === "stage1" 
                ? "bg-[#FF6B35] text-black" 
                : "bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"
            }`}
          >
            Stage 1: Full Speed
          </button>
          <button
            onClick={() => jumpToStage(2)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              sequencePhase === "stage2" 
                ? "bg-[#4ade80] text-black" 
                : "bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"
            }`}
          >
            Stage 2: Labels
          </button>
          <button
            onClick={() => jumpToStage(3)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              sequencePhase === "stage3" 
                ? "bg-[#f97316] text-black" 
                : "bg-[#3a3a3a] text-white hover:bg-[#4a4a4a]"
            }`}
          >
            Stage 3: Slow-Mo
          </button>
        </div>
      </div>
      
      {/* Video Container - fixed height to prevent layout shifts */}
      <div ref={containerRef} className="relative aspect-video bg-black overflow-hidden">
        {/* Canvas wrapper with zoom transform - only this zooms, container stays fixed */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: `scale(${zoomState.scale})`,
            transformOrigin: `${zoomState.originX}% ${zoomState.originY}%`,
            transition: sequencePhase === "stage2" ? "none" : "transform 0.3s ease-out"
          }}
        >
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full"
          />
        </div>
        
        {/* Play button overlay - only show before sequence starts */}
        {sequencePhase === "initial" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <button
              onClick={startSequence}
              className="p-6 rounded-full bg-[#FF6B35] hover:bg-[#E55300] text-black transition-all transform hover:scale-110 shadow-2xl"
            >
              <Play className="w-16 h-16" fill="currentColor" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="bg-black/70 text-[#FF6B35] px-4 py-2 rounded-lg font-semibold">
                Click to Start 3-Stage Analysis
              </span>
            </div>
          </div>
        )}
        
        {/* Stage indicator */}
        {sequencePhase !== "initial" && sequencePhase !== "complete" && (
          <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-lg border border-[#FF6B35]/30">
            <div className="flex items-center gap-2">
              {sequencePhase === "stage1" && (
                <>
                  <div className="w-2 h-2 bg-[#FF6B35] rounded-full animate-pulse" />
                  <span className="text-[#FF6B35] text-sm font-bold">STAGE 1: FULL SPEED</span>
                </>
              )}
              {sequencePhase === "stage2" && (
                <>
                  <div className="w-2 h-2 bg-[#4ade80] rounded-full animate-pulse" />
                  <span className="text-[#4ade80] text-sm font-bold">
                    STAGE 2: {annotationLabels[currentAnnotationIndex]?.label || "ANALYZING"}
                  </span>
                </>
              )}
              {sequencePhase === "stage3" && (
                <>
                  <div className="w-2 h-2 bg-[#f97316] rounded-full animate-pulse" />
                  <span className="text-[#f97316] text-sm font-bold">STAGE 3: SLOW MOTION (0.25x)</span>
                </>
              )}
            </div>
            
            {/* Progress dots for Stage 2 */}
            {sequencePhase === "stage2" && (
              <div className="mt-2 flex gap-1">
                {annotationLabels.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1 flex-1 rounded-full ${
                      idx < currentAnnotationIndex
                        ? "bg-[#4ade80]"
                        : idx === currentAnnotationIndex
                        ? "bg-[#4ade80]/50"
                        : "bg-[#3a3a3a]"
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Completion message */}
        {sequencePhase === "complete" && (
          <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-lg border border-[#4ade80]/50">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-[#4ade80] rounded-full" />
              <span className="text-[#4ade80] text-sm font-bold">ANALYSIS COMPLETE</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Controls */}
      <div className="p-4 bg-[#2a2a2a]">
        {/* Progress Bar */}
        <div className="mb-4 relative">
          {/* Phase markers */}
          <div className="absolute top-0 left-0 right-0 h-2 pointer-events-none z-10">
            {videoData.phases?.map((phase, idx) => {
              const position = totalFrames > 1 ? (phase.frame / (totalFrames - 1)) * 100 : 0
              return (
                <div
                  key={idx}
                  className="absolute top-0 w-1 h-4 bg-[#FF6B35] rounded-full transform -translate-x-1/2 -translate-y-1 cursor-pointer pointer-events-auto hover:scale-125 transition-transform"
                  style={{ left: `${position}%` }}
                  onClick={() => seekToFrame(phase.frame)}
                  title={`${phase.phase} (${phase.timestamp.toFixed(2)}s)`}
                />
              )
            })}
          </div>
          
          <input
            type="range"
            min={0}
            max={totalFrames - 1}
            value={currentFrame}
            onChange={(e) => seekToFrame(parseInt(e.target.value))}
            className="w-full h-2 bg-[#4a4a4a] rounded-lg appearance-none cursor-pointer accent-[#FF6B35]"
          />
          
          <div className="flex justify-between text-xs text-[#888] mt-1">
            <span>0s</span>
            <span>{((totalFrames - 1) / fps).toFixed(1)}s</span>
          </div>
        </div>
        
        {/* Playback Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Skip to start */}
            <button
              onClick={() => seekToFrame(0)}
              className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
              title="Go to start"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="p-3 rounded-full bg-[#FF6B35] hover:bg-[#E55300] text-black transition-colors"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" fill="currentColor" />
              )}
            </button>
            
            {/* Skip to end */}
            <button
              onClick={() => seekToFrame(totalFrames - 1)}
              className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
              title="Go to end"
            >
              <SkipForward className="w-5 h-5" />
            </button>
            
            {/* Reset */}
            <button
              onClick={resetSequence}
              className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
              title="Reset sequence"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Frame counter */}
            <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg px-3 py-2">
              <div className="text-white font-mono text-sm">
                Frame <span className="text-[#FF6B35]">{currentFrame + 1}</span> / {totalFrames}
              </div>
              <div className="text-[#888] font-mono text-xs">
                {currentTimestamp.toFixed(2)}s
              </div>
            </div>
            
            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                disabled={isGeneratingVideo}
                className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
                  isGeneratingVideo 
                    ? "bg-[#FF6B35] text-black cursor-wait" 
                    : "bg-[#FF6B35] hover:bg-[#E55300] text-black"
                }`}
                title="Download video options"
              >
                {isGeneratingVideo ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="text-xs font-bold">{generationProgress}%</span>
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5" />
                    <span className="text-xs font-bold hidden sm:inline">Download</span>
                    <ChevronDown className="w-4 h-4" />
                  </>
                )}
              </button>
              
              {/* Dropdown Menu */}
              {showDownloadMenu && !isGeneratingVideo && (
                <div className="absolute right-0 bottom-full mb-2 w-56 bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b border-[#3a3a3a]">
                    <span className="text-xs text-[#888] font-semibold">DOWNLOAD OPTIONS</span>
                  </div>
                  <button
                    onClick={() => downloadStage(1)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#3a3a3a] flex items-center gap-3 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#FF6B35]" />
                    <div>
                      <div className="font-semibold">Stage 1: Full Speed</div>
                      <div className="text-xs text-[#888]">Normal playback</div>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadStage(2)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#3a3a3a] flex items-center gap-3 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#4ade80]" />
                    <div>
                      <div className="font-semibold">Stage 2: Label Tutorial</div>
                      <div className="text-xs text-[#888]">Labels appearing one by one</div>
                    </div>
                  </button>
                  <button
                    onClick={() => downloadStage(3)}
                    className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#3a3a3a] flex items-center gap-3 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#f97316]" />
                    <div>
                      <div className="font-semibold">Stage 3: Slow Motion</div>
                      <div className="text-xs text-[#888]">0.25x speed with labels</div>
                    </div>
                  </button>
                  <div className="border-t border-[#3a3a3a]">
                    <button
                      onClick={() => downloadStage('all')}
                      className="w-full px-4 py-3 text-left text-sm text-white hover:bg-[#3a3a3a] flex items-center gap-3 transition-colors bg-[#1a1a1a]"
                    >
                      <Film className="w-4 h-4 text-[#FF6B35]" />
                      <div>
                        <div className="font-semibold text-[#FF6B35]">All 3 Stages Combined</div>
                        <div className="text-xs text-[#888]">Full analysis video</div>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Screen Record button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white"
              }`}
              title={isRecording ? "Stop recording" : "Screen record while playing"}
            >
              <Download className="w-5 h-5" />
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5" />
              ) : (
                <Maximize className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
        
        {/* Recording indicator */}
        {isRecording && (
          <div className="mt-3 flex items-center justify-center gap-2 text-red-500">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Recording... Click download to stop and save</span>
          </div>
        )}
        
        {/* Video generation progress */}
        {isGeneratingVideo && (
          <div className="mt-3">
            <div className="flex items-center justify-center gap-2 text-[#FF6B35] mb-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-medium">
                Generating {downloadingStage === 'all' ? 'full video' : downloadingStage?.replace('stage', 'Stage ')}... {generationProgress}%
              </span>
            </div>
            <div className="w-full bg-[#3a3a3a] rounded-full h-2">
              <div 
                className="bg-[#FF6B35] h-2 rounded-full transition-all duration-300"
                style={{ width: `${generationProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GSAPVideoPlayer

