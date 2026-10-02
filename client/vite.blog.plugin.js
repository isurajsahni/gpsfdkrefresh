import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  BLOG_LIST_DESCRIPTION,
  BLOG_LIST_TITLE,
  BLOG_URL,
  RSS_URL,
  SITE_URL,
  blogImage,
  blogListSchema,
  blogPostSchema,
  blogSrcSet,
  extractHeadings,
  postSeoTitle,
  postUrl,
  sortByDate,
  stripLeadingTitle,
} from './src/content/blogs/blogShared.js'
import { esc, renderBlogListBody, renderBlogPostBody } from './src/content/blogs/blogStatic.js'
import { markdownComponents } from './src/content/blogs/markdownComponents.js'

// Prerenders the blog: writes dist/blog/index.html and
// dist/blog/<slug>/index.html (served for /blog and /blog/<slug> by rewrites
// in vercel.json), each the app's index.html with that page's title, meta,
// canonical, structured data and full content in place, plus dist/rss.xml.
// See src/content/blogs/blogStatic.js for why.

const BLOG_DIR = join(dirname(fileURLToPath(import.meta.url)), 'src/content/blogs')

// Load the blog registry as the app sees it, with each `?raw` markdown import
// inlined as a string, so the posts here can never drift from the app's.
const loadPosts = async () => {
  const source = readFileSync(join(BLOG_DIR, 'index.js'), 'utf8').replace(
    /^import\s+(\w+)\s+from\s+'\.\/([^']+\.md)\?raw';?[ \t]*$/gm,
    (_, name, file) => `const ${name} = ${JSON.stringify(readFileSync(join(BLOG_DIR, file), 'utf8'))};`,
  )
  if (/^\s*import\s/m.test(source)) throw new Error('blog prerender: content/blogs/index.js has an import other than a ?raw markdown file')
  const { default: posts } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
  if (!Array.isArray(posts) || posts.length === 0) throw new Error('blog prerender: no posts in content/blogs/index.js')
  return posts
}

const renderArticle = (markdown, headings) =>
  renderToStaticMarkup(
    createElement(
      Markdown,
      {
        remarkPlugins: [remarkGfm],
        components: markdownComponents({
          headingIds: new Map(headings.map((h) => [h.line, h.id])),
          renderLink: (to, children) => createElement('a', { href: to }, children),
        }),
      },
      markdown,
    ),
  )

const jsonLd = (schema) => JSON.stringify(schema).replace(/</g, '\\u003c')

// Head tags carry data-static-seo, so SEO.jsx swaps them for the live page's
// own once React mounts (as it does for index.html's homepage defaults).
const headTags = ({ title, description, url, image, type, schema, article, preloadImage }) => {
  const tag = (html) => `    ${html}`
  const metaTag = (attr, key, content) => tag(`<meta ${attr}="${key}" data-static-seo content="${esc(content)}" />`)
  return [
    tag(`<title data-static-seo>${esc(title)}</title>`),
    metaTag('name', 'description', description),
    tag(`<link rel="canonical" data-static-seo href="${esc(url)}" />`),
    tag(`<link rel="alternate" type="application/rss+xml" title="The GPSFDK Blog" data-static-seo href="${RSS_URL}" />`),
    metaTag('property', 'og:type', type),
    metaTag('property', 'og:site_name', 'GPSFDK'),
    metaTag('property', 'og:locale', 'en_IN'),
    metaTag('property', 'og:url', url),
    metaTag('property', 'og:title', title),
    metaTag('property', 'og:description', description),
    metaTag('property', 'og:image', image),
    metaTag('property', 'og:image:alt', title),
    ...(article
      ? [
          metaTag('property', 'article:published_time', article.date),
          metaTag('property', 'article:modified_time', article.updated || article.date),
          metaTag('property', 'article:section', article.category),
        ]
      : []),
    metaTag('name', 'twitter:card', 'summary_large_image'),
    metaTag('name', 'twitter:title', title),
    metaTag('name', 'twitter:description', description),
    metaTag('name', 'twitter:image', image),
    preloadImage
      ? tag(
          `<link rel="preload" as="image" fetchpriority="high" href="${esc(preloadImage.src)}" imagesrcset="${esc(preloadImage.srcset)}" imagesizes="${esc(preloadImage.sizes)}" />`,
        )
      : '',
    tag(`<script type="application/ld+json" data-static-seo>${jsonLd(schema)}</script>`),
  ]
    .filter(Boolean)
    .join('\n')
}

