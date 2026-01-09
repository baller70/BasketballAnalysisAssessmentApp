/**
 * LLM Provider Configuration
 * 
 * This file contains the configuration for all LLM providers used in the hybrid routing system.
 * Each provider has different rate limits, costs, and capabilities.
 * 
 * Enhanced with:
 * - Groq #2 (second account for doubled capacity)
 * - Quality scores for smart routing
 * - Task-specific capabilities
 */

export interface LLMProvider {
  name: string;
  displayName: string;
  priority: number;
  enabled: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  models: string[];
  costPerRequest: number; // Estimated cost in USD
  qualityScore: number; // 1-10, higher is better quality
  capabilities: {
    coaching: boolean;
    creative: boolean;
    analysis: boolean;
    general: boolean;
  };
  apiKeyEnvVar: string; // Environment variable name for API key
}

export const LLM_PROVIDERS: Record<string, LLMProvider> = {
  google: {
    name: 'google',
    displayName: 'Google AI Studio',
    priority: 1,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 1500,
    },
    models: ['gemini-2.0-flash-exp', 'gemini-1.5-flash'],
    costPerRequest: 0, // Free tier
    qualityScore: 9,
    capabilities: {
      coaching: true,
      creative: true,
      analysis: true,
      general: true,
    },
    apiKeyEnvVar: 'GOOGLE_AI_API_KEY',
  },
  groq: {
    name: 'groq',
    displayName: 'Groq Cloud #1',
    priority: 2,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
    },
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    costPerRequest: 0, // Free tier
    qualityScore: 8,
    capabilities: {
      coaching: true,
      creative: true,
      analysis: true,
      general: true,
    },
    apiKeyEnvVar: 'GROQ_API_KEY',
  },
  groq2: {
    name: 'groq2',
    displayName: 'Groq Cloud #2',
    priority: 3,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
    },
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    costPerRequest: 0, // Free tier
    qualityScore: 8,
    capabilities: {
      coaching: true,
      creative: true,
      analysis: true,
      general: true,
    },
    apiKeyEnvVar: 'GROQ_API_KEY_2',
  },
  huggingface: {
    name: 'huggingface',
    displayName: 'Hugging Face',
    priority: 4,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerDay: 2000,
    },
    models: ['meta-llama/Llama-3.1-8B-Instruct', 'google/gemma-2-9b-it'],
    costPerRequest: 0, // Free tier
    qualityScore: 7,
    capabilities: {
      coaching: true,
      creative: true,
      analysis: false,
      general: true,
    },
    apiKeyEnvVar: 'HUGGINGFACE_API_KEY',
  },
  cloudflare: {
    name: 'cloudflare',
    displayName: 'Cloudflare Workers AI',
    priority: 5,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerDay: 75, // ~10,000 neurons / 130 neurons per request
    },
    models: ['@cf/meta/llama-3-8b-instruct', '@cf/google/gemma-7b-it-lora'],
    costPerRequest: 0, // Free tier
    qualityScore: 6,
    capabilities: {
      coaching: true,
      creative: false,
      analysis: false,
      general: true,
    },
    apiKeyEnvVar: 'CLOUDFLARE_AI_API_KEY',
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (Fallback)',
    priority: 6,
    enabled: true, // Keep as ultimate fallback
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    },
    models: ['gpt-4o-mini', 'gpt-4o'],
    costPerRequest: 0.001, // ~$0.001 per request for gpt-4o-mini
    qualityScore: 10,
    capabilities: {
      coaching: true,
      creative: true,
      analysis: true,
      general: true,
    },
    apiKeyEnvVar: 'OPENAI_API_KEY',
  },
};

export type TaskType = 'coaching' | 'creative' | 'analysis' | 'general';

export const getEnabledProviders = (): LLMProvider[] => {
  return Object.values(LLM_PROVIDERS)
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);
};

export const getProviderByName = (name: string): LLMProvider | undefined => {
  return LLM_PROVIDERS[name];
};

/**
 * Get providers optimized for a specific task type
 * Returns providers sorted by capability + quality for the task
 */
export const getProvidersForTask = (taskType: TaskType): LLMProvider[] => {
  return Object.values(LLM_PROVIDERS)
    .filter(p => p.enabled && p.capabilities[taskType])
    .sort((a, b) => {
      // Sort by quality score first, then priority
      if (b.qualityScore !== a.qualityScore) {
        return b.qualityScore - a.qualityScore;
      }
      return a.priority - b.priority;
    });
};

/**
 * Calculate total daily capacity across all providers
 */
export const getTotalDailyCapacity = (): number => {
  return Object.values(LLM_PROVIDERS)
    .filter(p => p.enabled && p.costPerRequest === 0)
    .reduce((total, p) => total + p.rateLimit.requestsPerDay, 0);
};

