import { motion } from 'framer-motion';
import { handleImageError } from '../../utils/imageOptimizer';
import WebflowButton from '../ui/WebflowButton';
import customizeImg from '../../assets/image/home-page/customize.jpeg';

const HERO_IMAGE = customizeImg;

const steps = [
  { num: 1, label: 'Upload image' },
  { num: 2, label: 'Choose size' },
  { num: 3, label: 'Add text & style' },
  { num: 4, label: 'Delivered in 5-7 days' },
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
      <div className="max-w-7xl mx-auto px-5">
        <div className="grid grid-cols-1 md:grid-cols-2 md:min-h-[500px] lg:min-h-[550px]">
          {/* ── Left Column: Text Content ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center pl-0 pr-5 sm:pr-8 md:pr-6 lg:pr-10 xl:pr-14 py-8 sm:py-10 md:py-12"
          >
            {/* Badge */}
            {showTitle && (
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <span className="bg-secondary text-white text-[10px] sm:text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  NEW
                </span>
                <span className="text-secondary font-bold text-xs sm:text-sm uppercase tracking-[0.15em]">
                  Customize Canvas
                </span>
              </div>
            )}

            {/* Heading */}
            <h2 className="font-heading text-3xl sm:text-4xl md:text-[2.5rem] lg:text-[3.4rem] xl:text-6xl font-bold leading-[1.1] tracking-tight">
              <span className="text-secondary">Your memory.</span>
              <br />
              <span className="text-accent">Gallery quality.</span>
              <br />
              <span className="text-secondary">Your wall.</span>
            </h2>

            {/* Description */}
            <p className="text-gray-500 font-body text-sm sm:text-base lg:text-lg mt-4 sm:mt-6 max-w-sm md:max-w-xs lg:max-w-md leading-relaxed">
              Upload any photograph — a family portrait, a travel memory, a milestone moment — and we transform it into a premium gallery-wrapped canvas delivered to your door.
            </p>

            {/* Steps */}
            <div className="mt-6 sm:mt-8 md:mt-8 lg:mt-10 w-full max-w-sm sm:max-w-md md:max-w-xs lg:max-w-md">
              <div className="relative flex justify-between items-end">
                {/* Single connector line at circle-center height */}
                <div className="absolute left-6 right-6 sm:left-8 sm:right-8 bottom-3.5 sm:bottom-4 h-0.5 bg-secondary/30" />
                {steps.map((step) => (
                  <div key={step.num} className="relative z-10 flex flex-col items-center gap-1.5 sm:gap-2 w-14 sm:w-16">
                    <span className="text-gray-600 text-[10px] sm:text-xs font-medium leading-tight text-center">
                      {step.label}
                    </span>
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                      {step.num}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            {showCTA && (
              <div className="mt-6 sm:mt-8 lg:mt-10">
                <WebflowButton to="/customize-canvas">
                  Create Your Canvas
                </WebflowButton>
              </div>
            )}
          </motion.div>

          {/* ── Right Column: Hero Image ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative min-h-[220px] sm:min-h-[300px] md:min-h-0 overflow-hidden rounded-2xl"
          >
            <img
              src={HERO_IMAGE}
              alt="Premium custom canvas print displayed in a stylish modern living room"
              className="w-full h-full object-cover md:absolute md:inset-0 rounded-2xl"
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
