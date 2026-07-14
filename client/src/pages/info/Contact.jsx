import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineChatAlt2,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineArrowRight,
} from 'react-icons/hi';
import { FaWhatsapp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { validators, formatters } from '../../utils/validation';
import SEO from '../../components/seo/SEO';

// Helper: fire Meta Pixel Contact event (once per click)
const fireContactPixel = (method) => {
  if (typeof window.fbq === 'function') {
    window.fbq('track', 'Contact', { content_name: method });
    console.log(`[Meta Pixel] Contact event fired (${method})`);
  }
};

const CONTACT_CHANNELS = [
  {
    Icon: HiOutlineMail,
    title: 'Email',
    blurb: 'For orders, bulk enquiries and support',
    label: 'support@gpsfdk.com',
    href: 'mailto:support@gpsfdk.com',
    pixel: 'Email',
  },
  {
    Icon: HiOutlinePhone,
    title: 'Phone',
    blurb: 'Mon–Sat, 10am to 7pm IST',
    label: '+91 62803-10103',
    href: 'tel:+916280310103',
    pixel: 'Phone',
  },
  {
    Icon: FaWhatsapp,
    title: 'WhatsApp',
    blurb: 'Quickest way to reach us',
    label: 'Chat on WhatsApp',
    href: 'https://wa.me/916280310103',
    external: true,
    pixel: 'WhatsApp',
  },
  {
    Icon: HiOutlineLocationMarker,
    title: 'Visit us',
    blurb: 'GPS, Circular Road, Near More Store',
    label: 'Faridkot, Punjab 151203',
  },
];

const QUICK_LINKS = [
  { to: '/support', label: 'Support & Order Tracking', blurb: 'Track your order live with your Order ID' },
  { to: '/faq', label: 'FAQ', blurb: 'Answers to common questions' },
  { to: '/shipping-policy', label: 'Shipping Policy', blurb: 'Delivery timelines and charges' },
  { to: '/returns-refunds', label: 'Returns & Refunds', blurb: 'How to return or replace an item' },
];

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validateField = (field, value) => {
    if (field === 'name') return validators.fullName(value);
    // Phone is optional on the contact form — only validate when provided.
    if (field === 'phone') return value.trim() ? validators.phone(value) : '';
    return validators[field] ? validators[field](value) : '';
  };

  const handleBlur = (field, value) => {
    setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
  };

  const handleChange = (field, value) => {
    let formattedValue = value;
    if (field === 'name') formattedValue = formatters.name(value);
    if (field === 'phone') formattedValue = formatters.phone(value);
    setFormData((prev) => ({ ...prev, [field]: formattedValue }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      message: validateField('message', formData.message),
    };
    if (Object.values(newErrors).some((err) => err !== '')) {
      setErrors(newErrors);
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      // Server-side validation rejects an empty-string phone, so omit it when blank.
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        message: formData.message.trim(),
        ...(formData.phone.trim() ? { phone: formData.phone.trim() } : {}),
      };
      await API.post('/leads', payload);
      toast.success("Message sent! We'll get back to you soon.");
      // Meta Pixel: Lead event on successful contact form submission
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: 'Contact Form',
          content_category: 'Contact Page',
        });
        console.log('[Meta Pixel] Lead event fired (Contact Page)');
      }
      setFormData({ name: '', email: '', phone: '', message: '' });
      setErrors({});
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const inputClasses = (field) =>
    `w-full bg-primary/60 border ${errors[field] ? 'border-red-500' : 'border-secondary/20'} rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors`;

  return (
    <div className="min-h-screen bg-primary text-secondary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24">
      <SEO
        title="Contact GPSFDK | Custom Canvas & Nameplate Experts India"
        description="Get in touch with GPSFDK for custom canvas prints, house nameplate orders, bulk enquiries and support. Call, WhatsApp or email our team in India."
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
            <HiOutlineChatAlt2 className="w-7 h-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-heading font-bold mb-4 sm:mb-6 tracking-wide leading-tight">
            Contact Us
          </h1>
          <div className="w-24 sm:w-32 h-1 sm:h-1.5 bg-accent mx-auto rounded-full shadow-lg shadow-accent/20"></div>
          <p className="mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-secondary/70 max-w-2xl mx-auto">
            Have a question, a custom idea, or just want to say hi? We&apos;d love to hear from you.
          </p>
        </motion.div>

        {/* ─── Channels + form ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10 mb-12 sm:mb-16">
          {/* Contact channels */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5 content-start"
          >
            {CONTACT_CHANNELS.map((channel) => (
              <div
                key={channel.title}
                className="bg-secondary/5 rounded-2xl border border-secondary/10 hover:border-accent/30 transition-colors p-5 flex items-start gap-4"
              >
                <span className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center shrink-0">
                  <channel.Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-heading font-bold">{channel.title}</h3>
                  <p className="text-secondary/60 text-sm mt-0.5">{channel.blurb}</p>
                  {channel.href ? (
                    <a
                      href={channel.href}
                      {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                      className="inline-block mt-1.5 text-accent font-semibold text-sm hover:underline break-words"
                      onClick={() => channel.pixel && fireContactPixel(channel.pixel)}
                    >
                      {channel.label}
                    </a>
                  ) : (
                    <p className="mt-1.5 text-secondary/80 text-sm font-medium">{channel.label}</p>
                  )}
                </div>
              </div>
            ))}
          </motion.div>

          {/* Message form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-3 bg-secondary/5 rounded-2xl sm:rounded-3xl border border-secondary/10 shadow-lg p-6 sm:p-10"
          >
            <h2 className="text-2xl sm:text-3xl font-heading font-bold mb-2">Send us a message</h2>
            <p className="text-secondary/60 text-sm mb-6">
              We usually reply within one business day.
            </p>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-secondary/80 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="contact-name"
                    name="name"
                    autoComplete="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    onBlur={(e) => handleBlur('name', e.target.value)}
                    className={inputClasses('name')}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1 font-medium">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-secondary/80 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={(e) => handleBlur('email', e.target.value)}
                    className={inputClasses('email')}
                    placeholder="your@email.com"
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1 font-medium">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-sm font-medium text-secondary/80 mb-1">
                  Phone <span className="text-secondary/50 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  autoComplete="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={(e) => handleBlur('phone', e.target.value)}
                  className={inputClasses('phone')}
                  placeholder="+91 98765 43210"
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1 font-medium">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="contact-message" className="block text-sm font-medium text-secondary/80 mb-1">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={(e) => handleChange('message', e.target.value)}
                  onBlur={(e) => handleBlur('message', e.target.value)}
                  className={`${inputClasses('message')} resize-none`}
                  placeholder="How can we help?"
                ></textarea>
                {errors.message && <p className="text-red-500 text-xs mt-1 font-medium">{errors.message}</p>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90 text-white font-semibold py-4 rounded-xl transition-all duration-300 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* ─── Quick help links ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl sm:text-3xl font-heading font-bold text-center mb-8 sm:mb-10">
            Looking for something specific?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {QUICK_LINKS.map((link) => (
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

export default Contact;
