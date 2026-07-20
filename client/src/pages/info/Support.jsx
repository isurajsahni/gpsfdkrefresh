import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineSearch,
  HiOutlineShoppingBag,
  HiOutlineCube,
  HiOutlineTruck,
  HiOutlineHome,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import SEO from '../../components/seo/SEO';
import { Eyebrow, KindButton, KindHero, KindSectionHead } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/faq_demo.webp';

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

  const inputClasses =
    'w-full bg-white text-kind-ink placeholder-kind-ink/40 border border-transparent rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-kind-lime transition-shadow';

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Support & Order Tracking | GPSFDK"
        description="Track your GPSFDK order with the AWB number sent to your email, browse shipping and returns policies, or reach our support team."
      />

      {/* ─── Hero + track form ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / Support"
          title={
            <>
              Help that&apos;s always <span className="text-kind-lime">within reach.</span>
            </>
          }
          description="Track your order, understand how delivery works, or get in touch — all in one place. Use the Order ID from your confirmation email along with the email or phone number you used at checkout."
        >
          <form
            onSubmit={handleTrack}
            className="relative mt-8 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 max-w-2xl"
          >
            <div>
              <label htmlFor="support-order-id" className="sr-only">
                Order ID
              </label>
              <input
                id="support-order-id"
                type="text"
                placeholder="Order ID — e.g. GPS-XYZ123"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label htmlFor="support-contact" className="sr-only">
                Email or Phone
              </label>
              <input
                id="support-contact"
                type="text"
                placeholder="Email or phone used at checkout"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <KindButton type="submit" variant="lime">
              <span className="inline-flex items-center gap-2">
                <HiOutlineSearch className="w-4 h-4" /> Track
              </span>
            </KindButton>
          </form>
        </KindHero>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── How order tracking works ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 sm:mt-20"
        >
          <KindSectionHead
            eyebrow="Our process"
            title="How order tracking works"
            sub="From checkout to your doorstep — every step updates automatically."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {TRACKING_STEPS.map((step, i) => (
              <div key={step.title} className="bg-kind-mist rounded-[20px] p-6 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <span className="w-11 h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center">
                    <step.Icon className="w-5 h-5" />
                  </span>
                  <span className="text-3xl font-heading font-bold text-kind-forest/20">0{i + 1}</span>
                </div>
                <div>
                  <h3 className="font-heading font-bold text-kind-ink mb-1.5">{step.title}</h3>
                  <p className="text-kind-ink/60 text-sm leading-relaxed">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-kind-ink/60 text-sm mt-7 max-w-2xl mx-auto">
            Signed in when you ordered? Your AWB tracking number is also shown on each order in{' '}
            <Link to="/dashboard" className="text-kind-forest font-semibold hover:underline">
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
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white p-6 sm:p-10 lg:p-14 mt-14 sm:mt-20"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>
          <div className="relative">
            <div className="text-center flex flex-col items-center">
              <Eyebrow dark>More help</Eyebrow>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-heading font-bold leading-tight">
                Need something else?
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
              {HELP_LINKS.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-colors"
                >
                  <h3 className="font-heading font-bold flex items-center justify-between gap-2">
                    {link.label}
                    <span className="w-8 h-8 rounded-full bg-kind-lime text-kind-ink flex items-center justify-center shrink-0">
                      <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </h3>
                  <p className="text-kind-sage text-sm mt-2">{link.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Support;
