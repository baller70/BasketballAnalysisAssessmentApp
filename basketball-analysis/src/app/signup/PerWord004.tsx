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
 * PER-GLYPH SPANS DESTROY THE ACCESSIBILITY TREE, AND THAT SHIPPED.
 * Wrapping every character exposed `display` and `lede1` as one StaticText plus
 * InlineTextBox PER CHARACTER — 51 spurious single-character nodes, and the
 * sentence "Create your ShotIQ account to save analyses," did not exist as a
 * text unit anywhere in the tree. The internal control is on the same page: the
 * per-WORD runs come through as whole words, so it is the per-GLYPH level
 * specifically. Measured by CDP `Accessibility.getFullAXTree`:
 *
 *     shipped            114 StaticText,  54 single-character,  lede1 ABSENT
 *     unwrapped control   58 StaticText,   3 single-character,  lede1 present
 *     with this fix       64 StaticText,   3 single-character,  lede1 present
 *
 * The fix costs NOTHING in pixels — the screenshot is bit-for-bit identical to
 * the version that had the defect, 0 changed pixels, whole screen 2.6764 — which
 * is precisely why no band mean could ever have found it. The glyph spans are
 * `aria-hidden`, the h1 carries an `aria-label`, and the lede lines carry one
 * `srOnly` copy of their text.
 *
 * AND RULE 66 NAMED THIS ONE ROUND EARLIER. It was written after inline-block
 * broke find-in-page, and its own instruction is: "enumerate what the browser
 * does with text (find, select, copy, READ, translate, reflow) and test the ones
 * the change could plausibly touch." The next round shipped 51 per-glyph spans
 * and tested find, select and copy. Writing the rule is not following it.
 *
 * THE DESKTOP LEAK. These spans render at EVERY width — the lede has an
 * unwrapped desktop alternative but `oneacct` and `terms` do not — so phone-
 * measured offsets were live at 1440 too, along with the find-in-page failure.
 * Fixed without duplicating the markup: the span carries `left` inline and the
 * class `s4w`, and `position: relative` is declared ONLY inside the phone media
 * query. Above 768px the span is `position: static`, `left` is inert by spec,
 * and `inline` is a span's default, so the whole mechanism switches off with one
 * declaration. Duplicating `terms` was the alternative and it is worse: it means
 * a second copy of two <Link>s inside a <label>, which is the markup that
 * already carries a content-model violation.
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
      <span key={k} className="s4w" style={{ left: `${d}px` }}>{tok}</span>
    )
  })
}

/** The same, per GLYPH, for the runs where the drift accumulates WITHIN a word
 *  as well as between words. Nested inside a word span, its `left` ADDS to the
 *  word's — both levels are live, and the per-glyph values here are RELATIVE to
 *  the per-word ones rather than replacing them. Getting that backwards would
 *  silently double-apply.
 *  `from` indexes a single array that runs continuously across the whole run,
 *  because the spaces sit between the WORD spans and are never wrapped here. */
export function glyphs(text: string, dx: readonly number[], from = 0) {
  let i = from
  return Array.from(text).map((ch, k) => (
    <span key={k} aria-hidden className="s4w" style={{ left: `${dx[i++] ?? 0}px` }}>{ch}</span>
  ))
}

/** Per-glyph for a run with NO outer word spans: the inter-word space is
 *  emitted as a bare text node carrying no offset, exactly as `words` does, so
 *  the parent's own `word-spacing` stays live. Absorbing the space into a span
 *  would destroy the shipped `ws` solve. */
export function glyphsWithSpaces(text: string, dx: readonly number[]) {
  let i = 0
  return Array.from(text).map((ch, k) =>
    ch === " "
      ? <React.Fragment key={k}>{ch}</React.Fragment>
      : <span key={k} aria-hidden className="s4w" style={{ left: `${dx[i++] ?? 0}px` }}>{ch}</span>)
}

/** A copy of the run's text for assistive technology and nothing else: present
 *  in the accessibility tree, absent from the pixels. Not `display:none` and not
 *  `visibility:hidden`, because both remove it from the tree as well — this is
 *  the clip-rect idiom, which leaves it rendered at 1x1 with everything clipped
 *  away. */
