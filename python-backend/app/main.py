"""
Basketball Analysis API - FastAPI Backend
Provides pose detection and image annotation endpoints
"""
import io
import os
import base64
from typing import Optional
from dotenv import load_dotenv

import cv2
import numpy as np
import requests
import replicate
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .models import (
    AnalysisResponse,
    ExportResponse,
    HealthResponse,
    SkeletonConfig,
    Keypoint,
    ExportImageRequest,
)
from .pose_detection import detect_pose_from_image
from .skeleton_drawing import draw_skeleton

# Load environment variables from .env file
load_dotenv()

# Get Replicate API token from environment
REPLICATE_API_TOKEN = os.getenv("REPLICATE_API_TOKEN")
if not REPLICATE_API_TOKEN:
    raise ValueError("REPLICATE_API_TOKEN environment variable is required")
os.environ["REPLICATE_API_TOKEN"] = REPLICATE_API_TOKEN

# App version
VERSION = "1.0.0"

# Initialize FastAPI app
app = FastAPI(
    title="Basketball Analysis API",
    description="API for basketball shooting form analysis using MediaPipe pose detection",
    version=VERSION,
)

# Configure CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "https://*.vercel.app",  # For Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint"""
    try:
        import mediapipe
        mp_available = True
    except ImportError:
        mp_available = False
    
    # Check if Replicate API token is configured
    replicate_configured = bool(REPLICATE_API_TOKEN)
    
    return HealthResponse(
        status="healthy",
        version=VERSION,
        mediapipe_available=mp_available,
        replicate_configured=replicate_configured
    )


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_image(file: UploadFile = File(...)):
    """
    Analyze an uploaded image for pose detection
    
    Returns detected keypoints, confidence score, and shooting pose classification
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image data
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        # Run pose detection
        keypoints, confidence, is_shooting_pose = detect_pose_from_image(image)
        
        if not keypoints:
            return AnalysisResponse(
                success=False,
                keypoints=[],
                confidence=0.0,
                is_shooting_pose=False,
                message="No pose detected in image"
            )
        
        return AnalysisResponse(
            success=True,
            keypoints=keypoints,
            confidence=confidence,
            is_shooting_pose=is_shooting_pose,
            message=f"Detected {len(keypoints)} keypoints"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/export", response_model=ExportResponse)
async def export_annotated_image(
    file: UploadFile = File(...),
    skeleton_color: str = "#FFFFFF",
    joint_color: str = "#FFFFFF",
    label_color: str = "#FFFFFF",
    show_callouts: bool = True,
    output_format: str = "png",
    quality: int = 95,
):
    """
    Export an image with skeleton overlay annotation
    
    Runs pose detection and draws the skeleton overlay, returning base64-encoded image
    """
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read and decode image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            raise HTTPException(status_code=400, detail="Could not decode image")
        
        # Run pose detection
        keypoints, confidence, _ = detect_pose_from_image(image)
        
        if not keypoints:
            return ExportResponse(
                success=False,
                message="No pose detected in image"
            )
        
        # Create skeleton config
        config = SkeletonConfig(
            skeleton_color=skeleton_color,
            joint_color=joint_color,
            label_color=label_color,
            show_callouts=show_callouts,
        )
        
        # Draw skeleton overlay
        annotated = draw_skeleton(image, keypoints, config)
        
        # Encode to specified format
        if output_format.lower() == "jpeg":
            encode_params = [cv2.IMWRITE_JPEG_QUALITY, quality]
            _, buffer = cv2.imencode('.jpg', annotated, encode_params)
            content_type = "image/jpeg"
        else:
            _, buffer = cv2.imencode('.png', annotated)
            content_type = "image/png"
        
        # Convert to base64
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        
        return ExportResponse(
            success=True,
            image_base64=image_base64,
            content_type=content_type,
            message=f"Generated annotated image with {len(keypoints)} keypoints"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")


@app.post("/ai-skeleton")
async def ai_skeleton_overlay(file: UploadFile = File(...)):
    """
    Generate detailed anatomical skeleton overlay - medical illustration quality

    Creates X-ray style skeleton with individual bones, joints, and labeled callouts
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    try:
        import mediapipe as mp
        from app.anatomical_skeleton import generate_anatomical_skeleton

        # Read image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Could not decode image")

        # Detect pose with MediaPipe
        mp_pose = mp.solutions.pose
        with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose:
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = pose.process(image_rgb)

        if not results.pose_landmarks:
            raise HTTPException(status_code=400, detail="No person detected in image")

        # Generate detailed anatomical skeleton overlay
        result = generate_anatomical_skeleton(image, results.pose_landmarks.landmark)

        # Encode result
        _, buffer = cv2.imencode('.png', result)
        result_b64 = base64.b64encode(buffer).decode('utf-8')

        return {
            "success": True,
            "image_base64": result_b64,
            "content_type": "image/png",
            "message": "Detailed anatomical skeleton overlay generated successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Skeleton generation failed: {str(e)}")

