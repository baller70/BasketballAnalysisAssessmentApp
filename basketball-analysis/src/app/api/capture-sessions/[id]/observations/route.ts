import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isError, resolveProfileId } from "@/lib/auth/currentUser"

/**
 * GET /api/capture-sessions/[id]/observations — what the camera actually saw.
 *
 * `capture_session_observations` has been written since capture was built —
 * pose confidence, keypoints, whether the full body was visible, whether the
 * shot was stable, the lighting, and whether the hoop and ball were in frame —
 * by BOTH the live-capture readiness flow AND every video upload, which posts a
 * pose confidence averaged across its frames. Nothing has ever read it back.
 *
 * So the frame viewer on `/results/demo/biomechanics` drew CONFIDENCE 98% /
 * KEYPOINTS 17/17 / TRACKING EXCELLENT as constants, and when those were made
 * honest they became em-dashes — not because the data was missing, but because
 * there was no route to ask for it. This is that route (rule F1 again: the
 * engine was complete, correct, and had no caller).
 *
 * Auth/IDOR: the owning profile comes from the session token via
 * `resolveProfileId`, never from the request, and the capture session is
 * re-checked against that profile before any observation is returned — an id
 * belonging to another player yields 404, not their frames.
 */

/** Prisma Decimal arrives as an object/string; take a real number or nothing. */
const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * How many landmarks the detector actually placed.
 *
 * `keypoints` is written as whatever the provider returned, which is an array
 * for MoveNet but is not guaranteed to be. Anything that is not a countable
 * list yields null — "we did not record a count" — rather than a zero, which
 * would read as "the detector found no joints at all".
 */
function keypointCount(value: unknown): number | null {
  if (Array.isArray(value)) return value.length
  if (value && typeof value === "object") {
    const inner = (value as { keypoints?: unknown }).keypoints
    if (Array.isArray(inner)) return inner.length
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  try {
    // Ownership first: never read observations for a session the caller does
    // not own, whatever id they supply.
    const session = await prisma.captureSession.findFirst({
      where: { id: params.id, userProfileId: resolved.profileId },
      select: { id: true },
    })
    if (!session) {
      return NextResponse.json({ success: false, error: "Capture session not found" }, { status: 404 })
    }

    const row = await prisma.captureSessionObservation.findFirst({
      where: { captureSessionId: session.id },
      orderBy: [{ timestampMs: "desc" }, { createdAt: "desc" }],
      select: {
        timestampMs: true, orientation: true, poseConfidence: true,
        fullBodyVisible: true, subjectFrameRatio: true, stable: true,
        lighting: true, hoopVisible: true, ballVisible: true, keypoints: true,
      },
    })

    if (!row) {
      /* A capture with no observation is normal — an iOS run that predates the
         table, or an upload whose post was dropped by its 2s timeout. Say so;
         the caller shows an em-dash rather than a fabricated 17/17. */
      return NextResponse.json({ success: true, observation: null })
    }

    return NextResponse.json({
      success: true,
      observation: {
        timestampMs: row.timestampMs,
        orientation: row.orientation,
        poseConfidence: num(row.poseConfidence),
        fullBodyVisible: row.fullBodyVisible,
        subjectFrameRatio: num(row.subjectFrameRatio),
        stable: row.stable,
        lighting: row.lighting,
        hoopVisible: row.hoopVisible,
        ballVisible: row.ballVisible,
        /** The COUNT, not the landmarks: the frame viewer prints "17/17" and
         *  has no use for the coordinates, which are large. */
        keypointCount: keypointCount(row.keypoints),
      },
    })
  } catch (error) {
    console.error("Capture observation error:", error)
    return NextResponse.json(
      { success: false, error: "Could not read capture observations" },
      { status: 500 },
    )
  }
}
