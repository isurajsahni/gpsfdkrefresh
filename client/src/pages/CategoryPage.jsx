import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import SEO from '../components/seo/SEO';
import ProductZigzagPage from '../components/home/ProductZigzagPage';
import NotFoundPage from './NotFoundPage';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage } from '../utils/imageOptimizer';

const SUBCATEGORIES = [
  'Ink & Interval', 'The Sassy Classic', 'Tethered Horizons', 'The Botanical Muse',
  'The Celestial Frontier', 'The Ethereal Gaze', 'The Gaze of Power',
  'The Modern Legend', 'The Gilded Bloom', 'The Velocity Suite',
  'Millionaire Art', 'Nostalgia Noir', 'The After Hour Suite', 'The Wild Eccentrics'
];

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
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const { formatPrice } = useCurrency();

  const generateSlug = (text) => text ? text.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]+/g, '') : '';

  const exactSubcategory = subcategorySlug 
    ? SUBCATEGORIES.find(s => generateSlug(s) === subcategorySlug)
    : null;

  const displaySubcategory = exactSubcategory || (subcategorySlug ? subcategorySlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setIsNotFound(false);

      if (!category) {
        try {
          const catRes = await API.get(`/categories/${slug}`);
          setCategory(catRes.data);
        } catch (e) {
          if (e.response?.status === 404) {
            setIsNotFound(true);
            setLoading(false);
            return;
          }
        }
      }

      const params = {
        categorySlug: slug,
        page: currentPage,
        limit: 12,
      };

      if (exactSubcategory) params.subCategoryExact = exactSubcategory;
      else if (subcategorySlug) params.subCategory = subcategorySlug;

      try {
        const { data } = await API.get('/products', { params });
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
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, subcategorySlug, currentPage]);

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

  if (isNotFound) {
    return <NotFoundPage />;
  }

  // Generate dynamic SEO based on category
  const dynamicTitle = displaySubcategory
    ? `${displaySubcategory} | Premium Custom Designs India`
    : category?.name
      ? `${category.name} | Shop Custom Designs in India`
      : 'Explore Premium Products | GPSFDK';

  const dynamicDescription = category?.description || "Browse our exclusive collection of premium canvas prints and house nameplates in India. Fast delivery and high-quality materials.";

  // House Nameplates special handling
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
              <Link to={`/wall-canvas`} className={`px-[11px] py-[6px] text-[11px] md:px-6 md:py-2.5 md:text-[12px] rounded-full font-semibold transition-colors ${!subcategorySlug ? 'bg-accent text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}>
                All Products
              </Link>
              {SUBCATEGORIES.map(sub => {
                const subSlug = generateSlug(sub);
                const isActive = subcategorySlug === subSlug;
                return (
                  <Link key={subSlug} to={`/wall-canvas/${subSlug}`} className={`px-[11px] py-[6px] text-[11px] md:px-6 md:py-2.5 md:text-[12px] rounded-full font-semibold transition-colors ${isActive ? 'bg-accent text-white' : 'bg-white/10 text-white/90 hover:bg-white/20'}`}>
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

      <div className="max-w-[1400px] mx-auto px-[15px] py-10">
        <div className="flex items-center justify-between mb-8">
          <p className="text-gray-500 font-medium">Showing {products.length} of {totalProducts} products</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
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
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (i % 12) * 0.05 }}
                  >
                    <Link to={`/product/${product.slug}`} onClick={handleProductClick} className="group block h-full">
                    {slug === 'wall-canvas' ? (
                      <div className="bg-[#fff7e7] rounded-xl p-[10px] h-full flex flex-col transition-transform duration-300 hover:-translate-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)]" data-badge={badgeType}>
                        <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden mb-5 bg-white shadow-sm">
                          <div 
                            className={`absolute top-2 left-2 z-10 text-[10px] px-2 py-1 rounded font-semibold text-white uppercase tracking-wider ${badgeColors[badgeType] || ''}`}
                            style={{ display: badgeType ? 'block' : 'none' }}
                          >
                            {badgeLabels[badgeType] || ''}
                          </div>
                          <img src={optimizeImage(product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600', 500)} alt={product.name} crossOrigin="anonymous" onError={(e) => { e.target.crossOrigin = null; e.target.src = product.images?.[0]?.url || ''; }} className="w-full h-full object-cover transition-transform duration-700 hover:scale-105" loading="lazy" />
                        </div>
                        <div className="flex flex-col flex-grow items-center justify-center text-center px-1">
                          <h3 className="font-heading text-[16px] font-semibold text-secondary uppercase tracking-wider mb-2 leading-snug">{product.name}</h3>
                          <p className="text-accent font-bold text-[16px] mb-5 tracking-wide">
                            {hasPriceRange ? `Starting from ${formatPrice(minPrice)}` : formatPrice(product.basePrice)}
                          </p>
                        </div>
                        <div className="w-full font-heading bg-accent text-white font-bold py-3.5 text-center transition-all hover:bg-accent-dark mt-auto rounded-lg shadow-sm hover:shadow-md">
                          Full details
                        </div>
                      </div>
                    ) : (
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
                    )}
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Traditional Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 mt-16 pb-8">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-sm border ${currentPage === 1 ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-secondary border-gray-200 hover:border-accent hover:text-accent'}`}
                >
                  <HiChevronLeft className="w-5 h-5" /> Previous
                </button>
                <div className="hidden sm:flex text-sm font-semibold text-gray-500 items-center justify-center min-w-[80px]">
                  {currentPage} <span className="mx-1 text-gray-300">/</span> {totalPages}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-sm border ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' : 'bg-white text-secondary border-gray-200 hover:border-accent hover:text-accent'}`}
                >
                  Next <HiChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
