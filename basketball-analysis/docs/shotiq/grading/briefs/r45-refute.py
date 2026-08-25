"""Round 45's refuting measurements — RUN BEFORE report005 (rule 102).

Grade 30 named two, and the SECOND IS A BACK-OUT CONDITION, not a caveat:

  (1) the left and right walls must THIN by >= 0.08 px. If they do not, the
      uniform transform did not take and the group is still anisotropic — stop,
      per rule 99 (proving a declaration applied to element X is not proving it
      applied to the element that paints).
  (2) the TOP BAR must reach >= 3.28. The entire band gain is that one 0.248 px
      supersampling rung; below it the same edit still improves the measurement
      but LOSES 0.18 of band, and the instruction is to back the edit out rather
      than re-tune it.

  targets: top 3.335 +/- 0.03, bottom 3.168 +/- 0.03, left 3.114 +/- 0.03,
           right 3.104 +/- 0.03   (canonical 3.215 / 3.266 / 3.088 / 3.073)
  centrelines must hold within 0.05 px.

Absolute 0.5 coverage level, not a fraction of the local peak (rule 106).
Written here; shares no code with grade 30's g30 scripts.

Geometry, from MARK_BOXES.helpMark1 = [53.65, 1299.8, 67.0, 59.5]:
  sx = 67.0/24 = 2.79167   sy = 59.5/24 = 2.47917
  top bar    user y 4.184  -> row 1310.2 ; spans user x 3.84..19.2
  bottom bar user y 19.862 -> row 1349.0 ; spans user x 3.84..11.84 only ("h8")
  left wall  user x 1.844  -> col  58.8
  right wall user x 21.205 -> col 112.9
Row band 1334..1344 is below the flap (which ends ~1332) and above the check
tick (~1347), so both walls are clear of every other feature.
"""
import sys
import numpy as np
from PIL import Image

CANON = "docs/shotiq/grading/canonical/005-verify-email.png"
WIN = (1296, 1364, 44, 130)


def lum(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)


def cov(a):
    w = a[WIN[0]:WIN[1], WIN[2]:WIN[3]]
    paper = np.percentile(w, 97)
    ink = np.percentile(w, 1)
    return np.clip((paper - w) / max(paper - ink, 1e-9), 0, 1)


def width_and_centre(prof, lo, hi, level=0.5):
    """width between the rising and falling crossings of an ABSOLUTE level,
       inside [lo,hi) so no neighbouring feature can claim either crossing"""
    seg = prof[lo:hi]
    idx = np.where(seg >= level)[0]
    if len(idx) == 0:
        return None, None
    a, b = idx[0], idx[-1]
    lo_c = a if a == 0 else a - (seg[a] - level) / max(seg[a] - seg[a - 1], 1e-9)
    hi_c = b if b + 1 >= len(seg) else b + (seg[b] - level) / max(seg[b] - seg[b + 1], 1e-9)
    return hi_c - lo_c, lo + 0.5 * (lo_c + hi_c)


def walls(A):
    c = cov(A)
    r0, _, c0, _ = WIN
    out = {}
    # horizontal bars: column-mean row profile over columns clear of the walls
    out["top"] = width_and_centre(c[:, 75 - c0:95 - c0].mean(axis=1), 1305 - r0, 1317 - r0)
    out["bottom"] = width_and_centre(c[:, 70 - c0:84 - c0].mean(axis=1), 1343 - r0, 1355 - r0)
    # vertical walls: row-mean column profile over rows 1320..1330.
    # NOT 1334..1344, which was the first choice and returned NOTHING on the
    # right wall: the body path is `M21.2053 13V6.184...`, so the RIGHT wall
    # exists only between user y 6.18 and 13 (rows 1315..1332) — below that the
    # envelope is open on the right. 1320..1330 is inside that span, and the flap
    # diagonal there runs cols 90..104, clear of both walls (58.8 and 112.9).
    band = c[1320 - r0:1330 - r0, :].mean(axis=0)
    out["left"] = width_and_centre(band, 53 - c0, 65 - c0)
    out["right"] = width_and_centre(band, 107 - c0, 119 - c0)
    return out


R, C = lum(sys.argv[1]), lum(CANON)
wr, wc = walls(R), walls(C)
print(f"\n{sys.argv[1]}\n")
print("            render    canon    d_width   d_centre")
for k in ("top", "bottom", "left", "right"):
    dw = wr[k][0] - wc[k][0]
    dc = wr[k][1] - wc[k][1]
    print(f"  {k:7s}   {wr[k][0]:6.3f}   {wc[k][0]:6.3f}   {dw:+7.3f}   {dc:+7.3f}")
tot = sum(abs(wr[k][0] - wc[k][0]) for k in ("top", "bottom", "left", "right"))
print(f"\n  total |width error|  {tot:.3f}")
