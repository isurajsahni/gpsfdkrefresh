import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { validators, formatters, lookupPincode, INDIAN_STATES, validateAddress } from '../utils/validation';
import WhatsAppOtpModal from '../components/checkout/WhatsAppOtpModal';

const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);

  // WhatsApp OTP state
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verifiedToken, setVerifiedToken] = useState(null);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState('');

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showNewForm, setShowNewForm] = useState(false);
  const [isEditing, setIsEditing] = useState(null); // stores address ID being edited
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
      setPincodeLoading(true);
      try {
        const data = await lookupPincode(formattedValue);
        if (data) {
          setAddress(prev => ({ 
            ...prev, 
            city: data.city, 
            state: data.state 
          }));
          setAddressErrors(prev => ({ ...prev, city: '', state: '' }));
          toast.success(`Location found: ${data.city}, ${data.state}`, { icon: '📍' });
        } else {
          toast.error('Pincode details not found. Please enter city/state manually.');
        }
      } catch (err) {
        toast.error('Could not auto-fetch city/state. Please enter manually.');
      }
      setPincodeLoading(false);
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

    // Prepend +91 to phone before saving to DB
    const payloadAddress = {
      ...address,
      phone: address.phone.replace(/\D/g, '').length === 10
        ? `+91${address.phone.replace(/\D/g, '')}`
        : address.phone,
    };

    setLoading(true);
    try {
      let updatedAddresses;
      if (isEditing) {
        const { data } = await API.put(`/auth/addresses/${isEditing}`, payloadAddress);
        updatedAddresses = data;
      } else {
        const { data } = await API.post('/auth/addresses', payloadAddress);
        updatedAddresses = data;
      }
      
      setSavedAddresses(updatedAddresses);
      const newAddr = isEditing ? updatedAddresses.find(a => a._id === isEditing) : updatedAddresses[updatedAddresses.length - 1];
      setSelectedAddressId(newAddr?._id || updatedAddresses[0]?._id);
      setShowNewForm(false);
      setIsEditing(null);

      if (user) {
        updateUser({ ...user, addresses: updatedAddresses });
      }
      toast.success(isEditing ? 'Address updated!' : 'Address saved!');
      setLoading(false);
      return true;
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save address');
      setLoading(false);
      return false;
    }
  };

  const handleDeleteAddress = async (id) => {
    if (!window.confirm('Are you sure you want to delete this address?')) return;
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
      toast.success('Address deleted successfully');
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

  // Called by WhatsApp OTP modal after successful verification
  const handleOtpVerified = (token) => {
    setVerifiedToken(token);
    setPhoneVerified(true);
    setShowOtpModal(false);
    // Automatically proceed to place the order
    handlePlaceOrder(token);
  };

  // Gate: open OTP modal if not yet verified, else place order directly
  const handlePlaceOrderClick = () => {
    if (!phoneVerified) {
      setShowOtpModal(true);
    } else {
      handlePlaceOrder(verifiedToken);
    }
  };

  const handlePlaceOrder = async (token) => {
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
        phoneVerifiedToken: token || verifiedToken,
      };

      const { data: order } = await API.post('/orders', orderData);
      
      // Cleanup abandoned cart safely
      API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});

      if (paymentMethod === 'cod') {
        clearCart();
        toast.success('Order placed successfully!');
        navigate('/thank-you');
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
              API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});
              clearCart();
              toast.success('Payment successful!');
              navigate('/thank-you');
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
      // Reset verification on order failure so user can retry
      setPhoneVerified(false);
      setVerifiedToken(null);
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
                        <div className="flex flex-col items-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(addr._id); }}
                            className="text-gray-400 hover:text-red-500 text-xs font-medium px-2 py-1 rounded transition-colors"
                          >
                            Remove
                          </button>
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setIsEditing(addr._id);
                              // Strip +91 prefix from phone for display in the input
                              const editPhone = (addr.phone || '').replace(/^\+91/, '');
                              setAddress({ ...addr, phone: editPhone });
                              setShowNewForm(true);
                              setAddressErrors({});
                            }}
                            className="text-accent hover:underline text-xs font-semibold px-2 py-1 rounded transition-colors"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                      {addr.isDefault && (
                        <span className="absolute top-2 right-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium hidden sm:inline">Default</span>
                      )}
                    </button>
                  ))}

                  <button
                    onClick={() => {
                      setIsEditing(null);
                      setShowNewForm(true);
                      setAddress({ fullName: user?.name || '', phone: user?.phone || '', addressLine1: '', addressLine2: '', city: '', state: '', pincode: '', country: 'India' });
                      setAddressErrors({});
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
                          setIsEditing(null);
                          if (!selectedAddressId && savedAddresses.length > 0) {
                            setSelectedAddressId(savedAddresses[0]._id);
                          }
                        }}
                        className="text-sm text-accent font-medium mb-4 hover:underline"
                      >
                        ← {isEditing ? 'Cancel editing' : 'Use saved address instead'}
                      </button>
                    )}
                    <h3 className="text-lg font-heading font-bold text-secondary mb-4">
                      {isEditing ? 'Edit Address' : 'New Shipping Address'}
                    </h3>
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
                        <div className={`flex items-center bg-primary border ${addressErrors.phone ? 'border-red-500' : 'border-gray-200'} rounded-xl focus-within:border-accent overflow-hidden`}>
                          <span className="px-3 py-3 bg-gray-100 text-secondary font-semibold text-sm border-r border-gray-200 select-none">+91</span>
                          <input
                            type="tel"
                            value={address.phone}
                            onChange={(e) => handleAddressChange('phone', e.target.value)}
                            onBlur={() => handleAddressBlur('phone')}
                            className="flex-1 px-3 py-3 bg-transparent focus:outline-none"
                            placeholder="9876543210"
                            maxLength={10}
                          />
                        </div>
                        {addressErrors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{addressErrors.phone}</p>}
                      </div>

                      {/* Pincode */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">Pincode *</label>
                        <div className="relative">
                          <input
                            type="text"
                            value={address.pincode}
                            onChange={(e) => handleAddressChange('pincode', e.target.value)}
                            onBlur={() => handleAddressBlur('pincode')}
                            className={`w-full px-4 py-3 bg-primary border ${addressErrors.pincode ? 'border-red-500' : 'border-gray-200'} rounded-xl focus:outline-none focus:border-accent`}
                            placeholder="6-digit PIN"
                          />
                          {pincodeLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <svg className="animate-spin h-4 w-4 text-accent" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </div>
                          )}
                        </div>
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
                <button
                  onClick={handlePlaceOrderClick}
                  disabled={loading}
                  className="btn-primary flex-1 text-base sm:text-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Processing...
                    </>
                  ) : phoneVerified ? (
                    <><span>✓</span> Place Order</>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                      Verify & Place Order
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* WhatsApp OTP Verification Modal */}
      <WhatsAppOtpModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
        phone={getSelectedAddress()?.phone || user?.phone || ''}
      />
    </div>
  );
};

export default CheckoutPage;
