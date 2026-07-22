import { defineConfig, devices } from '@playwright/test'
import { existsSync } from 'node:fs'

const systemChromium = '/usr/local/bin/chromium'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: existsSync(systemChromium) ? { executablePath: systemChromium } : {},
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium' } },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://127.0.0.1:3000/signin',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
