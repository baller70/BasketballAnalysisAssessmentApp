import { describe, expect, it } from "vitest"
import {
  buildBalancedRoster,
  buildCompleteRoster,
  canonicalizeName,
  pruneInvalidMediaCandidates,
  validatePublicHttpsUrl,
  validateRoster,
} from "@/lib/shooterResearch"

describe("shooterResearch", () => {
  it("builds the required balanced 106-athlete roster", () => {
    const roster = buildBalancedRoster()
    expect(roster).toHaveLength(106)
    expect(roster.filter((entry) => entry.category === "men")).toHaveLength(53)
    expect(roster.filter((entry) => entry.category === "women")).toHaveLength(53)
    expect(validateRoster(roster).filter((issue) => issue.level === "error")).toHaveLength(0)
  })

  it("builds a complete roster covering every current catalog entry", () => {
    const roster = buildCompleteRoster()
    expect(roster).toHaveLength(328)
    expect(roster.filter((entry) => entry.competitionCategory === "NBA")).toHaveLength(260)
    expect(roster.filter((entry) => entry.competitionCategory === "WNBA")).toHaveLength(30)
    expect(roster.filter((entry) => entry.competitionCategory === "NCAA_MEN")).toHaveLength(15)
    expect(roster.filter((entry) => entry.competitionCategory === "NCAA_WOMEN")).toHaveLength(22)
    expect(validateRoster(roster, "complete").filter((issue) => issue.level === "error")).toHaveLength(0)
  })

  it("keeps canonical IDs stable across punctuation and accents", () => {
    expect(canonicalizeName("Peja Stojakovic")).toBe("peja-stojakovic")
    expect(canonicalizeName("Peja Stojaković")).toBe("peja-stojakovic")
  })

  it("rejects direct/private or unapproved URLs", () => {
    expect(validatePublicHttpsUrl("http://cdn.nba.com/headshots/nba/latest/1040x760/1179.png")).toContain("url_must_be_https")
    expect(validatePublicHttpsUrl("https://127.0.0.1/image.png")).toContain("private_or_literal_host")
    expect(validatePublicHttpsUrl("https://example.com/image.png")).toContain("unapproved_source_host")
  })

  it("removes failed and cross-player duplicate media while retaining unique images", () => {
    const base = {
      sourceName: "espn",
      sourcePageUrl: "https://www.espn.com/nba/player/_/id/1/example",
      assetUrl: "https://a.espncdn.com/i/headshots/nba/players/full/1.png",
      retrievedAt: "2026-07-23T00:00:00.000Z",
      width: 600,
      height: 436,
      byteLength: 1000,
      photographer: null,
      licenseName: null,
      licenseUrl: null,
      attributionRequired: null,
      mediaKind: "headshot" as const,
      shotPhase: "unknown" as const,
      cameraView: "unknown" as const,
      identityReview: "PENDING_REVIEW" as const,
      formQualityReview: "PENDING_REVIEW" as const,
      rightsReview: "PENDING_REVIEW" as const,
      rejectionReasons: [],
    }
    const result = pruneInvalidMediaCandidates([
      { ...base, id: "a", canonicalId: "player-a", contentHash: "shared" },
      { ...base, id: "b", canonicalId: "player-b", contentHash: "shared" },
      { ...base, id: "c", canonicalId: "player-c", contentHash: "unique" },
      { ...base, id: "d", canonicalId: "player-d", contentHash: null, width: null, height: null },
    ])

    expect(result.candidates.map((candidate) => candidate.id)).toEqual(["c"])
    expect(result.removedIds).toEqual(expect.arrayContaining(["a", "b", "d"]))
    expect(result.crossPlayerDuplicateHashes).toEqual(["shared"])
  })
})
