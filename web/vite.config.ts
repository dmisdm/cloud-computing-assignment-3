import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import tsconfigPaths from "vite-tsconfig-paths";
const inject = require("@rollup/plugin-inject");
// https://vitejs.dev/config/
const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

export default defineConfig({
  plugins: [reactRefresh(), tsconfigPaths()],
  define:
    process.env.NODE_ENV !== "production"
      ? {
          "process.env.NODE_ENV": process.env.NODE_ENV,
        }
      : undefined,
  build: {
    rollupOptions: {
      plugins: [
        inject({
          process: "process",
        }),
      ],
    },
  },
  server: {
    proxy: {
      "/api": backendUrl,
    },
  },
});
