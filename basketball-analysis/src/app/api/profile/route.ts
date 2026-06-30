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

/**
 * Build the Prisma data payload from a request body, applying server-side
 * derivation. Only whitelisted fields are written.
 */
function buildProfileData(input: ProfileInput) {
  const { bmi, wingspanToHeightRatio } = deriveMetrics(input)
  return {
    heightInches: num(input.heightInches),
    weightLbs: num(input.weightLbs),
    wingspanInches: num(input.wingspanInches),
    age: num(input.age),
    experienceLevel: str(input.experienceLevel),
    bodyType: str(input.bodyType),
    athleticAbility: num(input.athleticAbility),
    dominantHand: str(input.dominantHand),
    shootingStyle: str(input.shootingStyle),
    bio: str(input.bio),
    enhancedBio: str(input.enhancedBio),
    coachingTier: str(input.coachingTier),
    wingspanToHeightRatio,
    bmi,
    profileComplete: input.profileComplete ?? false,
    pointsState: (input.pointsState as object) || undefined,
  }
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
  const profileComplete = input.profileComplete ?? false

  try {
    // Scope strictly to the session user's id — never a body/query value.
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.userId },
      update: data,
      create: { userId: user.userId, ...data },
    })

    // Keep the User.profileComplete flag in sync.
    await prisma.user
      .update({ where: { id: user.userId }, data: { profileComplete } })
      .catch((e) => console.error("Failed to sync User.profileComplete:", e))

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
