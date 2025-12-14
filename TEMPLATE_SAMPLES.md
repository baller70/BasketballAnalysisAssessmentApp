# ShotStack Template Samples

**Generated:** December 13, 2025  
**Status:** ✅ Complete - Visual Mockups Created  
**Location:** `/home/ubuntu/basketball_app/template_samples/`

## 📋 Overview

This document showcases visual samples of the ShotStack video editing templates created for the basketball shooting analysis application. These templates demonstrate how analysis data (pose detection, angles, coaching feedback) will be overlaid on basketball shooting videos.

## 🎯 Purpose

These visual samples allow stakeholders to:
- **Evaluate** the visual design and layout
- **Provide feedback** on presentation and clarity
- **Understand** how the final analysis videos will appear
- **Approve** the template designs before production deployment

---

## 📺 Template Samples

### 1. Shooting Form Analysis

**File:** `sample_1_form_analysis.jpg`  
**Purpose:** Primary analysis template showing comprehensive biomechanical assessment

#### Features Demonstrated:
- ✅ **Skeleton Overlay** - Real-time pose detection visualization
- ✅ **Angle Measurements** - Three key biomechanical angles:
  - Elbow Angle: 92.5°
  - Knee Angle: 135.2°
  - Release Angle: 52.3°
- ✅ **Score Display** - Overall performance score (87/100)
- ✅ **Professional Overlay** - Semi-transparent green skeleton with confidence indicators
- ✅ **Keypoint Visualization** - 12 body joints tracked and displayed

#### Technical Implementation:
```python
- Skeleton connections between major joints
- Color-coded keypoints based on detection confidence:
  * Green (>90%): High confidence
  * Yellow (70-90%): Medium confidence
  * Red (<70%): Low confidence
- Angle indicators with labeled measurements
- Text overlays with background transparency
```

#### Use Cases:
- Post-shot analysis review
- Real-time form assessment
- Coaching session playback
- Progress tracking videos

---

### 2. Coaching Feedback

**File:** `sample_2_coaching_feedback.jpg`  
**Purpose:** Guidance template displaying actionable coaching tips and error highlighting

#### Features Demonstrated:
- ✅ **Staggered Feedback Annotations** - Timed text overlays showing:
  - "Excellent elbow alignment at 92.5° (optimal: 90°)"
  - "Knee flexion could be deeper for more power"
  - "Release angle is good - maintain follow-through"
- ✅ **Improvement Suggestions** - Yellow highlighted tips:
  - 💡 Bend knees to 130° for optimal power transfer
  - 💡 Keep shooting elbow tucked closer to body
- ✅ **Error Highlighting** - Red pulsing circles on areas needing correction
- ✅ **Color-Coded Messages**:
  - Blue background: Positive feedback
  - Red/orange background: Areas for improvement

#### Technical Implementation:
```python
- Multi-layer text overlays with timing control
- Background opacity for readability
- Visual attention indicators (pulsing circles)
- Color psychology for feedback categorization
```

#### Use Cases:
- Training session feedback videos
- Remote coaching delivery
- Self-analysis tools
- Youth player development

---

### 3. Split-Screen Comparison

**File:** `sample_3_split_screen.jpg`  
**Purpose:** Comparative analysis template for user vs. elite shooter form

#### Features Demonstrated:
- ✅ **Side-by-Side Layout** - Dual video display:
  - Left: User's shooting form
  - Right: Elite shooter reference
- ✅ **Clear Visual Divider** - White vertical line separating sections
- ✅ **Section Labels** - "Your Form" vs "Elite Shooter"
- ✅ **Comparative Metrics** - Direct metric comparison:
  - Elbow Angle: 95.2° vs 90.5°
  - Knee Flex: 115° vs 130°
  - Release: 48° vs 52°
- ✅ **Color-Coded Values**:
  - Orange: User metrics
  - Green: Elite shooter metrics

#### Technical Implementation:
```python
- 1920x1080 canvas split into two 960x1080 sections
- Synchronized playback (when using video)
- Metric overlays at bottom with differential highlighting
- Responsive label positioning
```

#### Use Cases:
- Elite shooter matching comparisons
- Form improvement visualization
- Before/after progress tracking
- Benchmark comparisons with professional players

---

## 📁 Files Generated

### Visual Assets
```
template_samples/
├── sample_1_form_analysis.jpg      (1920x1080) - 350KB
├── sample_2_coaching_feedback.jpg  (1920x1080) - 280KB
├── sample_3_split_screen.jpg       (1920x2160) - 520KB
├── template_previews.html          - Interactive preview page
└── mockup_results.json             - Metadata and descriptions
```

### Preview Access
- **HTML Preview:** `file:///home/ubuntu/basketball_app/template_samples/template_previews.html`
- **Direct Images:** Individual JPG files in `template_samples/` directory

---

## 🔧 Technical Specifications

### Template Architecture

#### Data Input Format
```python
{
    "keypoints": {
        "left_shoulder": {"x": 0.35, "y": 0.30, "confidence": 0.95},
        "right_shoulder": {"x": 0.65, "y": 0.30, "confidence": 0.96},
        # ... 10 more keypoints
    },
    "angles": {
        "elbow": {"value": 92.5, "ideal": 90, "position": {"x": 0.15, "y": 0}},
        "knee": {"value": 135.2, "ideal": 130, "position": {"x": 0.0, "y": 0.15}},
        "release": {"value": 52.3, "ideal": 50, "position": {"x": -0.15, "y": -0.1}}
    },
    "scores": {
        "overall": 87,
        "form": 90,
        "alignment": 85,
        "consistency": 86
    },
    "feedback": [
        "Excellent elbow alignment at 92.5° (optimal: 90°)",
        # ... more feedback items
    ]
}
```

