# ShotIQ Visual Proof — Structural Gate (accepted criteria)

Generated 2026-07-31, after the acceptance criteria were switched (with the
owner's approval) from raster equality to the structural gate proposed in
`acceptance-gate-findings.md`.

## The gate (enforced by `npm run proof:visual`, exit code)

1. HTTP 200 per route at the exact sidecar viewport (1440x900, dPR 1, sRGB).
2. Every `critical` sidecar region (`topbar`, `sidebar`, `main`) present in the
   DOM, visible, and >=60% contained in its sidecar bounds after clipping to
   the canonical canvas.
3. Zero broken same-origin images (external CDN reachability is environmental
   and reported separately).
4. Canonical fonts loaded: Inter, Bebas Neue, and Oswald (the documented
   substitute for the unlicensable DIN Condensed).
5. Zero JavaScript/page errors and zero same-origin resource failures.
   Auth-gated 401/403 on `/api/*` under a logged-out renderer is correct
   behaviour and does not gate.
6. SSIM regression guard: no screen may drop >0.02 below the recorded floor
   (`visual-proof-floor.json`).

## Result: 20/20 PASS

| screen | SSIM | regions | imgs | fonts | jsErr | verdict |
|---|---|---|---|---|---|---|
| `077-web-sign-in` | 0.6329 | 3/3 | 0 | ok | 0 | **PASS** |
| `078-web-onboarding` | 0.5330 | 3/3 | 0 | ok | 0 | **PASS** |
| `079-web-home-dashboard` | 0.5269 | 3/3 | 0 | ok | 0 | **PASS** |
| `080-web-standard-dashboard` | 0.5366 | 3/3 | 0 | ok | 0 | **PASS** |
| `081-web-analyze-workspace` | 0.5674 | 3/3 | 0 | ok | 0 | **PASS** |
| `082-web-live-capture` | 0.5031 | 3/3 | 0 | ok | 0 | **PASS** |
| `083-web-analysis-overview` | 0.6549 | 3/3 | 0 | ok | 0 | **PASS** |
| `084-web-biomechanics-workspace` | 0.5987 | 3/3 | 0 | ok | 0 | **PASS** |
| `085-web-flaws-history` | 0.5517 | 3/3 | 0 | ok | 0 | **PASS** |
| `086-web-player-card` | 0.5532 | 3/3 | 0 | ok | 0 | **PASS** |
| `087-web-elite-comparison` | 0.5798 | 3/3 | 0 | ok | 0 | **PASS** |
| `088-web-elite-shooters-database` | 0.5497 | 3/3 | 0 (+19 ext) | ok | 0 | **PASS** |
| `089-web-elite-shooter-detail` | 0.5013 | 3/3 | 0 | ok | 0 | **PASS** |
| `090-web-training-hub` | 0.6088 | 3/3 | 0 | ok | 0 | **PASS** |
| `091-web-drill-execution` | 0.5088 | 3/3 | 0 | ok | 0 | **PASS** |
| `092-web-goals-plan` | 0.6905 | 3/3 | 0 | ok | 0 | **PASS** |
| `093-web-analytics-history` | 0.6860 | 3/3 | 0 | ok | 0 | **PASS** |
| `094-web-media-library` | 0.4166 | 3/3 | 0 | ok | 0 | **PASS** |
| `095-web-achievements-points` | 0.6801 | 3/3 | 0 | ok | 0 | **PASS** |
| `096-web-profile-settings` | 0.5958 | 3/3 | 0 | ok | 0 | **PASS** |

**measured 20/20 · passing 20/20 · mean SSIM 0.5738**

## Correction to earlier SSIM figures

While bringing the structural gate up, the harness caught a measurement fault:
the previous "round 2" run (mean 0.6410) was served by a **stale Next.js
process** whose JS/CSS chunks had been replaced by a newer build — pages were
measured **unstyled**, which inflates SSIM against these white-dominant
references. The honest, fully-styled mean is **0.5738** (baseline 0.3380).
The stale-serving failure is precisely the class of defect the structural gate
now catches (same-origin resource failures gate the run), which is how it was
found. `visual-proof-round2.md` is superseded by this report.

## What still keeps SSIM below ~0.7

Unsupplied photo assets (up to 25% of canvas), generated-raster references
(zero flat patches, off-token colours), and OCR-derived text. See
`acceptance-gate-findings.md`. These are input gaps, not implementation gaps,
and the structural gate is the accepted acceptance standard.
