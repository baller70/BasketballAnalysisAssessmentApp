# Basketball Shooting Form Training Data Collection

## 🎯 Goal
Collect **bare minimum quality dataset** for training a RoboFlow custom pose estimation model specifically for basketball shooting form analysis.

---

## 📊 Minimum Requirements

### For Custom Pose Estimation (Keypoints)
| Category | Minimum | Recommended | Notes |
|----------|---------|-------------|-------|
| **Total Images** | 100-150 | 300-500 | Start with 100, add over time |
| **Per Shooting Phase** | 25-30 | 75-100 | Ensure balance across phases |
| **Annotation Type** | Keypoints | Keypoints + Bounding Box | 10-16 body points |

### Shooting Phases to Cover (4 phases × 25-30 images each)
1. **LOAD** - Ball below chin, knees bent, preparing
2. **SET** - Ball at set point (forehead/above), aiming
3. **RELEASE** - Ball leaving hands, follow-through starting
4. **FOLLOW_THROUGH** - Full extension, ball released

---

## 🎯 Keypoints to Annotate (16 points)

```
KEYPOINT MAP:
                    [0] nose
                      |
    [5] L_shoulder -- [neck] -- [6] R_shoulder
              |                       |
        [7] L_elbow              [8] R_elbow
              |                       |
        [9] L_wrist              [10] R_wrist
              |                       |
                  [11] L_hip -- [12] R_hip
                        |         |
                  [13] L_knee  [14] R_knee
                        |         |
                  [15] L_ankle [16] R_ankle

Additional:
- [ball] - Basketball position (critical for our use case)
```

---

## 📁 Data Collection Sources

### HIGH QUALITY Sources (Prioritize These)
1. **NBA/WNBA Official Media**
   - NBA YouTube channel: Game highlights, slow-mo replays
   - NBA.com media: Player shooting galleries
   - WNBA official content
   
2. **Basketball Training Channels (YouTube)**
   - ShotMechanics - Pure shooting form tutorials
   - By Any Means Basketball - Form breakdowns
   - ILoveBasketballTV - Shooting drills
   - Pro Shot Shooting System - Technical analysis

3. **Stock Photo/Video Sites**
   - Shutterstock (basketball shooting)
   - Getty Images Sports
   - Unsplash (free, limited)

### Frame Extraction from Videos
Extract frames at key moments:
- 1 frame at LOAD position
- 1 frame at SET position  
- 1 frame at RELEASE point
- 1 frame at FOLLOW_THROUGH

---

## ✅ Image Quality Checklist

### MUST HAVE:
- [ ] Full body visible (head to feet)
- [ ] Clear shooting motion (not passing/dribbling)
- [ ] Good lighting (can see body parts clearly)
- [ ] Side angle OR front angle (not from behind)
- [ ] Resolution at least 640x480

### NICE TO HAVE:
- [ ] Basketball visible in frame
- [ ] Indoor court (consistent background)
- [ ] Professional/semi-pro player
- [ ] Multiple angles of same shot

### REJECT IF:
- ❌ Partial body (cropped legs/arms)
- ❌ Motion blur (can't identify joints)
- ❌ Multiple players overlapping
- ❌ Player not shooting (dunking, passing, etc.)
- ❌ From behind (can't see shooting hand)

---

## 📋 Collection Breakdown

### Phase 1: Minimum Viable Dataset (100 images)
```
LOAD phase:        25 images
SET phase:         25 images
RELEASE phase:     25 images
FOLLOW_THROUGH:    25 images
------------------------
TOTAL:            100 images
```

### Diversity Requirements:
- At least 30% different players
- Mix of NBA, WNBA, college, amateur
- Mix of left-handed and right-handed shooters
- Various heights (guards, forwards, centers)
- Both indoor and outdoor courts

---

## 🏷️ Annotation Guidelines

### RoboFlow Keypoint Annotation:
1. Create project type: "Keypoint Detection"
2. Define skeleton with 17 keypoints
3. Add "basketball" as additional detection class

### Annotation Steps:
1. Upload image batch
2. For each image:
   - Mark all 16 body keypoints
   - Mark basketball center point
   - Label shooting phase (LOAD/SET/RELEASE/FOLLOW_THROUGH)
   - Mark shooting hand (LEFT/RIGHT)
3. Review and correct any misaligned points
4. Validate annotation quality

### Keypoint Visibility:
- **Visible**: Mark exact position
- **Occluded**: Mark estimated position, flag as occluded
- **Not in frame**: Don't mark (skip that point)

---

## 📥 Automated Collection Script

### YouTube Frame Extraction
Run: `python scripts/extract_training_frames.py`

### Supported formats:
- Images: JPG, PNG, WEBP
- Videos: MP4, MOV, WEBM (extract frames)

---

## 🗂️ Folder Structure

```
training_data/
├── raw/                    # Unprocessed collected images
│   ├── nba/
│   ├── wnba/
│   ├── college/
│   └── amateur/
├── processed/              # Resized & cleaned images
│   ├── load/
│   ├── set/
│   ├── release/
│   └── follow_through/
├── annotated/              # RoboFlow export
│   ├── train/
│   ├── valid/
│   └── test/
└── rejected/               # Images that didn't meet quality
```

---

## 🚀 Training Plan

### Step 1: Collect 100 Quality Images (Week 1)
- 25 per shooting phase
- Ensure diversity

### Step 2: Annotate in RoboFlow (Week 1-2)
- Mark all 17 keypoints per image
- Label shooting phase
- Review for accuracy

### Step 3: Train Initial Model (Week 2)
- 70% train / 20% validation / 10% test split
- Use RoboFlow augmentation (flip, brightness, blur)
- Train for 100 epochs minimum

### Step 4: Evaluate & Iterate
- Test on new images
- Identify failure cases
- Add more training data for weak areas

### Step 5: Gradual Improvement
- Add 50 images per month
- Focus on edge cases
- Retrain monthly

---

## 📈 Expected Performance

### With 100 images:
- Basic pose detection: ~70-80% accuracy
- Phase classification: ~65-75% accuracy
- Good for MVP testing

### With 300 images:
- Pose detection: ~85-90% accuracy
- Phase classification: ~80-85% accuracy
- Production-ready

### With 500+ images:
- Pose detection: ~90-95% accuracy
- Phase classification: ~85-90% accuracy
- Professional quality

---

## ⚠️ Important Notes

1. **Quality > Quantity**: 100 well-annotated images beats 500 poorly annotated
2. **Consistency**: Use same keypoint positions across all images
3. **Diversity**: Include different body types, skin tones, lighting
4. **Balance**: Equal distribution across shooting phases
5. **Iteration**: Start small, improve based on real-world testing

---

## 🔗 Resources

- [RoboFlow Keypoint Annotation Guide](https://docs.roboflow.com/annotate/keypoint-detection)
- [RoboFlow Training Custom Models](https://docs.roboflow.com/train)
- [Basketball Shooting Form Analysis](https://www.youtube.com/results?search_query=basketball+shooting+form+analysis)





