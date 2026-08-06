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

**Fixed (iOS):** the phone ran no pose detection at all — Vision was never
imported. `Core/PoseDetection.swift` now runs Apple's body-pose request on the
player's own photo, on device, and `Components/CapturedPoseImage.swift` draws it
in the same white-bones/orange-joints treatment the web uses, so one shot looks
the same on both platforms. `SkeletonOverlay` keeps its six constants and is
unchanged for every existing caller — all of them pass no detected pose, which
is correct over the canonical crops. The same aspect-fill trap the web hit is
handled explicitly (`ShotIQPose.filledSize`, pinned by nine XCTest cases), and
024's "full body visible" / "shooting hand visible" rows now come from the
detection instead of being asserted from constants.

**Fixed (video):** `analyzeVideoShooting` located only three phases — SETUP,
RELEASE, FOLLOW_THROUGH — and lumped everything between setup and release into
one `LOADING` bucket, so the LOAD and RISE cards on every five-phase strip had
no source of frames at all. LOAD is now the deepest knee bend between setup and
release and RISE is where the wrists sit halfway between their load and release
heights, both from per-frame data already computed. `PhaseFrames.tsx` reads the
stills back and puts each one in its card, falling back to the canonical figure
whenever a still is not available.

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

### All four are fixed

- **(1) and (2)** — `getSessionUser` now verifies the same signed token from
  either carrier, cookie first so a browser request cannot be re-attributed by
  an attacker-supplied header. A forged Bearer is still rejected.
- **(2, second half)** — signin and signup return the token they already mint
  for the cookie, so the client's Keychain finally holds something.
- **(3)** — `POST /api/auth/refresh` exists and re-issues the session token to a
  caller who can still present a valid one, re-reading the user so a deleted
  account stops there. On the client, the Keychain is cleared only on an
  explicit 401 — never on a 404, a 500, or a dead network — and refresh/retry is
  bounded to one attempt.
- **(4)** — `resolveProfileId` creates the profile on demand rather than 404ing.
  It is a row the data hangs off, not a gate, and it is only ever created for a
  caller who has already proved who they are.

Proven end to end in `tests/e2e/ios-auth-chain.spec.ts`, over real HTTP, the way
the phone behaves — Bearer token, no cookie jar. Any request carrying a cookie
would have passed with all four defects present, so the suite never sends one.
It signs up a phone-only account, saves a capture, and reads it back from the
web library tagged "iOS Capture".

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

---

## 4. Web sweep — 25 sidebar routes, signed in

Ran against a production build with a real session. Per route: HTTP status,
broken images, dead buttons, console errors.

**Good news, measured rather than assumed:**

- **All 25 sidebar routes return HTTP 200.** No dead tabs.
- **Zero broken images across the whole app** — 287 `<img>` elements, every one
  resolved. "All the pictures" is clean.

Three routes I first reported as 404 were **my** wrong paths, not the app's:
Goals is `/results/demo/goals`, Achievements is `/points`, Help points at
`/guide`. Checked against `ShotIQShell`'s nav table and re-run before reporting.

**Two real defects:**

### 4a. `/api/media` has no GET, so the Media library can never show your uploads

`src/app/api/media/route.ts` exports **`DELETE` only**. `src/app/media/page.tsx:120`
does `fetch("/api/media")` — a GET — which returns **405 Method Not Allowed**.
The call is wrapped in `.catch(() => {})`, so the failure is silent and the page
falls back to its hardcoded demo groups.

This is the same complaint as the upload one, one layer down: Media *advertises*
your captured content and structurally cannot show it. It also breaks the
iOS→web direction directly — an iOS upload lands in `media_uploads`, and the web
Media page has no endpoint to read it back.

### 4b. Dashboard "Why this matters" is a dead control

`src/app/dashboard/page.tsx:273` — `<button type="button">` with an `Info` icon
and **no `onClick`**. It looks like an explain-this affordance and does nothing.

Both are additive fixes (a GET handler; a handler for the button) — neither
requires removing anything. Not made yet: 4a is a backend change with auth
scoping, and backend changes should be asked for rather than assumed.
