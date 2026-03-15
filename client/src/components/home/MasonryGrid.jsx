import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', { params: { masonry: true, limit: 3 } });
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
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-secondary">Curated Collection</h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">Explore our handpicked selection of premium art & decor pieces</p>
          <div className="w-20 h-1 bg-accent mt-4 rounded-full mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-auto md:h-[600px]">
          {/* Left Large Card */}
          {products[0] && (
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="h-[400px] md:h-full rounded-3xl overflow-hidden relative group"
            >
              <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                <img
                  src={products[0].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                  alt={products[0].name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 p-8 flex flex-col justify-between">
                  <div>
                    <span className="inline-block bg-white text-accent text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 shadow-sm">
                      {products[0].subCategory || products[0].category?.name || 'Featured'}
                    </span>
                    <h3 className="text-white font-heading text-3xl md:text-5xl font-bold line-clamp-2 leading-tight">
                      {products[0].name}
                    </h3>
                    <p className="text-white/80 mt-3 line-clamp-2 max-w-sm">
                      {products[0].description || 'Discover the future where cutting-edge design meets premium quality.'}
                    </p>
                  </div>
                  <div className="flex items-center text-white font-semibold text-lg hover:text-accent transition-colors">
                    Shop Now <span className="text-accent ml-2 text-xl font-bold">↗</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Right Stacked Cards */}
          <div className="flex flex-col gap-4 h-[600px] md:h-full">
            {products.slice(1, 3).map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 rounded-3xl overflow-hidden relative group min-h-[250px]"
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60 p-6 flex flex-col justify-between">
                    <div>
                      <span className="inline-block bg-white text-accent text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mb-2 shadow-sm">
                        {product.subCategory || product.category?.name || 'Featured'}
                      </span>
                      <h3 className="text-white font-heading text-2xl md:text-3xl font-bold line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-white/80 mt-2 line-clamp-2 max-w-md text-sm">
                        {product.description || 'Enjoy amazing journeys packed with world-class features.'}
                      </p>
                    </div>
                    <div className="flex items-center text-white font-semibold text-sm hover:text-accent transition-colors">
                      Shop Now <span className="text-accent ml-2 font-bold text-lg">↗</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
