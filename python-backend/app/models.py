"""
Data models for the Basketball Analysis API
"""
from typing import List, Optional, Dict
from pydantic import BaseModel, Field


class Keypoint(BaseModel):
    """Represents a single pose keypoint"""
    x: float = Field(..., description="X coordinate (normalized 0-1)")
    y: float = Field(..., description="Y coordinate (normalized 0-1)")
    z: Optional[float] = Field(None, description="Z coordinate (depth, optional)")
    visibility: float = Field(..., description="Visibility score (0-1)")
    name: str = Field(..., description="Keypoint name (e.g., 'nose', 'left_shoulder')")


class SkeletonConfig(BaseModel):
    """Configuration for skeleton drawing"""
    line_thickness: int = Field(2, description="Thickness of skeleton lines")
    point_radius: int = Field(5, description="Radius of keypoint circles")
    line_color: tuple = Field((0, 255, 0), description="RGB color for skeleton lines")
    point_color: tuple = Field((255, 0, 0), description="RGB color for keypoints")
    draw_connections: bool = Field(True, description="Whether to draw connections between keypoints")


class AnalysisResponse(BaseModel):
    """Response from pose analysis endpoint"""
    success: bool = Field(..., description="Whether the analysis was successful")
    keypoints: List[Keypoint] = Field(..., description="Detected pose keypoints")
    confidence: float = Field(..., description="Overall confidence score (0-1)")
    image_width: int = Field(..., description="Width of analyzed image in pixels")
    image_height: int = Field(..., description="Height of analyzed image in pixels")
    message: Optional[str] = Field(None, description="Additional message or error details")


class ExportImageRequest(BaseModel):
    """Request body for exporting annotated image"""
    image_url: Optional[str] = Field(None, description="URL of the image to annotate")
    image_base64: Optional[str] = Field(None, description="Base64 encoded image data")
    keypoints: List[Keypoint] = Field(..., description="Keypoints to draw on the image")
    config: Optional[SkeletonConfig] = Field(None, description="Drawing configuration")


class ExportResponse(BaseModel):
    """Response from export endpoint"""
    success: bool = Field(..., description="Whether the export was successful")
    image_base64: str = Field(..., description="Base64 encoded annotated image")
    message: Optional[str] = Field(None, description="Additional message or error details")


class HealthResponse(BaseModel):
    """Response from health check endpoint"""
    status: str = Field(..., description="Health status (healthy/unhealthy)")
    version: str = Field(..., description="API version")
    mediapipe_available: bool = Field(..., description="Whether MediaPipe is available")
    replicate_configured: bool = Field(..., description="Whether Replicate API is configured")
