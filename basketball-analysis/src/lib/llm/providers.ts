/**
 * LLM Provider Configuration
 * 
 * This file contains the configuration for all LLM providers used in the hybrid routing system.
 * Each provider has different rate limits, costs, and capabilities.
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
    models: ['gemini-1.5-flash', 'gemini-1.5-pro'],
    costPerRequest: 0, // Free tier
  },
  groq: {
    name: 'groq',
    displayName: 'Groq Cloud',
    priority: 2,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 30,
      requestsPerDay: 14400,
    },
    models: ['llama-3.1-70b-versatile', 'llama-3.1-8b-instant', 'gemma2-9b-it'],
    costPerRequest: 0, // Free tier
  },
  huggingface: {
    name: 'huggingface',
    displayName: 'Hugging Face',
    priority: 3,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 200,
      requestsPerDay: 2000,
    },
    models: ['meta-llama/Llama-3.1-8B-Instruct', 'google/gemma-2-9b-it'],
    costPerRequest: 0, // Free tier
  },
  cloudflare: {
    name: 'cloudflare',
    displayName: 'Cloudflare Workers AI',
    priority: 4,
    enabled: true,
    rateLimit: {
      requestsPerMinute: 10,
      requestsPerDay: 75, // ~10,000 neurons / 130 neurons per request
    },
    models: ['@cf/meta/llama-3-8b-instruct', '@cf/google/gemma-7b-it-lora'],
    costPerRequest: 0, // Free tier
  },
  openai: {
    name: 'openai',
    displayName: 'OpenAI (Fallback)',
    priority: 5,
    enabled: true, // Keep as ultimate fallback
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerDay: 10000,
    },
    models: ['gpt-4o-mini', 'gpt-4o'],
    costPerRequest: 0.001, // ~$0.001 per request for gpt-4o-mini
  },
};

export const getEnabledProviders = (): LLMProvider[] => {
  return Object.values(LLM_PROVIDERS)
    .filter(p => p.enabled)
    .sort((a, b) => a.priority - b.priority);
};

export const getProviderByName = (name: string): LLMProvider | undefined => {
  return LLM_PROVIDERS[name];
};
