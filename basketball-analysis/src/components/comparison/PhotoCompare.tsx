"use client"

/**
 * PhotoCompare — side-by-side / slider overlay for the Compare tab.
 *
 * Replaces the dead "Photo Compare" placeholder. Given two images (the user's
 * own shooting-form frame and a reference shooter's frame) it renders:
 *   - a draggable vertical slider that wipes between the two images, and
 *   - a side-by-side mode, and
 *   - an optional pose-skeleton overlay drawn from MoveNet keypoints.
 *
 * Self-contained: no heavy/pose-model imports, mouse + touch support, and it
 * degrades gracefully when only one image (or no keypoints) is available.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Columns2, MoveHorizontal, PersonStanding } from "lucide-react"

// MoveNet keypoint can arrive either as a named record or an array of named
// points. Both are accepted.
type KeypointMap = Record<string, { x: number; y: number; confidence?: number }>
type KeypointArray = Array<{ name: string; x: number; y: number; confidence?: number }>

interface PhotoCompareProps {
  beforeImage?: string | null
  afterImage?: string | null
  beforeLabel?: string
  afterLabel?: string
  /** Optional pose keypoints to overlay on the BEFORE (user) image. */
  beforeKeypoints?: KeypointMap | KeypointArray | null
  /**
   * Natural pixel size of the BEFORE image the keypoints were measured against.
   * When provided the skeleton maps keypoints by absolute pixel ratio; otherwise
   * it auto-fits the skeleton to the keypoints' own bounding box.
   */
  beforeImageNaturalSize?: { width: number; height: number } | null
}

// Skeleton edges by MoveNet keypoint name (local copy to avoid importing the
// TensorFlow-backed pose module into the client bundle).
const SKELETON_EDGES: [string, string][] = [
  ["left_shoulder", "right_shoulder"],
  ["left_shoulder", "left_elbow"],
  ["left_elbow", "left_wrist"],
  ["right_shoulder", "right_elbow"],
  ["right_elbow", "right_wrist"],
  ["left_shoulder", "left_hip"],
  ["right_shoulder", "right_hip"],
  ["left_hip", "right_hip"],
  ["left_hip", "left_knee"],
  ["left_knee", "left_ankle"],
  ["right_hip", "right_knee"],
  ["right_knee", "right_ankle"],
]

function toKeypointMap(kp?: KeypointMap | KeypointArray | null): KeypointMap | null {
  if (!kp) return null
  if (Array.isArray(kp)) {
    const map: KeypointMap = {}
    for (const p of kp) {
      if (p && typeof p.name === "string") map[p.name] = { x: p.x, y: p.y, confidence: p.confidence }
    }
    return Object.keys(map).length ? map : null
  }
  return Object.keys(kp).length ? kp : null
}

/**
 * Project keypoints into 0..100 (%) coordinates for an absolutely-positioned
 * SVG overlay. Uses the natural image size when supplied; otherwise fits the
 * skeleton to its own bounding box (centered, with margin) so it still reads as
 * a pose even when the source coordinate space is unknown.
 */
