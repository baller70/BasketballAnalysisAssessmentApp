/**
 * RecordingControls Component
 * 
 * Controls for recording video and capturing frames during live analysis.
 */

"use client"

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Circle, 
  Square, 
  Camera, 
  RotateCcw, 
  FlipHorizontal,
  Pause,
  Play,
} from 'lucide-react';

// ============================================
// TYPES
// ============================================

interface RecordingControlsProps {
  /** Whether currently recording */
  isRecording: boolean;
  /** Recording duration in seconds */
  recordingDuration: number;
  /** Whether camera is paused */
  isPaused: boolean;
  /** Whether model is loading */
  isLoading: boolean;
  /** Callback to start recording */
  onStartRecording: () => void;
  /** Callback to stop recording */
  onStopRecording: () => void;
  /** Callback to capture a single frame */
  onCaptureFrame: () => void;
  /** Callback to flip camera (front/back) */
  onFlipCamera: () => void;
  /** Callback to toggle pause */
  onTogglePause: () => void;
  /** Callback to reset/restart */
  onReset: () => void;
  /** Number of captured frames */
  capturedFramesCount?: number;
  /** Whether flip camera is available */
  canFlipCamera?: boolean;
}

// ============================================
// HELPERS
// ============================================

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

// ============================================
// COMPONENT
// ============================================

export function RecordingControls({
  isRecording,
  recordingDuration,
  isPaused,
  isLoading,
  onStartRecording,
  onStopRecording,
  onCaptureFrame,
  onFlipCamera,
  onTogglePause,
  onReset,
  capturedFramesCount = 0,
  canFlipCamera = true,
}: RecordingControlsProps) {
  return (
    <div className="p-4 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
      {/* Recording Status */}
      {isRecording && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="w-3 h-3 bg-red-500 rounded-full"
          />
          <span className="text-red-400 font-mono text-lg font-bold">
            {formatDuration(recordingDuration)}
          </span>
          <span className="text-[#888] text-sm">RECORDING</span>
        </div>
      )}

      {/* Main Controls */}
      <div className="flex items-center justify-center gap-4">
        {/* Flip Camera */}
        {canFlipCamera && (
          <button
            onClick={onFlipCamera}
            disabled={isLoading || isRecording}
            className={`
              p-3 rounded-full transition-all
              ${isLoading || isRecording
                ? 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
                : 'bg-[#3a3a3a] text-[#E5E5E5] hover:bg-[#4a4a4a] hover:text-white'
              }
            `}
            title="Flip Camera"
          >
            <FlipHorizontal className="w-5 h-5" />
          </button>
        )}

        {/* Capture Frame */}
        <button
          onClick={onCaptureFrame}
          disabled={isLoading || isPaused}
          className={`
            p-3 rounded-full transition-all
            ${isLoading || isPaused
              ? 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50'
            }
          `}
          title="Capture Frame"
        >
          <Camera className="w-5 h-5" />
        </button>

        {/* Record Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isLoading}
          className={`
            p-4 rounded-full transition-all
            ${isLoading
              ? 'bg-[#3a3a3a] cursor-not-allowed'
              : isRecording
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-red-500/20 hover:bg-red-500/30 border-2 border-red-500'
            }
          `}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <Square className="w-6 h-6 text-white fill-white" />
          ) : (
            <Circle className="w-6 h-6 text-red-500 fill-red-500" />
          )}
        </motion.button>

        {/* Pause/Play */}
        <button
          onClick={onTogglePause}
          disabled={isLoading}
          className={`
            p-3 rounded-full transition-all
            ${isLoading
              ? 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
              : isPaused
              ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'
              : 'bg-[#3a3a3a] text-[#E5E5E5] hover:bg-[#4a4a4a]'
            }
          `}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            <Play className="w-5 h-5" />
          ) : (
            <Pause className="w-5 h-5" />
          )}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          disabled={isLoading || isRecording}
          className={`
            p-3 rounded-full transition-all
            ${isLoading || isRecording
              ? 'bg-[#3a3a3a] text-[#666] cursor-not-allowed'
              : 'bg-[#3a3a3a] text-[#E5E5E5] hover:bg-[#4a4a4a] hover:text-white'
            }
          `}
          title="Reset"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>

      {/* Captured Frames Counter */}
      {capturedFramesCount > 0 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-[#888]">
            {capturedFramesCount} frame{capturedFramesCount !== 1 ? 's' : ''} captured
          </span>
        </div>
      )}

      {/* Instructions */}
      <div className="mt-4 pt-4 border-t border-[#3a3a3a]">
        <div className="flex flex-wrap justify-center gap-4 text-xs text-[#888]">
          <div className="flex items-center gap-1">
            <Circle className="w-3 h-3 text-red-500" />
            <span>Record video</span>
          </div>
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-blue-400" />
            <span>Capture frame</span>
          </div>
          <div className="flex items-center gap-1">
            <FlipHorizontal className="w-3 h-3" />
            <span>Flip camera</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RecordingControls;


