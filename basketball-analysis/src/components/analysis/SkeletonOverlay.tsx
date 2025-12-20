"use client"

import React, { useRef, useEffect } from "react"

/**
 * SkeletonOverlay Component
 * 
 * Draws a professional video game-style skeleton overlay on top of an image 
 * showing body keypoints and connections for basketball shooting form analysis.
 * 
 * Features:
 * - Status-based coloring (green=good, yellow=warning, red=problem)
 * - Multi-layered glow effects for professional look
 * - Detailed keypoint rendering with rings and highlights
 * - Smooth gradient connections
 */

export interface Keypoint {
  name: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  confidence: number
  status?: "good" | "warning" | "critical"
}

interface SkeletonOverlayProps {
  imageUrl: string
  keypoints: Keypoint[]
  width?: number
  height?: number
  showLabels?: boolean
  showConfidence?: boolean
  lineWidth?: number
  pointRadius?: number
  className?: string
  // Optional angle measurements for status-based coloring
  angleMeasurements?: {
    elbowAngle?: number
    kneeAngle?: number
    shoulderAngle?: number
    hipAngle?: number
  }
}

// Skeleton connections for basketball shooting form
const SKELETON_CONNECTIONS: [string, string][] = [
  // Upper body
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  // Torso
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  // Neck to mid-hip
  ["neck", "mid_hip"],
  // Lower body
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
]

// Body part to color mapping for visual distinction
const BODY_PART_COLORS: Record<string, string> = {
  // Arms - cyan/teal
  left_shoulder: '#00d4ff',
  right_shoulder: '#00d4ff',
  left_elbow: '#00ffcc',
  right_elbow: '#00ffcc',
  left_wrist: '#00ff99',
  right_wrist: '#00ff99',
  // Torso - purple/magenta
  neck: '#ff00ff',
  mid_hip: '#cc00ff',
  // Hips - orange
  left_hip: '#ff9900',
  right_hip: '#ff9900',
  // Legs - yellow/gold
  left_knee: '#ffcc00',
  right_knee: '#ffcc00',
  left_ankle: '#ffff00',
  right_ankle: '#ffff00',
}

// Status colors for angle-based feedback
const STATUS_COLORS = {
  good: "#22c55e",      // Green - good form
  warning: "#eab308",   // Yellow - needs improvement
  critical: "#ef4444",  // Red - problem area
  default: "#3b82f6",   // Blue - neutral
}

// Determine status based on angle measurements
function getStatusForKeypoint(
  keypointName: string,
  angleMeasurements?: {
    elbowAngle?: number
    kneeAngle?: number
    shoulderAngle?: number
    hipAngle?: number
  }
): "good" | "warning" | "critical" | undefined {
  if (!angleMeasurements) return undefined

  // Elbow-related keypoints
  if (keypointName.includes('elbow') || keypointName.includes('wrist')) {
    const elbow = angleMeasurements.elbowAngle
    if (elbow !== undefined) {
      if (elbow >= 85 && elbow <= 100) return 'good'
      if (elbow >= 70 && elbow <= 110) return 'warning'
      return 'critical'
    }
  }

  // Knee-related keypoints
  if (keypointName.includes('knee') || keypointName.includes('ankle')) {
    const knee = angleMeasurements.kneeAngle
    if (knee !== undefined) {
      if (knee >= 130 && knee <= 160) return 'good'
      if (knee >= 110 && knee <= 170) return 'warning'
      return 'critical'
    }
  }

  // Shoulder-related keypoints
  if (keypointName.includes('shoulder')) {
    const shoulder = angleMeasurements.shoulderAngle
    if (shoulder !== undefined) {
      if (shoulder >= 80 && shoulder <= 100) return 'good'
      if (shoulder >= 60 && shoulder <= 120) return 'warning'
      return 'critical'
    }
  }

  // Hip-related keypoints
  if (keypointName.includes('hip')) {
    const hip = angleMeasurements.hipAngle
    if (hip !== undefined) {
      if (hip >= 160 && hip <= 180) return 'good'
      if (hip >= 140 && hip <= 180) return 'warning'
      return 'critical'
    }
  }

  return undefined
}

