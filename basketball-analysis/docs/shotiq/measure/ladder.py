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
    dropping levels where EITHER side carries fewer than ``min_reference`` px
    (rule 9 — canonical's top rungs are unsharp-mask overshoot, and a ratio
    against a rung one side structurally cannot reach is noise, whichever side
    is empty). Returns a :class:`LadderComparison` with:

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
        # Rule 9 applies to BOTH sides, and it used to be applied to one.
        #
        # A rung was dropped only when the REFERENCE was thin. But the failure
        # this guards against is asymmetric in practice: canonical is
        # unsharp-masked, so its top rungs carry material a flat render
        # structurally cannot produce, and the measured side is the one that
        # comes back empty. On 004's lede, canonical held 2141 px at coverage
        # 0.75 and 612 at 0.90 where the render held ZERO — and the old code
        # scored those rungs 0.0000, which is not "light", it is the absence of
        # an overshoot nobody was asking the render to have.
        #
        # It cost a verdict. The four rungs the render CAN express read 1.0704,
        # 1.1266, 1.1226 and 1.1050 — heavy on every one — and the two empty
        # rungs dragged the answer to `matched` with an rms_log of 4.08, which
        # is log(1/2141) leaking into a statistic that is supposed to be a
        # weight residual. A run that is 11% heavy was reported as matched.
        if reference[L] < min_reference or measured[L] < min_reference:
            dropped.append(L)
            continue
        r = measured[L] / reference[L]
        ratios[L] = r
        logs.append(np.log(measured[L] / reference[L]))
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
