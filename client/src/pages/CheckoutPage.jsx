import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { validators, formatters, lookupPincode, INDIAN_STATES, validateAddress } from '../utils/validation';
import SmartPhoneInput from '../components/common/SmartPhoneInput';
import { useCurrency } from '../context/CurrencyContext';
import { optimizeImage } from '../utils/imageOptimizer';
import { calculateShipping } from '../utils/shipping';
import CheckoutOtpModal from '../components/checkout/CheckoutOtpModal';
import { newEventId, getFbCookies } from '../utils/metaPixel';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};


const CheckoutPage = () => {
  const { cartItems, cartTotal, clearCart } = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  // Once the order is successfully placed we navigate to /thank-you. If clearCart
  // flushes before navigate, the cartItems.length===0 redirect below would otherwise
  // bounce us to /cart. `orderPlaced` short-circuits that race.
  const [orderPlaced, setOrderPlaced] = useState(false);
  const { formatPrice, currency, country } = useCurrency();
  const headingRef = useRef(null);

  useEffect(() => {
    if (headingRef.current) {
      headingRef.current.focus();
    }
  }, [step]);


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
  // Guest checkout email. Required when no user is logged in so we can send
  // order confirmation + tracking. Auto-filled from user.email if available.
  const [guestEmail, setGuestEmail] = useState(user?.email || '');

  // OTP verification gate. Logged-in users are already verified by their account;
  // guests must confirm phone+email with a code so we don't get fake orders.
  const [otpVerified, setOtpVerified] = useState(Boolean(user));
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [addressErrors, setAddressErrors] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('razorpay');

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
      } catch {
        toast.error('Could not auto-fetch city/state. Please enter manually.');
      }
      setPincodeLoading(false);
    }
  };

  // Event IDs shared with the server so Meta can dedupe browser pixel + CAPI.
  // Generated once per checkout session — the SAME id flows to both fbq() and
  // the server, which uses it when posting to Meta's Conversions API.
  const [eventIdInitiateCheckout] = useState(() => newEventId());

  // Fetch saved addresses on mount + fire InitiateCheckout pixel event
  useEffect(() => {
    // Meta Pixel: InitiateCheckout (event_id used to dedupe with server CAPI)
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'InitiateCheckout', {
        content_type: 'product',
        content_ids: cartItems.map(item => item.productId),
        contents: cartItems.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
        num_items: cartItems.length,
        value: cartTotal,
        currency: 'INR',
      }, { eventID: eventIdInitiateCheckout });
    }

    const applyAddresses = (addrs) => {
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
        setSelectedAddressId(defaultAddr._id);
        setShowNewForm(false);
      } else {
        setShowNewForm(true);
      }
    };

    const fetchAddresses = async () => {
      // Guests never have a saved-address book — skip the protected /auth/me
      // call entirely so we don't 401. Just open the new-address form.
      if (!user) {
        setShowNewForm(true);
        return;
      }
      // Render immediately from the cached user — never make the user stare at
      // a blank page if the network call to refresh addresses is slow or fails.
      if (user.addresses?.length) {
        applyAddresses(user.addresses);
      }
      try {
        // `silent: true` tells the API interceptor not to force-logout on 401 —
        // a transient blip here must not interrupt an in-progress checkout.
        const { data } = await API.get('/auth/me', { silent: true });
        applyAddresses(data.addresses || []);
      } catch {
        if (!user.addresses?.length) setShowNewForm(true);
      }
    };
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getSelectedAddress = useCallback(() => {
    if (showNewForm) return address;
    return savedAddresses.find(a => a._id === selectedAddressId) || address;
  }, [showNewForm, address, savedAddresses, selectedAddressId]);

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
          customText: item.customText,
          uploadedImageUrl: item.uploadedImageUrl
        })),
        cartTotal
      }).catch(() => console.log('Abandoned cart updated silently')); // Silent fail
    }, 2000);

    return () => clearTimeout(timer);
  }, [cartItems, cartTotal, address, selectedAddressId, user, getSelectedAddress]);

  const handleSaveNewAddress = async () => {
    // Validate all fields
    const errors = validateAddress(address);
    if (Object.keys(errors).length > 0) {
      setAddressErrors(errors);
      toast.error('Please fix the errors in the address form');
      return false;
    }

    // SmartPhoneInput natively handles the +CountryCode prefix
    const payloadAddress = {
      ...address,
    };

    // GUEST CHECKOUT: no account = no saved-address book. Just keep the
    // address in local state — it'll be sent as `shippingAddress` on the
    // order payload. Calling /auth/addresses here would hit the protected
    // route and 401 with "Not authorized, no token".
    if (!user) {
      setShowNewForm(false);
      setIsEditing(null);
      return true;
    }

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

      updateUser({ ...user, addresses: updatedAddresses });
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

    // Guest checkout — require OTP verification of the contact details to
    // prevent fake/spam orders. Logged-in users skip this (account = verified).
    if (!user && !otpVerified) {
      // Need an email AND a phone to send the dual-channel code.
      const trimmedEmail = (guestEmail || '').trim();
      if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
        toast.error('Please enter a valid email address');
        return;
      }
      if (!currentAddress.phone || currentAddress.phone.replace(/\D/g, '').length < 10) {
        toast.error('Please enter a valid phone number');
        return;
      }
      setOtpModalOpen(true);
      return;
    }

    setStep(2);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setLoading(true);
    setCouponError('');
    try {
      // Validate against the ORIGINAL subtotal (cartTotal)
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

  // 1. Calculate Shipping based on ORIGINAL Subtotal (uses shared helper — mirrors server)
  const shippingFee = calculateShipping(cartTotal);

  // 2. Recompute the discount LIVE from the current cart — mirrors the
  // server's calculateOrderPrices logic so the UI never shows a stale snapshot
  // (e.g., when the user adds/removes items from the cart drawer after applying).
  const computeDiscount = (coupon, total) => {
    if (!coupon || total <= 0) return 0;
    // If the cart no longer meets the coupon's minimum, the coupon doesn't apply.
    if (coupon.minOrderValue && total < coupon.minOrderValue) return 0;
    let discount;
    if (coupon.discountType === 'percentage') {
      discount = (total * coupon.discountValue) / 100;
      if (coupon.maxDiscountAmount > 0 && discount > coupon.maxDiscountAmount) {
        discount = coupon.maxDiscountAmount;
      }
    } else {
      discount = coupon.discountValue;
    }
    return Math.min(discount, total);
  };
  const appliedDiscount = computeDiscount(appliedCoupon, cartTotal);

  // 3. Final Total (never negative)
  const finalTotal = Math.max(cartTotal + shippingFee - appliedDiscount, 0);

  // If cart drops below the coupon's minimum, surface the issue and drop the coupon
  // so the user isn't confused by a "Coupon applied" badge with zero effect.
  useEffect(() => {
    if (
      appliedCoupon?.minOrderValue &&
      cartTotal > 0 &&
      cartTotal < appliedCoupon.minOrderValue
    ) {
      toast.error(`Coupon ${appliedCoupon.code} needs a minimum order of ₹${appliedCoupon.minOrderValue}. Removed.`);
      setAppliedCoupon(null);
    }
  }, [cartTotal, appliedCoupon]);


  const handlePlaceOrder = async () => {
    setLoading(true);
    const shippingAddress = getSelectedAddress();
    try {
      // Guest checkout requires an email for order confirmation/tracking.
      if (!user) {
        const trimmedEmail = (guestEmail || '').trim();
        if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          toast.error('Please enter a valid email address');
          setLoading(false);
          return;
        }
      }

      // Generate one Purchase event_id for this attempt. Sent to BOTH the
      // server (used in CAPI) and the browser pixel after success — Meta
      // dedupes the pair so the conversion is counted once.
      const eventIdPurchase = newEventId();
      const { fbp, fbc } = getFbCookies();

      const orderData = {
        items: cartItems.map(item => ({
          product: item.productId,
          name: item.name,
          image: item.image,
          variation: item.variation,
          customText: item.customText,
          uploadedImageUrl: item.uploadedImageUrl,
          price: item.price,
          quantity: item.quantity,
        })),
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod,
        itemsPrice: cartTotal,
        shippingPrice: shippingFee,
        taxPrice: 0,
        discountPrice: appliedDiscount,
        couponCode: appliedCoupon ? appliedCoupon.code : null,
        totalPrice: finalTotal,
        // Meta CAPI: event IDs for dedup + first-party Meta identifiers.
        eventIdPurchase,
        eventIdInitiateCheckout,
        fbp,
        fbc,
        // Guest contact details — server only reads these when no auth token is sent.
        ...(user ? {} : { guestEmail: guestEmail.trim(), guestPhone: shippingAddress.phone }),
      };

      // CASE 1: Zero-Value Order (Fully Paid by Coupon)
      if (finalTotal === 0) {
        const endpoint = user ? '/orders' : '/orders/guest';
        const { data: zeroOrder } = await API.post(endpoint, orderData);

        API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});
        // Meta Pixel: Purchase conversion (event_id matches server CAPI for dedup)
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Purchase', {
            content_type: 'product',
            content_ids: cartItems.map(item => item.productId),
            contents: cartItems.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
            num_items: cartItems.length,
            value: finalTotal,
            currency: 'INR',
            order_id: zeroOrder?.orderNumber || zeroOrder?._id,
          }, { eventID: eventIdPurchase });
        }
        setOrderPlaced(true); // prevents cart-empty redirect race after clearCart
        clearCart();
        toast.success('Order placed successfully (100% Discounted)!');
        const orderRef = zeroOrder?.orderNumber || zeroOrder?._id || '';
        navigate(`/thank-you?order=${encodeURIComponent(orderRef)}`);
      }
      // CASE 2: Razorpay
      else if (paymentMethod === 'razorpay') {
        try {
          // Fetch the public key from the server at runtime — avoids baking
          // VITE_RAZORPAY_KEY_ID into the Vercel build (which silently breaks
          // when the env var is absent from Vercel's build settings).
          let razorpayKeyId;
          try {
            const { data: paymentConfig } = await API.get('/payment-config');
            razorpayKeyId = paymentConfig.keyId;
          } catch (configErr) {
            const msg = configErr?.response?.data?.message || 'Payment gateway is not configured. Please contact support.';
            toast.error(msg);
            setLoading(false);
            return;
          }

          const isLoaded = await loadRazorpayScript();
          if (!isLoaded) {
            toast.error('Razorpay SDK failed to load. Please check your connection.');
            setLoading(false);
            return;
          }

          const { data: razorpayOrder } = await API.post('/create-order', { orderData });

          const options = {
            key: razorpayKeyId || razorpayOrder.key,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            name: 'GPSFDK',
            description: 'Order Payment',
            order_id: razorpayOrder.id,
            handler: async (response) => {
              // Persist the IDs immediately so that — even if verify fails or the
              // browser crashes — support can reconcile the payment to an order.
              try {
                localStorage.setItem('gpsfdk_last_payment', JSON.stringify({
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  email: user?.email || shippingAddress?.email,
                  total: finalTotal,
                  at: new Date().toISOString(),
                }));
              } catch (_) { /* localStorage full / disabled — ignore */ }

              try {
                const { data: verifiedOrder } = await API.post('/verify-payment', {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  orderData: orderData
                });
                // Verified successfully — drop the recovery marker.
                try { localStorage.removeItem('gpsfdk_last_payment'); } catch (_) {}
                API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});
                // Meta Pixel: Purchase conversion (event_id matches server CAPI for dedup)
                if (typeof window.fbq === 'function') {
                  window.fbq('track', 'Purchase', {
                    content_type: 'product',
                    content_ids: cartItems.map(item => item.productId),
                    contents: cartItems.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
                    num_items: cartItems.length,
                    value: finalTotal,
                    currency: 'INR',
                    order_id: verifiedOrder?.orderNumber || verifiedOrder?._id,
                  }, { eventID: eventIdPurchase });
                }
                setOrderPlaced(true); // prevents cart-empty redirect race
                clearCart();
                toast.success('Payment successful!');
                const orderRef = verifiedOrder?.orderNumber || verifiedOrder?._id || '';
                navigate(`/thank-you?order=${encodeURIComponent(orderRef)}`);
              } catch (verifyErr) {
                // CRITICAL: money was captured by Razorpay but order verification
                // failed. We keep the localStorage marker and surface a clear
                // recovery message rather than letting the user think it failed.
                toast.error(
                  (verifyErr.response?.data?.message || 'Payment verification failed') +
                  ' — your payment is safe, please contact support with reference ' +
                  (response.razorpay_payment_id || ''),
                  { duration: 12000 }
                );
              } finally {
                setLoading(false);
              }
            },
            prefill: { name: shippingAddress.fullName, email: user?.email || guestEmail, contact: shippingAddress.phone },
            theme: { color: '#0B5D3B' },
            modal: {
              ondismiss: function() {
                setLoading(false);
              }
            }
          };
          const rzp = new window.Razorpay(options);
          rzp.open();
          // IMPORTANT: do NOT setLoading(false) here. The Razorpay modal is now
          // open; the user must not be able to click "Place Order" again until
          // either handler() or modal.ondismiss() fires (both call setLoading(false)).
          return;
        } catch (err) {
          console.error('[Razorpay] init error:', err?.response?.status, err?.response?.data || err?.message || err);
          const serverMsg = err?.response?.data?.message;
          toast.error(serverMsg || 'Payment initialization failed. Please try again.');
          setLoading(false);
        }
      }
      // CASE 3: Cash on Delivery (COD)
      else if (paymentMethod === 'cod') {
        const endpoint = user ? '/orders' : '/orders/guest';
        const { data: codOrder } = await API.post(endpoint, orderData);

        API.post('/abandoned-carts/recover', { email: user?.email }).catch(() => {});
        // Meta Pixel: Purchase conversion (event_id matches server CAPI for dedup)
        if (typeof window.fbq === 'function') {
          window.fbq('track', 'Purchase', {
            content_type: 'product',
            content_ids: cartItems.map(item => item.productId),
            contents: cartItems.map(item => ({ id: item.productId, quantity: item.quantity, item_price: item.price })),
            num_items: cartItems.length,
            value: finalTotal,
            currency: 'INR',
            order_id: codOrder?.orderNumber || codOrder?._id,
          }, { eventID: eventIdPurchase });
        }
        setOrderPlaced(true); // prevents cart-empty redirect race after clearCart
        clearCart();
        toast.success('Order placed successfully via Cash on Delivery!');
        const orderRef = codOrder?.orderNumber || codOrder?._id || '';
        navigate(`/thank-you?order=${encodeURIComponent(orderRef)}`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Order failed');
    }
    setLoading(false);
  };

  // If the cart is empty AND we haven't just placed an order, bounce to /cart.
  // (We defer the navigate to an effect so we never call navigate during render —
  // that would warn and could cause infinite re-render loops.)
  useEffect(() => {
    if (cartItems.length === 0 && !orderPlaced) {
      navigate('/cart');
    }
  }, [cartItems.length, orderPlaced, navigate]);

  if (cartItems.length === 0 && !orderPlaced) {
    return null;
  }

  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-20">
      <div className="max-w-4xl mx-auto section-padding">
        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-2xl sm:text-3xl font-heading font-bold text-secondary mb-8">
          Checkout
        </motion.h1>

        {/* Steps — responsive */}
        <nav aria-label="Checkout Steps" className="flex items-center gap-2 sm:gap-4 mb-10">
          {['Shipping', 'Payment', 'Confirm'].map((s, i) => (
            <div key={s} className="flex items-center gap-1 sm:gap-2" aria-current={step === i + 1 ? 'step' : undefined}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${step > i ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-accent text-white' : 'bg-gray-200 text-gray-500'}`} aria-hidden="true">
                {step > i ? '✓' : i + 1}
              </div>
              <span className={`text-xs sm:text-sm font-medium ${step === i + 1 ? 'text-secondary' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-6 sm:w-12 h-0.5 bg-gray-200 mx-0.5 sm:mx-1" role="presentation" />}
            </div>
          ))}
        </nav>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5 sm:p-8">
          {/* Step 1: Shipping */}
          {step === 1 && (
            <div>
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-heading font-semibold text-secondary mb-6 focus:outline-none">Shipping Address</h2>

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
                              // Pass the full phone number, SmartPhoneInput handles splitting it
                              setAddress({ ...addr, phone: addr.phone || '' });
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
                    {/* Only show the inner heading when the user is editing or
                        choosing "Add new" from a saved-address list. On the
                        empty-state flow (no saved addresses) the parent
                        "Shipping Address" h2 already labels the form, so a
                        second "New Shipping Address" is redundant. */}
                    {(isEditing || savedAddresses.length > 0) && (
                      <h3 className="text-lg font-heading font-bold text-secondary mb-4">
                        {isEditing ? 'Edit Address' : 'New Shipping Address'}
                      </h3>
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

                      {/* Guest email — only shown for unauthenticated buyers */}
                      {!user && (
                        <div className="md:col-span-2">
                          <label className="block text-sm font-semibold text-secondary mb-1">Email *</label>
                          <input
                            type="email"
                            value={guestEmail}
                            onChange={(e) => setGuestEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-primary border border-gray-200 rounded-xl focus:outline-none focus:border-accent"
                            placeholder="you@example.com — for order confirmation & tracking"
                            required
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Already a customer? <Link to="/login" className="text-accent font-semibold">Log in</Link> for faster checkout.
                          </p>
                        </div>
                      )}

                      {/* Phone */}
                      <div>
                        <label className="block text-sm font-semibold text-secondary mb-1">Phone *</label>
                        <SmartPhoneInput
                          value={address.phone}
                          onChange={(val) => handleAddressChange('phone', val)}
                          onBlur={() => handleAddressBlur('phone')}
                          error={addressErrors.phone}
                        />
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
              <div className="flex items-center justify-between flex-wrap gap-2 mb-6">
                <h2 ref={headingRef} tabIndex={-1} className="text-xl font-heading font-semibold text-secondary focus:outline-none">Payment Method</h2>
                {!user && otpVerified && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Contact verified
                  </span>
                )}
              </div>
              <div className="space-y-3">
                {[
                  { value: 'razorpay', label: 'Razorpay / Online Payment', icon: '💳', desc: 'Secure payment via UPI, Cards, Net Banking' },
                  ...(country === 'IN' || currency === 'INR' ? [
                    { value: 'cod', label: 'Cash on Delivery (COD)', icon: '💵', desc: 'Pay with cash upon delivery' }
                  ] : [])
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
              <h2 ref={headingRef} tabIndex={-1} className="text-xl font-heading font-semibold text-secondary mb-6 focus:outline-none">Review Your Order</h2>
              
              {/* Shipping Banner - Based on cartTotal (Subtotal) */}
              {currency === 'INR' && (
                shippingFee > 0 ? (
                  <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-6 text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                    <div className="flex items-start sm:items-center gap-3">
                      <span className="text-xl">🚚</span>
                      <span className="leading-relaxed">You&apos;re only <strong className="text-amber-900 border-b border-amber-300">{formatPrice(999 - cartTotal)}</strong> away from <strong>Free Shipping!</strong></span>
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
                )
              )}


              <div className="space-y-3 mb-6">
                {cartItems.map(item => (
                  <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <img src={optimizeImage(item.image, 200)} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                      <div>
                        <p className="font-semibold text-sm">{item.name}</p>
                        <p className="text-xs text-gray-500">{item.variation?.size} × {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-bold text-accent">{formatPrice(item.price * item.quantity)}</span>
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
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      if (couponError) setCouponError('');
                    }}
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
                {appliedCoupon && appliedDiscount > 0 && <p className="text-green-600 text-sm mt-1 font-medium">Coupon &apos;{appliedCoupon.code}&apos; applied! (-{formatPrice(Math.round(appliedDiscount))})</p>}
              </div>

              <div className="bg-cream-dark rounded-xl p-5 mb-6">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatPrice(cartTotal)}</span></div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Shipping</span>
                  {shippingFee > 0 ? (
                    <span className="text-secondary font-medium">+{formatPrice(shippingFee)}</span>
                  ) : (
                    <span className="text-green-600 font-bold">FREE</span>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm mt-1 text-green-600 font-medium">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span>-{formatPrice(Math.round(appliedDiscount))}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold mt-3 pt-3 border-t border-gray-200"><span>Total</span><span className="text-accent">{formatPrice(Math.round(finalTotal))}</span></div>

              </div>
              <div className="flex gap-3 items-center sm:gap-4">
                <button onClick={() => setStep(2)} className="btn-outline">Back</button>
                <button
                  onClick={handlePlaceOrder}
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
                  ) : (
                    'Place Order'
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* OTP verification modal — only used for guest checkout.
          On verify success the server upserts a User account from the
          shipping address + email + phone and returns a JWT so the rest of
          checkout runs as a logged-in user (and the buyer keeps the account
          afterwards). */}
      <CheckoutOtpModal
        isOpen={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        onVerified={(loginData) => {
          setOtpVerified(true);
          setOtpModalOpen(false);
          if (loginData?.token) {
            // updateUser writes to localStorage and sets the AuthContext user,
            // which is what API.js reads on each request → subsequent calls
            // (incl. /orders) go out authenticated automatically.
            updateUser(loginData);
            toast.success(
              loginData.createdAccount
                ? 'Account created — you are now signed in.'
                : 'Welcome back — you are now signed in.'
            );
          }
          setStep(2);
        }}
        phone={getSelectedAddress()?.phone}
        email={guestEmail}
        userData={!user ? {
          name: getSelectedAddress()?.fullName || '',
          email: guestEmail,
          address: getSelectedAddress(),
        } : undefined}
      />

    </div>
  );
};

export default CheckoutPage;
