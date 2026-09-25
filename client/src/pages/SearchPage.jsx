import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { HiOutlineSearch } from 'react-icons/hi';
import SEO from '../components/seo/SEO';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import {
  loadSearchIndex, searchCatalogue, popularProducts, POPULAR_COLLECTIONS, SEARCH_CATEGORIES,
} from '../utils/searchIndex';

const chipClass = 'px-4 py-2 rounded-full text-sm font-semibold bg-white border border-gray-200 text-secondary hover:border-accent hover:text-accent transition-colors';

// /search?q= — the full results for a search, from the same catalogue index
// as the header search so the two always agree.
const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const query = (searchParams.get('q') || '').trim();
  const navigate = useNavigate();
  const [index, setIndex] = useState(null);
  const [error, setError] = useState(false);
  const [draft, setDraft] = useState(query);

  useEffect(() => setDraft(query), [query]);

  useEffect(() => {
    let alive = true;
    loadSearchIndex()
      .then((idx) => { if (alive) setIndex(idx); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, []);

  const results = useMemo(() => searchCatalogue(index, query), [index, query]);
  const groups = [...results.collections, ...results.categories];
  const hasResults = results.products.length > 0 || groups.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = draft.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[100px] pb-20">
      <SEO
        title={query ? `Search results for “${query}” | GPSFDK` : 'Search | GPSFDK'}
        description="Search the GPSFDK catalogue of premium wall canvas prints and custom house nameplates."
        noindex
      />
      <div className="max-w-[1400px] mx-auto px-[15px]">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-5xl font-heading font-bold text-secondary">
            {query ? 'Search Results' : 'Search'}
          </h1>
          <form role="search" onSubmit={handleSubmit} className="relative max-w-xl mx-auto mt-6">
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Search canvases, collections, nameplates…"
              aria-label="Search"
              className="w-full pl-5 pr-14 py-4 bg-white border border-gray-200 rounded-full text-base focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 shadow-sm"
            />
            <button type="submit" aria-label="Search" className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-accent text-white rounded-full hover:bg-accent-dark transition-colors">
              <HiOutlineSearch className="w-5 h-5" />
            </button>
          </form>
          {query && index && (
            <p className="text-gray-500 mt-4 text-lg" aria-live="polite">
              {results.products.length} {results.products.length === 1 ? 'product' : 'products'} for <span className="font-bold text-secondary">“{query}”</span>
            </p>
          )}
        </div>

        {error && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border border-gray-100 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-secondary mb-2">Search isn't available right now</h2>
            <p className="text-gray-500 mb-8">Please try again in a moment, or browse the collections.</p>
            <Link to="/wall-canvas/all" className="btn-primary">Browse all canvases</Link>
          </div>
        )}

        {!index && !error && query && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }, (_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        )}

        {index && query && hasResults && (
          <>
            {groups.length > 0 && (
              <div className="flex flex-wrap justify-center gap-3 mb-10">
                {groups.map((g) => <Link key={g.path} to={g.path} className={chipClass}>{g.name}</Link>)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {results.products.map((doc) => <ProductCard key={doc.id} product={doc.product} />)}
            </div>
          </>
        )}

        {/* Nothing typed, or nothing matched: suggest where to go instead */}
        {index && (!query || !hasResults) && (
          <div>
            {query && (
              <div className="text-center mb-10">
                <h2 className="text-2xl font-bold text-secondary mb-2">No results for “{query}”</h2>
                <p className="text-gray-500">Check the spelling or try a broader word. Here are some favourites:</p>
              </div>
            )}
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {[...POPULAR_COLLECTIONS, ...SEARCH_CATEGORIES].map((g) => <Link key={g.path} to={g.path} className={chipClass}>{g.name}</Link>)}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts(index).map((doc) => <ProductCard key={doc.id} product={doc.product} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
