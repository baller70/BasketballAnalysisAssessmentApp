"use client"

/** /badges — canonical 095 unifies badges + points; this route serves the
 *  same achievements view directly (the e2e contract requires HTTP 200 here). */

import AchievementsPointsPage from "../points/page"

export default function BadgesPage() {
  return <AchievementsPointsPage />
}
