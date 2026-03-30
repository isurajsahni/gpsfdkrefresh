import { Link, useNavigate } from 'react-router-dom';
import ThumbnailImage from './ThumbnailImage';

const ProductRow = ({ product, index }) => {
  const isEven = index % 2 === 0;
  const navigate = useNavigate();

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

  const handleRedirect = () => {
    navigate(`/product/${product.slug}`);
  };

  const imageBlock = (
    <div className="w-full lg:w-[50%] flex items-stretch justify-center">
      <div className="w-full max-w-[550px] h-full">
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
            ₹{minPrice.toLocaleString('en-IN')}
          </span>
          {minPrice !== maxPrice && (
            <span className="text-2xl md:text-3xl font-bold text-accent">
              {' '}– ₹{maxPrice.toLocaleString('en-IN')}
            </span>
          )}
          {comparePrice > 0 && minPrice < comparePrice && (
            <span className="text-base text-gray-400 line-through">
              ₹{comparePrice.toLocaleString('en-IN')}
            </span>
          )}
        </div>

        {/* Size Selection (Read-only / Redirects to product) */}
        {sizes.length > 0 && (
          <div className="mb-6 w-full">
            <label className="block text-xs font-bold text-secondary/70 uppercase tracking-widest mb-3 text-center">
              Available Sizes
            </label>
            <div className={`grid ${sizes.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'} gap-[25px] w-full`}>
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={handleRedirect}
                  className="w-full px-4 py-3.5 rounded-xl border-2 border-gray-200 bg-white text-gray-600 hover:border-accent hover:text-accent hover:shadow-sm font-semibold transition-all duration-300 text-sm"
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Custom Text Input (Read-only / Redirects to product) */}
        {product.customizable !== false && (
          <div className="mb-8 w-full">
            <label className="block text-xs font-bold text-secondary/70 uppercase tracking-widest mb-3 text-center">
              {product.customizationLabel || 'Enter Your Text'}
            </label>
            <div 
              onClick={handleRedirect}
              className="w-full px-5 py-4 bg-white border-2 border-gray-200 rounded-xl hover:border-accent/50 cursor-pointer transition-colors group flex items-center justify-center"
            >
              <span className="text-gray-400 font-medium group-hover:text-accent transition-colors">
                Click to personalize...
              </span>
            </div>
          </div>
        )}

        {/* CTA Button */}
        <Link
          to={`/product/${product.slug}`}
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
      className={`zigzag-row flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-stretch gap-[50px] py-12 md:py-16`}
    >
      {imageBlock}
      {detailsBlock}
    </div>
  );
};

export default ProductRow;
