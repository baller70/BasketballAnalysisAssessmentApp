/**
 * LLM Module Exports
 * 
 * Enhanced LLM routing system with:
 * - Multi-provider support (Google, Groq #1, Groq #2, Hugging Face, Cloudflare, OpenAI)
 * - Response caching (30-50% reduction in API calls)
 * - Request queuing for traffic spikes
 * - Health monitoring with automatic recovery
 * - Retry logic with exponential backoff
 * - Smart task-based provider selection
 * 
 * Total FREE daily capacity: ~32,000+ requests
 * - Google AI Studio: 1,500/day
 * - Groq #1: 14,400/day
 * - Groq #2: 14,400/day
 * - Hugging Face: 2,000/day
 * - Cloudflare: 75/day
 */

// Main router exports
export { 
  routeLLMRequest, 
  generateText, 
  getRouterStatus,
  getProviderHealthDetails,
} from './router';

export type { LLMRequest, LLMResponse } from './router';

// Provider configuration
export { 
  LLM_PROVIDERS, 
  getEnabledProviders,
  getProvidersForTask,
  getTotalDailyCapacity,
} from './providers';

export type { LLMProvider, TaskType } from './providers';

// Cache utilities
export {
  getCacheStats,
  clearCache,
  CACHE_TTL,
} from './cache';

// Health monitoring
export {
  getAllProviderHealth,
  getSystemHealthSummary,
  resetProviderHealth,
  resetAllHealth,
} from './health';

export type { ProviderHealth } from './health';

// Rate limiting
export {
  getAllRateLimitStatus,
  getTotalRemainingCapacity,
  hasAnyCapacity,
  resetAllRateLimits,
} from './rate-limiter';

// Queue management
export {
  getQueueStats,
  getQueueSize,
  isQueueAvailable,
  clearQueue,
} from './queue';
