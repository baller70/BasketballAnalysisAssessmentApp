import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
}))

vi.mock("@/lib/auth/currentUser", () => ({
  resolveProfileId: mocks.resolveProfileId,
  isError: (result: { error?: NextResponse }) => Boolean(result.error),
}))

vi.mock("@/lib/csrf", () => ({
  validateCsrf: vi.fn(() => null),
}))

vi.mock("@/lib/prisma", () => ({
  prisma: {
    captureSession: { findFirst: mocks.findFirst },
    shotEvent: { findMany: mocks.findMany, create: mocks.create },
    $transaction: mocks.transaction,
  },
}))

import { GET, POST } from "@/app/api/shot-events/route"

const request = (method: string, body?: unknown) => new NextRequest("http://shotiq.test/api/shot-events", {
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
  headers: body === undefined ? undefined : { "content-type": "application/json" },
})

describe("shot event persistence API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveProfileId.mockResolvedValue({ profileId: "profile-1" })
    mocks.findFirst.mockResolvedValue({ id: "capture-1" })
    mocks.transaction.mockImplementation(async (operations: Promise<unknown>[]) => Promise.all(operations))
    mocks.create.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      id: "shot-1",
      ...data,
      confidence: data.confidence,
      corrections: [],
    }))
  })

  it("creates durable detector rows and marks low confidence as review-only", async () => {
    const response = await POST(request("POST", {
      captureSessionId: "capture-1",
      events: [{
        sequence: 0,
        timestampMs: 1200,
        detectedResult: "make",
        confidence: 0.35,
      }],
    }))

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.shotEvents[0].id).toBe("shot-1")
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userProfileId: "profile-1",
        captureSessionId: "capture-1",
        confidence: 0.35,
        metadata: expect.objectContaining({ trusted: false, reviewOnly: true }),
      }),
    }))
  })

  it("scopes persisted event reads to the signed-in profile", async () => {
    mocks.findMany.mockResolvedValue([])
    const response = await GET(request("GET"))
    expect(response.status).toBe(200)
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userProfileId: "profile-1", captureSessionId: undefined },
    }))
  })
})

