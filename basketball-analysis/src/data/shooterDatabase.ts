// Shooter Database for Basketball Analysis Tool
// Contains shooters across different skill levels with body type and shooting metrics

export type ShooterSkillLevel = 
  | "ELITE"           // 95-100 - Hall of Fame level
  | "PRO"             // 88-94 - NBA All-Star caliber
  | "ADVANCED"        // 80-87 - NBA rotation player
  | "INTERMEDIATE"    // 70-79 - College/Overseas pro
  | "DEVELOPING"      // 60-69 - High school/Amateur
  | "BEGINNER"        // 50-59 - Learning fundamentals
  | "NEEDS_WORK"      // 40-49 - Significant issues
  | "POOR"            // Below 40 - Major mechanical problems

export type BodyBuild = "GUARD" | "WING" | "FORWARD" | "CENTER"

export interface ShooterProfile {
  id: string
  name: string
  team: string
  position: string
  
  // Physical attributes
  heightInches: number      // Total height in inches
  weightLbs: number         // Weight in pounds
  wingspanInches: number    // Wingspan in inches
  bodyBuild: BodyBuild      // Body type category
  
  // Skill classification
  skillLevel: ShooterSkillLevel
  overallScore: number      // 0-100
  
  // Shooting metrics (angles in degrees)
  shootingMetrics: {
    elbowAngle: number        // Ideal: 85-95
    kneeAngle: number         // Ideal: 140-160 (bent)
    releaseAngle: number      // Ideal: 45-52
    shoulderTilt: number      // Ideal: 0-10
    hipTilt: number           // Ideal: 0-15
    followThroughAngle: number // Ideal: 160-180
  }
  
  // Career stats (optional, for display)
  careerStats?: {
    fgPct: number
    threePct: number
    ftPct: number
  }
  
  // Image URL (for display)
  imageUrl?: string
  
  // Notable traits
  traits: string[]
}

// ============================================
// ELITE SHOOTERS (95-100)
// ============================================
const ELITE_SHOOTERS: ShooterProfile[] = [
  {
    id: "curry-stephen",
    name: "Stephen Curry",
    team: "Golden State Warriors",
    position: "Point Guard",
    heightInches: 74,  // 6'2"
    weightLbs: 185,
    wingspanInches: 79,  // 6'7"
    bodyBuild: "GUARD",
    skillLevel: "ELITE",
    overallScore: 99,
    shootingMetrics: {
      elbowAngle: 90,
      kneeAngle: 145,
      releaseAngle: 48,
      shoulderTilt: 3,
      hipTilt: 5,
      followThroughAngle: 175
    },
    careerStats: { fgPct: 47.3, threePct: 42.8, ftPct: 91.0 },
    traits: ["Quick release", "Deep range", "Off-balance shooting", "One-motion shot"]
  },
  {
    id: "korver-kyle",
    name: "Kyle Korver",
    team: "Retired (Multiple Teams)",
    position: "Shooting Guard",
    heightInches: 79,  // 6'7"
    weightLbs: 212,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "WING",
    skillLevel: "ELITE",
    overallScore: 97,
    shootingMetrics: {
      elbowAngle: 88,
      kneeAngle: 150,
      releaseAngle: 50,
      shoulderTilt: 2,
      hipTilt: 4,
      followThroughAngle: 178
    },
    careerStats: { fgPct: 43.0, threePct: 42.9, ftPct: 87.9 },
    traits: ["Textbook form", "High release", "Catch-and-shoot specialist", "Perfect arc"]
  },
  {
    id: "allen-ray",
    name: "Ray Allen",
    team: "Retired (Multiple Teams)",
    position: "Shooting Guard",
    heightInches: 77,  // 6'5"
    weightLbs: 205,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "WING",
    skillLevel: "ELITE",
    overallScore: 98,
    shootingMetrics: {
      elbowAngle: 92,
      kneeAngle: 148,
      releaseAngle: 49,
      shoulderTilt: 4,
      hipTilt: 6,
      followThroughAngle: 176
    },
    careerStats: { fgPct: 45.2, threePct: 40.0, ftPct: 89.4 },
    traits: ["Silky smooth release", "Perfect footwork", "Consistent mechanics", "Clutch shooter"]
  },
  {
    id: "thompson-klay",
    name: "Klay Thompson",
    team: "Dallas Mavericks",
    position: "Shooting Guard",
    heightInches: 78,  // 6'6"
    weightLbs: 220,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "WING",
    skillLevel: "ELITE",
    overallScore: 96,
    shootingMetrics: {
      elbowAngle: 91,
      kneeAngle: 152,
      releaseAngle: 47,
      shoulderTilt: 5,
      hipTilt: 7,
      followThroughAngle: 174
    },
    careerStats: { fgPct: 45.3, threePct: 41.3, ftPct: 85.3 },
    traits: ["Quick release", "Catch-and-shoot", "Off screens", "Two-motion shot"]
  },
  {
    id: "miller-reggie",
    name: "Reggie Miller",
    team: "Retired (Indiana Pacers)",
    position: "Shooting Guard",
    heightInches: 79,  // 6'7"
    weightLbs: 195,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "WING",
    skillLevel: "ELITE",
    overallScore: 97,
    shootingMetrics: {
      elbowAngle: 89,
      kneeAngle: 155,
      releaseAngle: 51,
      shoulderTilt: 3,
      hipTilt: 5,
      followThroughAngle: 177
    },
    careerStats: { fgPct: 47.1, threePct: 39.5, ftPct: 88.8 },
    traits: ["High arc", "Clutch performer", "Movement shooter", "Trash talker"]
  }
]

