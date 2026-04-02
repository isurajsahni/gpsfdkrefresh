import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProductRow from './ProductRow';
import API from '../../utils/api';
import SEO from '../seo/SEO';

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
    <div className="min-h-screen bg-cream pt-[80px] pb-12">
      <SEO title={dynamicTitle} description={dynamicDescription} schema={breadcrumbSchema} />

      {/* Hero Header */}
      <div className="bg-secondary section-padding py-16 md:py-24 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="max-w-[1200px] mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="text-white/50 text-sm mb-4">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <span className="mx-2">/</span>
              <span className="text-white">{category?.name || 'House Nameplates'}</span>
            </nav>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white leading-tight">
              {category?.name || 'House Nameplates'}
            </h1>
            <p className="text-white/60 mt-4 max-w-2xl text-lg leading-relaxed">
              {category?.description || 'Elegant, customizable house nameplates crafted with precision. Make your home entrance unforgettable.'}
            </p>
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
