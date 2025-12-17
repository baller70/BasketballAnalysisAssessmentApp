import { NextRequest, NextResponse } from "next/server"

/**
 * POST /api/compare-shooters
 * 
 * Find professional shooters with similar physical attributes and form metrics.
 * Returns top 3-5 matching professionals for comparison.
 */

// Professional shooter database (embedded for now, can be moved to DB)
const PROFESSIONAL_SHOOTERS = [
  {
    id: 1,
    name: "Stephen Curry",
    team: "Golden State Warriors",
    height: 74, // 6'2" in inches
    wingspan: 78,
    bodyType: "ectomorph",
    shootingHand: "right",
    careerFGPercentage: 0.473,
    career3PTPercentage: 0.428,
    careerFTPercentage: 0.911,
    optimalAngles: { elbow: 92, knee: 125, release: 52, wrist: 65 },
    shootingStyle: "one_motion",
    strengths: ["Quick release", "Deep range", "Off-dribble shooting"],
    signature: "High arc, quick release from any position",
  },
  {
    id: 2,
    name: "Klay Thompson",
    team: "Dallas Mavericks",
    height: 78, // 6'6"
    wingspan: 81,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.454,
    career3PTPercentage: 0.417,
    careerFTPercentage: 0.853,
    optimalAngles: { elbow: 90, knee: 120, release: 50, wrist: 60 },
    shootingStyle: "two_motion",
    strengths: ["Catch and shoot", "Off screens", "Consistent form"],
    signature: "Textbook form, balanced base, smooth release",
  },
  {
    id: 3,
    name: "Ray Allen",
    team: "Retired (Celtics/Heat)",
    height: 77, // 6'5"
    wingspan: 81,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.452,
    career3PTPercentage: 0.400,
    careerFTPercentage: 0.894,
    optimalAngles: { elbow: 91, knee: 118, release: 51, wrist: 62 },
    shootingStyle: "two_motion",
    strengths: ["Corner three", "Clutch shooting", "Perfect mechanics"],
    signature: "Picture-perfect follow-through, high release point",
  },
  {
    id: 4,
    name: "Kevin Durant",
    team: "Phoenix Suns",
    height: 83, // 6'11"
    wingspan: 89,
    bodyType: "ectomorph",
    shootingHand: "right",
    careerFGPercentage: 0.500,
    career3PTPercentage: 0.386,
    careerFTPercentage: 0.884,
    optimalAngles: { elbow: 88, knee: 130, release: 55, wrist: 58 },
    shootingStyle: "one_motion",
    strengths: ["Unblockable release", "Mid-range", "Versatility"],
    signature: "High release point, unguardable due to length",
  },
  {
    id: 5,
    name: "Damian Lillard",
    team: "Milwaukee Bucks",
    height: 74, // 6'2"
    wingspan: 78,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.440,
    career3PTPercentage: 0.372,
    careerFTPercentage: 0.895,
    optimalAngles: { elbow: 93, knee: 122, release: 53, wrist: 64 },
    shootingStyle: "one_motion",
    strengths: ["Deep three-pointers", "Clutch performer", "Pull-up shooting"],
    signature: "Logo-range three-pointers, quick release",
  },
  {
    id: 6,
    name: "Devin Booker",
    team: "Phoenix Suns",
    height: 77, // 6'5"
    wingspan: 80,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.460,
    career3PTPercentage: 0.360,
    careerFTPercentage: 0.868,
    optimalAngles: { elbow: 90, knee: 124, release: 50, wrist: 63 },
    shootingStyle: "two_motion",
    strengths: ["Mid-range", "Footwork", "Off screens"],
    signature: "Smooth stroke, excellent footwork into shot",
  },
  {
    id: 7,
    name: "Diana Taurasi",
    team: "Phoenix Mercury (WNBA)",
    height: 72, // 6'0"
    wingspan: 74,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.430,
    career3PTPercentage: 0.362,
    careerFTPercentage: 0.875,
    optimalAngles: { elbow: 91, knee: 120, release: 49, wrist: 62 },
    shootingStyle: "one_motion",
    strengths: ["Clutch shooting", "Range", "Shot creation"],
    signature: "WNBA GOAT, fearless shooter from anywhere",
  },
  {
    id: 8,
    name: "Sabrina Ionescu",
    team: "New York Liberty (WNBA)",
    height: 71, // 5'11"
    wingspan: 73,
    bodyType: "mesomorph",
    shootingHand: "right",
    careerFGPercentage: 0.435,
    career3PTPercentage: 0.380,
    careerFTPercentage: 0.890,
    optimalAngles: { elbow: 92, knee: 118, release: 51, wrist: 65 },
    shootingStyle: "one_motion",
    strengths: ["Triple threat", "Deep range", "High IQ"],
    signature: "Complete offensive player, efficient from all ranges",
  },
  {
    id: 9,
    name: "Dirk Nowitzki",
    team: "Retired (Dallas Mavericks)",
    height: 84, // 7'0"
    wingspan: 90,
    bodyType: "ectomorph",
    shootingHand: "right",
    careerFGPercentage: 0.471,
    career3PTPercentage: 0.380,
    careerFTPercentage: 0.879,
    optimalAngles: { elbow: 85, knee: 135, release: 58, wrist: 55 },
    shootingStyle: "one_motion",
    strengths: ["Fadeaway", "One-leg release", "Unblockable"],
    signature: "Iconic one-leg fadeaway, revolutionary big man shooting",
  },
  {
    id: 10,
    name: "Reggie Miller",
    team: "Retired (Indiana Pacers)",
    height: 79, // 6'7"
    wingspan: 82,
    bodyType: "ectomorph",
    shootingHand: "right",
    careerFGPercentage: 0.471,
    career3PTPercentage: 0.395,
    careerFTPercentage: 0.888,
    optimalAngles: { elbow: 90, knee: 122, release: 52, wrist: 64 },
    shootingStyle: "two_motion",
    strengths: ["Off screens", "Clutch", "Movement shooting"],
    signature: "Tireless movement, deadly off screens",
  },
]

