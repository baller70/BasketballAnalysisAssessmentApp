"use client"

import { useCallback, useEffect, useState } from "react"

/**
 * The addressable sub-state of a results route.
 *
 * Each canonical iOS screen in this family needs its own reachable surface, and
 * several of them are states of a route the desktop also serves — /results/demo/
 * flaws is canonical 046 on the phone and the graded desktop 085 at 1440pt. A
 * query key keeps both true: the phone reads it and swaps screen, the desktop
 * never reads it, so 083-087 and 093 render byte-identically to before.
 *
 * It is a real route, not a prop: `set()` pushes a history entry, so the phone's
 * back gesture returns to the parent screen, the URL can be shared, and the
 * capture harness reaches the state by navigating to it — no synthetic click.
 *
 * `useSearchParams` is deliberately not used: it opts the whole route out of
 * static generation unless every consumer is wrapped in Suspense, and these
 * pages are already client components that the desktop build renders statically.
 */
export function usePhoneRoute(key: string): [string | null, (v: string | null) => void] {
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    const read = () => setValue(new URLSearchParams(window.location.search).get(key))
    read()
    window.addEventListener("popstate", read)
    return () => window.removeEventListener("popstate", read)
  }, [key])

  const set = useCallback((v: string | null) => {
    const url = new URL(window.location.href)
    if (v === null) url.searchParams.delete(key)
    else url.searchParams.set(key, v)
    window.history.pushState({}, "", url)
    setValue(v)
  }, [key])

  return [value, set]
}
