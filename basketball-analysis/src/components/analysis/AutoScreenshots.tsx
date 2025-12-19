"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Download, X, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

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

interface AutoScreenshotsProps {
  imageUrl: string
  keypoints?: Record<string, Keypoint>
  basketball?: { x: number; y: number; radius: number } | null
  imageSize?: { width: number; height: number }
  angles?: Record<string, number>
}

const STATUS_STYLES = {
  good: { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle },
  warning: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", icon: AlertTriangle },
  critical: { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
}

export function AutoScreenshots({ imageUrl, keypoints, basketball, imageSize, angles }: AutoScreenshotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  const captureScreenshots = useCallback(async () => {
    if (!imageUrl || !keypoints || Object.keys(keypoints).length === 0) {
      console.log("[AutoScreenshots] Missing data, skipping")
      setIsProcessing(false)
      return
    }
    
    setIsProcessing(true)
    
    try {
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

      const imgW = imageSize?.width || img.naturalWidth
      const imgH = imageSize?.height || img.naturalHeight

      // Find the bounding box of the person using keypoints
      const allX = Object.values(keypoints).map(kp => kp.x).filter(x => x > 0)
      const allY = Object.values(keypoints).map(kp => kp.y).filter(y => y > 0)
      
      const personMinX = Math.min(...allX)
      const personMaxX = Math.max(...allX)
      const personMinY = Math.min(...allY)
      const personMaxY = Math.max(...allY)
      const personCenterX = (personMinX + personMaxX) / 2
      const personWidth = personMaxX - personMinX
      const personHeight = personMaxY - personMinY

      // Define 3 crop regions based on actual body parts
      const regions = [
        {
          id: "ball-area",
          name: "Ball & Hands",
          // Focus on the hands/wrists area - use ball position if available, otherwise wrists
          centerX: basketball?.x || 
                   ((keypoints.right_wrist?.x || 0) + (keypoints.left_wrist?.x || 0)) / 2 || 
                   personCenterX,
          centerY: basketball?.y || 
                   Math.min(keypoints.right_wrist?.y || imgH, keypoints.left_wrist?.y || imgH) ||
                   personMinY + personHeight * 0.2,
          // Crop size - focus tightly on hands
          width: personWidth * 1.2,
          height: personHeight * 0.4,
          getStatus: () => {
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
            return "Ball and hand position"
          }
        },
        {
          id: "shoulder-area",
          name: "Shoulder & Arms",
          // Center on the upper body - shoulders to elbows
          centerX: ((keypoints.left_shoulder?.x || personCenterX) + (keypoints.right_shoulder?.x || personCenterX)) / 2,
          centerY: ((keypoints.left_shoulder?.y || 0) + (keypoints.right_shoulder?.y || 0)) / 2 ||
                   personMinY + personHeight * 0.25,
          width: personWidth * 1.4,
          height: personHeight * 0.45,
          getStatus: () => {
            const shoulderTilt = angles?.shoulder_tilt
            if (shoulderTilt && Math.abs(shoulderTilt) < 10) return "good"
            if (shoulderTilt && Math.abs(shoulderTilt) < 20) return "warning"
            return "good"
          },
          getAnalysis: () => {
            const shoulderTilt = angles?.shoulder_tilt
            if (shoulderTilt) {
              if (Math.abs(shoulderTilt) < 10) return `Shoulders level: ${shoulderTilt.toFixed(1)}° tilt`
              return `Shoulder tilt: ${shoulderTilt.toFixed(1)}° - keep level`
            }
            return "Upper body alignment"
          }
        },
        {
          id: "legs-area",
          name: "Legs & Base",
          // Center on lower body - hips to ankles
          centerX: ((keypoints.left_hip?.x || personCenterX) + (keypoints.right_hip?.x || personCenterX)) / 2,
          centerY: ((keypoints.left_knee?.y || 0) + (keypoints.right_knee?.y || 0) + 
                    (keypoints.left_ankle?.y || 0) + (keypoints.right_ankle?.y || 0)) / 4 ||
                   personMinY + personHeight * 0.75,
          width: personWidth * 1.3,
          height: personHeight * 0.55,
          getStatus: () => {
            const kneeAngle = angles?.knee_angle || angles?.left_knee_angle || angles?.right_knee_angle
            if (kneeAngle && kneeAngle < 160) return "good"
            if (kneeAngle && kneeAngle > 170) return "warning"
            return "good"
          },
          getAnalysis: () => {
            const kneeAngle = angles?.knee_angle || angles?.left_knee_angle || angles?.right_knee_angle
            if (kneeAngle) {
              if (kneeAngle < 160) return `Good knee bend: ${kneeAngle.toFixed(0)}°`
              return `Knee angle: ${kneeAngle.toFixed(0)}° - bend more for power`
            }
            return "Lower body and balance"
          }
        }
      ]

      const captured: Screenshot[] = []
      
      for (const region of regions) {
        // Calculate crop bounds with padding
        const padding = 30 // Add some padding around the region
        let cropX = Math.max(0, region.centerX - region.width / 2 - padding)
        let cropY = Math.max(0, region.centerY - region.height / 2 - padding)
        let cropW = Math.min(region.width + padding * 2, imgW - cropX)
        let cropH = Math.min(region.height + padding * 2, imgH - cropY)
        
        // Ensure minimum crop size
        cropW = Math.max(cropW, 100)
        cropH = Math.max(cropH, 100)

        // Set canvas size
        canvas.width = cropW
        canvas.height = cropH

        // Draw cropped region - CLEAN image, no overlays
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

        // Get data URL
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9)

        captured.push({
          id: region.id,
          name: region.name,
          dataUrl,
          status: region.getStatus(),
          analysis: region.getAnalysis()
        })
      }

      console.log("[AutoScreenshots] Captured", captured.length, "screenshots")
      setScreenshots(captured)
    } catch (error) {
      console.error("[AutoScreenshots] Failed:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, keypoints, basketball, imageSize, angles])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        captureScreenshots()
      }
    }, 500) // Small delay to ensure image is ready
    
    return () => clearTimeout(timer)
  }, [captureScreenshots])

  const downloadScreenshot = (screenshot: Screenshot) => {
    const link = document.createElement("a")
    link.download = `${screenshot.id}-${Date.now()}.png`
    link.href = screenshot.dataUrl
    link.click()
  }

  const expandedScreenshot = expandedId ? screenshots.find(s => s.id === expandedId) : null

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
        <div className="grid grid-cols-3 gap-4">
          {screenshots.map((screenshot) => {
            const styles = STATUS_STYLES[screenshot.status]
            const Icon = styles.icon
            
            return (
              <div
                key={screenshot.id}
                onClick={() => setExpandedId(screenshot.id)}
                className={`rounded-lg border-2 ${styles.border} ${styles.bg} overflow-hidden cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg`}
              >
                <div className="relative aspect-[4/3] bg-[#1a1a1a]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshot.dataUrl}
                    alt={screenshot.name}
                    className="w-full h-full object-cover"
                  />
                  
                  <div className={`absolute top-2 right-2 ${styles.bg} ${styles.text} p-1 rounded-full`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                    <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                      Click to expand
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <h4 className={`font-bold text-sm ${styles.text} mb-1`}>{screenshot.name}</h4>
                  <p className="text-[#888] text-xs line-clamp-2">{screenshot.analysis}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Expanded Modal */}
      {expandedScreenshot && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setExpandedId(null)}
        >
          <div 
            className="bg-[#2a2a2a] rounded-xl max-w-3xl w-full max-h-[90vh] overflow-auto"
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
            
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expandedScreenshot.dataUrl}
                alt={expandedScreenshot.name}
                className="w-full rounded-lg"
              />
            </div>
            
            <div className="p-4 border-t border-[#3a3a3a] space-y-4">
              {(() => {
                const styles = STATUS_STYLES[expandedScreenshot.status]
                const Icon = styles.icon
                return (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${styles.bg} ${styles.text}`}>
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm">
                      {expandedScreenshot.status === "good" ? "Good Form" :
                       expandedScreenshot.status === "warning" ? "Needs Adjustment" : "Critical Issue"}
                    </span>
                  </div>
                )
              })()}
              
              <p className="text-[#E5E5E5]">{expandedScreenshot.analysis}</p>
              
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

