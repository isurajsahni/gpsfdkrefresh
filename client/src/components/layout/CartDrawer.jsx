import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineX, HiMinus, HiPlus, HiOutlineTrash } from 'react-icons/hi';
import { useCart } from '../../context/CartContext';
import { useUI } from '../../context/UIContext';

const CartDrawer = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, cartCount } = useCart();
  const { isCartOpen, setIsCartOpen } = useUI();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsCartOpen(false)}
            className="fixed inset-0 bg-black/50 z-[60] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-primary z-[70] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white">
              <h2 className="text-xl font-heading font-bold text-secondary">Your Cart ({cartCount})</h2>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-secondary hover:bg-cream rounded-full transition-colors"
              >
                <HiOutlineX className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {cartItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-heading font-bold text-secondary">Your cart is empty</h3>
                  <p className="text-gray-500 mt-2 mb-6">Looks like you haven't added anything yet.</p>
                  <button onClick={() => setIsCartOpen(false)} className="btn-primary">
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {cartItems.map((item) => (
                    <div key={item.key} className="flex gap-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-50">
                      <Link 
                        to={`/product/${item.slug}`} 
                        onClick={() => setIsCartOpen(false)}
                        className="flex-shrink-0 w-20 h-24 rounded-xl overflow-hidden bg-cream-dark"
                      >
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div>
                            <Link 
                              to={`/product/${item.slug}`}
                              onClick={() => setIsCartOpen(false)}
                              className="font-heading font-semibold text-secondary hover:text-accent truncate block text-sm"
                            >
                              {item.name}
                            </Link>
                            <p className="text-xs text-gray-500 mt-0.5" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {item.variation?.size} {item.variation?.material && `• ${item.variation.material}`}
                            </p>
                          </div>
                          <button onClick={() => removeFromCart(item.key)} className="text-gray-400 hover:text-red-500 p-1">
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-200 rounded-full scale-90 origin-left">
                            <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="px-2 py-1 hover:bg-cream-dark rounded-l-full">
                              <HiMinus className="w-3 h-3" />
                            </button>
                            <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="px-2 py-1 hover:bg-cream-dark rounded-r-full">
                              <HiPlus className="w-3 h-3" />
                            </button>
                          </div>
                          <span className="font-bold text-accent text-sm">₹{(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {cartItems.length > 0 && (
              <div className="bg-white border-t border-gray-100 p-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-500 font-medium">Subtotal</span>
                  <span className="text-xl font-heading font-bold text-secondary">₹{cartTotal.toLocaleString()}</span>
                </div>
                <div className="space-y-3">
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/cart'); }} 
                    className="w-full py-3.5 bg-cream text-secondary font-semibold rounded-xl hover:bg-secondary hover:text-white transition-all text-center block"
                  >
                    View Cart
                  </button>
                  <button 
                    onClick={() => { setIsCartOpen(false); navigate('/checkout'); }} 
                    className="btn-primary w-full text-center block"
                  >
                    Checkout Now
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
