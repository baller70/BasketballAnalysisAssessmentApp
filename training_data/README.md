# Basketball Training Dataset Collection

## Overview
This directory contains basketball training images organized for RoboFlow model training.

## Target Models
1. **Basketball-Shooting-Form-Keypoints** (Pose Estimation) - 1,500-2,000 images
2. **Basketball-Form-Quality-Classifier** (Classification) - 1,500-2,000 images  
3. **Basketball-Ball-Trajectory-Tracker** (Object Detection) - 500-1,000 images

## Directory Structure
```
training_data/
├── shooting_form_keypoints/    # Pose estimation images
│   ├── professional/            # NBA/college players
│   ├── amateur/                 # Various skill levels
│   ├── front_view/              # Front-facing shots
│   ├── side_view/               # Side profile shots
│   └── 45_degree/               # 45-degree angle shots
├── form_quality_classifier/     # Classification images
│   ├── excellent_form/          # Perfect shooting form
│   ├── good_form/               # Good form with minor issues
│   ├── needs_work/              # Noticeable form issues
│   └── poor_form/               # Poor shooting mechanics
└── ball_trajectory/             # Object detection images
    ├── jump_shots/              # Jump shot sequences
    ├── free_throws/             # Free throw sequences
    └── various_angles/          # Different camera angles
```

## Image Requirements
- **Resolution**: 1080p or higher
- **Lighting**: Clear, professional lighting preferred
- **Visibility**: Full body visible for pose estimation
- **Angles**: Multiple viewing angles
- **Diversity**: Various skill levels, body types, shot types

## Next Steps
1. Review and categorize downloaded images
2. Remove duplicates and low-quality images
3. Annotate images in RoboFlow
4. Train and evaluate models
5. Iterate on dataset composition

## Notes
- All images should be properly licensed for use
- Maintain attribution as required by source licenses
- Document any preprocessing steps applied

Generated: 2024
