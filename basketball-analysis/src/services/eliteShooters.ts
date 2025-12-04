// Elite Shooters Reference Database
// Contains data for professional basketball players with elite shooting form

export interface EliteShooterData {
  id: string
  name: string
  team: string
  position: string
  height: number // inches
  wingspan: number // inches
  weight: number // lbs
  bodyType: string
  careerThreePointPct: number
  careerFreeThrowPct: number
  imageUrl?: string
  biomechanics: {
    shoulderAngle: number
    elbowAngle: number
    hipAngle: number
    kneeAngle: number
    ankleAngle: number
    releaseHeight: number // inches above standing height
    releaseAngle: number
    entryAngle: number
  }
  keyTraits: string[]
  shootingStyle: string
}

export const ELITE_SHOOTERS: EliteShooterData[] = [
  {
    id: "allan-houston",
    name: "Allan Houston",
    team: "New York Knicks (Retired)",
    position: "SHOOTING_GUARD",
    height: 78, // 6'6"
    wingspan: 81,
    weight: 200,
    bodyType: "LEAN",
    careerThreePointPct: 40.2,
    careerFreeThrowPct: 86.6,
    biomechanics: {
      shoulderAngle: 172,
      elbowAngle: 88,
      hipAngle: 175,
      kneeAngle: 142,
      ankleAngle: 88,
      releaseHeight: 112,
      releaseAngle: 52,
      entryAngle: 47,
    },
    keyTraits: ["Textbook form", "High release point", "Consistent elbow alignment", "Smooth follow-through"],
    shootingStyle: "Classic mid-range specialist with exceptional fundamentals",
  },
  {
    id: "stephen-curry",
    name: "Stephen Curry",
    team: "Golden State Warriors",
    position: "POINT_GUARD",
    height: 75, // 6'3"
    wingspan: 79,
    weight: 185,
    bodyType: "LEAN",
    careerThreePointPct: 42.6,
    careerFreeThrowPct: 91.0,
    biomechanics: {
      shoulderAngle: 168,
      elbowAngle: 90,
      hipAngle: 170,
      kneeAngle: 138,
      ankleAngle: 85,
      releaseHeight: 105,
      releaseAngle: 48,
      entryAngle: 45,
    },
    keyTraits: ["Quick release", "Deep range", "Off-balance accuracy", "One-motion shot"],
    shootingStyle: "Quick release with incredible range and shot-making ability",
  },
  {
    id: "klay-thompson",
    name: "Klay Thompson",
    team: "Dallas Mavericks",
    position: "SHOOTING_GUARD",
    height: 78, // 6'6"
    wingspan: 81,
    weight: 215,
    bodyType: "ATHLETIC",
    careerThreePointPct: 41.3,
    careerFreeThrowPct: 85.3,
    biomechanics: {
      shoulderAngle: 170,
      elbowAngle: 89,
      hipAngle: 172,
      kneeAngle: 140,
      ankleAngle: 87,
      releaseHeight: 110,
      releaseAngle: 50,
      entryAngle: 46,
    },
    keyTraits: ["Catch-and-shoot specialist", "Perfect square-up", "Minimal wasted motion", "Elite footwork"],
    shootingStyle: "Pure catch-and-shoot form with textbook mechanics",
  },
  {
    id: "kevin-durant",
    name: "Kevin Durant",
    team: "Phoenix Suns",
    position: "SMALL_FORWARD",
    height: 83, // 6'11"
    wingspan: 89,
    weight: 240,
    bodyType: "LEAN",
    careerThreePointPct: 38.7,
    careerFreeThrowPct: 88.3,
    biomechanics: {
      shoulderAngle: 175,
      elbowAngle: 92,
      hipAngle: 178,
      kneeAngle: 148,
      ankleAngle: 90,
      releaseHeight: 125,
      releaseAngle: 55,
      entryAngle: 50,
    },
    keyTraits: ["Unblockable release point", "Length advantage", "Mid-range mastery", "Versatile scoring"],
    shootingStyle: "High release leveraging exceptional length for uncontestable shots",
  },
  {
    id: "ray-allen",
    name: "Ray Allen",
    team: "Multiple Teams (Retired)",
    position: "SHOOTING_GUARD",
    height: 77, // 6'5"
    wingspan: 80,
    weight: 205,
    bodyType: "ATHLETIC",
    careerThreePointPct: 40.0,
    careerFreeThrowPct: 89.4,
    biomechanics: {
      shoulderAngle: 171,
      elbowAngle: 87,
      hipAngle: 174,
      kneeAngle: 141,
      ankleAngle: 86,
      releaseHeight: 108,
      releaseAngle: 51,
      entryAngle: 46,
    },
    keyTraits: ["Perfect mechanics", "Exceptional conditioning", "Clutch shooting", "Off-screen movement"],
    shootingStyle: "Model shooting form with legendary conditioning and preparation",
  },
  {
    id: "reggie-miller",
    name: "Reggie Miller",
    team: "Indiana Pacers (Retired)",
    position: "SHOOTING_GUARD",
    height: 79, // 6'7"
    wingspan: 82,
    weight: 195,
    bodyType: "LEAN",
    careerThreePointPct: 39.5,
    careerFreeThrowPct: 88.8,
    biomechanics: {
      shoulderAngle: 169,
      elbowAngle: 86,
      hipAngle: 173,
      kneeAngle: 139,
      ankleAngle: 84,
      releaseHeight: 109,
      releaseAngle: 49,
      entryAngle: 45,
    },
    keyTraits: ["Quick release", "Elite off-ball movement", "Clutch performer", "Mental toughness"],
    shootingStyle: "Quick trigger with exceptional movement off screens",
  },
]

