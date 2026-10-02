import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingCart, HiMinus, HiPlus, HiOutlineX, HiOutlineInformationCircle } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { useUI } from '../context/UIContext';
import API, { cachedGet, isNotFound } from '../utils/api';
import toast from 'react-hot-toast';
import ProductSlider from '../components/home/ProductSlider';
import SEO from '../components/seo/SEO';
import { optimizeImage, handleImageError } from '../utils/imageOptimizer';
import { productSeoTitle, productSeoDescription, productSchemaDescription } from '../utils/productSeo';
import NotFoundPage from './NotFoundPage';
import LoadErrorNotice from '../components/common/LoadErrorNotice';
import { useCurrency } from '../context/CurrencyContext';
import { useAuth } from '../context/AuthContext';
import { validators, formatters } from '../utils/validation';
import { CUSTOM_SIZE, isNameplateProduct, nameplateCustomText } from '../utils/nameplate';
import { categoryPath } from '../utils/categoryPath';
import { usePrerenderData } from '../prerender/PrerenderData';
import { dropStaticSnapshot } from '../prerender/snapshot';

// The story sits below the fold, so its code (about two-thirds of this page's)
// downloads alongside the product fetch rather than ahead of the buy box
const loadProductStory = () => import('../components/product/story/ProductStory');
const ProductStory = lazy(loadProductStory);

