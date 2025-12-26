"use client"

import React, { useState } from "react"
import { ChevronLeft, ChevronRight, Maximize2, X } from "lucide-react"

interface FrameMetrics {
  elbowAngle?: number
  kneeAngle?: number
  wristAngle?: number
  balance?: number
  releaseHeight?: number
}

interface ShotPhaseFrame {
  id: string
  url: string
  phase: "stance" | "load" | "set" | "release" | "follow"
  label: string
  timestamp?: string
  frameNumber?: number
  metrics?: FrameMetrics
  observations?: string[]
  status?: "good" | "ok" | "needs_work"
}

interface EnhancedShotStripProps {
  frames: ShotPhaseFrame[]
  title?: string
  showComparison?: boolean
  comparisonImages?: { phase: string; url: string; label: string }[]
  layout?: "horizontal" | "vertical"
  watermark?: string
  onFrameClick?: (frame: ShotPhaseFrame) => void
  className?: string
}

const PHASE_COLORS = {
  stance: { bg: "#3b82f6", text: "#93c5fd" },
  load: { bg: "#8b5cf6", text: "#c4b5fd" },
  set: { bg: "#f59e0b", text: "#fcd34d" },
  release: { bg: "#22c55e", text: "#86efac" },
  follow: { bg: "#ef4444", text: "#fca5a5" },
}

const PHASE_LABELS = {
  stance: "1. Stance",
  load: "2. Load/Dip",
  set: "3. Set Point",
  release: "4. Release",
  follow: "5. Follow-Through",
}

const STATUS_COLORS = {
  good: "#22c55e",
  ok: "#eab308",
  needs_work: "#ef4444",
}

