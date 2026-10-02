import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useScroll, useSpring } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';
import { FaWhatsapp, FaPinterestP, FaFacebookF, FaXTwitter, FaLink } from 'react-icons/fa6';
import { HiChevronDown } from 'react-icons/hi';
import SEO from '../components/seo/SEO';
import blogs from '../content/blogs/index';
import {
  DEFAULT_AUTHOR,
  PROSE_CLASSES,
  RSS_URL,
  blogImage,
  blogPostSchema,
  blogSrcSet,
  extractHeadings,
  formatDate,
  postSeoTitle,
  postUrl,
  readingMinutes,
  relatedPosts,
  sortByDate,
  stripLeadingTitle,
  topicPath,
} from '../content/blogs/blogShared';
import { markdownComponents } from '../content/blogs/markdownComponents';
import { ArrowRight, BlogCard, Eyebrow } from '../components/blog/BlogUI';
import ProductCard from '../components/product/ProductCard';
import { KindCTA } from '../components/kindact/KindUI';
import { cachedGet } from '../utils/api';
import NotFoundPage from './NotFoundPage';

const byDate = sortByDate(blogs);
const renderLink = (to, children) => <Link to={to}>{children}</Link>;

const NAMEPLATE_WORDS = ['nameplate', 'ganesha', 'naman', 'naam', 'trishula'];

const ReadingProgress = ({ target }) => {
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end end'] });
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 30, restDelta: 0.001 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 h-[3px] bg-kind-lime origin-left z-[60]"
    />
  );
};

const ShareButtons = ({ post }) => {
  const url = postUrl(post.slug);
  const text = encodeURIComponent(post.title);
  const link = encodeURIComponent(url);
  const targets = [
    { label: 'Share on WhatsApp', Icon: FaWhatsapp, href: `https://wa.me/?text=${text}%20${link}` },
    {
      label: 'Save to Pinterest',
      Icon: FaPinterestP,
      href: `https://pinterest.com/pin/create/button/?url=${link}&media=${encodeURIComponent(blogImage(post.image, 1200))}&description=${text}`,
    },
    { label: 'Share on Facebook', Icon: FaFacebookF, href: `https://www.facebook.com/sharer/sharer.php?u=${link}` },
    { label: 'Share on X', Icon: FaXTwitter, href: `https://twitter.com/intent/tweet?url=${link}&text=${text}` },
  ];
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied');
    } catch {
      toast.error("Couldn't copy the link");
    }
  };
  const button =
    'w-10 h-10 rounded-full border border-kind-forest/15 bg-white text-kind-forest flex items-center justify-center hover:bg-kind-forest hover:text-white hover:border-kind-forest transition-colors';
  return (
    <div className="flex items-center gap-2">
      {targets.map(({ label, Icon, href }) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label} className={button}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </a>
      ))}
      <button type="button" onClick={copy} aria-label="Copy link" title="Copy link" className={button}>
        <FaLink className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
};

// Highlights the section being read: the last heading scrolled past the top
const useActiveHeading = (ids) => {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    const update = () => {
      let current = ids[0];
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top < 140) current = id;
      });
      setActive(current);
    };
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
    };
  }, [ids]);
  return active;
};

