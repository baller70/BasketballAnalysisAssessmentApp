/**
 * Enhanced Rate Limiter for LLM Providers
 * 
 * Tracks request counts per provider to avoid hitting rate limits.
 * 
 * Features:
 * - Per-minute and per-day limits
 * - Automatic window reset
 * - Rate limit status reporting
 * - Comprehensive status API
 * 
 * Note: This uses in-memory storage which resets on server restart.
 * For production with multiple instances, move to a shared store
 * (e.g. Redis / Upstash) by replacing the Map operations with
 * get/set calls against that store.
 *
 * Current implementation is suitable for:
 * - Single instance deployments
 * - Serverless with short-lived functions
 * - Development and testing
 */

interface RateLimitEntry {
  minuteCount: number;
  minuteReset: number;
  dayCount: number;
  dayReset: number;
}

interface RateLimitStatus {
  minuteRemaining: number;
  dayRemaining: number;
  minuteUsed: number;
  dayUsed: number;
  minuteLimit: number;
  dayLimit: number;
  isLimited: boolean;
  resetInSeconds: number;
}

const rateLimits: Map<string, RateLimitEntry> = new Map();

// Store limits for reference
const providerLimits: Map<string, { minute: number; day: number }> = new Map();

/**
 * Initialize rate limits for a provider
 */
export function initializeRateLimit(
  providerName: string,
  maxPerMinute: number,
  maxPerDay: number
): void {
  providerLimits.set(providerName, { minute: maxPerMinute, day: maxPerDay });
}

/**
 * Check if a request is within rate limits
 */
export function checkRateLimit(
  providerName: string,
  maxPerMinute: number,
  maxPerDay: number
): boolean {
  const now = Date.now();
  const minuteWindow = 60 * 1000; // 1 minute
  const dayWindow = 24 * 60 * 60 * 1000; // 24 hours

  let entry = rateLimits.get(providerName);

  if (!entry) {
    entry = {
      minuteCount: 0,
      minuteReset: now + minuteWindow,
      dayCount: 0,
      dayReset: now + dayWindow,
    };
    rateLimits.set(providerName, entry);
  }

  // Reset minute counter if window expired
  if (now > entry.minuteReset) {
    entry.minuteCount = 0;
    entry.minuteReset = now + minuteWindow;
  }

  // Reset day counter if window expired
  if (now > entry.dayReset) {
    entry.dayCount = 0;
    entry.dayReset = now + dayWindow;
  }

  // Store limits for status reporting
  providerLimits.set(providerName, { minute: maxPerMinute, day: maxPerDay });

  // Check if we're within limits
  if (entry.minuteCount >= maxPerMinute || entry.dayCount >= maxPerDay) {
    return false;
  }

  return true;
}

/**
 * Increment the rate limit counter after a successful request
 */
export function incrementRateLimit(providerName: string): void {
  const entry = rateLimits.get(providerName);
  if (entry) {
    entry.minuteCount++;
    entry.dayCount++;
  }
}

/**
 * Get detailed rate limit status for a provider
 */
export function getRateLimitStatus(providerName: string): RateLimitStatus | null {
  const entry = rateLimits.get(providerName);
  const limits = providerLimits.get(providerName);
  
  if (!entry || !limits) {
    return null;
  }

  const now = Date.now();
  const minuteRemaining = Math.max(0, limits.minute - entry.minuteCount);
  const dayRemaining = Math.max(0, limits.day - entry.dayCount);
  const resetInSeconds = Math.max(0, Math.ceil((entry.minuteReset - now) / 1000));

  return {
    minuteRemaining,
    dayRemaining,
    minuteUsed: entry.minuteCount,
    dayUsed: entry.dayCount,
    minuteLimit: limits.minute,
    dayLimit: limits.day,
    isLimited: minuteRemaining === 0 || dayRemaining === 0,
    resetInSeconds,
  };
}

/**
 * Get rate limit status for all providers
 */
export function getAllRateLimitStatus(): Record<string, RateLimitStatus> {
  const status: Record<string, RateLimitStatus> = {};
  
  for (const providerName of providerLimits.keys()) {
    const providerStatus = getRateLimitStatus(providerName);
    if (providerStatus) {
      status[providerName] = providerStatus;
    }
  }
  
  return status;
}

/**
 * Reset rate limits for a specific provider
 */
export function resetProviderRateLimit(providerName: string): void {
  rateLimits.delete(providerName);
  console.log(`[RateLimit] Reset rate limits for ${providerName}`);
}

/**
 * Reset all rate limits
 */
export function resetAllRateLimits(): void {
  rateLimits.clear();
  console.log('[RateLimit] All rate limits reset');
}

/**
 * Get total remaining capacity across all providers
 */
export function getTotalRemainingCapacity(): {
  minuteRemaining: number;
  dayRemaining: number;
} {
  let minuteRemaining = 0;
  let dayRemaining = 0;
  
  for (const providerName of providerLimits.keys()) {
    const status = getRateLimitStatus(providerName);
    if (status) {
      minuteRemaining += status.minuteRemaining;
      dayRemaining += status.dayRemaining;
    }
  }
  
  return { minuteRemaining, dayRemaining };
}

/**
 * Check if any provider has capacity
 */
export function hasAnyCapacity(): boolean {
  for (const providerName of providerLimits.keys()) {
    const status = getRateLimitStatus(providerName);
    if (status && !status.isLimited) {
      return true;
    }
  }
  return false;
}

