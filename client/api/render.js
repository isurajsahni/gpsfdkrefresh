import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { buildPage, notFoundPage } from '../src/prerender/page.js'

// Server-rendered HTML for product and listing pages (/product/<slug>,
// /wall-canvas/<collection>, /house-nameplates), which vercel.json rewrites
// here as /api/render?path=<path>.
//
// The app renders pages in the browser, so without this their raw HTML was
// the bare app under the homepage's title: no canonical, no H1, no content for
// crawlers. This fetches the data the page itself would load (read-only GETs
// to the public catalogue API) and renders the real page with it
// (src/prerender/render.jsx, compiled by the build to .prerender/render.mjs).
//
// - The API says the product / category doesn't exist: a real 404, noindex.
// - The API is slow, rate-limiting or down: the bare app, uncached, with no
//   robots tag. The page then loads in the browser as before; a temporary
//   failure never tells search engines the page is gone.
// - Otherwise the rendered page, cached at Vercel's edge for 10 minutes and
//   served stale for up to a day while it refreshes. A new deployment starts
//   with an empty cache.

const API = (process.env.SEO_API_URL || 'https://gpsfdkrefresh.onrender.com/api').replace(/\/+$/, '')
const API_TIMEOUT_MS = 4000
const CACHE_PAGE = 'public, max-age=0, s-maxage=600, stale-while-revalidate=86400'
const CACHE_404 = 'public, max-age=0, s-maxage=300'

// dist/app.html is included with the function (vercel.json includeFiles);
// .prerender/render.mjs is found by Vercel tracing the import below
let shellPromise
const readShell = (req) => {
  shellPromise ||= readFile(join(process.cwd(), 'dist/app.html'), 'utf8').catch(async () => {
    // Fallback: the deployment's own copy. Forward the visitor's cookie so a
    // protected preview deployment lets the request through.
    const res = await fetch(`https://${req.headers.host}/app.html`, { headers: { cookie: req.headers.cookie || '' } })
    if (!res.ok) throw new Error(`app.html: ${res.status}`)
    return res.text()
  })
  return shellPromise.catch((err) => {
    shellPromise = undefined
    throw err
  })
}

const getJson = async ({ url, params }) => {
  const target = new URL(API + url)
  for (const [key, value] of Object.entries(params || {})) target.searchParams.set(key, String(value))
  const res = await fetch(target, {
    headers: {
      accept: 'application/json',
      // Lets these requests past the API's catalogue rate limit
      ...(process.env.SEO_RENDER_KEY ? { 'x-seo-render-key': process.env.SEO_RENDER_KEY } : {}),
    },
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  })
  if (res.status === 404) return { notFound: true }
  if (!res.ok) throw new Error(`API ${res.status} for ${target.pathname}`)
  return { data: await res.json() }
}

const send = (res, status, html, cacheControl) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', cacheControl)
  res.end(html)
}

export default async function handler(req, res) {
  const query = new URL(req.url, 'http://localhost').searchParams
  const path = query.get('path') || ''
  const page = query.get('page')
  const search = page ? `?page=${encodeURIComponent(page)}` : ''

  let shell
  try {
    shell = await readShell(req)
  } catch (err) {
    console.error('[render] no app shell', err)
    res.statusCode = 503
    res.setHeader('Cache-Control', 'no-store')
    return res.end('Service temporarily unavailable')
  }

  try {
    const ssr = await import('../.prerender/render.mjs')
    const requests = ssr.catalogueRequests(path, search)
    if (!requests) return send(res, 404, notFoundPage(shell), CACHE_404)

    const results = await Promise.all(requests.map(getJson))
    if (results.some((result, i) => result.notFound && requests[i].required)) {
      return send(res, 404, notFoundPage(shell), CACHE_404)
    }
    if (results.some((result) => result.notFound)) throw new Error(`API 404 for a listing of ${path}`)

    const data = Object.fromEntries(requests.map((request, i) => [request.key, results[i].data]))
    return send(res, 200, buildPage(shell, path, ssr.render(path + search, data)), CACHE_PAGE)
  } catch (err) {
    console.error(`[render] ${path}${search}: serving the bare app`, err)
    return send(res, 200, shell, 'no-store')
  }
}
