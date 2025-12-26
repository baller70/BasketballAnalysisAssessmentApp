"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { Play, Pause, RotateCcw } from "lucide-react"

interface Annotation {
  id: string
  label: string
  textPosition: { x: number; y: number; width: number; height: number }
  bodyPartPosition: { x: number; y: number }
  status: 'good' | 'warning' | 'bad'
  value: string
  feedback: string
}

interface AnnotationWalkthroughVideoProps {
  annotatedImageUrl: string // Full annotated image with all overlays
  skeletonImageUrl: string // Image with skeleton overlay only
  annotations: Annotation[]
  imageWidth: number
  imageHeight: number
}

// Animation phases
type AnimationPhase = 
  | { type: 'cover' }
  | { type: 'zoom-annotation'; annotationIndex: number }
  | { type: 'pan-to-body'; annotationIndex: number; progress: number }
  | { type: 'hold-body'; annotationIndex: number }
  | { type: 'final-skeleton' }

// Timing constants (in milliseconds)
const ZOOM_ANNOTATION_DURATION = 4500 // 4.5 seconds
const PAN_DURATION = 400 // Fast pan - 0.4 seconds
const HOLD_BODY_DURATION = 2500 // 2.5 seconds
const FINAL_SKELETON_DURATION = 5000 // 5 seconds

