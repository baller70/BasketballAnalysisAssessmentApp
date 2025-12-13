
# RoboFlow Basketball Form Classifier Setup Instructions

## Project Configuration

**Workspace:** tbf-inc
**Project ID:** basketball-form-quality-classifier
**Project Type:** Multi-Label Classification
**Version:** 2.0

## Step 1: Access the Project

1. Go to: https://app.roboflow.com/tbf-inc/basketball-form-quality-classifier
2. Log in with your RoboFlow account
3. Navigate to "Settings" → "Project Settings"

## Step 2: Update Project Description

Update the project description to:

```
Comprehensive multi-label classifier for basketball shooting form analysis. Analyzes 18 distinct aspects of shooting mechanics including hand positioning, body mechanics, release phases, and shot types. Designed for production-grade biomechanical analysis with detailed labels for coaching feedback.
```

## Step 3: Configure Categories (Classes)

This classifier uses 18 comprehensive categories for multi-label classification.

**IMPORTANT:** In RoboFlow multi-label classification, each "class" is actually a label.
You'll need to create labels using this naming convention: `category_name__label_name`

### All Categories and Labels:


### Shooting Hand Mechanics
Analysis of shooting hand wrist, finger, and palm positioning during shot execution

- `shooting_hand_mechanics__optimal_wrist_snap`
  - Display: Optimal Wrist Snap (90°+)
  - Description: Full wrist flexion with 90+ degree snap, creates ideal backspin
  - Range: 90-110 degrees
  - Severity: excellent

- `shooting_hand_mechanics__good_wrist_action`
  - Display: Good Wrist Action (70-89°)
  - Description: Strong wrist snap with 70-89 degree flexion, adequate backspin
  - Range: 70-89 degrees
  - Severity: good

- `shooting_hand_mechanics__moderate_wrist_action`
  - Display: Moderate Wrist Action (50-69°)
  - Description: Moderate wrist flexion, some backspin but inconsistent
  - Range: 50-69 degrees
  - Severity: moderate

- `shooting_hand_mechanics__limited_wrist_snap`
  - Display: Limited Wrist Snap (30-49°)
  - Description: Minimal wrist flexion, insufficient backspin generation
  - Range: 30-49 degrees
  - Severity: needs_improvement

- `shooting_hand_mechanics__stiff_wrist`
  - Display: Stiff Wrist (<30°)
  - Description: Very limited or no wrist flexion, poor shot control
  - Range: 0-29 degrees
  - Severity: poor


### Guide Hand Placement
Non-shooting hand positioning and influence on ball trajectory

- `guide_hand_placement__perfect_side_placement`
  - Display: Perfect Side Placement
  - Description: Guide hand on side of ball, no interference with release
  - Range: 85-95 degrees to shooting hand
  - Severity: excellent

- `guide_hand_placement__good_side_support`
  - Display: Good Side Support
  - Description: Slight angle but mostly on side, minimal influence
  - Range: 75-84 or 96-105 degrees
  - Severity: good

- `guide_hand_placement__slight_thumb_interference`
  - Display: Slight Thumb Interference
  - Description: Guide hand thumb slightly affects trajectory
  - Range: 65-74 or 106-115 degrees
  - Severity: moderate

- `guide_hand_placement__moderate_interference`
  - Display: Moderate Guide Hand Push
  - Description: Guide hand noticeably affects shot direction
  - Range: 45-64 or 116-135 degrees
  - Severity: needs_improvement

- `guide_hand_placement__severe_two_hand_push`
  - Display: Severe Two-Hand Push
  - Description: Both hands pushing ball, major trajectory issues
  - Range: <45 or >135 degrees
  - Severity: poor


### Elbow Alignment
Shooting arm elbow positioning relative to shoulder and target

- `elbow_alignment__perfect_inline`
  - Display: Perfect Inline (±5°)
  - Description: Elbow directly under ball, perfectly aligned with target
  - Range: 0-5 degrees deviation
  - Severity: excellent

- `elbow_alignment__excellent_alignment`
  - Display: Excellent Alignment (±6-10°)
  - Description: Elbow nearly inline, minimal lateral deviation
  - Range: 6-10 degrees deviation
  - Severity: good

