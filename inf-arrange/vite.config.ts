import { URL, fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    target: "es2022",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react") || id.includes("react-dom")) return "vendor-react";
          if (id.includes("@mantine")) return "vendor-mantine";
          if (id.includes("d3-")) return "vendor-d3";
          if (id.includes("zustand") || id.includes("nanoid") || id.includes("lodash-es")) {
            return "vendor-state-utils";
          }
          return "vendor-misc";
        },
      },
    },
  },
});