// ============================================
// PRO SHOOTERS (88-94)
// ============================================
const PRO_SHOOTERS: ShooterProfile[] = [
  {
    id: "booker-devin",
    name: "Devin Booker",
    team: "Phoenix Suns",
    position: "Shooting Guard",
    heightInches: 77,  // 6'5"
    weightLbs: 206,
    wingspanInches: 80,  // 6'8"
    bodyBuild: "WING",
    skillLevel: "PRO",
    overallScore: 92,
    shootingMetrics: {
      elbowAngle: 88,
      kneeAngle: 148,
      releaseAngle: 46,
      shoulderTilt: 6,
      hipTilt: 8,
      followThroughAngle: 172
    },
    careerStats: { fgPct: 46.0, threePct: 36.0, ftPct: 87.0 },
    traits: ["Mid-range master", "Smooth stroke", "Pull-up jumper", "Scoring versatility"]
  },
  {
    id: "lillard-damian",
    name: "Damian Lillard",
    team: "Milwaukee Bucks",
    position: "Point Guard",
    heightInches: 74,  // 6'2"
    weightLbs: 195,
    wingspanInches: 78,  // 6'6"
    bodyBuild: "GUARD",
    skillLevel: "PRO",
    overallScore: 93,
    shootingMetrics: {
      elbowAngle: 87,
      kneeAngle: 142,
      releaseAngle: 45,
      shoulderTilt: 7,
      hipTilt: 9,
      followThroughAngle: 170
    },
    careerStats: { fgPct: 44.0, threePct: 37.0, ftPct: 89.0 },
    traits: ["Deep range", "Clutch gene", "Off-dribble shooting", "Logo range"]
  },
  {
    id: "mitchell-donovan",
    name: "Donovan Mitchell",
    team: "Cleveland Cavaliers",
    position: "Shooting Guard",
    heightInches: 73,  // 6'1"
    weightLbs: 215,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "GUARD",
    skillLevel: "PRO",
    overallScore: 89,
    shootingMetrics: {
      elbowAngle: 86,
      kneeAngle: 140,
      releaseAngle: 44,
      shoulderTilt: 8,
      hipTilt: 10,
      followThroughAngle: 168
    },
    careerStats: { fgPct: 44.5, threePct: 36.5, ftPct: 85.0 },
    traits: ["Athletic shooter", "Explosive", "Pull-up three", "Scorer mentality"]
  },
  {
    id: "durant-kevin",
    name: "Kevin Durant",
    team: "Phoenix Suns",
    position: "Small Forward",
    heightInches: 82,  // 6'10"
    weightLbs: 240,
    wingspanInches: 89,  // 7'5"
    bodyBuild: "FORWARD",
    skillLevel: "PRO",
    overallScore: 94,
    shootingMetrics: {
      elbowAngle: 93,
      kneeAngle: 158,
      releaseAngle: 52,
      shoulderTilt: 4,
      hipTilt: 6,
      followThroughAngle: 175
    },
    careerStats: { fgPct: 50.0, threePct: 38.5, ftPct: 88.5 },
    traits: ["Unblockable release", "Length advantage", "Mid-range killer", "Effortless stroke"]
  },
  {
    id: "tatum-jayson",
    name: "Jayson Tatum",
    team: "Boston Celtics",
    position: "Small Forward",
    heightInches: 80,  // 6'8"
    weightLbs: 210,
    wingspanInches: 84,  // 7'0"
    bodyBuild: "FORWARD",
    skillLevel: "PRO",
    overallScore: 90,
    shootingMetrics: {
      elbowAngle: 90,
      kneeAngle: 155,
      releaseAngle: 48,
      shoulderTilt: 5,
      hipTilt: 7,
      followThroughAngle: 173
    },
    careerStats: { fgPct: 45.5, threePct: 37.0, ftPct: 85.5 },
    traits: ["Step-back three", "Fadeaway", "High release", "Two-way player"]
  }
]

