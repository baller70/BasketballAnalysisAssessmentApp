/**
 * Biomechanical Analysis Service
 * Calculates shooting form metrics from pose keypoints
 * Matches user's form to elite shooters database
 */

// Type inlined from deleted module
export interface PoseKeypoint {
  name: string;
  x: number;
  y: number;
  confidence: number;
}

export interface BiomechanicalMetrics {
  // Joint angles (degrees)
  shoulderAngle: number;      // Angle at shooting shoulder
  elbowAngle: number;         // Elbow bend angle (optimal: 85-90°)
  hipAngle: number;           // Hip flexion angle
  kneeAngle: number;          // Knee bend (optimal: 135-140°)
  ankleAngle: number;         // Ankle dorsiflexion
  wristAngle: number;         // Wrist snap angle

  // Release metrics
  releaseHeight: number;      // % of body height
  releaseAngle: number;       // Trajectory angle at release

  // Alignment metrics
  spineAngle: number;         // Torso lean angle
  shoulderAlignment: number;  // Shoulder tilt (should be ~0)
  hipAlignment: number;       // Hip tilt

  // Balance metrics
  centerOfMassX: number;      // X position of COM (0.5 = centered)
  baseWidth: number;          // Foot stance width

  // Shooting hand
  isLeftHanded: boolean;

  // Confidence
  overallConfidence: number;
}

export interface EliteMatchResult {
  shooterId: number;
  shooterName: string;
  similarityScore: number;    // 0-100
  matchingTraits: string[];
  differingTraits: string[];
}

/**
 * Calculate angle between three points (in degrees)
 * Point B is the vertex of the angle
 */
function calculateAngle(a: PoseKeypoint, b: PoseKeypoint, c: PoseKeypoint): number {
  const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let angle = Math.abs(radians * 180 / Math.PI);
  if (angle > 180) angle = 360 - angle;
  return angle;
}

/**
 * Calculate angle from vertical (for spine/torso lean)
 */
function calculateVerticalAngle(top: PoseKeypoint, bottom: PoseKeypoint): number {
  const dx = top.x - bottom.x;
  const dy = bottom.y - top.y; // Inverted because Y increases downward
  return Math.atan2(dx, dy) * 180 / Math.PI;
}

/**
 * Calculate distance between two points (normalized)
 * Used for stance width and other distance calculations
 */
export function distance(a: PoseKeypoint, b: PoseKeypoint): number {
  return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
}

/**
 * Get keypoint by name from array
 */
function getKP(keypoints: PoseKeypoint[], name: string): PoseKeypoint | undefined {
  return keypoints.find(kp => kp.name === name);
}

/**
 * Analyze biomechanics from pose keypoints
 */
