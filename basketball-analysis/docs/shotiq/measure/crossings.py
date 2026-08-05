"""Sub-pixel 50%-coverage crossings: cap heights, baselines, advances, widths.

Everything in this module is one idea applied five ways. A rasterised edge is a
ramp two or three pixels wide; the edge of the shape is where that ramp passes
half coverage, and linear interpolation between the two samples that straddle
the half level recovers it to well under a tenth of a pixel. Integer row and
column bounds cannot see a 0.2 device px baseline split; these can.

The coordinate convention, which matters
----------------------------------------
Sample ``i`` of a profile is the value of pixel ``i``. The crossing between
pixel ``i`` and ``i+1`` is placed at ``i + (p[i] - L) / (p[i] - p[i+1])``, and a
leading crossing at ``i - (p[i] - L) / (p[i] - p[i-1])``. Under this convention
a hard-edged 3-pixel run (``0, 1, 1, 1, 0``) measures ``lo = 0.5``,
``hi = 3.5``, extent **3.0** — the true extent.

**The scratchpad toolkit this library replaces got that wrong**: it placed the
trailing crossing at ``i + 1 + frac``, which adds ~1.0 px to every extent. That
cancels in a canonical-minus-render delta, which is most of what it was used
for, and does NOT cancel in a ratio. See the README's "Numbers that do not
reproduce" section — one published within-run ratio on 003 carries the error.

Method rules encoded here
-------------------------
* **Rule 7 — cap height on a stem-only glyph (the I) at 50% coverage.** A round
  glyph overshoots the cap line; a glyph with a diagonal does not have one
  crossing per row. Measure the flat-topped, flat-footed one.
* **Rule 24 / 25 — never a single hand-picked column.** :func:`baseline` reads a
  bottom crossing in EVERY column of the run and takes the modal value.
  A hand-picked column on 003 moved x/cap by -0.0297, past a grader's own
  invalidation threshold; the all-column reading moved +0.0025 and the finding
  stood. The flattering answer came from the shortcut.
* **Rule 22 — an N does not segment into three clean columns on a heavy cut.**
  :func:`stem_width` reads the right stem across the top of the glyph and the
  left stem across the bottom, where the diagonal is provably elsewhere.
* **Rule 12 — text raster positions quantise to whole device rows**, so a
  cap-top has a plateau of reachable values. A sub-pixel crossing measures where
  the *shape* is; it does not make the position continuous.
"""

from dataclasses import dataclass

import numpy as np

from .errors import MeasurementError, PlateauError, SegmentationError
from .image import Plane


@dataclass(frozen=True)
class Crossing:
    """A pair of sub-pixel crossings and the extent between them."""

    lo: float
    hi: float
    level: float
    reference: str
    clipped_lo: bool
    clipped_hi: bool
    estimator: str

    @property
    def extent(self):
        return self.hi - self.lo


@dataclass(frozen=True)
class Baseline:
    """A run's baseline, plus how many columns voted for it and how tightly."""

    y: float
    n_columns: int
    n_in_mode: int
    spread: float
    level: float
    estimator: str