// ============================================
// ADVANCED SHOOTERS (80-87)
// ============================================
const ADVANCED_SHOOTERS: ShooterProfile[] = [
  {
    id: "harris-joe",
    name: "Joe Harris",
    team: "Detroit Pistons",
    position: "Shooting Guard",
    heightInches: 78,  // 6'6"
    weightLbs: 220,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "WING",
    skillLevel: "ADVANCED",
    overallScore: 85,
    shootingMetrics: {
      elbowAngle: 89,
      kneeAngle: 150,
      releaseAngle: 47,
      shoulderTilt: 6,
      hipTilt: 8,
      followThroughAngle: 171
    },
    careerStats: { fgPct: 47.0, threePct: 43.5, ftPct: 82.0 },
    traits: ["Spot-up specialist", "Corner three", "Consistent mechanics", "Movement shooter"]
  },
  {
    id: "green-danny",
    name: "Danny Green",
    team: "Free Agent",
    position: "Shooting Guard",
    heightInches: 78,  // 6'6"
    weightLbs: 215,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "WING",
    skillLevel: "ADVANCED",
    overallScore: 82,
    shootingMetrics: {
      elbowAngle: 88,
      kneeAngle: 152,
      releaseAngle: 46,
      shoulderTilt: 7,
      hipTilt: 9,
      followThroughAngle: 169
    },
    careerStats: { fgPct: 42.0, threePct: 40.0, ftPct: 75.0 },
    traits: ["3-and-D player", "Catch-and-shoot", "Championship experience", "Defensive minded"]
  },
  {
    id: "robinson-duncan",
    name: "Duncan Robinson",
    team: "Miami Heat",
    position: "Shooting Guard",
    heightInches: 79,  // 6'7"
    weightLbs: 210,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "WING",
    skillLevel: "ADVANCED",
    overallScore: 84,
    shootingMetrics: {
      elbowAngle: 90,
      kneeAngle: 148,
      releaseAngle: 49,
      shoulderTilt: 5,
      hipTilt: 7,
      followThroughAngle: 174
    },
    careerStats: { fgPct: 44.0, threePct: 40.5, ftPct: 80.0 },
    traits: ["Volume shooter", "Off screens", "Quick release", "Spot-up specialist"]
  },
  {
    id: "love-kevin",
    name: "Kevin Love",
    team: "Miami Heat",
    position: "Power Forward",
    heightInches: 80,  // 6'8"
    weightLbs: 251,
    wingspanInches: 83,  // 6'11"
    bodyBuild: "FORWARD",
    skillLevel: "ADVANCED",
    overallScore: 83,
    shootingMetrics: {
      elbowAngle: 91,
      kneeAngle: 155,
      releaseAngle: 50,
      shoulderTilt: 6,
      hipTilt: 8,
      followThroughAngle: 172
    },
    careerStats: { fgPct: 43.0, threePct: 37.0, ftPct: 82.0 },
    traits: ["Stretch four", "Outlet passing", "Post-up game", "Rebounding"]
  },
  {
    id: "ingles-joe",
    name: "Joe Ingles",
    team: "Orlando Magic",
    position: "Small Forward",
    heightInches: 80,  // 6'8"
    weightLbs: 220,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "FORWARD",
    skillLevel: "ADVANCED",
    overallScore: 81,
    shootingMetrics: {
      elbowAngle: 87,
      kneeAngle: 153,
      releaseAngle: 46,
      shoulderTilt: 8,
      hipTilt: 10,
      followThroughAngle: 168
    },
    careerStats: { fgPct: 45.0, threePct: 40.0, ftPct: 82.0 },
    traits: ["Crafty veteran", "High IQ", "Set shot", "Playmaking"]
  }
]

