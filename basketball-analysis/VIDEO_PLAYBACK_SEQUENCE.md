# Enhanced Video Playback Sequence Documentation

## Overview

The basketball analysis results page now features a sophisticated 3-stage video playback sequence that automatically guides users through their shooting form analysis with professional-grade visual effects and interactive tutorials.

## Three-Stage Playback System

### Stage 1: Initial Full-Speed Playback
**Duration:** Full video length at normal speed  
**Purpose:** Provide an overview of the entire shooting motion

**Features:**
- Plays video at normal speed (1.0x) from start to finish
- Displays skeleton overlay showing body structure
- Shows keypoint markers at all joints
- Basketball detection overlay (if detected)
- **No annotation labels** during this stage for clean viewing
- Large timer display in upper right corner
- Phase indicator in bottom left corner
- Automatically proceeds to Stage 2 upon completion

**Visual Elements:**
- Yellow skeleton lines connecting joints
- Color-coded joint markers (green for arms, blue for legs)
- Player glow effect around body silhouette
- Smooth frame-by-frame playback

### Stage 2: Interactive Label Tutorial
**Duration:** Variable (depends on number of detected keypoints)  
**Purpose:** Educational walkthrough of each form measurement

**Sequence per Label:**
1. **Display Label** (2 seconds)
   - Shows the label text overlay
   - Pauses on release frame
   - Label appears with angle measurement and feedback

2. **Zoom to Label** (2 seconds)
   - Smooth zoom animation (2.5x scale)
   - Centers on the label for clear readability
   - Maintains skeleton and keypoint overlays

3. **Zoom Out** (0.8 seconds)
   - Quick transition back to full frame view
   - Smooth easing animation

4. **Zoom to Keypoint** (2 seconds)
   - Zooms into the corresponding body part (3.0x scale)
   - Spotlight effect highlights the specific joint
   - Glowing ring animation around keypoint

5. **Zoom Out** (0.8 seconds)
   - Returns to full frame view
   - Prepares for next label

6. **Next Label**
   - Hides current label
   - Moves to next keypoint in sequence
   - Repeats steps 1-5 for each detected label

**Analyzed Labels (in order):**
- ELBOW ANGLE (right or left elbow)
- KNEE BEND (right or left knee)
- SHOULDER (shoulder alignment)
- HIP ALIGN (hip alignment)

**Visual Enhancements:**
- Progress indicator showing which label is being analyzed
- Stage indicator: "STAGE 2: ANALYZING [LABEL NAME]"
- Spotlight effect with glowing ring during keypoint zoom
- Smooth CSS transitions for all zoom operations
- Only one label visible at a time for focused learning

### Stage 3: Slow-Motion Finale
**Duration:** Full video length at 0.25x speed  
**Purpose:** Final detailed review in slow motion

**Features:**
- Plays entire video at 0.25x speed (4x slower)
- Full skeleton overlay maintained
- All keypoint markers visible
- **No annotation labels** for clean viewing
- Emphasizes the fluidity and mechanics of the shot
- Automatically ends sequence upon completion

**Visual Elements:**
- Same skeleton and keypoint overlays as Stage 1
- Slow-motion playback allows frame-by-frame observation
- Timer shows actual playback time
- Phase indicator updates in real-time
- Stage indicator: "STAGE 3: SLOW MOTION REPLAY (0.25x)"

## Technical Implementation

### State Management

```typescript
// Sequence phase tracking
type SequencePhase = 
  | 'initial'              // Before playback starts
  | 'stage1_fullSpeed'     // Stage 1: Normal speed playback
  | 'stage2_labelTutorial' // Stage 2: Interactive tutorial
  | 'stage3_slowMo'        // Stage 3: Slow-motion replay
  | 'complete'             // Sequence finished

// Label tutorial step tracking
type LabelTutorialStep = 
  | 'showLabel'            // Display label text
  | 'zoomToLabel'          // Zoom into label
  | 'zoomOut'              // Zoom out to full frame
  | 'zoomToKeypoint'       // Zoom into body part
  | 'zoomOutFromKeypoint'  // Zoom out from body part
```

### Key Components

#### 1. VideoModeContent Component
- Main container for video playback
- Manages sequence state and transitions
- Controls overlay toggles for each stage
- Handles zoom targets and spotlight effects

#### 2. VideoFrameCanvas Component
- Renders video frames with overlays
- Draws skeleton, keypoints, and annotations
- Implements zoom transformations
- Applies spotlight effects
- Filters labels based on stage (single label in Stage 2)

#### 3. Sequence Controller (useEffect)
- Orchestrates the three-stage flow
- Manages timing for each tutorial step
- Handles automatic transitions between stages
- Controls label visibility and zoom targets

### Playback Speed Control

```typescript
// Stage 1: Normal speed
playbackSpeed = fps // e.g., 10 fps

// Stage 2: Paused on release frame
// (no playback during tutorial)

// Stage 3: Slow motion
playbackSpeed = fps * 4 // 0.25x speed (e.g., 2.5 fps)
```

### Zoom Implementation

Zoom is achieved using CSS transforms:

```typescript
// Zoom target structure
{
  x: number,        // X coordinate to center on
  y: number,        // Y coordinate to center on
  scale: number     // Zoom level (1.0 = normal, 2.5 = 2.5x, 3.0 = 3x)
}

// Applied as CSS transform
transform: `scale(${scale})`
transformOrigin: `${(x / 640) * 100}% ${(y / 480) * 100}%`
transition: 'transform 0.8s ease-in-out'
```

### Spotlight Effect

The spotlight effect in Stage 2 creates a focused attention area:

