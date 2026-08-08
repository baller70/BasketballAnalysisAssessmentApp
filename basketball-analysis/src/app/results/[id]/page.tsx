"use client"

/**
 * /results/[id] — the results page for ONE analysis, laid out as canonical
 * desktop 083-web-analysis-overview.
 *
 * WHY THIS ROUTE EXISTS. `/results/demo` was the only results route in the app.
 * There was no `/results/[id]`, and every analysis destination — the Analyze
 * nav item, Analytics, Train, Progress, the upload flow, the share links —
 * pointed at that one static page. A player uploaded a shot and was shown
 * somebody else's numbers.
 *
 * ADDITIVE: `/results/demo` is untouched and still serves exactly what it
 * served before. This is a new route beside it, reading the caller's own
 * analysis from `GET /api/save-analysis?id=`, auth-scoped through
 * `resolveProfileId` so one player cannot open another's.
 *
 * COMPOSITION follows 083 band for band: header with date/style/hand and the
 * PREV · n OF n · NEXT rail; the shot with its phase strip; FORM SCORE over
 * MECHANICS AT RELEASE; PRIMARY COACHING TARGET over KEY INSIGHT; and the
 * ANALYSIS SUMMARY band across the foot.
 *
 * HONEST ABOUT WHAT IS REAL. Every figure comes from the stored record. Where
 * the pipeline has not produced a value the field shows a dash and says why,
 * rather than borrowing the demo's number — a results page that invents its own
 * content is the defect this route exists to fix.
 */

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { ArrowLeft, ChevronLeft, ChevronRight } from "@/components/shotiq/ApprovedLucide"
import { SectionLabel, Card, PageTitle } from "@/components/shotiq/ShotIQShell"
import { PhaseFrame, usePhaseFrames } from "@/components/shotiq/PhaseFrames"
import UploadedPoseOverlay from "@/components/upload/UploadedPoseOverlay"
import {
  ELBOW_AT_RELEASE, WRIST_AT_RELEASE, RELEASE_FROM_VERTICAL,
} from "@/lib/analysis/angleBands"

interface Analysis {
  id: string
  createdAt: string
  mediaType: string | null
  imageUrl: string | null
  annotatedImageUrl: string | null
  videoUrl: string | null
  overallScore: string | number | null
  formScore: string | number | null
  balanceScore: string | number | null
  releaseScore: string | number | null
  consistencyScore: string | number | null
  elbowAngle: string | number | null
  kneeAngle: string | number | null
  releaseAngle: string | number | null
  shoulderAngle: string | number | null
  hipAngle: string | number | null
  wristAngle: string | number | null
  shootingPhase: string | null
  coachingNotes: string | null
  processingStatus: string | null
  clientSessionId: string | null
}

interface Neighbour { id: string; recordedAt: string }

