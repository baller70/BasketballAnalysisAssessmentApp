"""Whole-screen and per-band comparison against canonical.

The artboard note, which applies to all 72 iOS screens
------------------------------------------------------
All 72 canonical PNGs are exactly **853 x 1844**, so the canonical artboard is
393 x 850 pt (850 x 2.170483 = 1844.91). The real iPhone viewport this app
renders into is 393 x **852** pt (852 x 2.170483 = 1849.25). The render is
therefore **5 device px taller than canonical, on every screen, forever.**

* **Never "fix" it.** Shrinking the capture viewport to 850 pt to match would be
  gaming the metric against the real device size, and padding is forbidden by
  the standing rulings.
* **Compare TOP-ANCHORED over canonical's first 1844 rows.** Content is
  top-anchored and the ink extents agree exactly. A whole-image diff that
  bottom-anchors or resizes manufactures a whole-screen offset.
* A grader reporting "the render is 5 px taller" has found the artboard, not a
  defect. Expect it on all 72.

**Rule 23 — md5 detects duplicates, NOT regressions.** Re-running the full iOS
sweep after 003's word-spacing change moved four hashes; three of them differed
by a max delta of 1-3 with ZERO pixels above 8, which is rasteriser jitter
between identical captures of the same build. 003's real change read 2,376 px
above 8 with a max delta of 255. Use md5 for its actual job — catching a
redirect that ate a screen — and judge regression on
:func:`changed_pixels`.
"""

from dataclasses import dataclass

import numpy as np

from .errors import WindowError


@dataclass(frozen=True)
class Diff:
    """A whole-image or per-band difference and how it was taken."""

    mean_abs: float
    max_abs: float
    rows: int
    cols: int
    n_over: int
    over_threshold: float
    bbox: tuple
    estimator: str


def top_anchored(a, b):
    """Crop two plates to their common TOP-LEFT region. Never resizes.

    ESTIMATOR: ``a[:h, :w]``, ``b[:h, :w]`` where h and w are the minima of the
    two shapes. Returns ``(a2, b2, (h, w))``. On the iOS set this is canonical's
    1844 rows against the render's 1849 — see the module docstring.
    """
    a = np.asarray(a)
    b = np.asarray(b)
    if a.ndim != b.ndim:
        raise WindowError(f"shape mismatch: {a.shape} against {b.shape}")
    h = min(a.shape[0], b.shape[0])
    w = min(a.shape[1], b.shape[1])
    return a[:h, :w], b[:h, :w], (h, w)


def mean_abs_diff(a, b, window=None, over=8.0):
    """Mean absolute per-channel difference, top-anchored. THE whole-screen number.

    ESTIMATOR: ``|a - b|`` over all three channels of the top-anchored common
    region (or of ``window`` if given, applied to both plates identically),
    averaged over every channel of every pixel; 0-255 units. Also returns the
    max, the count of pixels where ANY channel differs by more than ``over``,
    and the bounding box of those pixels. Returns a :class:`Diff`.

    ``n_over`` is the regression test (rule 23) and ``mean_abs`` is the
    fidelity number. They answer different questions: "changed" and "regressed"
    are different findings and only the second one matters.

    For scale: on 003, canonical against the finished render is **3.644**, the
    three finished screens sit at 2.5-6.5, the best untouched screen sits at
    15.1 and the worst at 55.0.
    """
    a2, b2, (h, w) = top_anchored(a, b)
    if window is not None:
        y0, y1, x0, x1 = window
        if not (0 <= y0 < y1 <= h and 0 <= x0 < x1 <= w):
            raise WindowError(f"window {window} outside the common {w}x{h} region")
        a2, b2 = a2[y0:y1, x0:x1], b2[y0:y1, x0:x1]
    d = np.abs(a2.astype(np.float64) - b2.astype(np.float64))
    hot = d.max(axis=2) > over if d.ndim == 3 else d > over
    ys, xs = np.where(hot)
    bbox = (int(ys.min()), int(ys.max()), int(xs.min()), int(xs.max())) if ys.size else None
    return Diff(
        mean_abs=float(d.mean()),
        max_abs=float(d.max()),
        rows=a2.shape[0],
        cols=a2.shape[1],
        n_over=int(hot.sum()),
        over_threshold=float(over),
        bbox=bbox,
        estimator=(
            f"mean |d| over all channels, top-anchored on the common "
            f"{a2.shape[1]}x{a2.shape[0]} region; n_over counts pixels with any channel "
            f"differing by > {over}"
        ),
    )


def changed_pixels(a, b, over=8.0):
    """Regression test: how many pixels really moved, and where. Rule 23.

    ESTIMATOR: :func:`mean_abs_diff` with the same ``over`` threshold, returning
    ``(n_over, bbox, max_abs)``. Rasteriser jitter between two captures of the
    same build reads a max delta of 1-3 and ZERO pixels over 8; a real change
    reads thousands over 8 with a max near 255, confined to the region you
    changed.
    """
    d = mean_abs_diff(a, b, over=over)
    return d.n_over, d.bbox, d.max_abs


def band_report(a, b, windows, over=8.0):
    """Per-region mean |d|, for locating where a whole-screen number lives.

    ESTIMATOR: :func:`mean_abs_diff` per ``{name: (y0, y1, x0, x1)}``, all
    top-anchored to the common region. Returns ``{name: Diff}``.

    A whole-screen mean is a scalar over ~1.6M pixels and moves by 0.01 for a
    visible fix. The per-band numbers are what show the fix worked: on 003 the
    Google palette change read lede 9.204 -> 9.022, OR 1.796 -> 1.784, Google
    mark 9.133 -> 8.305 while the whole screen moved 3.6546 -> 3.6443.
    """
    return {k: mean_abs_diff(a, b, window=w, over=over) for k, w in windows.items()}
