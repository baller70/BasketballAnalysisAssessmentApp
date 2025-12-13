"""
Basketball Shooting Form Image Requirements Configuration

This module contains the CRITICAL image requirements specification
that MUST be followed for the app to work correctly.

All image filtering, selection, and validation should reference
these requirements.

Author: Basketball Analysis Team
Date: December 13, 2025
"""

# USER'S EXACT SPECIFICATION (MUST BE FOLLOWED WORD-FOR-WORD)
IMAGE_REQUIREMENTS_SPECIFICATION = """
an image featuring a single basketball player, captured from head to toe, 
focusing solely on their shooting form. The player should be the main object 
in the frame, with no other players or distractions, except in cases where 
other players are present in the scene; in such cases, center the focus on 
the designated player for analysis. If the image is a game photo, ensure it 
depicts only a single player actively engaged in shooting the basketball, 
not dribbling or performing layups. The composition must highlight the 
player's shooting posture, stance, and arm mechanics, suitable for detailed 
analysis of shooting technique. This must be remembered and followed for the 
app to work the right way.
"""

# DETAILED REQUIREMENTS BREAKDOWN
IMAGE_REQUIREMENTS = {
    "required_elements": {
        "single_player": "ONE basketball player must be the main subject",
        "head_to_toe": "Full body must be visible (from head to feet)",
        "shooting_focus": "Player actively engaged in shooting motion",
        "main_object": "Player must be the dominant visual element",
        "posture_visible": "Shooting posture, stance clearly observable",
        "arm_mechanics": "Elbow, wrist, shoulder positions visible"
    },
    
    "acceptable_scenarios": [
        "Solo player shooting (no background distractions)",
        "Game photo with ONE clear shooter as main subject",
        "Multiple people IF one is clearly the focus",
        "Practice shots, free throws, jump shots",
    ],
    
    "rejection_criteria": {
        "motion_violations": [
            "Dribbling motion (ball below waist, arm extended downward)",
            "Layup motion (running toward basket, underhand shot)",
            "Passing motion (two hands on ball, chest pass position)",
            "Defensive stance (arms out, low crouch)",
        ],
        "composition_violations": [
            "Multiple shooters simultaneously (unclear focus)",
            "Partial body shots (missing head, feet, or hands)",
            "Cropped images cutting off critical body parts",
            "Back view where form not visible",
        ],
        "quality_violations": [
            "Blurry images where details not observable",
            "Poor lighting where positions unclear",
            "Extreme distance where player too small",
            "Obstruction by other objects/players",
        ]
    },
    
    "technical_criteria": {
        "full_body_required": True,
        "min_visibility": 0.5,  # MediaPipe landmark visibility
        "shooting_elbow_angle_min": 90,  # Degrees (arm raised)
        "dribbling_elbow_angle_max": 80,  # Degrees (arm lowered)
        "min_box_area": 0.10,  # Normalized (subject size in frame)
        "center_tolerance": 0.3,  # How centered subject should be
    }
}

# FILTER CONFIGURATION
FILTER_CONFIG = {
    "model_complexity": 1,  # MediaPipe: 0=lite, 1=full, 2=heavy
    "min_detection_confidence": 0.5,
    "min_tracking_confidence": 0.5,
    "use_smart_filter": True,  # Use smart filter (allows background people)
}

# DATASET CLEANING CONFIGURATION
DATASET_CONFIG = {
    "training_data_dir": "/home/ubuntu/basketball_app/training_data",
    "quarantine_dir": "/home/ubuntu/basketball_app/training_data_quarantine",
    "report_dir": "/home/ubuntu/basketball_app/dataset_cleaning_reports",
    "backup_enabled": True,
    "dry_run_first": True,  # Always do dry run first
}

