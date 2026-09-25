import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ThumbnailImage from './ThumbnailImage';
import { useCurrency } from '../../context/CurrencyContext';
import { CUSTOM_SIZE, isNameplateProduct } from '../../utils/nameplate';

const ProductRow = ({ product, index }) => {
  const isEven = index % 2 === 0;
  const navigate = useNavigate();
  const { formatPrice } = useCurrency();
  const isNameplate = isNameplateProduct(product);

  // Typed here, carried to the product page through router state so the
  // buyer doesn't have to type them a second time.
  const [familyName, setFamilyName] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const productUrl = `/product/${product.slug}`;
  const productState = { familyName, houseNumber };

  const openProduct = (size = '') => navigate(productUrl, { state: { ...productState, size } });

  // The whole row opens the product. Inputs are left alone so the buyer can
  // type, and links/buttons do their own navigation.
  const handleRowClick = (e) => {
    if (e.target.closest('input, a, button')) return;
    openProduct();
  };

  // Price range
  const prices = product.variations?.map(v => v.price) || [product.basePrice];
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const comparePrice = product.variations?.[0]?.comparePrice;

  // Determine thumbnail
  const thumbnailSrc =
    product.thumbnailImage?.url ||
    product.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600';

  const sizes = [...new Set(product.variations?.map(v => v.size).filter(Boolean) || [])];
  const sizeOptions = isNameplate ? [...sizes, CUSTOM_SIZE] : sizes;

  const inputClass = 'w-full px-5 py-3.5 bg-white border-2 border-gray-200 rounded-xl focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 text-center text-secondary placeholder:text-gray-400 transition-colors';

  const imageBlock = (
    <div className="w-full lg:w-[50%] flex items-center justify-center">
      <div className="w-full max-w-[550px]">
        <ThumbnailImage
          src={thumbnailSrc}
          alt={product.name}
          slug={product.slug}
          state={productState}
          isEven={isEven}
        />
      </div>
    </div>
  );

  const detailsBlock = (
    <div className="w-full lg:w-[50%] flex flex-col items-center justify-center text-center">
      <div className="w-full max-w-lg mx-auto flex flex-col items-center">
        {/* Product Name */}
        <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-bold text-secondary leading-tight mb-4">
          {product.name}
        </h2>

        {/* Description */}
        {product.description && (
          <p className="text-gray-500 text-sm md:text-base leading-relaxed mb-6 text-center line-clamp-3">
            {product.description}
          </p>
        )}

        {/* Price Range */}
        <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
          <span className="text-2xl md:text-3xl font-bold text-accent">
            {formatPrice(minPrice)}
          </span>
          {minPrice !== maxPrice && (
            <span className="text-2xl md:text-3xl font-bold text-accent">
              {' '}– {formatPrice(maxPrice)}
            </span>
          )}
          {comparePrice > 0 && minPrice < comparePrice && (
            <span className="text-base text-gray-400 line-through">
              {formatPrice(comparePrice)}
            </span>
          )}
        </div>

        {/* Size Selection — opens the product with that size already picked */}
        {sizeOptions.length > 0 && (
          <div
            role="group"
            aria-label="Available sizes"
            className={`mb-9 grid ${sizeOptions.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-[25px] w-full`}
          >
            {sizeOptions.map((size, i) => {
              // An odd one out at the end spans the row instead of sitting half-width
              const spanRow = sizeOptions.length >= 2 && sizeOptions.length % 2 === 1 && i === sizeOptions.length - 1;
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => openProduct(size)}
                  className={`w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-accent hover:text-accent hover:shadow-sm font-semibold transition-all duration-300 text-sm ${spanRow ? 'col-span-2' : ''}`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        )}

        {/* Custom Text — same fields as the product page */}
        {(isNameplate || product.customizable) && (
          <div className={`mb-8 w-full grid grid-cols-1 ${isNameplate ? 'sm:grid-cols-2' : ''} gap-[25px]`}>
            <input
              type="text"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              placeholder="e.g. The Sharma Family"
              aria-label={product.customizationLabel || 'Name on nameplate'}
              className={inputClass}
            />
            {isNameplate && (
              <input
                type="text"
                value={houseNumber}
                onChange={(e) => setHouseNumber(e.target.value)}
                placeholder="House Number, e.g. A 507"
                aria-label="House number"
                className={inputClass}
              />
            )}
          </div>
        )}

        {/* CTA Button */}
        <Link
          to={productUrl}
          state={productState}
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg py-4 rounded-xl"
        >
          View Full Details
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </div>
  );

  return (
    <div
      onClick={handleRowClick}
      className={`zigzag-row flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-[50px] py-12 md:py-16 cursor-pointer`}
    >
      {imageBlock}
      {detailsBlock}
    </div>
  );
};

export default ProductRow;
