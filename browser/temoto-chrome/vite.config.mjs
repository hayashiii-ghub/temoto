import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  build: {
    outDir: "dist/client",
    rollupOptions: {
      input: {
        popup: resolve(import.meta.dirname, "index.html"),
        capture: resolve(import.meta.dirname, "capture.html"),
      },
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    fs: { allow: [import.meta.dirname, resolve(import.meta.dirname, "../shared")] },
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react()],
});