```typescript
// Spotlight target structure
{
  x: number,  // X coordinate of spotlight center
  y: number   // Y coordinate of spotlight center
}

// Rendered as:
// - Radial gradient overlay (dark outside, clear inside)
// - Glowing ring around spotlight area
// - Inner ring for depth effect
```

## User Experience Flow

1. **User arrives at results page** → Video shows release frame with play button overlay
2. **User clicks "Start 3-Stage Analysis"** → Stage 1 begins
3. **Stage 1 completes** → Automatic transition to Stage 2
4. **Stage 2 cycles through all labels** → Each label gets full tutorial sequence
5. **All labels complete** → Automatic transition to Stage 3
6. **Stage 3 completes** → Sequence ends, user can manually scrub video

## Visual Indicators

### Stage Indicators
- **Stage 1:** Gold pulsing dot + "STAGE 1: FULL SPEED PLAYBACK"
- **Stage 2:** Green pulsing dot + "STAGE 2: ANALYZING [LABEL]" + progress bar
- **Stage 3:** Orange pulsing dot + "STAGE 3: SLOW MOTION REPLAY (0.25x)"

### Progress Bar (Stage 2)
Shows which label is currently being analyzed:
- Completed labels: Solid green
- Current label: 50% opacity green
- Upcoming labels: Dark gray

## Customization Options

### Timing Adjustments

```typescript
// In the sequence controller useEffect:

// Label display duration
setTimeout(() => setLabelTutorialStep('zoomToLabel'), 2000) // Change 2000ms

// Zoom hold duration
setTimeout(() => setLabelTutorialStep('zoomOut'), 2000) // Change 2000ms

// Transition duration
setTimeout(() => setLabelTutorialStep('zoomToKeypoint'), 800) // Change 800ms
```

### Zoom Levels

```typescript
// Label zoom
setZoomTarget({ x, y, scale: 2.5 }) // Adjust scale value

// Keypoint zoom
setZoomTarget({ x, y, scale: 3.0 }) // Adjust scale value
```

### Slow-Motion Speed

```typescript
// In the auto-play useEffect:
playbackSpeed = fps * 4 // Change multiplier (4 = 0.25x, 2 = 0.5x, etc.)
```

## Overlay Toggles

Each stage automatically configures overlay visibility:

```typescript
// Stage 1 & 3: Clean view
{
  skeleton: true,
  joints: true,
  annotations: false,  // No labels
  basketball: true
}

// Stage 2: Tutorial mode
{
  skeleton: true,
  joints: true,
  annotations: true,   // Labels enabled
  basketball: true
}
```

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support
- **Mobile browsers:** Supported (may need fullscreen for best experience)

## Performance Considerations

- Video frames are pre-rendered as base64 images
- Canvas rendering is optimized with requestAnimationFrame
- Smooth transitions use CSS transforms (GPU-accelerated)
- Timeouts are properly cleaned up on unmount
- No memory leaks from interval/timeout management

## Future Enhancements

Potential improvements for future versions:

1. **Configurable Tutorial**
   - Allow users to skip Stage 2
   - Option to replay specific labels
   - Adjustable playback speeds

2. **Voice Narration**
   - Audio commentary during Stage 2
   - Explain each measurement and its importance

3. **Comparison Mode**
   - Side-by-side with elite shooter
   - Synchronized playback

4. **Export Options**
   - Save annotated video
   - Export tutorial as MP4
   - Share on social media

5. **Interactive Controls**
   - Pause during any stage
   - Skip to specific stage
   - Adjust zoom levels manually

## Troubleshooting

### Issue: Video doesn't start
- **Solution:** Ensure video data is loaded (`videoData.annotatedFramesBase64` exists)
- **Check:** Browser console for errors

### Issue: Zoom is too fast/slow
- **Solution:** Adjust CSS transition duration in zoom target style
- **Location:** `src/app/results/demo/page.tsx` line ~2679

### Issue: Labels don't appear in Stage 2
- **Solution:** Verify `overlayToggles.annotations` is true during Stage 2
- **Check:** Sequence controller useEffect

### Issue: Slow-motion is too slow/fast
- **Solution:** Adjust playback speed multiplier
- **Location:** Auto-play useEffect, `playbackSpeed = fps * 4`

## Code Locations

- **Main Component:** `src/app/results/demo/page.tsx` (VideoModeContent function)
- **Canvas Renderer:** `src/app/results/demo/page.tsx` (VideoFrameCanvas function)
- **Sequence Controller:** Lines 2472-2564 (Enhanced 3-stage video sequence controller)
- **Auto-Play Logic:** Lines 2567-2601 (Enhanced auto-play with stage speeds)
- **Play Button:** Lines 2716-2735 (Start 3-Stage Analysis button)

## Testing Checklist

- [ ] Stage 1 plays at normal speed with skeleton overlay
- [ ] Stage 1 has no annotation labels visible
- [ ] Stage 1 automatically transitions to Stage 2 on completion
- [ ] Stage 2 pauses on release frame
- [ ] Stage 2 shows one label at a time
- [ ] Stage 2 zoom to label works smoothly
- [ ] Stage 2 zoom to keypoint works with spotlight
- [ ] Stage 2 cycles through all detected labels
- [ ] Stage 2 automatically transitions to Stage 3
- [ ] Stage 3 plays at 0.25x speed
- [ ] Stage 3 has no annotation labels visible
- [ ] Stage 3 maintains skeleton overlay
- [ ] All transitions are smooth and automatic
- [ ] Stage indicators update correctly
- [ ] Progress bar shows correct label progress
- [ ] Manual scrubbing works after sequence completes









