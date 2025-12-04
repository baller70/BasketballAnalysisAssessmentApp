"use client"

import React, { useCallback, useState, useRef, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Image, Video, X, CheckCircle, AlertTriangle, Loader2, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAnalysisStore } from "@/stores/analysisStore"
import type { MediaType } from "@/types"
import { validateImage, type ValidationError } from "@/lib/poseDetection"
import { detectPoseFromImage, getCompatibleKeypoints, type DetectedKeypoint, type MediaPipeKeypoint } from "@/lib/mediapipePoseDetection"
import { AnalysisOverlay } from "@/components/analysis/AnalysisOverlay"
import { EnhancedSkeletonOverlay } from "@/components/analysis/EnhancedSkeletonOverlay"
import { AnalysisProgress, useAnalysisProgress } from "@/components/analysis/AnalysisProgress"
import { ExportButton } from "@/components/analysis/ExportButton"
import { FormScoreCard } from "@/components/analysis/FormScoreCard"
import { OverlayControls } from "@/components/analysis/OverlayControls"
import { runStagedAnalysis } from "@/lib/stagedFormAnalysis"
import type { FormAnalysisResult } from "@/lib/formAnalysis"

const ACCEPTED_IMAGE_TYPES = {
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
}

const ACCEPTED_VIDEO_TYPES = {
  "video/mp4": [".mp4"],
  "video/quicktime": [".mov"],
  "video/webm": [".webm"],
}

