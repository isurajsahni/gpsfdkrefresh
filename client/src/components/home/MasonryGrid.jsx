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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, i) => {
            // Define different heights for a more natural masonry look
            const heightClasses = [
              'h-[500px] md:row-span-2', // Large tall
              'h-[240px]',               // Small
              'h-[240px]',               // Small
              'h-[240px]',               // Small
              'h-[500px] md:row-span-2', // Large tall
              'h-[240px]'                // Small
            ];

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className={`rounded-[2rem] overflow-hidden relative group shadow-lg ${heightClasses[i % heightClasses.length]}`}
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/90 p-6 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block bg-white text-[#E3543A] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
                        {product.subCategory || product.category?.name || 'FEATURED'}
                      </span>
                      <h3 className="text-white font-heading text-2xl font-bold line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                    </div>
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 flex items-center text-white font-bold text-sm">
                      Shop Now <span className="text-[#E3543A] ml-2 text-lg">↗</span>
                    </div>
                  </div>
                  
                  {/* Subtle static info for mobile or non-hover */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent md:hidden">
                    <h3 className="text-white font-heading text-lg font-bold">{product.name}</h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