/** Prisma Decimal arrives as a string over JSON. */
const num = (v: string | number | null | undefined): number | null => {
  if (v == null) return null
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * Canonical 083 prints each mechanic beside the range it should sit inside.
 *
 * FOUR OF THESE SIX JUDGED THE WRONG MOMENT. Every angle on an analysis record
 * is sampled at the RELEASE frame, and these bands described the set point, the
 * dip, or a quantity this pipeline never measures — so the page a player lands
 * on after uploading marked a correct shot wrong on four of its six rows:
 *
 *   Wrist    15-30   a wrist SNAP flexion. The stored value is forearm
 *                    elevation from horizontal, ~50-100 at release.
 *   Release  45-55   canonical's ball ARC. The stored value is the forearm's
 *                    signed deviation from vertical, ideal 0.
 *   Knee     110-140 the depth of the DIP. The release knee is extended,
 *                    ~165-180, so this could never pass.
 *   Shoulder 80-100  the arm is overhead at release, ~150-175.
 *
 * The three that `angleBands` settles now come from it, so this page cannot
 * drift from the share card, the phone strip, the biomechanics table and
 * /results/demo. Knee and shoulder have NO defensible release-frame band —
 * nothing in this codebase states one, and picking numbers here would be the
 * same defect again — so they print their measurement with no verdict rather
 * than a pass or fail nobody can justify. The hip is upright throughout a
 * shot, so its band holds at the release frame and stays as canonical prints it.
 */
const IDEAL: Record<string, [number, number, string]> = {
  "Elbow Angle": [ELBOW_AT_RELEASE.min, ELBOW_AT_RELEASE.max, ELBOW_AT_RELEASE.label],
  "Wrist Angle": [WRIST_AT_RELEASE.min, WRIST_AT_RELEASE.max, WRIST_AT_RELEASE.label],
  "Release Angle": [RELEASE_FROM_VERTICAL.min, RELEASE_FROM_VERTICAL.max, RELEASE_FROM_VERTICAL.label],
  "Hip Angle": [160, 180, "160° – 180°"],
}

const PHASES = ["SETUP", "LOAD", "RISE", "RELEASE", "FOLLOW-THROUGH"] as const

export default function AnalysisResultPage() {
  const params = useParams<{ id: string }>()
  const id = params?.id
  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [siblings, setSiblings] = useState<Neighbour[]>([])
  const [state, setState] = useState<"loading" | "ready" | "missing" | "error">("loading")

  useEffect(() => {
    if (!id) return
    let cancelled = false
    fetch(`/api/save-analysis?id=${encodeURIComponent(id)}`, { credentials: "include" })
      .then(async (r) => ({ ok: r.ok, status: r.status, body: await r.json().catch(() => null) }))
      .then(({ ok, status, body }) => {
        if (cancelled) return
        if (status === 404) { setState("missing"); return }
        if (!ok || !body?.success || !body.analysis) { setState("error"); return }
        setAnalysis(body.analysis as Analysis)
        setState("ready")
      })
      .catch(() => { if (!cancelled) setState("error") })
    return () => { cancelled = true }
  }, [id])

  /* The "3 OF 24 · PREV · NEXT" rail canonical draws needs the caller's other
     analyses, which /api/media already returns newest-first. */
  useEffect(() => {
    let cancelled = false
    fetch("/api/media", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled || !Array.isArray(d?.media)) return
        setSiblings(d.media.map((m: { id: string; recordedAt: string }) => ({ id: m.id, recordedAt: m.recordedAt })))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const score = num(analysis?.overallScore)
  const media = analysis?.annotatedImageUrl || analysis?.imageUrl || null
  const idx = siblings.findIndex((s) => s.id === id)
  const prev = idx > 0 ? siblings[idx - 1] : null
  const next = idx >= 0 && idx < siblings.length - 1 ? siblings[idx + 1] : null

  const mechanics: [string, number | null][] = [
    ["Elbow Angle", num(analysis?.elbowAngle)],
    ["Wrist Angle", num(analysis?.wristAngle)],
    ["Release Angle", num(analysis?.releaseAngle)],
    ["Knee Angle", num(analysis?.kneeAngle)],
    ["Shoulder Angle", num(analysis?.shoulderAngle)],
    ["Hip Angle", num(analysis?.hipAngle)],
  ]
  const measured = mechanics.filter(([, v]) => v != null).length
  const activePhase = (analysis?.shootingPhase || "").toUpperCase().replace(/_/g, "-")
  // The phase stills belonging to THIS analysis, matched through the client
  // session id the upload saved them under.
  const phaseFrames = usePhaseFrames(analysis?.clientSessionId)
  // Uploads made before the pipeline stored a frame server-side left this panel
  // an empty black box. The release still cut from the same clip is the same
  // moment of the same shot, so it stands in when the record has no frame.
  const shotFrame = media || phaseFrames["RELEASE"] || null

  if (state !== "ready" || !analysis) {
    return (
      <div className="pl-[21px] pr-[18px] pt-[16px]">
        <Link href="/media" className="flex items-center gap-2 text-[13px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-4 w-4" /> Back to media library
        </Link>
        <Card className="mt-[18px] p-[30px]">
          {state === "loading" && (
            <p className="text-[14px] text-[var(--shotiq-color-graphite)]">Loading your analysis…</p>
          )}
          {state === "missing" && (
            <>
              <PageTitle size={44}>ANALYSIS NOT FOUND</PageTitle>
              <p className="mt-[8px] text-[14px] text-[var(--shotiq-color-graphite)]">
                This analysis either does not exist or belongs to another account.
              </p>
              <Link href="/media" className="mt-[14px] inline-block text-[14px] text-[var(--shotiq-color-shotiqOrange)]">
                Back to your media library
              </Link>
            </>
          )}
          {state === "error" && (
            <>
              <PageTitle size={44}>COULDN&apos;T LOAD THIS ANALYSIS</PageTitle>
              <p className="mt-[8px] text-[14px] text-[var(--shotiq-color-graphite)]">
                The analysis service did not answer. Check your connection and try again.
              </p>
            </>
          )}
        </Card>
      </div>
    )
  }

  const when = new Date(analysis.createdAt)

  return (
    <div data-testid="screen-results-analysis" className="pl-[21px] pr-[18px] pt-[16px]">
      {/* ---- header band: title + the PREV / n OF n / NEXT rail (083) ---- */}
      <div className="flex items-start">
        <Link href="/media" aria-label="Back to media library"
              className="mt-[14px] mr-[14px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
          <ArrowLeft className="h-[22px] w-[22px]" />
        </Link>
        <div className="flex-1">
          <PageTitle size={65}>ANALYSIS OVERVIEW</PageTitle>
          <p className="mt-[4px] text-[14px] text-[var(--shotiq-color-graphite)]">
            {when.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            {"  ·  "}{when.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            {"  ·  "}{analysis.mediaType === "video" ? "Video" : "Image"}
            {"  ·  "}{analysis.clientSessionId?.startsWith("ios-") ? "Captured on iOS" : "Uploaded on web"}
          </p>
        </div>
        <div className="flex items-center gap-[12px] pt-[10px]">
          <Link
            href={prev ? `/results/${prev.id}` : "#"}
            aria-disabled={!prev}
            className={`flex h-[38px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px] ${prev ? "" : "pointer-events-none opacity-40"}`}
          >
            <ChevronLeft className="h-[14px] w-[14px]" /> PREV
          </Link>
          <div className="text-center">
            <div className="text-[15px] font-semibold">
              {idx >= 0 ? `${idx + 1} OF ${siblings.length}` : "1 OF 1"}
            </div>
            <Link href="/media" className="text-[12px] text-[var(--shotiq-color-graphite)] hover:text-[var(--shotiq-color-shotiqOrange)]">
              View all analyses
            </Link>
          </div>
          <Link
            href={next ? `/results/${next.id}` : "#"}
            aria-disabled={!next}
            className={`flex h-[38px] items-center gap-[6px] rounded-[6px] border border-[var(--shotiq-color-rule)] px-[14px] text-[13px] ${next ? "" : "pointer-events-none opacity-40"}`}
          >
            NEXT <ChevronRight className="h-[14px] w-[14px]" />
          </Link>
        </div>
      </div>

      {/* ---- three columns: shot · score+mechanics · target+insight ---- */}
      <div className="mt-[16px] grid gap-[16px] xl:grid-cols-[minmax(0,1fr)_300px_390px]">
        <Card className="overflow-hidden p-0">
          <div className="bg-[#1B1D20]">
            {shotFrame ? (
              /* The same overlay the upload screen uses: MoveNet over the
                 stored frame, so the wireframe belongs to THIS shot. When the
                 server kept no frame, the release still this device cut from
                 the clip stands in — it is the same moment, from this shot. */
              <UploadedPoseOverlay src={shotFrame} alt="Analysed shot" className="w-full" />
            ) : (
              <div className="flex h-[330px] items-center justify-center px-6 text-center text-[13px] text-white/60">
                No frame was stored for this analysis. Shots saved before the
                capture pipeline stored its frame will show none.
              </div>
            )}
          </div>
          {/* phase strip — canonical marks the graded phase in orange */}
          <div className="flex items-start justify-between px-[18px] py-[14px]">
            {PHASES.map((p) => {
              const on = activePhase === p
              return (
                <div key={p} className="flex min-w-0 flex-1 flex-col items-center gap-[6px]">
                  {/* This analysis's own frame for the phase when the clip was
                      analysed on this device; the canonical figure otherwise. */}
                  <PhaseFrame phase={p} frames={phaseFrames} active={on} height={26} />
                  <span className={`text-[10px] tracking-[0.06em] ${on ? "font-bold text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-graphite)]"}`}>
                    {p}
                  </span>
                  {on && <span className="h-[2px] w-[26px] bg-[var(--shotiq-color-shotiqOrange)]" />}
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-[18px]">
          <SectionLabel>FORM SCORE</SectionLabel>
          <div className="mt-[6px] flex items-end gap-[8px]">
            <span className="shotiq-numeric text-[58px] leading-[56px] text-[var(--shotiq-color-shotiqOrange)]">
              {score == null ? "—" : Math.round(score)}
            </span>
            <span className="pb-[9px] text-[16px] text-[var(--shotiq-color-graphite)]">/100</span>
          </div>
          <div className="mt-[10px] h-[7px] w-full rounded-full bg-[var(--shotiq-color-rule)]">
            <div className="h-full rounded-full bg-[var(--shotiq-color-shotiqOrange)]"
                 style={{ width: `${Math.max(0, Math.min(100, score ?? 0))}%` }} />
          </div>
          {score != null && (
            <div className="mt-[10px] text-[15px] font-semibold text-[var(--shotiq-color-analysisBlue)]">
              {score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : "NEEDS WORK"}
            </div>
          )}

          <div className="mt-[16px] border-t border-[var(--shotiq-color-rule)] pt-[14px]">
            <SectionLabel>MECHANICS AT RELEASE</SectionLabel>
            <div className="mt-[10px] space-y-[10px]">
              {mechanics.map(([label, value]) => {
                const range = IDEAL[label]
                const inRange = value != null && range && value >= range[0] && value <= range[1]
                return (
                  <div key={label} className="flex items-center justify-between gap-[8px]">
                    <span className="text-[13px] text-[var(--shotiq-color-graphite)]">{label}</span>
                    <span className="shotiq-numeric text-[17px]">{value == null ? "—" : `${Math.round(value)}°`}</span>
                    <span className={`w-[86px] text-right text-[10px] leading-[13px] ${value == null ? "text-[var(--shotiq-color-muted)]" : inRange ? "text-[var(--shotiq-color-confirmGreen)]" : "text-[var(--shotiq-color-shotiqOrange)]"}`}>
                      {/* No band means the measurement is real but nothing in
                          this app states what it should read AT RELEASE — true
                          of the knee and the shoulder. Blank would read as a
                          quiet pass; the row says it is ungraded instead. */}
                      {!range ? (value == null ? "not measured" : "not graded")
                        : value == null ? "not measured"
                        : <>{inRange ? "IDEAL" : "OUTSIDE"}<br />{range[2]}</>}
                    </span>
                  </div>
                )
              })}
            </div>
            {measured === 0 && (
              <p className="mt-[10px] text-[12px] leading-[17px] text-[var(--shotiq-color-graphite)]">
                No joint angles were stored for this shot. They come from the pose
                pass; an analysis saved before that ran carries none.
              </p>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-[16px]">
          <Card className="p-[18px]">
            <SectionLabel>PRIMARY COACHING TARGET</SectionLabel>
            <h2 className="mt-[8px] text-[20px] font-semibold leading-[26px]">
              {analysis.coachingNotes || "No coaching target was produced for this shot yet."}
            </h2>
          </Card>

          <Card className="p-[18px]">
            <SectionLabel>KEY INSIGHT</SectionLabel>
            {measured > 0 ? (
              <p className="mt-[8px] text-[14px] leading-[20px]">
                {mechanics.filter(([l, v]) => v != null && IDEAL[l] && (v < IDEAL[l][0] || v > IDEAL[l][1]))
                  .map(([l, v]) => `${l} sits at ${Math.round(v as number)}°, outside its ${IDEAL[l][2]} range.`)
                  .join(" ") || "Every measured angle sits inside its ideal range on this shot."}
              </p>
            ) : (
              <p className="mt-[8px] text-[14px] leading-[20px] text-[var(--shotiq-color-graphite)]">
                An insight needs measured angles. Once the pose pass has run on a
                shot, the mechanic furthest outside its range is called out here.
              </p>
            )}
            <Link href="/results/demo/flaws" className="mt-[12px] inline-flex items-center gap-[4px] text-[13px] text-[var(--shotiq-color-analysisBlue)]">
              View all mechanics <ChevronRight className="h-[13px] w-[13px]" />
            </Link>
          </Card>
        </div>
      </div>

      {/* ---- ANALYSIS SUMMARY band (083 foot) ---- */}
      <Card className="mt-[16px] p-[18px]">
        <SectionLabel>ANALYSIS SUMMARY</SectionLabel>
        <div className="mt-[12px] flex flex-wrap items-start gap-y-[14px]">
          {([
            ["FORM", num(analysis.formScore)],
            ["BALANCE", num(analysis.balanceScore)],
            ["RELEASE", num(analysis.releaseScore)],
            ["CONSISTENCY", num(analysis.consistencyScore)],
            ["OVERALL", score],
          ] as [string, number | null][]).map(([label, v], i) => (
            <div key={label}
                 className={`min-w-[120px] flex-1 px-[16px] ${i ? "border-l border-[var(--shotiq-color-rule)]" : "pl-0"}`}>
              <div className={`shotiq-numeric text-[30px] leading-[32px] ${v == null ? "text-[var(--shotiq-color-muted)]" : ""}`}>
                {v == null ? "—" : Math.round(v)}
              </div>
              <div className="mt-[4px] text-[11px] tracking-[0.06em] text-[var(--shotiq-color-graphite)]">{label}</div>
            </div>
          ))}
        </div>
      </Card>

      <Link
        href="/results/demo"
        className="mt-[16px] mb-[24px] flex items-center justify-between rounded-[8px] border border-[var(--shotiq-color-rule)] px-[20px] py-[16px] hover:border-[var(--shotiq-color-shotiqOrange)]"
      >
        <span className="text-[15px]">See the full breakdown, flaws and elite comparison</span>
        <ChevronRight className="h-[18px] w-[18px] text-[var(--shotiq-color-graphite)]" />
      </Link>
    </div>
  )
}
