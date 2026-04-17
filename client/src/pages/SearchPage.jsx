import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import { optimizeImage } from '../utils/imageOptimizer';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const location = useLocation();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const currentPageRef = useRef(1);
  const initialLoadDone = useRef(false);

  const observerTarget = useRef(null);

  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  const fetchResults = async (pageToFetch, isAppend = false) => {
    if (!isAppend) setLoading(true);
    else setLoadingMore(true);

    try {
      const { data } = await API.get(`/products?search=${query}&limit=16&page=${pageToFetch}`);
      
      if (isAppend) {
        setProducts(prev => [...prev, ...data.products]);
      } else {
        setProducts(data.products);
      }
      
      setHasMore(data.products.length > 0 && data.page < data.pages);
      currentPageRef.current = data.page;

      if (!isAppend) {
        initialLoadDone.current = true;
        // Restore scroll position
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
      if (!isAppend) setLoading(false);
      else setLoadingMore(false);
    }
  };

  useEffect(() => {
    if (query) {
      setProducts([]);
      initialLoadDone.current = false;
      currentPageRef.current = 1;
      fetchResults(1, false);
    } else {
      setProducts([]);
      setLoading(false);
      setHasMore(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // Infinite Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && initialLoadDone.current) {
          fetchResults(currentPageRef.current + 1, true);
        }
      },
      { threshold: 0.1 }
    );
    
    // Have to capture ref current safely for cleanup
    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [hasMore, loading, loadingMore]);

  const handleProductClick = () => {
    sessionStorage.setItem(`scroll_${location.pathname}${location.search}`, window.scrollY.toString());
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20">
      <div className="max-w-[1200px] mx-auto px-[15px]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary">Search Results</h1>
          <p className="text-gray-500 mt-4 text-lg">Showing results for <span className="font-bold text-secondary">"{query}"</span></p>
        </motion.div>

        {loading && products.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <div className="text-6xl mb-6">🔍</div>
            <h2 className="text-2xl font-bold text-secondary mb-2">No products found</h2>
            <p className="text-gray-500 mb-8">We couldn't find anything matching your search. Please try a different keyword.</p>
            <Link to="/" className="btn-primary">Back to Home</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product, i) => (
                <motion.div
                  key={`${product._id}-${i}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: (i % 16) * 0.05 }}
                >
                  <Link to={`/product/${product.slug}`} onClick={handleProductClick} className="group block h-full">
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
                              <span className="text-gray-400 text-sm line-through ml-2 font-medium">
                                ₹{product.variations[0].comparePrice.toLocaleString()}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
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
                <p className="text-gray-400 font-medium">End of search results.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
