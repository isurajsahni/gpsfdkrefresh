import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import API from '../utils/api';

const CartContext = createContext();

const PRICE_REFRESH_GAP_MS = 60 * 1000;

// The catalogue variation a cart line was added as: by id, else by the same
// attributes (the server prices orders the same way).
const matchVariation = (product, variation = {}) => {
  const norm = (s) => String(s || '').toLowerCase().replace(/\s+/g, '');
  const variations = product.variations || [];
  return (
    variations.find((v) => variation._id && v._id === variation._id) ||
    variations.find((v) =>
      norm(v.size) === norm(variation.size) &&
      ['material', 'frame', 'color'].every((k) => !variation[k] || norm(v[k]) === norm(variation[k]))
    )
  );
};

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, variation, quantity = 1, customText = '', uploadedImageUrl = '') => {
    // Meta Pixel: AddToCart event
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'AddToCart', {
        content_name: product.name,
        content_ids: [product._id],
        content_type: 'product',
        contents: [{ id: product._id, quantity, item_price: variation.price }],
        value: variation.price * quantity,
        currency: 'INR',
      });
    }
    setCartItems(prev => {
      const key = `${product._id}-${variation.size || ''}-${variation.material || ''}-${variation.color || ''}-${variation.frame || ''}-${customText}-${uploadedImageUrl}`;
      const existing = prev.find(item => item.key === key);
      if (existing) {
        return prev.map(item =>
          item.key === key ? { ...item, quantity: item.quantity + quantity } : item
        );
      }
      return [...prev, {
        key,
        productId: product._id,
        name: product.name,
        slug: product.slug,
        image: uploadedImageUrl || product.images?.[0]?.url || '',
        variation,
        customText,
        uploadedImageUrl,
        price: variation.price,
        quantity,
      }];
    });
  };

  // Prices are saved when an item is added, but orders are charged at today's
  // price. Refresh them from the catalogue so the cart and checkout show what
  // will actually be charged. Custom uploads are priced by the customiser and
  // have no catalogue product, so they're left alone.
  const lastRefreshAt = useRef(0);
  const refreshPrices = useCallback(async () => {
    if (Date.now() - lastRefreshAt.current < PRICE_REFRESH_GAP_MS) return;
    lastRefreshAt.current = Date.now();

    const lines = cartItems.filter((item) => item.slug && !item.uploadedImageUrl);
    const slugs = [...new Set(lines.map((item) => item.slug))];
    if (!slugs.length) return;
    const results = await Promise.allSettled(slugs.map((slug) => API.get(`/products/${slug}`, { silent: true })));
    const productBySlug = new Map();
    results.forEach((r, i) => { if (r.status === 'fulfilled') productBySlug.set(slugs[i], r.value.data); });

    // Line key → current variation, for lines whose price has moved
    const updates = new Map();
    for (const item of lines) {
      const product = productBySlug.get(item.slug);
      const current = product && matchVariation(product, item.variation);
      if (current && current.price !== item.price) updates.set(item.key, current);
    }
    if (!updates.size) return;

    setCartItems((prev) => prev.map((item) => {
      const current = updates.get(item.key);
      return current ? { ...item, price: current.price, variation: { ...item.variation, ...current } } : item;
    }));
    toast(`Prices were updated for ${updates.size} item${updates.size > 1 ? 's' : ''} in your cart.`, { icon: 'ℹ️' });
  }, [cartItems]);

  // Once per page load; checkout refreshes again before payment
  useEffect(() => {
    refreshPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, []);

  const removeFromCart = (key) => {
    setCartItems(prev => prev.filter(item => item.key !== key));
  };

  const updateQuantity = (key, quantity) => {
    if (quantity < 1) return removeFromCart(key);
    setCartItems(prev =>
      prev.map(item => item.key === key ? { ...item, quantity } : item)
    );
  };

  const clearCart = () => setCartItems([]);

  const cartTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, refreshPrices, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