// ============================================
// INTERMEDIATE SHOOTERS (70-79)
// ============================================
const INTERMEDIATE_SHOOTERS: ShooterProfile[] = [
  {
    id: "smart-marcus",
    name: "Marcus Smart",
    team: "Memphis Grizzlies",
    position: "Point Guard",
    heightInches: 76,  // 6'4"
    weightLbs: 220,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "GUARD",
    skillLevel: "INTERMEDIATE",
    overallScore: 75,
    shootingMetrics: {
      elbowAngle: 84,
      kneeAngle: 145,
      releaseAngle: 43,
      shoulderTilt: 10,
      hipTilt: 12,
      followThroughAngle: 165
    },
    careerStats: { fgPct: 37.5, threePct: 32.5, ftPct: 80.0 },
    traits: ["Defensive specialist", "Streaky shooter", "Tough shot maker", "Leadership"]
  },
  {
    id: "holiday-jrue",
    name: "Jrue Holiday",
    team: "Boston Celtics",
    position: "Point Guard",
    heightInches: 76,  // 6'4"
    weightLbs: 205,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "GUARD",
    skillLevel: "INTERMEDIATE",
    overallScore: 78,
    shootingMetrics: {
      elbowAngle: 86,
      kneeAngle: 147,
      releaseAngle: 44,
      shoulderTilt: 8,
      hipTilt: 10,
      followThroughAngle: 167
    },
    careerStats: { fgPct: 44.0, threePct: 35.0, ftPct: 78.0 },
    traits: ["Two-way guard", "Clutch defense", "Solid fundamentals", "Veteran presence"]
  },
  {
    id: "green-draymond",
    name: "Draymond Green",
    team: "Golden State Warriors",
    position: "Power Forward",
    heightInches: 78,  // 6'6"
    weightLbs: 230,
    wingspanInches: 83,  // 6'11"
    bodyBuild: "FORWARD",
    skillLevel: "INTERMEDIATE",
    overallScore: 72,
    shootingMetrics: {
      elbowAngle: 82,
      kneeAngle: 150,
      releaseAngle: 42,
      shoulderTilt: 12,
      hipTilt: 14,
      followThroughAngle: 162
    },
    careerStats: { fgPct: 44.0, threePct: 32.0, ftPct: 71.0 },
    traits: ["Playmaking big", "Defensive anchor", "High IQ", "Championship DNA"]
  },
  {
    id: "tucker-pj",
    name: "P.J. Tucker",
    team: "Los Angeles Clippers",
    position: "Power Forward",
    heightInches: 77,  // 6'5"
    weightLbs: 245,
    wingspanInches: 80,  // 6'8"
    bodyBuild: "FORWARD",
    skillLevel: "INTERMEDIATE",
    overallScore: 74,
    shootingMetrics: {
      elbowAngle: 85,
      kneeAngle: 152,
      releaseAngle: 44,
      shoulderTilt: 9,
      hipTilt: 11,
      followThroughAngle: 166
    },
    careerStats: { fgPct: 42.0, threePct: 36.0, ftPct: 70.0 },
    traits: ["Corner specialist", "Hustle player", "Physical defender", "Veteran"]
  },
  {
    id: "crowder-jae",
    name: "Jae Crowder",
    team: "Milwaukee Bucks",
    position: "Small Forward",
    heightInches: 78,  // 6'6"
    weightLbs: 235,
    wingspanInches: 82,  // 6'10"
    bodyBuild: "FORWARD",
    skillLevel: "INTERMEDIATE",
    overallScore: 73,
    shootingMetrics: {
      elbowAngle: 84,
      kneeAngle: 150,
      releaseAngle: 43,
      shoulderTilt: 10,
      hipTilt: 12,
      followThroughAngle: 164
    },
    careerStats: { fgPct: 40.0, threePct: 34.5, ftPct: 72.0 },
    traits: ["3-and-D forward", "Physical", "Versatile defender", "Team player"]
  }
]

