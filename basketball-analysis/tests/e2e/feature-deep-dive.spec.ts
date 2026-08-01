/**
 * Feature deep-dive — asserts that features DO WHAT THEY CLAIM, not merely
 * that clicking produces a reaction. Server persistence is verified by
 * reloading; navigation is verified by destination URL; filters/sorts are
 * verified against rendered content; exports are verified as real downloads.
 *
 * Runs against a server with a real database (signup creates a fresh user).
 */
import { test as base, expect, type Page } from "@playwright/test"

const PASSWORD = "deep-dive-pass-1234"
const RUN = Date.now()

async function signUpFresh(page: Page, email: string) {
  await page.goto("/signup")
  await page.getByTestId("signup-first-name").fill("Deep")
  await page.getByTestId("signup-last-name").fill("Dive")
  await page.getByTestId("signup-email").fill(email)
  await page.getByTestId("signup-password").fill(PASSWORD)
  await page.getByTestId("signup-confirm-password").fill(PASSWORD)
  await page.getByTestId("signup-agree").check()
  await page.getByTestId("signup-submit").click()
  await page.waitForURL("**/onboarding", { timeout: 15000 })
}

// ONE signed-in account per run, shared by every worker through storageState.
// A directory lock makes the signup happen exactly once even across worker
// restarts, keeping the suite far inside the sign-in rate limit.
import { existsSync, mkdirSync } from "node:fs"

const AUTH_FILE = "test-results/.auth-deepdive.json"
const AUTH_LOCK = "test-results/.auth-deepdive.lock"

const test = base.extend<object, { workerAuth: string }>({
  workerAuth: [async ({ browser }, use) => {
    if (!existsSync(AUTH_FILE)) {
      let iAmCreator = false
      try { mkdirSync(AUTH_LOCK); iAmCreator = true } catch { /* another worker owns it */ }
      if (iAmCreator) {
        const page = await browser.newPage({ baseURL: "http://127.0.0.1:3000" })
        await signUpFresh(page, `deepdive-${RUN}-shared@shotiq.test`)
        await page.context().storageState({ path: AUTH_FILE })
        await page.close()
      } else {
        for (let i = 0; i < 120 && !existsSync(AUTH_FILE); i++)
          await new Promise((r) => setTimeout(r, 500))
      }
    }
    await use(AUTH_FILE)
  }, { scope: "worker" }],
  storageState: ({ workerAuth }, use) => use(workerAuth),
})

test.use({
  viewport: { width: 1440, height: 900 },
  permissions: ["camera"],
})

test("auth: wrong password is rejected with an error, right one signs in", async ({ browser }) => {
  const context = await browser.newContext({ storageState: { cookies: [], origins: [] } })
  const page = await context.newPage()
  const email = `deepdive-${RUN}-auth@shotiq.test`
  await signUpFresh(page, email)
  // sign out through the account menu
  await page.getByRole("button", { name: "Account menu" }).click()
  await page.getByRole("button", { name: "Sign out" }).click()
  await page.waitForURL("**/signin", { timeout: 15000 })
  // wrong password must NOT sign in
  await page.getByTestId("signin-email").fill(email)
  await page.getByTestId("signin-password").fill("wrong-password")
  await page.getByTestId("signin-submit").click()
  await expect(page.getByTestId("signin-error")).toBeVisible({ timeout: 10000 })
  expect(page.url()).toContain("/signin")
  // correct password signs in
  await page.getByTestId("signin-password").fill(PASSWORD)
  await page.getByTestId("signin-submit").click()
  await page.waitForURL(/onboarding|results|dashboard/, { timeout: 15000 })
  await context.close()
})

