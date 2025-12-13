#!/usr/bin/env python3
"""
Professional Basketball Shooting Skeleton Overlay
Matches reference images with proper keypoint structure and angle measurements
"""

import cv2
import mediapipe as mp
import numpy as np
from pathlib import Path
import math
from typing import Tuple, Dict, List, Optional

# Initialize MediaPipe
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Professional color scheme (matching reference images)
COLORS = {
    'keypoint': (255, 200, 100),  # Cyan/light blue for keypoints
    'skeleton': (255, 255, 255),   # White for skeleton lines
    'good_overlay': (0, 255, 0),   # Green for good form
    'bad_overlay': (0, 0, 255),    # Red for problem areas
    'angle_text': (255, 255, 255), # White text for angles
    'background': (0, 0, 0)        # Black background for overlays
}

# Keypoint visualization settings
KEYPOINT_RADIUS = 8
SKELETON_THICKNESS = 2
ANGLE_TEXT_SIZE = 0.7
ANGLE_LINE_COLOR = (200, 200, 200)

class SkeletonOverlay:
    """Professional skeleton overlay matching reference images"""
    
    def __init__(self, confidence=0.5, complexity=2):
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=complexity,
            enable_segmentation=False,
            min_detection_confidence=confidence
        )
        
    def calculate_angle(self, point1, point2, point3) -> float:
        """Calculate angle between three points (in degrees)"""
        try:
            # Convert to numpy arrays
            a = np.array([point1.x, point1.y])
            b = np.array([point2.x, point2.y])
            c = np.array([point3.x, point3.y])
            
            # Calculate vectors
            ba = a - b
            bc = c - b
            
            # Calculate angle
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            angle = np.arccos(np.clip(cosine_angle, -1.0, 1.0))
            
            return np.degrees(angle)
        except:
            return 0.0
    
    def calculate_biomechanical_angles(self, landmarks) -> Dict[str, float]:
        """Calculate all biomechanical angles matching reference image"""
        angles = {}
        
        try:
            # Shooting Arm Angles (assuming right-handed shooter, can be adapted)
            # SA - Shoulder Angle (torso to upper arm)
            angles['SA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
            )
            
            # EA - Elbow Angle (upper arm to forearm)
            angles['EA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            )
            
            # HA - Hip Angle (torso to thigh)
            angles['HA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value]
            )
            
            # KA - Knee Angle (thigh to shin)
            angles['KA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
            )
            
            # AA - Ankle Angle (shin to foot)
            angles['AA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value]
            )
            
            # RA - Release Angle (arm angle at release)
            angles['RA'] = self.calculate_angle(
                landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value],
                landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            )
            
            # Calculate heights and distances
            nose = landmarks[mp_pose.PoseLandmark.NOSE.value]
            right_wrist = landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value]
            right_ankle = landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value]
            right_elbow = landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value]
            
            # RH - Release Height (wrist height relative to body)
            angles['RH'] = abs(nose.y - right_wrist.y)
            
            # EH - Elbow Height (elbow height relative to shoulder)
            right_shoulder = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value]
            angles['EH'] = abs(right_shoulder.y - right_elbow.y)
            
            # VD - Vertical Displacement (overall body extension)
            angles['VD'] = abs(nose.y - right_ankle.y)
            
        except Exception as e:
            print(f"Error calculating angles: {e}")
        
        return angles
    
    def get_skeleton_connections(self) -> List[Tuple[int, int]]:
        """Define skeleton connections matching reference image structure"""
        return [
            # Face/Head
            (mp_pose.PoseLandmark.LEFT_EYE.value, mp_pose.PoseLandmark.RIGHT_EYE.value),
            (mp_pose.PoseLandmark.LEFT_EYE.value, mp_pose.PoseLandmark.NOSE.value),
            (mp_pose.PoseLandmark.RIGHT_EYE.value, mp_pose.PoseLandmark.NOSE.value),
            (mp_pose.PoseLandmark.LEFT_EAR.value, mp_pose.PoseLandmark.LEFT_EYE.value),
            (mp_pose.PoseLandmark.RIGHT_EAR.value, mp_pose.PoseLandmark.RIGHT_EYE.value),
            
            # Torso
            (mp_pose.PoseLandmark.NOSE.value, mp_pose.PoseLandmark.LEFT_SHOULDER.value),
            (mp_pose.PoseLandmark.NOSE.value, mp_pose.PoseLandmark.RIGHT_SHOULDER.value),
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_SHOULDER.value),
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.LEFT_HIP.value),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_HIP.value),
            (mp_pose.PoseLandmark.LEFT_HIP.value, mp_pose.PoseLandmark.RIGHT_HIP.value),
            
            # Right Arm
            (mp_pose.PoseLandmark.RIGHT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_ELBOW.value),
            (mp_pose.PoseLandmark.RIGHT_ELBOW.value, mp_pose.PoseLandmark.RIGHT_WRIST.value),
            (mp_pose.PoseLandmark.RIGHT_WRIST.value, mp_pose.PoseLandmark.RIGHT_PINKY.value),
            (mp_pose.PoseLandmark.RIGHT_WRIST.value, mp_pose.PoseLandmark.RIGHT_INDEX.value),
            (mp_pose.PoseLandmark.RIGHT_WRIST.value, mp_pose.PoseLandmark.RIGHT_THUMB.value),
            
            # Left Arm
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.LEFT_ELBOW.value),
            (mp_pose.PoseLandmark.LEFT_ELBOW.value, mp_pose.PoseLandmark.LEFT_WRIST.value),
            (mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.LEFT_PINKY.value),
            (mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.LEFT_INDEX.value),
            (mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.LEFT_THUMB.value),
            
            # Right Leg
            (mp_pose.PoseLandmark.RIGHT_HIP.value, mp_pose.PoseLandmark.RIGHT_KNEE.value),
            (mp_pose.PoseLandmark.RIGHT_KNEE.value, mp_pose.PoseLandmark.RIGHT_ANKLE.value),
            (mp_pose.PoseLandmark.RIGHT_ANKLE.value, mp_pose.PoseLandmark.RIGHT_HEEL.value),
            (mp_pose.PoseLandmark.RIGHT_ANKLE.value, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value),
            
            # Left Leg
            (mp_pose.PoseLandmark.LEFT_HIP.value, mp_pose.PoseLandmark.LEFT_KNEE.value),
            (mp_pose.PoseLandmark.LEFT_KNEE.value, mp_pose.PoseLandmark.LEFT_ANKLE.value),
            (mp_pose.PoseLandmark.LEFT_ANKLE.value, mp_pose.PoseLandmark.LEFT_HEEL.value),
            (mp_pose.PoseLandmark.LEFT_ANKLE.value, mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value),
        ]
    
    def draw_professional_skeleton(self, image, landmarks, show_angles=True):
        """Draw professional skeleton overlay matching reference images"""
        height, width, _ = image.shape
        annotated_image = image.copy()
        
        # Draw skeleton connections (white lines)
        connections = self.get_skeleton_connections()
        for start_idx, end_idx in connections:
            try:
                start = landmarks[start_idx]
                end = landmarks[end_idx]
                
                if start.visibility > 0.5 and end.visibility > 0.5:
                    start_point = (int(start.x * width), int(start.y * height))
                    end_point = (int(end.x * width), int(end.y * height))
                    
                    cv2.line(annotated_image, start_point, end_point, 
                            COLORS['skeleton'], SKELETON_THICKNESS)
            except:
                pass
        
        # Draw keypoints (cyan circles)
        for idx, landmark in enumerate(landmarks):
            if landmark.visibility > 0.5:
                x = int(landmark.x * width)
                y = int(landmark.y * height)
                
                # Draw filled circle
                cv2.circle(annotated_image, (x, y), KEYPOINT_RADIUS, 
                          COLORS['keypoint'], -1)
                # Draw border
                cv2.circle(annotated_image, (x, y), KEYPOINT_RADIUS, 
                          (255, 255, 255), 1)
        
        # Calculate and display angles if requested
        if show_angles:
            angles = self.calculate_biomechanical_angles(landmarks)
            self.draw_angle_annotations(annotated_image, landmarks, angles, width, height)
        
        return annotated_image, angles if show_angles else {}
    
    def draw_angle_annotations(self, image, landmarks, angles, width, height):
        """Draw angle measurements on image"""
        # Position for angle labels
        label_positions = {
            'SA': (landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value], (-50, -20)),
            'EA': (landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value], (-50, 0)),
            'HA': (landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value], (-50, -20)),
            'KA': (landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value], (-50, 0)),
            'AA': (landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value], (-50, 20)),
        }
        
        for angle_name, (landmark, offset) in label_positions.items():
            if angle_name in angles:
                x = int(landmark.x * width) + offset[0]
                y = int(landmark.y * height) + offset[1]
                
                text = f"{angle_name}: {angles[angle_name]:.1f}°"
                
                # Draw text background
                (text_width, text_height), _ = cv2.getTextSize(
                    text, cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE, 2
                )
                cv2.rectangle(image, 
                            (x - 5, y - text_height - 5),
                            (x + text_width + 5, y + 5),
                            (0, 0, 0), -1)
                
                # Draw text
                cv2.putText(image, text, (x, y),
                           cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE,
                           COLORS['angle_text'], 2)
    
    def analyze_form_quality(self, angles) -> Tuple[str, Dict[str, str]]:
        """Analyze shooting form quality based on angles"""
        feedback = {}
        issues = []
        
        # Ideal angle ranges (from biomechanical research)
        ideal_ranges = {
            'EA': (85, 95),    # Elbow angle at release
            'SA': (80, 100),   # Shoulder angle
            'KA': (120, 140),  # Knee angle (preparatory phase)
            'HA': (160, 180),  # Hip angle (should be extended)
        }
        
        for angle_name, (min_val, max_val) in ideal_ranges.items():
            if angle_name in angles:
                value = angles[angle_name]
                if value < min_val:
                    feedback[angle_name] = f"Too acute ({value:.1f}°, ideal: {min_val}-{max_val}°)"
                    issues.append(angle_name)
                elif value > max_val:
                    feedback[angle_name] = f"Too obtuse ({value:.1f}°, ideal: {min_val}-{max_val}°)"
                    issues.append(angle_name)
                else:
                    feedback[angle_name] = f"Good ({value:.1f}°)"
        
        # Determine overall assessment
        if len(issues) == 0:
            assessment = "GOOD_FORM"
        elif len(issues) <= 2:
            assessment = "NEEDS_MINOR_ADJUSTMENT"
        else:
            assessment = "NEEDS_WORK"
        
        return assessment, feedback
    
    def process_image(self, image_path, output_path=None, show_angles=True):
        """Process single image and create professional skeleton overlay"""
        # Read image
        image = cv2.imread(str(image_path))
        if image is None:
            print(f"Error: Could not read image {image_path}")
            return None
        
        # Convert to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            print(f"No pose detected in {image_path}")
            return None
        
        # Draw professional skeleton
        annotated_image, angles = self.draw_professional_skeleton(
            image, results.pose_landmarks.landmark, show_angles
        )
        
        # Analyze form
        assessment, feedback = self.analyze_form_quality(angles)
        
        # Add assessment label
        label_text = assessment.replace('_', ' ')
        color = COLORS['good_overlay'] if 'GOOD' in assessment else COLORS['bad_overlay']
        
        cv2.rectangle(annotated_image, (10, 10), (400, 60), (0, 0, 0), -1)
        cv2.putText(annotated_image, label_text, (20, 45),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.2, color, 3)
        
        # Save output
        if output_path:
            cv2.imwrite(str(output_path), annotated_image)
            print(f"Saved: {output_path}")
        
        return {
            'image': annotated_image,
            'angles': angles,
            'assessment': assessment,
            'feedback': feedback
        }