- `elbow_alignment__good_with_minor_wing`
  - Display: Good with Minor Wing (±11-15°)
  - Description: Slight elbow wing, still functional mechanics
  - Range: 11-15 degrees deviation
  - Severity: moderate

- `elbow_alignment__moderate_elbow_wing`
  - Display: Moderate Elbow Wing (±16-25°)
  - Description: Noticeable lateral elbow deviation, affects accuracy
  - Range: 16-25 degrees deviation
  - Severity: needs_improvement

- `elbow_alignment__severe_chicken_wing`
  - Display: Severe Chicken Wing (>25°)
  - Description: Extreme elbow deviation, major mechanical flaw
  - Range: >25 degrees deviation
  - Severity: poor


### Shoulder Position & Rotation
Shoulder alignment, level, and rotation during shot execution

- `shoulder_position__level_squared_shoulders`
  - Display: Level & Squared (±3°)
  - Description: Shoulders level and square to target throughout
  - Range: 0-3 degrees tilt/rotation
  - Severity: excellent

- `shoulder_position__slight_natural_turn`
  - Display: Slight Natural Turn (±4-8°)
  - Description: Minor natural shoulder turn, still balanced
  - Range: 4-8 degrees rotation
  - Severity: good

- `shoulder_position__moderate_shoulder_drop`
  - Display: Moderate Shoulder Drop (±9-15°)
  - Description: Noticeable shoulder tilt, affects release consistency
  - Range: 9-15 degrees tilt
  - Severity: moderate

- `shoulder_position__significant_rotation`
  - Display: Significant Rotation (±16-25°)
  - Description: Excessive shoulder rotation or tilt, major issue
  - Range: 16-25 degrees
  - Severity: needs_improvement

- `shoulder_position__extreme_misalignment`
  - Display: Extreme Misalignment (>25°)
  - Description: Severe shoulder imbalance, compensatory mechanics
  - Range: >25 degrees
  - Severity: poor


### Finger Placement & Release
Finger positioning on ball and release mechanics for backspin generation

- `finger_release__perfect_fingertip_release`
  - Display: Perfect Fingertip Release
  - Description: Ball released from fingertips, index/middle finger last touch
  - Range: Release from distal phalanges
  - Severity: excellent

- `finger_release__good_finger_control`
  - Display: Good Finger Control
  - Description: Strong fingertip control with consistent backspin
  - Range: Minimal palm contact
  - Severity: good

- `finger_release__moderate_palm_contact`
  - Display: Moderate Palm Contact
  - Description: Some palm involvement, reduces feel and control
  - Range: Proximal phalanges involved
  - Severity: moderate

- `finger_release__excessive_palm_grip`
  - Display: Excessive Palm Grip
  - Description: Too much ball in palm, limited finger control
  - Range: Metacarpal contact
  - Severity: needs_improvement

- `finger_release__palm_shot`
  - Display: Palm Shot
  - Description: Shot pushed from palm, minimal backspin
  - Range: Full palm contact
  - Severity: poor


### Follow-Through Extension
Arm and wrist extension after ball release, gooseneck formation

- `follow_through__full_gooseneck_hold`
  - Display: Full Gooseneck Hold (2+ sec)
  - Description: Complete arm extension with held gooseneck position
  - Range: Full elbow extension, 2+ seconds
  - Severity: excellent

- `follow_through__complete_extension`
  - Display: Complete Extension (1-2 sec)
  - Description: Full arm extension with brief hold
  - Range: Full extension, 1-2 seconds
  - Severity: good

- `follow_through__moderate_followthrough`
  - Display: Moderate Follow-Through (0.5-1 sec)
  - Description: Adequate extension but quick return
  - Range: 80-95% extension
  - Severity: moderate

- `follow_through__shortened_followthrough`
  - Display: Shortened Follow-Through (<0.5 sec)
  - Description: Abbreviated extension, affects consistency
  - Range: 60-79% extension
  - Severity: needs_improvement

- `follow_through__no_followthrough`
  - Display: No Follow-Through
  - Description: Immediate arm retraction, poor shot control
  - Range: <60% extension
  - Severity: poor


