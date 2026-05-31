import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname, "artifacts/axyomis"), "");
  return {
    base: "/",
    plugins: [react(), tailwindcss()],
    define: {
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY || ""),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "artifacts/axyomis/src"),
        "@assets": path.resolve(__dirname, "attached_assets"),
      },
      // Prefer TypeScript sources over stale compiled .js artifacts in src/
      extensions: [".tsx", ".ts", ".jsx", ".js", ".json"],
      dedupe: ["react", "react-dom"],
    },
    root: path.resolve(__dirname, "artifacts/axyomis"),
    build: {
      outDir: path.resolve(__dirname, "artifacts/axyomis/dist/public"),
      emptyOutDir: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
            charts: ["recharts"],
          },
        },
      },
    },
    server: {
      port: 3000,
      strictPort: true,
      host: "0.0.0.0",
    },
    preview: {
      port: 3000,
      host: "0.0.0.0",
    },
  };
});
