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
import { FILE_LIMITS } from "@/lib/constants"
import { persistShotEvents, type ShotEventInput } from "@/lib/api/shotEvents"
import { createCaptureSession, updateCaptureSession } from "@/lib/api/captureSessionsClient"
import {
  buildCaptureSessionMetadata,
  normalizeCaptureOrientation,
  normalizeCapturePlatform,
  updateSessionVideoCaptureIdentity,
} from "@/lib/capture/captureSession"
import { createLocalReviewShotEvents } from "@/lib/live/liveReviewData"
import { getPlatformOS } from "@/utils/platform"
import { HoopCalibrationOverlay } from "@/components/live/HoopCalibrationOverlay"
import type { RimCalibration } from "@/lib/vision/objectTracking"

interface VideoUploadProps {
  onAnalysisComplete?: (result: VideoAnalysisResult) => void
}

export function VideoUpload({ onAnalysisComplete }: VideoUploadProps) {
  const router = useRouter()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [, setAnalysisProgress] = useState<string>("")
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VideoAnalysisResult | null>(null)
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 })
  const [rimCalibration, setRimCalibration] = useState<RimCalibration | null>(null)
  
  // Frame playback state
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    setVisionAnalysisResult,
    setUploadedImageBase64,
    setMediaType,
    setVideoAnalysisData,
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

    // The original file stays local; allow modern iPhone 4K clip sizes.
    if (file.size > FILE_LIMITS.MAX_VIDEO_SIZE_BYTES) {
      setError(`Video must be under ${FILE_LIMITS.MAX_VIDEO_SIZE_MB}MB`)
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
    setVideoDimensions({ width: 0, height: 0 })
    setRimCalibration(null)
  }

  const clearVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
    setVideoFile(null)
    setVideoPreviewUrl(null)
    setResult(null)
    setError(null)
    setCurrentFrameIndex(0)
    setIsPlaying(false)
    setVideoDimensions({ width: 0, height: 0 })
    setRimCalibration(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const analyzeVideo = async () => {
    if (!videoFile) return

    setIsAnalyzing(true)
    setError(null)
    setAnalysisProgress("Uploading video...")

    const captureSessionPromise = createCaptureSession(buildCaptureSessionMetadata({
      mode: 'form',
      source: 'uploaded_video',
      platform: normalizeCapturePlatform(getPlatformOS()),
      deviceModel: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 255) : undefined,
      readinessStatus: 'recording',
    })).then((session) => session.id).catch(() => null)

    const resolveCaptureSessionId = async (): Promise<string | null> => {
      try {
        // A slow/offline API must not hold local analysis or review.
        return await Promise.race([
          captureSessionPromise,
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 1500)),
        ])
      } catch {
        return null
      }
    }

    let captureSessionId: string | null = null

    try {
      setAnalysisProgress("Analyzing frames...")
      
      // Call the video analysis service
      const analysisResult = await analyzeVideoShooting(videoFile, { rimCalibration })

      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Analysis failed')
      }

      setAnalysisProgress("Processing results...")
      setResult(analysisResult)
      setCurrentFrameIndex(0)

      captureSessionId = await resolveCaptureSessionId()

      const trustedShotResult = analysisResult.shot_result?.final
        && analysisResult.shot_result.result !== 'unknown'
        ? analysisResult.shot_result
        : null
      const releaseEventIndex = (analysisResult.phases || []).findIndex((phase) =>
        String(phase.legacy_phase ?? phase.phase).toLowerCase() === 'release')
      const detectorEvents: ShotEventInput[] = (analysisResult.phases || []).map((phase, index) => {
        const frame = analysisResult.frame_data?.[phase.frame]
        const carriesShotResult = Boolean(trustedShotResult) && index === releaseEventIndex
        return {
          sequence: index,
          timestampMs: Math.max(0, Math.round(Number(phase.timestamp || 0) * 1000)),
          startFrame: Number.isFinite(Number(phase.frame)) ? Number(phase.frame) : undefined,
          endFrame: Number.isFinite(Number(phase.frame)) ? Number(phase.frame) : undefined,
          detected: true,
          detectedResult: carriesShotResult ? trustedShotResult!.result : 'unknown',
          detectedPhase: String(phase.phase || 'unknown'),
          confidence: carriesShotResult
            ? trustedShotResult!.confidence ?? undefined
            : typeof frame?.canonicalObservation?.poseConfidence === 'number'
              ? frame.canonicalObservation.poseConfidence
              : undefined,
          phaseMarkers: { phase: String(phase.phase || 'unknown') },
          metadata: {
            source: 'video_upload',
            frameIndex: phase.frame,
            ...(carriesShotResult
              ? {
                  resultProvenance: trustedShotResult!.provenance.source,
                  resultReason: trustedShotResult!.reason,
                  trajectorySampleCount: trustedShotResult!.provenance.trustedSampleCount,
                }
              : {}),
          },
        }
      })
      // Do not create orphan detector rows while session creation is still in
      // flight. Signed-out/slow-network captures stay local until a session ID
      // is available for a late reconciliation.
      const persistedShotEvents = captureSessionId
        ? await persistShotEvents(detectorEvents, captureSessionId)
        : null
      const shotEvents = persistedShotEvents ?? createLocalReviewShotEvents(detectorEvents, 'video_upload')

      // Convert to session format
      const sessionData = convertVideoToSessionFormat(analysisResult)
      if (sessionData.overallScore === null) {
        throw new Error('No trusted shooting mechanics were detected in this video. Try a clearer full-body capture.')
      }
      
      // Store in analysis store for results page
      setUploadedImageBase64(sessionData.mainImageBase64)
      setMediaType('VIDEO')
      setVideoAnalysisData({
        videoUrl: videoPreviewUrl || undefined,
        ...sessionData.videoData,
        captureSessionId,
        shotEvents,
      })
      
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

      const videoData = {
        ...sessionData.videoData,
        captureSessionId,
        shotEvents,
      }
      
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
        analysisResult.key_screenshots?.length || 3, // imagesAnalyzed
        'video',
        videoData,
      )
      
      const saved = saveSession(session)
      if (saved) {
        console.log("✅ Video session saved:", session.id)
      }

      if (onAnalysisComplete) {
        onAnalysisComplete(analysisResult)
      }

      if (captureSessionId) {
        void updateCaptureSession(captureSessionId, {
          readinessStatus: 'completed',
          endedAt: new Date(),
          ...(analysisResult.video_info?.width && analysisResult.video_info?.height
            ? {
                orientation: normalizeCaptureOrientation(
                  analysisResult.video_info.width >= analysisResult.video_info.height
                    ? 'landscape'
                    : 'portrait',
                ),
              }
            : {}),
          frameWidth: analysisResult.video_info?.width,
          frameHeight: analysisResult.video_info?.height,
          observation: {
            timestampMs: Math.max(0, Math.round((analysisResult.video_info?.duration ?? 0) * 1000)),
            orientation: 'unknown',
            poseConfidence: (analysisResult.frame_data?.reduce((sum, frame) =>
              sum + (frame.canonicalObservation?.poseConfidence ?? 0), 0
            ) ?? 0) / Math.max(1, analysisResult.frame_data?.length ?? 0),
            fullBodyVisible: (analysisResult.frame_data?.at(-1)?.keypoint_count ?? 0) >= 12,
            stable: true,
            lighting: 'unknown',
          },
          readinessChecks: {
            source: 'video_upload',
            analyzedFrames: analysisResult.frame_count ?? analysisResult.video_info?.extracted_frames ?? 0,
            trustedScore: sessionData.overallScore,
          },
        }, { timeoutMs: 2_000 }).catch(() => undefined)
      } else {
        void captureSessionPromise.then(async (lateSessionId) => {
          if (!lateSessionId) return
          let lateShotEvents = null
          try {
            lateShotEvents = await persistShotEvents(detectorEvents, lateSessionId)
          } finally {
            const reconciledShotEvents = lateShotEvents ?? shotEvents
            const updatedSession = updateSessionVideoCaptureIdentity(
              session,
              lateSessionId,
              reconciledShotEvents,
            )
            // The saved local session belongs to this upload even if a newer
            // upload is now active; saving by ID cannot overwrite that newer row.
            saveSession(updatedSession)
            await updateCaptureSession(lateSessionId, {
              readinessStatus: 'completed',
              endedAt: new Date(),
              ...(analysisResult.video_info?.width && analysisResult.video_info?.height
                ? {
                    orientation: normalizeCaptureOrientation(
                      analysisResult.video_info.width >= analysisResult.video_info.height
                        ? 'landscape'
                        : 'portrait',
                    ),
                    frameWidth: analysisResult.video_info.width,
                    frameHeight: analysisResult.video_info.height,
                  }
                : {}),
              observation: {
                timestampMs: Math.max(0, Math.round((analysisResult.video_info?.duration ?? 0) * 1000)),
                orientation: 'unknown',
                poseConfidence: (analysisResult.frame_data?.reduce((sum, frame) =>
                  sum + (frame.canonicalObservation?.poseConfidence ?? 0), 0
                ) ?? 0) / Math.max(1, analysisResult.frame_data?.length ?? 0),
                fullBodyVisible: (analysisResult.frame_data?.at(-1)?.keypoint_count ?? 0) >= 12,
                stable: true,
                lighting: 'unknown',
              },
              readinessChecks: {
                source: 'video_upload',
                analyzedFrames: analysisResult.frame_count ?? analysisResult.video_info?.extracted_frames ?? 0,
                trustedScore: sessionData.overallScore,
              },
            }, { timeoutMs: 2_000 }).catch(() => undefined)
          }
        }).catch(() => undefined)
      }

      // Navigate to results page
      setAnalysisProgress("Loading results...")
      router.push("/results/demo")

    } catch (err) {
      console.error('Video analysis error:', err)
      setError(err instanceof Error ? err.message : 'Failed to analyze video')

      const failedSessionId = captureSessionId ?? await resolveCaptureSessionId()
      if (failedSessionId) {
        void updateCaptureSession(failedSessionId, {
          readinessStatus: 'failed',
          endedAt: new Date(),
          readinessChecks: {
            source: 'video_upload',
            error: err instanceof Error ? err.message : 'Failed to analyze video',
          },
        }, { timeoutMs: 2_000 }).catch(() => undefined)
      } else {
        void captureSessionPromise.then((lateSessionId) => {
          if (!lateSessionId) return
          return updateCaptureSession(lateSessionId, {
            readinessStatus: 'failed',
            endedAt: new Date(),
            readinessChecks: {
              source: 'video_upload',
              error: err instanceof Error ? err.message : 'Failed to analyze video',
            },
          }, { timeoutMs: 2_000 }).catch(() => undefined)
        }).catch(() => undefined)
      }
    } finally {
      setIsAnalyzing(false)
      setAnalysisProgress("")
    }
  }

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'SETUP':
      case 'gather':
      case 'set': return 'bg-blue-500'
      case 'RISE':
      case 'rise': return 'bg-orange-500'
      case 'RELEASE':
      case 'release': return 'bg-green-500'
      case 'FOLLOW_THROUGH':
      case 'follow-through':
      case 'flight': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const currentFrame = result?.frame_data?.[currentFrameIndex]
  const currentFrameImage = result?.annotated_frames_base64?.[currentFrameIndex]

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4 space-y-4">
        <h4 className="text-[#FF6B35] font-semibold text-sm mb-2 flex items-center gap-2">
          <Video className="w-4 h-4" />
          Video Analysis
        </h4>
        
        <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
          <h5 className="text-[#FF6B35] font-semibold text-xs mb-2 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" />
            Video Requirements
          </h5>
          <ul className="text-[#888] text-xs space-y-1">
            <li>• <strong className="text-[#FF6B35]">Maximum 90 seconds</strong>, under {FILE_LIMITS.MAX_VIDEO_SIZE_MB}MB</li>
            <li>• Full body visible throughout</li>
            <li>• Single shooter, clear view</li>
            <li>• Good lighting, minimal camera shake</li>
            <li>• Side or 45° angle preferred</li>
            <li>• Include the shooting motion (not just dribbling)</li>
          </ul>
        </div>

        {/* Upload Area */}
        {!videoFile ? (
          <label className="border-2 border-dashed border-[#4a4a4a] rounded-lg p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#FF6B35]/60 transition-colors">
            <Upload className="w-12 h-12 text-[#666] mb-3" />
            <span className="text-[#888] text-sm">Click to upload video</span>
            <span className="text-[#666] text-xs mt-1">MP4, MOV, WebM (max 90 sec, {FILE_LIMITS.MAX_VIDEO_SIZE_MB}MB)</span>
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
            <div
              className="relative mx-auto w-full max-w-full overflow-hidden rounded-lg bg-black"
              style={videoDimensions.width > 0 && videoDimensions.height > 0
                ? { aspectRatio: `${videoDimensions.width} / ${videoDimensions.height}`, maxHeight: '300px', width: 'fit-content' }
                : { height: '300px' }}
            >
              <video
                src={videoPreviewUrl || undefined}
                controls
                className="absolute inset-0 h-full w-full object-cover"
                onLoadedMetadata={(event) => setVideoDimensions({
                  width: event.currentTarget.videoWidth || 1,
                  height: event.currentTarget.videoHeight || 1,
                })}
              />
              {videoDimensions.width > 0 && videoDimensions.height > 0 && (
                <HoopCalibrationOverlay
                  frameSize={videoDimensions}
                  facingMode="environment"
                  orientation={videoDimensions.width >= videoDimensions.height ? 'landscape' : 'portrait'}
                  value={rimCalibration}
                  onChange={setRimCalibration}
                  persistenceKey={null}
                  disabled={isAnalyzing}
                />
              )}
              <button
                onClick={clearVideo}
                className="absolute left-2 top-2 z-40 bg-red-500/80 hover:bg-red-500 text-white p-1.5 rounded-full transition-colors"
                aria-label="Remove video"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-center text-xs text-[#aaa]">
              {rimCalibration
                ? 'Hoop locked — make/miss tracking will use the calibrated rim.'
                : 'Calibrate the hoop for make/miss tracking. Form analysis can still run without it.'}
            </p>

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
                "w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all whitespace-nowrap",
                isAnalyzing
                  ? "bg-[#3a3a3a] text-[#888] cursor-not-allowed"
                  : "bg-[#FF6B35] text-white hover:bg-[#FFC000]"
              )}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Analyze
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
          <h4 className="text-[#FF6B35] font-semibold text-lg">Analysis Preview</h4>

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
                  className="p-3 bg-[#FF6B35] rounded-full hover:bg-[#FFC000]"
                >
                  {isPlaying ? (
                    <Pause className="w-6 h-6 text-white" />
                  ) : (
                    <Play className="w-6 h-6 text-white" />
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

          {result.shot_result?.final && result.shot_result.result !== 'unknown' && (
            <div className={`rounded-lg p-3 text-center text-lg font-black uppercase text-white ${
              result.shot_result.result === 'make' ? 'bg-green-600' : 'bg-red-600'
            }`}>
              {result.shot_result.result} · {Math.round((result.shot_result.confidence ?? 0) * 100)}% trajectory confidence
            </div>
          )}

          {/* Note about full results */}
          <p className="text-[#888] text-xs text-center">
            Redirecting to full results page...
          </p>
        </div>
      )}
    </div>
  )
}
