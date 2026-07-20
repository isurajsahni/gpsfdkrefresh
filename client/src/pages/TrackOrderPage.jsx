import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import { FaSearch, FaBox, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaTimesCircle } from 'react-icons/fa';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { optimizeImage } from '../utils/imageOptimizer';
import { KindButton, KindHero } from '../components/kindact/KindUI';
import heroImage from '../assets/image/shipping_demo.webp';

const TrackOrderPage = () => {
  const [searchParams] = useSearchParams();
  // Contact arrives via router state (from the Support form) so PII never
  // lands in the URL; ?contact= is still honoured for old links/bookmarks.
  const { state: routeState } = useLocation();
  const [orderId, setOrderId] = useState(routeState?.orderId || searchParams.get('orderId') || '');
  const [contact, setContact] = useState(routeState?.contact || searchParams.get('contact') || '');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [shiprocketData, setShiprocketData] = useState(null);
  const autoTracked = useRef(false);

  const track = async (orderIdVal, contactVal) => {
    if (!orderIdVal || !contactVal) {
      toast.error('Please enter both Order ID and Email/Phone');
      return;
    }

    // UX-only format check — real verification happens server-side.
    const cleanContact = contactVal.trim();
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
    const looksLikePhone = /^\+?[0-9][0-9\s-]{5,14}$/.test(cleanContact);
    if (!looksLikeEmail && !looksLikePhone) {
      toast.error('Please enter a valid email address or phone number');
      return;
    }

    setLoading(true);
    setOrderData(null);
    setShiprocketData(null);

    try {
      const response = await API.get(`/orders/track?orderId=${encodeURIComponent(orderIdVal)}&contact=${encodeURIComponent(contactVal)}`);
      setOrderData(response.data);

      // If AWB exists, try to get real-time tracking (non-blocking)
      if (response.data.awbCode) {
        try {
          const trackRes = await API.get(`/orders/track-awb/${response.data.awbCode}`);
          setShiprocketData(trackRes.data);
        } catch (srErr) {
          console.error('Shiprocket tracking fetch failed:', srErr);
        }
      }

      toast.success('Order found!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to track order. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    e.preventDefault();
    track(orderId, contact);
  };

  // Deep links can prefill the form: router state (Support page) or ?orderId=
  // (email buttons; legacy links may also carry ?contact=). When both values
  // are present, track immediately.
  useEffect(() => {
    const initialOrderId = routeState?.orderId || searchParams.get('orderId');
    const initialContact = routeState?.contact || searchParams.get('contact');
    if (initialOrderId && initialContact && !autoTracked.current) {
      autoTracked.current = true;
      track(initialOrderId, initialContact);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Status mapping for the stepper
  const steps = [
    { id: 'pending', label: 'Order Placed', icon: FaBox },
    { id: 'processing', label: 'Confirmed', icon: FaCheckCircle },
    { id: 'shipped', label: 'Shipped', icon: FaTruck },
    { id: 'delivered', label: 'Delivered', icon: FaMapMarkerAlt },
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return -1;
    }
  };

  let currentStep = orderData ? getStepIndex(orderData.status) : -1;
  const isCancelled = orderData?.status === 'cancelled';
  const isPaymentPending = orderData?.status === 'payment_pending';

  // Sync our local progress tracker with live Shiprocket status
  if (shiprocketData?.tracking_data?.shipment_track?.[0]) {
    const srStatus = shiprocketData.tracking_data.shipment_track[0].current_status?.toLowerCase() || '';
    if (srStatus.includes('delivered')) {
      currentStep = 3;
    } else if (srStatus.includes('out for delivery') || srStatus.includes('shipped') || srStatus.includes('in transit') || srStatus.includes('dispatched')) {
      currentStep = Math.max(currentStep, 2);
    }
  }

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Track Order | GPSFDK"
        description="Track your GPSFDK order status easily using your Order ID and Email/Phone Number."
        noindex
      />

      {/* ─── Hero + tracking form ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / Track order"
          title={
            <>
              Follow your order, <span className="text-kind-lime">every step.</span>
            </>
          }
          description="Enter your Order ID and the Email or Phone number you used during checkout to see the current status of your shipment."
        >
          <form
            onSubmit={handleTrack}
            className="relative mt-8 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end max-w-3xl"
          >
            <div>
              <label htmlFor="orderId" className="block text-sm font-medium text-white/90 mb-1.5 pl-2">
                Order ID
              </label>
              <input
                type="text"
                id="orderId"
                placeholder="e.g. GPS-XYZ123"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-white text-kind-ink placeholder-kind-ink/40 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-kind-lime border border-transparent transition-shadow"
                required
              />
            </div>
            <div>
              <label htmlFor="contact" className="block text-sm font-medium text-white/90 mb-1.5 pl-2">
                Email or Phone
              </label>
              <input
                type="text"
                id="contact"
                placeholder="Enter email or phone"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-white text-kind-ink placeholder-kind-ink/40 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-kind-lime border border-transparent transition-shadow"
                required
              />
            </div>
            <KindButton type="submit" variant="lime" disabled={loading}>
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-kind-ink/30 border-t-kind-ink rounded-full animate-spin" />
                  Tracking…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <FaSearch className="w-4 h-4" /> Track
                </span>
              )}
            </KindButton>
          </form>
        </KindHero>
      </motion.div>

      <div className="max-w-3xl mx-auto px-3 sm:px-5">
        {/* Results Section */}
        {orderData && (
          <div className="bg-white rounded-[24px] border border-kind-forest/10 p-6 md:p-8 mt-8 sm:mt-10 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-kind-ink/10 gap-4">
              <div>
                <h2 className="text-xl font-heading font-bold text-kind-ink">
                  Order #{orderData.orderNumber}
                </h2>
                <p className="text-kind-ink/60 text-sm mt-1">
                  Placed on {new Date(orderData.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-left md:text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${isCancelled ? 'bg-red-500/10 text-red-500' :
                    orderData.status === 'delivered' ? 'bg-green-500/10 text-green-600' :
                    isPaymentPending ? 'bg-orange-500/10 text-orange-500' :
                    'bg-kind-mint text-kind-forest'}
                `}>
                  {isCancelled ? 'Cancelled' :
                   isPaymentPending ? 'Payment Pending' :
                   orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </span>
                <p className="text-kind-ink font-semibold mt-2 text-lg">
                  Total: ₹{orderData.totalPrice}
                </p>
              </div>
            </div>

            {/* Stepper */}
            {(!isCancelled && !isPaymentPending) ? (
              <div className="py-6">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-kind-ink/10 rounded-full hidden sm:block"></div>
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-kind-forest rounded-full transition-all duration-500 hidden sm:block"
                    style={{ width: `${Math.max(0, (currentStep / (steps.length - 1)) * 100)}%` }}
                  ></div>

                  {/* Steps */}
                  <div className="relative flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                    {steps.map((step, index) => {
                      const StepIcon = step.icon;
                      const isCompleted = currentStep >= index;
                      const isCurrent = currentStep === index;

                      return (
                        <div key={step.id} className="relative flex sm:flex-col items-center gap-4 sm:gap-2 z-10">
                          <div className={`
                            w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                            ${isCompleted
                              ? 'bg-kind-forest border-kind-forest text-kind-lime'
                              : 'bg-white border-kind-ink/20 text-kind-ink/30'}
                            ${isCurrent ? 'ring-4 ring-kind-lime/40' : ''}
                          `}>
                            <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>

                          {/* Mobile View Line */}
                          {index !== steps.length - 1 && (
                            <div className={`w-0.5 h-10 sm:hidden ${isCompleted ? 'bg-kind-forest' : 'bg-kind-ink/10'}`}></div>
                          )}

                          <div className="sm:text-center sm:absolute sm:top-14 sm:-translate-x-1/2 sm:left-1/2 sm:w-24">
                            <p className={`text-sm font-medium ${isCompleted ? 'text-kind-ink' : 'text-kind-ink/50'}`}>
                              {step.label}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : isCancelled ? (
              <div className="py-6 text-center text-red-500 flex flex-col items-center justify-center">
                <FaTimesCircle className="w-12 h-12 mb-3 opacity-80" />
                <p className="font-medium">This order has been cancelled.</p>
              </div>
            ) : isPaymentPending ? (
              <div className="py-6 text-center text-orange-500 flex flex-col items-center justify-center">
                <p className="font-medium">Waiting for payment confirmation.</p>
              </div>
            ) : null}

            {/* Tracking / Shipping info */}
            {(orderData.awbCode || orderData.trackingNumber) && (
              <div className="mt-8 sm:mt-16 bg-kind-mist rounded-[20px] p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-kind-ink/60 text-xs uppercase tracking-wider font-bold mb-1">AWB / Tracking Number</p>
                    <p className="text-kind-forest font-mono text-lg">{orderData.awbCode || orderData.trackingNumber}</p>
                    {orderData.courierName && (
                      <p className="text-kind-ink/70 text-sm mt-1">Courier: <span className="font-bold text-kind-ink">{orderData.courierName}</span></p>
                    )}
                  </div>
                  {shiprocketData?.tracking_data?.track_url && (
                    <a
                      href={shiprocketData.tracking_data.track_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center border border-kind-forest text-kind-forest hover:bg-kind-forest hover:text-white rounded-full px-4 py-2 transition-colors text-sm font-medium"
                    >
                      Real-time Tracking <FaTruck className="ml-2 w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DB-persisted Tracking Timeline (primary — always available once webhook fires) */}
            {orderData.trackingHistory && orderData.trackingHistory.length > 0 && (
              <div className="mt-8 bg-kind-mist rounded-[20px] p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-kind-ink/60 text-xs uppercase tracking-wider font-bold">Tracking Timeline</p>
                  {orderData.lastTrackingUpdate && (
                    <p className="text-kind-ink/40 text-xs">
                      Last updated: {new Date(orderData.lastTrackingUpdate).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="relative border-l-2 border-kind-ink/15 ml-2 mt-2 space-y-6">
                  {[...orderData.trackingHistory].reverse().map((entry, index) => {
                    const statusColors = {
                      processing: 'bg-amber-500',
                      shipped:    'bg-blue-500',
                      delivered:  'bg-green-500',
                      cancelled:  'bg-red-500',
                    };
                    const dotColor = statusColors[entry.status] || 'bg-kind-ink/40';

                    return (
                      <div key={index} className="relative pl-6">
                        <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-kind-mist ${index === 0 ? `${dotColor} animate-pulse` : dotColor} opacity-${index === 0 ? '100' : '70'}`}></div>

                        <p className={`font-semibold ${index === 0 ? 'text-kind-forest' : 'text-kind-ink'}`}>
                          {entry.message || entry.srStatus || 'Status Updated'}
                        </p>

                        <div className="text-sm mt-1 text-kind-ink/60 flex flex-col sm:flex-row sm:gap-4">
                          {entry.timestamp && (
                            <span className="flex items-center gap-1">
                              <FaCheckCircle className="w-3 h-3 opacity-50" />
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          )}
                          {entry.location && (
                            <span className="flex items-center gap-1">
                              <FaMapMarkerAlt className="w-3 h-3 opacity-50" />
                              {entry.location}
                            </span>
                          )}
                        </div>

                        <span className={`inline-block mt-1.5 text-xs font-medium px-2 py-0.5 rounded-full capitalize
                          ${entry.status === 'delivered' ? 'bg-green-500/10 text-green-600' :
                            entry.status === 'shipped' ? 'bg-blue-500/10 text-blue-600' :
                            entry.status === 'cancelled' ? 'bg-red-500/10 text-red-600' :
                            'bg-amber-500/10 text-amber-600'}`}
                        >
                          {entry.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Live Courier Updates from Shiprocket API (secondary enrichment) */}
            {shiprocketData?.tracking_data && (
              <div className="mt-6 bg-kind-mist rounded-[20px] p-6">
                <p className="text-kind-ink/60 text-xs uppercase tracking-wider font-bold mb-4">Live Courier Updates</p>

                {(() => {
                  const trackObj = shiprocketData.tracking_data.shipment_track?.[0] || {};
                  const activities = shiprocketData.tracking_data.shipment_track_activities || trackObj.activities || [];

                  if (activities.length > 0) {
                    return (
                      <div className="relative border-l-2 border-kind-ink/15 ml-2 mt-2 space-y-6">
                        {activities.map((activity, index) => (
                          <div key={index} className="relative pl-6">
                            {/* Dot for timeline */}
                            <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-kind-mist ${index === 0 ? 'bg-kind-forest animate-pulse' : 'bg-kind-ink/40'}`}></div>

                            <p className={`font-semibold ${index === 0 ? 'text-kind-forest' : 'text-kind-ink'}`}>
                              {activity.activity || activity.status || 'Status Updated'}
                            </p>

                            <div className="text-sm mt-1 text-kind-ink/60 flex flex-col sm:flex-row sm:gap-4">
                              {activity.date && (
                                <span className="flex items-center gap-1">
                                  <FaCheckCircle className="w-3 h-3 opacity-50" />
                                  {new Date(activity.date).toLocaleString()}
                                </span>
                              )}
                              {activity.location && (
                                <span className="flex items-center gap-1">
                                  <FaMapMarkerAlt className="w-3 h-3 opacity-50" />
                                  {activity.location}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  } else {
                    // Fallback if no activities array but we have current status
                    return trackObj.current_status ? (
                      <div className="flex items-center gap-3 text-kind-ink">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <p className="font-medium">{trackObj.current_status}</p>
                        {trackObj.last_location && (
                          <span className="text-kind-ink/50 text-sm ml-2">({trackObj.last_location})</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-kind-ink/60 text-sm italic py-2">Tracking details will update once the courier scans your package.</p>
                    );
                  }
                })()}
              </div>
            )}

            {/* Order Items */}
            <div className="mt-8 sm:mt-16 pt-6 border-t border-kind-ink/10">
              <h3 className="text-lg font-heading font-bold text-kind-ink mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-kind-mist/60 p-3 rounded-[16px] hover:bg-kind-mist transition-colors">
                    <img
                      src={optimizeImage(item.image, 200)}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-[12px]"
                    />
                    <div className="flex-1 min-w-0">
                      <Link
                        to={item.productSlug ? `/product/${item.productSlug}` : '#'}
                        className="text-kind-ink font-medium hover:text-kind-forest truncate block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-kind-ink/60 mt-1">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                      {item.variation && (
                        <p className="text-xs text-kind-ink/50 mt-1 capitalize">
                          {Object.values(item.variation).filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery address */}
            {orderData.shippingAddress && orderData.shippingAddress.city && (
               <div className="mt-6 p-4 rounded-[16px] bg-kind-lime/20 border border-kind-lime/40">
                 <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-kind-forest">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <p className="text-sm text-kind-ink/80 font-medium">Delivery Destination</p>
                      <p className="text-sm text-kind-ink mt-1 font-semibold">{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
                    </div>
                 </div>
               </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};

export default TrackOrderPage;
