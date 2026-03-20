import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';
import toast from 'react-hot-toast';

const statusColors = {
  pending: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const UserDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data } = await API.get('/orders');
        setOrders(data);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    };
    fetchOrders();
  }, []);

  return (
    <div className="min-h-screen bg-primary pt-24 pb-20">
      <div className="max-w-5xl mx-auto section-padding">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-heading font-bold text-secondary">My Orders</h1>
          <p className="text-gray-500 mt-2">Welcome, {user?.name}</p>
        </motion.div>

        <div className="mt-10">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-500 text-lg">No orders yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-6 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <p className="font-heading font-semibold text-secondary text-lg">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-full text-xs font-semibold capitalize ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {order.status}
                      </span>
                      <span className="font-bold text-accent text-lg">₹{order.totalPrice?.toLocaleString()}</span>
                      {(order.status === 'pending' || order.status === 'processing') && (
                        <button 
                          onClick={async () => {
                            if(window.confirm('Are you sure you want to cancel this order?')) {
                              try {
                                await API.put(`/orders/${order._id}/cancel`);
                                toast.success('Order cancelled successfully');
                                // Refresh orders list (could optimize by updating local state instead)
                                const { data } = await API.get('/orders');
                                setOrders(data);
                              } catch(err) {
                                toast.error(err.response?.data?.message || 'Cancellation failed');
                              }
                            }
                          }}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-100 transition-colors ml-2"
                        >
                          Cancel Order
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {order.items?.map((item, j) => (
                      <div key={j} className="flex items-center gap-2 bg-cream-dark rounded-lg px-3 py-2 text-sm">
                        <img src={item.image} alt={item.name} className="w-8 h-8 rounded object-cover" />
                        <span className="font-medium">{item.name}</span>
                        <span className="text-gray-400">×{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  {order.trackingNumber && (
                    <p className="text-sm text-gray-500 mt-3">Tracking: <span className="font-semibold text-secondary">{order.trackingNumber}</span></p>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