export function SkeletonOverlay({
  imageUrl,
  keypoints,
  width = 600,
  height = 800,
  showLabels = false,
  showConfidence = false,
  lineWidth = 4,
  pointRadius = 10,
  className = "",
  angleMeasurements,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const drawCanvasWithImage = (context: CanvasRenderingContext2D, img: HTMLImageElement) => {
      // Clear canvas
      context.clearRect(0, 0, width, height)

      // Draw image scaled to fit
      const scale = Math.min(width / img.width, height / img.height)
      const scaledWidth = img.width * scale
      const scaledHeight = img.height * scale
      const offsetX = (width - scaledWidth) / 2
      const offsetY = (height - scaledHeight) / 2

      context.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight)

      // Create keypoint map for easy lookup
      const keypointMap = new Map<string, Keypoint>()
      keypoints.forEach(kp => keypointMap.set(kp.name, kp))

      // Convert percentage to canvas coordinates
      const toCanvasCoords = (kp: Keypoint) => ({
        x: offsetX + (kp.x / 100) * scaledWidth,
        y: offsetY + (kp.y / 100) * scaledHeight,
      })

      // ===== DRAW SKELETON CONNECTIONS =====
      context.lineCap = "round"
      context.lineJoin = "round"

      for (const [startName, endName] of SKELETON_CONNECTIONS) {
        const startKp = keypointMap.get(startName)
        const endKp = keypointMap.get(endName)

        if (startKp && endKp && startKp.confidence > 0.3 && endKp.confidence > 0.3) {
          const start = toCanvasCoords(startKp)
          const end = toCanvasCoords(endKp)

          // Determine color based on status or body part
          const startStatus = startKp.status || getStatusForKeypoint(startName, angleMeasurements)
          const endStatus = endKp.status || getStatusForKeypoint(endName, angleMeasurements)
          const worstStatus = getWorstStatus(startStatus, endStatus)
          
          let lineColor: string
          if (worstStatus) {
            lineColor = STATUS_COLORS[worstStatus]
          } else {
            // Use body part color if no status
            lineColor = BODY_PART_COLORS[startName] || '#00d4ff'
          }

          // Layer 1: Outer glow (largest, most transparent)
          context.strokeStyle = lineColor
          context.lineWidth = lineWidth + 12
          context.globalAlpha = 0.15
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()

          // Layer 2: Middle glow
          context.lineWidth = lineWidth + 8
          context.globalAlpha = 0.25
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()

          // Layer 3: Inner glow
          context.lineWidth = lineWidth + 4
          context.globalAlpha = 0.4
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()

          // Layer 4: Core line (solid)
          context.lineWidth = lineWidth
          context.globalAlpha = 1.0
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()

          // Layer 5: Bright center highlight
          context.strokeStyle = '#ffffff'
          context.lineWidth = lineWidth * 0.3
          context.globalAlpha = 0.6
          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()

          context.globalAlpha = 1.0
        }
      }

      // ===== DRAW KEYPOINTS =====
      for (const kp of keypoints) {
        if (kp.confidence < 0.3) continue

        const { x, y } = toCanvasCoords(kp)
        
        // Determine color based on status or body part
        const status = kp.status || getStatusForKeypoint(kp.name, angleMeasurements)
        let color: string
        if (status) {
          color = STATUS_COLORS[status]
        } else {
          color = BODY_PART_COLORS[kp.name] || '#00d4ff'
        }

        // Layer 1: Outer glow (largest)
        context.beginPath()
        context.arc(x, y, pointRadius + 8, 0, Math.PI * 2)
        context.fillStyle = color
        context.globalAlpha = 0.15
        context.fill()

        // Layer 2: Middle glow
        context.beginPath()
        context.arc(x, y, pointRadius + 5, 0, Math.PI * 2)
        context.globalAlpha = 0.25
        context.fill()

        // Layer 3: Inner glow
        context.beginPath()
        context.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
        context.globalAlpha = 0.4
        context.fill()

        // Layer 4: Main joint circle (solid)
        context.beginPath()
        context.arc(x, y, pointRadius, 0, Math.PI * 2)
        context.fillStyle = color
        context.globalAlpha = 1.0
        context.fill()

        // Layer 5: Dark inner ring for depth
        context.beginPath()
        context.arc(x, y, pointRadius * 0.7, 0, Math.PI * 2)
        context.strokeStyle = 'rgba(0, 0, 0, 0.4)'
        context.lineWidth = 2
        context.stroke()

        // Layer 6: Bright center highlight
        context.beginPath()
        context.arc(x, y, pointRadius * 0.5, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255, 255, 255, 0.7)'
        context.fill()

        // Layer 7: Tiny reflection dot
        context.beginPath()
        context.arc(x - pointRadius * 0.25, y - pointRadius * 0.25, pointRadius * 0.2, 0, Math.PI * 2)
        context.fillStyle = 'rgba(255, 255, 255, 0.9)'
        context.fill()

        // Draw labels if enabled
        if (showLabels) {
          context.font = "bold 12px Arial"
          context.fillStyle = "white"
          context.strokeStyle = "black"
          context.lineWidth = 3
          
          const label = formatLabel(kp.name)
          context.strokeText(label, x + pointRadius + 6, y + 4)
          context.fillText(label, x + pointRadius + 6, y + 4)
        }

        // Draw confidence if enabled
        if (showConfidence) {
          context.font = "10px Arial"
          context.fillStyle = "rgba(255, 255, 255, 0.8)"
          const confText = `${Math.round(kp.confidence * 100)}%`
          context.fillText(confText, x + pointRadius + 6, y + (showLabels ? 18 : 4))
        }
      }
    }

    // Load and draw image
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      imageRef.current = img
      drawCanvasWithImage(ctx, img)
    }
    img.src = imageUrl
  }, [imageUrl, keypoints, width, height, showLabels, showConfidence, lineWidth, pointRadius, angleMeasurements])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded-lg shadow-lg"
      />
    </div>
  )
}

