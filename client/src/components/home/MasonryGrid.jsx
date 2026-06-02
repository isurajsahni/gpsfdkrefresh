import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';
import { useCurrency } from '../../context/CurrencyContext';
import { optimizeImage } from '../../utils/imageOptimizer';

const BESTSELLER_LABELS = [
  'Best Seller',
  'Most Sold',
  'Top Choice',
  'Hot Seller',
  'Most Loved',
  'Top Seller',
  'Best Selling',
  'Customer Favorite'
];

const getBestsellerLabel = (id) => {
  if (!id) return 'Best Seller';
  let hash = 0;
  const str = String(id);
  for (let idx = 0; idx < str.length; idx++) {
    hash = str.charCodeAt(idx) + ((hash << 5) - hash);
  }
  return BESTSELLER_LABELS[Math.abs(hash) % BESTSELLER_LABELS.length];
};

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', {
          params: {
            // Series of the Month — currently Millionaire Art.
            // Swap this to a different subCategory value to feature
            // another series next month.
            subCategoryExact: 'Millionaire Art',
            limit: 3,
            sort: '-createdAt'
          }
        });
        setProducts(data.products || []);
      } catch (err) {
        // silent fail
      }
    };
    fetchProducts();
  }, []);

  const getBadgeInfo = (product) => {
    return null;
  };

  return (
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D4A3E] capitalize tracking-tight">Series of the Month</h2>
          <div className="w-20 h-[3px] bg-[#E3543A] mt-[15px] mx-auto" />
        </div>

        {/* Masonry Layout: Left 50% (1 big card) | Right 50% (2 stacked cards) */}
        <div className="flex flex-col md:flex-row gap-6" style={{ height: 'auto' }}>
          {/* Left Column — 50% width, single large card */}
          {products[0] && (() => {
            const badge = getBadgeInfo(products[0]);
            return (
              <div
                className="w-full md:w-[60%] h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden relative group shadow-2xl bg-gray-100 flex-shrink-0"
              >
                <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                  {badge && (
                    badge.type === 'bestseller' ? (
                      <div className="absolute top-6 left-6 z-10 text-[10px] px-3.5 py-1.5 rounded-full font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#F15A29] to-[#F5A623] shadow-[0_0_15px_rgba(241,90,41,0.6)] border border-white/20 flex items-center gap-1.5">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white animate-pulse">
                          <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                        </svg>
                        <span>{getBestsellerLabel(products[0]._id)}</span>
                      </div>
                    ) : (
                      <div className={`absolute top-6 left-6 z-10 text-[10px] px-3.5 py-1.5 rounded-full font-semibold text-white uppercase tracking-widest shadow-lg ${badge.color}`}>
                        {badge.label}
                      </div>
                    )
                  )}
                  <img
                    src={optimizeImage(products[0].images?.[0]?.url, 800) || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'}
                    alt={products[0].name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                    loading="lazy"
                  />
                  {/* Dark Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/70 group-hover:via-black/30" />

                  <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="inline-block bg-white text-[#E3543A] text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-lg">
                        {products[0].subCategory || products[0].category?.name || 'FEATURED'}
                      </span>
                      <h3 className="text-white font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
                        {products[0].name}
                      </h3>
                      <p className="text-[#E3543A] font-bold text-2xl md:text-3xl mb-6">
                        {formatPrice(products[0].basePrice || products[0].variations?.[0]?.price)}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center text-white font-bold text-lg md:text-xl">
                        <span className="bg-[#E3543A] px-8 py-3 rounded-full hover:bg-[#c93d25] transition-colors">
                          Buy Now
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })()}

          {/* Right Column — 50% width, 2 stacked cards with equal height */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 md:h-[600px]">
            {products.slice(1, 3).map((product, i) => {
              const badge = getBadgeInfo(product);
              return (
                <div
                  key={product._id}
                  className="flex-1 min-h-0 h-[280px] md:h-auto rounded-[2rem] overflow-hidden relative group shadow-xl bg-gray-100"
                >
                  <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    {badge && (
                      badge.type === 'bestseller' ? (
                        <div className="absolute top-6 left-6 z-10 text-[9px] px-3 py-1.5 rounded-full font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#F15A29] to-[#F5A623] shadow-[0_0_12px_rgba(241,90,41,0.6)] border border-white/20 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white animate-pulse">
                            <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                          </svg>
                          <span>{getBestsellerLabel(product._id)}</span>
                        </div>
                      ) : (
                        <div className={`absolute top-6 left-6 z-10 text-[9px] px-3 py-1 rounded-full font-semibold text-white uppercase tracking-wider shadow-md ${badge.color}`}>
                          {badge.label}
                        </div>
                      )
                    )}
                    <img
                      src={optimizeImage(product.images?.[0]?.url, 500) || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 group-hover:from-black/70 group-hover:via-black/20" />

                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <span className="inline-block bg-white text-[#E3543A] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                          {product.subCategory || product.category?.name || 'NEW ARRIVAL'}
                        </span>
                        <h3 className="text-white font-heading text-2xl md:text-3xl font-bold mb-1">
                          {product.name}
                        </h3>
                        <p className="text-[#E3543A] font-bold text-xl mb-3">
                          {formatPrice(product.basePrice || product.variations?.[0]?.price)}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                          <span className="text-white font-bold text-sm bg-[#E3543A] px-4 py-2 rounded-full">
                            Buy Now
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