def create_professional_mockups():
    """Create professional mockups matching reference images"""
    print("="*60)
    print("CREATING PROFESSIONAL SKELETON OVERLAY MOCKUPS")
    print("="*60)
    
    overlay = SkeletonOverlay(confidence=0.5, complexity=2)
    
    # Find sample images from training data
    base_dir = Path(__file__).parent
    mockup_dir = base_dir.parent / "template_mockups"
    mockup_dir.mkdir(exist_ok=True)
    
    # Look for good quality sample images
    good_form_dir = base_dir / "form_quality_classifier" / "good_form"
    needs_work_dir = base_dir / "form_quality_classifier" / "needs_work"
    
    results = []
    
    # Process good form example
    if good_form_dir.exists():
        good_images = list(good_form_dir.glob("*.jpg"))[:5]  # Try first 5
        for img_path in good_images:
            output_path = mockup_dir / f"professional_good_form_{img_path.stem}.png"
            result = overlay.process_image(img_path, output_path, show_angles=True)
            if result:
                results.append(('good', result))
                print(f"\n✓ Created GOOD FORM mockup")
                break
    
    # Process needs work example
    if needs_work_dir.exists():
        needs_work_images = list(needs_work_dir.glob("*.jpg"))[:5]  # Try first 5
        for img_path in needs_work_images:
            output_path = mockup_dir / f"professional_needs_work_{img_path.stem}.png"
            result = overlay.process_image(img_path, output_path, show_angles=True)
            if result:
                results.append(('needs_work', result))
                print(f"\n✓ Created NEEDS WORK mockup")
                break
    
    # Generate comparison document
    if len(results) == 2:
        create_comparison_document(results, mockup_dir)
    
    print(f"\n{'='*60}")
    print(f"Mockups saved to: {mockup_dir}")
    print(f"{'='*60}")