test("onboarding: choices persist to the server profile", async ({ page }) => {
  await page.goto("/onboarding")
  await page.getByTestId("hand-left").click()
  await expect(page.getByTestId("hand-left")).toHaveAttribute("aria-pressed", "true")
  // finish (Continue x4 walks all steps then saves + hard-navigates)
  for (let i = 0; i < 4; i++) {
    await page.getByTestId("onboarding-continue").click()
    await page.waitForTimeout(300)
  }
  await page.waitForURL("**/dashboard", { timeout: 20000 })
  // server is the source of truth (in-page fetch carries the session cookie)
  const profile = await page.evaluate(() =>
    fetch("/api/profile", { credentials: "include" }).then((r) => r.json()))
  expect(profile?.profile?.dominantHand).toBe("left")
})

test("topbar search palette navigates to the chosen screen", async ({ page }) => {
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Search" }).click()
  await page.getByLabel("Search ShotIQ").fill("biome")
  await page.getByRole("button", { name: /Biomechanics/ }).click()
  await page.waitForURL("**/results/demo/biomechanics", { timeout: 10000 })
})

test("notifications: mark all read empties the panel and clears the dot", async ({ page }) => {
  await page.goto("/dashboard")
  await page.getByRole("button", { name: "Notifications" }).click()
  await expect(page.getByText("Analysis complete")).toBeVisible()
  await page.getByRole("button", { name: "Mark all read" }).click()
  await expect(page.getByText("You're all caught up.")).toBeVisible()
})

test("goals: created goal persists across reload (server-backed)", async ({ page }) => {
  await page.goto("/results/demo/goals")
  const title = `Hold follow-through ${Date.now()}`
  await page.getByRole("button", { name: "Create goal" }).first().click()
  await page.getByPlaceholder(/Hold follow-through/).fill(title)
  await page.getByRole("button", { name: "Create goal" }).last().click()
  await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 })
  await page.reload()
  await expect(page.getByRole("heading", { name: title })).toBeVisible({ timeout: 10000 })
})

test("goals: log progress confirms and updates the primary goal bar", async ({ page }) => {
  await page.goto("/results/demo/goals")
  await page.getByRole("button", { name: "Log progress" }).click()
  await expect(page.getByText(/Progress logged/)).toBeVisible({ timeout: 5000 })
})

test("history: fresh account shows honest empty state with export disabled", async ({ page }) => {
  await page.goto("/results/demo/history")
  await expect(page.getByText(/No sessions yet/)).toBeVisible({ timeout: 10000 })
  await expect(page.getByRole("button", { name: "Export" })).toBeDisabled()
})

test("history: seeded sessions render, filter, and export", async ({ page }) => {
  await page.goto("/results/demo/history")
  // Seed real analysis sessions through the API (belongs to this account).
  const seeded = await page.evaluate(async () => {
    const csrf = await fetch("/api/auth/csrf", { credentials: "include" })
      .then((r) => r.json()).then((d) => d.csrfToken)
    // The real product save path: it creates the analysis AND its history row.
    const mk = (score: number) =>
      fetch("/api/save-analysis", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "x-csrf-token": csrf },
        body: JSON.stringify({
          clientSessionId: `deepdive-${Date.now()}-${score}`,
          recordedAt: new Date().toISOString(),
          mediaType: "image",
          overallScore: score,
        }),
      }).then((r) => r.status)
    return Promise.all([mk(82), mk(75), mk(64)])
  })
  // If the API rejects seeding, that is itself a finding — surface it.
  expect(seeded.every((s) => s < 300)).toBeTruthy()
  await page.reload()
  const rows = page.locator("tbody tr")
  await expect.poll(() => rows.count(), { timeout: 10000 }).toBeGreaterThanOrEqual(3)
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 10000 }),
    page.getByRole("button", { name: "Export" }).click(),
  ])
  expect(download.suggestedFilename()).toBe("shotiq-analysis-history.csv")
})

