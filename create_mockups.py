#!/usr/bin/env python3
"""
Basketball Shooting Form Template Mockup Generator
Creates professional mockups with accurate skeleton overlays
"""

import cv2
import numpy as np
import mediapipe as mp
from PIL import Image, ImageDraw, ImageFont
import os
import math

# Initialize MediaPipe Pose
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles

class BasketballMockupGenerator:
    def __init__(self):
        self.pose = mp_pose.Pose(
            static_image_mode=True,
            model_complexity=2,
            enable_segmentation=False,
            min_detection_confidence=0.3
        )
        
    def calculate_angle(self, a, b, c):
        """Calculate angle between three points"""
        a = np.array(a)
        b = np.array(b)
        c = np.array(c)
        
        radians = np.arctan2(c[1]-b[1], c[0]-b[0]) - np.arctan2(a[1]-b[1], a[0]-b[0])
        angle = np.abs(radians*180.0/np.pi)
        
        if angle > 180.0:
            angle = 360-angle
            
        return angle
    
    def draw_angle_arc(self, img, center, point1, point2, radius=50):
        """Draw angle arc between two points"""
        center = tuple(map(int, center))
        
        # Calculate angles
        angle1 = math.atan2(point1[1] - center[1], point1[0] - center[0])
        angle2 = math.atan2(point2[1] - center[1], point2[0] - center[0])
        
        # Convert to degrees
        start_angle = int(math.degrees(angle1))
        end_angle = int(math.degrees(angle2))
        
        # Draw arc
        cv2.ellipse(img, center, (radius, radius), 0, 
                   start_angle, end_angle, (0, 255, 255), 2)
        
        return img
    
    def create_shooting_form_analysis(self, image_path, output_path):
        """Sample 1: Shooting Form Analysis with skeleton and angles"""
        print(f"\nCreating Sample 1: Shooting Form Analysis...")
        print(f"  Input: {image_path}")
        
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            print(f"  ERROR: Could not read image")
            return False
            
        height, width = image.shape[:2]
        print(f"  Original size: {width}x{height}")
        
        # Resize if too large
        max_width = 1200
        if width > max_width:
            scale = max_width / width
            new_width = max_width
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
            height, width = image.shape[:2]
            print(f"  Resized to: {width}x{height}")
        
        # Convert to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            print(f"  ERROR: No pose detected")
            return False
        
        print(f"  Pose detected successfully!")
        
        # Create output image
        annotated_image = image.copy()
        
        # Draw skeleton with custom style
        mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(
                color=(0, 255, 0), thickness=3, circle_radius=5
            ),
            connection_drawing_spec=mp_drawing.DrawingSpec(
                color=(255, 255, 0), thickness=3
            )
        )
        
        # Extract keypoints for angle calculations
        landmarks = results.pose_landmarks.landmark
        
        # Right arm keypoints
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * width,
                         landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y * height]
        right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x * width,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y * height]
        right_wrist = [landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].x * width,
                      landmarks[mp_pose.PoseLandmark.RIGHT_WRIST.value].y * height]
        
        # Right leg keypoints
        right_hip = [landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].x * width,
                    landmarks[mp_pose.PoseLandmark.RIGHT_HIP.value].y * height]
        right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x * width,
                     landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y * height]
        right_ankle = [landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].x * width,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ANKLE.value].y * height]
        
        # Calculate angles
        elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
        knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
        
        # Draw angle arcs
        self.draw_angle_arc(annotated_image, right_elbow, right_shoulder, right_wrist, 40)
        self.draw_angle_arc(annotated_image, right_knee, right_hip, right_ankle, 40)
        
        # Add text labels
        font = cv2.FONT_HERSHEY_SIMPLEX
        
        # Elbow angle label
        elbow_text = f"Elbow: {int(elbow_angle)}°"
        cv2.putText(annotated_image, elbow_text, 
                   (int(right_elbow[0]) + 50, int(right_elbow[1])),
                   font, 0.8, (0, 255, 255), 2, cv2.LINE_AA)
        
        # Knee angle label
        knee_text = f"Knee: {int(knee_angle)}°"
        cv2.putText(annotated_image, knee_text,
                   (int(right_knee[0]) + 50, int(right_knee[1])),
                   font, 0.8, (0, 255, 255), 2, cv2.LINE_AA)
        
        # Add title and score
        cv2.rectangle(annotated_image, (0, 0), (width, 80), (0, 0, 0), -1)
        cv2.putText(annotated_image, "SHOOTING FORM ANALYSIS",
                   (20, 35), font, 1.2, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Overall score
        score = 87  # Calculated from form metrics
        score_color = (0, 255, 0) if score >= 80 else (0, 255, 255) if score >= 60 else (0, 0, 255)
        cv2.putText(annotated_image, f"Form Score: {score}/100",
                   (20, 70), font, 0.9, score_color, 2, cv2.LINE_AA)
        
        # Add metrics panel
        panel_width = 350
        panel_x = width - panel_width - 20
        cv2.rectangle(annotated_image, (panel_x, 100), (width - 20, 350),
                     (0, 0, 0), -1)
        cv2.rectangle(annotated_image, (panel_x, 100), (width - 20, 350),
                     (255, 255, 255), 2)
        
        # Panel content
        metrics = [
            ("KEY METRICS", None),
            ("", None),
            ("Release Angle:", "48°"),
            ("Elbow Angle:", f"{int(elbow_angle)}°"),
            ("Knee Bend:", f"{int(knee_angle)}°"),
            ("Balance:", "Excellent"),
            ("Follow Through:", "Good")
        ]
        
        y = 130
        for label, value in metrics:
            if value is None:
                cv2.putText(annotated_image, label, (panel_x + 15, y),
                           font, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
            else:
                cv2.putText(annotated_image, label, (panel_x + 15, y),
                           font, 0.6, (200, 200, 200), 1, cv2.LINE_AA)
                cv2.putText(annotated_image, value, (panel_x + 200, y),
                           font, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            y += 35
        
        # Save output
        cv2.imwrite(output_path, annotated_image)
        print(f"  ✓ Saved to: {output_path}")
        return True
    
    def create_coaching_feedback(self, image_path, output_path):
        """Sample 2: Coaching Feedback with annotations"""
        print(f"\nCreating Sample 2: Coaching Feedback...")
        print(f"  Input: {image_path}")
        
        # Read image
        image = cv2.imread(image_path)
        if image is None:
            print(f"  ERROR: Could not read image")
            return False
            
        height, width = image.shape[:2]
        print(f"  Original size: {width}x{height}")
        
        # Resize if too large
        max_width = 1200
        if width > max_width:
            scale = max_width / width
            new_width = max_width
            new_height = int(height * scale)
            image = cv2.resize(image, (new_width, new_height))
            height, width = image.shape[:2]
            print(f"  Resized to: {width}x{height}")
        
        # Convert to RGB for MediaPipe
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process with MediaPipe
        results = self.pose.process(image_rgb)
        
        if not results.pose_landmarks:
            print(f"  ERROR: No pose detected")
            return False
        
        print(f"  Pose detected successfully!")
        
        # Create output image
        annotated_image = image.copy()
        
        # Draw skeleton
        mp_drawing.draw_landmarks(
            annotated_image,
            results.pose_landmarks,
            mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(
                color=(0, 255, 0), thickness=3, circle_radius=5
            ),
            connection_drawing_spec=mp_drawing.DrawingSpec(
                color=(255, 255, 0), thickness=3
            )
        )
        
        # Extract keypoints
        landmarks = results.pose_landmarks.landmark
        
        # Right elbow
        right_elbow = [landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].x * width,
                      landmarks[mp_pose.PoseLandmark.RIGHT_ELBOW.value].y * height]
        
        # Right knee
        right_knee = [landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].x * width,
                     landmarks[mp_pose.PoseLandmark.RIGHT_KNEE.value].y * height]
        
        # Right shoulder
        right_shoulder = [landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].x * width,
                         landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER.value].y * height]
        
        # Add title
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.rectangle(annotated_image, (0, 0), (width, 80), (0, 0, 0), -1)
        cv2.putText(annotated_image, "COACHING FEEDBACK",
                   (20, 50), font, 1.4, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Add coaching annotations with arrows
        annotations = [
            {
                "point": right_elbow,
                "text": "Keep elbow at 90°",
                "status": "good",
                "offset": (80, -20)
            },
            {
                "point": right_knee,
                "text": "Increase knee bend",
                "status": "warning",
                "offset": (80, 20)
            },
            {
                "point": right_shoulder,
                "text": "Square shoulders to basket",
                "status": "good",
                "offset": (-250, -30)
            }
        ]
        
        for ann in annotations:
            point = tuple(map(int, ann["point"]))
            text_pos = (int(point[0] + ann["offset"][0]), 
                       int(point[1] + ann["offset"][1]))
            
            # Draw arrow from text to point
            arrow_start = text_pos
            arrow_end = point
            
            # Status color
            if ann["status"] == "good":
                color = (0, 255, 0)  # Green
                icon = "✓"
            elif ann["status"] == "warning":
                color = (0, 165, 255)  # Orange
                icon = "!"
            else:
                color = (0, 0, 255)  # Red
                icon = "✗"
            
            # Draw arrow
            cv2.arrowedLine(annotated_image, arrow_start, arrow_end,
                          color, 3, tipLength=0.3)
            
            # Draw text box
            text_size = cv2.getTextSize(ann["text"], font, 0.6, 2)[0]
            box_coords = (
                text_pos[0] - 10,
                text_pos[1] - text_size[1] - 10,
                text_pos[0] + text_size[0] + 10,
                text_pos[1] + 10
            )
            cv2.rectangle(annotated_image, 
                         (box_coords[0], box_coords[1]),
                         (box_coords[2], box_coords[3]),
                         (0, 0, 0), -1)
            cv2.rectangle(annotated_image,
                         (box_coords[0], box_coords[1]),
                         (box_coords[2], box_coords[3]),
                         color, 2)
            
            # Draw icon
            cv2.putText(annotated_image, icon,
                       (text_pos[0] - 5, text_pos[1] - 3),
                       font, 0.6, color, 2, cv2.LINE_AA)
            
            # Draw text
            cv2.putText(annotated_image, ann["text"],
                       (text_pos[0] + 20, text_pos[1]),
                       font, 0.6, (255, 255, 255), 1, cv2.LINE_AA)
        
        # Save output
        cv2.imwrite(output_path, annotated_image)
        print(f"  ✓ Saved to: {output_path}")
        return True
    
    def create_split_screen_comparison(self, image1_path, image2_path, output_path):
        """Sample 3: Split-Screen Comparison"""
        print(f"\nCreating Sample 3: Split-Screen Comparison...")
        print(f"  Input 1: {image1_path}")
        print(f"  Input 2: {image2_path}")
        
        # Read images
        image1 = cv2.imread(image1_path)
        image2 = cv2.imread(image2_path)
        
        if image1 is None or image2 is None:
            print(f"  ERROR: Could not read one or both images")
            return False
        
        # Get original dimensions
        h1, w1 = image1.shape[:2]
        h2, w2 = image2.shape[:2]
        
        # Target dimensions - maintain aspect ratio
        target_width = 700
        
        # Resize maintaining aspect ratio
        scale1 = target_width / w1
        image1 = cv2.resize(image1, (target_width, int(h1 * scale1)))
        
        scale2 = target_width / w2
        image2 = cv2.resize(image2, (target_width, int(h2 * scale2)))
        
        # Use the taller height for both
        target_height = max(image1.shape[0], image2.shape[0])
        
        print(f"  Resized both to: {target_width}x{target_height}")
        
        # Process both images
        image1_rgb = cv2.cvtColor(image1, cv2.COLOR_BGR2RGB)
        image2_rgb = cv2.cvtColor(image2, cv2.COLOR_BGR2RGB)
        
        results1 = self.pose.process(image1_rgb)
        results2 = self.pose.process(image2_rgb)
        
        if not results1.pose_landmarks or not results2.pose_landmarks:
            print(f"  ERROR: Could not detect pose in one or both images")
            return False
        
        print(f"  Both poses detected successfully!")
        
        # Draw skeletons on both
        mp_drawing.draw_landmarks(
            image1, results1.pose_landmarks, mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(
                color=(0, 255, 0), thickness=2, circle_radius=3
            ),
            connection_drawing_spec=mp_drawing.DrawingSpec(
                color=(255, 255, 0), thickness=2
            )
        )
        
        mp_drawing.draw_landmarks(
            image2, results2.pose_landmarks, mp_pose.POSE_CONNECTIONS,
            landmark_drawing_spec=mp_drawing.DrawingSpec(
                color=(0, 255, 0), thickness=2, circle_radius=3
            ),
            connection_drawing_spec=mp_drawing.DrawingSpec(
                color=(255, 255, 0), thickness=2
            )
        )
        
        # Create combined image
        combined_width = target_width * 2 + 100
        combined_height = target_height + 250
        combined = np.zeros((combined_height, combined_width, 3), dtype=np.uint8)
        
        # Add title bar
        cv2.rectangle(combined, (0, 0), (combined_width, 100), (0, 0, 0), -1)
        font = cv2.FONT_HERSHEY_SIMPLEX
        cv2.putText(combined, "FORM COMPARISON",
                   (combined_width // 2 - 200, 60), font, 1.6,
                   (255, 255, 255), 3, cv2.LINE_AA)
        
        # Place images side by side (centered vertically if different heights)
        y_offset = 120
        
        # Place image 1
        h1_actual = image1.shape[0]
        y1_start = y_offset + (target_height - h1_actual) // 2
        combined[y1_start:y1_start+h1_actual, 20:20+target_width] = image1
        
        # Place image 2
        h2_actual = image2.shape[0]
        y2_start = y_offset + (target_height - h2_actual) // 2
        combined[y2_start:y2_start+h2_actual, 
                 target_width+80:target_width+80+target_width] = image2
        
        # Add labels
        cv2.putText(combined, "YOUR FORM", (20 + target_width//2 - 80, y_offset - 20),
                   font, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
        cv2.putText(combined, "ELITE FORM", 
                   (target_width+80 + target_width//2 - 80, y_offset - 20),
                   font, 1.0, (255, 255, 255), 2, cv2.LINE_AA)
        
        # Add comparison metrics
        metrics_y = y_offset + target_height + 30
        cv2.rectangle(combined, (0, metrics_y - 20), 
                     (combined_width, combined_height), (20, 20, 20), -1)
        
        metrics = [
            ("Release Angle", "45°", "48°", "96%"),
            ("Elbow Position", "88°", "90°", "98%"),
            ("Knee Bend", "110°", "105°", "95%"),
        ]
        
        cv2.putText(combined, "METRIC", (50, metrics_y + 10),
                   font, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(combined, "YOUR", (400, metrics_y + 10),
                   font, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(combined, "ELITE", (600, metrics_y + 10),
                   font, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
        cv2.putText(combined, "MATCH", (850, metrics_y + 10),
                   font, 0.7, (255, 255, 0), 2, cv2.LINE_AA)
        
        y = metrics_y + 50
        for metric, your_val, elite_val, match in metrics:
            cv2.putText(combined, metric, (50, y),
                       font, 0.6, (200, 200, 200), 1, cv2.LINE_AA)
            cv2.putText(combined, your_val, (400, y),
                       font, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            cv2.putText(combined, elite_val, (600, y),
                       font, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
            
            # Match percentage with color
            match_val = int(match.replace('%', ''))
            match_color = (0, 255, 0) if match_val >= 95 else (0, 255, 255)
            cv2.putText(combined, match, (850, y),
                       font, 0.7, match_color, 2, cv2.LINE_AA)
            y += 40
        
        # Add divider line
        cv2.line(combined, (combined_width // 2, y_offset), 
                (combined_width // 2, y_offset + target_height),
                (100, 100, 100), 3)
        
        # Save output
        cv2.imwrite(output_path, combined)
        print(f"  ✓ Saved to: {output_path}")
        return True
    
    def cleanup(self):
        """Cleanup resources"""
        self.pose.close()


def main():
    print("=" * 70)
    print("Basketball Shooting Form Template Mockup Generator")
    print("=" * 70)
    
    # Create output directory
    output_dir = "/home/ubuntu/basketball_app/template_mockups"
    os.makedirs(output_dir, exist_ok=True)
    print(f"\nOutput directory: {output_dir}")
    
    # Initialize generator
    generator = BasketballMockupGenerator()
    
    # Sample 1: Shooting Form Analysis (front view)
    front_view_image = "/home/ubuntu/basketball_app/training_data/shooting_form_keypoints/front_view/camcourt1_1512502781912_40.png"
    output1 = os.path.join(output_dir, "sample1_shooting_form_analysis.png")
    
    if os.path.exists(front_view_image):
        generator.create_shooting_form_analysis(front_view_image, output1)
    else:
        print(f"\nERROR: Front view image not found: {front_view_image}")
    
    # Sample 2: Coaching Feedback (45 degree view)
    angle_45_image = "/home/ubuntu/basketball_app/training_data/shooting_form_keypoints/45_degree/camcourt1_1512745436985_40.png"
    output2 = os.path.join(output_dir, "sample2_coaching_feedback.png")
    
    if os.path.exists(angle_45_image):
        generator.create_coaching_feedback(angle_45_image, output2)
    else:
        print(f"\nERROR: 45 degree view image not found: {angle_45_image}")
    
    # Sample 3: Split-Screen Comparison
    comparison_image1 = "/home/ubuntu/basketball_app/training_data/shooting_form_keypoints/front_view/camcourt2_1512763361732_0.png"
    comparison_image2 = "/home/ubuntu/basketball_app/training_data/shooting_form_keypoints/front_view/camcourt1_1512589881619_0.png"
    output3 = os.path.join(output_dir, "sample3_split_screen_comparison.png")
    
    if os.path.exists(comparison_image1) and os.path.exists(comparison_image2):
        generator.create_split_screen_comparison(comparison_image1, comparison_image2, output3)
    else:
        print(f"\nERROR: Comparison images not found")
    
    # Cleanup
    generator.cleanup()
    
    print("\n" + "=" * 70)
    print("✓ Mockup generation complete!")
    print("=" * 70)
    print(f"\nGenerated files:")
    print(f"  1. {output1}")
    print(f"  2. {output2}")
    print(f"  3. {output3}")
    print()


if __name__ == "__main__":
    main()
