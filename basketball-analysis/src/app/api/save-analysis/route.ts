/* eslint-disable @typescript-eslint/no-explicit-any */
import { createHash } from "crypto"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { resolveProfileId, isError } from "@/lib/auth/currentUser"
import { uploadMedia } from "@/lib/storage"
import { validateCsrf } from "@/lib/csrf"
import { recordEarn } from "@/lib/points/recordEarn"

interface SaveAnalysisRequest {
  clientSessionId: string
  recordedAt: string
  mediaType: "image" | "video"
  captureSessionId?: string | null
  imageUrl?: string
  imageData?: string
  annotatedImageData?: string
  s3Path?: string
  roboflowPoseData?: Record<string, unknown>
  roboflowDetection?: Record<string, unknown>
  shootingPhase?: string
  elbowAngle?: number
  kneeAngle?: number
  wristAngle?: number
  shoulderAngle?: number
  hipAngle?: number
  releaseAngle?: number
  /** The dip: deepest knee bend in the clip, not the release frame's knee. */
  kneeAngleMin?: number
  // The four derived KEY MEASUREMENTS (lib/vision/derivedMetrics.ts). Every one
  // is optional and stays NULL when the client could not measure it — a length
  // needs the player's profile height for scale, and jump needs a video.
  releaseHeightInches?: number
  releaseDistanceInches?: number
  verticalJumpInches?: number
  centerlineDeviationDeg?: number
  visionAnalysis?: Record<string, unknown>
  bodyPositions?: Record<string, unknown>
  annotatedImageUrl?: string
  annotatedS3Path?: string
  visualOverlays?: Record<string, unknown>
  overallScore?: number
  formScore?: number
  balanceScore?: number
  releaseScore?: number
  consistencyScore?: number
  strengths?: string[]
  improvements?: string[]
  drills?: Array<{ name: string; purpose: string; reps: string }>
  coachingNotes?: string
  matchedShooterId?: number
  matchConfidence?: number
  similarShooters?: Array<{ id: number; name: string; similarity: number }>
}

class RequestValidationError extends Error {}

function requireString(value: unknown, name: string, maxLength = 191): string {
  if (typeof value !== "string" || !value.trim() || value.length > maxLength) {
    throw new RequestValidationError(`${name} is invalid`)
  }
  return value.trim()
}

function optionalString(value: unknown, name: string, maxLength = 500): string | undefined {
  if (value == null || value === "") return undefined
  if (typeof value !== "string" || value.length > maxLength) {
    throw new RequestValidationError(`${name} is invalid`)
  }
  return value
}

function optionalNumber(
  value: unknown,
  name: string,
  minimum: number,
  maximum: number,
): number | undefined {
  if (value == null) return undefined
  if (typeof value !== "number" || !Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RequestValidationError(`${name} is invalid`)
  }
  return value
}

