"""Round 41's refuting measurements — RUN BEFORE report005 (rule 102).

Grade 26 named three landmarks with tolerances:
  D1 lede2      ascender/height ratio must read 1.000 +/- 0.010
  D2 lede1      row-profile 0.25-crossing ratio 1.000 +/- 0.008 AND ink extent (403, 426)
  D3 resendLink cap ratio 1.000 +/- 0.008, extents held at (811, 835)

Estimator written here; shares no code with grade 26's vpair.py / caps.py.
Crossings, not envelopes (rule 90) — except the ink EXTENT, which grade 26
named explicitly as an integer landmark and is reported as such.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"


def lum(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)


def inkmap(a, r0, r1, c0, c1):
    w = a[r0:r1, c0:c1]
    paper = np.percentile(w, 95)
    return np.clip((paper - w) / max(paper - w.min(), 1e-9), 0, 1)


def cross(prof, f):
    t = f * prof.max()
    idx = np.where(prof >= t)[0]
    if len(idx) == 0:
        return None, None
    a, b = idx[0], idx[-1]
    lo = a if a == 0 else a - (prof[a] - t) / max(prof[a] - prof[a - 1], 1e-9)
    hi = b if b + 1 >= len(prof) else b + (prof[b] - t) / max(prof[b] - prof[b + 1], 1e-9)
    return lo, hi


def rowband(R, C, r0, r1, c0, c1, label, fracs=(0.15, 0.25, 0.40)):
    """height ratio and baseline delta from paired row-profile crossings,
       plus the integer ink extent grade 26 named for D2 and D3"""
    pr = inkmap(R, r0, r1, c0, c1).sum(axis=1)
    pc = inkmap(C, r0, r1, c0, c1).sum(axis=1)
    ratios, tops, bots = [], [], []
    for f in fracs:
        rt, rb = cross(pr, f)
        ct, cb = cross(pc, f)
        ratios.append((rb - rt) / (cb - ct))
        tops.append(rt - ct)
        bots.append(rb - cb)

    def extent(prof, thr=0.02):
        idx = np.where(prof / max(prof.max(), 1e-9) > thr)[0]
        return (r0 + int(idx[0]), r0 + int(idx[-1]))

    print(f"  {label:12s} height ratio " + " / ".join(f"{v:.4f}" for v in ratios))
    print(f"  {'':12s} top delta    " + " / ".join(f"{v:+.3f}" for v in tops))
    print(f"  {'':12s} baseline     " + " / ".join(f"{v:+.3f}" for v in bots))
    print(f"  {'':12s} ink extent   render {extent(pr)}   canonical {extent(pc)}")


R = lum(sys.argv[1])
C = lum(CANON)
print(f"\n{sys.argv[1]}\n")
print("D2 lede1 — height ratio must reach 1.000 +/- 0.008, extent must be (403, 426)")
rowband(R, C, 394, 436, 255, 604, "lede1")
print("\nD1 lede2 — ascender/height ratio must reach 1.000 +/- 0.010")
rowband(R, C, 436, 478, 268, 589, "lede2")
print("\nD3 resendLink — cap ratio must reach 1.000 +/- 0.008, extents held (811, 835)")
rowband(R, C, 804, 844, 316, 536, "resendLink")
print("\nCONTROLS — neither may move")
rowband(R, C, 1298, 1370, 160, 700, "help1")
rowband(R, C, 718, 768, 284, 306, "resendLab")