const scrollToHeading = (event, id) => {
  const el = document.getElementById(id);
  if (!el) return;
  event.preventDefault();
  el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const TocLinks = ({ toc, active }) => (
  <ol className="space-y-0.5 border-l border-kind-forest/10">
    {toc.map((h) => (
      <li key={h.id}>
        <a
          href={`#${h.id}`}
          onClick={(e) => scrollToHeading(e, h.id)}
          aria-current={active === h.id ? 'location' : undefined}
          className={`-ml-px block border-l-2 pl-4 py-1.5 text-[14px] leading-snug transition-colors ${
            active === h.id ? 'border-kind-lime text-kind-ink font-semibold' : 'border-transparent text-kind-ink/55 hover:text-kind-ink'
          }`}
        >
          {h.text}
        </a>
      </li>
    ))}
  </ol>
);

const BlogPost = () => {
  const { slug } = useParams();
  const blog = blogs.find((b) => b.slug === slug);
  const articleRef = useRef(null);
  const [products, setProducts] = useState([]);

  const markdown = useMemo(() => stripLeadingTitle(blog?.content), [blog]);
  const headings = useMemo(() => extractHeadings(markdown), [markdown]);
  const toc = useMemo(() => headings.filter((h) => h.depth === 2), [headings]);
  const tocIds = useMemo(() => toc.map((h) => h.id), [toc]);
  const components = useMemo(
    () => markdownComponents({ headingIds: new Map(headings.map((h) => [h.line, h.id])), renderLink }),
    [headings],
  );
  const active = useActiveHeading(tocIds);

  const contentLower = `${blog?.title || ''} ${blog?.content || ''}`.toLowerCase();
  const shopPath = NAMEPLATE_WORDS.some((w) => contentLower.includes(w)) ? '/house-nameplates' : '/canvas';

  useEffect(() => {
    if (!blog) return undefined;
    let cancelled = false;
    setProducts([]);
    cachedGet('/products', {
      params: { limit: 4, categorySlug: shopPath === '/house-nameplates' ? 'house-nameplates' : 'wall-canvas' },
    })
      .then((data) => {
        if (!cancelled) setProducts(data.products || []);
      })
      .catch(() => {
        // The shop row is optional; the article stands on its own
      });
    return () => {
      cancelled = true;
    };
  }, [blog, shopPath]);

  // The shared 404 carries noindex; a bare "not found" block would be indexed
  // as a soft 404 with the homepage's title.
  if (!blog) {
    return <NotFoundPage />;
  }

  const index = byDate.findIndex((p) => p.slug === blog.slug);
  const newer = byDate[index - 1];
  const older = byDate[index + 1];
  const related = relatedPosts(blogs, blog, 3);
  const author = blog.author || DEFAULT_AUTHOR;

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title={postSeoTitle(blog.title)}
        description={blog.excerpt}
        image={blogImage(blog.image, 1200)}
        type="article"
        schema={blogPostSchema(blog, markdown)}
      />
      <Helmet>
        <meta property="article:published_time" content={blog.date} />
        <meta property="article:modified_time" content={blog.updated || blog.date} />
        <meta property="article:section" content={blog.category} />
        {(blog.keywords || []).map((k) => (
          <meta key={k} property="article:tag" content={k} />
        ))}
        <link rel="alternate" type="application/rss+xml" title="The GPSFDK Blog" href={RSS_URL} />
      </Helmet>
      <ReadingProgress target={articleRef} />

      {/* ─── Header ─── */}
      <header className="max-w-7xl mx-auto px-4 sm:px-5 pt-6 sm:pt-10">
        <nav aria-label="Breadcrumb" className="text-[13px] text-kind-ink/50 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link to="/" className="hover:text-kind-forest transition-colors">Home</Link>
          <span aria-hidden="true">/</span>
          <Link to="/blog" className="hover:text-kind-forest transition-colors">Blog</Link>
          <span aria-hidden="true">/</span>
          <Link to={topicPath(blog.category)} className="hover:text-kind-forest transition-colors">{blog.category}</Link>
        </nav>
        <div className="max-w-4xl mt-6 sm:mt-8">
          <Link
            to={topicPath(blog.category)}
            className="inline-flex rounded-full bg-kind-mint text-kind-forest px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] hover:bg-kind-sage transition-colors"
          >
            {blog.category}
          </Link>
          <h1 className="font-heading font-semibold text-kind-ink mt-4 text-[32px] leading-[1.12] sm:text-[44px] lg:text-[54px] lg:leading-[1.06] tracking-tight">
            {blog.title}
          </h1>
          <p className="mt-5 text-[18px] sm:text-[20px] leading-relaxed text-kind-ink/65 max-w-3xl">{blog.excerpt}</p>
          <div className="mt-7 flex items-center gap-3 text-[14px] text-kind-ink/60">
            <span className="w-10 h-10 rounded-full bg-kind-forest text-white font-semibold flex items-center justify-center shrink-0" aria-hidden="true">
              {author.charAt(0)}
            </span>
            <p>
              By <span className="font-semibold text-kind-ink">{author}</span>
              <span className="block sm:inline">
                <span className="hidden sm:inline"> · </span>
                <time dateTime={blog.date}>{formatDate(blog.date)}</time> · {readingMinutes(markdown)} min read
              </span>
            </p>
          </div>
        </div>
        <figure className="mt-8 sm:mt-12 overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-mist aspect-[4/3] sm:aspect-[2/1]">
          <img
            src={blogImage(blog.image, 1440)}
            srcSet={blogSrcSet(blog.image, [640, 960, 1440, 2000])}
            sizes="(min-width: 1280px) 1240px, 100vw"
            alt={blog.title}
            width="1440"
            height="720"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
        </figure>
      </header>

      {/* ─── Article ─── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-5 mt-10 sm:mt-16 lg:grid lg:grid-cols-12 lg:gap-10">
        <aside className="lg:col-span-3">
          <div className="lg:sticky lg:top-28">
            <details className="lg:hidden group mb-8 rounded-2xl border border-kind-forest/10 bg-kind-mist/50">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 font-semibold text-kind-ink [&::-webkit-details-marker]:hidden">
                On this page
                <HiChevronDown className="w-5 h-5 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <div className="px-5 pb-5">
                <TocLinks toc={toc} active={active} />
              </div>
            </details>
            <nav aria-label="On this page" className="hidden lg:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-kind-ink/45">On this page</p>
              <div className="mt-4">
                <TocLinks toc={toc} active={active} />
              </div>
              <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.18em] text-kind-ink/45">Share</p>
              <div className="mt-3">
                <ShareButtons post={blog} />
              </div>
            </nav>
          </div>
        </aside>

        <article ref={articleRef} className="lg:col-span-8 xl:col-span-7 lg:col-start-5 xl:col-start-5 min-w-0">
          <div className={PROSE_CLASSES}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </div>

          <div className="mt-14 pt-8 border-t border-kind-forest/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="font-semibold text-kind-ink">Found this useful? Share it.</p>
            <ShareButtons post={blog} />
          </div>

          <div className="mt-8 rounded-[20px] bg-kind-mist p-6 flex gap-4 items-start">
            <span className="w-12 h-12 rounded-full bg-kind-forest text-white text-lg font-semibold flex items-center justify-center shrink-0" aria-hidden="true">
              {author.charAt(0)}
            </span>
            <div>
              <p className="text-[13px] text-kind-ink/50">Written by</p>
              <p className="font-semibold text-[17px] text-kind-ink">{author}</p>
              <p className="mt-1 text-[15px] leading-relaxed text-kind-ink/65">
                Writes the GPSFDK blog: guides to choosing, hanging and caring for wall art in Indian homes.{' '}
                <Link to={topicPath(blog.category)} className="font-semibold text-kind-forest hover:underline">
                  More {blog.category} articles
                </Link>
              </p>
            </div>
          </div>

          {(older || newer) && (
            <nav aria-label="More articles" className="mt-8 grid sm:grid-cols-2 gap-4">
              {[
                { post: older, label: 'Previous article' },
                { post: newer, label: 'Next article' },
              ].map(({ post, label }) =>
                post ? (
                  <Link
                    key={label}
                    to={`/blog/${post.slug}`}
                    className={`group rounded-[20px] border border-kind-forest/10 p-5 hover:border-kind-forest/40 transition-colors ${
                      label === 'Next article' ? 'sm:text-right' : ''
                    }`}
                  >
                    <span className="text-[12px] font-semibold uppercase tracking-[0.14em] text-kind-ink/45">{label}</span>
                    <span className="mt-2 block font-heading font-semibold leading-snug text-kind-ink group-hover:text-kind-forest transition-colors">
                      {post.title}
                    </span>
                  </Link>
                ) : (
                  <span key={label} className="hidden sm:block" />
                ),
              )}
            </nav>
          )}
        </article>
      </div>

      {/* ─── Shop the look ─── */}
      {products.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-5 mt-16 sm:mt-24">
          <div className="rounded-[28px] bg-kind-mint/70 p-5 sm:p-10">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <Eyebrow>Shop the look</Eyebrow>
                <h2 className="apple-headline font-heading mt-3 text-kind-ink">From the GPSFDK collection</h2>
              </div>
              <Link to={shopPath} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-kind-forest">
                View all <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Keep reading ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-5 mt-16 sm:mt-24">
        <div className="flex items-end justify-between gap-4">
          <div>
            <Eyebrow>Keep reading</Eyebrow>
            <h2 className="apple-headline font-heading mt-3 text-kind-ink">More from the blog</h2>
          </div>
          <Link to="/blog" className="group hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-kind-forest">
            All articles <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
          {related.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>

      <KindCTA
        title="Ready to transform your walls?"
        text="Explore premium canvas prints and custom house nameplates, made to order and delivered across India."
        to="/canvas"
        cta="Shop canvas"
      />
    </div>
  );
};

export default BlogPost;
