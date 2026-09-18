import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.js"],
    exclude: ["node_modules/**"],
    globalSetup: ["./test/globalSetup.js"],
    testTimeout: 20000,
    hookTimeout: 60000,
  },
});
