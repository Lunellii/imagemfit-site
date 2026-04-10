import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import { fileURLToPath, URL } from "node:url";

const normalizeBasePath = (value) => {
  const trimmed = String(value || "").trim();
  if (!trimmed) return "/";
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
  }

  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith("/") ? withLeadingSlash : `${withLeadingSlash}/`;
};

export default defineConfig(({ mode }) => ({
  base: mode === "production" ? normalizeBasePath(loadEnv(mode, process.cwd(), "").VITE_BASE_PATH || "/") : "/",
  logLevel: "error",
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8787",
        changeOrigin: false
      }
    }
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  },
  plugins: [react()]
}));
