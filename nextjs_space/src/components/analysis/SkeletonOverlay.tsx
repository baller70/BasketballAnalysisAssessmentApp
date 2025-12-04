"use client"

import React, { useRef, useEffect, useCallback } from "react"

// Keypoint type for pose detection results
export interface Keypoint {
  name: string
  x: number // percentage 0-100
  y: number // percentage 0-100
  confidence: number
}

// Skeleton data structure - ONLY joints we care about (NO head, neck, hands, feet)
export interface SkeletonData {
  leftWrist: Keypoint
  rightWrist: Keypoint
  leftElbow: Keypoint
  rightElbow: Keypoint
  leftShoulder: Keypoint
  rightShoulder: Keypoint
  leftHip: Keypoint
  rightHip: Keypoint
  leftKnee: Keypoint
  rightKnee: Keypoint
  leftAnkle: Keypoint
  rightAnkle: Keypoint
  // Virtual points computed from real joints
  core?: Keypoint // midpoint between hips (computed)
}

export interface MeasurementLabel {
  keypoint: string
  label: string
  value: string
  position: "left" | "right" | "top" | "bottom"
}

interface SkeletonOverlayProps {
  imageUrl: string
  skeleton: SkeletonData
  measurements?: MeasurementLabel[]
  showLabels?: boolean
  showSkeleton?: boolean
  highlightedJoints?: string[]
}

// Bone connections - lines between joints
// Using virtual "mid_hip" and "mid_shoulder" for torso line
const BONE_PAIRS: [string, string][] = [
  // Torso/spine
  ["mid_hip", "mid_shoulder"],
  // Pelvis bar
  ["leftHip", "rightHip"],
  // Left arm
  ["leftShoulder", "leftElbow"],
  ["leftElbow", "leftWrist"],
  // Right arm
  ["rightShoulder", "rightElbow"],
  ["rightElbow", "rightWrist"],
  // Left leg
  ["leftHip", "leftKnee"],
  ["leftKnee", "leftAnkle"],
  // Right leg
  ["rightHip", "rightKnee"],
  ["rightKnee", "rightAnkle"],
]

// Joints to draw circles for (NO head, neck, hands, feet)
const JOINT_NAMES = [
  "leftShoulder", "rightShoulder",
  "leftElbow", "rightElbow",
  "leftWrist", "rightWrist",
  "leftHip", "rightHip",
  "leftKnee", "rightKnee",
  "leftAnkle", "rightAnkle",
] as const

// Label configuration for each joint
const LABEL_CONFIG: Record<string, { text: string; dx: number; dy: number }> = {
  leftShoulder:  { text: "SHOULDER", dx: -80, dy: -10 },
  rightShoulder: { text: "SHOULDER", dx: 20, dy: -10 },
  leftElbow:     { text: "ELBOW", dx: -70, dy: 0 },
  rightElbow:    { text: "ELBOW", dx: 20, dy: 0 },
  leftWrist:     { text: "WRIST", dx: -70, dy: 0 },
  rightWrist:    { text: "WRIST", dx: 20, dy: 0 },
  leftHip:       { text: "HIP", dx: -60, dy: 10 },
  rightHip:      { text: "HIP", dx: 20, dy: 10 },
  leftKnee:      { text: "KNEE", dx: -70, dy: 0 },
  rightKnee:     { text: "KNEE", dx: 20, dy: 0 },
  leftAnkle:     { text: "ANKLE", dx: -70, dy: 10 },
  rightAnkle:    { text: "ANKLE", dx: 20, dy: 10 },
}

// Helper: compute midpoint between two keypoints
function midpoint(a: Keypoint, b: Keypoint): Keypoint {
  return {
    name: "midpoint",
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
    confidence: Math.min(a.confidence, b.confidence),
  }
}

export function SkeletonOverlay({
  imageUrl,
  skeleton,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  measurements: _measurements,
  showLabels = true,
  showSkeleton = true,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  highlightedJoints: _highlightedJoints = [],
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  // Draw skeleton on canvas
  const drawSkeletonOnCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current

    if (!canvas || !img || !img.complete || img.naturalWidth === 0) {
      return
    }

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const displayWidth = img.offsetWidth
    const displayHeight = img.offsetHeight

    canvas.width = displayWidth
    canvas.height = displayHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (showSkeleton && displayWidth > 0 && displayHeight > 0) {
      drawSkeleton(ctx, skeleton, displayWidth, displayHeight, showLabels)
    }
  }, [skeleton, showSkeleton, showLabels])

  const handleImageLoad = useCallback(() => {
    requestAnimationFrame(() => {
      drawSkeletonOnCanvas()
    })
  }, [drawSkeletonOnCanvas])

  useEffect(() => {
    const timer = setTimeout(() => {
      drawSkeletonOnCanvas()
    }, 100)

    const handleResize = () => {
      requestAnimationFrame(drawSkeletonOnCanvas)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('resize', handleResize)
    }
  }, [drawSkeletonOnCanvas])

  return (
    <div ref={containerRef} className="relative w-full">
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Analysis"
        className="w-full h-auto rounded-lg"
        onLoad={handleImageLoad}
        crossOrigin="anonymous"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
    </div>
  )
}