function parseSaveAnalysisRequest(value: unknown): SaveAnalysisRequest {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new RequestValidationError("Request body is invalid")
  }
  const body = value as Record<string, unknown>
  const recordedAt = requireString(body.recordedAt, "recordedAt", 64)
  const parsedDate = new Date(recordedAt)
  if (Number.isNaN(parsedDate.getTime())) {
    throw new RequestValidationError("recordedAt is invalid")
  }
  if (body.mediaType !== "image" && body.mediaType !== "video") {
    throw new RequestValidationError("mediaType is invalid")
  }

  const stringArray = (input: unknown, name: string): string[] | undefined => {
    if (input == null) return undefined
    if (!Array.isArray(input) || input.some((item) => typeof item !== "string")) {
      throw new RequestValidationError(`${name} is invalid`)
    }
    return input.slice(0, 100) as string[]
  }

  return {
    ...(body as unknown as SaveAnalysisRequest),
    clientSessionId: requireString(body.clientSessionId, "clientSessionId"),
    recordedAt: parsedDate.toISOString(),
    mediaType: body.mediaType,
    captureSessionId: body.captureSessionId === null
      ? null
      : optionalString(body.captureSessionId, "captureSessionId", 191),
    imageUrl: optionalString(body.imageUrl, "imageUrl"),
    imageData: optionalString(body.imageData, "imageData", 15_000_000),
    annotatedImageData: optionalString(body.annotatedImageData, "annotatedImageData", 15_000_000),
    annotatedImageUrl: optionalString(body.annotatedImageUrl, "annotatedImageUrl"),
    s3Path: optionalString(body.s3Path, "s3Path"),
    annotatedS3Path: optionalString(body.annotatedS3Path, "annotatedS3Path"),
    shootingPhase: optionalString(body.shootingPhase, "shootingPhase", 50),
    coachingNotes: optionalString(body.coachingNotes, "coachingNotes", 20_000),
    overallScore: optionalNumber(body.overallScore, "overallScore", 0, 100),
    formScore: optionalNumber(body.formScore, "formScore", 0, 100),
    balanceScore: optionalNumber(body.balanceScore, "balanceScore", 0, 100),
    releaseScore: optionalNumber(body.releaseScore, "releaseScore", 0, 100),
    consistencyScore: optionalNumber(body.consistencyScore, "consistencyScore", 0, 100),
    elbowAngle: optionalNumber(body.elbowAngle, "elbowAngle", -360, 360),
    kneeAngle: optionalNumber(body.kneeAngle, "kneeAngle", -360, 360),
    wristAngle: optionalNumber(body.wristAngle, "wristAngle", -360, 360),
    shoulderAngle: optionalNumber(body.shoulderAngle, "shoulderAngle", -360, 360),
    hipAngle: optionalNumber(body.hipAngle, "hipAngle", -360, 360),
    releaseAngle: optionalNumber(body.releaseAngle, "releaseAngle", -360, 360),
    /* The dip. A knee joint cannot read outside 0-180 in a real pose, so a
       value beyond that is a broken measurement rather than a deep squat. */
    kneeAngleMin: optionalNumber(body.kneeAngleMin, "kneeAngleMin", 0, 180),
    // Ranges are generous but real: a release above 15ft or a 6ft vertical is a
    // broken measurement, not an athlete, and must be rejected at the door.
    releaseHeightInches: optionalNumber(body.releaseHeightInches, "releaseHeightInches", 0, 180),
    releaseDistanceInches: optionalNumber(body.releaseDistanceInches, "releaseDistanceInches", 0, 120),
    verticalJumpInches: optionalNumber(body.verticalJumpInches, "verticalJumpInches", 0, 72),
    centerlineDeviationDeg: optionalNumber(body.centerlineDeviationDeg, "centerlineDeviationDeg", 0, 90),
    matchedShooterId: optionalNumber(body.matchedShooterId, "matchedShooterId", 1, 2_147_483_647),
    matchConfidence: optionalNumber(body.matchConfidence, "matchConfidence", 0, 1),
    strengths: stringArray(body.strengths, "strengths"),
    improvements: stringArray(body.improvements, "improvements"),
  }
}

function deterministicMediaStem(userProfileId: string, clientSessionId: string): string {
  const digest = createHash("sha256").update(clientSessionId).digest("hex").slice(0, 24)
  return `user-uploads/${userProfileId}/analyses/${digest}`
}

