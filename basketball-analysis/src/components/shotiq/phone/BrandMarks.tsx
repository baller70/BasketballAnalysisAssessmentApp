"use client"

/**
 * The three pieces of artwork canonical iOS 001-splash draws: the ShotIQ
 * app-icon mark, the "shot arc over a pose graph" hero diagram, and the faint
 * court furniture in the top-right and bottom-left corners.
 *
 * Everything here is measured off canonical/001-splash.png at 1:1 (853x1844 =
 * 393pt at dPR 853/393 = 2.170483) and expressed in CSS pt, so a device pixel
 * in this component is a device pixel in the canonical render.
 *
 * The mark and the diagram used to be hand-drawn SVG approximations. Measured
 * against canonical they were not close: the drawn ball was a full circle where
 * canonical draws a half, the drawn brain was a blob with five scribbles where
 * canonical draws seven lobes and five hooked folds, and the drawn diagram
 * carried 50% too much ink with roughly double the stroke weight on every
 * element. Both are now real assets — see public/images/canonical/001-mark.png
 * and 001-shot-arc.png, and the provenance notes on each component below.
 */

import React from "react"

/** device px per CSS pt in the canonical iOS renders (853/393). */
const DSF = 2.170483
/** canonical device px -> CSS pt */
const pt = (devicePx: number) => +(devicePx / DSF).toFixed(2)

/* --------------------------------------------------------------------------
 * App-icon mark.
 *
 * Canonical plate, measured at the 50% coverage crossing:
 *     x 132.20  y 534.72   153.6 x 147.1 device px, corner radius 35.63
 *     (the corner is a true circle — least-squares fit residual 0.14px)
 *   = x  60.91  y 246.36    70.77 x 67.77 pt, radius 16.42pt
 * The plate is 4.4% wider than tall; the artwork inside it is stretched to
 * match, which is why the asset is not square either.
 *
 * The art is the repo's own brand lockup, public/images/shotiq-header-logo.png,
 * whose icon is the identical drawing (confirmed by mask overlay) but printed
 * with a warm orange gradient on a blue-black plate. 001-mark.png re-separates
 * the orange on the source's red channel — 27 over the plate, 245-255 across
 * the whole gradient — and re-composites it flat onto a plate drawn at the
 * radius above, in the colours canonical's interiors measure: plate
 * rgb(20,20,20), orange rgb(250,120,4). Registered by the artwork's own bbox,
 * not the plate's: the source sets the drawing 3px right of plate centre and
 * canonical sets it 1px left. Round-trips against the canonical crop at mean
 * absolute error 8.9/255, all of it 1px edge registration.
 * ------------------------------------------------------------------------ */
/* Offset off the raw measurement by the amount Chromium's own resampling of a
 * 2x asset moves the 50%-coverage edge: asked for a left edge at 132.70 it
 * draws one at 131.82, so the box is placed 0.38 device px right and 0.84 down
 * of the raw numbers to put the drawn edges on canonical's 132.20 / 534.72. */
export const MARK = { x: pt(133.6), y: pt(534.9), w: pt(153.3), h: pt(146.9) }

export function ShotIQMark({ width = MARK.w, height = MARK.h }: { width?: number; height?: number }) {
  return (
    <img
      src="/images/canonical/001-mark.png"
      alt="ShotIQ"
      width={width}
      height={height}
      style={{ width, height }}
      className="block max-w-none"
    />
  )
}

/* --------------------------------------------------------------------------
 * Hero diagram: a shot arc that fades from a dotted tail into a ticked solid
 * head with an open ring at the apex, over a five-node pose graph with two
 * orange joints.
 *
 * Canonical ink block x 278..572, y 776..1064 = 295 x 289 device px
 *   = x 128.08  y 357.53   135.91 x 133.15 pt.
 *
 * Nothing in the repo draws this, and the hand-drawn stand-in measured 0.091
 * ink density against canonical's 0.058 with every stroke about twice as wide,
 * so it is cut from the canonical render over exactly that block and un-matted
 * off the paper: alpha = 255 - min(R,G,B), which is exact both for the black
 * pose graph (min -> 0) and for the orange arc (blue -> ~0). Round-trips
 * against the canonical crop at mean absolute error 1.2/255.
 * ------------------------------------------------------------------------ */
export const DIAGRAM = { x: pt(278), y: pt(775.9), w: pt(295), h: pt(289.6) }

export function ShotArcDiagram({ width = DIAGRAM.w, height = DIAGRAM.h }: { width?: number; height?: number }) {
  return (
    <img
      src="/images/canonical/001-shot-arc.png"
      alt=""
      aria-hidden="true"
      width={width}
      height={height}
      style={{ width, height }}
      className="block max-w-none"
    />
  )
}

/* --------------------------------------------------------------------------
 * Court furniture.
 *
 * Canonical prints a three-point arc, a restricted-area arc and a lane corner
 * into the top-right and bottom-left of the page, at rgb(227,226,225) against
 * white paper — 27 levels, one step off the page. Each stroke's centreline was
 * extracted from canonical (the watermark is the only ink in the 190..247
 * luminance window in those corners) and fitted:
 *
 *   TR three-point arc   cubic bezier, fit residual max 0.73px mean 0.19
 *   TR restricted arc    circle c=(428.42,32.76) r=79.61pt, residual max 0.51px
 *   BL three-point arc   cubic bezier, fit residual max 2.23px mean 0.46
 *                        (a circle will not fit this one: least squares leaves
 *                         10.3px, so canonical did not draw it as one)
 *   BL restricted arc    cubic bezier, residual max 2.17px mean 0.71
 *   lane lines           TR vertical x 323.20, horizontal y 28.10
 *                        BL horizontal y 755.59, vertical x 99.98
 *   stroke width         6.04 device px by coverage = 2.78pt
 *
 * The viewBox is the full 852pt device height even though canonical's canvas is
 * 849.6pt (1844px), so the two paths that leave the bottom edge are extended
 * along their end tangents to y=852 — they run off the frame in canonical and
 * must run off it here too rather than stopping 5px short.
 * ------------------------------------------------------------------------ */
export function CourtWatermark() {
  const s = { stroke: "#E4E3E1", strokeWidth: 2.78, fill: "none" } as const
  return (
    <svg viewBox="0 0 393 852" preserveAspectRatio="none" aria-hidden="true"
         className="pointer-events-none absolute inset-0 h-full w-full">
      <g {...s}>
        {/* top right */}
        <path d="M258.93 0 C281.02 60.56 329.83 114.76 392.54 134.53 L393 134.68" />
        <path d="M348.94 28.10 A79.61 79.61 0 0 0 393 104.06" />
        <path d="M323.20 0 V28.10 H393" />
        {/* bottom left */}
        <path d="M0 639.49 C113.65 636.49 173.13 745.15 183.14 849.12 L183.42 852" />
        <path d="M0 673.58 C47.26 664.81 81.75 719.33 76.48 753.29 L76.12 755.59" />
        <path d="M0 755.59 H99.98 V852" />
      </g>
    </svg>
  )
}
