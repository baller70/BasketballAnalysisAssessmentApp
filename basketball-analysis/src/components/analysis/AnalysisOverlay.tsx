"use client"

import React from 'react'
import type { DetectedKeypoint } from '@/lib/tensorflowPoseDetection'

// Joint connections for skeleton drawing
const SKELETON_CONNECTIONS = [
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

export interface AngleMeasurement {
  name: string
  angle: number
  optimalMin: number
  optimalMax: number
  points: [string, string, string] // vertex is middle point
  status: 'good' | 'warning' | 'critical'
}

export interface FormIssue {
  id: number
  title: string
  description: string
  severity: 'critical' | 'moderate' | 'minor'
  location: string // keypoint name for positioning
}

interface AnalysisOverlayProps {
  keypoints: DetectedKeypoint[]
  angles: AngleMeasurement[]
  issues: FormIssue[]
  showSkeleton: boolean
  showAngles: boolean
  showIssues: boolean
  imageWidth: number
  imageHeight: number
}

// Get color based on confidence
function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.7) return '#22c55e' // green
  if (confidence >= 0.5) return '#eab308' // yellow
  return '#ef4444' // red
}

// Get color based on status
function getStatusColor(status: 'good' | 'warning' | 'critical'): string {
  switch (status) {
    case 'good': return '#22c55e'
    case 'warning': return '#eab308'
    case 'critical': return '#ef4444'
  }
}

// Get severity color
function getSeverityColor(severity: 'critical' | 'moderate' | 'minor'): string {
  switch (severity) {
    case 'critical': return '#ef4444'
    case 'moderate': return '#f97316'
    case 'minor': return '#eab308'
  }
}

export function AnalysisOverlay({
  keypoints,
  angles,
  issues,
  showSkeleton,
  showAngles,
  showIssues,
  imageWidth,
  imageHeight,
}: AnalysisOverlayProps) {
  const keypointMap = new Map(keypoints.map(kp => [kp.name, kp]))

  // Convert normalized coordinates to pixel coordinates
  const toPixel = (x: number, y: number) => ({
    x: x * imageWidth,
    y: y * imageHeight,
  })

  // Draw angle arc
  const drawAngleArc = (angle: AngleMeasurement, index: number) => {
    const [p1Name, vertexName, p2Name] = angle.points
    const p1 = keypointMap.get(p1Name)
    const vertex = keypointMap.get(vertexName)
    const p2 = keypointMap.get(p2Name)

    if (!p1 || !vertex || !p2) return null

    const v = toPixel(vertex.x, vertex.y)
    const pt1 = toPixel(p1.x, p1.y)
    const pt2 = toPixel(p2.x, p2.y)

    // Calculate angles for the arc
    const angle1 = Math.atan2(pt1.y - v.y, pt1.x - v.x)
    const angle2 = Math.atan2(pt2.y - v.y, pt2.x - v.x)
    
    const radius = 30
    const color = getStatusColor(angle.status)

    // Arc path
    const startX = v.x + radius * Math.cos(angle1)
    const startY = v.y + radius * Math.sin(angle1)
    const endX = v.x + radius * Math.cos(angle2)
    const endY = v.y + radius * Math.sin(angle2)

    // Determine if we should use large arc
    let angleDiff = angle2 - angle1
    if (angleDiff < 0) angleDiff += 2 * Math.PI
    const largeArc = angleDiff > Math.PI ? 1 : 0

    // Label position (middle of arc)
    const midAngle = angle1 + angleDiff / 2
    const labelRadius = radius + 20
    const labelX = v.x + labelRadius * Math.cos(midAngle)
    const labelY = v.y + labelRadius * Math.sin(midAngle)

    return (
      <g key={`angle-${index}`}>
        {/* Arc */}
        <path
          d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY}`}
          fill="none"
          stroke={color}
          strokeWidth={3}
          opacity={0.9}
        />
        {/* Angle label background */}
        <rect
          x={labelX - 22}
          y={labelY - 10}
          width={44}
          height={20}
          rx={4}
          fill="rgba(0,0,0,0.8)"
        />
        {/* Angle label */}
        <text
          x={labelX}
          y={labelY + 5}
          textAnchor="middle"
          fill={color}
          fontSize={12}
          fontWeight="bold"
        >
          {angle.angle}°
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
      {/* Skeleton connections */}
      {showSkeleton && SKELETON_CONNECTIONS.map(([from, to], index) => {
        const fromKp = keypointMap.get(from)
        const toKp = keypointMap.get(to)
        if (!fromKp || !toKp) return null
        if (fromKp.confidence < 0.3 || toKp.confidence < 0.3) return null

        const fromPx = toPixel(fromKp.x, fromKp.y)
        const toPx = toPixel(toKp.x, toKp.y)
        const avgConfidence = (fromKp.confidence + toKp.confidence) / 2

        return (
          <line
            key={`connection-${index}`}
            x1={fromPx.x} y1={fromPx.y}
            x2={toPx.x} y2={toPx.y}
            stroke={getConfidenceColor(avgConfidence)}
            strokeWidth={4}
            strokeLinecap="round"
            opacity={0.8}
          />
        )
      })}

      {/* Keypoints */}
      {showSkeleton && keypoints.filter(kp => kp.confidence >= 0.3).map((kp, index) => {
        const px = toPixel(kp.x, kp.y)
        return (
          <g key={`keypoint-${index}`}>
            <circle
              cx={px.x} cy={px.y} r={8}
              fill={getConfidenceColor(kp.confidence)}
              stroke="#fff"
              strokeWidth={2}
              opacity={0.9}
            />
          </g>
        )
      })}

      {/* Angle measurements */}
      {showAngles && angles.map((angle, index) => drawAngleArc(angle, index))}

      {/* Issue callouts */}
      {showIssues && issues.map((issue, index) => {
        const locationKp = keypointMap.get(issue.location)
        if (!locationKp) return null
        const px = toPixel(locationKp.x, locationKp.y)
        const offsetX = index % 2 === 0 ? -100 : 100
        const offsetY = -40 - (index * 25)

        return (
          <g key={`issue-${issue.id}`}>
            {/* Line from keypoint to callout */}
            <line
              x1={px.x} y1={px.y}
              x2={px.x + offsetX} y2={px.y + offsetY}
              stroke={getSeverityColor(issue.severity)}
              strokeWidth={2}
              strokeDasharray="4,4"
              opacity={0.8}
            />
            {/* Callout number circle */}
            <circle
              cx={px.x + offsetX} cy={px.y + offsetY}
              r={14}
              fill={getSeverityColor(issue.severity)}
              stroke="#fff"
              strokeWidth={2}
            />
            <text
              x={px.x + offsetX} y={px.y + offsetY + 5}
              textAnchor="middle"
              fill="#fff"
              fontSize={12}
              fontWeight="bold"
            >
              {issue.id}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

