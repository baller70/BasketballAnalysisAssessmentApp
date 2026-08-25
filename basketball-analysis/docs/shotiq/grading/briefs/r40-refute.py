"""Round 40's five refuting measurements — RUN BEFORE THE BANDS ARE SCORED.

Rule 102 was written last round because I took these AFTER, and then found my
own estimator disagreeing with the grade while I already knew which way the
build had gone. This time the order is right, so a disagreement here is a real
fork and has to be treated as one.

Estimator written for this round rather than reused from grade 25 — none of this
shares code with the rig that produced the prescriptions.

Crossings, not envelopes (rule 90): a crossing is the interpolated level where a
normalised profile passes a coverage fraction, not an extreme-value pixel.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"


def lum(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)


def ink(a, r0, r1, c0, c1):
    w = a[r0:r1, c0:c1]
    paper = np.percentile(w, 95)
    return np.clip((paper - w) / max(paper - w.min(), 1e-9), 0, 1)


def crossings(prof, f):
    """first rise and last fall through f*peak, linearly interpolated"""
    t = f * prof.max()
    idx = np.where(prof >= t)[0]
    if len(idx) == 0:
        return None, None
    a, b = idx[0], idx[-1]
    lo = a if a == 0 else a - (prof[a] - t) / max(prof[a] - prof[a - 1], 1e-9)
    hi = b if b + 1 >= len(prof) else b + (prof[b] - t) / max(prof[b] - prof[b + 1], 1e-9)
    return lo, hi


def edges(R, C, r0, r1, c0, c1, axis, label, fracs=(0.10, 0.25, 0.40)):
    """axis 'x' -> column profile (left/right); axis 'y' -> row profile (top/bottom)"""
    ax = 0 if axis == "x" else 1
    pr = ink(R, r0, r1, c0, c1).sum(axis=ax)
    pc = ink(C, r0, r1, c0, c1).sum(axis=ax)
    lo_d, hi_d, ext = [], [], []
    for f in fracs:
        rl, rh = crossings(pr, f)
        cl, ch = crossings(pc, f)
        lo_d.append(rl - cl)
        hi_d.append(rh - ch)
        ext.append((rh - rl) / (ch - cl))
    n1, n2 = ("left", "right") if axis == "x" else ("top", "bottom")
    print(f"  {label:12s} {n1:6s} " + " / ".join(f"{v:+.3f}" for v in lo_d))
    print(f"  {'':12s} {n2:6s} " + " / ".join(f"{v:+.3f}" for v in hi_d))
    print(f"  {'':12s} extent " + " / ".join(f"{v:.4f}" for v in ext))


def whole_run_dx(R, C, r0, r1, c0, c1, label):
    """one sub-pixel offset over the ENTIRE normalised column-ink profile —
       no segmentation, so there is nothing to get wrong (rule 102's third
       estimator, the one that survived round 39's disagreement)"""
    pr = ink(R, r0, r1, c0, c1).sum(axis=0)
    pc = ink(C, r0, r1, c0, c1).sum(axis=0)
    pr /= max(pr.max(), 1e-9)
    pc /= max(pc.max(), 1e-9)
    x = np.arange(len(pr))
    best = bd = None
    for d in np.arange(-2.0, 2.0001, 0.005):
        e = float(((np.interp(x, x + d, pr) - pc) ** 2).sum())
        if best is None or e < best:
            best, bd = e, d
    print(f"  {label:12s} whole-run dx {bd:+.3f}")
    return bd


def cap(R, C, r0, r1, c0, c1, label, fracs=(0.35, 0.50, 0.65)):
    """leading-capital top and bottom, render minus canonical"""
    pr = ink(R, r0, r1, c0, c1).sum(axis=1)
    pc = ink(C, r0, r1, c0, c1).sum(axis=1)
    tops, bots = [], []
    for f in fracs:
        rt, rb = crossings(pr, f)
        ct, cb = crossings(pc, f)
        tops.append(rt - ct)
        bots.append(rb - cb)
    print(f"  {label:12s} cap-top " + " / ".join(f"{v:+.3f}" for v in tops))
    print(f"  {'':12s} baseline " + " / ".join(f"{v:+.3f}" for v in bots))


R = lum(sys.argv[1])
C = lum(CANON)
print(f"\n{sys.argv[1]}\n")
print("D1 shield — RIGHT must reach +/-0.20, LEFT must stay inside +/-0.15")
edges(R, C, 1626, 1736, 55, 160, "x", "shield")
print("\nD3 diffMark — TOP must reach +/-0.20, extent must rise toward 1")
edges(R, C, 1070, 1145, 232, 322, "y", "diffMark")
print("\nD4 helpMark2 — LEFT must reach +/-0.15 (right is the stated cost)")
edges(R, C, 1400, 1472, 40, 140, "x", "helpMark2")
print("\nD2 resendLab — cap-top +1.267 -> +0.69 +/-0.15, baseline held +/-0.15")
cap(R, C, 718, 768, 284, 306, "resendLab")
print("\nD5 resendVal — whole-run dx +0.400 -> inside +/-0.15")
whole_run_dx(R, C, 726, 772, 500, 580, "resendVal")
print("\nCONTROL — help1 registration must not move (round 39's control)")
whole_run_dx(R, C, 1298, 1370, 160, 700, "help1")
