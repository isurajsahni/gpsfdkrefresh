import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThumbnailImage from './ThumbnailImage';
import VariationSelector from './VariationSelector';

const ProductRow = ({ product, index }) => {
  const isEven = index % 2 === 0;
  const [selectedVariation, setSelectedVariation] = useState(
    product.variations?.[0] || null
  );
  const [customText, setCustomText] = useState('');

  // Pre-fill custom text from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`nameplate_text_${product._id}`);
    if (saved) setCustomText(saved);
  }, [product._id]);

  // Save custom text to localStorage on change
  const handleTextChange = (e) => {
    const val = e.target.value;
    setCustomText(val);
    localStorage.setItem(`nameplate_text_${product._id}`, val);
  };

  // Price range
  const prices = product.variations?.map(v => v.price) || [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  // Determine thumbnail: use thumbnailImage if available, else first gallery image
  const thumbnailSrc =
    product.thumbnailImage?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600';

  const imageBlock = (
    <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-8">
      <div className="w-full max-w-[480px]">
        <ThumbnailImage
          src={thumbnailSrc}
          alt={product.name}
          slug={product.slug}
          isEven={isEven}
        />
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="w-full lg:w-1/2 flex items-center p-6 lg:p-12">
      <div className="w-full max-w-lg mx-auto lg:mx-0">
        {/* Product Name */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-secondary leading-tight mb-3">
          {product.name}
        </h2>

        {/* Description */}
        {product.description && (
          <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-5 line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Price Range */}
        <div className="mb-6">
          <span className="text-2xl md:text-3xl font-bold text-accent">
            ₹{minPrice.toLocaleString('en-IN')}
          </span>
          {minPrice !== maxPrice && (
            <span className="text-2xl md:text-3xl font-bold text-accent">
              {' '}– ₹{maxPrice.toLocaleString('en-IN')}
            </span>
          )}
          {selectedVariation?.comparePrice > 0 && (
            <span className="text-base text-gray-400 line-through ml-3">
              ₹{selectedVariation.comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Variation Selector */}
        {product.variations?.length > 1 && (
          <div className="mb-5">
            <label className="block text-xs font-bold text-secondary/70 uppercase tracking-widest mb-2">
              Select Size
            </label>
            <VariationSelector
              variations={product.variations}
              selected={selectedVariation}
              onSelect={setSelectedVariation}
            />
          </div>
        )}

        {/* Custom Text Input */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-secondary/70 uppercase tracking-widest mb-2">
            {product.customizationLabel || 'Enter Your Text'}
          </label>
          <input
            type="text"
            value={customText}
            onChange={handleTextChange}
            placeholder="e.g. The Sharma Family"
            className="w-full px-5 py-3.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-base font-medium text-secondary placeholder:text-gray-300 transition-all duration-300"
          />
        </div>

        {/* CTA Button */}
        <Link
          to={`/product/${product.slug}${customText ? `?text=${encodeURIComponent(customText)}` : ''}`}
          className="btn-primary inline-flex items-center gap-2 text-base"
        >
          Full Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );

  return (
    <div
      className={`zigzag-row flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch py-6 md:py-10`}
    >
      {imageBlock}
      {detailsBlock}
    </div>
  );
};

export default ProductRow;
