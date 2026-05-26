import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage } from '../utils/imageOptimizer';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    if (!query) {
      setProducts([]);
      setLoading(false);
      return;
    }

    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products?search=${query}&limit=12&page=${currentPage}`);
        setProducts(data.products);
        setTotalPages(data.pages || 1);
        setTotalProducts(data.total || 0);

        // Restore scroll position
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
    
    fetchResults();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', newPage.toString());
    navigate({ search: newParams.toString() });
  };

  const handleProductClick = () => {
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, window.scrollY.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20">
      <div className="max-w-[1200px] mx-auto px-[15px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary">Search Results</h1>
          <p className="text-gray-500 mt-4 text-lg">Showing {products.length} of {totalProducts} results for <span className="font-bold text-secondary">"{query}"</span></p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 && query ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-secondary mb-2">No products found</h2>
            <p className="text-gray-500 mb-8">We couldn't find anything matching your search. Please try a different keyword.</p>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </div>
        ) : query ? (
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
                                <span className="text-gray-400 text-sm line-through ml-2 font-medium">
                                  {formatPrice(product.variations[0].comparePrice)}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
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
        ) : null}
      </div>
    </div>
  );
};

export default SearchPage;
