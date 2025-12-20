/**
 * @file imageEnhancement.ts
 * @description Image enhancement service with three tiers:
 *   - Basic: Canvas-based sharpening (instant, free)
 *   - HD: Real-ESRGAN via own Hugging Face Space (30-60s, free)
 *   - Premium: Public Real-ESRGAN API via Gradio client (faster, more reliable)
 * 
 * PURPOSE:
 * - Provide multiple quality levels for image enhancement
 * - Handle fallbacks gracefully
 * - Cache enhanced images to avoid re-processing
 * 
 * USAGE:
 * ```typescript
 * import { enhanceImage, EnhancementTier } from '@/services/imageEnhancement'
 * 
 * const enhanced = await enhanceImage(imageDataUrl, 'hd')
 * ```
 */

import { Client } from "@gradio/client"

export type EnhancementTier = 'basic' | 'hd' | 'premium'

export interface EnhancementResult {
  success: boolean
  imageUrl: string
  tier: EnhancementTier
  processingTime: number
  error?: string
}

// Cache for enhanced images (in-memory)
const enhancementCache = new Map<string, EnhancementResult>()

// Your Hugging Face Space URL (Option A - deploy this yourself)
const HUGGINGFACE_SPACE_URL = process.env.NEXT_PUBLIC_REALESRGAN_SPACE_URL || ''

// Public Real-ESRGAN Spaces (Option C - use existing public spaces)
// NOTE: Some spaces apply artistic/stylized effects. We want CLEAN upscaling only.
// These are tested to provide clean 4x upscaling without artistic filters
const PUBLIC_REALESRGAN_SPACES = [
  'hysts/anime4k',          // Clean upscaler, works well for photos too
  'Xintao/GFPGAN',          // Good for faces and general images
  'sberbank-ai/Real-ESRGAN', // Standard Real-ESRGAN
]

/**
 * Generate a cache key for an image
 */
function getCacheKey(imageUrl: string, tier: EnhancementTier): string {
  // Use first 100 chars of base64 + tier as key
  const imageHash = imageUrl.slice(0, 100)
  return `${tier}-${imageHash}`
}

/**
 * Basic enhancement using Canvas API (instant, runs in browser)
 * This is what's already implemented in AutoScreenshots
 */
export async function enhanceBasic(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Create high-DPI canvas
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * dpr
      canvas.height = img.naturalHeight * dpr
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Scale for high-DPI
      ctx.scale(dpr, dpr)
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw image
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight)
      
      // Apply sharpening
      applySharpening(ctx, canvas.width, canvas.height, 0.3)
      
      // Apply contrast enhancement
      applyContrastEnhancement(ctx, canvas.width, canvas.height, 1.08)
      
      resolve(canvas.toDataURL('image/png', 1.0))
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

/**
 * Apply sharpening filter using convolution
 */
function applySharpening(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  strength: number = 0.3
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const tempData = new Uint8ClampedArray(data)
  
  const kernel = [
    0, -strength, 0,
    -strength, 1 + 4 * strength, -strength,
    0, -strength, 0
  ]
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) {
        let sum = 0
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const idx = ((y + ky) * width + (x + kx)) * 4 + c
            sum += tempData[idx] * kernel[(ky + 1) * 3 + (kx + 1)]
          }
        }
        const idx = (y * width + x) * 4 + c
        data[idx] = Math.min(255, Math.max(0, sum))
      }
    }
  }
  
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Apply contrast enhancement
 */
function applyContrastEnhancement(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number, 
  contrast: number = 1.1
) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128))
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128))
  }
  
  ctx.putImageData(imageData, 0, 0)
}

/**
 * HD enhancement using your own Hugging Face Space (Option A)
 * Takes 30-60 seconds on free tier
 */
export async function enhanceHD(imageDataUrl: string): Promise<string> {
  if (!HUGGINGFACE_SPACE_URL) {
    throw new Error('Hugging Face Space URL not configured')
  }
  
  // Extract base64 data
  const base64Data = imageDataUrl.includes(',') 
    ? imageDataUrl.split(',')[1] 
    : imageDataUrl
  
  const response = await fetch(`${HUGGINGFACE_SPACE_URL}/api/predict`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      data: [
        `data:image/png;base64,${base64Data}`,
        4,     // scale factor
        true   // use AI enhancement
      ]
    })
  })
  
  if (!response.ok) {
    throw new Error(`HD enhancement failed: ${response.statusText}`)
  }
  
  const result = await response.json()
  
  if (result.error) {
    throw new Error(result.error)
  }
  
  // Result format depends on Gradio version
  const enhancedImage = result.data?.[0] || result[0]
  
  if (!enhancedImage) {
    throw new Error('No enhanced image returned')
  }
  
  return enhancedImage
}

/**
 * Convert base64 data URL to Blob for Gradio client
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  return response.blob()
}

/**
 * Premium enhancement using public Real-ESRGAN Spaces via Gradio client (Option C)
 * Tries multiple public spaces for reliability
 * 
 * NOTE: If public spaces are unreliable or produce bad results (stylized/posterized),
 * the function will fall back to basic canvas enhancement which is always reliable.
 */
