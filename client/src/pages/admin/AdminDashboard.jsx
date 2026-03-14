import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCube, HiOutlineClipboardList, HiOutlineUsers, HiOutlineCurrencyRupee } from 'react-icons/hi';
import API from '../../utils/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, pendingOrders: 0, deliveredOrders: 0 });
  const [products, setProducts] = useState(0);
  const [users, setUsers] = useState(0);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [orderStats, productData, userData] = await Promise.all([
          API.get('/orders/stats'),
          API.get('/products?limit=1'),
          API.get('/auth/users'),
        ]);
        setStats(orderStats.data);
        setProducts(productData.data.total || 0);
        setUsers(userData.data?.length || 0);
      } catch (err) {
        console.error(err);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: HiOutlineCurrencyRupee, color: 'bg-green-500' },
    { title: 'Total Orders', value: stats.totalOrders, icon: HiOutlineClipboardList, color: 'bg-blue-500' },
    { title: 'Products', value: products, icon: HiOutlineCube, color: 'bg-purple-500' },
    { title: 'Users', value: users, icon: HiOutlineUsers, color: 'bg-amber-500' },
  ];

  return (
    <div>
      <h1 className="text-2xl font-heading font-bold text-secondary mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold text-secondary mt-1">{card.value}</p>
              </div>
              <div className={`w-12 h-12 ${card.color} rounded-xl flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-semibold text-secondary mb-4">Order Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Pending</span>
              <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold">{stats.pendingOrders}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Delivered</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">{stats.deliveredOrders}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-heading font-semibold text-secondary mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <a href="/admin/products" className="block w-full text-left px-4 py-3 bg-cream rounded-xl text-sm font-medium text-secondary hover:bg-secondary hover:text-white transition-all">
              + Add New Product
            </a>
            <a href="/admin/orders" className="block w-full text-left px-4 py-3 bg-cream rounded-xl text-sm font-medium text-secondary hover:bg-secondary hover:text-white transition-all">
              View All Orders
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