#### ShotStack API Integration
```python
from shotstack_helpers import ShotStackClient, BasketballVideoEditor

client = ShotStackClient(environment='sandbox')
editor = BasketballVideoEditor(client)

# Example: Render form analysis
render_response = editor.create_shooting_form_analysis(
    video_url="https://your-video-url.mp4",
    annotations=annotations_list,
    angles=angles_list,
    duration=5.0
)
```

### Output Specifications
- **Resolution:** 1920x1080 (Full HD)
- **Frame Rate:** 30 FPS
- **Format:** MP4 (H.264)
- **Compression:** High quality, web-optimized
- **Duration:** 3-10 seconds typical (configurable)

---

## 🎨 Design Decisions

### Color Scheme
- **Skeleton Overlay:** Neon green (#00ff00) - High visibility on varied backgrounds
- **Positive Feedback:** Blue (#0066cc) - Calming, informative
- **Improvement Areas:** Red/Orange (#cc3300) - Attention-grabbing
- **Metrics:** Yellow (#ffff00) - Neutral highlight
- **Background Overlays:** Black with 70% opacity - Ensures text readability

### Typography
- **Font:** Arial (web-safe, highly legible)
- **Feedback Text:** 0.7-0.9 scale - Readable but non-intrusive
- **Titles:** 1.2-1.5 scale - Clear hierarchy
- **Metrics:** 0.6 scale - Compact data display

### Layout Principles
- **Rule of Thirds:** Key annotations positioned at visual intersection points
- **Negative Space:** Sufficient padding around text for clarity
- **Hierarchy:** Largest text for titles, medium for feedback, smallest for metrics
- **Contrast:** High contrast between text and backgrounds

---

## 🚀 Production Deployment

### API Requirements
- **ShotStack API Key:** Sandbox or Production tier
- **Credits:** Approximately 50 credits per 10-second video
- **Render Time:** 30-90 seconds typical

### Integration Workflow
```
1. User uploads basketball shooting video
2. RoboFlow processes video → keypoints extracted
3. Backend calculates angles + scores
4. ShotStack template applied with overlays
5. Rendered video URL returned to user
6. Video stored in S3 for playback
```

### Environment Variables
```bash
# .env.shotstack
SHOTSTACK_SANDBOX_API_KEY=5I9pXTQbDLmcF6tvgjOzgYtDN5jyK2FnurBSU5oy
SHOTSTACK_PRODUCTION_API_KEY=HQNZcbuBHc1zVapRhzAdHQFqNkXzQG1YrqYhBhwZ
SHOTSTACK_ENVIRONMENT=sandbox  # or 'production'
```

---

## 📊 Mock Data Used

### Keypoints (12 joints tracked)
```
- left_shoulder, right_shoulder
- left_elbow, right_elbow
- left_wrist, right_wrist
- left_hip, right_hip
- left_knee, right_knee
- left_ankle, right_ankle
```

### Biomechanical Angles
- **Elbow Angle:** 92.5° (optimal: 90°) - Shooting arm bend at release
- **Knee Flexion:** 135.2° (optimal: 130°) - Lower body power generation
- **Release Angle:** 52.3° (optimal: 50°) - Ball trajectory at release

### Performance Scores
- **Overall:** 87/100
- **Form:** 90/100
- **Alignment:** 85/100
- **Consistency:** 86/100

---

## 🎯 Next Steps

### For User Review:
1. ✅ **View HTML Preview:** Open `template_previews.html` in browser
2. ✅ **Examine Each Sample:** Click images for full-size view
3. ✅ **Provide Feedback:** Note any design changes or additions needed
4. ✅ **Approve or Request Changes:** Confirm templates meet requirements

### For Development Team:
- [ ] Address any user feedback on design
- [ ] Test ShotStack API with valid credentials
- [ ] Integrate templates into production pipeline
- [ ] Set up video storage (S3) for rendered outputs
- [ ] Implement render job queue for scalability
- [ ] Add progress tracking for rendering status

---

## 📝 Additional Notes

### Current Status
- ✅ All 3 templates designed and mockups created
- ✅ Data structures defined and tested
- ⚠️ ShotStack API key needs revalidation (403 error encountered)
- ⚠️ Video upload service needs implementation

### Known Limitations
- Mockups use static images (actual implementation uses video)
- Sample basketball images from training dataset (not actual user footage)
- API rendering requires valid ShotStack credentials

### Resources
- **ShotStack Documentation:** https://shotstack.io/docs/api/
- **Template Code:** `/home/ubuntu/basketball_app/shotstack_helpers.py`
- **Mockup Generator:** `/home/ubuntu/basketball_app/create_template_mockups.py`

---

## 🔗 Related Documentation

- **RoboFlow Integration:** `ROBOFLOW_SETUP.md`
- **Backend API:** `python-backend/README.md`
- **Database Schema:** `prisma/schema.prisma`
- **Deployment Guide:** `DEPLOYMENT_ANALYSIS.md`

---

**Generated by:** Basketball Analysis Development Team  
**Last Updated:** December 13, 2025  
**Contact:** Review feedback in HTML preview comments or project documentation
