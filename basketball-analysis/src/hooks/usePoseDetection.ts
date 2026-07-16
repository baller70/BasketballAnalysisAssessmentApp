/**
 * usePoseDetection Hook
 * 
 * React hook for real-time pose detection using MoveNet.
 * Handles initialization, cleanup, and continuous detection loop.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  poseDetectionService,
  type Pose,
  type ShootingAngles,
  type ShootingFormFeedback,
  type ModelType,
} from '@/services/poseDetection';
import {
  getPoseProvider,
  providerKeypointsToPose,
  type FormAnalysis,
} from '@/services/pose';
import { selectRuntimePoseProviderId } from '@/services/pose/runtime';
import { getPlatform } from '@/utils/platform';

// ============================================
// TYPES
// ============================================

export interface UsePoseDetectionOptions {
  /** Model type: 'lightning' (faster) or 'thunder' (more accurate) */
  modelType?: ModelType;
  /** Whether to start detection automatically */
  autoStart?: boolean;
  /** Target FPS for detection loop */
  targetFps?: number;
  /** Prepare a live video frame before it is passed to the pose model */
  prepareVideoFrame?: (video: HTMLVideoElement) => HTMLVideoElement | HTMLCanvasElement;
  /** Callback when pose is detected */
  onPoseDetected?: (pose: Pose, angles: ShootingAngles, feedback: ShootingFormFeedback) => void;
  /** Callback when shooting motion is detected */
  onShootingDetected?: (pose: Pose) => void;
}

export interface UsePoseDetectionReturn {
  /** Whether the model is loading */
  isLoading: boolean;
  /** Whether detection is currently running */
  isDetecting: boolean;
  /** Any error that occurred */
  error: Error | null;
  /** Current detected pose */
  pose: Pose | null;
  /** Current shooting angles */
  angles: ShootingAngles | null;
  /** Current form feedback */
  feedback: ShootingFormFeedback | null;
  /** Canonical provider analysis, including mechanics/phase sidecars. */
  analysis: FormAnalysis | null;
  /** Current FPS */
  fps: number;
  /** Whether shooting motion is detected */
  isShootingDetected: boolean;
  /** Start detection on a video element */
  startDetection: (videoElement: HTMLVideoElement) => void;
  /** Stop detection */
  stopDetection: () => void;
  /** Detect pose on a single frame (image or canvas) */
  detectSingleFrame: (input: HTMLImageElement | HTMLCanvasElement) => Promise<{
    pose: Pose | null;
    angles: ShootingAngles | null;
    feedback: ShootingFormFeedback | null;
    analysis: FormAnalysis | null;
  }>;
}

// ============================================
// HOOK
// ============================================

