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
