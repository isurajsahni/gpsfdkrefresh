import { useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { HiOutlineTrendingUp, HiOutlineChartBar } from 'react-icons/hi';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg px-4 py-3">
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: <span className="font-bold">{p.value.toLocaleString()}</span>
        </p>
      ))}
    </div>
  );
};

const ChartSection = ({ data = [], showViews = true, showVisitors = true }) => {
  const [chartType, setChartType] = useState('bar');
  const [viewsVisible, setViewsVisible] = useState(showViews);
  const [visitorsVisible, setVisitorsVisible] = useState(showVisitors);

  const Chart = chartType === 'bar' ? BarChart : LineChart;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100">Views</h3>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Legend toggles */}
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" />
            <input
              type="checkbox"
              checked={viewsVisible}
              onChange={() => setViewsVisible(!viewsVisible)}
              className="sr-only"
            />
            <span className={`text-xs font-medium ${viewsVisible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
              Views
            </span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <span className="w-3 h-3 rounded-sm bg-green-800 inline-block" />
            <input
              type="checkbox"
              checked={visitorsVisible}
              onChange={() => setVisitorsVisible(!visitorsVisible)}
              className="sr-only"
            />
            <span className={`text-xs font-medium ${visitorsVisible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500 line-through'}`}>
              Visitors
            </span>
          </label>

          {/* Separator */}
          <span className="text-gray-300 dark:text-gray-600">|</span>

          {/* Period label */}
          <span className="text-xs text-gray-500 dark:text-gray-400">Days</span>

          {/* Chart type switch */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setChartType('line')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'line' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Line chart"
            >
              <HiOutlineTrendingUp className={`w-4 h-4 ${chartType === 'line' ? 'text-green-600' : 'text-gray-400'}`} />
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`p-1.5 rounded-md transition-all ${chartType === 'bar' ? 'bg-white dark:bg-gray-600 shadow-sm' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}
              title="Bar chart"
            >
              <HiOutlineChartBar className={`w-4 h-4 ${chartType === 'bar' ? 'text-green-600' : 'text-gray-400'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full" style={{ height: 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <Chart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            {chartType === 'bar' ? (
              <>
                {viewsVisible && (
                  <Bar dataKey="views" name="Views" fill="#16a34a" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
                )}
                {visitorsVisible && (
                  <Bar dataKey="visitors" name="Visitors" fill="#14532d" radius={[4, 4, 0, 0]} barSize={20} animationDuration={800} />
                )}
              </>
            ) : (
              <>
                {viewsVisible && (
                  <Line type="monotone" dataKey="views" name="Views" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 4, fill: '#16a34a' }} animationDuration={800} />
                )}
                {visitorsVisible && (
                  <Line type="monotone" dataKey="visitors" name="Visitors" stroke="#14532d" strokeWidth={2.5} dot={{ r: 4, fill: '#14532d' }} animationDuration={800} />
                )}
              </>
            )}
          </Chart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartSection;
