#!/usr/bin/env python3
"""
Test all candidate images with MediaPipe to find which ones work
"""

import os
import cv2
import mediapipe as mp
import glob
from pathlib import Path

mp_pose = mp.solutions.pose

def test_pose_detection(image_path: str) -> dict:
    """Quick test if MediaPipe can detect pose"""
    try:
        image = cv2.imread(image_path)
        if image is None:
            return {"detected": False, "error": "Could not load image"}
        
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        with mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            min_detection_confidence=0.3  # Lower threshold
        ) as pose:
            results = pose.process(image_rgb)
            
            if results.pose_landmarks:
                # Count visible landmarks
                visible_count = sum(1 for lm in results.pose_landmarks.landmark if lm.visibility > 0.5)
                return {
                    "detected": True,
                    "visible_landmarks": visible_count,
                    "total_landmarks": len(results.pose_landmarks.landmark)
                }
            else:
                return {"detected": False, "error": "No pose detected"}
                
    except Exception as e:
        return {"detected": False, "error": str(e)}


def main():
    """Test all top 20 images"""
    top_dir = "/home/ubuntu/Uploads/basketball_test_results/verified_images/top_10_expanded"
    
    print("=" * 80)
    print("🔍 TESTING ALL CANDIDATE IMAGES FOR POSE DETECTION")
    print("=" * 80)
    
    successful = []
    failed = []
    
    for i in range(1, 21):
        matching = glob.glob(os.path.join(top_dir, f"{i:02d}_*.jpg"))
        if not matching:
            continue
            
        image_path = matching[0]
        filename = os.path.basename(image_path)
        
        print(f"\n[{i}/20] Testing: {filename}")
        result = test_pose_detection(image_path)
        
        if result["detected"]:
            visible = result.get("visible_landmarks", 0)
            total = result.get("total_landmarks", 0)
            print(f"   ✅ PASS - {visible}/{total} landmarks visible")
            successful.append((i, filename, visible))
        else:
            error = result.get("error", "Unknown error")
            print(f"   ❌ FAIL - {error}")
            failed.append((i, filename))
    
    print("\n" + "=" * 80)
    print(f"📊 RESULTS: {len(successful)}/{len(successful) + len(failed)} images passed")
    print("=" * 80)
    
    if successful:
        print("\n✅ SUCCESSFUL IMAGES:")
        successful.sort(key=lambda x: x[2], reverse=True)  # Sort by visible landmarks
        for num, filename, visible in successful:
            print(f"   #{num:02d}: {filename} ({visible} visible landmarks)")
    
    if failed:
        print("\n❌ FAILED IMAGES:")
        for num, filename in failed[:5]:
            print(f"   #{num:02d}: {filename}")
    
    # Recommend best 5
    if len(successful) >= 5:
        print("\n💡 RECOMMENDED TOP 5:")
        for num, filename, visible in successful[:5]:
            print(f"   #{num:02d}: {filename}")


if __name__ == "__main__":
    main()
