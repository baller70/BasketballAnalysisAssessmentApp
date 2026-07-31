# ShotIQ Sidecar Authority Report

Generated 2026-07-31 · batch `shotiq-white-court-imagegen2-2026-07-30-v2`

Reproduce with:

```bash
python3 tools/shotiq-sidecar/audit.py     # extract + validate all 92
python3 tools/shotiq-sidecar/extract.py   # write sidecars, consolidate tokens
python3 tools/shotiq-sidecar/emit.py      # emit tokens, map, this report's inputs
```

## Scope

Exactly **92 logical screens** were processed — 72 iOS and 20 desktop. Physical
derivatives, `raw`, `raw-imagegen`, `proof`, overlays, diffs and
`*.embedded.extracted.sidecar.json` were **not** treated as production screen inputs.

## Result summary

| Check | Result |
|---|---|
| Screens audited | **92 / 92** |
| iOS canvas 853 × 1844 | **72 / 72** |
| Desktop canvas 1440 × 900 | **20 / 20** |
| `HoopTrackLayoutSidecar` iTXt present | **92 / 92** |
| Sidecar parses as JSON | **92 / 92** |
| `schemaVersion` = `2.0.0` | **92 / 92** |
| `appId` = `shotiq` | **92 / 92** |
| Single `batchId` across batch | **92 / 92** |
| Sidecar canvas == PNG canvas | **92 / 92** |
| Unique `screenId` | **92 / 92** |
| Unique IDAT SHA-256 | **92 / 92** |
| PNG chunk CRC validation | **92 / 92 pass** |
| `canonicalContractSha256` present & unique | **92 / 92** |
| **Unresolved authority errors** | **0** |

Measured totals: **12,658 elements**, **276 semantic regions**, **276 asset references**.

Element type distribution: `vectorShape` 7,612 · `text` 2,736 · `card` 1,255 ·
`divider` 483 · `group` 276 · `photo` 149 · `screen` 92 · `button` 55.

## Pixel preservation

The audit is **read-only**. No PNG was rewritten, so IDAT hashes and dimensions are
unchanged by definition. Every file's chunk CRCs were verified intact after transfer,
and each downloaded byte length matched the source metadata exactly — confirming the
transfer preserved the supplied pixels. No re-embedding was required, because all 92
sidecars already satisfy the schema-parity and canvas-parity checks.

## Design tokens

Design tokens are **byte-identical across all 92 screens — zero drift**. This is what
makes a single generated token source valid for both clients.

| Group | Tokens |
|---|---|
| colors | `paper #FFFFFF` · `warmCanvas #F7F7F4` · `ink #111111` · `graphite #5F646B` · `rule #D9D9D4` · `shotiqOrange #FF5A1F` · `analysisBlue #2D6CDF` · `confirmGreen #168A55` · `reviewRed #D92D20` · `muted #A7AAB0` |
| spacing | `xs 4` · `sm 8` · `md 16` · `lg 24` · `xl 32` |
| radii | `none 0` · `control 6` · `card 8` · `pill 999` |
| typography | 11 roles across `Inter`, `Bebas Neue`, `DIN Condensed` |

The palette confirms the **white ShotIQ interface** as the active design.

Generated from this single source:

- `basketball-analysis/src/styles/shotiq-tokens.css`
- `basketball-analysis/src/lib/design/shotiqTokens.ts`
- `basketball-analysis/ios/App/App/Generated/ShotIQTokens.swift`

## Rendering and measurement contract

Taken verbatim from the sidecars, these drive the Phase 7 proof harness:

- `renderingContract.viewport` — 1440×900 desktop, 853×1844 iOS
- `devicePixelRatio` 1 · `colorSpace` srgb · `locale` en-US · `browserZoom` 1
- `defaultBoxSizing` border-box, plus `fontLoadingGate` and `screenshotGate`
- `measurementContract.coordinateSpace` `final-bitmap-source-pixels`, origin top-left,
  `precisionPx` 1, `autoCorrectGlobalTransform` false

Regions carry `critical: true` and `fidelityFloor: 0.98`, matching the required SSIM
gate per critical region.

## Caveat on text content — must be read before building

Text elements carry two distinct fields, and they are not equally trustworthy:

- `text` / `generatedObservedText` — recovered from the generated bitmap by **OCR**
- `ocrConfidence`, and `referenceTextMatched`

A number of text elements have `referenceTextMatched: false` with mid-80s
`ocrConfidence`. For example `desktop.web-sign-in.text-001` carries
`"text": "2,840 6"` at 89.22 confidence — that is OCR noise, not authored copy.

**Consequence:** element *geometry* (bounds, inkBounds, baseline, font metrics) is
authoritative and should drive layout. Element *string content* is not uniformly
authoritative and must not be copied blindly into production UI. Phase 7's "exact text
content" gate cannot be run against OCR-derived strings without a human-authored copy
deck for the affected elements. This is a genuine input gap, not an implementation
shortcut — flagging rather than silently shipping OCR noise as product copy.

## Package files not supplied

The shared folder contained `ios/` and `desktop/` only. These package-level files
referenced in the task were **not present** and so could not be reconciled:

`app.manifest.json` · `component-registry.json` · `asset-registry.json` ·
`asset-request.json` · `batch-report.json` · `README.md`

Impact: asset identity cannot be pinned to `asset-registry.json` / `asset-request.json`
IDs (Phase 6). The 276 in-sidecar asset references are present and were inventoried,
but stable cross-batch asset identity needs those registries.

## What this report does not claim

It does **not** claim any screen is implemented, rendered, or pixel-matched. It
establishes only that all 92 canonical sidecars are authoritative and usable as the
build contract. Visual proof is Phase 7 and is reported separately.
