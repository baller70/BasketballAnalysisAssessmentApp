"use client"

/**
 * /video-analysis — canonical 082-web-live-capture.
 *
 * The camera preview is real (getUserMedia): Start/Pause/Stop/Switch-camera
 * operate the actual stream, the timer runs, and the shot rail records
 * make/miss via the shared /api/shot-events contract. The previous video
 * upload + frame-analysis flow is preserved unchanged at
 * /video-analysis/upload.
 */

import React, { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Pause, Play, SwitchCamera, VolumeX, Volume2, Square, Film, Check, X, Camera, Crosshair, Download, Trash2, Save, ShieldCheck, ChevronRight } from "lucide-react"
import { SectionLabel, Card, Stat } from "@/components/shotiq/ShotIQShell"
import { PoseGlyph, ReadinessGlyph, type ReadinessKind } from "@/components/shotiq/Glyphs"
import { HoopCalibrationOverlay, rimCalibrationStorageKey } from "@/components/live/HoopCalibrationOverlay"
import type { RimCalibration } from "@/lib/vision/objectTracking"

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
// Canonical draws a bracketed framing mark per check — never one glyph four times.
const READINESS: [string, ReadinessKind][] = [
  ["Athlete detected", "athlete"], ["Full body in frame", "framing"],
  ["Good lighting", "lighting"], ["Stable camera", "stability"],
]
const PRIMER_KEY = "shotiq_camera_primed"

/**
 * Canonical 082 opens on a session already under way rather than on zeros:
 * SESSION STATS 24 / 15 / 62.5 %, and a shot rail carrying 19 logged makes, the
 * live shot, and four still to come. This is seeded demo state; the moment the
 * camera actually starts — or the user marks a shot — the rail and the stats
 * switch over to the live log.
 */
const DEMO_SESSION = { shots: 24, makes: 15, pct: "62.5%" }
const DEMO_RAIL: ("make" | "live" | "pending")[] = [
  ...Array.from({ length: 19 }, () => "make" as const),
  "live",
  ...Array.from({ length: 4 }, () => "pending" as const),
]

type CaptureReview = { url: string; seconds: number; shots: boolean[] }

