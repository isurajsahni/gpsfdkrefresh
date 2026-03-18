import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        items: cartItems.map(item => ({
          product: item.productId,
          name: item.name,
          image: item.image,
          variation: item.variation,
          customText: item.customText,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress: address,
        billingAddress: address,
        paymentMethod,
        itemsPrice: cartTotal,
        shippingPrice: 0,
        taxPrice: 0,
        totalPrice: cartTotal,
      };

      const { data: order } = await API.post('/orders', orderData);

      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/dashboard');
      } else if (paymentMethod === 'razorpay') {
        try {
          const { data: razorpayOrder } = await API.post('/payments/razorpay', { amount: cartTotal });
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: 'INR',
            name: 'GPSFDK',
            description: 'Order Payment',
            order_id: razorpayOrder.id,
            handler: async (response) => {
              await API.post('/payments/razorpay/verify', { ...response, orderId: order._id });
              clearCart();
              toast.success('Payment successful!');
              navigate('/dashboard');
            },
            prefill: { name: address.fullName, email: user?.email, contact: address.phone },
            theme: { color: '#0B5D3B' }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
        } catch {
          toast.error('Payment initialization failed');
        }
      } else if (paymentMethod === 'stripe') {
        try {
          const { data } = await API.post('/payments/stripe', {
            items: cartItems.map(item => ({ name: item.name, price: item.price, quantity: item.quantity })),
            orderId: order._id,
          });
          window.location.href = data.url;
        } catch {
          toast.error('Payment initialization failed');
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    }
    setLoading(false);
  };

  if (cartItems.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-primary pt-24 pb-20">
      <div className="max-w-4xl mx-auto section-padding">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-heading font-bold text-secondary mb-8">
          Checkout
        </motion.h1>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-10">
          {['Shipping', 'Payment', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-sm font-medium ${step === i + 1 ? 'text-secondary' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-12 h-0.5 bg-gray-200 mx-1" />}
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-heading font-semibold text-secondary mb-6">Shipping Address</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Full Name', key: 'fullName', type: 'text', span: false },
                  { label: 'Phone', key: 'phone', type: 'tel', span: false },
                  { label: 'Address Line 1', key: 'addressLine1', type: 'text', span: true },
                  { label: 'Address Line 2', key: 'addressLine2', type: 'text', span: true },
                  { label: 'City', key: 'city', type: 'text', span: false },
                  { label: 'State', key: 'state', type: 'text', span: false },
                  { label: 'Pincode', key: 'pincode', type: 'text', span: false },
                  { label: 'Country', key: 'country', type: 'text', span: false },
                ].map(field => (
                  <div key={field.key} className={field.span ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-semibold text-secondary mb-1">{field.label}</label>
                    <input
                      type={field.type}
                      value={address[field.key]}
                      onChange={(e) => setAddress({ ...address, [field.key]: e.target.value })}
                      className="w-full px-4 py-3 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep(2)}
                className="btn-primary mt-6"
              >
                Continue to Payment →
              </button>
            </div>
          )}

          {/* Step 2: Payment */}
          {step === 2 && (
            <div>
              <h2 className="text-xl font-heading font-semibold text-secondary mb-6">Payment Method</h2>
              <div className="space-y-3">
                {[
                  { value: 'cod', label: 'Cash on Delivery', icon: '💵', desc: 'Pay when you receive' },
                  { value: 'razorpay', label: 'Razorpay', icon: '💳', desc: 'UPI, Cards, Net Banking' },
                  { value: 'stripe', label: 'Stripe', icon: '🌐', desc: 'International Cards' },
                ].map(method => (
                  <button
                    key={method.value}
                    onClick={() => setPaymentMethod(method.value)}
                    className={`w-full flex items-center gap-4 p-5 rounded-xl border-2 transition-all text-left ${paymentMethod === method.value ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-semibold text-secondary">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Review Order →</button>
              </div>
            </div>
          )}

          {/* Step 3: Confirm */}
          {step === 3 && (
            <div>
              <h2 className="text-xl font-heading font-semibold text-secondary mb-6">Review Your Order</h2>
              <div className="space-y-3 mb-6">
                {cartItems.map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.variation?.size} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-accent">₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="bg-cream-dark rounded-xl p-5 mb-6">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm mt-1"><span>Shipping</span><span className="text-green-600">FREE</span></div>
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200"><span>Total</span><span className="text-accent">₹{cartTotal.toLocaleString()}</span></div>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(2)} className="btn-outline">← Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 text-lg disabled:opacity-50">
                  {loading ? 'Processing...' : `Place Order — ₹${cartTotal.toLocaleString()}`}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CheckoutPage;
