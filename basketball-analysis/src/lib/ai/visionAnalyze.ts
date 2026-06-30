/**
 * Provider-chained vision analysis helper.
 *
 * The production box has ANTHROPIC_API_KEY and OPENAI_API_KEY configured, but
 * NOT GOOGLE_AI_API_KEY. This helper runs a vision prompt against an image and
 * returns the model's raw text response, trying providers in order:
 *
 *   1. Anthropic Claude vision  (claude-vision)
 *   2. OpenAI GPT-4o vision     (openai-vision)
 *
 * If neither provider is configured or both fail, it returns `null` so the
 * caller can fall back to its existing honest rule-based path (which never
 * fabricates a score). This helper itself never invents content — it only
 * relays what a real vision model produced.
 */

export type VisionProvider = 'claude-vision' | 'openai-vision'

export interface VisionResult {
  /** Raw text the vision model produced (may contain a JSON blob). */
  text: string
  /** Which provider actually ran. */
  provider: VisionProvider
}

type AllowedMediaType = 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp'

interface NormalizedImage {
  data: string
  mediaType: AllowedMediaType
}

/**
 * Strip a `data:` URL prefix if present and clamp the media type to one of the
 * values the vision APIs accept. Defaults to image/jpeg.
 */
function normalizeImage(imageBase64: string, mediaType?: string): NormalizedImage {
  let data = imageBase64
  let mime = mediaType || 'image/jpeg'

  if (imageBase64.startsWith('data:')) {
    const matches = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
    if (matches) {
      mime = matches[1]
      data = matches[2]
    }
  }

  const allowed: AllowedMediaType[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const mediaTypeSafe = (allowed as string[]).includes(mime)
    ? (mime as AllowedMediaType)
    : 'image/jpeg'

  return { data, mediaType: mediaTypeSafe }
}

/**
 * Call the Anthropic Messages API with an image + prompt. Throws if the key is
 * absent or the call/parse fails so the caller can fall through to OpenAI.
 */
async function analyzeWithClaude(
  image: NormalizedImage,
  prompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.data,
              },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude vision error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const text = data?.content?.[0]?.text
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('No text in Claude vision response')
  }

  return text
}

/**
 * Call the OpenAI Chat Completions API (gpt-4o vision) with an image data-URL +
 * prompt. Throws if the key is absent or the call/parse fails.
 */
async function analyzeWithOpenAI(
  image: NormalizedImage,
  prompt: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const dataUrl = `data:${image.mediaType};base64,${image.data}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: dataUrl } },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI vision error (${response.status}): ${error}`)
  }

  const data = await response.json()
  const text = data?.choices?.[0]?.message?.content
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('No text in OpenAI vision response')
  }

  return text
}

/**
 * Run the vision prompt through the provider chain: Anthropic first, then
 * OpenAI. Returns the first successful result, or `null` if no provider is
 * configured / both fail (caller should then use its rule-based fallback).
 */
export async function visionAnalyze(
  imageBase64: string,
  mediaType: string | undefined,
  prompt: string
): Promise<VisionResult | null> {
  const image = normalizeImage(imageBase64, mediaType)

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const text = await analyzeWithClaude(image, prompt)
      return { text, provider: 'claude-vision' }
    } catch (error) {
      console.error('Claude vision failed, falling back to OpenAI:', error)
    }
  }

  if (process.env.OPENAI_API_KEY) {
    try {
      const text = await analyzeWithOpenAI(image, prompt)
      return { text, provider: 'openai-vision' }
    } catch (error) {
      console.error('OpenAI vision failed, falling back to rule-based:', error)
    }
  }

  return null
}
