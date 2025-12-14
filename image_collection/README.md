# Basketball Image Collection System

🎯 **Goal:** Collect 500-1,000 high-quality basketball shooting images for RoboFlow model training

---

## 📊 System Overview

### Collection Pipeline

```
┌────────────────────┐
│  STEP 1: Setup     │
│  API Keys          │
└────────┬───────────┘
         │
         │ setup_api_keys.py
         ↓
┌────────┴──────────────────┐
│  STEP 2: Collection            │
│  Multi-Source (5 sources)      │
│  - Pixabay (~200)              │
│  - Pexels (~200)               │
│  - Unsplash (~200)             │
│  - YouTube (videos)            │
│  - Web Scraping                │
└───────────────┬───────────────┘
               │
               │ multi_source_collector.py
               │ (Automatic deduplication)
               ↓
┌──────────────┴─────────────────┐
│  STEP 3: Vision AI Pre-Filter    │
│  Claude Vision API                │
│  - Basketball visible?            │
│  - Shooting form clear?           │
│  - Full body visible?             │
│  - Image quality good?            │
│  Score: 0-100                     │
└─────────────────┬────────────────┘
                 │
                 │ vision_ai_filter.py
                 │ (Filters to ACCEPT images)
                 ↓
┌────────────────┴──────────────────┐
│  STEP 4: User Approval              │
│  Web Interface                      │
│  - Batch review (50-100 images)     │
│  - Keyboard shortcuts (A/R)         │
│  - Bulk actions                     │
│  - Progress tracking                │
└──────────────────┬─────────────────┘
                   │
                   │ approval_interface/index.html
                   ↓
┌──────────────────┴───────────────────┐
│  STEP 5: RoboFlow Upload              │
│  (Manual or scripted)                 │
│  - Annotate keypoints (18 points)     │
│  - Train models                       │
└────────────────────────────────────────┘
```

---

## 🚀 Quick Start (5 Steps)

### Prerequisites

```bash
pip install requests anthropic python-dotenv
```

### Step 1: Setup API Keys

```bash
python setup_api_keys.py
```

**You'll need:**
- ✅ Anthropic API key (already configured)
- 📸 At least 1 image source API key:
  - Pixabay: https://pixabay.com/api/docs/
  - Pexels: https://www.pexels.com/api/
  - Unsplash: https://unsplash.com/developers

### Step 2: Collect Images

```bash
python multi_source_collector.py
```

**Expected output:**
- 500-600 raw images (from 3 sources)
- Automatic deduplication
- Metadata tracking
- Collection report

**Time:** ~10-15 minutes

### Step 3: Run Vision AI Filter

```bash
python vision_ai_filter.py
```

**Expected output:**
- 300-400 filtered images (ACCEPT only)
- 60-70% acceptance rate
- Detailed quality scores
- Filter report

**Time:** ~20-40 minutes (depends on image count)

### Step 4: User Approval

```bash
# Open in browser
open approval_interface/index.html

# Or with Python
python -m http.server 8000
# Then visit: http://localhost:8000/approval_interface/
```

**Features:**
- ⌨️ Keyboard shortcuts: A (approve), R (reject), Shift+Click (multi-select)
- 📁 Sort by score, source, or date
- 👀 Detailed image preview with AI analysis
- 💾 Auto-save progress (localStorage)
- 📊 Real-time progress tracking

**Time:** 2-4 hours (for 300-400 images)

### Step 5: Check Progress

```bash
python progress_tracker.py
```

**Output:**
- Collection stats by source
- Vision AI acceptance rate
- User approval status
- Overall progress percentage
- Estimated time remaining

---

## 📁 Directory Structure

```
image_collection/
├── 📄 README.md                    (This file)
├── 🔑 .env                         (API keys - DO NOT COMMIT)
├── 🔑 .env.example                 (Template)
├── 🐍 setup_api_keys.py            (Interactive setup)
├── 🐍 multi_source_collector.py    (Main collector)
├── 🐍 vision_ai_filter.py          (Claude Vision filter)
├── 🐍 progress_tracker.py          (Progress reporting)
├── 📂 raw_images/                  (Downloaded images)
├── 📂 filtered_images/             (Vision AI accepted)
├── 📂 rejected_images/             (Vision AI rejected)
├── 📂 metadata/                    (JSON tracking files)
│   ├── collection_metadata.json
│   ├── progress.json
│   ├── dashboard_data.json
│   ├── collection_report.txt
│   └── vision_ai_filter_report.txt
└── 📂 approval_interface/          (Web UI)
    ├── index.html
    ├── styles.css
    └── app.js
```

