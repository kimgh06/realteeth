import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";
import { fileURLToPath, URL } from "node:url";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        registerType: "autoUpdate",
        workbox: {
          skipWaiting: true,
          clientsClaim: true,
          runtimeCaching: [
            {
              urlPattern: /\/api\/owm\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "weather-api",
                expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
              },
            },
          ],
        },
        manifest: {
          name: "날씨",
          short_name: "날씨",
          description: "대한민국 날씨 정보 앱",
          theme_color: "#0d1b2a",
          background_color: "#0d1b2a",
          display: "standalone",
          start_url: "/",
          icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
            astronomy: ["astronomy-engine"],
          },
        },
      },
    },
    server: {
      host: '0.0.0.0',
      proxy: {
        "/api/owm": {
          target: "https://api.openweathermap.org",
          changeOrigin: true,
          rewrite: (path) => {
            const rewritten = path.replace(/^\/api\/owm/, "/data/2.5");
            const separator = rewritten.includes("?") ? "&" : "?";
            return `${rewritten}${separator}appid=${env.VITE_OWM_API_KEY}`;
          },
        },
        "/api/geo": {
          target: "https://api.openweathermap.org",
          changeOrigin: true,
          rewrite: (path) => {
            const rewritten = path.replace(/^\/api\/geo/, "/geo/1.0");
            const separator = rewritten.includes("?") ? "&" : "?";
            return `${rewritten}${separator}appid=${env.VITE_OWM_API_KEY}`;
          },
        },
      },
    },
  };
});
