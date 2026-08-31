import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineViewGrid,
  HiOutlineLightBulb,
  HiOutlinePuzzle,
  HiOutlineEye,
  HiArrowRight,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { formatters } from '../../utils/validation';
import SEO from '../../components/seo/SEO';
import heroConsultation from '../../assets/image/hero section consultation.png';
import approachImage from '../../assets/image/second-image-cosutation.png';

// Alternating chip tones, matching the peach / green rhythm across the row.
const NEEDS = [
  {
    Icon: HiOutlineViewGrid,
    tone: 'peach',
    title: 'Too many choices',
    body: 'Feeling overwhelmed by options and needing help to narrow down the best path.',
  },
  {
    Icon: HiOutlineLightBulb,
    tone: 'green',
    title: 'A good idea without a clear direction',
    body: 'You have a vision but lack the practical steps to bring it to life.',
  },
  {
    Icon: HiOutlinePuzzle,
    tone: 'peach',
    title: 'A space that feels incomplete',
    body: 'Missing that final touch or cohesive element to tie everything together.',
  },
  {
    Icon: HiOutlineEye,
    tone: 'green',
    title: 'A project that needs perspective',
    body: 'Seeking an objective, professional eye to review and refine your plans.',
  },
];

const STEPS = [
  {
    title: 'Listen',
    body: 'We start by understanding your context, your constraints, and what truly matters to you. No assumptions.',
  },
  {
    title: 'Clarify',
    body: 'We distill the complex into the simple, helping you define the core problem or opportunity.',
  },
  {
    title: 'Shape',
    body: 'We outline a tangible path forward, providing recommendations that are actionable and inspiring.',
  },
];

const INTERESTS = [
  'Space Curation',
  'Wall Canvas Selection',
  'Custom House Nameplate',
  'Gifting or Bulk Order',
  'Something Else',
];

const MESSAGE_MIN = 10;

const fieldClasses =
  'w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#1D1D1F] placeholder:text-gray-400 outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent/20';
const labelClasses = 'block text-sm font-semibold text-[#1D1D1F] mb-1.5';

const reveal = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: 'easeOut' },
};

// Small orange four-point sparkle used ahead of the section eyebrow.
const Sparkle = ({ className = '' }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
    <path d="M12 0c.5 6.2 5.8 11.5 12 12-6.2.5-11.5 5.8-12 12-.5-6.2-5.8-11.5-12-12C6.2 11.5 11.5 6.2 12 0z" />
  </svg>
);

