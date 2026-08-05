"""Flat-fill colour by distance-shell plateau.

Method rules encoded here
-------------------------
* **Rule 28 — read a flat fill from the INTERIOR, never from its most saturated
  pixel.** Canonical is unsharp-masked, so the extreme pixel is overshoot.
  Probing 003's Google yellow by peak saturation gave ``(255, 204, 1)``; the
  distance-shell plateau gives ``(252.2, 199.8, 15.7)``, and the second one is
  what the render has to match.
* **Rule 8 applies to fills as well as to type.** The outer 2-3 px of any arc
  carry antialiasing against the paper AND against the neighbouring arc, so the
  shell is taken at ``d in [3, 4)`` — far enough in to be material, near enough
  out to exist on a 3-4 px-thick stroke.
* **Rule 27 — a brand palette is not evidence that the palette is right.** 003
  shipped the official Google marks (``#EA4335 / #FBBC05 / #34A853 / #4285F4``)
  and every review passed over them because they looked correct. Canonical uses
  none of them: ``#F0372D / #FDC80F / #21A552 / #3C86FA``. Measure the design,
  not the brand guideline.
* **Rule 29 — to rule out canonical's capture chain, measure a fill you already
  agree on.** :func:`control_fills` does that: orange plate, black and white on
  the same image came back within 2 units of ours while the arcs differed by
  6-20, so the export did not move the arcs.
"""

from dataclasses import dataclass

import numpy as np
from scipy.ndimage import distance_transform_edt

from .errors import PlateauError

#: Hue gates for the four Google arcs. Deliberately generous — the mask only has
#: to be right enough that the distance transform finds an interior.
HUE_GATES = {
    "red": lambda r, g, b: (r > g + 40) & (r > b + 40) & (g < 150),
    "yellow": lambda r, g, b: (r > 150) & (g > 120) & (b < 120) & (r >= g) & (g > b + 60),
    "green": lambda r, g, b: (g > r + 30) & (g > b + 30),
    "blue": lambda r, g, b: (b > r + 40) & (b > g + 30),
}


@dataclass(frozen=True)
class Plateau:
    """A flat fill's colour, the shell it came from, and how much of it there was."""

    rgb: tuple
    n_shell: int
    n_mask: int
    shell: tuple
    estimator: str

    def hex(self):
        return "#%02X%02X%02X" % tuple(int(round(min(255, max(0, c)))) for c in self.rgb)

    def worst_channel_delta(self, other):
        """Largest per-channel difference against another plateau or an RGB triple."""
        o = other.rgb if isinstance(other, Plateau) else other
        return max(abs(a - b) for a, b in zip(self.rgb, o))


def hue_masks(window_rgb, min_saturation=40, min_value=60):
    """Boolean masks for the four arc hues inside an RGB window.

    ESTIMATOR: a pixel is "ink" when ``max(R,G,B) - min(R,G,B) > min_saturation``
    and ``max(R,G,B) > min_value``; each hue then applies its gate from
    :data:`HUE_GATES`. Returns ``{name: bool array}`` shaped like the window.
    Normalises to nothing — this is a classifier, not a measurement, and the
    measurement is :func:`shell_plateau` on top of it.
    """
    px = np.asarray(window_rgb, dtype=np.float64)
    r, g, b = px[:, :, 0], px[:, :, 1], px[:, :, 2]
    sat = px.max(axis=2) - px.min(axis=2)
    ink = (sat > min_saturation) & (px.max(axis=2) > min_value)
    return {k: ink & gate(r, g, b) for k, gate in HUE_GATES.items()}


