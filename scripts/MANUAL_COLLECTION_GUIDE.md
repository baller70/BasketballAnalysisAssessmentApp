# Manual Image Collection Guide

## 🎯 Goal: Collect 100 Quality Images

Since automated collection often gets wrong images, this guide helps you manually collect the RIGHT images.

---

## 📋 What We Need (100 images minimum)

| Phase | Count | What to Look For |
|-------|-------|------------------|
| **LOAD** | 25 | Ball below chin, knees bent, about to shoot |
| **SET** | 25 | Ball at forehead/set point, aiming at basket |
| **RELEASE** | 25 | Ball leaving hands, follow-through starting |
| **FOLLOW_THROUGH** | 25 | Arms extended up, ball gone, wrist snapped |

---

## ✅ Good Image Checklist

Before saving ANY image, verify:

- [ ] Full body visible (head to at least knees)
- [ ] Player is SHOOTING (not passing, dribbling, dunking)
- [ ] Clear view of shooting form
- [ ] Side angle or front angle (NOT from behind)
- [ ] Good lighting
- [ ] Minimal motion blur
- [ ] Basketball visible (preferably)

---

## 🔗 BEST Sources (Use These)

### 1. Getty Images - Editorial (View Only, Screenshot)
Search: "basketball shooting form" or "NBA free throw"
- https://www.gettyimages.com/search/2/image?phrase=basketball%20shooting%20form

### 2. Google Images (With Usage Rights)
- Go to Google Images
- Search: "basketball player shooting jump shot"
- Click Tools → Usage Rights → Creative Commons licenses
- https://www.google.com/search?q=basketball+player+shooting&tbm=isch&tbs=il:cl

### 3. YouTube Frame Extraction (Best Quality)

**Top Channels for Shooting Form:**

1. **ShotMechanics** - Pure shooting tutorials
   - https://www.youtube.com/c/ShotMechanics
   - Video: "Perfect Shooting Form" - pause at each phase

2. **By Any Means Basketball** - Form breakdowns
   - https://www.youtube.com/c/ByAnyMeansBasketball

3. **ILoveBasketballTV** - Shooting drills
   - https://www.youtube.com/c/ILoveBasketballTV

4. **NBA Official Channel** - Slow motion replays
   - https://www.youtube.com/nba
   - Search: "slow motion three pointer"

**How to Extract Frames:**
1. Pause video at exact shooting phase
2. Take screenshot (Cmd+Shift+4 on Mac, Win+Shift+S on Windows)
3. Save to appropriate phase folder

### 4. Wikimedia Commons (Free to Use)
- https://commons.wikimedia.org/wiki/Category:Basketball_players_shooting

### 5. Unsplash (Free High-Quality)
- https://unsplash.com/s/photos/basketball-shooting
- Note: Most are action shots, need to find still moments

### 6. Pexels (Free)
- https://www.pexels.com/search/basketball%20player/

---

## 🎬 Best YouTube Videos for Frame Extraction

### For LOAD Phase:
- "Basketball Shooting Form - The Set Up" by ShotMechanics
- Pause when player has ball below chin, knees bent

### For SET Phase:
- "Perfect Basketball Shooting Form" (any tutorial)
- Pause when ball is at forehead level

### For RELEASE Phase:
- "Slow Motion NBA Shots" compilations
- Pause exact moment ball leaves hand

### For FOLLOW_THROUGH Phase:
- Same slow motion videos
- Pause when arms fully extended

---

## 📁 Where to Save Images

```
training_data/
└── raw/
    ├── load/           ← Ball below chin, preparing
    ├── set/            ← Ball at forehead, aiming
    ├── release/        ← Ball leaving hands
    └── follow_through/ ← Arms extended, ball gone
```

---

## ⚠️ Images to REJECT

❌ **DO NOT SAVE:**
- Player dunking (not shooting)
- Player passing the ball
- Player dribbling
- Multiple players overlapping
- Shot from behind (can't see form)
- Too zoomed out (can't see details)
- Heavy motion blur
- Player not in shooting motion
- Ball not visible at all
- Poor lighting (too dark/bright)

---

## 📊 Progress Tracker

As you collect, track your progress:

```
LOAD:          [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ]                      = ___/25

SET:           [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ]                      = ___/25

RELEASE:       [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ]                      = ___/25

FOLLOW_THROUGH:[ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] [ ] 
               [ ] [ ] [ ] [ ] [ ]                      = ___/25

TOTAL: ___/100
```

---

## 🏷️ Naming Convention

Use this format:
```
{phase}_{source}_{number}.jpg

Examples:
- load_youtube_001.jpg
- set_getty_012.jpg
- release_nba_003.jpg
- follow_through_unsplash_007.jpg
```

---

## ⏱️ Time Estimate

- ~2-3 minutes per quality image
- 100 images = 3-5 hours of focused work
- Recommend: 30 minutes/day for 1 week

---

## 🚀 Quick Start

1. Open YouTube and search "basketball shooting form tutorial"
2. Find a good video with clear, slow demonstrations
3. Pause at each phase and screenshot
4. Save to appropriate folder
5. Repeat until you have 25 per phase

**Best single video for all 4 phases:**
Search: "Perfect Basketball Shot in Slow Motion" - usually shows all phases clearly

---

## ✨ Pro Tips

1. **NBA slow motion compilations** are goldmines for release/follow-through
2. **Shooting tutorials** are best for load/set phases
3. **Multiple angles of same shot** counts as multiple training images
4. **Different players = better diversity** for the model
5. **Include left-handed shooters** (at least 10-15% of dataset)





