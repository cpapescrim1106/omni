import { defineConfig } from "@playwright/test";
import { ensureTestDatabaseUrl } from "./tests/helpers/test-database";

const databaseUrl = ensureTestDatabaseUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
  },
  retries: 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4102",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "pnpm build && pnpm start -p 4102",
    url: "http://127.0.0.1:4102/scheduling",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
