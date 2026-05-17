import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineChevronDown, HiOutlineChevronUp, HiOutlinePhone, HiOutlineMail, HiOutlineLocationMarker, HiOutlineTrash } from 'react-icons/hi';
import API from '../../utils/api';
import toast from 'react-hot-toast';
import { optimizeImage } from '../../utils/imageOptimizer';
import { useAuth } from '../../context/AuthContext';

const statusColors = {
  payment_pending: 'bg-orange-100 text-orange-700',
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const AdminOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  // Pagination + filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const PAGE_SIZE = 50;

  const fetchOrders = async (signal) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        all: 'true',
        paginate: 'true',
        page: String(page),
        limit: String(PAGE_SIZE),
      });
      if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
      if (search.trim()) params.set('search', search.trim());
      const { data } = await API.get(`/orders?${params.toString()}`, { signal });
      // Defensive: server returns {orders,total,page,...} on paginate=true;
      // fall back to array if a legacy proxy ever strips the envelope.
      const list = Array.isArray(data) ? data : (data?.orders || []);
      setOrders(list);
      setTotal(Array.isArray(data) ? list.length : (data?.total || 0));
      setTotalPages(Array.isArray(data) ? 1 : (data?.totalPages || 1));
    } catch (err) {
      if (err.name !== 'CanceledError' && err.name !== 'AbortError') console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchOrders(controller.signal);
    return () => controller.abort();
    // Re-fetch on page/filter/search change (search is debounced by user inertia).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search]);

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/orders/${id}`, { status });
      toast.success('Status updated');
      fetchOrders();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => prev === id ? null : id);
  };

  const deleteOrder = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this order?')) {
      try {
        await API.delete(`/orders/${id}`);
        toast.success('Order deleted');
        fetchOrders();
      } catch (err) {
        toast.error('Delete failed');
      }
    }
  };

  // Get customer display name & contact
  const getCustomerInfo = (order) => {
    if (order.user) {
      return {
        name: order.user.name || 'Unknown',
        email: order.user.email || '',
        phone: order.shippingAddress?.phone || '',
        isGuest: false,
      };
    }
    return {
      name: order.shippingAddress?.fullName || 'Guest',
      email: order.guestEmail || '',
      phone: order.guestPhone || order.shippingAddress?.phone || '',
      isGuest: true,
    };
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-heading font-bold text-secondary">Orders {total > 0 && <span className="text-sm font-normal text-gray-500 ml-2">({total} total)</span>}</h1>
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search order #, email, phone…"
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm w-64 max-w-full focus:outline-none focus:border-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent"
          >
            <option value="all">All statuses</option>
            {['payment_pending', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
              <option key={s} value={s}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
            ))}
          </select>
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" /></div>
      ) : orders.length === 0 ? (
        <p className="text-gray-500 text-center py-20">No orders match the current filters.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order, i) => {
            const customer = getCustomerInfo(order);
            const isExpanded = expandedId === order._id;
            const addr = order.shippingAddress;

            return (
              <motion.div
                key={order._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
              >
                {/* Header row — always visible */}
                <div
                  className="p-5 cursor-pointer hover:bg-gray-50/50 transition-colors"
                  onClick={() => toggleExpand(order._id)}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-heading font-semibold text-secondary">{order.orderNumber}</h3>
                        {customer.isGuest && (
                          <span className="text-[10px] font-bold bg-accent/10 text-accent px-2 py-0.5 rounded-full">GUEST</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-0.5">{customer.name}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-400">
                        {customer.phone && (
                          <span className="flex items-center gap-1">
                            <HiOutlinePhone className="w-3.5 h-3.5" /> {customer.phone}
                          </span>
                        )}
                        {customer.email && (
                          <span className="flex items-center gap-1">
                            <HiOutlineMail className="w-3.5 h-3.5" /> {customer.email}
                          </span>
                        )}
                        <span>{new Date(order.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <select
                        value={order.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border-0 cursor-pointer ${statusColors[order.status] || 'bg-gray-100'}`}
                      >
                        {['payment_pending', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                          <option key={s} value={s}>{s.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</option>
                        ))}
                      </select>
                      <span className="font-bold text-accent text-lg">₹{order.totalPrice?.toLocaleString()}</span>
                      
                      {/* Delete Button - Admin Only */}
                      {(user?.role === 'admin' || user?.role === 'admin_marketing') && (
                        <button 
                          onClick={(e) => deleteOrder(order._id, e)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Order"
                        >
                          <HiOutlineTrash className="w-5 h-5" />
                        </button>
                      )}

                      {isExpanded ? <HiOutlineChevronUp className="w-5 h-5 text-gray-400" /> : <HiOutlineChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </div>

                  {/* Product thumbnails — always visible */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {order.items?.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 bg-gray-50 rounded-lg px-2 py-1.5">
                        {item.image && (
                          <img src={optimizeImage(item.image, 100)} alt={item.name} className="w-8 h-8 rounded object-cover flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium text-gray-700">{item.name} ×{item.quantity}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 text-xs text-gray-400">
                    Payment: <span className="font-medium capitalize">{order.paymentMethod}</span>
                    {order.isPaid && <span className="ml-3 text-green-600 font-semibold">✓ Paid</span>}
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-gray-100 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Order Items */}
                          <div>
                            <h4 className="text-sm font-semibold text-secondary mb-3">Order Items</h4>
                            <div className="space-y-3">
                              {order.items?.map((item, j) => (
                                <div key={j} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                                  {item.image ? (
                                    <img src={optimizeImage(item.image, 200)} alt={item.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                                  ) : (
                                    <div className="w-16 h-16 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400 text-xs flex-shrink-0">No img</div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-sm text-secondary truncate">{item.name}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.variation?.size && <span className="text-[10px] bg-white border rounded px-1.5 py-0.5">{item.variation.size}</span>}
                                      {item.variation?.material && <span className="text-[10px] bg-white border rounded px-1.5 py-0.5">{item.variation.material}</span>}
                                      {item.variation?.frame && <span className="text-[10px] bg-white border rounded px-1.5 py-0.5">{item.variation.frame}</span>}
                                      {item.variation?.color && <span className="text-[10px] bg-white border rounded px-1.5 py-0.5">{item.variation.color}</span>}
                                    </div>
                                    {item.customText && <p className="text-[10px] text-accent mt-1 uppercase font-bold tracking-wider">Instructions: "{item.customText}"</p>}
                                    {item.uploadedImageUrl && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <a 
                                          href={item.uploadedImageUrl} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className="text-[10px] bg-accent text-white px-3 py-1 rounded-full font-bold hover:bg-accent/80 transition-colors flex items-center gap-1"
                                        >
                                          Download Design
                                        </a>
                                      </div>
                                    )}
                                    <p className="text-xs mt-1">
                                      <span className="text-gray-500">Qty: {item.quantity}</span>
                                      <span className="ml-3 font-bold text-accent">₹{(item.price * item.quantity).toLocaleString()}</span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Shipping Address */}
                          <div>
                            <h4 className="text-sm font-semibold text-secondary mb-3 flex items-center gap-1.5">
                              <HiOutlineLocationMarker className="w-4 h-4" /> Shipping Address
                            </h4>
                            {addr ? (
                              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 space-y-1">
                                <p className="font-semibold text-secondary">{addr.fullName}</p>
                                {addr.phone && <p className="flex items-center gap-1.5"><HiOutlinePhone className="w-3.5 h-3.5 text-accent" /> {addr.phone}</p>}
                                <p>{addr.addressLine1}</p>
                                {addr.addressLine2 && <p>{addr.addressLine2}</p>}
                                <p>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</p>
                                <p>{addr.country}</p>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No address provided</p>
                            )}

                            {/* Contact summary */}
                            <h4 className="text-sm font-semibold text-secondary mt-5 mb-2">Customer Contact</h4>
                            <div className="bg-gray-50 rounded-xl p-4 text-sm space-y-1.5">
                              {customer.email && (
                                <a href={`mailto:${customer.email}`} className="flex items-center gap-2 text-gray-600 hover:text-accent transition-colors">
                                  <HiOutlineMail className="w-4 h-4 text-accent" /> {customer.email}
                                </a>
                              )}
                              {customer.phone && (
                                <a href={`tel:${customer.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-accent transition-colors">
                                  <HiOutlinePhone className="w-4 h-4 text-accent" /> {customer.phone}
                                </a>
                              )}
                            </div>

                            {/* Coupon & Discount Info */}
                            {(order.couponCode || order.discountPrice > 0) && (
                              <>
                                <h4 className="text-sm font-semibold text-secondary mt-5 mb-2">Coupon & Discount</h4>
                                <div className="bg-green-50 rounded-xl p-4 text-sm border border-green-100 space-y-1.5">
                                  {order.couponCode && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Coupon Used:</span>
                                      <span className="font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-md uppercase text-xs">
                                        {order.couponCode}
                                      </span>
                                    </div>
                                  )}
                                  {order.discountPrice > 0 && (
                                    <div className="flex justify-between">
                                      <span className="text-gray-600">Discount Amount:</span>
                                      <span className="font-bold text-green-700">-₹{order.discountPrice.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            ← Prev
          </button>
          <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
