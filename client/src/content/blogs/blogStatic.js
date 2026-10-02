// Static HTML for the blog pages, baked into the build by vite.blog.plugin.js.
//
// The app is a client-rendered SPA, so without this every blog URL is served
// as an empty <div id="root"> under the homepage's title: Bing, social and AI
// crawlers (which don't run JavaScript) see no article at all, and everyone
// else waits for the app bundle before seeing a word. Each blog page now ships
// with its real title, meta, structured data and content, shown until the
// React page mounts and drops it (useDropStaticSnapshot in BlogUI.jsx).
//
// The markup mirrors BlogList.jsx / BlogPost.jsx / BlogUI.jsx class for class
// so that swap doesn't move anything; keep them in step. This file sits under
// src/ so Tailwind sees its classes.

import {
  DEFAULT_AUTHOR,
  PROSE_CLASSES,
  START_HERE_SLUGS,
  blogImage,
  blogSrcSet,
  formatDate,
  readingMinutes,
  relatedPosts,
  sortByDate,
  stripLeadingTitle,
  topicPath,
  topicsOf,
} from './blogShared.js';

export const esc = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const attr = (name, value) => (value ? ` ${name}="${esc(value)}"` : '');

const arrow = (cls = 'w-4 h-4') =>
  `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;

const eyebrow = (text, dark = false) =>
  `<span class="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] ${dark ? 'text-kind-lime' : 'text-kind-forest'}"><span class="w-1.5 h-1.5 rounded-full shrink-0 ${dark ? 'bg-kind-lime' : 'bg-kind-forest'}"></span>${esc(text)}</span>`;

const meta = (post, { withAuthor = false, cls = '' } = {}) =>
  `<p class="text-[13px] text-kind-ink/50 ${cls}">${withAuthor ? `By ${esc(post.author || DEFAULT_AUTHOR)} · ` : ''}<time datetime="${esc(post.date)}">${formatDate(post.date)}</time> · ${readingMinutes(post.content)} min read</p>`;

const card = (post) => `<article class="h-full"><a href="/blog/${esc(post.slug)}" class="group flex flex-col h-full">
<div class="relative aspect-[16/10] overflow-hidden rounded-[20px] bg-kind-mist"><img src="${esc(blogImage(post.image, 640))}"${attr('srcset', blogSrcSet(post.image, [400, 640, 960]))} sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw" alt="${esc(post.title)}" width="640" height="400" loading="lazy" decoding="async" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"><span class="absolute top-3 left-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-kind-forest">${esc(post.category)}</span></div>
<div class="flex flex-col flex-1 pt-4">${meta(post)}<h3 class="mt-2 font-heading text-[19px] sm:text-[20px] leading-snug font-semibold text-kind-ink group-hover:text-kind-forest transition-colors">${esc(post.title)}</h3><p class="mt-2 text-[15px] leading-relaxed text-kind-ink/60 line-clamp-2">${esc(post.excerpt)}</p><span class="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-kind-forest">Read article ${arrow('w-4 h-4 transition-transform group-hover:translate-x-1')}</span></div>
</a></article>`;

const SHOP_LINKS = [
  ['/canvas', 'Wall canvas', 'Browse ready-to-hang canvas art by style.'],
  ['/customize-canvas', 'Your photo on canvas', 'Turn a favourite photo into a canvas print.'],
  ['/house-nameplates', 'House nameplates', 'Personalised name plates for your entrance.'],
];

const SEARCH_ICON =
  '<svg stroke="currentColor" fill="none" stroke-width="2" viewBox="0 0 24 24" class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kind-ink/40" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>';

export const renderBlogListBody = (blogs) => {
  const posts = sortByDate(blogs);
  const [featured, ...rest] = posts;
  const topics = [{ name: '', count: posts.length }, ...topicsOf(posts)];
  const startHere = START_HERE_SLUGS.map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);

  const chips = topics
    .map(
      ({ name, count }) =>
        `<span class="shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
          name ? 'bg-white border-kind-forest/15 text-kind-ink/70' : 'bg-kind-forest border-kind-forest text-white'
        }">${esc(name || 'All')} <span class="${name ? 'text-kind-ink/35' : 'text-white/60'}">${count}</span></span>`,
    )
    .join('');

  return `<div class="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
<header class="max-w-7xl mx-auto px-4 sm:px-5 pt-6 sm:pt-10">
<nav aria-label="Breadcrumb" class="text-[13px] text-kind-ink/50"><a href="/" class="hover:text-kind-forest transition-colors">Home</a><span aria-hidden="true" class="mx-2">/</span><span aria-current="page" class="text-kind-ink/80">Blog</span></nav>
<div class="mt-6 grid lg:grid-cols-12 gap-5 lg:gap-10 items-end"><div class="lg:col-span-8">${eyebrow('The GPSFDK Blog')}<h1 class="apple-title font-heading mt-4 text-kind-ink">Wall art &amp; canvas guides for <span class="text-kind-forest">Indian homes</span></h1></div><p class="lg:col-span-4 apple-body text-kind-ink/60">Practical advice on choosing, sizing, hanging and caring for canvas prints, plus décor trends, Vaastu ideas and gift inspiration.</p></div>
</header>
<section aria-label="Latest article" class="max-w-7xl mx-auto px-4 sm:px-5 mt-10 sm:mt-14"><a href="/blog/${esc(featured.slug)}" class="group grid lg:grid-cols-12 gap-6 lg:gap-10 items-center rounded-[28px] bg-kind-mist p-3 sm:p-4 lg:p-5">
<div class="lg:col-span-7 relative aspect-[16/10] overflow-hidden rounded-[22px] bg-kind-sage/40"><img src="${esc(blogImage(featured.image, 960))}"${attr('srcset', blogSrcSet(featured.image, [640, 960, 1440]))} sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw" alt="${esc(featured.title)}" width="960" height="600" fetchpriority="high" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"></div>
<div class="lg:col-span-5 px-3 pb-5 lg:px-2 lg:pb-0"><div class="flex items-center gap-3"><span class="rounded-full bg-kind-lime text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">Latest</span><span class="text-[11px] font-semibold uppercase tracking-[0.12em] text-kind-forest">${esc(featured.category)}</span></div><h2 class="apple-headline font-heading mt-4 text-kind-ink group-hover:text-kind-forest transition-colors">${esc(featured.title)}</h2><p class="apple-body mt-4 text-kind-ink/65">${esc(featured.excerpt)}</p>${meta(featured, { withAuthor: true, cls: 'mt-5' })}<span class="mt-6 inline-flex items-center gap-3 rounded-full bg-kind-forest text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold">Read the article<span class="w-8 h-8 rounded-full bg-kind-lime flex items-center justify-center">${arrow('w-4 h-4 transition-transform group-hover:translate-x-0.5')}</span></span></div>
</a></section>
<section id="articles" aria-labelledby="articles-heading" class="max-w-7xl mx-auto px-4 sm:px-5 mt-14 sm:mt-20 scroll-mt-28">
<div class="flex flex-col lg:flex-row lg:items-end justify-between gap-5"><div>${eyebrow('Browse by topic')}<h2 id="articles-heading" class="apple-headline font-heading mt-3 text-kind-ink">All articles</h2></div><label class="relative block w-full lg:w-80"><span class="sr-only">Search articles</span>${SEARCH_ICON}<input type="search" placeholder="Search articles" class="w-full rounded-full border border-kind-forest/15 bg-white py-3 pl-11 pr-4 text-[15px] text-kind-ink placeholder:text-kind-ink/40 focus:outline-none focus:border-kind-forest focus:ring-2 focus:ring-kind-forest/10"></label></div>
<div class="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto scrollbar-hide" aria-label="Filter by topic">${chips}</div>
<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mt-8 sm:mt-10">${rest.map(card).join('\n')}</div>
</section>
<section class="max-w-7xl mx-auto px-4 sm:px-5 mt-16 sm:mt-24"><div class="rounded-[28px] bg-kind-mint px-6 py-8 sm:p-10 lg:p-14 grid lg:grid-cols-12 gap-6 lg:gap-12">
<div class="lg:col-span-5">${eyebrow('Start here')}<h2 class="apple-headline font-heading mt-3 text-kind-ink">New to canvas prints? Read these four first.</h2><p class="apple-body mt-4 text-kind-ink/65">What a gallery wrap is, what size your wall needs, whether to frame, and how to hang it straight. The basics, in order.</p></div>
<ol class="lg:col-span-7 divide-y divide-kind-forest/10">${startHere
    .map(
      (post, i) =>
        `<li><a href="/blog/${esc(post.slug)}" class="group flex items-center gap-4 sm:gap-6 py-4 sm:py-5"><span class="w-7 text-[13px] font-semibold text-kind-forest/60 tabular-nums">0${i + 1}</span><span class="flex-1 font-heading text-[17px] sm:text-[19px] font-semibold leading-snug text-kind-ink group-hover:text-kind-forest transition-colors">${esc(post.title)}</span><span class="w-9 h-9 rounded-full bg-white text-kind-forest flex items-center justify-center shrink-0 group-hover:bg-kind-forest group-hover:text-white transition-colors">${arrow()}</span></a></li>`,
    )
    .join('')}</ol>
</div></section>
<section class="max-w-7xl mx-auto px-4 sm:px-5 mt-6 sm:mt-8"><div class="relative overflow-hidden rounded-[28px] bg-kind-forest text-white px-6 py-8 sm:p-10 lg:p-14"><div class="relative">${eyebrow('From the studio', true)}<h2 class="apple-headline font-heading mt-3 max-w-2xl">Ready to put something on that wall?</h2>
<div class="mt-8 grid sm:grid-cols-3 gap-3 sm:gap-4">${SHOP_LINKS.map(
    ([to, title, text]) =>
      `<a href="${to}" class="group rounded-[20px] bg-white/10 hover:bg-white/15 border border-white/10 p-5 flex flex-col gap-1.5 transition-colors"><span class="flex items-center justify-between gap-3 font-semibold text-[17px]">${title}${arrow('w-4 h-4 text-kind-lime transition-transform group-hover:translate-x-1')}</span><span class="text-[14px] text-kind-sage">${text}</span></a>`,
  ).join('')}</div>
</div></div></section>
</div>`;
};

