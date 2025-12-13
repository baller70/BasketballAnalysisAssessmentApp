"use client"

import React, { useRef, useState, useCallback, useEffect } from "react"
import { 
  Play, Pause, SkipBack, SkipForward, Camera, Download, 
  Trash2, ChevronLeft, ChevronRight, ZoomIn 
} from "lucide-react"

interface CapturedFrame {
  id: string
  timestamp: number
  dataUrl: string
  label?: string
}

interface VideoFrameCaptureProps {
  videoUrl?: string
  videoFile?: File | null
  onFramesCaptured?: (frames: CapturedFrame[]) => void
  onFrameSelect?: (frame: CapturedFrame) => void
}

export function VideoFrameCapture({ 
  videoUrl, 
  videoFile,
  onFramesCaptured,
  onFrameSelect 
}: VideoFrameCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [capturedFrames, setCapturedFrames] = useState<CapturedFrame[]>([])
  const [selectedFrame, setSelectedFrame] = useState<string | null>(null)
  const [videoSrc, setVideoSrc] = useState<string>("")

  // Load video source
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoSrc(url)
      return () => URL.revokeObjectURL(url)
    } else if (videoUrl) {
      setVideoSrc(videoUrl)
    }
  }, [videoFile, videoUrl])

  // Video event handlers
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current
    if (video) {
      setDuration(video.duration)
    }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current
    if (video) {
      setCurrentTime(video.currentTime)
    }
  }, [])

  const handlePlay = useCallback(() => setIsPlaying(true), [])
  const handlePause = useCallback(() => setIsPlaying(false), [])

  // Playback controls
  const togglePlayPause = useCallback(() => {
    const video = videoRef.current
    if (!video) return
    
    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }, [isPlaying])

  const seekTo = useCallback((time: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.max(0, Math.min(time, duration))
    }
  }, [duration])

  const stepFrame = useCallback((direction: "forward" | "back") => {
    const video = videoRef.current
    if (!video) return
    
    // Assume ~30fps, step by 1 frame
    const frameTime = 1 / 30
    const newTime = direction === "forward" 
      ? video.currentTime + frameTime 
      : video.currentTime - frameTime
    
    video.currentTime = Math.max(0, Math.min(newTime, duration))
  }, [duration])

  const skipTime = useCallback((seconds: number) => {
    const video = videoRef.current
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration))
    }
  }, [duration])

  // Timeline click handler
  const handleTimelineClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const timeline = timelineRef.current
    if (!timeline || !duration) return
    
    const rect = timeline.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = x / rect.width
    const newTime = percentage * duration
    
    seekTo(newTime)
  }, [duration, seekTo])

  // Capture current frame
  const captureFrame = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    
    // Set canvas size to match video
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    // Export as data URL
    const dataUrl = canvas.toDataURL("image/png")
    
    const newFrame: CapturedFrame = {
      id: `frame-${Date.now()}`,
      timestamp: video.currentTime,
      dataUrl,
      label: `Frame ${capturedFrames.length + 1}`
    }
    
    const updatedFrames = [...capturedFrames, newFrame]
    setCapturedFrames(updatedFrames)
    onFramesCaptured?.(updatedFrames)
    
    // Select the new frame
    setSelectedFrame(newFrame.id)
  }, [capturedFrames, onFramesCaptured])

  // Delete frame
  const deleteFrame = useCallback((id: string) => {
    const updatedFrames = capturedFrames.filter(f => f.id !== id)
    setCapturedFrames(updatedFrames)
    onFramesCaptured?.(updatedFrames)
    
    if (selectedFrame === id) {
      setSelectedFrame(updatedFrames.length > 0 ? updatedFrames[0].id : null)
    }
  }, [capturedFrames, selectedFrame, onFramesCaptured])

  // Download frame
  const downloadFrame = useCallback((frame: CapturedFrame) => {
    const link = document.createElement("a")
    link.download = `basketball-frame-${frame.timestamp.toFixed(2)}s.png`
    link.href = frame.dataUrl
    link.click()
  }, [])

  // Format time as MM:SS.ms
  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    const ms = Math.floor((time % 1) * 100)
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms.toString().padStart(2, "0")}`
  }

  if (!videoSrc) {
    return (
      <div className="bg-[#2a2a2a] rounded-lg border border-[#4a4a4a] p-8 text-center">
        <Camera className="w-12 h-12 text-[#4a4a4a] mx-auto mb-4" />
        <p className="text-[#888]">Upload a video to capture frames</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Video Player */}
      <div className="bg-[#1a1a1a] rounded-xl overflow-hidden border-2 border-[#3a3a3a]">
        <div className="relative aspect-video bg-black flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoSrc}
            className="max-w-full max-h-full"
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            playsInline
          />
          
          {/* Capture overlay button */}
          <button
            onClick={captureFrame}
            className="absolute top-4 right-4 bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] p-3 rounded-full shadow-lg transition-colors"
            title="Capture Frame"
          >
            <Camera className="w-6 h-6" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 bg-[#2a2a2a] space-y-3">
          {/* Timeline */}
          <div 
            ref={timelineRef}
            className="relative h-2 bg-[#4a4a4a] rounded-full cursor-pointer"
            onClick={handleTimelineClick}
          >
            {/* Progress */}
            <div 
              className="absolute left-0 top-0 h-full bg-[#FFD700] rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
            
            {/* Frame markers */}
            {capturedFrames.map(frame => (
              <div
                key={frame.id}
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full border-2 border-white cursor-pointer z-10"
                style={{ left: `${(frame.timestamp / duration) * 100}%` }}
                onClick={(e) => {
                  e.stopPropagation()
                  seekTo(frame.timestamp)
                  setSelectedFrame(frame.id)
                }}
                title={`Frame at ${formatTime(frame.timestamp)}`}
              />
            ))}
            
            {/* Playhead */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-lg cursor-grab"
              style={{ left: `${(currentTime / duration) * 100}%`, transform: "translate(-50%, -50%)" }}
            />
          </div>

          {/* Time display */}
          <div className="flex items-center justify-between text-sm text-[#888]">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Playback buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => skipTime(-5)}
              className="p-2 text-[#888] hover:text-white transition-colors"
              title="Back 5s"
            >
              <SkipBack className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => stepFrame("back")}
              className="p-2 text-[#888] hover:text-white transition-colors"
              title="Previous Frame"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <button
              onClick={togglePlayPause}
              className="p-3 bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] rounded-full transition-colors"
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </button>
            
            <button
              onClick={() => stepFrame("forward")}
              className="p-2 text-[#888] hover:text-white transition-colors"
              title="Next Frame"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => skipTime(5)}
              className="p-2 text-[#888] hover:text-white transition-colors"
              title="Forward 5s"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          {/* Capture button */}
          <button
            onClick={captureFrame}
            className="w-full bg-[#FFD700] hover:bg-[#E5C100] text-[#1a1a1a] font-bold py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Camera className="w-5 h-5" />
            Capture This Frame
          </button>
        </div>
      </div>

      {/* Captured Frames Strip */}
      {capturedFrames.length > 0 && (
        <div className="bg-[#2a2a2a] rounded-lg border border-[#4a4a4a] p-4">
          <h4 className="text-[#FFD700] font-semibold text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Captured Frames ({capturedFrames.length})
          </h4>
          
          <div className="flex gap-3 overflow-x-auto pb-2">
            {capturedFrames.map((frame) => (
              <div
                key={frame.id}
                className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 cursor-pointer transition-all ${
                  selectedFrame === frame.id 
                    ? "border-[#FFD700] ring-2 ring-[#FFD700]/50" 
                    : "border-[#4a4a4a] hover:border-[#6a6a6a]"
                }`}
                onClick={() => {
                  setSelectedFrame(frame.id)
                  seekTo(frame.timestamp)
                  onFrameSelect?.(frame)
                }}
              >
                {/* Thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={frame.dataUrl}
                  alt={frame.label}
                  className="w-32 h-20 object-cover"
                />
                
                {/* Timestamp badge */}
                <div className="absolute bottom-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                  {formatTime(frame.timestamp)}
                </div>
                
                {/* Action buttons */}
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      downloadFrame(frame)
                    }}
                    className="bg-black/70 hover:bg-black/90 text-white p-1 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteFrame(frame.id)
                    }}
                    className="bg-red-500/70 hover:bg-red-500 text-white p-1 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Use Selected Frame for Analysis */}
          {selectedFrame && (
            <div className="mt-3 pt-3 border-t border-[#4a4a4a]">
              <button
                onClick={() => {
                  const frame = capturedFrames.find(f => f.id === selectedFrame)
                  if (frame) {
                    onFrameSelect?.(frame)
                  }
                }}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
                Use Selected Frame for Analysis
              </button>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="text-center text-[#888] text-sm">
        <p>Use the timeline to find key moments: <strong>Load</strong>, <strong>Set</strong>, <strong>Release</strong>, <strong>Follow-through</strong></p>
        <p className="mt-1">Click <Camera className="w-4 h-4 inline" /> to capture frames for analysis</p>
      </div>
    </div>
  )
}