def crossings(profile, level=0.5, reference="absolute"):
    """First and last sub-pixel crossings of ``level`` in a 1-D coverage profile.

    ESTIMATOR: threshold on ``level`` of **absolute coverage** when
    ``reference='absolute'`` (the default), or on ``level * profile.max()`` when
    ``reference='peak'``. Linear interpolation between the straddling samples,
    with sample ``i`` located at coordinate ``i``. Returns a :class:`Crossing`
    whose ``extent`` is the true ink extent of a hard-edged run.

    Prefer ``'absolute'``. Canonical PNGs are unsharp-masked (rule 8) so their
    peak is overshoot rather than ink, and a peak-referenced level therefore
    moves with the halo instead of with the shape. Use ``'peak'`` only where the
    two images being compared are known to have different ink *levels* — a grey
    run against a black one — and the shape is the question.

    Raises :class:`SegmentationError` if nothing in the profile reaches the
    level: that is a claim about the profile, not a missing feature (rule 30).
    """
    p = np.asarray(profile, dtype=np.float64)
    if p.ndim != 1 or p.size < 2:
        raise MeasurementError(f"crossings() needs a 1-D profile of length >= 2, got shape {p.shape}")
    if reference == "peak":
        peak = float(p.max())
        if peak <= 0:
            raise SegmentationError("profile is entirely zero — nothing to cross (rule 30)")
        lvl = level * peak
    elif reference == "absolute":
        lvl = float(level)
    else:
        raise MeasurementError(f"unknown reference {reference!r}; use 'absolute' or 'peak'")

    above = np.where(p >= lvl)[0]
    if above.size == 0:
        raise SegmentationError(
            f"no sample in the profile reaches {lvl:.4f} (peak {p.max():.4f}, n={p.size}). "
            "If the feature is a hairline beside loud glyphs, the level was estimated across "
            "the neighbour — rule 30."
        )
    i0, i1 = int(above[0]), int(above[-1])

    clipped_lo = i0 == 0
    clipped_hi = i1 == p.size - 1
    lo = float(i0) - 0.5 if clipped_lo else i0 - (p[i0] - lvl) / max(p[i0] - p[i0 - 1], 1e-12)
    hi = float(i1) + 0.5 if clipped_hi else i1 + (p[i1] - lvl) / max(p[i1] - p[i1 + 1], 1e-12)
    return Crossing(
        lo=float(lo),
        hi=float(hi),
        level=float(lvl),
        reference=reference,
        clipped_lo=clipped_lo,
        clipped_hi=clipped_hi,
        estimator=f"sub-pixel crossing of {lvl:.4f} coverage ({reference} level {level})",
    )


def _cov(plane):
    return plane.cov if isinstance(plane, Plane) else np.asarray(plane)


def _est(plane):
    return getattr(plane, "estimator", "raw plane")


def vertical_extent(plane, band, columns=None, level=0.5, reference="absolute", pad=6):
    """Sub-pixel top and bottom of the ink over a column span.

    ESTIMATOR: per-row ``max`` coverage over columns ``columns`` (the band's own
    column span when omitted), taken over the band's rows padded by ``pad``
    rows each side so a run whose first row already exceeds the level still has
    a ramp to cross; then :func:`crossings` at ``level``. Returns a
    :class:`Crossing` in absolute image rows; ``extent`` is the height.

    ``pad`` is why this is not simply the band bounds: the band was found by
    thresholding at ~0.08, and the 50% crossing of a crisp render can sit
    outside those rows.
    """
    cov = _cov(plane)
    x0, x1 = (band.x0, band.x1) if columns is None else columns
    y0 = max(0, band.y0 - pad)
    y1 = min(cov.shape[0], band.y1 + pad)
    prof = cov[y0:y1, x0:x1].max(axis=1)
    c = crossings(prof, level, reference)
    return Crossing(
        lo=y0 + c.lo,
        hi=y0 + c.hi,
        level=c.level,
        reference=c.reference,
        clipped_lo=c.clipped_lo,
        clipped_hi=c.clipped_hi,
        estimator=f"vertical extent over cols {x0}-{x1}, rows {y0}-{y1}; {c.estimator}; {_est(plane)}",
    )


def cap_height(plane, band, stem_segment, level=0.5, reference="absolute", pad=6):
    """Cap height, measured on a STEM-ONLY glyph. Rule 7.

    ESTIMATOR: :func:`vertical_extent` restricted to the columns of
    ``stem_segment`` — a half-open ``(x0, x1)`` pair naming a glyph that is flat
    on top and flat on the foot (an I, an H, an L; never an O, a C or an S).
    Level is absolute 50% coverage, normalised to the plane's background.
    Returns a :class:`Crossing`; ``extent`` is the cap height in device px.

    Passing a round glyph is not an error this function can detect, and it will
    silently return the cap height plus the overshoot. On canonical 003 the
    display face overshoots by +0.11 px and every Tungsten cut overshoots by
    +2.00 — which is a face finding when you measure both on purpose, and a
    2 px error when you do not.
    """
    if stem_segment is None:
        raise MeasurementError(
            "cap_height() needs the column segment of a stem-only glyph (rule 7). "
            "For the whole run's ink extent call vertical_extent()."
        )
    c = vertical_extent(plane, band, stem_segment, level, reference, pad)
    return Crossing(
        lo=c.lo, hi=c.hi, level=c.level, reference=c.reference,
        clipped_lo=c.clipped_lo, clipped_hi=c.clipped_hi,
        estimator="rule-7 cap height on a stem-only glyph; " + c.estimator,
    )