export function EnhancedShotStrip({
  frames,
  title = "Shot Breakdown",
  showComparison = false,
  comparisonImages = [],
  layout = "horizontal",
  watermark,
  onFrameClick,
  className = "",
}: EnhancedShotStripProps) {
  const [selectedFrame, setSelectedFrame] = useState<ShotPhaseFrame | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : frames.length - 1))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < frames.length - 1 ? prev + 1 : 0))
  }

  const handleFrameClick = (frame: ShotPhaseFrame) => {
    setSelectedFrame(frame)
    onFrameClick?.(frame)
  }

  if (frames.length === 0) {
    return (
      <div className={`bg-[#2a2a2a] rounded-lg p-6 text-center ${className}`}>
        <p className="text-[#888] text-sm">No frames available for breakdown.</p>
      </div>
    )
  }

  return (
    <>
      <div className={`bg-[#2a2a2a] rounded-lg overflow-hidden border border-[#4a4a4a] ${className}`}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#3a3a3a] flex items-center justify-between">
          <div>
            <h3 className="text-[#FF6B35] font-bold text-sm uppercase tracking-wider">{title}</h3>
            <p className="text-[#888] text-xs mt-0.5">{frames.length} key phases extracted</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-[#888] text-xs min-w-[40px] text-center">
              {currentIndex + 1}/{frames.length}
            </span>
            <button
              onClick={handleNext}
              className="p-1.5 rounded bg-[#3a3a3a] hover:bg-[#4a4a4a] text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Frames Strip */}
        <div
          className={`p-4 ${
            layout === "horizontal"
              ? "flex gap-3 overflow-x-auto"
              : "grid grid-cols-1 sm:grid-cols-2 gap-3"
          }`}
        >
          {frames.map((frame, idx) => {
            const phaseColor = PHASE_COLORS[frame.phase] || PHASE_COLORS.stance
            const statusColor = frame.status ? STATUS_COLORS[frame.status] : null

            return (
              <div
                key={frame.id || idx}
                className={`flex-shrink-0 rounded-lg overflow-hidden bg-[#1a1a1a] border-2 transition-all cursor-pointer hover:border-[#FF6B35]/60 ${
                  layout === "horizontal" ? "w-44" : ""
                }`}
                style={{
                  borderColor: statusColor || "#3a3a3a",
                }}
                onClick={() => handleFrameClick(frame)}
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frame.url}
                    alt={frame.label}
                    className="w-full h-full object-cover"
                  />

                  {/* Watermark overlay */}
                  {watermark && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="text-white/30 text-2xl font-bold rotate-[-25deg] tracking-widest">
                        {watermark}
                      </span>
                    </div>
                  )}

                  {/* Phase badge */}
                  <div
                    className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                    style={{
                      backgroundColor: phaseColor.bg,
                      color: phaseColor.text,
                    }}
                  >
                    {PHASE_LABELS[frame.phase] || frame.label}
                  </div>

                  {/* Frame number */}
                  {frame.frameNumber && (
                    <div className="absolute top-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] text-white">
                      #{frame.frameNumber}
                    </div>
                  )}

                  {/* Status indicator */}
                  {statusColor && (
                    <div
                      className="absolute bottom-2 right-2 w-3 h-3 rounded-full border-2 border-white"
                      style={{ backgroundColor: statusColor }}
                    />
                  )}

                  {/* Expand icon */}
                  <div className="absolute bottom-2 left-2 bg-black/70 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-3 h-3 text-white" />
                  </div>
                </div>

                {/* Info Panel */}
                <div className="p-2 space-y-1">
                  <p className="text-white text-xs font-semibold truncate">{frame.label}</p>

                  {/* Metrics */}
                  {frame.metrics && (
                    <div className="flex flex-wrap gap-1">
                      {frame.metrics.elbowAngle && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3a3a3a] text-[#888]">
                          Elbow: {frame.metrics.elbowAngle}°
                        </span>
                      )}
                      {frame.metrics.kneeAngle && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3a3a3a] text-[#888]">
                          Knee: {frame.metrics.kneeAngle}°
                        </span>
                      )}
                      {frame.metrics.wristAngle && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#3a3a3a] text-[#888]">
                          Wrist: {frame.metrics.wristAngle}°
                        </span>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  {frame.timestamp && (
                    <p className="text-[#666] text-[10px]">{frame.timestamp}</p>
                  )}
                </div>

                {/* Comparison Section (if enabled) */}
                {showComparison && comparisonImages.find((c) => c.phase === frame.phase) && (
                  <div className="border-t border-[#3a3a3a] p-2">
                    <p className="text-[#888] text-[9px] uppercase mb-1">Elite Reference</p>
                    <div className="relative aspect-[3/4] rounded overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={comparisonImages.find((c) => c.phase === frame.phase)?.url || ""}
                        alt="Elite reference"
                        className="w-full h-full object-cover opacity-70"
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Observations Footer */}
        {frames[currentIndex]?.observations && frames[currentIndex].observations!.length > 0 && (
          <div className="px-4 py-3 border-t border-[#3a3a3a] bg-[#1a1a1a]">
            <p className="text-[#FF6B35] text-xs font-bold mb-1">
              {PHASE_LABELS[frames[currentIndex].phase]} Observations:
            </p>
            <ul className="text-[#888] text-xs space-y-0.5">
              {frames[currentIndex].observations!.map((obs, i) => (
                <li key={i}>• {obs}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedFrame && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFrame(null)}
        >
          <div
            className="relative max-w-3xl w-full bg-[#1a1a1a] rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setSelectedFrame(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Large image */}
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={selectedFrame.url}
                alt={selectedFrame.label}
                className="w-full h-auto max-h-[70vh] object-contain"
              />

              {/* Phase badge */}
              <div
                className="absolute top-4 left-4 px-3 py-1 rounded text-sm font-bold uppercase"
                style={{
                  backgroundColor: PHASE_COLORS[selectedFrame.phase]?.bg || "#3a3a3a",
                  color: PHASE_COLORS[selectedFrame.phase]?.text || "#fff",
                }}
              >
                {PHASE_LABELS[selectedFrame.phase] || selectedFrame.label}
              </div>
            </div>

            {/* Details Panel */}
            <div className="p-6 border-t border-[#3a3a3a]">
              <h4 className="text-white text-lg font-bold mb-2">{selectedFrame.label}</h4>

              {selectedFrame.metrics && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {selectedFrame.metrics.elbowAngle && (
                    <div className="bg-[#2a2a2a] rounded p-3 text-center">
                      <p className="text-[#FF6B35] text-xl font-bold">
                        {selectedFrame.metrics.elbowAngle}°
                      </p>
                      <p className="text-[#888] text-xs">Elbow Angle</p>
                    </div>
                  )}
                  {selectedFrame.metrics.kneeAngle && (
                    <div className="bg-[#2a2a2a] rounded p-3 text-center">
                      <p className="text-[#FF6B35] text-xl font-bold">
                        {selectedFrame.metrics.kneeAngle}°
                      </p>
                      <p className="text-[#888] text-xs">Knee Angle</p>
                    </div>
                  )}
                  {selectedFrame.metrics.wristAngle && (
                    <div className="bg-[#2a2a2a] rounded p-3 text-center">
                      <p className="text-[#FF6B35] text-xl font-bold">
                        {selectedFrame.metrics.wristAngle}°
                      </p>
                      <p className="text-[#888] text-xs">Wrist Angle</p>
                    </div>
                  )}
                </div>
              )}

              {selectedFrame.observations && selectedFrame.observations.length > 0 && (
                <div>
                  <p className="text-[#888] text-sm mb-2">Observations:</p>
                  <ul className="text-white text-sm space-y-1">
                    {selectedFrame.observations.map((obs, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-[#FF6B35]">•</span>
                        {obs}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}













