import axios from 'axios';

let baseURL = import.meta.env.VITE_API_URL || 'https://gpsfdkrefresh.onrender.com/api';
// Remove trailing slash if it exists
if (baseURL.endsWith('/')) {
  baseURL = baseURL.slice(0, -1);
}
// Ensure it ends with /api
if (!baseURL.endsWith('/api')) {
  baseURL += '/api';
}

const API = axios.create({
  baseURL,
  timeout: 30000, // 30s default timeout
});

// Increase timeout for file upload requests (multipart/form-data)
API.interceptors.request.use((config) => {
  // If body is FormData, it's likely a file upload — give it more time
  if (config.data instanceof FormData) {
    config.timeout = 120000; // 120s for uploads
  }
  return config;
});

API.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user?.token) {
    config.headers.Authorization = `Bearer ${user.token}`;
  }
  return config;
});

// Endpoints that should NEVER trigger an auto-logout when they 401.
// These are fire-and-forget / background calls — failure must not interrupt the user.
const SILENT_401_PATHS = [
  '/analytics/',
  '/abandoned-carts',
  '/auth/me',
];

// Pages where a 401 should soft-redirect the user to /login.
// On public pages we just clear the stale session — no redirect, no reload.
const PROTECTED_ROUTE_PREFIXES = ['/admin', '/marketing', '/dashboard', '/checkout', '/thank-you'];

API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isSilent =
        error.config?.silent === true ||
        SILENT_401_PATHS.some((p) => url.includes(p));

      // Only react if the user actually had a stored session — guests browsing
      // public pages must never get bounced just because an optional call 401'd.
      const stored = localStorage.getItem('user');
      if (stored && !isSilent) {
        localStorage.removeItem('user');
        // Notify the app (AuthContext listens) — avoids a hard window.location reload
        // that wipes in-flight state and forces the user to re-enter everything.
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));

        const onProtectedPage = PROTECTED_ROUTE_PREFIXES.some((p) =>
          window.location.pathname.startsWith(p)
        );
        if (onProtectedPage) {
          // Soft redirect via replace — preserves history sanity
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;
