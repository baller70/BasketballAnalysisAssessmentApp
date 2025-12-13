"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Download, X, CheckCircle, AlertTriangle, XCircle } from "lucide-react"

interface BodyPosition {
  x: number
  y: number
  label: string
  angle?: number | null
  status?: "good" | "warning" | "critical"
  note?: string
}

interface Screenshot {
  id: string
  name: string
  dataUrl: string
  status: "good" | "warning" | "critical"
  bodyParts: BodyPosition[]
  analysis: string
}

interface RoboflowBallDetection {
  x: number // center x as percentage
  y: number // center y as percentage
  width: number // width as percentage
  height: number // height as percentage
  confidence: number
}

interface AutoScreenshotsProps {
  imageUrl: string
  bodyPositions?: Record<string, BodyPosition>
  roboflowBall?: RoboflowBallDetection | null // Ball position from Roboflow (use as center)
}

const STATUS_STYLES = {
  good: { border: "border-green-500", bg: "bg-green-500/10", text: "text-green-400", icon: CheckCircle },
  warning: { border: "border-yellow-500", bg: "bg-yellow-500/10", text: "text-yellow-400", icon: AlertTriangle },
  critical: { border: "border-red-500", bg: "bg-red-500/10", text: "text-red-400", icon: XCircle },
}

