import { defineConfig } from "vite";
import reactRefresh from "@vitejs/plugin-react-refresh";
import tsconfigPaths from "vite-tsconfig-paths";
declare var process: any;

// https://vitejs.dev/config/
const backendUrl = process.env.BACKEND_URL || "http://localhost:8080";

export default defineConfig({
  plugins: [reactRefresh(), tsconfigPaths()],
  define: {
    "process.env.NODE_ENV": process.env.NODE_ENV,
  },
  server: {
    proxy: {
      "/api": backendUrl,
    },
  },
});
