"use client"

/**
 * /video-analysis/upload — canonical video-upload flow, adapted from the iOS
 * screens 026-video-upload / 024-upload-quality-check (no desktop screen was
 * supplied for this flow). The preserved domain pieces are untouched:
 * VideoUpload (smart shot detection, 3-key-frame extraction) and
 * PlayerProfileForm feed the same analysis pipeline as before.
 */

import React from "react"
import { VideoUpload } from "@/components/upload/VideoUpload"
import { PlayerProfileForm } from "@/components/upload/PlayerProfileForm"
import Link from "next/link"
import { ArrowLeft, Video, User } from "lucide-react"
import { SectionLabel, Card } from "@/components/shotiq/ShotIQShell"

export default function VideoAnalysisPage() {
  return (
      <main data-testid="screen-desktop-web-video-upload" className="mx-auto max-w-4xl px-[26px] py-[18px]">
        <Link href="/video-analysis"
              className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to live capture
        </Link>

        <h1 className="shotiq-display mt-[10px] text-[48px] leading-[50px]">VIDEO UPLOAD</h1>
        <p className="mt-[4px] max-w-xl text-[14px] text-[var(--shotiq-color-graphite)]">
          Upload a clear video of your shot for AI analysis. MP4 · 3–90 seconds ·
          best results in portrait orientation.
        </p>

        <Card className="mt-[18px] overflow-hidden">
          <div className="border-b border-[var(--shotiq-color-rule)] p-6">
            <div className="mb-1 flex items-center gap-3">
              <Video className="h-5 w-5 text-[var(--shotiq-color-shotiqOrange)]" />
              <SectionLabel>UPLOAD YOUR SHOOTING VIDEO</SectionLabel>
            </div>
            <p className="mb-6 text-sm text-[var(--shotiq-color-graphite)]">
              The system automatically detects the shooting motion and extracts
              3 key frames for analysis.
            </p>
            <VideoUpload />
          </div>

          <div className="p-6">
            <div className="mb-1 flex items-center gap-3">
              <User className="h-5 w-5 text-[var(--shotiq-color-shotiqOrange)]" />
              <SectionLabel>PLAYER PROFILE (OPTIONAL)</SectionLabel>
            </div>
            <p className="mb-6 text-sm text-[var(--shotiq-color-graphite)]">
              Fill out your information for personalized analysis and elite shooter matching.
            </p>
            <PlayerProfileForm />
          </div>
        </Card>

        <Card className="mt-[18px] p-6">
          <SectionLabel>HOW VIDEO ANALYSIS WORKS</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-[var(--shotiq-color-graphite)] md:grid-cols-2">
            {[["1. Smart Shot Detection", "Automatically detects when you're shooting (ignores dribbling, walking, etc.)"],
              ["2. 3 Key Frames", "Extracts Setup, Release, and Follow-through moments from your shot."],
              ["3. Same Analysis", "Uses the same AI analysis as image uploads — skeleton overlay, angles, scores."],
              ["4. Session Saved", "Your video session is saved just like image sessions for tracking progress."]].map(([t, d]) => (
              <div key={t} className="space-y-1">
                <h4 className="font-medium text-[var(--shotiq-color-ink)]">{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-[14px] bg-[var(--shotiq-color-warmCanvas)] p-4">
          <SectionLabel>FRAMING GUIDE</SectionLabel>
          <ul className="mt-2 space-y-1 text-xs text-[var(--shotiq-color-graphite)]">
            <li>• Film from the side or 45° angle for best pose detection</li>
            <li>• Full body in frame from feet to above release</li>
            <li>• Good lighting helps the AI detect your joints accurately</li>
            <li>• Keep the camera steady — avoid excessive movement</li>
            <li>• Include the complete shooting motion in the video</li>
          </ul>
        </Card>
      </main>
  )
}
