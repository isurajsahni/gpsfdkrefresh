import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India'
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Fetch saved addresses on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const { data } = await API.get('/auth/me');
        const addrs = data.addresses || [];
        setSavedAddresses(addrs);
        if (addrs.length > 0) {
          const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
          setSelectedAddressId(defaultAddr._id);
          setShowNewForm(false);
        } else {
          setShowNewForm(true);
        }
      } catch {
        setShowNewForm(true);
      }
    };
    fetchAddresses();
  }, []);

  const getSelectedAddress = () => {
    if (showNewForm) return address;
    return savedAddresses.find(a => a._id === selectedAddressId) || address;
  };

  const handleSaveNewAddress = async () => {
    // Validate required fields
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all required fields');
      return false;
    }
    try {
      const { data: updatedAddresses } = await API.post('/auth/addresses', address);
      setSavedAddresses(updatedAddresses);
      // Select the newly added address (last one)
      const newAddr = updatedAddresses[updatedAddresses.length - 1];
      setSelectedAddressId(newAddr._id);
      setShowNewForm(false);

      // Update user context with new addresses
      if (user) {
        updateUser({ ...user, addresses: updatedAddresses });
      }
      toast.success('Address saved!');
      return true;
    } catch (err) {
      toast.error('Failed to save address');
      return false;
    }
  };

  const handleDeleteAddress = async (id) => {
    try {
      const { data: updatedAddresses } = await API.delete(`/auth/addresses/${id}`);
      setSavedAddresses(updatedAddresses);
      if (selectedAddressId === id) {
        if (updatedAddresses.length > 0) {
          setSelectedAddressId(updatedAddresses[0]._id);
        } else {
          setSelectedAddressId(null);
          setShowNewForm(true);
        }
      }
      if (user) updateUser({ ...user, addresses: updatedAddresses });
    } catch {
      toast.error('Failed to delete address');
    }
  };

  const handleContinueToPayment = async () => {
    if (showNewForm) {
      const saved = await handleSaveNewAddress();
      if (!saved) return;
    }
    if (!selectedAddressId && !showNewForm) {
      toast.error('Please select an address');
      return;
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    const shippingAddress = getSelectedAddress();
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
        shippingAddress,
        billingAddress: shippingAddress,
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
            prefill: { name: shippingAddress.fullName, email: user?.email, contact: shippingAddress.phone },
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
    <div className="min-h-screen bg-primary pt-[120px] pb-20">
      <div className="max-w-4xl mx-auto section-padding">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-heading font-bold text-secondary mb-8">
          Checkout
        </motion.h1>

        {/* Steps — responsive */}
        <div className="flex items-center gap-2 sm:gap-4 mb-10">
          {['Shipping', 'Payment', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-1 sm:gap-2">
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'}`}>
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs sm:text-sm font-medium ${step === i + 1 ? 'text-secondary' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-6 sm:w-12 h-0.5 bg-gray-200 mx-0.5 sm:mx-1" />}
            </div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 sm:p-8">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div>
              <h2 className="text-xl font-heading font-semibold text-secondary mb-6">Shipping Address</h2>

              {/* Saved addresses */}
              {savedAddresses.length > 0 && !showNewForm && (
                <div className="space-y-3 mb-6">
                  {savedAddresses.map(addr => (
                    <button
                      key={addr._id}
                      onClick={() => setSelectedAddressId(addr._id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all relative ${selectedAddressId === addr._id ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${selectedAddressId === addr._id ? 'border-accent' : 'border-gray-300'}`}>
                            {selectedAddressId === addr._id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                          </div>
                          <div>
                            <p className="font-semibold text-secondary">{addr.fullName}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{addr.phone}</p>
                            <p className="text-sm text-gray-500 mt-0.5">
                              {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                          className="text-gray-400 hover:text-red-500 text-xs font-medium px-2 py-1 rounded transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                      {addr.isDefault && (
                        <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium hidden sm:inline">Default</span>
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setShowNewForm(true);
                      setAddress({ fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' });
                    }}
                    className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-accent hover:text-accent transition-all text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <span className="text-lg">+</span> Add New Address
                  </button>
                </div>
              )}

              {/* New address form */}
              <AnimatePresence>
                {showNewForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    {savedAddresses.length > 0 && (
                      <button
                        onClick={() => {
                          setShowNewForm(false);
                          if (!selectedAddressId && savedAddresses.length > 0) {
                            setSelectedAddressId(savedAddresses[0]._id);
                          }
                        }}
                        className="text-sm text-accent font-medium mb-4 hover:underline"
                      >
                        ← Use saved address instead
                      </button>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: 'Full Name *', key: 'fullName', type: 'text', span: false },
                        { label: 'Phone *', key: 'phone', type: 'tel', span: false },
                        { label: 'Address Line 1 *', key: 'addressLine1', type: 'text', span: true },
                        { label: 'Address Line 2', key: 'addressLine2', type: 'text', span: true },
                        { label: 'City *', key: 'city', type: 'text', span: false },
                        { label: 'State *', key: 'state', type: 'text', span: false },
                        { label: 'Pincode *', key: 'pincode', type: 'text', span: false },
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
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                onClick={handleContinueToPayment}
                className="btn-primary mt-6 w-full sm:w-auto"
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
                    className={`w-full flex items-center gap-4 p-4 sm:p-5 rounded-xl border-2 transition-all text-left ${paymentMethod === method.value ? 'border-accent bg-accent/5' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <span className="text-2xl">{method.icon}</span>
                    <div>
                      <p className="font-semibold text-secondary">{method.label}</p>
                      <p className="text-sm text-gray-500">{method.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 sm:gap-4 mt-6">
                <button onClick={() => setStep(1)} className="btn-outline">← Back</button>
                <button onClick={() => setStep(3)} className="btn-primary">Next →</button>
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
              <div className="flex gap-3 items-center sm:gap-4">
                <button onClick={() => setStep(2)} className="btn-outline">Back</button>
                <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary flex-1 text-base sm:text-lg disabled:opacity-50">
                  {loading ? 'Processing...' : `Place Order`}
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
