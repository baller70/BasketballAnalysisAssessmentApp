"""Round 42's refuting measurements — RUN BEFORE report005 (rule 102).

Grade 27 named:
  D1 helpMark3   bottom crossing inside +/-0.20 at all three coverage fractions
                 (shipped +0.652/+0.588/+0.666), top holding inside +/-0.15
                 (shipped +0.034/-0.088/-0.108)
  D2 chev1/2/3   horizontal stretch below +0.20 (shipped +0.62/+0.69/+0.58)
                 vertical stretch above -0.25 (shipped -0.89/-0.63/-0.74)

Written here; shares no code with grade 27's mpair.py. Crossings, not envelopes
(rule 90) — a chevron is 13x24 px of ink in a 43x43 box, so an extent statistic
is two antialiased pixels a side.

`stretch` = trail_delta - lead_delta, i.e. the SIZE component that rule 103 says
paired edges separate from the translation component.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"
FR = (0.25, 0.50, 0.75)


def lum(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)


def inkmap(a, r0, r1, c0, c1):
    """L1 distance from the window's MODAL colour, so white-on-orange marks read
       the same way as black-on-white. Pedestal removed explicitly — grade 27
       reported a bug where a quantised mode left a constant floor under every
       profile and its third estimator returned identical numbers for four
       different rasters."""
    w = a[r0:r1, c0:c1]
    hist, edges = np.histogram(w, bins=64)
    mode = 0.5 * (edges[hist.argmax()] + edges[hist.argmax() + 1])
    d = np.abs(w - mode)
    d = d - np.percentile(d, 5)
    return np.clip(d / max(d.max(), 1e-9), 0, 1)


def cross(prof, f):
    t = f * prof.max()
    idx = np.where(prof >= t)[0]
    if len(idx) == 0:
        return None, None
    a, b = idx[0], idx[-1]
    lo = a if a == 0 else a - (prof[a] - t) / max(prof[a] - prof[a - 1], 1e-9)
    hi = b if b + 1 >= len(prof) else b + (prof[b] - t) / max(prof[b] - prof[b + 1], 1e-9)
    return lo, hi


def pair(R, C, r0, r1, c0, c1, axis, label):
    ax = 1 if axis == "v" else 0
    pr = inkmap(R, r0, r1, c0, c1).sum(axis=ax)
    pc = inkmap(C, r0, r1, c0, c1).sum(axis=ax)
    lead, trail, stretch = [], [], []
    for f in FR:
        rl, rh = cross(pr, f)
        cl, ch = cross(pc, f)
        lead.append(rl - cl)
        trail.append(rh - ch)
        stretch.append((rh - rl) - (ch - cl))
    n1, n2 = ("top", "bottom") if axis == "v" else ("left", "right")
    print(f"  {label:11s} {axis}  {n1:6s} " + " / ".join(f"{v:+.3f}" for v in lead)
          + f"   {n2:6s} " + " / ".join(f"{v:+.3f}" for v in trail)
          + f"   stretch {np.mean(stretch):+.3f}")


R = lum(sys.argv[1])
C = lum(CANON)
print(f"\n{sys.argv[1]}\n")
print("D1 helpMark3 — bottom must reach |x| < 0.20 at all three, top must hold |x| < 0.15")
pair(R, C, 1502, 1580, 40, 140, "v", "helpIcon3")
pair(R, C, 1502, 1580, 40, 140, "h", "helpIcon3")
print("\nD2 chevrons — h stretch must fall below +0.20, v stretch must rise above -0.25")
for nm, (r0, r1, c0, c1) in (("chev1", (1300, 1360, 755, 812)),
                             ("chev2", (1405, 1465, 754, 811)),
                             ("chev3", (1513, 1573, 754, 811))):
    pair(R, C, r0, r1, c0, c1, "h", nm)
    pair(R, C, r0, r1, c0, c1, "v", nm)
print("\nCONTROLS — must not move")
pair(R, C, 1400, 1472, 40, 140, "v", "helpIcon2")
pair(R, C, 1626, 1736, 55, 160, "h", "shield")
