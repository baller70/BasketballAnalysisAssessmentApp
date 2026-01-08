/**
 * LLM Provider Test API
 * 
 * GET /api/llm/test - Tests each provider individually and returns status
 */

import { NextResponse } from 'next/server';

interface ProviderTestResult {
  name: string;
  status: 'success' | 'error';
  message?: string;
  responseTime?: number;
}

async function testGoogle(): Promise<ProviderTestResult> {
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return { name: 'Google AI Studio', status: 'error', message: 'GOOGLE_AI_API_KEY not set' };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "Hello" in one word.' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { name: 'Google AI Studio', status: 'error', message: error.slice(0, 200) };
    }

    return { name: 'Google AI Studio', status: 'success', responseTime: Date.now() - start };
  } catch (error) {
    return { name: 'Google AI Studio', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testGroq(): Promise<ProviderTestResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { name: 'Groq Cloud', status: 'error', message: 'GROQ_API_KEY not set' };
  }

  const start = Date.now();
  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
        max_tokens: 10,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return { name: 'Groq Cloud', status: 'error', message: error.slice(0, 200) };
    }

    return { name: 'Groq Cloud', status: 'success', responseTime: Date.now() - start };
  } catch (error) {
    return { name: 'Groq Cloud', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testHuggingFace(): Promise<ProviderTestResult> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return { name: 'Hugging Face', status: 'error', message: 'HUGGINGFACE_API_KEY not set' };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.3/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mistral-7B-Instruct-v0.3',
          messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
          max_tokens: 10,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { name: 'Hugging Face', status: 'error', message: error.slice(0, 200) };
    }

    return { name: 'Hugging Face', status: 'success', responseTime: Date.now() - start };
  } catch (error) {
    return { name: 'Hugging Face', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

async function testCloudflare(): Promise<ProviderTestResult> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_AI_API_KEY;
  
  if (!accountId) {
    return { name: 'Cloudflare Workers AI', status: 'error', message: 'CLOUDFLARE_ACCOUNT_ID not set' };
  }
  if (!apiKey) {
    return { name: 'Cloudflare Workers AI', status: 'error', message: 'CLOUDFLARE_AI_API_KEY not set' };
  }

  const start = Date.now();
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          messages: [{ role: 'user', content: 'Say "Hello" in one word.' }],
          max_tokens: 10,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      return { name: 'Cloudflare Workers AI', status: 'error', message: error.slice(0, 200) };
    }

    return { name: 'Cloudflare Workers AI', status: 'success', responseTime: Date.now() - start };
  } catch (error) {
    return { name: 'Cloudflare Workers AI', status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function GET() {
  // Run all tests in parallel
  const results = await Promise.all([
    testGoogle(),
    testGroq(),
    testHuggingFace(),
    testCloudflare(),
  ]);

  const summary = {
    google: results[0].status === 'success' ? '✅' : '❌',
    groq: results[1].status === 'success' ? '✅' : '❌',
    huggingface: results[2].status === 'success' ? '✅' : '❌',
    cloudflare: results[3].status === 'success' ? '✅' : '❌',
  };

  return NextResponse.json({
    success: true,
    summary,
    details: results,
    timestamp: new Date().toISOString(),
  });
}
