import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../../components/seo/SEO';
import FaqSection from '../../components/landing/FaqSection';
import heroImage from '../../assets/image/figma/love-hero.jpg';
import { HiArrowRight } from 'react-icons/hi';
import { PiHandHeart, PiUsersThree } from 'react-icons/pi';
// Layers exported from the Figma frame (rendered at 1x)
import eyebrowDot from '../../assets/image/figma/love/eyebrow-dot.png';
import foundationPhoto from '../../assets/image/figma/love/foundation-photo.png';
import foundationBlob from '../../assets/image/figma/love/foundation-blob.png';
import focusShape from '../../assets/image/figma/love/focus-shape.png';
import focusBlob from '../../assets/image/figma/love/focus-blob.png';
import phaseShape from '../../assets/image/figma/love/phase-shape.png';
import visionBlob from '../../assets/image/figma/love/vision-blob.png';
import visionShape from '../../assets/image/figma/love/vision-shape.png';
import visionOutline from '../../assets/image/figma/love/vision-outline.png';
import iconCare from '../../assets/image/figma/love/icon-care.png';
import iconCircle from '../../assets/image/figma/love/icon-circle.png';
import iconHealth from '../../assets/image/figma/love/icon-health.png';
import glyphNutrition from '../../assets/image/figma/love/glyph-nutrition.png';
import glyphPartnership from '../../assets/image/figma/love/glyph-partnership.png';
import iconReachCircle from '../../assets/image/figma/love/icon-reach-circle.png';
import glyphSupport from '../../assets/image/figma/love/glyph-support.png';
import journeyPhoto from '../../assets/image/figma/love/journey-photo.png';
import mailIcon from '../../assets/image/figma/love/mail-icon.png';

/* ───────────────────────────────────────────────────────────────────────────
   GPS Love, built from the "Love" frame of the gps Figma file
   (figma.com/design/hb5MRVdJB40DeurZ7KoKb5, node 5:4): hero, four story
   sections with their blob artwork, the "Be part of the journey" banner and
   the FAQ. Sizes, colours and gaps are read from the frame's layers at its
   1440px width (120px gutters → the 1200px content column). The grey blobs
   are the frame's own placeholder shapes, shown as designed.

   The artwork is each layer as Figma renders it, rotation included, placed
   by its rendered bounds. Three small icons — the people glyph, the arrow and
   the "Partner With GPS" icon — couldn't be exported (Figma plan limit) and
   use the nearest react-icons glyph until they are.
   ─────────────────────────────────────────────────────────────────────────── */

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

/* The frame's FAQ: the first answer is the frame's own wording; the others
   are collapsed in the design and keep School of Learning's answers. */