const tocLinks = (toc) =>
  `<ol class="space-y-0.5 border-l border-kind-forest/10">${toc
    .map(
      (h, i) =>
        `<li><a href="#${esc(h.id)}" class="-ml-px block border-l-2 pl-4 py-1.5 text-[14px] leading-snug transition-colors ${
          i === 0 ? 'border-kind-lime text-kind-ink font-semibold' : 'border-transparent text-kind-ink/55 hover:text-kind-ink'
        }">${esc(h.text)}</a></li>`,
    )
    .join('')}</ol>`;

const CHEVRON =
  '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 20 20" class="w-5 h-5 transition-transform group-open:rotate-180" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>';

// articleHtml: the post's markdown rendered with markdownComponents
export const renderBlogPostBody = ({ post, blogs, articleHtml, headings }) => {
  const markdown = stripLeadingTitle(post.content);
  const author = post.author || DEFAULT_AUTHOR;
  const toc = headings.filter((h) => h.depth === 2);
  const byDate = sortByDate(blogs);
  const index = byDate.findIndex((p) => p.slug === post.slug);
  const newer = byDate[index - 1];
  const older = byDate[index + 1];
  const topic = esc(topicPath(post.category));
  const category = esc(post.category);

  const pager = [
    [older, 'Previous article'],
    [newer, 'Next article'],
  ]
    .map(([p, label]) =>
      p
        ? `<a href="/blog/${esc(p.slug)}" class="group rounded-[20px] border border-kind-forest/10 p-5 hover:border-kind-forest/40 transition-colors ${label === 'Next article' ? 'sm:text-right' : ''}"><span class="text-[12px] font-semibold uppercase tracking-[0.14em] text-kind-ink/45">${label}</span><span class="mt-2 block font-heading font-semibold leading-snug text-kind-ink group-hover:text-kind-forest transition-colors">${esc(p.title)}</span></a>`
        : '<span class="hidden sm:block"></span>',
    )
    .join('');

  return `<div class="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
