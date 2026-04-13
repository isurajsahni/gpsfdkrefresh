import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineTicket, HiOutlineCursorClick, HiOutlineCurrencyRupee, HiOutlineTrendingUp } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import API from '../../utils/api';

// ─── Animated Counter ─────────────────────────────────────────────
const AnimatedCounter = ({ value, prefix = '', suffix = '' }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (end === 0) { setDisplay(0); return; }
    const duration = 1200;
    const stepTime = 16;
    const steps = Math.ceil(duration / stepTime);
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, stepTime);
    return () => clearInterval(timer);
  }, [value]);
  return <span ref={ref}>{prefix}{display.toLocaleString('en-IN')}{suffix}</span>;
};

// ─── Simple Line Chart (CSS-based — no dependency) ────────────────
const MiniChart = ({ data, dataKey, color = '#F15A29' }) => {
  if (!data.length) return <div className="text-center text-gray-400 py-10 text-sm">No trend data yet</div>;
  const values = data.map(d => d[dataKey]);
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => ({
    x: (i / Math.max(data.length - 1, 1)) * 100,
    y: 100 - (v / max) * 80 - 10,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaD = pathD + ` L ${points[points.length - 1].x} 100 L ${points[0].x} 100 Z`;

  return (
    <div className="relative w-full" style={{ paddingBottom: '40%' }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#grad-${dataKey})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      {/* X-axis labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-1" style={{ transform: 'translateY(18px)' }}>
        {data.map((d, i) => (
          <span key={i} className="text-[10px] text-gray-400 whitespace-nowrap">{d.label?.slice(5) || ''}</span>
        ))}
      </div>
    </div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────
const MarketingDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, trendRes] = await Promise.all([
          API.get('/marketing/dashboard'),
          API.get('/marketing/trend'),
        ]);
        setStats(dashRes.data);
        setTrend(trendRes.data.trend || []);
      } catch (err) {
        console.error('Dashboard load failed:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-12 h-12 border-4 border-secondary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totals = stats?.totals || { totalUses: 0, totalRevenue: 0, totalDiscount: 0, estimatedEarnings: 0 };
  const coupons = stats?.coupons || [];

  const cards = [
    { label: 'Total Uses', value: totals.totalUses, icon: HiOutlineCursorClick, color: '#3B82F6', bg: 'from-blue-500/10 to-blue-600/5' },
    { label: 'Revenue Generated', value: totals.totalRevenue, icon: HiOutlineCurrencyRupee, prefix: '₹', color: '#10B981', bg: 'from-emerald-500/10 to-emerald-600/5' },
    { label: 'Total Discount', value: totals.totalDiscount, icon: HiOutlineTicket, prefix: '₹', color: '#F59E0B', bg: 'from-amber-500/10 to-amber-600/5' },
    { label: 'Estimated Earnings', value: totals.estimatedEarnings, icon: HiOutlineTrendingUp, prefix: '₹', color: '#F15A29', bg: 'from-orange-500/10 to-orange-600/5' },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-bold text-secondary">
          Welcome, {user?.name || 'Marketing Partner'} 👋
        </h1>
        <p className="text-gray-500 mt-1">Here's an overview of your coupon performance</p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card, idx) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`relative overflow-hidden bg-gradient-to-br ${card.bg} bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-2xl sm:text-3xl font-bold mt-2" style={{ color: card.color }}>
                  <AnimatedCounter value={card.value} prefix={card.prefix || ''} />
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${card.color}15` }}>
                <card.icon className="w-6 h-6" style={{ color: card.color }} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Coupon Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="text-lg font-heading font-bold text-secondary mb-6">Usage Trend</h2>
          <MiniChart data={trend} dataKey="uses" color="#F15A29" />
        </motion.div>

        {/* Coupon Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="text-lg font-heading font-bold text-secondary mb-4">Your Coupons</h2>
          {coupons.length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No coupons assigned yet</p>
          ) : (
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {coupons.map((c, i) => (
                <div key={c.couponId} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div>
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-lg font-heading font-bold text-sm">{c.couponCode}</span>
                    <p className="text-xs text-gray-400 mt-1">{c.commissionRate}% commission</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-secondary">{c.totalUses} uses</p>
                    <p className="text-xs text-gray-400">₹{c.totalRevenue.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default MarketingDashboard;
