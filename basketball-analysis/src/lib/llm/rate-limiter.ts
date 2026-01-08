/**
 * Simple in-memory rate limiter for LLM providers
 * 
 * Tracks request counts per provider to avoid hitting rate limits.
 * In production, you'd want to use Redis or a similar distributed cache.
 */

interface RateLimitEntry {
  minuteCount: number;
  minuteReset: number;
  dayCount: number;
  dayReset: number;
}

const rateLimits: Map<string, RateLimitEntry> = new Map();

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

  // Check if we're within limits
  if (entry.minuteCount >= maxPerMinute || entry.dayCount >= maxPerDay) {
    return false;
  }

  return true;
}

export function incrementRateLimit(providerName: string): void {
  const entry = rateLimits.get(providerName);
  if (entry) {
    entry.minuteCount++;
    entry.dayCount++;
  }
}

export function getRateLimitStatus(providerName: string): {
  minuteRemaining: number;
  dayRemaining: number;
} | null {
  const entry = rateLimits.get(providerName);
  if (!entry) return null;

  return {
    minuteRemaining: Math.max(0, entry.minuteReset - Date.now()),
    dayRemaining: Math.max(0, entry.dayReset - Date.now()),
  };
}

export function resetRateLimits(): void {
  rateLimits.clear();
}