// Helper to get worst status between two points
function getWorstStatus(
  s1: "good" | "warning" | "critical" | undefined,
  s2: "good" | "warning" | "critical" | undefined
): "good" | "warning" | "critical" | undefined {
  const priority = { critical: 3, warning: 2, good: 1 }
  const p1 = s1 ? priority[s1] : 0
  const p2 = s2 ? priority[s2] : 0
  
  if (p1 >= p2) return s1
  return s2
}

// Format keypoint name for display
function formatLabel(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Export a simpler version for just drawing on existing canvas
// Also updated to use the professional video game style
export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    lineWidth?: number
    pointRadius?: number
    showLabels?: boolean
    angleMeasurements?: {
      elbowAngle?: number
      kneeAngle?: number
      shoulderAngle?: number
      hipAngle?: number
    }
  }
) {
  const { lineWidth = 4, pointRadius = 10, showLabels = false, angleMeasurements } = options || {}

  const keypointMap = new Map<string, Keypoint>()
  keypoints.forEach(kp => keypointMap.set(kp.name, kp))

  const toCoords = (kp: Keypoint) => ({
    x: (kp.x / 100) * canvasWidth,
    y: (kp.y / 100) * canvasHeight,
  })

  // ===== DRAW CONNECTIONS =====
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  for (const [startName, endName] of SKELETON_CONNECTIONS) {
    const startKp = keypointMap.get(startName)
    const endKp = keypointMap.get(endName)

    if (startKp && endKp && startKp.confidence > 0.3 && endKp.confidence > 0.3) {
      const start = toCoords(startKp)
      const end = toCoords(endKp)

      // Determine color based on status or body part
      const startStatus = startKp.status || getStatusForKeypoint(startName, angleMeasurements)
      const endStatus = endKp.status || getStatusForKeypoint(endName, angleMeasurements)
      const worstStatus = getWorstStatus(startStatus, endStatus)
      
      let lineColor: string
      if (worstStatus) {
        lineColor = STATUS_COLORS[worstStatus]
      } else {
        lineColor = BODY_PART_COLORS[startName] || '#00d4ff'
      }

      // Layer 1: Outer glow
      ctx.strokeStyle = lineColor
      ctx.lineWidth = lineWidth + 10
      ctx.globalAlpha = 0.15
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      // Layer 2: Middle glow
      ctx.lineWidth = lineWidth + 6
      ctx.globalAlpha = 0.3
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      // Layer 3: Core line
      ctx.lineWidth = lineWidth
      ctx.globalAlpha = 1.0
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      // Layer 4: Center highlight
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = lineWidth * 0.3
      ctx.globalAlpha = 0.5
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()

      ctx.globalAlpha = 1.0
    }
  }

  // ===== DRAW KEYPOINTS =====
  for (const kp of keypoints) {
    if (kp.confidence < 0.3) continue

    const { x, y } = toCoords(kp)
    
    // Determine color based on status or body part
    const status = kp.status || getStatusForKeypoint(kp.name, angleMeasurements)
    let color: string
    if (status) {
      color = STATUS_COLORS[status]
    } else {
      color = BODY_PART_COLORS[kp.name] || '#00d4ff'
    }

    // Layer 1: Outer glow
    ctx.beginPath()
    ctx.arc(x, y, pointRadius + 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.2
    ctx.fill()

    // Layer 2: Middle glow
    ctx.beginPath()
    ctx.arc(x, y, pointRadius + 3, 0, Math.PI * 2)
    ctx.globalAlpha = 0.35
    ctx.fill()

    // Layer 3: Main circle
    ctx.beginPath()
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = 1.0
    ctx.fill()

    // Layer 4: Dark inner ring
    ctx.beginPath()
    ctx.arc(x, y, pointRadius * 0.65, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.lineWidth = 2
    ctx.stroke()

    // Layer 5: Bright center
    ctx.beginPath()
    ctx.arc(x, y, pointRadius * 0.45, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    ctx.fill()

    // Layer 6: Reflection dot
    ctx.beginPath()
    ctx.arc(x - pointRadius * 0.2, y - pointRadius * 0.2, pointRadius * 0.15, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()

    if (showLabels) {
      ctx.font = "bold 11px Arial"
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 2
      ctx.strokeText(formatLabel(kp.name), x + pointRadius + 4, y + 3)
      ctx.fillText(formatLabel(kp.name), x + pointRadius + 4, y + 3)
    }
  }
}
