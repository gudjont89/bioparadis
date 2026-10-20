import { defineConfig } from "vitest/config";
import preact from "@preact/preset-vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative base so the build works at any GitHub Pages path.
  base: "./",
  plugins: [
    preact(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Bíó Paradís",
        short_name: "Bíó Paradís",
        description: "Screening timeline for Bíó Paradís, Reykjavík",
        theme_color: "#08080D",
        background_color: "#08080D",
        display: "standalone",
        start_url: "./",
        scope: "./",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        // schedule.json is fetched network-first so it stays fresh but works offline.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith("/schedule.json"),
            handler: "NetworkFirst",
            options: { cacheName: "schedule", networkTimeoutSeconds: 4 },
          },
          {
            urlPattern: ({ url }) => url.hostname === "web.iceland.mycloudcinema.com",
            handler: "CacheFirst",
            options: {
              cacheName: "posters",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