<header class="max-w-7xl mx-auto px-4 sm:px-5 pt-6 sm:pt-10">
<nav aria-label="Breadcrumb" class="text-[13px] text-kind-ink/50 flex flex-wrap items-center gap-x-2 gap-y-1"><a href="/" class="hover:text-kind-forest transition-colors">Home</a><span aria-hidden="true">/</span><a href="/blog" class="hover:text-kind-forest transition-colors">Blog</a><span aria-hidden="true">/</span><a href="${topic}" class="hover:text-kind-forest transition-colors">${category}</a></nav>
<div class="max-w-4xl mt-6 sm:mt-8"><a href="${topic}" class="inline-flex rounded-full bg-kind-mint text-kind-forest px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-kind-sage transition-colors">${category}</a>
<h1 class="font-heading font-semibold text-kind-ink mt-4 text-[32px] leading-[1.12] sm:text-[44px] lg:text-[54px] lg:leading-[1.06] tracking-tight">${esc(post.title)}</h1>
<p class="mt-5 text-[18px] sm:text-[20px] leading-relaxed text-kind-ink/65 max-w-3xl">${esc(post.excerpt)}</p>
<div class="mt-7 flex items-center gap-3 text-[14px] text-kind-ink/60"><span class="w-10 h-10 rounded-full bg-kind-forest text-white font-semibold flex items-center justify-center shrink-0" aria-hidden="true">${esc(author.charAt(0))}</span><p>By <span class="font-semibold text-kind-ink">${esc(author)}</span><span class="block sm:inline"><span class="hidden sm:inline"> · </span><time datetime="${esc(post.date)}">${formatDate(post.date)}</time> · ${readingMinutes(markdown)} min read</span></p></div>
</div>
<figure class="mt-8 sm:mt-12 overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-mist aspect-[4/3] sm:aspect-[2/1]"><img src="${esc(blogImage(post.image, 1440))}"${attr('srcset', blogSrcSet(post.image, [640, 960, 1440, 2000]))} sizes="(min-width: 1280px) 1240px, 100vw" alt="${esc(post.title)}" width="1440" height="720" fetchpriority="high" class="w-full h-full object-cover"></figure>
</header>
<div class="max-w-7xl mx-auto px-4 sm:px-5 mt-10 sm:mt-16 lg:grid lg:grid-cols-12 lg:gap-10">
<aside class="lg:col-span-3"><div class="lg:sticky lg:top-28">
<details class="lg:hidden group mb-8 rounded-2xl border border-kind-forest/10 bg-kind-mist/50"><summary class="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-kind-ink [&amp;::-webkit-details-marker]:hidden">On this page${CHEVRON}</summary><div class="px-5 pb-5">${tocLinks(toc)}</div></details>
<nav aria-label="On this page" class="hidden lg:block"><p class="text-[11px] font-semibold uppercase tracking-[0.18em] text-kind-ink/45">On this page</p><div class="mt-4">${tocLinks(toc)}</div></nav>
</div></aside>
<article class="lg:col-span-8 xl:col-span-7 lg:col-start-5 xl:col-start-5 min-w-0">
<div class="${PROSE_CLASSES}">${articleHtml}</div>
<div class="mt-8 rounded-[20px] bg-kind-mist p-6 flex gap-4 items-start"><span class="w-12 h-12 rounded-full bg-kind-forest text-white text-lg font-semibold flex items-center justify-center shrink-0" aria-hidden="true">${esc(author.charAt(0))}</span><div><p class="text-[13px] text-kind-ink/50">Written by</p><p class="font-semibold text-[17px] text-kind-ink">${esc(author)}</p><p class="mt-1 text-[15px] leading-relaxed text-kind-ink/65">Writes the GPSFDK blog: guides to choosing, hanging and caring for wall art in Indian homes. <a href="${topic}" class="font-semibold text-kind-forest hover:underline">More ${category} articles</a></p></div></div>
${older || newer ? `<nav aria-label="More articles" class="mt-8 grid sm:grid-cols-2 gap-4">${pager}</nav>` : ''}
</article>
</div>
<section class="max-w-7xl mx-auto px-4 sm:px-5 mt-16 sm:mt-24"><div class="flex items-end justify-between gap-4"><div>${eyebrow('Keep reading')}<h2 class="apple-headline font-heading mt-3 text-kind-ink">More from the blog</h2></div><a href="/blog" class="group hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-kind-forest">All articles ${arrow('w-4 h-4 transition-transform group-hover:translate-x-1')}</a></div>
<div class="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">${relatedPosts(blogs, post, 3).map(card).join('\n')}</div></section>
</div>`;
};
