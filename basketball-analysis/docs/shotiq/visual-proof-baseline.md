# ShotIQ Visual Proof — Baseline (pre-implementation)

Generated 2026-07-31. This is the **honest starting measurement** of the existing
repository routes against the canonical reference screens. It is a baseline, **not**
an acceptance result: **0 of 18 screens pass**.

Reproduce:

```bash
cd basketball-analysis
NODE_ENV=production npx next start -p 3000 &
REF_DIR=/path/to/canonical/output npm run proof:visual
```

## Method

Each mapped desktop route is rendered headless at its exact sidecar viewport
(1440x900, devicePixelRatio 1, sRGB, en-US, scrollbars hidden), gated on
`document.fonts.ready` plus two animation frames, then compared to the canonical
reference PNG using pixelmatch and SSIM — whole-screen and per critical region.

Gate (from the sidecars): whole-screen SSIM >= 0.98, every `critical` region at or
above its `fidelityFloor` (0.98), zero broken images, no fallback fonts.

## Results

| screen | route | SSIM | pixel diff | critical regions failing | verdict |
|---|---|---|---|---|---|
| `092-web-goals-plan` | `/results/demo/goals` | 0.6429 | 19.459% | 3/3 | FAIL |
| `093-web-analytics-history` | `/results/demo/history` | 0.6249 | 23.64% | 3/3 | FAIL |
| `095-web-achievements-points` | `/points` | 0.6240 | 16.756% | 3/3 | FAIL |
| `083-web-analysis-overview` | `/results/demo/analysis` | 0.6014 | 30.271% | 3/3 | FAIL |
| `090-web-training-hub` | `/results/demo/training` | 0.5711 | 29.956% | 3/3 | FAIL |
| `084-web-biomechanics-workspace` | `/results/demo/analysis` | 0.5453 | 37.664% | 3/3 | FAIL |
| `087-web-elite-comparison` | `/results/demo/compare` | 0.5261 | 35.32% | 3/3 | FAIL |
| `085-web-flaws-history` | `/results/demo/flaws` | 0.5238 | 32.619% | 3/3 | FAIL |
| `086-web-player-card` | `/results/demo/player` | 0.5012 | 41.616% | 3/3 | FAIL |
| `088-web-elite-shooters-database` | `/elite-shooters` | 0.4942 | 25.695% | 3/3 | FAIL |
| `082-web-live-capture` | `/video-analysis` | 0.0742 | 80.694% | 3/3 | FAIL |
| `094-web-media-library` | `/media` | 0.0689 | 80.141% | 3/3 | FAIL |
| `077-web-sign-in` | `/signin` | 0.0609 | 85.721% | 3/3 | FAIL |
| `079-web-home-dashboard` | `/dashboard` | 0.0590 | 83.997% | 3/3 | FAIL |
| `080-web-standard-dashboard` | `/dashboard` | 0.0495 | 83.934% | 3/3 | FAIL |
| `078-web-onboarding` | `/onboarding` | 0.0494 | 86.162% | 3/3 | FAIL |
| `081-web-analyze-workspace` | `/analyze` | 0.0350 | 87.404% | 3/3 | FAIL |
| `096-web-profile-settings` | `/profile` | 0.0327 | 89.258% | 3/3 | FAIL |

**measured 18/18 · passing 0/18 · mean SSIM 0.3380**

Two screens (`089-web-elite-shooter-detail`, `091-web-drill-execution`) are absent
from this table because they have no route yet — see the gap register in the screen
implementation map.

## Interpretation

The results fall into two clear clusters:

- **SSIM 0.03–0.08** — `signin`, `onboarding`, dashboards, `analyze`, `live-capture`,
  `media-library`, `profile-settings`. These routes share almost nothing with the
  canonical design. They require rebuilding against canonical geometry, not tuning.
- **SSIM 0.49–0.64** — the `results/demo` tab family. Closer in structure, still far
  below the 0.98 gate.

Every screen fails all three critical regions (`topbar`, `sidebar`, `main`), which is
consistent with the canonical design being the white ShotIQ interface while the
existing routes still carry the legacy presentation.

No screen is claimed to be "1:1". These are the measured scores.
