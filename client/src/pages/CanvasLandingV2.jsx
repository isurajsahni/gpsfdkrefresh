import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import VideoShowcase from '../components/home/VideoShowcase';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../utils/imageOptimizer';
import API from '../utils/api';

import heroImage from '../assets/image/hero-image.png';
import ctaImage from '../assets/image/cta.png';

/* ───────────────────────────────────────────────────────────────────────────
   Canvas Page v2 — DEMO ONLY

   Rebuild of the "Canvas Page" Figma mock
   (figma.com/design/7gCw9F9RUAYrudmzJtsHWM/Canvas-Page).

   Not linked from anywhere in the site and marked noindex. The production page
   at /customize-canvas is untouched.

   Layout numbers are derived from the exported asset dimensions rather than
   guessed: cta.png is 1248x326, so the content shell is 1248 wide (96px gutters
   inside the 1440 frame); hero-image.png is 1440x394, so the hero is a
   full-bleed 394px band; the style thumbnails export at 80x80, so the circles
   are 80px. Copy and treatment for the hero, FAQ and CTA come from design crops
   the user supplied. Exact font sizes are still read by eye — the Figma token
   only ever had file_comments:read, so no type tokens were pulled.
   ─────────────────────────────────────────────────────────────────────────── */

const INK = '#1D1D1F';
const MUTED = '#6B6B70';
const ACCENT = '#F15A29';
const PEACH = '#FDEEE8';

const SUPPORT_EMAIL = 'support@gpsfdk.com';

/* The 14 style thumbnails are loaded through a glob so the filenames — which
   carry spaces and an ampersand — never have to appear in import statements. */
const STYLE_IMAGES = import.meta.glob('../assets/image/*.png', {
  eager: true,
  import: 'default',
});
const styleSrc = (file) => STYLE_IMAGES[`../assets/image/${file}`];

/* `label` is the display name; `file` is the exported asset. A few exports came
   through with typos (Miliionarire, Celesital, Glided) — the labels below are
   the corrected spellings. If the mock genuinely uses the misspellings, change
   the label, not the filename. */
const ART_STYLES = [
  { label: 'Wild Eccentrics', file: 'Wild Eccentrics.png' },
  { label: 'Botanical Muse', file: 'Botanical Muse.png' },
  { label: 'Ethereal Gaze', file: 'Ethereal gaze.png' },
  { label: 'Gaze of Power', file: 'Gaze Of Power.png' },
  { label: 'Gilded Bloom', file: 'Glided Bloom.png' },
  { label: 'Ink & Interval', file: 'Ink & Interval.png' },
  { label: 'Millionaire Art', file: 'Miliionarire Art.png' },
  { label: 'Modern Legend', file: 'Modern Legend.png' },
  { label: 'Nostalgia Noir', file: 'Nostalgia Noir.png' },
  { label: 'Sassy Classic', file: 'Sassy Classic.png' },
  { label: 'Tethered Horizons', file: 'Tethered Horizons.png' },
  { label: 'The Celestial Frontier', file: 'The Celesital Frontier.png' },
  { label: 'Velocity Suite', file: 'Velocity Suite.png' },
  { label: 'After Hour Suite', file: 'After Hour Suite.png' },
];

/* Questions and the shipping answer are transcribed from the design crop. The
   crop only shows the first item expanded, so the remaining four answers are
   written to match the live FAQ page where it covers the same ground (returns,
   framing) and are PLACEHOLDER where it does not (payment methods,
   international shipping) — confirm those two before this goes anywhere real. */
