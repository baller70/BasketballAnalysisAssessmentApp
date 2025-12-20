"use client"

// #region agent log
const DEBUG_VERSION = "v2024-12-19-LATEST";
const debugLog = (location: string, message: string, data: Record<string, unknown>, hypothesisId: string) => {
  fetch('http://127.0.0.1:7243/ingest/4f306913-318f-4a0c-bd40-bb3fb22bd959',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data:{...data,DEBUG_VERSION},timestamp:Date.now(),sessionId:'debug-session',hypothesisId})}).catch(()=>{});
};
// #endregion

import React, { useCallback, useEffect, useState } from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAnalysisStore } from "@/stores/analysisStore"
import { ShotBreakdownStrip } from "@/components/analysis/ShotBreakdownStrip"
import { analyzeShotFrames, pickTeaserFrames, pickFullFrames, labelFrames, type ShotFrame } from "@/lib/shotBreakdown"

export function MediaUpload() {
  const {
    setUploadedFile,
    setMediaPreviewUrl,
    setTeaserFrames: setStoreTeaserFrames,
    setFullFrames: setStoreFullFrames,
    setAllUploadedUrls,
  } = useAnalysisStore()

  // Shot breakdown (stills) state
  const [shotImages, setShotImages] = useState<{ file: File; url: string }[]>([])
  const [teaserFrames, setTeaserFrames] = useState<ShotFrame[]>([])
  const [fullFrames, setFullFrames] = useState<ShotFrame[]>([])
  const [shotError, setShotError] = useState<string | null>(null)
  const [isBuildingStrip, setIsBuildingStrip] = useState(false)
  const [angleSlots, setAngleSlots] = useState<{ label: string; file: File | null; url: string | null }[]>([
    { label: "Angle 1", file: null, url: null },
    { label: "Angle 2", file: null, url: null },
    { label: "Angle 3", file: null, url: null },
    { label: "Angle 4", file: null, url: null },
    { label: "Angle 5", file: null, url: null },
    { label: "Angle 6", file: null, url: null },
    { label: "Angle 7", file: null, url: null },
  ])

  // Ensure no preloaded media shows up on INITIAL mount only
  // Using empty dependency array to run only once
  useEffect(() => {
    setUploadedFile(null)
    setMediaPreviewUrl(null)
    setShotImages([])
    setTeaserFrames([])
    setFullFrames([])
    setShotError(null)
    setAngleSlots([
      { label: "Angle 1", file: null, url: null },
      { label: "Angle 2", file: null, url: null },
      { label: "Angle 3", file: null, url: null },
      { label: "Angle 4", file: null, url: null },
      { label: "Angle 5", file: null, url: null },
      { label: "Angle 6", file: null, url: null },
      { label: "Angle 7", file: null, url: null },
    ])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])  // Empty array = run only on initial mount

  const clearShotBreakdown = () => {
    shotImages.forEach((img) => URL.revokeObjectURL(img.url))
    angleSlots.forEach((slot) => {
      if (slot.url) URL.revokeObjectURL(slot.url)
    })
    setShotImages([])
    setTeaserFrames([])
    setFullFrames([])
    setShotError(null)
    setAngleSlots((prev) => prev.map((slot) => ({ ...slot, file: null, url: null })))
    setUploadedFile(null)
    setMediaPreviewUrl(null)
  }

  useEffect(() => {
    return () => {
      shotImages.forEach((img) => URL.revokeObjectURL(img.url))
    }
  }, [shotImages])

  const buildStripFromSlots = useCallback(
    async (slots: { label: string; file: File | null; url: string | null }[]) => {
      const filled = slots.filter((s) => s.file && s.url) as { label: string; file: File; url: string }[]
      if (filled.length === 0) {
        setShotImages([])
        setTeaserFrames([])
        setFullFrames([])
        setStoreTeaserFrames([])
        setStoreFullFrames([])
        setAllUploadedUrls([])
        setShotError(null)
        return
      }
      if (filled.length < 3) {
        setShotError("Add at least 3 photos (up to 7 recommended).")
        setTeaserFrames([])
        setFullFrames([])
        setStoreTeaserFrames([])
        setStoreFullFrames([])
        return
      }
      const files = filled.map((f) => f.file)
      const urls = filled.map((f) => f.url)
      // eslint-disable-next-line no-console
      console.log("[MediaUpload] building strip from URLs", urls)
      setShotImages(files.map((file, idx) => ({ file, url: urls[idx] })))
      setAllUploadedUrls(urls)
      setIsBuildingStrip(true)
      try {
        const analyzed = await analyzeShotFrames(urls)
        const teaser = labelFrames(pickTeaserFrames(analyzed))
        const full = labelFrames(pickFullFrames(analyzed, 7))
        setTeaserFrames(teaser)
        setFullFrames(full)
        // Save to store for results page
        setStoreTeaserFrames(teaser.map((f, i) => ({
          id: f.id || `teaser-${i}`,
          url: f.url,
          label: f.label || "",
          wristAngle: f.wristAngle,
          confidence: f.confidence,
        })))
        setStoreFullFrames(full.map((f, i) => ({
          id: f.id || `full-${i}`,
          url: f.url,
          label: f.label || "",
          wristAngle: f.wristAngle,
          confidence: f.confidence,
        })))
        setShotError(null)
      } catch (error) {
        console.error("Shot breakdown failed", error)
        setShotError("Could not analyze photos. Use clearer, full-body images.")
      } finally {
        setIsBuildingStrip(false)
      }
    },
    [setStoreTeaserFrames, setStoreFullFrames, setAllUploadedUrls]
  )

  const updatePrimaryFromSlots = useCallback(
    async (slots: { label: string; file: File | null; url: string | null }[]) => {
      const firstFilled = slots.find((s) => s.file && s.url)
      if (!firstFilled) {
        setUploadedFile(null)
        setMediaPreviewUrl(null)
        return
      }
      setUploadedFile(firstFilled.file!)
      setMediaPreviewUrl(firstFilled.url || null)
    },
    [setUploadedFile, setMediaPreviewUrl]
  )

  return (
    <div className="space-y-4">
      {/* Image Requirements + Angle Slots (images) */}
      {
        <div className="bg-[#2a2a2a] border border-[#4a4a4a] rounded-lg p-4 space-y-4">
          <h4 className="text-[#FFD700] font-semibold text-sm mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Image Requirements for Analysis
          </h4>
          <ul className="text-[#888] text-xs space-y-1">
            <li>• Full body visible (head to feet)</li>
            <li>• <strong className="text-[#FFD700]">Center your object</strong> / player in the frame</li>
            <li>• Player in shooting position (arms raised)</li>
            <li>• Clear, well-lit image</li>
            <li>• Single person in frame</li>
          </ul>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-md border border-[#3a3a3a] bg-[#1c1c1c] p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-red-400">✖ Bad angles</div>
              <ul className="text-[#cfcfcf] text-xs space-y-1 list-disc list-inside">
                <li>Cropped limbs (no feet/hands) or multiple people.</li>
                <li>Backlit silhouettes, heavy motion blur.</li>
                <li>Random shots from different reps or extreme zoom/distortion.</li>
              </ul>
            </div>
            <div className="rounded-md border border-[#3a3a3a] bg-[#1c1c1c] p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-green-400">✔ Good angles</div>
              <ul className="text-[#cfcfcf] text-xs space-y-1 list-disc list-inside">
                <li>Side or 45° view, full body in frame.</li>
                <li>Good lighting, minimal blur, one shooter only.</li>
                <li>Feet visible (alignment), wrists/ball visible at release/hold.</li>
              </ul>
            </div>
          </div>
          {/* 7 Angle Slots */}
          <div className="space-y-3 mt-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-[#FFD700]">Upload Photos (Angles 1–7)</label>
              <button
                type="button"
                onClick={clearShotBreakdown}
                className="text-xs text-[#E5E5E5] underline underline-offset-2 hover:text-[#FFD700]"
              >
                Clear all
              </button>
            </div>
            <p className="text-[#bfbfbf] text-xs">Fill at least 3 slots. First image becomes the main preview.</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {angleSlots.map((slot, idx) => (
                <label
                  key={slot.label}
                  htmlFor={`angle-slot-${idx}`}
                  className={cn(
                    "border rounded-md p-3 text-xs bg-[#1f1f1f] flex flex-col items-center gap-2 cursor-pointer transition-colors",
                    slot.file ? "border-green-500/60 bg-green-500/10" : "border-[#3a3a3a] hover:border-[#FFD700]/60"
                  )}
                >
                  <span className="font-semibold text-[#FFD700]">{slot.label}</span>
                  <input
                    id={`angle-slot-${idx}`}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={async (e) => {
                      // #region agent log
                      debugLog('MediaUpload.tsx:onChange', 'File input changed', { slotIdx: idx, hasFiles: !!e.target.files?.length }, 'B');
                      // #endregion
                      const file = e.target.files?.[0]
                      if (!file) return
                      // #region agent log
                      debugLog('MediaUpload.tsx:onChange', 'File selected', { fileName: file.name, fileSize: file.size, slotIdx: idx }, 'B');
                      // #endregion
                      const next = [...angleSlots]
                      if (next[idx].url) URL.revokeObjectURL(next[idx].url as string)
                      next[idx] = { ...next[idx], file, url: URL.createObjectURL(file) }
                      setAngleSlots(next)
                      await buildStripFromSlots(next)
                      await updatePrimaryFromSlots(next)
                    }}
                  />
                  {slot.file ? (
                    <span className="text-green-400 text-[10px] truncate max-w-full">{slot.file.name}</span>
                  ) : (
                    <span className="text-[#888] text-[10px]">Click to select</span>
                  )}
                </label>
              ))}
            </div>
            {isBuildingStrip && (
              <div className="flex items-center gap-2 text-xs text-[#bfbfbf]">
                <Loader2 className="w-3 h-3 animate-spin" />
                Building strip...
              </div>
            )}
            {shotError && (
              <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-md p-2">
                {shotError}
              </div>
            )}
          </div>

          {/* Teaser Strip Preview */}
          {teaserFrames.length > 0 && (
            <ShotBreakdownStrip
              title="Sample Strip (watermarked)"
              frames={teaserFrames}
              watermark="SAMPLE"
              dense
            />
          )}

          {/* Full Strip Preview */}
          {fullFrames.length > 0 && (
            <ShotBreakdownStrip title="Full Strip" frames={fullFrames} />
          )}
        </div>
      }
    </div>
  )
}