// Calculate similarity between user's biomechanics and elite shooter
export function calculateBiomechanicalSimilarity(
  userBiomechanics: EliteShooterData["biomechanics"],
  shooterBiomechanics: EliteShooterData["biomechanics"]
): number {
  const weights = {
    shoulderAngle: 0.12,
    elbowAngle: 0.18,
    hipAngle: 0.10,
    kneeAngle: 0.15,
    ankleAngle: 0.10,
    releaseHeight: 0.15,
    releaseAngle: 0.12,
    entryAngle: 0.08,
  }

  let totalScore = 0

  for (const [key, weight] of Object.entries(weights)) {
    const userValue = userBiomechanics[key as keyof typeof userBiomechanics]
    const shooterValue = shooterBiomechanics[key as keyof typeof shooterBiomechanics]

    // Calculate percentage similarity (closer = higher score)
    const diff = Math.abs(userValue - shooterValue)
    const maxDiff = key.includes("Angle") ? 30 : 20 // Max expected difference
    const similarity = Math.max(0, 100 - (diff / maxDiff) * 100)

    totalScore += similarity * weight
  }

  return Math.round(totalScore)
}

// Find best matching elite shooters based on body type and biomechanics
export function findMatchingShooters(
  userBodyType: string,
  userHeight: number,
  userBiomechanics: EliteShooterData["biomechanics"],
  limit: number = 3
): Array<{ shooter: EliteShooterData; similarityScore: number; bodyTypeMatch: boolean }> {
  const results = ELITE_SHOOTERS.map((shooter) => {
    const biomechanicalSimilarity = calculateBiomechanicalSimilarity(userBiomechanics, shooter.biomechanics)
    const bodyTypeMatch = shooter.bodyType === userBodyType
    const heightDiff = Math.abs(shooter.height - userHeight)

    // Boost score for body type match and similar height
    let adjustedScore = biomechanicalSimilarity
    if (bodyTypeMatch) adjustedScore += 5
    if (heightDiff <= 3) adjustedScore += 5
    else if (heightDiff <= 6) adjustedScore += 2

    return {
      shooter,
      similarityScore: Math.min(100, adjustedScore),
      bodyTypeMatch,
    }
  })

  // Sort by similarity score and return top matches
  return results.sort((a, b) => b.similarityScore - a.similarityScore).slice(0, limit)
}

// Get shooter by ID
export function getShooterById(id: string): EliteShooterData | undefined {
  return ELITE_SHOOTERS.find((s) => s.id === id)
}

