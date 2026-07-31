"use client"

import React from "react"
import { VideoUpload } from "@/components/upload/VideoUpload"
import { PlayerProfileForm } from "@/components/upload/PlayerProfileForm"
import Link from "next/link"
import { ArrowLeft, Video, User } from "lucide-react"

export default function VideoAnalysisPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a] text-white">
      {/* Header */}
      <header className="bg-[#0a0a0a] border-b border-[#2a2a2a] px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link 
            href="/"
            className="text-[#888] hover:text-[#FF6B35] transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Image Analysis
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#FF6B35] mb-2">
            Video Shot Analysis
          </h1>
          <p className="text-[#888] max-w-xl mx-auto">
            Upload a video of your basketball shot (max 90 seconds) to get frame-by-frame analysis,
            phase detection, and the same comprehensive feedback as image analysis.
          </p>
        </div>

        {/* Main Card Container - Matches home page style */}
        <div className="bg-[#2C2C2C] rounded-lg overflow-hidden shadow-lg">
          {/* Video Upload Section */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-2">
              <Video className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="text-[#FF6B35] font-semibold text-lg">Upload Your Shooting Video</h2>
            </div>
            <p className="text-[#E5E5E5] text-sm mb-6">
              Upload a short video (max 90 seconds) of your shooting form. The system will automatically
              detect the shooting motion and extract 3 key frames for analysis.
            </p>
            <VideoUpload />
          </div>

          {/* Player Profile Section */}
          <div className="p-6 border-b border-[#3a3a3a]">
            <div className="flex items-center gap-3 mb-2">
              <User className="w-5 h-5 text-[#FF6B35]" />
              <h2 className="text-[#FF6B35] font-semibold text-lg">Player Profile (Optional)</h2>
            </div>
            <p className="text-[#E5E5E5] text-sm mb-6">
              Fill out your information for personalized analysis and elite shooter matching.
            </p>
            <PlayerProfileForm />
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-6">
          <h3 className="text-[#FF6B35] font-semibold mb-4">How Video Analysis Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-[#888]">
            <div className="space-y-2">
              <h4 className="text-[#E5E5E5] font-medium">1. Smart Shot Detection</h4>
              <p>Automatically detects when you&apos;re shooting (ignores dribbling, walking, etc.)</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[#E5E5E5] font-medium">2. 3 Key Frames</h4>
              <p>Extracts Setup, Release, and Follow-through moments from your shot.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[#E5E5E5] font-medium">3. Same Analysis</h4>
              <p>Uses the same AI analysis as image uploads - skeleton overlay, angles, scores.</p>
            </div>
            <div className="space-y-2">
              <h4 className="text-[#E5E5E5] font-medium">4. Session Saved</h4>
              <p>Your video session is saved just like image sessions for tracking progress.</p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-4 bg-[#1a1a1a] border border-[#3a3a3a] rounded-lg p-4">
          <h4 className="text-[#FF6B35] font-semibold text-sm mb-2">Tips for Best Results</h4>
          <ul className="text-[#888] text-xs space-y-1">
            <li>• Film from the side or 45° angle for best pose detection</li>
            <li>• Ensure your full body is visible throughout the shot</li>
            <li>• Good lighting helps the AI detect your joints accurately</li>
            <li>• Keep the camera steady - avoid excessive movement</li>
            <li>• Include the complete shooting motion in the video</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
