"""Round 39's three refuting measurements, taken with an estimator written here
rather than reused from grade 24 — the point of a refutation is that it does not
share code with the thing it is refuting.

HONEST NOTE ON ORDER: rule 101 wants these taken BEFORE the band. I read the
bands first, so these are an ATTRIBUTION check, not a gate. Recorded as such."""
import numpy as np, sys
from PIL import Image

def lum(p):
    a = np.asarray(Image.open(p).convert("RGB"), dtype=np.float64)
    return a.mean(axis=2)

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"
def load(p):
    return lum(p)

def ink(a, r0, r1, c0, c1):
    """paper-relative ink coverage, 0..1"""
    w = a[r0:r1, c0:c1]
    paper = np.percentile(w, 95)
    return np.clip((paper - w) / max(paper - w.min(), 1e-9), 0, 1)

def segments(col, thr=0.06, gap=2):
    """column runs of ink separated by >=gap empty columns"""
    on = col > thr
    segs, i, n = [], 0, len(on)
    while i < n:
        if on[i]:
            j = i
            k = i
            while j < n:
                if on[j]: k = j; j += 1
                elif j - k <= gap: j += 1
                else: break
            segs.append((i, k + 1)); i = j
        else: i += 1
    return segs

def subpixel_dx(r, c, lo, hi, span=2.0):
    """dx minimising SSD of canonical(x) vs render(x - dx) over cols [lo,hi)."""
    x = np.arange(lo - 4, hi + 4)
    rr = r[lo - 4:hi + 4]; cc = c[lo - 4:hi + 4]
    best, bd = None, None
    for d in np.arange(-span, span + 1e-9, 0.01):
        shifted = np.interp(x, x + d, rr)
        e = float(((shifted - cc) ** 2).sum())
        if best is None or e < best: best, bd = e, d
    return bd

def registration(R, C, r0, r1, c0, c1, label):
    pr = ink(R, r0, r1, c0, c1).sum(axis=0)
    pc = ink(C, r0, r1, c0, c1).sum(axis=0)
    pr /= max(pr.max(), 1e-9); pc /= max(pc.max(), 1e-9)
    segs = [s for s in segments(pr) if s[1] - s[0] >= 3 and s[0] >= 5 and s[1] <= len(pr) - 5]
    ds = [subpixel_dx(pr, pc, a, b) for a, b in segs]
    ds = np.array([d for d in ds if d is not None])
    print(f"  {label:8s} n={len(ds):3d}  mean {ds.mean():+.3f}  median {np.median(ds):+.3f}  sd {ds.std():.3f}")
    return ds.mean()

def cap(R, C, r0, r1, c0, c1, label):
    out = []
    for a, nm in ((R, "render"), (C, "canon")):
        w = ink(a, r0, r1, c0, c1)
        prof = w.sum(axis=1); pk = prof.max()
        vals = []
        for f in (0.35, 0.50, 0.65):
            idx = np.where(prof >= f * pk)[0]
            # sub-row linear interpolation at both ends
            t, b = idx[0], idx[-1]
            def interp(i, nxt):
                p0, p1 = prof[i], prof[nxt]
                if p1 == p0: return float(i)
                return i + (f * pk - p0) / (p1 - p0) * (nxt - i)
            top = interp(t, t - 1) if t > 0 else float(t)
            bot = interp(b, b + 1) if b + 1 < len(prof) else float(b)
            vals.append((r0 + top, r0 + bot))
        out.append(vals)
    ratios = [(out[0][i][1] - out[0][i][0]) / (out[1][i][1] - out[1][i][0]) for i in range(3)]
    base = [r0 + out[0][i][1] - r0 for i in range(3)]
    print(f"  {label:8s} cap ratio {ratios[0]:.4f} / {ratios[1]:.4f} / {ratios[2]:.4f}"
          f"   baseline {out[0][0][1]:.2f} / {out[0][1][1]:.2f} / {out[0][2][1]:.2f}")

RENDER = sys.argv[1]
R, C = load(RENDER), load(CANON)
print(f"\n{RENDER}\n")
print("D1/D2 — per-glyph sub-pixel registration (canonical minus render, +ve = render is LEFT)")
registration(R, C, 1400, 1472, 160, 680, "help2")
registration(R, C, 1502, 1580, 160, 530, "help3")
print("  controls (must stay ~0):")
registration(R, C, 1298, 1370, 160, 700, "help1")
print("\nD3 — leading-cap ratio and baseline, cols 170..186")
cap(R, C, 1310, 1350, 170, 186, "help1")
