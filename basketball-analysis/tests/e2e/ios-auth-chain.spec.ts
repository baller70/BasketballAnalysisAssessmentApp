import { test, expect, type APIRequestContext } from "@playwright/test"

/**
 * THE PHONE AND THE WEBSITE ARE ONE APP, OR THEY ARE NOT.
 *
 * Four defects sat between an iOS capture and the web library, and each one on
 * its own was enough to break the whole chain:
 *
 *   1. `getSessionUser` read ONLY the `auth-token` cookie. The Swift client has
 *      always sent `Authorization: Bearer` and it was ignored outright; the app
 *      worked at all only because URLSession happened to keep the signin cookie.
 *   2. Signin returned no token in its body, so the client's Keychain stayed
 *      empty and every Bearer header it sent was blank.
 *   3. `/api/auth/refresh` did not exist. The client calls it on any 401, read
 *      the 404 as "your session is over", and deleted the Keychain — one
 *      unauthenticated request logged the player out for good.
 *   4. `resolveProfileId` answered 404 for an account with no UserProfile row.
 *      Anyone who signed up on the phone never had one, so their first capture
 *      could not be saved and nothing they did ever reached the web app.
 *
 * These run over real HTTP, the way the phone behaves: a Bearer token and NO
 * cookie jar. Every request that carries a cookie is a request that would still
 * pass with all four defects present, so this suite is careful never to.
 */

const EMAIL = "khouston721@gmail.com"
const PASSWORD = "hunterrr"

/** Sign in the way the client does — CSRF token first — and return the token. */
async function signInForToken(api: APIRequestContext): Promise<string> {
  const csrfRes = await api.get("/api/auth/csrf")
  const { csrfToken } = await csrfRes.json()
  const res = await api.post("/api/auth/signin", {
    headers: { "x-csrf-token": csrfToken },
    data: { email: EMAIL, password: PASSWORD },
  })
  expect(res.status(), await res.text()).toBe(200)
  const body = await res.json()
  expect(typeof body.accessToken, "signin must return a token native clients can store").toBe("string")
  return body.accessToken as string
}

/** A context with no cookies at all — the phone's situation, not a browser's. */
async function bearerOnly(playwright: typeof import("@playwright/test").request, baseURL: string, token: string) {
  return playwright.newContext({
    baseURL,
    extraHTTPHeaders: { Authorization: `Bearer ${token}` },
  })
}

test.describe("iOS → web auth chain", () => {
  test("a Bearer token alone authenticates, and a forged one does not", async ({ playwright, request, baseURL }) => {
    const token = await signInForToken(request)
    const phone = await bearerOnly(playwright.request, baseURL!, token)

    // Read paths the phone depends on.
    expect((await phone.get("/api/media")).status()).toBe(200)
    expect((await phone.get("/api/analysis-history?limit=5")).status()).toBe(200)

    // Widening to Bearer must not widen who gets in.
    const forged = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { Authorization: "Bearer not.a.real.token" },
    })
    expect((await forged.get("/api/media")).status()).toBe(401)
    await forged.dispose()

    const anonymous = await playwright.request.newContext({ baseURL })
    expect((await anonymous.get("/api/media")).status()).toBe(401)
    await anonymous.dispose()

    await phone.dispose()
  })

  test("refresh renews a live session and refuses a dead one", async ({ playwright, request, baseURL }) => {
    const token = await signInForToken(request)
    const bare = await playwright.request.newContext({ baseURL })

    const res = await bare.post("/api/auth/refresh", { data: { refreshToken: token } })
    expect(res.status(), "this route used to 404, which logged the phone out").toBe(200)
    const { accessToken } = await res.json()
    expect(typeof accessToken).toBe("string")

    // The renewed token has to actually work, or "refresh" is theatre.
    const renewed = await bearerOnly(playwright.request, baseURL!, accessToken)
    expect((await renewed.get("/api/media")).status()).toBe(200)
    await renewed.dispose()

    await bare.dispose()

    // And it must not be able to bring a dead session back. This needs a
    // context that has never touched the API: a successful refresh sets the
    // auth cookie, and reusing that context would test the cookie rather than
    // the rejected token.
    const stranger = await playwright.request.newContext({ baseURL })
    const dead = await stranger.post("/api/auth/refresh", { data: { refreshToken: "expired.garbage.token" } })
    expect(dead.status()).toBe(401)
    await stranger.dispose()
  })

  test("an account created on the phone can save a capture and read it back", async ({ playwright, request, baseURL }) => {
    // A brand-new account has no UserProfile — exactly the case that used to
    // 404 every profile-scoped route.
    const email = `phone-signup-${Date.now()}@example.com`
    const csrfRes = await request.get("/api/auth/csrf")
    const { csrfToken } = await csrfRes.json()
    const signup = await request.post("/api/auth/signup", {
      headers: { "x-csrf-token": csrfToken },
      data: { email, password: "TestPassw0rd!", name: "Phone Signup" },
    })
    expect(signup.status(), await signup.text()).toBe(201)
    const { accessToken } = await signup.json()
    expect(typeof accessToken, "signup must return a token too").toBe("string")

    const phone = await bearerOnly(playwright.request, baseURL!, accessToken)
    expect((await phone.get("/api/media")).status(),
      'used to be 404 "Profile not found"').toBe(200)

    // The write itself, in the shape CaptureFlow.swift posts.
    const clientSessionId = `ios-${Date.now()}`
    const csrf2 = await (await phone.get("/api/auth/csrf")).json()
    const save = await phone.post("/api/save-analysis", {
      headers: { "x-csrf-token": csrf2.csrfToken },
      data: {
        clientSessionId,
        recordedAt: new Date().toISOString(),
        mediaType: "image",
        overallScore: 78,
        coachingNotes: "Captured on the phone.",
      },
    })
    expect(save.status(), await save.text()).toBe(200)

    // And the whole point: the web library shows it.
    const library = await (await phone.get("/api/media")).json()
    expect(Array.isArray(library.media)).toBe(true)
    expect(library.media.length).toBeGreaterThan(0)
    expect(library.media[0].source).toBe("iOS Capture")

    await phone.dispose()
  })
})
