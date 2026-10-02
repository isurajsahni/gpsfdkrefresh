import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import { cachedGet, isNotFound as isApiNotFound } from '../utils/api';
import SEO from '../components/seo/SEO';
import ProductZigzagPage from '../components/home/ProductZigzagPage';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import Pagination from '../components/common/Pagination';
import NotFoundPage from './NotFoundPage';
import LoadErrorNotice from '../components/common/LoadErrorNotice';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage } from '../utils/imageOptimizer';
import { COLLECTIONS as SUBCATEGORIES, collectionSlug as generateSlug } from '../utils/collections';
import { CANVAS_PATH } from '../utils/categoryPath';
import { SectionHeading } from '../components/canvas-v2/Layout';
import StyleCircle from '../components/canvas-v2/StyleCircle';
import { ART_STYLES, ALL_PRODUCTS_STYLE } from '../components/canvas-v2/artStyles';

// /wall-canvas/<collection> lists one canvas collection. /wall-canvas and
// /wall-canvas/all redirect to /canvas, which lists every canvas.

const SITE_URL = 'https://www.gpsfdk.com';
const PAGE_SIZE = 12;

// Rendered by ProductZigzagPage, which fetches its own products
const ZIGZAG_SLUG = 'house-nameplates';

// The /canvas page's column, which the Wall Canvas listings' header shares: a
// 1200px <Shell> inside px-5 sm:px-8 sections (1264 = 1200 + 2 × 32). Their
// product grid keeps the wider listing wrapper below.
const CANVAS_COLUMN = 'mx-auto max-w-[1264px] px-5 sm:px-8';

