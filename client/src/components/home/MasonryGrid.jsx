import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', { params: { masonry: true, limit: 7 } });
        setProducts(data.products || []);
      } catch (err) {
        // silent fail
      }
    };
    fetchProducts();
  }, []);

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
          {products.map((product, i) => {
            // Define span and height classes for a premium masonry look
            const layoutClasses = [
              'lg:col-span-2 lg:row-span-2 min-h-[500px] md:h-full', // Item 0
              'lg:col-span-1 min-h-[300px]',                         // Item 1
              'lg:col-span-1 min-h-[300px]',                         // Item 2
              'lg:col-span-1 min-h-[300px]',                         // Item 3
              'lg:col-span-1 min-h-[300px]',                         // Item 4
              'lg:col-span-1 lg:row-span-2 min-h-[500px]',           // Item 5
              'lg:col-span-2 min-h-[300px]',                         // Item 6
            ];

            return (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className={`rounded-[2rem] overflow-hidden relative group shadow-xl bg-white ${layoutClasses[i % layoutClasses.length]}`}
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/90 p-8 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="transform -translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="inline-block bg-white text-[#E3543A] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-[0.1em] mb-4">
                        {product.subCategory || product.category?.name || 'HOUSE NAMEPLATES'}
                      </span>
                      <h3 className="text-white font-heading text-3xl font-bold line-clamp-2 leading-tight">
                        {product.name}
                      </h3>
                    </div>
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 flex items-center text-white font-bold text-base group-hover:underline decoration-[#E3543A] underline-offset-8">
                      Shop Now <span className="text-[#E3543A] ml-2 text-2xl no-underline">↗</span>
                    </div>
                  </div>
                  
                  {/* Subtle static title for mobile */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent md:hidden pointer-events-none">
                    <h3 className="text-white font-heading text-xl font-bold">{product.name}</h3>
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