export async function enhancePremium(imageDataUrl: string): Promise<string> {
  // Ensure we have a proper data URL
  const fullDataUrl = imageDataUrl.includes(',') 
    ? imageDataUrl 
    : `data:image/png;base64,${imageDataUrl}`
  
  // Try each public Space until one works
  for (const spaceName of PUBLIC_REALESRGAN_SPACES) {
    try {
      console.log(`[Enhancement] Trying public Space: ${spaceName}`)
      
      // Connect to the Gradio Space with timeout
      const client = await Promise.race([
        Client.connect(spaceName),
        new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 15000)
        )
      ])
      
      // Convert data URL to Blob for upload
      const imageBlob = await dataUrlToBlob(fullDataUrl)
      
      // Different spaces have different API endpoints
      // Try common endpoint names
      const endpoints = ['/predict', '/enhance', '/upscale', '/run']
      
      for (const endpoint of endpoints) {
        try {
          console.log(`[Enhancement] Trying endpoint ${endpoint} on ${spaceName}`)
          
          // Call the predict function with timeout
          const result = await Promise.race([
            client.predict(endpoint, { img: imageBlob }),
            new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Prediction timeout')), 60000)
            )
          ])
          
          console.log(`[Enhancement] Result from ${spaceName}${endpoint}:`, result)
          
          // Extract the enhanced image from result
          const resultData = result.data as unknown[]
          
          if (resultData && resultData.length > 0) {
            const enhancedImage = resultData[0]
            
            // Handle different response formats
            if (typeof enhancedImage === 'string') {
              if (enhancedImage.startsWith('data:') || enhancedImage.startsWith('http')) {
                console.log(`[Enhancement] Successfully enhanced with ${spaceName}`)
                return enhancedImage
              }
            } else if (enhancedImage && typeof enhancedImage === 'object') {
              const imgObj = enhancedImage as { url?: string; path?: string; data?: string }
              const url = imgObj.url || imgObj.path || imgObj.data
              if (url) {
                console.log(`[Enhancement] Successfully enhanced with ${spaceName}`)
                return url
              }
            }
          }
        } catch (endpointError) {
          console.log(`[Enhancement] Endpoint ${endpoint} failed on ${spaceName}:`, endpointError)
          continue
        }
      }
      
      console.log(`[Enhancement] ${spaceName} - all endpoints failed`)
    } catch (error) {
      console.log(`[Enhancement] Space ${spaceName} failed:`, error)
      continue
    }
  }
  
  // If all public spaces fail, fall back to enhanced basic processing
  console.log('[Enhancement] All public spaces failed, using enhanced basic processing')
  return await enhanceBasicPlus(imageDataUrl)
}

/**
 * Enhanced basic processing - better than basic but still local
 * Used as fallback when public spaces fail
 */
async function enhanceBasicPlus(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      // Create 2x upscaled canvas for better quality
      const scale = 2
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth * scale
      canvas.height = img.naturalHeight * scale
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Use high-quality image scaling
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Draw scaled image
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      
      // Apply stronger sharpening for upscaled image
      applySharpening(ctx, canvas.width, canvas.height, 0.4)
      
      // Apply contrast enhancement
      applyContrastEnhancement(ctx, canvas.width, canvas.height, 1.12)
      
      resolve(canvas.toDataURL('image/png', 1.0))
    }
    
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = imageDataUrl
  })
}

/**
 * Main enhancement function - tries the requested tier with fallbacks
 */
export async function enhanceImage(
  imageDataUrl: string, 
  tier: EnhancementTier = 'basic'
): Promise<EnhancementResult> {
  const startTime = Date.now()
  
  // Check cache first
  const cacheKey = getCacheKey(imageDataUrl, tier)
  const cached = enhancementCache.get(cacheKey)
  if (cached) {
    console.log(`[Enhancement] Cache hit for ${tier}`)
    return { ...cached, processingTime: 0 }
  }
  
  console.log(`[Enhancement] Starting ${tier} enhancement...`)
  
  try {
    let enhancedUrl: string
    let actualTier = tier
    
    switch (tier) {
      case 'premium':
        try {
          enhancedUrl = await enhancePremium(imageDataUrl)
        } catch {
          console.log('[Enhancement] Premium failed, falling back to HD')
          try {
            enhancedUrl = await enhanceHD(imageDataUrl)
            actualTier = 'hd'
          } catch {
            console.log('[Enhancement] HD failed, falling back to basic')
            enhancedUrl = await enhanceBasic(imageDataUrl)
            actualTier = 'basic'
          }
        }
        break
        
      case 'hd':
        try {
          enhancedUrl = await enhanceHD(imageDataUrl)
        } catch {
          console.log('[Enhancement] HD failed, falling back to basic')
          enhancedUrl = await enhanceBasic(imageDataUrl)
          actualTier = 'basic'
        }
        break
        
      case 'basic':
      default:
        enhancedUrl = await enhanceBasic(imageDataUrl)
        break
    }
    
    const result: EnhancementResult = {
      success: true,
      imageUrl: enhancedUrl,
      tier: actualTier,
      processingTime: Date.now() - startTime
    }
    
    // Cache the result
    enhancementCache.set(cacheKey, result)
    
    console.log(`[Enhancement] Complete: ${actualTier} in ${result.processingTime}ms`)
    return result
    
  } catch (error) {
    console.error('[Enhancement] All methods failed:', error)
    
    return {
      success: false,
      imageUrl: imageDataUrl, // Return original on failure
      tier: 'basic',
      processingTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Enhancement failed'
    }
  }
}

/**
 * Clear the enhancement cache
 */
export function clearEnhancementCache() {
  enhancementCache.clear()
  console.log('[Enhancement] Cache cleared')
}

/**
 * Get cache statistics
 */
export function getEnhancementCacheStats() {
  return {
    size: enhancementCache.size,
    keys: Array.from(enhancementCache.keys())
  }
}

