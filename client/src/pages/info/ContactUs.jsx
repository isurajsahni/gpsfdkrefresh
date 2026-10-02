import { useState } from 'react';
import { motion } from 'framer-motion';
import { PiEnvelopeSimpleFill, PiPhoneFill, PiMapPinFill, PiHeadset } from 'react-icons/pi';
import toast from 'react-hot-toast';
import API from '../../utils/api';
import { CONTACT, fireContactPixel } from '../../utils/contactChannels';
import SEO from '../../components/seo/SEO';
import FaqSection from '../../components/landing/FaqSection';

/* ───────────────────────────────────────────────────────────────────────────
   General contact page, built from the "Contact page" frame of the Canvas Page
   Figma file (figma.com/design/7gCw9F9RUAYrudmzJtsHWM, node 52:2). It shares
   the FAQ block with the Canvas and Consultancy v2 frames, so it reuses
   <FaqSection> rather than restyling it.

   /consultancy is the services pitch with its own funnel; this page is for
   anyone who just wants to reach a human.
   ─────────────────────────────────────────────────────────────────────────── */

/* The two photos are Figma image fills. They're picked up from
   assets/image/contact/ when present (contact-hero.* and contact-person.*),
   and the page falls back to a plain dark banner and just the glow until
   they're exported there. */
const photos = import.meta.glob('../../assets/image/contact/*.{jpg,jpeg,png,webp}', {
  eager: true,
  import: 'default',
});
const photo = (name) => Object.entries(photos).find(([path]) => path.includes(`/${name}.`))?.[1];
const heroPhoto = photo('contact-hero');
const personPhoto = photo('contact-person');

/* Radhe Radhe GPS PVT. LTD., Faridkot — from the Google Maps share link.
   The keyless `output=embed` URL needs https://www.google.com in the CSP's
   frame-src (vercel.json). */
const MAP_PLACE = 'Radhe Radhe GPS PVT. LTD.';
const MAP_COORDS = '30.6697948,74.753903';
const MAP_EMBED = `https://www.google.com/maps?q=${encodeURIComponent(`${MAP_PLACE} @${MAP_COORDS}`)}&ll=${MAP_COORDS}&z=17&t=k&output=embed`;
const MAP_LINK = 'https://maps.app.goo.gl/5He5NCt7F4NJptYd6';

const INFO = [
  {
    Icon: PiEnvelopeSimpleFill,
    label: 'Email Address',
    value: CONTACT.email,
    href: `mailto:${CONTACT.email}`,
    method: 'Email',
  },
  {
    Icon: PiPhoneFill,
    label: 'Phone Number',
    value: CONTACT.phoneDisplay,
    href: `tel:${CONTACT.phoneDial}`,
    method: 'Phone',
  },
  {
    Icon: PiMapPinFill,
    label: 'Headquarter',
    value: 'Faridkot, Punjab',
    href: MAP_LINK,
    external: true,
    method: 'Map',
  },
];

const FAQS = [
  {
    q: 'How can I get in touch with your team?',
    a: ['You can reach us through the contact details provided above, and', 'our team will get back to you.'],
  },
  {
    q: 'How quickly will I receive a response?',
    a: 'We reply to every message, usually within one working day. For anything urgent, a call or WhatsApp is quickest.',
  },
  {
    q: 'Can I discuss a custom requirement with your team?',
    a: 'Yes. Custom sizes, bulk or corporate orders and nameplates are all welcome — share the details in the form and we’ll take it from there.',
  },
  {
    q: 'Where is GPSFDK located?',
    a: 'Our headquarters is in Faridkot, Punjab. The map above has directions if you’d like to visit.',
  },
  {
    q: 'What information should I share when contacting you?',
    a: 'Your order ID if it’s about an order, the product you’re asking about, and a photo of your space if it helps explain what you need.',
  },
];

const MESSAGE_MIN = 10;
const EMPTY_FORM = { firstName: '', lastName: '', email: '', message: '' };

const fieldClasses =
  'w-full border border-[#E6E6E6] bg-white px-5 text-[16px] text-black placeholder:text-[#9A9A9A] outline-none transition-colors focus:border-accent/60 focus:ring-2 focus:ring-accent/15';
const labelClasses = 'mb-2 block text-[16px] font-medium leading-[1.19] text-black sm:text-[18px]';

/* The landing pages' fade-up, played once as a block scrolls into view. */
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const inView = {
  initial: 'hidden',
  whileInView: 'show',
  viewport: { once: true, amount: 0.15 },
  variants: fadeUp,
};