def create_comparison_document(results, output_dir):
    """Create markdown document comparing the mockups"""
    doc = """# Professional Skeleton Overlay - Mockup Comparison

Generated with MediaPipe Pose Detection

## Keypoint Structure (18 points matching reference)

```
0-4:   Eyes, Ears, Nose (facial landmarks)
5-10:  Shoulders, Elbows, Wrists (upper body)
11-16: Hips, Knees, Ankles (lower body)  
17-22: Hand landmarks (fingers, thumb)
23-32: Foot landmarks (heel, toe)
```

## Skeleton Connections
- **Head:** Eyes ↔ Ears ↔ Nose
- **Torso:** Shoulders ↔ Hips (bilateral)
- **Arms:** Shoulder → Elbow → Wrist → Hand
- **Legs:** Hip → Knee → Ankle → Foot

## Angle Measurements

"""
    
    for category, result in results:
        doc += f"\n### {category.upper()} - {result['assessment']}\n\n"
        doc += "**Biomechanical Angles:**\n"
        for angle_name, value in result['angles'].items():
            doc += f"- **{angle_name}:** {value:.2f}°\n"
        
        doc += "\n**Feedback:**\n"
        for angle_name, feedback in result['feedback'].items():
            doc += f"- **{angle_name}:** {feedback}\n"
        doc += "\n"
    
    doc += """
## Visualization Features
- **Keypoints:** Cyan circles (8px radius) with white borders
- **Skeleton:** White lines (2px thickness) connecting joints
- **Angles:** White text labels with black backgrounds
- **Assessment:** Color-coded (Green = Good, Red = Needs Work)

## Angle Definitions
- **SA (Shoulder Angle):** Torso to upper arm angle
- **EA (Elbow Angle):** Upper arm to forearm angle  
- **HA (Hip Angle):** Torso to thigh angle
- **KA (Knee Angle):** Thigh to shin angle
- **AA (Ankle Angle):** Shin to foot angle
- **RA (Release Angle):** Arm angle at ball release
- **RH (Release Height):** Wrist height relative to body
- **EH (Elbow Height):** Elbow height relative to shoulder
- **VD (Vertical Displacement):** Overall body extension

## Implementation
- **Library:** MediaPipe Pose (Model Complexity: 2)
- **Detection Confidence:** 0.5 threshold
- **Color Scheme:** Professional cyan/white matching reference images
"""
    
    doc_path = output_dir / "PROFESSIONAL_SKELETON_DOCUMENTATION.md"
    with open(doc_path, 'w') as f:
        f.write(doc)
    
    print(f"Documentation saved: {doc_path}")


if __name__ == "__main__":
    create_professional_mockups()
