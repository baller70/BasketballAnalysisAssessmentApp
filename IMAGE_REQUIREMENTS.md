# CRITICAL: Image Requirements for Basketball Shooting Form Analysis App

## User's Exact Specification (MUST BE FOLLOWED WORD-FOR-WORD)

**"an image featuring a single basketball player, captured from head to toe, focusing solely on their shooting form. The player should be the main object in the frame, with no other players or distractions, except in cases where other players are present in the scene; in such cases, center the focus on the designated player for analysis. If the image is a game photo, ensure it depicts only a single player actively engaged in shooting the basketball, not dribbling or performing layups. The composition must highlight the player's shooting posture, stance, and arm mechanics, suitable for detailed analysis of shooting technique. This must be remembered and followed for the app to work the right way"**

---

## Detailed Requirements Breakdown

### ✅ REQUIRED ELEMENTS:

1. **Single Basketball Player**
   - ONE player must be the clear subject of analysis
   - Player must be identifiable as the main focus

2. **Head to Toe Capture**
   - Full body must be visible (from head to feet)
   - Complete skeletal structure needed for biomechanical analysis
   - No cropping of critical body parts (head, hands, feet)

3. **Shooting Form Focus**
   - Player actively engaged in shooting motion
   - Arms raised in shooting position
   - Ball visible in shooting hand(s)

4. **Player as Main Object**
   - Player must be the dominant visual element
   - Clearly centered or positioned as primary subject
   - Sufficient size/resolution for detailed analysis

5. **Shooting Posture Visible**
   - Body alignment clear
   - Stance visible (foot positioning, hip alignment)
   - Shooting mechanics observable

6. **Arm Mechanics Visible**
   - Elbow angle observable
   - Wrist position clear
   - Shoulder alignment visible
   - Release point identifiable

7. **Shooting Motion Only**
   - Active shooting motion (NOT dribbling)
   - NOT layup motion
   - NOT passing motion
   - NOT defensive stance

---

### ✅ ACCEPTABLE SCENARIOS:

#### Scenario 1: Solo Player (Ideal)
- Single player in frame
- No distractions or other people
- Clear background
- Practice or staged shooting form

#### Scenario 2: Game Photo with Clear Focus
- Other players may be present in background
- ONE designated player is clearly the focus
- Focus player is actively shooting
- Focus player is larger/more centered than others
- Background players do not obscure shooting form

#### Scenario 3: Multiple Players with One Shooter
- Multiple people in frame
- ONE player clearly shooting
- Other players NOT shooting simultaneously
- Shooting player is identifiable as main subject

---

### ❌ REJECT CRITERIA:

#### Motion Violations:
- ❌ Dribbling motion (ball below waist, arm extended downward)
- ❌ Layup motion (running toward basket, underhand shot)
- ❌ Passing motion (two hands on ball, chest pass position)
- ❌ Defensive stance (arms out, low crouch)
- ❌ Rebounding motion (jumping with arms up but no ball control)

#### Composition Violations:
- ❌ Multiple players shooting simultaneously (unclear focus)
- ❌ Partial body shots (missing head, feet, or hands)
- ❌ Cropped images cutting off critical body parts
- ❌ Back view where shooting form not visible
- ❌ Side view where arm mechanics obscured

#### Quality Violations:
- ❌ Blurry images where form details not observable
- ❌ Poor lighting where body positions unclear
- ❌ Extreme distance where player too small for analysis
- ❌ Obstruction by other players or objects

---

## Technical Detection Criteria

### MediaPipe Pose Detection Requirements:

1. **Detect All People in Frame**
   - Use MediaPipe to identify all human poses
   - Count total number of people detected

2. **Identify Main Subject**
   - Calculate bounding box size for each detected person
   - Identify largest person (by bounding box area)
   - Check if largest person is centered (x-coordinate near frame center)
   - Main subject = largest AND most centered person

3. **Verify Full Body Visible (Head to Toe)**
   - Check landmarks 0 (nose) and 10 (left_ankle) or 9 (right_ankle)
   - Verify visibility confidence > 0.5 for head and both feet
   - Reject if missing critical landmarks

4. **Verify Shooting Motion (Arms Raised)**
   - Calculate elbow angle: shoulder-elbow-wrist
   - Shooting motion: elbow angle > 90° (arm raised)
   - Dribbling motion: elbow angle < 90° (arm lowered)
   - Check wrist position relative to shoulder (wrist Y < shoulder Y = raised)

5. **Verify Ball Position (If Detectable)**
   - Ball should be above waist level (shooting)
   - Ball below waist = likely dribbling
   - Ball near chest with both hands = likely passing

6. **Verify NOT Layup Motion**
   - Check vertical velocity indicators
   - Layup: extreme lean, horizontal motion blur
   - Free throw/jump shot: vertical alignment, balanced stance

7. **Accept/Reject Decision**
   - ✅ Accept if:
     - Main subject clearly identified
     - Full body visible (head to toe)
     - Arms raised in shooting position
     - NOT dribbling, layup, or passing
   - ❌ Reject if:
     - No clear main subject
     - Multiple shooters (ambiguous focus)
     - Partial body visible
     - Dribbling/layup/passing motion detected

---

## Filter Logic Flow

```
1. Load Image
   ↓
2. Run MediaPipe Pose Detection
   ↓
3. Count People Detected
   ↓
4. IF 0 people detected → REJECT (no player found)
   ↓
5. IF 1 person detected:
   → Check full body visible (head + feet)
   → Check arms raised (shooting motion)
   → Accept if both true
   ↓
6. IF 2+ people detected:
   → Identify largest person (main subject)
   → Check if main subject centered
   → Check full body visible for main subject
   → Check arms raised for main subject
   → Check if other people are shooting (reject if yes)
   → Accept if main subject meets all criteria
   ↓
7. Final Check: Verify NOT dribbling/layup
   → Check ball position (if detectable)
   → Check arm angle (elbow > 90°)
   ↓
8. ACCEPT or REJECT with reason logged
```