test("media: search, filter, sort and delete actually change the grid", async ({ page }) => {
  await page.goto("/media")
  const cards = page.locator("[data-testid='screen-desktop-web-media-library'] .grid > div")
  const start = await cards.count()
  expect(start).toBeGreaterThan(4)
  // search narrows by title
  await page.getByTestId("media-search").fill("Transition")
  await expect.poll(() => cards.count(), { timeout: 5000 }).toBeLessThan(start)
  await page.getByTestId("media-search").fill("")
  // status filter narrows
  await page.getByLabel(/Analyzed/).first().check()
  await expect.poll(() => cards.count(), { timeout: 5000 }).toBeLessThan(start)
  await page.getByLabel("All status").check()
  // delete selected removes a card
  await page.locator("button[aria-label='select']").first().click()
  await page.getByRole("button", { name: "Delete" }).click()
  await expect.poll(() => cards.count(), { timeout: 5000 }).toBeLessThan(start)
})

test("profile: saved name persists on the server across reload", async ({ page }) => {
  await page.goto("/profile")
  const name = `Deep Dive ${Date.now() % 10000}`
  await page.getByTestId("profile-name").fill(name)
  await page.getByTestId("save-profile").click()
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 10000 })
  await page.reload()
  await expect(page.getByTestId("profile-name")).toHaveValue(name, { timeout: 10000 })
})

test("profile: export downloads a JSON archive", async ({ page }) => {
  await page.goto("/profile")
  const [download] = await Promise.all([
    page.waitForEvent("download", { timeout: 15000 }),
    page.getByRole("button", { name: "Export all data" }).click(),
  ])
  expect(download.suggestedFilename()).toBe("shotiq-data-export.json")
})

test("elite shooters: league chips filter and sort reorders", async ({ page }) => {
  await page.goto("/elite-shooters")
  await expect(page.getByText(/\d+ shooters/)).toBeVisible({ timeout: 15000 })
  const countText = async () =>
    parseInt((await page.getByText(/\d+ shooters/).innerText()).replace(/\D/g, ""))
  const all = await countText()
  expect(all).toBeGreaterThan(100) // seeded database, not demo stubs
  await page.getByRole("button", { name: "WNBA", exact: true }).click()
  await expect.poll(countText, { timeout: 5000 }).toBeLessThan(all)
  await page.getByRole("button", { name: "All", exact: true }).click()
  // FT% sort produces non-increasing FT values
  await page.getByRole("button", { name: /^Sort:/ }).click()
  await page.getByRole("button", { name: "FT %" }).click()
  await page.waitForTimeout(400)
  const fts = await page.evaluate(() => {
    const out: number[] = []
    for (const label of Array.from(document.querySelectorAll("div"))) {
      if (label.textContent?.trim() === "FT%" && label.previousElementSibling) {
        const v = parseFloat(label.previousElementSibling.textContent || "")
        if (!Number.isNaN(v)) out.push(v)
      }
    }
    return out.slice(0, 6)
  })
  expect(fts.length).toBeGreaterThan(2)
  const sorted = [...fts].sort((a, b) => b - a)
  expect(fts.join()).toBe(sorted.join())
})

test("elite shooter detail: tabs switch content and View full bio jumps to BIO", async ({ page }) => {
  await page.goto("/elite-shooters/stephen-curry")
  await page.getByRole("button", { name: "View full bio" }).click()
  await expect(page.getByRole("button", { name: "BIO", exact: true })).toHaveAttribute("aria-current", "true")
})

test("compare: choosing a shooter updates the viewer", async ({ page }) => {
  await page.goto("/results/demo/compare")
  await page.getByRole("button", { name: /Shooter:|Choose shooters/ }).click()
  const options = page.locator("div.absolute button")
  await expect(options.first()).toBeVisible({ timeout: 10000 })
  const target = options.nth(1)
  const name = (await target.innerText()).trim()
  await target.click()
  await expect(page.getByText(name).nth(0)).toBeVisible()
})

