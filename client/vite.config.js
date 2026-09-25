import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import injectStaticSitemap from './vite.seo.plugin.js'

// Vercel answers any URL that matches no rewrite in vercel.json with
// dist/404.html and a real 404 status. Make that file the app itself, so the
// visitor still gets the friendly Not Found page (search, links) while
// crawlers get the status code. Marked noindex for bots that don't run JS.
const emitNotFoundPage = () => ({
  name: 'emit-404-page',
  apply: 'build',
  async writeBundle(options) {
    const dir = options.dir || 'dist'
    const html = await readFile(join(dir, 'index.html'), 'utf8')
    const notFound = html.replace(
      /<title data-static-seo>[^<]*<\/title>/,
      '<title data-static-seo>Page Not Found | GPSFDK</title>\n    <meta name="robots" content="noindex" data-static-seo />'
    )
    if (notFound === html) throw new Error('emit-404-page: <title data-static-seo> not found in index.html')
    await writeFile(join(dir, '404.html'), notFound)
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    injectStaticSitemap(),
    emitNotFoundPage(),
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
