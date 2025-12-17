import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatHeight(height: string): string {
  // Convert height to standardized format
  return height
}

export function formatWeight(weight: string): string {
  // Convert weight to standardized format
  return weight
}

export function calculateSimilarityScore(
  userMeasurements: Record<string, number>,
  shooterMeasurements: Record<string, number>
): number {
  // Calculate similarity score between user and reference shooter
  const keys = Object.keys(userMeasurements)
  if (keys.length === 0) return 0

  let totalDiff = 0
  let count = 0

  keys.forEach((key) => {
    if (shooterMeasurements[key] !== undefined) {
      const diff = Math.abs(userMeasurements[key] - shooterMeasurements[key])
      totalDiff += diff
      count++
    }
  })

  if (count === 0) return 0
  const avgDiff = totalDiff / count
  // Convert to percentage (lower diff = higher similarity)
  return Math.max(0, 100 - avgDiff)
}

export function getFormCategory(score: number): string {
  if (score >= 90) return "OPTIMAL"
  if (score >= 75) return "GOOD"
  if (score >= 50) return "NEEDS_IMPROVEMENT"
  return "CRITICAL"
}

export function getFormCategoryColor(category: string): string {
  switch (category) {
    case "OPTIMAL":
      return "text-green-500"
    case "GOOD":
      return "text-green-400"
    case "NEEDS_IMPROVEMENT":
      return "text-yellow-500"
    case "CRITICAL":
      return "text-red-500"
    default:
      return "text-gray-500"
  }
}

export function getSeverityColor(severity: string): string {
  switch (severity) {
    case "MINOR":
      return "bg-blue-500/20 text-blue-400 border-blue-500/50"
    case "MODERATE":
      return "bg-yellow-500/20 text-yellow-400 border-yellow-500/50"
    case "MAJOR":
      return "bg-orange-500/20 text-orange-400 border-orange-500/50"
    case "CRITICAL":
      return "bg-red-500/20 text-red-400 border-red-500/50"
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/50"
  }
}

export function formatAngle(angle: number | null | undefined): string {
  if (angle === null || angle === undefined) return "N/A"
  return `${angle.toFixed(1)}°`
}

export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A"
  return `${value.toFixed(1)}%`
}

