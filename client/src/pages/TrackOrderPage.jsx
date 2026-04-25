import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { FaSearch, FaBox, FaCheckCircle, FaTruck, FaMapMarkerAlt, FaTimesCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { optimizeImage } from '../utils/imageOptimizer';

const TrackOrderPage = () => {
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState(null);
  const [shiprocketData, setShiprocketData] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!orderId || !contact) {
      toast.error('Please enter both Order ID and Email/Phone');
      return;
    }

    setLoading(true);
    setOrderData(null);
    setShiprocketData(null);

    try {
      const response = await API.get(`/orders/track?orderId=${encodeURIComponent(orderId)}&contact=${encodeURIComponent(contact)}`);
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
    <div className="min-h-screen bg-primary pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <Helmet>
        <title>Track Order | GPSFDK</title>
        <meta name="description" content="Track your GPSFDK order status easily using your Order ID and Email/Phone Number." />
      </Helmet>

      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-secondary mb-4">
            Track Your Order
          </h1>
          <p className="text-secondary/70 max-w-xl mx-auto">
            Enter your Order ID and the Email or Phone number you used during checkout to see the current status of your shipment.
          </p>
        </div>

        {/* Tracking Form */}
        <div className="bg-secondary/5 rounded-2xl p-6 md:p-8 backdrop-blur-sm border border-secondary/10 shadow-lg mb-12">
          <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="orderId" className="block text-sm font-medium text-secondary/80 mb-1">
                Order ID
              </label>
              <input
                type="text"
                id="orderId"
                placeholder="e.g. GPS-XYZ123"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full bg-primary/50 border border-secondary/20 rounded-xl px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="contact" className="block text-sm font-medium text-secondary/80 mb-1">
                Email or Phone
              </label>
              <input
                type="text"
                id="contact"
                placeholder="Enter email or phone"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-primary/50 border border-secondary/20 rounded-xl px-4 py-3 text-secondary focus:outline-none focus:border-accent transition-colors"
                required
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto bg-accent hover:bg-accent/90 text-white font-medium rounded-xl px-8 py-3 flex items-center justify-center gap-2 transition-all disabled:opacity-70 disabled:cursor-not-allowed h-[50px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FaSearch /> Track
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {orderData && (
          <div className="bg-secondary/5 rounded-2xl p-6 md:p-8 border border-secondary/10 shadow-lg animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 pb-6 border-b border-secondary/10 gap-4">
              <div>
                <h2 className="text-xl font-bold text-secondary">
                  Order #{orderData.orderNumber}
                </h2>
                <p className="text-secondary/60 text-sm mt-1">
                  Placed on {new Date(orderData.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-left md:text-right">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                  ${isCancelled ? 'bg-red-500/10 text-red-500' :
                    orderData.status === 'delivered' ? 'bg-green-500/10 text-green-500' :
                    isPaymentPending ? 'bg-orange-500/10 text-orange-500' :
                    'bg-accent/10 text-accent'}
                `}>
                  {isCancelled ? 'Cancelled' : 
                   isPaymentPending ? 'Payment Pending' : 
                   orderData.status.charAt(0).toUpperCase() + orderData.status.slice(1)}
                </span>
                <p className="text-secondary/80 font-semibold mt-2 text-lg">
                  Total: ₹{orderData.totalPrice}
                </p>
              </div>
            </div>

            {/* Stepper */}
            {(!isCancelled && !isPaymentPending) ? (
              <div className="py-6">
                <div className="relative">
                  {/* Progress Line */}
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-secondary/20 rounded-full hidden sm:block"></div>
                  <div 
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-accent rounded-full transition-all duration-500 hidden sm:block"
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
                              ? 'bg-accent border-accent text-white' 
                              : 'bg-primary border-secondary/30 text-secondary/30'}
                            ${isCurrent ? 'ring-4 ring-accent/20' : ''}
                          `}>
                            <StepIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                          </div>
                          
                          {/* Mobile View Line */}
                          {index !== steps.length - 1 && (
                            <div className={`w-0.5 h-10 sm:hidden ${isCompleted ? 'bg-accent' : 'bg-secondary/20'}`}></div>
                          )}

                          <div className="sm:text-center sm:absolute sm:top-14 sm:-translate-x-1/2 sm:left-1/2 sm:w-24">
                            <p className={`text-sm font-medium ${isCompleted ? 'text-secondary' : 'text-secondary/50'}`}>
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
              <div className="mt-8 sm:mt-16 bg-primary/50 rounded-xl p-6 border border-secondary/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-secondary/60 text-xs uppercase tracking-wider font-bold mb-1">AWB / Tracking Number</p>
                    <p className="text-accent font-mono text-lg">{orderData.awbCode || orderData.trackingNumber}</p>
                    {orderData.courierName && (
                      <p className="text-secondary/80 text-sm mt-1">Courier: <span className="font-bold text-secondary">{orderData.courierName}</span></p>
                    )}
                  </div>
                  {shiprocketData?.tracking_data?.track_url && (
                    <a 
                      href={shiprocketData.tracking_data.track_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center px-4 py-2 border border-accent text-accent hover:bg-accent hover:text-white rounded-lg transition-colors text-sm font-medium"
                    >
                      Real-time Tracking <FaTruck className="ml-2 w-3 h-3" />
                    </a>
                  )}
                </div>

                {/* Real-time status from Shiprocket */}
                {shiprocketData?.tracking_data && (
                  <div className="mt-6 pt-6 border-t border-secondary/5">
                    <p className="text-secondary/60 text-xs uppercase tracking-wider font-bold mb-4">Detailed Tracking History</p>
                    
                    {(() => {
                      const trackObj = shiprocketData.tracking_data.shipment_track?.[0] || {};
                      const activities = shiprocketData.tracking_data.shipment_track_activities || trackObj.activities || [];
                      
                      if (activities.length > 0) {
                        return (
                          <div className="relative border-l-2 border-secondary/20 ml-2 mt-2 space-y-6">
                            {activities.map((activity, index) => (
                              <div key={index} className="relative pl-6">
                                {/* Dot for timeline */}
                                <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full border-2 border-primary ${index === 0 ? 'bg-accent animate-pulse' : 'bg-secondary/40'}`}></div>
                                
                                <p className={`font-semibold ${index === 0 ? 'text-accent' : 'text-secondary'}`}>
                                  {activity.activity || activity.status || 'Status Updated'}
                                </p>
                                
                                <div className="text-sm mt-1 text-secondary/60 flex flex-col sm:flex-row sm:gap-4">
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
                          <div className="flex items-center gap-3 text-secondary">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <p className="font-medium">{trackObj.current_status}</p>
                            {trackObj.last_location && (
                              <span className="text-secondary/50 text-sm ml-2">({trackObj.last_location})</span>
                            )}
                          </div>
                        ) : (
                          <p className="text-secondary/60 text-sm italic py-2">Tracking details will update once the courier scans your package.</p>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Order Items */}
            <div className="mt-8 sm:mt-16 pt-6 border-t border-secondary/10">
              <h3 className="text-lg font-bold text-secondary mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-4 bg-primary/30 p-3 rounded-xl border border-secondary/5 hover:border-secondary/20 transition-colors">
                    <img 
                      src={optimizeImage(item.image, 200)} 
                      alt={item.name} 
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <Link 
                        to={item.productSlug ? `/product/${item.productSlug}` : '#'} 
                        className="text-secondary font-medium hover:text-accent truncate block"
                      >
                        {item.name}
                      </Link>
                      <p className="text-sm text-secondary/60 mt-1">
                        Qty: {item.quantity} × ₹{item.price}
                      </p>
                      {item.variation && (
                        <p className="text-xs text-secondary/50 mt-1 capitalize">
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
               <div className="mt-6 p-4 rounded-xl bg-accent/5 border border-accent/10">
                 <div className="flex items-start gap-3">
                    <div className="mt-1 flex-shrink-0 text-accent">
                      <FaMapMarkerAlt />
                    </div>
                    <div>
                      <p className="text-sm text-secondary/80 font-medium">Delivery Destination</p>
                      <p className="text-sm text-secondary mt-1 font-semibold">{orderData.shippingAddress.city}, {orderData.shippingAddress.state}</p>
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
