"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Download, X, Eye, EyeOff, Sparkles, Zap, Loader2 } from "lucide-react"
import { MedalIcon, type MedalTier } from "@/components/icons/MedalIcons"
import { getMedalTierFromStatus, getMedalTierFromAngles } from "@/lib/medalRanking"
import { enhanceImage, type EnhancementTier } from "@/services/imageEnhancement"

const HYBRID_API_URL = process.env.NEXT_PUBLIC_HYBRID_API_URL || 'http://localhost:5001'

interface Keypoint {
  x: number
  y: number
  confidence: number
  source?: string
}

interface Screenshot {
  id: string
  name: string
  dataUrl: string
  status: "good" | "warning" | "critical"
  analysis: string
}

// Cached hybrid results for each screenshot
interface HybridData {
  keypoints: Record<string, Keypoint>
  angles: Record<string, number>
  basketball: { x: number; y: number; radius: number } | null
  imageWidth: number
  imageHeight: number
}

interface AutoScreenshotsProps {
  imageUrl: string
  keypoints?: Record<string, Keypoint>
  basketball?: { x: number; y: number; radius: number } | null
  imageSize?: { width: number; height: number }
  angles?: Record<string, number>
}

// Medal tier styles matching the medal colors
const MEDAL_TIER_STYLES: Record<MedalTier, { border: string; bg: string; text: string }> = {
  gold: { border: "border-[#FFD700]", bg: "bg-[#FFD700]/10", text: "text-[#FFD700]" },
  silver: { border: "border-[#C0C0C0]", bg: "bg-[#C0C0C0]/10", text: "text-[#C0C0C0]" },
  bronze: { border: "border-[#CD7F32]", bg: "bg-[#CD7F32]/10", text: "text-[#CD7F32]" },
  copper: { border: "border-[#B87333]", bg: "bg-[#B87333]/10", text: "text-[#B87333]" },
  iron: { border: "border-[#6B6B6B]", bg: "bg-[#6B6B6B]/10", text: "text-[#6B6B6B]" },
}

// Skeleton connections for drawing
const SKELETON_CONNECTIONS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
  ['nose', 'left_eye'],
  ['nose', 'right_eye'],
  ['left_eye', 'left_ear'],
  ['right_eye', 'right_ear'],
]

// Helper to convert image URL to base64
async function imageUrlToBase64(url: string): Promise<string> {
  if (url.startsWith('data:')) {
    return url.split(',')[1]
  }
  
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const result = reader.result as string
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Apply sharpening filter to canvas using convolution
function applySharpeningFilter(ctx: CanvasRenderingContext2D, width: number, height: number, strength: number = 0.3) {
  // Get image data
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const tempData = new Uint8ClampedArray(data)
  
  // Sharpening kernel (unsharp mask style)
  // Center weight is boosted, neighbors are subtracted
  const kernel = [
    0, -strength, 0,
    -strength, 1 + 4 * strength, -strength,
    0, -strength, 0
  ]
  
  // Apply convolution (skip edge pixels)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      for (let c = 0; c < 3; c++) { // RGB channels only, not alpha
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

// Apply contrast enhancement
function applyContrastEnhancement(ctx: CanvasRenderingContext2D, width: number, height: number, contrast: number = 1.1) {
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data
  const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255))
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128))     // R
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)) // G
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)) // B
  }
  
  ctx.putImageData(imageData, 0, 0)
}

