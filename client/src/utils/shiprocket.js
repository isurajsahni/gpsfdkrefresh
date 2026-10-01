import { useEffect, useState } from 'react';
import API from './api';

// Whether the Shiprocket integration is switched on server-side
// (SHIPROCKET_ENABLED). While it's off, the sync controls stay hidden.
export const useShiprocketEnabled = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    API.get('/orders/shiprocket-settings', { silent: true })
      .then(({ data }) => { if (alive) setEnabled(!!data?.enabled); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return enabled;
};
