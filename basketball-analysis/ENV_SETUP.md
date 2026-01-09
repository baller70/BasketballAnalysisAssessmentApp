# 🔑 LLM API Keys Setup Guide

This guide explains how to get FREE API keys for the hybrid LLM system.

## Quick Start

Add these environment variables to your `.env.local` file:

```bash
# === FREE LLM PROVIDERS (Priority Order) ===

# 1. Google AI Studio (FREE - 60 req/min, 1,500/day)
GOOGLE_AI_API_KEY=your_google_ai_key_here

# 2. Groq Cloud (FREE - 30 req/min, fastest inference)
GROQ_API_KEY=your_groq_key_here

# 3. Hugging Face (FREE - 200 req/5min)
HUGGINGFACE_API_KEY=your_huggingface_key_here

# 4. Cloudflare Workers AI (FREE - 10,000 neurons/day)
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_AI_API_KEY=your_cloudflare_ai_key

# === PAID FALLBACK ===

# 5. OpenAI (Paid - only used if all free providers fail)
OPENAI_API_KEY=your_openai_key_here
```

---

## 📋 Step-by-Step: Get Your FREE API Keys

### 1️⃣ Google AI Studio (RECOMMENDED - Primary)

**Limits:** 60 requests/minute, 1,500 requests/day (FREE)

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Click "Get API Key" in the top right
4. Click "Create API Key"
5. Copy the key and add to `.env.local` as `GOOGLE_AI_API_KEY`

### 2️⃣ Groq Cloud (RECOMMENDED - Fastest)

**Limits:** 30 requests/minute, ~14,400 requests/day (FREE)

1. Go to [Groq Console](https://console.groq.com/)
2. Sign up for a free account
3. Go to "API Keys" in the sidebar
4. Click "Create API Key"
5. Copy the key and add to `.env.local` as `GROQ_API_KEY`

### 3️⃣ Hugging Face (Backup)

**Limits:** 1,000 requests/5 minutes (FREE)

1. Go to [Hugging Face](https://huggingface.co/)
2. Sign up for a free account
3. Go to Settings → Access Tokens
4. Click "New token" → Select "Read" permission
5. Copy the token and add to `.env.local` as `HUGGINGFACE_API_KEY`

### 4️⃣ Cloudflare Workers AI (Emergency Fallback)

**Limits:** 10,000 neurons/day (~75 requests) (FREE)

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Sign up for a free account
3. Get your Account ID from the dashboard URL or Overview page
4. Go to "AI" in the sidebar → "Workers AI"
5. Create an API token with AI permissions
6. Add both to `.env.local`:
   - `CLOUDFLARE_ACCOUNT_ID`
   - `CLOUDFLARE_AI_API_KEY`

### 5️⃣ OpenAI (Paid Fallback - Optional)

**Cost:** ~$0.001 per request with GPT-4o-mini

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Sign up and add payment method
3. Go to API Keys → Create new secret key
4. Copy the key and add to `.env.local` as `OPENAI_API_KEY`

---

## 🎯 Minimum Setup (Recommended)

For most use cases, you only need **2 providers**:

```bash
# Minimum recommended setup
GOOGLE_AI_API_KEY=your_google_key
GROQ_API_KEY=your_groq_key
```

This gives you:
- **~16,000 FREE requests/day**
- **~90 requests/minute** capacity
- Automatic failover between providers

---

## 📊 Capacity Summary

| Provider | Free Requests/Day | Speed | Priority |
|----------|------------------|-------|----------|
| Google AI | 1,500 | Fast | 1 (Primary) |
| Groq | 14,400 | Fastest | 2 |
| Hugging Face | ~2,000 | Medium | 3 |
| Cloudflare | ~75 | Medium | 4 |
| OpenAI | Unlimited (paid) | Fast | 5 (Fallback) |

**Total FREE capacity: ~18,000 requests/day = ~3,600 users/day (at 5 requests/user)**

---

## 🔧 Testing Your Setup

After adding your API keys, test the system:

```bash
# Start your dev server
npm run dev

# Test the LLM endpoint
curl -X POST http://localhost:3000/api/llm \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello, how are you?"}]}'
```

You should see a response with the provider that handled the request.

---

## ❓ Troubleshooting

### "All LLM providers failed"
- Check that at least one API key is correctly set in `.env.local`
- Restart your dev server after adding keys
- Check the console logs for specific error messages

### Rate limit errors
- The system automatically falls back to the next provider
- If all providers are rate-limited, wait a few minutes
- Consider adding more providers for higher capacity

### Slow responses
- Groq is the fastest provider - make sure it's configured
- Hugging Face can be slow on cold starts
- Consider the paid OpenAI fallback for consistent speed

