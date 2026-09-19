import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import SEO from '../components/seo/SEO';
import Lines from '../components/landing/Lines';
import FaqSection from '../components/landing/FaqSection';

import heroCabinLiving from '../assets/image/consultancy/hero-cabin-living.jpg';
import heroReadingNook from '../assets/image/consultancy/hero-reading-nook.jpg';
import heroSofaLiving from '../assets/image/consultancy/hero-sofa-living.jpg';
import materialBoard from '../assets/image/consultancy/material-board.jpg';
import archedLivingRoom from '../assets/image/consultancy/arched-living-room.jpg';
import scopeLivingRoom from '../assets/image/consultancy/scope-living-room.jpg';
import scopeMasterBedroom from '../assets/image/consultancy/scope-master-bedroom.jpg';
import scopeKitchenDining from '../assets/image/consultancy/scope-kitchen-dining.jpg';
import scopeBathSuite from '../assets/image/consultancy/scope-bath-suite.jpg';
import scopeFullResidence from '../assets/image/consultancy/scope-full-residence.jpg';
import ctaOpenPlanLiving from '../assets/image/consultancy/cta-open-plan-living.jpg';

import checkCircleIcon from '../assets/image/consultancy/icons/check-circle.svg';
import quoteIcon from '../assets/image/consultancy/icons/quote.svg';
import focusMaterialsIcon from '../assets/image/consultancy/icons/focus-materials.svg';
import focusSourcingIcon from '../assets/image/consultancy/icons/focus-sourcing.svg';
import focusPaletteIcon from '../assets/image/consultancy/icons/focus-palette.svg';
import focusLayoutIcon from '../assets/image/consultancy/icons/focus-layout.svg';
import focusStylingIcon from '../assets/image/consultancy/icons/focus-styling.svg';
import focusSecondOpinionIcon from '../assets/image/consultancy/icons/focus-second-opinion.svg';
import scopeLivingRoomIcon from '../assets/image/consultancy/icons/scope-living-room.svg';
import scopeBedroomIcon from '../assets/image/consultancy/icons/scope-bedroom.svg';
import scopeKitchenIcon from '../assets/image/consultancy/icons/scope-kitchen.svg';
import scopeBathIcon from '../assets/image/consultancy/icons/scope-bath.svg';
import scopeResidenceIcon from '../assets/image/consultancy/icons/scope-residence.svg';

/* ───────────────────────────────────────────────────────────────────────────
   Consultancy v2 — DEMO ONLY

   Rebuild of the "Consultancy" frame in the Canvas Page Figma file
   (figma.com/design/7gCw9F9RUAYrudmzJtsHWM, node 34:2).

   Not linked from anywhere and marked noindex; the live /consultancy page (and
   its enquiry form) is untouched.

   Every size, colour, radius and gap below is read from the Figma layers via
   the Figma MCP, not estimated. The frame is 1440 wide with a 1200 content
   column (120px gutters). The frame's own nav bar is 50px tall where the site's
   fixed Navbar is 60px, so vertical offsets are measured from the bottom of the
   nav bar rather than the top of the frame.

   Type: SF Pro (the site's global stack) for everything except the italic
   accent words, which are EB Garamond — loaded from Google Fonts on this page
   only. Figma's "leading normal" is written out as 1.19, which is SF Pro's
   ascent + descent.

   Line breaks: macOS browsers apply SF Pro's built-in tracking table, which
   sets 15–20px copy about 5% tighter than Figma renders it (CSS has no switch
   for it). Left alone, that re-wraps paragraphs and changes card heights, so
   from xl up — where the column is the design's exact width — copy breaks
   where the Figma layers break it. Below xl it wraps naturally.

   Photos are the original Figma fills, re-encoded as JPEG at no more than 2x
   their largest display size (18 MB of PNG down to ~2 MB). Icons are the
   Figma SVG exports, unmodified.
   ─────────────────────────────────────────────────────────────────────────── */

const SERIF = "font-['EB_Garamond',Georgia,serif] italic";

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

/* Copy is stored as the Figma layer's lines; <Lines> joins them. */
const PAIN_POINTS = [
  ['Pinterest boards with conflicting aesthetics and non-', 'existent product availability.'],
  ['Uncertainty about whether warm undertones clash with', 'natural stone surfaces.'],
  ['Risk of costly scale mistakes and poor material longevity.'],
];

