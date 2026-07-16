/**
 * Pose Detection Service
 * 
 * Real-time pose detection using TensorFlow.js MoveNet model.
 * Optimized for basketball shooting form analysis.
 * 
 * Features:
 * - Real-time pose detection (25-30 FPS on modern devices)
 * - 17 keypoint detection (shoulders, elbows, wrists, hips, knees, ankles)
 * - Angle calculations for shooting form analysis
 * - Shooting motion detection
 */

import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';

// ============================================
// TYPES
// ============================================

export interface Keypoint {
  x: number;
  y: number;
  score?: number;
  name?: string;
}

export interface Pose {
  keypoints: Keypoint[];
  score?: number;
  id?: number;
}

export interface ShootingAngles {
  elbowAngle: number | null;
  kneeAngle: number | null;
  shoulderAngle: number | null;
  hipAngle: number | null;
  releaseAngle: number | null;
  wristAngle: number | null;
}

export interface ShootingFormFeedback {
  elbowStatus: 'good' | 'warning' | 'critical' | 'unknown';
  elbowMessage: string;
  kneeStatus: 'good' | 'warning' | 'critical' | 'unknown';
  kneeMessage: string;
  shoulderStatus: 'good' | 'warning' | 'critical' | 'unknown';
  shoulderMessage: string;
  hipStatus: 'good' | 'warning' | 'critical' | 'unknown';
  hipMessage: string;
  releaseStatus: 'good' | 'warning' | 'critical' | 'unknown';
  releaseMessage: string;
  wristStatus: 'good' | 'warning' | 'critical' | 'unknown';
  wristMessage: string;
  overallScore: number;
  tips: string[];
}

export type ModelType = 'lightning' | 'thunder' | 'multipose';

// ============================================
// KEYPOINT INDICES (MoveNet)
// ============================================

export const KEYPOINT_INDICES = {
  nose: 0,
  left_eye: 1,
  right_eye: 2,
  left_ear: 3,
  right_ear: 4,
  left_shoulder: 5,
  right_shoulder: 6,
  left_elbow: 7,
  right_elbow: 8,
  left_wrist: 9,
  right_wrist: 10,
  left_hip: 11,
  right_hip: 12,
  left_knee: 13,
  right_knee: 14,
  left_ankle: 15,
  right_ankle: 16,
} as const;

// Skeleton connections for drawing
export const SKELETON_CONNECTIONS: [number, number][] = [
  // Face
  [KEYPOINT_INDICES.left_ear, KEYPOINT_INDICES.left_eye],
  [KEYPOINT_INDICES.left_eye, KEYPOINT_INDICES.nose],
  [KEYPOINT_INDICES.nose, KEYPOINT_INDICES.right_eye],
  [KEYPOINT_INDICES.right_eye, KEYPOINT_INDICES.right_ear],
  // Upper body
  [KEYPOINT_INDICES.left_shoulder, KEYPOINT_INDICES.right_shoulder],
  [KEYPOINT_INDICES.left_shoulder, KEYPOINT_INDICES.left_elbow],
  [KEYPOINT_INDICES.left_elbow, KEYPOINT_INDICES.left_wrist],
  [KEYPOINT_INDICES.right_shoulder, KEYPOINT_INDICES.right_elbow],
  [KEYPOINT_INDICES.right_elbow, KEYPOINT_INDICES.right_wrist],
  // Torso
  [KEYPOINT_INDICES.left_shoulder, KEYPOINT_INDICES.left_hip],
  [KEYPOINT_INDICES.right_shoulder, KEYPOINT_INDICES.right_hip],
  [KEYPOINT_INDICES.left_hip, KEYPOINT_INDICES.right_hip],
  // Lower body
  [KEYPOINT_INDICES.left_hip, KEYPOINT_INDICES.left_knee],
  [KEYPOINT_INDICES.left_knee, KEYPOINT_INDICES.left_ankle],
  [KEYPOINT_INDICES.right_hip, KEYPOINT_INDICES.right_knee],
  [KEYPOINT_INDICES.right_knee, KEYPOINT_INDICES.right_ankle],
];

// ============================================
// POSE DETECTION CLASS
// ============================================

