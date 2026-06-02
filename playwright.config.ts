import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './test/e2e/specs',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:3030',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'zh-TW',
    viewport: { width: 430, height: 800 },
  },
  outputDir: 'test/e2e/test-results',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 800 } },
    },
  ],
  webServer: {
    command: 'npx nuxt dev --port 3030',
    url: 'http://localhost:3030',
    reuseExistingServer: false,
    timeout: 120000,
  },
})
