import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineSearch, HiOutlineHome, HiOutlineShoppingBag, HiOutlineViewGrid } from 'react-icons/hi';
import API from '../utils/api';
import SEO from '../components/seo/SEO';

const NotFoundPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [logged, setLogged] = useState(false);

  const log404Error = async (path) => {
    try {
      await API.post('/analytics/log-404', {
        path: path,
        referrer: document.referrer || '',
        userAgent: navigator.userAgent
      });
    } catch (error) {
      console.error('Failed to log 404 error', error);
    }
  };

  useEffect(() => {
    // Prevent infinite loops or redundant logs by tracking state
    if (!logged) {
      log404Error(location.pathname);
      setLogged(true);
    }
  }, [location.pathname, logged]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdf9] flex items-center justify-center pt-20 pb-16 px-4">
      {/* 
        CRITICAL FOR SEO (Soft 404 Fix in SPA):
        Adding noindex meta tag ensures search engines don't index this non-existent content 
        even if the edge server returned a 200 OK.
      */}
      <SEO 
        title="404 - Page Not Found | GPSFDK" 
        description="The page you are looking for does not exist. It might have been moved or deleted." 
      />
      <div className="hidden">
        <meta name="robots" content="noindex, follow" />
      </div>

      <div className="max-w-3xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-9xl font-heading font-extrabold text-accent opacity-20 relative">
            404
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl text-secondary opacity-100 mt-8">Page Not Found</span>
            </div>
          </h1>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg text-gray-600 max-w-xl mx-auto"
        >
          It looks like the page you were trying to reach doesn't exist anymore. 
          If you followed an old link, it might have been moved during our recent website upgrade!
        </motion.p>

        {/* Global Search Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-md mx-auto"
        >
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for premium canvases, frames..."
              className="w-full pl-5 pr-12 py-4 bg-white border border-gray-200 rounded-full text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm transition-all"
            />
            <button 
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-accent text-white rounded-full hover:bg-accent-dark transition-colors"
            >
              <HiOutlineSearch className="w-5 h-5" />
            </button>
          </form>
        </motion.div>

        {/* Quick Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto pt-8 border-t border-gray-100"
        >
          <Link to="/" className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-accent hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent transition-colors">
              <HiOutlineHome className="w-6 h-6 text-accent group-hover:text-white" />
            </div>
            <span className="font-heading font-semibold text-secondary">Return Home</span>
            <span className="text-xs text-gray-400 mt-1">Back to the main page</span>
          </Link>
          
          <Link to="/wall-canvas" className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-accent hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent transition-colors">
              <HiOutlineViewGrid className="w-6 h-6 text-accent group-hover:text-white" />
            </div>
            <span className="font-heading font-semibold text-secondary">Our Categories</span>
            <span className="text-xs text-gray-400 mt-1">Explore all collections</span>
          </Link>

          <Link to="/search" className="flex flex-col items-center p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-accent hover:shadow-md transition-all group">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3 group-hover:bg-accent transition-colors">
              <HiOutlineShoppingBag className="w-6 h-6 text-accent group-hover:text-white" />
            </div>
            <span className="font-heading font-semibold text-secondary">All Products</span>
            <span className="text-xs text-gray-400 mt-1">Discover luxury items</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFoundPage;