/** POST /api/save-analysis — idempotently persist one client analysis session. */
export async function POST(request: NextRequest) {
  const csrfError = validateCsrf(request)
  if (csrfError) return csrfError

  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId

  try {
    const body = parseSaveAnalysisRequest(await request.json())
    const recordedAt = new Date(body.recordedAt)
    const mediaStem = deterministicMediaStem(userProfileId, body.clientSessionId)

    const result = await prisma.$transaction(async (tx) => {
      // Serialize a user's writes so two devices cannot race the same history
      // chronology or duplicate the same deterministic media upload.
      // PostgreSQL reports pg_advisory_xact_lock as `void`. Prisma cannot
      // deserialize a raw `void` column, so cast it to text while preserving
      // the transaction-scoped locking side effect.
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${userProfileId}))::text AS lock_result`

      const existing = await tx.userAnalysis.findUnique({
        where: {
          userProfileId_clientSessionId: {
            userProfileId,
            clientSessionId: body.clientSessionId,
          },
        },
        select: {
          id: true,
          imageUrl: true,
          annotatedImageUrl: true,
          captureSessionId: true,
          videoUrl: true,
          videoS3Path: true,
        },
      })

      // The multipart upload can finish before or after this analysis write.
      // The shared user + clientSession identity is the only join key, so a
      // late retry can never attach its video to a newer analysis.
      const completedMediaUpload = await tx.mediaUpload.findUnique({
        where: {
          userProfileId_clientSessionId: {
            userProfileId,
            clientSessionId: body.clientSessionId,
          },
        },
        select: {
          id: true,
          status: true,
          objectKey: true,
          mediaUrl: true,
          analysisId: true,
        },
      })
      const completedVideo = completedMediaUpload?.status === "complete" && completedMediaUpload.mediaUrl
        ? completedMediaUpload
        : null

      let imageUrl = existing?.imageUrl ?? body.imageUrl ?? undefined
      if (!imageUrl && body.imageData) {
        try {
          imageUrl = await uploadMedia(body.imageData, `${mediaStem}-shot.jpg`, "image/jpeg")
        } catch (error) {
          console.error("save-analysis: image upload failed", error)
        }
      }

      let annotatedImageUrl = existing?.annotatedImageUrl ?? body.annotatedImageUrl ?? undefined
      if (!annotatedImageUrl && body.annotatedImageData) {
        try {
          annotatedImageUrl = await uploadMedia(
            body.annotatedImageData,
            `${mediaStem}-annotated.jpg`,
            "image/jpeg",
          )
        } catch (error) {
          console.error("save-analysis: annotated upload failed", error)
        }
      }

      let matchedShooterId: number | undefined
      if (body.matchedShooterId !== undefined) {
        const shooter = await tx.shooter.findUnique({
          where: { id: body.matchedShooterId },
          select: { id: true },
        })
        matchedShooterId = shooter?.id
      }

      const persisted = {
        mediaType: body.mediaType,
        // Capture identity is monotonic: a late durable id must never be
        // cleared by an older background request that still carries null.
        captureSessionId: body.captureSessionId ?? existing?.captureSessionId ?? null,
        imageUrl,
        s3Path: body.s3Path,
        videoUrl: existing?.videoUrl ?? completedVideo?.mediaUrl ?? undefined,
        videoS3Path: existing?.videoS3Path ?? completedVideo?.objectKey ?? undefined,
        roboflowPoseData: body.roboflowPoseData as any,
        roboflowDetection: body.roboflowDetection as any,
        shootingPhase: body.shootingPhase,
        elbowAngle: body.elbowAngle,
        kneeAngle: body.kneeAngle,
        wristAngle: body.wristAngle,
        shoulderAngle: body.shoulderAngle,
        hipAngle: body.hipAngle,
        releaseAngle: body.releaseAngle,
        kneeAngleMin: body.kneeAngleMin,
        releaseHeightInches: body.releaseHeightInches,
        releaseDistanceInches: body.releaseDistanceInches,
        verticalJumpInches: body.verticalJumpInches,
        centerlineDeviationDeg: body.centerlineDeviationDeg,
        visionAnalysis: body.visionAnalysis as any,
        bodyPositions: body.bodyPositions as any,
        annotatedImageUrl,
        annotatedS3Path: body.annotatedS3Path,
        visualOverlays: body.visualOverlays as any,
        overallScore: body.overallScore,
        formScore: body.formScore,
        balanceScore: body.balanceScore,
        releaseScore: body.releaseScore,
        consistencyScore: body.consistencyScore,
        strengths: body.strengths as any,
        improvements: body.improvements as any,
        drills: body.drills as any,
        coachingNotes: body.coachingNotes,
        matchedShooterId,
        matchConfidence: body.matchConfidence,
        similarShooters: body.similarShooters as any,
        processingStatus: "completed",
      }

      const analysis = await tx.userAnalysis.upsert({
        where: {
          userProfileId_clientSessionId: {
            userProfileId,
            clientSessionId: body.clientSessionId,
          },
        },
        create: {
          userProfileId,
          clientSessionId: body.clientSessionId,
          ...persisted,
        },
        update: persisted,
      })

      if (completedVideo && completedVideo.analysisId !== analysis.id) {
        await tx.mediaUpload.update({
          where: { id: completedVideo.id },
          data: { analysisId: analysis.id },
        })
      }

      /* ONE HISTORY ROW PER ANALYSIS, ALWAYS. THIS IS THE INVARIANT.
         This used to run only when an overall score was present — it had to,
         because analysis_history.overall_score was NOT NULL. So an analysis
         that produced angles but no score existed in `user_analyses` and
         nowhere else, and the two halves of the app disagreed about whether
         that day happened: the history screen and the overview's "N OF M"
         missed it, and it counted toward no streak and no consistency goal,
         because the goal evaluator and the badge engine read the other table.

         The guard is gone rather than merely loosened. Any condition here is
         another way for the two tables to drift apart, and a session the
         player did belongs in their timeline whether or not anything could be
         measured from it — the date alone is what a streak is made of. The
         column is nullable now, so an unscored session records honestly. */
      {
        await tx.analysisHistory.upsert({
          where: { analysisId: analysis.id },
          create: {
            userProfileId,
            analysisId: analysis.id,
            analysisDate: recordedAt,
            // `undefined` would make Prisma skip the column; this row exists
            // precisely to record a session that may have no score.
            overallScore: body.overallScore ?? null,
            formScore: body.formScore,
            balanceScore: body.balanceScore,
            releaseScore: body.releaseScore,
            consistencyScore: body.consistencyScore,
            elbowAngle: body.elbowAngle,
            kneeAngle: body.kneeAngle,
            releaseAngle: body.releaseAngle,
          },
          update: {
            analysisDate: recordedAt,
            // `undefined` would make Prisma skip the column; this row exists
            // precisely to record a session that may have no score.
            overallScore: body.overallScore ?? null,
            formScore: body.formScore,
            balanceScore: body.balanceScore,
            releaseScore: body.releaseScore,
            consistencyScore: body.consistencyScore,
            elbowAngle: body.elbowAngle,
            kneeAngle: body.kneeAngle,
            releaseAngle: body.releaseAngle,
          },
        })

        // Recompute in chronological order, including the row immediately
        // after an inserted backdated session. This keeps scoreChange honest.
        const chronological = await tx.analysisHistory.findMany({
          where: { userProfileId },
          orderBy: [{ analysisDate: "asc" }, { createdAt: "asc" }, { id: "asc" }],
          select: { id: true, overallScore: true, scoreChange: true },
        })
        /* Chain each scored session to the PREVIOUS SCORED one, skipping the
           unscored rows this table can now hold — the same rule as the
           recompute in /api/analysis-history. Subtracting straight from the
           row before would read `Number(null)` as 0 and write a delta of -84
           or +84 as soon as an unscored session landed between two scored
           ones, and an unscored row has no score change of its own. */
        let previousScored: { overallScore: unknown } | null = null
        for (let index = 0; index < chronological.length; index += 1) {
          const current = chronological[index]
          const scoreChange = current.overallScore == null || previousScored == null
            ? null
            : Number(current.overallScore) - Number(previousScored.overallScore)
          if (current.overallScore != null) previousScored = current
          const storedScoreChange = current.scoreChange == null ? null : Number(current.scoreChange)
          if (storedScoreChange === scoreChange) continue
          await tx.analysisHistory.update({
            where: { id: current.id },
            data: { scoreChange },
          })
        }
      }

      return { analysis, imageUrl, annotatedImageUrl }
    }, { maxWait: 10_000, timeout: 30_000 })

    /* THE POINTS FEATURE HAD NO TRIGGER. The ledger table, /api/points, the
       tier maths, the badge grid and the context's `earnPoints` all existed and
       nothing in the app called any of them, so every points figure on every
       screen was decoration over an empty table.

       This is the earn, tied to a VERIFIED SERVER EVENT — a row actually
       written — which is what /api/points' own docstring says the design is
       for ("earns fired on UI clicks rather than verified activity"). Awarding
       here rather than in the browser also means an iOS capture earns exactly
       like a web upload; both platforms post to this one route.

       Keyed on clientSessionId, which this route is already idempotent by, so
       the upload queue retrying a shot cannot pay for it twice. `recordEarn`
       never throws: a points failure must not turn a saved analysis into an
       error the player sees, so the outcome is reported and nothing else. */
    const earn = await recordEarn(
      userProfileId,
      body.mediaType === "video" ? "upload_video" : "upload_image",
      { analysisId: result.analysis.id, mediaType: body.mediaType },
      body.clientSessionId,
    )

    return NextResponse.json({
      success: true,
      analysisId: result.analysis.id,
      clientSessionId: body.clientSessionId,
      imageUrl: result.imageUrl,
      annotatedImageUrl: result.annotatedImageUrl,
      pointsEarned: earn.earned ? earn.points : 0,
      message: "Analysis saved successfully",
    })
  } catch (error) {
    if (error instanceof RequestValidationError || error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: error.message || "Request body is invalid" },
        { status: 400 },
      )
    }
    console.error("Save analysis error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to save analysis" },
      { status: 500 },
    )
  }
}

/** GET /api/save-analysis?id=xxx — get one caller-owned analysis. */
export async function GET(request: NextRequest) {
  const resolved = await resolveProfileId(request)
  if (isError(resolved)) return resolved.error
  const userProfileId = resolved.profileId
  const analysisId = request.nextUrl.searchParams.get("id")

  if (!analysisId) {
    return NextResponse.json({ success: false, error: "Analysis ID required" }, { status: 400 })
  }

  try {
    const analysis = await prisma.userAnalysis.findFirst({
      where: { id: analysisId, userProfileId },
      include: {
        userProfile: {
          select: {
            heightInches: true,
            bodyType: true,
            experienceLevel: true,
            coachingTier: true,
          },
        },
      },
    })
    if (!analysis) {
      return NextResponse.json({ success: false, error: "Analysis not found" }, { status: 404 })
    }
    return NextResponse.json({ success: true, analysis })
  } catch (error) {
    console.error("Get analysis error:", error)
    return NextResponse.json({ success: false, error: "Failed to retrieve analysis" }, { status: 500 })
  }
}