export function MediaUpload() {
  const {
    uploadedFile,
    mediaType,
    mediaPreviewUrl,
    setUploadedFile,
    setMediaType,
    setMediaPreviewUrl,
    resetUpload,
    setDetectedKeypoints: setStoreKeypoints,
    setPoseConfidence: setStorePoseConfidence,
    setFormAnalysisResult: setStoreFormAnalysis,
  } = useAnalysisStore()
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [validationWarnings, setValidationWarnings] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [isValidated, setIsValidated] = useState(false)

  // Visual analysis state
  const [detectedKeypoints, setDetectedKeypoints] = useState<DetectedKeypoint[]>([])
  const [, setFullKeypoints] = useState<MediaPipeKeypoint[]>([])  // All 33 MediaPipe keypoints (for future use)
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [showAngles, setShowAngles] = useState(true)
  const [showIssues, setShowIssues] = useState(true)
  const [showCallouts, setShowCallouts] = useState(true)  // Body part labels
  const [useEnhancedOverlay, setUseEnhancedOverlay] = useState(true)  // Toggle between overlays
  const [imageSize, setImageSize] = useState({ width: 640, height: 480 })
  const [poseConfidence, setPoseConfidence] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)

  // AI Skeleton state
  const [aiSkeletonImage, setAiSkeletonImage] = useState<string | null>(null)
  const [isGeneratingAiSkeleton, setIsGeneratingAiSkeleton] = useState(false)
  const [aiSkeletonError, setAiSkeletonError] = useState<string | null>(null)

  // Update image size when loaded
  useEffect(() => {
    if (imageRef.current && imageRef.current.complete) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
    }
  }, [mediaPreviewUrl])

  // Analysis progress hook (used for reset functionality)
  const { resetProgress } = useAnalysisProgress()

  // Image is ready for analysis (uploaded but not yet analyzed)
  const [isReadyForAnalysis, setIsReadyForAnalysis] = useState(false)

  // Quick validation on upload (just check if image loads)
  const prepareImageForAnalysis = useCallback(async (previewUrl: string) => {
    setIsValidating(true);
    setValidationErrors([]);
    setValidationWarnings([]);
    setIsValidated(false);
    setDetectedKeypoints([]);
    setFullKeypoints([]);
    setAnalysisResult(null);
    resetProgress();

    try {
      // Just validate the image can be loaded - don't run full analysis yet
      const img = document.createElement('img');
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = previewUrl;
      });

      // Image loaded successfully - ready for analysis
      setIsReadyForAnalysis(true);
      setValidationWarnings(['Click "Analyze This Form" to start biomechanical analysis']);
    } catch (error) {
      console.error('Image load error:', error);
      setUploadError('Failed to load image. Please try a different file.');
      setIsReadyForAnalysis(false);
    } finally {
      setIsValidating(false);
    }
  }, [resetProgress]);

  // Track analysis state - these control whether the progress box shows
  const [showProgressBox, setShowProgressBox] = useState(false)
  const [progressStage, setProgressStage] = useState(1)

  // Run full analysis when user clicks the button
  const runFullAnalysis = useCallback(async () => {
    if (!mediaPreviewUrl) return

    // IMMEDIATELY show the progress box
    setShowProgressBox(true)
    setProgressStage(1)
    setValidationErrors([])
    setValidationWarnings([])

    // Helper to advance to next stage with delay
    const goToStage = async (stage: number, delayMs: number = 1000) => {
      setProgressStage(stage)
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }

    try {
      // Stage 1: Pose Detection (show for 1 second, then run detection)
      await goToStage(1, 1000)

      const poseResult = await detectPoseFromImage(mediaPreviewUrl)
      setFullKeypoints(poseResult.fullKeypoints)
      const compatibleKeypoints = getCompatibleKeypoints(poseResult.keypoints)
      setDetectedKeypoints(poseResult.keypoints)
      setPoseConfidence(poseResult.confidence)
      setStoreKeypoints(poseResult.keypoints)
      setStorePoseConfidence(poseResult.confidence)

      // Check if pose detection failed
      const validationResult = validateImage(compatibleKeypoints)
      if (!validationResult.isValid) {
        if (validationResult.errors.some(e =>
          e.code === 'NO_PERSON_DETECTED' || e.code === 'LOW_CONFIDENCE'
        )) {
          setValidationErrors(validationResult.errors)
          setShowProgressBox(false)
          return
        }
      }

      // Stage 2-9: Each stage shows for 1 second
      await goToStage(2, 1000)
      await goToStage(3, 1000)
      await goToStage(4, 1000)
      await goToStage(5, 1000)
      await goToStage(6, 1000)
      await goToStage(7, 1000)
      await goToStage(8, 1000)
      await goToStage(9, 1000)

      // Stage 10: Final stage
      await goToStage(10, 1000)

      // Run the actual form analysis
      const formAnalysis = await runStagedAnalysis(compatibleKeypoints)
      setAnalysisResult(formAnalysis)
      setStoreFormAnalysis(formAnalysis)

      // Collect warnings
      const detectionWarnings: string[] = []
      if (!poseResult.isShootingPose) {
        detectionWarnings.push('Player may not be in shooting position')
      }
      if (poseResult.confidence < 0.5) {
        detectionWarnings.push(`Pose confidence is low (${Math.round(poseResult.confidence * 100)}%)`)
      }
      setValidationWarnings(detectionWarnings)

      // Hide progress box and show results
      setShowProgressBox(false)
      setIsValidated(true)
      setIsReadyForAnalysis(false)
    } catch (error) {
      console.error('Analysis error:', error)
      setValidationWarnings(['Analysis failed - please try again'])
      setShowProgressBox(false)
    }
  }, [mediaPreviewUrl, setStoreKeypoints, setStorePoseConfidence, setStoreFormAnalysis])

  // Generate AI skeleton using Replicate
  const generateAiSkeleton = useCallback(async () => {
    if (!uploadedFile) return

    setIsGeneratingAiSkeleton(true)
    setAiSkeletonError(null)
    setAiSkeletonImage(null)

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch('http://localhost:8000/ai-skeleton', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.detail || 'Failed to generate AI skeleton')
      }

      const result = await response.json()
      if (result.success && result.image_base64) {
        setAiSkeletonImage(`data:image/png;base64,${result.image_base64}`)
      } else {
        throw new Error('No image returned from AI')
      }
    } catch (error) {
      console.error('AI Skeleton error:', error)
      setAiSkeletonError(error instanceof Error ? error.message : 'Failed to generate AI skeleton')
    } finally {
      setIsGeneratingAiSkeleton(false)
    }
  }, [uploadedFile])

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploadError(null)
      setValidationErrors([])
      setValidationWarnings([])
      setIsValidated(false)
      setIsReadyForAnalysis(false)
      resetProgress()

      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0]

        // Validate file size (max 100MB for video, 10MB for image)
        const maxSize = mediaType === "VIDEO" ? 100 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
          setUploadError(`File too large. Max size: ${mediaType === "VIDEO" ? "100MB" : "10MB"}`)
          return
        }

        setUploadedFile(file)

        // Create preview URL
        const previewUrl = URL.createObjectURL(file)
        setMediaPreviewUrl(previewUrl)

        // Prepare image for analysis (don't run analysis automatically)
        if (mediaType === "IMAGE") {
          await prepareImageForAnalysis(previewUrl);
        }
      }
    },
    [mediaType, setUploadedFile, setMediaPreviewUrl, prepareImageForAnalysis, resetProgress]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: mediaType === "IMAGE" ? ACCEPTED_IMAGE_TYPES : ACCEPTED_VIDEO_TYPES,
    maxFiles: 1,
    multiple: false,
  })

  const handleMediaTypeChange = (value: string) => {
    setMediaType(value as MediaType)
    resetUpload() // This also clears store values
    setUploadError(null)
    setValidationErrors([])
    setValidationWarnings([])
    setIsValidated(false)
    setIsReadyForAnalysis(false)
    setDetectedKeypoints([])
    setFullKeypoints([])
    setAnalysisResult(null)
    resetProgress()
  }

  const handleRemoveFile = () => {
    if (mediaPreviewUrl) {
      URL.revokeObjectURL(mediaPreviewUrl)
    }
    resetUpload() // This also clears store values
    setUploadError(null)
    setValidationErrors([])
    setValidationWarnings([])
    setIsValidated(false)
    setIsReadyForAnalysis(false)
    setDetectedKeypoints([])
    setFullKeypoints([])
    setAnalysisResult(null)
    resetProgress()
  }

  const handleResetOverlays = () => {
    setShowSkeleton(true)
    setShowAngles(true)
    setShowIssues(true)
    setShowCallouts(true)
    setUseEnhancedOverlay(true)
  }

  const handleImageLoad = () => {
    if (imageRef.current) {
      setImageSize({
        width: imageRef.current.naturalWidth,
        height: imageRef.current.naturalHeight,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-[#E5E5E5] text-sm font-medium">Media Type</label>
        <select
          value={mediaType}
          onChange={(e) => handleMediaTypeChange(e.target.value)}
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-[#FFD700]"
        >
          <option value="VIDEO">Video</option>
          <option value="IMAGE">Image</option>
        </select>
      </div>

      {/* Image Requirements Info */}
      {mediaType === "IMAGE" && !uploadedFile && (
        <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4">
          <h4 className="text-[#FFD700] font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Image Requirements for Analysis
          </h4>
          <ul className="text-[#888] text-xs space-y-1">
            <li>• Full body visible (head to feet)</li>
            <li>• Player in shooting position (arms raised)</li>
            <li>• Clear, well-lit image</li>
            <li>• Single person in frame</li>
          </ul>
        </div>
      )}

      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer",
          "flex flex-col items-center justify-center min-h-[180px]",
          isDragActive
            ? "border-[#FFD700] bg-[#FFD700]/10"
            : "border-[#4a4a4a] hover:border-[#FFD700]/50 bg-[#3a3a3a]",
          uploadedFile && isValidated && validationErrors.length === 0 && "border-green-500 bg-green-500/10",
          uploadedFile && validationErrors.length > 0 && "border-red-500 bg-red-500/10",
          isValidating && "border-yellow-500 bg-yellow-500/10"
        )}
      >
        <input {...getInputProps()} />

        {isValidating ? (
          <div className="text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-[#FFD700] animate-spin" />
            <p className="text-[#FFD700] font-medium">Loading image...</p>
            <p className="text-[#888] text-sm mt-1">Preparing for analysis</p>
          </div>
        ) : uploadedFile ? (
          <div className="text-center">
            {validationErrors.length > 0 ? (
              <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            ) : isValidated ? (
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            ) : isReadyForAnalysis ? (
              <Play className="w-12 h-12 mx-auto mb-4 text-[#FFD700]" />
            ) : (
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-[#888]" />
            )}
            <p className={cn(
              "font-medium",
              validationErrors.length > 0 ? "text-red-400" :
              isValidated ? "text-green-400" :
              isReadyForAnalysis ? "text-[#FFD700]" : "text-[#E5E5E5]"
            )}>
              {uploadedFile.name}
            </p>
            <p className="text-[#888] text-sm mt-1">
              {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {isValidated && validationErrors.length === 0 && (
              <p className="text-green-400 text-xs mt-2 flex items-center justify-center gap-1">
                <CheckCircle className="w-3 h-3" /> Analysis complete
              </p>
            )}
            {isReadyForAnalysis && !isValidated && (
              <p className="text-[#FFD700] text-xs mt-2">
                Image loaded • Ready for analysis
              </p>
            )}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); handleRemoveFile() }}
              className="mt-4 text-red-400 hover:text-red-300 flex items-center gap-2 mx-auto"
            >
              <X className="w-4 h-4" /> Remove
            </button>
          </div>
        ) : (
          <div className="text-center">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#4a4a4a] flex items-center justify-center">
              {mediaType === "IMAGE" ? (
                <Image className="w-7 h-7 text-[#FFD700]" />
              ) : (
                <Video className="w-7 h-7 text-[#FFD700]" />
              )}
            </div>
            <h3 className="text-[#FFD700] font-semibold mb-2">
              {isDragActive ? "Drop your file here" : `Select ${mediaType === "IMAGE" ? "Image" : "Video"} File`}
            </h3>
            <p className="text-[#888] text-sm">
              {mediaType === "IMAGE"
                ? "Supported formats: JPG, PNG, WebP"
                : "Supported formats: MP4, MOV, AVI (5-15 seconds recommended)"}
            </p>
            <button
              type="button"
              disabled
              className="mt-4 bg-[#4a4a4a] text-[#888] px-4 py-2 rounded-md text-sm cursor-not-allowed"
            >
              Select {mediaType === "IMAGE" ? "Image" : "Video"} File
            </button>
          </div>
        )}
      </div>

      {/* Upload Error */}
      {uploadError && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <p className="text-red-400 text-sm">{uploadError}</p>
        </div>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 space-y-2">
          <h4 className="text-red-400 font-semibold text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Image Validation Issues
          </h4>
          {validationErrors.map((error, idx) => (
            <div key={idx} className="text-sm">
              <p className="text-red-300">{error.message}</p>
              <p className="text-[#888] text-xs mt-0.5">{error.suggestion}</p>
            </div>
          ))}
        </div>
      )}

      {/* Validation Warnings */}
      {validationWarnings.length > 0 && validationErrors.length === 0 && !showProgressBox && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <h4 className="text-yellow-400 font-semibold text-xs mb-1">Info</h4>
          <ul className="text-yellow-300 text-xs space-y-0.5">
            {validationWarnings.map((warning, idx) => (
              <li key={idx}>• {warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Analyze This Form Button - only show when ready and not currently analyzing */}
      {isReadyForAnalysis && !isValidated && !showProgressBox && mediaType === "IMAGE" && (
        <button
          type="button"
          onClick={runFullAnalysis}
          className="w-full bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black font-bold py-4 px-6 rounded-lg hover:from-[#FFE44D] hover:to-[#FFB833] transition-all flex items-center justify-center gap-3 text-lg shadow-lg"
        >
          <Play className="w-6 h-6" />
          Analyze This Form
        </button>
      )}

      {/* Progress Box - Shows when analysis is running */}
      {showProgressBox && (
        <AnalysisProgress
          currentStage={progressStage}
          isAnalyzing={true}
        />
      )}

      {/* Image Preview with Analysis Overlay */}
      {mediaPreviewUrl && (
        <div className="mt-4 space-y-4">
          {/* Overlay Controls - only show when analysis is complete */}
          {isValidated && analysisResult && mediaType === "IMAGE" && (
            <OverlayControls
              showSkeleton={showSkeleton}
              showAngles={showAngles}
              showIssues={showIssues}
              onToggleSkeleton={() => setShowSkeleton(!showSkeleton)}
              onToggleAngles={() => setShowAngles(!showAngles)}
              onToggleIssues={() => setShowIssues(!showIssues)}
              onReset={handleResetOverlays}
            />
          )}

          {/* Overlay Style Toggle */}
          {isValidated && detectedKeypoints.length > 0 && mediaType === "IMAGE" && (
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-2 text-[#E5E5E5] cursor-pointer">
                <input
                  type="checkbox"
                  checked={useEnhancedOverlay}
                  onChange={() => setUseEnhancedOverlay(!useEnhancedOverlay)}
                  className="accent-[#FFD700]"
                />
                Enhanced Overlay (White Skeleton)
              </label>
              {useEnhancedOverlay && (
                <label className="flex items-center gap-2 text-[#E5E5E5] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showCallouts}
                    onChange={() => setShowCallouts(!showCallouts)}
                    className="accent-[#FFD700]"
                  />
                  Body Part Labels
                </label>
              )}
            </div>
          )}

          {/* Image with overlay */}
          <div className="rounded-lg overflow-hidden bg-[#3a3a3a] border border-[#4a4a4a]">
            {mediaType === "IMAGE" ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imageRef}
                  src={mediaPreviewUrl}
                  alt="Shooting form analysis"
                  className="w-full max-h-[500px] object-contain"
                  onLoad={handleImageLoad}
                />
                {/* Enhanced Skeleton Overlay (white lines with callouts) */}
                {isValidated && detectedKeypoints.length > 0 && useEnhancedOverlay && (
                  <EnhancedSkeletonOverlay
                    keypoints={detectedKeypoints}
                    showSkeleton={showSkeleton}
                    showCallouts={showCallouts}
                    imageWidth={imageSize.width}
                    imageHeight={imageSize.height}
                  />
                )}
                {/* Original Analysis Overlay (colored with angles/issues) */}
                {isValidated && detectedKeypoints.length > 0 && analysisResult && !useEnhancedOverlay && (
                  <AnalysisOverlay
                    keypoints={detectedKeypoints}
                    angles={analysisResult.angles}
                    issues={analysisResult.issues}
                    showSkeleton={showSkeleton}
                    showAngles={showAngles}
                    showIssues={showIssues}
                    imageWidth={imageSize.width}
                    imageHeight={imageSize.height}
                  />
                )}
              </div>
            ) : (
              <video src={mediaPreviewUrl} controls className="w-full max-h-[500px]" />
            )}
          </div>

          {/* Form Score Card - only show when analysis is complete */}
          {isValidated && analysisResult && mediaType === "IMAGE" && (
            <FormScoreCard
              overallScore={analysisResult.overallScore}
              category={analysisResult.category}
              metrics={analysisResult.metrics}
              priorityIssues={analysisResult.priorityIssues}
              confidence={poseConfidence}
            />
          )}

          {/* Export Button - uses Python backend */}
          {isValidated && detectedKeypoints.length > 0 && mediaType === "IMAGE" && uploadedFile && (
            <ExportButton
              file={uploadedFile}
              skeletonConfig={{
                skeletonColor: '#FFFFFF',
                jointColor: '#FFFFFF',
                labelColor: '#FFFFFF',
                showCallouts: showCallouts,
              }}
            />
          )}

          {/* AI Skeleton Generation - uses Replicate */}
          {uploadedFile && mediaType === "IMAGE" && (
            <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4 space-y-4">
              <h3 className="text-[#FFD700] font-semibold flex items-center gap-2">
                🎨 AI Skeleton Sketch (Replicate)
              </h3>
              <p className="text-[#888] text-sm">
                Generate an AI-sketched skeleton overlay using Replicate&apos;s ControlNet model.
              </p>
              <button
                type="button"
                onClick={generateAiSkeleton}
                disabled={isGeneratingAiSkeleton}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 px-6 rounded-lg hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGeneratingAiSkeleton ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Generating AI Skeleton...
                  </>
                ) : (
                  <>
                    🤖 Generate AI Skeleton
                  </>
                )}
              </button>

              {aiSkeletonError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{aiSkeletonError}</p>
                </div>
              )}

              {aiSkeletonImage && (
                <div className="space-y-2">
                  <h4 className="text-[#E5E5E5] text-sm font-semibold">AI Generated Result:</h4>
                  <div className="rounded-lg overflow-hidden border border-[#4a4a4a]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={aiSkeletonImage}
                      alt="AI Generated Skeleton Overlay"
                      className="w-full max-h-[500px] object-contain"
                    />
                  </div>
                  <a
                    href={aiSkeletonImage}
                    download="ai-skeleton-overlay.png"
                    className="inline-block bg-[#4a4a4a] text-[#E5E5E5] px-4 py-2 rounded-lg text-sm hover:bg-[#5a5a5a] transition-colors"
                  >
                    Download AI Skeleton Image
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