def shell_plateau(window_rgb, mask, shell=(3.0, 4.0), min_shell=5, fallback_shell=(1.5, 4.0)):
    """Mean RGB of the mask's interior SHELL at distance d in ``shell``. Rule 28.

    ESTIMATOR: Euclidean distance transform of ``mask``, keep pixels with
    ``shell[0] <= d < shell[1]``, average their RGB. Normalises to nothing — the
    result is in raw 0-255 units and is directly comparable between two images
    of the same subject. Returns a :class:`Plateau`.

    ``d`` is distance to the nearest non-mask pixel, so d>=3 means "at least
    three pixels in from any edge of this shape", which excludes both the
    antialiasing against the paper and the antialiasing against the arc next
    door. Below that the number is a blend of two fills and the paper.

    On a stroke too thin for d>=3 the shell empties; ``fallback_shell`` retries
    once, wider, and the returned ``shell`` field records which was used. If
    even that yields fewer than ``min_shell`` pixels this raises — a colour read
    from three pixels is rule 30 with a colour on it.
    """
    px = np.asarray(window_rgb, dtype=np.float64)
    m = np.asarray(mask, dtype=bool)
    if m.sum() < 20:
        raise PlateauError(
            f"hue mask holds only {int(m.sum())} px — too little material for an interior "
            "plateau. Widen the window, or the hue is not present."
        )
    d = distance_transform_edt(m)
    used = shell
    sel = m & (d >= shell[0]) & (d < shell[1])
    if sel.sum() < min_shell:
        used = fallback_shell
        sel = m & (d >= fallback_shell[0]) & (d < fallback_shell[1])
    if sel.sum() < min_shell:
        raise PlateauError(
            f"shell d in [{shell[0]}, {shell[1]}) holds {int(sel.sum())} px and the fallback "
            f"[{fallback_shell[0]}, {fallback_shell[1]}) holds {int(sel.sum())}; the shape is "
            "thinner than the shell. Do NOT fall back to the peak pixel — that is the "
            "overshoot rule 28 is about."
        )
    return Plateau(
        rgb=tuple(float(v) for v in px[sel].mean(axis=0)),
        n_shell=int(sel.sum()),
        n_mask=int(m.sum()),
        shell=tuple(used),
        estimator=(
            f"rule-28 distance-shell plateau: mask interior at d in "
            f"[{used[0]}, {used[1]}), mean RGB over {int(sel.sum())} px"
        ),
    )


def arc_plateaus(window_rgb, require=("red", "yellow", "green", "blue"), shell=(3.0, 4.0), **kw):
    """Interior plateau colour of every named hue in a window. Rules 27 and 28.

    ESTIMATOR: :func:`hue_masks` then :func:`shell_plateau` per hue. Returns
    ``{name: Plateau}``. Raises :class:`PlateauError` naming any hue in
    ``require`` that is absent or too thin — a missing arc is a finding about
    the mark, and returning three entries where four were asked for hides it.
    """
    masks = hue_masks(window_rgb, **kw)
    out, missing = {}, []
    for name, m in masks.items():
        try:
            out[name] = shell_plateau(window_rgb, m, shell=shell)
        except PlateauError as e:
            if name in require:
                missing.append(f"{name}: {e}")
    if missing:
        raise PlateauError("required arc(s) unreadable — " + " | ".join(missing))
    return out


def flat_fill(window_rgb, mask=None, shell=(3.0, 4.0)):
    """Plateau colour of one flat region, e.g. a plate, a bar or the paper.

    ESTIMATOR: :func:`shell_plateau` on ``mask``; when ``mask`` is omitted the
    mask is the whole window, so the shell is the window inset by 3 px. Returns
    a :class:`Plateau`.

    This is the rule-29 control: measure a fill you already agree on — the
    orange plate, the black type, the white paper — before believing a colour
    finding about one you do not. A capture chain that leaves those three within
    2 units did not move the arcs by 20.
    """
    px = np.asarray(window_rgb, dtype=np.float64)
    m = np.ones(px.shape[:2], dtype=bool) if mask is None else np.asarray(mask, bool)
    return shell_plateau(px, m, shell=shell)


def control_fills(img, windows):
    """Run :func:`flat_fill` over a dict of named control windows. Rule 29.

    ESTIMATOR: :func:`flat_fill` per ``{name: (y0, y1, x0, x1)}``. Returns
    ``{name: Plateau}``. Report these alongside any colour defect so the
    "canonical's export moved it" objection is answered with numbers.
    """
    return {k: flat_fill(np.asarray(img)[y0:y1, x0:x1]) for k, (y0, y1, x0, x1) in windows.items()}