const FOCUS_AREAS = [
  {
    icon: focusMaterialsIcon,
    label: '01 / Tactility',
    title: 'Materials & Finishes',
    body: ['Choose tactile stones, raw plasters,', 'architectural veneers, and organic', 'textiles that work effortlessly under your', "space's natural light."],
  },
  {
    icon: focusSourcingIcon,
    label: '02 / Procurement',
    title: 'Sourcing & Craft',
    body: ['Discover vetted craftspeople, artisanal', 'lighting ateliers, and independent', 'makers without high retailer markups or', 'compromise on quality.'],
  },
  {
    icon: focusPaletteIcon,
    label: '03 / Palette',
    title: 'Colours & Undertones',
    body: ['Construct subtle chromatic palettes that', 'balance warm neutrals, mineral', 'pigments, and seasonal light exposure', 'across adjoining rooms.'],
  },
  {
    icon: focusLayoutIcon,
    label: '04 / Spatial Flow',
    title: 'Layout & Proportion',
    body: ['Make calculated decisions about', 'circulation, sightlines, ceiling heights,', 'scale of anchor pieces, and natural', 'breathing intervals.'],
  },
  {
    icon: focusStylingIcon,
    label: '05 / Layering',
    title: 'Styling & Art Objects',
    body: ['Harmonize curated canvases, bespoke', 'entryway brass nameplates, soft wool', 'textiles, and statement ambient fixtures.'],
  },
  {
    icon: focusSecondOpinionIcon,
    label: '06 / Consultation',
    title: 'Second Opinion',
    body: ['Have a quote, architectural drawing, or', 'furniture list already? Review every item', 'with our seasoned team before signing', 'deposits.'],
  },
];

const SCOPES = [
  { title: 'Living Room', detail: 'Seating, acoustics & light', image: scopeLivingRoom, icon: scopeLivingRoomIcon },
  { title: 'Master Bedroom', detail: 'Sanctuary & closet flow', image: scopeMasterBedroom, icon: scopeBedroomIcon },
  { title: 'Kitchen & Dining', detail: 'Surfaces & cabinetry', image: scopeKitchenDining, icon: scopeKitchenIcon },
  { title: 'Bath Suite', detail: 'Stone, brass & tile', image: scopeBathSuite, icon: scopeBathIcon },
  { title: 'Full Residence', detail: 'Cohesive spatial vision', image: scopeFullResidence, icon: scopeResidenceIcon },
];

/* The design only writes out the first answer. Answers 2–5 are PLACEHOLDER
   copy that stays generic on purpose — confirm them before this goes live. */
const FAQS = [
  {
    q: 'Is the interior design consultation really free?',
    a: ['Yes, the consultation is offered free of charge to help you get', 'practical guidance for your space.'],
  },
  {
    q: 'What can I ask during the consultation?',
    a: 'Anything about your space — layout, materials, colour, lighting, furniture or art. Bring photos, measurements or a quote you are weighing up and we will talk it through.',
  },
  {
    q: 'Can you help with an existing room or renovation?',
    a: 'Yes. We can help refresh a room you already live in, or guide a renovation from early layout decisions through to final styling.',
  },
  {
    q: 'Can I get advice for a commercial space?',
    a: 'Yes. Tell us how the space is used and who it is for, and we will shape the guidance around it.',
  },
  {
    q: 'What should I prepare before the consultation?',
    a: 'A few photos of the space, rough measurements, and any inspiration you like. A budget range and timeline help us keep suggestions practical.',
  },
];

/* 1200px content column — the frame's 120px gutters at 1440. */
const Shell = ({ className = '', children }) => (
  <div className={`mx-auto w-full max-w-[1200px] ${className}`}>{children}</div>
);

const Eyebrow = ({ className = '', children }) => (
  <p className={`text-[12px] font-semibold uppercase leading-4 tracking-[0.1em] ${className}`}>{children}</p>
);

/* 48px section heading with an EB Garamond accent. Figma sets the 56px line
   height and -0.72px tracking on the single-line headings. */
const SectionHeading = ({ className = '', lead, accent }) => (
  <h2 className={`text-[32px] font-medium leading-[1.1667] tracking-[-0.015em] text-[#353535] sm:text-[40px] lg:text-[48px] ${className}`}>
    {lead} <span className={`${SERIF} font-medium`}>{accent}</span>
  </h2>
);

