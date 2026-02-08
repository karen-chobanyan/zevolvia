import { defineConfig, devices } from "@playwright/test";
import { loadTestEnvironment } from "./e2e/utils/env";

const env = loadTestEnvironment(process.cwd());
const baseURL = env.BASE_URL ?? "http://127.0.0.1:3000";
const apiURL = env.NEXT_PUBLIC_API_URL ?? `${baseURL}/api`;

export default defineConfig({
  testDir: "./e2e/tests",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  outputDir: "test-results/artifacts",
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: baseURL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiURL,
      NODE_ENV: "test",
    },
  },
});
