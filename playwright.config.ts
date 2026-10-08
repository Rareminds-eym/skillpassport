import { defineConfig, devices } from '@playwright/test';
import crypto from 'node:crypto';
import path from 'node:path';

// Local settings (see .env.e2e.example). Real environment variables win over the file.
try {
  process.loadEnvFile(path.resolve(process.cwd(), '.env.e2e'));
} catch {
  // The file is optional when the variables are already set.
}

// One run id and one password for the whole run. Playwright workers inherit them from this process.
process.env.E2E_RUN_ID ??= Date.now().toString(36);
// Meets the password rules (10-72 characters, 3 of 4 character types). Never printed or committed.
process.env.E2E_PASSWORD ??= `Aa1!${crypto.randomBytes(10).toString('hex')}`;

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  workers: 1, // one spec after another: login rate limits and shared local databases
  retries: 0, // a retry would add another login
  timeout: 120_000,
  expect: { timeout: 15_000 },
  // Screenshots and traces go in a subfolder: Playwright empties outputDir at the start of every run,
  // while test-results/e2e-run-<runId>.json (the run manifest used for cleanup) must survive.
  outputDir: 'test-results/artifacts',
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:8788',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    headless: !process.env.HEADED,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
