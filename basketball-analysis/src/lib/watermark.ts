/**
 * @file watermark.ts
 * @description Utility functions for adding SHOTIQ watermark to images and canvases
 * 
 * PURPOSE:
 * - Provides consistent watermark branding across all exported media
 * - Prevents users from claiming credit for AI-generated analysis
 * - Subtle, professional appearance that doesn't detract from content
 */

// Watermark configuration - Uses the ACTUAL SHOTIQ logo image provided by user - BIG TOP RIGHT
export const WATERMARK_CONFIG = {
  opacity: 0.85, // Very visible
  padding: 15, // Distance from edges
  width: 320, // Big logo width
  height: 160, // Big logo height
  position: 'top-right' as const, // Top right corner
  logoUrl: '/images/shotiq-logo.png', // The ACTUAL logo image provided by user
}

// Cache for the loaded logo image
let cachedLogoImage: HTMLImageElement | null = null
let logoLoadPromise: Promise<HTMLImageElement | null> | null = null

/**
 * Load the SHOTIQ logo image (cached)
 */
export async function loadLogoImage(): Promise<HTMLImageElement | null> {
  if (cachedLogoImage) return cachedLogoImage
  
  if (logoLoadPromise) return logoLoadPromise
  
  logoLoadPromise = new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      cachedLogoImage = img
      resolve(img)
    }
    img.onerror = () => {
      console.error('Failed to load SHOTIQ logo')
      resolve(null)
    }
    img.src = WATERMARK_CONFIG.logoUrl
  })
  
  return logoLoadPromise
}

/**
 * Draw SHOTIQ watermark on a canvas context
 * Uses the ACTUAL logo image provided by user - BIG TOP RIGHT CORNER
 * Should be called LAST after all other drawing operations
 */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  canvasWidth: number,
  canvasHeight: number,
  customOpacity?: number,
  logoImg?: HTMLImageElement | null
): void {
  const { opacity, padding, width, height } = WATERMARK_CONFIG
  const finalOpacity = customOpacity ?? opacity
  
  // Position in TOP-RIGHT corner
  const x = canvasWidth - width - padding
  const y = padding
  
  // Use provided logo or cached logo
  const logo = logoImg || cachedLogoImage
  
  // Draw ONLY the actual logo image - nothing else, no recreated logo
  if (logo) {
    ctx.save()
    ctx.globalAlpha = finalOpacity
    
    // Draw the EXACT logo image provided by user
    ctx.drawImage(logo, x, y, width, height)
    
    ctx.restore()
  }
}

/**
 * Add watermark to an existing image (data URL or blob)
 * Returns a new data URL with watermark applied
 */
export async function addWatermarkToImage(
  imageSource: string | Blob,
  customOpacity?: number
): Promise<string> {
  // Load the logo first
  const logoImg = await loadLogoImage()
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Could not get canvas context'))
        return
      }
      
      // Draw original image
      ctx.drawImage(img, 0, 0)
      
      // Add watermark with the loaded logo
      drawWatermark(ctx, canvas.width, canvas.height, customOpacity, logoImg)
      
      // Return as data URL
      resolve(canvas.toDataURL('image/png', 1.0))
    }
    
    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }
    
    // Handle different source types
    if (typeof imageSource === 'string') {
      img.src = imageSource
    } else {
      img.src = URL.createObjectURL(imageSource)
    }
  })
}

/**
 * Add watermark to a canvas element directly
 * Modifies the canvas in place
 */
export async function addWatermarkToCanvas(
  canvas: HTMLCanvasElement,
  customOpacity?: number
): Promise<void> {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  
  // Load logo first
  const logoImg = await loadLogoImage()
  drawWatermark(ctx, canvas.width, canvas.height, customOpacity, logoImg)
}
