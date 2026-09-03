import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiOutlineMail, HiOutlinePhone, HiOutlineArrowRight } from 'react-icons/hi';
import { FaWhatsapp, FaInstagram } from 'react-icons/fa';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { formatters } from '../../utils/validation';
import { CONTACT, fireContactPixel } from '../../utils/contactChannels';
import SEO from '../../components/seo/SEO';
import { Eyebrow, KindButton, KindHero, KindSectionHead } from '../../components/kindact/KindUI';

// General contact, deliberately separate from /consultancy. That page is a
// services pitch with its own enquiry funnel; this one exists for people who
// just want to reach a human — order problems, questions, careers, press.
const CHANNELS = [
  {
    Icon: HiOutlineMail,
    method: 'Email',
    label: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    blurb: 'Best for anything that needs a screenshot, a file or an order number.',
  },
  {
    Icon: HiOutlinePhone,
    method: 'Phone',
    label: CONTACT.phoneDisplay,
    href: `tel:${CONTACT.phoneDial}`,
    blurb: "Call if it's urgent, or simply easier to explain out loud.",
  },
  {
    Icon: FaWhatsapp,
    method: 'WhatsApp',
    label: 'Chat with us',
    href: CONTACT.whatsapp,
    external: true,
    blurb: 'Quick questions, order updates, and photos of your space.',
  },
  {
    Icon: FaInstagram,
    method: 'Instagram',
    label: CONTACT.instagramHandle,
    href: CONTACT.instagram,
    external: true,
    blurb: 'See recent work, and message us there if you prefer.',
  },
];

// Routed to the pages that answer these faster than we can by email.
const SELF_SERVE = [
  { to: '/track-order', label: 'Track an order', blurb: 'Live status with your Order ID' },
  { to: '/faq', label: 'FAQ', blurb: 'Answers to common questions' },
  { to: '/shipping-policy', label: 'Shipping & Delivery', blurb: 'Timelines and charges' },
  { to: '/returns-refunds', label: 'Returns & Refunds', blurb: 'How to return or replace' },
];

// The Lead model has no subject column, so the selection is folded into the
// message body rather than being silently dropped — same approach the
// consultancy form takes with its `interest` field.
const SUBJECTS = [
  'Order or delivery',
  'Product question',
  'Bulk or corporate order',
  'Careers',
  'Press or collaboration',
  'Something else',
];

const MESSAGE_MIN = 10;

const fieldClasses =
  'w-full rounded-2xl border border-kind-forest/15 bg-white px-4 py-3 text-sm text-kind-ink placeholder:text-kind-ink/35 outline-none transition-colors focus:border-kind-forest/40 focus:ring-2 focus:ring-kind-lime/40';
const labelClasses = 'block text-sm font-semibold text-kind-ink mb-1.5';

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
};

