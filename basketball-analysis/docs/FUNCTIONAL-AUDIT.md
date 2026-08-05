# Functional audit — does the app do what it advertises?

Kevin, 2026-08-05: *"It advertises a certain thing, and it needs to function the
way it is advertising… I press upload, and nothing happens."* And: *"When I write
things in the iOS app, it should also write to the web app, as they share the
same backend."*

This file records what was **measured**, not what the code appears to do. Every
claim below has a reproduction next to it.

---

## 1. Upload did nothing — confirmed, and fixed for stills

**Measured.** Signed in as a real user against a production build, uploaded a
real photo with Playwright while recording every network request: **zero `/api`
calls**. The file never left the browser. It got a local preview, three
client-side checks (`File Format ✓ / File Size ✓ / Resolution ✗ too low`), and
stopped. No analyse button, no way forward.

**Every wireframe in the product was decoration:**

- `SkeletonOverlay` in `AnalysisFlow.swift` draws six hard-coded normalised
  points — the identical skeleton on every photo, whatever is in it.
- The canonical thumbnails have the skeleton baked into the image file
  (`// Canonical reference-shooter frame; pose overlay is baked in.`).
- **`/results/demo` is the only results route in the app.** There is no
  `/results/[id]`. Analyze, Analytics, Train, Progress, the upload flow and the
  share links all point at that one static page.

**The engine was already here.** `src/services/poseDetection.ts` is 619 lines of
working MoveNet — keypoints, `SKELETON_CONNECTIONS`, shooting angles, form
feedback — imported by exactly one area: `src/components/live/*`. Nothing on the
upload path touched it.

**Fixed (stills only):** `UploadedPoseOverlay` runs that same detector on the
selected photo and draws the real skeleton. Verified in a production build —
canvas sized to the file at 182×281, 1235 painted pixels, skeleton landing on
the shooter. Two things had to be corrected to make it work at all:

| defect | why it mattered |
|---|---|
| No `modelUrl` — tfjs fetched ~4.6MB from Google on every cold start | When that fetch fails the only symptom is a photo with no skeleton, which reads as "the app is broken". Weights are now served from our own origin, byte-identical (sha256 `c65a3447…`) to what tfjs fetched. |
| tfjs reads an `HTMLImageElement` through its **layout** size | A 182×281 photo in a square tile was sampled as 280×280, so keypoints came back stretched while the overlay drew in the file's own space: a correctly shaped skeleton standing *beside* the player. Detection now runs on an offscreen canvas at `naturalWidth`/`naturalHeight`. |

**Still not done:** video → phase frames, a real per-upload results page, and the
same overlay on iOS.

---

## 2. iOS → web shared backend — the backend works, the iOS auth does not

**The shared backend is real and correct.** Posting an iOS-shaped body to
`/api/save-analysis` with cookie auth returned `200` with an `analysisId`, and
`/api/analysis-history` read it straight back with the right score. Postgres
carries 27 models including `UserAnalysis`, `MediaUpload`, `AnalysisHistory`,
`ShotEvent`.

**Four defects sit between the iOS client and that backend.** All measured:

1. **`Authorization: Bearer` is ignored.** `getSessionUser()` reads *only* the
   `auth-token` httpOnly cookie — *"This is the ONLY trusted source of who is
   calling"* — and **no route anywhere reads the Authorization header**
   (`grep -rn 'authorization' src/lib/auth/ src/lib/authToken.ts src/middleware.ts`
   returns nothing). `APIClient.swift:147` sets that header on every request.
   Reproduced: CSRF satisfied, Bearer header present, no auth cookie →
   `401 {"success":false,"error":"Unauthorized"}`.

2. **iOS therefore authenticates only by accident.** Whatever works today works
   because `URLSession`'s shared cookie store happens to keep the `Set-Cookie`
   from sign-in and resend it. Nothing in the client manages that deliberately.

3. **`/api/auth/refresh` does not exist.** `APIClient.refreshTokens()` POSTs
   there on any 401 (`APIClient.swift:169`), and `src/app/api/auth/` has no
   `refresh` route. The client treats a non-200 by **deleting both keychain
   tokens and throwing 401** — so a single 401 silently signs the player out on
   the phone with no way back except a manual re-login.

4. **`save-analysis` 404s until a `UserProfile` exists.** `resolveProfileId()`
   returns *"Profile not found"* for a signed-in user with no profile row — the
   state every brand-new account is in — and **iOS never creates one**
   (no `api/profile` or onboarding call anywhere in `Core/` or `Screens/Auth/`).
   Reproduced: `404 {"success":false,"error":"Profile not found"}` before
   creating the profile, `200` after.

**So the honest answer to "does an iOS write show up on the web":** it can, and
the plumbing is sound, but the client's auth is undeclared, its recovery path
calls a route that isn't there, and the destination rejects any account that
hasn't been through onboarding.

---

## 3. There was no database, which is why none of this had been caught

The dev container had no Postgres. Every "functional" check degraded silently:
`/api/auth/signin` answered `{"error":"Database connection failed. 503"}`,
Playwright could not get past sign-in, and `/upload` rendered its signed-out
shell **with no file input at all** — which reports identically whether the
upload feature works or not.

`scripts/dev-testdb.sh` rebuilds it in one command: cluster, migrations, 328
seeded shooters, and a sign-in-able account. Re-runnable, because this container
has reclaimed both `/var/lib/postgresql/*` and `basketball-analysis/.next`
mid-session — the environment is not durable, so recreation has to be cheap.
