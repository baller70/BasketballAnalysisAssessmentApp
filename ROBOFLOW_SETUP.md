# RoboFlow Setup Documentation
## Basketball Shooting Analysis - Custom Models

**Setup Date:** December 13, 2025  
**Workspace:** TBF Inc (`tbf-inc`)  
**Status:** ✅ All 3 projects created and configured

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [API Credentials](#api-credentials)
3. [Created Projects](#created-projects)
4. [Project Configurations](#project-configurations)
5. [API Endpoints](#api-endpoints)
6. [Integration Guide](#integration-guide)
7. [Next Steps](#next-steps)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This document contains all information about the RoboFlow custom model setup for basketball shooting form analysis. Three specialized projects have been created to provide comprehensive analysis:

1. **Basketball-Shooting-Form-Keypoints** - Detects 10 keypoints for shooting mechanics
2. **Basketball-Form-Quality-Classifier** - Multi-label classification for form quality assessment
3. **Basketball-Ball-Trajectory-Tracker** - Object detection for ball tracking and trajectory analysis

---

## 🔑 API Credentials

### Private API Key
```
rDWynPrytSysASUlyGvK
```
**Usage:** Model training, dataset management, project configuration  
**Security:** Keep private - do not expose in client-side code

### Publishable API Key
```
rf_qisv7ZQd27SzKITWRc2blZZo5F83
```
**Usage:** Inference/prediction API calls  
**Security:** Can be used in client-side code (rate-limited)

### Environment Variables

Add to your `.env` file:

```bash
# RoboFlow Configuration
ROBOFLOW_API_KEY=rDWynPrytSysASUlyGvK
ROBOFLOW_PUBLISHABLE_KEY=rf_qisv7ZQd27SzKITWRc2blZZo5F83
ROBOFLOW_WORKSPACE=tbf-inc
```

---

## 📦 Created Projects

### Project 1: Basketball Shooting Form Keypoints

**Project ID:** `basketball-shooting-form-keypoints`  
**Type:** Object Detection (used for keypoint detection)  
**License:** MIT (Public)  
**Purpose:** Detect 10 specific keypoints on the shooter's body and ball

#### Keypoint Classes (10 total)

1. **shooting_wrist** - Wrist position of shooting hand
2. **shooting_elbow** - Elbow position of shooting arm
3. **shooting_shoulder** - Shoulder of shooting side
4. **non_shooting_shoulder** - Non-shooting shoulder for balance
5. **hip_center** - Center point of hips
6. **shooting_knee** - Knee of shooting-side leg
7. **shooting_ankle** - Ankle of shooting-side leg
8. **ball_position** - Current position of basketball
9. **release_point** - Point where ball leaves hand
10. **head_position** - Position of shooter's head

#### Dashboard URL
```
https://app.roboflow.com/tbf-inc/basketball-shooting-form-keypoints
```

#### API Endpoint
```
https://detect.roboflow.com/tbf-inc/basketball-shooting-form-keypoints/{version}
```

---

### Project 2: Basketball Form Quality Classifier

**Project ID:** `basketball-form-quality-classifier`  
**Type:** Multi-Label Classification  
**License:** MIT (Public)  
**Purpose:** Assess shooting form quality across multiple dimensions

#### Classification Categories (5 categories, 15 total labels)

##### 1. Overall Form
- Excellent
- Good
- Needs Work
- Poor

##### 2. Elbow Alignment
- Correct
- Slightly Off
- Significantly Off

##### 3. Release Height
- Optimal
- Too Low
- Too High

##### 4. Follow Through
- Complete
- Incomplete
- None

##### 5. Balance
- Stable
- Unstable

#### Dashboard URL
```
https://app.roboflow.com/tbf-inc/basketball-form-quality-classifier
```

#### API Endpoint
```
https://detect.roboflow.com/tbf-inc/basketball-form-quality-classifier/{version}
```

---

### Project 3: Basketball Ball Trajectory Tracker

**Project ID:** `basketball-ball-trajectory-tracker`  
**Type:** Object Detection  
**License:** MIT (Public)  
**Purpose:** Track basketball movement and trajectory analysis

#### Detection Classes (3 classes)

1. **basketball** - Basketball object in frame
2. **release_point** - Point where ball is released from hand
3. **basket** - Basketball hoop/rim

#### Dashboard URL
```
https://app.roboflow.com/tbf-inc/basketball-ball-trajectory-tracker
```

#### API Endpoint
```
https://detect.roboflow.com/tbf-inc/basketball-ball-trajectory-tracker/{version}
```

---

## ⚙️ Project Configurations

### Recommended Preprocessing Settings

For all projects, apply these preprocessing steps in RoboFlow:

1. **Auto-Orient:** Remove EXIF rotation
2. **Resize:** 640x640 (maintain aspect ratio, pad with gray)
3. **Grayscale:** No (keep color for better detection)
4. **Contrast:** Auto-adjust (helps with varying lighting)
5. **Brightness:** Auto-adjust

### Recommended Augmentation Settings

#### For Keypoint Detection:
- **Rotation:** ±15 degrees
- **Brightness:** ±15%
- **Exposure:** ±10%
- **Blur:** Up to 1px
- **Noise:** Up to 2% of pixels

#### For Classification:
- **Rotation:** ±20 degrees
- **Brightness:** ±20%
- **Exposure:** ±15%
- **Flip:** Horizontal (50% probability)
- **Crop:** 0-10%

#### For Object Detection (Tracker):
- **Rotation:** ±10 degrees
- **Brightness:** ±15%
- **Exposure:** ±10%
- **Blur:** Up to 1.5px
- **Cutout:** 10% (3 boxes)

### Training Parameters

#### Keypoint Detection:
- **Epochs:** 100
- **Batch Size:** 16
- **Learning Rate:** 0.001 (with cosine annealing)
- **Image Size:** 640x640
- **Model Architecture:** YOLOv8 or YOLOv9

#### Classification:
- **Epochs:** 50
- **Batch Size:** 32
- **Learning Rate:** 0.0001
- **Model Architecture:** ResNet50 or EfficientNet-B0

#### Object Detection (Tracker):
- **Epochs:** 100
- **Batch Size:** 16
- **Learning Rate:** 0.001
- **Image Size:** 640x640
- **Model Architecture:** YOLOv8 or YOLOv9

---

## 🔌 API Endpoints

### Base URLs

**Inference API:**
```
https://detect.roboflow.com
```

**Upload API:**
```
https://api.roboflow.com
```

### Inference Endpoint Format

```
https://detect.roboflow.com/{workspace}/{project}/{version}?api_key={api_key}
```

### Example Inference Requests

#### Keypoint Detection
```bash
curl -X POST https://detect.roboflow.com/tbf-inc/basketball-shooting-form-keypoints/1 \
  -F "file=@/path/to/image.jpg" \
  -F "api_key=rf_qisv7ZQd27SzKITWRc2blZZo5F83"
```

#### Form Classification
```bash
curl -X POST https://detect.roboflow.com/tbf-inc/basketball-form-quality-classifier/1 \
  -F "file=@/path/to/image.jpg" \
  -F "api_key=rf_qisv7ZQd27SzKITWRc2blZZo5F83"
```

#### Ball Tracking
```bash
curl -X POST https://detect.roboflow.com/tbf-inc/basketball-ball-trajectory-tracker/1 \
  -F "file=@/path/to/image.jpg" \
  -F "api_key=rf_qisv7ZQd27SzKITWRc2blZZo5F83" \
  -F "confidence=40" \
  -F "overlap=30"
```

### Python SDK Example

```python
from roboflow import Roboflow

# Initialize
rf = Roboflow(api_key="rDWynPrytSysASUlyGvK")
workspace = rf.workspace()

# Load model
project = workspace.project("basketball-shooting-form-keypoints")
model = project.version(1).model

# Run inference
prediction = model.predict("basketball_shot.jpg", confidence=40, overlap=30)

# Get results
print(prediction.json())
```

---

## 🔧 Integration Guide

### Using the Helper Module

The `roboflow_helpers.py` module provides easy-to-use functions for integration:

```python
from roboflow_helpers import RoboFlowBasketballAnalyzer

# Initialize analyzer
analyzer = RoboFlowBasketballAnalyzer()

# Option 1: Individual model analysis
keypoints = analyzer.detect_keypoints("shot.jpg")
form_quality = analyzer.classify_form("shot.jpg")
ball_tracking = analyzer.track_basketball("shot.jpg")

# Option 2: Comprehensive analysis
results = analyzer.analyze_shooting_form("shot.jpg")

# Option 3: Visualize results
analyzer.visualize_keypoints("shot.jpg", keypoints, "annotated.jpg")
```

### Integration with Basketball Analysis App

#### Backend Integration (Python/Flask/FastAPI)

```python
# app/roboflow_service.py
from roboflow_helpers import RoboFlowBasketballAnalyzer

class BasketballAnalysisService:
    def __init__(self):
        self.analyzer = RoboFlowBasketballAnalyzer()
    
    def analyze_shot(self, image_path: str):
        """Analyze a basketball shot image"""
        return self.analyzer.analyze_shooting_form(image_path)
    
    def get_keypoints(self, image_path: str):
        """Get just keypoints"""
        return self.analyzer.detect_keypoints(image_path)
```

#### Frontend Integration (JavaScript/TypeScript)

```typescript
// services/roboflowApi.ts
const ROBOFLOW_API_KEY = process.env.NEXT_PUBLIC_ROBOFLOW_API_KEY;
const WORKSPACE = "tbf-inc";

export async function analyzeShootingForm(imageFile: File) {
  const formData = new FormData();
  formData.append("file", imageFile);
  formData.append("api_key", ROBOFLOW_API_KEY);
  
  const response = await fetch(
    `https://detect.roboflow.com/${WORKSPACE}/basketball-shooting-form-keypoints/1`,
    {
      method: "POST",
      body: formData
    }
  );
  
  return response.json();
}
```

---

## 📝 Next Steps

### Immediate Actions Required

#### 1. Data Collection & Annotation
- [ ] Collect 100-500 basketball shooting images per project
- [ ] Upload images to each project via RoboFlow dashboard
- [ ] Annotate images using RoboFlow Annotate tool
  - Keypoints: Mark all 10 keypoints on each image
  - Classification: Assign multiple labels per image
  - Tracking: Draw bounding boxes around basketball, release point, basket

#### 2. Dataset Generation
- [ ] Generate dataset versions with preprocessing/augmentation
- [ ] Split data: 70% training, 20% validation, 10% test
- [ ] Review augmented images to ensure quality

#### 3. Model Training
- [ ] Train all 3 models on RoboFlow platform
- [ ] Monitor training metrics (mAP, precision, recall)
- [ ] Iterate on hyperparameters if needed
- [ ] Deploy trained models

#### 4. Testing & Validation
- [ ] Test models with sample images
- [ ] Validate accuracy on test set
- [ ] Benchmark inference speed
- [ ] Fine-tune confidence thresholds

#### 5. Production Integration
- [ ] Update environment variables with model versions
- [ ] Integrate helper functions into main app
- [ ] Add error handling and fallbacks
- [ ] Set up monitoring and logging

### Data Sources for Training

#### Recommended Image Sources:
1. **YouTube Videos** - Extract frames from shooting form tutorials
2. **NBA/WNBA Footage** - Professional shooting mechanics
3. **Training Videos** - Amateur shooters for variety
4. **Synthetic Data** - Use pose estimation to generate variations
5. **User Uploads** - Collect from app users (with permission)

#### Annotation Tools:
- **RoboFlow Annotate** (recommended) - Built-in annotation
- **CVAT** - Open-source alternative
- **LabelImg** - For bounding boxes
- **Make Sense** - For keypoints

---

## 🐛 Troubleshooting

### Common Issues

#### Issue: "Project not found" error
**Solution:** Ensure you're using the correct project ID and workspace name
```python
# Correct format
project = workspace.project("basketball-shooting-form-keypoints")

# NOT
project = workspace.project("tbf-inc/basketball-shooting-form-keypoints")
```

#### Issue: "Model version not found"
**Solution:** You need to train the model first. Check dashboard for available versions.

#### Issue: "No predictions returned"
**Solution:** 
- Lower confidence threshold: `confidence=20`
- Ensure image quality is good
- Check if model is trained on similar images

#### Issue: "Rate limit exceeded"
**Solution:** 
- Use private API key for higher limits
- Implement request throttling
- Consider upgrading RoboFlow plan

#### Issue: "Invalid API key"
**Solution:**
- Verify API key is correct
- Check if key has been regenerated
- Ensure key has proper permissions

### Getting Help

- **RoboFlow Documentation:** https://docs.roboflow.com/
- **RoboFlow Community:** https://community.roboflow.com/
- **Support Email:** support@roboflow.com
- **GitHub Issues:** Report bugs via repository issues

---

## 📊 Project Status

### Current Status
✅ **Setup Complete** - All projects created and configured  
⚠️ **Training Required** - Models need training data  
🔜 **Pending** - Data collection and annotation

### Completion Checklist

- [x] Install RoboFlow SDK
- [x] Authenticate with API
- [x] Create Project #1: Keypoint Detection
- [x] Create Project #2: Form Classification
- [x] Create Project #3: Ball Tracking
- [x] Test API access for all projects
- [x] Create Python helper functions
- [x] Document setup and configuration
- [ ] Upload training data
- [ ] Annotate training images
- [ ] Train all three models
- [ ] Validate model accuracy
- [ ] Integrate with basketball analysis app
- [ ] Deploy to production

---

## 📚 Resources

### RoboFlow Documentation
- [Getting Started Guide](https://docs.roboflow.com/)
- [Object Detection](https://docs.roboflow.com/train/object-detection)
- [Classification](https://docs.roboflow.com/train/classification)
- [Python SDK](https://docs.roboflow.com/python)
- [REST API](https://docs.roboflow.com/api-reference/)

### Basketball Analysis Resources
- [Basketball Shooting Mechanics](https://www.breakthroughbasketball.com/fundamentals/shooting.html)
- [NBA Shot Tracking Data](https://www.nba.com/stats/)
- [MediaPipe Pose Estimation](https://google.github.io/mediapipe/solutions/pose.html)

### Files Created in This Setup
1. `roboflow_explore.py` - Workspace exploration script
2. `roboflow_create_projects.py` - Project creation script
3. `roboflow_test_projects.py` - Project access testing
4. `roboflow_helpers.py` - Integration helper functions
5. `roboflow_project_config.json` - Project configuration data
6. `roboflow_projects.json` - Project metadata
7. `ROBOFLOW_SETUP.md` - This documentation file

---

## 🔐 Security Notes

### API Key Management
- **Never commit API keys to version control**
- Store in environment variables or secure vaults
- Rotate keys periodically
- Use publishable key for client-side code only
- Monitor API usage for anomalies

### Data Privacy
- Ensure user consent for uploaded images
- Implement data retention policies
- Comply with GDPR/CCPA if applicable
- Anonymize sensitive information

---

## 📞 Contact & Support

**Workspace Owner:** TBF Inc  
**Workspace ID:** tbf-inc  
**Setup Date:** December 13, 2025  
**Last Updated:** December 13, 2025

For questions or issues with this setup, refer to:
- RoboFlow Dashboard: https://app.roboflow.com/
- This documentation file
- Python helper module documentation

---

**Document Version:** 1.0  
**Status:** Active  
**Next Review:** After model training completion
