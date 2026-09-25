import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineX, HiOutlineCollection, HiOutlineViewGrid } from 'react-icons/hi';
import { useUI } from '../../context/UIContext';
import { useCurrency } from '../../context/CurrencyContext';
import { optimizeImage, handleImageError } from '../../utils/imageOptimizer';
import {
  loadSearchIndex, searchCatalogue, popularProducts, POPULAR_COLLECTIONS, SEARCH_CATEGORIES,
} from '../../utils/searchIndex';

const DEBOUNCE_MS = 250;
const MAX_PRODUCTS = 6;

// Flatten the result groups into one keyboard-navigable list
const toEntries = ({ products, collections, categories }) => [
  ...products.map((p) => ({ kind: 'product', key: `p-${p.id}`, path: `/product/${p.slug}`, item: p })),
  ...collections.map((c) => ({ kind: 'collection', key: `c-${c.path}`, path: c.path, item: c })),
  ...categories.map((c) => ({ kind: 'category', key: `g-${c.path}`, path: c.path, item: c })),
];

const SearchOverlay = () => {
  const { isSearchOpen, setIsSearchOpen } = useUI();
  const { formatPrice } = useCurrency();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [index, setIndex] = useState(null);
  const [indexError, setIndexError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const returnFocusRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const close = () => setIsSearchOpen(false);

  // Open: lock page scroll, focus the input, load the catalogue once.
  // Close: reset, and hand focus back to whatever opened the search.
  useEffect(() => {
    if (!isSearchOpen) return undefined;
    returnFocusRef.current = document.activeElement;
    document.body.style.overflow = 'hidden';
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 50);

    let alive = true;
    setIndexError(false);
    loadSearchIndex()
      .then((idx) => { if (alive) setIndex(idx); })
      .catch(() => { if (alive) setIndexError(true); });

    return () => {
      alive = false;
      clearTimeout(focusTimer);
      document.body.style.overflow = '';
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(-1);
      returnFocusRef.current?.focus?.();
    };
  }, [isSearchOpen]);

  // Close search when navigating away
  useEffect(() => {
    setIsSearchOpen(false);
  }, [location.pathname, setIsSearchOpen]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const results = useMemo(() => {
    const found = searchCatalogue(index, debouncedQuery);
    return { ...found, products: found.products.slice(0, MAX_PRODUCTS) };
  }, [index, debouncedQuery]);

  const hasQuery = debouncedQuery.length >= 2;
  const noMatches = hasQuery && index && toEntries(results).length === 0;
  // Nothing typed yet, or nothing matched: suggest popular picks instead of a blank panel
  const shown = hasQuery && !noMatches
    ? results
    : { products: popularProducts(index), collections: POPULAR_COLLECTIONS, categories: SEARCH_CATEGORIES };
  const entries = toEntries(shown);

  useEffect(() => setActiveIndex(-1), [debouncedQuery]);

  const active = entries[activeIndex];
  const previewProduct = active?.kind === 'product' ? active.item : shown.products[0];

  const goTo = (path) => {
    close();
    navigate(path);
  };

  const submitSearch = () => {
    const q = query.trim();
    if (!q) return;
    close();
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'ArrowDown' && entries.length) {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % entries.length);
    } else if (e.key === 'ArrowUp' && entries.length) {
      e.preventDefault();
      setActiveIndex((i) => (i <= 0 ? entries.length - 1 : i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // An item picked with the arrow keys opens directly; otherwise Enter
      // shows the full results page
      if (active) goTo(active.path);
      else submitSearch();
    }
  };

  const optionProps = (entry) => {
    const i = entries.indexOf(entry);
    return {
      id: `search-option-${i}`,
      role: 'option',
      'aria-selected': i === activeIndex,
      onMouseEnter: () => setActiveIndex(i),
      onClick: () => goTo(entry.path),
      className: `flex items-center gap-4 px-4 sm:px-6 py-2.5 cursor-pointer transition-colors ${i === activeIndex ? 'bg-gray-800' : 'hover:bg-gray-800/50'}`,
    };
  };

  const productEntries = entries.filter((e) => e.kind === 'product');
  const groupEntries = entries.filter((e) => e.kind !== 'product');

  const sectionTitle = (text) => (
    <h3 className="px-4 sm:px-6 pt-4 pb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">{text}</h3>
  );

  return (
    <AnimatePresence>
      {isSearchOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex justify-center pt-8 sm:pt-16 px-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) close();
          }}
          onKeyDown={(e) => { if (e.key === 'Escape') close(); }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search products"
            className="w-full max-w-4xl bg-[#202124] rounded-2xl shadow-2xl border border-gray-700 overflow-hidden flex flex-col max-h-[85vh] sm:max-h-[70vh]"
          >
            {/* Header / Input */}
            <form
              role="search"
              onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
              className="flex items-center px-4 sm:px-6 py-4 border-b border-gray-700 bg-[#202124]"
            >
              <HiOutlineSearch className="w-6 h-6 text-gray-400 mr-3 shrink-0" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search canvases, collections, nameplates…"
                aria-label="Search"
                role="combobox"
                aria-expanded="true"
                aria-controls="search-results"
                aria-autocomplete="list"
                aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
                autoComplete="off"
                enterKeyHint="search"
                className="flex-1 min-w-0 bg-transparent text-white text-lg placeholder-gray-500 focus:outline-none [&::-webkit-search-cancel-button]:hidden"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => { setQuery(''); inputRef.current?.focus(); }}
                  aria-label="Clear search"
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <HiOutlineX className="w-5 h-5" />
                </button>
              )}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                className="ml-1 p-2 text-gray-400 hover:text-white transition-colors"
              >
                <span className="hidden sm:inline text-xs font-semibold border border-gray-600 rounded px-1.5 py-0.5">Esc</span>
                <HiOutlineX className="w-6 h-6 sm:hidden" />
              </button>
            </form>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
              <div
                id="search-results"
                role="listbox"
                aria-label="Search suggestions"
                className="w-full md:w-1/2 flex flex-col md:border-r border-gray-700 overflow-y-auto bg-[#202124] custom-scrollbar pb-3"
              >
                {!index && !indexError && (
                  <div className="p-6 space-y-4" aria-live="polite">
                    <span className="sr-only">Loading products…</span>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-12 h-14 rounded-lg bg-gray-700/60" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3.5 w-2/3 rounded bg-gray-700/60" />
                          <div className="h-3 w-1/3 rounded bg-gray-700/40" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {indexError && (
                  <div className="p-8 text-center text-gray-400">
                    <p>Suggestions aren't available right now.</p>
                    <p className="text-sm mt-1">Press Enter to search the full catalogue.</p>
                  </div>
                )}

                {index && (
                  <>
                    {noMatches && (
                      <div className="px-6 pt-6 pb-2 text-gray-300" aria-live="polite">
                        No results for “<span className="text-white font-semibold">{debouncedQuery}</span>”. Try a different word, or browse these:
                      </div>
                    )}

                    {productEntries.length > 0 && (
                      <>
                        {sectionTitle(hasQuery && !noMatches ? 'Products' : 'Popular products')}
                        {productEntries.map((entry) => (
                          <div key={entry.key} {...optionProps(entry)}>
                            <div className="w-12 h-14 rounded-lg overflow-hidden bg-gray-800 shrink-0">
                              {entry.item.image && (
                                <img
                                  src={optimizeImage(entry.item.image, 120)}
                                  alt=""
                                  onError={handleImageError}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                  decoding="async"
                                />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-gray-100 font-medium truncate">{entry.item.name}</p>
                              <p className="text-gray-400 text-xs truncate">
                                {entry.item.collection || entry.item.category}
                                {entry.item.price > 0 && <> · Starting from {formatPrice(entry.item.price)}</>}
                              </p>
                            </div>
                          </div>
                        ))}
                      </>
                    )}

                    {groupEntries.length > 0 && (
                      <>
                        {sectionTitle(hasQuery && !noMatches ? 'Collections & categories' : 'Browse')}
                        {groupEntries.map((entry) => {
                          const Icon = entry.kind === 'collection' ? HiOutlineCollection : HiOutlineViewGrid;
                          return (
                            <div key={entry.key} {...optionProps(entry)}>
                              <div className="w-12 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-gray-100 font-medium truncate">{entry.item.name}</p>
                                <p className="text-gray-400 text-xs">{entry.kind === 'collection' ? 'Collection' : 'Category'}</p>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}

                    {hasQuery && !noMatches && (
                      <button
                        type="button"
                        onClick={submitSearch}
                        className="mx-4 sm:mx-6 mt-3 text-left text-sm font-semibold text-accent hover:underline"
                      >
                        See all results for “{debouncedQuery}” →
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Right side: preview of the highlighted (or top) product */}
              <div className="hidden md:flex w-1/2 bg-[#171717] p-8 flex-col items-center justify-center relative overflow-y-auto">
                {previewProduct ? (
                  <div key={previewProduct.id} className="w-full max-w-sm flex flex-col items-center text-center">
                    <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden shadow-lg border border-gray-700/50 mb-6 bg-gray-800/50">
                      <img
                        src={optimizeImage(previewProduct.image, 600)}
                        alt={previewProduct.name}
                        onError={handleImageError}
                        className="w-full h-full object-cover"
                        decoding="async"
                      />
                    </div>
                    <span className="text-xs font-bold text-accent uppercase tracking-wider mb-2">{previewProduct.collection || previewProduct.category}</span>
                    <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{previewProduct.name}</h2>
                    {previewProduct.price > 0 && (
                      <p className="text-gray-300 font-semibold text-lg mb-6">Starting from {formatPrice(previewProduct.price)}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => goTo(`/product/${previewProduct.slug}`)}
                      className="w-full py-3.5 px-6 bg-accent text-white font-bold rounded-xl hover:bg-white hover:text-accent transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-500 space-y-4 h-full">
                    <div className="w-24 h-24 bg-gray-800/30 rounded-full flex items-center justify-center border border-gray-700/30">
                      <HiOutlineSearch className="w-10 h-10 opacity-40" aria-hidden="true" />
                    </div>
                    <p className="text-sm font-medium">Start typing to search</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
