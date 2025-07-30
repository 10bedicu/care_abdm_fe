import { defineConfig } from "vite";
import federation from "@originjs/vite-plugin-federation";
import path from "path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    federation({
      name: "care_abdm",
      filename: "remoteEntry.js",
      exposes: {
        "./manifest": "./src/manifest.ts",
      },
      shared: [
        "react",
        "react-dom",
        "react-i18next",
        "@tanstack/react-query",
        "raviger",
      ],
    }),
    tailwindcss(),
    react(),
  ],
  build: {
    target: "esnext",
    minify: false,
    cssCodeSplit: false,
    modulePreload: {
      polyfill: false,
    },
    rollupOptions: {
      external: [],
      input: {
        main: "./src/index.ts",
      },
      output: {
        format: "esm",
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
      },
    },
  },
  preview: {
    port: 5173,
    allowedHosts: true,
    host: "0.0.0.0",
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  envPrefix: "REACT_",
});