// ============================================
// DEVELOPING SHOOTERS (60-69)
// ============================================
const DEVELOPING_SHOOTERS: ShooterProfile[] = [
  {
    id: "simmons-ben",
    name: "Ben Simmons",
    team: "Brooklyn Nets",
    position: "Point Guard",
    heightInches: 82,  // 6'10"
    weightLbs: 240,
    wingspanInches: 85,  // 7'1"
    bodyBuild: "FORWARD",
    skillLevel: "DEVELOPING",
    overallScore: 62,
    shootingMetrics: {
      elbowAngle: 78,
      kneeAngle: 160,
      releaseAngle: 38,
      shoulderTilt: 15,
      hipTilt: 18,
      followThroughAngle: 155
    },
    careerStats: { fgPct: 56.0, threePct: 5.0, ftPct: 59.0 },
    traits: ["Elite passer", "Transition player", "Defensive versatility", "Shot averse"]
  },
  {
    id: "westbrook-russell",
    name: "Russell Westbrook",
    team: "Denver Nuggets",
    position: "Point Guard",
    heightInches: 75,  // 6'3"
    weightLbs: 200,
    wingspanInches: 80,  // 6'8"
    bodyBuild: "GUARD",
    skillLevel: "DEVELOPING",
    overallScore: 68,
    shootingMetrics: {
      elbowAngle: 80,
      kneeAngle: 138,
      releaseAngle: 40,
      shoulderTilt: 14,
      hipTilt: 16,
      followThroughAngle: 158
    },
    careerStats: { fgPct: 43.5, threePct: 30.5, ftPct: 80.0 },
    traits: ["Athletic freak", "Triple-double machine", "Aggressive driver", "Inconsistent jumper"]
  },
  {
    id: "williamson-zion",
    name: "Zion Williamson",
    team: "New Orleans Pelicans",
    position: "Power Forward",
    heightInches: 78,  // 6'6"
    weightLbs: 284,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "FORWARD",
    skillLevel: "DEVELOPING",
    overallScore: 65,
    shootingMetrics: {
      elbowAngle: 82,
      kneeAngle: 145,
      releaseAngle: 41,
      shoulderTilt: 12,
      hipTilt: 14,
      followThroughAngle: 160
    },
    careerStats: { fgPct: 58.0, threePct: 33.0, ftPct: 70.0 },
    traits: ["Explosive athlete", "Paint dominator", "Developing range", "Powerful finisher"]
  },
  {
    id: "giannis-antetokounmpo",
    name: "Giannis Antetokounmpo",
    team: "Milwaukee Bucks",
    position: "Power Forward",
    heightInches: 83,  // 6'11"
    weightLbs: 243,
    wingspanInches: 90,  // 7'6"
    bodyBuild: "FORWARD",
    skillLevel: "DEVELOPING",
    overallScore: 67,
    shootingMetrics: {
      elbowAngle: 79,
      kneeAngle: 155,
      releaseAngle: 39,
      shoulderTilt: 13,
      hipTilt: 15,
      followThroughAngle: 157
    },
    careerStats: { fgPct: 55.0, threePct: 28.5, ftPct: 70.0 },
    traits: ["Freak athlete", "Euro step", "Transition beast", "Improving jumper"]
  },
  {
    id: "ball-lonzo",
    name: "Lonzo Ball",
    team: "Chicago Bulls",
    position: "Point Guard",
    heightInches: 78,  // 6'6"
    weightLbs: 190,
    wingspanInches: 81,  // 6'9"
    bodyBuild: "WING",
    skillLevel: "DEVELOPING",
    overallScore: 69,
    shootingMetrics: {
      elbowAngle: 75,  // Unconventional
      kneeAngle: 148,
      releaseAngle: 42,
      shoulderTilt: 18,  // Side release
      hipTilt: 15,
      followThroughAngle: 160
    },
    careerStats: { fgPct: 41.0, threePct: 37.0, ftPct: 72.0 },
    traits: ["Court vision", "Transition passer", "Reworked shot", "Defensive length"]
  }
]

