/**
 * @file shootingFlawsDatabase.ts
 * @description Database of shooting flaws with detection rules and coaching feedback
 * 
 * PURPOSE:
 * - Defines all detectable shooting form flaws
 * - Maps angle measurements to flaw detection
 * - Provides cause-and-effect relationships for flaws
 * - Generates coaching feedback for each flaw
 * - Calculates shooter level based on form quality
 * 
 * FLAW STRUCTURE:
 * - Primary Flaw: The root cause detected
 * - Secondary Effects: What this flaw causes
 * - Tertiary Effects: What the secondary effects cause
 * - Symptoms: What you'll see in the shot result
 * - Fix Priority: What to fix first
 * 
 * MAIN FUNCTIONS:
 * - detectFlawsFromAngles(angles) - Detect flaws from measured angles
 * - generateCoachingFeedback(flaws) - Generate coaching text
 * - getShooterLevel(score) - Get skill level from score
 * - getCombinedFlawEffect(flaws) - Calculate combined flaw impact
 * 
 * EXPORTS:
 * - SHOOTING_FLAWS - All flaw definitions
 * - ShootingFlaw interface - Type definition
 * - SHOOTER_LEVELS - Level definitions (Elite, Advanced, etc.)
 * 
 * USED BY:
 * - src/app/page.tsx - Flaw detection during analysis
 * - src/app/results/demo/page.tsx - Displaying detected flaws
 * - src/services/coachingInsights.ts - Generating feedback
 */

// ============================================
// TYPES
// ============================================

export interface FlawEffect {
  effect: string
  explanation: string
  severity: 'minor' | 'moderate' | 'major'
}

export interface ShootingFlaw {
  id: string
  name: string
  detection: {
    metric: string
    condition: string
    threshold: number | string
  }
  description: string
  causeChain: FlawEffect[]
  symptoms: string[]
  fixes: string[]
  drills: string[]
  priority: number // 1-10, higher = fix first
  relatedFlaws: string[] // IDs of flaws this commonly appears with
}

export interface FlawCombination {
  flawIds: string[]
  combinedEffect: string
  overallImpact: string
  primaryFix: string
}

// ============================================
// PRIMARY FLAWS DATABASE (50+ entries)
// ============================================

