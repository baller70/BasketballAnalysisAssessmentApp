"use client"

/**
 * /analyze — canonical ShotIQ upload workspace (desktop screen
 * 081-web-analyze-workspace).
 *
 * Preserved domain behaviour from the previous implementation:
 *   - image analysis still runs through <PoseAnalysis/> (MediaPipe) with the
 *     analysisStore fallback for files handed over from /upload;
 *   - videos are enqueued into the resumable IndexedDB upload queue
 *     (`enqueueVideoUpload`), processed by the global <UploadQueueManager/>.
 * Only the presentation was replaced with the canonical white workspace.
 */

import React, { useCallback, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Image as ImageIcon, Film, Upload, FolderUp, ChevronRight, HelpCircle,
  ArrowLeft, LayoutGrid, History, GitCompare, Crosshair, BookOpen, PlayCircle,
  ScanLine,
} from "lucide-react"
import { PoseAnalysis } from "@/components/analysis/PoseAnalysis"
import { useAnalysisStore } from "@/stores/analysisStore"
import { enqueueVideoUpload, uploadQueueStorage } from "@/lib/upload/uploadQueue"
import {
  ShotIQShell, WideSidebar, TrendLine, SectionLabel, Card, Stat,
} from "@/components/shotiq/ShotIQShell"
import {
  useHistory, scoreSeries, sessionDelta, formatDelta, FormScoreCell, formatMakePct,
} from "@/components/shotiq/ResultsBits"

const ACCEPT = ".mp4,.mov,.hevc,.jpg,.jpeg,.png"
const isVideo = (f: File) => /video|\.mp4$|\.mov$|\.hevc$/i.test(`${f.type} ${f.name}`)

// Pre-flight checks and filming advice each get their own bespoke mark, the way
// canonical draws them — no generic icon does duty for two different ideas.
// The eight marks are cropped out of canonical 081.
const CHECKS: [string, string, string][] = [
  ["Resolution", "Minimum 720p recommended", "081-quality-resolution"],
  ["Lighting", "Well-lit subject and background", "081-quality-lighting"],
  ["Frame rate", "30–60 FPS recommended", "081-quality-framerate"],
  ["Stability", "Minimize camera shake", "081-quality-stability"],
]
const FILMING: [string, string, string][] = [
  ["Full body in frame", "From feet to above head", "081-filming-fullbody"],
  ["Side angle", "Camera perpendicular to shooter", "081-filming-sideangle"],
  ["Neutral background", "Avoid clutter and distractions", "081-filming-background"],
  ["Good lighting", "Even light on player and ball", "081-filming-light"],
]

