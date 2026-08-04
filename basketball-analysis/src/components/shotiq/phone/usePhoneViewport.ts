"use client"

import { useEffect, useState } from "react"

/**
 * True below the tablet breakpoint — the 393pt phone the 72 canonical iOS
 * renders were drawn for.
 *
 * `PhoneScreen` portals into `document.body`, so a `md:hidden` wrapper cannot
 * hide it: the portal subtree is not a descendant of the wrapper in the DOM and
 * never inherits its `display:none`. Every results-family route serves BOTH the
 * phone canonical and a graded 1440pt desktop screen, so the phone branch has
 * to be gated on the viewport itself. Matches Tailwind's `md` (768px).
 *
 * Returns false on the server and on the first client paint, so the desktop
 * tree is what hydrates and the phone screen mounts in an effect — the same
 * order `/onboarding` already uses.
 */
export function usePhoneViewport(query = "(max-width: 767px)"): boolean {
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const sync = () => setPhone(mq.matches)
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [query])
  return phone
}
