"use client"

/**
 * Canonical ShotIQ PHONE chrome.
 *
 * The iOS app is Capacitor wrapping this same Next.js app, so "iOS" is this
 * codebase rendered at 393pt. Canonical's phone navigation is NOT the desktop
 * sidebar: it is a compact top bar plus a five-item bottom tab bar. The desktop
 * rail is untouched and still the only menu above the tablet breakpoint — this
 * is the same navigation model expressed per platform, not a second menu. The
 * overflow sheet below is even driven by the desktop sidebar's own data
 * (SIDEBAR_GROUPS / SIDEBAR_FOOTER / SIDEBAR_LEGAL), so a destination can never
 * exist on one platform and not the other.
 *
 * ---------------------------------------------------------------- geometry
 * Every number here is measured off the 72 canonical PNGs (853x1844px, where
 * 853px == 393pt, so 1 canonical px = 0.4607pt). Bands were segmented into ink
 * runs per screen and the MEDIAN taken across every screen that carries the
 * element, rather than read off a single crop:
 *
 *   element                        canonical px      pt      n
 *   topbar height (to hairline)          84         38.7    63
 *   wordmark ink left (gutter)           39         18.0    70
 *   wordmark cap height                  36         16.6    70
 *   top-right action ink                42x43   19.4x19.8   65
 *   content left gutter                  38         17.5    70
 *   content right gutter                 39         18.0    70
 *   tab bar height (hairline->edge)     132         60.8    47
 *   hairline -> tab icon ink top         19          8.8    47
 *   tab icon ink height                  52         24.0    53
 *   tab icon -> label gap                10          4.6    53
 *   tab label cap height                 14          6.5    53
 *
 * The wordmark is set at 18px because .shotiq-wordmark (Boxed Heavy) draws a
 * cap at 0.905em — measured on the shipped desktop topbar, whose 21px renders a
 * 19px cap — so 16.6 / 0.905 = 18.3px.
 *
 * Tab icons are drawn on the 24 grid the sidecars' `iconography` block
 * declares (grid 24, round cap/join, activeStrokeWidth 2), which is also the
 * 24.0pt the icon band measures.
 *
 * ------------------------------------------------------------------ colour
 * Sampled from the darkest decile of each glyph's own ink, per screen, then
 * median-ed: active #FE2300 -> shotiqOrange, inactive icon #000000 -> ink,
 * inactive label #52545D -> graphite. Existing tokens only; none invented.
 *
 * Safe-area insets are additive via env(), so the 393x852 capture (no notch,
 * insets resolve to 0) matches canonical exactly while the real device still
 * clears the status bar and home indicator.
 */

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { X, ChevronRight, LogOut, Settings } from "lucide-react"
import { useAuthStore } from "@/stores/authStore"
import { ApprovedRasterIcon } from "@/components/shotiq/Glyphs"
import { SIDEBAR_GROUPS, SIDEBAR_FOOTER, SIDEBAR_LEGAL, type IconType } from "@/components/shotiq/ShotIQShell"

/* ------------------------------------------------------------------ tokens */

const TOPBAR_H = 39      // 84px canonical = 38.7pt, incl. the 1px hairline
const GUTTER = 18        // 39px canonical = 18.0pt
const TABBAR_H = 61      // 132px canonical = 60.8pt, incl. the 1px hairline
/**
 * The icon BOX. The glyphs are drawn on the 24 grid the sidecars declare, but a
 * 24-grid drawing carries the family's optical margin, so at a 24px box the ink
 * measured 44 canonical px against canonical's 52. The box is sized so the INK
 * lands on canonical's 24.0pt: 24 x 52/44 = 28.4.
 */
const TAB_ICON = 28

/* ------------------------------------------------------------- tab glyphs */

/**
 * The five canonical tab glyphs, traced off the 3x zoom of the 018 tab strip
 * and drawn on the declared 24 grid. `active` only thickens the stroke to the
 * sidecars' activeStrokeWidth; colour is inherited so one rule owns it.
 */