export function srOnly(text: string) {
  return (
    <span style={{
      position: "absolute", width: 1, height: 1, margin: -1, padding: 0,
      overflow: "hidden", clip: "rect(0 0 0 0)", clipPath: "inset(50%)",
      whiteSpace: "nowrap", border: 0,
    }}>{text}</span>
  )
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
/* index 3 ("web") -0.4607 -> -0.625: 4.5576 -> 4.5172. */
export const ONEACCT_DX = [0.1152, 0.1152, 0.2304, -0.625, -0.3455, 0.6911] as const

/** "I agree to the Terms of Use and Privacy Policy."
 *  Words 4-6 are inside the /terms link and 8-9 inside /privacy. No span ever
 *  crosses a link boundary: the split is per TEXT NODE and each link's label is
 *  its own node, so the <a> elements themselves are untouched and only their
 *  inner text is wrapped. The trailing "." is an eleventh token with no entry
 *  here, and it was measured unmoved. */
/* indices 6 ("Use"), 7 ("and") and 9 ("Policy") re-solved: 5.1190 -> 5.0190. */
export const TERMS_DX = [0, 0, -0.2304, -0.3455, 0.3455, 0.2304, -0.25, -0.2875, 0.5759, -0.0875] as const

/* ------------------------------------------------------------ per-glyph ---
   A wrong face gets each glyph's ADVANCE wrong, and those errors accumulate
   INSIDE a word as well as across a run. `display` is the proof that the two
   are different defects: its per-WORD free-translation floor is exactly 0.0000
   — both words are already optimally placed — and its per-GLYPH work still
   takes the band 12.3272 -> 8.0289. Rule 54 remains true about the letterforms;
   it never said the drift was unreachable. */

/** "CREATE ACCOUNT" — 13 spans for 14 characters. The space is index 6 of the
 *  source and carries NO span and no offset, which is what keeps the run's own
 *  `ws: 4.2952` word-spacing live.
 *  Swept -2.00..+2.00 at 0.25 with every glyph bracketed, then refined at
 *  0.125. NOT proven converged: the refinement improved 7 of 13 and no third
 *  pass was run, so there is more here. */
export const DISPLAY_GX = [
  -0.125, -1.25, -1.125, 0.5, 0.5, 0.0,
  0.125, 0.125, 0.0, -0.5, -0.125, -0.125, -0.875,
] as const

/** "Create your ShotIQ account to save analyses," — 38 glyphs, continuous
 *  across the seven words, RELATIVE to LEDE1_DX above.
 *  CORRECTION TO THIS COMMENT'S FIRST VERSION, which claimed FOUR unbracketed
 *  glyphs. Index 30 ("n", +1.00) IS bracketed and is a solved value — 0.75 gives
 *  10.3084 and 1.25 gives 10.3003, both worse. It was reported as an edge hit
 *  and was not one.
 *  Three genuinely are unbracketed: 34 ("s", +1.00), 36 ("s", -1.00) and 37
 *  (the comma, -1.00), all in the tail of "analyses,".
 *
 *  THEY ARE DECLINED, AND THE REASON IS THE INTERESTING PART. Pushed to their
 *  true optima the band goes 10.2864 -> 9.6241, worth 0.0158 of whole screen —
 *  and the run then reads "analy s(+), " with the s collided into the e. It is
 *  illegible, and THE BAND MEAN REWARDS IT. A per-pixel objective has no
 *  legibility term, so left to run it walks toward glyph collisions: at the
 *  shipped values 16 of 49 adjacent pairs already overlap where the face had
 *  none (display 5 of 12, min gap -1.147 CSS px; lede1 11 of 37, min -1.419).
 *  See rule 67. */
export const LEDE1_GX = [
  0.0, 0.0, 0.25, 0.0, -0.25, 0.0,
  -0.25, -0.25, 0.0, 0.25,
  -0.5, -0.25, -0.25, 0.0, -0.25, 0.5,
  0.25, 0.0, -0.25, -0.25, 0.0, -0.25, -0.25,
  -0.25, -0.25,
  0.0, -0.5, -0.75, -0.75,
  0.0, 1.0, -0.5, 0.0, 0.5, 1.0, -0.25, -1.0, -1.0,
] as const
