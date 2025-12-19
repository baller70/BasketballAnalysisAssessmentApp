"use client"

import React, { useRef, useState, useEffect } from "react"
import { AlertTriangle, X, Video } from "lucide-react"

interface VideoUploadInlineProps {
  videoFile: File | null
  onVideoFileChange: (file: File | null) => void
}

export function VideoUploadInline({ videoFile, onVideoFileChange }: VideoUploadInlineProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Create and cleanup object URL when videoFile changes
  useEffect(() => {
    if (videoFile) {
      const url = URL.createObjectURL(videoFile)
      setVideoPreviewUrl(url)
      return () => {
        URL.revokeObjectURL(url)
      }
    } else {
      setVideoPreviewUrl(null)
    }
  }, [videoFile])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setError(null)

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

    onVideoFileChange(file)
  }

  const clearVideo = () => {
    onVideoFileChange(null)
    setError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      {/* Video Requirements */}
      <div className="bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
        <h5 className="text-[#FFD700] font-semibold text-xs mb-2 flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          Video Requirements
        </h5>
        <ul className="text-[#888] text-xs space-y-1">
          <li>• <strong className="text-[#FFD700]">Maximum 10 seconds</strong>, under 50MB</li>
          <li>• Full body visible throughout the shot</li>
          <li>• Single shooter, clear view</li>
          <li>• Good lighting, minimal camera shake</li>
          <li>• Side or 45° angle preferred</li>
          <li>• Include the shooting motion (not just dribbling)</li>
        </ul>
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-3">
          {error}
        </div>
      )}

      {/* Upload Area */}
      {!videoFile ? (
        <label className="border-2 border-dashed border-[#4a4a4a] rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-[#FFD700]/60 hover:bg-[#FFD700]/5 transition-all duration-200">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 flex items-center justify-center mb-4">
            <Video className="w-8 h-8 text-orange-400" />
          </div>
          <span className="text-[#E5E5E5] font-medium">Click to upload video</span>
          <span className="text-[#666] text-sm mt-1">MP4, MOV, WebM (max 10 sec, 50MB)</span>
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
          <div className="relative rounded-xl overflow-hidden bg-black">
            {videoPreviewUrl && (
              <video
                src={videoPreviewUrl}
                controls
                className="w-full"
                style={{ maxHeight: '300px' }}
              />
            )}
            <button
              type="button"
              onClick={clearVideo}
              className="absolute top-3 right-3 bg-red-500/90 hover:bg-red-500 text-white p-2 rounded-full transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* File Info */}
          <div className="flex items-center justify-between bg-[#1a1a1a] rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-orange-500/20 border border-orange-500/30 flex items-center justify-center">
                <Video className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <div className="text-[#E5E5E5] font-medium text-sm truncate max-w-[200px]">
                  {videoFile.name}
                </div>
                <div className="text-[#666] text-xs">
                  {(videoFile.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-xs font-medium bg-green-500/10 px-2 py-1 rounded">
                ✓ Ready
              </span>
            </div>
          </div>

          {/* Change Video Button */}
          <label className="block">
            <div className="text-center text-[#888] text-sm hover:text-[#FFD700] cursor-pointer transition-colors">
              Click to change video
            </div>
            <input
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </label>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#252525] rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="text-[#FFD700] text-lg">💡</div>
          <div>
            <div className="text-[#E5E5E5] text-xs font-medium mb-1">Pro Tip</div>
            <div className="text-[#888] text-xs">
              The system automatically detects your shooting motion and extracts 3 key frames 
              (Setup, Release, Follow-through) for analysis. Make sure to include the full shot in your video.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
