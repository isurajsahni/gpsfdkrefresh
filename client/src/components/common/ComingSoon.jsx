import { motion } from 'framer-motion';
import SEO from '../seo/SEO';
import { Eyebrow, KindButton } from '../kindact/KindUI';

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
  image,
}) => {
  return (
    <div className="min-h-screen bg-kind-paper text-kind-ink pt-[80px] sm:pt-[90px] pb-16 sm:pb-24">
      <SEO title={seoTitle || `${title} — Coming Soon | GPSFDK`} description={seoDescription || description} />

      <div className="max-w-7xl mx-auto px-3 sm:px-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[24px] sm:rounded-[32px] bg-kind-forest text-white px-6 sm:px-10 lg:px-16 py-14 sm:py-20"
        >
          {image && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <img src={image} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-kind-forest/85" />
            </div>
          )}

          {/* Decorative glows */}
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-kind-lime/10 blur-3xl" />
            <div className="absolute -bottom-28 -left-20 w-80 h-80 rounded-full bg-kind-mint/10 blur-3xl" />
          </div>

          <div className="relative flex flex-col items-center text-center">
            {/* Coming Soon badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2.5 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.15em] text-white/90"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-kind-lime opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-kind-lime" />
              </span>
              Coming Soon
            </motion.div>

            {/* Icon halo */}
            {Icon && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="mt-8 sm:mt-10 w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 flex items-center justify-center"
              >
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-kind-lime" />
              </motion.div>
            )}

            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-8 sm:mt-10"
            >
              <Eyebrow dark>{eyebrow}</Eyebrow>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="apple-title mt-4 font-heading max-w-3xl text-white"
            >
              {title}
            </motion.h1>

            {/* Tagline */}
            {tagline && (
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.35 }}
                className="apple-intro mt-6 font-heading text-kind-mint"
              >
                {tagline}
              </motion.p>
            )}

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="apple-lead mt-4 sm:mt-5 max-w-xl text-kind-sage"
            >
              {description}
            </motion.p>

            {/* CTA → Canvas page */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-9 sm:mt-10"
            >
              <KindButton to={ctaTo} variant="lime">
                {ctaText}
              </KindButton>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.65 }}
              className="mt-6 text-sm text-kind-sage"
            >
              We're crafting something special — explore our handcrafted canvas art in the meantime.
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ComingSoon;
