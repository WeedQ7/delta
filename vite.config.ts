import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// The backend address is configurable via env (VITE_API_URL), never hardcoded in components.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const target = env.VITE_API_URL || "http://localhost:3001";
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/audio": { target, changeOrigin: true },
      },
    },
    preview: {
      port: 4173,
      host: true,
      proxy: {
        "/api": { target, changeOrigin: true },
        "/audio": { target, changeOrigin: true },
      },
    },
  };
});