function TabGlyph({ kind, active }: { kind: TabKey; active: boolean }) {
  const approved: Partial<Record<TabKey, string>> = {
    Home: "shotiq-approved-ui-target-reticle",
    Capture: "shotiq-approved-ui-pose-shooter",
    Train: "shotiq-approved-ui-ladder-balls",
    Progress: "shotiq-approved-ui-progress-line",
  }
  const approvedAsset = approved[kind]
  if (approvedAsset) {
    return <ApprovedRasterIcon asset={approvedAsset} size={TAB_ICON} className="block" />
  }
  const sw = active ? 2 : 1.7
  const common = {
    width: TAB_ICON, height: TAB_ICON, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: sw,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true, className: "block",
  }
  switch (kind) {
    // Four corner brackets around a filled centre dot.
    case "Home":
      return (
        <svg {...common}>
          <path d="M3.2 8.4V4.6a1.4 1.4 0 0 1 1.4-1.4h3.8M15.6 3.2h3.8a1.4 1.4 0 0 1 1.4 1.4v3.8M20.8 15.6v3.8a1.4 1.4 0 0 1-1.4 1.4h-3.8M8.4 20.8H4.6a1.4 1.4 0 0 1-1.4-1.4v-3.8" />
          <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
        </svg>
      )
    // Node graph: an upper-right node joined down-left to a mid node, and on
    // down-right to a lower node.
    case "Capture":
      return (
        <svg {...common}>
          <path d="M16.4 6.6 8.2 11.2M8.6 13.6l7.2 3.9" />
          <circle cx="18.3" cy="5.6" r="2.7" />
          <circle cx="6.1" cy="12.4" r="2.7" />
          <circle cx="18.1" cy="18.6" r="2.7" />
        </svg>
      )
    // Frame strip: a rectangle split into three cells by dashed dividers, with
    // alternating large and small sample dots along the middle.
    case "Train":
      return (
        <svg {...common}>
          <rect x="2.4" y="7" width="19.2" height="10" />
          <path d="M8.8 7v10M15.2 7v10" strokeDasharray="1.6 1.8" />
          <circle cx="5.6" cy="12" r="1.5" />
          <circle cx="8.8" cy="12" r="0.75" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="15.2" cy="12" r="0.75" />
          <circle cx="18.4" cy="12" r="1.5" />
        </svg>
      )
    // Gauge arc with a needle rising to the right, under a spray of sparks.
    case "Progress":
      return (
        <svg {...common}>
          <path d="M3.4 18.4a8.6 8.6 0 0 1 13.1-7.3" />
          <path d="M11.2 18.4 18.6 9.6" />
          <path d="M4.4 4.6v3M10.6 3.4v2.4M9.4 4.6h2.4M15.4 6.6l1.5 1.6M19.4 13.6l1.3.9M16.6 17.4l.6 1.6" />
        </svg>
      )
    // The avatar box: initials inside a bracketed square.
    case "Profile":
      return (
        <svg {...common}>
          <rect x="3.6" y="4.4" width="16.8" height="15.2" rx="1.2" />
          <text x="12" y="15.4" textAnchor="middle" fontSize="8.4" fontWeight="700"
                fill="currentColor" stroke="none"
                style={{ fontFamily: "var(--font-shotiq-inter), system-ui, sans-serif" }}>
            JE
          </text>
        </svg>
      )
  }
}

/* ------------------------------------------------------------ tab routing */

export type TabKey = "Home" | "Capture" | "Train" | "Progress" | "Profile"

/**
 * The five destinations, and which routes light each one.
 *
 * Derived from canonical, not assumed: 53 of the 72 renders carry the tab bar
 * and the active item was read back by sampling each column for orange ink.
 * Most renders default to Home, but every screen that disagrees pins the
 * mapping — 035-capture-review -> Capture, 054/056/058/060 (training) -> Train,
 * 063-goals -> Progress, 070-profile and 071-settings-hub -> Profile.
 */
const TABS: { key: TabKey; href: string; match: (p: string) => boolean }[] = [
  { key: "Home", href: "/dashboard",
    match: (p) => p === "/" || p.startsWith("/dashboard") || p.startsWith("/onboarding")
      || p.startsWith("/points") || p.startsWith("/badges") || p.startsWith("/guide") },
  { key: "Capture", href: "/analyze",
    match: (p) => p.startsWith("/analyze") || p.startsWith("/upload") || p.startsWith("/video-analysis")
      || p.startsWith("/media") || p.startsWith("/elite-shooters")
      || (p.startsWith("/results/") && !/\/(training|goals|history)(\/|$)/.test(p)) },
  { key: "Train", href: "/results/demo/training",
    match: (p) => p.startsWith("/training") || /\/training(\/|$)/.test(p) },
  { key: "Progress", href: "/results/demo/history",
    match: (p) => /\/(goals|history)(\/|$)/.test(p) },
  { key: "Profile", href: "/profile",
    match: (p) => p.startsWith("/profile") || p.startsWith("/settings") },
]

