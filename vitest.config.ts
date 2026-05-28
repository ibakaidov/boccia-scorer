import { resolve } from "node:path"
import { defineConfig } from "vitest/config"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@shared": resolve(__dirname, "src/shared"),
      "@renderer": resolve(__dirname, "src/renderer")
    }
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["tests/setup.ts"],
    include: ["tests/unit/**/*.spec.ts", "tests/component/**/*.spec.ts", "tests/main/**/*.spec.ts"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**", "release/**"]
  }
})
