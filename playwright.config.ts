import { defineConfig, devices } from "@playwright/test";

const port = 3100;

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
    baseURL: `http://127.0.0.1:${port}`,
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
  webServer: {
    command: `./scripts/pnpm-local.sh start --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
