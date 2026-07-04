import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineSupport,
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import SEO from '../../components/seo/SEO';

// The order-tracking journey, from checkout to doorstep. Step 2 is where the
// Shiprocket webhook kicks in: the AWB lands in the customer's inbox and
// order dashboard automatically the moment the shipment is created.
const TRACKING_STEPS = [
  {
    Icon: HiOutlineShoppingBag,
    title: 'Order placed',
    text: 'You receive an order confirmation email with your Order ID (e.g. GPS-XYZ123). It is also listed in your account dashboard.',
  },
  {
    Icon: HiOutlineCube,
    title: 'Shipment created — AWB assigned',
    text: 'As soon as our courier partner Shiprocket generates your shipment, an AWB tracking number is assigned. We email it to you instantly, and it appears on your order in the dashboard automatically.',
  },
  {
    Icon: HiOutlineTruck,
    title: 'On the move',
    text: 'Once the courier picks up your package you get a "shipped" email. Every scan updates the live tracking timeline — check it anytime with your Order ID below.',
  },
  {
    Icon: HiOutlineHome,
    title: 'Delivered',
    text: 'A final confirmation email lands when your order reaches your doorstep. Anything wrong? Returns are just a message away.',
  },
];

const HELP_LINKS = [
  { to: '/shipping-policy', label: 'Shipping Policy', blurb: 'Delivery timelines and charges' },
  { to: '/returns-refunds', label: 'Returns & Refunds', blurb: 'How to return or replace an item' },
  { to: '/faq', label: 'FAQ', blurb: 'Answers to common questions' },
  { to: '/contact', label: 'Contact Us', blurb: 'Talk to a real human' },
];

const Support = () => {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [contact, setContact] = useState('');

  const handleTrack = (e) => {
    e.preventDefault();
    const cleanOrderId = orderId.trim();
    const cleanContact = contact.trim();
    if (!cleanOrderId || !cleanContact) {
      toast.error('Please enter both Order ID and Email/Phone');
      return;
    }
    // UX-only format check — real verification happens server-side.
    const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanContact);
    const looksLikePhone = /^\+?[0-9][0-9\s-]{5,14}$/.test(cleanContact);
    if (!looksLikeEmail && !looksLikePhone) {
      toast.error('Please enter a valid email address or phone number');
      return;
    }
    // Contact (email/phone) travels via router state, not the query string —
    // keeps PII out of browser history, logs, and Referer headers.
    navigate('/track-order', { state: { orderId: cleanOrderId, contact: cleanContact } });
  };

  return (
    <div className="min-h-screen bg-primary text-secondary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24">
      <SEO
        title="Support & Order Tracking | GPSFDK"
        description="Track your GPSFDK order with the AWB number sent to your email, browse shipping and returns policies, or reach our support team."
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* ─── Hero ─── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="w-14 h-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center mx-auto mb-5">
            <HiOutlineSupport className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 sm:mb-6 tracking-wide leading-tight">
            Support
          </h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-secondary/70 max-w-2xl mx-auto">
            Track your order, understand how delivery works, or get in touch — all in one place.
          </p>
        </motion.div>

        {/* ─── Track your order ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-secondary/5 rounded-2xl sm:rounded-3xl border border-secondary/10 shadow-lg p-6 sm:p-10 mb-12 sm:mb-16"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="md:w-2/5">
              <h2 className="text-2xl sm:text-3xl font-heading font-bold">Track your order</h2>
              <p className="text-secondary/70 mt-3 text-sm sm:text-base leading-relaxed">
                Use the Order ID from your confirmation email along with the email or phone number
                you used at checkout. Once your shipment is created, your AWB tracking number and
                live courier updates appear here too.
              </p>
            </div>
            <form onSubmit={handleTrack} className="md:w-3/5 flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="support-order-id" className="block text-sm font-medium text-secondary/80 mb-1">
                  Order ID
                </label>
                <input
                  id="support-order-id"
                  type="text"
                  placeholder="e.g. GPS-XYZ123"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="w-full bg-primary/60 border border-secondary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              <div className="flex-1">
                <label htmlFor="support-contact" className="block text-sm font-medium text-secondary/80 mb-1">
                  Email or Phone
                </label>
                <input
                  id="support-contact"
                  type="text"
                  placeholder="Used during checkout"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  className="w-full bg-primary/60 border border-secondary/20 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
                  required
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full sm:w-auto h-[50px] bg-accent hover:bg-accent/90 text-white font-medium rounded-xl px-8 flex items-center justify-center gap-2 transition-all"
                >
                  <HiOutlineSearch className="w-5 h-5" /> Track
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* ─── How order tracking works ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-16"
        >
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8 sm:mb-12">
            How order tracking works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {TRACKING_STEPS.map((step, i) => (
              <div
                key={step.title}
                className="relative bg-primary/50 rounded-2xl sm:rounded-3xl border border-secondary/10 hover:border-accent/30 transition-colors p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-8 rounded-full bg-accent/15 text-accent text-sm font-bold flex items-center justify-center shrink-0">
                    {i + 1}
                  </span>
                  <step.Icon className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-secondary/70 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-secondary/60 text-sm mt-6 max-w-2xl mx-auto">
            Signed in when you ordered? Your AWB tracking number is also shown on each order in{' '}
            <Link to="/dashboard" className="text-accent font-semibold hover:underline">
              your dashboard
            </Link>{' '}
            as soon as it&apos;s assigned.
          </p>
        </motion.div>

        {/* ─── More help ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8 sm:mb-10">
            Need something else?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {HELP_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group bg-secondary/5 rounded-2xl border border-secondary/10 hover:border-accent/40 p-6 transition-colors"
              >
                <h3 className="font-heading font-bold text-lg flex items-center justify-between">
                  {link.label}
                  <HiOutlineArrowRight className="w-4 h-4 text-accent opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all" />
                </h3>
                <p className="text-secondary/60 text-sm mt-1.5">{link.blurb}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
