import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductCard, { ProductCardSkeleton } from '../product/ProductCard';
import Pagination from '../common/Pagination';
import { cachedGet } from '../../utils/api';
import { ALL_CANVASES_ID } from '../../utils/collections';

/* ── Every canvas, best sellers first ─────────────────────────────────────────
   The listing under "Find your art style". It used to be a page of its own at
   /wall-canvas/all and keeps that page's cards, grid and 1400px wrapper, the
   same as each collection's listing at /wall-canvas/<collection>. ?page=N
   picks the page, and paging lands back on the listing's top. */

const PAGE_SIZE = 12;
const GRID = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';
const MESSAGE = 'py-20 text-center text-lg text-gray-500';

export default function CanvasCollection() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const [listing, setListing] = useState({ status: 'loading', products: [], total: 0, pages: 1 });

  useEffect(() => {
    // A later page supersedes this one; its response must not land
    let cancelled = false;
    const load = async () => {
      setListing((current) => ({ ...current, status: 'loading' }));
      try {
        const data = await cachedGet('/products', {
          params: { categorySlug: 'wall-canvas', sort: 'best_selling', page, limit: PAGE_SIZE },
        });
        if (cancelled) return;
        setListing({ status: 'ready', products: data.products || [], total: data.total || 0, pages: data.pages || 1 });

        // Back from a product: return to where the visitor was in the listing.
        // Smooth, like the scroll to the #anchor it follows: an instant
        // scroll wouldn't stop that one, which would then win.
        const scrollKey = `scroll_${location.pathname}${location.search}`;
        const savedPos = sessionStorage.getItem(scrollKey);
        if (savedPos) {
          sessionStorage.removeItem(scrollKey);
          setTimeout(() => window.scrollTo({ top: parseInt(savedPos, 10), behavior: 'smooth' }), 100);
        }
      } catch {
        if (!cancelled) setListing((current) => ({ ...current, status: 'error' }));
      }
    };
    load();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const goToPage = (next) => {
    if (next < 1 || next > listing.pages) return;
    const params = new URLSearchParams(searchParams);
    if (next === 1) params.delete('page');
    else params.set('page', String(next));
    const search = params.toString();
    navigate({ search: search ? `?${search}` : '', hash: `#${ALL_CANVASES_ID}` });
  };

  const rememberScroll = () => {
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, String(window.scrollY));
  };

  const { status, products, total, pages } = listing;

  return (
    <section id={ALL_CANVASES_ID} aria-label="All canvases" className="mx-auto max-w-[1400px] scroll-mt-20 px-[15px]">
      <div className="mb-8 flex min-h-[24px] items-center justify-between">
        {status === 'ready' && products.length > 0 && (
          <p className="font-medium text-gray-500">Showing {products.length} of {total} products</p>
        )}
      </div>

      {status === 'loading' && (
        <div className={GRID} aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
        </div>
      )}

      {status === 'error' && (
        <p className={MESSAGE}>Couldn&apos;t load the canvases just now. Please refresh the page to try again.</p>
      )}

      {status === 'ready' && products.length === 0 && (
        total > 0 ? (
          // ?page= past the last page
          <div className={MESSAGE}>
            <p>There are no canvases on this page.</p>
            <button onClick={() => goToPage(1)} className="btn-primary mt-6">Back to the first page</button>
          </div>
        ) : (
          <p className={MESSAGE}>New canvases are on their way. Check back soon.</p>
        )
      )}

      {status === 'ready' && products.length > 0 && (
        <>
          <div className={GRID}>
            {products.map((product, i) => (
              <motion.div
                key={`${product._id}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
              >
                <ProductCard product={product} onClick={rememberScroll} />
              </motion.div>
            ))}
          </div>
          <Pagination page={page} pages={pages} onChange={goToPage} />
        </>
      )}
    </section>
  );
}
