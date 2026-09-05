/**
 * Where a record came from — the website, or one of the apps.
 *
 * Records written before `source` existed have no such field. They are all
 * website records, so an absent value reads as "Website" rather than "Unknown".
 */
const LABELS = {
  web: { text: 'Website', className: 'bg-gray-100 text-gray-600' },
  ios: { text: 'iOS App', className: 'bg-indigo-100 text-indigo-700' },
  android: { text: 'Android App', className: 'bg-emerald-100 text-emerald-700' },
};

const SourceBadge = ({ source }) => {
  const { text, className } = LABELS[source] || LABELS.web;
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${className}`}>{text}</span>;
};

export default SourceBadge;