// Call hybrid API to get accurate keypoints from an image
async function getKeypointsFromHybrid(imageBase64: string): Promise<HybridData | null> {
  try {
    console.log("[AutoScreenshots] Calling hybrid API for accurate keypoints...")
    const response = await fetch(`${HYBRID_API_URL}/api/detect-pose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imageBase64 })
    })
    
    if (!response.ok) {
      console.error("[AutoScreenshots] Hybrid API error:", response.status)
      return null
    }
    
    const result = await response.json()
    
    if (!result.success || !result.keypoints) {
      console.error("[AutoScreenshots] Hybrid API returned no keypoints:", result)
      return null
    }
    
    console.log("[AutoScreenshots] Got keypoints from hybrid:", Object.keys(result.keypoints))
    return {
      keypoints: result.keypoints,
      angles: result.angles || {},
      basketball: result.basketball || null,
      imageWidth: result.image_width || 0,
      imageHeight: result.image_height || 0
    }
  } catch (error) {
    console.error("[AutoScreenshots] Failed to call hybrid API:", error)
    return null
  }
}

export function AutoScreenshots({ imageUrl, keypoints: passedKeypoints, basketball: passedBasketball, imageSize, angles: passedAngles }: AutoScreenshotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)
  
  // Hybrid data cache for each screenshot
  const [hybridCache, setHybridCache] = useState<Record<string, HybridData>>({})
  const [isLoadingHybrid, setIsLoadingHybrid] = useState(false)
  
  // Toggle states for expanded view
  const [showSkeleton, setShowSkeleton] = useState(false)
  const [showLabels, setShowLabels] = useState(false)
  const [showKeypoints, setShowKeypoints] = useState(false)
  
  // Enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false)
  const [enhancementTier, setEnhancementTier] = useState<EnhancementTier>('basic')
  const [enhancedImageUrl, setEnhancedImageUrl] = useState<string | null>(null)
  const [enhancementError, setEnhancementError] = useState<string | null>(null)

  // Process screenshot through hybrid when expanded
  const processScreenshotHybrid = useCallback(async (screenshotId: string, dataUrl: string) => {
    // Check cache first
    if (hybridCache[screenshotId]) {
      console.log("[AutoScreenshots] Using cached hybrid data for:", screenshotId)
      return hybridCache[screenshotId]
    }
    
    setIsLoadingHybrid(true)
    try {
      const base64 = await imageUrlToBase64(dataUrl)
      const hybridData = await getKeypointsFromHybrid(base64)
      
      if (hybridData) {
        // Cache the result
        setHybridCache(prev => ({
          ...prev,
          [screenshotId]: hybridData
        }))
        return hybridData
      }
    } catch (error) {
      console.error("[AutoScreenshots] Failed to process hybrid:", error)
    } finally {
      setIsLoadingHybrid(false)
    }
    return null
  }, [hybridCache])

  // Handle expand - trigger hybrid processing
  const handleExpand = useCallback(async (screenshotId: string) => {
    setExpandedId(screenshotId)
    // Reset toggles when opening new screenshot
    setShowSkeleton(false)
    setShowLabels(false)
    setShowKeypoints(false)
    
    const screenshot = screenshots.find(s => s.id === screenshotId)
    if (screenshot && !hybridCache[screenshotId]) {
      await processScreenshotHybrid(screenshotId, screenshot.dataUrl)
    }
  }, [screenshots, hybridCache, processScreenshotHybrid])

  const captureScreenshots = useCallback(async () => {
    if (!imageUrl) {
      console.log("[AutoScreenshots] No imageUrl, skipping")
      setIsProcessing(false)
      return
    }
    
    setIsProcessing(true)
    
    try {
      // Load the image first
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error("Failed to load image"))
        img.src = imageUrl
      })

      const canvas = canvasRef.current
      if (!canvas) {
        setIsProcessing(false)
        return
      }
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setIsProcessing(false)
        return
      }

      const fullW = img.naturalWidth
      const fullH = img.naturalHeight
      
      console.log("[AutoScreenshots] Full image dimensions:", fullW, "x", fullH)
      
      let keypoints = passedKeypoints
      let basketball = passedBasketball
      let angles = passedAngles
      
      console.log("[AutoScreenshots] Converting image to base64 for hybrid API...")
      const imageBase64 = await imageUrlToBase64(imageUrl)
      const hybridResult = await getKeypointsFromHybrid(imageBase64)
      
      const imgW = fullW
      const imgH = fullH
      
      let scaleX = 1
      let scaleY = 1
      
      if (hybridResult && hybridResult.keypoints && Object.keys(hybridResult.keypoints).length > 0) {
        console.log("[AutoScreenshots] Got keypoints from hybrid API:", Object.keys(hybridResult.keypoints))
        
        let hybridKeypoints = hybridResult.keypoints
        basketball = hybridResult.basketball || basketball
        angles = hybridResult.angles || angles
        
        const kpValues = Object.values(hybridKeypoints)
        const maxKpX = Math.max(...kpValues.map(kp => kp.x))
        const maxKpY = Math.max(...kpValues.map(kp => kp.y))
        
        if (maxKpX > fullW * 1.1 || maxKpY > fullH * 1.1) {
          scaleX = fullW / (maxKpX * 1.05)
          scaleY = fullH / (maxKpY * 1.05)
          console.log("[AutoScreenshots] Scaling keypoints to image:", { scaleX, scaleY, maxKpX, maxKpY })
          
          const scaledKeypoints: Record<string, Keypoint> = {}
          for (const [name, kp] of Object.entries(hybridKeypoints)) {
            scaledKeypoints[name] = {
              x: kp.x * scaleX,
              y: kp.y * scaleY,
              confidence: kp.confidence
            }
          }
          hybridKeypoints = scaledKeypoints
        }
        
        keypoints = { ...hybridKeypoints }
        
        const missingKeypoints = ['right_knee', 'left_knee', 'right_ankle', 'left_ankle', 'right_hip', 'left_hip']
        for (const kpName of missingKeypoints) {
          if (!keypoints[kpName] && passedKeypoints?.[kpName]) {
            const passedKp = passedKeypoints[kpName]
            if (passedKp.x > 0 && passedKp.y > 0) {
              const passedMaxX = Math.max(...Object.values(passedKeypoints).map(kp => kp.x))
              const passedMaxY = Math.max(...Object.values(passedKeypoints).map(kp => kp.y))
              const passedScaleX = passedMaxX > fullW * 1.1 ? fullW / (passedMaxX * 1.05) : 1
              const passedScaleY = passedMaxY > fullH * 1.1 ? fullH / (passedMaxY * 1.05) : 1
              
              keypoints[kpName] = {
                x: passedKp.x * passedScaleX,
                y: passedKp.y * passedScaleY,
                confidence: passedKp.confidence
              }
            }
          }
        }
      }
      
      canvas.width = imgW
      canvas.height = imgH
      ctx.drawImage(img, 0, 0, imgW, imgH)

      let personMinX = imgW * 0.2
      let personMaxX = imgW * 0.8
      let personMinY = imgH * 0.1
      let personMaxY = imgH * 0.9
      let personCenterX = imgW / 2
      let personWidth = imgW * 0.6
      let personHeight = imgH * 0.8

      if (keypoints && Object.keys(keypoints).length > 0) {
        const allX = Object.values(keypoints).map(kp => kp.x).filter(x => x > 0)
        const allY = Object.values(keypoints).map(kp => kp.y).filter(y => y > 0)
        
        if (allX.length > 0 && allY.length > 0) {
          personMinX = Math.min(...allX)
          personMaxX = Math.max(...allX)
          personMinY = Math.min(...allY)
          personMaxY = Math.max(...allY)
          personCenterX = (personMinX + personMaxX) / 2
          personWidth = personMaxX - personMinX
          personHeight = personMaxY - personMinY
        }
      }

      const getKeypointPos = (name: string, fallbackX: number, fallbackY: number) => {
        const kp = keypoints?.[name]
        if (kp && kp.x > 0 && kp.y > 0) {
          return { x: kp.x, y: kp.y }
        }
        return { x: fallbackX, y: fallbackY }
      }

      const rightWrist = getKeypointPos('right_wrist', personCenterX, personMinY + personHeight * 0.3)
      // Note: leftWrist is calculated in bodypix-crop API for bounding box
      const rightShoulder = getKeypointPos('right_shoulder', personCenterX + personWidth * 0.2, personMinY + personHeight * 0.2)
      const leftShoulder = getKeypointPos('left_shoulder', personCenterX - personWidth * 0.2, personMinY + personHeight * 0.2)
      const rightHip = getKeypointPos('right_hip', personCenterX + personWidth * 0.15, personMinY + personHeight * 0.5)
      const leftHip = getKeypointPos('left_hip', personCenterX - personWidth * 0.15, personMinY + personHeight * 0.5)
      const rightAnkle = getKeypointPos('right_ankle', personCenterX + personWidth * 0.1, personMinY + personHeight * 0.9)
      const leftAnkle = getKeypointPos('left_ankle', personCenterX - personWidth * 0.1, personMinY + personHeight * 0.9)

      const handsKeypoint = rightWrist
      const feetCropHeight = 350
      const anklesKeypoint = {
        x: imgW / 2,
        y: imgH - (feetCropHeight / 2)
      }
      
      const cropSize = Math.max(personHeight * 0.6, 600)
      
      const regions = [
        {
          id: "main-body",
          name: "FULL BODY",
          centerX: imgW / 2,
          centerY: imgH / 2,
          width: imgW,
          height: imgH,
          getStatus: (): "good" | "warning" | "critical" => {
            const elbowAngle = angles?.elbow_angle || angles?.left_elbow_angle || angles?.right_elbow_angle
            const kneeAngle = angles?.knee_angle || angles?.left_knee_angle || angles?.right_knee_angle
            if (elbowAngle && kneeAngle && elbowAngle >= 80 && elbowAngle <= 110 && kneeAngle >= 130 && kneeAngle <= 170) return "good"
            if (elbowAngle || kneeAngle) return "warning"
            return "good"
          },
          getAnalysis: () => {
            const elbowAngle = angles?.elbow_angle || angles?.left_elbow_angle || angles?.right_elbow_angle
            const kneeAngle = angles?.knee_angle || angles?.left_knee_angle || angles?.right_knee_angle
            let analysis = "Full body shooting form analysis"
            if (elbowAngle) analysis += ` | Elbow: ${elbowAngle.toFixed(0)}°`
            if (kneeAngle) analysis += ` | Knee: ${kneeAngle.toFixed(0)}°`
            return analysis
          }
        },
        {
          id: "hands-area",
          name: "HANDS AND RELEASE",
          centerX: handsKeypoint.x,
          centerY: handsKeypoint.y,
          width: cropSize * 1.3,
          height: cropSize * 1.1,
          getStatus: (): "good" | "warning" | "critical" => {
            const elbowAngle = angles?.elbow_angle || angles?.left_elbow_angle || angles?.right_elbow_angle
            if (elbowAngle && elbowAngle >= 80 && elbowAngle <= 110) return "good"
            if (elbowAngle && (elbowAngle >= 70 || elbowAngle <= 120)) return "warning"
            return "good"
          },
          getAnalysis: () => {
            const elbowAngle = angles?.elbow_angle || angles?.left_elbow_angle || angles?.right_elbow_angle
            if (elbowAngle) {
              if (elbowAngle >= 80 && elbowAngle <= 110) return `Good elbow angle: ${elbowAngle.toFixed(0)}°`
              return `Elbow angle: ${elbowAngle.toFixed(0)}° - aim for 90°`
            }
            return "Hand position and ball release"
          }
        },
        {
          id: "ankles-area",
          name: "LEGS AND FEET",
          centerX: anklesKeypoint.x,
          centerY: anklesKeypoint.y,
          width: imgW * 0.8,
          height: feetCropHeight,
          getStatus: (): "good" | "warning" | "critical" => {
            const stanceWidth = Math.abs(rightAnkle.x - leftAnkle.x)
            const shoulderWidth = Math.abs(rightShoulder.x - leftShoulder.x)
            if (stanceWidth >= shoulderWidth * 0.8 && stanceWidth <= shoulderWidth * 1.3) return "good"
            if (stanceWidth < shoulderWidth * 0.6) return "warning"
            return "good"
          },
          getAnalysis: () => {
            return "Foot position and base alignment"
          }
        },
        {
          id: "ball-area",
          name: "ABS AND HIPS",
          centerX: (rightShoulder.x + leftShoulder.x + rightHip.x + leftHip.x) / 4,
          centerY: (rightShoulder.y + leftShoulder.y + rightHip.y + leftHip.y) / 4,
          width: cropSize * 1.2,
          height: cropSize * 1.2,
          getStatus: (): "good" | "warning" | "critical" => {
            const hipDiff = Math.abs(rightHip.y - leftHip.y)
            if (hipDiff < 20) return "good"
            if (hipDiff < 40) return "warning"
            return "critical"
          },
          getAnalysis: () => {
            const hipDiff = Math.abs(rightHip.y - leftHip.y)
            if (hipDiff < 20) return "Good core alignment and hip stability"
            return `Hip alignment off by ${hipDiff.toFixed(0)}px - keep hips level`
          }
        }
      ]

      console.log("[AutoScreenshots] Sending to BodyPix Crop API...")
      
      const response = await fetch('/api/bodypix-crop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageBase64,
          keypoints: keypoints,
          basketball: basketball
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error("[AutoScreenshots] BodyPix API error:", errorText)
        throw new Error(`BodyPix API failed: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success || !result.images) {
        throw new Error(result.error || 'BodyPix cropping failed')
      }

      console.log("[AutoScreenshots] BodyPix returned", result.images.length, "crops")

      const captured: Screenshot[] = result.images.map((img: { id: string; name: string; dataUrl: string }) => {
        const region = regions.find(r => r.id === img.id)
        return {
          id: img.id,
          name: img.name,
          dataUrl: img.dataUrl,
          status: region?.getStatus() || "good",
          analysis: region?.getAnalysis() || ""
        }
      })

      console.log("[AutoScreenshots] Captured", captured.length, "screenshots")
      setScreenshots(captured)
    } catch (error) {
      console.error("[AutoScreenshots] Failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, passedKeypoints, passedBasketball, imageSize, passedAngles])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        captureScreenshots()
      }
    }, 500)
    
    return () => clearTimeout(timer)
  }, [captureScreenshots])

  const downloadScreenshot = (screenshot: Screenshot) => {
    const link = document.createElement("a")
    link.download = `${screenshot.id}-${Date.now()}.png`
    link.href = screenshot.dataUrl
    link.click()
  }

  const expandedScreenshot = expandedId ? screenshots.find(s => s.id === expandedId) : null
  const expandedHybridData = expandedId ? hybridCache[expandedId] : null
  const hasHybridData = !!expandedHybridData
  
  // State for the composite image with overlays (for DISPLAY only)
  const [compositeImageUrl, setCompositeImageUrl] = useState<string | null>(null)
  
  // State for the clean base image WITHOUT overlays (for ENHANCEMENT)
  // This is the original screenshot without skeleton/labels/keypoints
  const [cleanBaseImageUrl, setCleanBaseImageUrl] = useState<string | null>(null)
  
  // Generate clean base image when expanded screenshot changes (for enhancement)
  useEffect(() => {
    if (!expandedScreenshot) {
      setCleanBaseImageUrl(null)
      return
    }
    
    // Store the clean base image URL (original screenshot without any overlays)
    setCleanBaseImageUrl(expandedScreenshot.dataUrl)
    console.log("[Enhancement] Clean base image stored for enhancement")
  }, [expandedScreenshot?.dataUrl, expandedScreenshot])
  
  // Generate composite image when toggles change (for DISPLAY only)
  useEffect(() => {
    console.log("[Composite] useEffect triggered", {
      hasExpandedScreenshot: !!expandedScreenshot,
      hasExpandedHybridData: !!expandedHybridData,
      showSkeleton,
      showLabels,
      showKeypoints
    })
    
    if (!expandedScreenshot || !expandedHybridData) {
      console.log("[Composite] Missing data, clearing composite")
      setCompositeImageUrl(null)
      return
    }
    
    if (!showSkeleton && !showLabels && !showKeypoints) {
      console.log("[Composite] All toggles off, clearing composite")
      setCompositeImageUrl(null)
      return
    }
    
    console.log("[Composite] Generating composite image with padding...")
    
    // Create composite image with padding and overlays
    const generateComposite = async () => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = expandedScreenshot.dataUrl
      })
      
      const { keypoints, angles } = expandedHybridData
      
      // Calculate padding for labels
      const LABEL_PADDING = showLabels ? 180 : 0
      
      const imgW = img.naturalWidth
      const imgH = img.naturalHeight
      const totalW = imgW + (LABEL_PADDING * 2)
      
      // Use device pixel ratio for sharper rendering on high-DPI displays
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // Cap at 2x for performance
      
      // Create canvas with padding and higher resolution
      const canvas = document.createElement('canvas')
      canvas.width = totalW * dpr
      canvas.height = imgH * dpr
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      // Scale context for high-DPI rendering
      ctx.scale(dpr, dpr)
      
      // Enable high-quality image rendering
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      
      // Fill with black background
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, totalW, imgH)
      
      // Draw image centered
      ctx.drawImage(img, LABEL_PADDING, 0, imgW, imgH)
      
      // Apply image enhancement filters for sharper output
      // Note: We apply these at the scaled resolution for best quality
      const scaledWidth = Math.round(totalW * dpr)
      const scaledHeight = Math.round(imgH * dpr)
      
      // Reset scale temporarily to apply filters at pixel level
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      
      // Apply mild sharpening (strength 0.25 for subtle enhancement)
      applySharpeningFilter(ctx, scaledWidth, scaledHeight, 0.25)
      
      // Apply slight contrast boost (1.05 = 5% increase)
      applyContrastEnhancement(ctx, scaledWidth, scaledHeight, 1.05)
      
      // Restore scale for overlay drawing
      ctx.scale(dpr, dpr)
      
      // Helper to get keypoint position (offset by padding)
      const getKp = (name: string) => {
        const kp = keypoints[name]
        if (!kp || kp.x <= 0 || kp.y <= 0) return null
        
        // Scale keypoints to image size
        const scaleX = imgW / (expandedHybridData.imageWidth || imgW)
        const scaleY = imgH / (expandedHybridData.imageHeight || imgH)
        
        return {
          x: (kp.x * scaleX) + LABEL_PADDING,  // Offset by left padding
          y: kp.y * scaleY
        }
      }
      
      // Draw skeleton - VIDEO GAME STYLE with status-based colors
      // GREEN = good, YELLOW = warning, RED = problem
      if (showSkeleton) {
        // Status colors based on form quality
        const STATUS_COLORS = {
          good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.6)' },      // Green
          warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.6)' },   // Yellow
          problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.6)' }    // Red
        }
        
        // Get angle measurements to determine status
        const elbowAngle = angles?.elbow_angle || angles?.right_elbow_angle || angles?.left_elbow_angle
        const kneeAngle = angles?.knee_angle || angles?.right_knee_angle || angles?.left_knee_angle
        
        // Determine status based on body part and angle measurements
        const getConnectionStatus = (start: string, end: string): 'good' | 'warning' | 'problem' => {
          // Elbow connections
          if (start.includes('elbow') || end.includes('elbow') || start.includes('wrist') || end.includes('wrist')) {
            if (elbowAngle) {
              if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
              if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
              return 'problem'
            }
            return 'good'
          }
          // Knee connections
          if (start.includes('knee') || end.includes('knee') || start.includes('ankle') || end.includes('ankle')) {
            if (kneeAngle) {
              if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
              if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
              return 'problem'
            }
            return 'good'
          }
          // Default for torso/shoulders
          return 'good'
        }
        
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        
        for (const [start, end] of SKELETON_CONNECTIONS) {
          const startPt = getKp(start)
          const endPt = getKp(end)
          
          if (startPt && endPt) {
            const status = getConnectionStatus(start, end)
            const colors = STATUS_COLORS[status]
            
            // Outer glow layer (thickest, most transparent)
            ctx.strokeStyle = colors.glow
            ctx.lineWidth = 16
            ctx.shadowColor = colors.main
            ctx.shadowBlur = 20
            ctx.beginPath()
            ctx.moveTo(startPt.x, startPt.y)
            ctx.lineTo(endPt.x, endPt.y)
            ctx.stroke()
            
            // Middle glow layer
            ctx.strokeStyle = colors.glow
            ctx.lineWidth = 10
            ctx.shadowBlur = 15
            ctx.beginPath()
            ctx.moveTo(startPt.x, startPt.y)
            ctx.lineTo(endPt.x, endPt.y)
            ctx.stroke()
            
            // Main line (solid color)
            ctx.strokeStyle = colors.main
            ctx.lineWidth = 6
            ctx.shadowBlur = 10
            ctx.beginPath()
            ctx.moveTo(startPt.x, startPt.y)
            ctx.lineTo(endPt.x, endPt.y)
            ctx.stroke()
            
            // Inner bright core
            ctx.strokeStyle = '#FFFFFF'
            ctx.lineWidth = 2
            ctx.shadowBlur = 0
            ctx.beginPath()
            ctx.moveTo(startPt.x, startPt.y)
            ctx.lineTo(endPt.x, endPt.y)
            ctx.stroke()
          }
        }
        ctx.shadowBlur = 0
      }
      
      // Draw keypoints - VIDEO GAME STYLE with status-based colors
      // GREEN = good, YELLOW = warning, RED = problem
      if (showKeypoints) {
        // Status colors based on form quality
        const STATUS_COLORS = {
          good: { main: '#22c55e', glow: 'rgba(34, 197, 94, 0.8)' },      // Green
          warning: { main: '#eab308', glow: 'rgba(234, 179, 8, 0.8)' },   // Yellow
          problem: { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.8)' }    // Red
        }
        
        // Get angle measurements to determine status
        const elbowAngle = angles?.elbow_angle || angles?.right_elbow_angle || angles?.left_elbow_angle
        const kneeAngle = angles?.knee_angle || angles?.right_knee_angle || angles?.left_knee_angle
        
        // Determine status based on keypoint name and angle measurements
        const getKeypointStatus = (name: string): 'good' | 'warning' | 'problem' => {
          // Elbow and wrist keypoints
          if (name.includes('elbow') || name.includes('wrist')) {
            if (elbowAngle) {
              if (elbowAngle >= 85 && elbowAngle <= 100) return 'good'
              if (elbowAngle >= 70 && elbowAngle <= 120) return 'warning'
              return 'problem'
            }
            return 'good'
          }
          // Knee and ankle keypoints
          if (name.includes('knee') || name.includes('ankle')) {
            if (kneeAngle) {
              if (kneeAngle >= 135 && kneeAngle <= 160) return 'good'
              if (kneeAngle >= 120 && kneeAngle <= 175) return 'warning'
              return 'problem'
            }
            return 'good'
          }
          // Default for other keypoints (shoulders, hips, face)
          return 'good'
        }
        
        for (const [name, kp] of Object.entries(keypoints)) {
          if (kp.x <= 0 || kp.y <= 0) continue
          
          const pt = getKp(name)
          if (!pt) continue
          
          const status = getKeypointStatus(name)
          const colors = STATUS_COLORS[status]
          const isMainJoint = name.includes('elbow') || name.includes('knee') || name.includes('wrist') || name.includes('shoulder') || name.includes('hip')
          const baseRadius = isMainJoint ? 14 : 10
          
          // Outer glow pulse effect
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, baseRadius + 8, 0, Math.PI * 2)
          ctx.fillStyle = colors.glow.replace('0.8', '0.2')
          ctx.shadowColor = colors.main
          ctx.shadowBlur = 25
          ctx.fill()
          
          // Outer ring with glow
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, baseRadius + 4, 0, Math.PI * 2)
          ctx.strokeStyle = colors.main
          ctx.lineWidth = 3
          ctx.shadowBlur = 15
          ctx.stroke()
          
          // Middle filled circle
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, baseRadius, 0, Math.PI * 2)
          ctx.fillStyle = colors.main
          ctx.shadowBlur = 10
          ctx.fill()
          
          // Inner dark ring
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, baseRadius - 3, 0, Math.PI * 2)
          ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)'
          ctx.lineWidth = 2
          ctx.shadowBlur = 0
          ctx.stroke()
          
          // Center bright dot (highlight)
          ctx.beginPath()
          ctx.arc(pt.x, pt.y, baseRadius - 5, 0, Math.PI * 2)
          ctx.fillStyle = '#FFFFFF'
          ctx.fill()
          
          // Tiny center dot for depth
          ctx.beginPath()
          ctx.arc(pt.x - 2, pt.y - 2, 2, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
          ctx.fill()
        }
        ctx.shadowBlur = 0
      }
      
      // Draw labels - ALTERNATING RIGHT, LEFT, RIGHT, LEFT
      if (showLabels && angles) {
        console.log("[Composite] Drawing labels, angles available:", Object.keys(angles))
        ctx.font = 'bold 16px Arial'
        
        // Try multiple angle name variations
        const elbowAngle = angles.elbow_angle || angles.right_elbow_angle || angles.left_elbow_angle
        const kneeAngle = angles.knee_angle || angles.right_knee_angle || angles.left_knee_angle
        const shoulderAngle = angles.shoulder_angle || angles.right_shoulder_angle || angles.left_shoulder_angle
        const hipAngle = angles.hip_angle || angles.right_hip_angle || angles.left_hip_angle
        
        console.log("[Composite] Resolved angles:", { elbowAngle, kneeAngle, shoulderAngle, hipAngle })
        
        const labelData = [
          { angle: elbowAngle, name: 'ELBOW', keypoint: 'right_elbow' },
          { angle: kneeAngle, name: 'KNEE', keypoint: 'right_knee' },
          { angle: shoulderAngle, name: 'SHOULDER', keypoint: 'right_shoulder' },
          { angle: hipAngle, name: 'HIP', keypoint: 'right_hip' },
        ]
        
        let labelIndex = 0
        
        for (const label of labelData) {
          console.log("[Composite] Label:", label.name, "angle:", label.angle, "keypoint:", label.keypoint)
          if (!label.angle) continue
          
          const kp = getKp(label.keypoint)
          console.log("[Composite] Keypoint for", label.name, ":", kp)
          if (!kp) continue
          
          // ALTERNATE: even = RIGHT side, odd = LEFT side
          const isRightSide = labelIndex % 2 === 0
          labelIndex++
          
          const text = `${label.name}: ${label.angle.toFixed(0)}°`
          const metrics = ctx.measureText(text)
          const bgPadding = 8
          const labelY = kp.y
          
          let labelX: number
          let bgX: number
          
          if (isRightSide) {
            // RIGHT SIDE - in the right black padding area
            labelX = LABEL_PADDING + imgW + 20  // 20px into right padding
            bgX = labelX - bgPadding
            ctx.textAlign = 'left'
          } else {
            // LEFT SIDE - in the left black padding area
            labelX = LABEL_PADDING - 20  // 20px from image edge (in left padding)
            bgX = labelX - metrics.width - bgPadding
            ctx.textAlign = 'right'
          }
          
          // Background box
          ctx.fillStyle = 'rgba(40, 40, 40, 0.95)'
          ctx.fillRect(
            bgX,
            labelY - 14 - bgPadding,
            metrics.width + bgPadding * 2,
            24 + bgPadding
          )
          
          // Border
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 2
          ctx.strokeRect(
            bgX,
            labelY - 14 - bgPadding,
            metrics.width + bgPadding * 2,
            24 + bgPadding
          )
          
          // Line from keypoint to label
          ctx.strokeStyle = '#FFD700'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(kp.x, kp.y)
          if (isRightSide) {
            ctx.lineTo(bgX, labelY - 2)
          } else {
            ctx.lineTo(bgX + metrics.width + bgPadding * 2, labelY - 2)
          }
          ctx.stroke()
          
          // Text
          ctx.fillStyle = '#FFD700'
          ctx.fillText(text, labelX, labelY)
        }
      }
      
      // Convert to high-quality data URL
      // PNG is lossless, so we get the full quality of our enhanced image
      const dataUrl = canvas.toDataURL('image/png', 1.0)
      console.log("[Composite] Generated enhanced composite image, size:", totalW * dpr, "x", imgH * dpr, "(", dpr, "x DPR), padding:", LABEL_PADDING)
      setCompositeImageUrl(dataUrl)
    }
    
    generateComposite().catch(err => {
      console.error("[Composite] Error generating composite:", err)
    })
  }, [expandedScreenshot, expandedHybridData, showSkeleton, showLabels, showKeypoints])

  return (
    <div className="space-y-4">
      <canvas ref={canvasRef} className="hidden" />
      
      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-[#888]">
            <div className="w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            <span>Generating screenshots...</span>
          </div>
        </div>
      )}
      
      {!isProcessing && screenshots.length === 0 && (
        <div className="text-center py-4 text-[#888]">
          No screenshots available
        </div>
      )}

      {!isProcessing && screenshots.length > 0 && (
        <div className="space-y-4">
          {/* Main Screenshot - Full Body */}
          {screenshots.filter(s => s.id === 'main-body').map((screenshot) => {
            // Determine medal tier based on status and angles
            const medalTier = getMedalTierFromStatus(screenshot.status, undefined)
            const medalStyles = MEDAL_TIER_STYLES[medalTier]
            
            return (
              <div key={screenshot.id} className="flex justify-center">
                <div
                  onClick={() => handleExpand(screenshot.id)}
                  className={`inline-block rounded-lg border-2 ${medalStyles.border} ${medalStyles.bg} overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
                >
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshot.dataUrl}
                    alt={screenshot.name}
                    className="block max-h-[400px] w-full object-cover object-top"
                  />
                  
                  <div className={`absolute top-2 right-2 ${medalStyles.bg} ${medalStyles.text} p-1.5 rounded-full flex items-center justify-center`}>
                    <MedalIcon tier={medalTier} size={20} />
                  </div>

                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                      Click to expand
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className={`font-bold text-sm ${medalStyles.text} mb-1`}>{screenshot.name}</h4>
                  <p className="text-[#888] text-xs">{screenshot.analysis}</p>
                </div>
                </div>
              </div>
            )
          })}

          {/* Thumbnail Screenshots - 3 columns */}
          <div className="grid grid-cols-3 gap-4">
            {screenshots.filter(s => s.id !== 'main-body').map((screenshot) => {
              // Determine medal tier based on status and angles
              const medalTier = getMedalTierFromStatus(screenshot.status, undefined)
              const medalStyles = MEDAL_TIER_STYLES[medalTier]
              
              return (
                <div
                  key={screenshot.id}
                  onClick={() => handleExpand(screenshot.id)}
                  className={`rounded-lg border-2 ${medalStyles.border} ${medalStyles.bg} overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
                >
                  <div className="relative aspect-[4/3] bg-[#1a1a1a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screenshot.dataUrl}
                      alt={screenshot.name}
                      className="w-full h-full object-cover"
                    />
                    
                    <div className={`absolute top-2 right-2 ${medalStyles.bg} ${medalStyles.text} p-1.5 rounded-full flex items-center justify-center`}>
                      <MedalIcon tier={medalTier} size={16} />
                    </div>

                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                      <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                        Click to expand
                      </span>
                    </div>
                  </div>

                  <div className="p-3">
                    <h4 className={`font-bold text-sm ${medalStyles.text} mb-1`}>{screenshot.name}</h4>
                    <p className="text-[#888] text-xs line-clamp-2">{screenshot.analysis}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Expanded Modal with Toggle Controls - FULL SIZE */}
      {expandedScreenshot && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedId(null)}
        >
          <div 
            className="bg-[#2a2a2a] rounded-xl max-w-5xl w-full max-h-[95vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-[#FFD700] font-bold text-lg">{expandedScreenshot.name}</h3>
              <button
                onClick={() => setExpandedId(null)}
                className="text-[#888] hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Toggle Controls */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center gap-4 flex-wrap">
              {/* Overlay toggles - only show when hybrid data available */}
              {isLoadingHybrid ? (
                <div className="flex items-center gap-2 text-[#888]">
                  <div className="w-4 h-4 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Analyzing pose...</span>
                </div>
              ) : hasHybridData ? (
                <>
                  <button
                    onClick={() => setShowSkeleton(!showSkeleton)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showSkeleton 
                        ? 'bg-[#FFD700] text-[#1a1a1a]' 
                        : 'bg-[#3a3a3a] text-[#888] hover:text-white'
                    }`}
                  >
                    {showSkeleton ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-sm font-medium">Skeleton</span>
                  </button>
                  
                  <button
                    onClick={() => setShowLabels(!showLabels)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showLabels 
                        ? 'bg-[#FFD700] text-[#1a1a1a]' 
                        : 'bg-[#3a3a3a] text-[#888] hover:text-white'
                    }`}
                  >
                    {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-sm font-medium">Labels</span>
                  </button>
                  
                  <button
                    onClick={() => setShowKeypoints(!showKeypoints)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                      showKeypoints 
                        ? 'bg-[#FFD700] text-[#1a1a1a]' 
                        : 'bg-[#3a3a3a] text-[#888] hover:text-white'
                    }`}
                  >
                    {showKeypoints ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    <span className="text-sm font-medium">Keypoints</span>
                  </button>
                </>
              ) : (
                <span className="text-[#888] text-sm">Overlay controls loading...</span>
              )}
              
              {/* Enhancement & Download Options - ALWAYS VISIBLE */}
              <div className="flex items-center gap-2 ml-auto">
                {/* Enhancement Tier Selector */}
                <div className="flex items-center bg-[#1a1a1a] rounded-lg p-1">
                  <button
                    onClick={() => setEnhancementTier('basic')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      enhancementTier === 'basic'
                        ? 'bg-[#3a3a3a] text-white'
                        : 'text-[#888] hover:text-white'
                    }`}
                    title="Basic enhancement (instant)"
                  >
                    <Zap className="w-3 h-3" />
                    Basic
                  </button>
                  <button
                    onClick={() => setEnhancementTier('hd')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      enhancementTier === 'hd'
                        ? 'bg-[#FFD700] text-[#1a1a1a]'
                        : 'text-[#888] hover:text-white'
                    }`}
                    title="HD enhancement (30-60s, AI-powered)"
                  >
                    <Sparkles className="w-3 h-3" />
                    HD
                  </button>
                  <button
                    onClick={() => setEnhancementTier('premium')}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                      enhancementTier === 'premium'
                        ? 'bg-gradient-to-r from-[#FFD700] to-[#f97316] text-[#1a1a1a]'
                        : 'text-[#888] hover:text-white'
                    }`}
                    title="Premium enhancement (faster, best quality)"
                  >
                    <Sparkles className="w-3 h-3" />
                    Premium
                  </button>
                </div>
                
                {/* Enhance & Download Button */}
                <button
                  onClick={async () => {
                    // IMPORTANT: For enhancement, ALWAYS use the CLEAN base image (without overlays)
                    // The compositeImageUrl includes skeleton/labels which we don't want to enhance
                    const sourceImageForEnhancement = cleanBaseImageUrl || expandedScreenshot.dataUrl
                    // For basic download (no enhancement), use the displayed image (with overlays if toggled)
                    const sourceImageForDisplay = compositeImageUrl || expandedScreenshot.dataUrl
                    
                    if (enhancementTier === 'basic') {
                      // Basic: just download the current displayed image (may include overlays)
                      const link = document.createElement('a')
                      link.download = `${expandedScreenshot.name.replace(/\s+/g, '_')}_basic.png`
                      link.href = sourceImageForDisplay
                      link.click()
                    } else {
                      // HD or Premium: enhance the CLEAN base image (no overlays), then download
                      setIsEnhancing(true)
                      setEnhancementError(null)
                      
                      console.log('[Enhancement] Using CLEAN base image for enhancement (no overlays)')
                      
                      try {
                        const result = await enhanceImage(sourceImageForEnhancement, enhancementTier)
                        
                        if (result.success) {
                          setEnhancedImageUrl(result.imageUrl)
                          
                          // Auto-download
                          const link = document.createElement('a')
                          link.download = `${expandedScreenshot.name.replace(/\s+/g, '_')}_${result.tier}.png`
                          link.href = result.imageUrl
                          link.click()
                        } else {
                          setEnhancementError(result.error || 'Enhancement failed')
                        }
                      } catch (error) {
                        setEnhancementError(error instanceof Error ? error.message : 'Enhancement failed')
                      } finally {
                        setIsEnhancing(false)
                      }
                    }
                  }}
                  disabled={isEnhancing}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isEnhancing
                      ? 'bg-[#3a3a3a] text-[#888] cursor-wait'
                      : enhancementTier === 'basic'
                      ? 'bg-[#22c55e] hover:bg-[#16a34a] text-white'
                      : enhancementTier === 'hd'
                      ? 'bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a]'
                      : 'bg-gradient-to-r from-[#FFD700] to-[#f97316] hover:from-[#E5C100] hover:to-[#ea580c] text-[#1a1a1a]'
                  }`}
                >
                  {isEnhancing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm font-medium">Enhancing...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {enhancementTier === 'basic' ? 'Download' : `Download ${enhancementTier.toUpperCase()}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Enhancement Status Messages */}
            {isEnhancing && (
              <div className="px-4 py-2 bg-[#FFD700]/10 border-b border-[#FFD700]/30">
                <div className="flex items-center gap-2 text-[#FFD700]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">
                    {enhancementTier === 'hd' 
                      ? 'AI enhancement in progress... This may take 30-60 seconds on free tier.'
                      : 'Enhancing image with premium AI...'}
                  </span>
                </div>
              </div>
            )}
            
            {enhancementError && (
              <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-red-400">⚠️ {enhancementError}</span>
                  <button 
                    onClick={() => setEnhancementError(null)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            
            {enhancedImageUrl && !isEnhancing && (
              <div className="px-4 py-2 bg-[#22c55e]/10 border-b border-[#22c55e]/30">
                <div className="flex items-center gap-2 text-[#22c55e]">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">Image enhanced successfully! Download started.</span>
                </div>
              </div>
            )}
            
            <div className="p-4">
              <div className="flex justify-center">
                {/* Show composite image with overlays, or plain image - FULL SIZE */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={compositeImageUrl || expandedScreenshot.dataUrl}
                  alt={expandedScreenshot.name}
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-[#3a3a3a] space-y-4">
              {(() => {
                // Determine medal tier - try to use angles if available, otherwise use status
                const medalTier = expandedHybridData?.angles 
                  ? getMedalTierFromAngles(expandedHybridData.angles)
                  : getMedalTierFromStatus(expandedScreenshot.status, undefined)
                const medalStyles = MEDAL_TIER_STYLES[medalTier]
                
                const statusLabels: Record<MedalTier, string> = {
                  gold: "Elite Form",
                  silver: "Excellent Form",
                  bronze: "Good Form",
                  copper: "Needs Improvement",
                  iron: "Needs Work",
                }
                
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${medalStyles.bg} ${medalStyles.text}`}>
                    <MedalIcon tier={medalTier} size={18} />
                    <span className="font-semibold text-sm">
                      {statusLabels[medalTier]}
                    </span>
                  </div>
                )
              })()}
              
              <p className="text-[#E5E5E5]">{expandedScreenshot.analysis}</p>
              
              {/* Show angles from hybrid data if available */}
              {expandedHybridData && expandedHybridData.angles && Object.keys(expandedHybridData.angles).length > 0 && (
                <div className="bg-[#1a1a1a] rounded-lg p-3">
                  <h4 className="text-[#FFD700] font-semibold text-sm mb-2">Detected Angles</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(expandedHybridData.angles).map(([name, value]) => (
                      <div key={name} className="flex justify-between text-sm">
                        <span className="text-[#888] capitalize">{name.replace(/_/g, ' ')}</span>
                        <span className="text-white font-medium">{(value as number).toFixed(1)}°</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => downloadScreenshot(expandedScreenshot)}
                className="w-full bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-5 h-5" />
                Download Screenshot
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
