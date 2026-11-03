import { useState } from 'react';
import { HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import API from '../utils/api';
import SEO from '../components/seo/SEO';

const EVENT_KEY = 'exhibitionSignupEvent';

const readSavedEvent = () => {
  try {
    return localStorage.getItem(EVENT_KEY) || '';
  } catch {
    return '';
  }
};

const inputClass = 'w-full mt-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none text-base text-secondary bg-white transition-all';
const emptyCustomer = { name: '', phone: '', email: '', consent: false };

const ExhibitionSignup = () => {
  const [eventName, setEventName] = useState(readSavedEvent);
  const [customer, setCustomer] = useState(emptyCustomer);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [lastCreated, setLastCreated] = useState(null);
  const [createdCount, setCreatedCount] = useState(0);

  const update = (field, value) => {
    setCustomer(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setLastCreated(null);
    try {
      const { data } = await API.post('/auth/exhibition-signup', { ...customer, eventName });
      setLastCreated({ name: customer.name.trim(), welcomedBy: data.welcomedBy });
      setCreatedCount(count => count + 1);
      setCustomer(emptyCustomer);
      try {
        localStorage.setItem(EVENT_KEY, eventName.trim());
      } catch {
        // Only saves retyping the event name on this device
      }
    } catch (err) {
      const message = err.response?.data?.message || 'Could not create the account. Please try again.';
      setError(message);
      toast.error(message);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-primary pt-[80px] sm:pt-[90px] pb-16 px-4">
      <SEO title="Exhibition sign-up | GPSFDK" noindex />
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-heading font-bold text-secondary">Exhibition sign-up</h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a customer's account. They log in later with an OTP on their own phone.
        </p>

        {lastCreated && (
          <div role="status" className="mt-5 flex items-start gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800">
            <HiOutlineCheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold">Account created for {lastCreated.name}</p>
              <p className="mt-0.5">
                {lastCreated.welcomedBy.length > 0
                  ? `Welcome message sent by ${lastCreated.welcomedBy.join(' and ')}.`
                  : 'No welcome message was sent, so tell them they can log in with this number.'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          <label className="block text-sm font-semibold text-secondary">
            Exhibition name
            <input
              type="text"
              value={eventName}
              onChange={e => { setEventName(e.target.value); setError(''); }}
              maxLength={80}
              required
              placeholder="Delhi Art Expo 2026"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold text-secondary">
            Customer name
            <input
              type="text"
              value={customer.name}
              onChange={e => update('name', e.target.value)}
              maxLength={50}
              required
              autoComplete="off"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold text-secondary">
            WhatsApp number
            <input
              type="tel"
              value={customer.phone}
              onChange={e => update('phone', e.target.value)}
              autoComplete="off"
              placeholder="98765 43210"
              className={inputClass}
            />
          </label>
          <label className="block text-sm font-semibold text-secondary">
            Email
            <input
              type="email"
              value={customer.email}
              onChange={e => update('email', e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
            <span className="block mt-1 text-xs font-normal text-gray-500">Enter a WhatsApp number, an email, or both.</span>
          </label>
          <label className="flex items-start gap-3 text-sm text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={customer.consent}
              onChange={e => update('consent', e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-secondary"
            />
            The customer agreed to this account, and I read their details back to them.
          </label>

          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={submitting || !customer.consent || (!customer.phone.trim() && !customer.email.trim())}
            className="w-full py-3 rounded-xl bg-secondary text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {submitting ? 'Creating…' : 'Create account'}
          </button>
        </form>

        {createdCount > 0 && (
          <p className="mt-4 text-center text-sm text-gray-500">Created on this device so far: {createdCount}</p>
        )}
      </div>
    </div>
  );
};

export default ExhibitionSignup;