const ProductPage = () => {
  const { slug } = useParams();
  const location = useLocation();
  // Rendered outside the browser (api/render.js), the product comes with the
  // render; in the browser it's fetched below
  const prerendered = usePrerenderData()?.product;
  const initialProduct = prerendered?.slug === slug ? prerendered : null;
  const [product, setProduct] = useState(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  // 'notFound' only when the API answered 404; 'error' for anything temporary
  const [loadFailure, setLoadFailure] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const autoRetriedSlug = useRef(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariation, setSelectedVariation] = useState(() => initialProduct?.variations?.[0] || {});
  const [customText, setCustomText] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  // Custom size isn't a variation: selectedVariation keeps a real one (for the
  // story below and the schema) while this flag drives the UI.
  const [isCustomSize, setIsCustomSize] = useState(false);
  const [customSize, setCustomSize] = useState('');
  const [quoteForm, setQuoteForm] = useState({ name: '', email: '', phone: '' });
  const [quoteSending, setQuoteSending] = useState(false);
  const [quoteSent, setQuoteSent] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({});
  const [isZooming, setIsZooming] = useState(false);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);
  // The story below the fold sends buyers back up here (to name a nameplate,
  // or to request a custom-size price)
  const buyBoxRef = useRef(null);
  const nameInputRef = useRef(null);
  // ...and the buy box sends them down to it: the story renders its "which
  // size?" and "which finish?" shortcuts into this element, under Add to Cart
  const [shortcutsSlot, setShortcutsSlot] = useState(null);

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
  const { user } = useAuth();

  // Logged-in buyers shouldn't have to retype who they are for a quote
  useEffect(() => {
    if (!user) return;
    setQuoteForm(prev => ({
      name: prev.name || user.name || '',
      email: prev.email || user.email || '',
      phone: prev.phone || formatters.phone(user.phone || ''),
    }));
  }, [user]);

  useEffect(() => {
    loadProductStory().catch(() => {});
  }, []);

  useEffect(() => {
    let cancelled = false;
    let retryTimer;
    const fetchProduct = async () => {
      setLoading(true);
      setLoadFailure(null);
      try {
        const data = await cachedGet(`/products/${slug}`);
        if (cancelled) return;
        setProduct(data);
        // Size and text the buyer already picked on the category listing
        const prefill = location.state || {};
        setIsCustomSize(prefill.size === CUSTOM_SIZE);
        setQuoteSent(false);
        if (prefill.familyName) setCustomText(prefill.familyName);
        if (prefill.houseNumber) setHouseNumber(prefill.houseNumber);
        if (data.variations?.length > 0) {
          setSelectedVariation(data.variations.find(v => prefill.size && v.size === prefill.size) || data.variations[0]);
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
        if (cancelled) return;
        console.error(err);
        // Don't leave the previous product on screen (and addable to the cart)
        // under this product's URL
        setProduct(null);
        if (isNotFound(err)) {
          setLoadFailure('notFound');
        } else if (autoRetriedSlug.current !== slug) {
          // A rate limit or blip: try once more by itself, still showing the
          // spinner, before asking the shopper to retry
          autoRetriedSlug.current = slug;
          retryTimer = setTimeout(() => setAttempt((n) => n + 1), 2500);
          return;
        } else {
          setLoadFailure('error');
          dropStaticSnapshot();
        }
      }
      setLoading(false);
    };
    fetchProduct();
    return () => {
      cancelled = true;
      clearTimeout(retryTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- prefill is read once per product load
  }, [slug, attempt]);

  if (loadFailure === 'notFound') {
    return <NotFoundPage />;
  }

  // Loading, or a temporary failure: no <SEO> here, so the page never carries
  // a robots tag or another page's title while its product isn't on screen
  if (loading || !product) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pt-[60px]">
        {loadFailure === 'error' ? (
          <LoadErrorNotice title="We couldn't load this product just now" onRetry={() => setAttempt((n) => n + 1)} />
        ) : (
          <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        )}
      </div>
    );
  }

  // Determine if this is a nameplate product (show custom text only for nameplates)
  const isNameplate = isNameplateProduct(product);

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
      // Take them to the box, which may be a long way up from the story's button
      nameInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInputRef.current?.focus({ preventScroll: true });
      return;
    }
    addToCart(product, selectedVariation, quantity, isNameplate ? nameplateCustomText(customText, houseNumber) : '');
    setIsCartOpen(true);
  };

  // A finish or size picked in the story below, applied like the buy box's own buttons
  const pickVariation = (updates) => {
    setIsCustomSize(false);
    setSelectedVariation(findVariation(updates));
  };

  const showBuyBox = () => buyBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // The story's "ask for a custom size": switch to the quote form and go to it
  const chooseCustomSize = () => {
    setIsCustomSize(true);
    showBuyBox();
  };

  // A custom size has no price to charge, so instead of a cart line it becomes
  // a lead the team follows up on from the admin Leads page.
  const handleQuoteRequest = async (e) => {
    e.preventDefault();
    if (quoteSending) return;
    if (!customSize.trim()) {
      toast.error('Please enter the size you need');
      return;
    }
    const fieldError = validators.fullName(quoteForm.name) || validators.email(quoteForm.email) || validators.phone(quoteForm.phone);
    if (fieldError) {
      toast.error(fieldError);
      return;
    }

    const details = [
      `Custom size request: ${product.name}`,
      `https://www.gpsfdk.com/product/${product.slug}`,
      `Size: ${customSize.trim()}`,
      selectedVariation.material && `Material: ${selectedVariation.material}`,
      selectedVariation.frame && `Frame: ${selectedVariation.frame}`,
      selectedVariation.color && `Color: ${selectedVariation.color}`,
      customText.trim() && `Name on plate: ${customText.trim()}`,
      houseNumber.trim() && `House number: ${houseNumber.trim()}`,
      `Quantity: ${quantity}`,
    ].filter(Boolean);

    setQuoteSending(true);
    try {
      await API.post('/leads', {
        name: quoteForm.name.trim(),
        email: quoteForm.email.trim(),
        phone: formatters.phone(quoteForm.phone),
        message: details.join('\n'),
        // The same request as fields, for the team's WhatsApp alert
        quote: {
          slug: product.slug,
          size: customSize.trim(),
          material: selectedVariation.material || '',
          frame: selectedVariation.frame || '',
          color: selectedVariation.color || '',
          nameOnPlate: customText.trim(),
          houseNumber: houseNumber.trim(),
          quantity,
        },
      });
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { content_name: product.name, content_category: 'Custom Size' });
      }
      setQuoteSent(true);
      toast.success("Thanks — our team will call you with the price shortly.");
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setQuoteSending(false);
  };

  const quoteInputClass = 'w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20';

  const productSchema = product ? {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": product.images?.map(img => img.url) || [],
    "description": productSchemaDescription(product),
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
        "item": `https://www.gpsfdk.com${categoryPath(product.category.slug)}`,
      }] : []),
      // Last crumb is the current page — no item URL on the final breadcrumb
      { "@type": "ListItem", "position": hasCategoryCrumb ? 3 : 2, "name": product.name },
    ],
  } : null;

  return (
    <div className="min-h-screen bg-white pt-28 pb-0">
      {product && (
        <SEO
          title={productSeoTitle(product)}
          description={productSeoDescription(product)}
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
          <Link to={categoryPath(product.category?.slug)} className="hover:text-secondary">{product.category?.name}</Link>
          <span className="mx-2">/</span>
          <span className="text-secondary">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Images — thumbnails below on mobile, left column on desktop.
              Nameplates are landscape, so they get a 2:1.5 main image with the
              thumbnail strip stacked underneath it at every width. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            className={`flex flex-col gap-3 ${isNameplate ? 'self-start' : 'md:flex-row'}`}
          >
            {/* Thumbnails — horizontal on mobile, vertical on desktop */}
            {product.images?.length > 1 && (
              <div className={`flex gap-2 overflow-x-auto scrollbar-hide order-2 ${isNameplate ? '' : 'md:flex-col md:overflow-y-auto md:order-1 md:w-20 shrink-0'}`}>
                {product.images.map((img, index) => (
                  <div
                    key={index}
                    className={`${isNameplate ? 'aspect-[4/3] w-24 md:w-28' : 'aspect-square w-16 md:w-20'} flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-300 ${selectedImage === index ? 'border-accent shadow-md' : 'border-gray-200 hover:border-accent/40'
                      }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={optimizeImage(img.url, 200)} alt="" onError={handleImageError} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  </div>
                ))}
              </div>
            )}

            {/* Main Image */}
            <div
              className={`order-1 rounded-2xl overflow-hidden relative group cursor-zoom-in ${isNameplate ? 'w-full' : 'flex-1 md:order-2'}`}
              onMouseMove={isDesktop ? handleMouseMove : undefined}
              onMouseEnter={() => isDesktop && setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onClick={() => setIsFullscreenZoom(true)}
            >
              <div className={`${isNameplate ? 'aspect-[4/3]' : 'aspect-[4/5]'} w-full relative overflow-hidden rounded-2xl bg-white`}>
                <motion.img
                  key={selectedImage}
                  // The first image is the page's largest paint: show it at
                  // once, and only fade when switching between images
                  initial={selectedImage === 0 ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  fetchPriority="high"
                  src={optimizeImage(product.images?.[selectedImage]?.url || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=900', 1200)}
                  alt={product.name}
                  onError={handleImageError}
                  style={(isZooming && isDesktop) ? { ...zoomStyle, transform: 'scale(2.5)' } : { transform: 'scale(1)' }}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-200 ease-out will-change-transform"
                />
              </div>
            </div>
          </motion.div>

          {/* Details — not animated in: the price and Add to Cart must be
              readable the moment the page appears */}
          <div ref={buyBoxRef} className="scroll-mt-28">
            <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary">{product.name}</h1>



            {/* Price — shown here briefly under name, updates on variation change */}
            {isCustomSize ? (
              <div className="mt-6 rounded-xl bg-accent/10 border border-accent/20 px-5 py-4">
                <p className="text-lg font-semibold text-accent">Custom size pricing</p>
                <p className="text-gray-700 mt-1">One of our team will connect with you regarding the pricing.</p>
              </div>
            ) : (
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
            )}

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

              {(sizes.length > 0 || isNameplate) && (
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">Size</label>
                  <div className="flex flex-wrap gap-2">
                    {sizes.map(s => (
                      <button
                        key={s}
                        onClick={() => { setIsCustomSize(false); setSelectedVariation(findVariation({ size: s })); }}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${!isCustomSize && selectedVariation.size === s ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {s}
                      </button>
                    ))}
                    {isNameplate && (
                      <button
                        onClick={() => setIsCustomSize(true)}
                        className={`px-5 py-2.5 rounded-full text-sm font-medium border-2 transition-all duration-300 ease-in-out ${isCustomSize ? 'border-accent bg-accent text-white shadow-sm' : 'border-gray-200 hover:border-accent'}`}
                      >
                        {CUSTOM_SIZE}
                      </button>
                    )}
                  </div>
                  {isCustomSize && (
                    <input
                      type="text"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      placeholder="Your size, e.g. 24 x 16 inches"
                      aria-label="Custom size"
                      className="mt-3 w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-lg"
                    />
                  )}
                </div>
              )}

              {/* Custom Text + House Number — only for Nameplate products; side by side on desktop */}
              {isNameplate && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">{product.customizationLabel || 'Custom Text'}</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. The Sharma Family"
                      className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-secondary mb-2">House Number</label>
                    <input
                      type="text"
                      value={houseNumber}
                      onChange={(e) => setHouseNumber(e.target.value)}
                      placeholder="e.g. A 507"
                      className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-lg"
                    />
                  </div>
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
              {isCustomSize ? (
                quoteSent ? (
                  <div className="rounded-xl bg-green-50 border border-green-200 px-5 py-4 text-green-800">
                    <p className="font-semibold">Request received</p>
                    <p className="text-sm mt-1">One of our team will call you shortly with the price for your {customSize.trim() || 'custom'} size.</p>
                  </div>
                ) : (
                  <form onSubmit={handleQuoteRequest} className="space-y-3">
                    <p className="text-sm text-gray-600">Share your details and we'll get back to you with a price.</p>
                    <input
                      type="text"
                      value={quoteForm.name}
                      onChange={(e) => setQuoteForm({ ...quoteForm, name: e.target.value })}
                      placeholder="Your name"
                      aria-label="Your name"
                      autoComplete="name"
                      className={quoteInputClass}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="tel"
                        value={quoteForm.phone}
                        onChange={(e) => setQuoteForm({ ...quoteForm, phone: formatters.phone(e.target.value) })}
                        placeholder="Phone number"
                        aria-label="Phone number"
                        autoComplete="tel"
                        className={quoteInputClass}
                      />
                      <input
                        type="email"
                        value={quoteForm.email}
                        onChange={(e) => setQuoteForm({ ...quoteForm, email: e.target.value })}
                        placeholder="Email"
                        aria-label="Email"
                        autoComplete="email"
                        className={quoteInputClass}
                      />
                    </div>
                    <button type="submit" disabled={quoteSending} className="btn-primary w-full flex items-center justify-center gap-3 text-lg disabled:opacity-60">
                      {quoteSending ? 'Sending…' : 'Request Price'}
                    </button>
                  </form>
                )
              ) : (
                <button onClick={handleAddToCart} className="btn-primary w-full flex items-center justify-center gap-3 text-lg">
                  <HiOutlineShoppingCart className="w-6 h-6" /> Add to Cart
                </button>
              )}
              {/* Nameplates' shapes vary with the design, so their sizes come with a disclaimer */}
              {isNameplate && (
                <p className="flex items-start gap-2 rounded-xl bg-gray-100 px-4 py-3 text-sm text-gray-600">
                  <HiOutlineInformationCircle className="w-5 h-5 shrink-0 text-secondary mt-px" />
                  <span>
                    <strong className="font-semibold text-secondary">Disclaimer:</strong> Sizes are approximate. Because each design has a different shape, the final dimensions may vary slightly from the size shown.
                  </span>
                </p>
              )}
              {/* Filled by the story once it loads; hidden until then */}
              <div ref={setShortcutsSlot} className="empty:hidden" />
            </div>
          </div>
        </div>
      </div>

      {/* The product story: gallery hero, finishes, size to scale, details.
          Its pickers drive this page's selection, so they stay in step. */}
      <Suspense fallback={null}>
        <ProductStory
          key={product._id}
          product={product}
          selectedVariation={selectedVariation}
          isCustomSize={isCustomSize}
          quantity={quantity}
          needsText={isNameplate && !customText.trim()}
          onPick={pickVariation}
          onCustomSize={chooseCustomSize}
          onAddToCart={handleAddToCart}
          onShowBuyBox={showBuyBox}
          shortcutsSlot={shortcutsSlot}
        />
      </Suspense>

      {/* Related Products — straight after the story's green sign-off band */}
      {product.category && (
        <div>
          <ProductSlider
            title="Related Products"
            categorySlug={product.category.slug}
            featured={false}
            excludeId={product._id}
          />
        </div>
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