---

## 💡 Tips & Best Practices

### API Rate Limits

| Source | Free Tier | Rate Limit |
|--------|-----------|------------|
| Pixabay | 100 searches/day | ~200 images/day |
| Pexels | 200 requests/hour | ~200 images/hour |
| Unsplash | 50 requests/hour | ~50 images/hour |
| Claude Vision | 5 requests/min | ~150 images/hour |

### Collection Strategy

1. **Start with highest quality sources:**
   - Unsplash (professional photography)
   - Pexels (curated stock photos)
   - Pixabay (diverse content)

2. **Run collector multiple times:**
   - Day 1: Pixabay + Pexels
   - Day 2: Unsplash + Pixabay (different query)
   - Day 3: Pexels (additional queries)

3. **Vary search queries:**
   - "basketball shooting form"
   - "basketball jump shot"
   - "basketball free throw"
   - "basketball player shooting"
   - "basketball training"

### Vision AI Filtering

- **Acceptance rate:** Expect 60-70%
- **If too low (<40%):** Adjust search queries or lower score threshold
- **If too high (>90%):** Increase quality requirements

### User Approval

- **Review in batches:** 50-100 images per session
- **Take breaks:** Review fatigue affects quality
- **Use keyboard shortcuts:** Much faster than clicking
- **Check diversity:** Ensure variety in angles, players, lighting

---

## 🐛 Troubleshooting

### No images collected

```bash
# Check API keys
cat .env

# Test APIs manually
python -c "import requests; print(requests.get('https://pixabay.com/api/?key=YOUR_KEY&q=basketball').status_code)"
```

### Vision AI filter fails

```bash
# Check Anthropic API key
echo $ANTHROPIC_API_KEY

# Verify image files exist
ls -lh raw_images/

# Check for rate limiting errors in logs
```

### Approval interface not loading

```bash
# Start local server
cd approval_interface/
python -m http.server 8000

# Check metadata file exists
ls -lh ../metadata/collection_metadata.json
```

### Progress not saving

- Check browser localStorage (F12 → Application → Local Storage)
- Click "Save Progress" button explicitly
- Refresh page to verify saved state

---

## 📊 Expected Timeline

### For 1,000 approved images:

| Day | Task | Time | Output |
|-----|------|------|--------|
| 1 | Setup API keys | 15 min | .env configured |
| 1 | Collect batch 1 (Pixabay) | 15 min | 200 images |
| 1 | Collect batch 2 (Pexels) | 15 min | 200 images |
| 1 | Collect batch 3 (Unsplash) | 15 min | 200 images |
| 1 | Vision AI filter | 40 min | 400 filtered |
| 2 | User approval (batch 1) | 2 hours | 150 approved |
| 3 | User approval (batch 2) | 2 hours | 150 approved |
| 4 | Collect more (if needed) | 30 min | 300 images |
| 4 | Vision AI filter | 30 min | 180 filtered |
| 5 | User approval (final) | 3 hours | 200 approved |
| **Total** | | **11-12 hours** | **1,000 images** |

---

## 🎯 Success Metrics

### Quality Indicators

✅ **Basketball visible:** 100%  
✅ **Full body visible:** >90%  
✅ **Clear shooting form:** >85%  
✅ **Good lighting:** >80%  
✅ **Diverse angles:** Side (40%), Front (30%), 45° (30%)  
✅ **Diverse players:** Male (60%), Female (30%), Youth (10%)  

### Quantity Targets

| Level | Images | Use Case |
|-------|--------|----------|
| **Minimum** | 500 | Basic model testing |
| **Target** | 1,000 | MVP production |
| **Optimal** | 1,500+ | High accuracy |

---

## 🔗 Next Steps After Collection

1. **Upload to RoboFlow**
   - Create new project
   - Upload approved images
   - Bulk import metadata

2. **Annotate Images**
   - Use RoboFlow annotation tool
   - Mark 18 keypoints per image
   - Estimated: 2-3 minutes per image

3. **Train Models**
   - Keypoint detection model
   - Form quality classifier
   - Trajectory analyzer

4. **Validate & Iterate**
   - Test on validation set
   - Identify weak categories
   - Collect more targeted images

---

## 📝 Notes

- **Privacy:** All images are from public stock photo APIs (commercial use allowed)
- **Storage:** ~500-800 MB for 1,000 images
- **Backup:** Metadata files allow recovery if images are lost
- **Version control:** DO NOT commit `.env` or image files to Git

---

**Last Updated:** December 13, 2025  
**Version:** 1.0.0  
**Status:** Ready for production use