const PillLink = ({ to, className = '', children }) => (
  <Link
    to={to}
    className={`inline-flex h-[43px] w-[142px] items-center justify-center rounded-[60px] bg-accent text-[16px] font-medium text-white transition-colors duration-300 hover:bg-accent-dark ${className}`}
  >
    {children}
  </Link>
);

/* ── Hero ─────────────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section className="px-5 pt-14 sm:px-8 lg:pt-[88px]">
      <Shell>
        <motion.div initial="hidden" animate="show" variants={fadeUp} className="text-center">
          {/* 36px is the largest size that keeps "Transforming spaces" on one
              line in a 375px phone's 335px column. */}
          <h1 className="mx-auto max-w-[588px] text-[36px] font-medium leading-[1.08] tracking-[-0.025em] text-[#353535] sm:text-[52px] lg:text-[64px]">
            <span className="block">Transforming spaces</span>
            <span className={`block ${SERIF} font-medium`}>Elevating your lifestyle</span>
          </h1>

          <p className="mx-auto mt-7 max-w-[578px] text-[16px] leading-[1.19] text-[#464646] sm:text-[18px] lg:mt-[41px]">
            <Lines
              lines={[
                'Expert guidance on design, materials, and thoughtful details to',
                'create spaces that feel as beautiful as they are uniquely yours.',
              ]}
            />
          </p>

          <div className="mt-8 flex items-center justify-center gap-4 sm:gap-[30px] lg:mt-[46px]">
            <PillLink to="/contact">Contact us</PillLink>
            <a
              href="#areas-of-focus"
              className="inline-flex h-[43px] w-[138px] items-center justify-center rounded-[60px] border-[0.8px] border-black text-[16px] font-medium text-black transition-colors duration-300 hover:bg-black hover:text-white"
            >
              Learn more
            </a>
          </div>
        </motion.div>

        {/* Three photos centred on one axis: 280 / 618 / 280 with 11px gaps
            fills the 1200 column exactly. Flex basis keeps those proportions
            as the column narrows; phones get the centre photo alone. */}
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ hidden: fadeUp.hidden, show: { ...fadeUp.show, transition: { ...fadeUp.show.transition, delay: 0.12 } } }}
          className="mt-10 flex items-center gap-[11px] lg:mt-[51px]"
        >
          <div className="hidden aspect-[280/400] flex-[280_1_0%] overflow-hidden rounded-[20px] md:block">
            <img src={heroReadingNook} alt="Reading corner with a cane chair and fiddle-leaf fig beside a picture window"
                 className="h-full w-full object-cover" width="842" height="800" />
          </div>
          <div className="aspect-[618/490] flex-[618_1_0%] overflow-hidden rounded-[20px]">
            <img src={heroCabinLiving} alt="Vaulted living and dining room with tall black-framed windows and a wood stove"
                 className="h-full w-full object-cover" width="1536" height="1024" fetchPriority="high" />
          </div>
          <div className="hidden aspect-[280/400] flex-[280_1_0%] overflow-hidden rounded-[20px] md:block">
            <img src={heroSofaLiving} alt="Bright living room with a cream sectional sofa and a round wooden coffee table"
                 className="h-full w-full object-cover" width="878" height="800" />
          </div>
        </motion.div>
      </Shell>
    </section>
  );
}

