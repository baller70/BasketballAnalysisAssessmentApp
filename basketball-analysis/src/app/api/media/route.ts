import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"
import { resolveShot } from "@/lib/shots/resolveShot"

/**
 * DELETE /api/media?analysisId=<id>  (or ?historyId=<id>)
 *
 * Server-side, caller-scoped deletion for the Media Library. The web app used
 * to keep its gallery only in localStorage (base64, device-local, 20-cap), so
 * "delete" never reached Postgres. This route makes delete authoritative.
 *
 * Auth/IDOR: the owning profile is derived from the session token via
 * resolveProfileId — never from the request. Every delete is additionally
 * scoped with `userProfileId` in the WHERE clause via deleteMany, so a caller
 * can never remove another user's rows even by guessing an id.
 *
 * CSRF: required on this mutating route (double-submit cookie pattern).
 *
 * Deleting a UserAnalysis cascades to its AnalysisHistory snapshots
 * (onDelete: Cascade in the schema), so the gallery item disappears fully.
 */
/**
 * GET /api/media
 *
 * THE LIBRARY COULD NOT SHOW YOUR UPLOADS BECAUSE THIS DID NOT EXIST.
 *
 * `src/app/media/page.tsx` has always called `fetch("/api/media")`. This file
 * exported DELETE and nothing else, so that call answered **405 Method Not
 * Allowed** — and because the caller wraps it in `.catch(() => {})`, the
 * failure was silent and the page fell back to its hardcoded demo groups. The
 * Media tab advertised "your shots and training sessions" and structurally
 * could not display one.
 *
 * It is also the missing half of the iOS→web direction: an iOS capture posts to
 * /api/save-analysis and lands in `user_analyses`, and the web had no endpoint
 * to read it back. With this, a shot recorded on the phone shows up in the web
 * library, which is the thing the two apps sharing a backend is supposed to buy.
 *
 * Auth/IDOR: the owning profile comes from the session token via
 * `resolveProfileId`, never from the request, and the query is scoped by
 * `userProfileId` — the same chokepoint DELETE below uses.
 */

/** Day headings the library groups under, matching the existing design. */
function dayHeading(when: Date, now: Date): string {
  const d = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((d(now) - d(when)) / 86_400_000)
  const label = when.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
  if (days === 0) return `TODAY · ${label}`
  if (days === 1) return `YESTERDAY · ${label}`
  return label.toUpperCase()
}

