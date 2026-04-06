import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineShoppingCart, HiMinus, HiPlus, HiEye } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import ProductSlider from '../components/home/ProductSlider';
import SEO from '../components/seo/SEO';
import ViewOnWallModal from '../components/product/ViewOnWallModal';
import { optimizeImage } from '../utils/imageOptimizer';

const ProductPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [customText, setCustomText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWallPreviewOpen, setIsWallPreviewOpen] = useState(false);
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
      <div className="min-h-screen bg-white flex items-center justify-center pt-20">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center pt-20">
        <h2 className="text-2xl font-heading text-secondary">Product not found</h2>
        <Link to="/" className="btn-primary mt-4">Back to Home</Link>
      </div>
    );
  }

  // Determine if this is a nameplate product (show custom text only for nameplates)
  const isNameplate = product.category?.name?.toLowerCase().includes('nameplate');

  // Cascading variation options: Material → Frame → Size → Color
  // Materials: always show all available
  const materials = [...new Set(product.variations.filter(v => v.material).map(v => v.material))];

  // Frames: filtered by the currently selected material
  const materialFiltered = selectedVariation.material
    ? product.variations.filter(v => v.material === selectedVariation.material)
    : product.variations;
  const frames = [...new Set(materialFiltered.filter(v => v.frame).map(v => v.frame))];

  // Sizes: filtered by selected material AND frame
  const frameFiltered = selectedVariation.frame
    ? materialFiltered.filter(v => v.frame === selectedVariation.frame)
    : materialFiltered;
  const sizes = [...new Set(frameFiltered.map(v => v.size))];

  // Colors: filtered by selected material, frame, AND size
  const sizeFiltered = selectedVariation.size
    ? frameFiltered.filter(v => v.size === selectedVariation.size)
    : frameFiltered;
  const colors = [...new Set(sizeFiltered.filter(v => v.color).map(v => v.color))];

  const findVariation = (updates) => {
    const criteria = { ...selectedVariation, ...updates };

    // Score each variation by how many attributes match the desired criteria
    let bestMatch = null;
    let bestScore = -1;

    for (const v of product.variations) {
      let score = 0;
      // The updated attribute(s) MUST match
      let requiredMatch = true;
      for (const key of Object.keys(updates)) {
        if (v[key] !== undefined && v[key] !== '' && updates[key] !== undefined && updates[key] !== '') {
          if (v[key] !== updates[key]) { requiredMatch = false; break; }
          score += 10; // High weight for the attribute the user just changed
        }
      }
      if (!requiredMatch) continue;

      // Score optional attributes
      if (v.size && v.size === criteria.size) score += 3;
      if (v.material && v.material === criteria.material) score += 2;
      if (v.frame && v.frame === criteria.frame) score += 2;
      if (v.color && v.color === criteria.color) score += 2;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = v;
      }
    }

    return bestMatch || selectedVariation;
  };

  const handleAddToCart = () => {
    if (isNameplate && !customText.trim()) {
      toast.error('Please enter custom text');
      return;
    }
    addToCart(product, selectedVariation, quantity, isNameplate ? customText : '');
    setIsCartOpen(true);
  };

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => img.url) || [],
    "description": product.description,
    "sku": product.sku || product._id,
    "brand": {
      "@type": "Brand",
      "name": "GPSFDK"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://www.gpsfdk.com/product/${product.slug}`,
      "priceCurrency": "INR",
      "price": selectedVariation?.price || product.basePrice,
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
    }
  } : null;

  return (
    <div className="min-h-screen bg-white pt-28 pb-0">
      {product && (
        <SEO
          title={`${product.name} | Custom Designs by GPSFDK`}
          description={product.description?.substring(0, 160)}
          image={optimizeImage(product.images?.[0]?.url, 800)}
          schema={productSchema}
        />
      )}
      <div className="max-w-7xl mx-auto section-padding pt-8 pb-12">
        {/* Breadcrumb */}
        <nav className="text-gray-400 text-sm mb-8">
          <Link to="/" className="hover:text-secondary">Home</Link>
          <span className="mx-2">/</span>
          <Link to={`/${product.category?.slug}`} className="hover:text-secondary">{product.category?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-secondary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images — thumbnails left, main image right */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col-reverse sm:flex-row gap-3"
          >
            {/* Thumbnails */}
            {product.images?.length > 1 && (
              <div className="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-y-auto scrollbar-hide">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`aspect-square w-20 sm:w-24 flex-shrink-0 cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-300 ${selectedImage === index ? 'border-accent' : 'border-gray-100 hover:border-accent/40'
                      }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={optimizeImage(img.url, 200)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-white  flex items-baseline justify-center">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                src={optimizeImage(product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900', 800)}
                alt={product.name}
                className="w-full h-auto max-h-[70vh] object-contain rounded-xl"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{product.name}</h1>



            {/* Price — shown here briefly under name, updates on variation change */}
            <div className="mt-6">
              <span className="text-4xl font-bold text-accent">₹{(selectedVariation.price * quantity)?.toLocaleString()}</span>
              {selectedVariation.comparePrice > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through ml-3">₹{(selectedVariation.comparePrice * quantity).toLocaleString()}</span>
                  <span className="ml-3 bg-green-100 text-green-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {Math.round((1 - selectedVariation.price / selectedVariation.comparePrice) * 100)}% OFF
                  </span>
                </>
              )}
            </div>

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
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${selectedVariation.material === m ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
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
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${selectedVariation.frame === f ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
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
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${selectedVariation.color === c ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
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
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${selectedVariation.size === s ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Text — only for Nameplate products */}
              {isNameplate && (
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
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-secondary">Qty</span>
                <div className="inline-flex items-center border border-gray-200 rounded-full overflow-hidden">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 py-1.5 hover:bg-cream-dark transition-colors">
                    <HiMinus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1.5 font-semibold text-sm min-w-[36px] text-center">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="px-3 py-1.5 hover:bg-cream-dark transition-colors">
                    <HiPlus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <button onClick={handleAddToCart} className="btn-primary w-full flex items-center justify-center gap-3 text-lg">
                <HiOutlineShoppingCart className="w-6 h-6" /> Add to Cart
              </button>
              {/* Only show 'View on Your Wall' for wall-related products instead of applying it to all products */}
              {['wall-canvas', 'house-nameplates', 'the-wild-eccentrics', 'match-your-vibe', 'wall-clocks', 'neon-signs'].includes(product.category?.slug) && (
                <button 
                  onClick={() => setIsWallPreviewOpen(true)}
                  className="w-full flex items-center justify-center gap-2 text-secondary bg-gray-100 hover:bg-gray-200 border-2 border-transparent hover:border-gray-300 font-semibold py-3 px-6 rounded-xl transition-all duration-300"
                >
                  <HiEye className="w-5 h-5" /> View on Your Wall
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Extensive Product Description Section */}
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 mt-[100px] pb-16">
        <div className="bg-[#fffdf9] rounded-3xl p-8 md:p-12 border border-[#eae0cc] shadow-sm">
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-secondary mb-6 border-b border-gray-200 pb-4">
            Product Description: {product.name}
          </h2>

          <div className="prose prose-lg max-w-none text-gray-700">
            {/* Dynamic Description provided by Admin */}
            {product.description && (
              <div className="mb-10 text-lg leading-relaxed whitespace-pre-line text-gray-800">
                {product.description}
              </div>
            )}

            {/* Static Canvas Details - Only show for Wall Canvas */}
            {product.category?.slug === 'wall-canvas' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-secondary mb-3">1. Canvas Print*</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><strong>Paper Quality:</strong> 350 GSM</li>
                    <li>Printed using high-quality digital industrial eco-solvent printers</li>
                    <li><strong>Inks:</strong> Eco-solvent (environment-friendly and long-lasting)</li>
                    <li><strong>Ideal for:</strong> Premium wall art, photo canvases, exhibitions, and décor</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-secondary mb-4">2. Poster Options*</h3>

                  <div className="space-y-6 pl-4 border-l-2 border-accent/20">
                    <div>
                      <h4 className="font-bold text-lg text-secondary mb-2">a) Soft Board Poster</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Material:</strong> 5mm thick sunboard (instead of soft board)</li>
                        <li><strong>Features:</strong> Lightweight, sturdy, easy to mount</li>
                        <li><strong>Usage:</strong> Office display, educational charts, presentations, Home decor.</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg text-secondary mb-2">b) Sticker Poster</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Material:</strong> 120 GSM Vinyl Sheet</li>
                        <li><strong>Type:</strong> Self-adhesive sticker (peel and stick)</li>
                        <li><strong>Usage:</strong> Branding, signage, product labels, glass surface display</li>
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-lg text-secondary mb-2">c) Paper Poster</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        <li><strong>Paper Quality:</strong> 300 GSM premium paper</li>
                        <li><strong>Finish:</strong> Matte</li>
                        <li><strong>Usage:</strong> Wall posters, promotional material, events, décor</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 my-8" />

                <div className="text-center">
                  <p className="font-heading font-bold text-xl text-secondary mb-1">Brand: GPSFDK</p>
                  <p className="text-accent font-medium">Eco-friendly inks | High durability | Premium finish</p>
                </div>
              </div>
            )}

            {/* Static Nameplate Details - Only show for House Nameplates */}
            {product.category?.slug === 'house-nameplates' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-bold text-secondary mb-3">Affordable Elegance, Built To Last</h3>
                  <p className="text-lg leading-relaxed text-gray-800 italic">
                    Bring home style and durability at an affordable price! Our Value-Packed Vinyl Nameplates reflect our belief that everyone has the Right To Luxury, offering a sleek, elegant look without compromise.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-secondary mb-4">Description:</h3>
                  <ul className="space-y-3">
                    <li className="flex gap-2"><span>✨</span> <strong>Premium House Nameplate At An Affordable Price</strong> – Designed For Every Home.</li>
                    <li className="flex gap-2"><span>🪞</span> <strong>Built On A Durable Acrylic Base</strong> With A Matte Vinyl Finish For A Smooth, Elegant Look.</li>
                    <li className="flex gap-2"><span>💧</span> <strong>Weather-Resistant And Long-Lasting</strong> – Perfect For Outdoor Use.</li>
                    <li className="flex gap-2"><span>⚡</span> <strong>Lightweight Yet Sturdy</strong>, Making It Easy To Install.</li>
                    <li className="flex gap-2"><span>🌟</span> <strong>Perfect For Those Searching For Custom Vinyl Nameplates Online</strong> That Combine Luxury And Value.</li>
                  </ul>
                </div>

                <div className="bg-cream/30 p-6 rounded-2xl border border-accent/10">
                  <h3 className="text-xl font-bold text-secondary mb-4">What’s Included In The Box:</h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2"><span>📦</span> 1 × Value-Packed Vinyl Nameplate</li>
                    <li className="flex gap-2"><span>🛠</span> 1 × Hanging Kit For Easy Installation</li>
                    <li className="flex gap-2"><span>🎖</span> 1 × GPS Family Certificate</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-secondary mb-4">Care & Handling:</h3>
                  <ul className="space-y-2">
                    <li className="flex gap-2"><span>🧽</span> Clean directly using a soft damp cloth.</li>
                    <li className="flex gap-2"><span>💧</span> Avoid washing or rinsing with water.</li>
                    <li className="flex gap-2"><span>❌</span> Do not use harsh chemicals; simply wipe gently for a long-lasting finish.</li>
                  </ul>
                </div>

                <hr className="border-gray-200 my-8" />

                <div className="text-center">
                  <p className="font-heading font-bold text-xl text-secondary mb-1">Brand: GPSFDK</p>
                  <p className="text-accent font-medium">Right to Luxury | High durability | Premium finish</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Products */}
      {product.category && (
        <div className="mt-10">
          <ProductSlider
            title="Related Products"
            categorySlug={product.category.slug}
            featured={false}
            excludeId={product._id}
          />
        </div>
      )}

      {/* View on Wall AR Modal */}
      {product && (
        <ViewOnWallModal 
          isOpen={isWallPreviewOpen} 
          onClose={() => setIsWallPreviewOpen(false)} 
          imageUrl={optimizeImage(product.thumbnailImage?.url || product.images?.[1]?.url || product.images?.[0]?.url, 800)} 
        />
      )}
    </div>
  );
};

export default ProductPage;
