import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import { HiOutlineShoppingCart } from 'react-icons/hi';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';
import API from '../../utils/api';
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
        const { data } = await API.get('/products', { params });
        // Filter by category slug if provided
        const filtered = categorySlug
          ? data.products.filter(p => p.category?.slug === categorySlug)
          : data.products;
        setProducts(filtered.length > 0 ? filtered : data.products);
      } catch (err) {
        // Use empty array on error
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
    <section className="section-padding section-spacing bg-white">
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
            <Link to={`/category/${categorySlug}`} className="text-accent font-semibold hover:underline underline-offset-4 transition-all">
              View All →
            </Link>
          )}
        </motion.div>

        <Swiper
          modules={[Navigation, Autoplay]}
          spaceBetween={24}
          slidesPerView={1.2}
          navigation
          autoplay={{ delay: 4000, disableOnInteraction: false }}
          breakpoints={{
            480: { slidesPerView: 1.5 },
            640: { slidesPerView: 2 },
            768: { slidesPerView: 2.5 },
            1024: { slidesPerView: 3 },
            1280: { slidesPerView: 4 },
          }}
          className="product-slider"
        >
          {products.map((product, i) => (
            <SwiperSlide key={product._id || i}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link to={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100">
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
      </div>

      <style>{`
        .product-slider .swiper-button-next,
        .product-slider .swiper-button-prev {
          color: #0B5D3B;
          background: white;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .product-slider .swiper-button-next::after,
        .product-slider .swiper-button-prev::after {
          font-size: 18px;
          font-weight: bold;
        }
      `}</style>
    </section>
  );
};

export default ProductSlider;
