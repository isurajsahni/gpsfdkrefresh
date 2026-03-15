import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', { params: { masonry: true, limit: 6 } });
        setProducts(data.products || []);
      } catch (err) {
        // silent fail
      }
    };
    fetchProducts();
  }, []);

  // Predefined masonry heights for visual variety
  const heights = ['h-72', 'h-96', 'h-80', 'h-[28rem]', 'h-72', 'h-96', 'h-80', 'h-[22rem]'];

  return (
    <section className="section-padding section-spacing bg-cream-dark">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-semibold text-primary uppercase tracking-wide">Curated Collection</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">Explore our handpicked selection of premium art & decor pieces</p>
          <div className="w-20 h-[2px] bg-[#E3543A] mt-4 mx-auto" />
        </motion.div>

        <div className="flex flex-col gap-4">
          {/* First Set of 3 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto lg:h-[800px]">
            {/* Left Large Card */}
            {products[0] && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="h-[500px] lg:h-full rounded-[2rem] overflow-hidden relative group"
              >
                <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                  <img
                    src={products[0].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={products[0].name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80 p-8 flex flex-col justify-between">
                    <div>
                      <span className="inline-block bg-white text-[#E3543A] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] mb-4 shadow-sm">
                        {products[0].subCategory || products[0].category?.name || 'HOUSE NAMEPLATES'}
                      </span>
                      <h3 className="text-white font-heading text-4xl md:text-6xl font-bold line-clamp-2 leading-tight tracking-wide">
                        {products[0].name || 'DEMO 8'}
                      </h3>
                      <p className="text-white/90 mt-4 line-clamp-3 max-w-sm text-sm sm:text-base leading-relaxed">
                        {products[0].description || 'Elevate Your Space With Art & Identity Discover luxury wall canvases & custom house nameplates that transform your home into a...'}
                      </p>
                    </div>
                    <div className="flex items-center text-white font-bold text-sm sm:text-base transition-colors group-hover:underline underline-offset-4 decoration-[#E3543A]">
                      Shop Now <span className="text-[#E3543A] ml-2 text-xl font-black no-underline">↗</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )}

            {/* Right Stacked Cards */}
            <div className="flex flex-col gap-4 h-[600px] lg:h-full">
              {products.slice(1, 3).map((product, i) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex-1 rounded-[2rem] overflow-hidden relative group min-h-[300px]"
                >
                  <Link to={`/product/${product.slug}`} className="block w-full h-full">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 p-8 flex flex-col justify-between">
                      <div>
                        <span className="inline-block bg-white text-[#E3543A] text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] mb-3 shadow-sm">
                          {product.subCategory || product.category?.name || 'HOUSE NAMEPLATES'}
                        </span>
                        <h3 className="text-white font-heading text-3xl md:text-4xl font-bold line-clamp-1 tracking-wide">
                          {product.name || `DEMO ${7 - i}`}
                        </h3>
                        <p className="text-white/90 mt-3 line-clamp-2 max-w-md text-xs sm:text-sm leading-relaxed">
                          {product.description || 'Elevate Your Space With Art & Identity Discover luxury wall canvases & custom house nameplates that transform your home into a...'}
                        </p>
                      </div>
                      <div className="flex items-center text-white font-bold text-sm transition-colors group-hover:underline underline-offset-4 decoration-[#E3543A]">
                        Shop Now <span className="text-[#E3543A] ml-2 font-black text-lg no-underline">↗</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Second Set of 3 (Inversed pattern or same repeating pattern) */}
          {products.length > 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-auto lg:h-[800px]">
              {/* Left Stacked Cards */}
              <div className="flex flex-col gap-4 h-[600px] lg:h-full order-2 lg:order-1">
                {products.slice(3, 5).map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex-1 rounded-[2rem] overflow-hidden relative group min-h-[300px]"
                  >
                    <Link to={`/product/${product.slug}`} className="block w-full h-full">
                      <img
                        src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/90 p-8 flex flex-col justify-between">
                        <div>
                          <span className="inline-block bg-white text-[#E3543A] text-[9px] sm:text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] mb-3 shadow-sm">
                            {product.subCategory || product.category?.name || 'HOUSE NAMEPLATES'}
                          </span>
                          <h3 className="text-white font-heading text-3xl md:text-4xl font-bold line-clamp-1 tracking-wide">
                            {product.name}
                          </h3>
                          <p className="text-white/90 mt-3 line-clamp-2 max-w-md text-xs sm:text-sm leading-relaxed">
                            {product.description || 'Elevate Your Space With Art & Identity...'}
                          </p>
                        </div>
                        <div className="flex items-center text-white font-bold text-sm transition-colors group-hover:underline underline-offset-4 decoration-[#E3543A]">
                          Shop Now <span className="text-[#E3543A] ml-2 font-black text-lg no-underline">↗</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Right Large Card */}
              {products[5] && (
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  className="h-[500px] lg:h-full rounded-[2rem] overflow-hidden relative group order-1 lg:order-2"
                >
                  <Link to={`/product/${products[5].slug}`} className="block w-full h-full">
                    <img
                      src={products[5].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                      alt={products[5].name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-black/80 p-8 flex flex-col justify-between">
                      <div>
                        <span className="inline-block bg-white text-[#E3543A] text-[10px] sm:text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.15em] mb-4 shadow-sm">
                          {products[5].subCategory || products[5].category?.name || 'HOUSE NAMEPLATES'}
                        </span>
                        <h3 className="text-white font-heading text-4xl md:text-6xl font-bold line-clamp-2 leading-tight tracking-wide">
                          {products[5].name}
                        </h3>
                        <p className="text-white/90 mt-4 line-clamp-3 max-w-sm text-sm sm:text-base leading-relaxed">
                          {products[5].description || 'Elevate Your Space With Art & Identity...'}
                        </p>
                      </div>
                      <div className="flex items-center text-white font-bold text-sm sm:text-base transition-colors group-hover:underline underline-offset-4 decoration-[#E3543A]">
                        Shop Now <span className="text-[#E3543A] ml-2 text-xl font-black no-underline">↗</span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
