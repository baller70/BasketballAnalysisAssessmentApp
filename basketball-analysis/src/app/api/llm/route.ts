/**
 * LLM API Route - Smart Multi-Provider Router
 * 
 * This endpoint provides access to the hybrid LLM system that routes requests
 * through multiple FREE providers to minimize costs.
 * 
 * POST /api/llm
 * Body: { messages: [...], maxTokens?: number, temperature?: number }
 * 
 * GET /api/llm
 * Returns the current router status and available providers
 */

import { NextRequest, NextResponse } from 'next/server';
import { routeLLMRequest, getRouterStatus, type LLMRequest } from '@/lib/llm';

export async function POST(request: NextRequest) {
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

    const llmRequest: LLMRequest = {
      messages: body.messages,
      maxTokens: body.maxTokens || 1024,
      temperature: body.temperature ?? 0.7,
    };

    const response = await routeLLMRequest(llmRequest);

    return NextResponse.json({
      success: true,
      content: response.content,
      provider: response.provider,
      model: response.model,
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
    
    return NextResponse.json({
      success: true,
      message: 'LLM Router Status',
      ...status,
      requiredEnvVars: [
        { name: 'GOOGLE_AI_API_KEY', description: 'Google AI Studio API key (FREE)' },
        { name: 'GROQ_API_KEY', description: 'Groq Cloud API key (FREE)' },
        { name: 'HUGGINGFACE_API_KEY', description: 'Hugging Face API token (FREE)' },
        { name: 'CLOUDFLARE_ACCOUNT_ID', description: 'Cloudflare Account ID' },
        { name: 'CLOUDFLARE_AI_API_KEY', description: 'Cloudflare AI API key (FREE)' },
        { name: 'OPENAI_API_KEY', description: 'OpenAI API key (paid fallback)' },
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
