import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import injectStaticSitemap from './vite.seo.plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), injectStaticSitemap()],
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
