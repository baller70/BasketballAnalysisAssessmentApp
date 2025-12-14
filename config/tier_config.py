#!/usr/bin/env python3
"""
Tier Configuration
Defines settings and limits for FREE and PROFESSIONAL tiers
"""

from typing import Dict, Any


# FREE TIER Configuration
FREE_TIER_CONFIG = {
    "name": "FREE",
    "components": {
        "pose_detection": "MediaPipe",
        "vision_analysis": "OpenAI GPT-4 Vision",
        "visualization": "OpenCV"
    },
    "features": {
        "keypoints": 33,
        "biomechanical_angles": 10,
        "shooting_phases": True,
        "form_quality_assessment": True,
        "skeleton_overlay": True,
        "angle_annotations": True,
        "coaching_feedback": True,
        "professional_comparisons": False,
        "video_rendering": False
    },
    "limits": {
        "daily_analyses": 20,
        "images_per_analysis": 5,
        "max_image_size_mb": 10
    },
    "performance": {
        "accuracy": "85-90%",
        "processing_time": "2-3 seconds",
        "cost_per_image": 0.01
    },
    "output_formats": ["PNG", "JPEG", "JSON"]
}


# PROFESSIONAL TIER Configuration
PROFESSIONAL_TIER_CONFIG = {
    "name": "PROFESSIONAL",
    "components": {
        "pose_detection": "RoboFlow (custom trained)",
        "vision_analysis": "Anthropic Claude",
        "visualization": "ShotStack (video rendering)"
    },
    "features": {
        "keypoints": 18,  # Custom basketball-specific
        "biomechanical_angles": 15,
        "shooting_phases": True,
        "form_quality_assessment": True,
        "skeleton_overlay": True,
        "angle_annotations": True,
        "coaching_feedback": True,
        "professional_comparisons": True,
        "video_rendering": True,
        "slow_motion_analysis": True,
        "elite_shooter_matching": True
    },
    "limits": {
        "daily_analyses": "unlimited",
        "images_per_analysis": "unlimited",
        "max_image_size_mb": 50
    },
    "performance": {
        "accuracy": "95%+",
        "processing_time": "3-5 seconds",
        "cost_per_image": 0.75  # Average of $0.50-1.00
    },
    "output_formats": ["PNG", "JPEG", "MP4", "MOV", "JSON"]
}


# Tier Comparison Matrix
COMPARISON_MATRIX = {
    "feature": [
        "Pose Detection",
        "Keypoints",
        "Vision Analysis",
        "Visualization",
        "Accuracy",
        "Processing Speed",
        "Cost per Image",
        "Daily Limit",
        "Professional Comparisons",
        "Video Rendering",
        "Elite Shooter Matching"
    ],
    "free_tier": [
        "MediaPipe (open source)",
        "33 points",
        "OpenAI GPT-4 Vision",
        "OpenCV (static images)",
        "85-90%",
        "2-3 seconds",
        "$0.01",
        "20 analyses/day",
        "❌",
        "❌",
        "❌"
    ],
    "professional_tier": [
        "RoboFlow (custom trained)",
        "18 points (basketball-specific)",
        "Anthropic Claude",
        "ShotStack (video rendering)",
        "95%+",
        "3-5 seconds",
        "$0.50-1.00",
        "Unlimited",
        "✅",
        "✅",
        "✅"
    ]
}


def get_tier_config(tier: str) -> Dict[str, Any]:
    """
    Get configuration for specified tier
    
    Args:
        tier: "free" or "professional"
        
    Returns:
        Tier configuration dictionary
    """
    if tier.lower() == "free":
        return FREE_TIER_CONFIG
    elif tier.lower() in ["professional", "pro"]:
        return PROFESSIONAL_TIER_CONFIG
    else:
        raise ValueError(f"Unknown tier: {tier}")


def can_analyze(tier: str, daily_count: int) -> bool:
    """
    Check if user can perform analysis based on tier limits
    
    Args:
        tier: "free" or "professional"
        daily_count: Number of analyses already done today
        
    Returns:
        True if analysis is allowed
    """
    config = get_tier_config(tier)
    limit = config["limits"]["daily_analyses"]
    
    if limit == "unlimited":
        return True
    
    return daily_count < limit


def get_cost_estimate(tier: str, num_images: int) -> float:
    """
    Estimate cost for analysis
    
    Args:
        tier: "free" or "professional"
        num_images: Number of images to analyze
        
    Returns:
        Estimated cost in USD
    """
    config = get_tier_config(tier)
    cost_per_image = config["performance"]["cost_per_image"]
    
    return cost_per_image * num_images


if __name__ == "__main__":
    print("=" * 60)
    print("TIER CONFIGURATION")
    print("=" * 60)
    
    print("\nFREE TIER:")
    print(f"  Components: {FREE_TIER_CONFIG['components']}")
    print(f"  Accuracy: {FREE_TIER_CONFIG['performance']['accuracy']}")
    print(f"  Cost: ${FREE_TIER_CONFIG['performance']['cost_per_image']}/image")
    print(f"  Daily Limit: {FREE_TIER_CONFIG['limits']['daily_analyses']} analyses")
    
    print("\nPROFESSIONAL TIER:")
    print(f"  Components: {PROFESSIONAL_TIER_CONFIG['components']}")
    print(f"  Accuracy: {PROFESSIONAL_TIER_CONFIG['performance']['accuracy']}")
    print(f"  Cost: ${PROFESSIONAL_TIER_CONFIG['performance']['cost_per_image']}/image")
    print(f"  Daily Limit: {PROFESSIONAL_TIER_CONFIG['limits']['daily_analyses']}")
    
    print("\nCost Comparison (10 images):")
    print(f"  FREE: ${get_cost_estimate('free', 10):.2f}")
    print(f"  PROFESSIONAL: ${get_cost_estimate('professional', 10):.2f}")
