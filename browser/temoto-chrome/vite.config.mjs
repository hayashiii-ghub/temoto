import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "index.html"),
        sidepanel: resolve(import.meta.dirname, "sidepanel.html"),
        capture: resolve(import.meta.dirname, "capture.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react()],
});
