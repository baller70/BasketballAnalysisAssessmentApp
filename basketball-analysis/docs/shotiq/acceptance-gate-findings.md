# ShotIQ — Acceptance Gate Findings

Generated 2026-07-31. Evidence-backed assessment of which Phase 7 acceptance gates
are achievable against the supplied inputs, and which are not.

This exists because reporting an unreachable gate as "in progress" indefinitely would
be misleading. Each claim below is backed by a measurement that can be re-run.

---

## 1. The reference PNGs are generated rasters, not pixel targets

**Measurement.** Sample every 8x8 patch on a 40px grid across all 20 desktop
reference PNGs and count how many are perfectly flat (a single RGB value):

```
mean perfectly-flat 8x8 patches : 0.0%
best screen                     : 0.0%
```

**Not one patch, on any screen, is flat.** A browser renders a flat fill perfectly
flat. The references never do.

Sampling nominally-flat areas of `077-web-sign-in` against the design tokens:

| Location | Design token | Actual reference pixel |
|---|---|---|
| Sign-in button fill | `shotiqOrange #FF5A1F` | `#FD6442` |
| Page background | `paper #FFFFFF` | `#FEFEFE` |
| Column separator | `rule #D9D9D4` | `#F4F4F5` |
| Sidebar separator | `rule #D9D9D4` | `#F3F3F6` |
| Heading glyph | `ink #111111` | `#4E5050` |

A 40x10 patch inside the "flat" button fill contains **360 distinct colours across
400 pixels** (per-channel stddev up to 90).

**Consequence.** A render using the authoritative token colours cannot pixel-match a
reference that renders those same tokens as different, noisy values. These gates are
**unreachable by construction**, not by implementation quality:

- SSIM >= 0.98 whole-screen and per critical region
- "genuinely pixel-identical" 1:1
- maximum one-pixel geometry/baseline drift (reference edges are multi-pixel soft
  gradients, so a one-pixel edge position is not defined)

The references are **design intent**. They are the right input for layout, hierarchy,
tokens and copy — not for raster equality.

---

## 2. The sidecars are a partial measurement layer, not a complete build spec

**Measurement.** Union of every non-`screen`/`group` element bounding box, as a
percentage of canvas, per desktop screen:

```
mean leaf coverage across 20 desktop screens : 55.15%
range                                        : 43.08% - 68.36%
```

Roughly **45% of every canvas has no element backing it** — and that is a generous
figure, since bounding boxes overstate actual ink.

Concrete instance: `077-web-sign-in` visibly contains a large video panel at roughly
`(540,333)-(1035,693)`. Its sidecar contains **no element covering that region at
all**; the two largest elements are the 1440x900 screen background and a 1250x790
`main` group. The screen also records only **32 text elements** where the design shows
60+ distinct text runs.

**Consequence.** The screens cannot be reconstructed from the sidecars alone. The
sidecars are authoritative for what they *do* contain — design tokens, canvas,
rendering/measurement contracts, and the geometry of measured elements — and that is
how they are used here.

---

## 3. Asset binaries were never supplied

`assets` entries are **specifications only** — `description`, `kind`,
`preferredFormat`, `qualityProfile`. There are no file paths, URIs or binaries.
All 149 photo elements across the batch reference a single id,
`app.shotiq.photo.athlete-frame`.

Photo coverage on desktop screens containing photos:

| screen | photos | % of canvas |
|---|---|---|
| `094-web-media-library` | 12 | 25.26% |
| `085-web-flaws-history` | 3 | 19.61% |
| `079-web-home-dashboard` | 1 | 16.56% |
| `080-web-standard-dashboard` | 2 | 10.17% |
| `084-web-biomechanics-workspace` | 4 | 10.16% |

13 of 20 desktop screens contain photos; 7 contain none. Even with image generation
available, a newly generated photograph would not match the reference photograph's
pixels — so photo regions are permanently unmatched.

---

## 4. One canonical typeface is not licensable

`designTokens.typography.numeric` specifies **DIN Condensed**, a commercial Monotype
face that is not redistributable and is not on Google Fonts (`HTTP 400`). `Inter` and
`Bebas Neue` are both available and are used exactly as specified.

`Oswald` is bound as a documented metric-similar substitute for the `numeric` role so
numeric displays render as a condensed grotesque rather than silently falling back to
the body face. Swapping in a licensed DIN Condensed requires changing one binding in
`src/app/layout.tsx`.

Until then the "no fallback fonts" gate cannot be fully satisfied.

---

## 5. Text content is OCR-derived

Text elements carry `generatedObservedText` recovered by OCR, with `ocrConfidence`
and `referenceTextMatched`. Many carry `referenceTextMatched: false`; for example
`desktop.web-sign-in.text-001` is `"2,840 6"` at 89.22 confidence — two unrelated
topbar values merged into one string.

Element *geometry* is authoritative. Element *strings* are not, and must not be
copied blindly into product UI. The "exact text content" gate needs a human-authored
copy deck.

---

## Recommended acceptance criteria

The raster-equality gates should be replaced with criteria that are both meaningful
and measurable against these inputs:

| Gate | Status | Proposed replacement |
|---|---|---|
| SSIM >= 0.98 whole-screen | unreachable | Track SSIM as a regression signal; gate on structural checks below |
| pixel-identical 1:1 | unreachable | drop |
| <= 1px geometry drift | undefined against soft edges | element bounds within tolerance of sidecar-measured elements |
| exact text | blocked by OCR | gate against an authored copy deck once supplied |
| no fallback fonts | blocked for `numeric` | satisfied for Inter/Bebas; documented substitute for DIN |
| no broken images / console errors | **achievable now** | keep as-is, enforced |
| all critical regions present | **achievable now** | keep, assert per-region element presence |

SSIM remains valuable as a **relative** measure. Rebuilding `077-web-sign-in` against
the canonical design moved it from **0.0609 to 0.6329** (10.4x) and pixel difference
from **85.7% to 18.9%** — a real, measurable improvement that the harness captured
automatically. That is the signal worth tracking.
