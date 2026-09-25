import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import { Shell, SectionHeading } from './Layout';
import { fadeUp, stagger } from './motion';
import { useCurrency } from '../../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../../utils/imageOptimizer';
import API from '../../utils/api';

import viewCircle from '../../assets/image/canvas-v2/icons/view-circle.svg';
import viewArrow from '../../assets/image/canvas-v2/icons/view-arrow.svg';

/* ───────────────────────────────────────────────────────────────────────────
   "Find your next favourite" — the Canvas Page product grid.

   Figma (1440 frame): heading cap top at y=1616 (line box 1606.614), cards
   from y=1683 — 76.4 below the heading's line box top, i.e. 31.18 below its
   45.22px box. Cards are 380×440 on a 3-up grid with 30px gaps, the image
   380×330 at the top.

   Text is placed by Figma cap tops. With leading 1.19 a line box starts
   0.247×size above its cap top, so, measured down from the image's bottom:

     brand  12px  cap +20 → box +17.036
     title  20px  cap +44 → box +39.06   (7.744 under the brand's box)
     price  16px  cap +73 → box +69.048  (6.188 under the title's box)
     circle 40px  top +20, right edge 20.5 in from the card's
     View   16px  cap +73 → box +69.048  (9.048 under the circle)

   Both columns end at +88.09; the 110px text block (440 − 330) keeps the
   remainder as bottom padding.
   ─────────────────────────────────────────────────────────────────────────── */

const GRID =
  'mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:mt-[31.18px] lg:grid-cols-3 lg:gap-[30px]';
const CARD = 'flex h-full flex-col rounded-[15px] bg-white shadow-[0px_4px_22px_0px_rgba(0,0,0,0.15)]';
const IMAGE_BOX = 'aspect-[380/330] overflow-hidden rounded-t-[15px]';
const TEXT_BLOCK = 'flex min-h-[110px] items-start gap-3 pl-5 pr-[20.5px]';
const MESSAGE = 'mt-6 text-[14px] leading-[1.5] text-[#6b6b70] lg:mt-[31.18px]';

/* "Starting from" = the cheapest of the base price and every variation. */
const minPriceOf = (p) => {
  const prices = [p.basePrice, ...(p.variations || []).map((v) => v.price)].filter(
    (n) => Number.isFinite(n) && n > 0,
  );
  return prices.length ? Math.min(...prices) : p.basePrice || 0;
};

function ProductCard({ product: p, formatPrice }) {
  // subCategory carries the collection name the mock shows in the brand line
  // ("The Wild Eccentrics"); category is the coarser bucket, so only a fallback.
  const brand = p.subCategory || p.category?.name || 'GPSFDK';

  return (
    <motion.li variants={fadeUp} className="min-w-0">
      <Link
        to={`/product/${p.slug}`}
        className={`group ${CARD} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent`}
      >
        {/* The mock's photo is 4:5 (as are the real ones): Figma scales it to
            380×475 and lifts it 32.5px — 32.5 / (475 − 330) = 22.4% down the
            overflow. `isolate` keeps Safari clipping the corners mid-zoom. */}
        <div className={`isolate bg-[#f4f4f4] ${IMAGE_BOX}`}>
          <img
            src={optimizeImage(p.images?.[0]?.url, 760)}
            onError={handleImageError}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover object-[center_22.4%] transition-transform duration-500 ease-out group-hover:scale-[1.04]"
          />
        </div>

        <div className={TEXT_BLOCK}>
          <div className="min-w-0 flex-1 pt-[17.036px]">
            <p className="truncate text-[12px] font-medium uppercase leading-[1.19] tracking-[0.6px] text-[#3f3f3f]">
              {brand}
            </p>
            <h3 className="mt-[7.744px] truncate text-[20px] font-medium leading-[1.19] text-black">{p.name}</h3>
            <p className="mt-[6.188px] truncate text-[16px] font-normal leading-[1.19] text-accent">
              Starting from {formatPrice(minPriceOf(p))}
            </p>
          </div>

          <div className="flex w-10 shrink-0 flex-col items-center pt-5">
            <span aria-hidden="true" className="grid place-items-center">
              <img src={viewCircle} alt="" className="col-start-1 row-start-1" />
              {/* Exported pointing down; Figma turns it −135° to point up-right. */}
              <img src={viewArrow} alt="" className="col-start-1 row-start-1 rotate-[-135deg]" />
            </span>
            <span className="mt-[9.048px] whitespace-nowrap text-[16px] font-normal leading-[1.19] text-[#3f3f3f]">
              View
            </span>
          </div>
        </div>
      </Link>
    </motion.li>
  );
}

