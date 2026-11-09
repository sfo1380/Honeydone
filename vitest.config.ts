import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside a React Server environment; tests run in plain Node.
      "server-only": path.resolve(__dirname, "tests/empty.ts"),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
  },
});
