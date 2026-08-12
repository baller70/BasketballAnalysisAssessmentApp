import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { CSRF_COOKIE_NAME, CSRF_MAX_AGE } from '@/lib/csrf'

/**
 * PER REQUEST, AND THE COMPILER HAS TO BE TOLD SO.
 *
 * This handler takes no arguments and reads nothing request-scoped, so Next 14
 * classified it as static and PRERENDERED IT AT BUILD TIME. `randomBytes` then
 * ran exactly once, on the build machine, and the token plus its `Set-Cookie`
 * were frozen into the dist:
 *
 *     .next/prerender-manifest.json
 *       "/api/auth/csrf".initialHeaders["set-cookie"]
 *         csrf-token=c010067a…; Path=/; Expires=…
 *
 * Six GETs from independent cookie jars returned the SAME token, so every
 * caller in the world shared one secret and the double-submit comparison
 * compared a constant against itself. `validateCsrf` is cited as a control in
 * three consecutive rounds of this screen's write-ups; on the artefact that
 * ships it protected nothing against a scripted caller.
 *
 * It was NOT always broken, and how it broke is the lesson. On the earlier
 * dists there is no `prerender-manifest.json` at all — static generation was
 * failing (the build exited 1 with 51 prerender errors), so this route stayed
 * dynamic by accident. FIXING THE BUILD IS WHAT FROZE THE TOKEN. A repair to
 * the pipeline changed a security property of a route nobody edited, which is
 * rule 74 one level deeper than rule 74 was written: the controls were all
 * re-verified on the production dist, except the one whose behaviour differs
 * between dev and prod.
 *
 * `force-dynamic` is the fix, and `docs/shotiq/csrf-gate.mjs` asserts two GETs
 * return different tokens so this cannot come back silently.
 */
export const dynamic = 'force-dynamic'

/**
 * CSRF token endpoint (double-submit cookie pattern).
 *
 * Generates a cryptographically-random per-request token, returns it in the
 * JSON body for the client to echo back in the `x-csrf-token` header, and also
 * sets it as a cookie so the server can compare the two. The cookie is
 * intentionally NOT httpOnly so the client can read it for the double-submit
 * comparison.
 */
export async function GET() {
  const csrfToken = randomBytes(32).toString('hex')

  const response = NextResponse.json({ csrfToken })

  response.cookies.set(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: CSRF_MAX_AGE,
  })

  return response
}
