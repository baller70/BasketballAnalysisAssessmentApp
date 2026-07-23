# ShotIQ Shooting Coach: research and language standard

## Product role

Shooting Coach gives one short, measurement-backed cue after each detected shot.
It complements practice and qualified coaching; it does not diagnose injury or
claim to replace an in-person trainer who can evaluate context the camera does
not observe.

## Cue design rules

1. **One correction per rep.** Critical measured issues take priority over
   warnings so the shooter is not overloaded with a list during a live set.
2. **No invented correction.** Unknown/unmeasured joints never generate a
   joint-specific critique. A neutral balance/follow-through cue is used when
   no reliable feedback exists.
3. **Action language.** Cues say what to do on the next rep: “elbow under the
   ball,” “reach up,” “snap your wrist,” “hold your finish,” and “rise in one
   smooth motion.”
4. **Reinforce good reps.** When measured areas are good, the coach confirms the
   repeatable behavior instead of manufacturing a flaw.
5. **External, simple focus.** Cues prefer the target and visible outcome over
   dense anatomy or angle readouts while the player is shooting.
6. **Direction matters.** “Too bent” and “too straight” cannot receive the same
   correction. Shooting Coach uses the measured tip direction to avoid making
   an identified problem worse.
7. **Audio dependency stays honest.** Turning Voice Feedback off also turns
   Shooting Coach off; the interface never claims a silent trainer is active.

## Evidence reviewed

- Jr. NBA instructional materials and coach-practice resources: shooting
  balance, hand/elbow alignment, upward extension, wrist action, and held
  follow-through.
- USA Basketball youth-development coaching principles: age-appropriate,
  progressive instruction and concise feedback.
- Okazaki, Rodacki & Satern, *A review on the basketball jump shot* (Sports
  Biomechanics, 2015), DOI: `10.1080/14763141.2015.1052541`: coordinated lower-
  and upper-body action, release parameters, and task constraints.
- Wulf, *Attentional focus and motor learning: a review of 15 years* (2013),
  DOI: `10.1080/1750984X.2012.723728`: concise external-focus instructions can
  support motor performance and learning better than body-part overload.

## Current deterministic priority

`elbow → wrist → release → knee → shoulder → hip`

This ordering emphasizes the shooting-line and release cues first while still
using lower-body and balance feedback when those are the highest measured
problem. Future changes must be validated against captured sessions and must
not claim a flaw when its measurement status is `unknown`.
