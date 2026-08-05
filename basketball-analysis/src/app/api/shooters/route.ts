import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth/currentUser"
import { validateCsrf } from "@/lib/csrf"
import {
  ALL_ELITE_SHOOTERS,
  type EliteShooter,
} from "@/data/eliteShooters"

/**
 * ============================================================================
 *  GET /api/shooters  —  THE single, DB-backed reference-shooter endpoint.
 * ============================================================================
 *
 * WHY THIS EXISTS
 * ---------------
 * The app previously carried FOUR disjoint shooter datasets (a 328-entry static
 * catalog, a 30-entry static DB, a 10-entry API-embedded list, and a 12-entry
 * Prisma seed) that disagreed with each other. This endpoint consolidates them
 * into ONE source of truth: it reads the persisted `Shooter` + `ShootingBiomechanics`
 * tables (seeded from the richest catalog via prisma/seed.ts) and returns a single
 * stable, documented shape.
 *
 * CONSUMERS
 * ---------
 *  - src/app/elite-shooters/page.tsx (browser / similarity sort)
 *  - the Comparison feature ("Comparison agent") — DO NOT break the response
 *    shape below without coordinating; treat `apiVersion` as the contract marker.
 *
 * RESPONSE SHAPE  (apiVersion "1.0")
 * ----------------------------------
 * {
 *   success: boolean,
 *   apiVersion: "1.0",
 *   source: "database" | "static-fallback",   // where the data came from
 *   count: number,
 *   generatedAt: string,                        // ISO timestamp
 *   shooters: ApiShooter[]
 * }
 *
 * ApiShooter = {
 *   id: number,                 // stable catalog id (use for display keys)
 *   dbId: number | null,        // Prisma Shooter.id when persisted, else null
 *   name, team, league, era, tier, position,
 *   height, weight, wingspan, bodyType,        // inches / lbs
 *   careerPct: number | null,                  // career 3PT% (legacy field name)
 *   careerFreeThrowPct: number,
 *   careerFieldGoalPct: number | null,         // 0-100, DB-only (catalog has none)
 *   careerThreePct: number | null,             // 0-100, same value as careerPct
 *   careerEfgPct: number | null,               // 0-100, computed from box-score totals
 *   careerTsPct: number | null,                // 0-100, computed from box-score totals
 *   achievements: string | null,
 *   keyTraits: string[],
 *   shootingStyle: string,
 *   photoUrl: string | null,
 *   bio: string | null,
 *   shootingFormImages: string[],              // catalog form images (post-approval)
 *   overallScore: number,
 *   formCategory: "EXCELLENT" | "GOOD" | "NEEDS WORK",
 *   measurements: {                            // angles in degrees, heights in inches
 *     shoulderAngle, elbowAngle, hipAngle, kneeAngle,
 *     ankleAngle, releaseHeight, releaseAngle, entryAngle
 *   },
 *   biomechanicsEstimated: boolean,            // HONESTY: true => tier-derived estimate
 *   biomechanicsSource: "tier-estimated" | "measured",
 *   approvedFormImages: string[],              // admin-approved extras (server-persisted)
 *   excludedFormImages: string[]               // admin-hidden images (server-persisted)
 * }
 *
 * HONESTY NOTE
 * ------------
 * The reference biomechanics in this app are tier-derived estimates, not
 * frame-measured from each shooter's video. Every record is therefore returned
 * with biomechanicsEstimated=true / biomechanicsSource="tier-estimated". A record
 * only flips to "measured" if its catalog entry sets biomechanicsEstimated=false.
 *
 * ============================================================================
 *  POST /api/shooters  —  persist admin shooting-form approvals (server-side).
 * ============================================================================
 * Replaces the previous localStorage-only approval store. Requires a valid
 * session + CSRF token (these write to SHARED reference tables, so they are
 * gated to authenticated callers; see remainingIssues for admin-role hardening).
 *
 * Body: { name: string, imageUrl: string, action: "approve"|"exclude"|"unapprove"|"include" }
 *  - approve   : add imageUrl to the shooter's approved gallery (clears any exclude)
 *  - exclude   : hide imageUrl from the shooter's gallery (clears any approve)
 *  - unapprove : remove a prior approval
 *  - include   : remove a prior exclusion
 * Returns: { success, approvedFormImages, excludedFormImages }
 */

const API_VERSION = "1.0"
const CAT_APPROVED = "approved_form"
const CAT_EXCLUDED = "excluded_form"

type Measurements = EliteShooter["measurements"]

