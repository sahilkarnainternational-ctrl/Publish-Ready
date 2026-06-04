import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig(async ({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const rawPort = process.env.PORT || env.PORT || "4173";
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const basePath = process.env.BASE_PATH || env.BASE_PATH || "/";

  return {
    base: basePath,
    plugins: [
      react(),
      tailwindcss(),
      runtimeErrorOverlay(),
      ...(process.env.NODE_ENV !== "production" &&
      process.env.REPL_ID !== undefined
        ? [
            await import("@replit/vite-plugin-cartographer").then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, ".."),
              }),
            ),
            await import("@replit/vite-plugin-dev-banner").then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "src"),
        "@assets": path.resolve(import.meta.dirname, "..", "..", "attached_assets"),
      },
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, "dist/public"),
      emptyOutDir: true,
      chunkSizeWarningLimit: 2500,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            const p = id.toLowerCase();
            if (p.includes('/react-dom/') || p.includes('/react/')) return 'react';
            if (p.includes('firebase')) return 'firebase';
            if (p.includes('mermaid')) return 'mermaid';
            if (p.includes('cytoscape')) return 'cytoscape';
            if (p.includes('recharts')) return 'charts';
            if (p.includes('motion')) return 'motion';
            if (p.includes('react-markdown') || p.includes('remark-') || p.includes('rehype-') || p.includes('katex')) return 'markdown';
            if (p.includes('@react-three') || p.includes('three')) return 'three';
            if (p.includes('react-day-picker')) return 'calendar';
            if (p.includes('lucide-react') || p.includes('react-icons')) return 'icons';
            if (p.includes('axios')) return 'axios';
            return undefined;
          },
        },
      },
    },
    server: {
      port,
      strictPort: true,
      host: "0.0.0.0",
      allowedHosts: true,
      proxy: {
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
        },
      },
      fs: {
        strict: true,
        allow: [
          path.resolve(import.meta.dirname),
          path.resolve(import.meta.dirname, "..", ".."),
        ],
      },
    },
    preview: {
      port,
      host: "0.0.0.0",
      allowedHosts: true,
    },
  };
});
