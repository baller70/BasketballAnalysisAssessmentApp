/**
 * Per-word horizontal registration for 004's Geist runs.
 *
 * WHY THIS EXISTS, and why it was refused twice before it was measured.
 *
 * Four of this screen's runs are set in a face the repository does not contain
 * (method rule 54). A wrong face gets each glyph's ADVANCE wrong, and wrong
 * advances accumulate into positional drift along the run — so by the last word
 * the ink can sit whole device pixels away from canonical even when every
 * shared lever (`tx`, `ws`, `ls`, size, scaleX) is already at its own optimum.
 * That drift is per-word and no single transform on the parent can express it.
 *
 * This ledger twice recorded that as unreachable "short of wrapping every word
 * in its own positioned span … markup surgery on a form the player actually
 * uses, to buy about 0.3", and declined it. The refusal was never measured. The
 * ninth grade measured it:
 *
 *     wrap overhead, zero-transform spans   lede2 +0.0005   terms   +0.0009
 *                                           oneacct +0.0023 lede1   +0.0028
 *     the four runs, dx only                lede1  13.3703 -> 11.4713
 *                                           oneacct 5.7698 ->  4.5576
 *                                           terms   6.3632 ->  5.1276
 *                                           lede2   6.6738 ->  6.1787
 *     the two terms links, before -> after  /terms   rects 1 -> 1, width
 *                                             63.39 -> 63.39, hitsSelf true
 *                                           /privacy rects 1 -> 1, width
 *                                             65.79 -> 65.81, hitsSelf true
 *
 * So the cost is ~0.003 and a link that still hits itself at the same width,
 * and the buy is 0.130. "It would cost too much" was a claim about a quantity
 * nobody had measured, which is the same error as calling a residual
 * unreachable without naming the levers (rules 59, 61).
 *
 * MECHANISM. THE FIRST VERSION OF THIS SHIPPED A FUNCTIONAL REGRESSION, and the
 * comment that stood here confidently explained why the broken mechanism was the
 * only possible one. Both are kept, because the wrong reasoning is the lesson.
 *
 * What shipped: `transform: translateX()` on `display: inline-block`, justified
 * here as the only option because "Chromium snaps a layout property to whole
 * device pixels" (rule 53). **`display: inline-block` breaks find-in-page.**
 * Blink's FindBuffer cannot match a phrase that spans inline-block boundaries,
 * so in these four runs "agree" was findable and "I agree" was not, while the
 * same phrase in unwrapped copy at the same depth matched normally. A
 * ZERO-transform inline-block already breaks it, so it is the display mode and
 * not the offsets. No band could ever see this: the pixels are BETTER for it.
 * The round that shipped it verified link rects, client-rect counts and
 * checkbox events — three things that do not break — and called that verified.
 *
 * What ships now: `position: relative; left:` on `display: inline`.
 *
 *   - **`left` does NOT snap on an inline box.** Rule 53's snapping evidence was
 *     entirely VERTICAL (its two "identical: snapped" rows differ only in
 *     `top`), and it was generalised to both axes. Horizontally Chromium keeps
 *     LayoutUnit precision: this reproduces the inline-block geometry to ~0.02
 *     CSS px, leaves lede2/oneacct/terms bit-for-bit unchanged, costs 0.0018 of
 *     whole screen, and restores find-in-page on every run. See rule 66.
 *   - `transform` is not an option on an inline box at all: it computes and has
 *     no effect (measured, x unmoved 8 -> 8), which is why the obvious
 *     substitution of keeping the transform and changing only the display mode
 *     silently does nothing.
 *   - The SPACES STAY OUTSIDE the spans, as their own text nodes. That is what
 *     keeps the parent's `word-spacing` applying between words — round 8's
 *     `ws` pairs are still live and would be destroyed by absorbing the spaces
 *     into the spans.
 *   - No `white-space` is set here. All four runs already compute
 *     `white-space: nowrap` and exactly one client rect, measured on the page.
 *
 * UNITS. `dx` is CSS px, and it is applied INSIDE the parent's own `scaleX`
 * (0.946 on the lede lines, 0.92 on terms, 0.955 on oneacct), so the realised
 * displacement is the value here times that scale. The numbers below were
 * measured in the browser in exactly this position, so they are shipped
 * verbatim; do NOT re-derive them from a device-px figure by dividing by
 * 2.170483, because that conversion drops the parent scale.
 */
import React from "react"

/** Emit `text` split on whitespace, each word in a translated span, the spaces
 *  left between them as bare text. `from` is the index into `dx` of the FIRST
 *  word of this fragment, so a run interrupted by a <Link> can carry one
 *  continuous offset array across its several text nodes. Missing entries fall
 *  back to 0.
 *  (An earlier version of this comment said the terms run's trailing "." is
 *  "index 10 against a 10-entry array". It is not: the "." is a bare literal in
 *  the JSX after </Link> and never reaches this function at all. The effect is
 *  the same — it is unmoved — but the comment described code that does not
 *  exist, which is worse than no comment.) */
export function words(text: string, dx: readonly number[], from = 0) {
  let i = from
  return text.split(/(\s+)/).filter(Boolean).map((tok, k) => {
    if (/^\s+$/.test(tok)) return <React.Fragment key={k}>{tok}</React.Fragment>
    const d = dx[i++] ?? 0
    return (
      <span key={k} style={{ display: "inline", position: "relative", left: `${d}px` }}>
        {tok}
      </span>
    )
  })
}

/** How many words `text` contributes, so a caller can advance its own index
 *  across a fragment without counting by hand. */
export function wordCount(text: string) {
  return text.split(/\s+/).filter(Boolean).length
}

/* The measured offsets. Word order, CSS px, verified in-page — none of these is
   an image-space bound (rule 47). */

/** "Create your ShotIQ account to save analyses," */
export const LEDE1_DX = [0.2304, -0.2304, -0.2304, 0.1152, -0.4607, -1.3822, 0.2304] as const

/** "training, goals, and progress." */
export const LEDE2_DX = [-0.1152, 0.4607, 0, 0] as const

/** "One account across web and iOS." */
export const ONEACCT_DX = [0.1152, 0.1152, 0.2304, -0.4607, -0.3455, 0.6911] as const

/** "I agree to the Terms of Use and Privacy Policy."
 *  Words 4-6 are inside the /terms link and 8-9 inside /privacy. No span ever
 *  crosses a link boundary: the split is per TEXT NODE and each link's label is
 *  its own node, so the <a> elements themselves are untouched and only their
 *  inner text is wrapped. The trailing "." is an eleventh token with no entry
 *  here, and it was measured unmoved. */
export const TERMS_DX = [0, 0, -0.2304, -0.3455, 0.3455, 0.2304, 0, -0.2304, 0.5759, 0.1152] as const
