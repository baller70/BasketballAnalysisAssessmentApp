# Basketball Shooting Form Training Data

## Dataset Information
- **Purpose**: Train keypoint detection model for basketball shooting form analysis
- **Format**: COCO Keypoints
- **Target Size**: 640x640 pixels

## Keypoints (18 total)
0. nose
1. left_eye
2. right_eye
3. left_ear
4. right_ear
5. left_shoulder
6. right_shoulder
7. left_elbow
8. right_elbow
9. left_wrist
10. right_wrist
11. left_hip
12. right_hip
13. left_knee
14. right_knee
15. left_ankle
16. right_ankle
17. basketball (center)

## Shooting Phases
- **LOAD**: Ball below chin, knees bent, preparing
- **SET**: Ball at set point, aiming
- **RELEASE**: Ball leaving hands
- **FOLLOW_THROUGH**: Arms extended, ball released

## How to Use in RoboFlow

1. Create new project: "Keypoint Detection"
2. Upload images from `images/` folder
3. Define custom skeleton using `roboflow_config.json`
4. Annotate each image with all 18 keypoints
5. Label shooting phase as class tag
6. Train model with default settings

## Annotation Tips
- Mark all visible keypoints precisely
- Mark occluded keypoints with "occluded" flag
- Always mark basketball position
- Use bounding box for person detection
