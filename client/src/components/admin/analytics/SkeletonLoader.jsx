import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card' }) => {
  const pulse = 'animate-pulse bg-gray-200 dark:bg-gray-700 rounded';

  if (type === 'chart') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className={`${pulse} h-5 w-24`} />
          <div className="flex gap-2">
            <div className={`${pulse} h-8 w-20`} />
            <div className={`${pulse} h-8 w-20`} />
          </div>
        </div>
        <div className="flex items-end gap-3 h-64">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex-1 flex items-end gap-1">
              <div className={`${pulse} flex-1`} style={{ height: `${30 + Math.random() * 70}%` }} />
              <div className={`${pulse} flex-1`} style={{ height: `${20 + Math.random() * 50}%` }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'cards') {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
          >
            <div className={`${pulse} h-4 w-16 mb-3`} />
            <div className={`${pulse} h-8 w-20 mb-2`} />
            <div className={`${pulse} h-3 w-14`} />
          </motion.div>
        ))}
      </div>
    );
  }

  if (type === 'list') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className={`${pulse} h-5 w-32 mb-6`} />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-3">
            <div className={`${pulse} h-4 w-40`} />
            <div className={`${pulse} h-4 w-12`} />
          </div>
        ))}
      </div>
    );
  }

  return null;
};

export default SkeletonLoader;
