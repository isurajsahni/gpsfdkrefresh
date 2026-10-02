import { useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * A bar across the top while the next page loads.
 *
 * React Router changes the URL at once but renders the new page in a
 * transition, keeping the old one on screen until the new page's file has
 * arrived. With nothing else changing, a slow load looks like a dead link and
 * people click again. So: the address bar running ahead of the page React has
 * rendered means a page is on its way. The bar fades in after a moment, so
 * pages that are already loaded open without a flash.
 */

const listeners = new Set();
let watchingHistory = false;

// The router moves through history.pushState/replaceState, which fire no event
const watchHistory = () => {
  if (watchingHistory) return;
  watchingHistory = true;
  for (const method of ['pushState', 'replaceState']) {
    const original = window.history[method];
    window.history[method] = function (...args) {
      const result = original.apply(this, args);
      listeners.forEach((listener) => listener());
      return result;
    };
  }
};

const subscribe = (onChange) => {
  watchHistory();
  listeners.add(onChange);
  window.addEventListener('popstate', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('popstate', onChange);
  };
};

const addressBar = () => window.location.pathname + window.location.search;

const NavigationProgress = () => {
  const address = useSyncExternalStore(subscribe, addressBar);
  const { pathname, search } = useLocation();
  if (address === pathname + search) return null;
  return <div role="progressbar" aria-label="Loading page" className="nav-progress" />;
};

export default NavigationProgress;