/* ── Too many ideas ───────────────────────────────────────────────────────── */
function Collage() {
  return (
    <div className="grid gap-[11px] sm:grid-cols-2 sm:gap-x-[11.67px]">
      {/* Left column sits 5px lower than the quote card, as in the frame. */}
      <div className="space-y-[11px] sm:pt-[5px]">
        <div className="aspect-[298/224] overflow-hidden rounded-[20px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <img src={materialBoard} alt="Linen swatches, an oak block and a ceramic vase laid out on a material board"
               className="h-full w-full object-cover" loading="lazy" width="512" height="279" />
        </div>
        <div className="flex flex-col gap-[3.1px] rounded-[20px] bg-white p-4 drop-shadow-[0px_0px_11px_rgba(116,116,116,0.16)]">
          <p className="text-[12px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#06623e]">Material honesty</p>
          <p className="text-[13px] leading-[23.2px] text-[#464646]">
            <Lines lines={['Balancing raw earth ceramics with oiled', 'European oak and neutral bouclé.']} />
          </p>
        </div>
      </div>

      <div className="space-y-[11.59px]">
        <figure className="rounded-[20px] bg-[#06623e] p-6 shadow-[0px_4px_6px_-1px_rgba(0,0,0,0.1),0px_2px_4px_-2px_rgba(0,0,0,0.1)]">
          <img src={quoteIcon} alt="" aria-hidden="true" className="block" />
          <blockquote className="mt-[15.7px] text-[20px] font-semibold leading-[27.5px] tracking-[-0.005em] text-white">
            <Lines
              lines={[
                '"The challenge isn\'t',
                "having taste-it's",
                'knowing how to bring',
                'disparate elements into',
                'one cohesive living',
                'environment."',
              ]}
            />
          </blockquote>
          <figcaption className="mt-[16.45px] text-[12px] uppercase leading-4 tracking-[0.05em] text-[#62ffbb]">
            GPSFDK Design Philosophy
          </figcaption>
        </figure>
        <div className="aspect-[298/176] overflow-hidden rounded-[20px] shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]">
          <img src={archedLivingRoom} alt="Sunlit living room with an arched steel window and a low wooden table"
               className="h-full w-full object-cover" loading="lazy" width="512" height="279" />
        </div>
      </div>
    </div>
  );
}

