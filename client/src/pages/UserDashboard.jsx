import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';
import { HiOutlineUser, HiOutlineShoppingBag, HiOutlineLocationMarker, HiOutlineMail, HiOutlinePhone } from 'react-icons/hi';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [ordersRes, profileRes] = await Promise.all([
          API.get('/orders'),
          API.get('/auth/me')
        ]);
        setOrders(ordersRes.data);
        setProfile(profileRes.data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary pt-24 pb-20 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-primary pt-[120px] pb-20">
      <div className="max-w-6xl mx-auto section-padding flex flex-col md:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="md:w-64 flex-shrink-0">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-[2rem] p-6 shadow-sm sticky top-[100px]">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl font-heading font-bold text-accent">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-heading font-bold text-secondary">{user?.name}</h2>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeTab === 'profile' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <HiOutlineUser className="w-5 h-5" /> My Profile
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium ${activeTab === 'orders' ? 'bg-secondary text-white' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <HiOutlineShoppingBag className="w-5 h-5" /> My Orders
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-gray-100 text-center">
              <button onClick={logout} className="text-red-500 hover:text-red-600 font-medium text-sm transition-colors">
                Sign Out
              </button>
            </div>
          </motion.div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'profile' && (
              <motion.div
                key="profile"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white rounded-[2rem] p-8 shadow-sm"
              >
                <h3 className="text-2xl font-heading font-bold text-secondary mb-6 border-b border-gray-100 pb-4">Personal Information</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                  <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                      <HiOutlineUser className="text-accent" />
                      <span className="text-sm text-gray-500 font-medium">Full Name</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary">{profile?.name || user?.name}</p>
                  </div>
                  <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                      <HiOutlineMail className="text-accent" />
                      <span className="text-sm text-gray-500 font-medium">Email Address</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary">{profile?.email || user?.email}</p>
                  </div>
                  <div className="bg-primary p-5 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-3 mb-1">
                      <HiOutlinePhone className="text-accent" />
                      <span className="text-sm text-gray-500 font-medium">Phone Number</span>
                    </div>
                    <p className="text-lg font-semibold text-secondary">{profile?.phone || user?.phone || 'Not provided'}</p>
                  </div>
                </div>

                <h3 className="text-2xl font-heading font-bold text-secondary mb-6 border-b border-gray-100 pb-4">Saved Addresses</h3>
                {profile?.addresses?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profile.addresses.map((addr) => (
                      <div key={addr._id} className="p-5 rounded-2xl border border-gray-200 relative bg-primary">
                        {addr.isDefault && (
                          <span className="absolute top-4 right-4 text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-bold">Default</span>
                        )}
                        <p className="font-bold text-secondary text-lg mb-1">{addr.fullName}</p>
                        <p className="text-gray-500 text-sm mb-2 font-medium">{addr.phone}</p>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {addr.addressLine1}
                          {addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} - {addr.pincode}<br />
                          {addr.country}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-primary rounded-2xl border border-dashed border-gray-300">
                    <HiOutlineLocationMarker className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No addresses saved yet.</p>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'orders' && (
              <motion.div
                key="orders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="bg-white rounded-[2rem] p-8 shadow-sm mb-6 flex items-center justify-between">
                  <h3 className="text-2xl font-heading font-bold text-secondary">Order History</h3>
                  <span className="bg-primary text-accent px-4 py-1.5 rounded-full text-sm font-bold">{orders.length} Orders</span>
                </div>

                {orders.length === 0 ? (
                  <div className="text-center py-20 bg-white rounded-[2rem] shadow-sm">
                    <div className="text-6xl mb-4">📦</div>
                    <p className="text-gray-500 text-lg">You haven't placed any orders yet</p>
                    <Link to="/" className="inline-block mt-6 text-accent font-bold hover:underline">Start Shopping →</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order, i) => (
                      <motion.div
                        key={order._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-[2rem] p-6 sm:p-8 shadow-sm"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 border-b border-gray-100 pb-6">
                          <div>
                            <p className="font-heading font-bold text-secondary text-lg">Order #{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                              {order.status}
                            </span>
                            <span className="font-bold text-accent text-xl">₹{order.totalPrice?.toLocaleString()}</span>
                            {(order.status === 'pending' || order.status === 'processing') && (
                              <button 
                                onClick={async () => {
                                  if(window.confirm('Are you sure you want to cancel this order?')) {
                                    try {
                                      await API.put(`/orders/${order._id}/cancel`);
                                      toast.success('Order cancelled successfully');
                                      const { data } = await API.get('/orders');
                                      setOrders(data);
                                    } catch(err) {
                                      toast.error(err.response?.data?.message || 'Cancellation failed');
                                    }
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors ml-2"
                              >
                                Cancel Order
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {order.items?.map((item, j) => (
                            <Link key={j} to={`/product/${item.product?.slug || item.product}`} className="flex items-center gap-4 bg-primary rounded-xl p-3 hover:shadow-md transition-shadow group">
                              <img src={item.image} alt={item.name} className="w-16 h-16 rounded-lg object-cover" />
                              <div className="flex-1">
                                <span className="font-bold text-secondary group-hover:text-accent transition-colors line-clamp-1">{item.name}</span>
                                <div className="text-sm text-gray-500 mt-1 flex justify-between">
                                  <span>Qty: {item.quantity}</span>
                                  <span className="font-medium text-secondary">₹{(item.price * item.quantity).toLocaleString()}</span>
                                </div>
                              </div>
                            </Link>
                          ))}
                        </div>
                        {order.trackingNumber && (
                          <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-center justify-between">
                            <span>Tracking Number: <strong className="ml-1">{order.trackingNumber}</strong></span>
                            {order.trackingUrl && (
                              <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">Track Status</a>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
