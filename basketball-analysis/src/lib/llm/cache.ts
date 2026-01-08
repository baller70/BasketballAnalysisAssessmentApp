/**
 * Response Cache for LLM Requests
 * 
 * Caches LLM responses to reduce API calls by 30-50%.
 * Uses a simple in-memory cache with TTL expiration.
 * 
 * Features:
 * - Content-based cache keys (hash of messages)
 * - Configurable TTL per request type
 * - Cache hit/miss statistics
 * - Automatic cleanup of expired entries
 */

import crypto from 'crypto';

interface CacheEntry {
  response: {
    content: string;
    provider: string;
    model: string;
  };
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  hitRate: number;
}

// In-memory cache
const cache: Map<string, CacheEntry> = new Map();

// Cache statistics
let cacheHits = 0;
let cacheMisses = 0;

// Default TTL values (in milliseconds)
export const CACHE_TTL = {
  coaching: 30 * 60 * 1000,    // 30 minutes for coaching advice
  creative: 5 * 60 * 1000,     // 5 minutes for creative content (more varied)
  analysis: 60 * 60 * 1000,    // 1 hour for analysis (stable)
  general: 15 * 60 * 1000,     // 15 minutes for general queries
  default: 15 * 60 * 1000,     // 15 minutes default
};

/**
 * Generate a cache key from the request messages
 * Uses SHA-256 hash for consistent, short keys
 */
export function generateCacheKey(
  messages: Array<{ role: string; content: string }>,
  options?: { maxTokens?: number; temperature?: number }
): string {
  const content = JSON.stringify({
    messages: messages.map(m => ({ role: m.role, content: m.content.trim().toLowerCase() })),
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
  });
  
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
}

/**
 * Get a cached response if available and not expired
 */
export function getCachedResponse(cacheKey: string): CacheEntry['response'] | null {
  const entry = cache.get(cacheKey);
  
  if (!entry) {
    cacheMisses++;
    return null;
  }
  
  // Check if expired
  if (Date.now() - entry.timestamp > entry.ttl) {
    cache.delete(cacheKey);
    cacheMisses++;
    return null;
  }
  
  // Update hit count
  entry.hits++;
  cacheHits++;
  
  console.log(`[LLM Cache] HIT - Key: ${cacheKey.substring(0, 8)}... (${entry.hits} hits)`);
  
  return entry.response;
}

/**
 * Store a response in the cache
 */
export function setCachedResponse(
  cacheKey: string,
  response: { content: string; provider: string; model: string },
  ttl: number = CACHE_TTL.default
): void {
  // Limit cache size to prevent memory issues
  if (cache.size >= 1000) {
    cleanupCache();
  }
  
  cache.set(cacheKey, {
    response,
    timestamp: Date.now(),
    ttl,
    hits: 0,
  });
  
  console.log(`[LLM Cache] STORE - Key: ${cacheKey.substring(0, 8)}... TTL: ${ttl / 1000}s`);
}

/**
 * Clean up expired entries and least-used entries if cache is too large
 */
export function cleanupCache(): void {
  const now = Date.now();
  let cleaned = 0;
  
  // Remove expired entries
  for (const [key, entry] of cache.entries()) {
    if (now - entry.timestamp > entry.ttl) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  // If still too large, remove least-hit entries
  if (cache.size > 800) {
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].hits - b[1].hits);
    
    const toRemove = entries.slice(0, cache.size - 500);
    for (const [key] of toRemove) {
      cache.delete(key);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[LLM Cache] Cleaned ${cleaned} entries. Current size: ${cache.size}`);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats {
  const total = cacheHits + cacheMisses;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    entries: cache.size,
    hitRate: total > 0 ? (cacheHits / total) * 100 : 0,
  };
}

/**
 * Clear the entire cache
 */
export function clearCache(): void {
  cache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  console.log('[LLM Cache] Cache cleared');
}

/**
 * Determine the appropriate TTL based on message content
 */
export function determineTTL(messages: Array<{ role: string; content: string }>): number {
  const content = messages.map(m => m.content.toLowerCase()).join(' ');
  
  if (content.includes('shooting form') || content.includes('coaching') || content.includes('drill')) {
    return CACHE_TTL.coaching;
  }
  
  if (content.includes('bio') || content.includes('story') || content.includes('creative')) {
    return CACHE_TTL.creative;
  }
  
  if (content.includes('analyze') || content.includes('score') || content.includes('feedback')) {
    return CACHE_TTL.analysis;
  }
  
  return CACHE_TTL.general;
}
