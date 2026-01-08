/**
 * LiveFeedback Component
 * 
 * Displays real-time coaching tips and feedback during live analysis.
 */

"use client"

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Lightbulb, Target } from 'lucide-react';
import { type ShootingFormFeedback } from '@/services/poseDetection';

// ============================================
// TYPES
// ============================================

interface LiveFeedbackProps {
  /** Form feedback with tips */
  feedback: ShootingFormFeedback | null;
  /** Whether shooting motion is detected */
  isShootingDetected: boolean;
  /** Compact mode for smaller displays */
  compact?: boolean;
}

// ============================================
// COMPONENT
// ============================================

export function LiveFeedback({
  feedback,
  isShootingDetected,
  compact = false,
}: LiveFeedbackProps) {
  if (!feedback) {
    return null;
  }

  const { elbowStatus, kneeStatus, shoulderStatus, hipStatus, tips, overallScore } = feedback;

  // Count statuses
  const goodCount = [elbowStatus, kneeStatus, shoulderStatus, hipStatus].filter(
    (s) => s === 'good'
  ).length;
  const warningCount = [elbowStatus, kneeStatus, shoulderStatus, hipStatus].filter(
    (s) => s === 'warning'
  ).length;
  const criticalCount = [elbowStatus, kneeStatus, shoulderStatus, hipStatus].filter(
    (s) => s === 'critical'
  ).length;

  // Generate status messages
  const statusMessages: { icon: React.ReactNode; message: string; type: 'good' | 'warning' | 'critical' }[] = [];

  if (feedback.elbowStatus === 'good') {
    statusMessages.push({ icon: <CheckCircle className="w-4 h-4" />, message: 'Good elbow position', type: 'good' });
  }
  if (feedback.kneeStatus === 'good') {
    statusMessages.push({ icon: <CheckCircle className="w-4 h-4" />, message: 'Knees bent properly', type: 'good' });
  }
  if (feedback.shoulderStatus === 'good') {
    statusMessages.push({ icon: <CheckCircle className="w-4 h-4" />, message: 'Shoulder aligned', type: 'good' });
  }
  if (feedback.hipStatus === 'good') {
    statusMessages.push({ icon: <CheckCircle className="w-4 h-4" />, message: 'Hip position good', type: 'good' });
  }

  // Add warnings
  if (feedback.elbowStatus === 'warning') {
    statusMessages.push({ icon: <AlertTriangle className="w-4 h-4" />, message: feedback.elbowMessage, type: 'warning' });
  }
  if (feedback.kneeStatus === 'warning') {
    statusMessages.push({ icon: <AlertTriangle className="w-4 h-4" />, message: feedback.kneeMessage, type: 'warning' });
  }

  // Add criticals
  if (feedback.elbowStatus === 'critical') {
    statusMessages.push({ icon: <XCircle className="w-4 h-4" />, message: feedback.elbowMessage, type: 'critical' });
  }
  if (feedback.kneeStatus === 'critical') {
    statusMessages.push({ icon: <XCircle className="w-4 h-4" />, message: feedback.kneeMessage, type: 'critical' });
  }

  return (
    <div className={`${compact ? 'p-3' : 'p-4'} bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[#FF6B35]" />
          <span className="text-sm font-semibold text-[#FF6B35]">REAL-TIME FEEDBACK</span>
        </div>
        {isShootingDetected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/50 rounded-full"
          >
            <Target className="w-3 h-3 text-green-400" />
            <span className="text-xs font-medium text-green-400">SHOT DETECTED</span>
          </motion.div>
        )}
      </div>

      {/* Status Summary */}
      <div className="flex items-center gap-4 mb-3 text-xs">
        {goodCount > 0 && (
          <div className="flex items-center gap-1 text-green-400">
            <CheckCircle className="w-3 h-3" />
            <span>{goodCount} Good</span>
          </div>
        )}
        {warningCount > 0 && (
          <div className="flex items-center gap-1 text-yellow-400">
            <AlertTriangle className="w-3 h-3" />
            <span>{warningCount} Adjust</span>
          </div>
        )}
        {criticalCount > 0 && (
          <div className="flex items-center gap-1 text-red-400">
            <XCircle className="w-3 h-3" />
            <span>{criticalCount} Fix</span>
          </div>
        )}
      </div>

      {/* Feedback Messages */}
      <div className={`space-y-2 ${compact ? 'max-h-24' : 'max-h-32'} overflow-y-auto`}>
        <AnimatePresence mode="popLayout">
          {statusMessages.slice(0, compact ? 3 : 5).map((item, index) => (
            <motion.div
              key={`${item.message}-${index}`}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className={`
                flex items-center gap-2 text-sm p-2 rounded-lg
                ${item.type === 'good' 
                  ? 'text-green-400 bg-green-400/10' 
                  : item.type === 'warning'
                  ? 'text-yellow-400 bg-yellow-400/10'
                  : 'text-red-400 bg-red-400/10'
                }
              `}
            >
              {item.icon}
              <span className="truncate">{item.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Tips */}
      {tips.length > 0 && (
        <div className="mt-3 pt-3 border-t border-[#3a3a3a]">
          <div className="text-xs text-[#888] mb-2">💡 Tips:</div>
          <ul className="space-y-1">
            {tips.slice(0, 2).map((tip, index) => (
              <li key={index} className="text-xs text-[#E5E5E5] flex items-start gap-2">
                <span className="text-[#FF6B35]">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default LiveFeedback;





