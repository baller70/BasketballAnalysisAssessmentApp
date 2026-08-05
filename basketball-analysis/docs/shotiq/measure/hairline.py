"""Hairlines and rules, measured beside features ten times louder than they are.

This module exists because of one failure, method **rule 30**:

    *A threshold computed from a contaminated plateau reports NOTHING, which
    looks like no data rather than a broken read.* Measuring 003's OR rules, the
    first two attempts returned "0 runs". The rules are a hairline peaking at
    only 0.27 coverage while the "OR" glyphs between them peak about ten times
    higher, so a plateau estimated across the whole row lands the 50% threshold
    above the entire feature. Estimate the plateau OUTSIDE the loud neighbour.

So every entry point here takes an explicit ``exclude`` list of column spans,
estimates the hairline's own plateau from what is left, and raises with the
numbers if it still finds nothing.

Also relevant, **rule 11**: Chromium pixel-snaps background boxes to whole CSS
pixels — a rule authored at 828.5 device px with a 1.88 px height painted at
829.11/2.170. Draw hairlines as ``<rect>`` inside an SVG whose viewBox is 1 unit
= 1 canonical device px, and they land where you put them. A hairline that
measures 1 device px off is usually this and not a spacing error.
"""

from dataclasses import dataclass

import numpy as np

from .crossings import crossings
from .errors import PlateauError, SegmentationError
from .image import Plane


@dataclass(frozen=True)
class Rule:
    """One hairline: sub-pixel ends, length, and the plateau it was thresholded on."""

    left: float
    right: float
    length: float
    plateau: float
    rows: tuple
    estimator: str


def _cov(plane):
    return plane.cov if isinstance(plane, Plane) else np.asarray(plane)


def _keep_mask(width, x0, exclude):
    keep = np.ones(width, dtype=bool)
    for a, b in exclude or ():
        lo, hi = max(0, a - x0), max(0, b - x0)
        if lo < width:
            keep[lo:min(width, hi)] = False
    return keep


def hairline_rows(plane, window, exclude=(), threshold=0.02, pad=1):
    """Row span of a hairline, found on its OWN columns. Rule 30.

    ESTIMATOR: over ``window``'s columns MINUS ``exclude`` (a sequence of
    half-open column spans naming the loud neighbours), take the per-row max
    coverage and keep rows above ``threshold`` absolute coverage; return the
    outermost such run widened by ``pad`` rows each side. Returns
    ``(row0, row1)``, half-open, absolute.

    ``pad`` matters more here than anywhere else in the library. A 1-2 device px
    rule has its energy spread over three or four rows by antialiasing, and the
    shoulder rows sit below any threshold that survives the page's own noise
    floor — but they carry the coverage that makes the 50%-crossing land right.
    On 003 the derived rows are 1290-1292 and the padded band 1289-1293
    reproduces the ledger's rule lengths exactly; the unpadded band is 0.05 px
    short.

    Raises when no row clears the threshold on the hairline's own columns.
    """
    cov = _cov(plane)
    y0, y1, x0, x1 = window
    keep = _keep_mask(x1 - x0, x0, exclude)
    if keep.sum() < 8:
        raise PlateauError(
            f"exclude {tuple(exclude)} leaves only {int(keep.sum())} columns of "
            f"{x1 - x0} — nothing to estimate a hairline plateau from (rule 30)."
        )
    band = cov[y0:y1, x0:x1][:, keep]
    prof = band.max(axis=1)
    hits = np.where(prof > threshold)[0]
    if hits.size == 0:
        raise SegmentationError(
            f"no row in {y0}-{y1} exceeds {threshold} coverage on the hairline's own columns "
            f"(peak there is {float(prof.max()):.4f}). Either the rule is genuinely absent or "
            "the threshold is above it — rule 30 says assume the second until you have shown "
            "the first."
        )
    return (max(0, y0 + int(hits[0]) - pad), min(cov.shape[0], y0 + int(hits[-1]) + 1 + pad))


def rule_ends(plane, window, exclude=(), rows=None, row_threshold=0.02, pad=1,
              level=0.5, plateau_percentile=50):
    """Sub-pixel left and right ends of every hairline segment in a row band.

    ESTIMATOR:
      1. Row span from :func:`hairline_rows` unless ``rows`` is given.
      2. Column profile = coverage SUMMED down that row span. A 1-2 px rule has
         no single row at full coverage; the sum across its rows is the flat,
         reproducible quantity, and it is what makes the plateau estimable.
      3. Plateau = the ``plateau_percentile``-th percentile of the profile over
         the samples above half its own maximum, computed on each candidate
         span separately and never across an excluded neighbour (rule 30).
      4. Ends = :func:`measure.crossings.crossings` of that span's profile at
         ``level * plateau``, sub-pixel.

    ``window`` names the search region; pass one ``span`` per rule via
    ``exclude`` to carve the loud neighbour out of the middle, then call this
    once per side. Returns a :class:`Rule`.

    On canonical 003 this reads the two OR rules as 339.70 and 339.39 device px
    with a 69.12 px centre gap, and the render at 339.40 / 339.15 / 69.51 —
    the ledger's numbers to the digit.
    """
    cov = _cov(plane)
    y0, y1, x0, x1 = window
    rows = hairline_rows(plane, window, exclude, row_threshold, pad) if rows is None else rows
    prof = cov[rows[0]:rows[1], x0:x1].sum(axis=0)
    keep = _keep_mask(x1 - x0, x0, exclude)
    live = prof[keep]
    if live.size == 0 or live.max() <= 0:
        raise SegmentationError(
            f"hairline profile over rows {rows} is empty on columns {x0}-{x1} minus "
            f"{tuple(exclude)} — rule 30."
        )
    material = live[live > 0.5 * live.max()]
    if material.size < 5:
        raise PlateauError(
            f"only {material.size} columns carry more than half the hairline's peak "
            f"({float(live.max()):.4f}); the plateau would be estimated from noise."
        )
    plateau = float(np.percentile(material, plateau_percentile))
    masked = np.where(keep, prof, 0.0)
    c = crossings(masked, level * plateau, reference="absolute")
    return Rule(
        left=x0 + c.lo,
        right=x0 + c.hi,
        length=c.extent,
        plateau=plateau,
        rows=tuple(rows),
        estimator=(
            f"rule-30 hairline: coverage summed over rows {rows[0]}-{rows[1]}, plateau "
            f"{plateau:.4f} estimated as p{plateau_percentile} of the profile above half its "
            f"own peak on columns outside {tuple(exclude)}, ends at {level:.2f}*plateau"
        ),
    )


def rule_pair(plane, window, centre, exclude_pad=0, **kw):
    """Two hairlines flanking a centred label, plus the gap between them.

    ESTIMATOR: :func:`rule_ends` twice — once on ``window`` left of ``centre``
    and once right of it — each with the OTHER side and the label excluded, so
    neither plateau can be contaminated by the loud middle. ``centre`` is a
    half-open column span covering the label. Returns
    ``(left_rule, right_rule, gap)`` where ``gap = right.left - left.right`` in
    device px.

    This is the shape of the failure rule 30 records, so it is packaged: the
    caller cannot forget to exclude the neighbour, because the neighbour is an
    argument.
    """
    y0, y1, x0, x1 = window
    c0, c1 = centre[0] - exclude_pad, centre[1] + exclude_pad
    left = rule_ends(plane, (y0, y1, x0, c0), exclude=(), **kw)
    right = rule_ends(plane, (y0, y1, c1, x1), exclude=(), **kw)
    return left, right, right.left - left.right
