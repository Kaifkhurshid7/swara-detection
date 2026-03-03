import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: "autoUpdate",
            manifest: {
                name: "Swaralipi Interactive",
                short_name: "Swaralipi",
                description: "Interactive Swaralipi OCR – detect swara symbols by cropping",
                theme_color: "#0f172a",
                background_color: "#0f172a",
                display: "standalone",
                orientation: "portrait",
                start_url: "/",
                icons: [
                    { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
                    { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
                ],
            },
            workbox: {
                globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            },
        }),
    ],
    server: {
        proxy: {
            "/api": {
                target: "http://127.0.0.1:8000",
                changeOrigin: true,
                rewrite: function (path) { return path.replace(/^\/api/, ""); },
            },
        },
    },
});