def advance(plane, band, level=0.5, reference="absolute", pad=6):
    """Run advance: the sub-pixel left and right ink edges of a whole run.

    ESTIMATOR: per-column ``max`` coverage over the band's rows, taken over the
    band's columns padded by ``pad`` columns each side, then :func:`crossings`
    at ``level`` absolute coverage. Returns a :class:`Crossing` in absolute
    image columns; ``extent`` is the advance width in device px.

    **Rule 32: matching an advance does not pin a SIZE.** Advance is degenerate
    in (font-size, scaleX) — on 003 the footer landed 6.5% undersized with
    scaleX stretching it back onto the right advance, and nothing in an
    advance-based fit could see it. Pin size with
    :func:`measure.ratios.size_ratio` and let scaleX take up the advance.
    """
    cov = _cov(plane)
    x0 = max(0, band.x0 - pad)
    x1 = min(cov.shape[1], band.x1 + pad)
    prof = cov[band.y0:band.y1, x0:x1].max(axis=0)
    c = crossings(prof, level, reference)
    return Crossing(
        lo=x0 + c.lo, hi=x0 + c.hi, level=c.level, reference=c.reference,
        clipped_lo=c.clipped_lo, clipped_hi=c.clipped_hi,
        estimator=f"run advance over rows {band.y0}-{band.y1}; {c.estimator}; {_est(plane)}",
    )


def glyph_widths(plane, band, level=0.5, reference="absolute", pad=4, segments=None):
    """Sub-pixel ink width of every glyph segment in a band.

    ESTIMATOR: for each column segment, per-column ``max`` coverage over the
    band's rows, over the segment's columns padded by ``pad`` each side, then
    :func:`crossings` at ``level``. Returns a tuple of :class:`Crossing`, one
    per segment, in band order; ``extent`` is the glyph's ink width.

    The padding is what lets the crossing find the true edge outside the
    thresholded segment; it also lets a neighbour bleed in when the gap is
    smaller than ``2 * pad``. Check :func:`measure.ratios.width_ratio`'s guard,
    or reduce ``pad``, on tight tracking.
    """
    cov = _cov(plane)
    segs = band.segments if segments is None else segments
    if not segs:
        raise SegmentationError("band carries no glyph segments — rule 30")
    out = []
    for (a, b) in segs:
        x0 = max(0, a - pad)
        x1 = min(cov.shape[1], b + pad)
        prof = cov[band.y0:band.y1, x0:x1].max(axis=0)
        c = crossings(prof, level, reference)
        out.append(
            Crossing(
                lo=x0 + c.lo, hi=x0 + c.hi, level=c.level, reference=c.reference,
                clipped_lo=c.clipped_lo, clipped_hi=c.clipped_hi,
                estimator=f"glyph width, segment {a}-{b}; {c.estimator}; {_est(plane)}",
            )
        )
    return tuple(out)


def glyph_heights(plane, band, level=0.5, reference="absolute", pad=6, segments=None):
    """Sub-pixel ink height of every glyph segment in a band.

    ESTIMATOR: :func:`vertical_extent` per column segment. Returns a tuple of
    :class:`Crossing` in band order; ``extent`` is the glyph's ink height.
    Flat-topped glyphs give the cap height (rule 7); round ones give cap plus
    overshoot, and the DIFFERENCE between those two means is a face property —
    canonical 003's display face overshoots +0.114, every Tungsten cut +2.002.
    """
    segs = band.segments if segments is None else segments
    if not segs:
        raise SegmentationError("band carries no glyph segments — rule 30")
    return tuple(vertical_extent(plane, band, seg, level, reference, pad) for seg in segs)


def gaps(widths):
    """Inter-glyph gaps from a sequence of :class:`Crossing` widths.

    ESTIMATOR: ``widths[i+1].lo - widths[i].hi`` — a difference of two sub-pixel
    crossings, so it is free of any constant convention error. Returns a tuple
    of floats, one shorter than ``widths``.

    On 003 the display word space read 48.66 canonical against 51.96 render,
    while the total block width matched to 2.3 px — the two facts together are
    what identified word-spacing rather than tracking as the defect.
    """
    return tuple(widths[i + 1].lo - widths[i].hi for i in range(len(widths) - 1))


