import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://127.0.0.1:4174', trace: 'on-first-retry', screenshot: 'only-on-failure' },
  webServer: { command: 'pnpm preview --host 127.0.0.1 --port 4174', port: 4174, reuseExistingServer: false },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
