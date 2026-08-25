import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  findFirst: vi.fn(),
}))

vi.mock("@/lib/auth/currentUser", () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    userAnalysis: { findFirst: mocks.findFirst },
  },
}))

import { GET } from "@/app/api/analysis/latest/route"

function request() {
  return new NextRequest("http://shotiq.test/api/analysis/latest")
}

describe("GET /api/analysis/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveProfileId.mockResolvedValue({ profileId: "profile-1" })
  })

  it("returns the shared analysis result contract with measured provenance", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "analysis-1",
      createdAt: new Date("2026-08-07T12:00:00.000Z"),
      mediaType: "video",
      overallScore: 84,
      formScore: 82,
      balanceScore: null,
      releaseScore: 80,
      consistencyScore: null,
      shootingPhase: "release",
      coachingNotes: "Keep elbow stacked.",
      clientSessionId: "ios-shot-1",
      captureSessionId: "capture-1",
      imageUrl: "https://media.test/shot.jpg",
      annotatedImageUrl: "https://media.test/shot-annotated.jpg",
      videoUrl: "https://media.test/shot.mov",
      elbowAngle: 161,
      kneeAngle: null,
      wristAngle: 72,
      shoulderAngle: null,
      hipAngle: null,
      releaseAngle: -3,
      kneeAngleMin: 88,
      releaseHeightInches: 92,
      releaseDistanceInches: null,
      verticalJumpInches: null,
      centerlineDeviationDeg: 4,
      roboflowPoseData: { keypoints: [] },
      roboflowDetection: null,
      visualOverlays: { skeleton: true },
      strengths: ["High release"],
      improvements: ["Elbow drift"],
      drills: [{ name: "Elbow Stack Holds" }],
      matchedShooterId: 12,
      matchConfidence: 0.88,
      similarShooters: [{ id: 12, name: "Klay Thompson" }],
    })

    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.analysis).toMatchObject({
      overallScore: 84,
      angles: { elbow: 161, release: -3 },
      measured: expect.arrayContaining(["elbow", "release"]),
    })
    expect(payload.analysisResult).toMatchObject({
      id: "analysis-1",
      source: "ios",
      media: {
        type: "video",
        displayImageUrl: "https://media.test/shot-annotated.jpg",
        videoUrl: "https://media.test/shot.mov",
      },
      scores: {
        overall: { value: 84, unit: "score", source: "measured" },
        form: { value: 82, unit: "score", source: "measured" },
        balance: { value: null, unit: "score", source: "missing" },
      },
      angles: {
        elbow: { value: 161, unit: "deg", source: "measured" },
        release: { value: -3, unit: "deg", source: "measured" },
      },
      phase: { value: "release", unit: null, source: "measured" },
    })
    expect(payload.analysisResult.provenance.measured).toContain("scores.form")
    expect(payload.analysisResult.provenance.measured).toContain("angles.elbow")
    expect(payload.analysisResult.provenance.missing).toContain("scores.balance")
    expect(payload.analysisResult.provenance.demo).toEqual([])
  })

  it("returns null analysis instead of demo data for a new user", async () => {
    mocks.findFirst.mockResolvedValue(null)

    const response = await GET(request())
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ success: true, analysis: null, analysisResult: null })
  })
})
