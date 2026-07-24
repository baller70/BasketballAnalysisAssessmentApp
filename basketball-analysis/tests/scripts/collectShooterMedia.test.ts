import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

describe("collect-shooter-media script wiring", () => {
  it("is exposed through the package script with the private local env file", () => {
    const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
      scripts: Record<string, string>
    }

    expect(packageJson.scripts["collect:shooter-media"]).toContain("DOTENV_CONFIG_PATH=.env.local")
    expect(packageJson.scripts["collect:shooter-media"]).toContain("scripts/collect-shooter-media.ts")
  })

  it("keeps full-run safety flags in the collector", () => {
    const source = readFileSync("scripts/collect-shooter-media.ts", "utf8")

    expect(source).toContain("--ids=")
    expect(source).toContain("--resume")
    expect(source).toContain("--resume-failed")
    expect(source).toContain("--max-requests=")
    expect(source).toContain("--max-bytes=")
    expect(source).toContain("--sources=")
    expect(source).toContain("--skip-source-evidence")
  })
})
