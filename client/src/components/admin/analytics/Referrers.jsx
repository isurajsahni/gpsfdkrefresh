import { motion } from 'framer-motion';
import { HiOutlineInformationCircle } from 'react-icons/hi';

const Referrers = ({ data = [] }) => {
  const maxViews = data.length > 0 ? Math.max(...data.map(r => r.views)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Referrers</h3>
          <HiOutlineInformationCircle className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">Views</span>
      </div>

      {/* List */}
      <div className="space-y-0">
        {data.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            No referrer data yet
          </div>
        ) : (
          data.map((ref, i) => (
            <div
              key={i}
              className="group flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-4">
                    {ref.source}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                  <div
                    className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                    style={{ width: `${(ref.views / maxViews) * 100}%` }}
                  />
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-4 shrink-0">
                {ref.views.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <button className="mt-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors">
          View details
        </button>
      )}
    </motion.div>
  );
};

export default Referrers;
