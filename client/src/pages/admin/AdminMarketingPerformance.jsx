import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTrendingUp, HiOutlineSortDescending } from 'react-icons/hi';
import API from '../../utils/api';

const AdminMarketingPerformance = () => {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('revenue');

  useEffect(() => {
    const fetch = async () => {
      try {
        const { data } = await API.get('/marketing/admin/performance');
        setPerformance(data.performance || []);
      } catch (err) {
        console.error('Failed to load performance:', err);
      }
      setLoading(false);
    };
    fetch();
  }, []);

  const sorted = [...performance].sort((a, b) => {
    if (sortBy === 'revenue') return b.totalRevenue - a.totalRevenue;
    if (sortBy === 'uses') return b.totalUses - a.totalUses;
    if (sortBy === 'earnings') return b.estimatedEarnings - a.estimatedEarnings;
    return 0;
  });

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-secondary flex items-center gap-2">
            <HiOutlineTrendingUp className="w-6 h-6" /> Marketing Leaderboard
          </h1>
          <p className="text-gray-500 text-sm mt-1">Performance overview of all marketing partners</p>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <HiOutlineSortDescending className="w-4 h-4 text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm bg-transparent outline-none text-gray-700"
          >
            <option value="revenue">Sort by Revenue</option>
            <option value="uses">Sort by Uses</option>
            <option value="earnings">Sort by Earnings</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-gray-400 text-lg font-medium">No marketing data yet</p>
          <p className="text-gray-400 text-sm mt-1">Assign coupons to marketing users to see performance here</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12">#</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Partner</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coupon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Uses</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Revenue</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Discount</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Commission</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sorted.map((p, i) => (
                  <motion.tr
                    key={p.couponId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.04 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-lg">{medals[i] || <span className="text-sm text-gray-400">{i + 1}</span>}</td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-secondary">{p.userName}</p>
                      <p className="text-xs text-gray-400">{p.userEmail}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg font-heading font-bold text-sm">{p.couponCode}</span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-gray-700 text-right">{p.totalUses}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-emerald-600 text-right">₹{p.totalRevenue.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">₹{p.totalDiscount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 text-right">{p.commissionRate}%</td>
                    <td className="px-6 py-4 text-sm font-bold text-right" style={{ color: '#F15A29' }}>₹{p.estimatedEarnings.toLocaleString('en-IN')}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMarketingPerformance;
