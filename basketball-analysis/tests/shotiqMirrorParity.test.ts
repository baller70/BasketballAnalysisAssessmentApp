import fs from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const root = fs.existsSync(path.join(process.cwd(), "ios-native"))
  ? process.cwd()
  : path.join(process.cwd(), "basketball-analysis")

const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8")
const exists = (relativePath: string) => fs.existsSync(path.join(root, relativePath))
const readTree = (relativePath: string): string => {
  const absolutePath = path.join(root, relativePath)
  return fs.readdirSync(absolutePath, { withFileTypes: true })
    .map((entry) => {
      const child = path.join(relativePath, entry.name)
      if (entry.isDirectory()) return readTree(child)
      return entry.name.endsWith(".swift") ? read(child) : ""
    })
    .join("\n")
}

describe("ShotIQ iOS/web mirror contract", () => {
  it("keeps native pointed at the shared web API origin and endpoints", () => {
    const nativeApi = read("ios-native/ShotIQ/Core/APIClient.swift")
    const endpointRouteFiles = [
      ["/api/auth/csrf", "src/app/api/auth/csrf/route.ts"],
      ["/api/auth/refresh", "src/app/api/auth/refresh/route.ts"],
      ["/api/auth/signin", "src/app/api/auth/signin/route.ts"],
      ["/api/profile", "src/app/api/profile/route.ts"],
      ["/api/analysis-history", "src/app/api/analysis-history/route.ts"],
      ["/api/analysis/latest", "src/app/api/analysis/latest/route.ts"],
      ["/api/save-analysis", "src/app/api/save-analysis/route.ts"],
      ["/api/media-uploads", "src/app/api/media-uploads/route.ts"],
      ["/api/media-uploads/\\(uploadId)/parts", "src/app/api/media-uploads/[uploadId]/parts/route.ts"],
      ["/api/media-uploads/\\(uploadId)/complete", "src/app/api/media-uploads/[uploadId]/complete/route.ts"],
      ["/api/upload", "src/app/api/upload/route.ts"],
      ["/api/shot-events", "src/app/api/shot-events/route.ts"],
      ["/api/goals", "src/app/api/goals/route.ts"],
      ["/api/points", "src/app/api/points/route.ts"],
      ["/api/badges", "src/app/api/badges/route.ts"],
      ["/api/shooters", "src/app/api/shooters/route.ts"],
    ] as const

    const nativeApp = `${nativeApi}\n${readTree("ios-native/ShotIQ/Screens")}`

    expect(nativeApi).toContain("https://shotiq.194-146-12-139.sslip.io")
    expect(nativeApi).toContain("SHOTIQ_API")

    for (const [endpoint, routeFile] of endpointRouteFiles) {
      expect(nativeApp, `native app should reference ${endpoint}`).toContain(endpoint)
      expect(exists(routeFile), `web route should exist for ${endpoint}`).toBe(true)
    }
  })

  it("keeps native result DTOs aligned with the web analysis result contract", () => {
    const nativeApi = read("ios-native/ShotIQ/Core/APIClient.swift")
    const webContract = read("src/lib/analysis/resultContract.ts")

    const nativeDtos = [
      "struct ShotIQAnalysisResultDTO",
      "struct AnalysisMediaDTO",
      "struct AnalysisScoresDTO",
      "struct AnalysisAnglesDTO",
      "struct AnalysisMeasurementsDTO",
      "struct AnalysisProvenanceDTO",
    ]
    const sharedFields = [
      "clientSessionId",
      "captureSessionId",
      "media",
      "scores",
      "angles",
      "measurements",
      "phase",
      "provenance",
      "releaseHeightInches",
      "releaseDistanceInches",
      "verticalJumpInches",
      "centerlineDeviationDeg",
      "kneeMin",
    ]

    for (const dto of nativeDtos) {
      expect(nativeApi).toContain(dto)
    }
    for (const field of sharedFields) {
      expect(nativeApi, `native DTO missing ${field}`).toContain(field)
      expect(webContract, `web contract missing ${field}`).toContain(field)
    }
  })

  it("keeps the approved mechanics, coaching, training, and equipment icon vocabulary mirrored", () => {
    const nativeGlyphs = read("ios-native/ShotIQ/Components/ShotIQGlyphs.swift")
    const webGlyphs = read("src/components/shotiq/Glyphs.tsx")
    const webDrillDetail = read("src/components/shotiq/phone/DrillDetailPhone.tsx")

    const sharedMechanics = [
      "releasePath",
      "arcHeight",
      "releaseAngle",
      "spin",
      "flightTime",
      "shotShape",
      "tempo",
      "consistency",
    ]
    const sharedEquipment = ["basketball", "cones", "spot", "location"]

    for (const mechanic of sharedMechanics) {
      expect(nativeGlyphs, `native glyphs missing ${mechanic}`).toContain(mechanic)
      expect(webGlyphs, `web glyphs missing ${mechanic}`).toContain(mechanic)
    }

    expect(nativeGlyphs).toContain("enum EquipmentKind")
    expect(webGlyphs).toContain("export type EquipmentKind")
    expect(nativeGlyphs).toContain("struct EquipmentGlyph")
    expect(webGlyphs).toContain("export function EquipmentGlyph")
    expect(nativeGlyphs).toContain("basketball(")
    expect(webGlyphs).toContain("BasketballMark")

    for (const equipment of sharedEquipment) {
      expect(nativeGlyphs, `native equipment missing ${equipment}`).toContain(equipment)
      expect(webGlyphs, `web equipment missing ${equipment}`).toContain(equipment)
      expect(webDrillDetail, `web drill detail should render ${equipment}`).toContain(equipment)
    }

    expect(webDrillDetail).toContain('"Straight Release Path", "Drive straight up with minimal lateral drift.", "releasePath"')
    expect(webDrillDetail).toContain('"RELEASE PATH", "releasePath"')
  })
})