/* ── Hero banner ──────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="px-3 sm:px-6">
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="relative flex h-[220px] items-center justify-center overflow-hidden rounded-[20px] bg-[#1f2a24] sm:h-[300px] lg:h-[382px]"
      >
        {heroPhoto && (
          <img
            src={heroPhoto}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            fetchpriority="high"
            decoding="async"
          />
        )}
        <div aria-hidden className="absolute inset-0 bg-black/35" />
        <h1 className="relative text-[40px] font-medium leading-none tracking-[-0.02em] text-white sm:text-[52px] lg:text-[64px]">
          Contact
        </h1>
      </motion.div>
    </section>
  );
}

/* ── Intro + info cards ───────────────────────────────────────────────────── */
function Intro() {
  return (
    <motion.div {...inView} className="relative px-5 pt-12 text-center sm:px-8 lg:pt-[82px]">
      <h2 className="mx-auto max-w-[900px] text-[28px] font-medium leading-[1.19] tracking-[-0.015em] text-black sm:text-[38px] lg:text-[48px]">
        Get in touch let us know how <span className="text-accent">we can help</span>
      </h2>
      <p className="mx-auto mt-4 max-w-[680px] text-[15px] leading-[1.35] text-[#464646] sm:text-[18px]">
        Have a question, need guidance, want to collaborate, or simply want to explore what GPS can do for you?
        Reach out to us and let&rsquo;s figure it out together.
      </p>

      <ul className="mx-auto mt-9 grid max-w-[420px] gap-4 lg:mt-[46px] lg:max-w-[1072px] lg:grid-cols-3 lg:gap-[56px]">
        {INFO.map(({ Icon, label, value, href, external, method }) => (
          <li key={label}>
            <a
              href={href}
              {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              onClick={() => fireContactPixel(method)}
              className="flex h-[72px] items-center gap-4 rounded-[10px] bg-white px-4 text-left shadow-[0_4px_20px_rgba(0,0,0,0.08)] transition-shadow hover:shadow-[0_6px_24px_rgba(0,0,0,0.12)] sm:px-[10px] lg:px-[10px]"
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-white">
                <Icon className="size-6" />
              </span>
              <span className="min-w-0">
                <span className="block text-[14px] leading-[1.2] text-[#6B6B6B] sm:text-[15px]">{label}</span>
                <span className="mt-1 block truncate text-[15px] font-medium leading-[1.2] text-black sm:text-[16px]">
                  {value}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ── Photo + "Chat with live" card + form ─────────────────────────────────── */
function ChatCard() {
  return (
    <a
      href={CONTACT.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => fireContactPixel('WhatsApp')}
      className="block w-[204px] rounded-[10px] bg-accent px-4 pb-6 pt-5 text-center text-white shadow-[0_10px_30px_rgba(241,90,41,0.3)] transition-colors hover:bg-accent-dark"
    >
      <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-white text-accent">
        <PiHeadset className="size-6" />
      </span>
      <span className="mt-3 block text-[18px] font-semibold leading-[1.2]">Chat with live !</span>
      <span className="mt-2 block text-[12px] leading-[1.3] text-white/90">
        Whatever you&rsquo;re working through, you don&rsquo;t have to figure it out alone. Reach out and let&rsquo;s
        explore how we can help.
      </span>
    </a>
  );
}

function ContactForm() {
  const [form, setForm] = useState(EMPTY_FORM);
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
      // The Lead model has a single `name`, so first and last are joined.
      await API.post('/leads', {
        name: [form.firstName, form.lastName].map((s) => s.trim()).filter(Boolean).join(' '),
        email: form.email.trim(),
        message,
      });

      // Categorised separately from the consultancy form so the two funnels
      // stay distinguishable in Events Manager.
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'Lead', { content_name: 'General Enquiry', content_category: 'Contact' });
      }

      toast.success("Thanks — we'll get back to you shortly.");
      setForm(EMPTY_FORM);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <h2 className="text-[26px] font-medium leading-[1.19] text-black sm:text-[32px]">
        <span className="text-accent">Reach</span> &amp; Get In Touch With Us !
      </h2>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 sm:gap-[10px]">
        <div>
          <label htmlFor="contact-first-name" className={labelClasses}>
            Your Name
          </label>
          <input
            id="contact-first-name"
            type="text"
            required
            minLength={2}
            maxLength={30}
            autoComplete="given-name"
            value={form.firstName}
            onChange={update('firstName')}
            placeholder="Your name"
            className={`${fieldClasses} h-12 rounded-full`}
          />
        </div>
        <div>
          <label htmlFor="contact-last-name" className={labelClasses}>
            Last Name
          </label>
          <input
            id="contact-last-name"
            type="text"
            maxLength={19}
            autoComplete="family-name"
            value={form.lastName}
            onChange={update('lastName')}
            placeholder="Your last name"
            className={`${fieldClasses} h-12 rounded-full`}
          />
        </div>
      </div>

      <div className="mt-5">
        <label htmlFor="contact-email" className={labelClasses}>
          Email Address
        </label>
        <input
          id="contact-email"
          type="email"
          required
          autoComplete="email"
          value={form.email}
          onChange={update('email')}
          placeholder="Your email address"
          className={`${fieldClasses} h-12 rounded-full`}
        />
      </div>

      <div className="mt-5">
        <label htmlFor="contact-message" className={labelClasses}>
          Message
        </label>
        <textarea
          id="contact-message"
          required
          rows={7}
          minLength={MESSAGE_MIN}
          maxLength={2000}
          value={form.message}
          onChange={update('message')}
          placeholder="Write Something..."
          className={`${fieldClasses} min-h-[180px] resize-y rounded-[10px] py-4`}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-5 flex h-[44px] w-full items-center justify-center rounded-full bg-accent text-[16px] font-medium text-white transition-colors duration-300 hover:bg-accent-dark disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Submit'}
      </button>
    </form>
  );
}

function ReachUs() {
  return (
    <section className="relative px-5 pt-14 sm:px-8 lg:pt-[290px]">
      <div className="mx-auto grid w-full max-w-[1200px] items-end gap-10 lg:grid-cols-[minmax(0,1fr)_540px] lg:gap-[60px]">
        {/* Photo column. On desktop the cutout rises above the form heading
            and runs down under the map (which paints over it), with the chat
            card over her left arm, as in the frame. Below lg the photo stacks
            under the form with the card overlapping its bottom. */}
        <motion.div {...inView} className="relative order-2 flex flex-col items-center lg:order-1 lg:block lg:self-stretch">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-[4%] size-[360px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(241,90,41,0.35)_0%,rgba(241,90,41,0.12)_45%,rgba(241,90,41,0)_70%)] blur-2xl lg:left-[150px] lg:top-[-150px] lg:size-[520px] lg:translate-x-0"
          />
          {personPhoto && (
            <img
              src={personPhoto}
              alt="A member of the GPSFDK team pointing to the contact form"
              width={849}
              height={861}
              className="relative mx-auto w-full max-w-[420px] lg:absolute lg:left-0 lg:top-[-133px] lg:w-[740px] lg:max-w-none"
              loading="lazy"
              decoding="async"
            />
          )}
          <div className={`relative ${personPhoto ? '-mt-16 lg:mt-0' : 'py-16 lg:py-0'} lg:absolute lg:left-0 lg:top-[122px]`}>
            <ChatCard />
          </div>
        </motion.div>

        <motion.div {...inView} className="order-1 lg:order-2 lg:pb-[43px]">
          <ContactForm />
        </motion.div>
      </div>
    </section>
  );
}

/* ── Map ──────────────────────────────────────────────────────────────────── */
function MapBlock() {
  return (
    <motion.section {...inView} className="relative z-10 px-3 pt-14 sm:px-6 lg:pt-0">
      <div className="relative h-[280px] overflow-hidden rounded-[20px] bg-[#e9e5dc] sm:h-[340px] lg:h-[360px]">
        <iframe
          title={`${MAP_PLACE}, Faridkot on Google Maps`}
          src={MAP_EMBED}
          className="absolute inset-0 h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
    </motion.section>
  );
}

export default function ContactUs() {
  return (
    <main className="overflow-x-clip bg-white pb-20 pt-[72px] lg:pb-[108px]">
      <SEO
        title="Contact Us | GPSFDK"
        description="Get in touch with GPSFDK — email, phone or WhatsApp. Questions about an order, a product, bulk enquiries or a custom requirement, we'll get back to you."
      />

      <Hero />

      {/* Cream wash behind the intro and the top of the form, per the frame. */}
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-6 h-[560px] rounded-[20px] bg-[linear-gradient(180deg,#FFF6EE_0%,#FFFAF6_70%,rgba(255,250,246,0)_100%)] sm:inset-x-6 lg:h-[900px]"
        />
        <Intro />
        <ReachUs />
      </div>

      <MapBlock />

      <FaqSection
        className="mt-16 lg:mt-[60px]"
        headingClassName="text-black"
        heading={
          <>
            <span className="block">Frequently asked</span>
            <span className="block">questions</span>
          </>
        }
        items={FAQS}
      />
    </main>
  );
}