// ============================================
// NEEDS WORK SHOOTERS (40-59)
// ============================================
const NEEDS_WORK_SHOOTERS: ShooterProfile[] = [
  {
    id: "gobert-rudy",
    name: "Rudy Gobert",
    team: "Minnesota Timberwolves",
    position: "Center",
    heightInches: 85,  // 7'1"
    weightLbs: 258,
    wingspanInches: 93,  // 7'9"
    bodyBuild: "CENTER",
    skillLevel: "NEEDS_WORK",
    overallScore: 48,
    shootingMetrics: {
      elbowAngle: 72,
      kneeAngle: 165,
      releaseAngle: 35,
      shoulderTilt: 18,
      hipTilt: 20,
      followThroughAngle: 150
    },
    careerStats: { fgPct: 65.0, threePct: 0.0, ftPct: 63.0 },
    traits: ["Rim protector", "Lob threat", "Limited range", "Elite defender"]
  },
  {
    id: "howard-dwight",
    name: "Dwight Howard",
    team: "Free Agent",
    position: "Center",
    heightInches: 82,  // 6'10"
    weightLbs: 265,
    wingspanInches: 88,  // 7'4"
    bodyBuild: "CENTER",
    skillLevel: "NEEDS_WORK",
    overallScore: 45,
    shootingMetrics: {
      elbowAngle: 70,
      kneeAngle: 162,
      releaseAngle: 33,
      shoulderTilt: 20,
      hipTilt: 22,
      followThroughAngle: 148
    },
    careerStats: { fgPct: 58.5, threePct: 10.0, ftPct: 56.5 },
    traits: ["Athletic big", "Rebounding machine", "Poor FT shooter", "Rim runner"]
  },
  {
    id: "capela-clint",
    name: "Clint Capela",
    team: "Atlanta Hawks",
    position: "Center",
    heightInches: 82,  // 6'10"
    weightLbs: 240,
    wingspanInches: 87,  // 7'3"
    bodyBuild: "CENTER",
    skillLevel: "NEEDS_WORK",
    overallScore: 50,
    shootingMetrics: {
      elbowAngle: 74,
      kneeAngle: 160,
      releaseAngle: 36,
      shoulderTilt: 16,
      hipTilt: 18,
      followThroughAngle: 152
    },
    careerStats: { fgPct: 62.0, threePct: 0.0, ftPct: 53.0 },
    traits: ["Lob finisher", "Shot blocker", "Pick-and-roll", "No perimeter game"]
  },
  {
    id: "drummond-andre",
    name: "Andre Drummond",
    team: "Chicago Bulls",
    position: "Center",
    heightInches: 83,  // 6'11"
    weightLbs: 279,
    wingspanInches: 90,  // 7'6"
    bodyBuild: "CENTER",
    skillLevel: "NEEDS_WORK",
    overallScore: 42,
    shootingMetrics: {
      elbowAngle: 68,
      kneeAngle: 168,
      releaseAngle: 32,
      shoulderTilt: 22,
      hipTilt: 24,
      followThroughAngle: 145
    },
    careerStats: { fgPct: 52.0, threePct: 12.0, ftPct: 46.5 },
    traits: ["Rebounding monster", "Poor FT shooter", "Limited offense", "Physical presence"]
  },
  {
    id: "adams-steven",
    name: "Steven Adams",
    team: "Houston Rockets",
    position: "Center",
    heightInches: 84,  // 7'0"
    weightLbs: 265,
    wingspanInches: 88,  // 7'4"
    bodyBuild: "CENTER",
    skillLevel: "NEEDS_WORK",
    overallScore: 52,
    shootingMetrics: {
      elbowAngle: 76,
      kneeAngle: 158,
      releaseAngle: 38,
      shoulderTilt: 14,
      hipTilt: 16,
      followThroughAngle: 155
    },
    careerStats: { fgPct: 59.0, threePct: 0.0, ftPct: 56.0 },
    traits: ["Screen setter", "Physical", "Hustle player", "No jump shot"]
  }
]

