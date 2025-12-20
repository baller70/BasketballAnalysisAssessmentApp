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
import { Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Download, RotateCcw } from "lucide-react"

// Register GSAP plugins
if (typeof window !== "undefined") {
  gsap.registerPlugin(useGSAP)
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
  const [internalOverlayToggles, setInternalOverlayToggles] = useState<OverlayToggles>({
    skeleton: true,
    joints: true,
    annotations: false,
    basketball: true
  })
  
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
    const color = colorMap[label.keypointName] || '#FFD700'
    
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
        <h2 className="text-2xl font-bold text-[#FFD700] mb-1">SHOOTING FORM ANALYSIS</h2>
        <p className="text-[#888] text-sm">3-Stage Breakdown: Full Speed → Label Tutorial → Slow Motion</p>
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
              className="p-6 rounded-full bg-[#FFD700] hover:bg-[#E5C100] text-black transition-all transform hover:scale-110 shadow-2xl"
            >
              <Play className="w-16 h-16" fill="currentColor" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="bg-black/70 text-[#FFD700] px-4 py-2 rounded-lg font-semibold">
                Click to Start 3-Stage Analysis
              </span>
            </div>
          </div>
        )}
        
        {/* Stage indicator */}
        {sequencePhase !== "initial" && sequencePhase !== "complete" && (
          <div className="absolute top-4 left-4 bg-black/80 px-4 py-2 rounded-lg border border-[#FFD700]/30">
            <div className="flex items-center gap-2">
              {sequencePhase === "stage1" && (
                <>
                  <div className="w-2 h-2 bg-[#FFD700] rounded-full animate-pulse" />
                  <span className="text-[#FFD700] text-sm font-bold">STAGE 1: FULL SPEED</span>
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
                  className="absolute top-0 w-1 h-4 bg-[#FFD700] rounded-full transform -translate-x-1/2 -translate-y-1 cursor-pointer pointer-events-auto hover:scale-125 transition-transform"
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
            className="w-full h-2 bg-[#4a4a4a] rounded-lg appearance-none cursor-pointer accent-[#FFD700]"
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
              className="p-3 rounded-full bg-[#FFD700] hover:bg-[#E5C100] text-black transition-colors"
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
                Frame <span className="text-[#FFD700]">{currentFrame + 1}</span> / {totalFrames}
              </div>
              <div className="text-[#888] font-mono text-xs">
                {currentTimestamp.toFixed(2)}s
              </div>
            </div>
            
            {/* Download button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              className={`p-2 rounded-lg transition-colors ${
                isRecording 
                  ? "bg-red-600 hover:bg-red-700 text-white" 
                  : "bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white"
              }`}
              title={isRecording ? "Stop recording" : "Record & Download video"}
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
      </div>
    </div>
  )
}

export default GSAPVideoPlayer

