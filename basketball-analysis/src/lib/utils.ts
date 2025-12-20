/**
 * @file utils.ts
 * @description Utility functions used throughout the basketball analysis app
 * 
 * PURPOSE:
 * - Provides common utility functions for the entire application
 * - Includes Tailwind class merging, file conversions, formatting
 * 
 * MAIN FUNCTIONS:
 * - cn(...classes) - Merge Tailwind classes with conflict resolution
 * - fileToBase64(file) - Convert File to base64 string
 * - formatDate(date) - Format date for display
 * - formatNumber(num) - Format numbers with commas
 * - debounce(fn, delay) - Debounce function calls
 * - clamp(value, min, max) - Clamp number to range
 * 
 * USAGE:
 * import { cn, fileToBase64, formatDate } from "@/lib/utils"
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes with conflict resolution
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * Formats height string to standardized format
 */
export function formatHeight(height: string): string {
  if (!height) return ""
  // Convert height to standardized format (e.g., "6'2\"")
  return height.trim()
}

/**
 * Formats weight string to standardized format
 */
export function formatWeight(weight: string): string {
  if (!weight) return ""
  // Convert weight to standardized format
  return weight.trim()
}

/**
 * Calculates similarity score between user and reference shooter measurements
 * @param userMeasurements - User's biomechanical measurements
 * @param shooterMeasurements - Reference shooter's measurements
 * @returns Similarity score as percentage (0-100)
 */
export function calculateSimilarityScore(
  userMeasurements: Record<string, number>,
  shooterMeasurements: Record<string, number>
): number {
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

/**
 * Determines form category based on overall score
 */
export function getFormCategory(score: number): string {
  if (score >= 90) return "OPTIMAL"
  if (score >= 75) return "GOOD"
  if (score >= 50) return "NEEDS_IMPROVEMENT"
  return "CRITICAL"
}

/**
 * Returns Tailwind color class for form category
 */
export function getFormCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    OPTIMAL: "text-green-500",
    GOOD: "text-green-400",
    NEEDS_IMPROVEMENT: "text-yellow-500",
    CRITICAL: "text-red-500",
  }
  return colors[category] || "text-gray-500"
}

/**
 * Returns Tailwind classes for severity level
 */
export function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    MINOR: "bg-blue-500/20 text-blue-400 border-blue-500/50",
    MODERATE: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
    MAJOR: "bg-orange-500/20 text-orange-400 border-orange-500/50",
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/50",
  }
  return colors[severity] || "bg-gray-500/20 text-gray-400 border-gray-500/50"
}

/**
 * Formats angle value with degree symbol
 */
export function formatAngle(angle: number | null | undefined): string {
  if (angle === null || angle === undefined) return "N/A"
  return `${angle.toFixed(1)}°`
}

/**
 * Formats percentage value
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return "N/A"
  return `${value.toFixed(1)}%`
}

/**
 * Converts a File to base64 string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converts a File to data URL (includes prefix)
 */
export async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Debounce function for performance optimization
 */
export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), wait)
  }
}

/**
 * Throttle function for rate limiting
 */
export function throttle<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Clamps a number between min and max values
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * Formats bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes"
  
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Safely parses JSON with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T
  } catch {
    return fallback
  }
}

/**
 * Checks if value is a valid number
 */
export function isValidNumber(value: unknown): value is number {
  return typeof value === "number" && !isNaN(value) && isFinite(value)
}

/**
 * Sleep utility for async operations
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
