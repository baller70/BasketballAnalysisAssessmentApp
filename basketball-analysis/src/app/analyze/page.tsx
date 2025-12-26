"use client"

import React, { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Upload, Camera } from "lucide-react"
import { PoseAnalysis } from "@/components/analysis/PoseAnalysis"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function AnalyzePage() {
  const router = useRouter()
  const { uploadedFile, uploadedImageBase64 } = useAnalysisStore()
  const [localFile, setLocalFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file")
      return
    }
    setLocalFile(file)
  }, [])

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
    
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  // Determine which image to use
  const imageToAnalyze = localFile || uploadedFile
  const imageBase64 = localFile ? undefined : uploadedImageBase64

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Pose Analysis</h1>
            <p className="text-gray-400 text-sm">
              AI-powered basketball shooting form analysis
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Upload / Preview Section */}
          <div className="lg:col-span-2">
            {!imageToAnalyze && !imageBase64 ? (
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
                    relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer
                    ${dragActive
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-gray-600 bg-gray-800/50 hover:border-blue-400 hover:bg-gray-800"
                    }
                  `}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-blue-500/20 rounded-full">
                      <Camera className="w-10 h-10 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-white mb-1">
                        {dragActive ? "Drop image here" : "Upload an image"}
                      </p>
                      <p className="text-sm text-gray-400">
                        Drag & drop or click to browse
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      JPG, PNG • Best: clear full-body shot
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <PoseAnalysis
                imageFile={imageToAnalyze || undefined}
                imageBase64={imageBase64 || undefined}
              />
            )}

            {/* Upload new image button when image exists */}
            {(imageToAnalyze || imageBase64) && (
              <div className="mt-4">
                <label className="flex items-center justify-center gap-2 px-4 py-2 bg-white/10 rounded-lg cursor-pointer hover:bg-white/20 transition-colors text-white text-sm">
                  <Upload className="w-4 h-4" />
                  Upload different image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div className="space-y-4">
            {/* How it works */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">?</span>
                How It Works
              </h3>
              <ol className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-mono">1.</span>
                  Upload a photo of your shooting form
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-mono">2.</span>
                  AI detects 17 body keypoints
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-mono">3.</span>
                  Angles and alignment are analyzed
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-mono">4.</span>
                  Get instant feedback and score
                </li>
              </ol>
            </div>

            {/* Tips */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                <span className="text-orange-400">💡</span>
                Tips for Best Results
              </h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  Side angle (90°) to camera
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  Full body visible in frame
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  Good lighting, minimal shadows
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  Clear background preferred
                </li>
                <li className="flex gap-2">
                  <span className="text-green-400">✓</span>
                  Capture at set/release point
                </li>
              </ul>
            </div>

            {/* Keypoints Legend */}
            <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold text-white mb-3">Detected Keypoints</h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { name: "Head", color: "#FF6B6B" },
                  { name: "Shoulders", color: "#96CEB4" },
                  { name: "Elbows", color: "#FFEAA7" },
                  { name: "Wrists", color: "#DDA0DD" },
                  { name: "Hips", color: "#98D8C8" },
                  { name: "Knees", color: "#F7DC6F" },
                  { name: "Ankles", color: "#BB8FCE" },
                ].map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-gray-300">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}