// ============================================
// COMBINED DATABASE
// ============================================
export const SHOOTER_DATABASE: ShooterProfile[] = [
  ...ELITE_SHOOTERS,
  ...PRO_SHOOTERS,
  ...ADVANCED_SHOOTERS,
  ...INTERMEDIATE_SHOOTERS,
  ...DEVELOPING_SHOOTERS,
  ...NEEDS_WORK_SHOOTERS
]

// ============================================
// MATCHING ALGORITHM
// ============================================

interface MatchCriteria {
  heightInches?: number
  weightLbs?: number
  wingspanInches?: number
  bodyBuild?: BodyBuild
  athleticAbility?: number  // 1-10
  shootingMetrics?: {
    elbowAngle?: number
    kneeAngle?: number
    releaseAngle?: number
    shoulderTilt?: number
    hipTilt?: number
  }
}

interface MatchResult {
  shooter: ShooterProfile
  matchScore: number  // 0-100, higher is better match
  matchReasons: string[]
}

// Height tolerance in inches for matching
const HEIGHT_TOLERANCE = 3
const WEIGHT_TOLERANCE = 25
const WINGSPAN_TOLERANCE = 4
const ANGLE_TOLERANCE = 15

function calculateBodyTypeMatch(user: MatchCriteria, shooter: ShooterProfile): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  let factors = 0

  // Height match (most important)
  if (user.heightInches) {
    factors++
    const heightDiff = Math.abs(user.heightInches - shooter.heightInches)
    if (heightDiff <= HEIGHT_TOLERANCE) {
      score += 30
      reasons.push(`Similar height (${Math.floor(shooter.heightInches / 12)}'${shooter.heightInches % 12}")`)
    } else if (heightDiff <= HEIGHT_TOLERANCE * 2) {
      score += 15
    }
  }

  // Weight match
  if (user.weightLbs) {
    factors++
    const weightDiff = Math.abs(user.weightLbs - shooter.weightLbs)
    if (weightDiff <= WEIGHT_TOLERANCE) {
      score += 20
      reasons.push(`Similar weight (${shooter.weightLbs} lbs)`)
    } else if (weightDiff <= WEIGHT_TOLERANCE * 2) {
      score += 10
    }
  }

  // Wingspan match
  if (user.wingspanInches) {
    factors++
    const wingspanDiff = Math.abs(user.wingspanInches - shooter.wingspanInches)
    if (wingspanDiff <= WINGSPAN_TOLERANCE) {
      score += 20
      reasons.push(`Similar wingspan (${Math.floor(shooter.wingspanInches / 12)}'${shooter.wingspanInches % 12}")`)
    } else if (wingspanDiff <= WINGSPAN_TOLERANCE * 2) {
      score += 10
    }
  }

  // Body build match
  if (user.bodyBuild && user.bodyBuild === shooter.bodyBuild) {
    factors++
    score += 15
    reasons.push(`Same body build (${shooter.bodyBuild})`)
  }

  // Normalize score based on factors evaluated
  const normalizedScore = factors > 0 ? (score / factors) * (factors / 4) * 100 / 30 : 0
  
  return { score: Math.min(50, normalizedScore), reasons }
}