export function analyzeBiomechanics(keypoints: PoseKeypoint[]): BiomechanicalMetrics | null {
  // Get all required keypoints
  const leftShoulder = getKP(keypoints, 'left_shoulder');
  const rightShoulder = getKP(keypoints, 'right_shoulder');
  const leftElbow = getKP(keypoints, 'left_elbow');
  const rightElbow = getKP(keypoints, 'right_elbow');
  const leftWrist = getKP(keypoints, 'left_wrist');
  const rightWrist = getKP(keypoints, 'right_wrist');
  const leftHip = getKP(keypoints, 'left_hip');
  const rightHip = getKP(keypoints, 'right_hip');
  const leftKnee = getKP(keypoints, 'left_knee');
  const rightKnee = getKP(keypoints, 'right_knee');
  const leftAnkle = getKP(keypoints, 'left_ankle');
  const rightAnkle = getKP(keypoints, 'right_ankle');
  const nose = getKP(keypoints, 'nose');

  // Validate minimum required points
  if (!leftShoulder || !rightShoulder || !leftElbow || !rightElbow ||
      !leftWrist || !rightWrist || !leftHip || !rightHip ||
      !leftKnee || !rightKnee || !leftAnkle || !rightAnkle) {
    return null;
  }

  // Determine shooting hand (higher wrist position)
  const isLeftHanded = leftWrist.y < rightWrist.y;

  // Select shooting side keypoints
  const shootingShoulder = isLeftHanded ? leftShoulder : rightShoulder;
  const shootingElbow = isLeftHanded ? leftElbow : rightElbow;
  const shootingWrist = isLeftHanded ? leftWrist : rightWrist;
  const shootingHip = isLeftHanded ? leftHip : rightHip;
  const shootingKnee = isLeftHanded ? leftKnee : rightKnee;
  const shootingAnkle = isLeftHanded ? leftAnkle : rightAnkle;

  // Calculate mid points
  const midHip = {
    name: 'mid_hip', x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2, confidence: 1
  };
  const midShoulder = {
    name: 'mid_shoulder', x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2, confidence: 1
  };

  // Calculate angles
  const shoulderAngle = calculateAngle(shootingElbow, shootingShoulder, midHip);
  const elbowAngle = calculateAngle(shootingShoulder, shootingElbow, shootingWrist);
  const hipAngle = calculateAngle(midShoulder, shootingHip, shootingKnee);
  const kneeAngle = calculateAngle(shootingHip, shootingKnee, shootingAnkle);

  // Ankle angle (dorsiflexion)
  const footForward = { name: 'foot', x: shootingAnkle.x + 0.1, y: shootingAnkle.y, confidence: 1 };
  const ankleAngle = calculateAngle(shootingKnee, shootingAnkle, footForward);

  // Wrist angle estimation
  const wristAngle = 45; // Default - would need hand keypoints for accuracy

  // Release height (% from ankle to top of image, normalized by body height)
  const bodyHeight = (leftAnkle.y + rightAnkle.y) / 2 - (nose?.y || midShoulder.y);
  const releaseHeight = ((leftAnkle.y + rightAnkle.y) / 2 - shootingWrist.y) / bodyHeight * 100;

  // Release angle (estimated from arm angle)
  const releaseAngle = Math.atan2(
    shootingWrist.y - shootingElbow.y,
    shootingWrist.x - shootingElbow.x
  ) * 180 / Math.PI + 90;

  // Spine angle (torso lean)
  const spineAngle = calculateVerticalAngle(midShoulder, midHip);

  // Shoulder alignment (tilt)
  const shoulderAlignment = (rightShoulder.y - leftShoulder.y) * 100;

  // Hip alignment
  const hipAlignment = (rightHip.y - leftHip.y) * 100;

  // Center of mass X position
  const centerOfMassX = (midHip.x + midShoulder.x) / 2;

  // Base width (foot stance)
  const baseWidth = Math.abs(leftAnkle.x - rightAnkle.x);

  // Overall confidence
  const allPoints = [leftShoulder, rightShoulder, leftElbow, rightElbow,
    leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee,
    leftAnkle, rightAnkle];
  const overallConfidence = allPoints.reduce((sum, p) => sum + p.confidence, 0) / allPoints.length;

  return {
    shoulderAngle: Math.round(shoulderAngle),
    elbowAngle: Math.round(elbowAngle),
    hipAngle: Math.round(hipAngle),
    kneeAngle: Math.round(kneeAngle),
    ankleAngle: Math.round(ankleAngle),
    wristAngle: Math.round(wristAngle),
    releaseHeight: Math.round(releaseHeight),
    releaseAngle: Math.round(Math.abs(releaseAngle)),
    spineAngle: Math.round(spineAngle),
    shoulderAlignment: Math.round(shoulderAlignment),
    hipAlignment: Math.round(hipAlignment),
    centerOfMassX: Math.round(centerOfMassX * 100) / 100,
    baseWidth: Math.round(baseWidth * 100) / 100,
    isLeftHanded,
    overallConfidence: Math.round(overallConfidence * 100) / 100
  };
}

/**
 * Calculate similarity score between user metrics and elite shooter
 */
