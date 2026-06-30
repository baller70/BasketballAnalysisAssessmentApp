import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"

/**
 * DELETE /api/saved-workouts/[id]  — delete one of the user's saved workouts
 *
 * Ownership is enforced by first loading the row's userProfileId and comparing
 * it to the caller's resolved profile — a mismatch (or a missing row) is a 404,
 * so a user can never delete another user's saved workout via the id.
 */

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error

  const existing = await prisma.savedWorkout.findUnique({
    where: { id: params.id },
    select: { userProfileId: true },
  })
  if (!existing || existing.userProfileId !== resolved.profileId) {
    return NextResponse.json(
      { success: false, error: "Saved workout not found" },
      { status: 404 }
    )
  }

  await prisma.savedWorkout.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
