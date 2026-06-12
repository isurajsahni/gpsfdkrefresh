import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineX } from 'react-icons/hi';
import { useUI } from '../../context/UIContext';
// import API from '../../utils/api'; // Not needed for mock data
// import { optimizeImage } from '../../utils/imageOptimizer'; // Not needed for mock data

// Using favicon from public folder as requested
const MOCK_DATA = [
  {
    id: 1,
    name: 'Premium Canvas',
    category: 'Wall Art',
    price: '₹2,499',
    logoUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600&auto=format&fit=crop',
    slug: 'wall-canvas',
    description: 'Elevate your space with our premium quality matte canvas prints.'
  },
  {
    id: 2,
    name: 'Acrylic House Nameplate',
    category: 'House Nameplates',
    price: '₹1,299',
    logoUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600&auto=format&fit=crop',
    slug: 'house-nameplates',
    description: 'Weatherproof, elegant acrylic nameplates for your modern home.'
  },
  {
    id: 3,
    name: 'Millionaire Art Series',
    category: 'Wall Art',
    price: '₹4,999',
    logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop',
    slug: 'wall-canvas/millionaire-art',
    description: 'Exclusive, limited edition art pieces for the ambitious.'
  },
  {
    id: 4,
    name: 'Custom Canvas Print',
    category: 'Customize',
    price: '₹1,999',
    logoUrl: 'https://images.unsplash.com/photo-1580136579312-94651dfd596d?q=80&w=600&auto=format&fit=crop',
    slug: 'customize-canvas',
    description: 'Turn your favorite memories into beautiful custom wall art.'
  },
  {
    id: 5,
    name: 'The Botanical Muse',
    category: 'Wall Art',
    price: '₹3,499',
    logoUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    slug: 'wall-canvas/the-botanical-muse',
    description: 'Nature-inspired art that brings life and color to any room.'
  }
];

const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen } = useUI();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [hoveredItem, setHoveredItem] = useState(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setResults([]);
      setHoveredItem(null);
    }
  }, [isSearchOpen]);

  // Close search when navigating away
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname, setIsSearchOpen]);

  // Debounce search logic
  useEffect(() => {
    const fetchResults = () => {
      if (query.trim().length === 0) {
        setResults([]);
        setHoveredItem(null);
        return;
      }
      
      const filtered = MOCK_DATA.filter(item => 
        item.name.toLowerCase().includes(query.toLowerCase()) || 
        item.category.toLowerCase().includes(query.toLowerCase())
      );
      
      setResults(filtered);
      if (filtered.length > 0) {
        setHoveredItem(filtered[0]);
      } else {
        setHoveredItem(null);
      }
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

  const handleItemClick = (slug) => {
    setIsSearchOpen(false);
    navigate(`/${slug}`);
  };

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center pt-8 sm:pt-16 px-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSearchOpen(false);
          }}
        >
          <div className="w-full max-w-4xl bg-[#202124] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh]">
            {/* Header / Input */}
            <form onSubmit={handleSearch} className="flex items-center px-4 sm:px-6 py-4 border-b border-gray-700 bg-[#202124]">
              <HiOutlineSearch className="w-6 h-6 text-gray-400 mr-3" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, categories..."
                className="flex-1 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none"
              />
              {query && (
                <button 
                  type="button" 
                  onClick={() => setQuery('')} 
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              )}
            </form>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              {/* Left side: Suggestions */}
              <div className="w-full md:w-1/2 flex flex-col border-r border-gray-700 overflow-y-auto bg-[#202124] custom-scrollbar">
                {results.length > 0 ? (
                  <div className="py-2">
                    <h3 className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Suggestions</h3>
                    {results.map((item) => (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItem(item)}
                        onClick={() => handleItemClick(item.slug)}
                        className={`flex items-center px-6 py-3 cursor-pointer transition-colors ${hoveredItem?.id === item.id ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`}
                      >
                        <HiOutlineSearch className="w-5 h-5 text-gray-400 mr-4 flex-shrink-0" />
                        <div className="flex-1 flex flex-col truncate">
                          <span className="text-gray-100 font-medium truncate">{item.name}</span>
                          <span className="text-gray-400 text-xs truncate">{item.category}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : query.length > 0 ? (
                  <div className="flex flex-col items-center justify-center p-8 text-center h-full">
                    <HiOutlineSearch className="w-12 h-12 text-gray-600 mb-4" />
                    <p className="text-gray-400">No results found for "{query}"</p>
                  </div>
                ) : (
                  <div className="py-2">
                    <h3 className="px-6 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Popular Searches</h3>
                    {MOCK_DATA.slice(0, 4).map((item) => (
                      <div
                        key={item.id}
                        onMouseEnter={() => setHoveredItem(item)}
                        onClick={() => handleItemClick(item.slug)}
                        className="flex items-center px-6 py-3 cursor-pointer transition-colors hover:bg-gray-800/50"
                      >
                        <HiOutlineSearch className="w-5 h-5 text-gray-400 mr-4 flex-shrink-0" />
                        <span className="text-gray-100">{item.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right side: Preview Card */}
              <div className="hidden md:flex w-1/2 bg-[#171717] p-8 flex-col items-center justify-center relative overflow-y-auto">
                {hoveredItem ? (
                  <motion.div
                    key={hoveredItem.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm flex flex-col items-center text-center"
                  >
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-700/50 mb-6 group bg-gray-800/50">
                      <img 
                        src={hoveredItem.logoUrl} 
                        alt={hoveredItem.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    
                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{hoveredItem.category}</span>
                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{hoveredItem.name}</h2>
                    <p className="text-gray-300 font-semibold text-xl mb-4">{hoveredItem.price}</p>
                    <p className="text-gray-400 text-sm leading-relaxed mb-8 px-4">
                      {hoveredItem.description}
                    </p>
                    
                    <button 
                      onClick={() => handleItemClick(hoveredItem.slug)}
                      className="w-full py-3.5 px-6 bg-accent text-secondary font-bold rounded-xl hover:bg-white hover:text-accent transition-all shadow-[0_0_15px_rgba(var(--color-accent),0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.5)] transform hover:-translate-y-1"
                    >
                      View Details
                    </button>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 space-y-4 h-full">
                    <div className="w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center border border-gray-700/30">
                      <HiOutlineSearch className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-sm font-medium">Hover over a suggestion to preview</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Close button outside container for mobile */}
          <button
            onClick={() => setIsSearchOpen(false)}
            className="md:hidden absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          >
            <HiOutlineX className="w-6 h-6" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;