interface UserProfile {
  height?: number // in inches
  wingspan?: number
  bodyType?: string
  shootingHand?: string
  experienceLevel?: string
  shootingStyle?: string
}

interface UserMetrics {
  elbowAngle?: number
  kneeAngle?: number
  releaseAngle?: number
  wristAngle?: number
  overallScore?: number
}

interface CompareRequest {
  userProfile?: UserProfile
  userMetrics?: UserMetrics
  limit?: number
}

function calculateSimilarityScore(
  shooter: typeof PROFESSIONAL_SHOOTERS[0],
  profile: UserProfile,
  metrics: UserMetrics
): number {
  let score = 0
  let factors = 0

  // Height similarity (max 25 points)
  if (profile.height) {
    const heightDiff = Math.abs(shooter.height - profile.height)
    score += Math.max(0, 25 - heightDiff * 2)
    factors++
  }

  // Wingspan similarity (max 15 points)
  if (profile.wingspan) {
    const wingspanDiff = Math.abs(shooter.wingspan - profile.wingspan)
    score += Math.max(0, 15 - wingspanDiff * 1.5)
    factors++
  }

  // Body type match (max 15 points)
  if (profile.bodyType && shooter.bodyType === profile.bodyType) {
    score += 15
    factors++
  }

  // Shooting hand match (max 10 points)
  if (profile.shootingHand && shooter.shootingHand === profile.shootingHand) {
    score += 10
    factors++
  }

  // Shooting style match (max 15 points)
  if (profile.shootingStyle && shooter.shootingStyle === profile.shootingStyle) {
    score += 15
    factors++
  }

  // Angle similarity (max 20 points)
  if (metrics.elbowAngle !== undefined) {
    const elbowDiff = Math.abs(shooter.optimalAngles.elbow - metrics.elbowAngle)
    score += Math.max(0, 5 - elbowDiff * 0.3)
    factors++
  }
  if (metrics.kneeAngle !== undefined) {
    const kneeDiff = Math.abs(shooter.optimalAngles.knee - metrics.kneeAngle)
    score += Math.max(0, 5 - kneeDiff * 0.3)
    factors++
  }
  if (metrics.releaseAngle !== undefined) {
    const releaseDiff = Math.abs(shooter.optimalAngles.release - metrics.releaseAngle)
    score += Math.max(0, 5 - releaseDiff * 0.3)
    factors++
  }
  if (metrics.wristAngle !== undefined) {
    const wristDiff = Math.abs(shooter.optimalAngles.wrist - metrics.wristAngle)
    score += Math.max(0, 5 - wristDiff * 0.3)
    factors++
  }

  // Normalize to 0-100
  return factors > 0 ? Math.min(100, (score / factors) * (factors / 5) * 100 / 25) : 0
}

