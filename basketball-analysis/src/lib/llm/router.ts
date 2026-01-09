/**
 * Enhanced Smart LLM Router
 * 
 * Routes requests to the best available LLM provider based on:
 * 1. Provider availability (rate limits)
 * 2. Provider priority (cost optimization)
 * 3. Provider health (success rates)
 * 4. Task-specific routing
 * 5. Fallback handling with retries
 * 
 * Features:
 * - Response caching (30-50% reduction in API calls)
 * - Request queuing for traffic spikes
 * - Health monitoring with automatic recovery
 * - Retry logic with exponential backoff
 * - Smart task-based provider selection
 * 
 * Priority order:
 * 1. Google AI Studio (Gemini) - FREE, 60 req/min
 * 2. Groq Cloud #1 - FREE, 30 req/min, fastest inference
 * 3. Groq Cloud #2 - FREE, 30 req/min (second account)
 * 4. Hugging Face - FREE, 200 req/5min
 * 5. Cloudflare Workers AI - FREE, limited neurons
 * 6. OpenAI (fallback) - Paid, but reliable
 */

import { LLM_PROVIDERS, getEnabledProviders, getProvidersForTask, TaskType } from './providers';
import { checkRateLimit, incrementRateLimit, getAllRateLimitStatus } from './rate-limiter';
import { generateCacheKey, getCachedResponse, setCachedResponse, determineTTL, getCacheStats } from './cache';
import { recordSuccess, recordFailure, isProviderHealthy, getAllProviderHealth, getSystemHealthSummary } from './health';
import { setRequestProcessor, enqueueRequest, getQueueStats, isQueueAvailable } from './queue';

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
  taskType?: TaskType; // For smart routing
  priority?: 'high' | 'normal' | 'low'; // For queue priority
  skipCache?: boolean; // Force fresh response
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  cached?: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  responseTime?: number;
}

// Retry configuration
const MAX_RETRIES = 2;
const RETRY_DELAY_BASE = 1000; // 1 second base delay

// Provider-specific API calls
async function callGoogleAI(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: request.messages.map(m => ({
          role: m.role === 'assistant' ? 'model' : m.role === 'system' ? 'user' : m.role,
          parts: [{ text: m.content }],
        })),
        generationConfig: {
          maxOutputTokens: request.maxTokens || 1024,
          temperature: request.temperature || 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google AI error: ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!content) throw new Error('No content in Google AI response');

  return {
    content,
    provider: 'google',
    model: 'gemini-2.0-flash-exp',
    usage: {
      promptTokens: data.usageMetadata?.promptTokenCount || 0,
      completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
      totalTokens: data.usageMetadata?.totalTokenCount || 0,
    },
  };
}

