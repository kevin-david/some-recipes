import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { execSync } from "child_process";

const gitHash = execSync("git rev-parse --short HEAD").toString().trim();

export default defineConfig({
  define: {
    __GIT_HASH__: JSON.stringify(gitHash),
  },
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8788",
        changeOrigin: true,
      },
    },
  },
});
