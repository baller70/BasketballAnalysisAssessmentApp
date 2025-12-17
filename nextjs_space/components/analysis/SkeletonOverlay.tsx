"use client"

import React, { useRef, useEffect } from "react"

/**
 * SkeletonOverlay Component
 * 
 * Draws a skeleton overlay on top of an image showing body keypoints
 * and connections for basketball shooting form analysis.
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

// Color coding based on status
const STATUS_COLORS = {
  good: "#22c55e",      // Green
  warning: "#eab308",   // Yellow
  critical: "#ef4444",  // Red
  default: "#3b82f6",   // Blue
}

export function SkeletonOverlay({
  imageUrl,
  keypoints,
  width = 600,
  height = 800,
  showLabels = false,
  showConfidence = false,
  lineWidth = 3,
  pointRadius = 6,
  className = "",
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

      // Draw skeleton lines
      context.lineWidth = lineWidth
      context.lineCap = "round"
      context.lineJoin = "round"

      for (const [startName, endName] of SKELETON_CONNECTIONS) {
        const startKp = keypointMap.get(startName)
        const endKp = keypointMap.get(endName)

        if (startKp && endKp && startKp.confidence > 0.3 && endKp.confidence > 0.3) {
          const start = toCanvasCoords(startKp)
          const end = toCanvasCoords(endKp)

          // Determine line color based on worst status of the two points
          const worstStatus = getWorstStatus(startKp.status, endKp.status)
          context.strokeStyle = STATUS_COLORS[worstStatus || "default"]

          // Draw line with gradient for depth effect
          const gradient = context.createLinearGradient(start.x, start.y, end.x, end.y)
          gradient.addColorStop(0, context.strokeStyle)
          gradient.addColorStop(1, context.strokeStyle)
          context.strokeStyle = gradient

          context.beginPath()
          context.moveTo(start.x, start.y)
          context.lineTo(end.x, end.y)
          context.stroke()
        }
      }

      // Draw keypoints
      for (const kp of keypoints) {
        if (kp.confidence < 0.3) continue

        const { x, y } = toCanvasCoords(kp)
        const color = STATUS_COLORS[kp.status || "default"]

        // Draw outer glow
        context.beginPath()
        context.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
        context.fillStyle = "rgba(255, 255, 255, 0.5)"
        context.fill()

        // Draw main point
        context.beginPath()
        context.arc(x, y, pointRadius, 0, Math.PI * 2)
        context.fillStyle = color
        context.fill()

        // Draw inner highlight
        context.beginPath()
        context.arc(x, y, pointRadius * 0.4, 0, Math.PI * 2)
        context.fillStyle = "rgba(255, 255, 255, 0.6)"
        context.fill()

        // Draw labels if enabled
        if (showLabels) {
          context.font = "12px Arial"
          context.fillStyle = "white"
          context.strokeStyle = "black"
          context.lineWidth = 2
          
          const label = formatLabel(kp.name)
          context.strokeText(label, x + pointRadius + 4, y + 4)
          context.fillText(label, x + pointRadius + 4, y + 4)
        }

        // Draw confidence if enabled
        if (showConfidence) {
          context.font = "10px Arial"
          context.fillStyle = "rgba(255, 255, 255, 0.8)"
          const confText = `${Math.round(kp.confidence * 100)}%`
          context.fillText(confText, x + pointRadius + 4, y + (showLabels ? 18 : 4))
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
  }, [imageUrl, keypoints, width, height, showLabels, showConfidence, lineWidth, pointRadius])

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
export function drawSkeletonOnCanvas(
  ctx: CanvasRenderingContext2D,
  keypoints: Keypoint[],
  canvasWidth: number,
  canvasHeight: number,
  options?: {
    lineWidth?: number
    pointRadius?: number
    showLabels?: boolean
  }
) {
  const { lineWidth = 3, pointRadius = 6, showLabels = false } = options || {}

  const keypointMap = new Map<string, Keypoint>()
  keypoints.forEach(kp => keypointMap.set(kp.name, kp))

  const toCoords = (kp: Keypoint) => ({
    x: (kp.x / 100) * canvasWidth,
    y: (kp.y / 100) * canvasHeight,
  })

  // Draw connections
  ctx.lineWidth = lineWidth
  ctx.lineCap = "round"

  for (const [startName, endName] of SKELETON_CONNECTIONS) {
    const startKp = keypointMap.get(startName)
    const endKp = keypointMap.get(endName)

    if (startKp && endKp && startKp.confidence > 0.3 && endKp.confidence > 0.3) {
      const start = toCoords(startKp)
      const end = toCoords(endKp)

      ctx.strokeStyle = STATUS_COLORS[startKp.status || "default"]
      ctx.beginPath()
      ctx.moveTo(start.x, start.y)
      ctx.lineTo(end.x, end.y)
      ctx.stroke()
    }
  }

  // Draw points
  for (const kp of keypoints) {
    if (kp.confidence < 0.3) continue

    const { x, y } = toCoords(kp)
    const color = STATUS_COLORS[kp.status || "default"]

    ctx.beginPath()
    ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = "white"
    ctx.lineWidth = 2
    ctx.stroke()

    if (showLabels) {
      ctx.font = "11px Arial"
      ctx.fillStyle = "white"
      ctx.fillText(formatLabel(kp.name), x + pointRadius + 3, y + 3)
    }
  }
}





