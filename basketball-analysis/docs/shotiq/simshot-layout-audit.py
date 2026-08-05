#!/usr/bin/env python3
"""Layout audit for a simshots capture: find clipping, truncation and squeezed
columns across every captured native screen.

WHY THIS EXISTS
===============

Kevin's report was "almost every screen ... it's not good — alignment issues,
text oversized, running off the page". Every automated signal the project had
said the opposite: 74 simulator screenshots, no failures, a green walk. Both
were true, because nothing was MEASURING the screenshots. They were captured,
counted for duplicates, and looked at by a human only occasionally.

The click-test walk asserts that a control lands on the right screen. It says
nothing about whether the screen that arrives is readable. So this reads the
pixels and answers two questions the ledger's DONE definition already demands
("no overflow, truncation, overprinting, or one-word-per-line columns") but
which no check enforced:

  1. EDGE CLIPPING — ink running into the outermost columns. When a row of
     fixed-width children sums past the viewport, SwiftUI lays the whole screen
     out wider than the display and centres it, so content is cut off BOTH
     sides at once, header wordmark and tab bar included (the failure described
     at length in Components/CanonicalPhoto.swift). Screens that are legitimately
     full-bleed are listed in FULL_BLEED and excluded by name, not by threshold.

  2. SQUEEZED COLUMNS — a stack of consecutive short lines, i.e. text wrapping
     one or two words per line. This is what "DASHBOARD MODE" breaking into
     "DASH / BOAR / D / MODE" looks like to a measurement, and it is the single
     most legible sign that a column is far narrower than its content needs.

ESTIMATORS, NAMED (ledger rule 25 — a threshold without a named estimator is a
hand-picked column waiting to happen):

  edge ink   : count of ink pixels (luma < 200) in the outermost 2 columns,
               over body rows only (6%..94% of height, excluding status bar and
               home indicator), together with the VERTICAL SPAN those pixels
               cover. Both matter, and the count alone is misleading: a sheet
               presented over a dimmed backdrop shows its rounded top corner at
               both edges, which on this app reads 167 px left and 152 px right
               on four different screens — identical numbers, because it is one
               shared component and not a defect at all. Clipped content, by
               contrast, runs DOWN the side: 024's right edge spans 58% of the
               height and 040's left edge 74%. So clipping is flagged on span
               (`span_frac`), with the count reported for context. A guard that
               cries wolf on legitimate chrome gets ignored, which is worse than
               no guard.
  line       : a row-band of ink separated from its neighbours by >= 6 blank
               rows, whose height is between 0.4% and 2.8% of the screen — tall
               enough to be type, short enough not to be a card or an image.
  squeezed   : >= `min_run` consecutive lines whose ink width is under
               `narrow_frac` of the screen width.

Both are deliberately conservative. They are a floor, not a ceiling: a screen
this passes can still be wrong in ways only a canonical comparison catches.

USAGE
=====

    python3 simshot-layout-audit.py <dir-of-pngs> [--json out.json]

Exit code is non-zero if any screen fails, so it can gate CI. A directory with
fewer than `--min-screens` PNGs is an ERROR, not a pass: an empty set trivially
has no defects, and reporting that as clean is the null-as-data mistake ledger
rule 30 exists to prevent.
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys

import numpy as np
from PIL import Image

#: Screens whose canonical design really does run to the edge — camera
#: viewfinders, full-bleed photography, and sheets presented over a dimmed
#: backdrop whose own edge is the sheet, not clipped content. Excluded BY NAME
#: so that a genuine regression on one of them is a visible edit to this list
#: rather than a threshold quietly swallowing it.
FULL_BLEED = {
    "025",  # photo-comparison — two full-bleed frames
    "030",  # live-camera-setup — camera preview
    "031",  # hoop-calibration — camera preview
}


def load_luma(path: str) -> np.ndarray:
    return np.asarray(Image.open(path).convert("RGB")).astype(float).mean(axis=2)


def row_bands(ink: np.ndarray, min_gap: int = 6) -> list[tuple[int, int]]:
    """Contiguous inked row runs, merged across gaps shorter than ``min_gap``."""
    on = ink.sum(axis=1) > 0
    bands: list[tuple[int, int]] = []
    start = None
    gap = 0
    for i, v in enumerate(on):
        if v:
            if start is None:
                start = i
            gap = 0
        elif start is not None:
            gap += 1
            if gap >= min_gap:
                bands.append((start, i - gap))
                start = None
    if start is not None:
        bands.append((start, len(on) - 1))
    return bands


def audit_screen(path: str, edge_tol: int, narrow_frac: float, min_run: int,
                 span_frac: float) -> dict:
    lum = load_luma(path)
    H, W = lum.shape
    name = os.path.basename(path).split("_")[0]
    ink = lum < 200
    body = ink[int(H * 0.06):int(H * 0.94)]

    cols = body.sum(axis=0)
    edge_l, edge_r = int(cols[0:2].sum()), int(cols[W - 2:W].sum())

    def edge_span(sl: slice) -> float:
        """Fraction of the screen height over which this edge carries ink."""
        rows = np.nonzero(body[:, sl].any(axis=1))[0]
        return 0.0 if not len(rows) else float(rows[-1] - rows[0]) / H

    span_l, span_r = edge_span(slice(0, 2)), edge_span(slice(W - 2, W))

    tight = lum < 170
    tbody = tight[int(H * 0.06):int(H * 0.93)]
    lines = [
        (y0, y1) for y0, y1 in row_bands(tbody)
        if H * 0.004 < (y1 - y0) < H * 0.028
    ]
    longest = run = 0
    narrowest = W
    for y0, y1 in lines:
        seg = tbody[y0:y1 + 1]
        nz = np.nonzero(seg.sum(axis=0))[0]
        width = int(nz[-1] - nz[0]) if len(nz) else 0
        if width < W * narrow_frac:
            run += 1
            longest = max(longest, run)
            narrowest = min(narrowest, width)
        else:
            run = 0

    full_bleed = name[:3] in FULL_BLEED
    clipped = (not full_bleed) and (
        (edge_l > edge_tol and span_l > span_frac)
        or (edge_r > edge_tol and span_r > span_frac)
    )
    squeezed = longest >= min_run

    return {
        "screen": name, "width": W, "full_bleed": full_bleed,
        "edge_left": edge_l, "edge_right": edge_r,
        "edge_span_left": round(span_l, 4), "edge_span_right": round(span_r, 4),
        "clipped": clipped,
        "longest_narrow_run": longest,
        "narrowest_line": (narrowest if longest else None),
        "squeezed": squeezed,
        "fail": clipped or squeezed,
    }


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("directory")
    ap.add_argument("--edge-tol", type=int, default=8,
                    help="ink px allowed in the outermost 2 columns (default 8)")
    ap.add_argument("--span-frac", type=float, default=0.10,
                    help="edge ink must run down more than this fraction of the "
                         "height to count as clipping (a sheet corner spans ~0.03)")
    ap.add_argument("--narrow-frac", type=float, default=0.22,
                    help="a line under this fraction of width counts as short")
    ap.add_argument("--min-run", type=int, default=4,
                    help="consecutive short lines that make a squeezed column")
    ap.add_argument("--min-screens", type=int, default=60,
                    help="fewer PNGs than this is an error, not a pass")
    ap.add_argument("--json", dest="json_out")
    args = ap.parse_args(argv[1:])

    files = sorted(glob.glob(os.path.join(args.directory, "*.png")))
    if len(files) < args.min_screens:
        print(f"ERROR: {len(files)} screenshots in {args.directory}, expected at least "
              f"{args.min_screens}. An empty or short set has no defects trivially; "
              f"reporting that as clean is the failure this guard exists to avoid.",
              file=sys.stderr)
        return 2

    results = [audit_screen(f, args.edge_tol, args.narrow_frac, args.min_run, args.span_frac)
               for f in files]
    fails = [r for r in results if r["fail"]]

    print(f"{len(files)} screens audited in {args.directory}")
    print(f"{len(fails)} failing\n")
    for r in sorted(fails, key=lambda r: (-r["longest_narrow_run"], r["screen"])):
        why = []
        if r["clipped"]:
            why.append(f"edge ink L={r['edge_left']}({r['edge_span_left']*100:.0f}% of H) "
                       f"R={r['edge_right']}({r['edge_span_right']*100:.0f}% of H)")
        if r["squeezed"]:
            why.append(f"{r['longest_narrow_run']} consecutive short lines, "
                       f"narrowest {r['narrowest_line']}px of {r['width']}")
        print(f"  {r['screen']:34} {'; '.join(why)}")

    if args.json_out:
        with open(args.json_out, "w") as fh:
            json.dump(results, fh, indent=1)
        print(f"\nwrote {args.json_out}")
    return 1 if fails else 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