const ContactUs = () => {
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [loading, setLoading] = useState(false);

  const update = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    const message = form.message.trim();
    if (message.length < MESSAGE_MIN) {
      toast.error(`Please tell us a little more — at least ${MESSAGE_MIN} characters.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.subject ? `Subject: ${form.subject}\n\n${message}` : message,
      };
      // `phone` is optional server-side, but express-validator only skips the
      // rule when the key is absent — sending '' would fail the format check.
      const phone = formatters.phone(form.phone);
      if (phone) payload.phone = phone;

      await API.post('/leads', payload);

      // Categorised separately from the consultancy form so the two funnels
      // stay distinguishable in Events Manager.
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: form.subject || 'General Enquiry',
          content_category: 'Contact',
        });
      }

      toast.success("Thanks — we'll get back to you shortly.");
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Contact Us | GPSFDK"
        description="Get in touch with GPSFDK — email, phone, WhatsApp or Instagram. Questions about an order, a product, bulk enquiries or careers, we'll get back to you."
      />

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          crumb="Home / Contact"
          title={
            <>
              Talk to a <span className="text-kind-lime">real human.</span>
            </>
          }
          description="Questions about an order, a product, a bulk requirement or a role with us — pick whichever way is easiest and we'll come back to you."
        />
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── Direct channels ─── */}
        <motion.div {...reveal} className="mt-14 sm:mt-20">
          <KindSectionHead
            eyebrow="Reach us"
            title="Ways to get in touch"
            sub="All four reach the same team. Email and WhatsApp are usually quickest."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {CHANNELS.map(({ Icon, method, label, href, blurb, external }) => (
              <a
                key={method}
                href={href}
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                onClick={() => fireContactPixel(method)}
                className="group bg-kind-mist rounded-[20px] p-6 flex flex-col gap-4 transition-shadow hover:shadow-md"
              >
                <span className="w-11 h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="apple-body font-heading font-semibold text-kind-ink flex items-center justify-between gap-2">
                    {method}
                    <HiOutlineArrowRight className="w-4 h-4 text-kind-forest/40 group-hover:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="apple-caption text-kind-forest font-semibold mt-1 break-words">{label}</p>
                  <p className="apple-caption text-kind-ink/60 mt-2">{blurb}</p>
                </div>
              </a>
            ))}
          </div>
        </motion.div>

        {/* ─── Message form ─── */}
        <motion.div {...reveal} className="mt-14 sm:mt-20 grid lg:grid-cols-[1fr_1.15fr] gap-8 lg:gap-12 items-start">
          <div>
            <KindSectionHead
              center={false}
              eyebrow="Send a message"
              title="Tell us what you need"
              sub="Fill this in and it lands with the same team that answers the phone. We reply to everything, usually within a working day."
            />
            <div className="mt-8 rounded-[20px] bg-kind-mist p-6">
              <h3 className="apple-body font-heading font-semibold text-kind-ink">
                Looking for guidance on a project?
              </h3>
              <p className="apple-caption text-kind-ink/60 mt-2">
                Space curation, canvas selection or a nameplate you can&apos;t quite picture yet — our
                consultancy page walks through how that works.
              </p>
              <Link
                to="/consultancy"
                className="apple-caption inline-flex items-center gap-1.5 mt-4 font-semibold text-kind-forest hover:underline"
              >
                Explore consultancy
                <HiOutlineArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="rounded-[24px] bg-white border border-kind-forest/10 p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className={labelClasses}>
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your name"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label htmlFor="contact-email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={form.email}
                  onChange={update('email')}
                  placeholder="you@example.com"
                  className={fieldClasses}
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className={labelClasses}>
                  Phone <span className="font-normal text-kind-ink/40">(optional)</span>
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  value={form.phone}
                  onChange={update('phone')}
                  placeholder={CONTACT.phoneDisplay}
                  className={fieldClasses}
                />
              </div>
              <div>
                <label htmlFor="contact-subject" className={labelClasses}>
                  Subject
                </label>
                <select
                  id="contact-subject"
                  value={form.subject}
                  onChange={update('subject')}
                  className={fieldClasses}
                >
                  <option value="">Choose one</option>
                  {SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="contact-message" className={labelClasses}>
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={5}
                minLength={MESSAGE_MIN}
                maxLength={2000}
                value={form.message}
                onChange={update('message')}
                placeholder="Order ID, product, or whatever you'd like to ask — a couple of lines is plenty."
                className={`${fieldClasses} resize-y`}
              />
            </div>

            <div className="mt-6">
              <KindButton type="submit" variant="lime" disabled={loading}>
                {loading ? 'Sending…' : 'Send message'}
              </KindButton>
            </div>
          </form>
        </motion.div>

        {/* ─── Faster than writing in ─── */}
        <motion.div
          {...reveal}
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white p-6 sm:p-10 lg:p-14 mt-14 sm:mt-20"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>
          <div className="relative">
            <div className="text-center flex flex-col items-center">
              <Eyebrow dark>Answer it yourself</Eyebrow>
              <h2 className="apple-headline mt-3 font-heading">Often faster than writing in</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
              {SELF_SERVE.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="group bg-white/5 border border-white/10 rounded-[20px] p-6 hover:bg-white/10 transition-colors"
                >
                  <h3 className="apple-body font-heading font-semibold flex items-center justify-between gap-2">
                    {link.label}
                    <span className="w-8 h-8 rounded-full bg-kind-lime text-kind-ink flex items-center justify-center shrink-0">
                      <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </h3>
                  <p className="apple-caption text-kind-sage mt-2">{link.blurb}</p>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContactUs;