function calculateShootingMetricsMatch(user: MatchCriteria, shooter: ShooterProfile): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []
  let factors = 0

  if (!user.shootingMetrics) return { score: 0, reasons: [] }

  const userMetrics = user.shootingMetrics
  const shooterMetrics = shooter.shootingMetrics

  // Elbow angle match
  if (userMetrics.elbowAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.elbowAngle - shooterMetrics.elbowAngle)
    if (diff <= ANGLE_TOLERANCE / 2) {
      score += 15
      reasons.push(`Similar elbow angle (${shooterMetrics.elbowAngle}°)`)
    } else if (diff <= ANGLE_TOLERANCE) {
      score += 8
    }
  }

  // Knee angle match
  if (userMetrics.kneeAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.kneeAngle - shooterMetrics.kneeAngle)
    if (diff <= ANGLE_TOLERANCE) {
      score += 12
      reasons.push(`Similar knee bend`)
    } else if (diff <= ANGLE_TOLERANCE * 2) {
      score += 6
    }
  }

  // Release angle match
  if (userMetrics.releaseAngle !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.releaseAngle - shooterMetrics.releaseAngle)
    if (diff <= ANGLE_TOLERANCE / 2) {
      score += 15
      reasons.push(`Similar release angle`)
    } else if (diff <= ANGLE_TOLERANCE) {
      score += 8
    }
  }

  // Shoulder tilt match
  if (userMetrics.shoulderTilt !== undefined) {
    factors++
    const diff = Math.abs(userMetrics.shoulderTilt - shooterMetrics.shoulderTilt)
    if (diff <= ANGLE_TOLERANCE / 2) {
      score += 8
      reasons.push(`Similar shoulder alignment`)
    } else if (diff <= ANGLE_TOLERANCE) {
      score += 4
    }
  }

  // Normalize score
  const normalizedScore = factors > 0 ? (score / factors) * (factors / 4) * 100 / 15 : 0
  
  return { score: Math.min(50, normalizedScore), reasons }
}

export function findMatchingShooters(criteria: MatchCriteria, limit: number = 5): MatchResult[] {
  const results: MatchResult[] = []

  for (const shooter of SHOOTER_DATABASE) {
    const bodyMatch = calculateBodyTypeMatch(criteria, shooter)
    const metricsMatch = calculateShootingMetricsMatch(criteria, shooter)
    
    const totalScore = bodyMatch.score + metricsMatch.score
    const allReasons = [...bodyMatch.reasons, ...metricsMatch.reasons]

    results.push({
      shooter,
      matchScore: Math.round(totalScore),
      matchReasons: allReasons.length > 0 ? allReasons : [`${shooter.skillLevel} level shooter`]
    })
  }

  // Sort by match score descending
  results.sort((a, b) => b.matchScore - a.matchScore)

  // Return top matches
  return results.slice(0, limit)
}

// Helper to convert height string to inches
export function parseHeightToInches(height: string): number | undefined {
  // Format: "6'5"" or "6-5" or "77"
  const match = height.match(/(\d+)['\-](\d+)/)
  if (match) {
    return parseInt(match[1]) * 12 + parseInt(match[2])
  }
  const inches = parseInt(height)
  if (!isNaN(inches) && inches > 50 && inches < 100) {
    return inches
  }
  return undefined
}

// Helper to determine body build from height
export function determineBodyBuild(heightInches: number): BodyBuild {
  if (heightInches < 76) return "GUARD"       // Under 6'4"
  if (heightInches < 80) return "WING"        // 6'4" - 6'7"
  if (heightInches < 84) return "FORWARD"     // 6'8" - 6'11"
  return "CENTER"                              // 7'0"+
}

// Get shooters by skill level
export function getShootersByLevel(level: ShooterSkillLevel): ShooterProfile[] {
  return SHOOTER_DATABASE.filter(s => s.skillLevel === level)
}

// Get all skill levels
export function getAllSkillLevels(): ShooterSkillLevel[] {
  return ["ELITE", "PRO", "ADVANCED", "INTERMEDIATE", "DEVELOPING", "NEEDS_WORK", "POOR"]
}

