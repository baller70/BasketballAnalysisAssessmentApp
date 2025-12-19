"use client"

import React, { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AlertTriangle, Loader2, Play, Upload, X, Video, ChevronLeft, ChevronRight, Pause } from "lucide-react"
import { cn } from "@/lib/utils"
import { analyzeVideoShooting, convertVideoToSessionFormat, type VideoAnalysisResult } from "@/services/videoAnalysis"
import { useAnalysisStore } from "@/stores/analysisStore"
import { 
  saveSession, 
  createSessionFromAnalysis,
  type SessionScreenshot 
} from "@/services/sessionStorage"
import { detectFlawsFromAngles, getShooterLevel } from "@/data/shootingFlawsDatabase"

interface VideoUploadProps {
  onAnalysisComplete?: (result: VideoAnalysisResult) => void
}

export function VideoUpload({ onAnalysisComplete }: VideoUploadProps) {
  const router = useRouter()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  
  // Frame playback state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    setVisionAnalysisResult,
    setUploadedImageBase64,
  } = useAnalysisStore()

  // Auto-play frames
  useEffect(() => {
    if (isPlaying && result && result.annotated_frames_base64 && result.annotated_frames_base64.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => {
          const next = prev + 1
          if (next >= (result.annotated_frames_base64?.length || 0)) {
            setIsPlaying(false)
            return 0
          }
          return next
        })
      }, 100) // 10 FPS playback
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
    }
    
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, result])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('video/')) {
      setError('Please select a video file')
      return
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('Video must be under 50MB')
      return
    }

    // Clear previous state
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    
    setVideoFile(file)
    setVideoPreviewUrl(URL.createObjectURL(file))
    setError(null)
    setResult(null)
    setCurrentFrameIndex(0)
    setIsPlaying(false)
  }

  const clearVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setResult(null)
    setError(null)
    setCurrentFrameIndex(0)
    setIsPlaying(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const analyzeVideo = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysisProgress("Uploading video...")

    try {
      setAnalysisProgress("Analyzing frames...")
      
      // Call the video analysis service
      const analysisResult = await analyzeVideoShooting(videoFile)

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed')
      }

      setAnalysisProgress("Processing results...")
      setResult(analysisResult)
      setCurrentFrameIndex(0)

      // Convert to session format
      const sessionData = convertVideoToSessionFormat(analysisResult)
      
      // Store in analysis store for results page
      setUploadedImageBase64(sessionData.mainImageBase64)
      
      // Create vision analysis result format for compatibility
      const visionResult = {
        success: true,
        overall_score: sessionData.overallScore,
        keypoints: sessionData.keypoints || undefined,
        angles: sessionData.angles,
        feedback: sessionData.feedback.map(msg => ({ type: 'info', area: 'general', message: msg })),
        analysis: {
          overallScore: sessionData.overallScore,
          category: sessionData.overallScore >= 85 ? 'EXCELLENT' : sessionData.overallScore >= 65 ? 'GOOD' : 'NEEDS_IMPROVEMENT',
          bodyPositions: {},
          strengths: sessionData.strengths,
          improvements: sessionData.improvements,
          measurements: sessionData.angles
        }
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setVisionAnalysisResult(visionResult as any)

      // Create and save session
      setAnalysisProgress("Saving session...")
      
      const detectedFlaws = detectFlawsFromAngles(sessionData.angles).map(f => f.name)
      const shooterLevel = getShooterLevel(sessionData.overallScore)
      
      // Convert screenshots to session format
      const screenshots: SessionScreenshot[] = sessionData.screenshots.map((ss, idx) => ({
        id: `video-${idx}`,
        label: ss.label,
        imageBase64: ss.imageBase64,
        analysis: ss.analysis
      }))
      
      const session = createSessionFromAnalysis(
        sessionData.mainImageBase64,
        sessionData.skeletonImageBase64,
        screenshots,
        {
          overallScore: sessionData.overallScore,
          shooterLevel: shooterLevel.name,
          angles: sessionData.angles,
          detectedFlaws,
          measurements: sessionData.angles
        },
        useAnalysisStore.getState().playerProfile.name || 'Player',
        undefined, // coachingLevelUsed
        undefined, // profileSnapshot
        analysisResult.key_screenshots?.length || 3 // imagesAnalyzed
      )
      
      const saved = saveSession(session)
      if (saved) {
        console.log("✅ Video session saved:", session.id)
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult)
      }

      // Navigate to results page
      setAnalysisProgress("Loading results...")
      router.push("/results/demo")

    } catch (err) {
      console.error('Video analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze video')
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress("")
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'SETUP': return 'bg-blue-500'
      case 'RISE': return 'bg-yellow-500'
      case 'RELEASE': return 'bg-green-500'
      case 'FOLLOW_THROUGH': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const currentFrame = result?.frame_data?.[currentFrameIndex]
  const currentFrameImage = result?.annotated_frames_base64?.[currentFrameIndex]

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4 space-y-4">
        <h4 className="text-[#FFD700] font-semibold text-sm mb-2 flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video Analysis
        </h4>
        
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
          <h5 className="text-[#FFD700] font-semibold text-xs mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            Video Requirements
          </h5>
          <ul className="text-[#888] text-xs space-y-1">
            <li>• <strong className="text-[#FFD700]">Maximum 10 seconds</strong>, under 50MB</li>
            <li>• Full body visible throughout</li>
            <li>• Single shooter, clear view</li>
            <li>• Good lighting, minimal camera shake</li>
            <li>• Side or 45° angle preferred</li>
            <li>• Include the shooting motion (not just dribbling)</li>
          </ul>
        </div>

        {/* Upload Area */}
        {!videoFile ? (
          <label className="border-2 border-dashed border-[#4a4a4a] rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700]/60 transition-colors">
            <Upload className="w-12 h-12 text-[#666] mb-3" />
            <span className="text-[#888] text-sm">Click to upload video</span>
            <span className="text-[#666] text-xs mt-1">MP4, MOV, WebM (max 10 sec, 50MB)</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        ) : (
          <div className="space-y-4">
            {/* Video Preview */}
            <div className="relative">
              <video
                src={videoPreviewUrl || undefined}
                controls
                className="w-full rounded-lg bg-black"
                style={{ maxHeight: '300px' }}
              />
              <button
                onClick={clearVideo}
                className="absolute top-2 right-2 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#888] text-sm truncate">{videoFile.name}</span>
              <span className="text-[#666] text-xs">
                {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
              </span>
            </div>

            {/* Analyze Button */}
            <button
              onClick={analyzeVideo}
              disabled={isAnalyzing}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all",
                isAnalyzing
                  ? "bg-[#3a3a3a] text-[#888] cursor-not-allowed"
                  : "bg-[#FFD700] text-black hover:bg-[#FFC000]"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {analysisProgress || "Analyzing..."}
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyze Video
                </>
              )}
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-3">
            {error}
          </div>
        )}
      </div>

      {/* Results Preview (before navigation) */}
      {result && !isAnalyzing && (
        <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4 space-y-4">
          <h4 className="text-[#FFD700] font-semibold text-lg">Analysis Preview</h4>

          {/* Key Screenshots */}
          {result.key_screenshots && result.key_screenshots.length > 0 && (
            <div className="space-y-2">
              <h5 className="text-[#E5E5E5] font-medium text-sm">3 Key Frames Extracted</h5>
              <div className="grid grid-cols-3 gap-2">
                {result.key_screenshots.map((ks, idx) => (
                  <div key={idx} className="relative">
                    <img
                      src={`data:image/jpeg;base64,${ks.image_base64}`}
                      alt={ks.label}
                      className="w-full h-auto rounded-lg"
                    />
                    <div className={cn(
                      "absolute bottom-1 left-1 px-2 py-0.5 rounded text-[10px] font-medium text-white",
                      getPhaseColor(ks.label)
                    )}>
                      {ks.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Frame Viewer */}
          {result.annotated_frames_base64 && result.annotated_frames_base64.length > 0 && (
            <div className="space-y-3">
              <h5 className="text-[#E5E5E5] font-medium text-sm">Frame-by-Frame View</h5>
              
              {/* Frame Display */}
              <div className="relative bg-black rounded-lg overflow-hidden">
                <img
                  src={`data:image/jpeg;base64,${currentFrameImage}`}
                  alt={`Frame ${currentFrameIndex + 1}`}
                  className="w-full h-auto"
                  style={{ maxHeight: '300px', objectFit: 'contain' }}
                />
                
                {/* Frame info overlay */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Frame {currentFrameIndex + 1}/{result.frame_count} | {currentFrame?.timestamp}s
                </div>
                
                {/* Phase badge */}
                {currentFrame && (
                  <div className={cn(
                    "absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium text-white",
                    getPhaseColor(currentFrame.phase)
                  )}>
                    {currentFrame.phase}
                  </div>
                )}
              </div>
              
              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setCurrentFrameIndex(Math.max(0, currentFrameIndex - 1))}
                  disabled={currentFrameIndex === 0}
                  className="p-2 bg-[#3a3a3a] rounded-full hover:bg-[#4a4a4a] disabled:opacity-50"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-3 bg-[#FFD700] rounded-full hover:bg-[#FFC000]"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-black" />
                  ) : (
                    <Play className="w-6 h-6 text-black" />
                  )}
                </button>
                
                <button
                  onClick={() => setCurrentFrameIndex(Math.min((result.frame_count || 1) - 1, currentFrameIndex + 1))}
                  disabled={currentFrameIndex >= (result.frame_count || 1) - 1}
                  className="p-2 bg-[#3a3a3a] rounded-full hover:bg-[#4a4a4a] disabled:opacity-50"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
              </div>
              
              {/* Frame Scrubber */}
              <input
                type="range"
                min={0}
                max={(result.frame_count || 1) - 1}
                value={currentFrameIndex}
                onChange={(e) => {
                  setIsPlaying(false)
                  setCurrentFrameIndex(parseInt(e.target.value))
                }}
                className="w-full h-2 bg-[#3a3a3a] rounded-lg appearance-none cursor-pointer"
              />
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-[#666] text-xs">Duration</div>
              <div className="text-[#E5E5E5] font-semibold">{result.video_info?.duration.toFixed(1)}s</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-[#666] text-xs">Frames</div>
              <div className="text-[#E5E5E5] font-semibold">{result.frame_count}</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-[#666] text-xs">Release Elbow</div>
              <div className="text-[#E5E5E5] font-semibold">{result.metrics?.elbow_angle_range.at_release || '-'}°</div>
            </div>
            <div className="bg-[#1a1a1a] rounded-lg p-3">
              <div className="text-[#666] text-xs">Phases</div>
              <div className="text-[#E5E5E5] font-semibold">{result.phases?.length || 0}</div>
            </div>
          </div>

          {/* Note about full results */}
          <p className="text-[#888] text-xs text-center">
            Redirecting to full results page...
          </p>
        </div>
      )}
    </div>
  )
}
