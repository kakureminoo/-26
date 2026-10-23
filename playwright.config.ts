import { defineConfig } from '@playwright/test';
export default defineConfig({
  // Run graphics contexts sequentially to avoid GPU contention in CI and on laptops.
  workers: 1,
  testDir: './tests/browser',
  use: { baseURL: 'http://127.0.0.1:4173', launchOptions: { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH } },
  webServer: { command: 'npm run dev -- --port 4173 --strictPort', url: 'http://127.0.0.1:4173', reuseExistingServer: !process.env.CI },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1440, height: 900 } } },
    { name: 'portrait', use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: 'short-landscape', use: { viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true } },
  ],
});
