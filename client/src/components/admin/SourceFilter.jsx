/**
 * The App/Website filter shared by the order and abandoned-cart lists.
 *
 * "App" folds iOS and Android together because that is how the question is
 * usually asked; either platform can still be picked on its own.
 */
const SourceFilter = ({ value, onChange, className = '' }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label="Filter by source"
    className={`px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent ${className}`}
  >
    <option value="all">All sources</option>
    <option value="web">Website</option>
    <option value="app">App (iOS + Android)</option>
    <option value="ios">iOS only</option>
    <option value="android">Android only</option>
  </select>
);

export default SourceFilter;
