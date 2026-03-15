import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import API from '../../utils/api';

const MasonryGrid = () => {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await API.get('/products', { 
          params: { 
            featured: true,
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

  return (
    <section className="section-padding bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-5xl font-heading font-bold text-primary uppercase tracking-tight">Curated Collection</h2>
          <div className="w-16 h-[3px] bg-[#E3543A] mt-4 mx-auto" />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Large Card (Spans 2 columns, 2 rows in visual weight) */}
          {products[0] && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 md:row-span-2 h-[400px] md:h-[600px] max-h-[600px] rounded-[2rem] overflow-hidden relative group shadow-2xl bg-gray-100"
            >
              <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                <img
                  src={products[0].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'}
                  alt={products[0].name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:bg-black/60" />
                
                <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block bg-white text-[#E3543A] text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-lg">
                      {products[0].subCategory || products[0].category?.name || 'FEATURED'}
                    </span>
                    <h3 className="text-white font-heading text-4xl md:text-6xl font-bold leading-tight mb-2">
                      {products[0].name}
                    </h3>
                    <p className="text-[#E3543A] font-bold text-2xl md:text-3xl mb-6">
                      ₹{products[0].basePrice?.toLocaleString() || products[0].variations?.[0]?.price?.toLocaleString()}
                    </p>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center text-white font-bold text-lg md:text-xl">
                      <span className="bg-[#E3543A] px-8 py-3 rounded-full hover:bg-[#c93d25] transition-colors">
                        Buy Now
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          )}

          {/* Right Side Cards (Vertical Stack) */}
          <div className="md:col-span-1 flex flex-col gap-6">
            {products.slice(1, 3).map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="h-[290px] max-h-[290px] rounded-[2rem] overflow-hidden relative group shadow-xl bg-gray-100"
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 group-hover:bg-black/60" />
                  
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <span className="inline-block bg-white text-[#E3543A] text-[9px] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-2">
                        {product.subCategory || product.category?.name || 'NEW ARRIVAL'}
                      </span>
                      <h3 className="text-white font-heading text-2xl md:text-3xl font-bold mb-1">
                        {product.name}
                      </h3>
                      <p className="text-[#E3543A] font-bold text-xl mb-3">
                        ₹{product.basePrice?.toLocaleString() || product.variations?.[0]?.price?.toLocaleString()}
                      </p>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="text-white font-bold text-sm bg-[#E3543A] px-4 py-2 rounded-full">
                          Buy Now
                        </span>
                      </div>
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
