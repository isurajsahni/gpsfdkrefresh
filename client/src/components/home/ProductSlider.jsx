import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../../context/CartContext';
import { useCurrency } from '../../context/CurrencyContext';
import { useUI } from '../../context/UIContext';
import { optimizeImage } from '../../utils/imageOptimizer';
import API from '../../utils/api';
import WebflowButton from '../ui/WebflowButton';
import 'swiper/css';
import 'swiper/css/navigation';

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

const ProductSlider = ({ title, categorySlug, featured = true, hotSelling = false, excludeId }) => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();
  const { setIsCartOpen } = useUI();
  const swiperRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        let data;
        if (hotSelling) {
          // Use the dedicated hot-selling endpoint
          const res = await API.get('/products/hot-selling');
          data = res.data;
        } else {
          const params = { limit: 12 };
          if (featured) params.featured = true;
          if (categorySlug) params.categorySlug = categorySlug;
          const res = await API.get('/products', { params });
          data = res.data;
        }
        if (excludeId) {
          setProducts(data.products.filter(p => p._id !== excludeId));
        } else {
          setProducts(data.products);
        }
      } catch (err) {
        // Fallback: if hot-selling endpoint fails, fetch featured products instead
        if (hotSelling) {
          try {
            const params = { limit: 20 };
            params.featured = true;
            if (categorySlug) params.categorySlug = categorySlug;
            const fallbackRes = await API.get('/products', { params });
            const fallbackProducts = fallbackRes.data.products || [];
            if (excludeId) {
              setProducts(fallbackProducts.filter(p => p._id !== excludeId));
            } else {
              setProducts(fallbackProducts);
            }
            return;
          } catch (_) { /* ignore fallback error */ }
        }
        setProducts([]);
      }
    };
    fetchProducts();
  }, [categorySlug, featured, hotSelling]);

  const handleQuickAdd = useCallback((e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variations?.length > 0) {
      addToCart(product, product.variations[0]);
      setIsCartOpen(true);
    }
  }, [addToCart, setIsCartOpen]);

  // Unique ID for this slider instance to avoid selector collisions
  const sliderId = categorySlug || 'default';

  return (
    <section className="section-padding section-spacing bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{title}</h2>
            <div className="w-20 h-1 bg-accent mt-[15px] rounded-full" />
          </div>
          {categorySlug && (
            <WebflowButton to={`/${categorySlug}`} className="text-sm py-1.5 pl-5 pr-1.5 hidden md:flex">
              View All
            </WebflowButton>
          )}
        </div>

        <div className="relative pb-24">
          <Swiper
            modules={[Navigation, Autoplay]}
            spaceBetween={24}
            slidesPerView={1.2}
            loop={products.length > 4}
            speed={400}
            grabCursor={true}
            cssMode={false}
            touchRatio={1.2}
            touchAngle={45}
            resistance={true}
            resistanceRatio={0.85}
            followFinger={true}
            autoplay={{
              delay: 3000,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            navigation={{
              nextEl: `.swiper-button-next-${sliderId}`,
              prevEl: `.swiper-button-prev-${sliderId}`,
            }}
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            breakpoints={{
              480: { slidesPerView: 1.5 },
              640: { slidesPerView: 2 },
              768: { slidesPerView: 2.5 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className={`product-slider product-slider-${sliderId} relative`}
          >
            {products.map((product, i) => {
              const prices = [
                product.basePrice,
                ...(product.variations || []).map(v => v.price)
              ].filter(p => typeof p === 'number');
              const minPrice = prices.length > 0 ? Math.min(...prices) : (product.basePrice || 0);
              const maxPrice = prices.length > 0 ? Math.max(...prices) : (product.basePrice || 0);

              // Determine badge type
              let badgeType = "";
              const variations = product.variations || [];
              const totalStock = variations.reduce((acc, v) => acc + (v.stock || 0), 0);
              if (variations.length > 0 && totalStock > 0 && totalStock <= 10) {
                badgeType = "lowstock";
              } else if (product.featured || hotSelling) {
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
                <SwiperSlide key={product._id || i}>
                  <Link to={`/product/${product.slug}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cream-dark">
                      {badgeType && (
                        badgeType === 'bestseller' ? (
                          <div className="absolute top-3 left-3 z-10 text-[9px] px-3 py-1.5 rounded-full font-bold text-white uppercase tracking-widest bg-gradient-to-r from-[#F15A29] to-[#F5A623] shadow-[0_0_12px_rgba(241,90,41,0.6)] border border-white/20 flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5 text-white animate-pulse">
                              <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                            </svg>
                            <span>{getBestsellerLabel(product._id)}</span>
                          </div>
                        ) : (
                          <div className={`absolute top-3 left-3 z-10 text-[9px] px-2.5 py-1 rounded font-semibold text-white uppercase tracking-wider shadow ${badgeColors[badgeType]}`}>
                            {badgeLabels[badgeType]}
                          </div>
                        )
                      )}
                      <img
                        src={optimizeImage(product.images?.[0]?.url, 500) || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                        <h3 className="text-white font-heading text-lg font-semibold">{product.name}</h3>
                        <p className="text-accent font-bold text-lg mt-1">
                          {formatPrice(minPrice)}
                          {minPrice !== maxPrice && ` - ${formatPrice(maxPrice)}`}
                          {product.variations?.[0]?.comparePrice > 0 && (
                            <span className="text-white/50 text-sm line-through ml-2">{formatPrice(product.variations[0].comparePrice)}</span>
                          )}
                        </p>
                        <button
                          onClick={(e) => handleQuickAdd(e, product)}
                          className="mt-3 bg-accent hover:bg-accent-dark text-white py-2.5 px-5 rounded-full text-sm font-semibold flex items-center gap-2 w-fit transition-all duration-300 hover:scale-105"
                        >
                          <HiOutlineShoppingCart className="w-4 h-4" /> Add To Cart
                        </button>
                      </div>
                    </div>
                  </Link>
                </SwiperSlide>
              );
            })}
          </Swiper>

          {/* Custom Navigation Buttons to the bottom right */}
          <div className="absolute right-0 bottom-0 flex items-center justify-between w-full z-10 mt-6">
            <WebflowButton to={`/${categorySlug}`} className="text-sm py-1.5 pl-5 pr-1.5 flex md:hidden mr-auto mt-auto mb-1">
              View All
            </WebflowButton>

            <div className="flex gap-3 pb-2 ml-auto">
              <button className={`swiper-button-prev-${sliderId} w-11 h-11 rounded-full bg-[#dcc6a8] text-white flex items-center justify-center hover:bg-[#c9b293] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className={`swiper-button-next-${sliderId} w-11 h-11 rounded-full bg-[#dcc6a8] text-white flex items-center justify-center hover:bg-[#c9b293] active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        /* Hide default swiper nav since we use custom */
        .product-slider .swiper-button-next,
        .product-slider .swiper-button-prev {
          display: none !important;
        }
        /* Smoother, faster transition curve for all product sliders */
        .product-slider .swiper-wrapper {
          transition-timing-function: cubic-bezier(0.25, 0.1, 0.25, 1) !important;
        }
      `}</style>
    </section>
  );
};

export default ProductSlider;
