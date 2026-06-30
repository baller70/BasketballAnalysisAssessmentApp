import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"
import { uploadMedia } from "@/lib/storage"

/**
 * /api/settings — server-backed user settings.
 *
 * Audit fix: settings used to live only in localStorage (no-op toggles, fake
 * "Active" automation widget, base64 avatar stuffed into localStorage). This
 * route persists notifications / privacy / automation preferences and the
 * avatar URL to the `UserSettings` table, keyed to the caller's UserProfile.
 *
 * Auth: the owning profile is derived from the session token via
 * resolveProfileId — never from the body/query — so a user can only read or
 * mutate their own settings (IDOR-safe). All mutations require a valid CSRF
 * token.
 */

// ── Canonical server-side defaults ────────────────────────────────────────────
// Kept in sync with the client UI. Returned for brand-new accounts that have no
// UserSettings row yet, and used to backfill missing keys.

const DEFAULT_NOTIFICATIONS = {
  weeklyReportEmail: true,
  monthlyReportEmail: true,
  coachAlertEmail: true,
  milestoneEmail: true,
  improvementAlertEmail: true,
  milestonePush: true,
  coachingTipsPush: true,
  improvementAlertPush: true,
  motivationalMessagesPush: true,
  reminderPush: false,
  coachingTipsFrequency: "2x_week",
  motivationalFrequency: "2x_week",
  reminderTime: "18:00",
  reportFormat: "detailed",
  includeCharts: true,
  includeComparison: true,
} as const

const DEFAULT_PRIVACY = {
  allowAnonymousAnalytics: true,
  includeInPeerComparisons: true,
  shareProgressWithCoach: true,
} as const

const DEFAULT_AUTOMATION = {
  analyticsRefreshEnabled: true,
  analyticsRefreshTime: "02:00",
  dataBackupEnabled: true,
  dataBackupTime: "03:00",
  modelUpdateEnabled: true,
  weeklyReportEnabled: true,
  weeklyReportDay: "monday",
  weeklyReportTime: "08:00",
  coachAlertsEnabled: true,
  monthlyAnalysisEnabled: true,
  milestoneNotificationsEnabled: true,
} as const

type JsonObject = Record<string, unknown>

function isPlainObject(value: unknown): value is JsonObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  )
}

/** Merge a stored/partial JSON blob over defaults so the UI always gets every key. */
function withDefaults<T extends JsonObject>(
  defaults: T,
  stored: unknown
): T {
  if (!isPlainObject(stored)) return { ...defaults }
  return { ...defaults, ...stored }
}

// Avatar guards: keep uploads sane and reject non-images / oversized payloads.
const MAX_AVATAR_BYTES = 5 * 1024 * 1024 // 5MB
const DATA_URL_RE = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/
const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
}

/**
 * GET /api/settings
 *
 * Returns the caller's persisted settings (defaults merged in for missing keys)
 * plus the stored avatarUrl.
 */
export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const row = await prisma.userSettings.findUnique({
      where: { userProfileId },
    })

    return NextResponse.json({
      success: true,
      settings: {
        notifications: withDefaults(DEFAULT_NOTIFICATIONS, row?.notifications),
        privacy: withDefaults(DEFAULT_PRIVACY, row?.privacy),
        automation: withDefaults(DEFAULT_AUTOMATION, row?.automation),
        avatarUrl: row?.avatarUrl ?? null,
      },
    })
  } catch (error) {
    console.error("GET /api/settings error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to load settings" },
      { status: 500 }
    )
  }
}

interface PutBody {
  notifications?: unknown
  privacy?: unknown
  automation?: unknown
  // Either a data-URL to upload (server stores via uploadMedia), or
  // removeAvatar:true to clear it. Avatars are NEVER stored as base64 — only
  // the resulting object-storage URL is persisted.
  avatarData?: string
  removeAvatar?: boolean
}

/**
 * PUT /api/settings
 *
 * Upserts the caller's settings. Accepts partial updates: only the provided
 * sections are written. Avatar uploads go through object storage; the URL is
 * persisted to UserSettings.avatarUrl.
 */
export async function PUT(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  let body: PutBody
  try {
    body = (await request.json()) as PutBody
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  // Build the partial update. Each JSON section is merged over defaults so we
  // never persist a half-formed blob, and unknown keys are dropped implicitly
  // by the client shape (we still store extra keys harmlessly).
  const data: {
    notifications?: Prisma.InputJsonValue
    privacy?: Prisma.InputJsonValue
    automation?: Prisma.InputJsonValue
    avatarUrl?: string | null
  } = {}

  if (body.notifications !== undefined) {
    if (!isPlainObject(body.notifications)) {
      return NextResponse.json(
        { success: false, error: "notifications must be an object" },
        { status: 400 }
      )
    }
    data.notifications = withDefaults(DEFAULT_NOTIFICATIONS, body.notifications)
  }

  if (body.privacy !== undefined) {
    if (!isPlainObject(body.privacy)) {
      return NextResponse.json(
        { success: false, error: "privacy must be an object" },
        { status: 400 }
      )
    }
    data.privacy = withDefaults(DEFAULT_PRIVACY, body.privacy)
  }

  if (body.automation !== undefined) {
    if (!isPlainObject(body.automation)) {
      return NextResponse.json(
        { success: false, error: "automation must be an object" },
        { status: 400 }
      )
    }
    data.automation = withDefaults(DEFAULT_AUTOMATION, body.automation)
  }

  // Avatar handling.
  if (body.removeAvatar) {
    data.avatarUrl = null
  } else if (typeof body.avatarData === "string" && body.avatarData.length > 0) {
    const match = body.avatarData.match(DATA_URL_RE)
    if (!match) {
      return NextResponse.json(
        { success: false, error: "avatarData must be an image data URL" },
        { status: 400 }
      )
    }
    const mime = match[1].toLowerCase()
    const ext = EXT_BY_MIME[mime]
    if (!ext) {
      return NextResponse.json(
        { success: false, error: "Unsupported image type" },
        { status: 400 }
      )
    }
    // Validate decoded size before uploading.
    const approxBytes = Math.floor((match[2].length * 3) / 4)
    if (approxBytes > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { success: false, error: "Image must be less than 5MB" },
        { status: 413 }
      )
    }
    try {
      const key = `user-uploads/${userProfileId}/${Date.now()}-avatar.${ext}`
      const url = await uploadMedia(body.avatarData, key, mime)
      data.avatarUrl = url
    } catch (error) {
      console.error("Avatar upload failed:", error)
      return NextResponse.json(
        { success: false, error: "Failed to upload avatar" },
        { status: 500 }
      )
    }
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json(
      { success: false, error: "No settings provided" },
      { status: 400 }
    )
  }

  try {
    const row = await prisma.userSettings.upsert({
      where: { userProfileId },
      update: data,
      create: { userProfileId, ...data },
    })

    return NextResponse.json({
      success: true,
      settings: {
        notifications: withDefaults(DEFAULT_NOTIFICATIONS, row.notifications),
        privacy: withDefaults(DEFAULT_PRIVACY, row.privacy),
        automation: withDefaults(DEFAULT_AUTOMATION, row.automation),
        avatarUrl: row.avatarUrl ?? null,
      },
    })
  } catch (error) {
    console.error("PUT /api/settings error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to save settings" },
      { status: 500 }
    )
  }
}
