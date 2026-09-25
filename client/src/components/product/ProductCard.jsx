import { Link } from 'react-router-dom';
import { useCurrency } from '../../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../../utils/imageOptimizer';
import { lowestPrice } from '../../utils/collections';

const BADGE_COLORS = {
  bestseller: 'bg-[#F5A623]',
  new: 'bg-[#27AE60]',
  lowstock: 'bg-[#E74C3C]',
};

const BADGE_LABELS = {
  bestseller: 'Bestseller',
  new: 'New Arrival',
  lowstock: 'Low Stock',
};

const badgeFor = (product) => {
  const variations = product.variations || [];
  const totalStock = variations.reduce((acc, v) => acc + (v.stock || 0), 0);
  if (variations.length > 0 && totalStock > 0 && totalStock <= 10) return 'lowstock';
  if (product.featured) return 'bestseller';
  if (product.createdAt && new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) return 'new';
  return '';
};

/**
 * The collection-page product card (image, name, starting price, "Full
 * details"), shared by the canvas collections and search results.
 */
const ProductCard = ({ product, onClick }) => {
  const { formatPrice } = useCurrency();
  const minPrice = lowestPrice(product);
  const hasPriceRange = (product.variations || []).some((v) => v.price > 0 && v.price !== minPrice);
  const badge = badgeFor(product);

  return (
    <Link to={`/product/${product.slug}`} onClick={onClick} className="group block h-full rounded-xl">
      <div className="bg-[#fff7e7] rounded-xl p-[10px] h-full flex flex-col transition-transform duration-300 hover:-translate-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.08)]" data-badge={badge}>
        <div className="relative aspect-[4/5] w-full rounded-lg overflow-hidden mb-5 bg-white shadow-sm">
          {badge && (
            <div className={`absolute top-2 left-2 z-10 text-[10px] px-2 py-1 rounded font-semibold text-white uppercase tracking-wider ${BADGE_COLORS[badge]}`}>
              {BADGE_LABELS[badge]}
            </div>
          )}
          <img
            src={optimizeImage(product.images?.[0]?.url, 500)}
            alt={product.name}
            onError={handleImageError}
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex flex-col flex-grow items-center justify-center text-center px-1">
          <h3 className="font-heading text-[16px] font-semibold text-secondary uppercase tracking-wider mb-2 leading-snug">{product.name}</h3>
          <p className="text-accent font-bold text-[16px] mb-5 tracking-wide">
            {hasPriceRange ? `Starting from ${formatPrice(minPrice)}` : formatPrice(minPrice)}
          </p>
        </div>
        <div className="w-full font-heading bg-accent text-white font-bold py-3.5 text-center transition-all hover:bg-accent-dark mt-auto rounded-lg shadow-sm hover:shadow-md">
          Full details
        </div>
      </div>
    </Link>
  );
};

// Placeholder with the card's shape, shown while a listing loads
export const ProductCardSkeleton = () => (
  <div className="bg-[#fff7e7] rounded-xl p-[10px] h-full flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.08)]" aria-hidden="true">
    <div className="aspect-[4/5] w-full rounded-lg mb-5 bg-black/5 animate-pulse" />
    <div className="flex flex-col items-center gap-3 mb-5">
      <div className="h-4 w-3/4 rounded bg-black/5 animate-pulse" />
      <div className="h-4 w-1/2 rounded bg-black/5 animate-pulse" />
    </div>
    <div className="h-12 w-full rounded-lg bg-black/5 animate-pulse mt-auto" />
  </div>
);

export default ProductCard;
