import { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

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
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
};
