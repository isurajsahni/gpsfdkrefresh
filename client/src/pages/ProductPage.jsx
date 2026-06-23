import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingCart, HiMinus, HiPlus, HiEye, HiOutlineX } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import ProductSlider from '../components/home/ProductSlider';
import SEO from '../components/seo/SEO';
import ViewOnWallModal from '../components/product/ViewOnWallModal';
import { optimizeImage, handleImageError } from '../utils/imageOptimizer';
import NotFoundPage from './NotFoundPage';
import { useCurrency } from '../context/CurrencyContext';

const ProductPage = () => {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState({});
  const [customText, setCustomText] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isWallPreviewOpen, setIsWallPreviewOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({ transformOrigin: `${x}% ${y}%` });
  };

  const { addToCart } = useCart();
  const { setIsCartOpen } = useUI();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const { data } = await API.get(`/products/${slug}`);
        setProduct(data);
        if (data.variations?.length > 0) {
          setSelectedVariation(data.variations[0]);
        }
        // Meta Pixel: ViewContent event
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'ViewContent', {
            content_name: data.name,
            content_ids: [data._id],
            content_type: 'product',
            value: data.variations?.[0]?.price || data.basePrice,
            currency: 'INR', // Meta Pixel always uses base currency
          });
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
      <div className="min-h-screen bg-white flex items-center justify-center pt-[60px]">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return <NotFoundPage />;
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
      // Schema must state the canonical store currency. The on-screen geo conversion
      // from useCurrency() is display-only — Googlebot crawls from US IPs and would
      // otherwise see INR amounts labeled as USD.
      "priceCurrency": "INR",
      "price": selectedVariation?.price || product.basePrice,
      "itemCondition": "https://schema.org/NewCondition",
      // With variations, in stock if any variation has stock; without variations,
      // fall back to the product's top-level stock field (model defaults it to 100).
      "availability": (product.variations?.length > 0
        ? product.variations.some(v => v.stock > 0)
        : (product.stock ?? 0) > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    }
  } : null;

  // BreadcrumbList mirroring the visible breadcrumb: Home → category → product.
  // product.category may be a populated object ({ name, slug }) or a bare id string —
  // skip the category crumb when name/slug aren't available.
  const hasCategoryCrumb = Boolean(product?.category?.name && product?.category?.slug);
  const breadcrumbSchema = product ? {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.gpsfdk.com" },
      ...(hasCategoryCrumb ? [{
        "@type": "ListItem",
        "position": 2,
        "name": product.category.name,
        "item": `https://www.gpsfdk.com/${product.category.slug}`,
      }] : []),
      // Last crumb is the current page — no item URL on the final breadcrumb
      { "@type": "ListItem", "position": hasCategoryCrumb ? 3 : 2, "name": product.name },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-white pt-28 pb-0">
      {product && (
        <SEO
          title={product.metaTitle || `${product.name} | Custom Designs by GPSFDK`}
          description={product.metaDescription || product.description?.substring(0, 160)}
          image={optimizeImage(product.images?.[0]?.url, 800)}
          schema={[productSchema, breadcrumbSchema]}
          type="product"
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Images — thumbnails below on mobile, left column on desktop */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col md:flex-row gap-3"
          >
            {/* Thumbnails — horizontal on mobile, vertical on desktop */}
            {product.images?.length > 1 && (
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto scrollbar-hide order-2 md:order-1 md:w-20 shrink-0">
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`aspect-square w-16 md:w-20 flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedImage === index ? 'border-accent shadow-md' : 'border-gray-200 hover:border-accent/40'
                      }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={optimizeImage(img.url, 200)} alt="" onError={handleImageError} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div
              className="flex-1 order-1 md:order-2 rounded-2xl overflow-hidden relative group cursor-zoom-in"
              onMouseMove={isDesktop ? handleMouseMove : undefined}
              onMouseEnter={() => isDesktop && setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onClick={() => setIsFullscreenZoom(true)}
            >
              <div className="aspect-[4/5] w-full relative overflow-hidden rounded-2xl bg-white">
                <motion.img
                  key={selectedImage}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  src={optimizeImage(product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900', 1200)}
                  alt={product.name}
                  onError={handleImageError}
                  style={(isZooming && isDesktop) ? { ...zoomStyle, transform: 'scale(2.5)' } : { transform: 'scale(1)' }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 ease-out will-change-transform"
                />
              </div>
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{product.name}</h1>



            {/* Price — shown here briefly under name, updates on variation change */}
            <div className="mt-6">
              <span className="text-4xl font-bold text-accent">{formatPrice(selectedVariation.price * quantity)}</span>
              {selectedVariation.comparePrice > 0 && (
                <>
                  <span className="text-xl text-gray-400 line-through ml-3">{formatPrice(selectedVariation.comparePrice * quantity)}</span>
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
              <div 
                className="mb-10 text-lg leading-relaxed text-gray-800 prose prose-secondary max-w-none"
                dangerouslySetInnerHTML={{ __html: product.description }}
              />
            )}

            {/* Static Canvas Details - Only show for Canvas */}
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

      {/* Fullscreen HD Zoom Modal */}
      <AnimatePresence>
        {isFullscreenZoom && product && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black flex items-center justify-center cursor-zoom-out"
            onClick={() => setIsFullscreenZoom(false)}
          >
            <button
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-50"
              onClick={() => setIsFullscreenZoom(false)}
            >
              <HiOutlineX className="w-8 h-8" />
            </button>
            <img
              src={product.images?.[selectedImage]?.url}
              alt={product.name}
              onError={handleImageError}
              className="w-full h-full object-contain"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductPage;
