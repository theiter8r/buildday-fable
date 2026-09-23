import { defineConfig, devices } from '@playwright/test'

/**
 * OpsFlow Playwright config (ARCHITECTURE.md §11). Chromium only, two
 * projects — `desktop` (1440x900) and `mobile` (390x844, isMobile,
 * hasTouch) — against the Vite preview server, with the `e2e=1` query
 * param baked into `baseURL` so every test opens with the test handle
 * installed (see `docs/testing-conventions.md`).
 */
const PORT = 4173
const baseURL = `http://localhost:${PORT}/?e2e=1`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
