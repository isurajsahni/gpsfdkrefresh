// Shown when a page's data couldn't load (timeout, rate limit, server error,
// offline). Deliberately not the 404 page: that one is noindex, and a search
// engine that hits a temporary error must not be told the page doesn't exist.
// Only an API 404 means "not found" (see isNotFound in utils/api.js).
const LoadErrorNotice = ({ onRetry, title = "We couldn't load this just now", className = '' }) => (
  <div role="alert" className={`text-center py-20 px-6 ${className}`}>
    <h3 className="text-2xl font-heading font-semibold text-secondary mb-2">{title}</h3>
    <p className="text-gray-500 text-lg max-w-md mx-auto">Please check your connection and try again.</p>
    <button type="button" onClick={onRetry} className="btn-primary mt-6 inline-block">
      Try again
    </button>
  </div>
);

export default LoadErrorNotice;
