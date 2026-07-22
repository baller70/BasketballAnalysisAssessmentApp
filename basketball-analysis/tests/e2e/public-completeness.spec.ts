import { expect, test, type Page } from '@playwright/test'

const publicRoutes = [
  '/signin',
  '/signup',
  '/forgot-password',
  '/results/demo',
  '/badges',
  '/elite-shooters',
  '/guide',
  '/points',
]

function failOnBrowserErrors(page: Page) {
  const errors: string[] = []
  page.on('console', (message) => {
    // Chromium reports HTTP/resource failures as console messages before the
    // app can render its intentional signed-out/fallback state. Application
    // console.error calls and uncaught page errors remain release failures.
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) {
      errors.push(message.text())
    }
  })
  page.on('pageerror', (error) => errors.push(error.message))
  return () => expect(errors, `browser errors: ${errors.join('\n')}`).toEqual([])
}

for (const route of publicRoutes) {
  test(`${route} renders without browser errors`, async ({ page }) => {
    const assertNoErrors = failOnBrowserErrors(page)
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
    expect(response?.status()).toBe(200)
    await expect(page.locator('body')).toBeVisible()
    assertNoErrors()
  })
}

test('fresh results show an honest empty state without fabricated comparisons', async ({ page }) => {
  await page.goto('/results/demo', { waitUntil: 'domcontentloaded' })
  await expect(page.getByTestId('analysis-empty-state')).toBeVisible()
  await expect(page.getByTestId('elite-comparisons')).toHaveCount(0)
  for (const player of ['Kyle Korver', 'Ray Allen', 'Klay Thompson', 'Devin Booker']) {
    await expect(page.getByText(player, { exact: true })).toHaveCount(0)
  }
})

test('sign-in validates required fields and exposes recovery/navigation paths', async ({ page }) => {
  await page.goto('/signin')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page.locator('input[type="email"]')).toBeFocused()
  await expect(page.getByRole('link', { name: /forgot password/i })).toHaveAttribute('href', '/forgot-password')
  await expect(page.getByRole('link', { name: /create account/i })).toHaveAttribute('href', '/signup')
})

test('protected pages preserve the requested destination', async ({ page }) => {
  await page.goto('/profile')
  await expect(page).toHaveURL(/\/signin\?from=%2Fprofile$/)
})