---

## Dataset Cleaning Strategy

### Phase 1: Initial Scan (All 19,562 Images)
- Load each image
- Run MediaPipe pose detection
- Apply filter logic
- Categorize: KEEP or REJECT (with reason)

### Phase 2: Quarantine Rejected Images
- Move rejected images to `/training_data_quarantine/`
- Organize by rejection reason:
  - `no_people_detected/`
  - `multiple_shooters/`
  - `partial_body/`
  - `dribbling_motion/`
  - `layup_motion/`
  - `poor_quality/`

### Phase 3: Validate Kept Images
- Verify all kept images meet requirements
- Spot-check random sample (100 images)
- Manually review edge cases

### Phase 4: Generate Report
- Total images scanned
- Images kept vs rejected (with percentages)
- Breakdown by rejection reason
- Examples of each category
- Quality metrics

---

## Test Image Selection Criteria

### 5 Perfect Test Images Must Include:

1. **Image 1: Solo Player - Perfect Form (Free Throw)**
   - Single player, no background distractions
   - Perfect shooting form visible
   - Head to toe, centered in frame
   - High quality, clear lighting

2. **Image 2: Solo Player - Jump Shot**
   - Single player in mid-air
   - Shooting motion at release point
   - Full body visible, no cropping
   - Practice or training setting

3. **Image 3: Game Photo - Clear Focus on Shooter**
   - Other players in background
   - ONE shooter clearly identifiable as main subject
   - Shooter larger and more centered than others
   - Shooting form clearly visible despite background

4. **Image 4: Game Photo - Multiple People, One Shooting**
   - 3+ people in frame
   - ONE player clearly shooting
   - Others not shooting (defending, watching, etc.)
   - Shooting player is main focus

5. **Image 5: Practice Shot - Ideal Biomechanics**
   - Solo player or minimal background
   - Textbook shooting form
   - All angles clearly visible
   - Suitable for coaching analysis

---

## Quality Assurance Checklist

For each selected test image, verify:

- [ ] ✅ Single player as main subject (head to toe)
- [ ] ✅ Shooting motion clearly visible (arms raised)
- [ ] ✅ Posture visible (body alignment, stance)
- [ ] ✅ Arm mechanics visible (elbow, wrist, shoulder)
- [ ] ✅ NOT dribbling (ball above waist, arms raised)
- [ ] ✅ NOT layup (vertical alignment, not running)
- [ ] ✅ High quality (clear, well-lit, sufficient resolution)
- [ ] ✅ Suitable for detailed analysis (no obstructions)
- [ ] ✅ Full body visible (no cropping of critical parts)
- [ ] ✅ MediaPipe can detect all landmarks

---

## Success Metrics

### Dataset Cleaning:
- **Target**: Keep 30-50% of images (5,868 - 9,781 images)
- **Reason**: Strict requirements will reject many images
- **Quality over Quantity**: Better to have fewer high-quality images

### Test Image Selection:
- **Target**: 5 images, 100% meeting all requirements
- **Validation**: Manual review + MediaPipe verification
- **Diversity**: Mix of solo/game, male/female, different angles

### Output Quality:
- **Skeleton Overlays**: All landmarks visible and accurate
- **Angle Measurements**: Elbow, knee, release angle calculated
- **Form Assessment**: Coaching feedback generated
- **Comparison Images**: Side-by-side original and annotated

---

## Implementation Notes

### Smart Filter vs Previous Filter:

**Previous Filter (Too Strict):**
- Rejected ANY image with multiple people
- Result: Many good game photos rejected
- Issue: User wants game photos with clear focus accepted

**New Smart Filter (User-Aligned):**
- Accepts multiple people IF one is clearly the main shooting subject
- Identifies main subject by size and position
- Verifies main subject is shooting, not dribbling/layup
- Result: More realistic dataset, includes game scenarios

### Key Difference:
- Old: "Only one person in entire frame"
- New: "Only one person shooting, as the main focus"

This aligns with user's specification: **"except in cases where other players are present in the scene; in such cases, center the focus on the designated player for analysis"**

---

## Contact and Updates

**Last Updated**: December 13, 2025  
**Specification Source**: User directive (exact wording preserved)  
**Implementation**: Smart filter with MediaPipe pose detection  
**Dataset**: /home/ubuntu/basketball_app/training_data/ (19,562 images)

---

## Appendix: User's Exact Words (For Reference)

This specification is derived from the user's exact requirement:

> "an image featuring a single basketball player, captured from head to toe, focusing solely on their shooting form. The player should be the main object in the frame, with no other players or distractions, except in cases where other players are present in the scene; in such cases, center the focus on the designated player for analysis. If the image is a game photo, ensure it depicts only a single player actively engaged in shooting the basketball, not dribbling or performing layups. The composition must highlight the player's shooting posture, stance, and arm mechanics, suitable for detailed analysis of shooting technique. This must be remembered and followed for the app to work the right way"

**Critical Keywords:**
- "single basketball player" (but allows others in background)
- "head to toe" (full body required)
- "shooting form" (not dribbling, not layups)
- "main object in the frame" (clear focus)
- "center the focus on the designated player" (main subject identification)
- "shooting posture, stance, and arm mechanics" (biomechanical analysis)

**This document must be referenced for all image filtering and selection decisions.**
