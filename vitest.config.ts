import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/__tests__/**/*.test.ts"],
    environment: "node",
    pool: "forks",
    testTimeout: 30000,
    // Every test file gets a private HOME and cache root: no test may touch the real user's cache.
    setupFiles: ["src/__tests__/helpers/setup-home.ts"],
  },
});
