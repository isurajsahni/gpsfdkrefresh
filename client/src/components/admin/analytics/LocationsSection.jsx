import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineInformationCircle } from 'react-icons/hi';

// Simple world map SVG placeholder
const WorldMapPlaceholder = () => (
  <div className="w-full h-40 sm:h-48 bg-gray-50 dark:bg-gray-700/30 rounded-xl flex items-center justify-center mb-4 overflow-hidden">
    <svg viewBox="0 0 800 400" className="w-full h-full opacity-30 dark:opacity-20" fill="none">
      {/* Simplified world map outlines */}
      <g fill="#16a34a" fillOpacity="0.3" stroke="#16a34a" strokeWidth="0.5" strokeOpacity="0.4">
        {/* North America */}
        <path d="M120,80 L180,60 L220,70 L240,100 L220,140 L200,160 L160,180 L130,170 L110,140 L100,120 Z" />
        {/* South America */}
        <path d="M170,200 L200,190 L220,210 L230,250 L220,290 L200,320 L180,330 L160,310 L155,270 L160,230 Z" />
        {/* Europe */}
        <path d="M360,70 L400,60 L430,70 L440,90 L420,110 L390,120 L370,110 L350,90 Z" />
        {/* Africa */}
        <path d="M370,130 L410,120 L440,140 L450,180 L440,230 L420,270 L390,280 L370,260 L360,220 L355,170 Z" />
        {/* Asia */}
        <path d="M450,50 L550,40 L630,60 L680,90 L700,130 L680,160 L620,170 L560,160 L500,140 L460,120 L450,90 Z" />
        {/* Australia */}
        <path d="M620,250 L680,240 L710,260 L700,290 L670,300 L640,290 L620,270 Z" />
      </g>
    </svg>
  </div>
);

const flagEmojis = {
  US: '🇺🇸', IN: '🇮🇳', GB: '🇬🇧', CA: '🇨🇦', AU: '🇦🇺',
  DE: '🇩🇪', FR: '🇫🇷', JP: '🇯🇵', BR: '🇧🇷', MX: '🇲🇽',
};

const LocationsSection = ({ locations = {} }) => {
  const [activeTab, setActiveTab] = useState('countries');

  const tabs = ['countries', 'regions', 'cities'];
  const currentData = locations[activeTab] || [];
  const maxViews = currentData.length > 0 ? Math.max(...currentData.map(l => l.views)) : 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Locations</h3>
          <HiOutlineInformationCircle className="w-4 h-4 text-gray-400" />
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-all ${
                activeTab === tab
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Map placeholder */}
      <WorldMapPlaceholder />

      {/* Column headers */}
      <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 mb-2 px-1">
        <span>Top {activeTab}</span>
        <span>Views</span>
      </div>

      {/* List */}
      <div className="space-y-0">
        {currentData.length === 0 ? (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
            No location data available
          </div>
        ) : (
          currentData.map((loc, i) => (
            <div
              key={i}
              className="group flex items-center justify-between py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 -mx-2 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {loc.code && (
                  <span className="text-lg" title={loc.name}>
                    {flagEmojis[loc.code] || '🌍'}
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-700 dark:text-gray-300 truncate block">
                    {loc.name}
                  </span>
                  <div className="mt-1 w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="h-1.5 bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${(loc.views / maxViews) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-4 shrink-0">
                {loc.views.toLocaleString()}
              </span>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
};

export default LocationsSection;
