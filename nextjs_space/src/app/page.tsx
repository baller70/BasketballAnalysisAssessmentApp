"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, User, Sparkles } from "lucide-react"
import { MediaUpload } from "@/components/upload/MediaUpload"
import { PlayerProfileForm } from "@/components/upload/PlayerProfileForm"
import { useAnalysisStore } from "@/stores/analysisStore"

export default function Home() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { uploadedFile, playerProfile, setIsAnalyzing, setAnalysisProgress } = useAnalysisStore()

  const isFormValid = uploadedFile && playerProfile.name && playerProfile.email && playerProfile.position

  const handleAnalyze = async () => {
    if (!isFormValid) return

    setIsSubmitting(true)
    setIsAnalyzing(true)
    setAnalysisProgress(0)

    try {
      // Simulate progress for demo
      for (let i = 0; i <= 100; i += 10) {
        setAnalysisProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      // Navigate to results page
      router.push("/results/demo")
    } catch (error) {
      console.error("Analysis failed:", error)
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
              Required fields: Name, Email, Position, and Video Upload
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
