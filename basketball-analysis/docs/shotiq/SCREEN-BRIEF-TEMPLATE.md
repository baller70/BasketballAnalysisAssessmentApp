# Screen brief template

The per-screen briefs kept dying with the scratchpad, so the shape lives here in
git instead. Fill the placeholders, hand it to one builder agent, and give that
agent exactly one screen.

`BRIEF-002.md` — the version this was recovered from — was lost in the rollback.
If anything below reads as generic where the old one was specific, that is why;
tighten it as screens teach more.

---

## Brief: screen `<NNN>-<name>`

You own ONE screen and you do not stop until it is finished. Kevin's rule
overrides everything else in this brief: **do not move on from a screen until it
is 100% done.** Nobody is going to come back and finish it later.

### Your target

- Canonical: `basketball-analysis/docs/shotiq/canonical/<NNN>-<name>.png`
  (desktop screens: `canonical-desktop/`)
- Route: `<route>` — check `docs/shotiq/ios-route-map.json` for the query params
  the harness uses to reach it deterministically.
- Invariant: iOS screens are **393 CSS pt wide**. Desktop screens are
  **900x1440 with exactly one 196px sidebar**. Breaking the invariant fails the
  screen no matter how good the type is.

### Read first, before you measure anything

`basketball-analysis/docs/SCREEN-LEDGER.md`, in full. Its **Method rules** were
each learned by getting a measurement wrong, and every one of them has already
cost a round. The ones that bite hardest:

- Measure in the shipping rasteriser. `capture-ios.mjs` launches with
  `--font-render-hinting=none`; a bare `chromium.launch()` hints stems and
  shifts advances, which alone produced a false +5px advance defect.
- Weight on the **green** channel; ink on orange runs on the **blue** channel.
- **Row-segment then column-segment into ink runs. Never a fixed crop box.**
- Canonical is unsharp-masked. Below ~30px an eroded stroke core is
  unobtainable, so a colour defect reported from one at that size is not real.

### What DONE means

Every one of these, measured, not eyeballed:

1. Every canonical band present, in canonical order, at canonical position.
2. Type: cap height, advance width and ink density per ink run.
3. Colour: every role probed from eroded stroke cores, never band medians.
4. Geometry: cards, gutters, rules, bar strokes, icon sizes.
5. Imagery: right asset, right crop, right drawn size — **open the asset**, do
   not just read the CSS. Screen 002 drew an entirely different photograph at
   exactly the right size and position and nobody caught it from the markup.
6. No overflow, truncation, overprinting, or one-word-per-line columns.
7. Reachable by a real user path AND deterministically by the harness.
8. An independent grader scores it **A or A+**. Not "improved".

### How to work

- Scope everything to this screen. **Never edit the four measurement-tuned type
  roles in `globals.css`** and never change a global token to settle a colour
  disagreement on one screen — those roles carry the 20 desktop screens.
- Never delete a region or pad dead space to improve a score.
- Solve related runs **jointly**, not one at a time. Two runs sharing a token
  will trade error back and forth forever if you tune them separately.
- Before you tune per-run leading, check whether the cap-top deltas share a
  sign. A consistent sign across unrelated runs at different sizes is one
  container offset, not N leading errors — and fixing it N times lands the cap
  tops while leaving every inter-band gap wrong.
- State a physically unreachable residual with its numbers and the measured
  alternative. "I tried and it did not work" is not that; see the ledger's
  crossbar algebra on 002 for what it has to look like.
- Use your own `NEXT_DIST_DIR` and port. **`rm -rf` your dist when you finish** —
  a round has already run out of disk because agents left theirs behind.
- Never build into a dist dir while a server serves from it.
- Do not commit a tree that fails `tsc`.

### What to report back

Per band and per ink run: cap, advance, ink density, the area ladder, and the
delta against canonical. Say which residuals you could not close and why, with
numbers. Do not report "matches" without the measurement behind it — a builder's
negative finding gets verified exactly as hard as a positive one, and one has
already been wrong.
