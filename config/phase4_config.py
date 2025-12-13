"""
Phase 4 Configuration File
Centralized configuration for basketball shooting form analysis pipeline
"""

import os
from typing import Dict, Tuple

# ============================================================================
# API CREDENTIALS
# ============================================================================

# RoboFlow Configuration
ROBOFLOW_API_KEY = os.getenv("ROBOFLOW_API_KEY", "rDWynPrytSysASUlyGvK")
ROBOFLOW_WORKSPACE = "tbf-inc"
ROBOFLOW_PROJECTS = {
    "keypoints": "basketball-shooting-form-keypoints",
    "quality": "basketball-form-quality-classifier",
    "trajectory": "basketball-ball-trajectory-tracker"
}

# ShotStack Configuration
SHOTSTACK_SANDBOX_API_KEY = "5I9pXTQbDLmcF6tvgjOzgYtDN5jyK2FnurBSU5oy"
SHOTSTACK_PRODUCTION_API_KEY = "HQNZcbuBHc1zVapRhzAdHQFqNkXzQG1YrqYhBhwZ"
SHOTSTACK_ENVIRONMENT = os.getenv("SHOTSTACK_ENV", "sandbox")  # or "production"

# Get active ShotStack key based on environment
SHOTSTACK_API_KEY = (
    SHOTSTACK_PRODUCTION_API_KEY if SHOTSTACK_ENVIRONMENT == "production" 
    else SHOTSTACK_SANDBOX_API_KEY
)

# Vision API Configuration
VISION_PRIMARY_PROVIDER = "anthropic"  # Anthropic Claude Vision (primary)
VISION_FALLBACK_PROVIDER = "openai"   # OpenAI GPT-4 Vision (fallback)
VISION_TIMEOUT = 30  # seconds

# Anthropic Claude API Key
ANTHROPIC_API_KEY = "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"

# Abacus AI Configuration (for OpenAI fallback)
ABACUS_API_KEY = os.getenv("ABACUS_API_KEY", "")  # Set via environment

# ============================================================================
# OPTIMAL BIOMECHANICAL ANGLE RANGES
# ============================================================================

# Based on professional shooter analysis and sports science research
OPTIMAL_ANGLE_RANGES: Dict[str, Tuple[float, float]] = {
    # Shooting arm elbow angle at release (degrees)
    # Optimal: 85-95° (fully extended but not locked)
    "elbow_angle": (85, 95),
    
    # Knee bend angle at dip phase (degrees)
    # Optimal: 110-130° (moderate knee flexion for power)
    "knee_bend": (110, 130),
    
    # Wrist snap angle at release (degrees)
    # Optimal: 45-90° (significant wrist extension for backspin)
    "wrist_angle": (45, 90),
    
    # Shoulder alignment deviation from horizontal (degrees)
    # Optimal: 0-10° (shoulders square to basket)
    "shoulder_alignment": (0, 10),
    
    # Ball release trajectory angle (degrees)
    # Optimal: 48-58° (45-60° arc for optimal trajectory)
    "release_angle": (48, 58),
    
    # Hip angle at release (degrees)
    # Optimal: 155-175° (nearly extended but not locked)
    "hip_angle": (155, 175)
}

# Tolerance levels for angle deviations
ANGLE_TOLERANCE_MINOR = 0.3  # 30% outside optimal = yellow (minor issue)
ANGLE_TOLERANCE_MAJOR = 0.5  # 50% outside optimal = red (major issue)

# ============================================================================
# COLOR CODING RULES
# ============================================================================

FORM_COLORS = {
    "excellent": "#00FF00",  # Green
    "good": "#7CFC00",       # Lawn green
    "fair": "#FFFF00",       # Yellow
    "needs_improvement": "#FF0000",  # Red
    "neutral": "#00BFFF",   # Blue
    "text": "#FFFFFF"        # White
}

# ============================================================================
# PROFESSIONAL SHOOTER DATABASE
# ============================================================================