export function usePoseDetection(
  options: UsePoseDetectionOptions = {}
): UsePoseDetectionReturn {
  const {
    modelType = 'lightning',
    autoStart = false,
    targetFps = 30,
    prepareVideoFrame,
    onPoseDetected,
    onShootingDetected,
  } = options;

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [pose, setPose] = useState<Pose | null>(null);
  const [angles, setAngles] = useState<ShootingAngles | null>(null);
  const [feedback, setFeedback] = useState<ShootingFormFeedback | null>(null);
  const [analysis, setAnalysis] = useState<FormAnalysis | null>(null);
  const [fps, setFps] = useState(0);
  const [isShootingDetected, setIsShootingDetected] = useState(false);

  // All live frames use the same provider seam as image and uploaded-video
  // analysis. The model selection remains configurable for multi-person live
  // tracking, but callers no longer bypass the canonical adapter.
  const poseProvider = useMemo(
    () => getPoseProvider(selectRuntimePoseProviderId(getPlatform()), modelType),
    [modelType]
  );

  // Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const fpsIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousPoseRef = useRef<Pose | null>(null);
  const isDetectingRef = useRef(false);

  // Initialize the model
  useEffect(() => {
    let mounted = true;

    const initModel = async () => {
      try {
        setIsLoading(true);
        setError(null);
        await poseProvider.init();
        if (mounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to initialize pose detection'));
          setIsLoading(false);
        }
      }
    };

    initModel();

    return () => {
      mounted = false;
    };
  }, [poseProvider]);

  // Detection loop
  const runDetection = useCallback(async () => {
    if (!videoRef.current || !isDetectingRef.current) {
      return;
    }

    const video = videoRef.current;
    
    // Check if video is ready
    if (video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    // Throttle to target FPS
    const now = performance.now();
    const elapsed = now - lastFrameTimeRef.current;
    const targetInterval = 1000 / targetFps;

    if (elapsed < targetInterval) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    lastFrameTimeRef.current = now;
    frameCountRef.current++;

    try {
      // Normalize browser-specific camera pixels before model inference when
      // requested. Images and ordinary video elements continue through as-is.
      const detectionInput = prepareVideoFrame ? prepareVideoFrame(video) : video;
      // Canvas-prepared iPhone frames do not carry HTMLVideoElement.currentTime.
      // Pass the source timestamp explicitly so MoveNet's temporal filter keeps
      // smoothing across calibrated frames.
      // MediaStream-backed video elements may report currentTime as zero. Use
      // the rAF clock in that case so the canonical phase sidecar still gets a
      // real monotonic timestamp for every live frame.
      const timestampMs = Number.isFinite(video.currentTime) && video.currentTime > 0
        ? video.currentTime * 1000
        : now;
      const detectedKeypoints = await poseProvider.detectPose(detectionInput, timestampMs);
      const detectedPose = detectedKeypoints
        ? providerKeypointsToPose(detectedKeypoints)
        : null;

      if (detectedPose) {
        setPose(detectedPose);

        // All live frames go through the canonical provider analysis. Keep the
        // legacy angle/feedback shape for existing overlays while exposing the
        // full gated mechanics + shot phase metadata to newer consumers.
        const canonicalAnalysis = poseProvider.analyzeForm(detectedKeypoints!, timestampMs);
        setAnalysis(canonicalAnalysis);
        const calculatedAngles: ShootingAngles = {
          elbowAngle: canonicalAnalysis.angles.elbow,
          kneeAngle: canonicalAnalysis.angles.knee,
          shoulderAngle: canonicalAnalysis.angles.shoulder,
          hipAngle: canonicalAnalysis.angles.hip,
          releaseAngle: canonicalAnalysis.angles.release,
          wristAngle: canonicalAnalysis.angles.wrist,
        };
        setAngles(calculatedAngles);

        // Get feedback
        const formFeedback = poseDetectionService.analyzeShootingForm(calculatedAngles);
        setFeedback(formFeedback);

        // Check for shooting motion
        const shooting = poseDetectionService.detectShootingMotion(
          detectedPose,
          previousPoseRef.current || undefined
        );
        setIsShootingDetected(shooting);

        // Callbacks
        if (onPoseDetected) {
          onPoseDetected(detectedPose, calculatedAngles, formFeedback);
        }

        if (shooting && onShootingDetected) {
          onShootingDetected(detectedPose);
        }

        // Store for next frame comparison
        previousPoseRef.current = detectedPose;
      }
    } catch (err) {
      console.error('[usePoseDetection] Detection error:', err);
    }

    // Continue loop
    if (isDetectingRef.current) {
      animationFrameRef.current = requestAnimationFrame(runDetection);
    }
  }, [targetFps, prepareVideoFrame, onPoseDetected, onShootingDetected, poseProvider]);

  // Start detection
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (isLoading || !poseProvider.isReady()) {
      console.warn('[usePoseDetection] Model not ready');
      return;
    }

    videoRef.current = videoElement;
    poseProvider.reset?.();
    isDetectingRef.current = true;
    setIsDetecting(true);
    lastFrameTimeRef.current = performance.now();
    frameCountRef.current = 0;

    // Start FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current);
      frameCountRef.current = 0;
    }, 1000);

    // Start detection loop
    runDetection();
  }, [isLoading, poseProvider, runDetection]);

  // Stop detection
  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    setIsDetecting(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (fpsIntervalRef.current) {
      clearInterval(fpsIntervalRef.current);
      fpsIntervalRef.current = null;
    }

    setFps(0);
    previousPoseRef.current = null;
    setAnalysis(null);
    poseProvider.reset?.();
  }, [poseProvider]);

  // Detect single frame
  const detectSingleFrame = useCallback(async (
    input: HTMLImageElement | HTMLCanvasElement
  ) => {
    if (!poseProvider.isReady()) {
      return { pose: null, angles: null, feedback: null, analysis: null };
    }

    // A single image is its own session; do not carry a prior live phase into
    // the image's canonical sidecar.
    poseProvider.reset?.();
    const detectedKeypoints = await poseProvider.detectPose(input);
    const detectedPose = detectedKeypoints
      ? providerKeypointsToPose(detectedKeypoints)
      : null;

    if (!detectedPose) {
      return { pose: null, angles: null, feedback: null, analysis: null };
    }

    const canonicalAnalysis = poseProvider.analyzeForm(detectedKeypoints!);
    const calculatedAngles: ShootingAngles = {
      elbowAngle: canonicalAnalysis.angles.elbow,
      kneeAngle: canonicalAnalysis.angles.knee,
      shoulderAngle: canonicalAnalysis.angles.shoulder,
      hipAngle: canonicalAnalysis.angles.hip,
      releaseAngle: canonicalAnalysis.angles.release,
      wristAngle: canonicalAnalysis.angles.wrist,
    };
    const formFeedback = poseDetectionService.analyzeShootingForm(calculatedAngles);

    return {
      pose: detectedPose,
      angles: calculatedAngles,
      feedback: formFeedback,
      analysis: canonicalAnalysis,
    };
  }, [poseProvider]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopDetection();
    };
  }, [stopDetection]);

  // Auto-start if enabled and video is provided
  useEffect(() => {
    if (autoStart && videoRef.current && !isLoading && !isDetecting) {
      startDetection(videoRef.current);
    }
  }, [autoStart, isLoading, isDetecting, startDetection]);

  return {
    isLoading,
    isDetecting,
    error,
    pose,
    angles,
    feedback,
    analysis,
    fps,
    isShootingDetected,
    startDetection,
    stopDetection,
    detectSingleFrame,
  };
}

export default usePoseDetection;
