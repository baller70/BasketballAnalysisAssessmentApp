# RoboFlow Model Training Requirements

## Executive Summary

For production-ready basketball shooting form analysis, we need **1,000-1,500 high-quality annotated images**.

---

## Images Needed for Basketball Shooting Form Analysis

### For 3 Custom Models:

#### 1. Basketball Shooting Form Keypoint Detector (18 keypoints)
**Purpose:** Detect body pose keypoints for biomechanical analysis

| Training Level | Images Required | Expected Accuracy | Notes |
|---------------|----------------|-------------------|-------|
| **Minimum Viable (MVP)** | 500 images | 85-88% | Basic functionality |
| **Production Ready** | 1,000-1,500 images | 90-95% | **Recommended** |
| **Optimal Performance** | 2,000+ images | 95%+ | Elite accuracy |

**Keypoints to detect:**
- 0: Neck, 1: Mid-hip, 2-7: Shoulders/Elbows/Wrists
- 8-13: Hips/Knees/Ankles, 14-17: Eyes/Ears

**Diversity requirements:**
- Various shooting phases (preparation, release, follow-through)
- Different camera angles (front, side, 45°)
- Indoor/outdoor lighting conditions
- Multiple body types and heights
- Both male and female players

---

#### 2. Shooting Form Quality Classifier (5 categories)
**Purpose:** Classify shooting form quality automatically

| Training Level | Images Required | Per Category | Expected Accuracy |
|---------------|----------------|--------------|-------------------|
| **Minimum Viable** | 300 images | 60 per category | 80-85% |
| **Production Ready** | 500-1,000 images | 100-200 per category | 88-93% |
| **Optimal** | 1,500+ images | 300+ per category | 95%+ |

**Categories:**
1. **Excellent** - Elite form (Stephen Curry, Ray Allen level)
2. **Good** - Solid fundamentals, minor issues
3. **Average** - Mixed fundamentals
4. **Needs Work** - Several form issues
5. **Poor** - Major form problems

---

#### 3. Ball Flight Trajectory & Arc Analyzer
**Purpose:** Track ball trajectory and shooting arc

| Training Level | Images Required | Expected Accuracy |
|---------------|----------------|-------------------|
| **Minimum Viable** | 300 images | 85% |
| **Production Ready** | 500-800 images | 90-95% |
| **Optimal** | 1,000+ images | 95%+ |

**Requirements:**
- Clear ball visibility throughout flight
- Multiple arc heights (flat, medium, high)
- Various distances (free throw, mid-range, 3-point)

---

## Total Images Needed

### Summary Table

| Level | Total Images | Time to Collect | Expected Accuracy | Recommendation |
|-------|-------------|----------------|-------------------|----------------|
| **MVP (Minimum)** | 1,000-1,500 | 3-5 days | 85-90% | ✅ **Start here** |
| **Production Ready** | 2,000-3,000 | 7-10 days | 90-95% | 🎯 Target |
| **Optimal** | 3,000-5,000 | 14-21 days | 95%+ | 🏆 Long-term goal |

---

## Current Status

### Collection Progress
- ✅ **Collected:** 25 images (pending user approval)
- 🎯 **Target:** 1,000-1,500 images for MVP
- 📊 **Need:** 975-1,475 more images
- ⏱️ **Timeline:** 5-7 days with multi-source collection

### Collection Sources
1. **YouTube Videos** (300-500 images) - Tutorial extraction
2. **Pixabay API** (100-200 images) - Free stock photos
3. **Pexels API** (100-200 images) - High-quality photography
4. **Unsplash API** (100-200 images) - Professional shots
5. **Web Scraping** (100-200 images) - Basketball training sites

**Expected yield after Vision AI filtering:** 700-1,000 approved images

---

## Image Quality Requirements

### Must-Have Criteria
✅ **Basketball visible** in frame  
✅ **Full body visible** (head to feet)  
✅ **Clear shooting form** (not blurred)  
✅ **Good lighting** (not too dark/bright)  
✅ **Single player focus** (for keypoint detection)  
✅ **High resolution** (minimum 800x600px)  

### Bonus Criteria
⭐ **Multiple shooting phases** in sequence  
⭐ **Side/45° angle** (best for form analysis)  
⭐ **Professional photography** (sharp focus)  
⭐ **Diverse player types** (height, gender, skill level)  
⭐ **Court background** (contextual realism)  

---

## Annotation Requirements

### For Keypoint Detection Model
- Annotate all 18 keypoints per image
- Use RoboFlow's skeleton annotation tool
- **Estimated time:** 2-3 minutes per image
- **Total annotation time:** 33-75 hours for 1,000-1,500 images

### For Quality Classifier Model
- Label each image with quality category (Excellent/Good/Average/Needs Work/Poor)
- **Estimated time:** 30 seconds per image
- **Total annotation time:** 8-12 hours for 1,000-1,500 images

### For Trajectory Model
- Draw bounding boxes around ball in flight
- Track ball across multiple frames (for videos)
- **Estimated time:** 1-2 minutes per image
- **Total annotation time:** 17-50 hours for 1,000-1,500 images

**Total annotation effort:** 58-137 hours for all 3 models

---

## Recommended Strategy

### Phase 1: MVP Collection (Week 1)
✅ **Goal:** 1,000-1,500 images  
✅ **Focus:** Keypoint detection model (highest priority)  
✅ **Sources:** All 5 sources with Vision AI pre-filtering  
✅ **User approval:** Batch review (50-100 images at a time)  

### Phase 2: Annotation (Week 2-3)
✅ **Annotate keypoints** for 1,000-1,500 approved images  
✅ **Train initial model** in RoboFlow  
✅ **Test accuracy** on validation set  

### Phase 3: Iteration (Week 4+)
✅ **Collect more images** for weak categories  
✅ **Add quality classification** labels  
✅ **Train classifier model**  
✅ **Integrate trajectory tracking**  

---

## Success Metrics

### Keypoint Detection
- **Accuracy:** 90%+ keypoint detection rate
- **Speed:** <500ms inference time per image
- **Robustness:** Works in various lighting/angles

### Quality Classifier
- **Accuracy:** 88%+ classification accuracy
- **Consistency:** <5% false positive rate for "Excellent"

### Trajectory Analyzer
- **Accuracy:** 90%+ ball tracking accuracy
- **Arc calculation:** ±3° error margin

---

## Next Steps

1. ✅ **Execute multi-source collection** (automated)
2. ✅ **Run Vision AI pre-filtering** (automated)
3. 🔄 **User approval** (manual, 2-4 hours)
4. 🔄 **Upload to RoboFlow** (semi-automated)
5. 🔄 **Annotate keypoints** (manual, 33-75 hours)
6. 🔄 **Train models** (automated)
7. 🔄 **Validate accuracy** (semi-automated)

---

## References

- **RoboFlow Documentation:** https://docs.roboflow.com/
- **Pose Estimation Best Practices:** https://blog.roboflow.com/pose-estimation/
- **Dataset Size Recommendations:** https://blog.roboflow.com/how-much-data-do-i-need/

---

**Last Updated:** December 13, 2025  
**Status:** Ready for multi-source collection
