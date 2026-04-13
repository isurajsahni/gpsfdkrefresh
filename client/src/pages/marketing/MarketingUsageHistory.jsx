import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineChevronLeft, HiOutlineChevronRight, HiOutlineFilter } from 'react-icons/hi';
import API from '../../utils/api';

const MarketingUsageHistory = () => {
  const [usages, setUsages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [month, setMonth] = useState('');

  const fetchUsage = async (pageNum, monthFilter) => {
    setLoading(true);
    try {
      let url = `/marketing/coupon-usage?page=${pageNum}&limit=20`;
      if (monthFilter) url += `&month=${monthFilter}`;
      const { data } = await API.get(url);
      setUsages(data.usages || []);
      setTotalPages(data.totalPages || 0);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to fetch usage:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsage(page, month); }, [page, month]);

  const handleMonthChange = (e) => {
    setMonth(e.target.value);
    setPage(1);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary">Usage History</h1>
        <p className="text-gray-500 mt-1">Detailed log of every order placed with your coupons</p>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-wrap items-center gap-3 mb-6"
      >
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
          <HiOutlineFilter className="w-4 h-4 text-gray-400" />
          <input
            type="month"
            value={month}
            onChange={handleMonthChange}
            className="text-sm bg-transparent outline-none text-gray-700"
            placeholder="Filter by month"
          />
        </div>
        {month && (
          <button onClick={() => { setMonth(''); setPage(1); }} className="text-sm text-accent font-medium hover:underline">
            Clear Filter
          </button>
        )}
        <span className="ml-auto text-sm text-gray-400">{total} total records</span>
      </motion.div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : usages.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No usage data found</p>
            <p className="text-sm mt-1">Orders placed with your coupons will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Coupon</th>
                  <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {usages.map((u, i) => (
                  <motion.tr
                    key={u._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm font-mono font-medium text-secondary">{u.orderId}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">{u.couponCode}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <HiOutlineChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MarketingUsageHistory;
