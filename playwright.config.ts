import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  globalSetup: "./tests/global-setup.ts",
  testDir: "./tests",
  fullyParallel: false,
  retries: 0,
  reporter: process.env.CI ? [["github"], ["html"]] : [["list"], ["html"]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    testIdAttribute: "data-testid",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: path.join(__dirname, ".auth/user.json"),
      },
      testMatch: "**/*.e2e.spec.ts",
    },
    {
      name: "api",
      testMatch: "**/*.api.spec.ts",
    },
    {
      name: "generated",
      testMatch: "tests/generated/**/*.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
