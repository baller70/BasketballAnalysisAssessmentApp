/**
 * SkeletonOverlay Component
 * 
 * Draws pose skeleton and angle labels on a canvas overlay.
 * Used for real-time visualization during live analysis.
 */

"use client"

import React, { useEffect, useRef, useCallback } from 'react';
import {
  type Pose,
  type ShootingAngles,
  SKELETON_CONNECTIONS,
  KEYPOINT_INDICES,
} from '@/services/poseDetection';

// ============================================
// TYPES
// ============================================

interface SkeletonOverlayProps {
  /** Width of the canvas */
  width: number;
  /** Height of the canvas */
  height: number;
  /** Current pose to draw */
  pose: Pose | null;
  /** Current angles to display */
  angles: ShootingAngles | null;
  /** Whether to show angle labels */
  showAngles?: boolean;
  /** Whether to show keypoint dots */
  showKeypoints?: boolean;
  /** Whether to show skeleton lines */
  showSkeleton?: boolean;
  /** Minimum confidence score to show keypoint */
  minConfidence?: number;
  /** Color for skeleton lines */
  skeletonColor?: string;
  /** Color for keypoint dots */
  keypointColor?: string;
  /** Color for angle labels */
  labelColor?: string;
  /** Line width for skeleton */
  lineWidth?: number;
  /** Radius for keypoint dots */
  keypointRadius?: number;
}

// ============================================
// COMPONENT
// ============================================

export function SkeletonOverlay({
  width,
  height,
  pose,
  angles,
  showAngles = true,
  showKeypoints = true,
  showSkeleton = true,
  minConfidence = 0.3,
  skeletonColor = '#FF6B35',
  keypointColor = '#FFFFFF',
  labelColor = '#FF6B35',
  lineWidth = 3,
  keypointRadius = 6,
}: SkeletonOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Draw skeleton on canvas
  const drawSkeleton = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!pose || pose.keypoints.length === 0) return;

    const keypoints = pose.keypoints;

    // Draw skeleton connections
    if (showSkeleton) {
      ctx.strokeStyle = skeletonColor;
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (const [i, j] of SKELETON_CONNECTIONS) {
        const kp1 = keypoints[i];
        const kp2 = keypoints[j];

        if (
          kp1 && kp2 &&
          (kp1.score === undefined || kp1.score >= minConfidence) &&
          (kp2.score === undefined || kp2.score >= minConfidence)
        ) {
          ctx.beginPath();
          ctx.moveTo(kp1.x, kp1.y);
          ctx.lineTo(kp2.x, kp2.y);
          ctx.stroke();
        }
      }
    }

    // Draw keypoints
    if (showKeypoints) {
      for (const keypoint of keypoints) {
        if (keypoint.score === undefined || keypoint.score >= minConfidence) {
          // Outer circle (colored)
          ctx.fillStyle = skeletonColor;
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, keypointRadius, 0, 2 * Math.PI);
          ctx.fill();

          // Inner circle (white)
          ctx.fillStyle = keypointColor;
          ctx.beginPath();
          ctx.arc(keypoint.x, keypoint.y, keypointRadius - 2, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    }

    // Draw angle labels
    if (showAngles && angles) {
      ctx.font = 'bold 14px Inter, system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      // Helper to draw label with background
      const drawLabel = (
        x: number,
        y: number,
        text: string,
        offsetX: number = 15,
        offsetY: number = 0
      ) => {
        const labelX = x + offsetX;
        const labelY = y + offsetY;
        
        // Measure text
        const metrics = ctx.measureText(text);
        const padding = 6;
        const bgWidth = metrics.width + padding * 2;
        const bgHeight = 20;

        // Draw background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.roundRect(labelX - padding, labelY - bgHeight / 2, bgWidth, bgHeight, 4);
        ctx.fill();

        // Draw text
        ctx.fillStyle = labelColor;
        ctx.fillText(text, labelX, labelY);
      };

      // Elbow angle
      if (angles.elbowAngle !== null) {
        const elbow = keypoints[KEYPOINT_INDICES.right_elbow];
        if (elbow && (elbow.score === undefined || elbow.score >= minConfidence)) {
          drawLabel(elbow.x, elbow.y, `ELBOW ${angles.elbowAngle}°`, 20, -20);
        }
      }

      // Knee angle
      if (angles.kneeAngle !== null) {
        const knee = keypoints[KEYPOINT_INDICES.right_knee];
        if (knee && (knee.score === undefined || knee.score >= minConfidence)) {
          drawLabel(knee.x, knee.y, `KNEE ${angles.kneeAngle}°`, 20, 0);
        }
      }

      // Shoulder angle
      if (angles.shoulderAngle !== null) {
        const shoulder = keypoints[KEYPOINT_INDICES.right_shoulder];
        if (shoulder && (shoulder.score === undefined || shoulder.score >= minConfidence)) {
          drawLabel(shoulder.x, shoulder.y, `SHOULDER ${angles.shoulderAngle}°`, -120, -20);
        }
      }

      // Hip angle
      if (angles.hipAngle !== null) {
        const hip = keypoints[KEYPOINT_INDICES.right_hip];
        if (hip && (hip.score === undefined || hip.score >= minConfidence)) {
          drawLabel(hip.x, hip.y, `HIP ${angles.hipAngle}°`, -100, 0);
        }
      }
    }
  }, [
    pose,
    angles,
    width,
    height,
    showAngles,
    showKeypoints,
    showSkeleton,
    minConfidence,
    skeletonColor,
    keypointColor,
    labelColor,
    lineWidth,
    keypointRadius,
  ]);

  // Redraw when pose changes
  useEffect(() => {
    drawSkeleton();
  }, [drawSkeleton]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      style={{ width, height }}
    />
  );
}

export default SkeletonOverlay;