function activeTab(pathname: string): TabKey | null {
  // Train/Progress are subtrees of /results/demo, so they must be tested before
  // the broader Capture rule; TABS order does that.
  for (const t of ["Train", "Progress", "Profile", "Capture", "Home"] as TabKey[]) {
    const e = TABS.find((x) => x.key === t)!
    if (e.match(pathname)) return e.key
  }
  return null
}

/* ------------------------------------------------------------------ topbar */

/**
 * Canonical phone top bar: wordmark left, one action right, hairline under.
 * The right action opens the overflow sheet (canonical 020-profile-menu), whose
 * own top-right control is the X that closes it.
 */
export function PhoneTopBar({ onMenu, menuOpen }: { onMenu: () => void; menuOpen: boolean }) {
  return (
    <header
      data-testid="region-phone-topbar"
      className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-[var(--shotiq-color-rule)] bg-[var(--shotiq-color-paper)] md:hidden"
      style={{
        height: TOPBAR_H,
        paddingLeft: GUTTER,
        paddingRight: GUTTER,
        // Additive, so the 393x852 capture (insets 0) matches canonical while a
        // real notched device still clears the status bar.
        marginTop: "env(safe-area-inset-top)",
      }}
    >
      <Link href="/dashboard" className="shotiq-wordmark leading-none" style={{ fontSize: 18 }}>
        SHOT<span className="text-[var(--shotiq-color-shotiqOrange)]">IQ</span>
      </Link>
      <button
        type="button"
        onClick={onMenu}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        data-testid="phone-menu-button"
        className="-mr-[3px] flex h-[32px] w-[32px] items-center justify-center"
      >
        {/* Canonical 018 draws a gear here and canonical 020 - the sheet it
            opens - draws the X that closes it. Measured: canonical's mark inks
            43x42px; a 20px hamburger inked 28 and the gear at 24px inked 48, so
            the box is 21px. The -3px pull sets the ink gutter to canonical's 44. */}
        {menuOpen
          ? <X className="h-[21px] w-[21px]" strokeWidth={1.8} />
          : <Settings className="h-[21px] w-[21px]" strokeWidth={1.8} />}
      </button>
    </header>
  )
}

/* ----------------------------------------------------------- overflow sheet */

/**
 * Canonical 020-profile-menu. It carries exactly the destinations the five tabs
 * do not — and it reads them from the desktop sidebar's own arrays, so the two
 * platforms can never disagree about what exists. Tab destinations are filtered
 * out so the sheet is an overflow, not a duplicate.
 */
const TAB_HREFS = new Set(TABS.map((t) => t.href))

