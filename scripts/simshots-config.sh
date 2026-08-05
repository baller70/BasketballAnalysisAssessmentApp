# Capture configuration for scripts/simulator-screenshots.sh, read by CI.
#
# WHY THIS FILE EXISTS
#
# Every simulator capture this project has ever taken ran at the DEFAULT text
# size, because that is what a freshly created simulator boots at. Meanwhile the
# app on Kevin's phone was drawing screens wider than the display, centred and
# clipped off both edges, with the SHOTIQ wordmark cut away under the notch and
# "Progress" truncated to "Progre..." in the tab bar. All 74 screenshots came
# back clean while the app was unusable. A capture that only ever samples one
# configuration is not evidence about the configurations users actually run.
#
# The cause: all ~176 type declarations in the app are Font.custom(_:size:),
# which scales with the phone's Text Size setting, while the layout around it is
# fixed canonical geometry.
#
# Values must use `: "${VAR:=value}"` — the broker sets SIMSHOTS_OUTPUT_DIR and
# SIMSHOTS_LOG_DIR itself and those must not be overridden here.

# Shoot at an accessibility text size, not the default. This is the arm that
# reproduces what a real phone above the default draws.
: "${SIMSHOTS_CONTENT_SIZE:=accessibility-medium}"

# ---------------------------------------------------------------------------
# THE FALSIFICATION ARM. Uncomment to lift the app's Dynamic Type clamp.
#
# The claim under test is that unclamped type is what pushed screens past the
# viewport. Two runs at the same content size decide it:
#
#   clamped   (this file as committed)  -> screens should be whole
#   unclamped (line below uncommented)  -> screens should reproduce the overflow
#
# If both arms come back identical, the clamp is not what fixed it and the real
# cause is still out there. Leave this commented in the committed state so the
# routine CI capture measures the SHIPPING configuration.
# : "${SIMSHOTS_EXTRA_ARGS:=-uiTestNoTypeClamp}"