### Lower Body: Knee Bend
Knee flexion depth and power generation from legs

- `lower_body_knee_bend__optimal_athletic_bend`
  - Display: Optimal Athletic Bend (90-110°)
  - Description: Ideal knee flexion for power and balance
  - Range: 90-110 degrees flexion
  - Severity: excellent

- `lower_body_knee_bend__good_bend_range`
  - Display: Good Bend Range (75-89° or 111-125°)
  - Description: Adequate knee flexion for power generation
  - Range: 75-89 or 111-125 degrees
  - Severity: good

- `lower_body_knee_bend__moderate_bend`
  - Display: Moderate Bend (60-74° or 126-140°)
  - Description: Less optimal knee bend, reduces power
  - Range: 60-74 or 126-140 degrees
  - Severity: moderate

- `lower_body_knee_bend__shallow_bend`
  - Display: Shallow Bend (140-160°)
  - Description: Minimal knee flexion, mostly arm shooting
  - Range: 140-160 degrees
  - Severity: needs_improvement

- `lower_body_knee_bend__no_leg_involvement`
  - Display: No Leg Involvement (>160°)
  - Description: Straight legs, all arm power, inconsistent range
  - Range: >160 degrees
  - Severity: poor


### Hip Rotation & Core Engagement
Hip and torso rotation, core stability during shot

- `hip_rotation__stable_minimal_rotation`
  - Display: Stable, Minimal Rotation (±5°)
  - Description: Hips stable and square to target throughout
  - Range: 0-5 degrees rotation
  - Severity: excellent

- `hip_rotation__controlled_slight_turn`
  - Display: Controlled Slight Turn (±6-10°)
  - Description: Minor natural hip turn, maintains balance
  - Range: 6-10 degrees rotation
  - Severity: good

- `hip_rotation__moderate_rotation`
  - Display: Moderate Rotation (±11-20°)
  - Description: Noticeable hip rotation, affects shot direction
  - Range: 11-20 degrees rotation
  - Severity: moderate

- `hip_rotation__excessive_turn`
  - Display: Excessive Turn (±21-35°)
  - Description: Significant hip rotation, major alignment issue
  - Range: 21-35 degrees rotation
  - Severity: needs_improvement

- `hip_rotation__severe_misalignment`
  - Display: Severe Misalignment (>35°)
  - Description: Extreme hip rotation or instability
  - Range: >35 degrees rotation
  - Severity: poor


### Foot Placement & Base Width
Foot positioning, stance width, and base stability

- `foot_placement__optimal_shoulder_width`
  - Display: Optimal Shoulder Width
  - Description: Feet shoulder-width apart, balanced stance
  - Range: 45-55 cm separation
  - Severity: excellent

- `foot_placement__slightly_wide_narrow`
  - Display: Slightly Wide/Narrow
  - Description: Minor deviation from optimal width, still stable
  - Range: 40-44 or 56-65 cm
  - Severity: good

- `foot_placement__moderately_wide_narrow`
  - Display: Moderately Wide/Narrow
  - Description: Noticeable stance width issue, affects balance
  - Range: 30-39 or 66-80 cm
  - Severity: moderate

- `foot_placement__very_wide_narrow`
  - Display: Very Wide/Narrow Stance
  - Description: Extreme stance width, major balance concerns
  - Range: 20-29 or 81-100 cm
  - Severity: needs_improvement

- `foot_placement__unstable_base`
  - Display: Unstable Base
  - Description: Feet together or extremely wide, no foundation
  - Range: <20 or >100 cm
  - Severity: poor


### Balance & Weight Distribution
Overall body balance and weight transfer during shot

- `balance_stability__perfect_balance`
  - Display: Perfect Balance & Control
  - Description: Centered weight, lands in same spot, no drift
  - Range: COG within 2cm of start
  - Severity: excellent

- `balance_stability__well_balanced`
  - Display: Well Balanced
  - Description: Minimal movement, good body control
  - Range: COG within 2-5cm
  - Severity: good

- `balance_stability__slight_imbalance`
  - Display: Slight Imbalance
  - Description: Minor weight shift or drift during shot
  - Range: COG moves 5-10cm
  - Severity: moderate

