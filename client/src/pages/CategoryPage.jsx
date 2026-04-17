import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiOutlineAdjustments, HiX } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import SEO from '../components/seo/SEO';
import ProductZigzagPage from '../components/home/ProductZigzagPage';
import { optimizeImage } from '../utils/imageOptimizer';

const SUBCATEGORIES = [
  'The Sassy Classic', 'Tethered Horizons', 'The Botanical Muse',
  'The Celestial Frontier', 'The Ethereal Gaze', 'The Gaze of Power',
  'The Modern Legend', 'The Gilded Bloom', 'The Velocity Suite',
  'Millionaire Art', 'Nostalgia Noir', 'The After Hour Suite', 'Ink & Interval', 'The Wild Eccentrics'
];

const CategoryPage = () => {
  const { slug, subcategorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  const observerTarget = useRef(null);
  
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  const generateSlug = (text) => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : '';

  const exactSubcategory = subcategorySlug 
    ? SUBCATEGORIES.find(s => generateSlug(s) === subcategorySlug)
    : null;

  const displaySubcategory = exactSubcategory || (subcategorySlug ? subcategorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null);

  // Extract Filters from URL
  const currentSort = searchParams.get('sort') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  // When we mount, determine if user had visited this with page > 1
  const initialPage = parseInt(searchParams.get('page') || '1', 10);
  const currentPageRef = useRef(initialPage);
  
  // To avoid reloading the same stuff when setting scroll position
  const initialLoadDone = useRef(false);

  const fetchProducts = async (pageToFetch, limitOverride = null, append = false) => {
    try {
      if (!append) setLoading(true);
      else setLoadingMore(true);

      if (!category && !append) {
        try {
          const catRes = await API.get(`/categories/${slug}`);
          setCategory(catRes.data);
        } catch (e) {
          // ignore, might just be a standard slug
        }
      }

      const params = {
        categorySlug: slug,
        page: pageToFetch,
        limit: limitOverride || 16,
      };

      if (exactSubcategory) params.subCategoryExact = exactSubcategory;
      else if (subcategorySlug) params.subCategory = subcategorySlug;

      if (currentSort) params.sort = currentSort;
      if (currentMinPrice) params.minPrice = currentMinPrice;
      if (currentMaxPrice) params.maxPrice = currentMaxPrice;

      const { data } = await API.get('/products', { params });
      
      setTotalProducts(data.total);
      
      if (append) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }
      
      setHasMore(data.products.length > 0 && data.page < data.pages);
      currentPageRef.current = data.page;

      if (!append) {
        initialLoadDone.current = true;
        // Restore scroll position logic
        const scrollKey = `scroll_${location.pathname}${location.search}`;
        const savedPos = sessionStorage.getItem(scrollKey);
        if (savedPos) {
          setTimeout(() => window.scrollTo(0, parseInt(savedPos, 10)), 100);
          sessionStorage.removeItem(scrollKey);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Initial Fetch
  useEffect(() => {
    // If the URL says page=3, we want to fetch the first 3 pages on initial load (3 * 16 = 48 items)
    // Then subsequent fetches will just be limit 16, page 4
    setProducts([]); // reset
    const fetchInit = async () => {
      const limit = initialPage > 1 ? initialPage * 16 : 16;
      // Note: backend uses skip = (page-1)*limit. 
      // If we ask for page=1, limit=48, we get items 1-48.
      // Next time we will ask for page=4, limit=16 inside loadMore logic
      await fetchProducts(1, limit, false);
      if (initialPage > 1) {
        currentPageRef.current = initialPage;
      }
    };
    fetchInit();
    // We purposefully do NOT include everything in dependencies to avoid double fetching loops
    // We just want it to run when these major params change:
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategorySlug, currentSort, currentMinPrice, currentMaxPrice]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && initialLoadDone.current) {
          handleLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }
    return () => {
      if (observerTarget.current) observer.unobserve(observerTarget.current);
    };
  }, [hasMore, loading, loadingMore]);

  const handleLoadMore = () => {
    const nextPage = currentPageRef.current + 1;
    // Update URL quietly
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', nextPage.toString());
    navigate({ search: newParams.toString() }, { replace: true });
    
    fetchProducts(nextPage, 16, true);
  };

  const updateFilters = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    // Reset page on filter change
    newParams.delete('page');
    setSearchParams(newParams);
  };
  
  const handleProductClick = () => {
    // Save scroll position
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, window.scrollY.toString());
  };

  // Generate dynamic SEO based on category
  const dynamicTitle = displaySubcategory
    ? `${displaySubcategory} | Premium Custom Designs India`
    : category?.name
      ? `${category.name} | Shop Custom Designs in India`
      : 'Explore Premium Products | GPSFDK';

  const dynamicDescription = category?.description || "Browse our exclusive collection of premium wall canvas prints and house nameplates in India. Fast delivery and high-quality materials.";

  // House Nameplates special handling bypasses infinite scroll mapping
  if (slug === 'house-nameplates') {
    return <ProductZigzagPage category={category} slug={slug} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-[80px] pb-12">
      <SEO title={dynamicTitle} description={dynamicDescription} />
      
      {/* Header Area */}
      {slug === 'wall-canvas' ? (
        <div className="bg-secondary section-padding py-12 md:py-20 text-center text-white relative flex flex-col items-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-heading font-normal mb-10 tracking-[0.05em] text-white"
          >
            Canvas for your soul
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="max-w-5xl w-full border border-accent/40 rounded-2xl p-[16px] md:p-8 text-left bg-black/10 backdrop-blur-sm"
          >
            <h3 className="text-accent text-[12px] font-bold tracking-[0.2em] uppercase mb-6">MATCH YOUR VIBE</h3>
            <div className="flex flex-wrap gap-x-3 gap-y-4">
              <Link to={`/wall-canvas`} className={`px-[15px] md:px-6 py-2.5 rounded-full text-[12px] font-semibold transition-colors ${!subcategorySlug ? 'bg-accent text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}>
                All Products
              </Link>
              {SUBCATEGORIES.map(sub => {
                const subSlug = generateSlug(sub);
                const isActive = subcategorySlug === subSlug;
                return (
                  <Link key={subSlug} to={`/wall-canvas/${subSlug}`} className={`px-[15px] md:px-6 py-2.5 rounded-full text-[12px] font-semibold transition-colors ${isActive ? 'bg-accent text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}>
                    {sub}
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </div>
      ) : (
        <div className="bg-secondary section-padding py-16">
          <div className="max-w-[1200px] mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <nav className="text-white/50 text-sm mb-4">
                <Link to="/" className="hover:text-white">Home</Link> <span className="mx-2">/</span>
                {subcategorySlug ? (
                  <>
                    <Link to={`/${slug}`} className="hover:text-white">{category?.name || slug}</Link>
                    <span className="mx-2">/</span> <span className="text-white">{displaySubcategory}</span>
                  </>
                ) : (
                  <span className="text-white">{category?.name || slug}</span>
                )}
              </nav>
              <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">{displaySubcategory || category?.name || slug}</h1>
              <p className="text-white/60 mt-3 max-w-xl">{category?.description}</p>
            </motion.div>
          </div>
        </div>
      )}

      {/* Main Layout Area */}
      <div className="max-w-[1400px] mx-auto px-[15px] py-10 flex flex-col md:flex-row gap-8">
        
        {/* Mobile Filter Button */}
        <div className="md:hidden flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <span className="text-sm font-semibold">{totalProducts} Products</span>
          <button onClick={() => setIsFilterOpen(true)} className="flex items-center gap-2 text-sm font-semibold text-secondary hover:text-accent">
            <HiOutlineAdjustments className="w-5 h-5" /> Filters & Sort
          </button>
        </div>

        {/* Sidebar Fillters (Sticky on Desktop) */}
        <div className={`fixed inset-0 z-[1000] bg-black/50 transition-opacity duration-300 md:hidden ${isFilterOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsFilterOpen(false)} />
        <div className={`fixed inset-y-0 left-0 bg-white shadow-xl z-[1001] w-[280px] p-6 transform transition-transform duration-300 overflow-y-auto md:relative md:transform-none md:w-[260px] md:shadow-none md:p-0 md:bg-transparent md:z-auto md:shrink-0 ${isFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
          <div className="sticky top-[100px] space-y-8">
            <div className="flex md:hidden justify-between items-center mb-6">
              <h3 className="font-heading font-bold text-xl">Filters</h3>
              <button onClick={() => setIsFilterOpen(false)}><HiX className="w-6 h-6 text-gray-400" /></button>
            </div>
            
            {/* Sort */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-secondary mb-4">Sort By</h3>
              <select 
                value={currentSort} 
                onChange={(e) => updateFilters('sort', e.target.value)}
                className="w-full text-sm border-gray-200 rounded-lg focus:ring-accent focus:border-accent p-2.5"
              >
                <option value="">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="name">Alphabetical, A-Z</option>
              </select>
            </div>

            {/* Price Filter */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-secondary mb-4">Price Range</h3>
              <div className="flex gap-2 items-center">
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={currentMinPrice} 
                  onChange={(e) => updateFilters('minPrice', e.target.value)}
                  className="w-full text-sm border-gray-200 rounded-lg focus:ring-accent p-2 text-center"
                />
                <span className="text-gray-400">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={currentMaxPrice} 
                  onChange={(e) => updateFilters('maxPrice', e.target.value)}
                  className="w-full text-sm border-gray-200 rounded-lg focus:ring-accent p-2 text-center"
                />
              </div>
            </div>
            
            {/* Clear Filters */}
            {(currentSort || currentMinPrice || currentMaxPrice) && (
              <button 
                onClick={() => {
                  setSearchParams(new URLSearchParams());
                  setIsFilterOpen(false);
                }}
                className="w-full py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
            
            <div className="md:hidden pt-4">
              <button onClick={() => setIsFilterOpen(false)} className="btn-primary w-full py-3">Apply Filters</button>
            </div>
          </div>
        </div>

        {/* Product Grid Area */}
        <div className="flex-1">
          <div className="hidden md:flex items-center justify-between mb-6 px-2">
            <p className="text-gray-500 font-medium">{totalProducts} products</p>
          </div>

          {loading && products.length === 0 ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
              <p className="text-gray-500 text-lg">No products found matching your filters.</p>
              <button onClick={() => setSearchParams(new URLSearchParams())} className="btn-primary mt-4 inline-block">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, i) => (
                  <motion.div
                    key={`${product._id}-${i}`} // i added just in case of slight duplicates on fast scroll
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 16) * 0.05 }}
                  >
                    <Link to={`/product/${product.slug}`} onClick={handleProductClick} className="group block h-full">
                    {slug === 'wall-canvas' ? (
                      <div className="bg-[#fff7e7] rounded-xl p-[10px] h-full flex flex-col transition-transform duration-300 hover:-translate-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                        <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden mb-5 bg-white shadow-sm">
                          <img src={optimizeImage(product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', 500)} alt={product.name} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                        </div>
                        <div className="flex flex-col flex-grow items-center justify-center text-center px-1">
                          <h3 className="font-heading text-[16px] font-semibold text-secondary uppercase tracking-wider mb-2 leading-snug">{product.name}</h3>
                          <p className="text-accent font-bold text-[16px] mb-5 tracking-wide">
                            ₹{product.basePrice?.toLocaleString('en-IN')}
                            {product.variations?.length > 1 && ` – ₹${Math.max(...product.variations.map(v => v.price)).toLocaleString('en-IN')}`}
                          </p>
                        </div>
                        <div className="w-full font-heading bg-accent text-white font-bold py-3.5 text-center transition-all hover:bg-accent-dark mt-auto rounded-lg shadow-sm hover:shadow-md">
                          Full details
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-gray-200 p-3 h-full flex flex-col transition-all hover:shadow-md">
                        <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-cream-dark mb-4">
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
                          <div className="mt-auto pt-2">
                            <p className="text-accent font-bold text-lg">
                              ₹{product.basePrice?.toLocaleString()}
                              {product.variations?.[0]?.comparePrice > 0 && (
                                <span className="text-gray-400 text-sm line-through ml-2 font-medium">₹{product.variations[0].comparePrice.toLocaleString()}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Link>
                </motion.div>
                ))}
              </div>

              {/* Intersection Observer Target for Infinite Scroll */}
              <div ref={observerTarget} className="py-12 mt-4 flex items-center justify-center">
                {loadingMore && (
                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
                )}
                {!hasMore && products.length > 0 && (
                  <p className="text-gray-400 font-medium">No more products to show.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CategoryPage;
