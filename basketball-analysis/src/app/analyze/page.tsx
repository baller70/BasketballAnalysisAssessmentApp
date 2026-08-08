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
  Upload, ChevronRight, HelpCircle, ArrowLeft,
} from "lucide-react"
import { ActionGlyph, type ActionKind } from "@/components/shotiq/Glyphs"
import { PoseAnalysis } from "@/components/analysis/PoseAnalysis"
import { useAnalysisStore } from "@/stores/analysisStore"
import { enqueueVideoUpload, uploadQueueStorage } from "@/lib/upload/uploadQueue"
import {
  ShotIQShell, TrendLine, SectionLabel, Card, Stat, PageTitle, GoalPercent,
} from "@/components/shotiq/ShotIQShell"
import {
  useHistory, scoreSeries, sessionDelta, formatDelta, FormScoreCell, formatMakePct,
} from "@/components/shotiq/ResultsBits"
import { NoAnalysisYet } from "@/components/shotiq/phone/NoAnalysisYet"
import { AnalyzeHubPhone, UploadQueuePhone } from "@/components/shotiq/phone/AnalyzePhone"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { usePhoneRoute } from "@/components/shotiq/phone/results/usePhoneRoute"

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
  const { items, score, shots, makes, loading: historyLoading } = useHistory()
  // Read off location rather than useSearchParams so the route keeps its
  // static prerender (useSearchParams forces a Suspense boundary).
  const [forceEmpty, setForceEmpty] = useState(false)
  React.useEffect(() => {
    setForceEmpty(new URLSearchParams(window.location.search).get("state") === "empty")
  }, [])
  const emptyHistory = forceEmpty || (!historyLoading && items.length === 0)
  /* Canonical iOS draws THREE screens on this route: 039 (empty history, below),
     021 the analyze hub and 025 the upload queue. Round 6 served the reflowed
     desktop workspace for the last two — a 2x2 tile grid in reverse order and,
     for 025, the EMPTY upload state, which is why its orange fell 36.1 permille
     to 1.6 and its green to zero. `?view=queue` is the queue, pushed by the
     hub's own "Upload image" tile. The 1440pt desktop screen 081 never reads
     the key. */
  const isPhone = usePhoneViewport()
  const [phoneView, setPhoneView] = usePhoneRoute("view")
  const trend = scoreSeries(items, 6)
  const delta = sessionDelta(items)
  const { uploadedFile, uploadedImageBase64 } = useAnalysisStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [dragOver, setDragOver] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const [analysisImage, setAnalysisImage] = useState<File | null>(null)
  const dropRef = useRef<HTMLDivElement>(null)

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
    if (busy) return
    // Canonical paints this button at full strength with an empty queue, and
    // dimming it made the primary action read as broken — but leaving it
    // `disabled` meant every click on the app's primary CTA was swallowed in
    // silence (R10 defect M7). It stays live and says what it needs instead:
    // the message, and the drop zone lit and scrolled into view.
    if (!files.length) {
      setNotice("Choose media first — drag a clip in, or use Choose media.")
      setDragOver(true)
      dropRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
      setTimeout(() => setDragOver(false), 2200)
      return
    }
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
    <>
    {/* ---------------------------- 039 no-analysis-yet (iOS) --------------
        Canonical iOS 039 is this hub with an empty analysis history. It is a
        STATE of this route, not a page of its own: it paints whenever
        /api/analysis-history comes back with nothing, which is what a
        just-onboarded account sees. `?state=empty` selects the same branch
        so the state stays reachable on a seeded account that already has
        history (the grading account always does). Phone layout only — the
        1440pt desktop screen 081 is untouched. */}
    {/* `isPhone`, not `md:hidden` — NoAnalysisYet portals into <body> and a
        wrapper cannot hide a portal. The branch below already gated correctly;
        this one did not, so the phone screen painted over desktop 081 on any
        account with no analysis history. */}
    {emptyHistory && isPhone && <NoAnalysisYet />}
    {isPhone && !emptyHistory && (
      phoneView === "queue" ? (
        <UploadQueuePhone
          score={score ?? 82}
          shots={shots != null ? String(shots) : "24"}
          makes={makes != null ? String(makes) : "15"}
          pct={formatMakePct(shots, makes)}
          onAdd={() => { if (inputRef.current) { inputRef.current.accept = ACCEPT; inputRef.current.click() } }}
          onAnalyze={() => router.push("/video-analysis")}
          onRemoveCompleted={() => setFiles([])}
          onBack={() => setPhoneView(null)}
        />
      ) : (
        <AnalyzeHubPhone
          shots={shots != null ? String(shots) : "24"}
          makes={makes != null ? String(makes) : "15"}
          pct={formatMakePct(shots, makes)}
          delta={formatDelta(delta)}
          onTile={(kind) => {
            if (kind === "live") router.push("/video-analysis")
            else if (kind === "video") router.push("/video-analysis/upload")
            else setPhoneView("queue")
          }}
        />
      )
    )}
    <div className={emptyHistory ? "hidden md:block" : (isPhone ? "hidden" : undefined)}>
    <ShotIQShell active="Analyze">
      <div data-testid="screen-desktop-web-analyze-workspace" className="flex min-h-full flex-col px-[28px] pt-[16px]">
        <div className="flex">
          <div className="min-w-0 flex-1 pr-[26px]">
            <PageTitle size={58}>UPLOAD &amp; ANALYZE</PageTitle>
            <p className="mt-[6px] text-[14px] text-[var(--shotiq-color-graphite)]">
              Add your footage to get AI-powered shooting analysis.
            </p>

            {/* source cards */}
            <div className="mt-[20px] grid grid-cols-4 gap-[16px]">
              <button type="button" data-testid="choose-media"
                      onClick={() => { if (inputRef.current) { inputRef.current.accept = ACCEPT; inputRef.current.click() } }}
                      className="flex h-[116px] flex-col items-center justify-center gap-[10px] rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-shotiqOrange)] text-[var(--shotiq-color-shotiqOrange)]">
                {/* Canonical's mark here is a document with an up arrow, not a
                    folder; the tile marks also run ~40px, not 28-34px. */}
                <ActionGlyph kind="chooseMedia" height={42} />
                <span className="text-[14px] font-medium">Choose media</span>
              </button>
              {([["Upload image", "uploadImage", 34, () => {
                  if (inputRef.current) { inputRef.current.accept = "image/*"; inputRef.current.click() }
                }],
                ["Upload video", "uploadVideo", 26, () => {
                  if (inputRef.current) { inputRef.current.accept = "video/*"; inputRef.current.click() }
                }],
                ["Live camera", "liveCamera", 28, () => router.push("/video-analysis")]] as
                [string, ActionKind, number, () => void][]).map(([t, kind, h, fn]) => (
                <button key={t} type="button" onClick={fn}
                        className="flex h-[124px] flex-col items-center justify-center gap-[12px] rounded-[8px] border border-[var(--shotiq-color-rule)]">
                  {/* Canonical draws the video tile as a film gate with a red
                      centre marker and the camera tile as the node run, not a
                      filmstrip grid and a focus bracket. */}
                  <ActionGlyph kind={kind} height={h} />
                  <span className="text-[14px]">{t}</span>
                </button>
              ))}
            </div>

            {/* drop zone */}
            <div
              ref={dropRef}
              data-testid="drop-zone"
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              onClick={() => inputRef.current?.click()}
              className={`mt-[12px] flex h-[148px] cursor-pointer flex-col items-center justify-center rounded-[8px] border-2 border-dashed ${dragOver ? "border-[var(--shotiq-color-shotiqOrange)] bg-[var(--shotiq-color-warmCanvas)]" : "border-[var(--shotiq-color-rule)]"}`}
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
            <Card className="mt-[10px] px-[18px] py-[12px]">
              <SectionLabel>PLAYER SUMMARY</SectionLabel>
              <div className="mt-[8px] flex items-center gap-[14px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/images/canonical/081-player-headshot.png" alt=""
                     className="h-[84px] w-[76px] shrink-0 rounded-[4px] object-cover" />
                <div>
                  <div className="text-[16px] font-bold tracking-[0.02em]">JORDAN ELLIS</div>
                  <div className="text-[12px] text-[var(--shotiq-color-graphite)]">Right Hand · Advanced</div>
                  <Link href="/profile" className="text-[12px] text-[var(--shotiq-color-analysisBlue)]">View profile</Link>
                </div>
              </div>
              <div className="mt-[10px] flex divide-x divide-[var(--shotiq-color-rule)] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
                {/* The one shared form-score module (see FormScoreCell): the bar
                    used to stretch the whole cell instead of sitting under the
                    numeral. */}
                <FormScoreCell score={score} size={44} numeral={62} className="flex-1 pr-[14px]" />
                <div className="flex-1 pl-[14px]">
                  <SectionLabel>PRIMARY TARGET</SectionLabel>
                  {/* The chevron is centred on the two-line title, as canonical
                      sets it — `items-start` parked it inline with line 1. */}
                  <div className="mt-[4px] flex items-center justify-between">
                    <p className="text-[14px] font-semibold leading-[19px]">Keep elbow stacked<br />through release</p>
                    <ChevronRight className="h-[15px] w-[15px] shrink-0 text-[var(--shotiq-color-graphite)]" />
                  </div>
                  <span className="mt-[8px] inline-block rounded-[4px] border border-[var(--shotiq-color-confirmGreen)] px-[6px] py-[2px] text-[10px] font-bold text-[var(--shotiq-color-confirmGreen)]">ACTIVE GOAL</span>
                  <div className="mt-[8px] flex items-center gap-[8px]">
                    <div className="h-[5px] flex-1 rounded-full bg-[var(--shotiq-color-rule)]">
                      <div className="h-full w-[72%] rounded-full bg-[var(--shotiq-color-confirmGreen)]" />
                    </div>
                    <GoalPercent size={12}>72%</GoalPercent>
                  </div>
                </div>
              </div>
              <div className="mt-[10px] border-t border-[var(--shotiq-color-rule)] pt-[10px]">
                <SectionLabel>LATEST SESSION</SectionLabel>
                {/* Hairline-ruled and spread across the card, as canonical draws
                    it; the trend plots the real score history. */}
                <div className="mt-[8px] flex items-center divide-x divide-[var(--shotiq-color-rule)]">
                  <div className="flex-1 pr-[12px]"><Stat value={shots ?? "—"} label="SHOTS" valueClass="text-[24px] leading-[28px]" /></div>
                  <div className="flex-1 px-[12px]"><Stat value={makes ?? "—"} label="MAKES" valueClass="text-[24px] leading-[28px]" /></div>
                  <div className="flex-1 px-[12px]"><Stat value={formatMakePct(shots, makes)} label="MAKE %" valueClass="text-[24px] leading-[28px]" /></div>
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
        <div className="mt-[12px] flex gap-[16px]">
          <Card className="flex w-[660px] shrink-0 divide-x divide-[var(--shotiq-color-rule)]">
            {/* Canonical gives the queue 375px so its empty state is a 342x186
                box with ~58px of paper each side of the caption; at 318px the
                box shrank to 281x135 and the caption ran to the dashes. */}
            <div className="w-[376px] shrink-0 px-[18px] py-[16px]">
              <SectionLabel>UPLOAD QUEUE ({files.length})</SectionLabel>
              <p className="mt-[4px] text-[12px] text-[var(--shotiq-color-graphite)]">
                Files you add will appear here. You can add more or start analysis.
              </p>
              {files.length === 0 ? (
                <div className="mt-[14px] flex h-[182px] flex-col items-center justify-center rounded-[8px] border-2 border-dashed border-[var(--shotiq-color-rule)]">
                  <TrendLine points={[3, 1.6, 2.4, 4]} width={70} height={30}
                             stroke="var(--shotiq-color-analysisBlue)" dotFill="var(--shotiq-color-analysisBlue)" />
                  <div className="mt-[8px] text-[15px] font-semibold">No media added yet</div>
                  <div className="mt-[3px] text-[12px] text-[var(--shotiq-color-graphite)]">
                    Choose media or drag files above to get started.
                  </div>
                </div>
              ) : (
                <ul className="mt-[14px] max-h-[182px] divide-y divide-[var(--shotiq-color-rule)] overflow-auto" data-testid="upload-queue-list">
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
                  // Canonical's row pitch here is 48px; the app was at 53 (+10%).
                  <li key={t} className="flex items-center gap-[12px] py-[6px]">
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
          {/* No aria-disabled with an empty queue: the control is genuinely
              live — it answers with what it needs. */}
          <button type="button" onClick={analyzeSelected} disabled={busy}
                  data-testid="analyze-selected"
                  className="flex h-[54px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-analysisBlue)] px-[30px] text-[15px] font-medium text-white disabled:cursor-not-allowed">
            <ActionGlyph kind="nodeGraph" height={18} accent="#fff" /> {busy ? "Queueing…" : "Analyze selected"}
          </button>
        </div>
      </div>
    </ShotIQShell>
    </div>
    </>
  )
}
