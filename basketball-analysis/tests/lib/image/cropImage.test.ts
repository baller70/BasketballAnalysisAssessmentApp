import { describe, it, expect } from "vitest"
import {
  clampRect, centredRect, resizeFromCorner, FULL_FRAME, type CropRect,
} from "@/lib/image/cropImage"

const ASPECT = 3 / 4

describe("crop geometry", () => {
  it("starts as a centred 3:4 frame, the ratio the badge prints", () => {
    const r = centredRect(ASPECT)
    expect(r.w / r.h).toBeCloseTo(ASPECT, 5)
    expect(r.x + r.w / 2).toBeCloseTo(0.5, 5)
    expect(r.y + r.h / 2).toBeCloseTo(0.5, 5)
  })

  it("slides a dragged frame back inside instead of squashing it", () => {
    // Moving is the common gesture. A frame that changed SHAPE when it hit the
    // edge would fight the player rather than follow them.
    const r = centredRect(ASPECT)
    const pushed = clampRect({ ...r, x: r.x + 5, y: r.y + 5 })
    expect(pushed.w).toBeCloseTo(r.w, 5)
    expect(pushed.h).toBeCloseTo(r.h, 5)
    expect(pushed.x + pushed.w).toBeLessThanOrEqual(1.00001)
    expect(pushed.y + pushed.h).toBeLessThanOrEqual(1.00001)
  })

  it("never lets the frame leave the photo in any direction", () => {
    for (const d of [-9, -1, 0.3, 4]) {
      const r = clampRect({ x: d, y: d, w: 0.5, h: 0.5 })
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(1.00001)
      expect(r.y + r.h).toBeLessThanOrEqual(1.00001)
    }
  })

  it("refuses to shrink to nothing", () => {
    const r = clampRect({ x: 0.5, y: 0.5, w: 0.0001, h: 0 })
    expect(r.w).toBeGreaterThan(0.05)
    expect(r.h).toBeGreaterThan(0.05)
  })

  it("holds 3:4 while resizing from every corner", () => {
    const start: CropRect = { x: 0.2, y: 0.2, w: 0.6, h: 0.8 }
    for (const corner of ["nw", "ne", "sw", "se"] as const) {
      const r = resizeFromCorner(start, corner, -0.1, -0.1, ASPECT)
      expect(r.w / r.h, corner).toBeCloseTo(ASPECT, 4)
    }
  })

  it("holds the opposite corner still while resizing", () => {
    // Dragging the top-left must not move the bottom-right out from under the
    // finger holding it.
    const start: CropRect = { x: 0.2, y: 0.1, w: 0.6, h: 0.8 }
    const r = resizeFromCorner(start, "nw", 0.1, 0.1, ASPECT)
    expect(r.x + r.w).toBeCloseTo(start.x + start.w, 4)
    expect(r.y + r.h).toBeCloseTo(start.y + start.h, 4)
  })

  it("lets a free resize ignore the ratio when no aspect is given", () => {
    const r = resizeFromCorner({ x: 0.1, y: 0.1, w: 0.5, h: 0.5 }, "se", 0.2, -0.1, null)
    expect(r.w).toBeCloseTo(0.7, 4)
    expect(r.h).toBeCloseTo(0.4, 4)
  })

  it("treats the full frame as the whole photo", () => {
    expect(clampRect(FULL_FRAME)).toEqual({ x: 0, y: 0, w: 1, h: 1 })
  })
})
