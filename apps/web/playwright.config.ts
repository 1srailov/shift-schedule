import { defineConfig } from "@playwright/test";

/**
 * E2E against a running stack (API + web). Locally:
 *   E2E_URL=http://localhost:3010 bun run --cwd apps/web test:e2e
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  use: {
    baseURL: process.env.E2E_URL ?? "http://localhost:3010",
    viewport: { width: 1700, height: 1024 },
    channel: process.env.CI ? undefined : "chrome",
    trace: "retain-on-failure",
  },
});
