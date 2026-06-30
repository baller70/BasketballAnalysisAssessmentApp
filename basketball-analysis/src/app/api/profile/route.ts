import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { ensureUserProfile } from "@/lib/data/ensureProfile"
import { validateCsrf } from "@/lib/csrf"

// Fields a client is allowed to set on its own profile. The owning user is
// ALWAYS derived from the signed session — any `userId`/`id` in the body or
// query string is ignored (prevents IDOR: writing/reading another user's row).
interface ProfileInput {
  heightInches?: number | null
  weightLbs?: number | null
  wingspanInches?: number | null
  age?: number | null
  experienceLevel?: string | null
  bodyType?: string | null
  athleticAbility?: number | null
  dominantHand?: string | null
  shootingStyle?: string | null
  bio?: string | null
  enhancedBio?: string | null
  coachingTier?: string | null
  profileComplete?: boolean
  pointsState?: unknown
}

const num = (v: unknown): number | null =>
  typeof v === "number" && Number.isFinite(v) ? v : null
const str = (v: unknown): string | null =>
  typeof v === "string" ? v : null

/**
 * Derive metrics server-side so the client can't poison them. Recomputed from
 * the trusted measurements rather than trusting any client-sent value.
 */
function deriveMetrics(input: ProfileInput) {
  const height = num(input.heightInches)
  const weight = num(input.weightLbs)
  const wingspan = num(input.wingspanInches)

  const bmi =
    height && weight && height > 0
      ? Math.round(((weight / (height * height)) * 703) * 100) / 100
      : null
  const wingspanToHeightRatio =
    height && wingspan && height > 0
      ? Math.round((wingspan / height) * 100) / 100
      : null

  return { bmi, wingspanToHeightRatio }
}

const has = (input: ProfileInput, key: string) =>
  Object.prototype.hasOwnProperty.call(input, key)

/**
 * Build a PARTIAL Prisma data payload: only fields actually present in the
 * request body are written, so a `{pointsState}`-only update (e.g. from the
 * points context) never clobbers measurements or resets profileComplete.
 * Derived metrics are recomputed server-side and only when their inputs are
 * supplied together.
 */
function buildProfileData(input: ProfileInput) {
  const data: Record<string, unknown> = {}
  if (has(input, "heightInches")) data.heightInches = num(input.heightInches)
  if (has(input, "weightLbs")) data.weightLbs = num(input.weightLbs)
  if (has(input, "wingspanInches")) data.wingspanInches = num(input.wingspanInches)
  if (has(input, "age")) data.age = num(input.age)
  if (has(input, "experienceLevel")) data.experienceLevel = str(input.experienceLevel)
  if (has(input, "bodyType")) data.bodyType = str(input.bodyType)
  if (has(input, "athleticAbility")) data.athleticAbility = num(input.athleticAbility)
  if (has(input, "dominantHand")) data.dominantHand = str(input.dominantHand)
  if (has(input, "shootingStyle")) data.shootingStyle = str(input.shootingStyle)
  if (has(input, "bio")) data.bio = str(input.bio)
  if (has(input, "enhancedBio")) data.enhancedBio = str(input.enhancedBio)
  if (has(input, "coachingTier")) data.coachingTier = str(input.coachingTier)
  if (has(input, "profileComplete")) data.profileComplete = !!input.profileComplete
  if (has(input, "pointsState")) data.pointsState = (input.pointsState as object) || undefined

  // Recompute derived metrics only when both inputs are present in this body.
  const { bmi, wingspanToHeightRatio } = deriveMetrics(input)
  if (has(input, "heightInches") && has(input, "weightLbs")) data.bmi = bmi
  if (has(input, "heightInches") && has(input, "wingspanInches"))
    data.wingspanToHeightRatio = wingspanToHeightRatio

  return data
}

// POST / PUT — Create or update the authenticated caller's own profile.
async function upsertOwnProfile(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  let input: ProfileInput
  try {
    input = (await request.json()) as ProfileInput
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request body" },
      { status: 400 }
    )
  }

  const data = buildProfileData(input)

  try {
    // Scope strictly to the session user's id — never a body/query value.
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: data,
      create: { userId: user.userId, ...data },
    })

    // Keep the User.profileComplete flag in sync — only when explicitly provided.
    if (has(input, "profileComplete")) {
      await prisma.user
        .update({ where: { id: user.userId }, data: { profileComplete: !!input.profileComplete } })
        .catch((e) => console.error("Failed to sync User.profileComplete:", e))
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Error creating/updating profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to create/update profile" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  return upsertOwnProfile(request)
}

export async function PUT(request: NextRequest) {
  return upsertOwnProfile(request)
}

// GET — Retrieve ONLY the authenticated caller's own profile. Any id/userId
// query param is ignored.
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    // Guarantee a profile row exists so the client always gets a usable shape.
    await ensureUserProfile(user.userId)

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.userId },
      include: {
        analyses: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    })

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    console.error("Error fetching profile:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}