const FAQS = [
  {
    q: 'How long does shipping take?',
    a: 'We typically deliver within 5–7 business days across India. Express delivery is available for select PIN codes within 2–3 days.',
  },
  {
    q: 'What is your return policy?',
    a: 'Returns are accepted within 7 days of delivery. If your order arrives damaged, or we get a customisation wrong, we will replace it or refund you in full.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'All major credit and debit cards, UPI, net banking and popular wallets are accepted at checkout.',
  },
  {
    q: 'Are the canvases framed?',
    a: 'Every canvas is stretched by hand over a durable wooden frame and arrives ready to hang — no separate framing needed.',
  },
  {
    q: 'Do you ship internationally?',
    a: 'We currently ship across India. For international orders, write to us and we will arrange a quote for your location.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

const ArrowUpRight = ({ className = 'w-4 h-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
       strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
);

/* Hand-drawn swash under the second hero line, as in the design crop. */
const BrushUnderline = ({ className = '' }) => (
  <svg viewBox="0 0 200 12" preserveAspectRatio="none" aria-hidden="true" className={className}>
    <path d="M1 7C30 2 120 1 199 4.5C120 9.5 30 11 1 7Z" fill={ACCENT} />
  </svg>
);

/* 1248px content column — matches the exported cta.png width. */
const Shell = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-[1248px] px-5 sm:px-8 ${className}`}>{children}</div>
);

const SectionHeading = ({ children }) => (
  <h2 className="text-[20px] font-semibold tracking-[-0.02em] sm:text-[24px]" style={{ color: INK }}>
    {children}
  </h2>
);

/* ── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="relative">
      {/* 394px is the exported band height at 1440. Narrow screens get a taller
          band so the overlaid copy keeps its own room. */}
      <div className="relative min-h-[460px] sm:min-h-[394px] sm:h-[394px]">
        <img src={heroImage} alt="" aria-hidden="true"
             className="absolute inset-0 h-full w-full object-cover object-[72%_center] sm:object-right" />

        {/* Mobile: wash down from the top, since there is no room to clear the
            artwork horizontally. Desktop: lift only the left third, because the
            export already leaves that wall empty. */}
        <div className="absolute inset-0 sm:hidden"
             style={{ background: 'linear-gradient(180deg, rgba(250,246,240,0.96) 0%, rgba(250,246,240,0.92) 48%, rgba(250,246,240,0.55) 100%)' }} />
        <div className="absolute inset-0 hidden sm:block"
             style={{ background: 'linear-gradient(90deg, rgba(250,246,240,0.94) 0%, rgba(250,246,240,0.78) 28%, rgba(250,246,240,0) 56%)' }} />

        <Shell className="relative flex min-h-[460px] items-center sm:min-h-0 sm:h-full">
          <motion.div initial="hidden" animate="show" variants={fadeUp} className="max-w-[460px] py-12 sm:py-0">
            <p className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.22em] sm:text-[11px]"
               style={{ color: INK }}>
              Art for a brighter everyday
              <span className="h-[2px] w-7 shrink-0 rounded-full" style={{ backgroundColor: ACCENT }} />
            </p>

            <h1 className="mt-4 text-[30px] font-bold leading-[1.12] tracking-[-0.03em] sm:text-[38px]"
                style={{ color: INK }}>
              Art that makes your<br />
              <span className="relative inline-block">
                space yours
                <BrushUnderline className="absolute -bottom-1.5 left-0 h-[9px] w-[64%] sm:-bottom-2 sm:h-[11px]" />
              </span>
            </h1>

            <p className="mt-7 max-w-[340px] text-[13px] leading-[1.65] sm:mt-8 sm:text-[14px]" style={{ color: MUTED }}>
              Discover art crafted to transform everyday spaces into something extraordinary.
            </p>

            <Link
              to="/store"
              className="mt-6 inline-flex rounded-full px-6 py-3 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
              style={{ backgroundColor: ACCENT }}
            >
              Explore Collections
            </Link>
          </motion.div>
        </Shell>
      </div>
    </section>
  );
}

/* ── Find your art style ──────────────────────────────────────────────────── */
function ArtStyles() {
  return (
    <section className="py-12 sm:py-16">
      <Shell>
        <SectionHeading>Find your art style</SectionHeading>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0 }}
          variants={{ show: { transition: { staggerChildren: 0.035 } } }}
          className="mt-8 grid grid-cols-3 gap-x-3 gap-y-7 min-[420px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-7"
        >
          {ART_STYLES.map((style) => (
            <motion.li key={style.file} variants={fadeUp} className="text-center">
              <Link to="/store" className="group block">
                {/* 80px is the exported thumbnail size; it shrinks a little on
                    the narrowest screens so three still fit per row. */}
                <span className="mx-auto block h-[68px] w-[68px] overflow-hidden rounded-full ring-1 ring-black/5 sm:h-[80px] sm:w-[80px]">
                  <img src={styleSrc(style.file)} alt={style.label} loading="lazy"
                       className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.08]" />
                </span>
                <span className="mt-2.5 block text-[11px] font-medium leading-tight" style={{ color: INK }}>
                  {style.label}
                </span>
                <span className="mt-0.5 block text-[10px] leading-tight" style={{ color: MUTED }}>
                  Canvas
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </Shell>
    </section>
  );
}

/* ── Art in real life ─────────────────────────────────────────────────────── */
/* The mock's placeholder strip is filled by the home page's video slider.
   VideoShowcase brings its own section padding and background, so the heading
   sits above it and its built-in heading is suppressed. */
function ArtInRealLife() {
  return (
    <section>
      <Shell>
        <SectionHeading>Art in real life</SectionHeading>
      </Shell>
      <div className="-mt-4 sm:-mt-6">
        <VideoShowcase showHeading={false} />
      </div>
    </section>
  );
}

/* ── Find your next favourite ─────────────────────────────────────────────── */
function ProductGrid() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    /* Same source and fallback the home page's "Hot Selling" row uses, so the
       demo shows the real top sellers rather than invented cards. */
    const load = async () => {
      try {
        const res = await API.get('/products/hot-selling');
        if (!cancelled) {
          setProducts((res.data.products || []).slice(0, 6));
          setState('ready');
        }
      } catch (_) {
        try {
          const res = await API.get('/products', { params: { featured: true, limit: 6 } });
          if (!cancelled) {
            setProducts((res.data.products || []).slice(0, 6));
            setState('ready');
          }
        } catch (_e) {
          if (!cancelled) setState('error');
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, []);

  return (
    <section className="pb-12 sm:pb-16">
      <Shell>
        <SectionHeading>Find your next favourite</SectionHeading>

        {state === 'loading' && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-2xl ring-1 ring-black/[0.06]">
                <div className="aspect-[4/3] animate-pulse bg-black/[0.05]" />
                <div className="space-y-2 p-5">
                  <div className="h-2.5 w-24 animate-pulse rounded bg-black/[0.06]" />
                  <div className="h-4 w-40 animate-pulse rounded bg-black/[0.08]" />
                  <div className="h-3 w-28 animate-pulse rounded bg-black/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state === 'error' && (
          <p className="mt-8 text-[14px]" style={{ color: MUTED }}>
            Couldn&apos;t load products — is the API server running?
          </p>
        )}

        {state === 'ready' && (
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0 }}
            variants={{ show: { transition: { staggerChildren: 0.06 } } }}
            className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {products.map((p) => {
              const prices = [p.basePrice, ...(p.variations || []).map((v) => v.price)]
                .filter((n) => typeof n === 'number');
              const minPrice = prices.length ? Math.min(...prices) : (p.basePrice || 0);
              // subCategory carries the collection name the mock shows in the
              // brand line (e.g. "The Wild Eccentrics"); category is the coarser
              // "Wall Canvas" bucket, so it is only the fallback.
              const brand = p.subCategory || p.category?.name || 'GPSFDK';

              return (
                <motion.article
                  key={p._id}
                  variants={fadeUp}
                  className="group overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.06] transition-shadow duration-300 hover:shadow-[0_14px_44px_rgba(0,0,0,0.10)]"
                >
                  <Link to={`/product/${p.slug}`} className="block">
                    <div className="aspect-[4/3] overflow-hidden bg-black/[0.04]">
                      <img
                        src={optimizeImage(p.images?.[0]?.url, 600)}
                        onError={handleImageError}
                        alt={p.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                    </div>

                    <div className="flex items-start justify-between gap-4 p-5">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium uppercase tracking-[0.12em]" style={{ color: MUTED }}>
                          {brand}
                        </p>
                        <h3 className="mt-1.5 truncate text-[18px] font-semibold tracking-[-0.02em] sm:text-[19px]" style={{ color: INK }}>
                          {p.name}
                        </h3>
                        <p className="mt-1 text-[14px]" style={{ color: ACCENT }}>
                          Starting from {formatPrice(minPrice)}
                        </p>
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-1.5">
                        <span
                          className="flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: ACCENT }}
                        >
                          <ArrowUpRight />
                        </span>
                        <span className="text-[13px]" style={{ color: INK }}>View</span>
                      </div>
                    </div>
                  </Link>
                </motion.article>
              );
            })}
          </motion.div>
        )}
      </Shell>
    </section>
  );
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="pb-12 sm:pb-16">
      <Shell>
        <div className="grid gap-8 lg:grid-cols-[340px_1fr] lg:gap-16">
          <div>
            <h2 className="text-[26px] font-bold leading-[1.15] tracking-[-0.02em] sm:text-[32px]" style={{ color: INK }}>
              Frequently asked<br />questions
            </h2>

            {/* In the crop this card sits well below the heading rather than
                directly under it. */}
            <div className="mt-8 rounded-2xl p-6 sm:p-7 lg:mt-20" style={{ backgroundColor: PEACH }}>
              <p className="text-[16px] font-semibold" style={{ color: INK }}>Still have a question ?</p>
              <p className="mt-3 text-[13px] leading-[1.65]" style={{ color: MUTED }}>
                Can&apos;t find the answer to you questions? Send us an email and we&apos;ll get
                back to you as soon as possible !
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="mt-5 inline-flex rounded-full px-6 py-2.5 text-[13px] font-semibold text-white transition-transform duration-200 hover:-translate-y-0.5"
                style={{ backgroundColor: ACCENT }}
              >
                Send Email
              </a>
            </div>
          </div>

          <ul className="space-y-4">
            {FAQS.map((f, i) => {
              const isOpen = open === i;
              return (
                <li key={f.q} className="overflow-hidden rounded-2xl" style={{ backgroundColor: PEACH }}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? -1 : i)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6"
                  >
                    <span className="text-[14px] font-medium leading-[1.5] sm:text-[15px]" style={{ color: INK }}>
                      {f.q}
                    </span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white transition-transform duration-300"
                      style={{ backgroundColor: ACCENT, transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6"
                           strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                        <path d="m6 9 6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="-mt-1 px-5 pb-5 sm:px-6">
                      <p className="max-w-[640px] text-[13px] leading-[1.7]" style={{ color: MUTED }}>
                        {f.a}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </Shell>
    </section>
  );
}

/* ── Closing CTA banner ───────────────────────────────────────────────────── */
function CtaBanner() {
  return (
    <section className="pb-14 sm:pb-20">
      <Shell>
        {/* 1248x326 export — the artwork already carries the gradient, framed
            print and foliage, so only the copy is layered on top. The banner is
            very wide, so narrow screens crop it to keep the copy readable. */}
        <div className="relative overflow-hidden rounded-[20px] sm:rounded-3xl">
          <img src={ctaImage} alt="" aria-hidden="true"
               className="h-[240px] w-full object-cover object-center sm:h-auto" />

          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="max-w-[520px] text-center">
              <h2 className="text-[24px] font-bold tracking-[-0.02em] text-white sm:text-[30px]">
                Art that belongs to you
              </h2>
              <p className="mx-auto mt-2.5 max-w-[420px] text-[13px] leading-[1.6] text-white/95">
                Find a canvas that feels like it was made for your space.
              </p>
              <Link
                to="/store"
                className="mt-6 inline-flex rounded-full bg-white px-6 py-2.5 text-[13px] font-semibold transition-transform duration-200 hover:-translate-y-0.5"
                style={{ color: ACCENT }}
              >
                Explore Collections
              </Link>
            </div>
          </div>
        </div>
      </Shell>
    </section>
  );
}

export default function CanvasLandingV2() {
  return (
    <main className="bg-white">
      <SEO
        title="Canvas Page v2 — internal demo"
        description="Internal demo rebuild of the Canvas Page design. Not a live page."
        noindex
      />
      <Hero />
      <ArtStyles />
      <ArtInRealLife />
      <ProductGrid />
      <Faq />
      <CtaBanner />
    </main>
  );
}
