"""The area-ratio ladder: weight measured as a shape, not as a density.

Method rules encoded here
-------------------------
* **Rule 4 — area at coverage .25/.4/.5/.6/.75/.9, not raw density.** Total ink
  confounds "thicker strokes" with "softer edges": a run with the same outline
  and a wider antialiasing skirt carries more ink at the same weight. The
  ladder separates them. Below 1.0 at EVERY level means genuinely light.
  Straddling 1.0 means matched outline with a halo difference — which is what
  canonical-versus-render looks like when the weight is right.
* **Rule 9 — the top rungs read 0 on grey runs.** Canonical has 10-14 px above
  0.8 coverage that no flat-colour render can produce; that is unsharp-mask
  overshoot, not ink. :func:`ladder_ratio` drops rungs with too little canonical
  material rather than reporting an infinite ratio, and says which it dropped.
* **Rule 8 — below ~30px an eroded stroke core is UNOBTAINABLE.** A canonical
  small-type stem reads ``248 / 255 / [74 85] / 255 / 248``, ringing on both
  sides. So small-type colour is solved from total ink at matched geometry with
  the hue fixed by an R:G:B ratio over a large sample — see
  :func:`ink_total` and :mod:`measure.fill`.
"""

from dataclasses import dataclass

import numpy as np

from .errors import MeasurementError
from .image import Plane

#: Rule 4's rungs.
LEVELS = (0.25, 0.4, 0.5, 0.6, 0.75, 0.9)


@dataclass(frozen=True)
class LadderComparison:
    """Per-level area ratios plus rule 4's verdict."""

    ratios: dict
    dropped: tuple
    verdict: str
    rms_log: float
    estimator: str


def _cov(plane):
    return plane.cov if isinstance(plane, Plane) else np.asarray(plane)


def ladder(plane, band, levels=LEVELS):
    """Pixel COUNT at or above each coverage level inside a band. Rule 4.

    ESTIMATOR: ``(cov >= L).sum()`` over ``band``'s rows and columns, for each L
    in ``levels``, on a coverage plane normalised to the image's own background.
    Returns ``{level: count}`` — integer areas in device px, not a density.

    Counts, not fractions: the band's own area is not a meaningful denominator
    when the two bands being compared have different extents. Compare rung to
    rung with :func:`ladder_ratio`, which is scale-free.
    """
    cov = _cov(plane)
    sub = cov[band.y0:band.y1, band.x0:band.x1]
    if sub.size == 0:
        raise MeasurementError(f"empty band {band.as_window()} — nothing to count")
    return {float(L): int((sub >= L).sum()) for L in levels}


def ink_total(plane, band):
    """Total coverage summed over a band — the density rule 4 warns about.

    ESTIMATOR: ``cov.sum()`` over the band, on a plane normalised to the image's
    own background. Returns a float in device-px-equivalents of full ink.

    Legitimate for exactly one job: solving small-type COLOUR at matched
    geometry, where rule 8 has ruled out an eroded stroke core. Illegitimate as
    a weight metric on its own — pair it with :func:`ladder_ratio`.
    """
    cov = _cov(plane)
    return float(cov[band.y0:band.y1, band.x0:band.x1].sum())


def ladder_ratio(measured, reference, min_reference=20):
    """Rung-by-rung ratio of two ladders, with rule 4's verdict attached.

    ESTIMATOR: ``measured[L] / reference[L]`` at every level both ladders share,
    dropping levels where ``reference[L] < min_reference`` (rule 9 — canonical's
    top rungs are unsharp-mask overshoot and a ratio there is noise over noise).
    Returns a :class:`LadderComparison` with:

      ``verdict='light'``    every surviving rung < 1.0 — genuinely light
      ``verdict='heavy'``    every surviving rung > 1.0 — genuinely heavy
      ``verdict='matched'``  the rungs straddle 1.0 — same outline, different halo

    ``rms_log`` is the root-mean-square of ``log(measured/reference)`` over the
    surviving rungs: one scalar to minimise in a solver, symmetric in over- and
    under-inking.
    """
    levels = sorted(set(measured) & set(reference))
    if not levels:
        raise MeasurementError("the two ladders share no levels")
    ratios, dropped, logs = {}, [], []
    for L in levels:
        if reference[L] < min_reference:
            dropped.append(L)
            continue
        r = measured[L] / reference[L]
        ratios[L] = r
        logs.append(np.log(max(measured[L], 1) / reference[L]))
    if not ratios:
        raise MeasurementError(
            f"every rung dropped: no reference level carries >= {min_reference} px. "
            "The band is too small for a ladder, or the reference is a grey run whose "
            "top rungs are pure overshoot (rule 9)."
        )
    vals = list(ratios.values())
    if all(v < 1.0 for v in vals):
        verdict = "light"
    elif all(v > 1.0 for v in vals):
        verdict = "heavy"
    else:
        verdict = "matched"
    return LadderComparison(
        ratios=ratios,
        dropped=tuple(dropped),
        verdict=verdict,
        rms_log=float(np.sqrt(np.mean(np.square(logs)))),
        estimator=(
            f"rule-4 area ratio at coverage {tuple(ratios)}; rungs with reference "
            f"< {min_reference} px dropped (rule 9)"
        ),
    )
