import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"

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
        coachingNotes: true,
      },
    })

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
        len: r.mediaType === "video" ? "—" : "—",
        // Prefer the annotated frame (the one carrying the skeleton) when the
        // pipeline produced one.
        img: r.annotatedImageUrl || r.imageUrl || undefined,
        // clientSessionId is prefixed "ios-" by the Swift client (see
        // CaptureFlow.swift), which is the only signal we have for provenance.
        source: r.clientSessionId?.startsWith("ios-") ? "iOS Capture" : "Web Upload",
        result: "Make",
        hand: "Right",
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