def bottom_crossings_by_column(plane, band, level=0.5, pad=4, min_peak=None):
    """Every column's own sub-pixel bottom crossing. A PRIMITIVE, not an estimator.

    ESTIMATOR: for each column x in the band, the last sample of
    ``cov[band.y0-pad : band.y1+pad, x]`` at or above ``level`` absolute
    coverage, interpolated against the next sample. Returns
    ``(xs, ys)`` as integer and float arrays; columns with no sample above the
    level are omitted, and ``min_peak`` (default ``level``) drops columns whose
    peak barely clears it.

    **Do not report a value from one column of this array.** That is exactly the
    shortcut rule 24 forbids and it has already produced one flattering,
    wrong answer on this project. Feed it to :func:`baseline`.
    """
    cov = _cov(plane)
    y0 = max(0, band.y0 - pad)
    y1 = min(cov.shape[0], band.y1 + pad)
    lvl = float(level)
    peak_gate = lvl if min_peak is None else float(min_peak)
    xs, ys = [], []
    for x in range(band.x0, band.x1):
        p = cov[y0:y1, x]
        if p.max() < peak_gate:
            continue
        idx = np.where(p >= lvl)[0]
        if idx.size == 0:
            continue
        i = int(idx[-1])
        if i + 1 >= p.size:
            ys.append(float(y0 + i) + 0.5)
        else:
            ys.append(float(y0 + i + (p[i] - lvl) / max(p[i] - p[i + 1], 1e-12)))
        xs.append(x)
    if not xs:
        raise SegmentationError(
            f"no column in band rows {band.y0}-{band.y1}, cols {band.x0}-{band.x1} reaches "
            f"{lvl:.3f} coverage (peak {_cov(plane)[y0:y1, band.x0:band.x1].max():.4f}) — rule 30."
        )
    return np.asarray(xs, dtype=int), np.asarray(ys, dtype=float)


def baseline(plane, band, level=0.5, pad=4, bandwidth=0.15, min_columns=8):
    """A run's baseline: the MODAL sub-pixel bottom crossing over ALL its columns.

    ESTIMATOR: :func:`bottom_crossings_by_column` at ``level`` absolute
    coverage, then the mode of that population, taken as the argmax of a
    Gaussian kernel density with bandwidth ``bandwidth`` device px evaluated on
    a 0.01 px grid. Returns a :class:`Baseline`; ``y`` is in absolute image
    rows.

    Why the mode and not a mean, a median or a percentile: a run's columns fall
    into three populations. Flat-footed stems all stop on the baseline and are
    the majority. Round glyphs overshoot a few tenths below it. Descenders
    (``g``, ``p``, ``y``) sit 4-6 px below and can be 10% of the columns. A mean
    is dragged by the descenders, a median by whichever glyphs happen to be in
    the word, and a fixed percentile by both. The mode is the flat feet, which
    is what a baseline is.

    Rules 24 and 25: every column votes. The absolute value from this estimator
    is NOT comparable to the absolute value from a different one — on 003 two
    reasonable estimators sat 1.2 device px apart — but a difference taken
    inside one estimator is, and that is the quantity to report. See
    :func:`baseline_split`.
    """
    xs, ys = bottom_crossings_by_column(plane, band, level=level, pad=pad)
    if ys.size < min_columns:
        raise PlateauError(
            f"only {ys.size} columns produced a bottom crossing in band rows "
            f"{band.y0}-{band.y1}; need >= {min_columns} for a modal baseline. "
            "A baseline from a handful of columns is a hand-picked column with extra steps "
            "(rule 24)."
        )
    lo, hi = float(ys.min()), float(ys.max())
    grid = np.arange(lo, hi + 0.011, 0.01)
    dens = np.exp(-0.5 * ((grid[:, None] - ys[None, :]) / bandwidth) ** 2).sum(axis=1)
    y = float(grid[int(np.argmax(dens))])
    in_mode = ys[np.abs(ys - y) <= 3 * bandwidth]
    return Baseline(
        y=y,
        n_columns=int(ys.size),
        n_in_mode=int(in_mode.size),
        spread=float(in_mode.std()) if in_mode.size > 1 else 0.0,
        level=float(level),
        estimator=(
            f"modal per-column bottom crossing at {level:.2f} absolute coverage, "
            f"KDE bandwidth {bandwidth} px over {int(ys.size)} columns; {_est(plane)}"
        ),
    )