export default function AnalyzeWorkspacePage() {
  const router = useRouter()
  const { items, score, shots, makes } = useHistory()
  const trend = scoreSeries(items, 6)
  const delta = sessionDelta(items)
  const { uploadedFile, uploadedImageBase64 } = useAnalysisStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [analysisImage, setAnalysisImage] = useState<File | null>(null)

  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)])
    setNotice("")
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const totalBytes = files.reduce((s, f) => s + f.size, 0)
  const fmtBytes = (n: number) =>
    n >= 1e9 ? `${(n / 1e9).toFixed(2)} GB` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} KB` : `${n} B`

  const analyzeSelected = async () => {
    if (!files.length || busy) return
    setBusy(true)
    try {
      const sessionId = `analyze-${Date.now()}`
      const videos = files.filter(isVideo)
      const images = files.filter((f) => !isVideo(f))
      for (const v of videos) {
        await enqueueVideoUpload(uploadQueueStorage, {
          blob: v, clientSessionId: sessionId, fileName: v.name,
        })
      }
      if (images.length) {
        // Preserved: image analysis runs in-page through PoseAnalysis.
        setAnalysisImage(images[0])
        setBusy(false)
        return
      }
      router.push("/video-analysis")
    } catch {
      setNotice("Could not queue files — please retry.")
      setBusy(false)
    }
  }

  // Preserved handoff: /upload can stage a file in the analysis store.
  const imageToAnalyze = analysisImage || uploadedFile
  const imageBase64 = analysisImage ? undefined : uploadedImageBase64 ?? undefined

  if (imageToAnalyze && analysisImage !== null) {
    return (
      <ShotIQShell active="Analyze">
        <div className="px-[28px] pt-[20px]">
          <button type="button" onClick={() => setAnalysisImage(null)}
                  className="mb-[14px] flex items-center gap-[8px] text-[13px] text-[var(--shotiq-color-graphite)]">
            <ArrowLeft className="h-[15px] w-[15px]" /> Back to upload
          </button>
          <PoseAnalysis imageFile={imageToAnalyze} imageBase64={imageBase64} />
        </div>
      </ShotIQShell>
    )
  }

  return (
    <ShotIQShell active="Analyze"
      sidebar={<WideSidebar sections={[
        { heading: "ANALYZE", items: [
          { label: "Overview", href: "/results/demo/analysis", icon: LayoutGrid },
          { label: "Upload", href: "/analyze", icon: Upload, active: true },
          { label: "History", href: "/results/demo/history", icon: History },
          { label: "Compare", href: "/results/demo/compare", icon: GitCompare },
        ]},
        { heading: "FOCUS", items: [
          { label: "Coaching Targets", href: "/results/demo/goals", icon: Crosshair },
        ]},
        { heading: "RESOURCES", items: [
          { label: "Capture Guide", href: "/guide", icon: BookOpen },
          { label: "Shooting Tips", href: "/guide", icon: PlayCircle },
        ]},
      ]} />}>
      <div data-testid="screen-desktop-web-analyze-workspace" className="flex min-h-full flex-col px-[28px] pt-[16px]">
        <div className="flex">
          <div className="min-w-0 flex-1 pr-[26px]">
            <h1 className="shotiq-display text-[50px] leading-[52px]">UPLOAD &amp; ANALYZE</h1>
            <p className="mt-[6px] text-[14px] text-[var(--shotiq-color-graphite)]">
              Add your footage to get AI-powered shooting analysis.
            </p>

            {/* source cards */}
            <div className="mt-[20px] grid grid-cols-4 gap-[16px]">
              <button type="button" data-testid="choose-media"
                      onClick={() => { if (inputRef.current) { inputRef.current.accept = ACCEPT; inputRef.current.click() } }}
                      className="flex h-[132px] flex-col items-center justify-center gap-[12px] rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]">
                <FolderUp className="h-[34px] w-[34px]" strokeWidth={1.4} />
                <span className="text-[14px] font-medium">Choose media</span>
              </button>
              {[["Upload image", ImageIcon, () => {
                  if (inputRef.current) { inputRef.current.accept = "image/*"; inputRef.current.click() }
                }],
                ["Upload video", Film, () => {
                  if (inputRef.current) { inputRef.current.accept = "video/*"; inputRef.current.click() }
                }],
                ["Live camera", ScanLine, () => router.push("/video-analysis")]].map(([t, I, fn]) => {
                const Icon = I as typeof ImageIcon
                return (
                  <button key={String(t)} type="button" onClick={fn as () => void}
                          className="flex h-[132px] flex-col items-center justify-center gap-[12px] rounded-[8px] border border-[var(--shotiq-color-rule)]">
                    <Icon className="h-[32px] w-[32px]" strokeWidth={1.3} />
                    <span className="text-[14px]">{String(t)}</span>
                  </button>
                )
              })}
            </div>

            {/* drop zone */}
            <div
              data-testid="drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`mt-[16px] flex h-[160px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed ${dragOver ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]" : "border-[var(--shotiq-color-rule)]"}`}
            >
              <Upload className="h-[26px] w-[26px]" strokeWidth={1.5} />
              <div className="mt-[10px] text-[16px] font-semibold">Drag and drop your files here</div>
              <div className="mt-[4px] text-[13px] text-[var(--shotiq-color-graphite)]">
                or browse to choose media from your device.
              </div>
              <div className="mt-[10px] text-[12px] text-[var(--shotiq-color-graphite)]">
                Supports MP4, MOV, HEVC, JPG, PNG&nbsp;&nbsp;·&nbsp;&nbsp;Max 10GB per file
              </div>
              <input ref={inputRef} type="file" multiple accept={ACCEPT} className="hidden"
                     data-testid="file-input"
                     onChange={(e) => addFiles(e.target.files)} />
            </div>
          </div>

          {/* player summary */}
          <aside className="w-[392px] shrink-0">
            <div className="flex justify-end">
              <Link href="/guide" className="flex items-center gap-[6px] text-[13px] text-[var(--shotiq-color-analysisBlue)]">
                <HelpCircle className="h-[15px] w-[15px]" /> How it works
              </Link>
            </div>
            <Card className="mt-[12px] px-[20px] py-[18px]">
              <SectionLabel>PLAYER SUMMARY</SectionLabel>
              <div className="mt-[12px] flex items-center gap-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/081-player-headshot.png" alt=""
                     className="h-[84px] w-[76px] shrink-0 rounded-[4px] object-cover" />
                <div>
                  <div className="text-[16px] font-bold tracking-[0.02em]">JORDAN ELLIS</div>
                  <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Right Hand · Advanced</div>
                  <Link href="/profile" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View profile</Link>
                </div>
              </div>
              <div className="mt-[16px] flex divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
                {/* The one shared form-score module (see FormScoreCell): the bar
                    used to stretch the whole cell instead of sitting under the
                    numeral. */}
                <FormScoreCell score={score} size={44} className="flex-1 pr-[14px]" />
                <div className="flex-1 pl-[14px]">
                  <SectionLabel>PRIMARY TARGET</SectionLabel>
                  <div className="mt-[4px] flex items-start justify-between">
                    <p className="text-[14px] font-semibold leading-[19px]">Keep elbow stacked<br />through release</p>
                    <ChevronRight className="h-[15px] w-[15px] text-[var(--shotiq-color-graphite)]" />
                  </div>
                  <span className="mt-[8px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[6px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
                  <div className="mt-[8px] flex items-center gap-[8px]">
                    <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                      <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
                    </div>
                    <span className="text-[11px]">72%</span>
                  </div>
                </div>
              </div>
              <div className="mt-[14px] border-t border-[var(--shotiq-color-rule)] pt-[12px]">
                <SectionLabel>LATEST SESSION</SectionLabel>
                {/* Hairline-ruled and spread across the card, as canonical draws
                    it; the trend plots the real score history. */}
                <div className="mt-[8px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
                  <div className="flex-1 pr-[12px]"><Stat value={shots ?? "—"} label="SHOTS" valueClass="text-[20px] leading-[24px]" /></div>
                  <div className="flex-1 px-[12px]"><Stat value={makes ?? "—"} label="MAKES" valueClass="text-[20px] leading-[24px]" /></div>
                  <div className="flex-1 px-[12px]"><Stat value={formatMakePct(shots, makes)} label="MAKE %" valueClass="text-[20px] leading-[24px]" /></div>
                  <div className="shrink-0 pl-[12px] text-right">
                    <TrendLine points={trend} width={84} height={30} />
                    <div className={`text-[10px] ${delta != null && delta < 0 ? "text-[var(--shotiq-color-reviewRed)]" : "text-[var(--shotiq-color-confirmGreen)]"}`}>
                      {formatDelta(delta)} vs last session
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </div>

        {/* Queue and checks are one bordered container split by an internal
            hairline — canonical never gutters these two apart. */}
        <div className="mt-[14px] flex gap-[16px]">
          <Card className="flex w-[600px] shrink-0 divide-x divide-[var(--shotiq-color-rule)]">
            <div className="w-[318px] shrink-0 px-[18px] py-[16px]">
              <SectionLabel>UPLOAD QUEUE ({files.length})</SectionLabel>
              <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">
                Files you add will appear here. You can add more or start analysis.
              </p>
              {files.length === 0 ? (
                <div className="mt-[14px] flex h-[150px] flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-rule)]">
                  <TrendLine points={[3, 1.6, 2.4, 4]} width={70} height={30}
                             stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                  <div className="mt-[8px] text-[15px] font-semibold">No media added yet</div>
                  <div className="mt-[3px] text-[12px] text-[var(--shotiq-color-graphite)]">
                    Choose media or drag files above to get started.
                  </div>
                </div>
              ) : (
                <ul className="mt-[14px] max-h-[150px] divide-y divide-[var(--shotiq-color-rule)] overflow-auto" data-testid="upload-queue-list">
                  {files.map((f, i) => (
                    <li key={`${f.name}-${i}`} className="flex items-center justify-between py-[8px] text-[13px]">
                      <span className="truncate pr-[10px]">{f.name}</span>
                      <span className="shrink-0 text-[11px] text-[var(--shotiq-color-graphite)]">{fmtBytes(f.size)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="min-w-0 flex-1 px-[20px] py-[16px]">
              <SectionLabel>QUALITY CHECKS</SectionLabel>
              <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">We&apos;ll run these checks before analysis.</p>
              <ul className="mt-[10px] divide-y divide-[var(--shotiq-color-rule)]">
                {CHECKS.map(([t, d, kind]) => (
                  <li key={t} className="flex items-center gap-[12px] py-[8px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/canonical/${kind}.png`} alt="" aria-hidden="true"
                         className="block h-[26px] w-[38px] max-w-none shrink-0 object-contain" />
                    <div>
                      <div className="whitespace-nowrap text-[13px] font-semibold">{t}</div>
                      <div className="whitespace-nowrap text-[11px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card className="flex min-w-0 flex-1 gap-[14px] px-[18px] py-[12px]">
            <div className="min-w-0 flex-1">
              <SectionLabel>FILMING GUIDE</SectionLabel>
              <p className="mt-[4px] whitespace-nowrap text-[12px] text-[var(--shotiq-color-graphite)]">Capture your best reps with these tips.</p>
              <ul className="mt-[10px] divide-y divide-[var(--shotiq-color-rule)]">
                {FILMING.map(([t, d, kind]) => (
                  <li key={t} className="flex items-center gap-[12px] py-[7px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/images/canonical/${kind}.png`} alt="" aria-hidden="true"
                         className="block h-[28px] w-[30px] max-w-none shrink-0 object-contain" />
                    <div>
                      <div className="whitespace-nowrap text-[13px] font-semibold leading-[17px]">{t}</div>
                      <div className="whitespace-nowrap text-[11px] leading-[15px] text-[var(--shotiq-color-graphite)]">{d}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            {/* Exact photo cropped from the canonical screen (081, x1156 y538 244x248);
                the white framing corners are baked into the crop. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/canonical/081-filming-guide.png" alt="Well-framed capture example"
                 className="h-[218px] w-[214px] shrink-0 self-center rounded-[4px] object-cover" />
          </Card>
        </div>

        {/* footer bar */}
        <div className="mt-auto flex items-center justify-between border-t border-[var(--shotiq-color-rule)] py-[12px]">
          <div>
            <div className="text-[14px]">{files.length} file{files.length === 1 ? "" : "s"} selected</div>
            <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Total size: {fmtBytes(totalBytes)}</div>
          </div>
          <p className="text-[13px] text-[var(--shotiq-color-graphite)]">
            By uploading, you agree to our <span className="text-[var(--shotiq-color-analysisBlue)]">Terms of Use</span> and{" "}
            <span className="text-[var(--shotiq-color-analysisBlue)]">Privacy Policy</span>.
            {notice && <span className="ml-[10px] text-[var(--shotiq-color-reviewRed)]">{notice}</span>}
          </p>
          {/* Canonical paints this button at full strength with an empty queue —
              dimming it to 60% made the primary action read as broken. */}
          <button type="button" onClick={analyzeSelected} disabled={!files.length || busy}
                  data-testid="analyze-selected"
                  className="flex h-[54px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] px-[30px] text-[15px] font-medium text-white disabled:cursor-not-allowed">
            <Crosshair className="h-[17px] w-[17px]" /> {busy ? "Queueing…" : "Analyze selected"}
          </button>
        </div>
      </div>
    </ShotIQShell>
  )
}
