import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { HiOutlineSearch, HiX } from 'react-icons/hi';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';
import {
  BLOG_LIST_DESCRIPTION,
  BLOG_LIST_TITLE,
  RSS_URL,
  START_HERE_SLUGS,
  blogImage,
  blogListSchema,
  blogSrcSet,
  sortByDate,
  topicsOf,
} from '../content/blogs/blogShared';
import { ArrowRight, BlogCard, Eyebrow, PostMeta } from '../components/blog/BlogUI';
import useDropStaticSnapshot from '../components/blog/useDropStaticSnapshot';

// The layout above the "Start here" panel is mirrored in
// content/blogs/blogStatic.js (renderBlogListBody); keep the two in step.

const posts = sortByDate(blogs);
const topics = topicsOf(posts);
const startHere = START_HERE_SLUGS.map((slug) => posts.find((p) => p.slug === slug)).filter(Boolean);

const SHOP_LINKS = [
  { to: '/canvas', title: 'Wall canvas', text: 'Browse ready-to-hang canvas art by style.' },
  { to: '/customize-canvas', title: 'Your photo on canvas', text: 'Turn a favourite photo into a canvas print.' },
  { to: '/house-nameplates', title: 'House nameplates', text: 'Personalised name plates for your entrance.' },
];

const matches = (post, query) => {
  const haystack = [post.title, post.excerpt, post.category, ...(post.keywords || [])].join(' ').toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((word) => haystack.includes(word));
};