- `balance_stability__moderate_instability`
  - Display: Moderate Instability
  - Description: Noticeable drift or weight transfer issue
  - Range: COG moves 10-20cm
  - Severity: needs_improvement

- `balance_stability__poor_balance`
  - Display: Poor Balance/Falling Away
  - Description: Significant drift, fading, or loss of control
  - Range: COG moves >20cm
  - Severity: poor


### Ball Position & Grip
Ball starting position and hand grip configuration

- `ball_positioning__optimal_forehead_pocket`
  - Display: Optimal Forehead Pocket
  - Description: Ball starts at forehead level, ideal shooting pocket
  - Range: Eye to hairline level
  - Severity: excellent

- `ball_positioning__high_shoulder_start`
  - Display: High Shoulder Start
  - Description: Ball starts above shoulder, slightly high release
  - Range: Shoulder to eye level
  - Severity: good

- `ball_positioning__chest_level_start`
  - Display: Chest Level Start
  - Description: Ball starts at chest, requires more lift
  - Range: Mid-chest to shoulder
  - Severity: moderate

- `ball_positioning__low_waist_start`
  - Display: Low Waist Start
  - Description: Ball dips to waist, extra motion increases variance
  - Range: Waist to chest level
  - Severity: needs_improvement

- `ball_positioning__extreme_low_high`
  - Display: Extreme Low/High Start
  - Description: Ball starts below waist or above head, inefficient
  - Range: Below waist or above head
  - Severity: poor


### Release Point & Arc
Ball release height and trajectory arc angle

- `release_point_arc__optimal_high_arc`
  - Display: Optimal High Arc (48-52°)
  - Description: Perfect release angle, ideal basket entry
  - Range: 48-52 degrees
  - Severity: excellent

- `release_point_arc__good_arc_range`
  - Display: Good Arc Range (45-47° or 53-55°)
  - Description: Effective arc angle, good make percentage
  - Range: 45-47 or 53-55 degrees
  - Severity: good

- `release_point_arc__moderate_arc`
  - Display: Moderate Arc (40-44° or 56-60°)
  - Description: Acceptable but less optimal arc
  - Range: 40-44 or 56-60 degrees
  - Severity: moderate

- `release_point_arc__flat_high_trajectory`
  - Display: Flat/High Trajectory (35-39° or 61-70°)
  - Description: Suboptimal arc reduces target size
  - Range: 35-39 or 61-70 degrees
  - Severity: needs_improvement

- `release_point_arc__line_drive_rainbow`
  - Display: Line Drive/Rainbow (<35° or >70°)
  - Description: Extreme arc angle, very low success rate
  - Range: <35 or >70 degrees
  - Severity: poor


### Shooting Phase Detection
Current phase of shot execution for phase-specific analysis

- `shooting_phase__pre_shot_stance`
  - Display: Pre-Shot Stance
  - Description: Ready position before shot initiation
  - Range: Static ready position
  - Severity: neutral

- `shooting_phase__dip_loading`
  - Display: Dip/Loading Phase
  - Description: Downward ball movement and knee bend
  - Range: Ball moving down
  - Severity: neutral

- `shooting_phase__rise_elevation`
  - Display: Rise/Elevation Phase
  - Description: Upward movement toward release
  - Range: Ball moving up, pre-release
  - Severity: neutral

- `shooting_phase__release_point`
  - Display: Release Point
  - Description: Ball leaving shooting hand
  - Range: Ball separation moment
  - Severity: neutral

- `shooting_phase__follow_through_phase`
  - Display: Follow-Through Phase
  - Description: Post-release arm extension
  - Range: After ball release
  - Severity: neutral

- `shooting_phase__recovery_landing`
  - Display: Recovery/Landing
  - Description: Return to ready position
  - Range: Post-shot landing
  - Severity: neutral


### Shot Type Classification
Classification of shooting motion type and context

- `shot_type__jump_shot`
  - Display: Jump Shot
  - Description: Standard jump shot with vertical leap
  - Range: Vertical jump with release
  - Severity: neutral

- `shot_type__set_shot`
  - Display: Set Shot
  - Description: Shot from standing position, no jump
  - Range: Feet remain on ground
  - Severity: neutral

