import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import injectStaticSitemap from './vite.seo.plugin.js'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    injectStaticSitemap(),
    {
      name: 'mp4-no-cache',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url.includes('.mp4')) {
            res.setHeader('Cache-Control', 'no-store');
          }
          next();
        });
      },
    },
  ],
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