function TooManyIdeas() {
  return (
    <section className="mt-20 px-5 sm:px-8 lg:mt-[115px]">
      <Shell className="grid gap-12 lg:grid-cols-[minmax(0,534fr)_minmax(0,608fr)] lg:items-center lg:gap-[58px]">
        {/* Vertically centred against the collage, which is how the frame
            places it (32px in from the collage's top and bottom). */}
        <motion.div {...inView}>
          <h2 className="text-[32px] font-medium leading-[1.1667] tracking-[-0.025em] text-[#353535] sm:text-[40px] lg:text-[48px]">
            <span className="block">Too many ideas one space</span>
            <span className={`block ${SERIF} font-normal`}>Where do you start?</span>
          </h2>

          <p className="mt-[22px] max-w-[483px] text-[16px] leading-[1.65] text-[#464646] sm:text-[18px]">
            <Lines
              lines={[
                'From choosing the right tactile materials to',
                'coordinating timeless lighting and bespoke furniture,',
                'interior choices quickly spiral into choice paralysis.',
              ]}
            />
          </p>

          <ul className="mt-[22px] space-y-3">
            {PAIN_POINTS.map((point) => (
              <li key={point[0]} className="flex items-start gap-3">
                <img src={checkCircleIcon} alt="" aria-hidden="true" className="mt-[5px] shrink-0" />
                <span className="max-w-[410px] text-[15px] leading-[26.4px] text-[#464646]">
                  <Lines lines={point} />
                </span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div {...inView}>
          <Collage />
        </motion.div>
      </Shell>
    </section>
  );
}

/* ── What can we help you figure out? ─────────────────────────────────────── */
function FocusAreas() {
  return (
    <section id="areas-of-focus" className="mt-20 scroll-mt-24 px-5 sm:px-8 lg:mt-[120px]">
      <Shell>
        <motion.div {...inView} className="text-center">
          <Eyebrow className="text-[#06623e]">Areas of focus</Eyebrow>
          {/* The frame puts two EB Garamond spaces before "figure out?", a
              visibly wider gap than the one before "designing?". */}
          <SectionHeading className="mt-[13px]" lead="What can we help you" accent={' figure out?'} />
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-[39px] lg:grid-cols-3"
        >
          {FOCUS_AREAS.map(({ icon, label, title, body }) => (
            <motion.li
              key={title}
              variants={fadeUp}
              className="rounded-[15px] border border-[#ddd] bg-white px-6 pb-10 pt-[41px] drop-shadow-[0px_0px_7.5px_rgba(0,0,0,0.08)] sm:px-[39px]"
            >
              <span className="flex size-12 items-center justify-center rounded-[4px] bg-[#fff9f6]">
                <img src={icon} alt="" aria-hidden="true" />
              </span>
              <p className="mt-[21.5px] text-[12px] font-semibold uppercase leading-4 tracking-[0.12em] text-[#186b47]">
                {label}
              </p>
              <h3 className="mt-[9px] text-[20px] font-medium leading-7 tracking-[-0.005em] text-[#1c1b1b]">{title}</h3>
              <p className="mt-[7px] text-[15px] leading-[26.4px] text-[#464646]">
                <Lines lines={body} />
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </Shell>
    </section>
  );
}

/* ── What are you designing? ──────────────────────────────────────────────── */
function ScopeSelector() {
  return (
    <section className="mt-20 px-5 sm:px-8 lg:mt-[116px]">
      <Shell>
        <motion.div {...inView}>
          <Eyebrow className="text-[#186b47]">Scope selector</Eyebrow>
          <SectionHeading className="mt-[13px]" lead="What are you" accent="designing?" />
        </motion.div>

        <motion.ul
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ show: { transition: { staggerChildren: 0.06 } } }}
          className="mt-8 grid grid-cols-2 gap-[15px] sm:grid-cols-3 lg:mt-[34px] lg:grid-cols-5"
        >
          {SCOPES.map(({ title, detail, image, icon }) => (
            <motion.li key={title} variants={fadeUp}>
              <Link
                to="/contact"
                className="group relative block aspect-[228/300] overflow-hidden rounded-[30px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                <img src={image} alt="" loading="lazy"
                     className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                {/* Frosted label: 208x65 inset 10px from the card's sides and
                    bottom, icon at 10/13 and copy at 41px inside it (22px
                    icon slot + 9px gap). On narrow phone columns the copy
                    wraps further, so the label grows upward instead of
                    clipping at 65px. */}
                <span className="absolute inset-x-[10px] bottom-[10px] flex min-h-[65px] items-start gap-[9px] rounded-[20px] bg-[rgba(217,217,217,0.1)] pb-2 pl-[10px] pr-2 pt-1 backdrop-blur-[1.95px]">
                  <span className="mt-[9px] flex w-[22px] shrink-0">
                    <img src={icon} alt="" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 text-[12px] text-white">
                    <span className="block font-semibold leading-5">{title}</span>
                    <span className="block max-w-[121px] leading-[1.19]">{detail}</span>
                  </span>
                </span>
              </Link>
            </motion.li>
          ))}
        </motion.ul>
      </Shell>
    </section>
  );
}

/* ── Closing CTA ──────────────────────────────────────────────────────────── */
function ClosingCta() {
  return (
    // Bottom padding, not margin: a margin would collapse out of <main> and
    // show the body's cream behind the gap above the footer.
    <section className="mt-20 px-5 pb-20 sm:px-8 lg:mt-[120px] lg:pb-[100px]">
      <motion.div {...inView}>
        <Shell className="relative isolate overflow-hidden rounded-[30px]">
          <img src={ctaOpenPlanLiving} alt="" aria-hidden="true" loading="lazy"
               className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-black/[0.72]" />

          {/* 90 / 72 top and bottom is the frame's (slightly high) placement
              inside the 335px band. */}
          <div className="flex min-h-[335px] flex-col items-center px-6 pb-14 pt-16 text-center lg:pb-[72px] lg:pt-[90px]">
            <h2 className="text-[28px] font-medium leading-[1.19] text-white sm:text-[36px] lg:text-[48px]">
              Your dream space starts with the <span className="text-accent">right guidance.</span>
            </h2>
            <p className="mt-[13.5px] text-[16px] leading-[1.19] text-white sm:text-[20px]">
              Get personalised interior design guidance, completely free.
            </p>
            <PillLink to="/contact" className="mt-[35px]">Contact us</PillLink>
          </div>
        </Shell>
      </motion.div>
    </section>
  );
}

export default function ConsultancyLandingV2() {
  return (
    <main className="overflow-x-clip bg-white pt-[60px]">
      <SEO
        title="Interior Design Consultancy — Free Personalised Guidance | GPSFDK"
        description="Expert guidance on design, materials, and thoughtful details to create spaces that feel as beautiful as they are uniquely yours. Get personalised interior design guidance, completely free."
        noindex
      />
      {/* EB Garamond is only used here, so it loads with the page instead of
          site-wide. Google Fonts is already allowed by the CSP. */}
      <Helmet>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@1,400;1,500&display=swap"
        />
      </Helmet>

      <Hero />
      <TooManyIdeas />
      <FocusAreas />
      <ScopeSelector />
      <FaqSection
        className="mt-20 lg:mt-[108px]"
        heading={
          <>
            <span className="block">Frequently asked</span>
            <span className={`block ${SERIF} font-medium`}>questions</span>
          </>
        }
        items={FAQS}
      />
      <ClosingCta />
    </main>
  );
}