export function calculateSimilarity(
  userMetrics: BiomechanicalMetrics,
  shooterMeasurements: {
    shoulderAngle: number;
    elbowAngle: number;
    hipAngle: number;
    kneeAngle: number;
    ankleAngle: number;
    releaseHeight: number;
    releaseAngle: number;
    entryAngle: number;
  }
): { score: number; matchingTraits: string[]; differingTraits: string[] } {
  const matchingTraits: string[] = [];
  const differingTraits: string[] = [];

  // Weight factors for each measurement
  const weights = {
    elbowAngle: 0.20,      // Most important for accuracy
    releaseAngle: 0.15,
    kneeAngle: 0.15,
    shoulderAngle: 0.12,
    hipAngle: 0.12,
    releaseHeight: 0.10,
    ankleAngle: 0.08,
    spineAngle: 0.08,
  };

  let totalScore = 0;
  let totalWeight = 0;

  // Elbow angle comparison (optimal range: 85-95°)
  const elbowDiff = Math.abs(userMetrics.elbowAngle - shooterMeasurements.elbowAngle);
  const elbowScore = Math.max(0, 100 - elbowDiff * 3);
  totalScore += elbowScore * weights.elbowAngle;
  totalWeight += weights.elbowAngle;
  if (elbowDiff <= 5) matchingTraits.push('Matching Elbow Angle');
  else if (elbowDiff > 15) differingTraits.push('Elbow Alignment');

  // Release angle comparison
  const releaseDiff = Math.abs(userMetrics.releaseAngle - shooterMeasurements.releaseAngle);
  const releaseScore = Math.max(0, 100 - releaseDiff * 2);
  totalScore += releaseScore * weights.releaseAngle;
  totalWeight += weights.releaseAngle;
  if (releaseDiff <= 5) matchingTraits.push('Similar Release Angle');
  else if (releaseDiff > 15) differingTraits.push('Release Trajectory');

  // Knee angle comparison (optimal range: 135-145°)
  const kneeDiff = Math.abs(userMetrics.kneeAngle - shooterMeasurements.kneeAngle);
  const kneeScore = Math.max(0, 100 - kneeDiff * 2);
  totalScore += kneeScore * weights.kneeAngle;
  totalWeight += weights.kneeAngle;
  if (kneeDiff <= 5) matchingTraits.push('Similar Knee Bend');
  else if (kneeDiff > 15) differingTraits.push('Knee Bend Depth');

  // Shoulder angle comparison
  const shoulderDiff = Math.abs(userMetrics.shoulderAngle - shooterMeasurements.shoulderAngle);
  const shoulderScore = Math.max(0, 100 - shoulderDiff * 2);
  totalScore += shoulderScore * weights.shoulderAngle;
  totalWeight += weights.shoulderAngle;
  if (shoulderDiff <= 5) matchingTraits.push('Shoulder Alignment');

  // Hip angle comparison
  const hipDiff = Math.abs(userMetrics.hipAngle - shooterMeasurements.hipAngle);
  const hipScore = Math.max(0, 100 - hipDiff * 2);
  totalScore += hipScore * weights.hipAngle;
  totalWeight += weights.hipAngle;
  if (hipDiff <= 5) matchingTraits.push('Hip Position');

  // Release height comparison
  const heightDiff = Math.abs(userMetrics.releaseHeight - shooterMeasurements.releaseHeight);
  const heightScore = Math.max(0, 100 - heightDiff * 1.5);
  totalScore += heightScore * weights.releaseHeight;
  totalWeight += weights.releaseHeight;
  if (heightDiff <= 5) matchingTraits.push('Similar Release Height');
  else if (heightDiff > 20) differingTraits.push('Release Height');

  // Ankle angle comparison
  const ankleDiff = Math.abs(userMetrics.ankleAngle - shooterMeasurements.ankleAngle);
  const ankleScore = Math.max(0, 100 - ankleDiff * 2);
  totalScore += ankleScore * weights.ankleAngle;
  totalWeight += weights.ankleAngle;

  // Spine angle (balance) - compare to assumed good posture
  const spineScore = Math.max(0, 100 - Math.abs(userMetrics.spineAngle) * 3);
  totalScore += spineScore * weights.spineAngle;
  totalWeight += weights.spineAngle;
  if (Math.abs(userMetrics.spineAngle) <= 5) matchingTraits.push('Core Stability');
  else if (Math.abs(userMetrics.spineAngle) > 15) differingTraits.push('Balance/Posture');

  const finalScore = Math.round(totalScore / totalWeight);

  return {
    score: Math.min(99, Math.max(50, finalScore)),
    matchingTraits: matchingTraits.slice(0, 4),
    differingTraits: differingTraits.slice(0, 3)
  };
}

