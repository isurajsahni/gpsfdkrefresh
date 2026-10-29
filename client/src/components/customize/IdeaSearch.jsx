import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiX } from 'react-icons/hi';
import ProductCard, { ProductCardSkeleton } from '../product/ProductCard';
import { loadSearchIndex, searchCatalogue } from '../../utils/searchIndex';

/* Products carry no tags or descriptions, and their names are poetic ("Audi
   Circuit Pulse", "Botanical Bengal"), so fuzzy search alone finds "lion" in
   Millionaire and "car" in Self-Care. Ideas people type map to the collections
   (and the few uncollected pieces) that show them instead. The first word of
   each theme is its chip. */
const THEMES = [
  { chip: 'Cars', words: ['cars', 'car', 'supercar', 'ferrari', 'porsche', 'audi', 'bmw', 'racing', 'vehicle', 'automobile'], collections: ['The Velocity Suite'] },
  { chip: 'Animals', words: ['animals', 'animal', 'lion', 'tiger', 'leopard', 'cheetah', 'panther', 'cat', 'wildlife', 'wild', 'eagle', 'bird', 'jungle'], collections: ['The Gaze of Power', 'The Wild Eccentrics'] },
  { chip: 'Flowers', words: ['flowers', 'flower', 'floral', 'botanical', 'bloom', 'rose', 'peony', 'plant', 'nature'], collections: ['The Botanical Muse', 'The Gilded Bloom'] },
  { chip: 'Space', words: ['space', 'galaxy', 'planet', 'saturn', 'cosmos', 'universe', 'star', 'nebula', 'moon'], collections: ['The Celestial Frontier'] },
  { chip: 'Gods', words: ['gods', 'god', 'spiritual', 'devotional', 'religious', 'krishna', 'ganesha', 'ganesh', 'ganpati', 'bhagwan'], names: ['Ganesha', "Krishna's Flute"] },
  { chip: 'Money', words: ['money', 'luxury', 'rich', 'wealth', 'dollar', 'millionaire', 'business', 'ceo', 'success', 'motivation'], collections: ['Millionaire Art'] },
  { chip: 'Abstract', words: ['abstract', 'texture', 'minimal', 'geometric', 'modern art'], collections: ['Ink & Interval', 'Tethered Horizons'] },
  { chip: 'City', words: ['city', 'skyline', 'urban', 'street', 'building', 'architecture'], collections: ['The Modern Legend'] },
];
const MAX_SHOWN = 8;

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Theme matches first, then names containing the query as a word, then the
// site search's fuzzy matches (for typos), without repeats
const findDesigns = (index, query) => {
  if (!index || query.length < 2) return [];
  const q = query.toLowerCase();
  const word = new RegExp(`\\b${escapeRegex(q.replace(/(es|s)$/, ''))}(s|es)?\\b`, 'i');
  const themes = THEMES.filter((t) => t.words.some((w) => word.test(w) || q.split(/\s+/).includes(w)));
  const themed = index.docs.filter((d) => themes.some((t) => t.collections?.includes(d.collection) || t.names?.includes(d.name)));
  const named = index.docs.filter((d) => word.test(d.name));
  const fuzzy = themed.length || named.length ? [] : searchCatalogue(index, query).products;
  return [...new Set([...named, ...themed, ...fuzzy])];
};

const chipClass = 'apple-caption rounded-full border border-black/[0.1] bg-white px-4 py-2 font-semibold text-[#1D1D1F] transition-colors hover:border-accent hover:text-accent';

/**
 * "Have an idea?" on the customiser: search the catalogue for a design instead
 * of uploading a photo. Uses the same in-browser index as the header search,
 * loaded only once someone starts searching.
 */
const IdeaSearch = ({ onUploadInstead }) => {
  const [query, setQuery] = useState('');
  const [wanted, setWanted] = useState(false);
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!wanted || index) return undefined;
    let alive = true;
    setError(false);
    loadSearchIndex()
      .then((idx) => { if (alive) setIndex(idx); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [wanted, index]);

  const q = query.trim();
  const products = useMemo(() => findDesigns(index, q), [index, q]);

  const search = (text) => {
    setWanted(true);
    setQuery(text);
  };

  return (
    <div className="mt-20 sm:mt-24">
      <h2 className="apple-headline font-heading">
        Have an idea? <span className="text-[#686868]">Search our designs.</span>
      </h2>

      <form role="search" onSubmit={(e) => e.preventDefault()} className="relative mt-6 max-w-xl">
        <HiOutlineSearch className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-[#686868]" />
        <input
          type="search"
          value={query}
          onFocus={() => setWanted(true)}
          onChange={(e) => search(e.target.value)}
          placeholder="Try lion, Krishna, cars, a city skyline…"
          aria-label="Search our designs"
          className="apple-body w-full rounded-full border border-black/[0.1] bg-white py-4 pl-12 pr-12 text-[#1D1D1F] placeholder:text-[#686868]/70 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#686868] hover:text-[#1D1D1F]"
          >
            <HiX className="size-5" />
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {THEMES.map(({ chip }) => (
          <button key={chip} type="button" onClick={() => search(chip)} className={chipClass}>
            {chip}
          </button>
        ))}
      </div>

      <div aria-live="polite">
        {error && (
          <p className="apple-body mt-8 text-[#686868]">
            Search isn't available right now. Please try again in a moment.
          </p>
        )}

        {q.length >= 2 && !index && !error && (
          <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {q.length >= 2 && index && products.length > 0 && (
          <>
            <p className="apple-caption mt-8 text-[#686868]">
              {products.length} {products.length === 1 ? 'design' : 'designs'} for “{q}”
            </p>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
              {products.slice(0, MAX_SHOWN).map((doc) => <ProductCard key={doc.id} product={doc.product} />)}
            </div>
            {products.length > MAX_SHOWN && (
              <Link
                to={`/search?q=${encodeURIComponent(q)}`}
                className="apple-body mt-6 inline-block font-semibold text-accent hover:underline"
              >
                See all {products.length} designs
              </Link>
            )}
          </>
        )}

        {q.length >= 2 && index && products.length === 0 && (
          <p className="apple-body mt-8 text-[#686868]">
            Nothing for “{q}” yet. Have a photo of it?{' '}
            <button type="button" onClick={onUploadInstead} className="font-semibold text-accent hover:underline">
              Upload it and we'll print it
            </button>
          </p>
        )}
      </div>
    </div>
  );
};

export default IdeaSearch;
