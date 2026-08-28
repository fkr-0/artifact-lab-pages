import { defineConfig, devices } from '@playwright/test'

const e2ePort = Number.parseInt(process.env.GIT_RECIPE_BOOK_E2E_PORT ?? '45173', 10)
if (!Number.isInteger(e2ePort) || e2ePort < 1024 || e2ePort > 65535) {
  throw new Error('GIT_RECIPE_BOOK_E2E_PORT must be an integer between 1024 and 65535')
}
const e2eBaseURL = `http://127.0.0.1:${e2ePort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: e2eBaseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `pnpm exec vite --host 127.0.0.1 --port ${e2ePort} --strictPort`,
    url: e2eBaseURL,
    reuseExistingServer: false,
  },
})
