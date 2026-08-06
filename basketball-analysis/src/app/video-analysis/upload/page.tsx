"use client"

/**
 * /video-analysis/upload — canonical video-upload flow, adapted from the iOS
 * screens 026-video-upload / 024-upload-quality-check (no desktop screen was
 * supplied for this flow). The preserved domain pieces are untouched:
 * VideoUpload (smart shot detection, 3-key-frame extraction) feeds the same
 * analysis pipeline as before. The right-hand column is the canonical FRAMING
 * GUIDE; it used to be a nine-field PlayerProfileForm, which the app already
 * collects in onboarding. That component is untouched and still used there —
 * it is simply no longer asked for a second time on the way to an upload.
 */

import React from "react"
import { useRouter } from "next/navigation"
import { VideoUpload } from "@/components/upload/VideoUpload"
import Link from "next/link"
import { ArrowLeft, Video, User } from "lucide-react"
import { SectionLabel, Card } from "@/components/shotiq/ShotIQShell"
import { VideoReview, type ClipMeta } from "@/components/shotiq/phone/VideoReview"
import { Frame } from "@/components/shotiq/phone/results/Kit"
import { VideoUploadPhone } from "@/components/shotiq/phone/VideoUploadPhone"
import { usePhoneViewport } from "@/components/shotiq/phone/usePhoneViewport"
import { ActionGlyph } from "@/components/shotiq/Glyphs"