interface ApiShooter extends Omit<EliteShooter, "biomechanicsEstimated"> {
  dbId: number | null
  biomechanicsEstimated: boolean
  biomechanicsSource: "tier-estimated" | "measured"
  approvedFormImages: string[]
  excludedFormImages: string[]
  careerFieldGoalPct: number | null
  careerThreePct: number | null
  careerEfgPct: number | null
  careerTsPct: number | null
  careerThreeMade: number | null
  careerThreeAttempts: number | null
}

const norm = (s: string) => s.trim().toLowerCase()
const num = (v: unknown): number | null =>
  v === null || v === undefined ? null : Number(v)

/**
 * Career shooting rates, all on a 0-100 scale.
 *
 * The static catalog carries only 3PT% (under the legacy name `careerPct`) and
 * FT%. FG%, eFG% and TS% need box-score totals, so they are computed from the
 * shooter's persisted `shooting_stats` rows and returned as null when those rows
 * are absent — a shooter served from the static fallback reports null for the
 * three, and the UI renders an em dash rather than a made-up number.
 *
 *   eFG% = (FGM + 0.5 * 3PM) / FGA
 *   TS%  = PTS / (2 * (FGA + 0.44 * FTA)),  PTS = 2 * FGM + 3PM + FTM
 */
function careerRates(cat: EliteShooter, db: DbShooter | undefined) {
  const totals = (db?.stats ?? []).reduce(
    (a, s) => ({
      fga: a.fga + (s.fgAttempts ?? 0),
      fgm: a.fgm + (s.fgMade ?? 0),
      tpm: a.tpm + (s.threePtMade ?? 0),
      tpa: a.tpa + (s.threePtAttempts ?? 0),
      fta: a.fta + (s.ftAttempts ?? 0),
      ftm: a.ftm + (s.ftMade ?? 0),
    }),
    { fga: 0, fgm: 0, tpm: 0, tpa: 0, fta: 0, ftm: 0 }
  )

  const efg =
    totals.fga > 0 ? ((totals.fgm + 0.5 * totals.tpm) / totals.fga) * 100 : null

  const tsDenominator = 2 * (totals.fga + 0.44 * totals.fta)
  const ts =
    tsDenominator > 0
      ? ((2 * totals.fgm + totals.tpm + totals.ftm) / tsDenominator) * 100
      : null

  const fgFromTotals = totals.fga > 0 ? (totals.fgm / totals.fga) * 100 : null

  return {
    careerFieldGoalPct: num(db?.careerFgPercentage) ?? fgFromTotals,
    careerThreePct: num(db?.career3ptPercentage) ?? cat.careerPct ?? null,
    careerEfgPct: efg,
    careerTsPct: ts,
    careerThreeMade: totals.tpm > 0 ? totals.tpm : null,
    careerThreeAttempts: totals.tpa > 0 ? totals.tpa : null,
  }
}

/** Map a catalog shooter + (optional) DB record into the public API shape. */
function toApiShooter(
  cat: EliteShooter,
  db: DbShooter | undefined
): ApiShooter {
  // Prefer persisted biomechanics when available; fall back to catalog estimate.
  const bio = db?.biomechanics
  const measurements: Measurements = bio
    ? {
        shoulderAngle: num(bio.shoulderAngle) ?? cat.measurements.shoulderAngle,
        elbowAngle: num(bio.elbowAngle) ?? cat.measurements.elbowAngle,
        hipAngle: num(bio.hipAngle) ?? cat.measurements.hipAngle,
        kneeAngle: num(bio.kneeAngle) ?? cat.measurements.kneeAngle,
        // Schema has no ankle/entry columns — keep the catalog values.
        ankleAngle: cat.measurements.ankleAngle,
        releaseHeight: num(bio.releaseHeight) ?? cat.measurements.releaseHeight,
        releaseAngle: num(bio.releaseAngle) ?? cat.measurements.releaseAngle,
        entryAngle: cat.measurements.entryAngle,
      }
    : cat.measurements

  const estimated = cat.biomechanicsEstimated !== false

  const approvedFormImages = (db?.images ?? [])
    .filter((i) => i.imageCategory === CAT_APPROVED && i.imageUrl)
    .map((i) => i.imageUrl as string)
  const excludedFormImages = (db?.images ?? [])
    .filter((i) => i.imageCategory === CAT_EXCLUDED && i.imageUrl)
    .map((i) => i.imageUrl as string)

  // Apply server-side exclusions to the catalog gallery before returning.
  const catalogForms = (cat.shootingFormImages ?? []).filter(
    (u) => !excludedFormImages.includes(u)
  )
  const shootingFormImages = Array.from(
    new Set([...catalogForms, ...approvedFormImages])
  )

  return {
    ...cat,
    dbId: db?.id ?? null,
    measurements,
    shootingFormImages,
    biomechanicsEstimated: estimated,
    biomechanicsSource: estimated ? "tier-estimated" : "measured",
    approvedFormImages,
    excludedFormImages,
    ...careerRates(cat, db),
  }
}