class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitializing = false;
  private modelType: ModelType = 'lightning';
  private activePoseId: number | null = null;
  
  /**
   * Initialize the MoveNet pose detector
   */
  async initialize(modelType: ModelType = 'lightning'): Promise<void> {
    if (this.detector && this.modelType === modelType) {
      console.log('[PoseDetection] Already initialized');
      return;
    }
    
    if (this.isInitializing) {
      console.log('[PoseDetection] Already initializing, waiting...');
      while (this.isInitializing) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      if (this.detector && this.modelType === modelType) return;
    }

    // Image mode can initialize a single-person detector before the user opens
    // Live mode. Replace it so Live mode actually receives tracked pose IDs.
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.activePoseId = null;
    }
    
    this.isInitializing = true;
    this.modelType = modelType;
    
    try {
      console.log(`[PoseDetection] Initializing MoveNet ${modelType}...`);
      
      // Ensure TensorFlow.js is ready
      await tf.ready();
      console.log('[PoseDetection] TensorFlow.js ready, backend:', tf.getBackend());
      
      // Create detector with MoveNet
      const model = modelType === 'multipose'
        ? poseDetection.movenet.modelType.MULTIPOSE_LIGHTNING
        : modelType === 'lightning'
          ? poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING
          : poseDetection.movenet.modelType.SINGLEPOSE_THUNDER;

      const modelConfig = modelType === 'multipose'
        ? {
            modelType: model,
            enableSmoothing: true,
            minPoseScore: 0.3,
            multiPoseMaxDimension: 384,
            enableTracking: true,
            trackerType: poseDetection.TrackerType.Keypoint,
          }
        : {
            modelType: model,
            enableSmoothing: true,
            minPoseScore: 0.25,
          };
      
      this.detector = await poseDetection.createDetector(
        poseDetection.SupportedModels.MoveNet,
        modelConfig
      );
      
      console.log('[PoseDetection] MoveNet initialized successfully');
    } catch (error) {
      console.error('[PoseDetection] Failed to initialize:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
  
  /**
   * Detect pose from video element or image
   */
  async detectPose(
    input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement,
    timestampMs?: number
  ): Promise<Pose | null> {
    if (!this.detector) {
      console.warn('[PoseDetection] Detector not initialized');
      return null;
    }
    
    try {
      const poses = await this.detector.estimatePoses(input, undefined, timestampMs);
      
      if (poses.length === 0) {
        return null;
      }
      
      const selectedPose = this.selectPose(poses);

      return {
        keypoints: selectedPose.keypoints.map(kp => ({
          x: kp.x,
          y: kp.y,
          score: kp.score,
          name: kp.name,
        })),
        score: selectedPose.score,
        id: selectedPose.id,
      };
    } catch (error) {
      console.error('[PoseDetection] Detection error:', error);
      return null;
    }
  }

  /**
   * Lock Live mode onto one person. MoveNet's tracked multi-pose model gives
   * each person a stable ID; when acquiring a target, prefer the largest,
   * most complete body so a foreground shooter wins over background crowds.
   */
  private selectPose(poses: poseDetection.Pose[]): poseDetection.Pose {
    if (this.modelType !== 'multipose') return poses[0];

    if (this.activePoseId !== null) {
      const lockedPose = poses.find(pose => pose.id === this.activePoseId);
      if (lockedPose) return lockedPose;
    }

    const selectedPose = poses.reduce((best, candidate) =>
      this.poseTargetScore(candidate) > this.poseTargetScore(best) ? candidate : best
    );
    this.activePoseId = selectedPose.id ?? null;
    return selectedPose;
  }

  private poseTargetScore(pose: poseDetection.Pose): number {
    const confidentBodyPoints = pose.keypoints
      .slice(KEYPOINT_INDICES.left_shoulder)
      .filter(keypoint => (keypoint.score ?? 0) >= 0.3);

    if (confidentBodyPoints.length < 4) return 0;

    const area = pose.box
      ? pose.box.width * pose.box.height
      : (() => {
          const xs = confidentBodyPoints.map(keypoint => keypoint.x);
          const ys = confidentBodyPoints.map(keypoint => keypoint.y);
          return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
        })();
    const averageConfidence = confidentBodyPoints.reduce(
      (total, keypoint) => total + (keypoint.score ?? 0),
      0
    ) / confidentBodyPoints.length;
    const completeness = confidentBodyPoints.length / 12;

    return area * averageConfidence * completeness;
  }
  
  /**
   * Calculate angle between three points (in degrees)
   */
  calculateAngle(
    point1: Keypoint,
    point2: Keypoint, // vertex
    point3: Keypoint
  ): number {
    const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) -
                    Math.atan2(point1.y - point2.y, point1.x - point2.x);
    let angle = Math.abs(radians * 180 / Math.PI);
    
    if (angle > 180) {
      angle = 360 - angle;
    }
    
    return Math.round(angle);
  }
  
  /**
   * Get keypoint by name with confidence check
   */
  getKeypoint(pose: Pose, name: keyof typeof KEYPOINT_INDICES, minScore = 0.3): Keypoint | null {
    const index = KEYPOINT_INDICES[name];
    const keypoint = pose.keypoints[index];
    
    if (!keypoint || (keypoint.score !== undefined && keypoint.score < minScore)) {
      return null;
    }
    
    return keypoint;
  }
  
  /**
   * Calculate all shooting-relevant angles from a pose
   * Industry standard basketball shooting form analysis
   */
  calculateShootingAngles(pose: Pose): ShootingAngles {
    const angles: ShootingAngles = {
      elbowAngle: null,
      kneeAngle: null,
      shoulderAngle: null,
      hipAngle: null,
      releaseAngle: null,
      wristAngle: null,
    };
    
    // Determine shooting side based on which wrist is higher (shooting hand)
    // This auto-detects left vs right handed shooters
    const rightWrist = this.getKeypoint(pose, 'right_wrist');
    const leftWrist = this.getKeypoint(pose, 'left_wrist');
    
    let side: 'right' | 'left' = 'right';
    if (rightWrist && leftWrist) {
      // The higher wrist (lower y value) is likely the shooting hand
      side = rightWrist.y < leftWrist.y ? 'right' : 'left';
    } else if (leftWrist && !rightWrist) {
      side = 'left';
    }
    
    // Get keypoints for the shooting side
    const shoulder = this.getKeypoint(pose, `${side}_shoulder` as keyof typeof KEYPOINT_INDICES);
    const elbow = this.getKeypoint(pose, `${side}_elbow` as keyof typeof KEYPOINT_INDICES);
    const wrist = this.getKeypoint(pose, `${side}_wrist` as keyof typeof KEYPOINT_INDICES);
    const hip = this.getKeypoint(pose, `${side}_hip` as keyof typeof KEYPOINT_INDICES);
    const knee = this.getKeypoint(pose, `${side}_knee` as keyof typeof KEYPOINT_INDICES);
    const ankle = this.getKeypoint(pose, `${side}_ankle` as keyof typeof KEYPOINT_INDICES);
    
    // Calculate elbow angle (shoulder-elbow-wrist)
    // Ideal: 85-95° at set point, extends to ~170° at release
    if (shoulder && elbow && wrist) {
      angles.elbowAngle = this.calculateAngle(shoulder, elbow, wrist);
    }
    
    // Calculate knee angle (hip-knee-ankle)
    // Ideal: 130-150° for athletic stance with good power generation
    if (hip && knee && ankle) {
      angles.kneeAngle = this.calculateAngle(hip, knee, ankle);
    }
    
    // Calculate shoulder angle (elbow-shoulder-hip)
    // Measures arm lift - ideal: 45-90° depending on shot phase
    if (elbow && shoulder && hip) {
      angles.shoulderAngle = this.calculateAngle(elbow, shoulder, hip);
    }
    
    // Calculate hip angle (shoulder-hip-knee)
    // Measures body alignment/lean - ideal: 160-180° for upright posture
    if (shoulder && hip && knee) {
      angles.hipAngle = this.calculateAngle(shoulder, hip, knee);
    }
    
    // Calculate release angle (arm angle from vertical)
    // 0° = straight up, positive = forward lean
    if (wrist && elbow) {
      const dx = wrist.x - elbow.x;
      const dy = elbow.y - wrist.y; // Inverted because y increases downward
      angles.releaseAngle = Math.round(Math.atan2(dx, dy) * 180 / Math.PI);
    }
    
    // Calculate wrist/arm angle (elbow-wrist angle relative to vertical)
    // This measures the follow-through angle
    // Ideal: 45-60° at release for optimal arc
    if (elbow && wrist) {
      // Calculate angle of forearm from horizontal
      const dx = wrist.x - elbow.x;
      const dy = wrist.y - elbow.y;
      // Convert to degrees from horizontal (0° = horizontal, 90° = vertical up, -90° = vertical down)
      let armAngle = Math.round(Math.atan2(-dy, dx) * 180 / Math.PI);
      // Normalize to 0-180 range for display
      if (armAngle < 0) armAngle += 180;
      angles.wristAngle = armAngle;
    }
    
    return angles;
  }
  
  /**
   * Analyze shooting form and provide feedback
   * Industry standard basketball shooting form analysis
   */
  analyzeShootingForm(angles: ShootingAngles): ShootingFormFeedback {
    const feedback: ShootingFormFeedback = {
      elbowStatus: 'unknown',
      elbowMessage: 'Cannot detect elbow',
      kneeStatus: 'unknown',
      kneeMessage: 'Cannot detect knee',
      shoulderStatus: 'unknown',
      shoulderMessage: 'Cannot detect shoulder',
      hipStatus: 'unknown',
      hipMessage: 'Cannot detect hip',
      releaseStatus: 'unknown',
      releaseMessage: 'Cannot detect release',
      wristStatus: 'unknown',
      wristMessage: 'Cannot detect arm angle',
      overallScore: 0,
      tips: [],
    };
    
    let validMetrics = 0;
    let totalScore = 0;
    
    // Analyze elbow angle (ideal: 85-95° at set point, extends to ~170° at release)
    if (angles.elbowAngle !== null) {
      validMetrics++;
      if (angles.elbowAngle >= 80 && angles.elbowAngle <= 100) {
        feedback.elbowStatus = 'good';
        feedback.elbowMessage = `Elbow at ${angles.elbowAngle}° - Perfect set position`;
        totalScore += 100;
      } else if (angles.elbowAngle >= 70 && angles.elbowAngle <= 110) {
        feedback.elbowStatus = 'warning';
        feedback.elbowMessage = `Elbow at ${angles.elbowAngle}° - Slightly off`;
        totalScore += 70;
        feedback.tips.push(angles.elbowAngle < 80 
          ? 'Open your elbow slightly more' 
          : 'Tuck your elbow in a bit');
      } else if (angles.elbowAngle > 150) {
        // Extended arm - likely in release phase
        feedback.elbowStatus = 'good';
        feedback.elbowMessage = `Elbow at ${angles.elbowAngle}° - Good extension`;
        totalScore += 90;
      } else {
        feedback.elbowStatus = 'critical';
        feedback.elbowMessage = `Elbow at ${angles.elbowAngle}° - Needs adjustment`;
        totalScore += 40;
        feedback.tips.push('Focus on forming an L-shape with your shooting arm');
      }
    }
    
    // Analyze knee angle (ideal: 130-150° for athletic stance)
    if (angles.kneeAngle !== null) {
      validMetrics++;
      if (angles.kneeAngle >= 130 && angles.kneeAngle <= 155) {
        feedback.kneeStatus = 'good';
        feedback.kneeMessage = `Knee at ${angles.kneeAngle}° - Good bend`;
        totalScore += 100;
      } else if (angles.kneeAngle >= 120 && angles.kneeAngle <= 165) {
        feedback.kneeStatus = 'warning';
        feedback.kneeMessage = `Knee at ${angles.kneeAngle}° - Adjust slightly`;
        totalScore += 70;
        feedback.tips.push(angles.kneeAngle < 130 
          ? 'Straighten your knees slightly' 
          : 'Bend your knees more for power');
      } else if (angles.kneeAngle > 165) {
        feedback.kneeStatus = 'critical';
        feedback.kneeMessage = `Knee at ${angles.kneeAngle}° - Too straight`;
        totalScore += 40;
        feedback.tips.push('Bend your knees more to generate power');
      } else {
        feedback.kneeStatus = 'warning';
        feedback.kneeMessage = `Knee at ${angles.kneeAngle}° - Too bent`;
        totalScore += 50;
        feedback.tips.push('Don\'t over-bend your knees');
      }
    }
    
    // Analyze shoulder angle (ideal: 45-90° depending on shot phase)
    if (angles.shoulderAngle !== null) {
      validMetrics++;
      if (angles.shoulderAngle >= 40 && angles.shoulderAngle <= 100) {
        feedback.shoulderStatus = 'good';
        feedback.shoulderMessage = `Shoulder at ${angles.shoulderAngle}° - Good position`;
        totalScore += 100;
      } else if (angles.shoulderAngle >= 30 && angles.shoulderAngle <= 120) {
        feedback.shoulderStatus = 'warning';
        feedback.shoulderMessage = `Shoulder at ${angles.shoulderAngle}° - Adjust position`;
        totalScore += 70;
      } else {
        feedback.shoulderStatus = 'critical';
        feedback.shoulderMessage = `Shoulder at ${angles.shoulderAngle}° - Check form`;
        totalScore += 40;
        feedback.tips.push('Keep your shooting elbow aligned with your shoulder');
      }
    }
    
    // Analyze hip angle (ideal: 160-180° for aligned posture)
    if (angles.hipAngle !== null) {
      validMetrics++;
      if (angles.hipAngle >= 155 && angles.hipAngle <= 180) {
        feedback.hipStatus = 'good';
        feedback.hipMessage = `Hip at ${angles.hipAngle}° - Good alignment`;
        totalScore += 100;
      } else if (angles.hipAngle >= 140 && angles.hipAngle <= 180) {
        feedback.hipStatus = 'warning';
        feedback.hipMessage = `Hip at ${angles.hipAngle}° - Slight lean`;
        totalScore += 70;
        feedback.tips.push('Keep your torso more upright');
      } else {
        feedback.hipStatus = 'critical';
        feedback.hipMessage = `Hip at ${angles.hipAngle}° - Leaning too much`;
        totalScore += 40;
        feedback.tips.push('Maintain a more vertical posture');
      }
    }
    
    // Analyze release angle (ideal: -10° to 15° from vertical for optimal arc)
    // Negative = arm tilted back, Positive = arm tilted forward
    if (angles.releaseAngle !== null) {
      validMetrics++;
      const absRelease = Math.abs(angles.releaseAngle);
      if (absRelease <= 15) {
        feedback.releaseStatus = 'good';
        feedback.releaseMessage = `Release at ${angles.releaseAngle}° - Great follow-through`;
        totalScore += 100;
      } else if (absRelease <= 25) {
        feedback.releaseStatus = 'warning';
        feedback.releaseMessage = `Release at ${angles.releaseAngle}° - Adjust angle`;
        totalScore += 70;
        feedback.tips.push(angles.releaseAngle > 0 
          ? 'Extend more vertically on release' 
          : 'Follow through more forward');
      } else {
        feedback.releaseStatus = 'critical';
        feedback.releaseMessage = `Release at ${angles.releaseAngle}° - Needs work`;
        totalScore += 40;
        feedback.tips.push('Focus on a more vertical release for better arc');
      }
    }
    
    // Analyze wrist/arm angle (ideal: 60-90° from horizontal for proper arc)
    // This measures the forearm angle during the shot
    if (angles.wristAngle !== null) {
      validMetrics++;
      if (angles.wristAngle >= 50 && angles.wristAngle <= 100) {
        feedback.wristStatus = 'good';
        feedback.wristMessage = `Arm at ${angles.wristAngle}° - Good arc`;
        totalScore += 100;
      } else if (angles.wristAngle >= 35 && angles.wristAngle <= 120) {
        feedback.wristStatus = 'warning';
        feedback.wristMessage = `Arm at ${angles.wristAngle}° - Adjust for better arc`;
        totalScore += 70;
        feedback.tips.push(angles.wristAngle < 50 
          ? 'Raise your arm higher for better arc' 
          : 'Don\'t over-extend on release');
      } else {
        feedback.wristStatus = 'critical';
        feedback.wristMessage = `Arm at ${angles.wristAngle}° - Flat shot`;
        totalScore += 40;
        feedback.tips.push('Get more lift on your shot for better arc');
      }
    }
    
    // Calculate overall score
    feedback.overallScore = validMetrics > 0 
      ? Math.round(totalScore / validMetrics) 
      : 0;
    
    return feedback;
  }
  
  /**
   * Detect if the pose indicates a shooting motion
   */
  detectShootingMotion(pose: Pose, previousPose?: Pose): boolean {
    const wrist = this.getKeypoint(pose, 'right_wrist');
    const shoulder = this.getKeypoint(pose, 'right_shoulder');
    const elbow = this.getKeypoint(pose, 'right_elbow');
    
    if (!wrist || !shoulder || !elbow) {
      return false;
    }
    
    // Check if wrist is above shoulder (shooting position)
    const wristAboveShoulder = wrist.y < shoulder.y;
    
    // Check if arm is extended (elbow angle > 140°)
    const elbowAngle = this.calculateAngle(shoulder, elbow, wrist);
    const armExtended = elbowAngle > 140;
    
    // If we have a previous pose, check for upward motion
    if (previousPose) {
      const prevWrist = this.getKeypoint(previousPose, 'right_wrist');
      if (prevWrist) {
        const upwardMotion = wrist.y < prevWrist.y - 10; // Moving up by at least 10px
        return wristAboveShoulder && (armExtended || upwardMotion);
      }
    }
    
    return wristAboveShoulder && armExtended;
  }
  
  /**
   * Dispose of the detector to free memory
   */
  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
      this.activePoseId = null;
      console.log('[PoseDetection] Detector disposed');
    }
  }
  
  /**
   * Check if detector is ready
   */
  isReady(modelType?: ModelType): boolean {
    return this.detector !== null && (!modelType || this.modelType === modelType);
  }
}

// Export singleton instance
export const poseDetectionService = new PoseDetectionService();

// Export class for testing
export { PoseDetectionService };


