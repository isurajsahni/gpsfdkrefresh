import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
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
import { Eyebrow, KindButton, KindHero, KindSectionHead } from '../../components/kindact/KindUI';
import heroImage from '../../assets/image/wallcanvas_poster_1.webp';

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
    `w-full bg-white text-kind-ink placeholder-kind-ink/40 border ${
      errors[field] ? 'border-red-400' : 'border-transparent'
    } rounded-2xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-kind-lime transition-shadow`;

  const labelClasses = 'block text-sm font-medium text-white/90 mb-1.5 pl-2';

  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO
        title="Contact GPSFDK | Custom Canvas & Nameplate Experts India"
        description="Get in touch with GPSFDK for custom canvas prints, house nameplate orders, bulk enquiries and support. Call, WhatsApp or email our team in India."
      />

      {/* ─── Hero ─── */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <KindHero
          image={heroImage}
          crumb="Home / Contact us"
          title={
            <>
              Have a question? We&apos;re just <span className="text-kind-lime">a form away.</span>
            </>
          }
          description="Whether it's a custom canvas idea, a bulk enquiry, or a question about your order — our team is here to help. Drop us a line, call, or message us on WhatsApp."
        >
          <p className="relative mt-7 text-sm sm:text-base text-white/90">
            <a
              href="mailto:support@gpsfdk.com"
              onClick={() => fireContactPixel('Email')}
              className="font-semibold hover:text-kind-lime transition-colors"
            >
              support@gpsfdk.com
            </a>
            <span className="mx-3 text-kind-sage">/</span>
            <a
              href="tel:+916280310103"
              onClick={() => fireContactPixel('Phone')}
              className="font-semibold hover:text-kind-lime transition-colors"
            >
              +91 62803-10103
            </a>
          </p>
        </KindHero>
      </motion.div>

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        {/* ─── Contact channels ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-6 sm:mt-8"
        >
          {CONTACT_CHANNELS.map((channel) => (
            <div
              key={channel.title}
              className="bg-kind-mist rounded-[20px] p-6 flex flex-col gap-3 hover:-translate-y-1 transition-transform duration-300"
            >
              <span className="w-11 h-11 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center">
                <channel.Icon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-heading font-bold text-kind-ink">{channel.title}</h3>
                <p className="text-kind-ink/60 text-sm mt-0.5">{channel.blurb}</p>
                {channel.href ? (
                  <a
                    href={channel.href}
                    {...(channel.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="inline-block mt-2 text-kind-forest font-semibold text-sm hover:underline break-words"
                    onClick={() => channel.pixel && fireContactPixel(channel.pixel)}
                  >
                    {channel.label}
                  </a>
                ) : (
                  <p className="mt-2 text-kind-ink/80 text-sm font-medium">{channel.label}</p>
                )}
              </div>
            </div>
          ))}
        </motion.div>

        {/* ─── Message form (forest panel) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white p-6 sm:p-10 lg:p-14 mt-10 sm:mt-14"
        >
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-20 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>

          <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
            <div className="lg:col-span-2">
              <Eyebrow dark>Get in touch</Eyebrow>
              <h2 className="mt-3 text-2xl sm:text-3xl md:text-4xl font-heading font-bold leading-tight">
                Send us a message
              </h2>
              <p className="mt-4 text-kind-sage text-sm sm:text-base leading-relaxed">
                Tell us about your idea, your wall, or your order. We usually reply within one
                business day.
              </p>
              <p className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-kind-lime">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kind-lime opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-kind-lime" />
                </span>
                We&apos;ll be in touch within 24 hours
              </p>
            </div>

            <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className={labelClasses}>
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
                  {errors.name && <p className="text-red-300 text-xs mt-1.5 pl-2 font-medium">{errors.name}</p>}
                </div>
                <div>
                  <label htmlFor="contact-email" className={labelClasses}>
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
                  {errors.email && <p className="text-red-300 text-xs mt-1.5 pl-2 font-medium">{errors.email}</p>}
                </div>
              </div>
              <div>
                <label htmlFor="contact-phone" className={labelClasses}>
                  Phone <span className="text-white/50 font-normal">(optional)</span>
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
                {errors.phone && <p className="text-red-300 text-xs mt-1.5 pl-2 font-medium">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="contact-message" className={labelClasses}>
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
                {errors.message && <p className="text-red-300 text-xs mt-1.5 pl-2 font-medium">{errors.message}</p>}
              </div>
              <div className="pt-1">
                <KindButton type="submit" variant="lime" disabled={loading} fullWidth>
                  {loading ? 'Sending...' : 'Send Message'}
                </KindButton>
              </div>
            </form>
          </div>
        </motion.div>

        {/* ─── Quick help links ─── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-14 sm:mt-20"
        >
          <KindSectionHead
            eyebrow="Quick help"
            title="Looking for something specific?"
            sub="Skip the inbox — these pages answer the most common questions straight away."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mt-8 sm:mt-10">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="group bg-kind-mist rounded-[20px] p-6 hover:-translate-y-1 transition-transform duration-300"
              >
                <h3 className="font-heading font-bold text-kind-ink flex items-center justify-between gap-2">
                  {link.label}
                  <span className="w-8 h-8 rounded-full bg-kind-forest text-kind-lime flex items-center justify-center shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
                    <HiOutlineArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </h3>
                <p className="text-kind-ink/60 text-sm mt-2">{link.blurb}</p>
              </Link>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
