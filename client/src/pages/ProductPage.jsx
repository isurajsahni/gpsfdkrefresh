import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiMinus, HiPlus, HiStar } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const ProductPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [customText, setCustomText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products/${slug}`);
        setProduct(data);
        if (data.variations?.length > 0) {
          setSelectedVariation(data.variations[0]);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-heading text-secondary">Product not found</h2>
        <Link to="/" className="btn-primary mt-4">Back to Home</Link>
      </div>
    );
  }

  // Get unique variation options
  const materials = [...new Set(product.variations.filter(v => v.material).map(v => v.material))];
  const frames = [...new Set(product.variations.filter(v => v.frame).map(v => v.frame))];
  const sizes = [...new Set(product.variations.map(v => v.size))];
  const colors = [...new Set(product.variations.filter(v => v.color).map(v => v.color))];

  const findVariation = (updates) => {
    const criteria = { ...selectedVariation, ...updates };
    return product.variations.find(v =>
      (!v.material || v.material === criteria.material) &&
      (!v.frame || v.frame === criteria.frame) &&
      v.size === criteria.size &&
      (!v.color || v.color === criteria.color)
    ) || product.variations.find(v => v.size === criteria.size) || selectedVariation;
  };

  const handleAddToCart = () => {
    if (product.customizable && !customText.trim()) {
      toast.error('Please enter custom text');
      return;
    }
    addToCart(product, selectedVariation, quantity, customText);
    setIsCartOpen(true);
  };

  return (
    <div className="min-h-screen bg-primary pt-24 pb-20">
      <div className="max-w-7xl mx-auto section-padding">
        {/* Breadcrumb */}
        <nav className="text-gray-400 text-sm mb-8">
          <Link to="/" className="hover:text-secondary">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/category/${product.category?.slug}`} className="hover:text-secondary">{product.category?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-secondary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="aspect-square relative rounded-3xl overflow-hidden bg-white shadow-lg border border-gray-100 group">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                src={product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900'}
                alt={product.name}
                className="w-full h-full object-cover cursor-zoom-in"
              />
              <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-secondary uppercase tracking-widest border border-white/50">
                Premium
              </div>
            </div>
            
            {product.images?.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all duration-300 relative ${
                      selectedImage === i 
                        ? 'border-accent shadow-md scale-105' 
                        : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
                    }`}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                    {selectedImage === i && (
                      <div className="absolute inset-0 bg-accent/10 pointer-events-none" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-3">
              {[...Array(5)].map((_, i) => (
                <HiStar key={i} className={`w-5 h-5 ${i < (product.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`} />
              ))}
              <span className="text-gray-500 text-sm">({product.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="mt-6">
              <span className="text-4xl font-bold text-accent">₹{selectedVariation.price?.toLocaleString()}</span>
              {selectedVariation.comparePrice > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through ml-3">₹{selectedVariation.comparePrice.toLocaleString()}</span>
                  <span className="ml-3 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {Math.round((1 - selectedVariation.price / selectedVariation.comparePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

            <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

            {/* Variations */}
            <div className="mt-8 space-y-6">
              {materials.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Material</label>
                  <div className="flex flex-wrap gap-2">
                    {materials.map(m => (
                      <button
                        key={m}
                        onClick={() => setSelectedVariation(findVariation({ material: m }))}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${selectedVariation.material === m ? 'border-accent bg-accent text-white' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {frames.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Frame</label>
                  <div className="flex flex-wrap gap-2">
                    {frames.map(f => (
                      <button
                        key={f}
                        onClick={() => setSelectedVariation(findVariation({ frame: f }))}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${selectedVariation.frame === f ? 'border-accent bg-accent text-white' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {colors.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedVariation(findVariation({ color: c }))}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${selectedVariation.color === c ? 'border-accent bg-accent text-white' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => setSelectedVariation(findVariation({ size: s }))}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all ${selectedVariation.size === s ? 'border-accent bg-accent text-white' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Text */}
              {product.customizable && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">{product.customizationLabel || 'Custom Text'}</label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="e.g. The Sharma Family"
                    className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-lg"
                  />
                </div>
              )}
            </div>

            {/* Quantity + Add to Cart */}
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border-2 border-gray-200 rounded-full overflow-hidden">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-4 py-3 hover:bg-cream-dark transition-colors">
                  <HiMinus className="w-5 h-5" />
                </button>
                <span className="px-6 py-3 font-semibold text-lg min-w-[60px] text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-3 hover:bg-cream-dark transition-colors">
                  <HiPlus className="w-5 h-5" />
                </button>
              </div>
              <button onClick={handleAddToCart} className="btn-primary flex-1 flex items-center justify-center gap-3 text-lg">
                <HiOutlineShoppingCart className="w-6 h-6" /> Add to Cart — ₹{(selectedVariation.price * quantity).toLocaleString()}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
