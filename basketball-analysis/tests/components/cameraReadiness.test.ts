import { describe, it, expect } from "vitest"
import { evaluateReadiness, type ReadinessInputs } from "@/components/shotiq/phone/useCameraReadiness"

const OK: ReadinessInputs = {
  luma: 130, motion: 3, keypointsFound: true, fullBody: true, confidence: 0.82, ball: true,
}
const row = (rows: ReturnType<typeof evaluateReadiness>, label: string) =>
  rows.find((r) => r.label === label)!

describe("evaluateReadiness", () => {
  it("passes every answerable check on a good setup", () => {
    const rows = evaluateReadiness(OK)
    for (const label of ["Full body", "Lighting", "Stability", "Ball visible", "Pose confidence"]) {
      expect(row(rows, label).state, label).toBe("good")
    }
  })

  it("never reports the hoop as checked, because nothing detects one", () => {
    // The rim is calibrated by tapping it, not detected — a green GOOD here
    // would send a player off to record with the rim out of shot.
    for (const inputs of [OK, { ...OK, luma: 10 }, { ...OK, ball: false }]) {
      expect(row(evaluateReadiness(inputs), "Hoop visible")).toMatchObject({
        value: "NOT CHECKED", state: "unavailable",
      })
    }
  })

  it("distinguishes nobody in frame from somebody cropped", () => {
    expect(row(evaluateReadiness({ ...OK, keypointsFound: false, fullBody: false }), "Full body"))
      .toMatchObject({ value: "NO PLAYER", state: "poor" })
    expect(row(evaluateReadiness({ ...OK, fullBody: false }), "Full body"))
      .toMatchObject({ value: "OUT OF FRAME", state: "poor" })
  })

  it("calls out a frame that is too dark and one that is blown out", () => {
    expect(row(evaluateReadiness({ ...OK, luma: 20 }), "Lighting"))
      .toMatchObject({ value: "TOO DARK", state: "poor" })
    expect(row(evaluateReadiness({ ...OK, luma: 240 }), "Lighting"))
      .toMatchObject({ value: "TOO BRIGHT", state: "poor" })
  })

  it("cannot judge stability from a single frame and says so", () => {
    expect(row(evaluateReadiness({ ...OK, motion: null }), "Stability"))
      .toMatchObject({ value: "CHECKING", state: "checking" })
    expect(row(evaluateReadiness({ ...OK, motion: 40 }), "Stability"))
      .toMatchObject({ value: "SHAKY", state: "poor" })
  })

  it("reports a ball it could not look for as unresolved, not as absent", () => {
    expect(row(evaluateReadiness({ ...OK, ball: null }), "Ball visible").state).toBe("checking")
    expect(row(evaluateReadiness({ ...OK, ball: false }), "Ball visible"))
      .toMatchObject({ value: "NOT SEEN", state: "poor" })
  })

  it("prints the measured pose confidence and fails a weak one", () => {
    expect(row(evaluateReadiness({ ...OK, confidence: 0.91 }), "Pose confidence").value).toBe("91%")
    expect(row(evaluateReadiness({ ...OK, confidence: 0.31 }), "Pose confidence").state).toBe("poor")
  })

  it("never returns canonical's six greens for a setup that is not good", () => {
    // The whole defect: the panel said GOOD six times in any conditions.
    const rows = evaluateReadiness({
      luma: 12, motion: 55, keypointsFound: false, fullBody: false, confidence: null, ball: false,
    })
    expect(rows.filter((r) => r.state === "good")).toHaveLength(0)
  })
})