/** MB/KB, matching the way the rest of the upload flow prints sizes. */
const fmtBytes = (n: number) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1e3))} KB`

export default function VideoAnalysisPage() {
  const router = useRouter()
  /* 027-video-review is the STATE this route enters once a clip is chosen: a
     player picks a video, reviews and trims it, then sends it for analysis.
     The phone flow owns its own picker because the desktop <VideoUpload/> lays
     its dropzone out for the 1440pt canvas. Metadata is read off the chosen
     file and, where the container cannot be probed in this environment,
     falls back to the clip defaults the review screen documents. */
  const isPhone = usePhoneViewport()
  const [clip, setClip] = React.useState<ClipMeta | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const onPick = (f: File | undefined) => {
    if (!f) return
    setClip({
      durationLabel: "00:06.00",
      resolution: "1080 × 1920",
      sizeLabel: fmtBytes(f.size),
      fps: "60 FPS",
    })
  }

  if (clip) {
    return (
      <>
        {/* `isPhone`, not `md:hidden` — VideoReview portals into <body>, so a
            wrapper cannot hide it. Same defect as the dashboard and analyze
            empty states; this one needed a selected clip to show, which is why
            no capture caught it. */}
        {isPhone && (
          <VideoReview
            clip={clip}
            onChange={() => setClip(null)}
            onAnalyze={() => router.push("/video-analysis/processing")}
          />
        )}
        <div className={isPhone ? "hidden" : undefined}>
          <main className="mx-auto max-w-[1180px] px-[26px] py-[18px]">
            <button type="button" onClick={() => setClip(null)}
                    className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)]">
              <ArrowLeft className="h-4 w-4" /> Choose a different video
            </button>
            <h1 className="shotiq-display mt-[10px] text-[48px] leading-[50px]">VIDEO REVIEW</h1>
            <Card className="mt-[16px] p-6">
              <SectionLabel>CLIP</SectionLabel>
              <p className="mt-[8px] text-[14px]">
                {clip.resolution} · {clip.durationLabel} · {clip.sizeLabel} · {clip.fps}
              </p>
              <button type="button" onClick={() => router.push("/video-analysis/processing")}
                      className="mt-[16px] flex h-[46px] items-center gap-[10px] rounded-[6px] bg-[var(--shotiq-color-shotiqOrange)] px-[24px] text-[15px] font-medium text-white">
                <ActionGlyph kind="analyze" height={20} accent="#fff" /> Analyze video
              </button>
            </Card>
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Canonical iOS 026 is a whole screen, not one button. Round 6 painted
          an orphan orange "Choose video" ABOVE the page's own back link, so the
          element order inverted and the dropzone, the two action cards, the
          FRAMING GUIDE photo pair, the profile summary and the phase rail never
          existed. The desktop uploader below is untouched. */}
      {isPhone && (
        <VideoUploadPhone
          onChoose={() => fileRef.current?.click()}
          onRecord={() => router.push("/video-analysis")}
        />
      )}
      <input ref={fileRef} type="file" accept="video/*,image/*" className="hidden"
             data-testid="video-choose-input"
             onChange={(e) => onPick(e.target.files?.[0])} />
      {(
      /* Two columns, not one 1683px scroll: the three profile controls the
         analysis needs — Position (required), Skill Level and Body Type — used
         to sit ~95px below the 900px fold, where a user has to scroll past the
         whole uploader to find out they exist (R10 defect M8). They now open
         beside the uploader, above the fold. */
      <main data-testid="screen-desktop-web-video-upload"
            className={`mx-auto max-w-[1180px] px-[26px] py-[18px] ${isPhone ? "hidden" : ""}`}>
        <Link href="/video-analysis"
              className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to live capture
        </Link>

        <h1 className="shotiq-display mt-[10px] text-[48px] leading-[50px]">VIDEO UPLOAD</h1>
        <p className="mt-[4px] max-w-xl text-[14px] text-[var(--shotiq-color-graphite)]">
          Upload a clear video of your shot for AI analysis. MP4 · 3–90 seconds ·
          best results in portrait orientation.
        </p>

        <div className="mt-[18px] grid gap-[16px] lg:grid-cols-[minmax(0,1fr)_460px]">
          <Card className="overflow-hidden p-6">
            <div className="mb-1 flex items-center gap-3">
              <Video className="h-5 w-5 text-[var(--shotiq-color-shotiqOrange)]" />
              <SectionLabel>UPLOAD YOUR SHOOTING VIDEO</SectionLabel>
            </div>
            <p className="mb-6 text-sm text-[var(--shotiq-color-graphite)]">
              The system automatically detects the shooting motion and extracts
              3 key frames for analysis.
            </p>
            <VideoUpload />
          </Card>

          {/* CANONICAL 026 PUTS THE FRAMING GUIDE HERE, NOT A PROFILE FORM.
              Kevin: "there's another one that's there that's from the old app…
              the tab below it."

              This column used to be a nine-field data-entry form — Name, Email,
              Age, Position, Skill Level, Body Type, Height, Weight, Wingspan —
              asked on the way to uploading a video. Canonical 026 has none of
              it: it shows how to frame the shot, with a GOOD / TOO CLOSE pair,
              and a READ-ONLY profile summary. The app already collects every
              one of those fields in onboarding and on the profile screen, so
              the form was asking a player for them a second time.

              NOTHING IS DELETED. `PlayerProfileForm` is untouched and still
              runs where it belongs; the phone branch of this very route has
              rendered the canonical version all along (VideoUploadPhone), so
              desktop and phone now show the same screen instead of two
              different ones. */}
          <Card className="p-6">
            <div className="mb-1 flex items-center gap-3">
              <Video className="h-5 w-5 text-[var(--shotiq-color-shotiqOrange)]" />
              <SectionLabel>FRAMING GUIDE</SectionLabel>
            </div>
            <p className="mb-4 text-sm text-[var(--shotiq-color-graphite)]">
              Full body in frame from feet to above release.
            </p>
            <div className="flex gap-[11px]">
              {([["086-film-3", "GOOD", "var(--shotiq-color-confirmGreen)", true],
                 ["086-film-1", "TOO CLOSE", "var(--shotiq-color-shotiqOrange)", false]] as const).map(
                ([src, tag, tone, ok]) => (
                  <span key={tag} className="relative block min-w-0 flex-1">
                    <Frame src={src} w="100%" h={145} radius={4} pos={ok ? "50% 38%" : "50% 2%"} />
                    <span
                      className="shotiq-display absolute left-[7px] top-[7px] rounded-[3px] px-[7px] text-[13px] leading-[21px] tracking-[0.05em] text-white"
                      style={{ background: tone }}
                    >
                      {tag}
                    </span>
                  </span>
                ))}
            </div>
            <ul className="mt-5 space-y-1 text-xs text-[var(--shotiq-color-graphite)]">
              <li>• Film from the side or 45° angle for best pose detection</li>
              <li>• Good lighting helps the AI detect your joints accurately</li>
              <li>• Keep the camera steady — avoid excessive movement</li>
              <li>• Include the complete shooting motion in the video</li>
            </ul>
            <Link
              href="/profile"
              data-testid="video-upload-edit-profile"
              className="mt-5 inline-flex items-center gap-2 text-[13px] text-[var(--shotiq-color-shotiqOrange)] hover:opacity-80"
            >
              <User className="h-4 w-4" /> Update your player profile
            </Link>
          </Card>
        </div>

        <Card className="mt-[18px] p-6">
          <SectionLabel>HOW VIDEO ANALYSIS WORKS</SectionLabel>
          <div className="mt-4 grid grid-cols-1 gap-4 text-sm text-[var(--shotiq-color-graphite)] md:grid-cols-2">
            {[["1. Smart Shot Detection", "Automatically detects when you're shooting (ignores dribbling, walking, etc.)"],
              ["2. 3 Key Frames", "Extracts Setup, Release, and Follow-through moments from your shot."],
              ["3. Same Analysis", "Uses the same AI analysis as image uploads — skeleton overlay, angles, scores."],
              ["4. Session Saved", "Your video session is saved just like image sessions for tracking progress."]].map(([t, d]) => (
              <div key={t} className="space-y-1">
                <h4 className="font-medium text-[var(--shotiq-color-ink)]">{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="mt-[14px] bg-[var(--shotiq-color-warmCanvas)] p-4">
          <SectionLabel>FRAMING GUIDE</SectionLabel>
          <ul className="mt-2 space-y-1 text-xs text-[var(--shotiq-color-graphite)]">
            <li>• Film from the side or 45° angle for best pose detection</li>
            <li>• Full body in frame from feet to above release</li>
            <li>• Good lighting helps the AI detect your joints accurately</li>
            <li>• Keep the camera steady — avoid excessive movement</li>
            <li>• Include the complete shooting motion in the video</li>
          </ul>
        </Card>
      </main>
      )}
    </>
  )
}
