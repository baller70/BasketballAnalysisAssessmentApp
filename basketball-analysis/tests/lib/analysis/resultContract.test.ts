import { describe, expect, it } from "vitest"
import { toShotIQAnalysisResult } from "@/lib/analysis/resultContract"

describe("ShotIQ analysis result contract", () => {
  it("normalizes measured values and records missing analytics without demo fallback", () => {
    const result = toShotIQAnalysisResult({
      id: "analysis-1",
      clientSessionId: "ios-shot-1",
      captureSessionId: "capture-1",
      createdAt: new Date("2026-08-07T12:00:00.000Z"),
      mediaType: "video",
      videoUrl: "https://media.test/shot.mov",
      annotatedImageUrl: "https://media.test/shot-annotated.jpg",
      overallScore: 84,
      formScore: 82,
      elbowAngle: 161,
      wristAngle: 72,
      releaseAngle: -3,
      releaseHeightInches: 92,
      shootingPhase: "release",
      roboflowPoseData: { keypoints: [{ name: "right_wrist", x: 0.7, y: 0.2 }] },
      coachingNotes: "Keep elbow stacked.",
      matchConfidence: 0.88,
    })

    expect(result.source).toBe("ios")
    expect(result.media).toMatchObject({
      type: "video",
      displayImageUrl: "https://media.test/shot-annotated.jpg",
      videoUrl: "https://media.test/shot.mov",
    })
    expect(result.scores.form).toEqual({ value: 82, unit: "score", source: "measured" })
    expect(result.angles.elbow).toEqual({ value: 161, unit: "deg", source: "measured" })
    expect(result.angles.release).toEqual({ value: -3, unit: "deg", source: "measured" })
    expect(result.measurements.releaseHeightInches).toEqual({ value: 92, unit: "in", source: "measured" })
    expect(result.phase).toEqual({ value: "release", unit: null, source: "measured" })
    expect(result.provenance.measured).toContain("scores.form")
    expect(result.provenance.measured).toContain("angles.elbow")
    expect(result.provenance.measured).toContain("phase")
    expect(result.provenance.missing).toContain("angles.knee")
    expect(result.provenance.demo).toEqual([])
  })

  it("does not invent player analytics when only identity and media exist", () => {
    const result = toShotIQAnalysisResult({
      id: "analysis-2",
      clientSessionId: "web-shot-2",
      createdAt: "2026-08-07T12:30:00.000Z",
      mediaType: "image",
      imageUrl: "https://media.test/photo.jpg",
    })

    expect(result.source).toBe("web")
    expect(result.scores.overall).toEqual({ value: null, unit: "score", source: "missing" })
    expect(result.angles.elbow).toEqual({ value: null, unit: "deg", source: "missing" })
    expect(result.media.displayImageUrl).toBe("https://media.test/photo.jpg")
    expect(result.provenance.measured).toEqual([])
    expect(result.provenance.missing).toContain("scores.overall")
    expect(result.provenance.demo).toEqual([])
  })
})
