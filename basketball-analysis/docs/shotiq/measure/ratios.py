"""Within-run and within-image ratios — the invariants that settle a typeface.

Method rules encoded here
-------------------------
* **Rule 21 — a ratio taken INSIDE a run is scaleX-invariant, and that is what
  identifies a face.** On 003 the display stem pointed at Tungsten Bold, and
  Bold does land the stem. What disproved it was ``I/N``, the ratio of two ink
  widths in the same run. An absolute width can always be fitted with scaleX; a
  within-run ratio cannot. Reach for one BEFORE concluding a face is right or
  wrong.
* **Rule 32 — matching an advance does not pin a SIZE; the two are degenerate.**
  Every run on 003 was solved to canonical's advance, which leaves a whole
  family of (size, scaleX) pairs, and the solver silently picked a wrong one:
  the footer landed ~6.5% undersized with scaleX stretching it back. Nothing in
  an advance-based fit can see that. **An o-height ratio between two runs of the
  same image is exactly their font-size ratio, because the typeface cancels** —
  which also makes it immune to an adjudicated x-height residual. That is
  :func:`size_ratio`.
* The ``o`` is found by SHAPE, not by counting glyphs: an ``o`` is an x-height
  segment with a closed counter, no ascender and no descender, and among those
  the widest relative to its height (``e`` and ``a`` have counters too, which is
  why the w/h tiebreak matters).
"""

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import label

from .crossings import glyph_widths, vertical_extent
from .errors import MeasurementError, SegmentationError
from .image import Plane
from .segment import ink_band


@dataclass(frozen=True)
class Counter:
    """A counter-bearing glyph — in practice the ``o`` — and its metrics."""

    height: float
    width: float
    aspect: float
    n_agreeing: int
    pool: int
    segments: tuple
    estimator: str


def _cov(plane):
    return plane.cov if isinstance(plane, Plane) else np.asarray(plane)


def width_ratio(widths, i, j):
    """Ratio of two glyph ink widths in the SAME run. Rule 21.

    ESTIMATOR: ``widths[i].extent / widths[j].extent``, where ``widths`` comes
    from :func:`measure.crossings.glyph_widths` — sub-pixel 50%-coverage
    crossings of each glyph's own column profile. Returns a float.

    scaleX multiplies both extents and cancels exactly. Font-size multiplies
    both and cancels exactly. What is left is the outline, which is the face.
    Canonical 003's display run gives I/N = 0.343 under this library's crossing
    convention; see the README for why the ledger records 0.3574.

    Raises when either crossing was clipped by its padding window — a neighbour
    has bled in and the width is that of two glyphs, not one.
    """
    for k in (i, j):
        w = widths[k]
        if w.clipped_lo or w.clipped_hi:
            raise MeasurementError(
                f"glyph {k}'s width crossing ran off its padded window ({w.estimator}); a "
                "neighbour has bled in. Reduce pad, or raise the segmentation threshold."
            )
    return widths[i].extent / widths[j].extent


