import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineCalendar, HiOutlineArrowLeft, HiOutlineArrowRight, HiOutlineAdjustments } from 'react-icons/hi';
import API from '../../utils/api';
import ChartSection from '../../components/admin/analytics/ChartSection';
import StatsCard from '../../components/admin/analytics/StatsCard';
import Referrers from '../../components/admin/analytics/Referrers';
import LocationsSection from '../../components/admin/analytics/LocationsSection';
import SkeletonLoader from '../../components/admin/analytics/SkeletonLoader';

const AdminAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [dailyData, setDailyData] = useState([]);
  const [summary, setSummary] = useState({
    views: { total: 0, growth: 0 },
    visitors: { total: 0, growth: 0 },
    likes: { total: 0, growth: 0 },
    comments: { total: 0, growth: 0 },
  });
  const [dashboardData, setDashboardData] = useState({
    mostViewed: { postsAndPages: [], archive: [] },
    referrers: [],
    locations: { countries: [], regions: [], cities: [] },
  });
  const [activeMetric, setActiveMetric] = useState('views');

  // Date range display
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 6);
  const formatDate = (d) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const dateRange = `${formatDate(sevenDaysAgo)} - ${formatDate(today)}`;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dailyRes, dashboardRes] = await Promise.all([
          API.get('/analytics/daily').catch(() => ({ data: { daily: [], summary: {} } })),
          API.get('/analytics/dashboard').catch(() => ({ data: {} })),
        ]);

        setDailyData(dailyRes.data?.daily || []);
        if (dailyRes.data?.summary) {
          setSummary(dailyRes.data.summary);
        }
        if (dashboardRes.data) {
          setDashboardData({
            mostViewed: dashboardRes.data.mostViewed || { postsAndPages: [], archive: [] },
            referrers: dashboardRes.data.referrers || [],
            locations: dashboardRes.data.locations || { countries: [], regions: [], cities: [] },
          });
        }
      } catch (err) {
        console.error('Failed to fetch analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <h1 className="text-2xl font-heading font-bold text-gray-900 dark:text-white">
          Last 7 Days
        </h1>
        <div className="flex items-center gap-2">
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <HiOutlineArrowRight className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-700 dark:text-gray-300">
            <span>{dateRange}</span>
            <HiOutlineCalendar className="w-4 h-4 text-gray-400" />
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <HiOutlineAdjustments className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Main Chart */}
      {loading ? (
        <SkeletonLoader type="chart" />
      ) : (
        <ChartSection data={dailyData} />
      )}

      {/* Stats Cards */}
      <div className="mt-6">
        {loading ? (
          <SkeletonLoader type="cards" />
        ) : (
          <div className="grid grid-cols-2 gap-4 max-w-2xl">
            <StatsCard
              type="views"
              title="Views"
              total={summary.views.total}
              growth={summary.views.growth}
              isActive={activeMetric === 'views'}
              onClick={() => setActiveMetric('views')}
            />
            <StatsCard
              type="visitors"
              title="Visitors"
              total={summary.visitors.total}
              growth={summary.visitors.growth}
              isActive={activeMetric === 'visitors'}
              onClick={() => setActiveMetric('visitors')}
            />
          </div>
        )}
      </div>

      {/* Referrers */}
      <div className="mt-8">
        {loading ? (
          <SkeletonLoader type="list" />
        ) : (
          <Referrers data={dashboardData.referrers} />
        )}
      </div>

      {/* Locations */}
      <div className="mt-8 mb-8">
        {loading ? (
          <SkeletonLoader type="list" />
        ) : (
          <LocationsSection locations={dashboardData.locations} />
        )}
      </div>
    </div>
  );
};

export default AdminAnalytics;
