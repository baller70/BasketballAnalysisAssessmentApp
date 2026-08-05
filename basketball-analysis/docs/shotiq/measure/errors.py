"""Exception types.

The whole point of this module is method rule 30: *a null from a segmenter is a
claim about the segmenter until proven otherwise*. Nothing in this library
returns an empty list, ``None`` or ``nan`` to mean "I could not find it". It
raises, and the message carries the numbers that would let you see why.
"""


class MeasurementError(Exception):
    """Base class. Anything raised by this library is one of these."""


class SegmentationError(MeasurementError):
    """A segmenter found no runs, or found a number of runs it was not asked for.

    Rule 30. On screen 003 the OR hairlines returned "no runs" twice, silently,
    because the 50% threshold had been estimated across the loud "OR" glyphs
    sitting between them: the rules peak at 0.27 coverage and the glyphs peak
    about ten times higher, so the threshold landed above the entire feature.
    Two measurements were nearly reported as "the rules are missing".

    Carries ``sweep`` — the per-threshold table that produced the failure — so
    the message shows what the segmenter actually saw at every threshold it
    tried, not just that it saw nothing at one.
    """

    def __init__(self, message, sweep=None):
        super().__init__(message)
        self.sweep = sweep


class PlateauError(MeasurementError):
    """A coverage or colour plateau could not be estimated from enough material.

    Raised rather than returning a plateau computed from three pixels, because a
    plateau taken from too little material is exactly how rule 30's failure
    happens: the number comes back, it is wrong, and nothing about it looks
    wrong.
    """


class WindowError(MeasurementError):
    """A window is off the image, inverted, or too small for the estimator."""
