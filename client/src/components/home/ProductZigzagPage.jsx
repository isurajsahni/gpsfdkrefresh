import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductRow from './ProductRow';
import API from '../../utils/api';
import SEO from '../seo/SEO';
import heroImage from '../../assets/image/housenameplate_poster.webp';

const ProductZigzagPage = ({ category, slug }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(16);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const { data } = await API.get('/products', {
          params: { limit: 1000 }
        });
        const filtered = data.products.filter(
          p => p.category?.slug === slug
        );
        setProducts(filtered);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    setVisibleCount(16);
    fetchProducts();
  }, [slug]);

  // Intersection Observer for scroll animations
  const containerRef = useRef(null);

  useEffect(() => {
    if (loading || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('zigzag-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -50px 0px' }
    );

    const rows = containerRef.current.querySelectorAll('.zigzag-row');
    rows.forEach(row => observer.observe(row));

    return () => observer.disconnect();
  }, [loading, products]);

  // SEO
  const dynamicTitle = category?.name
    ? `${category.name} | Premium Custom Designs India`
    : 'House Nameplates | GPSFDK';
  const dynamicDescription =
    category?.description ||
    'Browse our exclusive collection of premium house nameplates. Customizable designs with fast delivery across India.';

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.gpsfdk.com'
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: category?.name || 'House Nameplates'
      }
    ]
  };

  // Skeleton loader
  const SkeletonRow = ({ isEven }) => (
    <div className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch py-6 md:py-10`}>
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
        <div className="w-full max-w-[480px] aspect-[4/5] rounded-2xl bg-gray-100 animate-pulse" />
      </div>
      <div className="w-full lg:w-1/2 flex items-center p-6 lg:p-12">
        <div className="w-full max-w-lg space-y-4">
          <div className="h-8 bg-gray-100 rounded-xl w-3/4 animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-lg w-full animate-pulse" />
          <div className="h-4 bg-gray-100 rounded-lg w-2/3 animate-pulse" />
          <div className="h-10 bg-gray-100 rounded-xl w-1/3 animate-pulse mt-4" />
          <div className="flex gap-2 mt-4">
            <div className="h-10 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-10 w-20 bg-gray-100 rounded-full animate-pulse" />
            <div className="h-10 w-20 bg-gray-100 rounded-full animate-pulse" />
          </div>
          <div className="h-12 bg-gray-100 rounded-full w-40 animate-pulse mt-4" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cream pb-12 w-full">
      <SEO title={dynamicTitle} description={dynamicDescription} schema={breadcrumbSchema} />

      {/* Hero Header - 100vh 50/50 Split */}
      <div className="relative w-full h-[100vh] flex flex-col md:flex-row overflow-hidden bg-secondary">
        {/* Left Side: Content */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 relative z-10 pt-[80px] md:pt-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <nav className="text-white/60 text-sm mb-6 flex items-center gap-2">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <span className="text-white font-medium">{category?.name || 'House Nameplates'}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-heading font-bold text-white leading-[1.1] tracking-tight mb-6">
              {category?.name || 'House Nameplates'}
            </h1>
            <p className="text-white/80 text-base md:text-lg lg:text-xl leading-relaxed max-w-xl mb-10">
              {category?.description || 'Elegant, customizable house nameplates crafted with precision. Make your home entrance unforgettable.'}
            </p>
            
            <button 
              onClick={() => {
                containerRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="group flex items-center gap-3 bg-accent hover:bg-accent-dark text-white px-8 py-4 rounded-full font-semibold transition-all shadow-[0_0_20px_rgba(240,185,11,0.3)] hover:shadow-[0_0_30px_rgba(240,185,11,0.5)] w-fit"
            >
              Scroll Down
              <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </motion.div>
          {/* Decorative subtle gradient */}
          <div className="absolute top-0 left-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
        </div>

        {/* Right Side: Image */}
        <div className="w-full md:w-1/2 h-[50vh] md:h-full relative overflow-hidden">
          <motion.div 
            initial={{ scale: 1.05 }} 
            animate={{ scale: 1 }} 
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="w-full h-full relative"
          >
            <img 
              src={heroImage} 
              alt={category?.name || "House Nameplates Details"} 
              className="w-full h-full object-cover object-center"
            />
            {/* Gradient to blend with left side on desktop */}
            <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-l from-transparent via-transparent to-secondary/80 md:to-secondary" />
          </motion.div>
        </div>
      </div>

      {/* Product Count */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <p className="text-gray-500 text-sm">
          {loading ? 'Loading...' : `${products.length} product${products.length !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Zigzag Product Rows */}
      <div ref={containerRef} className="max-w-[1300px] mx-auto px-4 sm:px-6 pb-20">
        {loading ? (
          <>
            <SkeletonRow isEven={true} />
            <SkeletonRow isEven={false} />
            <SkeletonRow isEven={true} />
          </>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Back to Home</Link>
          </div>
        ) : (
          <>
            <div className="divide-y divide-gray-100">
              {products.slice(0, visibleCount).map((product, i) => (
                <ProductRow key={product._id} product={product} index={i} />
              ))}
            </div>
            {visibleCount < products.length && (
              <div className="text-center mt-12 flex justify-center">
                <button
                  onClick={() => setVisibleCount(prev => prev + 16)}
                  className="bg-accent hover:bg-accent-dark text-white px-8 py-3 rounded-full font-semibold transition-colors shadow-sm"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ProductZigzagPage;
