"""Configuration management for dual-tier basketball analysis system."""
import os
from pathlib import Path
from typing import Literal
from pydantic_settings import BaseSettings
from pydantic import Field


class RoboFlowConfig(BaseSettings):
    """RoboFlow API configuration."""
    private_api_key: str = Field(alias="ROBOFLOW_PRIVATE_API_KEY")
    publishable_api_key: str = Field(alias="ROBOFLOW_PUBLISHABLE_API_KEY")
    workspace: str = Field(alias="ROBOFLOW_WORKSPACE")
    
    # Model configurations
    keypoints_project: str = Field(alias="ROBOFLOW_KEYPOINTS_PROJECT")
    keypoints_version: int = Field(default=1, alias="ROBOFLOW_KEYPOINTS_VERSION")
    
    classifier_project: str = Field(alias="ROBOFLOW_CLASSIFIER_PROJECT")
    classifier_version: int = Field(default=1, alias="ROBOFLOW_CLASSIFIER_VERSION")
    
    tracker_project: str = Field(alias="ROBOFLOW_TRACKER_PROJECT")
    tracker_version: int = Field(default=1, alias="ROBOFLOW_TRACKER_VERSION")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


class MediaPipeConfig(BaseSettings):
    """MediaPipe configuration for free tier."""
    model_complexity: int = Field(default=2, alias="MEDIAPIPE_MODEL_COMPLEXITY")
    min_detection_confidence: float = Field(default=0.5, alias="MEDIAPIPE_MIN_DETECTION_CONFIDENCE")
    min_tracking_confidence: float = Field(default=0.5, alias="MEDIAPIPE_MIN_TRACKING_CONFIDENCE")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


class AnalysisConfig(BaseSettings):
    """General analysis configuration."""
    default_tier: Literal["free", "professional"] = Field(default="free", alias="DEFAULT_TIER")
    enable_caching: bool = Field(default=True, alias="ENABLE_CACHING")
    cache_expiry_hours: int = Field(default=24, alias="CACHE_EXPIRY_HOURS")
    
    output_dir: Path = Field(default=Path("./outputs"), alias="OUTPUT_DIR")
    save_annotated_images: bool = Field(default=True, alias="SAVE_ANNOTATED_IMAGES")
    save_analysis_json: bool = Field(default=True, alias="SAVE_ANALYSIS_JSON")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Keypoint definitions for RoboFlow professional tier
ROBOFLOW_KEYPOINTS = [
    "shooting_wrist",
    "shooting_elbow",
    "shooting_shoulder",
    "non_shooting_shoulder",
    "hip_center",
    "shooting_knee",
    "shooting_ankle",
    "ball_position",
    "release_point",
    "head_position"
]

# MediaPipe keypoint indices (subset used for basketball)
MEDIAPIPE_KEYPOINTS = {
    "nose": 0,
    "left_shoulder": 11,
    "right_shoulder": 12,
    "left_elbow": 13,
    "right_elbow": 14,
    "left_wrist": 15,
    "right_wrist": 16,
    "left_hip": 23,
    "right_hip": 24,
    "left_knee": 25,
    "right_knee": 26,
    "left_ankle": 27,
    "right_ankle": 28
}

# Biomechanical angles to measure
BIOMECHANICAL_ANGLES = [
    "elbow_angle",
    "shoulder_angle",
    "hip_angle",
    "knee_angle",
    "release_angle",
    "vertical_displacement"
]

# Form quality categories (18 categories for RoboFlow classifier)
FORM_QUALITY_CATEGORIES = [
    "elbow_alignment",
    "shoulder_position",
    "follow_through",
    "balance",
    "knee_bend",
    "foot_positioning",
    "wrist_snap",
    "release_point",
    "ball_trajectory",
    "body_alignment",
    "shooting_hand_position",
    "guide_hand_position",
    "head_position",
    "eye_focus",
    "timing",
    "fluidity",
    "power_generation",
    "overall_form"
]

# Skeleton connection definitions
SKELETON_CONNECTIONS = [
    # Torso
    ("head_position", "shooting_shoulder"),
    ("head_position", "non_shooting_shoulder"),
    ("shooting_shoulder", "non_shooting_shoulder"),
    ("shooting_shoulder", "hip_center"),
    ("non_shooting_shoulder", "hip_center"),
    
    # Shooting arm
    ("shooting_shoulder", "shooting_elbow"),
    ("shooting_elbow", "shooting_wrist"),
    ("shooting_wrist", "ball_position"),
    
    # Shooting leg
    ("hip_center", "shooting_knee"),
    ("shooting_knee", "shooting_ankle"),
]


def get_config():
    """Get all configuration objects."""
    return {
        "roboflow": RoboFlowConfig(),
        "mediapipe": MediaPipeConfig(),
        "analysis": AnalysisConfig()
    }