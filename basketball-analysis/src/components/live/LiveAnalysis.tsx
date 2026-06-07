/**
 * LiveAnalysis Component
 * 
 * Main component for real-time pose detection and shooting form analysis.
 * Combines camera feed, skeleton overlay, metrics, and feedback.
 */

"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Video, AlertCircle, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { usePoseDetection } from '@/hooks/usePoseDetection';
import { SkeletonOverlay } from './SkeletonOverlay';
import { LiveMetrics } from './LiveMetrics';
import { LiveFeedback } from './LiveFeedback';
import { RecordingControls } from './RecordingControls';
import { useAnalysisStore } from '@/stores/analysisStore';
import { useRouter } from 'next/navigation';
import { isMobile } from '@/utils/platform';

// ============================================
// TYPES
// ============================================

interface CapturedFrame {
  id: string;
  dataUrl: string;
  timestamp: number;
  angles: any;
  feedback: any;
}

// ============================================
// COMPONENT
// ============================================

export function LiveAnalysis() {
  const router = useRouter();
  const { setUploadedFile, setUploadedImageBase64, setVideoAnalysisData } = useAnalysisStore();

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // State
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({ width: 640, height: 480 });

  // Pose detection hook
  const {
    isLoading,
    isDetecting,
    error: poseError,
    pose,
    angles,
    feedback,
    fps,
    isShootingDetected,
    startDetection,
    stopDetection,
  } = usePoseDetection({
    modelType: 'lightning',
    targetFps: 30,
    onShootingDetected: (detectedPose) => {
      console.log('[LiveAnalysis] Shooting motion detected!');
      // Could auto-capture frame here
    },
  });

  // Initialize camera
  const initCamera = useCallback(async () => {
    try {
      setCameraError(null);
      setCameraReady(false);

      // Stop existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Request camera access
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (e: any) {
        console.log('[LiveAnalysis] Failed with constraints, trying fallback:', e.message);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Wait for video to be ready
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            setCameraReady(true);
          }
        };
      }
    } catch (err: any) {
      console.log('[LiveAnalysis] Camera error:', err);
      // Automatically fallback to demo video!
      console.log('[LiveAnalysis] Automatically falling back to demo video');
      if (videoRef.current) {
        setCameraError(null);
        videoRef.current.srcObject = null;
        videoRef.current.src = '/demo-basketball.mp4';
        videoRef.current.loop = true;
        videoRef.current.muted = true;
        
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play();
            setVideoDimensions({
              width: videoRef.current.videoWidth,
              height: videoRef.current.videoHeight,
            });
            setCameraReady(true);
          }
        };
      }
    }
  }, [facingMode]);

  // Start detection when camera is ready
  useEffect(() => {
    if (cameraReady && videoRef.current && !isLoading && !isDetecting) {
      startDetection(videoRef.current);
    }
  }, [cameraReady, isLoading, isDetecting, startDetection]);

  // Initialize camera on mount
  useEffect(() => {
    initCamera();

    return () => {
      // Cleanup
      stopDetection();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [initCamera, stopDetection]);

  // Recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording && !isPaused) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, isPaused]);

  // Flip camera
  const handleFlipCamera = useCallback(() => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  }, []);

  // Re-init camera when facing mode changes
  useEffect(() => {
    if (cameraReady) {
      stopDetection();
      initCamera();
    }
  }, [facingMode]);

  // Start recording
  const handleStartRecording = useCallback(() => {
    if (!streamRef.current) return;

    recordedChunksRef.current = [];
    setRecordingDuration(0);

    const mediaRecorder = new MediaRecorder(streamRef.current, {
      mimeType: 'video/webm;codecs=vp9',
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        recordedChunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      
      // Store video for analysis
      setVideoAnalysisData({
        videoUrl: url,
        frames: capturedFrames.map(f => ({
          url: f.dataUrl,
          timestamp: f.timestamp,
          angles: f.angles,
        })),
      });

      // Navigate to results
      router.push('/results/demo');
    };

    mediaRecorderRef.current = mediaRecorder;
    mediaRecorder.start(1000); // Capture in 1-second chunks
    setIsRecording(true);
  }, [capturedFrames, router, setVideoAnalysisData]);

  // Stop recording
  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  }, []);

  // Capture frame
  const handleCaptureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.drawImage(video, 0, 0);

    // Get data URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);

    // Create captured frame
    const frame: CapturedFrame = {
      id: `frame-${Date.now()}`,
      dataUrl,
      timestamp: recordingDuration,
      angles,
      feedback,
    };

    setCapturedFrames(prev => [...prev, frame]);

    // Also set as uploaded image for single-frame analysis
    setUploadedImageBase64(dataUrl);
  }, [angles, feedback, recordingDuration, setUploadedImageBase64]);

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    
    if (isPaused) {
      // Resume detection
      if (videoRef.current) {
        startDetection(videoRef.current);
      }
    } else {
      // Pause detection
      stopDetection();
    }
  }, [isPaused, startDetection, stopDetection]);

  // Reset
  const handleReset = useCallback(() => {
    setCapturedFrames([]);
    setRecordingDuration(0);
    setIsPaused(false);
    
    if (!isDetecting && videoRef.current) {
      startDetection(videoRef.current);
    }
  }, [isDetecting, startDetection]);

  // Toggle fullscreen
  const handleToggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Error state
  if (cameraError) {
    return (
      <div className="p-6 bg-[#2a2a2a] rounded-lg border border-red-500/50">
        <div className="flex items-center gap-3 text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
          <span className="font-semibold">Camera Error</span>
        </div>
        <p className="text-[#E5E5E5] mb-4">{cameraError}</p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={initCamera}
            className="px-4 py-2 bg-[#FF6B35] text-white rounded-lg hover:bg-[#FF6B35]/90 transition-colors whitespace-nowrap"
          >
            Retry
          </button>
          <label className="px-4 py-2 bg-[#3a3a3a] text-white rounded-lg hover:bg-[#4a4a4a] transition-colors whitespace-nowrap cursor-pointer">
            Upload Demo Video
            <input 
              type="file" 
              accept="video/*" 
              className="hidden" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && videoRef.current) {
                  setCameraError(null);
                  videoRef.current.srcObject = null;
                  videoRef.current.src = URL.createObjectURL(file);
                  videoRef.current.loop = true;
                  videoRef.current.play().then(() => {
                    setVideoDimensions({
                      width: videoRef.current!.videoWidth,
                      height: videoRef.current!.videoHeight,
                    });
                    setCameraReady(true);
                  }).catch(err => {
                    setCameraError("Failed to play uploaded video.");
                  });
                }
              }} 
            />
          </label>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 text-[#FF6B35] animate-spin mb-4" />
          <p className="text-[#E5E5E5] font-medium">Loading pose detection model...</p>
          <p className="text-[#888] text-sm mt-2">This may take a few seconds on first load</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isFullscreen ? 'fixed inset-0 z-50 bg-[#1a1a1a] p-4' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-[#FF6B35]" />
          <h2 className="text-lg font-semibold text-[#FF6B35]">Live Analysis</h2>
          {isDetecting && (
            <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
              {fps} FPS
            </span>
          )}
        </div>
        <button
          onClick={handleToggleFullscreen}
          className="p-2 hover:bg-[#3a3a3a] rounded-lg transition-colors"
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-[#E5E5E5]" />
          ) : (
            <Maximize2 className="w-5 h-5 text-[#E5E5E5]" />
          )}
        </button>
      </div>

      {/* Camera Feed with Overlay */}
      <div 
        className="relative bg-black rounded-lg overflow-hidden"
        style={{ 
          aspectRatio: '16/9',
          maxHeight: isFullscreen ? 'calc(100vh - 300px)' : '400px',
        }}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
        />

        {/* Skeleton Overlay */}
        <AnimatePresence>
          {pose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            >
              <SkeletonOverlay
                width={videoDimensions.width}
                height={videoDimensions.height}
                pose={pose}
                angles={angles}
                showAngles={true}
                showKeypoints={true}
                showSkeleton={true}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 bg-red-500/90 rounded-full">
            <motion.div
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
              className="w-2 h-2 bg-white rounded-full"
            />
            <span className="text-white text-sm font-medium">REC</span>
          </div>
        )}

        {/* Shot Detected Indicator */}
        <AnimatePresence>
          {isShootingDetected && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute top-4 right-4 px-3 py-1.5 bg-green-500/90 rounded-full"
            >
              <span className="text-white text-sm font-medium">🏀 SHOT DETECTED</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera not ready overlay */}
        {!cameraReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#1a1a1a]/80">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin mb-2" />
              <span className="text-[#888]">Starting camera...</span>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Metrics and Feedback */}
      <div className={`grid ${isFullscreen ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2'} gap-4`}>
        <LiveMetrics
          angles={angles}
          feedback={feedback}
          poseDetected={pose !== null}
          fps={fps}
          compact={!isFullscreen}
        />
        <LiveFeedback
          feedback={feedback}
          isShootingDetected={isShootingDetected}
          compact={!isFullscreen}
        />
      </div>

      {/* Recording Controls */}
      <RecordingControls
        isRecording={isRecording}
        recordingDuration={recordingDuration}
        isPaused={isPaused}
        isLoading={isLoading || !cameraReady}
        onStartRecording={handleStartRecording}
        onStopRecording={handleStopRecording}
        onCaptureFrame={handleCaptureFrame}
        onFlipCamera={handleFlipCamera}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        capturedFramesCount={capturedFrames.length}
        canFlipCamera={isMobile()}
      />

      {/* Captured Frames Preview */}
      {capturedFrames.length > 0 && (
        <div className="p-4 bg-[#2a2a2a] rounded-lg border border-[#3a3a3a]">
          <h3 className="text-sm font-semibold text-[#FF6B35] mb-3">
            Captured Frames ({capturedFrames.length})
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {capturedFrames.map((frame, index) => (
              <div
                key={frame.id}
                className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 border-[#3a3a3a] hover:border-[#FF6B35] transition-colors cursor-pointer"
                onClick={() => {
                  setUploadedImageBase64(frame.dataUrl);
                  router.push('/results/demo');
                }}
              >
                <img
                  src={frame.dataUrl}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pose Error */}
      {poseError && (
        <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{poseError.message}</p>
        </div>
      )}
    </div>
  );
}

export default LiveAnalysis;