async function callGroq(request: LLMRequest, apiKeyEnvVar: string = 'GROQ_API_KEY'): Promise<LLMResponse> {
  const apiKey = process.env[apiKeyEnvVar];
  if (!apiKey) throw new Error(`${apiKeyEnvVar} not configured`);

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      messages: request.messages,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Groq error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('No content in Groq response');

  return {
    content,
    provider: apiKeyEnvVar === 'GROQ_API_KEY_2' ? 'groq2' : 'groq',
    model: 'llama-3.1-8b-instant',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

async function callGroq2(request: LLMRequest): Promise<LLMResponse> {
  return callGroq(request, 'GROQ_API_KEY_2');
}

async function callHuggingFace(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

  const response = await fetch(
    'https://router.huggingface.co/novita/v3/openai/chat/completions',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.1-8b-instruct',
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
        temperature: request.temperature || 0.7,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`HuggingFace error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('No content in HuggingFace response');

  return {
    content: content.trim(),
    provider: 'huggingface',
    model: 'meta-llama/llama-3.1-8b-instruct',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

async function callCloudflare(request: LLMRequest): Promise<LLMResponse> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_AI_API_KEY;
  
  if (!accountId || !apiKey) throw new Error('Cloudflare credentials not configured');

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        messages: request.messages,
        max_tokens: request.maxTokens || 1024,
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Cloudflare error: ${error}`);
  }

  const data = await response.json();
  const content = data.result?.response;

  if (!content) throw new Error('No content in Cloudflare response');

  return {
    content,
    provider: 'cloudflare',
    model: '@cf/meta/llama-3-8b-instruct',
  };
}

async function callOpenAI(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: request.messages,
      max_tokens: request.maxTokens || 1024,
      temperature: request.temperature || 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI error: ${error}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) throw new Error('No content in OpenAI response');

  return {
    content,
    provider: 'openai',
    model: 'gpt-4o-mini',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

// Provider call map
const providerCalls: Record<string, (request: LLMRequest) => Promise<LLMResponse>> = {
  google: callGoogleAI,
  groq: callGroq,
  groq2: callGroq2,
  huggingface: callHuggingFace,
  cloudflare: callCloudflare,
  openai: callOpenAI,
};

/**
 * Call a provider with retry logic and exponential backoff
 */
async function callProviderWithRetry(
  providerName: string,
  request: LLMRequest,
  maxRetries: number = MAX_RETRIES
): Promise<LLMResponse> {
  const callFn = providerCalls[providerName];
  if (!callFn) throw new Error(`Unknown provider: ${providerName}`);

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const response = await callFn(request);
      const responseTime = Date.now() - startTime;
      
      // Record success
      recordSuccess(providerName, responseTime);
      
      return { ...response, responseTime };
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on rate limit errors - move to next provider
      if (lastError.message.includes('rate limit') || lastError.message.includes('429')) {
        throw lastError;
      }
      
      // Don't retry on auth errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError;
      }
      
      // Exponential backoff for transient errors
      if (attempt < maxRetries) {
        const delay = RETRY_DELAY_BASE * Math.pow(2, attempt);
        console.log(`[LLM Router] Retry ${attempt + 1}/${maxRetries} for ${providerName} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  // Record failure after all retries exhausted
  recordFailure(providerName, lastError?.message || 'Unknown error');
  throw lastError;
}

/**
 * Internal routing logic (used by queue processor)
 */
async function routeLLMRequestInternal(request: LLMRequest): Promise<LLMResponse> {
  // Get providers based on task type if specified
  const providers = request.taskType
    ? getProvidersForTask(request.taskType)
    : getEnabledProviders();
  
  const errors: string[] = [];

  for (const provider of providers) {
    // Skip unhealthy providers
    if (!isProviderHealthy(provider.name)) {
      console.log(`[LLM Router] Skipping unhealthy provider: ${provider.displayName}`);
      errors.push(`${provider.name}: unhealthy`);
      continue;
    }

    // Check rate limits
    const withinLimits = checkRateLimit(
      provider.name,
      provider.rateLimit.requestsPerMinute,
      provider.rateLimit.requestsPerDay
    );

    if (!withinLimits) {
      console.log(`[LLM Router] ${provider.displayName} rate limited, trying next...`);
      errors.push(`${provider.name}: rate limited`);
      continue;
    }

    try {
      console.log(`[LLM Router] Trying ${provider.displayName}...`);
      const response = await callProviderWithRetry(provider.name, request);
      
      // Success! Increment rate limit counter
      incrementRateLimit(provider.name);
      
      console.log(`[LLM Router] Success with ${provider.displayName} (${response.responseTime}ms)`);
      return response;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error(`[LLM Router] ${provider.displayName} failed:`, errorMsg);
      errors.push(`${provider.name}: ${errorMsg}`);
      continue;
    }
  }

  // All providers failed
  throw new Error(`All LLM providers failed. Errors: ${errors.join('; ')}`);
}

// Set up queue processor
setRequestProcessor(routeLLMRequestInternal);

/**
 * Smart LLM Router (Main Entry Point)
 * 
 * Features:
 * - Response caching
 * - Request queuing during traffic spikes
 * - Health-aware routing
 * - Retry logic with exponential backoff
 */
export async function routeLLMRequest(request: LLMRequest): Promise<LLMResponse> {
  // Check cache first (unless skipCache is set)
  if (!request.skipCache) {
    const cacheKey = generateCacheKey(request.messages, {
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
    
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return {
        ...cachedResponse,
        cached: true,
      };
    }
  }

  // Route the request
  let response: LLMResponse;
  
  // Use queue for traffic management if queue is available
  if (isQueueAvailable() && request.priority) {
    response = await enqueueRequest(request, request.priority);
  } else {
    response = await routeLLMRequestInternal(request);
  }

  // Cache the response
  if (!request.skipCache) {
    const cacheKey = generateCacheKey(request.messages, {
      maxTokens: request.maxTokens,
      temperature: request.temperature,
    });
    const ttl = determineTTL(request.messages);
    setCachedResponse(cacheKey, {
      content: response.content,
      provider: response.provider,
      model: response.model,
    }, ttl);
  }

  return response;
}

/**
 * Simple text completion helper
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: { 
    maxTokens?: number; 
    temperature?: number;
    taskType?: TaskType;
    skipCache?: boolean;
  }
): Promise<string> {
  const response = await routeLLMRequest({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
    taskType: options?.taskType,
    skipCache: options?.skipCache,
  });

  return response.content;
}

/**
 * Get comprehensive router status
 */
export function getRouterStatus(): {
  providers: Array<{
    name: string;
    displayName: string;
    enabled: boolean;
    priority: number;
    healthy: boolean;
  }>;
  cache: ReturnType<typeof getCacheStats>;
  queue: ReturnType<typeof getQueueStats>;
  health: ReturnType<typeof getSystemHealthSummary>;
  rateLimits: ReturnType<typeof getAllRateLimitStatus>;
} {
  return {
    providers: getEnabledProviders().map(p => ({
      name: p.name,
      displayName: p.displayName,
      enabled: p.enabled,
      priority: p.priority,
      healthy: isProviderHealthy(p.name),
    })),
    cache: getCacheStats(),
    queue: getQueueStats(),
    health: getSystemHealthSummary(),
    rateLimits: getAllRateLimitStatus(),
  };
}

/**
 * Get detailed provider health
 */
export function getProviderHealthDetails() {
  return getAllProviderHealth();
}

