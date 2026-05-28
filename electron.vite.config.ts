import { resolve } from "node:path"
import { defineConfig, externalizeDepsPlugin } from "electron-vite"
import vue from "@vitejs/plugin-vue"

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared")
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared")
      }
    }
  },
  renderer: {
    root: ".",
    plugins: [vue()],
    resolve: {
      alias: {
        "@shared": resolve("src/shared"),
        "@renderer": resolve("src/renderer")
      }
    },
    build: {
      rollupOptions: {
        input: {
          operator: resolve("index.html"),
          scoreboard: resolve("scoreboard.html")
        }
      }
    }
  }
})
