import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  base: "./",
  build: {
    chunkSizeWarningLimit: 11000
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg", "illustrations/lumi.svg"],
      manifest: {
        name: "英语星球",
        short_name: "英语星球",
        description: "移动端优先的英语学习 PWA",
        lang: "zh-CN",
        theme_color: "#fff8ef",
        background_color: "#fff8ef",
        display: "standalone",
        start_url: ".",
        icons: [
          {
            src: "icons/icon.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable"
          }
        ]
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,json,webmanifest}"],
        maximumFileSizeToCacheInBytes: 12 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
});
