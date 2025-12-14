#!/usr/bin/env python3
"""
OpenCV Visualizer - FREE TIER
Professional visual overlays using only OpenCV (no API costs)

Creates professional-looking annotated images with:
- Skeleton overlay (33 keypoints from MediaPipe)
- Biomechanical angle measurements
- Form quality assessment
- Color-coded feedback (green/yellow/red)
- Professional text annotations
- Side-by-side comparisons

This is the FREE alternative to ShotStack video rendering.
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize MediaPipe for drawing utilities
mp_pose = mp.solutions.pose
mp_drawing = mp.solutions.drawing_utils

# Professional color scheme
COLORS = {
    'keypoint': (255, 200, 100),     # Cyan/light blue for keypoints
    'skeleton': (255, 255, 255),      # White for skeleton lines
    'good': (0, 255, 0),              # Green for good form
    'fair': (0, 255, 255),            # Yellow for fair form
    'poor': (0, 0, 255),              # Red for poor form
    'text': (255, 255, 255),          # White text
    'background': (0, 0, 0),          # Black background
    'angle_line': (200, 200, 200),    # Gray for angle lines
    'overlay_bg': (0, 0, 0, 180)      # Semi-transparent black
}

# Visualization settings
KEYPOINT_RADIUS = 8
SKELETON_THICKNESS = 3
ANGLE_TEXT_SIZE = 0.6
HEADER_TEXT_SIZE = 1.2
INFO_TEXT_SIZE = 0.5


class OpenCVVisualizer:
    """
    OpenCV-based visualizer for basketball shooting form
    FREE TIER alternative to ShotStack
    """
    
    def __init__(self):
        """Initialize visualizer"""
        logger.info("OpenCV Visualizer initialized (FREE tier)")
        
        # Optimal angle ranges for color coding
        self.optimal_ranges = {
            'elbow_angle': (85, 95),
            'shoulder_angle': (80, 100),
            'knee_angle': (120, 140),
            'hip_angle': (160, 180),
            'release_height': (0.4, 0.6)
        }
    
    def get_skeleton_connections(self) -> List[Tuple[int, int]]:
        """Define skeleton connections for drawing"""
        return [
            # Face/Head
            (mp_pose.PoseLandmark.LEFT_EYE.value, mp_pose.PoseLandmark.RIGHT_EYE.value),
            (mp_pose.PoseLandmark.LEFT_EYE.value, mp_pose.PoseLandmark.NOSE.value),
            (mp_pose.PoseLandmark.RIGHT_EYE.value, mp_pose.PoseLandmark.NOSE.value),
            
            # Torso
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_SHOULDER.value),
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.LEFT_HIP.value),
            (mp_pose.PoseLandmark.RIGHT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_HIP.value),
            (mp_pose.PoseLandmark.LEFT_HIP.value, mp_pose.PoseLandmark.RIGHT_HIP.value),
            
            # Right Arm (shooting arm)
            (mp_pose.PoseLandmark.RIGHT_SHOULDER.value, mp_pose.PoseLandmark.RIGHT_ELBOW.value),
            (mp_pose.PoseLandmark.RIGHT_ELBOW.value, mp_pose.PoseLandmark.RIGHT_WRIST.value),
            (mp_pose.PoseLandmark.RIGHT_WRIST.value, mp_pose.PoseLandmark.RIGHT_INDEX.value),
            (mp_pose.PoseLandmark.RIGHT_WRIST.value, mp_pose.PoseLandmark.RIGHT_THUMB.value),
            
            # Left Arm
            (mp_pose.PoseLandmark.LEFT_SHOULDER.value, mp_pose.PoseLandmark.LEFT_ELBOW.value),
            (mp_pose.PoseLandmark.LEFT_ELBOW.value, mp_pose.PoseLandmark.LEFT_WRIST.value),
            (mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.LEFT_INDEX.value),
            (mp_pose.PoseLandmark.LEFT_WRIST.value, mp_pose.PoseLandmark.LEFT_THUMB.value),
            
            # Right Leg
            (mp_pose.PoseLandmark.RIGHT_HIP.value, mp_pose.PoseLandmark.RIGHT_KNEE.value),
            (mp_pose.PoseLandmark.RIGHT_KNEE.value, mp_pose.PoseLandmark.RIGHT_ANKLE.value),
            (mp_pose.PoseLandmark.RIGHT_ANKLE.value, mp_pose.PoseLandmark.RIGHT_FOOT_INDEX.value),
            
            # Left Leg
            (mp_pose.PoseLandmark.LEFT_HIP.value, mp_pose.PoseLandmark.LEFT_KNEE.value),
            (mp_pose.PoseLandmark.LEFT_KNEE.value, mp_pose.PoseLandmark.LEFT_ANKLE.value),
            (mp_pose.PoseLandmark.LEFT_ANKLE.value, mp_pose.PoseLandmark.LEFT_FOOT_INDEX.value),
        ]
    
    def get_angle_color(self, angle_name: str, angle_value: float) -> Tuple[int, int, int]:
        """
        Get color for angle based on optimal range
        
        Returns:
            BGR color tuple (green/yellow/red)
        """
        if angle_name not in self.optimal_ranges:
            return COLORS['skeleton']
        
        min_val, max_val = self.optimal_ranges[angle_name]
        
        if min_val <= angle_value <= max_val:
            return COLORS['good']  # Green - optimal
        elif min_val - 10 <= angle_value <= max_val + 10:
            return COLORS['fair']  # Yellow - acceptable
        else:
            return COLORS['poor']  # Red - needs improvement
    
    def draw_skeleton_overlay(
        self,
        image: np.ndarray,
        keypoints: List[Dict],
        show_keypoint_numbers: bool = False
    ) -> np.ndarray:
        """
        Draw professional skeleton overlay
        
        Args:
            image: Input image (BGR)
            keypoints: List of keypoint dictionaries from MediaPipe
            show_keypoint_numbers: Whether to show keypoint IDs
            
        Returns:
            Image with skeleton overlay
        """
        height, width = image.shape[:2]
        annotated = image.copy()
        
        # Convert keypoints to landmarks format
        landmarks = []
        for kp in keypoints:
            landmarks.append(type('Landmark', (), {
                'x': kp['x'],
                'y': kp['y'],
                'z': kp['z'],
                'visibility': kp['visibility']
            })())
        
        # Draw skeleton connections
        connections = self.get_skeleton_connections()
        for start_idx, end_idx in connections:
            try:
                start = landmarks[start_idx]
                end = landmarks[end_idx]
                
                if start.visibility > 0.5 and end.visibility > 0.5:
                    start_point = (int(start.x * width), int(start.y * height))
                    end_point = (int(end.x * width), int(end.y * height))
                    
                    cv2.line(annotated, start_point, end_point,
                            COLORS['skeleton'], SKELETON_THICKNESS)
            except:
                pass
        
        # Draw keypoints
        for idx, landmark in enumerate(landmarks):
            if landmark.visibility > 0.5:
                x = int(landmark.x * width)
                y = int(landmark.y * height)
                
                # Draw filled circle
                cv2.circle(annotated, (x, y), KEYPOINT_RADIUS,
                          COLORS['keypoint'], -1)
                # Draw border
                cv2.circle(annotated, (x, y), KEYPOINT_RADIUS,
                          COLORS['skeleton'], 2)
                
                # Optionally show keypoint numbers
                if show_keypoint_numbers:
                    cv2.putText(annotated, str(idx), (x + 10, y - 10),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.3,
                               COLORS['text'], 1)
        
        return annotated
    
    def draw_angle_annotations(
        self,
        image: np.ndarray,
        keypoints: List[Dict],
        angles: Dict[str, float]
    ) -> np.ndarray:
        """
        Draw angle measurements on image
        
        Args:
            image: Input image with skeleton overlay
            keypoints: List of keypoint dictionaries
            angles: Dictionary of angle measurements
            
        Returns:
            Image with angle annotations
        """
        height, width = image.shape[:2]
        annotated = image.copy()
        
        # Convert keypoints to landmarks
        landmarks = []
        for kp in keypoints:
            landmarks.append(type('Landmark', (), {
                'x': kp['x'],
                'y': kp['y'],
                'z': kp['z'],
                'visibility': kp['visibility']
            })())
        
        # Define angle label positions (landmark index, offset)
        angle_positions = {
            'shoulder_angle': (mp_pose.PoseLandmark.RIGHT_SHOULDER.value, (-80, -20)),
            'elbow_angle': (mp_pose.PoseLandmark.RIGHT_ELBOW.value, (-80, 0)),
            'wrist_angle': (mp_pose.PoseLandmark.RIGHT_WRIST.value, (-80, 20)),
            'hip_angle': (mp_pose.PoseLandmark.RIGHT_HIP.value, (20, -20)),
            'knee_angle': (mp_pose.PoseLandmark.RIGHT_KNEE.value, (20, 0)),
            'ankle_angle': (mp_pose.PoseLandmark.RIGHT_ANKLE.value, (20, 20)),
        }
        
        for angle_name, (landmark_idx, offset) in angle_positions.items():
            if angle_name in angles:
                try:
                    landmark = landmarks[landmark_idx]
                    if landmark.visibility < 0.5:
                        continue
                    
                    x = int(landmark.x * width) + offset[0]
                    y = int(landmark.y * height) + offset[1]
                    
                    angle_value = angles[angle_name]
                    text = f"{angle_name.replace('_', ' ').title()}: {angle_value:.1f}°"
                    
                    # Get color based on optimal range
                    color = self.get_angle_color(angle_name, angle_value)
                    
                    # Draw text background
                    (text_width, text_height), _ = cv2.getTextSize(
                        text, cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE, 2
                    )
                    cv2.rectangle(annotated,
                                (x - 5, y - text_height - 5),
                                (x + text_width + 5, y + 5),
                                COLORS['background'], -1)
                    
                    # Draw text
                    cv2.putText(annotated, text, (x, y),
                               cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE,
                               color, 2)
                except:
                    pass
        
        return annotated
    
    def draw_form_assessment(
        self,
        image: np.ndarray,
        form_quality: str,
        score_percentage: float,
        shooting_phase: str
    ) -> np.ndarray:
        """
        Draw form assessment header
        
        Args:
            image: Input image
            form_quality: Quality assessment (excellent/good/fair/needs_improvement)
            score_percentage: Score as percentage
            shooting_phase: Identified shooting phase
            
        Returns:
            Image with assessment header
        """
        annotated = image.copy()
        height, width = image.shape[:2]
        
        # Create header bar
        header_height = 80
        cv2.rectangle(annotated, (0, 0), (width, header_height),
                     COLORS['background'], -1)
        
        # Determine color based on quality
        if form_quality == 'excellent':
            color = COLORS['good']
        elif form_quality == 'good':
            color = COLORS['good']
        elif form_quality == 'fair':
            color = COLORS['fair']
        else:
            color = COLORS['poor']
        
        # Draw assessment text
        assessment_text = f"Form: {form_quality.upper().replace('_', ' ')}"
        cv2.putText(annotated, assessment_text, (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, HEADER_TEXT_SIZE,
                   color, 3)
        
        # Draw score
        score_text = f"Score: {score_percentage:.1f}%"
        cv2.putText(annotated, score_text, (20, 70),
                   cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE,
                   COLORS['text'], 2)
        
        # Draw phase
        phase_text = f"Phase: {shooting_phase.replace('_', ' ').title()}"
        (text_width, _), _ = cv2.getTextSize(
            phase_text, cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE, 2
        )
        cv2.putText(annotated, phase_text, (width - text_width - 20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE,
                   COLORS['text'], 2)
        
        return annotated
    
    def draw_feedback_box(
        self,
        image: np.ndarray,
        feedback_text: List[str]
    ) -> np.ndarray:
        """
        Draw feedback box with coaching tips
        
        Args:
            image: Input image
            feedback_text: List of feedback strings
            
        Returns:
            Image with feedback box
        """
        annotated = image.copy()
        height, width = image.shape[:2]
        
        # Calculate box size
        box_width = width - 40
        box_height = min(150, 30 * len(feedback_text) + 40)
        box_x = 20
        box_y = height - box_height - 20
        
        # Draw semi-transparent box
        overlay = annotated.copy()
        cv2.rectangle(overlay, (box_x, box_y),
                     (box_x + box_width, box_y + box_height),
                     COLORS['background'], -1)
        cv2.addWeighted(overlay, 0.8, annotated, 0.2, 0, annotated)
        
        # Draw title
        cv2.putText(annotated, "Coaching Feedback:", (box_x + 10, box_y + 25),
                   cv2.FONT_HERSHEY_SIMPLEX, ANGLE_TEXT_SIZE,
                   COLORS['text'], 2)
        
        # Draw feedback items
        for idx, feedback in enumerate(feedback_text[:4]):  # Max 4 items
            y_pos = box_y + 50 + (idx * 25)
            cv2.putText(annotated, f"• {feedback}", (box_x + 10, y_pos),
                       cv2.FONT_HERSHEY_SIMPLEX, INFO_TEXT_SIZE,
                       COLORS['text'], 1)
        
        return annotated
    
    def create_split_screen(
        self,
        original: np.ndarray,
        annotated: np.ndarray,
        title: str = "Before / After"
    ) -> np.ndarray:
        """
        Create side-by-side comparison
        
        Args:
            original: Original image
            annotated: Annotated image
            title: Title for comparison
            
        Returns:
            Combined split-screen image
        """
        height, width = original.shape[:2]
        
        # Resize images to same size
        target_width = 800
        target_height = int(height * (target_width / width))
        
        original_resized = cv2.resize(original, (target_width, target_height))
        annotated_resized = cv2.resize(annotated, (target_width, target_height))
        
        # Create combined image
        combined = np.hstack([original_resized, annotated_resized])
        
        # Add title
        title_height = 60
        title_bar = np.zeros((title_height, combined.shape[1], 3), dtype=np.uint8)
        cv2.putText(title_bar, title, (20, 40),
                   cv2.FONT_HERSHEY_SIMPLEX, 1.0,
                   COLORS['text'], 2)
        
        # Combine with title
        final = np.vstack([title_bar, combined])
        
        return final
    
    def render_complete_analysis(
        self,
        image_path: str,
        analysis_result: Dict,
        feedback_text: Optional[List[str]] = None,
        output_path: Optional[str] = None
    ) -> np.ndarray:
        """
        Render complete analysis visualization
        
        Args:
            image_path: Path to original image
            analysis_result: Complete analysis result from MediaPipe
            feedback_text: Optional coaching feedback
            output_path: Optional path to save output
            
        Returns:
            Fully annotated image
        """
        logger.info(f"Rendering complete analysis for: {image_path}")
        
        # Read original image
        image = cv2.imread(image_path)
        if image is None:
            logger.error(f"Could not read image: {image_path}")
            return None
        
        # Draw skeleton overlay
        annotated = self.draw_skeleton_overlay(
            image,
            analysis_result['keypoints']['data']
        )
        
        # Draw angle annotations
        annotated = self.draw_angle_annotations(
            annotated,
            analysis_result['keypoints']['data'],
            analysis_result['biomechanical_angles']
        )
        
        # Draw form assessment header
        annotated = self.draw_form_assessment(
            annotated,
            analysis_result['form_quality']['assessment'],
            analysis_result['form_quality']['score_percentage'],
            analysis_result['shooting_phase']['phase']
        )
        
        # Draw feedback box if provided
        if feedback_text:
            annotated = self.draw_feedback_box(annotated, feedback_text)
        
        # Save output if path provided
        if output_path:
            cv2.imwrite(output_path, annotated)
            logger.info(f"Saved annotated image to: {output_path}")
        
        return annotated


# Test function
if __name__ == "__main__":
    print("="*60)
    print("OpenCV Visualizer - FREE TIER")
    print("="*60)
    
    # This is a standalone test - normally would be used with MediaPipe analyzer
    visualizer = OpenCVVisualizer()
    print("✓ Visualizer initialized successfully")
    print("  - Skeleton overlay")
    print("  - Angle annotations")
    print("  - Form assessment")
    print("  - Feedback box")
    print("  - Split-screen comparison")
