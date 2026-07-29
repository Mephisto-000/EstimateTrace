import { defineConfig, devices } from "@playwright/test";

const port = 3100;
const externalBaseUrl = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseUrl ?? `http://127.0.0.1:${port}`;
const webServerOptions = externalBaseUrl
  ? {}
  : {
      webServer: {
        command: `./scripts/pnpm-local.sh start --port ${port}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
    };

const ciOptions = process.env.CI
  ? {
      forbidOnly: true,
      retries: 2,
      workers: 1,
      reporter: [["html", { open: "never" }] as const, ["list"] as const],
    }
  : {
      forbidOnly: false,
      retries: 0,
      reporter: "list" as const,
    };

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  ...ciOptions,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      use: { ...devices["Pixel 7"] },
    },
  ],
  ...webServerOptions,
});
