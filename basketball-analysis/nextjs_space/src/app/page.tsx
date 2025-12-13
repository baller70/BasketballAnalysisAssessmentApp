"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, User, Sparkles } from "lucide-react"
import { MediaUpload } from "@/components/upload/MediaUpload"
import { PlayerProfileForm } from "@/components/upload/PlayerProfileForm"
import { useAnalysisStore } from "@/stores/analysisStore"
import { analyzeShootingForm } from "@/services/visionAnalysis"

export default function Home() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const { 
    uploadedFile, 
    setIsAnalyzing, 
    setAnalysisProgress, 
    setVisionAnalysisResult, 
    setUploadedImageBase64, 
    setRoboflowBallDetection,
    setError 
  } = useAnalysisStore()

  // Allow analysis once an upload exists (3+ images from MediaUpload)
  const isFormValid = Boolean(uploadedFile)

  const handleAnalyze = async () => {
    if (!isFormValid || !uploadedFile) return

    setIsSubmitting(true)
    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setAnalysisError(null)

    try {
      setAnalysisProgress(10)
      
      // Convert file to base64 for persistence across navigation
      const reader = new FileReader()
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(uploadedFile)
      })
      
      const base64 = await base64Promise
      setUploadedImageBase64(base64)
      
      setAnalysisProgress(20)
      
      // STEP 1: Call Roboflow to detect the basketball FIRST
      console.log("🏀 Step 1: Detecting basketball with Roboflow...")
      let roboflowBall: { x: number; y: number; width: number; height: number; confidence: number } | null = null
      try {
        const roboflowResponse = await fetch('/api/detect-basketball', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })
        const roboflowResult = await roboflowResponse.json()
        
        if (roboflowResult.success && roboflowResult.basketball) {
          console.log("🏀 Basketball FOUND:", roboflowResult.basketball)
          roboflowBall = roboflowResult.basketball
          setRoboflowBallDetection(roboflowBall)
        } else {
          console.log("🏀 No basketball detected by Roboflow:", roboflowResult.message || roboflowResult.error)
          setRoboflowBallDetection(null)
        }
      } catch (roboflowError) {
        console.error("🏀 Roboflow detection failed (continuing with Vision AI):", roboflowError)
        setRoboflowBallDetection(null)
      }
      
      setAnalysisProgress(40)
      
      // STEP 2: Call Vision AI to analyze the image
      // Pass Roboflow ball position as anchor point if available
      console.log("🤖 Step 2: Analyzing with Vision AI...")
      const ballPositionForVision = roboflowBall ? {
        x: roboflowBall.x,
        y: roboflowBall.y,
        confidence: roboflowBall.confidence
      } : null
      
      if (ballPositionForVision) {
        console.log("🎯 Using Roboflow ball position as anchor:", ballPositionForVision)
      }
      
      const result = await analyzeShootingForm(uploadedFile, ballPositionForVision)
      
      setAnalysisProgress(80)

      if (!result.success) {
        throw new Error(result.error || "Analysis failed")
      }

      // Store the result
      setVisionAnalysisResult(result)
      setAnalysisProgress(100)

      // Navigate to results page
      router.push("/results/demo")
    } catch (error) {
      console.error("Analysis failed:", error)
      const message = error instanceof Error ? error.message : "Analysis failed"
      setAnalysisError(message)
      setError(message)
    } finally {
      setIsSubmitting(false)
      setIsAnalyzing(false)
    }
  }

  return (
    <main className="min-h-[calc(100vh-200px)] py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Main Card Container */}
        <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
          {/* Upload Section */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-2">
              <Upload className="w-5 h-5 text-[#FFD700]" />
              <h2 className="text-[#FFD700] font-semibold text-lg">Upload Your Shooting Media</h2>
            </div>
            <p className="text-[#E5E5E5] text-sm mb-6">
              Upload a video or image of your shooting form for comprehensive biomechanical analysis.
              Best results: Clear view of full body, good lighting, orange basketball visible.
            </p>
            <MediaUpload />
          </div>

          {/* Player Profile Section */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-[#FFD700]" />
              <h2 className="text-[#FFD700] font-semibold text-lg">Player Profile</h2>
            </div>
            <p className="text-[#E5E5E5] text-sm mb-6">
              Fill out your information for personalized analysis and elite shooter matching.
            </p>
            <PlayerProfileForm />
          </div>

          {/* Submit Button Section */}
          <div className="p-6">
            <button
              onClick={handleAnalyze}
              disabled={!isFormValid || isSubmitting}
              className="w-full bg-[#FFD700] hover:bg-[#e6c200] disabled:bg-[#4a4a4a] disabled:text-[#888] text-[#1a1a1a] font-medium py-3 px-6 rounded-md transition-colors flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-[#1a1a1a] border-t-transparent rounded-full animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Analyze My Shooting Form
                </>
              )}
            </button>
            <p className="text-[#888] text-sm text-center mt-3">
              Requires at least 3 uploaded images; profile is optional.
            </p>
            {analysisError && (
              <p className="text-red-400 text-sm text-center mt-3 bg-red-900/20 p-3 rounded-md">
                ⚠️ {analysisError}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
