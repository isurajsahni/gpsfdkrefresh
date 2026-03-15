import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', { params: { masonry: true, limit: 8 } });
        setProducts(data.products?.length > 0 ? data.products : []);
      } catch (err) {
        // silent fail
      }
    };
    fetchProducts();
  }, []);

  // Predefined masonry heights for visual variety
  const heights = ['h-72', 'h-96', 'h-80', 'h-[28rem]', 'h-72', 'h-96', 'h-80', 'h-[22rem]'];

  return (
    <section className="section-padding section-spacing bg-slate-50">
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

        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {products.map((product, i) => (
            <motion.div
              key={product._id || i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="break-inside-avoid"
            >
              <Link to={`/product/${product.slug}`} className="group block relative rounded-2xl overflow-hidden">
                <div className={`${heights[i % heights.length]} w-full`}>
                  <img
                    src={product.images?.[0]?.url || `https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600`}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                  <h3 className="text-white font-heading text-lg font-semibold">{product.name}</h3>
                  <p className="text-white/60 text-sm mt-1">{product.category?.name}</p>
                  <div className="mt-3">
                    <span className="inline-block bg-accent text-white text-sm font-semibold py-2 px-5 rounded-full hover:bg-accent-dark transition-colors">
                      Buy Now
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
