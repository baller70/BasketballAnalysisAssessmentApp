"use client"

import React, { useState } from "react"
import Image from "next/image"
import { SkeletonOverlay, Keypoint } from "./SkeletonOverlay"
// AngleIndicators used in AngleComparisonTable

/**
 * SplitScreenComparison Component
 * 
 * Side-by-side comparison of user's shooting form with a professional player.
 * Shows skeleton overlays and angle differences.
 */

interface ShooterData {
  name: string
  team?: string
  imageUrl: string
  keypoints?: Keypoint[]
  angles: {
    elbowAngle?: number
    kneeAngle?: number
    wristAngle?: number
    shoulderAngle?: number
    hipAngle?: number
    releaseAngle?: number
  }
  strengths?: string[]
  signature?: string
}

interface SplitScreenComparisonProps {
  userImage: string
  userKeypoints?: Keypoint[]
  userAngles: {
    elbowAngle?: number
    kneeAngle?: number
    wristAngle?: number
    shoulderAngle?: number
    hipAngle?: number
    releaseAngle?: number
  }
  professional: ShooterData
  showSkeleton?: boolean
  showAngles?: boolean
  className?: string
}

export function SplitScreenComparison({
  userImage,
  userKeypoints,
  userAngles,
  professional,
  showSkeleton = true,
  showAngles = true,
  className = "",
}: SplitScreenComparisonProps) {
  const [viewMode, setViewMode] = useState<"side-by-side" | "overlay" | "slider">("side-by-side")
  const [sliderPosition, setSliderPosition] = useState(50)

  return (
    <div className={`bg-gray-900 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-white">Form Comparison</h3>
        <div className="flex gap-2">
          {(["side-by-side", "overlay", "slider"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                viewMode === mode
                  ? "bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              {mode === "side-by-side" ? "Side by Side" : mode === "overlay" ? "Overlay" : "Slider"}
            </button>
          ))}
        </div>
      </div>

      {/* Comparison View */}
      {viewMode === "side-by-side" && (
        <SideBySideView
          userImage={userImage}
          userKeypoints={userKeypoints}
          professional={professional}
          showSkeleton={showSkeleton}
        />
      )}

      {viewMode === "overlay" && (
        <OverlayView
          userImage={userImage}
          userKeypoints={userKeypoints}
          professional={professional}
          showSkeleton={showSkeleton}
        />
      )}

      {viewMode === "slider" && (
        <SliderView
          userImage={userImage}
          professionalImage={professional.imageUrl}
          sliderPosition={sliderPosition}
          onSliderChange={setSliderPosition}
        />
      )}

      {/* Angle Comparison */}
      {showAngles && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-white mb-3">Angle Comparison</h4>
          <AngleComparisonTable userAngles={userAngles} proAngles={professional.angles} />
        </div>
      )}

      {/* Professional Info */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            {professional.name.charAt(0)}
          </div>
          <div>
            <div className="text-white font-medium">{professional.name}</div>
            {professional.team && (
              <div className="text-gray-400 text-sm">{professional.team}</div>
            )}
          </div>
        </div>
        {professional.signature && (
          <p className="text-gray-300 text-sm mt-2 italic">&ldquo;{professional.signature}&rdquo;</p>
        )}
        {professional.strengths && professional.strengths.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {professional.strengths.map((strength, idx) => (
              <span key={idx} className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded">
                {strength}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Side by Side View
function SideBySideView({
  userImage,
  userKeypoints,
  professional,
  showSkeleton,
}: {
  userImage: string
  userKeypoints?: Keypoint[]
  professional: ShooterData
  showSkeleton: boolean
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* User */}
      <div className="relative">
        <div className="text-center mb-2 text-sm font-medium text-blue-400">Your Form</div>
        {showSkeleton && userKeypoints ? (
          <SkeletonOverlay
            imageUrl={userImage}
            keypoints={userKeypoints}
            width={350}
            height={450}
            className="mx-auto"
          />
        ) : (
          <div className="relative w-[350px] h-[450px] mx-auto rounded-lg overflow-hidden">
            <Image
              src={userImage}
              alt="Your shooting form"
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>

      {/* Professional */}
      <div className="relative">
        <div className="text-center mb-2 text-sm font-medium text-green-400">
          {professional.name}
        </div>
        {showSkeleton && professional.keypoints ? (
          <SkeletonOverlay
            imageUrl={professional.imageUrl}
            keypoints={professional.keypoints}
            width={350}
            height={450}
            className="mx-auto"
          />
        ) : (
          <div className="relative w-[350px] h-[450px] mx-auto rounded-lg overflow-hidden">
            <Image
              src={professional.imageUrl}
              alt={`${professional.name} shooting form`}
              fill
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  )
}

// Overlay View
function OverlayView({
  userImage,
  userKeypoints,
  professional,
  showSkeleton,
}: {
  userImage: string
  userKeypoints?: Keypoint[]
  professional: ShooterData
  showSkeleton: boolean
}) {
  const [opacity, setOpacity] = useState(50)

  return (
    <div className="relative">
      <div className="relative w-[500px] h-[600px] mx-auto">
        {/* User image (base) */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <Image
            src={userImage}
            alt="Your form"
            fill
            className="object-contain"
          />
        </div>
        
        {/* Professional image (overlay) */}
        <div 
          className="absolute inset-0 rounded-lg overflow-hidden"
          style={{ opacity: opacity / 100 }}
        >
          <Image
            src={professional.imageUrl}
            alt={professional.name}
            fill
            className="object-contain mix-blend-overlay"
          />
        </div>

        {/* Skeleton overlays */}
        {showSkeleton && (
          <>
            {userKeypoints && (
              <div className="absolute inset-0">
                <SkeletonOverlay
                  imageUrl={userImage}
                  keypoints={userKeypoints.map(kp => ({ ...kp, status: "warning" as const }))}
                  width={500}
                  height={600}
                />
              </div>
            )}
            {professional.keypoints && (
              <div className="absolute inset-0" style={{ opacity: opacity / 100 }}>
                <SkeletonOverlay
                  imageUrl={professional.imageUrl}
                  keypoints={professional.keypoints.map(kp => ({ ...kp, status: "good" as const }))}
                  width={500}
                  height={600}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Opacity slider */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <span className="text-sm text-blue-400">You</span>
        <input
          type="range"
          min="0"
          max="100"
          value={opacity}
          onChange={(e) => setOpacity(parseInt(e.target.value))}
          className="w-48 accent-blue-500"
        />
        <span className="text-sm text-green-400">{professional.name}</span>
      </div>
    </div>
  )
}

// Slider View
function SliderView({
  userImage,
  professionalImage,
  sliderPosition,
  onSliderChange,
}: {
  userImage: string
  professionalImage: string
  sliderPosition: number
  onSliderChange: (pos: number) => void
}) {
  return (
    <div className="relative w-[600px] h-[700px] mx-auto overflow-hidden rounded-lg">
      {/* Professional (right side) */}
      <div className="absolute inset-0">
        <Image
          src={professionalImage}
          alt="Professional form"
          fill
          className="object-contain"
        />
      </div>

      {/* User (left side, clipped) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <Image
          src={userImage}
          alt="Your form"
          fill
          className="object-contain"
        />
      </div>

      {/* Slider line */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg cursor-ew-resize"
        style={{ left: `${sliderPosition}%` }}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center">
          <span className="text-gray-800">↔</span>
        </div>
      </div>

      {/* Invisible drag area */}
      <div
        className="absolute inset-0 cursor-ew-resize"
        onMouseMove={(e) => {
          if (e.buttons === 1) {
            const rect = e.currentTarget.getBoundingClientRect()
            const pos = ((e.clientX - rect.left) / rect.width) * 100
            onSliderChange(Math.max(0, Math.min(100, pos)))
          }
        }}
      />

      {/* Labels */}
      <div className="absolute bottom-4 left-4 px-2 py-1 bg-blue-600 text-white text-sm rounded">
        You
      </div>
      <div className="absolute bottom-4 right-4 px-2 py-1 bg-green-600 text-white text-sm rounded">
        Pro
      </div>
    </div>
  )
}

// Angle Comparison Table
function AngleComparisonTable({
  userAngles,
  proAngles,
}: {
  userAngles: Record<string, number | undefined>
  proAngles: Record<string, number | undefined>
}) {
  const angleKeys = ["elbowAngle", "kneeAngle", "wristAngle", "releaseAngle", "hipAngle"]
  const angleLabels: Record<string, string> = {
    elbowAngle: "Elbow",
    kneeAngle: "Knee",
    wristAngle: "Wrist",
    releaseAngle: "Release",
    hipAngle: "Hip",
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 border-b border-gray-700">
            <th className="text-left py-2 px-3">Angle</th>
            <th className="text-center py-2 px-3">You</th>
            <th className="text-center py-2 px-3">Pro</th>
            <th className="text-center py-2 px-3">Difference</th>
          </tr>
        </thead>
        <tbody>
          {angleKeys.map((key) => {
            const userVal = userAngles[key]
            const proVal = proAngles[key]
            const diff = userVal !== undefined && proVal !== undefined ? userVal - proVal : null

            return (
              <tr key={key} className="border-b border-gray-800">
                <td className="py-2 px-3 text-gray-300">{angleLabels[key]}</td>
                <td className="py-2 px-3 text-center text-blue-400 font-mono">
                  {userVal !== undefined ? `${userVal.toFixed(1)}°` : "-"}
                </td>
                <td className="py-2 px-3 text-center text-green-400 font-mono">
                  {proVal !== undefined ? `${proVal.toFixed(1)}°` : "-"}
                </td>
                <td className={`py-2 px-3 text-center font-mono ${
                  diff === null ? "text-gray-500" :
                  Math.abs(diff) <= 5 ? "text-green-400" :
                  Math.abs(diff) <= 10 ? "text-yellow-400" : "text-red-400"
                }`}>
                  {diff !== null ? `${diff > 0 ? "+" : ""}${diff.toFixed(1)}°` : "-"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default SplitScreenComparison





