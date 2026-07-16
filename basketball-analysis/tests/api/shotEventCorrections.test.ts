import { NextRequest, NextResponse } from "next/server"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  resolveProfileId: vi.fn(),
  findFirst: vi.fn(),
  findMany: vi.fn(),
  create: vi.fn(),
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
    shotEvent: { findFirst: mocks.findFirst },
    shotEventCorrection: {
      findMany: mocks.findMany,
      create: mocks.create,
    },
  },
}))

import { GET, POST } from "@/app/api/shot-events/[id]/corrections/route"

const request = (method: string, body?: unknown) => new NextRequest("http://shotiq.test/api/shot-events/shot-1/corrections", {
  method,
  body: body === undefined ? undefined : JSON.stringify(body),
  headers: body === undefined ? undefined : { "content-type": "application/json" },
})

describe("shot event correction API", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.resolveProfileId.mockResolvedValue({ profileId: "profile-1" })
    mocks.findFirst.mockResolvedValue({ id: "shot-1" })
  })

  it("lists corrections in chronological order for the owning player", async () => {
    mocks.findMany.mockResolvedValue([{ id: "correction-1", kind: "make_miss", value: "make" }])

    const response = await GET(request("GET"), { params: { id: "shot-1" } })
    expect(response.status).toBe(200)
    expect(mocks.findFirst).toHaveBeenCalledWith({
      where: { id: "shot-1", userProfileId: "profile-1" },
      select: { id: true },
    })
    expect(mocks.findMany).toHaveBeenCalledWith({
      where: { shotEventId: "shot-1", userProfileId: "profile-1" },
      orderBy: { createdAt: "asc" },
    })
  })

  it("appends a normalized correction and never mutates detector output", async () => {
    mocks.create.mockResolvedValue({ id: "correction-1", kind: "make_miss", value: "miss" })

    const response = await POST(request("POST", {
      type: "miss",
      timestampMs: 1800,
      frameIndex: 18,
      reason: "Rim contact was visible",
    }), { params: { id: "shot-1" } })

    expect(response.status).toBe(201)
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        shotEventId: "shot-1",
        userProfileId: "profile-1",
        kind: "make_miss",
        value: "miss",
        timestampMs: 1800,
        frameIndex: 18,
      }),
    })
  })

  it("rejects malformed corrections before writing", async () => {
    const response = await POST(request("POST", { kind: "phase" }), { params: { id: "shot-1" } })
    expect(response.status).toBe(400)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("does not reveal another player's shot event", async () => {
    mocks.findFirst.mockResolvedValue(null)
    const response = await POST(request("POST", { kind: "false_shot", value: true }), { params: { id: "shot-1" } })
    expect(response.status).toBe(404)
    expect(mocks.create).not.toHaveBeenCalled()
  })
})

