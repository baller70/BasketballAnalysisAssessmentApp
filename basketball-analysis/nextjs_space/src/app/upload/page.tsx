"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { useAnalysisStore } from "@/stores/analysisStore"
import { UploadEducation } from "@/components/upload/UploadEducation"
import { UploadQualityScore } from "@/components/upload/UploadQualityScore"
import { PreUploadValidationDisplay } from "@/components/upload/PreUploadValidation"
import {
  CameraIcon,
  BasketballIcon,
  InfoIcon,
  GoodFormIcon,
} from "@/components/icons"
import {
  runPreUploadValidation,
  calculateQualityScore,
  isValidFileType,
  formatFileSize,
  UPLOAD_CONSTANTS,
  type UploadQualityResult,
  type PreUploadValidation,
} from "@/lib/upload"

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function UploadPage() {
  const router = useRouter()
  const { setUploadedFile, setUploadedImageBase64 } = useAnalysisStore()

  // State
  const [showEducation, setShowEducation] = useState(true)
  const [files, setFiles] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isValidating, setIsValidating] = useState(false)
  const [preValidation, setPreValidation] = useState<(PreUploadValidation & { overallValid: boolean }) | null>(null)
  const [qualityResult, setQualityResult] = useState<UploadQualityResult | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [previewUrls])

  // Handle file selection
  const handleFileSelect = useCallback(async (selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles).filter(isValidFileType)
    
    if (fileArray.length === 0) {
      alert("Please select valid image or video files (JPG, PNG, HEIC, MP4, MOV)")
      return
    }

    // Cleanup old previews
    previewUrls.forEach((url) => URL.revokeObjectURL(url))

    // Create new previews
    const newUrls = fileArray.map((file) => URL.createObjectURL(file))
    setFiles(fileArray)
    setPreviewUrls(newUrls)
    setQualityResult(null)

    // Run pre-upload validation
    setIsValidating(true)
    try {
      const validation = await runPreUploadValidation(fileArray)
      setPreValidation(validation)

      // If pre-validation passes, calculate quality score
      if (validation.overallValid) {
        const quality = calculateQualityScore(validation)
        setQualityResult(quality)
      }
    } catch (error) {
      console.error("Validation error:", error)
    } finally {
      setIsValidating(false)
    }
  }, [previewUrls])

  // Drag and drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }, [handleFileSelect])

  // Handle proceed to analysis
  const handleProceed = useCallback(async () => {
    if (files.length === 0) return

    // Set the first file as the primary upload
    setUploadedFile(files[0])

    // Convert to base64 for persistence
    const reader = new FileReader()
    reader.onload = () => {
      setUploadedImageBase64(reader.result as string)
      router.push("/")
    }
    reader.readAsDataURL(files[0])
  }, [files, setUploadedFile, setUploadedImageBase64, router])

  // Handle retake
  const handleRetake = useCallback(() => {
    previewUrls.forEach((url) => URL.revokeObjectURL(url))
    setFiles([])
    setPreviewUrls([])
    setPreValidation(null)
    setQualityResult(null)
  }, [previewUrls])

  // If showing education module
  if (showEducation && files.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
        <UploadEducation
          onStartUpload={() => setShowEducation(false)}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-2">
            <BasketballIcon size="xl" color="primary" />
            <h1 className="text-3xl font-bold text-gray-900">Upload Your Shot</h1>
          </div>
          <p className="text-gray-600">
            Upload images or video of your shooting form for analysis
          </p>
          <button
            onClick={() => setShowEducation(true)}
            className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mx-auto"
          >
            <InfoIcon size="sm" color="primary" />
            View upload guidelines
          </button>
        </div>

        {/* Upload Area */}
        {files.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`
                relative border-2 border-dashed rounded-2xl p-8 text-center transition-all
                ${dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50/50"
                }
              `}
            >
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 bg-blue-100 rounded-full">
                  <CameraIcon size="xl" color="primary" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 mb-1">
                    {dragActive ? "Drop files here" : "Drag & drop files here"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or click to browse
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-400">
                  <span>JPG, PNG, HEIC</span>
                  <span>•</span>
                  <span>MP4, MOV, WebM</span>
                  <span>•</span>
                  <span>Max {UPLOAD_CONSTANTS.MAX_VIDEO_SIZE / (1024 * 1024)}MB</span>
                </div>
              </div>
            </div>

            {/* Quick Tips */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <QuickTip icon={<GoodFormIcon size="sm" color="success" />} text="Side angle (90°)" />
              <QuickTip icon={<GoodFormIcon size="sm" color="success" />} text="Full body visible" />
              <QuickTip icon={<GoodFormIcon size="sm" color="success" />} text="Good lighting" />
              <QuickTip icon={<GoodFormIcon size="sm" color="success" />} text="Clear background" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Preview */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">
                  {files.length} {files.length === 1 ? "file" : "files"} selected
                </h3>
              </div>
              
              <div className="p-4">
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.slice(0, 6).map((url, idx) => (
                    <div
                      key={idx}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100"
                    >
                      {files[idx].type.startsWith("video/") ? (
                        <video
                          src={url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      ) : (
                        <img
                          src={url}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ))}
                  {files.length > 6 && (
                    <div className="aspect-square rounded-lg bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        +{files.length - 6} more
                      </span>
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="mt-3 text-xs text-gray-500">
                  {files.map((f) => f.name).join(", ").slice(0, 100)}
                  {files.map((f) => f.name).join(", ").length > 100 && "..."}
                  <span className="mx-2">•</span>
                  {formatFileSize(files.reduce((acc, f) => acc + f.size, 0))}
                </div>
              </div>
            </div>

            {/* Validation Results */}
            {isValidating && (
              <PreUploadValidationDisplay
                validation={{
                  fileFormat: { valid: true, message: "Checking..." },
                  fileSize: { valid: true, message: "Checking...", actualSize: "" },
                  resolution: { valid: true, message: "Checking...", width: 0, height: 0 },
                  overallValid: true,
                }}
                isLoading={true}
              />
            )}

            {preValidation && !isValidating && (
              <PreUploadValidationDisplay validation={preValidation} />
            )}

            {/* Quality Score */}
            {qualityResult && (
              <UploadQualityScore
                result={qualityResult}
                onProceed={handleProceed}
                onRetake={handleRetake}
              />
            )}

            {/* Show retake button if pre-validation failed */}
            {preValidation && !preValidation.overallValid && (
              <div className="flex justify-center">
                <button
                  onClick={handleRetake}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Try Different Files
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

function QuickTip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200">
      {icon}
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  )
}


