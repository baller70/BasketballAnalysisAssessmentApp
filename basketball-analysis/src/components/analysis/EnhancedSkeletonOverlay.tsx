"use client"

import React from 'react'
import type { DetectedKeypoint } from '@/lib/mediapipePoseDetection'
import type { SkeletonCallout } from '@/types'

// MediaPipe skeleton connections (excluding head/face, hands, feet details)
const SKELETON_CONNECTIONS: [string, string][] = [
  // Torso
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  // Left arm
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  // Right arm
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  // Left leg
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  // Right leg
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
]

// Keypoints to display as joints (excluding head, neck, hands, feet)
const VISIBLE_KEYPOINTS = [
  'left_shoulder', 'right_shoulder',
  'left_elbow', 'right_elbow',
  'left_wrist', 'right_wrist',
  'left_hip', 'right_hip',
  'left_knee', 'right_knee',
  'left_ankle', 'right_ankle',
]

// Callout configuration for body part labels - distributed on both sides like reference
const CALLOUT_CONFIG: SkeletonCallout[] = [
  // Left side labels
  { label: 'Shoulder', keypointName: 'left_shoulder', position: 'left', offsetX: -80, offsetY: -20 },
  { label: 'Elbow', keypointName: 'left_elbow', position: 'left', offsetX: -70, offsetY: 0 },
  { label: 'Hip', keypointName: 'left_hip', position: 'left', offsetX: -60, offsetY: 10 },
  { label: 'Knee', keypointName: 'left_knee', position: 'left', offsetX: -60, offsetY: 0 },
  // Right side labels
  { label: 'Shoulder', keypointName: 'right_shoulder', position: 'right', offsetX: 80, offsetY: -20 },
  { label: 'Wrist', keypointName: 'right_wrist', position: 'right', offsetX: 70, offsetY: 0 },
  { label: 'Hand', keypointName: 'right_wrist', position: 'right', offsetX: 60, offsetY: 30 },
  { label: 'Hip', keypointName: 'right_hip', position: 'right', offsetX: 70, offsetY: 10 },
  { label: 'Ankle', keypointName: 'right_ankle', position: 'right', offsetX: 60, offsetY: 10 },
]

interface EnhancedSkeletonOverlayProps {
  keypoints: DetectedKeypoint[]
  showSkeleton: boolean
  showCallouts: boolean
  imageWidth: number
  imageHeight: number
  skeletonColor?: string
  jointColor?: string
  labelColor?: string
}

export function EnhancedSkeletonOverlay({
  keypoints,
  showSkeleton,
  showCallouts,
  imageWidth,
  imageHeight,
  skeletonColor = '#FFFFFF',
  jointColor = '#FFFFFF',
  labelColor = '#FFFFFF',
}: EnhancedSkeletonOverlayProps) {
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]))

  // Convert normalized coordinates to pixel coordinates
  const toPixel = (x: number, y: number) => ({
    x: x * imageWidth,
    y: y * imageHeight,
  })

  // Get keypoint position safely
  const getKeypointPos = (name: string) => {
    const kp = keypointMap.get(name)
    if (!kp || kp.confidence < 0.3) return null
    return toPixel(kp.x, kp.y)
  }

  // Calculate midpoint between two keypoints (for future use)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getMidpoint = (name1: string, name2: string) => {
    const p1 = getKeypointPos(name1)
    const p2 = getKeypointPos(name2)
    if (!p1 || !p2) return null
    return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 }
  }

  // Render a callout with leader line - matching reference style
  const renderCallout = (callout: SkeletonCallout, index: number) => {
    const anchorPos = getKeypointPos(callout.keypointName)
    if (!anchorPos) return null

    const labelX = anchorPos.x + callout.offsetX
    const labelY = anchorPos.y + callout.offsetY
    const isLeft = callout.position === 'left'

    // Calculate line end point (closer to the joint)
    const lineEndX = isLeft ? labelX + 5 : labelX - 5

    return (
      <g key={`callout-${index}`}>
        {/* Leader line - simple straight line */}
        <line
          x1={anchorPos.x}
          y1={anchorPos.y}
          x2={lineEndX}
          y2={labelY}
          stroke={labelColor}
          strokeWidth={1}
          opacity={0.95}
        />
        {/* Small dot at the joint end */}
        <circle
          cx={anchorPos.x}
          cy={anchorPos.y}
          r={3}
          fill={labelColor}
          opacity={0.9}
        />
        {/* Label text - clean sans-serif style like reference */}
        <text
          x={labelX}
          y={labelY + 4}
          textAnchor={isLeft ? 'end' : 'start'}
          fill={labelColor}
          fontSize={14}
          fontWeight="400"
          fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(0,0,0,0.5)' }}
        >
          {callout.label}
        </text>
      </g>
    )
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      viewBox={`0 0 ${imageWidth} ${imageHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Define glow filter for skeleton lines */}
      <defs>
        <filter id="skeletonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Skeleton connections - white lines with subtle glow */}
      {showSkeleton && SKELETON_CONNECTIONS.map(([from, to], index) => {
        const fromPos = getKeypointPos(from)
        const toPos = getKeypointPos(to)
        if (!fromPos || !toPos) return null

        return (
          <line
            key={`bone-${index}`}
            x1={fromPos.x} y1={fromPos.y}
            x2={toPos.x} y2={toPos.y}
            stroke={skeletonColor}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.95}
            filter="url(#skeletonGlow)"
          />
        )
      })}

      {/* Joint circles - white filled circles at keypoints */}
      {showSkeleton && VISIBLE_KEYPOINTS.map((name, index) => {
        const pos = getKeypointPos(name)
        if (!pos) return null

        return (
          <circle
            key={`joint-${index}`}
            cx={pos.x}
            cy={pos.y}
            r={8}
            fill={jointColor}
            stroke="rgba(0,0,0,0.3)"
            strokeWidth={1}
            opacity={0.95}
            filter="url(#skeletonGlow)"
          />
        )
      })}

      {/* Callout labels with leader lines */}
      {showCallouts && CALLOUT_CONFIG.map((callout, index) => renderCallout(callout, index))}
    </svg>
  )
}

// Export callout config for external use
export { CALLOUT_CONFIG, SKELETON_CONNECTIONS, VISIBLE_KEYPOINTS }

