import { defineConfig, devices } from "@playwright/test";

const launchOptions =
  process.platform === "linux"
    ? { executablePath: "/usr/bin/chromium", args: ["--no-sandbox"] }
    : { args: ["--no-sandbox"] };

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./output/playwright",
  webServer: {
    command: "npm run dev -- --port 4187",
    url: "http://127.0.0.1:4187",
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },
  use: {
    baseURL: "http://127.0.0.1:4187",
    browserName: "chromium",
    channel: process.platform === "linux" ? undefined : "chrome",
    launchOptions,
    trace: "on-first-retry",
    screenshot: "only-on-failure"
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 5"] } }
  ]
});