export function AnnotationWalkthroughVideo({
  annotatedImageUrl,
  skeletonImageUrl,
  annotations,
  imageWidth,
  imageHeight
}: AnnotationWalkthroughVideoProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const annotatedImageRef = useRef<HTMLImageElement | null>(null)
  const skeletonImageRef = useRef<HTMLImageElement | null>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPhase, setCurrentPhase] = useState<AnimationPhase>({ type: 'cover' })
  const [elapsedTime, setElapsedTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState(false)
  
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const phaseStartTimeRef = useRef<number>(0)

  // Calculate total video duration
  useEffect(() => {
    const perAnnotation = ZOOM_ANNOTATION_DURATION + PAN_DURATION + HOLD_BODY_DURATION
    const total = (annotations.length * perAnnotation) + FINAL_SKELETON_DURATION
    setTotalDuration(total)
  }, [annotations.length])

  // Load images
  useEffect(() => {
    let loadedCount = 0
    const checkLoaded = () => {
      loadedCount++
      if (loadedCount >= 2) {
        setImagesLoaded(true)
        drawCoverFrame()
      }
    }

    const annotatedImg = new window.Image()
    annotatedImg.crossOrigin = 'anonymous'
    annotatedImg.onload = () => {
      annotatedImageRef.current = annotatedImg
      checkLoaded()
    }
    annotatedImg.src = annotatedImageUrl

    const skeletonImg = new window.Image()
    skeletonImg.crossOrigin = 'anonymous'
    skeletonImg.onload = () => {
      skeletonImageRef.current = skeletonImg
      checkLoaded()
    }
    skeletonImg.src = skeletonImageUrl || annotatedImageUrl
  }, [annotatedImageUrl, skeletonImageUrl])

  // Draw cover frame (full annotated image)
  const drawCoverFrame = useCallback(() => {
    const canvas = canvasRef.current
    const img = annotatedImageRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    canvas.width = imageWidth
    canvas.height = imageHeight

    // Draw full annotated image
    ctx.drawImage(img, 0, 0, imageWidth, imageHeight)

    // Draw "Press Play" overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)'
    ctx.fillRect(0, 0, imageWidth, imageHeight)

    // Play button circle
    const centerX = imageWidth / 2
    const centerY = imageHeight / 2
    const radius = Math.min(imageWidth, imageHeight) * 0.08

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 215, 0, 0.9)'
    ctx.fill()
    ctx.strokeStyle = 'white'
    ctx.lineWidth = 3
    ctx.stroke()

    // Play triangle
    ctx.beginPath()
    ctx.moveTo(centerX - radius * 0.3, centerY - radius * 0.4)
    ctx.lineTo(centerX - radius * 0.3, centerY + radius * 0.4)
    ctx.lineTo(centerX + radius * 0.5, centerY)
    ctx.closePath()
    ctx.fillStyle = '#1a1a1a'
    ctx.fill()

    // "Click to Play" text
    ctx.fillStyle = 'white'
    ctx.font = `bold ${Math.max(16, imageWidth * 0.025)}px system-ui`
    ctx.textAlign = 'center'
    ctx.fillText('Click to Play Walkthrough', centerX, centerY + radius + 30)
  }, [imageWidth, imageHeight])

  // Draw current frame based on animation phase
  const drawFrame = useCallback((phase: AnimationPhase, phaseProgress: number) => {
    const canvas = canvasRef.current
    const annotatedImg = annotatedImageRef.current
    const skeletonImg = skeletonImageRef.current
    if (!canvas || !annotatedImg) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Calculate zoom and pan based on phase
    let scale = 1
    let offsetX = 0
    let offsetY = 0
    let useSkeletonImage = false

    if (phase.type === 'cover') {
      // Full view
      scale = 1
      offsetX = 0
      offsetY = 0
    } else if (phase.type === 'zoom-annotation') {
      // Zoom into annotation text
      const annotation = annotations[phase.annotationIndex]
      if (annotation) {
        scale = 2.5 // Zoom in 2.5x to make text readable
        const targetX = annotation.textPosition.x + annotation.textPosition.width / 2
        const targetY = annotation.textPosition.y + annotation.textPosition.height / 2
        offsetX = (canvas.width / 2) - (targetX * scale)
        offsetY = (canvas.height / 2) - (targetY * scale)
      }
    } else if (phase.type === 'pan-to-body') {
      // Fast pan from annotation to body part
      const annotation = annotations[phase.annotationIndex]
      if (annotation) {
        scale = 2.5
        const startX = annotation.textPosition.x + annotation.textPosition.width / 2
        const startY = annotation.textPosition.y + annotation.textPosition.height / 2
        const endX = annotation.bodyPartPosition.x
        const endY = annotation.bodyPartPosition.y
        
        // Ease-out for fast start, slow end
        const easeProgress = 1 - Math.pow(1 - phaseProgress, 3)
        
        const currentX = startX + (endX - startX) * easeProgress
        const currentY = startY + (endY - startY) * easeProgress
        
        offsetX = (canvas.width / 2) - (currentX * scale)
        offsetY = (canvas.height / 2) - (currentY * scale)
      }
    } else if (phase.type === 'hold-body') {
      // Hold on body part
      const annotation = annotations[phase.annotationIndex]
      if (annotation) {
        scale = 2.5
        offsetX = (canvas.width / 2) - (annotation.bodyPartPosition.x * scale)
        offsetY = (canvas.height / 2) - (annotation.bodyPartPosition.y * scale)
      }
    } else if (phase.type === 'final-skeleton') {
      // Full skeleton view
      scale = 1
      offsetX = 0
      offsetY = 0
      useSkeletonImage = true
    }

    // Apply transform and draw
    ctx.save()
    ctx.translate(offsetX, offsetY)
    ctx.scale(scale, scale)
    
    const imgToDraw = useSkeletonImage && skeletonImg ? skeletonImg : annotatedImg
    ctx.drawImage(imgToDraw, 0, 0, imageWidth, imageHeight)
    
    ctx.restore()

    // Draw timer in upper right corner (BIGGER)
    const timerWidth = 140
    const timerHeight = 50
    const timerX = canvas.width - timerWidth - 20
    const timerY = 20

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    ctx.beginPath()
    ctx.roundRect(timerX, timerY, timerWidth, timerHeight, 10)
    ctx.fill()

    ctx.strokeStyle = '#FF6B35'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(timerX, timerY, timerWidth, timerHeight, 10)
    ctx.stroke()

    ctx.fillStyle = '#FF6B35'
    ctx.font = 'bold 28px monospace' // BIGGER font
    ctx.textAlign = 'center'
    ctx.fillText(`${(elapsedTime / 1000).toFixed(1)}s`, timerX + timerWidth / 2, timerY + 35)

    // Draw phase indicator
    if (phase.type !== 'cover') {
      let phaseLabel = ''
      if (phase.type === 'zoom-annotation') {
        const ann = annotations[phase.annotationIndex]
        phaseLabel = `📍 ${ann?.label || 'Annotation'}`
      } else if (phase.type === 'pan-to-body') {
        phaseLabel = '➡️ Moving to body part...'
      } else if (phase.type === 'hold-body') {
        const ann = annotations[phase.annotationIndex]
        phaseLabel = `🎯 ${ann?.label || 'Body Part'}`
      } else if (phase.type === 'final-skeleton') {
        phaseLabel = '🦴 Full Skeleton View'
      }

      if (phaseLabel) {
        const labelWidth = ctx.measureText(phaseLabel).width + 40
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
        ctx.beginPath()
        ctx.roundRect(20, 20, labelWidth, 40, 8)
        ctx.fill()

        ctx.fillStyle = 'white'
        ctx.font = 'bold 18px system-ui'
        ctx.textAlign = 'left'
        ctx.fillText(phaseLabel, 35, 47)
      }
    }

    // Draw progress bar at bottom
    const progressBarHeight = 6
    const progressBarY = canvas.height - progressBarHeight - 10
    const progress = elapsedTime / totalDuration

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.fillRect(20, progressBarY, canvas.width - 40, progressBarHeight)

    ctx.fillStyle = '#FF6B35'
    ctx.fillRect(20, progressBarY, (canvas.width - 40) * progress, progressBarHeight)

  }, [annotations, imageWidth, imageHeight, elapsedTime, totalDuration])

  // Animation loop
  const animate = useCallback((timestamp: number) => {
    if (!isPlaying) return

    if (startTimeRef.current === 0) {
      startTimeRef.current = timestamp
      phaseStartTimeRef.current = timestamp
    }

    const elapsed = timestamp - startTimeRef.current
    setElapsedTime(elapsed)

    // Determine current phase based on elapsed time
    let accumulatedTime = 0
    let newPhase: AnimationPhase = { type: 'cover' }
    let phaseProgress = 0

    for (let i = 0; i < annotations.length; i++) {
      // Zoom annotation phase
      if (elapsed < accumulatedTime + ZOOM_ANNOTATION_DURATION) {
        newPhase = { type: 'zoom-annotation', annotationIndex: i }
        phaseProgress = (elapsed - accumulatedTime) / ZOOM_ANNOTATION_DURATION
        break
      }
      accumulatedTime += ZOOM_ANNOTATION_DURATION

      // Pan to body phase
      if (elapsed < accumulatedTime + PAN_DURATION) {
        newPhase = { type: 'pan-to-body', annotationIndex: i, progress: (elapsed - accumulatedTime) / PAN_DURATION }
        phaseProgress = (elapsed - accumulatedTime) / PAN_DURATION
        break
      }
      accumulatedTime += PAN_DURATION

      // Hold body phase
      if (elapsed < accumulatedTime + HOLD_BODY_DURATION) {
        newPhase = { type: 'hold-body', annotationIndex: i }
        phaseProgress = (elapsed - accumulatedTime) / HOLD_BODY_DURATION
        break
      }
      accumulatedTime += HOLD_BODY_DURATION

      // If we've gone through all annotations, check for final skeleton
      if (i === annotations.length - 1) {
        if (elapsed < accumulatedTime + FINAL_SKELETON_DURATION) {
          newPhase = { type: 'final-skeleton' }
          phaseProgress = (elapsed - accumulatedTime) / FINAL_SKELETON_DURATION
        } else {
          // Video ended - stop playing
          setIsPlaying(false)
          setCurrentPhase({ type: 'cover' })
          startTimeRef.current = 0
          setElapsedTime(0)
          drawCoverFrame()
          return
        }
      }
    }

    // Handle case with no annotations - go straight to final skeleton
    if (annotations.length === 0) {
      if (elapsed < FINAL_SKELETON_DURATION) {
        newPhase = { type: 'final-skeleton' }
        phaseProgress = elapsed / FINAL_SKELETON_DURATION
      } else {
        setIsPlaying(false)
        setCurrentPhase({ type: 'cover' })
        startTimeRef.current = 0
        setElapsedTime(0)
        drawCoverFrame()
        return
      }
    }

    setCurrentPhase(newPhase)
    drawFrame(newPhase, phaseProgress)

    animationRef.current = requestAnimationFrame(animate)
  }, [isPlaying, annotations, drawFrame, drawCoverFrame])

  // Start/stop animation
  useEffect(() => {
    if (isPlaying) {
      animationRef.current = requestAnimationFrame(animate)
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, animate])

  // Handle play/pause
  const togglePlay = () => {
    if (!imagesLoaded) return
    
    if (!isPlaying && currentPhase.type === 'cover') {
      // Starting fresh
      startTimeRef.current = 0
      setElapsedTime(0)
    }
    setIsPlaying(!isPlaying)
  }

  // Handle restart
  const restart = () => {
    setIsPlaying(false)
    setCurrentPhase({ type: 'cover' })
    startTimeRef.current = 0
    setElapsedTime(0)
    setTimeout(() => {
      drawCoverFrame()
    }, 50)
  }

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div ref={containerRef} className="relative bg-black rounded-xl overflow-hidden">
      {/* Canvas - This is the video display */}
      <canvas
        ref={canvasRef}
        width={imageWidth}
        height={imageHeight}
        className="w-full h-auto cursor-pointer"
        onClick={togglePlay}
      />

      {/* Controls - Regular size (reverted) */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              disabled={!imagesLoaded}
              className="p-2 rounded-full bg-[#FF6B35] hover:bg-[#E55300] text-black transition-colors disabled:opacity-50"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={restart}
              className="p-2 rounded-lg bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Time display - Regular size */}
          <div className="text-white font-mono text-sm">
            {formatTime(elapsedTime)} / {formatTime(totalDuration)}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-1 bg-white/30 rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#FF6B35] transition-all duration-100"
            style={{ width: `${(elapsedTime / totalDuration) * 100}%` }}
          />
        </div>
      </div>

      {/* Loading overlay */}
      {!imagesLoaded && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full mx-auto mb-2" />
            <p>Loading walkthrough...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default AnnotationWalkthroughVideo

