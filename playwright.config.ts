import { defineConfig, devices } from '@playwright/test';

// Set PLAYWRIGHT_BASE_URL to run the suite against a deployed instance (e.g. the Railway
// prod URL) instead of a local dev server. When set, we do NOT spin up a local webServer.
const REMOTE_BASE = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  // Serial: the E2E flows share ONE dev server + ONE in-memory SSE ticker store, so parallel
  // workers contaminate each other's ticker assertions (test-plan §1 calls for per-test data
  // isolation, which the shared store can't give). Serial keeps the signature loop deterministic.
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: REMOTE_BASE ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  // Skip the local dev server when targeting a remote deployment.
  webServer: REMOTE_BASE
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: { NEXT_PUBLIC_DEMO_MODE: 'true' },
      },
});