const CategoryPage = () => {
  const { slug, subcategorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isNotFound, setIsNotFound] = useState(false);
  // True only when the listing loaded and has no products; a failed request
  // must never mark the page noindex.
  const [isEmpty, setIsEmpty] = useState(false);
  // The product list failed to load (timeout, rate limit, server error):
  // offer a retry rather than "Coming Soon"
  const [loadError, setLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const { formatPrice } = useCurrency();

  const exactSubcategory = subcategorySlug 
    ? SUBCATEGORIES.find(s => generateSlug(s) === subcategorySlug)
    : null;

  // Only the collections in SUBCATEGORIES exist. Any other /:slug/:subcategory
  // is a 404 rather than an indexable, empty "collection" for whatever was typed.
  const isUnknownSubcategory = Boolean(subcategorySlug) && !exactSubcategory;

  // Below lg the art styles are one sideways-scrolling row: bring the current
  // collection's circle into view
  const styleRowRef = useRef(null);
  useEffect(() => {
    const row = styleRowRef.current;
    const active = row?.querySelector('[data-active="true"]');
    if (!row || !active || row.scrollWidth <= row.clientWidth) return;
    row.scrollLeft = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
  }, [subcategorySlug]);

  useEffect(() => {
    if (isUnknownSubcategory) return;
    // A later navigation supersedes this one; its responses must not land
    let cancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      setIsNotFound(false);
      setIsEmpty(false);
      setLoadError(false);

      const params = {
        categorySlug: slug,
        page: currentPage,
        limit: PAGE_SIZE,
      };

      if (exactSubcategory) params.subCategoryExact = exactSubcategory;

      // The category and its products don't depend on each other, so they're
      // fetched together rather than one after the other.
      const [catResult, productsResult] = await Promise.allSettled([
        // Refetch when the slug changes: the component is reused across category
        // routes, so a stale category would title /house-nameplates "Wall Canvas".
        category?.slug !== slug ? cachedGet(`/categories/${slug}`) : null,
        // The nameplate listing (ProductZigzagPage) loads its own products.
        slug === ZIGZAG_SLUG ? null : cachedGet('/products', { params }),
      ]);
      if (cancelled) return;

      if (catResult.status === 'rejected' && isApiNotFound(catResult.reason)) {
        setIsNotFound(true);
        setLoading(false);
        return;
      }
      if (catResult.value) setCategory(catResult.value);

      if (productsResult.status === 'rejected') {
        console.error(productsResult.reason);
        setLoadError(true);
      } else if (productsResult.value) {
        const data = productsResult.value;
        setIsEmpty(data.total === 0);
        setTotalProducts(data.total);
        setTotalPages(data.pages);
        setProducts(data.products);

        // Restore scroll position logic if returning to page
        const scrollKey = `scroll_${location.pathname}${location.search}`;
        const savedPos = sessionStorage.getItem(scrollKey);
        if (savedPos) {
          setTimeout(() => window.scrollTo(0, parseInt(savedPos, 10)), 100);
          sessionStorage.removeItem(scrollKey);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
      setLoading(false);
    };

    fetchProducts();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategorySlug, currentPage, reloadKey]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    navigate({ search: newParams.toString() });
  };

  const handleProductClick = () => {
    // Save scroll position
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, window.scrollY.toString());
  };

  if (isNotFound || isUnknownSubcategory) {
    return <NotFoundPage />;
  }

  // Generate dynamic SEO based on category
  const dynamicTitle = exactSubcategory
    ? `${exactSubcategory} | Premium Custom Designs India`
    : category?.name
      ? `${category.name} | Shop Custom Designs in India`
      : 'Explore Premium Products | GPSFDK';

  const dynamicDescription = category?.description || "Browse our exclusive collection of premium canvas prints and house nameplates in India. Fast delivery and high-quality materials.";

  // Home → category (→ collection), mirroring the visible navigation
  const breadcrumbSchema = category?.name ? {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      exactSubcategory
        ? { '@type': 'ListItem', position: 2, name: category.name, item: `${SITE_URL}${slug === 'wall-canvas' ? CANVAS_PATH : `/${slug}`}` }
        : { '@type': 'ListItem', position: 2, name: category.name },
      ...(exactSubcategory ? [{ '@type': 'ListItem', position: 3, name: exactSubcategory }] : []),
    ],
  } : null;
  // The collection's own products, for search engines' "ItemList" rich results
  const itemListSchema = !loading && products.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, i) => ({
      '@type': 'ListItem',
      position: (currentPage - 1) * PAGE_SIZE + i + 1,
      url: `${SITE_URL}/product/${product.slug}`,
      name: product.name,
    })),
  } : null;

  // House Nameplates special handling
  if (slug === ZIGZAG_SLUG) {
    return <ProductZigzagPage category={category} slug={slug} />;
  }

  return (
    // Wall Canvas listings are white like /canvas, whose art-style circles head them
    <div className={`min-h-screen ${slug === 'wall-canvas' ? 'bg-white' : 'bg-gray-50'} pt-[60px] pb-12`}>
      {/* An empty listing is a soft 404; it becomes indexable again on its own
          once products are added. */}
      <SEO
        title={dynamicTitle}
        description={dynamicDescription}
        image={products[0]?.images?.[0]?.url ? optimizeImage(products[0].images[0].url, 1200) : undefined}
        schema={[breadcrumbSchema, itemListSchema].filter(Boolean)}
        noindex={isEmpty}
      />
      
      {/* Header Area */}
      {slug === 'wall-canvas' ? (
        // The /canvas page's "Find your art style" circles, led by All Products
        // (the listing on /canvas) and ending with Custom Canvas (which opens
        // the customiser), in the same column and on the same tracks as there.
        // Kept short so the first products are visible without scrolling: one
        // sideways-scrolling row below lg, two rows of eight from lg.
        <div className={`${CANVAS_COLUMN} pt-8 lg:pt-12`}>
          <SectionHeading as="h1">
            {exactSubcategory || 'Canvas for your soul'}
          </SectionHeading>

          {/* Fixed-width items in the row keep the overhanging labels clear of
              each other; py-1 leaves room for the active ring's offset. */}
          <ul ref={styleRowRef} className="relative -mx-5 mt-5 flex gap-x-1 overflow-x-auto px-5 py-1 scrollbar-hide sm:-mx-8 sm:mt-7 sm:gap-x-2 sm:px-8 lg:mx-0 lg:mt-[31.18px] lg:grid lg:grid-cols-8 lg:gap-x-0 lg:gap-y-[42.18px] lg:overflow-visible lg:px-0 xl:grid-cols-[repeat(8,80px)] xl:gap-x-20 xl:pl-1">
            {[ALL_PRODUCTS_STYLE, ...ART_STYLES].map((style) => {
              const isActive = Boolean(style.collection) && style.collection === exactSubcategory;
              return (
                <li key={style.to} data-active={isActive} className="w-[76px] shrink-0 sm:w-[96px] lg:w-auto">
                  <StyleCircle {...style} active={isActive} />
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <div className="bg-secondary section-padding py-16">
          <div className="max-w-[1200px] mx-auto">
            <div>
              <nav className="text-white/50 text-sm mb-4">
                <Link to="/" className="hover:text-white">Home</Link> <span className="mx-2">/</span>
                {subcategorySlug ? (
                  <>
                    <Link to={`/${slug}`} className="hover:text-white">{category?.name || '…'}</Link>
                    <span className="mx-2">/</span> <span className="text-white">{exactSubcategory}</span>
                  </>
                ) : (
                  <span className="text-white">{category?.name || '…'}</span>
                )}
              </nav>
              {exactSubcategory || category?.name ? (
                <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">{exactSubcategory || category.name}</h1>
              ) : (
                <div className="h-12 w-64 max-w-full rounded-lg bg-white/10 animate-pulse" aria-hidden="true" />
              )}
              <p className="text-white/60 mt-3 max-w-xl">{category?.description}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[1400px] mx-auto px-[15px] py-10">
        <div className="flex items-center justify-between mb-8 min-h-[24px]">
          {!loading && products.length > 0 && (
            <p className="text-gray-500 font-medium">Showing {products.length} of {totalProducts} products</p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : loadError ? (
          <LoadErrorNotice
            onRetry={() => setReloadKey((k) => k + 1)}
            className="bg-white rounded-2xl shadow-sm border border-gray-100"
          />
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-2xl font-heading font-semibold text-secondary mb-2">Coming Soon</h3>
            <p className="text-gray-500 text-lg max-w-md mx-auto">
              We're crafting something special for this collection. Check back shortly &mdash; new designs drop here first.
            </p>
            <Link to="/" className="btn-primary mt-6 inline-block">Explore Other Collections</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, i) => {
                const prices = [
                  product.basePrice,
                  ...(product.variations || []).map(v => v.price)
                ].filter(p => typeof p === 'number' && p > 0);
                const minPrice = prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);
                const maxPrice = prices.length > 0 ? Math.max(...prices) : (product.basePrice || 0);
                const hasPriceRange = minPrice !== maxPrice;

                // Determine badge type
                let badgeType = "";
                const variations = product.variations || [];
                const totalStock = variations.reduce((acc, v) => acc + (v.stock || 0), 0);
                if (variations.length > 0 && totalStock > 0 && totalStock <= 10) {
                  badgeType = "lowstock";
                } else if (product.featured) {
                  badgeType = "bestseller";
                } else if (product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
                  badgeType = "new";
                }

                const badgeColors = {
                  bestseller: 'bg-[#F5A623]',
                  new: 'bg-[#27AE60]',
                  lowstock: 'bg-[#E74C3C]'
                };

                const badgeLabels = {
                  bestseller: 'Bestseller',
                  new: 'New Arrival',
                  lowstock: 'Low Stock'
                };

                return (
                  <motion.div
                    key={`${product._id}-${i}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(i, 8) * 0.02 }}
                  >
                    {slug === 'wall-canvas' ? (
                      <ProductCard product={product} onClick={handleProductClick} />
                    ) : (
                    <Link to={`/product/${product.slug}`} onClick={handleProductClick} className="group block h-full">
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 p-3 h-full flex flex-col transition-all hover:shadow-md" data-badge={badgeType}>
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-cream-dark mb-4">
                          <div 
                            className={`absolute top-2 left-2 z-10 text-[10px] px-2 py-1 rounded font-semibold text-white uppercase tracking-wider ${badgeColors[badgeType] || ''}`}
                            style={{ display: badgeType ? 'block' : 'none' }}
                          >
                            {badgeLabels[badgeType] || ''}
                          </div>
                          <img
                            src={optimizeImage(product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', 500)}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (product.variations?.length > 0) {
                                  addToCart(product, product.variations[0]);
                                  setIsCartOpen(true);
                                }
                              }}
                              className="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-full text-sm font-semibold flex items-center gap-2 w-fit transition-all shadow-lg"
                            >
                              <HiOutlineShoppingCart className="w-4 h-4" /> Quick Add
                            </button>
                          </div>
                        </div>
                        <div className="px-1 flex-grow flex flex-col">
                          <h3 className="font-heading text-lg font-bold text-secondary group-hover:text-accent transition-colors leading-tight mb-2">{product.name}</h3>
                          <div className="mb-2">
                            <span className="font-heading text-base font-bold text-[#1A1A1A]">
                              {hasPriceRange ? `Starting from ${formatPrice(minPrice)}` : formatPrice(product.basePrice)}
                            </span>
                          </div>
                          <div className="mt-auto pt-2">
                            <p className="text-accent font-bold text-lg">
                              {formatPrice(product.basePrice)}
                              {product.variations?.[0]?.comparePrice > 0 && (
                                <span className="text-gray-400 text-sm line-through ml-2 font-medium">{formatPrice(product.variations[0].comparePrice)}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <Pagination page={currentPage} pages={totalPages} onChange={handlePageChange} />
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