function projectKeypoints(
  map: KeypointMap,
  naturalSize?: { width: number; height: number } | null
): Record<string, { x: number; y: number }> {
  const entries = Object.entries(map).filter(
    ([, p]) => p && isFinite(p.x) && isFinite(p.y) && (p.confidence ?? 1) > 0.2
  )
  if (entries.length === 0) return {}

  if (naturalSize && naturalSize.width > 0 && naturalSize.height > 0) {
    const out: Record<string, { x: number; y: number }> = {}
    for (const [name, p] of entries) {
      out[name] = {
        x: (p.x / naturalSize.width) * 100,
        y: (p.y / naturalSize.height) * 100,
      }
    }
    return out
  }

  // Bounding-box auto-fit fallback.
  const xs = entries.map(([, p]) => p.x)
  const ys = entries.map(([, p]) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const spanX = maxX - minX || 1
  const spanY = maxY - minY || 1
  const MARGIN = 12 // percent
  const out: Record<string, { x: number; y: number }> = {}
  for (const [name, p] of entries) {
    out[name] = {
      x: MARGIN + ((p.x - minX) / spanX) * (100 - MARGIN * 2),
      y: MARGIN + ((p.y - minY) / spanY) * (100 - MARGIN * 2),
    }
  }
  return out
}

export function PhotoCompare({
  beforeImage,
  afterImage,
  beforeLabel = "You",
  afterLabel = "Reference",
  beforeKeypoints,
  beforeImageNaturalSize,
}: PhotoCompareProps) {
  const [mode, setMode] = useState<"slider" | "sideBySide">("slider")
  const [position, setPosition] = useState(50)
  const [showSkeleton, setShowSkeleton] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const projected = useMemo(() => {
    const map = toKeypointMap(beforeKeypoints)
    if (!map) return null
    const points = projectKeypoints(map, beforeImageNaturalSize)
    return Object.keys(points).length ? points : null
  }, [beforeKeypoints, beforeImageNaturalSize])

  const updateFromClientX = useCallback((clientX: number) => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.max(0, Math.min(100, pct)))
  }, [])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return
      updateFromClientX(e.clientX)
    }
    const onUp = () => {
      dragging.current = false
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [updateFromClientX])

  const hasBoth = Boolean(beforeImage && afterImage)

  // Single image (or none): show what we have without slider chrome.
  if (!hasBoth) {
    const only = beforeImage || afterImage
    const onlyLabel = beforeImage ? beforeLabel : afterLabel
    return (
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        {only ? (
          <div className="relative w-full aspect-[3/4] max-h-[480px] mx-auto rounded-lg overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={only} alt={onlyLabel} className="w-full h-full object-contain" />
            {beforeImage && showSkeleton && projected && (
              <SkeletonOverlay points={projected} />
            )}
            <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold bg-black/60 text-white">
              {onlyLabel}
            </span>
            {beforeImage && projected && (
              <SkeletonToggle on={showSkeleton} onToggle={() => setShowSkeleton((s) => !s)} />
            )}
          </div>
        ) : (
          <div className="text-center py-10">
            <Columns2 className="w-12 h-12 text-[#FF6B35] mx-auto mb-4" />
            <h3 className="text-slate-900 font-bold text-lg mb-2">Photo Comparison</h3>
            <p className="text-slate-500 text-sm">
              Analyze a shot to compare your form side-by-side with a similar elite shooter.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-4 md:p-6 border border-slate-200 shadow-sm space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1 p-1 bg-slate-50 rounded-lg border border-slate-200">
          <button
            onClick={() => setMode("slider")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === "slider"
                ? "bg-[#FF6B35] text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5" />
            Slider
          </button>
          <button
            onClick={() => setMode("sideBySide")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              mode === "sideBySide"
                ? "bg-[#FF6B35] text-white"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <Columns2 className="w-3.5 h-3.5" />
            Side by Side
          </button>
        </div>

        {projected && (
          <button
            onClick={() => setShowSkeleton((s) => !s)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
              showSkeleton
                ? "bg-[#FF6B35] text-white border-[#FF6B35]"
                : "bg-white text-slate-500 border-slate-200 hover:text-slate-900"
            }`}
          >
            <PersonStanding className="w-3.5 h-3.5" />
            Skeleton
          </button>
        )}
      </div>

      {mode === "sideBySide" ? (
        <div className="grid grid-cols-2 gap-3">
          <figure className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={beforeImage!} alt={beforeLabel} className="w-full h-full object-contain" />
            {showSkeleton && projected && <SkeletonOverlay points={projected} />}
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-bold bg-black/60 text-white">
              {beforeLabel}
            </span>
          </figure>
          <figure className="relative aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={afterImage!} alt={afterLabel} className="w-full h-full object-contain" />
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[11px] font-bold bg-[#FF6B35] text-white">
              {afterLabel}
            </span>
          </figure>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="relative w-full aspect-[3/4] max-h-[520px] mx-auto rounded-lg overflow-hidden bg-slate-900 select-none touch-none"
          onMouseDown={(e) => {
            dragging.current = true
            updateFromClientX(e.clientX)
          }}
          onTouchStart={(e) => updateFromClientX(e.touches[0].clientX)}
          onTouchMove={(e) => updateFromClientX(e.touches[0].clientX)}
        >
          {/* AFTER (reference) is the base layer */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={afterImage!}
            alt={afterLabel}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            draggable={false}
          />
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold bg-[#FF6B35] text-white z-20">
            {afterLabel}
          </span>

          {/* BEFORE (you) clipped to the slider position */}
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={beforeImage!}
              alt={beforeLabel}
              className="absolute inset-0 w-full h-full object-contain"
              draggable={false}
            />
            {showSkeleton && projected && <SkeletonOverlay points={projected} />}
            <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold bg-black/60 text-white">
              {beforeLabel}
            </span>
          </div>

          {/* Drag handle */}
          <div
            className="absolute top-0 bottom-0 z-20 flex items-center justify-center pointer-events-none"
            style={{ left: `${position}%`, transform: "translateX(-50%)" }}
          >
            <div className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_6px_rgba(0,0,0,0.6)]" />
            <div className="w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center">
              <MoveHorizontal className="w-4 h-4 text-[#FF6B35]" />
            </div>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-slate-400">
        {mode === "slider"
          ? "Drag the handle to wipe between your form and the reference shooter."
          : "Your form (left) compared with a similar elite shooter (right)."}
      </p>
    </div>
  )
}

function SkeletonToggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`absolute bottom-3 right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all ${
        on
          ? "bg-[#FF6B35] text-white border-[#FF6B35]"
          : "bg-white/90 text-slate-600 border-slate-200"
      }`}
    >
      <PersonStanding className="w-3.5 h-3.5" />
      Skeleton
    </button>
  )
}

function SkeletonOverlay({ points }: { points: Record<string, { x: number; y: number }> }) {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    >
      {SKELETON_EDGES.map(([a, b], i) => {
        const pa = points[a]
        const pb = points[b]
        if (!pa || !pb) return null
        return (
          <line
            key={i}
            x1={pa.x}
            y1={pa.y}
            x2={pb.x}
            y2={pb.y}
            stroke="#FF6B35"
            strokeWidth={0.9}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ strokeWidth: 3 }}
          />
        )
      })}
      {Object.values(points).map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.2} fill="#fff" stroke="#FF6B35" strokeWidth={0.5} />
      ))}
    </svg>
  )
}

export default PhotoCompare
