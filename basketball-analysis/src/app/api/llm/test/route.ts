/**
 * LLM Provider Test API
 * 
 * Tests each LLM provider individually to verify configuration.
 * 
 * GET /api/llm/test
 * Returns test results for all providers
 */

import { NextResponse } from 'next/server';

interface TestResult {
  name: string;
  status: 'success' | 'error' | 'skipped';
  responseTime?: number;
  message?: string;
  model?: string;
}

async function testGoogleAI(): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  
  if (!apiKey) {
    return { name: 'Google AI Studio', status: 'skipped', message: 'GOOGLE_AI_API_KEY not configured' };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: 'Say "test successful" in exactly 2 words.' }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      return { name: 'Google AI Studio', status: 'error', message: error, responseTime };
    }
    
    await response.json();
    return { name: 'Google AI Studio', status: 'success', responseTime, model: 'gemini-2.0-flash-exp' };
  } catch (error: unknown) {
    return { name: 'Google AI Studio', status: 'error', message: (error as Error).message };
  }
}

async function testGroq(keyName: string, displayName: string): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = process.env[keyName];
  
  if (!apiKey) {
    return { name: displayName, status: 'skipped', message: `${keyName} not configured` };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: 'Say "test successful" in exactly 2 words.' }],
        max_tokens: 10,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      return { name: displayName, status: 'error', message: error, responseTime };
    }
    
    await response.json();
    return { name: displayName, status: 'success', responseTime, model: 'llama-3.1-8b-instant' };
  } catch (error: unknown) {
    return { name: displayName, status: 'error', message: (error as Error).message };
  }
}

async function testHuggingFace(): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  
  if (!apiKey) {
    return { name: 'Hugging Face', status: 'skipped', message: 'HUGGINGFACE_API_KEY not configured' };
  }

  try {
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
          messages: [{ role: 'user', content: 'Say "test successful" in exactly 2 words.' }],
          max_tokens: 10,
        }),
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      return { name: 'Hugging Face', status: 'error', message: error, responseTime };
    }
    
    await response.json();
    return { name: 'Hugging Face', status: 'success', responseTime, model: 'meta-llama/llama-3.1-8b-instruct' };
  } catch (error: unknown) {
    return { name: 'Hugging Face', status: 'error', message: (error as Error).message };
  }
}

async function testCloudflare(): Promise<TestResult> {
  const startTime = Date.now();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_AI_API_KEY;
  
  if (!accountId) {
    return { name: 'Cloudflare Workers AI', status: 'skipped', message: 'CLOUDFLARE_ACCOUNT_ID not configured' };
  }
  if (!apiKey) {
    return { name: 'Cloudflare Workers AI', status: 'skipped', message: 'CLOUDFLARE_AI_API_KEY not configured' };
  }

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
          messages: [{ role: 'user', content: 'Say "test successful" in exactly 2 words.' }],
          max_tokens: 10,
        }),
      }
    );
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      return { name: 'Cloudflare Workers AI', status: 'error', message: error, responseTime };
    }
    
    await response.json();
    return { name: 'Cloudflare Workers AI', status: 'success', responseTime, model: '@cf/meta/llama-3-8b-instruct' };
  } catch (error: unknown) {
    return { name: 'Cloudflare Workers AI', status: 'error', message: (error as Error).message };
  }
}

async function testOpenAI(): Promise<TestResult> {
  const startTime = Date.now();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return { name: 'OpenAI (Fallback)', status: 'skipped', message: 'OPENAI_API_KEY not configured' };
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: 'Say "test successful" in exactly 2 words.' }],
        max_tokens: 10,
      }),
    });
    
    const responseTime = Date.now() - startTime;
    
    if (!response.ok) {
      const error = await response.text();
      return { name: 'OpenAI (Fallback)', status: 'error', message: error, responseTime };
    }
    
    await response.json();
    return { name: 'OpenAI (Fallback)', status: 'success', responseTime, model: 'gpt-4o-mini' };
  } catch (error: unknown) {
    return { name: 'OpenAI (Fallback)', status: 'error', message: (error as Error).message };
  }
}

export async function GET() {
  console.log('[LLM Test] Running provider tests...');
  
  // Run all tests in parallel
  const results = await Promise.all([
    testGoogleAI(),
    testGroq('GROQ_API_KEY', 'Groq Cloud #1'),
    testGroq('GROQ_API_KEY_2', 'Groq Cloud #2'),
    testHuggingFace(),
    testCloudflare(),
    testOpenAI(),
  ]);

  // Generate summary
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const skippedCount = results.filter(r => r.status === 'skipped').length;

  // Calculate total daily capacity for working providers
  const capacityMap: Record<string, number> = {
    'Google AI Studio': 1500,
    'Groq Cloud #1': 14400,
    'Groq Cloud #2': 14400,
    'Hugging Face': 2000,
    'Cloudflare Workers AI': 75,
    'OpenAI (Fallback)': 10000,
  };

  const totalFreeCapacity = results
    .filter(r => r.status === 'success' && r.name !== 'OpenAI (Fallback)')
    .reduce((sum, r) => sum + (capacityMap[r.name] || 0), 0);

  const summary = {
    success: successCount,
    error: errorCount,
    skipped: skippedCount,
    total: results.length,
    freeProvidersWorking: results.filter(r => r.status === 'success' && r.name !== 'OpenAI (Fallback)').length,
    totalFreeDailyCapacity: totalFreeCapacity,
  };

  const statusEmoji: Record<string, string> = {
    success: '✅',
    error: '❌',
    skipped: '⏭️',
  };

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
    summary,
    results: results.map(r => ({
      ...r,
      emoji: statusEmoji[r.status],
    })),
    recommendations: [
      successCount === 0 ? '⚠️ No providers working! Check your API keys.' : null,
      errorCount > 0 ? `⚠️ ${errorCount} provider(s) have errors. Check the messages above.` : null,
      skippedCount > 0 ? `ℹ️ ${skippedCount} provider(s) not configured. Add API keys to enable them.` : null,
      successCount >= 3 ? '✅ Good redundancy! Multiple providers available for failover.' : null,
      totalFreeCapacity > 30000 ? `🎉 Excellent! ${totalFreeCapacity.toLocaleString()} free requests/day available.` : null,
    ].filter(Boolean),
  });
}

