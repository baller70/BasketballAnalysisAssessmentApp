"use client"

import React, { useRef, useEffect, useState, useCallback } from "react"
import { Download, RefreshCw } from "lucide-react"

interface BodyPosition {
  x: number  // 0-100 percentage
  y: number  // 0-100 percentage
  label: string
  angle?: number | null
  status?: "good" | "warning" | "critical"
  note?: string
}

// Roboflow detection result for basketball
interface RoboflowBallDetection {
  x: number // center x as percentage
  y: number // center y as percentage
  width: number // width as percentage
  height: number // height as percentage
  confidence: number
}

interface CanvasAnnotationProps {
  imageUrl: string
  bodyPositions?: Record<string, BodyPosition>
  centerLineX?: number  // 0-100 percentage
  overallScore?: number
  phase?: string
  roboflowBall?: RoboflowBallDetection | null  // Roboflow detected basketball (more accurate)
}

const STATUS_COLORS = {
  good: "#22c55e",      // Green
  warning: "#eab308",   // Yellow
  critical: "#ef4444",  // Red
}

export function CanvasAnnotation({ 
  imageUrl, 
  bodyPositions, 
  centerLineX,
  overallScore,
  phase,
  roboflowBall 
}: CanvasAnnotationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  const [isExporting, setIsExporting] = useState(false)

  // Draw everything on canvas
  const drawCanvas = useCallback((ctx: CanvasRenderingContext2D, img: HTMLImageElement) => {
    const canvas = ctx.canvas
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Fill background
    ctx.fillStyle = "#1a1a1a"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Calculate image dimensions to fit and center
    const maxWidth = canvas.width - 40  // Padding
    const maxHeight = canvas.height - 40
    const scale = Math.min(maxWidth / img.width, maxHeight / img.height)
    const imgWidth = img.width * scale
    const imgHeight = img.height * scale
    const imgX = (canvas.width - imgWidth) / 2
    const imgY = (canvas.height - imgHeight) / 2
    
    // Draw image centered
    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight)
    
    // Draw center line if provided
    if (centerLineX !== undefined) {
      const lineX = imgX + (centerLineX / 100) * imgWidth
      ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"  // Blue with transparency
      ctx.lineWidth = 2
      ctx.setLineDash([10, 5])
      ctx.beginPath()
      ctx.moveTo(lineX, imgY)
      ctx.lineTo(lineX, imgY + imgHeight)
      ctx.stroke()
      ctx.setLineDash([])  // Reset dash
    }
    
    // ========================================
    // FIRST: DRAW A CIRCLE AROUND THE BALL
    // Priority: 1. Roboflow detection (most accurate)
    //           2. Vision AI bodyPositions.ball (fallback)
    // ========================================
    
    // Determine ball position - Roboflow first, then Vision AI fallback
    let ballX: number | null = null
    let ballY: number | null = null
    let ballRadius: number = Math.min(imgWidth, imgHeight) * 0.08 // Default 8% of image
    let ballSource = ""
    
    if (roboflowBall) {
      // USE ROBOFLOW DETECTION (most accurate - real object detection)
      ballX = imgX + (roboflowBall.x / 100) * imgWidth
      ballY = imgY + (roboflowBall.y / 100) * imgHeight
      // Use the actual detected size from Roboflow
      ballRadius = Math.max(
        (roboflowBall.width / 100) * imgWidth / 2,
        (roboflowBall.height / 100) * imgHeight / 2
      )
      ballSource = `ROBOFLOW (${(roboflowBall.confidence * 100).toFixed(0)}%)`
      console.log("🏀 Drawing ball from ROBOFLOW:", { x: roboflowBall.x, y: roboflowBall.y, confidence: roboflowBall.confidence })
    } else if (bodyPositions?.ball) {
      // FALLBACK to Vision AI detection
      const ball = bodyPositions.ball
      const ballXOffset = 3
      const ballYOffset = 3
      ballX = imgX + ((ball.x + ballXOffset) / 100) * imgWidth
      ballY = imgY + ((ball.y + ballYOffset) / 100) * imgHeight
      ballSource = "VISION AI"
      console.log("🏀 Drawing ball from VISION AI:", { x: ball.x, y: ball.y })
    }
    
    // Draw the ball circle if we have coordinates
    if (ballX !== null && ballY !== null) {
      // Outer glow
      ctx.strokeStyle = "rgba(255, 165, 0, 0.5)"
      ctx.lineWidth = 8
      ctx.beginPath()
      ctx.arc(ballX, ballY, ballRadius + 5, 0, Math.PI * 2)
      ctx.stroke()
      
      // Main circle - ORANGE to match basketball
      ctx.strokeStyle = "#FF8C00" // Dark orange
      ctx.lineWidth = 4
      ctx.beginPath()
      ctx.arc(ballX, ballY, ballRadius, 0, Math.PI * 2)
      ctx.stroke()
      
      // Inner circle
      ctx.strokeStyle = "#FFD700" // Gold
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(ballX, ballY, ballRadius - 5, 0, Math.PI * 2)
      ctx.stroke()
      
      // Label with source
      ctx.fillStyle = "#FF8C00"
      ctx.font = "bold 14px Arial"
      const ballLabel = `BALL - ${ballSource}`
      const ballLabelWidth = ctx.measureText(ballLabel).width
      ctx.fillText(ballLabel, ballX - ballLabelWidth / 2, ballY - ballRadius - 15)
    }
    
    // ========================================
    // THEN: Draw other body position annotations
    // ========================================
    if (bodyPositions) {
      const positions = Object.entries(bodyPositions).filter(([key]) => key !== "ball") // Skip ball, already drawn
      const leftSide: [string, BodyPosition][] = []
      const rightSide: [string, BodyPosition][] = []
      
      // Split annotations to left and right of center
      positions.forEach(([key, pos]) => {
        if (pos.x < 50) {
          leftSide.push([key, pos])
        } else {
          rightSide.push([key, pos])
        }
      })
      
      // Sort by y position (top to bottom)
      leftSide.sort((a, b) => a[1].y - b[1].y)
      rightSide.sort((a, b) => a[1].y - b[1].y)
      
      // Draw left side annotations (labels on left)
      leftSide.forEach(([, pos], index) => {
        const pointX = imgX + (pos.x / 100) * imgWidth
        const pointY = imgY + (pos.y / 100) * imgHeight
        const labelX = 20
        const labelY = imgY + 30 + index * 50
        
        drawAnnotation(ctx, pointX, pointY, labelX, labelY, pos, "left")
      })
      
      // Draw right side annotations (labels on right)
      rightSide.forEach(([, pos], index) => {
        const pointX = imgX + (pos.x / 100) * imgWidth
        const pointY = imgY + (pos.y / 100) * imgHeight
        const labelX = canvas.width - 20
        const labelY = imgY + 30 + index * 50
        
        drawAnnotation(ctx, pointX, pointY, labelX, labelY, pos, "right")
      })
    }
    
    // Draw phase badge at top
    if (phase) {
      ctx.fillStyle = "rgba(255, 215, 0, 0.9)"
      const phaseText = phase.replace("_", " ") + " PHASE"
      ctx.font = "bold 14px Arial"
      const textWidth = ctx.measureText(phaseText).width
      const badgeX = (canvas.width - textWidth - 20) / 2
      
      // Badge background
      ctx.beginPath()
      ctx.roundRect(badgeX, 10, textWidth + 20, 28, 4)
      ctx.fill()
      
      // Badge text
      ctx.fillStyle = "#1a1a1a"
      ctx.fillText(phaseText, badgeX + 10, 29)
    }
    
    // Draw score badge at bottom
    if (overallScore !== undefined) {
      const scoreColor = overallScore >= 80 ? "#22c55e" : overallScore >= 65 ? "#eab308" : "#ef4444"
      ctx.fillStyle = scoreColor
      ctx.font = "bold 16px Arial"
      const scoreText = `SCORE: ${overallScore}`
      const textWidth = ctx.measureText(scoreText).width
      const badgeX = (canvas.width - textWidth - 20) / 2
      
      // Badge background
      ctx.beginPath()
      ctx.roundRect(badgeX, canvas.height - 38, textWidth + 20, 28, 4)
      ctx.fill()
      
      // Badge text
      ctx.fillStyle = "#ffffff"
      ctx.fillText(scoreText, badgeX + 10, canvas.height - 18)
    }
    
  }, [bodyPositions, centerLineX, overallScore, phase, roboflowBall])

  // Draw a single annotation with leader line
  function drawAnnotation(
    ctx: CanvasRenderingContext2D,
    pointX: number,
    pointY: number,
    labelX: number,
    labelY: number,
    pos: BodyPosition,
    side: "left" | "right"
  ) {
    const color = STATUS_COLORS[pos.status || "good"]
    
    // Draw point circle on body part
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(pointX, pointY, 6, 0, Math.PI * 2)
    ctx.fill()
    
    // Draw white border on circle
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw leader line
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(pointX, pointY)
    
    // Add a bend in the line
    const midX = side === "left" ? labelX + 80 : labelX - 80
    ctx.lineTo(midX, labelY)
    ctx.lineTo(labelX, labelY)
    ctx.stroke()
    
    // Draw label background
    const labelText = pos.label + (pos.angle ? ` ${pos.angle}°` : "")
    const noteText = pos.note || ""
    ctx.font = "bold 12px Arial"
    const labelWidth = Math.max(ctx.measureText(labelText).width, ctx.measureText(noteText).width) + 16
    const labelHeight = noteText ? 36 : 22
    
    const bgX = side === "left" ? labelX - 4 : labelX - labelWidth + 4
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)"
    ctx.beginPath()
    ctx.roundRect(bgX, labelY - 14, labelWidth, labelHeight, 4)
    ctx.fill()
    
    // Draw label border
    ctx.strokeStyle = color
    ctx.lineWidth = 2
    ctx.stroke()
    
    // Draw label text
    ctx.fillStyle = color
    ctx.font = "bold 12px Arial"
    const textX = side === "left" ? labelX + 4 : labelX - labelWidth + 12
    ctx.fillText(labelText, textX, labelY)
    
    // Draw note text
    if (noteText) {
      ctx.fillStyle = "#ffffff"
      ctx.font = "11px Arial"
      ctx.fillText(noteText, textX, labelY + 14)
    }
    
    // Draw status icon
    const iconX = side === "left" ? bgX + labelWidth - 16 : bgX + 4
    ctx.fillStyle = color
    ctx.font = "12px Arial"
    const icon = pos.status === "good" ? "✓" : pos.status === "warning" ? "⚠" : "✗"
    ctx.fillText(icon, iconX, labelY)
  }

  // Load image and draw
  useEffect(() => {
    if (!imageUrl) return
    
    const img = new Image()
    img.crossOrigin = "anonymous"
    
    img.onload = () => {
      // Set canvas size based on image aspect ratio
      const maxWidth = 900
      const maxHeight = 700
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1)
      const width = Math.max(800, img.width * scale + 300)  // Extra space for labels
      const height = Math.max(600, img.height * scale + 80)
      
      setCanvasSize({ width, height })
      setImageLoaded(true)
      
      // Draw after state update
      setTimeout(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext("2d")
        if (!ctx) return
        drawCanvas(ctx, img)
      }, 50)
    }
    
    img.onerror = () => {
      console.error("Failed to load image for canvas")
    }
    
    img.src = imageUrl
  }, [imageUrl, drawCanvas])

  // Redraw when data changes
  useEffect(() => {
    if (!imageLoaded || !imageUrl) return
    
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      drawCanvas(ctx, img)
    }
    img.src = imageUrl
  }, [bodyPositions, centerLineX, overallScore, phase, roboflowBall, imageLoaded, imageUrl, drawCanvas])

  // Export as PNG
  const handleExport = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsExporting(true)
    
    try {
      const dataUrl = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.download = `basketball-analysis-${Date.now()}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export image")
    } finally {
      setIsExporting(false)
    }
  }, [])

  // Export as JPEG
  const handleExportJpeg = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    
    setIsExporting(true)
    
    try {
      const dataUrl = canvas.toDataURL("image/jpeg", 0.95)
      const link = document.createElement("a")
      link.download = `basketball-analysis-${Date.now()}.jpg`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error("Export failed:", err)
      alert("Failed to export image")
    } finally {
      setIsExporting(false)
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Canvas Container */}
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-[#3a3a3a] flex justify-center">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="max-w-full h-auto"
        />
      </div>

      {/* Export Buttons */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleExport}
          disabled={isExporting || !imageLoaded}
          className="bg-[#FFD700] hover:bg-[#E5C100] disabled:bg-[#4a4a4a] disabled:text-[#888] text-[#1a1a1a] font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          {isExporting ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <Download className="w-5 h-5" />
          )}
          Export PNG
        </button>
        <button
          onClick={handleExportJpeg}
          disabled={isExporting || !imageLoaded}
          className="bg-[#3a3a3a] hover:bg-[#4a4a4a] disabled:bg-[#2a2a2a] disabled:text-[#666] text-white font-bold px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Download className="w-5 h-5" />
          Export JPEG
        </button>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-[#888]">Good Form</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <span className="text-[#888]">Needs Adjustment</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-[#888]">Critical Issue</span>
        </div>
      </div>
    </div>
  )
}



