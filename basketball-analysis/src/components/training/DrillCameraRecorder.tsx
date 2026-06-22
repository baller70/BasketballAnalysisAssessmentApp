"use client"

import React, { useEffect, useRef, useState, useCallback } from "react"
import { Video, X, Circle, Square, RotateCcw, Check, AlertTriangle } from "lucide-react"

interface DrillCameraRecorderProps {
  open: boolean
  drillName?: string
  /** Called with the recorded video File once the user confirms. */
  onRecorded: (file: File) => void
  onClose: () => void
  /** Fallback invoked when the camera can't be opened (e.g. permission denied). */
  onPermissionDenied?: () => void
}

/**
 * In-app camera recorder modal using the browser MediaRecorder + getUserMedia APIs.
 * Produces a video File that is fed into the same flow as an uploaded drill video.
 */
export default function DrillCameraRecorder({
  open,
  drillName,
  onRecorded,
  onClose,
  onPermissionDenied,
}: DrillCameraRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [status, setStatus] = useState<"idle" | "ready" | "recording" | "recorded" | "error">("idle")
  const [error, setError] = useState<string | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null)
  const [recordedFile, setRecordedFile] = useState<File | null>(null)

  const stopStream = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop()
      } catch {
        /* ignore */
      }
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const cleanup = useCallback(() => {
    stopStream()
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl)
    }
    setRecordedUrl(null)
    setRecordedFile(null)
    setElapsed(0)
    setStatus("idle")
    setError(null)
    chunksRef.current = []
  }, [stopStream, recordedUrl])

  // Pick the best supported mime type for this browser.
  const pickMimeType = (): string => {
    const candidates = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
      "video/mp4",
    ]
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
      for (const c of candidates) {
        if (MediaRecorder.isTypeSupported(c)) return c
      }
    }
    return ""
  }

  const startCamera = useCallback(async () => {
    setError(null)
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setStatus("error")
      setError("Camera is not supported in this browser.")
      onPermissionDenied?.()
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: true,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        await videoRef.current.play().catch(() => {})
      }
      setStatus("ready")
    } catch (err) {
      console.error("getUserMedia failed:", err)
      setStatus("error")
      setError(
        "Camera access was denied or unavailable. You can upload a video file instead."
      )
      onPermissionDenied?.()
    }
  }, [onPermissionDenied])

  // Open / close lifecycle.
  useEffect(() => {
    if (open) {
      startCamera()
    } else {
      cleanup()
    }
    return () => {
      stopStream()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleStartRecording = () => {
    if (!streamRef.current) return
    chunksRef.current = []
    const mimeType = pickMimeType()
    let recorder: MediaRecorder
    try {
      recorder = mimeType
        ? new MediaRecorder(streamRef.current, { mimeType })
        : new MediaRecorder(streamRef.current)
    } catch (err) {
      console.error("MediaRecorder init failed:", err)
      setStatus("error")
      setError("Recording is not supported in this browser. Please upload a file instead.")
      onPermissionDenied?.()
      return
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
    }
    recorder.onstop = () => {
      const type = recorder.mimeType || "video/webm"
      const blob = new Blob(chunksRef.current, { type })
      const ext = type.includes("mp4") ? "mp4" : "webm"
      const file = new File([blob], `drill-recording-${Date.now()}.${ext}`, { type })
      const url = URL.createObjectURL(blob)
      setRecordedFile(file)
      setRecordedUrl(url)
      setStatus("recorded")
      // Stop the live preview tracks now that we've captured the clip.
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop())
        streamRef.current = null
      }
    }

    recorderRef.current = recorder
    recorder.start()
    setStatus("recording")
    setElapsed(0)
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000)
  }

  const handleStopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop()
    }
  }

  const handleRetake = () => {
    if (recordedUrl) URL.revokeObjectURL(recordedUrl)
    setRecordedUrl(null)
    setRecordedFile(null)
    setElapsed(0)
    setStatus("idle")
    startCamera()
  }

  const handleUseRecording = () => {
    if (recordedFile) {
      onRecorded(recordedFile)
    }
    // Don't revoke recordedUrl here — ownership of the File passes to the caller.
    setRecordedUrl(null)
    setRecordedFile(null)
    onClose()
  }

  const handleClose = () => {
    cleanup()
    onClose()
  }

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${sec.toString().padStart(2, "0")}`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <Video className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wide">Record Drill</h3>
              {drillName && <p className="text-xs text-slate-500">{drillName}</p>}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black">
            {status === "recorded" && recordedUrl ? (
              <video src={recordedUrl} controls playsInline className="w-full h-full object-contain bg-black" />
            ) : (
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            )}

            {status === "recording" && (
              <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-red-600 text-white text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                REC {formatElapsed(elapsed)}
              </div>
            )}

            {status === "error" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-900/90">
                <AlertTriangle className="w-8 h-8 text-amber-400" />
                <p className="text-sm text-slate-200">{error}</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="mt-5 flex items-center justify-center gap-3">
            {status === "ready" && (
              <button
                onClick={handleStartRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold transition-colors"
              >
                <Circle className="w-4 h-4 fill-current" />
                Start Recording
              </button>
            )}

            {status === "recording" && (
              <button
                onClick={handleStopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold transition-colors"
              >
                <Square className="w-4 h-4 fill-current" />
                Stop
              </button>
            )}

            {status === "recorded" && (
              <>
                <button
                  onClick={handleRetake}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Retake
                </button>
                <button
                  onClick={handleUseRecording}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF6B35] hover:bg-[#FF4500] text-white font-bold transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Use This Clip
                </button>
              </>
            )}

            {status === "error" && (
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition-colors"
              >
                Close
              </button>
            )}

            {status === "idle" && (
              <p className="text-sm text-slate-400">Starting camera…</p>
            )}
          </div>

          {(status === "ready" || status === "recording") && (
            <p className="mt-3 text-center text-xs text-slate-400">
              Position yourself in frame and record a short clip of this drill.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