const Contact = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    interest: '',
    message: '',
  });
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
      // The Lead model has no `interest` column, so the selection is folded into
      // the message rather than being silently dropped on the way in.
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        message: form.interest ? `Looking for: ${form.interest}\n\n${message}` : message,
      };
      // `phone` is optional server-side, but express-validator only skips the
      // rule when the key is absent — sending '' would fail the format check.
      const phone = formatters.phone(form.phone);
      if (phone) payload.phone = phone;

      await API.post('/leads', payload);

      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', {
          content_name: form.interest || 'Consultancy Enquiry',
          content_category: 'Consultancy',
        });
      }

      toast.success("Thanks — we'll be in touch shortly.");
      setForm({ name: '', email: '', phone: '', interest: '', message: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  // pt-[60px] clears the fixed navbar (see StorePage for the same offset); the
  // hero image then sits directly beneath it, matching the design, and the copy
  // column adds its own vertical breathing room on top of that.
  return (
    <div className="bg-white pt-[60px]">
      <SEO
        title="Consultancy & Personalized Guidance | GPSFDK"
        description="Bring us an idea, a requirement or a problem you're trying to solve. GPSFDK helps you find a clearer direction and shape a solution around what matters to you."
      />

      {/* ─── Hero ─── */}
      <section className="grid lg:grid-cols-2 lg:items-stretch">
        <div className="section-padding flex items-center py-14 sm:py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-xl"
          >
            <span className="inline-flex items-center gap-2 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
              <Sparkle className="w-3 h-3 text-accent shrink-0" />
              Consultancy / Personalized Guidance
            </span>

            <h1 className="mt-5 text-[2.25rem] sm:text-5xl lg:text-[3.4rem] font-heading font-bold text-[#1D1D1F] leading-[1.06] tracking-tight">
              Ideas, Spaces, And Decisions Made Clearer.
            </h1>

            <p className="mt-5 text-base text-gray-600 leading-relaxed max-w-md">
              Bring us an idea, a requirement, or simply a problem you're trying to solve. We help
              you find a clearer direction and shape a solution around what matters to you.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#inquiry"
                className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-dark active:scale-95"
              >
                Start a Consultation
                <HiArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
              <a
                href="#approach"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-7 py-3.5 text-sm font-semibold text-[#1D1D1F] transition-all duration-300 hover:border-gray-400 hover:bg-gray-50 active:scale-95"
              >
                Explore Our Approach
              </a>
            </div>
          </motion.div>
        </div>

        <div className="h-[280px] sm:h-[400px] lg:h-auto lg:min-h-[600px]">
          <img
            src={heroConsultation}
            alt="Two people reviewing and signing project documents during a GPSFDK consultation"
            className="w-full h-full object-cover"
            fetchPriority="high"
            width="712"
            height="684"
          />
        </div>
      </section>

      {/* ─── What we help with ─── */}
      <section className="section-padding section-spacing">
        <motion.div {...reveal} className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-bold text-[#1D1D1F] leading-tight tracking-tight">
            Not sure where to start? That's where we come in.
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-xl mx-auto">
            Sometimes the challenge isn't having an idea. It's knowing what to do with it. We help
            you navigate the ambiguity and find a clear path forward.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {NEEDS.map(({ Icon, tone, title, body }, i) => (
            <motion.article
              {...reveal}
              transition={{ duration: 0.5, delay: i * 0.08, ease: 'easeOut' }}
              key={title}
              className="h-full rounded-2xl border border-gray-200 bg-white p-6 transition-shadow duration-300 hover:shadow-md"
            >
              <span
                className={`flex items-center justify-center w-11 h-11 rounded-full ${
                  tone === 'peach' ? 'bg-accent/10 text-accent' : 'bg-secondary/10 text-secondary'
                }`}
              >
                <Icon className="w-5 h-5" />
              </span>
              <h3 className="mt-5 text-base font-heading font-bold text-[#1D1D1F] leading-snug">
                {title}
              </h3>
              <p className="mt-2.5 text-sm text-gray-600 leading-relaxed">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>

      {/* ─── Approach ─── */}
      <section id="approach" className="section-padding pb-16 md:pb-24 scroll-mt-24">
        <div className="max-w-6xl mx-auto grid gap-10 lg:gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div {...reveal}>
            <img
              src={approachImage}
              alt="A team mapping out ideas on sticky notes during a planning session"
              className="w-full h-[280px] sm:h-[380px] lg:h-[430px] object-cover rounded-2xl"
              loading="lazy"
              width="583"
              height="571"
            />
          </motion.div>

          <motion.div {...reveal}>
            <h2 className="text-3xl sm:text-4xl lg:text-[2.5rem] font-heading font-bold text-[#1D1D1F] leading-tight tracking-tight">
              You bring the idea. We help shape the direction.
            </h2>

            <ol className="mt-8 space-y-7">
              {STEPS.map(({ title, body }, i) => (
                <li key={title} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="flex items-center justify-center w-8 h-8 shrink-0 rounded-full bg-accent text-white text-sm font-bold"
                  >
                    {i + 1}
                  </span>
                  <div>
                    <h3 className="text-lg font-heading font-bold text-[#1D1D1F]">{title}</h3>
                    <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      </section>

      {/* ─── Inquiry ─── */}
      <section id="inquiry" className="section-padding section-spacing bg-primary scroll-mt-24">
        <motion.div {...reveal} className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-heading font-bold text-[#1D1D1F] leading-tight tracking-tight">
            Have an idea? Let's talk.
          </h2>
          <p className="mt-4 text-base text-gray-600 leading-relaxed">
            Reach out to start a conversation. We'll get back to you to schedule an initial
            consultation.
          </p>
        </motion.div>

        <motion.div
          {...reveal}
          className="mt-10 max-w-2xl mx-auto rounded-2xl bg-white p-6 sm:p-8 shadow-sm"
        >
          <form onSubmit={handleSubmit} noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className={labelClasses}>
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  autoComplete="name"
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Your full name"
                  className={fieldClasses}
                />
              </div>

              <div>
                <label htmlFor="email" className={labelClasses}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  placeholder="your@email.com"
                  className={fieldClasses}
                />
              </div>

              <div>
                <label htmlFor="phone" className={labelClasses}>
                  Phone <span className="font-normal text-gray-400">(Optional)</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={form.phone}
                  // Formatted on the way in so the value always matches the
                  // digits-and-plus format the API accepts.
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, phone: formatters.phone(e.target.value) }))
                  }
                  placeholder="+91 62803 10103"
                  className={fieldClasses}
                />
              </div>

              <div>
                <label htmlFor="interest" className={labelClasses}>
                  What are you looking for?
                </label>
                <select
                  id="interest"
                  value={form.interest}
                  onChange={update('interest')}
                  className={`${fieldClasses} ${form.interest ? '' : 'text-gray-400'}`}
                >
                  <option value="">Select an option</option>
                  {INTERESTS.map((option) => (
                    <option key={option} value={option} className="text-[#1D1D1F]">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="message" className={labelClasses}>
                  Tell us more
                </label>
                <textarea
                  id="message"
                  required
                  rows={4}
                  minLength={MESSAGE_MIN}
                  maxLength={2000}
                  value={form.message}
                  onChange={update('message')}
                  placeholder="Briefly describe your idea or challenge..."
                  className={`${fieldClasses} resize-y min-h-[110px]`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-accent py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:bg-accent-dark active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? 'Sending…' : 'Submit Inquiry'}
            </button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Contact;
