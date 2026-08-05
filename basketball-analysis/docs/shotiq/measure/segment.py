"""Row-segmentation into ink bands, column-segmentation into glyph segments.

Method rules encoded here
-------------------------
* **Rule 5 — row-segment, then column-segment. Never a fixed crop box.** A
  solid block next to a run welds them into one row-run: 001's mark plate
  (y535-681) did it twice and produced two false findings. So the vertical
  extent of a band is found from the ink itself inside a generous search
  window, and the horizontal extent from the columns of that band.
* **Rule 6 — match thresholds by SWEEPING them.** Canonical is unsharp-masked
  and carries a soft halo a crisper render does not. One permissive threshold
  produced five false findings of 100+ device px band displacement on 003 —
  canonical's halo bridging bands the render keeps separate. Sweeping collapsed
  the worst case to 1 device px. Every entry point here sweeps.
* **Rule 30 — a segmenter that finds nothing RAISES.** See :mod:`measure.errors`.

The sweep is not a search for the "right" threshold. It is a stability test:
the answer you keep is the one that holds over the widest contiguous run of
thresholds, and the whole table travels with the result so a reader can see how
wide that plateau was.
"""

from dataclasses import dataclass, field

import numpy as np

from .errors import SegmentationError
from .image import Plane

#: Default sweep. Low enough to catch a 0.27-coverage hairline, high enough to
#: pull welded glyphs apart on a heavy cut.
DEFAULT_THRESHOLDS = (0.04, 0.06, 0.08, 0.12, 0.16, 0.22, 0.30, 0.40, 0.50, 0.60)


@dataclass(frozen=True)
class Band:
    """One ink band: its row extent, its column extent, and its glyph segments.

    ``threshold`` is the coverage threshold the band was accepted at, and
    ``sweep`` is the full per-threshold table. ``estimator`` names the whole
    pipeline. Report all three next to any number taken from this band.
    """

    y0: int
    y1: int
    x0: int
    x1: int
    segments: tuple
    threshold: float
    plane_estimator: str
    sweep: tuple = field(default=(), repr=False)

    @property
    def nseg(self):
        return len(self.segments)

    @property
    def height(self):
        return self.y1 - self.y0

    @property
    def width(self):
        return self.x1 - self.x0

    @property
    def estimator(self):
        return (
            f"rule-5 band: rows where any column exceeds {self.threshold:.2f} coverage, "
            f"then columns of that band at the same threshold; {self.plane_estimator}"
        )

    def as_window(self):
        return (self.y0, self.y1, self.x0, self.x1)


def true_runs(mask, gap=0):
    """Contiguous True runs of a 1-D boolean mask as half-open ``(a, b)`` pairs.

    ESTIMATOR: none — pure bookkeeping. ``gap`` merges runs separated by at most
    that many False entries, which is how a dotted rule or an ``i`` and its tittle
    are kept as one feature. Returns ``[]`` for an all-False mask; callers that
    are making a claim about the image must turn that into a raise.
    """
    mask = np.asarray(mask, bool)
    if mask.size == 0:
        return []
    d = np.diff(mask.astype(np.int8))
    starts = list(np.where(d == 1)[0] + 1)
    ends = list(np.where(d == -1)[0] + 1)
    if mask[0]:
        starts.insert(0, 0)
    if mask[-1]:
        ends.append(len(mask))
    out = [(int(a), int(b)) for a, b in zip(starts, ends)]
    if gap > 0 and out:
        merged = [list(out[0])]
        for a, b in out[1:]:
            if a - merged[-1][1] <= gap:
                merged[-1][1] = b
            else:
                merged.append([a, b])
        out = [(int(a), int(b)) for a, b in merged]
    return out


def row_runs(plane, x0, x1, threshold, y0=0, y1=None, gap=0):
    """Row runs in ``[y0, y1)`` where SOME column in ``[x0, x1)`` carries ink.

    ESTIMATOR: ``max`` over columns of the coverage plane per row, thresholded
    at ``threshold`` absolute coverage; contiguous rows merged across gaps of at
    most ``gap`` rows. Returns a list of half-open ``(row0, row1)`` pairs in
    absolute image coordinates. Does not raise — the sweeping wrappers do.
    """
    cov = plane.cov if isinstance(plane, Plane) else plane
    y1 = cov.shape[0] if y1 is None else y1
    hit = (cov[y0:y1, x0:x1] > threshold).any(axis=1)
    return [(a + y0, b + y0) for a, b in true_runs(hit, gap)]


def column_runs(plane, y0, y1, x0, x1, threshold, gap=0):
    """Column runs in ``[x0, x1)`` where SOME row in ``[y0, y1)`` carries ink.

    ESTIMATOR: ``max`` over rows of the coverage plane per column, thresholded
    at ``threshold`` absolute coverage, merged across gaps of at most ``gap``
    columns. Returns half-open ``(col0, col1)`` pairs in absolute coordinates.
    Does not raise — the sweeping wrappers do.
    """
    cov = plane.cov if isinstance(plane, Plane) else plane
    hit = (cov[y0:y1, x0:x1] > threshold).any(axis=0)
    return [(a + x0, b + x0) for a, b in true_runs(hit, gap)]


