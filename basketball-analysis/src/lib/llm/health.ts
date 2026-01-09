/**
 * Provider Health Monitoring
 * 
 * Tracks the health and performance of each LLM provider:
 * - Success/failure rates
 * - Average response times
 * - Error patterns
 * - Uptime tracking
 */

export interface ProviderHealth {
  name: string;
  successCount: number;
  failureCount: number;
  totalRequests: number;
  avgResponseTime: number;
  lastResponseTime: number;
  lastSuccess: number | null;
  lastFailure: number | null;
  lastError: string | null;
  uptime: number; // Percentage
  consecutiveFailures: number;
  isHealthy: boolean;
}

interface HealthEntry {
  successCount: number;
  failureCount: number;
  responseTimes: number[];
  lastSuccess: number | null;
  lastFailure: number | null;
  lastError: string | null;
  consecutiveFailures: number;
}

// Health tracking storage
const healthData: Map<string, HealthEntry> = new Map();

// Maximum response times to track (for rolling average)
const MAX_RESPONSE_TIMES = 100;

// Threshold for marking provider as unhealthy
const UNHEALTHY_THRESHOLD = 5; // consecutive failures

/**
 * Record a successful request
 */
export function recordSuccess(providerName: string, responseTime: number): void {
  const entry = getOrCreateEntry(providerName);
  
  entry.successCount++;
  entry.lastSuccess = Date.now();
  entry.consecutiveFailures = 0;
  
  // Track response time (rolling window)
  entry.responseTimes.push(responseTime);
  if (entry.responseTimes.length > MAX_RESPONSE_TIMES) {
    entry.responseTimes.shift();
  }
  
  console.log(`[Health] ${providerName} SUCCESS - ${responseTime}ms`);
}

/**
 * Record a failed request
 */
export function recordFailure(providerName: string, error: string): void {
  const entry = getOrCreateEntry(providerName);
  
  entry.failureCount++;
  entry.lastFailure = Date.now();
  entry.lastError = error;
  entry.consecutiveFailures++;
  
  console.log(`[Health] ${providerName} FAILURE - ${error} (${entry.consecutiveFailures} consecutive)`);
}

/**
 * Get or create a health entry for a provider
 */
function getOrCreateEntry(providerName: string): HealthEntry {
  let entry = healthData.get(providerName);
  
  if (!entry) {
    entry = {
      successCount: 0,
      failureCount: 0,
      responseTimes: [],
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      consecutiveFailures: 0,
    };
    healthData.set(providerName, entry);
  }
  
  return entry;
}

/**
 * Get health status for a specific provider
 */
export function getProviderHealth(providerName: string): ProviderHealth {
  const entry = healthData.get(providerName);
  
  if (!entry) {
    return {
      name: providerName,
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      lastResponseTime: 0,
      lastSuccess: null,
      lastFailure: null,
      lastError: null,
      uptime: 100,
      consecutiveFailures: 0,
      isHealthy: true,
    };
  }
  
  const totalRequests = entry.successCount + entry.failureCount;
  const avgResponseTime = entry.responseTimes.length > 0
    ? entry.responseTimes.reduce((a, b) => a + b, 0) / entry.responseTimes.length
    : 0;
  const lastResponseTime = entry.responseTimes.length > 0
    ? entry.responseTimes[entry.responseTimes.length - 1]
    : 0;
  const uptime = totalRequests > 0
    ? (entry.successCount / totalRequests) * 100
    : 100;
  
  return {
    name: providerName,
    successCount: entry.successCount,
    failureCount: entry.failureCount,
    totalRequests,
    avgResponseTime: Math.round(avgResponseTime),
    lastResponseTime: Math.round(lastResponseTime),
    lastSuccess: entry.lastSuccess,
    lastFailure: entry.lastFailure,
    lastError: entry.lastError,
    uptime: Math.round(uptime * 100) / 100,
    consecutiveFailures: entry.consecutiveFailures,
    isHealthy: entry.consecutiveFailures < UNHEALTHY_THRESHOLD,
  };
}

/**
 * Get health status for all providers
 */
export function getAllProviderHealth(): ProviderHealth[] {
  const providers = ['google', 'groq', 'groq2', 'huggingface', 'cloudflare', 'openai'];
  return providers.map(name => getProviderHealth(name));
}

/**
 * Check if a provider is currently healthy
 */
export function isProviderHealthy(providerName: string): boolean {
  const entry = healthData.get(providerName);
  if (!entry) return true; // Assume healthy if no data
  
  return entry.consecutiveFailures < UNHEALTHY_THRESHOLD;
}

/**
 * Get a summary of system health
 */
export function getSystemHealthSummary(): {
  totalRequests: number;
  totalSuccesses: number;
  totalFailures: number;
  overallUptime: number;
  healthyProviders: number;
  unhealthyProviders: string[];
} {
  const allHealth = getAllProviderHealth();
  
  const totalRequests = allHealth.reduce((sum, h) => sum + h.totalRequests, 0);
  const totalSuccesses = allHealth.reduce((sum, h) => sum + h.successCount, 0);
  const totalFailures = allHealth.reduce((sum, h) => sum + h.failureCount, 0);
  const overallUptime = totalRequests > 0 ? (totalSuccesses / totalRequests) * 100 : 100;
  
  const unhealthyProviders = allHealth
    .filter(h => !h.isHealthy)
    .map(h => h.name);
  
  return {
    totalRequests,
    totalSuccesses,
    totalFailures,
    overallUptime: Math.round(overallUptime * 100) / 100,
    healthyProviders: allHealth.length - unhealthyProviders.length,
    unhealthyProviders,
  };
}

/**
 * Reset health data for a provider (useful after fixing issues)
 */
export function resetProviderHealth(providerName: string): void {
  healthData.delete(providerName);
  console.log(`[Health] Reset health data for ${providerName}`);
}

/**
 * Reset all health data
 */
export function resetAllHealth(): void {
  healthData.clear();
  console.log('[Health] All health data reset');
}