/* Same geometry as a card; the bars sit on the cap-height bands of the text
   they stand in for (brand 20–29, title 44–58, price/View 73–84). */
function CardSkeleton() {
  return (
    <li className={`min-w-0 ${CARD}`}>
      <div className={`animate-pulse bg-black/[0.05] ${IMAGE_BOX}`} />
      <div className={`${TEXT_BLOCK} pt-5`}>
        <div className="min-w-0 flex-1">
          <div className="h-[9px] w-28 max-w-full animate-pulse rounded bg-black/[0.06]" />
          <div className="mt-[15px] h-[14px] w-44 max-w-full animate-pulse rounded bg-black/[0.08]" />
          <div className="mt-[15px] h-[11px] w-32 max-w-full animate-pulse rounded bg-black/[0.06]" />
        </div>
        <div className="flex w-10 shrink-0 flex-col items-center">
          <div className="size-10 animate-pulse rounded-full bg-black/[0.06]" />
          <div className="mt-[13px] h-[11px] w-9 animate-pulse rounded bg-black/[0.06]" />
        </div>
      </div>
    </li>
  );
}

export default function ProductGrid() {
  const { formatPrice } = useCurrency();
  const [products, setProducts] = useState([]);
  const [state, setState] = useState('loading');

  useEffect(() => {
    let cancelled = false;

    /* Same source and fallback as the home page's "Hot Selling" row, so the
       grid shows the real top sellers rather than invented cards. An empty
       hot-selling list also falls back to featured products. */
    const load = async () => {
      let list = null;
      try {
        const res = await API.get('/products/hot-selling');
        list = res.data?.products || [];
      } catch {
        // Fall through to featured.
      }
      if (!list?.length) {
        try {
          const res = await API.get('/products', { params: { featured: true, limit: 6 } });
          list = res.data?.products || [];
        } catch {
          // Keep the hot-selling result, if that request got through.
        }
      }
      if (cancelled) return;
      if (list) {
        setProducts(list.slice(0, 6));
        setState('ready');
      } else {
        setState('error');
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="px-5 sm:px-8">
      <Shell>
        {/* On phones the heading wraps, and the button sits by its last line */}
        <div className="flex items-end justify-between gap-4 sm:items-center">
          <SectionHeading className="min-w-0">Find your next favourite</SectionHeading>
          <Link
            to="/wall-canvas/all"
            className="group inline-flex h-10 shrink-0 items-center gap-1.5 rounded-[40px] border-[1.5px] border-accent px-5 text-[14px] font-medium leading-[1.19] text-accent transition-colors duration-300 hover:bg-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 sm:h-[45px] sm:px-6 sm:text-[16px]"
          >
            View all
            <HiArrowRight aria-hidden="true" className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>

        {state === 'loading' && (
          <ul className={GRID} aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 6 }, (_, i) => (
              <CardSkeleton key={i} />
            ))}
          </ul>
        )}

        {state === 'error' && <p className={MESSAGE}>Couldn&apos;t load products — is the API server running?</p>}

        {state === 'ready' && products.length === 0 && <p className={MESSAGE}>No products to show yet.</p>}

        {state === 'ready' && products.length > 0 && (
          <motion.ul
            initial="hidden"
            whileInView="show"
            // A margin rather than an `amount`: one column of six cards is
            // ~2500px tall on a phone, and a fraction of that would leave the
            // first card blank for a long scroll.
            viewport={{ once: true, margin: '0px 0px -80px 0px' }}
            variants={stagger(0.03)}
            className={GRID}
          >
            {products.map((p) => (
              <ProductCard key={p._id} product={p} formatPrice={formatPrice} />
            ))}
          </motion.ul>
        )}
      </Shell>
    </section>
  );
}
