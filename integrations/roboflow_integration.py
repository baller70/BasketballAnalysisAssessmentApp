"""
RoboFlow Integration Module for Basketball Shooting Form Analysis
Phase 4 - Complete Production Implementation

This module provides comprehensive integration with RoboFlow projects for:
- 18-point keypoint detection (based on OpenPose standard)
- 5 shooting phase identification
- Biomechanical angle calculation
- Form quality classification
- Ball trajectory tracking
"""

import os
import math
import base64
import requests
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from enum import Enum
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ShootingPhase(Enum):
    """Basketball shooting phases"""
    PRE_SHOT = "pre-shot"  # Ready position
    DIP = "dip"  # Ball lowering phase
    RISE = "rise"  # Upward motion
    RELEASE = "release"  # Ball release point
    FOLLOW_THROUGH = "follow-through"  # After release


class FormQuality(Enum):
    """Form quality assessment"""
    EXCELLENT = "excellent"
    GOOD = "good"
    FAIR = "fair"
    NEEDS_IMPROVEMENT = "needs_improvement"


@dataclass
class Keypoint:
    """Represents a single body keypoint"""
    id: int
    name: str
    x: float
    y: float
    confidence: float


@dataclass
class BiomechanicalAngles:
    """Calculated biomechanical angles"""
    elbow_angle: float  # Shooting arm elbow angle
    knee_bend: float  # Knee flexion angle
    wrist_angle: float  # Wrist extension angle
    shoulder_alignment: float  # Shoulder deviation from vertical
    release_angle: float  # Ball release trajectory angle
    hip_angle: float  # Hip flexion
    
    def to_dict(self) -> Dict[str, float]:
        return {
            "elbow_angle": round(self.elbow_angle, 2),
            "knee_bend": round(self.knee_bend, 2),
            "wrist_angle": round(self.wrist_angle, 2),
            "shoulder_alignment": round(self.shoulder_alignment, 2),
            "release_angle": round(self.release_angle, 2),
            "hip_angle": round(self.hip_angle, 2)
        }


