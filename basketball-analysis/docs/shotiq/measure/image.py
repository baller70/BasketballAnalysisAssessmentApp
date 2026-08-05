"""Loading, channel selection and coverage normalisation.

Everything downstream measures a ``Plane``: a 2-D float array of *coverage* in
[0, 1] carrying the estimator that produced it. Coverage is not luminance and
not "darkness"; it is ink fraction against **this image's own background**,
which is why the same code reads black type on white paper and white type on an
orange plate without either measurement knowing what colour anything is.

Method rules encoded here
-------------------------
* **Rule 2 — weight on the GREEN channel.** Chromium applies LCD subpixel
  antialiasing to some runs at some sizes (fringes around 12px and 21px CSS,
  neutral at 30px+). Canonical is greyscale. Measured on luminance such a run
  reads +7 to +13% heavy, which is a false weight defect. Green is the channel
  the fringe is centred on, so it is the one that agrees with a greyscale
  render.
* **Rule 3 — ink on ORANGE runs on the BLUE channel.** Canonical's orange has
  B = 0.7-3 and its black has B = 0, so on blue both read as full ink and the
  measurement stops depending on the colour. On 002 a label read -5.1% on green
  and was called an outlier; on blue all four labels sat at -1.4 to -2.5% and it
  never was one.
* **White ink on the orange plate** is the same trick with the polarity
  reversed: the plate is B ~ 1 and the white type is B = 255, so blue with
  ``polarity='light_on_dark'`` is colour-independent in exactly the way the
  black-on-white case is.
"""

from dataclasses import dataclass

import numpy as np
from PIL import Image

from .errors import WindowError

CHANNEL_INDEX = {"r": 0, "g": 1, "b": 2}

#: Presets that encode rules 2 and 3 so a caller does not have to remember them.
#: ``(channel, polarity, why)``.
ROLES = {
    # Rule 2. The default for anything neutral: black, graphite, grey, labels.
    "neutral": ("g", "dark_on_light", "rule 2 — weight on green, LCD-fringe safe"),
    # Rule 3. Orange/red type: B saturates for both orange and black.
    "orange": ("b", "dark_on_light", "rule 3 — orange ink read on blue"),
    # Green validation type. R is the channel the green does not occupy.
    "green": ("r", "dark_on_light", "green ink read on red, colour-independent"),
    # White type on the orange plate, and the focus mark on it.
    "white_on_plate": ("b", "light_on_dark", "plate B~1, white B=255 — blue, inverted"),
}


@dataclass(frozen=True)
class Plane:
    """A coverage plane plus the estimator that produced it.

    ``cov`` is HxW float in [0, 1]. ``background`` is the 8-bit level coverage
    was normalised to, measured off the image rather than assumed. ``estimator``
    is a one-line human-readable name — print it next to any number you report
    from this plane, because rule 25 says a threshold without a named estimator
    is a hand-picked column waiting to happen.
    """

    cov: np.ndarray
    channel: str
    polarity: str
    background: float
    estimator: str

    @property
    def shape(self):
        return self.cov.shape

    def __getitem__(self, key):
        return self.cov[key]


def load(path):
    """Read a PNG as float64 RGB, HxWx3, values 0-255. No resizing, ever.

    ESTIMATOR: none — this is the raw plate. Resampling a canonical PNG to match
    a render's height is how a whole-screen offset gets manufactured; see
    :func:`measure.compare.top_anchored`.
    """
    return np.asarray(Image.open(str(path)).convert("RGB")).astype(np.float64)


def channel(img, ch):
    """One 8-bit channel of an RGB plate as float64."""
    if ch not in CHANNEL_INDEX:
        raise WindowError(f"unknown channel {ch!r}; expected one of {sorted(CHANNEL_INDEX)}")
    return img[:, :, CHANNEL_INDEX[ch]]


