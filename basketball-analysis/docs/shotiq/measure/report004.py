"""Band-by-band report for screen 004-create-account.

ESTIMATOR: :func:`measure.compare.band_report` — per-region mean absolute
per-channel difference over the top-anchored common region, 0-255 units, plus
``n_over`` at the default 8.0 threshold. Canonical is 853x1844, the render
1849; top-anchored, so the 5-row artboard difference is dropped from the
bottom and is never a defect (ledger, "the canonical artboard is 393x850pt").

The windows are the twenty canonical bands of 004 in CANONICAL DEVICE PIXELS,
taken from the box geometry recorded in ``src/app/signup/phone-004.ts`` and
padded to include each region's ink rather than only its box:

    field boxes   first 607.56 last 792.71 email 976.52 pass 1151.19
                  confirm 1356.35, heights 92.85 91.83 91.35 92.90 90.74
    plate         1544.11 + 92.12
    sign in       1705.88 + 90.75

A band is deliberately WIDER than its ink so that a run which has drifted out
of position still lands inside its own band and is counted against it — a band
cropped to the ink measures agreement with the crop, not with canonical.

Run from ``docs/shotiq``::

    python3 -m measure.report004 RENDER.png [CANONICAL.png]
"""

from __future__ import annotations

import sys

from . import compare, image

#: name -> (y0, y1, x0, x1) in canonical device px. Full width unless a region
#: shares its rows with another (the two eye marks sit beside their fields, and
#: are reported separately so a mark defect cannot hide inside a field's mean).
WINDOWS: dict[str, tuple[int, int, int, int]] = {
    "wordmark":   (14, 74, 0, 853),
    # 148-220 CLIPPED ITS OWN RUN. Canonical's display ink spans y 162-239 and
    # this window stopped at 220, so 20 rows — a quarter of the run, including
    # the whole of its baseline row — were outside the band the solver scored.
    # Optimising it moved the run up to suit the visible top and pushed the
    # bottom out of alignment into the gap between windows, where nothing was
    # looking: the band improved 14.8012 -> 13.9966 while the WHOLE SCREEN got
    # worse, 5.3708 -> 5.3801, and row 238 alone went 11.9 -> 71.5.
    # Every other window on this screen was checked the same way and is clear.
    "display":    (148, 248, 0, 853),
    "lede":       (268, 352, 0, 853),
    "monogram":   (415, 492, 60, 180),
    "oneacct":    (415, 492, 180, 853),
    "labFirst":   (552, 600, 0, 853),
    "fieldFirst": (600, 706, 0, 853),
    "labLast":    (738, 786, 0, 853),
    "fieldLast":  (786, 890, 0, 853),
    "labEmail":   (920, 968, 0, 853),
    "fieldEmail": (968, 1072, 0, 853),
    "labPass":    (1100, 1148, 0, 853),
    "fieldPass":  (1148, 1248, 0, 700),
    "eyePass":    (1148, 1248, 700, 780),
    "helpPass":   (1252, 1296, 0, 853),
    "labConfirm": (1305, 1352, 0, 853),
    "fieldConf":  (1352, 1452, 0, 700),
    "eyeConf":    (1352, 1452, 700, 780),
    "checkbox":   (1462, 1522, 55, 125),
    "terms":      (1462, 1522, 125, 853),
    "plate":      (1538, 1642, 0, 853),
    "orrow":      (1650, 1690, 0, 853),
    "signin":     (1700, 1802, 0, 853),
}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    render = image.load(argv[1])
    canon = image.load(argv[2] if len(argv) > 2 else "canonical/004-create-account.png")

    whole = compare.mean_abs_diff(canon, render)
    print(f"whole screen   mean|d| {whole.mean_abs:.4f}   max {whole.max_abs:.0f}   "
          f"n_over8 {whole.n_over}")
    print(f"  estimator: {whole.estimator}")
    print()

    rep = compare.band_report(canon, render, WINDOWS)
    rows = sorted(rep.items(), key=lambda kv: -kv[1].mean_abs)
    w = max(len(k) for k in rep)
    print(f"{'band'.ljust(w)}  {'mean|d|':>9}  {'max':>5}  {'n_over8':>8}")
    print("-" * (w + 28))
    for name, d in rows:
        print(f"{name.ljust(w)}  {d.mean_abs:9.4f}  {d.max_abs:5.0f}  {d.n_over:8d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