- `shot_type__free_throw`
  - Display: Free Throw
  - Description: Uncontested shot from free throw line
  - Range: Static free throw motion
  - Severity: neutral

- `shot_type__catch_and_shoot`
  - Display: Catch-and-Shoot
  - Description: Shot immediately after receiving pass
  - Range: Minimal preparation time
  - Severity: neutral

- `shot_type__off_dribble`
  - Display: Off-the-Dribble
  - Description: Shot following dribble moves
  - Range: Post-dribble transition
  - Severity: neutral

- `shot_type__fadeaway`
  - Display: Fadeaway/Contest
  - Description: Shot with backward lean or under pressure
  - Range: Backward momentum
  - Severity: neutral


### Body Type Considerations
Adjustments and considerations for different physical profiles

- `body_type_adjustment__tall_shooter`
  - Display: Tall Shooter (>6'6")
  - Description: High release point, longer lever arms
  - Range: >198cm height
  - Severity: neutral

- `body_type_adjustment__average_height`
  - Display: Average Height (6'0"-6'6")
  - Description: Standard proportions and mechanics
  - Range: 183-198cm height
  - Severity: neutral

- `body_type_adjustment__shorter_shooter`
  - Display: Shorter Shooter (<6'0")
  - Description: Quicker release, higher arc needed
  - Range: <183cm height
  - Severity: neutral

- `body_type_adjustment__long_wingspan`
  - Display: Long Wingspan (+6" vs height)
  - Description: Extended reach affects shooting pocket
  - Range: Wingspan > height + 15cm
  - Severity: neutral

- `body_type_adjustment__short_wingspan`
  - Display: Short Wingspan (<height)
  - Description: Compensatory adjustments needed
  - Range: Wingspan < height
  - Severity: neutral

- `body_type_adjustment__athletic_style`
  - Display: Athletic/Quick Release Style
  - Description: Fast, athletic shooting motion
  - Range: Quick motion style
  - Severity: neutral

- `body_type_adjustment__fundamental_style`
  - Display: Fundamental/Set Style
  - Description: Traditional, methodical shooting form
  - Range: Deliberate motion style
  - Severity: neutral


### Common Form Errors
Detection of frequent shooting mistakes and compensations

- `common_errors__no_errors_detected`
  - Display: No Major Errors Detected
  - Description: Clean shooting form without common flaws
  - Range: N/A
  - Severity: excellent

- `common_errors__thumb_flick`
  - Display: Thumb Flick
  - Description: Thumb on shooting hand affects ball trajectory
  - Range: Thumb involvement in release
  - Severity: needs_improvement

- `common_errors__guide_hand_push`
  - Display: Guide Hand Push
  - Description: Non-shooting hand influences shot direction
  - Range: Bilateral force application
  - Severity: needs_improvement

- `common_errors__dip_inconsistency`
  - Display: Dip Inconsistency
  - Description: Variable ball dip depth, timing issues
  - Range: Inconsistent loading phase
  - Severity: moderate

- `common_errors__fading_away`
  - Display: Fading Away/Drifting
  - Description: Unnecessary backward or lateral movement
  - Range: Excessive COG displacement
  - Severity: needs_improvement

- `common_errors__low_release`
  - Display: Low Release Point
  - Description: Ball released below optimal height
  - Range: Below eye level release
  - Severity: needs_improvement

- `common_errors__early_release`
  - Display: Early Release/Shot Put
  - Description: Releasing before reaching apex of jump
  - Range: Pre-apex release
  - Severity: poor


### Correction Priority Level
Urgency of mechanical corrections needed

- `correction_priority__elite_maintain`
  - Display: Elite - Maintain Form
  - Description: Excellent mechanics, focus on consistency
  - Range: 90-100% overall score
  - Severity: excellent

- `correction_priority__advanced_minor_tweaks`
  - Display: Advanced - Minor Tweaks
  - Description: Strong foundation, small adjustments
  - Range: 80-89% overall score
  - Severity: good

- `correction_priority__intermediate_focused_work`
  - Display: Intermediate - Focused Work
  - Description: Solid base, specific areas need attention
  - Range: 70-79% overall score
  - Severity: moderate

- `correction_priority__developing_major_corrections`
  - Display: Developing - Major Corrections
  - Description: Multiple mechanical issues to address
  - Range: 60-69% overall score
  - Severity: needs_improvement

- `correction_priority__beginner_rebuild_needed`
  - Display: Beginner - Rebuild Needed
  - Description: Fundamental overhaul required
  - Range: <60% overall score
  - Severity: poor


### Overall Form Quality Assessment
Comprehensive holistic evaluation of shooting form

- `overall_form_quality__elite_textbook`
  - Display: Elite/Textbook Form
  - Description: Professional-level mechanics across all categories
  - Range: 95-100% composite score
  - Severity: excellent

- `overall_form_quality__excellent_form`
  - Display: Excellent Form
  - Description: Very strong mechanics with minor imperfections
  - Range: 85-94% composite score
  - Severity: good

- `overall_form_quality__good_solid_foundation`
  - Display: Good - Solid Foundation
  - Description: Fundamentally sound with areas for improvement
  - Range: 75-84% composite score
  - Severity: moderate

- `overall_form_quality__developing_needs_work`
  - Display: Developing - Needs Work
  - Description: Basic structure present, multiple corrections needed
  - Range: 65-74% composite score
  - Severity: needs_improvement

- `overall_form_quality__poor_significant_flaws`
  - Display: Poor - Significant Flaws
  - Description: Major mechanical issues throughout form
  - Range: 55-64% composite score
  - Severity: poor

- `overall_form_quality__needs_complete_rebuild`
  - Display: Needs Complete Rebuild
  - Description: Fundamental reconstruction required
  - Range: <55% composite score
  - Severity: critical



## Step 4: Configure Model Settings

1. Navigate to "Generate" → "Training Settings"
2. Set the following parameters:
   - **Preprocessing:**
     - Auto-Orient: True
     - Auto Contrast: False
     - Grayscale: False
   
   - **Inference Settings:**
     - Min Confidence: 0.4
     - Max Predictions per Category: 1

## Step 5: Label Format Convention

When annotating images, use labels in this format:
`shooting_hand_mechanics__optimal_wrist_snap`

Example labels:
- `shooting_hand_mechanics__optimal_wrist_snap`
- `elbow_alignment__perfect_inline`
- `follow_through__full_gooseneck_hold`
- `shooting_phase__release_point`

## Step 6: Upload Training Data

1. Prepare images showing various shooting forms
2. For each image, add multiple labels (multi-label classification)
3. Ensure good coverage of all categories and labels
4. Aim for:
   - Minimum 50 images per label
   - Balanced distribution across severity levels
   - Diverse shooter body types and shot types

## Step 7: Train the Model

1. Once you have sufficient labeled data, click "Train"
2. Select "Multi-Label Classification" model type
3. Use the default training settings or customize as needed
4. Wait for training to complete (typically 20-40 minutes)

## Step 8: Test and Deploy

1. Test the model with new images
2. Review predictions for accuracy
3. Deploy the model to your preferred environment
4. Use the API keys to integrate with your application

## API Integration

Use the following API keys for integration:

- **Private API Key:** rDWynPrytSysASUlyGvK...
- **Publishable API Key:** rf_qisv7ZQd27SzKITWR...

## Python Integration Example

```python
from roboflow import Roboflow

rf = Roboflow(api_key="rDWynPrytSysASUlyGvK")
project = rf.workspace("tbf-inc").project("basketball-form-quality-classifier")
model = project.version(1).model

# Predict on an image
result = model.predict("basketball_shot.jpg")
predictions = result.json()

# Parse multi-label results
for prediction in predictions.get("predicted_classes", []):
    category, label = prediction.split("__")
    print(f"{category}: {label}")
```

## Annotation Guidelines

See `ANNOTATION_GUIDE.md` for detailed annotation instructions including:
- Image quality requirements
- How to assess each category
- Examples and edge cases
- Quality control checklist

## Support

For questions or issues:
1. Check RoboFlow documentation: https://docs.roboflow.com
2. Review the annotation guide and category documentation
3. Contact the project maintainer

---

Generated by: update_roboflow_classifier.py
Configuration: roboflow_classifier_config.json
