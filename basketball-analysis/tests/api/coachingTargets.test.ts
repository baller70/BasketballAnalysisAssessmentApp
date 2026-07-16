import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  validateCsrf: vi.fn(),
  resolveProfileId: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  updateMany: vi.fn(),
  create: vi.fn(),
  findAnalysis: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/csrf", () => ({
  validateCsrf: mocks.validateCsrf,
}))

vi.mock("@/lib/auth/currentUser", () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    coachingTarget: {
      findFirst: mocks.findFirst,
      update: mocks.update,
      updateMany: mocks.updateMany,
      create: mocks.create,
    },
    analysisHistory: {
      findFirst: mocks.findAnalysis,
    },
    $transaction: mocks.transaction,
  },
}))

import { PATCH, POST } from "@/app/api/coaching-targets/route"

const request = (url: string, method: "POST" | "PATCH", body: unknown) => new NextRequest(url, {
  method,
  body: JSON.stringify(body),
  headers: { "content-type": "application/json" },
})

const storedTarget = (overrides: Record<string, unknown> = {}) => ({
  id: "target-1",
  userProfileId: "profile-1",
  flaw: "Elbow Flare",
  cue: "Keep your elbow under the ball.",
  drillId: "elbow-drill",
  drillName: "Elbow Alignment",
  metric: "elbowAngle",
  baseline: 18,
  targetValue: 10,
  direction: "decrease",
  confidence: 0.9,
  status: "active",
  retestValue: null,
  retestedAt: null,
  ...overrides,
})

describe("coaching target mutation guards and fallbacks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.validateCsrf.mockReturnValue(null)
    mocks.resolveProfileId.mockResolvedValue({ profileId: "profile-1" })
    mocks.updateMany.mockResolvedValue({ count: 0 })
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      coachingTarget: {
        updateMany: mocks.updateMany,
        create: mocks.create,
      },
    }))
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => storedTarget(data))
  })

  it("requires CSRF before POST authentication or persistence", async () => {
    mocks.validateCsrf.mockReturnValue(NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 }))

    const response = await POST(request("http://shotiq.test/api/coaching-targets", "POST", { flaws: ["elbow_flare"] }))

    expect(response.status).toBe(403)
    expect(mocks.resolveProfileId).not.toHaveBeenCalled()
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("requires CSRF before PATCH authentication or persistence", async () => {
    mocks.validateCsrf.mockReturnValue(NextResponse.json({ error: "Invalid or missing CSRF token" }, { status: 403 }))

    const response = await PATCH(request("http://shotiq.test/api/coaching-targets", "PATCH", {
      targetId: "target-1",
      retestValue: 9,
    }))

    expect(response.status).toBe(403)
    expect(mocks.resolveProfileId).not.toHaveBeenCalled()
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("uses the selected rule metric for history fallback, not an unrelated score", async () => {
    mocks.findAnalysis.mockResolvedValue({
      elbowAngle: null,
      kneeAngle: null,
      releaseAngle: null,
      balanceScore: null,
      formScore: 96,
      consistencyScore: null,
    })

    const response = await POST(request("http://shotiq.test/api/coaching-targets", "POST", {
      flaws: ["elbow_flare"],
    }))

    expect(response.status).toBe(201)
    expect(mocks.findAnalysis).toHaveBeenCalledTimes(1)
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        metric: "elbowAngle",
        baseline: 18,
      }),
    })
  })

  it("rejects a corrupt stored direction before evaluating a retest", async () => {
    mocks.findFirst.mockResolvedValue(storedTarget({ direction: "sideways" }))

    const response = await POST(request("http://shotiq.test/api/coaching-targets", "POST", {
      targetId: "target-1",
      retestValue: 12,
    }))

    expect(response.status).toBe(422)
    expect(mocks.update).not.toHaveBeenCalled()
  })
})
