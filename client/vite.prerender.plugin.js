import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import { buildPage, esc, notFoundPage } from './src/prerender/page.js'

// Runs after the client build and writes:
//
// - .prerender/render.mjs: src/prerender/render.jsx compiled for Node. Used
//   below, and by api/render.js for product and listing pages (Vercel bundles
//   functions after the build, so it's there for them).
// - dist/404.html: the app, marked noindex. Vercel answers any URL that
//   matches no rewrite in vercel.json with it and a real 404 status, so the
//   visitor still gets the friendly Not Found page while crawlers get the code.
// - dist/app.html: the bare app, for routes with nothing to prerender (cart,
//   login, search, …). vercel.json rewrites those to it.
// - dist/index.html and dist/<path>/index.html for the home, info, location
//   and blog pages, rendered by render.jsx (see src/prerender/page.js).
// - dist/rss.xml: the blog feed.

const SITE_URL = 'https://www.gpsfdk.com'
const BLOG_URL = `${SITE_URL}/blog`

const rssDate = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString()

const renderRss = (posts, description) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>The GPSFDK Blog</title>
<link>${BLOG_URL}</link>
<description>${esc(description)}</description>
<language>en-in</language>
<lastBuildDate>${rssDate(posts[0].updated || posts[0].date)}</lastBuildDate>
<atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
${posts
  .map(
    (post) => `<item>
<title>${esc(post.title)}</title>
<link>${BLOG_URL}/${post.slug}</link>
<guid isPermaLink="true">${BLOG_URL}/${post.slug}</guid>
<pubDate>${rssDate(post.date)}</pubDate>
<category>${esc(post.category)}</category>
<description>${esc(post.excerpt)}</description>
</item>`,
  )
  .join('\n')}
</channel>
</rss>
`

export default function prerender() {
  let root
  return {
    name: 'prerender',
    apply: 'build',
    configResolved(config) {
      root = config.root
    },
    async writeBundle(options) {
      const dir = resolve(root, options.dir || 'dist')
      const shell = await readFile(join(dir, 'index.html'), 'utf8')
      await writeFile(join(dir, '404.html'), notFoundPage(shell))
      await writeFile(join(dir, 'app.html'), shell)

      // Asset imports resolve to the same hashed files the client build wrote
      const ssrDir = join(root, '.prerender')
      await build({
        configFile: false,
        root,
        logLevel: 'warn',
        // Only the renderer: no copy of public/
        publicDir: false,
        plugins: [react()],
        build: {
          ssr: 'src/prerender/render.jsx',
          outDir: ssrDir,
          emptyOutDir: true,
          minify: false,
          rollupOptions: { output: { entryFileNames: 'render.mjs' } },
        },
      })
      const { render, prerenderPaths, blogPosts, BLOG_LIST_DESCRIPTION } = await import(
        `${pathToFileURL(join(ssrDir, 'render.mjs')).href}?t=${Date.now()}`
      )

      const paths = prerenderPaths()
      for (const path of paths) {
        const file = path === '/' ? 'index.html' : `${path.slice(1)}/index.html`
        await mkdir(dirname(join(dir, file)), { recursive: true })
        await writeFile(join(dir, file), buildPage(shell, path, render(path)))
      }

      await writeFile(join(dir, 'rss.xml'), renderRss(blogPosts(), BLOG_LIST_DESCRIPTION))
      console.log(`[prerender] wrote ${paths.length} pages, app.html, 404.html and rss.xml`)
    },
  }
}
