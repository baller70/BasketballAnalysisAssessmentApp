/**
 * ProfessionalSkeletonOverlay Component
 * 
 * Draws a professional video game-style skeleton overlay for live camera.
 * Uses the SAME styling as the analysis skeleton overlay for consistency.
 * 
 * Features:
 * - Status-based coloring (green=good, yellow=warning, red=problem)
 * - Multi-layered glow effects for professional look
 * - Detailed keypoint rendering with rings and highlights
 * - Body part color coding (cyan arms, purple torso, orange hips, yellow legs)
 * - Automatic orientation handling for mobile cameras
 */

"use client"

import React, { useEffect, useRef, useCallback, useState } from 'react'
import {
  type Pose,
  type ShootingAngles,
  SKELETON_CONNECTIONS,
  KEYPOINT_INDICES,
} from '@/services/poseDetection'

// ============================================
// TYPES
// ============================================

interface ProfessionalSkeletonOverlayProps {
  /** Original video width (intrinsic video dimensions) */
  width: number
  /** Original video height (intrinsic video dimensions) */
  height: number
  /** Display width (actual canvas size) - optional, will use container size */
  displayWidth?: number
  /** Display height (actual canvas size) - optional, will use container size */
  displayHeight?: number
  pose: Pose | null
  angles: ShootingAngles | null
  feedback?: {
    elbowStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    kneeStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    shoulderStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    hipStatus?: 'good' | 'warning' | 'critical' | 'unknown'
  } | null
  showAngles?: boolean
  showKeypoints?: boolean
  showSkeleton?: boolean
  minConfidence?: number
  /** Whether the video is mirrored (front camera) */
  isMirrored?: boolean
}

// ============================================
// CONSTANTS - Same as analysis skeleton
// ============================================

// Body part to color mapping for visual distinction
const BODY_PART_COLORS: Record<number, string> = {
  // Nose, eyes, ears - face (white/light)
  0: '#ffffff', // nose
  1: '#ffffff', // left_eye
  2: '#ffffff', // right_eye
  3: '#ffffff', // left_ear
  4: '#ffffff', // right_ear
  // Shoulders - cyan/teal
  5: '#00d4ff', // left_shoulder
  6: '#00d4ff', // right_shoulder
  // Elbows - cyan/teal
  7: '#00ffcc', // left_elbow
  8: '#00ffcc', // right_elbow
  // Wrists - cyan/green
  9: '#00ff99', // left_wrist
  10: '#00ff99', // right_wrist
  // Hips - orange
  11: '#ff9900', // left_hip
  12: '#ff9900', // right_hip
  // Knees - yellow/gold
  13: '#ffcc00', // left_knee
  14: '#ffcc00', // right_knee
  // Ankles - yellow
  15: '#ffff00', // left_ankle
  16: '#ffff00', // right_ankle
}

// Status colors for angle-based feedback
const STATUS_COLORS = {
  good: '#22c55e',      // Green - good form
  warning: '#eab308',   // Yellow - needs improvement
  critical: '#ef4444',  // Red - problem area
  unknown: '#3b82f6',   // Blue - neutral
}

// Get status color for a keypoint based on feedback
function getKeypointStatusColor(
  keypointIndex: number,
  feedback?: {
    elbowStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    kneeStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    shoulderStatus?: 'good' | 'warning' | 'critical' | 'unknown'
    hipStatus?: 'good' | 'warning' | 'critical' | 'unknown'
  } | null
): string | null {
  if (!feedback) return null

  // Elbow keypoints (7, 8) and wrists (9, 10)
  if (keypointIndex === 7 || keypointIndex === 8 || keypointIndex === 9 || keypointIndex === 10) {
    if (feedback.elbowStatus && feedback.elbowStatus !== 'unknown') {
      return STATUS_COLORS[feedback.elbowStatus]
    }
  }

  // Shoulder keypoints (5, 6)
  if (keypointIndex === 5 || keypointIndex === 6) {
    if (feedback.shoulderStatus && feedback.shoulderStatus !== 'unknown') {
      return STATUS_COLORS[feedback.shoulderStatus]
    }
  }

  // Hip keypoints (11, 12)
  if (keypointIndex === 11 || keypointIndex === 12) {
    if (feedback.hipStatus && feedback.hipStatus !== 'unknown') {
      return STATUS_COLORS[feedback.hipStatus]
    }
  }

  // Knee keypoints (13, 14) and ankles (15, 16)
  if (keypointIndex === 13 || keypointIndex === 14 || keypointIndex === 15 || keypointIndex === 16) {
    if (feedback.kneeStatus && feedback.kneeStatus !== 'unknown') {
      return STATUS_COLORS[feedback.kneeStatus]
    }
  }

  return null
}

// ============================================
// COMPONENT
// ============================================

