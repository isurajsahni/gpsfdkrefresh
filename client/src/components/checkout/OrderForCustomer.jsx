import { useEffect, useState } from 'react';
import API from '../../utils/api';
import { contactEmail } from '../../utils/contactEmail';

// Admin-only panel at checkout: put this order on a customer's account instead
// of the admin's own. Locked once the shopper has moved past the shipping step,
// because the address and the price were worked out for the chosen account.
const OrderForCustomer = ({ customer, onChange, locked }) => {
  const [picking, setPicking] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!picking) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      setFailed(false);
      try {
        const params = new URLSearchParams({ paginate: 'true', limit: '20', role: 'user' });
        if (search.trim()) params.set('search', search.trim());
        const { data } = await API.get(`/auth/users?${params.toString()}`, { signal: controller.signal });
        setResults(data.users || []);
      } catch (err) {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        setFailed(true);
      }
      setLoading(false);
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [picking, search]);

  const choose = (next) => {
    onChange(next);
    setPicking(false);
    setSearch('');
  };

  return (
    <section aria-label="Who this order is for" className="mb-6 p-4 rounded-xl border-2 border-dashed border-accent/40 bg-white">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Admin: order for</p>
          <p className="font-semibold text-secondary break-words">{customer ? customer.name : 'Myself'}</p>
          {customer && (
            <p className="text-sm text-gray-500 break-words">
              {[customer.phone, contactEmail(customer.email)].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        {!locked && (
          <div className="flex flex-shrink-0 gap-3 text-sm font-semibold">
            {customer && (
              <button type="button" onClick={() => choose(null)} className="text-gray-500 hover:underline">Myself</button>
            )}
            <button type="button" onClick={() => setPicking(open => !open)} aria-expanded={picking} className="text-accent hover:underline">
              {picking ? 'Close' : customer ? 'Change' : 'Select customer'}
            </button>
          </div>
        )}
      </div>

      {picking && !locked && (
        <div className="mt-3">
          <input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search name, email or phone"
            aria-label="Search customers"
            autoFocus
            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-base text-secondary bg-white"
          />
          <div className="mt-2 max-h-64 overflow-y-auto divide-y divide-gray-100" aria-live="polite">
            {failed && <p className="py-3 text-sm text-red-600">Could not load customers. Please try again.</p>}
            {!failed && !loading && results.length === 0 && <p className="py-3 text-sm text-gray-500">No customers found.</p>}
            {!failed && results.map(result => (
              <button
                key={result._id}
                type="button"
                onClick={() => choose(result)}
                className="w-full text-left py-2.5 px-2 hover:bg-accent/5 transition-colors"
              >
                <span className="block font-medium text-secondary break-words">{result.name}</span>
                <span className="block text-sm text-gray-500 break-words">
                  {[result.phone, contactEmail(result.email)].filter(Boolean).join(' · ') || 'No contact details'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default OrderForCustomer;