# EXPECTED RESULTS
EXPECTED_RESULTS = {
    "total_images": 19494,
    "expected_acceptance_rate": 0.075,  # 5-15%
    "target_accepted_images": (1000, 2500),  # Range
    "common_rejection_reasons": {
        "dribbling_motion": 0.45,  # 40-50%
        "partial_body": 0.25,      # 20-30%
        "multiple_shooters": 0.15, # 10-20%
        "no_people_detected": 0.08,# 5-10%
        "processing_error": 0.07,  # 5-10%
    }
}

# QUARANTINE CATEGORIES
QUARANTINE_CATEGORIES = {
    "no_people_detected": "No people detected in image",
    "partial_body": "Full body not visible (missing head or feet)",
    "dribbling_motion": "Dribbling motion detected",
    "not_shooting": "Not in shooting motion",
    "arm_position_unclear": "Arm position unclear",
    "processing_error": "Processing error",
    "failed_to_load": "Failed to load image"
}

# QUALITY METRICS FOR PERFECT TEST IMAGES
PERFECT_IMAGE_CRITERIA = {
    "min_score": 80,  # Out of 100
    "min_elbow_angle": 120,  # Clear shooting motion
    "min_box_area": 0.15,     # Subject large enough
    "max_center_offset": 0.3, # Reasonably centered
    "min_form_score": 60,     # Biomechanical assessment
}


def get_requirements_summary() -> str:
    """
    Get a human-readable summary of image requirements.
    
    Returns:
        Formatted string with requirements
    """
    summary = """
BASKETBALL SHOOTING FORM IMAGE REQUIREMENTS

User's Specification:
{spec}

Key Requirements:
1. ✅ Single basketball player (head to toe visible)
2. ✅ Shooting motion detected (arms raised, elbow angle > 90°)
3. ✅ Full body visible (head, shoulders, hips, feet)
4. ✅ NOT dribbling (ball above waist, arm not extended downward)
5. ✅ NOT layup (vertical alignment, not running)
6. ✅ Player is main object in frame (largest + centered)
7. ✅ Suitable for biomechanical analysis

Acceptable:
- Solo player (ideal)
- Game photos with ONE clear shooter as focus
- Background players OK if focus is clear

Rejected:
- Dribbling, layups, passing motions
- Partial body / cropped images
- Multiple shooters (unclear focus)
- Poor quality / blurry
""".format(spec=IMAGE_REQUIREMENTS_SPECIFICATION.strip())
    
    return summary


def validate_image_meets_requirements(analysis_result: dict) -> tuple[bool, list[str]]:
    """
    Validate if an image analysis result meets all requirements.
    
    Args:
        analysis_result: Dictionary with analysis results (from filter)
        
    Returns:
        (meets_requirements: bool, violations: list[str])
    """
    violations = []
    
    # Check if accepted by filter
    if not analysis_result.get("accepted", False):
        violations.append(f"Filter rejected: {analysis_result.get('reason', 'Unknown')}")
        return (False, violations)
    
    # Check if main subject exists
    main_subject = analysis_result.get("main_subject")
    if not main_subject:
        violations.append("No main subject identified")
        return (False, violations)
    
    # Check full body visible
    if not main_subject.get("has_full_body", False):
        violations.append("Full body not visible")
    
    # Check shooting motion
    if not main_subject.get("is_shooting", False):
        violations.append("Not in shooting motion")
    
    # Check elbow angle (if available)
    elbow_angle = main_subject.get("elbow_angle")
    if elbow_angle is not None:
        if elbow_angle < IMAGE_REQUIREMENTS["technical_criteria"]["shooting_elbow_angle_min"]:
            violations.append(f"Elbow angle too low: {elbow_angle:.1f}°")
    
    # Check box area (subject size)
    box_area = main_subject.get("box_area")
    if box_area is not None:
        if box_area < IMAGE_REQUIREMENTS["technical_criteria"]["min_box_area"]:
            violations.append(f"Subject too small: {box_area:.3f}")
    
    meets_requirements = len(violations) == 0
    return (meets_requirements, violations)


if __name__ == "__main__":
    print(get_requirements_summary())