def sweep_bands(plane, window, thresholds=DEFAULT_THRESHOLDS, gap=0, col_gap=0):
    """Run the rule-5 pipeline at every threshold and return the table.

    ESTIMATOR: for each threshold t, row-run the plane over the window's columns
    (rule 5), take the outermost row run wholly inside the window, column-run
    that band, and record ``(t, y0, y1, x0, x1, nseg)``. Returns a tuple of
    dicts, one per threshold, with ``None`` extents where t found no rows.
    Never raises; it is the evidence a raise is built from.
    """
    y0, y1, x0, x1 = window
    table = []
    for t in thresholds:
        rows = [r for r in row_runs(plane, x0, x1, t, gap=gap) if r[0] >= y0 and r[1] <= y1]
        if not rows:
            table.append(dict(threshold=float(t), y0=None, y1=None, x0=None, x1=None, nseg=0, segments=()))
            continue
        by0, by1 = rows[0][0], rows[-1][1]
        segs = column_runs(plane, by0, by1, x0, x1, t, gap=col_gap)
        table.append(
            dict(
                threshold=float(t),
                y0=by0,
                y1=by1,
                x0=segs[0][0] if segs else None,
                x1=segs[-1][1] if segs else None,
                nseg=len(segs),
                segments=tuple(segs),
            )
        )
    return tuple(table)


def ink_band(plane, window, thresholds=DEFAULT_THRESHOLDS, expect=None, gap=0, col_gap=0):
    """THE band finder. Row-segment then column-segment, over a threshold sweep.

    ESTIMATOR: :func:`sweep_bands` over ``thresholds``, then pick the threshold
    whose ``(y0, y1, nseg)`` result is stable over the widest contiguous span of
    the sweep, and return the MIDDLE threshold of that span. Coordinates are
    absolute; extents are integer pixel bounds, half-open. Normalises to the
    plane's own background (see :func:`measure.image.coverage`). Returns a
    :class:`Band`.

    ``expect=n`` demands exactly n glyph segments and restricts the sweep to
    thresholds that deliver them — this is how a heavy cut that welds two
    letters at 0.08 is measured instead of dropped (the wordmark on 003 needs
    0.15-0.65 on some cuts and 0.08 on others).

    Raises :class:`SegmentationError`, with the whole sweep table attached, when
    no threshold finds rows or none delivers ``expect`` segments. Rule 30: a
    null here would be a claim about this function, not about the image.
    """
    table = sweep_bands(plane, window, thresholds, gap=gap, col_gap=col_gap)
    live = [r for r in table if r["y0"] is not None and r["nseg"] > 0]
    if not live:
        raise SegmentationError(
            f"no ink runs in window {tuple(window)} at ANY threshold in {tuple(thresholds)}. "
            f"Peak coverage in the window is {_peak(plane, window):.4f}. If the feature is a "
            "hairline next to loud glyphs, estimate its plateau outside them "
            "(see measure.hairline) — rule 30.",
            sweep=table,
        )
    if expect is not None:
        live = [r for r in live if r["nseg"] == expect]
        if not live:
            got = sorted({r["nseg"] for r in table})
            raise SegmentationError(
                f"window {tuple(window)} never segments into {expect} glyphs; saw {got} across "
                f"thresholds {tuple(thresholds)}. A heavy cut welds neighbours at a low "
                "threshold and a light one splits a glyph at a high one — widen the sweep "
                "rather than accepting the wrong count (rule 6).",
                sweep=table,
            )

    keys = [(r["y0"], r["y1"], r["nseg"]) for r in live]
    best_i, best_len = 0, 0
    i = 0
    while i < len(keys):
        j = i
        while j + 1 < len(keys) and keys[j + 1] == keys[i]:
            j += 1
        if (j - i + 1) > best_len:
            best_len, best_i = j - i + 1, i
        i = j + 1
    chosen = live[best_i + (best_len - 1) // 2]
    return Band(
        y0=chosen["y0"],
        y1=chosen["y1"],
        x0=chosen["x0"],
        x1=chosen["x1"],
        segments=chosen["segments"],
        threshold=chosen["threshold"],
        plane_estimator=getattr(plane, "estimator", "raw plane"),
        sweep=table,
    )


def glyph_segments(plane, band, thresholds=DEFAULT_THRESHOLDS, expect=None, gap=0):
    """Re-segment an existing band's columns, sweeping the threshold.

    ESTIMATOR: :func:`column_runs` over ``band``'s rows at each threshold; the
    accepted threshold is the one whose segment count is stable over the widest
    contiguous span (or the lowest threshold delivering ``expect``). Returns a
    tuple of half-open ``(x0, x1)`` column pairs in absolute coordinates.

    Use it when the rows are already pinned (a multi-line run, say) and only the
    glyph split is in question. Raises :class:`SegmentationError` on no
    segments, or on never reaching ``expect``.
    """
    counts = []
    for t in thresholds:
        segs = column_runs(plane, band.y0, band.y1, band.x0, band.x1, t, gap=gap)
        counts.append((float(t), tuple(segs)))
    live = [(t, s) for t, s in counts if s]
    if not live:
        raise SegmentationError(
            f"band rows {band.y0}-{band.y1} split into no column segments at any threshold "
            f"in {tuple(thresholds)} — rule 30.",
            sweep=tuple(dict(threshold=t, nseg=len(s)) for t, s in counts),
        )
    if expect is not None:
        hit = [(t, s) for t, s in live if len(s) == expect]
        if not hit:
            raise SegmentationError(
                f"band rows {band.y0}-{band.y1} never splits into {expect} segments; saw "
                f"{sorted({len(s) for _, s in live})}.",
                sweep=tuple(dict(threshold=t, nseg=len(s)) for t, s in counts),
            )
        return hit[0][1]
    best, best_len, i = live[0][1], 0, 0
    while i < len(live):
        j = i
        while j + 1 < len(live) and len(live[j + 1][1]) == len(live[i][1]):
            j += 1
        if (j - i + 1) > best_len:
            best_len, best = j - i + 1, live[i + (j - i) // 2][1]
        i = j + 1
    return best


def _peak(plane, window):
    y0, y1, x0, x1 = window
    cov = plane.cov if isinstance(plane, Plane) else plane
    sub = cov[y0:y1, x0:x1]
    return float(sub.max()) if sub.size else 0.0
