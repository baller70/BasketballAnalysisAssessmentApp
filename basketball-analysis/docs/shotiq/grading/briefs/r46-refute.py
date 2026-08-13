"""Round 46's refuting measurement — RUN BEFORE report005 (rule 102).

Grade 31's landmark: the plate interior's per-channel L1 argmin, measured on a
5x5-ERODED interior so no edge, no antialias ramp and no unsharp ring can enter.
Canonical's green argmin is 67; the render ships 66.

  PASS  the render's eroded plate-interior green must move 66 -> 67 and its
        L1 cost against canonical must fall.
  HOLD  red must stay 253 and blue must stay 1 — this edit touches one channel.
  NULL CONTROL, and it is what makes the finding a finding rather than a fishing
        trip: the PAPER's argmin must stay 254/254/254 on all three channels over
        ~1.15M px. If paper also moves, the instrument is finding a unit
        everywhere and the plate reading means nothing.

L1 and not L2 because THE METRIC IS L1 (rule 92a) — the L1 argmin is the median.
No crossing, no coverage level, no fraction of peak: a 69,021-pixel plateau is
the one place on this canvas where an ink can be read with no model at all, so
rules 8, 90 and 106 cannot enter.

Written here; shares no code with grade 31's g31 scripts.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"
# the orange plate, comfortably inside its rounded rect
PLATE = (905, 1017, 56, 796)
# a text-free paper strip
PAPER = (120, 380, 20, 830)


def rgb(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.int16)


def erode(mask, k=5):
    """5x5 erosion by repeated 3x3 min, so the kept pixels are >= (k-1)/2 from
       any pixel the mask excludes"""
    m = mask.copy()
    for _ in range((k - 1) // 2):
        n = m.copy()
        n[1:, :] &= m[:-1, :]
        n[:-1, :] &= m[1:, :]
        n[:, 1:] &= m[:, :-1]
        n[:, :-1] &= m[:, 1:]
        m = n
    return m


def plateau(a, box, ref, tol=12):
    """pixels within `tol` of the reference colour on every channel, eroded"""
    r0, r1, c0, c1 = box
    w = a[r0:r1, c0:c1]
    near = np.all(np.abs(w - np.array(ref)) <= tol, axis=2)
    return w[erode(near)]


def l1_argmin(px, ch, lo, hi):
    """the value minimising mean |v - px| on channel ch, i.e. the median"""
    v = px[:, ch].astype(np.int32)
    best = None
    for cand in range(lo, hi + 1):
        cost = float(np.abs(v - cand).mean())
        if best is None or cost < best[1]:
            best = (cand, cost)
    return best


def report(label, a, box, ref, tol, ranges):
    px = plateau(a, box, ref, tol)
    out = []
    for ch, nm, (lo, hi) in zip((0, 1, 2), "RGB", ranges):
        cand, cost = l1_argmin(px, ch, lo, hi)
        med = int(np.median(px[:, ch]))
        out.append(f"{nm} argmin {cand:3d} (median {med:3d}, cost {cost:.4f})")
    print(f"  {label:26s} n={len(px):7d}   " + "   ".join(out))


R, C = rgb(sys.argv[1]), rgb(CANON)
print(f"\n{sys.argv[1]}\n")
print("PLATE interior, 5x5-eroded — green must be 67, red 253, blue 1")
report("canonical", C, PLATE, (253, 66, 1), 12, ((248, 255), (60, 74), (0, 8)))
report("render", R, PLATE, (253, 66, 1), 12, ((248, 255), (60, 74), (0, 8)))
print("\nNULL CONTROL — paper must be 254/254/254 on both")
report("canonical", C, PAPER, (254, 254, 254), 6, ((250, 255), (250, 255), (250, 255)))
report("render", R, PAPER, (254, 254, 254), 6, ((250, 255), (250, 255), (250, 255)))