export function PhoneNavSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const pathname = usePathname() ?? ""
  if (!open) return null
  const go = (href: string) => { onClose(); router.push(href) }

  const row = ({ label, href, icon: Icon }: { label: string; href: string; icon: IconType }) => {
    const on = pathname === href || pathname.startsWith(href + "/")
    return (
      <button key={href + label} type="button" onClick={() => go(href)}
              aria-current={on ? "page" : undefined}
              className={`flex w-full items-center gap-[14px] border-b border-[var(--shotiq-color-rule)] py-[13px] text-left text-[15px] ${
                on ? "text-[var(--shotiq-color-shotiqOrange)]" : "text-[var(--shotiq-color-ink)]"}`}>
        <Icon className="h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
        <span className="flex-1 truncate">{label}</span>
        <ChevronRight className="h-[17px] w-[17px] shrink-0 text-[var(--shotiq-color-muted)]" />
      </button>
    )
  }

  return (
    <div data-testid="phone-nav-sheet"
         className="fixed inset-0 z-40 overflow-y-auto bg-[var(--shotiq-color-paper)] md:hidden"
         style={{ paddingTop: `calc(${TOPBAR_H}px + env(safe-area-inset-top))`,
                  paddingBottom: `calc(${TABBAR_H}px + env(safe-area-inset-bottom))` }}>
      <div style={{ paddingLeft: GUTTER, paddingRight: GUTTER }}>
        {SIDEBAR_GROUPS.map((g) => {
          const items = g.items.filter((i) => !TAB_HREFS.has(i.href))
          if (!items.length) return null
          return (
            <div key={g.heading} className="pt-[16px]">
              <div className="shotiq-microcaps pb-[6px] text-[var(--shotiq-color-graphite)]">{g.heading}</div>
              {items.map(row)}
            </div>
          )
        })}
        <div className="pt-[16px]">
          <div className="shotiq-microcaps pb-[6px] text-[var(--shotiq-color-graphite)]">ACCOUNT</div>
          {SIDEBAR_FOOTER.filter((i) => !TAB_HREFS.has(i.href)).map(row)}
          <button type="button"
                  onClick={async () => {
                    useAuthStore.getState().signOut()
                    try {
                      const { getCsrfToken } = await import("@/lib/api/csrfFetch")
                      await fetch("/api/auth/signout", {
                        method: "POST", credentials: "include",
                        headers: { "x-csrf-token": await getCsrfToken() },
                      })
                    } catch { /* cookie may already be gone */ }
                    window.location.assign("/signin")
                  }}
                  className="flex w-full items-center gap-[14px] py-[13px] text-left text-[15px] text-[var(--shotiq-color-reviewRed)]">
            <LogOut className="h-[20px] w-[20px] shrink-0" strokeWidth={1.6} />
            <span className="flex-1">Sign out</span>
          </button>
        </div>
        <div className="flex items-center gap-[16px] py-[18px] text-[13px] text-[var(--shotiq-color-graphite)]">
          {SIDEBAR_LEGAL.map((l) => (
            <button key={l.href} type="button" onClick={() => go(l.href)}>{l.label}</button>
          ))}
        </div>
      </div>
    </div>
  )
}

/* ----------------------------------------------------------------- tab bar */

/** The five-item bottom tab bar. Fixed to the bottom edge, above the sheet. */
export function PhoneTabBar() {
  const pathname = usePathname() ?? ""
  const on = activeTab(pathname)
  return (
    <nav data-testid="region-phone-tabbar" aria-label="Primary"
         className="fixed inset-x-0 bottom-0 z-50 flex border-t border-[var(--shotiq-color-rule)] bg-[var(--shotiq-color-paper)] md:hidden"
         style={{ height: TABBAR_H, paddingBottom: "env(safe-area-inset-bottom)" }}>
      {TABS.map((t) => {
        const active = t.key === on
        return (
          <Link key={t.key} href={t.href}
                aria-current={active ? "page" : undefined}
                data-tab={t.key}
                className={`flex flex-1 flex-col items-center justify-start ${
                  active
                    ? "text-[var(--shotiq-color-shotiqOrange)]"
                    : "text-[var(--shotiq-color-ink)]"}`}
                // Canonical puts 19px (8.8pt) between the hairline and the icon
                // INK. The 28px box carries ~10px of that above the ink itself,
                // so the padding supplies the remaining 9px: 4 CSS px.
                style={{ paddingTop: 4 }}>
            <TabGlyph kind={t.key} active={active} />
            {/* The 10px (4.6pt) canonical icon-to-label gap is already spent by
                the box margin under the glyph, so the label needs no extra top.
                Cap: 9.5px drew a 16px cap against canonical's 14 -> 8.5px. */}
            <span style={{ marginTop: 0, fontSize: 8.5, lineHeight: "10px" }}
                  className={active
                    ? "text-[var(--shotiq-color-shotiqOrange)]"
                    : "text-[var(--shotiq-color-graphite)]"}>
              {t.key}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

/* --------------------------------------------------------------- assembled */

/** Everything the phone shell adds, so ShotIQShell only gains one element. */
export function PhoneChrome() {
  const [menu, setMenu] = React.useState(false)
  const pathname = usePathname()
  // A navigation inside the sheet must not leave it open over the new screen.
  React.useEffect(() => { setMenu(false) }, [pathname])
  return (
    <>
      <PhoneTopBar menuOpen={menu} onMenu={() => setMenu((v) => !v)} />
      <PhoneNavSheet open={menu} onClose={() => setMenu(false)} />
      <PhoneTabBar />
    </>
  )
}

export const PHONE_CHROME = { TOPBAR_H, TABBAR_H, GUTTER, TAB_ICON }
