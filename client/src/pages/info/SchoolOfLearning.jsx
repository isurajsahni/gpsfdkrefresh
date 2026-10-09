import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { HiArrowRight } from 'react-icons/hi';
import SEO from '../../components/seo/SEO';
import StoryRows from '../../components/info/StoryRows';
import FaqSection from '../../components/landing/FaqSection';
import { CONTACT } from '../../utils/contactChannels';
import heroImage from '../../assets/image/figma/sol-hero.jpg';
import discoverImage from '../../assets/image/figma/sol-discover.jpg';
// DEMO photos borrowed from elsewhere on the site until the Figma frame's
// story images are designed; swap these four imports for the real ones.
import demoReading from '../../assets/image/store page/Rectangle 174 (1).webp';
import demoLaptops from '../../assets/image/store page/Rectangle 174 (2).webp';
import demoStudio from '../../assets/image/about_us_demo.webp';
import demoSeminar from '../../assets/image/store page/Rectangle 174.webp';

/* ───────────────────────────────────────────────────────────────────────────
   School of Learning, built from the "School of learning" frame of the gps
   Figma file (figma.com/design/hb5MRVdJB40DeurZ7KoKb5, node 1:4). The frame is
   still being designed — its four story photos are grey placeholders — so
   the rows show demo photos for now.
   ─────────────────────────────────────────────────────────────────────────── */

const ROWS = [
  {
    eyebrow: 'The foundational idea',
    title: 'Why does GPS School of Learning exist?',
    image: demoReading,
    paragraphs: [
      'GPS gives children the freedom to learn what they want, at their own pace. Whether they want to explore one interest or discover many, we provide the space, guidance and opportunities to keep learning — without forcing a fixed path.',
      'Once they understand what technology can do, children can decide where their interest takes them — whether that means going deeper into a skill, building something of their own, or exploring future opportunities through GPS and beyond.',
    ],
    tagline: 'Learn the Basics. Explore the Possibilities. Choose Your Path.',
  },
  {
    eyebrow: 'Current focus',
    title: 'From using a computer to understanding what it can do',
    image: demoLaptops,
    paragraphs: [
      'Many children get access to computers, but access alone does not always mean meaningful digital learning. GPS School of Learning is starting by closing that gap — taking children from computer fundamentals to deeper digital skills, technology and AI.',
      'Once they understand what technology can do, children can decide where their interest takes them — whether that means going deeper into a skill, building something of their own, or exploring future opportunities through GPS and beyond.',
    ],
    tagline: 'Learn the Basics. Explore the Possibilities. Choose Your Path.',
  },
  {
    eyebrow: 'Next phase',
    title: 'From Learning Skills to Exploring Possibilities',
    image: demoStudio,
    paragraphs: [
      'As the foundation grows, GPS plans to expand beyond computer and AI learning into more hands-on experiences, projects and guided exploration in various fields.',
      'The aim is to give children more ways to explore their interests and gradually understand where their skills, ideas and curiosity can take them.',
    ],
    tagline: 'Learn More. Try More. Find What Fits.',
  },
  {
    eyebrow: 'Long-term vision',
    title: 'A Place Where Learning Keeps Evolving',
    image: demoSeminar,
    paragraphs: [
      'Our long-term vision is to build an environment that grows with the child — where interests can change, new skills can emerge, and learning can continue without a fixed path.',
      'From the first question to a skill, an idea or a chosen direction, we want children to have the freedom to keep exploring and shape their own journey.',
    ],
    tagline: 'Discover What’s Yours. Build What’s Next.',
  },
];

/* The frame reuses the Contact page's FAQ questions; the answers are worded
   for a page that has no form or map above them. */
const FAQS = [
  {
    q: 'How can I get in touch with your team?',
    a: `Email us at ${CONTACT.email} or call ${CONTACT.phoneDisplay}, and our team will get back to you.`,
  },
  {
    q: 'How quickly will I receive a response?',
    a: 'We reply to every message, usually within one working day. For anything urgent, a call or WhatsApp is quickest.',
  },
  {
    q: 'Can I discuss a custom requirement with your team?',
    a: 'Yes. Tell us what you have in mind and we’ll take it from there.',
  },
  {
    q: 'Where is GPSFDK located?',
    a: 'Our headquarters is in Faridkot, Punjab.',
  },
  {
    q: 'What information should I share when contacting you?',
    a: 'A little about who you are and what you’re looking for — the more context you share, the faster we can help.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Hero() {
  return (
    <section className="relative flex h-[460px] items-center justify-center overflow-hidden sm:h-[540px] lg:h-[613px]">
      <img src={heroImage} alt="" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
      <div aria-hidden className="absolute inset-0 bg-[rgba(24,107,71,0.16)]" />
      {/* Keeps the black copy legible over the bright sky on narrow crops. */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-white/40 to-transparent lg:hidden" />
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="relative -mt-24 px-5 text-center sm:-mt-32 lg:-mt-[150px]"
      >
        <h1 className="text-[32px] font-semibold leading-[1.15] text-black sm:text-[42px] lg:text-[48px] lg:leading-[50px]">
          Bored? Do Something You Love.
        </h1>
        <p className="mx-auto mt-5 max-w-[548px] text-[15px] text-black sm:text-[16px]">
          A place for children to explore what they love, try what they’ve never tried, and discover where their
          curiosity takes them.
        </p>
        <a
          href="#explore"
          className="mt-6 inline-flex h-[45px] items-center rounded-[60px] bg-accent px-8 text-[16px] font-medium tracking-[-0.045em] text-white transition-colors hover:bg-accent-dark"
        >
          Start Exploring →
        </a>
      </motion.div>
    </section>
  );
}

function Discover() {
  return (
    <motion.section
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      className="mx-auto mt-20 max-w-[1200px] px-5 sm:px-8 lg:mt-[130px] lg:px-0"
    >
      <div className="relative flex min-h-[360px] items-center overflow-hidden lg:h-[432px]">
        <img
          src={discoverImage}
          alt="Children and educators flying kites in an open green field at golden hour"
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-r from-[rgba(23,24,22,0.9)] via-[rgba(23,24,22,0.75)] to-[rgba(23,24,22,0)]"
        />
        <div className="relative px-6 py-12 sm:px-12 lg:px-[97px]">
          <h2 className="text-[30px] font-bold leading-[1.2] tracking-[-0.025em] text-white sm:text-[40px] lg:text-[48px] lg:leading-[60px]">
            What Do You Want to Discover?
          </h2>
          <p className="mt-4 max-w-[573px] text-[16px] leading-[1.6] text-white/80 sm:text-[18px] sm:leading-[28px]">
            Try something you love. Explore something new. Follow your curiosity and see where it takes you.
          </p>
          <Link
            to="/partner"
            className="mt-8 inline-flex h-12 items-center gap-[10px] rounded-[45px] bg-accent px-7 text-[14px] font-semibold tracking-[0.02em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent-dark"
          >
            Be Part of the Journey
            <HiArrowRight className="h-3 w-3" aria-hidden />
          </Link>
        </div>
      </div>
    </motion.section>
  );
}

export default function SchoolOfLearning() {
  return (
    <main className="overflow-x-clip bg-white pb-20 pt-[72px] lg:pb-[124px]">
      <SEO
        title="School of Learning | GPSFDK"
        description="GPS School of Learning gives children the freedom to learn what they want, at their own pace — from computer fundamentals to digital skills, technology and AI."
      />

      <Hero />
      <StoryRows id="explore" rows={ROWS} />
      <Discover />

      <FaqSection
        className="mt-20 lg:mt-[112px]"
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
