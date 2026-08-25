"""Round 43's refuting measurements — RUN BEFORE report005 (rule 102).

Grade 28 named, with tolerances:
  D1 hands   vertical-arm 50% crossing column: -0.870 -> within +/-0.15 of
             canonical 109.338; whole-column SSD registration -0.875 -> +/-0.15
  D2 ring    R_out -0.337 -> toward 0; LL_out +0.194 -> toward 0 WITHOUT
             passing -0.25 (that would be a size overshoot)
  D3 ring    T_out +0.247 and B_out +0.303 must BOTH move up ~0.275 and BOTH
             land within +/-0.10 of canonical.  If only one lands, the defect is
             a size error and `ry` is implicated, not `cy`.

FIXED 0.5 COVERAGE LEVEL, not a fraction of the local peak. Grade 28's own
instrument bug is the reason: an unsharp mask is antisymmetric on a step, so a
fixed level is preserved across canonical's sharpening and a fraction-of-peak
level is not — canonical's core overshoots to coverage 1.194, which makes a
fraction-of-peak crossing read a thin stroke narrow. Three levels of that
estimator gave it 19% / 13% / 6% on one quantity.

Written here; shares no code with grade 28's g28 scripts.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"

# helpIcon2's window, and the ring centre in device px (cx 18.74, cy ~18.3 in a
# 66.3 x 61.8 box at bx 58.24, by 1403.15 -> sx 2.7625, sy 2.575)
WIN = (1400, 1472, 40, 140)


def lum(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)


def cov(a, r0, r1, c0, c1):
    """coverage 0..1 against the window's paper, WITHOUT normalising by the peak
       — a fixed level only means the same thing on both rasters if the scale is
       the paper/ink pair and not each image's own maximum"""
    w = a[r0:r1, c0:c1]
    paper = np.percentile(w, 97)
    ink = np.percentile(w, 1)
    return np.clip((paper - w) / max(paper - ink, 1e-9), 0, 1)


def lvl_cross(prof, level, rising, lo, hi):
    """first (rising) or last (falling) crossing of an ABSOLUTE level, linearly
       interpolated, searched only inside [lo,hi) so a neighbouring feature
       cannot claim the crossing"""
    seg = prof[lo:hi]
    idx = np.where(seg >= level)[0]
    if len(idx) == 0:
        return None
    if rising:
        i = idx[0]
        if i == 0:
            return lo + i
        return lo + i - (seg[i] - level) / max(seg[i] - seg[i - 1], 1e-9)
    i = idx[-1]
    if i + 1 >= len(seg):
        return lo + i
    return lo + i + (seg[i] - level) / max(seg[i] - seg[i + 1], 1e-9)


def ring_edges(A, label):
    """T_out / B_out from a column strip through the ring centre;
       R_out from a row strip; all at coverage 0.5"""
    c = cov(A, *WIN)
    r0, _, c0, _ = WIN
    # ring centre, located on the render's own ink so both images use one window
    cy_px = 1435.4 + 13.1   # between grade 28's canonical T_out and B_out
    col = int(round(58.24 + 18.74 * 2.7625)) - c0
    row = int(round(cy_px)) - r0
    colprof = c[:, col - 1:col + 2].mean(axis=1)
    rowprof = c[row - 1:row + 2, :].mean(axis=0)
    T = lvl_cross(colprof, 0.5, True, 28, 44)      # top wall of the dial
    B = lvl_cross(colprof, 0.5, False, 52, 68)     # bottom wall
    R = lvl_cross(rowprof, 0.5, False, 74, 92)     # right wall
    return T, B, R


def hands_col(A):
    """the vertical arm's 50% crossing column, over the rows the arm spans"""
    c = cov(A, *WIN)
    r0, _, c0, _ = WIN
    # rows 1446..1449 only, and the search floor is 63 NOT 60: at 60 the render
    # is still inside the ring's LEFT WALL (ink at cols 57-60 against canonical's
    # 57-59) and the rising crossing latches onto the wall instead of the arm,
    # which returned -7.915 before this was diagnosed. The arm is at 67-70/68-70.
    band = c[1446 - r0:1450 - r0, :].mean(axis=0)
    return lvl_cross(band, 0.5, True, 63, 78)


def hands_ssd(R, C):
    """sub-pixel SSD registration of the whole column profile over the hands'
       rows — no level, no fraction, no peak, no centroid, no segmentation"""
    r0, _, c0, _ = WIN
    # cols 63..78 for the same reason — 55 would put both ring walls in the
    # profile and register the RING, which is not what D1 moves.
    a = cov(R, *WIN)[1446 - r0:1450 - r0, 63:78]. mean(axis=0)
    b = cov(C, *WIN)[1446 - r0:1450 - r0, 63:78].mean(axis=0)
    x = np.arange(len(a))
    best = bd = None
    for d in np.arange(-2.5, 2.5001, 0.005):
        e = float(((np.interp(x, x + d, a) - b) ** 2).sum())
        if best is None or e < best:
            best, bd = e, d
    return bd


R = lum(sys.argv[1])
C = lum(CANON)
print(f"\n{sys.argv[1]}\n")
tR, bR, rR = ring_edges(R, "render")
tC, bC, rC = ring_edges(C, "canon")
f = lambda v: "None" if v is None else f"{v:+.3f}"
print("D3 ring vertical — T_out and B_out must BOTH land within +/-0.10")
print(f"   T_out  {f(tR - tC if None not in (tR, tC) else None)}"
      f"    B_out  {f(bR - bC if None not in (bR, bC) else None)}")
print("D2 ring horizontal — R_out toward 0; LL/left must not pass -0.25")
print(f"   R_out  {f(rR - rC if None not in (rR, rC) else None)}")
hR, hC = hands_col(R), hands_col(C)
print("\nD1 hands — 50% crossing column within +/-0.15, SSD within +/-0.15")
print(f"   crossing {f(hR - hC if None not in (hR, hC) else None)}"
      f"    SSD {hands_ssd(R, C):+.3f}")
