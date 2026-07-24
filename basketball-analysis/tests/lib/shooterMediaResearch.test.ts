import { describe, expect, it } from "vitest"
import {
  extractOfficialProviderId,
  sourcePageForOfficialAsset,
  sourcePagesForAthlete,
} from "@/lib/shooterMediaResearch"
import type { ShooterRosterEntry } from "@/lib/shooterResearch"

const allanHouston: ShooterRosterEntry = {
  canonicalId: "allan-houston",
  displayName: "Allan Houston",
  aliases: [],
  category: "men",
  competitionCategory: "NBA",
  shooterTier: "great",
  dominantHand: null,
  height: 78,
  weight: 200,
  wingspan: 81,
  armLength: null,
  bodyBuild: "ATHLETIC",
  sourceCatalogId: 1,
}

describe("shooterMediaResearch", () => {
  it("extracts official provider IDs from approved CDN asset URLs", () => {
    expect(extractOfficialProviderId("https://cdn.nba.com/headshots/nba/latest/1040x760/1179.png")).toEqual({
      sourceName: "nba",
      providerId: "1179",
    })
    expect(extractOfficialProviderId("https://ak-static.cms.nba.com/wp-content/uploads/headshots/wnba/latest/1040x760/1629498.png")).toEqual({
      sourceName: "wnba",
      providerId: "1629498",
    })
    expect(extractOfficialProviderId("https://a.espncdn.com/i/headshots/womens-college-basketball/players/full/4398884.png")).toEqual({
      sourceName: "espn",
      providerId: "4398884",
    })
  })

  it("builds the correct ESPN profile URL for women's college assets", () => {
    expect(
      sourcePageForOfficialAsset(
        "https://a.espncdn.com/i/headshots/womens-college-basketball/players/full/4398884.png",
        "Taylor Robertson",
      ),
    ).toBe("https://www.espn.com/womens-college-basketball/player/_/id/4398884/taylor-robertson")
  })

  it("converts official assets into source pages instead of treating assets as citations", () => {
    expect(sourcePageForOfficialAsset("https://cdn.nba.com/headshots/nba/latest/1040x760/1179.png", "Allan Houston")).toBe(
      "https://www.nba.com/player/1179/allan-houston",
    )
  })

  it("builds source-specific research pages without defaulting to Wikimedia", () => {
    const pages = sourcePagesForAthlete(allanHouston, ["https://cdn.nba.com/headshots/nba/latest/1040x760/1179.png"])
    expect(pages.some((page) => page.sourceName === "nba")).toBe(true)
    expect(pages.some((page) => page.sourceName === "ncaa")).toBe(true)
    expect(pages.some((page) => page.sourceName === "wikimedia")).toBe(false)
  })
})
