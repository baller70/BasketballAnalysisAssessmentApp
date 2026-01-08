/**
 * LLM Module - Hybrid Multi-Provider LLM Router
 * 
 * This module provides a smart routing system that uses multiple FREE LLM providers
 * to minimize costs while maintaining high availability.
 * 
 * Provider Priority:
 * 1. Google AI Studio (Gemini 1.5 Flash) - FREE, 60 req/min
 * 2. Groq Cloud (Llama 3.1) - FREE, 30 req/min, fastest inference
 * 3. Hugging Face (Llama 3.1) - FREE, 200 req/5min
 * 4. Cloudflare Workers AI (Llama 3) - FREE, 10,000 neurons/day
 * 5. OpenAI (GPT-4o-mini) - Paid fallback
 * 
 * Usage:
 * ```typescript
 * import { generateText, routeLLMRequest } from '@/lib/llm';
 * 
 * // Simple text generation
 * const response = await generateText(
 *   'You are a helpful assistant.',
 *   'What is the capital of France?'
 * );
 * 
 * // Full control
 * const result = await routeLLMRequest({
 *   messages: [
 *     { role: 'system', content: 'You are a basketball coach.' },
 *     { role: 'user', content: 'How do I improve my shooting form?' },
 *   ],
 *   maxTokens: 500,
 *   temperature: 0.7,
 * });
 * ```
 */

export { routeLLMRequest, generateText, getRouterStatus } from './router';
export type { LLMRequest, LLMResponse } from './router';
export { LLM_PROVIDERS, getEnabledProviders, getProviderByName } from './providers';
export type { LLMProvider } from './providers';
export { checkRateLimit, incrementRateLimit, getRateLimitStatus, resetRateLimits } from './rate-limiter';
