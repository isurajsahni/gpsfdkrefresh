import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineTrash, HiMinus, HiPlus } from 'react-icons/hi';
import { useCart } from '../context/CartContext';

const CartPage = () => {
  const { cartItems, removeFromCart, updateQuantity, cartTotal, clearCart } = useCart();

  const shippingFee = cartTotal > 0 && cartTotal < 499 ? 50 : 0;
  const finalTotal = cartTotal + shippingFee;

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-primary pt-24 flex flex-col items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="text-8xl mb-6">🛒</div>
          <h2 className="text-3xl font-heading font-bold text-secondary">Your cart is empty</h2>
          <p className="text-gray-500 mt-3">Explore our collection and find something you love</p>
          <Link to="/" className="btn-primary mt-8 inline-block">Continue Shopping</Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-20">
      <div className="max-w-7xl mx-auto section-padding">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-10">
          Shopping Cart
        </motion.h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item, i) => (
              <motion.div
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-5 flex gap-5 shadow-sm"
              >
                <Link to={`/product/${item.slug}`} className="flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-cream-dark">
                  <img src={item.image || 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=300'} alt={item.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <Link to={`/product/${item.slug}`} className="font-heading font-semibold text-secondary hover:text-accent transition-colors text-lg">
                        {item.name}
                      </Link>
                      <div className="text-sm text-gray-500 mt-1 space-x-2">
                        {item.variation?.material && <span>{item.variation.material}</span>}
                        {item.variation?.frame && <span>• {item.variation.frame}</span>}
                        {item.variation?.color && <span>• {item.variation.color}</span>}
                        {item.variation?.size && <span>• {item.variation.size}</span>}
                      </div>
                      {item.customText && <p className="text-sm text-accent mt-1">Custom: "{item.customText}"</p>}
                    </div>
                    <button onClick={() => removeFromCart(item.key)} className="text-gray-400 hover:text-red-500 p-1 transition-colors">
                      <HiOutlineTrash className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-gray-200 rounded-full">
                      <button onClick={() => updateQuantity(item.key, item.quantity - 1)} className="px-3 py-1.5 hover:bg-cream-dark rounded-l-full transition-colors">
                        <HiMinus className="w-4 h-4" />
                      </button>
                      <span className="px-4 text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.key, item.quantity + 1)} className="px-3 py-1.5 hover:bg-cream-dark rounded-r-full transition-colors">
                        <HiPlus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="font-bold text-accent text-lg">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-1">
            <div className="glass-card p-8 sticky top-28">
              <h3 className="text-xl font-heading font-bold text-secondary mb-6">Order Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-semibold">₹{cartTotal.toLocaleString()}</span></div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Shipping</span>
                  {shippingFee > 0 ? (
                    <span className="font-semibold text-secondary">+₹{shippingFee}</span>
                  ) : (
                    <span className="text-green-600 font-semibold">FREE</span>
                  )}
                </div>
                <div className="border-t pt-3 mt-3 flex justify-between text-lg">
                  <span className="font-heading font-bold text-secondary">Total</span>
                  <span className="font-bold text-accent">₹{finalTotal.toLocaleString()}</span>
                </div>
              </div>
              <Link to="/checkout" className="btn-primary w-full text-center block mt-6 text-lg">
                Proceed to Checkout
              </Link>
              <Link to="/" className="block text-center mt-4 text-sm text-gray-500 hover:text-secondary transition-colors">
                ← Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
