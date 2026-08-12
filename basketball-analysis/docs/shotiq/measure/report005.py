"""Band-by-band report for screen 005-verify-email.

ESTIMATOR: :func:`measure.compare.band_report` — per-region mean absolute
per-channel difference over the top-anchored common region, 0-255 units, plus
``n_over`` at the default 8.0 threshold. Canonical is 853x1844, the render
1849; top-anchored, so the 5-row artboard difference is dropped from the
bottom and is never a defect.

THE WINDOWS ARE SPLIT PER INDEPENDENTLY POSITIONED THING (rule 57). 005 has
more of these than any screen so far and the temptation to aggregate is
correspondingly larger:

  * the SIX code boxes are six separately placed rects with six separately
    placed digits. One "boxes" window would let a box that is 1 px left cancel
    a box that is 1 px right and read as solved — the exact arithmetic that hid
    004's lede line 1 for five grades.
  * "Resend code in 0:42" is TWO roles on one line, graphite label and orange
    value. Split at x 503, inside the gap between "in" (ends 497) and "0" (starts
    509).
  * each help row is an ICON, a LABEL and a CHEVRON at three x positions, so it
    is three windows and not one.
  * the wordmark and the gear share rows 30..75 and nothing else.

Every window was checked against rule 50: canonical's ink for each region sits
strictly inside its window, and each vertical split falls in a gap between two
runs' ink rather than through one. The ink extents the checks were made against
are recorded beside each entry.

Run from ``docs/shotiq``::

    python3 -m measure.report005 RENDER.png [CANONICAL.png]
"""

from __future__ import annotations

import sys

from . import compare, image

#: name -> (y0, y1, x0, x1) in canonical device px.
WINDOWS: dict[str, tuple[int, int, int, int]] = {
    # ink 35..72 x 46..228 (wordmark) and 30..75 x 756..799 (gear)
    "wordmark":   (14, 90, 0, 300),
    "gear":       (14, 90, 730, 853),
    # the header hairline, ink 100..101, FULL BLEED x 0..852
    "hdrRule":    (92, 110, 0, 853),
    "back":       (126, 180, 20, 100),
    # ink 228..354 x 166..695
    "display":    (218, 364, 0, 853),
    # ink 402..426 and 443..472; the split at 434 is inside the gap
    "lede1":      (392, 434, 0, 853),
    "lede2":      (434, 482, 0, 853),
    # the six boxes, ink 533..666; column splits all fall in the 21-px gaps
    "box0":       (524, 676, 30, 170),
    "box1":       (524, 676, 170, 300),
    "box2":       (524, 676, 300, 428),
    "box3":       (524, 676, 428, 556),
    "box4":       (524, 676, 556, 686),
    "box5":       (524, 676, 686, 815),
    # ink 730..756; "in" ends at 497 and "0:42" starts at 509
    "resendLab":  (720, 766, 0, 503),
    "resendVal":  (720, 766, 503, 853),
    # ink 810..835 plus its underline 844..846
    "resendLink": (800, 856, 0, 853),
    # ink 905..1017 (plate), 939..984 (mark), 946..983 (label)
    "plate":      (896, 1026, 0, 853),
    # ink 1048..1160 (border), 1081..1135 (mark), 1093..1117 (label)
    "diffBtn":    (1040, 1170, 0, 853),
    "rule1":      (1200, 1218, 0, 853),
    "didnt":      (1242, 1282, 0, 853),
    "helpIcon1":  (1298, 1364, 40, 140),
    "help1":      (1298, 1364, 150, 700),
    "chev1":      (1298, 1364, 760, 810),
    "rule2":      (1372, 1390, 0, 853),
    "helpIcon2":  (1400, 1472, 40, 140),
    "help2":      (1400, 1472, 150, 700),
    "chev2":      (1400, 1472, 760, 810),
    "rule3":      (1478, 1496, 0, 853),
    "helpIcon3":  (1502, 1580, 40, 140),
    "help3":      (1502, 1580, 150, 700),
    "chev3":      (1502, 1580, 760, 810),
    "rule4":      (1591, 1609, 0, 853),
    "shield":     (1626, 1736, 55, 160),
    "safe1":      (1642, 1690, 165, 853),
    "safe2":      (1692, 1736, 165, 853),
}

#: Diagnostic sub-windows, reported SEPARATELY and deliberately NOT merged into
#: WINDOWS — they overlap the bands above, so folding them in would double-count
#: rows and silently change the meaning of every band figure.
#:
#: `plate` and `diffBtn` each mix a large box with a small mark and a small
#: label. A solved box is a large area of near-zero difference and averaging a
#: hot label into it divides the label's error by the box's area (rule 57's
#: dilution form, which cost 004 two real findings).
SUBWINDOWS: dict[str, tuple[int, int, int, int]] = {
    "plateMark":  (930, 995, 225, 315),
    "plateLab":   (936, 995, 325, 605),
    "diffMark":   (1070, 1145, 232, 322),
    "diffLab":    (1084, 1128, 336, 625),
    "digit0":     (560, 640, 78, 128),
    "digit1":     (560, 640, 207, 258),
    "digit2":     (560, 640, 336, 387),
    "digit3":     (560, 640, 466, 516),
    "caret":      (554, 646, 605, 632),
}


def main(argv: list[str]) -> int:
    if len(argv) < 2:
        print(__doc__)
        return 2
    render = image.load(argv[1])
    canon = image.load(argv[2] if len(argv) > 2 else "canonical/005-verify-email.png")

    whole = compare.mean_abs_diff(canon, render)
    print(f"whole screen   mean|d| {whole.mean_abs:.4f}   max {whole.max_abs:.0f}   "
          f"n_over8 {whole.n_over}")
    print(f"  estimator: {whole.estimator}")
    print()

    rep = compare.band_report(canon, render, WINDOWS)
    rows = sorted(rep.items(), key=lambda kv: -kv[1].mean_abs)
    w = max(len(k) for k in rep)
    print(f"{'band'.ljust(w)}  {'mean|d|':>9}  {'max':>5}  {'n_over8':>8}")
    print("-" * (w + 28))
    for name, d in rows:
        print(f"{name.ljust(w)}  {d.mean_abs:9.4f}  {d.max_abs:5.0f}  {d.n_over:8d}")

    sub = compare.band_report(canon, render, SUBWINDOWS)
    print()
    print("diagnostic sub-windows — these OVERLAP the bands above and are not")
    print("part of the table; a label inside a solved box is diluted by the box's")
    print("area, so its own error is only visible here (rule 57).")
    sw = max(len(k) for k in sub)
    print(f"{'run'.ljust(sw)}  {'mean|d|':>9}  {'max':>5}  {'n_over8':>8}")
    print("-" * (sw + 28))
    for name, d in sorted(sub.items(), key=lambda kv: -kv[1].mean_abs):
        print(f"{name.ljust(sw)}  {d.mean_abs:9.4f}  {d.max_abs:5.0f}  {d.n_over:8d}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
