/**
 * Routes that render a canonical ShotIQ screen from the sidecar contract.
 *
 * These screens paint their own ShotIQ topbar and sidebar at exact canonical
 * geometry, so the global <Header/> and <Footer/> must not render on them —
 * extra chrome would offset every measured element and is explicitly excluded
 * by the design contract ("no device frames, browser frames, or surrounding
 * presentation whitespace").
 */
export const CANONICAL_SHELL_ROUTES: readonly string[] = [
  '/signin',
  '/dashboard',
  '/analyze',
  '/media',
  '/points',
  '/badges',
  '/profile',
  '/settings',
  '/elite-shooters',
  '/video-analysis',
  '/upload',
]

/** Prefix-based variant for nested canonical route families. */
export const CANONICAL_SHELL_PREFIXES: readonly string[] = [
  '/results/demo',
  '/elite-shooters/',
  '/training/drills/',
]

export function isCanonicalShellRoute(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  if (CANONICAL_SHELL_ROUTES.includes(pathname)) return true
  return CANONICAL_SHELL_PREFIXES.some((p) => pathname.startsWith(p))
}