export const SHOOTING_FLAWS: ShootingFlaw[] = [
  
  // ============================================
  // ELBOW FLAWS (1-10)
  // ============================================
  
  {
    id: "ELBOW_FLARE",
    name: "Elbow Flare",
    detection: {
      metric: "elbow_angle_horizontal",
      condition: "greater_than",
      threshold: 15
    },
    description: "Shooting elbow points outward instead of toward the basket",
    causeChain: [
      {
        effect: "Ball releases sideways",
        explanation: "When elbow is out, the ball comes off the hand at an angle instead of straight",
        severity: "major"
      },
      {
        effect: "Inconsistent follow-through direction",
        explanation: "Follow-through points left or right instead of at the rim",
        severity: "major"
      },
      {
        effect: "Guide hand interference",
        explanation: "Elbow flare often causes guide hand to push to compensate for direction",
        severity: "moderate"
      },
      {
        effect: "Reduced backspin",
        explanation: "Ball comes off side of fingers, reducing clean backspin",
        severity: "moderate"
      },
      {
        effect: "Left-right misses",
        explanation: "Shots consistently miss left or right of target",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots miss left (for right-handed shooters) or right (for left-handed)",
      "Ball has sidespin instead of backspin",
      "Follow-through points away from basket",
      "Inconsistent accuracy even with good arc"
    ],
    fixes: [
      "Practice with elbow against a wall to feel proper alignment",
      "Use a shooting strap to keep elbow in",
      "Focus on 'elbow under the ball' cue",
      "Film from behind to see elbow position"
    ],
    drills: [
      "Wall elbow drill - shoot with back to wall",
      "One-hand form shooting - focus on elbow alignment",
      "Lying down shooting - elbow naturally tucks"
    ],
    priority: 9,
    relatedFlaws: ["GUIDE_HAND_PUSH", "INCONSISTENT_RELEASE", "WRIST_TURN"]
  },

  {
    id: "ELBOW_TOO_LOW",
    name: "Low Elbow Set Point",
    detection: {
      metric: "elbow_height_relative",
      condition: "less_than",
      threshold: "shoulder_level"
    },
    description: "Elbow drops below shoulder level at set point",
    causeChain: [
      {
        effect: "Longer shooting motion",
        explanation: "Ball has to travel further, making shot slower and more blockable",
        severity: "moderate"
      },
      {
        effect: "More arm strength required",
        explanation: "Less leg power transfers to shot, requiring more arm push",
        severity: "moderate"
      },
      {
        effect: "Lower release point",
        explanation: "Shot releases at lower height, easier to contest",
        severity: "major"
      },
      {
        effect: "Flat shot trajectory",
        explanation: "Pushing up from low position often creates flat arc",
        severity: "major"
      },
      {
        effect: "Front rim misses",
        explanation: "Flat shots hit front of rim more frequently",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots frequently hit front rim",
      "Shot is easily blocked",
      "Fatigue affects shooting late in games",
      "Arc is flat and hard"
    ],
    fixes: [
      "Raise set point to forehead or above",
      "Practice 'load high' cue",
      "Use legs more to reduce arm strain"
    ],
    drills: [
      "High release drill - touch ceiling/backboard before shooting",
      "Chair shooting - forces higher set point"
    ],
    priority: 7,
    relatedFlaws: ["FLAT_SHOT", "INSUFFICIENT_LEG_DRIVE", "SLOW_RELEASE"]
  },

  {
    id: "ELBOW_ANGLE_ACUTE",
    name: "Elbow Too Bent (Acute Angle)",
    detection: {
      metric: "elbow_angle",
      condition: "less_than",
      threshold: 70
    },
    description: "Elbow angle is less than 70° at set point (too bent)",
    causeChain: [
      {
        effect: "Catapult motion",
        explanation: "Shot becomes a push/catapult rather than a smooth release",
        severity: "major"
      },
      {
        effect: "Loss of touch",
        explanation: "Hard to control distance with extreme angles",
        severity: "major"
      },
      {
        effect: "Inconsistent power",
        explanation: "Small changes in extension create big power differences",
        severity: "moderate"
      },
      {
        effect: "Long/short misses",
        explanation: "Shots are either way long or way short",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots are either airballs or hit backboard hard",
      "No consistent distance control",
      "Shot looks 'pushed' rather than flicked"
    ],
    fixes: [
      "Set ball higher before shooting",
      "Create more space between ball and shoulder",
      "Practice 'L-shape' elbow position"
    ],
    drills: [
      "Mirror work focusing on 90° elbow",
      "Slow motion form shooting"
    ],
    priority: 8,
    relatedFlaws: ["PUSHING_SHOT", "DISTANCE_CONTROL_POOR"]
  },

  {
    id: "ELBOW_ANGLE_OBTUSE",
    name: "Elbow Too Straight (Obtuse Angle)",
    detection: {
      metric: "elbow_angle",
      condition: "greater_than",
      threshold: 110
    },
    description: "Elbow angle is greater than 110° at set point (too straight)",
    causeChain: [
      {
        effect: "No power reserve",
        explanation: "Arm is already extended, no room to generate power",
        severity: "major"
      },
      {
        effect: "Arm-only shot",
        explanation: "Forces shooter to use only wrist/forearm for power",
        severity: "moderate"
      },
      {
        effect: "Short shots",
        explanation: "Insufficient extension range leads to short misses",
        severity: "major"
      },
      {
        effect: "Fatigue issues",
        explanation: "Wrist/forearm tire quickly without full arm involvement",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots consistently fall short",
      "Arm fatigue during games",
      "Shot looks like a 'push' from chest"
    ],
    fixes: [
      "Bend elbow more at set point",
      "Create 90° L-shape",
      "Load ball closer to shoulder"
    ],
    drills: [
      "Close-range form shooting with focus on elbow bend",
      "Partner-assisted set point positioning"
    ],
    priority: 7,
    relatedFlaws: ["SHORT_SHOTS", "ARM_FATIGUE", "WRIST_ONLY_SHOT"]
  },

  // ============================================
  // GUIDE HAND FLAWS (11-18)
  // ============================================

  {
    id: "GUIDE_HAND_PUSH",
    name: "Guide Hand Push (Thumbing)",
    detection: {
      metric: "guide_hand_movement",
      condition: "forward_motion",
      threshold: "any"
    },
    description: "Guide hand pushes or 'thumbs' the ball during release",
    causeChain: [
      {
        effect: "Two-hand shot",
        explanation: "Shot becomes a two-handed push instead of one-hand release",
        severity: "major"
      },
      {
        effect: "Sidespin on ball",
        explanation: "Guide hand adds unwanted rotation, ball spins sideways",
        severity: "major"
      },
      {
        effect: "Inconsistent direction",
        explanation: "Amount of thumb push varies, causing left-right variance",
        severity: "major"
      },
      {
        effect: "Reduced arc",
        explanation: "Pushing flattens the shot trajectory",
        severity: "moderate"
      },
      {
        effect: "Rim rejection",
        explanation: "Sidespin causes ball to bounce off rim unpredictably",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Ball has visible sidespin",
      "Shots kick off rim sideways",
      "Inconsistent accuracy despite good form elsewhere",
      "Thumb visibly pushes at release"
    ],
    fixes: [
      "Guide hand should fall away at release",
      "Practice one-hand shooting to isolate shooting hand",
      "Focus on 'guide hand is just for balance'",
      "Thumb should point up, not forward at release"
    ],
    drills: [
      "One-hand form shooting (no guide hand)",
      "Guide hand release drill - hand falls to side",
      "Slow motion release focusing on hand separation"
    ],
    priority: 9,
    relatedFlaws: ["ELBOW_FLARE", "SIDESPIN", "INCONSISTENT_ACCURACY"]
  },

  {
    id: "GUIDE_HAND_LATE_RELEASE",
    name: "Guide Hand Stays Too Long",
    detection: {
      metric: "guide_hand_separation_timing",
      condition: "late",
      threshold: "after_release"
    },
    description: "Guide hand doesn't separate from ball before release",
    causeChain: [
      {
        effect: "Blocked release",
        explanation: "Guide hand interferes with clean ball release",
        severity: "moderate"
      },
      {
        effect: "Altered spin axis",
        explanation: "Ball comes off both hands, creating unpredictable spin",
        severity: "major"
      },
      {
        effect: "Reduced wrist snap",
        explanation: "Can't fully snap wrist with guide hand in the way",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Ball wobbles in flight",
      "Inconsistent backspin",
      "Shot feels 'stuck' at release"
    ],
    fixes: [
      "Guide hand separates BEFORE ball leaves shooting hand",
      "Think 'guide hand opens like a door'",
      "Practice hand separation timing"
    ],
    drills: [
      "Exaggerated guide hand release - throw it away",
      "Partner watches hand separation"
    ],
    priority: 6,
    relatedFlaws: ["GUIDE_HAND_PUSH", "WOBBLE_SHOT", "POOR_BACKSPIN"]
  },

  {
    id: "GUIDE_HAND_UNDER",
    name: "Guide Hand Under Ball",
    detection: {
      metric: "guide_hand_position",
      condition: "under",
      threshold: "ball_equator"
    },
    description: "Guide hand positioned under the ball instead of on the side",
    causeChain: [
      {
        effect: "Two-hand catapult",
        explanation: "Both hands push upward, creating catapult motion",
        severity: "major"
      },
      {
        effect: "No clean release",
        explanation: "Ball has to roll off both hands",
        severity: "major"
      },
      {
        effect: "Inconsistent power",
        explanation: "Two-hand push creates variable force application",
        severity: "major"
      },
      {
        effect: "Low release point",
        explanation: "Catapult motion typically releases lower",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shot looks like a 'chest pass' upward",
      "Very inconsistent distance",
      "Low release point",
      "Both hands visible pushing"
    ],
    fixes: [
      "Guide hand on SIDE of ball, not under",
      "Only fingertips of guide hand touch ball",
      "Shooting hand does ALL the work"
    ],
    drills: [
      "Ball balance drill - balance ball on shooting hand only",
      "Guide hand placement check before every shot"
    ],
    priority: 8,
    relatedFlaws: ["TWO_HAND_PUSH", "LOW_RELEASE", "CATAPULT_SHOT"]
  },

  // ============================================
  // LOWER BODY FLAWS (19-28)
  // ============================================

  {
    id: "INSUFFICIENT_KNEE_BEND",
    name: "Insufficient Knee Bend",
    detection: {
      metric: "knee_angle",
      condition: "greater_than",
      threshold: 160
    },
    description: "Knees are too straight, not generating leg power",
    causeChain: [
      {
        effect: "Arm-only shot",
        explanation: "Without leg drive, all power must come from arms",
        severity: "major"
      },
      {
        effect: "Inconsistent range",
        explanation: "Arm strength varies, leg power is more consistent",
        severity: "major"
      },
      {
        effect: "Fatigue on longer shots",
        explanation: "Arms tire faster than legs",
        severity: "moderate"
      },
      {
        effect: "Flat trajectory",
        explanation: "Pushing with arms creates flatter shot",
        severity: "moderate"
      },
      {
        effect: "Short on deep shots",
        explanation: "Not enough power for three-pointers",
        severity: "major"
      }
    ],
    symptoms: [
      "Three-pointers consistently short",
      "Arm fatigue late in games",
      "Shot looks stiff and mechanical",
      "No rhythm in shooting motion"
    ],
    fixes: [
      "Bend knees 45-55° before shooting",
      "Feel 'coiled spring' in legs",
      "Shot power comes from ground up",
      "Dip on the catch"
    ],
    drills: [
      "Wall sits before shooting practice",
      "Jump stop into shot",
      "Catch and shoot with exaggerated dip"
    ],
    priority: 8,
    relatedFlaws: ["ARM_ONLY_SHOT", "FLAT_SHOT", "SHORT_ON_THREES"]
  },

  {
    id: "EXCESSIVE_KNEE_BEND",
    name: "Excessive Knee Bend",
    detection: {
      metric: "knee_angle",
      condition: "less_than",
      threshold: 100
    },
    description: "Knees bend too much, wasting energy",
    causeChain: [
      {
        effect: "Slow release",
        explanation: "Takes longer to rise from deep squat",
        severity: "moderate"
      },
      {
        effect: "Energy leakage",
        explanation: "Power dissipates before reaching upper body",
        severity: "moderate"
      },
      {
        effect: "Balance issues",
        explanation: "Deep squat harder to maintain balance",
        severity: "moderate"
      },
      {
        effect: "Timing disruption",
        explanation: "Long motion creates timing inconsistency",
        severity: "major"
      }
    ],
    symptoms: [
      "Shot is easily contested",
      "Feels like 'loading up' too much",
      "Timing varies shot to shot",
      "Legs feel tired quickly"
    ],
    fixes: [
      "Quick, efficient dip - not deep squat",
      "Knee bend should be athletic, not extreme",
      "Focus on quick release"
    ],
    drills: [
      "Rapid fire shooting - no time for deep squat",
      "Catch and shoot off screens"
    ],
    priority: 5,
    relatedFlaws: ["SLOW_RELEASE", "BALANCE_ISSUES", "TIMING_PROBLEMS"]
  },

  {
    id: "JUMPING_FORWARD",
    name: "Jumping Forward",
    detection: {
      metric: "landing_position",
      condition: "forward_of",
      threshold: "12_inches"
    },
    description: "Shooter lands significantly forward of takeoff position",
    causeChain: [
      {
        effect: "Momentum affects shot",
        explanation: "Forward motion transfers to ball, affecting trajectory",
        severity: "major"
      },
      {
        effect: "Inconsistent release point",
        explanation: "Body position varies based on jump distance",
        severity: "major"
      },
      {
        effect: "Flat shot",
        explanation: "Forward momentum flattens arc",
        severity: "moderate"
      },
      {
        effect: "Balance at release",
        explanation: "Hard to maintain balance while moving forward",
        severity: "moderate"
      },
      {
        effect: "Long misses",
        explanation: "Extra momentum adds distance to shot",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots often long",
      "Landing far from takeoff spot",
      "Shot feels 'rushed' or 'pushed'",
      "Inconsistent accuracy"
    ],
    fixes: [
      "Jump straight up, land in same spot",
      "'Sweep and sway' technique - slight backward lean",
      "Focus on vertical jump, not forward"
    ],
    drills: [
      "Tape on floor - land on same spot",
      "Wall in front - prevents forward jump",
      "Balance beam shooting"
    ],
    priority: 7,
    relatedFlaws: ["FLAT_SHOT", "LONG_MISSES", "BALANCE_ISSUES"]
  },

  {
    id: "FEET_NOT_SET",
    name: "Feet Not Set Before Shot",
    detection: {
      metric: "foot_stability",
      condition: "moving",
      threshold: "at_release"
    },
    description: "Feet are still moving when shot begins",
    causeChain: [
      {
        effect: "No stable base",
        explanation: "Can't generate consistent power without stable foundation",
        severity: "major"
      },
      {
        effect: "Balance issues",
        explanation: "Moving feet create balance problems",
        severity: "major"
      },
      {
        effect: "Inconsistent alignment",
        explanation: "Body alignment varies shot to shot",
        severity: "major"
      },
      {
        effect: "Random misses",
        explanation: "Shots miss in all directions",
        severity: "major"
      }
    ],
    symptoms: [
      "Misses in random directions",
      "Shot feels 'off' but can't identify why",
      "Feet shuffling during shot",
      "Different stance every shot"
    ],
    fixes: [
      "1-2 step footwork into shot",
      "Feet set BEFORE ball reaches set point",
      "Consistent stance width (shoulder width)"
    ],
    drills: [
      "Catch and hold - freeze feet before shooting",
      "Footwork ladder into shots",
      "Partner calls 'set' when feet are ready"
    ],
    priority: 8,
    relatedFlaws: ["BALANCE_ISSUES", "INCONSISTENT_STANCE", "RANDOM_MISSES"]
  },

  {
    id: "NARROW_STANCE",
    name: "Stance Too Narrow",
    detection: {
      metric: "stance_width",
      condition: "less_than",
      threshold: "shoulder_width_minus_4"
    },
    description: "Feet are too close together",
    causeChain: [
      {
        effect: "Poor balance",
        explanation: "Narrow base provides less stability",
        severity: "moderate"
      },
      {
        effect: "Less leg power",
        explanation: "Can't generate as much force from narrow stance",
        severity: "moderate"
      },
      {
        effect: "Swaying",
        explanation: "Body sways side to side during shot",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Feeling unstable during shot",
      "Body sways",
      "Weak three-point shot"
    ],
    fixes: [
      "Feet shoulder-width apart",
      "Athletic stance",
      "Feel grounded and stable"
    ],
    drills: [
      "Stance check before every shot",
      "Tape marks for foot placement"
    ],
    priority: 4,
    relatedFlaws: ["BALANCE_ISSUES", "WEAK_RANGE"]
  },

  {
    id: "WIDE_STANCE",
    name: "Stance Too Wide",
    detection: {
      metric: "stance_width",
      condition: "greater_than",
      threshold: "shoulder_width_plus_8"
    },
    description: "Feet are too far apart",
    causeChain: [
      {
        effect: "Restricted hip movement",
        explanation: "Wide stance limits hip rotation and power transfer",
        severity: "moderate"
      },
      {
        effect: "Lower center of gravity",
        explanation: "Harder to elevate on jump shot",
        severity: "moderate"
      },
      {
        effect: "Slow release",
        explanation: "Takes longer to gather from wide stance",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shot feels 'stuck' in legs",
      "Low jump on shot",
      "Slow release"
    ],
    fixes: [
      "Feet shoulder-width apart",
      "Quick, athletic stance",
      "Feel ready to move"
    ],
    drills: [
      "Jump rope before shooting - promotes athletic stance",
      "Catch and shoot quickly"
    ],
    priority: 3,
    relatedFlaws: ["SLOW_RELEASE", "LOW_JUMP"]
  },

  // ============================================
  // RELEASE FLAWS (29-38)
  // ============================================

  {
    id: "FLAT_SHOT",
    name: "Flat Shot (Low Arc)",
    detection: {
      metric: "release_angle",
      condition: "less_than",
      threshold: 42
    },
    description: "Ball trajectory is too flat, less than 42°",
    causeChain: [
      {
        effect: "Smaller target window",
        explanation: "Flat angle means ball sees less of the rim opening",
        severity: "major"
      },
      {
        effect: "Front rim misses",
        explanation: "Flat shots hit front of rim frequently",
        severity: "major"
      },
      {
        effect: "Hard bounces",
        explanation: "Ball bounces hard off rim instead of soft",
        severity: "moderate"
      },
      {
        effect: "No 'shooter's bounce'",
        explanation: "Flat shots don't get friendly bounces in",
        severity: "moderate"
      },
      {
        effect: "Lower percentage",
        explanation: "Physics shows flat shots have lower make probability",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots hit front rim often",
      "Ball bounces hard off rim",
      "Rarely get 'lucky' bounces",
      "Shot looks like a line drive"
    ],
    fixes: [
      "Aim higher - 'shoot over the rim'",
      "Higher release point",
      "More wrist snap for arc",
      "Think 'rainbow' trajectory"
    ],
    drills: [
      "Rope above rim - must clear rope",
      "Partner holds hand above rim as target",
      "Exaggerated arc shooting"
    ],
    priority: 8,
    relatedFlaws: ["LOW_RELEASE", "INSUFFICIENT_WRIST_SNAP", "FRONT_RIM_MISSES"]
  },

  {
    id: "HIGH_ARC_EXCESSIVE",
    name: "Excessive Arc",
    detection: {
      metric: "release_angle",
      condition: "greater_than",
      threshold: 62
    },
    description: "Ball trajectory is too high, greater than 62°",
    causeChain: [
      {
        effect: "Loss of power",
        explanation: "Too much energy goes up, not enough forward",
        severity: "moderate"
      },
      {
        effect: "Wind affected",
        explanation: "High arc shots are more affected by wind/air currents",
        severity: "minor"
      },
      {
        effect: "Depth control issues",
        explanation: "Hard to control distance with extreme arc",
        severity: "moderate"
      },
      {
        effect: "Short misses",
        explanation: "Ball drops short due to energy going up",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots often fall short",
      "Ball seems to 'die' in the air",
      "Arc looks like a 'moon ball'",
      "Three-pointers especially short"
    ],
    fixes: [
      "Slightly lower trajectory",
      "More forward push, less up",
      "Optimal arc is 52-55°"
    ],
    drills: [
      "Distance shooting - forces flatter arc",
      "Target practice at specific spots"
    ],
    priority: 5,
    relatedFlaws: ["SHORT_SHOTS", "DISTANCE_CONTROL_POOR"]
  },

  {
    id: "NO_WRIST_SNAP",
    name: "No Wrist Snap (Follow-Through)",
    detection: {
      metric: "wrist_extension",
      condition: "less_than",
      threshold: 45
    },
    description: "Wrist doesn't snap/flick at release",
    causeChain: [
      {
        effect: "No backspin",
        explanation: "Wrist snap creates backspin, without it ball has no rotation",
        severity: "major"
      },
      {
        effect: "Hard rim bounces",
        explanation: "No backspin means ball bounces hard off rim",
        severity: "major"
      },
      {
        effect: "Less control",
        explanation: "Wrist snap provides fine-tuned distance control",
        severity: "major"
      },
      {
        effect: "Arm-push shot",
        explanation: "Shot becomes a push rather than a flick",
        severity: "moderate"
      },
      {
        effect: "Inconsistent touch",
        explanation: "Can't develop soft touch without wrist action",
        severity: "major"
      }
    ],
    symptoms: [
      "Ball has no rotation or wrong rotation",
      "Shots clang hard off rim",
      "No 'touch' on shots",
      "Distance control is poor"
    ],
    fixes: [
      "Finish with 'gooseneck' - wrist fully flexed",
      "Fingers point down at finish",
      "Hold follow-through for 1 second",
      "Feel ball roll off fingertips"
    ],
    drills: [
      "Lying on back, shoot straight up - focus on wrist",
      "Wrist flicks against wall",
      "One-hand form shooting close range"
    ],
    priority: 9,
    relatedFlaws: ["NO_BACKSPIN", "HARD_BOUNCES", "POOR_TOUCH"]
  },

  {
    id: "EARLY_RELEASE",
    name: "Early Release (Before Peak)",
    detection: {
      metric: "release_timing",
      condition: "before",
      threshold: "jump_peak"
    },
    description: "Ball is released before reaching peak of jump",
    causeChain: [
      {
        effect: "Upward momentum affects shot",
        explanation: "Rising motion adds uncontrolled power to shot",
        severity: "moderate"
      },
      {
        effect: "Inconsistent power",
        explanation: "Release point varies based on jump timing",
        severity: "major"
      },
      {
        effect: "Long misses",
        explanation: "Upward momentum often makes shots long",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots often long",
      "Shot feels 'rushed'",
      "Release point varies"
    ],
    fixes: [
      "Release at peak of jump or on way down",
      "Pause at top before release",
      "'Hang time' before shooting"
    ],
    drills: [
      "Jump, pause, shoot drill",
      "Slow motion jump shots"
    ],
    priority: 6,
    relatedFlaws: ["LONG_MISSES", "RUSHED_SHOT", "TIMING_ISSUES"]
  },

  {
    id: "LATE_RELEASE",
    name: "Late Release (Falling)",
    detection: {
      metric: "release_timing",
      condition: "after",
      threshold: "significant_descent"
    },
    description: "Ball is released while falling significantly",
    causeChain: [
      {
        effect: "Downward momentum affects shot",
        explanation: "Falling motion pulls shot down",
        severity: "major"
      },
      {
        effect: "Short misses",
        explanation: "Downward motion reduces shot power",
        severity: "major"
      },
      {
        effect: "Flat trajectory",
        explanation: "Falling creates flatter shot",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots consistently short",
      "Shot feels 'heavy'",
      "Flat arc"
    ],
    fixes: [
      "Release at or just after peak",
      "Don't wait too long to shoot",
      "Quicker release"
    ],
    drills: [
      "Quick release drills",
      "Catch and shoot off pass"
    ],
    priority: 6,
    relatedFlaws: ["SHORT_MISSES", "FLAT_SHOT"]
  },

  {
    id: "LOW_RELEASE_POINT",
    name: "Low Release Point",
    detection: {
      metric: "release_height",
      condition: "below",
      threshold: "forehead"
    },
    description: "Ball is released below forehead level",
    causeChain: [
      {
        effect: "Easily blocked",
        explanation: "Lower release is easier for defenders to contest",
        severity: "major"
      },
      {
        effect: "Longer flight path",
        explanation: "Ball has to travel further to reach basket",
        severity: "moderate"
      },
      {
        effect: "Flatter trajectory",
        explanation: "Low release often creates flatter shot",
        severity: "moderate"
      },
      {
        effect: "More affected by defense",
        explanation: "Defender's hand can alter shot path",
        severity: "major"
      }
    ],
    symptoms: [
      "Shots get blocked frequently",
      "Struggle to shoot over defenders",
      "Shot looks 'pushed' from chest"
    ],
    fixes: [
      "Release above forehead",
      "High set point",
      "'Shoot over the defense'"
    ],
    drills: [
      "Partner with hand up - shoot over",
      "High release focus drills"
    ],
    priority: 7,
    relatedFlaws: ["FLAT_SHOT", "BLOCKED_SHOTS"]
  },

  // ============================================
  // BALANCE & ALIGNMENT FLAWS (39-45)
  // ============================================

  {
    id: "SHOULDER_TILT",
    name: "Shoulder Tilt (Uneven Shoulders)",
    detection: {
      metric: "shoulder_angle",
      condition: "greater_than",
      threshold: 8
    },
    description: "Shoulders are not level during shot",
    causeChain: [
      {
        effect: "Crooked shot line",
        explanation: "Tilted shoulders create angled release path",
        severity: "major"
      },
      {
        effect: "Inconsistent accuracy",
        explanation: "Tilt varies, causing directional misses",
        severity: "major"
      },
      {
        effect: "Compensation required",
        explanation: "Must adjust aim to account for tilt",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots miss left or right",
      "One shoulder visibly higher",
      "Accuracy varies day to day"
    ],
    fixes: [
      "Keep shoulders level and square",
      "Film from front to check alignment",
      "Mirror work"
    ],
    drills: [
      "Wall alignment checks",
      "Partner feedback on shoulders"
    ],
    priority: 6,
    relatedFlaws: ["DIRECTIONAL_MISSES", "ALIGNMENT_ISSUES"]
  },

  {
    id: "HIP_ROTATION",
    name: "Excessive Hip Rotation",
    detection: {
      metric: "hip_angle_to_basket",
      condition: "greater_than",
      threshold: 20
    },
    description: "Hips rotate away from basket during shot",
    causeChain: [
      {
        effect: "Upper body compensation",
        explanation: "Upper body must twist to aim at basket",
        severity: "moderate"
      },
      {
        effect: "Power leakage",
        explanation: "Energy goes into rotation instead of shot",
        severity: "moderate"
      },
      {
        effect: "Inconsistent alignment",
        explanation: "Rotation amount varies",
        severity: "major"
      }
    ],
    symptoms: [
      "Body twists during shot",
      "Inconsistent accuracy",
      "Shot feels 'torqued'"
    ],
    fixes: [
      "Hips face basket or slightly turned",
      "Stable lower body",
      "Power from legs, not rotation"
    ],
    drills: [
      "Feet placement drills",
      "Hip alignment checks"
    ],
    priority: 5,
    relatedFlaws: ["ALIGNMENT_ISSUES", "POWER_LEAKAGE"]
  },

  {
    id: "HEAD_MOVEMENT",
    name: "Head Movement During Shot",
    detection: {
      metric: "head_stability",
      condition: "movement",
      threshold: "during_release"
    },
    description: "Head moves during shooting motion",
    causeChain: [
      {
        effect: "Eyes off target",
        explanation: "Head movement takes eyes off rim",
        severity: "major"
      },
      {
        effect: "Balance disruption",
        explanation: "Head movement affects overall balance",
        severity: "moderate"
      },
      {
        effect: "Inconsistent aim",
        explanation: "Can't aim consistently with moving head",
        severity: "major"
      }
    ],
    symptoms: [
      "Looking away before release",
      "Head jerks during shot",
      "Random misses"
    ],
    fixes: [
      "Eyes on target throughout shot",
      "Head still until ball reaches rim",
      "'See the ball go in'"
    ],
    drills: [
      "Partner watches head stability",
      "Hold eye contact with rim"
    ],
    priority: 7,
    relatedFlaws: ["RANDOM_MISSES", "BALANCE_ISSUES"]
  },

  {
    id: "LEANING_BACK",
    name: "Leaning Back Excessively",
    detection: {
      metric: "torso_angle",
      condition: "greater_than",
      threshold: 15
    },
    description: "Upper body leans back too far during shot",
    causeChain: [
      {
        effect: "Loss of power",
        explanation: "Leaning back reduces power transfer from legs",
        severity: "moderate"
      },
      {
        effect: "Arc issues",
        explanation: "Lean can create too high or unpredictable arc",
        severity: "moderate"
      },
      {
        effect: "Balance problems",
        explanation: "Excessive lean makes balance difficult",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Falling backwards after shot",
      "Inconsistent arc",
      "Shot feels 'off balance'"
    ],
    fixes: [
      "Slight lean is okay (sweep and sway)",
      "Stay balanced through shot",
      "Land in control"
    ],
    drills: [
      "Balance beam shooting",
      "Land and hold drills"
    ],
    priority: 4,
    relatedFlaws: ["BALANCE_ISSUES", "ARC_ISSUES"]
  },

  {
    id: "LEANING_FORWARD",
    name: "Leaning Forward",
    detection: {
      metric: "torso_angle",
      condition: "less_than",
      threshold: -10
    },
    description: "Upper body leans forward during shot",
    causeChain: [
      {
        effect: "Momentum into shot",
        explanation: "Forward lean adds uncontrolled momentum",
        severity: "major"
      },
      {
        effect: "Long misses",
        explanation: "Forward momentum makes shots long",
        severity: "major"
      },
      {
        effect: "Flat trajectory",
        explanation: "Leaning forward flattens shot",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots consistently long",
      "Landing forward of takeoff",
      "Flat arc"
    ],
    fixes: [
      "Stay vertical or slight back lean",
      "Jump straight up",
      "Control momentum"
    ],
    drills: [
      "Wall behind - prevents forward lean",
      "Vertical jump focus"
    ],
    priority: 6,
    relatedFlaws: ["JUMPING_FORWARD", "LONG_MISSES", "FLAT_SHOT"]
  },

  // ============================================
  // RESULT-BASED FLAWS (46-50+)
  // ============================================

  {
    id: "CONSISTENT_LEFT_MISS",
    name: "Consistent Left Misses",
    detection: {
      metric: "miss_direction",
      condition: "pattern",
      threshold: "left_60_percent"
    },
    description: "Majority of misses go left of target",
    causeChain: [
      {
        effect: "Likely elbow flare (right-handed)",
        explanation: "Elbow out pushes ball left",
        severity: "major"
      },
      {
        effect: "Possible guide hand push",
        explanation: "Guide hand may be pushing ball left",
        severity: "major"
      },
      {
        effect: "Alignment issue",
        explanation: "Body may be aimed left of target",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots consistently miss left",
      "Even 'good' shots go left",
      "Adjusting aim right doesn't help"
    ],
    fixes: [
      "Check elbow alignment",
      "Check guide hand at release",
      "Film from behind to see alignment"
    ],
    drills: [
      "One-hand shooting to isolate issue",
      "Elbow alignment drills"
    ],
    priority: 8,
    relatedFlaws: ["ELBOW_FLARE", "GUIDE_HAND_PUSH"]
  },

  {
    id: "CONSISTENT_RIGHT_MISS",
    name: "Consistent Right Misses",
    detection: {
      metric: "miss_direction",
      condition: "pattern",
      threshold: "right_60_percent"
    },
    description: "Majority of misses go right of target",
    causeChain: [
      {
        effect: "Elbow tucked too tight (right-handed)",
        explanation: "Over-tucked elbow pushes ball right",
        severity: "major"
      },
      {
        effect: "Guide hand pulling away early",
        explanation: "Guide hand separating too early pulls ball right",
        severity: "moderate"
      },
      {
        effect: "Shoulder alignment right",
        explanation: "Shoulders may be aimed right",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots consistently miss right",
      "Feels like 'pushing' the ball",
      "Guide hand comes off too early"
    ],
    fixes: [
      "Natural elbow position - not forced",
      "Guide hand stays until release",
      "Check shoulder alignment"
    ],
    drills: [
      "Mirror work for alignment",
      "Guide hand timing drills"
    ],
    priority: 8,
    relatedFlaws: ["ELBOW_ANGLE_ACUTE", "GUIDE_HAND_EARLY"]
  },

  {
    id: "CONSISTENT_SHORT",
    name: "Consistent Short Misses",
    detection: {
      metric: "miss_distance",
      condition: "pattern",
      threshold: "short_60_percent"
    },
    description: "Majority of misses fall short of target",
    causeChain: [
      {
        effect: "Insufficient leg power",
        explanation: "Not using legs enough for power",
        severity: "major"
      },
      {
        effect: "Late release timing",
        explanation: "Releasing while falling reduces power",
        severity: "major"
      },
      {
        effect: "Excessive arc",
        explanation: "Too much energy going up, not forward",
        severity: "moderate"
      },
      {
        effect: "Arm fatigue",
        explanation: "Tired arms can't generate enough power",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots hit front rim",
      "Three-pointers especially short",
      "Worse late in games",
      "Shot feels 'weak'"
    ],
    fixes: [
      "Use legs more - power from ground up",
      "Release at peak of jump",
      "Slightly flatter arc for distance"
    ],
    drills: [
      "Leg drive emphasis drills",
      "Step-in three-pointers"
    ],
    priority: 8,
    relatedFlaws: ["INSUFFICIENT_KNEE_BEND", "LATE_RELEASE", "HIGH_ARC_EXCESSIVE"]
  },

  {
    id: "CONSISTENT_LONG",
    name: "Consistent Long Misses",
    detection: {
      metric: "miss_distance",
      condition: "pattern",
      threshold: "long_60_percent"
    },
    description: "Majority of misses go long (over the rim)",
    causeChain: [
      {
        effect: "Too much leg power",
        explanation: "Legs generating more power than needed",
        severity: "moderate"
      },
      {
        effect: "Early release timing",
        explanation: "Releasing while rising adds power",
        severity: "major"
      },
      {
        effect: "Forward momentum",
        explanation: "Jumping forward adds distance",
        severity: "major"
      },
      {
        effect: "Flat trajectory",
        explanation: "Flat shots carry further",
        severity: "moderate"
      }
    ],
    symptoms: [
      "Shots hit back rim or backboard",
      "Especially long on closer shots",
      "Shot feels 'strong'"
    ],
    fixes: [
      "Release at peak, not while rising",
      "Jump straight up",
      "Higher arc to control distance"
    ],
    drills: [
      "Soft touch drills",
      "Arc focus drills"
    ],
    priority: 7,
    relatedFlaws: ["EARLY_RELEASE", "JUMPING_FORWARD", "FLAT_SHOT"]
  },

  {
    id: "RANDOM_MISSES",
    name: "Random/Inconsistent Misses",
    detection: {
      metric: "miss_pattern",
      condition: "no_pattern",
      threshold: "all_directions"
    },
    description: "Misses go in all directions with no pattern",
    causeChain: [
      {
        effect: "Fundamental mechanics issues",
        explanation: "Multiple aspects of form are inconsistent",
        severity: "major"
      },
      {
        effect: "No muscle memory",
        explanation: "Shot is different every time",
        severity: "major"
      },
      {
        effect: "Multiple flaws compounding",
        explanation: "Several issues creating unpredictable results",
        severity: "major"
      }
    ],
    symptoms: [
      "Miss left, right, short, long randomly",
      "No consistent pattern",
      "Can't predict where miss will go"
    ],
    fixes: [
      "Return to fundamentals",
      "Rebuild shot from scratch",
      "Focus on one aspect at a time"
    ],
    drills: [
      "Form shooting close range",
      "One-hand shooting",
      "Video analysis to identify issues"
    ],
    priority: 10,
    relatedFlaws: ["MULTIPLE_FLAWS"]
  }
]

// ============================================
// FLAW COMBINATIONS - When multiple flaws combine
// ============================================

export const FLAW_COMBINATIONS: FlawCombination[] = [
  {
    flawIds: ["ELBOW_FLARE", "GUIDE_HAND_PUSH"],
    combinedEffect: "Severe directional inconsistency - ball has sidespin and releases at angle",
    overallImpact: "Shots will miss left (right-handed) with unpredictable bounces. Even made shots may rattle in.",
    primaryFix: "Fix elbow first - often guide hand push is compensation for elbow flare"
  },
  {
    flawIds: ["INSUFFICIENT_KNEE_BEND", "FLAT_SHOT"],
    combinedEffect: "Arm-only flat shot - no power from legs, pushing creates flat trajectory",
    overallImpact: "Short on deep shots, front rim misses, fatigue late in games",
    primaryFix: "Fix knee bend first - leg power naturally creates better arc"
  },
  {
    flawIds: ["LOW_RELEASE_POINT", "FLAT_SHOT"],
    combinedEffect: "Highly contestable flat shot - easy to block and hits front rim",
    overallImpact: "Blocked frequently, front rim misses, low percentage",
    primaryFix: "Raise release point - higher release naturally improves arc"
  },
  {
    flawIds: ["JUMPING_FORWARD", "EARLY_RELEASE"],
    combinedEffect: "Rushed forward shot - momentum and timing both add power",
    overallImpact: "Consistently long misses, especially on catch-and-shoot",
    primaryFix: "Fix footwork first - stable base allows proper timing"
  },
  {
    flawIds: ["NO_WRIST_SNAP", "GUIDE_HAND_PUSH"],
    combinedEffect: "Two-hand push shot - no touch, no spin, unpredictable",
    overallImpact: "No soft touch, hard rim bounces, inconsistent in all directions",
    primaryFix: "Isolate shooting hand - practice one-hand shooting to develop wrist snap"
  },
  {
    flawIds: ["ELBOW_FLARE", "SHOULDER_TILT"],
    combinedEffect: "Crooked shooting line - entire upper body misaligned",
    overallImpact: "Consistent directional misses, very hard to adjust",
    primaryFix: "Fix alignment from ground up - start with feet, then hips, shoulders, elbow"
  },
  {
    flawIds: ["INSUFFICIENT_KNEE_BEND", "ELBOW_ANGLE_OBTUSE"],
    combinedEffect: "Stiff push shot - no power source, arm already extended",
    overallImpact: "Weak shots, short on distance, arm fatigue",
    primaryFix: "Fix knee bend - leg power reduces need for arm extension"
  },
  {
    flawIds: ["FEET_NOT_SET", "HEAD_MOVEMENT"],
    combinedEffect: "No stable foundation - moving feet and head create chaos",
    overallImpact: "Random misses in all directions, no consistency",
    primaryFix: "Fix feet first - stable base allows head to stay still"
  },
  {
    flawIds: ["GUIDE_HAND_UNDER", "LOW_RELEASE_POINT"],
    combinedEffect: "Chest-push catapult - two hands pushing from low position",
    overallImpact: "Easily blocked, no arc, no touch",
    primaryFix: "Completely rebuild shot mechanics - this is a fundamental form issue"
  },
  {
    flawIds: ["EXCESSIVE_KNEE_BEND", "LATE_RELEASE"],
    combinedEffect: "Slow, labored shot - too much load, too late release",
    overallImpact: "Easily contested, short misses, timing issues",
    primaryFix: "Quicken the entire motion - less knee bend, earlier release"
  }
]

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get all flaws that could be caused by a primary flaw
 */
export function getRelatedFlaws(flawId: string): ShootingFlaw[] {
  const flaw = SHOOTING_FLAWS.find(f => f.id === flawId)
  if (!flaw) return []
  
  return flaw.relatedFlaws
    .map(id => SHOOTING_FLAWS.find(f => f.id === id))
    .filter((f): f is ShootingFlaw => f !== undefined)
}

/**
 * Get the cause chain explanation for a flaw
 */
export function getCauseChainExplanation(flawId: string): string {
  const flaw = SHOOTING_FLAWS.find(f => f.id === flawId)
  if (!flaw) return ""
  
  return flaw.causeChain
    .map((effect, i) => `${i + 1}. ${effect.effect}: ${effect.explanation}`)
    .join('\n')
}

/**
 * Get combined effect when multiple flaws are present
 */
export function getCombinedFlawEffect(flawIds: string[]): FlawCombination | null {
  // Sort for consistent comparison
  const sortedIds = [...flawIds].sort()
  
  return FLAW_COMBINATIONS.find(combo => {
    const sortedCombo = [...combo.flawIds].sort()
    return sortedCombo.length === sortedIds.length && 
           sortedCombo.every((id, i) => id === sortedIds[i])
  }) || null
}

/**
 * Prioritize flaws by what to fix first
 */
export function prioritizeFlaws(flawIds: string[]): ShootingFlaw[] {
  return flawIds
    .map(id => SHOOTING_FLAWS.find(f => f.id === id))
    .filter((f): f is ShootingFlaw => f !== undefined)
    .sort((a, b) => b.priority - a.priority)
}

/**
 * Detect flaws from angle measurements
 */
export function detectFlawsFromAngles(angles: Record<string, number>): ShootingFlaw[] {
  const detectedFlaws: ShootingFlaw[] = []
  
  // Check elbow angle
  if (angles.right_elbow_angle !== undefined || angles.left_elbow_angle !== undefined) {
    const elbowAngle = angles.right_elbow_angle || angles.left_elbow_angle
    
    if (elbowAngle < 70) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "ELBOW_ANGLE_ACUTE")
      if (flaw) detectedFlaws.push(flaw)
    } else if (elbowAngle > 110) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "ELBOW_ANGLE_OBTUSE")
      if (flaw) detectedFlaws.push(flaw)
    }
  }
  
  // Check knee angle
  if (angles.right_knee_angle !== undefined || angles.left_knee_angle !== undefined) {
    const kneeAngle = angles.right_knee_angle || angles.left_knee_angle
    
    if (kneeAngle > 160) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "INSUFFICIENT_KNEE_BEND")
      if (flaw) detectedFlaws.push(flaw)
    } else if (kneeAngle < 100) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "EXCESSIVE_KNEE_BEND")
      if (flaw) detectedFlaws.push(flaw)
    }
  }
  
  // Check shoulder tilt
  if (angles.shoulder_tilt !== undefined) {
    if (Math.abs(angles.shoulder_tilt - 180) > 8) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "SHOULDER_TILT")
      if (flaw) detectedFlaws.push(flaw)
    }
  }
  
  // Check hip tilt
  if (angles.hip_tilt !== undefined) {
    if (Math.abs(angles.hip_tilt - 180) > 10) {
      const flaw = SHOOTING_FLAWS.find(f => f.id === "HIP_ROTATION")
      if (flaw) detectedFlaws.push(flaw)
    }
  }
  
  return detectedFlaws
}

/**
 * Generate coaching feedback based on detected flaws
 */
export function generateCoachingFeedback(flawIds: string[]): {
  primaryIssue: string
  causeAndEffect: string
  fixOrder: string[]
  drills: string[]
} {
  const flaws = prioritizeFlaws(flawIds)
  
  if (flaws.length === 0) {
    return {
      primaryIssue: "No significant mechanical flaws detected",
      causeAndEffect: "Your shooting form shows good fundamentals",
      fixOrder: [],
      drills: ["Continue current practice routine", "Focus on game-speed repetitions"]
    }
  }
  
  const primaryFlaw = flaws[0]
  
  // Check for known combinations
  const combination = getCombinedFlawEffect(flawIds)
  
  let causeAndEffect = getCauseChainExplanation(primaryFlaw.id)
  if (combination) {
    causeAndEffect = `${combination.combinedEffect}\n\n${causeAndEffect}`
  }
  
  return {
    primaryIssue: primaryFlaw.name,
    causeAndEffect,
    fixOrder: combination 
      ? [combination.primaryFix, ...primaryFlaw.fixes]
      : primaryFlaw.fixes,
    drills: flaws.flatMap(f => f.drills).slice(0, 5)
  }
}

// ============================================
// SHOOTER LEVEL CLASSIFICATION
// ============================================

export interface ShooterLevel {
  level: number
  name: string
  scoreRange: [number, number]
  description: string
  characteristics: string[]
}

export const SHOOTER_LEVELS: ShooterLevel[] = [
  {
    level: 1,
    name: "ELITE",
    scoreRange: [95, 100],
    description: "Textbook form with near-perfect mechanics",
    characteristics: [
      "Elbow angle 85-95° consistently",
      "Release angle 52-55°",
      "Perfect balance throughout",
      "Quick release under 0.4 seconds",
      "Full follow-through held"
    ]
  },
  {
    level: 2,
    name: "PRO",
    scoreRange: [88, 94],
    description: "Professional-level mechanics with minor deviations",
    characteristics: [
      "Elbow angle 80-100°",
      "Consistent high release",
      "Strong leg drive",
      "Clean guide hand separation"
    ]
  },
  {
    level: 3,
    name: "ADVANCED",
    scoreRange: [80, 87],
    description: "Strong fundamentals with 1-2 minor flaws",
    characteristics: [
      "Good base mechanics",
      "Consistent release point",
      "Adequate arc",
      "Minor timing or alignment issues"
    ]
  },
  {
    level: 4,
    name: "PROFICIENT",
    scoreRange: [70, 79],
    description: "Solid mechanics with 2-3 areas needing refinement",
    characteristics: [
      "Functional shooting form",
      "Can shoot in games",
      "Some inconsistency under pressure",
      "2-3 mechanical flaws present"
    ]
  },
  {
    level: 5,
    name: "DEVELOPING",
    scoreRange: [60, 69],
    description: "Understanding of fundamentals but inconsistent execution",
    characteristics: [
      "Knows proper form",
      "Execution varies",
      "3-4 mechanical flaws",
      "Needs focused practice"
    ]
  },
  {
    level: 6,
    name: "PROGRESSING",
    scoreRange: [50, 59],
    description: "Learning proper mechanics, multiple issues present",
    characteristics: [
      "Basic understanding",
      "4-5 mechanical issues",
      "Inconsistent results",
      "Requires fundamental work"
    ]
  },
  {
    level: 7,
    name: "NOVICE",
    scoreRange: [35, 49],
    description: "New to proper shooting mechanics",
    characteristics: [
      "Limited mechanical understanding",
      "Multiple fundamental issues",
      "Needs complete form training"
    ]
  },
  {
    level: 8,
    name: "BEGINNER",
    scoreRange: [0, 34],
    description: "Starting from scratch with shooting form",
    characteristics: [
      "No established form",
      "Requires complete mechanical overhaul",
      "Focus on basic fundamentals"
    ]
  }
]

/**
 * Get shooter level from score
 */
export function getShooterLevel(score: number): ShooterLevel {
  for (const level of SHOOTER_LEVELS) {
    if (score >= level.scoreRange[0] && score <= level.scoreRange[1]) {
      return level
    }
  }
  return SHOOTER_LEVELS[SHOOTER_LEVELS.length - 1] // Default to BEGINNER
}

/**
 * Calculate score reduction based on detected flaws
 */
export function calculateFlawImpact(flawIds: string[]): number {
  let totalReduction = 0
  
  for (const flawId of flawIds) {
    const flaw = SHOOTING_FLAWS.find(f => f.id === flawId)
    if (flaw) {
      // Higher priority flaws have bigger impact
      const impact = flaw.priority * 2 // 2-20 point reduction per flaw
      totalReduction += impact
    }
  }
  
  // Check for compound effects
  const combination = getCombinedFlawEffect(flawIds)
  if (combination) {
    totalReduction += 10 // Additional penalty for known bad combinations
  }
  
  return Math.min(totalReduction, 70) // Cap at 70 point reduction (minimum 30 score)
}

