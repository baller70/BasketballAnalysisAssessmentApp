/**
 * @file VideoPlayerSection.tsx
 * @description Video player section with GSAP-powered 3-stage playback
 * 
 * PURPOSE:
 * - Provides the main video playback experience
 * - GSAP Player: 3-stage sequence (full speed, label tutorial, slow-mo)
 * - Includes video download capability
 * - Accepts external overlay toggles from parent component
 */
"use client"

import React from "react"
import { GSAPVideoPlayer } from "./GSAPVideoPlayer"

interface OverlayToggles {
  skeleton: boolean
  joints: boolean
  annotations: boolean
  basketball: boolean
}

interface VideoPlayerSectionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  videoData: any // Video analysis data from backend
  overlayToggles?: OverlayToggles // External overlay controls
}

export function VideoPlayerSection({ videoData, overlayToggles }: VideoPlayerSectionProps) {
  return (
    <div className="p-6 border-b border-[#3a3a3a]">
      <div className="max-w-3xl mx-auto">
        <GSAPVideoPlayer videoData={videoData} externalOverlayToggles={overlayToggles} />
      </div>
    </div>
  )
}

export default VideoPlayerSection
