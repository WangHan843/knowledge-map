import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import {fileURLToPath,URL} from 'node:url';

export default defineConfig(({mode})=>({
  base: process.env.PAGES_BASE_PATH || '/',
  define: {'import.meta.env.VITE_DATA_MODE':JSON.stringify(mode==='server'?'server':'static')},
  resolve:{alias:{'#learning-adapter':fileURLToPath(new URL(mode==='server'?'./src/lib/server-api.ts':'./src/lib/static-api.ts',import.meta.url))}},
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": "http://127.0.0.1:8000" },
  },
  build: { target: "es2020", outDir:mode==='server'?'dist-server':'dist' },
}));
