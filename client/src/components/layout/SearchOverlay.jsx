import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { useUI } from '../../context/UIContext';
import API from '../../utils/api';

const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen } = useUI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await API.get(`/products?search=${query}&limit=5`);
        setResults(data.products);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };

    const debounce = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-primary/95 backdrop-blur-md flex flex-col items-center pt-24 px-4 overflow-y-auto"
        >
          <button
            onClick={() => setIsSearchOpen(false)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white text-secondary hover:text-accent rounded-full transition-colors"
          >
            <HiOutlineX className="w-8 h-8" />
          </button>

          <div className="w-full max-w-3xl">
            <form onSubmit={handleSearch} className="relative w-full mb-12">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="w-full bg-transparent border-b-2 border-secondary/20 text-xl font-heading font-bold text-secondary placeholder-secondary/30 pb-4 focus:outline-none focus:border-accent transition-colors"
              />
              <button
                type="submit"
                className="absolute right-0 bottom-4 text-secondary hover:text-accent transition-colors"
              >
                <HiOutlineSearch className="w-8 h-8 md:w-10 md:h-10" />
              </button>
            </form>

            <div className="w-full">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : results.length > 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <h3 className="text-gray-500 font-medium mb-6">Suggestions</h3>
                  {results.map((product) => (
                    <Link
                      key={product._id}
                      to={`/product/${product.slug}`}
                      onClick={() => setIsSearchOpen(false)}
                      className="flex items-center gap-6 p-4 rounded-2xl hover:bg-white transition-colors group"
                    >
                      <img src={product.images?.[0]?.url} alt={product.name} className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-xl bg-cream-dark" />
                      <div>
                        <h4 className="font-heading font-bold text-lg md:text-xl text-secondary group-hover:text-accent transition-colors">{product.name}</h4>
                        <p className="text-gray-500 text-sm mt-1">{product.category?.name}</p>
                        <p className="font-bold text-accent mt-1">₹{product.basePrice?.toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                  <button
                    onClick={handleSearch}
                    className="w-full py-4 text-center text-sm font-bold text-accent hover:text-secondary hover:underline transition-all mt-6 block"
                  >
                    View all results for "{query}" →
                  </button>
                </motion.div>
              ) : query.length > 1 ? (
                <p className="text-center text-gray-500 py-10">No products found for "{query}"</p>
              ) : (
                <div className="text-center text-gray-500 py-10 space-y-4">
                  <p>Popular Searches:</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['Wall Canvas', 'Nameplate', 'Millionaire Art', 'Acrylic'].map(term => (
                      <button
                        key={term}
                        onClick={() => setQuery(term)}
                        className="px-4 py-2 bg-white rounded-full text-sm hover:bg-secondary hover:text-white transition-colors"
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