class RoboFlowAnalyzer:
    """
    Main class for RoboFlow basketball shooting form analysis
    
    Integrates with 3 RoboFlow projects:
    1. basketball-shooting-form-keypoints - Keypoint detection
    2. basketball-form-quality-classifier - Form quality assessment
    3. basketball-ball-trajectory-tracker - Ball tracking
    """
    
    # OpenPose 18-keypoint standard (based on uploaded reference image)
    KEYPOINT_NAMES = {
        0: "neck",
        1: "mid_hip",
        2: "left_shoulder",
        3: "left_elbow",
        4: "left_wrist",
        5: "right_shoulder",
        6: "right_elbow",
        7: "right_wrist",
        8: "left_hip",
        9: "left_knee",
        10: "left_ankle",
        11: "right_hip",
        12: "right_knee",
        13: "right_ankle",
        14: "left_eye",
        15: "right_eye",
        16: "left_ear",
        17: "right_ear"
    }
    
    def __init__(self, api_key: str, workspace: str = "tbf-inc"):
        """
        Initialize RoboFlow analyzer
        
        Args:
            api_key: RoboFlow API key
            workspace: RoboFlow workspace name
        """
        self.api_key = api_key
        self.workspace = workspace
        self.base_url = "https://detect.roboflow.com"
        
        # Project configurations
        self.projects = {
            "keypoints": "basketball-shooting-form-keypoints",
            "quality": "basketball-form-quality-classifier",
            "trajectory": "basketball-ball-trajectory-tracker"
        }
        
        logger.info(f"Initialized RoboFlow analyzer for workspace: {workspace}")
    
    def detect_keypoints(self, image_path: str) -> Dict[str, Any]:
        """
        Detect 18 body keypoints using RoboFlow keypoint detection model
        
        Args:
            image_path: Path to image file or base64 encoded string
            
        Returns:
            Dictionary with keypoints and confidence scores
        """
        try:
            # Prepare image data
            if os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
            else:
                image_data = image_path  # Assume base64 encoded
            
            # Call RoboFlow API
            url = f"{self.base_url}/{self.projects['keypoints']}/1"
            params = {"api_key": self.api_key}
            
            response = requests.post(
                url,
                params=params,
                data=image_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            # Parse keypoints
            keypoints = self._parse_keypoints(result)
            
            logger.info(f"Detected {len(keypoints)} keypoints with avg confidence: {self._avg_confidence(keypoints):.2f}")
            
            return {
                "success": True,
                "keypoints": keypoints,
                "raw_response": result
            }
            
        except Exception as e:
            logger.error(f"Keypoint detection failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "keypoints": []
            }
    
    def identify_shooting_phase(self, keypoints: List[Keypoint]) -> ShootingPhase:
        """
        Identify current shooting phase based on keypoint positions
        
        Uses biomechanical analysis to determine:
        - Pre-shot: Ball below chest, knees bent
        - Dip: Ball at lowest point, maximum knee bend
        - Rise: Ball moving upward, legs extending
        - Release: Ball at highest point, arm extended
        - Follow-through: Ball released, arm still extended
        
        Args:
            keypoints: List of detected keypoints
            
        Returns:
            ShootingPhase enum
        """
        try:
            # Extract key positions
            wrist_y = self._get_keypoint_y(keypoints, "right_wrist")  # Assume right-handed
            shoulder_y = self._get_keypoint_y(keypoints, "right_shoulder")
            elbow_y = self._get_keypoint_y(keypoints, "right_elbow")
            knee_y = self._get_keypoint_y(keypoints, "right_knee")
            hip_y = self._get_keypoint_y(keypoints, "right_hip")
            
            # Calculate relative positions (lower y = higher on screen)
            elbow_angle = self.calculate_angle_from_keypoints(
                keypoints, "right_shoulder", "right_elbow", "right_wrist"
            )
            
            knee_angle = self.calculate_angle_from_keypoints(
                keypoints, "right_hip", "right_knee", "right_ankle"
            )
            
            # Phase identification logic
            if wrist_y > hip_y and knee_angle < 140:
                return ShootingPhase.PRE_SHOT
            elif wrist_y > shoulder_y and knee_angle < 130:
                return ShootingPhase.DIP
            elif wrist_y < shoulder_y and elbow_angle < 90 and knee_angle > 140:
                return ShootingPhase.RISE
            elif wrist_y < shoulder_y and elbow_angle > 160:
                return ShootingPhase.RELEASE
            else:
                return ShootingPhase.FOLLOW_THROUGH
                
        except Exception as e:
            logger.warning(f"Phase identification failed: {str(e)}, defaulting to PRE_SHOT")
            return ShootingPhase.PRE_SHOT
    
    def calculate_angles(self, keypoints: List[Keypoint]) -> BiomechanicalAngles:
        """
        Calculate all biomechanical angles from keypoints
        
        Args:
            keypoints: List of detected keypoints
            
        Returns:
            BiomechanicalAngles dataclass with all calculated angles
        """
        try:
            # Elbow angle (shoulder-elbow-wrist)
            elbow_angle = self.calculate_angle_from_keypoints(
                keypoints, "right_shoulder", "right_elbow", "right_wrist"
            )
            
            # Knee bend (hip-knee-ankle)
            knee_bend = self.calculate_angle_from_keypoints(
                keypoints, "right_hip", "right_knee", "right_ankle"
            )
            
            # Wrist angle (elbow-wrist-calculated point above wrist)
            wrist_angle = self._calculate_wrist_extension(keypoints)
            
            # Shoulder alignment (deviation from vertical)
            shoulder_alignment = self._calculate_shoulder_alignment(keypoints)
            
            # Release angle (trajectory from wrist)
            release_angle = self._calculate_release_angle(keypoints)
            
            # Hip angle (torso-hip-thigh)
            hip_angle = self.calculate_angle_from_keypoints(
                keypoints, "neck", "right_hip", "right_knee"
            )
            
            return BiomechanicalAngles(
                elbow_angle=elbow_angle,
                knee_bend=knee_bend,
                wrist_angle=wrist_angle,
                shoulder_alignment=shoulder_alignment,
                release_angle=release_angle,
                hip_angle=hip_angle
            )
            
        except Exception as e:
            logger.error(f"Angle calculation failed: {str(e)}")
            # Return default angles
            return BiomechanicalAngles(
                elbow_angle=90.0,
                knee_bend=120.0,
                wrist_angle=45.0,
                shoulder_alignment=5.0,
                release_angle=55.0,
                hip_angle=160.0
            )
    
    def calculate_angle_from_keypoints(
        self, 
        keypoints: List[Keypoint], 
        point1_name: str, 
        point2_name: str, 
        point3_name: str
    ) -> float:
        """
        Calculate angle formed by three keypoints (point2 is the vertex)
        
        Args:
            keypoints: List of detected keypoints
            point1_name: First point name
            point2_name: Vertex point name (angle measured here)
            point3_name: Third point name
            
        Returns:
            Angle in degrees (0-180)
        """
        try:
            p1 = self._get_keypoint(keypoints, point1_name)
            p2 = self._get_keypoint(keypoints, point2_name)
            p3 = self._get_keypoint(keypoints, point3_name)
            
            if not (p1 and p2 and p3):
                return 0.0
            
            # Calculate vectors
            v1 = (p1.x - p2.x, p1.y - p2.y)
            v2 = (p3.x - p2.x, p3.y - p2.y)
            
            # Calculate angle using dot product
            dot_product = v1[0] * v2[0] + v1[1] * v2[1]
            mag1 = math.sqrt(v1[0]**2 + v1[1]**2)
            mag2 = math.sqrt(v2[0]**2 + v2[1]**2)
            
            if mag1 == 0 or mag2 == 0:
                return 0.0
            
            cos_angle = dot_product / (mag1 * mag2)
            cos_angle = max(-1.0, min(1.0, cos_angle))  # Clamp to [-1, 1]
            
            angle_rad = math.acos(cos_angle)
            angle_deg = math.degrees(angle_rad)
            
            return angle_deg
            
        except Exception as e:
            logger.warning(f"Angle calculation failed for {point1_name}-{point2_name}-{point3_name}: {str(e)}")
            return 0.0
    
    def classify_form_quality(self, image_path: str) -> Dict[str, Any]:
        """
        Classify shooting form quality using RoboFlow classifier
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with quality assessment and confidence
        """
        try:
            # Prepare image data
            if os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
            else:
                image_data = image_path
            
            # Call RoboFlow classifier API
            url = f"{self.base_url}/{self.projects['quality']}/1"
            params = {"api_key": self.api_key}
            
            response = requests.post(
                url,
                params=params,
                data=image_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Form quality classification completed")
            
            return {
                "success": True,
                "quality": self._parse_quality(result),
                "confidence": result.get("confidence", 0.0),
                "raw_response": result
            }
            
        except Exception as e:
            logger.error(f"Form quality classification failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "quality": FormQuality.FAIR
            }
    
    def track_ball_trajectory(self, image_path: str) -> Dict[str, Any]:
        """
        Track basketball trajectory and position
        
        Args:
            image_path: Path to image file
            
        Returns:
            Dictionary with ball position and trajectory data
        """
        try:
            # Prepare image data
            if os.path.exists(image_path):
                with open(image_path, 'rb') as f:
                    image_data = base64.b64encode(f.read()).decode('utf-8')
            else:
                image_data = image_path
            
            # Call RoboFlow detection API
            url = f"{self.base_url}/{self.projects['trajectory']}/1"
            params = {"api_key": self.api_key}
            
            response = requests.post(
                url,
                params=params,
                data=image_data,
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=30
            )
            
            response.raise_for_status()
            result = response.json()
            
            logger.info(f"Ball trajectory tracking completed")
            
            return {
                "success": True,
                "ball_detected": len(result.get("predictions", [])) > 0,
                "ball_position": self._parse_ball_position(result),
                "raw_response": result
            }
            
        except Exception as e:
            logger.error(f"Ball trajectory tracking failed: {str(e)}")
            return {
                "success": False,
                "error": str(e),
                "ball_detected": False
            }
    
    def analyze_complete(self, image_path: str) -> Dict[str, Any]:
        """
        Perform complete analysis combining all RoboFlow capabilities
        
        This is the main function that orchestrates:
        1. Keypoint detection
        2. Shooting phase identification
        3. Angle calculation
        4. Form quality assessment
        5. Ball trajectory tracking
        
        Args:
            image_path: Path to image file or base64 encoded string
            
        Returns:
            Comprehensive analysis dictionary
        """
        logger.info(f"Starting complete RoboFlow analysis for image: {image_path[:50]}...")
        
        # Step 1: Detect keypoints
        keypoint_result = self.detect_keypoints(image_path)
        
        if not keypoint_result["success"]:
            return {
                "success": False,
                "error": "Keypoint detection failed",
                "details": keypoint_result
            }
        
        keypoints = keypoint_result["keypoints"]
        
        # Step 2: Identify shooting phase
        shooting_phase = self.identify_shooting_phase(keypoints)
        
        # Step 3: Calculate angles
        angles = self.calculate_angles(keypoints)
        
        # Step 4: Classify form quality
        quality_result = self.classify_form_quality(image_path)
        
        # Step 5: Track ball trajectory
        trajectory_result = self.track_ball_trajectory(image_path)
        
        # Compile complete analysis
        analysis = {
            "success": True,
            "timestamp": self._get_timestamp(),
            "keypoints": {
                "detected": len(keypoints),
                "data": [self._keypoint_to_dict(kp) for kp in keypoints],
                "confidence": self._avg_confidence(keypoints)
            },
            "shooting_phase": {
                "phase": shooting_phase.value,
                "description": self._get_phase_description(shooting_phase)
            },
            "biomechanical_angles": angles.to_dict(),
            "form_quality": {
                "assessment": quality_result.get("quality", FormQuality.FAIR).value if quality_result["success"] else "unknown",
                "confidence": quality_result.get("confidence", 0.0)
            },
            "ball_tracking": {
                "detected": trajectory_result.get("ball_detected", False),
                "position": trajectory_result.get("ball_position", {})
            },
            "raw_results": {
                "keypoints": keypoint_result.get("raw_response", {}),
                "quality": quality_result.get("raw_response", {}),
                "trajectory": trajectory_result.get("raw_response", {})
            }
        }
        
        logger.info(f"Complete analysis finished - Phase: {shooting_phase.value}, Angles: {angles.to_dict()}")
        
        return analysis
    
    # Helper methods
    
    def _parse_keypoints(self, result: Dict) -> List[Keypoint]:
        """Parse RoboFlow API response into Keypoint objects"""
        keypoints = []
        predictions = result.get("predictions", [])
        
        for pred in predictions:
            keypoint_id = pred.get("class_id", 0)
            keypoint_name = self.KEYPOINT_NAMES.get(keypoint_id, f"keypoint_{keypoint_id}")
            
            keypoints.append(Keypoint(
                id=keypoint_id,
                name=keypoint_name,
                x=pred.get("x", 0.0),
                y=pred.get("y", 0.0),
                confidence=pred.get("confidence", 0.0)
            ))
        
        return keypoints
    
    def _get_keypoint(self, keypoints: List[Keypoint], name: str) -> Optional[Keypoint]:
        """Get keypoint by name"""
        for kp in keypoints:
            if kp.name == name:
                return kp
        return None
    
    def _get_keypoint_y(self, keypoints: List[Keypoint], name: str) -> float:
        """Get Y coordinate of keypoint by name"""
        kp = self._get_keypoint(keypoints, name)
        return kp.y if kp else 0.0
    
    def _avg_confidence(self, keypoints: List[Keypoint]) -> float:
        """Calculate average confidence of keypoints"""
        if not keypoints:
            return 0.0
        return sum(kp.confidence for kp in keypoints) / len(keypoints)
    
    def _keypoint_to_dict(self, kp: Keypoint) -> Dict:
        """Convert Keypoint to dictionary"""
        return {
            "id": kp.id,
            "name": kp.name,
            "x": round(kp.x, 2),
            "y": round(kp.y, 2),
            "confidence": round(kp.confidence, 3)
        }
    
    def _calculate_wrist_extension(self, keypoints: List[Keypoint]) -> float:
        """Calculate wrist extension angle"""
        # Simplified calculation based on elbow-wrist vector
        elbow = self._get_keypoint(keypoints, "right_elbow")
        wrist = self._get_keypoint(keypoints, "right_wrist")
        
        if not (elbow and wrist):
            return 45.0  # Default
        
        # Calculate angle from horizontal
        dx = wrist.x - elbow.x
        dy = wrist.y - elbow.y
        angle = abs(math.degrees(math.atan2(dy, dx)))
        
        return angle
    
    def _calculate_shoulder_alignment(self, keypoints: List[Keypoint]) -> float:
        """Calculate shoulder alignment deviation from vertical"""
        left_shoulder = self._get_keypoint(keypoints, "left_shoulder")
        right_shoulder = self._get_keypoint(keypoints, "right_shoulder")
        
        if not (left_shoulder and right_shoulder):
            return 5.0  # Default
        
        # Calculate angle from horizontal
        dx = right_shoulder.x - left_shoulder.x
        dy = right_shoulder.y - left_shoulder.y
        angle = abs(math.degrees(math.atan2(dy, dx)))
        
        # Deviation from 0° (perfectly horizontal shoulders)
        return abs(angle)
    
    def _calculate_release_angle(self, keypoints: List[Keypoint]) -> float:
        """Calculate ball release trajectory angle"""
        wrist = self._get_keypoint(keypoints, "right_wrist")
        elbow = self._get_keypoint(keypoints, "right_elbow")
        
        if not (wrist and elbow):
            return 55.0  # Default optimal release angle
        
        # Calculate upward trajectory angle
        dx = wrist.x - elbow.x
        dy = elbow.y - wrist.y  # Inverted because y increases downward
        
        if dx == 0:
            return 90.0
        
        angle = math.degrees(math.atan2(dy, dx))
        return max(0, min(90, angle))
    
    def _parse_quality(self, result: Dict) -> FormQuality:
        """Parse form quality from classifier result"""
        # Map classifier output to FormQuality enum
        top_class = result.get("top", "fair").lower()
        
        quality_map = {
            "excellent": FormQuality.EXCELLENT,
            "good": FormQuality.GOOD,
            "fair": FormQuality.FAIR,
            "needs_improvement": FormQuality.NEEDS_IMPROVEMENT,
            "poor": FormQuality.NEEDS_IMPROVEMENT
        }
        
        return quality_map.get(top_class, FormQuality.FAIR)
    
    def _parse_ball_position(self, result: Dict) -> Dict[str, float]:
        """Parse ball position from trajectory result"""
        predictions = result.get("predictions", [])
        
        if not predictions:
            return {"x": 0.0, "y": 0.0, "confidence": 0.0}
        
        ball = predictions[0]
        return {
            "x": ball.get("x", 0.0),
            "y": ball.get("y", 0.0),
            "width": ball.get("width", 0.0),
            "height": ball.get("height", 0.0),
            "confidence": ball.get("confidence", 0.0)
        }
    
    def _get_phase_description(self, phase: ShootingPhase) -> str:
        """Get human-readable description of shooting phase"""
        descriptions = {
            ShootingPhase.PRE_SHOT: "Ready position with ball secured",
            ShootingPhase.DIP: "Ball lowering phase with knee bend",
            ShootingPhase.RISE: "Upward motion with leg extension",
            ShootingPhase.RELEASE: "Ball release point at peak height",
            ShootingPhase.FOLLOW_THROUGH: "Post-release follow-through motion"
        }
        return descriptions.get(phase, "Unknown phase")
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.utcnow().isoformat() + "Z"


# Example usage
if __name__ == "__main__":
    # Initialize analyzer
    api_key = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
    analyzer = RoboFlowAnalyzer(api_key=api_key)
    
    # Test with sample image
    print("RoboFlow Analyzer initialized successfully!")
    print(f"Projects configured: {analyzer.projects}")
    print(f"Keypoint model: {len(analyzer.KEYPOINT_NAMES)} keypoints")
