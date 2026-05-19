import { defineConfig, devices } from '@playwright/test';

const port = Number(process.env.ARTIFACTS_E2E_PORT || process.env.ARTIFACTS_PORT || 4173);
const host = process.env.ARTIFACTS_E2E_HOST || '127.0.0.1';
const baseURL = process.env.ARTIFACTS_BASE_URL || `http://${host}:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 7_500 },
  fullyParallel: true,
  reporter: [['list']],
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: process.env.ARTIFACTS_SKIP_WEBSERVER
    ? undefined
    : {
        command: `python3 -m http.server ${port} --bind ${host}`,
        url: baseURL,
        reuseExistingServer: true,
        timeout: 10_000,
      },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
