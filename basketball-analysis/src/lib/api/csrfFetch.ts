"use client"

/**
 * csrfFetch — client helper for calling mutating API routes that require CSRF.
 *
 * Mutating endpoints (POST/PUT/PATCH/DELETE) are protected by the double-submit
 * cookie pattern: the server compares an `x-csrf-token` header against the
 * `csrf-token` cookie. This helper transparently fetches a token (which also
 * sets the cookie) and attaches it to the request, always sending credentials so
 * the httpOnly auth-token + csrf cookies travel with the request.
 *
 * Usage:
 *   await csrfFetch('/api/profile', { method: 'POST', body: JSON.stringify(x) })
 *
 * The token is cached for the lifetime of the page and reused across calls.
 */

let cachedToken: string | null = null

/** Fetch (and cache) a CSRF token. Returns '' on failure; the server rejects. */
export async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (cachedToken && !forceRefresh) return cachedToken
  try {
    const res = await fetch("/api/auth/csrf", {
      method: "GET",
      credentials: "include",
    })
    if (!res.ok) return ""
    const data = await res.json()
    const token = typeof data?.csrfToken === "string" ? data.csrfToken : ""
    cachedToken = token || null
    return token
  } catch {
    return ""
  }
}

/**
 * Like `fetch`, but injects the CSRF token header and `credentials: 'include'`.
 * On a 403 (token expired/rotated) it refreshes the token once and retries.
 */
export async function csrfFetch(
  url: string,
  opts: RequestInit = {}
): Promise<Response> {
  const send = async (token: string): Promise<Response> => {
    const headers = new Headers(opts.headers || {})
    if (
      !headers.has("Content-Type") &&
      opts.body &&
      typeof opts.body === "string"
    ) {
      headers.set("Content-Type", "application/json")
    }
    if (token) headers.set("x-csrf-token", token)
    return fetch(url, { ...opts, headers, credentials: "include" })
  }

  let res = await send(await getCsrfToken())
  if (res.status === 403) {
    // Token may be stale — refresh once and retry.
    res = await send(await getCsrfToken(true))
  }
  return res
}