/**
 * Calculate overall form score
 */
export function calculateOverallScore(metrics: BiomechanicalMetrics): {
  score: number;
  category: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  breakdown: { metric: string; score: number; status: 'good' | 'warning' | 'critical' }[];
} {
  const breakdown: { metric: string; score: number; status: 'good' | 'warning' | 'critical' }[] = [];

  // Elbow angle (optimal: 85-95°)
  const elbowOptimal = 90;
  const elbowDiff = Math.abs(metrics.elbowAngle - elbowOptimal);
  const elbowScore = Math.max(0, 100 - elbowDiff * 4);
  breakdown.push({
    metric: 'Elbow Alignment',
    score: elbowScore,
    status: elbowScore >= 80 ? 'good' : elbowScore >= 60 ? 'warning' : 'critical'
  });

  // Knee angle (optimal: 135-145°)
  const kneeOptimal = 140;
  const kneeDiff = Math.abs(metrics.kneeAngle - kneeOptimal);
  const kneeScore = Math.max(0, 100 - kneeDiff * 2);
  breakdown.push({
    metric: 'Knee Bend',
    score: kneeScore,
    status: kneeScore >= 80 ? 'good' : kneeScore >= 60 ? 'warning' : 'critical'
  });

  // Release height (optimal: 95-110% of body height)
  const releaseOptimal = 105;
  const releaseDiff = Math.abs(metrics.releaseHeight - releaseOptimal);
  const releaseScore = Math.max(0, 100 - releaseDiff * 2);
  breakdown.push({
    metric: 'Release Height',
    score: releaseScore,
    status: releaseScore >= 80 ? 'good' : releaseScore >= 60 ? 'warning' : 'critical'
  });

  // Balance (spine angle should be near 0)
  const balanceScore = Math.max(0, 100 - Math.abs(metrics.spineAngle) * 5);
  breakdown.push({
    metric: 'Balance',
    score: balanceScore,
    status: balanceScore >= 80 ? 'good' : balanceScore >= 60 ? 'warning' : 'critical'
  });

  // Shoulder alignment
  const shoulderScore = Math.max(0, 100 - Math.abs(metrics.shoulderAlignment) * 5);
  breakdown.push({
    metric: 'Shoulder Alignment',
    score: shoulderScore,
    status: shoulderScore >= 80 ? 'good' : shoulderScore >= 60 ? 'warning' : 'critical'
  });

  // Overall score (weighted average)
  const weights = [0.25, 0.20, 0.20, 0.20, 0.15];
  const overallScore = Math.round(
    breakdown.reduce((sum, b, i) => sum + b.score * weights[i], 0)
  );

  let category: 'EXCELLENT' | 'GOOD' | 'NEEDS_IMPROVEMENT' | 'CRITICAL';
  if (overallScore >= 85) category = 'EXCELLENT';
  else if (overallScore >= 70) category = 'GOOD';
  else if (overallScore >= 55) category = 'NEEDS_IMPROVEMENT';
  else category = 'CRITICAL';

  return { score: overallScore, category, breakdown };
}

