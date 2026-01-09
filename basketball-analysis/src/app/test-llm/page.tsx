'use client';

/**
 * LLM Router Test Page
 * 
 * This page allows you to test the hybrid LLM routing system
 * and see which provider handles each request.
 */

import { useState, useEffect } from 'react';

interface LLMResponse {
  success: boolean;
  content?: string;
  provider?: string;
  model?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  hint?: string;
}

interface RouterStatus {
  success: boolean;
  providers?: Array<{
    name: string;
    displayName: string;
    enabled: boolean;
    priority: number;
  }>;
  requiredEnvVars?: Array<{
    name: string;
    description: string;
  }>;
}

export default function TestLLMPage() {
  const [prompt, setPrompt] = useState('What are 3 tips for improving my basketball shooting form?');
  const [response, setResponse] = useState<LLMResponse | null>(null);
  const [status, setStatus] = useState<RouterStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);

  // Fetch router status on mount
  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/llm');
      const data = await res.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    } finally {
      setStatusLoading(false);
    }
  };

  const testLLM = async () => {
    setLoading(true);
    setResponse(null);

    try {
      const res = await fetch('/api/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: 'You are a helpful basketball coach assistant.' },
            { role: 'user', content: prompt },
          ],
          maxTokens: 500,
          temperature: 0.7,
        }),
      });

      const data = await res.json();
      setResponse(data);
    } catch (error) {
      setResponse({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">🤖 LLM Router Test</h1>
          <p className="text-gray-400">
            Test the hybrid LLM routing system. Requests are routed through multiple FREE providers.
          </p>
        </div>

        {/* Router Status */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Router Status
            <button
              onClick={fetchStatus}
              className="text-sm text-blue-400 hover:text-blue-300"
            >
              (refresh)
            </button>
          </h2>

          {statusLoading ? (
            <div className="text-gray-400">Loading status...</div>
          ) : status?.providers ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {status.providers.map((provider) => (
                  <div
                    key={provider.name}
                    className={`p-4 rounded-lg border ${
                      provider.enabled
                        ? 'bg-green-900/20 border-green-700'
                        : 'bg-gray-800 border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{provider.displayName}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          provider.enabled
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-600 text-gray-300'
                        }`}
                      >
                        Priority {provider.priority}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mt-1">
                      {provider.enabled ? '✅ Enabled' : '❌ Disabled'}
                    </div>
                  </div>
                ))}
              </div>

              {status.requiredEnvVars && (
                <div className="mt-4 p-4 bg-gray-900/50 rounded-lg">
                  <h3 className="font-medium mb-2">Required Environment Variables:</h3>
                  <ul className="text-sm text-gray-400 space-y-1">
                    {status.requiredEnvVars.map((env) => (
                      <li key={env.name}>
                        <code className="text-orange-400">{env.name}</code> - {env.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="text-red-400">Failed to load status</div>
          )}
        </div>

        {/* Test Form */}
        <div className="bg-gray-800/50 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">🧪 Test Request</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-white"
                placeholder="Enter your prompt..."
              />
            </div>

            <button
              onClick={testLLM}
              disabled={loading || !prompt.trim()}
              className={`w-full py-3 rounded-lg font-semibold transition-all ${
                loading || !prompt.trim()
                  ? 'bg-gray-600 cursor-not-allowed'
                  : 'bg-orange-600 hover:bg-orange-500'
              }`}
            >
              {loading ? '⏳ Processing...' : '🚀 Send Request'}
            </button>
          </div>
        </div>

        {/* Response */}
        {response && (
          <div
            className={`rounded-xl p-6 border ${
              response.success
                ? 'bg-green-900/20 border-green-700'
                : 'bg-red-900/20 border-red-700'
            }`}
          >
            <h2 className="text-xl font-semibold mb-4">
              {response.success ? '✅ Response' : '❌ Error'}
            </h2>

            {response.success ? (
              <div className="space-y-4">
                {/* Provider Info */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-blue-600 rounded-full text-sm">
                    Provider: {response.provider}
                  </span>
                  <span className="px-3 py-1 bg-purple-600 rounded-full text-sm">
                    Model: {response.model}
                  </span>
                  {response.usage && (
                    <span className="px-3 py-1 bg-gray-600 rounded-full text-sm">
                      Tokens: {response.usage.totalTokens}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="bg-gray-900/50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-gray-200">
                    {response.content}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-400">{response.error}</p>
                {response.hint && (
                  <p className="text-yellow-400 text-sm">💡 {response.hint}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 p-6 bg-gray-800/30 rounded-xl border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">📖 How It Works</h2>
          <div className="text-gray-400 space-y-2">
            <p>
              The LLM router tries providers in priority order (1 → 5). If a provider
              fails or is rate-limited, it automatically falls back to the next one.
            </p>
            <p>
              <strong className="text-white">Priority Order:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-4">
              <li>Google AI Studio (Gemini) - FREE, 60 req/min</li>
              <li>Groq Cloud (Llama 3.1) - FREE, 30 req/min, fastest</li>
              <li>Hugging Face (Llama 3.1) - FREE, 200 req/5min</li>
              <li>Cloudflare Workers AI (Llama 3) - FREE, limited</li>
              <li>OpenAI (GPT-4o-mini) - Paid fallback</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

