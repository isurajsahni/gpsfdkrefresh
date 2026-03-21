import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiOutlineAdjustments } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';

const CategoryPage = () => {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const subcategory = searchParams.get('subcategory');
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const catRes = await API.get(`/categories/${slug}`);
        setCategory(catRes.data);
        const params = { limit: 50 };
        if (sort) params.sort = sort;
        const { data } = await API.get('/products', { params });
        const filtered = data.products.filter(p => {
          if (p.category?.slug !== slug) return false;
          if (subcategory && p.subCategory !== subcategory) return false;
          return true;
        });
        setProducts(filtered);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, [slug, sort, subcategory]);

  return (
    <div className="min-h-screen bg-primary pt-24">
      {/* Header */}
      <div className="bg-secondary section-padding py-16">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <nav className="text-white/50 text-sm mb-4">
              <Link to="/" className="hover:text-white">Home</Link> <span className="mx-2">/</span>
              {subcategory ? (
                <>
                  <Link to={`/category/${slug}`} className="hover:text-white">{category?.name || slug}</Link>
                  <span className="mx-2">/</span> <span className="text-white">{subcategory}</span>
                </>
              ) : (
                <span className="text-white">{category?.name || slug}</span>
              )}
            </nav>
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-white">{subcategory || category?.name || slug}</h1>
            <p className="text-white/60 mt-3 max-w-xl">{category?.description}</p>
          </motion.div>
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-7xl mx-auto section-padding py-6 flex items-center justify-between">
        <p className="text-gray-500">{products.length} products</p>
        <div className="flex items-center gap-3">
          <HiOutlineAdjustments className="w-5 h-5 text-secondary" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-accent"
          >
            <option value="">Sort: Latest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name: A-Z</option>
          </select>
        </div>
      </div>

      {/* Product Grid */}
      <div className="max-w-7xl mx-auto section-padding pb-20">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No products found in this category.</p>
            <Link to="/" className="btn-primary mt-4 inline-block">Back to Home</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link to={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-cream-dark">
                    <img
                      src={product.images?.[0]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600'}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-end p-5">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          if (product.variations?.length > 0) {
                            addToCart(product, product.variations[0]);
                            setIsCartOpen(true);
                          }
                        }}
                        className="bg-accent hover:bg-accent-dark text-white py-2 px-4 rounded-full text-sm font-semibold flex items-center gap-2 w-fit transition-all"
                      >
                        <HiOutlineShoppingCart className="w-4 h-4" /> Quick Add
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="font-heading text-lg font-semibold text-secondary group-hover:text-accent transition-colors">{product.name}</h3>
                    <p className="text-accent font-bold mt-1">
                      ₹{product.basePrice?.toLocaleString()}
                      {product.variations?.[0]?.comparePrice > 0 && (
                        <span className="text-gray-400 text-sm line-through ml-2">₹{product.variations[0].comparePrice.toLocaleString()}</span>
                      )}
                    </p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
