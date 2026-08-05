# Canonical design sets — the spec, not a snapshot

`canonical/` holds the 72 iOS screens (001–072). `../canonical-desktop/` holds
the 20 desktop screens (077–096). Every fidelity measurement in this project is
taken against these files.

**Do not modify, re-encode, crop, or "optimise" them.** The measurement method
depends on their exact pixels — including the unsharp-mask ringing that makes a
small-type stem read `248 / 255 / [74 85] / 255 / 248`. A lossless re-encode
would be harmless in principle and is still not worth the risk of a tool
quietly resampling.

They are committed because a container rollback destroyed the scratchpad copy
once already, and without them there is no target to measure against. See
`../SCREEN-LEDGER.md` for the method rules and the per-screen state.