export async function POST(request: NextRequest) {
  try {
    const body: CompareRequest = await request.json()
    const { userProfile = {}, userMetrics = {}, limit = 5 } = body

    // Calculate similarity for each shooter
    const comparisons = PROFESSIONAL_SHOOTERS.map(shooter => ({
      shooter,
      similarity: calculateSimilarityScore(shooter, userProfile, userMetrics),
    }))

    // Sort by similarity and take top matches
    comparisons.sort((a, b) => b.similarity - a.similarity)
    const topMatches = comparisons.slice(0, limit)

    // Format response
    const results = topMatches.map(({ shooter, similarity }) => ({
      id: shooter.id,
      name: shooter.name,
      team: shooter.team,
      similarity: Math.round(similarity),
      physicalMatch: {
        height: `${Math.floor(shooter.height / 12)}'${shooter.height % 12}"`,
        wingspan: `${Math.floor(shooter.wingspan / 12)}'${shooter.wingspan % 12}"`,
        bodyType: shooter.bodyType,
      },
      shootingMetrics: {
        style: shooter.shootingStyle,
        optimalAngles: shooter.optimalAngles,
        career3PT: `${(shooter.career3PTPercentage * 100).toFixed(1)}%`,
        careerFT: `${(shooter.careerFTPercentage * 100).toFixed(1)}%`,
      },
      strengths: shooter.strengths,
      signature: shooter.signature,
      comparisonNotes: generateComparisonNotes(shooter, userProfile, userMetrics),
    }))

    return NextResponse.json({
      success: true,
      comparisons: results,
      userProfile: {
        height: userProfile.height ? `${Math.floor(userProfile.height / 12)}'${userProfile.height % 12}"` : null,
        bodyType: userProfile.bodyType,
        shootingStyle: userProfile.shootingStyle,
      },
    })
  } catch (error) {
    console.error("Compare shooters error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Comparison failed" },
      { status: 500 }
    )
  }
}

function generateComparisonNotes(
  shooter: typeof PROFESSIONAL_SHOOTERS[0],
  profile: UserProfile,
  metrics: UserMetrics
): string[] {
  const notes: string[] = []

  // Height comparison
  if (profile.height) {
    const diff = profile.height - shooter.height
    if (Math.abs(diff) <= 2) {
      notes.push(`Similar height to ${shooter.name} - study their release point`)
    } else if (diff > 0) {
      notes.push(`You're taller than ${shooter.name} - you may need a higher release`)
    } else {
      notes.push(`${shooter.name} is taller - focus on quicker release like them`)
    }
  }

  // Angle comparison
  if (metrics.elbowAngle !== undefined) {
    const diff = metrics.elbowAngle - shooter.optimalAngles.elbow
    if (Math.abs(diff) <= 5) {
      notes.push(`Your elbow angle is similar to ${shooter.name}'s optimal form`)
    } else if (diff > 0) {
      notes.push(`Try tucking your elbow ${Math.abs(diff).toFixed(0)}° more like ${shooter.name}`)
    } else {
      notes.push(`Your elbow is more tucked than ${shooter.name} - may need slight adjustment`)
    }
  }

  // Style-based advice
  if (shooter.shootingStyle === "one_motion" && profile.shootingStyle === "two_motion") {
    notes.push(`${shooter.name} uses one-motion shooting - consider if this fits your game`)
  }

  if (notes.length === 0) {
    notes.push(`Study ${shooter.name}'s ${shooter.strengths[0].toLowerCase()} technique`)
  }

  return notes
}

/**
 * GET /api/compare-shooters
 * 
 * Get all professional shooters in database
 */
export async function GET() {
  const shooters = PROFESSIONAL_SHOOTERS.map(shooter => ({
    id: shooter.id,
    name: shooter.name,
    team: shooter.team,
    height: `${Math.floor(shooter.height / 12)}'${shooter.height % 12}"`,
    bodyType: shooter.bodyType,
    shootingStyle: shooter.shootingStyle,
    career3PT: `${(shooter.career3PTPercentage * 100).toFixed(1)}%`,
  }))

  return NextResponse.json({
    success: true,
    count: shooters.length,
    shooters,
  })
}





