"""shotiq measure — the committed measurement library for canonical-fidelity work.

Built from the throwaway toolkit that measured screen 003, so screen 004 starts
with working instruments instead of rewriting them. Every method rule it
encodes is cross-referenced to ``docs/SCREEN-LEDGER.md``; read the README next
to this file before using it.

Three standing constraints, in the order they get violated:

1. **Every estimator names its estimator in its docstring** — what it thresholds
   on, what it normalises to, what it returns (rule 25).
2. **A segmenter that finds nothing raises** (rule 30). There is no ``None``
   return anywhere in this library that means "not found".
3. **Never a single hand-picked column** (rule 24). Every per-column quantity is
   reduced over all the columns in the run.

Typical use::

    from measure import image, segment, crossings, compare

    img   = image.load('docs/shotiq/canonical/003-sign-in.png')
    plane = image.plane_for(img, 'neutral')            # rule 2: green channel
    band  = segment.ink_band(plane, (1008, 1050, 90, 400))   # rules 5 + 6
    base  = crossings.baseline(plane, band)            # rule 24: all columns
    print(base.y, base.estimator)

Self-test::

    python3 -m measure.selftest          # from docs/shotiq/
"""

from . import capture, compare, crossings, errors, fill, hairline, image, ladder, ratios, segment
from .errors import MeasurementError, PlateauError, SegmentationError, WindowError

__all__ = [
    "capture", "compare", "crossings", "errors", "fill", "hairline",
    "image", "ladder", "ratios", "segment",
    "MeasurementError", "SegmentationError", "PlateauError", "WindowError",
]

__version__ = "1.0.0"
