"use client"

import React, { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAnalysisStore } from "@/stores/analysisStore"
import { ShotIQShell } from "@/components/shotiq/ShotIQShell"
import { UploadEducation } from "@/components/upload/UploadEducation"
import { UploadQualityScore } from "@/components/upload/UploadQualityScore"
import { PreUploadValidationDisplay } from "@/components/upload/PreUploadValidation"
import { VideoUpload } from "@/components/upload/VideoUpload"
import { LiveAnalysis } from "@/components/live"
import {
  CameraIcon,
  BasketballIcon,
  InfoIcon,
  GoodFormIcon,
} from "@/components/icons"
import { Video, Radio, Image as ImageIcon } from "lucide-react"
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
// TYPES
// ==========================================

type UploadMode = "image" | "video" | "live"

// ==========================================
// MAIN COMPONENT
// ==========================================

export default function UploadPage() {
  const router = useRouter()
  const { setUploadedFile, setUploadedImageBase64 } = useAnalysisStore()

  // State
  const [mode, setMode] = useState<UploadMode>(() => {
    if (typeof window === 'undefined') return 'image'
    const requested = new URLSearchParams(window.location.search).get('mode')
    return requested === 'video' || requested === 'live' ? requested : 'image'
  })
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
      router.push("/results/demo")
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

  // If showing education module (only for image mode)
  if (showEducation && files.length === 0 && mode === "image") {
    return (
      <ShotIQShell active="Analyze">
        <div data-testid="screen-desktop-web-upload" className="flex items-start justify-center px-[26px] py-[24px]">
          <UploadEducation
            onStartUpload={() => setShowEducation(false)}
          />
        </div>
      </ShotIQShell>
    )
  }

  return (
    <ShotIQShell active="Analyze">
    <div data-testid="screen-desktop-web-upload" className="px-[26px] py-[18px]">
      <div className="max-w-4xl mx-auto">
        {/* Header — canonical, per iOS 022/026 upload screens */}
        <div className="mb-6">
          <h1 className="shotiq-display text-[48px] leading-[50px]">UPLOAD &amp; ANALYZE</h1>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            Upload a clear photo or video of your shot for AI analysis.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex mb-6">
          <div className="inline-flex rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-1">
            <ModeTab
              icon={<ImageIcon className="w-5 h-5" />}
              label="IMAGE"
              isActive={mode === "image"}
              onClick={() => setMode("image")}
            />
            <ModeTab
              icon={<Video className="w-5 h-5" />}
              label="VIDEO"
              isActive={mode === "video"}
              onClick={() => setMode("video")}
            />
            <ModeTab
              icon={<Radio className="w-5 h-5" />}
              label="LIVE"
              isActive={mode === "live"}
              onClick={() => setMode("live")}
              badge="NEW"
            />
          </div>
        </div>

        {/* Mode Content */}
        <AnimatePresence mode="wait">
          {mode === "image" && (
            <motion.div
              key="image"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <ImageUploadContent
                files={files}
                previewUrls={previewUrls}
                dragActive={dragActive}
                isValidating={isValidating}
                preValidation={preValidation}
                qualityResult={qualityResult}
                onFileSelect={handleFileSelect}
                onDrag={handleDrag}
                onDrop={handleDrop}
                onProceed={handleProceed}
                onRetake={handleRetake}
                onShowEducation={() => setShowEducation(true)}
              />
            </motion.div>
          )}

          {mode === "video" && (
            <motion.div
              key="video"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-6">
                <div className="flex items-center gap-3 mb-1">
                  <Video className="w-5 h-5 text-[var(--shotiq-color-shotiqOrange)]" />
                  <h2 className="text-[15px] font-bold tracking-[0.04em]">VIDEO UPLOAD</h2>
                </div>
                <p className="text-[var(--shotiq-color-graphite)] text-sm mb-6">
                  MP4 · 3–90 seconds · best results in portrait orientation.
                </p>
                <VideoUpload />
              </div>
            </motion.div>
          )}

          {mode === "live" && (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <div className="rounded-[8px] border border-[var(--shotiq-color-rule)] bg-white p-6">
                <LiveAnalysis />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
    </ShotIQShell>
  )
}

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface ModeTabProps {
  icon: React.ReactNode
  label: string
  isActive: boolean
  onClick: () => void
  badge?: string
}

function ModeTab({ icon, label, isActive, onClick, badge }: ModeTabProps) {
  return (
    <button
      onClick={onClick}
      className={`
        relative flex items-center gap-2 px-6 py-3 rounded-lg font-semibold text-sm transition-all
        ${isActive
          ? "bg-[var(--shotiq-color-shotiqOrange)] text-white"
          : "text-[var(--shotiq-color-graphite)] hover:bg-[var(--shotiq-color-warmCanvas)] hover:text-[var(--shotiq-color-ink)]"
        }
      `}
    >
      {icon}
      {label}
      {badge && (
        <span className={`
          absolute -top-1 -right-1 px-1.5 py-0.5 text-[10px] font-bold rounded-full
          ${isActive ? "bg-white text-[#FF6B35]" : "bg-[#FF6B35] text-white"}
        `}>
          {badge}
        </span>
      )}
    </button>
  )
}

interface ImageUploadContentProps {
  files: File[]
  previewUrls: string[]
  dragActive: boolean
  isValidating: boolean
  preValidation: (PreUploadValidation & { overallValid: boolean }) | null
  qualityResult: UploadQualityResult | null
  onFileSelect: (files: FileList | File[]) => void
  onDrag: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  onProceed: () => void
  onRetake: () => void
  onShowEducation: () => void
}

function ImageUploadContent({
  files,
  previewUrls,
  dragActive,
  isValidating,
  preValidation,
  qualityResult,
  onFileSelect,
  onDrag,
  onDrop,
  onProceed,
  onRetake,
  onShowEducation,
}: ImageUploadContentProps) {
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {files.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            onDragEnter={onDrag}
            onDragLeave={onDrag}
            onDragOver={onDrag}
            onDrop={onDrop}
            className={`
              relative border-2 border-dashed rounded-[8px] p-8 text-center transition-all
              ${dragActive
                ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]"
                : "border-[var(--shotiq-color-rule)] bg-white hover:border-[var(--shotiq-color-shotiqOrange)]"
              }
            `}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => e.target.files && onFileSelect(e.target.files)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full border border-[var(--shotiq-color-rule)]">
                <CameraIcon size="xl" color="primary" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--shotiq-color-ink)] mb-1">
                  {dragActive ? "Drop images here" : "Drag & drop images here"}
                </p>
                <p className="text-sm text-[var(--shotiq-color-graphite)]">
                  or click to browse
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-[var(--shotiq-color-muted)]">
                <span>JPG, PNG, HEIC</span>
                <span>•</span>
                <span>Max {UPLOAD_CONSTANTS.MAX_IMAGE_SIZE / (1024 * 1024)}MB</span>
              </div>
            </div>
          </div>

          {/* View Guidelines Button */}
          <button
            onClick={onShowEducation}
            className="mt-4 w-full text-sm text-[var(--shotiq-color-shotiqOrange)] flex items-center justify-center gap-2"
          >
            <InfoIcon size="sm" color="primary" />
            View upload guidelines
          </button>

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
          <div className="bg-white rounded-[8px] border border-[var(--shotiq-color-rule)] overflow-hidden">
            <div className="p-4 border-b border-[var(--shotiq-color-rule)]">
              <h3 className="font-semibold text-[var(--shotiq-color-ink)]">
                {files.length} {files.length === 1 ? "file" : "files"} selected
              </h3>
            </div>
            
            <div className="p-4">
              <div className="grid grid-cols-3 gap-2">
                {previewUrls.slice(0, 6).map((url, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-lg overflow-hidden bg-[#1B1D20]"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
                {files.length > 6 && (
                  <div className="aspect-square rounded-lg bg-[#1B1D20] flex items-center justify-center">
                    <span className="text-white/70 font-medium">
                      +{files.length - 6} more
                    </span>
                  </div>
                )}
              </div>
              
              {/* File Info */}
              <div className="mt-3 text-xs text-[var(--shotiq-color-graphite)]">
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
              onProceed={onProceed}
              onRetake={onRetake}
            />
          )}

          {/* Show retake button if pre-validation failed */}
          {preValidation && !preValidation.overallValid && (
            <div className="flex justify-center">
              <button
                onClick={onRetake}
                className="px-6 py-3 border border-[var(--shotiq-color-rule)] bg-white text-[var(--shotiq-color-ink)] rounded-[6px] font-medium hover:bg-[var(--shotiq-color-warmCanvas)] transition-colors"
              >
                Try Different Files
              </button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function QuickTip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-white rounded-[6px] border border-[var(--shotiq-color-rule)]">
      {icon}
      <span className="text-sm text-[var(--shotiq-color-ink)]">{text}</span>
    </div>
  )
}