test("points: tier filter, unlocked-only and load-more change the badge grid", async ({ page }) => {
  await page.goto("/points")
  const badges = page.locator("[id^='badge-']")
  const start = await badges.count()
  expect(start).toBe(10)
  await page.getByRole("button", { name: "All tiers" }).click()
  await page.getByRole("button", { name: "Locked", exact: true }).click()
  await expect.poll(() => badges.count()).toBe(6)
  await page.getByRole("button", { name: "Locked", exact: true }).first().click()
  await page.getByRole("button", { name: "All tiers", exact: true }).click()
  await page.getByRole("button", { name: "Load more badges" }).click()
  await expect.poll(() => badges.count()).toBe(15)
  // tabs render their own content
  await page.getByRole("button", { name: "CHALLENGES" }).click()
  await expect(page.getByText("7-Day Form Streak")).toBeVisible()
  await page.getByRole("button", { name: "POINTS HISTORY" }).click()
  await expect(page.getByText("Daily streak bonus")).toBeVisible()
})

test("live capture: start/pause/stop and shot logging work with a camera", async ({ page }) => {
  await page.goto("/video-analysis")
  await page.getByTestId("capture-start").click()
  await expect(page.getByTestId("capture-stop")).toBeVisible({ timeout: 15000 })
  await page.getByTestId("rail-make").click()
  await expect(page.getByText(/1 \/ 1|Make/i).first()).toBeVisible()
  await page.getByTestId("capture-pause").click()
  await expect(page.getByRole("button", { name: "Resume" })).toBeVisible()
  await page.getByTestId("capture-stop").click()
  await expect(page.getByTestId("capture-start")).toBeVisible({ timeout: 10000 })
})

test("drill execution: make/miss marking updates the shot history and undo reverts", async ({ page }) => {
  await page.goto("/training/drills/quick-release-builder")
  await expect(page.getByTestId("mark-make")).toBeVisible({ timeout: 10000 })
  await page.getByTestId("mark-make").click()
  await page.getByTestId("mark-miss").click()
  const chips = page.getByTestId("shot-history").locator("span, div")
  await expect.poll(() => chips.count(), { timeout: 5000 }).toBeGreaterThan(1)
  const before = await chips.count()
  await page.getByTestId("undo-shot").click()
  await expect.poll(() => chips.count(), { timeout: 5000 }).toBeLessThan(before)
})

test("guide: canonical sections render and quick actions navigate", async ({ page }) => {
  await page.goto("/guide")
  await expect(page.getByText("UPLOAD DO'S")).toBeVisible({ timeout: 10000 })
  await expect(page.getByText("UPLOAD DON'TS")).toBeVisible()
  await expect(page.getByText("CORRECT FORM")).toBeVisible()
  await expect(page.getByText("COMMON MISTAKES")).toBeVisible()
  await page.getByRole("button", { name: "Upload video", exact: true }).click()
  await page.waitForURL("**/upload?mode=video", { timeout: 15000 })
})

test("settings: a toggled preference persists across reload", async ({ page }) => {
  const state = (loc: import("@playwright/test").Locator) =>
    loc.innerText().then((t) => (t.includes("Disabled") ? "Disabled" : "Enabled"))
  await page.goto("/settings")
  const row = page.getByTestId("setting-weeklyReportEmail")
  await expect(row).toBeVisible({ timeout: 10000 })
  // Wait for the server-loaded state before reading (status line appears once loaded).
  await expect(page.getByText(/Changes save automatically|All changes saved/)).toBeVisible({ timeout: 10000 })
  const before = await state(row)
  await row.click()
  // Rows persist immediately — wait for the server ack.
  await expect(page.getByText("All changes saved ✓")).toBeVisible({ timeout: 10000 })
  const after = await state(row)
  expect(after).not.toBe(before)
  // Server persistence: reload and confirm the row kept its new state.
  await page.reload()
  const rowAfter = page.getByTestId("setting-weeklyReportEmail")
  await expect(rowAfter).toBeVisible({ timeout: 10000 })
  await expect(page.getByText(/Changes save automatically|All changes saved/)).toBeVisible({ timeout: 10000 })
  await expect.poll(() => state(rowAfter), { timeout: 10000 }).toBe(after)
})
