import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { validators, formatters, lookupPincode, INDIAN_STATES, validateAddress } from '../utils/validation';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [address, setAddress] = useState({
    fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India'
  });
  const [addressErrors, setAddressErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cod');

  const handleAddressBlur = (field) => {
    if (!validators[field]) return;
    const error = validators[field](address[field]);
    setAddressErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleAddressChange = async (field, value) => {
    let formattedValue = value;
    if (formatters[field]) formattedValue = formatters[field](value);

    const newAddress = { ...address, [field]: formattedValue };
    setAddress(newAddress);
    
    // Clear error
    if (addressErrors[field]) setAddressErrors(prev => ({ ...prev, [field]: '' }));

    // Pincode lookup logic
    if (field === 'pincode' && formattedValue.length === 6) {
      setLoading(true);
      const data = await lookupPincode(formattedValue);
      if (data) {
        setAddress(prev => ({ 
          ...prev, 
          city: data.city, 
          state: data.state 
        }));
        setAddressErrors(prev => ({ ...prev, city: '', state: '' }));
        toast.success(`Location found: ${data.city}, ${data.state}`, { icon: '📍' });
      }
      setLoading(false);
    }
  };

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

  // Abandoned Cart Tracker (Debounced)
  useEffect(() => {
    if (!user?.email || cartItems.length === 0) return;
    
    // Extract best available contact info combining user profile and current address form
    const contactPhone = getSelectedAddress()?.phone || address?.phone || user.phone;
    const contactName = getSelectedAddress()?.fullName || address?.fullName || user.name;

    const timer = setTimeout(() => {
      API.post('/abandoned-carts', {
        email: user.email,
        phone: contactPhone,
        name: contactName,
        cartItems: cartItems.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          variation: item.variation,
          customText: item.customText
        })),
        cartTotal
      }).catch(err => console.log('Abandoned cart updated silently')); // Silent fail
    }, 2000);

    return () => clearTimeout(timer);
  }, [cartItems, cartTotal, address, selectedAddressId, user]);

  const getSelectedAddress = () => {
    if (showNewForm) return address;
    return savedAddresses.find(a => a._id === selectedAddressId) || address;
  };

  const handleSaveNewAddress = async () => {
    // Validate all fields
    const errors = validateAddress(address);
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      toast.error('Please fix the errors in the address form');
      return false;
    }

    setLoading(true);
    try {
      const { data: updatedAddresses } = await API.post('/auth/addresses', address);
      setSavedAddresses(updatedAddresses);
      const newAddr = updatedAddresses[updatedAddresses.length - 1];
      setSelectedAddressId(newAddr._id);
      setShowNewForm(false);

      if (user) {
        updateUser({ ...user, addresses: updatedAddresses });
      }
      toast.success('Address saved!');
      setLoading(false);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
      setLoading(false);
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
    
    // Final check for selected address
    const currentAddress = getSelectedAddress();
    const finalErrors = validateAddress(currentAddress);
    if (Object.keys(finalErrors).length > 0) {
      toast.error('The selected address is incomplete or invalid. Please edit it.');
      setShowNewForm(true);
      setAddressErrors(finalErrors);
      return;
    }

    setStep(2);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setCouponError('');
    try {
      const { data } = await API.post('/coupons/validate', { code: couponCode, orderTotal: cartTotal });
      setAppliedCoupon(data);
      setCouponCode('');
      toast.success('Coupon applied!');
    } catch (err) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
      setAppliedCoupon(null);
    }
    setLoading(false);
  };

  const discountedTotal = appliedCoupon ? cartTotal - appliedCoupon.calculatedDiscount : cartTotal;
  const shippingFee = discountedTotal < 499 ? 50 : 0;
  const finalTotal = discountedTotal + shippingFee;

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
        shippingPrice: shippingFee,
        taxPrice: 0,
        discountPrice: appliedCoupon ? appliedCoupon.calculatedDiscount : 0,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        totalPrice: finalTotal,
      };

      const { data: order } = await API.post('/orders', orderData);
      
      // Cleanup abandoned cart safely
      API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});

      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/dashboard');
      } else if (paymentMethod === 'razorpay') {
        try {
          const { data: razorpayOrder } = await API.post('/payments/razorpay', { amount: finalTotal });
          const options = {
            key: import.meta.env.VITE_RAZORPAY_KEY_ID,
            amount: razorpayOrder.amount,
            currency: 'INR',
            name: 'GPSFDK',
            description: 'Order Payment',
            order_id: razorpayOrder.id,
            handler: async (response) => {
              await API.post('/payments/razorpay/verify', { ...response, orderId: order._id });
              
              // Also recover cart here after payment verification
              API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});
              
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
                      {/* Full Name */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-secondary mb-1">Full Name *</label>
                        <input
                          type="text"
                          value={address.fullName}
                          onChange={(e) => handleAddressChange('fullName', e.target.value)}
                          onBlur={() => handleAddressBlur('fullName')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.fullName ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                          placeholder="Your complete name"
                        />
                        {addressErrors.fullName && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.fullName}</p>}
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">Phone *</label>
                        <input
                          type="tel"
                          value={address.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                          onBlur={() => handleAddressBlur('phone')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                          placeholder="10-digit mobile number"
                        />
                        {addressErrors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.phone}</p>}
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">Pincode *</label>
                        <input
                          type="text"
                          value={address.pincode}
                          onChange={(e) => handleAddressChange('pincode', e.target.value)}
                          onBlur={() => handleAddressBlur('pincode')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.pincode ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                          placeholder="6-digit PIN"
                        />
                        {addressErrors.pincode && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.pincode}</p>}
                      </div>

                      {/* Address Line 1 */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-secondary mb-1">Building/Street/Area *</label>
                        <input
                          type="text"
                          value={address.addressLine1}
                          onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                          onBlur={() => handleAddressBlur('addressLine1')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.addressLine1 ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                          placeholder="Flat no, House name, Street"
                        />
                        {addressErrors.addressLine1 && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.addressLine1}</p>}
                      </div>

                      {/* Address Line 2 */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-secondary mb-1">Landmark (Optional)</label>
                        <input
                          type="text"
                          value={address.addressLine2}
                          onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                          className="w-full px-4 py-3 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent"
                          placeholder="E.g. Near Metro Station"
                        />
                      </div>

                      {/* City */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">City *</label>
                        <input
                          type="text"
                          value={address.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          onBlur={() => handleAddressBlur('city')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.city ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                        />
                        {addressErrors.city && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.city}</p>}
                      </div>

                      {/* State */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">State *</label>
                        <select
                          value={address.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          onBlur={() => handleAddressBlur('state')}
                          className={`w-full px-4 py-3 bg-primary border ${addressErrors.state ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent appearance-none`}
                        >
                          <option value="">Select State</option>
                          {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        {addressErrors.state && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.state}</p>}
                      </div>
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
              
              {/* Shipping Banner */}
              {shippingFee > 0 ? (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start sm:items-center gap-3">
                    <span className="text-xl">🚚</span>
                    <span className="leading-relaxed">You're only <strong className="text-amber-900 border-b border-amber-300">₹{499 - discountedTotal}</strong> away from <strong>Free Shipping!</strong></span>
                  </div>
                  <Link to="/" className="bg-amber-100 whitespace-nowrap font-bold hover:bg-amber-200 text-amber-900 px-4 py-2 rounded-lg text-center transition-colors">
                    Add Items
                  </Link>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 mb-6 text-sm flex items-center gap-3 shadow-sm">
                  <span className="text-xl">✨</span>
                  <span className="leading-relaxed"><strong>Congratulations!</strong> Your order qualifies for <strong>Free Shipping</strong>.</span>
                </div>
              )}

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

              {/* Coupon Section */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-secondary mb-2">Have a coupon code?</label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-accent uppercase text-sm"
                    disabled={appliedCoupon}
                  />
                  {!appliedCoupon ? (
                    <button onClick={handleApplyCoupon} disabled={!couponCode || loading} className="btn-secondary w-full sm:w-auto whitespace-nowrap px-6 py-3">Apply</button>
                  ) : (
                    <button onClick={() => setAppliedCoupon(null)} className="btn-outline w-full sm:w-auto whitespace-nowrap text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 py-3">Remove</button>
                  )}
                </div>
                {couponError && <p className="text-red-500 text-sm mt-1">{couponError}</p>}
                {appliedCoupon && <p className="text-green-600 text-sm mt-1 font-medium">Coupon '{appliedCoupon.code}' applied! (-₹{Math.round(appliedCoupon.calculatedDiscount).toLocaleString()})</p>}
              </div>

              <div className="bg-cream-dark rounded-xl p-5 mb-6">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>₹{cartTotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Shipping</span>
                  {shippingFee > 0 ? (
                    <span className="text-secondary font-medium">+₹{shippingFee}</span>
                  ) : (
                    <span className="text-green-600 font-bold">FREE</span>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm mt-1 text-green-600 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-₹{Math.round(appliedCoupon.calculatedDiscount).toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200"><span>Total</span><span className="text-accent">₹{Math.round(finalTotal).toLocaleString()}</span></div>
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
