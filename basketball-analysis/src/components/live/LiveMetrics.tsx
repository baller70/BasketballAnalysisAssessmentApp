/**
 * LiveMetrics Component
 * 
 * Displays real-time shooting form metrics (angles) during live analysis.
 */

"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { type ShootingAngles, type ShootingFormFeedback } from '@/services/poseDetection';

// ============================================
// TYPES
// ============================================

interface LiveMetricsProps {
  /** Current shooting angles */
  angles: ShootingAngles | null;
  /** Form feedback with status indicators */
  feedback: ShootingFormFeedback | null;
  /** Whether pose is currently detected */
  poseDetected: boolean;
  /** Current FPS */
  fps?: number;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// ============================================
// HELPERS
// ============================================

const getStatusColor = (status: string): string => {
  switch (status) {
    case 'good':
      return 'text-green-400 border-green-400/50 bg-green-400/10';
    case 'warning':
      return 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10';
    case 'critical':
      return 'text-red-400 border-red-400/50 bg-red-400/10';
    default:
      return 'text-gray-400 border-gray-400/50 bg-gray-400/10';
  }
};

const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'good':
      return '✓';
    case 'warning':
      return '⚠';
    case 'critical':
      return '✗';
    default:
      return '?';
  }
};

// ============================================
// COMPONENT
// ============================================

export function LiveMetrics({
  angles,
  feedback,
  poseDetected,
  fps,
  compact = false,
}: LiveMetricsProps) {
  if (!poseDetected || !angles) {
    return (
      <div className={`${compact ? 'p-3' : 'p-4'} bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]`}>
        <div className="flex items-center justify-center gap-2 text-[#888]">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
          <span className="text-sm">Waiting for pose detection...</span>
        </div>
        <p className="text-xs text-[#666] text-center mt-2">
          Position yourself in frame with your full body visible
        </p>
      </div>
    );
  }

  const metrics = [
    {
      label: 'ELBOW',
      value: angles.elbowAngle,
      status: feedback?.elbowStatus || 'unknown',
      message: feedback?.elbowMessage || '',
    },
    {
      label: 'KNEE',
      value: angles.kneeAngle,
      status: feedback?.kneeStatus || 'unknown',
      message: feedback?.kneeMessage || '',
    },
    {
      label: 'SHOULDER',
      value: angles.shoulderAngle,
      status: feedback?.shoulderStatus || 'unknown',
      message: feedback?.shoulderMessage || '',
    },
    {
      label: 'HIP',
      value: angles.hipAngle,
      status: feedback?.hipStatus || 'unknown',
      message: feedback?.hipMessage || '',
    },
  ];

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-semibold text-[#FF6B35]">LIVE METRICS</span>
        </div>
        {fps !== undefined && (
          <span className="text-xs text-[#888]">{fps} FPS</span>
        )}
      </div>

      {/* Metrics Grid */}
      <div className={`grid ${compact ? 'grid-cols-2 gap-2' : 'grid-cols-4 gap-3'}`}>
        {metrics.map((metric) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`
              p-2 rounded-lg border text-center
              ${getStatusColor(metric.status)}
            `}
          >
            <div className="text-xs font-medium opacity-80">{metric.label}</div>
            <div className="text-lg font-bold flex items-center justify-center gap-1">
              {metric.value !== null ? (
                <>
                  {metric.value}°
                  <span className="text-sm">{getStatusIcon(metric.status)}</span>
                </>
              ) : (
                <span className="text-sm">--</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Overall Score */}
      {feedback && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#888]">Form Score</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${feedback.overallScore}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full ${
                    feedback.overallScore >= 80
                      ? 'bg-green-500'
                      : feedback.overallScore >= 60
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                />
              </div>
              <span className={`text-sm font-bold ${
                feedback.overallScore >= 80
                  ? 'text-green-400'
                  : feedback.overallScore >= 60
                  ? 'text-yellow-400'
                  : 'text-red-400'
              }`}>
                {feedback.overallScore}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveMetrics;






