import type { MedalTier } from "@/components/icons/MedalIcons"

/**
 * Determines medal tier based on performance score
 * @param score - Overall performance score (0-100)
 * @returns Medal tier
 */
export function getMedalTier(score: number): MedalTier {
  if (score >= 90) return "gold"
  if (score >= 75) return "silver"
  if (score >= 60) return "bronze"
  if (score >= 45) return "copper"
  return "iron"
}

/**
 * Determines medal tier based on status and optional score
 * Falls back to score-based ranking if status is not provided
 */
export function getMedalTierFromStatus(
  status: "good" | "warning" | "critical",
  score?: number
): MedalTier {
  // If score is provided, use score-based ranking
  if (score !== undefined) {
    return getMedalTier(score)
  }
  
  // Fall back to status-based ranking
  switch (status) {
    case "good":
      return "gold"
    case "warning":
      return "bronze"
    case "critical":
      return "iron"
    default:
      return "bronze"
  }
}

/**
 * Gets medal tier based on angle measurements
 * Evaluates multiple angles to determine overall form quality
 */
export function getMedalTierFromAngles(angles?: Record<string, number>): MedalTier {
  if (!angles || Object.keys(angles).length === 0) {
    return "bronze" // Default if no angles
  }
  
  let optimalCount = 0
  let totalCount = 0
  
  // Check key angles for optimal ranges
  const angleChecks: Array<{ key: string; optimal: [number, number] }> = [
    { key: "elbow_angle", optimal: [80, 110] },
    { key: "right_elbow_angle", optimal: [80, 110] },
    { key: "left_elbow_angle", optimal: [80, 110] },
    { key: "knee_angle", optimal: [130, 170] },
    { key: "right_knee_angle", optimal: [130, 170] },
    { key: "left_knee_angle", optimal: [130, 170] },
  ]
  
  for (const check of angleChecks) {
    const angle = angles[check.key]
    if (angle !== undefined) {
      totalCount++
      if (angle >= check.optimal[0] && angle <= check.optimal[1]) {
        optimalCount++
      }
    }
  }
  
  if (totalCount === 0) return "bronze"
  
  const optimalRatio = optimalCount / totalCount
  
  if (optimalRatio >= 0.8) return "gold"
  if (optimalRatio >= 0.6) return "silver"
  if (optimalRatio >= 0.4) return "bronze"
  if (optimalRatio >= 0.2) return "copper"
  return "iron"
}








