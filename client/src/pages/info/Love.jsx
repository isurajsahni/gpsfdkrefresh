import { motion } from 'framer-motion';
import { HiArrowRight } from 'react-icons/hi';
import SEO from '../../components/seo/SEO';
import StoryRows from '../../components/info/StoryRows';
import heroImage from '../../assets/image/figma/love-hero.jpg';
// DEMO: AI-generated stand-ins until the Figma frame's story photos are
// designed; swap these four imports for the real ones.
import storyCare from '../../assets/image/figma/love-care.jpg';
import storyMeals from '../../assets/image/figma/love-meals.jpg';
import storyPartners from '../../assets/image/figma/love-partners.jpg';
import storyFuture from '../../assets/image/figma/love-future.jpg';

/* ───────────────────────────────────────────────────────────────────────────
   GPS Love, built from the "Love" frame of the gps Figma file
   (figma.com/design/hb5MRVdJB40DeurZ7KoKb5, node 1:150). The frame is still
   being designed — its four story photos are grey placeholders — so the
   rows show AI-generated demo photos for now. The story photos take the
   site's 20px corners; the hero stays full-bleed.
   ─────────────────────────────────────────────────────────────────────────── */

const ROWS = [
  {
    eyebrow: 'The foundational idea',
    title: 'When care becomes a responsibility',
    image: storyCare,
    paragraphs: [
      'Every child deserves to grow up with love, care and a sense of belonging. For children who grow up without consistent parental care, the absence of these basics can shape the earliest part of their lives. GPS wants to help create a better beginning — one where a child is cared for, supported and given the chance to simply be a child.',
      'Our responsibility starts with the basics — care, nutrition, health and support through trusted child-care partners. Over time, we want that support to grow with the child.',
    ],
  },
  {
    eyebrow: 'Current work',
    title: 'Turning responsibility into action',
    image: storyMeals,
    paragraphs: [
      'GPS is committing 10% of its revenue toward supporting the basic needs of children growing up without consistent parental care.',
      'We are beginning by connecting with trusted child-care organisations to help direct that support toward care, nutrition, health and everyday needs — creating a stronger foundation for early childhood.',
    ],
  },
  {
    eyebrow: 'Next phase',
    title: 'From care today to opportunity tomorrow',
    image: storyPartners,
    paragraphs: [
      'As our foundation grows, GPS will build stronger partnerships with trusted child-care organisations, professionals and communities to reach more children and strengthen the support around them.',
      'We want that support to continue as children grow — creating a connected path from early care toward learning, exploration and opportunity.',
    ],
  },
  {
    eyebrow: 'Long-term vision',
    title: 'A beginning should never limit what comes next',
    image: storyFuture,
    paragraphs: [
      'Our long-term vision is to let support grow with the child — from early care and belonging to learning, exploration and opportunities through the wider GPS ecosystem.',
      'As children grow, we want the journey to continue through School of Learning and future GPS initiatives, giving them more space to discover their interests, build confidence and shape their own path.',
    ],
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

function Hero() {
  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden lg:h-[479px]">
      {/* The frame mirrors the photo so the children sit on the right. */}
      <img
        src={heroImage}
        alt=""
        fetchPriority="high"
        className="absolute inset-0 h-full w-full -scale-x-100 object-cover object-[center_40%]"
      />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-l from-[rgba(24,107,71,0.2)] to-[rgba(0,0,0,0.49)]" />
      {/* Extra shade on phones, where the copy runs over the children. */}
      <div aria-hidden className="absolute inset-0 bg-black/25 lg:hidden" />
      <motion.div
        initial="hidden"
        animate="show"
        variants={fadeUp}
        className="relative mx-auto w-full max-w-[1200px] px-5 py-14 sm:px-8 lg:px-0"
      >
        <p className="flex items-center gap-[10px] text-[11px] font-bold uppercase leading-[14px] tracking-[0.1em] text-accent">
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
          GPS Love
        </p>
        <h1 className="mt-5 text-[34px] font-semibold leading-[1.15] tracking-[-0.03em] text-white sm:text-[44px] lg:text-[56px] lg:leading-[64px]">
          Every Child Deserves a Safe Beginning
        </h1>
        <p className="mt-5 max-w-[635px] text-[16px] leading-[1.6] tracking-[-0.006em] text-white sm:text-[18px] sm:leading-[28px]">
          For children growing up without consistent parental care, GPS is working to create a beginning filled
          with love, care, safety and opportunity.
        </p>
        <a
          href="#story"
          className="mt-8 inline-flex h-12 items-center gap-[10px] rounded-[60px] bg-accent px-7 text-[14px] font-semibold tracking-[0.02em] text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.05)] transition-colors hover:bg-accent-dark"
        >
          See what we’re building
          <HiArrowRight className="h-3 w-3" aria-hidden />
        </a>
      </motion.div>
    </section>
  );
}

export default function Love() {
  return (
    <main className="overflow-x-clip bg-white pb-24 pt-[60px] lg:pb-[226px]">
      <SEO
        title="GPS Love — Every Child Deserves a Safe Beginning | GPSFDK"
        description="GPS commits 10% of its revenue to the basic needs of children growing up without consistent parental care — care, nutrition, health and a path to opportunity."
      />

      <Hero />
      <StoryRows id="story" rows={ROWS} bodyClass="text-[#333]" />
    </main>
  );
}
