import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineInformationCircle } from 'react-icons/hi';

const MostViewed = ({ postsAndPages = [], archive = [] }) => {
  const [activeTab, setActiveTab] = useState('posts');

  const items = activeTab === 'posts' ? postsAndPages : archive;
  const maxViews = items.length > 0 ? Math.max(...items.map(i => i.views)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Most viewed</h3>
          <HiOutlineInformationCircle className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'posts'
                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Posts & pages
          </button>
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'archive'
                ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            Archive
          </button>
        </div>
      </div>

      {/* Column headers */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">
        <span>{activeTab === 'posts' ? 'Posts & pages' : 'Archive'}</span>
        <span>Views</span>
      </div>

      {/* List */}
      <div className="space-y-0">
        {items.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            No data available yet
          </div>
        ) : (
          items.map((item, i) => (
            <div
              key={i}
              className="group flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {/* Progress bar background */}
                <div className="relative flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate pr-4 relative z-10">
                      {item.title}
                    </span>
                  </div>
                  <div className="mt-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(item.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-4 shrink-0">
                {item.views.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {items.length > 0 && (
        <button className="mt-4 text-sm text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 font-medium transition-colors">
          View all
        </button>
      )}
    </motion.div>
  );
};

export default MostViewed;
