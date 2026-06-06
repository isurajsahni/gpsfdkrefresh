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
    // ─── Module preload tuning ───
    // Vite's default polyfill iterates every `<link rel="modulepreload">` tag
    // and programmatically triggers the fetch. With ~30 route-level lazy()
    // imports in App.jsx, the polyfill stampedes the browser with chunks the
    // user will never visit, producing thousands of Chrome warnings:
    //   "The resource ... was preloaded using link preload but not used
    //    within a few seconds from the window's load event."
    // All evergreen browsers we support ship native modulepreload, so the
    // polyfill is dead weight. We keep the `<link>` tags (cheap, native, and
    // only emitted for the entry's STATIC graph) but turn off the polyfill.
    modulePreload: {
      polyfill: false,
    },
  },
})
