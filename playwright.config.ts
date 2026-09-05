import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/browser-" + Date.now(),
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: "list",
  use: { baseURL: "http://localhost:3100", trace: "retain-on-failure", screenshot: "only-on-failure" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], channel: "chrome" } }],
  webServer: {
    command: "npm run start -- --port 3100",
    url: "http://localhost:3100/login",
    reuseExistingServer: false,
    timeout: 120_000,
    env: { DEMO_MODE: "true", VERCEL: "", NEXTAUTH_URL: "http://localhost:3100", NEXTAUTH_SECRET: "e2e-only-secret-with-at-least-32-characters", SUPERVISOR_EMAIL: "test@example.test", SUPERVISOR_PASSWORD: "test-only-password", DEMO_DATA_DIR: path.resolve("test-results", "e2e-data-" + Date.now()) },
  },
});
