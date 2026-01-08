/**
 * Smart LLM Router
 * 
 * Routes requests to the best available LLM provider based on:
 * 1. Provider availability (rate limits)
 * 2. Provider priority (cost optimization)
 * 3. Fallback handling
 * 
 * Priority order:
 * 1. Google AI Studio (Gemini) - FREE, 60 req/min
 * 2. Groq Cloud - FREE, 30 req/min, fastest inference
 * 3. Hugging Face - FREE, 200 req/5min
 * 4. Cloudflare Workers AI - FREE, limited neurons
 * 5. OpenAI (fallback) - Paid, but reliable
 */

import { LLM_PROVIDERS, getEnabledProviders } from './providers';
import { checkRateLimit, incrementRateLimit } from './rate-limiter';

export interface LLMRequest {
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  content: string;
  provider: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Provider-specific API calls
async function callGoogleAI(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not configured');

  // Use gemini-2.0-flash-exp or gemini-1.5-flash-latest for latest model
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

async function callGroq(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // Fast and free
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
    provider: 'groq',
    model: 'llama-3.1-8b-instant',
    usage: {
      promptTokens: data.usage?.prompt_tokens || 0,
      completionTokens: data.usage?.completion_tokens || 0,
      totalTokens: data.usage?.total_tokens || 0,
    },
  };
}

async function callHuggingFace(request: LLMRequest): Promise<LLMResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY not configured');

  // Use the new router.huggingface.co endpoint with OpenAI-compatible format
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
      model: 'gpt-4o-mini', // Cheapest option
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
  huggingface: callHuggingFace,
  cloudflare: callCloudflare,
  openai: callOpenAI,
};

/**
 * Smart LLM Router
 * 
 * Tries providers in priority order, falling back if one fails or is rate-limited.
 */
export async function routeLLMRequest(request: LLMRequest): Promise<LLMResponse> {
  const providers = getEnabledProviders();
  const errors: string[] = [];

  for (const provider of providers) {
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

    // Check if API key is configured
    const callFn = providerCalls[provider.name];
    if (!callFn) {
      errors.push(`${provider.name}: no call function`);
      continue;
    }

    try {
      console.log(`[LLM Router] Trying ${provider.displayName}...`);
      const response = await callFn(request);
      
      // Success! Increment rate limit counter
      incrementRateLimit(provider.name);
      
      console.log(`[LLM Router] Success with ${provider.displayName}`);
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

/**
 * Simple text completion helper
 */
export async function generateText(
  systemPrompt: string,
  userPrompt: string,
  options?: { maxTokens?: number; temperature?: number }
): Promise<string> {
  const response = await routeLLMRequest({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    maxTokens: options?.maxTokens,
    temperature: options?.temperature,
  });

  return response.content;
}

/**
 * Get current router status
 */
export function getRouterStatus(): {
  providers: Array<{
    name: string;
    displayName: string;
    enabled: boolean;
    priority: number;
  }>;
} {
  return {
    providers: getEnabledProviders().map(p => ({
      name: p.name,
      displayName: p.displayName,
      enabled: p.enabled,
      priority: p.priority,
    })),
  };
}
