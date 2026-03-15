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

  return (
    <section className="section-padding bg-cream-dark overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-semibold text-primary uppercase tracking-tight">Curated Collection</h2>
          <div className="w-16 h-[3px] bg-[#E3543A] mt-4 mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-auto lg:h-[calc(100vh-250px)] min-h-[500px] max-h-[800px]">
          {/* Main Large Card (Top Left) */}
          {products[0] && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-8 h-[400px] lg:h-full rounded-[2.5rem] overflow-hidden relative group shadow-2xl"
            >
              <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                <img
                  src={products[0].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'}
                  alt={products[0].name}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 md:p-12 flex flex-col justify-end">
                  <span className="inline-block bg-white text-[#E3543A] text-[10px] md:text-xs font-bold px-4 py-2 rounded-full uppercase tracking-widest mb-4 w-fit shadow-lg">
                    {products[0].subCategory || products[0].category?.name || 'EXCLUSIVE'}
                  </span>
                  <h3 className="text-white font-heading text-4xl md:text-7xl font-bold leading-none mb-4 group-hover:translate-x-2 transition-transform duration-500">
                    {products[0].name}
                  </h3>
                  <div className="flex items-center text-white font-bold text-lg md:text-xl group-hover:underline decoration-[#E3543A] underline-offset-8 transition-all">
                    Explore Collection <span className="text-[#E3543A] ml-3 text-3xl no-underline">↗</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Vertical Stack (Right Side) */}
          <div className="lg:col-span-4 flex flex-col gap-6 h-full">
            {products.slice(1, 3).map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex-1 rounded-[2.5rem] overflow-hidden relative group shadow-xl"
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-8 flex flex-col justify-end">
                    <span className="inline-block bg-white text-[#E3543A] text-[9px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider mb-3 w-fit">
                      {product.subCategory || product.category?.name || 'FEATURED'}
                    </span>
                    <h3 className="text-white font-heading text-2xl md:text-3xl font-bold mb-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center text-white font-bold text-sm">
                      Shop Now <span className="text-[#E3543A] ml-2 text-xl">↗</span>
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
