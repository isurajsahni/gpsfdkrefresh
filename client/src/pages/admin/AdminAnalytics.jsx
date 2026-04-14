import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineEye, HiOutlineUsers, HiOutlineRefresh, HiOutlineGlobeAlt } from 'react-icons/hi';
import API from '../../utils/api';
import ChartSection from '../../components/admin/analytics/ChartSection';
import StatsCard from '../../components/admin/analytics/StatsCard';
import SkeletonLoader from '../../components/admin/analytics/SkeletonLoader';

const DATE_RANGES = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
];

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('7d');
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState({
    views: { total: 0, growth: 0 },
    visitors: { total: 0, growth: 0 },
    returning: { total: 0, growth: 0 },
  });
  const [sources, setSources] = useState([]);
  const [topPages, setTopPages] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [referrers, setReferrers] = useState([]);
  const [activeMetric, setActiveMetric] = useState('views');

  const fetchData = async (selectedRange) => {
    setLoading(true);
    try {
      const [dailyRes, dashboardRes] = await Promise.all([
        API.get(`/analytics/daily?range=${selectedRange}`).catch(() => ({ data: { daily: [], summary: {} } })),
        API.get(`/analytics/dashboard?range=${selectedRange}`).catch(() => ({ data: {} })),
      ]);

      setDailyData(dailyRes.data?.daily || []);
      if (dailyRes.data?.summary) {
        setSummary(dailyRes.data.summary);
      }
      if (dashboardRes.data) {
        setSources(dashboardRes.data.sources || []);
        setTopPages(dashboardRes.data.topPages || []);
        setCampaigns(dashboardRes.data.campaigns || []);
        setReferrers(dashboardRes.data.referrers || []);
      }
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const sourceColors = {
    'Instagram': '#E1306C',
    'Facebook': '#1877F2',
    'Google': '#4285F4',
    'YouTube': '#FF0000',
    'Twitter/X': '#1DA1F2',
    'WhatsApp': '#25D366',
    'Direct': '#6B7280',
    'Email': '#F59E0B',
    'Bing': '#008373',
    'Pinterest': '#E60023',
    'Other': '#9CA3AF',
  };

  const maxSourceViews = sources.length > 0 ? Math.max(...sources.map(s => s.views)) : 1;
  const maxPageViews = topPages.length > 0 ? Math.max(...topPages.map(p => p.views)) : 1;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <h1 className="text-2xl font-heading font-bold text-gray-900">
          Site Analytics
        </h1>
        <div className="flex items-center gap-2">
          {/* Date range pills */}
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {DATE_RANGES.map(r => (
              <button
                key={r.value}
                onClick={() => setRange(r.value)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  range === r.value
                    ? 'bg-[#0B5D3B] text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500">
            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
            <span>{range === 'today' ? 'Today' : range === '30d' ? 'Last 30 Days' : 'Last 7 Days'}</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="mb-6">
        {loading ? (
          <SkeletonLoader type="cards" />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatsCard
              type="views"
              title="Total Views"
              total={summary.views.total}
              growth={summary.views.growth}
              isActive={activeMetric === 'views'}
              onClick={() => setActiveMetric('views')}
            />
            <StatsCard
              type="visitors"
              title="Unique Visitors"
              total={summary.visitors.total}
              growth={summary.visitors.growth}
              isActive={activeMetric === 'visitors'}
              onClick={() => setActiveMetric('visitors')}
            />
            <StatsCard
              type="returning"
              title="Returning Visitors"
              total={summary.returning.total}
              growth={summary.returning.growth}
              isActive={activeMetric === 'returning'}
              onClick={() => setActiveMetric('returning')}
            />
          </div>
        )}
      </div>

      {/* Main Chart */}
      {loading ? (
        <SkeletonLoader type="chart" />
      ) : (
        <ChartSection data={dailyData} />
      )}

      {/* Two-column layout: Traffic Sources + Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        {/* Traffic Sources */}
        {loading ? (
          <SkeletonLoader type="list" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <HiOutlineGlobeAlt className="w-5 h-5 text-[#0B5D3B]" />
                <h3 className="text-base font-semibold text-gray-800">Traffic Sources</h3>
              </div>
              <span className="text-xs text-gray-400">Views</span>
            </div>
            {sources.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No traffic data yet</div>
            ) : (
              <div className="space-y-0">
                {sources.map((s, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sourceColors[s.source] || '#9CA3AF' }}
                          />
                          <span className="text-sm font-medium text-gray-700">{s.source}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 rounded-full transition-all duration-500"
                          style={{
                            width: `${(s.views / maxSourceViews) * 100}%`,
                            backgroundColor: sourceColors[s.source] || '#9CA3AF',
                          }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <span className="text-sm font-semibold text-gray-700">{s.views.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">({s.visitors} visitors)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Top Pages */}
        {loading ? (
          <SkeletonLoader type="list" />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <HiOutlineEye className="w-5 h-5 text-[#0B5D3B]" />
                <h3 className="text-base font-semibold text-gray-800">Top Pages</h3>
              </div>
              <span className="text-xs text-gray-400">Views</span>
            </div>
            {topPages.length === 0 ? (
              <div className="text-center py-8 text-gray-400 text-sm">No page data yet</div>
            ) : (
              <div className="space-y-0">
                {topPages.map((p, i) => (
                  <div
                    key={i}
                    className="group flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate pr-4 font-mono">{p.page}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 bg-[#0B5D3B] rounded-full transition-all duration-500"
                          style={{ width: `${(p.views / maxPageViews) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="ml-4 shrink-0 text-right">
                      <span className="text-sm font-semibold text-gray-700">{p.views.toLocaleString()}</span>
                      <span className="text-xs text-gray-400 ml-1">({p.visitors} visitors)</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* UTM Campaigns + Referrers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6 mb-8">
        {/* UTM Campaigns */}
        {!loading && campaigns.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
          >
            <h3 className="text-base font-semibold text-gray-800 mb-4">UTM Campaigns</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Campaign</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase">Source</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase text-right">Views</th>
                    <th className="pb-3 text-xs font-semibold text-gray-500 uppercase text-right">Visitors</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {campaigns.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 text-sm font-medium text-gray-700">{c.campaign}</td>
                      <td className="py-3 text-sm text-gray-500">{c.source || '—'} / {c.medium || '—'}</td>
                      <td className="py-3 text-sm font-semibold text-gray-700 text-right">{c.views}</td>
                      <td className="py-3 text-sm text-gray-500 text-right">{c.visitors}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Referrers */}
        {!loading && referrers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-gray-800">Referrers</h3>
              <span className="text-xs text-gray-400">Views</span>
            </div>
            <div className="space-y-0">
              {referrers.map((ref, i) => {
                const maxRefViews = Math.max(...referrers.map(r => r.views));
                return (
                  <div
                    key={i}
                    className="group flex items-center justify-between py-2.5 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700 truncate pr-4">{ref.source}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                          style={{ width: `${(ref.views / maxRefViews) * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 ml-4 shrink-0">
                      {ref.views.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
