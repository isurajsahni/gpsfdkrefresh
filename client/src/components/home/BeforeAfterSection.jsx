import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { handleImageError } from '../../utils/imageOptimizer';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80';

const steps = [
  { num: 1, label: 'Upload image' },
  { num: 2, label: 'Choose size' },
  { num: 3, label: 'Add text & style' },
  { num: 4, label: 'Delivered in 5 days' },
];

const BeforeAfterSection = ({ showCTA = true, showTitle = true, compact = false }) => {
  if (compact) {
    return (
      <div className="w-full py-6">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative rounded-2xl overflow-hidden shadow-xl aspect-[16/9]">
            <img
              src={HERO_IMAGE}
              alt="Custom canvas print in a modern living room"
              className="w-full h-full object-cover"
              onError={handleImageError}
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 sm:bottom-6 sm:left-6">
              <span className="bg-secondary text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                NEW
              </span>
              <p className="text-white font-heading text-lg sm:text-2xl font-bold mt-2 drop-shadow-lg">
                Your memory. <span className="text-accent">Gallery quality.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[500px] lg:min-h-[600px]">
          {/* ── Left Column: Text Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-12 lg:py-16"
          >
            {/* Badge */}
            {showTitle && (
              <div className="flex items-center gap-3 mb-6">
                <span className="bg-secondary text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  NEW
                </span>
                <span className="text-secondary font-bold text-xs sm:text-sm uppercase tracking-[0.15em]">
                  Customize Canvas
                </span>
              </div>
            )}

            {/* Heading */}
            <h2 className="font-heading text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="text-secondary">Your memory.</span>
              <br />
              <span className="text-accent">Gallery quality.</span>
              <br />
              <span className="text-secondary">Your wall.</span>
            </h2>

            {/* Description */}
            <p className="text-gray-500 font-body text-sm sm:text-base lg:text-lg mt-6 max-w-md leading-relaxed">
              Upload any photograph — a family portrait, a travel memory, a milestone moment — and we transform it into a premium gallery-wrapped canvas delivered to your door.
            </p>

            {/* Steps */}
            <div className="mt-8 sm:mt-10">
              {/* Labels */}
              <div className="flex items-start justify-between max-w-md">
                {steps.map((step) => (
                  <div key={step.num} className="flex flex-col items-center text-center w-1/4 px-1">
                    <span className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Numbered circles + lines */}
              <div className="flex items-center max-w-md mt-3">
                {steps.map((step, i) => (
                  <div key={step.num} className="flex items-center flex-1 last:flex-none">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                      {step.num}
                    </div>
                    {i < steps.length - 1 && (
                      <div className="flex-1 h-0.5 bg-secondary/30 mx-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {showCTA && (
              <div className="mt-8 sm:mt-10">
                <Link
                  to="/customize-canvas"
                  className="inline-flex items-center gap-2 bg-accent hover:bg-accent-dark text-white font-heading font-bold py-4 px-8 sm:px-10 rounded-full shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300 text-sm sm:text-base"
                >
                  Create Your Canvas
                  <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 13L13 3M13 3H5M13 3V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>
            )}
          </motion.div>

          {/* ── Right Column: Hero Image ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-0"
          >
            <img
              src={HERO_IMAGE}
              alt="Premium custom canvas print displayed in a stylish modern living room"
              className="w-full h-full object-cover lg:absolute lg:inset-0"
              onError={handleImageError}
              loading="lazy"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSection;