type DbShooter = Awaited<ReturnType<typeof loadDbShooters>>[number]

async function loadDbShooters() {
  return prisma.shooter.findMany({
    include: { biomechanics: true, images: true, stats: true },
  })
}

export async function GET() {
  try {
    let dbShooters: DbShooter[] = []
    try {
      dbShooters = await loadDbShooters()
    } catch (error) {
      // DB unreachable / not migrated — degrade gracefully to the static catalog
      // so the page is never blank. Reported as source: "static-fallback".
      console.warn("[/api/shooters] using static fallback", {
        reason: error instanceof Error ? error.name : "UnknownError",
      })
    }

    const dbByName = new Map<string, DbShooter>()
    for (const d of dbShooters) dbByName.set(norm(d.name), d)

    const shooters: ApiShooter[] = ALL_ELITE_SHOOTERS.map((cat) =>
      toApiShooter(cat, dbByName.get(norm(cat.name)))
    )

    return NextResponse.json({
      success: true,
      apiVersion: API_VERSION,
      source: dbShooters.length > 0 ? "database" : "static-fallback",
      count: shooters.length,
      generatedAt: new Date().toISOString(),
      shooters,
    })
  } catch (error) {
    console.warn("[/api/shooters] GET unavailable", {
      reason: error instanceof Error ? error.name : "UnknownError",
    })
    return NextResponse.json(
      {
        success: false,
        error:
          "Shooter catalog is temporarily unavailable",
      },
      { status: 503 }
    )
  }
}

type ApprovalAction = "approve" | "exclude" | "unapprove" | "include"

export async function POST(request: NextRequest) {
  // Mutating endpoint: CSRF first, then require an authenticated session.
  const csrf = validateCsrf(request)
  if (csrf) return csrf

  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  let body: { name?: string; imageUrl?: string; action?: ApprovalAction }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  const name = body.name?.trim()
  const imageUrl = body.imageUrl?.trim()
  const action = body.action
  if (
    !name ||
    !imageUrl ||
    !["approve", "exclude", "unapprove", "include"].includes(action ?? "")
  ) {
    return NextResponse.json(
      {
        success: false,
        error: "name, imageUrl and a valid action are required",
      },
      { status: 400 }
    )
  }

  try {
    // Resolve (or create) the Shooter row by name — the stable join key between
    // the catalog and the DB.
    const shooter = await prisma.shooter.upsert({
      where: { name },
      update: {},
      create: { name },
      select: { id: true },
    })
    const shooterId = shooter.id

    const setCategory = async (category: string) => {
      const existing = await prisma.shooterImage.findFirst({
        where: { shooterId, imageUrl, imageCategory: category },
        select: { id: true },
      })
      if (!existing) {
        await prisma.shooterImage.create({
          data: { shooterId, imageUrl, imageCategory: category },
        })
      }
    }
    const clearCategory = (category: string) =>
      prisma.shooterImage.deleteMany({
        where: { shooterId, imageUrl, imageCategory: category },
      })

    switch (action) {
      case "approve":
        await clearCategory(CAT_EXCLUDED)
        await setCategory(CAT_APPROVED)
        break
      case "exclude":
        await clearCategory(CAT_APPROVED)
        await setCategory(CAT_EXCLUDED)
        break
      case "unapprove":
        await clearCategory(CAT_APPROVED)
        break
      case "include":
        await clearCategory(CAT_EXCLUDED)
        break
    }

    const images = await prisma.shooterImage.findMany({
      where: { shooterId, imageCategory: { in: [CAT_APPROVED, CAT_EXCLUDED] } },
      select: { imageUrl: true, imageCategory: true },
    })

    return NextResponse.json({
      success: true,
      shooter: name,
      approvedFormImages: images
        .filter((i) => i.imageCategory === CAT_APPROVED && i.imageUrl)
        .map((i) => i.imageUrl as string),
      excludedFormImages: images
        .filter((i) => i.imageCategory === CAT_EXCLUDED && i.imageUrl)
        .map((i) => i.imageUrl as string),
    })
  } catch (error) {
    console.error("[/api/shooters] POST error:", error)
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to save approval",
      },
      { status: 500 }
    )
  }
}