export function AutoScreenshots({ imageUrl, bodyPositions, roboflowBall }: AutoScreenshotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [screenshots, setScreenshots] = useState<Screenshot[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(true)

  // Get worst status from positions
  const getWorstStatus = (positions: BodyPosition[]): "good" | "warning" | "critical" => {
    if (positions.some(p => p.status === "critical")) return "critical"
    if (positions.some(p => p.status === "warning")) return "warning"
    return "good"
  }

  // Auto-capture screenshots when image loads
  const captureScreenshots = useCallback(async () => {
    console.log("[AutoScreenshots] Starting capture, imageUrl:", imageUrl ? "present" : "missing")
    console.log("[AutoScreenshots] bodyPositions:", bodyPositions)
    
    if (!imageUrl) {
      console.log("[AutoScreenshots] No imageUrl, skipping")
      setIsProcessing(false)
      return
    }
    
    setIsProcessing(true)
    
    try {
      const img = new Image()
      img.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          console.log("[AutoScreenshots] Image loaded:", img.width, "x", img.height)
          resolve()
        }
        img.onerror = (e) => {
          console.error("[AutoScreenshots] Image load failed:", e)
          reject(new Error("Failed to load image"))
        }
        img.src = imageUrl
      })

      const canvas = canvasRef.current
      if (!canvas) {
        console.error("[AutoScreenshots] Canvas ref is null!")
        setIsProcessing(false)
        return
      }
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        console.error("[AutoScreenshots] Canvas context is null!")
        setIsProcessing(false)
        return
      }
      
      console.log("[AutoScreenshots] Canvas ready, starting crop...")

      // CENTER EVERYTHING AROUND THE BALL
      // If Roboflow detected the ball, use it as the anchor point
      const ballX = roboflowBall?.x ?? bodyPositions?.ball?.x ?? 50
      const ballY = roboflowBall?.y ?? bodyPositions?.ball?.y ?? 30

      console.log("🏀 Centering screenshots around ball at:", { x: ballX, y: ballY })

      // Define 3 crop regions - ALL CENTERED ON THE BALL
      const regions = [
        {
          id: "ball-and-hands",
          name: "Ball & Hands",
          centerX: ballX, // CENTER ON BALL X
          centerY: ballY, // CENTER ON BALL Y
          width: 40, // Crop around ball (will capture hands)
          height: 35,
          partKeys: ["ball", "shootingHand", "guideHand", "shootingWrist"]
        },
        {
          id: "upper-body",
          name: "Upper Body & Arms",
          centerX: ballX, // CENTER ON BALL X (vertical line)
          centerY: bodyPositions?.shootingShoulder?.y ?? (ballY + 15), // Below ball
          width: 50,
          height: 45,
          partKeys: ["head", "shootingShoulder", "shootingElbow", "shootingWrist", "guideHand", "ball"]
        },
        {
          id: "shooting-arm",
          name: "Shooting Arm",
          centerX: ballX, // CENTER ON BALL X (vertical line)
          centerY: bodyPositions?.shootingElbow?.y ?? (ballY + 20), // Below ball
          width: 35,
          height: 40,
          partKeys: ["shootingShoulder", "shootingElbow", "shootingWrist", "ball"]
        }
      ]

      const captured: Screenshot[] = []

      console.log("[AutoScreenshots] Processing", regions.length, "regions")
      
      for (const region of regions) {
        console.log("[AutoScreenshots] Capturing region:", region.name)
        
        // Get body parts for this region
        const parts: BodyPosition[] = region.partKeys
          .map(key => bodyPositions?.[key])
          .filter((p): p is BodyPosition => p !== undefined)

        // Calculate crop area
        const cropX = Math.max(0, (region.centerX / 100) * img.width - (region.width / 100) * img.width / 2)
        const cropY = Math.max(0, (region.centerY / 100) * img.height - (region.height / 100) * img.height / 2)
        const cropW = Math.min((region.width / 100) * img.width, img.width - cropX)
        const cropH = Math.min((region.height / 100) * img.height, img.height - cropY)

        // Set canvas size
        canvas.width = cropW
        canvas.height = cropH

        // Draw cropped region
        ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH)

        // Get data URL
        const dataUrl = canvas.toDataURL("image/png")
        
        // Build analysis text
        const notes = parts
          .filter(p => p.note)
          .map(p => `${p.label}: ${p.note}`)
          .join(". ")
        
        const angles = parts
          .filter(p => p.angle)
          .map(p => `${p.label} ${p.angle}°`)
          .join(", ")

        captured.push({
          id: region.id,
          name: region.name,
          dataUrl,
          status: getWorstStatus(parts),
          bodyParts: parts,
          analysis: notes || angles || "Click to view details"
        })
      }

      console.log("[AutoScreenshots] Captured", captured.length, "screenshots")
      setScreenshots(captured)
    } catch (error) {
      console.error("[AutoScreenshots] Failed to capture screenshots:", error)
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, bodyPositions, roboflowBall])

  // Auto-trigger after component mounts and canvas is ready
  useEffect(() => {
    // Small delay to ensure canvas is mounted
    const timer = setTimeout(() => {
      if (canvasRef.current) {
        captureScreenshots()
      }
    }, 100)
    
    return () => clearTimeout(timer)
  }, [captureScreenshots])

  // Download screenshot
  const downloadScreenshot = (screenshot: Screenshot) => {
    const link = document.createElement("a")
    link.download = `${screenshot.id}-${Date.now()}.png`
    link.href = screenshot.dataUrl
    link.click()
  }

  // Get expanded screenshot
  const expandedScreenshot = expandedId ? screenshots.find(s => s.id === expandedId) : null

  // Always render the canvas (hidden) so it's available for processing
  return (
    <div className="space-y-4">
      {/* Hidden canvas for processing - MUST be outside conditionals */}
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Processing state */}
      {isProcessing && (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-[#888]">
            <div className="w-5 h-5 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
            <span>Generating key point screenshots...</span>
          </div>
        </div>
      )}
      
      {/* Empty state */}
      {!isProcessing && screenshots.length === 0 && (
        <div className="text-center py-4 text-[#888]">
          No screenshots could be generated
        </div>
      )}

      {/* 3 Screenshot Grid - only show when we have screenshots */}
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
              {/* Screenshot Image */}
              <div className="relative aspect-[4/3] bg-[#1a1a1a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={screenshot.dataUrl}
                  alt={screenshot.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Status badge */}
                <div className={`absolute top-2 right-2 ${styles.bg} ${styles.text} p-1 rounded-full`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Click to expand overlay */}
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                  <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                    Click to expand
                  </span>
                </div>
              </div>

              {/* Info */}
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
            {/* Header */}
            <div className="p-4 border-b border-[#3a3a3a] flex items-center justify-between">
              <h3 className="text-[#FFD700] font-bold text-lg">{expandedScreenshot.name}</h3>
              <button
                onClick={() => setExpandedId(null)}
                className="text-[#888] hover:text-white p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Large Image */}
            <div className="p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={expandedScreenshot.dataUrl}
                alt={expandedScreenshot.name}
                className="w-full rounded-lg"
              />
            </div>
            
            {/* Analysis Details */}
            <div className="p-4 border-t border-[#3a3a3a] space-y-4">
              {/* Status Badge */}
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
              
              {/* Body Parts Analysis */}
              {expandedScreenshot.bodyParts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider">Detailed Analysis</h4>
                  {expandedScreenshot.bodyParts.map((part, i) => {
                    const partStyles = STATUS_STYLES[part.status || "good"]
                    return (
                      <div key={i} className={`${partStyles.bg} border ${partStyles.border} rounded-lg p-3`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold ${partStyles.text}`}>
                            {part.label}
                            {part.angle && ` — ${part.angle}°`}
                          </span>
                          <span className={`text-xs ${partStyles.text} uppercase`}>{part.status}</span>
                        </div>
                        {part.note && (
                          <p className="text-[#E5E5E5] text-sm">{part.note}</p>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {/* Download Button */}
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



