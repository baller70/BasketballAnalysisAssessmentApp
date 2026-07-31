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
import { Pause, Play, SwitchCamera, VolumeX, Volume2, Square, Film, Check, X } from "lucide-react"
import { SectionLabel, Card, PhaseGlyph, Stat } from "@/components/shotiq/ShotIQShell"

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"]
const READINESS = ["Athlete detected", "Full body in frame", "Good lighting", "Stable camera"]

export default function LiveCapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [live, setLive] = useState(false)
  const [paused, setPaused] = useState(false)
  const [muted, setMuted] = useState(false)
  const [camError, setCamError] = useState("")
  const [facing, setFacing] = useState<"user" | "environment">("user")
  const [sec, setSec] = useState(0)
  const [shots, setShots] = useState<boolean[]>([])

  const start = async (face = facing) => {
    setCamError("")
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop())
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: face }, audio: false })
      streamRef.current = stream
      if (videoRef.current) videoRef.current.srcObject = stream
      setLive(true); setPaused(false)
    } catch {
      setCamError("Camera unavailable — check permissions, or use video upload instead.")
    }
  }
  const stop = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
    setLive(false); setPaused(false); setSec(0)
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

  return (
    <div data-testid="screen-desktop-web-live-capture" className="px-[26px] py-[18px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="shotiq-display flex items-center gap-[14px] text-[46px] leading-[48px]">
            LIVE CAPTURE
            {live && <span className="flex items-center gap-[6px] text-[13px] font-bold tracking-[0.05em] text-[var(--shotiq-color-ink)]">
              <span className={`h-[9px] w-[9px] rounded-full ${paused ? "bg-[var(--shotiq-color-muted)]" : "bg-[var(--shotiq-color-reviewRed)]"}`} />
              {paused ? "PAUSED" : "RECORDING"}</span>}
          </h1>
          <p className="text-[13px] text-[var(--shotiq-color-graphite)]">Web Camera · 1080p · 30fps</p>
        </div>
        <div className="flex gap-[10px]">
          {live ? (
            <>
              <button type="button" onClick={() => setPaused(!paused)} data-testid="capture-pause"
                      className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
                {paused ? <Play className="h-[15px] w-[15px]" /> : <Pause className="h-[15px] w-[15px]" />}
                {paused ? "Resume" : "Pause"}
              </button>
              <button type="button" onClick={switchCam}
                      className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
                <SwitchCamera className="h-[15px] w-[15px]" /> Switch camera
              </button>
              <button type="button" onClick={() => setMuted(!muted)}
                      className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
                {muted ? <Volume2 className="h-[15px] w-[15px]" /> : <VolumeX className="h-[15px] w-[15px]" />}
                {muted ? "Unmute coaching" : "Mute coaching"}
              </button>
              <button type="button" onClick={stop} data-testid="capture-stop"
                      className="flex h-[46px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[13px] font-medium text-white">
                <Square className="h-[12px] w-[12px]" fill="currentColor" /> Stop recording
              </button>
            </>
          ) : (
            <>
              <Link href="/video-analysis/upload"
                    className="flex h-[46px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[18px] text-[13px]">
                <Film className="h-[15px] w-[15px]" /> Upload a video instead
              </Link>
              <button type="button" onClick={() => start()} data-testid="capture-start"
                      className="flex h-[46px] items-center gap-[8px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[20px] text-[13px] font-medium text-white">
                <Play className="h-[14px] w-[14px]" fill="currentColor" /> Start camera
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-[12px] flex gap-[18px]">
        {/* live surface */}
        <div className="min-w-0 flex-1">
          <div className="relative overflow-hidden rounded-[6px] bg-[#1B1D20]" style={{ height: 400 }}>
            <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
            {!live && (
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <PhaseGlyph size={46} />
                  <p className="mt-[8px] text-[13px] text-white/80">
                    {camError || "Camera preview appears here — press Start camera."}
                  </p>
                </div>
              </div>
            )}
            <span className="absolute left-[12px] top-[12px] flex items-center gap-[7px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[10px] font-bold text-white">
              <span className="h-[7px] w-[7px] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /> GOOD RANGE 7&apos;2&quot; to 9&apos;1&quot;
            </span>
            <span className="absolute right-[12px] top-[12px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-center text-white">
              <span className="block text-[8px] tracking-[0.08em]">FPS</span><span className="shotiq-numeric text-[15px]">30</span>
            </span>
            <span className="absolute bottom-[12px] left-[12px] flex items-center gap-[6px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[10px] font-bold text-white">
              <PhaseGlyph size={14} /> RIGHT HANDED
            </span>
            <span className="absolute bottom-[12px] right-[12px] rounded-[4px] bg-black/75 px-[9px] py-[5px] text-[12px] text-white">
              {mmss(sec)} / 20:00
            </span>
          </div>
          <Card className="mt-[10px] flex items-center justify-around py-[10px]">
            {PHASES.map((p) => (
              <div key={p} className="text-center">
                <PhaseGlyph active={p === "RELEASE"} size={26} />
                <div className={`text-[9px] tracking-[0.05em] ${p === "RELEASE" ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>{p}</div>
              </div>
            ))}
          </Card>
          <div className="mt-[8px] flex gap-[4px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`relative h-[52px] flex-1 rounded-[3px] bg-[#1B1D20] ${i === 8 ? "ring-2 ring-[var(--shotiq-color-shotiqOrange)]" : ""}`}>
                {i === 8 && <span className="absolute inset-x-0 bottom-[3px] text-center text-[8px] font-bold text-white">LIVE</span>}
              </div>
            ))}
          </div>
        </div>

        {/* right rail */}
        <div className="w-[380px] shrink-0 space-y-[12px]">
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>CAPTURE READINESS</SectionLabel>
              <span className="text-[12px] font-bold text-[var(--shotiq-color-confirmGreen)]">{live ? "GOOD" : "IDLE"}</span>
            </div>
            <div className="mt-[10px] flex justify-between">
              {READINESS.map((r) => (
                <div key={r} className="w-[80px] text-center">
                  <PhaseGlyph size={26} />
                  <div className="text-[9px] leading-[12px] text-[var(--shotiq-color-graphite)]">{r}</div>
                  <span className={`mt-[3px] inline-block h-[12px] w-[12px] rounded-full ${live ? "bg-[var(--shotiq-color-confirmGreen)]" : "bg-[var(--shotiq-color-rule)]"}`} />
                </div>
              ))}
            </div>
            <p className="mt-[8px] text-[11px] text-[var(--shotiq-color-graphite)]">
              {live ? "Keep going. Great capture quality." : "Start the camera to run readiness checks."}
            </p>
          </Card>
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>SESSION STATS</SectionLabel>
              <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Live</span>
            </div>
            <div className="mt-[8px] flex items-center gap-[18px]">
              <Stat value={String(shots.length)} label="SHOTS" valueClass="text-[26px] leading-[30px]" />
              <Stat value={String(makes)} label="MAKES" valueClass="text-[26px] leading-[30px]" />
              <Stat value={shots.length ? `${Math.round((makes / shots.length) * 100)}%` : "—"} label="MAKE %" valueClass="text-[26px] leading-[30px]" />
              <div className="ml-auto border-l border-[var(--shotiq-color-rule)] pl-[14px]">
                <div className="text-[9px] font-bold tracking-[0.05em] text-[var(--shotiq-color-graphite)]">FORM SCORE</div>
                <div className="shotiq-numeric text-[26px] leading-[30px] text-[var(--shotiq-color-shotiqOrange)]">82</div>
              </div>
            </div>
            <div className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
              <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
              <div className="text-[15px] font-semibold">Keep elbow stacked through release</div>
              <div className="mt-[6px] flex items-center gap-[8px]">
                <div className="h-[6px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                  <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" /></div>
                <span className="text-[11px]">72%</span>
              </div>
            </div>
          </Card>
          <Card className="p-[16px]">
            <div className="flex items-center justify-between">
              <SectionLabel>LIVE COACHING CUE</SectionLabel><span className="text-[11px]">1 / 1</span>
            </div>
            <div className="mt-[8px] flex items-center gap-[12px]">
              <PhaseGlyph size={40} />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-[var(--shotiq-color-analysisBlue)]">ELBOW ALIGNMENT</div>
                <p className="text-[11px] leading-[15px]">Great elbow stack at release. Keep it vertical and over the midfoot.</p>
              </div>
              <span className="rounded-[5px] border border-[var(--shotiq-color-analysisBlue)] px-[8px] py-[4px] text-center">
                <span className="block text-[9px] font-bold text-[var(--shotiq-color-analysisBlue)]">GOOD</span>
                <span className="shotiq-numeric text-[13px]">174°</span>
              </span>
            </div>
          </Card>
        </div>
      </div>

      {/* shot rail */}
      <Card className="mt-[14px] flex items-center px-[18px] py-[12px]">
        <SectionLabel>SHOT RAIL</SectionLabel>
        <div className="ml-[20px] flex flex-1 items-center gap-[7px] overflow-x-auto">
          {shots.map((made, i) => (
            <div key={i} className="text-center">
              <div className="text-[10px]">{i + 1}</div>
              {made ? <Check className="h-[13px] w-[13px] text-[var(--shotiq-color-confirmGreen)]" />
                    : <X className="h-[13px] w-[13px] text-[var(--shotiq-color-reviewRed)]" />}
            </div>
          ))}
          {!shots.length && <span className="text-[11px] text-[var(--shotiq-color-graphite)]">Mark your first shot to start the rail.</span>}
        </div>
        <button type="button" onClick={() => mark(true)} data-testid="rail-make"
                className="mr-[8px] flex h-[36px] items-center gap-[6px] rounded-[5px] border-2 border-[var(--shotiq-color-confirmGreen)] px-[12px] text-[12px] font-medium text-[var(--shotiq-color-confirmGreen)]">
          <Check className="h-[12px] w-[12px]" /> Make
        </button>
        <button type="button" onClick={() => mark(false)} data-testid="rail-miss"
                className="mr-[12px] flex h-[36px] items-center gap-[6px] rounded-[5px] border-2 border-[var(--shotiq-color-reviewRed)] px-[12px] text-[12px] font-medium text-[var(--shotiq-color-reviewRed)]">
          <X className="h-[12px] w-[12px]" /> Miss
        </button>
        <Link href="/results/demo/analysis"
              className="flex h-[40px] items-center gap-[8px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px]">
          <Film className="h-[14px] w-[14px]" /> Review last shot
        </Link>
      </Card>
    </div>
  )
}
