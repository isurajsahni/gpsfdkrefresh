import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineShoppingCart, HiOutlineTrash, HiOutlineMail } from 'react-icons/hi';
import API from '../../../utils/api';
import toast from 'react-hot-toast';

const AdminAbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCarts = async () => {
    try {
      const { data } = await API.get('/abandoned-carts');
      setCarts(data);
    } catch (err) {
      toast.error('Failed to load abandoned carts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this cart record?')) return;
    try {
      await API.delete(`/abandoned-carts/${id}`);
      setCarts(carts.filter(cart => cart._id !== id));
      toast.success('Cart deleted');
    } catch {
      toast.error('Failed to delete cart');
    }
  };

  if (loading) return <div className="p-8"><div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary">Abandoned Carts</h1>
          <p className="text-gray-500 mt-1">Monitor and recover incomplete checkouts</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {carts.map(cart => (
            <motion.div
              key={cart._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <div className="bg-red-50 text-red-500 p-2 rounded-full">
                    <HiOutlineShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-secondary">{cart.name || 'Anonymous Guest'}</h3>
                    <p className="text-xs text-gray-400">
                      Last Active: {new Date(cart.lastActive).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cart._id)}
                  className="text-gray-400 hover:text-red-500 p-1 transition-colors rounded-full hover:bg-red-50"
                  title="Delete Cart"
                >
                  <HiOutlineTrash className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <a href={`mailto:${cart.email}`} className="text-sm font-medium text-accent hover:underline flex items-center gap-1">
                  <HiOutlineMail className="w-4 h-4"/> {cart.email}
                </a>
                {cart.phone && (
                  <span className="text-sm text-gray-500">{cart.phone}</span>
                )}
              </div>

              <div className="border-t border-gray-100 pt-4 flex-grow">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Cart Contents ({cart.cartItems?.length || 0})</h4>
                <div className="space-y-3 max-h-[150px] overflow-y-auto pr-2 custom-scrollbar">
                  {cart.cartItems?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 text-sm">
                      <img src={item.image} alt={item.name} className="w-10 h-10 object-cover rounded shadow-sm border border-gray-100" />
                      <div>
                        <p className="text-secondary font-medium leading-tight line-clamp-1">{item.name}</p>
                        <p className="text-gray-500 text-xs mt-0.5">Qty: {item.quantity} · ₹{item.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">Total Value</span>
                <span className="text-lg font-bold text-secondary">₹{(cart.cartTotal || 0).toLocaleString()}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {carts.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HiOutlineShoppingCart className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-heading font-bold text-secondary">No Abandoned Carts!</h3>
            <p className="text-gray-500 mt-2">Check back later for potentially lost leads.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminAbandonedCarts;
