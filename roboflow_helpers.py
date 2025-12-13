#!/usr/bin/env python3
"""
RoboFlow Integration Helper Functions
Provides easy-to-use functions for calling the 3 basketball analysis models
"""

import os
import json
from typing import Dict, List, Optional, Union
from roboflow import Roboflow
import cv2
import numpy as np

# API Keys (can be overridden with environment variables)
PRIVATE_API_KEY = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
PUBLISHABLE_API_KEY = os.getenv("ROBOFLOW_PUBLISHABLE_KEY", "rf_qisv7ZQd27SzKITWRc2blZZo5F83")

# Workspace and Project IDs
WORKSPACE_ID = "tbf-inc"
PROJECT_IDS = {
    "keypoints": "basketball-shooting-form-keypoints",
    "classifier": "basketball-form-quality-classifier",
    "tracker": "basketball-ball-trajectory-tracker"
}


class RoboFlowBasketballAnalyzer:
    """
    Main class for basketball shooting analysis using RoboFlow models
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize the analyzer with RoboFlow API credentials
        
        Args:
            api_key: RoboFlow API key (defaults to PRIVATE_API_KEY)
        """
        self.api_key = api_key or PRIVATE_API_KEY
        self.rf = Roboflow(api_key=self.api_key)
        self.workspace = self.rf.workspace()
        self.models = {}
        
        # Project information
        self.project_info = {
            "keypoints": {
                "id": PROJECT_IDS["keypoints"],
                "type": "object-detection",
                "purpose": "Detect 10 keypoints for shooting form analysis",
                "classes": [
                    "shooting_wrist", "shooting_elbow", "shooting_shoulder",
                    "non_shooting_shoulder", "hip_center", "shooting_knee",
                    "shooting_ankle", "ball_position", "release_point", "head_position"
                ]
            },
            "classifier": {
                "id": PROJECT_IDS["classifier"],
                "type": "multi-label-classification",
                "purpose": "Classify shooting form quality across 5 categories",
                "categories": {
                    "Overall Form": ["Excellent", "Good", "Needs Work", "Poor"],
                    "Elbow Alignment": ["Correct", "Slightly Off", "Significantly Off"],
                    "Release Height": ["Optimal", "Too Low", "Too High"],
                    "Follow Through": ["Complete", "Incomplete", "None"],
                    "Balance": ["Stable", "Unstable"]
                }
            },
            "tracker": {
                "id": PROJECT_IDS["tracker"],
                "type": "object-detection",
                "purpose": "Track basketball trajectory and release point",
                "classes": ["basketball", "release_point", "basket"]
            }
        }
    
    def load_model(self, model_type: str, version: int = 1):
        """
        Load a specific model
        
        Args:
            model_type: Type of model ('keypoints', 'classifier', or 'tracker')
            version: Model version number (default: 1)
            
        Returns:
            Model object ready for inference
        """
        if model_type not in PROJECT_IDS:
            raise ValueError(f"Invalid model_type. Must be one of: {list(PROJECT_IDS.keys())}")
        
        try:
            project_id = PROJECT_IDS[model_type]
            project = self.workspace.project(project_id)
            model = project.version(version).model
            
            self.models[model_type] = model
            print(f"✅ Loaded {model_type} model (version {version})")
            
            return model
            
        except Exception as e:
            print(f"❌ Error loading {model_type} model: {e}")
            print(f"   Note: Model requires training data and a trained version")
            return None
    
    def detect_keypoints(self, image_path: str, confidence: int = 40, overlap: int = 30) -> Dict:
        """
        Detect shooting form keypoints in an image
        
        Args:
            image_path: Path to the image file
            confidence: Confidence threshold (0-100)
            overlap: Overlap threshold for NMS (0-100)
            
        Returns:
            Dictionary containing detected keypoints and their coordinates
        """
        if "keypoints" not in self.models:
            print("Loading keypoints model...")
            model = self.load_model("keypoints")
            if model is None:
                return {"error": "Keypoints model not trained yet"}
        else:
            model = self.models["keypoints"]
        
        try:
            # Run inference
            prediction = model.predict(image_path, confidence=confidence, overlap=overlap)
            
            # Parse results
            results = {
                "image": image_path,
                "keypoints": [],
                "raw_response": prediction.json()
            }
            
            # Extract keypoint detections
            for detection in prediction.json().get("predictions", []):
                keypoint_data = {
                    "class": detection.get("class"),
                    "confidence": detection.get("confidence"),
                    "x": detection.get("x"),
                    "y": detection.get("y"),
                    "width": detection.get("width"),
                    "height": detection.get("height")
                }
                results["keypoints"].append(keypoint_data)
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    def classify_form(self, image_path: str) -> Dict:
        """
        Classify shooting form quality across multiple categories
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing classification results for each category
        """
        if "classifier" not in self.models:
            print("Loading classifier model...")
            model = self.load_model("classifier")
            if model is None:
                return {"error": "Classifier model not trained yet"}
        else:
            model = self.models["classifier"]
        
        try:
            # Run inference
            prediction = model.predict(image_path)
            
            # Parse results
            results = {
                "image": image_path,
                "classifications": {},
                "raw_response": prediction.json()
            }
            
            # Extract classification predictions
            pred_data = prediction.json()
            if "predicted_classes" in pred_data:
                results["classifications"] = pred_data["predicted_classes"]
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    def track_basketball(self, image_path: str, confidence: int = 40, overlap: int = 30) -> Dict:
        """
        Detect basketball, release point, and basket in an image
        
        Args:
            image_path: Path to the image file
            confidence: Confidence threshold (0-100)
            overlap: Overlap threshold for NMS (0-100)
            
        Returns:
            Dictionary containing detected objects and their locations
        """
        if "tracker" not in self.models:
            print("Loading tracker model...")
            model = self.load_model("tracker")
            if model is None:
                return {"error": "Tracker model not trained yet"}
        else:
            model = self.models["tracker"]
        
        try:
            # Run inference
            prediction = model.predict(image_path, confidence=confidence, overlap=overlap)
            
            # Parse results
            results = {
                "image": image_path,
                "detections": {
                    "basketball": [],
                    "release_point": [],
                    "basket": []
                },
                "raw_response": prediction.json()
            }
            
            # Extract object detections
            for detection in prediction.json().get("predictions", []):
                obj_class = detection.get("class")
                obj_data = {
                    "confidence": detection.get("confidence"),
                    "x": detection.get("x"),
                    "y": detection.get("y"),
                    "width": detection.get("width"),
                    "height": detection.get("height")
                }
                
                if obj_class in results["detections"]:
                    results["detections"][obj_class].append(obj_data)
            
            return results
            
        except Exception as e:
            return {"error": str(e)}
    
    def analyze_shooting_form(self, image_path: str) -> Dict:
        """
        Comprehensive shooting form analysis using all three models
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary containing results from all three models
        """
        print(f"🏀 Analyzing shooting form: {image_path}")
        
        results = {
            "image": image_path,
            "keypoints": None,
            "form_quality": None,
            "ball_tracking": None
        }
        
        # Run keypoint detection
        print("   1. Detecting keypoints...")
        results["keypoints"] = self.detect_keypoints(image_path)
        
        # Run form classification
        print("   2. Classifying form quality...")
        results["form_quality"] = self.classify_form(image_path)
        
        # Run ball tracking
        print("   3. Tracking basketball trajectory...")
        results["ball_tracking"] = self.track_basketball(image_path)
        
        print("✅ Analysis complete!")
        
        return results
    
    def get_project_info(self) -> Dict:
        """Get information about all configured projects"""
        return self.project_info
    
    def visualize_keypoints(self, image_path: str, keypoints_result: Dict, output_path: Optional[str] = None):
        """
        Visualize detected keypoints on the image
        
        Args:
            image_path: Path to the original image
            keypoints_result: Result from detect_keypoints()
            output_path: Path to save annotated image (optional)
        """
        # Load image
        img = cv2.imread(image_path)
        if img is None:
            print(f"❌ Could not load image: {image_path}")
            return
        
        # Define colors for different keypoint types
        colors = {
            "shooting_wrist": (0, 255, 0),      # Green
            "shooting_elbow": (0, 255, 255),    # Yellow
            "shooting_shoulder": (0, 165, 255), # Orange
            "non_shooting_shoulder": (255, 165, 0), # Blue-orange
            "hip_center": (255, 0, 0),          # Blue
            "shooting_knee": (255, 0, 255),     # Magenta
            "shooting_ankle": (128, 0, 128),    # Purple
            "ball_position": (0, 0, 255),       # Red
            "release_point": (255, 255, 0),     # Cyan
            "head_position": (255, 255, 255)    # White
        }
        
        # Draw keypoints
        for kp in keypoints_result.get("keypoints", []):
            x, y = int(kp["x"]), int(kp["y"])
            kp_class = kp["class"]
            color = colors.get(kp_class, (200, 200, 200))
            
            # Draw circle for keypoint
            cv2.circle(img, (x, y), 8, color, -1)
            
            # Add label
            label = f"{kp_class}: {kp['confidence']:.2f}"
            cv2.putText(img, label, (x + 10, y - 10), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        # Save or display
        if output_path:
            cv2.imwrite(output_path, img)
            print(f"✅ Saved annotated image to: {output_path}")
        
        return img


def demo_usage():
    """Demonstration of how to use the RoboFlow helpers"""
    
    print("=" * 80)
    print("ROBOFLOW BASKETBALL ANALYZER - DEMO")
    print("=" * 80)
    
    # Initialize analyzer
    analyzer = RoboFlowBasketballAnalyzer()
    
    # Show project information
    print("\n📋 Available Projects:")
    for model_type, info in analyzer.get_project_info().items():
        print(f"\n{model_type.upper()}:")
        print(f"   ID: {info['id']}")
        print(f"   Type: {info['type']}")
        print(f"   Purpose: {info['purpose']}")
    
    # Example usage (commented out since no trained models yet)
    print("\n\n📝 Example Usage:")
    print("""
# Analyze a shooting form image
analyzer = RoboFlowBasketballAnalyzer()

# Option 1: Use individual models
keypoints = analyzer.detect_keypoints("basketball_shot.jpg")
form_quality = analyzer.classify_form("basketball_shot.jpg")
ball_tracking = analyzer.track_basketball("basketball_shot.jpg")

# Option 2: Comprehensive analysis
results = analyzer.analyze_shooting_form("basketball_shot.jpg")

# Option 3: Visualize keypoints
analyzer.visualize_keypoints("basketball_shot.jpg", keypoints, "annotated.jpg")
    """)
    
    print("\n\n⚠️  NOTE: Models require training data before inference")
    print("   1. Upload annotated images to each project")
    print("   2. Train models on RoboFlow platform")
    print("   3. Then use these helper functions for inference")


if __name__ == "__main__":
    demo_usage()