const ROOT_DIV = '<div id="root"></div>'

const buildPage = (template, head, body) => {
  const stripped = template
    .replace(/\s*<title data-static-seo>[^<]*<\/title>/, '')
    .replace(/\s*<meta [^>]*data-static-seo[^>]*>/g, '')
  if (/<[a-z][^>]*\sdata-static-seo/.test(stripped)) throw new Error('blog prerender: index.html has a data-static-seo tag this plugin cannot strip')
  if (!stripped.includes(ROOT_DIV)) throw new Error(`blog prerender: ${ROOT_DIV} not found in index.html`)
  return stripped
    .replace('</head>', `${head}\n  </head>`)
    .replace(ROOT_DIV, `<div id="blog-static">\n${body}\n</div>\n    ${ROOT_DIV}`)
}

const rssDate = (iso) => new Date(`${iso}T00:00:00Z`).toUTCString()

const renderRss = (posts) => `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>The GPSFDK Blog</title>
<link>${BLOG_URL}</link>
<description>${esc(BLOG_LIST_DESCRIPTION)}</description>
<language>en-in</language>
<lastBuildDate>${rssDate(posts[0].updated || posts[0].date)}</lastBuildDate>
<atom:link href="${RSS_URL}" rel="self" type="application/rss+xml" />
${posts
  .map(
    (post) => `<item>
<title>${esc(post.title)}</title>
<link>${postUrl(post.slug)}</link>
<guid isPermaLink="true">${postUrl(post.slug)}</guid>
<pubDate>${rssDate(post.date)}</pubDate>
<category>${esc(post.category)}</category>
<description>${esc(post.excerpt)}</description>
</item>`,
  )
  .join('\n')}
</channel>
</rss>
`

export default function prerenderBlog() {
  return {
    name: 'prerender-blog',
    apply: 'build',
    async writeBundle(options) {
      const dir = options.dir || 'dist'
      const template = await readFile(join(dir, 'index.html'), 'utf8')
      const posts = sortByDate(await loadPosts())

      const write = async (path, html) => {
        await mkdir(dirname(join(dir, path)), { recursive: true })
        await writeFile(join(dir, path), html)
      }

      const featured = posts[0]
      await write(
        'blog/index.html',
        buildPage(
          template,
          headTags({
            title: BLOG_LIST_TITLE,
            description: BLOG_LIST_DESCRIPTION,
            url: BLOG_URL,
            image: `${SITE_URL}/graph.webp`,
            type: 'website',
            schema: blogListSchema(posts),
            preloadImage: {
              src: blogImage(featured.image, 960),
              srcset: blogSrcSet(featured.image, [640, 960, 1440]),
              sizes: '(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw',
            },
          }),
          renderBlogListBody(posts),
        ),
      )

      for (const post of posts) {
        const markdown = stripLeadingTitle(post.content)
        const headings = extractHeadings(markdown)
        await write(
          `blog/${post.slug}/index.html`,
          buildPage(
            template,
            headTags({
              title: postSeoTitle(post.title),
              description: post.excerpt,
              url: postUrl(post.slug),
              image: blogImage(post.image, 1200),
              type: 'article',
              schema: blogPostSchema(post, markdown),
              article: post,
              preloadImage: {
                src: blogImage(post.image, 1440),
                srcset: blogSrcSet(post.image, [640, 960, 1440, 2000]),
                sizes: '(min-width: 1280px) 1240px, 100vw',
              },
            }),
            renderBlogPostBody({ post, blogs: posts, articleHtml: renderArticle(markdown, headings), headings }),
          ),
        )
      }

      await write('rss.xml', renderRss(posts))
      console.log(`[blog prerender] wrote /blog, ${posts.length} posts and /rss.xml`)
    },
  }
}
