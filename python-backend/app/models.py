"""
Pydantic models for API request/response validation
"""
from typing import List, Optional, Literal
from pydantic import BaseModel, Field


class Keypoint(BaseModel):
    """Single pose keypoint"""
    name: str
    x: float = Field(ge=0, le=1, description="Normalized x coordinate (0-1)")
    y: float = Field(ge=0, le=1, description="Normalized y coordinate (0-1)")
    z: float = Field(default=0, description="Depth relative to hip midpoint")
    visibility: float = Field(ge=0, le=1, description="Visibility/confidence score")


class PoseDetectionResult(BaseModel):
    """Result of pose detection"""
    keypoints: List[Keypoint]
    confidence: float
    is_shooting_pose: bool


class SkeletonConfig(BaseModel):
    """Configuration for skeleton overlay drawing"""
    skeleton_color: str = Field(default="#FFFFFF", description="Hex color for skeleton lines")
    joint_color: str = Field(default="#FFFFFF", description="Hex color for joint circles")
    label_color: str = Field(default="#FFFFFF", description="Hex color for labels")
    line_thickness: int = Field(default=3, ge=1, le=10)
    joint_radius: int = Field(default=6, ge=2, le=15)
    show_callouts: bool = Field(default=True)
    callout_labels: List[str] = Field(
        default=["WRISTS", "ELBOWS", "SHOULDERS", "CORE/ABS", "HIPS", "KNEES", "ANKLES"]
    )


class AnalyzeRequest(BaseModel):
    """Request body for analyze endpoint with keypoints"""
    keypoints: Optional[List[Keypoint]] = None
    skeleton_config: Optional[SkeletonConfig] = None


class ExportImageRequest(BaseModel):
    """Request for exporting annotated image"""
    keypoints: List[Keypoint]
    skeleton_config: SkeletonConfig = Field(default_factory=SkeletonConfig)
    output_format: Literal["png", "jpeg"] = "png"
    quality: int = Field(default=95, ge=1, le=100)


class AnalysisResponse(BaseModel):
    """Response from pose analysis"""
    success: bool
    keypoints: List[Keypoint]
    confidence: float
    is_shooting_pose: bool
    message: Optional[str] = None


class ExportResponse(BaseModel):
    """Response from image export"""
    success: bool
    image_base64: Optional[str] = None
    content_type: str = "image/png"
    message: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    mediapipe_available: bool