def baseline_split(plane, band_a, band_b, **kw):
    """Baseline difference between two runs measured with ONE estimator. Rule 25.

    ESTIMATOR: :func:`baseline` on each band with identical settings, returning
    ``b.y - a.y`` in device px along with both baselines. The difference is the
    reportable quantity: it is invariant to the constant offset that separates
    two different baseline estimators, and it is what a split defect is.

    On 003 the checkbox row's two runs were split by 2.07 device px against
    canonical's 0.19 — a run given a larger font-size and a narrower scaleX to
    land the same advance, which is rule 26's failure mode exactly.
    """
    a = baseline(plane, band_a, **kw)
    b = baseline(plane, band_b, **kw)
    return b.y - a.y, a, b


def stem_width(plane, band, segment, rows=(0.45, 0.62), side=None, level=0.5, pad=4, min_rows=3):
    """Median 50%-crossing width of a vertical stem, read where it is CLEAN. Rule 22.

    ESTIMATOR: for each image row in the fractional span ``rows`` of the
    segment's height, threshold that row's coverage profile at ``level`` times
    the ROW's own peak (a stem's peak varies down its length on an unsharp
    canonical), find the contiguous above-level intervals, take the
    ``side``-most one (``'L'``, ``'R'``, or ``None`` for "the only one"), and
    measure it with sub-pixel edges. Returns ``(median_width, n_rows_used)``.

    ``rows`` and ``side`` exist because an N's diagonal welds to the LEFT stem
    near the top and to the RIGHT stem near the bottom. Demanding three clean
    column segments returns ``nan`` on exactly the heavy cuts a stem
    investigation is about. Read the RIGHT stem across the top
    (``rows=(0.10, 0.26), side='R'``) and the LEFT stem across the bottom
    (``rows=(0.74, 0.90), side='L'``). That reproduces canonical 003's
    16.08 / 15.84 to within 0.02.

    Raises rather than returning ``nan`` when fewer than ``min_rows`` rows
    produced a usable interval — rule 30.
    """
    cov = _cov(plane)
    a, b = segment
    h = band.y1 - band.y0
    r0 = int(band.y0 + rows[0] * h)
    r1 = max(r0 + 1, int(band.y0 + rows[1] * h))
    x0 = max(0, a - pad)
    x1 = min(cov.shape[1], b + pad)
    widths = []
    for r in range(r0, r1):
        p = cov[r, x0:x1]
        peak = float(p.max())
        if peak < 0.15:
            continue
        lvl = level * peak
        mask = p >= lvl
        runs = []
        i = 0
        while i < mask.size:
            if mask[i]:
                j = i
                while j < mask.size and mask[j]:
                    j += 1
                lo = i - 0.5 if i == 0 else i - (p[i] - lvl) / max(p[i] - p[i - 1], 1e-12)
                k = j - 1
                hi = k + 0.5 if j >= mask.size else k + (p[k] - lvl) / max(p[k] - p[k + 1], 1e-12)
                runs.append((lo, hi))
                i = j
            else:
                i += 1
        if not runs:
            continue
        if side == "L":
            sel = runs[0]
        elif side == "R":
            sel = runs[-1]
        else:
            if len(runs) != 1:
                continue
            sel = runs[0]
        w = sel[1] - sel[0]
        if 0.4 < w < 0.9 * (x1 - x0):
            widths.append(w)
    if len(widths) < min_rows:
        raise SegmentationError(
            f"stem width: only {len(widths)} usable rows in {r0}-{r1} for segment {segment} "
            f"(side={side}). On an N this is rule 22 — the diagonal has welded to the stem you "
            "are reading. Move the row span, or read the other stem."
        )
    return float(np.median(widths)), len(widths)