export function ProfessionalSkeletonOverlay({
  width: videoWidth,
  height: videoHeight,
  displayWidth,
  displayHeight,
  pose,
  angles,
  feedback,
  showAngles = false,
  showKeypoints = true,
  showSkeleton = true,
  minConfidence = 0.2,
  isMirrored = false,
}: ProfessionalSkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  
  // Use ResizeObserver for more reliable size tracking
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const updateSize = () => {
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }
    
    // Initial size
    updateSize()
    
    // Use ResizeObserver for reliable updates
    const resizeObserver = new ResizeObserver(() => {
      updateSize()
    })
    resizeObserver.observe(container)
    
    // Also listen for orientation changes on mobile
    const handleOrientationChange = () => {
      // Small delay to let the layout settle
      setTimeout(updateSize, 100)
    }
    window.addEventListener('orientationchange', handleOrientationChange)
    window.addEventListener('resize', updateSize)
    
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('orientationchange', handleOrientationChange)
      window.removeEventListener('resize', updateSize)
    }
  }, [])

  const drawSkeleton = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return
    
    // Use container size or fallback to video dimensions
    const canvasW = canvasSize.width || displayWidth || videoWidth
    const canvasH = canvasSize.height || displayHeight || videoHeight

    // Set canvas resolution to match container
    canvas.width = canvasW
    canvas.height = canvasH

    // Clear canvas
    ctx.clearRect(0, 0, canvasW, canvasH)

    if (!pose || pose.keypoints.length === 0) return

    // Calculate object-cover scaling (same as CSS object-cover)
    // This ensures the skeleton aligns with how the video is displayed
    const videoAspect = videoWidth / videoHeight
    const canvasAspect = canvasW / canvasH
    
    let scale: number
    let offsetX = 0
    let offsetY = 0
    
    if (videoAspect > canvasAspect) {
      // Video is wider than container - scale by height, crop width
      scale = canvasH / videoHeight
      offsetX = (canvasW - videoWidth * scale) / 2
    } else {
      // Video is taller than container - scale by width, crop height
      scale = canvasW / videoWidth
      offsetY = (canvasH - videoHeight * scale) / 2
    }
    
    // Transform keypoints from video coordinates to canvas coordinates
    // MoveNet returns pixel coordinates in the original video space
    const transformedKeypoints = pose.keypoints.map(kp => ({
      ...kp,
      x: kp.x * scale + offsetX,
      y: kp.y * scale + offsetY,
    }))
    
    drawSkeletonWithKeypoints(ctx, transformedKeypoints, canvasW, canvasH)
    
    function drawSkeletonWithKeypoints(
      ctx: CanvasRenderingContext2D, 
      keypoints: Array<{ x: number; y: number; score?: number; name?: string }>,
      canvasW: number,
      canvasH: number
    ) {
      // ===== DRAW SKELETON CONNECTIONS =====
      if (showSkeleton) {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        for (const [i, j] of SKELETON_CONNECTIONS) {
          const kp1 = keypoints[i]
          const kp2 = keypoints[j]

          if (
            kp1 && kp2 &&
            (kp1.score === undefined || kp1.score >= minConfidence) &&
            (kp2.score === undefined || kp2.score >= minConfidence)
          ) {
            // Determine color - use status color if available, otherwise body part color
            const statusColor1 = getKeypointStatusColor(i, feedback)
            const statusColor2 = getKeypointStatusColor(j, feedback)
            const lineColor = statusColor1 || statusColor2 || BODY_PART_COLORS[i] || '#00d4ff'

            // Layer 1: Outer glow (largest, most transparent)
            ctx.strokeStyle = lineColor
            ctx.lineWidth = 16
            ctx.globalAlpha = 0.15
            ctx.beginPath()
            ctx.moveTo(kp1.x, kp1.y)
            ctx.lineTo(kp2.x, kp2.y)
            ctx.stroke()

            // Layer 2: Middle glow
            ctx.lineWidth = 10
            ctx.globalAlpha = 0.25
            ctx.beginPath()
            ctx.moveTo(kp1.x, kp1.y)
            ctx.lineTo(kp2.x, kp2.y)
            ctx.stroke()

            // Layer 3: Inner glow
            ctx.lineWidth = 6
            ctx.globalAlpha = 0.4
            ctx.beginPath()
            ctx.moveTo(kp1.x, kp1.y)
            ctx.lineTo(kp2.x, kp2.y)
            ctx.stroke()

            // Layer 4: Core line (solid)
            ctx.lineWidth = 4
            ctx.globalAlpha = 1.0
            ctx.beginPath()
            ctx.moveTo(kp1.x, kp1.y)
            ctx.lineTo(kp2.x, kp2.y)
            ctx.stroke()

            // Layer 5: Bright center highlight
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 1.5
            ctx.globalAlpha = 0.6
            ctx.beginPath()
            ctx.moveTo(kp1.x, kp1.y)
            ctx.lineTo(kp2.x, kp2.y)
            ctx.stroke()

            ctx.globalAlpha = 1.0
          }
        }
      }

      // ===== DRAW KEYPOINTS =====
      if (showKeypoints) {
        const pointRadius = 10

        for (let i = 0; i < keypoints.length; i++) {
          const keypoint = keypoints[i]
          if (keypoint.score !== undefined && keypoint.score < minConfidence) continue

          const x = keypoint.x
          const y = keypoint.y

          // Determine color - use status color if available, otherwise body part color
          const statusColor = getKeypointStatusColor(i, feedback)
          const color = statusColor || BODY_PART_COLORS[i] || '#00d4ff'

          // Layer 1: Outer glow (largest)
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 8, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 0.15
          ctx.fill()

          // Layer 2: Middle glow
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 5, 0, Math.PI * 2)
          ctx.globalAlpha = 0.25
          ctx.fill()

          // Layer 3: Inner glow
          ctx.beginPath()
          ctx.arc(x, y, pointRadius + 2, 0, Math.PI * 2)
          ctx.globalAlpha = 0.4
          ctx.fill()

          // Layer 4: Main joint circle (solid)
          ctx.beginPath()
          ctx.arc(x, y, pointRadius, 0, Math.PI * 2)
          ctx.fillStyle = color
          ctx.globalAlpha = 1.0
          ctx.fill()

          // Layer 5: Dark inner ring for depth
          ctx.beginPath()
          ctx.arc(x, y, pointRadius * 0.7, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)'
          ctx.lineWidth = 2
          ctx.stroke()

          // Layer 6: Bright center highlight
          ctx.beginPath()
          ctx.arc(x, y, pointRadius * 0.5, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
          ctx.fill()

          // Layer 7: Tiny reflection dot
          ctx.beginPath()
          ctx.arc(x - pointRadius * 0.25, y - pointRadius * 0.25, pointRadius * 0.2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
          ctx.fill()
        }
      }

      // ===== DRAW ANGLE LABELS =====
      if (showAngles && angles) {
        ctx.font = 'bold 14px Inter, system-ui, sans-serif'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'

        const drawLabel = (
          x: number,
          y: number,
          text: string,
          status: 'good' | 'warning' | 'critical' | 'unknown' = 'unknown',
          labelOffsetX: number = 20,
          labelOffsetY: number = 0
        ) => {
          const labelX = x + labelOffsetX
          const labelY = y + labelOffsetY

          const metrics = ctx.measureText(text)
          const padding = 8
          const bgWidth = metrics.width + padding * 2
          const bgHeight = 24

          // Background with status color
          const bgColor = STATUS_COLORS[status] || STATUS_COLORS.unknown
          ctx.fillStyle = bgColor
          ctx.globalAlpha = 0.9
          ctx.beginPath()
          ctx.roundRect(labelX - padding, labelY - bgHeight / 2, bgWidth, bgHeight, 6)
          ctx.fill()

          // Text
          ctx.globalAlpha = 1.0
          ctx.fillStyle = '#ffffff'
          ctx.fillText(text, labelX, labelY)
        }

        // Elbow angle
        if (angles.elbowAngle !== null) {
          const elbow = keypoints[KEYPOINT_INDICES.right_elbow]
          if (elbow && (elbow.score === undefined || elbow.score >= minConfidence)) {
            drawLabel(elbow.x, elbow.y, `${angles.elbowAngle}°`, feedback?.elbowStatus || 'unknown', 25, -25)
          }
        }

        // Knee angle
        if (angles.kneeAngle !== null) {
          const knee = keypoints[KEYPOINT_INDICES.right_knee]
          if (knee && (knee.score === undefined || knee.score >= minConfidence)) {
            drawLabel(knee.x, knee.y, `${angles.kneeAngle}°`, feedback?.kneeStatus || 'unknown', 25, 0)
          }
        }

        // Shoulder angle
        if (angles.shoulderAngle !== null) {
          const shoulder = keypoints[KEYPOINT_INDICES.right_shoulder]
          if (shoulder && (shoulder.score === undefined || shoulder.score >= minConfidence)) {
            drawLabel(shoulder.x, shoulder.y, `${angles.shoulderAngle}°`, feedback?.shoulderStatus || 'unknown', -80, -25)
          }
        }

        // Hip angle
        if (angles.hipAngle !== null) {
          const hip = keypoints[KEYPOINT_INDICES.right_hip]
          if (hip && (hip.score === undefined || hip.score >= minConfidence)) {
            drawLabel(hip.x, hip.y, `${angles.hipAngle}°`, feedback?.hipStatus || 'unknown', -70, 0)
          }
        }
      }
    }
  }, [pose, angles, feedback, videoWidth, videoHeight, canvasSize, displayWidth, displayHeight, showAngles, showKeypoints, showSkeleton, minConfidence])

  useEffect(() => {
    drawSkeleton()
  }, [drawSkeleton])

  return (
    <div ref={containerRef} className="absolute inset-0 pointer-events-none">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  )
}

export default ProfessionalSkeletonOverlay
