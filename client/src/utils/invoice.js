import { useEffect, useState } from 'react';
import API from './api';

// Whether invoices are switched on server-side (INVOICE_ENABLED). Orders that
// already have an invoice show the button regardless.
export const useInvoicesEnabled = () => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    let alive = true;
    API.get('/orders/invoice-settings', { silent: true })
      .then(({ data }) => { if (alive) setEnabled(!!data?.enabled); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return enabled;
};

// Mirrors canIssueInvoice on the server.
export const canDownloadInvoice = (order, enabled) =>
  Boolean(order.invoiceNumber) || (enabled && !['cancelled', 'payment_pending'].includes(order.status));

// Fetched as a blob (not a plain link) so the auth header goes with it.
export const downloadInvoice = async (order) => {
  const { data } = await API.get(`/orders/${order._id}/invoice`, { responseType: 'blob' });
  const url = URL.createObjectURL(data);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Invoice-${String(order.invoiceNumber || order.orderNumber).replace(/[^A-Za-z0-9-]+/g, '-')}.pdf`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
