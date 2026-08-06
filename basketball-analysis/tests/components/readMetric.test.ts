import { describe, it, expect } from "vitest"
import { readMetric } from "@/components/shotiq/phone/results/AnalysisOverview"

const CANON = ["7'8\"", "", "EXCELLENT"] as const

describe("readMetric", () => {
  it("keeps the canonical constant when there is no analysis at all", () => {
    expect(readMetric("RELEASE HEIGHT", ...CANON, null))
      .toEqual({ value: "7'8\"", unit: "", verdict: "EXCELLENT", real: false })
  })

  it("formats a measured release height in feet and inches", () => {
    const r = readMetric("RELEASE HEIGHT", ...CANON, { measurements: { releaseHeightInches: 104 } })
    expect(r.value).toBe("8'8\"")
    expect(r.real).toBe(true)
  })

  it("judges a value inside its ideal band GOOD and outside it REVIEW", () => {
    // `angles.release` is deviation from vertical, ideal 0, good within ±15.
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: 4 } }).verdict).toBe("GOOD")
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: 31 } }).verdict).toBe("REVIEW")
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: -28 } }).verdict).toBe("REVIEW")
  })

  it("treats the band edges as inside it", () => {
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: -15 } }).verdict).toBe("GOOD")
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: 15 } }).verdict).toBe("GOOD")
  })

  it("prints the elbow angle in DEGREES, not under canonical's % sign", () => {
    const r = readMetric("ELBOW ALIGNMENT", "93", "%", "GOOD", { angles: { elbow: 168 } })
    expect(r).toMatchObject({ value: "168", unit: "°", verdict: "GOOD", real: true })
  })

  it("bands both angles at the release frame they were sampled at", () => {
    /* Every angle on an analysis comes from the release frame. These two rows
       used to be judged against other moments — the elbow against the 85°-95°
       set-point "L" and the release against canonical's 45°-55° ball arc — so a
       correct shot was marked REVIEW on both. */
    expect(readMetric("ELBOW ALIGNMENT", "93", "%", "GOOD", { angles: { elbow: 90 } }).verdict).toBe("REVIEW")
    expect(readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: 52 } }).verdict).toBe("REVIEW")
  })

  it("reports the two metrics with no pipeline as not measured", () => {
    const a = { angles: { release: 50, elbow: 88 }, measurements: { centerlineDeviationDeg: 1.2 } }
    for (const label of ["SPIN RATE", "SHOT ARC"]) {
      const r = readMetric(label, "8.6", "", "GOOD", a)
      expect(r).toEqual({ value: "Not measured", unit: "", verdict: "—", real: false })
    }
  })

  it("says not measured — never a zero — when the analysis lacks that angle", () => {
    const r = readMetric("RELEASE ANGLE", "52", "°", "GOOD", { angles: { release: null } })
    expect(r.value).toBe("Not measured")
    expect(r.real).toBe(false)
  })

  it("answers centeredness from the centreline deviation, in degrees", () => {
    const r = readMetric("CENTEREDNESS", "92", "%", "EXCELLENT", { measurements: { centerlineDeviationDeg: 1.8 } })
    expect(r).toMatchObject({ value: "1.8", unit: "°", verdict: "GOOD", real: true })
    // Beyond the 3° ideal it is flagged, not quietly passed.
    expect(readMetric("CENTEREDNESS", "92", "%", "EXCELLENT",
      { measurements: { centerlineDeviationDeg: 4.4 } }).verdict).toBe("REVIEW")
  })

  it("does not fall back to canonical once an analysis exists", () => {
    // The whole defect: an account WITH data must never see canonical's value.
    const r = readMetric("SPIN RATE", "8.6", "", "GOOD", { angles: {} })
    expect(r.value).not.toBe("8.6")
  })
})