def background_level(img, ch, window=None):
    """Background level of a channel, as the MODAL 8-bit value in the window.

    ESTIMATOR: mode of the 256-bin histogram of channel ``ch`` over ``window``
    (whole image when omitted), returned as a float 0-255. Normalises to
    nothing; it *is* the normaliser everything else uses.

    The mode rather than the max or the mean: the max is unsharp-mask overshoot
    (rule 8, canonical rings both sides of a stem to 255 and beyond on the light
    side), and the mean is dragged by however much ink happens to be in frame.
    The mode is the paper, or the plate, whichever fills the window.

    Pass a window that is mostly ink and you will get the ink as "background".
    That is a real failure mode; pass ``background=`` explicitly when you know.
    """
    a = channel(img, ch)
    if window is not None:
        y0, y1, x0, x1 = window
        _check_window(a.shape, window)
        a = a[y0:y1, x0:x1]
    counts = np.bincount(np.clip(np.round(a.ravel()), 0, 255).astype(np.int64), minlength=256)
    return float(np.argmax(counts))


def coverage(img, ch="g", polarity="dark_on_light", background=None, window=None):
    """Ink coverage in [0, 1] on one channel, normalised to the image's own background.

    ESTIMATOR: per-pixel coverage on channel ``ch``.
      ``dark_on_light``  cov = clip((bg - v) / bg, 0, 1)
      ``light_on_dark``  cov = clip((v - bg) / (255 - bg), 0, 1)
    where ``bg`` is :func:`background_level` on the same channel unless given.
    Returns a :class:`Plane` over the WHOLE image (``window`` only scopes the
    background estimate, so coordinates stay absolute and a band measured here
    can be compared to a band measured on another image without bookkeeping).

    Coverage 1.0 is full ink, 0.0 is bare background. This is the quantity every
    threshold in this library is stated in, and the reason thresholds transfer
    between canonical and a render at all.
    """
    if polarity not in ("dark_on_light", "light_on_dark"):
        raise WindowError(f"unknown polarity {polarity!r}")
    v = channel(img, ch)
    bg = background_level(img, ch, window) if background is None else float(background)
    if polarity == "dark_on_light":
        if bg <= 0:
            raise WindowError(
                f"background on channel {ch!r} measured {bg}; a dark-on-light plane needs a "
                "light background. Did you mean polarity='light_on_dark'?"
            )
        cov = np.clip((bg - v) / bg, 0.0, 1.0)
    else:
        if bg >= 255:
            raise WindowError(
                f"background on channel {ch!r} measured {bg}; a light-on-dark plane needs a "
                "dark background. Did you mean polarity='dark_on_light'?"
            )
        cov = np.clip((v - bg) / (255.0 - bg), 0.0, 1.0)
    est = f"coverage[{ch}/{polarity}] normalised to background {bg:.0f}"
    return Plane(cov=cov, channel=ch, polarity=polarity, background=bg, estimator=est)


def plane_for(img, role="neutral", background=None, window=None):
    """Coverage plane for a named ink role, applying rules 2 and 3 for you.

    ESTIMATOR: :func:`coverage` with the channel and polarity :data:`ROLES`
    prescribes for ``role``; see the module docstring for why each one.
    Returns a :class:`Plane` whose ``estimator`` records both the role and the
    rule it came from.
    """
    if role not in ROLES:
        raise WindowError(f"unknown ink role {role!r}; expected one of {sorted(ROLES)}")
    ch, pol, why = ROLES[role]
    plane = coverage(img, ch, pol, background=background, window=window)
    return Plane(
        cov=plane.cov,
        channel=ch,
        polarity=pol,
        background=plane.background,
        estimator=f"role={role} ({why}); {plane.estimator}",
    )


def _check_window(shape, window):
    y0, y1, x0, x1 = window
    h, w = shape[0], shape[1]
    if not (0 <= y0 < y1 <= h and 0 <= x0 < x1 <= w):
        raise WindowError(f"window {window} is outside a {w}x{h} image or inverted")
