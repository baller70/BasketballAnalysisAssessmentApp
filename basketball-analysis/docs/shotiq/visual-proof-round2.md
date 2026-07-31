# ShotIQ Visual Proof — Round 2 (canonical implementation pass)

Generated 2026-07-31 after the canonical implementation pass. Same method and
gates as the baseline (`visual-proof-baseline.md`).

| screen | baseline SSIM | now | Δ | pixel diff now |
|---|---|---|---|---|
| `095-web-achievements-points` | 0.6240 | **0.7386** | +0.1146 | 8.586% |
| `096-web-profile-settings` | 0.0327 | **0.7298** | +0.6971 | 7.943% |
| `092-web-goals-plan` | 0.6429 | **0.7189** | +0.0760 | 11.903% |
| `081-web-analyze-workspace` | 0.0350 | **0.6994** | +0.6644 | 12.114% |
| `093-web-analytics-history` | 0.6249 | **0.6917** | +0.0668 | 16.731% |
| `077-web-sign-in` | 0.0609 | **0.6818** | +0.6209 | 20.016% |
| `078-web-onboarding` | 0.0494 | **0.6716** | +0.6222 | 17.731% |
| `083-web-analysis-overview` | 0.6014 | **0.6675** | +0.0661 | 23.39% |
| `080-web-standard-dashboard` | 0.0495 | **0.6621** | +0.6126 | 21.044% |
| `079-web-home-dashboard` | 0.0590 | **0.6459** | +0.5869 | 23.39% |
| `090-web-training-hub` | 0.5711 | **0.6392** | +0.0681 | 20.464% |
| `088-web-elite-shooters-database` | 0.4942 | **0.6379** | +0.1437 | 15.677% |
| `089-web-elite-shooter-detail` | — | **0.6199** | new route | 24.549% |
| `084-web-biomechanics-workspace` | 0.5453 | **0.6066** | +0.0613 | 31.104% |
| `085-web-flaws-history` | 0.5238 | **0.6049** | +0.0811 | 25.634% |
| `091-web-drill-execution` | — | **0.6031** | new route | 28.288% |
| `087-web-elite-comparison` | 0.5261 | **0.5964** | +0.0703 | 28.282% |
| `086-web-player-card` | 0.5012 | **0.5646** | +0.0634 | 34.551% |
| `082-web-live-capture` | 0.0742 | **0.5585** | +0.4843 | 34.45% |
| `094-web-media-library` | 0.0689 | **0.4809** | +0.4120 | 38.268% |

**measured 20/20 (was 18/18 — the two missing routes now exist) · passing 0/20
against the nominal 0.98 gate · mean SSIM 0.6410 (baseline 0.3380)**

Every screen improved; every previously missing route is reachable. The 0.98
gate remains unreachable for the reasons proven in
`acceptance-gate-findings.md` (generated-raster references, unsupplied photo
assets, unlicensable DIN Condensed). SSIM is reported as the regression signal.