def counter_glyphs(plane, band, level=0.5, reference="peak", hole_min=3, x_tolerance=0.28,
                   ink_level=0.25, aspect_range=(0.55, 1.10)):
    """Every glyph in the band that carries a CLOSED counter, with its metrics.

    ESTIMATOR: per segment, the sub-pixel vertical extent and width at ``level``
    of the segment's OWN peak coverage (``reference='peak'``); then a
    connected-component label of the below-``ink_level`` pixels inside the
    glyph's own box, counting only components that touch no edge of that box. A
    glyph qualifies when it holds at least ``hole_min`` such pixels AND its
    height is within ``x_tolerance`` of the run's x-height cluster (median of
    the shorter 60% of the glyph heights), i.e. it has neither ascender nor
    descender, AND its width-over-height falls inside ``aspect_range``. Returns
    a list of dicts ``{segment, height, width, aspect, hole}``.

    ``aspect_range`` is what rejects a WELDED segment. A latin lowercase
    counter-bearing glyph is between 0.55 and 1.10 as wide as it is tall in any
    text face; two letters that a low segmentation threshold has bridged come
    back at 1.8-2.8 and would otherwise win the "widest relative to its height"
    tiebreak outright.

    Peak-referenced rather than absolute, uniquely in this library: a run's
    glyphs legitimately differ in peak coverage — a comma or a thin bowl on a
    light-coloured run antialiases to 0.46 where the stems reach 0.9 — and an
    absolute 50% level would silently drop them. What is being measured here is
    a SHAPE (the aspect ratio, and a height compared to other heights in the
    same run), not a position, so the halo warning of rule 8 does not bite.

    Segments that carry no crossable material at all are skipped and counted,
    not fatal; a band where EVERY segment fails raises (rule 30).

    Shape, not position: this is what makes the probe work on a run whose word
    you have not read, and on both a canonical PNG and a render without knowing
    which glyph is which.
    """
    cov = _cov(plane)
    if not band.segments:
        raise SegmentationError("band carries no glyph segments — rule 30")
    vertical_extents, widths, segs, skipped = [], [], [], []
    for seg in band.segments:
        try:
            v = vertical_extent(plane, band, seg, level, reference)
            w = _own_rows_width(cov, seg, v, level, reference)
        except SegmentationError:
            skipped.append(seg)
            continue
        vertical_extents.append(v)
        widths.append(w)
        segs.append(seg)
    if not segs:
        raise SegmentationError(
            f"every one of the {band.nseg} segments in band rows {band.y0}-{band.y1} failed to "
            "produce a crossing — rule 30. The band is probably not type."
        )
    heights = np.array([v.extent for v in vertical_extents])
    short = heights[heights <= np.percentile(heights, 60)]
    xh = float(np.median(short))
    out = []
    for seg, v, w in zip(segs, vertical_extents, widths):
        top, bot = int(np.floor(v.lo)), int(np.ceil(v.hi))
        box = cov[max(0, top):bot + 1, seg[0]:seg[1]]
        if box.shape[0] < 4 or box.shape[1] < 4:
            continue
        lab, n = label(box < ink_level)
        border = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
        hole = sum(int((lab == k).sum()) for k in range(1, n + 1) if k not in border)
        if hole < hole_min:
            continue
        if abs(v.extent - xh) > x_tolerance * xh:
            continue
        asp = w / v.extent
        if not (aspect_range[0] <= asp <= aspect_range[1]):
            continue
        out.append(dict(segment=seg, height=v.extent, width=w, aspect=asp, hole=hole))
    return out


