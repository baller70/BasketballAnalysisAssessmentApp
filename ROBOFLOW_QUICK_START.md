# RoboFlow Quick Start Guide
## Basketball Analysis - 3 Custom Models

### ✅ Setup Status: COMPLETE

All 3 RoboFlow projects have been successfully created and configured.

---

## 🚀 Quick Access

### RoboFlow Dashboard
👉 **https://app.roboflow.com/tbf-inc**

### Projects

1. **Keypoint Detection**  
   https://app.roboflow.com/tbf-inc/basketball-shooting-form-keypoints

2. **Form Classifier**  
   https://app.roboflow.com/tbf-inc/basketball-form-quality-classifier

3. **Ball Tracker**  
   https://app.roboflow.com/tbf-inc/basketball-ball-trajectory-tracker

---

## 🔑 API Keys

**Private Key** (for training/config):  
`rDWynPrytSysASUlyGvK`

**Publishable Key** (for inference):  
`rf_qisv7ZQd27SzKITWRc2blZZo5F83`

---

## 💻 Quick Usage

### Python
```python
from roboflow_helpers import RoboFlowBasketballAnalyzer

# Initialize
analyzer = RoboFlowBasketballAnalyzer()

# Analyze shot
results = analyzer.analyze_shooting_form("basketball_shot.jpg")
```

### Command Line
```bash
# Test project access
python3 roboflow_test_projects.py

# Run demo
python3 roboflow_helpers.py
```

---

## 📋 Next Steps

### 1. Upload Training Data
- Visit each project dashboard
- Upload 100-500 images per project
- Use RoboFlow Annotate tool

### 2. Annotate Images

**Keypoints (10 per image):**
- shooting_wrist, shooting_elbow, shooting_shoulder
- non_shooting_shoulder, hip_center
- shooting_knee, shooting_ankle
- ball_position, release_point, head_position

**Classification (multiple labels per image):**
- Overall Form, Elbow Alignment, Release Height
- Follow Through, Balance

**Object Detection (bounding boxes):**
- basketball, release_point, basket

### 3. Train Models
- Generate dataset version with augmentation
- Train on RoboFlow platform
- Monitor training metrics
- Deploy trained models

### 4. Integrate
- Update version numbers in helper functions
- Test with real images
- Integrate with basketball analysis app

---

## 📚 Documentation

**Full Setup Guide:** `ROBOFLOW_SETUP.md`  
**Helper Functions:** `roboflow_helpers.py`  
**Strategy Document:** `ROBOFLOW_MODEL_STRATEGY.md`

---

## 🐛 Troubleshooting

**Models not working?**  
→ They need training data first. Upload and annotate images.

**"Project not found"?**  
→ Use project ID without workspace prefix: `basketball-shooting-form-keypoints`

**Rate limit errors?**  
→ Use private API key or upgrade RoboFlow plan

---

## 📞 Support

- RoboFlow Docs: https://docs.roboflow.com/
- Community: https://community.roboflow.com/
- Support: support@roboflow.com

---

**Status:** ✅ Setup Complete | ⚠️ Training Required  
**Created:** December 13, 2025  
**Workspace:** TBF Inc (`tbf-inc`)
