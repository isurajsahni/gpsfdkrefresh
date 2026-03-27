import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import API from '../../utils/api';
import WebflowButton from '../ui/WebflowButton';
import 'swiper/css';
import 'swiper/css/navigation';

const ProductSlider = ({ title, categorySlug, featured = true }) => {
  const [products, setProducts] = useState([]);
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const params = { limit: 12 };
        if (featured) params.featured = true;
        if (categorySlug) params.categorySlug = categorySlug;
        const { data } = await API.get('/products', { params });
        setProducts(data.products);
      } catch (err) {
        // Use empty array on error
        setProducts([]);
      }
    };
    fetchProducts();
  }, [categorySlug, featured]);

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    if (product.variations?.length > 0) {
      addToCart(product, product.variations[0]);
      setIsCartOpen(true);
    }
  };

  return (
    <section className="section-padding section-spacing bg-primary">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{title}</h2>
            <div className="w-20 h-1 bg-accent mt-3 rounded-full" />
          </div>
          {categorySlug && (
            <WebflowButton to={`/category/${categorySlug}`} className="text-sm py-1.5 pl-5 pr-1.5 hidden md:flex">
              View All
            </WebflowButton>
          )}
        </motion.div>

        <div className="relative pb-16">
          <Swiper
            modules={[Navigation]}
            spaceBetween={24}
            slidesPerView={1.2}
            navigation={{
              nextEl: `.swiper-button-next-${categorySlug || 'default'}`,
              prevEl: `.swiper-button-prev-${categorySlug || 'default'}`,
            }}
            breakpoints={{
              480: { slidesPerView: 1.5 },
              640: { slidesPerView: 2 },
              768: { slidesPerView: 2.5 },
              1024: { slidesPerView: 3 },
              1280: { slidesPerView: 4 },
            }}
            className="product-slider relative"
          >
            {products.map((product, i) => (
              <SwiperSlide key={product._id || i}>
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.05, duration: 0.6 }}
                >
                  <Link to={`/product/${product.slug}`} className="group block">
                    <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cream-dark">
                      <img
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                        <h3 className="text-white font-heading text-lg font-semibold">{product.name}</h3>
                        <p className="text-accent font-bold text-lg mt-1">
                          ₹{product.basePrice?.toLocaleString() || product.variations?.[0]?.price?.toLocaleString()}
                          {product.variations?.[0]?.comparePrice > 0 && (
                            <span className="text-white/50 text-sm line-through ml-2">₹{product.variations[0].comparePrice.toLocaleString()}</span>
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
                </motion.div>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Custom Navigation Buttons to the bottom right */}
          <div className="absolute right-0 bottom-0 flex items-center justify-between w-full z-10 pt-8">
            <WebflowButton to={`/category/${categorySlug}`} className="text-sm py-1.5 pl-5 pr-1.5 flex md:hidden mr-auto mt-auto mb-1">
              View All
            </WebflowButton>

            <div className="flex gap-3 pb-2 ml-auto">
              <button className={`swiper-button-prev-${categorySlug || 'default'} w-11 h-11 rounded-full bg-[#dcc6a8] text-white flex items-center justify-center hover:bg-[#c9b293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button className={`swiper-button-next-${categorySlug || 'default'} w-11 h-11 rounded-full bg-[#dcc6a8] text-white flex items-center justify-center hover:bg-[#c9b293] transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}>
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
      `}</style>
    </section>
  );
};

export default ProductSlider;