PROFESSIONAL_SHOOTERS = [
    {
        "name": "Stephen Curry",
        "height": 75,  # 6'3"
        "wingspan": 76,
        "tier": "legendary",
        "optimal_angles": {
            "elbow": 90,
            "knee": 125,
            "release": 52,
            "shoulder": 3,
            "wrist": 60,
            "hip": 165
        },
        "career_3pt_pct": 42.6,
        "release_time": 0.4  # seconds
    },
    {
        "name": "Ray Allen",
        "height": 77,  # 6'5"
        "wingspan": 80,
        "tier": "legendary",
        "optimal_angles": {
            "elbow": 88,
            "knee": 120,
            "release": 55,
            "shoulder": 2,
            "wrist": 65,
            "hip": 167
        },
        "career_3pt_pct": 40.0,
        "release_time": 0.45
    },
    {
        "name": "Klay Thompson",
        "height": 78,  # 6'6"
        "wingspan": 81,
        "tier": "elite",
        "optimal_angles": {
            "elbow": 92,
            "knee": 128,
            "release": 50,
            "shoulder": 4,
            "wrist": 58,
            "hip": 170
        },
        "career_3pt_pct": 41.3,
        "release_time": 0.42
    },
    {
        "name": "Damian Lillard",
        "height": 74,  # 6'2"
        "wingspan": 76,
        "tier": "elite",
        "optimal_angles": {
            "elbow": 87,
            "knee": 122,
            "release": 58,
            "shoulder": 5,
            "wrist": 62,
            "hip": 163
        },
        "career_3pt_pct": 37.5,
        "release_time": 0.48
    },
    {
        "name": "Kyle Korver",
        "height": 79,  # 6'7"
        "wingspan": 82,
        "tier": "elite",
        "optimal_angles": {
            "elbow": 91,
            "knee": 130,
            "release": 48,
            "shoulder": 3,
            "wrist": 55,
            "hip": 172
        },
        "career_3pt_pct": 42.9,
        "release_time": 0.5
    },
    {
        "name": "Kyrie Irving",
        "height": 74,  # 6'2"
        "wingspan": 76,
        "tier": "elite",
        "optimal_angles": {
            "elbow": 89,
            "knee": 118,
            "release": 54,
            "shoulder": 6,
            "wrist": 63,
            "hip": 161
        },
        "career_3pt_pct": 39.3,
        "release_time": 0.43
    }
]

# ============================================================================
# SHOOTING PHASE DESCRIPTIONS
# ============================================================================

SHOOTING_PHASES = {
    "pre-shot": {
        "name": "Pre-Shot Setup",
        "description": "Ready position with ball secured, feet shoulder-width apart",
        "key_angles": ["knee_bend", "hip_angle"],
        "optimal_duration": 0.5  # seconds
    },
    "dip": {
        "name": "Dip Phase",
        "description": "Ball lowering phase with maximum knee bend for power generation",
        "key_angles": ["knee_bend", "elbow_angle", "hip_angle"],
        "optimal_duration": 0.2
    },
    "rise": {
        "name": "Rise Phase",
        "description": "Upward motion with leg extension and ball elevation",
        "key_angles": ["knee_bend", "elbow_angle", "shoulder_alignment"],
        "optimal_duration": 0.3
    },
    "release": {
        "name": "Release Point",
        "description": "Ball release at peak height with full arm extension",
        "key_angles": ["elbow_angle", "wrist_angle", "release_angle", "shoulder_alignment"],
        "optimal_duration": 0.1
    },
    "follow-through": {
        "name": "Follow Through",
        "description": "Post-release motion with wrist snap and arm extension",
        "key_angles": ["wrist_angle", "elbow_angle"],
        "optimal_duration": 0.3
    }
}

# ============================================================================
# FORM QUALITY THRESHOLDS
# ============================================================================

FORM_QUALITY_THRESHOLDS = {
    "excellent": {
        "min_score": 90,
        "angle_deviations_allowed": 1,  # Max 1 angle outside optimal
        "max_avg_deviation": 3  # Max 3° average deviation
    },
    "good": {
        "min_score": 75,
        "angle_deviations_allowed": 2,
        "max_avg_deviation": 7
    },
    "fair": {
        "min_score": 60,
        "angle_deviations_allowed": 3,
        "max_avg_deviation": 12
    },
    "needs_improvement": {
        "min_score": 0,
        "angle_deviations_allowed": 6,
        "max_avg_deviation": 999
    }
}

# ============================================================================
# VISUALIZATION SETTINGS
# ============================================================================

VISUALIZATION_CONFIG = {
    "skeleton_line_thickness": 4,  # pixels
    "keypoint_radius": 8,  # pixels
    "angle_arc_radius": 40,  # pixels
    "text_size_title": 48,  # pixels
    "text_size_body": 24,  # pixels
    "image_resolution": "hd",  # "sd", "hd", "1080"
    "output_quality": "high",  # "low", "medium", "high"
    "default_image_size": (1920, 1080),  # width, height
}

# ============================================================================
# FALLBACK CONFIGURATION
# ============================================================================

FALLBACK_CONFIG = {
    "vision_api_timeout": VISION_TIMEOUT,
    "max_retries": 3,
    "retry_delay": 2,  # seconds
    "fallback_on_timeout": True,
    "fallback_on_error": True,
    "log_fallback_events": True
}

# ============================================================================
# OUTPUT SETTINGS
# ============================================================================

