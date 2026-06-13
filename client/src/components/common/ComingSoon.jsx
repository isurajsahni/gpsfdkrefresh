import { motion } from 'framer-motion';
import SEO from '../seo/SEO';
import WebflowButton from '../ui/WebflowButton';

/**
 * Reusable "Coming Soon" brand page.
 * Used by the GPS business-group pillar pages (School of Learning, Love,
 * Partner, Support) that aren't live yet. Each renders an on-brand hero with
 * an animated badge, an icon halo, and a CTA that funnels visitors to the
 * canvas collection in the meantime.
 */
const ComingSoon = ({
  Icon,
  eyebrow = 'GPS Business Group',
  title,
  tagline,
  description,
  seoTitle,
  seoDescription,
  ctaText = 'Explore Our Canvas Collection',
  ctaTo = '/wall-canvas',
}) => {
  return (
    <div className="relative min-h-screen bg-primary pt-[100px] sm:pt-[120px] pb-16 sm:pb-24 text-secondary overflow-hidden">
      <SEO title={seoTitle || `${title} — Coming Soon | GPSFDK`} description={seoDescription || description} />

      {/* Decorative background glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute top-1/2 -right-24 w-72 h-72 sm:w-[28rem] sm:h-[28rem] rounded-full bg-secondary/10 blur-3xl" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 flex flex-col items-center text-center">

        {/* Coming Soon badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2.5 rounded-full bg-secondary/5 border border-secondary/10 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-secondary/80"
        >
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
          </span>
          Coming Soon
        </motion.div>

        {/* Icon halo */}
        {Icon && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative mt-8 sm:mt-10"
          >
            <div className="absolute inset-0 rounded-3xl bg-accent/20 blur-2xl" />
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-secondary/5 border border-secondary/10 flex items-center justify-center shadow-lg">
              <Icon className="w-12 h-12 sm:w-14 sm:h-14 text-accent" />
            </div>
          </motion.div>
        )}

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-8 sm:mt-10 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-accent"
        >
          {eyebrow}
        </motion.p>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-3 text-4xl sm:text-5xl md:text-6xl font-heading font-bold text-secondary tracking-wide leading-tight"
        >
          {title}
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-5 w-24 sm:w-32 h-1 sm:h-1.5 bg-accent rounded-full shadow-lg shadow-accent/20"
        />

        {/* Tagline */}
        {tagline && (
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-6 sm:mt-7 text-lg sm:text-xl md:text-2xl font-heading font-medium text-secondary/90"
          >
            {tagline}
          </motion.p>
        )}

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="mt-4 sm:mt-5 max-w-xl text-base sm:text-lg text-secondary/70 font-body leading-relaxed"
        >
          {description}
        </motion.p>

        {/* CTA → Canvas page */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-9 sm:mt-10"
        >
          <WebflowButton to={ctaTo}>{ctaText}</WebflowButton>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="mt-6 text-sm text-secondary/50 font-body"
        >
          We're crafting something special — explore our handcrafted canvas art in the meantime.
        </motion.p>
      </div>
    </div>
  );
};

export default ComingSoon;