export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const rows = await prisma.userAnalysis.findMany({
      where: { userProfileId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, createdAt: true, mediaType: true, imageUrl: true,
        annotatedImageUrl: true, videoUrl: true, overallScore: true,
        processingStatus: true, shootingPhase: true, clientSessionId: true,
        coachingNotes: true, captureSessionId: true,
      },
    })

    /* TWO FIELDS ON THIS RESPONSE WERE BARE CONSTANTS: `result: "Make"` and
       `hand: "Right"`, on every row, for every account. Every other field here
       was carefully derived; these two sat in the middle of them looking
       exactly as real, and the differential audit could not see them because
       its token regex only matches numeric shapes — percentages, clocks,
       dates, degrees. A categorical constant like "Make" or "Right" walks
       straight through it (F19).

       The hand is a profile fact and is simply read. The result is not: a media
       row is an ANALYSIS, and an analysis can cover a whole session, for which
       a single make/miss is not a well-defined quantity. It is answered only
       where it genuinely is one — a capture holding exactly one shot — and is
       an em-dash otherwise. */
    const profile = await prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: { dominantHand: true },
    })
    const hand: "Right" | "Left" | "—" =
      profile?.dominantHand?.toLowerCase() === "left" ? "Left"
      : profile?.dominantHand?.toLowerCase() === "right" ? "Right"
      : "—"

    const captureIds = rows.map((r) => r.captureSessionId).filter((id): id is string => !!id)
    const events = captureIds.length
      ? await prisma.shotEvent.findMany({
          where: { userProfileId, captureSessionId: { in: captureIds } },
          select: {
            captureSessionId: true, detected: true, detectedResult: true,
            corrections: {
              where: { kind: { in: ["false_shot", "make_miss"] } },
              orderBy: { createdAt: "asc" },
              select: { kind: true, value: true },
            },
          },
        })
      : []
    const byCapture = new Map<string, ("make" | "miss" | null)[]>()
    for (const e of events) {
      const { dropped, result } = resolveShot(e)
      if (dropped || !e.captureSessionId) continue
      const bucket = byCapture.get(e.captureSessionId) ?? []
      bucket.push(result)
      byCapture.set(e.captureSessionId, bucket)
    }
    const resultFor = (captureSessionId: string | null): "Make" | "Miss" | "—" => {
      const bucket = captureSessionId ? byCapture.get(captureSessionId) : undefined
      if (!bucket || bucket.length !== 1) return "—"
      return bucket[0] === "make" ? "Make" : bucket[0] === "miss" ? "Miss" : "—"
    }

    /* The clip's length, which lives on the upload rather than the analysis.
       `/api/media` has been answering "—" for every row because nothing
       recorded a duration anywhere; media_uploads carries one now, so the
       library can print a real length instead of the preview surface falling
       back to its canonical 0:07 on every clip. */
    const uploads = await prisma.mediaUpload.findMany({
      where: { userProfileId, analysisId: { in: rows.map((r) => r.id) } },
      select: { analysisId: true, durationSeconds: true },
    })
    const durationByAnalysis = new Map<string, number>()
    for (const u of uploads) {
      if (!u.analysisId || u.durationSeconds == null) continue
      const n = Number(u.durationSeconds)
      if (Number.isFinite(n) && n > 0) durationByAnalysis.set(u.analysisId, n)
    }
    /** `0:07`, the form every transport and duration chip in the app prints. */
    const clock = (seconds: number) => {
      const t = Math.max(0, Math.round(seconds))
      return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`
    }

    const now = new Date()
    const media = rows.map((r) => {
      const score = r.overallScore == null ? null : Number(r.overallScore)
      return {
        id: r.id,
        // The analysis does not carry a shot name, so the phase it was graded
        // at is the honest label rather than inventing "Pull-Up Jumper".
        title: r.shootingPhase ? r.shootingPhase.replace(/_/g, " ") : "Shot analysis",
        time: r.createdAt.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
        style: r.mediaType === "video" ? "Video" : "Image",
        score,
        status:
          r.processingStatus === "failed" ? "Failed"
          : score == null ? "Not analyzed"
          : score < 70 ? "Review"
          : "Analyzed",
        /* An em-dash means "not recorded", which is the honest answer for an
           image, for a clip uploaded before durations were kept, and for one
           whose codec the browser could not decode. It is never a zero. */
        len: durationByAnalysis.has(r.id) ? clock(durationByAnalysis.get(r.id) as number) : "—",
        durationSeconds: durationByAnalysis.get(r.id) ?? null,
        // Prefer the annotated frame (the one carrying the skeleton) when the
        // pipeline produced one.
        img: r.annotatedImageUrl || r.imageUrl || undefined,
        // clientSessionId is prefixed "ios-" by the Swift client (see
        // CaptureFlow.swift), which is the only signal we have for provenance.
        source: r.clientSessionId?.startsWith("ios-") ? "iOS Capture" : "Web Upload",
        result: resultFor(r.captureSessionId),
        hand,
        coachingNotes: r.coachingNotes ?? undefined,
        recordedAt: r.createdAt.toISOString(),
      }
    })

    const groups: Record<string, typeof media> = {}
    for (const [i, r] of rows.entries()) {
      const head = dayHeading(r.createdAt, now)
      ;(groups[head] ||= []).push(media[i])
    }

    return NextResponse.json({ success: true, media, groups })
  } catch (error) {
    console.error("Media list error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to list media" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = validateCsrf(request)
  if (csrf) return csrf

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  const analysisId = request.nextUrl.searchParams.get("analysisId")
  const historyId = request.nextUrl.searchParams.get("historyId")

  if (!analysisId && !historyId) {
    return NextResponse.json(
      { success: false, error: "analysisId or historyId is required" },
      { status: 400 }
    )
  }

  try {
    // Scoped delete: the userProfileId predicate is what prevents IDOR —
    // deleteMany only touches rows owned by the authenticated caller.
    const result = analysisId
      ? await prisma.userAnalysis.deleteMany({
          where: { id: analysisId, userProfileId },
        })
      : await prisma.analysisHistory.deleteMany({
          where: { id: historyId as string, userProfileId },
        })

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: "Not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, deleted: result.count })
  } catch (error) {
    console.error("Media delete error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete media",
      },
      { status: 500 }
    )
  }
}
