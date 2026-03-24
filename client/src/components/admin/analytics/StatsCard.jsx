import { motion } from 'framer-motion';
import { HiOutlineEye, HiOutlineUsers, HiOutlineHeart, HiOutlineChatAlt2 } from 'react-icons/hi';

const iconMap = {
  views: HiOutlineEye,
  visitors: HiOutlineUsers,
  likes: HiOutlineHeart,
  comments: HiOutlineChatAlt2,
};

const formatNumber = (num) => {
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const StatsCard = ({ type, title, total, growth, isActive = false, onClick }) => {
  const Icon = iconMap[type] || HiOutlineEye;
  const isPositive = growth >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`
        relative bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm cursor-pointer
        transition-all duration-200 overflow-hidden
        ${isActive
          ? 'border-2 border-green-500 ring-2 ring-green-500/20'
          : 'border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600'
        }
      `}
    >
      {/* Active indicator line */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-400" />
      )}

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm mb-1">
            <Icon className="w-4 h-4" />
            <span>{title}</span>
          </div>
          <p className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">
            {formatNumber(total)}
          </p>
        </div>
      </div>

      <div className="mt-2">
        <span className={`
          inline-flex items-center text-xs font-semibold
          ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}
        `}>
          {isPositive ? '↑' : '↓'} {Math.abs(growth)}%
        </span>
      </div>
    </motion.div>
  );
};

export default StatsCard;
