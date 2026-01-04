/**
 * usePoseDetection Hook
 * 
 * React hook for real-time pose detection using MoveNet.
 * Handles initialization, cleanup, and continuous detection loop.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  poseDetectionService,
  type Pose,
  type ShootingAngles,
  type ShootingFormFeedback,
  type ModelType,
} from '@/services/poseDetection';

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
  const [fps, setFps] = useState(0);
  const [isShootingDetected, setIsShootingDetected] = useState(false);

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
        await poseDetectionService.initialize(modelType);
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
  }, [modelType]);

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
      // Detect pose
      const detectedPose = await poseDetectionService.detectPose(video);

      if (detectedPose) {
        setPose(detectedPose);

        // Calculate angles
        const calculatedAngles = poseDetectionService.calculateShootingAngles(detectedPose);
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
  }, [targetFps, onPoseDetected, onShootingDetected]);

  // Start detection
  const startDetection = useCallback((videoElement: HTMLVideoElement) => {
    if (isLoading || !poseDetectionService.isReady()) {
      console.warn('[usePoseDetection] Model not ready');
      return;
    }

    videoRef.current = videoElement;
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
  }, [isLoading, runDetection]);

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
  }, []);

  // Detect single frame
  const detectSingleFrame = useCallback(async (
    input: HTMLImageElement | HTMLCanvasElement
  ) => {
    if (!poseDetectionService.isReady()) {
      return { pose: null, angles: null, feedback: null };
    }

    const detectedPose = await poseDetectionService.detectPose(input);

    if (!detectedPose) {
      return { pose: null, angles: null, feedback: null };
    }

    const calculatedAngles = poseDetectionService.calculateShootingAngles(detectedPose);
    const formFeedback = poseDetectionService.analyzeShootingForm(calculatedAngles);

    return {
      pose: detectedPose,
      angles: calculatedAngles,
      feedback: formFeedback,
    };
  }, []);

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
    fps,
    isShootingDetected,
    startDetection,
    stopDetection,
    detectSingleFrame,
  };
}

export default usePoseDetection;