const FAQS = [
  {
    q: 'How can I get in touch with your team?',
    a: 'You can reach us through the contact details provided above, and our team will get back to you.',
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

/* An art layer placed by percentages of its section's art box
   [left, top, width, height], so the composition scales with the column. */
function Layer({ src, box }) {
  const [left, top, width, height] = box;
  return (
    <img
      src={src}
      alt=""
      aria-hidden
      className="absolute block max-w-none"
      style={{ left: `${left}%`, top: `${top}%`, width: `${width}%`, height: `${height}%` }}
    />
  );
}

function Eyebrow({ children, color }) {
  return (
    <p className={`flex items-center gap-[5px] text-[16px] font-semibold uppercase leading-[normal] tracking-[0.28px] ${color}`}>
      <img src={eyebrowDot} alt="" aria-hidden className="size-[15px] shrink-0" />
      {children}
    </p>
  );
}

function SectionTitle({ children, className = '' }) {
  return (
    <h2 className={`mt-[9px] text-[24px] font-semibold leading-[1.25] text-black sm:text-[28px] sm:leading-[35px] ${className}`}>
      {children}
    </h2>
  );
}

const BODY = 'text-[16px] leading-[1.6] tracking-[-0.1px] sm:text-[18px] sm:leading-[28px]';

/* An icon circle with its title and line beneath, as in the frame's feature
   rows. `glyph` sits on the plain circle at the frame's offset. */
function Feature({ icon, glyph, title, text, textClass = '' }) {
  return (
    <li className="flex flex-col items-center text-center">
      <span aria-hidden className="relative block size-[50px]">
        <img src={icon} alt="" className="absolute inset-0 block size-full max-w-none" />
        {glyph && (
          <span className="absolute flex items-center justify-center" style={glyph.style}>
            {glyph.src ? <img src={glyph.src} alt="" className="block size-full max-w-none" /> : glyph.icon}
          </span>
        )}
      </span>
      <h3 className="mt-[11px] text-[16px] font-semibold leading-[normal] text-black">{title}</h3>
      <p className={`mt-[6px] text-[14px] leading-[19px] text-[#404040] ${textClass}`}>{text}</p>
    </li>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden lg:h-[479px]">
      {/* The frame mirrors the photo so the children sit on the right. */}
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-[center_57%]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-[rgba(24,107,71,0.27)] to-[rgba(0,0,0,0.35)]" />
      {/* Extra shade on phones, where the copy runs over the children. */}
      <div aria-hidden className="absolute inset-0 bg-black/25 lg:hidden" />
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="relative mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:px-0"
      >
        <p className="flex items-center gap-[10px] pl-[2px] text-[11px] font-bold uppercase leading-[14px] tracking-[0.1em] text-accent">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
          GPS Love
        </p>
        <h1 className="mt-3 text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[44px] lg:mt-2 lg:text-[56px] lg:leading-[64px]">
          Every Child Deserves a Safe Beginning
        </h1>
        <p className="mt-[10px] max-w-[635px] text-[16px] leading-[1.6] tracking-[-0.1px] text-white sm:text-[18px] sm:leading-[28px]">
          For children growing up without consistent parental care, GPS is working to create a beginning filled
          with love, care, safety and opportunity.
        </p>
        <a
          href="#foundation"
          className="mt-8 inline-flex h-12 items-center gap-[10px] rounded-[60px] bg-accent px-7 text-[14px] font-semibold tracking-[0.02em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent-dark"
        >
          See what we’re building
          <HiArrowRight className="size-3" aria-hidden />
        </a>
      </motion.div>
    </section>
  );
}

/* Each story section is a two-column grid on the 1200px column, split where
   the frame starts its second column; art boxes may run past their column
   just as the frame's blobs do. Phones stack them, artwork first. */
const SECTION = 'mx-auto grid max-w-[1200px] items-center gap-10 px-5 sm:px-8 lg:gap-0 lg:px-0';
const ART = 'relative mx-auto w-full max-w-[480px] lg:mx-0 lg:max-w-none';

function Foundation() {
  return (
    <motion.section
      id="foundation"
      {...inView}
      className={`${SECTION} scroll-mt-24 pt-16 lg:grid-cols-[669fr_531fr] lg:pt-[75px]`}
    >
      {/* Art box: the photo blob (497 × 534) and the beige blob behind its
          lower right, 541 × 545.5 in all. */}
      <div className={`${ART} aspect-[541/545.5] lg:order-2 lg:w-[101.88%]`}>
        <Layer src={foundationBlob} box={[66.54, 62.97, 33.46, 37.03]} />
        <Layer src={foundationPhoto} box={[0, 0, 91.87, 97.89]} />
        <span className="sr-only">A young girl smiling up at the sky</span>
      </div>

      <div className="lg:order-1">
        <Eyebrow color="text-[#005231]">The foundation idea</Eyebrow>
        <SectionTitle>When care becomes a responsibility</SectionTitle>
        <p className={`mt-4 max-w-[503px] text-[#404040] ${BODY}`}>
          Our responsibility starts with the basics — care, nutrition, health and support through trusted child-care
          partners. Over time, we want that support to grow with the child.
        </p>
        <ul className="mt-[22px] grid max-w-[484px] grid-cols-[146fr_169fr_169fr] lg:-ml-[3px]">
          <Feature icon={iconCare} title="Everyday care" text="A safe and protective environment" />
          <Feature
            icon={iconCircle}
            glyph={{ src: glyphNutrition, style: { left: 12, top: 11, width: 25, height: 28 } }}
            title="Nutrition"
            text="A safe and protective environment"
          />
          <Feature icon={iconHealth} title="Health" text="Access to essential healthcare" />
        </ul>
      </div>
    </motion.section>
  );
}

function CurrentFocus() {
  return (
    <motion.section {...inView} className={`${SECTION} mt-16 lg:mt-[63px] lg:grid-cols-[716fr_484fr]`}>
      {/* Art box: the grey placeholder (483 × 463) over the green blob,
          546 × 463 in all. */}
      <div className={`${ART} aspect-[546/463] lg:-ml-px lg:w-[76.26%]`}>
        <Layer src={focusBlob} box={[41.21, 4.43, 58.79, 72.79]} />
        <Layer src={focusShape} box={[0, 0, 88.46, 100]} />
      </div>

      <div>
        <Eyebrow color="text-[#0d5e3d]">Current focus</Eyebrow>
        <SectionTitle>Turning responsibility into action</SectionTitle>
        <p className={`mt-[15px] max-w-[486px] text-[#333] ${BODY}`}>
          GPS is committing 10% of its revenue toward supporting the basic needs of children growing up without
          consistent parental care.
        </p>
        <div className="mt-[6px] flex items-center gap-[19px]">
          <p className="text-[80px] font-bold leading-none text-accent sm:text-[110px]">10%</p>
          <p className="text-[16px] font-medium leading-[1.55] tracking-[-0.1px] text-[#0d5e3d] sm:text-[18px] sm:leading-[28px]">
            of our revenue
            <br />
            for their early
            <br />
            care and support.
          </p>
        </div>
        <h3 className="mt-1 text-[20px] font-semibold leading-[35px] text-black">Starting with what matters most</h3>
        <p className={`mt-[2px] max-w-[483px] text-[#333] ${BODY}`}>
          We are beginning by connecting with trusted child-care organisations to help direct that support toward
          care, nutrition, health and everyday needs, creating a stronger foundation for early childhood.
        </p>
      </div>
    </motion.section>
  );
}

function NextPhase() {
  return (
    <motion.section {...inView} className={`${SECTION} mt-16 lg:mt-[110px] lg:grid-cols-[648fr_552fr]`}>
      {/* Art box: one grey placeholder, 549 × 450 */}
      <div className={`${ART} aspect-[549/450] lg:order-2 lg:w-[99.46%]`}>
        <Layer src={phaseShape} box={[0, 0, 100, 100]} />
      </div>

      <div className="lg:order-1">
        <Eyebrow color="text-[#0d5e3d]">Next phase</Eyebrow>
        <SectionTitle>Building a wider circle of care</SectionTitle>
        <p className={`mt-[15px] max-w-[555px] text-[#333] ${BODY}`}>
          As our foundation grows, GPS will build stronger partnerships with trusted child-care organisations,
          professionals and communities to reach more children and strengthen the support around them.
        </p>
        <ul className="mt-[22px] grid max-w-[520px] grid-cols-[146fr_205fr_169fr] lg:-ml-[3px]">
          <Feature
            icon={iconCircle}
            glyph={{ src: glyphPartnership, style: { left: 10, top: 15, width: 30, height: 19 } }}
            title={<>Stronger<br />partnership</>}
            text="Working with trusted organisations"
          />
          <Feature
            icon={iconReachCircle}
            glyph={{
              icon: <PiUsersThree className="size-[26px] text-accent" />,
              style: { left: 12, top: 12, width: 26, height: 26 },
            }}
            title="Wide reach"
            text="Support more children and communities"
            textClass="max-w-[129px]"
          />
          <Feature
            icon={iconCircle}
            glyph={{ src: glyphSupport, style: { left: 11, top: 11, width: 28, height: 28 } }}
            title={<>Stronger Support<br />Systems</>}
            text="Involving professionals and local communities"
          />
        </ul>
      </div>
    </motion.section>
  );
}

function LongTermVision() {
  return (
    <motion.section {...inView} className={`${SECTION} mt-16 lg:mt-[101px] lg:grid-cols-[669fr_531fr]`}>
      {/* Art box: the beige blob behind, the grey placeholder and its dark
          outline, 513 × 421. */}
      <div className={`${ART} aspect-[513/421] lg:w-[76.68%]`}>
        <Layer src={visionBlob} box={[0, 1.78, 49.9, 62]} />
        <Layer src={visionShape} box={[16.37, 2.26, 83.43, 94.3]} />
        <Layer src={visionOutline} box={[16.37, 0, 83.63, 100]} />
      </div>

      <div>
        <Eyebrow color="text-[#0d5e3d]">Long term vision</Eyebrow>
        <SectionTitle className="max-w-[498px]">A beginning should never limit what comes next</SectionTitle>
        <div className={`mt-[15px] max-w-[532px] space-y-[15px] text-[#333] ${BODY}`}>
          <p className="max-w-[505px]">
            Our long-term vision is to let support grow with the child — from early care and belonging to learning,
            exploration and opportunities through the wider GPS ecosystem.
          </p>
          <p>
            As children grow, we want the journey to continue through School of Learning and future GPS
            initiatives, giving them more space to discover their interests, build confidence and shape their own
            path.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function Journey() {
  return (
    <motion.section
      {...inView}
      className="relative mx-5 mt-16 flex min-h-[520px] items-center overflow-hidden sm:mx-8 lg:mx-auto lg:mt-[101px] lg:h-[574px] lg:max-w-[1200px]"
    >
      <img
        src={journeyPhoto}
        alt=""
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover object-[37%_53%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(90deg,rgba(23,24,22,0.9)_0%,rgba(23,24,22,0.75)_50%,rgba(23,24,22,0)_100%)]"
      />
      <div className="relative w-full max-w-[672px] px-6 py-12 sm:px-10 lg:ml-[97px] lg:p-0">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-[14px] py-[6px] text-[11px] font-bold uppercase leading-[14px] tracking-[0.55px] text-white backdrop-blur-[6px]">
          <span aria-hidden className="size-2 rounded-full bg-accent" />
          Be part of the journey
        </p>
        <h2 className="mt-6 text-[32px] font-bold leading-[1.25] tracking-[-0.025em] text-white sm:text-[48px] sm:leading-[60px]">
          A Little More Love Can Open a <br className="hidden sm:inline" />
          Lot of Possibilities.
        </h2>
        <p className="mt-[23px] max-w-[660px] text-[16px] leading-[1.625] text-white/80 sm:text-[17px] sm:leading-[27.63px]">
          GPS is building this vision one step at a time — through people, partnerships, opportunities and action.
          Whether you are an educator, mentor, partner organization, or supporter, there is a place for you.
        </p>
        <div className="mt-[31px] flex flex-wrap items-center gap-4">
          <Link
            to="/contact"
            className="inline-flex h-12 items-center gap-[10px] rounded-[45px] bg-accent px-7 text-[14px] font-semibold leading-5 tracking-[0.28px] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent-dark"
          >
            Be Part of the Journey
            <HiArrowRight className="size-3" aria-hidden />
          </Link>
          <Link
            to="/partner"
            className="inline-flex h-12 items-center gap-2 rounded-[45px] bg-white px-6 text-[14px] font-semibold leading-5 tracking-[0.28px] text-[#1a1a18] drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-cream"
          >
            Partner With GPS
            <PiHandHeart className="size-[17px]" aria-hidden />
          </Link>
        </div>
        <p className="mt-6 flex items-start gap-2 text-[13px] leading-[18px] tracking-[0.13px] text-white/60 sm:items-center">
          <img src={mailIcon} alt="" aria-hidden className="mt-1 h-[11px] w-[14px] shrink-0 sm:mt-0" />
          Inquiries answered directly by our founding initiative team within 48 hours.
        </p>
      </div>
    </motion.section>
  );
}

export default function Love() {
  return (
    <main className="overflow-x-clip bg-white pb-20 pt-[60px] lg:pb-[84px]">
      <SEO
        title="GPS Love — Every Child Deserves a Safe Beginning | GPSFDK"
        description="GPS commits 10% of its revenue to the basic needs of children growing up without consistent parental care — care, nutrition, health and a path to opportunity."
      />

      <Hero />
      <Foundation />
      <CurrentFocus />
      <NextPhase />
      <LongTermVision />
      <Journey />

      <FaqSection
        className="mt-20 lg:mt-[98px]"
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
