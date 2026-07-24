import { describe, expect, it } from "vitest"
import {
  buildBalancedRoster,
  buildCompleteRoster,
  canonicalizeName,
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
})