OUTPUT_CONFIG = {
    "default_output_dir": "phase4_outputs",
    "save_roboflow_raw": True,
    "save_vision_raw": True,
    "save_annotated_images": True,
    "report_format": "json",  # "json" or "pdf"
    "include_metadata": True,
    "compress_output": False
}

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOGGING_CONFIG = {
    "log_level": "INFO",  # "DEBUG", "INFO", "WARNING", "ERROR"
    "log_file": "phase4_pipeline.log",
    "max_log_size": 10 * 1024 * 1024,  # 10 MB
    "backup_count": 5,
    "log_format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
}

# ============================================================================
# PERFORMANCE SETTINGS
# ============================================================================

PERFORMANCE_CONFIG = {
    "parallel_processing": False,  # Enable for batch analysis
    "max_workers": 4,  # For parallel processing
    "cache_roboflow_results": True,
    "cache_vision_results": False,  # Vision results are user-specific
    "max_image_size": 5 * 1024 * 1024,  # 5 MB
    "compress_images": True,
    "compression_quality": 85  # 0-100
}

# ============================================================================
# VALIDATION RULES
# ============================================================================

VALIDATION_RULES = {
    "min_keypoints_detected": 10,  # Minimum for valid analysis
    "min_keypoint_confidence": 0.3,  # Minimum confidence per keypoint
    "min_ball_detection_confidence": 0.5,
    "require_shooting_arm_keypoints": True,
    "require_leg_keypoints": True
}

# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_optimal_range(angle_name: str) -> Tuple[float, float]:
    """Get optimal range for an angle"""
    return OPTIMAL_ANGLE_RANGES.get(angle_name, (0, 180))

def get_professional_by_name(name: str) -> dict:
    """Get professional shooter data by name"""
    for shooter in PROFESSIONAL_SHOOTERS:
        if shooter["name"].lower() == name.lower():
            return shooter
    return None

def get_phase_description(phase: str) -> dict:
    """Get shooting phase description"""
    return SHOOTING_PHASES.get(phase, {})

def is_angle_optimal(angle_name: str, angle_value: float) -> bool:
    """Check if angle is within optimal range"""
    if angle_name not in OPTIMAL_ANGLE_RANGES:
        return True
    
    min_val, max_val = OPTIMAL_ANGLE_RANGES[angle_name]
    return min_val <= angle_value <= max_val

def get_angle_deviation(angle_name: str, angle_value: float) -> float:
    """Calculate deviation from optimal range"""
    if angle_name not in OPTIMAL_ANGLE_RANGES:
        return 0.0
    
    min_val, max_val = OPTIMAL_ANGLE_RANGES[angle_name]
    
    if angle_value < min_val:
        return min_val - angle_value
    elif angle_value > max_val:
        return angle_value - max_val
    else:
        return 0.0

def get_form_color(assessment: str) -> str:
    """Get color for form assessment"""
    return FORM_COLORS.get(assessment.lower().replace(" ", "_"), FORM_COLORS["neutral"])

# ============================================================================
# CONFIGURATION VALIDATION
# ============================================================================

def validate_configuration() -> bool:
    """Validate all configuration settings"""
    errors = []
    
    # Check API keys
    if not ROBOFLOW_API_KEY:
        errors.append("ROBOFLOW_API_KEY not set")
    
    if not SHOTSTACK_API_KEY:
        errors.append("SHOTSTACK_API_KEY not set")
    
    # Check optimal ranges
    for angle_name, (min_val, max_val) in OPTIMAL_ANGLE_RANGES.items():
        if min_val >= max_val:
            errors.append(f"Invalid range for {angle_name}: {min_val} >= {max_val}")
    
    # Check professional shooters
    if not PROFESSIONAL_SHOOTERS:
        errors.append("No professional shooters defined")
    
    if errors:
        print("Configuration validation failed:")
        for error in errors:
            print(f"  - {error}")
        return False
    
    print("✅ Configuration validation passed")
    return True

# Validate on import
if __name__ == "__main__":
    validate_configuration()
    
    print("\nPhase 4 Configuration Summary:")
    print("=" * 80)
    print(f"RoboFlow Workspace: {ROBOFLOW_WORKSPACE}")
    print(f"Vision Primary: {VISION_PRIMARY_PROVIDER}")
    print(f"Vision Fallback: {VISION_FALLBACK_PROVIDER}")
    print(f"ShotStack Environment: {SHOTSTACK_ENVIRONMENT}")
    print(f"Professional Shooters: {len(PROFESSIONAL_SHOOTERS)}")
    print(f"Optimal Angle Ranges: {len(OPTIMAL_ANGLE_RANGES)}")
    print(f"Shooting Phases: {len(SHOOTING_PHASES)}")
    print("=" * 80)