def _own_rows_width(cov, seg, vext, level, reference, pad=2):
    """Glyph width over the GLYPH'S OWN rows, on the run CONTAINING the glyph.

    ESTIMATOR: per-column max coverage over rows ``[floor(vext.lo),
    ceil(vext.hi)]`` — the glyph's own 50%-crossing vertical extent, not the
    whole band's rows — across the segment's columns plus a ``pad``-column
    skirt. The level is ``level`` times the peak of the SEGMENT'S OWN columns
    (so a loud neighbour inside the skirt cannot raise it), and the width is the
    sub-pixel extent of the above-level run that contains the segment's centre
    column. Returns a float width.

    Three failure modes this avoids, all of them observed:
      * measuring over the whole band's rows makes a 12 px ``o`` come back
        20-50 px wide on a mixed-height run, because a tall neighbour is inside
        the skirt at those rows;
      * taking the first and last crossing of the padded profile welds the
        glyph to whatever is next to it;
      * taking the level from the padded profile lets the neighbour set it.
    When the above-level run reaches the edge of the skirt the neighbour has
    genuinely merged, and the thresholded segment width is returned instead — a
    blunt number beats a width that is silently two glyphs.
    """
    top = max(0, int(np.floor(vext.lo)))
    bot = min(cov.shape[0], int(np.ceil(vext.hi)) + 1)
    own = cov[top:bot, seg[0]:seg[1]]
    if own.size == 0:
        raise SegmentationError(f"segment {seg} has no rows in its own vertical extent")
    peak = float(own.max(axis=0).max())
    lvl = level * peak if reference == "peak" else float(level)
    x0 = max(0, seg[0] - pad)
    x1 = min(cov.shape[1], seg[1] + pad)
    prof = cov[top:bot, x0:x1].max(axis=0)
    centre = min(max(0, (seg[0] + seg[1]) // 2 - x0), prof.size - 1)
    if prof[centre] < lvl:
        above = np.where(prof >= lvl)[0]
        if above.size == 0:
            raise SegmentationError(f"segment {seg} has no column reaching {lvl:.4f} coverage")
        centre = int(above[np.argmin(np.abs(above - centre))])
    i0 = centre
    while i0 > 0 and prof[i0 - 1] >= lvl:
        i0 -= 1
    i1 = centre
    while i1 + 1 < prof.size and prof[i1 + 1] >= lvl:
        i1 += 1
    if i0 == 0 or i1 == prof.size - 1:
        return float(seg[1] - seg[0])
    lo = i0 - (prof[i0] - lvl) / max(prof[i0] - prof[i0 - 1], 1e-12)
    hi = i1 + (prof[i1] - lvl) / max(prof[i1] - prof[i1 + 1], 1e-12)
    return float(hi - lo)


#: Segmentation thresholds swept by :func:`find_o`. Lowercase welds below ~0.2
#: and fragments above ~0.6; the useful window is in between.
O_SEGMENT_THRESHOLDS = (0.20, 0.25, 0.30, 0.40, 0.50, 0.60)


def find_o(plane, band, aspect_slack=0.05, segment_thresholds=O_SEGMENT_THRESHOLDS, **kw):
    """The run's ``o``, found by shape. Rule 32's instrument.

    ESTIMATOR, in three stages:

    1. **Re-segment the band's columns at every threshold in
       ``segment_thresholds`` and keep the one that yields the MOST
       counter-bearing candidates.** The band's own threshold was chosen for
       band stability, which on lowercase is often low enough to weld ``oo`` or
       ``go`` into one segment. Candidate count peaks exactly where the letters
       are separated but not yet fragmented — too low and welds get rejected by
       aspect, too high and the counters open up. Rule 6 applied to a different
       question.
    2. :func:`counter_glyphs` at that threshold.
    3. The widest-relative-to-its-height candidates — everything within
       ``aspect_slack`` of the top aspect ratio — and the MEDIAN height, width
       and aspect over that set. ``e`` and ``a`` also carry counters and are
       narrower, which is what the aspect tiebreak removes.

    Returns a :class:`Counter`; ``height`` is in device px.

    Raises when the run has no counter-bearing x-height glyph at any threshold.
    A run of "SIGN IN" genuinely has none, and returning ``None`` there would
    make a caller's size ratio a comparison with nothing (rule 30).
    """
    from dataclasses import replace

    from .segment import glyph_segments

    best = None
    for t in segment_thresholds:
        try:
            segs = glyph_segments(plane, band, thresholds=(t,))
            cands = counter_glyphs(plane, replace(band, segments=tuple(segs), threshold=t), **kw)
        except SegmentationError:
            continue
        if not cands:
            continue
        if best is None or len(cands) > len(best[1]):
            best = (t, cands)
    if best is None:
        raise SegmentationError(
            f"no closed-counter x-height glyph in band rows {band.y0}-{band.y1}, cols "
            f"{band.x0}-{band.x1} at any threshold in {tuple(segment_thresholds)}. An all-caps "
            "or counter-free run cannot be size-probed this way — pick a run with an o, c/e or a."
        )
    thr, cands = best
    top = max(c["aspect"] for c in cands)
    keep = [c for c in cands if c["aspect"] >= top - aspect_slack]
    return Counter(
        height=float(np.median([c["height"] for c in keep])),
        width=float(np.median([c["width"] for c in keep])),
        aspect=float(np.median([c["aspect"] for c in keep])),
        n_agreeing=len(keep),
        pool=len(cands),
        segments=tuple(c["segment"] for c in keep),
        estimator=(
            f"rule-32 o-probe at segmentation threshold {thr:.2f} (most candidates over "
            f"{tuple(segment_thresholds)}): closed-counter x-height segments, widest aspect "
            f"within {aspect_slack}, median over {len(keep)} of {len(cands)} candidates"
        ),
    )


def size_ratio(plane, band_a, band_b, **kw):
    """Font-size ratio between two runs of the SAME image. Rule 32.

    ESTIMATOR: :func:`find_o` on each band; returns
    ``o(band_b).height / o(band_a).height`` together with both
    :class:`Counter` records. Normalises to nothing — it is a pure ratio.

    **The typeface cancels.** Both runs are set in the same face, so their
    o-heights are the same multiple of their font sizes and the ratio is exactly
    the size ratio. That is the one measurement on 003 that could see the
    footer being 6.5% undersized, because every advance-based fit was matched
    and every absolute height was confounded with the adjudicated x-height
    residual.

    Only valid within ONE image. Across two images the faces differ and the
    ratio stops being a size ratio — compare canonical's ratio to the render's
    ratio instead, which is what a defect on this looks like.
    """
    a = find_o(plane, band_a, **kw)
    b = find_o(plane, band_b, **kw)
    return b.height / a.height, a, b


def aspect(plane, band, **kw):
    """The run's ``o`` width-over-height — a SIZE-invariant shape check. Rule 32.

    ESTIMATOR: :func:`find_o`, returning ``width / height``. Invariant under
    font-size, sensitive to scaleX and to the face. Canonical 003's five body
    runs sit inside a 5.2% band on this number; a render whose footer sits 4-15%
    off its own ramp has a run being stretched to fake an advance.
    """
    return find_o(plane, band, **kw).aspect


def x_over_cap(plane, x_band, cap_band, cap_segment, level=0.5):
    """x-height over cap height, from ALL columns rather than one. Rules 24, 25.

    ESTIMATOR: x-height is the median of the shorter 60% of the sub-pixel
    50%-coverage glyph heights in ``x_band``; cap height is
    :func:`measure.crossings.cap_height` on ``cap_segment`` of ``cap_band``
    (a stem-only glyph, rule 7). Returns their ratio.

    Rule 25 in one function. A grader once set +/-0.02 on x/cap without naming
    an estimator, and the two reasonable readings disagreed by more than the
    threshold: at a different size a glyph lands on a different sub-pixel phase,
    one column's crossing moves ~0.5 px, and on a ~12 px x-height that is ~4% —
    about 0.03 on the ratio. Taking every glyph averages the phase out.
    """
    from .crossings import cap_height as _cap
    hs = np.array([v.extent for v in
                   [vertical_extent(plane, x_band, seg, level) for seg in x_band.segments]])
    if hs.size == 0:
        raise SegmentationError("x-height band carries no glyph segments — rule 30")
    xh = float(np.median(hs[hs <= np.percentile(hs, 60)]))
    cap = _cap(plane, cap_band, cap_segment, level).extent
    return xh / cap


def measure_run(img, window, role="neutral", stem_index=None, thresholds=None, expect=None):
    """Convenience: plane -> band -> the standard set of numbers for one ink run.

    ESTIMATOR: :func:`measure.image.plane_for` at ``role``, then
    :func:`measure.segment.ink_band` over ``window`` with a threshold sweep,
    then advance, per-glyph widths and heights, gaps, the rule-4 ladder, total
    ink and the modal baseline. ``stem_index`` names the flat-topped glyph for
    rule 7's cap height; omit it and no cap height is reported rather than a
    wrong one. Returns a dict; every entry's estimator is on the object it came
    from.
    """
    from .crossings import advance, baseline, cap_height, gaps, glyph_heights
    from .ladder import ink_total, ladder
    from .image import plane_for
    from .segment import DEFAULT_THRESHOLDS

    plane = plane_for(img, role)
    band = ink_band(plane, window, thresholds or DEFAULT_THRESHOLDS, expect=expect)
    widths = glyph_widths(plane, band)
    heights = glyph_heights(plane, band)
    out = dict(
        band=band,
        plane=plane,
        advance=advance(plane, band),
        widths=widths,
        heights=heights,
        gaps=gaps(widths),
        ladder=ladder(plane, band),
        ink=ink_total(plane, band),
        baseline=baseline(plane, band),
    )
    if stem_index is not None:
        out["cap"] = cap_height(plane, band, band.segments[stem_index])
    return out
