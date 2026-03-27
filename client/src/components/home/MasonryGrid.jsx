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
            masonry: true,
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
    <section className="py-20 md:py-28 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-[#2D4A3E] uppercase tracking-tight">Curated Collection</h2>
          <div className="w-20 h-[3px] bg-[#E3543A] mt-6 mx-auto" />
        </motion.div>

        {/* Masonry Layout: Left 50% (1 big card) | Right 50% (2 stacked cards) */}
        <div className="flex flex-col md:flex-row gap-6" style={{ height: 'auto' }}>
          {/* Left Column — 50% width, single large card */}
          {products[0] && (
            <div
              className="w-full md:w-[60%] h-[400px] md:h-[600px] rounded-[2rem] overflow-hidden relative group shadow-2xl bg-gray-100 flex-shrink-0"
            >
              <Link to={`/product/${products[0].slug}`} className="block w-full h-full">
                <img
                  src={products[0].images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800'}
                  alt={products[0].name}
                  className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                />
                {/* Dark Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-500 group-hover:from-black/70 group-hover:via-black/30" />

                <div className="absolute inset-0 p-8 md:p-12 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <span className="inline-block bg-white text-[#E3543A] text-[10px] md:text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest mb-4 shadow-lg">
                      {products[0].subCategory || products[0].category?.name || 'FEATURED'}
                    </span>
                    <h3 className="text-white font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-tight mb-2">
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
            </div>
          )}

          {/* Right Column — 50% width, 2 stacked cards with equal height */}
          <div className="w-full md:w-1/2 flex flex-col gap-6 md:h-[600px]">
            {products.slice(1, 3).map((product, i) => (
              <div
                key={product._id}
                className="flex-1 min-h-0 h-[280px] md:h-auto rounded-[2rem] overflow-hidden relative group shadow-xl bg-gray-100"
              >
                <Link to={`/product/${product.slug}`} className="block w-full h-full">
                  <img
                    src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                    alt={product.name}
                    className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-500 group-hover:from-black/70 group-hover:via-black/20" />

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
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MasonryGrid;
