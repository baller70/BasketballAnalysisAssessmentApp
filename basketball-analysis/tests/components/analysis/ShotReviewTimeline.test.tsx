import React from "react"
import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { ShotReviewTimeline } from "@/components/analysis/ShotReviewTimeline"

describe("ShotReviewTimeline", () => {
  const events = [{
    id: "shot-1",
    timestampMs: 12_500,
    phase: "release",
    confidence: 0.86,
    detectedResult: "unknown" as const,
  }]

  it("renders a reviewable timeline with detector metadata", () => {
    render(<ShotReviewTimeline events={events} persist={false} />)

    expect(screen.getByRole("region", { name: "Shot review timeline" })).toBeTruthy()
    expect(screen.getByText("0:12")).toBeTruthy()
    expect(screen.getByText("86% confidence")).toBeTruthy()
    expect(screen.getByRole("button", { name: /select shot 1/i })).toBeTruthy()
  })

  it("emits immutable correction intents for result, false-shot, shooter, and phase", () => {
    const onCorrection = vi.fn()
    render(<ShotReviewTimeline events={events} persist={false} onCorrection={onCorrection} />)

    fireEvent.click(screen.getByRole("button", { name: /mark shot 1 as false shot/i }))
    fireEvent.click(screen.getByRole("button", { name: /mark shot 1 as make/i }))
    fireEvent.change(screen.getByRole("textbox", { name: /shooter for shot 1/i }), { target: { value: "Player 1" } })
    fireEvent.click(screen.getByRole("button", { name: /save shooter for shot 1/i }))
    fireEvent.change(screen.getByRole("combobox", { name: /phase for shot 1/i }), { target: { value: "set" } })
    fireEvent.click(screen.getByRole("button", { name: /save phase for shot 1/i }))

    expect(onCorrection).toHaveBeenCalledTimes(4)
    expect(onCorrection.mock.calls.map(([correction]) => correction.kind)).toEqual([
      "false_shot",
      "make_miss",
      "shooter",
      "phase",
    ])
    expect(onCorrection.mock.calls[1][0].value).toBe("make")
    expect(onCorrection.mock.calls[2][0].value).toBe("Player 1")
    expect(onCorrection.mock.calls[3][0].value).toBe("set")
  })

  it("keeps an empty state when no shot was detected", () => {
    render(<ShotReviewTimeline events={[]} persist={false} />)
    expect(screen.getByText(/no detected shots to review/i)).toBeTruthy()
  })

  it("hydrates corrections for persisted events", async () => {
    const originalFetch = globalThis.fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.endsWith("/api/auth/csrf")) {
        return new Response(JSON.stringify({ csrfToken: "test-token" }), { status: 200 })
      }
      return new Response(JSON.stringify({
        success: true,
        corrections: [{ id: "server-correction", kind: "phase", value: "release" }],
      }), { status: 200 })
    }) as typeof fetch

    try {
      render(<ShotReviewTimeline events={[{ ...events[0], id: "persisted-shot" }]} persist />)
      expect(await screen.findByText("1 correction recorded")).toBeTruthy()
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("labels low-confidence detector output as review-only and hides its numeric result", () => {
    render(<ShotReviewTimeline events={[{
      id: "low-confidence",
      timestampMs: 1000,
      confidence: 0.35,
      detectedResult: "make",
    }]} persist={false} />)

    expect(screen.getByText(/review only · untrusted detection/i)).toBeTruthy()
    expect(screen.queryByText("make")).toBeNull()
  })
})