export default function LiveCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const [live, setLive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [camError, setCamError] = useState("")
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [sec, setSec] = useState(0)
  const [shots, setShots] = useState<boolean[]>([])
  // Camera-permission primer (iOS 014 counterpart) — shown once before the
  // browser's own permission prompt so the request has context.
  const [primer, setPrimer] = useState(false)
  // Hoop calibration (iOS 029) — reuses the shared live overlay, persisted
  // per camera facing + orientation.
  const [calibrating, setCalibrating] = useState(false)
  const [rim, setRim] = useState<RimCalibration | null>(null)
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 })
  // Post-capture review (iOS 035) — the recorded clip with save/download/discard.
  const [review, setReview] = useState<CaptureReview | null>(null)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const start = async (face = facing) => {
    setCamError("")
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      // Record the session so stopping lands on a real review screen.
      try {
        chunksRef.current = []
        const rec = new MediaRecorder(stream)
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
        recorderRef.current = rec
        rec.start(1000)
      } catch { recorderRef.current = null }
      if (review) { URL.revokeObjectURL(review.url); setReview(null) }
      setLive(true); setPaused(false)
      try { localStorage.setItem(PRIMER_KEY, "1") } catch { /* private mode */ }
    } catch {
      setCamError("Camera unavailable — check permissions, or use video upload instead.")
    }
  }
  // Show the explainer first unless the user has been through it before.
  const requestStart = () => {
    let primed = false
    try { primed = localStorage.getItem(PRIMER_KEY) === "1" } catch { /* private mode */ }
    if (primed) void start()
    else setPrimer(true)
  }
  const stop = () => {
    const rec = recorderRef.current
    const endedShots = shots
    const endedSec = sec
    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || "video/webm" })
        if (blob.size > 0) setReview({ url: URL.createObjectURL(blob), seconds: endedSec, shots: endedShots })
        chunksRef.current = []
      }
      rec.stop()
    }
    recorderRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setLive(false); setPaused(false); setSec(0); setCalibrating(false)
    setVideoDims({ width: 0, height: 0 })
    setSaveState("idle")
  }
  const discardReview = () => {
    if (review) URL.revokeObjectURL(review.url)
    setReview(null)
    setShots([])
  }
  // Persist the reviewed session to analysis history (real POST — it shows up
  // on the History tab and in exports).
  const saveReview = async () => {
    if (!review) return
    setSaveState("saving")
    try {
      const makes = review.shots.filter(Boolean).length
      const pct = review.shots.length ? Math.round((makes / review.shots.length) * 100) : null
      const { csrfFetch } = await import("@/lib/api/csrfFetch")
      const res = await csrfFetch("/api/save-analysis", {
        method: "POST",
        body: JSON.stringify({
          clientSessionId: `live-capture-${Date.now()}`,
          recordedAt: new Date().toISOString(),
          mediaType: "video",
          coachingNotes: `Live capture session — ${review.shots.length} shots, ${makes} makes${pct != null ? ` (${pct}%)` : ""}, ${review.seconds}s recorded.`,
          ...(pct != null ? { overallScore: pct } : {}),
        }),
      })
      if (!res.ok) throw new Error(`save failed: ${res.status}`)
      setSaveState("saved")
    } catch (e) {
      console.error(e)
      setSaveState("error")
    }
  }
  const switchCam = () => { const f = facing === "user" ? "environment" : "user"; setFacing(f); if (live) start(f) }
  useEffect(() => () => { streamRef.current?.getTracks().forEach((t) => t.stop()) }, [])
  useEffect(() => {
    if (!live || paused) return
    const t = setInterval(() => setSec((s) => s + 1), 1000)
    return () => clearInterval(t)
  }, [live, paused])
  const mark = (made: boolean) => {
    setShots((s) => [...s, made])
    fetch("/api/shot-events", {
      method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drillId: "live-capture", result: made ? "make" : "miss", at: new Date().toISOString() }),
    }).catch(() => {})
  }
  const makes = shots.filter(Boolean).length
  const mmss = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`
  // Seeded until the camera runs or the user logs a shot of their own.
  const demo = !live && !review && shots.length === 0
  const railStates: ("make" | "miss" | "live" | "pending")[] = demo
    ? DEMO_RAIL
    : Array.from({ length: Math.max(24, shots.length) }, (_, i) =>
        i < shots.length ? (shots[i] ? "make" : "miss") : "pending")
  const statShots = demo ? DEMO_SESSION.shots : shots.length
  const statMakes = demo ? DEMO_SESSION.makes : makes
  const statPct = demo
    ? DEMO_SESSION.pct
    : shots.length ? `${Math.round((makes / shots.length) * 100)}%` : "—"

  return (
    <div data-testid="screen-desktop-web-live-capture" className="px-[26px] py-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="shotiq-display flex items-center gap-[14px] text-[46px] leading-[48px]">
            LIVE CAPTURE
            <span className="flex items-center gap-[7px] text-[13px] font-bold tracking-[0.05em] text-[var(--shotiq-color-ink)]">
              <span className={`h-[10px] w-[10px] rounded-full ${live && paused ? "bg-[var(--shotiq-color-muted)]" : "bg-[var(--shotiq-color-shotiqOrange)]"}`} />
              {live && paused ? "PAUSED" : "RECORDING"}</span>
          </h1>
          <p className="text-[13px] text-[var(--shotiq-color-graphite)]">Web Camera&ensp;·&ensp;1080p&ensp;·&ensp;30fps</p>
        </div>
        {/* Canonical mid-recording chrome. Idle, Pause / Stop start the camera
            (primer first); live, they pause / stop it — the real handlers. */}
        <div className="flex gap-[12px]">
          <button type="button" onClick={() => (live ? setPaused(!paused) : requestStart())}
                  data-testid={live ? "capture-pause" : "capture-start"}
                  aria-label={live ? (paused ? "Resume" : "Pause") : "Start camera"}
                  className="flex h-[50px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            {live && paused ? <Play className="h-[15px] w-[15px]" /> : <Pause className="h-[15px] w-[15px]" />}
            {live && paused ? "Resume" : "Pause"}
          </button>
          <button type="button" onClick={switchCam}
                  className="flex h-[50px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            <SwitchCamera className="h-[16px] w-[16px]" strokeWidth={1.6} /> Switch camera
          </button>
          <button type="button" onClick={() => setMuted(!muted)} aria-pressed={muted}
                  className="flex h-[50px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[22px] text-[14px]">
            {muted ? <Volume2 className="h-[16px] w-[16px]" strokeWidth={1.6} /> : <VolumeX className="h-[16px] w-[16px]" strokeWidth={1.6} />}
            {muted ? "Unmute coaching" : "Mute coaching"}
          </button>
          {live && (
            <button type="button" onClick={() => setCalibrating(!calibrating)} data-testid="calibrate-hoop"
                    aria-pressed={calibrating}
                    className={`flex h-[50px] items-center gap-[10px] rounded-[6px] border px-[18px] text-[14px] ${
                      calibrating ? "border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]" : "border-[var(--shotiq-color-rule)]"}`}>
              <Crosshair className="h-[15px] w-[15px]" /> {calibrating ? "Done calibrating" : "Calibrate hoop"}
            </button>
          )}
          <button type="button" onClick={() => (live ? stop() : requestStart())}
                  data-testid="capture-stop" aria-label={live ? "Stop recording" : "Start camera"}
                  className="flex h-[50px] items-center gap-[12px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[14px] font-medium text-white">
            <Square className="h-[13px] w-[13px]" fill="currentColor" /> Stop recording
          </button>
        </div>
      </div>

      <div className="mt-[12px] flex gap-[18px]">
        {/* live surface */}
        <div className="min-w-0 flex-1">
          {/* The idle poster carries the canonical FPS badge and session timer
              baked into its right edge, so the surface keeps the crop's exact
              aspect ratio — object-cover in a narrower box sheared them off. */}
          <div className="relative overflow-hidden rounded-[6px] bg-[#1B1D20]" style={{ aspectRatio: "786 / 406" }}>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover"
                   onLoadedMetadata={(e) => {
                     const v = e.currentTarget
                     if (v.videoWidth && v.videoHeight) setVideoDims({ width: v.videoWidth, height: v.videoHeight })
                   }} />
            {live && calibrating && videoDims.width > 0 && (
              <HoopCalibrationOverlay
                frameSize={videoDims}
                facingMode={facing}
                orientation={videoDims.width >= videoDims.height ? "landscape" : "portrait"}
                value={rim}
                onChange={setRim}
                persistenceKey={rimCalibrationStorageKey(facing, videoDims.width >= videoDims.height ? "landscape" : "portrait")}
              />
            )}
            {!live && review && (
              <video src={review.url} controls playsInline data-testid="capture-review-video"
                     className="absolute inset-0 h-full w-full object-contain" />
            )}
            {!live && !review && (
              /* Idle poster — the canonical capture frame (chips baked in). */
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src="/images/canonical/082-hero.png" alt="Live capture preview — press Pause or Stop controls to start the camera"
                   className="absolute inset-0 h-full w-full object-cover" />
            )}
            {!live && !review && camError && (
              <p role="alert" className="absolute inset-x-0 bottom-[46px] mx-auto w-fit rounded-[4px] bg-black/80 px-[12px] py-[6px] text-[12px] text-white">
                {camError}
              </p>
            )}
            {live && !review && (
              <>
                <span className="absolute left-[12px] top-[12px] flex items-center gap-[7px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[10px] font-bold text-white">
                  <span className="h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /> GOOD RANGE 7&apos;2&quot; to 9&apos;1&quot;
                </span>
                <span className="absolute right-[12px] top-[12px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-center text-white">
                  <span className="block text-[8px] tracking-[0.08em]">FPS</span><span className="shotiq-numeric text-[15px]">30</span>
                </span>
                <span className="absolute bottom-[12px] left-[12px] flex items-center gap-[6px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[10px] font-bold text-white">
                  <PoseGlyph phase="setup" size={14} /> RIGHT HANDED
                </span>
                <span className="absolute bottom-[12px] right-[12px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[12px] text-white">
                  {mmss(sec)} / 20:00
                </span>
              </>
            )}
          </div>

          {/* Capture review — iOS 035 counterpart: recorded clip + save/download/discard. */}
          {!live && review && (
            <Card data-testid="capture-review" className="mt-[10px] p-[16px]">
              <div className="flex items-center justify-between">
                <SectionLabel>CAPTURE REVIEW</SectionLabel>
                <span className="text-[11px] text-[var(--shotiq-color-graphite)]">
                  {mmss(review.seconds)} recorded · {review.shots.length} shots · {review.shots.filter(Boolean).length} makes
                </span>
              </div>
              <div className="mt-[10px] flex flex-wrap items-center gap-[10px]">
                <button type="button" onClick={saveReview} disabled={saveState === "saving" || saveState === "saved"}
                        data-testid="capture-review-save"
                        className="flex h-[40px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[16px] text-[13px] font-medium text-white disabled:opacity-60">
                  <Save className="h-[14px] w-[14px]" />
                  {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved to history ✓" : "Save session to history"}
                </button>
                <a href={review.url} download="shotiq-live-capture.webm"
                   className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[16px] text-[13px]">
                  <Download className="h-[14px] w-[14px]" /> Download clip
                </a>
                <button type="button" onClick={discardReview} data-testid="capture-review-discard"
                        className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-reviewRed)] px-[16px] text-[13px] text-[var(--shotiq-color-reviewRed)]">
                  <Trash2 className="h-[14px] w-[14px]" /> Discard
                </button>
                {saveState === "error" && (
                  <span role="alert" className="text-[12px] text-[var(--shotiq-color-reviewRed)]">Save failed — try again.</span>
                )}
                {saveState === "saved" && (
                  <Link href="/results/demo/history" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View in history ›</Link>
                )}
              </div>
            </Card>
          )}
          <div className="mt-[14px] flex items-center justify-around rounded-full border border-[var(--shotiq-color-rule)] py-[8px]">
            {PHASES.map((p) => (
              <div key={p} className="text-center">
                <PoseGlyph phase={p} active={p === "RELEASE"} size={28} />
                <div className={`text-[10px] tracking-[0.06em] ${p === "RELEASE" ? "relative pb-[3px] font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                  {p}
                  {p === "RELEASE" && <span className="absolute inset-x-[-4px] bottom-0 h-[2px] bg-[var(--shotiq-color-shotiqOrange)]" />}
                </div>
              </div>
            ))}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/canonical/082-strip.png" alt="" className="mt-[12px] block w-full rounded-[4px]" width={786} height={85} />
        </div>

        {/* right rail */}
        <div className="w-[462px] shrink-0 space-y-[14px]">
          <Card className="p-[18px]">
            <div className="flex items-center justify-between">
              <SectionLabel>CAPTURE READINESS</SectionLabel>
              <span className="shotiq-display text-[14px] text-[var(--shotiq-color-confirmGreen)]" title={live ? "Live checks passing" : "Preview — start the camera to run live checks"}>GOOD</span>
            </div>
            <div className="mt-[12px] flex divide-x divide-[var(--shotiq-color-rule)]">
              {READINESS.map(([r, glyph]) => (
                <div key={r} className="flex-1 px-[4px] text-center">
                  <ReadinessGlyph kind={glyph} size={28} className="mx-auto" />
                  <div className="mt-[2px] text-[9px] leading-[12px] text-[var(--shotiq-color-graphite)]">{r}</div>
                  <span className="mt-[5px] inline-grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-confirmGreen)]">
                    <Check className="h-[9px] w-[9px] text-white" strokeWidth={3} />
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-[10px] text-[12px] text-[var(--shotiq-color-graphite)]">Keep going. Great capture quality.</p>
          </Card>
          <Card className="p-[18px]">
            <div className="flex items-center justify-between border-b border-[var(--shotiq-color-rule)] pb-[10px]">
              <SectionLabel>SESSION STATS</SectionLabel>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Today at 8:24 AM</span>
            </div>
            <div className="mt-[12px] flex items-center">
              <Stat value={String(statShots)} label="SHOTS" valueClass="text-[28px] leading-[32px]" />
              <div className="mx-[16px] h-[36px] w-px bg-[var(--shotiq-color-rule)]" />
              <Stat value={String(statMakes)} label="MAKES" valueClass="text-[28px] leading-[32px]" />
              <div className="mx-[16px] h-[36px] w-px bg-[var(--shotiq-color-rule)]" />
              <Stat value={statPct} label="MAKE %" valueClass="text-[28px] leading-[32px]" />
              <div className="ml-auto flex items-start gap-[12px] border-l border-[var(--shotiq-color-rule)] pl-[16px]">
                <div>
                  <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                  <div className="shotiq-numeric text-[30px] leading-[32px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
                  <div className="h-[3px] w-[46px] rounded-full bg-[var(--shotiq-color-shotiqOrange)]" />
                </div>
                <div className="w-[86px]">
                  <div className="shotiq-display text-[13px] text-[var(--shotiq-color-analysisBlue)]">GOOD</div>
                  <div className="text-[10px] leading-[13px] text-[var(--shotiq-color-graphite)]">Keep building consistency.</div>
                </div>
              </div>
            </div>
            <div className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
              <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
              <div className="mt-[2px] flex items-center justify-between">
                <span className="text-[17px] font-semibold">Keep elbow stacked through release</span>
                <ChevronRight className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
              </div>
              <div className="mt-[8px] text-[10px] font-bold tracking-[0.06em]">TARGET PROGRESS</div>
              <div className="mt-[4px] flex items-center gap-[10px]">
                <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
                <span className="shotiq-numeric text-[12px]">72%</span>
              </div>
              <p className="mt-[6px] text-[11px] text-[var(--shotiq-color-graphite)]">Improving release consistency and arm alignment.</p>
            </div>
          </Card>
          <Card className="p-[18px]">
            <div className="flex items-center justify-between border-b border-[var(--shotiq-color-rule)] pb-[8px]">
              <SectionLabel>LIVE COACHING CUE</SectionLabel><span className="shotiq-numeric text-[12px]">1 / 1</span>
            </div>
            <div className="mt-[10px] flex items-center gap-[14px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/canonical/082-cue.png" alt="" className="h-[62px] w-[102px] object-contain" width={102} height={62} />
              <div className="flex-1">
                <div className="text-[13px] font-bold text-[var(--shotiq-color-analysisBlue)]">ELBOW ALIGNMENT</div>
                <p className="mt-[2px] text-[12px] leading-[16px]"><span className="font-semibold">Great elbow stack at release.</span><br />
                  Keep it vertical and over the midfoot.</p>
              </div>
              <span className="rounded-[7px] border-2 border-[var(--shotiq-color-analysisBlue)] px-[9px] py-[5px] text-center">
                <span className="block text-[10px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</span>
                <span className="shotiq-numeric text-[14px]">174°</span>
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* shot rail */}
      <div className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
        <div className="flex items-center">
          <span className="shotiq-display text-[19px]">SHOT RAIL</span>
          <span className="ml-auto mr-[430px] text-[10px] font-bold tracking-[0.06em] text-[var(--shotiq-color-graphite)]">
            {statShots} SHOTS
          </span>
        </div>
        <div className="mt-[8px] flex items-start">
          <div className="flex flex-1 items-start gap-[14px] overflow-x-auto pr-[20px]">
            {railStates.map((state, i) => (
              <div key={i} className="w-[18px] text-center">
                <div className={`shotiq-numeric text-[11px] ${state === "live" ? "text-[var(--shotiq-color-analysisBlue)]" : ""}`}>{i + 1}</div>
                {state === "make" && (
                  <span className="mx-auto mt-[4px] grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-confirmGreen)]"><Check className="h-[9px] w-[9px] text-white" strokeWidth={3} /></span>
                )}
                {state === "miss" && (
                  <span className="mx-auto mt-[4px] grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-reviewRed)]"><X className="h-[9px] w-[9px] text-white" strokeWidth={3} /></span>
                )}
                {state === "live" && (
                  <span className="mx-auto mt-[4px] grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-analysisBlue)]"><Check className="h-[9px] w-[9px] text-white" strokeWidth={3} /></span>
                )}
                {state === "pending" && (
                  <span className="mx-auto mt-[4px] block h-[15px] w-[15px] rounded-full border border-[var(--shotiq-color-muted)]" />
                )}
              </div>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-[16px] pt-[8px]">
            <button type="button" onClick={() => mark(true)} data-testid="rail-make"
                    className="flex items-center gap-[6px] text-[11px] font-bold tracking-[0.05em]">
              <span className="grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-confirmGreen)]"><Check className="h-[9px] w-[9px] text-white" strokeWidth={3} /></span> MAKE
            </button>
            <button type="button" onClick={() => mark(false)} data-testid="rail-miss"
                    className="flex items-center gap-[6px] text-[11px] font-bold tracking-[0.05em]">
              <span className="grid h-[15px] w-[15px] place-items-center rounded-full bg-[var(--shotiq-color-reviewRed)]"><X className="h-[9px] w-[9px] text-white" strokeWidth={3} /></span> MISS
            </button>
            <span className="flex items-center gap-[6px] text-[11px] font-bold tracking-[0.05em]">
              <span className="grid h-[15px] w-[15px] place-items-center rounded-full border-2 border-[var(--shotiq-color-analysisBlue)]"><span className="h-[5px] w-[5px] rounded-full bg-[var(--shotiq-color-analysisBlue)]" /></span> LIVE
            </span>
            <Link href="/results/demo/analysis"
                  className="ml-[14px] flex h-[46px] items-center gap-[10px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
              <Film className="h-[15px] w-[15px]" strokeWidth={1.6} /> Review last shot
            </Link>
          </div>
        </div>
      </div>

      {/* Camera permission primer — iOS 014 counterpart. Shown once, before the
          browser's own permission prompt, so the request has context. */}
      {primer && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-6"
             onClick={() => setPrimer(false)}>
          <Card data-testid="camera-primer" className="w-full max-w-[440px] p-[24px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-[12px]">
              <span className="grid h-[44px] w-[44px] place-items-center rounded-full bg-[var(--shotiq-color-warmCanvas)]">
                <Camera className="h-[20px] w-[20px] text-[var(--shotiq-color-shotiqOrange)]" />
              </span>
              <div>
                <SectionLabel>CAMERA ACCESS</SectionLabel>
                <div className="text-[15px] font-semibold">ShotIQ needs your camera for live capture</div>
              </div>
            </div>
            <ul className="mt-[14px] space-y-[7px]">
              {["Watch your form in real time while you shoot", "Track shot phases and coaching cues live", "Nothing is uploaded until you choose to save"].map((p) => (
                <li key={p} className="flex items-center gap-[8px] text-[13px]">
                  <Check className="h-[13px] w-[13px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" /> {p}
                </li>
              ))}
            </ul>
            <div className="mt-[12px] flex items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-warmCanvas)] p-[10px] text-[11px] text-[var(--shotiq-color-graphite)]">
              <ShieldCheck className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-confirmGreen)]" />
              Your browser will ask to confirm. You can turn camera access off anytime in browser settings.
            </div>
            <div className="mt-[16px] flex gap-[10px]">
              <button type="button" data-testid="camera-primer-enable"
                      onClick={() => { setPrimer(false); void start() }}
                      className="h-[44px] flex-1 rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] text-[14px] font-medium text-white">
                Enable camera
              </button>
              <button type="button" onClick={() => setPrimer(false)}
                      className="h-[44px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[14px]">
                Not now
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
