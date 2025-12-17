/**
 * API Route: Form Analysis (uses pose detection)
 * 
 * This route uses the pose detection API to get keypoints,
 * then analyzes shooting form based on those keypoints.
 */

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    console.log('🔄 Running form analysis...');

    // First get pose detection results
    const poseResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/pose-detection`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: body.image }),
    });

    if (!poseResponse.ok) {
      throw new Error('Pose detection failed');
    }

    const poseData = await poseResponse.json();
    
    if (!poseData.keypoints) {
      throw new Error('No keypoints detected');
    }

    // Calculate shooting angles from keypoints
    const angles = calculateShootingAngles(poseData.keypoints);
    
    // Analyze form and generate feedback
    const { feedback, score } = analyzeShootingForm(poseData.keypoints, angles);
    
    console.log('✅ Form analysis successful');
    
    return NextResponse.json({
      success: true,
      feedback,
      overall_score: score,
      angles,
      keypoints: poseData.keypoints,
      basketball: poseData.basketball
    });
    
  } catch (error: any) {
    console.error('❌ Form analysis error:', error);
    return NextResponse.json(
      { error: 'Form analysis failed', details: error.message },
      { status: 500 }
    );
  }
}

function calculateShootingAngles(keypoints: any) {
  const angles: any = {};
  
  // Calculate elbow angle (shoulder-elbow-wrist)
  if (keypoints.right_shoulder && keypoints.right_elbow && keypoints.right_wrist) {
    angles.right_elbow = calculateAngle(
      keypoints.right_shoulder,
      keypoints.right_elbow,
      keypoints.right_wrist
    );
  }
  
  // Calculate knee angle (hip-knee-ankle)
  if (keypoints.right_hip && keypoints.right_knee && keypoints.right_ankle) {
    angles.right_knee = calculateAngle(
      keypoints.right_hip,
      keypoints.right_knee,
      keypoints.right_ankle
    );
  }
  
  return angles;
}

function calculateAngle(point1: any, point2: any, point3: any): number {
  const radians = Math.atan2(point3.y - point2.y, point3.x - point2.x) - 
                  Math.atan2(point1.y - point2.y, point1.x - point2.x);
  let angle = Math.abs(radians * 180.0 / Math.PI);
  
  if (angle > 180.0) {
    angle = 360 - angle;
  }
  
  return angle;
}

function analyzeShootingForm(keypoints: any, angles: any) {
  const feedback = [];
  let score = 100;
  
  // Analyze elbow alignment
  if (angles.right_elbow) {
    if (angles.right_elbow < 80 || angles.right_elbow > 110) {
      feedback.push('Consider adjusting elbow angle for better shot consistency');
      score -= 10;
    }
  }
  
  // Analyze knee bend
  if (angles.right_knee) {
    if (angles.right_knee < 100 || angles.right_knee > 140) {
      feedback.push('Knee bend could be optimized for more power transfer');
      score -= 10;
    }
  }
  
  return { feedback, score: Math.max(score, 0) };
}