const BlogList = () => {
  useDropStaticSnapshot();

  // Posts link here as /blog?topic=<category>; the chips filter in place
  const [searchParams] = useSearchParams();
  const initialTopic = topics.some((t) => t.name === searchParams.get('topic')) ? searchParams.get('topic') : '';
  const [topic, setTopic] = useState(initialTopic);
  const [query, setQuery] = useState('');

  const filtering = Boolean(topic || query.trim());
  const [featured, ...rest] = posts;
  const shown = filtering ? posts.filter((p) => (!topic || p.category === topic) && matches(p, query)) : rest;

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO title={BLOG_LIST_TITLE} description={BLOG_LIST_DESCRIPTION} schema={blogListSchema(posts)} />
      <Helmet>
        <link rel="alternate" type="application/rss+xml" title="The GPSFDK Blog" href={RSS_URL} />
      </Helmet>

      {/* ─── Masthead ─── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-5 pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="text-[13px] text-kind-ink/50">
          <Link to="/" className="hover:text-kind-forest transition-colors">Home</Link>
          <span aria-hidden="true" className="mx-2">/</span>
          <span aria-current="page" className="text-kind-ink/80">Blog</span>
        </nav>
        <div className="mt-6 grid lg:grid-cols-12 gap-5 lg:gap-10 items-end">
          <div className="lg:col-span-8">
            <Eyebrow>The GPSFDK Blog</Eyebrow>
            <h1 className="apple-title font-heading mt-4 text-kind-ink">
              Wall art &amp; canvas guides for <span className="text-kind-forest">Indian homes</span>
            </h1>
          </div>
          <p className="lg:col-span-4 apple-body text-kind-ink/60">
            Practical advice on choosing, sizing, hanging and caring for canvas prints, plus décor trends, Vaastu ideas
            and gift inspiration.
          </p>
        </div>
      </header>

      {/* ─── Latest article ─── */}
      {!filtering && (
        <section aria-label="Latest article" className="max-w-7xl mx-auto px-4 sm:px-5 mt-10 sm:mt-14">
          <Link
            to={`/blog/${featured.slug}`}
            className="group grid lg:grid-cols-12 gap-6 lg:gap-10 items-center rounded-[28px] bg-kind-mist p-3 sm:p-4 lg:p-5"
          >
            <div className="lg:col-span-7 relative aspect-[16/10] overflow-hidden rounded-[22px] bg-kind-sage/40">
              <img
                src={blogImage(featured.image, 960)}
                srcSet={blogSrcSet(featured.image, [640, 960, 1440])}
                sizes="(min-width: 1280px) 720px, (min-width: 1024px) 58vw, 100vw"
                alt={featured.title}
                width="960"
                height="600"
                fetchPriority="high"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />
            </div>
            <div className="lg:col-span-5 px-3 pb-5 lg:px-2 lg:pb-0">
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-kind-lime text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">
                  Latest
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kind-forest">{featured.category}</span>
              </div>
              <h2 className="apple-headline font-heading mt-4 text-kind-ink group-hover:text-kind-forest transition-colors">
                {featured.title}
              </h2>
              <p className="apple-body mt-4 text-kind-ink/65">{featured.excerpt}</p>
              <PostMeta post={featured} withAuthor className="mt-5" />
              <span className="mt-6 inline-flex items-center gap-3 rounded-full bg-kind-forest text-white pl-5 pr-1.5 py-1.5 text-sm font-semibold">
                Read the article
                <span className="w-8 h-8 rounded-full bg-kind-lime flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </span>
            </div>
          </Link>
        </section>
      )}

      {/* ─── All articles ─── */}
      <section id="articles" aria-labelledby="articles-heading" className="max-w-7xl mx-auto px-4 sm:px-5 mt-14 sm:mt-20 scroll-mt-28">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5">
          <div>
            <Eyebrow>Browse by topic</Eyebrow>
            <h2 id="articles-heading" className="apple-headline font-heading mt-3 text-kind-ink">
              {topic || 'All articles'}
            </h2>
          </div>
          <label className="relative block w-full lg:w-80">
            <span className="sr-only">Search articles</span>
            <HiOutlineSearch className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-kind-ink/40" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                // A search looks across every topic; pick a chip after to narrow it
                setQuery(e.target.value);
                setTopic('');
              }}
              placeholder="Search articles"
              className="w-full rounded-full border border-kind-forest/15 bg-white py-3 pl-11 pr-4 text-[15px] text-kind-ink placeholder:text-kind-ink/40 focus:outline-none focus:border-kind-forest focus:ring-2 focus:ring-kind-forest/10"
            />
          </label>
        </div>

        <div className="mt-6 -mx-4 px-4 sm:mx-0 sm:px-0 flex gap-2 overflow-x-auto scrollbar-hide" aria-label="Filter by topic">
          {[{ name: '', count: posts.length }, ...topics].map(({ name, count }) => {
            const active = topic === name;
            return (
              <button
                key={name || 'all'}
                type="button"
                onClick={() => setTopic(name)}
                aria-pressed={active}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-kind-forest border-kind-forest text-white'
                    : 'bg-white border-kind-forest/15 text-kind-ink/70 hover:border-kind-forest/40 hover:text-kind-ink'
                }`}
              >
                {name || 'All'} <span className={active ? 'text-white/60' : 'text-kind-ink/35'}>{count}</span>
              </button>
            );
          })}
        </div>

        {shown.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 mt-8 sm:mt-10">
            {shown.map((post) => (
              <BlogCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="mt-10 rounded-[24px] border border-dashed border-kind-forest/20 px-6 py-14 text-center">
            <p className="apple-tile-title font-heading text-kind-ink">No articles match that yet</p>
            <p className="apple-body mt-2 text-kind-ink/60">Try another word, or browse every topic.</p>
            <button
              type="button"
              onClick={() => {
                setTopic('');
                setQuery('');
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-kind-forest text-white px-5 py-2.5 text-sm font-semibold hover:bg-kind-ink transition-colors"
            >
              <HiX className="w-4 h-4" aria-hidden="true" /> Clear filters
            </button>
          </div>
        )}
      </section>

      {/* ─── Start here ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 mt-16 sm:mt-24">
        <div className="rounded-[28px] bg-kind-mint px-6 py-8 sm:p-10 lg:p-14 grid lg:grid-cols-12 gap-6 lg:gap-12">
          <div className="lg:col-span-5">
            <Eyebrow>Start here</Eyebrow>
            <h2 className="apple-headline font-heading mt-3 text-kind-ink">New to canvas prints? Read these four first.</h2>
            <p className="apple-body mt-4 text-kind-ink/65">
              What a gallery wrap is, what size your wall needs, whether to frame, and how to hang it straight. The basics,
              in order.
            </p>
          </div>
          <ol className="lg:col-span-7 divide-y divide-kind-forest/10">
            {startHere.map((post, i) => (
              <li key={post.slug}>
                <Link to={`/blog/${post.slug}`} className="group flex items-center gap-4 sm:gap-6 py-4 sm:py-5">
                  <span className="w-7 text-[13px] font-semibold text-kind-forest/60 tabular-nums">0{i + 1}</span>
                  <span className="flex-1 font-heading text-[17px] sm:text-[19px] font-semibold leading-snug text-kind-ink group-hover:text-kind-forest transition-colors">
                    {post.title}
                  </span>
                  <span className="w-9 h-9 rounded-full bg-white text-kind-forest flex items-center justify-center shrink-0 group-hover:bg-kind-forest group-hover:text-white transition-colors">
                    <ArrowRight />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ─── Shop ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 mt-6 sm:mt-8">
        <div className="relative overflow-hidden rounded-[28px] bg-kind-forest text-white px-6 py-8 sm:p-10 lg:p-14">
          <div aria-hidden="true" className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-kind-lime/15 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>
          <div className="relative">
            <Eyebrow dark>From the studio</Eyebrow>
            <h2 className="apple-headline font-heading mt-3 max-w-2xl">Ready to put something on that wall?</h2>
            <div className="mt-8 grid sm:grid-cols-3 gap-3 sm:gap-4">
              {SHOP_LINKS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="group rounded-[20px] bg-white/10 hover:bg-white/15 border border-white/10 p-5 flex flex-col gap-1.5 transition-colors"
                >
                  <span className="flex items-center justify-between gap-3 font-semibold text-[17px]">
                    {item.title}
                    <ArrowRight className="w-4 h-4 text-kind-lime transition-transform group-hover:translate-x-1" />
                  </span>
                  <span className="text-[14px] text-kind-sage">{item.text}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogList;
