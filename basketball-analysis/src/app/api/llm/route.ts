/**
 * Enhanced LLM API Route - Smart Multi-Provider Router
 * 
 * This endpoint provides access to the hybrid LLM system that routes requests
 * through multiple FREE providers to minimize costs.
 * 
 * Features:
 * - 6 providers (Google, Groq #1, Groq #2, Hugging Face, Cloudflare, OpenAI)
 * - Response caching (30-50% reduction in API calls)
 * - Request queuing for traffic spikes
 * - Health monitoring
 * - Retry logic with exponential backoff
 * 
 * POST /api/llm
 * Body: { 
 *   messages: [...], 
 *   maxTokens?: number, 
 *   temperature?: number,
 *   taskType?: 'coaching' | 'creative' | 'analysis' | 'general',
 *   priority?: 'high' | 'normal' | 'low',
 *   skipCache?: boolean
 * }
 * 
 * GET /api/llm
 * Returns comprehensive router status including health, cache, and queue stats
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  routeLLMRequest,
  getRouterStatus,
  getTotalDailyCapacity,
  type LLMRequest,
  type TaskType
} from '@/lib/llm';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
  // Rate limit: 30 LLM requests per minute per IP.
  const { response: limited } = checkRateLimit(request, {
    bucket: 'llm',
    limit: 30,
    windowMs: 60_000,
  });
  if (limited) return limited;

  try {
    const body = await request.json();
    
    // Validate request
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Validate message format
    for (const msg of body.messages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json(
          { success: false, error: 'Each message must have role and content' },
          { status: 400 }
        );
      }
      if (!['system', 'user', 'assistant'].includes(msg.role)) {
        return NextResponse.json(
          { success: false, error: 'Message role must be system, user, or assistant' },
          { status: 400 }
        );
      }
    }

    // Validate optional parameters
    const validTaskTypes: TaskType[] = ['coaching', 'creative', 'analysis', 'general'];
    const validPriorities = ['high', 'normal', 'low'];

    if (body.taskType && !validTaskTypes.includes(body.taskType)) {
      return NextResponse.json(
        { success: false, error: `taskType must be one of: ${validTaskTypes.join(', ')}` },
        { status: 400 }
      );
    }

    if (body.priority && !validPriorities.includes(body.priority)) {
      return NextResponse.json(
        { success: false, error: `priority must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    const llmRequest: LLMRequest = {
      messages: body.messages,
      maxTokens: body.maxTokens || 1024,
      temperature: body.temperature ?? 0.7,
      taskType: body.taskType,
      priority: body.priority,
      skipCache: body.skipCache || false,
    };

    const response = await routeLLMRequest(llmRequest);

    return NextResponse.json({
      success: true,
      content: response.content,
      provider: response.provider,
      model: response.model,
      cached: response.cached || false,
      responseTime: response.responseTime,
      usage: response.usage,
    });

  } catch (error) {
    console.error('[LLM API] Error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        hint: 'Check that at least one LLM provider API key is configured in .env.local'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const status = getRouterStatus();
    const totalCapacity = getTotalDailyCapacity();
    
    return NextResponse.json({
      success: true,
      message: 'Enhanced LLM Router Status',
      totalDailyCapacity: totalCapacity,
      ...status,
      requiredEnvVars: [
        { name: 'GOOGLE_AI_API_KEY', description: 'Google AI Studio API key (FREE)', priority: 1 },
        { name: 'GROQ_API_KEY', description: 'Groq Cloud #1 API key (FREE)', priority: 2 },
        { name: 'GROQ_API_KEY_2', description: 'Groq Cloud #2 API key (FREE)', priority: 3 },
        { name: 'HUGGINGFACE_API_KEY', description: 'Hugging Face API token (FREE)', priority: 4 },
        { name: 'CLOUDFLARE_ACCOUNT_ID', description: 'Cloudflare Account ID', priority: 5 },
        { name: 'CLOUDFLARE_AI_API_KEY', description: 'Cloudflare AI API key (FREE)', priority: 5 },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key (paid fallback)', priority: 6 },
      ],
      features: [
        'Response caching (30-50% reduction in API calls)',
        'Request queuing for traffic spikes',
        'Health monitoring with automatic recovery',
        'Retry logic with exponential backoff',
        'Smart task-based provider selection',
        'Groq #2 account for doubled capacity',
      ],
    });

  } catch (error) {
    console.error('[LLM API] Status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get router status' },
      { status: 500 }
    );
  }
}

