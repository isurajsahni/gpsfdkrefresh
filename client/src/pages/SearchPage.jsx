import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products?search=${query}&limit=50`);
        setProducts(data.products);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    if (query) {
      fetchResults();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [query]);

  return (
    <div className="min-h-screen bg-primary pt-32 pb-20">
      <div className="max-w-7xl mx-auto section-padding">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary">Search Results</h1>
          <p className="text-gray-500 mt-4 text-lg">Showing results for <span className="font-bold text-secondary">"{query}"</span></p>
        </motion.div>

        {loading ? (
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cream-dark">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (product.variations?.length > 0) {
                            addToCart(product, product.variations[0]);
                            setIsCartOpen(true);
                          }
                        }}
                        className="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-full text-sm font-semibold flex items-center gap-2 w-fit transition-all"
                      >
                        <HiOutlineShoppingCart className="w-4 h-4" /> Quick Add
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-heading text-lg font-semibold text-secondary group-hover:text-accent transition-colors">{product.name}</h3>
                    <p className="text-accent font-bold mt-1">
                      ₹{product.basePrice?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