// =============================================================================
// SIMPLE SKELETON DRAWING - Lines + Circles + Labels
// Based on pose detection keypoints, NOT anatomical bone shapes
// =============================================================================

// Main drawing function
function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  skeleton: SkeletonData,
  width: number,
  height: number,
  showLabels: boolean
) {
  ctx.clearRect(0, 0, width, height)

  // Convert percentage coordinates to pixel coordinates
  const toPixel = (point: Keypoint): { x: number; y: number; confidence: number; name: string } => ({
    x: (point.x / 100) * width,
    y: (point.y / 100) * height,
    confidence: point.confidence,
    name: point.name,
  })

  // Build points map with all keypoints + virtual midpoints
  const points: Record<string, { x: number; y: number; confidence: number; name: string }> = {}

  // Add all real keypoints
  for (const name of JOINT_NAMES) {
    const kp = skeleton[name]
    if (kp) {
      points[name] = toPixel(kp)
    }
  }

  // Compute virtual midpoints for torso line
  const lh = skeleton.leftHip
  const rh = skeleton.rightHip
  const ls = skeleton.leftShoulder
  const rs = skeleton.rightShoulder

  if (lh && rh && ls && rs) {
    const midHip = midpoint(lh, rh)
    const midShoulder = midpoint(ls, rs)
    points["mid_hip"] = toPixel(midHip)
    points["mid_shoulder"] = toPixel(midShoulder)
  }

  // Set up drawing style
  ctx.strokeStyle = "white"
  ctx.fillStyle = "white"
  ctx.lineWidth = 3
  ctx.lineCap = "round"
  ctx.lineJoin = "round"

  // Draw bones (lines between joints)
  drawBones(ctx, points)

  // Draw joints (circles at each keypoint)
  drawJoints(ctx, points)

  // Draw labels with leader lines
  if (showLabels) {
    drawLabels(ctx, points)
  }
}

// Draw bones as simple lines between joints
function drawBones(
  ctx: CanvasRenderingContext2D,
  points: Record<string, { x: number; y: number; confidence: number; name: string }>
) {
  const MIN_CONFIDENCE = 0.3

  for (const [startName, endName] of BONE_PAIRS) {
    const start = points[startName]
    const end = points[endName]

    // Skip if either point is missing or low confidence
    if (!start || !end) continue
    if (start.confidence < MIN_CONFIDENCE || end.confidence < MIN_CONFIDENCE) continue

    // Draw line between joints
    ctx.beginPath()
    ctx.moveTo(start.x, start.y)
    ctx.lineTo(end.x, end.y)
    ctx.stroke()
  }
}

// Draw joints as simple circles
function drawJoints(
  ctx: CanvasRenderingContext2D,
  points: Record<string, { x: number; y: number; confidence: number; name: string }>
) {
  const MIN_CONFIDENCE = 0.3
  const JOINT_RADIUS = 6

  for (const name of JOINT_NAMES) {
    const point = points[name]
    if (!point || point.confidence < MIN_CONFIDENCE) continue

    // Draw filled circle at joint position
    ctx.beginPath()
    ctx.arc(point.x, point.y, JOINT_RADIUS, 0, Math.PI * 2)
    ctx.fill()
  }
}

// Draw labels with leader lines
function drawLabels(
  ctx: CanvasRenderingContext2D,
  points: Record<string, { x: number; y: number; confidence: number; name: string }>
) {
  const MIN_CONFIDENCE = 0.3

  ctx.font = "bold 11px Arial, sans-serif"
  ctx.textBaseline = "middle"

  for (const name of JOINT_NAMES) {
    const point = points[name]
    if (!point || point.confidence < MIN_CONFIDENCE) continue

    const config = LABEL_CONFIG[name]
    if (!config) continue

    const labelX = point.x + config.dx
    const labelY = point.y + config.dy

    // Draw leader line (thin line from joint to label)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(labelX, labelY)
    ctx.stroke()

    // Measure text for background
    const textMetrics = ctx.measureText(config.text)
    const textWidth = textMetrics.width
    const textHeight = 14
    const padding = 4

    // Draw label background (black rectangle)
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)"
    ctx.fillRect(
      labelX - padding,
      labelY - textHeight / 2 - padding / 2,
      textWidth + padding * 2,
      textHeight + padding
    )

    // Draw label text (white)
    ctx.fillStyle = "white"
    ctx.fillText(config.text, labelX, labelY)
  }

  // Reset stroke style for other drawing
  ctx.strokeStyle = "white"
  ctx.lineWidth = 3
}
